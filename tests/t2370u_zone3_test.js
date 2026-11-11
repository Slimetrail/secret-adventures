"use strict";
// Jeremy t2362u step 2 / t2370u: zone 3 plays end to end in the unpublished build. Raised cap (zones 1-3, Tavern 3's Zone 4 exit waits),
// zone 3 fights and drops, camps (Craft button, tent saves), Tavern 2/3 shops, the save picker, leveling/CON/crits, the journal,
// the two medium 3-box crafts shipped for zone 3, and the door rule for zone 3. Usage: node --test tests/t2370u_zone3_test.js
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const plain=o=>JSON.parse(JSON.stringify(o));
const flow=read('tests/tavern_shop_camp_flow_test.js');
const baseHarness=eval('('+flow.slice(flow.indexOf('function harness'),flow.indexOf('\nfor(let t=0'))+')');
function harness(init){const h=baseHarness(init),create=h.document.createElement;h.document.createElement=t=>{const e=create(t);if(t==='canvas'){e.toDataURL=()=>'data:,';e.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},width:0})});}return e;};h.c.Image=class{constructor(){this.complete=false;}};return h;}
const E=h=>h.c.window.ECON;
const q=(h,s)=>h.ov.querySelector(s),qa=(h,s)=>h.ov.querySelectorAll(s);
const pop=h=>h.document.getElementById('s5craftpop');
const boxes=h=>pop(h).querySelectorAll('[data-cbox]');
const bagAll=h=>h.r.live().party.flatMap(c=>c.bag);
const n=(h,id)=>bagAll(h).filter(x=>x===id).length;
function tapIn(h,ids){h.click(boxes(h).find(b=>!b.dataset.item));for(const id of ids){const b=pop(h).querySelector('[data-cpick='+id+']');a.ok(b,'picker has no '+id);h.click(b);}}
// plain maze/cap context
const box={window:{}};vm.createContext(box);vm.runInContext(read('maze-data.js'),box);vm.runInContext(read('content-cap.js'),box);
const M=box.window.MAZE,N=M.n,API=box.window.SOTA_CONTENT_CAP,cap=API.create(N,M.zone),Z=i=>+M.zone[i],idx=([x,y])=>y*N+x;
const masks=Array.from(M.mask,c=>parseInt(c,16)),DIRS=[[1,0,-1],[2,1,0],[4,0,1],[8,-1,0]];
const nb=i=>{const x=i%N,y=Math.floor(i/N),o=[];for(const[b,dx,dy]of DIRS)if(masks[i]&b)o.push((y+dy)*N+x+dx);return o;};
const T3=M.taverns[2],CAMPS3=M.camps.map((c,k)=>[c,k]).filter(([c])=>Z(idx(c))===3);
const RO={window:{}};vm.createContext(RO);vm.runInContext(read('rules.js'),RO);RO.window.RPG=RO.window.RPG||RO.RPG;vm.runInContext(read('econ.js'),RO);
const R=RO.window.RPG,X=RO.window.ECON;

// t2419u: the cap is now zones 1-4; zone 3 checks still hold, and Tavern 3's zone-4 neighbour (51,15) is open.
test('cap: zones 1-4 open, zone 5 closed; Tavern 3 and its zone-4 neighbour (51,15) are open',()=>{
 a.deepEqual(plain(API.DEFAULT),{maxZone:4,extraCells:[]});a.ok(Object.isFrozen(API.DEFAULT)&&Object.isFrozen(API.DEFAULT.extraCells));
 for(let i=0;i<N*N;i++)a.equal(cap.isOpen(i%N,Math.floor(i/N)),Z(i)<=4,`cell ${i%N},${Math.floor(i/N)}`);
 a.deepEqual(plain(T3),[51,14]);a.equal(cap.isOpen(51,14),true);a.equal(cap.isOpen(51,15),true);a.equal(cap.isOpen(19,24),true);a.equal(cap.isOpen(19,23),true);
 a.equal(cap.isZoneOpen(3),true);a.equal(cap.isZoneOpen(4),true);a.equal(cap.isZoneOpen(5),false);});
