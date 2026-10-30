import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
const LS=(()=>{const m={};let ok=true;try{localStorage.setItem('_t','1');localStorage.removeItem('_t');}catch{ok=false;}return{getItem:k=>{if(ok)try{return localStorage.getItem(k);}catch{}return k in m?m[k]:null;},setItem:(k,v)=>{m[k]=String(v);if(ok)try{localStorage.setItem(k,v);}catch{}},removeItem:k=>{delete m[k];if(ok)try{localStorage.removeItem(k);}catch{}}};})();
import { getAuth, signInAnonymously, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { isLocal, getDatabase, ref, set, get, update, onValue, onDisconnect, runTransaction, serverTimestamp } from './fb.js?v=pop0.70.0';
import { firebaseConfig } from './firebase-config.js';
import QRCode from './vendor/qrcode.mjs';
import { attachTen } from './ten.js?v=pop0.70.0';
import { attachNpcs, npcNames } from './npc.js?v=pop0.70.0';
import { FEEDBACK_URL } from './feedback-config.js?v=pop0.70.0';
import { attachOni, attachOniBots } from './oni.js?v=pop0.70.0';
import { track, logEnabled } from './telemetry.js?v=pop0.70.0';
import { ensureAdult } from './agegate.js?v=pop0.70.0';
import { AVATARS, avatarOf } from './avatars.js?v=pop0.70.0';
// 20歳以上の確認が済むまで、このあとの処理（部屋への参加など）は動かさない。
await ensureAdult();

const $ = id => document.getElementById(id);
const homePage = new URL('./', location.href); homePage.searchParams.set('v','pop0.70.0'); if (isLocal) homePage.searchParams.set('npc','1'); if (isLocal && new URL(location.href).searchParams.get('dev')==='1') homePage.searchParams.set('dev','1');
const homeUrl = homePage.href;
const params = new URL(location.href).searchParams;
const validRoom = value => /^[a-f0-9]{32}$/.test(value || '');
let roomId = !isLocal && validRoom(params.get('room')) ? params.get('room') : null;
let uid, db, slot = null, room, connected = false, busy = false;
let roomStop, connectionStop, disconnectTask, expiryTimer;
let generation = 0;
let tenStop, npcGame;
let sharePhase;
function savedSession() { if (isLocal) return null; try { const s=JSON.parse(LS.getItem('nq-room-session')); return validRoom(s?.roomId) && /^[0-5]$/.test(String(s.slot)) ? s : null; } catch { return null; } }
function resumeOffer() { $('resumeBox').hidden = !savedSession(); homeResumeSync(); }
// ホームの「前の部屋に戻る」：記録が残っているときだけ表示（押すと待合室タブと同じ復帰処理）
function homeResumeSync(){
 let b=document.getElementById('homeResume');
 const s=savedSession();
 if(!s){if(b)b.hidden=true;return;}
 if(!b){
  const gp=document.getElementById('goPlay');if(!gp)return;
  b=document.createElement('button');b.id='homeResume';b.type='button';b.className='nqh-button nqh-secondary';b.style.marginTop='10px';
  b.onclick=()=>{if($('resume').disabled)message('通信の準備中です。少し待ってからもう一度押してね。');else $('resume').click();};
  gp.insertAdjacentElement('afterend',b);
 }
 b.hidden=false;b.textContent='↩ 前の部屋に戻る';
}
const avatars = ['🍻','🌙','⭐','🌈','🔥','🎲'];
$('homeLink').href = homeUrl;
$('inviteJoin').hidden = !roomId;
// 招待リンク・QRから来た人には「参加」だけを見せる（部屋づくり・テストは出さない）
if(roomId&&!isLocal){$('create').hidden=true;$('npcLink').hidden=true;$('devLink').hidden=true;$('lead').hidden=true;}
function needName(){const e=$('name');e.classList.add('bad');$('nameErr').hidden=false;e.focus();e.scrollIntoView({block:'center',behavior:'smooth'});}
$('name').addEventListener('input',()=>{$('name').classList.remove('bad');$('nameErr').hidden=true;});
$('name').value = LS.getItem('nq-room-name') || '';
let editingName=false,pendingAct='create',rulesBack='hm-home';
// 0.66 採用ホームUI：画面は hm-home → hm-play → hm-name の順。部屋づくり・参加の処理は元のまま（#create / #join）を呼ぶ。
function hgo(id){document.querySelectorAll('#home-flow>.nqh-page').forEach(p=>p.hidden=p.id!==id);window.scrollTo(0,0);if(id==='hm-play')resumeOffer();}
function openName(act){pendingAct=act;$('name-title').textContent=isLocal?'1人で遊ぶ':act==='join'?'部屋に参加する':'部屋を作る';$('nameGo').textContent=isLocal?'この名前で始める':'この名前で進む';const inv=!!roomId&&!isLocal;$('nameRules').hidden=false;hgo('hm-name');}
let inviteAccepted=false;
function homeEnter(){if(isLocal)openName('create');else if(roomId){if(inviteAccepted)openName('join');else watchTaken();}else hgo('hm-home');}
function syncName(){}

// ---- アイコン選択（29種）。選ぶだけでは予約しない。参加確定の書き込みでサーバーが早い者順を決める ----
const AV_KEY='nq-avatar';
let chosenAvatar=(()=>{try{const v=LS.getItem(AV_KEY);return avatarOf(v)?v:null;}catch{return null;}})();
let takenIds=new Set(),takenStop=null,avManual=false;
function favs(){try{const a=JSON.parse(LS.getItem('nq-fav'));return Array.isArray(a)?[...new Set(a.filter(id=>avatarOf(id)))].slice(0,3):[];}catch{return [];}}
const pickers=[];
function freeAvatars(){return AVATARS.filter(a=>!takenIds.has(a.id));}
function paintPickers(){
  const fv=favs();
  if(!avManual&&fv.length){const t=fv.find(id=>!takenIds.has(id));if(t)chosenAvatar=t;}
  if(!chosenAvatar||takenIds.has(chosenAvatar)){const fr=freeAvatars();chosenAvatar=fv.find(id=>!takenIds.has(id))||(fr.length?fr[Math.floor(Math.random()*fr.length)].id:null)||null;}
  const cur=avatarOf(chosenAvatar);
  for(const k of pickers){
    if(cur){k.prev.src=cur.src;k.prev.alt=cur.label;k.status.textContent=cur.label+' を選択中';}
    k.btns.forEach((b,i)=>{const a=AVATARS[i],used=takenIds.has(a.id);b.disabled=used;b.setAttribute('aria-pressed',String(a.id===chosenAvatar));b.setAttribute('aria-label',a.label+(used?' 使用中':''));});
  }
}
function mountPicker(grid,prev,status){
  const k={prev,status,btns:[]};
  // 並びは 男性(1〜10)・女性(11〜20)・特殊(21〜29)。見出しは整理用で、どれを選んでもよい
  const GROUPS=[['男性',0,10],['女性',10,20],['特殊',20,AVATARS.length]],subs={};
  const sub=a=>{const i=AVATARS.indexOf(a),g=GROUPS.find(g=>i>=g[1]&&i<g[2]);if(!subs[g[0]]){const w=document.createElement('div');w.className='avatar-group';const h=document.createElement('h4');h.textContent=g[0];const sg=document.createElement('div');sg.className='avatar-sub';w.append(h,sg);grid.append(w);subs[g[0]]=sg;}return subs[g[0]];};
  { const t=document.createElement('p');t.className='avatar-title';t.textContent='アイコン（選ばなければランダム）';grid.closest('.avatar-picker').prepend(t); }
  AVATARS.forEach(a=>{const b=document.createElement('button');b.type='button';b.className='avatar-choice';const im=document.createElement('img');im.src=a.src;im.alt=a.label;im.loading='lazy';im.decoding='async';im.width=128;im.height=128;b.append(im);b.onclick=()=>{chosenAvatar=a.id;avManual=true;avMsg('');paintPickers();};sub(a).append(b);k.btns.push(b);});
  pickers.push(k);
}
mountPicker($('avGrid'),$('avPrev'),$('avStatus'));
paintPickers();
// 招待された人：この部屋で使用中のアイコンを見て、選べないようにする（読むだけ）
function watchTaken(){
  show('invite');
  if(takenStop||!db)return paintPickers();
  paintPickers();
}
function startTakenWatch(){
  if(takenStop||!db||!roomId||isLocal)return;
  takenStop=onValue(ref(db,`rooms/${roomId}/slots`),snap=>{const v=snap.val()||{};takenIds=new Set(Object.values(v).filter(p=>p&&p.uid!==uid).map(p=>p.avatar).filter(Boolean));paintPickers();},()=>{});
}
function stopTakenWatch(){takenStop?.();takenStop=null;takenIds=new Set();}
function saveAvatar(){try{LS.setItem(AV_KEY,chosenAvatar);}catch{}}
function avatarTakenNow(slots){return Object.values(slots||{}).some(p=>p&&p.uid!==uid&&p.avatar===chosenAvatar);}

$('goPlay').onclick=()=>openName('create');
// 練習モード(?npc=1)のホーム：ボタンの意味を分かりやすくし、開発者モードと通常版への入口を出す
if(isLocal){
 const dv=new URL(location.href).searchParams.get('dev')==='1',gp=$('goPlay');
 gp.innerHTML='練習をはじめる <span aria-hidden="true">→</span><small>1人用・通信なし'+(dv?'・🛠開発者モード':'')+'</small>';
 const bx=document.createElement('div');bx.className='nqh-two';bx.style.marginTop='10px';
 const mk=(t,h)=>{const x=document.createElement('a');x.className='nqh-button nqh-secondary';x.textContent=t;x.href=h;return x;};
 if(!dv)bx.append(mk('🛠 開発者モードで開く','?v=pop0.70.0&npc=1&dev=1'));
 bx.append(mk('通常のホームへ','?v=pop0.70.0'));
 gp.insertAdjacentElement('afterend',bx);
}
// 開発者モード：ホームのスイッチをオンにすると、「1人で遊ぶ」は必ず開発者モードで始まる
if(!isLocal){
 const DK='nq-dev',lk=$('npcLink'),tg=document.createElement('button');tg.type='button';tg.id='devToggle';tg.className='nqh-button nqh-secondary';tg.style.marginTop='10px';
 const paint=()=>{const on=LS.getItem(DK)==='1';tg.textContent=on?'🛠 開発者モード：オン':'🛠 開発者モード：オフ';tg.innerHTML=on?'🛠 開発者モード：オン<small style="display:block;font-weight:400;margin-top:3px">「1人で遊ぶ」から入ると、好きなゲーム・お題を選べます（部屋を作る場合は使えません）</small>':'🛠 開発者モード：オフ';tg.setAttribute('aria-pressed',on?'true':'false');if(lk){lk.href=on?'?v=pop0.70.0&npc=1&dev=1':'?npc=1';let sm=lk.querySelector('small');if(on){if(!sm){sm=document.createElement('small');lk.append(sm);}sm.textContent='🛠 開発者モードで始まります';}else sm?.remove();}};
 tg.onclick=()=>{try{LS.setItem(DK,LS.getItem(DK)==='1'?'0':'1');}catch{}paint();};
 paint();$('tell').parentElement.insertAdjacentElement('afterend',tg);
}
$('playBack').onclick=()=>hgo('hm-home');
$('goCreate').onclick=()=>openName('create');
$('goJoin').onclick=()=>{if(roomId)return openName('join');$('joinHelp').hidden=false;};
$('nameBack').onclick=()=>{if(isLocal){location.href=new URL('./',location.href).pathname;return;}if(roomId){inviteAccepted=false;show('home');return;}hgo('hm-home');};
$('goRules').onclick=()=>{rulesBack='hm-play';hgo('hm-rules');};
$('nameRules').onclick=()=>{rulesBack='hm-name';hgo('hm-rules');};
$('rulesBack').onclick=()=>hgo(rulesBack);
$('rulesOk').onclick=()=>{if(rulesBack==='hm-name')hgo('hm-name');else hgo('hm-home');};
$('nameGo').onclick=()=>{const v=$('name').value.trim();if(!v||[...v].length>10){needName();return;}if(!chosenAvatar){avMsg('アイコンを選んでください。');return;}LS.setItem('nq-room-name',v);const b=$(pendingAct==='join'?'join':'create');if(b.disabled){message('通信の準備中です。少し待ってからもう一度押してね。');return;}b.click();};
$('nqiJoin').onclick=()=>{inviteAccepted=true;show('home');};
$('nqiRules').onclick=()=>$('rulesBtn').click();
$('nqiShare').onclick=()=>$('tell').click();
$('nqiInstall').onclick=()=>$('keepTop').click();
$('nqiCopy').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('nqiCopyStatus').textContent='リンクをコピーしました。SafariかChromeに貼り付けて開いてください。';}catch{$('nqiCopyStatus').textContent='リンクを長押ししてコピーしてください。';}};
{const ua=navigator.userAgent||'';if(window.__nqInApp===undefined?/Line\/|\bLINE\b|Instagram|FBAN|FBAV|; wv\)/i.test(ua):window.__nqInApp===true){$('nqiBrowser').classList.add('warn');$('nqiBrowser').open=true;$('nqiBrowserTitle').textContent='⚠ アプリ内ブラウザで開いている可能性があります';$('nqiBrowserMsg').textContent='通信が途切れるのを避けるため、アプリのメニューからSafari・Chromeなどで開き直してね。';}}
$('qrOpen').onclick=()=>{$('lobbyMain').hidden=true;$('qrBig').hidden=false;window.scrollTo(0,0);};
const qrClose=()=>{$('qrBig').hidden=true;$('lobbyMain').hidden=false;};
$('qrBack').onclick=qrClose;
$('qrBig').onclick=e=>{if(e.target.closest('button,input'))return;qrClose();};
$('name').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('nameGo').click();}});
$('tell').onclick=()=>{const url=new URL('./',location.href);url.search='';$('friendUrl').value=url.href;$('friendMsg').textContent='';hgo('hm-friend');};
$('friendBack').onclick=()=>hgo('hm-home');
$('friendSend').onclick=async()=>{const url=$('friendUrl').value,msg=$('friendMsg');try{if(navigator.share){await navigator.share({title:'NOMI QUEST',text:'飲み会ゲーム「NOMI QUEST」で遊ぼう！',url});msg.textContent='';}else{await navigator.clipboard.writeText(url);msg.textContent='リンクをコピーしました。LINEなどに貼って教えてね。';}}catch(e){if(e?.name!=='AbortError'){$('friendUrl').select();msg.textContent='リンクを長押ししてコピーしてね';}}};
$('keepBack').onclick=()=>hgo('hm-home');
homeEnter();

