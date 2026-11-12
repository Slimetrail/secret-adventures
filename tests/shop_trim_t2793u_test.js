"use strict";
// Jeremy t2793u: remove plain lockpick and rope from the tavern shop; keep special class gear, worn gear and tents;
// keep I/PRICE so an old save holding the plain items still loads and can sell them.
// Usage: node --test tests/shop_trim_t2793u_test.js
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const plain=o=>JSON.parse(JSON.stringify(o));
const flow=read('tests/tavern_shop_camp_flow_test.js');
let hsrc=flow.slice(flow.indexOf('function harness'),flow.indexOf('\nfor(let t=0'));
const LOADS="for(const f of ['maze-data.js','content-cap.js','rules.js','econ.js'])";a.ok(hsrc.includes(LOADS));a.ok(hsrc.includes('storyOpen:()=>story};'));
hsrc=hsrc.replace(LOADS,"for(const f of ['maze-data.js','content-cap.js','rules.js','gear.js','econ.js'])")
 .replace('storyOpen:()=>story};','storyOpen:()=>story,setMazeSlots(){},panelOpen:()=>false,mapOpen:()=>false,puzzleOpen:()=>false,roomAt:(x,y)=>{const r=M.rooms.find(r=>r.c[0]===x&&r.c[1]===y);return r?r.id:-1;},seamTavernAt:(x,y)=>({"14,49":0,"14,48":0,"18,24":1,"19,24":1,"51,14":2,"51,15":2,"46,48":3,"47,48":3})[x+","+y]??-1};');
const baseHarness=eval('('+hsrc+')');
function harness(init,cls='warrior'){const h=baseHarness(init||{}),create=h.document.createElement;h.document.createElement=t=>{const e=create(t);if(t==='canvas'){e.toDataURL=()=>'data:,';e.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},width:0})});}return e;};h.c.Image=class{constructor(){this.complete=false;}};
 h.S.intro={showTitle(){}};h.S.wipeZone=()=>1;h.S.map={isFound:()=>false};h.S.core.mask=h.M.mask;h.S.archAhead=()=>-1;
 if(!init){const hero=h.r.live().party[0];hero.cls=cls;hero.race='human';}
 return h;}
const q=(h,s)=>h.ov.querySelector(s),qa=(h,s)=>h.ov.querySelectorAll(s);
const at=(h,x,y,f=0)=>Object.assign(h.pos,{x,y,f});
const SPECIAL=['g_lockpick','g_crystal','g_hide','g_rope'];
const TAV=[ [0,14,49], [1,19,24], [2,51,15], [3,46,48] ];

test('shop stock and Craft list: no plain lockpick or rope; special gear, tents and worn gear stay',()=>{
 const h=harness();const E=h.c.window.ECON,I=h.c.window.RPG.ITEMS;
 a.ok(I.lockpick&&I.rope,'I.lockpick and I.rope must stay for old saves');
 a.equal(I.lockpick.n,'Lockpicks');a.equal(I.rope.n,'Rope');
 a.equal(E.price('lockpick'),15);a.equal(E.price('rope'),10);
 a.equal(E.sellPrice('lockpick'),7);a.equal(E.sellPrice('rope'),5);
 for(const t of [0,1,2,3]){
  const st=E.stock(t);
  a.ok(!st.basic.includes('lockpick')&&!st.basic.includes('rope'),'stock().basic tavern '+(t+1));
  a.ok(st.basic.includes('tent')&&st.basic.includes('ration'));
  a.ok(st.gear.length,'worn gear still in stock');
  a.ok(st.gear.every(id=>I[id]&&I[id].worn));
 }
 for(const [t,x,y] of TAV){
  at(h,x,y);h.r.live().gold=5000;h.r.s5.shopList(t,'craft');
  const buys=qa(h,'[data-buy]').map(r=>r.dataset.buy);
  a.ok(!buys.includes('lockpick')&&!buys.includes('rope'),'shop buy list tavern '+(t+1));
  a.ok(buys.includes('tent'),'tent still sold');
  for(const id of E.stock(t).gear)a.ok(buys.includes(id),'worn '+id);
  a.deepEqual(qa(h,'[data-special]').map(r=>r.dataset.special),SPECIAL,'special gear tavern '+(t+1));
  const labs=[...qa(h,'.s4lab')].map(e=>e.textContent);
  a.ok(labs.includes('Gear'),'Gear header stays (worn gear is still listed)');
  a.ok(labs.includes('Special gear'));
  a.ok(labs.includes('Tent'));
 }
});

test('old save holding plain lockpick and rope loads, and they can be sold',()=>{
 const h=harness();at(h,14,49);const L=h.r.live();
 L.party[0].bag.push('lockpick','rope');L.gold=20;
 a.equal(h.r.doSave(),true);
 const o=JSON.parse(h.storage.get('sota.party.slot0'));
 a.ok(o.party[0].bag.includes('lockpick')&&o.party[0].bag.includes('rope'));
 const h2=harness({'sota.party.slot0':JSON.stringify(o),'sota.party':JSON.stringify(o),'sota.party.active':'0'});
 const L2=h2.r.live(),bag=L2.party[0].bag;
 a.ok(L2&&L2.party.length>=1);
 a.ok(bag.includes('lockpick')&&bag.includes('rope'),'plain items survived load');
 a.equal(L2.gold,20);
 const E=h2.c.window.ECON,I=h2.c.window.RPG.ITEMS;
 a.ok(I.lockpick&&I.rope);
 const want=20+E.sellPrice('lockpick')+E.sellPrice('rope');
 const iLock=bag.lastIndexOf('lockpick');a.ok(iLock>=0);a.equal(h2.r.s5.sell(0,iLock,0),E.sellPrice('lockpick'));
 const iRope=L2.party[0].bag.lastIndexOf('rope');a.ok(iRope>=0);a.equal(h2.r.s5.sell(0,iRope,0),E.sellPrice('rope'));
 a.equal(L2.gold,want);
 a.ok(!L2.party[0].bag.includes('lockpick')&&!L2.party[0].bag.includes('rope'));
});

test('VER 109 pins: econ v21, party v45; wait text and locked files unchanged',()=>{
 const sw=read('sw.js'),html=read('index.html');
 a.match(sw,/^const VER="109",CACHE="sota-s1-v"\+VER/);
 for(const p of ['econ.js?v=21','party.js?v=45'])for(const s of [sw,html])a.ok(s.includes(p),p);
 for(const p of ['econ.js?v=20','party.js?v=44'])for(const s of [sw,html])a.ok(!s.includes(p),'stale '+p);
 a.ok(read('game.js').includes('d.textContent="Please wait for update to continue.";'));
});
