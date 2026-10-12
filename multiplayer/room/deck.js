// Titles and outcomes follow game-src/catalog.json and cards.js at v0.6.49.
export const muttsuriPrompts=["一番むっつりだと思う人は？", "普段おとなしいのに夜は激しそうな人は？", "スマホの検索履歴が一番ヤバそうな人は？", "実は一番経験豊富そうな人は？", "真面目な顔で妄想が止まらなそうな人は？", "ひとりの時間が多そうな人は？", "秘密のアカウントを持ってそうな人は？", "こっそりコレクションを隠してそうな人は？", "清楚に見えてギャップがありそうな人は？", "ベッドの上で豹変しそうな人は？", "夜ふかしして動画を見てそうな人は？", "下ネタに赤くなるけど実は好きな人は？", "写真フォルダに秘密がありそうな人は？", "合コンで静かに本命を狙ってそうな人は？", "実は一番ロマンチストな妄想家は？", "ばれないように準備だけは万全な人は？"];
export const votePrompts=["エロそうな人は？","エッチが上手そうな人は？","むっつりスケベは誰？","電マ使ってそうな人は？","ウーマナイザー使ってそうな人は？","同人誌好きそうな人は？","今夜ホテルへ行きたいと思ってそうな人は？","パンツの臭いをこっそり嗅いでそうな人は？","浮気をしそうな人は？","複数プレイが好きそうな人は？","NTR（ネトラレ）が好きそうな人は？","ハメ撮りが好きそうな人は？","舐めるの好きそうな人は？"];
// the topic index to ask next: avoid the ones this device already saw in the room, start over when all were used
export const majorityPrompts=[["海派","山派"],["朝型","夜型"],["甘いもの","しょっぱいもの"],["旅行したい","家でゆっくり"],["犬派","猫派"],["計画して動く","気分で動く"],["セックスは好き","セックスは嫌い"],["セックスで演技する","セックスで演技しない"],["セックスをしたことある","セックスをしたことない"],["かめはめ波が撃てる","かめはめ波が撃てない"],["今日ラブホテルに行きたい","今日ラブホテルに行きたくない"],["1週間以内にセックスした","1週間以内にセックスしてない"],["私はエロい","私はエロくない"]];
export const mindPrompts=[["休日は予定を詰める","休日は何も決めない"],["初めての店を開拓","いつもの店で安心"],["旅行は温泉","旅行はテーマパーク"],["旅先で早起き","旅先で朝寝坊"],["写真をたくさん撮る","目で見て楽しむ"],["待ち合わせは早めに着く","時間ぴったりに着く"],["買う前に比較する","直感で買う"],["好きな曲をリピート","新しい曲を探す"],["映画は大画面で","映画は家でくつろいで"],["遊園地は絶叫系","遊園地は観覧車"],["焼肉はごはんと一緒","焼肉は肉だけを楽しむ"],["最後の一口は好きなもの","好きなものから先に食べる"],["ラーメンはこってり","ラーメンはあっさり"],["朝食はパン","朝食はごはん"],["鍋の締めはうどん","鍋の締めは雑炊"],["ピザは薄い生地","ピザは厚い生地"],["かき氷はフルーツ味","かき氷はミルク味"],["目玉焼きはしょうゆ","目玉焼きはソース"],["ポテトは細いタイプ","ポテトは太いタイプ"],["旅行のお土産は食べ物","旅行のお土産は記念品"],["サプライズをしたい","事前に相談したい"],["誘われたらすぐ返事","予定を見てから返事"],["友達と会うなら大人数","友達と会うなら少人数"],["会話は聞くのが好き","会話は話すのが好き"],["ゲームは協力プレイ","ゲームは対戦プレイ"],["勝負は慎重に進める","勝負は大胆に攻める"],["超能力なら空を飛ぶ","超能力なら瞬間移動"],["1日だけなら未来へ","1日だけなら過去へ"],["宝くじが当たったら旅行","宝くじが当たったら貯金"],["無人島に持つならナイフ","無人島に持つなら鍋"],["住むなら都会","住むなら静かな町"],["部屋はすっきり派","部屋は好きなものでいっぱい"],["服は着心地優先","服は見た目優先"],["雨の日は外へ出る","雨の日は家で過ごす"],["海で過ごすなら泳ぐ","海で過ごすなら砂浜で休む"],["山で過ごすなら登る","山で過ごすならキャンプ"],["一週間休めたら遠出","一週間休めたら地元で休む"],["新しい趣味は道具から","新しい趣味はまず体験"],["本を読むなら紙","本を読むなら電子"],["自由時間は運動","自由時間は創作"]];
export function pickPrompt(seen,random=Math.random,size=votePrompts.length){const all=Array.from({length:size},(_,i)=>i),left=all.filter(i=>!seen.has(i));const pool=left.length?left:all;return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];}
export const cards = {
 muttsuri: {title:'むっつりを探せ',rule:'お題に一番当てはまりそうな人に、全員が匿名で1票。得票1位がDRINK＋1（同率1位は全員）。'},
 tapking: {title:'タップ王',rule:'5秒間でボタンを連打。タップ回数が最も少ない人がDRINK＋1（同数なら全員）。'},
 majority: {title:'多数派だと思った？',rule:'A/Bの二択に全員が秘密で回答。多数派がDRINK＋1。同数なら全員がDRINK＋1。'},
 mind: {title:'お前ならそうすると思ったよ',rule:'今回の担当がA/Bを秘密に選び、残りの全員がそれを予想。外した人がDRINK＋1。'},
 vote: {title:'変態を探せ',rule:'お題に一番当てはまりそうな人に、全員が匿名で1票。得票1位がDRINK＋1（同率1位は全員）。'},
 king: {title:'👑 王様の命令',rule:'今回の担当が王様。相手を1人指名して口頭で命令。従えば何もなし、拒否するとDRINK＋2（可愛いだけじゃダメですか？でパス可）。'},
 ten: {title:'10秒ジャスト', rule:'時計を見ずに10秒を狙ってSTOP。10秒から最も遠い人が対象。同率は全員。'},
 buttons: {title:'そのボタン、押して大丈夫？',rule:'今回の担当が謎ボタンを1つ選ぶ。中身は回避・自分が対象・全員が対象。配置は毎回シャッフル。'},
 mission: {title:'あなたのキスはどんな顔！？',rule:'今回の担当がキス顔に挑戦。自己申告で完了。できなければDRINK＋1。可愛いだけじゃダメですか？のお助けでパスできます。'},
 danger: {title:'GO TO HEAVEN OR HELL',rule:'今回の担当が1人を誘う。断られたら誘った人がDRINK＋1（相手は罰なし）。承諾ならルーレット：HEAVENは2人ともお助け獲得、HELLは2人ともDRINK＋2。'},
 reaction: {title:'ドキドキしてんじゃねーよ！',rule:'色ではなく形がハートのものをタップ（青いハートも正解）。最速の人はお助けを獲得、最遅・失敗の人はDRINK＋1。早押し・違う形・3秒無反応は失敗。全員失敗ならお助けなし。'},
 battery: {title:'充電マウント合戦！', rule:'今の充電残量を入力。全員の回答後にHIGH／LOWを抽選。HIGHは最も多い人、LOWは最も少ない人。同率は全員対象。'}
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

export function drinkAward(state,uid,players){if(state.phase!=='results')return 0;if(state.card==='majority')return state.side===2||state.results?.[uid]===state.side?1:0;if(state.card==='mind'){const a=state.actor;return uid!==a&&state.results?.[uid]!==state.results?.[a]?1:0;}if(state.card==='vote'||state.card==='muttsuri'){const slot=players?.find(p=>p.uid===uid)?.slot;return slot!==undefined&&state.topVotes!==undefined&&Number(state.votes?.[slot])===state.topVotes?1:0;}if(state.card==='mission'){const actor=state.order[(state.round-1)%state.order.length];return uid===actor&&state.results?.[actor]===0?1:0;}if(state.card==='king'){const o=dangerOutcome(state);return o&&uid===o.target&&!o.accepted?2:0;}if(state.card==='danger'){const o=dangerOutcome(state);if(!o)return 0;return uid===o.actor?(!o.accepted?1:o.fate==='HELL'?2:0):uid===o.target&&o.accepted&&o.fate==='HELL'?2:0;}if(state.card==='buttons'){const actor=state.order[(state.round-1)%state.order.length];return state.buttonOutcome===2||state.buttonOutcome===1&&uid===actor?1:0;}return targetsFor(state.card||'ten',state.results,state.direction).includes(uid)?1:0;}

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
