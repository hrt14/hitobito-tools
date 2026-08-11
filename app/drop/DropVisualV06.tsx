"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./dropV05.module.css";

type Area = "cloud" | "leaf" | "pond" | "soil" | "groundwater" | "spring" | "river" | "ocean" | "vapor" | "cloudReturn";
type Visual =
  | "cloud" | "cloudCold" | "cloudMerge" | "fall"
  | "leaf" | "leafTip" | "leafMerge" | "leafFrog" | "leafSpider" | "leafWind"
  | "pond" | "pondOut" | "pondMud"
  | "soil" | "soilRoot" | "soilGap" | "soilSlope" | "rootInside"
  | "groundwater" | "groundDeep" | "spring"
  | "river" | "riverRapid" | "riverEddy" | "riverSurface"
  | "ocean" | "oceanDeep" | "oceanWhale" | "oceanSurface"
  | "vapor" | "condense" | "cloudReturn";
type Pose = "idle" | "fall" | "flow" | "slide" | "squash" | "rise" | "merge" | "trapped" | "evaporate" | "condense";
type Step = { visual: Visual; text: string; duration: number; minutes?: number; pose?: Pose; discovery?: string; timeLabel?: string; cycle?: boolean };
type Choice = { id: string; label: string; icon: string; explain: string; hotspot: { x: number; y: number }; steps: Step[]; to: Area };
type AreaNode = { id: Area; title: string; phase: string; visual: Visual; choices: Choice[] };
type Active = { choice: Choice; index: number };

const HOUR = 60;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;

const discoveryCatalog: Record<string, { title: string; description: string }> = {
  rain: { title: "雨になった", description: "雲の中で育った一滴が、重力に引かれて地上へ落ち始めた。" },
  leaf: { title: "巨大な葉", description: "一滴から見ると、葉脈は谷のように巨大だ。" },
  frog: { title: "カエルの中", description: "葉から落ちた一滴が、生き物の体内を通った。" },
  spider: { title: "蜘蛛の巣", description: "細い糸に表面張力で捕まった。" },
  tree: { title: "木の中", description: "根から吸われ、木の導管を上へ運ばれた。" },
  groundwater17: { title: "17年の地下旅行", description: "地表の時間とはまるで違う速度で地下水が進んだ。" },
  groundwater83: { title: "83年の暗闇", description: "深い岩盤の隙間を、人の一生ほどの時間かけて移動した。" },
  spring: { title: "湧水", description: "地下水が地表へ戻り、沢の始まりになった。" },
  river: { title: "川へ到達", description: "小さな一滴が、ついに大きな流れの一部になった。" },
  ocean: { title: "海へ到達", description: "川の旅を抜け、巨大な海へたどり着いた。" },
  deepOcean: { title: "140年の深海", description: "冷たい海流に乗り、光の届かない深い海を旅した。" },
  whale: { title: "クジラの中", description: "巨大な生き物に取り込まれ、また海へ戻った。" },
  vapor: { title: "蒸発", description: "海面で熱を受け、一滴の形を失って空へ上がった。" },
  cycle: { title: "そして、また雨へ", description: "空へ戻った水が再び集まり、次の旅を始める。" },
};

