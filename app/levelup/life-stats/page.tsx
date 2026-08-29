import type { Metadata } from "next";
import LifeStatsApp from "./LifeStatsApp";

export const metadata: Metadata = {
  title: { absolute: "人生RPGステータス | LEVEL UP" },
  description: "12問でLV・行動力・知力・社交力・回復力・運・残りHPをRPGカード化。職業、二つ名、特殊能力まで判定して画像でシェアできます。",
  alternates: { canonical: "https://levelup.hitobito.jp/life-stats" },
  openGraph: {
    title: "人生RPGステータス | LEVEL UP",
    description: "いまの自分をRPGのステータス画面にすると？ 12問で職業・二つ名・特殊能力まで判定。",
    url: "https://levelup.hitobito.jp/life-stats",
    siteName: "LEVEL UP",
    type: "website",
  },
};

export default function LifeStatsPage() {
  return <LifeStatsApp />;
}
