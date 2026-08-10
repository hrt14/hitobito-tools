import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://life1.hitobito.jp"),
  title: {
    default: "LIFE +1｜今日も、人生の累計最高記録。",
    template: "%s｜LIFE +1",
  },
  description: "減ったものだけでなく、人生に増えたものを見る。経験・学び・作品・関係・挑戦を累計で捉えるLIFE +1。",
  alternates: { canonical: "/" },
  openGraph: {
    title: "LIFE +1｜今日も、人生の累計最高記録。",
    description: "減ったものだけでなく、人生に増えたものを見る。",
    url: "https://life1.hitobito.jp",
    siteName: "LIFE +1",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LIFE +1｜今日も、人生の累計最高記録。",
    description: "減ったものだけでなく、人生に増えたものを見る。",
  },
};

export default function Life1Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
