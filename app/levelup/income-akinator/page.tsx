import type { Metadata } from "next";
import IncomeAkinatorGame from "./IncomeAkinatorGame";

export const metadata: Metadata = {
  title: { absolute: "年収アキネーター｜はい・いいえだけで職業と年収を当てる | LEVEL UP" },
  description:
    "入力なし。はい・いいえだけの質問で候補職業を絞り込み、最後に職業と年収を推理するゲーム。",
  alternates: { canonical: "https://levelup.hitobito.jp/income-akinator" },
};

export default function IncomeAkinatorPage() {
  return <IncomeAkinatorGame />;
}
