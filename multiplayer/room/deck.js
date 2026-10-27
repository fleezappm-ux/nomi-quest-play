import {itemsOfCode,meterOfCode} from './roulette.js?v=pop0.69';
// Titles and outcomes follow game-src/catalog.json and cards.js at v0.6.49.
export const muttsuriPrompts=["一番むっつりだと思う人は？", "普段おとなしいのに夜は激しそうな人は？", "スマホの検索履歴が一番ヤバそうな人は？", "実は一番経験豊富そうな人は？", "真面目な顔で妄想が止まらなそうな人は？", "ひとりの時間が多そうな人は？", "秘密のアカウントを持ってそうな人は？", "こっそりコレクションを隠してそうな人は？", "清楚に見えてギャップがありそうな人は？", "ベッドの上で豹変しそうな人は？", "夜ふかしして動画を見てそうな人は？", "下ネタに赤くなるけど実は好きな人は？", "写真フォルダに秘密がありそうな人は？", "合コンで静かに本命を狙ってそうな人は？", "実は一番ロマンチストな妄想家は？", "ばれないように準備だけは万全な人は？","ひとりで盛り上がるタイプは？","隠しフォルダが多そうな人は？","実はコスプレに興味がありそうな人は？","本命にだけ甘えん坊になりそうな人は？","実は一番Mっぽい人は？","実は一番Sっぽい人は？","こっそり官能小説を読んでそうな人は？","ホテルの部屋選びに口を出しそうな人は？","マイおもちゃ（大人の）を持ってそうな人は？"];
export const votePrompts=["エロそうな人は？","エッチが上手そうな人は？","むっつりスケベは誰？","電マ使ってそうな人は？","ウーマナイザー使ってそうな人は？","リアルよりアニメが好きそうな人は？","今夜ホテルへ行きたいと思ってそうな人は？","パンツの臭いをこっそり嗅いでそうな人は？","浮気をしそうな人は？","複数プレイが好きそうな人は？","NTR（ネトラレ）が好きそうな人は？","ハメ撮りが好きそうな人は？","舐めるの好きそうな人は？","夜に赤ちゃんになりそうな人は？","下着にこだわりがありそうな人は？","大人のお店に一人で入れそうな人は？","夜のお誘いが一番うまそうな人は？","彼女（彼）の前で別人になりそうな人は？","恥ずかしい動画を持っていそうな人は？","最初のデートで手を出しそうな人は？","マッチングアプリを一番使いこなしてそうな人は？","1回じゃ終わらなさそうな人は？"];
// the topic index to ask next: avoid the ones this device already saw in the room, start over when all were used
export const majorityPrompts=[["海派","山派"],["朝型","夜型"],["甘いもの","しょっぱいもの"],["旅行したい","家でゆっくり"],["犬派","猫派"],["計画して動く","気分で動く"],["セックスは好き","セックスは嫌い"],["セックスで演技する","セックスで演技しない"],["セックスをしたことある","セックスをしたことない"],["かめはめ波が撃てる","かめはめ波が撃てない"],["今日ラブホテルに行きたい","今日ラブホテルに行きたくない"],["1週間以内にセックスした","1週間以内にセックスしてない"],["私はエロい","私はエロくない"],["きのこ派","たけのこ派"],["お風呂は朝","お風呂は夜"],["既読スルーは平気","既読スルーは気になる"],["貯金型","使い切り型"],["初めてのデートは自分から誘う","初めてのデートは誘われたい"],["エッチの時の照明は明るく","エッチの時の照明は暗く"],["私はS","私はM"],["屋外でのイチャイチャは好き","屋外でのイチャイチャは苦手"],["大人のおもちゃは使ったことがある","大人のおもちゃは使ったことがない"],["ベッド以外の場所でエッチをしたことがある","ベッド以外の場所でエッチをしたことがない"],["私は今恋をしてる","私は今恋をしてない"]];
export const mindPrompts=["酔って一番告白しそうなのは誰？","酔うと一番脱ぎ出しそうなのは誰？","朝まで飲んでも一番元気そうなのは誰？","酔って一番財布を落としそうなのは誰？","一番最初に寝落ちしそうなのは誰？","この中で一番、お酒に強いのは誰？","一番最初に酔いつぶれそうなのは誰？","酔うと一番態度が大きくなるのは誰？","酔うとスキンシップが増えるのは誰？","二日酔いでも普通に出社しそうなのは誰？","〆のラーメンを一番食べたがるのは誰？","飲み会の幹事が一番うまいのは誰？","一番「もう一軒行こう」と言いそうなのは誰？","酔って同じ話を3回しそうなのは誰？","お酒の席で一番盛り上げ上手なのは誰？","帰り道に寝てしまいそうなのは誰？","合コンで一番最初に連絡先を聞きそうなのは誰？","旅行先でナンパされたら一番ついて行きそうなのは誰？","友達の恋人に一番こっそり惚れそうなのは誰？","深夜に元恋人へ一番連絡しそうなのは誰？","ホストやキャバクラに一番ハマりそうなのは誰？","浮気がバレて一番土下座していそうなのは誰？","一番ほれっぽいのは誰？","一番告白されたことがありそうなのは誰？","一番デートの計画をちゃんと立てそうなのは誰？","一番ロマンチックな言葉を言えそうなのは誰？","一番ヤキモチを焼きそうなのは誰？","一番元カレ・元カノを引きずってそうなのは誰？","一番プロポーズが下手そうなのは誰？","一番LINEの返信が遅いのは誰？","一番「好き」を口にできなさそうなのは誰？","一番尽くすタイプなのは誰？","勢いで人生を変える決断を一番しそうなのは誰？","一番話を盛りがちなのは誰？","初対面でも一番誰とでも仲良くなれそうなのは誰？","一番おごられ上手なのは誰？","一番嘘が下手なのは誰？","一番ポーカーフェイスなのは誰？","待ち合わせに一番遅れてきそうなのは誰？","一番マイペースなのは誰？","一番方向音痴なのは誰？","一番ケチなのは誰？","一番ノリがいいのは誰？","ドッキリに一番引っかかりそうなのは誰？","ジェットコースターで一番叫びまくりそうなのは誰？","昔のあだ名が一番ひどそうなのは誰？","一番寝坊しそうなのは誰？","一番ゲームにハマりそうなのは誰？","一番料理が上手そうなのは誰？","一番運転が荒そうなのは誰？","一番ダイエットが続かなそうなのは誰？","一番カラオケがうまそうなのは誰？","一番SNSを更新していそうなのは誰？","一番ホラー映画で叫びそうなのは誰？","一番サバイバル生活に向いてそうなのは誰？","宝くじが当たったら一番真っ先に仕事を辞めそうなのは誰？","無人島に一緒に行きたいのは誰？","一番大物になりそうなのは誰？","一番早く有名になりそうなのは誰？","10年後、一番変わってなさそうなのは誰？","10年後、一番お金持ちになってそうなのは誰？","もしゾンビ映画なら、最後まで生き残りそうなのは誰？","もし政治家になったら、一番人気が出そうなのは誰？","もし先生になったら、一番生徒に慕われそうなのは誰？","一番ワンナイトの回数が多そうな人は誰？","一番、浮気しても罪悪感がなさそうなのは誰？","一番、二股をかけていそうなのは誰？","一番、結婚しても浮気しそうなのは誰？","一番、浮気されても許してしまいそうなのは誰？","一番、元カレ・元カノと今でもこっそり連絡を取っていそうなのは誰？","一番、友達の元恋人に手を出しそうなのは誰？","一番、職場の人とこっそり付き合っていそうなのは誰？","一番、恋人のスマホをこっそり見ていそうなのは誰？","一番、別れたあとに悪口を言いふらしそうなのは誰？","一番、キスがうまそうなのは誰？","一番、束縛が強そうなのは誰？","一番、裏の顔がありそうなのは誰？","一番、人に言えない秘密を抱えていそうなのは誰？","一番、バレたら人生が変わるレベルの秘密を持っていそうなのは誰？","一番、自分のスマホを絶対に人に見せなさそうなのは誰？","一番、人の秘密をうっかり喋りそうなのは誰？","一番、お金のためなら何でもやりそうなのは誰？","一番、夜の街に慣れていそうなのは誰？","一番、嘘をつくのがうまそうなのは誰？","一番、付き合ったら大変そうなのは誰？","一番、敵に回したくないのは誰？","一番モテそうな人は誰？","一番、手をつなぎたい人は誰？","一番、チューしたい相手は誰？","一番、今夜ワンナイトになりそうなのは誰？"];
export function pickPrompt(seen,random=Math.random,size=votePrompts.length){const all=Array.from({length:size},(_,i)=>i),left=all.filter(i=>!seen.has(i));const pool=left.length?left:all;return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];}
export const cards = {
 check: {title:'ドリンクタイム',rule:'8ターンごとに自動で始まります。結果発表 → 全員が「結果を確認した」→ お助けカード受付（30秒）→ イッテキーラ！'},
  rest: {title:'休憩カード',rule:'今の自分の状態を選ぶと、全員の状態が見える。確認するだけのカード。ターンには数えません。無理せず、水も飲もう。'},
 muttsuri: {title:'むっつりを探せ',rule:'お題に一番当てはまりそうな人に、全員が匿名で1票。得票1位がメーター＋1（同率1位はルーレットで1人）。'},
 tapking: {title:'タップ王',rule:'5秒間でボタンを連打。タップ回数が最も少ない人がメーター＋1（同数ならルーレットで1人）。'},
 majority: {title:'多数派だと思った？',rule:'A/Bの二択に全員が秘密で回答。人数を発表したあと、ルーレットで「A」か「B」が選ばれ、選んだ人がメーター＋1。全員同じ答えなら、次のお題で答え直し。'},
 mind: {title:'この中で一番は誰だ！',rule:'お題を読んで、「これはこの人！」と思う人に投票。一番票を集めた人がメーター＋1（同率ならルーレットで1人）。匿名投票です。'},
 vote: {title:'変態を探せ',rule:'お題に一番当てはまりそうな人に、全員が匿名で1票。得票1位がメーター＋1（同率1位はルーレットで1人）。'},
 king: {title:'👑 王様の命令',rule:'今回の担当が王様。相手を1人指名して口頭で命令。従えば何もなし、拒否するとメーター＋2。'},
 ten: {title:'10秒ジャスト', rule:'時計を見ずに10秒を狙ってSTOP。1人ずつ挑戦。10秒から最も遠い人がメーター＋1（同率で最も遠い人が複数いたら全員）。10秒±0.1秒以内の人はお助けカード獲得。'},
 buttons: {title:'そのボタン、押して大丈夫？',rule:'今回の担当が謎ボタンを2つのうち1つ選ぶ。中身は「自分がメーター」か「自分以外の全員がメーター」。配置は毎回シャッフル。'},
 mission: {title:'あなたのキスはどんな顔！？',rule:'担当は「やる」か「やらない」を選ぶ。やらないなら担当がメーター＋2。やるなら、ほかの人が「最高／いいね／やり直し」で採点。全員が最高なら担当にお助け＋1。'},
 danger: {title:'GO TO HEAVEN OR HELL',rule:'今回の担当が、タイプの人を1人誘う。断られたら誘った人がメーター＋1（相手は罰なし）。承諾ならルーレット：HEAVENは2人ともお助け獲得、HELLは2人ともメーター＋2。'},
 roulette: {title:'GO TO HEAVEN OR HELL',rule:'全員が1人ずつルーレットを回すゲームです。やる／やらないは任意。結果が気に入らなければ、もう一度回して上書きもできます（最大3段階）。最後はヘブンオアヘル：天国はお助け＋3、地獄はメーター＋5（ライム）。'},
 grid: {title:'そのボタン、押して大丈夫？',rule:'マス目のボタンを順番に押す。爆弾（メーター＋2・ここで終了）か、お助け（お助け＋1）か、空振りか…。各自最低1回は押す。'},
 reaction: {title:'ドキドキしてんじゃねーよ！',rule:'ハートの爆弾を回そう。爆発したとき持っていた人がメーター＋1。一番長く持っていた人は、爆発しなければお助け＋1、爆発したらメーター＋2。いつ爆発するかは誰にも分からない。'},
 battery: {title:'充電マウント合戦！', rule:'今の充電残量を入力。ウソ（ブラフ）を入れてもOK！全員が入力したら「ダウト」の時間（10秒）。ブラフだと思う人を1人選んでダウトできます（自分にはダウトできません）。ダウトされた人はスマホの充電画面を見せ、ダウトした人が成功／失敗を押します。成功なら疑われた人が、失敗ならダウトした人がメーター＋2。ダウトがあったらそこで終了。誰もダウトしなかったときだけ、HIGH／LOWを抽選（HIGHは最も多い人、LOWは最も少ない人。同率はルーレットで1人）。'},
};
// 出し方：1人用4種は一度出たら40ターン出ない。ほかの8種は1周するまで重複なし。
export const SPECIAL_CARDS=['ten','battery','reaction','tapking','buttons','mission','danger','king','roulette'];
export const VOTE_CARDS=['vote','muttsuri','mind','majority'];
export const ALL_CARDS=[...SPECIAL_CARDS,...VOTE_CARDS];
// 1人用（それぞれが1人で挑戦するゲーム）は、一度出たら40ターンは出ない。ほかの8種は1周するまで重複なし。
export const SOLO_CARDS=['ten','battery','reaction','tapking'];
export const SOLO_COOLDOWN=40;
export const LAP_CARDS=ALL_CARDS.filter(c=>!SOLO_CARDS.includes(c));
// exclude：いま出せないカード（山札で引いた分・直前に出たカード・本人がもう引いたキス顔など）
export function drawCard(random=Math.random,exclude=[]) {
 const left=ALL_CARDS.filter(c=>!exclude.includes(c)),pool=left.length?left:ALL_CARDS;
 return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
}
export function drawDirection(random=Math.random) {return random()<0.5?'HIGH':'LOW';}
export function targetsFor(card, results, direction) {
 const entries=Object.entries(results);
 const values=entries.map(([,value])=>card==='ten'?Math.abs(value-10000):value);
 const edge=(card==='battery'&&direction==='LOW')||card==='tapking'?Math.min(...values):Math.max(...values);
 return entries.filter(([,value])=>(card==='ten'?Math.abs(value-10000):value)===edge).map(([uid])=>uid);
}

