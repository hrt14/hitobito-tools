import type { Metadata } from "next";
import DontDecideNow from "./DontDecideNow";

export const metadata: Metadata = {
  title: { absolute: "今は決めるな｜大事な判断をその場で決めない練習 | LEVEL UP" },
  description:
    "怒り、焦り、恐怖、勢いの中で大事な判断をしそうな瞬間に、赤信号を確認して3秒止まり、10分・1時間・明日へ判断を保留するLEVEL UP。",
  alternates: { canonical: "https://levelup.hitobito.jp/dont-decide-now" },
};

export default function DontDecideNowPage() {
  return <DontDecideNow />;
}
