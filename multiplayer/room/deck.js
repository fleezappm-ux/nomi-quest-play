// Titles and outcomes follow game-src/catalog.json and cards.js at v0.6.49.
export const muttsuriPrompts=["一番むっつりだと思う人は？", "普段おとなしいのに夜は激しそうな人は？", "スマホの検索履歴が一番ヤバそうな人は？", "実は一番経験豊富そうな人は？", "真面目な顔で妄想が止まらなそうな人は？", "ひとりの時間が多そうな人は？", "秘密のアカウントを持ってそうな人は？", "こっそりコレクションを隠してそうな人は？", "清楚に見えてギャップがありそうな人は？", "ベッドの上で豹変しそうな人は？", "夜ふかしして動画を見てそうな人は？", "下ネタに赤くなるけど実は好きな人は？", "写真フォルダに秘密がありそうな人は？", "合コンで静かに本命を狙ってそうな人は？", "実は一番ロマンチストな妄想家は？", "ばれないように準備だけは万全な人は？"];
export const votePrompts=["エロそうな人は？","エッチが上手そうな人は？","むっつりスケベは誰？","電マ使ってそうな人は？","ウーマナイザー使ってそうな人は？","同人誌好きそうな人は？","今夜ホテルへ行きたいと思ってそうな人は？","パンツの臭いをこっそり嗅いでそうな人は？","浮気をしそうな人は？","複数プレイが好きそうな人は？","NTR（ネトラレ）が好きそうな人は？","ハメ撮りが好きそうな人は？","舐めるの好きそうな人は？"];
// the topic index to ask next: avoid the ones this device already saw in the room, start over when all were used
export const majorityPrompts=[["海派","山派"],["朝型","夜型"],["甘いもの","しょっぱいもの"],["旅行したい","家でゆっくり"],["犬派","猫派"],["計画して動く","気分で動く"],["セックスは好き","セックスは嫌い"],["セックスで演技する","セックスで演技しない"],["セックスをしたことある","セックスをしたことない"],["かめはめ波が撃てる","かめはめ波が撃てない"],["今日ラブホテルに行きたい","今日ラブホテルに行きたくない"],["1週間以内にセックスした","1週間以内にセックスしてない"],["私はエロい","私はエロくない"]];
export const mindPrompts=["合コンで最初に連絡先を聞きそうな人は？", "酔って告白しそうな人は？", "酔うと脱ぎ出しそうな人は？", "旅行先でナンパされたらついて行きそうな人は？", "泣き上戸になりそうな人は？", "二次会で最後まで残っていそうな人は？", "友達の恋人にこっそり惚れそうな人は？", "ドッキリに一番引っかかりそうな人は？", "ジェットコースターで叫びまくりそうな人は？", "勢いで人生を変える決断をしそうな人は？", "話を盛りがちな人は？", "深夜に元恋人へ連絡しそうな人は？", "宝くじが当たったら真っ先に仕事を辞めそうな人は？", "ホストやキャバクラにハマりそうな人は？", "結婚が一番早そうな人は？", "浮気がバレて土下座していそうな人は？", "終電を逃しても平気そうな人は？", "初対面でも誰とでも仲良くなれそうな人は？", "朝まで飲んでも元気そうな人は？", "酔って財布を落としそうな人は？"];
export function pickPrompt(seen,random=Math.random,size=votePrompts.length){const all=Array.from({length:size},(_,i)=>i),left=all.filter(i=>!seen.has(i));const pool=left.length?left:all;return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];}
export const cards = {
 muttsuri: {title:'むっつりを探せ',rule:'お題に一番当てはまりそうな人に、全員が匿名で1票。得票1位がDRINK＋1（同率1位はルーレットで1人）。'},
 tapking: {title:'タップ王',rule:'5秒間でボタンを連打。タップ回数が最も少ない人がDRINK＋1（同数ならルーレットで1人）。'},
 majority: {title:'多数派だと思った？',rule:'A/Bの二択に全員が秘密で回答。多数派がDRINK＋1。同数ならルーレットで1人がDRINK＋1。'},
 mind: {title:'お前ならそうすると思ったよ',rule:'お題に一番「そうしそう」な人に、全員が匿名で1票。得票1位がDRINK＋1（同率ならルーレットで1人）。'},
 vote: {title:'変態を探せ',rule:'お題に一番当てはまりそうな人に、全員が匿名で1票。得票1位がDRINK＋1（同率1位はルーレットで1人）。'},
 king: {title:'👑 王様の命令',rule:'今回の担当が王様。相手を1人指名して口頭で命令。従えば何もなし、拒否するとDRINK＋2（可愛いだけじゃダメですか？でパス可）。'},
 ten: {title:'10秒ジャスト', rule:'時計を見ずに10秒を狙ってSTOP。10秒から最も遠い人が対象。同率はルーレットで1人。'},
 buttons: {title:'そのボタン、押して大丈夫？',rule:'今回の担当が謎ボタンを1つ選ぶ。中身は回避・自分が対象・全員が対象。配置は毎回シャッフル。'},
 mission: {title:'あなたのキスはどんな顔！？',rule:'今回の担当がキス顔に挑戦。自己申告で完了。できなければDRINK＋1。可愛いだけじゃダメですか？のお助けでパスできます。'},
 danger: {title:'GO TO HEAVEN OR HELL',rule:'今回の担当が1人を誘う。断られたら誘った人がDRINK＋1（相手は罰なし）。承諾ならルーレット：HEAVENは2人ともお助け獲得、HELLは2人ともDRINK＋2。'},
 reaction: {title:'ドキドキしてんじゃねーよ！',rule:'色ではなく形がハートのものをタップ（青いハートも正解）。最速の人はお助けを獲得、最遅・失敗の人はDRINK＋1。早押し・違う形・3秒無反応は失敗。全員失敗ならお助けなし。'},
 battery: {title:'充電マウント合戦！', rule:'今の充電残量を入力。全員の回答後にHIGH／LOWを抽選。HIGHは最も多い人、LOWは最も少ない人。同率はルーレットで1人。'}
};
export function drawCard(random=Math.random) {return ['ten','battery','buttons','reaction','danger','mission','king','vote','majority','mind','tapking','muttsuri'][Math.min(11,Math.floor(random()*12))];}
export function drawDirection(random=Math.random) {return random()<0.5?'HIGH':'LOW';}
export function targetsFor(card, results, direction) {
 const entries=Object.entries(results);
 const values=entries.map(([,value])=>card==='ten'?Math.abs(value-10000):value);
 const edge=(card==='battery'&&direction==='LOW')||card==='tapking'?Math.min(...values):Math.max(...values);
 return entries.filter(([,value])=>(card==='ten'?Math.abs(value-10000):value)===edge).map(([uid])=>uid);
}

