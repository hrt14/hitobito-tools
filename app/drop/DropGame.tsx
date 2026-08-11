"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./drop.module.css";

type Rarity = "COMMON" | "UNCOMMON" | "RARE" | "VERY RARE" | "LEGEND";

type Discovery = {
  id: string;
  title: string;
  category: string;
  rarity: Rarity;
  description: string;
};

type Beat = {
  text: string;
  visual: VisualKey;
  duration: number;
  minutes?: number;
  discovery?: string;
  timeLabel?: string;
  emphasis?: string;
};

type EventChain = {
  id: string;
  to: string;
  beats: Beat[];
  completesCycle?: boolean;
};

type WeightedEvent = {
  eventId: string;
  weight: number;
};

type Choice = {
  id: string;
  label: string;
  icon: string;
  hint: string;
  events: WeightedEvent[];
};

type LocationNode = {
  id: string;
  title: string;
  location: string;
  phase: "液体" | "気体" | "固体";
  prompt: string;
  visual: VisualKey;
  choices: Choice[];
};

type ActiveEvent = {
  event: EventChain;
  beatIndex: number;
};

type RoutePoint = {
  label: string;
  minutes: number;
};

type VisualKey =
  | "cloud"
  | "cloudMerge"
  | "fall"
  | "leaf"
  | "leafMerge"
  | "leafEdge"
  | "spider"
  | "frog"
  | "frogInside"
  | "pond"
  | "soil"
  | "root"
  | "rootInside"
  | "groundwater"
  | "deepTime"
  | "spring"
  | "river"
  | "rapid"
  | "ocean"
  | "deepOcean"
  | "whale"
  | "vapor"
  | "condense"
  | "cloudReturn";

const MINUTE = 1;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;

const discoveryCatalog: Discovery[] = [
  { id: "rain_drop", title: "雨粒", category: "空", rarity: "COMMON", description: "雲の中で育ち、重くなって落ち始めた水。" },
  { id: "merged_drop", title: "合体した一滴", category: "現象", rarity: "UNCOMMON", description: "小さな水滴同士が触れ、一つの大きな水滴になった。" },
  { id: "leaf_world", title: "巨大な葉", category: "森", rarity: "COMMON", description: "一滴から見れば、葉脈は谷や道のように巨大だ。" },
  { id: "spider_water", title: "蜘蛛の巣の水", category: "森", rarity: "RARE", description: "細い糸の表面張力に捕まった一滴。" },
  { id: "frog_water", title: "カエルの中の水", category: "生物", rarity: "RARE", description: "一瞬のジャンプで、生き物の体内へ入った水。" },
  { id: "pond_water", title: "池の水", category: "淡水", rarity: "COMMON", description: "小さな池にとどまり、風や生き物を待つ水。" },
  { id: "soil_water", title: "土の中の水", category: "地下", rarity: "COMMON", description: "土粒の間を毛細管のように進む水。" },
  { id: "tree_water", title: "木の中の水", category: "生物", rarity: "RARE", description: "根から吸い上げられ、幹の中を上へ運ばれる水。" },
  { id: "groundwater_17", title: "17年の地下旅行", category: "地下", rarity: "RARE", description: "地表から離れ、帯水層を長い時間かけて移動した水。" },
  { id: "groundwater_83", title: "83年の暗闇", category: "地下", rarity: "VERY RARE", description: "岩盤の深い割れ目で、人の一生ほどの時間を過ごした水。" },
  { id: "spring_water", title: "湧水", category: "山", rarity: "UNCOMMON", description: "地下から押し出され、久しぶりに光へ戻った水。" },
  { id: "rapid_water", title: "激流の一滴", category: "川", rarity: "UNCOMMON", description: "泡と岩の間を高速で流れた水。" },
  { id: "ocean_water", title: "海の一滴", category: "海", rarity: "COMMON", description: "見渡す限りの水の中に混ざった、一つの水。" },
  { id: "deep_ocean", title: "140年の深海", category: "海", rarity: "VERY RARE", description: "光の届かない深い海で、非常に長い時間を旅した水。" },
  { id: "whale_water", title: "クジラの中の水", category: "生物", rarity: "LEGEND", description: "巨大な生物に取り込まれ、再び海へ戻った水。" },
  { id: "vapor_water", title: "空へほどけた水", category: "空", rarity: "UNCOMMON", description: "一滴の輪郭を失い、水蒸気として上昇した水。" },
  { id: "cycle_complete", title: "再び雲へ", category: "循環", rarity: "RARE", description: "旅を終えるのではなく、次の一生を始めるため雲へ戻った。" },
];

