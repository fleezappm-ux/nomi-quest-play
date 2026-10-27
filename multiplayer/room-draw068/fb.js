// 本番はFirebase、?npc=1 のときは通信なしの練習モード（localdb.js）に切り替える。
import * as real from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js';
import * as local from './localdb.js';
export const isLocal=typeof location!=='undefined'&&new URL(location.href).searchParams.get('npc')==='1';
const m=isLocal?local:real;
export const {getDatabase,ref,set,get,update,onValue,onDisconnect,runTransaction,serverTimestamp}=m;
