"use client";

// 大河の一滴 — 場面
//
// UIよりも「水がいる場所そのもの」を主役にする。
// 後景 / プレイ層（水） / 前景 の三層で、平面的なアイコンではなく空間を作る。
//
// 座標系はスマートフォン縦画面に合わせた 100 × 180。
// slice で覆うため、大事なものは x=10〜90 の内側に置く。

import { memo } from "react";
import styles from "./drop.module.css";
import type { SceneKey } from "./types";

const W = 100;
const H = 180;

interface Palette {
  sky0: string;
  sky1: string;
  far: string;
  mid: string;
  near: string;
  accent: string;
  glow: string;
  dark: boolean;
}

type ElementKind =
  | "sun"
  | "clouds"
  | "cloudMass"
  | "peaks"
  | "snowPeaks"
  | "hills"
  | "conifers"
  | "canopy"
  | "leafBig"
  | "veins"
  | "strata"
  | "grain"
  | "rocks"
  | "boulders"
  | "roots"
  | "waves"
  | "waterline"
  | "surfaceLight"
  | "deepMurk"
  | "bubbles"
  | "buildings"
  | "tunnel"
  | "pipeRun"
  | "basins"
  | "iceShards"
  | "iceCracks"
  | "hexes"
  | "stalactites"
  | "grasses"
  | "reeds"
  | "paddyRows"
  | "fishes"
  | "cells"
  | "foam"
  | "rainStreaks"
  | "snowFall"
  | "dust"
  | "plankton"
  | "rays"
  | "cliff"
  | "steam"
  | "coralHeads"
  | "glassRim"
  | "sandBed"
  | "distantCity";

interface SceneDef {
  palette: Palette;
  back: ElementKind[];
  front: ElementKind[];
}

const P = (
  sky0: string,
  sky1: string,
  far: string,
  mid: string,
  near: string,
  accent: string,
  glow: string,
  dark = false,
): Palette => ({ sky0, sky1, far, mid, near, accent, glow, dark });

