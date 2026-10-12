import {ref,set,update,onValue,runTransaction} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js';
import {shufflePlayers,currentTurn} from './turn.js?v=0.4';
import {cards,drawCard,drawDirection,targetsFor,shuffleButtons,drinkAward,items,itemKinds,drawItem,decideCredit,winnersFor,REACTION_FAIL,dangerOutcome,rewardees} from './deck.js?v=0.12';
export function attachTen({db,roomId,uid,players,hostUid,message}) {
 const box=document.getElementById('tenGame'),host=uid===hostUid,base=`sessions/${roomId}`;
 let state,own,answers={},began=null,elapsed=null,batteryDraft='',pending=false,dead=false,answerStop,ownStop,roundSeen,settling=false,buttonDeck,buttonDecks={},drinks=null,drinkMap,itemMap,spentMap,settledMap={},settledLoaded=false,grantMap,grantBusy=false,spinRound=null,spinStart=0,spinTimer,rx=null,invite,inviteStop,choice,ownBusy=false,ownError=false,grantTried=false,grantFailed=false,settledStop;
 const stops=[],byUid=new Map(players.map(p=>[p.uid,p]));
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 const txt=(tag,cls,text)=>{const n=el(tag,text);n.className=cls;return n;};
 const div=(cls,...kids)=>{const n=document.createElement('div');n.className=cls;n.append(...kids);return n;};
 const shortName={barrier:'バリア',cute:'可愛い',angel:'天使'};
 function button(text,fn,disabled=false){const b=el('button',text);b.disabled=disabled;b.onclick=async()=>{if(pending||dead)return;pending=true;render();try{await fn();}catch{message('ゲーム通信に失敗しました。再接続後にもう一度試してください。');}finally{pending=false;if(!dead)render();}};box.append(b);}
 function nextButton(){if(host)button('次のターン',()=>{const round=state.round,order=state.order||shufflePlayers(players);return runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='results'?{round:round+1,phase:'draw',order,accounting:true}:undefined,{applyLocally:false});},pending||ownBusy||!settledAll()||state.round>=100);
   else box.append(el('p','ホストが次のターンへ進むのを待っています。'));}
 function render(){
  if(dead)return;box.replaceChildren();
  if(!state){box.append(el('p',host?'ゲームを準備しています…':'ホストのゲーム準備を待っています…'));return;}
  box.append(statusPanel());
  const turn=currentTurn(state,players),card=state.card||'ten';
  box.append(el('p',`ターン ${state.round} · ${turn.cycle}巡目`),el('h2',`今回の担当：${byUid.get(turn.uid)?.name||'確認中'}`));
  const orderList=el('ol','');turn.order.forEach((id,i)=>orderList.append(el('li',`${byUid.get(id)?.name||'確認中'}${i===turn.index?' ← 今ここ':''}`)));box.append(orderList);
  if(state.phase==='draw'){
   box.append(el('h2','カードを引こう'),el('p','通信試作の山札は10秒ジャスト・充電マウント合戦・謎ボタン・ドキドキ・ヘブン＆ヘルの5枚です。'));
   if(turn.uid===uid)button('カードを引く',()=>{const round=state.round,key=drawCard();return runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='draw'?{...s,phase:'measuring',card:key}:undefined,{applyLocally:false});},pending);
   else box.append(el('p',`${byUid.get(turn.uid)?.name||'今回の担当'}がカードを引くのを待っています。`));
   return;
  }
  box.append(el('h2',cards[card].title),el('p',cards[card].rule));
  if(state.phase==='results'){
   if(card==='danger'){
    const o=dangerOutcome(state);if(!o){box.append(el('p','結果を確認しています…'));return;}
    if(o.accepted&&spinRound!==state.round){roulette(o.fate);return;}
   }
   if(card!=='buttons'&&card!=='danger'&&players.some(p=>typeof state.results?.[p.uid]!=='number')){box.append(el('p','結果を確認しています…'));return;}
   box.append(board(card,turn));
   drinkPanel();nextButton();
   return;
  }
  if(card==='buttons'){
   if(turn.uid!==uid)box.append(el('p',`${byUid.get(turn.uid)?.name}がボタンを押すのを待っています。`));
   else if(typeof own==='number')box.append(el('p','選択済み · 結果を待っています。'));
   else for(let i=0;i<3;i++)button(`❔ ボタン ${i+1}`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),i),pending);
   return;
  }
  if(card==='danger'){dangerUi(turn);return;}
  if(typeof own==='number')box.append(el('p','送信済み · 全員の回答を待っています。'));
  else if(card==='reaction')reactionUi();
  else if(card==='battery'){
   const label=el('label','充電残量（％）'),input=document.createElement('input');input.type='number';input.min='0';input.max='100';input.step='1';input.inputMode='numeric';input.value=batteryDraft;input.disabled=pending;input.oninput=()=>{batteryDraft=input.value;};label.append(input);box.append(label);
   button('充電残量を送信',()=>{const value=Number(batteryDraft);if(!batteryDraft.trim()||!Number.isInteger(value)||value<0||value>100){message('充電残量は0〜100の整数で入力してください。');return;}return set(ref(db,`${base}/answers/${state.round}/${uid}`),value);},pending);
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
  const mine=drinkMap[String(state.round)],base=drinkAward(state,uid,players),barrier=freeSlot('barrier'),angel=base>=2?freeSlot('angel'):undefined;
  if(mine===undefined&&!usedInfo()&&base>0&&(barrier!==undefined||angel!==undefined)){
   box.append(el('h3',`あなたはDRINK＋${base}です。お助けを使いますか？`));
   if(barrier!==undefined){box.append(el('p',`${items.barrier.icon}${items.barrier.name}：${items.barrier.desc}`));button(`${items.barrier.icon} ${items.barrier.name}を使う（DRINKなし）`,()=>settleOwn('barrier'),ownBusy);}
   if(angel!==undefined){box.append(el('p',`${items.angel.icon}${items.angel.name}：${items.angel.desc}`));button(`${items.angel.icon} ${items.angel.name}を使う（＋1に）`,()=>settleOwn('angel'),ownBusy);}
   button(`使わずに受ける（DRINK＋${base}）`,()=>settleOwn('skip'),ownBusy);
  }else if(!settledMap[uid]){
   if(ownError)button('カウント保存を再試行',()=>settleOwn(),ownBusy);
   else box.append(el('p','あなたのカウントを保存しています…'));
  }else{const mine=drinkMap?.[String(state.round)],base=drinkAward(state,uid,players);box.append(txt('p','mine',typeof mine==='number'?`あなたの今回の確定：${mine}杯${mine<base?'（お助けで軽減！）':''}`:'あなたのカウントは確定しました。'));}
  const waiting=players.filter(p=>!settledMap[p.uid]);
  if(waiting.length){
   box.append(el('p',`選択待ち：${waiting.map(p=>p.name).join('、')}`));
   if(host)button('待たずに進める（未選択の人は使わず受ける）',forceSettle,ownBusy||waiting.every(p=>p.uid===uid));
  }
 }
 // Each player records only their own credit; the host writes the plain amount only for players who do not respond.
 async function settleOwn(pick){
  if(dead||ownBusy||state?.phase!=='results'||!itemsReady()||!settledLoaded)return;
  grantOwn();if(grantPending())return;
  if(pick)choice=pick;
  const round=state.round,has=drinkMap[String(round)]!==undefined;
  if(has&&settledMap[uid])return;
  const plan=has?null:decideCredit({base:drinkAward(state,uid,players),barrierSlot:freeSlot('barrier'),angelSlot:freeSlot('angel'),used:usedInfo(),choice});
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
 function statusPanel(){
  const counts={};let total=0;
  for(const [k,v] of Object.entries(itemMap||{}))if(spentMap?.[k]===undefined){counts[v]=(counts[v]||0)+1;total++;}
  const ready=itemMap&&(Object.keys(itemMap).length>0||grantFailed);
  const chips=div('chips',...itemKinds.map(k=>txt('span','chip'+(counts[k]?'':' none'),`${items[k].icon} ${shortName[k]} ×${counts[k]||0}`)));
  const held=itemKinds.filter(k=>counts[k]).map(k=>txt('p','help',`${items[k].icon}${items[k].name}：${items[k].desc}`));
  return div('status',
   div('stat',txt('span','label','🍺 あなたの合計'),txt('span','big',drinks===null?'確認中…':`${drinks}杯`)),
   div('stat',txt('span','label',ready?`🎒 お助けカード ${total}/3枚`:'🎒 お助けカード'),ready?chips:txt('span','help','配布中…'),...(ready?held:[])),
   txt('p','fine','この表示はあなたの画面だけ。実際に飲む必要はありません。'));
 }
 function board(card,turn){
  const detailFor=(p)=>{const v=state.results?.[p.uid];
   if(card==='ten')return typeof v==='number'?(v/1000).toFixed(3)+'秒':'';
   if(card==='battery')return typeof v==='number'?v+'％':'';
   if(card==='reaction')return typeof v==='number'?(v<REACTION_FAIL?v+'ms':'失敗'):'';
   if(card==='buttons')return p.uid===turn.uid&&typeof v==='number'?`ボタン ${v+1}`:'';
   if(card==='danger'){const o=dangerOutcome(state);return p.uid===o?.actor?'誘った':p.uid===o?.target?(o.accepted?'承諾':'断った'):'';}
   return '';};
  const gets=new Set(rewardees(state));
  const rows=players.map(p=>({p,amt:drinkAward(state,p.uid,players),detail:detailFor(p)})).sort((x,y)=>y.amt-x.amt);
  const losers=rows.filter(r=>r.amt>0);
  let verdict=losers.length?`${losers.map(r=>r.p.name).join('・')} の負け！`:'今回は誰も飲みません 🎉';
  let sub='';
  if(card==='battery')sub=`今回は ${state.direction}！`;
  if(card==='buttons')sub=state.buttonOutcome===0?'✨ 回避！':state.buttonOutcome===1?'今回の担当が対象':'全員が対象';
  if(card==='danger'){const o=dangerOutcome(state);sub=!o.accepted?'断られた！ 誘った人がDRINK':o.fate==='HEAVEN'?'👼 HEAVEN！ 2人ともお助けGET':'🔥 HELL！ 2人ともDRINK＋2';}
  if(card==='reaction'&&!gets.size)sub='全員失敗！ お助けなし';
  return div('board',txt('h3','verdict',verdict),...(sub?[txt('p','sub',sub)]:[]),
   div('rows',...rows.map(r=>div('row '+(r.amt>0?'lose':'safe'),txt('span','who',r.p.name),txt('span','detail',[r.detail,gets.has(r.p.uid)?'🎁お助けGET':''].filter(Boolean).join(' · ')),txt('span','cups',r.amt>0?`🍺 ${r.amt}杯`:'セーフ')))),
   txt('p','fine','バリア・天使の分け前で減らせます（使う・使わないは本人だけが選びます）。'));
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
  if(actor===uid){
   if(typeof own!=='number'){box.append(el('p','誘う相手を1人選んでください。断られたらあなたがDRINK＋1。'));for(const p of players)if(p.uid!==uid)button(`${p.name}を誘う`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),Number(p.slot)),pending);}
   else box.append(el('p',target?`${name(target)}を誘いました。返事を待っています。`:'誘いを送っています…'));
  }else if(target===uid){
   if(typeof own!=='number'){box.append(el('h3',`${name(actor)}があなたを誘っています`),el('p','承諾するとルーレット。HEAVENは2人ともお助け、HELLは2人ともDRINK＋2。断ると誘った人がDRINK＋1（あなたは罰なし）。'));button('承諾する',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),1),pending);button('断る',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),0),pending);}
   else box.append(el('p','返事を送りました。結果を待っています。'));
  }else box.append(el('p',target?`${name(actor)}が${name(target)}を誘っています。返事待ち…`:`${name(actor)}が誰かを誘っています…`));
  if(host&&target&&target!==uid&&typeof answers[target]!=='number')button(`${name(target)}を「断った」扱いにして進める`,()=>set(ref(db,`${base}/answers/${state.round}/${target}`),0),pending);
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
  const actor=currentTurn(state,players).uid,buttons=state.card==='buttons',danger=state.card==='danger';
  let results,fate=null;
  if(danger){
   const a=answers[actor],t=typeof a==='number'?players.find(p=>Number(p.slot)===a):null;
   if(!t||typeof answers[t.uid]!=='number')return;
   results={[actor]:a,[t.uid]:answers[t.uid]};if(answers[t.uid]===1)fate=Math.random()<0.5?'HEAVEN':'HELL';
  }else if(buttons?(!buttonDeck||typeof answers[actor]!=='number'):!players.every(p=>typeof answers[p.uid]==='number'))return;
  settling=true;const round=state.round,direction=state.card==='battery'?drawDirection():null,buttonOutcome=buttons?buttonDeck[answers[actor]]:null;
  if(!danger)results=buttons?{[actor]:answers[actor]}:Object.fromEntries(players.map(p=>[p.uid,answers[p.uid]]));
  try{await runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='measuring'?{...s,phase:'results',results,...(direction?{direction}:{}),...(buttons?{buttonOutcome}:{}),...(fate?{fate}:{})}:undefined,{applyLocally:false});}
  catch{message('集計を送れませんでした。ホストは再読み込みして再接続してください。');}
  finally{settling=false;}
 }
 stops.push(onValue(ref(db,base+'/state'),snap=>{
  state=snap.val();buttonDeck=buttonDecks[state?.round];
  if(state?.round!==roundSeen){roundSeen=state?.round;began=null;elapsed=null;batteryDraft='';own=undefined;answers={};choice=undefined;settledMap={};settledLoaded=false;spinRound=null;clearTimeout(spinTimer);spinTimer=null;rxClear();invite=undefined;inviteStop?.();inviteStop=null;answerStop?.();ownStop?.();settledStop?.();
   if(state){const round=state.round;settledStop=onValue(ref(db,`${base}/settled/${round}`),v=>{if(round!==roundSeen||dead)return;settledMap=v.val()||{};settledLoaded=true;render();settleOwn();},()=>message('確定状況を取得できませんでした。'));ownStop=onValue(ref(db,`${base}/answers/${round}/${uid}`),v=>{if(round!==roundSeen||dead)return;own=v.val();render();},()=>message('回答の取得に失敗しました。'));
    if(host)answerStop=onValue(ref(db,`${base}/answers/${round}`),v=>{if(round!==roundSeen||dead)return;answers=v.val()||{};render();settle();},()=>message('集計の取得に失敗しました。'));
   }
  }
  if(state?.card==='danger'&&state.phase==='measuring'&&!inviteStop){const round=state.round,actor=currentTurn(state,players).uid;inviteStop=onValue(ref(db,`${base}/answers/${round}/${actor}`),v=>{if(round!==roundSeen||dead)return;invite=v.val();render();settle();},()=>message('誘いの取得に失敗しました。再接続してください。'));}
  if(host&&state?.card==='buttons'&&state.phase==='measuring')runTransaction(ref(db,`${base}/buttonDeck/${state.round}`),d=>d?undefined:shuffleButtons(),{applyLocally:false}).catch(()=>message('ボタンの準備に失敗しました。再接続してください。'));
  render();settle();settleOwn();
 },()=>message('ゲーム接続ルールが未反映、または部屋が終了しています。')));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/drinks`),snap=>{drinkMap=snap.val()||{};drinks=Object.values(drinkMap).reduce((a,v)=>a+v,0);render();settleOwn();},()=>{drinks=null;message('自分のDRINKを取得できませんでした。再接続してください。');render();}));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/items`),snap=>{
  itemMap=snap.val()||{};
  if(!Object.keys(itemMap).length&&!grantTried){grantTried=true;set(ref(db,`personal/${roomId}/${uid}/items/0`),drawItem()).catch(()=>{grantFailed=true;message('お助けを受け取れませんでした。再接続してください。');render();settleOwn();});}
  render();settleOwn();
 },()=>{grantFailed=true;itemMap={};message('お助けを取得できませんでした。');render();}));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/grants`),snap=>{grantMap=snap.val()||{};render();settleOwn();},()=>{grantMap={};message('お助けの獲得状況を取得できませんでした。');render();}));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/spent`),snap=>{spentMap=snap.val()||{};render();settleOwn();},()=>{spentMap={};message('お助けの使用状況を取得できませんでした。');render();}));
 if(host)stops.push(onValue(ref(db,base+'/buttonDeck'),snap=>{buttonDecks=snap.val()||{};buttonDeck=buttonDecks[state?.round];settle();},()=>message('ボタンの準備を取得できませんでした。')));
 if(host){const order=shufflePlayers(players);runTransaction(ref(db,base+'/state'),s=>s?undefined:{round:1,phase:'draw',order,accounting:true},{applyLocally:false}).catch(()=>message('ゲーム接続ルールの反映が必要です。'));}
 return()=>{dead=true;clearTimeout(spinTimer);rxClear();inviteStop?.();stops.forEach(fn=>fn());answerStop?.();ownStop?.();settledStop?.();box.replaceChildren();};
}
