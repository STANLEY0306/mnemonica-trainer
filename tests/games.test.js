import test from "node:test";
import assert from "node:assert/strict";
import { makeQuestion, answerMatches, answerChoices, GAME_MODES } from "../js/games/questions.js";
import { freshState } from "../js/storage.js";
import { STACK, cardAt, wrapPosition } from "../data/stack.js";

test("每一種練習模式都有唯一答案且正解可判定", () => {
  const state=freshState();
  for(const {id} of GAME_MODES){
    const q=makeQuestion(id,state,()=>0.31,2);
    assert.ok(q.prompt); assert.ok(q.accepted.length>=1); assert.ok(answerMatches(q,q.answer),`${id} answer should match`);
    assert.equal(new Set(q.accepted).size,q.accepted.length);
    assert.equal(answerMatches(q,`wrong-${id}`),false);
    if(["card","position","lightning"].includes(q.mode)) { const choices=answerChoices(q);assert.ok(choices.includes(q.answer));assert.equal(new Set(choices).size,4); }
  }
});
test("位置與牌面問答涵蓋完整映射", () => {
  const state=freshState();
  for(let p=1;p<=52;p++){
    const position=makeQuestion("position",state,()=> (p-.5)/52);
    assert.equal(position.answer,cardAt(p));
    const card=makeQuestion("card",state,()=> (p-.5)/52);
    assert.equal(Number(card.answer),p);
  }
  assert.equal(STACK.length,52);
});
test("切牌後第 1 張與新第 N 張皆依 52 張循環計算", () => {
  const state=freshState();
  for(let i=0;i<100;i++){
    const q=makeQuestion("cut",state,()=> (i%51)/51);
    const cut=Number(q.prompt.match(/切牌 (\d+)/)[1]);
    const nth=Number(q.prompt.match(/新第 (\d+) 張分別/)[1]);
    const [first,atN]=q.answer.split(" ");
    assert.equal(first,cardAt(wrapPosition(cut+1)));
    assert.equal(atN,cardAt(wrapPosition(cut+nth)));
  }
});
test("每日挑戰同一天同題序可重現", () => {
  const state=freshState(); assert.deepEqual(makeQuestion("daily",state,Math.random,4),makeQuestion("daily",state,Math.random,4));
});
