import type { Metadata } from "next";
import LevelUpHomeButton from "../../../components/LevelUpHomeButton";
import YesterdaySelfGame from "./YesterdaySelfGame";

export const metadata: Metadata = {
  title: { absolute: "昨日の自分に1勝 | LEVEL UP" },
  description:
    "他人との比較をやめて、今日ひとつだけ昨日の自分を超える。比較相手を画面から外し、昨日の自分との1対1に戻すLEVEL UP。",
  alternates: { canonical: "https://levelup.hitobito.jp/yesterday-self" },
};

export default function YesterdaySelfPage() {
  return (
    <>
      <YesterdaySelfGame />
      <LevelUpHomeButton />
    </>
  );
}