const events: Record<string, EventChain> = {
  cloudEdgeFall: { id: "cloudEdgeFall", to: "leaf", beats: [
    { text: "雲の縁が薄くなり、足元の白が途切れた。", visual: "cloud", duration: 850, minutes: 3 },
    { text: "重力が勝った。体が縦に伸びて、空へ放り出される。", visual: "fall", duration: 1200, minutes: 5, discovery: "rain_drop" },
    { text: "緑の一枚が、地面より先に近づいてくる。", visual: "leafEdge", duration: 900, discovery: "leaf_world" },
  ] },
  cloudColdFall: { id: "cloudColdFall", to: "leaf", beats: [
    { text: "冷たい空気に触れ、周りの細かな水が一斉に集まり始めた。", visual: "cloudMerge", duration: 900, minutes: 6 },
    { text: "少し大きく、少し重くなる。もう雲には残れない。", visual: "cloudMerge", duration: 850, discovery: "merged_drop" },
    { text: "風に押されながら、森へ向かって落ちていく。", visual: "fall", duration: 1250, minutes: 11, discovery: "rain_drop" },
  ] },
  cloudMergeFall: { id: "cloudMergeFall", to: "leaf", beats: [
    { text: "隣の水滴に触れた。二つの輪郭が、ぷるんと一つになる。", visual: "cloudMerge", duration: 950, discovery: "merged_drop" },
    { text: "重くなった瞬間、雲の中の流れから外れた。", visual: "fall", duration: 1100, minutes: 4, discovery: "rain_drop" },
    { text: "巨大な葉が、受け皿のように迫ってくる。", visual: "leafEdge", duration: 850, minutes: 3, discovery: "leaf_world" },
  ] },
  leafFrog: { id: "leafFrog", to: "pond", beats: [
    { text: "葉先へ近づく。表面張力で、落ちそうで落ちない。", visual: "leafEdge", duration: 900, minutes: 1 },
    { text: "下の緑が、突然こちらへ跳ね上がった。", visual: "frog", duration: 750, emphasis: "！" },
    { text: "暗い。カエルに飲み込まれた。", visual: "frogInside", duration: 1300, minutes: 8, discovery: "frog_water" },
    { text: "しばらくして、体の外へ。今度は静かな池の中だ。", visual: "pond", duration: 1100, minutes: 2 * HOUR, discovery: "pond_water" },
  ] },
  leafSpider: { id: "leafSpider", to: "spiderweb", beats: [
    { text: "葉先から離れた。落下するはずだった。", visual: "fall", duration: 750, minutes: 1 },
    { text: "細い銀色の線が、空中に何本も走っている。", visual: "spider", duration: 900 },
    { text: "ぽすん。蜘蛛の巣の上で止まった。", visual: "spider", duration: 1200, discovery: "spider_water" },
  ] },
  leafGround: { id: "leafGround", to: "soil", beats: [
    { text: "葉先で細長く伸び、ついに離れた。", visual: "leafEdge", duration: 720, minutes: 1 },
    { text: "落ちる。葉が上へ遠ざかっていく。", visual: "fall", duration: 950 },
    { text: "土にぶつかって潰れ、そのまま小さな隙間へ吸い込まれた。", visual: "soil", duration: 1150, minutes: 4, discovery: "soil_water" },
  ] },
  leafMergeSlide: { id: "leafMergeSlide", to: "soil", beats: [
    { text: "隣の雨粒と触れた。大きな一滴になる。", visual: "leafMerge", duration: 900, discovery: "merged_drop" },
    { text: "重くなったぶん、葉脈の坂を一気に滑り始めた。", visual: "leafMerge", duration: 950, minutes: 2 },
    { text: "葉の外へ飛び出し、腐葉土へ。", visual: "soil", duration: 1050, minutes: 5, discovery: "soil_water" },
  ] },
  leafMergeWeb: { id: "leafMergeWeb", to: "spiderweb", beats: [
    { text: "二つの水滴が合体し、葉が少し沈んだ。", visual: "leafMerge", duration: 820, discovery: "merged_drop" },
    { text: "反動で葉先から転がり落ちる。", visual: "fall", duration: 820, minutes: 1 },
    { text: "落下先は地面ではなく、蜘蛛の巣だった。", visual: "spider", duration: 1100, discovery: "spider_water" },
  ] },
  leafSun: { id: "leafSun", to: "vapor", beats: [
    { text: "雨が止み、葉の上に光が戻ってきた。", visual: "leaf", duration: 950, minutes: 2 * HOUR },
    { text: "輪郭が少しずつ薄くなる。一滴だった形がほどけていく。", visual: "vapor", duration: 1300, minutes: 3 * HOUR, discovery: "vapor_water" },
  ] },
  leafWind: { id: "leafWind", to: "soil", beats: [
    { text: "突然の風。巨大な葉そのものが傾いた。", visual: "leafEdge", duration: 900, emphasis: "風" },
    { text: "葉脈のくぼみから押し出され、端まで一気に滑る。", visual: "leafMerge", duration: 900, minutes: 2 },
    { text: "そのまま地面へ。土粒の間に潜り込んだ。", visual: "soil", duration: 1100, minutes: 7, discovery: "soil_water" },
  ] },
  webSun: { id: "webSun", to: "vapor", beats: [
    { text: "蜘蛛の巣が朝日に照らされ、無数の小さな水玉が光る。", visual: "spider", duration: 1100, minutes: 2 * HOUR },
    { text: "あなたの輪郭も消えて、糸から空へほどけていく。", visual: "vapor", duration: 1200, minutes: HOUR, discovery: "vapor_water" },
  ] },
  webDrop: { id: "webDrop", to: "soil", beats: [
    { text: "風で巣全体が大きく揺れた。", visual: "spider", duration: 900 },
    { text: "糸を伝って下へ。最後の糸から落ちる。", visual: "fall", duration: 900, minutes: 4 },
    { text: "柔らかな土へ沈み込む。", visual: "soil", duration: 950, minutes: 5, discovery: "soil_water" },
  ] },
  pondStream: { id: "pondStream", to: "river", beats: [
    { text: "池の端で、水面が一方向だけゆっくり動いている。", visual: "pond", duration: 850, minutes: HOUR },
    { text: "細い流れに吸い込まれ、速度が上がっていく。", visual: "river", duration: 1100, minutes: 5 * HOUR },
  ] },
  pondSun: { id: "pondSun", to: "vapor", beats: [
    { text: "風が止まり、水面が鏡のようになった。", visual: "pond", duration: 900, minutes: 4 * HOUR },
    { text: "日差しで少しずつ軽くなり、水面から離れる。", visual: "vapor", duration: 1250, minutes: 6 * HOUR, discovery: "vapor_water" },
  ] },
  pondMud: { id: "pondMud", to: "soil", beats: [
    { text: "底の暗い方へ沈む。泥の粒がどんどん大きく見える。", visual: "pond", duration: 850, minutes: 3 * HOUR },
    { text: "底に触れ、その隙間へ入り込んだ。", visual: "soil", duration: 1050, minutes: DAY, discovery: "soil_water" },
  ] },
  soilRoot: { id: "soilRoot", to: "root", beats: [
    { text: "白く細い根の表面へ近づく。そこだけ水の流れが違う。", visual: "root", duration: 1050, minutes: 3 * HOUR },
    { text: "根に吸い込まれた。巨大な管の中を上へ運ばれていく。", visual: "rootInside", duration: 1250, minutes: DAY, discovery: "tree_water" },
  ] },
  soilGround17: { id: "soilGround17", to: "groundwater", beats: [
    { text: "岩と砂の隙間へ。地上の光が完全に見えなくなる。", visual: "groundwater", duration: 1100, minutes: 3 * DAY },
    { text: "ほとんど止まっているような速さで、それでも進み続ける。", visual: "deepTime", duration: 2800, minutes: 17 * YEAR, discovery: "groundwater_17", timeLabel: "17年後" },
  ] },
  soilGround83: { id: "soilGround83", to: "groundwater", beats: [
    { text: "細い割れ目を選ぶと、さらに深い岩盤へ落ちていった。", visual: "groundwater", duration: 1000, minutes: 8 * DAY },
    { text: "季節も天気も届かない。水だけが、ゆっくり時間を運ぶ。", visual: "deepTime", duration: 3200, minutes: 83 * YEAR, discovery: "groundwater_83", timeLabel: "83年後" },
  ] },
  soilSlope: { id: "soilSlope", to: "spring", beats: [
    { text: "土粒の間に、横へ続く細い流れがある。", visual: "soil", duration: 850, minutes: 5 * HOUR },
    { text: "遠くに明るい線が見えた。水がそこへ集まっていく。", visual: "spring", duration: 1050, minutes: 2 * DAY, discovery: "spring_water" },
  ] },
  rootTranspire: { id: "rootTranspire", to: "vapor", beats: [
    { text: "幹の細い管の中を、地上とは逆に上へ上へ進む。", visual: "rootInside", duration: 1100, minutes: DAY },
    { text: "枝、葉。最後は葉の小さな穴へたどり着いた。", visual: "leaf", duration: 900, minutes: DAY },
    { text: "外は空だった。植物から大気へ、形を失って飛び出す。", visual: "vapor", duration: 1250, minutes: 2 * HOUR, discovery: "vapor_water" },
  ] },
  rootBackSoil: { id: "rootBackSoil", to: "soil", beats: [
    { text: "根の外側の水と押し合い、細い管から外へ戻された。", visual: "root", duration: 950, minutes: 6 * HOUR },
    { text: "また土粒の迷路へ。さっきとは違う隙間にいる。", visual: "soil", duration: 900, minutes: 3 * HOUR },
  ] },
  groundSpring: { id: "groundSpring", to: "spring", beats: [
    { text: "砂の粒が少しずつ粗くなり、水の流れが速くなる。", visual: "groundwater", duration: 1000, minutes: 4 * YEAR },
    { text: "暗闇の先に光。岩の隙間から地上へ押し出された。", visual: "spring", duration: 1200, minutes: YEAR, discovery: "spring_water" },
  ] },
  groundDeep: { id: "groundDeep", to: "groundwater", beats: [
    { text: "より冷たい割れ目へ。周りの岩の色すら見えなくなる。", visual: "groundwater", duration: 850, minutes: 10 * DAY },
    { text: "気が遠くなるほど長い静けさ。", visual: "deepTime", duration: 3000, minutes: 83 * YEAR, discovery: "groundwater_83", timeLabel: "83年後" },
  ] },
  springRiver: { id: "springRiver", to: "river", beats: [
    { text: "湧き出した水同士が集まり、細い沢になる。", visual: "spring", duration: 900, minutes: 40 },
    { text: "沢が支流になり、視界いっぱいの流れへ変わっていく。", visual: "river", duration: 1150, minutes: 8 * HOUR },
  ] },
  springSun: { id: "springSun", to: "vapor", beats: [
    { text: "岩のくぼみで、久しぶりの太陽を受ける。", visual: "spring", duration: 950, minutes: 5 * HOUR },
    { text: "地中で何年も過ごした水が、数時間で空へ戻っていく。", visual: "vapor", duration: 1200, minutes: 7 * HOUR, discovery: "vapor_water" },
  ] },
  riverRapid: { id: "riverRapid", to: "ocean", beats: [
    { text: "泡に巻き込まれた瞬間、世界が一気に速くなる。", visual: "rapid", duration: 1000, minutes: HOUR, discovery: "rapid_water" },
    { text: "巨大な岩が横を飛ぶ。小川は、もう大きな川だ。", visual: "rapid", duration: 1100, minutes: DAY },
    { text: "塩の気配。視界が突然、どこまでも開けた。", visual: "ocean", duration: 1400, minutes: 3 * DAY, discovery: "ocean_water" },
  ] },
  riverBank: { id: "riverBank", to: "soil", beats: [
    { text: "大きな岩の裏は流れが弱い。岸へ押し戻される。", visual: "river", duration: 900, minutes: 2 * HOUR },
    { text: "水際の柔らかな土へ染み込んだ。", visual: "soil", duration: 950, minutes: 4 * HOUR, discovery: "soil_water" },
  ] },
  riverSun: { id: "riverSun", to: "vapor", beats: [
    { text: "流れの表面へ。太陽が水面で細かく砕けている。", visual: "river", duration: 900, minutes: 4 * HOUR },
    { text: "一滴の形がほどけ、流れから空へ抜けていく。", visual: "vapor", duration: 1150, minutes: 6 * HOUR, discovery: "vapor_water" },
  ] },
  oceanSurface: { id: "oceanSurface", to: "vapor", beats: [
    { text: "明るい方へ。波の表面で空が揺れている。", visual: "ocean", duration: 950, minutes: 8 * DAY },
    { text: "太陽に温められ、巨大な海から一つだけ空へ抜ける。", visual: "vapor", duration: 1300, minutes: 10 * DAY, discovery: "vapor_water" },
  ] },
  oceanDeep: { id: "oceanDeep", to: "ocean", beats: [
    { text: "冷たい流れに乗る。光が少しずつ青く、暗くなる。", visual: "deepOcean", duration: 1200, minutes: 20 * DAY },
    { text: "深い海では、時間の速度まで違って感じる。", visual: "deepOcean", duration: 3300, minutes: 140 * YEAR, discovery: "deep_ocean", timeLabel: "140年後" },
    { text: "長い海流の旅の末、また光の届く海域へ戻ってきた。", visual: "ocean", duration: 1100, minutes: 2 * YEAR },
  ] },
  oceanWhale: { id: "oceanWhale", to: "ocean", beats: [
    { text: "遠くの影が、島のように大きくなっていく。", visual: "ocean", duration: 900 },
    { text: "巨大な口が海水ごと近づいてきた。", visual: "whale", duration: 950, emphasis: "巨大な影" },
    { text: "クジラの中へ。水は生き物の一部にもなる。", visual: "whale", duration: 1350, minutes: 9 * HOUR, discovery: "whale_water" },
    { text: "やがて再び海へ。さっきと同じ海なのに、もう別の旅だ。", visual: "ocean", duration: 1100, minutes: 3 * HOUR },
  ] },
  vaporCondense: { id: "vaporCondense", to: "cloudReturn", completesCycle: true, beats: [
    { text: "一滴だった自分は、今は目に見えない水蒸気。", visual: "vapor", duration: 900, minutes: 2 * HOUR, discovery: "vapor_water" },
    { text: "高い空で冷やされ、細かな粒がまた集まり始める。", visual: "condense", duration: 1250, minutes: 5 * HOUR },
    { text: "輪郭が戻る。新しい雲の中で、また一滴になった。", visual: "cloudReturn", duration: 1500, minutes: 3 * HOUR, discovery: "cycle_complete", emphasis: "CYCLE +1" },
  ] },
  cloudReturnLeaf: { id: "cloudReturnLeaf", to: "leaf", beats: [
    { text: "次の雨が始まった。今度の地上は、深い緑に覆われている。", visual: "fall", duration: 1200, minutes: 12, discovery: "rain_drop" },
    { text: "また巨大な葉へ。ただし、同じ出来事が起きるとは限らない。", visual: "leaf", duration: 900, discovery: "leaf_world" },
  ] },
  cloudReturnSoil: { id: "cloudReturnSoil", to: "soil", beats: [
    { text: "風に運ばれ、今度は葉をすり抜けた。", visual: "fall", duration: 1100, minutes: 18, discovery: "rain_drop" },
    { text: "直接、森の地面へ。小さな穴が口を開けている。", visual: "soil", duration: 950, minutes: 2, discovery: "soil_water" },
  ] },
};

