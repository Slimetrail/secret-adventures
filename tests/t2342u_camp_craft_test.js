"use strict";
// Jeremy t2342u/t2345u/t2347u/t2348u: camp without a tent (save still needs one) and the camp Craft pop-up.
// 4 boxes, ONE item per box, 2-4 items per recipe, everything in the boxes is used up, failures go in the backpack.
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const plain=o=>JSON.parse(JSON.stringify(o));
const flow=read('tests/tavern_shop_camp_flow_test.js');
const baseHarness=eval('('+flow.slice(flow.indexOf('function harness'),flow.indexOf('\nfor(let t=0'))+')');
let draws=0;
function harness(){const h=baseHarness(),create=h.document.createElement;h.document.createElement=t=>{const e=create(t);if(t==='canvas'){e.toDataURL=()=>'data:,';e.getContext=()=>new Proxy({fillRect(){draws++;}},{get:(o,k)=>k in o?o[k]:()=>({addColorStop(){},width:0})});}return e;};h.c.Image=class{constructor(){this.complete=false;}};return h;}
const E=h=>h.c.window.ECON;
function atCamp(h,k=0){const [x,y]=h.M.camps[k];Object.assign(h.pos,{x,y,f:0});}
const toast=h=>h.document.getElementById('s4toast').textContent;
const hpMax=(h,c)=>h.R.maxHp(c,h.R.DIFF[h.r.live().diff].hp);
const q=(h,s)=>h.ov.querySelector(s),qa=(h,s)=>h.ov.querySelectorAll(s);
const pop=h=>h.document.getElementById('s5craftpop');
const boxes=h=>pop(h).querySelectorAll('[data-cbox]');
const cb=h=>plain(h.r.s5.craftBoxes());
const bagAll=h=>h.r.live().party.flatMap(c=>c.bag);
const n=(h,id)=>bagAll(h).filter(x=>x===id).length;
function openCraft(h,tent){const L=h.r.live();atCamp(h);L.party[0].bag=L.party[0].bag.filter(x=>x!=='tent');if(tent)L.party[0].bag.push('tent');h.r.s5.campScreen(0);h.click(q(h,'[data-craftopen]'));a.ok(pop(h),'Craft pop-up did not open');}
// fill boxes through real taps: tap the first empty box, then pick each item in the picker
function tapIn(h,ids){h.click(boxes(h).find(b=>!b.dataset.item));for(const id of ids){const b=pop(h).querySelector('[data-cpick='+id+']');a.ok(b,'picker has no '+id);h.click(b);}}
const craftTap=h=>h.click(pop(h).querySelector('#s5craft'));
const pickable=h=>Object.keys(h.R.ITEMS).filter(id=>['part','ing'].includes(h.R.ITEMS[id].slot));
// a wrong mix of two items that gives a given failure kind (deterministic per mix)
function mixFor(h,kind){const ids=pickable(h);for(const x of ids)for(const y of ids){const m=[x,y];if(!E(h).craftMatch(m)&&E(h).craftFail(m)===kind)return m;}throw new Error('no mix for '+kind);}

test('no tent: camp opens and Cook, Rest and Return all work; Cook has no craft button',()=>{const h=harness(),L=h.r.live(),c=L.party[0];c.bag=[];atCamp(h);
 h.r.s5.campScreen(0);a.equal(h.r.ui(),'camp');a.deepEqual(qa(h,'[data-tab]').map(b=>b.dataset.tab),['cook','rest','return']);
 a.match(qa(h,'.s4note').map(e=>e.textContent).join(' '),/still cook, craft and rest/);
 c.hp=1;c.mp=0;h.click(q(h,'[data-tab=rest]'));a.deepEqual([c.hp,c.mp],[hpMax(h,c),h.R.maxMp(c)]);
 h.click(q(h,'[data-tab=cook]'));a.equal(h.r.ui(),'cook');a.equal(q(h,'[data-craftopen]'),null,'Cook still has a craft button');
 c.bag.push('i_bread','i_butter');h.r.s5.cookScreen('c0');h.click(q(h,'[data-ing=bread]'));h.click(q(h,'[data-ing=butter]'));h.click(q(h,'#s5cook'));a.ok(c.bag.includes('d_toast'),'cooked without a tent');
 h.r.s5.campScreen(0);h.click(q(h,'[data-tab=return]'));a.equal(h.r.ui(),null);});
