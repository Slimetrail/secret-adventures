"use strict";
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),crypto=require("node:crypto");
const root=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
function base(){const c={window:{}};vm.createContext(c);vm.runInContext(read("maze-data.js"),c);vm.runInContext(read("content-cap.js"),c);return c;}
function engine(x,y,f=0){
 const c=base(),els=new Map(),storage=new Map([["sota.stage1.save",JSON.stringify({x,y,f})]]);
 function el(id){if(!els.has(id))els.set(id,{textContent:"",style:{},classList:{add(){},remove(){}},addEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:400,height:300}),getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},clearRect(){}};}});return els.get(id);}
 Object.assign(c,{document:{getElementById:el,querySelectorAll:()=>[],createElement:()=>({style:{},width:0,height:0,getContext(){return {clearRect(){},fillRect(){},drawImage(){}};}})},localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},performance:{now:()=>1},requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){}});
 Object.assign(c.window,{TEX:{S:32},DOORTEX:{},innerWidth:400,innerHeight:300,addEventListener(){}});
 vm.runInContext(read("game.js"),c);
 let steps=0,after=0,puzzles=0;c.SOTA=c.window.SOTA;Object.assign(c.SOTA,{onStep(){steps++;},afterStep(){after++;},openPuzzle(){puzzles++;}});
 return {s:c.SOTA,el,counts:()=>({steps,after,puzzles}),storage,M:c.window.MAZE};
}
function hallwayOf(M,room){
 for(let d=0;d<4;d++){const x=room.c[0]-dirs[d][0],y=room.c[1]-dirs[d][1];if(x<0||y<0||x>=M.n||y>=M.n)continue;if(parseInt(M.mask[y*M.n+x],16)&(1<<d))return {x,y,f:d};}
 return null;
}
function pageOf(tab, live){
 const src=read("intro.js");
 const e=(tag,c="",text="")=>({tag,className:c,textContent:text,dataset:{},children:[],appendChild(n){this.children.push(n);return n;}});
 const prelude="function itemName(id){return id;}function go(n){return el(\"button\",\"ijgo\",n);}function closeJournal(){}";
 const s={walls:{},seen:{},journalSplit:{pages:[]}},ctx={el:e,s6:()=>s,S:{rpg:{live:()=>live,bagScreen(){},equipScreen(){}}},TX:{journal:{}},zonesFound:()=>({}),has:()=>true,A:p=>"art-intro/"+p,jTab:tab,window:{}};
 vm.createContext(ctx);vm.runInContext(prelude+src.slice(src.indexOf("const JOURNAL_MONSTERS="),src.indexOf("function go("))+";this.api={page};",ctx);
 const pg=e("div");ctx.api.page(pg,live);return pg;
}
function beastsPage(beasts){return pageOf("beasts",{beasts});}
const all=(n,tag)=>[...(n.tag===tag?[n]:[]),...n.children.flatMap(c=>all(c,tag))];

test("journal merges Inventory and Equipment and puts Beasts in the freed slot",()=>{
 const intro=read("intro.js");
 const tabs=JSON.parse(intro.match(/const TABS=(\[.*?\]\]);/)[1]).map(x=>x[1]);
 a.deepEqual(tabs,["Inventory","Beasts","Map","Found art","Journal","Recipes","Settings"]);
 a.equal(tabs.includes("Equipment"),false);
 a.equal(fs.existsSync(path.join(root,"art-intro/journal/tab-beasts.webp")),false);
 a.match(intro,/t==="beasts"/);
 a.match(intro,/No beasts found yet\./);
 a.doesNotMatch(intro,/journal\/tab-/);a.match(intro,/t\.style\.left=\(780\/1024\*100\)/);
 a.equal(intro.includes('t==="equipment"'),false);
});

test("Beasts tab shows only found zone 1-2 sketches",()=>{
 const empty=beastsPage([]);
 a.equal(all(empty,"img").length,0);
 a.ok(all(empty,"div").some(n=>n.textContent==="No beasts found yet."));
 const found=beastsPage(["z1-rat","z2-goblin","z3-wraith","z1-missing"]);
 const imgs=all(found,"img");
 a.deepEqual(imgs.map(i=>i.src),[
  "art-intro/journal/monsters/z1-rat.webp",
  "art-intro/journal/monsters/z2-goblin.webp"
 ]);
 a.equal(all(found,"figure").map(f=>f.dataset.beast).join(","),"z1-rat,z2-goblin");
 a.equal(imgs.some(i=>/z3-/.test(i.src)),false);
});