export function shuffleButtons(random=Math.random){const a=[0,1,2];for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function drinkBase(state,uid,players){if(state.phase!=='results')return 0;if(state.card==='majority')return state.side===2||state.results?.[uid]===state.side?1:0;if(state.card==='vote'||state.card==='muttsuri'||state.card==='mind'){const slot=players?.find(p=>p.uid===uid)?.slot;return slot!==undefined&&state.topVotes!==undefined&&Number(state.votes?.[slot])===state.topVotes?1:0;}if(state.card==='mission'){const actor=state.order[(state.round-1)%state.order.length];return uid===actor&&state.results?.[actor]===0?1:0;}if(state.card==='king'){const o=dangerOutcome(state);return o&&uid===o.target&&!o.accepted?2:0;}if(state.card==='danger'){const o=dangerOutcome(state);if(!o)return 0;return uid===o.actor?(!o.accepted?1:o.fate==='HELL'?2:0):uid===o.target&&o.accepted&&o.fate==='HELL'?2:0;}if(state.card==='buttons'){const actor=state.order[(state.round-1)%state.order.length];return state.buttonOutcome===2||state.buttonOutcome===1&&uid===actor?1:0;}return targetsFor(state.card||'ten',state.results,state.direction).includes(uid)?1:0;}

// Items follow game-src/core.js at v0.6.49. Trial 0.9 only lets the barrier act; cute and angel are carried but not usable yet.
export const items={
 barrier:{icon:'🛡️',name:'バリア',desc:'今回のDRINKを1回だけ完全回避。',usable:true},
 cute:{icon:'🥺',name:'可愛いだけじゃダメですか？',desc:'ミッション（キス顔）や王様の命令を拒否したときのDRINKを1回パス。',usable:true},
 angel:{icon:'👼',name:'天使の分け前',desc:'DRINKが＋2以上のとき＋1に減らす。',usable:true}
};
export const itemKinds=Object.keys(items);
export function drawItem(random=Math.random){return itemKinds[Math.min(itemKinds.length-1,Math.floor(random()*itemKinds.length))];}
// base: DRINK from drinkAward. used: {slot,kind} when an item was already spent this round. choice: 'barrier' | 'angel' | 'skip' | undefined.
// Returns {amount,spend} to record now, or null while the player still has to choose.
export function decideCredit({base,barrierSlot,angelSlot,cuteSlot,used,choice}){
 if(used)return{amount:used.kind==='barrier'||used.kind==='cute'?0:base>=2?1:base,spend:null};
 if(base===0)return{amount:0,spend:null};
 const angel=base>=2?angelSlot:undefined;
 if(barrierSlot===undefined&&angel===undefined&&cuteSlot===undefined)return{amount:base,spend:null};
 if(choice==='cute'&&cuteSlot!==undefined)return{amount:0,spend:cuteSlot};
 if(choice==='barrier'&&barrierSlot!==undefined)return{amount:0,spend:barrierSlot};
 if(choice==='angel'&&angel!==undefined)return{amount:1,spend:angel};
 if(choice==='skip')return{amount:base,spend:null};
 return null;
}
// Reaction card: answers are milliseconds (0-2999); 3000 means failed (too early, wrong shape, or timeout).
export const REACTION_FAIL=3000;
export function winnersFor(results){
 const valid=Object.entries(results||{}).filter(([,v])=>typeof v==='number'&&v<REACTION_FAIL);
 if(!valid.length)return [];
 const best=Math.min(...valid.map(([,v])=>v));
 return valid.filter(([,v])=>v===best).map(([uid])=>uid);
}

// GO TO HEAVEN OR HELL: results hold {actor: invited slot, invitedUid: 1 accepted | 0 refused}; fate is set only when accepted.
export function dangerOutcome(state){
 const results=state?.results,order=state?.order&&Object.values(state.order);
 if(!results||!order?.length)return null;
 const actor=order[(state.round-1)%order.length],target=Object.keys(results).find(k=>k!==actor);
 if(!target)return null;
 return{actor,target,accepted:results[target]===1,fate:state.fate||null};
}
export function rewardees(state){
 if(!state||state.phase!=='results')return[];
 if(state.card==='reaction')return winnersFor(state.results);
 if(state.card==='danger'){const o=dangerOutcome(state);return o&&o.accepted&&o.fate==='HEAVEN'?[o.actor,o.target]:[];}
 return[];
}

// A tie for the DRINK is settled by a roulette: the host writes state.pick (one of the tied players). pick narrows the DRINK to that one player.
export function drinkAward(state,uid,players){const b=drinkBase(state,uid,players);return state.pick&&uid!==state.pick?0:b;}
export function tiedTargets(state,players){return players.filter(p=>drinkBase(state,p.uid,players)>0).map(p=>p.uid);}
export const tieCards=['ten','battery','tapking','vote','muttsuri','mind','majority'];
