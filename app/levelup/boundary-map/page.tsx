import type { Metadata } from "next";
import BoundaryMapGame from "./BoundaryMapGame";

export const metadata: Metadata = {
  title: { absolute: "頼まれると断れず疲れる人の 境界線マップ | LEVEL UP" },
  description:
    "20個の頼まれごとに「引き受ける／断る」で答え、時間・お金・感情・価値観のどこですり減りやすいかを可視化する。結果はカード画像でシェアできる。",
  alternates: { canonical: "https://levelup.hitobito.jp/boundary-map" },
};

export default function BoundaryMapPage() {
  return <BoundaryMapGame />;
}
