import type { Metadata } from "next";
import LevelUpHomeButton from "../../../components/LevelUpHomeButton";
import ConfidenceBeforeResultsGame from "./ConfidenceBeforeResultsGame";

const PUBLIC_URL = "https://hitobito.jp/levelup/confidence-before-results";

export const metadata: Metadata = {
  title: { absolute: "結果が出る前に自信をつくる | LEVEL UP" },
  description:
    "実績や成功の証拠を待たずに、次の一手を出せる自信を先に入れる。迷いを行動・修正・継続へ変える60秒のLEVEL UP。",
  alternates: { canonical: PUBLIC_URL },
};

export default function ConfidenceBeforeResultsPage() {
  return (
    <>
      <ConfidenceBeforeResultsGame />
      <LevelUpHomeButton href="https://hitobito.jp/levelup/" />
    </>
  );
}
