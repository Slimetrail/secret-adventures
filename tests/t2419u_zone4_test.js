"use strict";
// Jeremy t2419u: zone 4 plays end to end in the unpublished build (zone4-work). Raised cap (zones 1-4; Tavern 4's Zone 5 exit
// waits with the exact wait text), the door rule and path check for zone 4, zone 4 fights with their mechanics (t2409u: skills,
// healing, Defend and target choice matter more than plain Attack), drops incl. moonleaf, no strong 4-box crafts, the 1 HP wake
// and battle-only 25% salts carried over, zone 4 pencil sketches in Beasts, pins and unchanged save keys.
// VER 88 (t2409u content pass): Griffin dive, Lizard man spell reflect, Ogre warlord enrage, Giant scorpion shield, fight-screen status words, balance.
// Usage: node --test tests/t2419u_zone4_test.js
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const plain=o=>JSON.parse(JSON.stringify(o));
const flow=read('tests/tavern_shop_camp_flow_test.js');
const baseHarness=eval('('+flow.slice(flow.indexOf('function harness'),flow.indexOf('\nfor(let t=0'))+')');
function harness(init){const h=baseHarness(init),create=h.document.createElement;h.document.createElement=t=>{const e=create(t);if(t==='canvas'){e.toDataURL=()=>'data:,';e.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},width:0})});}return e;};h.c.Image=class{constructor(){this.complete=false;}};return h;}
const q=(h,s)=>h.ov.querySelector(s),qa=(h,s)=>h.ov.querySelectorAll(s);
const bagAll=h=>h.r.live().party.flatMap(c=>c.bag);
const box={window:{}};vm.createContext(box);vm.runInContext(read('maze-data.js'),box);vm.runInContext(read('content-cap.js'),box);
const M=box.window.MAZE,N=M.n,API=box.window.SOTA_CONTENT_CAP,cap=API.create(N,M.zone),Z=i=>+M.zone[i],idx=([x,y])=>y*N+x;
const masks=Array.from(M.mask,c=>parseInt(c,16)),DIRS=[[1,0,-1],[2,1,0],[4,0,1],[8,-1,0]];
const nb=i=>{const x=i%N,y=Math.floor(i/N),o=[];for(const[b,dx,dy]of DIRS)if(masks[i]&b)o.push((y+dy)*N+x+dx);return o;};
const T4=M.taverns[3],CAMPS4=M.camps.map((c,k)=>[c,k]).filter(([c])=>Z(idx(c))===4);
const RO={window:{}};vm.createContext(RO);vm.runInContext(read('rules.js'),RO);RO.window.RPG=RO.window.RPG||RO.RPG;vm.runInContext(read('econ.js'),RO);
const R=RO.window.RPG,X=RO.window.ECON,K=R.START_KIT;
const Z4=[["Minotaur","z4-minotaur"],["Griffin","z4-griffin"],["Lizard man","z4-lizardman"],["Stone gargoyle","z4-gargoyle"],["Manticore","z4-manticore"],["Ogre warlord","z4-ogre"],["Giant scorpion","z4-scorpion"]];
function hero(cls,lvl){const c=R.newChar('H','human',cls,K[cls].alloc,K[cls].skill);c.lvl=lvl;c.hp=R.maxHp(c,1);c.mp=R.maxMp(c);return c;}
function mon(k,lvl=30){return R.makeMonster(4,k,lvl,0,'normal');}

test('cap: zones 1-5 open (t2721u; was zone 5 closed); Tavern 4 (47,48) and its zone-5 neighbour (46,48) open',()=>{
 a.deepEqual(plain(API.DEFAULT),{maxZone:5,extraCells:[]});a.ok(Object.isFrozen(API.DEFAULT)&&Object.isFrozen(API.DEFAULT.extraCells));
 for(let i=0;i<N*N;i++)a.equal(cap.isOpen(i%N,Math.floor(i/N)),Z(i)>=1&&Z(i)<=5,`cell ${i%N},${Math.floor(i/N)}`);
 a.deepEqual(plain(T4),[47,48]);a.equal(Z(idx(T4)),4);a.equal(cap.isOpen(47,48),true);a.equal(cap.isOpen(46,48),true);a.equal(Z(idx([46,48])),5);
 a.equal(cap.isZoneOpen(4),true);a.equal(cap.isZoneOpen(5),true);
 let z5=0;for(let i=0;i<N*N;i++)if(Z(i)===5){z5++;a.equal(cap.isOpen(i%N,Math.floor(i/N)),true);}a.equal(z5,716,'every zone 5 cell is open (t2721u)');});
