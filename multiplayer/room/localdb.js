// 通信なしの練習モード用：Firebase Realtime Databaseの代わりをするメモリ上のDB（ルール検証はしない）。
const clone=v=>v===undefined||v===null?null:JSON.parse(JSON.stringify(v));
const parts=p=>String(p).split('/').filter(Boolean);
let tree={};
const listeners=new Set();
function read(path){let n=tree;for(const k of parts(path)){if(n===null||typeof n!=='object'||!(k in n))return null;n=n[k];}return n===undefined?null:n;}
function write(path,value){
 const ks=parts(path);
 if(!ks.length){tree=value===null||value===undefined?{}:clone(value);return;}
 let n=tree;
 for(let i=0;i<ks.length-1;i++){if(n[ks[i]]===null||typeof n[ks[i]]!=='object')n[ks[i]]={};n=n[ks[i]];}
 const last=ks[ks.length-1];
 if(value===null||value===undefined)delete n[last];else n[last]=clone(value);
 prune(tree);
}
function prune(n){if(n===null||typeof n!=='object')return;for(const k of Object.keys(n)){prune(n[k]);if(n[k]!==null&&typeof n[k]==='object'&&!Object.keys(n[k]).length)delete n[k];}}
function notify(){
 for(const l of [...listeners]){
  if(!listeners.has(l))continue;
  const val=read(l.path),key=JSON.stringify(val);
  if(key===l.last)continue;
  l.last=key;
  queueMicrotask(()=>{if(listeners.has(l))l.cb({val:()=>clone(val)});});
 }
}
export const getDatabase=()=>({local:true});
export const ref=(db,path)=>({path:String(path||'').replace(/^\/+/,'')});
export const serverTimestamp=()=>Date.now();
export async function set(r,v){await null;write(r.path,v===undefined?null:v);notify();}
export async function get(r){await null;const val=r.path==='.info/connected'?true:read(r.path);return {val:()=>clone(val)};}
export async function update(r,values){await null;for(const [k,v] of Object.entries(values))write(r.path?r.path+'/'+k:k,v);notify();}
export async function runTransaction(r,fn){await null;const cur=read(r.path),next=fn(clone(cur));if(next===undefined)return {committed:false};write(r.path,next);notify();return {committed:true};}
export function onValue(r,cb){
 const l={path:r.path,cb,last:undefined};
 listeners.add(l);
 queueMicrotask(()=>{if(!listeners.has(l))return;const val=r.path==='.info/connected'?true:read(r.path);l.last=JSON.stringify(val);cb({val:()=>clone(val)});});
 return ()=>listeners.delete(l);
}
export const onDisconnect=()=>({set:async()=>{},cancel:async()=>{}});
export const dump=()=>clone(tree);
