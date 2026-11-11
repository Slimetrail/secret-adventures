"use strict";
// Jeremy t2721u fix1 (QA FIX on 07111bc). Node only, party.js in the shared tavern/shop/camp harness.
// fix2 (t2730u/t2731u, Change Verifier, Skeptic): the ending goes on to the main menu after the end-of-game save picker; a loss opens
// the Load screen; only Tavern 4's Zone 5 side has its own wording.
// (a) after the Golem ending the normal save picker is offered (end-of-game save at the centre door, no tent, no camp scene);
//     the win and the ending survive a reload; a declined save changes nothing and is offered again; camps still never auto-save.
// (b) a loss at the Zone 5 side of Tavern 4 says where the party really is; solved final locks are kept in the last save when the
//     door opens, so a loss or a reload does not ask for them again.
// (c) the final-lock layout rules exist (the real bounding-box check is in t2721u_zone5_e2e_browser_test.py).
// Usage: node --test tests/t2721u_fix1_test.js
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const plain=o=>JSON.parse(JSON.stringify(o));
const flow=read('tests/tavern_shop_camp_flow_test.js');
// the shared harness's SOTA stub lacks setMazeSlots (party.js t2295u) and the seam lookup; add both before party.js runs
const hsrc=flow.slice(flow.indexOf('function harness'),flow.indexOf('\nfor(let t=0'));a.ok(hsrc.includes('storyOpen:()=>story};'));
const baseHarness=eval('('+hsrc.replace('storyOpen:()=>story};','storyOpen:()=>story,setMazeSlots(){},seamTavernAt:(x,y)=>({"14,49":0,"14,48":0,"18,24":1,"19,24":1,"51,14":2,"51,15":2,"46,48":3,"47,48":3})[x+","+y]??-1};')+')');
function harness(init){const h=baseHarness(init),create=h.document.createElement;h.document.createElement=t=>{const e=create(t);if(t==='canvas'){e.toDataURL=()=>'data:,';e.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},width:0})});}return e;};h.c.Image=class{constructor(){this.complete=false;}};
 h.titles=0;h.S.intro={showTitle:()=>{h.titles++;}};return h;}
const q=(h,s)=>h.ov.querySelector(s),qa=(h,s)=>h.ov.querySelectorAll(s);
const slotSave=(h,i)=>JSON.parse(h.storage.get('sota.party.slot'+i)||'null');
const tents=h=>h.r.live().party.flatMap(c=>c.bag).filter(x=>x==='tent').length;
function atTavernSave(h){Object.assign(h.pos,{x:46,y:48,f:3});a.equal(h.r.doSave(),true,'seam save at 46,48');a.equal(h.r.save().at.name,'Tavern 4');}
function won(h,ending='mid'){const L=h.r.live();L.story=Object.assign(L.story||{v:1},{golemDefeated:true,ending,finalLock:true,finalLock2:true,finalLock3:true});Object.assign(h.pos,{x:32,y:34,f:0});}

test('(a) after the ending: "End of game save" picker; saving keeps the win and the ending (no tent, no camp scene), then the main menu',()=>{
 const h=harness();h.enableHooks();h.r.live().party[0].bag.push('tent');atTavernSave(h);won(h,'mid');const t0=tents(h),w0=h.r.live().tentWear;h.hooks.length=0;
 a.equal(h.r.endSaveDue(),true);a.equal(h.r.offerEndSave(),true);a.equal(h.r.ui(),'save-picker');a.equal(qa(h,'[data-save-slot]').length,4);
 a.equal(q(h,'.s4title').textContent,'End of game save');a.match(q(h,'#s4picknote').textContent,/Save your win and your ending, or tap Back to go to the main menu without saving\./);
 a.equal(q(h,'[data-save-slot="0"]').textContent,'Slot 1 · Test Hero · Tavern 4 (Zone 5 side)');
 h.click(q(h,'[data-save-slot="0"]'));a.equal(h.r.ui(),null);a.equal(h.titles,1,'main menu after the save');
 const o=slotSave(h,0);a.equal(o.story.golemDefeated,true);a.equal(o.story.ending,'mid');a.deepEqual([o.at.x,o.at.y,o.at.name],[32,34,'the centre door']);
 a.equal(tents(h),t0);a.equal(h.r.live().tentWear,w0,'no tent use');a.deepEqual(h.hooks.filter(x=>x[0]==='camp'),[],'no camp scene');
 a.equal(h.r.endSaveDue(),false);a.equal(h.r.offerEndSave(),false,'not offered twice');a.equal(h.titles,2,'a later ending goes straight to the main menu');
 const h2=harness(Object.fromEntries(h.storage));const s2=h2.r.live().story;a.equal(s2.golemDefeated,true);a.equal(s2.ending,'mid');
 a.deepEqual([h2.r.save().at.x,h2.r.save().at.y,h2.r.save().at.name],[32,34,'the centre door']);a.equal(h2.r.endSaveDue(),false);a.equal(h2.r.slotName(h2.r.saveSlots()[0].at),'the centre door');});
