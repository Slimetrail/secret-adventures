/* Secret of the Adventure - t2103u opening flow, sick-dad / cave / ending staging, worn journal, install + update.
   Overlay only: no story-data.js lines, no batch talks, no music files are changed. Spoken lines stay where they were.
   Local only, offline, no network hosts, no ads. Art comes from art-intro/ once Graphics delivers it (intro-art-data.js). */
(function(){"use strict";
const S=window.SOTA,R=window.RPG,M=window.MAZE;if(!S||!S.rpg||!R)return;
const TITLE="Secret of the Adventure",LONG_MS=600;
const ART=new Set(window.INTRO_ART||[]),has=p=>ART.has(p),A=p=>"art-intro/"+p;
const $=id=>document.getElementById(id);
function el(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
const hero=()=>{const l=S.rpg.live();return l&&l.party&&l.party[0]||null;};
const hasSave=()=>{try{return !!S.rpg.save();}catch(e){return false;}};
// ---------- install app / check for update (behaviour after Plato's helpers; Plato files untouched) ----------
let bip=null,installed=false,upd="idle",ready=false;const ctls=new Set();
const dm=matchMedia("(display-mode: standalone), (display-mode: fullscreen)");
const standalone=()=>installed||dm.matches||navigator.standalone===true;
addEventListener("beforeinstallprompt",e=>{e.preventDefault();bip=e;paint();});
addEventListener("appinstalled",()=>{installed=true;bip=null;paint();});
if(dm.addEventListener)dm.addEventListener("change",paint);
const LAB={idle:"Check for update",checking:"Checking…",current:"You’re up to date",ready:"Update ready — tap to reload",failed:"Try again when you’re online"};
function setUpd(s){upd=s;if(s==="ready")ready=true;paint();if(s==="current")setTimeout(()=>{if(upd==="current"){upd="idle";paint();}},2500);}
function paint(){ctls.forEach(c=>{if(!c.isConnected){ctls.delete(c);return;}
 c.querySelector(".iinst").hidden=standalone();c.querySelector(".iupd").textContent=ready?LAB.ready:LAB[upd];if(standalone())c.querySelector(".ihint").hidden=true;});}
async function install(c){if(bip){const p=bip;bip=null;try{await p.prompt();await p.userChoice;}catch(e){}paint();return;}c.querySelector(".ihint").hidden=false;}
async function check(){if(ready){location.reload();return;}
 const sw=navigator.serviceWorker;if(!navigator.onLine||!sw||location.protocol==="file:"){setUpd("failed");return;}
 setUpd("checking");try{const reg=await sw.getRegistration();if(!reg){setUpd("failed");return;}await reg.update();
  const nw=reg.installing||reg.waiting;if(!nw){setUpd("current");return;}
  const done=()=>{if(nw.state==="activated"||nw.state==="installed")setUpd("ready");else if(nw.state==="redundant")setUpd("failed");};
  nw.addEventListener("statechange",done);done();}catch(e){setUpd("failed");}}
// a new worker that took over on its own (boot.js path) also counts as ready
if(navigator.serviceWorker&&navigator.serviceWorker.controller)navigator.serviceWorker.addEventListener("controllerchange",()=>setUpd("ready"));
function appCtl(where){const c=el("div","iapp");c.dataset.where=where;
 const i=el("button","ink s4b small iinst","Install app");i.type="button";i.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();install(c);});
 const u=el("button","ink s4b small iupd",LAB.idle);u.type="button";u.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();check();});
 const h=el("div","s4note ihint","Tap ⋮ in Chrome, then Add to Home screen / Install app.");h.hidden=true;
 c.append(i,u,h);ctls.add(c);setTimeout(paint,0);return c;}
// ---------- title-only menu ----------
let tt=null,tOpen=false;
function buildTitle(){if(tt)return tt;tt=el("div","ititle");tt.id="ititle";tt.dataset.art=has("menu/title-wall.webp")?"ready":"fallback";
 if(has("menu/title-wall.webp"))tt.style.backgroundImage='url("'+A("menu/title-wall.webp")+'")';
 const h=el("h1","ititle-t");h.id="ititle-t";h.setAttribute("data-text",TITLE);h.textContent=TITLE;tt.appendChild(h);tt.setAttribute("role","button");tt.setAttribute("aria-label",TITLE+". Tap to make a hero. Hold to continue your saved game.");
 const controls=appCtl("title");
 // Native buttons must not start the title tap/hold gesture.
 for(const type of ["pointerdown","pointerup","pointercancel"])controls.addEventListener(type,e=>e.stopPropagation());
 tt.appendChild(controls);
 let t0=0,tm=0,fired=false;
 tt.addEventListener("pointerdown",e=>{e.preventDefault();t0=performance.now();fired=false;clearTimeout(tm);tm=setTimeout(()=>{fired=true;longPress();},LONG_MS);});
 const up=e=>{e.preventDefault();clearTimeout(tm);if(!t0)return;t0=0;if(!fired)shortTap();};
 tt.addEventListener("pointerup",up);tt.addEventListener("pointercancel",()=>{clearTimeout(tm);t0=0;});
 tt.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();});tt.addEventListener("contextmenu",e=>e.preventDefault());
 addEventListener("keydown",e=>{if(tOpen&&!(e.target&&e.target.closest(".iapp"))&&(e.key==="Enter"||e.key===" ")){e.preventDefault();e.stopImmediatePropagation();shortTap();}},true);
 document.body.appendChild(tt);return tt;}