test('cap: no walkable edge leads out of the open area (t2721u; was Tavern 4 west to (46,48))',()=>{const out=[];
 for(let i=0;i<N*N;i++)if(cap.isOpen(i%N,Math.floor(i/N)))for(const j of nb(i))if(!cap.isOpen(j%N,Math.floor(j/N)))out.push([i%N,Math.floor(i/N),j%N,Math.floor(j/N)]);
 a.deepEqual(out,[]);});
function engine(x,y,f=0){const c={window:{}};vm.createContext(c);vm.runInContext(read('maze-data.js'),c);vm.runInContext(read('content-cap.js'),c);
 const els=new Map(),storage=new Map([["sota.stage1.save",JSON.stringify({x,y,f})]]);
 function el(id){if(!els.has(id))els.set(id,{textContent:"",style:{},classList:{add(){},remove(){}},addEventListener(){},getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};}};}});return els.get(id);}
 Object.assign(c,{document:{getElementById:el,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>1},requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){}});
 Object.assign(c.window,{TEX:{S:32},DOORTEX:{},innerWidth:400,innerHeight:300,addEventListener(){}});vm.runInContext(read('game.js'),c);c.SOTA=c.window.SOTA;return {s:c.window.SOTA,el,storage};}
test('live walk: Tavern 3 south is the 3-4 archway (Zone 4 tab crosses, no wait toast); Tavern 4 west is the 4-5 archway (bump stays, no toast; wait is the Zone 5 tab)',()=>{
 const e=engine(51,14,2);e.s.act('fwd');a.deepEqual(plain(e.s.state()),{x:51,y:14,f:2,zone:3});a.equal(e.el('s4toast').textContent,'');
 a.ok(e.s.seamExit(2,4));a.deepEqual(plain(e.s.state()),{x:51,y:15,f:2,zone:4});a.equal(e.el('s4toast').textContent,'');
 const w=engine(47,48,3),before=w.storage.get('sota.stage1.save');w.s.act('fwd');a.deepEqual(plain(w.s.state()),{x:47,y:48,f:3,zone:4});
 a.equal(w.el('s4toast').textContent,'');a.equal(w.storage.get('sota.stage1.save'),before);a.ok(w.s.archAhead(47,48,3)>=0);});
test('path check: Tavern 3 reaches Tavern 4 through zone 4 with every room/door cell as a wall; all zone 4 hallway cells, camps and door approaches reached',()=>{
 const rooms=new Set(M.rooms.map(r=>idx(r.c))),seen=new Set([idx(M.taverns[2])]),qq=[idx(M.taverns[2])];
 for(let k=0;k<qq.length;k++)for(const j of nb(qq[k]))if(!rooms.has(j)&&!seen.has(j)&&cap.isOpen(j%N,Math.floor(j/N))){seen.add(j);qq.push(j);}
 a.ok(seen.has(idx(T4)),'Tavern 4 unreachable');a.equal(CAMPS4.length,12);for(const [c] of CAMPS4)a.ok(seen.has(idx(c)),'zone 4 camp '+c);
 let hall=0;for(let i=0;i<N*N;i++)if(Z(i)===4&&!rooms.has(i)){hall++;a.ok(seen.has(i),`zone 4 hallway ${i%N},${Math.floor(i/N)} cut off`);}a.equal(hall,919-21);
 for(const r of M.rooms.filter(r=>r.z===4))a.ok(seen.has(nb(idx(r.c))[0]),'door approach '+r.id);});
test('door rule: all 21 zone 4 rooms sit on same-zone dead ends, never a hallway gate or next to another room',()=>{const rooms4=M.rooms.filter(r=>r.z===4);a.equal(rooms4.length,21);
 for(const r of rooms4){const x=nb(idx(r.c));a.equal(x.length,1,`room ${r.id} at ${r.c} is not a dead end`);a.equal(Z(x[0]),4);a.ok(!M.rooms.some(o=>idx(o.c)===x[0]),`room ${r.id} opens onto a room`);
  a.ok(![...M.taverns,...M.camps].some(c=>idx(c)===idx(r.c)),'room on a tavern/camp');}
 a.equal(crypto.createHash('sha256').update(M.mask).digest('hex'),'c7a465516de9d683e599c57ff44cb9dca6162f2b04e0daa80eae6bb757e628aa','maze walls unchanged');
 a.equal(crypto.createHash('sha256').update(M.zone).digest('hex'),'e53b3a1503beef7adde391760f4aa2b952b6ef47781842ba1a638382e4d8d144','zones unchanged');});
