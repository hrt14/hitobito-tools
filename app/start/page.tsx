import type { Metadata } from "next";
import LevelUpHomeButton from "../../components/LevelUpHomeButton";

export const metadata: Metadata = {
  title: { absolute: "START — MBTIで、動き出せる。 | LEVEL UP" },
  description:
    "MBTIを入口に、自分に合う始め方で宿題の最初の一歩を出す高校生向けLEVEL UPゲーム。",
  alternates: { canonical: "https://levelup.hitobito.jp/start" },
};

export default function StartGamePage() {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        background: "#07090d",
      }}
    >
      <iframe
        src="/start-game.html"
        title="START — MBTIで、動き出せる。"
        style={{
          width: "100%",
          height: "100%",
          border: 0,
          display: "block",
          background: "#07090d",
        }}
      />
      <LevelUpHomeButton />
    </main>
  );
}
