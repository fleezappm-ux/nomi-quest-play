// 初回だけ出す「20歳以上の確認」。自己申告のチェック式で、本人確認はしない。
// 確認済みはこの端末のlocalStorageだけに記録する（アカウントやログインは作らない）。
// 20歳以上と確認できるまで、この関数は戻らない（= 呼び出し側の続きは動かない）。
const KEY='nq-age-ok',MARK='20+';
const stored=()=>{try{return localStorage.getItem(KEY)===MARK;}catch{return false;}};
const remember=()=>{try{localStorage.setItem(KEY,MARK);}catch{}};
export const TEXT={
 title:'NOMI QUEST',
 lead:'このゲームは、お酒を飲みながら遊ぶ飲み会ゲームです。',
 rule:'遊べるのは20歳以上の方だけです。',
 care:'お酒は20歳になってから。無理せず、自分のペースで楽しんでください。',
 check:'私は20歳以上です',
 start:'はじめる',
 under:'20歳未満の方はここまで',
 byeTitle:'また今度ね',
 byeBody:'20歳になったら、また遊びに来てね。'
};
function build(doc){
 const el=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const wrap=el('div','agegate');wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('aria-labelledby','agegateTitle');
 const card=el('div','agegate-card');
 const title=el('h1','agegate-title',TEXT.title);title.id='agegateTitle';
 const label=el('label','agegate-check');const box=doc.createElement('input');box.type='checkbox';box.id='ageOk';label.append(box,el('span','',TEXT.check));
 const go=el('button','agegate-go',TEXT.start);go.id='ageGo';go.type='button';go.disabled=true;
 const under=el('button','agegate-under',TEXT.under);under.id='ageUnder';under.type='button';
 card.append(title,el('p','agegate-lead',TEXT.lead),el('p','agegate-rule',TEXT.rule),el('p','agegate-care',TEXT.care),label,go,under);
 wrap.append(card);
 return {wrap,card,box,go,under,el};
}
export function ensureAdult(doc=globalThis.document){
 if(stored()||!doc?.body)return Promise.resolve(true);
 return new Promise(resolve=>{
  const main=doc.querySelector('main'),{wrap,card,box,go,under,el}=build(doc);
  main?.setAttribute('inert','');main?.setAttribute('aria-hidden','true');
  box.onchange=()=>{go.disabled=!box.checked;};
  go.onclick=()=>{if(!box.checked)return;remember();wrap.remove();main?.removeAttribute('inert');main?.removeAttribute('aria-hidden');resolve(true);};
  under.onclick=()=>{ // ここで止める。続きは動かさず、解除する手段も置かない（再読み込みしても同じ確認から）。
   const title=el('h1','agegate-title',TEXT.byeTitle);title.id='agegateTitle';
   card.replaceChildren(title,el('p','agegate-lead',TEXT.byeBody));
  };
  doc.body.append(wrap);box.focus?.();
 });
}