test('no tent: saving at camp fails; a camp save uses exactly 1 tent; same spot re-save uses none',()=>{const h=harness(),L=h.r.live();L.party[0].bag=[];atCamp(h);
 a.equal(h.r.doSave(),false);L.party[0].bag.push('tent','tent');a.equal(h.r.doSave(),true);a.equal(n(h,'tent'),1);a.equal(h.r.doSave(),true);a.equal(n(h,'tent'),1,'same camp twice used another tent');
 L.party[0].bag=L.party[0].bag.filter(x=>x!=='tent');a.equal(h.r.doSave(),true,'re-save on the same pitched spot needs no new tent');a.equal(E(h).TENT.nights,1);});
test('Craft button is at every camp, with and without a tent, and opens 4 empty boxes',()=>{for(const tent of [false,true])for(let k=0;k<3;k++){const h=harness();atCamp(h,k);h.r.live().party[0].bag=tent?['tent']:[];
  h.r.s5.campScreen(k);const b=q(h,'[data-craftopen]');a.ok(b,'no Craft button');a.match(b.className,/s5craftb/);h.click(b);a.equal(boxes(h).length,4);a.ok(boxes(h).every(x=>!x.dataset.item&&x.textContent==='+'));a.equal(pop(h).querySelector('#s5craft').disabled,true);}
 a.match(read('party.js'),/\.s5camp \.s5craftb\{position:fixed;top:[^}]*left:50%;transform:translateX\(-50%\)/,'Craft button not top centre');});
test('tap an empty box opens the picker of bag parts and ingredients; tap a full box clears it',()=>{const h=harness(),L=h.r.live();L.party[0].bag=['i_herbs','p_shell','sword'];openCraft(h);
 a.equal(pop(h).querySelector('#s5cpick'),null);h.click(boxes(h)[2]);const pk=pop(h).querySelector('#s5cpick');a.ok(pk,'picker did not open');
 a.deepEqual(pk.querySelectorAll('[data-cpick]').map(b=>b.dataset.cpick).sort(),['i_herbs','p_shell'],'picker must list only bag parts/ingredients');
 h.click(pk.querySelector('[data-cpick=p_shell]'));a.equal(boxes(h)[2].dataset.item,'p_shell','picked item must go in the tapped box');a.deepEqual(cb(h),[null,null,'p_shell',null]);
 h.click(boxes(h)[2]);a.deepEqual(cb(h),[null,null,null,null]);a.equal(boxes(h)[2].textContent,'+');});
test('t2348u: every pickable material and part takes one box per copy, fills the next empty box, and stops at 4',()=>{const h=harness(),ids=pickable(h);a.ok(ids.length>=40,'too few pickable items '+ids.length);
 for(const id of ids){const L=h.r.live();L.party.forEach(c=>c.bag=[]);L.party[0].bag=Array(6).fill(id);openCraft(h);
  h.click(boxes(h)[0]);for(let k=1;k<=4;k++){const b=pop(h).querySelector('[data-cpick='+id+']');a.ok(b,id+': picker closed early at '+k);h.click(b);
   const got=cb(h);a.equal(got.filter(Boolean).length,k,id+': copy '+k+' did not take its own box');a.ok(got.every(x=>x===null||x===id),id+': a box holds more than one item');
   a.deepEqual(got.slice(0,k),Array(k).fill(id),id+': copy '+k+' did not go in the next empty box');
   boxes(h).forEach(bx=>{if(bx.dataset.item)a.equal(bx.textContent,h.R.ITEMS[id].n,id+': box shows a count or stack');});}
  a.equal(pop(h).querySelector('#s5cpick'),null,id+': picker still open with 4 full boxes');a.equal(h.r.s5.craftPut(id),-1,id+': a 5th item was added');a.equal(cb(h).filter(Boolean).length,4);
  h.click(boxes(h)[1]);h.click(boxes(h)[1]);h.click(pop(h).querySelector('[data-cpick='+id+']'));a.deepEqual(cb(h),Array(4).fill(id),id+': refill of a cleared box');
  h.r.s5.craftReset();h.r.s5.craftPut(id);h.r.s5.craftClear(0);h.r.s5.craftPut(id);h.r.s5.craftPut(id);a.deepEqual(cb(h),[id,id,null,null]);}
 // with a gap, a second copy fills the first empty box; picker never offers more copies than the bags hold
 const L=h.r.live();L.party[0].bag=['p_silk','p_silk'];openCraft(h);h.click(boxes(h)[2]);h.click(pop(h).querySelector('[data-cpick=p_silk]'));h.click(pop(h).querySelector('[data-cpick=p_silk]'));
 a.deepEqual(cb(h),[ 'p_silk',null,'p_silk',null]);a.equal(pop(h).querySelector('[data-cpick=p_silk]'),null,'offered a copy the bags do not have');});
