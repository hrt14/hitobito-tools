import type { Metadata } from "next";
import EnergyBucketClient from "./EnergyBucketClient";

export const metadata: Metadata = {
  title: { absolute: "夕方に電池切れする人の 体力の穴を1個ふさぐ | LEVEL UP" },
  description:
    "朝から疲れる、昼食後に眠い、夕方に頭が止まる。体力を足す前に、毎日エネルギーが漏れている場所を見つけ、明日の行動を1個だけIf-Thenで決めるLEVEL UP。",
  alternates: {
    canonical: "https://levelup.hitobito.jp/energy-bucket",
  },
};

export default function EnergyBucketPage() {
  return <EnergyBucketClient />;
}