// 2つのボタンのうち、中身は「自分が対象(1)」と「自分以外の全員が対象(2)」。3つ目(0)は使わない予備（ルールの形式のため）。
export function shuffleButtons(random=Math.random){return random()<0.5?[1,2,0]:[2,1,0];}

// 充電マウント合戦のダウト（0.69）。dbt: {ダウトした人: 疑われた人 or 'skip'}、dbj: {ダウトした人: 1=ダウト成功(ウソだった) / 0=失敗(ホントだった) / 2=判定なし}
export const hasDoubt=s=>!!s&&!!s.dbt&&Object.values(s.dbt).some(v=>v!=='skip');
// 成功：疑われた人がメーター＋2（同じ人が何人から疑われても＋2は1回）。失敗：ダウトした人がそれぞれ＋2。
export function doubtAmount(s,uid){
 let caught=false,failed=false;
 for(const [d,t] of Object.entries(s.dbt||{})){if(t==='skip')continue;const j=s.dbj?.[d];if(j===1&&t===uid)caught=true;if(j===0&&d===uid)failed=true;}
 return(caught?2:0)+(failed?2:0);
}
function drinkBase(state,uid,players){if(state.phase!=='results'||state.card==='check'||state.card==='rest')return 0;if(state.card==='battery'&&hasDoubt(state))return doubtAmount(state,uid);if(state.card==='majority')return state.mall||state.side===2?0:state.results?.[uid]===state.side?1:0;if(state.card==='vote'||state.card==='muttsuri'||state.card==='mind'){const slot=players?.find(p=>p.uid===uid)?.slot;return slot!==undefined&&state.topVotes!==undefined&&Number(state.votes?.[slot])===state.topVotes?1:0;}if(state.card==='grid')return uid===state.bx?2:0;if(state.card==='roulette')return meterOfCode(state.results?.[uid]);if(state.card==='reaction')return uid===state.bx?(state.bl===state.bx?2:1):0;if(state.card==='mission'){const actor=state.order[(state.round-1)%state.order.length];return uid===actor&&state.results?.[actor]===0?2:0;}if(state.card==='king'){const o=dangerOutcome(state);return o&&uid===o.target&&!o.accepted?2:0;}if(state.card==='danger'){const o=dangerOutcome(state);if(!o)return 0;return uid===o.actor?(!o.accepted?1:o.fate==='HELL'?2:0):uid===o.target&&o.accepted&&o.fate==='HELL'?2:0;}if(state.card==='buttons'){const actor=state.order[(state.round-1)%state.order.length];return state.buttonOutcome===2?(uid!==actor?1:0):state.buttonOutcome===1&&uid===actor?1:0;}return targetsFor(state.card||'ten',state.results,state.direction).includes(uid)?1:0;}

