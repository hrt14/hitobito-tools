// 大河の一滴 — 図鑑「水の記憶」
// 通った場所が、そのまま記録になる。

import type { CodexCategory, CodexEntry } from "./types";

export const CATEGORY_LABEL: Record<CodexCategory, string> = {
  sky: "空",
  mountain: "山",
  forest: "森",
  underground: "地下",
  river: "川",
  human: "人",
  ocean: "海",
  life: "生きもの",
};

export const CATEGORY_ORDER: CodexCategory[] = [
  "sky",
  "mountain",
  "forest",
  "underground",
  "river",
  "human",
  "ocean",
  "life",
];

const list: CodexEntry[] = [
  // 空
  { id: "cloud", name: "雲", category: "sky", note: "水滴と氷の粒の集まり。地球の水のうち、ここにいるのはほんのわずか。" },
  { id: "rain", name: "雨", category: "sky", note: "落ちるとき、丸ではなく、下がつぶれた饅頭の形になる。" },
  { id: "snow", name: "雪", category: "sky", note: "気温が低いと、水蒸気は液体を経ずに結晶になる。二つとも同じ形はない。" },
  { id: "hail", name: "あられ", category: "sky", note: "上昇気流の中で何度も上下し、氷の層を重ねて育つ。" },
  { id: "icecrystal", name: "氷晶", category: "sky", note: "雲のいちばん高いところでは、水は氷としてしか存在できない。" },
  { id: "mist", name: "霧", category: "sky", note: "浮いていられるほど小さい水滴。雲と霧の違いは、高さだけ。" },
  { id: "vapor", name: "水蒸気", category: "sky", note: "目に見えない。しかし大気中の水のほとんどはこの姿でいる。" },
  { id: "atmosphericriver", name: "大気の川", category: "sky", note: "空を流れる水蒸気の帯。運ぶ水の量は、地上の大河を超える。" },
  { id: "seasalt", name: "海塩粒子", category: "sky", note: "波の泡が弾けて飛ぶ微細な塩。これがないと、雲の中で水滴が育たない。" },
  { id: "sublimation", name: "昇華", category: "sky", note: "氷が液体を経ずに水蒸気になること。乾いた寒冷地で起きる。" },

  // 山
  { id: "bedrock", name: "岩肌", category: "mountain", note: "水を通さないように見えて、どんな岩にも必ずひびがある。" },
  { id: "snowpack", name: "積雪", category: "mountain", note: "冬のあいだ空から届いた水を、そのまま春まで保管する装置。" },
  { id: "snowfield", name: "雪渓", category: "mountain", note: "夏を越えても消えない雪。上から押され、下から融け、谷を下る。" },
  { id: "meltwater", name: "融雪水", category: "mountain", note: "雪解け水は川へ、湖へ、地下水へ移動していく。" },
  { id: "glacier", name: "氷河", category: "mountain", note: "動かないのではなく、氷そのものが流れている。年に数十メートル。" },
  { id: "icesheet", name: "氷床", category: "mountain", note: "大陸を覆う氷。深いところの氷は、100万年以上前に降った雪でできている。" },
  { id: "subglacial", name: "氷底湖", category: "mountain", note: "何千mの氷の下に、凍っていない水がある。外気に触れず閉じている。" },
  { id: "permafrost", name: "永久凍土", category: "mountain", note: "夏でも融けない土。融けはじめると、地面ごと沈む。" },
  { id: "waterfall", name: "滝", category: "mountain", note: "落ちる途中で水は水でいられなくなり、粒と空気になる。" },

  // 森
  { id: "leaf", name: "葉", category: "forest", note: "森に降った雨の何割かは、地面に届かないまま葉から蒸発する。" },
  { id: "moss", name: "苔", category: "forest", note: "根を持たず、体の表面から直接水を吸う。森の小さな貯水池。" },
  { id: "litter", name: "腐葉土", category: "forest", note: "落ち葉の層は、雨を受け止め、土を削らせず、ゆっくり地下へ渡す。" },
  { id: "root", name: "根", category: "forest", note: "植物が土から水を受け取る入口。ここから水は「生きもの」になる。" },
  { id: "xylem", name: "道管", category: "forest", note: "直径0.1mmの管。切れ目のない水の糸が、葉に引かれて上昇する。" },
  { id: "stoma", name: "気孔", category: "forest", note: "葉の裏の小さな穴。根から吸った水の大半は、ここから空へ返る。蒸散。" },
  { id: "fruit", name: "果実", category: "forest", note: "実の重さのほとんどは水。植物が水を甘くして詰めたもの。" },

  // 地下
  { id: "soilwater", name: "土壌水", category: "underground", note: "土の粒のあいだの水。重力と、土に引き止める力の綱引きの中にいる。" },
  { id: "farmsoil", name: "耕作土", category: "underground", note: "耕された土は水を通しやすい。人間は土の水の通り方まで変えている。" },
  { id: "shallow_gw", name: "浅層地下水", category: "underground", note: "砂と礫の隙間を進む。速いといっても一日に数十センチ。" },
  { id: "aquifer", name: "帯水層", category: "underground", note: "地下の巨大なスポンジ。地球でいちばん大きな淡水の貯金箱。" },
  { id: "deepgw", name: "深層地下水", category: "underground", note: "何千年も地上に出ていない水。「化石水」と呼ばれることもある。" },
  { id: "cave", name: "鍾乳洞", category: "underground", note: "水が石灰岩を溶かして作った空間。鍾乳石も、水が置いていったもの。" },
  { id: "peat", name: "泥炭", category: "underground", note: "酸素がなく冷たい水の中では、植物が何千年も腐らずに残る。" },
  { id: "spring", name: "湧水", category: "underground", note: "地下水が地表と出会う場所。水温は一年じゅうほとんど変わらない。" },
  { id: "hotspring", name: "温泉", category: "underground", note: "地球の内側の熱で温められた地下水。岩の成分を溶かして運んでくる。" },
  { id: "well", name: "井戸", category: "underground", note: "何十年かけて下った距離を、ポンプは数秒で引き戻す。" },

  // 川
  { id: "brook", name: "沢", category: "river", note: "幅数十センチ。川のいちばん上流。すべての大河はここから始まる。" },
  { id: "stream", name: "小川", category: "river", note: "沢がいくつか合わさったところ。もう一滴ではなく、流れの一部。" },
  { id: "rapids", name: "早瀬", category: "river", note: "岩に砕かれ、空気を巻き込む。川が酸素を取り込む場所。" },
  { id: "river", name: "川", category: "river", note: "地表を流れる水を集めながら下る。水の何割かは地下から湧いた水。" },
  { id: "greatriver", name: "大河", category: "river", note: "上流のすべての雨、雪、湧水がここにいる。その一滴が、あなた。" },
  { id: "flood", name: "洪水", category: "river", note: "水が本来いてよかった場所に戻ること。氾濫原は、もともと川だった。" },
  { id: "wetland", name: "湿地", category: "river", note: "流れているのか止まっているのかわからない場所。水をゆっくり川へ返す。" },
  { id: "pond", name: "ため池", category: "river", note: "人間が水をためた小さな湖。生きものの密度が異様に高い。" },
  { id: "lake", name: "湖", category: "river", note: "受け取った水の多くを、流さずにそのまま空へ返している。" },
  { id: "lakedeep", name: "湖の深層", category: "river", note: "光が届かず、水温は一年じゅう4℃。表層とはほとんど混ざらない。" },
  { id: "estuary", name: "河口", category: "river", note: "川の水と海の水が層になってすれ違う。軽い淡水が上、重い海水が下。" },
  { id: "tidalflat", name: "干潟", category: "river", note: "泥と貝でできた巨大な濾過装置。潮のたびに水が入れ替わる。" },

  // 人
  { id: "roof", name: "屋根", category: "human", note: "水を1ミリも通さない面。街には、水が染み込める場所がほとんどない。" },
  { id: "road", name: "路面", category: "human", note: "舗装は雨を地下へ行かせない。だから街は、水を管で運ぶことにした。" },
  { id: "drain", name: "排水溝", category: "human", note: "街の下に、もう一つの街がある。その入口。" },
  { id: "reservoir", name: "雨水タンク", category: "human", note: "街が水浸しにならないよう、雨をいったん預かる装置。" },
  { id: "cistern", name: "地下調整池", category: "human", note: "コンクリートの柱が並ぶ地下空間。水を止めるために作られた神殿。" },
  { id: "dam", name: "ダム", category: "human", note: "人間は水の時間を止めることができる。しばらくのあいだは。" },
  { id: "intake", name: "取水口", category: "human", note: "ここから先の行き先を決めるのは、水ではなく人間になる。" },
  { id: "waterworks", name: "浄水場", category: "human", note: "薬品で濁りを沈め、砂の層をくぐらせる。地下水になるのと少し似ている。" },
  { id: "pipe", name: "水道管", category: "human", note: "街の下の水の道。総延長は、地球を何周もするほど。" },
  { id: "tap", name: "蛇口", category: "human", note: "圧力から解放される場所。何十年も地下にいた水が、手のひらに落ちる。" },
  { id: "cup", name: "コップ", category: "human", note: "水面が完全に平らになる、数分間だけの湖。" },
  { id: "bottle", name: "ペットボトル", category: "human", note: "水が商品として運ばれる姿。トラック、倉庫、冷蔵棚、誰かの鞄。" },
  { id: "bath", name: "風呂", category: "human", note: "温められた水が、人の体から熱ではなく冷たさを奪っていく。" },
  { id: "washer", name: "洗濯", category: "human", note: "繊維のあいだを何度も往復させられる。汚れを預かって出ていく。" },
  { id: "paddy", name: "水田", category: "human", note: "人間が水循環の途中に作った、平らで浅い湖。" },
  { id: "canal", name: "用水路", category: "human", note: "流れの速さも行き先も、板一枚で人間が決めている。" },
  { id: "factory", name: "工場", category: "human", note: "冷やす、洗う、混ぜる。ほとんどあらゆる物の製造工程を水が通る。" },
  { id: "sewer", name: "下水管", category: "human", note: "街じゅうの生活が、ここで一本になる。暗くて、温かい。" },
  { id: "sewageplant", name: "下水処理場", category: "human", note: "微生物に汚れを食べさせて、水を自然へ返す。人間の水循環の出口。" },

  // 海
  { id: "coast", name: "沿岸", category: "ocean", note: "同じ場所を何度も行き来させられる。波は、水を運ばずに形だけ運ぶ。" },
  { id: "opensea", name: "外洋", category: "ocean", note: "地球の水の97%がここにある。空へのぼる水の大半もここから出ていく。" },
  { id: "current", name: "海流", category: "ocean", note: "海の中の川。赤道の熱を極へ運び、地球の気候そのものを作っている。" },
  { id: "abyss", name: "深海", category: "ocean", note: "水温2℃、圧力400気圧。この水が最後に空気に触れたのは千年前。" },
  { id: "vent", name: "熱水噴出孔", category: "ocean", note: "300℃を超えても、圧力のせいで沸騰できない水。光のない生態系の源。" },
  { id: "seaice", name: "海氷", category: "ocean", note: "海が凍るとき塩は追い出される。残るのは、ほとんど真水の氷。" },
  { id: "coral", name: "サンゴ礁", category: "ocean", note: "無数の生きものが水を吸い、吐き続けている浅い海。" },

  // 生きもの
  { id: "plankton", name: "プランクトン", category: "life", note: "1mmの何分の一かの体。水と光から酸素を作っている。" },
  { id: "fishgill", name: "魚のえら", category: "life", note: "水と血が、薄い膜ごしにすれ違う場所。" },
  { id: "animal", name: "動物の体", category: "life", note: "水が自分では行けない場所へ、生きものは水を運んでいく。" },
  { id: "whale", name: "鯨の体", category: "life", note: "地球でいちばん大きな体。その体も、ほとんどが水でできている。" },
  { id: "humanbody", name: "人の体", category: "life", note: "体重の約60%が水。あなたは、しばらく「その人」の一部になる。" },
  { id: "breath", name: "呼気", category: "life", note: "人はひと息ごとに、体の水を少しずつ空へ返している。" },
];

export const CODEX: Record<string, CodexEntry> = Object.fromEntries(
  list.map((e) => [e.id, e]),
);

export const CODEX_TOTAL = list.length;

export function codexByCategory(category: CodexCategory): CodexEntry[] {
  return list.filter((e) => e.category === category);
}
