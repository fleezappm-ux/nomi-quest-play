// 新しいカードの出し方（0.68 土台）。端末の記憶は使わず、「seed＋クール番号＋これまでに出たカードの記録」だけで
// どの端末でも同じ結果になる純粋な関数だけを置く。画面や通信には触らない。
// 仕様：Notion「カード出現率」「実装指示書① 土台」（確定 2026-10-26）

// ---- 調整用の設定値（実機で調整するのでここにまとめる）----
export const DRAW_CONFIG={
 COOL_TURNS:8,        // 1クール＝8ターン（ドリンクタイムは数えない）
 SOLO_CHANCE:0.7,     // 仮：1人用系がそのクールに出る確率
 PARTY_CHANCE:1.0,    // 仮：パーティー系(各カード)がそのクールに出る確率
 SPECIAL_CHANCE:0.5,  // 確定：特殊カードがそのクールに出る確率
 NO_SPECIAL_FIRST_TURNS:2, // 確定：ゲーム開始から最初の2ターンは特殊カードなし
 MIND_POOL_SIZE:25    // 確定：5番(mind)は、ゲーム開始時にこの個数だけお題を選ぶ
};
// 区分（今回はこの対応で固定）
export const SOLO_GROUP=['tapking','ten','battery'];
export const SPECIAL_GROUP=['roulette','mission','king']; // 10番は新ルール(ルーレット三段勝負)。旧danger(誘う)は出さない
export const PARTY_GROUP=['reaction','grid'];
export const VOTE_KINDS=['vote','muttsuri','majority','mind'];

