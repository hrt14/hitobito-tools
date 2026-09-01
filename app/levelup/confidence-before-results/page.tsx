import type { Metadata } from "next";
import LevelUpHomeButton from "../../../components/LevelUpHomeButton";
import ConfidenceBeforeResultsGame from "./ConfidenceBeforeResultsGame";

export const metadata: Metadata = {
  title: { absolute: "結果が出る前に自信をつくる | LEVEL UP" },
  description:
    "実績や成功の証拠を待たずに、次の一手を出せる自信を先に入れる。迷いを行動・修正・継続へ変える60秒のLEVEL UP。",
  alternates: { canonical: "https://levelup.hitobito.jp/confidence-before-results" },
};

export default function ConfidenceBeforeResultsPage() {
  return (
    <>
      <ConfidenceBeforeResultsGame />
      <LevelUpHomeButton />
    </>
  );
}
