const OFFSCREEN_DOCUMENT = "offscreen.html";

async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT)],
  });

  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT,
    reasons: ["USER_MEDIA"],
    justification: "Record audio from the active Chrome tab while keeping playback audible.",
  });
}

async function startRecording(tab) {
  await ensureOffscreenDocument();

  const token = await chrome.identity.getAuthToken({ interactive: true });
  const authToken = typeof token === "string" ? token : token?.token;
  if (!authToken) throw new Error("Google認証に失敗しました。");

  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
  const settings = await chrome.storage.local.get(["folderId"]);

  await chrome.runtime.sendMessage({
    target: "offscreen",
    type: "START_RECORDING",
    streamId,
    authToken,
    folderId: settings.folderId || "",
    tabTitle: tab.title || "Chrome recording",
  });

  await chrome.windows.create({
    url: chrome.runtime.getURL("recorder.html"),
    type: "popup",
    width: 420,
    height: 520,
  });
}

chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab?.id) throw new Error("録音対象のタブを取得できませんでした。");
    await startRecording(tab);
  } catch (error) {
    console.error(error);
    chrome.notifications?.create?.({
      type: "basic",
      iconUrl: "",
      title: "hitobito Chrome Recorder",
      message: error?.message || "録音を開始できませんでした。",
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target !== "background") return;

  if (message.type === "STOP_RECORDING") {
    chrome.runtime
      .sendMessage({ target: "offscreen", type: "STOP_RECORDING" })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "GET_STATUS") {
    chrome.runtime
      .sendMessage({ target: "offscreen", type: "GET_STATUS" })
      .then((status) => sendResponse(status))
      .catch(() => sendResponse({ state: "idle" }));
    return true;
  }

  if (message.type === "SAVE_FOLDER") {
    chrome.storage.local
      .set({ folderId: message.folderId || "" })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});