// Items are used by hand at the break-turn settlement (see tequilaOutcome); they no longer act when a ticket is credited.
export const items={
 barrier:{icon:'🛡️',name:'バリア',desc:'ドリンクタイムで自分に来た1杯を無効にする。',usable:true},
 cute:{icon:'🥺',name:'なすりつけ',desc:'ドリンクタイムで1杯が自分に来たとき、だれかになすりつける。',usable:true},
 angel:{icon:'👼',name:'身代わり',desc:'最終結果が出てからの10秒間に、飲む人の代わりに1杯を飲んであげる。',usable:true}
};
export const itemKinds=Object.keys(items);
// お助けカードは、バリア・なすりつけ・身代わりの3種からランダムに配る
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
 const actor=state.ky&&state.actor?state.actor:order[(state.round-1)%order.length],target=Object.keys(results).find(k=>k!==actor);
 if(!target)return null;
 return{actor,target,accepted:results[target]===1,fate:state.fate||null};
}
// 10秒ジャスト±0.5秒でお助けカード：Firebaseルール(grants)の更新を公開したあとに true にする
export let TEN_REWARD=true;
// キス顔の採点まとめ。担当の答え 1=やる 0=やらない／ほかの人 1=最高 2=いいね 3=やり直し
// ok＝全員が最高（担当にお助け）／counted＝「一人1回」に数える（やり直しがあって最高が0人のときは数えず、また選ばれうる）
export function missionStats(state){
 const order=Array.isArray(state?.order)?state.order:Object.values(state?.order||{}),actor=order[((state?.round||1)-1)%(order.length||1)],r=state?.results||{};
 if(!actor||r[actor]!==1)return{did:false,actor};
 const vs=Object.entries(r).filter(([u])=>u!==actor).map(([,v])=>v),best=vs.filter(v=>v===1).length,good=vs.filter(v=>v===2).length,redo=vs.filter(v=>v===3).length;
 return{did:true,actor,best,good,redo,ok:vs.length>0&&best===vs.length,counted:!(redo>0&&best===0)};
}
export function rewardees(state){
 if(!state||state.phase!=='results')return[];
 if(state.card==='mission'){const m=missionStats(state);return m.ok?[m.actor]:[];}
 if(state.card==='reaction')return state.bl&&state.bl!==state.bx?[state.bl]:[];
 if(state.card==='grid')return Object.entries(state.results||{}).filter(([,v])=>v>=100).map(([u])=>u);
 if(state.card==='roulette')return Object.entries(state.results||{}).filter(([,v])=>itemsOfCode(v)>0).map(([u])=>u);
 if(TEN_REWARD&&state.card==='ten')return Object.entries(state.results||{}).filter(([u,ms])=>typeof ms==='number'&&ms>=0&&Math.abs(ms-10000)<=100).map(([u])=>u);
 if(state.card==='danger'){const o=dangerOutcome(state);return o&&o.accepted&&o.fate==='HEAVEN'?[o.actor,o.target]:[];}
 if(state.card==='majority')return state.mall?Object.keys(state.results||{}):[];
 if(state.card==='king'){const o=dangerOutcome(state);return o&&o.accepted?[o.target]:[];}
 return[];
}

