// 9番「そのボタン、押して大丈夫？」（マス目の押し合い・仮仕様 2026-10-27）の純粋な判定ロジック。
// 24マス（4列×6行・仮。最大6人で遊ぶ前提で、押したがりが出るよう多めにした 2026-10-28）。爆弾 1〜3個（押した人メーター＋2・ゲーム終了）／お助け 1〜3個（押した人お助け＋1・続行）／残りは空振り。
// 記録(lg)は host だけが書く： {u:押した人, c:マス番号 0〜23 または 24=次の人へ回す, r:'b'爆弾|'h'お助け|'e'空振り|'p'回した}
export const CELLS=24,PASS=24;
// 配置：24文字(b=爆弾 h=お助け e=空振り)＋、固い岩があるときだけ "|マス=耐久度,…"（耐久度は2〜5。ホストだけが読める）
export function parseLay(s){const cells=String(s||'').slice(0,CELLS),hard={};const m=String(s||'').split('|')[1];if(m)for(const p of m.split(',')){const[c,d]=p.split('=').map(Number);if(Number.isInteger(c)&&c>=0&&c<CELLS&&d>=2&&d<=5)hard[c]=d;}return{cells,hard};}
export function genLayout(rand=Math.random){
 const bombs=1+Math.floor(rand()*3),helps=1+Math.floor(rand()*3),a=Array(CELLS).fill('e');
 const put=(ch,n)=>{let k=0;while(k<n){const i=Math.floor(rand()*CELLS);if(a[i]==='e'){a[i]=ch;k++;}}};
 put('b',bombs);put('h',helps);
 // 固い岩：出る数はランダム（0個30%／1個40%／2個30%）。耐久度は2〜5
 const r=rand(),nh=r<.3?0:r<.7?1:2,hard={};
 while(Object.keys(hard).length<nh){const c=Math.floor(rand()*CELLS);if(hard[c]===undefined)hard[c]=2+Math.floor(rand()*4);}
 // 固い岩の中に爆弾があるときは、ふつうの岩にも必ず爆弾を入れる
 const hc=Object.keys(hard).map(Number);
 if(hc.some(c=>a[c]==='b')&&!a.some((ch,i)=>ch==='b'&&hard[i]===undefined)){const free=[...Array(CELLS).keys()].filter(i=>hard[i]===undefined&&a[i]==='e');if(free.length)a[free[Math.floor(rand()*free.length)]]='b';}
 return a.join('')+(hc.length?'|'+hc.map(c=>c+'='+hard[c]).join(','):'');
}
export const layoutOk=s=>{if(typeof s!=='string')return false;const{cells,hard}=parseLay(s);return s.split('|')[0].length===CELLS&&/^[beh]+$/.test(cells)&&(cells.match(/b/g)||[]).length>=1&&(cells.match(/b/g)||[]).length<=4&&(cells.match(/h/g)||[]).length>=1&&(cells.match(/h/g)||[]).length<=3&&Object.keys(hard).length<=2;};
// 記録を頭から再生して、今の状態を求める。order は担当(カードを引いた人)から始まる順番。
// 強欲：1ターンに10〜15個（毎ターンの抽選。ゲーム全員が同じ値を計算できるが、画面には出さない）押した人は、その次のマスから「強欲」。
export const greedTh=(go,pass)=>{if(globalThis.__nqGreedTh)return globalThis.__nqGreedTh;let x=((Math.floor(Number(go)||0)|0)^Math.imul(pass+1,0x9e3779b1))>>>0;x^=x>>>16;x=Math.imul(x,0x85ebca6b)>>>0;x^=x>>>13;x=Math.imul(x,0xc2b2ae35)>>>0;x^=x>>>16;return 10+(x>>>0)%6;};
export function replay(lg,order,actor,go){
 const n=order.length;let idx=Math.max(0,order.indexOf(actor)),cnt=0,passes=0;
 const pressed={},helpers={},presses={},greedy={},taps={},litH={};let bomb=null,lit=false,justLit=false,bombG=false;
 for(const e of lg){
  if(e.r==='p'){idx=(idx+1)%n;cnt=0;passes++;lit=false;justLit=false;continue;}
  justLit=false;const active=lit; // 点灯したマスは普通。次のマスから強欲
  if(e.r==='t'){taps[e.c]=(taps[e.c]||0)+1;presses[e.u]=(presses[e.u]||0)+1;cnt++;if(!lit&&cnt===greedTh(go,passes)){lit=true;greedy[e.u]=1;justLit=true;}continue;} // 固い岩を叩いた（まだ割れない）
  pressed[e.c]={u:e.u,r:e.r,g:active};presses[e.u]=(presses[e.u]||0)+1;cnt++;
  if(e.r==='h'){helpers[e.u]=(helpers[e.u]||0)+1;if(active)litH[e.u]=1;} // 強欲中に押したお助けは2枚
  if(e.r==='b'){bomb=e.u;bombG=active;break;}
  if(!lit&&cnt===greedTh(go,passes)){lit=true;greedy[e.u]=1;justLit=true;}
 }
 return{cur:order[idx],cnt,taps,pressed,helpers,litH,presses,bomb,over:bomb!==null,left:CELLS-Object.keys(pressed).length,greedy,lit,litNow:justLit?order[idx]:null,bombG};
}
// そのプレイヤーの手が今できるか（host が確かめる）
export function canMove(st,uid,c){
 if(st.over||uid!==st.cur)return false;
 if(c===PASS)return st.cnt>=1;
 return Number.isInteger(c)&&c>=0&&c<CELLS&&!st.pressed[c];
}
// 結果：results[uid]=（強欲中にお助けを押したら10000）+お助けを押した回数*100+押した回数（state.results 用）
export function resultsOf(st,order){return Object.fromEntries(order.map(u=>[u,(st.litH?.[u]?10000:0)+(st.helpers[u]||0)*100+(st.presses[u]||0)]));}
// 最初の人：スタート合図(go：サーバー時刻)から全員が同じ人を選ぶ。合図が無いとき（古いルール）は従来どおりカードを引いた人。
export const startOf=(order,go,actor)=>typeof go==='number'&&order.length?order[Math.abs(Math.floor(go))%order.length]:actor;
// 岩のヒント（ブラフ入り）：ヒビ=爆弾っぽい／金=お助けっぽい。配置を知っているホストだけが作る。n=ふつう c=ヒビ g=金
export function genHints(layStr,rand=Math.random){
 const {cells:lay,hard}=parseLay(layStr);
 const a=Array(CELLS).fill('n');for(const c in hard)a[c]='k';
 const take=(pool)=>{const f=pool.filter(i=>a[i]==='n');return f.length?f[Math.floor(rand()*f.length)]:-1;};
 const idx=ch=>[...Array(CELLS).keys()].filter(i=>lay[i]===ch),non=ch=>[...Array(CELLS).keys()].filter(i=>lay[i]!==ch);
 const nc=2+Math.floor(rand()*2),ng=2+Math.floor(rand()*2),P=0.6;
 for(let k=0;k<nc;k++){let i=rand()<P?take(idx('b')):-1;if(i<0)i=take(non('b'));if(i>=0)a[i]='c';}
 for(let k=0;k<ng;k++){let i=rand()<P?take(idx('h')):-1;if(i<0)i=take(non('h'));if(i>=0)a[i]='g';}
 return a.join('');
}
export const hintOk=s=>typeof s==='string'&&s.length===CELLS&&/^[ncgk]+$/.test(s);
