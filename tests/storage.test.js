import test from "node:test";
import assert from "node:assert/strict";
import { freshState, exportState, importState } from "../js/storage.js";

test("匯出後匯入保留自訂助記、SRS、統計與設定", () => {
  const state=freshState(); state.mnemonics["4C"]="自訂故事"; state.srs["neighbor:2"]={box:3}; state.stats.answers=5; state.stats.daily["2026-11-22"]=5; state.settings.sound=true;
  assert.deepEqual(importState(exportState(state)),state);
});
test("匯入舊版或部分資料時補齊預設欄位", () => {
  const state=importState(JSON.stringify({schema:1,state:{mnemonics:{"2H":"心形故事"}}}));
  assert.equal(state.stats.answers,0); assert.equal(state.mnemonics["2H"],"心形故事"); assert.equal(state.places.length,13);
});
