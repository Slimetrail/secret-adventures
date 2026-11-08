"use strict";
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const read=f=>fs.readFileSync(path.join(__dirname,"..",f),"utf8");
function base(){const c={window:{}};vm.createContext(c);vm.runInContext(read("maze-data.js"),c);vm.runInContext(read("content-cap.js"),c);return c;}
const b=base(),M=b.window.MAZE,API=b.window.SOTA_CONTENT_CAP,cap=API.create(M.n,M.zone);
const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
function engine(x,y,f=0){
 const c=base(),els=new Map(),storage=new Map([["sota.stage1.save",JSON.stringify({x,y,f})]]);
 function el(id){if(!els.has(id))els.set(id,{textContent:"",style:{},classList:{add(){},remove(){}},addEventListener(){},getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};}};}});return els.get(id);}
 // Rendering is not scheduled: exercise the real act path, not a duplicated move implementation.
 Object.assign(c,{document:{getElementById:el,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>1},requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){}});
 Object.assign(c.window,{TEX:{S:32},DOORTEX:{},innerWidth:400,innerHeight:300,addEventListener(){}});
 vm.runInContext(read("game.js"),c);
 let steps=0,after=0,puzzles=0;c.SOTA=c.window.SOTA;Object.assign(c.SOTA,{onStep(){steps++;},afterStep(){after++;},openPuzzle(){puzzles++;}});
 return {s:c.SOTA,el,counts:()=>({steps,after,puzzles}),storage};
}
test("tavern 2 and exactly the zone-3 start tile (19,24) are open",()=>{
 a.equal(API.DEFAULT.maxZone,2);a.deepEqual(Array.from(API.DEFAULT.extraCells,c=>Array.from(c)),[[19,24]]);a.ok(Object.isFrozen(API.DEFAULT));a.ok(Object.isFrozen(API.DEFAULT.extraCells));a.ok(Object.isFrozen(API.DEFAULT.extraCells[0]));
 a.deepEqual(Array.from(M.taverns[1]),[18,24]);a.equal(+M.zone[24*M.n+18],2);a.equal(cap.isOpen(18,24),true);
 a.equal(+M.zone[24*M.n+19],3);a.equal(M.rooms.some(r=>r.c[0]===19&&r.c[1]===24),false);a.equal(cap.isOpen(19,24),true);
 const m=parseInt(M.mask[24*M.n+19],16);a.equal(m&1,1);a.equal(m&8,8);a.equal(m&2,0);a.equal(m&4,0);
});
test("(19,24) is the only zone-3 cell with a walkable edge into zones 1-2",()=>{
 const found=[];for(let y=0;y<M.n;y++)for(let x=0;x<M.n;x++)if(+M.zone[y*M.n+x]===3)for(let d=0;d<4;d++)if(parseInt(M.mask[y*M.n+x],16)&(1<<d)){const nx=x+dirs[d][0],ny=y+dirs[d][1];if(+M.zone[ny*M.n+nx]<=2)found.push([x,y]);}
 a.deepEqual(found,[[19,24]]);
});
test("deeper zone 3, tavern 3, (51,15), room 39, tavern 4 and every zone-5 cell are closed",()=>{
 a.equal(+M.zone[23*M.n+19],3);
 for(const c of [[19,23],[51,14],[51,15],[47,15],[47,48]])a.equal(cap.isOpen(...c),false);
 const r=M.rooms.find(r=>r.id===39);a.deepEqual(Array.from(r.c),[47,15]);a.equal(r.k,"monster");
 let count=0;for(let i=0;i<M.n*M.n;i++)if(+M.zone[i]===5){count++;a.equal(cap.isOpen(i%M.n,Math.floor(i/M.n)),false);}a.ok(count>0);
});
test("all actual zone-1/2 taverns and rooms remain open",()=>{
 a.equal(M.taverns.length,4);let taverns=0;for(const c of M.taverns)if(+M.zone[c[1]*M.n+c[0]]<=2){taverns++;a.equal(cap.isOpen(...c),true);}a.equal(taverns,2);
 for(const z of [1,2]){const rooms=M.rooms.filter(r=>r.z===z);a.ok(rooms.length);for(const r of rooms)a.equal(cap.isOpen(...r.c),true);}
});
test("all cells obey only zones 1-2 plus (19,24)",()=>{
 for(let y=0;y<M.n;y++)for(let x=0;x<M.n;x++)a.equal(cap.isOpen(x,y),(+M.zone[y*M.n+x]>=1&&+M.zone[y*M.n+x]<=2)||(x===19&&y===24));
});
test("a later data-only cap opens zone 3 including tavern 3, not zone 4/5",()=>{
 const next=API.create(M.n,M.zone,{maxZone:3,extraCells:[]});
 for(let i=0;i<M.n*M.n;i++)a.equal(next.isOpen(i%M.n,Math.floor(i/M.n)),+M.zone[i]>=1&&+M.zone[i]<=3);
 a.equal(next.isOpen(51,14),true);a.equal(next.isOpen(51,15),false);a.equal(next.isOpen(47,48),false);
});
test("live movement steps tavern 2 east to (19,24) and back",()=>{
 const e=engine(18,24,1);e.s.act("fwd");a.equal(e.s.state().x,19);a.equal(e.s.state().y,24);e.s.act("back");a.equal(e.s.state().x,18);a.equal(e.s.state().y,24);a.equal(e.counts().steps,2);
});
test("every physical open-to-closed edge refuses forward and backward before puzzles, rooms, visits or saves",()=>{
 const edges=[];
 for(let y=0;y<M.n;y++)for(let x=0;x<M.n;x++)if(cap.isOpen(x,y))for(let d=0;d<4;d++){
  const nx=x+dirs[d][0],ny=y+dirs[d][1];if(!(parseInt(M.mask[y*M.n+x],16)&(1<<d))||cap.isOpen(nx,ny))continue;edges.push([x,y,d,nx,ny]);
  for(const cmd of ["fwd","back"]){const e=engine(x,y,cmd==="fwd"?d:(d+2)%4),before=e.s.state(),stored=e.storage.get("sota.stage1.save");
   e.s.act(cmd);a.deepEqual(e.s.state(),before);a.deepEqual(e.counts(),{steps:0,after:0,puzzles:0});a.equal(e.s.panelOpen(),false);a.equal(e.s.isVisited(nx,ny),false);a.equal(e.s.visitedCount(),1);a.equal(e.storage.get("sota.stage1.save"),stored);a.equal(e.el("s4toast").textContent,"Please wait for update to continue.");
  }
 }a.deepEqual(edges,[[19,24,0,19,23]]);
});
test("old closed-cell save can walk back into slice without teleporting, then cannot reenter",()=>{
 a.ok(parseInt(M.mask[23*M.n+19],16)&4);
 const e=engine(19,23,2);a.equal(e.s.state().x,19);a.equal(e.s.state().y,23);e.s.act("fwd");a.equal(e.s.state().x,19);a.equal(e.s.state().y,24);e.s.act("back");a.equal(e.s.state().x,19);a.equal(e.s.state().y,24);a.equal(e.counts().steps,1);a.equal(e.el("s4toast").textContent,"Please wait for update to continue.");
 a.equal(cap.allowsStep(47,48,48,48),true);
});
test("new script loads before engine and is cached with matching engine version",()=>{
 const html=read("index.html"),c={self:{addEventListener(){}}};vm.runInNewContext(read("sw.js")+";globalThis.shell=SHELL;globalThis.version=VER;",c);
 a.ok(html.indexOf('src="content-cap.js?v=4"')<html.indexOf('src="game.js?v=16"'));a.ok(c.shell.includes("content-cap.js?v=4"));a.ok(c.shell.includes("game.js?v=16"));a.equal(c.version,"55");
 a.ok(/script-src 'self'/.test(html));
});
