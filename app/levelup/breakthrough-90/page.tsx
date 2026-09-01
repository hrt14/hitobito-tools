import type { Metadata } from "next";
import Breakthrough90 from "./Breakthrough90";

export const metadata: Metadata = {
  title: {
    absolute: "八方塞がりで動けないときの90秒｜次の一手を取り戻す | LEVEL UP",
  },
  description:
    "起業や新しい挑戦で孤独・不安・八方塞がりを感じたときに、10年視点へ引き、他人比較を外し、昨日の自分との差分と次の15分の一手を決めるLEVEL UP。",
  alternates: { canonical: "https://levelup.hitobito.jp/breakthrough-90" },
};

export default function Breakthrough90Page() {
  return <Breakthrough90 />;
}
