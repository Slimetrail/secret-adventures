"use strict";
// t2528u-t2539u, t2551u, t2558u, t2562u, t2565u: shared tavern archway on seams 1-2 and 2-3, camp circles, path check (node, no browser)
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const D=[[0,-1],[1,0],[0,1],[-1,0]];
function engine(x,y,f=0){
 const c={window:{}};vm.createContext(c);vm.runInContext(read("maze-data.js"),c);vm.runInContext(read("content-cap.js"),c);
 const els=new Map(),storage=new Map([["sota.stage1.save",JSON.stringify({x,y,f})]]);
 function el(id){if(!els.has(id))els.set(id,{textContent:"",style:{},classList:{add(){},remove(){}},addEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:400,height:300}),getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},clearRect(){},putImageData(){}};}});return els.get(id);}
 Object.assign(c,{document:{getElementById:el,querySelectorAll:()=>[],createElement:()=>({style:{},width:0,height:0,getContext(){return {clearRect(){},fillRect(){},drawImage(){}};}})},localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},performance:{now:()=>1},requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){}});
 Object.assign(c.window,{DOORTEX:{},innerWidth:412,innerHeight:891,addEventListener(){}});
 vm.runInContext(read("tex.js"),c);vm.runInContext(read("doors.js"),c);vm.runInContext(read("game.js"),c);
 const bumps=[];let after=0;const S=c.window.SOTA;c.SOTA=S;Object.assign(S,{onStep(){},afterStep(){after++;},openPuzzle(){},onRoomOpen(){},onArchBump(t,k){bumps.push([t,k]);}});
 return {S,M:c.window.MAZE,bumps,after:()=>after,storage};
}
const pos=s=>{const p=s.state();return [p.x,p.y,p.f];};
const E=engine(0,64,0),M=E.M,N=M.n,zone=(x,y)=>+M.zone[y*N+x],mask=(x,y)=>parseInt(M.mask[y*N+x],16);

test("seams are found from zoneOf: 14,49|14,48 (zone 1|2) and 18,24|19,24 (zone 2|3), facing away from the arch",()=>{
 const s=E.S.seams();a.equal(s.length,4);/* t2667u: seams 3-4 and 4-5 added, checked below */
 a.deepEqual([s[0].t,s[0].prev.x,s[0].prev.y,s[0].prev.zone,s[0].next.x,s[0].next.y,s[0].next.zone],[0,14,49,1,14,48,2]);
 a.deepEqual([s[1].t,s[1].prev.x,s[1].prev.y,s[1].prev.zone,s[1].next.x,s[1].next.y,s[1].next.zone],[1,18,24,2,19,24,3]);
 a.deepEqual([s[0].bx,s[0].by],[29,98]);a.deepEqual([s[1].bx,s[1].by],[38,49]);
 // 14,49 faces S (open, toward 14,50); 14,48 faces N; 18,24 has no W opening so faces N; 19,24 has no E opening so faces N
 a.deepEqual([s[0].prev.f,s[0].next.f,s[1].prev.f,s[1].next.f],[2,0,0,0]);
 for(const sm of s)for(const side of [sm.prev,sm.next]){a.notEqual(side.f,side.toArch,"faces the arch");a.ok(mask(side.x,side.y)&(1<<side.f),"faces a wall");}
 // each is the only zone-crossing edge of that pair
 let cross=0;for(let y=0;y<N;y++)for(let x=0;x<N;x++)for(const d of [1,2]){if(!(mask(x,y)&(1<<d)))continue;const nx=x+D[d][0],ny=y+D[d][1];const z1=zone(x,y),z2=zone(nx,ny);if(Math.min(z1,z2)<=2&&Math.max(z1,z2)<=3&&z1!==z2)cross++;}
 a.equal(cross,2);
});

test("bumping the arch from either side opens the tavern and never moves; the arch cell is never standable",()=>{
 for(const [x,y,f,t] of [[14,49,0,0],[14,48,2,0],[18,24,1,1],[19,24,3,1]]){const e=engine(x,y,f);e.S.act("fwd");a.deepEqual(pos(e.S),[x,y,f]);a.deepEqual(e.bumps.map(b=>b[0]),[t]);a.equal(e.after(),0);
  e.S.act("left");e.S.act("left");e.S.act("back");a.deepEqual(pos(e.S),[x,y,(f+2)%4]);a.equal(e.bumps.length,2,"walking backward into the arch also bumps");}
});

