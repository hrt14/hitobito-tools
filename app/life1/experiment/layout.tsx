import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "7回だけLIFE +1実験",
  description: "7日連続ではなく、7回だけ今日増えたものを記録するLIFE +1実験。途切れても失敗になりません。",
  alternates: { canonical: "https://life1.hitobito.jp/experiment" },
  openGraph: {
    title: "7回だけLIFE +1実験",
    description: "7日連続ではなく、7回だけ今日増えたものを記録するLIFE +1実験。",
    url: "https://life1.hitobito.jp/experiment",
    type: "website",
  },
};

export default function ExperimentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