const areas: Record<Area, AreaNode> = {
  cloud: {
    id: "cloud", title: "雲", phase: "液体", visual: "cloud", choices: [
      { id: "edge", label: "雲の端", icon: "↘", explain: "雲の端は水滴を支える上昇気流が弱い。縁へ出ると、一滴は地上へ落ちやすくなる。", hotspot: { x: 82, y: 36 }, to: "leaf", steps: [
        { visual: "fall", pose: "fall", duration: 1250, minutes: 6, discovery: "rain", text: "雲の縁を抜けた。重力に引かれ、一滴が地上へ落ち始める。" },
        { visual: "leafTip", pose: "squash", duration: 1050, minutes: 2, discovery: "leaf", text: "森が迫る。巨大な葉が受け皿になり、一滴を受け止めた。" },
      ]},
      { id: "cold", label: "冷たい粒", icon: "❄", explain: "冷たい場所では周囲の小さな水滴が集まりやすい。大きくなれば、その重さで落下が始まる。", hotspot: { x: 22, y: 24 }, to: "leaf", steps: [
        { visual: "cloudCold", pose: "merge", duration: 950, discovery: "rain", text: "冷たい空気の中で、細かな水滴があなたへ集まってくる。" },
        { visual: "fall", pose: "fall", duration: 1250, minutes: 10, text: "大きく、重くなった。雲の流れから外れ、一気に落下する。" },
        { visual: "leaf", pose: "squash", duration: 1050, discovery: "leaf", text: "落下先は森。大きな葉の表面で止まった。" },
      ]},
      { id: "merge", label: "水滴", icon: "●", explain: "水滴同士が触れると表面張力で一つになる。大きくなった一滴は、雲に残りにくくなる。", hotspot: { x: 52, y: 31 }, to: "leaf", steps: [
        { visual: "cloudMerge", pose: "merge", duration: 1000, text: "隣の水滴と接触。二つの輪郭が、一つの大きな一滴に変わる。" },
        { visual: "fall", pose: "fall", duration: 1200, minutes: 7, discovery: "rain", text: "重さが増した瞬間、雲から落ちた。" },
        { visual: "leaf", pose: "squash", duration: 1000, discovery: "leaf", text: "葉に着地。ここから地上の旅が始まる。" },
      ]},
    ],
  },
  leaf: {
    id: "leaf", title: "巨大な葉", phase: "液体", visual: "leaf", choices: [
      { id: "tip", label: "葉先", icon: "↓", explain: "葉の表面にはわずかな傾斜がある。葉先へ行けば、重力に押されて地面へ落ちる可能性が高い。", hotspot: { x: 88, y: 58 }, to: "soil", steps: [
        { visual: "leafTip", pose: "slide", duration: 750, text: "葉脈の坂を滑り、先端へ。表面張力だけでぶら下がっている。" },
        { visual: "leafFrog", pose: "fall", duration: 850, discovery: "frog", text: "その瞬間、下からカエルが跳ねた。あなたは口の中へ。" },
        { visual: "fall", pose: "fall", duration: 850, minutes: 2 * HOUR, text: "しばらくして体外へ。再び水滴として地面へ落ちる。" },
        { visual: "soil", pose: "squash", duration: 1050, text: "土の表面に到着。ここから水はさらに下か、横の流れへ進む。" },
      ]},
      { id: "drop", label: "隣の水滴", icon: "●", explain: "別の水滴と合体すると重さが増える。軽い一滴では止まれた場所でも、動き出しやすくなる。", hotspot: { x: 65, y: 43 }, to: "soil", steps: [
        { visual: "leafMerge", pose: "merge", duration: 900, text: "隣の水滴と一つになった。葉がわずかに沈むほど重くなる。" },
        { visual: "leafSpider", pose: "trapped", duration: 1050, discovery: "spider", text: "葉から転がり落ちた先は蜘蛛の巣。細い糸に捕まった。" },
        { visual: "fall", pose: "fall", duration: 850, minutes: 7, text: "風で糸が揺れ、ついに外れた。今度こそ地面へ。" },
        { visual: "soil", pose: "squash", duration: 1000, text: "土粒の間に入り込んだ。" },
      ]},
      { id: "vein", label: "葉脈", icon: "⌁", explain: "葉脈のくぼみは小さな水路になる。そこへ入ると、葉の傾きに沿って水が運ばれる。", hotspot: { x: 35, y: 64 }, to: "soil", steps: [
        { visual: "leafWind", pose: "flow", duration: 850, text: "葉脈の溝へ入った。細い水の道が、一滴を端へ運んでいく。" },
        { visual: "fall", pose: "fall", duration: 800, minutes: 5, text: "風で葉が傾いた。溝から押し出され、そのまま落下する。" },
        { visual: "soil", pose: "squash", duration: 1050, text: "地面へ。蒸発せず、地上の水の旅を続ける。" },
      ]},
    ],
  },
  pond: {
    id: "pond", title: "池", phase: "液体", visual: "pond", choices: [
      { id: "out", label: "流出口", icon: "→", explain: "池の水も完全には止まっていない。低い場所にある流出口から沢へつながっている。", hotspot: { x: 84, y: 43 }, to: "river", steps: [
        { visual: "pondOut", pose: "flow", duration: 850, text: "水面の端に、一方向だけ動いている場所がある。そこが流出口だ。" },
        { visual: "river", pose: "flow", duration: 1200, minutes: 5 * HOUR, discovery: "river", text: "細い沢が合流を重ね、ついに川になった。" },
      ]},
      { id: "mud", label: "泥の底", icon: "↓", explain: "池の底へ沈んだ水は泥へ染み込む。ただし地下へ入った水も、やがて湧水や川へ戻る。", hotspot: { x: 42, y: 81 }, to: "river", steps: [
        { visual: "pondMud", pose: "fall", duration: 850, text: "静かな底へ沈み、泥の隙間へ入り込む。" },
        { visual: "soilGap", pose: "flow", duration: 900, minutes: 8 * HOUR, text: "泥の下で横方向の水の流れをつかまえた。" },
        { visual: "river", pose: "flow", duration: 1200, minutes: DAY, discovery: "river", text: "地下の浅い流れが沢へ出た。水は川へ合流する。" },
      ]},
      { id: "move", label: "動く水面", icon: "≈", explain: "風で押された表面の水は池の端へ集まり、やがて流出口へ運ばれる。", hotspot: { x: 55, y: 28 }, to: "river", steps: [
        { visual: "pondOut", pose: "flow", duration: 850, text: "風に押されて、水面を横切る。" },
        { visual: "river", pose: "flow", duration: 1200, minutes: 7 * HOUR, discovery: "river", text: "池の外へ。沢を抜けて川へ出た。" },
      ]},
    ],
  },
  soil: {
    id: "soil", title: "土の中", phase: "液体", visual: "soil", choices: [
      { id: "root", label: "根", icon: "⌇", explain: "根の表面には水を取り込む細かな構造がある。近づけば植物の中へ吸い上げられる。", hotspot: { x: 34, y: 46 }, to: "river", steps: [
        { visual: "soilRoot", pose: "flow", duration: 850, text: "巨大な根へ近づく。水を引く力に捕まった。" },
        { visual: "rootInside", pose: "rise", duration: 1200, minutes: 3 * HOUR, discovery: "tree", text: "木の中へ。細い導管を、地上へ向かって上昇する。" },
        { visual: "leafTip", pose: "squash", duration: 850, minutes: DAY, text: "葉まで到達。今回は水孔から再び液体の水として外へ出た。" },
        { visual: "river", pose: "flow", duration: 1250, minutes: 5 * HOUR, discovery: "river", text: "葉から落ちた水は斜面の沢へ入り、川へ合流した。" },
      ]},
      { id: "gap", label: "岩の隙間", icon: "◇", explain: "岩の隙間へ入ると、地表とは比べものにならないほどゆっくりした地下水の旅になる。", hotspot: { x: 64, y: 79 }, to: "groundwater", steps: [
        { visual: "soilGap", pose: "fall", duration: 900, text: "暗い岩の隙間へ。地表の光が上へ遠ざかる。" },
        { visual: "groundwater", pose: "flow", duration: 1100, minutes: 2 * DAY, text: "岩盤の中に横へ流れる水脈を見つけた。" },
      ]},
      { id: "slope", label: "横の流れ", icon: "→", explain: "土の浅いところには斜面に沿う水の流れがある。その水は沢を作り、川へ集まる。", hotspot: { x: 84, y: 61 }, to: "river", steps: [
        { visual: "soilSlope", pose: "flow", duration: 900, text: "土粒の間を横方向へ流される。下ではなく、斜面の低い方へ。" },
        { visual: "river", pose: "flow", duration: 1250, minutes: DAY, discovery: "river", text: "地表へ出た流れが沢になり、そのまま川へ合流した。" },
      ]},
    ],
  },
  groundwater: {
    id: "groundwater", title: "地下水", phase: "液体", visual: "groundwater", choices: [
      { id: "sand", label: "砂の層", icon: "→", explain: "砂や砂利が多い層は水が通りやすい。ゆっくりでも、出口のある方向へ流れていく。", hotspot: { x: 80, y: 55 }, to: "spring", steps: [
        { visual: "groundwater", pose: "flow", duration: 900, text: "粒の大きい層へ入ると、地下水の流れが少し速くなった。" },
        { visual: "groundDeep", pose: "flow", duration: 1800, minutes: 17 * YEAR, discovery: "groundwater17", timeLabel: "17 YEARS", text: "地上では17年が過ぎた。それでも地下では、少しずつ前へ進んでいる。" },
        { visual: "spring", pose: "rise", duration: 1200, discovery: "spring", text: "岩の切れ目の先から光が差す。地下水が湧水として地上へ戻った。" },
      ]},
      { id: "deep", label: "深い割れ目", icon: "↓", explain: "深い岩盤へ入るほど水の移動は遅くなる。長い時間をかけても、最終的には出口へ向かう。", hotspot: { x: 60, y: 82 }, to: "spring", steps: [
        { visual: "groundDeep", pose: "fall", duration: 950, text: "さらに深い割れ目へ。地表の気配が完全に消えた。" },
        { visual: "groundDeep", pose: "flow", duration: 1900, minutes: 83 * YEAR, discovery: "groundwater83", timeLabel: "83 YEARS", text: "83年。水にとっては、長く静かな移動の途中にすぎない。" },
        { visual: "spring", pose: "rise", duration: 1200, discovery: "spring", text: "長い暗闇の先で、ついに地表へ押し出された。" },
      ]},
      { id: "sound", label: "遠い水音", icon: "≈", explain: "岩の向こうから聞こえる水音は、地下水が地表へ出る出口が近い合図かもしれない。", hotspot: { x: 22, y: 55 }, to: "spring", steps: [
        { visual: "groundwater", pose: "flow", duration: 900, text: "振動のする方向へ水脈をたどる。" },
        { visual: "spring", pose: "rise", duration: 1250, minutes: 2 * YEAR, discovery: "spring", text: "岩の間から外へ。湧水になって再び空が見えた。" },
      ]},
    ],
  },
  spring: {
    id: "spring", title: "湧水", phase: "液体", visual: "spring", choices: [
      { id: "stream", label: "沢", icon: "→", explain: "湧き出した水は低い場所へ集まり、小さな沢になる。沢は合流を重ねて川へ育つ。", hotspot: { x: 78, y: 76 }, to: "river", steps: [
        { visual: "spring", pose: "flow", duration: 800, text: "岩の間から出た水が、一方向へ流れ始める。" },
        { visual: "river", pose: "flow", duration: 1250, minutes: 3 * HOUR, discovery: "river", text: "沢が何本も合流した。水量が増え、ついに川になった。" },
      ]},
      { id: "rock", label: "岩を伝う", icon: "↘", explain: "岩の表面を伝った水も、最後には低い場所の沢へ集まる。", hotspot: { x: 55, y: 35 }, to: "river", steps: [
        { visual: "spring", pose: "slide", duration: 850, text: "濡れた岩の表面を滑っていく。" },
        { visual: "river", pose: "flow", duration: 1200, minutes: 5 * HOUR, discovery: "river", text: "下にあった沢へ入り、その流れが大きな川へつながった。" },
      ]},
      { id: "flow", label: "流れに乗る", icon: "◎", explain: "湧水は止まって見えても、常に新しい水に押されて下流へ流れている。", hotspot: { x: 36, y: 72 }, to: "river", steps: [
        { visual: "river", pose: "flow", duration: 1300, minutes: 4 * HOUR, discovery: "river", text: "後ろから湧き続ける水に押され、沢から川へ運ばれた。" },
      ]},
    ],
  },
  river: {
    id: "river", title: "川", phase: "液体", visual: "river", choices: [
      { id: "rapid", label: "速い流れ", icon: "○", explain: "川の中央は流れが速い。泡に乗れば一気に下流へ運ばれ、川幅も少しずつ大きくなる。", hotspot: { x: 64, y: 57 }, to: "ocean", steps: [
        { visual: "riverRapid", pose: "slide", duration: 1050, text: "泡の集まる速い流れへ。岩が次々と後ろへ飛んでいく。" },
        { visual: "riverSurface", pose: "flow", duration: 1050, minutes: DAY, text: "支流が合流し、川幅が何倍にも広がった。水は海の高さへ近づいている。" },
        { visual: "ocean", pose: "flow", duration: 1500, minutes: 3 * DAY, discovery: "ocean", text: "塩の気配が混じり、川岸が消えた。ついに海へ出た。" },
      ]},
      { id: "rock", label: "岩の裏", icon: "⬡", explain: "岩の裏では一度流れが弱まる。ただし川そのものは止まらない。渦から抜ければ、また下流へ戻る。", hotspot: { x: 30, y: 61 }, to: "ocean", steps: [
        { visual: "riverEddy", pose: "flow", duration: 950, text: "大岩の裏の渦へ入った。少しだけ同じ場所を回る。" },
        { visual: "riverSurface", pose: "flow", duration: 1100, minutes: 5 * HOUR, text: "渦から押し出され、再び本流へ。川はさらに広くなる。" },
        { visual: "ocean", pose: "flow", duration: 1500, minutes: 4 * DAY, discovery: "ocean", text: "流れの先で水平線が開いた。別ルートでも、川は海へつながっていた。" },
      ]},
      { id: "surface", label: "広い水面", icon: "☀", explain: "川下ほど川幅は広がり、水面は穏やかになる。ここでは蒸発せず、河口まで流れを追う。", hotspot: { x: 52, y: 23 }, to: "ocean", steps: [
        { visual: "riverSurface", pose: "flow", duration: 1000, text: "明るい水面へ上がった。遠くまで同じ方向へ水が動いている。" },
        { visual: "ocean", pose: "flow", duration: 1550, minutes: 5 * DAY, discovery: "ocean", text: "川の両岸が遠ざかり、やがて消える。河口を抜けて海へ。" },
      ]},
    ],
  },
  ocean: {
    id: "ocean", title: "海", phase: "液体", visual: "ocean", choices: [
      { id: "surface", label: "海面へ", icon: "↑", explain: "ここまで来て、初めて蒸発が主要ルートになる。海面で太陽の熱を受けると、水分子は空へ飛び出せる。", hotspot: { x: 50, y: 20 }, to: "vapor", steps: [
        { visual: "oceanSurface", pose: "rise", duration: 950, text: "長い旅のあと、海面近くまで上がってきた。太陽の熱が強くなる。" },
        { visual: "vapor", pose: "evaporate", duration: 1500, minutes: 18 * DAY, discovery: "vapor", text: "ついに一滴の形がほどけた。水蒸気になり、海から空へ上がる。" },
      ]},
      { id: "deep", label: "冷たい流れ", icon: "↓", explain: "海には表面とは別の巨大な流れがある。冷たい水に乗れば、何十年・何百年という旅になる。", hotspot: { x: 30, y: 76 }, to: "ocean", steps: [
        { visual: "oceanDeep", pose: "fall", duration: 1050, text: "冷たい水の帯へ入り、光の届かない深さまで沈んでいく。" },
        { visual: "oceanDeep", pose: "flow", duration: 1900, minutes: 140 * YEAR, discovery: "deepOcean", timeLabel: "140 YEARS", text: "140年。巨大な海流に運ばれ、別の海域へ移動していた。" },
        { visual: "ocean", pose: "rise", duration: 1100, minutes: 2 * YEAR, text: "ゆっくり上昇し、再び明るい海へ戻ってきた。" },
      ]},
      { id: "shadow", label: "巨大な影", icon: "◒", explain: "海では水そのものが生物の体へ入ることもある。巨大な影へ近づけば、思わぬ旅が始まる。", hotspot: { x: 78, y: 54 }, to: "ocean", steps: [
        { visual: "oceanWhale", pose: "flow", duration: 1250, discovery: "whale", text: "影の正体はクジラ。周囲の海水ごと、巨大な口へ吸い込まれた。" },
        { visual: "ocean", pose: "flow", duration: 1100, minutes: 6 * HOUR, text: "やがて再び海へ。海の旅はまだ続けられる。" },
      ]},
    ],
  },
  vapor: {
    id: "vapor", title: "大気", phase: "気体", visual: "vapor", choices: [
      { id: "up", label: "上昇気流", icon: "↑", explain: "暖かい空気は上へ動く。水蒸気も一緒に高い空へ運ばれ、冷えると雲へ戻る。", hotspot: { x: 48, y: 28 }, to: "cloudReturn", steps: [
        { visual: "vapor", pose: "rise", duration: 900, text: "暖かい空気と一緒に上昇する。地上がどんどん小さくなる。" },
        { visual: "condense", pose: "condense", duration: 1400, minutes: 5 * HOUR, text: "高い空で冷え、見えなかった水蒸気が小さな水滴へ戻り始める。" },
        { visual: "cloudReturn", pose: "idle", duration: 1350, minutes: 2 * HOUR, discovery: "cycle", cycle: true, text: "雲の中で再び一滴になった。次の雨が始まる。" },
      ]},
      { id: "wind", label: "風", icon: "→", explain: "水蒸気は風に乗って遠くへ運ばれる。場所が変わっても、冷えればまた雲になる。", hotspot: { x: 78, y: 46 }, to: "cloudReturn", steps: [
        { visual: "vapor", pose: "flow", duration: 1000, text: "風に乗り、海から遠く離れた空へ運ばれる。" },
        { visual: "condense", pose: "condense", duration: 1400, minutes: 8 * HOUR, text: "冷たい空気に入り、再び小さな水滴が集まり始めた。" },
        { visual: "cloudReturn", pose: "idle", duration: 1350, discovery: "cycle", cycle: true, text: "新しい雲ができた。同じ水の、次の旅が始まる。" },
      ]},
      { id: "particle", label: "冷たい粒", icon: "·", explain: "空気中の微粒子は水滴が集まる核になる。そこへ集まると雲粒が育っていく。", hotspot: { x: 25, y: 38 }, to: "cloudReturn", steps: [
        { visual: "condense", pose: "condense", duration: 1500, text: "冷たい粒の周囲へ水が集まり、少しずつ一滴の形が戻る。" },
        { visual: "cloudReturn", pose: "idle", duration: 1350, minutes: 6 * HOUR, discovery: "cycle", cycle: true, text: "雲の中へ戻った。旅は終わりではなく、次へ続く。" },
      ]},
    ],
  },
  cloudReturn: {
    id: "cloudReturn", title: "新しい雲", phase: "液体", visual: "cloudReturn", choices: [
      { id: "again", label: "また落ちる", icon: "↓", explain: "水は同じ循環を繰り返す。ただし次に通る道は、前回と同じとは限らない。", hotspot: { x: 52, y: 55 }, to: "leaf", steps: [
        { visual: "fall", pose: "fall", duration: 1200, minutes: 10, discovery: "rain", text: "次の雨が始まった。同じ一滴が、もう一度地上へ落ちる。" },
        { visual: "leaf", pose: "squash", duration: 1000, discovery: "leaf", text: "今度も森へ。ここから新しい経路を選べる。" },
      ]},
      { id: "cold", label: "冷たい側", icon: "❄", explain: "雲の中でも場所によって水滴の育ち方は違う。冷たい側へ進んでから落ちる。", hotspot: { x: 25, y: 35 }, to: "leaf", steps: [
        { visual: "cloudCold", pose: "merge", duration: 900, text: "細かな水滴が集まり、一滴が少し大きくなる。" },
        { visual: "fall", pose: "fall", duration: 1200, minutes: 12, text: "重くなり、再び地上へ。" },
        { visual: "leaf", pose: "squash", duration: 1000, discovery: "leaf", text: "森の葉へ到着した。" },
      ]},
      { id: "edge", label: "雲の端", icon: "↘", explain: "雲の縁へ出れば、また落下が始まる。", hotspot: { x: 80, y: 40 }, to: "leaf", steps: [
        { visual: "fall", pose: "fall", duration: 1200, minutes: 8, text: "雲の端を抜け、次の一生へ落ちていく。" },
        { visual: "leaf", pose: "squash", duration: 1000, discovery: "leaf", text: "葉に着地。どこへ行っても、旅は続く。" },
      ]},
    ],
  },
};