test("forward and backward walk through seam 1-2 and 2-3 with the zone tabs",()=>{
 // forward: zone 1 -> tavern -> Next zone (2) -> walk on; then backward: zone 2 -> tavern -> Previous zone (1) -> walk back
 const e=engine(13,50,0);e.S.act("fwd");a.deepEqual(pos(e.S),[13,49,0]);e.S.act("right");e.S.act("fwd");a.deepEqual(pos(e.S),[14,49,1]);e.S.act("left");a.deepEqual(pos(e.S),[14,49,0]);
 e.S.act("fwd");a.equal(e.bumps.length,1);a.ok(e.S.seamExit(0,2));a.deepEqual(pos(e.S),[14,48,0]);a.equal(e.S.state().zone,2);
 e.S.act("fwd");a.deepEqual(pos(e.S).slice(0,2),[14,47]);a.equal(e.S.state().zone,2);
 e.S.act("back");a.deepEqual(pos(e.S),[14,48,0]);e.S.act("back");a.deepEqual(pos(e.S),[14,48,0],"backing into the arch bumps");a.equal(e.bumps.length,2);
 a.ok(e.S.seamExit(0,1));a.deepEqual(pos(e.S),[14,49,2]);a.equal(e.S.state().zone,1);e.S.act("fwd");a.deepEqual(pos(e.S).slice(0,2),[14,50]);
 // the trail stayed valid (every step adjacent), so a save/load keeps the map
 const snap=e.S.mazeSnap(),n=e.S.visitedCount();e.S.applyMaze(snap);a.equal(e.S.visitedCount(),n);a.ok(e.S.isVisited(14,48)&&e.S.isVisited(14,47));
 // seam 2-3
 const g=engine(18,23,2);g.S.act("fwd");a.deepEqual(pos(g.S),[18,24,2]);g.S.act("left");a.deepEqual(pos(g.S),[18,24,1]);g.S.act("fwd");a.deepEqual(g.bumps.map(b=>b[0]),[1]);
 a.ok(g.S.seamExit(1,3));a.deepEqual(pos(g.S),[19,24,0]);a.equal(g.S.state().zone,3);g.S.act("fwd");a.deepEqual(pos(g.S).slice(0,2),[19,23]);
 g.S.act("back");a.deepEqual(pos(g.S).slice(0,2),[19,24]);g.S.act("right");g.S.act("right");g.S.act("right");a.deepEqual(pos(g.S),[19,24,3]);g.S.act("fwd");a.equal(g.bumps.length,2);
 a.ok(g.S.seamExit(1,2));a.deepEqual(pos(g.S),[18,24,0]);a.equal(g.S.state().zone,2);g.S.act("fwd");a.deepEqual(pos(g.S).slice(0,2),[18,23]);
 // same-side tab only turns you away
 const h=engine(14,48,2);a.ok(h.S.seamExit(0,2));a.deepEqual(pos(h.S),[14,48,0]);
});

test("path check: with both arches as walls every cell is still reachable (arch tabs join the zones); no cell is lost and no hallway is blocked",()=>{
 const seams=E.S.seams(),shut=new Set();for(const s of seams){shut.add(s.prev.x+","+s.prev.y+","+s.prev.toArch);shut.add(s.next.x+","+s.next.y+","+s.next.toArch);}
 function reach(starts,useTabs){const seen=new Set(),q=[...starts];q.forEach(c=>seen.add(c[0]+","+c[1]));while(q.length){const [x,y]=q.pop();
  for(let d=0;d<4;d++){if(!(mask(x,y)&(1<<d))||shut.has(x+","+y+","+d))continue;const k=(x+D[d][0])+","+(y+D[d][1]);if(!seen.has(k)){seen.add(k);q.push([x+D[d][0],y+D[d][1]]);}}
  if(useTabs)for(const s of seams)for(const [p,o] of [[s.prev,s.next],[s.next,s.prev]])if(p.x===x&&p.y===y&&!seen.has(o.x+","+o.y)){seen.add(o.x+","+o.y);q.push([o.x,o.y]);}}return seen;}
 const all=reach([M.entrance],true);a.equal(all.size,N*N,"a cell became unreachable");
 const z1=reach([M.entrance],false);for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(zone(x,y)===1)a.ok(z1.has(x+","+y),"zone 1 cell "+x+","+y+" cut off");
 // both arch sides are walkable from their own zone without the tabs
 const z2=reach([[seams[0].next.x,seams[0].next.y]],false);a.ok(z2.has(seams[1].prev.x+","+seams[1].prev.y),"zone 2 side of seam 1-2 cannot reach seam 2-3");
 for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(zone(x,y)===2)a.ok(z2.has(x+","+y),"zone 2 cell "+x+","+y+" cut off");
 // no puzzle-door room sits on a cell in front of an arch, and the arch block is a connector (between two cells), never a cell
 for(const s of seams){a.ok((s.bx%2===1)!==(s.by%2===1),"arch is not on a connector block");for(const p of [s.prev,s.next])a.equal(E.S.roomAt(p.x,p.y),-1);}
});

