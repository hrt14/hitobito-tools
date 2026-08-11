"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./dropV05.module.css";

type Rarity = "COMMON" | "UNCOMMON" | "RARE" | "VERY RARE" | "LEGEND";
type HeroPose = "idle" | "fall" | "slide" | "flow" | "squash" | "merge" | "trapped" | "rise" | "evaporate" | "condense";
type TransitionKey = "none" | "follow" | "fall" | "dive" | "zoomOut" | "flow" | "swallow" | "dissolve";
type VisualKey = "cloud" | "cloudMerge" | "fall" | "leaf" | "leafMerge" | "leafEdge" | "spider" | "frog" | "frogInside" | "pond" | "soil" | "root" | "rootInside" | "groundwater" | "deepTime" | "spring" | "river" | "rapid" | "ocean" | "deepOcean" | "whale" | "vapor" | "condense" | "cloudReturn";

type Discovery = { id: string; title: string; category: string; rarity: Rarity; description: string };
type Beat = { visual: VisualKey; duration: number; text?: string; minutes?: number; discovery?: string; timeLabel?: string; emphasis?: string; heroPose?: HeroPose; transition?: TransitionKey };
type EventChain = { id: string; to: string; beats: Beat[]; completesCycle?: boolean };
type WeightedEvent = { eventId: string; weight: number };
type Hotspot = { x: number; y: number; radius?: number };
type Choice = { id: string; label: string; icon: string; events: WeightedEvent[]; hotspot: Hotspot };
type LocationNode = { id: string; title: string; visual: VisualKey; phase: "液体" | "気体" | "固体"; choices: Choice[] };
type ActiveEvent = { event: EventChain; beatIndex: number };

const HOUR = 60;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;

const discoveries: Discovery[] = [
  { id: "rain_drop", title: "雨粒", category: "空", rarity: "COMMON", description: "雲から落ち始めた水。" },
  { id: "merged_drop", title: "合体した一滴", category: "現象", rarity: "UNCOMMON", description: "別の水滴と一つになった。" },
  { id: "leaf_world", title: "巨大な葉", category: "森", rarity: "COMMON", description: "一滴には葉脈も谷のように巨大。" },
  { id: "spider_water", title: "蜘蛛の巣の水", category: "森", rarity: "RARE", description: "細い糸に捕まった水。" },
  { id: "frog_water", title: "カエルの中の水", category: "生物", rarity: "RARE", description: "カエルに飲み込まれた水。" },
  { id: "pond_water", title: "池の水", category: "淡水", rarity: "COMMON", description: "小さな池にたどり着いた水。" },
  { id: "soil_water", title: "土の中の水", category: "地下", rarity: "COMMON", description: "土粒の間を進む水。" },
  { id: "tree_water", title: "木の中の水", category: "生物", rarity: "RARE", description: "根から吸い上げられた水。" },
  { id: "groundwater_17", title: "17年の地下旅行", category: "地下", rarity: "RARE", description: "帯水層を17年旅した。" },
  { id: "groundwater_83", title: "83年の暗闇", category: "地下", rarity: "VERY RARE", description: "深い岩盤で83年過ごした。" },
  { id: "spring_water", title: "湧水", category: "山", rarity: "UNCOMMON", description: "地下から光へ戻った水。" },
  { id: "rapid_water", title: "激流の一滴", category: "川", rarity: "UNCOMMON", description: "泡と岩の間を高速で流れた。" },
  { id: "ocean_water", title: "海の一滴", category: "海", rarity: "COMMON", description: "巨大な海に混ざった一滴。" },
  { id: "deep_ocean", title: "140年の深海", category: "海", rarity: "VERY RARE", description: "光の届かない海を140年旅した。" },
  { id: "whale_water", title: "クジラの中の水", category: "生物", rarity: "LEGEND", description: "巨大な生物に取り込まれた水。" },
  { id: "vapor_water", title: "空へほどけた水", category: "空", rarity: "UNCOMMON", description: "粒子になって空へ上がった。" },
  { id: "cycle_complete", title: "再び雲へ", category: "循環", rarity: "RARE", description: "次の一生のため雲へ戻った。" },
];