test('cap: the ONLY walkable edge out of the open area is Tavern 4 west to (46,48) (t2419u; was Tavern 3 south)',()=>{const out=[];
 for(let i=0;i<N*N;i++)if(cap.isOpen(i%N,Math.floor(i/N)))for(const j of nb(i))if(!cap.isOpen(j%N,Math.floor(j/N)))out.push([i%N,Math.floor(i/N),j%N,Math.floor(j/N)]);
 a.deepEqual(out,[[47,48,46,48]]);});
// live engine (game.js) like content_cap_test: walk tavern 2 -> zone 3; Tavern 3 south refuses with the exact wait text
function engine(x,y,f=0){const c={window:{}};vm.createContext(c);vm.runInContext(read('maze-data.js'),c);vm.runInContext(read('content-cap.js'),c);
 const els=new Map(),storage=new Map([["sota.stage1.save",JSON.stringify({x,y,f})]]);
 function el(id){if(!els.has(id))els.set(id,{textContent:"",style:{},classList:{add(){},remove(){}},addEventListener(){},getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};}};}});return els.get(id);}
 Object.assign(c,{document:{getElementById:el,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>1},requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){}});
 Object.assign(c.window,{TEX:{S:32},DOORTEX:{},innerWidth:400,innerHeight:300,addEventListener(){}});vm.runInContext(read('game.js'),c);c.SOTA=c.window.SOTA;return {s:c.window.SOTA,el};}
test('live walk: Tavern 2 east is the seam archway (t2528u); the Zone 3 side (19,24) then north into zone 3 with no wait toast',()=>{const e=engine(18,24,1);e.s.act('fwd');a.deepEqual(plain(e.s.state()),{x:18,y:24,f:1,zone:2});a.ok(e.s.seamExit(1,3));e.s.act('fwd');
 a.deepEqual(plain(e.s.state()),{x:19,y:23,f:0,zone:3});a.equal(e.el('s4toast').textContent,'');});
test('live walk: Tavern 3 south now steps into zone 4 with no wait toast (t2419u; the wait moved to Tavern 4)',()=>{const e=engine(51,14,2);e.s.act('fwd');
 a.deepEqual(plain(e.s.state()),{x:51,y:15,f:2,zone:4});a.equal(e.el('s4toast').textContent,'');});
test('a path through zone 3 joins Tavern 2 to Tavern 3 inside the cap with every room/door cell treated as a wall',()=>{
 const rooms=new Set(M.rooms.map(r=>idx(r.c))),seen=new Set([idx(M.taverns[1])]),qq=[idx(M.taverns[1])];
 for(let k=0;k<qq.length;k++)for(const j of nb(qq[k]))if(!rooms.has(j)&&!seen.has(j)&&cap.isOpen(j%N,Math.floor(j/N))){seen.add(j);qq.push(j);}
 a.ok(seen.has(idx(T3)),'Tavern 3 unreachable');for(const [c] of CAMPS3)a.ok(seen.has(idx(c)),'zone 3 camp '+c);});
// t2370u door rule for zone 3 (the same check is also in tests/t2327u_room_deadends_test.js)
test('t2370u zone 3 door rule: every zone 3 room is a same-zone dead end, never a hallway gate',()=>{const rooms3=M.rooms.filter(r=>r.z===3);a.equal(rooms3.length,16);
 for(const r of rooms3){const x=nb(idx(r.c));a.equal(x.length,1,`room ${r.id} at ${r.c} is not a dead end`);a.equal(Z(x[0]),3);a.ok(!M.rooms.some(o=>idx(o.c)===x[0]),`room ${r.id} opens onto a room`);}});
