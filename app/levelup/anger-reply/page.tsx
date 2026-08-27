import type { Metadata } from "next";
import AngerReplyGame from "./AngerReplyGame";

export const metadata: Metadata = {
  title: { absolute: "NEGOTIATOR｜怒りの返信をやめろ | LEVEL UP" },
  description:
    "怒った勢いでメール・チャット・SNSを返しそうな瞬間に、交渉で送信までの距離をつくる。大きな保留を断っても、もっと小さな提案で続くNEGOTIATORシリーズ。",
  alternates: { canonical: "https://hitobito.jp/levelup/anger-reply" },
};

export default function AngerReplyPage() {
  return <AngerReplyGame />;
}
