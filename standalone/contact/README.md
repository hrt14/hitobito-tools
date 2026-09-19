# hitobito 共通お問い合わせ（Cloudflare Worker + 専用D1 + Resend）

本サービスは `hitobito.jp/contact?app=habit-planet` および、Vercel側で独立ドメインを追加できた場合の `contact.hitobito.jp/?app=habit-planet` から共通利用する。WordPress・まんがびとのメール転送・Supabase・Habit Planetの課金用D1は使わない。**本番公開は管理画面の設定とE2E実受信が終わるまで未完了。**

## 仕組み・失敗時の挙動

1. フォーム→Workerの同一オリジンPOST→Origin・入力・ハニーポット・SHA-256化したIP/メールの時間上限・Turnstile Siteverify（action/hostnameも検証）。
2. 問い合わせ本文と受付番号を専用D1に保存。保存に失敗した場合は成功を返さない。メール送信はD1保存後のみ開始し、メールが失敗しても受付データは残る。
3. Resendの認証済み送信元ドメインから、運営者のGmailに直接通知。返信先は問い合わせ者のメールアドレス（Reply-To）。ResendのメールID・送信試行数・失敗種別をD1に記録。5分ごとのcronで最大6回再試行し、失敗継続なら `failed` に残す。Resendの `Idempotency-Key` は受付番号で固定。
4. 本文・氏名・メールはD1および通知先にのみ保存。IPは生値を保存せず、秘密のpepper付きハッシュだけ時間上限テーブルに記録し2時間後に削除。**PIIの保持期間と削除手順は公開前に運営者が確定すること。**

**注意**：ResendのAPI `200` は配信サービスへの受付であり、Gmail到達の証明ではない。公開前に実際のGmail受信・迷惑メール判定・返信をE2E確認する。Cloudflare cronが止まった場合は `pending/retry/failed` を定期的に確認する。テスト時に実顧客のデータは触らない。

## 管理画面が必要な設定（Claudeブラウザ操作へ委託する場合）

- Cloudflare：**新規**D1 `hitobito-contact` を作成。既存の Habit Planet D1 は絶対に変更しない。作成後、新DBのUUIDを `wrangler.jsonc` の `database_id` と差し替える。
- Cloudflare Turnstile：新しいフォーム用Widgetを作り、許可ホスト `hitobito.jp` と `contact.hitobito.jp` を設定。公開sitekeyを `wrangler.jsonc` の `TURNSTILE_SITE_KEY` に、秘密secretをWorker secret `TURNSTILE_SECRET` に設定。workers.devのテスト用ホストを使うなら適切なテストWidget/公開オリジンを別途用意し、本番のOrigin制限を緩めない。
- Resend：利用するメール送信専用サブドメイン（候補 `notify.hitobito.jp`）を認証し、提示されたSPF/DKIM等のDNSだけを確認して反映。既存のMX/SPF/DKIM/DMARCや他サービスのDNSを上書きしない。メールの送信ドメイン承認とDNS追加・有料契約が必要なら先に運営者承認を取る。
- Worker secrets：`RESEND_API_KEY`、`TURNSTILE_SECRET`、`IP_HASH_SECRET`（十分長いランダム値）、`CONTACT_TO`（ユーザーが指定する既存Gmail）、`CONTACT_FROM`（Resend認証済みの差出人表記・アドレス）。**キーとGmailアドレスをコード・PR・チャットに記載しない。** `CONTACT_TO` をSecretで設定する。
- URL：既存 `hitobito-tools` のVercelプロジェクトに独立ドメイン `contact.hitobito.jp` を追加可能ならDNS競合がないことを確認して利用。難しい場合はすでに設定済みの `hitobito.jp/contact` だけで先に公開。既存本番ドメインの割当・Git Integration・LEVEL UP関連は変更しない。

## 初回の安全な公開手順

1. ブランチで `node --test standalone/contact/scripts/contact.test.mjs`、`node --check standalone/contact/worker/index.mjs`、`npm run lint` と `npm run build`（root）を確認する。
2. `wrangler.jsonc` のプレースホルダーが残っていないことを確認する。D1 migration `npx wrangler d1 migrations apply hitobito-contact --remote --config wrangler.jsonc` を**新DBだけ**に適用する。対象DB IDを実行直前に照合する。
3. Cloudflare Worker `npx wrangler deploy --config wrangler.jsonc`。専用 Worker の `/health` が `ready`、`GET /` にフォームが表示され、認証のない API への直接POSTが拒否されることを確認する。
4. `hitobito-tools` のVercel Git IntegrationはOFF。Vercel MCP等でこのブランチのPreviewを明示デプロイし、`/contact?app=habit-planet` と `/api/contact` のrewriteを確認する。`contact.hitobito.jp` を使う場合はドメイン割当も別途確認。Preview用にTurnstileの許可ホストを新規設定するか本番E2Eに進むまで、無理にPreviewから送信しない。
5. 本番反映はドメインと動作を確認のうえ明示的に実施。新フォームから**1件だけ**疎通試験を行い、受付番号のD1保存 → Resend送信ID → 実Gmail受信（迷惑メールも確認）→ 返信動作の4点を検証する。失敗時は別途DBレコードを確認して修正、問い合わせ受付を誤って成功と表示しない。テスト後に他のアプリからのリンクを切り替える。

## 運用で確認するD1クエリ（管理権限のみ、結果を公開しない）

```sql
SELECT id, app, category, delivery_status, attempts, last_error, created_at
FROM inquiries ORDER BY created_at DESC LIMIT 20;

SELECT id, delivery_status, attempts, last_error FROM inquiries
WHERE delivery_status IN ('pending','retry','failed') ORDER BY created_at DESC;
```

失敗が残る場合、原因を修正してから運営者の判断で対象行のみ再送対象に戻す。無条件に全件を再送しない。個人情報削除では D1と通知メールの両方を対象に含め、法令上必要な記録と申請者の要望を確認してから処理する。
