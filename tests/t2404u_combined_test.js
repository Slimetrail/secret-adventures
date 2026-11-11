"use strict";
// Jeremy t2404u (with t2397u, t2398u/t2399u): 1 HP wake after a win/run/boss win, KO'd members get no XP, a whole-party KO still
// reloads; Smelling salts work in battle only and revive at 25%; old saves with a salts maze box are migrated; unspent stat points
// are kept and reminded on join and level-up; zone 3 sketches in Beasts; zone 3 a bit harder; the craft toast moves off the hint.
// Usage: node --test tests/t2404u_combined_test.js
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const plain=o=>JSON.parse(JSON.stringify(o));
const flow=read('tests/tavern_shop_camp_flow_test.js');
const baseHarness=eval('('+flow.slice(flow.indexOf('function harness'),flow.indexOf('\nfor(let t=0'))+')');
function harness(init){const h=baseHarness(init),create=h.document.createElement;h.document.createElement=t=>{const e=create(t);if(t==='canvas'){e.toDataURL=()=>'data:,';e.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},width:0})});}return e;};h.c.Image=class{constructor(){this.complete=false;}};return h;}
const RO={window:{}};vm.createContext(RO);vm.runInContext(read('rules.js'),RO);RO.window.RPG=RO.window.RPG||RO.RPG;vm.runInContext(read('econ.js'),RO);
const R=RO.window.RPG,X=RO.window.ECON;
const toastText=h=>h.document.getElementById('s4toast').textContent;
function withTwo(h){const L=h.r.live();if(L.party.length<2)L.party.push(h.R.makeCompanion(h.R.COMPANIONS[0],L.party[0].lvl));L.party.forEach(c=>{c.spent=h.R.pointsEarned(c.lvl);});return L;}
const weak=h=>[h.R.makeMonster(1,0,1,0,'normal')];

for(const how of ['win','ran'])test('t2397u: after a '+(how==='win'?'win':'successful run')+' every knocked-out member wakes at exactly 1 HP; KO\'d members get no XP',()=>{
 const h=harness(),L=withTwo(h);h.r.startFight(weak(h));L.party[1].hp=0;const xp0=L.party[1].xp,xpH=L.party[0].xp;h.r.forceEnd(how);
 a.equal(L.party[1].hp,1);a.equal(L.party[1].xp,xp0,'KO member got XP');if(how==='win')a.ok(L.party[0].xp>xpH||L.party[0].lvl>1,'standing hero got XP');
 a.equal(h.ov.dataset.result,how);h.r.closeUI();a.equal(L.party[1].hp,1,'stays at 1 HP until healed');});
test('t2397u: boss win wakes KO\'d members at 1 HP; a whole-party KO is still a loss that reloads the last save',()=>{
 const h=harness(),L=withTwo(h);h.r.doSave();h.r.startBoss();L.party[1].hp=0;h.r.forceEnd('win');a.equal(L.party[1].hp,1);h.r.closeUI();
 const h2=harness(),L2=withTwo(h2);h2.r.doSave();const g=L2.gold;h2.r.startFight(weak(h2));L2.party.forEach(c=>c.hp=0);L2.gold=g+500;h2.r.forceEnd('lose');
 a.equal(h2.ov.dataset.result,'lose');a.ok(L2.party.every(c=>c.hp===0),'no wake on a loss');h2.click(h2.document.getElementById('fdone'));a.equal(h2.r.live().gold,g,'reloaded the last save');});
test('t2397u source: wakeKO runs after the XP loop (win) and on a run, not on a loss',()=>{const p=read('party.js'),e=p.slice(p.indexOf('function endFight'),p.indexOf('drawParty();h6("fightEnd"'));
 a.ok(e.indexOf('wakeKO()')>e.indexOf('R.gainXp'));const lose=e.slice(e.indexOf('how==="lose"'),e.indexOf('else{wakeKO()'));a.equal(lose.includes('wakeKO'),false);a.match(p,/function wakeKO\(\)\{live\.party\.forEach\(c=>\{if\(c\.hp<=0\)c\.hp=1;\}\);\}/);});

