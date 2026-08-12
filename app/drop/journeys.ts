// 大河の一滴 — JOURNEY「水の人生」
// 図鑑とは別に、どんな一生だったかを集める。長いほど良いわけでも、短いほど良いわけでもない。

import { getNode } from "./nodes";
import type { Journey, RunState, Tag } from "./types";

const YEAR = 8766;

const n = (s: RunState, t: Tag) => s.tagCounts[t] ?? 0;
const has = (s: RunState, t: Tag) => n(s, t) > 0;
const been = (s: RunState, id: string) => s.route.some((r) => r.id === id);
const phases = (s: RunState) => new Set(s.route.map((r) => r.phase));

const list: Journey[] = [
  {
    id: "forest_life",
    name: "森の一生",
    note: "雲 → 葉 → 土 → 木 → 蒸散 → 雲",
    test: (s) => has(s, "forest") && has(s, "plant") && s.route.length <= 12,
  },
  {
    id: "great_river",
    name: "大河の一滴",
    note: "山から海まで、川を最後まで下りきった",
    test: (s) => has(s, "greatriver") && has(s, "ocean"),
  },
  {
    id: "century_underground",
    name: "百年の地下旅行",
    note: "地下で100年以上を過ごした",
    test: (s) => has(s, "groundwater") && s.hours >= YEAR * 100,
  },
  {
    id: "became_human",
    name: "人間になった水",
    note: "誰かの体の一部になった",
    test: (s) => has(s, "body"),
  },
  {
    id: "ice_sleep",
    name: "氷の眠り",
    note: "氷河の中で時間を過ごした",
    test: (s) => has(s, "glacier"),
  },
  {
    id: "million_years",
    name: "百万年の氷",
    note: "氷床の底まで沈み、途方もない時間を過ごした",
    test: (s) => been(s, "ICE_SHEET") && s.hours >= YEAR * 100000,
  },
  {
    id: "world_tour",
    name: "世界を一周した水",
    note: "海流に運ばれ、地球規模で移動した",
    test: (s) => n(s, "current") >= 2 || s.km >= 20000,
  },
  {
    id: "never_river",
    name: "一度も川を通らなかった水",
    note: "川に落ちることなく、空へ戻った",
    test: (s) => !has(s, "river") && !has(s, "stream") && !has(s, "greatriver"),
  },
  {
    id: "never_ocean",
    name: "一度も海へ行かなかった水",
    note: "海を見ないまま、一生を終えた",
    test: (s) => !has(s, "ocean"),
  },
  {
    id: "never_human",
    name: "人に触れなかった水",
    note: "人間の作ったものを一度も通らなかった",
    test: (s) => !has(s, "human"),
  },
  {
    id: "three_lives",
    name: "三度生きものになった水",
    note: "生きものの体を3回通り抜けた",
    test: (s) => n(s, "life") >= 3,
  },
  {
    id: "flash",
    name: "一日の一生",
    note: "24時間で雲へ戻った",
    test: (s) => s.hours <= 24,
  },
  {
    id: "ten_thousand",
    name: "万年の眠り",
    note: "一万年以上を、動かずに過ごした",
    test: (s) => s.hours >= YEAR * 10000,
  },
  {
    id: "sky_only",
    name: "空だけを旅した水",
    note: "地面にも水面にも触れなかった",
    test: (s) => s.route.every((r) => getNode(r.id).biome === "sky"),
  },
  {
    id: "city_through",
    name: "都市を抜けた水",
    note: "街に降り、下水を通って自然へ戻った",
    test: (s) => has(s, "city") && has(s, "sewage"),
  },
  {
    id: "tap_water",
    name: "水道水になった水",
    note: "浄水場を通り、蛇口から出た",
    test: (s) => has(s, "tap"),
  },
  {
    id: "sublimated",
    name: "溶けずに消えた水",
    note: "氷から、液体を経ずに空へ戻った",
    test: (s) => has(s, "sublimation"),
  },
  {
    id: "cave_water",
    name: "洞窟の水",
    note: "自分が溶かした岩の空洞を旅した",
    test: (s) => has(s, "cave"),
  },
  {
    id: "onsen",
    name: "温泉になった水",
    note: "地球の熱に温められ、誰かの肩を温めた",
    test: (s) => has(s, "hotspring"),
  },
  {
    id: "rice",
    name: "米になった水",
    note: "水田から稲へ入った",
    test: (s) => has(s, "paddy") && has(s, "plant"),
  },
  {
    id: "fish_pass",
    name: "魚のえらを抜けた水",
    note: "血と膜ごしにすれ違った",
    test: (s) => has(s, "fish"),
  },
  {
    id: "abyss_return",
    name: "深海から戻った水",
    note: "光のない場所から、もう一度空へ",
    test: (s) => has(s, "abyss"),
  },
  {
    id: "all_phases",
    name: "三つの姿すべて",
    note: "液体・固体・気体、すべてを経験した",
    test: (s) => phases(s).size >= 3,
  },
  {
    id: "plant_twice",
    name: "二度植物になった水",
    note: "根から入り、気孔から出て、また根から入った",
    test: (s) => n(s, "plant") >= 2,
  },
  {
    id: "long_way",
    name: "一万キロを旅した水",
    note: "一生のうちに地球の四分の一を移動した",
    test: (s) => s.km >= 10000,
  },
  {
    id: "polar",
    name: "極を見た水",
    note: "北極圏または南極に降った",
    test: (s) => s.region === "arctic" || s.region === "antarctic",
  },
  {
    id: "untouched_ground",
    name: "土を知らない水",
    note: "地面に染み込むことが一度もなかった",
    test: (s) => !has(s, "soil") && !has(s, "groundwater"),
  },
  {
    id: "before_history",
    name: "人間の歴史より長く",
    note: "文明が生まれてから今までより長い時間を、水として過ごした",
    test: (s) => s.hours >= YEAR * 5000,
  },
  {
    id: "wetland_keeper",
    name: "泥炭に眠った水",
    note: "腐らない植物とともに、湿原の底で過ごした",
    test: (s) => been(s, "PEAT"),
  },
  {
    id: "salt_core",
    name: "次の雨の核になった水",
    note: "海塩粒子として空へ飛び、雲の中心になった",
    test: (s) => been(s, "SEA_SALT"),
  },
];

export const JOURNEYS = list;
export const JOURNEY_TOTAL = list.length;

export function earnedJourneys(s: RunState): Journey[] {
  return list.filter((j) => {
    try {
      return j.test(s);
    } catch {
      return false;
    }
  });
}
