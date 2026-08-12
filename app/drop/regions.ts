// 大河の一滴 — 地域システム
// 水は同じでも、降る場所が変わればまったく違う一生になる。

import type { Region, RegionId } from "./types";

const list: Region[] = [
  {
    id: "japan",
    name: "日本・本州",
    prefix: "奥多摩",
    opening: [
      "眼下に、緑の濃い山地が続いている。",
      "その向こうに、灰色の街と、光る海。",
    ],
    tempShift: 0,
    landing: {},
  },
  {
    id: "seasia",
    name: "東南アジア",
    prefix: "メコン流域",
    opening: [
      "湿った空気が、雲そのものを重くしている。",
      "下には、水路と水田が果てしなく続いている。",
    ],
    tempShift: 8,
    landing: {},
  },
  {
    id: "himalaya",
    name: "ヒマラヤ",
    prefix: "ヒマラヤ",
    opening: [
      "雲の高さに、山がある。",
      "白い峰が、雲を突き破って並んでいる。",
    ],
    tempShift: -12,
    landing: {},
  },
  {
    id: "amazon",
    name: "アマゾン",
    prefix: "アマゾン",
    opening: [
      "地平線まで、緑。",
      "この雲の水は、その森が自分で空へ返したものだ。",
    ],
    tempShift: 7,
    landing: {},
  },
  {
    id: "sahel",
    name: "サハラ南縁",
    prefix: "サヘル",
    opening: [
      "赤茶けた大地に、雲の影がひとつだけ落ちている。",
      "ここでは、地面に届く前に消えてしまう雨もある。",
    ],
    tempShift: 12,
    landing: {},
  },
  {
    id: "pacific",
    name: "太平洋",
    prefix: "北太平洋",
    opening: [
      "どこまで行っても、青しかない。",
      "陸は、この雲からは見えない。",
    ],
    tempShift: 3,
    landing: {},
  },
  {
    id: "arctic",
    name: "北極圏",
    prefix: "北極海",
    opening: [
      "白と、灰色と、その境目の黒い水。",
      "太陽が、地平線をなぞるように動いている。",
    ],
    tempShift: -18,
    landing: {},
  },
  {
    id: "antarctic",
    name: "南極",
    prefix: "南極",
    opening: [
      "下にあるのは、大陸ぜんたいを覆う氷。",
      "その厚さは、場所によって4,000mを超える。",
    ],
    tempShift: -32,
    landing: {},
  },
];

export const REGIONS: Record<RegionId, Region> = Object.fromEntries(
  list.map((r) => [r.id, r]),
) as Record<RegionId, Region>;

export const REGION_IDS = list.map((r) => r.id);

/** 周回ごとに地域を選ぶ。1周目は日本から始める。 */
export function pickRegion(cycle: number, rand: () => number): RegionId {
  if (cycle <= 1) return "japan";
  const pool = REGION_IDS;
  return pool[Math.floor(rand() * pool.length)] ?? "japan";
}