function formatTime(minutes: number) {
  if (minutes < HOUR) return `${Math.max(1, Math.round(minutes))}分`;
  if (minutes < DAY) return `${Math.round(minutes / HOUR)}時間`;
  if (minutes < YEAR) return `${Math.round(minutes / DAY)}日`;
  const years = minutes / YEAR;
  return years < 10 ? `${years.toFixed(1)}年` : `${Math.round(years).toLocaleString("ja-JP")}年`;
}

function Hero({ x, y, scale = 1, pose = "idle", tiny = false }: { x: number; y: number; scale?: number; pose?: Pose; tiny?: boolean }) {
  if (tiny) return <g transform={`translate(${x} ${y})`} className={styles.heroParticle}><circle r="17" fill="none" stroke="#e9fbff" strokeWidth="2" opacity=".6"/><circle r="5" fill="#fff"/><circle r="10" fill="#7fe0ff" opacity=".38"/></g>;
  if (pose === "evaporate" || pose === "condense") return <g transform={`translate(${x} ${y}) scale(${scale})`} className={pose === "evaporate" ? styles.heroEvaporate : styles.heroCondense}>{[-22,-10,0,11,24].map((dx, i) => <circle key={i} cx={dx} cy={i % 2 ? 8 : -8} r={i === 2 ? 7 : 5} fill="#e9fbff" opacity={.75 + i * .04}/>)}</g>;
  const poseScale: Record<Exclude<Pose, "evaporate" | "condense">, [number, number]> = { idle:[1,1], fall:[.68,1.5], flow:[1.2,.82], slide:[1.45,.72], squash:[1.5,.62], rise:[.82,1.28], merge:[1.22,1.22], trapped:[1.24,.72] };
  const [sx, sy] = poseScale[pose as Exclude<Pose, "evaporate" | "condense">] ?? [1,1];
  return <g transform={`translate(${x} ${y}) scale(${scale})`} className={styles.heroOuter} filter="url(#v06Glow)"><circle r="39" fill="none" stroke="#fff" strokeWidth="2" opacity=".18" className={styles.heroHalo}/><g transform={`scale(${sx} ${sy})`} className={styles[`pose_${pose}`] || ""}><path d="M0-34 C16-13 27 2 27 18 C27 35 15 47 0 47 C-15 47-27 35-27 18 C-27 2-16-13 0-34Z" fill="url(#v06Drop)" stroke="#effcff" strokeWidth="2"/><ellipse cx="-8" cy="0" rx="6" ry="12" fill="#fff" opacity=".8" transform="rotate(18)"/></g></g>;
}

