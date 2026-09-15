/**
 * ブラウザ内蔵の音声認識と読み上げのラッパー。
 *
 * 認識(SpeechRecognition)と読み上げ(speechSynthesis)はどちらも端末側で動くので、
 * ここに課金は発生しない。Claude APIに渡すのは認識後のテキストだけになる。
 */

type RecognitionAlternative = { transcript: string };
type RecognitionResult = ArrayLike<RecognitionAlternative> & { isFinal: boolean };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { error: string };

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type RecognitionCtor = new () => RecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function isRecognitionSupported() {
  return recognitionCtor() !== null;
}

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "マイクの使用が許可されていません。ブラウザの設定で許可してください。",
  "service-not-allowed": "この環境では音声認識が使えません。",
  "audio-capture": "マイクが見つかりません。イヤホンの接続を確認してください。",
  network: "音声認識サーバーに接続できませんでした。",
};

export type ListenerCallbacks = {
  onFinal: (text: string) => void;
  onInterim: (text: string) => void;
  onError: (message: string, fatal: boolean) => void;
  onListeningChange: (listening: boolean) => void;
};

/**
 * 認識は黙っていると勝手に終わる(ブラウザによっては数十秒で切れる)ため、
 * 「開始」している間は onend のたびに黙って張り直す。
 */
export class Listener {
  private readonly callbacks: ListenerCallbacks;
  private recognition: RecognitionLike | null = null;
  private active = false;
  private suspended = false;
  private lang = "ja-JP";
  private restartDelay = 200;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private startedAt = 0;

  constructor(callbacks: ListenerCallbacks) {
    this.callbacks = callbacks;
  }

  start(lang: string) {
    this.lang = lang;
    this.active = true;
    this.suspended = false;
    this.restartDelay = 200;
    this.launch();
  }

  stop() {
    this.active = false;
    this.suspended = false;
    this.teardown();
    this.callbacks.onListeningChange(false);
  }

  setLang(lang: string) {
    if (lang === this.lang) return;
    this.lang = lang;
    if (!this.active || this.suspended) return;
    this.teardown();
    this.launch();
  }

  /** 読み上げの音を自分のマイクが拾い直さないよう、発話中は認識を落とす。 */
  suspend() {
    if (!this.active || this.suspended) return;
    this.suspended = true;
    this.teardown();
    this.callbacks.onListeningChange(false);
  }

  resume() {
    if (!this.active || !this.suspended) return;
    this.suspended = false;
    this.restartDelay = 200;
    this.launch();
  }

  private teardown() {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    const recognition = this.recognition;
    if (!recognition) return;
    this.recognition = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
    try {
      // stop() は途中の音声を確定させてしまうので、読み上げの回り込みを捨てられる abort() を使う。
      recognition.abort();
    } catch {
      // すでに停止済みなら何もしなくていい。
    }
  }

  private scheduleRestart() {
    if (this.restartTimer) return;
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (this.active && !this.suspended) this.launch();
    }, this.restartDelay);
  }

  private launch() {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      this.active = false;
      this.callbacks.onError("このブラウザは音声認識に対応していません。", true);
      return;
    }

    this.teardown();

    const recognition = new Ctor();
    recognition.lang = this.lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.startedAt = Date.now();
      this.callbacks.onListeningChange(true);
    };

    recognition.onresult = (event) => {
      // 認識が続いている間は張り直しの間隔を戻す。
      this.restartDelay = 200;
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          const finalText = transcript.trim();
          if (finalText) this.callbacks.onFinal(finalText);
        } else {
          interim += transcript;
        }
      }
      this.callbacks.onInterim(interim.trim());
    };

    recognition.onerror = (event) => {
      if (FATAL_ERRORS.has(event.error)) {
        this.active = false;
        this.teardown();
        this.callbacks.onListeningChange(false);
        this.callbacks.onError(ERROR_MESSAGES[event.error] ?? "音声認識が停止しました。", true);
        return;
      }
      // no-speech と aborted は黙って張り直す。それ以外だけ通知する。
      if (event.error !== "no-speech" && event.error !== "aborted") {
        this.callbacks.onError(ERROR_MESSAGES[event.error] ?? `音声認識のエラー (${event.error})`, false);
      }
    };

    recognition.onend = () => {
      this.callbacks.onListeningChange(false);
      if (!this.active || this.suspended) return;
      // 始まった直後に終わるときは張り直しを繰り返しても無駄なので間隔を空ける。
      if (Date.now() - this.startedAt < 500) {
        this.restartDelay = Math.min(this.restartDelay * 2, 4000);
      }
      this.scheduleRestart();
    };

    this.recognition = recognition;
    try {
      recognition.start();
    } catch {
      // 直前のインスタンスがまだ終了処理中のときは start() が例外を投げる。少し待って張り直す。
      this.scheduleRestart();
    }
  }
}

let voices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  if (!isSpeechSupported()) return;
  voices = window.speechSynthesis.getVoices();
}

export function warmUpVoices() {
  if (!isSpeechSupported()) return;
  refreshVoices();
  window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
}

let primed = false;

/**
 * iOS は画面操作を起点にしないと読み上げを始められない。
 * 「開始」を押した瞬間に無音を1回流して、あとから自動で喋れるようにする。
 */
export function primeSpeech() {
  if (primed || !isSpeechSupported()) return;
  primed = true;
  const utterance = new SpeechSynthesisUtterance(" ");
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech() {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}

export function speak(text: string, lang: string) {
  return new Promise<void>((resolve) => {
    if (!isSpeechSupported() || !text.trim()) {
      resolve();
      return;
    }
    if (voices.length === 0) refreshVoices();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const prefix = lang.split("-")[0];
    const voice = voices.find((item) => item.lang === lang) ?? voices.find((item) => item.lang.startsWith(prefix));
    if (voice) utterance.voice = voice;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    // 読み上げが始まらないまま止まると認識が戻らなくなるので、保険で必ず解放する。
    setTimeout(finish, 20_000);

    window.speechSynthesis.speak(utterance);
  });
}