test('Tavern 2 Zone 3 saves through the 4-slot picker and exits; t2419u: Tavern 3 Zone 4 now saves and exits too',()=>{
 const h=harness();Object.assign(h.pos,{x:18,y:24});h.r.s5.tavernScreen(1);h.click(q(h,'[data-hub=2]'));a.equal(h.r.ui(),'save-picker');a.equal(qa(h,'[data-save-slot]').length,4);
 h.click(q(h,'[data-save-slot=1]'));a.equal(h.r.ui(),null);a.equal(JSON.parse(h.storage.get('sota.party.slot1')).at.name,'Tavern 2');a.deepEqual(h.scenes,[]);
 const t=harness();Object.assign(t.pos,{x:51,y:14});t.r.s5.tavernScreen(2);a.deepEqual(qa(t,'[data-hub]').map(b=>b.textContent),['Zone 3','Shop','Zone 4']);
 t.click(q(t,'[data-hub=2]'));a.equal(t.r.ui(),'save-picker','Tavern 3 "Zone 4" saves');a.deepEqual(t.scenes,[]);
 t.click(q(t,'[data-save-slot=1]'));a.equal(t.r.ui(),null);a.equal(JSON.parse(t.storage.get('sota.party.slot1')).at.name,'Tavern 3');
 t.r.s5.tavernScreen(2,false);t.setStory(false);t.click(q(t,'[data-hub=0]'));a.equal(t.r.ui(),'save-picker','Tavern 3 "Zone 3" (back) still saves');});
test('Tavern 3 shop: owner 3 art; sells moonleaf and fowl (zone 3 food) and silk/hide/shard parts; shop stock is not gated',()=>{const h=harness();h.r.live().gold=500;Object.assign(h.pos,{x:51,y:14});
 h.r.s5.shopList(2,'food');a.match(q(h,'.s4page').style.backgroundImage,/owner-3\.webp/);for(const id of ['i_moonleaf','i_fowl','i_cheese','potion','ether','salts'])a.ok(q(h,'[data-buy='+id+']'),'no '+id);
 a.equal(q(h,'[data-buy=i_starfruit]'),null,'tier-4 food sold early');
 h.click(q(h,'[data-buy=i_moonleaf]'));a.equal(n(h,'i_moonleaf'),1);a.equal(h.r.live().gold,500-X.price('i_moonleaf'));
 h.r.s5.shopList(2,'craft');for(const id of ['tent','p_silk','p_hide','p_shard','w_sword','w_helm','w_leather','w_bow'])a.ok(q(h,'[data-buy='+id+']'),'no '+id);
 h.r.s5.shopList(1,'food');a.equal(q(h,'[data-buy=i_moonleaf]'),null,'Tavern 2 sells moonleaf');a.ok(q(h,'[data-buy=i_meat]'));
 h.r.s5.shopList(2,'recipes');a.ok(qa(h,'[data-recipe]').length>0);});
test('zone 3 encounters use the 7 zone 3 monsters, each with an installed pixel sprite; levels start at 20',()=>{const seen=new Set(),files=read('party.js');
 for(let s=1;s<400;s++)for(const m of R.encounter(3,20,0,'normal',s*7919,null)){seen.add(m.n);a.equal(m.zone,3);a.ok(m.lvl>=20&&m.lvl<=30);}
 a.deepEqual([...seen].sort(),plain(R.MONSTERS[3]).sort());
 for(const nm of R.MONSTERS[3]){const f=files.match(new RegExp('"'+nm+'":"(z3-[a-z]+)"'));a.ok(f,'no sprite key for '+nm);a.ok(fs.existsSync(path.join(__dirname,'..','art6','fight',f[1]+'.png')),f[1]);}});
test('zone 3 drops: only zone 3 parts (wolf pelt, ghoul fang, bone shard) and zone 3 food (fowl, sage, fish)',()=>{const got=new Set();
 for(let s=0;s<3000;s++)X.drops(3,s).forEach(id=>got.add(id));a.deepEqual([...got].sort(),['i_fish','i_fowl','i_sage','p_fang','p_pelt','p_shard']);});