function Scene({ visual, pose }: { visual: Visual; pose: Pose }) {
  const cloud = ["cloud","cloudCold","cloudMerge","fall","cloudReturn"].includes(visual);
  const leaf = ["leaf","leafTip","leafMerge","leafFrog","leafSpider","leafWind"].includes(visual);
  const pond = ["pond","pondOut","pondMud"].includes(visual);
  const soil = ["soil","soilRoot","soilGap","soilSlope"].includes(visual);
  const ground = ["groundwater","groundDeep"].includes(visual);
  const river = ["river","riverRapid","riverEddy","riverSurface"].includes(visual);
  const ocean = ["ocean","oceanDeep","oceanWhale","oceanSurface"].includes(visual);
  return <svg className={styles.art} viewBox="0 0 390 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="v06Sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#77cef1"/><stop offset="1" stopColor="#eaf9ff"/></linearGradient>
      <linearGradient id="v06Leaf" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#91dc68"/><stop offset="1" stopColor="#245f47"/></linearGradient>
      <linearGradient id="v06Soil" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9b714d"/><stop offset="1" stopColor="#2f2524"/></linearGradient>
      <linearGradient id="v06Water" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#79e1f5"/><stop offset="1" stopColor="#157fae"/></linearGradient>
      <linearGradient id="v06Ocean" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#58cce9"/><stop offset=".4" stopColor="#1477aa"/><stop offset="1" stopColor="#041d40"/></linearGradient>
      <linearGradient id="v06Drop" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset=".28" stopColor="#b8efff"/><stop offset="1" stopColor="#168fc8"/></linearGradient>
      <filter id="v06Glow" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>

    {cloud && <><rect width="390" height="650" fill="url(#v06Sky)"/><circle cx="325" cy="78" r="42" fill="#ffe993" opacity=".75"/><path d="M0 530 Q70 465 145 505 T285 490 T410 475 V650 H0Z" fill="#679373" opacity=".6"/><path d="M0 575 Q95 515 180 553 T410 525 V650 H0Z" fill="#3c6f5a" opacity=".8"/><g fill="#fff" opacity=".95" className={styles.cloudDriftA}><ellipse cx="70" cy="105" rx="78" ry="37"/><ellipse cx="137" cy="98" rx="80" ry="48"/><ellipse cx="198" cy="120" rx="65" ry="33"/></g><g fill="#ddecf3" opacity=".78" className={styles.cloudDriftB}><ellipse cx="285" cy="182" rx="86" ry="31"/><ellipse cx="350" cy="165" rx="70" ry="42"/></g>
      {visual === "cloud" && <><Hero x={176} y={168} scale={.66} pose={pose}/><Hero x={220} y={184} scale={.32} pose="idle"/></>}
      {visual === "cloudCold" && <><g fill="#fff" opacity=".65"><circle cx="120" cy="145" r="5"/><circle cx="145" cy="165" r="4"/><circle cx="165" cy="132" r="3"/><circle cx="195" cy="155" r="5"/></g><Hero x={178} y={174} scale={.78} pose="merge"/></>}
      {visual === "cloudMerge" && <><Hero x={160} y={175} scale={.52} pose="idle"/><Hero x={210} y={176} scale={.5} pose="idle"/></>}
      {visual === "fall" && <><g stroke="#e1f8ff" opacity=".55" strokeLinecap="round" className={styles.speedLines}><path d="M90 180 l-20 100"/><path d="M275 195 l-20 105"/><path d="M330 160 l-22 95"/></g><path d="M-30 620 C40 410 220 430 430 540 C310 570 180 625-30 650Z" fill="url(#v06Leaf)"/><Hero x={195} y={315} scale={.88} pose="fall"/></>}
      {visual === "cloudReturn" && <><g fill="#fff" opacity=".8" className={styles.condenseDots}><circle cx="155" cy="170" r="4"/><circle cx="210" cy="148" r="3"/><circle cx="240" cy="188" r="5"/></g><Hero x={195} y={180} scale={.7} pose="idle"/></>}
    </>}

    {leaf && <><rect width="390" height="650" fill="url(#v06Sky)"/><circle cx="337" cy="67" r="38" fill="#ffe894" opacity=".7"/><path d="M0 565 Q90 500 180 550 T410 520 V650 H0Z" fill="#3d6c55" opacity=".62"/><g className={styles.leafSway}><path d="M-75 590 C0 210 235 190 475 350 C332 420 180 555-75 590Z" fill="url(#v06Leaf)"/><path d="M-25 555 C125 445 250 368 445 345" fill="none" stroke="#d4efa5" strokeWidth="16" strokeLinecap="round" opacity=".77"/><path d="M95 472 Q135 398 155 330 M185 430 Q230 365 258 307 M275 392 Q320 343 355 317" fill="none" stroke="#b9df8b" strokeWidth="7" strokeLinecap="round" opacity=".75"/></g>
      {visual === "leaf" && <><Hero x={195} y={380} scale={.76} pose={pose}/><Hero x={252} y={347} scale={.42} pose="idle"/></>}
      {visual === "leafTip" && <Hero x={346} y={343} scale={.78} pose="slide"/>}
      {visual === "leafMerge" && <><Hero x={250} y={360} scale={1.0} pose="merge"/><Hero x={286} y={350} scale={.34} pose="idle"/></>}
      {visual === "leafWind" && <><g stroke="#e9fbff" opacity=".55" strokeLinecap="round"><path d="M45 235 q80 20 145-10" strokeWidth="5"/><path d="M210 250 q70 18 130-8" strokeWidth="4"/></g><Hero x={275} y={360} scale={.8} pose="flow"/></>}
      {visual === "leafFrog" && <><g transform="translate(275 455)" className={styles.frogRush}><ellipse rx="92" ry="66" fill="#4c8f46"/><circle cx="-42" cy="-48" r="24" fill="#6bab59"/><circle cx="38" cy="-48" r="24" fill="#6bab59"/><circle cx="-42" cy="-52" r="8" fill="#13281e"/><circle cx="38" cy="-52" r="8" fill="#13281e"/></g><Hero x={345} y={340} scale={.62} pose="fall"/></>}
      {visual === "leafSpider" && <><g stroke="#eefcff" strokeWidth="2" opacity=".72" fill="none"><path d="M195 120 V610 M40 360 H350 M75 170 L320 555 M320 170 L75 555"/><ellipse cx="195" cy="360" rx="70" ry="92"/><ellipse cx="195" cy="360" rx="125" ry="170"/></g><Hero x={205} y={360} scale={.64} pose="trapped"/></>}
    </>}

    {pond && <><rect width="390" height="650" fill="#b7e5d3"/><path d="M0 235 Q80 205 160 235 T320 230 T410 228 V650 H0Z" fill="url(#v06Water)"/><path d="M0 235 Q70 215 140 235 T280 232 T410 230" fill="none" stroke="#e8fbff" strokeWidth="7" opacity=".85" className={styles.waveLine}/><path d="M0 548 Q100 500 210 548 T410 520 V650 H0Z" fill="#405a38" opacity=".78"/>{visual === "pondOut" && <path d="M280 250 Q335 228 405 240" fill="none" stroke="#dffbff" strokeWidth="18" opacity=".72" className={styles.sideFlow}/>} {visual === "pondMud" && <g fill="#5d523d" opacity=".85"><ellipse cx="170" cy="560" rx="120" ry="55"/><ellipse cx="300" cy="595" rx="95" ry="45"/></g>}<Hero x={visual === "pondMud" ? 175 : visual === "pondOut" ? 305 : 195} y={visual === "pondMud" ? 515 : visual === "pondOut" ? 300 : 325} scale={.5} pose={visual === "pondMud" ? "fall" : "flow"}/></>}

    {soil && <><rect width="390" height="650" fill="url(#v06Soil)"/><rect width="390" height="92" fill="#55915d"/><path d="M0 92 Q80 68 160 94 T320 88 T410 92" fill="#2f6546"/><g fill="#bd9569" opacity=".74"><circle cx="72" cy="190" r="56"/><circle cx="302" cy="178" r="78"/><circle cx="105" cy="385" r="70"/><circle cx="312" cy="458" r="85"/></g><g fill="#524139" opacity=".92"><circle cx="242" cy="300" r="48"/><path d="M240 518 Q285 480 338 520 Q308 570 258 580Z"/></g><path d="M110 -10 C115 135 180 190 140 285 C105 360 160 440 115 670" fill="none" stroke="#d9c398" strokeWidth="44" strokeLinecap="round"/><path d="M128 185 Q210 225 255 310 M124 355 Q60 405 40 485" fill="none" stroke="#c8aa7b" strokeWidth="18" strokeLinecap="round"/>{visual === "soilSlope" && <path d="M290 410 C335 420 370 410 410 390" fill="none" stroke="#75d9ed" strokeWidth="15" className={styles.sideFlow}/>} {visual === "soilGap" && <path d="M310 455 Q355 525 340 650" fill="none" stroke="#201a1c" strokeWidth="42"/>}<Hero x={visual === "soilRoot" ? 145 : visual === "soilGap" ? 305 : visual === "soilSlope" ? 320 : 215} y={visual === "soilRoot" ? 310 : visual === "soilGap" ? 455 : visual === "soilSlope" ? 405 : 350} scale={.55} pose={visual === "soilRoot" ? "flow" : visual === "soilGap" ? "fall" : visual === "soilSlope" ? "flow" : pose}/></>}

    {visual === "rootInside" && <><rect width="390" height="650" fill="#dbeabe"/><path d="M70 -30 C45 150 98 300 65 690 M165 -30 C140 170 192 330 155 690 M270 -30 C242 170 305 350 262 690 M355 -30 C330 160 378 335 345 690" fill="none" stroke="#759c69" strokeWidth="48" opacity=".5"/><path d="M70 -30 C45 150 98 300 65 690 M165 -30 C140 170 192 330 155 690 M270 -30 C242 170 305 350 262 690 M355 -30 C330 160 378 335 345 690" fill="none" stroke="#eff5d0" strokeWidth="14" opacity=".8"/><Hero x={195} y={380} scale={.62} pose="rise"/></>}

    {ground && <><rect width="390" height="650" fill="#112a33"/><rect width="390" height="48" fill="#6f9b66"/><path d="M0 95 Q80 42 190 95 T410 88 V210 Q300 160 180 205 T0 198Z" fill="#526569"/><path d="M0 280 Q100 220 200 275 T410 267 V425 Q300 365 175 420 T0 405Z" fill="#394d52"/><path d="M0 488 Q100 430 210 485 T410 472 V650 H0Z" fill="#263b42"/><path d="M-10 356 Q80 310 165 354 T330 348 T410 336" fill="none" stroke="#36b6d8" strokeWidth="32" opacity=".58" className={styles.groundFlow}/><path d="M-10 356 Q80 310 165 354 T330 348 T410 336" fill="none" stroke="#a4eeff" strokeWidth="5" opacity=".6"/>{visual === "groundDeep" && <rect y="420" width="390" height="230" fill="#071b24" opacity=".65"/>}<Hero x={visual === "groundDeep" ? 230 : 205} y={visual === "groundDeep" ? 500 : 350} scale={.46} pose="flow"/></>}

    {visual === "spring" && <><rect width="390" height="650" fill="#293d38"/><path d="M35 0 Q115 180 105 650 H285 Q270 220 355 0Z" fill="#61766b"/><ellipse cx="195" cy="220" rx="95" ry="140" fill="#d2f7ea" opacity=".84"/><path d="M55 570 Q150 500 235 553 T410 540 V650 H0V610Z" fill="#2d95ae"/><path d="M88 560 Q180 510 275 558" fill="none" stroke="#c9f8ff" strokeWidth="8" opacity=".7"/><Hero x={200} y={475} scale={.56} pose="rise"/></>}

    {river && <><rect width="390" height="650" fill="#8acfd5"/><path d="M0 0 Q90 70 112 230 T75 650 H315 Q285 440 328 255 T390 0Z" fill="#4c755c"/><path d="M78 0 Q155 98 152 250 T120 650 H302 Q265 435 304 250 T326 0Z" fill="url(#v06Water)"/><g fill="#505c58" opacity=".94"><ellipse cx="105" cy="228" rx="58" ry="42"/><ellipse cx="292" cy="370" rx="74" ry="50"/><ellipse cx="132" cy="525" rx="62" ry="46"/></g><g className={visual === "riverRapid" ? styles.rapidLines : styles.riverLines} fill="none" stroke="#e3fbff" strokeLinecap="round" opacity=".8"><path d="M145 75 Q210 115 270 86" strokeWidth="9"/><path d="M115 315 Q190 350 260 315" strokeWidth="7"/><path d="M145 472 Q215 510 288 470" strokeWidth="9"/><path d="M190 190 Q230 215 270 190" strokeWidth="5"/></g>{visual === "riverEddy" && <path d="M80 280 q70-70 140 0 q-70 70-140 0" fill="none" stroke="#dffbff" strokeWidth="8" opacity=".7"/>}{visual === "riverSurface" && <path d="M110 140 Q210 175 310 140" fill="none" stroke="#fff" strokeWidth="16" opacity=".35"/>}<Hero x={visual === "riverEddy" ? 120 : visual === "riverSurface" ? 220 : 198} y={visual === "riverRapid" ? 420 : visual === "riverEddy" ? 300 : visual === "riverSurface" ? 180 : 330} scale={.45} pose={visual === "riverRapid" ? "slide" : "flow"}/></>}

    {ocean && <><rect width="390" height="650" fill="url(#v06Ocean)"/><path d="M0 92 Q65 74 130 94 T260 91 T390 89" fill="none" stroke="#d8f9ff" strokeWidth="8" opacity=".55" className={styles.waveLine}/><g className={styles.oceanFish} fill="#bddfe4" opacity=".18"><path d="M40 250 q50-35 100 0 q-50 35-100 0Z"/><path d="M40 250 l-35-26 v52Z"/></g>{visual === "oceanDeep" && <rect y="280" width="390" height="370" fill="#021832" opacity=".55"/>}{visual === "oceanWhale" && <g className={styles.whaleRush} fill="#071d31" opacity=".94"><path d="M-40 350 C35 205 245 188 390 300 C320 335 255 370 170 398 C92 424 15 422-40 350Z"/><path d="M340 298 Q410 248 448 275 Q405 330 348 345Z"/></g>}{visual === "oceanSurface" && <g fill="#fff" opacity=".22"><circle cx="90" cy="100" r="50"/><circle cx="250" cy="115" r="65"/></g>}<Hero x={visual === "oceanDeep" ? 190 : visual === "oceanWhale" ? 220 : visual === "oceanSurface" ? 195 : 190} y={visual === "oceanDeep" ? 500 : visual === "oceanWhale" ? 350 : visual === "oceanSurface" ? 125 : 340} tiny pose="flow"/></>}

    {visual === "vapor" && <><rect width="390" height="650" fill="url(#v06Sky)"/><circle cx="325" cy="75" r="42" fill="#ffe993" opacity=".72"/><path d="M0 590 Q90 530 180 575 T410 545 V650 H0Z" fill="#4c7963" opacity=".62"/><g className={styles.updraft} fill="none" stroke="#e8fbff" strokeLinecap="round" opacity=".38"><path d="M120 520 Q85 410 140 320 T165 150" strokeWidth="5"/><path d="M240 545 Q285 430 235 320 T225 150" strokeWidth="4"/></g><Hero x={195} y={310} scale={1.1} pose="evaporate"/></>}
    {visual === "condense" && <><rect width="390" height="650" fill="#9bd8ef"/><g fill="#eefbff" opacity=".72" className={styles.condenseCloud}><ellipse cx="95" cy="300" rx="105" ry="65"/><ellipse cx="195" cy="270" rx="120" ry="80"/><ellipse cx="310" cy="315" rx="110" ry="68"/></g><Hero x={195} y={300} scale={1.2} pose="condense"/></>}
  </svg>;
}