const events: Record<string, EventChain> = {
  cloudEdgeFall: { id: "cloudEdgeFall", to: "leaf", beats: [
    { visual: "cloud", duration: 600, transition: "follow" },
    { visual: "fall", duration: 1100, heroPose: "fall", minutes: 6, discovery: "rain_drop", transition: "fall" },
    { visual: "leafEdge", duration: 900, heroPose: "squash", discovery: "leaf_world", transition: "follow" },
  ]},
  cloudColdFall: { id: "cloudColdFall", to: "leaf", beats: [
    { visual: "cloudMerge", duration: 850, heroPose: "merge", discovery: "merged_drop" },
    { visual: "fall", duration: 1150, heroPose: "fall", minutes: 11, discovery: "rain_drop", transition: "fall" },
    { visual: "leaf", duration: 850, heroPose: "squash", discovery: "leaf_world" },
  ]},
  cloudMergeFall: { id: "cloudMergeFall", to: "leaf", beats: [
    { visual: "cloudMerge", duration: 1000, heroPose: "merge", discovery: "merged_drop" },
    { visual: "fall", duration: 1050, heroPose: "fall", minutes: 7, discovery: "rain_drop", transition: "fall" },
    { visual: "leaf", duration: 900, heroPose: "squash", discovery: "leaf_world" },
  ]},
  leafGround: { id: "leafGround", to: "soil", beats: [
    { visual: "leafEdge", duration: 650, heroPose: "slide", transition: "follow" },
    { visual: "fall", duration: 850, heroPose: "fall", minutes: 1, transition: "fall" },
    { visual: "soil", duration: 1100, heroPose: "squash", minutes: 4, discovery: "soil_water", transition: "dive" },
  ]},
  leafFrog: { id: "leafFrog", to: "pond", beats: [
    { visual: "leafEdge", duration: 650, heroPose: "slide" },
    { visual: "frog", duration: 800, heroPose: "fall", emphasis: "!", transition: "swallow" },
    { visual: "frogInside", duration: 1100, heroPose: "flow", minutes: 8, discovery: "frog_water", transition: "swallow" },
    { visual: "pond", duration: 950, heroPose: "flow", minutes: 2 * HOUR, discovery: "pond_water" },
  ]},
  leafSpider: { id: "leafSpider", to: "spiderweb", beats: [
    { visual: "fall", duration: 700, heroPose: "fall", minutes: 1 },
    { visual: "spider", duration: 1200, heroPose: "trapped", discovery: "spider_water" },
  ]},
  leafMergeSlide: { id: "leafMergeSlide", to: "soil", beats: [
    { visual: "leafMerge", duration: 900, heroPose: "merge", discovery: "merged_drop" },
    { visual: "leafEdge", duration: 750, heroPose: "slide", minutes: 2 },
    { visual: "soil", duration: 1050, heroPose: "squash", minutes: 5, discovery: "soil_water", transition: "dive" },
  ]},
  leafMergeWeb: { id: "leafMergeWeb", to: "spiderweb", beats: [
    { visual: "leafMerge", duration: 900, heroPose: "merge", discovery: "merged_drop" },
    { visual: "fall", duration: 650, heroPose: "fall" },
    { visual: "spider", duration: 1100, heroPose: "trapped", discovery: "spider_water" },
  ]},
  leafSun: { id: "leafSun", to: "vapor", beats: [
    { visual: "leaf", duration: 700, minutes: 2 * HOUR },
    { visual: "vapor", duration: 1450, heroPose: "evaporate", minutes: 3 * HOUR, discovery: "vapor_water", transition: "dissolve" },
  ]},
  leafWind: { id: "leafWind", to: "soil", beats: [
    { visual: "leafEdge", duration: 700, heroPose: "slide", emphasis: "風" },
    { visual: "fall", duration: 700, heroPose: "fall", minutes: 2 },
    { visual: "soil", duration: 1050, heroPose: "squash", minutes: 7, discovery: "soil_water", transition: "dive" },
  ]},
  webDrop: { id: "webDrop", to: "soil", beats: [
    { visual: "spider", duration: 800, heroPose: "trapped" },
    { visual: "fall", duration: 750, heroPose: "fall", minutes: 4 },
    { visual: "soil", duration: 950, heroPose: "squash", minutes: 5, discovery: "soil_water" },
  ]},
  webSun: { id: "webSun", to: "vapor", beats: [
    { visual: "spider", duration: 800, minutes: HOUR },
    { visual: "vapor", duration: 1300, heroPose: "evaporate", minutes: 2 * HOUR, discovery: "vapor_water" },
  ]},
  pondStream: { id: "pondStream", to: "river", beats: [
    { visual: "pond", duration: 650, heroPose: "flow", minutes: HOUR },
    { visual: "river", duration: 1100, heroPose: "flow", minutes: 5 * HOUR, transition: "flow" },
  ]},
  pondSun: { id: "pondSun", to: "vapor", beats: [
    { visual: "pond", duration: 700, minutes: 4 * HOUR },
    { visual: "vapor", duration: 1350, heroPose: "evaporate", minutes: 3 * HOUR, discovery: "vapor_water" },
  ]},
  pondMud: { id: "pondMud", to: "soil", beats: [
    { visual: "pond", duration: 700, heroPose: "fall", minutes: HOUR },
    { visual: "soil", duration: 1000, heroPose: "flow", minutes: 6 * HOUR, discovery: "soil_water", transition: "dive" },
  ]},
  soilRoot: { id: "soilRoot", to: "root", beats: [
    { visual: "root", duration: 900, heroPose: "flow", minutes: 20 },
    { visual: "rootInside", duration: 1100, heroPose: "rise", minutes: 3 * HOUR, discovery: "tree_water", transition: "follow" },
  ]},
  soilGround17: { id: "soilGround17", to: "groundwater", beats: [
    { visual: "soil", duration: 650, heroPose: "fall", transition: "dive" },
    { visual: "groundwater", duration: 850, heroPose: "flow", minutes: 2 * DAY },
    { visual: "deepTime", duration: 1700, heroPose: "flow", minutes: 17 * YEAR, discovery: "groundwater_17", timeLabel: "17 YEARS" },
  ]},
  soilGround83: { id: "soilGround83", to: "groundwater", beats: [
    { visual: "soil", duration: 650, heroPose: "fall", transition: "dive" },
    { visual: "groundwater", duration: 850, heroPose: "flow", minutes: 5 * DAY },
    { visual: "deepTime", duration: 1900, heroPose: "flow", minutes: 83 * YEAR, discovery: "groundwater_83", timeLabel: "83 YEARS" },
  ]},
  soilSlope: { id: "soilSlope", to: "river", beats: [
    { visual: "soil", duration: 700, heroPose: "flow", minutes: 3 * HOUR },
    { visual: "river", duration: 1000, heroPose: "flow", minutes: DAY, transition: "flow" },
  ]},
  rootTranspire: { id: "rootTranspire", to: "vapor", beats: [
    { visual: "rootInside", duration: 1050, heroPose: "rise", minutes: DAY, discovery: "tree_water" },
    { visual: "leaf", duration: 650, heroPose: "idle", minutes: HOUR },
    { visual: "vapor", duration: 1300, heroPose: "evaporate", minutes: HOUR, discovery: "vapor_water" },
  ]},
  rootBackSoil: { id: "rootBackSoil", to: "soil", beats: [
    { visual: "rootInside", duration: 700, heroPose: "flow", minutes: 2 * HOUR },
    { visual: "soil", duration: 900, heroPose: "flow", minutes: HOUR },
  ]},
  groundSpring: { id: "groundSpring", to: "spring", beats: [
    { visual: "groundwater", duration: 850, heroPose: "flow", minutes: 2 * YEAR },
    { visual: "spring", duration: 1150, heroPose: "rise", discovery: "spring_water", transition: "follow" },
  ]},
  groundDeep: { id: "groundDeep", to: "groundwater", beats: [
    { visual: "groundwater", duration: 650, heroPose: "fall" },
    { visual: "deepTime", duration: 1900, heroPose: "flow", minutes: 83 * YEAR, discovery: "groundwater_83", timeLabel: "83 YEARS" },
  ]},
  springRiver: { id: "springRiver", to: "river", beats: [
    { visual: "spring", duration: 700, heroPose: "flow", minutes: 20 },
    { visual: "river", duration: 1050, heroPose: "flow", minutes: 3 * HOUR, transition: "flow" },
  ]},
  springSun: { id: "springSun", to: "vapor", beats: [
    { visual: "spring", duration: 700, minutes: 3 * HOUR },
    { visual: "vapor", duration: 1300, heroPose: "evaporate", minutes: 2 * HOUR, discovery: "vapor_water" },
  ]},
  riverRapid: { id: "riverRapid", to: "ocean", beats: [
    { visual: "river", duration: 650, heroPose: "flow" },
    { visual: "rapid", duration: 1250, heroPose: "slide", minutes: DAY, discovery: "rapid_water", transition: "flow" },
    { visual: "ocean", duration: 1450, heroPose: "flow", minutes: 3 * DAY, discovery: "ocean_water", transition: "zoomOut" },
  ]},
  riverBank: { id: "riverBank", to: "soil", beats: [
    { visual: "river", duration: 700, heroPose: "flow", minutes: HOUR },
    { visual: "soil", duration: 950, heroPose: "flow", minutes: 4 * HOUR, discovery: "soil_water" },
  ]},
  riverSun: { id: "riverSun", to: "vapor", beats: [
    { visual: "river", duration: 700, heroPose: "flow", minutes: 4 * HOUR },
    { visual: "vapor", duration: 1300, heroPose: "evaporate", minutes: 3 * HOUR, discovery: "vapor_water" },
  ]},
  oceanSurface: { id: "oceanSurface", to: "vapor", beats: [
    { visual: "ocean", duration: 750, heroPose: "rise", minutes: 18 * DAY },
    { visual: "vapor", duration: 1400, heroPose: "evaporate", minutes: 2 * DAY, discovery: "vapor_water", transition: "dissolve" },
  ]},
  oceanDeep: { id: "oceanDeep", to: "ocean", beats: [
    { visual: "deepOcean", duration: 1000, heroPose: "fall", minutes: 20 * DAY, transition: "dive" },
    { visual: "deepOcean", duration: 1900, heroPose: "flow", minutes: 140 * YEAR, discovery: "deep_ocean", timeLabel: "140 YEARS" },
    { visual: "ocean", duration: 1100, heroPose: "rise", minutes: 2 * YEAR },
  ]},
  oceanWhale: { id: "oceanWhale", to: "ocean", beats: [
    { visual: "ocean", duration: 650, heroPose: "flow" },
    { visual: "whale", duration: 1300, heroPose: "flow", discovery: "whale_water", emphasis: "!", transition: "swallow" },
    { visual: "ocean", duration: 1000, heroPose: "flow", minutes: 6 * HOUR },
  ]},
  vaporCondense: { id: "vaporCondense", to: "cloudReturn", completesCycle: true, beats: [
    { visual: "vapor", duration: 800, heroPose: "rise", minutes: 4 * HOUR },
    { visual: "condense", duration: 1400, heroPose: "condense", minutes: 5 * HOUR },
    { visual: "cloudReturn", duration: 1450, heroPose: "idle", minutes: 2 * HOUR, discovery: "cycle_complete", emphasis: "CYCLE +1" },
  ]},
  cloudReturnLeaf: { id: "cloudReturnLeaf", to: "leaf", beats: [
    { visual: "fall", duration: 1100, heroPose: "fall", minutes: 12, discovery: "rain_drop" },
    { visual: "leaf", duration: 850, heroPose: "squash", discovery: "leaf_world" },
  ]},
  cloudReturnSoil: { id: "cloudReturnSoil", to: "soil", beats: [
    { visual: "fall", duration: 1050, heroPose: "fall", minutes: 18, discovery: "rain_drop" },
    { visual: "soil", duration: 950, heroPose: "squash", minutes: 2, discovery: "soil_water" },
  ]},
};