function showTitle(){buildTitle().classList.add("on");tOpen=true;document.documentElement.classList.add("ititle-open");}
function hideTitle(){if(tt)tt.classList.remove("on");tOpen=false;document.documentElement.classList.remove("ititle-open");}
function shortTap(){if(!tOpen)return;hideTitle();S.rpg.creation();}            // opening creation never writes the save; only Confirm does
function longPress(){if(!tOpen)return;if(!hasSave()){shortTap();return;}hideTitle();} // continue the existing save as loaded
window.SOTA_INTRO_BOOT=showTitle;
// ---------- creation / party screen extras ----------
const ov=$("s4");
function decorate(){const k=ov.dataset.kind,w=ov.querySelector(".s4page");if(!w||w.querySelector(".iapp"))return;
 if(k==="create"){const n=el("div","s4note inew",hasSave()?"This starts a new adventure. Your saved game stays until you tap Confirm.":"This starts a new adventure.");n.id="inew";
  const hd=w.querySelector(".s4head");hd.after(n);
  const race=w.querySelector("[data-race].sel"),cls=w.querySelector("[data-cls].sel");if(race&&cls){const im=el("img","icreate-portrait");im.src="art6/fight/p-"+race.dataset.race+"-"+cls.dataset.cls+".png";im.alt=R.RACES[race.dataset.race].name+" "+R.CLASSES[cls.dataset.cls].name;im.dataset.race=race.dataset.race;im.dataset.cls=cls.dataset.cls;n.after(im);}
  if(hasSave()){const b=el("button","ink s4b small","Back to title");b.id="ititleb";b.type="button";b.addEventListener("click",e=>{e.preventDefault();S.rpg.closeUI();showTitle();});n.after(b);}
  const f=w.querySelector(".s4foot");(f||w).appendChild(appCtl("create"));}
 else if(k==="party"){const r=el("div","s4row ijrow");const j=el("button","ink s4b","Journal");j.id="ijournalb";j.type="button";j.addEventListener("click",e=>{e.preventDefault();openJournal();});r.appendChild(j);w.appendChild(r);w.appendChild(appCtl("party"));}}
new MutationObserver(decorate).observe(ov,{childList:true});
// ---------- sick-dad staging (race-only bedside paintings), cave card, endings ----------
const box=()=>$("s6d");
const addC=(e,...c)=>c.forEach(x=>{if(!e.classList.contains(x))e.classList.add(x);}),setD=(e,k,v)=>{if(e.dataset[k]!==v)e.dataset[k]=v;};
function sickArt(){const h=hero();if(!h)return null;const b="sickdad/sickdad-"+h.race+".webp";
 return {b,ready:has(b)};}
function stage(host,cls,bg,left,right){let s=host.querySelector(".ia-stage");if(!s){s=el("div","ia-stage");s.setAttribute("aria-hidden","true");host.prepend(s);}
 const key=[cls,bg,left,right].join("|");if(s.dataset.key===key)return;s.dataset.key=key;s.className="ia-stage "+cls;s.style.backgroundImage=bg?'url("'+A(bg)+'")':"none";s.replaceChildren();
 [["left",left],["right",right]].forEach(([side,src])=>{if(!src)return;const p=el("div","ia-person "+side);const im=el("img");im.alt="";im.src=A(src);p.appendChild(im);s.appendChild(p);});}