test('real drops in a real zone 3 win: after a won fight the bag gains the drops endFight reports',()=>{const h=harness(),L=h.r.live();Object.assign(h.pos,{x:19,y:23});
 const c=L.party[0];c.lvl=30;c.stats.str=60;c.stats.con=40;c.hp=h.R.maxHp(c,1);let found=null;
 for(let k=0;k<12&&!found;k++){const before=bagAll(h).slice();h.r.startFight([h.R.makeMonster(3,k%7,20,0,'normal')],'random');const F=h.r.fight();F.m.forEach(m=>m.hp=0);F.over='win';h.r.forceEnd('win');
  const add=bagAll(h).filter(x=>bagAll(h).filter(y=>y===x).length>before.filter(y=>y===x).length);if(add.some(id=>['p_pelt','p_fang','i_fowl','i_sage','i_fish','p_shard'].includes(id)))found=add;h.r.closeUI();}
 a.ok(found,'no zone 3 drop in 12 won fights');});
test('medium crafts ship for zone 3: Moon elixir and Hunter\'s stew, 3 boxes, each needing a material first had in zone 3; strong ones stay held',()=>{
 const ids=plain(X.CRAFTS.map(c=>c.id));a.deepEqual(ids,['potion','ether','ration','salts','jerky','tent','elixir','stew']);
 const el=X.CRAFTS.find(c=>c.id==='elixir'),st=X.CRAFTS.find(c=>c.id==='stew');a.deepEqual(plain(el.need),{i_herbs:1,i_moonleaf:1,p_fang:1});a.deepEqual(plain(st.need),{i_meat:1,i_fowl:1,p_pelt:1});
 for(const c of [el,st]){a.equal(X.craftSize(c),3);a.equal(X.STRENGTH[3],'Medium');a.equal(X.craftZone(c),3);a.ok(!c.exception);}
 a.equal(X.firstZone('i_moonleaf'),3);a.equal(X.firstZone('p_fang'),3);a.equal(X.firstZone('i_fowl'),3);a.equal(X.firstZone('p_pelt'),3);
 a.ok(X.stock(2).ing.includes('i_moonleaf')&&!X.stock(1).ing.includes('i_moonleaf'),'moonleaf first sold at Tavern 3');
 for(const c of X.CRAFTS){if(c.exception)continue;const s=X.craftSize(c),zs=Object.keys(c.need).map(X.firstZone);if(s===3)a.ok(zs.some(z=>z>=3),c.id);if(s===4)a.ok(zs.some(z=>z>=5),c.id);a.ok(X.craftZone(c)<=3,c.id+' needs a zone beyond the cap');}
 const HELD=require('../econ-held-crafts.js');a.deepEqual(HELD.CRAFTS.map(c=>c.id),['dragonelixir','roast']);a.ok(HELD.CRAFTS.every(c=>c.step===4&&X.craftSize(c)===4));
 for(const id of ['c_dragonelixir','c_roast'])a.equal(R.ITEMS[id],undefined);a.ok(!/econ-held-crafts/.test(read('index.html'))&&!/econ-held-crafts/.test(read('sw.js')));
 // medium beats weak for the same kind
 for(const kind of ['potion','food']){const by=k=>X.CRAFTS.filter(c=>c.kind===kind&&!c.exception&&X.craftSize(c)===k).map(c=>X.useScore(c.out));a.ok(Math.min(...by(3))>Math.max(...by(2)),kind);}});