const locations: Record<string, LocationNode> = {
  cloud: { id: "cloud", title: "雲", visual: "cloud", phase: "液体", choices: [
    { id: "edge", label: "雲の端", icon: "↘", hotspot: { x: 82, y: 36 }, events: [{ eventId: "cloudEdgeFall", weight: 58 }, { eventId: "cloudColdFall", weight: 42 }] },
    { id: "cold", label: "冷たい粒", icon: "❄", hotspot: { x: 22, y: 24 }, events: [{ eventId: "cloudColdFall", weight: 100 }] },
    { id: "merge", label: "水滴", icon: "●", hotspot: { x: 52, y: 31 }, events: [{ eventId: "cloudMergeFall", weight: 100 }] },
  ]},
  leaf: { id: "leaf", title: "葉", visual: "leaf", phase: "液体", choices: [
    { id: "tip", label: "葉先", icon: "↓", hotspot: { x: 88, y: 58 }, events: [{ eventId: "leafGround", weight: 38 }, { eventId: "leafFrog", weight: 32 }, { eventId: "leafSpider", weight: 30 }] },
    { id: "drop", label: "水滴", icon: "●", hotspot: { x: 65, y: 43 }, events: [{ eventId: "leafMergeSlide", weight: 58 }, { eventId: "leafMergeWeb", weight: 42 }] },
    { id: "vein", label: "葉脈", icon: "⌁", hotspot: { x: 35, y: 64 }, events: [{ eventId: "leafSun", weight: 38 }, { eventId: "leafWind", weight: 62 }] },
  ]},
  spiderweb: { id: "spiderweb", title: "蜘蛛の巣", visual: "spider", phase: "液体", choices: [
    { id: "thread", label: "下の糸", icon: "↘", hotspot: { x: 50, y: 78 }, events: [{ eventId: "webDrop", weight: 100 }] },
    { id: "sun", label: "光", icon: "☀", hotspot: { x: 80, y: 18 }, events: [{ eventId: "webSun", weight: 100 }] },
    { id: "sway", label: "揺れ", icon: "◎", hotspot: { x: 24, y: 50 }, events: [{ eventId: "webDrop", weight: 60 }, { eventId: "webSun", weight: 40 }] },
  ]},
  pond: { id: "pond", title: "池", visual: "pond", phase: "液体", choices: [
    { id: "out", label: "流出口", icon: "→", hotspot: { x: 84, y: 43 }, events: [{ eventId: "pondStream", weight: 100 }] },
    { id: "sun", label: "光", icon: "☀", hotspot: { x: 50, y: 29 }, events: [{ eventId: "pondSun", weight: 100 }] },
    { id: "mud", label: "泥", icon: "↓", hotspot: { x: 42, y: 81 }, events: [{ eventId: "pondMud", weight: 100 }] },
  ]},
  soil: { id: "soil", title: "土", visual: "soil", phase: "液体", choices: [
    { id: "root", label: "根", icon: "⌇", hotspot: { x: 34, y: 46 }, events: [{ eventId: "soilRoot", weight: 100 }] },
    { id: "gap", label: "岩の隙間", icon: "◇", hotspot: { x: 64, y: 79 }, events: [{ eventId: "soilGround17", weight: 68 }, { eventId: "soilGround83", weight: 32 }] },
    { id: "side", label: "横の流れ", icon: "→", hotspot: { x: 84, y: 61 }, events: [{ eventId: "soilSlope", weight: 100 }] },
  ]},
  root: { id: "root", title: "木の中", visual: "rootInside", phase: "液体", choices: [
    { id: "up", label: "上", icon: "↑", hotspot: { x: 50, y: 22 }, events: [{ eventId: "rootTranspire", weight: 100 }] },
    { id: "side", label: "外側", icon: "↙", hotspot: { x: 20, y: 62 }, events: [{ eventId: "rootBackSoil", weight: 100 }] },
    { id: "flow", label: "流れ", icon: "◎", hotspot: { x: 72, y: 48 }, events: [{ eventId: "rootTranspire", weight: 72 }, { eventId: "rootBackSoil", weight: 28 }] },
  ]},
  groundwater: { id: "groundwater", title: "地下水", visual: "groundwater", phase: "液体", choices: [
    { id: "sand", label: "砂の流れ", icon: "→", hotspot: { x: 80, y: 55 }, events: [{ eventId: "groundSpring", weight: 100 }] },
    { id: "deep", label: "深い割れ目", icon: "↓", hotspot: { x: 60, y: 82 }, events: [{ eventId: "groundDeep", weight: 100 }] },
    { id: "sound", label: "遠い水音", icon: "≈", hotspot: { x: 22, y: 55 }, events: [{ eventId: "groundSpring", weight: 65 }, { eventId: "groundDeep", weight: 35 }] },
  ]},
  spring: { id: "spring", title: "湧水", visual: "spring", phase: "液体", choices: [
    { id: "stream", label: "沢", icon: "→", hotspot: { x: 78, y: 76 }, events: [{ eventId: "springRiver", weight: 100 }] },
    { id: "sun", label: "陽だまり", icon: "☀", hotspot: { x: 55, y: 24 }, events: [{ eventId: "springSun", weight: 100 }] },
    { id: "flow", label: "流れ", icon: "◎", hotspot: { x: 36, y: 72 }, events: [{ eventId: "springRiver", weight: 76 }, { eventId: "springSun", weight: 24 }] },
  ]},
  river: { id: "river", title: "川", visual: "river", phase: "液体", choices: [
    { id: "foam", label: "泡", icon: "○", hotspot: { x: 64, y: 57 }, events: [{ eventId: "riverRapid", weight: 100 }] },
    { id: "rock", label: "岩の裏", icon: "⬡", hotspot: { x: 30, y: 61 }, events: [{ eventId: "riverBank", weight: 100 }] },
    { id: "surface", label: "水面", icon: "☀", hotspot: { x: 52, y: 23 }, events: [{ eventId: "riverSun", weight: 100 }] },
  ]},
  ocean: { id: "ocean", title: "海", visual: "ocean", phase: "液体", choices: [
    { id: "surface", label: "海面", icon: "↑", hotspot: { x: 50, y: 20 }, events: [{ eventId: "oceanSurface", weight: 100 }] },
    { id: "deep", label: "冷たい流れ", icon: "↓", hotspot: { x: 30, y: 76 }, events: [{ eventId: "oceanDeep", weight: 100 }] },
    { id: "shadow", label: "巨大な影", icon: "◒", hotspot: { x: 78, y: 54 }, events: [{ eventId: "oceanWhale", weight: 58 }, { eventId: "oceanDeep", weight: 42 }] },
  ]},
  vapor: { id: "vapor", title: "大気", visual: "vapor", phase: "気体", choices: [
    { id: "up", label: "上昇気流", icon: "↑", hotspot: { x: 48, y: 28 }, events: [{ eventId: "vaporCondense", weight: 100 }] },
    { id: "wind", label: "風", icon: "→", hotspot: { x: 78, y: 46 }, events: [{ eventId: "vaporCondense", weight: 100 }] },
    { id: "cold", label: "冷たい粒", icon: "·", hotspot: { x: 25, y: 38 }, events: [{ eventId: "vaporCondense", weight: 100 }] },
  ]},
  cloudReturn: { id: "cloudReturn", title: "新しい雲", visual: "cloudReturn", phase: "液体", choices: [
    { id: "green", label: "緑", icon: "🌿", hotspot: { x: 32, y: 74 }, events: [{ eventId: "cloudReturnLeaf", weight: 100 }] },
    { id: "ground", label: "森の隙間", icon: "↓", hotspot: { x: 70, y: 78 }, events: [{ eventId: "cloudReturnSoil", weight: 100 }] },
    { id: "flow", label: "流れ", icon: "◎", hotspot: { x: 52, y: 48 }, events: [{ eventId: "cloudReturnLeaf", weight: 56 }, { eventId: "cloudReturnSoil", weight: 44 }] },
  ]},
};