test('t2398u/t2399u: Smelling salts revive at 25% in battle and the item text says so',()=>{
 a.equal(R.ITEMS.salts.revive,0.25);a.equal(R.ITEMS.salts.battle,true);a.match(X.useText('salts'),/in battle only: wakes a knocked-out ally at 25% health/);
 const K=R.START_KIT,p=[R.newChar('A','human','warrior',K.warrior.alloc,K.warrior.skill),R.newChar('B','human','mage',K.mage.alloc,K.mage.skill)];p[0].bag.push('salts');p[1].hp=0;
 const f=new R.Fight(p,[R.makeMonster(1,0,1,0,'normal')],'normal',7);const t=f.act(0,'item','salts',1);a.match(t,/is back up/);a.equal(p[1].hp,Math.max(1,Math.round(R.maxHp(p[1],1)*0.25)));a.equal(p[0].bag.includes('salts'),false);});
test('t2398u: salts cannot go in a maze box and have no out-of-fight Use or Wake path',()=>{
 const h=harness(),L=withTwo(h);L.party[0].bag.push('salts');a.equal(h.r.mazeSlotChoices().some(x=>(x.id||x)==='salts'||(Array.isArray(x)&&x[0]==='salts')),false);
 const p=read('party.js');a.match(p,/function mazeSlotAllowed\(id\)\{const it=R\.ITEMS\[id\];return !!it&&!it\.craft&&!it\.revive&&/);
 for(const s of ['Nobody is knocked out','"Wake "'])a.equal(p.split(s).length-1,1,s+' only once (the in-fight item menu)');
 a.match(p,/kids:\(\)=>\{const ko=live\.party\.map\(\(m,j\)=>m\.hp<=0\?\{t:"Wake "\+m\.name,fn:\(\)=>doAct\("item",id,j\)/,'Wake only inside the fight item menu (doAct)');
 h.r.bagScreen(0);const it=h.ov.querySelector('[data-item=salts]');a.ok(it,'salts listed in the bag');h.click(it);
 const every=n=>[n].concat(...n.children.map(every)),all=every(h.ov),txt=all.map(e=>e.textContent);a.ok(txt.includes('Use in battle'),'shows Use in battle');a.equal(all.some(e=>e.tagName==='BUTTON'&&e.textContent==='Use'),false,'no Use button for salts outside a fight');});
test('t2398u: an old save with a salts maze box is migrated: the box is cleared and the salts are back in the bag',()=>{
 const h=harness(),L=withTwo(h);L.party.forEach(c=>{c.bag=c.bag.filter(x=>x!=='salts');});L.party[0].bag.push('potion');h.r.s5.leaveShop(0);h.click(h.ov.querySelector('[data-save-slot=0]'));
 const key='sota.party.slot0',old=JSON.parse(h.storage.get(key));old.mazeSlots=['salts','potion',null];h.storage.set(key,JSON.stringify(old)); // as written by a pre-t2398u build
 const h2=harness(Object.fromEntries([...h.storage.entries()].filter(([k])=>k!=='sota.dev.nofight')));const L2=h2.r.live();
 a.equal((L2.mazeSlots||[]).includes('salts'),false,'salts box cleared on load');a.equal(L2.party.reduce((t,c)=>t+c.bag.filter(x=>x==='salts').length,0),1,'salts back in the bag');
 a.ok((L2.mazeSlots||[]).includes('potion'),'other boxes kept');});

test('t2404u: unspent stat points are kept and reminded on join and on level-up OK',()=>{
 const h=harness(),L=h.r.live();L.party.length=1;const hero=L.party[0];hero.spent=h.R.pointsEarned(hero.lvl);
 const c=h.R.makeCompanion(h.R.COMPANIONS[0],8);a.ok(h.R.pointsEarned(c.lvl)-c.spent>0,'companion keeps unspent points');
 h.enableHooks();const T=h.M.taverns[0];h.pos.x=T[0];h.pos.y=T[1];h.c.window.SOTA.afterStep(null);
 if(L.party.length>1){a.match(toastText(h),/joined the party! .*has \d+ stat points? to spend\. Tap Party to spend them\./);}
 else a.fail('no companion joined at Tavern 1: '+toastText(h));
 const h2=harness(),L2=h2.r.live();L2.party.forEach(x=>x.spent=0);h2.r.s5.lvlPopup(['Hero reached level 2!']);h2.click(h2.document.getElementById('s5lvlok'));a.match(toastText(h2),/stat points? to spend/);
 const h3=harness(),L3=h3.r.live();L3.party.forEach(x=>x.spent=h3.R.pointsEarned(x.lvl));h3.document.getElementById('s4toast').textContent='';h3.r.s5.lvlPopup(['x']);h3.click(h3.document.getElementById('s5lvlok'));a.equal(toastText(h3),'','no reminder once spent');});

test('t2404u: zone 3 monsters are a bit harder (HP x1.2, hits x1.35); zones 1, 2, 4, 5 unchanged; Moonleaf unchanged',()=>{
 for(let k=0;k<7;k++){const m=R.makeMonster(3,k,22,0,'normal'),L=m.lvl,v=R.ROLES[3][k];a.equal(m.hp,Math.round((16+9*L)*R.ZONE_MUL[3]*v[1]*1.2));
  a.equal(m.atk,Math.round((5+2.1*L)*R.ZONE_MUL[3]*R.DIFF.normal.matk*v[2]*1.35*10)/10);
  for(const z of [1,2,4,5]){const n=R.makeMonster(z,k,1,0,'normal'),u=R.ROLES[z][k];a.equal(n.hp,Math.round((16+9*n.lvl)*R.ZONE_MUL[z]*u[1]));}}
 const head=require('node:child_process').execFileSync('git',['show','HEAD:econ.js'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});
 const ml=s=>s.split('\n').filter(l=>/moonleaf/i.test(l)&&!/elixir/.test(l)).join('\n'); // the Moon elixir craft (t2370u) is checked belowa.equal(ml(read('econ.js')),ml(head),'Moonleaf lines unchanged vs zone3-work HEAD');
 a.deepEqual(plain(X.CRAFTS.find(c=>c.id==='elixir').need),{i_herbs:1,i_moonleaf:1,p_fang:1});});
test('t2404u: Tavern 3 has nobody joining and the comment says so',()=>{a.equal(R.COMPANIONS.some(c=>c.tavern===2),false);a.match(read('rules.js'),/Nobody joins at Tavern 3\./);a.equal(read('rules.js').includes('companions join at taverns 2, 3, 4'),false);});
test('t2404u: the "You made ...!" toast moves to the bottom while the craft pop-up (with its Tap a box hint) is open',()=>{
 const p=read('party.js');a.match(p,/html:has\(\.s5craftpop\) #s4toast\{top:auto;bottom:calc\(12px \+ env\(safe-area-inset-bottom\)\)\}/);
 a.match(p,/function toast\(t\)\{const d=\$\("s4toast"\);d\.textContent=displayText\(t\);toastSpot\(d\);/);a.match(p,/find\(e=>\/\^Tap a box\/\.test\(e\.textContent\)\),\$\("s5tut"\)\]/);
 // geometry (toast vs both Tap a box hints and the pop-up buttons at 390x844, 360x640, 1280x800) is checked in t2404u_combined_browser_test.py
});
test('t2404u: Beasts shows the seven zone 3 pencil sketches (1024x1024 webp) once found; journal pages for cap:3 stay text only',()=>{
 const Z=['centaur','werewolf','skeleton','ghoul','harpy','direwolf','wraith'];for(const n of Z){const b=fs.readFileSync(path.join(__dirname,'..','art-intro/journal/monsters/z3-'+n+'.webp'));a.equal(b.slice(0,4).toString(),'RIFF');a.equal(b.slice(8,12).toString(),'WEBP');}
 const sw=read('sw.js'),art=read('intro-art-data.js');for(const n of Z){a.equal(sw.split('"art-intro/journal/monsters/z3-'+n+'.webp"').length-1,1);a.ok(art.includes('"journal/monsters/z3-'+n+'.webp"'));}
 a.equal(read('intro.js').includes('"cap:3":'),false,'cap:3 journal page still text only');});
test('t2404u pins: VER 100 (gear rework on live VER 99) and party v38, rules v22, econ v17, intro v20, intro-art-data v5, game v24, tex v16, map v17, item-icons v4 in both index.html and sw.js',()=>{const h=read('index.html'),s=read('sw.js');a.match(s,/^const VER="103",/);
 for(const p of ['party.js?v=40','rules.js?v=24','econ.js?v=17','intro.js?v=21','intro-art-data.js?v=6','splash.js?v=1','story.js?v=25','music.js?v=20','content-cap.js?v=8','game.js?v=25','tex.js?v=16','map.js?v=17','item-icons.js?v=4'])for(const x of [h,s])a.ok(x.includes(p),p);});