function message(text) { $('message').textContent = text; }
function errorText(error) {
  if (/permission|denied/i.test(error?.code || error?.message || '')) return '参加できませんでした。部屋の期限・状態、または通信設定を確認してください。';
  return error?.message || '通信に失敗しました。接続を確認して、もう一度お試しください。';
}
function show(id) { if(id==='home')homeEnter(); const inv=id==='home'&&!!roomId&&!isLocal&&!inviteAccepted; for (const section of ['home','invite','lobby','started']) $(section).hidden = section !== (inv?'invite':id); document.body.classList.toggle('inviting',inv); document.body.classList.toggle('noTab',inv); document.body.classList.toggle('inGame',id==='started'); document.body.classList.toggle('onLobby',id==='lobby'); document.body.classList.toggle('onHome',id==='home'&&!inv); $('tabHome').classList.toggle('on',id!=='lobby'); $('tabLobby').classList.toggle('on',id==='lobby'); }
function ownName() { const name = $('name').value.trim() || (LS.getItem('nq-room-name')||'').trim(); if (!name || name.length > 20) throw new Error('名前を1〜20文字で入力してください。'); LS.setItem('nq-room-name', name); return name; }
const AV_TAKEN='そのアイコンは選ばれました。別のアイコンを選んでください。';
function avatarErr(t){const e=new Error(t);e.avatar=true;return e;}
function avMsg(t){for(const id of ['avErr']){$(id).textContent=t;$(id).hidden=!t;}}
function nqConfirm(msg){return new Promise(res=>{const w=document.createElement('div');w.className='nqConfirm';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');const c=document.createElement('div');c.className='nqConfirmBox';const p=document.createElement('p');p.textContent=msg;const ok=document.createElement('button');ok.type='button';ok.className='ok';ok.textContent='はい';const no=document.createElement('button');no.type='button';no.className='no';no.textContent='やめる';const done=v=>{w.remove();res(v);};ok.onclick=()=>done(true);no.onclick=()=>done(false);c.append(p,ok,no);w.append(c);document.body.append(w);ok.focus();});}
async function action(fn) { if (busy) return; busy = true; controls(); message(''); avMsg(''); try { await fn(); } catch (e) { if(e?.avatar){avMsg(e.message);}else message(errorText(e)); } finally { busy = false; controls(); } }
function members() { return Object.entries(room?.slots || {}).sort((a,b)=>Number(a[0])-Number(b[0])); }
function active() { return room?.meta?.state === 'lobby' && room.meta.expiresAt > Date.now(); }
function controls() {
  $('create').disabled = !uid || !connected || busy;
  $('resume').disabled = !uid || !connected || busy;
  $('join').disabled = !uid || !connected || busy;
  $('nameGo').disabled = busy;
  $('ready').disabled = !connected || busy || !active();
  const list = members();
  $('start').disabled = !connected || busy || !active(); $('start').classList.toggle('dim', list.length < 2 || !list.every(([,p])=>p.ready && p.connected));
  for (const id of ['leave','returnHome','closeGame']) $(id).disabled = busy;
  for (const id of ['modeCards','modeOni']) $(id).disabled = busy || !modeEditable;
  for (const b of document.querySelectorAll('.lenb')) b.disabled = busy || !modeEditable;
  for(const id of ['endPlain','endSettle']) $(id).disabled=busy||!connected||!$('endAck').checked;
  $('close').disabled = busy || !connected;
}
let modeEditable=false,avatarRulesOk=true;
function tag(text,me){const t=document.createElement('span');t.className='role-tag'+(me?' me':'');t.textContent=text;return t;}
// 待合室の名簿：自分が最上段、次にホスト、残りは入室順。自分がホストなら1回だけ。
function paintRoster(list,host){
  const hostUid=room.meta.hostUid;
  const ord=[...list].sort((x,y)=>{const r=p=>p[1].uid===uid?0:p[1].uid===hostUid?1:2;return r(x)-r(y)||Number(x[0])-Number(y[0]);});
  $('players').replaceChildren(...ord.map(([key,p])=>{
    const li=document.createElement('li');li.className='roster-row'+(p.connected?'':' off');
    const av=document.createElement('span');av.className='roster-avatar';
    const a=avatarOf(p.avatar);
    if(a){const im=document.createElement('img');im.src=a.src;im.dataset.av=a.id;im.alt=a.label;im.width=128;im.height=128;im.decoding='async';av.append(im);}else av.textContent=avatars[Number(key)]||'☾';
    const idn=document.createElement('div');idn.className='roster-identity';
    const n=document.createElement('span');n.className='roster-name';n.textContent=String(p.uid).startsWith('npc')?String(p.name).replace(/（NPC）$/,''):p.name;idn.append(n);
    if(p.uid===uid)idn.append(tag('あなた',true));
    if(p.uid===hostUid)idn.append(tag('ホスト'));
    if(String(p.uid).startsWith('npc'))idn.append(tag('NPC'));
    const st=document.createElement('span');const ok=p.connected&&p.ready;st.className='roster-state'+(ok?' ok':'');
    st.textContent=!p.connected?'接続切れ':p.ready?'✓ 準備OK':'準備中';
    li.append(av,idn,st);return li;
  }));
}
function render() {
  if (!room?.meta) { message('この部屋は見つかりません。招待を確認してください。'); return; }
  const list = members(), host = room.meta.hostUid === uid;
  $('start').hidden = !host; $('close').hidden = !host; $('hostZone').hidden = !(host && room.meta.state==='started');
  $('tabHost').hidden = !(host && room.meta.state==='started');
  globalThis.__nqConn=Object.fromEntries(list.map(([,p])=>[p.uid,!!p.connected]));document.dispatchEvent(new CustomEvent('nq-conn'));
  const expired = room.meta.expiresAt <= Date.now();
  $('inviteCard').hidden = isLocal || expired || room.meta.state==='closed';
  $('countText').textContent = `${list.length}/6人参加`;
  $('roomState').textContent = expired ? '部屋の有効期限が切れました。新しい部屋で集まり直してください。' : room.meta.state === 'closed' ? 'この部屋は終了しました。' : '';
  const mode = room.meta.mode === 'oni' ? 'oni' : 'cards';
  modeEditable = host && active();
  $('modeCards').setAttribute('aria-pressed', String(mode === 'cards')); $('modeOni').setAttribute('aria-pressed', String(mode === 'oni'));
  {const len=Number(room.meta.endTurns)||0;for(const b of document.querySelectorAll('.lenb'))b.setAttribute('aria-pressed',String(Number(b.dataset.len)===len));$('lenBox').hidden=mode!=='cards'||(!host&&!len);$('lenNote').textContent=len?`${len}ターン遊んだら、ドリンクタイムのあと最終精算で終わります。`:'ホストが終わらせるまで続きます。';if(!host)$('lenSeg').hidden=true;}
  $('ready').hidden = !active();
  const myReady = !!room.slots?.[slot]?.ready;
  $('readyLabel').hidden = !myReady;
  $('ready').setAttribute('aria-label', myReady ? '準備OKを取り消す' : '準備OKにする');
  $('ready').setAttribute('aria-pressed',String(myReady));
  $('guestWait').hidden = host || !active();
  paintRoster(list, host);
  $('startedPlayers').replaceChildren(...list.map(([key,p])=>{
    const li=document.createElement('li'),name=document.createElement('strong'),status=document.createElement('span');
    li.className=p.connected ? (p.ready ? 'player-ready' : '') : 'player-disconnected';
    name.textContent=`${avatars[Number(key)]} ${p.name}${p.uid === uid ? '（あなた）' : ''}`;
    status.textContent=`${p.uid === room.meta.hostUid ? 'ホスト · ' : ''}${p.connected ? (p.ready ? '✓ 準備OK' : '準備中') : '接続が切れています'}`;
    li.append(name,status);return li;
  }));
  show(!expired && room.meta.state === 'started' ? 'started' : 'lobby');
  if(!expired&&room.meta.state==='started'&&LS.getItem('nq-stats-last')!==roomId){LS.setItem('nq-stats-last',roomId);bump('games');}
  { const closed=room.meta.state==='closed'; $('installAsk').hidden=!closed || isStandalone() || installSnoozed();
    if(closed){const ios=/iPhone|iPad|iPod/.test(navigator.userAgent); $('installYes').hidden=ios&&!installPrompt; $('installIos').hidden=!(ios&&!installPrompt);} }
  if(room.meta.state==='started' && !tenStop && !expired){
    const ps=list.map(([slot,p])=>({...p,slot}));
    if(mode==='oni'){
      tenStop=attachOni({db,roomId,uid,players:ps,hostUid:room.meta.hostUid,message});
      if(isLocal)npcGame=attachOniBots({db,roomId,bots:ps.filter(p=>p.uid!==uid).map(p=>({uid:p.uid})),message});
    }else{
      tenStop=attachTen({db,roomId,uid,players:ps,hostUid:room.meta.hostUid,message,endTurns:Number(room.meta.endTurns)||0});
      if(isLocal)npcGame=attachNpcs({db,roomId,npcs:ps.filter(p=>p.uid!==uid),players:ps,hostUid:room.meta.hostUid,message});
    }
  }
  controls();
}
async function watch(id, ownSlot) {
  await detach(); roomId=id;slot=String(ownSlot); const token=++generation;
  const link=new URL(homeUrl);link.searchParams.set('room',id);
  history.replaceState(null,'',link); $('shareUrl').value=link.href;
  stopTakenWatch();
  QRCode.toCanvas($('qr'),link.href,{width:300,margin:2}, e=>{if(e) message('QR表示に失敗しました。招待リンクを使ってください。');});
  QRCode.toCanvas($('qrBigCanvas'),link.href,{width:600,margin:2}, ()=>{});
  if(!isLocal)LS.setItem('nq-room-session',JSON.stringify({roomId:id,slot}));
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
/* ===== マイページ：好きなアイコン（3つまで） ===== */
let favArr=[null,null,null],favActive=0;
function favLoad(){const f=favs();favArr=[f[0]||null,f[1]||null,f[2]||null];favActive=Math.max(0,favArr.indexOf(null));if(favArr.every(Boolean))favActive=0;}
function favSave(){try{LS.setItem('nq-fav',JSON.stringify(favArr.filter(Boolean)));}catch{}paintPickers();}
const favGrid=$('favGrid'),favBtns=[],favSlotBtns=[...document.querySelectorAll('#favSlots .favSlot')];
(()=>{const G=[['男性',0,10],['女性',10,20],['特殊',20,AVATARS.length]];for(const [n,a0,a1] of G){const w=document.createElement('div');w.className='avatar-group';const h=document.createElement('h4');h.textContent=n;const sg=document.createElement('div');sg.className='avatar-sub';w.append(h,sg);favGrid.append(w);for(let i=a0;i<a1;i++){const a=AVATARS[i],b=document.createElement('button');b.type='button';b.className='avatar-choice';const im=document.createElement('img');im.src=a.src;im.alt=a.label;im.loading='lazy';im.decoding='async';im.width=128;im.height=128;b.append(im);b.onclick=()=>{const j=favArr.indexOf(a.id);if(j>=0)favArr[j]=null;favArr[favActive]=a.id;const nx=favArr.findIndex(x=>!x);if(nx>=0)favActive=nx;favPaint();favSave();};sg.append(b);favBtns.push(b);}}})();
function favPaint(){
  favSlotBtns.forEach((b,i)=>{const id=favArr[i],a=avatarOf(id);b.classList.toggle('active',i===favActive);b.classList.toggle('filled',!!a);b.innerHTML='';const n=document.createElement('span');n.className='favNo';n.textContent=['①','②','③'][i];b.append(n);if(a){const im=document.createElement('img');im.src=a.src;im.alt=a.label;b.append(im);b.setAttribute('aria-label',`第${i+1}候補 ${a.label}（もう一度押すと外します）`);}else{const p=document.createElement('span');p.className='favPlus';p.textContent='＋';b.append(p);b.setAttribute('aria-label',`第${i+1}候補 未設定`);}});
  favBtns.forEach((b,i)=>{const j=favArr.indexOf(AVATARS[i].id);b.setAttribute('aria-pressed',String(j>=0));b.dataset.fav=j>=0?['①','②','③'][j]:'';});
}

function favOpen(o){$('favPanel').hidden=!o;$('favToggle').setAttribute('aria-expanded',String(o));$('favToggle').textContent=o?'とじる ▲':'好きなアイコンを選ぶ ▼';$('favToggle').hidden=false;if(o)$('favPanel').scrollIntoView({block:'nearest',behavior:'smooth'});}
$('favToggle').onclick=()=>favOpen($('favPanel').hidden);
$('favDone').onclick=()=>{favOpen(false);$('favToggle').scrollIntoView({block:'nearest'});};
favSlotBtns.forEach((b,i)=>b.onclick=()=>{if($('favPanel').hidden){favActive=i;favPaint();favOpen(true);return;}if(favActive===i&&favArr[i]){favArr[i]=null;favPaint();favSave();}else{favActive=i;favPaint();}});

/* ===== 下のメニューバー（ホーム／待合室／マイページ／投書箱） ===== */
function stats(){try{return JSON.parse(LS.getItem('nq-stats'))||{};}catch{return {};}}
function bump(k){const s=stats();s[k]=(s[k]||0)+1;LS.setItem('nq-stats',JSON.stringify(s));}
$('tabHome').onclick=()=>{if(roomId&&slot!==null){action(leave);}else{show('home');hgo('hm-home');}};
$('tabLobby').onclick=()=>{if(roomId&&slot!==null){show('lobby');}else if(savedSession()){if($('resume').disabled)message('通信の準備中です。少し待ってからもう一度押してね。');else $('resume').click();}else{show('home');openName('create');}};
const sheet=(id,open)=>{$(id).hidden=!open;};
$('tabMy').onclick=()=>{const s=stats();$('myGames').textContent=s.games||0;$('myRooms').textContent=s.rooms||0;$('myName').value=(LS.getItem('nq-room-name')||'').trim();const a=avatarOf(chosenAvatar);$('myAv').src=a?a.src:'gold/card-back-nomi-quest.webp';$('mySaved').hidden=true;favLoad();favPaint();favOpen(false);sheet('mySheet',true);};
$('mySave').onclick=()=>{const v=$('myName').value.trim();if(!v||[...v].length>10){$('myName').focus();return;}LS.setItem('nq-room-name',v);$('name').value=v;$('mySaved').hidden=false;};
// 拡大表示は大きい版（gold/avatars-zoom）を、タップしたときだけ読み込む。無い／読めないときは小さい画像のまま出す。
const zoomPath=id=>'gold/avatars-zoom/'+id+'.webp';
function zoomAv(id,small){const small0=small;if(!id&&!small0)return;const z=$('avZoom'),im=$('avZoomImg');im.onerror=()=>{im.onerror=null;if(small0)im.src=small0;};im.src=id?zoomPath(id):small0;z.hidden=false;}
$('avZoom').addEventListener('click',()=>{$('avZoom').hidden=true;});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('avZoom').hidden=true;});
$('players').addEventListener('click',e=>{const im=e.target.closest('.roster-avatar img');if(im)zoomAv(im.dataset.av,im.src);});
$('myAv').addEventListener('click',()=>zoomAv(chosenAvatar,$('myAv').src));
// ゲーム中の下のバー：メンバー・部屋の操作／お助けカード
let gMoved=null;
function gClose(){if(gMoved){$('started').append(...gMoved);gMoved=null;}$('gameSheet').hidden=true;$('gameBody').replaceChildren();}
$('tabMembers').onclick=()=>{$('gameTitle').textContent='メンバーステータス';const body=document.createElement('div');const d={body,handled:false};$('gameBody').replaceChildren(body);document.dispatchEvent(new CustomEvent('nq-members',{detail:d}));if(!d.handled){const ul=document.createElement('ul');ul.className='memfb';for(const [,p] of members()){const li=document.createElement('li');const im=document.createElement('img');const a=avatarOf(p.avatar);if(a)im.src=a.src;im.className='memImg';li.append(im,document.createTextNode(p.name||''));ul.append(li);}body.append(ul);}gMoved=null;$('gameSheet').hidden=false;};
$('tabHost').onclick=()=>{$('gameTitle').textContent='ホスト設定';const hz=$('hostZone');hz.open=true;gMoved=[hz];$('gameBody').replaceChildren(hz);$('gameSheet').hidden=false;};
document.addEventListener('nq-zoom',e=>{const id=e.detail?.id;if(id)zoomAv(id,null);});
$('tabHelp').onclick=()=>{$('gameTitle').textContent='お助けカード';const body=$('gameBody'),d={body,handled:false};body.replaceChildren();document.dispatchEvent(new CustomEvent('nq-help',{detail:d}));if(!d.handled){const p=document.createElement('p');p.className='myNote';p.textContent='このゲームでは、お助けカードは使いません。';body.append(p);}$('gameSheet').hidden=false;};
$('gameClose').onclick=gClose;$('gameSheet').addEventListener('click',e=>{if(e.target===$('gameSheet'))gClose();});
$('myClose').onclick=()=>sheet('mySheet',false);
$('tabRules').onclick=()=>$('rulesBtn').click();
$('tabBox').onclick=()=>{$('boxThanks').hidden=true;$('boxOff').hidden=logEnabled;sheet('boxSheet',true);};
$('boxText').oninput=()=>{$('boxSend').disabled=!$('boxText').value.trim();};
$('boxSend').onclick=()=>{const t=$('boxText').value.trim();if(!t)return;track('wish',{game:'【投書箱】',names:t.slice(0,200),name:(LS.getItem('nq-room-name')||'').trim()});$('boxText').value='';$('boxSend').disabled=true;$('boxThanks').hidden=false;};
$('boxClose').onclick=()=>sheet('boxSheet',false);
for(const id of ['mySheet','boxSheet'])$(id).addEventListener('click',e=>{if(e.target===$(id))sheet(id,false);});

async function leave() {
  const previous=roomId, previousSlot=slot;
  await detach(); roomId=null;slot=null;room=null;
  inviteAccepted=false;history.replaceState(null,'',homeUrl);$('inviteJoin').hidden=true;$('create').hidden=false;$('npcLink').hidden=isLocal;$('inviteHead').hidden=true;$('lead').hidden=false;show('home');resumeOffer();
  // Keep the seat and recovery record. Returning home is a pause, including offline.
  if(previous && previousSlot!==null && connected)set(ref(db,`rooms/${previous}/slots/${previousSlot}/connected`),false).catch(()=>{});
}
async function resume(s=savedSession()) {
  if(!s)throw new Error('戻れる部屋がありません。');
  const previous=(await get(ref(db,`rooms/${s.roomId}`))).val();
  if(!previous?.meta || previous.meta.expiresAt<=Date.now() || previous.meta.state==='closed' || previous.slots?.[s.slot]?.uid!==uid){
    if(savedSession()?.roomId===s.roomId)LS.removeItem('nq-room-session');resumeOffer();
    throw new Error('前の部屋は終了・期限切れ、または参加情報がありません。新しい部屋で遊んでください。');
  }
  await watch(s.roomId,s.slot);
}
$('resume').onclick=()=>action(()=>resume());
$('homeLink').onclick=e=>{e.preventDefault();return action(leave);};
$('create').onclick=()=>{if(!$('name').value.trim()&&!(LS.getItem('nq-room-name')||'').trim()){editingName=true;syncName();needName();return;}return action(async()=>{
  if(savedSession() && !(await nqConfirm('新しい部屋を作りますか？前の部屋への復帰ボタンは新しい部屋に切り替わります。')))return;
  const name=ownName(); const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
  if(!chosenAvatar)throw avatarErr('アイコンを選んでください。');
  const slots={0:{uid,name,avatar:chosenAvatar,ready:false,connected:true,joinedAt:serverTimestamp()}};
  if(isLocal){const pool=AVATARS.filter(a=>a.id!==chosenAvatar);for(let i=1;i<=Number($('npcCount').value);i++)slots[i]={uid:'npc'+i,name:npcNames[i-1]+'（NPC）',avatar:pool[(i*7)%pool.length].id,ready:true,connected:true,joinedAt:serverTimestamp()};}
  const body=sl=>({meta:{hostUid:uid,state:'lobby',createdAt:serverTimestamp(),expiresAt:Date.now()+12*60*60*1000},slots:sl});
  try{await set(ref(db,`rooms/${id}`),body(slots));}
  catch(e){ // アイコン用のルールがまだ公開されていないとき：アイコン抜きで部屋を作る（遊べる／アイコンは表示されない）
    if(!/permission|denied/i.test(e?.code||e?.message||''))throw e;
    for(const k of Object.keys(slots))delete slots[k].avatar;
    await set(ref(db,`rooms/${id}`),body(slots));}
  saveAvatar();bump('rooms');await watch(id,0);track('create',{uid,room:id,name});
});};
$('join').onclick=()=>{if(!$('name').value.trim()&&!(LS.getItem('nq-room-name')||'').trim()){editingName=true;syncName();needName();return;}return action(async()=>{
  const name=ownName();if(!validRoom(roomId))throw new Error('招待リンクが正しくありません。');
  const meta=(await get(ref(db,`rooms/${roomId}/meta`))).val();
  if(!meta || meta.state==='closed' || meta.expiresAt <= Date.now())throw new Error('部屋は終了済み、または期限切れです。');
  // Fixed slots + transactions prevent a seventh participant and double reservation.
  for(let i=0;i<6;i++){
    const snap=await get(ref(db,`rooms/${roomId}/slots/${i}`));
    if(snap.val()?.uid===uid){await watch(roomId,i);track('rejoin',{uid,room:roomId,name});return;}
  }
  if(meta.state!=='lobby')throw new Error('ゲームは開始済みです。参加済みの端末から戻ってください。');
  if(!chosenAvatar)throw avatarErr('アイコンを選んでください。');
  { const now=(await get(ref(db,`rooms/${roomId}/slots`))).val()||{}; takenIds=new Set(Object.values(now).filter(p=>p&&p.uid!==uid).map(p=>p.avatar).filter(Boolean)); if(takenIds.has(chosenAvatar)){paintPickers();throw avatarErr(AV_TAKEN);} }
  for(let i=1;i<6;i++){
    let result,withAvatar=avatarRulesOk;
    const attempt=()=>runTransaction(ref(db,`rooms/${roomId}/slots/${i}`),p=>p ? undefined : {uid,name,...(withAvatar?{avatar:chosenAvatar}:{}),ready:false,connected:true,joinedAt:serverTimestamp()},{applyLocally:false});
    try{result=await attempt();}
    catch(e){ // 同時に同じアイコンを取った場合、サーバーのルールが後の1人を断る
      if(/permission|denied/i.test(e?.code||e?.message||'')){const now=(await get(ref(db,`rooms/${roomId}/slots`))).val()||{};takenIds=new Set(Object.values(now).filter(p=>p&&p.uid!==uid).map(p=>p.avatar).filter(Boolean));if(takenIds.has(chosenAvatar)){paintPickers();throw avatarErr(AV_TAKEN);}
        // 取られていないのに断られた＝アイコン用ルールが未公開。アイコン抜きで参加する
        if(withAvatar){avatarRulesOk=false;withAvatar=false;result=await attempt();}else throw e;}
      else throw e;}
    if(result.committed){saveAvatar();bump('rooms');await watch(roomId,i);track('join',{uid,room:roomId,name,slot:i});return;}
  }
  throw new Error('この部屋は6人で満員です。');
});};
$('modeCards').onclick=()=>action(()=>set(ref(db,`rooms/${roomId}/meta/mode`),'cards'));
for(const b of document.querySelectorAll('.lenb'))b.onclick=()=>{if(room?.meta?.hostUid!==uid)return;const n=Number(b.dataset.len);return action(()=>set(ref(db,`rooms/${roomId}/meta/endTurns`),n||null));};
$('modeOni').onclick=()=>action(()=>set(ref(db,`rooms/${roomId}/meta/mode`),'oni'));
$('ready').onclick=()=>action(()=>set(ref(db,`rooms/${roomId}/slots/${slot}/ready`),!room.slots[slot].ready));
let warnTimer=null;
function startWarn(t){const h=$('startHint');h.textContent=t;h.hidden=false;clearTimeout(warnTimer);warnTimer=setTimeout(()=>{h.hidden=true;},4500);}
$('start').onclick=()=>{if(room?.meta?.hostUid!==uid)return;const l=members();if(l.length<2){startWarn('2人以上で開始してください。');return;}if(!l.every(([,p])=>p.ready&&p.connected)){startWarn('全員が準備OKになってから開始してください。');return;}$('startHint').hidden=true;return action(async()=>{await set(ref(db,`rooms/${roomId}/meta/state`),'started');track('start',{uid,room:roomId,game:room?.meta?.mode==='oni'?'oni':'cards',n:members().length,names:members().map(([,p])=>p.name).join('/')});});};
$('closeGame').onclick=()=>{$('endAck').checked=false;$('endChoice').hidden=false;$('closeGame').hidden=true;controls();$('endCancel').focus();};
$('endAck').onchange=controls;
$('endCancel').onclick=()=>{$('endAck').checked=false;$('endChoice').hidden=true;$('closeGame').hidden=false;$('hostZone').open=false;controls();};
$('endPlain').onclick=()=>{if(!$('endAck').checked)return;return action(async()=>{await set(ref(db,`rooms/${roomId}/meta/state`),'closed');track('close',{uid,room:roomId});});};
$('endSettle').onclick=()=>{if(!$('endAck').checked)return;return action(async()=>{await set(ref(db,`sessions/${roomId}/fin`),true);$('endAck').checked=false;$('endChoice').hidden=true;$('closeGame').hidden=false;$('hostZone').open=false;message('最終精算を表示しました。ホストが画面の「これでゲームを終了する」を押すと終わります。');track('close_settle',{uid,room:roomId});});};
$('close').onclick=()=>action(async()=>{if(await nqConfirm('ゲームを終了しますか？全員の画面が終了になり、このゲームへは戻れません。')){await set(ref(db,`rooms/${roomId}/meta/state`),'closed');track('close',{uid,room:roomId});}});
// アプリ内ブラウザ（LINEなど）の注意喚起
{const ua=navigator.userAgent||'';if(/Line\/|FBAN|FBAV|FB_IAB|Instagram|MicroMessenger|KAKAOTALK|Twitter|Snapchat|TikTok|BytedanceWebview|musical_ly/i.test(ua)){$('inapp').hidden=false;$('inappCopy').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);message('リンクをコピーしました。SafariかChromeに貼り付けて開いてください。');}catch{message('リンクを長押ししてコピーしてください。');}};}}
$('leave').onclick=()=>action(leave);$('returnHome').onclick=()=>action(leave);
$('copy').onclick=()=>action(async()=>{try{await navigator.clipboard.writeText($('shareUrl').value);message('招待リンクをコピーしました。');}catch{$('shareUrl').select();message('招待リンクを長押ししてコピーしてください。');}});
let installPrompt;
function installSnoozed(){try{const o=JSON.parse(LS.getItem('nq-install-later')||'null');return !!o&&(o.n>=3||Date.now()-o.t<7*864e5);}catch{return false;}}
$('installLater').onclick=()=>{try{const o=JSON.parse(LS.getItem('nq-install-later')||'null')||{n:0};LS.setItem('nq-install-later',JSON.stringify({n:(o.n||0)+1,t:Date.now()}));}catch{}$('installAsk').hidden=true;};
function isStandalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
$('installYes').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;$('installAsk').hidden=true;}else{$('installYes').hidden=true;$('installIos').textContent='Android：Chromeの⋮ →「ホーム画面に追加」。iPhone：Safariの共有 →「ホーム画面に追加」。';$('installIos').hidden=false;}};
if(isStandalone()){$('keep').hidden=true;$('keepTop').hidden=true;}
const keepGo=async()=>{if(roomId){message('まず「NOMI QUESTのホーム」を開いてから追加してください。');$('keepHelp').hidden=false;return;}if(installPrompt){await installPrompt.prompt();installPrompt=null;}else $('keepHelp').hidden=!$('keepHelp').hidden;};
$('keep').onclick=keepGo;$('keepTop').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;return;}hgo('hm-keep');};

