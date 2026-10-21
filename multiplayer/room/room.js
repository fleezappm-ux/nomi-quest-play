import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import { getAuth, signInAnonymously, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { isLocal, getDatabase, ref, set, get, update, onValue, onDisconnect, runTransaction, serverTimestamp } from './fb.js?v=pop0.57';
import { firebaseConfig } from './firebase-config.js';
import QRCode from './vendor/qrcode.mjs';
import { attachTen } from './ten.js?v=pop0.57';
import { attachNpcs, npcNames } from './npc.js?v=pop0.57';
import { FEEDBACK_URL } from './feedback-config.js?v=pop0.57';
import { attachOni, attachOniBots } from './oni.js?v=pop0.57';
import { track, logEnabled } from './telemetry.js?v=pop0.57';
import { ensureAdult } from './agegate.js?v=pop0.57';
// 20歳以上の確認が済むまで、このあとの処理（部屋への参加など）は動かさない。
await ensureAdult();

const $ = id => document.getElementById(id);
const homePage = new URL('./', location.href); homePage.searchParams.set('v','pop0.57'); if (isLocal) homePage.searchParams.set('npc','1'); if (isLocal && new URL(location.href).searchParams.get('dev')==='1') homePage.searchParams.set('dev','1');
const homeUrl = homePage.href;
const params = new URL(location.href).searchParams;
const validRoom = value => /^[a-f0-9]{32}$/.test(value || '');
let roomId = !isLocal && validRoom(params.get('room')) ? params.get('room') : null;
let uid, db, slot = null, room, connected = false, busy = false;
let roomStop, connectionStop, disconnectTask, expiryTimer;
let generation = 0;
let tenStop, npcGame;
let sharePhase;
function savedSession() { if (isLocal) return null; try { const s=JSON.parse(localStorage.getItem('nq-room-session')); return validRoom(s?.roomId) && /^[0-5]$/.test(String(s.slot)) ? s : null; } catch { return null; } }
function resumeOffer() { $('resumeBox').hidden = !savedSession(); }
const avatars = ['🍻','🌙','⭐','🌈','🔥','🎲'];
$('homeLink').href = homeUrl;
$('inviteJoin').hidden = !roomId;
// 招待リンク・QRから来た人には「参加」だけを見せる（部屋づくり・テストは出さない）
if(roomId&&!isLocal){$('create').hidden=true;$('npcLink').hidden=true;$('devLink').hidden=true;$('inviteHead').hidden=false;$('lead').hidden=true;document.querySelector('.hero')?.classList.add('compact');}
function needName(){const e=$('name');e.classList.add('bad');$('nameErr').hidden=false;e.focus();e.scrollIntoView({block:'center',behavior:'smooth'});}
$('name').addEventListener('input',()=>{$('name').classList.remove('bad');$('nameErr').hidden=true;});
$('name').value = localStorage.getItem('nq-room-name') || '';
let editingName=false;
function syncName(){const n=(localStorage.getItem('nq-room-name')||'').trim(),has=!!n&&!editingName;$('nameBox').hidden=has;$('welcome').hidden=!has;$('renick').hidden=!n||editingName||!!roomId;if(has)$('welcome').replaceChildren(document.createTextNode('ようこそ、'+n+'さん'),document.createElement('br'),document.createTextNode('今日は何して遊ぶ？'));}
$('nameOk').onclick=()=>{const v=$('name').value.trim();if(!v||v.length>10){needName();return;}localStorage.setItem('nq-room-name',v);editingName=false;syncName();};
$('name').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('nameOk').click();}});
$('renick').onclick=()=>{editingName=true;syncName();$('name').focus();};
$('tell').onclick=async()=>{const url=new URL('./',location.href);url.search='';const data={title:'NOMI QUEST',text:'飲み会ゲーム「NOMI QUEST」で遊ぼう！',url:url.href};try{if(navigator.share){await navigator.share(data);return;}}catch{return;}try{await navigator.clipboard.writeText(url.href);message('リンクをコピーしました。LINEなどに貼って教えてね。');}catch{message('リンク：'+url.href);}};
syncName();

