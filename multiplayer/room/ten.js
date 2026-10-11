import { ref, set, onValue, runTransaction } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js';
export function attachTen({db,roomId,uid,players,hostUid,message}) {
 const box=document.getElementById('tenGame'),host=uid===hostUid,base=`sessions/${roomId}`;
 let state,own,answers={},began=null,elapsed=null,pending=false,dead=false,answerStop,ownStop,roundSeen,settling=false;
 const stops=[];const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 function button(text,fn,disabled=false){const b=el('button',text);b.disabled=disabled;b.onclick=async()=>{if(pending)return;pending=true;render();try{await fn();}catch(e){message('ゲーム通信に失敗しました。再接続後にもう一度試してください。');}finally{pending=false;if(!dead)render();}};box.append(b);}
 function render(){if(dead)return;box.replaceChildren(el('h2','10秒ジャスト'));if(!state){box.append(el('p',host?'ゲームを準備しています…':'ホストのゲーム準備を待っています…'));return;}
 box.append(el('p',`ラウンド ${state.round}`));
 if(state.phase==='results'){
 const entries=players.map(p=>({...p,ms:state.results?.[p.uid]}));if(entries.some(p=>typeof p.ms!=='number')){box.append(el('p','結果を確認しています…'));return;}
 const worst=Math.max(...entries.map(p=>Math.abs(p.ms-10000)));const list=el('ul','');for(const p of entries){list.append(el('li',`${p.name}：${(p.ms/1000).toFixed(3)}秒${Math.abs(p.ms-10000)===worst?' · 今回の対象':''}`));}box.append(list,el('p','10秒から最も遠い人が対象。同率なら全員。実際に飲む必要はありません。'));
 if(host)button('次のラウンド',()=>set(ref(db,base+'/state'),{round:state.round+1,phase:'measuring'}),pending||state.round>=100);else box.append(el('p','ホストが次のラウンドへ進むのを待っています。'));return;}
 if(typeof own==='number'){box.append(el('p','送信済み · 全員の計測を待っています。'));}
 else if(elapsed!==null){box.append(el('p','計測完了。結果を送信してください。'));button('結果を送信',()=>set(ref(db,`${base}/answers/${state.round}/${uid}`),elapsed),pending);}
 else if(began!==null){box.append(el('p','10秒だと思ったらSTOP！'));button('STOP',async()=>{elapsed=Math.min(120000,Math.round(performance.now()-began));began=null;},pending);}
 else{box.append(el('p','時計を見ずに10秒を狙おう。自分のタイミングでSTART。'));button('START',async()=>{began=performance.now();},pending);}
 if(host)box.append(el('p',`回答 ${players.filter(p=>typeof answers[p.uid]==='number').length}/${players.length}人`));
 }
 async function settle(){if(!host||settling||state?.phase!=='measuring'||!players.every(p=>typeof answers[p.uid]==='number'))return;settling=true;const round=state.round;const results=Object.fromEntries(players.map(p=>[p.uid,answers[p.uid]]));try{await runTransaction(ref(db,base+'/state'),s=>s?.round===round&&s.phase==='measuring'?{round,phase:'results',results}:undefined,{applyLocally:false});}catch{message('集計を送れませんでした。ホストは再読み込みして再接続してください。');}finally{settling=false;}}
 stops.push(onValue(ref(db,base+'/state'),snap=>{state=snap.val();if(state?.round!==roundSeen){roundSeen=state?.round;began=null;elapsed=null;own=undefined;answers={};answerStop?.();ownStop?.();if(state){const round=state.round;ownStop=onValue(ref(db,`${base}/answers/${round}/${uid}`),v=>{if(round!==roundSeen)return;own=v.val();render();},()=>message('回答の取得に失敗しました。'));if(host)answerStop=onValue(ref(db,`${base}/answers/${round}`),v=>{if(round!==roundSeen)return;answers=v.val()||{};render();settle();},()=>message('集計の取得に失敗しました。'));}}render();settle();},()=>message('ゲーム接続ルールが未反映、または部屋が終了しています。')));
 if(host)runTransaction(ref(db,base+'/state'),s=>s?undefined:{round:1,phase:'measuring'},{applyLocally:false}).catch(()=>message('ゲーム接続ルールの反映が必要です。'));
 return()=>{dead=true;stops.forEach(fn=>fn());answerStop?.();ownStop?.();box.replaceChildren();};
}
