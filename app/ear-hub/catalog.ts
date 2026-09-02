import type { ModuleId } from "./modules";

export type GadgetId = "earbuds" | "recorder" | "glasses";
export type CatalogAppId =
  | "translate"
  | "translate-premium"
  | "minutes"
  | "minutes-premium"
  | "watchword"
  | "price-scout";

export type CatalogApp = {
  id: CatalogAppId;
  name: string;
  englishName: string;
  tagline: string;
  description: string;
  category: string;
  icon: string;
  gradient: string;
  gadgets: GadgetId[];
  premium: boolean;
  status: "live" | "preview";
  moduleId?: ModuleId;
  highlights: string[];
};

export const GADGETS: Array<{
  id: GadgetId;
  name: string;
  englishName: string;
  icon: string;
  description: string;
}> = [
  {
    id: "earbuds",
    name: "イヤホン",
    englishName: "Earbuds",
    icon: "🎧",
    description: "マイクとスピーカーを使うアプリに対応",
  },
  {
    id: "recorder",
    name: "ボイスレコーダー",
    englishName: "Voice Recorder",
    icon: "🎙️",
    description: "録音・文字起こし・記録系アプリに対応",
  },
  {
    id: "glasses",
    name: "スマートグラス",
    englishName: "Smart Glasses",
    icon: "👓",
    description: "マイク・スピーカー・カメラを使うアプリに対応",
  },
];

export const APP_CATALOG: CatalogApp[] = [
  {
    id: "translate",
    name: "リアルタイム翻訳",
    englishName: "Live Translate",
    tagline: "相手の声を、そのまま自分の言葉で耳へ。",
    description: "話しかけられた音声を認識し、AIで翻訳してイヤホンやスマートグラスへ返します。",
    category: "コミュニケーション",
    icon: "文",
    gradient: "linear-gradient(145deg, #405cf5, #8c4dff 58%, #d065ff)",
    gadgets: ["earbuds", "glasses"],
    premium: false,
    status: "live",
    moduleId: "translate",
    highlights: ["リアルタイム翻訳", "音声読み上げ", "10言語対応"],
  },
  {
    id: "translate-premium",
    name: "リアルタイム翻訳 Premium",
    englishName: "Live Translate Premium",
    tagline: "長時間会話、専門用語、会話履歴まで。",
    description: "サブスク向けの上位版。高精度モデル、専門辞書、長時間セッションなどを追加する構想です。",
    category: "コミュニケーション",
    icon: "文+",
    gradient: "linear-gradient(145deg, #0f1635, #4b2ca5 60%, #b053ff)",
    gadgets: ["earbuds", "glasses"],
    premium: true,
    status: "preview",
    highlights: ["高精度AI", "専門辞書", "長時間セッション"],
  },
  {
    id: "minutes",
    name: "会議文字起こし",
    englishName: "Meeting Notes",
    tagline: "会議を聞かせて、止めたら議事録ができる。",
    description: "会議中は端末側で文字起こしし、停止時だけAIで要約・決定事項・ToDoを生成します。",
    category: "仕事効率化",
    icon: "録",
    gradient: "linear-gradient(145deg, #ff7a18, #ff3d68 58%, #c933ff)",
    gadgets: ["earbuds", "recorder", "glasses"],
    premium: false,
    status: "live",
    moduleId: "minutes",
    highlights: ["文字起こし", "AI議事録", "Drive保存"],
  },
  {
    id: "minutes-premium",
    name: "会議文字起こし Premium",
    englishName: "Meeting Notes Premium",
    tagline: "会議を資産にする、チーム向け上位版。",
    description: "話者分離、検索、会議横断のナレッジ化などを想定したサブスク版のコンセプトです。",
    category: "仕事効率化",
    icon: "録+",
    gradient: "linear-gradient(145deg, #31130c, #a32932 55%, #ff6542)",
    gadgets: ["earbuds", "recorder", "glasses"],
    premium: true,
    status: "preview",
    highlights: ["話者分離", "横断検索", "チーム共有"],
  },
  {
    id: "watchword",
    name: "ウォッチワード",
    englishName: "Watchword",
    tagline: "聞き逃したくない言葉だけ、耳で知らせる。",
    description: "「予算」「締め切り」など指定語を検知したら、その場で音声通知します。AI APIは使いません。",
    category: "ユーティリティ",
    icon: "◎",
    gradient: "linear-gradient(145deg, #16a779, #19c39a 58%, #77e66a)",
    gadgets: ["earbuds", "glasses"],
    premium: false,
    status: "live",
    moduleId: "watchword",
    highlights: ["指定語検知", "端末内処理", "音声通知"],
  },
  {
    id: "price-scout",
    name: "価格比較スカウト",
    englishName: "Price Scout",
    tagline: "見るか、読み上げるだけで、一番安い価格を探す。",
    description: "スマートグラスならバーコードを見て、イヤホンなら商品名や型番を読み上げて価格比較する構想です。",
    category: "ショッピング",
    icon: "¥",
    gradient: "linear-gradient(145deg, #0077ff, #00a8ff 52%, #21d4bd)",
    gadgets: ["earbuds", "glasses"],
    premium: false,
    status: "preview",
    highlights: ["バーコード認識", "商品名音声入力", "最安価格検索"],
  },
];

export function catalogById(id: string) {
  return APP_CATALOG.find((app) => app.id === id);
}