function message(text) { $('message').textContent = text; }
function errorText(error) {
  if (/permission|denied/i.test(error?.code || error?.message || '')) return '参加できませんでした。部屋の期限・状態、または通信設定を確認してください。';
  return error?.message || '通信に失敗しました。接続を確認して、もう一度お試しください。';
}
function show(id) { if(id==='home')$('share').hidden=true; for (const section of ['home','lobby','started']) $(section).hidden = section !== id; }
function ownName() { const name = $('name').value.trim() || (localStorage.getItem('nq-room-name')||'').trim(); if (!name || name.length > 20) throw new Error('名前を1〜20文字で入力してください。'); localStorage.setItem('nq-room-name', name); return name; }
async function action(fn) { if (busy) return; busy = true; controls(); message(''); try { await fn(); } catch (e) { message(errorText(e)); } finally { busy = false; controls(); } }
function members() { return Object.entries(room?.slots || {}).sort((a,b)=>Number(a[0])-Number(b[0])); }
function active() { return room?.meta?.state === 'lobby' && room.meta.expiresAt > Date.now(); }
function controls() {
  $('create').disabled = !uid || !connected || busy;
  $('resume').disabled = !uid || !connected || busy;
  $('join').disabled = !uid || !connected || busy;
  $('ready').disabled = !connected || busy || !active();
  const list = members();
  $('start').disabled = !connected || busy || !active() || list.length < 2 || !list.every(([,p])=>p.ready && p.connected);
  for (const id of ['leave','returnHome','modeCards','modeOni','closeGame']) $(id).disabled = busy;
  for(const id of ['endPlain','endSettle']) $(id).disabled=busy||!connected||!$('endAck').checked;
  $('close').disabled = busy || !connected;
}
function render() {
  if (!room?.meta) { message('この部屋は見つかりません。招待を確認してください。'); return; }
  const list = members(), host = room.meta.hostUid === uid;
  $('share').hidden = !host; $('start').hidden = !host; $('close').hidden = !host; $('hostZone').hidden = !(host && room.meta.state==='started');
  const expired = room.meta.expiresAt <= Date.now();
  $('share').hidden = isLocal || !host || expired || room.meta.state==='closed';
  const phase=roomId+':'+room.meta.state;
  if(sharePhase!==phase){$('share').open=room.meta.state==='lobby';sharePhase=phase;}
  $('roomState').textContent = expired ? '部屋の有効期限が切れました。新しい部屋で集まり直してください。' : room.meta.state === 'closed' ? 'この部屋は終了しました。' : `${list.length}/6人参加 · 2人以上で開始`;
  const mode = room.meta.mode === 'oni' ? 'oni' : 'cards';
  $('modeText').innerHTML = mode === 'oni' ? '<span class="mi">👹</span><b>鬼ごっこ（ミニゲーム）</b>' : '<img class="mi mic" src="gold/mode-cards.webp" alt="" width="40" height="60"><b>カードゲーム</b>';
  $('modeSeg').hidden = !(host && active()); $('modeText').hidden = !$('modeSeg').hidden;
  $('modeCards').setAttribute('aria-pressed', String(mode === 'cards')); $('modeOni').setAttribute('aria-pressed', String(mode === 'oni'));
  $('ready').hidden = !active();
  $('ready').textContent = room.slots?.[slot]?.ready ? '✓ 準備OK · 取り消す' : '準備OKにする';
  $('ready').setAttribute('aria-pressed',String(!!room.slots?.[slot]?.ready));
  for (const id of ['players','startedPlayers']) {
    $(id).replaceChildren(...list.map(([key,p])=>{
      const li=document.createElement('li'),name=document.createElement('strong'),status=document.createElement('span');
      li.className=p.connected ? (p.ready ? 'player-ready' : '') : 'player-disconnected';
      name.textContent=`${avatars[Number(key)]} ${p.name}${p.uid === uid ? '（あなた）' : ''}`;
      status.textContent=`${p.uid === room.meta.hostUid ? 'ホスト · ' : ''}${p.connected ? (p.ready ? '✓ 準備OK' : '準備中') : '接続が切れています'}`;
      li.append(name,status);return li;
    }));
  }
  show(!expired && room.meta.state === 'started' ? 'started' : 'lobby');
  { const closed=room.meta.state==='closed'; $('installAsk').hidden=!closed || isStandalone() || installSnoozed();
    if(closed){const ios=/iPhone|iPad|iPod/.test(navigator.userAgent); $('installYes').hidden=ios&&!installPrompt; $('installIos').hidden=!(ios&&!installPrompt);} }
  if(room.meta.state==='started' && !tenStop && !expired){
    const ps=list.map(([slot,p])=>({...p,slot}));
    if(mode==='oni'){
      tenStop=attachOni({db,roomId,uid,players:ps,hostUid:room.meta.hostUid,message});
      if(isLocal)npcGame=attachOniBots({db,roomId,bots:ps.filter(p=>p.uid!==uid).map(p=>({uid:p.uid})),message});
    }else{
      tenStop=attachTen({db,roomId,uid,players:ps,hostUid:room.meta.hostUid,message});
      if(isLocal)npcGame=attachNpcs({db,roomId,npcs:ps.filter(p=>p.uid!==uid),players:ps,hostUid:room.meta.hostUid,message});
    }
  }
  controls();
}
async function watch(id, ownSlot) {
  await detach(); roomId=id;slot=String(ownSlot); const token=++generation;
  const link=new URL(homeUrl);link.searchParams.set('room',id);
  history.replaceState(null,'',link); $('shareUrl').value=link.href;
  QRCode.toCanvas($('qr'),link.href,{width:256,margin:2}, e=>{if(e) message('QR表示に失敗しました。招待リンクを使ってください。');});
  if(!isLocal)localStorage.setItem('nq-room-session',JSON.stringify({roomId:id,slot}));
  roomStop=onValue(ref(db,`rooms/${id}`),snap=>{if(token!==generation)return;room=snap.val(); render(); if(room?.meta){clearTimeout(expiryTimer);expiryTimer=setTimeout(render,Math.max(0,room.meta.expiresAt-Date.now())+50);}},e=>message(errorText(e)));
  connectionStop=onValue(ref(db,'.info/connected'),async snap=>{
    if (!snap.val() || token!==generation) return;
    try {
      const task=onDisconnect(ref(db,`rooms/${id}/slots/${ownSlot}/connected`));
      await task.set(false);
      if(token!==generation){await task.cancel();return;}
      disconnectTask=task;
      await set(ref(db,`rooms/${id}/slots/${ownSlot}/connected`),true);
    } catch(e){message(errorText(e));}
  });
}
async function detach() { tenStop?.();tenStop=null;npcGame?.stop();npcGame=null; ++generation;roomStop?.();connectionStop?.();roomStop=connectionStop=null;clearTimeout(expiryTimer);if(disconnectTask){disconnectTask.cancel().catch(()=>{});disconnectTask=null;} }
async function leave() {
  const previous=roomId, previousSlot=slot;
  await detach(); roomId=null;slot=null;room=null;
  history.replaceState(null,'',homeUrl);$('inviteJoin').hidden=true;$('create').hidden=false;$('npcLink').hidden=isLocal;$('inviteHead').hidden=true;$('lead').hidden=false;show('home');resumeOffer();
  // Keep the seat and recovery record. Returning home is a pause, including offline.
  if(previous && previousSlot!==null && connected)set(ref(db,`rooms/${previous}/slots/${previousSlot}/connected`),false).catch(()=>{});
}
async function resume(s=savedSession()) {
  if(!s)throw new Error('戻れる部屋がありません。');
  const previous=(await get(ref(db,`rooms/${s.roomId}`))).val();
  if(!previous?.meta || previous.meta.expiresAt<=Date.now() || previous.meta.state==='closed' || previous.slots?.[s.slot]?.uid!==uid){
    if(savedSession()?.roomId===s.roomId)localStorage.removeItem('nq-room-session');resumeOffer();
    throw new Error('前の部屋は終了・期限切れ、または参加情報がありません。新しい部屋で遊んでください。');
  }
  await watch(s.roomId,s.slot);
}
$('resume').onclick=()=>action(()=>resume());
$('homeLink').onclick=e=>{e.preventDefault();return action(leave);};
$('create').onclick=()=>{if(!$('name').value.trim()&&!(localStorage.getItem('nq-room-name')||'').trim()){editingName=true;syncName();needName();return;}return action(async()=>{
  if(savedSession() && !window.confirm('新しい部屋を作りますか？前の部屋への復帰ボタンは新しい部屋に切り替わります。'))return;
  const name=ownName(); const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
  const slots={0:{uid,name,ready:false,connected:true,joinedAt:serverTimestamp()}};
  if(isLocal)for(let i=1;i<=Number($('npcCount').value);i++)slots[i]={uid:'npc'+i,name:npcNames[i-1]+'（NPC）',ready:true,connected:true,joinedAt:serverTimestamp()};
  await set(ref(db,`rooms/${id}`),{meta:{hostUid:uid,state:'lobby',createdAt:serverTimestamp(),expiresAt:Date.now()+12*60*60*1000},slots});
  await watch(id,0);track('create',{uid,room:id,name});
});};
$('join').onclick=()=>{if(!$('name').value.trim()&&!(localStorage.getItem('nq-room-name')||'').trim()){editingName=true;syncName();needName();return;}return action(async()=>{
  const name=ownName();if(!validRoom(roomId))throw new Error('招待リンクが正しくありません。');
  const meta=(await get(ref(db,`rooms/${roomId}/meta`))).val();
  if(!meta || meta.state==='closed' || meta.expiresAt <= Date.now())throw new Error('部屋は終了済み、または期限切れです。');
  // Fixed slots + transactions prevent a seventh participant and double reservation.
  for(let i=0;i<6;i++){
    const snap=await get(ref(db,`rooms/${roomId}/slots/${i}`));
    if(snap.val()?.uid===uid){await watch(roomId,i);track('rejoin',{uid,room:roomId,name});return;}
  }
  if(meta.state!=='lobby')throw new Error('ゲームは開始済みです。参加済みの端末から戻ってください。');
  for(let i=1;i<6;i++){
    const result=await runTransaction(ref(db,`rooms/${roomId}/slots/${i}`),p=>p ? undefined : {uid,name,ready:false,connected:true,joinedAt:serverTimestamp()},{applyLocally:false});
    if(result.committed){await watch(roomId,i);track('join',{uid,room:roomId,name,slot:i});return;}
  }
  throw new Error('この部屋は6人で満員です。');
});};
$('modeCards').onclick=()=>action(()=>set(ref(db,`rooms/${roomId}/meta/mode`),'cards'));
$('modeOni').onclick=()=>action(()=>set(ref(db,`rooms/${roomId}/meta/mode`),'oni'));
$('ready').onclick=()=>action(()=>set(ref(db,`rooms/${roomId}/slots/${slot}/ready`),!room.slots[slot].ready));
$('start').onclick=()=>action(async()=>{await set(ref(db,`rooms/${roomId}/meta/state`),'started');track('start',{uid,room:roomId,game:room?.meta?.mode==='oni'?'oni':'cards',n:members().length,names:members().map(([,p])=>p.name).join('/')});});
$('closeGame').onclick=()=>{$('endAck').checked=false;$('endChoice').hidden=false;$('closeGame').hidden=true;controls();$('endCancel').focus();};
$('endAck').onchange=controls;
$('endCancel').onclick=()=>{$('endAck').checked=false;$('endChoice').hidden=true;$('closeGame').hidden=false;$('hostZone').open=false;controls();};
$('endPlain').onclick=()=>{if(!$('endAck').checked)return;return action(async()=>{await set(ref(db,`rooms/${roomId}/meta/state`),'closed');track('close',{uid,room:roomId});});};
$('endSettle').onclick=()=>{if(!$('endAck').checked)return;return action(async()=>{await set(ref(db,`sessions/${roomId}/fin`),true);$('endAck').checked=false;$('endChoice').hidden=true;$('closeGame').hidden=false;$('hostZone').open=false;message('最終精算を表示しました。ホストが画面の「これでゲームを終了する」を押すと終わります。');track('close_settle',{uid,room:roomId});});};
$('close').onclick=()=>action(async()=>{if(window.confirm('ゲームを終了しますか？全員の画面が終了になり、このゲームへは戻れません。')){await set(ref(db,`rooms/${roomId}/meta/state`),'closed');track('close',{uid,room:roomId});}});
// アプリ内ブラウザ（LINEなど）の注意喚起
{const ua=navigator.userAgent||'';if(/Line\/|FBAN|FBAV|FB_IAB|Instagram|MicroMessenger|KAKAOTALK|Twitter|Snapchat|TikTok|BytedanceWebview|musical_ly/i.test(ua)){$('inapp').hidden=false;$('inappCopy').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);message('リンクをコピーしました。SafariかChromeに貼り付けて開いてください。');}catch{message('リンクを長押ししてコピーしてください。');}};}}
$('leave').onclick=()=>action(leave);$('returnHome').onclick=()=>action(leave);
$('copy').onclick=()=>action(async()=>{try{await navigator.clipboard.writeText($('shareUrl').value);message('招待リンクをコピーしました。');}catch{$('shareUrl').select();message('招待リンクを長押ししてコピーしてください。');}});
let installPrompt;
function installSnoozed(){try{const o=JSON.parse(localStorage.getItem('nq-install-later')||'null');return !!o&&(o.n>=3||Date.now()-o.t<7*864e5);}catch{return false;}}
$('installLater').onclick=()=>{try{const o=JSON.parse(localStorage.getItem('nq-install-later')||'null')||{n:0};localStorage.setItem('nq-install-later',JSON.stringify({n:(o.n||0)+1,t:Date.now()}));}catch{}$('installAsk').hidden=true;};
function isStandalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
$('installYes').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;$('installAsk').hidden=true;}else{$('installYes').hidden=true;$('installIos').textContent='Android：Chromeの⋮ →「ホーム画面に追加」。iPhone：Safariの共有 →「ホーム画面に追加」。';$('installIos').hidden=false;}};
if(isStandalone())$('keep').hidden=true;
$('keep').onclick=async()=>{if(roomId){message('まず「NOMI QUESTのホーム」を開いてから追加してください。');$('keepHelp').hidden=false;return;}if(installPrompt){await installPrompt.prompt();installPrompt=null;}else $('keepHelp').hidden=!$('keepHelp').hidden;};

