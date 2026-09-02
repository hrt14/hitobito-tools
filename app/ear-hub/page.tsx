import type { Metadata } from "next";
import EarHubStore from "./EarHubStore";

export const metadata: Metadata = {
  title: "DIGIL CLOUD",
  description:
    "イヤホン、ボイスレコーダー、スマートグラスにAIアプリを追加して、ハードを買い替えずに機能だけ増やすデバイスアプリストア。",
  alternates: { canonical: "https://dc.hitobito.jp/" },
};

export default function DigilCloudPage() {
  return <EarHubStore />;
}
