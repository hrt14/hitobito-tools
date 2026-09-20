"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_PICKER_API_KEY,
  fetchGoogleProfile,
  getGoogleSessionToken,
  initTokenClient,
  revokeGoogleToken,
  type GoogleProfile,
  type TokenClient,
} from "./drive";
import { createDriveFolder, openReadableFolderPicker } from "./drive-folder-actions";
import {
  DEFAULT_DRIVE_FOLDER,
  DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_SETTINGS,
  type EarHubSettings,
} from "./modules";
import { loadSettings, saveSettings } from "./storage";
import styles from "./store-drive-settings.module.css";

const PROFILE_KEY = "digil.googleProfile.v1";

type PendingFolder = { name: string; parentId: string };

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
  const pendingFolderRef = useRef<PendingFolder | null>(null);
  const [settings, setSettings] = useState<EarHubSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<GoogleProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pickerOpening, setPickerOpening] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
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
        setMessage("保存先フォルダを選ぶ機能は準備中です。管理者によるGoogle Picker APIキーの設定が必要です。");
        return;
      }
      setPickerOpening(true);
      setMessage("");
      try {
        const opened = await openReadableFolderPicker(
          token,
          (folder) => {
            updateDriveSettings({ driveFolder: folder.name, driveFolderId: folder.id });
            setMessage(`保存先を「${folder.name}」に変更しました。次回の議事録からこのフォルダへ保存します。`);
          },
          () => setMessage("ファイルは保存先に指定できません。フォルダを選択してください。"),
        );
        if (!opened) setMessage("Googleドライブのフォルダ選択を開けませんでした。画面を再読み込みしてお試しください。");
      } catch {
        setMessage("Googleドライブのフォルダ選択を開けませんでした。画面を再読み込みしてお試しください。");
      } finally {
        setPickerOpening(false);
      }
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
        pendingFolderRef.current = null;
        setCreatingFolder(false);
        setMessage(response.error_description || "Googleログインを完了できませんでした。");
        return;
      }

      accessTokenRef.current = response.access_token;
      const nextProfile = await fetchGoogleProfile(response.access_token);
      if (nextProfile) {
        setProfile(nextProfile);
        saveProfile(nextProfile);
      }

      if (pendingFolderRef.current) {
        const folderRequest = pendingFolderRef.current;
        pendingFolderRef.current = null;
        try {
          const folder = await createDriveFolder(response.access_token, folderRequest.name, folderRequest.parentId);
          updateDriveSettings({ driveFolder: folder.name, driveFolderId: folder.id });
          setNewFolderName("");
          setShowNewFolder(false);
          setMessage(`「${folder.name}」を作成し、議事録の保存先に設定しました。`);
        } catch (error) {
          const code = error instanceof Error ? error.message : "";
          setMessage(code === "parent-not-accessible"
            ? "フォルダを作成できませんでした。親フォルダへのアクセス権を確認するか、マイドライブ直下に戻してからお試しください。"
            : code === "needs-login"
              ? "Googleの認証が切れました。もう一度お試しください。"
              : "フォルダを作成できませんでした。時間をおいて再度お試しください。");
        } finally {
          setCreatingFolder(false);
        }
        return;
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
  }, [googleReady, launchFolderPicker, updateDriveSettings]);

  const connectGoogle = (refreshToken = false) => {
    if (!GOOGLE_CLIENT_ID) {
      setMessage("Google OAuth Client ID が設定されていません。");
      return false;
    }
    if (!tokenClientRef.current) {
      setMessage("Googleログインを読み込み中です。数秒後にもう一度押してください。");
      return false;
    }
    setConnecting(true);
    setMessage("");
    // ユーザー操作から新しいGoogleトークンを要求し、期限切れのキャッシュを使わない。
    tokenClientRef.current.requestAccessToken({ prompt: refreshToken ? "" : profile ? "" : "consent" });
    return true;
  };

  const chooseFolder = () => {
    if (!GOOGLE_PICKER_API_KEY) {
      setMessage("保存先フォルダを選ぶ機能は準備中です。管理者によるGoogle Picker APIキーの設定が必要です。");
      return;
    }
    if (!tokenClientRef.current) {
      setMessage("Googleログインを読み込み中です。数秒後にもう一度押してください。");
      return;
    }
    pendingPickerRef.current = true;
    if (!connectGoogle(true)) pendingPickerRef.current = false;
  };

  const submitNewFolder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name || name.length > 255) {
      setMessage("フォルダ名を1〜255文字で入力してください。");
      return;
    }
    if (!tokenClientRef.current) {
      setMessage("Googleログインを読み込み中です。数秒後にもう一度押してください。");
      return;
    }
    // すでに選択したフォルダの中に作る。マイドライブ選択中ならrootに作る。
    pendingFolderRef.current = { name, parentId: settings.driveFolderId || DEFAULT_DRIVE_FOLDER_ID };
    setCreatingFolder(true);
    if (!connectGoogle(true)) {
      pendingFolderRef.current = null;
      setCreatingFolder(false);
    }
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
    pendingPickerRef.current = false;
    pendingFolderRef.current = null;
    setCreatingFolder(false);
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
            <button type="button" className={styles.connectButton} onClick={() => connectGoogle()} disabled={connecting || !ready}>
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
              className={styles.folderResetButton}
              onClick={() => setShowNewFolder((current) => !current)}
              disabled={!ready || connecting || creatingFolder}
              aria-expanded={showNewFolder}
            >
              ＋ 新しいフォルダ
            </button>
            <button
              type="button"
              className={styles.folderPickerButton}
              onClick={chooseFolder}
              disabled={!ready || pickerOpening || connecting || creatingFolder}
            >
              {pickerOpening ? "開いています…" : "フォルダを選ぶ"}
            </button>
          </div>
        </div>

        {showNewFolder ? (
          <form className={styles.newFolderForm} onSubmit={submitNewFolder}>
            <label htmlFor="digil-new-folder-name">「{settings.driveFolder}」の中に作成するフォルダ名</label>
            <div className={styles.newFolderControls}>
              <input
                id="digil-new-folder-name"
                type="text"
                autoComplete="off"
                maxLength={255}
                placeholder="例：2026年の議事録"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                disabled={connecting || creatingFolder}
                required
              />
              <button type="submit" className={styles.folderPickerButton} disabled={!newFolderName.trim() || connecting || creatingFolder}>
                {creatingFolder ? "作成中…" : "作成して保存先に設定"}
              </button>
            </div>
          </form>
        ) : null}

        {message ? <p className={styles.message} role="status">{message}</p> : null}
        <p className={styles.driveFootnote}>
          {GOOGLE_PICKER_API_KEY
            ? "フォルダ選択では既存ファイルも表示しますが、保存先に指定できるのはフォルダだけです。新しいフォルダは現在の保存先の中に作成します。Drive権限は drive.file のみです。"
            : "保存先の初期値はマイドライブ直下です。フォルダ選択UIはGoogle Picker APIキーを設定すると利用できます。"}
        </p>
      </div>
    </section>
  );
}
