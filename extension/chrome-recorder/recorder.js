const statusEl = document.getElementById('status');
const sourceEl = document.getElementById('source');
const timerEl = document.getElementById('timer');
const stopBtn = document.getElementById('stop');
const folderInput = document.getElementById('folderId');
const saveFolderBtn = document.getElementById('saveFolder');
const resultEl = document.getElementById('result');
const dotEl = document.getElementById('dot');
let startedAt = null;
let timerId = null;

function format(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function render(message) {
  const state = message?.state || 'idle';
  startedAt = message?.startedAt || startedAt;
  sourceEl.textContent = message?.sourceTitle || sourceEl.textContent || '';
  dotEl.className = `dot ${state}`;
  resultEl.hidden = true;

  if (state === 'recording') {
    statusEl.textContent = '録音中';
    stopBtn.disabled = false;
  } else if (state === 'saving') {
    statusEl.textContent = 'Google Driveへ保存中...';
    stopBtn.disabled = true;
  } else if (state === 'saved') {
    statusEl.textContent = '保存しました';
    stopBtn.disabled = true;
    resultEl.hidden = false;
    resultEl.innerHTML = message.file?.webViewLink
      ? `<a href="${message.file.webViewLink}" target="_blank">Google Driveで開く</a>`
      : 'Google Driveへの保存が完了しました。';
  } else if (state === 'error') {
    statusEl.textContent = 'エラー';
    stopBtn.disabled = true;
    resultEl.hidden = false;
    resultEl.textContent = message.error || '録音または保存に失敗しました。';
  } else {
    statusEl.textContent = '待機中';
    stopBtn.disabled = true;
  }
}

function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => {
    if (startedAt) timerEl.textContent = format(Date.now() - startedAt);
  }, 500);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'RECORDER_STATUS') render(message);
});

stopBtn.addEventListener('click', async () => {
  stopBtn.disabled = true;
  statusEl.textContent = '録音を終了しています...';
  await chrome.runtime.sendMessage({ target: 'background', type: 'STOP_RECORDING' });
});

saveFolderBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ target: 'background', type: 'SAVE_FOLDER', folderId: folderInput.value.trim() });
  saveFolderBtn.textContent = '保存しました';
  setTimeout(() => (saveFolderBtn.textContent = '保存先を記憶'), 1200);
});

(async () => {
  const settings = await chrome.storage.local.get(['folderId']);
  folderInput.value = settings.folderId || '';
  const status = await chrome.runtime.sendMessage({ target: 'background', type: 'GET_STATUS' });
  render(status);
  startTimer();
})();
