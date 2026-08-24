import type { Metadata } from "next";
import UnfairBlameGame from "./UnfairBlameGame";

export const metadata: Metadata = {
  title: { absolute: "悪くないのに責められ、行動まで制限されたとき 自分を守って動く練習 | LEVEL UP" },
  description:
    "相手の断定を事実にしない。根拠・思い込み・行動制限を切り分け、自分に残っている選択権を確認し、落ち着いて次の一手を選ぶ練習。",
  alternates: { canonical: "https://levelup.hitobito.jp/unfair-blame" },
};

export default function UnfairBlamePage() {
  return <UnfairBlameGame />;
}
