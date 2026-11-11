"use strict";
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),{execFileSync}=require("node:child_process");
const root=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
function el(tag,c="",text=""){
 return {tag,className:c||"",textContent:text||"",dataset:{},children:[],listeners:{},
  appendChild(n){this.children.push(n);return n;},
  addEventListener(ev,fn){(this.listeners[ev]=this.listeners[ev]||[]).push(fn);},
  click(){(this.listeners.click||[]).forEach(fn=>fn({preventDefault(){}}));}};
}
const all=(n,tag)=>[...(n.tag===tag?[n]:[]),...n.children.flatMap(c=>all(c,tag))];
function load(live, jBeast){
 const src=read("intro.js");
 const ctx={el,s6:()=>({walls:{},seen:{},journalSplit:{pages:[]}}),S:{rpg:{live:()=>live,bagScreen(){},equipScreen(){}}},
  TX:{journal:{}},zonesFound:()=>({}),has:()=>true,A:p=>"art-intro/"+p,jTab:"beasts",jBeast:jBeast||null,
  window:{},opened:[],closed:0,lastPage:null,live};
 vm.createContext(ctx);
 vm.runInContext(read("story-journal-generator.js"),ctx);
 const prelude=`function itemName(id){return id;}
function closeJournal(){closed++;}
function openJournal(k){opened.push(k);if(k!=="beasts")jBeast=null;jTab=k;const pg=el("div");page(pg,live);lastPage=pg;}
function go(n,f){const b=el("button","ijgo",n);b.addEventListener("click",e=>{e.preventDefault();f();});return b;}`;
 const slice=src.slice(src.indexOf("const JOURNAL_MONSTERS="),src.indexOf("function go("));
 vm.runInContext(prelude+slice+";this.api={page};",ctx);
 const pg=el("div");ctx.api.page(pg,live);ctx.lastPage=pg;return ctx;
}

test("Beasts grid shows only found sketches; zone 3 sketches allowed since t2404u",()=>{
 const empty=load({beasts:[]});
 a.equal(all(empty.lastPage,"img").length,0);
 a.ok(all(empty.lastPage,"div").some(n=>n.textContent==="No beasts found yet."));
 const found=load({beasts:["z1-rat","z2-goblin","z3-wraith","z1-missing"]});
 const imgs=all(found.lastPage,"img");
 a.deepEqual(imgs.map(i=>i.src),["art-intro/journal/monsters/z1-rat.webp","art-intro/journal/monsters/z2-goblin.webp","art-intro/journal/monsters/z3-wraith.webp"]);
 a.equal(all(found.lastPage,"figure").map(f=>f.dataset.beast).join(","),"z1-rat,z2-goblin,z3-wraith");
});

test("tapping a found beast opens an in-journal detail view",()=>{
 const ctx=load({beasts:["z1-rat","z1-toad"]});
 const rat=all(ctx.lastPage,"figure").find(f=>f.dataset.beast==="z1-rat");
 a.ok(rat);rat.click();
 a.equal(ctx.closed,0);
 a.deepEqual(ctx.opened,["beasts"]);
 a.equal(ctx.jBeast,"z1-rat");
 const box=all(ctx.lastPage,"div").find(n=>n.dataset.beastDetail==="z1-rat");
 a.ok(box);
 a.equal(all(box,"img").map(i=>i.src).join(","),"art-intro/journal/monsters/z1-rat.webp");
 a.ok(box.className.includes("ijbeast"));
 a.ok(all(box,"figure").some(f=>f.className.includes("ijbeast-lg")));
});

test("detail notes reuse MONSTER_FACTS through caption and firstPerson",()=>{
 const G=(()=>{const c={window:{}};vm.createContext(c);vm.runInContext(read("story-journal-generator.js"),c);return c.window.StoryJournalGenerator;})();
 const rat=G.MONSTER_FACTS[1].find(m=>m[0]==="Rat");
 const bat=G.MONSTER_FACTS[1].find(m=>m[0]==="Cave bat");
 const toad=G.MONSTER_FACTS[1].find(m=>m[0]==="Mud toad");
 a.equal(G.caption(rat),"rat: a scavenger that gets into everything. but it does not take much to drop.");
 a.match(G.caption(bat),/if i catch it/);
 a.equal(G.caption(bat).includes("he catches"),false);
 const ctx=load({beasts:["z1-rat","z1-toad","z1-bat"]},"z1-bat");
 const box=all(ctx.lastPage,"div").find(n=>n.dataset.beastDetail==="z1-bat");
 const texts=all(box,"div").map(n=>n.textContent);
 a.ok(texts.includes("Cave bat"));
 a.ok(texts.includes(G.caption(bat)));
 a.equal(texts.some(t=>t.includes("he catches")),false);
 const toadPage=load({beasts:["z1-rat","z1-toad"]},"z1-toad").lastPage;
 const toadBox=all(toadPage,"div").find(n=>n.dataset.beastDetail==="z1-toad");
 a.ok(all(toadBox,"div").some(n=>n.textContent==="Mud toad"));
 a.ok(all(toadBox,"div").some(n=>n.textContent===G.caption(toad)));
});

