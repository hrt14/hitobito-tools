# Vercel から Cloudflare Workers への移行

hitobito-tools(hitobito.jp と各サブドメイン)を Vercel から Cloudflare Workers へ移す手順。
Next.js はそのまま使い、[OpenNext for Cloudflare](https://opennext.js.org/cloudflare) で Worker に変換して配信する。

## 対象ホスト

1つの Worker `hitobito-tools` がすべて配信し、ホスト名ごとの振り分けは `middleware.ts` が行う(Vercel 時代と同じ)。

| ホスト | 中身 |
| --- | --- |
| hitobito.jp / www.hitobito.jp | ポータル。`/contact` と `/api/contact` は contact Worker へ rewrite |
| tools.hitobito.jp | `/tools` |
| levelup.hitobito.jp | `/levelup` |
| life1.hitobito.jp | `/life1` |
| drop.hitobito.jp | `/drop` |
| 2100.hitobito.jp | `/2100` |
| dc.hitobito.jp | `/ear-hub` |
| habit-planet.hitobito.jp | habit-planet Worker へ rewrite(下記の注意を参照) |

## リポジトリ側の変更

- `proxy.ts` を `middleware.ts`(Edge ランタイム)に戻した。Next 16 の `proxy.ts` は Node.js ランタイム固定で、OpenNext Cloudflare では実験的扱いのため。Next 16 は `middleware` を非推奨と警告するが動作する。Vercel でもそのまま動く。
- Next を 16.4.3 に更新(OpenNext Cloudflare 1.20 の要件が `next >=16.4.1`)。
- `wrangler.jsonc` / `open-next.config.ts` / `next.config.ts` を追加。ISR を使っていないので、生成済みページは静的アセットから返す(R2/KV 不要)。
- `npm run cf:preview` でローカル(wrangler)確認、`npm run cf:deploy` で公開。
- `.github/workflows/cloudflare-deploy.yml`: 手動実行で `*.workers.dev` へ公開する。本番ドメインは触らない。

ビルド後の Worker は gzip で約 1.6 MB(Free プランの上限 3 MB 以内)。

## 手順

### 1. 準備(ユーザー作業)

1. Cloudflare で API トークンを作る(テンプレート「Edit Cloudflare Workers」)。
2. GitHub の Actions secrets に `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を登録する。
3. Vercel で使っていたビルド時の値を GitHub の Actions variables に登録する:
   `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_LIFE1_GA_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`,
   `NEXT_PUBLIC_GOOGLE_PICKER_API_KEY`, `LIFE1_GOOGLE_SITE_VERIFICATION`。
4. 初回デプロイ後、Cloudflare ダッシュボードの Worker `hitobito-tools` > Settings > Variables and Secrets に実行時の値を登録する:
   `ANTHROPIC_API_KEY`(Secret), `EARHUB_ACCESS_CODE`(Secret), 必要なら `EARHUB_DAILY_CHAR_BUDGET`, `EARHUB_MODEL`。
5. Google OAuth クライアント(DIGIL CLOUD の Drive 連携)を使うなら、承認済み JavaScript 生成元に変更はない(ドメインは同じ)。workers.dev で試すときだけ一時的に追加が必要。

### 2. workers.dev で確認(本番に影響なし)

Actions の「Cloudflare deploy」を main で実行(confirm に `deploy`)。
`https://hitobito-tools.<account>.workers.dev` で `/`, `/tools`, `/levelup`, `/life1`, `/drop`, `/2100`, `/ear-hub/translate`, `/ear-hub/minutes` を確認する。

### 3. 本番ドメインの切り替え(実施前にユーザー確認)

Cloudflare ダッシュボードで Worker `hitobito-tools` > Settings > Domains & Routes > Add > Custom Domain。
既に Vercel 向けの DNS レコード(CNAME `cname.vercel-dns.com` や A `76.76.21.21`)があると追加できないので、そのホストのレコードを削除してから追加する。

影響の小さい順に1つずつ切り替え、都度表示を確認する:

1. drop.hitobito.jp
2. 2100.hitobito.jp / life1.hitobito.jp / tools.hitobito.jp / levelup.hitobito.jp
3. dc.hitobito.jp(翻訳・議事録の API と Google ログインを確認)
4. habit-planet.hitobito.jp(下記)
5. hitobito.jp / www.hitobito.jp(お問い合わせフォーム送信まで確認)

切り替え前に、元の DNS レコードの値を控えておく。

### Habit Planet

habit-planet.hitobito.jp は、hitobito-tools 経由で rewrite するより、habit-planet Worker 自体に Custom Domain として割り当てる方が素直(余計な1段がなくなる)。その場合 `middleware.ts` の Habit Planet 分岐は不要になる。

### 4. 後片付け

全ホストで1週間ほど問題がなければ:

- Vercel プロジェクトからドメインを外し、プロジェクトを停止する。
- `vercel-production.yml` / `vercel-preview.yml` / `digil-cloud-translate-preview.yml` と `habit-planet-proxy/` を削除し、dc の自動デプロイを Cloudflare 側へ移す。
- README と AGENTS.md のデプロイ手順を Cloudflare に書き換える。

## 戻し方

切り替えたホストの Custom Domain を Worker から外し、控えておいた Vercel 向け DNS レコードを戻す。Vercel プロジェクトは後片付けまで残しておくので、すぐ戻せる。

## 注意

- Workers Free プランは 1 リクエストあたり CPU 10ms。Next のページ描画は超えることがあり、超えると 1102 エラーになる。安定運用には Workers Paid(月 5 ドル、CPU 上限 30 秒)を推奨。
- `/api/ear-hub` のレート制限はインスタンスごとのメモリなので、Vercel と同じく厳密ではない。
- middleware から同一アカウントの `*.workers.dev` へ rewrite するため `global_fetch_strictly_public` フラグを付けている。
