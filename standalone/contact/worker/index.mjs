const jsonHeaders = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const categories = { general: '一般のお問い合わせ', bug: '不具合・ご意見', billing: 'お支払い・返金', deletion: 'データ削除', business: 'お仕事・その他' };
const retrySeconds = [60, 300, 900, 3600, 10800, 21600];
const required = ['DB', 'TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET', 'IP_HASH_SECRET', 'RESEND_API_KEY', 'CONTACT_TO', 'CONTACT_FROM', 'PUBLIC_ORIGINS'];

function response(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...extra } });
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}
function configured(env) {
  return required.every((name) => Boolean(env[name])) && /^[a-zA-Z0-9_-]{8,120}$/.test(env.TURNSTILE_SITE_KEY);
}
function allowedOrigins(env) {
  return (env.PUBLIC_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
}
function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}
export function validatePayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const app = typeof data.app === 'string' ? data.app.trim().toLowerCase() : '';
  const category = data.category;
  const subject = typeof data.subject === 'string' ? data.subject.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const token = data.token;
  if (name.length < 1 || name.length > 80 || !validEmail(email) || !categories[category]) return null;
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(app) || subject.length < 3 || subject.length > 120 || message.length < 10 || message.length > 4000) return null;
  if (typeof token !== 'string' || token.length < 1 || token.length > 2048) return null;
  return { name, email, app, category, subject, message, token, honeypot: typeof data.website === 'string' ? data.website : '' };
}
function formHtml(env, app) {
  const sitekey = escapeHtml(env.TURNSTILE_SITE_KEY);
  const safeApp = escapeHtml(app);
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>お問い合わせ | hitobito</title><meta name="description" content="hitobitoのアプリやサービスに関するお問い合わせ"><style nonce="${nonce}">
  :root{color-scheme:light;font-family:system-ui,-apple-system,"Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif;color:#142237;background:#f4f7fa}*{box-sizing:border-box}body{margin:0}main{max-width:690px;margin:0 auto;padding:44px 20px 80px}header{display:flex;justify-content:space-between;align-items:center;margin-bottom:36px}a{color:#225d9f}header a{font-size:14px;text-decoration:none}header strong{font-size:24px;letter-spacing:-1px}article{border:1px solid #d9e2ee;border-radius:20px;background:white;padding:30px;box-shadow:0 8px 35px #10213a09}h1{font-size:27px;margin:0 0 12px}p{line-height:1.8;color:#526174}label{display:block;font-weight:650;font-size:14px;margin:21px 0 8px}input,select,textarea{font:inherit;width:100%;padding:13px 12px;border:1px solid #b9c5d4;border-radius:9px;background:white;color:#142237}textarea{min-height:150px;resize:vertical}input:focus,select:focus,textarea:focus{outline:2px solid #286bb5;outline-offset:1px}.turnstile{margin-top:26px;min-height:66px}button{font:inherit;width:100%;padding:16px;border:0;border-radius:10px;color:white;background:#163e70;font-weight:700;margin-top:22px;cursor:pointer}button:disabled{opacity:.5;cursor:wait}.note{font-size:12px}.hp{position:absolute;left:-9999px}#result{margin-top:18px;white-space:pre-wrap}#result[data-kind="success"]{color:#125b37}#result[data-kind="error"]{color:#a82020}@media(max-width:550px){main{padding:24px 14px 50px}article{padding:22px 17px}}
  </style><script nonce="${nonce}" src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script></head><body><main><header><strong>hitobito<span style="color:#3b80c4">.</span></strong><a href="https://hitobito.jp/">ポータルへ戻る ↗</a></header><article><h1>お問い合わせ</h1><p>アプリの不具合、ご意見、お支払い・返金、データ削除などはこちらからお送りください。運営者が内容を確認し、必要に応じて返信します。</p><form id="contact" novalidate><label for="app">対象アプリ・サービス</label><input id="app" name="app" maxlength="40" pattern="[a-zA-Z0-9-]+" value="${safeApp}" placeholder="例：habit-planet" required><label for="category">お問い合わせの種類</label><select id="category" name="category">${Object.entries(categories).map(([key, text]) => `<option value="${key}">${text}</option>`).join('')}</select><label for="name">お名前</label><input id="name" name="name" autocomplete="name" maxlength="80" required><label for="email">返信先メールアドレス</label><input id="email" name="email" type="email" autocomplete="email" maxlength="254" required><label for="subject">件名</label><input id="subject" name="subject" maxlength="120" minlength="3" required><label for="message">お問い合わせ内容</label><textarea id="message" name="message" maxlength="4000" minlength="10" required></textarea><div class="hp" aria-hidden="true"><label for="website">この欄は空のままにしてください</label><input id="website" name="website" tabindex="-1" autocomplete="off"></div><div class="turnstile cf-turnstile" data-sitekey="${sitekey}" data-action="hitobito_contact"></div><button id="send" type="submit">問い合わせを送信</button><p id="result" role="status" aria-live="polite"></p></form><p class="note">パスワード・カード番号・認証コードは送信しないでください。データ削除のご相談のみでは有料契約の自動更新は停止しません。解約は各アプリの管理画面で行ってください。</p></article></main><script nonce="${nonce}">
  const form=document.querySelector('#contact'),button=document.querySelector('#send'),result=document.querySelector('#result');form.addEventListener('submit',async(event)=>{event.preventDefault();if(!form.reportValidity())return;const token=form.querySelector('[name="cf-turnstile-response"]')?.value||'';if(!token){result.textContent='認証が完了するまでお待ちください。';result.dataset.kind='error';return;}button.disabled=true;result.textContent='送信しています…';result.dataset.kind='';const data=Object.fromEntries(new FormData(form));data.token=token;try{const resp=await fetch('/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const body=await resp.json();if(!resp.ok)throw new Error(body.error||'送信に失敗しました。時間をおいて再度お試しください。');result.textContent='お問い合わせを受け付けました。受付番号：'+body.id+'\n通知メールが遅れる場合も、受付内容は保存されています。';result.dataset.kind='success';form.reset();form.elements.app.value=${JSON.stringify(app)};}catch(error){result.textContent=error.message||'送信に失敗しました。';result.dataset.kind='error';}finally{button.disabled=false;window.turnstile?.reset();}});
  </script></body></html>`;
  const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'no-referrer', 'content-security-policy': `default-src 'none'; script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com; style-src 'self' 'nonce-${nonce}' 'unsafe-inline'; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'` };
  return new Response(html, { headers });
}
async function readSmallJson(request) {
  if (!request.body) throw new Error('empty');
  const reader = request.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16000) throw new Error('too_large');
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
async function takeLimit(db, bucket, limit, now) {
  const start = Math.floor(now / 3600000) * 3600000;
  await db.prepare('INSERT INTO submission_limits (bucket, window_start, hits) VALUES (?, ?, 1) ON CONFLICT(bucket, window_start) DO UPDATE SET hits = hits + 1').bind(bucket, start).run();
  const row = await db.prepare('SELECT hits FROM submission_limits WHERE bucket = ? AND window_start = ?').bind(bucket, start).first();
  return Number(row?.hits || 0) <= limit;
}
export async function verifyTurnstile(token, env, fetcher = fetch) {
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
  const result = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form, signal: AbortSignal.timeout(8000) });
  if (!result.ok) return false;
  const data = await result.json();
  const hostnames = allowedOrigins(env).map((origin) => new URL(origin).hostname);
  return data.success === true && data.action === 'hitobito_contact' && hostnames.includes(data.hostname);
}
export async function sendNotification(item, env, fetcher = fetch) {
  const text = `受付番号: ${item.id}\n対象: ${item.app}\n種類: ${categories[item.category]}\nお名前: ${item.name}\n返信先: ${item.email}\n件名: ${item.subject}\n\n${item.message}`;
  const res = await fetcher('https://api.resend.com/emails', {
    method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'Idempotency-Key': `hitobito-contact/${item.id}` },
    body: JSON.stringify({ from: env.CONTACT_FROM, to: [env.CONTACT_TO], reply_to: item.email, subject: `[hitobito / ${item.app} / ${categories[item.category]}] ${item.subject}`, text }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return { ok: false, reason: `http_${res.status}` };
  const data = await res.json();
  if (typeof data.id !== 'string' || !data.id) return { ok: false, reason: 'missing_email_id' };
  return { ok: true, emailId: data.id };
}
export async function deliverOne(db, id, env, fetcher = fetch) {
  const now = Date.now();
  const lock = await db.prepare("UPDATE inquiries SET delivery_status = 'sending', lease_until = ?, updated_at = ? WHERE id = ? AND ((delivery_status IN ('pending','retry') AND next_attempt_at <= ?) OR (delivery_status = 'sending' AND lease_until <= ?))")
    .bind(now + 30000, now, id, now, now).run();
  if (Number(lock.meta?.changes || 0) !== 1) return false;
  const item = await db.prepare('SELECT * FROM inquiries WHERE id = ?').bind(id).first();
  if (!item) return false;
  let result;
  try { result = await sendNotification(item, env, fetcher); }
  catch { result = { ok: false, reason: 'delivery_exception' }; }
  if (result.ok) {
    await db.prepare("UPDATE inquiries SET delivery_status = 'sent', resend_email_id = ?, attempts = attempts + 1, last_error = NULL, lease_until = NULL, updated_at = ? WHERE id = ? AND delivery_status = 'sending'")
      .bind(result.emailId, Date.now(), id).run();
  } else {
    const attempts = Number(item.attempts || 0) + 1;
    const next = Date.now() + retrySeconds[Math.min(attempts - 1, retrySeconds.length - 1)] * 1000;
    await db.prepare("UPDATE inquiries SET delivery_status = ?, attempts = ?, next_attempt_at = ?, last_error = ?, lease_until = NULL, updated_at = ? WHERE id = ? AND delivery_status = 'sending'")
      .bind(attempts >= 6 ? 'failed' : 'retry', attempts, next, result.reason, Date.now(), id).run();
    console.warn('contact delivery failed', id, result.reason);
  }
  return Boolean(result.ok);
}
async function submit(request, env, ctx) {
  if (!configured(env)) return response({ error: '現在、お問い合わせを受け付けられません。' }, 503);
  const origin = request.headers.get('origin');
  if (!origin || !allowedOrigins(env).includes(origin)) return response({ error: '送信元を確認できません。' }, 403);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return response({ error: '送信形式が正しくありません。' }, 415);
  let data;
  try { data = validatePayload(await readSmallJson(request)); }
  catch { return response({ error: '入力データが大きすぎるか、形式が正しくありません。' }, 400); }
  if (!data) return response({ error: '入力内容を確認してください。' }, 400);
  if (data.honeypot) return response({ error: '送信できませんでした。' }, 400);
  const now = Date.now();
  try {
    const ip = request.headers.get('cf-connecting-ip') || 'unavailable';
    const ipKey = await sha256(`${env.IP_HASH_SECRET}:ip:${ip}`);
    const emailKey = await sha256(`${env.IP_HASH_SECRET}:email:${data.email}`);
    const [withinIpLimit, withinEmailLimit] = await Promise.all([
      takeLimit(env.DB, `ip:${ipKey}`, 120, now),
      takeLimit(env.DB, `email:${emailKey}`, 3, now),
    ]);
    if (!withinIpLimit || !withinEmailLimit) return response({ error: '送信回数の上限に達しました。時間をおいてお試しください。' }, 429);
  } catch { return response({ error: '現在、送信できません。時間をおいてお試しください。' }, 503); }
  let verified = false;
  try { verified = await verifyTurnstile(data.token, env); } catch { /* challenge service temporarily unavailable */ }
  if (!verified) return response({ error: '認証を確認できませんでした。認証をやり直してください。' }, 400);
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare("INSERT INTO inquiries (id, app, category, name, email, subject, message, delivery_status, attempts, next_attempt_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?)")
      .bind(id, data.app, data.category, data.name, data.email, data.subject, data.message, now, now, now).run();
  } catch { return response({ error: '保存に失敗しました。しばらくして再度お試しください。' }, 503); }
  if (ctx?.waitUntil) ctx.waitUntil(deliverOne(env.DB, id, env).catch(() => console.error('contact delivery task failed', id)));
  return response({ id, status: 'accepted' }, 202);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') return response({ status: configured(env) ? 'ready' : 'not_configured' }, configured(env) ? 200 : 503);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/contact')) {
      if (!configured(env)) return new Response('お問い合わせ窓口は準備中です。', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
      const app = /^[a-z0-9][a-z0-9-]{0,39}$/.test(url.searchParams.get('app') || '') ? url.searchParams.get('app') : 'hitobito';
      return formHtml(env, app);
    }
    if (url.pathname === '/api/contact' && request.method === 'POST') return submit(request, env, ctx);
    return response({ error: 'Not Found' }, 404);
  },
  async scheduled(_event, env, ctx) {
    if (!configured(env)) throw new Error('contact service not configured');
    const now = Date.now();
    await env.DB.prepare('DELETE FROM submission_limits WHERE window_start < ?').bind(now - 7200000).run();
    const rows = await env.DB.prepare("SELECT id FROM inquiries WHERE (delivery_status IN ('pending','retry') AND next_attempt_at <= ?) OR (delivery_status = 'sending' AND lease_until <= ?) ORDER BY created_at ASC LIMIT 20")
      .bind(now, now).all();
    for (const row of rows.results || []) ctx.waitUntil(deliverOne(env.DB, row.id, env));
  },
};