try {
  if (isLocal) {
    db=getDatabase();uid='me';connected=true;
    paintPickers();
  $('connection').textContent='練習モード';$('connection').dataset.ok='1';
    $('npcBox').hidden=false;$('npcLink').hidden=true;$('devLink').hidden=true;$('inviteJoin').hidden=true;
    { // 練習モードの待合室：開発者モードの入口／状態を、はっきり見せる
      const dvOn=new URL(location.href).searchParams.get('dev')==='1',nb=document.createElement('div');
      nb.className='devNote';nb.style.cssText='margin:10px 24px 0;padding:10px 12px;border:1.5px dashed #f2c14e;border-radius:14px;color:#ffe9a3;font-size:13px;text-align:center';
      if(dvOn)nb.textContent='🛠 開発者モード中：スタートすると、画面の右下に🛠が出ます。押すと好きなゲームを選べます。';
      else{const l=document.createElement('a');l.href='?v=pop0.70.0&npc=1&dev=1';l.textContent='🛠 開発者モードで始め直す（好きなゲームを選べる）';l.style.cssText='color:#ffe9a3;font-weight:800';nb.append(l);}
      $('lenBox').insertAdjacentElement('afterend',nb);
    }
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
  if(roomId&&slot===null)startTakenWatch();
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
  ['ドリンクタイムと休憩カード','8ターンごとに自動でドリンクタイム。結果発表 → 全員が「結果を確認した」→ お助けカード受付（30秒）→ イッテキーラ！ ライムの人は全員1杯、いなければ一番メーターが多い人が1杯（同率は全員）。飲んだらメーターは0に戻ります。実際に飲んだイッテキーラが3杯、6杯…と増えると、次のクールに「休憩カード」（みんなの状態を確認するだけ）が1枚入ります。'],
  ['お助けカードと約束','10秒ジャスト（±0.1秒）やゲームに勝つと、お助けカードがもらえます。バリアとなすりつけは、お助けカード受付の30秒間に使えます。身代わりは、最終結果が出てからの10秒間に使えます。無理せず、水も飲もう。20歳以上の方だけで楽しんでください。']
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
