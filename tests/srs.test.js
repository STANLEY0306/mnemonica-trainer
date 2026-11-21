import test from "node:test";
import assert from "node:assert/strict";
import { reviewCard, weightedPick, reviewWeight } from "../js/srs.js";

test("正確答案逐步升盒，錯誤答案降盒並增加 lapse", () => {
  const state={srs:{}}; let now=1000;
  assert.equal(reviewCard(state,"p1","good",now,400).box,1);
  assert.equal(reviewCard(state,"p1","good",now,300).box,2);
  const again=reviewCard(state,"p1","again",now,700);
  assert.equal(again.box,1); assert.equal(again.lapses,1); assert.equal(again.avgMs,456);
});
test("SRS 選題保留隨機權重，弱項權重較高", () => {
  assert.ok(reviewWeight(0)>reviewWeight(4));
  const values=["a","b"]; assert.equal(weightedPick(values,()=>1,()=>0.9),"b");
});
