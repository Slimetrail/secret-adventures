"use strict";
// Jeremy t2759u special class gear in party.js (shop warning, hero-only use, used up, hide smell, rope, crystal ball, lockpick, saves).
// Node only, party.js in the shared tavern/shop/camp harness (read from tests/tavern_shop_camp_flow_test.js, not changed).
// Usage: node --test tests/t2759u_special_gear_party_test.js
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const plain=o=>JSON.parse(JSON.stringify(o));
const flow=read('tests/tavern_shop_camp_flow_test.js');
let hsrc=flow.slice(flow.indexOf('function harness'),flow.indexOf('\nfor(let t=0'));
const LOADS="for(const f of ['maze-data.js','content-cap.js','rules.js','econ.js'])";a.ok(hsrc.includes(LOADS));a.ok(hsrc.includes('storyOpen:()=>story};'));
hsrc=hsrc.replace(LOADS,"for(const f of ['maze-data.js','content-cap.js','rules.js','gear.js','econ.js'])")
 .replace('storyOpen:()=>story};','storyOpen:()=>story,setMazeSlots(){},panelOpen:()=>false,mapOpen:()=>false,puzzleOpen:()=>false,roomAt:(x,y)=>{const r=M.rooms.find(r=>r.c[0]===x&&r.c[1]===y);return r?r.id:-1;},seamTavernAt:(x,y)=>({"14,49":0,"14,48":0,"18,24":1,"19,24":1,"51,14":2,"51,15":2,"46,48":3,"47,48":3})[x+","+y]??-1};');
const baseHarness=eval('('+hsrc+')');
function harness(init,cls='warrior',stat=15){const h=baseHarness(init||{}),create=h.document.createElement;h.document.createElement=t=>{const e=create(t);if(t==='canvas'){e.toDataURL=()=>'data:,';e.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},width:0})});}return e;};h.c.Image=class{constructor(){this.complete=false;}};
 h.S.intro={showTitle(){}};h.wiped=[];h.S.wipeZone=z=>{h.wiped.push(z);return 1;};h.found=new Set();h.S.map={isFound:(x,y)=>h.found.has(y*h.M.n+x)};h.S.core.mask=h.M.mask;h.S.archAhead=()=>-1;
 if(!init){const L=h.r.live(),hero=L.party[0];hero.cls=cls;hero.race='human';hero.stats[{warrior:'str',mage:'man',rogue:'sta',archer:'sta'}[cls]]=stat;}
 return h;}
const N=65,q=(h,s)=>h.ov.querySelector(s),qa=(h,s)=>h.ov.querySelectorAll(s),body=(h,s)=>h.document.body.querySelector(s);
const hero=h=>h.r.live().party[0],bagHas=(h,id)=>h.r.live().party.flatMap(c=>c.bag).filter(x=>x===id).length;
const at=(h,x,y,f=0)=>Object.assign(h.pos,{x,y,f});
const give=(h,id,who=0)=>h.r.live().party[who].bag.push(id);

test('shop: Special gear lists all four in every tavern; the price is the zone\'s and above every other shop item; other classes are greyed',()=>{
 for(const [t,x,y,z] of [[0,14,49,1],[0,14,48,2],[1,19,24,3],[2,51,15,4],[3,46,48,5]]){const h=harness();at(h,x,y);h.r.live().gold=5000;h.r.s5.shopList(t,'craft');
  const rows=qa(h,'[data-special]');a.deepEqual(rows.map(r=>r.dataset.special),['g_lockpick','g_crystal','g_hide','g_rope'],'tavern '+(t+1));
  const price=[0,150,250,400,600,900][z];for(const r of rows)a.match(r.querySelector('.s4on').textContent,new RegExp(' · '+price+'g'));
  const others=qa(h,'[data-buy]').filter(r=>!r.dataset.special).map(r=>+r.querySelector('.s4on').textContent.match(/ · (\d+)g/)[1]);a.ok(Math.max(...others)<price,'zone '+z+' gear is the priciest');
  a.deepEqual(rows.map(r=>r.classList.contains('off')),[true,true,true,false],'only the warrior hero row is open');
  a.match(rows[0].querySelector('.s4on').textContent,/Rogue only/);}});

