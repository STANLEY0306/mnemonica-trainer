import { STACK, SUITS, cardAt, positionOf, parseLookup, neighbors, wrapPosition, calculatedPatterns, nearestAnchor, validateStack } from "../data/stack.js";
import { DEFAULT_MNEMONICS, TECHNIQUES } from "../data/mnemonics.js";
import { loadState, saveState, freshState, exportState, importState } from "./storage.js";
import { reviewCard } from "./srs.js";
import { GAME_MODES, makeQuestion, answerMatches, answerChoices } from "./games/questions.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
let state = loadState();
let selected = 1;
let highlighted = [];
let game = null;
let toastTimer;

if (!validateStack()) throw new Error("牌序資料未通過完整性檢查");
document.documentElement.dataset.theme = state.theme || "velvet";

const save = () => saveState(state);
const suitFor = card => SUITS[card.slice(-1)];
function cardFace(card) { const rank = card.slice(0, -1), suit = suitFor(card); return `${rank}${suit.symbol}`; }
function announce(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.remove("hidden"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.add("hidden"), 2400); }
function renderGrid() {
  const grid = $("#deck-grid"); grid.replaceChildren();
  const view = state.view || "all", heat = $("#heatmap").value === "heat";
  for (let row = 0; row < 4; row++) {
    const label = document.createElement("div"); label.className = "row-label"; label.textContent = `${row * 13 + 1}–${row * 13 + 13}`; grid.append(label);
    for (let col = 0; col < 13; col++) {
      const position = row * 13 + col + 1, card = cardAt(position), suit = suitFor(card);
      const button = document.createElement("button"); button.type = "button";
      button.className = `playing-card ${suit.color === "red" ? "red" : ""} ${view === "suit" ? `suit-${card.slice(-1).toLowerCase()}` : ""} ${view === "position" ? "position-only" : view === "face" ? "face-only" : ""} ${position === selected ? "selected" : ""} ${highlighted.includes(position) ? "near" : ""}`;
      const box = state.srs[`position-to-card:${position}`]?.box || 0;
      if (heat) button.classList.add(box >= 4 ? "mastered" : box >= 2 ? "learning" : "new-card");
      button.setAttribute("aria-label", view === "position" ? `第 ${position} 張` : view === "face" ? `${suit.zh}${card.slice(0,-1)}，位置隱藏` : `第 ${position} 張：${suit.zh}${card.slice(0,-1)}，${suit.color === "red" ? "紅色" : "黑色"}`);
      button.innerHTML = `<span class="pos">${position}</span><span class="rank">${card.slice(0,-1)}</span><span class="suit" aria-hidden="true">${suit.symbol}</span>`;
      button.addEventListener("click", () => showCard(position)); grid.append(button);
    }
  }
}
function showCard(position, focusGrid = false) {
  selected = wrapPosition(position); highlighted = neighbors(selected).map(n => n.position); renderGrid();
  const card = cardAt(selected), suit = suitFor(card), detail = $("#detail"); detail.classList.remove("empty");
  const around = neighbors(selected);
  const memo = state.mnemonics[card] ?? DEFAULT_MNEMONICS[card] ?? "";
  detail.innerHTML = `<button class="icon-button drawer-close" aria-label="關閉牌面資訊">×</button><div class="eyebrow">POSITION ${String(selected).padStart(2,"0")}</div><div class="detail-card ${suit.color === "red" ? "red" : ""}" aria-label="${suit.zh}${card.slice(0,-1)}">${cardFace(card)}</div><h2 style="text-align:center;margin:.1rem">${suit.zh}${card.slice(0,-1)} · ${card}</h2><p class="muted" style="text-align:center">${suit.color === "red" ? "紅色花色" : "黑色花色"} ${suit.symbol}　·　牌面 ${card.slice(0,-1)}${suit.symbol}</p><h3>前後各三張</h3><div class="neighbor-list">${around.map(n=>`<button class="neighbor-chip ${n.offset===0?"current":""}" data-position="${n.position}" aria-label="第 ${n.position} 張 ${cardFace(n.card)}">${n.position} ${cardFace(n.card)}${(selected===52&&n.offset===1)||(selected===1&&n.offset===-1)?" ↻":""}</button>`).join("")}</div><h3>我的助記畫面 <span class="tag">建議，可自行修改</span></h3><label class="sr-only" for="memo-edit">${card} 助記畫面</label><textarea class="field memo" id="memo-edit" placeholder="寫下你自己的圖像、人物或故事…">${escapeHtml(memo)}</textarea><div class="toolbar" style="justify-content:flex-end;margin-top:.5rem"><button class="button small" id="memo-save">儲存助記</button></div><h3>由牌序計算的線索</h3><ul class="rule-list">${calculatedPatterns(selected).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul><p class="muted">循環：第 52 張下一張是第 1 張；第 1 張上一張是第 52 張。</p>`;
  detail.querySelector(".drawer-close").addEventListener("click",()=>detail.classList.remove("open"));
  $$(".neighbor-chip",detail).forEach(btn=>btn.addEventListener("click",()=>showCard(Number(btn.dataset.position))));
  $("#memo-save",detail).addEventListener("click",()=>{state.mnemonics[card]=$("#memo-edit",detail).value;save();announce("助記已儲存");});
  if (matchMedia("(max-width: 900px)").matches) detail.classList.add("open");
  if (focusGrid) $("#section-overview").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
}
function escapeHtml(text) { return String(text).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function lookup(input) { const result = parseLookup(input); if (!result) { announce("請輸入 1–52 的位置或有效牌面，例如 6S、黑桃6。"); return null; } showCard(result.position, true); return result; }

function renderLearning() {
  const chunkSize = Number($("#chunk-size").value || 4), container = $("#study-chunks"); container.replaceChildren();
  for (let start=1; start<=52; start+=chunkSize) {
    const cards=STACK.slice(start-1,start-1+chunkSize), end=start+cards.length-1;
    const article=document.createElement("article"); article.className="study-card";
    article.innerHTML=`<div class="eyebrow">CARD ${String(start).padStart(2,"0")}–${end}</div><h3>第 ${start}–${end} 張</h3><p class="muted">${cards.map(cardFace).join("　→　")}</p><label class="sr-only" for="chunk-memo-${start}">第 ${start} 到 ${end} 張的故事</label><textarea class="field memo" id="chunk-memo-${start}" placeholder="寫下這一段的連續畫面或故事…">${escapeHtml(state.mnemonics[`chunk-${start}`] || "")}</textarea><div class="toolbar" style="margin-top:.5rem"><button class="button small" data-save-chunk="${start}">儲存故事</button><button class="button primary small" data-study-chunk="${start}" data-end="${end}">開始回想</button></div>`;
    container.append(article);
  }
  $$("[data-save-chunk]").forEach(btn=>btn.onclick=()=>{state.mnemonics[`chunk-${btn.dataset.saveChunk}`]=$("#chunk-memo-"+btn.dataset.saveChunk).value;save();announce("段落故事已儲存");});
  $$("[data-study-chunk]").forEach(btn=>btn.onclick=()=>startStudy(Number(btn.dataset.saveChunk),Number(btn.dataset.end)));
  $("#techniques").innerHTML=TECHNIQUES.map(t=>`<article class="technique"><h3>${t.title}</h3><p class="muted">${t.text}</p></article>`).join("");
  $("#palace-list").innerHTML=state.places.map((place,i)=>`<label class="study-card"><span class="eyebrow">LOCUS ${String(i+1).padStart(2,"0")} · ${i*4+1}–${Math.min(52,i*4+4)}</span><input class="field place-input" data-place="${i}" value="${escapeHtml(place)}" aria-label="記憶宮殿地點 ${i+1}"></label>`).join("");
  $$(".place-input").forEach(el=>el.onchange=()=>{state.places[Number(el.dataset.place)]=el.value;save();});
  $("#anchor-list").innerHTML=Array.from({length:52},(_,i)=>i+1).map(p=>`<label class="tag"><input type="checkbox" data-anchor="${p}" ${state.anchors.includes(p)?"checked":""}>${p} ${cardFace(cardAt(p))}</label>`).join("");
  $$ ("[data-anchor]").forEach(el=>el.onchange=()=>{const p=Number(el.dataset.anchor);state.anchors=el.checked?[...new Set([...state.anchors,p])].sort((a,b)=>a-b):state.anchors.filter(x=>x!==p);save();});
  const updateAnchorDistance=()=>{const p=Number($("#anchor-position").value),nearest=nearestAnchor(p,state.anchors);$("#anchor-distance").textContent=nearest?`離錨點 ${nearest.anchor} ${nearest.direction} ${nearest.distance} 張`:"請先選錨點";};
  const anchorInput=document.createElement("label"); anchorInput.className="toolbar"; anchorInput.innerHTML='<span>查位置</span><input class="field" id="anchor-position" type="number" min="1" max="52" value="25"><span id="anchor-distance" class="tag"></span>'; $("#anchor-list").append(anchorInput);
  $("#anchor-position").oninput=updateAnchorDistance; updateAnchorDistance();
}
function startStudy(start,end) { const area=$("#game-area"); area.classList.remove("hidden"); let revealed=false; const cards=STACK.slice(start-1,end); area.innerHTML=`<div class="eyebrow">STUDY ${start}–${end}</div><div class="study-prompt">${cards.map(cardFace).join("　→　")}</div><p class="muted">看一遍後遮住牌面，試著依序回想。</p><button class="button" id="study-hide">遮住牌面</button><div id="study-cover" class="study-answer hidden">　？？？？？？　</div><button class="button primary" id="study-reveal">核對答案</button><div class="toolbar" style="justify-content:center;margin-top:1rem"><button class="button" id="study-done">完成這段</button></div>`;
  $("#study-hide").onclick=()=>{$(".study-prompt",area).style.visibility="hidden";$("#study-cover",area).classList.remove("hidden");revealed=true;};
  $("#study-reveal").onclick=()=>{if(!revealed)$(".study-prompt",area).style.visibility="hidden";$("#study-cover",area).textContent=cards.map(cardFace).join("　→　");$("#study-cover",area).classList.remove("hidden");};
  $("#study-done").onclick=()=>{area.classList.add("hidden");announce("完成一段練習，記得稍後再回想一次。");}; area.scrollIntoView({behavior:"smooth",block:"center"});
}
function renderGameMenu() { $("#game-menu").innerHTML=GAME_MODES.map(m=>`<article class="technique"><div class="eyebrow">PRACTICE MODE</div><h3>${m.name}</h3><p class="muted">${m.description}</p><button class="button primary small" data-game="${m.id}">開始</button></article>`).join(""); $$("[data-game]").forEach(btn=>btn.onclick=()=>startGame(btn.dataset.game)); }
function startGame(mode) { game={mode,round:0,total:10,correct:0,combo:0,bestCombo:0,misses:[],started:performance.now(),question:null,questionStart:0}; game.timer=setInterval(()=>{const clock=$("#elapsed-clock");if(clock&&game)clock.textContent=formatElapsed(performance.now()-game.started);},250); $("#game-area").classList.remove("hidden"); nextQuestion(); }
function formatElapsed(ms) { const seconds=Math.floor(ms/1000);return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`; }
function nextQuestion() {
  if(game.round>=game.total) return finishGame();
  const area=$("#game-area"); game.question=makeQuestion(game.mode,state,Math.random,game.round); game.questionStart=performance.now();
  area.innerHTML=`<div class="eyebrow">${GAME_MODES.find(x=>x.id===game.mode).name} · ${game.round+1}/${game.total} 題　·　用時 <span id="elapsed-clock">${formatElapsed(performance.now()-game.started)}</span></div><div class="progress-track"><span style="width:${game.round/game.total*100}%"></span></div><div class="study-prompt">${escapeHtml(game.question.prompt)}</div><p class="muted">連對 ${game.combo} 題　·　累計答對 ${game.correct}</p><div class="game-choices" id="game-choices"></div><form id="game-answer-form"><label class="sr-only" for="game-answer">輸入答案</label><input class="field" id="game-answer" autocomplete="off" placeholder="輸入牌面或位置…"><button class="button primary">送出答案</button></form><div class="feedback" id="feedback" aria-live="polite"></div><button id="game-skip" class="button small">略過</button><p class="muted">${game.question.note || "答題紀錄會儲存在本機。"}</p>`;
  const answerField=$("#game-answer");
  const candidates=["card","position","lightning"].includes(game.question.mode) ? answerChoices(game.question) : [];
  $("#game-choices").innerHTML=candidates.map(value=>`<button class="game-choice ${/[HD]$/.test(value)?"red":""}" data-answer="${value}">${game.question.mode==="card"?value:cardFace(value)}</button>`).join("");
  $$(".game-choice").forEach(btn=>btn.onclick=()=>submitAnswer(btn.dataset.answer));
  $("#game-answer-form").onsubmit=e=>{e.preventDefault();submitAnswer(answerField.value);};
  $("#game-skip").onclick=()=>submitAnswer("");
  answerField.focus();
  if(game.mode==="lightning"){const secs=Number(state.settings.lightningSeconds||2);game.lightningTimer=setTimeout(()=>{if(game.question)submitAnswer("");},secs*1000);}
}
function playSound(correct) {
  if (!state.settings.sound) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  const context = new AudioCtor(), oscillator = context.createOscillator(), gain = context.createGain();
  oscillator.type = "sine"; oscillator.frequency.value = correct ? 620 : 170; gain.gain.setValueAtTime(.08, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .16);
  oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .17); oscillator.onended=()=>context.close();
}
function submitAnswer(value) {
  if(!game?.question) return; clearTimeout(game.lightningTimer);
  const q=game.question, elapsed=Math.max(0,Math.round(performance.now()-game.questionStart)), correct=answerMatches(q,value);
  playSound(correct);
  if(correct){game.correct++;game.combo++;game.bestCombo=Math.max(game.bestCombo,game.combo);reviewCard(state,q.key,"good",Date.now(),elapsed);$("#feedback").className="feedback good";$("#feedback").textContent=`正確！${q.answer}　·　${elapsed} ms`;} else {game.combo=0;game.misses.push({prompt:q.prompt,given:value||"未作答",answer:q.answer,key:q.key,mode:q.kind});reviewCard(state,q.key,"again",Date.now(),elapsed);state.stats.misses.push({card:q.cardRef||"4C",at:Date.now(),prompt:q.prompt});$("#feedback").className="feedback bad";$("#feedback").textContent=`答案：${q.answer}`;}
  state.stats.answers++;if(correct)state.stats.correct++;state.stats.totalMs+=elapsed;const day=new Date(),dayKey=`${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,"0")}-${String(day.getDate()).padStart(2,"0")}`;state.stats.daily[dayKey]=(state.stats.daily[dayKey]||0)+1;
  if(game.mode==="recite"&&correct)state.stats.recitePosition=q.nextPosition;
  save();game.question=null;game.round++;
  setTimeout(()=>{if(game)nextQuestion();},650);
}
function finishGame() {
  const finished=game; clearInterval(finished.timer); game=null; state.stats.sessions++;
  if(finished.mode==="daily") { const d=new Date(), today=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`, prior=new Date(d.getFullYear(),d.getMonth(),d.getDate()-1), yesterday=`${prior.getFullYear()}-${String(prior.getMonth()+1).padStart(2,"0")}-${String(prior.getDate()).padStart(2,"0")}`; if(state.stats.lastDay!==today){state.stats.streak=state.stats.lastDay===yesterday?(state.stats.streak||0)+1:1;state.stats.lastDay=today;} }
  const area=$("#game-area");
  const mistakes=finished.misses.length?finished.misses.map(m=>`<li>${escapeHtml(m.prompt)}　答：${escapeHtml(m.given)}　正解：<b>${escapeHtml(m.answer)}</b></li>`).join(""):"<li>本次沒有錯題，做得很好。</li>";
  area.innerHTML=`<div class="eyebrow">SESSION COMPLETE</div><h2>這輪完成了。</h2><div class="stats-grid"><article class="stat-card"><div class="muted">正確率</div><div class="stat-value">${Math.round(finished.correct/finished.total*100)}%</div></article><article class="stat-card"><div class="muted">答對題數</div><div class="stat-value">${finished.correct}/${finished.total}</div></article><article class="stat-card"><div class="muted">最高連對</div><div class="stat-value">${finished.bestCombo}</div></article><article class="stat-card"><div class="muted">用時</div><div class="stat-value">${Math.round((performance.now()-finished.started)/1000)}s</div></article></div><h3>錯題回顧</h3><ul class="rule-list">${mistakes}</ul><button class="button primary" id="again-game">再練一輪</button> <button class="button" id="hide-game">收起</button>`;
  $("#again-game").onclick=()=>startGame(finished.mode);$("#hide-game").onclick=()=>area.classList.add("hidden");save();renderStats();
}
function renderStats() {
  const s=state.stats, avg=s.answers?Math.round(s.totalMs/s.answers):0, mastery=Object.entries(state.srs).filter(([key,v])=>key.startsWith("position-to-card:")&&v.box>=4).length;
  $("#stats-grid").innerHTML=`<article class="stat-card"><div class="muted">答題次數</div><div class="stat-value">${s.answers}</div></article><article class="stat-card"><div class="muted">累積正確率</div><div class="stat-value">${s.answers?Math.round(s.correct/s.answers*100):0}%</div></article><article class="stat-card"><div class="muted">平均反應</div><div class="stat-value">${avg}ms</div></article><article class="stat-card"><div class="muted">熟練牌數</div><div class="stat-value">${mastery}/52</div></article><article class="stat-card"><div class="muted">每日挑戰連續天數</div><div class="stat-value">${s.streak||0}</div></article>`;
  const boxes=Array.from({length:6},(_,i)=>Object.values(state.srs).filter(v=>v.box===i).length);
  $("#box-chart").innerHTML=boxes.map((v,i)=>`<div class="bar-line"><span>第 ${i} 盒</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,v/52*100)}%"></div></div><span>${v}</span></div>`).join("");
  const daily=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;return [key,s.daily[key]||0];});
  const dailyMax=Math.max(1,...daily.map(([,v])=>v));
  $("#daily-chart").innerHTML=daily.map(([day,count])=>`<div class="bar-line"><span>${day.slice(5)}</span><div class="bar-track"><div class="bar-fill" style="width:${count/dailyMax*100}%"></div></div><span>${count}</span></div>`).join("");
  const misses={};for(const m of s.misses) misses[m.card]=(misses[m.card]||0)+1;
  $("#miss-list").innerHTML=Object.entries(misses).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([card,count])=>`<article class="study-card"><b>${cardFace(card)}</b><span class="muted">　${count} 次</span></article>`).join("")||"<p class='muted'>完成練習後，錯題統計會出現在這裡。</p>";
}
function setTab(tab) { $$("[data-tab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===tab))); $$(".section").forEach(s=>s.classList.toggle("active",s.id===`section-${tab}`)); if(tab==="stats")renderStats();if(tab==="learn")renderLearning(); }
function openQuick() { $("#quick-modal").classList.remove("hidden");$("#quick-input").value="";$("#quick-result").innerHTML="";setTimeout(()=>$("#quick-input").focus(),20); }
function closeQuick() { $("#quick-modal").classList.add("hidden");$("#quick-open").focus(); }

$$('[data-tab]').forEach(btn=>btn.addEventListener("click",()=>setTab(btn.dataset.tab)));
$$('[data-view]').forEach(btn=>btn.addEventListener("click",()=>{state.view=btn.dataset.view;save();$$('[data-view]').forEach(x=>x.classList.toggle("active",x===btn));renderGrid();}));
$("#heatmap").onchange=renderGrid;
$("#search-go").onclick=()=>lookup($("#search").value);
$("#search").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();lookup(e.currentTarget.value);}};
$("#chunk-size").onchange=renderLearning;
$("#sound-setting").onchange=e=>{state.settings.sound=e.target.checked;save();};
$("#lightning-setting").onchange=e=>{state.settings.lightningSeconds=Number(e.target.value);save();};
$("#quick-open").onclick=openQuick;$("#quick-floating").onclick=openQuick;$("#quick-close").onclick=closeQuick;$("#quick-cancel").onclick=closeQuick;
$("#quick-modal").onclick=e=>{if(e.target===$("#quick-modal"))closeQuick();};
$("#quick-form").onsubmit=e=>{e.preventDefault();const result=lookup($("#quick-input").value);if(result){$("#quick-result").innerHTML=`<p class="tag">第 ${result.position} 張：${cardFace(result.card)}</p>`;closeQuick();}};
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!$("#quick-modal").classList.contains("hidden"))closeQuick();else $("#detail").classList.remove("open");}if(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();openQuick();}});
$("#theme-cycle").onclick=()=>{const themes=["velvet","ivory","contrast"],next=themes[(themes.indexOf(state.theme)+1)%themes.length];state.theme=next;document.documentElement.dataset.theme=next;save();announce(`已切換：${{velvet:"絨布夜",ivory:"象牙日",contrast:"高對比"}[next]}`);};
$("#export-data").onclick=()=>{const blob=new Blob([exportState(state)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`mnemonica-progress-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);};
$("#import-file").onchange=async e=>{try{state=importState(await e.target.files[0].text());save();document.documentElement.dataset.theme=state.theme;renderGrid();renderLearning();renderStats();announce("資料匯入完成");}catch(err){announce(`匯入失敗：${err.message}`);}finally{e.target.value="";}};
$("#reset-data").onclick=()=>{if(confirm("要清除本機的牌序助記、練習紀錄與設定嗎？此動作無法復原。")){state=freshState();save();renderGrid();renderLearning();renderStats();announce("本機資料已重設");}};

$("#sound-setting").checked=state.settings.sound;
$("#lightning-setting").value=String(state.settings.lightningSeconds || 2);
renderGrid();renderGameMenu();renderStats();
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
