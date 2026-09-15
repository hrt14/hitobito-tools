"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_PICKER_API_KEY,
  fetchGoogleProfile,
  getGoogleSessionToken,
  initTokenClient,
  openDriveFolderPicker,
  revokeGoogleToken,
  type GoogleProfile,
  type TokenClient,
} from "./drive";
import {
  DEFAULT_DRIVE_FOLDER,
  DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_SETTINGS,
  type EarHubSettings,
} from "./modules";
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
  const pendingPickerRef = useRef(false);
  const [settings, setSettings] = useState<EarHubSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<GoogleProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pickerOpening, setPickerOpening] = useState(false);
  const [message, setMessage] = useState("");

  const updateDriveSettings = useCallback(
    (patch: Partial<Pick<EarHubSettings, "driveEnabled" | "driveFolder" | "driveFolderId">>) => {
      setSettings((current) => {
        const next = { ...current, ...patch };
        saveSettings(next);
        return next;
      });
    },
    [],
  );

  const launchFolderPicker = useCallback(
    async (token: string) => {
      if (!GOOGLE_PICKER_API_KEY) {
        setMessage("Google Drive Picker用のAPIキーがまだ設定されていません。");
        return;
      }
      setPickerOpening(true);
      setMessage("");
      const opened = await openDriveFolderPicker(token, (folder) => {
        updateDriveSettings({ driveFolder: folder.name, driveFolderId: folder.id });
        setMessage(`保存先を「${folder.name}」に変更しました。`);
      });
      setPickerOpening(false);
      if (!opened) setMessage("Googleドライブのフォルダ選択を開けませんでした。");
    },
    [updateDriveSettings],
  );

  useEffect(() => {
    setSettings(loadSettings());
    setProfile(loadProfile());
    accessTokenRef.current = getGoogleSessionToken();
    setReady(true);
  }, []);

  useEffect(() => {
    if (!googleReady || !GOOGLE_CLIENT_ID) return;
    tokenClientRef.current = initTokenClient(async (response) => {
      setConnecting(false);
      if (response.error || !response.access_token) {
        pendingPickerRef.current = false;
        setMessage(response.error_description || "Googleログインを完了できませんでした。");
        return;
      }

      accessTokenRef.current = response.access_token;
      const nextProfile = await fetchGoogleProfile(response.access_token);
      if (nextProfile) {
        setProfile(nextProfile);
        saveProfile(nextProfile);
      }

      if (pendingPickerRef.current) {
        pendingPickerRef.current = false;
        await launchFolderPicker(response.access_token);
        return;
      }

      setMessage(
        nextProfile
          ? "ログインしました。Googleドライブ保存も利用できます。"
          : "Googleには接続できました。Googleドライブ保存を利用できます。",
      );
    });
  }, [googleReady, launchFolderPicker]);

  const connectGoogle = () => {
    if (!GOOGLE_CLIENT_ID) {
      setMessage("Google OAuth Client ID が設定されていません。");
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

  const chooseFolder = async () => {
    if (!GOOGLE_PICKER_API_KEY) {
      setMessage("フォルダ選択の準備中です。Google Picker APIキーを設定するとDriveのフォルダ画面を開けます。");
      return;
    }
    const token = accessTokenRef.current || getGoogleSessionToken();
    if (token) {
      await launchFolderPicker(token);
      return;
    }
    pendingPickerRef.current = true;
    connectGoogle();
  };

  const useMyDrive = () => {
    updateDriveSettings({
      driveFolder: DEFAULT_DRIVE_FOLDER,
      driveFolderId: DEFAULT_DRIVE_FOLDER_ID,
    });
    setMessage("保存先をマイドライブ直下に戻しました。");
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
      <Script src="https://apis.google.com/js/api.js" strategy="afterInteractive" />

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
            <p>対応アプリが同じ保存先を使います。初期状態はマイドライブ直下です。</p>
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

        <div className={styles.folderPickerRow}>
          <div className={styles.folderCurrent}>
            <span className={styles.folderIcon} aria-hidden="true">▰</span>
            <span>
              <small>保存先</small>
              <strong>{ready ? settings.driveFolder : DEFAULT_DRIVE_FOLDER}</strong>
            </span>
          </div>
          <div className={styles.folderActions}>
            {settings.driveFolderId !== DEFAULT_DRIVE_FOLDER_ID ? (
              <button type="button" className={styles.folderResetButton} onClick={useMyDrive}>
                マイドライブに戻す
              </button>
            ) : null}
            <button
              type="button"
              className={styles.folderPickerButton}
              onClick={() => void chooseFolder()}
              disabled={!ready || pickerOpening}
            >
              {pickerOpening ? "開いています…" : "フォルダを選ぶ"}
            </button>
          </div>
        </div>

        {message ? <p className={styles.message}>{message}</p> : null}
        <p className={styles.driveFootnote}>
          {GOOGLE_PICKER_API_KEY
            ? "フォルダ選択はGoogle Drive Pickerを使います。Drive権限は drive.file のみで、DIGIL CLOUDが作ったファイルと、あなたがPickerで選んだ保存先だけを扱います。"
            : "保存先の初期値はマイドライブ直下です。フォルダ選択UIは実装済みで、Google Picker APIキーを設定すると利用できるようになります。"}
        </p>
      </div>
    </section>
  );
}
