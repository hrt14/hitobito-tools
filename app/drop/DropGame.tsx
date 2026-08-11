"use client";

import { useMemo, useState } from "react";
import styles from "./drop.module.css";

type Choice = {
  label: string;
  icon: string;
  to: string | string[];
  minutes: number;
  note: string;
};

type Scene = {
  id: string;
  title: string;
  location: string;
  state: string;
  text: string;
  choices: Choice[];
};

const YEAR = 365 * 24 * 60;
const DAY = 24 * 60;

const scenes: Record<string, Scene> = {
  cloud: {
    id: "cloud",
    title: "雲の中で、一滴が生まれた。",
    location: "上空・雨雲",
    state: "液体",
    text: "まだ行き先は決まっていない。風と重力の間で、あなたは少しずつ雲の外へ近づいている。",
    choices: [
      { label: "森へ落ちる", icon: "🌿", to: "leaf", minutes: 8, note: "雲を離れ、森へ" },
      { label: "山風に乗る", icon: "⛰", to: "mountain", minutes: 22, note: "風に運ばれて山へ" },
      { label: "流れにまかせる", icon: "◎", to: ["leaf", "mountain", "river"], minutes: 14, note: "自然に行き先を任せる" },
    ],
  },
  mountain: {
    id: "mountain",
    title: "山肌に触れた。",
    location: "山地・岩場",
    state: "液体",
    text: "冷たい岩と苔の間を滑る。数センチ先の割れ目が、まったく別の旅につながっている。",
    choices: [
      { label: "苔へ転がる", icon: "🍃", to: "leaf", minutes: 3, note: "柔らかな苔と葉の方へ" },
      { label: "岩の隙間へ", icon: "↘", to: "soil", minutes: 18, note: "地面の中へ染み込む" },
      { label: "沢へ流れる", icon: "〰", to: "river", minutes: 34, note: "小さな流れに合流する" },
    ],
  },
  leaf: {
    id: "leaf",
    title: "巨大な葉の上。",
    location: "森・葉の表面",
    state: "液体",
    text: "一滴から見る葉脈は、道のように太い。風が吹くたび、世界全体がゆっくり傾く。",
    choices: [
      { label: "葉先から落ちる", icon: "↓", to: "soil", minutes: 2, note: "葉先で伸び、土へ落下" },
      { label: "日差しに残る", icon: "☀", to: "vapor", minutes: 96, note: "温められ、少しずつ軽くなる" },
      { label: "葉脈を伝う", icon: "↗", to: "river", minutes: 11, note: "枝を伝い、小さな流れへ" },
    ],
  },
  soil: {
    id: "soil",
    title: "土の中は、静かな迷路だった。",
    location: "森・土壌",
    state: "液体",
    text: "土粒、根、石の隙間をゆっくり進む。地上の数秒が、ここでは長い時間に感じられる。",
    choices: [
      { label: "深く染み込む", icon: "⇣", to: "groundwater", minutes: 8 * DAY, note: "さらに深い地層へ" },
      { label: "根の近くへ", icon: "🌱", to: "root", minutes: 7 * 60, note: "細い根に引かれていく" },
      { label: "斜面へ抜ける", icon: "↘", to: "river", minutes: 19 * 60, note: "地表近くを横へ流れる" },
    ],
  },
  root: {
    id: "root",
    title: "木の中へ入った。",
    location: "森・樹木",
    state: "液体",
    text: "細い根から吸い上げられ、幹の中を上へ。水にとって植物もまた、一つの巨大な通路だ。",
    choices: [
      { label: "葉まで上がる", icon: "↑", to: "vapor", minutes: 2 * DAY, note: "葉へ運ばれ、蒸散する" },
      { label: "根元へ戻る", icon: "↙", to: "soil", minutes: 15 * 60, note: "再び土の隙間へ" },
      { label: "流れに押される", icon: "◎", to: ["vapor", "soil"], minutes: DAY, note: "木の流れに任せる" },
    ],
  },
  groundwater: {
    id: "groundwater",
    title: "地上の時間が遠くなる。",
    location: "地下・帯水層",
    state: "液体",
    text: "暗い岩盤の間を、ほとんど止まっているような速さで進む。けれど水は、少しずつ動き続ける。",
    choices: [
      { label: "砂礫層を進む", icon: "⋯", to: "spring", minutes: 17 * YEAR, note: "17年が流れる" },
      { label: "深い割れ目へ", icon: "⌄", to: "groundwater", minutes: 83 * YEAR, note: "さらに83年、地下を旅する" },
      { label: "水脈に乗る", icon: "≈", to: "river", minutes: 6 * YEAR, note: "遠い川へ向かう地下水脈" },
    ],
  },
  spring: {
    id: "spring",
    title: "久しぶりの光。",
    location: "山麓・湧水",
    state: "液体",
    text: "岩の隙間から地表へ押し出される。何年も見なかった空が、水面に揺れている。",
    choices: [
      { label: "小川へ流れる", icon: "〰", to: "river", minutes: 48, note: "湧水から小川へ" },
      { label: "苔に残る", icon: "🌿", to: "soil", minutes: 6 * 60, note: "岸辺の苔と土へ" },
      { label: "陽だまりへ", icon: "☀", to: "vapor", minutes: 9 * 60, note: "水面から空へ" },
    ],
  },
  river: {
    id: "river",
    title: "一滴が、大きな流れの一部になる。",
    location: "河川",
    state: "液体",
    text: "周囲の水と混ざりながら下流へ。小さな沢は支流になり、支流はやがて大きな川になる。",
    choices: [
      { label: "流れに乗る", icon: "→", to: "ocean", minutes: 4 * DAY, note: "川を下り、河口へ" },
      { label: "岸へ寄る", icon: "↖", to: "soil", minutes: 3 * 60, note: "岸辺の土へ染み込む" },
      { label: "水面に残る", icon: "☀", to: "vapor", minutes: 13 * 60, note: "日差しを受けて蒸発する" },
    ],
  },
  ocean: {
    id: "ocean",
    title: "海は、ゴールではなかった。",
    location: "海・外洋",
    state: "液体",
    text: "見渡す限りの水。その中であなたは小さく光る一つの水分子として、海流と太陽の間にいる。",
    choices: [
      { label: "海面へ上がる", icon: "↑", to: "vapor", minutes: 18 * DAY, note: "太陽に近い海面へ" },
      { label: "海流に乗る", icon: "↝", to: "ocean", minutes: 3 * YEAR, note: "3年かけて遠い海域へ" },
      { label: "深く沈む", icon: "⇣", to: "ocean", minutes: 140 * YEAR, note: "深い海で長い時間を過ごす" },
    ],
  },
  vapor: {
    id: "vapor",
    title: "形がほどけ、空へ。",
    location: "大気",
    state: "気体",
    text: "一滴の輪郭が消えて、小さな粒子になる。上昇する空気に乗り、地上が少しずつ遠ざかる。",
    choices: [
      { label: "上昇気流へ", icon: "↑", to: "cloudReturn", minutes: 7 * 60, note: "高い空で冷やされていく" },
      { label: "風に流される", icon: "→", to: "cloudReturn", minutes: DAY, note: "遠くまで運ばれてから凝結する" },
      { label: "流れにまかせる", icon: "◎", to: "cloudReturn", minutes: 11 * 60, note: "空の流れに身を任せる" },
    ],
  },
  cloudReturn: {
    id: "cloudReturn",
    title: "そして、また一滴になる。",
    location: "上空・新しい雲",
    state: "液体",
    text: "旅は終わらない。同じ水が、別の場所、別の時間、別の景色へもう一度降っていく。",
    choices: [
      { label: "森へ降る", icon: "🌿", to: "leaf", minutes: 12, note: "次の循環へ" },
      { label: "山へ降る", icon: "⛰", to: "mountain", minutes: 24, note: "次の循環へ" },
      { label: "自然に任せる", icon: "◎", to: ["leaf", "mountain", "river"], minutes: 16, note: "次の循環へ" },
    ],
  },
};