function unstage(host){if(host.classList.contains("ia-active"))host.classList.remove("ia-active","ia-end");delete host.dataset.intro;const s=host.querySelector(".ia-stage");if(s)s.remove();const sk=host.querySelector(".iskip");if(sk)sk.remove();const c=host.querySelector(".icred");if(c&&!host.classList.contains("on"))c.remove();}
const END_ART={low:["zone3-05-crystal-cracked-smoke","zone4-05-dark-robes-cracked-crystal"],mid:["zone3-05-crystal-cracked-smoke","zone4-05-dark-robes-cracked-crystal"],high:["zone3-01-crystal-defined-monsters","zone5-01-handshake-crystal","zone5-04-crystal-between-two-figures"]};
const END_MOOD={low:"damaged",mid:"cracked",high:"vibrant"};
function sync(){const b=box();if(!b)return;const on=b.classList.contains("on"),sc=b.dataset.scene;
 if(on&&(sc==="opening"||sc==="ending"))applyMood(b);
 if(on&&sc==="opening"){const a=sickArt();setD(b,"intro","sickdad");setD(b,"artReady",a&&a.ready?"1":"0");
  if(a&&a.ready){addC(b,"ia-active");stage(b,"sickdad",a.b,null,null);}
  if(!b.querySelector(".iskip")){const sk=el("button","iskip","Skip");sk.type="button";sk.addEventListener("pointerup",e=>{e.preventDefault();e.stopPropagation();skipSickDad();});b.appendChild(sk);}
  return;}
 if(on&&sc==="ending"){let k=null;try{k=S.rpg.s6.st().ending;}catch(e){}setD(b,"intro","ending");setD(b,"endMood",END_MOOD[k]||"");setD(b,"crystal",(END_ART[k]||[]).join(","));
  const bg="endings/"+k+"-backdrop.webp";setD(b,"artReady",has(bg)?"1":"0");if(has(bg)){addC(b,"ia-active","ia-end");const cp=endFaces(b);stage(b,"ending",bg,cp[0],cp[1]);}
  const t=b.querySelector(".s6title");if(t&&!b.querySelector(".icred"))credits(b);return;}
 if(b.dataset.intro)unstage(b);}
// ending companion mood faces: only Mira/Sorrel/Brunn files from the pair's line; no hero face (t2118u kit pending)
function endFaces(b){const p=b.dataset.moodPair,i=+b.dataset.moodIndex;if(!p||p==="Intro"||isNaN(i))return [null,null];
 const f=["mira","sorrel","brunn"].map(c=>"moods/"+p+"/l"+(i+1)+"-"+c+".webp").filter(has);return [f[0]||null,f[1]||null];}
function credits(b){const c=el("div","icred");c.id="icred";c.appendChild(el("div","icred-h","Credits"));c.appendChild(el("div","icred-t",TITLE));c.appendChild(el("div","icred-l","Thank you for playing."));c.appendChild(el("div","icred-l","A Slimetrail production"));
 const t=b.querySelector(".s6t");t.appendChild(c);}
new MutationObserver(ms=>{if(ms.some(m=>m.target.id==="s6d"||m.target.classList&&m.target.classList.contains("s6more")||[...m.addedNodes].some(n=>n.id==="s6d"||n.classList&&n.classList.contains("s6title"))))sync();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","data-scene","data-line","data-ending"]});
function skipSickDad(){try{if(S.rpg&&S.rpg.s6&&S.rpg.s6.skipOpening)S.rpg.s6.skipOpening();}catch(e){}
 try{const l=S.rpg.s6.line();if(l&&l.kind==="opening")return;}catch(e){}
 showCave();}
// t2255u: hero at the cave first, then a two-second stand before the title.
// No existing stealing-equipment dialogue was supplied; do not invent any.
let cv=null,cOpen=false,cTitleTimer=0,cDialogWatch=0;
function caveDialog(){try{return !!(S && S.rpg && S.rpg.s6 && S.rpg.s6.line && S.rpg.s6.line());}catch(e){return false;}}
function showCave(){clearTimeout(cTitleTimer);clearInterval(cDialogWatch);cTitleTimer=0;cDialogWatch=0;const h=hero();if(!h)return;if(!cv){cv=el("div","icave");cv.id="icave";cv.innerHTML='<div class="icave-bg"></div><div class="icave-title"></div><img class="icave-hero" alt=""><div class="icave-tap">Tap to begin</div>';
  cv.addEventListener("pointerup",e=>{e.preventDefault();e.stopPropagation();hideCave();});cv.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();});document.body.appendChild(cv);}
 const back="cave/back-"+h.race+"-"+h.cls+".webp",ok=has(back)&&has("cave/backdrop.webp")&&has("cave/title.webp");
 cv.dataset.artReady=ok?"1":"0";cv.dataset.hero=h.race+"-"+h.cls;
 cv.querySelector(".icave-bg").style.backgroundImage="none";
 clearTimeout(cTitleTimer);cv.dataset.titleShown="0";
 const ti=cv.querySelector(".icave-title"),tap=cv.querySelector(".icave-tap");ti.replaceChildren();ti.hidden=true;tap.hidden=true;
 const hi=cv.querySelector(".icave-hero");if(has(back)){hi.src=A(back);hi.style.display="";}else{hi.removeAttribute("src");hi.style.display="none";}
 cv.classList.add("on");cOpen=true;document.documentElement.classList.add("icave-open");
 const watch=()=>{if(!cOpen)return;
  if(caveDialog()){clearTimeout(cTitleTimer);cTitleTimer=0;return;}
  if(cTitleTimer)return;
  cTitleTimer=setTimeout(()=>{cTitleTimer=0;if(!cOpen||caveDialog())return;
  if(has("cave/title.webp")){const im=el("img");im.alt=TITLE;im.src=A("cave/title.webp");ti.appendChild(im);}else ti.appendChild(el("span","icave-tt",TITLE));
  ti.hidden=false;tap.hidden=false;cv.dataset.titleShown="1";cTitleTimer=0;
  clearInterval(cDialogWatch);cDialogWatch=0;
 },2000);};
 watch();cDialogWatch=setInterval(watch,25);}
