// ボタンのゲームの「岩」の絵（SVG文字列）。見た目だけ。判定は持たない。
// 岩の形は(ラウンド,マス)から決めるので、全員の画面で同じ形になる。
const rng=s=>{let a=(s>>>0)||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
const shade=(c,f)=>{c=c.replace('#','');const v=[0,2,4].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(c.slice(i,i+2),16)*f))));return'#'+v.map(x=>x.toString(16).padStart(2,'0')).join('');};
const P=pts=>pts.map(([x,y])=>x.toFixed(1)+','+y.toFixed(1)).join(' ');
function poly(r,n,rx,ry,cx=50,cy=34,j=.16){const a=[];for(let i=0;i<n;i++){const t=2*Math.PI*i/n+(r()-.5)*.3,k=1+(r()*2-1)*j;a.push([cx+rx*k*Math.cos(t),cy+ry*k*Math.sin(t)]);}return a;}
const EDGE='#17120d',ROCK='#8f8f96',HARD='#4b5d78',GOLD='#f2c14e';
const wrap=s=>`<svg viewBox="0 0 100 64" class="rkSvg" aria-hidden="true">${s}</svg>`;
// kind: n=ふつう c=ヒビ(ブラフ) g=金(ブラフ) k=固い岩（crack=ヒビの量 0〜4）
export function rockSvg(seed,kind='n',crack=0){
 const r=rng(seed*7919+13),base=kind==='k'?HARD:kind==='g'?GOLD:ROCK;
 const pts=kind==='k'?poly(r,8,47,29,50,34,.10):poly(r,[8,9,10][Math.floor(r()*3)],40+r()*7,24+r()*5);
 const cx=50,cy=34,n=pts.length;let s='';
 for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n];const f=(i===n-3||i===n-2)?1.25:(i>=2&&i<=4)?.62:.9+(r()-.5)*.24;
  const c=kind==='g'?shade('#f2c14e',f*1.05):shade(base,f);
  s+=`<polygon points="${P([[cx+(a[0]-cx)*.55,cy+(a[1]-cy)*.5-3],a,b,[cx+(b[0]-cx)*.55,cy+(b[1]-cy)*.5-3]])}" fill="${c}"/>`;}
 const top=pts.map(p=>[cx+(p[0]-cx)*.55,cy+(p[1]-cy)*.5-3]);
 s+=`<polygon points="${P(top)}" fill="${shade(kind==='g'?'#f2c14e':base,1.18)}"/><polygon points="${P(pts)}" fill="none" stroke="${EDGE}" stroke-width="2.4" stroke-linejoin="round"/>`;
 if(kind==='c')s+='<path d="M52 8L46 22 56 31 44 44 54 60M46 22L30 28M56 31L74 26M44 44L28 50" fill="none" stroke="#f4efe0" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
 if(kind==='g')s+='<path d="M72 8l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff"/><path d="M26 40l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#fffbe0"/>';
 if(kind==='k')for(let k=0;k<Math.min(4,crack);k++)s+=`<path d="M${30+k*12} 12L${26+k*12} 28 ${35+k*12} 38 ${29+k*12} 54M${26+k*12} 28L${16+k*12} 34M${35+k*12} 38L${46+k*12} 36" fill="none" stroke="#f4efe0" stroke-width="2.2" stroke-linecap="round"/>`;
 return wrap(s);
}
const dent='<ellipse cx="50" cy="40" rx="40" ry="20" fill="#241608" opacity=".75"/><ellipse cx="50" cy="38" rx="34" ry="16" fill="#3a2616"/>';
function shards(seed,n,spread=1){const r=rng(seed*31+5);let s='';for(let i=0;i<n;i++){const a=r()*6.28,d=(14+r()*26)*spread,x=50+d*Math.cos(a),y=38+d*Math.sin(a)*.55;s+=`<polygon points="${P(poly(r,5,4+r()*4,3+r()*3,x,y,.3))}" fill="${shade(ROCK,.6+r()*.6)}" stroke="${EDGE}" stroke-width="1.2"/>`;}return s;}
// 割れたあと：h=お助け（宝箱）b=爆弾 e=空振り（破片だけ）
export function openedSvg(seed,res){
 if(res==='h')return wrap(dent+shards(seed,6)+'<g transform="translate(50 40)"><polygon points="-16,-6 -8,-30 12,-30 20,-6" fill="#fff6c8" opacity=".55"/><rect x="-18" y="-4" width="36" height="22" rx="3" fill="#9a5a22" stroke="#3b2208" stroke-width="2"/><rect x="-18" y="3" width="36" height="4" fill="#e6b53a"/><rect x="-3" y="1" width="6" height="8" rx="1.5" fill="#ffe27a" stroke="#3b2208"/><g transform="rotate(-38 -18 -4)"><rect x="-18" y="-18" width="36" height="14" rx="4" fill="#b4692a" stroke="#3b2208" stroke-width="2"/><rect x="-18" y="-12" width="36" height="3" fill="#e6b53a"/></g><ellipse cx="0" cy="-5" rx="14" ry="4" fill="#ffd45a"/><circle cx="-6" cy="-8" r="3" fill="#fff0a0"/><circle cx="5" cy="-9" r="3.2" fill="#ffe27a"/></g><path d="M74 8l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM22 16l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#fff"/>');
 if(res==='b')return wrap(dent+shards(seed,7,1.2)+'<g transform="translate(50 36)"><polygon points="0,-30 6,-14 22,-22 14,-8 30,-4 14,2 24,18 8,10 2,26 -4,10 -20,20 -12,2 -30,-6 -12,-10 -20,-26 -6,-14" fill="#ff7a1a" stroke="#fff3b0" stroke-width="2"/><polygon points="0,-20 4,-9 14,-13 9,-4 18,0 8,3 12,12 3,8 0,17 -4,8 -12,13 -8,2 -18,-2 -9,-5 -13,-13 -4,-9" fill="#ffe27a"/><circle r="9" fill="#fff"/></g>');
 return wrap(dent+shards(seed,8,1)+`<polygon points="${P(poly(rng(seed),6,7,5,30,46,.3))}" fill="${ROCK}" stroke="${EDGE}" stroke-width="1.2"/>`);
}
// つるはし（振り下ろす演出用）
export const pickSvg='<svg viewBox="-34 -8 68 60" class="pickSvg" aria-hidden="true"><rect x="-2" y="-4" width="4" height="46" rx="1.5" fill="#b07a3a" stroke="#3b2208" stroke-width="1.5"/><path d="M-26 0Q0 -16 26 0Q0 -8 -26 0Z" fill="#c9ced6" stroke="#2b2f36" stroke-width="2" stroke-linejoin="round"/><path d="M-24 -1Q0 -11 24 -1" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7"/></svg>';
export const sparkSvg='<svg viewBox="0 0 100 64" class="sparkSvg" aria-hidden="true"><g stroke="#fff3a0" stroke-width="3" stroke-linecap="round"><path d="M40 40L26 33M44 46L36 58M56 46L64 58M60 40L76 33M50 36L50 22"/></g><circle cx="50" cy="42" r="6" fill="#fff" opacity=".85"/></svg>';