const locations: Record<string, LocationNode> = {
  cloud: { id: "cloud", title: "雲の中", location: "上空・雨雲", phase: "液体", prompt: "まだ地上は見えない。どちらへ動く？", visual: "cloud", choices: [
    { id: "edge", label: "雲の端へ", icon: "↘", hint: "白が薄い方へ", events: [{ eventId: "cloudEdgeFall", weight: 55 }, { eventId: "cloudColdFall", weight: 45 }] },
    { id: "cold", label: "冷たい空気へ", icon: "❄", hint: "粒が集まっている", events: [{ eventId: "cloudColdFall", weight: 70 }, { eventId: "cloudEdgeFall", weight: 30 }] },
    { id: "merge", label: "水滴に近づく", icon: "●●", hint: "隣で揺れている", events: [{ eventId: "cloudMergeFall", weight: 100 }] },
  ] },
  leaf: { id: "leaf", title: "巨大な葉", location: "森・葉の表面", phase: "液体", prompt: "葉全体がゆっくり揺れている。", visual: "leaf", choices: [
    { id: "leafEdge", label: "葉先へ", icon: "↓", hint: "今にも落ちそう", events: [{ eventId: "leafGround", weight: 36 }, { eventId: "leafFrog", weight: 34 }, { eventId: "leafSpider", weight: 30 }] },
    { id: "nearDrop", label: "水滴に近づく", icon: "●", hint: "少し大きな雨粒", events: [{ eventId: "leafMergeSlide", weight: 58 }, { eventId: "leafMergeWeb", weight: 42 }] },
    { id: "vein", label: "葉脈のくぼみへ", icon: "⌁", hint: "風を避けられそう", events: [{ eventId: "leafSun", weight: 38 }, { eventId: "leafWind", weight: 62 }] },
  ] },
  spiderweb: { id: "spiderweb", title: "空中で止まった", location: "森・蜘蛛の巣", phase: "液体", prompt: "細い糸が風で大きく揺れている。", visual: "spider", choices: [
    { id: "webThread", label: "糸を伝う", icon: "↘", hint: "下へ続いている", events: [{ eventId: "webDrop", weight: 100 }] },
    { id: "webSun", label: "光る方へ", icon: "☀", hint: "朝日が当たり始めた", events: [{ eventId: "webSun", weight: 100 }] },
    { id: "webFlow", label: "揺れにまかせる", icon: "◎", hint: "風が強くなってきた", events: [{ eventId: "webDrop", weight: 62 }, { eventId: "webSun", weight: 38 }] },
  ] },
  pond: { id: "pond", title: "小さな池", location: "森・池", phase: "液体", prompt: "水面、泥、細い流出口。静かな場所にも道はある。", visual: "pond", choices: [
    { id: "pondEdge", label: "動く水面へ", icon: "→", hint: "端だけ流れている", events: [{ eventId: "pondStream", weight: 100 }] },
    { id: "pondSun", label: "光の方へ", icon: "☀", hint: "水面が暖かい", events: [{ eventId: "pondSun", weight: 100 }] },
    { id: "pondMud", label: "暗い底へ", icon: "⇣", hint: "泥が近い", events: [{ eventId: "pondMud", weight: 100 }] },
  ] },
  soil: { id: "soil", title: "土粒の迷路", location: "森・土壌", phase: "液体", prompt: "根、岩、斜面。どれも一滴よりはるかに巨大だ。", visual: "soil", choices: [
    { id: "rootNear", label: "根の近くへ", icon: "⌇", hint: "水を引く気配", events: [{ eventId: "soilRoot", weight: 100 }] },
    { id: "rockGap", label: "岩の隙間へ", icon: "◇", hint: "奥が見えない", events: [{ eventId: "soilGround17", weight: 66 }, { eventId: "soilGround83", weight: 34 }] },
    { id: "slope", label: "横の流れへ", icon: "→", hint: "少しだけ明るい", events: [{ eventId: "soilSlope", weight: 100 }] },
  ] },
  root: { id: "root", title: "木の中", location: "森・樹木", phase: "液体", prompt: "細い管の中で、水は上方向へ押されている。", visual: "rootInside", choices: [
    { id: "rootUp", label: "上へ押される", icon: "↑", hint: "葉の方へ", events: [{ eventId: "rootTranspire", weight: 100 }] },
    { id: "rootSide", label: "外側へ寄る", icon: "↙", hint: "土が見える", events: [{ eventId: "rootBackSoil", weight: 100 }] },
    { id: "rootFlow", label: "流れにまかせる", icon: "◎", hint: "管の中を流れる", events: [{ eventId: "rootTranspire", weight: 72 }, { eventId: "rootBackSoil", weight: 28 }] },
  ] },
  groundwater: { id: "groundwater", title: "地下水脈", location: "地下・帯水層", phase: "液体", prompt: "地上の時間は見えない。流れだけが方向を教える。", visual: "groundwater", choices: [
    { id: "sand", label: "砂の多い方へ", icon: "⋯", hint: "流れが少し速い", events: [{ eventId: "groundSpring", weight: 100 }] },
    { id: "coldGap", label: "冷たい割れ目へ", icon: "⌄", hint: "さらに深そう", events: [{ eventId: "groundDeep", weight: 100 }] },
    { id: "farSound", label: "遠い振動へ", icon: "≈", hint: "水音のような気配", events: [{ eventId: "groundSpring", weight: 68 }, { eventId: "groundDeep", weight: 32 }] },
  ] },
  spring: { id: "spring", title: "久しぶりの光", location: "山麓・湧水", phase: "液体", prompt: "岩の間から空が見える。すぐ隣で沢が始まっている。", visual: "spring", choices: [
    { id: "springFlow", label: "水音の方へ", icon: "〰", hint: "小さな沢", events: [{ eventId: "springRiver", weight: 100 }] },
    { id: "springSun", label: "陽だまりへ", icon: "☀", hint: "岩が暖かい", events: [{ eventId: "springSun", weight: 100 }] },
    { id: "springNatural", label: "流れにまかせる", icon: "◎", hint: "湧水に押される", events: [{ eventId: "springRiver", weight: 76 }, { eventId: "springSun", weight: 24 }] },
  ] },
  river: { id: "river", title: "大きな流れ", location: "河川", phase: "液体", prompt: "岩、泡、水面。川の中ではすべてが動いている。", visual: "river", choices: [
    { id: "foam", label: "泡に近づく", icon: "○", hint: "流れが速い", events: [{ eventId: "riverRapid", weight: 100 }] },
    { id: "rock", label: "大岩の裏へ", icon: "⬡", hint: "流れが弱そう", events: [{ eventId: "riverBank", weight: 100 }] },
    { id: "surface", label: "光る水面へ", icon: "☀", hint: "空が見える", events: [{ eventId: "riverSun", weight: 100 }] },
  ] },
  ocean: { id: "ocean", title: "海の中", location: "海・外洋", phase: "液体", prompt: "広すぎて、自分がどこにいるのか分からない。", visual: "ocean", choices: [
    { id: "light", label: "光の揺れる方へ", icon: "↑", hint: "海面が近い", events: [{ eventId: "oceanSurface", weight: 100 }] },
    { id: "coldCurrent", label: "冷たい流れへ", icon: "⇣", hint: "深い青へ続く", events: [{ eventId: "oceanDeep", weight: 100 }] },
    { id: "shadow", label: "巨大な影へ", icon: "◒", hint: "ゆっくり近づく", events: [{ eventId: "oceanWhale", weight: 56 }, { eventId: "oceanDeep", weight: 44 }] },
  ] },
  vapor: { id: "vapor", title: "空へほどけた", location: "大気", phase: "気体", prompt: "もう一滴の形はない。空気の流れだけが見える。", visual: "vapor", choices: [
    { id: "updraft", label: "上昇気流へ", icon: "↑", hint: "冷たい空へ", events: [{ eventId: "vaporCondense", weight: 100 }] },
    { id: "wind", label: "風の筋へ", icon: "→", hint: "遠くへ運ばれる", events: [{ eventId: "vaporCondense", weight: 100 }] },
    { id: "coldParticle", label: "冷たい粒へ", icon: "·", hint: "雲の種のようだ", events: [{ eventId: "vaporCondense", weight: 100 }] },
  ] },
  cloudReturn: { id: "cloudReturn", title: "そして、また一滴", location: "上空・新しい雲", phase: "液体", prompt: "同じ水の、次の一生が始まる。", visual: "cloudReturn", choices: [
    { id: "nextForest", label: "緑の方へ", icon: "🌿", hint: "次の雨へ", events: [{ eventId: "cloudReturnLeaf", weight: 100 }] },
    { id: "nextGround", label: "暗い森へ", icon: "↓", hint: "葉の隙間が見える", events: [{ eventId: "cloudReturnSoil", weight: 100 }] },
    { id: "nextNatural", label: "流れにまかせる", icon: "◎", hint: "どこへ行くかは水次第", events: [{ eventId: "cloudReturnLeaf", weight: 56 }, { eventId: "cloudReturnSoil", weight: 44 }] },
  ] },
};

