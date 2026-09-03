import type { Metadata } from "next";
import LevelUpHomeButton from "../../../components/LevelUpHomeButton";
import StopSelfScoringGame from "./StopSelfScoringGame";

export const metadata: Metadata = {
  title: { absolute: "気を使いすぎて疲れる人の『心の採点』をやめる練習 | LEVEL UP" },
  description:
    "相手の反応を勝手に翻訳せず、見直しの終わりを決め、自分への追撃を止め、小さな行動実験で思い込みを確かめるLEVEL UP。",
  alternates: { canonical: "https://levelup.hitobito.jp/stop-self-scoring" },
};

export default function StopSelfScoringPage() {
  return (
    <>
      <StopSelfScoringGame />
      <LevelUpHomeButton />
    </>
  );
}
