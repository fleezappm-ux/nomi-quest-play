// 10番「GO TO HEAVEN OR HELL」（ルーレット三段勝負・2026-10-27 確定）の純粋な計算ロジック。画面や通信には触らない。
// 回す人の端末が「結果の名前 o」と「演出の種 a」を記録に書き、全員の端末が (stage,o,a) から同じ見た目を作る。
import {rngFrom} from './draw.js?v=pop0.70.0';

// ---- 調整用の設定（実機で調整するのでここにまとめる）----
export const RL_CONFIG={
 MIX:{spread:0.5,scatter:0.3,cluster:0.2}, // 枠の並べ方の割合（均等にバラバラ5割・混ぜる3割・固める2割）
 ASK_SEC:10,        // 「もう一度回しますか？」の制限時間（時間切れ＝やめる）
 START_SEC:15,      // 「やる／やらない」の制限時間（時間切れ＝やらない）
 HOLD_MS:3200,      // 確定してから次の人に移るまでの間
 HOST_IDLE_MS:45000 // 何も起きないままこれだけ経ったら、ホストがその人を確定扱いにする
};

// 結果の種類。c: 'h'=お助け系（良い）/ 'm'=メーター系（悪い）。
export const KIND={
 h1:{c:'h',t:'お助け',v:'+1',txt:'お助けカード +1 GET!',good:true},
 h2:{c:'h',t:'お助け',v:'+2',txt:'お助けカード +2 GET!',good:true},
 h3:{c:'h',t:'お助け',v:'+3',txt:'お助けカード +3 GET!',good:true,big:true},
 m1:{c:'m',t:'メーター',v:'+1',txt:'ショットメーター +1',good:false},
 m2:{c:'m',t:'メーター',v:'+2',txt:'ショットメーター +2',good:false},
 m3:{c:'m',t:'メーター',v:'+3',txt:'ショットメーター +3',good:false,big:true},
 m5:{c:'m',t:'メーター',v:'+5',txt:'ショットメーター +5 ライム!',good:false,big:true},
 heaven:{c:'h',t:'天国',v:'☆',txt:'天国! お助けカード +3 GET!',good:true,big:true},
 hell:{c:'m',t:'地獄',v:'×',txt:'地獄! ショットメーター +5 ライム!',good:false,big:true}
};
// 段階ごとの「見た目の10枠（固める並び）」と、止まる確率（％）
export const STAGES={
 1:{tag:'① 初級',order:['h1','h1','h1','h2','h2','h3','m1','m1','m1','m5'],w:{h1:38.1,h2:15.2,h3:7.6,m1:38.1,m5:1},ask:'もう一度回しますか？',again:'チャンスアップ！ もう一度回す'},
 2:{tag:'② 中級',order:['h1','h1','h1','h2','h3','m1','m1','m1','m2','m3'],w:{h1:30,h2:10,h3:5,m1:35,m2:15,m3:5},ask:'ラストチャンス、もう一度回しますか？',again:'ラストチャンス！ もう一度回す'},
 3:{tag:'FINAL',order:['heaven','heaven','heaven','heaven','hell','hell','hell','hell','hell','hell'],w:{heaven:40,hell:60}}
};

// Firebase の results に入れる数字：0=やらない／1〜3=お助け/11〜15=メーター/23=天国/25=地獄
export const CODE={skip:0,h1:1,h2:2,h3:3,m1:11,m2:12,m3:13,m5:15,heaven:23,hell:25};
export const KEY_OF_CODE=Object.fromEntries(Object.entries(CODE).map(([k,v])=>[v,k]));
export const itemsOfCode=c=>c>=1&&c<=3?c:c===23?3:0;
export const meterOfCode=c=>c>=11&&c<=15?c-10:c===25?5:0;
export const codeOf=o=>o in CODE?CODE[o]:0;
export const validOutcome=(stage,o)=>!!STAGES[stage]&&Object.prototype.hasOwnProperty.call(STAGES[stage].w,o);
export const ALL_OUTCOMES=Object.keys(CODE);

