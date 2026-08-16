import type { Metadata } from "next";
import SelfManagementGame from "./SelfManagementGame";
import compact from "./compact.module.css";

export const metadata: Metadata = {
  title: { absolute: "自分を回せ | LEVEL UP" },
  description:
    "体力、集中、ストレス、脳内WIPを見ながら、その瞬間に最適な行動を選ぶ自己管理トレーニングゲーム。",
  alternates: { canonical: "https://levelup.hitobito.jp/self-management" },
};

export default function SelfManagementPage() {
  return (
    <div className={compact.viewport}>
      <SelfManagementGame />
    </div>
  );
}
