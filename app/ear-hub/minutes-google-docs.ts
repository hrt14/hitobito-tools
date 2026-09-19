import type { SavedMinutes } from "./storage";

const DOC_MIME = "application/vnd.google-apps.document";
const RECORD_KEY = "digilMinutesId";

export type GoogleDocSaveResult =
  | { status: "saved"; link: string }
  | { status: "auth"; message: string }
  | { status: "failed"; message: string };

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Only our own plain-text Markdown becomes HTML; user speech is always escaped. */
export function minutesHtml(record: SavedMinutes) {
  const lines = [`# ${record.title}`, "", ...(record.summary.trim() ? record.summary.trim().split("\n") : ["要約なし（文字起こしを保存しました）"]), "", "## 文字起こし", "", ...record.transcript.split("\n")];
  const paragraphs = lines.map((raw) => {
    const line = raw.trim();
    if (!line) return "";
    if (/^---+$/.test(line)) return "<hr>";
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      return `<h${level}>${escapeHtml(heading[2])}</h${level}>`;
    }
    if (/^[-*]\s+/.test(line)) return `<p>・${escapeHtml(line.slice(2))}</p>`;
    return `<p>${escapeHtml(line)}</p>`;
  }).filter(Boolean);
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"></head><body>${paragraphs.join("\n")}</body></html>`;
}

function googleDocsLink(id: string) {
  return `https://docs.google.com/document/d/${encodeURIComponent(id)}/edit`;
}

function errorMessage(status: number) {
  if (status === 403) return "Googleドライブの保存権限、または保存先フォルダの権限を確認してください。";
  if (status === 404) return "保存先フォルダが見つかりません。DIGIL CLOUDの設定から選び直してください。";
  if (status === 429 || status >= 500) return "Google側が一時的に応答していません。少し待って再試行してください。";
  return `Googleドキュメントへの保存に失敗しました（HTTP ${status}）。`;
}

function authResult(): GoogleDocSaveResult {
  return { status: "auth", message: "Googleの接続が期限切れです。再接続してから保存してください。" };
}

/** drive.file only lists files made by this app or explicitly opened with it. */
export async function saveMinutesGoogleDoc(
  token: string,
  folderId: string,
  record: SavedMinutes,
): Promise<GoogleDocSaveResult> {
  if (!token) return authResult();
  if (!record.transcript.trim()) return { status: "failed", message: "発言がない議事録は保存できません。" };
  const authorization = { Authorization: `Bearer ${token}` };
  const q = `appProperties has { key='${RECORD_KEY}' and value='${record.id.replace(/'/g, "\\'")}' } and trashed=false`;

  try {
    // A timeout after creation must not produce a second document on retry.
    const lookup = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,mimeType,webViewLink)&pageSize=10`, { headers: authorization });
    if (lookup.status === 401) return authResult();
    if (!lookup.ok) return { status: "failed", message: errorMessage(lookup.status) };
    const existing = (await lookup.json()) as { files?: { id: string; mimeType: string; webViewLink?: string }[] };
    const doc = existing.files?.find((file) => file.mimeType === DOC_MIME && file.id);
    if (doc) return { status: "saved", link: doc.webViewLink || googleDocsLink(doc.id) };

    const boundary = `digil${Date.now()}${Math.random().toString(36).slice(2)}`;
    const metadata = {
      name: record.title,
      mimeType: DOC_MIME,
      appProperties: { [RECORD_KEY]: record.id },
      ...(folderId && folderId !== "root" ? { parents: [folderId] } : {}),
    };
    const body = [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${minutesHtml(record)}\r\n`,
      `--${boundary}--\r\n`,
    ].join("");
    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,mimeType,webViewLink", {
      method: "POST",
      headers: { ...authorization, "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
    if (response.status === 401) return authResult();
    if (!response.ok) return { status: "failed", message: errorMessage(response.status) };
    const created = (await response.json()) as { id?: string; mimeType?: string; webViewLink?: string };
    if (!created.id || created.mimeType !== DOC_MIME) {
      return { status: "failed", message: "Googleドキュメント形式で保存できたことを確認できませんでした。Driveの保存先をご確認ください。" };
    }
    return { status: "saved", link: created.webViewLink || googleDocsLink(created.id) };
  } catch {
    return { status: "failed", message: "保存結果を確認できませんでした。通信を確認して再試行してください。" };
  }
}
