import {artPath,isIcon} from './pop-art.js';
import {ref,set,get,update,onValue,runTransaction,isLocal} from './fb.js?v=pop0.68';
import {showItemFx} from './itemfx.js?v=pop0.68';
import {shufflePlayers,currentTurn} from './turn.js?v=pop0.68';
import {ALL_CARDS,SOLO_CARDS,SOLO_COOLDOWN,LAP_CARDS,cardForRound,isBreak,turnsToBreak,checkStates,tiedTargets,tieCards,cards,votePrompts,muttsuriPrompts,majorityPrompts,mindPrompts,pickPrompt,drawCard,drawDirection,targetsFor,shuffleButtons,drinkAward,items,itemKinds,drawItem,decideCredit,winnersFor,REACTION_FAIL,dangerOutcome,rewardees,breakPeriod,ticketWindow,ticketsFor,tequilaPlan,tequilaPlanOne,sumTickets,NOTCHES,BREAK_DRAWS,tequilaOutcome,itemChoices} from './deck.js?v=pop0.68';
import {REST_CARD} from './deck.js?v=pop0.68';
import {chooseCard,didMission,parseKey,newSeed,pickMindPool,mindToText,mindFromText} from './draw.js?v=pop0.68';
import {avatarOf} from './avatars.js?v=pop0.68';
const LS={getItem:k=>{try{return localStorage.getItem(k);}catch{return null;}},setItem:(k,v)=>{try{localStorage.setItem(k,v);}catch{}}};
export function attachTen({db,roomId,uid,players,hostUid,message,root:given,bot=false}) {
 const root=given||document.getElementById('tenGame'),top=document.createElement('div'),box=document.createElement('div'),dock=document.createElement('div'),host=uid===hostUid,base=`sessions/${roomId}`;
 top.className='top';box.className='stage';dock.className='dock';root.replaceChildren(top,box,dock);
 let dockButtons=0,dockNotes=0;
 const avatars=['🍻','🌙','⭐','🌈','🔥','🎲'],glyphs={ten:'十',battery:'電',buttons:'謎',reaction:'恋',danger:'誘',mission:'唇',king:'王',vote:'変',muttsuri:'隠',tapking:'連',check:'飲',rest:'休'};
 let telopRound=null,impactKey=null,fxEl=null;
 const clipName=n=>{const a=[...String(n||'')];return a.length>10?a.slice(0,10).join('')+'…':a.join('')};
 const fitPx=(len,max)=>`min(${max}px,calc((100vw - 72px) / ${Math.max(1,len)}))`;
 function clearFx(){if(fxEl){fxEl.remove();fxEl=null;}}
 function fxOverlay(cls,inner,{autoMs=0}={}){clearFx();if(!document.body)return null;const o=div('nqfx '+cls);o.innerHTML=inner;o.setAttribute('role','dialog');const close=()=>{if(fxEl===o)clearFx();};o.addEventListener('click',close);document.body.append(o);fxEl=o;if(autoMs)setTimeout(close,autoMs);return o;}
 const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function showTelop(turn){
  if(dev||bot||dead||telopRound===state.round)return;telopRound=state.round;
  const brk=isBreak(state.round,turn.order.length),me=turn.uid===uid,p=byUid.get(turn.uid);
  const ap=avatarOf(p?.avatar),av=brk?'🥃':ap?`<img class="tAvImg" src="${ap.src}" alt="">`:avatars[Number(p?.slot)]||'🍻',nm=brk?'休憩':me?'あなた':clipName(p?.name||'？'),len=[...nm].length;
  fxOverlay('telopFx',`<div class="tBand"><div class="tAv">${av}</div><div class="tNm" style="font-size:${fitPx(len,46)}">${esc(nm)}</div><div class="tNm2">${brk?'ターン！':'のターン！'}</div><div class="tSb">${brk?'みんなの状態をチェックするよ':me?'カードを引こう':esc(nm)+'がカードを引くよ'}</div></div>`,{autoMs:2800});
 }
 function showImpact(drs,key){
  if(dev||bot||dead||impactKey===key||!drs.length)return;impactKey=key;
  const names=drs.map(u=>clipName(pname(u))),mx=Math.max(...names.map(n=>[...n].length)),size=fitPx(mx+(drs.length===1?1:0),drs.length>2?44:drs.length>1?54:68);
  const sp=Array.from({length:30},()=>{const a=Math.random()*6.283,r=90+Math.random()*190;return `<i style="--dx:${(Math.cos(a)*r).toFixed(0)}px;--dy:${(Math.sin(a)*r).toFixed(0)}px;animation-delay:${(.25+Math.random()*.25).toFixed(2)}s"></i>`}).join('');
  fxOverlay('impactFx',`<div class="iRays"></div><div class="iBox"><div class="clink"><img class="cl l" src="gold/drinktime.webp" alt="" draggable="false"><img class="cl r" src="gold/drinktime.webp" alt="" draggable="false"><div class="fl"></div><div class="ring"></div><div class="bst">イッテ<br>キーラ!!</div></div><div class="iName late" style="font-size:${size}">${names.map(n=>`<span>${esc(n)}${drs.length===1?'<small>さん</small>':''}</span>`).join('')}</div><div class="iSub late">に1杯！</div><div class="iSp">${sp}</div></div><div class="iTap">タップして つづける</div>`,{autoMs:4200});
 }
 const VL=new Set(['vote','muttsuri','mind']);
 let lastCard=null,countedRound=0;const soloAt={};const missionDone=new Set(),specialSeen=new Set(),seenPrompts={vote:new Set(),muttsuri:new Set(),majority:new Set(),mind:new Set()},promptLists={vote:votePrompts,muttsuri:muttsuriPrompts,majority:majorityPrompts,mind:mindPrompts};
 // 同じ部屋の中で、お題やキス顔が重ならないように、使った分をこのスマホにも記録しておく（再読み込みしても残る）
 const seenKey='nq-seen-'+roomId;
 function saveSeen(){try{localStorage.setItem(seenKey,JSON.stringify({m:[...missionDone],s:[...specialSeen],c:countedRound,l:soloAt,p:Object.fromEntries(Object.entries(seenPrompts).map(([k,v])=>[k,[...v]]))}));}catch{}}
 try{const o=JSON.parse(localStorage.getItem(seenKey)||'null');if(o){for(const u of o.m||[])missionDone.add(u);for(const c of o.s||[])if(ALL_CARDS.includes(c))specialSeen.add(c);if(typeof o.c==='number')countedRound=o.c;for(const [k,v] of Object.entries(o.l||{}))if(SOLO_CARDS.includes(k)&&typeof v==='number')soloAt[k]=v;for(const [k,v] of Object.entries(o.p||{}))if(seenPrompts[k])for(const x of v)if(typeof x==='number')seenPrompts[k].add(x);}}catch{}
 let state,own,answers={},began=null,elapsed=null,batteryDraft='',tapStart=null,tapCount=0,tapTimer=null,pickRound=null,pickTimer=null,pending=false,dead=false,answerStop,ownStop,roundSeen,settling=false,buttonDeck,buttonDecks={},drinks=null,drinkMap,itemMap,spentMap,settledMap={},settledLoaded=false,grantMap,grantBusy=false,spinRound=null,spinStart=0,spinTimer,flipRound=null,flipStart=0,flipTimer,rx=null,invite,inviteStop,choice,ownBusy=false,ownError=false,grantTried=false,grantFailed=false,settledStop;
 let angelStart=0,angelRound=null,angelReady=false,dgMap={},dgStop,dgWroteKey='',angelSeen=new Set(),angelQ=[],angelPlaying=false,angelBotTimer=null,angelChoose=false,dtLocked=false,angelUsable=false,angelSched=false,dgSKey='',lastAngelCands=[],angelTapFn=null;
 let dtHolder=null,dtStage=0,dtAutoKey='',dtHelpEl=null,dtHelpPushed=false,dtHelpSave=null,dtHintUntil=0;
 let dtMap={},dtStop,dtWroteKey='',dtSkipKey=null,extUntil=0,botTimer=null,botTries=0;
 let fin=false,spentSeen=false,allDrinks={},allDrinksStops=[],tqMap={},tqStop,cuteMode=null,nvMap={},nvStop,settlePage=false,settlementHistory={},historyLoaded=false,tqHist={},tqHistLoaded=false,dtRound=null,dtStep='entry',entryStart=0,cdTimer=0,dtInEntry=false;
 const stops=[],byUid=new Map(players.map(p=>[p.uid,p]));
 let memBody=null,helpBody=null,helpSel=null;
 function cumDrinks(u){let n=0;try{const ds=Object.keys(settlementHistory).map(Number).filter(r=>r<state.round||(r===state.round&&state.card==='check')).sort((a,b)=>a-b);for(const r of ds){const pl=tequilaPlan(allDrinks,ids(),r,previousSettlement(r));n+=pl[u]?.count||0;}}catch{}return n;}
 function fillMembers(){
  if(!memBody||!memBody.isConnected){memBody=null;return;}
  ensureAllDrinks();let plan=null;
  try{if(drinksReady()&&historyLoaded)plan=tequilaPlan(allDrinks,ids(),state.round,previousSettlement());}catch{}
  const conn=globalThis.__nqConn||{};
  memBody.replaceChildren(div('mlist',...players.map(p=>{
   const tk=plan?plan[p.uid].tickets:null,on=conn[p.uid]!==false,lime=tk!==null&&tk>=NOTCHES;
   const av=avImgEl(p);av.classList.add('mzoom');av.onclick=()=>document.dispatchEvent(new CustomEvent('nq-zoom',{detail:{id:p.avatar}}));
   return div('mrow'+(lime?' lime':'')+(on?'':' off'),av,
    div('minfo',div('mname',txt('b','',p.uid===uid?`${p.name}（あなた）`:p.name),...(p.uid===hostUid?[txt('span','mhost','ホスト')]:[])),
     txt('span','mcon'+(on?' on':''),on?'● 接続中':'🕒 未接続'),
     txt('span','mcum',`累計 ${plan?cumDrinks(p.uid):'…'}杯`)),
    div('mmeter',...(tk===null?[txt('span','cups','集計中…')]:[shot(tk,'rank'),txt('span','cups',Math.min(tk,NOTCHES)+'/'+NOTCHES)])));})),
   txt('p','fine','ショットグラスはみんなのメーターです。5つでライム＝1杯確定。累計は今夜飲む確定になった杯数です。'));
 }
 function fillHelp(){
  if(!helpBody||!helpBody.isConnected){helpBody=null;return;}
  const counts={};for(const [k,v] of Object.entries(itemMap||{}))if(spentMap?.[k]===undefined)counts[v]=(counts[v]||0)+1;
  const desc=txt('div','hdesc','');
  const show=()=>{const k=helpSel;desc.replaceChildren(...(k?[txt('b','',`${items[k].icon} ${items[k].name}`),txt('p','',items[k].desc),txt('p','fine','この表示はあなたの画面だけ。実際に飲む必要はありません。')]:[txt('p','fine','カードを押すと、効果が出ます。お助けカードは、ドリンクタイムで使えます。')]));};
  const cards3=div('hcards',...itemKinds.map(k=>{const n=counts[k]||0;const c=el('button','');c.type='button';c.onclick=()=>{if(k==='angel'&&angelUsable&&angelTapFn){document.getElementById('gameClose')?.click();angelTapFn();return;}helpSel=helpSel===k?null:k;fillHelp();};c.className='hcard'+(n?'':' none')+(helpSel===k?' sel':'')+(k==='angel'&&angelUsable?' glowCard':'');c.replaceChildren(txt('span','hic',items[k].icon),txt('span','hnm',shortName[k]),txt('span','hn','×'+n));return c;}));
  helpBody.replaceChildren(cards3,desc);show();
 }
 const onMembers=e=>{if(bot||dead)return;e.detail.handled=true;memBody=e.detail.body;fillMembers();};
 document.addEventListener('nq-members',onMembers);
 const onConn=()=>{if(!dead)fillMembers();};document.addEventListener('nq-conn',onConn);
 const onHelp=e=>{if(bot||dead)return;e.detail.handled=true;helpBody=e.detail.body;fillHelp();};
 document.addEventListener('nq-help',onHelp);
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 const txt=(tag,cls,text)=>{const n=el(tag,text);n.className=cls;return n;};
 const div=(cls,...kids)=>{const n=document.createElement('div');n.className=cls;n.append(...kids);return n;};
 // 選んだアイコン（丸い画像）。まだ選ばれていない人だけ、これまでの絵文字
 const avImgEl=p=>{const a=avatarOf(p?.avatar);if(!a)return txt('span','av',avatars[Number(p?.slot)]||'🍻');const s=document.createElement('span');s.className='av';const im=document.createElement('img');im.src=a.src;im.alt='';im.width=im.height=128;im.decoding='async';s.append(im);return s;};
 const shortName={barrier:'バリア',cute:'なすりつけ',angel:'身代わり'};
 function note(text){dock.append(el('p',text));dockNotes++;}
 function button(text,fn,disabled=false,cls=''){const b=el('button',text);if(cls)b.className=cls;dockButtons++;b.disabled=disabled;b.onclick=async()=>{if(pending||dead)return;pending=true;render();try{await fn();}catch{message('ゲーム通信に失敗しました。再接続後にもう一度試してください。');}finally{pending=false;if(!dead)render();}};dock.append(b);}

 // ---- 開発者モード(?npc=1&dev=1)：全ゲームを順番どおりでなく好きなカードで試す。練習モード専用。----
 const dev=isLocal&&uid==='me'&&new URL(location.href).searchParams.get('dev')==='1';
 function devForce(key){
  return runTransaction(ref(db,base+'/state'),s=>{
   if(!s||s.phase!=='draw')return;
   const order=Object.values(s.order||players.map(p=>p.uid)),n=order.length,idx=(s.round-1)%n,mi=order.indexOf(uid),rot=order.slice();
   if(mi>=0&&idx!==mi){[rot[idx],rot[mi]]=[rot[mi],rot[idx]];}
   return {...s,order:rot,actor:rot[idx],phase:'measuring',card:key,...(promptLists[key]?{prompt:pickPrompt(seenPrompts[key],Math.random,promptLists[key].length)}:{})};
  },{applyLocally:false});
 }
 async function devBreak(kind){
  const R=Math.max(2,state.round),lv=u=>kind==='lime'?(u===uid?5:Math.floor(Math.random()*5)):kind==='tie'?(players.findIndex(p=>p.uid===u)<2?3:1):kind==='zero'?0:Math.floor(Math.random()*6);
  for(const p of players)await set(ref(db,`personal/${roomId}/${p.uid}/drinks/${R-1}`),lv(p.uid));
  return runTransaction(ref(db,base+'/state'),s=>s?.phase==='draw'?{...s,round:R,phase:'measuring',card:'check'}:undefined,{applyLocally:false});
 }
 function devPanel(){
  const wrap=document.createElement('details');wrap.className='devpanel';wrap.open=true;
  wrap.append(el('summary','🛠 開発者モード：試したいものを選ぶ'));
  const g=div('devgrid'),b=(label,fn,cls='')=>{const x=el('button',label);x.className='secondary '+cls;x.onclick=async()=>{if(pending||dead)return;pending=true;try{await fn();}finally{pending=false;if(!dead)render();}};g.append(x);};
  for(const k of ALL_CARDS)b(cards[k].title.replace(/^👑\s*/,''),()=>devForce(k));
  wrap.append(g,txt('p','fine','休憩・ドリンクタイム（メーターを自動で配ります）'));
  const g2=div('devgrid');
  const b2=(label,kind)=>{const x=el('button',label);x.className='secondary';x.onclick=async()=>{if(pending||dead)return;pending=true;try{await devBreak(kind);}finally{pending=false;if(!dead)render();}};g2.append(x);};
  b2('ライムあり（自分が5）','lime');b2('同率（2人が最多）','tie');b2('全員0','zero');b2('ランダム','rand');
  wrap.append(g2,txt('p','fine','お助けカード（バリア等）は、そのまま使えます。通信なしの練習モードだけで動きます。'));
  return wrap;
 }
 let shotN=0;
 function shot(level,cls=''){const lv=Math.max(0,Math.min(NOTCHES,Number(level)||0)),id='sg'+(++shotN),top=lv>=NOTCHES,d='M8 4H62L55 74Q54.5 82 48 82H22Q15.5 82 15 74Z',w=document.createElement('div');w.className='mug shot'+(top?' top':'')+(cls?' '+cls:'');w.setAttribute('role','img');w.setAttribute('aria-label','ショットメーター '+lv+'/'+NOTCHES);
  w.innerHTML=`<svg viewBox="-2 -16 86 108" aria-hidden="true" focusable="false"><defs><clipPath id="${id}"><path d="${d}"/></clipPath><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd35a"/><stop offset="1" stop-color="#e0971c"/></linearGradient></defs><path class="g-in" d="${d}"/><g clip-path="url(#${id})"><rect class="liq" x="0" y="4" width="70" height="72" fill="url(#${id}g)" style="transform:scaleY(${(lv/NOTCHES).toFixed(3)})"/><rect x="0" y="72" width="70" height="12" fill="rgba(255,255,255,.28)"/><path class="g-tick" d="M0 18.4H70M0 32.8H70M0 47.2H70M0 61.6H70"/></g><path class="g-out" d="${d}"/><path d="M14 10L19 66" class="g-hi"/>${top?'<g class="lime"><path d="M50 4A15 15 0 0 1 80 -2L74 6Z" transform="rotate(-8 60 4)"/><path d="M53 3A12 12 0 0 1 76 -1" class="rind"/></g>':''}</svg>`;return w;}
 function previousSettlement(before=state.round){return Math.max(0,...Object.keys(settlementHistory).map(Number).filter(r=>r<before));}
 function pendingPlan(map,round=state.round+1){return tequilaPlanOne(map,round,previousSettlement(round));}
 function creditsReady(){return historyLoaded&&drinksReady()&&players.every(p=>allDrinks[p.uid]?.[state.round]!==undefined);}
 // ---- 0.56 基本ルール：ドリンクタイム＝8ターンごとに自動（ターンに数えない）／休憩カード＝状態を確認するだけ ----
 const COOL_TURNS=8;
 // ---- 0.68 新しい出し方：部屋で共有する記録(sessions/$room/deck)だけで、どの端末でも同じカードが決まる ----
 let deckSeed=null,deckMind=[],deckDrawn={};
 const PROMPT_SIZES={vote:votePrompts.length,muttsuri:muttsuriPrompts.length,majority:majorityPrompts.length};
 const deckReady=()=>deckSeed!==null&&deckMind.length>0;
 function normDrawn(d){const o={};if(!d)return o;for(const [k,v] of Object.entries(d))if(typeof v==='string'&&Number(k)>0)o[k]=v;return o;}
 async function drawNow(turn){
  if(!coolReady()||!deckReady())return;
  const round=state.round,ci=coolInfo(),cool=ci.ds.filter(r=>r<round).length,pos=round-ci.start+1,order=Object.values(state.order||turn.order);
  let key=deckDrawn[round];
  if(!key){
   key=chooseCard(deckDrawn,{seed:deckSeed,mind:deckMind,sizes:PROMPT_SIZES,round,cool,pos,actorDidMission:didMission(deckDrawn,order,turn.uid,round)}).key;
   await runTransaction(ref(db,`${base}/deck/drawn/${round}`),cur=>cur?undefined:key,{applyLocally:false});
  }
  const {card,prompt}=parseKey(key);
  return runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='draw'?{...s,phase:'measuring',card,...(prompt!==undefined?{prompt}:{})}:undefined,{applyLocally:false});
 }
 const hashN=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 const coolReady=()=>!!state&&historyLoaded&&tqHistLoaded&&drinksReady();
 // 精算ラウンド s で実際に飲む杯数（バリアなどで無効になった分は数えない）
 function actualIn(s,prev){
  try{const plan=tequilaPlan(allDrinks,ids(),s,prev);let n=0;for(const p of players)for(let j=0;j<plan[p.uid].count;j++){const o=tequilaOutcome(p.uid,tqHist?.[s]?.[p.uid]?.[j]||{});if(!o.cancelled&&o.drinker)n++;}return n;}catch{return 0;}
 }
 // クール（ドリンクタイムからドリンクタイムまで）を履歴から組み立てる。休憩カードの出る位置も全員が同じ計算で決まる。
 // 休憩カードは廃止(0.68)：クール＝ドリンクタイムの次のラウンドから、次のドリンクタイムの手前まで
 function coolInfo(){
  const ds=Object.keys(settlementHistory).map(Number).filter(r=>r<state.round||(r===state.round&&state.card==='check')).sort((x,y)=>x-y);
  const start=ds.length?ds[ds.length-1]+1:1;
  return {start,restRound:null,rests:[],ds,cum:0,m:0};
 }
 function thresholdReached(){
  if(!coolReady()||state.phase!=='results'||state.card==='check')return false;
  const ci=coolInfo(),r=state.round;
  return r-ci.start+1-(ci.restRound!==null&&ci.restRound<=r?1:0)>=COOL_TURNS;
 }
 const turnNo=()=>{
  if(!state)return 1;
  const ci=coolReady()?coolInfo():{rests:[]},r=state.round;
  const drinks=Object.keys(settlementHistory).map(Number).filter(x=>x<r||(x===r&&state.card==='check')).length;
  const rests=ci.rests.filter(x=>x<r||(x===r&&state.card==='rest')).length;
  return r-drinks-rests;
 };
 const turnsLeft=()=>{if(!coolReady())return null;const ci=coolInfo(),r=state.round,done=r-ci.start+(state.phase==='results'?1:0)-(ci.restRound!==null&&(ci.restRound<r||(ci.restRound===r&&state.phase==='results'))?1:0);return Math.max(0,COOL_TURNS-done);};
 async function advanceRound(){
  const round=state.round,order=state.order||shufflePlayers(players);
  if(state.card==='check'&&!nvMap[uid]){const marker=ref(db,`${base}/nv/${round}/${uid}`);if((await get(marker)).val()!==true)await set(marker,true);}
  if(state.card!=='check'&&(!creditsReady()||!coolReady()))throw new Error('tickets not loaded');
  const check=state.card!=='check'&&thresholdReached();
  return runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='results'?{round:round+1,phase:check?'measuring':'draw',...(check?{card:'check'}:{}),order,actor:order[round%order.length],accounting:true}:undefined,{applyLocally:false});
 }
 function maybeSettlement(){} // 0.56: ドリンクタイムは、8ターン目の結果のあと「次へ」で始まる
 // 休憩ターン：全員が「準備OK」を押したら（満場一致で）ホストの端末が次のターンへ進める。ホストは待たずに進めることもできる。
 let advancing=false;
 function maybeAdvance(){if(!host||dead||advancing||state?.phase!=='results'||state.card!=='check'||state.round>=100)return;if(!players.every(p=>nvMap[p.uid])||!settledAll())return;advancing=true;advanceRound().catch(()=>message('次のターンへ進めませんでした。')).finally(()=>{advancing=false;});}
 function imDrinker(){try{if(!drinksReady()||!historyLoaded)return false;const plan=tequilaPlan(allDrinks,ids(),state.round,previousSettlement());for(const p of players)for(let j=0;j<plan[p.uid].count;j++){const o=tequilaOutcome(p.uid,chainOf(p.uid,j));if(!o.cancelled&&o.drinker===uid)return true;}}catch{}return false;}
 function breakNext(){
  const ready=players.filter(p=>nvMap[p.uid]).length,me=!!nvMap[uid];
  box.append(txt('p','fine',`次のターンへ：${ready}/${players.length}人が準備OK。全員がそろうと進みます。`));
  button(me?`✓ 準備OK（みんなを待っています ${ready}/${players.length}）`:(imDrinker()?'飲んだ → 次へ':'確認して次へ →')+`（${ready}/${players.length}人OK）`,()=>set(ref(db,`${base}/nv/${state.round}/${uid}`),true),me||pending);
  if(host)button('みんなを待たずに次のターンへ（ホスト）',advanceRound,pending||ownBusy||!settledAll()||state.round>=100,'secondary');
 }
 function nextButton(){if(host)button(thresholdReached()?'🥃 ドリンクタイムへ':'次のターン',advanceRound,pending||ownBusy||!settledAll()||!creditsReady()||!coolReady()||state.round>=100);
   else box.append(el('p','ホストが次のターンへ進むのを待っています。'));}
 let lastMsgKey='';
 function render(){
  fillMembers();fillHelp();
  if(dead)return;{const mk=`${state?.round}|${state?.card}|${state?.phase}`;if(mk!==lastMsgKey){lastMsgKey=mk;message('');}}top.replaceChildren();box.replaceChildren();dock.replaceChildren();root.querySelector?.(':scope>.moreinfo')?.remove();dockButtons=0;dockNotes=0;
  paint();{const ps=box.querySelectorAll?.('.prog span')||[];if(ps.length){const k=state?.phase==='results'?ps.length-1:(state?.card==='ten'?(began!==null?1:(elapsed!==null?2:0)):(dockButtons>0?0:1));ps.forEach((e,n)=>e.className=n<=k?'on':'')}}
  if(state?.phase==='measuring'&&box.classList?.contains('art')&&true){const bs=[...(dock.querySelectorAll?.('button')||[])];if(bs.length>=1){const g=div('choices');bs.forEach(b=>g.append(b));box.append(g);dockButtons-=bs.length}}
  dock.className='dock'+(dockNotes===0&&dockButtons>2?' grid':dockNotes===0&&dockButtons>0?' sticky':'');
 }
 function compactBar(){
  const n=turnsLeft(),L=state.card==='check'?'🥃 ドリンクタイム！':state.card==='rest'?'🛌 休憩カード（ターンに数えません）':n===null?'':n>0?`ドリンクタイムまで あと<b>${n}</b>ターン`:'次はドリンクタイム';
  let total=0;for(const k of Object.keys(itemMap||{}))if(spentMap?.[k]===undefined)total++;
  const tk=myTickets(),b=div('bar'),l=document.createElement('span');l.innerHTML=L;
  const m=document.createElement('span');m.className='inv';m.textContent='🎒 '+total+'/3';
  const t=document.createElement('span');t.textContent='🥃 '+(tk===null?'…':Math.min(tk.now,NOTCHES)+'/'+NOTCHES);
  b.append(l,m,t);return b;
 }
 // 「カードを引く」の下：全員のアイコンと、いま誰の番かを大きく出す
 function whoStrip(turn){
  const me=turn.uid===uid,cur=byUid.get(turn.uid),seats=div('seats big');
  turn.order.forEach((id,i)=>{const p=byUid.get(id),now=i===turn.index;seats.append(div('seat'+(now?' now':''),avImgEl(p),txt('span','nm',id===uid?'あなた':(p?.name||'確認中'))));});
  return div('whowrap'+(me?' me':''),txt('p','whohead',me?'👉 あなたの番！':`${cur?.name||'確認中'}さんの番`),seats);
 }
 function turnBar(turn){
  const seats=div('seats');
  turn.order.forEach((id,i)=>{const p=byUid.get(id),now=i===turn.index;seats.append(div('seat'+(now?' now':''),txt('span','tag',now?'担当':''),avImgEl(p),txt('span','nm',p?.name||'確認中')));});
  const n=turn.order.length;return div('turnwrap',div('turnmeta',txt('span','',`ターン ${turnNo()} · ${turn.cycle}巡目`),txt('b','',`今回の担当：${byUid.get(turn.uid)?.name||'確認中'}`)),seats,txt('p','turnnext',state.card==='check'?'🥃 ドリンクタイム！':state.card==='rest'?'🛌 休憩カード！ 状態を確認するだけ':(turnsLeft()===null?'':turnsLeft()>0?`🥃 あと${turnsLeft()}ターンでドリンクタイム`:'🥃 このあとドリンクタイム！')));
 }
 const blurb={ten:'時計を見ずに10秒を狙え！',battery:'その残量、ホント？',buttons:'どっちを押す？',reaction:'形がハートをタップ！',tapking:'5秒間ひたすら連打！',vote:'一番あやしいのは誰？',muttsuri:'むっつりは誰だ？',majority:'多数派はどっち？',mind:'やってんのは誰だ!?',king:'王様の言うことは絶対！',mission:'キス顔に挑戦！',danger:'行く？ 行かない？',check:'ひと息ついて、状態チェック',rest:'みんなの状態を確認しよう'};
 function popImg(card,cls,alt){const i=document.createElement('img');i.className=cls+(isIcon(card)?' icon':'');i.setAttribute('src',artPath(card));i.setAttribute('alt','');i.setAttribute('draggable','false');i.setAttribute('width','360');i.setAttribute('height','308');return i;}
 function cardFace(card,cls=''){return div('cface pop k-'+card+' '+cls,txt('h2','pop-title',cards[card].title.replace(/^👑\s*/,'')),popImg(card,'hero'),txt('span','dsc',blurb[card]||''));}
 function cardBack(cls=''){const back=div('cback '+cls);back.setAttribute('role','img');back.setAttribute('aria-label','NOMI QUESTの山札');return back;}
 const DTH={1:{t:'① 結果発表',b:['8ターンごとの「精算」です。誰が飲むかを決めます。','グラスのメーターの順位です。いちばん多い人（ライムの人は全員）が、飲む候補です。','まだ確定ではありません。お助けカードを使ったあとに、飲む人が最終的に決まります。','全員が「結果を確認した」を押すと、次に進みます。']},2:{t:'② お助けカード',b:['30秒の間だけ、バリアとなすりつけが使えます。','使うと、飲む人が変わることがあります。','使わない人は「今回は使わない」を押そう。','全員が選び終わると、30秒を待たずに進みます。','※ 身代わりは、次の「最終結果」で使えます。']},3:{t:'③ 最終結果',b:['お助けカードのあとに、本当に飲む人が決まります。','この画面に出た人が、今回飲む人です。','最初の10秒は、身代わりカードを持つ人が、飲む人の代わりに飲めます。','飲んだら「次へ」を押そう。メーターは0に戻ります。']},a:{t:'👼 身代わりが使えます',b:['お助けカードを使えば、代わりに飲むことができます。','最終結果が出てから10秒の間に、光った「身代わり」を押そう。','持っているカードは、下のバーの「お助け」でも見られます。']}};
 const hkey=n=>'nq-dthelp-'+n;
 function closeDtHelp(fromPop){if(!dtHelpEl)return;try{dtHelpSave?.();}catch{}dtHelpSave=null;dtHelpEl.remove();dtHelpEl=null;if(dtHelpPushed&&!fromPop){dtHelpPushed=false;try{history.back();}catch{}}dtHelpPushed=false;if(angelReady&&!fromPop)setTimeout(startAngel,50);}
 function openDtHelp(n,auto){
  if(bot||dead||!DTH[n])return;closeDtHelp();const d=DTH[n];
  const chk=document.createElement('input');chk.type='checkbox';chk.checked=LS.getItem(hkey(n))==='1';
  const lab=document.createElement('label');lab.className='dthNo';lab.append(chk,document.createTextNode(' この説明を、次から表示しない'));
  const close=()=>closeDtHelp();
  const ok=el('button','とじる');ok.type='button';ok.onclick=close;
  const o=div('dtHelp',div('dtHelpBox',txt('h3','',d.t),...d.b.map(x=>txt('p','',x)),lab,ok));
  o.addEventListener('click',e=>{if(e.target===o)close();});
  dtHelpSave=()=>{LS.setItem(hkey(n),chk.checked?'1':'0');if(!(auto&&chk.checked)){dtHintUntil=performance.now()+6000;setTimeout(()=>{if(!dead)render();},6100);if(!dead)render();}};
  document.body.append(o);dtHelpEl=o;try{history.pushState({dth:1},'');dtHelpPushed=true;}catch{}
 }
 function setDtStage(n){
  dtStage=n;if(dtHolder)dtHolder.replaceChildren(dtSteps(n));
  const key=state.round+':'+n;if(bot||dtAutoKey===key)return;dtAutoKey=key;
  const kind=n===3&&itemsReady()&&heldKinds().includes('angel')?'a':n,go=()=>{if(dead||dtStage!==n||dtHelpEl)return;if(LS.getItem(hkey(kind))!=='1')openDtHelp(kind,true);else if(n===3&&angelReady)startAngel();};
  if(n===3)setTimeout(go,globalThis.__nqImpactMs??4300);else go();
 }
 const onPop=()=>{if(dtHelpEl){dtHelpPushed=false;closeDtHelp(true);}};window.addEventListener('popstate',onPop);
 function cardHead(card){const categories={ten:'タイミング',battery:'バトル',buttons:'心理戦',reaction:'アクション',tapking:'アクション',vote:'トーク',muttsuri:'予想',majority:'予想',mind:'トーク',king:'王様',mission:'ミッション',danger:'運命',check:'ドリンクタイム',rest:'ひと休み'};
  let who='';try{const t=currentTurn(state,players);who=card==='check'||card==='rest'?(categories[card]||''):(t.uid===uid?'あなた':(byUid.get(t.uid)?.name||'？'))+'さんが引いたカード'}catch{}
  const img=popImg(card,'hero'),chk=card==='check',prog=div('prog',...Array.from({length:card==='ten'?4:3},(_,n)=>txt('span',n?'':'on')));
  const h=div('cardhead k-'+card,div('ph',img,div('phx',...(chk?[]:[txt('small','pop-kicker',who)]),txt('h2','pop-title',cards[card].title.replace(/^👑\s*/,'')))),...(chk?[]:[prog,txt('p','rule',card==='ten'?'心の中で10秒数えて、ぴったりで押そう！\nいちばん遠い人が負け。\n途中で数字は見えなくなるよ。':cards[card].rule)]));
  if(chk){dtHolder=div('dtholder',dtSteps(state.phase==='measuring'?1:dtInEntry?2:3));const hb=el('button','📖');hb.type='button';hb.className='helpbtn';hb.setAttribute('aria-label','説明を読む');hb.onclick=()=>openDtHelp(dtStage||1,false);const hint=txt('span','helphint','📖 タップで説明が読めます');if(performance.now()<dtHintUntil)hint.classList.add('show');h.querySelector('.ph').append(hb);h.append(hint,dtHolder);}
  h.setAttribute('data-g',glyphs[card]||'');return h;}
  function finalUi(){
  const box2=div('settle');box2.append(popImg('check','hero','最終ドリンクタイム'),txt('h3','verdict finH','🥃 最終ドリンクタイム！'));
  if(!drinksReady()||!historyLoaded){box2.append(txt('p','sub','みんなのメーターを集計しています…'));return box2;}
  const done=state.card==='check'&&state.phase==='results',av=p=>avatars[Number(p.slot)]||'🍻';
  const plan=tequilaPlan(allDrinks,ids(),done?state.round+1:state.round+1,done?state.round:previousSettlement(state.round+1));
  if(!done)showImpact(ids().filter(u=>plan[u].count>0),'final');
  box2.append(txt('p','sub',done?'直前の休憩で精算ずみです。おつかれさま！':'最後に、いまのメーターで1回だけ。ライムの人は1杯、いなければ一番多い人（同率は全員）が1杯。'));
  box2.append(div('rows',...[...players].sort((x,y)=>plan[y.uid].tickets-plan[x.uid].tickets).map(p=>{const q=plan[p.uid];return div('row '+(q.count?'lose':'safe'),avImgEl(p),txt('span','who',p.name),shot(q.tickets,'rank'),txt('span','cups',q.count?'🥃 1杯':'セーフ'));})));
  box2.append(txt('p','fine','飲む量は自己申告です。無理せず、水も飲もう 🚰'));
  return box2;
 }
 function paint(){
  if(fin){root.setAttribute('data-card','final');root.setAttribute('data-phase','final');box.className='stage results';box.append(finalUi());ensureAllDrinks();if(host)button('これでゲームを終了する',async()=>{if(window.confirm('全員のゲームを終了します。よろしいですか？'))await set(ref(db,`rooms/${roomId}/meta/state`),'closed');},pending);else box.append(el('p','ホストがゲームを終了するのを待っています。'));return;}
  if(!state){box.append(el('p',host?'ゲームを準備しています…':'ホストのゲーム準備を待っています…'));return;}
  box.className='stage '+state.phase+(state.phase!=='draw'?' art':'');if(state.phase!=='draw'){const _c=state.card||'ten';box.style?.setProperty?.('--art','url("'+artPath(_c)+'")');if(isIcon(_c))box.className+=' icon'}
  if(state.phase!=='draw'&&fxEl?.classList.contains('telopFx'))clearFx();
  const turn=currentTurn(state,players),card=state.card||'ten';root.setAttribute('data-card',card);root.setAttribute('data-phase',state.phase);
  // 上の小さな表示（あと◯ターン・リュック・メーター）と下の説明は、下のバーに移した
  if(state.phase==='draw'){
   showTelop(turn);ensureAllDrinks();
   box.append(div('deckwrap',div('deck',cardBack()),div('deckshadow')),...(isBreak(state.round,turn.order.length)?[el('h2','休憩カード！')]:[]),...(isBreak(state.round,turn.order.length)?[el('p','今回はカードを引かずに、みんなの状態をチェックします。そのあと、たまったメーターを精算します（お助けカードも使えます）。')]:[]));
   if(dev)box.append(devPanel());
   if(turn.uid===uid&&!dev)button('カードを引く',()=>drawNow(turn),pending||!coolReady()||!deckReady());
   else box.append(el('p',`${byUid.get(turn.uid)?.name||'今回の担当'}がカードを引くのを待っています。`));
   dock.append(whoStrip(turn));
   return;
  }
  if(state.phase==='measuring'&&flipRound!==state.round){flipCard(card);return;}
  box.append(cardHead(card));
  if(state.phase==='results'){
   if(card==='danger'||card==='king'){
    const o=dangerOutcome(state);if(!o){box.append(el('p','結果を確認しています…'));return;}
    if(card==='danger'&&o.accepted&&spinRound!==state.round){roulette(o.fate);return;}
   }
   if(card!=='buttons'&&card!=='danger'&&card!=='king'&&card!=='mission'&&players.some(p=>typeof state.results?.[p.uid]!=='number')){box.append(el('p','結果を確認しています…'));return;}
   if(card==='check')ensureAllDrinks();
   if(state.pick&&pickRound!==state.round&&card!=='check'){pickRoulette();return;}
   if(card==='check'){
    root.setAttribute('data-phase','settle');box.append(settlementUi());if(!dtInEntry&&!dtLocked)breakNext();
    return;
   }
   box.append(board(card,turn));
   drinkPanel();nextButton();
   return;
  }
  if(card==='buttons'){
   if(turn.uid!==uid)box.append(el('p',`${byUid.get(turn.uid)?.name}がボタンを押すのを待っています。`));
   else if(typeof own==='number')box.append(el('p','選択済み · 結果を待っています。'));
   else for(let i=0;i<2;i++)button(`❔ ボタン ${i+1}`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),i),pending);
   return;
  }
  if(card==='mission'){
   if(turn.uid!==uid)box.append(el('p',`${byUid.get(turn.uid)?.name}がキス顔に挑戦します。みんなで見届けよう！`));
   else if(typeof own==='number')box.append(el('p','報告済み · 結果を待っています。'));
   else{box.append(el('p','キス顔をやってみせよう（自己申告）。できないときはメーター＋1。'));button('やった！（完了）',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),1),pending);button('できない（メーター＋1）',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),0),pending,'secondary');}
   return;
  }
  if(card==='danger'||card==='king'){dangerUi(turn);return;}
  if(VL.has(card)){
   box.append(el('h3',`${promptLists[card][state.prompt]??'確認中'}`));
   if(typeof own==='number')box.append(el('p','投票済み · 全員の投票を待っています。（誰に入れたかは他の人には見えません）'));
   else{box.append(el('p','当てはまりそうな人に1票。匿名です。'));for(const p of players)button(p.uid===uid?`${p.name}（自分）`:p.name,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),Number(p.slot)),pending);}
   if(host)box.append(el('p',`投票 ${players.filter(p=>typeof answers[p.uid]==='number').length}/${players.length}人`));
   return;
  }
  if(card==='check'||card==='rest'){
   ensureAllDrinks();
   if(card==='check'){
    box.append(podiumBoard());setDtStage(1);
    if(typeof own==='number')box.append(el('p','✓ 確認しました。みんなを待っています。'));
    else button('✓ 結果を確認した',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),0),pending||!drinksReady()||!historyLoaded);
    if(host)box.append(el('p',`確認 ${players.filter(p=>typeof answers[p.uid]==='number').length}/${players.length}人`));
    return;
   }
   box.append(el('h3','今の自分の状態は？'));
   if(typeof own==='number')box.append(el('p','回答済み · みんなの回答を待っています。'));
   else for(const [i,[ic,lab]] of checkStates.entries())button(`${ic} ${lab}`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),i),pending);
   if(host)box.append(el('p',`回答 ${players.filter(p=>typeof answers[p.uid]==='number').length}/${players.length}人`));
   return;
  }
  if(card==='majority'){
   const pair=promptLists[card][state.prompt]||['確認中','確認中'],mind=false,actorName='';
   box.append(el('h3','A：'+pair[0]+'\nB：'+pair[1]));
   if(typeof own==='number')box.append(el('p',mind?'回答済み · みんなの回答を待っています。（答えは結果まで秘密）':'回答済み · みんなの回答を待っています。（結果まで秘密）'));
   else{box.append(el('p',mind?(turn.uid===uid?'あなたの本当の答えを選んでください。みんなが予想します。':`${actorName}の答えを予想してください。`):'自分の答えを選んでください。多数派がメーター＋1。'));
    for(const [i,label] of ['A','B'].entries())button(`${label}：${pair[i]}`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),i),pending);}
   if(host)box.append(el('p',`回答 ${players.filter(p=>typeof answers[p.uid]==='number').length}/${players.length}人`));
   return;
  }
  if(typeof own==='number')box.append(el('p','送信済み · 全員の回答を待っています。'));
  else if(card==='reaction')reactionUi();
  else if(card==='battery'){
   {if(!batteryDraft)batteryDraft='50';const bigN=txt('div','bigNum',batteryDraft+'%'),rg=document.createElement('input');rg.type='range';rg.min='0';rg.max='100';rg.step='1';rg.value=batteryDraft;rg.className='batRange';rg.setAttribute('aria-label','充電残量（％）');rg.disabled=pending;rg.oninput=()=>{batteryDraft=rg.value;bigN.textContent=rg.value+'%';};
   box.append(bigN,rg,txt('p','hint2','👆 つまみを左右にスライドして数字を決めよう\n本当の残量でも、ウソ（ブラフ）でもOK！'));}
   button('充電残量を送信',()=>{const value=Number(batteryDraft);if(!batteryDraft.trim()||!Number.isInteger(value)||value<0||value>100){message('充電残量は0〜100の整数で入力してください。');return;}return set(ref(db,`${base}/answers/${state.round}/${uid}`),value);},pending);
  }else if(card==='tapking'){
   if(tapStart===null){box.append(el('p','START後の5秒間、ボタンを連打！ 少なかった人がメーター＋1。'));button('START（5秒）',async()=>{tapStart=performance.now();tapCount=0;const round=state.round,ms=globalThis.__nqTapMs??5000;tapTimer=setTimeout(async()=>{tapTimer=null;if(dead||state?.round!==round)return;try{await set(ref(db,`${base}/answers/${round}/${uid}`),Math.min(999,tapCount));}catch{message('タップ数を送れませんでした。');}render();},ms);},pending);}
   else{const pad=txt('button','tapbig','TAP！'),cnt=txt('p','tapcount','0回');pad.onpointerdown=(e)=>{e?.preventDefault?.();tapCount++;cnt.textContent=tapCount+'回';};pad.onclick=null;box.append(cnt,pad);}
  }else if(elapsed!==null){box.append(el('p','計測完了。結果を送信してください。'));button('結果を送信',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),elapsed),pending);}
  else if(began!==null){const bn=txt('div','bigNum','0.0'),t0=began,iv=setInterval(()=>{if(!bn.isConnected||began!==t0){clearInterval(iv);return}const e=(performance.now()-t0)/1000;bn.textContent=e<3?e.toFixed(1):'？？？'},50);box.append(txt('p','hint2','数え始めて…'),bn,txt('p','hint2','10秒だと思ったら STOP！'));button('STOP',async()=>{elapsed=Math.min(120000,Math.round(performance.now()-began));began=null;},pending);}
  else{box.append(txt('div','bigNum','10.00'),txt('p','hint2','準備ができたらスタート'));button('START',async()=>{began=performance.now();},pending);}
  if(host)box.append(el('p',`回答 ${players.filter(p=>typeof answers[p.uid]==='number').length}/${players.length}人`));
 }
 const settledAll=()=>players.every(p=>settledMap[p.uid]===true);
 const itemsReady=()=>drinkMap!==undefined&&itemMap!==undefined&&spentMap!==undefined&&grantMap!==undefined&&(Object.keys(itemMap).length>0||grantFailed);
 const freeSlot=kind=>Object.entries(itemMap||{}).find(([k,v])=>v===kind&&spentMap?.[k]===undefined)?.[0];
 const usedInfo=()=>{const e=Object.entries(spentMap||{}).find(([,r])=>r===state?.round);return e?{slot:e[0],kind:itemMap?.[e[0]]}:undefined;};
 function drinkPanel(){
  if(!itemsReady()){box.append(el('p','あなたのお助けを確認しています…'));return;}
  if(winnerNow())box.append(el('p',grantPending()?'お助けを受け取っています…':itemMap['1']!==undefined&&itemMap['2']!==undefined&&grantMap[String(state.round)]===undefined?(state.card==='reaction'?'あなたが最速！':'HEAVEN！')+'ただしお助けは3つまで持てます。':(state.card==='reaction'?'あなたが最速！':'HEAVEN！')+'お助けを1つ獲得しました。'));
    if(!settledMap[uid]){
   const mineNow=drinkAward(state,uid,players);
   if(ownError)button('カウント保存を再試行',()=>settleOwn(),ownBusy);
   else box.append(el('p','あなたのカウントを保存しています…'));
  }else{const mine=drinkMap?.[String(state.round)];box.append(txt('p','mine',typeof mine==='number'?(mine>0?`あなたの今回のメーター：＋${mine}`:'あなたの今回のメーター：なし'):'あなたのメーターは確定しました。'));}
  const waiting=players.filter(p=>!settledMap[p.uid]);
  if(waiting.length){
   box.append(el('p',`確定待ち：${waiting.map(p=>p.name).join('、')}`));
   if(host)button('待たずに進める（未確定の人はお助けなしで受ける）',forceSettle,ownBusy||waiting.every(p=>p.uid===uid),'secondary');
  }
 }
 // Each player records only their own credit; the host writes the plain amount only for players who do not respond.
 async function settleOwn(pick){
  if(dead||ownBusy||state?.phase!=='results'||!itemsReady()||!settledLoaded)return;
  grantOwn();if(grantPending())return;
  if(pick)choice=pick;
  const round=state.round,has=drinkMap[String(round)]!==undefined;
  if(has&&settledMap[uid])return;
  // メーターはそのまま記録し、お助けは精算画面でのみ使う。
  const baseNow=drinkAward(state,uid,players),plan=has?null:{amount:baseNow,spend:null};
  if(!has&&!plan){render();return;}
  ownBusy=true;ownError=false;render();
  try{
   if(plan){
    if(plan.spend!==null)await set(ref(db,`personal/${roomId}/${uid}/spent/${plan.spend}`),round);
    await set(ref(db,`personal/${roomId}/${uid}/drinks/${round}`),plan.amount);
   }
   await set(ref(db,`${base}/settled/${round}/${uid}`),true);
  }catch{ownError=true;message('カウントを保存できませんでした。ホストが先に確定した場合は「使わず受ける」になります。再試行してください。');}
  finally{ownBusy=false;if(!dead)render();}
 }
 async function forceSettle(){
  if(dead||!host||ownBusy||state?.phase!=='results')return;
  const round=state.round,snap=state;ownBusy=true;render();
  await Promise.allSettled(players.filter(p=>p.uid!==uid&&!settledMap[p.uid]).map(async p=>{
   try{await set(ref(db,`personal/${roomId}/${p.uid}/drinks/${round}`),drinkAward(snap,p.uid,players));}catch{}
   await set(ref(db,`${base}/settled/${round}/${p.uid}`),true);
  }));
  ownBusy=false;if(!dead)render();
 }
 function myTickets(){
  if(!state||drinkMap===undefined)return null;
  if(!historyLoaded)return null;
  const pl=pendingPlan(drinkMap,state.card==='check'?state.round:state.round+1);return {now:pl.tickets+pl.carryIn,carryIn:pl.carryIn};
 }
 function statusPanel(){
  const counts={};let total=0;
  for(const [k,v] of Object.entries(itemMap||{}))if(spentMap?.[k]===undefined){counts[v]=(counts[v]||0)+1;total++;}
  const ready=itemMap&&(Object.keys(itemMap).length>0||grantFailed);
  const chips=div('chips',...itemKinds.map(k=>txt('span','chip'+(counts[k]?'':' none'),`${items[k].icon} ${shortName[k]} ×${counts[k]||0}`)));
  const held=itemKinds.filter(k=>counts[k]).map(k=>txt('p','help',`${items[k].icon}${items[k].name}：${items[k].desc}`));
  const more=document.createElement('details');more.className='helpbox';more.append(el('summary','お助けの説明'),...held,...(held.length?[]:[txt('p','help','お助けカードは、休憩のドリンクタイムで使えます。バリアは1杯を無効にします。')]),txt('p','fine','この表示はあなたの画面だけ。実際に飲む必要はありません。'));
  const tk=myTickets();
  const extra=document.createElement('details');extra.className='inventory-details';extra.append(el('summary',ready?'🎒 お助けカード '+total+'/3枚':'🎒 お助けを確認中'),chips,more);
  return div('status',div('ticket-mini',txt('span','label','ショットメーター'),...(tk===null?[txt('b','big','確認中')]:[shot(tk.now,'mini'),txt('b','big',Math.min(tk.now,NOTCHES)+'/'+NOTCHES)]),txt('span','help','ライム(5)で1杯確定')),extra);
 }
 function board(card,turn){
  const detailFor=(p)=>{const v=state.results?.[p.uid];
   if(card==='ten')return typeof v==='number'?(v/1000).toFixed(3)+'秒':'';
   if(card==='battery')return typeof v==='number'?v+'％':'';
   if(card==='tapking')return typeof v==='number'?v+'回':'';
   if(card==='reaction')return typeof v==='number'?(v<REACTION_FAIL?v+'ms':'失敗'):'';
   if(card==='buttons')return p.uid===turn.uid&&typeof v==='number'?`ボタン ${v+1}`:'';
   if(card==='mission')return p.uid===turn.uid&&typeof v==='number'?(v===1?'キス顔 完了！':'パス（できない）'):'';
   if(VL.has(card))return `${Number(state.votes?.[p.slot])||0}票`;
   if(card==='majority'){const pr=promptLists.majority[state.prompt]||[];return typeof v==='number'?`${v===0?'A':'B'}：${pr[v]??''}`:'';}
   if(card==='king'){const o=dangerOutcome(state);return p.uid===o?.actor?'👑王様':p.uid===o?.target?(o.accepted?'従った':'拒否'):'';}
   if(card==='danger'){const o=dangerOutcome(state);return p.uid===o?.actor?'誘った':p.uid===o?.target?(o.accepted?'承諾':'断った'):'';}
   return '';};
  if(card==='check'||card==='rest'){const f=(v)=>checkStates[v]||['❔','不明'];return div('board',txt('h3','verdict','みんなの状態'),txt('p','sub','無理せず、水も飲もう 🚰'),div('rows',...players.map(p=>{const [ic,lab]=f(state.results?.[p.uid]);return div('row safe',txt('span','av',ic),txt('span','who',p.name),txt('span','detail',''),txt('span','cups',lab));})),txt('p','fine','状態は自己申告です。'));}
  const gets=new Set(rewardees(state));
  const rows=players.map(p=>({p,amt:drinkAward(state,p.uid,players),detail:detailFor(p)})).sort((x,y)=>y.amt-x.amt);
  const losers=rows.filter(r=>r.amt>0);
  let verdict=losers.length?`${losers.map(r=>r.p.name).join('・')} の負け！`:'今回は誰も飲みません 🎉';
  let sub='';
  if(card==='battery')sub=`今回は ${state.direction}！`;
  if(card==='tapking')sub='タップが最も少ない人がメーター'+(state.pick?'（同数→ルーレット）':'');
  if(state.pick&&(card==='ten'||card==='battery'))sub=(sub?sub+' ／ ':'')+'同率→ルーレットで決定';
  if(card==='mission')sub=state.results?.[turn.uid]===1?'💋 ミッション成功！ メーターなし':'ミッション失敗… 担当がメーター＋1';
  if(card==='buttons')sub=state.buttonOutcome===1?'今回の担当が対象':'担当以外の全員が対象';
  if(VL.has(card))sub=`お題：${promptLists[card][state.prompt]??''} ／ 得票1位がメーター${state.pick?'（同率→ルーレット）':''}`;
  if(card==='majority'){const nb=players.filter(p=>state.results?.[p.uid]===1).length;sub=`A ${players.length-nb}人 / B ${nb}人 ／ ${state.side===2?'同数！ルーレットで1人':'多数派がメーター'}`;}
  if(card==='king'){const o=dangerOutcome(state);sub=o.accepted?'👑 命令に従いました！ メーターなし':'🙅 命令を拒否！ 拒否した人がメーター＋2';}
  if(card==='danger'){const o=dangerOutcome(state);sub=!o.accepted?'断られた！ 誘った人がメーター':o.fate==='HEAVEN'?'👼 HEAVEN！ 2人ともお助けGET':'🔥 HELL！ 2人ともメーター＋2';}
  if(card==='reaction'&&!gets.size)sub='全員失敗！ お助けなし';
  return div('board',txt('h3','verdict',verdict),...(sub?[txt('p','sub',sub)]:[]),
   div('rows',...rows.map(r=>div('row '+(r.amt>0?'lose':'safe'),avImgEl(r.p),txt('span','who',r.p.name),txt('span','detail',[r.detail,gets.has(r.p.uid)?'🎁お助けGET':''].filter(Boolean).join(' · ')),txt('span','cups',r.amt>0?`🥃 メーター＋${r.amt}`:'セーフ')))),
   txt('p','fine','8ターンごとにドリンクタイム。ライム（メーター5）の人は1杯。お助けカードは受付の30秒間に使えます。'));
 }

 // ---- break turn: ticket settlement (one tequila) and hand-used helper cards --------------------------------
 const ids=()=>players.map(p=>p.uid);
 const pname=id=>byUid.get(id)?.name||'確認中';
 const drinksReady=()=>ids().every(u=>allDrinks[u]!==undefined);
 function ensureAllDrinks(){
  if(allDrinksStops.length)return;
  for(const u of ids())allDrinksStops.push(onValue(ref(db,`personal/${roomId}/${u}/drinks`),snap=>{allDrinks[u]=snap.val()||{};render();maybeSettlement();},()=>{allDrinks[u]={};message('みんなのメーターを取得できませんでした。再接続してください。');render();}));
 }
 const heldKinds=()=>itemKinds.filter(k=>freeSlot(k)!==undefined);
 // tequila chains: tqMap[owner][j] = {b,c,x,a}
 const chainOf=(o,j)=>tqMap?.[o]?.[j]||{};
 async function useItem(kind,owner,j,target){
  const round=state.round,slot=freeSlot(kind);if(slot===undefined||state?.card!=='check'||state.phase!=='results')return;
  const chain=chainOf(owner,j),ch=itemChoices(uid,owner,chain);if(!ch[kind])return;
  const key=kind==='angel'?'a':kind==='cute'?'c':(owner===uid&&!chain.c?'b':'x'),value=kind==='cute'?target:uid;
  await set(ref(db,`${base}/tq/${round}/${owner}/${j}/${key}`),value);
  cuteMode=null;
  await set(ref(db,`personal/${roomId}/${uid}/spent/${slot}`),round);
 }
  function drinkers(plan){const out=[];for(const p of players)for(let j=0;j<plan[p.uid].count;j++){const o=tequilaOutcome(p.uid,chainOf(p.uid,j));if(!o.cancelled&&o.drinker&&!out.includes(o.drinker))out.push(o.drinker);}return out;}
 const dtSteps=n=>div('dtsteps',...['結果発表','お助け','イッテキーラ'].map((s,i)=>txt('span',i+1===n?'on':i+1<n?'done':'',`${i+1} ${s}`)));
 const angelMs=()=>globalThis.__nqAngelMs??10000;
 function startAngel(){if(angelStart||!angelReady||dtHelpEl||dead)return;angelStart=performance.now();setTimeout(()=>{if(!dead)render();},angelMs()+80);render();}
 async function doAngel(c){
  angelChoose=false;
  try{await useItem('angel',c.p.uid,c.j);await set(ref(db,`${base}/dg/${state.round}/${uid}`),'s');}catch{message('身代わりを使えませんでした。もう一度試してください。');}
  render();
 }
 function playAngel(){
  if(dead||bot){angelQ=[];angelPlaying=false;return;}
  const x=angelQ.shift();if(!x){angelPlaying=false;return;}angelPlaying=true;
  fxOverlay('angelFx',`<div class="aBox"><div class="aBig">ちょっと待ったー！</div><div class="aSub">${esc(clipName(pname(x)))}が<br>代わりに飲むわ！</div></div>`,{autoMs:2600});
  try{navigator.vibrate?.([220,80,220]);}catch{}
  setTimeout(playAngel,2700);
 }
 function podiumBoard(){
  const w=div('board podiumBoard');w.append(txt('h3','verdict','🥃 結果発表'));
  if(!drinksReady()||!historyLoaded){w.append(txt('p','sub','みんなのメーターを集計しています…'));return w;}
  const plan=tequilaPlan(allDrinks,ids(),state.round,previousSettlement()),sorted=[...players].sort((x,y)=>plan[y.uid].tickets-plan[x.uid].tickets);
  const col=(p,i)=>{const q=plan[p.uid];return div('pcol p'+(i+1)+(q.count?' lose':'')+(q.lime?' limeglow':''),avImgEl(p),txt('b','',p.uid===uid?`${p.name}（あなた）`:p.name),shot(q.tickets,'rank big'));};
  const top=sorted.slice(0,3),ord=top.length>=3?[1,0,2]:top.length===2?[1,0]:[0];
  w.append(div('pod pod'+top.length,...ord.map(i=>col(top[i],i))));
  if(sorted.length>3)w.append(div('rows',...sorted.slice(3).map((p,k)=>div('row safe',avImgEl(p),txt('span','who',`${k+4}位 ${p.name}`),shot(plan[p.uid].tickets,'rank')))));
  w.append(txt('p','fine','メーターの順位です。いちばん多い人（ライムの人は全員）が飲む候補。お助けカードを使ったあとに、飲む人が最終的に決まります。'));
  return w;
 }
 function rankBoard(){const w=div('board');w.append(txt('h3','verdict','🥃 結果発表'));
  if(!drinksReady()||!historyLoaded){w.append(txt('p','sub','みんなのメーターを集計しています…'));return w;}
  const plan=tequilaPlan(allDrinks,ids(),state.round,previousSettlement()),av=p=>avatars[Number(p.slot)]||'🍻';
  w.append(div('rows',...[...players].sort((x,y)=>plan[y.uid].tickets-plan[x.uid].tickets).map((p,i)=>div('row '+(plan[p.uid].count?'lose':'safe'),avImgEl(p),txt('span','who',`${i+1}位 ${p.name}`),shot(plan[p.uid].tickets,'rank'),txt('span','cups',plan[p.uid].count?(plan[p.uid].lime?'🍋 ライム':'👑 一番多い'):'')))));
  w.append(txt('p','fine','いちばん多い人（ライムの人は全員）にイッテキーラ。全員が「結果を確認した」を押すと、お助けカード受付（30秒）が始まります。'));return w;}
 async function botAct(skipMark){
  const held2=heldKinds().filter(k=>k!=='angel');if(!held2.length||state?.card!=='check'||state.phase!=='results')return skipMark();
  const plan=tequilaPlan(allDrinks,ids(),state.round,previousSettlement()),bp=globalThis.__nqBotPlan?.[uid],P={barrier:.6,cute:.5,angel:.35,...(globalThis.__nqBotProb||{})};
  const want=bp?bp.filter(x=>!String(x).startsWith('angel')):['barrier','cute'];if(bp&&!want.length)return skipMark();
  for(const w of want){const [k,tg]=String(w).split('@');
   for(const p of players)for(let j=0;j<plan[p.uid].count;j++){
    const ch=itemChoices(uid,p.uid,chainOf(p.uid,j));
    if(ch[k]&&held2.includes(k)&&(bp||Math.random()<P[k])){
     const others=players.filter(q=>q.uid!==uid),target=k==='cute'?(tg||others[Math.floor(Math.random()*others.length)].uid):undefined;
     if(bp)bp.splice(bp.indexOf(w),1);
     try{await useItem(k,p.uid,j,target);}catch{}return;
    }}}
  if(bp){if(++botTries>=8)return skipMark();botTimer=setTimeout(()=>{botTimer=null;if(!dead)botAct(skipMark);},1500*(globalThis.__nqNpcMs??1));return;}
  if(++botTries>=2)return skipMark();
  render();
 }
 function settlementUi(){
  const box2=div('settle ddrink');dtInEntry=false;
  if(!drinksReady()||!historyLoaded||!itemsReady()){box2.append(popImg('settle','hero','ドリンクタイム'),txt('h3','verdict','🥃 ドリンクタイム！'),txt('p','sub','みんなのメーターを集計しています…'));return box2;}
  const plan=tequilaPlan(allDrinks,ids(),state.round,previousSettlement()),av=p=>avatars[Number(p.slot)]||'🍻';
  const total=ids().reduce((a,u)=>a+plan[u].count,0),dr=drinkers(plan),anyLime=ids().some(u=>plan[u].lime);
  if(dtRound!==state.round){dtRound=state.round;dtStep='entry';entryStart=performance.now();clearInterval(cdTimer);extUntil=0;dtWroteKey='';}
  const ENTRY_MS=globalThis.__nqEntryMs??30000,EXT_MS=globalThis.__nqExtMs??10000,held=heldKinds(),heldE=held.filter(k=>k!=='angel'),nowT=performance.now();
  const cuteAll=Object.values(tqMap||{}).flatMap(o=>Object.values(o||{}));
  if(!extUntil&&cuteAll.some(c=>c&&c.c)){extUntil=nowT;setTimeout(()=>{if(!dead)render();},EXT_MS+80);}
  const deadline=Math.max(entryStart+ENTRY_MS,extUntil?extUntil+EXT_MS:0),cuteHold=!!extUntil&&nowT<extUntil+EXT_MS&&cuteAll.some(c=>c&&c.c&&!c.x&&!c.a);
  const myMark=dtMap[uid],marks=players.map(p=>dtMap[p.uid]),noHolder=marks.every(Boolean)&&!marks.includes('h')&&!cuteHold;
  const skipMark=()=>set(ref(db,`${base}/dt/${state.round}/${uid}`),'s').catch(()=>{});
  const wkey=state.round+':'+(heldE.length?'h':'n');
  if(dtWroteKey!==wkey&&!myMark){dtWroteKey=wkey;set(ref(db,`${base}/dt/${state.round}/${uid}`),heldE.length?'h':'n').catch(()=>{});}
  const actionable=heldE.some(k=>players.some(p=>{for(let j=0;j<plan[p.uid].count;j++)if(itemChoices(uid,p.uid,chainOf(p.uid,j))[k])return true;return false;}));
  const inEntry=!!dr.length&&dtStep==='entry'&&nowT<deadline&&!noHolder;
  if(bot&&inEntry&&myMark==='h'&&!botTimer){const sc=globalThis.__nqNpcMs??1;botTimer=setTimeout(()=>{botTimer=null;if(!dead&&dtStep==='entry'&&state?.card==='check'&&state.phase==='results')botAct(skipMark);},(1200+Math.random()*3800)*sc);}
  if(!inEntry&&dtStep==='entry')dtStep='tq';
  dtInEntry=inEntry;

  const finalPage=()=>{
   const f=div('settle ddrink final');
   const IMPACT_MS=globalThis.__nqImpactMs??4300,ANG=angelMs();
   const cups=[];for(const p of players)for(let j=0;j<plan[p.uid].count;j++){const ch=chainOf(p.uid,j);cups.push({p,j,ch,out:tequilaOutcome(p.uid,ch)});}
   const amDrinker=dr.includes(uid),cands=cups.filter(c=>!c.out.cancelled&&c.out.drinker&&!c.ch.a&&!amDrinker&&c.out.drinker!==uid&&itemChoices(uid,c.p.uid,c.ch).angel);
   const canUse=held.includes('angel')&&cands.length>0;lastAngelCands=cands;
   const myDg=dgMap[uid],wk=state.round+':'+(canUse?'y':'n');
   if(dgWroteKey!==wk&&!myDg){dgWroteKey=wk;set(ref(db,`${base}/dg/${state.round}/${uid}`),canUse?'y':'n').catch(()=>{});}
   if(myDg==='y'&&!canUse&&dgSKey!==state.round){dgSKey=state.round;set(ref(db,`${base}/dg/${state.round}/${uid}`),'s').catch(()=>{});}
   // telop for 身代わり（最初の描画では、すでにあるものは静かに記録するだけ）
   for(const c of cups)if(c.ch.a){const k=c.p.uid+':'+c.j;if(!angelSeen.has(k)){angelSeen.add(k);if(angelSched)angelQ.push(c.ch.a);}}
   if(angelQ.length&&!angelPlaying)playAngel();
   if(!angelSched){angelSched=true;setTimeout(()=>{angelReady=true;startAngel();},IMPACT_MS);}
   const marks3=players.map(p=>dgMap[p.uid]),skipWin=marks3.every(Boolean)&&!marks3.includes('y');
   const left=angelStart?Math.max(0,angelStart+ANG-performance.now()):ANG,open=dr.length>0&&!skipWin&&left>0;
   const usable=open&&!!angelStart&&canUse;
   dtLocked=open;angelUsable=usable;
   document.getElementById('tabHelp')?.classList.toggle('glowTab',usable);
   const uniq=[...new Map(cands.map(c=>[c.out.drinker,c])).values()];
   const tap=()=>{if(!usable)return;if(uniq.length===1)doAngel(uniq[0]);else{angelChoose=true;render();}};angelTapFn=tap;
   if(bot&&usable&&myDg==='y'&&!angelBotTimer){const sc=globalThis.__nqNpcMs??1;angelBotTimer=setTimeout(()=>{angelBotTimer=null;if(dead)return;const bp=globalThis.__nqBotPlan?.[uid],want=bp?bp.includes('angel'):Math.random()<(globalThis.__nqBotProb?.angel??.4),cs=lastAngelCands;if(want&&cs.length)doAngel(cs[Math.floor(Math.random()*cs.length)]);else set(ref(db,`${base}/dg/${state.round}/${uid}`),'s').catch(()=>{});},(1000+Math.random()*4000)*sc);}
   const logo=document.createElement('img');logo.src='gold/drinktime.webp';logo.alt='';logo.setAttribute('draggable','false');
   f.append(div('ittLogo',logo));
   if(!dr.length){f.append(txt('h3','verdict',total?'全員セーフ！':'今回は、誰も飲まない！'),txt('p','fine','乾杯だけして、次へ。メーターは0に戻ります。'));}
   else{
    showImpact(dr,'r'+state.round);
    const why={};for(const c of cups){const o=c.out;if(!o.cancelled&&o.drinker)why[o.drinker]=o.angel?'👼 身代わりで飲む':o.via?`🥺 ${pname(o.via)}からなすりつけられた`:(plan[c.p.uid].lime?'🍋 ライム（メーター5）':'👑 メーターが一番多い');}
    f.append(txt('h3','verdict',dr.length===1?'今回飲む人は…':`今回飲む人は…（${dr.length}人）`),div('dhero n'+dr.length,...dr.map(u=>div('hcol',avImgEl(byUid.get(u)),txt('b','',pname(u)+(u===uid?'（あなた）':(dr.length>1?'':'さん'))),txt('span','why',why[u]||'')))));
    if(open){
     const R=17,C=2*Math.PI*R,ring=div('aring');
     ring.innerHTML=`<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17"></circle><circle class="pr" cx="20" cy="20" r="17" style="stroke-dasharray:${C.toFixed(1)}"></circle></svg><b></b>`;
     const pr=ring.querySelector('.pr'),num=ring.querySelector('b');
     const upd=()=>{const l=angelStart?Math.max(0,angelStart+ANG-performance.now()):ANG;num.textContent=Math.ceil(l/1000);pr.style.strokeDashoffset=(C*(1-l/ANG)).toFixed(1);if(angelStart&&l<=0){clearInterval(cdTimer);if(!dead)render();}};
     upd();clearInterval(cdTimer);cdTimer=setInterval(upd,200);
     f.append(ring,txt('p','fine',canUse?'👼 身代わりで代われます。光ったカードを押そう。':'身代わりを持つ人が、いま代われるかもしれません。'));
    }else f.append(txt('p','confirmed','✓ 確定！'));
   }
   if(angelChoose&&usable)f.append(div('angelPick',txt('p','help','誰の代わりに飲む？'),...uniq.map(c=>{const b=el('button',`${pname(c.out.drinker)}の代わり`);b.type='button';b.onclick=()=>doAngel(c);return b;}),(()=>{const b=el('button','やめる');b.type='button';b.className='secondary';b.onclick=()=>{angelChoose=false;render();};return b;})()));
   const det=document.createElement('details');det.className='rk';det.append(el('summary','順位と経過を見る'));
   det.append(div('rows',...[...players].sort((x,y)=>plan[y.uid].tickets-plan[x.uid].tickets).map(p=>{const q=plan[p.uid];return div('row '+(q.count?'lose':'safe'),avImgEl(p),txt('span','who',p.name),shot(q.tickets,'rank'),txt('span','cups',q.count?'🥃 1杯':'セーフ'));})));
   for(const c of cups){const log=[];if(c.ch.b)log.push(`🛡️ ${pname(c.ch.b)}がバリアを使った`);if(c.ch.c)log.push(`🥺 ${c.p.name}が${pname(c.ch.c)}になすりつけた`);if(c.ch.x)log.push(`🛡️ ${pname(c.ch.x)}がバリアで防いだ`);if(c.ch.a)log.push(`👼 ${pname(c.ch.a)}が代わりに飲む`);if(log.length)det.append(div('tqcard '+(c.out.cancelled?'safe':'lose'),txt('p','verdict',`🥃 ${c.p.name}に1杯`),...log.map(l=>txt('p','help',l))));}
   f.append(det);
   const counts={};for(const [k,v] of Object.entries(itemMap||{}))if(spentMap?.[k]===undefined)counts[v]=(counts[v]||0)+1;
   f.append(div('dockTiles',div('tiles',...itemKinds.map(k=>{const n=counts[k]||0,tl=div('tile'+(n?'':' dim')+(k==='angel'&&usable?' glow':''),txt('i','',items[k].icon),txt('s','',shortName[k]),txt('em','','×'+n));if(k==='angel'&&usable)tl.onclick=tap;return tl;}))));
   return f;
  };
  setDtStage(inEntry?2:3);
  if(!inEntry)return finalPage();
  if(inEntry){
   box2.append(popImg('settle','hero','お助けカード受付'),txt('h3','verdict','🎁 お助けカード受付'),txt('p','sub',`イッテキーラが来る人：${dr.map(pname).join('・')}`));
   const cd=div('cdBig',''),cdn=txt('p','cdNote','');box2.append(cd,cdn);
   const upd=()=>{const dl=Math.max(entryStart+ENTRY_MS,extUntil?extUntil+EXT_MS:0),left=Math.max(0,Math.ceil((dl-performance.now())/1000));cd.textContent=left;cdn.textContent=extUntil&&left<=Math.ceil(EXT_MS/1000)?'🥺 なすりつけ発生！ 防ぎたい人は、いま使えます':'';if(left<=0){clearInterval(cdTimer);if(!dead){dtStep='tq';render();}}};
   upd();clearInterval(cdTimer);cdTimer=setInterval(upd,500);
  }
  if(total)box2.append(txt('p','sub',anyLime?'ライム（メーター5）が付いた人は1杯確定。':'ライムなし。一番メーターが多い人が1杯（同率1位は全員1杯）。'));
  box2.append(div('rows',...[...players].sort((x,y)=>plan[y.uid].tickets-plan[x.uid].tickets).map(p=>{const q=plan[p.uid];return div('row '+(q.count?'lose':'safe'),avImgEl(p),txt('span','who',p.name),shot(q.tickets,'rank'),txt('span','cups',q.count?'🥃 1杯':'セーフ'));})));
  if(!total){box2.append(txt('p','fine','乾杯だけして、次へ。メーターは0に戻ります。'));return box2;}
  box2.append(txt('p','fine',inEntry?'受付が終わると、イッテキーラ発表です。':'飲んだら、次へ。メーターは休憩のあと0に戻ります。'));
  // helper cards: one card = one tequila
  const mk=(act,label,fn,cls='')=>{const b=el('button',label);if(cls)b.className=cls;b.disabled=pending;b.onclick=async()=>{if(pending||dead)return;pending=true;render();try{await fn();}catch{message('お助けを使えませんでした。もう一度試してください。');}finally{pending=false;if(!dead)render();}};dockButtons++;act.append(b);};
  const list=div('tqlist');
  for(const p of players)for(let j=0;j<plan[p.uid].count;j++){
   const chain=chainOf(p.uid,j),out=tequilaOutcome(p.uid,chain),card=div('tqcard '+(out.cancelled?'safe':'lose'));
   card.append(txt('p','verdict',`🥃 ${p.name}に1杯`));
   const log=[];
   if(chain.b)log.push(`🛡️ ${pname(chain.b)}がバリアを使った！`);
   if(chain.c)log.push(`🥺 ${p.name}が、${pname(chain.c)}になすりつけた！`);
   if(chain.x)log.push(`🛡️ ${pname(chain.x)}がバリアで防いだ！`);
   if(chain.a)log.push(`👼 ${pname(chain.a)}が代わりに飲んであげる！`);
   if(log.length)card.append(...log.map(l=>txt('p','help',l)));
   card.append(txt('p','sub',out.cancelled?'無効になりました 🎉':`飲む人：${pname(out.drinker)}`));
   if(heldE.length&&inEntry){
    const ch=itemChoices(uid,p.uid,chain),act=div('acts'),key=p.uid+':'+j;
    if(ch.barrier&&held.includes('barrier'))mk(act,'🛡️ バリアを使う（この1杯を無効）',()=>useItem('barrier',p.uid,j),'glow');
    if(ch.cute&&held.includes('cute')){
     if(cuteMode!==key)mk(act,'🥺 なすりつけ（この1杯を他の人へ）',async()=>{cuteMode=key;},'glow');
     else{act.append(txt('p','help','誰になすりつけますか？'));for(const q of players)if(q.uid!==uid)mk(act,`${q.name}に`,()=>useItem('cute',p.uid,j,q.uid));mk(act,'やめる',async()=>{cuteMode=null;},'secondary');}
    }
    if(act.children.length)card.append(act);
   }
   list.append(card);
  }
  box2.append(list);
  if(inEntry){
   const panel=heldE.length?div('helppanel',txt('h4','','🎁 お助けカードが使えます！'),txt('p','fine','1枚で1杯分。使うかどうかは自由です。受付は30秒間だけ！')):div('helppanel',txt('h4','','🎁 お助けカード受付中'),txt('p','fine','持っている人が、いま使えます。あなたはお助けカードを持っていません。'));
   for(const k of heldE){
    const who=k==='barrier'?'自分に1杯が来た人が使えます':k==='cute'?'自分の1杯を他の人へ（1杯につき1回、相手もバリアで防げます）':'飲む人以外が使えます（先に押した人が代わります）';
    panel.append(txt('p','help',`${items[k].icon} ${items[k].name}：${items[k].desc}（${who}）`));
   }
   box2.append(panel);
   if(heldE.length){if(myMark==='s')box2.append(txt('p','fine','✓ 選び終わりました。みんなを待っています。'));else button('今回は使わない',async()=>{await skipMark();},pending,'secondary');}
  }
  return box2;
 }
 function flipCard(card){
  const ms=globalThis.__nqFlipMs??3000;
  if(!flipTimer){flipStart=performance.now();const round=state.round;flipTimer=setTimeout(()=>{flipTimer=null;if(dead)return;flipRound=round;render();},ms);}
  const c=div('flipcard',div('face back',cardBack()),div('face front k-'+card,cardFace(card)));
  c.style.animationDelay=-Math.max(0,performance.now()-flipStart)+'ms';
  const rays=div('dfx-rays'),fx=div('drawfx',rays);for(let i=0;i<22;i++){const sp=el('i');sp.className='dfx-sp';const an=Math.random()*6.283,r=80+Math.random()*130;sp.style.setProperty('--dx',Math.cos(an)*r+'px');sp.style.setProperty('--dy',Math.sin(an)*r+'px');sp.style.animationDelay=(-Math.max(0,performance.now()-flipStart)+1400+Math.random()*150)+'ms';fx.append(sp);}
  rays.style.animationDelay=c.style.animationDelay;
  const gl=div('dfx-glow');gl.style.animationDelay=c.style.animationDelay;
  const pr=promptLists[card]?.[state.prompt],cap=div('flipcap',txt('b','',cards[card].title.replace(/^👑\s*/,'')),...(pr?[txt('span','pr',pr)]:[]));cap.style.animationDelay=c.style.animationDelay;
  const fw=div('flipwrap',gl,c,cap);fw.onclick=()=>{clearTimeout(flipTimer);flipTimer=null;if(dead)return;flipRound=state.round;render();};
  box.classList.add('flipping');
  box.append(txt('h3','verdict','カードが引かれた！'),fw,fx);
 }
 function pickRoulette(){
  const ms=globalThis.__nqPickMs??3400;
  if(!pickTimer){const round=state.round;pickTimer=setTimeout(()=>{pickTimer=null;if(dead)return;pickRound=round;render();},ms);}
  const n=players.length,idx=Math.max(0,players.findIndex(p=>p.uid===state.pick)),total=n*5+idx+1,items=[];
  for(let i=0;i<total;i++)items.push(txt('span','pickitem',players[i%n].name));
  const reel=div('pickreel',...items);reel.style.setProperty('--stop',(-(total-1)*60)+'px');
  box.append(txt('h3','verdict','同率！ルーレットで決定'),div('pickwin',reel));
 }
 function roulette(fate){
  const spinMs=globalThis.__nqSpinMs??3200;
  if(!spinTimer){spinStart=performance.now();const round=state.round;spinTimer=setTimeout(()=>{spinTimer=null;if(dead)return;spinRound=round;render();},spinMs);}
  const wheel=div('wheel spinning',txt('span','h1','HEAVEN'),txt('span','h2','HELL'));
  wheel.style.setProperty('--stop',(1800+(fate==='HEAVEN'?270:90))+'deg');
  wheel.style.animationDelay=-Math.max(0,performance.now()-spinStart)+'ms';
  box.append(txt('h3','verdict','運命のルーレット'),div('rwrap',txt('div','rpointer','▼'),wheel),txt('p','sub','回転中…'));
 }
 function dangerUi(turn){
  const actor=turn.uid,name=id=>byUid.get(id)?.name||'確認中',target=typeof invite==='number'?players.find(p=>Number(p.slot)===invite)?.uid:undefined;
  const king=state.card==='king';
  if(king){
   if(actor===uid){
    if(typeof own!=='number'){box.append(el('p','👑 あなたが王様！ 命令する相手を1人選んで、声に出して命令しよう。拒否されると相手がメーター＋2。'));for(const p of players)if(p.uid!==uid)button(`${p.name}に命令する`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),Number(p.slot)),pending);}
    else box.append(el('p',target?`${name(target)}に命令しました。返事を待っています。`:'命令を送っています…'));
   }else if(target===uid){
    if(typeof own!=='number'){box.append(el('h3',`👑 ${name(actor)}王様の命令です`),el('p','命令を聞いて、従うか拒否するか選ぼう。拒否するとあなたがメーター＋2。'));button('従う',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),1),pending);button('拒否する（メーター＋2）',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),0),pending,'secondary');}
    else box.append(el('p','返事を送りました。結果を待っています。'));
   }else box.append(el('p',target?`${name(actor)}王様が${name(target)}に命令中。返事待ち…`:`${name(actor)}王様が命令する相手を選んでいます…`));
   if(host&&target&&target!==uid&&typeof answers[target]!=='number')button(`${name(target)}を「拒否」扱いにして進める`,()=>set(ref(db,`${base}/answers/${state.round}/${target}`),0),pending,'secondary');
   return;
  }
  if(actor===uid){
   if(typeof own!=='number'){box.append(el('p','タイプの人を1人選んで、声に出して誘おう。断られたらあなたがメーター＋1。'));for(const p of players)if(p.uid!==uid)button(`${p.name}を誘う`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),Number(p.slot)),pending);}
   else box.append(el('p',target?`${name(target)}を誘いました。返事を待っています。`:'誘いを送っています…'));
  }else if(target===uid){
   if(typeof own!=='number'){box.append(el('h3',`${name(actor)}があなたを誘っています`),el('p','承諾するとルーレット。HEAVENは2人ともお助け、HELLは2人ともメーター＋2。断ると誘った人がメーター＋1（あなたは罰なし）。'));button('承諾する',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),1),pending);button('断る',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),0),pending,'secondary');}
   else box.append(el('p','返事を送りました。結果を待っています。'));
  }else box.append(el('p',target?`${name(actor)}が${name(target)}を誘っています。返事待ち…`:`${name(actor)}が誰かを誘っています…`));
  if(host&&target&&target!==uid&&typeof answers[target]!=='number')button(`${name(target)}を「断った」扱いにして進める`,()=>set(ref(db,`${base}/answers/${state.round}/${target}`),0),pending,'secondary');
 }
 function rxClear(){if(rx){rx.timers.forEach(clearTimeout);}rx=null;}
 async function rxSubmit(value){
  if(dead||!rx||rx.done)return;rx.done=true;rx.timers.forEach(clearTimeout);const round=state.round;
  try{await set(ref(db,`${base}/answers/${round}/${uid}`),value);}catch{rx.done=false;message('回答を送れませんでした。もう一度押してください。');}
  render();
 }
 function reactionUi(){
  if(!rx)rx={stage:'idle',timers:[],done:false,shapes:null,t0:0};
  if(rx.done){box.append(el('p','結果を送信しています…'));return;}
  if(rx.stage==='idle'){
   box.append(el('p','開始を押して、ハートが出たら素早くタップ。'));
   const b=el('button','開始');b.onclick=()=>{if(!rx||rx.stage!=='idle')return;rx.stage='wait';rx.timers.push(setTimeout(()=>{if(!rx||rx.done)return;const count=[1,4,4,4,6][Math.min(4,Math.floor(Math.random()*5))],pick=a=>a[Math.min(a.length-1,Math.floor(Math.random()*a.length))],heartColor=pick(['pink','blue']),shapes=[{symbol:'♥',heart:true,color:heartColor}];
     for(let i=1;i<count;i++)shapes.push({symbol:['●','▲','■','◆','★'][i-1],heart:false,color:pick(['pink','pink','blue'])});
     for(let i=shapes.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shapes[i],shapes[j]]=[shapes[j],shapes[i]];}
     rx.shapes=shapes;rx.stage='go';rx.t0=performance.now();rx.timers.push(setTimeout(()=>rxSubmit(REACTION_FAIL),REACTION_FAIL));render();},800+Math.floor(Math.random()*1400)));render();};
   box.append(b);return;
  }
  if(rx.stage==='wait'){box.append(el('p','待って…（出る前に押すと失敗）'));const b=el('button','待って…');b.onclick=()=>rxSubmit(REACTION_FAIL);box.append(b);return;}
  box.append(el('p','ハートをタップ！'));
  const grid=el('div','');grid.className='shape-grid';
  for(const shape of rx.shapes){const b=el('button',shape.symbol);b.className='shape '+shape.color;b.setAttribute('aria-label',shape.heart?'ハート':'ダミー');b.onclick=()=>{if(!rx||rx.done)return;const ms=Math.round(performance.now()-rx.t0);rxSubmit(shape.heart&&ms<REACTION_FAIL?ms:REACTION_FAIL);};grid.append(b);}
  box.append(grid);
 }
 const winnerNow=()=>rewardees(state).includes(uid);
 const grantPending=()=>{if(!winnerNow()||grantMap===undefined||itemMap===undefined)return false;const g=grantMap[String(state.round)];if(g===undefined)return itemMap['1']===undefined||itemMap['2']===undefined;return itemMap[String(g)]===undefined;};
 async function grantOwn(){
  if(dead||grantBusy||state?.phase!=='results'||!itemsReady()||settledMap[uid]||!grantPending())return;
  const round=state.round,g=grantMap[String(round)];let slot=g;
  if(g===undefined)slot=itemMap['1']===undefined?1:2;
  grantBusy=true;
  try{if(g===undefined)await set(ref(db,`personal/${roomId}/${uid}/grants/${round}`),slot);await set(ref(db,`personal/${roomId}/${uid}/items/${slot}`),drawItem());}
  catch{message('お助けを受け取れませんでした。再接続してください。');}
  finally{grantBusy=false;if(!dead)render();}
 }
 async function settle(){
  if(dead||!host||settling||state?.phase!=='measuring')return;
  const actor=currentTurn(state,players).uid,buttons=state.card==='buttons',mission=state.card==='mission',king=state.card==='king',danger=state.card==='danger'||king;
  let results,fate=null;
  if(danger){
   const a=answers[actor],t=typeof a==='number'?players.find(p=>Number(p.slot)===a):null;
   if(!t||typeof answers[t.uid]!=='number')return;
   results={[actor]:a,[t.uid]:answers[t.uid]};if(!king&&answers[t.uid]===1)fate=Math.random()<0.5?'HEAVEN':'HELL';
  }else if(mission){if(typeof answers[actor]!=='number')return;}else if(buttons?(!buttonDeck||typeof answers[actor]!=='number'):!players.every(p=>typeof answers[p.uid]==='number'))return;
  let votes=null,topVotes=null;
  if(VL.has(state.card)){const c={};for(const p of players)c[p.slot]=0;for(const p of players)c[answers[p.uid]]=(c[answers[p.uid]]||0)+1;votes=c;topVotes=Math.max(...Object.values(c));}
  let side=null;
  if(state.card==='majority'){const S=players.reduce((a,p)=>a+answers[p.uid],0),N=players.length;side=2*S===N?2:2*S>N?1:0;}
  let pick=null;
  settling=true;const round=state.round,direction=state.card==='battery'?drawDirection():null,buttonOutcome=buttons?buttonDeck[answers[actor]]:null;
  if(!danger)results=buttons||mission?{[actor]:answers[actor]}:Object.fromEntries(players.map(p=>[p.uid,answers[p.uid]]));
  if(tieCards.includes(state.card)&&(state.card!=='majority'||side===2)){const probe={...state,phase:'results',results,...(direction?{direction}:{}),...(votes?{votes,topVotes}:{}),...(side!==null?{side}:{})};const tied=tiedTargets(probe,players);if(tied.length>1)pick=tied[Math.floor(Math.random()*tied.length)];}
  try{await runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='measuring'?{...s,phase:'results',results,...(pick?{pick}:{}),...(direction?{direction}:{}),...(buttons?{buttonOutcome}:{}),...(fate?{fate}:{}),...(votes?{votes,topVotes}:{}),...(side!==null?{side}:{})}:undefined,{applyLocally:false});}
  catch{message('集計を送れませんでした。ホストは再読み込みして再接続してください。');}
  finally{settling=false;}
 }
 stops.push(onValue(ref(db,base+'/deck'),v=>{const d=v.val()||{};deckSeed=typeof d.seed==='number'?d.seed:null;deckMind=mindFromText(d.mind);deckDrawn=normDrawn(d.drawn);render();},()=>{deckSeed=null;message('カードの記録を取得できませんでした。ルールの反映と再接続を確認してください。');}));
 stops.push(onValue(ref(db,base+'/tq'),v=>{tqHist=v.val()||{};tqHistLoaded=true;render();},()=>{tqHist={};tqHistLoaded=false;}));
 stops.push(onValue(ref(db,base+'/nv'),v=>{settlementHistory=v.val()||{};historyLoaded=true;render();maybeSettlement();},()=>{historyLoaded=false;message('精算履歴を取得できませんでした。再接続してください。');}));
 stops.push(onValue(ref(db,base+'/fin'),v=>{fin=v.val()===true;if(fin)ensureAllDrinks();render();},()=>{}));
 stops.push(onValue(ref(db,base+'/state'),snap=>{
  state=snap.val();if(state?.card==='mission'&&Array.isArray(state.order)){const a=state.order[(state.round-1)%state.order.length];if(a&&!missionDone.has(a)){missionDone.add(a);saveSeen();}}if(state?.card){lastCard=state.card;if(state.round>countedRound&&ALL_CARDS.includes(state.card)){countedRound=state.round;if(SOLO_CARDS.includes(state.card))soloAt[state.card]=state.round;else specialSeen.add(state.card);const left=LAP_CARDS.filter(c=>!specialSeen.has(c)),n=state.order?.length||1,nr=isBreak(state.round+1,n)?state.round+2:state.round+1,nextA=state.order?.[(nr-1)%n];if(!left.length||(left.length===1&&left[0]==='mission'&&missionDone.has(nextA)))specialSeen.clear();saveSeen();}}buttonDeck=buttonDecks[state?.round];if(seenPrompts[state?.card]&&typeof state.prompt==='number'&&!seenPrompts[state.card].has(state.prompt)){seenPrompts[state.card].add(state.prompt);saveSeen();}
  if(state?.round!==roundSeen){roundSeen=state?.round;began=null;elapsed=null;batteryDraft='';tapStart=null;tapCount=0;clearTimeout(tapTimer);tapTimer=null;own=undefined;answers={};choice=undefined;settledMap={};settledLoaded=false;spinRound=null;clearTimeout(spinTimer);spinTimer=null;pickRound=null;clearTimeout(pickTimer);pickTimer=null;flipRound=null;clearTimeout(flipTimer);flipTimer=null;rxClear();invite=undefined;inviteStop?.();inviteStop=null;answerStop?.();ownStop?.();settledStop?.();tqStop?.();tqMap={};dtStop?.();dtMap={};dgStop?.();dgMap={};angelStart=0;angelReady=false;angelSched=false;dgSKey='';angelSeen=new Set();angelChoose=false;clearTimeout(angelBotTimer);angelBotTimer=null;extUntil=0;botTries=0;clearTimeout(botTimer);botTimer=null;cuteMode=null;nvStop?.();nvStop=null;nvMap={};settlePage=state?.card==='check';
   if(state){const round=state.round;dgStop=onValue(ref(db,`${base}/dg/${round}`),v=>{if(round!==roundSeen||dead)return;dgMap=v.val()||{};render();},()=>{dgMap={};});dtStop=onValue(ref(db,`${base}/dt/${round}`),v=>{if(round!==roundSeen||dead)return;dtMap=v.val()||{};render();},()=>{dtMap={};});tqStop=onValue(ref(db,`${base}/tq/${round}`),v=>{if(round!==roundSeen||dead)return;tqMap=v.val()||{};render();},()=>{tqMap={};});nvStop=onValue(ref(db,`${base}/nv/${round}`),v=>{if(round!==roundSeen||dead)return;nvMap=v.val()||{};render();maybeAdvance();},()=>{nvMap={};});settledStop=onValue(ref(db,`${base}/settled/${round}`),v=>{if(round!==roundSeen||dead)return;settledMap=v.val()||{};settledLoaded=true;render();settleOwn();maybeAdvance();maybeSettlement();},()=>message('確定状況を取得できませんでした。'));ownStop=onValue(ref(db,`${base}/answers/${round}/${uid}`),v=>{if(round!==roundSeen||dead)return;own=v.val();render();},()=>message('回答の取得に失敗しました。'));
    if(host)answerStop=onValue(ref(db,`${base}/answers/${round}`),v=>{if(round!==roundSeen||dead)return;answers=v.val()||{};render();settle();},()=>message('集計の取得に失敗しました。'));
   }
  }
  if((state?.card==='danger'||state?.card==='king')&&state.phase==='measuring'&&!inviteStop){const round=state.round,actor=currentTurn(state,players).uid;inviteStop=onValue(ref(db,`${base}/answers/${round}/${actor}`),v=>{if(round!==roundSeen||dead)return;invite=v.val();render();settle();},()=>message('誘いの取得に失敗しました。再接続してください。'));}
  if(host&&state?.card==='buttons'&&state.phase==='measuring')runTransaction(ref(db,`${base}/buttonDeck/${state.round}`),d=>d?undefined:shuffleButtons(),{applyLocally:false}).catch(()=>message('ボタンの準備に失敗しました。再接続してください。'));
  ensureAllDrinks();render();settle();settleOwn();maybeSettlement();
 },()=>message('ゲーム接続ルールが未反映、または部屋が終了しています。')));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/drinks`),snap=>{drinkMap=snap.val()||{};drinks=Object.values(drinkMap).reduce((a,v)=>a+v,0);render();settleOwn();},()=>{drinks=null;message('自分のメーターを取得できませんでした。再接続してください。');render();}));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/items`),snap=>{
  itemMap=snap.val()||{};
  if(!Object.keys(itemMap).length&&!grantTried){grantTried=true;set(ref(db,`personal/${roomId}/${uid}/items/0`),drawItem()).catch(()=>{grantFailed=true;message('お助けを受け取れませんでした。再接続してください。');render();settleOwn();});}
  render();settleOwn();
 },()=>{grantFailed=true;itemMap={};message('お助けを取得できませんでした。');render();}));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/grants`),snap=>{grantMap=snap.val()||{};render();settleOwn();},()=>{grantMap={};message('お助けの獲得状況を取得できませんでした。');render();}));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/spent`),snap=>{const next=snap.val()||{};if(spentSeen)for(const [slot,r] of Object.entries(next))if(spentMap?.[slot]===undefined&&r===state?.round)showItemFx(itemMap?.[slot]);spentSeen=true;spentMap=next;render();settleOwn();},()=>{spentMap={};message('お助けの使用状況を取得できませんでした。');render();}));
 if(host)stops.push(onValue(ref(db,base+'/buttonDeck'),snap=>{buttonDecks=snap.val()||{};buttonDeck=buttonDecks[state?.round];settle();},()=>message('ボタンの準備を取得できませんでした。')));
 if(host){const order=shufflePlayers(players);(async()=>{
  try{await runTransaction(ref(db,base+'/state'),s=>s?undefined:{round:1,phase:'draw',order,actor:order[0],accounting:true},{applyLocally:false});}
  catch{message('ゲーム接続ルールの反映が必要です。');}
  // 0.68：カードの出し方の元になる記録(seed と 5番のお題25個)を、ゲーム開始時に1回だけ書く。state を作ったあとに書く（ルールの検証順に依存しないため）
  try{if((await get(ref(db,base+'/deck/seed'))).val()===null){const seed=newSeed();await set(ref(db,base+'/deck/mind'),mindToText(pickMindPool(seed,mindPrompts.length)));await set(ref(db,base+'/deck/seed'),seed);}}
  catch{message('ゲーム接続ルールの反映が必要です（カードの記録）。');}
 })();}
 return()=>{window.removeEventListener('popstate',onPop);closeDtHelp(true);document.removeEventListener('nq-help',onHelp);document.removeEventListener('nq-members',onMembers);document.removeEventListener('nq-conn',onConn);dead=true;clearFx();clearInterval(cdTimer);nvStop?.();clearTimeout(spinTimer);clearTimeout(flipTimer);rxClear();inviteStop?.();stops.forEach(fn=>fn());allDrinksStops.forEach(fn=>fn());tqStop?.();dtStop?.();dgStop?.();clearTimeout(botTimer);clearTimeout(angelBotTimer);document.getElementById('tabHelp')?.classList.remove('glowTab');answerStop?.();ownStop?.();settledStop?.();box.replaceChildren();};
}