test('buying: the small "Use at your own risk" warning shows before any gold is taken; Cancel keeps the gold; Buy takes the zone price',()=>{
 const h=harness();at(h,14,49);h.r.live().gold=1000;h.r.s5.shopList(0,'craft');
 h.click(q(h,'[data-special="g_rope"]'));const p=body(h,'#s7risk');a.ok(p,'warning box');a.equal(p.querySelector('[data-risk]').textContent,'Use at your own risk');
 a.equal(h.r.live().gold,1000,'no gold yet');a.equal(bagHas(h,'g_rope'),0);
 h.click(p.querySelector('[data-riskcancel]'));a.equal(body(h,'#s7risk'),null);a.equal(h.r.live().gold,1000);a.equal(bagHas(h,'g_rope'),0);
 h.click(q(h,'[data-special="g_rope"]'));h.click(body(h,'[data-riskbuy]'));a.equal(h.r.live().gold,850);a.equal(bagHas(h,'g_rope'),1);
 // not enough gold: Buy is disabled and nothing changes
 h.r.live().gold=100;h.r.s5.shopList(0,'craft');h.r.special.ask('g_rope',0);a.equal(body(h,'[data-riskbuy]').disabled,true);h.click(body(h,'[data-riskbuy]'));a.equal(h.r.live().gold,100);
 // wrong class: no warning box and no sale
 h.r.special.closeAsk();a.equal(h.r.special.ask('g_crystal',0),null);a.equal(h.r.special.buy('g_crystal',0),false);a.equal(bagHas(h,'g_crystal'),0);});

test('hero only and class only; a refused use keeps the item; a companion of the right class cannot use it',()=>{
 const h=harness();const L=h.r.live();const c=h.R.makeCompanion({name:'Mira',race:'cat',cls:'rogue',alloc:{sta:3},skill:'stab'},1);L.party.push(c);
 give(h,'g_lockpick',1);give(h,'g_crystal');at(h,0,43);
 let r=h.r.special.use('g_crystal');a.equal(r.ok,false);a.match(r.why,/Only a Mage hero/);a.equal(bagHas(h,'g_crystal'),1);
 r=h.r.special.use('g_lockpick',{room:3});a.equal(r.ok,false);a.match(r.why,/Only a Rogue hero/);a.equal(bagHas(h,'g_lockpick'),1);
 give(h,'g_rope');hero(h).hp=0;r=h.r.special.use('g_rope');a.equal(r.ok,false);a.match(r.why,/knocked out/);a.equal(bagHas(h,'g_rope'),1);});

test('the roll uses only the item stat: STR 8 = 25%, 15 = 50%, 30+ = 75% (capped); pass or fail, the item is used up',()=>{
 for(const [s,p] of [[8,0.25],[15,0.5],[30,0.75],[61,0.75]]){const h=harness(null,'archer',s);hero(h).lvl=50;give(h,'g_hide');give(h,'g_hide');at(h,0,43);
  h.r.special.setRoll(()=>p-0.001);let r=h.r.special.use('g_hide');a.equal(r.ok,true);a.equal(r.pass,true);a.equal(r.p,p);a.equal(bagHas(h,'g_hide'),1,'used up on a pass');
  h.r.live().hide=null;h.r.special.setRoll(()=>p);r=h.r.special.use('g_hide');a.equal(r.pass,false);a.equal(bagHas(h,'g_hide'),0,'used up on a fail');}});

function firstFight(setup,steps=400){const h=harness(null,'archer',15);h.enableHooks();at(h,0,43);setup(h);h.S.storyOpen=()=>false;
 for(let k=1;k<=steps;k++){h.S.afterStep(-1);if(h.r.fight())return k;}return null;}
test('hide smell pass: no random fights for its time; monster doors still fight; fail = the same x3 path as Stinky stew, never stacked',()=>{
 const normal=firstFight(()=>{}),pass=firstFight(h=>{h.r.live().hide={mode:'pass',left:300000};});
 const stink=firstFight(h=>{h.r.live().stink=999;}),fail=firstFight(h=>{h.r.live().hide={mode:'fail',left:300000};}),both=firstFight(h=>{h.r.live().stink=999;h.r.live().hide={mode:'fail',left:300000};});
 a.ok(normal>0,'a normal walk meets a monster');a.equal(pass,null,'400 steps, no random fight');a.equal(fail,stink,'fail = stew x3');a.equal(both,stink,'no x9');a.ok(fail<=normal);
 const h=harness(null,'archer',15);h.enableHooks();h.r.live().hide={mode:'pass',left:300000};h.S.onRoomOpen(h.M.rooms.find(r=>r.k==='monster').id);a.ok(h.r.fight(),'a monster door still fights');});

