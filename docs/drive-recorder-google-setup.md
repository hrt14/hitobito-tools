# Drive Recorder — Google Drive setup

Drive Recorder runs the recording and upload flow in the browser. It does not send audio through the hitobito server.

## Required Google Cloud APIs

Use one Google Cloud project and enable:

- Google Drive API
- Google Picker API

Official docs:

- Drive API scopes: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- Google Picker setup: https://developers.google.com/drive/picker/guides/overview
- Google Identity Services token model: https://developers.google.com/identity/oauth2/web/guides/use-token-model

## OAuth client

Create an OAuth 2.0 Client ID of type **Web application**.

Authorized JavaScript origin for production:

- `https://tools.hitobito.jp`

For preview testing, add only the exact preview origin you intend to use. Do not use a wildcard origin.

The app requests only:

- `https://www.googleapis.com/auth/drive.file`

This lets the app work with files/folders the user explicitly chooses or files the app creates, instead of requesting access to the user's entire Drive.

## Browser API key

Create a browser API key for Google Picker and restrict it:

- Application restriction: HTTP referrers
- Production referrer: `https://tools.hitobito.jp/*`
- API restriction: Google Picker API

The API key and OAuth Web Client ID are browser identifiers, not bearer tokens. The user's OAuth access token is held only in page memory by Drive Recorder and is not written to localStorage or IndexedDB.

## Vercel environment variables

Set these on the `hitobito-tools` project for Production (and Preview if needed):

```text
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<web OAuth client id>
NEXT_PUBLIC_GOOGLE_API_KEY=<browser API key>
NEXT_PUBLIC_GOOGLE_APP_ID=<Google Cloud project number>
```

`NEXT_PUBLIC_GOOGLE_APP_ID` is the numeric **Project number**, not the Project ID string.

After changing these values, redeploy intentionally. This repository does not auto-deploy `main` to Vercel.

## Production check

Before calling V1 complete, verify on an actual iPhone:

1. Open `https://tools.hitobito.jp/drive-recorder` in Safari.
2. Connect the intended Google account.
3. Select a real Drive folder with Google Picker.
4. Record at least 10 minutes with the screen kept open.
5. Stop and confirm the file appears in the selected folder and plays from Drive.
6. Test a failed upload (for example by disconnecting network after stopping), confirm the recording stays under "未アップロード録音", then reconnect and retry.
7. Add to Home Screen and launch it in standalone mode.
8. Confirm the UI warning appears if the app is backgrounded while recording.

Do not claim that iPhone recording survives screen lock or backgrounding. WebKit may suspend a web app when it is no longer foregrounded.
