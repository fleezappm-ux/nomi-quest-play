// Titles and outcomes follow game-src/catalog.json and cards.js at v0.6.49.
export const muttsuriPrompts=["一番むっつりだと思う人は？", "普段おとなしいのに夜は激しそうな人は？", "スマホの検索履歴が一番ヤバそうな人は？", "実は一番経験豊富そうな人は？", "真面目な顔で妄想が止まらなそうな人は？", "ひとりの時間が多そうな人は？", "秘密のアカウントを持ってそうな人は？", "こっそりコレクションを隠してそうな人は？", "清楚に見えてギャップがありそうな人は？", "ベッドの上で豹変しそうな人は？", "夜ふかしして動画を見てそうな人は？", "下ネタに赤くなるけど実は好きな人は？", "写真フォルダに秘密がありそうな人は？", "合コンで静かに本命を狙ってそうな人は？", "実は一番ロマンチストな妄想家は？", "ばれないように準備だけは万全な人は？"];
export const votePrompts=["エロそうな人は？","エッチが上手そうな人は？","むっつりスケベは誰？","電マ使ってそうな人は？","ウーマナイザー使ってそうな人は？","同人誌好きそうな人は？","今夜ホテルへ行きたいと思ってそうな人は？","パンツの臭いをこっそり嗅いでそうな人は？","浮気をしそうな人は？","複数プレイが好きそうな人は？","NTR（ネトラレ）が好きそうな人は？","ハメ撮りが好きそうな人は？","舐めるの好きそうな人は？"];
// the topic index to ask next: avoid the ones this device already saw in the room, start over when all were used
export const majorityPrompts=[["海派","山派"],["朝型","夜型"],["甘いもの","しょっぱいもの"],["旅行したい","家でゆっくり"],["犬派","猫派"],["計画して動く","気分で動く"],["セックスは好き","セックスは嫌い"],["セックスで演技する","セックスで演技しない"],["セックスをしたことある","セックスをしたことない"],["かめはめ波が撃てる","かめはめ波が撃てない"],["今日ラブホテルに行きたい","今日ラブホテルに行きたくない"],["1週間以内にセックスした","1週間以内にセックスしてない"],["私はエロい","私はエロくない"]];
export const mindPrompts=["合コンで最初に連絡先を聞きそうな人は？", "酔って告白しそうな人は？", "酔うと脱ぎ出しそうな人は？", "旅行先でナンパされたらついて行きそうな人は？", "泣き上戸になりそうな人は？", "二次会で最後まで残っていそうな人は？", "友達の恋人にこっそり惚れそうな人は？", "ドッキリに一番引っかかりそうな人は？", "ジェットコースターで叫びまくりそうな人は？", "勢いで人生を変える決断をしそうな人は？", "話を盛りがちな人は？", "深夜に元恋人へ連絡しそうな人は？", "宝くじが当たったら真っ先に仕事を辞めそうな人は？", "ホストやキャバクラにハマりそうな人は？", "結婚が一番早そうな人は？", "浮気がバレて土下座していそうな人は？", "終電を逃しても平気そうな人は？", "初対面でも誰とでも仲良くなれそうな人は？", "朝まで飲んでも元気そうな人は？", "酔って財布を落としそうな人は？"];
export function pickPrompt(seen,random=Math.random,size=votePrompts.length){const all=Array.from({length:size},(_,i)=>i),left=all.filter(i=>!seen.has(i));const pool=left.length?left:all;return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];}
export const cards = {
 check: {title:'休憩ターン',rule:'今の自分の状態を選ぶと、全員の状態が見える。チケットはなし。無理せず、水も飲もう。'},
 muttsuri: {title:'むっつりを探せ',rule:'お題に一番当てはまりそうな人に、全員が匿名で1票。得票1位がチケット＋1（同率1位はルーレットで1人）。'},
 tapking: {title:'タップ王',rule:'5秒間でボタンを連打。タップ回数が最も少ない人がチケット＋1（同数ならルーレットで1人）。'},
 majority: {title:'多数派だと思った？',rule:'A/Bの二択に全員が秘密で回答。多数派がチケット＋1。同数ならルーレットで1人がチケット＋1。'},
 mind: {title:'お前ならそうすると思ったよ',rule:'お題に一番「そうしそう」な人に、全員が匿名で1票。得票1位がチケット＋1（同率ならルーレットで1人）。'},
 vote: {title:'変態を探せ',rule:'お題に一番当てはまりそうな人に、全員が匿名で1票。得票1位がチケット＋1（同率1位はルーレットで1人）。'},
 king: {title:'👑 王様の命令',rule:'今回の担当が王様。相手を1人指名して口頭で命令。従えば何もなし、拒否するとチケット＋2。'},
 ten: {title:'10秒ジャスト', rule:'時計を見ずに10秒を狙ってSTOP。10秒から最も遠い人が対象。同率はルーレットで1人。'},
 buttons: {title:'そのボタン、押して大丈夫？',rule:'今回の担当が謎ボタンを1つ選ぶ。中身は回避・自分が対象・全員が対象。配置は毎回シャッフル。'},
 mission: {title:'あなたのキスはどんな顔！？',rule:'今回の担当がキス顔に挑戦。自己申告で完了。できなければチケット＋1。'},
 danger: {title:'GO TO HEAVEN OR HELL',rule:'今回の担当が1人を誘う。断られたら誘った人がチケット＋1（相手は罰なし）。承諾ならルーレット：HEAVENは2人ともお助け獲得、HELLは2人ともチケット＋2。'},
 reaction: {title:'ドキドキしてんじゃねーよ！',rule:'色ではなく形がハートのものをタップ（青いハートも正解）。最速の人はお助けを獲得、最遅・失敗の人はチケット＋1。早押し・違う形・3秒無反応は失敗。全員失敗ならお助けなし。'},
 battery: {title:'充電マウント合戦！', rule:'今の充電残量を入力。全員の回答後にHIGH／LOWを抽選。HIGHは最も多い人、LOWは最も少ない人。同率はルーレットで1人。'}
};
const DRAW=['ten','battery','buttons','reaction','danger','mission','king','vote','majority','mind','tapking','muttsuri'],DRAW_WEIGHT={ten:0.5,battery:0.5,reaction:0.5,tapking:0.5,vote:2,muttsuri:2,mind:2,majority:2,king:0.35};
// 出やすさ：1人ずつ計るカード(10秒・充電・ドキドキ・タップ王)は控えめ、みんなで盛り上がる投票系(変態を探せ・むっつり・お前なら・多数派)は多め、王様は少なめ、他は標準(1)。
export function drawCard(random=Math.random) {const w=DRAW.map(c=>DRAW_WEIGHT[c]??1);let r=random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<DRAW.length;i++){if(r<w[i])return DRAW[i];r-=w[i];}return DRAW[DRAW.length-1];}
export function drawDirection(random=Math.random) {return random()<0.5?'HIGH':'LOW';}
export function targetsFor(card, results, direction) {
 const entries=Object.entries(results);
 const values=entries.map(([,value])=>card==='ten'?Math.abs(value-10000):value);
 const edge=(card==='battery'&&direction==='LOW')||card==='tapking'?Math.min(...values):Math.max(...values);
 return entries.filter(([,value])=>(card==='ten'?Math.abs(value-10000):value)===edge).map(([uid])=>uid);
}

