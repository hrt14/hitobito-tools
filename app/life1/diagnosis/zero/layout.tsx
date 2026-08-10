import type { Metadata } from "next";

const title = "今日は本当に+0？｜LIFE +1診断";
const description = "何もできなかったと思う日の中に、事実として増えたものがあるかを確認する無料のLIFE +1診断。無理にポジティブ変換しません。";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "https://life1.hitobito.jp/diagnosis/zero" },
  openGraph: {
    title,
    description,
    url: "https://life1.hitobito.jp/diagnosis/zero",
    siteName: "LIFE +1",
    type: "website",
    locale: "ja_JP",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function ZeroDiagnosisLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