test('Tavern 4: hub is Zone 4 / Shop / Zone 5; Zone 5 plays exactly "Please wait for update to continue." and saves nothing; Zone 4 (back) saves',()=>{
 const t=harness();Object.assign(t.pos,{x:47,y:48});t.r.s5.tavernScreen(3);a.deepEqual(qa(t,'[data-hub]').map(b=>b.textContent),['Zone 4','Shop','Zone 5']);
 t.click(q(t,'[data-hub=2]'));a.equal(t.r.ui(),'tavern');a.equal(t.scenes[0].kind,'wait-for-update');a.deepEqual(plain(t.scenes[0].lines),[['N','calm','Please wait for update to continue.']]);
 for(let s=0;s<4;s++)a.equal(t.storage.has('sota.party.slot'+s),false);
 t.setStory(false);t.click(q(t,'[data-hub=0]'));a.equal(t.r.ui(),'save-picker');t.click(q(t,'[data-save-slot=3]'));a.equal(JSON.parse(t.storage.get('sota.party.slot3')).at.name,'Tavern 4');
 const h=harness();Object.assign(h.pos,{x:51,y:14});h.r.s5.tavernScreen(2);h.click(q(h,'[data-hub=2]'));a.equal(h.r.ui(),'save-picker','Tavern 3 Zone 4 now saves and exits');a.deepEqual(h.scenes,[]);});
test('Tavern 4 shop opens with owner 4 art; Tavern 3 still sells moonleaf (Tavern 2 does not)',()=>{const h=harness();h.r.live().gold=900;Object.assign(h.pos,{x:47,y:48});
 h.r.s5.shopList(3,'food');a.match(q(h,'.s4page').style.backgroundImage,/owner-4\.webp/);for(const id of ['potion','ether','salts','i_moonleaf'])a.ok(q(h,'[data-buy='+id+']'),'Tavern 4 no '+id);
 h.r.s5.shopList(2,'food');a.ok(q(h,'[data-buy=i_moonleaf]'),'Tavern 3 moonleaf');h.r.s5.shopList(1,'food');a.equal(q(h,'[data-buy=i_moonleaf]'),null);
 a.ok(X.stock(2).ing.includes('i_moonleaf'));});
test('zone 4 encounters use the 7 zone 4 monsters with installed pixel sprites; levels 30-40; Brunn joins at Tavern 4',()=>{const seen=new Set(),files=read('party.js');
 for(let s=1;s<400;s++)for(const m of R.encounter(4,30,0,'normal',s*7919,null)){seen.add(m.n);a.equal(m.zone,4);a.ok(m.lvl>=30&&m.lvl<=40);a.ok(m.mech,'no mechanic on '+m.n);}
 a.deepEqual([...seen].sort(),plain(R.MONSTERS[4]).sort());
 for(const [nm,key] of Z4){a.ok(files.includes('"'+nm+'":"'+key+'"'),'no sprite key for '+nm);const p=path.join(__dirname,'..','art6','fight',key+'.png');a.ok(fs.existsSync(p),key);a.equal(fs.readFileSync(p).slice(1,4).toString(),'PNG');}
 const h=hero('warrior',30),plan=R.planParty(h,1),party=[h,{},{}];a.equal(R.companionFor(3,party,plan).name,'Brunn');a.equal(R.companionFor(2,[h,{}],plan),null);});
test('zone 1-3 monsters are unchanged: no mechanic, same stats as before (zone 3 ZONE_TOUGH kept)',()=>{
 for(let z=1;z<=3;z++)for(let k=0;k<7;k++){const m=R.makeMonster(z,k,z*10,0,'normal');a.equal('mech' in m,false,m.n);}
 a.deepEqual(plain(R.ZONE_TOUGH[3]),{hp:1.2,atk:1.35});a.deepEqual(plain(R.ZONE_TOUGH[4]),{hp:1,atk:.9}/* VER 88: zone 4 plain hits 10% softer, HP unchanged; mechanics carry the difficulty */);
 const m=R.makeMonster(3,1,25,0,'normal');a.deepEqual([m.hp,m.atk,m.def],[Math.round((16+9*25)*1.7*1.25*1.2),Math.round((5+2.1*25)*1.7*1.35*1.35*10)/10,Math.round(25*0.7*1.7*.65)]);});
