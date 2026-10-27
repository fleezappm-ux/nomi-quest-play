// 練習モード用のNPC。見えない画面(attachTen)を1人ずつ動かし、回答はここで自動入力する。
import {ref,set,get,serverTimestamp} from './fb.js?v=pop0.69';
import {attachTen} from './ten.js?v=pop0.69';
import {currentTurn} from './turn.js?v=pop0.69';
import {rlOrder,chainOf as rlChain,curSpinner as rlCur,pickOutcome as rlPick,newArt as rlArt} from './roulette.js?v=pop0.69';
import {replay as gridReplay,CELLS as GCELLS,PASS as GPASS} from './grid.js?v=pop0.69';
const devMode=typeof location!=='undefined'&&new URL(location.href).searchParams.get('dev')==='1';
export const npcNames=['ココ','ミミ','ナナ','リリ','ユユ'];
// カードごとのNPCの回答（1人分）。undefinedなら今は答える立場ではない。
export function npcAnswer({card,isActor,isTarget,slots,others,actorAns,rand=Math.random}){
 const int=n=>Math.floor(rand()*n),pick=a=>a[int(a.length)];
 switch(card){
  case 'buttons':return isActor?int(2):undefined;
  case 'mission':return isActor?(rand()<0.8?1:0):actorAns===1?pick([1,1,1,2,2,3]):undefined;
  case 'danger':case 'king':return isActor?pick(others):isTarget?(rand()<0.7?1:0):undefined;
  case 'vote':case 'muttsuri':case 'mind':return pick(slots);
  case 'majority':return int(2);
  case 'check':case 'rest':return int(4);
  case 'tapking':return 15+int(45);
  case 'battery':return int(101);
  case 'reaction':return 300+int(600);
  default:return 7000+int(6000);
 }
}
const walk=n=>[n,...Array.from(n?.children||[]).flatMap(walk)];
export function attachNpcs({db,roomId,npcs,players,hostUid,message=()=>{}}){
 const base=`sessions/${roomId}`,scale=globalThis.__nqNpcMs??1;let dead=false;
 const units=npcs.map(n=>{const root=document.createElement('div');return {n,root,stop:attachTen({db:n.db||db,roomId,uid:n.uid,players,hostUid,message,root,bot:true}),key:null,due:0,busy:false};});
 async function act(u){
  if(dead||u.busy)return;
  const d=u.n.db||db,st=(await get(ref(d,base+'/state'))).val();
  if(st&&!dead&&st.phase==='results'&&st.card==='check'){
   const nk=st.round+':nv';if(u.key!==nk){u.key=nk;u.due=Date.now()+(1500+Math.random()*2500)*scale;}
   if(Date.now()>=u.due&&u.nv!==st.round){u.nv=st.round;u.busy=true;try{await set(ref(d,`${base}/nv/${st.round}/${u.n.uid}`),true);}catch{}finally{u.busy=false;}}
   return;
  }
  if(!st||dead||st.phase==='results')return;
  if(st.card==='grid'){ // マス目：自分の番なら、少し待って押す／回す
   const o=(await get(ref(d,`${base}/gm/${st.round}/lg`))).val()||{},recs=Object.entries(o).filter(([,x])=>x&&typeof x.u==='string').map(([k,x])=>({k:Number(k),u:x.u,c:x.c,r:x.r})).sort((a,b)=>a.k-b.k);
   const g=gridReplay(recs,Object.values(st.order||[]),st.actor);
   if(g.over||g.cur!==u.n.uid){u.gk=null;return;}
   const key=st.round+':'+recs.length;if(u.gk!==key){u.gk=key;u.due=Date.now()+(900+Math.random()*2500)*scale;u.sent=0;return;}
   if(Date.now()<u.due||u.busy||(u.sent&&Date.now()-u.sent<6000))return;
   const free=[...Array(GCELLS).keys()].filter(c=>!g.pressed[c]),c=g.cnt>=1&&(Math.random()<0.45||!free.length)?GPASS:free[Math.floor(Math.random()*free.length)];
   u.busy=true;try{const cur=(await get(ref(d,`${base}/gm/${st.round}/rq/${u.n.uid}`))).val();await set(ref(d,`${base}/gm/${st.round}/rq/${u.n.uid}`),{n:(Number(cur?.n)||0)+1,c});u.sent=Date.now();}catch{}finally{u.busy=false;}
   return;
  }
  if(st.card==='reaction'){ // 爆弾：持っていたら、少し待ってからランダムな人へ渡す
   if(st.phase!=='measuring')return;
   const o=(await get(ref(d,`${base}/bm/${st.round}/p`))).val()||{},recs=Object.entries(o).filter(([,x])=>x&&typeof x.u==='string').map(([k,x])=>({n:Number(k),u:x.u})).sort((a,b)=>a.n-b.n),last=recs.at(-1);
   if(!last||last.u!==u.n.uid){u.bk=null;return;}
   const key=st.round+':'+last.n;if(u.bk!==key){u.bk=key;u.due=Date.now()+(900+Math.random()*3500)*scale;return;}
   if(Date.now()<u.due||u.busy)return;
   const others=players.filter(p=>p.uid!==u.n.uid);if(!others.length)return;
   u.busy=true;try{await set(ref(d,`${base}/bm/${st.round}/p/${last.n+1}`),{u:others[Math.floor(Math.random()*others.length)].uid,t:serverTimestamp(),k:last.n});}catch{}finally{u.busy=false;}
   return;
  }
  if(st.card==='roulette'){ // ルーレット：自分の番なら、少し待って回す／もう一度回す／確定する
   const o=(await get(ref(d,`${base}/rl/${st.round}`))).val()||{},cur=rlCur(rlOrder(st.order,st.actor),o);
   if(cur!==u.n.uid){u.rk=null;return;}
   const ch=rlChain(o[u.n.uid]),n=ch.length,key=st.round+':'+n;
   if(u.rk!==key){u.rk=key;u.due=Date.now()+(n===0?4500+Math.random()*2500:n===3?12500:7500+Math.random()*2000)*scale;return;}
   if(Date.now()<u.due||u.busy)return;
   const p=`${base}/rl/${st.round}/${u.n.uid}`;u.busy=true;
   try{
    if(n===0)await(Math.random()<0.2?set(ref(d,p+'/d'),'skip'):set(ref(d,p+'/0'),{k:1,o:rlPick(1),a:rlArt()}));
    else if(n<3&&Math.random()<(n===1?0.5:0.35))await set(ref(d,`${p}/${n}`),{k:n+1,o:rlPick(n+1),a:rlArt()});
    else await set(ref(d,p+'/d'),ch[n-1].o);
   }catch{}finally{u.busy=false;}
   return;
  }
  const key=st.round+':'+st.phase;
  if(u.key!==key){u.key=key;u.due=Date.now()+(900+Math.random()*2600)*scale;}
  if(Date.now()<u.due)return;
  const uid=u.n.uid,turn0=currentTurn(st,players),turn=st.card==='king'&&st.ky&&st.actor?{...turn0,uid:st.actor}:turn0,isActor=turn.uid===uid;
  if(st.phase==='draw'){
   if(!isActor||devMode)return;
   const draw=walk(u.root).find(c=>(c.tag==='button'||c.tagName==='BUTTON')&&String(c.textContent).includes('カードを引く'));
   if(draw&&!draw.disabled){u.busy=true;try{await draw.onclick();}finally{u.busy=false;}}
   return;
  }
  const mine=(await get(ref(d,`${base}/answers/${st.round}/${uid}`))).val(),mk=st.card==='majority'?(st.mk||0):0;
  if(typeof mine==='number'&&Math.floor(mine/2)>=mk)return;
  const invite=(st.card==='danger'||st.card==='king'||st.card==='mission')&&!isActor?(await get(ref(d,`${base}/answers/${st.round}/${turn.uid}`))).val():null;
  const a=invite,slot=Number(u.n.slot);
  if(st.card==='king'&&isActor&&typeof mine!=='number'){try{await set(ref(d,`${base}/kg/${st.round}/o`),Math.floor(Math.random()*54));}catch{}}
  const v=npcAnswer({card:st.card||'ten',isActor,actorAns:a,isTarget:st.card!=='mission'&&typeof a==='number'&&a===slot,slots:players.map(p=>Number(p.slot)),others:players.filter(p=>p.uid!==uid).map(p=>Number(p.slot))});
  if(typeof v==='number'){u.busy=true;try{await set(ref(d,`${base}/answers/${st.round}/${uid}`),st.card==='majority'?2*mk+v:v);}catch{}finally{u.busy=false;}}
 }
 const timer=setInterval(()=>{for(const u of units)act(u).catch(()=>{});},Math.max(1,500*scale));
 return {roots:units.map(u=>u.root),stop(){dead=true;clearInterval(timer);units.forEach(u=>u.stop());}};
}
