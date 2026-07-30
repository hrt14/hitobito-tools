import Link from "next/link";

export default function ChromeRecorderPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f7f7f0", color: "#20241d" }}>
      <nav className="nav">
        <Link href="/" className="brand"><span>hitobito</span> <i>Tools</i></Link>
        <Link href="/" className="nav-link">TOPへ戻る</Link>
      </nav>
      <section style={{ maxWidth: 920, margin: "0 auto", padding: "72px 28px 100px" }}>
        <p className="eyebrow">CHROME / RECORDING</p>
        <h1 style={{ fontSize: "clamp(44px,7vw,80px)", letterSpacing: "-.08em", lineHeight: 1, margin: "0 0 24px" }}>Chrome Recorder</h1>
        <p style={{ maxWidth: 650, color: "#687064", lineHeight: 1.9, fontSize: 16 }}>
          Chromeで再生しているタブの音声を録音して、自分のGoogle Driveへ保存するための拡張機能です。YouTube、Google Meet、ブラウザ版Zoom・Teamsなどで使えます。
        </p>
        <div style={{ marginTop: 38, padding: 28, borderRadius: 24, background: "#20241d", color: "#f7f7f0" }}>
          <h2 style={{ marginTop: 0 }}>現在：テスト版</h2>
          <p style={{ color: "#cdd3c8", lineHeight: 1.8 }}>拡張機能本体はこのHi!rat ToolsのGitHub内に実装済みです。Chrome Web Store公開前のため、まずは開発者モードで読み込んで使います。</p>
          <ol style={{ lineHeight: 2, paddingLeft: 22 }}>
            <li>GitHubから hitobito-tools をPCへダウンロード</li>
            <li>Chromeで <b>chrome://extensions</b> を開く</li>
            <li>右上の「デベロッパーモード」をON</li>
            <li>「パッケージ化されていない拡張機能を読み込む」から <b>extension/chrome-recorder</b> を選択</li>
            <li>Google OAuth設定後、録音したいタブで拡張機能アイコンを押す</li>
          </ol>
          <a className="primary" href="https://github.com/hrt14/hitobito-tools/tree/main/extension/chrome-recorder" target="_blank" rel="noreferrer">拡張機能のソースを見る <span>→</span></a>
        </div>
        <section style={{ marginTop: 34, padding: 28, border: "1px solid #dfe1d8", borderRadius: 24 }}>
          <h2 style={{ marginTop: 0 }}>Google Drive連携について</h2>
          <p style={{ color: "#687064", lineHeight: 1.8 }}>Google CloudでChrome Extension用OAuthクライアントIDを発行し、manifest.jsonの <code>YOUR_GOOGLE_OAUTH_CLIENT_ID</code> を置き換えるとDrive保存が有効になります。保存先フォルダIDは録音小窓から指定できます。</p>
        </section>
        <p style={{ marginTop: 30, color: "#7c8377", fontSize: 12, lineHeight: 1.8 }}>会議や第三者の音声を録音する場合は、参加者への通知・同意や各サービスの利用規約、著作権等を確認して利用してください。</p>
      </section>
    </main>
  );
}