// A tie for the ticket is settled by a roulette: the host writes state.pick (one of the tied players). pick narrows the ticket to that one player.
export function drinkAward(state,uid,players){const b=drinkBase(state,uid,players);return state.pick&&uid!==state.pick?0:b;}
export function tiedTargets(state,players){return players.filter(p=>drinkBase(state,p.uid,players)>0).map(p=>p.uid);}
export const tieCards=['battery','tapking','vote','muttsuri','mind','majority']; // 10秒ジャストは同率全員（ルーレットなし）
// Settlement starts when pending tickets reach three, rather than on a fixed schedule.
export const checkStates=[['😊','まだまだ元気'],['🥴','ほろ酔い'],['😵','そろそろキツい'],['🚰','水が欲しい']];
export let REST_CARD=false; // 休憩カードは廃止(0.68)。ゲームの流れには出さない
export const BREAK_DRAWS=8;
export const breakPeriod=()=>BREAK_DRAWS+1; // legacy helper, no longer used to schedule settlement
export const isBreak=()=>false; // 休憩は8ターンごとにホストが開始する
export const turnsToBreak=(round,n)=>breakPeriod(n)-round%breakPeriod(n);
export function cardForRound(round,n,random=Math.random,exclude=[]){return drawCard(random,exclude);}

