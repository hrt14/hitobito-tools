# hitobito マーケティング共通キット

hitobito の全サービス（Tools / Games / LEVEL UP）で共通して使う、SNS・YouTube 発信の運用ルールとテンプレート。

## 基本方針：アカウントは hitobito に一本化する

- **1プラットフォームにつき1アカウント**（hitobito名義）。サービスごとにアカウントを作らない。
- サービスは **シリーズ** として扱う（YouTube の再生リスト、X/TikTok/Instagram の固定ハッシュタグ・シリーズ名）。
- Habit Planet が最初のシリーズ。以後のサービスも同じ枠に追加していく。
- **独立の目安**：1シリーズがアカウント全体の再生・流入の過半を3か月続けて占め、かつ専任で週3本以上出せる状態になったら、そのサービス専用アカウントの新設を検討する。それまでは hitobito の総合力で育てる。

理由：新しいサービスを出すたびにフォロワー0から始めずに済む。1アカウントなら運用負荷も一定に保てる。

## アカウント一覧

ハンドルは取得後に記入する。候補は「`hitobito` が取れなければ `hitobito_jp`」の順に試し、全プラットフォームで同じ文字列にそろえる。

| Platform | Handle | 用途 | プロフィールリンク |
| --- | --- | --- | --- |
| YouTube | 未取得 | 長尺デモ・ショート・シリーズ再生リスト | `https://hitobito.jp/links?s=youtube` |
| X | 未取得 | 新作告知・開発ログ | `https://hitobito.jp/links?s=x` |
| TikTok | 未取得 | ショート（YouTube Shortsと同一素材） | `https://hitobito.jp/links?s=tiktok` |
| Instagram | 未取得 | リール（同一素材）＋画像カルーセル | `https://hitobito.jp/links?s=instagram` |

アカウントの認証情報（パスワード、2FA、復旧コード）は**このリポジトリに書かない**（public repo）。パスワードマネージャーで管理する。

## 何がどこにあるか

| ファイル | 内容 |
| --- | --- |
| [`../registry/products.json`](../registry/products.json) | 全サービスの正本台帳。URL・シリーズ名・ハッシュタグの取得元 |
| [`BRAND.md`](./BRAND.md) | 名前の表記、色、トーン、やらないこと |
| [`UTM.md`](./UTM.md) | 流入計測のルール |
| [`templates/short-video.md`](./templates/short-video.md) | ショート動画（Shorts / TikTok / Reels 共通）の台本テンプレ |
| [`templates/launch-post.md`](./templates/launch-post.md) | 新サービス公開時の告知セット |
| [`series/`](./series/) | シリーズごとの発信計画（第1弾: Habit Planet） |

## 新サービスを発信対象にする手順

1. `registry/products.json` にサービスを追加し、公開後に `status: "live"`、`marketing.promote: true`、`marketing.series` を設定する。
2. `npm run check:products` が通ることを確認する。→ `hitobito.jp/links` に自動で載る。
3. `series/<series>.md` を `series/habit-planet.md` をひな形に作る。
4. `templates/launch-post.md` の告知セットを出す。
5. YouTube に同名の再生リストを作る。

## 運用リズム（最初の3か月）

- ショート：週3本（全プラットフォームに同じ素材を投稿）
- 長尺：月1本（新サービスまたは大型アップデート時）
- X：新作・アップデートの都度＋開発ログ週1
- 月1回、UTM 別の流入を確認し、伸びたシリーズの本数を増やす。