// ---- 抽選 ----
export function pickWeighted(w,rand=Math.random){
 const ks=Object.keys(w);let sum=0;for(const k of ks)sum+=w[k];
 let r=rand()*sum;for(const k of ks){r-=w[k];if(r<=0)return k;}
 return ks[ks.length-1];
}
export const pickOutcome=(stage,rand=Math.random)=>pickWeighted(STAGES[stage].w,rand);
export const newArt=(rand=Math.random)=>Math.floor(rand()*999999)+1; // 演出の種

// ---- 演出の計画（種 a から全端末で同じになる）----
function shuffle(a,rng){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
// 良い枠を10枠の中で等間隔に置く
function spreadLayout(base,rng){
 const goods=shuffle(base.filter(k=>KIND[k].c==='h'),rng),bads=shuffle(base.filter(k=>KIND[k].c==='m'),rng);
 const n=base.length,g=goods.length,out=new Array(n),isGood=new Array(n).fill(false);
 for(let i=0;i<g;i++){let pos=Math.floor((i+0.5)*n/g+(rng()*0.6-0.3));pos=Math.max(0,Math.min(n-1,pos));while(isGood[pos])pos=(pos+1)%n;isGood[pos]=true;}
 const off=Math.floor(rng()*n);let gi=0,bi=0;
 for(let i=0;i<n;i++)out[(i+off)%n]=isGood[i]?goods[gi++]:bads[bi++];
 return out;
}
export function layoutMode(rng,mix=RL_CONFIG.MIX){
 const r=rng();return r<mix.spread?'spread':r<mix.spread+mix.scatter?'scatter':'cluster';
}
export function layoutFor(stage,rng,mix=RL_CONFIG.MIX){
 const base=STAGES[stage].order,m=layoutMode(rng,mix);
 if(m==='cluster')return base.slice();
 if(m==='spread')return spreadLayout(base,rng);
 return shuffle(base,rng);
}
export function choosePattern(key,rng){
 if(KIND[key].big){const a=['burble','near','reverse'];return a[Math.min(a.length-1,Math.floor(rng()*a.length))];}
 const a=['normal','slam','normal','near'];return a[Math.min(a.length-1,Math.floor(rng()*a.length))];
}
// -> {list:[10個のキー], idx:止まる枠, pattern, jit:ずれ(度), variant:'tease'|'over', nB:弾む回数}
export function planSpin(stage,outcome,art,mix=RL_CONFIG.MIX){
 const rng=rngFrom('rl:'+stage+':'+art);
 const list=layoutFor(stage,rng,mix),idxs=[];
 list.forEach((k,i)=>{if(k===outcome)idxs.push(i);});
 const idx=idxs.length?idxs[Math.min(idxs.length-1,Math.floor(rng()*idxs.length))]:0;
 const pattern=stage===3?'ball':choosePattern(outcome,rng);
 return{list,idx,pattern,jit:(rng()*18-9),variant:rng()<0.5?'tease':'over',nB:1+Math.floor(rng()*3)};
}

// ---- 順番と進み具合 ----
// 担当(カードを引いた人)から、ターン順に回す
export function rlOrder(order,actor){
 const o=Array.isArray(order)?order:Object.values(order||{}),i=o.indexOf(actor);
 return i<0?o.slice():[...o.slice(i),...o.slice(0,i)];
}
// rec: {0:{k,o,a},1:...,2:...,d:'h2'|'skip'} を、段階順の配列にする
export function chainOf(rec){
 const out=[];
 for(const n of ['0','1','2']){const x=rec?.[n];if(x&&typeof x.o==='string'&&typeof x.a==='number')out.push({k:Number(x.k)||Number(n)+1,o:x.o,a:x.a});}
 return out;
}
export const finalOf=rec=>typeof rec?.d==='string'?rec.d:null;
// いま回す(決める)人：まだ確定していない最初の人。全員確定なら null
export function curSpinner(seq,rl){
 for(const u of seq)if(finalOf(rl?.[u])===null)return u;
 return null;
}
// 確定していない人の「今の結果」：最後に回した結果。回していなければ 'skip'
export function currentChoice(rec){const c=chainOf(rec);return c.length?c[c.length-1].o:'skip';}
export function resultsOfRl(seq,rl){
 const out={};for(const u of seq)out[u]=codeOf(finalOf(rl?.[u])??currentChoice(rl?.[u]));
 return out;
}
