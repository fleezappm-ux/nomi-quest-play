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
export function track(event, data = {}) {
  if (!logEnabled) return;
  try {
    const body = JSON.stringify({
      t: new Date().toISOString(), event, ver: VER, did: did(),
      lang: navigator.language || '', scr: `${screen.width}x${screen.height}`,
      ua: (navigator.userAgent || '').slice(0, 160), ...data
    });
    fetch(LOG_URL, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body }).catch(() => {});
  } catch {}
}
