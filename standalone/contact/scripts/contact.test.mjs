import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { validatePayload, verifyTurnstile, sendNotification, deliverOne } from '../worker/index.mjs';

const envBase = { TURNSTILE_SITE_KEY: '1x00000000000000000000AA', TURNSTILE_SECRET: 'fake', IP_HASH_SECRET: 'test-pepper', RESEND_API_KEY: 'test-key', CONTACT_TO: 'operator@example.org', CONTACT_FROM: 'Hitobito <notify@example.org>', PUBLIC_ORIGINS: 'https://hitobito.jp,https://contact.hitobito.jp' };
const input = { app: 'habit-planet', category: 'billing', name: '山田', email: 'reply@example.com', subject: 'お支払いの相談', message: '支払いについて問い合わせたいです。', token: 'dummy-turnstile' };

function makeDb() {
  const inquiries = new Map();
  const limits = new Map();
  return {
    inquiries,
    prepare(sql) {
      return { bind(...args) {
        return {
          async run() {
            if (sql.startsWith('INSERT INTO submission_limits')) {
              const key = `${args[0]}:${args[1]}`;
              limits.set(key, (limits.get(key) || 0) + 1);
              return { meta: { changes: 1 } };
            }
            if (sql.startsWith('INSERT INTO inquiries')) {
              const [id, app, category, name, email, subject, message, next_attempt_at, created_at, updated_at] = args;
              inquiries.set(id, { id, app, category, name, email, subject, message, next_attempt_at, created_at, updated_at, delivery_status: 'pending', attempts: 0, lease_until: null });
              return { meta: { changes: 1 } };
            }
            if (sql.startsWith("UPDATE inquiries SET delivery_status = 'sent'")) {
              const row = inquiries.get(args[2]); row.delivery_status = 'sent'; row.resend_email_id = args[0]; row.attempts++; return { meta: { changes: 1 } };
            }
            if (sql.startsWith('UPDATE inquiries SET delivery_status = ?')) {
              const row = inquiries.get(args[5]); row.delivery_status = args[0]; row.attempts = args[1]; row.next_attempt_at = args[2]; row.last_error = args[3]; row.lease_until = null; return { meta: { changes: 1 } };
            }
            if (sql.startsWith("UPDATE inquiries SET delivery_status = 'sending'")) {
              const row = inquiries.get(args[2]);
              if (!row || !['pending', 'retry', 'sending'].includes(row.delivery_status)) return { meta: { changes: 0 } };
              row.delivery_status = 'sending'; row.lease_until = args[0]; return { meta: { changes: 1 } };
            }
            if (sql.startsWith('DELETE FROM submission_limits')) { limits.clear(); return { meta: { changes: 1 } }; }
            throw new Error(`Unexpected query: ${sql}`);
          },
          async first() {
            if (sql.startsWith('SELECT hits')) return { hits: limits.get(`${args[0]}:${args[1]}`) || 0 };
            if (sql.startsWith('SELECT * FROM inquiries')) return inquiries.get(args[0]);
            throw new Error(`Unexpected query: ${sql}`);
          },
          async all() {
            if (sql.startsWith('SELECT id FROM inquiries')) return { results: [...inquiries.values()].filter((row) => ['pending','retry','sending'].includes(row.delivery_status)).map(({ id }) => ({ id })) };
            throw new Error(`Unexpected query: ${sql}`);
          },
        };
      } };
    },
  };
}

function post(data = input, origin = 'https://hitobito.jp') {
  return new Request('https://hitobito.jp/api/contact', { method: 'POST', headers: { 'content-type': 'application/json', origin, 'cf-connecting-ip': '203.0.113.10' }, body: JSON.stringify(data) });
}

test('validates required fields, app slug, category, size and token', () => {
  assert.equal(validatePayload(input).email, input.email);
  for (const patch of [{ app: '../secret' }, { category: 'unknown' }, { message: 'short' }, { token: '' }, { email: 'not-an-email' }, { subject: '' }]) {
    assert.equal(validatePayload({ ...input, ...patch }), null);
  }
});