function formatElapsed(minutes: number) {
  if (minutes < HOUR) return `${Math.max(1, Math.round(minutes))}分`;
  if (minutes < DAY) return `${Math.round(minutes / HOUR)}時間`;
  if (minutes < YEAR) return `${Math.round(minutes / DAY)}日`;
  const years = minutes / YEAR;
  if (years < 10) return `${years.toFixed(1)}年`;
  return `${Math.round(years).toLocaleString("ja-JP")}年`;
}

function pickWeighted(options: WeightedEvent[], lastEventId: string | null) {
  const weighted = options.map((option) => ({ ...option, adjustedWeight: option.eventId === lastEventId && options.length > 1 ? option.weight * 0.3 : option.weight }));
  const total = weighted.reduce((sum, item) => sum + item.adjustedWeight, 0);
  let roll = Math.random() * total;
  for (const item of weighted) { roll -= item.adjustedWeight; if (roll <= 0) return item.eventId; }
  return weighted[weighted.length - 1].eventId;
}

function DropShape({ x, y, scale = 1, className = "" }: { x: number; y: number; scale?: number; className?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} className={className} filter="url(#dropGlow)"><ellipse cx="0" cy="30" rx="27" ry="9" fill="#17a9dc" opacity=".15" /><path d="M0-34 C16-13 27 2 27 18 C27 35 15 47 0 47 C-15 47-27 35-27 18 C-27 2-16-13 0-34Z" fill="url(#dropGradient)" stroke="#effcff" strokeWidth="2" /><ellipse cx="-8" cy="0" rx="6" ry="12" fill="#fff" opacity=".72" transform="rotate(18)" /></g>;
}

