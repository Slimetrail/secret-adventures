"use strict";
// Jeremy t2759u special class gear (spec t2745u-t2758u): pure rules in gear.js and the prices in econ.js. Node only.
// Usage: node --test tests/t2759u_special_gear_rules_test.js
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
function load(){const c={window:{}};vm.createContext(c);for(const f of ['maze-data.js','content-cap.js','rules.js','gear.js','econ.js'])vm.runInContext(read(f),c);return c.window;}
const plain=o=>JSON.parse(JSON.stringify(o));
const W=load(),G=W.SOTA_GEAR,E=W.ECON,R=W.RPG,M=W.MAZE,N=M.n;

test('four items, one per class, each tied to its own stat (rope STR, crystal ball MAN, lockpick STA, hide smell STA)',()=>{
 a.deepEqual(plain(G.IDS),['g_lockpick','g_crystal','g_hide','g_rope']);
 a.deepEqual(plain(G.IDS.map(id=>[G.ITEMS[id].cls,G.ITEMS[id].stat])),[['rogue','sta'],['mage','man'],['archer','sta'],['warrior','str']]);
 for(const id of G.IDS){const it=R.ITEMS[id];a.ok(it,id);a.equal(it.slot,'gear');a.equal(it.special,true);a.equal(it.w,G.ITEMS[id].w);}});

test('fixed bands: low <= 8 = 25%, medium 15 = 50%, very high >= 30 = 75%; a smooth line between; capped at 75%',()=>{
 const p=v=>Math.round(G.chance(v)*1000)/10;
 a.deepEqual([0,5,8].map(p),[25,25,25]);a.equal(p(15),50);a.equal(p(30),75);a.deepEqual([31,40,61,99].map(p),[75,75,75,75]);
 a.equal(p(10),32.1);a.equal(p(22),61.7);a.ok(G.chance(12)>G.chance(11)&&G.chance(16)>G.chance(15),'every point helps');
 a.deepEqual(plain(G.BANDS),{low:8,medium:15,high:30});a.deepEqual(plain(G.RATES),{low:0.25,medium:0.5,high:0.75});
 a.equal(G.band(8),'low');a.equal(G.band(15),'medium');a.equal(G.band(30),'very high');});

test('only the special stat counts: level, other stats and gear never change the chance',()=>{
 const mk=(lvl,st)=>({cls:'warrior',lvl,hp:10,stats:Object.assign({str:15,sta:5,con:5,man:5},st),equip:{}});
 const base=G.chance(G.statOf(mk(1),'g_rope'));
 a.equal(G.chance(G.statOf(mk(50),'g_rope')),base,'level');a.equal(G.chance(G.statOf(mk(1,{sta:60,man:60,con:60}),'g_rope')),base,'other stats');
 a.equal(G.statOf({stats:{str:1,sta:22,man:3}},'g_hide'),22);a.equal(G.statOf({stats:{str:1,sta:22,man:3}},'g_lockpick'),22);a.equal(G.statOf({stats:{str:1,sta:22,man:3}},'g_crystal'),3);
 a.equal(G.passes(mk(1),'g_rope',0.49).pass,true);a.equal(G.passes(mk(1),'g_rope',0.5).pass,false);});

test('sample odds from real typical heroes (half of level points into the stat) at L1/L10/L25/L50',()=>{
 const spend=(v,P)=>{while(P>=R.cost(v)){P-=R.cost(v);v++;}return v;};
 const typical=(race,k,L)=>{const b=R.RACES[race].base[k];return spend(b+3,Math.floor(4*(L-1)/2));};
 a.deepEqual([1,10,25,50].map(L=>typical('human','str',L)),[8,15,22,35]);
 a.deepEqual([1,10,25,50].map(L=>Math.round(G.chance(typical('human','str',L))*100)),[25,50,62,75]);});

test('prices: in every zone the gear costs more than anything else in that zone\'s shop (Tent 100 is the priciest today)',()=>{
 a.deepEqual(plain(G.ZONE_PRICE.slice(1)),[150,250,400,600,900]);
 // zone z buys at Tavern z (zone z side) and Tavern z-1 (zone z side); zone 5 buys at Tavern 4 only
 for(let z=1;z<=5;z++){const shops=[z-2,z-1].filter(t=>t>=0&&t<=3);let top=0;
  for(const t of shops){const st=E.stock(t);for(const id of st.basic.concat(st.gear,st.ing,st.parts))top=Math.max(top,E.price(id));for(const d of E.recipesFor(t))top=Math.max(top,E.RECIPE_PRICE[E.dish(d).tier]);}
  a.equal(top,100,'zone '+z+' priciest');for(const id of G.IDS){a.ok(E.gearPrice(id,z)>top,id+' zone '+z);a.equal(E.gearPrice(id,z),G.price(z));}}
 a.equal(E.sellPrice('g_rope'),75,'sells for half the zone 1 price anywhere');a.equal(E.price('tent'),100);});

