import type { Metadata } from "next";
import DropVisualV06 from "./DropVisualV06";

export const metadata: Metadata = {
  title: "一滴 | DROP",
  description: "一滴の水になって、選択しながら地球の水循環を旅するブラウザゲーム。どこへ行っても、旅は続く。",
  alternates: {
    canonical: "https://drop.hitobito.jp",
  },
  openGraph: {
    title: "一滴 | DROP",
    description: "一滴の水になって、地球の水循環を旅する分岐型ブラウザゲーム。",
    url: "https://drop.hitobito.jp",
    siteName: "一滴 | DROP",
    locale: "ja_JP",
    type: "website",
  },
};

// DROP v0.6.1 deployment retry: action explanations, visible reactions, river-first progression, ocean-before-evaporation.
export default function DropHome() {
  return <DropVisualV06 />;
}