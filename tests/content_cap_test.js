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
// t2362u step 2: DEFAULT is zones 1-3 with no extra cells (step 1 was maxZone 2 + the zone 3 start tile (19,24)).
// t2419u: DEFAULT is zones 1-4 (zone 4 and Tavern 4 open); the step 2 checks below still hold.
test("t2419u DEFAULT: tavern 2, the zone-3 start tile (19,24), all of zone 3, tavern 3 and zone 4 are open",()=>{
 a.equal(API.DEFAULT.maxZone,4);a.deepEqual(Array.from(API.DEFAULT.extraCells,c=>Array.from(c)),[]);a.ok(Object.isFrozen(API.DEFAULT));a.ok(Object.isFrozen(API.DEFAULT.extraCells));a.equal(cap.isOpen(51,14),true);a.equal(cap.isOpen(19,23),true);
 a.deepEqual(Array.from(M.taverns[1]),[18,24]);a.equal(+M.zone[24*M.n+18],2);a.equal(cap.isOpen(18,24),true);
 a.equal(+M.zone[24*M.n+19],3);a.equal(M.rooms.some(r=>r.c[0]===19&&r.c[1]===24),false);a.equal(cap.isOpen(19,24),true);
 const m=parseInt(M.mask[24*M.n+19],16);a.equal(m&1,1);a.equal(m&8,8);a.equal(m&2,0);a.equal(m&4,0);
});
test("(19,24) is the only zone-3 cell with a walkable edge into zones 1-2",()=>{
 const found=[];for(let y=0;y<M.n;y++)for(let x=0;x<M.n;x++)if(+M.zone[y*M.n+x]===3)for(let d=0;d<4;d++)if(parseInt(M.mask[y*M.n+x],16)&(1<<d)){const nx=x+dirs[d][0],ny=y+dirs[d][1];if(+M.zone[ny*M.n+nx]<=2)found.push([x,y]);}
 a.deepEqual(found,[[19,24]]);
});
test("t2419u: (51,15), room 39 and tavern 4 are open, every zone-4 cell is open and every zone-5 cell is closed",()=>{
 a.equal(+M.zone[23*M.n+19],3);
 for(const c of [[51,15],[47,15],[47,48]])a.equal(cap.isOpen(...c),true);a.equal(cap.isOpen(46,48),false);a.equal(+M.zone[48*M.n+46],5);
 for(let i=0;i<M.n*M.n;i++)if(+M.zone[i]===4)a.equal(cap.isOpen(i%M.n,Math.floor(i/M.n)),true);
 const r=M.rooms.find(r=>r.id===39);a.deepEqual(Array.from(r.c),[47,15]);a.equal(r.k,"monster");
 let count=0;for(let i=0;i<M.n*M.n;i++)if(+M.zone[i]===5){count++;a.equal(cap.isOpen(i%M.n,Math.floor(i/M.n)),false);}a.ok(count>0);
});
test("all actual zone-1/2 taverns and rooms remain open",()=>{
 a.equal(M.taverns.length,4);let taverns=0;for(const c of M.taverns)if(+M.zone[c[1]*M.n+c[0]]<=2){taverns++;a.equal(cap.isOpen(...c),true);}a.equal(taverns,2);
 for(const z of [1,2]){const rooms=M.rooms.filter(r=>r.z===z);a.ok(rooms.length);for(const r of rooms)a.equal(cap.isOpen(...r.c),true);}
});
test("all cells obey only zones 1-4",()=>{
 for(let y=0;y<M.n;y++)for(let x=0;x<M.n;x++)a.equal(cap.isOpen(x,y),+M.zone[y*M.n+x]>=1&&+M.zone[y*M.n+x]<=4);
});
test("a later data-only cap opens zone 3 including tavern 3, not zone 4/5",()=>{
 const next=API.create(M.n,M.zone,{maxZone:3,extraCells:[]});
 for(let i=0;i<M.n*M.n;i++)a.equal(next.isOpen(i%M.n,Math.floor(i/M.n)),+M.zone[i]>=1&&+M.zone[i]<=3);
 a.equal(next.isOpen(51,14),true);a.equal(next.isOpen(51,15),false);a.equal(next.isOpen(47,48),false);
});
test("live movement: tavern 2 east (19,24) is the seam 2-3 archway; it bumps both ways and the Zone 3 tab crosses (t2528u)",()=>{
 const e=engine(18,24,1);e.s.act("fwd");a.equal(e.s.state().x,18);a.equal(e.s.state().y,24);a.equal(e.counts().steps,0);
 a.ok(e.s.seamExit(1,3));a.equal(e.s.state().x,19);a.equal(e.s.state().y,24);e.s.act("right");e.s.act("back");/* facing E, back = W into the arch */a.equal(e.s.state().x,19);a.equal(e.s.state().y,24);
});
test("every physical open-to-closed edge is the Tavern 4 west 4-5 archway; forward and backward bump it and never toast, visit or save (t2667u)",()=>{
 const edges=[];
 for(let y=0;y<M.n;y++)for(let x=0;x<M.n;x++)if(cap.isOpen(x,y))for(let d=0;d<4;d++){
  const nx=x+dirs[d][0],ny=y+dirs[d][1];if(!(parseInt(M.mask[y*M.n+x],16)&(1<<d))||cap.isOpen(nx,ny))continue;edges.push([x,y,d,nx,ny]);
  for(const cmd of ["fwd","back"]){const e=engine(x,y,cmd==="fwd"?d:(d+2)%4),before=e.s.state(),stored=e.storage.get("sota.stage1.save");
   a.ok(e.s.archAhead(x,y,d)>=0);
   e.s.act(cmd);a.deepEqual(e.s.state(),before);a.deepEqual(e.counts(),{steps:0,after:0,puzzles:0});a.equal(e.s.panelOpen(),false);a.equal(e.s.isVisited(nx,ny),false);a.equal(e.s.visitedCount(),1);a.equal(e.storage.get("sota.stage1.save"),stored);a.equal(e.el("s4toast").textContent,"");
  }
 }a.deepEqual(edges,[[47,48,3,46,48]]); // mask still has Tavern 4 west; act() hits the arch first, so the wait toast never fires here (the Zone 5 tab in party.js does)
});
test("old closed-cell save cannot walk through the 4-5 arch; the Zone 4 tab steps back into the slice, then walking cannot reenter",()=>{
 // t2419u/t2667u: the closed side is zone 5 (46,48), west of Tavern 4. The edge is now an archway, so fwd no longer walks through.
 a.ok(parseInt(M.mask[48*M.n+46],16)&2);
 const e=engine(46,48,1);a.ok(e.s.archAhead(46,48,1)>=0);a.equal(e.s.state().x,46);a.equal(e.s.state().y,48);e.s.act("fwd");a.equal(e.s.state().x,46);a.equal(e.s.state().y,48);a.equal(e.el("s4toast").textContent,"");
 a.ok(e.s.seamExit(3,4));a.equal(e.s.state().x,47);a.equal(e.s.state().y,48);a.equal(e.s.state().zone,4);a.equal(e.counts().steps,1);
 e.s.act("back");a.equal(e.s.state().x,47);a.equal(e.s.state().y,48);a.equal(e.el("s4toast").textContent,"");
 a.equal(cap.allowsStep(47,48,48,48),true);a.equal(cap.allowsStep(51,14,51,15),true);a.equal(cap.allowsStep(47,48,46,48),false);
});
test("new script loads before engine and is cached with matching engine version",()=>{
 const html=read("index.html"),c={self:{addEventListener(){}}};vm.runInNewContext(read("sw.js")+";globalThis.shell=SHELL;globalThis.version=VER;",c);
 a.ok(html.indexOf('src="content-cap.js?v=5"')<html.indexOf('src="game.js?v=17"'));a.ok(c.shell.includes("content-cap.js?v=5"));a.ok(c.shell.includes("game.js?v=17"));a.equal(c.version,"56");
 a.ok(/script-src 'self'/.test(html));
});
