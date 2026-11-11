"use strict";
// t2615u: level-up stat screen minus button, same look as character creation.
// Minus only removes points added in this session; never below the pre-session value.
// Points lock when the skills page shows, the character menu closes, or a non-character page opens.
// Back from the stats screen to the sheet, or from the sheet to the party list, does not lock.
// Usage: node --test tests/t2615u_levelminus_test.js
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const plain=o=>JSON.parse(JSON.stringify(o));
const flow=read('tests/tavern_shop_camp_flow_test.js');
let source=flow.slice(flow.indexOf('function harness'),flow.indexOf('\nfor(let t=0'));
// The flow harness predates maze-slot sync at party.js load; stub the hooks so the IIFE can finish.
source=source.replace('storyOpen:()=>story}','storyOpen:()=>story,setMazeSlots(){},mazeSlots:()=>[null,null,null,null]}');
const baseHarness=eval('('+source+')');
function harness(init){const h=baseHarness(init),create=h.document.createElement;h.document.createElement=t=>{const e=create(t);if(t==='canvas'){e.toDataURL=()=>'data:,';e.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},width:0})});}return e;};h.c.Image=class{constructor(){this.complete=false;}};return h;}

function ready(h){
  const c=h.r.live().party[0];
  // Level 2 with 4 unspent points, stats still at the post-creation values (base, spent already counted as 10).
  c.lvl=2;c.spent=h.R.pointsEarned(1);c.hp=h.R.maxHp(c,1);c.mp=h.R.maxMp(c);
  return c;
}
function rowBtns(h,k){
  return {
    minus:h.ov.querySelector('[data-dec='+k+']'),
    plus:h.ov.querySelector('[data-raise='+k+']'),
    off:cls=>cls&&cls.className.split(/\s+/).includes('off')
  };
}

test('t2615u pins: VER 94, party v34, rules v22 in index.html and sw.js; wait wording unchanged',()=>{
  const html=read('index.html'),sw=read('sw.js'),party=read('party.js');
  a.match(sw,/^const VER="99",CACHE="sota-s1-v"\+VER/);
  for(const p of ['party.js?v=37','rules.js?v=22'])for(const s of [html,sw])a.ok(s.includes(p),p);
  a.equal(html.includes('party.js?v=36'),false);
  a.equal(sw.includes('party.js?v=36'),false);
  a.equal(html.includes('rules.js?v=21'),false);
  a.equal(sw.includes('rules.js?v=21'),false);
  a.ok(party.includes('const WAIT_UPDATE="Please wait for update to continue.";'));
});

test('t2615u rules.lower refunds the raise cost and refuses to go below the floor',()=>{
  const R=require('../rules.js');
  const c=R.newChar('T','human','warrior',{str:0,sta:0,con:0,man:0},R.SKILLS.warrior[0].id);
  c.lvl=2;c.spent=R.pointsEarned(1);
  const floor=c.stats.str,left0=R.pointsEarned(c.lvl)-c.spent,cost=R.cost(c.stats.str);
  a.equal(R.raise(c,'str'),true);
  a.equal(c.stats.str,floor+1);
  a.equal(R.pointsEarned(c.lvl)-c.spent,left0-cost);
  a.equal(R.lower(c,'str',floor),true);
  a.equal(c.stats.str,floor);
  a.equal(R.pointsEarned(c.lvl)-c.spent,left0);
  a.equal(R.lower(c,'str',floor),false,'blocked at the session floor');
  a.equal(c.stats.str,floor);
});

test('t2615u add, remove, and remove blocked at the base value',()=>{
  const h=harness(),c=ready(h);
  const base=plain(c.stats),spent0=c.spent,left0=h.R.pointsEarned(c.lvl)-c.spent;
  h.r.statScreen(0);
  const first=rowBtns(h,'str');
  a.ok(first.minus&&first.plus,'minus and plus are present');
  a.ok(first.off(first.minus),'minus starts off at the pre-session value');
  a.equal(first.off(first.plus),false);
  // clicking the off minus must not change anything
  h.click(first.minus);
  a.deepEqual(c.stats,base);
  a.equal(c.spent,spent0);
  // add
  h.click(rowBtns(h,'str').plus);
  a.equal(c.stats.str,base.str+1);
  a.equal(h.R.pointsEarned(c.lvl)-c.spent,left0-h.R.cost(base.str));
  const mid=rowBtns(h,'str');
  a.equal(mid.off(mid.minus),false,'minus is on after a spend');
  // take the point back
  h.click(mid.minus);
  a.equal(c.stats.str,base.str);
  a.equal(c.spent,spent0);
  a.equal(h.R.pointsEarned(c.lvl)-c.spent,left0);
  const after=rowBtns(h,'str');
  a.ok(after.off(after.minus),'minus is off again at the base value');
  h.click(after.minus);
  a.equal(c.stats.str,base.str,'still blocked at the base value');
});