function hideCave(){if(!cv||cv.dataset.titleShown!=="1")return;clearTimeout(cTitleTimer);clearInterval(cDialogWatch);cTitleTimer=0;cDialogWatch=0;cv.classList.remove("on");cOpen=false;document.documentElement.classList.remove("icave-open");}
const H=window.S6H;if(H&&H.created){const orig=H.created;H.created=function(){const r=orig.apply(this,arguments);
 const iv=setInterval(()=>{let l=null;try{l=S.rpg.s6.line();}catch(e){}if(l&&l.kind==="opening")return;clearInterval(iv);showCave();},150);return r;};}
// ---------- Eve-approved t2103u text: wall-art edge notes, key moments, moods (t2103u-text.js) ----------
const TX=window.T2103U_TEXT||{intro:[],endings:{},wall:{},journal:{}};
const s6=()=>{try{return S.rpg.s6.st();}catch(e){return null;}};
function wallNote(file){return TX.wall[file.slice(0,8)]||"";}
function letterVar(){let r="warning";try{r=S.rpg.s6.letterReading();}catch(e){}return {warning:"A",half:"B",apology:"C"}[r]||"A";}
function zonesFound(){const s=s6(),ra=S.rpg.s6.roomArt(),z={};if(s)Object.keys(s.walls).forEach(id=>{const a=ra[id];if(a)z[a[1].slice(0,8)]=1;});return z;}
// unlock order follows the beats. t2194u: J-join-mira/sorrel/brunn and J-picnic-reveal are replaced by the approved camp pages
// written by story-journal-split.js (picnic from walls[80], Brunn A/B frozen once from brunnJoin); they are listed after these, never stacked.
function keyMoments(){const s=s6(),l=S.rpg.live();if(!s||!l)return [];const J=TX.journal,out=[],add=k=>{if(J[k])out.push([k,J[k]]);},f=zonesFound(),has=re=>Object.keys(f).some(k=>re.test(k));
 if(s.seen.opening){add("J-leave-home");if((l.steps|0)>0)add("J-worry-dad");}
 if(has(/^zone1-0[1-3]/))add("J-walls-zone1");if(has(/^zone2-0[1-4]/))add("J-walls-zone2");if(has(/^zone3-0[1-5]/))add("J-walls-zone3");
 if(s.seen["batch1-C5"])add("J-companions-complain");
 if(has(/^zone4-0[1-7]/))add("J-walls-zone4");if(has(/^zone5-0[1-79]/))add("J-walls-zone5");
 if(s.seen.boss)add("J-letter#"+letterVar());
 if(s.ending==="low")add("J-ending-death#"+(s.revealed?"B":"A"));else if(s.ending==="mid")add("J-ending-cracked#"+(s.revealed?"B":"A"));else if(s.ending==="high")add("J-ending-full-fix");
 const js=s.journalSplit;if(js&&Array.isArray(js.pages))js.pages.forEach((p,i)=>{if(p&&p.text)out.push([p.id||("gen-"+(p.key||p.kind)+"-"+i),p.text,p.kind,p.key]);});
 return out;}
// mood lookup: intro by line index; endings by exact spoken text (picnic reveal pairs are not in the sheet, so never mooded)
const END_BY_TEXT={};Object.keys(TX.endings).forEach(p=>TX.endings[p].forEach((m,i)=>{(END_BY_TEXT[m.text]||(END_BY_TEXT[m.text]=[])).push({pair:p,i});}));
function moodFor(scene,i,text){if(scene==="opening"){const m=TX.intro[i];return m&&m.text===text?{pair:"Intro",i,m}:null;}
 if(scene==="ending"){const h=END_BY_TEXT[text];if(!h)return null;const x=h[0];return {pair:x.pair,i:x.i,m:TX.endings[x.pair][x.i]};}return null;}