function pickWeighted(options: WeightedEvent[], lastEventId: string | null) {
  const adjusted = options.map((o) => ({ ...o, w: o.eventId === lastEventId && options.length > 1 ? o.weight * 0.3 : o.weight }));
  let roll = Math.random() * adjusted.reduce((sum, o) => sum + o.w, 0);
  for (const item of adjusted) { roll -= item.w; if (roll <= 0) return item.eventId; }
  return adjusted[adjusted.length - 1].eventId;
}

function formatElapsed(minutes: number) {
  if (minutes < HOUR) return `${Math.max(1, Math.round(minutes))}分`;
  if (minutes < DAY) return `${Math.round(minutes / HOUR)}時間`;
  if (minutes < YEAR) return `${Math.round(minutes / DAY)}日`;
  const y = minutes / YEAR;
  return y < 10 ? `${y.toFixed(1)}年` : `${Math.round(y).toLocaleString("ja-JP")}年`;
}

function SceneDefs() {
  return <defs>
    <linearGradient id="v05Sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#79cef1"/><stop offset="1" stopColor="#eaf9ff"/></linearGradient>
    <linearGradient id="v05Leaf" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#90dc68"/><stop offset="1" stopColor="#245f47"/></linearGradient>
    <linearGradient id="v05Soil" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9a704b"/><stop offset="1" stopColor="#2f2524"/></linearGradient>
    <linearGradient id="v05Water" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#76dff4"/><stop offset="1" stopColor="#157fae"/></linearGradient>
    <linearGradient id="v05Ocean" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#59cce9"/><stop offset=".38" stopColor="#1477aa"/><stop offset="1" stopColor="#041f43"/></linearGradient>
    <radialGradient id="v05Sun"><stop offset="0" stopColor="#fffde4"/><stop offset="1" stopColor="#ffd76f"/></radialGradient>
    <linearGradient id="v05Drop" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset=".28" stopColor="#b8efff"/><stop offset="1" stopColor="#168fc8"/></linearGradient>
    <filter id="v05Glow" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>;
}

