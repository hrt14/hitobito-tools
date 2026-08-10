import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LIFE +1 アプリ",
  description: "今日増えたものを見つけて、人生の累計として残すLIFE +1アプリ。",
  alternates: { canonical: "https://life1.hitobito.jp/app" },
  robots: { index: true, follow: true },
};

export default function LifePlusOneAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
