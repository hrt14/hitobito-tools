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

1. **Habit Planet の正本が main に無い。** ソースは `hrt14/hitobito-games` の `feat/habit-planet-cloudflare` ブランチの `standalone/habit-planet/` にあり、`habit-planet` を含むブランチが約40本ある。課金・認証・専用D1を持つ有料サービスが、ゲーム用 repo の長命ブランチに住んでいる状態。本番への中継も `habit-planet-proxy`（Vercel）と `hitobito-tools/proxy.ts` の2か所にある。
2. **LEVEL UP が2か所にある。** hitobito-games（Firebase、現行）と、このリポジトリの `app/levelup/**`＋直下の互換エントリ（`hard-request`、`unfair-blame`、`self-management`、`ryoma-big-picture`、`life-stats`、`start`、`maa-iika`）。
3. **お問い合わせのコードが2か所にある。** `standalone/contact`（移行元）と `hrt14/hitobito-support`（正本。2026-09-21 本番E2E確認済み）。
4. **ゲームのドメインの役割が明文化されていない。** 運用上は `games.hitobito.jp` ＝入口ポータル（Vercel）、`play.hitobito.jp` ＝通常ゲームの実プレイ（Cloudflare Pages）だが、ポータル・Tools・sitemap の表記が混在している。
5. **サブドメインの書き方がそろっていない。** `habitegg`（ハイフン無し）と `habit-planet`・`working-planet`（ハイフン有り）。
6. **ゲームが hitobito-tools にある。** `drop.hitobito.jp`（大河の一滴）、`othello-puzzle`。
7. **`proxy.ts` がサブドメイン8種類の分岐を1ファイルで抱えている。**

## Phase 0 — 台帳と発信基盤（このPR）

- [x] `registry/products.json` と `npm run check:products`
- [x] `hitobito.jp/links`（台帳から生成、UTM自動付与）
- [x] `marketing/`（アカウント方針、ブランド、UTM、テンプレート、Habit Planet シリーズ）
- [ ] 本番デプロイして `https://hitobito.jp/links` を確認（`AGENTS.md` の Deployment 手順）
- [ ] SNS アカウント取得、`marketing/README.md` にハンドルを記入

## Phase 1 — Habit Planet を独立 repo へ（最優先）

判断基準（課金・認証・独自DB → 独立 repo）に当てはまるため、`hrt14/habit-planet`（private）へ移す。

1. `feat/habit-planet-cloudflare` が本番に出ているコードと一致するかを確認する（Cloudflare の最新デプロイと `wrangler.jsonc` を照合）。
2. `git subtree split -P standalone/habit-planet feat/habit-planet-cloudflare` で履歴付きのまま切り出し、`hrt14/habit-planet` の `main` にする。
3. 未マージの `habit-planet` 系ブランチ（約40本）を「新 repo に持っていく／既に取り込み済み／捨てる」に仕分ける。持っていくものは新 repo へ cherry-pick する。
4. 以後のデプロイは新 repo の `main` から行う。`wrangler.jsonc` の Worker 名・D1・ドメインは**変えない**（コードの置き場所だけを変える）。
5. hitobito-games 側には `standalone/habit-planet` を置かず、ブランチは新 repo での本番デプロイ確認後に削除する。
6. 台帳の `repo` / `path` / `branch` を更新する。

## Phase 2 — ドメインの役割を明文化

- `games.hitobito.jp` ＝ゲームの入口ポータル、`play.hitobito.jp` ＝通常ゲームの実プレイ、と台帳と `HOSTING_POLICY.md` に書く（現状の運用を正式化するだけで、ドメインは変えない）。
- ポータル・Tools・sitemap の「Games」リンクはすべて `games.hitobito.jp` に揃える。
- `habitegg.hitobito.jp` は現状維持。今後の新サービスは台帳の `slug` ＝ サブドメインにする。

## Phase 3 — 重複の撤去

各項目とも「転送先で本番確認 → 転送を入れる → 1か月様子を見る → 旧コード削除」の順に進める。

| 対象 | 行き先 | 前提 |
| --- | --- | --- |
| `app/levelup/**`、直下の LEVEL UP 互換エントリ | `levelup.hitobito.jp`（hitobito-games / Firebase）へ 308 | Firebase 側に同じアプリがあることを1件ずつ確認 |
| `standalone/contact` | 削除（`hrt14/hitobito-support` が正本） | 済（2026-09-21 本番E2E確認）。すぐ着手可 |
| `habit-planet-proxy/`、`proxy.ts` の Habit Planet 分岐 | どちらか1つに統一（実際に `habit-planet.hitobito.jp` を受けている Vercel プロジェクトを確認して残す） | Vercel 管理画面での確認 |
| `app/drop`、`app/othello-puzzle` | 当面は据え置き。hitobito-games の静的構成に移せるか別途判断 | — |
| `proxy.ts` | ホストごとの設定表（ホスト→ルートパス）に置き換えて分岐を減らす | Phase 3 の転送が入った後 |

## Phase 4 — 台帳を使う側を増やす

- `app/tools/page.tsx`・`app/page.tsx`・`app/sitemap.ts` のサービス一覧を台帳から生成する。
- hitobito-games の `REPOSITORY_INVENTORY.md` と `deploy-targets.json` から、このリポジトリの台帳へリンクする。
- 新しいサービスは「台帳に追加 → `check:products` → 公開 → `promote: true`」を唯一の手順にする。
