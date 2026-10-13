// 鬼ごっこ（ミニゲーム）のルールとNPCの動き。画面にもFirebaseにも触れない純粋な関数だけ。
export const N=7,EXIT=[3,0],ONI_START=[3,3],TIME=15,MAX_TURNS=10;
export const DIRS={U:[0,-1],D:[0,1],L:[-1,0],R:[1,0],S:[0,0]};
export const ITEM_ICON={barrier:'🛡',angel:'😇',cute:'🥰'};
export const ODDS=[['slow',50,'🌀 金縛り','3ターン動いたら1ターン休み。休みの間、逃げる側は2歩進める'],['ally',25,'👥 仲間を呼ぶ','鬼の仲間NPCが参加者の人数分あらわれる'],['fast',15,'⚡ 韋駄天','毎ターン2歩まで進める'],['both',5,'🎆 大当たり','2歩＋仲間のダブルバフ'],['none',5,'💨 ハズレ','効果なし（通常と同じ）']];
export const key=(x,y)=>x+','+y;
export const arr=v=>v?Array.isArray(v)?v.filter(x=>x!=null):Object.values(v):[];
const rint=(rand,n)=>Math.floor(rand()*n);
const wallSet=s=>new Set(arr(s.w));
const isExit=p=>p[0]===EXIT[0]&&p[1]===EXIT[1];
export function bfs(from,walls){
 const d=new Map([[key(from[0],from[1]),0]]),q=[from];
 while(q.length){const [x,y]=q.shift(),c=d.get(key(x,y));
  for(const k of 'UDLR'){const nx=x+DIRS[k][0],ny=y+DIRS[k][1];
   if(nx<0||ny<0||nx>=N||ny>=N||walls.has(key(nx,ny))||d.has(key(nx,ny)))continue;
   d.set(key(nx,ny),c+1);q.push([nx,ny]);}}
 return d;
}
export function step(pos,k,walls){
 const d=DIRS[k]||DIRS.S,nx=pos[0]+d[0],ny=pos[1]+d[1];
 return nx<0||ny<0||nx>=N||ny>=N||walls.has(key(nx,ny))?[pos[0],pos[1]]:[nx,ny];
}
export const frozen=s=>!!s.bf?.slow&&s.turn%4===0;
export const oniSteps=s=>s.bf?.fast?2:1;
export const players=s=>Object.entries(s.p||{}).map(([uid,p])=>({uid,...p}));
export const runners=s=>players(s).filter(p=>p.s!=='oni');
export const aliveRunners=s=>runners(s).filter(p=>p.s==='run');
export const oniPlayer=s=>({uid:s.oni,...s.p[s.oni]});
// 最初の盤面。uids全員のうち oni が鬼。
export function newGame(uids,oni,rand=Math.random,max=MAX_TURNS){
 const others=uids.filter(u=>u!==oni),xs=[[3],[1,5],[0,3,6],[0,2,4,6],[0,1,3,5,6]][Math.min(others.length,5)-1];
 const p={[oni]:{x:ONI_START[0],y:ONI_START[1],s:'oni'}};
 others.slice(0,5).forEach((u,i)=>{p[u]={x:xs[i],y:6,s:'run'};});
 let walls;
 for(let guard=0;guard<200;guard++){
  walls=new Set();
  while(walls.size<7){const x=rint(rand,N),y=rint(rand,5);
   if((x===ONI_START[0]&&y===ONI_START[1])||(x===3&&y<=1))continue;walls.add(key(x,y));}
  const d=bfs(EXIT,walls);
  if(Object.values(p).every(q=>d.has(key(q.x,q.y))))break;
 }
 const taken=new Set([key(...EXIT),key(...ONI_START),...Object.values(p).map(q=>key(q.x,q.y)),...walls]);
 const spots=[];for(let y=1;y<=5;y++)for(let x=0;x<N;x++)if(!taken.has(key(x,y)))spots.push([x,y]);
 const kinds=Object.keys(ITEM_ICON),it=[];
 for(let i=0;i<Math.min(4,others.length);i++){const c=spots.splice(rint(rand,spots.length),1)[0];it.push({k:kinds[rint(rand,3)],x:c[0],y:c[1],h:'',s:''});}
 return {v:1,g:rint(rand,1e9),turn:1,phase:'choose',oni,max,w:[...walls],p,it,al:[],bf:{slow:0,fast:0,al:0},rolled:'',ev:[],pa:[],lg:[]};
}
export function rollRoulette(rand=Math.random){
 const total=ODDS.reduce((a,x)=>a+x[1],0);let r=rand()*total;
 for(const x of ODDS){if(r<x[1])return x[0];r-=x[1];}
 return 'none';
}
// ルーレットの結果を盤面に反映（仲間の出現も）。
export function applyBuff(s,kind,rand=Math.random){
 const n=Object.keys(s.p).length,walls=wallSet(s),o=s.p[s.oni];
 const bf={slow:kind==='slow'?1:0,fast:kind==='fast'||kind==='both'?1:0,al:0};
 let al=[];
 if(kind==='ally'||kind==='both'){
  bf.al=n;
  const starts=new Set(runners(s).map(r=>key(r.x,r.y))),d=bfs([o.x,o.y],walls);
  const cand=[...d].filter(([k,v])=>v>=1&&v<=3&&!starts.has(k)&&k!==key(...EXIT)).map(([k,v])=>({k,v,r:rand()})).sort((a,b)=>a.v-b.v||a.r-b.r);
  al=Array.from({length:n},(_,i)=>cand[i%cand.length].k.split(',').map(Number)).map(([x,y])=>({x,y}));
 }
 return {...s,bf,al,rolled:kind};
}
// 鬼や仲間が届くマス
export function reach(s){
 const walls=wallSet(s),set=new Set(),o=s.p[s.oni],steps=frozen(s)?0:oniSteps(s);
 const add=(x,y,n)=>{for(const [k,v] of bfs([x,y],walls))if(v<=n)set.add(k);set.add(key(x,y));};
 add(o.x,o.y,steps);for(const a of arr(s.al))add(a.x,a.y,1);
 return set;
}
// 逃げる側ボット：1歩ぶんの方向（ランダムに1/6ミス）
function runnerStep(s,pos,rand){
 const walls=wallSet(s),danger=reach(s);
 if(rand()<0.15)return 'UDLRS'[rint(rand,5)];
 const floor=arr(s.it).filter(i=>!i.h&&!i.s);let idist=null;
 if(floor.length){const dm=bfs(pos,walls);let bd=99,bi=null;for(const i of floor){const v=dm.get(key(i.x,i.y));if(v!==undefined&&v<bd){bd=v;bi=i;}}if(bi&&bd<=2)idist=bfs([bi.x,bi.y],walls);}
 const dist=bfs(EXIT,walls);let best=[],bs=1e9;
 for(const k of 'UDLRS'){
  const np=step(pos,k,walls),ck=key(np[0],np[1]),ex=isExit(np);
  const sc=((idist?idist.get(ck):dist.get(ck))??99)+(danger.has(ck)&&!ex?20:0)+(k==='S'?1.5:0)+(ex?-50:0);
  if(sc<bs){bs=sc;best=[k];}else if(sc===bs)best.push(k);
 }
 return best[rint(rand,best.length)];
}
// 鬼・仲間ボット：steps歩ぶんの方向
function chaserMoves(s,pos,steps,rand){
 const walls=wallSet(s),targets=aliveRunners(s);if(!targets.length)return 'S'.repeat(steps);
 let best=[],bs=-1;
 for(const a of 'UDLRS')for(const b of (steps>1?'UDLRS':'S')){
  const p1=step(pos,a,walls),p2=step(p1,b,walls),cells=new Set([key(...pos),key(...p1),key(...p2)]);
  let sc=0;
  for(const r of targets){
   const opts=['U','D','L','R','S'].map(k=>step([r.x,r.y],k,walls)).filter(c=>!isExit(c)),w=1/Math.max(1,opts.length);
   for(const o of opts)if(cells.has(key(...o)))sc+=w;
  }
  if(sc>bs+1e-9){bs=sc;best=[a+b];}else if(Math.abs(sc-bs)<1e-9)best.push(a+b);
 }
 const m=best[rint(rand,best.length)];return steps>1?m:m[0];
}
// ボット（人間の代わり）が出す手。例 'U' / 'UD'
export function botMove(s,uid,rand=Math.random){
 const p=s.p[uid];if(!p)return 'S';
 if(p.s==='oni')return frozen(s)?'S':chaserMoves(s,[p.x,p.y],oniSteps(s),rand);
 if(p.s!=='run')return 'S';
 const first=runnerStep(s,[p.x,p.y],rand);
 if(!frozen(s))return first;
 const walls=wallSet(s),np=step([p.x,p.y],first,walls);
 return first+runnerStep(s,np,rand);
}
// この手番に手を出すべき人
export function mustMove(s){
 const u=aliveRunners(s).map(r=>r.uid);
 if(!frozen(s))u.push(s.oni);
 return u;
}
const clean=(m,max)=>String(m||'S').replace(/[^UDLRS]/g,'').slice(0,max)||'S';
// 全員の手を合わせて1ターン進める（phaseは'moved'）
export function resolveTurn(s,moves,names={},rand=Math.random){
 const walls=wallSet(s),p=JSON.parse(JSON.stringify(s.p)),it=JSON.parse(JSON.stringify(arr(s.it))),ev=[];
 const nm=u=>names[u]||u,fz=frozen(s);
 const ids=Object.keys(p).filter(u=>p[u].s==='run').sort(()=>rand()-0.5);
 for(const u of ids){
  const ms=clean(moves[u],fz?2:1);
  for(const k of ms){
   const np=step([p[u].x,p[u].y],k,walls);p[u].x=np[0];p[u].y=np[1];
   for(const i of it)if(!i.h&&!i.s&&i.x===np[0]&&i.y===np[1]){i.h=u;ev.push(`${nm(u)}が${ITEM_ICON[i.k]}を拾った！`);}
   if(isExit(np)){p[u].s='exit';ev.push(`${nm(u)}が出口に着いた！`);break;}
  }
 }
 for(const i of it)if(i.h&&p[i.h].s==='exit'){i.s=i.h;i.h='';ev.push(`${nm(i.s)}が${ITEM_ICON[i.k]}を持ち帰った！獲得`);}
 const paths=[],trace=(from,ms)=>{const out=[[from[0],from[1]]];let cur=from;for(const k of ms){cur=step(cur,k,walls);out.push([cur[0],cur[1]]);}return out;};
 const o=p[s.oni];
 const omoves=fz?'':clean(moves[s.oni],oniSteps(s));
 const mainPath=trace([o.x,o.y],omoves);const end=mainPath[mainPath.length-1];o.x=end[0];o.y=end[1];paths.push(mainPath);
 const al=arr(s.al).map(a=>{const m=chaserMoves({...s,p},[a.x,a.y],1,rand);const pa=trace([a.x,a.y],m);paths.push(pa);const e=pa[pa.length-1];return {x:e[0],y:e[1]};});
 if(fz)ev.push('🌀 鬼は金縛りで動けない！');
 const cells=new Set(paths.flat().map(c=>key(c[0],c[1])));
 for(const u of ids)if(p[u].s==='run'&&cells.has(key(p[u].x,p[u].y))){
  p[u].s='caught';ev.push(`${nm(u)}が鬼に捕まった！ 1杯`);
  for(const i of it)if(i.h===u){i.h='';i.x=p[u].x;i.y=p[u].y;ev.push(`${ITEM_ICON[i.k]}が落ちた！`);}
 }
 if(!ev.length)ev.push('今回は誰も捕まらなかった。');
 const lg=[{t:s.turn,e:ev},...arr(s.lg)].slice(0,6);
 return {...s,phase:'moved',p,it,al,ev,pa:paths,lg};
}
// 'moved' のあと：次のターンか、終了か
export function advance(s){
 const next=s.turn+1;
 if(next>s.max||!aliveRunners(s).length)return {...s,phase:'end',drinks:drinksFor(s)};
 return {...s,turn:next,phase:'input',ev:[],pa:[]};
}
// 捕まった人と出口に着けなかった人が1杯。誰も捕まえられなかった鬼も1杯。
export function drinksFor(s){
 const d={},rs=runners(s);
 for(const r of players(s))d[r.uid]=0;
 for(const r of rs)if(r.s!=='exit')d[r.uid]=1;
 if(!rs.some(r=>r.s==='caught'))d[s.oni]=1;
 return d;
}
export const pickOni=(uids,rand=Math.random)=>uids[rint(rand,uids.length)];
