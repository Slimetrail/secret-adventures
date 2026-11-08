"use strict";
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),{execFileSync}=require("node:child_process");
const root=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
function base(){const c={window:{}};vm.createContext(c);vm.runInContext(read("maze-data.js"),c);vm.runInContext(read("content-cap.js"),c);return c;}
function engine(x,y,f=0){
 const c=base(),els=new Map(),storage=new Map([["sota.stage1.save",JSON.stringify({x,y,f})]]);
 function el(id){if(!els.has(id))els.set(id,{textContent:"",style:{},classList:{add(){},remove(){}},addEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:400,height:300}),getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},clearRect(){}};}});return els.get(id);}
 Object.assign(c,{document:{getElementById:el,querySelectorAll:()=>[],createElement:()=>({style:{},width:0,height:0,getContext(){return {clearRect(){},fillRect(){},drawImage(){}};}})},localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},performance:{now:()=>1},requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){}});
 Object.assign(c.window,{TEX:{S:32},DOORTEX:{},innerWidth:400,innerHeight:300,addEventListener(){}});
 vm.runInContext(read("tex.js"),c);
 vm.runInContext(read("doors.js"),c);
 vm.runInContext(read("game.js"),c);
 let steps=0,after=0,puzzles=0,opened=[];c.SOTA=c.window.SOTA;Object.assign(c.SOTA,{onStep(){steps++;},afterStep(){after++;},openPuzzle(){puzzles++;},onRoomOpen(id){opened.push(id);}});
 return {s:c.SOTA,el,counts:()=>({steps,after,puzzles,opened:opened.slice()}),storage,M:c.window.MAZE,DT:c.window.DOORTEX};
}
function hallwayOf(M,room){
 for(let d=0;d<4;d++){const x=room.c[0]-dirs[d][0],y=room.c[1]-dirs[d][1];if(x<0||y<0||x>=M.n||y>=M.n)continue;if(parseInt(M.mask[y*M.n+x],16)&(1<<d))return {x,y,f:d};}
 return null;
}

test("solving or tapping an unlocked door plays the room without leaving the hall or using the prompt",()=>{
 const seed=engine(0,64,0);
 const kinds=["treasure","monster","story"];
 for(const kind of kinds){
  const room=seed.M.rooms.find(r=>r.z===1&&r.k===kind);a.ok(room,kind);
  const hall=hallwayOf(seed.M,room);a.ok(hall,kind);
  const e=engine(hall.x,hall.y,hall.f);
  const before=e.s.state();
  e.s.act("fwd");
  a.deepEqual(e.s.state(),before);
  a.equal(e.s.useFacingDoor(),true);
  a.deepEqual([e.s.state().x,e.s.state().y],[hall.x,hall.y]);
  a.deepEqual(e.counts().opened,[]);
  a.equal(e.counts().puzzles,1);
  e.s.core.solvedR[room.id]=1;
  a.equal(e.s.useFacingDoor(),true);
  a.deepEqual([e.s.state().x,e.s.state().y],[hall.x,hall.y]);
  a.deepEqual(e.counts().opened,[room.id]);
  a.equal(e.s.panelOpen(),false);
  a.ok(e.s.rooms().cleared.includes(room.id));
  a.equal(e.counts().after,0);
  a.equal(e.s.useFacingDoor(),true);
  a.deepEqual(e.counts().opened,[room.id]);
  e.s.act("fwd");
  a.deepEqual([e.s.state().x,e.s.state().y],[hall.x,hall.y]);
 }
});

test("puzzle UI closes and plays the room instead of walking forward",()=>{
 const pui=read("puzzle-ui.js"),game=read("game.js"),party=read("party.js");
 a.match(pui,/if\(P\.solved\(cur\.pz,cur\.s\)\)\{S\.markSolved\(cur\.id\);const id=cur\.id;close\(\);if\(S\.enterDoor\)S\.enterDoor\(id\);return;\}/);
 a.match(pui,/tap\("penter",\(\)=>\{if\(!cur\)return;const id=cur\.id;close\(\);if\(S\.enterDoor\)S\.enterDoor\(id\);\}\);/);
 a.equal(pui.includes("S.act(c)"),false);
 a.match(game,/function playRoom\(rid\)/);
 a.match(game,/playRoom\(rid\);updHud\(\);return true;/);
 a.doesNotMatch(game.slice(game.indexOf("function enterDoor"),game.indexOf("function useFacingDoor")),/showPanel\(|st\.x=nx|afterStep/);
 a.match(party,/S\.onRoomOpen=id=>\{if\(!live\|\|localStorage\.getItem\(DEV_NOFIGHT\)==="1"\)return;const r=M\.rooms\[id\];/);
 a.match(party,/r\.k==="treasure".*treasurePanel\(l\)/);
 a.match(party,/r\.k==="monster".*fightHere\("room"\)/);
 a.match(party,/r\.k==="story"\)h6\("wall",id\)/);
});

test("unlocked hallway view uses the open wooden door with a black opening",()=>{
 const e=engine(0,64,0),data=e.DT.open[1],S=Math.sqrt(data.length/4)|0,i=((S>>1)*S+(S>>1))*4;
 a.ok(e.DT.open&&e.DT.open[1]&&S>=32);
 a.equal(data[i]+data[i+1]+data[i+2]+data[i+3],0);
 a.ok(e.DT[1][i]+e.DT[1][i+1]+e.DT[1][i+2]>80);
 const fi=((S>>1)*S+2)*4;a.ok(data[fi]+data[fi+1]+data[fi+2]>40);
 const game=read("game.js");
 a.match(game,/if\(dr>=0\)\{door=dr;break;\}/);
 a.doesNotMatch(game,/through=-1|solvedR\[dr\]&&through/);
 a.match(game,/\(\(solvedR\[door\]&&DT\.open&&DT\.open\[z\]\)\|\|DT\[z\]\)/);
});

test("pins moved and only approved book art changed; occupancy and monster sketches stay",()=>{
 const html=read("index.html"),sw=read("sw.js");
 a.match(sw,/^const VER="70",CACHE="sota-s1-v"\+VER/);
 for(const src of [html,sw]){
  a.ok(src.includes("game.js?v=20"));a.ok(src.includes("doors.js?v=15"));a.ok(src.includes("puzzle-ui.js?v=16"));
  a.ok(!src.includes("game.js?v=19"));a.ok(!src.includes("doors.js?v=14"));a.ok(!src.includes("puzzle-ui.js?v=15"));
 }
 const changed=execFileSync("git",["ls-files","--others","--exclude-standard"],{cwd:root,encoding:"utf8"})+execFileSync("git",["diff","--name-only","HEAD"],{cwd:root,encoding:"utf8"});
 a.ok(changed.split("\n").filter(n=>/\.(png|webp|jpe?g|svg|gif)$/.test(n)).every(n=>/^art-intro\/journal\/book-(?:open-)?zone[1-5]\.webp$/.test(n)),"Only approved journal book art may change");
});