function formatElapsed(minutes: number) {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}分`;
  if (minutes < DAY) return `${Math.round(minutes / 60)}時間`;
  if (minutes < YEAR) return `${Math.round(minutes / DAY)}日`;
  const years = minutes / YEAR;
  if (years < 10) return `${years.toFixed(1)}年`;
  return `${Math.round(years).toLocaleString("ja-JP")}年`;
}

function pickTarget(to: string | string[]) {
  if (typeof to === "string") return to;
  return to[Math.floor(Math.random() * to.length)];
}

function DropShape({ x = 195, y = 275, className = styles.dropHero, scale = 1 }: { x?: number; y?: number; className?: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className={className}>
      <ellipse cx="0" cy="22" rx="35" ry="15" fill="#35b7e6" opacity=".16" />
      <path d="M0-38 C18-15 30 3 30 20 C30 39 17 52 0 52 C-17 52-30 39-30 20 C-30 3-18-15 0-38Z" fill="url(#dropGradient)" stroke="#e9fbff" strokeWidth="2" />
      <ellipse cx="-9" cy="0" rx="7" ry="13" fill="#fff" opacity=".72" transform="rotate(18)" />
    </g>
  );
}

function Defs() {
  return (
    <defs>
      <linearGradient id="dropGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset=".26" stopColor="#bfefff" />
        <stop offset="1" stopColor="#219ed4" />
      </linearGradient>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9ddbf4"/><stop offset="1" stopColor="#effbff"/></linearGradient>
      <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8c6a48"/><stop offset="1" stopColor="#49382e"/></linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#71d2ee"/><stop offset="1" stopColor="#188dbb"/></linearGradient>
      <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#4ec5e4"/><stop offset=".38" stopColor="#1589b6"/><stop offset="1" stopColor="#073d67"/></linearGradient>
      <radialGradient id="sun"><stop offset="0" stopColor="#fff8bf"/><stop offset="1" stopColor="#ffd66f"/></radialGradient>
      <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
  );
}

function CloudArt({ returning = false }: { returning?: boolean }) {
  return (
    <svg viewBox="0 0 390 620" preserveAspectRatio="xMidYMid slice">
      <Defs />
      <rect width="390" height="620" fill="url(#sky)" />
      <circle cx="314" cy="92" r="42" fill="url(#sun)" opacity=".78" className={styles.sunPulse} />
      <g className={styles.cloudSlow} fill="#fff" opacity=".96">
        <ellipse cx="76" cy="132" rx="74" ry="34"/><ellipse cx="133" cy="122" rx="78" ry="44"/><ellipse cx="187" cy="139" rx="62" ry="31"/>
      </g>
      <g className={styles.cloudSlow2} fill="#d9edf4" opacity=".78">
        <ellipse cx="260" cy="198" rx="75" ry="28"/><ellipse cx="319" cy="187" rx="64" ry="36"/><ellipse cx="370" cy="204" rx="58" ry="26"/>
      </g>
      <path d="M0 458 Q75 392 142 438 T275 428 T410 416 L410 620 L0 620Z" fill="#7eaa91" opacity=".63" />
      <path d="M0 494 Q90 426 172 481 T390 452 L390 620 L0 620Z" fill="#56866f" opacity=".72" />
      <g opacity=".4" stroke="#78c7e3" strokeWidth="3" strokeLinecap="round">
        <path d="M79 172 l-12 33" className={styles.rainLine}/><path d="M121 157 l-12 35" className={`${styles.rainLine} ${styles.rainLine2}`}/><path d="M160 171 l-11 34" className={`${styles.rainLine} ${styles.rainLine3}`}/>
      </g>
      <g filter="url(#glow)"><DropShape y={292} className={returning ? styles.dropFloat : styles.dropFalling} /></g>
      {returning && <g fill="#fff" opacity=".52"><circle cx="159" cy="261" r="4"/><circle cx="229" cy="244" r="3"/><circle cx="205" cy="219" r="2.5"/></g>}
    </svg>
  );
}

function MountainArt() {
  return <svg viewBox="0 0 390 620" preserveAspectRatio="xMidYMid slice"><Defs/><rect width="390" height="620" fill="url(#sky)"/><circle cx="322" cy="78" r="39" fill="url(#sun)" opacity=".85"/><path d="M-30 462 L108 182 L222 462Z" fill="#7da18d"/><path d="M74 255 L108 182 L143 269 L123 258 L108 273 L94 256Z" fill="#edf7f5"/><path d="M92 510 L250 222 L435 510Z" fill="#527c69"/><path d="M210 296 L250 222 L292 312 L269 296 L250 318 L232 298Z" fill="#e5f3f1"/><path d="M0 475 Q66 432 131 469 T267 461 T390 448 L390 620 L0 620Z" fill="#406b54"/><g fill="#2f6049"><circle cx="50" cy="466" r="26"/><circle cx="78" cy="454" r="31"/><circle cx="319" cy="461" r="34"/></g><path d="M142 395 Q176 362 210 407 Q182 428 150 455" fill="none" stroke="#c5e8ef" strokeWidth="12" strokeLinecap="round" opacity=".9"/><g filter="url(#glow)"><DropShape x={176} y={350} scale={.78} className={styles.dropFlow}/></g><g fill="#bfd7c9" opacity=".8"><circle cx="164" cy="383" r="7"/><circle cx="200" cy="382" r="5"/></g></svg>;
}

function LeafArt() {
  return <svg viewBox="0 0 390 620" preserveAspectRatio="xMidYMid slice"><Defs/><rect width="390" height="620" fill="#dff5ec"/><circle cx="320" cy="78" r="39" fill="url(#sun)"/><g opacity=".45"><path d="M0 244 Q81 180 151 230 T292 218 T420 206 L420 360 L0 360Z" fill="#7db69b"/><circle cx="72" cy="208" r="48" fill="#4f8c6c"/><circle cx="337" cy="215" r="58" fill="#609a76"/></g><g className={styles.leafSway}><path d="M-34 510 Q124 274 391 358 Q311 523 113 568 Q23 584-34 510Z" fill="#55a85f"/><path d="M21 506 Q144 458 346 376" fill="none" stroke="#d4ed93" strokeWidth="12" strokeLinecap="round"/><path d="M110 475 Q137 414 150 348 M184 446 Q222 386 245 350 M245 419 Q294 402 338 389" fill="none" stroke="#b9dc79" strokeWidth="7" strokeLinecap="round" opacity=".92"/></g><g filter="url(#glow)"><DropShape x={211} y={345} scale={1.16} className={styles.dropHero}/></g><g fill="#fff" opacity=".78"><circle cx="120" cy="367" r="5"/><circle cx="288" cy="407" r="4"/></g></svg>;
}

function SoilArt({ root = false }: { root?: boolean }) {
  return <svg viewBox="0 0 390 620" preserveAspectRatio="xMidYMid slice"><Defs/><rect width="390" height="620" fill="url(#soil)"/><rect width="390" height="116" fill="#9bcf8e"/><path d="M0 116 Q80 102 151 119 T297 109 T390 115 L390 154 L0 154Z" fill="#71513b"/><g fill="#534137" opacity=".8"><ellipse cx="62" cy="206" rx="38" ry="20"/><ellipse cx="323" cy="260" rx="45" ry="24"/><ellipse cx="119" cy="403" rx="28" ry="19"/><ellipse cx="277" cy="500" rx="34" ry="20"/></g><g fill="#b99a6d" opacity=".65"><circle cx="176" cy="210" r="8"/><circle cx="217" cy="295" r="6"/><circle cx="88" cy="326" r="9"/><circle cx="332" cy="396" r="7"/></g><g fill="none" strokeLinecap="round" className={styles.rootPulse}><path d="M197 104 C198 206 173 228 181 302 C189 375 151 410 146 520" stroke="#c99962" strokeWidth="15"/><path d="M190 238 C145 242 122 276 103 333" stroke="#bc8758" strokeWidth="9"/><path d="M181 315 C227 329 250 360 269 414" stroke="#bc8758" strokeWidth="8"/></g>{root ? <g filter="url(#glow)"><DropShape x={190} y={269} scale={.58} className={styles.dropFloat}/></g> : <g filter="url(#glow)"><DropShape x={252} y={350} scale={.72} className={styles.dropSink}/></g>}<g opacity=".23" stroke="#d9f4ff" strokeWidth="3"><path d="M247 399 v48"/><path d="M265 423 v36"/></g></svg>;
}

function GroundwaterArt() {
  return <svg viewBox="0 0 390 620" preserveAspectRatio="xMidYMid slice"><Defs/><rect width="390" height="620" fill="#322d35"/><path d="M0 0 H390 V176 Q324 154 260 178 T127 171 T0 187Z" fill="#5b4c45"/><path d="M0 180 Q73 148 151 185 T298 173 T390 188 V365 Q314 338 239 365 T100 350 T0 374Z" fill="#78634f"/><path d="M0 375 Q75 341 154 377 T301 366 T390 381 V620 H0Z" fill="#414a48"/><path d="M-20 438 Q67 395 143 442 T290 430 T420 442" fill="none" stroke="#279bc2" strokeWidth="58" opacity=".76"/><path d="M-20 430 Q68 398 143 438 T290 426 T420 438" fill="none" stroke="#93e3f4" strokeWidth="10" opacity=".38"/><g fill="#d8c8a1" opacity=".35"><circle cx="72" cy="264" r="14"/><circle cx="316" cy="304" r="11"/><circle cx="119" cy="527" r="18"/></g><g filter="url(#glow)"><DropShape x={203} y={424} scale={.7} className={styles.dropFlow}/></g><circle cx="202" cy="444" r="49" fill="none" stroke="#7fe3f4" strokeWidth="3" className={styles.ripple}/></svg>;
}

function SpringArt() {
  return <svg viewBox="0 0 390 620" preserveAspectRatio="xMidYMid slice"><Defs/><rect width="390" height="620" fill="#dff6f1"/><rect width="390" height="240" fill="url(#sky)"/><path d="M0 265 Q82 210 156 252 T293 238 T420 224 V365 H0Z" fill="#6ca07a"/><g fill="#36684c"><circle cx="47" cy="264" r="45"/><circle cx="99" cy="254" r="51"/><circle cx="344" cy="254" r="55"/></g><path d="M116 350 Q159 290 231 326 Q270 348 314 372 L314 620 H68 Q83 472 116 350Z" fill="#6f675d"/><path d="M144 356 Q184 326 222 353 Q185 381 169 424 Q149 479 136 620" fill="none" stroke="#57c6e4" strokeWidth="44" strokeLinecap="round"/><path d="M149 353 Q182 335 218 353" fill="none" stroke="#d5f8ff" strokeWidth="9" strokeLinecap="round"/><g filter="url(#glow)"><DropShape x={184} y={369} scale={.68} className={styles.dropFloat}/></g><circle cx="182" cy="392" r="36" fill="none" stroke="#c5f4fb" strokeWidth="3" className={styles.ripple}/></svg>;
}

function RiverArt() {
  return <svg viewBox="0 0 390 620" preserveAspectRatio="xMidYMid slice"><Defs/><rect width="390" height="620" fill="#cceff5"/><rect width="390" height="183" fill="url(#sky)"/><circle cx="314" cy="69" r="35" fill="url(#sun)"/><path d="M0 230 Q90 169 174 221 T390 196 V386 H0Z" fill="#6f9c79"/><path d="M0 290 Q76 235 148 286 T279 272 T390 286 V620 H0Z" fill="#4e7f5d"/><path d="M102 250 Q170 302 142 367 Q111 438 169 620 H358 Q284 483 306 383 Q321 316 266 270Z" fill="url(#water)"/><path d="M125 291 Q184 321 166 376 Q147 432 196 590" fill="none" stroke="#c6f6ff" strokeWidth="11" opacity=".55" className={styles.wave}/><g fill="#2f654b"><circle cx="53" cy="313" r="33"/><circle cx="342" cy="319" r="37"/></g><g filter="url(#glow)"><DropShape x={201} y={405} scale={.7} className={styles.dropFlow}/></g><g fill="none" stroke="#c2f4ff" opacity=".45"><path d="M172 465 q25 16 51 0"/><path d="M185 500 q24 14 48 0"/></g></svg>;
}

function OceanArt() {
  return <svg viewBox="0 0 390 620" preserveAspectRatio="xMidYMid slice"><Defs/><rect width="390" height="620" fill="url(#ocean)"/><rect width="390" height="142" fill="url(#sky)"/><circle cx="303" cy="66" r="35" fill="url(#sun)"/><path d="M-30 151 Q42 129 105 151 T239 151 T420 147" fill="none" stroke="#e5fbff" strokeWidth="13" opacity=".85" className={styles.wave}/><g opacity=".48" fill="#a5e8f2"><circle cx="73" cy="262" r="6" className={styles.bubble}/><circle cx="322" cy="329" r="5" className={`${styles.bubble} ${styles.bubble2}`}/><circle cx="109" cy="459" r="4" className={`${styles.bubble} ${styles.bubble3}`}/></g><path d="M-20 514 Q99 455 205 508 T418 492 V620 H-20Z" fill="#0a4564" opacity=".5"/><path d="M54 531 q34-38 70 0 q-37 16-70 0Z" fill="#7cc7c4" opacity=".6"/><circle cx="109" cy="522" r="2.5" fill="#08384e"/><g filter="url(#glow)"><DropShape x={212} y={310} scale={.62} className={styles.dropFloat}/></g><circle cx="211" cy="330" r="40" fill="none" stroke="#9eeafa" strokeWidth="3" className={styles.ripple}/></svg>;
}

function VaporArt() {
  return <svg viewBox="0 0 390 620" preserveAspectRatio="xMidYMid slice"><Defs/><rect width="390" height="620" fill="url(#sky)"/><circle cx="300" cy="94" r="49" fill="url(#sun)" className={styles.sunPulse}/><path d="M0 472 Q92 416 173 463 T306 451 T410 456 V620 H0Z" fill="#7bae86" opacity=".72"/><g fill="#fff" opacity=".74" className={styles.cloudSlow}><ellipse cx="93" cy="163" rx="55" ry="24"/><ellipse cx="137" cy="154" rx="58" ry="31"/><ellipse cx="180" cy="168" rx="48" ry="21"/></g><g filter="url(#glow)" className={styles.dropVapor} fill="#bceeff"><circle cx="196" cy="327" r="9"/><circle cx="178" cy="346" r="6"/><circle cx="213" cy="351" r="7"/><circle cx="189" cy="371" r="5"/><circle cx="222" cy="382" r="4"/></g><g opacity=".45" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M175 408 q18-28 6-59"/><path d="M218 423 q-5-35 7-62"/></g></svg>;
}

function SceneArt({ id }: { id: string }) {
  if (id === "cloud") return <CloudArt />;
  if (id === "cloudReturn") return <CloudArt returning />;
  if (id === "mountain") return <MountainArt />;
  if (id === "leaf") return <LeafArt />;
  if (id === "soil") return <SoilArt />;
  if (id === "root") return <SoilArt root />;
  if (id === "groundwater") return <GroundwaterArt />;
  if (id === "spring") return <SpringArt />;
  if (id === "river") return <RiverArt />;
  if (id === "ocean") return <OceanArt />;
  return <VaporArt />;
}

export default function DropGame() {
  const [sceneId, setSceneId] = useState("cloud");
  const [phase, setPhase] = useState<"stable" | "leaving" | "entering">("stable");
  const [elapsed, setElapsed] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [history, setHistory] = useState<string[]>(["cloud"]);
  const [transitionNote, setTransitionNote] = useState("");
  const [showCycle, setShowCycle] = useState(false);

  const scene = scenes[sceneId];
  const discovered = useMemo(() => new Set(history).size, [history]);

  const choose = (choice: Choice) => {
    if (phase !== "stable") return;
    const target = pickTarget(choice.to);
    setTransitionNote(choice.note);
    setPhase("leaving");

    window.setTimeout(() => {
      setElapsed((v) => v + choice.minutes);
      setSceneId(target);
      setHistory((v) => [...v, target]);
      if (target === "cloudReturn") {
        setCycle((v) => v + 1);
        setShowCycle(true);
        window.setTimeout(() => setShowCycle(false), 1900);
      }
      setPhase("entering");
      window.setTimeout(() => {
        setPhase("stable");
        setTransitionNote("");
      }, 380);
    }, 300);
  };

  const sceneClass = `${styles.scene} ${phase === "stable" ? styles.sceneStable : phase === "leaving" ? styles.sceneLeaving : styles.sceneEntering}`;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hud}>
          <div className={styles.brand}><b>一滴</b><span>DROP</span></div>
          <div className={styles.stats}>
            <div className={styles.stat}><small>TIME</small><strong>{formatElapsed(elapsed)}</strong></div>
            <div className={styles.stat}><small>CYCLE</small><strong>{cycle}</strong></div>
          </div>
        </header>

        <section className={styles.stage} aria-live="polite">
          <div className={sceneClass}>
            <SceneArt id={sceneId} />
            <div className={styles.sceneLabel}><i />{scene.location} · {scene.state}</div>
            <div className={styles.journeyBar} aria-hidden="true">
              {Array.from({ length: Math.min(12, Math.max(4, history.length)) }).map((_, i) => <span key={i} className={`${styles.journeyDot} ${i < Math.min(history.length, 12) ? styles.journeyDotDone : ""}`} />)}
            </div>
            <div className={styles.caption}>
              <strong>{scene.title}</strong>
              <p>{scene.text}</p>
            </div>
          </div>

          <div className={`${styles.transitionNote} ${phase !== "stable" ? styles.transitionNoteVisible : ""}`}><div>{transitionNote || "水は動き続ける"}</div></div>

          {showCycle && (
            <div className={styles.cycleCard}>
              <div className={styles.cycleCardInner}>
                <small>WATER CYCLE +1</small>
                <h2>また、雲になった。</h2>
                <p>{formatElapsed(elapsed)}の旅。発見した場所は{discovered}種類。<br />けれど、この一滴の旅はまだ続く。</p>
              </div>
            </div>
          )}
        </section>

        <section className={styles.choicesWrap}>
          <p className={styles.question}>この一滴は、どう動く？</p>
          <div className={styles.choices}>
            {scene.choices.map((choice) => (
              <button className={styles.choice} key={`${sceneId}-${choice.label}`} disabled={phase !== "stable"} onClick={() => choose(choice)}>
                <span>{choice.icon}</span>{choice.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
