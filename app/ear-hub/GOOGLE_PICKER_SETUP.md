# DIGIL CLOUD：Googleドライブの保存先フォルダ選択を有効にする

対象：`https://dc.hitobito.jp/#account`、リポジトリ `hrt14/hitobito-tools`、Vercel の **既存** `hitobito-tools` プロジェクト。

## 実装済みの処理

- 「フォルダを選ぶ」→ Google OAuth で **新しいアクセストークンを取得** → Google Picker でフォルダを選ぶ。
- Google Picker の選択結果を `{ driveFolder, driveFolderId }` として端末の設定に保存する（`storage.ts`）。フォルダは同名でも ID で区別する。
- 議事録の保存処理は `saveMinutesGoogleDoc(token, settingsRef.current.driveFolderId, record)` で選択したフォルダ ID を使う。
- 「マイドライブに戻す」で `root` に戻す。Google Drive への権限は `drive.file` に限定したままでよい。
- **API キー未設定では、既存の画面は表示されてもフォルダを開けない。Google Cloud と Vercel の次の設定が必要。**

## 1. Google Cloud 側（既存の OAuth と同じプロジェクト）

1. [Google Cloud の API ライブラリ](https://console.cloud.google.com/apis/library) を開き、Googleログイン用 OAuth クライアント ID が属するプロジェクトを選ぶ。現行コードの既定 OAuth クライアント ID に含まれるプロジェクト番号は `995292381518`。**別プロジェクトの API キーと混同しない。**
2. **Google Picker API** と **Google Drive API** を有効にする。
3. [認証情報](https://console.cloud.google.com/apis/credentials) で **API キー**を作成する。認証情報の種類は OAuth クライアント ID ではない。
4. API キーの「アプリケーションの制限」を **ウェブサイト** に設定して、`https://dc.hitobito.jp/*` と `https://docs.google.com/*` を許可する（Google Picker は docs.google.com の iframe で動く）。プレビュー環境でも手動試験する場合だけ、そのプレビュー URL も追加する。
5. API キーの「API の制限」を **キーを制限** にして **Google Picker API** と **Google Drive API** だけを選ぶ。
6. 既存の OAuth 2.0 ウェブクライアントの「承認済みの JavaScript 生成元」に `https://dc.hitobito.jp` があるか確認する。**こちらは末尾 `/*` を付けない。**

## 2. Vercel 側

1. [Vercel の既存 `hitobito-tools` プロジェクト](https://vercel.com/hrt14s-projects/hitobito-tools) → Settings → Environment Variables を開く。
2. `NEXT_PUBLIC_GOOGLE_PICKER_API_KEY` を **Production** に登録する。値は手順 1 の API キー。`NEXT_PUBLIC_` 変数はブラウザ配信されるため、必ず上記のアプリケーション・API 制限を設定する。値を GitHub やチャットに貼らない。
3. 環境変数を反映させるため、**既存の `hitobito-tools` プロジェクト**で Production を再ビルド・再デプロイする。Git Integration、DNS、ドメイン割り当て、LEVEL UP は変更しない。
4. デプロイ後の `https://dc.hitobito.jp/#account` で「フォルダを選ぶ」を押し、API キーの未設定メッセージが消えていることを確認する。

## 3. 本番 E2E の合格条件

1. シークレットウィンドウで開き Googleログイン → 「フォルダを選ぶ」→ Google Picker が開く。Googleの承認エラー・API developer key is invalid が出ない。
2. マイドライブ内の既存フォルダを選ぶ → 画面に選んだフォルダ名が出る。リロードしてもフォルダが維持される。
3. 会議文字起こしを短く記録し「Googleドキュメントに保存」→ **選択フォルダ内**にネイティブ Google ドキュメントが生成され、そのリンクから開ける。自動保存を使う場合はトグルを ON にして試す。
4. 期限切れを模した再訪でも「フォルダを選ぶ」で再認証して Picker を開ける。
5. 「マイドライブに戻す」→ 次の新規議事録がマイドライブ直下に保存される。
6. Googleログイン、翻訳、既存議事録、別ドメインの表示が壊れていない。

Google 公式： [ウェブアプリで Google Picker API を使う](https://developers.google.com/workspace/drive/picker/guides/web-picker-sample)、[Google Picker API の環境設定](https://developers.google.com/workspace/drive/picker/guides/web-picker)。

**API キーの作成・登録と本番での Google アカウントを使った E2E が完了するまで、「機能完成・公開済み」とは記載しない。**