test('recipes are 2-4 single items, real ids, unique; the tent recipe equals TENT.parts (silk 1 + hide 1, zone 1-2)',()=>{const h=harness(),X=E(h),seen=new Set();
 a.deepEqual(plain(X.TENT.parts),{p_silk:1,p_hide:1});const tent=X.CRAFTS.find(c=>c.id==='tent');a.deepEqual(plain(tent.need),plain(X.TENT.parts));a.equal(tent.out,'tent');
 for(const c of X.CRAFTS){const list=X.needList(c.need);a.ok(list.length>=2&&list.length<=4,c.id+' has '+list.length+' items');list.forEach(id=>a.ok(['part','ing'].includes(h.R.ITEMS[id].slot),c.id+': '+id));a.ok(h.R.ITEMS[c.out],c.id+' output');const k=X.mixKey(list);a.ok(!seen.has(k));seen.add(k);}
 a.ok(X.CRAFTS.some(c=>c.kind==='potion'&&X.needList(c.need).length>=3),'no stronger 3-4 item potion');a.ok(X.CRAFTS.some(c=>c.kind==='food'&&X.needList(c.need).length>=3),'no stronger 3-4 item meal');
 a.ok(X.CRAFTS.filter(c=>X.needList(c.need).length===2).length>=3,'basic 2-item recipes');});
test('tent screen and building use the new 2 tent parts',()=>{const h=harness(),L=h.r.live();L.gold=50;L.party[0].bag=['p_silk','p_hide'];h.r.s5.tentScreen(2);
 a.deepEqual(qa(h,'.s5need').map(r=>[r.dataset.need,r.querySelector('.s4v').textContent]),[['p_silk','1 / 1'],['p_hide','1 / 1']]);a.equal(qa(h,'.s5need').filter(r=>/ ok/.test(r.className)).length,2);
 a.equal(h.r.s5.buildTent(false),true);a.equal(n(h,'tent'),1);a.deepEqual(L.party[0].bag.filter(x=>x.startsWith('p_')),[]);a.equal(L.gold,40);});
