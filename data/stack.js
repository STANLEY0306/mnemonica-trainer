/** The fixed deck order supplied for this project. Index zero is position one. */
export const STACK = Object.freeze([
  "4C","2H","7D","3C","4H","6D","AS","5H","9S","2S","QH","3D","QC",
  "8H","6S","5S","9H","KC","2D","JH","3S","8S","6H","10C","5D","KD",
  "2C","3H","8D","5C","KS","JD","8C","10S","KH","JC","7S","10H","AD",
  "4S","7H","4D","AC","9C","JS","QD","7C","QS","10D","6C","AH","9D"
]);

export const RANKS = Object.freeze(["A","2","3","4","5","6","7","8","9","10","J","Q","K"]);
export const SUITS = Object.freeze({
  C: { symbol: "♣", zh: "梅花", color: "black" },
  H: { symbol: "♥", zh: "紅心", color: "red" },
  S: { symbol: "♠", zh: "黑桃", color: "black" },
  D: { symbol: "♦", zh: "方塊", color: "red" }
});

export function cardAt(position) {
  if (!Number.isInteger(position) || position < 1 || position > 52) return null;
  return STACK[position - 1];
}
export function positionOf(card) {
  const normalized = normalizeCard(card);
  return normalized ? STACK.indexOf(normalized) + 1 : null;
}
export function normalizeCard(input) {
  if (typeof input !== "string") return null;
  const text = input.trim().toUpperCase().replaceAll(" ", "");
  const localized = text.match(/^(黑桃|梅花|紅心|红心|方塊|方块)(10|[2-9AJQK])$/);
  const suitByName = { 黑桃: "S", 梅花: "C", 紅心: "H", 红心: "H", 方塊: "D", 方块: "D" };
  let candidate = localized ? `${localized[2]}${suitByName[localized[1]]}` : text;
  candidate = candidate.replace(/^([CDHS])(10|[2-9AJQK])$/, "$2$1");
  return /^(10|[2-9AJQK])([CDHS])$/.test(candidate) && STACK.includes(candidate) ? candidate : null;
}
export function parseLookup(input) {
  const text = String(input ?? "").trim();
  if (/^\d{1,2}$/.test(text)) {
    const position = Number(text);
    return position >= 1 && position <= 52 ? { type: "position", position, card: cardAt(position) } : null;
  }
  const card = normalizeCard(text);
  return card ? { type: "card", card, position: positionOf(card) } : null;
}
export function wrapPosition(position) { return ((position - 1) % 52 + 52) % 52 + 1; }
export function neighbors(position, radius = 3) {
  return Array.from({ length: radius * 2 + 1 }, (_, i) => {
    const offset = i - radius;
    return { position: wrapPosition(position + offset), card: cardAt(wrapPosition(position + offset)), offset };
  });
}
export function validateStack(stack = STACK) {
  const expected = new Set(RANKS.flatMap(rank => Object.keys(SUITS).map(suit => `${rank}${suit}`)));
  return stack.length === 52 && new Set(stack).size === 52 && stack.every(card => expected.has(card)) && expected.size === 52;
}
export function calculatedPatterns(position) {
  const card = cardAt(position);
  if (!card) return [];
  const rank = card.slice(0, -1);
  const matches = STACK.map((value, i) => value.slice(0, -1) === rank ? i + 1 : null).filter(Boolean);
  const distance = (a, b) => Math.min((b - a + 52) % 52, (a - b + 52) % 52);
  const labels = [];
  if (Number(rank) === position || (rank === "A" && position === 1) || (rank === "J" && position === 11) || (rank === "Q" && position === 12) || (rank === "K" && position === 13)) labels.push("位置數字與牌面點數相同（A=1，J=11，Q=12，K=13）");
  labels.push(`同點數牌位置：${matches.join("、")}；循環距離：${matches.filter(p => p !== position).map(p => `${p}（${distance(position, p)}）`).join("、") || "—"}`);
  return labels;
}
export function nearestAnchor(position, anchors = []) {
  if (!Number.isInteger(position) || position < 1 || position > 52 || !anchors.length) return null;
  return anchors.map(anchor => {
    const forward = (position - anchor + 52) % 52, backward = (anchor - position + 52) % 52;
    return { anchor, direction: forward <= backward ? "往前" : "往後", distance: Math.min(forward, backward) };
  }).sort((a, b) => a.distance - b.distance)[0];
}