test('(a) Back on the end-of-game save writes nothing and goes to the main menu; the game in memory keeps the win, so the next ending offers it again',()=>{
 const h=harness();atTavernSave(h);won(h,'high');const before=h.storage.get('sota.party.slot0');
 a.equal(h.r.offerEndSave(),true);h.click(q(h,'.s4back'));a.equal(h.r.ui(),null);a.equal(h.titles,1);a.equal(h.storage.get('sota.party.slot0'),before,'nothing written');
 a.equal(h.r.live().story.golemDefeated,true);a.equal(h.r.doSave(),false,'the centre is still not a save point outside the end save');a.equal(h.r.endSaveDue(),true);a.equal(h.r.offerEndSave(),true,'offered again');
 a.ok(!read('party.js').includes('Tap ‹ Centre door to see the ending again'),'old toast gone');});
test('(a) no end save without a Golem win and an ending (straight to the main menu); camps still never auto-save (t2446u)',()=>{
 const h=harness();atTavernSave(h);Object.assign(h.pos,{x:32,y:34});h.r.live().story={v:1,golemDefeated:true,ending:null};a.equal(h.r.offerEndSave(),false);a.equal(h.r.ui(),null);
 h.r.live().story={v:1,golemDefeated:false,ending:'low'};a.equal(h.r.offerEndSave(),false);a.equal(h.r.ui(),null);
 const src=read('party.js');a.ok(src.includes('setTimeout(offerEndSave,0)'));a.ok(!/campScreen\([^)]*\)\{[^}]*doSave\(/.test(src.slice(src.indexOf('function campScreen'),src.indexOf('function campScreen')+400)),'camp screen does not save by itself');});
test('(b)/t2731u a Golem loss opens the Load screen; loading the Zone 5 side save names it; solved locks stay solved after the load and a reload',()=>{
 const h=harness();atTavernSave(h);a.equal(h.r.spotName(h.r.save().at),'the Zone 5 side of Tavern 4');a.equal(h.r.spotName({x:47,y:48,name:'Tavern 4'}),'Tavern 4');
 const L=h.r.live();L.story=Object.assign(L.story||{v:1},{finalLock:true,finalLock2:true,finalLock3:true,seen:{boss:1}});Object.assign(h.pos,{x:32,y:34});
 h.r.startBoss();a.equal(slotSave(h,0).story.finalLock3,true,'locks kept in the save when the door opens');a.equal(slotSave(h,0).story.golemDefeated,undefined);
 h.r.forceEnd('lose');a.equal(h.ov.dataset.result,'lose');a.ok(!h.ov.querySelector('#fdone'),'no Return to last save button');h.r.lossLoad();
 a.equal(h.r.ui(),'save-picker');a.equal(q(h,'.s4title').textContent,'Load a save');a.match(q(h,'#s4picknote').textContent,/^Everyone is knocked out\. Pick a save to load\./);
 a.equal(q(h,'[data-save-slot="0"]').textContent,'Slot 1 · Test Hero · Tavern 4 (Zone 5 side)');a.equal(q(h,'[data-save-slot="1"]').disabled,true,'empty slots cannot be loaded');
 h.click(q(h,'[data-save-slot="0"]'));a.equal(h.r.ui(),null);a.equal(h.document.getElementById('s4toast').textContent,'Back at the Zone 5 side of Tavern 4');
 a.deepEqual([h.pos.x,h.pos.y],[46,48]);const s=h.r.live().story;a.equal(s.finalLock&&s.finalLock2&&s.finalLock3,true,'locks still solved after the load');
 const h2=harness(Object.fromEntries(h.storage)),s2=h2.r.live().story;a.equal(s2.finalLock&&s2.finalLock2&&s2.finalLock3,true,'locks still solved after a reload');});
test('t2731u Back on the loss Load screen loads the last save and opens the main menu (no stuck fight); locks carry over',()=>{
 const h=harness();atTavernSave(h);const g=h.r.live().gold;const L=h.r.live();L.story=Object.assign(L.story||{v:1},{finalLock:true,finalLock2:true,finalLock3:true});Object.assign(h.pos,{x:32,y:34});
 h.r.startBoss();L.gold=g+500;h.r.forceEnd('lose');h.r.lossLoad();h.click(q(h,'.s4back'));
 a.equal(h.r.ui(),null);a.equal(h.titles,1,'main menu');a.equal(h.r.fight(),null,'no fight left');a.equal(h.r.live().gold,g,'last save loaded');a.deepEqual([h.pos.x,h.pos.y],[46,48]);
 const s=h.r.live().story;a.equal(s.finalLock&&s.finalLock2&&s.finalLock3,true);});
