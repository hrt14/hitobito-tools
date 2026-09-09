import type { Metadata } from "next";
import EarhonyaProduct from "../ear-hub/EarhonyaProduct";

export const metadata: Metadata = {
  title: "イヤホニャ！ | いつものイヤホンを、AIイヤホンに。",
  description: "手持ちのイヤホンとスマホだけでAI議事録とAI通訳を使える、AIイヤホン化アプリ。",
};

export default function EarhonyaPage() {
  return <EarhonyaProduct />;
}