function HeroDrop({ x, y, scale = 1, pose = "idle", tiny = false }: { x: number; y: number; scale?: number; pose?: HeroPose; tiny?: boolean }) {
  if (tiny) return <g transform={`translate(${x} ${y})`} className={styles.heroParticle}><circle r="17" fill="none" stroke="#e9fbff" strokeWidth="2" opacity=".55"/><circle r="5" fill="#fff"/><circle r="9" fill="#7fe0ff" opacity=".42"/></g>;
  if (pose === "evaporate" || pose === "condense") return <g transform={`translate(${x} ${y}) scale(${scale})`} className={pose === "evaporate" ? styles.heroEvaporate : styles.heroCondense}>{[-22,-10,0,11,24].map((dx, i) => <circle key={i} cx={dx} cy={i % 2 ? 8 : -8} r={i === 2 ? 7 : 5} fill="#e9fbff" opacity={.75 + i * .04}/>)}</g>;
  const poseScale: Record<HeroPose, [number, number]> = { idle:[1,1], fall:[.68,1.5], slide:[1.45,.72], flow:[1.2,.82], squash:[1.5,.62], merge:[1.22,1.22], trapped:[1.24,.72], rise:[.82,1.28], evaporate:[1,1], condense:[1,1] };
  const [sx, sy] = poseScale[pose];
  return <g transform={`translate(${x} ${y}) scale(${scale})`} className={styles.heroOuter} filter="url(#v05Glow)">
    <circle r="39" fill="none" stroke="#fff" strokeWidth="2" opacity=".14" className={styles.heroHalo}/>
    <g transform={`scale(${sx} ${sy})`} className={styles[`pose_${pose}`] || ""}>
      {pose === "fall" && <path d="M0 50 L0 86" stroke="#d8f8ff" strokeWidth="5" strokeLinecap="round" opacity=".35"/>}
      {(pose === "slide" || pose === "flow") && <path d="M-30 15 L-66 15" stroke="#d8f8ff" strokeWidth="7" strokeLinecap="round" opacity=".25"/>}
      <path d="M0-34 C16-13 27 2 27 18 C27 35 15 47 0 47 C-15 47-27 35-27 18 C-27 2-16-13 0-34Z" fill="url(#v05Drop)" stroke="#effcff" strokeWidth="2"/>
      <ellipse cx="-8" cy="0" rx="6" ry="12" fill="#fff" opacity=".78" transform="rotate(18)"/>
    </g>
  </g>;
}

function Clouds() { return <><g className={styles.cloudDriftA} fill="#fff" opacity=".96"><ellipse cx="70" cy="105" rx="74" ry="35"/><ellipse cx="133" cy="96" rx="78" ry="46"/><ellipse cx="194" cy="119" rx="64" ry="32"/></g><g className={styles.cloudDriftB} fill="#dceff5" opacity=".72"><ellipse cx="278" cy="180" rx="85" ry="30"/><ellipse cx="347" cy="164" rx="67" ry="41"/></g></>; }

