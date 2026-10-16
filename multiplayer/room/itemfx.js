// お助けカードが使われた瞬間に出す、画面いっぱいのエフェクト。表示は約2.4秒で自動的に消える。
export const FX={
 barrier:{icon:'🛡️',title:'バリア発動！',sub:'テキーラ1杯を無効に',cls:'fx-barrier'},
 angel:{icon:'👼',title:'天使の分け前！',sub:'代わりに飲んであげる',cls:'fx-angel'},
 cute:{icon:'🥺',title:'可愛いだけじゃダメですか？',sub:'テキーラをなすりつけた！',cls:'fx-cute'}
};
export function showItemFx(kind,doc=globalThis.document){
 try{
  const f=FX[kind]||{icon:'✨',title:'お助け発動！',sub:'',cls:'fx-barrier'};
  const host=doc?.body;if(!host)return null;
  const n=doc.createElement('div');n.className='itemfx '+f.cls;n.setAttribute('role','status');
  const ring=doc.createElement('i');ring.className='fx-ring';
  const ic=doc.createElement('b');ic.className='fx-icon';ic.textContent=f.icon;
  const t=doc.createElement('strong');t.className='fx-title';t.textContent=f.title;
  const s=doc.createElement('span');s.className='fx-sub';s.textContent=f.sub;
  n.append(ring,ic,t,s);
  for(let i=0;i<10;i++){const p=doc.createElement('em');p.className='fx-spark';p.style.setProperty('--a',String(i*36));p.style.setProperty('--d',String(0.05*i));n.append(p);}
  host.append(n);
  globalThis.navigator?.vibrate?.([60,40,90]);
  setTimeout(()=>n.remove?.(),2500);
  return n;
 }catch{return null;}
}