function SceneDefs() {
  return <defs><linearGradient id="dropGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".28" stopColor="#aeeaff" /><stop offset="1" stopColor="#168fc8" /></linearGradient><linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#85d2ef" /><stop offset="1" stopColor="#eaf9ff" /></linearGradient><linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#83cf66" /><stop offset="1" stopColor="#2f7953" /></linearGradient><linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#906d4b" /><stop offset="1" stopColor="#382c29" /></linearGradient><linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#76dcf2" /><stop offset="1" stopColor="#1680b3" /></linearGradient><linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#59cbe9" /><stop offset=".42" stopColor="#147eae" /><stop offset="1" stopColor="#052c55" /></linearGradient><radialGradient id="sunGrad"><stop offset="0" stopColor="#fffbe0" /><stop offset="1" stopColor="#ffd56b" /></radialGradient><filter id="dropGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>;
}

function Clouds() { return <><g className={styles.cloudA} fill="#fff" opacity=".96"><ellipse cx="70" cy="118" rx="72" ry="31" /><ellipse cx="130" cy="108" rx="72" ry="42" /><ellipse cx="184" cy="127" rx="58" ry="29" /></g><g className={styles.cloudB} fill="#d9edf5" opacity=".72"><ellipse cx="262" cy="195" rx="75" ry="27" /><ellipse cx="322" cy="184" rx="66" ry="35" /><ellipse cx="375" cy="203" rx="58" ry="25" /></g></>; }

