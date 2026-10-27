// 9番「そのボタン、押して大丈夫？」（マス目の押し合い・仮仕様 2026-10-27）の純粋な判定ロジック。
// 12マス（3列×4行）。爆弾 1〜3個（押した人メーター＋2・ゲーム終了）／お助け 1〜3個（押した人お助け＋1・続行）／残りは空振り。
// 記録(lg)は host だけが書く： {u:押した人, c:マス番号 0〜11 または 12=次の人へ回す, r:'b'爆弾|'h'お助け|'e'空振り|'p'回した}
export const CELLS=12,PASS=12;
export function genLayout(rand=Math.random){
 const bombs=1+Math.floor(rand()*3),helps=1+Math.floor(rand()*3),a=Array(CELLS).fill('e');
 const put=(ch,n)=>{let k=0;while(k<n){const i=Math.floor(rand()*CELLS);if(a[i]==='e'){a[i]=ch;k++;}}};
 put('b',bombs);put('h',helps);return a.join('');
}
export const layoutOk=s=>typeof s==='string'&&s.length===CELLS&&/^[beh]+$/.test(s)&&(s.match(/b/g)||[]).length>=1&&(s.match(/b/g)||[]).length<=3&&(s.match(/h/g)||[]).length>=1&&(s.match(/h/g)||[]).length<=3;
// 記録を頭から再生して、今の状態を求める。order は担当(カードを引いた人)から始まる順番。
export function replay(lg,order,actor){
 const n=order.length;let idx=Math.max(0,order.indexOf(actor)),cnt=0;
 const pressed={},helpers={},presses={};let bomb=null;
 for(const e of lg){
  if(e.r==='p'){idx=(idx+1)%n;cnt=0;continue;}
  pressed[e.c]={u:e.u,r:e.r};presses[e.u]=(presses[e.u]||0)+1;cnt++;
  if(e.r==='h')helpers[e.u]=(helpers[e.u]||0)+1;
  if(e.r==='b'){bomb=e.u;break;}
 }
 return{cur:order[idx],cnt,pressed,helpers,presses,bomb,over:bomb!==null,left:CELLS-Object.keys(pressed).length};
}
// そのプレイヤーの手が今できるか（host が確かめる）
export function canMove(st,uid,c){
 if(st.over||uid!==st.cur)return false;
 if(c===PASS)return st.cnt>=1;
 return Number.isInteger(c)&&c>=0&&c<CELLS&&!st.pressed[c];
}
// 結果：results[uid]=お助けを押した回数*100+押した回数（state.results 用）
export function resultsOf(st,order){return Object.fromEntries(order.map(u=>[u,(st.helpers[u]||0)*100+(st.presses[u]||0)]));}
