// 練習モード用のNPC。見えない画面(attachTen)を1人ずつ動かし、回答はここで自動入力する。
import {ref,set,get} from './fb.js?v=0.36';
import {attachTen} from './ten.js?v=0.36';
import {currentTurn} from './turn.js?v=0.4';
export const npcNames=['ココ','ミミ','ナナ','リリ','ユユ'];
// カードごとのNPCの回答（1人分）。undefinedなら今は答える立場ではない。
export function npcAnswer({card,isActor,isTarget,slots,others,rand=Math.random}){
 const int=n=>Math.floor(rand()*n),pick=a=>a[int(a.length)];
 switch(card){
  case 'buttons':return isActor?int(2):undefined;
  case 'mission':return isActor?(rand()<0.8?1:0):undefined;
  case 'danger':case 'king':return isActor?pick(others):isTarget?(rand()<0.7?1:0):undefined;
  case 'vote':case 'muttsuri':case 'mind':return pick(slots);
  case 'majority':return int(2);
  case 'check':return int(4);
  case 'tapking':return 15+int(45);
  case 'battery':return int(101);
  case 'reaction':return 300+int(600);
  default:return 7000+int(6000);
 }
}
const walk=n=>[n,...Array.from(n?.children||[]).flatMap(walk)];
export function attachNpcs({db,roomId,npcs,players,hostUid,message=()=>{}}){
 const base=`sessions/${roomId}`,scale=globalThis.__nqNpcMs??1;let dead=false;
 const units=npcs.map(n=>{const root=document.createElement('div');return {n,root,stop:attachTen({db:n.db||db,roomId,uid:n.uid,players,hostUid,message,root}),key:null,due:0,busy:false};});
 async function act(u){
  if(dead||u.busy)return;
  const d=u.n.db||db,st=(await get(ref(d,base+'/state'))).val();
  if(st&&!dead&&st.phase==='results'&&st.card==='check'){
   const nk=st.round+':nv';if(u.key!==nk){u.key=nk;u.due=Date.now()+(1500+Math.random()*2500)*scale;}
   if(Date.now()>=u.due&&u.nv!==st.round){u.nv=st.round;u.busy=true;try{await set(ref(d,`${base}/nv/${st.round}/${u.n.uid}`),true);}catch{}finally{u.busy=false;}}
   return;
  }
  if(!st||dead||st.phase==='results')return;
  const key=st.round+':'+st.phase;
  if(u.key!==key){u.key=key;u.due=Date.now()+(900+Math.random()*2600)*scale;}
  if(Date.now()<u.due)return;
  const uid=u.n.uid,turn=currentTurn(st,players),isActor=turn.uid===uid;
  if(st.phase==='draw'){
   if(!isActor)return;
   const draw=walk(u.root).find(c=>(c.tag==='button'||c.tagName==='BUTTON')&&String(c.textContent).includes('カードを引く'));
   if(draw&&!draw.disabled){u.busy=true;try{await draw.onclick();}finally{u.busy=false;}}
   return;
  }
  const mine=(await get(ref(d,`${base}/answers/${st.round}/${uid}`))).val();
  if(typeof mine==='number')return;
  const invite=(st.card==='danger'||st.card==='king')&&!isActor?(await get(ref(d,`${base}/answers/${st.round}/${turn.uid}`))).val():null;
  const a=invite,slot=Number(u.n.slot);
  const v=npcAnswer({card:st.card||'ten',isActor,isTarget:typeof a==='number'&&a===slot,slots:players.map(p=>Number(p.slot)),others:players.filter(p=>p.uid!==uid).map(p=>Number(p.slot))});
  if(typeof v==='number'){u.busy=true;try{await set(ref(d,`${base}/answers/${st.round}/${uid}`),v);}catch{}finally{u.busy=false;}}
 }
 const timer=setInterval(()=>{for(const u of units)act(u).catch(()=>{});},Math.max(1,500*scale));
 return {roots:units.map(u=>u.root),stop(){dead=true;clearInterval(timer);units.forEach(u=>u.stop());}};
}