test('hide smell timer: 5 minutes of maze time; paused while a screen is open; kept in a save and back on load; old saves have none',()=>{
 const h=harness(null,'archer',30);give(h,'g_hide');at(h,0,43);h.r.special.setRoll(()=>0);a.equal(h.r.special.use('g_hide').pass,true);
 a.deepEqual(plain(h.r.live().hide),{mode:'pass',left:300000});
 for(let k=0;k<60;k++)h.r.special.tick(1000);a.equal(h.r.live().hide.left,240000,'one minute gone');
 h.r.special.tick(5000);a.equal(h.r.live().hide.left,239000,'one tick never takes more than 1 s');
 h.r.s5.shopList(0,'craft');a.ok(h.r.ui());h.r.special.tick(1000);a.equal(h.r.live().hide.left,239000,'paused while a screen is open');h.r.closeUI();
 at(h,14,49);a.equal(h.r.doSave(),true);const saved=JSON.parse(h.storage.get('sota.party.slot0'));a.equal(saved.hide.left,239000);
 const h2=harness(Object.fromEntries(h.storage));a.deepEqual(plain(h2.r.live().hide),{mode:'pass',left:239000},'back on load');
 for(let k=0;k<239;k++)h2.r.special.tick(1000);a.equal(h2.r.live().hide,undefined,'worn off');
 a.equal(h.r.special.use('g_hide').ok,false,'none left in the bag');});

test('rope: the last tavern reached is remembered; a pass goes there and arrives (save); a fail goes to the first square and keeps everything',()=>{
 const h=harness(null,'warrior',30);at(h,46,48,3);h.S.onArchBump(3);h.r.closeUI();a.deepEqual(plain(h.r.live().lastTav),{t:3,x:46,y:48,f:3});
 give(h,'g_rope');give(h,'g_rope');at(h,43,17);h.r.special.setRoll(()=>0);let r=h.r.special.use('g_rope');a.equal(r.pass,true);
 a.deepEqual([h.pos.x,h.pos.y,h.pos.f],[46,48,3]);a.equal(h.r.save().at.name,'Tavern 4','arriving saved there');
 const L=h.r.live(),before=plain({lvl:L.party[0].lvl,gold:L.gold,save:h.storage.get('sota.party.slot0')});at(h,43,17);h.r.closeUI();
 h.r.special.setRoll(()=>0.99);r=h.r.special.use('g_rope');a.equal(r.pass,false);a.deepEqual([h.pos.x,h.pos.y,h.pos.f],[0,64,0],'the very first square');
 a.deepEqual(plain({lvl:L.party[0].lvl,gold:L.gold,save:h.storage.get('sota.party.slot0')}),before,'level, gold and the save slot are kept');a.equal(bagHas(h,'g_rope'),0);});

