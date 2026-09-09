# イヤホニャ！ 商用化方針

## プロダクト定義

**イヤホニャ！ — いつものイヤホンを、AIイヤホンに。**

専用AIイヤホンを購入しなくても、手持ちのイヤホンとスマートフォンでAI機能を追加するプロダクト。

初期の中心機能:

1. AI議事録
2. AI通訳

将来のPro候補:

- 会議中のAI耳打ち
- 会議横断の検索・記憶
- 長時間セッション
- 専門用語辞書
- 話者分離
- チーム共有

## 現在の実装場所

検証版は `hrt14/hitobito-tools` の DIGIL CLOUD / Ear Hub 基盤を利用する。

- `/earhonya` — イヤホニャ！独立入口
- `/ear-hub/earhonya` — DIGIL CLOUD内の入口
- `/ear-hub/minutes` — 既存のAI議事録実装
- `/ear-hub/translate` — 既存のAI通訳実装

既存ロジックを再利用し、検証段階で同じ音声処理を二重実装しない。

## 商用版で切り出すもの

反応が確認できた段階で、イヤホニャ固有部分を独立リポジトリへ移す。

推奨構成:

- mobile: React Native / Expo
- audio: native audio recording / input selection / background recording
- backend: authentication, entitlement, meeting metadata, usage metering
- AI gateway: transcription / translation / summarization providerをUIから分離
- billing: iOS StoreKit / Google Play Billing
- web: LP、アカウント、利用履歴、法人管理画面

## 無料版と有料版の境界

料金自体は検証後に決める。コード上は「無料/Proの権限」を機能単位で判定できるようにする。

Free候補:

- 短時間のAI議事録
- 短時間のAI通訳
- 基本的な会議結果表示

Pro候補:

- 長時間セッション
- AI耳打ち
- 会議横断検索・記憶
- 専門辞書
- 高精度モデル
- 高度なエクスポート

Business候補:

- チーム共有
- 管理者機能
- 共通辞書
- 会議データ管理ポリシー

## 商用化前に必須の確認

- 「イヤホニャ！」名称の商標・類似名称調査
- 録音・文字起こし同意UX
- プライバシーポリシー / 利用規約
- 音声データの保存期間と削除方法
- AIプロバイダへの送信範囲
- App Store / Google Playの課金要件
- Bluetooth入力・バックグラウンド録音の実機検証

## 原則

検証段階では最短で価値を確かめる。ただし、ユーザーデータ・課金・AIプロバイダ・UIを密結合させず、商用版への切り出しを可能にしておく。
