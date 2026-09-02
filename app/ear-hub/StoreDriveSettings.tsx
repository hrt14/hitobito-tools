"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import {
  GOOGLE_CLIENT_ID,
  fetchGoogleProfile,
  initTokenClient,
  revokeGoogleToken,
  type GoogleProfile,
  type TokenClient,
} from "./drive";
import { DEFAULT_DRIVE_FOLDER, DEFAULT_SETTINGS, type EarHubSettings } from "./modules";
import { loadSettings, saveSettings } from "./storage";
import styles from "./store-drive-settings.module.css";

const PROFILE_KEY = "digil.googleProfile.v1";

function loadProfile(): GoogleProfile | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as GoogleProfile) : null;
  } catch {
    return null;
  }
}

function saveProfile(profile: GoogleProfile | null) {
  try {
    if (profile) window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    else window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    // プロフィールを記憶できなくても、そのセッションでは利用できる。
  }
}

export default function StoreDriveSettings() {
  const tokenClientRef = useRef<TokenClient | null>(null);
  const accessTokenRef = useRef("");
  const [settings, setSettings] = useState<EarHubSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<GoogleProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSettings(loadSettings());
    setProfile(loadProfile());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!googleReady || !GOOGLE_CLIENT_ID) return;
    tokenClientRef.current = initTokenClient(async (response) => {
      setConnecting(false);
      if (response.error || !response.access_token) {
        setMessage(response.error_description || "Googleログインを完了できませんでした。");
        return;
      }

      accessTokenRef.current = response.access_token;
      const nextProfile = await fetchGoogleProfile(response.access_token);
      if (!nextProfile) {
        setMessage("Googleには接続できましたが、アカウント情報を取得できませんでした。");
        return;
      }
      setProfile(nextProfile);
      saveProfile(nextProfile);
      setMessage("ログインしました。Googleドライブ保存も利用できます。");
    });
  }, [googleReady]);

  const updateDriveSettings = (patch: Partial<Pick<EarHubSettings, "driveEnabled" | "driveFolder">>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const connectGoogle = () => {
    if (!GOOGLE_CLIENT_ID) {
      setMessage("Google OAuth Client ID がこのPreviewに設定されていません。");
      return;
    }
    if (!tokenClientRef.current) {
      setMessage("Googleログインを読み込み中です。数秒後にもう一度押してください。");
      return;
    }
    setConnecting(true);
    setMessage("");
    tokenClientRef.current.requestAccessToken({ prompt: profile ? "" : "consent" });
  };

  const logout = () => {
    revokeGoogleToken(accessTokenRef.current);
    accessTokenRef.current = "";
    setProfile(null);
    saveProfile(null);
    setMessage("この端末のログイン表示を解除しました。");
  };

  return (
    <section id="account" className={styles.sharedSettings} aria-labelledby="digil-account-title">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />

      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.sectionLabel}>ACCOUNT & CLOUD</p>
          <h2 id="digil-account-title">アカウントとGoogleドライブ</h2>
        </div>
        <span className={styles.sharedBadge}>DIGIL CLOUD 共通</span>
      </div>

      <div className={styles.driveCard}>
        <div className={styles.accountRow}>
          <div className={styles.accountIdentity}>
            {profile?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.avatar} src={profile.picture} alt="" />
            ) : (
              <span className={styles.avatarFallback} aria-hidden="true">D</span>
            )}
            <div>
              <strong>{profile ? profile.name : "DIGIL CLOUD にログイン"}</strong>
              <small>{profile ? profile.email : "GoogleアカウントでログインするとDrive保存も同時に接続します。"}</small>
            </div>
          </div>
          <div className={styles.accountActions}>
            <button type="button" className={styles.connectButton} onClick={connectGoogle} disabled={connecting || !ready}>
              {connecting ? "接続中…" : profile ? "Googleを再接続" : "Googleでログイン"}
            </button>
            {profile ? <button type="button" className={styles.logoutButton} onClick={logout}>ログアウト</button> : null}
          </div>
        </div>

        <div className={styles.driveIntro}>
          <span className={styles.driveIcon} aria-hidden="true">△</span>
          <div>
            <h3>Googleドライブ保存</h3>
            <p>対応アプリが同じ保存先を使います。現在は会議文字起こしの議事録保存に利用します。</p>
          </div>
        </div>

        <label className={styles.driveToggleRow}>
          <span>
            <strong>自動保存</strong>
            <small>会議文字起こしを停止したあと、自分のGoogleドライブにも保存します。</small>
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

        {message ? <p className={styles.message}>{message}</p> : null}
        <p className={styles.driveFootnote}>
          {GOOGLE_CLIENT_ID
            ? "Googleログインは試作版です。Drive権限は drive.file のみで、このサービスが作ったファイルだけを扱います。Premium課金を始める段階でサーバー側の恒久アカウント基盤へ移行します。"
            : "このPreviewには NEXT_PUBLIC_GOOGLE_CLIENT_ID が入っていないため、GoogleログインとDrive接続を開始できません。"}
        </p>
      </div>
    </section>
  );
}
