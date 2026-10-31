// ドキドキしてんじゃねーよ！（爆弾）専用の結果画面。ダウト成功(H1)の構図を土台に、描画だけを差し替える。
// 判定・通信・次ターン処理は持たない。入力はゲームが計算済みの値。
import {doubtH1} from './result-h1.js?v=pop0.70.4';
export const BLAST_S=1.6; // 爆発の演出の長さ（この間は結果を出さない）
export function bombResult({losers,rows,uid,state,div,txt,popImg,avatarOf,elapsed=99}){
 const w=doubtH1({losers,rows,uid,state,div,txt,popImg,avatarOf});
 const sec=p=>{const v=state.results?.[p.uid];return typeof v==='number'?(v/1000).toFixed(1)+'秒':'';};
 const clean=s=>String(s||'').replace(/（NPC）|\(NPC\)/g,'').trim();
 const bx=state.bx,bl=state.bl,same=bx===bl;
 w.classList.remove('k-battery');w.classList.add('k-reaction','match-bomb');w.setAttribute('data-reference','bomb-v1');
 // 見出し：カード名と金文字
 const h2=w.querySelector('.md-card-title h2');if(h2)h2.textContent='ドキドキしてんじゃねーよ！';
 const ic=w.querySelector('.md-card-title .md-card-icon');if(ic){try{ic.replaceWith(popImg('reaction','md-card-icon',''));}catch{}}
 const ta=w.querySelector('.md-title-art');
 if(ta){const t=document.createElement('div');t.className='bx-title md-title-art';t.innerHTML='<small>💥 ドッカーン！ 💥</small>爆発！';ta.replaceWith(t);}
 const lie=w.querySelector('.md-lie');if(lie)lie.textContent='爆発';
 w.querySelector('.md-battery')?.remove();w.querySelector('.md-mask')?.remove();
 const por=w.querySelector('.md-portrait');if(por){por.insertAdjacentHTML('beforeend','<div class="bx-soot"></div>');}
 // 爆発した人の名前に持ち時間
 const ex=rows.find(r=>r.p.uid===bx);
 const nb=w.querySelector('.md-name b');if(nb&&ex)nb.textContent=clean(ex.p.name)+(sec(ex.p)?' '+sec(ex.p):'');
 // 飛び散る星
 const hero=w.querySelector('.md-result-hero');
 if(hero)['★','✦','💥','★','✦','★'].forEach((c,i)=>{const s=document.createElement('span');s.className='bx-star';s.textContent=c;s.style.left=['10%','82%','6%','90%','70%','24%'][i];s.style.top=['30%','22%','62%','58%','8%','10%'][i];hero.append(s);});
 // 助かった人：秒数つき。最長の人が別にいればお助けカードで目立たせる
 const safe=w.querySelector('.md-safe-players');
 const pl=rows.map(r=>r.p);
 if(safe){
  const others=pl.filter(p=>p.uid!==bx&&p.uid!==bl&&p.uid!==uid);
  if(!same&&bl){
   const lp=pl.find(p=>p.uid===bl),a=avatarOf(lp?.avatar);
   const card=div('bx-gift',div('bxg-av',txt('span','bxg-crown','👑'),Object.assign(document.createElement('img'),{src:a?.src||'',alt:'',width:62,height:62})),
    div('bxg-tx',txt('small','','🏆 一番長く持っていたのは'),txt('b','',(bl===uid?'あなた':clean(lp?.name))+'　'+sec(lp)),txt('small','','爆発しなかったのでセーフ！')),
    div('bxg-gf',txt('span','','🎁'),txt('i','','お助け＋1')));
   card.setAttribute('role','img');card.setAttribute('aria-label',(bl===uid?'あなた':clean(lp?.name))+'が一番長く持っていて、お助け＋1');
   const wrap=div('bx-giftwrap',card);
   if(others.length)wrap.append(txt('p','bx-others','セーフ：'+others.map(p=>clean(p.name)+' '+sec(p)).join('　')));
   safe.classList.add('bx-safe');safe.replaceChildren(wrap);
  }else{
   safe.querySelectorAll('.md-safe-player').forEach((n,i)=>{const p=others[i];const wd=n.querySelector('.md-safe-word');if(wd&&p)wd.textContent='セーフ '+sec(p);});
  }
 }
 // 自分の状態
 const st=w.querySelector('.md-self-status');
 if(st&&!st.classList.contains('md-self-penalty')){
  const me=pl.find(p=>p.uid===uid),s=st.querySelector('span'),g=st.querySelector('strong');
  if(!same&&bl===uid){if(s)s.textContent='🎁 お助け';if(g)g.textContent='＋1 GET！';}
  else{if(s)s.textContent='あなたは';if(g)g.textContent='セーフ '+sec(me);}
 }
 // 爆発の演出（結果の前に約1.6秒）。経過時間ぶんだけ進めるので、再描画しても最初から再生しない
 if(elapsed<BLAST_S){
  const f=div('bx-blast');f.style.setProperty('--bxe',`-${elapsed.toFixed(2)}s`);f.setAttribute('aria-hidden','true');
  for(let i=0;i<12;i++){const r=document.createElement('i');r.className='bx-ray';r.style.transform=`rotate(${i*15}deg)`;f.append(r);}
  ['⭐','✦','💥','🔥','⭐','✦','💥','🔥','⭐','✦','💥','🔥'].forEach((c,i)=>{const a=i*30*Math.PI/180,r=120+((i*37)%90),s=document.createElement('span');s.className='bx-st';s.textContent=c;s.style.left=(50+Math.cos(a)*r/4.1)+'%';s.style.top=(45+Math.sin(a)*r/6)+'%';f.append(s);});
  f.append(txt('b','','ドッカーン!!'));
  w.append(f);
 }
 return w;
}