function SceneArt({ visual, pose }: { visual: VisualKey; pose: HeroPose }) {
  const cloudLike = ["cloud","cloudMerge","fall","cloudReturn"].includes(visual);
  return <svg className={styles.art} viewBox="0 0 390 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><SceneDefs/>
    {cloudLike && <><rect width="390" height="650" fill="url(#v05Sky)"/><circle cx="326" cy="78" r="42" fill="url(#v05Sun)" opacity=".75"/><path d="M0 515 Q75 455 145 500 T285 487 T410 475 L410 650 L0 650Z" fill="#6b9677" opacity=".62"/><path d="M0 565 Q90 500 180 548 T410 518 L410 650 L0 650Z" fill="#3f725d" opacity=".8"/><path d="M285 530 C250 540 215 555 185 590" stroke="#76d9f4" strokeWidth="8" fill="none" opacity=".8"/><Clouds/>
      <g fill="#fff" opacity=".35" className={styles.fogForeground}><ellipse cx="-10" cy="235" rx="80" ry="46"/><ellipse cx="410" cy="280" rx="92" ry="55"/></g>
      {visual === "cloud" && <><HeroDrop x={176} y={168} scale={.66} pose={pose}/><HeroDrop x={218} y={184} scale={.33} pose="idle"/></>}
      {visual === "cloudMerge" && <><HeroDrop x={165} y={170} scale={.58} pose="idle"/><HeroDrop x={210} y={173} scale={.48} pose="idle"/></>}
      {visual === "fall" && <><g stroke="#d8f7ff" opacity=".5" strokeLinecap="round" className={styles.speedLines}><path d="M110 180 l-20 90"/><path d="M270 210 l-18 100"/><path d="M325 160 l-20 85"/></g><path d="M-20 610 C45 410 215 435 430 535 C300 565 172 618 -20 650Z" fill="url(#v05Leaf)" opacity=".92"/><HeroDrop x={195} y={315} scale={.85} pose="fall"/></>}
      {visual === "cloudReturn" && <><g className={styles.condenseDots} fill="#fff" opacity=".8"><circle cx="155" cy="170" r="4"/><circle cx="210" cy="148" r="3"/><circle cx="240" cy="188" r="5"/></g><HeroDrop x={195} y={180} scale={.68} pose="idle"/></>}
    </>}

    {["leaf","leafMerge","leafEdge","frog"].includes(visual) && <><rect width="390" height="650" fill="url(#v05Sky)"/><circle cx="338" cy="64" r="38" fill="url(#v05Sun)" opacity=".7"/><g opacity=".55"><path d="M0 560 Q70 490 130 530 T280 520 T410 505 V650 H0Z" fill="#4a745c"/><path d="M0 600 Q95 540 180 582 T410 550 V650 H0Z" fill="#315a49"/></g>
      <g className={styles.leafSway}><path d="M-75 590 C0 210 235 190 475 350 C332 420 180 555-75 590Z" fill="url(#v05Leaf)"/><path d="M-25 555 C125 445 250 368 445 345" fill="none" stroke="#d4efa5" strokeWidth="16" strokeLinecap="round" opacity=".77"/><path d="M95 472 Q135 398 155 330 M185 430 Q230 365 258 307 M275 392 Q320 343 355 317" fill="none" stroke="#b9df8b" strokeWidth="7" strokeLinecap="round" opacity=".75"/></g>
      <path d="M354 338 q28 35 14 79" fill="none" stroke="#d7efa6" strokeWidth="8" opacity=".8"/>
      <HeroDrop x={visual === "leafEdge" ? 348 : visual === "leafMerge" ? 250 : 195} y={visual === "leafEdge" ? 343 : visual === "leafMerge" ? 360 : 380} scale={visual === "leafMerge" ? 1.0 : .76} pose={visual === "leafEdge" ? "slide" : pose}/>
      {visual === "leaf" && <HeroDrop x={252} y={347} scale={.42} pose="idle"/>}
      {visual === "leafMerge" && <HeroDrop x={285} y={350} scale={.34} pose="idle"/>}
      {visual === "frog" && <g transform="translate(275 455)" className={styles.frogRush}><ellipse rx="92" ry="66" fill="#4c8f46"/><circle cx="-42" cy="-48" r="24" fill="#6bab59"/><circle cx="38" cy="-48" r="24" fill="#6bab59"/><circle cx="-42" cy="-52" r="8" fill="#13281e"/><circle cx="38" cy="-52" r="8" fill="#13281e"/><path d="M-30 8 Q0 32 30 8" fill="none" stroke="#1b4029" strokeWidth="6"/></g>}
      <path d="M-30 610 Q70 560 150 600 T420 570" fill="none" stroke="#244b3d" strokeWidth="42" opacity=".45" className={styles.foregroundLeaf}/>
    </>}

    {visual === "spider" && <><rect width="390" height="650" fill="#163d3d"/><g opacity=".28"><circle cx="315" cy="92" r="55" fill="#d9f7ef"/><path d="M0 570 Q100 490 205 552 T410 515 V650 H0Z" fill="#315d4d"/></g><g className={styles.webBounce} stroke="#e7faf7" strokeWidth="2" opacity=".82" fill="none"><path d="M195 20 L195 630 M20 325 L370 325 M55 70 L335 585 M335 70 L55 585"/><ellipse cx="195" cy="325" rx="58" ry="78"/><ellipse cx="195" cy="325" rx="108" ry="150"/><ellipse cx="195" cy="325" rx="160" ry="225"/></g><HeroDrop x={195} y={326} scale={.72} pose="trapped"/><g transform="translate(318 225)" fill="#0a2224" className={styles.spiderMove}><circle r="19"/><path d="M-15 0 l-34-25 M-15 8 l-38 14 M15 0 l34-25 M15 8 l38 14" stroke="#0a2224" strokeWidth="6"/></g></>}

    {visual === "frogInside" && <><rect width="390" height="650" fill="#17392d"/><ellipse cx="195" cy="325" rx="175" ry="285" fill="#2d6043"/><ellipse cx="195" cy="325" rx="110" ry="215" fill="#1c4834"/><path d="M96 205 Q195 252 294 205 M88 393 Q195 340 302 393" fill="none" stroke="#65a16e" strokeWidth="13" opacity=".6"/><g fill="#a6d39a" opacity=".35" className={styles.bodyBubbles}><circle cx="128" cy="282" r="9"/><circle cx="255" cy="405" r="7"/><circle cx="160" cy="455" r="5"/></g><HeroDrop x={195} y={340} scale={.68} pose="flow"/></>}

    {visual === "pond" && <><rect width="390" height="650" fill="#b8e4d2"/><path d="M0 235 Q80 205 160 235 T320 230 T410 228 V650 H0Z" fill="url(#v05Water)"/><path d="M0 235 Q70 215 140 235 T280 232 T410 230" fill="none" stroke="#e4fbff" strokeWidth="7" opacity=".85" className={styles.waveLine}/><path d="M0 548 Q100 500 210 548 T410 520 V650 H0Z" fill="#405a38" opacity=".78"/><path d="M310 240 Q345 215 390 228" stroke="#d8fbff" strokeWidth="12" fill="none" opacity=".6"/><g className={styles.fishPass} fill="#e1f7e6" opacity=".42"><path d="M45 430 q36-28 72 0 q-36 28-72 0Z"/><path d="M45 430 l-26-18 v36Z"/></g><HeroDrop x={195} y={324} scale={.48} pose="flow"/></>}

    {["soil","root"].includes(visual) && <><rect width="390" height="650" fill="url(#v05Soil)"/><rect width="390" height="92" fill="#55915d"/><path d="M0 92 Q80 68 160 94 T320 88 T410 92" fill="#2f6546"/><g fill="#bd9569" opacity=".74"><circle cx="72" cy="190" r="56"/><circle cx="302" cy="178" r="78"/><circle cx="105" cy="385" r="70"/><circle cx="312" cy="458" r="85"/></g><g fill="#524139" opacity=".92"><circle cx="242" cy="300" r="48"/><path d="M240 518 Q285 480 338 520 Q308 570 258 580Z"/></g><path d="M110 -10 C115 135 180 190 140 285 C105 360 160 440 115 670" fill="none" stroke="#d9c398" strokeWidth="44" strokeLinecap="round"/><path d="M128 185 Q210 225 255 310 M124 355 Q60 405 40 485" fill="none" stroke="#c8aa7b" strokeWidth="18" strokeLinecap="round"/><path d="M318 470 C340 515 335 590 360 650" fill="none" stroke="#2a201f" strokeWidth="34" opacity=".8"/><path d="M305 408 C332 420 365 420 390 410" fill="none" stroke="#68cde8" strokeWidth="12" opacity=".62" className={styles.sideFlow}/><HeroDrop x={visual === "root" ? 154 : 215} y={visual === "root" ? 310 : 350} scale={.55} pose={visual === "root" ? "flow" : pose}/><path d="M-25 585 Q52 535 95 592" fill="none" stroke="#7b5a40" strokeWidth="55" opacity=".7"/></>}

    {visual === "rootInside" && <><rect width="390" height="650" fill="#dbeabe"/><path d="M70 -30 C45 150 98 300 65 690 M165 -30 C140 170 192 330 155 690 M270 -30 C242 170 305 350 262 690 M355 -30 C330 160 378 335 345 690" fill="none" stroke="#759c69" strokeWidth="48" opacity=".5"/><path d="M70 -30 C45 150 98 300 65 690 M165 -30 C140 170 192 330 155 690 M270 -30 C242 170 305 350 262 690 M355 -30 C330 160 378 335 345 690" fill="none" stroke="#eff5d0" strokeWidth="14" opacity=".8"/><g className={styles.riseDots} fill="#78d8e4" opacity=".6"><circle cx="110" cy="490" r="8"/><circle cx="280" cy="440" r="5"/><circle cx="220" cy="530" r="6"/></g><HeroDrop x={195} y={380} scale={.62} pose="rise"/></>}

    {["groundwater","deepTime"].includes(visual) && <><rect width="390" height="650" fill="#112a33"/><rect width="390" height="48" fill="#6f9b66"/><g className={styles.surfaceSeasons}><path d="M60 48 V18 M60 18 q-22 12-30 0 M60 18 q22 12 30 0" stroke="#31583e" strokeWidth="6" fill="none"/><circle cx="60" cy="16" r="16" fill="#7bb15c" opacity=".8"/><path d="M280 48 V15 M280 20 q-20 12-30 0 M280 20 q20 12 30 0" stroke="#31583e" strokeWidth="6" fill="none"/><circle cx="280" cy="16" r="15" fill="#c58a57" opacity=".55"/></g><path d="M0 95 Q80 42 190 95 T410 88 V210 Q300 160 180 205 T0 198Z" fill="#526569"/><path d="M0 280 Q100 220 200 275 T410 267 V425 Q300 365 175 420 T0 405Z" fill="#394d52"/><path d="M0 488 Q100 430 210 485 T410 472 V650 H0Z" fill="#263b42"/><path d="M-10 356 Q80 310 165 354 T330 348 T410 336" fill="none" stroke="#36b6d8" strokeWidth="32" opacity=".58" className={styles.groundFlow}/><path d="M-10 356 Q80 310 165 354 T330 348 T410 336" fill="none" stroke="#a4eeff" strokeWidth="5" opacity=".6"/><HeroDrop x={205} y={350} scale={.46} pose="flow"/><path d="M330 430 Q360 490 342 650" fill="none" stroke="#0c1c21" strokeWidth="28" opacity=".9"/></>}

    {visual === "spring" && <><rect width="390" height="650" fill="#8fcdd4"/><rect width="390" height="650" fill="#293d38"/><path d="M35 0 Q115 180 105 650 H285 Q270 220 355 0Z" fill="#61766b"/><ellipse cx="195" cy="220" rx="95" ry="140" fill="#d2f7ea" opacity=".84"/><path d="M55 570 Q150 500 235 553 T410 540 V650 H0V610Z" fill="#2d95ae"/><path d="M88 560 Q180 510 275 558" fill="none" stroke="#c9f8ff" strokeWidth="8" opacity=".7"/><HeroDrop x={200} y={475} scale={.56} pose="rise"/></>}

    {["river","rapid"].includes(visual) && <><rect width="390" height="650" fill="#8acfd5"/><path d="M0 0 Q90 70 112 230 T75 650 H315 Q285 440 328 255 T390 0Z" fill="#4c755c"/><path d="M78 0 Q155 98 152 250 T120 650 H302 Q265 435 304 250 T326 0Z" fill="url(#v05Water)"/><g fill="#505c58" opacity=".94"><ellipse cx="105" cy="228" rx="58" ry="42"/><ellipse cx="292" cy="370" rx="74" ry="50"/><ellipse cx="132" cy="525" rx="62" ry="46"/></g><g className={visual === "rapid" ? styles.rapidLines : styles.riverLines} fill="none" stroke="#e3fbff" strokeLinecap="round" opacity=".8"><path d="M145 75 Q210 115 270 86" strokeWidth="9"/><path d="M115 315 Q190 350 260 315" strokeWidth="7"/><path d="M145 472 Q215 510 288 470" strokeWidth="9"/><path d="M190 190 Q230 215 270 190" strokeWidth="5"/></g><HeroDrop x={198} y={visual === "rapid" ? 420 : 330} scale={.43} pose={visual === "rapid" ? "slide" : "flow"}/>{visual === "rapid" && <g fill="#fff" opacity=".74" className={styles.foam}><circle cx="175" cy="370" r="10"/><circle cx="235" cy="435" r="8"/><circle cx="150" cy="460" r="6"/><circle cx="280" cy="295" r="7"/></g>}<path d="M-30 600 Q60 555 105 610" fill="none" stroke="#315747" strokeWidth="55" opacity=".65"/></>}

    {["ocean","deepOcean","whale"].includes(visual) && <><rect width="390" height="650" fill="url(#v05Ocean)"/><path d="M0 92 Q65 74 130 94 T260 91 T390 89" fill="none" stroke="#d8f9ff" strokeWidth="8" opacity=".55" className={styles.waveLine}/><g className={styles.oceanFish} fill="#bddfe4" opacity=".18"><path d="M40 250 q50-35 100 0 q-50 35-100 0Z"/><path d="M40 250 l-35-26 v52Z"/></g><g className={styles.oceanFish2} fill="#bddfe4" opacity=".12"><path d="M245 440 q62-42 124 0 q-62 42-124 0Z"/><path d="M245 440 l-42-28 v56Z"/></g>{visual === "ocean" && <><path d="M40 560 C95 520 160 540 215 510" fill="none" stroke="#5bc7d7" strokeWidth="36" opacity=".18" className={styles.coldCurrent}/><HeroDrop x={190} y={340} tiny pose="flow"/></>}{visual === "deepOcean" && <><rect y="300" width="390" height="350" fill="#021832" opacity=".45"/><HeroDrop x={188} y={500} tiny pose="flow"/><g fill="#98d9ef" opacity=".28"><circle cx="86" cy="430" r="3"/><circle cx="310" cy="520" r="2"/><circle cx="250" cy="590" r="3"/></g></>}{visual === "whale" && <><g className={styles.whaleRush} fill="#071d31" opacity=".94"><path d="M-40 350 C35 205 245 188 390 300 C320 335 255 370 170 398 C92 424 15 422-40 350Z"/><path d="M340 298 Q410 248 448 275 Q405 330 348 345Z"/><circle cx="290" cy="292" r="7" fill="#a9dce8"/></g><HeroDrop x={220} y={350} tiny pose="flow"/></>}
    </>}

    {visual === "vapor" && <><rect width="390" height="650" fill="url(#v05Sky)"/><circle cx="325" cy="75" r="42" fill="url(#v05Sun)" opacity=".72"/><path d="M0 590 Q90 530 180 575 T410 545 V650 H0Z" fill="#4c7963" opacity=".62"/><g className={styles.updraft} fill="none" stroke="#e8fbff" strokeLinecap="round" opacity=".38"><path d="M120 520 Q85 410 140 320 T165 150" strokeWidth="5"/><path d="M240 545 Q285 430 235 320 T225 150" strokeWidth="4"/></g><HeroDrop x={195} y={310} scale={1.1} pose="evaporate"/></>}

    {visual === "condense" && <><rect width="390" height="650" fill="#9bd8ef"/><g fill="#eefbff" opacity=".72" className={styles.condenseCloud}><ellipse cx="95" cy="300" rx="105" ry="65"/><ellipse cx="195" cy="270" rx="120" ry="80"/><ellipse cx="310" cy="315" rx="110" ry="68"/></g><HeroDrop x={195} y={300} scale={1.2} pose="condense"/></>}
  </svg>;
}