function applyMood(b){const sc=b.dataset.scene,i=+b.dataset.line;let text=null;try{const L=S.rpg.s6.line();if(L&&L.kind===sc&&L.i===i)text=b.querySelector(".s6more.on")?b.querySelector(".s6t").textContent:null;}catch(e){}
 if(text==null){if(b.dataset.moodLine!==String(i)){delete b.dataset.moodPair;}return;}const r=moodFor(sc,i,text);
 b.dataset.moodLine=i;if(r){b.dataset.moodPair=r.pair;b.dataset.moodIndex=r.i;b.dataset.moodFace=r.m.face;b.dataset.moodListen=r.m.listen[1];}else{delete b.dataset.moodPair;delete b.dataset.moodFace;delete b.dataset.moodListen;}}
// ---------- journal: worn book and settings ----------
const TABS=[["inventory","Inventory"],["beasts","Beasts"],["map","Map"],["art","Found art"],["journal","Journal"],["recipes","Recipes"],["settings","Settings"]];
function wear(){const s=s6();if(!s)return 1;const old=s.seen.join3?4:s.seen.join1?3:1;return Math.max(s.journalWear||1,old);}
let jb=null,jTab=null,jBeast=null,jOpenSec=false;
function openJournal(tab){const l=S.rpg.live();if(!l)return;if(tab&&tab!=="beasts")jBeast=null;if(!jb){jb=el("div","ijour");jb.id="ijour";document.body.appendChild(jb);}
 if(tab){jTab=tab;jOpenSec=true;}
 const w=wear(),bk="journal/book-"+(jOpenSec?"open-zone":"zone")+w+".webp";jb.dataset.wear=w;jb.dataset.artReady=has(bk)?"1":"0";jb.dataset.open=jOpenSec?"1":"0";jb.style.setProperty("--book",has(bk)?'url("'+A(bk)+'")':"none");
 jb.innerHTML="";const book=el("div","ijbook ijwear"+w+(jOpenSec?" ijopen":""));const tabs=el("div","ijtabs");
 // Pixel boxes in the 1024x1536 artwork: x=780, y=334+i*122, w=208, h=108.
 TABS.forEach(([k,n],i)=>{const t=el("button","ijtab"+(jOpenSec&&k===jTab?" sel":""),n);t.type="button";t.dataset.tab=k;t.title=n;t.style.left=(780/1024*100)+"%";t.style.top=((334+i*122)/1536*100)+"%";t.style.width=(208/1024*100)+"%";t.style.height=(108/1536*100)+"%";t.addEventListener("click",e=>{e.preventDefault();if(k==="beasts")jBeast=null;openJournal(k);});tabs.appendChild(t);});
 book.appendChild(tabs);
 if(jOpenSec){const pg=el("div","ijpage");pg.dataset.tab=jTab;page(pg,l);book.appendChild(pg);}
 const x=el("button","ink s4b small ijclose","Close");x.type="button";x.addEventListener("click",e=>{e.preventDefault();closeJournal();});
 jb.append(x,book,appCtl("journal"));jb.classList.add("on");document.documentElement.classList.add("ijour-open");}
function closeJournal(){jBeast=null;jTab=null;jOpenSec=false;if(jb){jb.classList.remove("on");jb.innerHTML="";}document.documentElement.classList.remove("ijour-open");}
function itemName(id){return R.ITEMS[id]?R.ITEMS[id].n:id;}
// Approved zone 1/2 pencil sketches only; later generated pages remain text-only.
const JOURNAL_MONSTERS={"cap:1":[["Rat","z1-rat"],["Slime","z1-slime"],["Big bug","z1-bigbug"],["Cave bat","z1-bat"],["Giant spider","z1-spider"],["Mud toad","z1-toad"],["Fungus creeper","z1-fungus"]],"cap:2":[["Goblin","z2-goblin"],["Orc","z2-orc"],["Fairy","z2-fairy"],["Kobold","z2-kobold"],["Wild boar","z2-boar"],["Pixie swarm","z2-pixies"],["Hobgoblin brute","z2-hobgoblin"]]};
function beastNote(name){const G=window.StoryJournalGenerator,f=G&&G.MONSTER_FACTS;if(!f)return null;return (f[1]||[]).concat(f[2]||[]).find(m=>m[0]===name)||null;}
function monsterSketches(entry,kind,key){if(kind!=="monster-drawings")return;const g=el("div","ijart ijmonsters");
 (JOURNAL_MONSTERS[key]||[]).forEach(([name,file])=>{const path="journal/monsters/"+file+".webp";if(!has(path))return;const f=el("figure","ijfig"),im=el("img");im.alt=name;im.src=A(path);im.loading="lazy";f.appendChild(im);g.appendChild(f);});if(g.children.length)entry.appendChild(g);}
