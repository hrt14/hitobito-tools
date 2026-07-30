let mediaRecorder = null;
let mediaStream = null;
let audioContext = null;
let chunks = [];
let startedAt = null;
let authToken = "";
let folderId = "";
let sourceTitle = "Chrome recording";
let state = "idle";

function safeFilename(title) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const cleaned = (title || "Chrome recording")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${stamp}_${cleaned || "Chrome recording"}.webm`;
}

async function uploadToDrive(blob) {
  const metadata = {
    name: safeFilename(sourceTitle),
    mimeType: blob.type || "audio/webm",
  };

  if (folderId) metadata.parents = [folderId];

  const boundary = `hitobito_${crypto.randomUUID()}`;
  const metadataPart = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${blob.type || "audio/webm"}\r\n\r\n`
  );
  const mediaPart = new Uint8Array(await blob.arrayBuffer());
  const ending = new TextEncoder().encode(`\r\n--${boundary}--`);

  const body = new Uint8Array(metadataPart.length + mediaPart.length + ending.length);
  body.set(metadataPart, 0);
  body.set(mediaPart, metadataPart.length);
  body.set(ending, metadataPart.length + mediaPart.length);

  let response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (response.status === 401) {
    await chrome.identity.removeCachedAuthToken({ token: authToken });
    const refreshed = await chrome.identity.getAuthToken({ interactive: false });
    authToken = typeof refreshed === "string" ? refreshed : refreshed?.token;
    response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Driveへの保存に失敗しました (${response.status}): ${detail}`);
  }

  return response.json();
}

async function startRecording(message) {
  if (state === "recording") throw new Error("すでに録音中です。");

  authToken = message.authToken;
  folderId = message.folderId || "";
  sourceTitle = message.tabTitle || "Chrome recording";
  chunks = [];

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: message.streamId,
      },
    },
    video: false,
  });

  audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(mediaStream);
  source.connect(audioContext.destination);

  const preferredType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  mediaRecorder = new MediaRecorder(mediaStream, { mimeType: preferredType });
  mediaRecorder.ondataavailable = (event) => {
    if (event.data?.size) chunks.push(event.data);
  };

  mediaRecorder.start(1000);
  startedAt = Date.now();
  state = "recording";

  chrome.runtime.sendMessage({
    type: "RECORDER_STATUS",
    state,
    startedAt,
    sourceTitle,
  });
}

async function stopRecording() {
  if (!mediaRecorder || state !== "recording") return { state };

  state = "saving";
  chrome.runtime.sendMessage({ type: "RECORDER_STATUS", state });

  const stopped = new Promise((resolve) => {
    mediaRecorder.addEventListener("stop", resolve, { once: true });
  });
  mediaRecorder.stop();
  await stopped;

  mediaStream?.getTracks().forEach((track) => track.stop());
  if (audioContext && audioContext.state !== "closed") await audioContext.close();

  const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });

  try {
    const file = await uploadToDrive(blob);
    state = "saved";
    chrome.runtime.sendMessage({
      type: "RECORDER_STATUS",
      state,
      file,
      durationMs: startedAt ? Date.now() - startedAt : 0,
    });
    return { state, file };
  } catch (error) {
    state = "error";
    chrome.runtime.sendMessage({
      type: "RECORDER_STATUS",
      state,
      error: error.message,
    });
    return { state, error: error.message };
  } finally {
    mediaRecorder = null;
    mediaStream = null;
    audioContext = null;
    chunks = [];
    startedAt = null;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target !== "offscreen") return;

  if (message.type === "START_RECORDING") {
    startRecording(message)
      .then(() => sendResponse({ ok: true, state }))
      .catch((error) => {
        state = "error";
        chrome.runtime.sendMessage({ type: "RECORDER_STATUS", state, error: error.message });
        sendResponse({ ok: false, state, error: error.message });
      });
    return true;
  }

  if (message.type === "STOP_RECORDING") {
    stopRecording().then(sendResponse);
    return true;
  }

  if (message.type === "GET_STATUS") {
    sendResponse({ state, startedAt, sourceTitle });
  }
});
