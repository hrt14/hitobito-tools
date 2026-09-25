# hitobito 整理ロードマップ

更新日: 2026-09-25

現状の散らかりを、本番を壊さずに段階的に片付けるための計画。各サービスの所在の正本は [`registry/products.json`](../registry/products.json)。

## 目指す形

| repo | 持つもの |
| --- | --- |
| `hitobito-tools` | `hitobito.jp` ポータル、`tools.hitobito.jp`、リンク集 `/links`、サービス台帳 `registry/`、マーケティング共通キット `marketing/`、hitobito.jp 配下の小さなツール（LIFE +1、2100、Digil Cloud） |
| `hitobito-games` | PLAY（`play.hitobito.jp`）と LEVEL UP（`levelup.hitobito.jp`）の全ゲーム |
| サービス別 repo | 課金・ログイン・独自データを持つ独立サービス（`habit-planet`、`habit-egg`、`chinese-instant-composition`、`working-planet`、`hitobito-support` など） |

判断基準：**課金・認証・独自DBを持つものは独立 repo、それ以外は用途（Tools / Games）で集約**。

## 現状の問題

1. **Habit Planet のソースが GitHub に無い。** `habit-planet.hitobito.jp` は `proxy.ts` と `habit-planet-proxy/vercel.json` が Worker（workers.dev）へ中継しているだけ。課金用 D1 を持つ有料サービスなのに、コードの履歴もレビューも無い状態。
2. **LEVEL UP が2か所にある。** hitobito-games（Firebase、現行）と、このリポジトリの `app/levelup/**`＋直下の互換エントリ（`hard-request`、`unfair-blame`、`self-management`、`ryoma-big-picture`、`life-stats`、`start`、`maa-iika`）。
3. **お問い合わせが2か所にある。** `standalone/contact`（移行元）と `hrt14/hitobito-support`（正本）。
4. **ゲームのドメインが2つある。** `games.hitobito.jp`（Vercel ポータル）と `play.hitobito.jp`（Cloudflare Pages）。リンクは play が多数派。
5. **サブドメインの書き方がそろっていない。** `habitegg`（ハイフン無し）と `habit-planet`・`working-planet`（ハイフン有り）。
6. **ゲームが hitobito-tools にある。** `drop.hitobito.jp`（大河の一滴）、`othello-puzzle`。
7. **`proxy.ts` がサブドメイン8種類の分岐を1ファイルで抱えている。**

## Phase 0 — 台帳と発信基盤（このPR）

- [x] `registry/products.json` と `npm run check:products`
- [x] `hitobito.jp/links`（台帳から生成、UTM自動付与）
- [x] `marketing/`（アカウント方針、ブランド、UTM、テンプレート、Habit Planet シリーズ）
- [ ] 本番デプロイして `https://hitobito.jp/links` を確認（`AGENTS.md` の Deployment 手順）
- [ ] SNS アカウント取得、`marketing/README.md` にハンドルを記入

## Phase 1 — Habit Planet を repo 化（最優先）

1. Worker を `wrangler deploy` したローカルのフォルダを探す（`wrangler.toml` / `wrangler.jsonc` に `name = "habit-planet"` があるもの）。
2. 見つからなければ、Cloudflare ダッシュボードの Workers & Pages → `habit-planet` → コード編集画面からソースをダウンロードする。バンドル済みで読みにくい場合も、まず**そのままの状態で**保存して履歴の起点にする。
3. private repo `hrt14/habit-planet` を作り、ソース・`wrangler` 設定（D1 の `database_id` を含む。秘密情報は `wrangler secret` 側にあり repo に入れない）・README を入れる。
4. `wrangler dev` で起動確認してから、以後のデプロイは repo から行う。
5. 台帳の `repo` を埋め、`tagline` と `marketing/series/habit-planet.md` の未記入欄を埋める。

本番の Worker・D1・ドメインはこの Phase では一切変更しない。

## Phase 2 — ドメイン方針の確定

- ゲームの入口を `play.hitobito.jp` に統一し、`games.hitobito.jp` は 308 で `play` へ転送する（ポータル・Tools・sitemap の `games` リンクも `play` に変更）。
- `habitegg.hitobito.jp` は現状維持（公開済みURLを変えるコストの方が大きい）。今後の新サービスはハイフン区切りの slug と同じサブドメインにする（台帳の `slug` ＝ サブドメイン）。

## Phase 3 — 重複の撤去

各項目とも「転送先で本番確認 → 転送を入れる → 1か月様子を見る → 旧コード削除」の順に進める。

| 対象 | 行き先 | 前提 |
| --- | --- | --- |
| `app/levelup/**`、直下の LEVEL UP 互換エントリ | `levelup.hitobito.jp`（hitobito-games / Firebase）へ 308 | Firebase 側に同じアプリがあることを1件ずつ確認 |
| `standalone/contact` | 削除（`hrt14/hitobito-support` が正本） | contact.hitobito.jp の本番 E2E 完了 |
| `app/drop`、`app/othello-puzzle` | 当面は据え置き。hitobito-games の静的構成に移せるか別途判断 | — |
| `proxy.ts` | ホストごとの設定表（ホスト→ルートパス）に置き換えて分岐を減らす | Phase 3 の転送が入った後 |

## Phase 4 — 台帳を使う側を増やす

- `app/tools/page.tsx`・`app/page.tsx`・`app/sitemap.ts` のサービス一覧を台帳から生成する。
- hitobito-games の `REPOSITORY_INVENTORY.md` と `deploy-targets.json` から、このリポジトリの台帳へリンクする。
- 新しいサービスは「台帳に追加 → `check:products` → 公開 → `promote: true`」を唯一の手順にする。