const SCENES: Record<SceneKey, SceneDef> = {
  cloud: {
    palette: P("#9fc9e8", "#eaf6ff", "#d2e8f7", "#ffffff", "#f0f8fe", "#fff6cf", "#bfe6ff"),
    back: ["sun", "cloudMass"],
    front: ["clouds", "dust"],
  },
  sky: {
    palette: P("#245f9f", "#96cdec", "#6aade0", "#c8e6f8", "#e8f4fd", "#fff0bd", "#cdefff"),
    back: ["sun", "cloudMass"],
    front: ["clouds"],
  },
  rainfall: {
    palette: P("#2e4257", "#8fabc4", "#4f6883", "#a3bdd1", "#d2e2ee", "#f4faff", "#d6f0ff"),
    back: ["cloudMass", "hills", "distantCity"],
    front: ["rainStreaks"],
  },
  snowfall: {
    palette: P("#5b6d80", "#bccddc", "#8398ab", "#d6e3ee", "#f2f7fb", "#ffffff", "#e8f6ff"),
    back: ["cloudMass", "snowPeaks"],
    front: ["snowFall"],
  },
  vapor: {
    palette: P("#a8c6d8", "#f4f9fb", "#cbdde6", "#ffffff", "#ffffff", "#fff4d2", "#dff4ff"),
    back: ["steam", "sun"],
    front: ["steam", "dust"],
  },
  mountain: {
    palette: P("#4f7da4", "#b2d2e6", "#63737d", "#828f96", "#3f484d", "#e8f4ff", "#cdeeff"),
    back: ["snowPeaks", "peaks"],
    front: ["boulders", "rocks"],
  },
  scree: {
    palette: P("#70879a", "#bccfdb", "#6d7880", "#929da3", "#4b5257", "#dfeaf0", "#c8ecff"),
    back: ["peaks"],
    front: ["rocks", "boulders"],
  },
  snowfield: {
    palette: P("#74a0c6", "#d6e6f4", "#a3c0d4", "#e6f1f9", "#ffffff", "#cfe8ff", "#dff4ff"),
    back: ["snowPeaks"],
    front: ["iceShards", "snowFall"],
  },
  glacier: {
    palette: P("#0d3a5f", "#2b76a5", "#175680", "#3a8db9", "#8fd3ee", "#d6f4ff", "#a8ecff", true),
    back: ["iceCracks"],
    front: ["iceShards", "bubbles"],
  },
  permafrost: {
    palette: P("#26252e", "#474451", "#34313d", "#57525f", "#726b79", "#cfe6f2", "#a9dcf5", true),
    back: ["strata"],
    front: ["hexes", "grain"],
  },
  seaice: {
    palette: P("#0a3357", "#3679a3", "#164e77", "#e3f1fa", "#ffffff", "#bfeaff", "#b3ecff"),
    back: ["waterline", "iceCracks"],
    front: ["iceShards"],
  },
  canopy: {
    palette: P("#2f5f2c", "#84bc60", "#265024", "#417a36", "#16300f", "#e6f7bf", "#d8f8c8"),
    back: ["conifers", "rays"],
    front: ["canopy", "dust"],
  },
  leaf: {
    palette: P("#3f7c30", "#a0d46e", "#316026", "#63a545", "#1c3b16", "#f2ffd6", "#e2ffc8"),
    back: ["conifers", "rays"],
    front: ["leafBig", "veins"],
  },
  forestfloor: {
    palette: P("#362b1f", "#63523a", "#261f14", "#4b3d29", "#150f09", "#c9e08a", "#bfe8a0", true),
    back: ["roots", "rays"],
    front: ["grain", "grasses"],
  },
  moss: {
    palette: P("#26401d", "#639442", "#1e3616", "#41682c", "#0f210a", "#d6f0a0", "#c8f0a8", true),
    back: ["rocks"],
    front: ["grasses", "dust"],
  },
  treeinside: {
    palette: P("#3f2c13", "#94723a", "#31210c", "#60461f", "#1c1204", "#d6c07a", "#ffe9a8", true),
    back: ["cells"],
    front: ["veins", "dust"],
  },
  soil: {
    palette: P("#42331f", "#6f583a", "#2f2416", "#52412a", "#1b140b", "#a8c46a", "#bfe8a0", true),
    back: ["strata", "roots"],
    front: ["grain"],
  },
  aquifer: {
    palette: P("#183342", "#33637a", "#22475a", "#42768f", "#0f2130", "#a8dcf0", "#8fe4ff", true),
    back: ["strata"],
    front: ["boulders", "bubbles"],
  },
  deeprock: {
    palette: P("#14141b", "#2c2c38", "#1f1f27", "#3a3a47", "#0a0a0e", "#7fb9d6", "#7fdcff", true),
    back: ["strata", "iceCracks"],
    front: ["boulders"],
  },
  cave: {
    palette: P("#0d1116", "#242d3a", "#161c24", "#333d4a", "#06080b", "#a8d6e8", "#9fe8ff", true),
    back: ["stalactites"],
    front: ["stalactites", "dust"],
  },
  spring: {
    palette: P("#52858f", "#bce2db", "#376347", "#66945f", "#233f22", "#eaffe6", "#c8fff0"),
    back: ["rocks", "conifers"],
    front: ["grasses", "foam"],
  },
  well: {
    palette: P("#161d28", "#334254", "#1f2935", "#3f4f63", "#0b1018", "#bfd8e8", "#9fe0ff", true),
    back: ["tunnel"],
    front: ["pipeRun"],
  },
  hotspring: {
    palette: P("#523226", "#a06744", "#3f2419", "#77482c", "#241209", "#ffd9a8", "#ffc98f", true),
    back: ["strata"],
    front: ["steam", "bubbles"],
  },
  stream: {
    palette: P("#53859f", "#b7dce4", "#42634a", "#779467", "#28402c", "#eaffff", "#c8f4ff"),
    back: ["conifers", "peaks"],
    front: ["boulders", "foam"],
  },
  river: {
    palette: P("#417695", "#a0cadc", "#547854", "#87a677", "#333f33", "#e6f7ff", "#c8f0ff"),
    back: ["hills", "waterline"],
    front: ["waves", "foam"],
  },
  greatriver: {
    palette: P("#356288", "#bdd8e8", "#7790a3", "#a3bbc9", "#293b4b", "#f2fbff", "#bfeaff"),
    back: ["hills", "waterline", "distantCity"],
    front: ["waves"],
  },
  waterfall: {
    palette: P("#325264", "#87b9c6", "#243d49", "#678f9c", "#16242c", "#ffffff", "#d6f7ff", true),
    back: ["cliff"],
    front: ["foam", "steam"],
  },
  rapids: {
    palette: P("#436a7d", "#a0c6d1", "#33524a", "#678776", "#1f3124", "#ffffff", "#cdf4ff"),
    back: ["conifers"],
    front: ["boulders", "foam"],
  },
  dam: {
    palette: P("#3a6082", "#a0bfd1", "#54636d", "#87949e", "#2c3136", "#e6f2fb", "#bfe8ff"),
    back: ["peaks", "waterline"],
    front: ["basins"],
  },
  flood: {
    palette: P("#63634b", "#a09472", "#77694e", "#9b8e67", "#423a2c", "#dcd6bf", "#cde8ff"),
    back: ["distantCity", "waterline"],
    front: ["waves", "reeds"],
  },
  wetland: {
    palette: P("#638772", "#bcd4b7", "#547754", "#87a077", "#33422c", "#f2ffe6", "#c8ffd6"),
    back: ["hills", "waterline"],
    front: ["reeds", "grasses"],
  },
  estuary: {
    palette: P("#54778e", "#b7ced8", "#778790", "#9baab1", "#374750", "#eaf7ff", "#c8f0ff"),
    back: ["waterline", "distantCity"],
    front: ["waves", "sandBed"],
  },
  lake: {
    palette: P("#316288", "#b7d4e2", "#426354", "#779487", "#243830", "#f2fbff", "#c8f0ff"),
    back: ["snowPeaks", "waterline"],
    front: ["waves", "foam"],
  },
  lakedeep: {
    palette: P("#071726", "#122d42", "#0b202f", "#17384f", "#040c14", "#7fb9d6", "#7fdcff", true),
    back: ["deepMurk"],
    front: ["dust", "bubbles"],
  },
  plain: {
    palette: P("#77a0bc", "#d4e2ea", "#879467", "#a0aa77", "#545432", "#f7ffe6", "#d6f4c8"),
    back: ["hills", "grasses"],
    front: ["grain", "grasses"],
  },
  paddy: {
    palette: P("#87b1ce", "#d8e6ef", "#779454", "#a0bc67", "#42542b", "#f7ffd6", "#d6ffc8"),
    back: ["hills", "waterline"],
    front: ["paddyRows"],
  },
  pond: {
    palette: P("#548777", "#bcd8c4", "#426342", "#779467", "#273a2b", "#eaffe6", "#c8ffe0"),
    back: ["hills", "waterline"],
    front: ["reeds", "fishes"],
  },
  canal: {
    palette: P("#87a0b5", "#ced8e6", "#94a0a0", "#b7bcb7", "#545b4f", "#f2f7ff", "#c8f0ff"),
    back: ["hills", "tunnel"],
    front: ["basins", "waves"],
  },
  city: {
    palette: P("#546378", "#aab7c9", "#6d7987", "#909ba8", "#272d38", "#ffe9a8", "#bfe8ff"),
    back: ["buildings", "distantCity"],
    front: ["buildings", "rainStreaks"],
  },
  drain: {
    palette: P("#1f1f27", "#42424f", "#2b2b35", "#4f4f63", "#0d0d11", "#ffd98f", "#9fe0ff", true),
    back: ["tunnel"],
    front: ["grain", "foam"],
  },
  sewer: {
    palette: P("#161f1b", "#33423a", "#1f2b26", "#3a4a41", "#0a110e", "#a8c4b2", "#8fe0c8", true),
    back: ["tunnel"],
    front: ["pipeRun", "foam"],
  },
  waterworks: {
    palette: P("#63778e", "#bccedc", "#87949b", "#aab4bc", "#424a54", "#e6f2fb", "#bfe8ff"),
    back: ["basins", "distantCity"],
    front: ["basins", "pipeRun"],
  },
  pipe: {
    palette: P("#16232f", "#33495e", "#1f3042", "#3a5872", "#0b141c", "#bfdcee", "#9fe8ff", true),
    back: ["tunnel"],
    front: ["pipeRun"],
  },
  faucet: {
    palette: P("#aab7bc", "#e2eaec", "#87949b", "#c9d2d6", "#4f5863", "#ffffff", "#c8f4ff"),
    back: ["tunnel"],
    front: ["pipeRun", "foam"],
  },
  cup: {
    palette: P("#8fa8b7", "#dfeaee", "#7f96a3", "#c4d6dc", "#5c6b75", "#ffffff", "#c8f0ff"),
    back: ["glassRim"],
    front: ["glassRim"],
  },
  body: {
    palette: P("#54141f", "#a03a42", "#772329", "#bc5454", "#320a11", "#ffb2a8", "#ff9f9f", true),
    back: ["cells"],
    front: ["cells", "plankton"],
  },
  bath: {
    palette: P("#87a0aa", "#d8e6ea", "#a0b1b7", "#c9d5d8", "#545e63", "#fff7e0", "#d6f7ff"),
    back: ["tunnel", "waterline"],
    front: ["steam", "foam"],
  },
  factory: {
    palette: P("#424754", "#878e9b", "#545a63", "#777e89", "#232730", "#ffd98f", "#9fe8ff", true),
    back: ["buildings", "basins"],
    front: ["pipeRun", "steam"],
  },
  coast: {
    palette: P("#4287aa", "#b7dce6", "#678777", "#a0b7a0", "#32423a", "#ffffff", "#c8f4ff"),
    back: ["hills", "waterline"],
    front: ["waves", "foam"],
  },
  oceansurface: {
    palette: P("#155488", "#77bcd8", "#236388", "#428ebc", "#0b3254", "#eaf7ff", "#a8ecff"),
    back: ["waterline", "surfaceLight"],
    front: ["waves", "foam"],
  },
  oceancurrent: {
    palette: P("#0b3a5e", "#2b77a0", "#15547a", "#3787aa", "#06233a", "#bfeaff", "#8fe8ff", true),
    back: ["surfaceLight", "deepMurk"],
    front: ["waves", "plankton"],
  },
  oceandeep: {
    palette: P("#02060b", "#081623", "#040c14", "#0b2130", "#010305", "#5c9cc4", "#6fd6ff", true),
    back: ["deepMurk"],
    front: ["plankton", "dust"],
  },
  coral: {
    palette: P("#2794b7", "#a0e2ea", "#42aabc", "#77ced6", "#14637a", "#ffd6a8", "#c8f7ff"),
    back: ["surfaceLight", "rays"],
    front: ["coralHeads", "fishes"],
  },
  creature: {
    palette: P("#234254", "#548777", "#326377", "#67a0aa", "#142b37", "#ffd6bf", "#9ff0ff", true),
    back: ["cells", "deepMurk"],
    front: ["cells", "plankton"],
  },
};