test("fights record only named zone 1-2 beasts on the party save",()=>{
 const party=read("party.js");
 a.match(party,/function startFight\(mons,why\)\{if\(live\)\{if\(!Array\.isArray\(live\.beasts\)\)live\.beasts=\[\];\(mons\|\|\[\]\)\.forEach\(m=>\{const file=MON_FILE\[m\.n\];if\(file&&\/\^z\[12\]-\/\.test\(file\)&&!live\.beasts\.includes\(file\)\)live\.beasts\.push\(file\);\}\);\}/);
 a.equal(party.includes("live.beasts.push(monKey"),false);
 a.match(party,/"Rat":"z1-rat"/);
 a.match(party,/beasts:\[\]/);
 a.match(party,/if\(S\.resetRun\)S\.resetRun\(\);doSave\(true\)/);
 a.match(party,/if\(S\.mazeSnap\)live\.maze=S\.mazeSnap\(\)/);
 a.match(party,/if\(S\.applyMaze\)S\.applyMaze\(save\.maze\|\|\{x:save\.at\.x,y:save\.at\.y,f:save\.at\.f\}\)/);
 a.equal(party.includes("if(save.maze&&S.applyMaze)S.applyMaze(save.maze);else S.teleport"),false);
});

test("new game resets maze drawing, trail, rooms, and the separate maze save",()=>{
 const e0=engine(0,64,0);
 const room=e0.M.rooms.find(r=>r.z===1);
 const hall=hallwayOf(e0.M,room);
 a.ok(hall);
 const e=engine(hall.x,hall.y,hall.f);
 a.equal(e.s.state().x,hall.x);a.equal(e.s.state().y,hall.y);
 e.s.core.solvedR[room.id]=1;e.s.core.clearedR[room.id]=1;e.s.saveRooms();
 a.ok(e.s.rooms().solved.includes(room.id));
 const before=e.s.mazeSnap();
 a.equal(before.x,hall.x);a.equal(before.y,hall.y);
 a.ok(e.s.visitedCount()>=1);
 e.s.resetRun();
 const st=e.s.state();
 a.deepEqual([st.x,st.y,st.f],[e.M.entrance[0],e.M.entrance[1],0]);
 a.equal(e.s.visitedCount(),1);
 a.equal(e.s.isVisited(e.M.entrance[0],e.M.entrance[1]),true);
 a.equal(e.s.isVisited(hall.x,hall.y),hall.x===e.M.entrance[0]&&hall.y===e.M.entrance[1]);
 a.deepEqual([...e.s.rooms().solved],[]);a.deepEqual([...e.s.rooms().cleared],[]);
 const saved=JSON.parse(e.storage.get("sota.stage1.save"));
 a.deepEqual([saved.x,saved.y,saved.f],[e.M.entrance[0],e.M.entrance[1],0]);
 const roomsSaved=JSON.parse(e.storage.get("sota.rooms")||"null");
 a.ok(!roomsSaved||((roomsSaved.s||[]).length===0&&(roomsSaved.c||[]).length===0));
 e.s.applyMaze(before);
 const back=e.s.state();
 a.deepEqual([back.x,back.y,back.f],[hall.x,hall.y,hall.f]);
 a.equal(e.s.isVisited(hall.x,hall.y),true);
 a.equal(e.s.visitedCount()>=1,true);
});

test("walking into a room door bumps; clicking or useFacingDoor opens or enters it",()=>{
 const seed=engine(0,64,0),room=seed.M.rooms.find(r=>r.z===1),hall=hallwayOf(seed.M,room);
 a.ok(hall);
 const e=engine(hall.x,hall.y,hall.f);
 const before=e.s.state();
 e.s.act("fwd");
 a.deepEqual(e.s.state(),before);
 a.deepEqual(e.counts(),{steps:0,after:0,puzzles:0});
 a.equal(e.s.useFacingDoor(),true);
 a.deepEqual([e.s.state().x,e.s.state().y],[hall.x,hall.y]);
 a.deepEqual(e.counts(),{steps:0,after:0,puzzles:1});
 e.s.core.solvedR[room.id]=1;
 a.equal(e.s.useFacingDoor(),true);
 a.deepEqual([e.s.state().x,e.s.state().y],[hall.x,hall.y]);
 a.ok(e.s.rooms().cleared.includes(room.id));
 a.equal(e.s.panelOpen(),false);
 a.equal(e.counts().after,0);
 e.s.teleport(hall.x,hall.y,hall.f);
 const mid=e.s.state();
 e.s.act("fwd");
 a.deepEqual(e.s.state(),mid);
 a.equal(e.counts().puzzles,1);
});

test("tavern and hallway walking is unchanged",()=>{
 const e=engine(18,24,1);
 e.s.act("fwd");
 a.equal(e.s.state().x,19);a.equal(e.s.state().y,24);
 e.s.act("back");
 a.equal(e.s.state().x,18);a.equal(e.s.state().y,24);
 a.equal(e.counts().steps,2);a.equal(e.counts().puzzles,0);
});

test("approved journal sketches and occupancy files were not rewritten",()=>{
 const {execFileSync}=require("node:child_process");
 const files=[
  ...["z1-bat","z1-bigbug","z1-fungus","z1-rat","z1-slime","z1-spider","z1-toad","z2-boar","z2-fairy","z2-goblin","z2-hobgoblin","z2-kobold","z2-orc","z2-pixies"].map(n=>"art-intro/journal/monsters/"+n+".webp"),
  "art6/camp/camp-eating-human.webp","art-intro/sickdad/sickdad-cat.webp","art-intro/sickdad/sickdad-human.webp","art-intro/sickdad/sickdad-dwarf.webp","art-intro/sickdad/sickdad-elf.webp"
 ];
 const diff=execFileSync("git",["diff","--name-only","HEAD","--",...files],{cwd:root,encoding:"utf8"}).trim();
 a.equal(diff,"");
 for(const f of files){
  const now=execFileSync("git",["hash-object",path.join(root,f)],{encoding:"utf8"}).trim();
  const head=execFileSync("git",["rev-parse","HEAD:"+f],{cwd:root,encoding:"utf8"}).trim();
  a.equal(now,head,f);
 }
 a.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(root,"art6/camp/camp-eating-human.webp"))).digest("hex"),"4b040f7d0130e0e4bf1e674448c8b7b8f40df443c8bb117aa0e5f552060b407e");
 a.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(root,"art-intro/sickdad/sickdad-cat.webp"))).digest("hex"),"30932b97843dbf94b568b11d306372fcbe54ae863a03f040c96186daa5ab61ca");
});
test("Inventory tab shows bag, gold, worn gear, and both open buttons",()=>{
 const pg=pageOf("inventory",{gold:12,party:[{name:"Ann",bag:["potion"],equip:{weapon:"sword",offhand:null}}],beasts:[]});
 const texts=all(pg,"div").map(n=>n.textContent);
 const buttons=all(pg,"button").map(n=>n.textContent);
 a.ok(all(pg,"h3").some(n=>n.textContent==="Inventory"));
 a.ok(texts.includes("Ann: potion"));
 a.ok(texts.includes("Ann — weapon: sword"));
 a.ok(texts.includes("Gold: 12"));
 a.ok(buttons.includes("Open backpack"));
 a.ok(buttons.includes("Open equipment"));
});