function HotspotLayer({ choices, disabled, onSelect }: { choices: Choice[]; disabled: boolean; onSelect: (choice: Choice) => void }) {
  return <div className={styles.hotspotLayer} aria-hidden={disabled}>{choices.map((choice) => <button key={choice.id} className={styles.hotspot} disabled={disabled} style={{ left: `${choice.hotspot.x}%`, top: `${choice.hotspot.y}%` }} onClick={() => onSelect(choice)} aria-label={choice.label}><span>{choice.icon}</span><i/></button>)}</div>;
}

function MemoryDrawer({ open, onClose, found }: { open: boolean; onClose: () => void; found: Set<string> }) {
  return <div className={`${styles.memoryBackdrop} ${open ? styles.memoryOpen : ""}`} onClick={onClose}><section className={styles.memoryDrawer} onClick={(e) => e.stopPropagation()}><header><div><small>MY WATER</small><h2>水の記憶</h2></div><button onClick={onClose}>×</button></header><div className={styles.memoryGrid}>{discoveries.map((d) => { const unlocked = found.has(d.id); return <article key={d.id} className={unlocked ? "" : styles.locked}><div className={styles.memoryIcon}>{unlocked ? "💧" : "?"}</div><div><b>{unlocked ? d.title : "未発見"}</b><small>{unlocked ? `${d.category} · ${d.rarity}` : "旅のどこかにある"}</small>{unlocked && <p>{d.description}</p>}</div></article>; })}</div></section></div>;
}

