import type { Metadata } from "next";
import EarHub from "./EarHub";

export const metadata: Metadata = {
  title: "Ear Hub",
  description:
    "いま持っているイヤホンを、翻訳機と議事録機にする。スマホをセントラルにして、モジュールを足すだけで耳の機能が増えるイヤホン機能拡張アプリ。",
  alternates: { canonical: "https://tools.hitobito.jp/ear-hub" },
};

export default function EarHubPage() {
  return <EarHub />;
}
