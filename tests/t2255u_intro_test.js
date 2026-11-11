"use strict";
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),crypto=require("node:crypto");
const source=fs.readFileSync("intro.js","utf8");
function harness({race="cat",cls="rogue",title=true,ready=true}={}){
 const nodes=new Map(),timers=new Map();let now=0,next=1,currentLine=null;
 function el(tag,c,text){const n={tag,className:c||"",textContent:text||"",dataset:{},style:{},children:[],hidden:false,events:{},
  appendChild(x){this.children.push(x);},replaceChildren(){this.children=[];},removeAttribute(k){delete this[k];},
  addEventListener(k,f){this.events[k]=f;},querySelector(sel){return nodes.get(sel);}};
  const classes=new Set();n.classList={add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)};
  Object.defineProperty(n,"innerHTML",{set(){for(const [tag,c] of [["div","icave-bg"],["div","icave-title"],["img","icave-hero"],["div","icave-tap"]])nodes.set("."+c,el(tag,c));}});return n;}
 const html=el("html"),body=el("body"),art=new Set(ready?["sickdad/sickdad-"+race+".webp"]:[]);
 const h={race,cls};const context={hero:()=>h,has:p=>art.has(p)||p==="cave/backdrop.webp"||p==="cave/back-"+race+"-"+cls+".webp"||(title&&p==="cave/title.webp"),A:p=>"art-intro/"+p,el,TITLE:"Secret of the Adventure",document:{body,documentElement:html},
  S:{rpg:{s6:{line:()=>currentLine}}},
  setInterval:(f,ms)=>{let id=next++;timers.set(id,{f,at:now+ms,interval:ms});return id;},clearInterval:id=>timers.delete(id),
  setTimeout:(f,ms)=>{let id=next++;timers.set(id,{f,at:now+ms});return id;},clearTimeout:id=>timers.delete(id)};
 vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf("function sickArt()"),source.indexOf("function stage("))+source.slice(source.indexOf("let cv=null"),source.indexOf("const H=window.S6H"))+";this.api={sickArt,showCave,hideCave,cave:()=>cv,open:()=>cOpen};",context);
 return {...context.api,h,nodes,timers,setLine(line){currentLine=line;},tick(ms){const end=now+ms;while(true){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;const [id,t]=due;now=t.at;if(t.interval)t.at+=t.interval;else timers.delete(id);t.f();}now=end;}};
}
for(const race of ["cat","dwarf","elf","human"])test("race-only art for "+race,()=>{
 for(const cls of ["warrior","rogue","mage","archer"]){const h=harness({race,cls});a.equal(h.sickArt().b,"sickdad/sickdad-"+race+".webp");a.equal(h.sickArt().ready,true);}
 a.equal(harness({race,ready:false}).sickArt().ready,false);
});
test("opening stages painting only and hides the default bust",()=>{
 a.ok(source.includes('stage(b,"sickdad",a.b,null,null)'));
 a.match(source,/\.ia-active \.s6pf\{display:none!important\}/);
 const fn=source.slice(source.indexOf("function sickArt()"),source.indexOf("function stage("));
 a.doesNotMatch(fn,/scene-|backdrop|dad-.*race.*cls|hero-|h\.cls/);
 a.ok(source.includes('im.src="art6/fight/p-"+race.dataset.race+"-"+cls.dataset.cls+".png"'));
});
for(const title of [true,false])test("cave 2000ms stand, early-tap guard and "+(title?"painted title":"text fallback"),()=>{
 const h=harness({title});h.showCave();const cv=h.cave(),ti=h.nodes.get(".icave-title"),tap=h.nodes.get(".icave-tap");
 a.equal(cv.dataset.titleShown,"0");a.equal(ti.hidden,true);a.equal(tap.hidden,true);a.equal(ti.children.length,0);
 a.equal(h.nodes.get(".icave-hero").src,"art-intro/cave/back-cat-rogue.webp");
 cv.events.pointerup({preventDefault(){},stopPropagation(){}});h.hideCave();a.equal(h.open(),true);
 h.tick(1999);a.equal(cv.dataset.titleShown,"0");h.tick(1);a.equal(cv.dataset.titleShown,"1");a.equal(ti.hidden,false);a.equal(tap.hidden,false);a.equal(ti.children.length,1);
 a.equal(title?ti.children[0].src:ti.children[0].textContent,title?"art-intro/cave/title.webp":"Secret of the Adventure");
 h.hideCave();a.equal(h.open(),false);h.showCave();a.equal(cv.dataset.titleShown,"0");a.equal(ti.children.length,0);
 h.tick(1000);h.showCave();h.tick(1000);a.equal(cv.dataset.titleShown,"0");h.tick(1000);a.equal(cv.dataset.titleShown,"1");
});
test("four race paintings are listed in both offline manifests and versions agree",()=>{
 const ctx={window:{},self:{addEventListener(){}}};vm.runInNewContext(fs.readFileSync("intro-art-data.js","utf8"),ctx);
 vm.runInNewContext(fs.readFileSync("sw.js","utf8")+";this.shell=SHELL",ctx);
 for(const r of ["cat","dwarf","elf","human"]){const n="sickdad/sickdad-"+r+".webp";a.ok(ctx.window.INTRO_ART.includes(n));a.ok(ctx.shell.includes("art-intro/"+n));}
 for(const file of ["intro.js","intro-art-data.js"]){const pin=fs.readFileSync("index.html","utf8").match(new RegExp(file.replaceAll(".","\\.")+"\\?v=\\d+"))[0];a.ok(ctx.shell.includes(pin));}
});
test("spoken story, existing opening and content cap stay byte-identical; no steal dialogue written",()=>{
 const locks={"package-story-data.js": "6e8b2da31662bff47e193956cc78e6f3f8070247d1ee051d5d1be2a5f9a82598", "story.js": "7c40396bf41d87ffffd7dad50c37cb482bd1bfca3008e66bb939af432fadc6d0" /* t2766u/t2768u boss lock settings only */, "story-data.js": "203470a2ab02eb2647024c9ef87618a42a3226fe229db4c2fb001b1e71a4b6a3", "t2103u-text.js": "900a7db214e9b090490a6a5934723a1665f5238622a5ea529ccba925f670ada8", "content-cap.js": "7e88c2de6a922097988aa22c41da20f87002699ce98a892c4223e12546fab8af"}; // t2404u: story.js changed only for the t2393u review→credits split; t2419u: content-cap.js is now maxZone 4
 for(const [f,hash] of Object.entries(locks))a.equal(crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex"),hash,f);
 a.doesNotMatch(source,/play\(["'](?:steal|opening)["']/);
});

test("t2259u dialog holds title and early taps; clearing starts fresh stand",()=>{
 const h=harness();h.setLine({kind:"existing"});h.showCave();h.tick(3000);
 a.equal(h.cave().dataset.titleShown,"0");h.hideCave();a.equal(h.open(),true);
 h.setLine(null);h.tick(25);h.tick(1999);a.equal(h.cave().dataset.titleShown,"0");
 h.tick(1);a.equal(h.cave().dataset.titleShown,"1");h.hideCave();a.equal(h.timers.size,0);
});
test("t2259u returning dialog cancels stand and requires fresh 2000ms",()=>{
 const h=harness();h.showCave();h.tick(1000);h.setLine({kind:"existing"});h.tick(1500);
 a.equal(h.cave().dataset.titleShown,"0");h.setLine(null);h.tick(25);
 h.tick(1999);a.equal(h.cave().dataset.titleShown,"0");h.tick(1);a.equal(h.cave().dataset.titleShown,"1");
});
