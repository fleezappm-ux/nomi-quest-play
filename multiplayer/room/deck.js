// Titles and outcomes follow game-src/catalog.json and cards.js at v0.6.49.
export const cards = {
 ten: {title:'10秒ジャスト', rule:'時計を見ずに10秒を狙ってSTOP。10秒から最も遠い人が対象。同率は全員。'},
 battery: {title:'充電マウント合戦！', rule:'今の充電残量を入力。全員の回答後にHIGH／LOWを抽選。HIGHは最も多い人、LOWは最も少ない人。同率は全員対象。'}
};
export function drawCard(random=Math.random) {return random()<0.5?'ten':'battery';}
export function drawDirection(random=Math.random) {return random()<0.5?'HIGH':'LOW';}
export function targetsFor(card, results, direction) {
 const entries=Object.entries(results);
 const values=entries.map(([,value])=>card==='ten'?Math.abs(value-10000):value);
 const edge=card==='battery'&&direction==='LOW'?Math.min(...values):Math.max(...values);
 return entries.filter(([,value])=>(card==='ten'?Math.abs(value-10000):value)===edge).map(([uid])=>uid);
}
