export const MODES = ["position-to-card", "card-to-position", "neighbor"];
export function reviewCard(state, key, grade, now = Date.now(), responseMs = 0) {
  const previous = state.srs[key] || { box: 0, due: 0, reviews: 0, lapses: 0, avgMs: 0 };
  const box = grade === "good" ? Math.min(5, previous.box + 1) : Math.max(0, previous.box - 1);
  const intervals = [0, 1, 3, 7, 14, 30];
  const next = { box, due: now + intervals[box] * 86400000, reviews: previous.reviews + 1,
    lapses: previous.lapses + (grade === "good" ? 0 : 1), avgMs: previous.reviews ? Math.round(previous.avgMs * .75 + responseMs * .25) : responseMs };
  state.srs[key] = next;
  return next;
}
export function weightedPick(items, weightFor, random = Math.random) {
  if (!items.length) return null;
  const weights = items.map(item => Math.max(0.01, weightFor(item)));
  let needle = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { needle -= weights[i]; if (needle <= 0) return items[i]; }
  return items.at(-1);
}
export function reviewWeight(box) { return 1 / (1 + Math.max(0, box)); }