test('t2615u HP and MP max and current move both ways; add-then-remove does not gift current HP/MP',()=>{
  const h=harness(),c=ready(h);
  // wounded: current is below max so a gift would be visible
  const mh0=h.R.maxHp(c,1),mm0=h.R.maxMp(c);
  c.hp=Math.max(1,mh0-10);c.mp=Math.max(0,mm0-6);
  const hp0=c.hp,mp0=c.mp;
  h.r.statScreen(0);
  h.click(rowBtns(h,'con').plus);
  const mh1=h.R.maxHp(c,1);
  a.ok(mh1>mh0,'CON raise grows max HP');
  a.equal(c.hp,hp0+(mh1-mh0),'current HP grows by the max delta');
  a.ok(c.hp<=mh1,'current HP never above the new max');
  h.click(rowBtns(h,'con').minus);
  a.equal(h.R.maxHp(c,1),mh0);
  a.equal(c.hp,hp0,'add-then-remove does not gift HP');
  h.r.statScreen(0);
  h.click(rowBtns(h,'man').plus);
  const mm1=h.R.maxMp(c);
  a.ok(mm1>mm0,'MAN raise grows max MP');
  a.equal(c.mp,mp0+(mm1-mm0),'current MP grows by the max delta');
  a.ok(c.mp<=mm1,'current MP never above the new max');
  h.click(rowBtns(h,'man').minus);
  a.equal(h.R.maxMp(c),mm0);
  a.equal(c.mp,mp0,'add-then-remove does not gift MP');
  // full pools: add then remove returns to the original full values, never above
  c.hp=h.R.maxHp(c,1);c.mp=h.R.maxMp(c);
  const fullHp=c.hp,fullMp=c.mp;
  h.r.statScreen(0);
  h.click(rowBtns(h,'con').plus);
  a.equal(c.hp,h.R.maxHp(c,1));
  h.click(rowBtns(h,'con').minus);
  a.equal(c.hp,fullHp);
  a.equal(c.hp,h.R.maxHp(c,1));
  h.r.statScreen(0);
  h.click(rowBtns(h,'man').plus);
  a.equal(c.mp,h.R.maxMp(c));
  h.click(rowBtns(h,'man').minus);
  a.equal(c.mp,fullMp);
  a.equal(c.mp,h.R.maxMp(c));
});

test('t2615u points lock when the skills page shows; minus is off and does nothing after',()=>{
  const h=harness(),c=ready(h);
  const base=c.stats.str;
  h.r.statScreen(0);
  h.click(rowBtns(h,'str').plus);
  a.equal(c.stats.str,base+1);
  const spent=c.spent;
  h.r.skillScreen(0);
  a.equal(h.r.ui(),'skill');
  h.r.statScreen(0);
  const b=rowBtns(h,'str');
  a.ok(b.off(b.minus),'minus is off after the skills page');
  h.click(b.minus);
  a.equal(c.stats.str,base+1,'locked value stays');
  a.equal(c.spent,spent);
});

test('t2615u points lock when the character menu closes; going back to the sheet without closing does not lock',()=>{
  const h=harness(),c=ready(h);
  const base=c.stats.str;
  h.r.statScreen(0);
  h.click(rowBtns(h,'str').plus);
  a.equal(c.stats.str,base+1);
  // Back to the character sheet (not a close) keeps the session
  h.click(h.ov.querySelector('.s4back'));
  a.equal(h.r.ui(),'equip');
  h.r.statScreen(0);
  const still=rowBtns(h,'str');
  a.equal(still.off(still.minus),false,'minus still works after Back to the sheet');
  h.click(still.minus);
  a.equal(c.stats.str,base);
  h.click(rowBtns(h,'str').plus);
  a.equal(c.stats.str,base+1);
  const spent=c.spent;
  h.r.closeUI();
  a.equal(h.r.ui(),null);
  h.r.statScreen(0);
  const locked=rowBtns(h,'str');
  a.ok(locked.off(locked.minus),'minus is off after close');
  h.click(locked.minus);
  a.equal(c.stats.str,base+1);
  a.equal(c.spent,spent);
});

test('t2615u save and load keep the locked values',()=>{
  const h=harness(),c=ready(h);
  const base=c.stats.str;
  h.r.statScreen(0);
  h.click(rowBtns(h,'str').plus);
  a.equal(c.stats.str,base+1);
  const locked={stats:plain(c.stats),spent:c.spent,hp:c.hp,mp:c.mp};
  h.r.closeUI(); // lock
  a.equal(h.r.doSave(),true,'saved at the tavern');
  // scramble live state, then load
  c.stats.str=base;c.spent=h.R.pointsEarned(1);c.hp=1;c.mp=0;
  const slot=h.r.activeSlot();
  a.equal(h.r.loadSlot(slot),true);
  const loaded=h.r.live().party[0];
  a.equal(JSON.stringify(loaded.stats),JSON.stringify(locked.stats));
  a.equal(loaded.spent,locked.spent);
  a.equal(loaded.hp,locked.hp);
  a.equal(loaded.mp,locked.mp);
  // after load, a new session cannot take the locked point back
  h.r.statScreen(0);
  const b=rowBtns(h,'str');
  a.ok(b.off(b.minus));
  h.click(b.minus);
  a.equal(h.r.live().party[0].stats.str,locked.stats.str);
});