function page(pg,l){const t=jTab,E=window.ECON;
 if(t==="inventory"){pg.appendChild(el("h3",null,"Inventory"));l.party.forEach((c,i)=>{pg.appendChild(el("div","ijl",c.name+": "+(c.bag.length?c.bag.map(itemName).join(", "):"(empty)")));
  const eq=c.equip||{};const v=Object.keys(eq).filter(k=>eq[k]).map(k=>k+": "+itemName(eq[k]));pg.appendChild(el("div","ijl",c.name+" — "+(v.join(" · ")||"nothing equipped")));});
  pg.appendChild(el("div","ijl","Gold: "+l.gold));pg.appendChild(go("Open backpack",()=>{closeJournal();S.rpg.bagScreen(0);}));pg.appendChild(go("Open equipment",()=>{closeJournal();S.rpg.equipScreen(0);}));}
 else if(t==="map"){pg.appendChild(el("h3",null,"Map"));pg.appendChild(go("Open the map",()=>{closeJournal();S.rpg.closeUI();const b=$("mapb");if(b)b.click();}));}
 else if(t==="art"){pg.appendChild(el("h3",null,"Found art"));let s=null;try{s=S.rpg.s6.st();}catch(e){}const ra=S.rpg.s6.roomArt(),ids=s?(s.order||Object.keys(s.walls)).filter(id=>ra[id]):[];
  if(!ids.length)pg.appendChild(el("div","ijl dim","No wall art found yet."));const g=el("div","ijart");
  ids.forEach(id=>{const f=el("figure","ijfig");f.dataset.room=id;const im=el("img");im.alt="";im.src="art6/"+ra[id][1]+".webp";const n=el("figcaption","ijnote ijhw",wallNote(ra[id][1]));f.append(im,n);g.appendChild(f);});
  if(s&&s.seen&&s.seen.boss){const v=letterVar(),f=el("figure","ijfig");f.dataset.room="letter";f.dataset.variant=v;const im=el("img");im.alt="";im.src="art6/letter-note-before-you-enter.webp";f.append(im,el("figcaption","ijnote ijhw",TX.wall["letter-note-before-you-enter#"+v]||""));g.appendChild(f);}pg.appendChild(g);}
 else if(t==="journal"){pg.appendChild(el("h3",null,"Journal"));const h=el("div","ijhand");const es=keyMoments();if(!es.length)h.appendChild(el("div","ijl dim","(nothing written yet)"));es.forEach(([k,t,kind,key])=>{const e=el("div","ijentry ijhw",t);e.dataset.entry=k;monsterSketches(e,kind,key);h.appendChild(e);});pg.appendChild(h);}
 else if(t==="beasts"){pg.appendChild(el("h3",null,"Beasts"));const found=new Set(l.beasts||[]);const all=[].concat(JOURNAL_MONSTERS["cap:1"],JOURNAL_MONSTERS["cap:2"]).filter(([,file])=>found.has(file));
  const pick=(typeof jBeast==="string"&&found.has(jBeast))?all.find(([,file])=>file===jBeast):null,fact=pick&&beastNote(pick[0]);
  if(pick&&fact){const path="journal/monsters/"+pick[1]+".webp",box=el("div","ijbeast");box.dataset.beastDetail=pick[1];
   if(has(path)){const f=el("figure","ijfig ijbeast-lg"),im=el("img");im.alt=pick[0];im.src=A(path);f.appendChild(im);box.appendChild(f);}
   box.appendChild(el("div","ijl ijhw",fact[0]));box.appendChild(el("div","ijl ijhw",window.StoryJournalGenerator.caption(fact)));
   pg.appendChild(box);}
  else {if(!all.length)pg.appendChild(el("div","ijl dim","No beasts found yet."));const g=el("div","ijart ijmonsters");
  all.forEach(([name,file])=>{const path="journal/monsters/"+file+".webp";if(!has(path))return;const f=el("figure","ijfig"),im=el("img");im.alt=name;im.src=A(path);im.loading="lazy";f.dataset.beast=file;f.appendChild(im);if(f.addEventListener)f.addEventListener("click",e=>{e.preventDefault();jBeast=file;openJournal("beasts");});g.appendChild(f);});if(g.children.length)pg.appendChild(g);}}
 else if(t==="recipes"){pg.appendChild(el("h3",null,"Recipes"));const k=E?E.DISHES.filter(d=>l.recipes&&l.recipes[d.id]):[];pg.appendChild(el("div","ijl",k.length+" of "+(E?E.DISHES.length:20)+" recipes known"));
  k.forEach(d=>pg.appendChild(el("div","ijl","• "+d.n)));pg.appendChild(go("Open cooking guide",()=>{closeJournal();S.rpg.s5.cookbook();}));
  // t2342u/t2345u: crafting recipes learned at camp
  const cr=E&&E.CRAFTS?E.CRAFTS.filter(c=>l.crafts&&l.crafts[c.id]):[];const ch=el("h3",null,"Crafting");ch.dataset.crafts=cr.length;pg.appendChild(ch);pg.appendChild(el("div","ijl",cr.length+" of "+(E&&E.CRAFTS?E.CRAFTS.length:5)+" crafts known"));
  cr.forEach(c=>{const d=el("div","ijl","• "+c.n+": "+S.rpg.s5.craftNeedText(c));d.dataset.craft=c.id;pg.appendChild(d);});
  // t2345u: mixes that gave nothing, so they are not tried again
  const fl=Object.entries(l.failedMixes||{});const fh=el("h3",null,"Failed recipes");fh.dataset.failed=fl.length;pg.appendChild(fh);
  if(!fl.length)pg.appendChild(el("div","ijl dim","No failed mixes yet."));fl.forEach(([k,ids])=>{const d=el("div","ijl","✗ "+S.rpg.s5.craftIdsText(ids));d.dataset.failmix=k;pg.appendChild(d);});}
 else if(t==="settings"){pg.appendChild(el("h3",null,"Settings"));pg.appendChild(el("div","ijl","Sound / volume"));
 const sound=go(S.music&&S.music.isMuted&&S.music.isMuted()?"Sound: Off":"Sound: On",()=>{if(S.music){S.music.setMuted(!(S.music.isMuted&&S.music.isMuted()));openJournal("settings");}});sound.dataset.setting="volume";pg.appendChild(sound);
 const load=go("Load a different save",()=>{closeJournal();S.rpg.savePicker("load",null,()=>{S.rpg.closeUI();openJournal("settings");});});load.dataset.setting="load";pg.appendChild(load);
 const menu=go("Return to main menu",()=>{closeJournal();S.rpg.closeUI();showTitle();});menu.dataset.setting="menu";pg.appendChild(menu);}}