function SceneArt({ visual }: { visual: VisualKey }) {
  const sky = ["cloud", "cloudMerge", "fall", "vapor", "condense", "cloudReturn"].includes(visual);
  return <svg className={styles.art} viewBox="0 0 390 650" preserveAspectRatio="xMidYMid slice" role="img" aria-label="一滴が旅する世界"><SceneDefs />{sky && <rect width="390" height="650" fill="url(#skyGrad)" />}
    {(visual === "cloud" || visual === "cloudMerge" || visual === "fall" || visual === "cloudReturn") && <><circle cx="315" cy="90" r="43" fill="url(#sunGrad)" opacity=".72" className={styles.sunPulse} /><Clouds /><path d="M0 505 Q70 430 145 476 T285 463 T410 450 L410 650 L0 650Z" fill="#7fac93" opacity=".62" /><path d="M0 548 Q90 470 176 528 T410 495 L410 650 L0 650Z" fill="#497c66" opacity=".78" />{visual === "cloud" && <DropShape x={164} y={160} scale={.64} className={styles.dropFloat} />}{visual === "cloudMerge" && <g className={styles.mergeGroup}><DropShape x={154} y={165} scale={.56} /><DropShape x={198} y={168} scale={.56} /></g>}{visual === "fall" && <DropShape x={195} y={300} scale={.92} className={styles.dropFall} />}{visual === "cloudReturn" && <><g className={styles.returnSparkles} fill="#fff"><circle cx="165" cy="160" r="4" /><circle cx="198" cy="145" r="3" /><circle cx="218" cy="177" r="2" /></g><DropShape x={190} y={177} scale={.72} className={styles.dropFloat} /></>}</>}
    {(visual === "leaf" || visual === "leafMerge" || visual === "leafEdge" || visual === "frog") && <><rect width="390" height="650" fill="url(#skyGrad)" /><circle cx="330" cy="75" r="38" fill="url(#sunGrad)" opacity=".68" /><path d="M-65 550 C30 230 230 205 470 350 C325 410 195 535-65 550Z" fill="url(#leafGrad)" /><path d="M-20 522 C120 418 230 350 425 337" fill="none" stroke="#cbe99b" strokeWidth="14" strokeLinecap="round" opacity=".72" /><path d="M92 451 Q129 390 147 330 M180 410 Q214 355 242 304 M262 373 Q307 334 340 308" fill="none" stroke="#b7dd8b" strokeWidth="6" strokeLinecap="round" opacity=".67" /><g className={styles.leafSway}>{visual === "leaf" && <DropShape x={202} y={362} scale={.82} className={styles.dropFloat} />}{visual === "leafMerge" && <DropShape x={248} y={357} scale={1.08} className={styles.dropSlide} />}{visual === "leafEdge" && <DropShape x={343} y={334} scale={.86} className={styles.dropEdge} />}</g><g fill="#dff8ff" opacity=".76" className={styles.rainSpecks}><circle cx="80" cy="250" r="6" /><circle cx="120" cy="290" r="3" /><circle cx="292" cy="240" r="5" /></g>{visual === "frog" && <g className={styles.frogJump} transform="translate(282 410)"><ellipse cx="0" cy="0" rx="55" ry="40" fill="#4d8f45" /><circle cx="-28" cy="-32" r="18" fill="#6aaa58" /><circle cx="27" cy="-32" r="18" fill="#6aaa58" /><circle cx="-28" cy="-34" r="7" fill="#172b22" /><circle cx="27" cy="-34" r="7" fill="#172b22" /><path d="M-22 9 Q0 26 22 9" fill="none" stroke="#23452d" strokeWidth="5" strokeLinecap="round" /></g>}</>}
    {visual === "spider" && <><rect width="390" height="650" fill="#163c3c" /><circle cx="310" cy="100" r="52" fill="#d5f4ef" opacity=".22" /><g className={styles.webPulse} stroke="#dff8f4" strokeWidth="2" opacity=".72" fill="none"><path d="M195 28 L195 620 M30 325 L360 325 M72 92 L320 568 M322 92 L70 570" /><ellipse cx="195" cy="325" rx="55" ry="75" /><ellipse cx="195" cy="325" rx="105" ry="145" /><ellipse cx="195" cy="325" rx="155" ry="215" /></g><DropShape x={197} y={326} scale={.75} className={styles.dropTrapped} /><g transform="translate(315 220)" fill="#0c2427" className={styles.spiderMove}><circle r="18" /><path d="M-15 0 l-30 -25 M-15 8 l-35 10 M15 0 l30 -25 M15 8 l35 10" stroke="#0c2427" strokeWidth="6" /></g></>}
    {visual === "frogInside" && <><rect width="390" height="650" fill="#183b2d" /><ellipse cx="195" cy="325" rx="165" ry="265" fill="#2d6043" /><ellipse cx="195" cy="325" rx="105" ry="205" fill="#1f4835" /><path d="M105 210 Q195 255 285 210 M95 385 Q195 340 295 385" fill="none" stroke="#5f9366" strokeWidth="12" opacity=".6" /><DropShape x={195} y={330} scale={.72} className={styles.dropFlow} /><g fill="#93c58a" opacity=".4" className={styles.bubbles}><circle cx="130" cy="280" r="9" /><circle cx="250" cy="390" r="6" /><circle cx="155" cy="440" r="4" /></g></>}
    {visual === "pond" && <><rect width="390" height="650" fill="#b9e6d2" /><rect y="270" width="390" height="380" fill="url(#waterGrad)" /><path d="M0 270 Q65 246 130 272 T260 270 T390 268" fill="none" stroke="#e4fbff" strokeWidth="7" opacity=".8" className={styles.waveLine} /><path d="M0 555 Q100 505 210 545 T390 520 L390 650 L0 650Z" fill="#465e3b" opacity=".72" /><g fill="#285f51" opacity=".55"><path d="M20 160 Q50 120 85 170 Q52 162 20 160Z" /><path d="M310 180 Q345 130 380 175 Q345 170 310 180Z" /></g><DropShape x={198} y={330} scale={.52} className={styles.dropFloat} /><g className={styles.fishPass} fill="#d6f3dd" opacity=".5"><path d="M50 420 q35-28 70 0 q-35 28-70 0Z" /><path d="M50 420 l-24-18 v36Z" /></g></>}
    {(visual === "soil" || visual === "root") && <><rect width="390" height="650" fill="url(#soilGrad)" /><rect width="390" height="90" fill="#508458" /><path d="M0 90 Q80 70 160 92 T320 88 T420 92" fill="#325e43" /><g fill="#b69366" opacity=".72"><circle cx="66" cy="180" r="48" /><circle cx="298" cy="170" r="70" /><circle cx="116" cy="360" r="64" /><circle cx="320" cy="430" r="78" /><circle cx="52" cy="570" r="56" /></g><g fill="#584438" opacity=".75"><circle cx="220" cy="280" r="43" /><circle cx="202" cy="535" r="52" /></g><path d="M185 0 C178 120 210 190 180 270 C160 330 198 410 165 650" fill="none" stroke="#d6c094" strokeWidth="30" strokeLinecap="round" /><path d="M185 115 Q120 175 95 255 M183 250 Q250 290 292 350 M173 420 Q120 455 104 520" fill="none" stroke="#cbb083" strokeWidth="14" strokeLinecap="round" /><DropShape x={visual === "root" ? 188 : 248} y={visual === "root" ? 290 : 315} scale={.58} className={visual === "root" ? styles.dropRootPull : styles.dropSink} /><g fill="#ecdbb6" opacity=".32" className={styles.soilDust}><circle cx="250" cy="230" r="3" /><circle cx="85" cy="300" r="4" /><circle cx="275" cy="520" r="3" /></g></>}
    {visual === "rootInside" && <><rect width="390" height="650" fill="#d6e9b9" /><path d="M70 -20 C48 150 95 290 65 690 M160 -20 C135 160 185 330 155 690 M265 -20 C240 160 300 350 262 690 M350 -20 C330 160 370 330 345 690" fill="none" stroke="#7ca56f" strokeWidth="45" opacity=".5" /><path d="M70 -20 C48 150 95 290 65 690 M160 -20 C135 160 185 330 155 690 M265 -20 C240 160 300 350 262 690 M350 -20 C330 160 370 330 345 690" fill="none" stroke="#eef5ce" strokeWidth="15" opacity=".7" /><DropShape x={194} y={380} scale={.64} className={styles.dropRise} /><g className={styles.riseBubbles} fill="#8bd9e1" opacity=".65"><circle cx="110" cy="470" r="8" /><circle cx="280" cy="430" r="5" /><circle cx="218" cy="520" r="6" /></g></>}
    {(visual === "groundwater" || visual === "deepTime") && <><rect width="390" height="650" fill="#132f38" /><path d="M-20 110 Q80 40 190 105 T420 100 L420 230 Q300 175 175 225 T-20 210Z" fill="#42595a" /><path d="M-20 350 Q80 270 190 338 T420 326 L420 470 Q300 410 175 455 T-20 440Z" fill="#34484c" /><path d="M-20 535 Q100 470 210 535 T420 520 L420 650 L-20 650Z" fill="#263b40" /><path d="M0 315 Q85 275 165 318 T330 310 T420 302" fill="none" stroke="#38b7d8" strokeWidth="30" opacity=".56" className={styles.groundFlow} /><path d="M0 315 Q85 275 165 318 T330 310 T420 302" fill="none" stroke="#9beaff" strokeWidth="5" opacity=".55" /><DropShape x={208} y={312} scale={.5} className={visual === "deepTime" ? styles.dropTime : styles.dropFlow} /><g fill="#b6d6d7" opacity=".2" className={styles.groundSpecks}><circle cx="80" cy="150" r="4" /><circle cx="300" cy="220" r="3" /><circle cx="120" cy="500" r="5" /></g></>}
    {visual === "spring" && <><rect width="390" height="650" fill="#91cfd2" /><path d="M0 0 H390 V650 H0Z" fill="#293e38" /><path d="M35 0 Q115 180 105 650 H285 Q270 220 355 0Z" fill="#5d7267" /><ellipse cx="195" cy="225" rx="92" ry="135" fill="#c9f3e8" opacity=".82" /><path d="M65 570 Q150 500 230 552 T390 540 V650 H0V610Z" fill="#2d94ac" /><path d="M92 560 Q180 515 270 557" fill="none" stroke="#b8f5ff" strokeWidth="7" opacity=".65" /><DropShape x={204} y={480} scale={.58} className={styles.dropRise} /></>}
    {(visual === "river" || visual === "rapid") && <><rect width="390" height="650" fill="#88cfd4" /><path d="M0 0 Q90 90 100 250 T80 650 H310 Q280 420 320 260 T390 0Z" fill="#4d795d" /><path d="M80 0 Q155 110 145 250 T125 650 H300 Q260 420 300 250 T325 0Z" fill="url(#waterGrad)" /><g fill="#54615c" opacity=".9"><ellipse cx="105" cy="220" rx="54" ry="40" /><ellipse cx="292" cy="360" rx="70" ry="48" /><ellipse cx="130" cy="510" rx="58" ry="42" /></g><g className={visual === "rapid" ? styles.rapidLines : styles.riverLines} fill="none" stroke="#d8f9ff" strokeLinecap="round" opacity=".72"><path d="M145 80 Q210 125 270 92" strokeWidth="8" /><path d="M115 300 Q190 340 255 305" strokeWidth="6" /><path d="M150 455 Q210 495 285 458" strokeWidth="9" /></g><DropShape x={198} y={visual === "rapid" ? 410 : 320} scale={.46} className={visual === "rapid" ? styles.dropRapid : styles.dropFlow} />{visual === "rapid" && <g fill="#fff" opacity=".65" className={styles.foam}><circle cx="175" cy="365" r="9" /><circle cx="235" cy="432" r="7" /><circle cx="152" cy="456" r="5" /></g>}</>}
    {(visual === "ocean" || visual === "deepOcean" || visual === "whale") && <><rect width="390" height="650" fill="url(#oceanGrad)" /><path d="M0 92 Q65 75 130 94 T260 91 T390 89" fill="none" stroke="#d5f8ff" strokeWidth="8" opacity=".52" className={styles.waveLine} /><g className={styles.fishPass2} fill="#bfe3e4" opacity=".2"><path d="M55 240 q42-30 84 0 q-42 30-84 0Z" /><path d="M55 240 l-28-22 v44Z" /></g><g className={styles.fishPass3} fill="#bfe3e4" opacity=".14"><path d="M250 430 q55-38 110 0 q-55 38-110 0Z" /><path d="M250 430 l-35-26 v52Z" /></g>{visual === "ocean" && <DropShape x={196} y={330} scale={.26} className={styles.dropFloat} />}{visual === "deepOcean" && <><rect width="390" height="650" fill="#001d3a" opacity=".62" /><DropShape x={196} y={430} scale={.23} className={styles.dropTime} /><circle cx="310" cy="505" r="2" fill="#bdf8ff" opacity=".7" /><circle cx="324" cy="490" r="1.5" fill="#bdf8ff" opacity=".5" /></>}{visual === "whale" && <g className={styles.whalePass} fill="#082b45" opacity=".92"><ellipse cx="210" cy="345" rx="205" ry="95" /><path d="M40 345 L-65 265 L-38 355 L-65 430Z" /><path d="M320 320 Q380 270 412 300 Q375 345 330 358Z" /><circle cx="330" cy="325" r="6" fill="#99dbe5" /></g>}</>}
    {(visual === "vapor" || visual === "condense") && <><circle cx="310" cy="90" r="44" fill="url(#sunGrad)" opacity=".74" /><g className={styles.vaporParticles} fill="#eafcff" opacity=".78"><circle cx="155" cy="390" r="6" /><circle cx="185" cy="345" r="4" /><circle cx="215" cy="310" r="5" /><circle cx="245" cy="270" r="3" /><circle cx="265" cy="220" r="4" /></g>{visual === "condense" && <g className={styles.condenseGroup}><circle cx="188" cy="205" r="6" fill="#b8ecff" /><circle cx="212" cy="208" r="5" fill="#b8ecff" /><circle cx="200" cy="188" r="4" fill="#b8ecff" /><DropShape x={200} y={215} scale={.5} /></g>}<path d="M0 540 Q80 470 155 520 T300 510 T410 490 L410 650 L0 650Z" fill="#6d9a82" opacity=".45" /></>}
  </svg>;
}