// 決定的な擬似乱数。描画のたびに位置が変わらないようにする（ハイドレーション不整合も避ける）。
function pr(i: number, salt = 1): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function Element({ kind, p }: { kind: ElementKind; p: Palette }) {
  switch (kind) {
    case "sun":
      return (
        <g>
          <circle cx={70} cy={40} r={40} fill={p.accent} opacity={0.2} />
          <circle cx={70} cy={40} r={18} fill={p.accent} opacity={0.5} />
        </g>
      );

    case "clouds":
      return (
        <g className={styles.driftSlow} opacity={0.55}>
          {range(6).map((i) => {
            const x = pr(i, 2) * 120 - 10;
            const y = 10 + pr(i, 3) * 120;
            const r = 10 + pr(i, 4) * 18;
            return (
              <g key={i}>
                <ellipse cx={x} cy={y} rx={r * 1.8} ry={r * 0.66} fill={p.mid} />
                <ellipse cx={x + r * 0.7} cy={y - r * 0.34} rx={r} ry={r * 0.55} fill={p.near} />
              </g>
            );
          })}
        </g>
      );

    case "cloudMass":
      return (
        <g className={styles.driftVerySlow} opacity={0.7}>
          {range(9).map((i) => {
            const x = pr(i, 5) * 130 - 15;
            const y = 10 + pr(i, 6) * 150;
            const r = 18 + pr(i, 7) * 30;
            return (
              <ellipse key={i} cx={x} cy={y} rx={r * 1.7} ry={r * 0.9} fill={p.far} opacity={0.45} />
            );
          })}
        </g>
      );

    case "peaks":
      return (
        <g>
          {range(4).map((i) => {
            const cx = 8 + i * 28 + pr(i, 8) * 10;
            const h = 52 + pr(i, 9) * 46;
            return (
              <polygon
                key={i}
                points={`${cx - 34},${H} ${cx},${H - h} ${cx + 34},${H}`}
                fill={p.far}
                opacity={0.78 - i * 0.07}
              />
            );
          })}
        </g>
      );

    case "snowPeaks":
      return (
        <g>
          {range(3).map((i) => {
            const cx = 14 + i * 34 + pr(i, 10) * 8;
            const h = 62 + pr(i, 11) * 44;
            const top = H - h;
            return (
              <g key={i}>
                <polygon
                  points={`${cx - 38},${H} ${cx},${top} ${cx + 38},${H}`}
                  fill={p.far}
                  opacity={0.82}
                />
                <polygon
                  points={`${cx - 13},${top + 19} ${cx},${top} ${cx + 13},${top + 19} ${cx + 6},${top + 14} ${cx},${top + 21} ${cx - 7},${top + 13}`}
                  fill="#ffffff"
                  opacity={0.82}
                />
              </g>
            );
          })}
        </g>
      );

    case "hills":
      return (
        <g>
          <ellipse cx={16} cy={H + 4} rx={72} ry={40} fill={p.far} opacity={0.85} />
          <ellipse cx={84} cy={H + 10} rx={66} ry={34} fill={p.mid} opacity={0.8} />
        </g>
      );

    case "conifers":
      return (
        <g>
          {range(16).map((i) => {
            const x = pr(i, 12) * 108 - 4;
            const h = 34 + pr(i, 13) * 54;
            const w = h * 0.24;
            const base = H + pr(i, 14) * 8;
            return (
              <polygon
                key={i}
                points={`${x - w},${base} ${x},${base - h} ${x + w},${base}`}
                fill={i % 3 === 0 ? p.far : p.mid}
                opacity={0.55 + pr(i, 15) * 0.4}
              />
            );
          })}
        </g>
      );

    case "canopy":
      return (
        <g className={styles.swayLeaf}>
          {range(7).map((i) => {
            const x = pr(i, 16) * 112 - 6;
            const y = -14 + pr(i, 17) * 44;
            const r = 22 + pr(i, 18) * 26;
            return (
              <ellipse key={i} cx={x} cy={y} rx={r * 1.5} ry={r} fill={p.near} opacity={0.92} />
            );
          })}
        </g>
      );

    case "leafBig":
      // 巨大な一枚の葉。水滴から見上げた、緑の皿。
      return (
        <g>
          <path
            d="M14,178 C10,110 38,48 92,14 C88,78 70,142 30,184 Z"
            fill="#000000"
            opacity={0.18}
            transform="translate(3 5)"
          />
          <path
            d="M14,178 C10,110 38,48 92,14 C88,78 70,142 30,184 Z"
            fill={p.mid}
            opacity={0.97}
          />
          <path
            d="M14,178 C16,116 42,58 88,20 C74,80 60,132 28,178 Z"
            fill={p.sky1}
            opacity={0.26}
          />
          <path
            d="M14,178 C10,110 38,48 92,14"
            fill="none"
            stroke={p.near}
            strokeWidth={1.2}
            opacity={0.55}
          />
        </g>
      );

    case "veins":
      // 葉脈は、川の地図のように張りめぐらされている。
      return (
        <g stroke={p.near} strokeLinecap="round" fill="none">
          <path
            d="M18,180 C30,124 52,66 90,16"
            strokeWidth={2.2}
            opacity={0.5}
          />
          {range(9).map((i) => {
            const t = 0.06 + i * 0.105;
            const x = 18 + t * 72 + t * t * 8;
            const y = 180 - t * 164;
            const len = 20 * Math.sin(Math.PI * Math.min(1, t + 0.18));
            return (
              <g key={i} opacity={0.4}>
                <path d={`M${x},${y} q${len * 0.5},${-len * 0.2} ${len * 0.9},${-len * 0.9}`} strokeWidth={0.8} />
                <path d={`M${x},${y} q${-len * 0.4},${len * 0.1} ${-len * 0.7},${len * 0.5}`} strokeWidth={0.7} />
              </g>
            );
          })}
        </g>
      );

    case "strata":
      return (
        <g>
          {range(7).map((i) => {
            const y = i * 27 - 8;
            return (
              <rect
                key={i}
                x={-10}
                y={y}
                width={120}
                height={27}
                fill={i % 2 === 0 ? p.far : p.mid}
                opacity={0.5 + (i % 2) * 0.22}
              />
            );
          })}
          {range(6).map((i) => (
            <path
              key={`l${i}`}
              d={`M-10,${i * 30 + 8 + pr(i, 22) * 8} Q50,${i * 30 + pr(i, 23) * 18} 110,${i * 30 + 12}`}
              stroke={p.near}
              strokeWidth={0.8}
              fill="none"
              opacity={0.45}
            />
          ))}
        </g>
      );

    case "grain":
      return (
        <g>
          {range(60).map((i) => {
            const x = pr(i, 24) * 106 - 3;
            const y = pr(i, 25) * 186 - 3;
            const r = 0.6 + pr(i, 26) * 2.2;
            return (
              <circle key={i} cx={x} cy={y} r={r} fill={p.near} opacity={0.24 + pr(i, 27) * 0.4} />
            );
          })}
        </g>
      );

    case "rocks":
      return (
        <g>
          {range(13).map((i) => {
            const x = pr(i, 28) * 110 - 5;
            const y = 96 + pr(i, 29) * 88;
            const r = 6 + pr(i, 30) * 16;
            return (
              <polygon
                key={i}
                points={`${x - r},${y + r * 0.6} ${x - r * 0.5},${y - r * 0.7} ${x + r * 0.6},${y - r * 0.5} ${x + r},${y + r * 0.5}`}
                fill={i % 2 ? p.mid : p.near}
                opacity={0.82}
              />
            );
          })}
        </g>
      );

    case "boulders":
      return (
        <g>
          {range(5).map((i) => {
            const x = pr(i, 31) * 116 - 8;
            const y = 148 + pr(i, 32) * 44;
            const r = 24 + pr(i, 33) * 26;
            return (
              <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.68} fill={p.near} opacity={0.92} />
            );
          })}
        </g>
      );

    case "roots":
      return (
        <g stroke={p.near} fill="none" opacity={0.55} strokeLinecap="round">
          {range(6).map((i) => {
            const x = 4 + pr(i, 34) * 92;
            return (
              <g key={i}>
                <path
                  d={`M${x},-8 C${x + 8},40 ${x - 12},92 ${x + 5},${150 + pr(i, 35) * 30}`}
                  strokeWidth={2.6 - i * 0.3}
                />
                <path d={`M${x + 3},56 l${9 + pr(i, 35) * 16},22`} strokeWidth={0.9} />
                <path d={`M${x - 2},98 l${-9 - pr(i, 36) * 16},20`} strokeWidth={0.9} />
              </g>
            );
          })}
        </g>
      );

    case "waves":
      return (
        <g className={styles.flowWave}>
          {range(7).map((i) => {
            const y = 84 + i * 15;
            return (
              <path
                key={i}
                d={`M-20,${y} Q5,${y - 6} 30,${y} T80,${y} T130,${y}`}
                stroke={i % 2 ? p.accent : p.near}
                strokeWidth={1.3 + i * 0.5}
                fill="none"
                opacity={0.26 + i * 0.09}
              />
            );
          })}
        </g>
      );

    case "waterline":
      return (
        <g>
          <rect x={-10} y={96} width={120} height={100} fill={p.mid} opacity={0.5} />
          <rect x={-10} y={96} width={120} height={1.4} fill={p.accent} opacity={0.7} />
          {range(9).map((i) => (
            <rect
              key={i}
              x={pr(i, 37) * 100 - 8}
              y={102 + pr(i, 38) * 70}
              width={12 + pr(i, 39) * 28}
              height={1}
              fill={p.accent}
              opacity={0.2}
            />
          ))}
        </g>
      );

    case "surfaceLight":
      return (
        <g className={styles.caustics} opacity={0.4}>
          {range(10).map((i) => (
            <path
              key={i}
              d={`M${pr(i, 40) * 100 - 10},-10 L${pr(i, 41) * 100},${H + 10}`}
              stroke={p.accent}
              strokeWidth={2 + pr(i, 42) * 8}
              opacity={0.15}
            />
          ))}
        </g>
      );

    case "deepMurk":
      return (
        <g>
          <ellipse cx={50} cy={H + 20} rx={100} ry={90} fill="#000000" opacity={0.5} />
          <ellipse cx={50} cy={-20} rx={92} ry={60} fill={p.mid} opacity={0.3} />
        </g>
      );

    case "bubbles":
      return (
        <g className={styles.rise}>
          {range(16).map((i) => (
            <circle
              key={i}
              cx={pr(i, 43) * 106 - 3}
              cy={pr(i, 44) * 190}
              r={0.9 + pr(i, 45) * 3}
              fill="none"
              stroke={p.accent}
              strokeWidth={0.55}
              opacity={0.5}
            />
          ))}
        </g>
      );

    case "buildings":
      return (
        <g>
          {range(9).map((i) => {
            const w = 10 + pr(i, 46) * 14;
            const x = i * 12 - 6 + pr(i, 47) * 4;
            const h = 44 + pr(i, 48) * 96;
            return (
              <g key={i}>
                <rect x={x} y={H - h} width={w} height={h + 8} fill={i % 2 ? p.far : p.mid} />
                {range(14).map((j) => (
                  <rect
                    key={j}
                    x={x + 2.4 + (j % 2) * 5.4}
                    y={H - h + 6 + Math.floor(j / 2) * 11}
                    width={2.8}
                    height={4}
                    fill={p.accent}
                    opacity={pr(i * 17 + j, 49) > 0.52 ? 0.72 : 0.1}
                  />
                ))}
              </g>
            );
          })}
        </g>
      );

    case "distantCity":
      return (
        <g opacity={0.32}>
          {range(14).map((i) => {
            const x = i * 8 - 4;
            const h = 12 + pr(i, 50) * 40;
            return <rect key={i} x={x} y={H - h} width={6.4} height={h} fill={p.far} />;
          })}
        </g>
      );

    case "tunnel":
      return (
        <g>
          {range(7).map((i) => {
            const s = 1 - i * 0.13;
            return (
              <ellipse
                key={i}
                cx={50}
                cy={86}
                rx={72 * s}
                ry={92 * s}
                fill="none"
                stroke={i % 2 ? p.mid : p.far}
                strokeWidth={8 * s + 1}
                opacity={0.45 + i * 0.07}
              />
            );
          })}
          <ellipse cx={50} cy={86} rx={13} ry={16} fill={p.sky0} opacity={0.9} />
        </g>
      );

    case "pipeRun":
      return (
        <g>
          <rect x={-10} y={128} width={120} height={16} rx={8} fill={p.near} opacity={0.9} />
          <rect x={-10} y={22} width={120} height={11} rx={5.5} fill={p.mid} opacity={0.8} />
          {range(4).map((i) => (
            <rect key={i} x={i * 28 + 8} y={32} width={8} height={98} fill={p.mid} opacity={0.5} />
          ))}
          {range(6).map((i) => (
            <circle key={`b${i}`} cx={i * 20 + 8} cy={136} r={2.8} fill={p.accent} opacity={0.5} />
          ))}
        </g>
      );

    case "basins":
      return (
        <g>
          {range(3).map((i) => {
            const y = 74 + i * 34;
            return (
              <g key={i}>
                <rect x={-10} y={y} width={120} height={27} fill={p.mid} opacity={0.5} />
                <rect x={-10} y={y} width={120} height={1.8} fill={p.accent} opacity={0.55} />
                <rect x={-10} y={y + 26} width={120} height={3} fill={p.near} opacity={0.85} />
              </g>
            );
          })}
          {range(9).map((i) => (
            <rect key={`r${i}`} x={i * 13 - 4} y={52} width={2.2} height={18} fill={p.near} opacity={0.7} />
          ))}
          <rect x={-10} y={68} width={120} height={1.8} fill={p.near} opacity={0.7} />
        </g>
      );

    case "iceShards":
      return (
        <g>
          {range(9).map((i) => {
            const x = pr(i, 51) * 114 - 7;
            const y = 96 + pr(i, 52) * 90;
            const w = 14 + pr(i, 53) * 28;
            const h = 24 + pr(i, 54) * 50;
            return (
              <polygon
                key={i}
                points={`${x},${y - h} ${x + w * 0.6},${y} ${x},${y + h * 0.35} ${x - w * 0.5},${y - h * 0.2}`}
                fill={p.near}
                opacity={0.45 + pr(i, 55) * 0.42}
              />
            );
          })}
        </g>
      );

    case "iceCracks":
      return (
        <g stroke={p.near} fill="none" opacity={0.45}>
          {range(12).map((i) => {
            const x = pr(i, 56) * 100;
            const y = pr(i, 57) * 180;
            return (
              <path
                key={i}
                d={`M${x},${y} l${14 + pr(i, 58) * 26},${-12 + pr(i, 59) * 44} l${-8 + pr(i, 60) * 22},${14 + pr(i, 61) * 28}`}
                strokeWidth={0.7 + pr(i, 62) * 1}
              />
            );
          })}
        </g>
      );

    case "hexes":
      return (
        <g opacity={0.42}>
          {range(12).map((i) => {
            const x = pr(i, 63) * 100;
            const y = pr(i, 64) * 180;
            const r = 4 + pr(i, 65) * 8;
            const pts = range(6)
              .map((k) => {
                const a = (Math.PI / 3) * k;
                return `${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`;
              })
              .join(" ");
            return <polygon key={i} points={pts} fill="none" stroke={p.accent} strokeWidth={0.7} />;
          })}
        </g>
      );

    case "stalactites":
      return (
        <g>
          {range(12).map((i) => {
            const x = pr(i, 66) * 108 - 4;
            const h = 20 + pr(i, 67) * 68;
            const w = 3.4 + pr(i, 68) * 6;
            return (
              <polygon key={i} points={`${x - w},-6 ${x + w},-6 ${x},${h}`} fill={p.mid} opacity={0.85} />
            );
          })}
          {range(9).map((i) => {
            const x = pr(i, 69) * 108 - 4;
            const h = 16 + pr(i, 70) * 52;
            const w = 3.4 + pr(i, 71) * 7;
            return (
              <polygon
                key={`u${i}`}
                points={`${x - w},${H + 6} ${x + w},${H + 6} ${x},${H - h}`}
                fill={p.near}
                opacity={0.9}
              />
            );
          })}
        </g>
      );

    case "grasses":
      return (
        <g stroke={p.mid} fill="none" strokeLinecap="round" className={styles.swaySlow}>
          {range(32).map((i) => {
            const x = pr(i, 72) * 108 - 4;
            const h = 14 + pr(i, 73) * 44;
            const lean = -7 + pr(i, 74) * 14;
            return (
              <path
                key={i}
                d={`M${x},${H + 6} Q${x + lean * 0.4},${H + 6 - h * 0.6} ${x + lean},${H + 6 - h}`}
                strokeWidth={0.9 + pr(i, 75) * 1.1}
                opacity={0.55 + pr(i, 76) * 0.42}
              />
            );
          })}
        </g>
      );

    case "reeds":
      return (
        <g className={styles.swaySlow}>
          {range(18).map((i) => {
            const x = pr(i, 77) * 110 - 5;
            const h = 44 + pr(i, 78) * 90;
            return (
              <g key={i}>
                <path
                  d={`M${x},${H + 8} Q${x + 4},${H + 8 - h * 0.6} ${x + 8},${H + 8 - h}`}
                  stroke={i % 3 === 0 ? p.near : p.mid}
                  strokeWidth={1.2}
                  fill="none"
                  opacity={0.85}
                />
                <ellipse cx={x + 8} cy={H + 8 - h} rx={1.5} ry={5} fill={p.near} opacity={0.8} />
              </g>
            );
          })}
        </g>
      );

    case "paddyRows":
      return (
        <g>
          {range(6).map((i) => {
            const y = 100 + i * 16;
            const inset = 24 - i * 4.4;
            return (
              <g key={i}>
                <rect x={inset} y={y} width={100 - inset * 2} height={1.6} fill={p.near} opacity={0.7} />
                {range(8).map((j) => (
                  <path
                    key={j}
                    d={`M${inset + j * ((100 - inset * 2) / 8) + 3},${y} l1.8,-${7 + i * 1.4}`}
                    stroke={p.mid}
                    strokeWidth={1}
                    fill="none"
                    opacity={0.8}
                  />
                ))}
              </g>
            );
          })}
        </g>
      );

    case "fishes":
      return (
        <g className={styles.swimSlow} opacity={0.72}>
          {range(4).map((i) => {
            const x = 18 + pr(i, 79) * 62;
            const y = 40 + pr(i, 80) * 116;
            const s = 6 + pr(i, 81) * 7;
            return (
              <g key={i}>
                <ellipse cx={x} cy={y} rx={s} ry={s * 0.4} fill={p.near} />
                <polygon
                  points={`${x - s},${y} ${x - s - s * 0.7},${y - s * 0.4} ${x - s - s * 0.7},${y + s * 0.4}`}
                  fill={p.near}
                />
              </g>
            );
          })}
        </g>
      );

    case "cells":
      return (
        <g opacity={0.55}>
          {range(16).map((i) => {
            const x = pr(i, 82) * 116 - 8;
            const y = pr(i, 83) * 196 - 8;
            const r = 11 + pr(i, 84) * 24;
            return (
              <g key={i}>
                <ellipse cx={x} cy={y} rx={r} ry={r * 0.8} fill={p.mid} opacity={0.5} />
                <ellipse
                  cx={x}
                  cy={y}
                  rx={r}
                  ry={r * 0.8}
                  fill="none"
                  stroke={p.accent}
                  strokeWidth={0.8}
                  opacity={0.55}
                />
              </g>
            );
          })}
        </g>
      );

    case "foam":
      return (
        <g>
          {range(40).map((i) => (
            <circle
              key={i}
              cx={pr(i, 85) * 106 - 3}
              cy={90 + pr(i, 86) * 100}
              r={0.8 + pr(i, 87) * 2.6}
              fill="#ffffff"
              opacity={0.18 + pr(i, 88) * 0.5}
            />
          ))}
        </g>
      );

    case "rainStreaks":
      return (
        <g className={styles.fallFast} stroke={p.accent} opacity={0.42}>
          {range(30).map((i) => {
            const x = pr(i, 89) * 118 - 9;
            const len = 12 + pr(i, 90) * 30;
            return (
              <path
                key={i}
                d={`M${x},${pr(i, 91) * 180 - 18} l-4,${len}`}
                strokeWidth={0.8 + pr(i, 92) * 0.8}
              />
            );
          })}
        </g>
      );

    case "snowFall":
      return (
        <g className={styles.fallSlow}>
          {range(34).map((i) => (
            <circle
              key={i}
              cx={pr(i, 93) * 110 - 5}
              cy={pr(i, 94) * 194 - 8}
              r={0.8 + pr(i, 95) * 2}
              fill="#ffffff"
              opacity={0.45 + pr(i, 96) * 0.5}
            />
          ))}
        </g>
      );

    case "dust":
      return (
        <g className={styles.floatSlow}>
          {range(26).map((i) => (
            <circle
              key={i}
              cx={pr(i, 97) * 106 - 3}
              cy={pr(i, 98) * 186 - 3}
              r={0.5 + pr(i, 99) * 1.2}
              fill={p.accent}
              opacity={0.18 + pr(i, 100) * 0.4}
            />
          ))}
        </g>
      );

    case "plankton":
      return (
        <g className={styles.floatSlow}>
          {range(20).map((i) => {
            const x = pr(i, 101) * 106 - 3;
            const y = pr(i, 102) * 186 - 3;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={2.6 + pr(i, 103) * 3.4} fill={p.accent} opacity={0.12} />
                <circle cx={x} cy={y} r={0.8 + pr(i, 104) * 1} fill={p.accent} opacity={0.7} />
              </g>
            );
          })}
        </g>
      );

    case "rays":
      return (
        <g className={styles.rayShift} opacity={0.3}>
          {range(5).map((i) => {
            const x = 8 + i * 20 + pr(i, 105) * 8;
            const w = 5 + pr(i, 106) * 12;
            return (
              <polygon
                key={i}
                points={`${x},-8 ${x + w},-8 ${x + w * 2.2},${H + 8} ${x + w * 0.5},${H + 8}`}
                fill={p.accent}
                opacity={0.26}
              />
            );
          })}
        </g>
      );

    case "cliff":
      return (
        <g>
          <path d={`M-10,-10 L42,-10 L50,72 L36,${H + 10} L-10,${H + 10} Z`} fill={p.near} opacity={0.95} />
          <path d={`M110,-10 L76,-10 L68,64 L84,${H + 10} L110,${H + 10} Z`} fill={p.far} opacity={0.9} />
          <g className={styles.fallFast} opacity={0.75}>
            {range(14).map((i) => (
              <rect
                key={i}
                x={44 + pr(i, 107) * 24}
                y={pr(i, 108) * 190 - 12}
                width={1.8 + pr(i, 109) * 3.4}
                height={30 + pr(i, 110) * 60}
                fill="#ffffff"
                opacity={0.28 + pr(i, 111) * 0.42}
                rx={1}
              />
            ))}
          </g>
        </g>
      );

    case "steam":
      return (
        <g className={styles.rise} opacity={0.5}>
          {range(12).map((i) => (
            <ellipse
              key={i}
              cx={pr(i, 112) * 106 - 3}
              cy={pr(i, 113) * 190}
              rx={11 + pr(i, 114) * 22}
              ry={7 + pr(i, 115) * 14}
              fill="#ffffff"
              opacity={0.2}
            />
          ))}
        </g>
      );

    case "coralHeads":
      return (
        <g>
          {range(8).map((i) => {
            const x = pr(i, 116) * 110 - 5;
            const y = 150 + pr(i, 117) * 40;
            const r = 11 + pr(i, 118) * 17;
            return (
              <g key={i}>
                <ellipse cx={x} cy={y} rx={r} ry={r * 0.78} fill={p.near} opacity={0.85} />
                {range(5).map((j) => (
                  <ellipse
                    key={j}
                    cx={x - r * 0.6 + j * (r * 0.3)}
                    cy={y - r * 0.6 - pr(i * 5 + j, 119) * 7}
                    rx={r * 0.2}
                    ry={r * 0.3}
                    fill={p.accent}
                    opacity={0.5}
                  />
                ))}
              </g>
            );
          })}
        </g>
      );

    case "glassRim":
      // コップの中。波が止まり、水面が完全に平らになる。
      return (
        <g>
          <path d={`M12,-10 L19,${H - 16} Q50,${H} 81,${H - 16} L88,-10 Z`} fill={p.near} opacity={0.14} />
          <path d={`M22,72 L24,${H - 17} Q50,${H - 3} 76,${H - 17} L78,72 Z`} fill={p.sky0} opacity={0.4} />
          <path
            d={`M12,-10 L19,${H - 16} Q50,${H} 81,${H - 16} L88,-10`}
            fill="none"
            stroke={p.near}
            strokeWidth={2.2}
            opacity={0.85}
          />
          <path d={`M22,72 Q50,80 78,72`} fill="none" stroke="#ffffff" strokeWidth={2} opacity={0.85} />
          <path d={`M22,72 Q50,64 78,72`} fill="none" stroke={p.near} strokeWidth={0.9} opacity={0.5} />
          <rect x={16} y={-10} width={5} height={190} fill="#ffffff" opacity={0.3} />
          <ellipse cx={50} cy={-26} rx={54} ry={30} fill="#000000" opacity={0.22} />
        </g>
      );

    case "sandBed":
      return (
        <g>
          <ellipse cx={50} cy={H + 24} rx={100} ry={40} fill={p.near} opacity={0.9} />
          {range(24).map((i) => (
            <circle
              key={i}
              cx={pr(i, 120) * 106 - 3}
              cy={148 + pr(i, 121) * 36}
              r={0.7 + pr(i, 122) * 1.6}
              fill={p.accent}
              opacity={0.28}
            />
          ))}
        </g>
      );

    default:
      return null;
  }
}

const Layer = memo(function Layer({
  kinds,
  p,
  className,
}: {
  kinds: ElementKind[];
  p: Palette;
  className: string;
}) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {kinds.map((k) => (
        <Element key={k} kind={k} p={p} />
      ))}
    </svg>
  );
});

export function sceneGlow(scene: SceneKey): string {
  return SCENES[scene].palette.glow;
}

export function sceneIsDark(scene: SceneKey): boolean {
  return SCENES[scene].palette.dark;
}

export default function Scene({ scene }: { scene: SceneKey }) {
  const def = SCENES[scene];
  const p = def.palette;
  return (
    <div
      className={styles.scene}
      style={{
        background: `linear-gradient(178deg, ${p.sky0} 0%, ${p.sky1} 58%, ${p.mid} 100%)`,
      }}
    >
      <Layer kinds={def.back} p={p} className={styles.layerBack} />
      <div className={styles.layerHaze} style={{ background: p.sky1 }} />
      <Layer kinds={def.front} p={p} className={styles.layerFront} />
      <div className={styles.vignette} />
    </div>
  );
}
