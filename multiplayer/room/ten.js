import {ref,set,onValue,runTransaction} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js';
import {shufflePlayers,currentTurn} from './turn.js?v=0.4';
import {cards,drawCard,drawDirection,targetsFor} from './deck.js?v=0.4';
export function attachTen({db,roomId,uid,players,hostUid,message}) {
 const box=document.getElementById('tenGame'),host=uid===hostUid,base=`sessions/${roomId}`;
 let state,own,answers={},began=null,elapsed=null,batteryDraft='',pending=false,dead=false,answerStop,ownStop,roundSeen,settling=false;
 const stops=[],byUid=new Map(players.map(p=>[p.uid,p]));
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 function button(text,fn,disabled=false){const b=el('button',text);b.disabled=disabled;b.onclick=async()=>{if(pending||dead)return;pending=true;render();try{await fn();}catch{message('ゲーム通信に失敗しました。再接続後にもう一度試してください。');}finally{pending=false;if(!dead)render();}};box.append(b);}
 function render(){
  if(dead)return;box.replaceChildren();
  if(!state){box.append(el('p',host?'ゲームを準備しています…':'ホストのゲーム準備を待っています…'));return;}
  const turn=currentTurn(state,players),card=state.card||'ten';
  box.append(el('p',`ターン ${state.round} · ${turn.cycle}巡目`),el('h2',`今回の担当：${byUid.get(turn.uid)?.name||'確認中'}`));
  const orderList=el('ol','');turn.order.forEach((id,i)=>orderList.append(el('li',`${byUid.get(id)?.name||'確認中'}${i===turn.index?' ← 今ここ':''}`)));box.append(orderList);
  if(state.phase==='draw'){
   box.append(el('h2','カードを引こう'),el('p','通信試作の山札は10秒ジャストと充電マウント合戦の2枚です。'));
   if(turn.uid===uid)button('カードを引く',()=>{const round=state.round,key=drawCard();return runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='draw'?{...s,phase:'measuring',card:key}:undefined,{applyLocally:false});},pending);
   else box.append(el('p',`${byUid.get(turn.uid)?.name||'今回の担当'}がカードを引くのを待っています。`));
   return;
  }
  box.append(el('h2',cards[card].title),el('p',cards[card].rule));
  if(state.phase==='results'){
   const entries=players.map(p=>({...p,value:state.results?.[p.uid]}));
   if(entries.some(p=>typeof p.value!=='number')){box.append(el('p','結果を確認しています…'));return;}
   if(card==='battery')box.append(el('h3',`今回は ${state.direction}！`));
   const targets=new Set(targetsFor(card,state.results,state.direction)),list=el('ul','');
   for(const p of entries)list.append(el('li',`${p.name}：${card==='ten'?(p.value/1000).toFixed(3)+'秒':p.value+'％'}${targets.has(p.uid)?' · 今回の対象':''}`));
   box.append(list,el('p','同率は全員対象。個人DRINK・お助けへの加算はまだ未接続です。実際に飲む必要はありません。'));
   if(host)button('次のターン',()=>{const round=state.round,order=state.order||shufflePlayers(players);return runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='results'?{round:round+1,phase:'draw',order}:undefined,{applyLocally:false});},pending||state.round>=100);
   else box.append(el('p','ホストが次のターンへ進むのを待っています。'));
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
 async function settle(){
  if(dead||!host||settling||state?.phase!=='measuring'||!players.every(p=>typeof answers[p.uid]==='number'))return;
  settling=true;const round=state.round,results=Object.fromEntries(players.map(p=>[p.uid,answers[p.uid]])),direction=state.card==='battery'?drawDirection():null;
  try{await runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='measuring'?{...s,phase:'results',results,...(direction?{direction}:{})}:undefined,{applyLocally:false});}
  catch{message('集計を送れませんでした。ホストは再読み込みして再接続してください。');}
  finally{settling=false;}
 }
 stops.push(onValue(ref(db,base+'/state'),snap=>{
  state=snap.val();
  if(state?.round!==roundSeen){roundSeen=state?.round;began=null;elapsed=null;batteryDraft='';own=undefined;answers={};answerStop?.();ownStop?.();
   if(state){const round=state.round;ownStop=onValue(ref(db,`${base}/answers/${round}/${uid}`),v=>{if(round!==roundSeen||dead)return;own=v.val();render();},()=>message('回答の取得に失敗しました。'));
    if(host)answerStop=onValue(ref(db,`${base}/answers/${round}`),v=>{if(round!==roundSeen||dead)return;answers=v.val()||{};render();settle();},()=>message('集計の取得に失敗しました。'));
   }
  }render();settle();
 },()=>message('ゲーム接続ルールが未反映、または部屋が終了しています。')));
 if(host){const order=shufflePlayers(players);runTransaction(ref(db,base+'/state'),s=>s?undefined:{round:1,phase:'draw',order},{applyLocally:false}).catch(()=>message('ゲーム接続ルールの反映が必要です。'));}
 return()=>{dead=true;stops.forEach(fn=>fn());answerStop?.();ownStop?.();box.replaceChildren();};
}