test('t2615u after spending all points, Back shows Change points and minus still works',()=>{
  const h=harness(),c=ready(h);
  const base=plain(c.stats),spent0=c.spent,left0=h.R.pointsEarned(c.lvl)-c.spent;
  h.r.statScreen(0);
  let guard=0;
  while(h.R.pointsEarned(c.lvl)-c.spent>0){
    const key=['str','sta','con','man'].find(k=>{const b=rowBtns(h,k);return b.plus&&!b.off(b.plus);});
    a.ok(key,'an affordable plus should exist while points remain');
    h.click(rowBtns(h,key).plus);
    a.ok(++guard<40,'spend loop');
  }
  a.equal(h.R.pointsEarned(c.lvl)-c.spent,0);
  a.ok(c.stats.str>base.str);
  h.click(h.ov.querySelector('.s4back'));
  a.equal(h.r.ui(),'equip');
  const btn=h.ov.querySelector('[data-stats]');
  a.ok(btn,'button is shown at 0 points left');
  a.equal(btn.textContent,'Change points');
  h.click(btn);
  a.equal(h.r.ui(),'stats');
  const liveMinus=['str','sta','con','man'].some(k=>{const b=rowBtns(h,k);return b.minus&&!b.off(b.minus);});
  a.equal(liveMinus,true,'minus still works');
  let back=0;
  while(['str','sta','con','man'].some(k=>{const b=rowBtns(h,k);return b.minus&&!b.off(b.minus);})){
    const key=['str','sta','con','man'].find(k=>{const b=rowBtns(h,k);return b.minus&&!b.off(b.minus);});
    h.click(rowBtns(h,key).minus);
    a.ok(++back<40,'take-back loop');
  }
  a.deepEqual(c.stats,base);
  a.equal(c.spent,spent0);
  a.equal(h.R.pointsEarned(c.lvl)-c.spent,left0);
});

test('t2615u opening a non-character page locks; Back from the sheet to the party list does not',()=>{
  const h=harness(),c=ready(h);
  a.equal(h.r.doSave(),true,'saved so the party list can show the last-save line');
  const base=c.stats.str;
  h.r.statScreen(0);
  h.click(rowBtns(h,'str').plus);
  a.equal(c.stats.str,base+1);
  // Back to the sheet, then Back to the party list: session stays live
  h.click(h.ov.querySelector('.s4back'));
  a.equal(h.r.ui(),'equip');
  h.click(h.ov.querySelector('.s4back'));
  a.equal(h.r.ui(),'party');
  h.r.statScreen(0);
  const still=rowBtns(h,'str');
  a.equal(still.off(still.minus),false,'minus still works after Back to the party list');
  h.click(still.minus);
  a.equal(c.stats.str,base);
  h.click(rowBtns(h,'str').plus);
  a.equal(c.stats.str,base+1);
  const spent=c.spent;
  h.r.s5.tavernScreen(0,false);
  a.equal(h.r.ui(),'tavern');
  h.r.statScreen(0);
  const locked=rowBtns(h,'str');
  a.ok(locked.off(locked.minus),'minus is off after a tavern page');
  h.click(locked.minus);
  a.equal(c.stats.str,base+1,'locked value stays after tavern');
  a.equal(c.spent,spent);
  // a later camp page also keeps the lock (new session floor is the locked value)
  h.r.s5.campScreen(0);
  a.equal(h.r.ui(),'camp');
  h.r.statScreen(0);
  const stillLocked=rowBtns(h,'str');
  a.ok(stillLocked.off(stillLocked.minus),'minus stays off after a camp page');
  h.click(stillLocked.minus);
  a.equal(c.stats.str,base+1);
});

test('t2615u minus never drops a living hero below 1 HP; a KO stays at 0',()=>{
  const h=harness(),c=ready(h);
  const mh0=h.R.maxHp(c,1);
  h.r.statScreen(0);
  h.click(rowBtns(h,'con').plus);
  h.click(rowBtns(h,'con').plus);
  const mh1=h.R.maxHp(c,1);
  a.ok(mh1>=mh0+8,'two CON raises grow max HP');
  c.hp=2;
  h.click(rowBtns(h,'con').minus);
  a.equal(c.hp,1,'living hero stays at 1 HP');
  h.click(rowBtns(h,'con').minus);
  a.equal(c.hp,1,'still 1 after another minus');
  a.ok(c.hp>0);
  h.r.closeUI();
  c.hp=0;
  h.r.statScreen(0);
  h.click(rowBtns(h,'con').plus);
  a.equal(c.hp,0,'plus does not revive');
  const after=rowBtns(h,'con');
  a.equal(after.off(after.minus),false,'minus is on after the raise');
  h.click(after.minus);
  a.equal(c.hp,0,'minus leaves a KO at 0');
});
