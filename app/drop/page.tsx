import type { Metadata } from "next";
import DropGame from "./DropGame";

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

// MVP v0.1.1: playable water-cycle vertical slice.
export default function DropHome() {
  return <DropGame />;
}
