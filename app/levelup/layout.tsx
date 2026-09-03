import type { Metadata } from "next";
import LevelUpAnalytics from "@/components/LevelUpAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://levelup.hitobito.jp"),
  applicationName: "LEVEL UP",
  openGraph: {
    title: "LEVEL UP — 考え方は、遊んで鍛える。",
    description:
      "着手、分解、集中、切り替え、自己理解など、日常で使う考え方の癖をゲームで反復する hitobito LEVEL UP。",
    url: "https://levelup.hitobito.jp/",
    siteName: "LEVEL UP",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "LEVEL UP — 考え方は、遊んで鍛える。",
    description:
      "着手、分解、集中、切り替え、自己理解など、日常で使う考え方の癖をゲームで反復する hitobito LEVEL UP。",
  },
};

export default function LevelUpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <LevelUpAnalytics />
    </>
  );
}