test('every recipe made by tapping the boxes: item made, boxes used up, recipe in journal Recipes',()=>{const h=harness(),X=E(h);
 h.r.live().crafts={};for(const cr of X.CRAFTS){const L=h.r.live();L.party.forEach(c=>c.bag=[]);const list=X.needList(cr.need).reverse();L.party[0].bag.push(...list,'i_bread');openCraft(h);tapIn(h,list);
  craftTap(h);a.equal(n(h,cr.out),1,cr.id+' not made');a.match(toast(h),new RegExp('You made '+cr.n.replace(/'/g,"'")+'! Recipe saved'));a.equal(L.crafts[cr.id],'earned');
  for(const id of new Set(list))a.equal(n(h,id),0,cr.id+': '+id+' not used up');a.equal(n(h,'i_bread'),1,'item outside the boxes was used');a.deepEqual(cb(h),[null,null,null,null]);
  const pic=pop(h).querySelector('#s5craftpic');a.ok(pic,'no result picture');a.equal(pic.dataset.result,cr.id);}
 const I=h.intro();I.openJournal('recipes');const j=h.document.body.querySelectorAll('[data-craft]').map(e=>e.dataset.craft);a.deepEqual(plain(j).sort(),plain(X.CRAFTS.map(c=>c.id)).sort());
 a.equal(+h.document.body.querySelector('[data-crafts]').dataset.crafts,X.CRAFTS.length);});
test('known recipe in the pop-up fills the boxes from the bags, only when the bags have the items',()=>{const h=harness(),L=h.r.live();L.party[0].bag=['i_herbs','p_shell'];L.crafts={};openCraft(h);tapIn(h,['i_herbs','p_shell']);craftTap(h);
 a.equal(n(h,'potion'),1);a.ok(pop(h).querySelector('[data-known=potion]'));h.click(pop(h).querySelector('[data-known=potion]'));a.deepEqual(cb(h),[null,null,null,null],'filled without the items');a.match(toast(h),/Missing/);
 L.party.push(plain(L.party[0]));L.party[1].bag=['p_shell'];L.party[0].bag.push('i_herbs');openCraft(h);h.click(pop(h).querySelector('[data-known=potion]'));a.deepEqual(cb(h),['i_herbs','p_shell',null,null]);
 craftTap(h);a.equal(n(h,'potion'),2);a.equal(n(h,'i_herbs')+n(h,'p_shell'),0);});
test('a wrong mix gives the same result every time, in any order',()=>{const h=harness(),X=E(h),ids=pickable(h),kinds=new Set();
 for(let i=0;i<ids.length;i++)for(let j=i;j<ids.length;j+=7){const m=[ids[i],ids[j]];if(X.craftMatch(m))continue;const k=X.craftFail(m);a.equal(X.craftFail(m.slice().reverse()),k);a.ok(X.FAILS.includes(k));kinds.add(k);}
 a.deepEqual([...kinds].sort(),['badhp','badmp','badsta','poison','stink','useless']);
 const m=mixFor(h,'poison');for(let t=0;t<3;t++){const L=h.r.live();L.seed=t*99+1;L.steps=t*13;L.party[0].bag.push(...m);a.equal(h.r.s5.craftTry(m).kind,'poison');}});
for(const kind of ['poison','stink','badhp','badmp','badsta'])test(`failure ${kind}: used up, goes in the backpack, and does nothing until used`,()=>{const h=harness(),L=h.r.live(),c=L.party[0],m=mixFor(h,kind);
 c.bag=[...m];c.hp=10;c.mp=3;L.stink=0;const before=plain([c.hp,c.mp,c.buff||null,c.poison||null]);openCraft(h);tapIn(h,m);craftTap(h);
 const item=E(h).FAIL_ITEM[kind];a.deepEqual(c.bag,[item],'boxes not used up or item not in the backpack');a.deepEqual(plain([c.hp,c.mp,c.buff||null,c.poison||null]),before,'failure hit right away');a.equal(L.stink,0);
 a.equal(pop(h).querySelector('#s5craftpic').dataset.result,kind);a.match(toast(h),new RegExp(h.R.ITEMS[item].n));a.ok(pop(h).querySelector('[data-oddmix]'),'odd mix not offered again');a.equal(Object.keys(L.failedMixes||{}).length,0);});
test('poison applies to a weapon from the backpack, adds damage for 3 fights, then wears off',()=>{const h=harness(),L=h.r.live(),c=L.party[0];c.equip.weapon=c.equip.weapon||'sword';c.bag=['x_poison'];
 const p0=h.R.power(c);h.r.charScreen(0);h.click(q(h,'[data-item=x_poison]'));a.match(q(h,'[data-badtext]').textContent,/\+30% damage for 3 fights/);h.click(q(h,'[data-applypoison]'));
 a.deepEqual(c.bag,[]);a.deepEqual(plain(c.poison),{f:3,b:0.3});a.ok(Math.abs(h.R.power(c)-p0*1.3)<1e-9,'power not +30%');a.equal(q(h,'[data-poisoned]').dataset.poisoned,3);
 // real fight damage is higher with poison
 const mon=()=>{const m=h.R.makeMonster(1,0,1,0,'normal');m.hp=m.max=1e6;m.def=0;m.atk=0;return m;};const dmg=withP=>{const keep=c.poison;if(!withP)delete c.poison;const f=new h.R.Fight([c],[mon()],'normal',7);f.act(0,'attack',null,0);const d=1e6-f.m[0].hp;if(keep)c.poison=keep;return d;};
 a.ok(dmg(true)>dmg(false),'poisoned attack not stronger');
 for(let k=2;k>=0;k--){h.r.startFight([h.R.makeMonster(1,0,1,0,'normal')]);h.r.forceEnd('win');h.click(q(h,'#fdone'));if(k)a.equal(c.poison.f,k);else a.equal(c.poison,undefined,'poison did not wear off');}
 a.equal(h.R.poisonOf(c),0,'poison bonus still on after it wore off');
 const h2=harness(),c2=h2.r.live().party[0];c2.equip.weapon=null;c2.bag=['x_poison'];h2.r.charScreen(0);h2.click(h2.ov.querySelector('[data-item=x_poison]'));h2.click(h2.ov.querySelector('[data-applypoison]'));a.deepEqual(c2.bag,['x_poison']);a.match(toast(h2),/Equip a weapon/);});
test('stinky food raises the encounter rate only when eaten, then wears off',()=>{
 const walk=(eat)=>{const h=harness();h.enableHooks();h.S.panelOpen=()=>false;const L=h.r.live();L.stink=0;L.party[0].bag=['x_stink'];
  if(eat){h.r.charScreen(0);h.click(q(h,'[data-item=x_stink]'));h.click(q(h,'[data-eat]'));a.equal(L.stink,E(h).FAIL_STINK_STEPS);a.deepEqual(L.party[0].bag,[]);h.r.closeUI();}else a.equal(L.stink,0);
  let cell=null;for(let yy=0;yy<h.M.n&&!cell;yy++)for(let xx=0;xx<h.M.n&&!cell;xx++)if(!h.R.isSavePoint(h.M,xx,yy))cell=[xx,yy];Object.assign(h.pos,{x:cell[0],y:cell[1],f:0});
  let n=0;for(let i=0;i<300;i++){h.S.afterStep(-1);if(h.r.fight()&&!h.r.fight().over){n++;h.r.forceEnd('ran');h.r.closeUI();}}return [n,L.stink];};
 const [plainN,l0]=walk(false),[stinkN,left]=walk(true);a.ok(stinkN>plainN,`stink ${stinkN} vs plain ${plainN}`);a.equal(left,0);a.equal(l0,0);});
test('bad food lowers HP, MP or stamina only when eaten and never knocks anyone out',()=>{const h=harness(),L=h.r.live(),c=L.party[0],X=E(h);
 c.hp=hpMax(h,c);c.mp=h.R.maxMp(c);h.r.s5.eatDish(c,'x_badhp');a.equal(c.hp,hpMax(h,c)-Math.round(hpMax(h,c)*X.BAD_HP/100));
 c.hp=1;h.r.s5.eatDish(c,'x_badhp');a.equal(c.hp,1,'bad food knocked out');c.hp=0;h.r.s5.eatDish(c,'x_badhp');a.equal(c.hp,0,'KO changed');
 c.hp=10;const mm=h.R.maxMp(c);c.mp=mm;h.r.s5.eatDish(c,'x_badmp');a.equal(c.mp,mm-Math.round(mm*X.BAD_MP/100));c.mp=0;h.r.s5.eatDish(c,'x_badmp');a.equal(c.mp,0);
 delete c.buff;h.r.s5.eatDish(c,'x_badsta');a.deepEqual([c.buff.sta,c.buff.f],[-X.BAD_STA,X.BAD_STA_FIGHTS]);a.equal(c.hp,10);
 h.r.s5.tickBuffs();h.r.s5.tickBuffs();a.equal(c.buff,undefined,'stamina loss did not wear off');
 c.bag=['x_badmp'];c.mp=mm;h.r.charScreen(0);h.click(q(h,'[data-item=x_badmp]'));h.click(q(h,'[data-eat]'));a.ok(c.mp<mm);a.deepEqual(c.bag,[]);});
test('useless mix adds nothing, is used up, is listed under Failed recipes, and warns next time',()=>{const h=harness(),L=h.r.live(),c=L.party[0],m=mixFor(h,'useless');
 c.bag=[...m,...m];const pre=bagAll(h).length;openCraft(h);tapIn(h,m);craftTap(h);a.equal(bagAll(h).length,pre-2,'useless mix added or kept items');
 const key=E(h).mixKey(m);a.deepEqual(plain(L.failedMixes[key]),m.slice().sort());a.equal(pop(h).querySelector('#s5craftpic').dataset.result,'useless');a.match(toast(h),/Failed recipes/);
 tapIn(h,m);a.ok(pop(h).querySelector('[data-triedfail]'),'no warning for a failed mix');
 const I=h.intro();I.openJournal('recipes');const f=h.document.body.querySelector('[data-failed]');a.equal(f.textContent,'Failed recipes');a.equal(f.dataset.failed,1);
 const row=h.document.body.querySelector('[data-failmix]');a.equal(row.dataset.failmix,key);a.match(row.textContent,new RegExp(h.R.ITEMS[m[0]].n));});
test('result picture is 8-bit pixel art drawn square by square on a canvas, for every result',()=>{const h=harness(),X=E(h);
 const kinds=X.CRAFTS.map(c=>c.id).concat(X.FAILS);for(const k of kinds){const art=X.pixelArt(k);a.equal(art.rows.length,12);art.rows.forEach(r=>{a.equal(r.length,12);for(const ch of r)a.ok(ch==='.'||art.pal[ch],k+': no colour for '+ch);});
  draws=0;const cv=h.document.createElement('canvas');const px=h.r.s5.drawPix(cv,k);a.ok(px>20,k+' too few pixels');a.equal(draws,px);a.equal(cv.width,72);}
 const L=h.r.live();L.party[0].bag=['i_herbs','p_shell'];openCraft(h);tapIn(h,['i_herbs','p_shell']);craftTap(h);const pic=pop(h).querySelector('#s5craftpic');a.ok(+pic.dataset.px>20);
 a.match(read('party.js'),/#s5craftpic\{[^}]*image-rendering:pixelated/);});
// t2350u/t2351u: box count sets strength; zone gate on materials; Smelling salts and Hunter's jerky are kept as before (named exceptions)
const EXCEPT=['salts','jerky'];
// t2362u step 1: zones 1-2 ship only 2-box recipes (plus salts and jerky). The medium/strong ones are held in econ-held-crafts.js
// (not loaded); the same zone rule runs on them, so any 3-box or 4-box recipe added later has to pass it.
const HELD=require('../econ-held-crafts.js');
const heldOn=(h,step=4)=>HELD.install(E(h),h.R.ITEMS,step);
function zoneRule(X,list){for(const c of list){const size=X.craftSize(c),zones=Object.keys(c.need).map(X.firstZone);if(c.exception)continue;
  a.ok(size>=2&&size<=4,c.id+' size '+size);
  if(size===3)a.ok(zones.some(z=>z>=3),c.id+': 3-box without a zone 3+ material '+zones);
  if(size===4)a.ok(zones.some(z=>z>=5),c.id+': 4-box without a zone 5 material '+zones);a.equal(X.craftZone(c),Math.max(...zones));}}
test('t2362u step 1: shipped crafts are only 2-box, plus Smelling salts and Hunter\'s jerky; all makeable in zones 1-2',()=>{const h=harness(),X=E(h);
 a.deepEqual(plain(X.CRAFTS.filter(c=>c.exception).map(c=>c.id)).sort(),EXCEPT.slice().sort());
 for(const c of X.CRAFTS){if(c.exception)continue;a.equal(X.craftSize(c),2,c.id+' is not 2-box in step 1');}
 for(const c of X.CRAFTS)a.ok(X.craftZone(c)<=2,c.id+' needs zone '+X.craftZone(c));
 a.deepEqual(plain(X.CRAFTS.map(c=>c.id)),['potion','ether','ration','salts','jerky','tent']);
 for(const id of ['c_elixir','c_stew','c_dragonelixir','c_roast'])a.equal(h.R.ITEMS[id],undefined,id+' shipped');
 a.ok(!/econ-held-crafts/.test(read('index.html'))&&!/econ-held-crafts/.test(read('sw.js')),'held file is loaded or cached');
 zoneRule(X,X.CRAFTS);});
test('zone gate: 2-box any zone, 3-box needs a zone 3+ material, 4-box a zone 5 material; tent is 2-box from zones 1-2',()=>{const h=harness(),X=E(h);
 a.deepEqual(['p_silk','p_shell','p_shard','p_hide','p_ear','p_pelt','p_fang','p_dscale','p_claw','i_herbs','i_meat','i_moonleaf','i_fowl','i_firepepper','i_dragonmeat','i_hydrascale','i_starfruit','i_sage'].map(X.firstZone),[1,1,1,2,2,3,3,5,5,1,2,3,3,3,5,5,4,2]);
 zoneRule(X,HELD.CRAFTS);a.ok(HELD.CRAFTS.every(c=>X.craftSize(c)===(c.step===2?3:4)),'held step 2 = 3-box, step 4 = 4-box');
 const tent=X.CRAFTS.find(c=>c.id==='tent');a.equal(X.craftSize(tent),2);a.ok(Object.keys(tent.need).every(id=>X.firstZone(id)<=2));
 // a made-up 3-box zone 1-2 recipe must fail the rule
 a.throws(()=>zoneRule(X,[{id:'bad',need:{i_herbs:2,p_shell:1}}]));a.throws(()=>zoneRule(X,[{id:'bad4',need:{i_herbs:1,i_moonleaf:1,p_fang:1,p_shell:1}}]));
 // shop stock is untouched by the gate
 a.deepEqual(plain(X.stock(0).parts),[]);a.deepEqual(plain(X.stock(2).parts),['p_silk','p_hide','p_shard']);a.ok(X.stock(3).ing.includes('i_starfruit'));});
test('held recipes, once installed for their step: effects rise with box count (per potion / food)',()=>{const h=harness(),X=E(h);a.equal(heldOn(h,2),2);a.equal(X.CRAFTS.length,8);a.equal(heldOn(h,4),2);
 for(const kind of ['potion','food']){const by=n=>X.CRAFTS.filter(c=>c.kind===kind&&!c.exception&&X.craftSize(c)===n).map(c=>X.useScore(c.out));const [w,m,st]=[by(2),by(3),by(4)];
  a.ok(w.length&&m.length&&st.length,kind+' tiers');a.ok(Math.min(...m)>Math.max(...w),kind+' medium '+m+' vs weak '+w);a.ok(Math.min(...st)>Math.max(...m),kind+' strong '+st+' vs medium '+m);}
 for(const c of X.CRAFTS.filter(c=>c.out.startsWith('c_'))){const it=h.R.ITEMS[c.out];a.equal(it.slot,'use');a.ok(it.heal||it.mp,c.id+' has no effect');a.ok(X.useText(c.out).length>5);const art=X.pixelArt(c.id);a.equal(art.rows.length,12);}});
test('held crafted potions and food work from the backpack and in a fight; the shop Mana potion still fills MP',()=>{const h=harness(),L=h.r.live(),c=L.party[0],mh=hpMax(h,c),mm=h.R.maxMp(c);heldOn(h);
 c.hp=1;c.mp=0;delete c.buff;c.bag=['c_dragonelixir'];h.r.charScreen(0);h.click(q(h,'[data-item=c_dragonelixir]'));a.match(q(h,'[data-usetext]').textContent,/full health, full mana, \+20% strength \(3 fights\)/);
 h.click(qa(h,'button').find(b=>b.textContent==='Use'));a.deepEqual([c.hp,c.mp,c.buff.str,c.buff.f],[mh,mm,20,3]);a.deepEqual(c.bag,[]);
 c.hp=1;c.mp=0;delete c.buff;c.bag=['c_stew','ether'];const f=new h.R.Fight([c],[h.R.makeMonster(1,0,1,0,'normal')],'normal',3);const t=f.act(0,'item','c_stew',0);
 a.equal(c.hp,1+Math.round(mh*0.35));a.equal(c.buff.sta,25);a.match(t,/uses Hunter's stew: \+/);f.act(0,'item','ether',0);a.equal(c.mp,mm);
 c.mp=0;c.bag=['c_elixir'];h.R.useEffect(c,h.R.ITEMS.c_elixir,1);a.equal(c.mp,Math.round(mm*0.6));});
test('a crafted or built tent never sells for more than its parts (no gold loop)',()=>{const h=harness(),X=E(h),raw=Object.entries(X.TENT.parts).reduce((t,[id,k])=>t+k*X.sellPrice(id),0);a.ok(X.sellPrice('tent')<raw,`tent sells ${X.sellPrice('tent')} vs parts ${raw}`);a.ok(X.sellPrice('tent')<raw+X.TENT.fee);a.equal(X.TENT.buy,100);});
// t2356u/t2357u: 1 tent = 1 camp save; first-camp lesson
test('3 silk + 3 hide make 3 tents by tapping; exactly 3 camp saves at 3 camps; a 4th is blocked; taverns stay free',()=>{const h=harness(),L=h.r.live();L.party[0].bag=['p_hide','p_hide','p_hide','p_silk','p_silk','p_silk'];L.campTut='done';
 atCamp(h,1);for(let i=0;i<3;i++){h.r.s5.campScreen(1);h.click(q(h,'[data-craftopen]'));tapIn(h,['p_silk','p_hide']);craftTap(h);}a.equal(n(h,'tent'),3);a.equal(n(h,'p_silk')+n(h,'p_hide'),0);
 for(let k=0;k<3;k++){atCamp(h,k);a.equal(h.r.doSave(),true,'camp save '+(k+1));a.equal(n(h,'tent'),2-k);}
 atCamp(h,3);a.equal(h.r.doSave(),false,'4th camp save without a tent');a.equal(h.r.s5.haveN('tent'),0);
 Object.assign(h.pos,{x:h.M.taverns[0][0],y:h.M.taverns[0][1],f:0});a.equal(h.r.doSave(),true,'tavern save needs a tent');
 h.r.s5.campScreen(1);a.match(qa(h,'.s4note').map(e=>e.textContent).join(' '),/You need a tent to save at camp/);
 L.party[0].bag.push('tent');h.r.s5.campScreen(1);a.match(qa(h,'.s4note').map(e=>e.textContent).join(' '),/Each tent is good for 1 save at a camp/);
 h.r.s5.tentScreen(2);a.match(qa(h,'.s4note').map(e=>e.textContent).join(' '),/Each tent is good for 1 save at a camp/);a.ok(!/nights/.test(qa(h,'.s4note').map(e=>e.textContent).join(' ')));});
test('first-camp lesson: once, highlights each step, the player crafts the tent, Save uses exactly 1 tent and the lesson is saved',()=>{const h=harness(),L=h.r.live();L.party[0].bag=['p_hide','p_hide','p_hide','p_silk','p_silk','p_silk','potion'];L.crafts={};atCamp(h,0);
 const tut=()=>h.document.getElementById('s5tut'),step=()=>tut()&&+tut().dataset.step,hl=()=>h.ov.querySelectorAll('.s5hl');
 h.r.s5.campScreen(0);a.equal(step(),1);a.equal(hl().length,1);a.ok(hl()[0].dataset.craftopen,'step 1 highlights the Craft button');a.equal(n(h,'tent'),0);
 h.click(q(h,'[data-craftopen]'));a.equal(step(),2);a.match(hl()[0].className,/s5cboxes/);
 h.click(boxes(h)[0]);h.click(pop(h).querySelector('[data-cpick=p_silk]'));a.equal(step(),2);h.click(pop(h).querySelector('[data-cpick=p_hide]'));a.equal(step(),3);a.equal(hl()[0].id,'s5craft');
 a.equal(n(h,'tent'),0,'a finished tent was handed over');craftTap(h);a.equal(n(h,'tent'),1);a.equal(L.crafts.tent,'earned');a.deepEqual([n(h,'p_silk'),n(h,'p_hide')],[2,2]);
 a.equal(step(),4);a.match(tut().querySelectorAll('.s4note')[0].textContent,/only save at camping spots, only with a tent in your bag, and each save uses one tent/);
 const sv=tut().querySelector('[data-tutsave]');a.ok(sv,'no Save button');a.match(sv.className,/s5hl/);h.click(sv);a.equal(h.r.ui(),'save-picker');a.equal(qa(h,'[data-save-slot]').length,4);
 h.click(q(h,'[data-save-slot=1]'));a.equal(n(h,'tent'),0,'save did not use exactly 1 tent');a.equal(h.r.ui(),'camp');a.equal(tut(),null);a.match(toast(h),/1 tent used/);
 const saved=JSON.parse(h.storage.get('sota.party.slot1'));a.equal(saved.campTut,'shown');a.equal(saved.at.x,h.M.camps[0][0]);
 h.r.s5.campScreen(0);a.equal(tut(),null,'lesson shown twice');h.r.restore();h.r.s5.campScreen(0);a.equal(tut(),null,'lesson came back after loading the save');
 const h2=harness();h2.r.live().party[0].bag=[];atCamp(h2,1);h2.r.s5.campScreen(1);a.equal(h2.document.getElementById('s5tut'),null,'lesson at a later camp');});
test('first-camp lesson Skip ends it without handing over a tent and it never returns',()=>{const h=harness(),L=h.r.live();L.party[0].bag=['p_hide','p_silk'];atCamp(h,0);h.r.s5.campScreen(0);
 const tut=()=>h.document.getElementById('s5tut');a.ok(tut());h.click(tut().querySelector('[data-tutskip]'));a.equal(tut(),null);a.equal(n(h,'tent'),0);a.equal(h.ov.querySelectorAll('.s5hl').length,0);
 h.r.s5.campScreen(0);a.equal(tut(),null);a.ok(L.campTut);});