test('t2731u loss Load screen: an older slot of the same adventure gets the solved locks; another adventure does not',()=>{
 const h=harness();Object.assign(h.pos,{x:14,y:49,f:0});a.equal(h.r.doSave(),true);atTavernSave(h);
 h.r.live().story=Object.assign(h.r.live().story||{v:1},{finalLock:true,finalLock2:true,finalLock3:true});h.r.startBoss();
 // slot 0 now holds the 46,48 save with the locks; write an older save of the same adventure to slot 2 and another adventure to slot 3
 const old=slotSave(h,0);old.at={x:14,y:49,f:0,name:'Tavern 1'};delete old.story.finalLock;delete old.story.finalLock2;delete old.story.finalLock3;h.storage.set('sota.party.slot2',JSON.stringify(old));
 const other=JSON.parse(JSON.stringify(old));other.seed=old.seed+1;h.storage.set('sota.party.slot3',JSON.stringify(other));
 h.r.forceEnd('lose');h.r.lossLoad();h.click(q(h,'[data-save-slot="2"]'));a.equal(h.document.getElementById('s4toast').textContent,'Back at Tavern 1');
 a.equal(h.r.live().story.finalLock3,true,'same adventure: locks carried');a.equal(slotSave(h,2).story.finalLock3,true);
 h.r.startFight([h.R.makeMonster(1,0,1,0,'normal')]);h.r.forceEnd('lose');h.r.lossLoad();h.click(q(h,'[data-save-slot="3"]'));a.equal(h.r.live().story.finalLock3,undefined,'another adventure: no locks');});
test('Change Verifier: zone 1-4 seam cells keep the live wording (save name) in the loss toast and the slot list',()=>{
 /* the game's seam cells (SOTA.seams()): far sides 14,48 / 19,24 / 51,15; 15,49 is not a seam cell in the game */
 for(const [x,y,name] of [[14,48,'Tavern 1'],[19,24,'Tavern 2'],[51,15,'Tavern 3']]){
  const h=harness();Object.assign(h.pos,{x,y,f:0});a.equal(h.r.doSave(),true,`save at ${x},${y}`);a.equal(h.r.save().at.name,name);
  a.equal(h.r.spotName(h.r.save().at),name);a.equal(h.r.slotName(h.r.save().at),name);
  h.r.startFight([h.R.makeMonster(1,0,1,0,'normal')]);h.r.forceEnd('lose');h.r.lossLoad();a.equal(q(h,'[data-save-slot="0"]').textContent,`Slot 1 · Test Hero · ${name}`);
  h.click(q(h,'[data-save-slot="0"]'));a.equal(h.document.getElementById('s4toast').textContent,'Back at '+name,'live text: "Back at "+save.at.name');}
 const src=read('party.js');a.ok(!src.includes('"the Zone "+z+" side of Tavern "'));});
test('(b) unsolved locks are not written; a door with no story state leaves the save alone',()=>{
 const h=harness();atTavernSave(h);const before=h.storage.get('sota.party.slot0');h.r.live().story={v:1,finalLock:true};h.r.startBoss();
 const o=slotSave(h,0);a.equal(o.story.finalLock,true);a.equal(o.story.finalLock2,undefined);a.equal(o.story.finalLock3,undefined);
 const h3=harness();atTavernSave(h3);delete h3.r.live().story;const b3=h3.storage.get('sota.party.slot0');h3.r.startBoss();a.equal(h3.storage.get('sota.party.slot0'),b3);a.ok(before);});
test('(c) final-lock layout: letter ends above the talk box; portrait steps aside on tall screens; side by side on wide screens',()=>{
 const src=read('party.js');
 a.ok(src.includes('#s6d:has(.s7lock) .s6wall{max-width:88vw;max-height:calc(var(--s6top,50vh) - 18px - env(safe-area-inset-top))}'));
 a.ok(src.includes('@media(max-aspect-ratio:1/1){#s6d:has(.s7lock) .s6pf{display:none}}'));a.ok(src.includes('#s6d:has(.s7lock) .s6box{left:calc(50% + 8px);right:12px}'));
 for(const f of ['story.js','story-data.js','art6/seam/tints.json'])a.ok(fs.existsSync(path.join(__dirname,'..',f)));});
test('Skeptic wording: "grows back a head"; the Golem eye line names the marked hero once',()=>{
 const src=read('rules.js');a.ok(src.includes('out.push("The "+m.n+" grows back a head (+"+h+"). Hit it with a skill!");'));a.ok(!src.includes('grows a head back'));
 a.ok(src.includes('out.push("The Golem\'s eye locks on "+w.name+". Defend!");'));a.ok(!src.includes('It will smash'));
 const R=require('../rules.js'),p=['warrior','rogue','mage','archer'].map(c=>{const x=R.newChar(c,'human',c,{},R.SKILLS[c][0].id);x.lvl=50;x.hp=R.maxHp(x,1);x.mp=R.maxMp(x);return x;}),F=new R.Fight(p,[R.makeBoss('normal')],'normal',5);
 let line=null;for(let r=0;r<6&&!line;r++){p.forEach(c=>{c.hp=R.maxHp(c,1);});line=F.monstersTurn().find(t=>/eye locks on/.test(t));}
 a.ok(line,'no eye line');const nm=p[F.mark].name;a.equal(line,`The Golem's eye locks on ${nm}. Defend!`);a.equal(line.split(nm).length-1,1);});