// ---- Tickets and the break-turn settlement ----------------------------------------------------------------
// Every lost round credits tickets (personal drinks/{round}). 3 tickets = 1 tequila. At a break turn R, each player's tickets of the whole game so far
// (rounds before R) are totalled against the last completed settlement marker; remainders carry over.
export const NOTCHES=5; // ショットメーターは5目盛り。5=ライム＝1杯確定
export const MAX_TEQUILA=10;
export function ticketWindow(round,n){const from=Math.max(1,round-breakPeriod(n)+1);return {from,to:round-1};}
export function sumTickets(map,from,to){let t=0;for(let r=from;r<=to;r++){const v=map?.[r]??map?.[String(r)];if(typeof v==='number')t+=v;}return t;}
// -> {tickets: メーター(前回の休憩から), lime, count:0}. 飲む杯数は全員を見比べて tequilaPlan で決める。メーターは休憩ごとに0に戻る(EASY)。
export function tequilaPlanOne(map,round,lastSettlement=0){
 const tickets=sumTickets(map,lastSettlement+1,round-1);
 return {tickets,carryIn:0,total:tickets,count:0,carry:0,lime:tickets>=NOTCHES};
}
// ライムの人は全員1杯。ライムがいなければ一番多い人（同率は全員）が1杯。全員0なら誰も飲まない。
export function tequilaPlan(drinkMaps,uids,round,lastSettlement=0){
 const out={};let max=0,lime=false;
 for(const u of uids){out[u]=tequilaPlanOne(drinkMaps?.[u],round,lastSettlement);max=Math.max(max,out[u].tickets);lime=lime||out[u].lime;}
 for(const u of uids)out[u].count=lime?(out[u].lime?1:0):(max>0&&out[u].tickets===max?1:0);
 return out;
}
// kept for the tickets-this-cool view
export function ticketsFor(drinkMaps,uids,round,n){const {from,to}=ticketWindow(round,n),out={};for(const u of uids)out[u]=sumTickets(drinkMaps?.[u],from,to);return out;}
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