function playFeedback(kind: "tap" | "discovery" | "cycle") {
  if (typeof window === "undefined") return;
  if ("vibrate" in navigator) navigator.vibrate(kind === "tap" ? 12 : kind === "cycle" ? [30, 35, 50] : [20, 25, 20]);
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.value = kind === "tap" ? 330 : kind === "cycle" ? 740 : 610;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(kind === "tap" ? 0.025 : 0.045, ctx.currentTime + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === "tap" ? 0.07 : 0.18));
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.2); osc.addEventListener("ended", () => void ctx.close());
  } catch { /* optional */ }
}

export default function DropGame() {
  const [locationId, setLocationId] = useState("cloud");
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [discoveries, setDiscoveries] = useState<Set<string>>(() => new Set());
  const [freshDiscovery, setFreshDiscovery] = useState<Discovery | null>(null);
  const [route, setRoute] = useState<RoutePoint[]>([{ label: "雲", minutes: 0 }]);
  const [journalOpen, setJournalOpen] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const processedBeatKey = useRef<string | null>(null);
  const freshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { try { const saved = window.localStorage.getItem("drop-discoveries-v04"); if (saved) setDiscoveries(new Set(JSON.parse(saved) as string[])); } catch { /* optional */ } }, []);

  useEffect(() => {
    if (!activeEvent) return;
    const beat = activeEvent.event.beats[activeEvent.beatIndex];
    const key = `${activeEvent.event.id}:${activeEvent.beatIndex}`;
    if (processedBeatKey.current !== key) {
      processedBeatKey.current = key;
      if (beat.minutes) setElapsed((value) => value + beat.minutes!);
      if (beat.discovery) {
        const item = discoveryCatalog.find((entry) => entry.id === beat.discovery);
        if (item) setDiscoveries((current) => {
          if (current.has(item.id)) return current;
          const next = new Set(current); next.add(item.id);
          try { window.localStorage.setItem("drop-discoveries-v04", JSON.stringify([...next])); } catch { /* optional */ }
          setFreshDiscovery(item); playFeedback("discovery"); if (freshTimer.current) clearTimeout(freshTimer.current); freshTimer.current = setTimeout(() => setFreshDiscovery(null), 2600); return next;
        });
      }
    }
    const timer = setTimeout(() => {
      if (activeEvent.beatIndex < activeEvent.event.beats.length - 1) { setActiveEvent({ event: activeEvent.event, beatIndex: activeEvent.beatIndex + 1 }); return; }
      const destination = locations[activeEvent.event.to];
      if (activeEvent.event.completesCycle) { setCycle((value) => value + 1); playFeedback("cycle"); }
      if (destination) { setLocationId(destination.id); setRoute((current) => [...current.slice(-11), { label: destination.title, minutes: elapsed }]); }
      setLastEventId(activeEvent.event.id); setActiveEvent(null); processedBeatKey.current = null;
    }, beat.duration);
    return () => clearTimeout(timer);
  }, [activeEvent, elapsed]);

  useEffect(() => () => { if (freshTimer.current) clearTimeout(freshTimer.current); }, []);

  const location = locations[locationId] ?? locations.cloud;
  const currentBeat = activeEvent ? activeEvent.event.beats[activeEvent.beatIndex] : null;
  const visual = currentBeat?.visual ?? location.visual;
  const progress = activeEvent ? (activeEvent.beatIndex + 1) / activeEvent.event.beats.length : 0;
  const discoveredItems = useMemo(() => discoveryCatalog.filter((item) => discoveries.has(item.id)), [discoveries]);

  function choose(choice: Choice) {
    if (activeEvent) return; playFeedback("tap"); const eventId = pickWeighted(choice.events, lastEventId); const event = events[eventId]; if (!event) return; setActiveEvent({ event, beatIndex: 0 });
  }

  return <main className={styles.page}><div className={styles.shell}>
    <header className={styles.hud}><div className={styles.brand}><b>一滴</b><span>DROP</span></div><div className={styles.hudRight}><div className={styles.stat}><small>TIME</small><strong>{formatElapsed(elapsed)}</strong></div><div className={styles.stat}><small>CYCLE</small><strong>{cycle}</strong></div><button className={styles.memoryButton} onClick={() => setJournalOpen(true)} aria-label="水の記憶を開く"><span>記憶</span><b>{discoveries.size}</b></button></div></header>
    <section className={styles.stage} aria-live="polite"><div key={`${visual}-${activeEvent?.beatIndex ?? "idle"}`} className={styles.sceneLayer}><SceneArt visual={visual} /></div><div className={styles.locationPill}><i />{location.location}<span>{location.phase}</span></div>
      {currentBeat?.timeLabel && <div className={styles.timeJump}><small>TIME FLOW</small><strong>{currentBeat.timeLabel}</strong><span>水だけが、ゆっくり動き続ける。</span></div>}
      {currentBeat?.emphasis && <div className={styles.emphasis}>{currentBeat.emphasis}</div>}
      <div className={`${styles.storyCard} ${activeEvent ? styles.storyEvent : ""}`}><div className={styles.storyTop}><strong>{activeEvent ? `出来事 ${activeEvent.beatIndex + 1}/${activeEvent.event.beats.length}` : location.title}</strong>{activeEvent && <div className={styles.eventProgress}><span style={{ width: `${progress * 100}%` }} /></div>}</div><p>{currentBeat?.text ?? location.prompt}</p></div>
      {freshDiscovery && <div className={styles.discoveryToast}><small>NEW DISCOVERY</small><strong>{freshDiscovery.title}</strong><span>{freshDiscovery.category} · {freshDiscovery.rarity}</span></div>}
    </section>
    <section className={`${styles.choicePanel} ${activeEvent ? styles.choicePanelHidden : ""}`} aria-hidden={Boolean(activeEvent)}><div className={styles.choicePrompt}><span>この一滴は、どう動く？</span><small>結果は選ぶまで分からない</small></div><div className={styles.choices}>{location.choices.map((choice) => <button key={choice.id} className={styles.choice} onClick={() => choose(choice)} disabled={Boolean(activeEvent)}><span className={styles.choiceIcon}>{choice.icon}</span><span className={styles.choiceCopy}><b>{choice.label}</b><small>{choice.hint}</small></span><span className={styles.choiceArrow}>›</span></button>)}</div></section>
    {journalOpen && <div className={styles.journalBackdrop} onClick={() => setJournalOpen(false)}><section className={styles.journal} onClick={(event) => event.stopPropagation()}><div className={styles.journalHead}><div><small>MY DROP</small><h2>水の記憶</h2></div><button onClick={() => setJournalOpen(false)} aria-label="閉じる">×</button></div><div className={styles.journalSummary}><div><small>発見</small><strong>{discoveries.size}<span> / {discoveryCatalog.length}</span></strong></div><div><small>循環</small><strong>{cycle}<span> 周</span></strong></div><div><small>旅した時間</small><strong>{formatElapsed(elapsed)}</strong></div></div><h3>最近の旅</h3><div className={styles.routeLine}>{route.slice(-7).map((point, index) => <span key={`${point.label}-${index}`}>{point.label}</span>)}</div><h3>発見した水</h3><div className={styles.discoveryGrid}>{discoveryCatalog.map((item) => { const found = discoveries.has(item.id); return <article key={item.id} className={found ? styles.discoveryItem : styles.discoveryLocked}><small>{found ? item.rarity : "???"}</small><strong>{found ? item.title : "未発見"}</strong><p>{found ? item.description : "旅のどこかに、まだ知らない水がある。"}</p></article>; })}</div>{discoveredItems.length === 0 && <p className={styles.emptyJournal}>最初の発見は、もうすぐ。</p>}</section></div>}
  </div></main>;
}
