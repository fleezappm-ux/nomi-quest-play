// 鬼ごっこ（ミニゲーム）の画面と進行。ホストの端末が進行役で、手は各自が隠したまま送る。
import {ref,set,get,update,onValue,runTransaction} from './fb.js?v=0.27';
import {newGame,pickOni,rollRoulette,applyBuff,resolveTurn,advance,botMove,mustMove,frozen,oniSteps,reach,players as playersOf,runners,aliveRunners,arr,key,N,EXIT,TIME,ODDS,ITEM_ICON} from './onilogic.js?v=0.27';
const AV=['🍻','🌙','⭐','🌈','🔥','🎲'],ARW={U:'↑',D:'↓',L:'←',R:'→',S:'停止'};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function attachOni({db,roomId,uid,players,hostUid,message,root:given}){
 const root=given||document.getElementById('tenGame'),host=uid===hostUid,base=`oni/${roomId}`;
 const names=Object.fromEntries(players.map(p=>[p.uid,p.name])),slotOf=Object.fromEntries(players.map(p=>[p.uid,Number(p.slot)]));
 const uids=players.map(p=>p.uid),scale=globalThis.__nqOniMs??1;
 let state=null,choice=null,own=null,movesNow={},dead=false,path=[],left=TIME,timer=null,sent=false,gseen=null,lotteryUntil=0,lotteryTimer=null,rollSeen=null,rollUntil=0,rollTimer=null,hostTimers=[],ownStop,movesStop,movesTurn=null,advancing=false,reelTimer=null,tickKey=null;
 const stops=[];
 const nm=u=>names[u]||'確認中';
 const T=(fn,ms)=>{const t=setTimeout(()=>{if(!dead)fn();},ms*scale);hostTimers.push(t);return t;};
 // ---------- host: progress the game ----------
 async function hostStart(){
  const oni=pickOni(uids);
  await runTransaction(ref(db,base+'/state'),s=>s?undefined:newGame(uids,oni),{applyLocally:false}).catch(()=>message('ゲーム接続ルールの反映が必要です。'));
 }
 const toPhase=(turn,from,fn)=>runTransaction(ref(db,base+'/state'),s=>s&&s.turn===turn&&s.phase===from?fn(s):undefined,{applyLocally:false});
 function hostTick(){
  if(dead||!host||!state)return;
  const s=state;
  if(s.phase==='choose'&&choice&&!advancing){
   advancing=true;
   if(choice==='spin'){const kind=rollRoulette();toPhase(s.turn,'choose',x=>({...applyBuff(x,kind),phase:'rolled'})).then(()=>T(()=>toPhase(1,'rolled',x=>({...x,phase:'input'})).finally(()=>{advancing=false;}),4200)).catch(()=>{advancing=false;});}
   else toPhase(s.turn,'choose',x=>({...x,phase:'input'})).finally(()=>{advancing=false;});
  }
  if(s.phase==='input'){
   if(movesTurn!==s.turn){movesTurn=s.turn;movesStop?.();movesStop=onValue(ref(db,`${base}/moves/${s.turn}`),snap=>{movesNow=snap.val()||{};hostTick();},()=>message('手の集計を取得できませんでした。'));
    T(()=>resolveNow(s.turn),(TIME+1.5)*1000);}
   const need=mustMove(s);
   if(need.every(u=>typeof movesNow[u]==='string'))resolveNow(s.turn);
  }
  if(s.phase==='moved'&&!advancing){advancing=true;const turn=s.turn;T(()=>toPhase(turn,'moved',advance).finally(()=>{advancing=false;}),2300);}
 }
 let resolving=false;
 async function resolveNow(turn){
  if(dead||resolving||!state||state.turn!==turn||state.phase!=='input')return;
  resolving=true;
  try{
   const moves={...movesNow};
   await toPhase(turn,'input',s=>resolveTurn(s,moves,names));
   const clear={};for(const u of Object.keys(moves))clear[`moves/${turn}/${u}`]=null;
   await update(ref(db,base),clear).catch(()=>{});
  }catch{message('結果を反映できませんでした。');}
  finally{resolving=false;}
 }
 async function again(){
  const oni=pickOni(uids);
  await set(ref(db,base+'/choice'),null).catch(()=>{});
  await set(ref(db,base+'/state'),newGame(uids,oni)).catch(()=>message('もう一度を始められませんでした。'));
 }
 // ---------- me ----------
 const me=()=>state?.p?.[uid];
 const maxSteps=()=>!state||!me()?1:me().s==='oni'?(frozen(state)?0:oniSteps(state)):(frozen(state)?2:1);
 const canMove=()=>state?.phase==='input'&&me()&&(me().s==='oni'||me().s==='run')&&maxSteps()>0&&typeof own!=='string';
 async function send(auto=false){
  if(sent||!state||state.phase!=='input'||!canMove())return;
  sent=true;clearInterval(timer);
  const m=path.join('')||'S';
  try{await set(ref(db,`${base}/moves/${state.turn}/${uid}`),m);}catch{sent=false;message('手を送れませんでした。もう一度押してください。');}
  render();
 }
 function press(k){
  if(!canMove()||sent)return;
  const max=maxSteps();
  if(k==='undo')path.pop();else if(max===1)path=[k];else if(path.length<max)path.push(k);
  render();
 }
 function startTurn(){
  clearInterval(timer);path=[];sent=false;left=TIME;
  if(canMove()){timer=setInterval(()=>{left-=0.1;if(left<=0){clearInterval(timer);send(true);}else paintTimer();},100);}
 }
 function paintTimer(){const t=root.querySelector?.('.o-timer i');if(t)t.style.transform=`scaleX(${Math.max(0,left/TIME)})`;const c=root.querySelector?.('#o-sec');if(c)c.textContent=Math.ceil(left);}
 // ---------- view ----------
 function boardHtml(){
  const s=state,walls=new Set(arr(s.w)),sweep=new Map();
  if(s.phase==='moved')arr(s.pa).forEach(p=>arr(p).forEach((c,i)=>{if(i>0)sweep.set(key(c[0],c[1]),i);}));
  const pv=new Map();
  if(s.phase==='input'&&canMove()&&!sent){let c=[me().x,me().y];path.forEach((k,i)=>{const d={U:[0,-1],D:[0,1],L:[-1,0],R:[1,0],S:[0,0]}[k],nx=c[0]+d[0],ny=c[1]+d[1];if(nx>=0&&ny>=0&&nx<N&&ny<N&&!walls.has(key(nx,ny)))c=[nx,ny];pv.set(key(c[0],c[1]),i+1);});}
  const danger=s.phase==='input'&&me()?.s==='run'?reach(s):new Set();
  const floor=arr(s.it).filter(i=>!i.h&&!i.s);
  let cells='';
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=key(x,y);let cls='o-cell',n='';
   if(walls.has(k))cls+=' wall';else if(x===EXIT[0]&&y===EXIT[1])cls+=' exit';
   if(sweep.has(k)){cls+=' sweep';n=sweep.get(k);}else if(pv.has(k)){cls+=' pv';n=pv.get(k);}else if(danger.has(k)&&!walls.has(k)&&!(x===EXIT[0]&&y===EXIT[1]))cls+=' reach';
   const fl=floor.find(i=>i.x===x&&i.y===y);
   cells+=`<div class="${cls}" data-n="${n}">${x===EXIT[0]&&y===EXIT[1]?'🚪':fl?`<span class="o-item">${ITEM_ICON[fl.k]}</span>`:''}</div>`;}
  const tok=(left,top,cls,body)=>`<div class="o-tok ${cls}" style="left:${left*100/N}%;top:${top*100/N}%">${body}</div>`;
  const toks=arr(s.al).map(a=>tok(a.x,a.y,'oni ally','👹')).join('')+playersOf(s).map(p=>{
   const hold=arr(s.it).filter(i=>i.h===p.uid).map(i=>`<i class="o-carry">${ITEM_ICON[i.k]}</i>`).join('');
   return tok(p.x,p.y,(p.uid===uid?'me ':'')+(p.s==='caught'||p.s==='exit'?'out ':'')+(p.s==='oni'?'oni':''),(p.s==='oni'?'👹':AV[slotOf[p.uid]]||'🍻')+(p.uid===uid?'<small>あなた</small>':'')+hold);}).join('');
  return `<div class="o-board" role="img" aria-label="7かける7の盤面">${cells}${toks}</div>`;
 }
 function chips(){
  const s=state,b=s.bf||{},own=r=>arr(s.it).filter(i=>i.h===r.uid||i.s===r.uid).map(i=>ITEM_ICON[i.k]+(i.s===r.uid?'✓':'')).join('');
  const bf=(b.slow?`<span class="o-chip">🌀 金縛り：${frozen(s)?'今回休み':'あと'+((4-s.turn%4)%4)+'ターンで休み'}</span>`:'')+(b.fast?'<span class="o-chip">⚡ 2歩</span>':'')+(b.al?`<span class="o-chip">👥 仲間×${b.al}</span>`:'');
  const rs=runners(s).map(r=>`<span class="o-chip">${AV[slotOf[r.uid]]||'🍻'} ${esc(nm(r.uid))} ${r.s==='exit'?'🚪':r.s==='caught'?'💀':'🏃'} ${own(r)}</span>`).join('');
  return `<div class="o-hud">${bf}${rs}</div>`;
 }
 function padHtml(){
  const act=canMove()&&!sent,multi=maxSteps()>1;
  const b=k=>`<button class="o-key" data-k="${k}" ${act?'':'disabled'} ${!multi&&path[0]===k?'aria-pressed="true"':''} aria-label="${ARW[k]}">${k==='S'?'<span class="mid">停止</span>':ARW[k]}</button>`;
  return `<div class="o-pad"><span></span>${b('U')}<span></span>${b('L')}${b('S')}${b('R')}${multi?`<button class="o-key" data-k="undo" ${act&&path.length?'':'disabled'}><span class="mid">戻す</span></button>`:'<span></span>'}${b('D')}<span></span></div>`;
 }
 function render(){
  if(dead)return;
  const s=state;
  if(!s){root.innerHTML=`<p class="o-say">${host?'ミニゲームを準備しています…':'ホストの準備を待っています…'}</p>`;return;}
  if(s.g!==gseen){gseen=s.g;lotteryUntil=Date.now()+2400*scale;rollSeen=null;movesTurn=null;advancing=false;resolving=false;clearTimeout(lotteryTimer);lotteryTimer=setTimeout(()=>{if(!dead)render();},2450*scale);}
  const I=me(),amOni=s.oni===uid;
  const head=`<div class="o-top"><b>ターン ${Math.min(s.turn,s.max)}／${s.max}</b><span class="o-chip oni">👹 鬼：${esc(nm(s.oni))}${amOni?'（あなた）':''}</span></div>`;
  let body='';
  if(s.phase==='choose'){
   if(Date.now()<lotteryUntil){body=`${head}${boardHtml()}<div class="o-panel"><h2>鬼を抽選中…</h2><div class="o-reel" id="o-reel">…</div></div>`;startReel(uids.map(nm),nm(s.oni),lotteryUntil);}
   else body=`${head}${boardHtml()}<div class="o-panel"><h2>${amOni?'あなたは鬼！ スタート方法を選ぶ':esc(nm(s.oni))+'が鬼！ スタート方法を選んでいます…'}</h2>
    ${amOni&&!choice?`<button id="o-plain">通常スタート</button><button id="o-spin" class="o-red">🎰 ルーレットをまわす</button>`:''}
    <ul class="o-rules">${ODDS.map(([,p,t,d])=>`<li><b>${p}%</b> ${t}：${d}</li>`).join('')}</ul>
    ${host&&!amOni&&!choice?`<button id="o-force" class="o-ghost">待たずに通常スタート</button>`:''}</div>`;
  }else if(s.phase==='rolled'){
   if(rollSeen!==s.g){rollSeen=s.g;rollUntil=Date.now()+1800*scale;clearTimeout(rollTimer);rollTimer=setTimeout(()=>{if(!dead)render();},1850*scale);}
   const r=ODDS.find(x=>x[0]===s.rolled)||ODDS[4];
   body=`${head}${boardHtml()}<div class="o-panel"><h2>ルーレット</h2>${Date.now()<rollUntil?'<div class="o-reel" id="o-reel">…</div>':`<div class="o-reel hit">${r[2]}</div><p class="o-say">${r[3]}</p>`}</div>`;
   if(Date.now()<rollUntil)startReel(ODDS.map(x=>x[2]),r[2],rollUntil);
  }else if(s.phase==='end'){
   const d=s.drinks||{},rows=playersOf(s).map(p=>{const st=p.s==='oni'?'👹 鬼':p.s==='exit'?'🚪 脱出':p.s==='caught'?'💀 捕まった':'⏱ 出口に届かず';const items=arr(s.it).filter(i=>i.s===p.uid).map(i=>' '+ITEM_ICON[i.k]).join('');
    return `<div><span>${p.s==='oni'?'👹':AV[slotOf[p.uid]]||'🍻'} ${esc(nm(p.uid))}　<span class="o-mute">${st}</span></span><span class="o-beer">${d[p.uid]?'🍺×'+d[p.uid]:'セーフ'}${items}</span></div>`;}).join('');
   body=`${head}${boardHtml()}<div class="o-panel"><h2>結果</h2><div class="o-who">${rows}</div><p class="o-mute">杯数とお助けは、このミニゲーム内だけの結果です。</p></div>${host?'<button id="o-again">もう一度（鬼を抽選）</button>':'<p class="o-say">ホストが次を始めるのを待っています。</p>'}`;
  }else{
   let say='';
   if(s.phase==='moved')say=arr(s.ev).map(esc).join('　');
   else if(!I||(I.s!=='oni'&&I.s!=='run'))say=I?.s==='exit'?'あなたは出口に着いた。みんなを見守ろう。':'捕まった… 結果を見守ろう。';
   else if(I.s==='oni')say=frozen(s)?'🌀 金縛り！ このターンは動けない。':sent?'送信しました。みんなを待っています…':`あなたが鬼です。方向を${oniSteps(s)}回まで押して「決定」。逃げる側は ${aliveRunners(s).length}人。`;
   else say=sent?'送信しました。みんなを待っています…':(frozen(s)?'鬼は金縛りで動けない！ チャンス！ 今回は2歩まで進める。':'出口🚪まで逃げよう。')+` 鬼👹は${oniSteps(s)}歩進む。${arr(s.al).length?'仲間の鬼'+arr(s.al).length+'体は1歩ずつ。':''}赤く光るマスは鬼が届く範囲。`;
   const act=s.phase==='input'&&canMove()&&!sent;
   body=`${head}${chips()}${s.phase==='input'&&canMove()?'<div class="o-timer"><i></i></div>':''}${boardHtml()}<p class="o-say">${say}</p>${s.phase==='input'?padHtml():''}${act?`<button id="o-ok">決定　<span id="o-sec">${Math.ceil(left)}</span>秒</button>`:''}`;
  }
  const lg=arr(s.lg).map(l=>`<li><b>T${l.t}</b> ${arr(l.e).map(esc).join('　')}</li>`).join('');
  root.innerHTML=body+`<div class="o-panel"><h2>ログ</h2><ul class="o-log">${lg||'<li>まだ何も起きていません。</li>'}</ul></div>`;
  root.classList?.add('oni-root');
  const q=id=>root.querySelector?.('#'+id);
  q('o-plain')&&(q('o-plain').onclick=()=>choose('plain'));q('o-spin')&&(q('o-spin').onclick=()=>choose('spin'));
  q('o-force')&&(q('o-force').onclick=()=>set(ref(db,base+'/choice'),'plain').catch(()=>{}));
  q('o-again')&&(q('o-again').onclick=again);q('o-ok')&&(q('o-ok').onclick=()=>send());
  const pad=root.querySelector?.('.o-pad');if(pad)pad.onclick=e=>{const b=e.target.closest?.('button');if(b&&!b.disabled)press(b.dataset.k);};
  paintTimer();
 }
 function startReel(labels,target,until){
  clearInterval(reelTimer);let i=0;
  reelTimer=setInterval(()=>{const e=root.querySelector?.('#o-reel');if(!e||Date.now()>=until){clearInterval(reelTimer);if(e)e.textContent=target;return;}e.textContent=labels[i++%labels.length];},90);
 }
 const choose=v=>set(ref(db,base+'/choice'),v).catch(()=>message('選べませんでした。もう一度押してください。'));
 // ---------- wiring ----------
 stops.push(onValue(ref(db,base+'/state'),snap=>{
  const s=snap.val(),prevKey=tickKey;state=s;
  if(s){
   const k=s.g+':'+s.turn+':'+s.phase;
   if(k!==tickKey){tickKey=k;if(s.phase==='input'){ownStop?.();own=null;ownStop=onValue(ref(db,`${base}/moves/${s.turn}/${uid}`),v=>{own=v.val();render();});startTurn();}else{clearInterval(timer);}}
  }
  render();
  if(host){if(!s)hostStart();else hostTick();}
 },()=>message('ミニゲームの状態を取得できませんでした。')));
 stops.push(onValue(ref(db,base+'/choice'),snap=>{choice=snap.val();render();hostTick();},()=>{}));
 return()=>{dead=true;clearInterval(timer);clearInterval(reelTimer);clearTimeout(lotteryTimer);clearTimeout(rollTimer);hostTimers.forEach(clearTimeout);ownStop?.();movesStop?.();stops.forEach(f=>f());root.replaceChildren?.();root.classList?.remove('oni-root');};
}
// ローカル練習用：NPCが手を出す（本物の人間の代わり）
export function attachOniBots({db,roomId,bots,message=()=>{}}){
 const base=`oni/${roomId}`,scale=globalThis.__nqOniMs??1;let dead=false;
 const due=new Map();
 async function act(b){
  const s=(await get(ref(b.db||db,base+'/state'))).val();if(!s||dead)return;
  const d=b.db||db,k=b.uid+':'+s.g+':'+s.turn+':'+s.phase;
  if(!due.has(k))due.set(k,Date.now()+(900+Math.random()*2600)*scale);
  if(Date.now()<due.get(k))return;
  if(s.phase==='choose'&&s.oni===b.uid){const c=(await get(ref(d,base+'/choice'))).val();if(!c)await set(ref(d,base+'/choice'),Math.random()<0.5?'plain':'spin');}
  else if(s.phase==='input'&&mustMove(s).includes(b.uid)){const m=(await get(ref(d,`${base}/moves/${s.turn}/${b.uid}`))).val();if(typeof m!=='string')await set(ref(d,`${base}/moves/${s.turn}/${b.uid}`),botMove(s,b.uid));}
 }
 const timer=setInterval(()=>{for(const b of bots)act(b).catch(()=>{});},Math.max(1,500*scale));
 return {stop(){dead=true;clearInterval(timer);}};
}
