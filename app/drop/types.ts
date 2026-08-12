// 大河の一滴 — 型定義
// このゲームはステージ制ではなく、水循環ノードの巨大なグラフとして構成する。

export type Phase = "liquid" | "solid" | "gas";

export type Biome =
  | "sky"
  | "mountain"
  | "forest"
  | "plain"
  | "city"
  | "underground"
  | "river"
  | "lake"
  | "ocean"
  | "human"
  | "cryo"
  | "life";

export type Salinity = "fresh" | "brackish" | "saline";

/** 図鑑カテゴリー */
export type CodexCategory =
  | "sky"
  | "mountain"
  | "forest"
  | "underground"
  | "river"
  | "human"
  | "ocean"
  | "life";

/** 経路タグ。過去の旅によってイベントや実績が変わる。 */
export type Tag =
  | "sky"
  | "snow"
  | "mountain"
  | "forest"
  | "plant"
  | "plain"
  | "paddy"
  | "city"
  | "soil"
  | "groundwater"
  | "deepwater"
  | "cave"
  | "hotspring"
  | "spring"
  | "stream"
  | "river"
  | "greatriver"
  | "dam"
  | "flood"
  | "wetland"
  | "lake"
  | "estuary"
  | "ocean"
  | "current"
  | "abyss"
  | "coral"
  | "seaice"
  | "glacier"
  | "permafrost"
  | "sublimation"
  | "human"
  | "tap"
  | "body"
  | "sewage"
  | "factory"
  | "life"
  | "fish"
  | "animal"
  | "vapor";

export type SceneKey =
  | "cloud"
  | "sky"
  | "rainfall"
  | "snowfall"
  | "vapor"
  | "mountain"
  | "scree"
  | "snowfield"
  | "glacier"
  | "permafrost"
  | "seaice"
  | "canopy"
  | "leaf"
  | "forestfloor"
  | "moss"
  | "treeinside"
  | "soil"
  | "aquifer"
  | "deeprock"
  | "cave"
  | "spring"
  | "well"
  | "hotspring"
  | "stream"
  | "river"
  | "greatriver"
  | "waterfall"
  | "rapids"
  | "dam"
  | "flood"
  | "wetland"
  | "estuary"
  | "lake"
  | "lakedeep"
  | "plain"
  | "paddy"
  | "pond"
  | "canal"
  | "city"
  | "drain"
  | "sewer"
  | "waterworks"
  | "pipe"
  | "faucet"
  | "cup"
  | "body"
  | "bath"
  | "factory"
  | "coast"
  | "oceansurface"
  | "oceancurrent"
  | "oceandeep"
  | "coral"
  | "creature";

/** 一滴の内部状態。プレイヤーには見せすぎない。 */
export interface RunState {
  nodeId: string;
  phase: Phase;
  biome: Biome;
  /** 標高 m（地下・海中では負） */
  altitude: number;
  /** 地下・海中の深度 m */
  depth: number;
  salinity: Salinity;
  /** 気温・水温 ℃ */
  temperature: number;
  /** 誕生からの経過時間（時間） */
  hours: number;
  /** 移動距離 km */
  km: number;
  tags: Tag[];
  tagCounts: Partial<Record<Tag, number>>;
  route: RouteStep[];
  /** 姿（相）を変えた回数 */
  transforms: number;
  region: RegionId;
  cycle: number;
  /** 直近ノードの滞在時間 */
  stayHours: number;
  longest: { name: string; hours: number };
  /** 図鑑の新規解放をこの周で得たぶん */
  unlocked: string[];
}

export interface RouteStep {
  id: string;
  name: string;
  phase: Phase;
  scene: SceneKey;
  hours: number;
  atHours: number;
}

export interface Outcome {
  to: string;
  weight?: number;
  when?: (s: RunState) => boolean;
}

export interface Choice {
  label: string;
  /** 選ぶ前に見える、水から見た短い説明 */
  detail: string;
  outcomes: Outcome[];
  when?: (s: RunState) => boolean;
}

export interface WaterNode {
  id: string;
  /** 表示名 */
  name: string;
  /** 上部UIの現在地表示。地域名が前に付く。 */
  place: string;
  biome: Biome;
  phase: Phase;
  scene: SceneKey;
  /** 情景テキスト */
  lines: string[];
  /** 滞在時間の範囲（時間） */
  hours: [number, number];
  /** 移動距離の範囲（km） */
  km?: [number, number];
  altitude?: number;
  depth?: number;
  salinity?: Salinity;
  temperature?: number;
  tags?: Tag[];
  codex?: string;
  /** TIME FLOW 演出を使う長期滞在ノード */
  timeflow?: boolean;
  /** 雲へ戻った＝1周の終わり */
  ending?: boolean;
  choices: Choice[];
}

export type RegionId =
  | "japan"
  | "himalaya"
  | "amazon"
  | "sahel"
  | "arctic"
  | "antarctic"
  | "pacific"
  | "seasia";

export interface Region {
  id: RegionId;
  name: string;
  /** 現在地表示の接頭辞 */
  prefix: string;
  /** 開始時の情景 */
  opening: string[];
  /** 平均気温の下駄 */
  tempShift: number;
  /** 降下先の重み付け */
  landing: Partial<Record<string, number>>;
}

export interface CodexEntry {
  id: string;
  name: string;
  category: CodexCategory;
  note: string;
}

export interface Journey {
  id: string;
  name: string;
  note: string;
  test: (s: RunState) => boolean;
}

export interface Profile {
  version: 2;
  totalHours: number;
  totalKm: number;
  cycles: number;
  codex: string[];
  journeys: string[];
  regions: RegionId[];
  places: string[];
  organisms: string[];
  humanPlaces: string[];
  longest: { name: string; hours: number } | null;
  shortestCycleHours: number | null;
  longestCycleHours: number | null;
}
