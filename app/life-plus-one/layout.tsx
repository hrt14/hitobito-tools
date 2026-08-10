import type { Metadata } from "next";

const description = "今日増えたものを見つけて、人生の累計として残すLIFE +1アプリ。";

export const metadata: Metadata = {
  title: { absolute: "LIFE +1 アプリ" },
  description,
  alternates: { canonical: "https://life1.hitobito.jp/app" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "LIFE +1 アプリ",
    description,
    url: "https://life1.hitobito.jp/app",
    siteName: "LIFE +1",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LIFE +1 アプリ",
    description,
  },
};

export default function LifePlusOneAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
