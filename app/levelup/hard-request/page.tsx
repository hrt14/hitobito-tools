import type { Metadata } from "next";
import HardRequestGame from "./HardRequestGame";

export const metadata: Metadata = {
  title: { absolute: "揉めそうでも必要なお願いをする | LEVEL UP" },
  description: "相手が嫌がりそうでも、必要なことを攻撃せず・逃げずに伝える。お願いの言い方と、NOや不機嫌でも自分の軸を保つ練習。",
  alternates: { canonical: "https://levelup.hitobito.jp/hard-request" },
};

export default function HardRequestPage() {
  return <HardRequestGame />;
}