export function shuffleButtons(random=Math.random){const a=[0,1,2];for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function drinkBase(state,uid,players){if(state.phase!=='results'||state.card==='check')return 0;if(state.card==='majority')return state.side===2||state.results?.[uid]===state.side?1:0;if(state.card==='vote'||state.card==='muttsuri'||state.card==='mind'){const slot=players?.find(p=>p.uid===uid)?.slot;return slot!==undefined&&state.topVotes!==undefined&&Number(state.votes?.[slot])===state.topVotes?1:0;}if(state.card==='mission'){const actor=state.order[(state.round-1)%state.order.length];return uid===actor&&state.results?.[actor]===0?1:0;}if(state.card==='king'){const o=dangerOutcome(state);return o&&uid===o.target&&!o.accepted?2:0;}if(state.card==='danger'){const o=dangerOutcome(state);if(!o)return 0;return uid===o.actor?(!o.accepted?1:o.fate==='HELL'?2:0):uid===o.target&&o.accepted&&o.fate==='HELL'?2:0;}if(state.card==='buttons'){const actor=state.order[(state.round-1)%state.order.length];return state.buttonOutcome===2||state.buttonOutcome===1&&uid===actor?1:0;}return targetsFor(state.card||'ten',state.results,state.direction).includes(uid)?1:0;}

// Items are used by hand at the break-turn settlement (see tequilaOutcome); they no longer act when a ticket is credited.
export const items={
 barrier:{icon:'🛡️',name:'バリア',desc:'休憩ターンの精算で、自分に来たテキーラ1杯を無効にする。',usable:true},
 cute:{icon:'🥺',name:'可愛いだけじゃダメですか？',desc:'精算でテキーラが自分に来たとき、可愛い顔で誰かになすりつける。',usable:true},
 angel:{icon:'👼',name:'天使の分け前',desc:'精算で負けた人の代わりに、テキーラ1杯を飲んであげる。',usable:true}
};
export const itemKinds=Object.keys(items);
export function drawItem(random=Math.random){return itemKinds[Math.min(itemKinds.length-1,Math.floor(random()*itemKinds.length))];}
// base: tickets from drinkAward. used: {slot,kind} when an item was already spent this round. choice: 'barrier' | 'angel' | 'skip' | undefined.
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

// A tie for the ticket is settled by a roulette: the host writes state.pick (one of the tied players). pick narrows the ticket to that one player.
export function drinkAward(state,uid,players){const b=drinkBase(state,uid,players);return state.pick&&uid!==state.pick?0:b;}
export function tiedTargets(state,players){return players.filter(p=>drinkBase(state,p.uid,players)>0).map(p=>p.uid);}
export const tieCards=['ten','battery','tapking','vote','muttsuri','mind','majority'];
// break turn: after every n laps of n players (n*n draws) one round is a break; the other rounds draw as usual
export const checkStates=[['😊','まだまだ元気'],['🥴','ほろ酔い'],['😵','そろそろキツい'],['🚰','水が欲しい']];
export const breakPeriod=()=>2; // 休憩は人数に関係なく2ターンごと（固定）
export const isBreak=(round,n)=>round%breakPeriod(n)===0;
export const turnsToBreak=(round,n)=>breakPeriod(n)-round%breakPeriod(n);
export function cardForRound(round,n,random=Math.random){return isBreak(round,n)?'check':drawCard(random);}

// ---- Tickets and the break-turn settlement ----------------------------------------------------------------
// Every lost round credits tickets (personal drinks/{round}). At a break turn R the tickets of the rounds since the previous break are totalled;
// the player with the most tickets drinks one tequila (ties: roulette). Items are then used by hand against that tequila.
export function ticketWindow(round,n){const from=Math.max(1,round-breakPeriod(n)+1);return {from,to:round-1};}
export function ticketsFor(drinkMaps,uids,round,n){
 const {from,to}=ticketWindow(round,n),out={};
 for(const u of uids){let t=0;for(let r=from;r<=to;r++){const v=drinkMaps?.[u]?.[r];if(typeof v==='number')t+=v;}out[u]=t;}
 return out;
}
export function ticketLeaders(tickets){const e=Object.entries(tickets||{}),max=Math.max(0,...e.map(([,v])=>v));return {max,leaders:max>0?e.filter(([,v])=>v===max).map(([u])=>u):[]};}
// tq: {b: loser's barrier, c: cute (value = who gets it), x: barrier of that player, a: angel taker}. Returns who finally drinks the one tequila.
export function tequilaOutcome(pick,tq){
 if(!pick)return {drinker:null,cancelled:false,note:'none'};
 const t=tq||{};
 if(t.b)return {drinker:null,cancelled:true,by:t.b,kind:'barrier',note:'barrier'};
 let d=pick,via=null;
 if(t.c){d=t.c;via=pick;if(t.x)return {drinker:null,cancelled:true,by:t.x,kind:'barrier',via,note:'barrier2'};}
 if(t.a)return {drinker:t.a,cancelled:false,angel:t.a,replaced:d,via,note:'angel'};
 return {drinker:d,cancelled:false,via,note:via?'passed':'plain'};
}
// Which item buttons a player may use right now. {barrier,cute,angel} booleans.
export function itemChoices(me,pick,tq){
 const t=tq||{},out={barrier:false,cute:false,angel:false};
 if(!pick||t.b||t.a)return out;
 if(me===pick&&!t.c){out.barrier=true;out.cute=true;}
 if(t.c&&me===t.c&&!t.x)out.barrier=true;
 const current=t.c||pick;
 if(me!==current&&!(t.c&&me===pick)&&!t.x)out.angel=true;
 return out;
}
