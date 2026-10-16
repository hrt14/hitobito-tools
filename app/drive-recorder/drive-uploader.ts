import { deleteRecording, getRecording, saveRecording, type RecordingMeta } from "./recorder-db";
import {
  initiateResumableUpload,
  queryResumableStatus,
  uploadResumableChunk,
  verifyDriveFile,
  type DriveFile,
  type GoogleAccessToken,
} from "./google-drive";
import { readRecordingSlice, UPLOAD_CHUNK_BYTES } from "./recorder-utils";

export type UploadResult = { file: DriveFile; meta: RecordingMeta };

export async function uploadRecordingToDrive(
  recordingId: string,
  token: GoogleAccessToken,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  if (token.expiresAt <= Date.now()) {
    throw new Error("Google Driveへの接続期限が切れています。再接続してから再保存してください。");
  }

  let meta = await getRecording(recordingId);
  if (!meta) throw new Error("端末内の録音データが見つかりません。");
  if (!meta.size || !meta.chunkCount) throw new Error("録音データが空です。");

  meta = { ...meta, status: "uploading", lastError: undefined };
  await saveRecording(meta);
  let sessionUrl = meta.uploadSessionUrl;
  let offset = meta.uploadedBytes ?? 0;
  let completedFile: DriveFile | undefined;

  if (sessionUrl) {
    try {
      const status = await queryResumableStatus(sessionUrl, meta.size);
      if (status.status === 404) {
        sessionUrl = undefined;
        offset = 0;
      } else if (status.status === 308) {
        offset = status.nextByte;
      } else if (status.file?.id) {
        completedFile = status.file;
        offset = meta.size;
      }
    } catch {
      sessionUrl = undefined;
      offset = 0;
    }
  }

  if (!sessionUrl && !completedFile) {
    sessionUrl = await initiateResumableUpload({
      accessToken: token.accessToken,
      filename: meta.filename,
      mimeType: meta.mimeType,
      size: meta.size,
      folderId: meta.folderId,
    });
    offset = 0;
    meta = { ...meta, uploadSessionUrl: sessionUrl, uploadedBytes: 0 };
    await saveRecording(meta);
  }

  onProgress(Math.floor((offset / meta.size) * 100));
  while (offset < meta.size && !completedFile) {
    const blob = await readRecordingSlice(meta, offset, UPLOAD_CHUNK_BYTES);
    if (!blob.size) throw new Error("送信する録音チャンクを読み出せませんでした。");
    const start = offset;
    const result = await uploadResumableChunk({
      sessionUrl: sessionUrl!,
      blob,
      start,
      totalSize: meta.size,
      onProgress: (loaded) => onProgress(Math.floor((Math.min(meta!.size, start + loaded) / meta!.size) * 100)),
    });

    if (result.status === 404) {
      sessionUrl = await initiateResumableUpload({
        accessToken: token.accessToken,
        filename: meta.filename,
        mimeType: meta.mimeType,
        size: meta.size,
        folderId: meta.folderId,
      });
      offset = 0;
    } else if (result.status === 308) {
      offset = result.nextByte || start + blob.size;
    } else if (result.file?.id) {
      completedFile = result.file;
      offset = meta.size;
    } else {
      throw new Error("Driveから保存完了の確認を受け取れませんでした。");
    }

    meta = { ...meta, uploadSessionUrl: sessionUrl, uploadedBytes: offset };
    await saveRecording(meta);
    onProgress(Math.min(100, Math.floor((offset / meta.size) * 100)));
  }

  if (!completedFile?.id) throw new Error("Drive保存の完了ファイルを確認できませんでした。");
  const verified = await verifyDriveFile({
    accessToken: token.accessToken,
    fileId: completedFile.id,
    expectedFolderId: meta.folderId,
    expectedSize: meta.size,
  });
  await deleteRecording(meta.id);
  onProgress(100);
  return { file: verified, meta };
}
