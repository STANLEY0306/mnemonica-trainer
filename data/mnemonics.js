/** Original, editable prompts. These are suggestions, not Tamariz's official mnemonics. */
export const DEFAULT_MNEMONICS = Object.freeze({
  "4C": "想像四片梅花瓣在絨布桌面排成小小的幸運草。",
  "2H": "兩顆紅心並排，像一對發光的糖果。",
  "7D": "七顆方塊寶石沿著舞台燈光閃亮。",
  "3C": "三片梅花葉變成一把小小的魔術扇。",
  "AS": "一把黑桃形的鑰匙，打開記憶宮殿的大門。",
  "5H": "五顆紅心排成一列，沿著熟悉的回家路前進。"
});

export const TECHNIQUES = [
  { title: "記憶宮殿（Method of loci）", text: "挑一條熟悉且固定的路線，把牌或牌組想像成鮮明畫面，依序放在路線上的地點。回想時沿路重走。每個地點放幾張牌，由你依辨識效果調整。" },
  { title: "故事鏈（Story chaining）", text: "把相鄰牌的畫面連成一段有動作的故事。每張牌都要和前一張、下一張發生互動，避免只背孤立的圖像。" },
  { title: "人物－動作－物件（PAO）", text: "替牌或位置自訂人物、動作與物件，再把三者組合成誇張畫面。這是常見的助記設計方式；本站不把它說成 Tamariz 的官方牌序口訣。" },
  { title: "數字意象（Major System）", text: "把數字映射到子音，再組成自己熟悉的詞或圖像。不同語言和使用者的對應可能不同，先建立個人表，再用牌序練習驗證是否好回想。" },
  { title: "錨點與間隔複習", text: "先牢記幾個位置作錨點，再依 52 張循環向前或向後推算。答題後隔一段時間再次提取，比只重看答案更適合用來安排複習。" }
];
