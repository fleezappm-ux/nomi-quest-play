import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import { getAuth, signInAnonymously, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { getDatabase, ref, set, get, update, onValue, onDisconnect, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js';
import { firebaseConfig } from './firebase-config.js';
import QRCode from './vendor/qrcode.mjs';
import { attachTen } from './ten.js?v=0.4';

const $ = id => document.getElementById(id);
const homePage = new URL('./', location.href); homePage.searchParams.set('v','0.4');
const homeUrl = homePage.href;
const params = new URL(location.href).searchParams;
const validRoom = value => /^[a-f0-9]{32}$/.test(value || '');
let roomId = validRoom(params.get('room')) ? params.get('room') : null;
let uid, db, slot = null, room, connected = false, busy = false;
let roomStop, connectionStop, disconnectTask, expiryTimer;
let generation = 0;
let tenStop;
const avatars = ['🍻','🌙','⭐','🌈','🔥','🎲'];
$('homeLink').href = homeUrl;
$('inviteJoin').hidden = !roomId;
$('name').value = localStorage.getItem('nq-room-name') || '';

function message(text) { $('message').textContent = text; }
function errorText(error) {
  if (/permission|denied/i.test(error?.code || error?.message || '')) return '参加できませんでした。部屋の期限・状態、または通信設定を確認してください。';
  return error?.message || '通信に失敗しました。接続を確認して、もう一度お試しください。';
}
function show(id) { for (const section of ['home','lobby','started']) $(section).hidden = section !== id; }
function ownName() { const name = $('name').value.trim(); if (!name || name.length > 20) throw new Error('名前を1〜20文字で入力してください。'); localStorage.setItem('nq-room-name', name); return name; }
async function action(fn) { if (busy) return; busy = true; controls(); message(''); try { await fn(); } catch (e) { message(errorText(e)); } finally { busy = false; controls(); } }
function members() { return Object.entries(room?.slots || {}).sort((a,b)=>Number(a[0])-Number(b[0])); }
function active() { return room?.meta?.state === 'lobby' && room.meta.expiresAt > Date.now(); }
function controls() {
  $('create').disabled = !uid || !connected || busy;
  $('join').disabled = !uid || !connected || busy;
  $('ready').disabled = !connected || busy || !active();
  const list = members();
  $('start').disabled = !connected || busy || !active() || list.length < 2 || !list.every(([,p])=>p.ready && p.connected);
  for (const id of ['leave','close','returnHome']) $(id).disabled = busy || !connected;
}
function render() {
  if (!room?.meta) { message('この部屋は見つかりません。招待を確認してください。'); return; }
  const list = members(), host = room.meta.hostUid === uid;
  $('share').hidden = !host; $('start').hidden = !host; $('close').hidden = !host;
  const expired = room.meta.expiresAt <= Date.now();
  $('roomState').textContent = expired ? '部屋の有効期限が切れました。新しい部屋で集まり直してください。' : room.meta.state === 'closed' ? 'この部屋は終了しました。' : `${list.length}/6人参加 · 2人以上で開始`;
  $('ready').hidden = !active();
  $('ready').textContent = room.slots?.[slot]?.ready ? '準備OKを取り消す' : '準備OK';
  for (const id of ['players','startedPlayers']) {
    $(id).replaceChildren(...list.map(([key,p])=>{
      const li=document.createElement('li'),name=document.createElement('strong'),status=document.createElement('span');
      name.textContent=`${avatars[Number(key)]} ${p.name}${p.uid === uid ? '（あなた）' : ''}`;
      status.textContent=`${p.uid === room.meta.hostUid ? 'ホスト · ' : ''}${p.connected ? (p.ready ? '準備OK' : '準備中') : '接続が切れています'}`;
      li.append(name,status);return li;
    }));
  }
  show(!expired && room.meta.state === 'started' ? 'started' : 'lobby');
  if(room.meta.state==='started' && !tenStop && !expired){tenStop=attachTen({db,roomId,uid,players:list.map(([slot,p])=>({...p,slot})),hostUid:room.meta.hostUid,message});}
  controls();
}
async function watch(id, ownSlot) {
  await detach(); roomId=id;slot=String(ownSlot); const token=++generation;
  const link=new URL(homeUrl);link.searchParams.set('room',id);
  history.replaceState(null,'',link); $('shareUrl').value=link.href;
  QRCode.toCanvas($('qr'),link.href,{width:256,margin:2}, e=>{if(e) message('QR表示に失敗しました。招待リンクを使ってください。');});
  localStorage.setItem('nq-room-session',JSON.stringify({roomId:id,slot}));
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
async function detach() { tenStop?.();tenStop=null; ++generation;roomStop?.();connectionStop?.();roomStop=connectionStop=null;clearTimeout(expiryTimer);if(disconnectTask){await disconnectTask.cancel().catch(()=>{});disconnectTask=null;} }
async function leave() {
  if(slot!==null && roomId){const path=`rooms/${roomId}/slots/${slot}`; if(active() && slot!=='0')await set(ref(db,path),null);else await set(ref(db,path+'/connected'),false);}
  await detach();localStorage.removeItem('nq-room-session');roomId=null;slot=null;room=null;history.replaceState(null,'',homeUrl);$('inviteJoin').hidden=true;show('home');
}
$('create').onclick=()=>action(async()=>{
  const name=ownName(); const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
  await set(ref(db,`rooms/${id}`),{meta:{hostUid:uid,state:'lobby',createdAt:serverTimestamp(),expiresAt:Date.now()+12*60*60*1000},slots:{0:{uid,name,ready:false,connected:true,joinedAt:serverTimestamp()}}});
  await watch(id,0);
});
$('join').onclick=()=>action(async()=>{
  const name=ownName();if(!validRoom(roomId))throw new Error('招待リンクが正しくありません。');
  const meta=(await get(ref(db,`rooms/${roomId}/meta`))).val();
  if(!meta || meta.state!=='lobby' || meta.expiresAt <= Date.now())throw new Error('部屋は開始済み、終了済み、または期限切れです。');
  // Fixed slots + transactions prevent a seventh participant and double reservation.
  for(let i=0;i<6;i++){
    const snap=await get(ref(db,`rooms/${roomId}/slots/${i}`));
    if(snap.val()?.uid===uid){await watch(roomId,i);return;}
  }
  for(let i=1;i<6;i++){
    const result=await runTransaction(ref(db,`rooms/${roomId}/slots/${i}`),p=>p ? undefined : {uid,name,ready:false,connected:true,joinedAt:serverTimestamp()},{applyLocally:false});
    if(result.committed){await watch(roomId,i);return;}
  }
  throw new Error('この部屋は6人で満員です。');
});
$('ready').onclick=()=>action(()=>set(ref(db,`rooms/${roomId}/slots/${slot}/ready`),!room.slots[slot].ready));
$('start').onclick=()=>action(()=>set(ref(db,`rooms/${roomId}/meta/state`),'started'));
$('close').onclick=()=>action(()=>set(ref(db,`rooms/${roomId}/meta/state`),'closed'));
$('leave').onclick=()=>action(leave);$('returnHome').onclick=()=>action(leave);
$('copy').onclick=()=>action(async()=>{try{await navigator.clipboard.writeText($('shareUrl').value);message('招待リンクをコピーしました。');}catch{$('shareUrl').select();message('招待リンクを長押ししてコピーしてください。');}});
$('openInvite').onclick=()=>{try{const url=new URL($('invite').value);if(url.origin!==location.origin || url.pathname!==new URL(homeUrl).pathname || !validRoom(url.searchParams.get('room')))throw new Error();location.href=url.href;}catch{message('NOMI QUESTの招待リンクを貼り付けてください。');}};
let installPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
$('keep').onclick=async()=>{if(roomId){message('まず「NOMI QUESTのホーム」を開いてから追加してください。');$('keepHelp').hidden=false;return;}if(installPrompt){await installPrompt.prompt();installPrompt=null;}else $('keepHelp').hidden=!$('keepHelp').hidden;};

try {
  const app=initializeApp(firebaseConfig),auth=getAuth(app);db=getDatabase(app);
  await setPersistence(auth,browserLocalPersistence);const user=auth.currentUser || (await signInAnonymously(auth)).user;uid=user.uid;
  onValue(ref(db,'.info/connected'),snap=>{connected=!!snap.val();$('connection').textContent=connected?'接続できました':'接続が切れています · 再接続を待っています';controls();});
  let saved;try{saved=JSON.parse(localStorage.getItem('nq-room-session'));}catch{}
  if(validRoom(saved?.roomId) && (!roomId || roomId===saved.roomId) && /^[0-5]$/.test(String(saved.slot))){
    const snap=await get(ref(db,`rooms/${saved.roomId}/slots/${saved.slot}`));
    if(snap.val()?.uid===uid)await watch(saved.roomId,saved.slot);
  }
  controls();
}catch(e){$('connection').textContent='接続できませんでした';message(errorText(e));}
