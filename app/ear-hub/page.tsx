import type { Metadata } from "next";
import EarHubStore from "./EarHubStore";

export const metadata: Metadata = {
  title: "Ear Hub",
  description:
    "いま持っているイヤホンに、翻訳・議事録・聞き逃し防止などの機能をアプリのように追加する、耳の機能拡張プラットフォーム。",
  alternates: { canonical: "https://tools.hitobito.jp/ear-hub" },
};

export default function EarHubPage() {
  return <EarHubStore />;
}
