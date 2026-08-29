import type { Metadata } from "next";
import LifeStatsApp from "./LifeStatsApp";

export const metadata: Metadata = {
  title: { absolute: "人生ステータス診断 | LEVEL UP" },
  description: "12問で、行動力・集中力・立て直し力・対人力・好奇心の5つを見える化。あなたは何に能力値を振ってきた？",
  alternates: { canonical: "https://levelup.hitobito.jp/life-stats" },
  openGraph: {
    title: "人生ステータス診断 | LEVEL UP",
    description: "あなたは、何に能力値を振ってきた？ 12問で5つの人生ステータスを見える化。",
    url: "https://levelup.hitobito.jp/life-stats",
    siteName: "LEVEL UP",
    type: "website",
  },
};

export default function LifeStatsPage() {
  return <LifeStatsApp />;
}
