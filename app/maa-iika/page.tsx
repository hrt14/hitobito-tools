import type { Metadata } from "next";
import MaaIikaGame from "./game";

export const metadata: Metadata = {
  title: { absolute: "まあ、いいか。 | LEVEL UP" },
  description:
    "予定外の出来事に抵抗し続けず、事実を受け取って次へ進む反射を鍛える LEVEL UP ゲーム。",
  alternates: { canonical: "https://levelup.hitobito.jp/maa-iika" },
};

export default function MaaIikaPage() {
  return <MaaIikaGame />;
}
