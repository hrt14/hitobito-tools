import type { Metadata } from "next";
import RyomaBigPictureGame from "./RyomaBigPictureGame";

export const metadata: Metadata = {
  title: { absolute: "目先に振り回されない 坂本龍馬に学ぶ「大きく考える」練習 | LEVEL UP" },
  description:
    "目的・時間・人・手段の4方向へ視野を広げてから一手を選ぶ。坂本龍馬の行動史実をヒントに、目先の損得や対立に飲まれず大きく考える練習。",
  alternates: { canonical: "https://levelup.hitobito.jp/ryoma-big-picture" },
};

export default function RyomaBigPicturePage() {
  return <RyomaBigPictureGame />;
}