// 王様の命令 54個（Notion 12-1〜12-54）。カテゴリー：エッジ 0〜12／ちょっとエッチ 13〜30／面白系 31〜40／スキンシップ系 41〜53（画面にカテゴリー名は出さない）
export const kingOrders=["人生で一番ヤバかった恋愛エピソードを話す", "今までの交際人数を正直に言う", "初体験の年齢を言う", "今までで一番ひどい嘘を白状する", "この中で付き合うなら誰か、理由つきで答える", "この中でセックスするなら誰か、理由つきで話す", "浮気（した・された）経験を話す", "人に言えない秘密を1つ打ち明ける", "一番恥ずかしかった失敗談を話す", "今までで一番年が離れていた人との話をする", "一番最近ついた嘘を白状する", "自分の性感帯を言う", "自分の性癖を言う", "好きなタイプを具体的に3つ言う", "今までで一番ドキッとしたセリフを再現する", "初キスの思い出を話す", "理想のデートの終わり方を、誘い文句つきで言ってみせる", "色っぽい声で、好きな食べ物を言う", "一番ときめいたシチュエーションを話す", "好きな人に使うとっておきの口説き文句を披露する", "一番ドキッとする仕草を実演する", "ホテルでやりたいことを1つ答える", "夜に連絡したくなる相手のタイプを言う", "恋人に言われたい甘い言葉を、ささやき声で言う", "一番好きなキスのシチュエーションを答える", "今夜、誰とお酒を飲み続けたいか指名する", "壁ドンされたい人を指名する", "色っぽい目線で、全員の目を順番に見る", "ムラッとする瞬間を答える", "異性の好きなファッションを答える", "自分のエッチの時の特技を話す", "好きなアニメか芸能人のものまねをする", "変顔を披露する", "3秒で一発ギャグをする", "犬になりきって3回回ってワンと鳴く", "好きな歌を1フレーズ熱唱する", "ドラマの名シーンを再現する（うろ覚えでOK）", "赤ちゃん言葉で自己紹介する", "全力でキメ顔をする", "キメポーズと決め台詞をやる", "全力でかめはめ波を撃つ", "王様とハイタッチする", "王様とハグする", "隣の人とハグする", "全員と順番にグータッチする", "好きな人を指名して、10秒間手をつなぐ", "王様と握手して「よろしく」と言う", "右隣の人と3秒間見つめ合う", "左隣の人とハイタッチして、褒め合う", "好きな人を指名して、軽くハグする", "王様と10秒間手をつなぐ", "王様の匂いを嗅ぐ", "好きな人を指名して匂いを嗅ぐ", "王様を指名してハグして、一言褒める"];
export const kingCats=[[0,13],[13,31],[31,41],[41,54]]; // [開始,終了) の番号範囲（カテゴリー別）
