"use strict";
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","intro.js"),"utf8");
function harness({save=true,art=true,standalone=false}={}){
 const globalEvents=new Map(),timers=new Map();let next=1,created=0,updates=0,prompts=0;
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.parentNode=null;this.dataset={};this.style={};this.className="";this.textContent="";this.hidden=false;this.events=new Map();
   this.classList={contains:n=>this.className.split(/\s+/).includes(n),add:n=>{if(!this.classList.contains(n))this.className+=(this.className?" ":"")+n;},remove:n=>{this.className=this.className.split(/\s+/).filter(x=>x!==n).join(" ");}};}
  appendChild(e){e.parentNode=this;this.children.push(e);return e;}
  append(...es){es.forEach(e=>this.appendChild(e));}
  replaceChildren(...es){this.children.forEach(c=>{c.parentNode=null;});this.children=[];es.forEach(e=>this.appendChild(e));} // t2446u: title menu rebuilds its buttons
  setAttribute(k,v){this[k]=v;}
  get isConnected(){return this===body||this===head||!!(this.parentNode&&this.parentNode.isConnected);}
  addEventListener(k,f){if(!this.events.has(k))this.events.set(k,[]);this.events.get(k).push(f);}
  matches(s){if(s.includes(","))return s.split(",").some(x=>this.matches(x.trim()));/* t2446u: selector lists */return s[0]==="."?this.classList.contains(s.slice(1)):s[0]==="#"?this.id===s.slice(1):this.tagName===s.toUpperCase();}
  closest(s){return this.matches(s)?this:this.parentNode&&this.parentNode.closest(s);}
  querySelector(s){for(const child of this.children){if(child.matches(s))return child;const e=child.querySelector(s);if(e)return e;}return null;}
 }
 const body=new Element("body"),head=new Element("head"),html=new Element("html"),ov=new Element("div");ov.id="s4";body.appendChild(ov);
 const document={body,head,documentElement:html,createElement:t=>new Element(t),getElementById:id=>body.querySelector("#"+id)};
 const window={SOTA:{rpg:{creation(){created++;},live:()=>null,save:()=>save?{}:null}},RPG:{},MAZE:{},INTRO_ART:art?["menu/title-wall.webp"]:[]};
 const context={window,document,matchMedia:()=>({matches:standalone,addEventListener(){}}),navigator:{onLine:true,serviceWorker:{getRegistration:async()=>({update:async()=>{updates++;}})}},location:{protocol:"https:",reload(){}},performance:{now:()=>100},MutationObserver:class{observe(){}},
  addEventListener:(k,f)=>{if(!globalEvents.has(k))globalEvents.set(k,[]);globalEvents.get(k).push(f);},setTimeout:(f,ms)=>{const id=next++;timers.set(id,{f,ms});return id;},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(source,context,{filename:"intro.js"});
 window.SOTA_INTRO_BOOT();
 function emit(target,type,extra={}){const e={target,defaultPrevented:false,stopped:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.stopped=true;},...extra};
  // The title keyboard listener is a window capture listener.
  if(type==="keydown")for(const f of globalEvents.get(type)||[])f(e);
  if(!e.stopped)for(let n=target;n;n=n.parentNode){for(const f of n.events.get(type)||[])f(e);if(e.stopped)break;}
  return e;
 }
 function flush(ms){for(const [id,t] of [...timers])if(t.ms===ms){timers.delete(id);t.f();}}
 flush(0);
 return {window,document,title:document.getElementById("ititle"),emit,flush,created:()=>created,updates:()=>updates,prompts:()=>prompts,
  promptEvent(){const e={preventDefault(){},prompt:async()=>{prompts++;},userChoice:Promise.resolve({outcome:"accepted"})};for(const f of globalEvents.get("beforeinstallprompt")||[])f(e);}};
}
function buttons(h){const controls=h.title.querySelector(".iapp");return {controls,install:controls.querySelector(".iinst"),update:controls.querySelector(".iupd")};}
for(const art of [true,false])test(`title exposes exact app buttons (${art?"painted art":"fallback"})`,()=>{
 const h=harness({art}),b=buttons(h);a.equal(b.controls.dataset.where,"title");a.equal(b.install.textContent,"Install app");a.equal(b.update.textContent,"Check for update");a.equal(b.install.hidden,false);a.equal(b.update.hidden,false);a.equal(b.install.type,"button");a.equal(b.update.type,"button");a.equal(h.window.SOTA.intro.titleOpen(),true);
 if(art)a.match(h.title.style.backgroundImage,/menu\/title-wall.webp/);
 h.window.SOTA.intro.showTitle();a.equal(h.title.children.filter(c=>c.classList.contains("iapp")).length,1);
});
test("title controls retain a safe-area overlay and 44px touch targets",()=>{
 a.match(source,/\.ititle > \.iapp\{position:absolute;z-index:2;[^}]*safe-area-inset-bottom[^}]*touch-action:manipulation/);
 a.match(source,/\.ititle > \.iapp \.s4b\{min-height:44px;min-width:44px;flex:1 1 130px/);
});
test("install tap/hold is isolated from title creation and continue gestures",async()=>{
 const h=harness(),b=buttons(h);h.emit(b.install,"pointerdown");h.flush(600);h.emit(b.install,"pointerup");h.emit(b.install,"click");
 a.equal(b.controls.querySelector(".ihint").hidden,false);a.equal(h.created(),0);a.equal(h.window.SOTA.intro.titleOpen(),true);
 h.promptEvent();h.emit(b.install,"click");await Promise.resolve();a.equal(h.prompts(),1);a.equal(h.created(),0);
});
test("update tap uses existing service-worker check without triggering title action",async()=>{
 const h=harness(),b=buttons(h);h.emit(b.update,"pointerdown");h.flush(600);h.emit(b.update,"pointerup");h.emit(b.update,"click");
 await new Promise(resolve=>setImmediate(resolve));
 a.equal(h.updates(),1);a.equal(h.window.SOTA.intro.state().upd,"current");a.equal(h.created(),0);a.equal(h.window.SOTA.intro.titleOpen(),true);
});
test("keyboard on app buttons bypasses the title capture shortcut",()=>{
 const h=harness(),b=buttons(h);for(const key of ["Enter"," "])a.equal(h.emit(b.update,"keydown",{key}).defaultPrevented,false);
 a.equal(h.created(),0);a.equal(h.window.SOTA.intro.titleOpen(),true);
 h.emit(h.title,"keydown",{key:"Enter"});a.equal(h.created(),1);
});
test("short title tap still opens creation; long hold still continues a saved game",()=>{
 const h=harness();h.emit(h.title,"pointerdown");h.emit(h.title,"pointerup");a.equal(h.created(),1);
 h.window.SOTA.intro.showTitle();h.emit(h.title,"pointerdown");h.flush(600);h.emit(h.title,"pointerup");a.equal(h.created(),1);a.equal(h.window.SOTA.intro.titleOpen(),false);
});
test("long hold without a save still opens creation, and installed mode keeps existing behavior",()=>{
 const h=harness({save:false});h.emit(h.title,"pointerdown");h.flush(600);h.emit(h.title,"pointerup");a.equal(h.created(),1);
 const installed=harness({standalone:true}),b=buttons(installed);a.equal(b.install.hidden,true);a.equal(b.update.hidden,false);
});
