"use strict";
// Jeremy t2721u fix1 (QA FIX on 07111bc). Node only, party.js in the shared tavern/shop/camp harness.
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
const baseHarness=eval('('+hsrc.replace('storyOpen:()=>story};','storyOpen:()=>story,setMazeSlots(){},seamTavernAt:(x,y)=>(x===46||x===47)&&y===48?3:-1};')+')');
function harness(init){const h=baseHarness(init),create=h.document.createElement;h.document.createElement=t=>{const e=create(t);if(t==='canvas'){e.toDataURL=()=>'data:,';e.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},width:0})});}return e;};h.c.Image=class{constructor(){this.complete=false;}};
 return h;}
const q=(h,s)=>h.ov.querySelector(s),qa=(h,s)=>h.ov.querySelectorAll(s);
const slotSave=(h,i)=>JSON.parse(h.storage.get('sota.party.slot'+i)||'null');
const tents=h=>h.r.live().party.flatMap(c=>c.bag).filter(x=>x==='tent').length;
function atTavernSave(h){Object.assign(h.pos,{x:46,y:48,f:3});a.equal(h.r.doSave(),true,'seam save at 46,48');a.equal(h.r.save().at.name,'Tavern 4');}
function won(h,ending='mid'){const L=h.r.live();L.story=Object.assign(L.story||{v:1},{golemDefeated:true,ending,finalLock:true,finalLock2:true,finalLock3:true});Object.assign(h.pos,{x:32,y:34,f:0});}

test('(a) after the ending the save picker opens; the end save keeps the win and the ending, uses no tent and runs no camp scene',()=>{
 const h=harness();h.enableHooks();h.r.live().party[0].bag.push('tent');atTavernSave(h);won(h,'mid');const t0=tents(h),w0=h.r.live().tentWear;h.hooks.length=0;
 a.equal(h.r.endSaveDue(),true);a.equal(h.r.offerEndSave(),true);a.equal(h.r.ui(),'save-picker');a.equal(qa(h,'[data-save-slot]').length,4);
 h.click(q(h,'[data-save-slot="0"]'));a.equal(h.r.ui(),null);
 const o=slotSave(h,0);a.equal(o.story.golemDefeated,true);a.equal(o.story.ending,'mid');a.deepEqual([o.at.x,o.at.y,o.at.name],[32,34,'the centre door']);
 a.equal(tents(h),t0);a.equal(h.r.live().tentWear,w0,'no tent use');a.deepEqual(h.hooks.filter(x=>x[0]==='camp'),[],'no camp scene');
 a.match(h.document.getElementById('s4toast').textContent,/Game saved\. Your win and your ending are kept\./);
 a.equal(h.r.endSaveDue(),false);a.equal(h.r.offerEndSave(),false,'not offered twice');
 // reload: a fresh page with the same storage continues the end save
 const h2=harness(Object.fromEntries(h.storage));const s2=h2.r.live().story;a.equal(s2.golemDefeated,true);a.equal(s2.ending,'mid');
 a.deepEqual([h2.r.save().at.x,h2.r.save().at.y,h2.r.save().at.name],[32,34,'the centre door']);a.equal(h2.r.endSaveDue(),false);
 a.match(h2.r.saveSlots()[0].at.name,/the centre door/);});
test('(a) declining the end save keeps playing, writes nothing, and the next ending offers it again; no save anywhere outside it',()=>{
 const h=harness();atTavernSave(h);won(h,'high');const before=h.storage.get('sota.party.slot0');
 a.equal(h.r.offerEndSave(),true);h.click(q(h,'.s4back'));a.equal(h.r.ui(),null);a.equal(h.storage.get('sota.party.slot0'),before,'nothing written');
 a.match(h.document.getElementById('s4toast').textContent,/Not saved\. Tap ‹ Centre door to see the ending again and save it\./);
 a.equal(h.r.doSave(),false,'the centre is still not a save point outside the end save');a.equal(h.r.endSaveDue(),true);a.equal(h.r.offerEndSave(),true,'offered again');});
test('(a) no end save without a Golem win and an ending; camps still never auto-save (t2446u)',()=>{
 const h=harness();atTavernSave(h);Object.assign(h.pos,{x:32,y:34});h.r.live().story={v:1,golemDefeated:true,ending:null};a.equal(h.r.offerEndSave(),false);
 h.r.live().story={v:1,golemDefeated:false,ending:'low'};a.equal(h.r.offerEndSave(),false);a.equal(h.r.ui(),null);
 const src=read('party.js');a.ok(src.includes('setTimeout(offerEndSave,0)'));a.ok(!/campScreen\([^)]*\)\{[^}]*doSave\(/.test(src.slice(src.indexOf('function campScreen'),src.indexOf('function campScreen')+400)),'camp screen does not save by itself');});
test('(b) a Golem loss at the Zone 5 side of Tavern 4 names where the party is; solved locks stay solved after the loss and a reload',()=>{
 const h=harness();atTavernSave(h);a.equal(h.r.spotName(h.r.save().at),'the Zone 5 side of Tavern 4');a.equal(h.r.spotName({x:47,y:48,name:'Tavern 4'}),'Tavern 4');
 a.equal(h.r.spotName({x:14,y:49,name:'Tavern 1'}),'Tavern 1');
 const L=h.r.live();L.story=Object.assign(L.story||{v:1},{finalLock:true,finalLock2:true,finalLock3:true,seen:{boss:1}});Object.assign(h.pos,{x:32,y:34});
 h.r.startBoss();a.equal(slotSave(h,0).story.finalLock3,true,'locks kept in the save when the door opens');a.equal(slotSave(h,0).story.golemDefeated,undefined);
 h.r.forceEnd('lose');a.match(h.ov.querySelector('.s4note').textContent,/You wake at your last save: the Zone 5 side of Tavern 4\./);
 h.click(q(h,'#fdone'));a.equal(h.document.getElementById('s4toast').textContent,'Back at the Zone 5 side of Tavern 4');
 a.deepEqual([h.pos.x,h.pos.y],[46,48]);const s=h.r.live().story;a.equal(s.finalLock&&s.finalLock2&&s.finalLock3,true,'locks still solved after the loss');
 const h2=harness(Object.fromEntries(h.storage)),s2=h2.r.live().story;a.equal(s2.finalLock&&s2.finalLock2&&s2.finalLock3,true,'locks still solved after a reload');
 a.equal(h2.r.save().gold,h.r.save().gold);});
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
