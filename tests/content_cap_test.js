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
test("tavern 3 and exactly the zone-4 start tile are open",()=>{a.equal(cap.isOpen(51,14),true);a.equal(+M.zone[15*M.n+51],4);a.equal(cap.isOpen(51,15),true);});
test("deeper zone 4, room 39, tavern 4 and every zone-5 cell are closed",()=>{
 for(const c of [[50,15],[51,16],[47,15],[47,48]])a.equal(cap.isOpen(...c),false);
 const r=M.rooms.find(r=>r.id===39);a.deepEqual(Array.from(r.c),[47,15]);a.equal(r.k,"monster");
 let count=0;for(let i=0;i<M.n*M.n;i++)if(+M.zone[i]===5){count++;a.equal(cap.isOpen(i%M.n,Math.floor(i/M.n)),false);}a.ok(count>0);
});
test("all actual zone-1/2/3 taverns and rooms remain open",()=>{
 // There are four taverns total, but only three in zones 1-3; the fourth is capped.
 a.equal(M.taverns.length,4);let taverns=0;for(const c of M.taverns)if(+M.zone[c[1]*M.n+c[0]]<=3){taverns++;a.equal(cap.isOpen(...c),true);}a.equal(taverns,3);
 for(const z of [1,2,3]){const rooms=M.rooms.filter(r=>r.z===z);a.ok(rooms.length);for(const r of rooms)a.equal(cap.isOpen(...r.c),true);}
});
test("all cells obey only zones 1-3 plus (51,15), not the other boundary tiles",()=>{
 for(let y=0;y<M.n;y++)for(let x=0;x<M.n;x++)a.equal(cap.isOpen(x,y),(+M.zone[y*M.n+x]<=3)||(x===51&&y===15));
});
test("a later data-only cap opens zone 4 including tavern 4, not zone 5",()=>{
 const next=API.create(M.n,M.zone,{maxZone:4,extraCells:[]});
 for(let i=0;i<M.n*M.n;i++)a.equal(next.isOpen(i%M.n,Math.floor(i/M.n)),+M.zone[i]<=4);
 a.equal(next.isOpen(47,48),true);
});
test("live movement reaches the start tile and can return to tavern 3",()=>{
 const e=engine(51,14,2);e.s.act("fwd");a.equal(e.s.state().x,51);a.equal(e.s.state().y,15);e.s.act("back");a.equal(e.s.state().y,14);a.equal(e.counts().steps,2);
});
test("every physical open-to-closed edge refuses forward and backward before puzzles, rooms, visits or saves",()=>{
 let edges=0;
 for(let y=0;y<M.n;y++)for(let x=0;x<M.n;x++)if(cap.isOpen(x,y))for(let d=0;d<4;d++){
  const nx=x+dirs[d][0],ny=y+dirs[d][1];if(!(parseInt(M.mask[y*M.n+x],16)&(1<<d))||cap.isOpen(nx,ny))continue;edges++;
  for(const cmd of ["fwd","back"]){const e=engine(x,y,cmd==="fwd"?d:(d+2)%4),before=e.s.state(),stored=e.storage.get("sota.stage1.save");
   e.s.act(cmd);a.deepEqual(e.s.state(),before);a.deepEqual(e.counts(),{steps:0,after:0,puzzles:0});a.equal(e.s.panelOpen(),false);a.equal(e.s.isVisited(nx,ny),false);a.equal(e.s.visitedCount(),1);a.equal(e.storage.get("sota.stage1.save"),stored);a.equal(e.el("s4toast").textContent,"More of the maze opens after you check for an update.");
  }
 }a.ok(edges>0);
});
test("old closed-cell save can walk back into slice without teleporting, then cannot reenter",()=>{
 // The actual west/east corridor alongside the start tile.
 a.ok(parseInt(M.mask[15*M.n+50],16)&2);
 const e=engine(50,15,1);a.equal(e.s.state().x,50);e.s.act("fwd");a.equal(e.s.state().x,51);e.s.act("back");a.equal(e.s.state().x,51);
 a.equal(cap.allowsStep(47,48,48,48),true); // Deep old saves are not trapped by the cap.
});
test("new script loads before engine and is cached with matching engine version",()=>{
 const html=read("index.html"),c={self:{addEventListener(){}}};vm.runInNewContext(read("sw.js")+";globalThis.shell=SHELL;globalThis.version=VER;",c);
 a.ok(html.indexOf('src="content-cap.js?v=1"')<html.indexOf('src="game.js?v=15"'));a.ok(c.shell.includes("content-cap.js?v=1"));a.ok(c.shell.includes("game.js?v=15"));a.equal(c.version,"49");
});
