# 流入計測（UTM）ルール

SNS・動画から hitobito のサービスへ貼るリンクには、必ず次の UTM を付ける。

| パラメータ | 値 | 例 |
| --- | --- | --- |
| `utm_source` | プラットフォーム（下の一覧から選ぶ） | `youtube` |
| `utm_medium` | `social`（有料広告は `paid`） | `social` |
| `utm_campaign` | `registry/products.json` の `marketing.series` | `habit-planet` |
| `utm_content` | 投稿の識別子 `YYYYMMDD-短い名前` | `20261001-first-planet` |

`utm_source` の値：`youtube` `x` `tiktok` `instagram` `threads` `note` `links`

一覧は `lib/products.ts` の `UTM_SOURCES` と同じ。増やすときは両方を更新する。

## 例

```
https://habit-planet.hitobito.jp/?utm_source=youtube&utm_medium=social&utm_campaign=habit-planet&utm_content=20261001-first-planet
```

## プロフィール欄のリンク

各SNSのプロフィールには個別サービスではなく、リンク集ページを貼る。

```
https://hitobito.jp/links?s=<utm_source>
```

リンク集ページは台帳の `marketing.promote: true` のサービスを表示し、`s` の値を `utm_source`、シリーズ名を `utm_campaign`、`links` を `utm_content` として各リンクに自動で付ける。

## コードから作る

```ts
import { getProduct, withUtm } from "@/lib/products";

withUtm(getProduct("habit-planet")!.url, {
  source: "youtube",
  campaign: "habit-planet",
  content: "20261001-first-planet",
});
```