test('mechanics: scales, stone and shell turn plain Attack (half or less) but skills get through; stone also blunts physical skills; magic is full except on scales (VER 88 reflect)',()=>{
 const avg=(mk,fn)=>{let t=0;for(let s=1;s<=200;s++){const m=mk();m.hp=m.max=1e7;const F=new R.Fight([fn.c],[m],'normal',s);fn.c.mp=99;F.act(0,fn.cmd,fn.arg,0);t+=1e7-m.hp;}return t/200;};
 const w=hero('warrior',32),mg=hero('mage',32);
 for(const [k,mech] of [[2,'scales'],[3,'stone'],[6,'shell']]){a.equal(mon(k).mech,mech);
  const plainMon=()=>Object.assign(mon(k),{mech:undefined}),armMon=()=>mon(k);
  const atkA=avg(armMon,{c:w,cmd:'attack'}),atkP=avg(plainMon,{c:w,cmd:'attack'}),skA=avg(armMon,{c:w,cmd:'skill',arg:'cleave'}),skP=avg(plainMon,{c:w,cmd:'skill',arg:'cleave'});
  a.ok(atkA<=atkP*0.55,`${mech}: attack ${atkA} vs ${atkP}`);if(mech==='stone')a.ok(Math.abs(skA/skP-0.8)<0.03,`stone skill ${skA}/${skP}`);else a.equal(skA,skP,mech+' skill must be full');
  mg.skills=['bolt'];const mA=avg(armMon,{c:mg,cmd:'skill',arg:'bolt'}),mP=avg(plainMon,{c:mg,cmd:'skill',arg:'bolt'});if(mech==='scales')a.ok(Math.abs(mA/mP-0.5)<0.03,'scales throw spells back: '+mA+'/'+mP);else a.equal(mA,mP,mech+' magic must be full');}
 const F=new R.Fight([w],[mon(2)],'normal',3);a.match(F.act(0,'attack',null,0),/Its scales turn plain blows\. Skills get through!/);});
test('mechanics: Manticore venom burns each round until healed, never knocks out alone; Mend or a potion cures it',()=>{
 const w=hero('warrior',32),mg=hero('mage',32);mg.skills=['mend'];const m=mon(4);a.equal(m.mech,'venom');m.atk=1;
 const F=new R.Fight([w,mg],[m],'normal',11);const out=F.monstersTurn();const hit=F.motionHits[0].hero;a.ok(out.some(t=>/is stung by venom!/.test(t)));a.ok(F.venom[hit]);
 const who=F.p[hit],before=who.hp,o2=F.monstersTurn();const d=Math.max(1,Math.round(R.maxHp(who,1)*0.06));a.ok(o2.some(t=>t==='Venom burns '+who.name+' for '+d+'. Heal to cure it'));
 // cure with Mend
 delete F.venom[1-hit];who.hp=Math.round(R.maxHp(who,1)*0.2);const t=F.act(1,'skill','mend',0);a.match(t,/The venom is gone\./);a.equal(F.venom[hit],undefined);
 // venom alone never knocks out
 const G=new R.Fight([w],[Object.assign(mon(4),{hp:0})],'normal',5);G.venom={0:{t:3}};w.hp=2;const og=G.monstersTurn();a.equal(w.hp,1);a.ok(og[0].startsWith('Venom burns'));G.monstersTurn();a.equal(w.hp,1,'venom alone never knocks out');
 // potion cures
 const P=new R.Fight([w],[mon(1)],'normal',6);P.venom={0:{t:3}};w.bag.push('potion');w.hp=5;a.match(P.act(0,'item','potion',0),/The venom is gone\./);});
test('mechanics: Ogre warlord war cry makes the others hit 20% harder while it stands (target choice); the Minotaur warns, then charges the whole party',()=>{
 const p=()=>[hero('warrior',32),hero('mage',32),hero('rogue',32)];
 const dmg=(mons,seed)=>{const party=p(),F=new R.Fight(party,mons,'normal',seed);const out=F.monstersTurn();return {F,out,tot:F.motionHits.filter(h=>F.m[h.i].mech!=='warcry').reduce((t,h)=>t+h.dmg,0)};};
 let a1=0,a0=0;/* VER 88: the partner is the Lizard man, not the Griffin, whose dive now depends on earlier hits */for(let s=1;s<300;s++){a1+=dmg([mon(5),mon(2)],s).tot;const o=mon(5);o.hp=0;a0+=dmg([o,mon(2)],s).tot;}a.ok(a1/a0>1.12&&a1/a0<1.3,'war cry ratio '+a1/a0);
 a.ok(dmg([mon(5),mon(1)],3).out.includes('The Ogre warlord roars! The others hit harder while it stands'));
 const party=p();party.forEach(c=>c.hp=1e5);const F=new R.Fight(party,[mon(0)],'normal',9);F.monstersTurn();a.equal(F.motionHits.length,1);const o1=F.monstersTurn();a.ok(o1.includes('The Minotaur lowers its horns. A charge is coming — Defend!'));
 F.act(0,'defend');const o2=F.monstersTurn();a.equal(F.motionHits.length,3,'charge hits everyone');a.ok(F.motionHits.every(h=>h.pulse));a.ok(o2.every(t=>/charges into/.test(t)));});