export default function DropVisualV05() {
  const [locationId, setLocationId] = useState("cloud");
  const [active, setActive] = useState<ActiveEvent | null>(null);
  const [elapsed, setElapsed] = useState(1);
  const [cycle, setCycle] = useState(0);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [newDiscovery, setNewDiscovery] = useState<Discovery | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentLocation = locations[locationId];
  const beat = active ? active.event.beats[active.beatIndex] : null;
  const visual = beat?.visual ?? currentLocation.visual;
  const pose = beat?.heroPose ?? "idle";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("drop-v05-memory");
      if (raw) setFound(new Set(JSON.parse(raw) as string[]));
      const storedCycle = Number(localStorage.getItem("drop-v05-cycle") || 0);
      if (storedCycle) setCycle(storedCycle);
    } catch {}
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const foundCount = found.size;
  const progressLabel = useMemo(() => `${foundCount}/${discoveries.length}`, [foundCount]);

  function unlock(id?: string) {
    if (!id) return;
    const d = discoveries.find((item) => item.id === id);
    if (!d || found.has(id)) return;
    setFound((prev) => {
      const next = new Set(prev); next.add(id);
      try { localStorage.setItem("drop-v05-memory", JSON.stringify([...next])); } catch {}
      return next;
    });
    setNewDiscovery(d);
    window.setTimeout(() => setNewDiscovery(null), 1800);
  }

  function runBeat(event: EventChain, index: number) {
    const nextBeat = event.beats[index];
    setActive({ event, beatIndex: index });
    if (nextBeat.minutes) setElapsed((v) => v + nextBeat.minutes!);
    unlock(nextBeat.discovery);
    if (navigator.vibrate && (nextBeat.emphasis || nextBeat.discovery)) navigator.vibrate(nextBeat.emphasis ? 35 : 18);
    timer.current = setTimeout(() => {
      if (index < event.beats.length - 1) runBeat(event, index + 1);
      else {
        setLocationId(event.to);
        setLastEvent(event.id);
        if (event.completesCycle) setCycle((c) => { const next = c + 1; try { localStorage.setItem("drop-v05-cycle", String(next)); } catch {} return next; });
        setActive(null);
      }
    }, nextBeat.duration);
  }

  function choose(choice: Choice) {
    if (active) return;
    const eventId = pickWeighted(choice.events, lastEvent);
    runBeat(events[eventId], 0);
  }

  return <main className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.hud}>
        <div className={styles.brand}><b>一滴</b><span>DROP</span></div>
        <div className={styles.hudRight}><div className={styles.stat}><small>TIME</small><b>{formatElapsed(elapsed)}</b></div><div className={styles.stat}><small>CYCLE</small><b>{cycle}</b></div><button className={styles.memoryButton} onClick={() => setMemoryOpen(true)}><span>記憶</span><b>{progressLabel}</b></button></div>
      </header>

      <section className={`${styles.stage} ${beat?.transition ? styles[`transition_${beat.transition}`] || "" : ""}`}>
        <SceneArt visual={visual} pose={pose}/>
        {!active && <HotspotLayer choices={currentLocation.choices} disabled={false} onSelect={choose}/>} 
        {!active && <div className={styles.sceneTag}><i/>{currentLocation.title}<span>{currentLocation.phase}</span></div>}
        {beat?.timeLabel && <div className={styles.timeJump}>{beat.timeLabel}</div>}
        {beat?.emphasis && <div className={styles.emphasis}>{beat.emphasis}</div>}
        {beat?.text && <div className={styles.microText}>{beat.text}</div>}
      </section>

      {!active && <nav className={styles.choiceDock}>{currentLocation.choices.map((choice) => <button key={choice.id} onClick={() => choose(choice)}><span>{choice.icon}</span><b>{choice.label}</b></button>)}</nav>}

      {newDiscovery && <div className={styles.discoveryToast}><small>NEW DISCOVERY</small><b>{newDiscovery.title}</b><span>{newDiscovery.rarity}</span></div>}
      <MemoryDrawer open={memoryOpen} onClose={() => setMemoryOpen(false)} found={found}/>
    </div>
  </main>;
}
