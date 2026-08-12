import type { Metadata } from "next";
import Game from "./Game";

const title = "大河の一滴";
const description =
  "一滴の水になり、地球を何千年も旅する分岐型シミュレーション。山へ、森へ、地下へ、人の体へ、氷河へ、海へ。ゲームオーバーはなく、どこへ行っても旅は続く。";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://drop.hitobito.jp",
  },
  openGraph: {
    title,
    description,
    url: "https://drop.hitobito.jp",
    siteName: title,
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function DropHome() {
  return <Game />;
}