// ---- 乱数（seed固定）----
export function hashStr(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function rngFrom(str){let a=hashStr(str)||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function shuffled(arr,rng){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const pickOne=(arr,rng)=>arr[Math.min(arr.length-1,Math.floor(rng()*arr.length))];

// ---- ゲーム開始時に1回だけ決めるもの ----
export function newSeed(random=Math.random){return Math.floor(random()*2147483646)+1;}
// 5番(mind)のお題リストから size 個を選ぶ（番号の昇順で返す。原本は削らない）
export function pickMindPool(seed,total,size=DRAW_CONFIG.MIND_POOL_SIZE){
 const idx=Array.from({length:total},(_,i)=>i),n=Math.min(size,total);
 return shuffled(idx,rngFrom(seed+':mindpool')).slice(0,n).sort((a,b)=>a-b);
}
// Firebaseには文字列「3,5,7」で入れる（ルールを短くするため）
export const mindToText=a=>a.join(',');
export const mindFromText=t=>typeof t==='string'&&t?t.split(',').map(Number).filter(Number.isInteger):[];

// ---- クールの計画 ----
// 1クール分(8ターン)の並び。'vote' / 'solo' / 'party:reaction' / 'party:grid' / 'special'
function planOne(seed,c,prevLastSpecial){
 const C=DRAW_CONFIG,rng=rngFrom(seed+':cool'+c),slots=Array(C.COOL_TURNS).fill('vote');
 const free=()=>slots.map((s,i)=>i).filter(i=>slots[i]==='vote');
 // 乱数の消費順は固定（変えると全端末で結果が変わる）
 const rs=rng(),ps=rng(),rr=rng(),pb=rng(),rsolo=rng(),psolo=rng(),rparty1=rng(),rparty2=rng();
 if(rs<C.SPECIAL_CHANCE){
  const ok=free().filter(i=>!(c===0&&i<C.NO_SPECIAL_FIRST_TURNS)&&!(prevLastSpecial&&i===0));
  if(ok.length)slots[ok[Math.min(ok.length-1,Math.floor(ps*ok.length))]]='special';
 }
 if(rr<C.PARTY_CHANCE){const f=free();slots[f[Math.min(f.length-1,Math.floor(rparty1*f.length))]]='party:reaction';}
 if(pb<C.PARTY_CHANCE){const f=free();if(f.length)slots[f[Math.min(f.length-1,Math.floor(rparty2*f.length))]]='party:grid';}
 if(rsolo<C.SOLO_CHANCE){const f=free();if(f.length)slots[f[Math.min(f.length-1,Math.floor(psolo*f.length))]]='solo';}
 return slots;
}
const planCache=new Map();
export function planCool(seed,c){
 const key=seed+':'+c;if(planCache.has(key))return planCache.get(key);
 let prev=null,out;
 for(let i=0;i<=c;i++){const k=seed+':'+i;out=planCache.get(k)||planOne(seed,i,prev?prev[prev.length-1]==='special':false);planCache.set(k,out);prev=out;}
 if(planCache.size>2000)planCache.clear();
 return out;
}

// ---- お題の山（投票系まとめて1つ）----
// token は 'vote:12' のように「カード名:お題番号」。sizes={vote,muttsuri,majority}、mind は選ばれた番号の配列。
export function voteTokens(sizes,mind){
 const t=[];
 for(const k of ['vote','muttsuri','majority'])for(let i=0;i<(sizes[k]||0);i++)t.push(k+':'+i);
 for(const i of mind)t.push('mind:'+i);
 return t;
}
export const isVoteKey=k=>typeof k==='string'&&VOTE_KINDS.includes(k.split(':')[0]);
export function parseKey(k){const [card,p]=String(k).split(':');return p===undefined?{card}:{card,prompt:Number(p)};}

// ---- 1ターン分を決める ----
// history: {ラウンド番号: 'ten' / 'vote:12' ...} この回より前に出た分だけ
// ctx: {seed, mind:[番号], sizes:{vote,muttsuri,majority}, round, cool:c, pos(1〜8), actorDidMission:boolean}
// 戻り値: {key, kind}  kind は計画の区分
export function chooseCard(history,ctx){
 const C=DRAW_CONFIG,{seed,round}=ctx;
 const plan=planCool(seed,ctx.cool),slot=plan[ctx.pos-1]??'vote';
 const rounds=Object.keys(history).map(Number).filter(r=>r<round).sort((a,b)=>a-b);
 const rng=rngFrom(seed+':r'+round);
 const cycle=group=>{ // 3枚が全部出るまで重複なし。全部出たらリセット
  let used=new Set();
  for(const r of rounds){const c=parseKey(history[r]).card;if(group.includes(c)){used.add(c);if(used.size===group.length)used=new Set();}}
  return group.filter(c=>!used.has(c));
 };
 if(slot==='solo'){return{key:pickOne(cycle(SOLO_GROUP),rng),kind:'solo'};}
 if(slot==='special'){
  // 全員がキス顔を終えたら、キス顔は山札から消える（missionAll）
  const grp=ctx.missionAll?SPECIAL_GROUP.filter(c=>c!=='mission'):SPECIAL_GROUP;
  let left=cycle(grp);
  if(ctx.actorDidMission){const alt=left.filter(c=>c!=='mission');left=alt.length?alt:grp.filter(c=>c!=='mission');}
  return{key:pickOne(left,rng),kind:'special'};
 }
 if(slot.startsWith('party:'))return{key:slot.slice(6),kind:'party'};
 // 投票系：山から次のお題を取る
 const tokens=voteTokens(ctx.sizes,ctx.mind);
 if(!tokens.length)return{key:'vote:0',kind:'vote'};
 // 出たお題の記録から、「いま何周目で、どれが使用済みか」を数える（全部使い切ったら次の周でシャッフルし直し）
 const inPool=new Set(tokens);let epoch=0,used=new Set();
 for(const r of rounds){const k=history[r];if(!isVoteKey(k))continue;if(used.size>=tokens.length){epoch++;used=new Set();}if(inPool.has(k))used.add(k);}
 if(used.size>=tokens.length){epoch++;used=new Set();}
 const order=shuffled(tokens,rngFrom(seed+':vote'+epoch));
 let cand=order.filter(t=>!used.has(t));
 // 多数派で「答えが割れずに飛ばしたお題」は、この端末が見たぶんを使用済みにする（最初の周だけ。通信は増えない）
 if(epoch===0&&ctx.usedExtra&&ctx.usedExtra.length){const ex=new Set(ctx.usedExtra),c2=cand.filter(t=>!ex.has(t));if(c2.length)cand=c2;}
 return{key:cand[0],kind:'vote'};
}
// これまでの記録から「このアクターがすでにキス顔を終えたか」。終えた回だけ md（deck/md/<ラウンド>）に1が記録される
// （「やらない」「やり直し」で終わった回は記録されず、また選ばれうる）。md を渡さない場合は、引いた回すべてを終えたものとして数える（旧動作）。
export function didMission(history,order,actor,beforeRound,md){
 const n=order.length;
 for(const [r,k] of Object.entries(history)){const rr=Number(r);if(rr<beforeRound&&parseKey(k).card==='mission'&&order[(rr-1)%n]===actor&&(!md||md[rr]===1))return true;}
 return false;
}

// 王様の命令：王様に見せる命令4つ（カテゴリーごとに1つ）。seed＋ラウンド＋回（0=最初の王様／1=譲られた王様）から決まるので、
// 再読み込みしても引き直しにならず、どの端末でも同じ。順番はシャッフル（位置でカテゴリーが分からないように）。
export function pickKingOrders(seed,round,attempt,cats){
 const rng=rngFrom(seed+':king'+round+':'+attempt);
 return shuffled(cats.map(([a,b])=>a+Math.min(b-a-1,Math.floor(rng()*(b-a)))),rng);
}
