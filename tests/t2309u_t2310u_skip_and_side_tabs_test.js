"use strict";
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),crypto=require("node:crypto"),{execFileSync}=require("node:child_process");
const root=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const sha=f=>crypto.createHash("sha256").update(fs.readFileSync(path.join(root,f))).digest("hex");
const intro=read("intro.js"),story=read("story.js"),html=read("index.html"),sw=read("sw.js");
const opening=intro.slice(intro.indexOf('if(on&&sc==="opening")'),intro.indexOf('if(on&&sc==="ending")'));
const ending=intro.slice(intro.indexOf('if(on&&sc==="ending")'),intro.indexOf("function endFaces("));
const cave=intro.slice(intro.indexOf("function showCave("),intro.indexOf("function hideCave("));
const journal=intro.slice(intro.indexOf("function openJournal("),intro.indexOf("function itemName("));
const css=intro.slice(intro.indexOf(".ia-stage{"),intro.lastIndexOf("`;document.head.appendChild(css);"));
test("t2309u skip lives only on the sick-dad opening scene",()=>{
 a.match(opening,/el\("button","iskip","Skip"\)/);
 a.match(opening,/skipSickDad\(\)/);
 a.match(intro,/function unstage\(host\)\{[^}]*querySelector\("\.iskip"\)/);
 a.match(intro,/function skipSickDad\(\)\{try\{if\(S\.rpg&&S\.rpg\.s6&&S\.rpg\.s6\.skipOpening\)S\.rpg\.s6\.skipOpening\(\);/);
 a.match(intro,/if\(l&&l\.kind==="opening"\)return;/);
 a.match(intro,/showCave\(\);/);
 a.doesNotMatch(ending,/\.iskip|Skip/);
 a.doesNotMatch(cave,/\.iskip|Skip|skipOpening|skipSickDad/);
 a.match(cave,/2000/);
 a.match(css,/\.iskip\{position:absolute;z-index:6;top:calc\(8px \+ env\(safe-area-inset-top, 0px\)\);left:calc\(8px \+ env\(safe-area-inset-left, 0px\)\)/);
 a.match(story,/function skipOpening\(\)\{if\(!cur\|\|cur\.kind!=="opening"\)return false;if\(cur\.tm\)clearTimeout\(cur\.tm\);finish\(\);return true;\}/);
 a.match(story,/S\.rpg\.s6=\{talkPresent,play,skipOpening,/);
});
test("skipOpening finishes only the opening scene",()=>{
 const fn=story.match(/function skipOpening\(\)\{[^}]+\}/)[0];
 const ctx={cur:{kind:"opening",tm:11,opt:{}},finished:false,cleared:0,ok:null};
 ctx.clearTimeout=function(id){ctx.cleared=id;};
 ctx.finish=function(){ctx.finished=true;ctx.cur=null;};
 vm.createContext(ctx);vm.runInContext(fn+";this.ok=skipOpening();",ctx);
 a.equal(ctx.ok,true);a.equal(ctx.finished,true);a.equal(ctx.cleared,11);a.equal(ctx.cur,null);
 ctx.cur={kind:"ending",tm:22,opt:{}};ctx.finished=false;ctx.cleared=0;
 vm.runInContext("this.ok=skipOpening();",ctx);
 a.equal(ctx.ok,false);a.equal(ctx.finished,false);a.equal(ctx.cleared,0);a.equal(ctx.cur.kind,"ending");
 ctx.cur=null;vm.runInContext("this.ok=skipOpening();",ctx);a.equal(ctx.ok,false);
});
test("t2310u journal uses side tabs and a cover-first open",()=>{
 a.match(journal,/if\(tab\)\{jTab=tab;jOpenSec=true;\}/);
 a.match(journal,/jb\.dataset\.open=jOpenSec\?"1":"0"/);
 a.match(journal,/book\.appendChild\(tabs\);/);
 a.match(journal,/if\(jOpenSec\)\{const pg=el\("div","ijpage"\)/);
 a.match(journal,/function closeJournal\(\)\{jBeast=null;jTab=null;jOpenSec=false;/);
 a.match(intro,/const TABS=\[\["inventory","Inventory"\],\["beasts","Beasts"\],\["map","Map"\],\["art","Found art"\],\["journal","Journal"\],\["recipes","Recipes"\],\["settings","Settings"\]\];/);
 a.doesNotMatch(intro.slice(intro.indexOf("const TABS="),intro.indexOf("function wear(")),/equipment/i);
 a.match(css,/\.ijtabs\{position:absolute;inset:0;z-index:3;pointer-events:none/);
 a.match(css,/\.ijtab\{position:absolute;pointer-events:auto;[^}]*background:transparent;color:transparent/);
 a.doesNotMatch(intro,/translateX\(78%\)|journal\/tab-|\.ijtab\.art/);
 a.match(css,/\.ijbook\{[^}]*aspect-ratio:2\/3;[^}]*background:var\(--book\)/);
 a.match(css,/\.ijour\{[^}]*padding:calc\(10px \+ env\(safe-area-inset-top\)\) 10px 16px 10px/);
 a.match(journal,/bk="journal\/book-"\+\(jOpenSec\?"open-zone":"zone"\)/);
 a.match(css,/\.ijpage\{position:absolute;left:20\.2%;top:18%;width:52\.3%;height:61%;[^}]*overflow-y:auto/);
 a.match(intro,/function beastNote\(/);
 a.match(intro,/dataset\.setting=/);
 a.doesNotMatch(intro.slice(intro.indexOf('t==="beasts"'),intro.indexOf('t==="recipes"')),/Back to Beasts/);
 a.match(intro,/if\(k==="beasts"\)jBeast=null;openJournal\(k\)/);
});
function harness(){
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={setProperty(k,v){this[k]=v;}};this.events={};this.className="";this.textContent="";this.classList={contains:k=>this.className.split(/\s+/).includes(k),add:(...ks)=>ks.forEach(k=>{if(!this.classList.contains(k))this.className+=" "+k;}),remove:(...ks)=>{this.className=this.className.split(/\s+/).filter(k=>!ks.includes(k)).join(" ");},toggle:(k,on)=>on===undefined?this.classList[this.classList.contains(k)?"remove":"add"](k):on?this.classList.add(k):this.classList.remove(k)};}
  set innerHTML(v){this.children=[];this._html=v;}get innerHTML(){return this._html||"";}
  appendChild(e){this.children.push(e);e.parentNode=this;return e;}append(...es){es.forEach(e=>this.appendChild(e));}
  addEventListener(k,f){(this.events[k]||(this.events[k]=[])).push(f);}
  matches(s){if(s[0]===".")return this.classList.contains(s.slice(1));if(s[0]==="#")return this.id===s.slice(1);const m=s.match(/^\[data-([\w-]+)(?:=["']?([^"'\]]+)["']?)?\]$/);if(m){const k=m[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return m[2]==null?k in this.dataset:String(this.dataset[k])===m[2];}return this.tagName===s.toUpperCase();}
  querySelectorAll(s){const out=[];for(const c of this.children){if(c.matches(s))out.push(c);out.push(...c.querySelectorAll(s));}return out;}querySelector(s){return this.querySelectorAll(s)[0]||null;}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(e=>e!==this);}
 }
 const body=new Element("body"),htmlEl=new Element("html");
 for(const id of ["s4","s4toast","s4hint","partyb"]){const e=new Element("div");e.id=id;body.appendChild(e);}
 const document={body,head:new Element("head"),documentElement:htmlEl,readyState:"loading",createElement:t=>new Element(t),getElementById:id=>body.querySelector("#"+id),querySelector:s=>body.querySelector(s),addEventListener(){}};
 const storage=new Map();storage.set("sota.dev.nofight","1");
 const c={window:{addEventListener(){}},document,console,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))},setInterval(){},setTimeout(){},clearInterval(){},clearTimeout(){},requestAnimationFrame(){},cancelAnimationFrame(){},performance:{now:()=>1},addEventListener(){},MutationObserver:class{observe(){}},matchMedia:()=>({matches:false,addEventListener(){}}),navigator:{},location:{protocol:"file:"}};
 vm.createContext(c);for(const f of ["maze-data.js","content-cap.js","rules.js","econ.js"])vm.runInContext(read(f),c);
 const M=c.window.MAZE,R=c.window.RPG,pos={x:M.taverns[0][0],y:M.taverns[0][1],f:0};
 const S=c.window.SOTA={core:{zoneOf:M.zone,solvedR:Array(M.rooms.length).fill(0),clearedR:Array(M.rooms.length).fill(0)},state:()=>({...pos}),saveRooms(){},teleport(){},contentCap:c.window.SOTA_CONTENT_CAP.create(M.n,M.zone),music:{isMuted:()=>false,setMuted(){}},storyOpen:()=>false,setMazeSlots(){},mazeSlots:()=>[null,null,null,null]};
 vm.runInContext(read("party.js"),c);
 const r=S.rpg;r.s6={play(){},st:()=>({seen:{},walls:{}})};
 const h=R.newChar("Test Hero","human","warrior",{str:0,sta:0,man:0},R.SKILLS.warrior[0].id);
 r.setLive({v:1,party:[JSON.parse(JSON.stringify(h))],diff:"normal",gold:200,steps:0,seed:1,fresh:{},recipes:{},tentWear:0});
 function click(e){a.ok(e,"missing button");for(const f of e.events.click||[])f({preventDefault(){},stopPropagation(){}});}
 vm.runInContext(read("intro-art-data.js"),c);vm.runInContext(read("intro.js"),c);
 return {i:S.intro,document,click};
}
test("opening the journal with no tab shows the cover; a side tab opens that section",()=>{
 const h=harness();h.i.openJournal();
 const jb=h.document.getElementById("ijour");
 a.equal(jb.dataset.open,"0");a.equal(jb.querySelectorAll(".ijpage").length,0);a.match(jb.style["--book"],/book-zone1\.webp/);
 const tabs=jb.querySelectorAll(".ijtab");
 a.deepEqual(tabs.map(t=>t.dataset.tab),["inventory","beasts","map","art","journal","recipes","settings"]);
 for(let i=0;i<tabs.length;i++){
  a.equal(tabs[i].style.left,(780/1024*100)+"%");a.equal(tabs[i].style.top,((334+i*122)/1536*100)+"%");
  a.equal(tabs[i].style.width,(208/1024*100)+"%");a.equal(tabs[i].style.height,(108/1536*100)+"%");
  a.equal(tabs[i].style.backgroundImage,undefined);a.ok(!tabs[i].classList.contains("art"));
 }
 a.equal(jb.querySelector(".ijtab.sel"),null);
 a.ok(!jb.querySelector(".ijbook").classList.contains("ijopen"));
 h.click(tabs.find(t=>t.dataset.tab==="inventory"));
 a.equal(jb.dataset.open,"1");a.equal(jb.querySelector(".ijpage").dataset.tab,"inventory");a.match(jb.style["--book"],/book-open-zone1\.webp/);
 a.ok(jb.querySelector(".ijbook").classList.contains("ijopen"));
 a.ok(jb.querySelectorAll(".ijtab").find(t=>t.dataset.tab==="inventory").classList.contains("sel"));
 a.ok(jb.querySelector(".ijpage").querySelectorAll("button").some(b=>/Open backpack|Open equipment/.test(b.textContent)));
 h.i.closeJournal();h.i.openJournal();
 a.equal(jb.dataset.open,"0");a.equal(jb.querySelectorAll(".ijpage").length,0);a.match(jb.style["--book"],/book-zone1\.webp/);
 h.i.openJournal("settings");
 a.equal(jb.querySelectorAll("[data-setting]").length,3);
 a.equal(jb.querySelector(".ijpage").dataset.tab,"settings");
});
test("pins are intro.js?v=14, story.js?v=23, and VER 70; door and party pins stay",()=>{
 a.match(sw,/^const VER="70",CACHE="sota-s1-v"\+VER/);
 for(const src of [html,sw]){
  a.ok(src.includes("intro.js?v=14"));a.ok(!src.includes("intro.js?v=13"));
  a.ok(src.includes("story.js?v=23"));a.ok(!src.includes("story.js?v=22"));
  a.ok(src.includes("game.js?v=20"));a.ok(src.includes("doors.js?v=15"));
  a.ok(src.includes("puzzle-ui.js?v=16"));a.ok(src.includes("party.js?v=25"));
 }
});
test("occupancy, sick-dad, and journal-monster files were not rewritten",()=>{
 a.equal(sha("art6/camp/camp-eating-human.webp"),"4b040f7d0130e0e4bf1e674448c8b7b8f40df443c8bb117aa0e5f552060b407e");
 a.equal(sha("art-intro/sickdad/sickdad-cat.webp"),"30932b97843dbf94b568b11d306372fcbe54ae863a03f040c96186daa5ab61ca");
 const changed=execFileSync("git",["-C",root,"diff","--name-only","HEAD"],{encoding:"utf8"});
 const changedImages=changed.split("\n").filter(n=>/\.(png|webp|jpe?g|svg|gif)$/.test(n));
 a.ok(changedImages.every(n=>/^art-intro\/journal\/book-(?:open-)?zone[1-5]\.webp$/.test(n)),changedImages.join("\n"));
 const mon=path.join(root,"art-intro/journal/monsters");
 const names=fs.readdirSync(mon).filter(n=>n.endsWith(".webp")).sort();
 a.equal(names.length,14);
 for(const n of names){const f="art-intro/journal/monsters/"+n;const old=execFileSync("git",["-C",root,"show","HEAD:"+f]);a.equal(sha(f),crypto.createHash("sha256").update(old).digest("hex"));}
 a.equal(sha("story.js"),"5981c80a87bd7a402ff718ffc6d31f649479d8ad36ab90441d7c3c156a967893");
});

test("t2317u/t2318u painted book art is locked to seven labels and five matching open variants",()=>{
 const manifest=JSON.parse(read("tests/t2317u_book_art_manifest.json"));
 a.deepEqual(manifest.labels,["Inventory","Beasts","Map","Found art","Journal","Recipes","Settings"]);
 a.equal(Object.keys(manifest.sha256).length,10);
 for(const [file,hash] of Object.entries(manifest.sha256))a.equal(sha(file),hash,file);
 const art=read("intro-art-data.js");
 for(let w=1;w<=5;w++){
  a.ok(art.includes('"journal/book-open-zone'+w+'.webp"'));
  a.ok(sw.includes('"art-intro/journal/book-open-zone'+w+'.webp"'));
 }
 for(const src of [html,sw])a.ok(src.includes("intro-art-data.js?v=4"));
 const builder=read("tools/t2317u_journal_books.py");
 a.match(builder,/LABELS = \["Inventory", "Beasts", "Map", "Found art", "Journal", "Recipes", "Settings"\]/);
 a.doesNotMatch(builder,/Equipment|t2171u/);
 a.match(intro,/window\.StoryJournalGenerator\.caption\(fact\)/);
 a.doesNotMatch(intro,/Back to Beasts/);
});
