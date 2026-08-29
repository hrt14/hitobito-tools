import type { Metadata } from "next";
import LifeMovieApp from "./LifeMovieApp";

export const metadata: Metadata = {
  title: { absolute: "あなたの人生を映画にしたら？ | LEVEL UP" },
  description:
    "8つのシーンを選ぶと、あなたの人生映画のジャンル・現在のチャプター・主人公属性・最大の伏線・次回予告を映画ポスターにします。",
  alternates: { canonical: "https://levelup.hitobito.jp/life-movie" },
  openGraph: {
    title: "あなたの人生を映画にしたら？ | LEVEL UP",
    description: "いまの自分を一本の映画にすると？ 8シーンで人生の現在地を映画ポスター化。",
    url: "https://levelup.hitobito.jp/life-movie",
    siteName: "LEVEL UP",
    type: "website",
  },
};

export default function LifeMoviePage() {
  return <LifeMovieApp />;
}
