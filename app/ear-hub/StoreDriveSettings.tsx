"use client";

import { useEffect, useState } from "react";
import { GOOGLE_CLIENT_ID } from "./drive";
import { DEFAULT_DRIVE_FOLDER, DEFAULT_SETTINGS, type EarHubSettings } from "./modules";
import { loadSettings, saveSettings } from "./storage";
import styles from "./ear-hub-store.module.css";

export default function StoreDriveSettings() {
  const [settings, setSettings] = useState<EarHubSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setReady(true);
  }, []);

  const updateDriveSettings = (patch: Partial<Pick<EarHubSettings, "driveEnabled" | "driveFolder">>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next);
      return next;
    });
  };

  return (
    <section className={styles.sharedSettings} aria-labelledby="shared-drive-title">
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.sectionLabel}>COMMON SETTINGS</p>
          <h2 id="shared-drive-title">Googleドライブ</h2>
        </div>
        <span className={styles.sharedBadge}>Ear Hub 共通</span>
      </div>

      <div className={styles.driveCard}>
        <div className={styles.driveIntro}>
          <span className={styles.driveIcon} aria-hidden="true">△</span>
          <div>
            <h3>記録をGoogleドライブにも保存</h3>
            <p>
              ここで設定すると、Ear Hub内の対応アプリが同じ保存設定を使います。現在は議事録アプリの保存に利用します。
            </p>
          </div>
        </div>

        <label className={styles.driveToggleRow}>
          <span>
            <strong>自動保存</strong>
            <small>議事録を停止したあと、自分のGoogleドライブにも保存します。</small>
          </span>
          <input
            type="checkbox"
            checked={ready && settings.driveEnabled}
            disabled={!ready || !GOOGLE_CLIENT_ID}
            onChange={(event) => updateDriveSettings({ driveEnabled: event.target.checked })}
          />
        </label>

        <label className={styles.driveFolderField}>
          <span>保存先フォルダ名</span>
          <input
            type="text"
            value={ready ? settings.driveFolder : DEFAULT_DRIVE_FOLDER}
            disabled={!ready}
            onChange={(event) => updateDriveSettings({ driveFolder: event.target.value })}
            onBlur={(event) => {
              const folder = event.target.value.trim() || DEFAULT_DRIVE_FOLDER;
              updateDriveSettings({ driveFolder: folder });
            }}
            placeholder={DEFAULT_DRIVE_FOLDER}
          />
        </label>

        <p className={styles.driveFootnote}>
          {GOOGLE_CLIENT_ID
            ? "Googleへの接続確認は、実際に保存するときに行います。権限は drive.file のみで、このアプリが作ったファイルだけを扱います。"
            : "この環境ではGoogle連携用のクライアントIDが設定されていないため、自動保存は利用できません。"}
        </p>
      </div>
    </section>
  );
}