function go(n,f){const b=el("button","ink s4b small",n);b.type="button";b.addEventListener("click",e=>{e.preventDefault();f();});return b;}
S.intro={TITLE,titleOpen:()=>tOpen,caveOpen:()=>cOpen,showTitle,hideTitle,shortTap,longPress,showCave,hideCave,openJournal,closeJournal,keyMoments,wallNote,letterVar,moodFor,journalOpen:()=>!!(jb&&jb.classList.contains("on")),TABS:TABS.map(t=>t[1]),wear,art:()=>[...ART],sickArt,check,install,state:()=>({upd,ready,standalone:standalone(),bip:!!bip}),LONG_MS};
const css=el("style");css.textContent=`
.ititle{display:none;position:fixed;inset:0;z-index:99990;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none;
 background-color:#1d1820;background-size:cover;background-position:center;
 background-image:linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.6)),repeating-linear-gradient(0deg,#0d0a10 0 4px,transparent 4px 64px),repeating-linear-gradient(90deg,#0d0a10 0 4px,transparent 4px 96px),linear-gradient(#3a3340,#231e28)}
.ititle.on{display:flex}
.ititle > .iapp{position:absolute;z-index:2;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom));margin:0;padding:10px;box-sizing:border-box;max-height:calc(100% - 24px);overflow-y:auto;border-radius:10px;background:rgba(12,8,18,.92);touch-action:manipulation}
.ititle > .iapp .s4b{min-height:44px;min-width:44px;flex:1 1 130px;white-space:normal}
.ititle[data-art=ready]{background-color:#000;background-size:cover}.ititle[data-art=ready] .ititle-t{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);margin:0}
.ititle-t{margin:0 6vw;text-align:center;font:900 clamp(40px,13vw,92px)/1.02 Georgia,"Times New Roman",serif;letter-spacing:.02em;
 background:linear-gradient(180deg,#fff2a8 0%,#ffb627 30%,#ff4f6d 58%,#a64dff 82%,#3fd2ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
 filter:drop-shadow(4px 6px 0 rgba(0,0,0,.85)) drop-shadow(0 0 18px rgba(255,120,60,.45));pointer-events:none}
html.ititle-open #dvbtn{visibility:hidden}
.icreate-portrait{display:block;max-width:45%;height:180px;object-fit:contain;margin:8px auto}
.iapp{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:6px}.iapp .ihint{flex-basis:100%;text-align:center}
.icave{display:none;position:fixed;inset:0;z-index:99980;background:radial-gradient(ellipse at 50% 70%,#050307 0 22%,#1c1622 46%,#0a080c 80%);touch-action:none}
.icave.on{display:block}.icave-bg{position:absolute;inset:0;background-size:cover;background-position:center}
.icave-title{position:absolute;left:0;right:0;top:calc(9vh + env(safe-area-inset-top));text-align:center;z-index:2}.icave-title img{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.icave-tt{font:700 clamp(34px,10vw,72px)/1.05 "Luminari","Papyrus","Uncial Antiqua",Georgia,serif;color:#f6dc8a;text-shadow:0 3px 0 #3a1c06,0 0 18px rgba(255,180,80,.6)}
.icave-hero{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:1}
.icave-tap{position:absolute;left:0;right:0;bottom:calc(2vh + env(safe-area-inset-bottom));text-align:center;color:#d8c8a0;font:15px Georgia,serif;opacity:.7}
.ia-stage{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:#100c17 center/cover no-repeat}
.ia-stage.sickdad{background-size:contain;background-color:#100c17}
.iskip{position:absolute;z-index:6;top:calc(8px + env(safe-area-inset-top, 0px));left:calc(8px + env(safe-area-inset-left, 0px));padding:3px 7px;border:1px solid #d8c8a0;border-radius:6px;background:rgba(16,12,23,.72);color:#efe0b8;font:700 11px Georgia,serif;letter-spacing:.02em;pointer-events:auto}
.ia-stage:after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 55%,rgba(8,5,14,.5))}
.ia-person{position:absolute;bottom:15%;height:min(72vh,110vw);width:55vw;z-index:1;filter:drop-shadow(0 5px 8px #100b18)}.ia-person.left{left:-4%}.ia-person.right{right:-4%}
.ia-person img{width:100%;height:100%;object-fit:contain;object-position:bottom}
.ia-active .s6pf{display:none!important}.ia-active .s6bg,.ia-active .s6wall{visibility:hidden!important}.ia-active .s6box{z-index:3;left:5%;right:5%;bottom:5%}
.icred{margin-top:10px;text-align:center;font:15px Georgia,serif;color:#efe0b8}.icred-h{font:700 16px Georgia,serif;color:#ffe3a0}.icred-t{font:700 18px Georgia,serif;margin:4px 0}
#s6d[data-end-mood=vibrant] .s6t{border-color:#7fe0ff}#s6d[data-end-mood=cracked] .s6t{border-color:#c04a6a}#s6d[data-end-mood=damaged] .s6t{border-color:#6a5a70}
.ijour{display:none;position:fixed;inset:0;z-index:96;background:rgba(8,5,14,.9);overflow-y:auto;touch-action:pan-y;padding:calc(10px + env(safe-area-inset-top)) 10px 16px 10px;box-sizing:border-box;font:16px Georgia,serif;color:#2b1a0e}
.ijour.on{display:block}.ijclose{position:sticky;top:0;float:left;z-index:2}
.ijbook{position:relative;margin:12px auto 8px;width:100%;max-width:540px;aspect-ratio:2/3;padding:0;background:var(--book) center/100% 100% no-repeat}
.ijbook.ijwear2{filter:saturate(.92)}.ijbook.ijwear3{filter:saturate(.85) contrast(1.05)}.ijbook.ijwear4{filter:saturate(.78) contrast(1.08)}.ijbook.ijwear5{filter:saturate(.7) contrast(1.12)}
.ijour[data-art-ready="1"] .ijbook{filter:none}
.ijtabs{position:absolute;inset:0;z-index:3;pointer-events:none}.ijtab{position:absolute;pointer-events:auto;margin:0;padding:0;border:0;border-radius:0;background:transparent;color:transparent;font:inherit;cursor:pointer}.ijtab.sel{background:rgba(255,226,150,.14);box-shadow:inset 0 0 0 1px rgba(93,56,18,.35)}.ijtab:focus-visible{outline:2px solid #6c3b12;outline-offset:-3px}
.ijpage{position:absolute;left:20.2%;top:18%;width:52.3%;height:61%;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;padding:6px;background:transparent;border:0;color:#2b1a0e}.ijpage h3{margin:0 0 8px;font:700 20px Georgia,serif}
.ijl{margin:4px 0;line-height:1.3}.ijart{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.ijfig{margin:0;padding:6px;border:1px dashed #8a6a3a}.ijfig img{width:100%;display:block}.ijnote{min-height:1.2em}
.ijhw{font-family:"Segoe Print","Bradley Hand","Comic Sans MS","Chalkboard SE",cursive;white-space:pre-line;color:#2a2350;transform:rotate(-.6deg);line-height:1.35}
.ijentry{margin:0 0 16px;font-size:16px}.ijentry:nth-child(even){transform:rotate(.5deg)}.ijnote{font-size:13px;margin-top:4px}
.ijhand{min-height:40vh;background:repeating-linear-gradient(transparent 0 27px,rgba(80,60,120,.25) 27px 28px)}.ijbeast{margin:0}.ijbeast-lg{display:block}.ijbeast-lg img{width:100%;display:block}
.ijour .iapp{max-width:540px;margin:6px auto}
`;document.head.appendChild(css);
})();