test("fight menu shows Skill for physical and class skills, not only Spells",()=>{
 const party=read("party.js");
 a.match(party,/const phys=sk\.filter\(s=>s\.k==="phys"\|\|s\.k==="guard"\)/);
 a.match(party,/,mag=sk\.filter\(s=>s\.k==="magic"\|\|s\.k==="heal"\)/);
 a.match(party,/if\(phys\.length\)items\.push\(\{t:"Skill",d:\{cmd4:"skill"\}/);
 a.match(party,/if\(mag\.length\)items\.push\(\{t:"Spells",d:\{cmd4:"spells"\}/);
 a.equal(party.includes('{t:"Spells",d:{cmd4:"spells"},off:!sk.length,kids:()=>sk.map(skItem)}'),false);
 const SKILLS={warrior:[{id:"cleave",n:"Cleave",k:"phys"}],rogue:[{id:"stab",n:"Backstab",k:"phys"},{id:"smoke",n:"Smoke Veil",k:"guard"}],mage:[{id:"bolt",n:"Arcane Bolt",k:"magic"},{id:"mend",n:"Mend",k:"heal"}]};
 function labels(cls,ids){
  const sk=ids.map(id=>SKILLS[cls].find(x=>x.id===id)).filter(Boolean);
  const phys=sk.filter(s=>s.k==="phys"||s.k==="guard"),mag=sk.filter(s=>s.k==="magic"||s.k==="heal");
  const items=["Defend","Attack"];
  if(phys.length)items.push("Skill");
  if(mag.length)items.push("Spells");
  items.push("Items","Run");
  return items;
 }
 a.deepEqual(labels("warrior",["cleave"]),["Defend","Attack","Skill","Items","Run"]);
 a.deepEqual(labels("rogue",["stab","smoke"]),["Defend","Attack","Skill","Items","Run"]);
 a.deepEqual(labels("mage",["bolt","mend"]),["Defend","Attack","Spells","Items","Run"]);
});

test("random fights use 6 percent hallways and 25 percent rooms after 10 steps",()=>{
 const party=read("party.js");
 a.match(party,/if\(stepsSince<10\)return;/);
 a.match(party,/if\(r<\(rid>=0\?0\.25:0\.06\)\)/);
 a.equal(party.includes("rid>=0?0.15:0.02"),false);
});