test('form is rendered without secrets and includes Turnstile and CSP', async () => {
  const result = await worker.fetch(new Request('https://hitobito.jp/contact?app=habit-planet'), { ...envBase, DB: makeDb() });
  const html = await result.text();
  assert.equal(result.status, 200);
  assert.match(html, /habit-planet/);
  assert.match(html, /cf-turnstile/);
  assert.ok(!html.includes(envBase.TURNSTILE_SECRET));
  assert.match(result.headers.get('content-security-policy'), /frame-ancestors 'none'/);
});

test('incomplete configuration fails closed', async () => {
  const result = await worker.fetch(post(), { ...envBase, DB: makeDb(), RESEND_API_KEY: '' });
  assert.equal(result.status, 503);
});

test('cross-origin requests are rejected before DB or Turnstile calls', async () => {
  const result = await worker.fetch(post(input, 'https://attacker.example'), { ...envBase, DB: makeDb() });
  assert.equal(result.status, 403);
});

test('Turnstile checks action and hostname, not just success', async () => {
  const fetcher = async (_url, options) => {
    assert.equal(options.body.get('secret'), 'fake');
    return new Response(JSON.stringify({ success: true, hostname: 'hitobito.jp', action: 'hitobito_contact' }), { status: 200 });
  };
  assert.equal(await verifyTurnstile('token', envBase, fetcher), true);
  assert.equal(await verifyTurnstile('token', envBase, async () => new Response(JSON.stringify({ success: true, hostname: 'attacker.example', action: 'hitobito_contact' }))), false);
  assert.equal(await verifyTurnstile('token', envBase, async () => new Response(JSON.stringify({ success: true, hostname: 'hitobito.jp', action: 'login' }))), false);
});

test('notification uses verified sender, Reply-To, stable idempotency key and redacts secrets', async () => {
  const item = { id: 'test-id', ...input };
  const sent = await sendNotification(item, envBase, async (_url, options) => {
    assert.equal(options.headers['Idempotency-Key'], 'hitobito-contact/test-id');
    const body = JSON.parse(options.body);
    assert.equal(body.reply_to, input.email);
    assert.equal(body.to[0], envBase.CONTACT_TO);
    assert.equal(body.from, envBase.CONTACT_FROM);
    assert.ok(!options.body.includes(envBase.RESEND_API_KEY));
    return new Response(JSON.stringify({ id: 'email-id' }), { status: 200 });
  });
  assert.deepEqual(sent, { ok: true, emailId: 'email-id' });
});

test('a successful POST persists before asynchronous notification and returns a reference', async () => {
  const db = makeDb(); const tasks = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => new Response(JSON.stringify(url.includes('siteverify') ? { success: true, action: 'hitobito_contact', hostname: 'hitobito.jp' } : { id: 'email-id' }), { status: 200 });
  try {
    const res = await worker.fetch(post(), { ...envBase, DB: db }, { waitUntil(task) { tasks.push(task); } });
    assert.equal(res.status, 202);
    const { id, status } = await res.json();
    assert.equal(status, 'accepted'); assert.ok(id);
    assert.ok(db.inquiries.has(id));
    await Promise.all(tasks);
    assert.equal(db.inquiries.get(id).delivery_status, 'sent');
  } finally { globalThis.fetch = original; }
});

test('failed email stays in D1 and is retried, never silently discarded', async () => {
  const db = makeDb(); const now = Date.now();
  db.inquiries.set('retry-id', { id: 'retry-id', ...input, delivery_status: 'pending', attempts: 0, next_attempt_at: now });
  const ok = await deliverOne(db, 'retry-id', envBase, async () => new Response('{"message":"temporary"}', { status: 503 }));
  assert.equal(ok, false);
  assert.equal(db.inquiries.get('retry-id').delivery_status, 'retry');
  assert.equal(db.inquiries.get('retry-id').attempts, 1);
});