test('crystal ball route: nearest unfound tavern/camp/door along open edges, never through a room door on the way or a tavern archway',()=>{
 const mask=M.mask,zone=i=>+M.zone[i],kinds=new Map();M.camps.forEach(c=>kinds.set(c[1]*N+c[0],'camp'));M.taverns.forEach(c=>kinds.set(c[1]*N+c[0],'tavern'));
 const room=new Set(M.rooms.map(r=>r.c[1]*N+r.c[0]));room.forEach(i=>kinds.set(i,'door'));
 // the seam edge: the one edge from a tavern cell into another zone (same rule as game.js SEAMS)
 const B=[1,2,4,8],DX=[0,1,0,-1],DY=[-1,0,1,0],arch=new Set();M.taverns.forEach(c=>{const i=c[1]*N+c[0],m=parseInt(mask[i],16);for(let d=0;d<4;d++){if(!(m&B[d]))continue;const j=(c[1]+DY[d])*N+c[0]+DX[d];if(zone(j)!==zone(i)){arch.add(i+':'+d);arch.add(j+':'+((d+2)%4));break;}}});
 const found=new Set([64*N+0]);
 const o={N,mask,start:64*N,kindOf:i=>kinds.get(i),isTarget:i=>kinds.has(i)&&!found.has(i),isRoom:i=>room.has(i),noCross:(i,d)=>arch.has(i+':'+d)};
 const r=G.route(o);a.ok(r,'a route');a.equal(r.path[0],64*N);a.equal(r.path[r.path.length-1],r.to);a.ok(kinds.has(r.to));
 for(let k=1;k<r.path.length;k++){const p=r.path[k-1],q=r.path[k],d=[0,1,2,3].find(d=>(p%N)+DX[d]===q%N&&((p/N)|0)+DY[d]===((q/N)|0));a.ok(d>=0,'neighbours');a.ok(parseInt(mask[p],16)&B[d],'open edge');a.ok(!arch.has(p+':'+d),'no archway');if(k<r.path.length-1)a.ok(!room.has(q),'no room door on the way');}
 // never points at an already found place: mark it found and the next route ends elsewhere
 found.add(r.to);const r2=G.route(o);a.ok(r2&&r2.to!==r.to);
 // a zone 1 start never crosses into zone 2 (the only way is the Tavern 1 archway)
 a.ok(r.path.every(i=>zone(i)===1)&&r2.path.every(i=>zone(i)===1));
 // nothing left: null
 a.equal(G.route(Object.assign({},o,{isTarget:()=>false})),null);});

test('crystal ball fail helper forgets only the chosen zone, never the cell you stand on',()=>{
 const v=new Uint8Array(N*N).fill(1),keep=64*N+0;const n=G.wipeZone(v,M.zone,1,keep);
 let z1=0,other=0;for(let i=0;i<N*N;i++){if(+M.zone[i]===1){if(v[i])z1++;}else if(v[i])other++;}
 a.equal(z1,1,'only the standing cell stays');a.equal(v[keep],1);a.equal(other,N*N-[...M.zone].filter(c=>c==='1').length);a.equal(n,[...M.zone].filter(c=>c==='1').length-1);});

test('hide smell mode: pass or fail only while time is left; 5 minutes',()=>{
 a.equal(G.HIDE_MS,300000);a.equal(G.hideMode({mode:'pass',left:1}),'pass');a.equal(G.hideMode({mode:'fail',left:10}),'fail');
 a.equal(G.hideMode({mode:'pass',left:0}),null);a.equal(G.hideMode(undefined),null);a.equal(G.hideMode({mode:'x',left:5}),null);});

test('hero check: only party[0], only its class, not knocked out',()=>{
 const h={cls:'rogue',hp:5},m={cls:'mage',hp:5};
 a.equal(G.heroCheck([h,m],'g_lockpick'),null);a.equal(G.heroCheck([h,m],'g_crystal'),'class','a mage companion cannot use it');
 a.equal(G.heroCheck([{cls:'rogue',hp:0}],'g_lockpick'),'down');a.equal(G.heroCheck([],'g_rope'),'hero');a.equal(G.heroCheck([h],'potion'),'gear');});