test('rope on an old save: no lastTav falls back to the tavern it was saved at; with no tavern known it is refused and kept',()=>{
 const h=harness(null,'warrior',15);at(h,18,24);a.equal(h.r.doSave(),true);const o=JSON.parse(h.storage.get('sota.party.slot0'));delete o.lastTav;h.storage.set('sota.party.slot0',JSON.stringify(o));h.storage.set('sota.party',JSON.stringify(o));
 const h2=harness(Object.fromEntries(h.storage));a.equal(h2.r.live().lastTav,undefined);a.deepEqual(plain(h2.r.special.ropeTarget()),{t:1,x:18,y:24,f:0});
 const h3=harness(null,'warrior',15);give(h3,'g_rope');at(h3,0,43);const r=h3.r.special.use('g_rope');a.equal(r.ok,false);a.match(r.why,/haven't reached a tavern/);a.equal(bagHas(h3,'g_rope'),1);});

test('crystal ball: pass keeps a path to the nearest unfound place (saved, no time limit, gone once found); fail wipes the current zone; refused at the boss door',()=>{
 const h=harness(null,'mage',30);give(h,'g_crystal');give(h,'g_crystal');give(h,'g_crystal');at(h,0,64);h.found.add(64*N);
 h.r.special.setRoll(()=>0);let r=h.r.special.use('g_crystal');a.equal(r.pass,true);const cr=h.r.special.route();a.ok(cr&&cr.path.length>1);a.equal(cr.path[0],64*N);
 a.ok(['camp','tavern','door'].includes(cr.kind));at(h,14,49);h.r.doSave();a.deepEqual(JSON.parse(h.storage.get('sota.party.slot0')).crystal.to,cr.to,'kept in the save');
 for(let k=0;k<50;k++)h.r.special.tick(1000);a.ok(h.r.special.route(),'no time limit');
 h.found.add(cr.to);at(h,0,43);h.S.afterStep(-1);a.equal(h.r.special.route(),null,'gone once found');
 at(h,48,15);h.r.special.setRoll(()=>0.99);r=h.r.special.use('g_crystal');a.equal(r.pass,false);a.deepEqual(h.wiped,[4],'zone 4 map forgotten');
 at(h,32,34);r=h.r.special.use('g_crystal');a.equal(r.ok,false);a.match(r.why,/boss door/);a.equal(bagHas(h,'g_crystal'),1);
 const h2=harness(null,'mage',30);give(h2,'g_crystal');at(h2,0,64);for(let i=0;i<N*N;i++)h2.found.add(i);r=h2.r.special.use('g_crystal');a.equal(r.ok,false);a.match(r.why,/nothing left/);a.equal(bagHas(h2,'g_crystal'),1);});

test('lockpick: only on a room puzzle door, only the rogue hero; pass opens; fail doubles (two rounds, saved); never in a fight',()=>{
 const h=harness(null,'rogue',15);give(h,'g_lockpick');give(h,'g_lockpick');at(h,0,43);const GL=h.S.gearLock,rid=3;
 a.equal(GL.can(rid),true);a.equal(GL.can(-1),false);a.equal(GL.can(999),false);a.equal(h.r.special.use('g_lockpick').ok,false,'not from the bag');
 h.r.special.setRoll(()=>0);let r=GL.use(rid);a.equal(r.pass,true);a.equal(bagHas(h,'g_lockpick'),1);
 h.r.special.setRoll(()=>0.99);r=GL.use(5);a.equal(r.pass,false);a.equal(GL.rounds(5),2);a.equal(GL.can(5),false,'a jammed door takes no second pick');a.equal(bagHas(h,'g_lockpick'),0);
 at(h,14,49);h.r.doSave();a.deepEqual(JSON.parse(h.storage.get('sota.party.slot0')).lockFail,{5:2});GL.solvedRound(5);a.equal(GL.rounds(5),1);GL.solvedRound(5);a.equal(GL.rounds(5),0);
 const h2=harness(null,'rogue',15);give(h2,'g_lockpick');h2.r.startFight([h2.R.makeBoss('normal')]);a.equal(h2.S.gearLock.can(3),false,'not in a fight (boss fight too)');a.match(h2.r.special.whyNot('g_lockpick',{room:3}),/fight/);
 const h3=harness(null,'mage',15);give(h3,'g_crystal');h3.r.startFight([h3.R.makeBoss('normal')]);a.match(h3.r.special.whyNot('g_crystal'),/fight/);});

test('old saves (33306be shape, no new fields) load and play: same save keys; new fields default to nothing',()=>{
 const h=harness();at(h,14,49);a.equal(h.r.doSave(),true);const keys=[...h.storage.keys()].filter(k=>/^sota\.party/.test(k)).sort();
 a.deepEqual(keys,['sota.party','sota.party.active','sota.party.slot0']);const o=JSON.parse(h.storage.get('sota.party.slot0'));for(const k of ['hide','lastTav','crystal','lockFail'])delete o[k];
 const h2=harness({'sota.party.slot0':JSON.stringify(o),'sota.party':JSON.stringify(o),'sota.party.active':'0'});const L=h2.r.live();
 a.ok(L&&L.party.length===1);for(const k of ['hide','crystal','lockFail'])a.equal(L[k],undefined,k);a.equal(h2.r.special.route(),null);
 at(h2,0,43);h2.S.afterStep(-1);h2.r.special.tick(1000);a.equal(h2.r.special.whyNot('g_rope'),"You don't have one.");});
