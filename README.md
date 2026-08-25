# hitobito Tools

暮らしや学びを少し便利にする、小さなWebツールのポータルです。

## このリポジトリの現在の範囲

このリポジトリには、主に次のサイト／ルートの実装があります。

- `hitobito.jp` — hitobito ポータル
- `tools.hitobito.jp` — Tools
- `2100.hitobito.jp` — 2100
- `drop.hitobito.jp` — 大河の一滴
- `life1.hitobito.jp` — LIFE +1
- `levelup.hitobito.jp` 向けの既存ルーティングコード

Habit Egg と中国語瞬間作文は現在それぞれ独立リポジトリで管理します。

- `hrt14/habit-egg`
- `hrt14/chinese-instant-composition`

## デプロイ運用

2026-08-26、Vercel の Git Integration は停止しました。

**GitHub の `main` へ push しても Vercel へ自動デプロイされません。**
本番公開が必要なときだけ、対象と変更内容を確認して意図的にデプロイします。

この方針は、頻繁な commit / push によって Vercel の無料デプロイ枠を不要に消費しないためのものです。

## 開発

```bash
npm install
npm run dev
```

## 確認

```bash
npm run lint
npm run build
```