test('zone 4 drops: zone 4 parts (griffin feather, minotaur horn) and zone 4 food incl. moonleaf; moonleaf drops often enough to farm',()=>{const got=new Set();let moon=0;
 for(let s=0;s<3000;s++)X.drops(4,s).forEach(id=>{got.add(id);if(id==='i_moonleaf')moon++;});a.deepEqual([...got].sort(),['i_firepepper','i_griffinegg','i_moonleaf','p_feather','p_horn']);a.ok(moon/3000>0.1,'moonleaf rate '+moon/3000);});
test('real drops in a real zone 4 win: the bag gains moonleaf at least once in 40 won fights',()=>{const h=harness(),L=h.r.live();Object.assign(h.pos,{x:51,y:15});
 const c=L.party[0];c.lvl=40;c.stats.str=80;c.stats.con=60;c.hp=h.R.maxHp(c,1);let found=false;
 for(let k=0;k<40&&!found;k++){const n0=bagAll(h).filter(x=>x==='i_moonleaf').length;h.r.startFight([h.R.makeMonster(4,k%7,30,0,'normal')],'random');const F=h.r.fight();F.m.forEach(m=>m.hp=0);F.over='win';h.r.forceEnd('win');
  if(bagAll(h).filter(x=>x==='i_moonleaf').length>n0)found=true;h.r.closeUI();c.bag=c.bag.filter(x=>!x.startsWith('p_'));}
 a.ok(found,'no moonleaf in 40 zone 4 wins');});
test('no strong 4-box crafts: the craft list is unchanged, nothing non-exception needs 4 boxes, held strong crafts stay held',()=>{
 a.deepEqual(plain(X.CRAFTS.map(c=>c.id)),['potion','ether','ration','salts','jerky','tent','elixir','stew']);
 for(const c of X.CRAFTS){const s=X.craftSize(c);if(!c.exception)a.ok(s<=3,c.id+' is a 4-box craft');a.ok(X.craftZone(c)<=4,c.id);}
 a.deepEqual(plain(X.CRAFTS.filter(c=>X.craftSize(c)===4).map(c=>c.id)),['jerky'],'only the named exception uses 4 boxes');
 const HELD=require('../econ-held-crafts.js');a.deepEqual(HELD.CRAFTS.map(c=>c.id),['dragonelixir','roast']);a.ok(HELD.CRAFTS.every(c=>X.craftSize(c)===4&&X.craftZone(c)>=5));
 for(const id of ['c_dragonelixir','c_roast'])a.equal(R.ITEMS[id],undefined);a.ok(!/econ-held-crafts/.test(read('index.html'))&&!/econ-held-crafts/.test(read('sw.js')));});
test('carry-over: after a zone 4 win or run a KO member wakes at exactly 1 HP; boss win too; salts are battle-only at 25%',()=>{
 for(const how of ['win','ran']){const h=harness(),L=h.r.live();L.party.push(h.R.makeCompanion(h.R.COMPANIONS[0],L.party[0].lvl));h.r.startFight([h.R.makeMonster(4,4,30,0,'normal')],'random');L.party[1].hp=0;h.r.forceEnd(how);a.equal(L.party[1].hp,1,how);h.r.closeUI();a.equal(L.party[1].hp,1);}
 const b=harness(),LB=b.r.live();LB.party.push(b.R.makeCompanion(b.R.COMPANIONS[0],LB.party[0].lvl));b.r.doSave();b.r.startBoss();LB.party[1].hp=0;b.r.forceEnd('win');a.equal(LB.party[1].hp,1,'boss');
 a.equal(R.ITEMS.salts.revive,0.25);a.equal(R.ITEMS.salts.battle,true);
 const p=[hero('warrior',32),hero('mage',32)];p[0].bag.push('salts');p[1].hp=0;const f=new R.Fight(p,[mon(4)],'normal',7);a.match(f.act(0,'item','salts',1),/is back up/);a.equal(p[1].hp,Math.round(R.maxHp(p[1],1)*0.25));
 const h=harness(),L=h.r.live();L.party[0].bag.push('salts');a.equal(h.r.mazeSlotChoices().some(x=>(x.id||x)==='salts'||(Array.isArray(x)&&x[0]==='salts')),false,'no salts maze box');
 const src=read('party.js');a.equal(src.split('"Wake "').length-1,1,'Wake only in the fight item menu');a.equal(/salts/.test(read('rules.js').slice(read('rules.js').indexOf('const MECH='),read('rules.js').indexOf('// Jeremy t1968u'))),false,'zone 4 adds no salts path');});
