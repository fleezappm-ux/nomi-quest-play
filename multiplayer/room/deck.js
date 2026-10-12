// Titles and outcomes follow game-src/catalog.json and cards.js at v0.6.49.
export const cards = {
 ten: {title:'10秒ジャスト', rule:'時計を見ずに10秒を狙ってSTOP。10秒から最も遠い人が対象。同率は全員。'},
 buttons: {title:'そのボタン、押して大丈夫？',rule:'今回の担当が謎ボタンを1つ選ぶ。中身は回避・自分が対象・全員が対象。配置は毎回シャッフル。'},
 reaction: {title:'ドキドキしてんじゃねーよ！',rule:'色ではなく形がハートのものをタップ（青いハートも正解）。最速の人はお助けを獲得、最遅・失敗の人はDRINK＋1。早押し・違う形・3秒無反応は失敗。全員失敗ならお助けなし。'},
 battery: {title:'充電マウント合戦！', rule:'今の充電残量を入力。全員の回答後にHIGH／LOWを抽選。HIGHは最も多い人、LOWは最も少ない人。同率は全員対象。'}
};
export function drawCard(random=Math.random) {return ['ten','battery','buttons','reaction'][Math.min(3,Math.floor(random()*4))];}
export function drawDirection(random=Math.random) {return random()<0.5?'HIGH':'LOW';}
export function targetsFor(card, results, direction) {
 const entries=Object.entries(results);
 const values=entries.map(([,value])=>card==='ten'?Math.abs(value-10000):value);
 const edge=card==='battery'&&direction==='LOW'?Math.min(...values):Math.max(...values);
 return entries.filter(([,value])=>(card==='ten'?Math.abs(value-10000):value)===edge).map(([uid])=>uid);
}

export function shuffleButtons(random=Math.random){const a=[0,1,2];for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

export function drinkAward(state,uid,players){if(state.phase!=='results')return 0;if(state.card==='buttons'){const actor=state.order[(state.round-1)%state.order.length];return state.buttonOutcome===2||state.buttonOutcome===1&&uid===actor?1:0;}return targetsFor(state.card||'ten',state.results,state.direction).includes(uid)?1:0;}

// Items follow game-src/core.js at v0.6.49. Trial 0.9 only lets the barrier act; cute and angel are carried but not usable yet.
export const items={
 barrier:{icon:'🛡️',name:'バリア',desc:'今回のDRINKを1回だけ完全回避。',usable:true},
 cute:{icon:'🥺',name:'可愛いだけじゃダメですか？',desc:'ミッション・王様の指示を1回パス。このテストではまだ使えません。',usable:false},
 angel:{icon:'👼',name:'天使の分け前',desc:'DRINKが＋2以上のとき＋1に減らす。このテストではまだ使えません。',usable:false}
};
export const itemKinds=Object.keys(items);
export function drawItem(random=Math.random){return itemKinds[Math.min(itemKinds.length-1,Math.floor(random()*itemKinds.length))];}
// base: DRINK from drinkAward. choice: 'use' | 'skip' | undefined. barrierSlot/usedSlot: slot keys or undefined.
// Returns {amount,spend} to record now, or null while the player still has to choose.
export function decideCredit({base,barrierSlot,usedSlot,choice}){
 if(usedSlot!==undefined)return{amount:0,spend:null};
 if(base===0)return{amount:0,spend:null};
 if(barrierSlot===undefined)return{amount:base,spend:null};
 if(choice==='use')return{amount:0,spend:barrierSlot};
 if(choice==='skip')return{amount:base,spend:null};
 return null;
}

// Reaction card: answers are milliseconds (0-2999); 3000 means failed (too early, wrong shape, or timeout).
export const REACTION_FAIL=3000;
export function winnersFor(results){
 const valid=Object.entries(results||{}).filter(([,v])=>typeof v==='number'&&v<REACTION_FAIL);
 if(!valid.length)return [];
 const best=Math.min(...valid.map(([,v])=>v));
 return valid.filter(([,v])=>v===best).map(([uid])=>uid);
}
