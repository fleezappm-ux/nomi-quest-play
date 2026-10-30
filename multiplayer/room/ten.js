import {artPath,isIcon} from './pop-art.js';
import {ref,set,get,update,onValue,runTransaction,isLocal,serverTimestamp} from './fb.js?v=pop0.70.1';
import {showItemFx} from './itemfx.js?v=pop0.70.1';
import {shufflePlayers,currentTurn} from './turn.js?v=pop0.70.1';
import {majW,ALL_CARDS,SOLO_CARDS,SOLO_COOLDOWN,LAP_CARDS,cardForRound,isBreak,turnsToBreak,checkStates,tiedTargets,tieCards,cards,votePrompts,muttsuriPrompts,majorityPrompts,mindPrompts,pickPrompt,drawCard,drawDirection,targetsFor,shuffleButtons,drinkAward,items,itemKinds,drawItem,itemGroup,ITEM_CAP,decideCredit,winnersFor,REACTION_FAIL,dangerOutcome,rewardees,missionStats,kingOrders,kingCats,hasDoubt,breakPeriod,ticketWindow,ticketsFor,tequilaPlan,tequilaPlanOne,sumTickets,NOTCHES,BREAK_DRAWS,tequilaOutcome,itemChoices,tenExact,BAT_LIE,batPct,batLie} from './deck.js?v=pop0.70.1';
import {REST_CARD} from './deck.js?v=pop0.70.1';
import {genLayout,replay as gridReplay,startOf as gridStartOf,genHints,hintOk,parseLay,canMove as gridCan,resultsOf as gridResults,CELLS as GCELLS,PASS as GPASS} from './grid.js?v=pop0.70.1';
import {RL_CONFIG,STAGES as RLS,KIND as RLK,pickOutcome as rlPick,newArt as rlArt,planSpin as rlPlan,rlOrder,chainOf as rlChain,finalOf as rlFinal,curSpinner as rlCur,currentChoice as rlChoice,resultsOfRl,itemsOfCode,KEY_OF_CODE} from './roulette.js?v=pop0.70.1';
import {createRoulette} from './roulette-ui.js?v=pop0.70.1';
import {chooseCard,didMission,parseKey,newSeed,pickMindPool,mindToText,mindFromText,pickKingOrders} from './draw.js?v=pop0.70.1';
import {avatarOf} from './avatars.js?v=pop0.70.1';
import {doubtH1} from './result-h1.js?v=pop0.70.1';
import {bombResult,BLAST_S} from './result-bomb.js?v=pop0.70.1';
import {rockSvg,openedSvg,pickSvg,sparkSvg} from './grid-rocks.js?v=pop0.70.1';
const LS={getItem:k=>{try{return localStorage.getItem(k);}catch{return null;}},setItem:(k,v)=>{try{localStorage.setItem(k,v);}catch{}},removeItem:k=>{try{localStorage.removeItem(k);}catch{}}};
export function attachTen({db,roomId,uid,players,hostUid,message,root:given,bot=false,endTurns=0}) {
 const root=given||document.getElementById('tenGame'),top=document.createElement('div'),box=document.createElement('div'),dock=document.createElement('div'),host=uid===hostUid,base=`sessions/${roomId}`;
 top.className='top';box.className='stage';dock.className='dock';root.replaceChildren(top,box,dock);
 let dockButtons=0,dockNotes=0;
 const avatars=['🍻','🌙','⭐','🌈','🔥','🎲'],glyphs={roulette:'運',ten:'十',battery:'電',buttons:'謎',reaction:'恋',grid:'謎',danger:'誘',mission:'唇',king:'王',vote:'変',muttsuri:'隠',tapking:'連',check:'飲',rest:'休'};
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
  const counts={};for(const [k,v] of Object.entries(itemMap||{}))if(items[v]&&spentMap?.[k]===undefined)counts[v]=(counts[v]||0)+1;
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

 // ---- 開発者モード(?npc=1&dev=1)：全ゲーム・全お題を、いつでも好きなものから試す。練習モード専用（通信なし）。----
 // 右下の🛠ボタン（どの画面でも出る）から、ゲームを選び、お題があるゲームは全お題の一覧から選べる。
 const dev=isLocal&&uid==='me'&&new URL(location.href).searchParams.get('dev')==='1';
 let devLast=null,devOpen=false,devPick=null,devFab=null,devSheet=null;const devIdx={};
 const devNum={majority:4,mind:5,vote:6,muttsuri:7};
 const devTitle=k=>cards[k].title.replace(/^👑\s*/,'');
 const devPromptText=(k,i)=>{const p=promptLists[k][i];return devNum[k]+'-'+(i+1)+'　'+(Array.isArray(p)?p[0]+' ／ '+p[1]:p);};
 const devGames=()=>[...ALL_CARDS.filter(c=>c!=='danger'&&c!=='buttons'),'grid'];
 function devNextPrompt(key){const n=promptLists[key].length,i=devIdx[key]===undefined?0:(devIdx[key]+1)%n;devIdx[key]=i;return i;}
 // どの画面からでも「今のターンの次」に、指定のゲームを始める（お題・王様の命令も指定可）
 function devForce(key,opt={}){
  devLast=key;
  const pr=promptLists[key]?(opt.prompt!==undefined?(devIdx[key]=opt.prompt):devNextPrompt(key)):undefined;
  return runTransaction(ref(db,base+'/state'),s=>{
   if(!s||s.round>=MAX_ROUND)return;
   const R=s.phase==='draw'?s.round:s.round+1;
   const order=Object.values(s.order||players.map(p=>p.uid)),n=order.length,idx=(R-1)%n,mi=order.indexOf(uid),rot=order.slice();
   if(mi>=0&&idx!==mi){[rot[idx],rot[mi]]=[rot[mi],rot[idx]];}
   return {round:R,order:rot,actor:rot[idx],phase:'measuring',card:key,accounting:true,...(pr!==undefined?{prompt:pr}:{}),...(opt.order!==undefined?{dko:opt.order}:{})};
  },{applyLocally:false});
 }
 async function devBreak(kind){
  const R=Math.max(2,state.phase==='draw'?state.round:state.round+1),lv=u=>kind==='lime'?(u===uid?5:Math.floor(Math.random()*5)):kind==='tie'?(players.findIndex(p=>p.uid===u)<2?3:1):kind==='zero'?0:Math.floor(Math.random()*6);
  for(const p of players)await set(ref(db,`personal/${roomId}/${p.uid}/drinks/${R-1}`),lv(p.uid));
  return runTransaction(ref(db,base+'/state'),s=>s?{...s,round:R,phase:'measuring',card:'check'}:undefined,{applyLocally:false});
 }
 // 王様：選んだ命令が、王様の選択肢の1つ目に必ず出る（開発者モードだけ）
 const kingOpts=()=>{const a=pickKingOrders(deckSeed??1,state.round,state.ky?1:0,kingCats);return dev&&typeof state.dko==='number'?[state.dko,...a.filter(x=>x!==state.dko)].slice(0,4):a;};
 const devClose=()=>{devOpen=false;devPick=null;devSheet?.remove();devSheet=null;};
 const devGo=async(fn)=>{devClose();if(pending||dead)return;pending=true;try{await fn();}finally{pending=false;if(!dead)render();}};
 function devRenderSheet(){
  if(!devOpen){devSheet?.remove();devSheet=null;return;}
  if(!devSheet){devSheet=div('devSheet');devSheet.onclick=e=>{if(e.target===devSheet)devClose();};root.append(devSheet);}
  const body=div('devBody'),head=div('devHead',txt('b','','🛠 開発者モード'));
  const x=el('button','✕ とじる');x.className='secondary devX';x.onclick=devClose;head.append(x);body.append(head);
  const rowBtn=(label,fn,cls='')=>{const b=el('button',label);b.className='secondary '+cls;b.onclick=()=>devGo(fn);return b;};
  if(devPick===null){
   if(devLast&&cards[devLast]&&promptLists[devLast]){const n=promptLists[devLast].length,nx=((devIdx[devLast]??-1)+1)%n;body.append(rowBtn('▶ 次へ：'+devTitle(devLast)+'・'+devPromptText(devLast,nx),()=>devForce(devLast),'devnext'));}
   body.append(txt('p','fine','ゲームを選ぶ（いまの画面を飛ばして、すぐ始まります）'));
   const g=div('devgrid');
   for(const k of devGames()){
    const multi=!!promptLists[k]||k==='king';
    const b=el('button',devTitle(k)+(multi?'　▶ お題を選ぶ':''));b.className='secondary';
    b.onclick=()=>{if(multi){devPick=k;devRenderSheet();}else devGo(()=>devForce(k));};g.append(b);
   }
   body.append(g,txt('p','fine','休憩・ドリンクタイム（メーターを自動で配ります）'));
   const g2=div('devgrid');
   for(const [label,kind] of [['ライムあり（自分が5）','lime'],['同率（2人が最多）','tie'],['全員0','zero'],['ランダム','rand']])g2.append(rowBtn(label,()=>devBreak(kind)));
   body.append(g2,txt('p','fine','お助けカード（バリア等）は、そのまま使えます。通信なしの練習モードだけで動きます。'));
  }else{
   const k=devPick,back=el('button','← ゲーム一覧にもどる');back.className='secondary';back.onclick=()=>{devPick=null;devRenderSheet();};
   body.append(back,el('h3',devTitle(k)+'：お題を選ぶ'));
   const list=div('devList');
   if(k==='king'){
    body.append(txt('p','fine','選んだ命令が、王様の選択肢に必ず出ます（ほかの3つはランダム）。'));
    kingCats.forEach(([a,z],ci)=>{list.append(txt('p','devCat',['エッジ','ちょっとエッチ','面白系','スキンシップ系'][ci]));for(let i=a;i<z;i++)list.append(rowBtn('12-'+(i+1)+'　'+kingOrders[i],()=>devForce('king',{order:i})));});
   }else for(let i=0;i<promptLists[k].length;i++)list.append(rowBtn(devPromptText(k,i),()=>devForce(k,{prompt:i})));
   body.append(list);
  }
  devSheet.replaceChildren(body);
 }
 function devMount(){
  if(!devFab){devFab=el('button','🛠');devFab.className='devFab';devFab.setAttribute('aria-label','開発者モード');devFab.onclick=()=>{devOpen=true;devPick=null;devRenderSheet();};}
  if(!devFab.isConnected)root.append(devFab);
  if(devOpen&&!devSheet?.isConnected){devSheet=null;devRenderSheet();}
 }
 function devPanel(){
  const wrap=document.createElement('details');wrap.className='devpanel';wrap.open=true;
  wrap.append(el('summary','🛠 開発者モード'));
  const g=div('devgrid'),b=(label,fn,cls='')=>{const x=el('button',label);x.className='secondary '+cls;x.onclick=fn;g.append(x);};
  if(devLast&&cards[devLast]&&promptLists[devLast]){const n=promptLists[devLast].length;b('▶ 次へ：'+devTitle(devLast)+'・'+devPromptText(devLast,((devIdx[devLast]??-1)+1)%n),()=>devGo(()=>devForce(devLast)),'devnext');}
  b('🛠 ゲームとお題を選ぶ',()=>{devOpen=true;devPick=null;devRenderSheet();});
  wrap.append(g,txt('p','fine','どの画面でも、右下の🛠ボタンから好きなゲーム・お題を選べます。通信なしの練習モードだけで動きます。'));
  return wrap;
 }
 let shotN=0;
 function shot(level,cls=''){const lv=Math.max(0,Math.min(NOTCHES,Number(level)||0)),id='sg'+(++shotN),top=lv>=NOTCHES,d='M8 4H62L55 74Q54.5 82 48 82H22Q15.5 82 15 74Z',w=document.createElement('div');w.className='mug shot'+(top?' top':'')+(cls?' '+cls:'');w.setAttribute('role','img');w.setAttribute('aria-label','ショットメーター '+lv+'/'+NOTCHES);
  w.innerHTML=`<svg viewBox="-2 -16 86 108" aria-hidden="true" focusable="false"><defs><clipPath id="${id}"><path d="${d}"/></clipPath><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd35a"/><stop offset="1" stop-color="#e0971c"/></linearGradient></defs><path class="g-in" d="${d}"/><g clip-path="url(#${id})"><rect class="liq" x="0" y="4" width="70" height="72" fill="url(#${id}g)" style="transform:scaleY(${(lv/NOTCHES).toFixed(3)})"/><rect x="0" y="72" width="70" height="12" fill="rgba(255,255,255,.28)"/><path class="g-tick" d="M0 18.4H70M0 32.8H70M0 47.2H70M0 61.6H70"/></g><path class="g-out" d="${d}"/><path d="M14 10L19 66" class="g-hi"/>${top?'<g class="lime"><path d="M50 4A15 15 0 0 1 80 -2L74 6Z" transform="rotate(-8 60 4)"/><path d="M53 3A12 12 0 0 1 76 -1" class="rind"/></g>':''}</svg>`;return w;}
 function previousSettlement(before=state.round){return Math.max(0,...Object.keys(settlementHistory).map(Number).filter(r=>r<before));}
 function pendingPlan(map,round=state.round+1){return tequilaPlanOne(map,round,previousSettlement(round));}
 function creditsReady(){return historyLoaded&&drinksReady()&&players.every(p=>allDrinks[p.uid]?.[state.round]!==undefined);}
 // ---- 0.56 基本ルール：ドリンクタイム＝8ターンごとに自動（ターンに数えない）／休憩カード＝状態を確認するだけ ----
 const COOL_TURNS=8,MAX_ROUND=200; // 0.70：ラウンド上限を100→200（120ターン＋ドリンクタイム分）
 // ---- 0.68 新しい出し方：部屋で共有する記録(sessions/$room/deck)だけで、どの端末でも同じカードが決まる ----
 let deckSeed=null,deckMind=[],deckDrawn={},deckMd={};
 let gmLg=[],gmRq={},gmLay=null,gmStop=null,gmRqStop=null,gmLayStop=null,gmIniting=false,gmBusy=false,gmSeq=0,gmDone={},gmTimer=null,gmDisc=0,gmWaitLen=-1,gmWaitUntil=0;
 let rlData={},rlStop=null,rlLoaded=false,rlView=null,rlQueue=Promise.resolve(),rlSeen=new Set(),rlAnimDone=new Set(),rlHoldUntil={},rlHoldQ=new Set(),rlTimerKey='',rlTimerT=null,rlTimerEnd=0,rlTimerMs=1,rlHostT=null,rlFinishing=false,rlSig='',rlSigAt=0,rlDisc=0,rlSnd=LS.getItem('nq-rl-snd')!=='0';
 const bmBuzz={};
 let gAnim={round:0,n:0,c:-1,t:0},gmHint=null,gmHintStop=null,gmHintIniting=false,gTel={key:'',t:0},gridBuzz=0,bmP=[],bmStop=null,bmXStop=null,bmX=null,bmIniting=false,bmTimer=null,bmSettling=false,bmLockUntil=0,bmSeenN=-1,bmDisc=0,bmLockTimer=null,svOff=0,bmRdy={},bmRdyStop=null,bmRdySent=0,bmWait=0,bmWaitT=null,bmCd=[],bmTick=null,bmFly=null,bmW=null,bmWStop=null,bmWarnPlan=null,bmWarned=0,gateGo=null,gateGoStop=null,gateFired=0,gateSince=0,gateIniting=false;
 let inviteFor=null,kgData={},kgStop=null,kingTarget=null,kingYield=false,yielding=false;
 // ---- 0.69 充電マウント合戦のダウト：bt/<round>/{vals,d,j}（値の公開・ダウトの選択・判定）----
 const DOUBT_MS=()=>globalThis.__nqDoubtMs??10000,JUDGE_MS=()=>globalThis.__nqJudgeMs??30000;
 let hlRound=null,hlTimer=null;let btData={},btStop=null,btSeenAt=0,btValsAt=0,btJudgeAt=0,btHostTimer=null,btWriting=false,btCd=null,btTelopRound=null,btBotKey='',btMineD=false,btMineJ=false;const btJSent=new Set();
 const PROMPT_SIZES={vote:votePrompts.length,muttsuri:muttsuriPrompts.length,majority:majorityPrompts.length};
 const deckReady=()=>deckSeed!==null&&deckMind.length>0;
 function normMd(d){const o={};if(!d)return o;for(const [k,v] of Object.entries(d))if(v===1&&Number(k)>0)o[k]=1;return o;}
 function normDrawn(d){const o={};if(!d)return o;for(const [k,v] of Object.entries(d))if(typeof v==='string'&&Number(k)>0)o[k]=v;return o;}
 async function drawNow(turn){
  if(!coolReady()||!deckReady())return;
  const round=state.round,ci=coolInfo(),cool=ci.ds.filter(r=>r<round).length,pos=round-ci.start+1,order=Object.values(state.order||turn.order);
  let key=deckDrawn[round];
  if(!key){
   key=chooseCard(deckDrawn,{seed:deckSeed,mind:deckMind,sizes:PROMPT_SIZES,round,cool,pos,actorDidMission:didMission(deckDrawn,order,turn.uid,round,deckMd),missionAll:order.every(u=>didMission(deckDrawn,order,u,round,deckMd)),usedExtra:[...seenPrompts.majority].map(i=>'majority:'+i)}).key;
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
  if(state.card==='check'&&host&&endTurns>0&&turnNo()>=endTurns){await set(ref(db,base+'/fin'),true);return;} // 決めたターン数まで遊んだら、ドリンクタイムのあとで最終精算へ
  if(state.card!=='check'&&(!creditsReady()||!coolReady()))throw new Error('tickets not loaded');
  const check=state.card!=='check'&&thresholdReached();
  return runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='results'?{round:round+1,phase:check?'measuring':'draw',...(check?{card:'check'}:{}),order,actor:order[round%order.length],accounting:true}:undefined,{applyLocally:false});
 }
 function maybeSettlement(){} // 0.56: ドリンクタイムは、8ターン目の結果のあと「次へ」で始まる
 // 休憩ターン：全員が「準備OK」を押したら（満場一致で）ホストの端末が次のターンへ進める。ホストは待たずに進めることもできる。
 let advancing=false;
 function maybeAdvance(){if(!host||dead||advancing||state?.phase!=='results'||state.card!=='check'||state.round>=MAX_ROUND)return;if(!players.every(p=>nvMap[p.uid])||!settledAll())return;advancing=true;advanceRound().catch(()=>message('次のターンへ進めませんでした。')).finally(()=>{advancing=false;});}
 function imDrinker(){try{if(!drinksReady()||!historyLoaded)return false;const plan=tequilaPlan(allDrinks,ids(),state.round,previousSettlement());for(const p of players)for(let j=0;j<plan[p.uid].count;j++){const o=tequilaOutcome(p.uid,chainOf(p.uid,j));if(!o.cancelled&&o.drinker===uid)return true;}}catch{}return false;}
 function breakNext(){
  const ready=players.filter(p=>nvMap[p.uid]).length,me=!!nvMap[uid];
  box.append(txt('p','fine',`次のターンへ：${ready}/${players.length}人が準備OK。全員がそろうと進みます。`));
  button(me?`✓ 準備OK（みんなを待っています ${ready}/${players.length}）`:(imDrinker()?'飲んだ → 次へ':'確認して次へ →')+`（${ready}/${players.length}人OK）`,()=>set(ref(db,`${base}/nv/${state.round}/${uid}`),true),me||pending);
  if(host)button('みんなを待たずに次のターンへ（ホスト）',advanceRound,pending||ownBusy||!settledAll()||state.round>=MAX_ROUND,'secondary');
 }
 function nextButton(){if(host)button(thresholdReached()?'🥃 ドリンクタイムへ':'次のターン',advanceRound,pending||ownBusy||!settledAll()||!creditsReady()||!coolReady()||state.round>=MAX_ROUND);
   else box.append(el('p','ホストが次のターンへ進むのを待っています。'));}
 let lastMsgKey='';
 function render(){
  fillMembers();fillHelp();
  if(dead)return;{const mk=`${state?.round}|${state?.card}|${state?.phase}`;if(mk!==lastMsgKey){lastMsgKey=mk;message('');}}top.replaceChildren();box.replaceChildren();dock.replaceChildren();root.querySelector?.(':scope>.moreinfo')?.remove();dockButtons=0;dockNotes=0;
  paint();maybeIntro();if(dev)devMount();{const ps=box.querySelectorAll?.('.prog span')||[];if(ps.length){const k=state?.phase==='results'?ps.length-1:(state?.card==='ten'?(began!==null?1:(elapsed!==null?2:0)):(dockButtons>0?0:1));ps.forEach((e,n)=>e.className=n<=k?'on':'')}}
  if(state?.phase==='measuring'&&box.classList?.contains('art')&&true){const bs=[...(dock.querySelectorAll?.('button')||[])];if(bs.length>=1){const g=div('choices');bs.forEach(b=>g.append(b));box.append(g);dockButtons-=bs.length}}
  dock.className='dock'+(dockNotes===0&&dockButtons>2?' grid':dockNotes===0&&dockButtons>0?' sticky':'');
 }
 function compactBar(){
  const n=turnsLeft(),L=state.card==='check'?'🥃 ドリンクタイム！':state.card==='rest'?'🛌 休憩カード（ターンに数えません）':n===null?'':n>0?`ドリンクタイムまで あと<b>${n}</b>ターン`:'次はドリンクタイム';
  let total=0;for(const [k,v] of Object.entries(itemMap||{}))if(items[v]&&spentMap?.[k]===undefined)total++;
  const tk=myTickets(),b=div('bar'),l=document.createElement('span');l.innerHTML=L;
  const m=document.createElement('span');m.className='inv';m.textContent='🎒 '+total;
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
  turn.order.forEach((id,i)=>{const p=byUid.get(id),now=i===turn.index;seats.append(div('seat'+(now?' now':''),txt('span','tag',now?'引いた人':''),avImgEl(p),txt('span','nm',p?.name||'確認中')));});
  const n=turn.order.length;return div('turnwrap',div('turnmeta',txt('span','',`ターン ${turnNo()}${endTurns>0?` / ${endTurns}`:''} · ${turn.cycle}巡目`),txt('b','',`今回カードを引いた人：${byUid.get(turn.uid)?.name||'確認中'}`)),seats,txt('p','turnnext',state.card==='check'?'🥃 ドリンクタイム！':state.card==='rest'?'🛌 休憩カード！ 状態を確認するだけ':(turnsLeft()===null?'':turnsLeft()>0?`🥃 あと${turnsLeft()}ターンでドリンクタイム`:'🥃 このあとドリンクタイム！')));
 }
 const blurb={ten:'時計を見ずに10秒を狙え！',battery:'その残量、ホント？',buttons:'どっちを押す？',reaction:'爆弾が来た！ 誰かに押しつけろ！',grid:'ポチポチいっちゃう',roulette:'今夜は天国？地獄？',tapking:'5秒間ひたすら連打！',vote:'変態をあぶり出せ',muttsuri:'むっつりを見破れ',majority:'あなたはA派？ B派？',mind:'この人だ！と思う人に投票',king:'王様の言うことは絶対！',mission:'キス顔に挑戦！',danger:'行く？ 行かない？',check:'ひと息ついて、状態チェック',rest:'みんなの状態を確認しよう'};
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
 // 全ゲーム共通：見出しの右上の📖から、そのゲームの説明を読める
 let cardHelpEl=null;
 const ruleOf=card=>card==='ten'?'心の中で10秒数えて、ぴったりで押そう！\nいちばん遠い人が負け。\n途中で数字は見えなくなるよ。':(cards[card]?.rule||'');
 function closeCardHelp(){cardHelpEl?.remove();cardHelpEl=null;}
 // 初めてそのゲームが出たときだけ、大きな字のポップで説明する（「次から出さない」で二度と出ない／あとは右上の📖）
 const BAND_CARDS=new Set(['ten','battery','buttons','reaction','tapking','vote','muttsuri','majority','mind','king','mission','danger']); // 説明の箱をやめて、キャッチフレーズの「帯」だけにするゲーム
 let bmWaitRound=0,introKey='',introEl=null,mdAt={round:0,t:0,skip:false};const INTRO_ON=new Set(['roulette','ten','battery','buttons','reaction','grid','tapking','vote','muttsuri','majority','mind','king','mission','danger']);
 function maybeIntro(){try{maybeIntro0();}catch{}try{gateHost();}catch{}}
 function maybeIntro0(){
  if(bot||dead||!state||state.phase!=='measuring'||!INTRO_ON.has(state.card)||!cards[state.card]?.intro)return;
  if(flipRound!==state.round)return; // カードがめくれ終わってから
  const key=state.round+':'+state.card;if(introKey===key)return;introKey=key;
  const card=state.card,lk='nq-intro-'+card,rd=state.round;
  const g=flipGhost&&flipGhost.round===rd?flipGhost:null;if(g)flipGhost=null;
  try{if(LS.getItem(lk)==='1'){ghostCard(g,true);if(GATE_CARDS.has(card))bombReady();return;}}catch{}
  ghostCard(g,false);
  setTimeout(()=>{if(dead||!state||state.round!==rd||state.phase!=='measuring')return;try{showIntro(card,lk,!!g);}catch{}},globalThis.__nqIntroMs??(g?120:700));
 }
 function showIntro(card,lk,fromCard){
  introEl?.remove();
  const chk=document.createElement('input');chk.type='checkbox';try{chk.checked=LS.getItem(lk)==='1';}catch{}
  const lab=document.createElement('label');lab.className='dthNo introNo';lab.append(chk,document.createTextNode(' 次から表示しない'));
  const ok=el('button','OK！');ok.type='button';
  const x=el('button','✕');x.type='button';x.className='introX';x.setAttribute('aria-label','閉じる');
  const bookBtn=()=>document.querySelector('#tenGame .cardInfo');
  const calm=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch{return false;}};
  const origin=()=>{const bb=bookBtn()?.getBoundingClientRect?.(),r=box.getBoundingClientRect();return bb?`${bb.left+bb.width/2-r.left}px ${bb.top+bb.height/2-r.top}px`:'100% 0';};
  let closing=false;
  const auto=setTimeout(()=>close(),globalThis.__nqIntroMaxMs??30000); // 30秒たつと自動で閉じる
  const close=()=>{if(closing)return;closing=true;clearTimeout(auto);
   try{if(chk.checked)LS.setItem(lk,'1');else LS.removeItem(lk);}catch{}
   bookBtn()?.classList.toggle('glow',!!chk.checked);
   if(GATE_CARDS.has(card))bombReady();
   const fin=()=>{o.remove();if(introEl===o)introEl=null;};
   if(box.animate&&!calm()){box.style.transformOrigin=origin();box.animate([{transform:'scale(1)',opacity:1},{transform:'scale(.05)',opacity:0}],{duration:200,easing:'ease-in'}).onfinish=fin;o.style.background='transparent';}else fin();};
  ok.onclick=close;x.onclick=close;
  const box=div('dtHelpBox',x,txt('h3','',cards[card].title),...cards[card].intro.map((s,i)=>div('introLine',txt('span','hnum',String(i+1)),txt('span','introTx',s))),lab,ok);
  const o=div('dtHelp introBig',box);
  introEl=o;document.body.append(o);
  if(box.animate&&!calm()){if(fromCard){box.style.transformOrigin='50% 40%';box.animate([{transform:'scale(.55)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:380,easing:'cubic-bezier(.2,.9,.3,1.1)'});}else{box.style.transformOrigin=origin();box.animate([{transform:'scale(.05)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:300,easing:'cubic-bezier(.2,.9,.3,1.15)'});}}
 }
 function openCardHelp(card){
  if(dead)return;closeCardHelp();
  const st=cards[card]?.steps,lines=ruleOf(card).split(/\n|(?<=。)/).map(x=>x.trim()).filter(Boolean);
  const ok=el('button','とじる');ok.type='button';ok.onclick=closeCardHelp;
  const o=div('dtHelp cardHelp',div('dtHelpBox',txt('h3','',cards[card].title.replace(/^👑\s*/,'')),...(st?st.map(([h,x],i)=>div('hstep',txt('span','hnum',String(i+1)),div('hbody',txt('b','hh',h),...String(x).split('\n').map(y=>txt('span','hd',y))))):lines.map(x=>txt('p','',x))),ok));
  o.addEventListener('click',e=>{if(e.target===o)closeCardHelp();});
  document.body.append(o);cardHelpEl=o;
 }
 function cardHead(card){const categories={roulette:'運命',ten:'タイミング',battery:'バトル',buttons:'心理戦',reaction:'アクション',grid:'心理戦',tapking:'アクション',vote:'トーク',muttsuri:'予想',majority:'予想',mind:'トーク',king:'王様',mission:'ミッション',danger:'運命',check:'ドリンクタイム',rest:'ひと休み'};
  let who='';try{const t=currentTurn(state,players);who=card==='check'||card==='rest'?(categories[card]||''):(t.uid===uid?'あなた':(byUid.get(t.uid)?.name||'？'))+'さんが引いたカード'}catch{}
  const img=popImg(card,'hero'),chk=card==='check',prog=div('prog',...Array.from({length:card==='ten'?4:3},(_,n)=>txt('span',n?'':'on')));
  const rlLite=card==='roulette'||BAND_CARDS.has(card),showRule=!rlLite;
  const h=div('cardhead k-'+card,div('ph',img,div('phx',...(chk?[]:[txt('small','pop-kicker',who)]),txt('h2','pop-title',cards[card].title.replace(/^👑\s*/,'')))),...(BAND_CARDS.has(card)&&blurb[card]?[txt('p','band',blurb[card])]:[]),...(chk||(rlLite&&!showRule)?[]:[...(rlLite?[]:[prog]),txt('p','rule',card==='ten'?'心の中で10秒数えて、ぴったりで押そう！\nいちばん遠い人が負け。\n途中で数字は見えなくなるよ。':(cards[card].brief||cards[card].rule))]));
  if(chk){dtHolder=div('dtholder',dtSteps(state.phase==='measuring'?1:dtInEntry?2:3));const hb=el('button','📖');hb.type='button';hb.className='helpbtn';hb.setAttribute('aria-label','説明を読む');hb.onclick=()=>openDtHelp(dtStage||1,false);const hint=txt('span','helphint','📖 タップで説明が読めます');if(performance.now()<dtHintUntil)hint.classList.add('show');h.querySelector('.ph').append(hb);h.append(hint,dtHolder);}
  {const ph=chk?null:h.querySelector?.('.ph');if(ph){const tt=ph.querySelector?.('.pop-title');if(tt){const len=[...tt.textContent].length;tt.style.fontSize=Math.max(17,Math.min(24,Math.floor(200/len)))+'px';}const ib=el('button','📖');ib.type='button';ib.className='cardInfo';try{if(LS.getItem('nq-intro-'+card)==='1')ib.classList.add('glow');}catch{}ib.setAttribute('aria-label','このゲームの説明を読む');ib.onclick=()=>{if(cards[card]?.intro&&INTRO_ON.has(card)){try{showIntro(card,'nq-intro-'+card,false);}catch{openCardHelp(card);}}else openCardHelp(card);};ph.classList.add('hasInfo');ph.append(ib);}}
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
  root.removeAttribute?.('data-bt');
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
   else box.append(el('p',`${byUid.get(turn.uid)?.name||'今回カードを引いた人'}がカードを引くのを待っています。`));
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
   if(card==='battery'&&!hasDoubt(state)&&state.direction&&hlRound!==state.round){hlRoulette();return;}
   if(state.pick&&pickRound!==state.round&&card!=='check'){pickRoulette();return;}
   if(card==='majority'&&!state.mall&&pickRound!==state.round){if(revealRnd!==state.round){majReveal();return;}abRoulette();return;}
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
   const an=byUid.get(turn.uid)?.name;
   if(turn.uid===uid){
    if(typeof own!=='number'){button('💋 やる',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),1),pending);button('やらない（メーター＋2）',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),0),pending,'secondary');}
    else box.append(el('p',own===1?'みんなの採点を待っています…':'結果を待っています…'));
   }else if(invite===1){
    if(typeof own==='number')box.append(el('p','採点済み · みんなを待っています。（誰がどれを選んだかは見えません）'));
    else{box.append(el('h3',`${an}のキス顔を採点！`));box.append(el('p','全員「最高」なら、カードを引いた人にお助け＋1。'));
     for(const [v,lab] of [[1,'🔥 最高'],[2,'👍 いいね'],[3,'🔁 やり直し']])button(lab,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),v),pending,v===1?'':'secondary');}
   }else box.append(el('p',invite===0?`${an}はやらないことにしました…`:`${an}がキス顔に挑戦するか決めています。`));
   return;
  }
  if(card==='danger'||card==='king'){dangerUi(card==='king'&&state.ky&&state.actor?{...turn,uid:state.actor}:turn);return;}
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
   const pair=promptLists[card][state.prompt]||['確認中','確認中'],mk=state.mk||0,done=typeof own==='number'&&Math.floor(own/2)===mk;
   // 直前に「全員同じ／半々」で派閥が決まらなかったときは、理由を見せるページを数秒はさむ（通信は増えない：お題の切り替わりを合図に、この端末だけで表示）
   const prevS=majSeen;
   if(prevS.round===state.round&&mk>prevS.mk){const ms=globalThis.__nqTieMs??4000;majTie={round:state.round,mk,half:state.side===1,own:prevS.own,pair:prevS.pair,n:players.length,until:performance.now()+ms};setTimeout(()=>{if(!dead)render();},ms+60);}
   if(prevS.round!==state.round||prevS.mk!==mk)majSeen={round:state.round,mk,own:null,pair};
   if(typeof own==='number'&&Math.floor(own/2)===mk)majSeen.own=own%2;
   if(majTie&&majTie.round===state.round&&majTie.mk===mk&&performance.now()<majTie.until){majTieUi(majTie);return;}
   box.append(el('h3','A：'+pair[0]+'\nB：'+pair[1]));
   if(done)box.append(txt('p','fine abPlain','回答済み · みんなの回答を待っています。（結果まで秘密）'));
   else{
    for(const [i,label] of ['A','B'].entries())button(`${label}：${pair[i]}`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),2*mk+i),pending);}
   if(host)box.append(txt('p','fine abPlain',`回答 ${players.filter(p=>typeof answers[p.uid]==='number'&&Math.floor(answers[p.uid]/2)===mk).length}/${players.length}人`));
   return;
  }
  if(card==='battery'&&btData.vals&&typeof own==='number'){doubtUi();return;}
  if(typeof own==='number')box.append(el('p','送信済み · 全員の回答を待っています。'));
  else if(card==='reaction')bombUi();
  else if(card==='grid')gridUi();
  else if(card==='roulette')rouletteUi();
  else if(card==='battery'){
   {if(!batteryDraft)batteryDraft='50';const bigN=txt('div','bigNum',batteryDraft+'%'),rg=document.createElement('input');rg.type='range';rg.min='0';rg.max='100';rg.step='1';rg.value=batteryDraft;rg.className='batRange';rg.setAttribute('aria-label','充電残量（％）');rg.disabled=pending;rg.oninput=()=>{batteryDraft=rg.value;bigN.textContent=rg.value+'%';};
   box.append(bigN,rg);}
   const sendBat=(lie)=>{const value=Number(batteryDraft);if(!batteryDraft.trim()||!Number.isInteger(value)||value<0||value>100){message('充電残量は0〜100の整数で入力してください。');return;}return set(ref(db,`${base}/answers/${state.round}/${uid}`),value+(lie?BAT_LIE:0));};
   for(const [lie,label,sub] of [[false,'ホントの数字で送信',''],[true,'ウソの数字で送信','']]){
    const b=el('button',label);b.className=lie?'batLie':'batTrue';b.disabled=pending;
    b.onclick=async()=>{if(pending||dead)return;pending=true;render();try{await sendBat(lie);}catch{message('ゲーム通信に失敗しました。再接続後にもう一度試してください。');}finally{pending=false;render();}};
    dock.append(b);dockButtons++;
   }
  }else if((card==='ten'||card==='tapking')&&gateWait()){gateUi();
  }else if(card==='tapking'){
   if(tapStart===null){button('START（5秒）',async()=>{tapBegin();},pending);}
   else{const pad=txt('button','tapbig','TAP！'),cnt=txt('p','tapcount','0回');pad.onpointerdown=(e)=>{e?.preventDefault?.();tapCount++;cnt.textContent=tapCount+'回';};pad.onclick=null;box.append(cnt,pad);}
  }else if(elapsed!==null){box.append(el('p','計測完了。結果を送信してください。'));button('結果を送信',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),elapsed),pending);}
  else if(began!==null){const bn=txt('div','bigNum','0.0'),t0=began,iv=setInterval(()=>{if(!bn.isConnected||began!==t0){clearInterval(iv);return}const e=(performance.now()-t0)/1000;bn.textContent=e<3?e.toFixed(1):'？？？'},50);box.append(txt('p','hint2','数え始めて…'),bn,txt('p','hint2','10秒だと思ったら STOP！'));button('STOP',async()=>{elapsed=Math.min(120000,Math.round(performance.now()-began));began=null;},pending);}
  else{box.append(txt('div','bigNum','10.00'),txt('p','hint2','準備ができたらスタート'));button('START',async()=>{began=performance.now();},pending);}
  if(host&&card!=='roulette'&&card!=='grid')box.append(el('p',`回答 ${players.filter(p=>typeof answers[p.uid]==='number').length}/${players.length}人`));
 }
 const settledAll=()=>players.every(p=>settledMap[p.uid]===true);
 const itemsReady=()=>drinkMap!==undefined&&itemMap!==undefined&&spentMap!==undefined&&grantMap!==undefined&&(Object.keys(itemMap).length>0||grantFailed);
 const freeSlot=kind=>Object.entries(itemMap||{}).find(([k,v])=>v===kind&&spentMap?.[k]===undefined)?.[0];
 const usedInfo=()=>{const e=Object.entries(spentMap||{}).find(([,r])=>r===state?.round);return e?{slot:e[0],kind:itemMap?.[e[0]]}:undefined;};
 function drinkPanel(){
  if(!itemsReady()){box.append(el('p','あなたのお助けを確認しています…'));return;}
  if(winnerNow()){
   const head=state.card==='reaction'?'あなたが最速！':state.card==='roulette'?'ルーレット！':state.card==='ten'?(tenExact(state,uid)?'ピッタリ賞！':'ほぼピッタリ！'):state.card==='grid'?'お宝ゲット！':'HEAVEN！';
   const g=grantMap[String(state.round)],got=g===undefined?[]:[itemMap[String(g)],...(needSecond()?[itemMap[String(Number(g)+1)]]:[])].filter(v=>v!==undefined);
   box.append(el('p',grantPending()?'お助けを受け取っています…':head+(got.length?'':'お助けを獲得しました。')));
   if(!grantPending())for(const k of got)box.append(txt('p','gotHelp'+(items[k]?'':' miss'),items[k]?`${items[k].icon} ${items[k].name}をゲット！`:'持ちきれず、取り損ね…（バリア＋なすりつけは3枚、身代わりは3枚まで）'));
  }
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
  for(const [k,v] of Object.entries(itemMap||{}))if(items[v]&&spentMap?.[k]===undefined){counts[v]=(counts[v]||0)+1;total++;}
  const ready=itemMap&&(Object.keys(itemMap).length>0||grantFailed);
  const chips=div('chips',...itemKinds.map(k=>txt('span','chip'+(counts[k]?'':' none'),`${items[k].icon} ${shortName[k]} ×${counts[k]||0}`)));
  const held=itemKinds.filter(k=>counts[k]).map(k=>txt('p','help',`${items[k].icon}${items[k].name}：${items[k].desc}`));
  const more=document.createElement('details');more.className='helpbox';more.append(el('summary','お助けの説明'),...held,...(held.length?[]:[txt('p','help','お助けカードは、休憩のドリンクタイムで使えます。バリアは1杯を無効にします。')]),txt('p','fine','この表示はあなたの画面だけ。実際に飲む必要はありません。'));
  const tk=myTickets();
  const extra=document.createElement('details');extra.className='inventory-details';extra.append(el('summary',ready?'🎒 お助けカード '+total+'枚':'🎒 お助けを確認中'),chips,more);
  return div('status',div('ticket-mini',txt('span','label','ショットメーター'),...(tk===null?[txt('b','big','確認中')]:[shot(tk.now,'mini'),txt('b','big',Math.min(tk.now,NOTCHES)+'/'+NOTCHES)]),txt('span','help','ライム(5)で1杯確定')),extra);
 }
 function board(card,turn){
  const detailFor=(p)=>{const v=state.results?.[p.uid];
   if(card==='ten')return typeof v==='number'?(v/1000).toFixed(3)+'秒':'';
   if(card==='battery')return typeof v==='number'?batPct(v)+'％ · '+(batLie(v)?'🤥ウソで送信':'✅ホントで送信'):'';
   if(card==='tapking')return typeof v==='number'?v+'回':'';
   if(card==='grid')return typeof v==='number'?`押した回数 ${v%100}${v>=100?` · 🎁お助け ${Math.floor((v%10000)/100)}個${v>=10000?'（強欲で2枚）':''}`:''}${p.uid===state.bx?' · 💥爆弾':''}`:'';
   if(card==='roulette')return typeof v==='number'?(v===0?'やらない':RLK[KEY_OF_CODE[v]]?.txt||''):'';
   if(card==='reaction')return typeof v==='number'?`持っていた時間 ${(v/1000).toFixed(1)}秒${p.uid===state.bx?' · 💥爆発':''}${p.uid===state.bl?' · 🏆最長':''}`:'';
   if(card==='buttons')return p.uid===turn.uid&&typeof v==='number'?`ボタン ${v+1}`:'';
   if(card==='mission')return p.uid===turn.uid&&typeof v==='number'?(v===1?'キス顔に挑戦':'やらない'):'';
   if(VL.has(card))return `${Number(state.votes?.[p.slot])||0}票`;
   if(card==='majority'){const pr=promptLists.majority[state.prompt]||[];return typeof v==='number'?`${v===0?'A':'B'}：${pr[v]??''}`:'';}
   if(card==='king'){const o=dangerOutcome(state);return p.uid===o?.actor?'👑王様':p.uid===o?.target?(o.accepted?'従った':'拒否'):'';}
   if(card==='danger'){const o=dangerOutcome(state);return p.uid===o?.actor?'誘った':p.uid===o?.target?(o.accepted?'承諾':'断った'):'';}
   return '';};
  if(card==='check'||card==='rest'){const f=(v)=>checkStates[v]||['❔','不明'];return div('board',txt('h3','verdict','みんなの状態'),txt('p','sub','無理せず、水も飲もう 🚰'),div('rows',...players.map(p=>{const [ic,lab]=f(state.results?.[p.uid]);return div('row safe',txt('span','av',ic),txt('span','who',p.name),txt('span','detail',''),txt('span','cups',lab));})),txt('p','fine','状態は自己申告です。'));}
  const gets=new Set(rewardees(state));
  const rows=players.map(p=>({p,amt:drinkAward(state,p.uid,players),detail:detailFor(p)})).sort((x,y)=>card==='reaction'?(state.results?.[y.p.uid]||0)-(state.results?.[x.p.uid]||0):y.amt-x.amt);
  const losers=rows.filter(r=>r.amt>0);
  let verdict=losers.length?`${losers.map(r=>r.p.name).join('・')} の負け！`:'今回は誰も飲みません 🎉';
  let sub='';
  if(card==='battery')sub=hasDoubt(state)?'📣 ダウトあり！（HIGH／LOWはなし）':`今回は ${state.direction}！`;
  if(card==='tapking')sub='タップが最も少ない人がメーター'+(state.pick?'（同数→ルーレット）':'');
  if(state.pick&&(card==='ten'||card==='battery'))sub=(sub?sub+' ／ ':'')+'同率→ルーレットで決定';
  if(card==='mission'){const m=missionStats(state);sub=!m.did?'🙅 やらない… カードを引いた人がメーター＋2':`🔥 最高 ${m.best}人 ／ 👍 いいね ${m.good}人 ／ 🔁 やり直し ${m.redo}人`+(m.ok?' ／ 全員最高！ カードを引いた人にお助け':m.counted?'':' ／ やり直し！ もう一度選ばれることも');}
  if(card==='buttons')sub=state.buttonOutcome===1?'今回カードを引いた人が対象':'カードを引いた人以外の全員が対象';
  if(VL.has(card))sub=`お題：${promptLists[card][state.prompt]??''} ／ 得票1位がメーター${state.pick?'（同率→ルーレット）':''}`;
  if(card==='majority'){const nb=players.filter(p=>state.results?.[p.uid]===1).length,na=players.length-nb,majL=nb>na?1:0,kd=state.side===0?'A派':'B派';sub=state.mall?`派閥が決まらないまま、お題を使い切りました。全員にお助け＋1`:`A ${na}人 / B ${nb}人${na===nb?'（半々）':''} ／ 今回メーター＋${majW(state)}されるのは、${kd}の皆さんです`;}
  if(card==='king'){const o=dangerOutcome(state),ot=typeof kgData.o==='number'?`「${kingOrders[kgData.o]}」 ／ `:'';sub=ot+(o.accepted?'👑 命令に従いました！ 従った人にお助け＋1':'🙅 命令を拒否！ 拒否した人がメーター＋2');}
  if(card==='danger'){const o=dangerOutcome(state);sub=!o.accepted?'断られた！ 誘った人がメーター':o.fate==='HEAVEN'?'👼 HEAVEN！ 2人ともお助けGET':'🔥 HELL！ 2人ともメーター＋2';}
  if(card==='roulette')sub='🎰 全員のルーレットが終わりました'+(gets.size?' ／ お助けGETの人は🎁':'');
  if(card==='grid'){const nm=id=>byUid.get(id)?.name||'？';sub=state.gb===1?`😈 強欲の報い！ 💥 ${nm(state.bx)}が爆弾を押した！ ${nm(state.bx)}がメーター＋4`:`💥 ${nm(state.bx)}が爆弾を押した！ ${nm(state.bx)}がメーター＋2`+(gets.size?' ／ お助けを押した人は🎁お助けGET':'');}
  if(card==='reaction'){const nm=id=>byUid.get(id)?.name||'？',lt=state.results?.[state.bl];sub=`💥 ${nm(state.bx)}の手元で爆発！ ${state.bx===state.bl?`${nm(state.bx)}は最長でもあったのでメーター＋2`:`${nm(state.bx)}がメーター＋1`} ／ 🏆 一番長く持っていたのは ${nm(state.bl)}（${typeof lt==='number'?(lt/1000).toFixed(1):'？'}秒）${state.bx===state.bl?'':'→ お助けGET'}`;}
  if(card==='battery'&&hasDoubt(state)&&losers.length===1&&Object.values(state.dbj||{}).length>0&&Object.values(state.dbj||{}).every(v=>v===1)){
   try{const w=doubtH1({losers,rows,uid,state,div,txt,popImg,avatarOf});
    if(mdAt.round!==state.round)mdAt={round:state.round,t:performance.now(),skip:false};
    const el_=(performance.now()-mdAt.t)/1000;
    document.getElementById('tenGame')?.style.setProperty('--mds',`-${el_.toFixed(2)}s`);
    if(mdAt.skip||el_>6)w.classList.add('md-seen');
    w.addEventListener('click',()=>{mdAt.skip=true;w.classList.add('md-seen');},{once:true});
    return w;}catch(e){}
  }
  if(card==='reaction'&&state.bx&&rows.some(r=>r.p.uid===state.bx)){
   try{
    if(mdAt.round!==state.round)mdAt={round:state.round,t:performance.now(),skip:false};
    const el_=(performance.now()-mdAt.t)/1000;
    if(el_<0.3&&!bmBuzz[state.round]){bmBuzz[state.round]=1;try{navigator.vibrate?.([200,60,300]);}catch{}}
    const ex=rows.find(r=>r.p.uid===state.bx);
    const w=bombResult({losers:[ex],rows,uid,state,div,txt,popImg,avatarOf,elapsed:el_});
    document.getElementById('tenGame')?.style.setProperty('--mds',`${(BLAST_S-el_).toFixed(2)}s`);
    if(mdAt.skip||el_>BLAST_S+6)w.classList.add('md-seen');
    w.addEventListener('click',()=>{mdAt.skip=true;w.classList.add('md-seen');},{once:true});
    return w;}catch(e){}
  }
  const doubtRows=card==='battery'&&hasDoubt(state)?Object.entries(state.dbt).filter(([,t])=>t!=='skip').map(([d,t])=>{const j=state.dbj?.[d],dn=byUid.get(d),tn=byUid.get(t);return div('row safe',avImgEl(dn),txt('span','who',`${d===uid?'あなた':dn?.name||'？'} → ${t===uid?'あなた':tn?.name||'？'}`),txt('span','detail',`${batPct(state.results?.[t])}％`),txt('span','cups',j===1?'✅ ダウト成功':j===0?'❌ ダウト失敗':'判定なし'));}):[];
  return div('board',txt('h3','verdict',verdict),...(sub?[txt('p','sub',sub)]:[]),...(doubtRows.length?[div('rows',...doubtRows)]:[]),
   ...(losers.length?[div('lcards',...losers.map(r=>{let tkl=null;try{const pl=tequilaPlan(allDrinks,ids(),state.round,previousSettlement());tkl=pl?.[r.p.uid]?.tickets;}catch{}const dt=[r.detail,gets.has(r.p.uid)?'🎁お助けGET':''].filter(Boolean).join(' · ');return div('lcard'+(r.p.uid===uid?' me':''),avImgEl(r.p),div('lbody',txt('span','who',r.p.name),...(dt?[txt('span','detail',dt)]:[])),...(typeof tkl==='number'?[shot(tkl+r.amt,'rank gain')]:[]),txt('span','lamt',`メーター＋${r.amt}`));}))]:[]),
   ...(rows.length>losers.length?[div('safes',...rows.filter(r=>r.amt<=0).map(r=>div('safe1'+(r.p.uid===uid?' me':''),div('safeav',avImgEl(r.p),txt('i','shield','✓'),...(gets.has(r.p.uid)?[txt('i','gift','🎁')]:[])),txt('span','who',r.p.uid===uid?'あなた':r.p.name),...(card==='ten'&&r.detail?[txt('span','sec',r.detail)]:[])))) ]:[]));
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
    if(open&&!canUse&&!marks3.includes('y'))f.append(txt('p','fine','…'));
    else if(open){
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
   const counts={};for(const [k,v] of Object.entries(itemMap||{}))if(items[v]&&spentMap?.[k]===undefined)counts[v]=(counts[v]||0)+1;
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
 let flipGhost=null; // めくれたカードの位置（ポップへつなぐ演出用）
 function grabFlip(round){try{const r=document.querySelector('#tenGame .flipcard')?.getBoundingClientRect?.();if(r&&r.width)flipGhost={round,r:{left:r.left,top:r.top,width:r.width,height:r.height},card:state?.card};}catch{}}
 function ghostCard(g,toBook){ // 表のカードが、拡大しながらポップに変わる／説明書に縮んで消える
  try{if(!g||!g.card||!document.body.animate)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const c=div('flipcard ghost',div('face front k-'+g.card,cardFace(g.card)));
   Object.assign(c.style,{position:'fixed',left:g.r.left+'px',top:g.r.top+'px',width:g.r.width+'px',height:g.r.height+'px',zIndex:'80',pointerEvents:'none',animation:'none',transform:'scale(1.15)'});document.body.append(c);
   let kf,dur=420;
   if(toBook){const bb=document.querySelector('#tenGame .cardInfo')?.getBoundingClientRect?.();const dx=bb?bb.left+bb.width/2-(g.r.left+g.r.width/2):0,dy=bb?bb.top+bb.height/2-(g.r.top+g.r.height/2):-200;dur=520;kf=[{transform:'scale(1.15)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.06)`,opacity:0}];}
   else kf=[{transform:'scale(1.15)',opacity:1,filter:'brightness(1)'},{transform:'scale(1.9)',opacity:0,filter:'brightness(1.6)'}];
   c.animate(kf,{duration:dur,easing:'ease-in',fill:'forwards'}).onfinish=()=>c.remove();setTimeout(()=>c.remove(),dur+300);}catch{}
 }
 function flipCard(card){
  const ms=globalThis.__nqFlipMs??4500; // めくれたあと、表面を約1.5秒長く見せる
  if(!flipTimer){flipStart=performance.now();const round=state.round;flipTimer=setTimeout(()=>{flipTimer=null;if(dead)return;grabFlip(round);flipRound=round;render();},ms);}
  const c=div('flipcard',div('face back',cardBack()),div('face front k-'+card,cardFace(card)));
  c.style.animationDelay=-Math.max(0,performance.now()-flipStart)+'ms';
  const rays=div('dfx-rays'),fx=div('drawfx',rays);for(let i=0;i<22;i++){const sp=el('i');sp.className='dfx-sp';const an=Math.random()*6.283,r=80+Math.random()*130;sp.style.setProperty('--dx',Math.cos(an)*r+'px');sp.style.setProperty('--dy',Math.sin(an)*r+'px');sp.style.animationDelay=(-Math.max(0,performance.now()-flipStart)+1400+Math.random()*150)+'ms';fx.append(sp);}
  rays.style.animationDelay=c.style.animationDelay;
  const gl=div('dfx-glow');gl.style.animationDelay=c.style.animationDelay;
  const pr=promptLists[card]?.[state.prompt],cap=div('flipcap',txt('b','',cards[card].title.replace(/^👑\s*/,'')),...(pr?[txt('span','pr',pr)]:[]));cap.style.animationDelay=c.style.animationDelay;
  const fw=div('flipwrap',gl,c,cap);fw.onclick=()=>{clearTimeout(flipTimer);flipTimer=null;if(dead)return;grabFlip(state.round);flipRound=state.round;render();};
  box.classList.add('flipping');
  box.append(txt('h3','verdict','カードが引かれた！'),fw,fx);
 }
 let majSeen={round:0,mk:0,own:null,pair:null},majTie=null,abRnd=0,abT0=0;
 // 多数派？少数派？：答えが割れなかった（全員同じ／半々）ときのお知らせページ
 function majTieUi(x){
  box.append(txt('h3','verdict','全員同じ答え！'));
  box.append(txt('p','sub abPlain',x.own===0||x.own===1?`みんな「${['A','B'][x.own]}：${x.pair?.[x.own]??''}」でした`:'みんな同じ派閥でした'));
  box.append(txt('p','sub abPlain','派閥が分かれるまでゲームを続けます'));
  box.append(div('abCarry',txt('small','','ペナルティ持ち越し'),txt('b','',`${x.mk}回目`),txt('span','',`持ち越し${x.mk}回になります`)));
 }
 // 選んだ結果の一覧（A派／B派）。「確認した」を押すか、時間が来たらルーレットへ（この端末だけで数える・通信なし）
 let revealRnd=0,revealT0=0,revealTm=null;
 function majReveal(){
  const REV=globalThis.__nqRevealMs??20000;
  if(revealT0===0||revealT0.round!==state.round)revealT0={round:state.round,t:performance.now()};
  const el_=performance.now()-revealT0.t,go=()=>{clearTimeout(revealTm);revealTm=null;revealRnd=state.round;if(!dead)render();};
  if(el_>=REV){go();return;}
  if(!revealTm)revealTm=setTimeout(()=>{if(!dead&&state?.round===revealT0.round)go();},REV-el_+30);
  const pair=promptLists.majority[state.prompt]||['',''],sideP=k=>players.filter(p=>state.results?.[p.uid]===k);
  const na=sideP(0).length,nb=sideP(1).length;
  const col=k=>div('abCol k'+k,txt('b','',k===0?'A派':'B派'),txt('small','',pair[k]||''),div('abAvs',...sideP(k).map(p=>div('abAv',avImgEl(p),txt('span','',p.name||'？')))));
  box.append(txt('h3','verdict',na===nb?`${na}対${nb}！ 同数でした`:`${Math.max(na,nb)}対${Math.min(na,nb)}でした！`),div('abCols',col(0),col(1)));
  const bi=el('i');try{bi.style.animationDuration=REV+'ms';bi.style.animationDelay=(-el_)+'ms';}catch{}const bar=div('abBar',bi);
  button('確認した',()=>go(),false);box.append(bar);
 }
 function abRoulette(){
  const CD=globalThis.__nqCountMs??3000,ms=globalThis.__nqPickMs??3400;
  if(abRnd!==state.round){abRnd=state.round;abT0=performance.now();}
  const nb=players.filter(p=>state.results?.[p.uid]===1).length,na=players.length-nb,majL=nb>na?1:0,half=na===nb,picked=state.side===0?'A派':'B派',other=state.side===0?'B派':'A派';
  if(!pickTimer){const round=state.round;pickTimer=setTimeout(()=>{pickTimer=null;if(dead)return;pickRound=round;render();},CD+ms);}
  box.append(txt('h3','verdict',`A ${na}人 / B ${nb}人`));
  const el_=performance.now()-abT0;
  if(el_<CD){ // 3・2・1
   const n=Math.max(1,3-Math.floor(el_/(CD/3)));
   box.append(txt('p','sub abPlain','ルーレットで「A派」か「B派」を決めます'),txt('div','abcount',String(n)));
   if((state.mk||0)>0)box.append(div('abWarn',txt('b','',`⚠ 注意！ 次回のメーターは＋${majW(state)}`),txt('i','','次の負けは重い！')));
   setTimeout(()=>{if(!dead&&state?.round===abRnd)render();},Math.max(30,(CD/3)*(4-n)-el_+20));
   return;
  }
  const total=22,items=[];
  for(let i=0;i<total;i++)items.push(txt('span','pickitem',(total-1-i)%2===0?picked:other));
  const reel=div('pickreel',...items);reel.style.setProperty('--stop',(-(total-1)*60)+'px');
  box.append(txt('p','sub','ルーレットで選ばれた派閥の人がメーター＋'+majW(state)),div('pickwin',reel));
 }
 // 充電：ダウトがなかったときの HIGH／LOW ルーレット（HIGH＝最も多い人、LOW＝最も少ない人がメーター＋1）
 function hlRoulette(){
  const ms=globalThis.__nqPickMs??3400;
  if(!hlTimer){const round=state.round;hlTimer=setTimeout(()=>{hlTimer=null;if(dead)return;hlRound=round;render();},ms);}
  const total=state.direction==='HIGH'?23:22,items=[];
  for(let i=0;i<total;i++)items.push(txt('span','pickitem hlitem '+(i%2===0?'hi':'lo'),i%2===0?'HIGH':'LOW'));
  const reel=div('pickreel',...items);reel.style.setProperty('--stop',(-(total-1)*60)+'px');
  box.append(txt('h3','verdict','ダウトなし！ HIGH？ LOW？'),txt('p','sub','HIGH＝いちばん多い人 ／ LOW＝いちばん少ない人 がメーター＋1'),div('pickwin',reel));
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
   const oi=typeof kgData.o==='number'?kgData.o:null,ordTxt=oi!==null?kingOrders[oi]:null,prev=state.ky?name(currentTurn(state,players).uid):'';
   if(ordTxt&&target)box.append(el('h3',`👑 王様の命令：「${ordTxt}」`));
   if(actor===uid){
    if(typeof own!=='number'){
     if(kingYield){ // 譲る相手を選ぶ
      box.append(el('p','王様を譲る相手を選んでください。（1回だけ。譲られた人があらためて相手と命令を選びます）'));
      for(const p of players)if(p.uid!==uid)button(`${p.name}に譲る`,()=>set(ref(db,`${base}/kg/${state.round}/y`),Number(p.slot)),pending);
      button('やめる',async()=>{kingYield=false;},false,'secondary');
     }else if(kingTarget===null){
      box.append(el('p',state.ky?`👑 ${prev}から王様を譲られました！ 命令する相手を1人選ぼう。`:'👑 あなたが王様！ まず、命令する相手を1人選ぼう。命令に従えばお助け＋1、拒否するとメーター＋2。'));
      for(const p of players)if(p.uid!==uid)button(`${p.name}に命令する`,async()=>{kingTarget=Number(p.slot);},pending);
     }else{
      const tp=players.find(p=>Number(p.slot)===kingTarget);
      box.append(el('h3',`${tp?.name||'？'}への命令を選ぼう`),el('p','選んだ命令は、全員の画面に表示されます。'));
      for(const k of kingOpts())button(kingOrders[k],async()=>{if(typeof kgData.o!=='number')await set(ref(db,`${base}/kg/${state.round}/o`),k);await set(ref(db,`${base}/answers/${state.round}/${uid}`),kingTarget);},pending||!deckReady());
      if(!state.ky)button('👑 王様を譲る',async()=>{kingYield=true;},false,'secondary');
      button('相手を選び直す',async()=>{kingTarget=null;},typeof kgData.o==='number','secondary');
     }
    }else box.append(el('p',target?`${name(target)}に命令しました。返事を待っています。`:'命令を送っています…'));
   }else if(target===uid){
    if(typeof own!=='number'){box.append(el('h3',`👑 ${name(actor)}王様の命令です`),el('p','命令を聞いて、従うか拒否するか選ぼう。従えばお助け＋1、拒否するとあなたがメーター＋2。'));button('従う（お助け＋1）',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),1),pending);button('拒否する（メーター＋2）',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),0),pending,'secondary');}
    else box.append(el('p','返事を送りました。結果を待っています。'));
   }else box.append(el('p',target?`${name(actor)}王様が${name(target)}に命令中。返事待ち…`:state.ky?`${name(actor)}が${prev}から王様を譲られました。命令する相手を選んでいます…`:typeof kgData.y==='number'?`${name(actor)}王様が王様を譲っています…`:`${name(actor)}王様が命令する相手を選んでいます…`));
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
 const needSecond=()=>state.card==='roulette'&&itemsOfCode(state.results?.[uid])>=2||tenExact(state,uid)||(state.card==='grid'&&(state.results?.[uid]||0)>=10000); // 2枚目：ルーレット＋2／＋3・10秒ジャスト・強欲中のお助け
 const nextSlot=()=>Math.max(-1,...Object.keys(itemMap||{}).map(Number))+1;
 const grantPending=()=>{if(!winnerNow()||grantMap===undefined||itemMap===undefined)return false;if(nextSlot()>=59)return false;const g=grantMap[String(state.round)];if(g===undefined)return true;if(itemMap[String(g)]===undefined)return true;return needSecond()&&itemMap[String(Number(g)+1)]===undefined;};
 function heldIn(grp){let n=0;for(const [k,v] of Object.entries(itemMap||{}))if(items[v]&&spentMap?.[k]===undefined&&itemGroup(v)===grp)n++;return n;}
 async function grantOwn(){
  if(dead||grantBusy||state?.phase!=='results'||!itemsReady()||settledMap[uid]||!grantPending())return;
  const round=state.round,g=grantMap[String(round)];let slot;
  if(g===undefined)slot=nextSlot();
  else if(itemMap[String(g)]===undefined)slot=Number(g);
  else slot=Number(g)+1;
  let kind=drawItem();if(heldIn(itemGroup(kind))>=ITEM_CAP[itemGroup(kind)])kind='none'; // いっぱいなら取り損ね
  grantBusy=true;
  try{if(g===undefined)await set(ref(db,`personal/${roomId}/${uid}/grants/${round}`),slot);await set(ref(db,`personal/${roomId}/${uid}/items/${slot}`),kind);if(kind!=='none')glowHelpTab();}
  catch{message('お助けを受け取れませんでした。再接続してください。');}
  finally{grantBusy=false;if(!dead)render();}
 }
 function glowHelpTab(){try{const t=document.getElementById('tabHelp');if(!t)return;t.classList.add('helpGlow');setTimeout(()=>t.classList.remove('helpGlow'),3500);}catch{}}
 // ---- ダウト（充電マウント合戦）----
 const doubtRefs=()=>({d:`${base}/bt/${state.round}/d`,j:`${base}/bt/${state.round}/j`,vals:`${base}/bt/${state.round}/vals`});
 const dMap=()=>btData.d||{},jMap=()=>btData.j||{};
 const dAllIn=()=>!!btData.vals&&players.every(p=>dMap()[p.uid]!==undefined);
 const doubters=()=>players.filter(p=>{const t=dMap()[p.uid];return t!==undefined&&t!=='skip';});
 function showDoubtTelop(){
  if(bot||dead||btTelopRound===state.round)return;btTelopRound=state.round;
  fxOverlay('telopFx',`<div class="tBand"><div class="tAv">📣</div><div class="tNm" style="font-size:${fitPx(6,46)}">ダウト受付中！</div><div class="tSb">怪しい数字の人を、1人だけダウトできるよ</div></div>`,{autoMs:1800});
 }
 function doubtUi(){
  const vals=btData.vals,d=dMap(),j=jMap(),all=dAllIn();
  if(!btSeenAt)btSeenAt=performance.now();
  root.setAttribute('data-bt','1');
  const dbRow=(p,pick)=>{
   const me=p.uid===uid,chosen=d[uid]===p.uid,r=div('dbRow'+(me?' me':'')+(chosen?' picked':''),avImgEl(p),div('dbMain',txt('span','dbName',me?`${p.name}（あなた）`:p.name),txt('span','dbPct',`${vals[p.uid]}％`)));
   if(pick&&!me){
    if(d[uid]===undefined){const b=el('button','🔍 ダウト');b.className='dbBtn';b.disabled=pending;b.onclick=async()=>{if(pending||dead)return;pending=true;render();try{await writeDoubt(p.uid);}finally{pending=false;if(!dead)render();}};r.append(b);}
    else if(chosen)r.append(txt('span','dbTag','🔍 ダウト中'));
   }
   return r;
  };
  const table=div('dbRows',...players.map(p=>dbRow(p,!all)));
  if(!all){
   showDoubtTelop();
   const cl=txt('span','dbCl','ダウト受付中'),cn=txt('b','dbCn',''),cd=div('dbCount',cl,cn);
   box.append(txt('h3','verdict','📣 ダウトタイム'),cd,table);
   const upd=()=>{if(!cd.isConnected){clearInterval(btCd);btCd=null;return;}const left=Math.max(0,Math.ceil((DOUBT_MS()-(performance.now()-btSeenAt))/1000));cl.textContent=d[uid]===undefined?'ダウト受付中':'選択ずみ · みんなを待っています';cn.textContent=d[uid]===undefined?String(left):'';cd.className='dbCount'+(d[uid]===undefined&&left<=3?' low':'');if(d[uid]===undefined&&!btMineD&&performance.now()-btSeenAt>=DOUBT_MS()){clearInterval(btCd);btCd=null;writeDoubt('skip',true);}};
   upd();clearInterval(btCd);btCd=setInterval(upd,250);
   if(d[uid]===undefined){
    button('ダウトしない（次へ）',()=>writeDoubt('skip'),pending,'secondary');
   }
   return;
  }
  // 判定：ホストが、ダウトされた人の「ウソ／ホント」の申告を見て自動で決める（ボタンはない）
  const ds=doubters();
  box.append(txt('h3','verdict','📣 ダウト判定'),table);
  for(const p of ds){
   const t=byUid.get(d[p.uid]),jj=j[p.uid];
   box.append(div('row safe',avImgEl(p),txt('span','who',`${p.uid===uid?'あなた':p.name} → ${t?.uid===uid?'あなた':t?.name||'？'}`),txt('span','detail',`${vals[t?.uid]}％`),txt('span','cups',jj===1?'✅ ダウト成功（ウソだった）':jj===0?'❌ ダウト失敗（ホントだった）':jj===2?'判定なし':'判定中…')));
  }
  const mine=d[uid],isTarget=ds.some(p=>d[p.uid]===uid);
  if(mine!==undefined&&mine!=='skip'){
   box.append(txt('p','fine',j[uid]===undefined?'判定中…（相手の「ウソ／ホント」の申告で、自動で決まります）':'判定ずみ · みんなを待っています'));
  }else if(isTarget)box.append(txt('p','hint2','📣 あなたはダウトされました。判定中…（自分の申告で自動で決まります）'));
  else box.append(txt('p','fine','ダウトの判定を待っています…'));
 }
 function writeDoubt(target,quiet=false){if(btMineD)return;btMineD=true;const r=doubtRefs();return set(ref(db,`${r.d}/${uid}`),target).catch(()=>{btMineD=false;if(!quiet)message('ダウトを送れませんでした。再接続してもう一度試してください。');});}
 function writeJudge(v){if(btMineJ)return;btMineJ=true;const r=doubtRefs();return set(ref(db,`${r.j}/${uid}`),v).catch(()=>{btMineJ=false;message('判定を送れませんでした。再接続してもう一度試してください。');});}
 // 練習モードのNPC：ダウトは基本しない（たまにする）。判定はホストが自動で行う
 function btBot(){
  if(!bot||dead||state?.card!=='battery'||state.phase!=='measuring'||!btData.vals)return;
  const d=dMap(),key=state.round+':'+(d[uid]===undefined?'d':'x');
  if(btBotKey===key||key.endsWith(':x'))return;btBotKey=key;const round=state.round;
  if(key.endsWith(':d'))setTimeout(()=>{if(dead||state?.round!==round)return;const others=players.filter(p=>p.uid!==uid);set(ref(db,`${base}/bt/${round}/d/${uid}`),Math.random()<0.15?others[Math.floor(Math.random()*others.length)].uid:'skip').catch(()=>{});},(800+Math.random()*2500)*(globalThis.__nqNpcMs??1));
 }
 // ホスト：10秒たっても選ばない人は「ダウトしない」。ダウトの判定は申告から自動（万一できないときは30秒後に「判定なし」）
 function btTick(){
  if(!host||dead||state?.card!=='battery'||state.phase!=='measuring'||!btValsAt){clearInterval(btHostTimer);btHostTimer=null;return;}
  const now=performance.now(),d=dMap(),j=jMap(),round=state.round;
  if(now-btValsAt>=DOUBT_MS()+2000)for(const p of players)if(d[p.uid]===undefined)set(ref(db,`${base}/bt/${round}/d/${p.uid}`),'skip').catch(()=>{});
  if(dAllIn()&&doubters().length&&!btJudgeAt)btJudgeAt=now;
  if(dAllIn())for(const p of doubters()){const k=round+':'+p.uid;if(j[p.uid]!==undefined||btJSent.has(k))continue;const a=answers[d[p.uid]];if(typeof a!=='number')continue;btJSent.add(k);set(ref(db,`${base}/bt/${round}/j/${p.uid}`),batLie(a)?1:0).catch(()=>btJSent.delete(k));}
  if(btJudgeAt&&now-btJudgeAt>=JUDGE_MS())for(const p of doubters())if(j[p.uid]===undefined)set(ref(db,`${base}/bt/${round}/j/${p.uid}`),2).catch(()=>{});
 }
 // 充電の値をみんなに見せる（ダウトの材料）。全員が入力したらホストが1回だけ書く。ダウトの選択・判定がそろったら true を返す
 async function batteryGate(){
  if(!players.every(p=>typeof answers[p.uid]==='number'))return false;
  if(!btData.vals){
   if(btWriting)return false;btWriting=true;
   try{await set(ref(db,`${base}/bt/${state.round}/vals`),Object.fromEntries(players.map(p=>[p.uid,batPct(answers[p.uid])])));btValsAt=performance.now();clearInterval(btHostTimer);btHostTimer=setInterval(btTick,500);}
   catch{message('充電の公開に失敗しました。ホストは再読み込みして再接続してください。');btWriting=false;}
   return false;
  }
  if(!btValsAt){btValsAt=performance.now();clearInterval(btHostTimer);btHostTimer=setInterval(btTick,500);} // ホストが再読み込みした場合
  if(!dAllIn())return false;
  const ds=doubters();return ds.every(p=>jMap()[p.uid]!==undefined);
 }
// 王様を譲る：譲る相手が書かれたら、ホストが「今回の王様」を切り替える（1回だけ）
 // ---- そのボタン、押して大丈夫？（マス目）----
 const normLg=o=>Object.entries(o||{}).filter(([k,x])=>x&&typeof x.u==='string'&&typeof x.c==='number').map(([k,x])=>({k:Number(k),u:x.u,c:x.c,r:x.r,n:x.n})).sort((a,b)=>a.k-b.k);
 const gridOrder=()=>Object.values(state.order||players.map(p=>p.uid));
 const gridStartUid=()=>gridStartOf(gridOrder(),gateGo,state.actor||currentTurn(state,players).uid);
 const gridState=()=>gridReplay(gmLg,gridOrder(),gridStartUid(),gateGo);
 // スタート合図〜爆弾が落ちるまでの間は、まだ押せない（合図が来ない古いルールのときは、待ち時間切れで始まる）
 function gridGate(){if(!gateSince)gateSince=performance.now();if(gateGo===null)return performance.now()-gateSince<(globalThis.__nqGateFallbackMs??55000);return srvNow()-gateGo<BMCD()+(globalThis.__nqGridDropMs??900+GDROP_MS);}
 async function gridAppend(u,c,n){ // host：1手を記録（爆弾ならそのままゲーム終了）
  const st=gridState();if(!gmLay||gridGate()||!gridCan(st,u,c))return false;
  const pl=parseLay(gmLay),hd=c===GPASS?0:pl.hard[c]; // 固い岩：耐久度ぶん叩くまで割れない（叩いた分は次の人に引き継ぐ）
  const r=c===GPASS?'p':(hd&&(st.taps?.[c]||0)+1<hd?'t':pl.cells[c]),k=gmLg.length-1;
  await set(ref(db,`${base}/gm/${state.round}/lg/${gmLg.length}`),{u,c,r,k,...(typeof n==='number'?{n}:{})});
  if(r==='b'){
   const round=state.round,after=gridReplay([...gmLg,{u,c,r}],gridOrder(),gridStartUid(),gateGo);
   await set(ref(db,`${base}/gm/${round}/done`),true);
   await runTransaction(ref(db,base+'/state'),t=>t?.round===round&&t.phase==='measuring'&&t.card==='grid'?{...t,phase:'results',results:gridResults(after,gridOrder()),bx:u,gb:after.bombG?1:0}:undefined,{applyLocally:false});
  }
  return true;
 }
 async function gridAuto(){ // 切断・放置の人の代わりに、ホストが1手進める（まだ押していなければランダムに押す／押していれば回す）
  const st=gridState();if(st.over||!gmLay||gridGate())return;
  const free=[...Array(GCELLS).keys()].filter(c=>!st.pressed[c]);
  const c=st.cnt>=1?GPASS:free[Math.floor(Math.random()*free.length)];
  try{await gridAppend(st.cur,c);}catch{message('マス目を進められませんでした。再読み込みして再接続してください。');}
 }
 async function gridHost(){
  if(dead||!host||state?.card!=='grid'||state.phase!=='measuring'||gmBusy)return;
  if(!gmLay){ // 最初：爆弾・お助けの配置をホストだけが読める場所に書く
   if(gmIniting)return;gmIniting=true;
   try{const cur=(await get(ref(db,`${base}/gm/${state.round}/lay`))).val();if(typeof cur==='string')gmLay=cur;else{const lay=genLayout();await set(ref(db,`${base}/gm/${state.round}/lay`),lay);gmLay=lay;}}
   catch{message('マス目を準備できませんでした。ホストは再読み込みして再接続してください。');}
   finally{gmIniting=false;}
  }
  if(!gmLay)return;
  if(!gmHint&&!gmHintIniting){gmHintIniting=true;try{const cur=(await get(ref(db,`${base}/gm/${state.round}/hint`))).val();if(hintOk(cur))gmHint=cur;else{const h=genHints(gmLay);await set(ref(db,`${base}/gm/${state.round}/hint`),h);gmHint=h;}}catch{/* 古いルールのときは、岩の演出なしで遊べる */}finally{gmHintIniting=false;}}
  gmBusy=true;
  try{
   for(let guard=0;guard<4;guard++){
    const st=gridState();if(st.over)break;
    const req=gmRq[st.cur];if(!req||!(req.n>(gmDone[st.cur]||0)))break;
    gmDone[st.cur]=req.n;
    if(!(await gridAppend(st.cur,req.c,req.n)))continue;
    break;
   }
  }catch{message('マス目の記録を送れませんでした。ホストは再読み込みして再接続してください。');}
  finally{gmBusy=false;}
  if(!gmTimer)gmTimer=setInterval(()=>{
   if(dead||state?.card!=='grid'||state.phase!=='measuring'){clearInterval(gmTimer);gmTimer=null;return;}
   const st=gridState();if(st.over||gridGate())return;
   if(!connOf(st.cur)){gmDisc+=500;if(gmDisc>=3000){gmDisc=0;gridAuto();}}else gmDisc=0;
  },500);
 }
 function gridUi(){
  const gate=gridGate();
  if(gate){const v=gateView();if(v){box.append(...v);return;}}
  const st=gridState(),cur=byUid.get(st.cur),mine=st.cur===uid;
  if(gate&&mine&&gridBuzz!==state.round){gridBuzz=state.round;try{navigator.vibrate?.([80,40,160]);}catch{}}
  // 誰の番か：順番にアイコンを並べ、今の人だけ大きく光らせる（押した数と、いまの人の「今回押した数」つき）
  const ord=gridOrder().map(u=>byUid.get(u)).filter(Boolean);
  box.append(div('gturn',...ord.map(p=>{const on=p.uid===st.cur,n=st.presses?.[p.uid]||0;
   const d=div('gt'+(on?' on':'')+(p.uid===uid?' me':''),avImgEl(p),txt('b','',p.uid===uid?'あなた':(p.name||'？')),txt('i','',on&&st.cnt?`今 ${st.cnt}個`:n?`${n}個`:''));d.setAttribute('aria-current',on?'true':'false');return d;})));
  const gr=st.greedy?.[st.cur]?'😈 強欲な':'';
  box.append(txt('h3','verdict gturnTxt'+(gr?' greedy':''),mine?(gate?`🎲 ${gr}あなたからスタート！`:`👉 ${gr}あなたの番！`):(gate?`🎲 ${gr}${cur?.name||'？'}からスタート！`:`${gr}${cur?.name||'？'}の番`)));
  if(st.lit&&!st.over)box.append(txt('p','greedNote',`😈 強欲中：爆弾のペナルティが2倍（${st.litNow?'いま点灯':'点灯ずみ'}）`));
  // 天の声：強欲が点灯した瞬間（全員に約2.6秒）
  if(st.litNow){const key=state.round+':'+gmLg.length;if(gTel.key!==key)gTel={key,t:performance.now()};const el_=(performance.now()-gTel.t)/1000;
   if(el_<2.6){const tp=div('greedTelop',txt('small','','天の声'),txt('b','',st.litNow===uid?'あなたは強欲ですね…':`${byUid.get(st.litNow)?.name||'？'}は強欲ですね…`));tp.style.setProperty('--gte',`-${el_.toFixed(2)}s`);box.append(tp);
    if(el_<0.4&&st.litNow===uid){try{navigator.vibrate?.([200,80,200]);}catch{}}
    clearTimeout(gTel.rt);gTel.rt=setTimeout(()=>{if(!dead)render();},Math.max(60,(2.65-el_)*1000));}}
  const waiting=gmWaitLen===gmLg.length&&performance.now()<gmWaitUntil;
  const grid=div('grid12');
  // つるはし演出：新しく増えた記録のマスに、振り下ろす絵を約0.45秒だけ重ねる（再描画しても続きから）
  if(gAnim.round!==state.round)gAnim={round:state.round,n:gmLg.length,c:-1,t:0};
  else if(gmLg.length>gAnim.n){const e=gmLg.at(-1);gAnim={round:state.round,n:gmLg.length,c:e&&e.r!=='p'?e.c:-1,t:performance.now(),hard:e?.r==='t'};}
  const swingMs=performance.now()-gAnim.t;
  for(let c=0;c<GCELLS;c++){
   const hit=st.pressed[c],tp=st.taps?.[c]||0,hc=gmHint?gmHint[c]:'n',seed=state.round*37+c;
   const b=document.createElement('button');b.type='button';b.className='rk';
   if(hit){b.className='rk op'+(hit.g?' hit-g':'')+(gAnim.c===c&&swingMs<900?' fresh':'');
    b.innerHTML=openedSvg(seed,hit.r);b.append(txt('small','who',byUid.get(hit.u)?.name||''));b.disabled=true;
    b.title=(hit.r==='b'?'爆弾':hit.r==='h'?'お助け':'空振り')+' '+(byUid.get(hit.u)?.name||'');}
   else{
    b.innerHTML=rockSvg(seed,hc==='c'||hc==='g'||hc==='k'?hc:'n',tp);
    if(hc!=='n'){b.className='rk hint-'+hc+(gate?' dropIn':'');if(gate)b.style.setProperty('--rd',(c%6)*0.12+'s');}
    b.title=hc==='k'?'固い岩':hc==='c'?'ヒビの入った岩':hc==='g'?'金色の岩':'岩';
    b.disabled=!mine||pending||waiting||gate;
    b.onclick=async()=>{if(pending||dead)return;pending=true;gmWaitLen=gmLg.length;gmWaitUntil=performance.now()+4000;render();try{await set(ref(db,`${base}/gm/${state.round}/rq/${uid}`),{n:++gmSeq,c});}catch{message('ゲーム通信に失敗しました。もう一度押してください。');}finally{pending=false;render();}};}
   if(gAnim.c===c&&swingMs<450){const sw=document.createElement('span');sw.className='pickSwing'+(gAnim.hard?' hard':'');try{sw.style.animationDelay=`-${swingMs.toFixed(0)}ms`;}catch{}sw.innerHTML=pickSvg+sparkSvg;b.append(sw);if(swingMs<60){try{navigator.vibrate?.(15);}catch{}}clearTimeout(gAnim.rt);gAnim.rt=setTimeout(()=>{if(!dead)render();},460-swingMs);}
   grid.append(b);
  }
  box.append(grid);
  if(mine&&st.cnt<1)button('1つ押すと、次の人に回せます',async()=>{},true,'secondary');
  if(mine&&st.cnt>=1)button('次の人へ回す',async()=>{gmWaitLen=gmLg.length;gmWaitUntil=performance.now()+4000;await set(ref(db,`${base}/gm/${state.round}/rq/${uid}`),{n:++gmSeq,c:GPASS});},pending||waiting,'secondary');
  if(host&&!mine&&!gate)button(`${cur?.name||'？'}を飛ばして進める`,()=>gridAuto(),pending,'secondary');
 }
 // ---- GO TO HEAVEN OR HELL（ルーレット三段勝負）----
 // 記録 rl/<round>/<uid>/{0,1,2,d}：回すたびに {k:段階,o:結果,a:演出の種} を本人が書き、確定は d。全員の端末が同じ記録から同じ動きを作る。
 const rlSeq=()=>rlOrder(state.order||players.map(p=>p.uid),state.actor||currentTurn(state,players).uid);
 const rlName=u=>u===uid?'あなた':(byUid.get(u)?.name||'？');
 const rlKeyOf=(u,k)=>`${state.round}:${u}:${k}`;
 const rlShort=o=>o==='skip'||!RLK[o]?'パス':RLK[o].t+RLK[o].v;
 function rlEnsureView(){if(!rlView)rlView=createRoulette({sound:rlSnd});return rlView;}
 function rlOnData(v){
  const first=!rlLoaded;rlLoaded=true;rlData=v;
  if(bot){render();return;}
  const view=rlEnsureView();
  for(const u of Object.keys(v)){
   if(u==='go')continue;
   const ch=rlChain(v[u]),fin=rlFinal(v[u]);
   for(const r of ch){
    const key=rlKeyOf(u,r.k);if(rlSeen.has(key))continue;rlSeen.add(key);
    if(first&&(ch.length>r.k||fin!==null)){rlAnimDone.add(key);continue;} // 途中から入った人には、すでに終わった段階を回さない
    rlQueue=rlQueue.then(async()=>{if(dead)return;try{await view.spin(r.k,rlPlan(r.k,r.o,r.a),rlName(u));}catch{}rlAnimDone.add(key);if(!dead)render();});
   }
   if(fin!==null&&!rlHoldQ.has(u)){
    rlHoldQ.add(u);
    if(first){rlHoldUntil[u]=0;}
    else rlQueue=rlQueue.then(()=>{if(dead)return;view.showFinal(rlName(u),fin,ch.length>=3);rlHoldUntil[u]=Date.now()+RL_CONFIG.HOLD_MS;setTimeout(()=>{if(!dead)render();},RL_CONFIG.HOLD_MS+60);render();});
   }
  }
  render();rlHost();
 }
 // いま画面に出す人：まだ確定していない最初の人／確定してからしばらくの間はその人
 function rlShown(seq){
  for(const u of seq){
   const rec=rlData[u],fin=rlFinal(rec),n=rlChain(rec).length;
   if(fin===null)return{u,n,done:n===0||rlAnimDone.has(rlKeyOf(u,n)),fin:null};
   const hu=rlHoldUntil[u];
   if(hu===undefined||Date.now()<hu)return{u,n,done:true,fin};
  }
  return null;
 }
 function rlArm(key,ms,fn){ // 時間切れの処理を1つだけ仕掛ける（画面を描き直しても仕掛け直さない）
  if(rlTimerKey===key)return;
  clearTimeout(rlTimerT);rlTimerKey=key;rlTimerMs=ms;rlTimerEnd=Date.now()+ms;
  rlTimerT=setTimeout(()=>{if(!dead&&rlTimerKey===key)fn();},ms);
 }
 function rlBar(){
  const left=Math.max(0,rlTimerEnd-Date.now()),i=document.createElement('i');
  i.style.width=(left/rlTimerMs*100).toFixed(1)+'%';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{i.style.transition=`width ${left}ms linear`;i.style.width='0%';}));
  return div('rl-timer',i);
 }
 async function rlGo(){try{await set(ref(db,`${base}/rl/${state.round}/go`),true);}catch{message('スタートできませんでした。もう一度押してください。');}}
 async function rlSpin(stage){
  const rec=rlData[uid];if(rlChain(rec).length!==stage-1||rlFinal(rec)!==null)return;
  rlEnsureView().unlock();
  await set(ref(db,`${base}/rl/${state.round}/${uid}/${stage-1}`),{k:stage,o:rlPick(stage),a:rlArt()});
 }
 async function rlFinishOwn(){
  if(dead||state?.card!=='roulette'||state.phase!=='measuring'||rlFinal(rlData[uid])!==null)return;
  try{await set(ref(db,`${base}/rl/${state.round}/${uid}/d`),rlChoice(rlData[uid]));}catch{message('ルーレットの結果を送れませんでした。再接続してください。');}
 }
 async function rlSettleFor(u){ // ホスト：止まってしまった人を、いまの結果（なければパス）で確定する
  if(rlFinal(rlData[u])!==null)return;
  try{await set(ref(db,`${base}/rl/${state.round}/${u}/d`),rlChoice(rlData[u]));}catch{message('ルーレットを進められませんでした。再読み込みして再接続してください。');}
 }
 function rlHost(){
  if(dead||!host||state?.card!=='roulette'||state.phase!=='measuring'||!rlLoaded)return;
  const seq=rlSeq(),cur=rlCur(seq,rlData);
  if(cur===null){
   if(rlFinishing)return;rlFinishing=true;
   const round=state.round,results=resultsOfRl(seq,rlData);
   (async()=>{try{
    await set(ref(db,`${base}/rld/${round}`),true).catch(()=>{});
    await runTransaction(ref(db,base+'/state'),t=>t?.round===round&&t.phase==='measuring'&&t.card==='roulette'?{...t,phase:'results',results}:undefined,{applyLocally:false});
   }catch{message('ルーレットの結果を送れませんでした。ホストは再読み込みして再接続してください。');}finally{rlFinishing=false;}})();
   return;
  }
  if(rlData.go!==true){rlSigAt=Date.now();return;} // スタート前は、待たせても時間切れにしない
  const sig=cur+':'+rlChain(rlData[cur]).length;
  if(sig!==rlSig){rlSig=sig;rlSigAt=Date.now();rlDisc=0;}
  if(!connOf(cur)){rlDisc+=1;if(rlDisc>=4){rlDisc=0;rlSettleFor(cur);}}else rlDisc=0;
  if(Date.now()-rlSigAt>RL_CONFIG.HOST_IDLE_MS){rlSigAt=Date.now();rlSettleFor(cur);}
 }
 function rouletteUi(){
  const view=rlEnsureView(),seq=rlSeq();
  const sb=el('button',rlSnd?'🔊 音 ON':'🔇 音 OFF');sb.className='rl-snd';sb.onclick=()=>{rlSnd=!rlSnd;LS.setItem('nq-rl-snd',rlSnd?'1':'0');view.setSound(rlSnd);render();};
  box.append(sb,view.el);
  if(!rlLoaded){box.append(el('p','ルーレットを準備しています…'));return;}
  const sh=rlShown(seq);
  if(!sh){box.append(el('p','全員のルーレットが終わりました。結果をまとめています…'));return;}
  const {u,n,done,fin}=sh,mine=u===uid,nm=rlName(u);
  const strip=div('rlicons');
  for(const id of seq){
   const f=rlFinal(rlData[id]),shown=id===u;
   strip.append(div('rli'+(shown?' now':''),avImgEl(byUid.get(id)),txt('span','nm',rlName(id)),txt('span','st',shown?(fin!==null?rlShort(fin):'🎰'):f!==null?rlShort(f):'待ち')));
  }
  if(sb.before)sb.before(strip);else box.append(strip);
  if(rlData.go===true&&view.el?.style)view.el.style.display='';
  if(rlData.go!==true){ // スタート前：カードを引いた人（カードを引いた人）が押すまで、誰の時間も動かさない
   if(view.el?.style)view.el.style.display='none';
   const starter=seq[0],sName=rlName(starter);
   if(!view.busy)view.idle(byUid.get(starter)?.name||'？');
   if(!view.busy)view.setText(starter===uid?'あなたがスタート':`${sName}がスタート`,'押すと、順番に回していきます');
   if(starter===uid)button('🎰 スタート',rlGo,pending);
   else{box.append(el('p',`${sName}がスタートするのを待っています…`));if(host)button(`${sName}の代わりにスタート`,rlGo,pending,'secondary');}
   return;
  }
  if(!view.busy&&n===0&&fin===null)view.idle(byUid.get(u)?.name||'？');
  if(!view.busy&&n===0&&fin===null)view.setText(mine?'あなたの番':`${nm}の番`,mine?'ルーレットを回そう':'ルーレットを回します');
  if(fin!==null){/* 確定の表示中：見せるだけ */}
  else if(n===0){
   if(mine){
    rlArm(rlKeyOf(u,'ask'),RL_CONFIG.START_SEC*1000,()=>{if(!rlChain(rlData[uid]).length)rlSpin(1).catch(()=>{});}); // 時間切れは自動で回す
    box.append(el('p','あなたの番！ ルーレットを回そう。'),rlBar());
    button('🎰 ルーレットを回す',()=>rlSpin(1),pending);
   }else box.append(el('p',`${nm}の番です。`));
  }else if(!done){/* 回っている最中 */}
  else if(n<3){
   if(mine){
    rlArm(rlKeyOf(u,'ask'+n),RL_CONFIG.ASK_SEC*1000,rlFinishOwn);
    box.append(el('p',`${RLS[n].ask}（${RL_CONFIG.ASK_SEC}秒で確定）。回し直すと前回の結果は無効になります。`),rlBar());
    button('✅ この結果で確定',()=>rlFinishOwn(),pending);
    button(RLS[n].again,()=>rlSpin(n+1),pending,'secondary');
   }else box.append(el('p',`${nm}が「もう一度回すか」迷っています…`));
  }else if(mine){rlArm(rlKeyOf(u,'fin'),1500,rlFinishOwn);}
  if(host&&!mine&&fin===null)button(`${byUid.get(u)?.name||'？'}を飛ばして進める`,()=>rlSettleFor(u),pending,'secondary');
 }
 // ---- ドキドキ（爆弾まわし）----
 const GATE_CARDS=new Set(['reaction','ten','tapking','grid']);
 const BMT0=()=>BMCD()+(globalThis.__nqBmDropMs??1500); // ドキドキ：スタートのあと、爆弾が最初の人に落ちる時間（持ち時間はそのあとから数える）
 const BMCD=()=>globalThis.__nqBmCdMs??4000,YOI=()=>Math.min(1000,BMCD()); // よーい／はじまるよ〜 1秒＋3・2・1
 const gateGoT=()=>state?.card==='reaction'?(bmP[0]?.t??null):gateGo;
 const normP=o=>Object.entries(o||{}).filter(([k,x])=>x&&typeof x==='object'&&typeof x.u==='string'&&typeof x.t==='number').map(([k,x])=>({n:Number(k),u:x.u,t:x.t})).sort((a,b)=>a.n-b.n);
 const srvNow=()=>Date.now()+svOff,connOf=u=>globalThis.__nqConn?.[u]!==false;
 async function bombReady(){
  if(dead||!GATE_CARDS.has(state?.card)||state.phase!=='measuring'||bmRdySent===state.round)return;
  bmRdySent=state.round;
  try{await set(ref(db,`${base}/bm/${state.round}/rdy/${uid}`),true);}catch{/* 古いルールのときは、ホストの待ち時間切れで始まる */}
 }
 async function bombPass(byHost){
  const last=bmP.at(-1);if(!last||dead||state?.card!=='reaction'||state.phase!=='measuring')return;
  if(last.u!==uid&&!byHost)return;
  if(srvNow()<bmP[0].t+BMT0())return; // 3・2・1と爆弾が落ちる間は渡せない
  const c=players.filter(p=>p.uid!==last.u&&connOf(p.uid));const pool=c.length?c:players.filter(p=>p.uid!==last.u);
  if(!pool.length)return;
  const to=pool[Math.floor(Math.random()*pool.length)];
  try{await set(ref(db,`${base}/bm/${state.round}/p/${last.n+1}`),{u:to.uid,t:serverTimestamp(),k:last.n});}catch{/* 爆発に間に合わなかった／先に誰かが渡した */}
 }
 async function bombSettle(){
  if(bmSettling||dead||!host||state?.card!=='reaction'||state.phase!=='measuring'||bmX===null)return;
  bmSettling=true;const round=state.round;
  try{
   const recs=normP((await get(ref(db,`${base}/bm/${round}/p`))).val());if(!recs.length)return;
   const T0=recs[0].t+BMT0(),E=T0+bmX,hold={};players.forEach(p=>{hold[p.uid]=0;});
   recs.forEach((r,i)=>{const end=i+1<recs.length?recs[i+1].t:E;hold[r.u]=(hold[r.u]||0)+Math.max(0,end-Math.max(r.t,T0));});
   const bx=recs.at(-1).u,max=Math.max(...Object.values(hold)),tied=Object.keys(hold).filter(u=>hold[u]===max),bl=tied[Math.floor(Math.random()*tied.length)];
   const results=Object.fromEntries(Object.entries(hold).map(([u,v])=>[u,Math.round(v)]));
   await runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='measuring'&&s.card==='reaction'?{...s,phase:'results',results,bx,bl}:undefined,{applyLocally:false});
  }catch{/* まだ爆発時刻前（サーバー判定）→ 次の周期で再試行 */}
  finally{bmSettling=false;}
 }
 // 爆発までの時間：10%は1〜10秒の早爆発、70%は10〜40秒、20%は40〜60秒（下限がバレないように）
 function pickBombX(){const r=Math.random(),u=Math.random();return r<(globalThis.__nqEarlyP??0.1)?1000+Math.floor(u*9001):r<0.8?10000+Math.floor(u*30001):40000+Math.floor(u*20001);}
 function gateOpen(again){ // 全員の準備OKがそろった（または待ち時間切れ）ならtrue
  if(!bmWait||bmWaitRound!==state.round){bmWait=performance.now();bmWaitRound=state.round;}
  const need=players.filter(p=>connOf(p.uid)),got=need.filter(p=>bmRdy[p.uid]);
  if(got.length<need.length&&performance.now()-bmWait<(globalThis.__nqBmWaitMs??45000)){clearTimeout(bmWaitT);bmWaitT=setTimeout(()=>{if(!dead)again();},500);return false;}
  return true;
 }
 async function gateHost(){ // タップ王・10秒ジャスト：スタート合図（サーバー時刻）を1回だけ書く
  if(dead||!host||gateIniting||gateGo!==null||!(state?.card==='ten'||state?.card==='tapking'||state?.card==='grid')||state.phase!=='measuring'||flipRound!==state.round)return;
  if(!gateOpen(gateHost))return;
  gateIniting=true;
  try{await set(ref(db,`${base}/bm/${state.round}/go`),serverTimestamp());}catch{/* 古いルールのとき：各自の待ち時間切れで、従来のSTARTボタンに切り替わる */}
  finally{gateIniting=false;}
 }
 function gateView(){
  const go=gateGoT();
  if(go===null){const need=players.filter(p=>connOf(p.uid));return [txt('h3','verdict','みんなの準備を待っています…'),el('p',`準備OK ${need.filter(p=>bmRdy[p.uid]).length}／${need.length}人（説明を閉じると準備OK）`)];}
  const el0=srvNow()-go,y=YOI();
  if(el0<y)return state.card==='grid'?[div('bmCount bmYoi',txt('b','','はじまるよ〜'),txt('span','','みんな準備OK！'))]:[div('bmCount bmYoi',txt('b','','よーい…'),txt('span','','みんな準備OK！ もうすぐ始まるよ'))];
  if(el0<BMCD())return [div('bmCount',txt('b','',String(Math.max(1,Math.ceil((BMCD()-el0)/1000)))),txt('span','','みんな準備OK！'))];
  if(el0<BMCD()+900)return [txt('div','bmGo','スタート！')];
  return null;
 }
 function gateSchedule(go){ // 画面を切り替えるタイミング（よーい→3→2→1→スタート）
  if(bmCd.length)return;const el0=srvNow()-go,y=YOI(),c=BMCD();
  for(const ms of [y,y+1000,y+2000,c,c+900,c+900+GDROP_MS]){const w=ms-el0;if(w>0)bmCd.push(setTimeout(()=>{if(dead)return;if(ms===c)gateFire();render();},w));}
  if(el0>=c)bmCd.push(setTimeout(()=>{if(!dead){gateFire();render();}},0));
  if(!bmCd.length)bmCd.push(0);
 }
 const GDROP_MS=1500; // ボタン：スタートのあと、爆弾が最初の人に落ちる時間
 function gateFire(){ // スタートの瞬間：10秒ジャスト／タップ王を自動で始める
  if(dead||!state||state.phase!=='measuring'||gateFired===state.round||typeof own==='number')return;
  if(state.card==='ten'&&began===null&&elapsed===null){gateFired=state.round;began=performance.now();}
  else if(state.card==='tapking'&&tapStart===null){gateFired=state.round;tapBegin();}
 }
 function gateWait(){ // true の間は、スタート待ち画面を出す
  if(gateFired===state.round)return false;
  if(!gateSince)gateSince=performance.now();
  if(gateGo===null&&performance.now()-gateSince>(globalThis.__nqGateFallbackMs??55000))return false; // 合図が来ないときは従来のSTARTボタン
  return true;
 }
 function gateUi(){const v=gateView();if(v){box.append(...v);return;}box.append(txt('p','hint2','スタート！'));}
 function tapBegin(){tapStart=performance.now();tapCount=0;const round=state.round,ms=globalThis.__nqTapMs??5000;tapTimer=setTimeout(async()=>{tapTimer=null;if(dead||state?.round!==round)return;try{await set(ref(db,`${base}/answers/${round}/${uid}`),Math.min(999,tapCount));}catch{message('タップ数を送れませんでした。');}render();},ms);}
 async function bombHost(){
  if(dead||!host||state?.card!=='reaction'||state.phase!=='measuring')return;
  if(!bmP.length&&!bmIniting){
   if(!gateOpen(bombHost))return;
  }
  if(!bmP.length&&!bmIniting){ // 最初：爆発までの秒数（10〜60秒）と、最初の持ち主を書く
   bmIniting=true;const round=state.round,cs=players.filter(p=>connOf(p.uid)),pool=cs.length?cs:players,actor=players.some(p=>p.uid===globalThis.__nqBmFirst)?globalThis.__nqBmFirst:pool[Math.floor(Math.random()*pool.length)].uid; // 最初の持ち主は全員からランダム
   try{
    const cur=(await get(ref(db,`${base}/bm/${round}/x`))).val();
    if(cur===null||cur===undefined)await set(ref(db,`${base}/bm/${round}/x`),pickBombX());
    await set(ref(db,`${base}/bm/${round}/p/0`),{u:actor,t:serverTimestamp(),k:-1});
   }catch{message('爆弾を準備できませんでした。ホストは再読み込みして再接続してください。');}
   finally{bmIniting=false;}
   return;
  }
  if(bmP.length&&!bmTimer){
   bmTimer=setInterval(()=>{
    if(dead||state?.card!=='reaction'||state.phase!=='measuring'){clearInterval(bmTimer);bmTimer=null;return;}
    if(bmX!==null&&bmP.length&&bmWarnPlan&&bmWarned!==state.round&&bmX>=2500&&srvNow()>=bmP[0].t+BMT0()+bmX-1150){bmWarned=state.round;set(ref(db,`${base}/bm/${state.round}/w`),serverTimestamp()).catch(()=>{});} // 本物の前触れ（出ない回もある）
    if(bmX!==null&&bmP.length&&srvNow()>=bmP[0].t+BMT0()+bmX-30)bombSettle();
    const last=bmP.at(-1); // 持ち主が切断したら、自動でほかの人へ渡す
    if(last&&!connOf(last.u)){bmDisc+=250;if(bmDisc>=3000){bmDisc=0;bombPass(true);}}else bmDisc=0;
   },250);
  }
 }
 function bombUi(){
  {const v=gateView(),flash=bmP.length&&srvNow()-bmP[0].t>=BMCD();if(v&&flash)box.append(...v);else if(v){box.append(...(bmP.length?v:[txt('h3','verdict','💣 みんなの準備を待っています…'),...v.slice(1)]));return;}}
  const last=bmP.at(-1),holder=byUid.get(last.u),mine=last.u===uid,back=mine&&bmP.slice(0,-1).some(r=>r.u===uid);
  const dropping=srvNow()-bmP[0].t<BMT0()&&bmP.length===1;
  if(dropping&&mine&&bmBuzz[state.round]!==2){bmBuzz[state.round]=2;try{navigator.vibrate?.([120,50,200]);}catch{}}
  box.append(txt('h3','verdict bmHead',dropping?(mine?'💣 あなたに爆弾が落ちた！':`💣 ${holder?.name||'？'}に爆弾が落ちた！`):mine?(back?'🔁 自分に戻ってきた！':'あなたが持っています！'):`${holder?.name||'？'} が持っています`));
  // 持ち時間（スタートから数える）
  const T0=bmP[0].t+BMT0(),holdOf=()=>{const now=srvNow(),h={};players.forEach(p=>{h[p.uid]=0;});bmP.forEach((r,i)=>{const end=i+1<bmP.length?bmP[i+1].t:now;h[r.u]=(h[r.u]||0)+Math.max(0,end-Math.max(r.t,T0));});return h;};
  const n=players.length,pos=k=>{if(n===2)return [50,k===0?24:76];const a=(-90+360*k/n)*Math.PI/180;return [50+34*Math.cos(a),54+27*Math.sin(a)];};
  const stage=div('bmStage'),timeEls={},hold0=holdOf(),flying=bmFly&&performance.now()-bmFly.t<650?bmFly:null;
  players.forEach((p,k)=>{
   const [x,y]=pos(k),isH=p.uid===last.u,cell=div('bmPl'+(isH?' hold':'')+(p.uid===uid?' me':''),div('bmAv',avImgEl(p)),txt('b','',p.uid===uid?'あなた':p.name));
   cell.style.left=x+'%';cell.style.top=y+'%';cell.setAttribute('data-u',p.uid);
   const tm=txt('small','',(hold0[p.uid]/1000).toFixed(1)+'秒');timeEls[p.uid]=tm;cell.append(tm);
   if(isH){const bm=bombSvg();bm.className+=' bmHeld'+(dropping?' bmDrop':'');if(dropping)cell.classList.add('hit');if(flying)bm.style.visibility='hidden';cell.children[0].append(bm);}
   stage.append(cell);
  });
  box.append(stage);
  try{if(flying){const from=stage.querySelector(`[data-u="${flying.from}"]`),to=stage.querySelector(`[data-u="${flying.to}"]`);
   if(from&&to&&stage.animate){const fb=bombSvg();fb.className+=' bmFly';stage.append(fb);
    const fx=parseFloat(from.style.left),fy=parseFloat(from.style.top),tx=parseFloat(to.style.left),ty=parseFloat(to.style.top);
    fb.animate([{left:fx+'%',top:fy+'%',transform:'translate(-50%,-50%) scale(1) rotate(0)'},{left:(fx+tx)/2+'%',top:Math.min(fy,ty)-10+'%',transform:'translate(-50%,-50%) scale(1.5) rotate(180deg)',offset:.5},{left:tx+'%',top:ty+'%',transform:'translate(-50%,-50%) scale(1) rotate(360deg)'}],{duration:550,easing:'ease-in-out'}).onfinish=()=>{fb.remove();to.querySelector('.bmHeld')?.style&&(to.querySelector('.bmHeld').style.visibility='visible');};}}}catch{}
  if(bmTick)clearInterval(bmTick);
  const heatEls=()=>[...(stage.querySelectorAll?.('.bmBomb')||[])];
  bmTick=setInterval(()=>{if(dead||!stage.isConnected||state?.phase!=='measuring'){clearInterval(bmTick);bmTick=null;return;}const h=holdOf();for(const u in timeEls)timeEls[u].textContent=((h[u]||0)/1000).toFixed(1)+'秒';
   try{const lv=heatLevel(T0);for(const b of heatEls()){b.style.setProperty('--heat',lv.toFixed(2));b.classList.toggle('hot',lv>0.55);}}catch{}},100);
  if(mine){const locked=performance.now()<bmLockUntil;button('次の人へ渡す',()=>bombPass(false),pending||locked);}
 }
 // 赤くなる演出：ニセ（赤くなって黒に戻る）は全員で同じ時刻に出る／本物は爆発の約1秒前（出ない回もある）
 function heatLevel(T0){
  const now=srvNow(),r=state.round;let s=(T0^(r*2654435761))>>>0;const rnd=()=>{s=(s+0x6D2B79F5)>>>0;let z=s;z=Math.imul(z^z>>>15,z|1);z^=z+Math.imul(z^z>>>7,z|61);return((z^z>>>14)>>>0)/4294967296;};
  const k=2+Math.floor(rnd()*3);let lv=0,at=T0+6000+rnd()*6000;
  for(let i=0;i<k;i++){const e=now-at;if(e>0&&e<1700)lv=Math.max(lv,e<1000?e/1000:1-(e-1000)/700);at+=7000+rnd()*9000;}
  if(bmW!==null){const e=now-bmW;if(e>0)lv=Math.max(lv,Math.min(1,e/900));}
  return Math.max(0,Math.min(1,lv));
 }
 function bombSvg(){const s='b'+(++shotN);const w=document.createElement('span');w.className='bmBomb';w.innerHTML=`<svg viewBox="0 0 80 90" aria-hidden="true"><defs><radialGradient id="${s}" cx=".35" cy=".3"><stop offset="0" stop-color="#6b6b78"/><stop offset=".45" stop-color="#23232c"/><stop offset="1" stop-color="#050508"/></radialGradient></defs><circle cx="38" cy="54" r="30" fill="url(#${s})" stroke="#000" stroke-width="2"/><ellipse cx="28" cy="40" rx="9" ry="6" fill="#fff" opacity=".28" transform="rotate(-30 28 40)"/><rect x="31" y="16" width="14" height="10" rx="2" fill="#8a8a96" stroke="#000" stroke-width="2"/><path d="M40 16Q44 6 56 8" fill="none" stroke="#d9b36a" stroke-width="3.5" stroke-linecap="round"/><g class="bmSp"><circle cx="58" cy="8" r="6" fill="#ffd34d"/><circle cx="58" cy="8" r="3" fill="#fff6c8"/><path d="M58 -2V18M48 8H68M51 1L65 15M65 1L51 15" stroke="#ff9f1a" stroke-width="2" stroke-linecap="round"/></g></svg>`;return w;}
 async function hostYield(){
  if(dead||!host||yielding||state?.card!=='king'||state.phase!=='measuring'||state.ky||typeof kgData.y!=='number')return;
  const to=players.find(p=>Number(p.slot)===kgData.y);if(!to)return;
  yielding=true;const round=state.round;
  try{await runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='measuring'&&s.card==='king'&&!s.ky?{...s,actor:to.uid,ky:true}:undefined,{applyLocally:false});}
  catch{message('王様を譲る処理を送れませんでした。ホストは再読み込みして再接続してください。');}
  finally{yielding=false;}
 }
 async function settle(){
  if(dead||!host||settling||state?.phase!=='measuring'||state?.card==='reaction'||state?.card==='grid'||state?.card==='roulette')return;
  if(state.card==='battery'&&!(await batteryGate()))return;
  const actor=state.card==='king'&&state.ky&&state.actor?state.actor:currentTurn(state,players).uid,buttons=state.card==='buttons',mission=state.card==='mission',king=state.card==='king',danger=state.card==='danger'||king;
  let results,fate=null;
  if(danger){
   const a=answers[actor],t=typeof a==='number'?players.find(p=>Number(p.slot)===a):null;
   if(!t||typeof answers[t.uid]!=='number')return;
   results={[actor]:a,[t.uid]:answers[t.uid]};if(!king&&answers[t.uid]===1)fate=Math.random()<0.5?'HEAVEN':'HELL';
  }else if(mission){if(typeof answers[actor]!=='number')return;if(answers[actor]===1&&!players.every(p=>typeof answers[p.uid]==='number'))return;}else if(buttons?(!buttonDeck||typeof answers[actor]!=='number'):!players.every(p=>typeof answers[p.uid]==='number'))return;
  let votes=null,topVotes=null;
  if(VL.has(state.card)){const c={};for(const p of players)c[p.slot]=0;for(const p of players)c[answers[p.uid]]=(c[answers[p.uid]]||0)+1;votes=c;topVotes=Math.max(...Object.values(c));}
  let side=null;
  let mall=false;
  if(state.card==='majority'){
   const mk=state.mk||0,round0=state.round;
   if(!players.every(p=>typeof answers[p.uid]==='number'&&Math.floor(answers[p.uid]/2)===mk))return;
   const nb=players.filter(p=>answers[p.uid]%2===1).length;
   const tieKind=nb===0||nb===players.length?0:-1; // 0=全員同じ（派閥が決まらない）。半々はA派/B派のルーレットで決める
   if(tieKind>=0){
    // 割れなかったお題・答えたお題はすべて使用済み。次は、まだ出ていないお題から選ぶ（なければ「使い切った」扱い）
    const usedM=new Set([...seenPrompts.majority,state.prompt]);for(const k of Object.values(deckDrawn)){const q=parseKey(k);if(q.card==='majority'&&typeof q.prompt==='number')usedM.add(q.prompt);}
    let nextP=-1;for(let d=1;d<=majorityPrompts.length;d++){const j=(state.prompt+d)%majorityPrompts.length;if(!usedM.has(j)){nextP=j;break;}}
    if(nextP>=0){ // 答えが割れなかった → 次のお題で答え直し（ターンは進めない）
     settling=true;
     try{await runTransaction(ref(db,base+'/state'),t=>t?.round===round0&&t.phase==='measuring'&&(t.mk||0)===mk?{...t,prompt:nextP,mk:mk+1,side:tieKind}:undefined,{applyLocally:false});}
     catch{message('お題の切り替えを送れませんでした。ホストは再読み込みして再接続してください。');}
     finally{settling=false;}
     return;
    }
    mall=true;side=2; // お題を使い切っても割れなかった → 全員にお助け
   }else{const majL=nb>players.length-nb?1:0;side=Math.random()<0.5?majL:1-majL;} // 多数派／少数派をルーレットで選び、その派閥の答え(A=0/B=1)をsideに入れる
  }
  let pick=null,dbt=null,dbj=null;
  if(state.card==='battery'&&doubters().length){dbt={};dbj={};for(const p of doubters()){dbt[p.uid]=dMap()[p.uid];dbj[p.uid]=jMap()[p.uid];}}
  settling=true;const round=state.round,direction=state.card==='battery'?drawDirection():null,buttonOutcome=buttons?buttonDeck[answers[actor]]:null;
  if(!danger)results=buttons||(mission&&answers[actor]!==1)?{[actor]:answers[actor]}:Object.fromEntries(players.map(p=>[p.uid,state.card==='majority'?answers[p.uid]%2:answers[p.uid]]));
  const kiss=mission?missionStats({order:state.order,round,results}):null;
  if(!dbt&&tieCards.includes(state.card)&&(state.card!=='majority'||side===2)){const probe={...state,phase:'results',results,...(direction?{direction}:{}),...(votes?{votes,topVotes}:{}),...(side!==null?{side}:{})};const tied=tiedTargets(probe,players);if(tied.length>1)pick=tied[Math.floor(Math.random()*tied.length)];}
  try{await runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='measuring'?{...s,phase:'results',results,...(pick?{pick}:{}),...(direction?{direction}:{}),...(buttons?{buttonOutcome}:{}),...(fate?{fate}:{}),...(votes?{votes,topVotes}:{}),...(side!==null?{side}:{}),...(dbt?{dbt,dbj}:{}),...(kiss?.ok?{kok:true}:{}),...(mall?{mall:true}:{})}:undefined,{applyLocally:false}).then(async r=>{if(kiss?.counted&&r?.committed)await set(ref(db,`${base}/deck/md/${round}`),1).catch(()=>{});});}
  catch{message('集計を送れませんでした。ホストは再読み込みして再接続してください。');}
  finally{settling=false;}
 }
 stops.push(onValue(ref(db,'.info/serverTimeOffset'),v=>{svOff=Number(v.val())||0;},()=>{}));
 stops.push(onValue(ref(db,base+'/deck'),v=>{const d=v.val()||{};deckSeed=typeof d.seed==='number'?d.seed:null;deckMind=mindFromText(d.mind);deckDrawn=normDrawn(d.drawn);deckMd=normMd(d.md);render();},()=>{deckSeed=null;message('カードの記録を取得できませんでした。ルールの反映と再接続を確認してください。');}));
 stops.push(onValue(ref(db,base+'/tq'),v=>{tqHist=v.val()||{};tqHistLoaded=true;render();},()=>{tqHist={};tqHistLoaded=false;}));
 stops.push(onValue(ref(db,base+'/nv'),v=>{settlementHistory=v.val()||{};historyLoaded=true;render();maybeSettlement();},()=>{historyLoaded=false;message('精算履歴を取得できませんでした。再接続してください。');}));
 stops.push(onValue(ref(db,base+'/fin'),v=>{fin=v.val()===true;if(fin)ensureAllDrinks();render();},()=>{}));
 stops.push(onValue(ref(db,base+'/state'),snap=>{
  state=snap.val();if(state?.card==='mission'&&Array.isArray(state.order)){const a=state.order[(state.round-1)%state.order.length];if(a&&!missionDone.has(a)){missionDone.add(a);saveSeen();}}if(state?.card){lastCard=state.card;if(state.round>countedRound&&ALL_CARDS.includes(state.card)){countedRound=state.round;if(SOLO_CARDS.includes(state.card))soloAt[state.card]=state.round;else specialSeen.add(state.card);const left=LAP_CARDS.filter(c=>!specialSeen.has(c)),n=state.order?.length||1,nr=isBreak(state.round+1,n)?state.round+2:state.round+1,nextA=state.order?.[(nr-1)%n];if(!left.length||(left.length===1&&left[0]==='mission'&&missionDone.has(nextA)))specialSeen.clear();saveSeen();}}buttonDeck=buttonDecks[state?.round];if(seenPrompts[state?.card]&&typeof state.prompt==='number'&&!seenPrompts[state.card].has(state.prompt)){seenPrompts[state.card].add(state.prompt);saveSeen();}
  if(state?.round!==roundSeen){roundSeen=state?.round;began=null;elapsed=null;batteryDraft='';tapStart=null;tapCount=0;clearTimeout(tapTimer);tapTimer=null;own=undefined;answers={};choice=undefined;settledMap={};settledLoaded=false;spinRound=null;hlRound=null;clearTimeout(hlTimer);hlTimer=null;clearTimeout(spinTimer);spinTimer=null;pickRound=null;clearTimeout(pickTimer);pickTimer=null;flipRound=null;clearTimeout(flipTimer);flipTimer=null;rxClear();invite=undefined;inviteStop?.();inviteStop=null;btStop?.();btStop=null;btData={};btSeenAt=0;btValsAt=0;btJudgeAt=0;clearInterval(btHostTimer);btHostTimer=null;btWriting=false;clearInterval(btCd);btCd=null;btBotKey='';btMineD=false;btMineJ=false;gmStop?.();gmStop=null;gmRqStop?.();gmRqStop=null;gmLayStop?.();gmLayStop=null;gmHintStop?.();gmHintStop=null;gmHint=null;gmHintIniting=false;gTel={key:'',t:0};gmLg=[];gmRq={};gmLay=null;gmIniting=false;gmBusy=false;gmSeq=0;gmDone={};clearInterval(gmTimer);gmTimer=null;gmDisc=0;gmWaitLen=-1;gmWaitUntil=0;rlStop?.();rlStop=null;rlData={};rlLoaded=false;rlView?.stop();rlView=null;rlQueue=Promise.resolve();rlSeen=new Set();rlAnimDone=new Set();rlHoldUntil={};rlHoldQ=new Set();rlTimerKey='';clearTimeout(rlTimerT);rlTimerT=null;clearInterval(rlHostT);rlHostT=null;rlFinishing=false;rlSig='';rlSigAt=0;rlDisc=0;bmStop?.();bmStop=null;bmP=[];bmWStop?.();bmWStop=null;bmW=null;bmWarnPlan=null;bmWarned=0;bmRdyStop?.();bmRdyStop=null;gateGoStop?.();gateGoStop=null;gateGo=null;gateSince=0;gateIniting=false;bmRdy={};bmWait=0;bmCd.forEach(clearTimeout);bmCd=[];clearTimeout(bmWaitT);bmXStop?.();bmXStop=null;bmX=null;bmIniting=false;clearInterval(bmTimer);bmTimer=null;bmLockUntil=0;bmSeenN=-1;bmDisc=0;clearTimeout(bmLockTimer);bmLockTimer=null;kgStop?.();kgStop=null;kgData={};kingTarget=null;kingYield=false;yielding=false;answerStop?.();ownStop?.();settledStop?.();tqStop?.();tqMap={};dtStop?.();dtMap={};dgStop?.();dgMap={};angelStart=0;angelReady=false;angelSched=false;dgSKey='';angelSeen=new Set();angelChoose=false;clearTimeout(angelBotTimer);angelBotTimer=null;extUntil=0;botTries=0;clearTimeout(botTimer);botTimer=null;cuteMode=null;nvStop?.();nvStop=null;nvMap={};settlePage=state?.card==='check';
   if(state){const round=state.round;dgStop=onValue(ref(db,`${base}/dg/${round}`),v=>{if(round!==roundSeen||dead)return;dgMap=v.val()||{};render();},()=>{dgMap={};});dtStop=onValue(ref(db,`${base}/dt/${round}`),v=>{if(round!==roundSeen||dead)return;dtMap=v.val()||{};render();},()=>{dtMap={};});tqStop=onValue(ref(db,`${base}/tq/${round}`),v=>{if(round!==roundSeen||dead)return;tqMap=v.val()||{};render();},()=>{tqMap={};});nvStop=onValue(ref(db,`${base}/nv/${round}`),v=>{if(round!==roundSeen||dead)return;nvMap=v.val()||{};render();maybeAdvance();},()=>{nvMap={};});settledStop=onValue(ref(db,`${base}/settled/${round}`),v=>{if(round!==roundSeen||dead)return;settledMap=v.val()||{};settledLoaded=true;render();settleOwn();maybeAdvance();maybeSettlement();},()=>message('確定状況を取得できませんでした。'));ownStop=onValue(ref(db,`${base}/answers/${round}/${uid}`),v=>{if(round!==roundSeen||dead)return;own=v.val();render();},()=>message('回答の取得に失敗しました。'));
    if(host)answerStop=onValue(ref(db,`${base}/answers/${round}`),v=>{if(round!==roundSeen||dead)return;answers=v.val()||{};render();settle();},()=>message('集計の取得に失敗しました。'));
   }
  }
  if(state?.card==='battery'&&state.phase==='measuring'&&!btStop){const round=state.round;btStop=onValue(ref(db,`${base}/bt/${round}`),v=>{if(round!==roundSeen||dead)return;btData=v.val()||{};if(btData.vals&&!btSeenAt)btSeenAt=performance.now();render();btBot();if(host)settle();},()=>{btData={};message('ダウトの情報を取得できませんでした。ルールの反映と再接続を確認してください。');});}
  if(state?.card==='grid'&&state.phase==='measuring'&&!gmStop){const round=state.round;
   gmStop=onValue(ref(db,`${base}/gm/${round}/lg`),v=>{if(round!==roundSeen||dead)return;gmLg=normLg(v.val());for(const e of gmLg)if(typeof e.n==='number')gmDone[e.u]=Math.max(gmDone[e.u]||0,e.n);render();gridHost();},()=>{gmLg=[];message('マス目の情報を取得できませんでした。ルールの反映と再接続を確認してください。');});
   gmRqStop=onValue(ref(db,`${base}/gm/${round}/rq`),v=>{if(round!==roundSeen||dead)return;gmRq=v.val()||{};gmSeq=Math.max(gmSeq,Number(gmRq[uid]?.n)||0);gridHost();},()=>{});
   if(!gmHintStop)gmHintStop=onValue(ref(db,`${base}/gm/${round}/hint`),v=>{if(round!==roundSeen||dead)return;gmHint=hintOk(v.val())?v.val():null;render();},()=>{});
   if(host)gmLayStop=onValue(ref(db,`${base}/gm/${round}/lay`),v=>{if(round!==roundSeen||dead)return;gmLay=typeof v.val()==='string'?v.val():null;gridHost();},()=>{});}
  if(state?.card==='roulette'&&state.phase==='measuring'&&!rlStop){const round=state.round;
   rlStop=onValue(ref(db,`${base}/rl/${round}`),v=>{if(round!==roundSeen||dead)return;rlOnData(v.val()||{});},()=>{rlData={};message('ルーレットの情報を取得できませんでした。ルールの反映と再接続を確認してください。');});
   if(host&&!rlHostT)rlHostT=setInterval(()=>{if(dead||state?.card!=='roulette'||state.phase!=='measuring'){clearInterval(rlHostT);rlHostT=null;return;}rlHost();},1000);}
  if(GATE_CARDS.has(state?.card)&&state.phase==='measuring'&&!bmRdyStop){const round=state.round,cd=state.card;
   bmRdyStop=onValue(ref(db,`${base}/bm/${round}/rdy`),v=>{if(round!==roundSeen||dead)return;bmRdy=v.val()||{};if(cd==='reaction'){if(bmP.length===0)render();bombHost();}else{if(gateGo===null)render();gateHost();}},()=>{});
   if(cd!=='reaction'&&!gateGoStop)gateGoStop=onValue(ref(db,`${base}/bm/${round}/go`),v=>{if(round!==roundSeen||dead)return;const g=v.val();if(typeof g==='number'&&gateGo===null){gateGo=g;gateSchedule(g);}render();},()=>{});}
  if(state?.card==='reaction'&&state.phase==='measuring'&&!bmStop){const round=state.round;
   bmStop=onValue(ref(db,`${base}/bm/${round}/p`),v=>{if(round!==roundSeen||dead)return;bmP=normP(v.val());const last=bmP.at(-1);
    if(last&&last.n!==bmSeenN){if(bmP.length>1)bmFly={from:bmP.at(-2).u,to:last.u,t:performance.now()};bmSeenN=last.n;if(last.u===uid){bmLockUntil=performance.now()+(globalThis.__nqBombLockMs??500);try{navigator.vibrate?.([60,40,60]);}catch{}clearTimeout(bmLockTimer);bmLockTimer=setTimeout(()=>{if(!dead)render();},(globalThis.__nqBombLockMs??500)+30);}}
    if(bmP.length)gateSchedule(bmP[0].t);
    render();bombHost();},()=>{bmP=[];message('爆弾の情報を取得できませんでした。ルールの反映と再接続を確認してください。');});
   bmWStop=onValue(ref(db,`${base}/bm/${round}/w`),v=>{if(round!==roundSeen||dead)return;bmW=typeof v.val()==='number'?v.val():null;render();},()=>{});
   if(host)bmXStop=onValue(ref(db,`${base}/bm/${round}/x`),v=>{if(round!==roundSeen||dead)return;bmX=typeof v.val()==='number'?v.val():null;if(bmX!==null&&bmWarnPlan===null)bmWarnPlan=Math.random()<0.6;bombHost();},()=>{});}
  if(state?.card==='king'&&!kgStop){const round=state.round;kgStop=onValue(ref(db,`${base}/kg/${round}`),v=>{if(round!==roundSeen||dead)return;kgData=v.val()||{};render();if(host)hostYield();},()=>{kgData={};message('王様の命令を取得できませんでした。ルールの反映と再接続を確認してください。');});}
  if(inviteStop&&state?.card==='king'&&state.ky&&state.actor&&inviteFor!==state.actor){inviteStop();inviteStop=null;invite=undefined;} // 王様が譲られたら、新しい王様の回答を見に行き直す
  if((state?.card==='danger'||state?.card==='king'||state?.card==='mission')&&state.phase==='measuring'&&!inviteStop){const round=state.round,actor=state.card==='king'&&state.ky&&state.actor?state.actor:currentTurn(state,players).uid;inviteFor=actor;inviteStop=onValue(ref(db,`${base}/answers/${round}/${actor}`),v=>{if(round!==roundSeen||dead)return;invite=v.val();render();settle();},()=>message('誘いの取得に失敗しました。再接続してください。'));}
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