test('Beasts: a fought zone 4 beast is recorded on the save, listed with its pencil sketch, and its detail shows the zone 4 note',()=>{
 for(const [,f] of Z4){const p=path.join(__dirname,'..','art-intro','journal','monsters',f+'.webp'),b=fs.readFileSync(p);a.equal(b.slice(0,4).toString(),'RIFF');a.equal(b.slice(8,12).toString(),'WEBP');}
 const h=harness(),L=h.r.live();L.beasts=[];h.r.startFight([h.R.makeMonster(4,4,30,0,'normal'),h.R.makeMonster(5,0,40,0,'normal'),h.R.makeMonster(1,0,1,0,'normal')],'random');
 a.deepEqual(plain(L.beasts),['z4-manticore','z1-rat'],'zone 5 is not recorded');h.r.forceEnd('ran');h.r.closeUI();
 vm.runInContext(read('intro-art-data.js'),h.c);vm.runInContext(read('story-journal-generator.js'),h.c);const i=h.intro();i.openJournal('beasts');const jb=h.document.getElementById('ijour');
 a.deepEqual(jb.querySelectorAll('[data-beast]').map(f=>f.dataset.beast),['z1-rat','z4-manticore']);
 h.click(jb.querySelector('[data-beast=z4-manticore]'));const d=h.document.getElementById('ijour').querySelector('[data-beast-detail=z4-manticore]');a.ok(d,'no detail');const every=n=>[n].concat(...(n.children||[]).map(every));a.ok(every(d).some(e=>/barbs that land ugly/.test(e.textContent||'')),'zone 4 note missing');a.ok(every(d).some(e=>e.tagName==='IMG'&&/z4-manticore\.webp/.test(e.src)),'sketch missing in detail');
 L.beasts=Z4.map(z=>z[1]);i.openJournal('inventory');i.openJournal('beasts');a.deepEqual(h.document.getElementById('ijour').querySelectorAll('[data-beast]').map(f=>f.dataset.beast),Z4.map(z=>z[1]));});