test("detail stays on found beasts; zone 3 facts allowed since t2404u, zone 4 since t2419u, zone 5 ignored",()=>{
 const intro=read("intro.js");
 a.match(intro,/function beastNote\(name\)\{const G=window\.StoryJournalGenerator,f=G&&G\.MONSTER_FACTS;if\(!f\)return null;return \(f\[1\]\|\|\[\]\)\.concat\(f\[2\]\|\|\[\],f\[3\]\|\|\[\],f\[4\]\|\|\[\]\)\.find\(m=>m\[0\]===name\)\|\|null;\}/);
 a.match(intro,/window\.StoryJournalGenerator\.caption\(fact\)/);
 a.equal(intro.includes("f[5]"),false);
 const missing=load({beasts:["z1-rat"]},"z1-slime");
 a.equal(all(missing.lastPage,"div").some(n=>n.dataset.beastDetail),false);
 a.equal(all(missing.lastPage,"figure").map(f=>f.dataset.beast).join(","),"z1-rat");
 const z3=load({beasts:["z3-wraith","z1-rat"]},"z3-wraith");
 a.equal(all(z3.lastPage,"div").some(n=>n.dataset.beastDetail==="z3-wraith"),true); // t2404u: zone 3 art lock lifted
 a.equal(all(z3.lastPage,"img").some(i=>/z3-wraith/.test(i.src)),true);
 const z4=load({beasts:["z4-manticore","z1-rat"]},"z4-manticore"); // t2419u: zone 4 sketches and facts
 a.equal(all(z4.lastPage,"div").some(n=>n.dataset.beastDetail==="z4-manticore"),true);
 a.equal(all(z4.lastPage,"img").some(i=>/z4-manticore/.test(i.src)),true);
});

test("t2312u has no Back to Beasts button; the Beasts tab returns to the found-beast grid",()=>{
 const ctx=load({beasts:["z1-rat","z1-toad"]},"z1-rat");
 a.equal(all(ctx.lastPage,"button").some(b=>/Back to Beasts/i.test(b.textContent)),false);
 a.ok(all(ctx.lastPage,"div").some(n=>n.dataset.beastDetail==="z1-rat"));
 vm.runInContext('jBeast=null;openJournal("beasts");',ctx);
 a.equal(ctx.closed,0);
 a.equal(ctx.jBeast,null);
 a.deepEqual(all(ctx.lastPage,"figure").map(f=>f.dataset.beast),["z1-rat","z1-toad"]);
 a.equal(all(ctx.lastPage,"div").some(n=>n.dataset.beastDetail),false);
});

test("source keeps the journal open and does not rewrite sketch files",()=>{
 const intro=read("intro.js");
 a.match(intro,/jBeast=file;openJournal\("beasts"\)/);
 a.match(intro,/if\(k==="beasts"\)jBeast=null;openJournal\(k\)/);
 a.doesNotMatch(intro,/go\("Back to Beasts"/);
 a.doesNotMatch(intro,/Back to Beasts/);
 a.doesNotMatch(intro.slice(intro.indexOf('t==="beasts"'),intro.indexOf('t==="recipes"')),/closeJournal\(\)/);
 const changed=execFileSync("git",["ls-files","--others","--exclude-standard"],{cwd:root,encoding:"utf8"})+execFileSync("git",["diff","--name-only","HEAD"],{cwd:root,encoding:"utf8"});
 a.ok(changed.split("\n").filter(n=>/\.(png|webp|jpe?g|svg|gif)$/.test(n)).every(n=>/^art-intro\/journal\/book-(?:open-)?zone[1-5]\.webp$/.test(n)||/^art-intro\/journal\/monsters\/z3-[a-z]+\.webp$/.test(n)/* t2404u */||/^art-intro\/brand\//.test(n)/* t2386u */||/^art-intro\/(?:cave\/title|menu\/title-wall)\.webp$/.test(n)/* t2364u */||/^art6\/seam\/[a-z0-9-]+\.png$/.test(n)/* t2528u seam archway + Safe post */||/^art6\/map\/[a-z0-9-]+\.png$/.test(n)/* t2512u map door/room/camp/tavern icons */||/^art6\/hud\/[a-z0-9-]+\.png$/.test(n)/* t2574u compass rose */),"Only approved journal book art may change");
 const html=read("index.html"),sw=read("sw.js");
 a.match(sw,/^const VER="70",CACHE="sota-s1-v"\+VER/);
 for(const src of [html,sw]){a.ok(src.includes("intro.js?v=14"));a.ok(!src.includes("intro.js?v=13"));}
});
