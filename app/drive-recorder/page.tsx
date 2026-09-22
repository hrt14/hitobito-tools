"use client";

import { useMemo } from "react";
import styles from "./driveRecorder.module.css";
import { formatBytes, formatDuration, formatRecordedAt } from "./recorder-utils";
import { useDriveRecorder } from "./useDriveRecorder";

export default function DriveRecorderPage() {
  const recorder = useDriveRecorder();
  const activePending = useMemo(
    () => recorder.pending.find((item) => item.id === recorder.activeRecordingId) ?? null,
    [recorder.activeRecordingId, recorder.pending],
  );

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <a href="https://tools.hitobito.jp/" className={styles.brand} aria-label="hitobito Tools">
            hitobito <span>Tools</span>
          </a>
          <span className={styles.product}>DRIVE RECORDER</span>
        </header>

        {!recorder.googleConfigured && (
          <div className={styles.configAlert} role="alert">
            <b>Google Drive連携の環境設定が必要です。</b>
            <span>OAuth Client ID / API Key / Cloud Project Number を本番環境に設定してください。</span>
          </div>
        )}

        {recorder.pending.length > 0 && recorder.stage !== "recording" && recorder.stage !== "finishing" && (
          <section className={styles.pendingPanel} aria-labelledby="pending-title">
            <div className={styles.pendingTitleRow}>
              <div><p className={styles.kicker}>LOCAL RECOVERY</p><h2 id="pending-title">未アップロード録音があります</h2></div>
              <span>{recorder.pending.length}件</span>
            </div>
            <div className={styles.pendingList}>
              {recorder.pending.map((item) => (
                <article className={styles.pendingItem} key={item.id}>
                  <div>
                    <strong>{item.title || "無題の録音"}</strong>
                    <span>{formatRecordedAt(item.startedAt)} ・ {formatDuration(item.durationMs)} ・ {formatBytes(item.size)}</span>
                    <small>保存先：{item.folderName}{item.status === "interrupted" ? " ／ 録音中断データ" : ""}</small>
                  </div>
                  <button type="button" className={styles.retryButton} onClick={() => void recorder.retryUpload(item.id)} disabled={recorder.stage === "uploading"}>
                    Driveへ再保存
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {recorder.stage === "ready" && (
          <section className={styles.recorderCard}>
            <div className={styles.intro}>
              <p className={styles.kicker}>RAW AUDIO → YOUR DRIVE</p>
              <h1>録って、そのままDriveへ。</h1>
              <p>文字起こしも要約もしません。マイクの音声を端末内へ一時保存してから、指定したGoogle Driveフォルダへ送ります。</p>
            </div>

            <div className={styles.setupStack}>
              <div className={styles.setupRow}>
                <div><span className={styles.step}>1</span><div><b>Google Drive</b><small>{recorder.connected && recorder.tokenIsValid() ? "接続済み" : "未接続"}</small></div></div>
                <button type="button" className={styles.ghostButton} onClick={() => void recorder.connectGoogle()} disabled={recorder.connecting || !recorder.googleConfigured}>
                  {recorder.connecting ? "接続中…" : recorder.connected && recorder.tokenIsValid() ? "再接続" : "接続"}
                </button>
              </div>
              <div className={styles.setupRow}>
                <div><span className={styles.step}>2</span><div><b>保存先</b><small>{recorder.folder ? `Google Drive / ${recorder.folder.name}` : "未選択"}</small></div></div>
                <button type="button" className={styles.ghostButton} onClick={() => void recorder.chooseFolder()} disabled={!recorder.connected || !recorder.tokenIsValid()}>
                  {recorder.folder ? "変更" : "選択"}
                </button>
              </div>
            </div>

            <label className={styles.titleField}>
              <span>タイトル <small>任意</small></span>
              <input value={recorder.title} onChange={(event) => recorder.setTitle(event.target.value)} placeholder="例：ゴルフパートナー定例" maxLength={80} />
            </label>

            <button type="button" className={styles.recordButton} onClick={() => void recorder.startRecording()} disabled={!recorder.folder || !recorder.connected || !recorder.tokenIsValid() || !recorder.googleConfigured}>
              <span className={styles.recordDot} aria-hidden="true" />録音開始
            </button>
            <p className={styles.safetyLine}>録音中は画面を開いたままにしてください。iPhoneの画面ロック・アプリ切替中の録音継続はWebでは保証できません。</p>
          </section>
        )}

        {recorder.stage === "recording" && (
          <section className={`${styles.recorderCard} ${styles.recordingCard}`}>
            <div className={styles.recordingLabel}><span /> RECORDING</div>
            <div className={styles.timer}>{formatDuration(recorder.elapsedMs)}</div>
            <div className={styles.recordingMeta}><span>保存先</span><b>{recorder.activeFolderName}</b></div>
            <p className={styles.keepOpen}>録音中はこの画面を開いたままにしてください</p>
            {recorder.backgroundWarning && <div className={styles.warning} role="status">画面が非表示になりました。iPhoneではバックグラウンド化により録音が止まる場合があります。画面を開いた状態で続けてください。</div>}

            {!recorder.confirmStop ? (
              <button type="button" className={styles.stopButton} onClick={() => recorder.setConfirmStop(true)}><span aria-hidden="true" /> 録音を終了してDriveへ保存</button>
            ) : (
              <div className={styles.stopConfirm}>
                <b>録音を終了しますか？</b>
                <div>
                  <button type="button" onClick={() => recorder.setConfirmStop(false)}>録音を続ける</button>
                  <button type="button" className={styles.confirmStopButton} onClick={() => void recorder.finishAndUpload()}>終了して保存</button>
                </div>
              </div>
            )}
          </section>
        )}

        {recorder.stage === "finishing" && (
          <section className={styles.recorderCard}><div className={styles.spinner} aria-hidden="true" /><h1 className={styles.stateTitle}>端末内へ保存中…</h1><p className={styles.stateCopy}>最後の音声チャンクをIndexedDBへ確定しています。この画面を閉じないでください。</p></section>
        )}

        {recorder.stage === "uploading" && (
          <section className={styles.recorderCard}>
            <p className={styles.kicker}>RESUMABLE UPLOAD</p><h1 className={styles.stateTitle}>Google Driveへ保存中…</h1>
            <div className={styles.progressTrack} aria-label={`アップロード ${recorder.uploadProgress}%`}><span style={{ width: `${recorder.uploadProgress}%` }} /></div>
            <div className={styles.progressValue}>{recorder.uploadProgress}%</div>
            <p className={styles.stateCopy}>{activePending ? `${activePending.folderName} / ${activePending.filename}` : "通信が切れても端末内の録音は削除しません。"}</p>
          </section>
        )}

        {recorder.stage === "success" && recorder.savedFile && (
          <section className={`${styles.recorderCard} ${styles.successCard}`}>
            <div className={styles.successMark}>✓</div><p className={styles.kicker}>SAVED</p><h1 className={styles.stateTitle}>Google Driveへ保存しました</h1>
            <div className={styles.savedDetails}><b>{recorder.savedFolderName}</b><span>{recorder.savedFile.name}</span></div>
            <div className={styles.successActions}>
              {recorder.savedFile.webViewLink && <a href={recorder.savedFile.webViewLink} target="_blank" rel="noreferrer">Driveで確認</a>}
              <button type="button" onClick={recorder.nextRecording}>次の録音</button>
            </div>
          </section>
        )}

        {recorder.stage === "error" && (
          <section className={`${styles.recorderCard} ${styles.errorCard}`}>
            <div className={styles.errorMark}>!</div><p className={styles.kicker}>LOCAL DATA KEPT</p><h1 className={styles.stateTitle}>{recorder.errorHeading}</h1>
            <p className={styles.stateCopy}>{recorder.message || "録音データは端末内に残っています。"}</p>
            {!recorder.tokenIsValid() && <button type="button" className={styles.connectInline} onClick={() => void recorder.connectGoogle()} disabled={recorder.connecting}>{recorder.connecting ? "Googleへ接続中…" : "Google Driveへ再接続"}</button>}
            {recorder.activeRecordingId && <button type="button" className={styles.retryPrimary} onClick={() => void recorder.retryUpload(recorder.activeRecordingId!)} disabled={!recorder.tokenIsValid()}>再アップロード</button>}
            <button type="button" className={styles.textButton} onClick={recorder.backToReady}>録音画面へ戻る</button>
          </section>
        )}

        {recorder.message && recorder.stage === "ready" && <div className={styles.inlineMessage} role="status">{recorder.message}</div>}
        <footer className={styles.footer}><span>音声はDrive保存成功を確認するまで端末内から削除しません。</span><a href="https://tools.hitobito.jp/">hitobito Tools</a></footer>
      </section>
    </main>
  );
}
