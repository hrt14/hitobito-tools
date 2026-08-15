import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "START — 3分だけやる。 | LEVEL UP" },
  description:
    "宿題を終わらせるのではなく、始める力を鍛える高校生向けLEVEL UPゲーム。大きな課題を最初の一手まで小さくする。",
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
        src="https://start-homework.vercel.app/"
        title="START — 3分だけやる。"
        style={{
          width: "100%",
          height: "100%",
          border: 0,
          display: "block",
          background: "#07090d",
        }}
      />
    </main>
  );
}
