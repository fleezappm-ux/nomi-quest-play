import {ref,set,get,update,onValue,runTransaction} from './fb.js?v=0.33';
import {showItemFx} from './itemfx.js?v=0.33';
import {shufflePlayers,currentTurn} from './turn.js?v=0.4';
import {SOLO_CARDS,cardForRound,isBreak,turnsToBreak,checkStates,tiedTargets,tieCards,cards,votePrompts,muttsuriPrompts,majorityPrompts,mindPrompts,pickPrompt,drawCard,drawDirection,targetsFor,shuffleButtons,drinkAward,items,itemKinds,drawItem,decideCredit,winnersFor,REACTION_FAIL,dangerOutcome,rewardees,breakPeriod,ticketWindow,ticketsFor,ticketLeaders,tequilaOutcome,itemChoices} from './deck.js?v=0.33';
export function attachTen({db,roomId,uid,players,hostUid,message,root:given}) {
 const root=given||document.getElementById('tenGame'),top=document.createElement('div'),box=document.createElement('div'),dock=document.createElement('div'),host=uid===hostUid,base=`sessions/${roomId}`;
 top.className='top';box.className='stage';dock.className='dock';root.replaceChildren(top,box,dock);
 let dockButtons=0,dockNotes=0;
 const avatars=['🍻','🌙','⭐','🌈','🔥','🎲'],glyphs={ten:'十',battery:'電',buttons:'謎',reaction:'恋',danger:'誘',mission:'唇',king:'王',vote:'変',muttsuri:'隠',tapking:'連',check:'休'};
 const VL=new Set(['vote','muttsuri','mind']);
 const missionDone=new Set(),soloSeen=new Set(),seenPrompts={vote:new Set(),muttsuri:new Set(),majority:new Set(),mind:new Set()},promptLists={vote:votePrompts,muttsuri:muttsuriPrompts,majority:majorityPrompts,mind:mindPrompts};
 // 同じ部屋の中で、お題やキス顔が重ならないように、使った分をこのスマホにも記録しておく（再読み込みしても残る）
 const seenKey='nq-seen-'+roomId;
 function saveSeen(){try{localStorage.setItem(seenKey,JSON.stringify({m:[...missionDone],p:Object.fromEntries(Object.entries(seenPrompts).map(([k,v])=>[k,[...v]]))}));}catch{}}
 try{const o=JSON.parse(localStorage.getItem(seenKey)||'null');if(o){for(const u of o.m||[])missionDone.add(u);for(const [k,v] of Object.entries(o.p||{}))if(seenPrompts[k])for(const x of v)if(typeof x==='number')seenPrompts[k].add(x);}}catch{}
 let state,own,answers={},began=null,elapsed=null,batteryDraft='',tapStart=null,tapCount=0,tapTimer=null,pickRound=null,pickTimer=null,pending=false,dead=false,answerStop,ownStop,roundSeen,settling=false,buttonDeck,buttonDecks={},drinks=null,drinkMap,itemMap,spentMap,settledMap={},settledLoaded=false,grantMap,grantBusy=false,spinRound=null,spinStart=0,spinTimer,flipRound=null,flipStart=0,flipTimer,rx=null,invite,inviteStop,choice,ownBusy=false,ownError=false,grantTried=false,grantFailed=false,settledStop;
 let spentSeen=false,allDrinks={},allDrinksStops=[],tqMap={},tqStop,cuteMode=false,nvMap={},nvStop,settlePage=false;
 const stops=[],byUid=new Map(players.map(p=>[p.uid,p]));
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 const txt=(tag,cls,text)=>{const n=el(tag,text);n.className=cls;return n;};
 const div=(cls,...kids)=>{const n=document.createElement('div');n.className=cls;n.append(...kids);return n;};
 const shortName={barrier:'バリア',cute:'可愛い',angel:'天使'};
 function note(text){dock.append(el('p',text));dockNotes++;}
 function button(text,fn,disabled=false,cls=''){const b=el('button',text);if(cls)b.className=cls;dockButtons++;b.disabled=disabled;b.onclick=async()=>{if(pending||dead)return;pending=true;render();try{await fn();}catch{message('ゲーム通信に失敗しました。再接続後にもう一度試してください。');}finally{pending=false;if(!dead)render();}};dock.append(b);}
 function advanceRound(){const round=state.round,order=state.order||shufflePlayers(players);return runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='results'?{round:round+1,phase:'draw',order,actor:order[round%order.length],accounting:true}:undefined,{applyLocally:false});}
 // 休憩ターン：全員が「準備OK」を押したら（満場一致で）ホストの端末が次のターンへ進める。ホストは待たずに進めることもできる。
 let advancing=false;
 function maybeAdvance(){if(!host||dead||advancing||state?.phase!=='results'||state.card!=='check'||state.round>=100)return;if(!players.every(p=>nvMap[p.uid])||!settledAll())return;advancing=true;advanceRound().catch(()=>message('次のターンへ進めませんでした。')).finally(()=>{advancing=false;});}
 function breakNext(){
  const ready=players.filter(p=>nvMap[p.uid]).length,me=!!nvMap[uid];
  box.append(txt('p','fine',`次のターンへ：${ready}/${players.length}人が準備OK。全員がそろうと進みます。`));
  button(me?'✓ 準備OK（みんなを待っています）':'次のターンへ進む（準備OK）',()=>set(ref(db,`${base}/nv/${state.round}/${uid}`),true),me||pending);
  if(host)button('みんなを待たずに次のターンへ（ホスト）',advanceRound,pending||ownBusy||!settledAll()||state.round>=100,'secondary');
 }
 function nextButton(){if(host)button('次のターン',advanceRound,pending||ownBusy||!settledAll()||state.round>=100);
   else box.append(el('p','ホストが次のターンへ進むのを待っています。'));}
 function render(){
  if(dead)return;top.replaceChildren();box.replaceChildren();dock.replaceChildren();dockButtons=0;dockNotes=0;
  paint();
  dock.className='dock'+(dockNotes===0&&dockButtons>2?' grid':dockNotes===0&&dockButtons>0?' sticky':'');
 }
 function turnBar(turn){
  const seats=div('seats');
  turn.order.forEach((id,i)=>{const p=byUid.get(id),now=i===turn.index;seats.append(div('seat'+(now?' now':''),txt('span','tag',now?'担当':''),txt('span','av',avatars[Number(p?.slot)]||'🍻'),txt('span','nm',p?.name||'確認中')));});
  const n=turn.order.length;return div('turnwrap',div('turnmeta',txt('span','',`ターン ${state.round} · ${turn.cycle}巡目`),txt('b','',`今回の担当：${byUid.get(turn.uid)?.name||'確認中'}`)),seats,txt('p','turnnext',isBreak(state.round,n)?'☕ 今回は休憩ターン':`☕ 休憩まであと ${turnsToBreak(state.round,n)} ターン`));
 }
 const art={ten:1,battery:1,buttons:1,vote:1,muttsuri:1,majority:1,king:1,tapking:1,danger:1,mission:1,mind:1};
 const fb={reaction:['アクション','ハートを最速でタップ！','♥'],danger:['スリル','行く？ 行かない？','誘'],mission:['ミッション','キス顔に挑戦！','唇'],mind:['予想','相手の答えを読め！','読'],check:['休憩','みんなの状態チェック','休']};
 function cardFace(card,cls=''){
  if(art[card]){const i=document.createElement('img');i.className='cface art '+cls;i.setAttribute('src','img/card-'+card+'.webp');i.setAttribute('alt',cards[card].title);i.setAttribute('draggable','false');return i;}
  const f=fb[card]||['カード','',glyphs[card]||'札'];
  return div('cface fb k-'+card+' '+cls,txt('span','tag',f[0]),txt('strong','ttl',cards[card].title),txt('span','big',f[2]),txt('span','dsc',f[1]));
 }
 function cardBack(cls=''){const i=document.createElement('img');i.className='cback '+cls;i.setAttribute('src','img/back.webp');i.setAttribute('alt','NOMI QUESTのカード');i.setAttribute('draggable','false');return i;}
 function cardHead(card){const h=div('cardhead k-'+card,cardFace(card,'thumb'),txt('h2','',cards[card].title),txt('p','',cards[card].rule));h.setAttribute('data-g',glyphs[card]||'');return h;}
 function paint(){
  if(!state){box.append(el('p',host?'ゲームを準備しています…':'ホストのゲーム準備を待っています…'));return;}
  top.append(statusPanel());box.className='stage '+state.phase;
  const turn=currentTurn(state,players),card=state.card||'ten';
  top.append(turnBar(turn));
  if(state.phase==='draw'){
   box.append(div('deck',cardBack()),el('h2',isBreak(state.round,turn.order.length)?'休憩ターン！':'カードを引こう'),el('p',isBreak(state.round,turn.order.length)?'今回はカードを引かずに、みんなの状態をチェックします。そのあと、たまったチケットを精算します（お助けカードも使えます）。':'山札は12枚。10秒・充電・謎ボタン・ドキドキ・ヘブン＆ヘル・キス顔・王様・変態を探せ・多数派・お前なら・タップ王・むっつり'));
   if(turn.uid===uid)button('カードを引く',()=>{const round=state.round,key=cardForRound(round,turn.order.length,Math.random,[...soloSeen,...(missionDone.has(uid)?['mission']:[])]);return runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='draw'?{...s,phase:'measuring',card:key,...(promptLists[key]?{prompt:pickPrompt(seenPrompts[key],Math.random,promptLists[key].length)}:{})}:undefined,{applyLocally:false});},pending);
   else box.append(el('p',`${byUid.get(turn.uid)?.name||'今回の担当'}がカードを引くのを待っています。`));
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
   if(state.pick&&pickRound!==state.round&&(card!=='check'||tieNow())){pickRoulette();return;}
   if(card==='check'){
    if(!settlePage){box.append(board(card,turn));button('🥃 精算タイムへ',async()=>{settlePage=true;}, pending);}
    else{box.append(settlementUi());breakNext();button('← みんなの状態にもどる',async()=>{settlePage=false;},pending,'secondary');}
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
   else{box.append(el('p','キス顔をやってみせよう（自己申告）。できないときはチケット＋1。'));button('やった！（完了）',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),1),pending);button('できない（チケット＋1）',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),0),pending,'secondary');}
   return;
  }
  if(card==='danger'||card==='king'){dangerUi(turn);return;}
  if(VL.has(card)){
   box.append(el('h3',`お題：${promptLists[card][state.prompt]??'確認中'}`));
   if(typeof own==='number')box.append(el('p','投票済み · 全員の投票を待っています。（誰に入れたかは他の人には見えません）'));
   else{box.append(el('p','当てはまりそうな人に1票。匿名です。'));for(const p of players)button(p.uid===uid?`${p.name}（自分）`:p.name,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),Number(p.slot)),pending);}
   if(host)box.append(el('p',`投票 ${players.filter(p=>typeof answers[p.uid]==='number').length}/${players.length}人`));
   return;
  }
  if(card==='check'){
   ensureAllDrinks();
   box.append(el('h3','今の自分の状態は？'));
   if(heldKinds().length)box.append(txt('p','help','🎁 お助けカードを持っています。このあとの精算で、使えます。'));
   if(typeof own==='number')box.append(el('p','回答済み · みんなの回答を待っています。'));
   else{box.append(el('p','みんなの状態は、全員が選んだあとに見えます。'));for(const [i,[ic,lab]] of checkStates.entries())button(`${ic} ${lab}`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),i),pending);}
   if(host)box.append(el('p',`回答 ${players.filter(p=>typeof answers[p.uid]==='number').length}/${players.length}人`));
   return;
  }
  if(card==='majority'){
   const pair=promptLists[card][state.prompt]||['確認中','確認中'],mind=false,actorName='';
   box.append(el('h3','A：'+pair[0]+'　／　B：'+pair[1]));
   if(typeof own==='number')box.append(el('p',mind?'回答済み · みんなの回答を待っています。（答えは結果まで秘密）':'回答済み · みんなの回答を待っています。（結果まで秘密）'));
   else{box.append(el('p',mind?(turn.uid===uid?'あなたの本当の答えを選んでください。みんなが予想します。':`${actorName}の答えを予想してください。`):'自分の答えを選んでください。多数派がチケット＋1。'));
    for(const [i,label] of ['A','B'].entries())button(`${label}：${pair[i]}`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),i),pending);}
   if(host)box.append(el('p',`回答 ${players.filter(p=>typeof answers[p.uid]==='number').length}/${players.length}人`));
   return;
  }
  if(typeof own==='number')box.append(el('p','送信済み · 全員の回答を待っています。'));
  else if(card==='reaction')reactionUi();
  else if(card==='battery'){
   const label=el('label','充電残量（％）'),input=document.createElement('input');input.type='number';input.min='0';input.max='100';input.step='1';input.inputMode='numeric';input.value=batteryDraft;input.disabled=pending;input.oninput=()=>{batteryDraft=input.value;};label.append(input);box.append(label);
   button('充電残量を送信',()=>{const value=Number(batteryDraft);if(!batteryDraft.trim()||!Number.isInteger(value)||value<0||value>100){message('充電残量は0〜100の整数で入力してください。');return;}return set(ref(db,`${base}/answers/${state.round}/${uid}`),value);},pending);
  }else if(card==='tapking'){
   if(tapStart===null){box.append(el('p','START後の5秒間、ボタンを連打！ 少なかった人がチケット＋1。'));button('START（5秒）',async()=>{tapStart=performance.now();tapCount=0;const round=state.round,ms=globalThis.__nqTapMs??5000;tapTimer=setTimeout(async()=>{tapTimer=null;if(dead||state?.round!==round)return;try{await set(ref(db,`${base}/answers/${round}/${uid}`),Math.min(999,tapCount));}catch{message('タップ数を送れませんでした。');}render();},ms);},pending);}
   else{const pad=txt('button','tapbig','TAP！'),cnt=txt('p','tapcount','0回');pad.onpointerdown=(e)=>{e?.preventDefault?.();tapCount++;cnt.textContent=tapCount+'回';};pad.onclick=null;box.append(cnt,pad);}
  }else if(elapsed!==null){box.append(el('p','計測完了。結果を送信してください。'));button('結果を送信',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),elapsed),pending);}
  else if(began!==null){box.append(el('p','10秒だと思ったらSTOP！'));button('STOP',async()=>{elapsed=Math.min(120000,Math.round(performance.now()-began));began=null;},pending);}
  else{box.append(el('p','時計を見ずに10秒を狙おう。自分のタイミングでSTART。'));button('START',async()=>{began=performance.now();},pending);}
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
   if(ownError)button('カウント保存を再試行',()=>settleOwn(),ownBusy);
   else box.append(el('p','あなたのカウントを保存しています…'));
  }else{const mine=drinkMap?.[String(state.round)];box.append(txt('p','mine',typeof mine==='number'?(mine>0?`あなたの今回のチケット：＋${mine}枚`:'あなたの今回のチケット：なし'):'あなたのチケットは確定しました。'));}
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
  // tickets only: items are used by hand at the break-turn settlement, never when a ticket is credited
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
  const n=players.length,period=breakPeriod(n),R=state.round%period===0?state.round:(Math.floor(state.round/period)+1)*period,{from,to}=ticketWindow(R,n);
  let t=0;for(let r=from;r<=to;r++){const v=drinkMap?.[String(r)];if(typeof v==='number')t+=v;}return t;
 }
 function statusPanel(){
  const counts={};let total=0;
  for(const [k,v] of Object.entries(itemMap||{}))if(spentMap?.[k]===undefined){counts[v]=(counts[v]||0)+1;total++;}
  const ready=itemMap&&(Object.keys(itemMap).length>0||grantFailed);
  const chips=div('chips',...itemKinds.map(k=>txt('span','chip'+(counts[k]?'':' none'),`${items[k].icon} ${shortName[k]} ×${counts[k]||0}`)));
  const held=itemKinds.filter(k=>counts[k]).map(k=>txt('p','help',`${items[k].icon}${items[k].name}：${items[k].desc}`));
  const more=document.createElement('details');more.className='helpbox';more.append(el('summary','お助けの説明'),...held,...(held.length?[]:[txt('p','help','お助けカードは、休憩ターンの精算で自分の判断で使えます。（バリア：テキーラ無効／天使：代わりに飲む／可愛い：なすりつけ）')]),txt('p','fine','この表示はあなたの画面だけ。実際に飲む必要はありません。'));
  const tk=myTickets();
  return div('status',
   div('stat',txt('span','label','🎫 チケット'),txt('span','big',tk===null?'確認中…':`${tk}枚`)),
   div('stat',txt('span','label',ready?`🎒 お助けカード ${total}/3枚`:'🎒 お助けカード'),ready?chips:txt('span','help','配布中…')),
   more);
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
  if(card==='check'){const f=(v)=>checkStates[v]||['❔','不明'];return div('board',txt('h3','verdict','みんなの状態'),txt('p','sub','無理せず、水も飲もう 🚰'),div('rows',...players.map(p=>{const [ic,lab]=f(state.results?.[p.uid]);return div('row safe',txt('span','av',ic),txt('span','who',p.name),txt('span','detail',''),txt('span','cups',lab));})),txt('p','fine','状態は自己申告です。'));}
  const gets=new Set(rewardees(state));
  const rows=players.map(p=>({p,amt:drinkAward(state,p.uid,players),detail:detailFor(p)})).sort((x,y)=>y.amt-x.amt);
  const losers=rows.filter(r=>r.amt>0);
  let verdict=losers.length?`${losers.map(r=>r.p.name).join('・')} の負け！`:'今回は誰も飲みません 🎉';
  let sub='';
  if(card==='battery')sub=`今回は ${state.direction}！`;
  if(card==='tapking')sub='タップが最も少ない人がチケット'+(state.pick?'（同数→ルーレット）':'');
  if(state.pick&&(card==='ten'||card==='battery'))sub=(sub?sub+' ／ ':'')+'同率→ルーレットで決定';
  if(card==='mission')sub=state.results?.[turn.uid]===1?'💋 ミッション成功！ チケットなし':'ミッション失敗… 担当がチケット＋1';
  if(card==='buttons')sub=state.buttonOutcome===1?'今回の担当が対象':'担当以外の全員が対象';
  if(VL.has(card))sub=`お題：${promptLists[card][state.prompt]??''} ／ 得票1位がチケット${state.pick?'（同率→ルーレット）':''}`;
  if(card==='majority'){const nb=players.filter(p=>state.results?.[p.uid]===1).length;sub=`A ${players.length-nb}人 / B ${nb}人 ／ ${state.side===2?'同数！ルーレットで1人':'多数派がチケット'}`;}
  if(card==='king'){const o=dangerOutcome(state);sub=o.accepted?'👑 命令に従いました！ チケットなし':'🙅 命令を拒否！ 拒否した人がチケット＋2';}
  if(card==='danger'){const o=dangerOutcome(state);sub=!o.accepted?'断られた！ 誘った人がチケット':o.fate==='HEAVEN'?'👼 HEAVEN！ 2人ともお助けGET':'🔥 HELL！ 2人ともチケット＋2';}
  if(card==='reaction'&&!gets.size)sub='全員失敗！ お助けなし';
  return div('board',txt('h3','verdict',verdict),...(sub?[txt('p','sub',sub)]:[]),
   div('rows',...rows.map(r=>div('row '+(r.amt>0?'lose':'safe'),txt('span','av',avatars[Number(r.p.slot)]||'🍻'),txt('span','who',r.p.name),txt('span','detail',[r.detail,gets.has(r.p.uid)?'🎁お助けGET':''].filter(Boolean).join(' · ')),txt('span','cups',r.amt>0?`🎫 ＋${r.amt}枚`:'セーフ')))),
   txt('p','fine','チケットは、休憩ターンでまとめて精算します。お助けカードも、そのときに使えます。'));
 }

 // ---- break turn: ticket settlement (one tequila) and hand-used helper cards --------------------------------
 const ids=()=>players.map(p=>p.uid);
 const pname=id=>byUid.get(id)?.name||'確認中';
 const drinksReady=()=>ids().every(u=>allDrinks[u]!==undefined);
 const tieNow=()=>drinksReady()&&ticketLeaders(ticketsFor(allDrinks,ids(),state.round,players.length)).leaders.length>1;
 function ensureAllDrinks(){
  if(allDrinksStops.length)return;
  for(const u of ids())allDrinksStops.push(onValue(ref(db,`personal/${roomId}/${u}/drinks`),snap=>{allDrinks[u]=snap.val()||{};render();},()=>{allDrinks[u]={};message('みんなのチケットを取得できませんでした。再接続してください。');render();}));
 }
 const heldKinds=()=>itemKinds.filter(k=>freeSlot(k)!==undefined);
 async function useItem(kind,target){
  const round=state.round,slot=freeSlot(kind);if(slot===undefined)return;
  const ch=itemChoices(uid,state.pick,tqMap);if(!ch[kind])return;
  const key=kind==='angel'?'a':kind==='cute'?'c':(state.pick===uid&&!tqMap.c?'b':'x'),value=kind==='cute'?target:uid;
  await set(ref(db,`${base}/tq/${round}/${key}`),value);
  cuteMode=false;
  await set(ref(db,`personal/${roomId}/${uid}/spent/${slot}`),round);
 }
 function settlementUi(){
  const box2=div('settle');
  box2.append(txt('h3','verdict','🥃 精算タイム！'));
  if(!drinksReady()||!itemsReady()){box2.append(txt('p','sub','みんなのチケットを集計しています…'));return box2;}
  const t=ticketsFor(allDrinks,ids(),state.round,players.length),lead=ticketLeaders(t),av=p=>avatars[Number(p.slot)]||'🍻';
  box2.append(txt('p','sub','前回の休憩から、いままでにたまったチケットです。'));
  box2.append(div('rows',...[...players].sort((x,y)=>t[y.uid]-t[x.uid]).map(p=>div('row '+(p.uid===state.pick?'lose':'safe'),txt('span','av',av(p)),txt('span','who',p.name),txt('span','detail',p.uid===state.pick?'🥃 テキーラ':''),txt('span','cups',`🎫 ${t[p.uid]}枚`)))));
  if(!state.pick){box2.append(txt('p','verdict','今回はチケットなし。テキーラは誰も飲みません 🎉'));return box2;}
  box2.append(txt('p','verdict',`${pname(state.pick)} がチケット最多（${lead.max}枚）→ テキーラ1杯！`+(lead.leaders.length>1?'（同数→ルーレット）':'')));
  const out=tequilaOutcome(state.pick,tqMap),log=[];
  if(tqMap.b)log.push(`🛡️ ${pname(tqMap.b)}がバリアを使った！`);
  if(tqMap.c)log.push(`🥺 ${pname(state.pick)}が可愛い顔で、${pname(tqMap.c)}になすりつけた！`);
  if(tqMap.x)log.push(`🛡️ ${pname(tqMap.x)}がバリアで防いだ！`);
  if(tqMap.a)log.push(`👼 ${pname(tqMap.a)}が代わりに飲んであげる！`);
  if(log.length)box2.append(...log.map(l=>txt('p','help',l)));
  box2.append(txt('p','verdict',out.cancelled?'テキーラは無効になりました 🎉':`🥃 テキーラ1杯：${pname(out.drinker)}`));
  // helper cards: the appeal and the explanation are always shown to holders; the buttons only while they can act
  const held=heldKinds();
  if(held.length){
   const ch=itemChoices(uid,state.pick,tqMap),panel=div('helppanel',txt('h4','','🎁 お助けカードが使えます！'),txt('p','fine','使うかどうかは自由です。ホストが「次のターン」を押すまで使えます。'));
   for(const k of held){
    const who=k==='barrier'?'テキーラが自分に来た人が使えます':k==='cute'?'テキーラが最初に自分に来た人が使えます':'テキーラを飲む人以外が使えます（先に押した人が代わります）';
    panel.append(txt('p','help',`${items[k].icon} ${items[k].name}：${items[k].desc}（${who}）`));
   }
   const act=div('acts');
   const mk=(label,fn,cls='')=>{const b=el('button',label);if(cls)b.className=cls;b.disabled=pending;b.onclick=async()=>{if(pending||dead)return;pending=true;render();try{await fn();}catch{message('お助けを使えませんでした。もう一度試してください。');}finally{pending=false;if(!dead)render();}};dockButtons++;act.append(b);};
   if(ch.barrier&&held.includes('barrier'))mk('🛡️ バリアを使う（テキーラ無効）',()=>useItem('barrier'));
   if(ch.cute&&held.includes('cute')){
    if(!cuteMode)mk('🥺 可愛いだけじゃダメですか？（なすりつける）',async()=>{cuteMode=true;});
    else{act.append(txt('p','help','誰になすりつけますか？'));for(const p of players)if(p.uid!==uid)mk(`${p.name}に`,()=>useItem('cute',p.uid));mk('やめる',async()=>{cuteMode=false;},'secondary');}
   }
   if(ch.angel&&held.includes('angel'))mk(`👼 天使の分け前（${pname(tqMap.c||state.pick)}の代わりに飲む）`,()=>useItem('angel'));
   if(!act.children.length)act.append(txt('p','fine','いまは使えるタイミングではありません。'));
   panel.append(act);box2.append(panel);
  }
  return box2;
 }
 function flipCard(card){
  const ms=globalThis.__nqFlipMs??1600;
  if(!flipTimer){flipStart=performance.now();const round=state.round;flipTimer=setTimeout(()=>{flipTimer=null;if(dead)return;flipRound=round;render();},ms);}
  const c=div('flipcard',div('face back',cardBack()),div('face front k-'+card,cardFace(card)));
  c.style.animationDelay=-Math.max(0,performance.now()-flipStart)+'ms';
  box.append(txt('h3','verdict','カードが引かれた！'),div('flipwrap',c));
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
    if(typeof own!=='number'){box.append(el('p','👑 あなたが王様！ 命令する相手を1人選んで、声に出して命令しよう。拒否されると相手がチケット＋2。'));for(const p of players)if(p.uid!==uid)button(`${p.name}に命令する`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),Number(p.slot)),pending);}
    else box.append(el('p',target?`${name(target)}に命令しました。返事を待っています。`:'命令を送っています…'));
   }else if(target===uid){
    if(typeof own!=='number'){box.append(el('h3',`👑 ${name(actor)}王様の命令です`),el('p','命令を聞いて、従うか拒否するか選ぼう。拒否するとあなたがチケット＋2。'));button('従う',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),1),pending);button('拒否する（チケット＋2）',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),0),pending,'secondary');}
    else box.append(el('p','返事を送りました。結果を待っています。'));
   }else box.append(el('p',target?`${name(actor)}王様が${name(target)}に命令中。返事待ち…`:`${name(actor)}王様が命令する相手を選んでいます…`));
   if(host&&target&&target!==uid&&typeof answers[target]!=='number')button(`${name(target)}を「拒否」扱いにして進める`,()=>set(ref(db,`${base}/answers/${state.round}/${target}`),0),pending,'secondary');
   return;
  }
  if(actor===uid){
   if(typeof own!=='number'){box.append(el('p','タイプの人を1人選んで、声に出して誘おう。断られたらあなたがチケット＋1。'));for(const p of players)if(p.uid!==uid)button(`${p.name}を誘う`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),Number(p.slot)),pending);}
   else box.append(el('p',target?`${name(target)}を誘いました。返事を待っています。`:'誘いを送っています…'));
  }else if(target===uid){
   if(typeof own!=='number'){box.append(el('h3',`${name(actor)}があなたを誘っています`),el('p','承諾するとルーレット。HEAVENは2人ともお助け、HELLは2人ともチケット＋2。断ると誘った人がチケット＋1（あなたは罰なし）。'));button('承諾する',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),1),pending);button('断る',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),0),pending,'secondary');}
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
  if(state.card==='check'){
   try{const maps={};await Promise.all(players.map(async p=>{maps[p.uid]=(await get(ref(db,`personal/${roomId}/${p.uid}/drinks`))).val()||{};}));const {leaders}=ticketLeaders(ticketsFor(maps,players.map(p=>p.uid),round,players.length));if(leaders.length)pick=leaders[Math.floor(Math.random()*leaders.length)];}
   catch{settling=false;message('チケットを集計できませんでした。ホストは再読み込みして再接続してください。');return;}
  }
  try{await runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='measuring'?{...s,phase:'results',results,...(pick?{pick}:{}),...(direction?{direction}:{}),...(buttons?{buttonOutcome}:{}),...(fate?{fate}:{}),...(votes?{votes,topVotes}:{}),...(side!==null?{side}:{})}:undefined,{applyLocally:false});}
  catch{message('集計を送れませんでした。ホストは再読み込みして再接続してください。');}
  finally{settling=false;}
 }
 stops.push(onValue(ref(db,base+'/state'),snap=>{
  state=snap.val();if(state?.card==='mission'&&Array.isArray(state.order)){const a=state.order[(state.round-1)%state.order.length];if(a&&!missionDone.has(a)){missionDone.add(a);saveSeen();}}if(state?.card==='check')soloSeen.clear();else if(SOLO_CARDS.includes(state?.card))soloSeen.add(state.card);buttonDeck=buttonDecks[state?.round];if(seenPrompts[state?.card]&&typeof state.prompt==='number'&&!seenPrompts[state.card].has(state.prompt)){seenPrompts[state.card].add(state.prompt);saveSeen();}
  if(state?.round!==roundSeen){roundSeen=state?.round;began=null;elapsed=null;batteryDraft='';tapStart=null;tapCount=0;clearTimeout(tapTimer);tapTimer=null;own=undefined;answers={};choice=undefined;settledMap={};settledLoaded=false;spinRound=null;clearTimeout(spinTimer);spinTimer=null;pickRound=null;clearTimeout(pickTimer);pickTimer=null;flipRound=null;clearTimeout(flipTimer);flipTimer=null;rxClear();invite=undefined;inviteStop?.();inviteStop=null;answerStop?.();ownStop?.();settledStop?.();tqStop?.();tqMap={};cuteMode=false;nvStop?.();nvStop=null;nvMap={};settlePage=false;
   if(state){const round=state.round;tqStop=onValue(ref(db,`${base}/tq/${round}`),v=>{if(round!==roundSeen||dead)return;tqMap=v.val()||{};render();},()=>{tqMap={};});if(isBreak(round,players.length))nvStop=onValue(ref(db,`${base}/nv/${round}`),v=>{if(round!==roundSeen||dead)return;nvMap=v.val()||{};render();maybeAdvance();},()=>{nvMap={};});settledStop=onValue(ref(db,`${base}/settled/${round}`),v=>{if(round!==roundSeen||dead)return;settledMap=v.val()||{};settledLoaded=true;render();settleOwn();maybeAdvance();},()=>message('確定状況を取得できませんでした。'));ownStop=onValue(ref(db,`${base}/answers/${round}/${uid}`),v=>{if(round!==roundSeen||dead)return;own=v.val();render();},()=>message('回答の取得に失敗しました。'));
    if(host)answerStop=onValue(ref(db,`${base}/answers/${round}`),v=>{if(round!==roundSeen||dead)return;answers=v.val()||{};render();settle();},()=>message('集計の取得に失敗しました。'));
   }
  }
  if((state?.card==='danger'||state?.card==='king')&&state.phase==='measuring'&&!inviteStop){const round=state.round,actor=currentTurn(state,players).uid;inviteStop=onValue(ref(db,`${base}/answers/${round}/${actor}`),v=>{if(round!==roundSeen||dead)return;invite=v.val();render();settle();},()=>message('誘いの取得に失敗しました。再接続してください。'));}
  if(host&&state?.card==='buttons'&&state.phase==='measuring')runTransaction(ref(db,`${base}/buttonDeck/${state.round}`),d=>d?undefined:shuffleButtons(),{applyLocally:false}).catch(()=>message('ボタンの準備に失敗しました。再接続してください。'));
  render();settle();settleOwn();
 },()=>message('ゲーム接続ルールが未反映、または部屋が終了しています。')));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/drinks`),snap=>{drinkMap=snap.val()||{};drinks=Object.values(drinkMap).reduce((a,v)=>a+v,0);render();settleOwn();},()=>{drinks=null;message('自分のチケットを取得できませんでした。再接続してください。');render();}));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/items`),snap=>{
  itemMap=snap.val()||{};
  if(!Object.keys(itemMap).length&&!grantTried){grantTried=true;set(ref(db,`personal/${roomId}/${uid}/items/0`),drawItem()).catch(()=>{grantFailed=true;message('お助けを受け取れませんでした。再接続してください。');render();settleOwn();});}
  render();settleOwn();
 },()=>{grantFailed=true;itemMap={};message('お助けを取得できませんでした。');render();}));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/grants`),snap=>{grantMap=snap.val()||{};render();settleOwn();},()=>{grantMap={};message('お助けの獲得状況を取得できませんでした。');render();}));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/spent`),snap=>{const next=snap.val()||{};if(spentSeen)for(const [slot,r] of Object.entries(next))if(spentMap?.[slot]===undefined&&r===state?.round)showItemFx(itemMap?.[slot]);spentSeen=true;spentMap=next;render();settleOwn();},()=>{spentMap={};message('お助けの使用状況を取得できませんでした。');render();}));
 if(host)stops.push(onValue(ref(db,base+'/buttonDeck'),snap=>{buttonDecks=snap.val()||{};buttonDeck=buttonDecks[state?.round];settle();},()=>message('ボタンの準備を取得できませんでした。')));
 if(host){const order=shufflePlayers(players);runTransaction(ref(db,base+'/state'),s=>s?undefined:{round:1,phase:'draw',order,actor:order[0],accounting:true},{applyLocally:false}).catch(()=>message('ゲーム接続ルールの反映が必要です。'));}
 return()=>{dead=true;nvStop?.();clearTimeout(spinTimer);clearTimeout(flipTimer);rxClear();inviteStop?.();stops.forEach(fn=>fn());allDrinksStops.forEach(fn=>fn());tqStop?.();answerStop?.();ownStop?.();settledStop?.();box.replaceChildren();};
}
