import type { Metadata } from "next";
import Life1Analytics from "@/components/Life1Analytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hitobito.jp"),
  title: {
    default: "hitobito Tools",
    template: "%s | hitobito Tools",
  },
  description:
    "暮らしや学びの中にある「あと少し」を助ける、小さなWebツールのポータル。",
  applicationName: "hitobito Tools",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "hitobito Tools",
    description:
      "暮らしや学びの中にある「あと少し」を助ける、小さなWebツールのポータル。",
    url: "/",
    siteName: "hitobito Tools",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "hitobito Tools",
    description:
      "暮らしや学びの中にある「あと少し」を助ける、小さなWebツールのポータル。",
  },
  icons: {
    icon: "/favicon-tools.svg",
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "hitobito Tools",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Life1Analytics />
      </body>
    </html>
  );
}