try {
  if (isLocal) {
    db=getDatabase();uid='me';connected=true;
    $('connection').textContent='練習モード';$('connection').dataset.ok='1';
    $('npcBox').hidden=false;$('npcLink').hidden=true;$('devLink').hidden=true;$('inviteJoin').hidden=true;
    $('lead').innerHTML='通信なしの練習モード。<br>NPCが自動で答えて進みます。';
    controls();
  } else {
  const app=initializeApp(firebaseConfig),auth=getAuth(app);db=getDatabase(app);
  await setPersistence(auth,browserLocalPersistence);const user=auth.currentUser || (await signInAnonymously(auth)).user;uid=user.uid;track('open',{uid,room:roomId||''});
  onValue(ref(db,'.info/connected'),snap=>{connected=!!snap.val();$('connection').textContent=connected?'接続OK':'再接続中';$('connection').dataset.ok=connected?'1':'0';controls();});
  resumeOffer();
  const saved=savedSession();
  // A plain home URL always opens home. Only an explicit room URL auto-recovers.
  if(saved && roomId===saved.roomId)await resume(saved);
  controls();
  }
}catch(e){$('connection').textContent='接続エラー';$('connection').dataset.ok='0';message(errorText(e));}

{const w=document.getElementById('wish');if(w&&logEnabled){
 w.hidden=false;
 const opts=['🔞 お色気・18禁ネタ','🧠 心理戦・読み合い','⚡ 早押し・反射神経','🗳️ 投票・暴露トーク','🎤 お題・モノマネ','🏃 ミニゲーム（鬼ごっこ系）','👑 王様・罰ゲーム系','🎲 運まかせ・ルーレット系'],chosen=new Set(),chips=document.getElementById('wishChips'),send=document.getElementById('wishSend'),txt=document.getElementById('wishText');
 const upd=()=>{send.disabled=!(chosen.size||txt.value.trim());};
 for(const o of opts){const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=o;b.setAttribute('aria-pressed','false');b.onclick=()=>{const on=!chosen.has(o);on?chosen.add(o):chosen.delete(o);b.setAttribute('aria-pressed',String(on));upd();};chips.append(b);}
 txt.addEventListener('input',upd);
 send.onclick=()=>{track('wish',{game:[...chosen].join(' / '),names:txt.value.trim(),name:$('name').value.trim()});send.disabled=true;document.getElementById('wishThanks').hidden=false;chosen.clear();txt.value='';for(const b of chips.children)b.setAttribute('aria-pressed','false');setTimeout(()=>{document.getElementById('wishThanks').hidden=true;upd();},6000);};
}}
{const n=document.getElementById('logNote');if(n&&logEnabled)n.hidden=false;}
{const a=document.getElementById('feedback');if(a&&/^https:\/\/(forms\.gle|docs\.google\.com\/forms)\//.test(FEEDBACK_URL)){a.href=FEEDBACK_URL;a.hidden=false;}}

// ---- ルール説明（招待画面の「ここ」と待合室のボタンから開く）----
{
 const slides=[
  ['遊び方','部屋に集まって、順番にカードを引きます。お題に挑戦して、負けた人は「ショットメーター」が1つたまります。実際に飲むかどうかは自己申告です。'],
  ['ショットメーターとライム','メーターは5目盛り。5つたまる（ライムが付く）と、その人は1杯が確定します。メーターが少ないうちは、まだセーフです。'],
  ['ドリンクタイムと休憩カード','8ターンごとに自動でドリンクタイム。結果発表 → お助けカード受付（1分）→ イッテキーラ！ ライムの人は全員1杯、いなければ一番メーターが多い人が1杯（同率は全員）。飲んだらメーターは0に戻ります。実際に飲んだイッテキーラが3杯、6杯…と増えると、次のクールに「休憩カード」（みんなの状態を確認するだけ）が1枚入ります。'],
  ['お助けカードと約束','10秒ジャスト（±0.5秒）やゲームに勝つと、お助けカードがもらえます。バリアなどは、お助けカード受付の1分間に使えます。無理せず、水も飲もう。20歳以上の方だけで楽しんでください。']
 ];
 let step=0,opener=null;
 const paint=()=>{$('rulesStep').textContent=String(step+1);const b=$('rulesBody');b.replaceChildren();const t=document.createElement('h3');t.textContent=slides[step][0];const p=document.createElement('p');p.textContent=slides[step][1];b.append(t,p);$('rulesPrev').disabled=step===0;$('rulesNext').textContent=step===slides.length-1?'とじる':'次へ →';};
 const open=(from)=>{opener=from;step=0;paint();$('rulesModal').hidden=false;$('rulesNext').focus();};
 const close=()=>{$('rulesModal').hidden=true;opener?.focus?.();};
 $('rulesLink').onclick=()=>open($('rulesLink'));
 $('rulesBtn').onclick=()=>open($('rulesBtn'));
 $('rulesPrev').onclick=()=>{if(step>0){step--;paint();}};
 $('rulesNext').onclick=()=>{if(step<slides.length-1){step++;paint();}else close();};
 $('rulesClose').onclick=close;
 $('rulesModal').addEventListener('click',e=>{if(e.target===$('rulesModal'))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('rulesModal').hidden)close();});
}
