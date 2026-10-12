import {ref,set,update,onValue,runTransaction} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js';
import {shufflePlayers,currentTurn} from './turn.js?v=0.4';
import {cards,drawCard,drawDirection,targetsFor,shuffleButtons,drinkAward,items,drawItem,decideCredit} from './deck.js?v=0.9';
export function attachTen({db,roomId,uid,players,hostUid,message}) {
 const box=document.getElementById('tenGame'),host=uid===hostUid,base=`sessions/${roomId}`;
 let state,own,answers={},began=null,elapsed=null,batteryDraft='',pending=false,dead=false,answerStop,ownStop,roundSeen,settling=false,buttonDeck,buttonDecks={},drinks=null,drinkMap,itemMap,spentMap,settledMap={},settledLoaded=false,choice,ownBusy=false,ownError=false,grantTried=false,grantFailed=false,settledStop;
 const stops=[],byUid=new Map(players.map(p=>[p.uid,p]));
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 function button(text,fn,disabled=false){const b=el('button',text);b.disabled=disabled;b.onclick=async()=>{if(pending||dead)return;pending=true;render();try{await fn();}catch{message('ゲーム通信に失敗しました。再接続後にもう一度試してください。');}finally{pending=false;if(!dead)render();}};box.append(b);}
 function nextButton(){if(host)button('次のターン',()=>{const round=state.round,order=state.order||shufflePlayers(players);return runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='results'?{round:round+1,phase:'draw',order,accounting:true}:undefined,{applyLocally:false});},pending||ownBusy||!settledAll()||state.round>=100);
   else box.append(el('p','ホストが次のターンへ進むのを待っています。'));}
 function render(){
  if(dead)return;box.replaceChildren();
  if(!state){box.append(el('p',host?'ゲームを準備しています…':'ホストのゲーム準備を待っています…'));return;}
  box.append(el('p',drinks===null?'あなたのDRINKを確認しています…':`あなたのDRINK：${drinks}`));
  box.append(el('p','合計はあなたの画面だけに表示。実際に飲む必要はありません。'),el('p',itemLine()));
  const turn=currentTurn(state,players),card=state.card||'ten';
  box.append(el('p',`ターン ${state.round} · ${turn.cycle}巡目`),el('h2',`今回の担当：${byUid.get(turn.uid)?.name||'確認中'}`));
  const orderList=el('ol','');turn.order.forEach((id,i)=>orderList.append(el('li',`${byUid.get(id)?.name||'確認中'}${i===turn.index?' ← 今ここ':''}`)));box.append(orderList);
  if(state.phase==='draw'){
   box.append(el('h2','カードを引こう'),el('p','通信試作の山札は10秒ジャスト・充電マウント合戦・謎ボタンの3枚です。'));
   if(turn.uid===uid)button('カードを引く',()=>{const round=state.round,key=drawCard();return runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='draw'?{...s,phase:'measuring',card:key}:undefined,{applyLocally:false});},pending);
   else box.append(el('p',`${byUid.get(turn.uid)?.name||'今回の担当'}がカードを引くのを待っています。`));
   return;
  }
  box.append(el('h2',cards[card].title),el('p',cards[card].rule));
  if(state.phase==='results'){
   if(card==='buttons'){
    const chosen=state.results?.[turn.uid];
    box.append(el('p',`${byUid.get(turn.uid)?.name}：ボタン ${chosen+1}`),el('h3',state.buttonOutcome===0?'✨ 回避！':state.buttonOutcome===1?'今回の担当が対象':'全員が対象'));
    box.append(el('p','対象者のDRINKを＋1。バリアで回避できます。'));
    drinkPanel();nextButton();return;
   }
   const entries=players.map(p=>({...p,value:state.results?.[p.uid]}));
   if(entries.some(p=>typeof p.value!=='number')){box.append(el('p','結果を確認しています…'));return;}
   if(card==='battery')box.append(el('h3',`今回は ${state.direction}！`));
   const targets=new Set(targetsFor(card,state.results,state.direction)),list=el('ul','');
   for(const p of entries)list.append(el('li',`${p.name}：${card==='ten'?(p.value/1000).toFixed(3)+'秒':p.value+'％'}${targets.has(p.uid)?' · 今回の対象':''}`));
   box.append(list,el('p','同率は全員対象。対象者のDRINKを＋1。バリアで回避できます。'));
   drinkPanel();nextButton();
   return;
  }
  if(card==='buttons'){
   if(turn.uid!==uid)box.append(el('p',`${byUid.get(turn.uid)?.name}がボタンを押すのを待っています。`));
   else if(typeof own==='number')box.append(el('p','選択済み · 結果を待っています。'));
   else for(let i=0;i<3;i++)button(`❔ ボタン ${i+1}`,()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),i),pending);
   return;
  }
  if(typeof own==='number')box.append(el('p','送信済み · 全員の回答を待っています。'));
  else if(card==='battery'){
   const label=el('label','充電残量（％）'),input=document.createElement('input');input.type='number';input.min='0';input.max='100';input.step='1';input.inputMode='numeric';input.value=batteryDraft;input.disabled=pending;input.oninput=()=>{batteryDraft=input.value;};label.append(input);box.append(label);
   button('充電残量を送信',()=>{const value=Number(batteryDraft);if(!batteryDraft.trim()||!Number.isInteger(value)||value<0||value>100){message('充電残量は0〜100の整数で入力してください。');return;}return set(ref(db,`${base}/answers/${state.round}/${uid}`),value);},pending);
  }else if(elapsed!==null){box.append(el('p','計測完了。結果を送信してください。'));button('結果を送信',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),elapsed),pending);}
  else if(began!==null){box.append(el('p','10秒だと思ったらSTOP！'));button('STOP',async()=>{elapsed=Math.min(120000,Math.round(performance.now()-began));began=null;},pending);}
  else{box.append(el('p','時計を見ずに10秒を狙おう。自分のタイミングでSTART。'));button('START',async()=>{began=performance.now();},pending);}
  if(host)box.append(el('p',`回答 ${players.filter(p=>typeof answers[p.uid]==='number').length}/${players.length}人`));
 }
 const settledAll=()=>players.every(p=>settledMap[p.uid]===true);
 const itemsReady=()=>drinkMap!==undefined&&itemMap!==undefined&&spentMap!==undefined&&(Object.keys(itemMap).length>0||grantFailed);
 const barrierSlot=()=>Object.entries(itemMap||{}).find(([k,v])=>v==='barrier'&&spentMap?.[k]===undefined)?.[0];
 const usedSlot=()=>Object.entries(spentMap||{}).find(([,r])=>r===state?.round)?.[0];
 function itemLine(){
  if(!itemMap||(!Object.keys(itemMap).length&&!grantFailed))return 'お助け：配布しています…';
  const list=Object.entries(itemMap).map(([k,v])=>`${items[v]?.icon||''}${items[v]?.name||v}${spentMap?.[k]!==undefined?'（使用済み）':''}`);
  return list.length?`お助け：${list.join('、')}`:'お助け：なし';
 }
 function drinkPanel(){
  if(!itemsReady()){box.append(el('p','あなたのお助けを確認しています…'));return;}
  const mine=drinkMap[String(state.round)],base=drinkAward(state,uid,players),slot=barrierSlot();
  if(mine===undefined&&usedSlot()===undefined&&base>0&&slot!==undefined){
   box.append(el('h3',`あなたは対象です。${items.barrier.icon}${items.barrier.name}を使いますか？`),el('p',items.barrier.desc));
   button(`${items.barrier.icon} ${items.barrier.name}を使う（DRINKなし）`,()=>settleOwn('use'),ownBusy);
   button(`使わずに受ける（DRINK＋${base}）`,()=>settleOwn('skip'),ownBusy);
  }else if(!settledMap[uid]){
   if(ownError)button('カウント保存を再試行',()=>settleOwn(),ownBusy);
   else box.append(el('p','あなたのカウントを保存しています…'));
  }else box.append(el('p','あなたのカウントは確定しました。'));
  const waiting=players.filter(p=>!settledMap[p.uid]);
  if(waiting.length){
   box.append(el('p',`選択待ち：${waiting.map(p=>p.name).join('、')}`));
   if(host)button('待たずに進める（未選択の人は使わず受ける）',forceSettle,ownBusy||waiting.every(p=>p.uid===uid));
  }
 }
 // Each player records only their own credit; the host writes the plain amount only for players who do not respond.
 async function settleOwn(pick){
  if(dead||ownBusy||state?.phase!=='results'||!itemsReady()||!settledLoaded)return;
  if(pick)choice=pick;
  const round=state.round,has=drinkMap[String(round)]!==undefined;
  if(has&&settledMap[uid])return;
  const plan=has?null:decideCredit({base:drinkAward(state,uid,players),barrierSlot:barrierSlot(),usedSlot:usedSlot(),choice});
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
 async function settle(){
  if(dead||!host||settling||state?.phase!=='measuring')return;
  const actor=currentTurn(state,players).uid,buttons=state.card==='buttons';
  if(buttons?(!buttonDeck||typeof answers[actor]!=='number'):!players.every(p=>typeof answers[p.uid]==='number'))return;
  settling=true;const round=state.round,results=buttons?{[actor]:answers[actor]}:Object.fromEntries(players.map(p=>[p.uid,answers[p.uid]])),direction=state.card==='battery'?drawDirection():null,buttonOutcome=buttons?buttonDeck[answers[actor]]:null;
  try{await runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='measuring'?{...s,phase:'results',results,...(direction?{direction}:{}),...(buttons?{buttonOutcome}:{})}:undefined,{applyLocally:false});}
  catch{message('集計を送れませんでした。ホストは再読み込みして再接続してください。');}
  finally{settling=false;}
 }
 stops.push(onValue(ref(db,base+'/state'),snap=>{
  state=snap.val();buttonDeck=buttonDecks[state?.round];
  if(state?.round!==roundSeen){roundSeen=state?.round;began=null;elapsed=null;batteryDraft='';own=undefined;answers={};choice=undefined;settledMap={};settledLoaded=false;answerStop?.();ownStop?.();settledStop?.();
   if(state){const round=state.round;settledStop=onValue(ref(db,`${base}/settled/${round}`),v=>{if(round!==roundSeen||dead)return;settledMap=v.val()||{};settledLoaded=true;render();settleOwn();},()=>message('確定状況を取得できませんでした。'));ownStop=onValue(ref(db,`${base}/answers/${round}/${uid}`),v=>{if(round!==roundSeen||dead)return;own=v.val();render();},()=>message('回答の取得に失敗しました。'));
    if(host)answerStop=onValue(ref(db,`${base}/answers/${round}`),v=>{if(round!==roundSeen||dead)return;answers=v.val()||{};render();settle();},()=>message('集計の取得に失敗しました。'));
   }
  }
  if(host&&state?.card==='buttons'&&state.phase==='measuring')runTransaction(ref(db,`${base}/buttonDeck/${state.round}`),d=>d?undefined:shuffleButtons(),{applyLocally:false}).catch(()=>message('ボタンの準備に失敗しました。再接続してください。'));
  render();settle();settleOwn();
 },()=>message('ゲーム接続ルールが未反映、または部屋が終了しています。')));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/drinks`),snap=>{drinkMap=snap.val()||{};drinks=Object.values(drinkMap).reduce((a,v)=>a+v,0);render();settleOwn();},()=>{drinks=null;message('自分のDRINKを取得できませんでした。再接続してください。');render();}));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/items`),snap=>{
  itemMap=snap.val()||{};
  if(!Object.keys(itemMap).length&&!grantTried){grantTried=true;set(ref(db,`personal/${roomId}/${uid}/items/0`),drawItem()).catch(()=>{grantFailed=true;message('お助けを受け取れませんでした。再接続してください。');render();settleOwn();});}
  render();settleOwn();
 },()=>{grantFailed=true;itemMap={};message('お助けを取得できませんでした。');render();}));
 stops.push(onValue(ref(db,`personal/${roomId}/${uid}/spent`),snap=>{spentMap=snap.val()||{};render();settleOwn();},()=>{spentMap={};message('お助けの使用状況を取得できませんでした。');render();}));
 if(host)stops.push(onValue(ref(db,base+'/buttonDeck'),snap=>{buttonDecks=snap.val()||{};buttonDeck=buttonDecks[state?.round];settle();},()=>message('ボタンの準備を取得できませんでした。')));
 if(host){const order=shufflePlayers(players);runTransaction(ref(db,base+'/state'),s=>s?undefined:{round:1,phase:'draw',order,accounting:true},{applyLocally:false}).catch(()=>message('ゲーム接続ルールの反映が必要です。'));}
 return()=>{dead=true;stops.forEach(fn=>fn());answerStop?.();ownStop?.();settledStop?.();box.replaceChildren();};
}
