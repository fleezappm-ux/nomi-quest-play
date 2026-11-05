// 利用ログ（匿名の端末番号＋ニックネーム）をスプレッドシートへ送る。
// LOG_URL が空なら何もしない。送信に失敗してもゲームには一切影響しない。
import { LOG_URL } from './log-config.js';
const VER = '0.70';
function did() {
  try {
    let d = localStorage.getItem('nq-did');
    if (!d) { d = Array.from(crypto.getRandomValues(new Uint8Array(6)), n => n.toString(16).padStart(2, '0')).join(''); localStorage.setItem('nq-did', d); }
    return d;
  } catch { return 'nostore'; }
}
export const logEnabled = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(LOG_URL);

// ---- 印その1：この端末の使われ方（練習・開発・テスター）。あとで本物の利用と分けやすくする ----
// 練習＝?npc=1／開発＝?npc=1&dev=1／テスター＝一度 ?tester=1 で開いた端末（トシさんの端末など。?tester=0 で解除）
function qs() { try { return new URL(location.href).searchParams; } catch { return new URLSearchParams(); } }
const mode = (() => {
  const q = qs();
  try { if (q.get('tester') === '1') localStorage.setItem('nq-tester', '1'); if (q.get('tester') === '0') localStorage.removeItem('nq-tester'); } catch {}
  if (q.get('npc') === '1') return q.get('dev') === '1' ? 'dev' : 'practice';
  try { return localStorage.getItem('nq-tester') === '1' ? 'tester' : ''; } catch { return ''; }
})();

// ---- 印その2：どこから来たか。QR（?from=qr）・招待リンク（?room=）・ホーム画面のアイコン・直接 ----
// ※ room.js がURLから ?from=qr を消す前に読む必要があるので、この読み込み時に1回だけ決める
const src = (() => {
  try { if (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) return 'pwa'; } catch {}
  const q = qs();
  return q.get('from') === 'qr' ? 'qr' : q.get('room') ? 'invite' : 'direct';
})();

export function track(event, data = {}) {
  if (!logEnabled) return;
  try {
    const body = JSON.stringify({
      t: new Date().toISOString(), event, ver: VER, did: did(),
      lang: navigator.language || '', scr: `${screen.width}x${screen.height}`,
      ua: (navigator.userAgent || '').slice(0, 160), mode, src, ...data
    });
    fetch(LOG_URL, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body }).catch(() => {});
  } catch {}
}

// ---- エラーの記録：1回のページ表示につき最大5件、同じ内容は1回だけ（通信を増やさないため） ----
// 個人の名前は入れない。種類(code/name)・メッセージ・場所だけ。
const errSeen = new Set(); let errSent = 0;
export function trackError(where, e, extra = {}) {
  if (!logEnabled || errSent >= 5) return;
  try {
    const msg = `${e?.code || e?.name || 'Error'}: ${String(e?.message ?? e)}`;
    if (/ResizeObserver/i.test(msg)) return;
    const key = where + '|' + msg;
    if (errSeen.has(key)) return;
    errSeen.add(key); errSent++;
    track('error', { ...extra, info: key.slice(0, 280) });
  } catch {}
}
try {
  addEventListener('error', ev => trackError('window', { name: ev.error?.name, message: `${ev.message} @${String(ev.filename || '').split('/').pop()}:${ev.lineno}` }));
  addEventListener('unhandledrejection', ev => trackError('promise', ev.reason));
} catch {}