test('zone 3 camp: Craft button, tap meat+fowl+pelt -> Hunter\'s stew (pixel picture), learned in the journal; elixir from herbs+moonleaf+fang',()=>{
 const h=harness(),L=h.r.live();const [c,k]=CAMPS3[0];Object.assign(h.pos,{x:c[0],y:c[1],f:0});L.campTut='done';L.crafts={};
 L.party[0].bag=['i_meat','i_fowl','p_pelt','i_herbs','i_moonleaf','p_fang'];h.r.s5.campScreen(k);const b=q(h,'[data-craftopen]');a.ok(b);a.match(b.className,/s5craftb/);
 h.click(b);tapIn(h,['i_meat','i_fowl','p_pelt']);h.click(pop(h).querySelector('#s5craft'));a.equal(n(h,'c_stew'),1);a.equal(n(h,'p_pelt')+n(h,'i_fowl')+n(h,'i_meat'),0);
 a.equal(h.document.getElementById('s5craftpic').dataset.result,'stew');a.ok(L.crafts.stew);
 h.r.s5.craftReset();tapIn(h,['i_herbs','i_moonleaf','p_fang']);h.click(pop(h).querySelector('#s5craft'));a.equal(n(h,'c_elixir'),1);a.ok(L.crafts.elixir);
 const i=h.intro();i.openJournal('recipes');const jb=h.document.getElementById('ijour');a.ok(jb.querySelector('[data-craft=stew]'));a.ok(jb.querySelector('[data-craft=elixir]'));
 a.match(jb.querySelector('[data-craft=stew]').textContent,/Hunter's stew/);});
test('zone 3 camps: every one has the Craft button; a camp save uses 1 tent, the same spot re-save none; no tent = blocked',()=>{a.equal(CAMPS3.length,8);
 for(const [c,k] of CAMPS3){const h=harness(),L=h.r.live();L.campTut='done';Object.assign(h.pos,{x:c[0],y:c[1],f:0});L.party[0].bag=[];h.r.s5.campScreen(k);a.ok(q(h,'[data-craftopen]'),'camp '+(k+1));
  a.equal(h.r.doSave(),false,'camp '+(k+1)+' saved without a tent');L.party[0].bag.push('tent');a.equal(h.r.doSave(),true);a.equal(n(h,'tent'),0);a.equal(h.r.doSave(),true,'same-spot re-save');
  a.equal(JSON.parse(h.storage.get('sota.party.slot0')).at.name,'Camp '+(k+1));}});
test('save picker round trip in zone 3: save at Tavern 3, load restores position, party and bag',()=>{const h=harness(),L=h.r.live();Object.assign(h.pos,{x:51,y:14,f:3});L.party[0].bag=['c_stew','i_moonleaf'];L.gold=77;
 h.r.s5.leaveShop(2);h.click(q(h,'[data-save-slot=2]'));a.equal(h.r.ui(),'tavern');Object.assign(h.pos,{x:0,y:64,f:0});L.gold=1;L.party[0].bag=[];
 a.equal(h.r.loadSlot(2),true);a.deepEqual([h.pos.x,h.pos.y],[51,14]);a.equal(h.r.live().gold,77);a.deepEqual(plain(h.r.live().party[0].bag),['c_stew','i_moonleaf']);});
test('leveling, CON and crits hold at zone 3 levels: xpNeed, 4 points/level, CON drives HP/DEF, rogue/archer crit capped at 30%',()=>{
 for(const L of [20,25,29])a.equal(R.xpNeed(L),Math.round(5*L*L+25*L+30));a.equal(R.pointsEarned(30),R.START_POINTS+4*29);
 const w=R.newChar('W','human','warrior',{str:3},R.SKILLS.warrior[0].id),hp0=R.maxHp(w,1),d0=R.defense(w);w.stats.con+=5;a.ok(R.maxHp(w,1)>hp0&&R.defense(w)>d0);
 const s0=R.maxHp(w,1);w.stats.sta+=5;a.equal(R.maxHp(w,1),s0,'STA still adds HP');a.equal(R.critChance(w),0);
 const rg=R.newChar('Q','cat','rogue',{sta:3},R.SKILLS.rogue[0].id);rg.stats.sta=40;a.equal(R.critChance(rg),0.30);
 // seeded zone 3 fight: crits show and do 1.75x
 rg.lvl=20;rg.hp=R.maxHp(rg,1);let crits=0,hits=0;for(let s=1;s<60;s++){const m=R.makeMonster(3,0,20,0,'normal');m.hp=m.max=1e6;const F=new R.Fight([rg],[m],'normal',s);for(let k=0;k<5;k++){const t=F.act(0,'attack',null,0);hits++;if(/Critical hit!/.test(t))crits++;rg.hp=R.maxHp(rg,1);if(F.over)break;F.monstersTurn&&F.monstersTurn();rg.hp=R.maxHp(rg,1);}}
 a.ok(crits/hits>0.2&&crits/hits<0.4,`crit rate ${crits}/${hits}`);});
test('zone 3 rooms: 16 rooms (5 story, 5 treasure, 6 monster), each builds its puzzle and has its zone-3 door art slot',()=>{const P=require('../puzzles.js'),rooms3=M.rooms.filter(r=>r.z===3),k={};
 rooms3.forEach(r=>{k[r.k]=(k[r.k]||0)+1;const g=P.forRoom(r);a.ok(g&&g.pz&&g.s,'room '+r.id);a.equal(g.pz.zone,3);a.equal(P.solved(g.pz,g.s),false,'room '+r.id+' starts solved');});
 a.deepEqual(k,{monster:6,story:5,treasure:5});for(let w=1;w<=5;w++)a.ok(fs.existsSync(path.join(__dirname,'..','art6','zone3-0'+w+'-'+['','crystal-defined-monsters','crystal-monsters-eyes-forming','crystal-hands-and-monster-shapes','crystal-hands-only','crystal-cracked-smoke'][w]+'.webp')));});
const mm=read('tests/maze_music_cap_test.js'),musicFor=eval('('+mm.slice(mm.indexOf('function musicFor'),mm.indexOf('\ntest('))+'\n)');
test('music: under the DEFAULT cap zone 3 cells play maze_zone3 (real music.js maze picker); the file exists',()=>{
 a.ok(fs.existsSync(path.join(__dirname,'..','music','maze_zone3.mp3')));
 for(const c of [[19,24],[19,23],[30,10],[51,14]])a.equal(musicFor(null,3,c[0],c[1]).maze(),'maze_zone3',String(c));
 a.equal(musicFor(null,2,18,24).maze(),'maze_zone2');a.equal(musicFor(null,4,51,15).maze(),'maze_zone4','t2419u: zone 4 is open and plays its own music');a.equal(musicFor(null,5,46,48).maze(),'maze_zone4','zone 5 must not play its music yet');});
test('t2404u: zone 3 monsters have pencil sketches and a fought zone 3 beast is recorded and listed in Beasts',()=>{
 for(const nm of ['centaur','direwolf','ghoul','harpy','skeleton','werewolf','wraith'])a.equal(fs.existsSync(path.join(__dirname,'..','art-intro','journal','monsters','z3-'+nm+'.webp')),true,'z3 sketch missing: '+nm);
 const h=harness(),L=h.r.live();L.beasts=[];h.r.startFight([h.R.makeMonster(3,0,20,0,'normal'),h.R.makeMonster(1,0,1,0,'normal')],'random');const z3=plain(L.beasts);a.equal(z3.length,2);a.ok(/^z3-/.test(z3[0]),z3.join());a.equal(z3[1],'z1-rat');h.r.forceEnd('ran');h.r.closeUI();
 vm.runInContext(read('intro-art-data.js'),h.c);const i=h.intro();i.openJournal('beasts');const jb=h.document.getElementById('ijour');a.deepEqual(jb.querySelectorAll('[data-beast]').map(f=>f.dataset.beast),['z1-rat',z3[0]]);});
test('cache pins: content-cap, econ and party moved together with sw VER (>=80), rules.js and match index.html (t2419u values)',()=>{const html=read('index.html'),sw=read('sw.js');
 const ver=+sw.match(/^const VER="(\d+)"/)[1];a.ok(ver>=80,'VER '+ver+' (stage1-build is 79)');
 for(const pin of ['content-cap.js?v=7','econ.js?v=17','party.js?v=39','rules.js?v=23'] /* party 38 in VER 100 (gear rework on live 99) */)for(const s of [html,sw])a.ok(s.includes(pin),'missing '+pin);
 for(const old of ['content-cap.js?v=5"','econ.js?v=15"','party.js?v=28"','rules.js?v=19"','rules.js?v=18"'])a.ok(!html.includes(old)&&!sw.includes(old),'stale '+old);});
