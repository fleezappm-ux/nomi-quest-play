import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Execute the real attachTen disposer with live resource registries.
// An unsubscribe/cancel removes the resource; an omitted one stays active.
const file=process.argv[2]||new URL('../multiplayer/room/ten.js',import.meta.url);
const src=readFileSync(file,'utf8');
const start=src.lastIndexOf(' return()=>{');
assert.ok(start>=0,'attachTen disposer must exist');
const disposeSource=src.slice(start+1,src.lastIndexOf('\n}')).replace(/^return/,'');
const subscriptions=['nvStop','inviteStop','tqStop','dtStop','dgStop','answerStop','ownStop','settledStop','btStop','gmStop','gmRqStop','gmLayStop','gmHintStop','rlStop','bmStop','bmXStop','bmWStop','bmRdyStop','gateGoStop','kgStop'];
const intervals=['cdTimer','btHostTimer','btCd','gmTimer','rlHostT','bmTimer','bmTick'];
const timeouts=['tapTimer','pickTimer','spinTimer','flipTimer','hlTimer','revealTm','botTimer','angelBotTimer','rlTimerT','bmLockTimer','bmWaitT','introTimer'];
for(let cycle=0;cycle<25;cycle++){
 const active=new Set(),cancelled=new Set(),listeners=new Set(['popstate','nq-help','nq-members','nq-conn']);
 let viewStopped=0,boxCleared=0;
 const classes=new Set(['glowTab','helpGlow']);
 const stub={dead:false,onPop:()=>{},onHelp:()=>{},onMembers:()=>{},onConn:()=>{},
  closeDtHelp:()=>assert.equal(stub.dead,true,'mark disposed before closing UI'),
  closeCardHelp:()=>{},introEl:{remove(){}},clearFx:()=>{},rxClear:()=>{},
  window:{removeEventListener:n=>listeners.delete(n)},
  document:{removeEventListener:n=>listeners.delete(n),getElementById:()=>({classList:{remove:(...ns)=>ns.forEach(n=>classes.delete(n))}})},
  box:{replaceChildren:()=>boxCleared++},
  clearInterval:id=>{active.delete(id);cancelled.add(id);},
  clearTimeout:id=>{active.delete(id);cancelled.add(id);},
  rlView:{stop:()=>viewStopped++},
 };
 for(const n of subscriptions){active.add(n);stub[n]=()=>active.delete(n);}
 for(const n of [...intervals,...timeouts]){active.add(n);stub[n]=n;}
 for(const [obj,key] of [['gTel','rt'],['gAnim','rt']]){const id=obj+'.'+key;active.add(id);stub[obj]={[key]:id};}
 stub.bmCd=['countdown-1','countdown-2'];stub.bmCd.forEach(x=>active.add(x));
 stub.stops=['state','deck'].map(x=>{active.add(x);return()=>active.delete(x);});
 stub.allDrinksStops=['personal-a','personal-b'].map(x=>{active.add(x);return()=>active.delete(x);});
 const dispose=vm.runInNewContext('('+disposeSource.replace(/;\s*$/,'')+')',stub);
 dispose();
 assert.deepEqual([...active],[],'all game resources must be released');
 assert.equal(listeners.size,0);
 assert.equal(viewStopped,1);
 assert.equal(boxCleared,1);
 assert.equal(classes.size,0);
 dispose();assert.equal(viewStopped,1,'dispose must be idempotent');
}
console.log('PASS: 25 teardown cycles; game subscriptions, timers, listeners and roulette view released; disposal is idempotent.');
