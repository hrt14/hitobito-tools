import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { absolute: "Drive Recorder | hitobito Tools" },
  description: "iPhoneやPCのマイク音声を録音し、指定したGoogle Driveフォルダへ生の音声ファイルを保存するシンプルなレコーダー。",
  alternates: { canonical: "https://tools.hitobito.jp/drive-recorder" },
  manifest: "/drive-recorder/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Drive Recorder",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0d100e" },
  ],
};

export default function DriveRecorderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
