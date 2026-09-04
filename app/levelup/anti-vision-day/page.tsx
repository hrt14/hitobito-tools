import type { Metadata } from "next";
import AntiVisionDayApp from "./AntiVisionDayApp";

export const metadata: Metadata = {
  title: { absolute: "『このままの5年後は嫌だ』を明日の一手に変える | LEVEL UP" },
  description:
    "朝に『このままの未来』と『選びたい未来』を描き、昼に5回チェックインし、夜に1年・1か月・明日の一手まで落とす1日アンチビジョン。",
  alternates: {
    canonical: "https://levelup.hitobito.jp/anti-vision-day",
  },
};

export default function AntiVisionDayPage() {
  return <AntiVisionDayApp />;
}
