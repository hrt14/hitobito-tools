import type { Metadata } from "next";
import LevelUpHomeButton from "../../../components/LevelUpHomeButton";
import ShortVideoNegotiator from "./ShortVideoNegotiator";

export const metadata: Metadata = {
  title: { absolute: "小動画やめろ | NEGOTIATOR | LEVEL UP" },
  description:
    "ショート動画をやめる気がない自分と交渉する。拒否するほど要求を小さくして、3秒の停止から離脱まで持っていくNEGOTIATORシリーズ。",
  alternates: { canonical: "https://levelup.hitobito.jp/stop-short-videos" },
};

export default function StopShortVideosPage() {
  return (
    <>
      <ShortVideoNegotiator />
      <LevelUpHomeButton />
    </>
  );
}
