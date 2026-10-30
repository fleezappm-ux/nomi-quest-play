// 10番 GO TO HEAVEN OR HELL のルーレット画面（カジノ風）。CSSとJSだけの軽い演出（動画・画像・大量パーティクルは使わない）。
// 全員の端末が、記録された (段階・結果・種) から planSpin() で同じ動きを作る。このファイルは「見せる」だけで、通信はしない。
import {KIND,STAGES} from './roulette.js?v=pop0.70.1';

const easeOutCubic=t=>1-Math.pow(1-t,3);
const easeInOut=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const linear=t=>t;
const mk=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const vibrate=p=>{try{navigator.vibrate?.(p);}catch{}};
const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch{return false;}};
const COLORS={h1:'#e7c260',h2:'#f6e3a1',m1:'#a3182a',m2:'#16161a',h:['#e7c260','#f6e3a1'],m:['#a3182a','#16161a'],m5:'#5c0a14'};
const slotColor=(key,i)=>{
 const p=i%2?1:0;
 if(key==='m5')return COLORS.m5;
 if(key==='heaven')return COLORS.h[p?0:1];
 if(key==='hell')return COLORS.m[p];
 return KIND[key].c==='h'?COLORS.h[p]:COLORS.m[p];
};

export function createRoulette({sound=true}={}){
 if(globalThis.__nqRlStub){ // 画面なしの動作確認用（tools/roulette-live.test.mjs）
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  return{el:document.createElement('div'),spin:async()=>{await wait(globalThis.__nqRlMs??10);return null;},idle(){},showFinal(){},setWho(){},setText(){},setSound(){},unlock(){},busy:false,stop(){}};
 }
 const RM=reduced(),SPEED=RM?0.35:1;
 let soundOn=sound,AC=null,lastTick=0,cur=0,lastIdx=-1,dead=false,spinning=false,confettiT=null;
 // ---- 部品 ----
 const el=mk('div','rl'),telop=mk('div','rl-telop'),whoL=mk('span','',''),whoB=mk('b','','—'),tag=mk('span','rl-tag','');
 telop.append(mk('span','','今回回しているのは'),whoB,tag);
 const stageBox=mk('div','rl-stage'),dial=mk('div','rl-dial'),rim=mk('div','rl-rim'),bulbs=mk('div'),pointer=mk('div','rl-pointer'),wheel=mk('div','rl-wheel'),labels=mk('div'),gloss=mk('div','rl-gloss'),cap=mk('div','rl-cap','GO'),burst=mk('div','rl-burst');
 for(let i=0;i<20;i++){const b=mk('span','rl-bulb');b.style.setProperty('--a',i*18+'deg');b.style.animationDelay=i%2?'-.8s':'0s';bulbs.append(b);}
 wheel.append(labels);dial.append(rim,bulbs,pointer,wheel,gloss,cap,burst);stageBox.append(dial);
 const result=mk('div','rl-result'),resSub=mk('span','rl-sub',''),resBig=mk('span','rl-big','');result.append(resSub,resBig);
 el.append(telop,stageBox,result);
 void whoL;

 // ---- 音（WebAudioで合成。音声ファイルは使わない）----
 function ac(){
  if(!soundOn)return null;
  try{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();}if(AC.state==='suspended')AC.resume();return AC;}catch{return null;}
 }
 function beep(f,d,type,vol,delay,slide){
  const c=ac();if(!c)return;
  try{
   const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+(delay||0);
   o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
   g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.005);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
   o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+0.02);
  }catch{}
 }
 const sTick=()=>{const n=performance.now();if(n-lastTick<40)return;lastTick=n;beep(1500*(0.95+Math.random()*0.1),0.025,'square',0.025);};
 const sClack=v=>beep(520,0.06,'triangle',v||0.06,0,260);
 const sWin=big=>{const w=[784,988,1175,1568];for(let i=0;i<(big?4:2);i++)beep(w[i],0.22,'triangle',0.08,i*0.09);if(big)beep(w[3]*1.5,0.5,'sine',0.06,0.4);};
 const sLose=big=>{const l=[220,185,147];l.forEach((f,i)=>beep(f,0.3,'sawtooth',0.07,i*0.14,f*0.8));if(big)beep(70,0.8,'sine',0.14,0.1,40);};
 const sDrum=()=>{for(let i=0;i<8;i++)beep(110,0.05,'triangle',0.05,i*0.11);};
 const sHeart=()=>{beep(70,0.14,'sine',0.12,0,48);beep(70,0.14,'sine',0.09,0.17,48);};

 // ---- 針と回転 ----
 const setAngle=a=>{cur=a;wheel.style.transform=`rotate(${a}deg)`;};
 const pointedIndex=()=>Math.floor((((-cur)%360)+360)%360/36)%10;
 function kick(){pointer.style.transform='translateX(-50%) rotate(-18deg)';requestAnimationFrame(()=>requestAnimationFrame(()=>{pointer.style.transform='translateX(-50%)';}));}
 function wheelApply(a){setAngle(a);const i=pointedIndex();if(i!==lastIdx){lastIdx=i;kick();sTick();}}
 function chase(on){[...bulbs.children].forEach((b,i)=>{b.style.animationDelay=on?-(i*0.025)+'s':(i%2?'-.8s':'0s');});}
 function runSegs(segs,apply=wheelApply){
  return new Promise(res=>{
   let i=0,done=false;
   const total=segs.reduce((s,x)=>s+Math.max(1,x.d*SPEED),0),dog=setTimeout(()=>{if(!done){done=true;res();}},total+4000);
   const fin=()=>{if(!done){done=true;clearTimeout(dog);res();}};
   function next(){
    if(dead||done){fin();return;}
    if(i>=segs.length){fin();return;}
    const s=segs[i++],d=Math.max(1,s.d*SPEED),t0=performance.now();
    if(s.vib)vibrate(s.vib);if(s.drum)sDrum();
    function frame(now){
     if(dead||done){fin();return;}
     const p=Math.min(1,(now-t0)/d),a=s.fn?s.fn(p):s.from+(s.to-s.from)*(s.ease||linear)(p);
     apply(a,p);
     if(p<1)requestAnimationFrame(frame);else next();
    }
    requestAnimationFrame(frame);
   }
   next();
  });
 }

 // ---- 枠の組み立て ----
 function buildWheel(list){
  const stops=[];labels.replaceChildren();
  list.forEach((key,i)=>{
   const K=KIND[key];stops.push(`${slotColor(key,i)} ${i*36}deg ${(i+1)*36}deg`);
   const s=mk('div','rl-slot '+K.c);s.dataset.i=i;s.style.setProperty('--a',(i+0.5)*36+'deg');
   s.append(mk('span','t',K.t),mk('span','v',K.v));labels.append(s);
  });
  wheel.style.background=`conic-gradient(from 0deg,${stops.join(',')})`;
 }
 function setResult(sub,big,cls,pop,isBig){
  resSub.textContent=sub;resBig.textContent=big;resBig.className='rl-big'+(cls?' '+cls:'');
  result.classList.remove('pop','bigwin','shake');void result.offsetWidth;
  if(pop)result.classList.add('pop');if(isBig)result.classList.add('bigwin');
 }
 function confetti(n){
  const cols=['#f6dc82','#e9c46a','#ffffff','#e23a4b'];let h='';
  for(let i=0;i<n;i++){const ang=Math.random()*Math.PI*2,dist=70+Math.random()*120;
   h+=`<i style="--c:${cols[i%cols.length]};--dx:${Math.round(Math.cos(ang)*dist)}px;--dy:${Math.round(Math.sin(ang)*dist-30)}px;--rot:${Math.round(Math.random()*720-360)}deg;animation-delay:${(Math.random()*0.12).toFixed(2)}s"></i>`;}
  burst.innerHTML=h;clearTimeout(confettiT);confettiT=setTimeout(()=>{burst.innerHTML='';},1700);
 }
 function celebrate(K){
  dial.classList.remove('good','bad','spinning');chase(false);
  if(K.good){dial.classList.add('good');confetti(K.big?34:12);sWin(!!K.big);}
  else{dial.classList.add('bad');sLose(!!K.big);if(K.big){el.classList.remove('doomfx');void el.offsetWidth;el.classList.add('doomfx');}result.classList.remove('shake');void result.offsetWidth;result.classList.add('shake');}
  setTimeout(()=>{if(!dead)dial.classList.remove('good','bad');},K.big?2600:1500);
 }

 // ---- 止まり方 ----
 function buildSegs(plan){
  const c=cur%360;setAngle(c);
  const jit=(plan.pattern==='normal'||plan.pattern==='slam')?plan.jit:0;
  const base=-((plan.idx+0.5)*36)+jit,delta=(((base-c)%360)+360)%360,final=c+5*360+delta;
  switch(plan.pattern){
   case 'normal':return[{d:4300,from:c,to:final,ease:easeOutCubic}];
   case 'slam':return[{d:1800,from:c,to:final,ease:linear},{d:320,fn:p=>final+Math.sin(p*Math.PI*3)*3*(1-p),vib:[40]}];
   case 'burble':{const mid=final+18;return[{d:3500,from:c,to:mid,ease:easeOutCubic},{d:1500,fn:p=>mid+Math.sin(p*Math.PI*9)*5*(1-p*0.4),vib:[60,40,60,40,60,40,90],drum:true},{d:450,from:mid,to:final,ease:easeInOut}];}
   case 'near':{const pre=final-36;return[{d:3800,from:c,to:pre,ease:easeOutCubic},{d:750,fn:()=>pre,vib:[30],drum:true},{d:650,from:pre,to:final,ease:easeInOut}];}
   default:{const over=final+60;return[{d:3000,from:c,to:over,ease:easeOutCubic},{d:1200,from:over,to:final-6,ease:easeInOut,vib:[50]},{d:300,from:final-6,to:final,ease:easeInOut}];}
  }
 }
 const wait=ms=>new Promise(r=>setTimeout(r,ms));

 // ---- 初級・中級 ----
 async function spinStage(stage,plan,who){
  spinning=true;tag.textContent=STAGES[stage].tag;whoB.textContent=who;cap.textContent='GO';
  dial.classList.remove('ballmode','good','bad');dial.classList.add('spinning');chase(true);
  buildWheel(plan.list);dial.classList.remove('shuffle');void dial.offsetWidth;dial.classList.add('shuffle');
  setResult('回転中…','','',false,false);vibrate([30]);lastIdx=pointedIndex();
  await wait(RM?50:380);
  if(dead)return null;
  await runSegs(buildSegs(plan));
  if(dead)return null;
  const pi=pointedIndex(),key=plan.list[pi],K=KIND[key],hit=labels.querySelector(`[data-i="${pi}"]`);
  if(hit)hit.classList.add('hit');
  vibrate(K.good?[80]:[120,60,120]);
  setResult(`${who} さん ${STAGES[stage].tag} の結果`,K.txt,K.good?'good':'bad',true,!!K.big);
  celebrate(K);spinning=false;return key;
 }

 // ---- 最終：玉が転がるルーレット ----
 async function spinFinal(plan,who){
  spinning=true;tag.textContent=STAGES[3].tag;whoB.textContent=who;cap.textContent='';
  dial.classList.remove('good','bad');dial.classList.add('ballmode','spinning');chase(true);
  stageBox.classList.add('cam');
  buildWheel(plan.list);dial.classList.remove('shuffle');void dial.offsetWidth;dial.classList.add('shuffle');
  const ball=mk('div','rl-ball');labels.append(ball);
  setResult('FINAL','玉が転がります…','',false,false);
  const idx=plan.idx,variant=plan.variant,T=9800,T1=7600;
  const R=(wheel.clientWidth||300)/2,rOut=R*0.93,rIn=R*0.78,rng=rOut-rIn;
  const targetRel=(idx+0.5)*36,startWheel=cur%360;setAngle(startWheel);
  const wheelEnd=startWheel+540,bnd=targetRel+18,rA=variant==='tease'?bnd:targetRel-24,relStart=rA+360*7;
  const nB=plan.nB,BH=[0.30,0.08,0.022].slice(0,nB),BD=[260,170,110].slice(0,nB),tFall=5000,fallDur=450;
  let lastB=-1,lastHeart=0,vibDone=false,bounceSeen=-1;
  function relAt(t){
   if(t<T1){const pp=t/T1;return rA+(relStart-rA)*Math.pow(1-pp,3);}
   if(variant==='tease'){
    if(t<8800){const tt=(t-T1)/1200;return bnd+3.2*Math.exp(-2.6*tt)*Math.sin(2*Math.PI*1.7*tt);}
    return bnd+(targetRel-bnd)*easeInOut(Math.min(1,(t-8800)/600));
   }
   if(t<8200){const t2=(t-T1)/600;return rA+1.5*Math.exp(-2*t2)*Math.sin(2*Math.PI*1.2*t2);}
   return rA+(targetRel-rA)*easeInOut(Math.min(1,(t-8200)/1100));
  }
  function radAt(t){
   if(t<tFall)return rOut;
   if(t<tFall+fallDur){const u=(t-tFall)/fallDur;return rOut+(rIn-rOut)*u*u;}
   let tt=t-(tFall+fallDur);
   for(let i=0;i<BH.length;i++){if(tt<BD[i]){const uu=tt/BD[i];return rIn+BH[i]*rng*(1-(2*uu-1)*(2*uu-1));}tt-=BD[i];}
   if(variant==='over'&&t>8650&&t<8950){const u2=(t-8650)/300;return rIn+0.05*rng*(1-(2*u2-1)*(2*u2-1));}
   if(t>9000)return rIn-R*0.025*easeOutCubic(Math.min(1,(t-9000)/500));
   return rIn;
  }
  function bounceSound(t){
   const tt=t-(tFall+fallDur);let acc=0;
   if(t>=tFall+fallDur&&bounceSeen<0){bounceSeen=0;sClack(0.08);}
   for(let i=0;i<BD.length;i++){acc+=BD[i];if(tt>=acc&&bounceSeen===i){bounceSeen=i+1;sClack(0.07-0.02*i);}}
  }
  const zoomAt=t=>RM||t<4200?0:t<6200?easeInOut((t-4200)/2000):1;
  vibrate([40,30,40]);sDrum();
  function place(p){
   const t=p*T,e=easeOutCubic(t/T);
   setAngle(startWheel+(wheelEnd-startWheel)*e);
   const rel=relAt(t),rad=radAt(t);bounceSound(t);
   ball.style.transform=`translate(-50%,-50%) rotate(${rel}deg) translateY(${-rad}px)`;
   const bi=Math.floor((((rel%360)+360)%360)/36);if(bi!==lastB){lastB=bi;sTick();}
   if(t>T1&&t<8700){const n=performance.now();if(n-lastHeart>700){lastHeart=n;sHeart();vibrate([50,110,50]);}}
   if(!vibDone&&t>T1){vibDone=true;vibrate([40,60,40]);}
   const z=zoomAt(t),s=1+1.2*z,camRad=t<tFall?rOut:t<tFall+800?rOut+(rIn-rOut)*easeInOut((t-tFall)/800):rIn;
   const w=(rel+cur)*Math.PI/180,x=camRad*Math.sin(w),y=-camRad*Math.cos(w);
   dial.style.transform=z>0?`translate(${(-s*x*z).toFixed(1)}px,${(-s*y*z).toFixed(1)}px) scale(${s.toFixed(3)})`:'none';
  }
  await wait(RM?50:380);
  if(dead)return null;
  await runSegs([{d:T,fn:p=>p}],p=>place(p));
  if(dead)return null;
  place(1);
  const key=plan.list[idx],K=KIND[key],hit=labels.querySelector(`[data-i="${idx}"]`);
  if(hit)hit.classList.add('hit');
  vibrate(K.good?[100,50,100]:[200,80,200,80,300]);
  await wait(RM?100:900);
  if(dead)return null;
  dial.style.transition='transform .9s cubic-bezier(.3,.7,.2,1)';dial.style.transform='none';
  setResult(`${who} さん FINAL の結果`,K.txt,K.good?'good':'bad',true,true);
  celebrate(K);
  await wait(950);
  dial.style.transition='';stageBox.classList.remove('cam');spinning=false;
  return key;
 }

 function idle(who){
  if(spinning)return;
  whoB.textContent=who||'—';tag.textContent='';cap.textContent='GO';
  dial.classList.remove('good','bad','spinning','ballmode');chase(false);dial.style.transition='';dial.style.transform='none';stageBox.classList.remove('cam');
  if(!labels.children.length)buildWheel(STAGES[1].order.slice());
 }
 // 確定した結果を表示（回さずに）
 function showFinal(who,key,fromFinal){
  tag.textContent='確定';dial.classList.remove('spinning');chase(false);
  if(key==='skip'||!KIND[key]){setResult(`${who} さん`,'やらない（何も起きません）','',true,false);return;}
  const K=KIND[key];setResult(`${who} さんの結果（確定）`,K.txt,K.good?'good':'bad',!fromFinal,!!K.big);
 }
 function setWho(name){whoB.textContent=name;}
 function setText(sub,big){setResult(sub,big,'',false,false);}
 return{
  el,spin:(stage,plan,who)=>stage===3?spinFinal(plan,who):spinStage(stage,plan,who),idle,showFinal,setWho,setText,
  setSound(on){soundOn=!!on;if(on){ac();sWin(false);}},
  unlock(){ac();},
  get busy(){return spinning;},
  stop(){dead=true;clearTimeout(confettiT);}
 };
}