function Hotspots({ choices, onChoose }: { choices: Choice[]; onChoose: (c: Choice) => void }) {
  return <div className={styles.hotspotLayer}>{choices.map((c) => <button key={c.id} className={styles.hotspot} style={{ left: `${c.hotspot.x}%`, top: `${c.hotspot.y}%` }} onClick={() => onChoose(c)} aria-label={c.label}><span>{c.icon}</span><i/></button>)}</div>;
}

export default function DropVisualV06() {
  const [area, setArea] = useState<Area>("cloud");
  const [active, setActive] = useState<Active | null>(null);
  const [elapsed, setElapsed] = useState(1);
  const [cycle, setCycle] = useState(0);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [newDiscovery, setNewDiscovery] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const node = areas[area];
  const step = active ? active.choice.steps[active.index] : null;
  const visual = step?.visual ?? node.visual;
  const pose = step?.pose ?? "idle";

  useEffect(() => {
    try {
      const c = Number(localStorage.getItem("drop-v05-cycle") || 0); if (c) setCycle(c);
      const raw = localStorage.getItem("drop-v06-memory"); if (raw) setFound(new Set(JSON.parse(raw) as string[]));
    } catch {}
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  const progress = useMemo(() => `${found.size}/${Object.keys(discoveryCatalog).length}`, [found]);

  function unlock(id?: string) {
    if (!id || found.has(id)) return;
    setFound((prev) => { const next = new Set(prev); next.add(id); try { localStorage.setItem("drop-v06-memory", JSON.stringify([...next])); } catch {} return next; });
    setNewDiscovery(id);
    window.setTimeout(() => setNewDiscovery(null), 1900);
  }

  function run(choice: Choice, index: number) {
    const next = choice.steps[index];
    setActive({ choice, index });
    if (next.minutes) setElapsed((v) => v + next.minutes!);
    if (next.discovery) unlock(next.discovery);
    if (next.cycle) setCycle((v) => { const n = v + 1; try { localStorage.setItem("drop-v05-cycle", String(n)); } catch {} return n; });
    if (navigator.vibrate && (next.discovery || next.timeLabel)) navigator.vibrate(18);
    timer.current = setTimeout(() => {
      if (index < choice.steps.length - 1) run(choice, index + 1);
      else { setArea(choice.to); setActive(null); }
    }, next.duration);
  }

  function choose(choice: Choice) {
    if (active) return;
    if (timer.current) clearTimeout(timer.current);
    run(choice, 0);
  }

  const discovery = newDiscovery ? discoveryCatalog[newDiscovery] : null;

  return <main className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.hud}>
        <div className={styles.brand}><b>一滴</b><span>DROP</span></div>
        <div className={styles.hudRight}><div className={styles.stat}><small>TIME</small><b>{formatTime(elapsed)}</b></div><div className={styles.stat}><small>CYCLE</small><b>{cycle}</b></div><div className={styles.memoryButton}><span>記憶</span><b>{progress}</b></div></div>
      </header>

      <section className={styles.stage}>
        <Scene visual={visual} pose={pose}/>
        {!active && <Hotspots choices={node.choices} onChoose={choose}/>} 
        {!active && <div className={styles.sceneTag}><i/>{node.title}<span>{node.phase}</span></div>}
        {step?.timeLabel && <div className={styles.timeJump}>{step.timeLabel}</div>}
        {step?.text && <div className={styles.microText} style={{ borderRadius: 18, maxWidth: "86%", lineHeight: 1.55, padding: "10px 14px", fontSize: 12 }}>{step.text}</div>}
      </section>

      {!active && <nav className={styles.choiceDock}>{node.choices.map((c) => <button key={c.id} onClick={() => choose(c)} title={c.explain}><span>{c.icon}</span><b>{c.label}</b></button>)}</nav>}

      {active && active.index === 0 && <div style={{ position: "absolute", zIndex: 46, left: 16, right: 16, bottom: "max(14px, env(safe-area-inset-bottom))", borderRadius: 20, padding: "12px 14px", background: "rgba(246,253,255,.94)", boxShadow: "0 16px 44px rgba(5,32,42,.2)", color: "#10333b" }}><div style={{ fontSize: 10, fontWeight: 900, opacity: .48, marginBottom: 4 }}>選んだ行動：{active.choice.label}</div><div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.5 }}>{active.choice.explain}</div></div>}

      {discovery && <div className={styles.discoveryToast}><small>NEW DISCOVERY</small><b>{discovery.title}</b><span>{discovery.description}</span></div>}
    </div>
  </main>;
}