test("t2562u circles: no tavern, arch or arch-front cell draws a circle; every camp does; the seam camps are near and off the arch-front cells",()=>{
 for(const t of M.taverns)a.equal(E.S.floorMark(t[0],t[1]),null,"tavern "+t);
 const fronts=[];for(const s of E.S.seams())for(const p of [s.prev,s.next]){fronts.push(p.x+","+p.y);a.equal(E.S.floorMark(p.x,p.y),null,"arch front "+p.x+","+p.y);}
 for(const c of M.camps){a.equal(E.S.floorMark(c[0],c[1]),"camp","camp "+c);a.ok(!fronts.includes(c[0]+","+c[1]));}
 let anyTavern=false;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(E.S.floorMark(x,y)==="tavern")anyTavern=true;a.equal(anyTavern,false);
 // nearest camp from each seam side, walking (arches shut): seam 1-2 zone 1 side -> 15,50; seam 2-3 zone 2 side -> 16,25
 function dist(from,to){const seen=new Map([[from.join(","),0]]),q=[from];while(q.length){const c=q.shift(),dd=seen.get(c.join(","));if(c[0]===to[0]&&c[1]===to[1])return dd;for(let d=0;d<4;d++){if(!(mask(c[0],c[1])&(1<<d))||E.S.archAhead(c[0],c[1],d)>=0)continue;const n=[c[0]+D[d][0],c[1]+D[d][1]];if(!seen.has(n.join(","))){seen.set(n.join(","),dd+1);q.push(n);}}}return Infinity;}
 a.ok(dist([14,49],[15,50])<=4);a.ok(dist([18,24],[16,25])<=12,"seam 2-3 camp too far: "+dist([18,24],[16,25]));
});

test("archway texture: 128 preferred with 64 fallback, glow mask, stone mask, tints.json; flip and voff 0; normal walls stay 64",()=>{
 const g=read("game.js");a.ok(g.indexOf("archway-tavern-128.png")<g.indexOf("archway-tavern-64.png"));
 for(const f of ["archway-tavern-64.png","archway-tavern-glow-64.png","safe-post-64.png"])a.ok(fs.existsSync(path.join(root,"art6/seam",f)),f);
 a.equal(E.S.archTex().flip,0);a.equal(E.S.archTex().voff,0);
 const c={window:{}};vm.createContext(c);vm.runInContext(read("tex.js"),c);a.equal(c.window.TEX.S,64);a.ok(c.window.TEX.pal[1].c1&&c.window.TEX.pal[5].ink);
 a.ok(read("party.js").includes('S.onArchBump='));
 const sw=read("sw.js");for(const f of fs.readdirSync(path.join(root,"art6/seam")))a.equal(sw.split('"art6/seam/'+f+'"').length-1,1,"sw cache "+f);
 a.match(sw,/^const VER="104",/);for(const p of ["game.js?v=25","tex.js?v=16","party.js?v=41"])for(const s of [sw,read("index.html")])a.ok(s.includes(p),p);
 a.ok(read("index.html").indexOf("Please wait for update to continue.")>=0||read("party.js").includes('"Please wait for update to continue."'));
});

test("t2667u: seams 3-4 (51,14|51,15) and 4-5 (47,48|46,48) are archways; zone 5 stays closed behind the 4-5 arch",()=>{
 const s=E.S.seams();
 a.deepEqual([s[2].t,s[2].prev.x,s[2].prev.y,s[2].prev.zone,s[2].next.x,s[2].next.y,s[2].next.zone],[2,51,14,3,51,15,4]);
 a.deepEqual([s[3].t,s[3].prev.x,s[3].prev.y,s[3].prev.zone,s[3].next.x,s[3].next.y,s[3].next.zone],[3,47,48,4,46,48,5]);
 a.equal(E.S.seamTavernAt(51,15),2);a.equal(E.S.seamTavernAt(47,48),3);
 a.equal(E.S.contentCap.isZoneOpen(4),true);a.equal(E.S.contentCap.isZoneOpen(5),true);
 // bump from the zone 4 side of Tavern 3 and from Tavern 4 toward zone 5: no step, one bump each
 const g=engine(51,15,0);g.S.act("fwd");a.deepEqual(pos(g.S),[51,15,0]);a.deepEqual(g.bumps.map(b=>b[0]),[2]);
 const h=engine(47,48,3);h.S.act("fwd");a.deepEqual(pos(h.S),[47,48,3]);a.deepEqual(h.bumps.map(b=>b[0]),[3]);
 // the zone tab into zone 4 lands on 51,15 facing away; seamExit never moves into zone 5 by itself here (the tab is capped in party.js)
 const k=engine(51,14,2);a.equal(k.S.seamExit(2,4),true);a.deepEqual(pos(k.S).slice(0,2),[51,15]);a.notEqual(pos(k.S)[2],0);
});