test('offline: both manifests and the precache list each zone 4 sketch once; pins VER 88 (zone 4 content pass on the VER 87 port of live 9f392ea), content-cap v7, rules v23, party v35, intro v21, intro-art-data v6',()=>{
 const sw=read('sw.js'),art=read('intro-art-data.js'),html=read('index.html');a.match(sw,/^const VER="103",/);
 const c={window:{},self:{addEventListener(){}}};vm.runInNewContext(art,c);vm.runInNewContext(sw+';this.shell=SHELL;',c);
 for(const [,f] of Z4){a.equal(c.window.INTRO_ART.filter(p=>p==='journal/monsters/'+f+'.webp').length,1,f);a.equal(c.shell.filter(p=>p==='art-intro/journal/monsters/'+f+'.webp').length,1,f);}
 a.equal(new Set(c.shell).size,c.shell.length,'SHELL has duplicates');
 for(const p of ['content-cap.js?v=8','rules.js?v=24','party.js?v=40','intro.js?v=21','intro-art-data.js?v=6','econ.js?v=17','splash.js?v=1','story.js?v=25','music.js?v=20'])for(const s of [html,sw])a.ok(s.includes(p),p);
 for(const old of ['content-cap.js?v=6"','rules.js?v=21"','party.js?v=30"','intro.js?v=17"','intro-art-data.js?v=5"'])a.ok(!html.includes(old)&&!sw.includes(old),'stale '+old);
 for(const m of html.matchAll(/<script src="([^"]+\?v=\d+)"/g))a.ok(c.shell.includes(m[1]),m[1]);});
test('save keys unchanged: party slots, legacy party key and maze save are the same names',()=>{const p=read('party.js'),g=read('game.js');
 a.match(p,/const SAVE="sota\.party",/);a.match(p,/const SLOT=SAVE\+"\.slot",ACTIVE=SAVE\+"\.active";/);a.ok(/sota\.stage1\.save/.test(g));
 const h=harness(),L=h.r.live();Object.assign(h.pos,{x:47,y:48,f:3});L.gold=55;h.r.s5.leaveShop(3);h.click(q(h,'[data-save-slot=2]'));a.ok(h.storage.has('sota.party.slot2'));
 Object.assign(h.pos,{x:0,y:64,f:0});L.gold=1;a.equal(h.r.loadSlot(2),true);a.deepEqual([h.pos.x,h.pos.y],[47,48]);a.equal(h.r.live().gold,55);});
test('music: zone 4 plays maze_zone4 under the default cap; zone 5 plays maze_zone5 (t2721u; was falls back to zone 4)',()=>{const mm=read('tests/maze_music_cap_test.js'),musicFor=eval('('+mm.slice(mm.indexOf('function musicFor'),mm.indexOf('\ntest('))+'\n)');
 a.ok(fs.existsSync(path.join(__dirname,'..','music','maze_zone4.mp3')));a.equal(musicFor(null,4,51,15).maze(),'maze_zone4');a.equal(musicFor(null,4,47,48).maze(),'maze_zone4');a.equal(musicFor(null,5,46,48).maze(),'maze_zone5');});
test('art locks: fight sprites, camp/tavern/dialog art and occupancy fixtures are untouched; only zone 4 sketches are new images',()=>{
 const {execFileSync}=require('node:child_process'),root=path.join(__dirname,'..');
 const st=execFileSync('git',['-C',root,'status','--porcelain','--','art6','art-dialogue','art-intro'],{encoding:'utf8'}).split('\n').filter(Boolean).map(l=>l.slice(3));
 const z3work=['art-intro/cave/title.webp','art-intro/menu/title-wall.webp']; // inherited from zone3-work (t2364u title, t2386u brand, z3 sketches)
 for(const f of st)a.ok(z3work.includes(f)||/^art-intro\/brand\//.test(f)||/^art-intro\/journal\/monsters\/z[34]-[a-z]+\.webp$/.test(f)||/^art-intro\/journal\/monsters\/$/.test(f)||/^art-intro\/brand\/$/.test(f),'changed art: '+f);});

// ---- VER 88 zone 4 content pass (t2409u): new mechanics reward healing, weapon skills, target choice, strong skills and Defend ----
test('VER 88 dive: the Griffin always dives at the member with the lowest health share, and hits harder on anyone under half',()=>{
 const p=[hero('warrior',32),hero('mage',32),hero('rogue',32)];p.forEach(c=>c.hp=R.maxHp(c,1));p[1].hp=Math.round(R.maxHp(p[1],1)*0.4);
 for(let s=1;s<40;s++){const F=new R.Fight(p.map(c=>Object.assign(plain(c),{})),[mon(1)],'normal',s);F.turn=0;const out=F.monstersTurn();a.equal(F.motionHits[0].hero,1,'dive target seed '+s);a.ok(/dives at H for \d+\. It goes for the weakest\. Heal them!/.test(out[0]),out[0]);}
 // same seed, healthy vs low target: +35%
 let lo=0,hi=0;for(let s=1;s<200;s++){const q=[hero('warrior',32)];q[0].hp=1e4;const big=R.maxHp(q[0],1);
  const A=new R.Fight([Object.assign(hero('warrior',32),{hp:Math.round(big*0.9)})],[mon(1)],'normal',s);A.monstersTurn();hi+=A.motionHits[0].dmg;
  const B=new R.Fight([Object.assign(hero('warrior',32),{hp:Math.round(big*0.45)})],[mon(1)],'normal',s);B.monstersTurn();lo+=B.motionHits[0].dmg;}
 a.ok(lo/hi>1.25&&lo/hi<1.45,'dive bonus '+lo/hi);a.equal(R.DIVE,1.35);a.equal(R.DIVE_LOW,0.5);});
test('VER 88 reflect: a spell on a Lizard man does half and the caster takes some back (never knocked out by it); weapon skills are full',()=>{
 const mg=hero('mage',32);mg.skills=['bolt'];mg.mp=99;const m=mon(2);m.hp=m.max=1e7;const F=new R.Fight([mg],[m],'normal',4);const hp0=mg.hp;const t=F.act(0,'skill','bolt',0);
 a.match(t,/Its scales throw the spell back! Weapon skills work best\. H takes \d+/);a.ok(mg.hp<hp0);
 mg.hp=1;const G=new R.Fight([mg],[Object.assign(mon(2),{hp:1e7,max:1e7})],'normal',5);mg.mp=99;G.act(0,'skill','bolt',0);a.equal(mg.hp,1,'reflect alone never knocks out');
 const w=hero('warrior',32);w.mp=99;const H=new R.Fight([w],[Object.assign(mon(2),{hp:1e7,max:1e7})],'normal',6);const w0=w.hp;a.doesNotMatch(H.act(0,'skill','cleave',0),/throw the spell back/);a.equal(w.hp,w0);});
test('VER 88 enrage: under 30% health the Ogre warlord is enraged (said once) and hits 60% harder',()=>{
 let n=0,e=0;for(let s=1;s<200;s++){const mk=()=>[hero('warrior',32)].map(c=>Object.assign(c,{hp:1e5}));
  const A=new R.Fight(mk(),[mon(5)],'normal',s);A.monstersTurn();n+=A.motionHits[0].dmg;
  const o=mon(5);o.hp=Math.floor(o.max*0.3);const B=new R.Fight(mk(),[o],'normal',s);const out=B.monstersTurn();e+=B.motionHits[0].dmg;if(s===1){a.ok(out.includes('The Ogre warlord is enraged! Finish it fast, or Defend'));a.equal(B.monstersTurn().filter(t=>/enraged/.test(t)).length,0,'said once');}}
 a.ok(e/n>1.5&&e/n<1.7,'enrage ratio '+e/n);const o=mon(5);a.equal(R.enraged(o),false);o.hp=Math.floor(o.max*0.3);a.equal(R.enraged(o),true);a.equal(R.monTag(new R.Fight([hero('warrior',32)],[o],'normal',1),o),'enraged');});
test('VER 88 shield: while a Giant scorpion stands, other monsters take half from Attack, skills and spells; beat it first',()=>{
 const avg=(withScorp,cmd,c,arg)=>{let t=0;for(let s=1;s<=150;s++){const m=mon(0);m.hp=m.max=1e7;const mons=withScorp?[m,mon(6)]:[m];c.mp=99;const F=new R.Fight([c],mons,'normal',s);F.act(0,cmd,arg,0);t+=1e7-m.hp;}return t/150;};
 const w=hero('warrior',32),mg=hero('mage',32);mg.skills=['bolt'];w.skills=['cleave'];
 for(const [c,cmd,arg] of [[w,'attack',null],[w,'skill','cleave'],[mg,'skill','bolt']]){const r=avg(true,cmd,c,arg)/avg(false,cmd,c,arg);a.ok(Math.abs(r-0.5)<0.03,cmd+' '+arg+' shielded ratio '+r);}
 const F=new R.Fight([w],[mon(0),mon(6)],'normal',2);a.match(F.act(0,'attack',null,0),/The Giant scorpion shields it\. Beat the scorpion first!/);
 a.equal(R.monTag(F,F.m[1]),'shields others');a.equal(R.monTag(F,F.m[0]),'shielded');F.m[1].hp=0;a.equal(R.monTag(F,F.m[0]),'');a.equal(R.guarded(F,F.m[0]),false);
 const G=new R.Fight([w],[mon(6)],'normal',3);a.equal(R.monTag(G,G.m[0]),'','a lone scorpion shields nobody');});
test('VER 88 fight screen: the target list and enemy line show the zone 4 status word; zone 1-3 fights show none',()=>{
 const h=harness();h.r.startFight([h.R.makeMonster(4,0,30,0,'normal'),h.R.makeMonster(4,6,30,0,'normal')],'random');
 const en=h.document.getElementById('fen');a.equal(en.textContent,'Minotaur (shielded) · Giant scorpion (shields others)');h.r.forceEnd('ran');h.r.closeUI();
 const z=harness();z.r.startFight([z.R.makeMonster(3,0,25,0,'normal'),z.R.makeMonster(3,1,25,0,'normal')],'random');a.equal(z.document.getElementById('fen').textContent,'Centaur · Werewolf');z.r.forceEnd('ran');z.r.closeUI();
 for(let zz=1;zz<=3;zz++)for(let k=0;k<7;k++){const F=new R.Fight([hero('warrior',30)],[R.makeMonster(zz,k,zz*10,0,'normal'),R.makeMonster(zz,(k+1)%7,zz*10,0,'normal')],'normal',1);a.equal(R.monTag(F,F.m[0]),'');}
 const src=read('party.js');a.ok(/function targets\(cmd,arg\)\{return F\.m\.map\(\(m,i\)=>m\.hp>0\?\{t:m\.n\+" · "\+m\.hp\+monTagText\(m\)/.test(src));});
test('VER 88 balance (t2409u): zone 4 attack-only below zone 3 overall and in rooms; reading the fight wins 90-97% (a little below zone 3)',()=>{
 const {execFileSync}=require('node:child_process'),run=(...f)=>execFileSync(process.execPath,[path.join(__dirname,'t2419u_playtest_zone4.js'),'8',...f],{encoding:'utf8'});
 const tot=(out,z)=>{const m=new RegExp('TOTAL zone '+z+': (\\d+) fights, win ([\\d.]+)%; (\\d+) hallway fights, win ([\\d.]+)%; (\\d+) room fights, win ([\\d.]+)%').exec(out);a.ok(m,'no total for zone '+z);return {f:+m[1],win:+m[2],room:+m[6],rf:+m[5]};};
 const s=run(),o=run('--attack-only'),s3=tot(s,3),s4=tot(s,4),o3=tot(o,3),o4=tot(o,4);
 a.ok(s4.f>=1000&&o4.f>=1000,'1000+ fights');a.ok(o4.win<o3.win-10,'attack-only overall '+o4.win+' vs zone 3 '+o3.win);a.ok(o4.room<o3.room-10,'attack-only rooms '+o4.room+' vs zone 3 '+o3.room);
 a.ok(s4.win>=90&&s4.win<=97,'sensible zone 4 '+s4.win);a.ok(s4.win<s3.win,'zone 4 a little below zone 3');});
