const KEY = "mnemonica-trainer-v1";
export const freshState = () => ({
  theme: "velvet", view: "all", mnemonics: {}, places: Array.from({ length: 13 }, (_, i) => `地點 ${i + 1}`), anchors: [1, 13, 26, 39],
  srs: {}, stats: { answers: 0, correct: 0, totalMs: 0, sessions: 0, daily: {}, streak: 0, lastDay: "", misses: [] },
  settings: { sound: false, lightningSeconds: 2 }
});
function mergeState(value) {
  const defaults = freshState();
  return {
    ...defaults, ...value,
    mnemonics: { ...defaults.mnemonics, ...(value.mnemonics || {}) },
    places: Array.isArray(value.places) && value.places.length === 13 ? value.places : defaults.places,
    anchors: Array.isArray(value.anchors) ? value.anchors.filter(p => Number.isInteger(p) && p >= 1 && p <= 52) : defaults.anchors,
    srs: { ...defaults.srs, ...(value.srs || {}) },
    stats: { ...defaults.stats, ...(value.stats || {}), daily: { ...defaults.stats.daily, ...(value.stats?.daily || {}) }, misses: Array.isArray(value.stats?.misses) ? value.stats.misses : defaults.stats.misses },
    settings: { ...defaults.settings, ...(value.settings || {}) }
  };
}
export function loadState() {
  try { return mergeState(JSON.parse(localStorage.getItem(KEY) || "{}")); }
  catch { return freshState(); }
}
export function saveState(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
export function exportState(state) { return JSON.stringify({ schema: 1, exportedAt: new Date().toISOString(), state }, null, 2); }
export function importState(json) {
  const parsed = JSON.parse(json);
  const value = parsed?.schema === 1 ? parsed.state : parsed;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("檔案格式不正確");
  return mergeState(value);
}
