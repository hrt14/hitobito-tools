// Recognize shared tab/system audio without accidentally falling back to the microphone.
// SpeechRecognition.start(audioTrack) is not supported by every browser; surface errors.
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: (track: MediaStreamTrack) => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export type PcListenerCallbacks = {
  onFinal: (text: string) => void;
  onInterim: (text: string) => void;
  onError: (message: string) => void;
  onListeningChange: (listening: boolean) => void;
  onTrackEnded: () => void;
};

const FATAL = new Set(["not-allowed", "service-not-allowed", "audio-capture", "network", "language-not-supported"]);

export class PcTrackListener {
  private recognition: Recognition | null = null;
  private active = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private delay = 300;
  private startedAt = 0;

  constructor(private readonly track: MediaStreamTrack, private readonly lang: string, private readonly callbacks: PcListenerCallbacks) {
    if (track.kind !== "audio" || track.readyState !== "live") {
      throw new Error("共有されたPC音声のトラックがありません。『音声を共有』をONにしてください。");
    }
    track.addEventListener("ended", this.onEnded);
  }

  private onEnded = () => {
    if (!this.active) return;
    this.stop();
    this.callbacks.onTrackEnded();
  };

  start() {
    if (this.active) return;
    this.active = true;
    try { this.launch(); }
    catch (error) {
      this.stop();
      throw error;
    }
  }

  stop() {
    this.active = false;
    this.track.removeEventListener("ended", this.onEnded);
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const recognition = this.recognition;
    this.recognition = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      try { recognition.abort(); } catch { /* Already closed. */ }
    }
    this.callbacks.onListeningChange(false);
  }

  private fail(message: string) {
    if (!this.active) return;
    this.stop();
    this.callbacks.onError(message);
  }

  private launch() {
    if (!this.active || this.track.readyState !== "live") return;
    const browser = window as RecognitionWindow;
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) throw new Error("PC音声の文字起こしには、対応したChromeの音声認識が必要です。");
    const recognition = new Constructor();
    this.recognition = recognition;
    recognition.lang = this.lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      this.startedAt = Date.now();
      this.callbacks.onListeningChange(true);
    };
    recognition.onresult = (event) => {
      if (!this.active) return;
      this.delay = 300;
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const candidate = event.results[index];
        const text = candidate?.[0]?.transcript?.trim() ?? "";
        if (!text) continue;
        if (candidate.isFinal) this.callbacks.onFinal(text);
        else interim += text;
      }
      this.callbacks.onInterim(interim.trim());
    };
    recognition.onerror = (event) => {
      if (!this.active || event.error === "aborted" || event.error === "no-speech") return;
      if (FATAL.has(event.error)) {
        this.fail(`PC音声を認識できませんでした（${event.error}）。共有元・言語・Chromeの権限を確認してください。`);
      } else {
        this.callbacks.onError(`PC音声の認識エラー（${event.error}）。`);
      }
    };
    recognition.onend = () => {
      if (!this.active || this.track.readyState !== "live") return;
      this.callbacks.onListeningChange(false);
      if (Date.now() - this.startedAt < 500) this.delay = Math.min(this.delay * 2, 4000);
      this.timer = setTimeout(() => {
        this.timer = null;
        if (!this.active || this.track.readyState !== "live") return;
        // Use the audio track on every restart, never recognition.start() without it.
        try { this.launch(); }
        catch { this.fail("PC音声の認識を再開できませんでした。Chromeの対応状況を確認してください。"); }
      }, this.delay);
    };
    try { recognition.start(this.track); }
    catch {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.onstart = null;
      this.recognition = null;
      throw new Error("このブラウザはPC音声トラックからの音声認識に対応していません。対応Chromeでお試しください。");
    }
  }
}
