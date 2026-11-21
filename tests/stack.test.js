import test from "node:test";
import assert from "node:assert/strict";
import { STACK, cardAt, positionOf, normalizeCard, parseLookup, wrapPosition, neighbors, validateStack, calculatedPatterns, nearestAnchor } from "../data/stack.js";

test("固定牌序包含完整且不重複的 52 張牌", () => assert.equal(validateStack(), true));
test("52 個位置皆可正確查牌並反查位置", () => {
  assert.equal(STACK.length, 52);
  for (let p = 1; p <= 52; p++) { assert.equal(positionOf(cardAt(p)), p); assert.equal(parseLookup(String(p)).card, cardAt(p)); assert.equal(parseLookup(cardAt(p)).position, p); }
});
test("52 張牌牌面唯一", () => assert.equal(new Set(STACK).size, 52));
test("搜尋解析支援英文字碼、中文花色與位置", () => {
  assert.deepEqual(parseLookup("6S"), { type: "card", card: "6S", position: STACK.indexOf("6S") + 1 });
  assert.equal(normalizeCard("黑桃6"), "6S"); assert.equal(normalizeCard("梅花 K"), "KC");
  assert.equal(parseLookup("15").card, cardAt(15)); assert.equal(parseLookup("0"), null); assert.equal(parseLookup("53"), null);
});
test("52 張牌以循環位置運算，並明確銜接首尾", () => {
  assert.equal(wrapPosition(53), 1); assert.equal(wrapPosition(0), 52); assert.equal(wrapPosition(-1), 51);
  assert.equal(neighbors(52, 1)[1].position, 52); assert.equal(neighbors(52, 1)[2].position, 1);
  assert.equal(neighbors(1, 1)[0].position, 52); assert.equal(neighbors(1, 1)[1].position, 1);
});
test("牌序線索只由指定資料計算", () => assert.ok(calculatedPatterns(1).some(text => text.includes("同點數牌位置"))));
test("錨點距離使用 52 張循環，等距時朝前", () => {
  assert.deepEqual(nearestAnchor(1,[26]),{anchor:26,direction:"往後",distance:25});
  assert.deepEqual(nearestAnchor(1,[27]),{anchor:27,direction:"往前",distance:26});
  assert.equal(nearestAnchor(0,[1]),null);
});
