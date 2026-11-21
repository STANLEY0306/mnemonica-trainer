import { STACK, cardAt, positionOf, normalizeCard, wrapPosition } from "../../data/stack.js";
import { weightedPick, reviewWeight } from "../srs.js";

export const GAME_MODES = [
  ["position", "位置 → 牌", "位置題"], ["card", "牌 → 位置", "牌面題"], ["lightning", "閃電模式", "限時反應"],
  ["neighbor", "鄰居問答", "前後推算"], ["count", "循環推算", "循環計數"], ["blank", "補空格", "序列回想"],
  ["sequence", "排序挑戰", "排列牌序"], ["recite", "背誦模式", "依序回想"], ["cut", "切牌還原", "切牌換算"], ["daily", "每日挑戰", "每日十題"]
].map(([id, name, description]) => ({ id, name, description }));

const rngFor = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const localDate = () => { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`; };

export function makeQuestion(mode, state, random = Math.random, questionIndex = 0) {
  if (mode === "daily") {
    random = rngFor(Number(localDate()) + questionIndex * 17);
    const modes = ["position", "card", "neighbor", "count", "blank", "sequence", "cut"];
    return { ...makeQuestion(modes[Math.floor(random() * modes.length)], state, random, questionIndex), daily: true };
  }
  const prefix = mode === "card" ? "card-to-position" : mode === "neighbor" ? "neighbor" : "position-to-card";
  const position = weightedPick(Array.from({ length: 52 }, (_, i) => i + 1), p => {
    if (mode === "neighbor") return Math.max(reviewWeight(state.srs[`neighbor:${wrapPosition(p-1)}`]?.box || 0), reviewWeight(state.srs[`neighbor:${wrapPosition(p+1)}`]?.box || 0));
    const item = mode === "card" ? cardAt(p) : p;
    return reviewWeight(state.srs[`${prefix}:${item}`]?.box || 0);
  }, random);
  if (mode === "card") return { mode, prompt: `「${cardAt(position)}」在第幾張？`, answer: String(position), accepted: [String(position)], key: `card-to-position:${cardAt(position)}`, cardRef: cardAt(position), kind: "card-to-position" };
  if (mode === "neighbor") { const offset = random() < .5 ? -1 : 1; const target = wrapPosition(position + offset); return { mode, prompt: `${cardAt(position)} 的${offset < 0 ? "上一" : "下一"}張是？`, answer: cardAt(target), accepted: [cardAt(target)], key: `neighbor:${target}`, cardRef: cardAt(target), kind: "neighbor" }; }
  if (mode === "count") { const offset = Math.floor(random() * 9) + 2; const dir = random() < .5 ? -1 : 1; const target = wrapPosition(position + offset * dir); return { mode, prompt: `從第 ${position} 張往${dir < 0 ? "前" : "後"}數 ${offset} 張是？`, answer: cardAt(target), accepted: [cardAt(target)], key: `position-to-card:${target}`, cardRef: cardAt(target), kind: "position-to-card" }; }
  if (mode === "blank") { const start = Math.floor(random() * 46) + 1; const missing = [2, 5]; return { mode, prompt: `連續牌序：${Array.from({ length: 7 }, (_, i) => missing.includes(i) ? "？" : cardAt(start + i)).join("　")}`, answer: `${cardAt(start + 2)} ${cardAt(start + 5)}`, accepted: [`${cardAt(start + 2)} ${cardAt(start + 5)}`, `${cardAt(start + 2)},${cardAt(start + 5)}`], key: `position-to-card:${start + 2}`, cardRef: cardAt(start+2), kind: "position-to-card" }; }
  if (mode === "sequence") { const start = Math.floor(random() * 44) + 1; const ordered = STACK.slice(start - 1, start + 4); const choices = [...ordered].sort(() => random() - .5); return { mode, prompt: `請依牌序輸入這 5 張牌（以空格分隔）：\n${choices.join("　")}`, answer: ordered.join(" "), accepted: [ordered.join(" ")], key: `position-to-card:${start}`, cardRef: ordered[0], kind: "position-to-card" }; }
  if (mode === "recite") { const start = state.stats.recitePosition || 1; return { mode, prompt: `背誦：第 ${start} 張是？`, answer: cardAt(start), accepted: [cardAt(start)], key: `position-to-card:${start}`, cardRef: cardAt(start), kind: "position-to-card", nextPosition: start === 52 ? 1 : start + 1 }; }
  if (mode === "cut") { const cut = Math.floor(random() * 51) + 1; const newFirst = cardAt(cut + 1); const ask = Math.floor(random() * 52) + 1; const newNth = cardAt(wrapPosition(cut + ask)); const answer = `${newFirst} ${newNth}`; return { mode, prompt: `切牌 ${cut} 張後，新第 1 張與新第 ${ask} 張分別是？`, answer, accepted: [answer, `${newFirst},${newNth}`], key: `position-to-card:${wrapPosition(cut+ask)}`, cardRef: newNth, kind: "position-to-card" }; }
  const p = position;
  return { mode, prompt: `第 ${p} 張是？`, answer: cardAt(p), accepted: [cardAt(p)], key: `position-to-card:${p}`, cardRef: cardAt(p), kind: "position-to-card" };
}
export function answerMatches(question, input) {
  const normalize = value => String(value).trim().toUpperCase().replace(/[，,]/g," ").replace(/\s+/g," ").split(" ").map(part=>normalizeCard(part)||part).join(" ");
  return question.accepted.some(value => normalize(value) === normalize(input));
}
export function answerChoices(question) {
  let choices;
  if (question.mode === "card") { const p = Number(question.answer); choices = [p, wrapPosition(p+7), wrapPosition(p+19), wrapPosition(p+33)].map(String); }
  else if (question.mode === "position" || question.mode === "lightning") { const p = positionOf(question.answer); choices = [p, wrapPosition(p+7), wrapPosition(p+19), wrapPosition(p+33)].map(cardAt); }
  else return question.accepted;
  return choices.sort(() => Math.random() - .5);
}
