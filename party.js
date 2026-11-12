/* Secret of the Adventure - Stage 4: hero creation, party screen, equip, backpack, turn-based fights, camp/tavern saves, death restore.
   Private build. No ads, no network. Art drawn in code (canvas). Uses window.RPG (rules.js). */
(function(){
"use strict";
const R=window.RPG,S=window.SOTA,M=window.MAZE,C=S.core,N=M.n;
const SAVE="sota.party",DEV_NOFIGHT="sota.dev.nofight";
// Stage 6 story hooks: story.js fills window.S6H; off in maze-only test mode (dev.nofight)
function h6(k,a,b){try{const H=window.S6H;if(!H||!H[k]||localStorage.getItem(DEV_NOFIGHT)==="1"||localStorage.getItem("sota.dev.nostory")==="1")return undefined;return H[k](a,b);}catch(e){console.error(e);return undefined;}}
const displayText=t=>window.CompanionDisplay?window.CompanionDisplay.rewrite(t,live):t;
const $=id=>document.getElementById(id),el=(t,c,txt)=>{const e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=displayText(txt);return e;};
const clone=o=>JSON.parse(JSON.stringify(o));
function tapBtn(label,fn,cls){const b=el("button","ink s4b"+(cls?" "+cls:""),label);b.addEventListener("click",e=>{e.preventDefault();fn();});return b;}
// ---------- state ----------
// live: what you have now. save: the active slot snapshot used for death restore.
let save=null,live=null,ui=null,stepsSince=99,fightNo=0,roll=null;
// t2670u/t2675u: per-save dialogue value (separate from the combat seed). New game = fresh value; old saves get one once on load, then saved.
function freshVseed(){try{const a=new Uint32Array(1);(window.crypto||{}).getRandomValues(a);if(a[0])return a[0];}catch(e){}return ((Math.random()*4294967295)>>>0)||1;}
function ensureVseed(){if(!live||(live.vseed>>>0))return false;live.vseed=freshVseed();if(!live.vpools||typeof live.vpools!=="object")live.vpools={};if(!live.vpick||typeof live.vpick!=="object")live.vpick={};
 if(save&&!(save.vseed>>>0)){save.vseed=live.vseed;save.vpools=save.vpools||{};save.vpick=save.vpick||{};try{localStorage.setItem(SLOT+activeSlot,JSON.stringify(save));if(Number(localStorage.getItem(ACTIVE)||0)===activeSlot)localStorage.setItem(SAVE,JSON.stringify(save));}catch(e){}}return true;}
function validSave(o){try{return o&&o.v===1&&Array.isArray(o.party)&&o.party.length>=1&&o.party.length<=4&&o.party.every(c=>R.allowed(c.race,c.cls)&&c.lvl>=1&&c.lvl<=R.CAP)&&R.DIFF[o.diff]&&o.at&&o.at.x>=0&&o.at.x<N&&o.at.y>=0&&o.at.y<N&&o.rooms&&Array.isArray(o.rooms.s)&&Array.isArray(o.rooms.c);}catch(e){return false;}}
// Four independent saves; active points at the last written/loaded slot. SAVE mirrors it for older builds.
const SLOT=SAVE+".slot",ACTIVE=SAVE+".active";
let activeSlot=0;
function readSave(key){try{const o=JSON.parse(localStorage.getItem(key)||"null");return validSave(o)?o:null;}catch(e){return null;}}
function saveSlots(){const slots=Array.from({length:4},(_,i)=>readSave(SLOT+i));
 if(!slots.some(Boolean)){const old=readSave(SAVE);if(old){slots[0]=old;try{localStorage.setItem(SLOT+0,JSON.stringify(old));}catch(e){}}}return slots;}
{const slots=saveSlots();let i=0;try{i=Number(localStorage.getItem(ACTIVE)||0);}catch(e){}
 activeSlot=Number.isInteger(i)&&i>=0&&i<4&&slots[i]?i:Math.max(0,slots.findIndex(Boolean));
 if(slots[activeSlot]){save=slots[activeSlot];live=clone(save);live.party.forEach(R.clampPoints);/* t2358u/t2360u old saves */wakeLoaded();migrateMealBuffs(live);/* t2778u */migrateSaltsBoxes(live);ensureVseed();}}
function hpMul(){return R.DIFF[live.diff].hp;}
function roomsNow(){const s=[],c=[];for(let i=0;i<C.solvedR.length;i++){if(C.solvedR[i])s.push(i);if(C.clearedR[i])c.push(i);}return {s,c};}
function placeName(x,y){const t=tavIdx(x,y);if(t>=0)return "Tavern "+(t+1);const k=M.camps.findIndex(c=>c[0]===x&&c[1]===y);return k>=0?"Camp "+(k+1):"the start";}
// make a save. Only allowed at a camp or tavern (or once, at the very start when the hero is made).
let tentUndo=null;
function doSave(start,slot=activeSlot){if(!Number.isInteger(slot)||slot<0||slot>3)return false;tentUndo=null;const p=S.state(),endOk=!start&&endSaveMode&&endSaveDue();/* t2721u fix1: the end-of-game save */if(!start&&!endOk&&!R.isSavePoint(M,p.x,p.y)&&tavIdx(p.x,p.y)<0)return false;/* t2528u: both cells in front of a seam archway save as that tavern */
 if(!start&&!endOk&&tavIdx(p.x,p.y)<0){s5init();const same=save&&save.at&&save.at.x===p.x&&save.at.y===p.y;if(!same&&!hasTent())return false;/* t2356u: re-saving where the tent is already pitched uses no tent */if(!same){tentUndo={wear:live.tentWear,bags:live.party.map(c=>c.bag.slice())};live.tentWear++;if(live.tentWear>=E.TENT.nights){takeOne("tent");live.tentWear=0;}}}
 // Camp scene gates observe arrival injuries; seen flags enter this save. Saving never rests.
 if(!start&&!endOk&&tavIdx(p.x,p.y)<0)h6("camp",M.camps.findIndex(c=>c[0]===p.x&&c[1]===p.y));
 syncMazeSlots();live.at={x:p.x,y:p.y,f:p.f,name:start?"the start":endOk?"the centre door":placeName(p.x,p.y)};live.rooms=roomsNow();if(S.mazeSnap)live.maze=S.mazeSnap();if(!Array.isArray(live.beasts))live.beasts=[];live.hpv=1;/* t2442u: save made with exact-HP loading */const next=clone(live);
 try{localStorage.setItem(SLOT+slot,JSON.stringify(next));localStorage.setItem(ACTIVE,String(slot));localStorage.setItem(SAVE,JSON.stringify(next));}catch(e){/* t2451u all-or-nothing: a failed write uses no tent */if(tentUndo){live.tentWear=tentUndo.wear;live.party.forEach((c,j)=>{if(tentUndo.bags[j])c.bag=tentUndo.bags[j];});}tentUndo=null;toast("Could not save. Storage may be full.");return false;}
 tentUndo=null;activeSlot=slot;save=next;return true;}
function loadSlot(slot){const o=saveSlots()[slot];if(!o)return false;
 try{localStorage.setItem(ACTIVE,String(slot));localStorage.setItem(SAVE,JSON.stringify(o));}catch(e){toast("Could not load save.");return false;}
 activeSlot=slot;save=clone(o);closeUI();restore();if(S.armMazeQuiet)S.armMazeQuiet();return true;}
/* t2721u fix1 (QA on 07111bc): the Golem win and the ending were only in the live game, so a reload lost them. After the ending's
   credits close ("Back to the maze") the normal save picker opens once; this end-of-game save is allowed at the centre door and uses
   no tent (it is not a camp). Declining keeps playing; the centre door replays the ending and offers the save again. Camps still never
   auto-save (t2446u). */
let endSaveMode=false,endSeen=false;
function endSaveDue(){const s=live&&live.story;if(!s||s.golemDefeated!==true||!s.ending)return false;const v=save&&save.story;return !(v&&v.golemDefeated===true&&v.ending===s.ending);}
/* t2730u fix2: after the ending and credits the game goes to the main menu (title). The end-of-game save picker comes first when the
   win/ending is not saved yet; saving or Back both go on to the title. Back writes nothing: the title's Continue resumes this game as it
   is in memory (as "Return to main menu" does), a reload continues the last save, and the centre door replays the ending and offers the
   save again. */
function toTitle(){closeUI();if(S.intro&&S.intro.showTitle)S.intro.showTitle();}
function offerEndSave(){if(ui!==null||(S.storyOpen&&S.storyOpen()))return false;if(!endSaveDue()){toTitle();return false;}endSaveMode=true;
 savePicker("save",()=>{endSaveMode=false;toTitle();},()=>{endSaveMode=false;toTitle();},null,{title:"End of game save",note:"Save your win and your ending, or tap Back to go to the main menu without saving."});return true;}
/* t2721u fix1: solved final locks are kept in the last save when the door opens, so a lost Golem fight or a reload does not ask for
   all three locks again (same in-place save patch as ensureVseed). Nothing else in the save changes. */
function keepFinalLocks(){const ls=live&&live.story;if(!save||!ls)return;const k=["finalLock","finalLock2","finalLock3"].filter(x=>ls[x]===true);if(!k.length)return;
 if(!save.story||typeof save.story!=="object")save.story={v:1};k.forEach(x=>{save.story[x]=true;});
 try{localStorage.setItem(SLOT+activeSlot,JSON.stringify(save));if(Number(localStorage.getItem(ACTIVE)||0)===activeSlot)localStorage.setItem(SAVE,JSON.stringify(save));}catch(e){}}
/* t2721u fix1/fix2: only the Zone 5 side of Tavern 4 (the 4-5 seam cell, 46,48) gets its own wording; every zone 1-4 seam keeps the save's
   own name exactly as live ("Tavern 1" etc.). The slot list shows that one spot as "Tavern 4 (Zone 5 side)"; it is worked out from the
   saved cell, so old saves need no change. */
function z5Side(at){if(!at)return false;const t=tavIdx(at.x,at.y),c=t===3?M.taverns[3]:null;return !!(c&&!(c[0]===at.x&&c[1]===at.y)&&+M.zone[at.y*N+at.x]===5);}
function spotName(at){if(!at)return "?";return z5Side(at)?"the Zone 5 side of Tavern 4":at.name;}
function slotName(at){if(!at)return "?";return z5Side(at)?"Tavern 4 (Zone 5 side)":(at.name||placeName(at.x,at.y));}
/* t2731u fix2: every lost fight (one shared path: endFight) goes straight to the Load screen, the same slot list as the title's Load Game.
   Loading a slot plays on from it. Back loads the last save (as "Return to last save" did) and opens the main menu, so nothing is stuck.
   Solved final locks carry over when the loaded save is the same adventure (same seed); they are kept in that save (keepFinalLocks). */
function lossLoad(){const ls=live&&live.story,seed=live?live.seed:null,locks=ls?["finalLock","finalLock2","finalLock3"].filter(x=>ls[x]===true):[];F=null;
 const carry=()=>{if(locks.length&&live&&live.seed===seed){if(!live.story||typeof live.story!=="object")live.story={v:1};locks.forEach(x=>{live.story[x]=true;});keepFinalLocks();}};
 savePicker("load",()=>{carry();toast("Back at "+spotName(save.at));},()=>{if(save){restore();carry();}toTitle();},null,{title:"Load a save",kind:"loss",note:"Everyone is knocked out. Pick a save to load. Back loads your last save and opens the main menu."});
 ov.dataset.result="lose";return true;}
function savePicker(mode,done,cancel,before,opt){const w=page("save-picker");w.appendChild(head(opt&&opt.title?opt.title:mode==="load"?"Load a save":"Choose a save slot",cancel||closeUI));
 if(opt&&opt.title)w.dataset.pick=opt.kind||"end";if(opt&&opt.note){const n=el("div","s4note",opt.note);n.id="s4picknote";w.appendChild(n);}
 const slots=saveSlots();slots.forEach((o,i)=>{const b=tapBtn("Slot "+(i+1)+" · "+(o?(o.party[0].name+" · "+slotName(o.at)):"Empty"),()=>{
  if(mode==="load"){if(loadSlot(i)&&done)done();}else{/* t2451u: camp Save refills only when a slot is really written */const undo=before?before():null;if(doSave(false,i)){if(done)done();}else if(undo)undo();}},"wide");b.dataset.saveSlot=i;b.disabled=mode==="load"&&!o;w.appendChild(b);});}

// death: everything goes back to the last save
function restore(){if(!save)return false;campVisit=null;live=clone(save);syncMazeSlots();live.party.forEach(R.clampPoints);/* t2358u old saves */migrateMealBuffs(live);/* t2778u */wakeLoaded();ensureVseed();if(!Array.isArray(live.beasts))live.beasts=[];const r=save.rooms;C.solvedR.fill(0);C.clearedR.fill(0);r.s.forEach(i=>C.solvedR[i]=1);r.c.forEach(i=>C.clearedR[i]=1);S.saveRooms();
 if(S.applyMaze)S.applyMaze(save.maze||{x:save.at.x,y:save.at.y,f:save.at.f});else S.teleport(save.at.x,save.at.y,save.at.f);stepsSince=0;}
// t2404u: while the craft pop-up is open, the toast ("You made ...!") goes where it covers neither the "Tap a box" hints
// (the pop-up's own hint and the camp lesson box) nor the pop-up's buttons: above the pop-up, else just under it, else at the bottom.
function toastSpot(d){d.style.top="";d.style.bottom="";const pop=$("s5craftpop");if(!pop||!d.getBoundingClientRect||!pop.getBoundingClientRect)return;
 const avoid=[Array.from(pop.querySelectorAll(".s4note")).find(e=>/^Tap a box/.test(e.textContent)),$("s5tut")].concat(Array.from(pop.querySelectorAll("button"))).filter(Boolean).map(e=>e.getBoundingClientRect()),h=d.getBoundingClientRect().height,H=window.innerHeight;
 for(const y of [6,pop.getBoundingClientRect().bottom+6,H-h-12])if(y>=0&&y+h<=H&&!avoid.some(r=>r.top<y+h&&y<r.bottom)){d.style.top=y+"px";d.style.bottom="auto";return;}}
function toast(t){const d=$("s4toast");d.textContent=displayText(t);toastSpot(d);d.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>d.classList.remove("on"),toast.ms||2200);toast.ms=0;}
// t2437u QA: a reminder (unspent stat points) stays up 6 s and never hides under a story dialogue: if one is open (or opens right after),
// it waits until no dialogue is open for two checks in a row (chained scenes count), then shows.
const REMIND_MS=6000;function remind(t){clearTimeout(remind.h);if(!t)return;const open=()=>!!(S.storyOpen&&S.storyOpen()),show=()=>{toast.ms=REMIND_MS;toast(t);};
 const wait=()=>{let clear=0;const look=()=>{if(open())clear=0;else if(++clear>=2){show();return;}remind.h=setTimeout(look,150);};remind.h=setTimeout(look,150);};
 if(open())wait();else{show();remind.h=setTimeout(()=>{if(open())wait();},120);}}
// ---------- screens ----------
const ov=$("s4");function openUI(kind){if(!/^(party|equip|stats|move-items|cookbook|skill)$/.test(kind))lockStats();ui=kind;document.documentElement.classList.add("s4open");ov.className="open "+kind;ov.dataset.kind=kind;document.documentElement.classList.remove("s5shop-open");closeBranch();}
function closeUI(){lockStats();campVisit=null;ui=null;document.documentElement.classList.remove("s5shop-open");document.documentElement.classList.remove("s4open");ov.className="";ov.dataset.kind="";ov.dataset.result="";ov.innerHTML="";closeBranch();updBtn();}
S.uiOpen=()=>!!ui;
function head(title,back){const h=el("div","s4head");h.appendChild(el("div","s4title",title));if(back)h.appendChild(tapBtn("Back",back,"s4back"));return h;}
// typing in a stage 4 screen must never reach the walk/map keys (w a s d m and arrows were eaten before = fix round 1)
window.addEventListener("keydown",e=>{if(e.key==="Escape"&&closeCmp()){e.preventDefault();e.stopImmediatePropagation();return;}/* t2657u: Escape cancels the Equip compare */const t=e.target&&e.target.tagName;if(ui||t==="INPUT"||t==="TEXTAREA")e.stopImmediatePropagation();},true);
// re-render a page but keep where it was scrolled to
function page(kind){const top=ui===kind?ov.scrollTop:0;openUI(kind);ov.innerHTML="";const w=el("div","s4page");ov.appendChild(w);requestAnimationFrame(()=>{ov.scrollTop=top;});ov.scrollTop=top;return w;}
// ---- Maze item shortcuts: bindings belong to this party save; bags own every copy. ----
// t2345u: camp-crafted potions/food (it.craft) are not offered for maze boxes yet; the t2295u box list stays as approved
// t2398u/t2399u: smelling salts work only in battle, so they never go in a maze box
function mazeSlotAllowed(id){const it=R.ITEMS[id];return !!it&&!it.craft&&!it.revive&&((it.slot==="use"&&(it.heal||it.mana||id==="ration"))||it.slot==="dish");}
// old saves: a maze box that held salts is cleared; boxes are only shortcuts, so every salts copy is still in a bag (re-added if one is missing)
function migrateSaltsBoxes(L){if(!L||!Array.isArray(L.mazeSlots))return 0;let n=0;L.mazeSlots=L.mazeSlots.map(id=>{if(id==="salts"){n++;return null;}return id;});
 if(n){const have=L.party.reduce((t,c)=>t+c.bag.filter(x=>x==="salts").length,0);for(let k=have;k<n;k++)L.party[0].bag.push("salts");}return n;}
function syncMazeSlots(){migrateSaltsBoxes(live);/* t2398u: old saves */const bindings=live&&Array.isArray(live.mazeSlots)?live.mazeSlots:[],counts={};
 if(live)live.party.forEach(c=>c.bag.forEach(id=>{if(mazeSlotAllowed(id))counts[id]=(counts[id]||0)+1;}));
 const next=Array.from({length:4},(_,i)=>{const id=bindings[i];if(!mazeSlotAllowed(id)||!(counts[id]>0))return null;counts[id]--;return id;});
 if(live)live.mazeSlots=next;S.setMazeSlots(next);return next.slice();}
function clearMazeSlots(){if(live)live.mazeSlots=[null,null,null,null];return syncMazeSlots();}
function clearMazeSlot(i){if(!live||!Number.isInteger(i)||i<0||i>3)return false;syncMazeSlots();live.mazeSlots[i]=null;syncMazeSlots();return true;}
function mazeSlotChoices(i){const bindings=syncMazeSlots();if(!live)return [];const counts={};
 live.party.forEach(c=>c.bag.forEach(id=>{if(mazeSlotAllowed(id))counts[id]=(counts[id]||0)+1;}));
 bindings.forEach((id,j)=>{if(id&&j!==i)counts[id]--;});
 return Object.keys(counts).filter(id=>counts[id]>0).map(id=>({id,n:counts[id]}));}
function assignMazeSlot(i,id){if(!live||!Number.isInteger(i)||i<0||i>3||!mazeSlotChoices(i).some(x=>x.id===id))return false;
 live.mazeSlots[i]=id;syncMazeSlots();return true;}
function mazeSlotPicker(i){const choices=mazeSlotChoices(i);if(!choices.length){toast("No potions or food to put here.");return;}
 const w=page("maze-slot");w.appendChild(head("Item box "+(i+1),closeUI));
 choices.forEach(({id,n})=>{const b=tapBtn(R.ITEMS[id].n+(n>1?" ×"+n:""),()=>{if(!assignMazeSlot(i,id)){toast("That item is no longer available.");mazeSlotPicker(i);return;}closeUI();},"wide");b.dataset.mazeItem=id;if(typeof withIc==="function")withIc(b,id);/* guarded: t2295u harness runs this function alone */w.appendChild(b);});}
function useMazeSlot(i,ci,expected){const bindings=syncMazeSlots(),id=bindings[i];if(!id||expected&&id!==expected)return false;
 const c=live.party[ci],it=R.ITEMS[id];if(!c||it.revive)return false;
 // Consume the real bag copy first. Clear this binding before reconciling other boxes.
 if(!takeOne(id)){syncMazeSlots();toast("That item is no longer available.");return false;}
 live.mazeSlots[i]=null;
 if(id==="ration"||it.slot==="dish")eatDish(c,id);
 else R.useEffect(c,it,hpMul()); // heal / mana share / buff; the shop Mana potion still restores full MP
 syncMazeSlots();closeUI();toast(c.name+(id==="ration"||it.slot==="dish"?" ate ":" used ")+it.n);return true;}
function mazeSlotTargets(i){const id=syncMazeSlots()[i];if(!id)return mazeSlotPicker(i);const it=R.ITEMS[id],food=id==="ration"||it.slot==="dish";
 const targets=live.party.map((c,ci)=>({c,ci}));
 const w=page("maze-slot");w.appendChild(head(it.n,()=>tapMazeSlot(i,true)));
 targets.forEach(({c,ci})=>w.appendChild(tapBtn((food?"Feed ":"Use on ")+c.name,()=>useMazeSlot(i,ci,id),"wide")));}
function tapMazeSlot(i,back=false){if(!live||!Number.isInteger(i)||i<0||i>3)return;
 if(!back&&(ui||S.mapOpen&&S.mapOpen()||S.puzzleOpen&&S.puzzleOpen()||S.storyOpen&&S.storyOpen()||S.panelOpen&&S.panelOpen()))return;
 const id=syncMazeSlots()[i];if(!id)return mazeSlotPicker(i);
 const w=page("maze-slot");w.appendChild(head(R.ITEMS[id].n,closeUI));
 w.appendChild(tapBtn("Use",()=>mazeSlotTargets(i),"wide"));
 w.appendChild(tapBtn("Clear",()=>{clearMazeSlot(i);closeUI();},"wide"));
 w.appendChild(tapBtn("Replace",()=>mazeSlotPicker(i),"wide"));}
// ---- portraits: small busts cut from the fight figure (same art, cached) ----
const PCACHE=new Map();
// t2437u QA: a portrait drawn before its sprite has loaded was cached as a plain dark square for good. Only cache a drawn portrait;
// until then hand back the dark card and redraw the <img> when the sprite arrives.
function portrait(c,onReady){const k=c.race+"|"+c.cls+"|"+gearLookOf(c);if(PCACHE.has(k))return PCACHE.get(k);const sk=heroKey(c),ready=!!spr(sk);const cv=document.createElement("canvas");cv.width=cv.height=96;const g=cv.getContext("2d");
 const bgc={warrior:"#3a1620",rogue:"#1a1f2c",archer:"#14281c",mage:"#1e1840"}[c.cls],rg=g.createRadialGradient(40,30,4,48,48,70);rg.addColorStop(0,bgc);rg.addColorStop(1,"#07040e");g.fillStyle=rg;g.fillRect(0,0,96,96);
 drawHero(g,Object.assign({},c,{hp:1}),56,150,150,0,false);const u=cv.toDataURL();if(ready)PCACHE.set(k,u);else if(onReady&&SPR[sk]&&SPR[sk].addEventListener)SPR[sk].addEventListener("load",()=>onReady(portrait(c)),{once:true});return u;}
function pimg(c,cls){const i=el("img",cls||"s4por");i.src=portrait(c,u=>{i.src=u;});i.alt="";return i;}
function bar(v,mx,cls){const b=el("span","s4bar "+(cls||""));const f=el("span","s4barf");f.style.width=Math.max(0,Math.min(100,v/mx*100))+"%";b.appendChild(f);return b;}
// ---- compact branching menu: tap a name, small labels branch out (flip near edges) ----
let br=null,brBox=null;
function closeBranch(){if(br){br.remove();br=null;}brBox=null;const fp=document.getElementById("fparty");if(fp)fp.classList.remove("treeopen");}
// items: [{t:label, fn, kids:[...] or ()=>[...], off, d:{data attrs}}]
function branch(anchor,items,level,owner,fight){level=level||0;if(level===0){closeBranch();if(fight){const P=$("fbot").getBoundingClientRect(),land=innerWidth>innerHeight;brBox={r:P,dir:land?"col":"row"};}br=el("div","s4br");br.id="s4br";br.addEventListener("click",e=>{if(e.target===br)closeBranch();});
  br.insertAdjacentHTML("beforeend",'<svg class="s4brl"></svg>');document.body.appendChild(br);if(brBox){const P=brBox.r,bk=el("div","s4brbk");bk.style.cssText="left:"+P.left+"px;top:"+P.top+"px;width:"+P.width+"px;height:"+P.height+"px";bk.addEventListener("click",()=>closeBranch());br.insertBefore(bk,br.firstChild);}}
 [...br.querySelectorAll(".s4bcol")].filter(c=>+c.dataset.lv>=level).forEach(c=>c.remove());[...br.querySelectorAll("path")].filter(p=>+p.dataset.lv>=level).forEach(p=>p.remove());
 const col=el("div","s4bcol");col.dataset.lv=level;br.appendChild(col);
 items.forEach(it=>{const b=el("button","s4bi"+(it.off?" off":""),it.t);if(it.d){for(const k in it.d)b.dataset[k]=it.d[k];if(it.d.item||it.d.sell)withIc(b,it.d.item||it.d.sell);/* t2476u */}if(it.kids)b.classList.add("more");
  b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();if(it.off)return;[...col.children].forEach(x=>x.classList.remove("open"));
   if(it.kids){b.classList.add("open");const k=typeof it.kids==="function"?it.kids():it.kids;branch(b,k.length?k:[{t:"(none)",off:true}],level+1);}else{closeBranch();it.fn();}});col.appendChild(b);});
 // place: to the right of the anchor, or flip left near the edge; centre on the anchor, keep inside the screen (flip up near the bottom)
 let a=anchor.getBoundingClientRect();const vw=innerWidth,vh=innerHeight,gap=22;
 if(brBox){ // fight: the tree stays inside the menu panel, never over the scene
  const B=brBox.r;if(brBox.dir==="row"){col.classList.add("row");col.style.maxWidth=(B.width-8)+"px";}
  if(brBox.dir==="row"&&level>=2){ // only two rows fit in the slim panel: keep the last two levels
   br.querySelectorAll(".s4bcol").forEach(c=>{const lv=+c.dataset.lv;if(lv<level-1)c.style.display="none";else if(lv===level-1)c.style.top=(B.top+4)+"px";});
   br.querySelectorAll("path").forEach(p=>{if(+p.dataset.lv<level)p.remove();});}
  if(brBox.dir==="col"&&level>=2&&a.right+12+col.offsetWidth>B.right-4){ // strip too narrow for 3 columns: keep the last two
   br.querySelectorAll(".s4bcol").forEach(c=>{const lv=+c.dataset.lv;if(lv<level-1)c.style.display="none";else if(lv===level-1)c.style.left=(B.left+4)+"px";});
   br.querySelectorAll("path").forEach(p=>{if(+p.dataset.lv<level)p.remove();});}
  a=anchor.getBoundingClientRect();
  const cw=col.offsetWidth,ch=col.offsetHeight;let left,top,fx=0,fy=0;
  if(brBox.dir==="row"){top=B.top+4+Math.min(level,1)*50;left=Math.max(B.left+4,Math.min(B.right-cw-4,a.left+a.width/2-cw/2));fx=2;}
  else{const prev=level?a.right+12:B.left+4;left=prev;if(left+cw>B.right-4){left=Math.max(B.left+4,B.right-cw-4);fx=1;}top=Math.max(B.top+4,Math.min(B.bottom-ch-4,a.top+a.height/2-ch/2));}
  col.style.left=left+"px";col.style.top=top+"px";col.dataset.flipx=fx;col.dataset.flipy=fy;br.dataset.flipx=fx;br.dataset.flipy=fy;br.classList.add("boxed");
  const svg=br.querySelector("svg");svg.setAttribute("width",vw);svg.setAttribute("height",vh);
  if(level){const ax=a.left+a.width/2,ay=a.bottom;[...col.children].forEach(b=>{const r=b.getBoundingClientRect(),bx=r.left+r.width/2,by=r.top;
   const d=brBox.dir==="row"?"M"+ax+" "+ay+" C"+ax+" "+(ay+by)/2+" "+bx+" "+(ay+by)/2+" "+bx+" "+by:"M"+a.right+" "+(a.top+a.height/2)+" C"+(a.right+r.left)/2+" "+(a.top+a.height/2)+" "+(a.right+r.left)/2+" "+(r.top+r.height/2)+" "+r.left+" "+(r.top+r.height/2);svg.insertAdjacentHTML("beforeend",'<path data-lv="'+level+'" d="'+d+'"/>');});}
  return col;}
 const cw=col.offsetWidth,ch=col.offsetHeight;
 let left=a.right+gap,fx=0;if(left+cw>vw-4){left=a.left-gap-cw;fx=1;}if(left<4){left=Math.max(4,Math.min(vw-cw-4,a.left));fx=2;}
 let top=a.top+a.height/2-ch/2,fy=0;if(top+ch>vh-4){top=vh-4-ch;fy=1;}if(top<4){top=4;fy=fy?2:0;}
 col.style.left=left+"px";col.style.top=top+"px";col.dataset.flipx=fx;col.dataset.flipy=fy;br.dataset.flipx=fx;br.dataset.flipy=fy;
 const svg=br.querySelector("svg");svg.setAttribute("width",vw);svg.setAttribute("height",vh);
 const ax=fx===1?a.left:fx===2?a.left+a.width/2:a.right,ay=fx===2?(top>a.top?a.bottom:a.top):a.top+a.height/2;
 [...col.children].forEach(b=>{const r=b.getBoundingClientRect(),bx=fx===1?r.right:fx===2?r.left+12:r.left,by=r.top+r.height/2,mx=(ax+bx)/2;
  const d=fx===2?"M"+ax+" "+ay+" C"+ax+" "+by+" "+ax+" "+by+" "+bx+" "+by:"M"+ax+" "+ay+" C"+mx+" "+ay+" "+mx+" "+by+" "+bx+" "+by;svg.insertAdjacentHTML("beforeend",'<path data-lv="'+level+'" d="'+d+'"/>');});
 return col;}
// fight v3: the decision tree slides in from the right edge, one column per level; Back or a tap outside closes
function slideTree(items,level){if(level===0){closeBranch();br=el("div","s4br slide");br.id="s4br";br.addEventListener("click",e=>{if(e.target===br)closeBranch();});
  const sl=el("div","s4sl");const A=slideTree.at||document.querySelector("#fparty .s4pr.now .s4nl")||document.querySelector("#fparty .s4nl"),ar=A?A.getBoundingClientRect():{top:60,left:innerWidth-150};sl.style.top=Math.round(ar.top)+"px";sl.style.right=Math.round(innerWidth-ar.left+6)+"px";br.appendChild(sl);document.body.appendChild(br);const fp=$("fparty");if(fp)fp.classList.add("treeopen");}
 const sl=br.querySelector(".s4sl");[...sl.querySelectorAll(".s4bcol")].filter(c=>+c.dataset.lv>=level).forEach(c=>c.remove());
 const col=el("div","s4bcol sliding");col.dataset.lv=level;sl.appendChild(col);const op=level>0&&sl.querySelector('.s4bcol[data-lv="'+(level-1)+'"] .s4bi.open');col.style.marginTop=op?(op.offsetTop)+"px":"0px";
 const done=()=>col.classList.remove("sliding");col.addEventListener("animationend",done);setTimeout(done,450);
 if(level>0){const bk=el("button","s4bi back","‹ Back");bk.dataset.back=level;bk.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();
   [...sl.querySelectorAll(".s4bcol")].forEach(c=>{const lv=+c.dataset.lv;if(lv>=level)c.remove();else if(lv===level-1){c.style.display="";c.querySelectorAll(".open").forEach(x=>x.classList.remove("open"));}else if(lv>=level-2)c.style.display="";});});col.appendChild(bk);}
 items.forEach(it=>{const b=el("button","s4bi"+(it.off?" off":""),it.t);if(it.d){for(const k in it.d)b.dataset[k]=it.d[k];if(it.d.item||it.d.sell)withIc(b,it.d.item||it.d.sell);/* t2476u */}if(it.kids)b.classList.add("more");
  b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();if(it.off)return;[...col.children].forEach(x=>x.classList.remove("open"));
   if(it.kids){b.classList.add("open");const k=typeof it.kids==="function"?it.kids():it.kids;slideTree(k.length?k:[{t:"(none)",off:true}],level+1);}else{closeBranch();it.fn();}});col.appendChild(b);});
 // too wide for the screen: hide the oldest columns (Back brings them back)
 const cols=[...sl.querySelectorAll(".s4bcol")],need=()=>cols.filter(c=>c.style.display!=="none").reduce((s,c)=>s+c.offsetWidth+8,-8);for(const c of cols){if(need()<=sl.clientWidth||c===col)break;c.style.display="none";}
 if(level>0&&cols.every(c=>c===col||c.style.display==="none"))col.style.marginTop="0px";/* VER 83: wider HP/MP name tabs can hide the opener on a 360px phone; then sit beside the name */
 return col;}
// ---- character creation ----
const cc={name:"Hero",race:"human",cls:"warrior",add:{str:0,sta:0,con:0,man:0},skill:null,diff:"normal",warned:false,err:""};
function ccSpent(){const b=R.RACES[cc.race].base;return ["str","sta","con","man"].reduce((t,k)=>t+R.spendCost(b[k],b[k]+cc.add[k]),0);}
function ccChange(f){return ()=>{f();cc.warned=false;cc.err="";creation();};}
function creation(){const w=page("create");w.classList.add("cc");w.appendChild(head("Make your hero"));
 w.appendChild(el("div","s4note","Pick a name, race and class, spend 10 points, choose a skill, then Confirm."));
 w.appendChild(el("div","s4lab","1. Name"));const nm=el("input","s4name");nm.id="ccname";nm.maxLength=14;nm.placeholder="Type your hero's name";nm.value=cc.name;nm.autocomplete="off";nm.setAttribute("enterkeyhint","done");
 /* t2437u QA: "Hero" is only the default: tapping the box clears it so typing does not add to it; left empty it goes back to "Hero" */nm.addEventListener("focus",()=>{if(nm.value==="Hero"){nm.value="";cc.name="";}});nm.addEventListener("blur",()=>{if(!nm.value.trim()){nm.value="Hero";cc.name="Hero";}});nm.addEventListener("input",()=>{cc.name=nm.value;if(cc.err&&nm.value.trim()){cc.err="";const e=$("ccerr");if(e)e.textContent="";}});nm.addEventListener("keydown",e=>{if(e.key==="Enter")nm.blur();});w.appendChild(nm);
 w.appendChild(el("div","s4lab","2. Race"));const rr=el("div","s4row");for(const k in R.RACES){const b=tapBtn(R.RACES[k].name,ccChange(()=>{cc.race=k;if(!R.allowed(k,cc.cls))cc.cls=R.RACES[k].classes[0];cc.add={str:0,sta:0,con:0,man:0};cc.skill=null;}),cc.race===k?"sel":"");b.dataset.race=k;rr.appendChild(b);}w.appendChild(rr);
 w.appendChild(el("div","s4note",{human:"Any class, any armor. Average.",elf:"Mage, archer, rogue, warrior. Armor up to medium. Strong mana.",dwarf:"Warrior, rogue, archer. No magic. Very strong, carries a lot.",cat:"Mage, rogue, warrior. Light armor only. Strong stamina, weak strength, carries little."}[cc.race]));
 w.appendChild(el("div","s4lab","3. Class"));const cr=el("div","s4row");for(const k in R.CLASSES){const ok=R.allowed(cc.race,k),b=tapBtn(R.CLASSES[k].name,ccChange(()=>{if(!ok)return;cc.cls=k;cc.skill=null;}),(cc.cls===k?"sel":"")+(ok?"":" off"));b.dataset.cls=k;b.disabled=!ok;cr.appendChild(b);}w.appendChild(cr);
 const left=R.START_POINTS-ccSpent();const lab=el("div","s4lab","4. Stats - points left: "+left);lab.id="ccleft";w.appendChild(lab);
 const SN={str:"Strength",sta:"Stamina",con:"Constitution",man:"Mana"},b=R.RACES[cc.race].base;
 for(const k of["str","sta","con","man"]){const v=b[k]+cc.add[k],row=el("div","s4stat");row.appendChild(el("span","s4sn",SN[k]+(R.CLASSES[cc.cls].main===k?" *":"")));
  const minus=tapBtn("-",ccChange(()=>{if(cc.add[k]>0)cc.add[k]--;}),"s4pm"+(cc.add[k]>0?"":" off"));minus.dataset.dec=k;row.appendChild(minus);
  const vv=el("span","s4sv",String(v));vv.dataset.val=k;row.appendChild(vv);
  const blocked=cc.race==="dwarf"&&k==="man",c=R.cost(v),plus=tapBtn("+",ccChange(()=>{if(!blocked&&left>=c)cc.add[k]++;}),"s4pm"+(blocked||left<c?" off":""));plus.dataset.inc=k;row.appendChild(plus);
  row.appendChild(el("span","s4cost",blocked?"no magic":"next costs "+c));w.appendChild(row);}
 w.appendChild(el("div","s4note","* main stat for this class. Higher stats cost more points."));
 w.appendChild(el("div","s4lab","5. Starting skill"));const sr=el("div","s4row");R.SKILLS[cc.cls].slice(0,3).forEach(s=>{const bt=tapBtn(s.n,ccChange(()=>{cc.skill=s.id;}),cc.skill===s.id?"sel":"");bt.dataset.skill=s.id;sr.appendChild(bt);});w.appendChild(sr);
 w.appendChild(el("div","s4lab","6. Difficulty"));const dr=el("div","s4row");for(const k in R.DIFF){const bt=tapBtn(R.DIFF[k].name,ccChange(()=>{cc.diff=k;}),cc.diff===k?"sel":"");bt.dataset.diff=k;dr.appendChild(bt);}w.appendChild(dr);
 w.appendChild(el("div","s4note",{story:"Story: heroes have double health, monsters hit half as hard.",normal:"Normal: the game as planned.",hard:"Hard: monsters hit 50% harder."}[cc.diff]));
 const foot=el("div","s4foot");const er=el("div","s4err",cc.err);er.id="ccerr";er.setAttribute("role","alert");foot.appendChild(er);
 const go=tapBtn(cc.warned?"Confirm anyway":"Confirm hero",ccConfirm,"s4go");go.id="ccgo";foot.appendChild(go);w.appendChild(foot);}
function ccConfirm(){const nmEl=$("ccname");if(nmEl)cc.name=nmEl.value;if(!cc.name.trim())cc.name="Hero";/* t2437u QA: empty = default name */const left=R.START_POINTS-ccSpent();
 if(!cc.name.trim()){cc.err="Type a name for your hero first.";creation();const n=$("ccname");if(n)n.scrollIntoView({block:"center"});return;}
 if(!cc.skill){cc.err="Pick a starting skill (step 5).";creation();return;}
 if(left>0&&!cc.warned){cc.warned=true;cc.err="You still have "+left+" stat point"+(left>1?"s":"")+" left. Spend them, or tap Confirm anyway.";creation();return;}
 const h=R.newChar(cc.name.trim(),cc.race,cc.cls,cc.add,cc.skill);
 const kit={warrior:["sword","leather"],rogue:["dagger","leather"],archer:["bow","leather"],mage:["staff","robe"]}[cc.cls];kit.forEach(id=>{if(id==="leather"&&!R.canEquip(h,id,"chest"))id="robe";h.bag.push(id);R.equip(h,id,R.ITEMS[id].slot);});h.bag.push("potion","potion","potion","ether","ether");/* t2372s8806: kit is exactly 3 Healing + 2 Mana (ether) + 3 hide + 3 silk */h.bag.push("p_hide","p_hide","p_hide","p_silk","p_silk","p_silk");/* t2356u: tent parts for the first-camp craft lesson */
 live={v:1,party:[h],gold:20,diff:cc.diff,seed:(Math.random()*1e9)|0,vseed:freshVseed(),vpools:{},vpick:{},steps:0,fresh:{},recipes:{},tentWear:0,beasts:[]};live.party[0].hp=R.maxHp(h,hpMul());if(S.resetRun)S.resetRun();doSave(true);cc.warned=false;cc.err="";closeUI();toast("Welcome, "+h.name+"! Your hero is in the party. Game saved.");h6("created");}
// ---- party screen: portrait + panel cards; tap anywhere on a card for the character sheet ----
function gearText(c){const n=s=>c.equip[s]&&R.ITEMS[c.equip[s]].n;const a=[n("weapon"),n("offhand")].filter(Boolean),b=[n("helmet"),n("chest"),n("gloves"),n("boots"),n("acc1"),n("acc2")].filter(Boolean);return [a.join(", ")||"No weapon",b.join(", ")||"No armor"];}
function partyScreen(){const w=page("party");w.appendChild(head("Party",closeUI));
 w.appendChild(el("div","s4note","Gold "+live.gold+"  ·  "+R.DIFF[live.diff].name+"  ·  last save: "+(save.at.name||"?")));
 const g=el("div","s4roster");live.party.forEach((c,i)=>{const card=el("div","s4rc");card.dataset.card=i;card.setAttribute("role","button");card.appendChild(pimg(c));const info=el("div","s4ri");
  const top=el("div","s4rn");top.appendChild(el("b","",c.name));top.appendChild(el("span","s4sub","Lv "+c.lvl+" "+R.RACES[c.race].name+" "+R.CLASSES[c.cls].name));info.appendChild(top);
  const mx=R.maxHp(c,hpMul());const h=el("div","s4hpl");h.appendChild(el("span","s4k","HP"));h.appendChild(bar(c.hp,mx,"hp"));h.appendChild(el("span","s4v",c.hp+"/"+mx));info.appendChild(h);
  const m=el("div","s4hpl");m.appendChild(el("span","s4k","MP"));m.appendChild(bar(c.mp,R.maxMp(c),"mp"));m.appendChild(el("span","s4v",c.mp+"/"+R.maxMp(c)));info.appendChild(m);
  const sl=statLine(c);info.appendChild(el("div","s4sub","STR "+c.stats.str+" · STA "+c.stats.sta+" · CON "+R.conOf(c)+" · MAN "+c.stats.man+" · ATK "+sl.atk+" · DEF "+sl.def));
  gearText(c).forEach(x=>info.appendChild(el("div","s4gear",x)));
  const flags=[];if(R.pointsEarned(c.lvl)-c.spent>0)flags.push("stat points");if(c.skills.length<R.skillSlots(c.lvl))flags.push("new skill");if(flags.length)info.appendChild(el("div","s4sub glowt",flags.join(" · ")+" ready"));
  card.appendChild(info);card.addEventListener("click",e=>{e.preventDefault();charScreen(i);});g.appendChild(card);});w.appendChild(g);w.appendChild(el("div","s4note dim","Tap a character to open the character sheet."));const cg=tapBtn("Cooking guide",()=>cookbook(partyScreen),"small");cg.dataset.guide="1";w.appendChild(cg);}
// t2615u: minus on the level-up stat screen, same look as character creation. Floors are the stats when this session began.
// Points lock when the skills page shows, the character menu closes (any closeUI path), or openUI opens a page outside the character menu (party/equip/stats/move-items/cookbook/skill). After that there is no minus. Back from the sheet to the party list does not lock.
let statSess=new Map();
function beginStatSess(c){if(!statSess.has(c))statSess.set(c,{str:c.stats.str,sta:c.stats.sta,con:c.stats.con,man:c.stats.man});}
function lockStats(){statSess=new Map();}
function applyStatVitals(c,mh,mm){if(c.hp>0){c.hp+=R.maxHp(c,hpMul())-mh;if(c.hp<1)c.hp=1;}c.mp+=R.maxMp(c)-mm;if(c.mp<0)c.mp=0;capVitals(c);}
function statScreen(i){const c=live.party[i];beginStatSess(c);const floor=statSess.get(c);const w=page("stats");w.appendChild(head(c.name+" - stats",()=>charScreen(i)));
 w.appendChild(el("div","s4lab","Points left: "+(R.pointsEarned(c.lvl)-c.spent)));
 const SN={str:"Strength",sta:"Stamina",con:"Constitution",man:"Mana"};
 for(const k of["str","sta","con","man"]){const row=el("div","s4stat");row.appendChild(el("span","s4sn",SN[k]));
  const canDown=c.stats[k]>floor[k],minus=tapBtn("-",()=>{const mh=R.maxHp(c,hpMul()),mm=R.maxMp(c);if(R.lower(c,k,floor[k]))applyStatVitals(c,mh,mm);statScreen(i);},"s4pm"+(canDown?"":" off"));minus.dataset.dec=k;row.appendChild(minus);
  row.appendChild(el("span","s4sv",String(c.stats[k])));
  const blocked=c.race==="dwarf"&&k==="man",need=R.cost(c.stats[k]),left=R.pointsEarned(c.lvl)-c.spent,canUp=!blocked&&left>=need;
  const pl=tapBtn("+",()=>{const mh=R.maxHp(c,hpMul()),mm=R.maxMp(c);if(R.raise(c,k))applyStatVitals(c,mh,mm);statScreen(i);},"s4pm"+(canUp?"":" off"));pl.dataset.raise=k;row.appendChild(pl);
  row.appendChild(el("span","s4cost","costs "+need));w.appendChild(row);}}
function skillScreen(i){lockStats();const c=live.party[i];const w=page("skill");w.appendChild(head(c.name+" - new skill",()=>charScreen(i)));
 R.SKILLS[c.cls].filter(s=>!c.skills.includes(s.id)).forEach(s=>{const b=tapBtn(s.n+"  ("+s.mp+" MP)",()=>{R.learn(c,s.id);charScreen(i);},"wide");b.dataset.lskill=s.id;w.appendChild(b);});}
// ---- character sheet: figure with square slots, stats, backpack boxes. Tap item then slot, or slot then item ----
const SLN={weapon:"Weapon",offhand:"Off-hand",helmet:"Helmet",chest:"Chest",gloves:"Gloves",boots:"Boots",acc1:"Ring",acc2:"Ring"};
const ICON={weapon:"M8 32 L28 12 M24 8 L32 8 L32 16 M11 25 L15 29",offhand:"M20 6 L32 10 L31 22 Q28 31 20 34 Q12 31 9 22 L8 10 Z",helmet:"M8 26 Q8 8 20 8 Q32 8 32 26 L26 26 L26 20 L14 20 L14 26 Z",chest:"M12 8 L20 12 L28 8 L33 14 L29 18 L29 33 L11 33 L11 18 L7 14 Z",
 gloves:"M12 33 L12 16 Q12 12 15 12 L15 20 L15 8 Q18 6 19 8 L19 19 L20 7 Q23 5 24 8 L24 19 L26 10 Q29 9 29 12 L28 33 Z",boots:"M14 6 L24 6 L24 24 L33 28 L33 34 L12 34 Z",acc1:"M20 30 A8 8 0 1 0 20.01 30 M16 12 L20 7 L24 12",acc2:"M20 30 A8 8 0 1 0 20.01 30 M16 12 L20 7 L24 12",
 use:"M16 6 L24 6 L24 12 Q32 16 32 24 Q32 34 20 34 Q8 34 8 24 Q8 16 16 12 Z",junk:"M8 14 L20 8 L32 14 L32 28 L20 34 L8 28 Z M8 14 L20 20 L32 14 M20 20 L20 34",acc:"M20 30 A8 8 0 1 0 20.01 30 M16 12 L20 7 L24 12"};
function icon(s){const v=el("span","s4icw");v.innerHTML='<svg class="s4ic" viewBox="0 0 40 40"><path d="'+(ICON[s]||ICON.junk)+'"/></svg>';return v;}
// t2476u: each item's own 8-bit icon (item-icons.js, inline SVG, no network). The name stays as text next to/under it.
function itemIc(id,cls){if(!id||!window.SOTA_ICONS||!SOTA_ICONS.has||!SOTA_ICONS.has(id))return null;const v=el("span","iic"+(cls?" "+cls:""));v.innerHTML=SOTA_ICONS.svg(id);v.dataset.iconId=id;return v;}
function withIc(b,id){const v=itemIc(id);if(v&&b&&typeof b.insertBefore==="function")b.insertBefore(v,b.firstChild||null);return b;}
function statLine(c){return {atk:Math.round(R.power(c)),mag:Math.round(R.magicPower(c)),def:Math.round(R.defense(c)),hp:R.maxHp(c,hpMul())};}
function diffText(a,b){const out=[];for(const[k,n]of[["atk","ATK"],["mag","MAG"],["def","DEF"],["hp","HP"]]){const d=b[k]-a[k];if(d)out.push((d>0?"+":"")+d+" "+n);}return out;}
function fits(id,s){const t=R.ITEMS[id];return t&&(t.slot===s||(s.startsWith("acc")&&t.slot==="acc"));}
// ---- t2645u/t2650u hero looks: three palette swaps of the existing 8-bit fight sprite art6/fight/p-<race>-<cls>.png ----
// cloth = the sprite unchanged; leather = outfit pixels moved onto a brown ramp; metal = outfit pixels moved onto a steel-grey ramp.
// The worn chest piece picks the look; no chest = cloth. Material: item.mat/material if set ("cloth|leather|metal" or "robe|vest|plate"),
// else armour class item.a (1 cloth, 2 leather, 3 metal), else the chest kind from the item name (robe/vest/plate).
// Outfit pixels = the sprite's listed outfit colours (o) outside its keep boxes (k: face, weapon, hair, tail, inclusive x0,y0,x1,y1).
// Skin colours (s), face, hair and weapon pixels are never changed. Each look is built once per sprite from the already-loaded sprite
// and cached; there is no extra network request and none of the separate gear layer art is drawn. Item stats, slots and bag icons are untouched.
const GEAR_SLOT_FAMS={helmet:["hood","helm"],chest:["robe","vest","plate"],gloves:["wraps","gauntlet"],boots:["softboot","boot"],weapon:["sword","dagger","axe","mace","staff","bow"],offhand:["buckler","tower","tome","dagger"]};
const GEAR_FAM_FALLBACK={helmet:"helm",chest:"vest",gloves:"wraps",boots:"boot",weapon:"sword",offhand:"buckler"};
const GEAR_LOOKS=["cloth","leather","metal"];
const GEAR_MAT_LOOK={cloth:"cloth",leather:"leather",metal:"metal",robe:"cloth",vest:"leather",plate:"metal"},GEAR_A_LOOK={1:"cloth",2:"leather",3:"metal"};
function gearKind(id,it){const n=((it&&it.n)||"").toLowerCase(),s=it&&it.slot;
 if((s==="weapon"||s==="offhand")&&/dagger|knife|splinter|stiletto|fang|talon/.test(n))return "dagger";
 if(window.SOTA_ICONS&&window.SOTA_ICONS._dev&&window.SOTA_ICONS._dev.kind)return window.SOTA_ICONS._dev.kind(id,it);
 if(s==="weapon")return /bow/.test(n)?"bow":/staff|rod|wand/.test(n)?"staff":/axe/.test(n)?"axe":/mace|hammer|club|maul/.test(n)?"mace":"sword";
 if(s==="offhand")return /tome|book/.test(n)?"tome":/tower/.test(n)?"tower":"buckler";
 if(s==="helmet")return /hood|cap|cowl/.test(n)?"hood":"helm";
 if(s==="chest")return /robe/.test(n)?"robe":/plate|armor|mail/.test(n)?"plate":"vest";
 if(s==="gloves")return /gauntlet/.test(n)?"gauntlet":"wraps";
 if(s==="boots")return /soft|trail|strider|sandal/.test(n)?"softboot":"boot";
 return null;}
function gearFamily(id,slot){const it=R.ITEMS[id];if(!it)return null;const k=gearKind(id,it);const use=slot||it.slot;
 if(k==="dagger"&&(use==="offhand"||it.slot==="offhand"||it.slot==="weapon"))return "dagger";
 const allowed=GEAR_SLOT_FAMS[use]||GEAR_SLOT_FAMS[it.slot];if(!allowed)return null;
 if(allowed.includes(k))return k;return GEAR_FAM_FALLBACK[use]||GEAR_FAM_FALLBACK[it.slot]||null;}
function gearMaterial(id){const it=id&&R.ITEMS[id];if(!it||it.slot!=="chest")return null;
 const m=String(it.mat||it.material||"").toLowerCase();if(GEAR_MAT_LOOK[m])return GEAR_MAT_LOOK[m];
 if(GEAR_A_LOOK[it.a])return GEAR_A_LOOK[it.a];
 return GEAR_MAT_LOOK[gearFamily(id,"chest")]||"cloth";}
function gearLookOf(c){const id=c&&c.equip&&c.equip.chest;return gearMaterial(id)||"cloth";}
const HERO_LOOK_DATA={
 "human-warrior":{o:"49535d 202324 5d6c6c 2c443c 868a8e 94a0a0 827e78 d8d5d0 0e1309 0f2012 213325",k:[[0,23,14,36,"weapon"]],s:""},
 "human-mage":{o:"3e34a2 262377 1b1c5e 101342 181959 0d1024 121839 232040 473787 1a2057 342858 2e2766 3c3274",k:[[0,11,12,57,"weapon"],[16,11,26,26,"face"]],s:"7b524b ad766f e2ad91"},
 "human-rogue":{o:"5e5f63 3c3a3c 262729 221710 2e3436 4e3a2f 3c291e 0c140e 33271f 2d1f16 475c50 141c18 18241b 16120f 231e19 0c0a09 181716 092609 304d36 0f370f 4c7b4c",k:[[13,10,20,19,"face"]],s:"59514f a99a8c"},
 "human-archer":{o:"304c1a 181806 263914 5f7827 3b631d 24300f 26250b 56481e 103409 0d2506 6c6533 17480e",k:[[0,0,15,46,"weapon"],[22,9,33,25,"face"]],s:"9b6630 e7b57e ba874e"},
 "elf-warrior":{o:"787673 b6a789 ae2920 831715 ebe0c3 40442f 393721 544d36 665536 391f16 121b0e 3d0b07 95805c",k:[[0,35,17,48,"weapon"],[16,10,25,20,"face"]],s:""},
 "elf-mage":{o:"f8f1e5 278da3 b7b2a9 808674 d4cabb 2e6e7c 57a9af 31515c",k:[[0,0,10,57,"weapon"],[15,9,24,20,"face"]],s:"f6de9d"},
 "elf-rogue":{o:"383345 111119 22212d 151521 1a1923 1d1c27 322e3a 2c2529 423632 221c20 0b0d11 07090b 141720 0a1410 0c1b12 091011 07230a 162f16",k:[[0,24,14,41,"weapon"],[8,8,25,23,"face"]],s:"a38859 e5bb7f"},
 "elf-archer":{o:"586a26 0e290d 224617 0e1706 1b3813 48461f 25240e 1e2f11 2f641f 88ac4d",k:[[0,0,19,46,"weapon"],[22,10,31,22,"face"]],s:"f2c66f f9d984"},
 "dwarf-warrior":{o:"4b4748 2e1811 625d5b 65251a 90766a 403b3b b2a092 333030 421f19 1e1816 2b2120 2d292a 160d0d 250d12 452d26 785f55 5c473f 86442c 3a0a1d",k:[[0,26,14,46,"weapon"],[18,10,29,17,"face"]],s:""},
 "dwarf-rogue":{o:"4e382a 352318 2a1c13 472e22 1c110b 5a3c2b 644835 39261a 281810 432c20 735445 20130c 22170f 3b2a1f 291115 34171c 301918 1d0a10 542e2c 42112d",k:[[0,23,14,29,"weapon"],[12,8,22,19,"face"]],s:"b0958d"},
 "dwarf-archer":{o:"341e0e 502e17 61311d 472a16 764225 150e09 7f5331 28180e 24140b 573e2c 986640 3d1c14 210f0a 451d14 0d0706 1e0614 34062a 321513 5b1839 650455",k:[[0,19,23,31,"weapon"],[20,9,31,22,"face"]],s:"c88e59"},
 "cat-warrior":{o:"4a2918 744023 321515 71584d c75313 732917 b2450b 57372b 8b310f 996336 9e3d0b e3681a d26119 965024 4e151f 731725 6d003f",k:[[0,21,16,41,"weapon"],[16,13,25,25,"face"],[10,0,46,21,"hair"],[39,22,55,52,"tail"]],s:"c19373 ad7953 eed4ba daaf85"},
 "cat-mage":{o:"184eb4 052b71 0f3d95 02225b 08327f 031d31 042c4a 011327 0d1318 163650 42617f 314b6a 0e477a",k:[[0,9,11,53,"weapon"],[15,15,23,27,"face"]],s:"cbbca0"},
 "cat-rogue":{o:"322f35 221517 141011 171619 28262a 221e1f 0a090b 2c182a 200c1c 392428 150a13 3e322f 302425 2c0a24 3a0b2f 532638 540d47",k:[[10,3,22,20,"face"]],s:"a79088"}};
const HERO_LOOK_RAMP={leather:["#24130a", "#3d2414", "#5a3720", "#7a4e2c", "#9a683c", "#bb8a58", "#d6ad7c"],metal:["#1c2126", "#353d45", "#525c66", "#727e89", "#98a3ad", "#bfc8cf", "#e2e7eb"]};
const HERO_LOOKS=new Map(),HERO_LOOK_STATS={builds:0,fails:0};
function heroLookHex(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function heroLookLum(r,g,b){return (0.299*r+0.587*g+0.114*b)/255;}
function heroLookRamp(Rm,t){t=Math.max(0,Math.min(1,t))*(Rm.length-1);const i=Math.min(Math.floor(t),Rm.length-2),f=t-i,a=heroLookHex(Rm[i]),b=heroLookHex(Rm[i+1]);return [0,1,2].map(j=>Math.round(a[j]+(b[j]-a[j])*f));}
function heroLookKept(D,x,y){return D.k.some(r=>x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3]);}
function heroLookPixels(d,w,h,pose,look){const D=HERO_LOOK_DATA[pose],Rm=HERO_LOOK_RAMP[look];if(!D||!Rm)return 0;const set=new Set(D.o.split(" "));let lo=1,hi=0;
 set.forEach(x=>{const c=heroLookHex(x),L=heroLookLum(c[0],c[1],c[2]);if(L<lo)lo=L;if(L>hi)hi=L;});
 let n=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(!d[i+3])continue;const hx=((1<<24)|(d[i]<<16)|(d[i+1]<<8)|d[i+2]).toString(16).slice(1);
  if(!set.has(hx)||heroLookKept(D,x,y))continue;const L=heroLookLum(d[i],d[i+1],d[i+2]),nrm=hi>lo?(L-lo)/(hi-lo):.5,c=heroLookRamp(Rm,0.06+0.86*(0.55*nrm+0.45*Math.min(1,L*2.2)));
  d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];n++;}return n;}
// one cached canvas per sprite+look, made from the loaded p- sprite; failures fall back to the plain sprite (cached, never retried)
function heroLook(k,look,im){const key=k+"|"+look;if(HERO_LOOKS.has(key))return HERO_LOOKS.get(key);let cv=null;
 try{const w=im.naturalWidth,h=im.naturalHeight;cv=document.createElement("canvas");cv.width=w;cv.height=h;const g=cv.getContext("2d");g.imageSmoothingEnabled=false;g.drawImage(im,0,0);
  const id=g.getImageData(0,0,w,h);heroLookPixels(id.data,w,h,k.replace(/^p-/,""),look);g.putImageData(id,0,0);cv.naturalWidth=w;cv.naturalHeight=h;cv.dataset.look=look;cv.dataset.src="art6/fight/"+k+".png";HERO_LOOK_STATS.builds++;}
 catch(e){cv=null;HERO_LOOK_STATS.fails++;}HERO_LOOKS.set(key,cv);return cv;}
function heroArt(c){const k=heroKey(c),im=spr(k);if(!im)return null;const look=gearLookOf(c);return look==="cloth"?im:(heroLook(k,look,im)||im);}
const GEAR_API={looks:GEAR_LOOKS,material:gearMaterial,lookOf:gearLookOf,family:gearFamily,kind:gearKind,heroArt,heroKey:c=>heroKey(c),lookCanvas:(k,look)=>{const im=spr(k);return im?(look==="cloth"?im:heroLook(k,look,im)):null;},
 data:HERO_LOOK_DATA,ramp:HERO_LOOK_RAMP,lookPixels:heroLookPixels,stats:()=>Object.assign({cached:HERO_LOOKS.size},HERO_LOOK_STATS)};
function figure(c){const cv=document.createElement("canvas");cv.className="s4fig";cv.width=240;cv.height=300;cv.dataset.look=gearLookOf(c);const g=cv.getContext("2d");
 const rg=g.createRadialGradient(120,110,10,120,150,190);rg.addColorStop(0,"#3a2a4a");rg.addColorStop(1,"#0a0610");g.fillStyle=rg;g.fillRect(0,0,240,300);
 const tg=g.createRadialGradient(40,40,2,40,40,160);tg.addColorStop(0,"rgba(255,170,80,.35)");tg.addColorStop(1,"rgba(255,170,80,0)");g.fillStyle=tg;g.fillRect(0,0,240,300);
 g.fillStyle="rgba(0,0,0,.45)";g.beginPath();g.ellipse(120,282,62,10,0,0,7);g.fill();drawHero(g,Object.assign({},c,{hp:1}),120,286,175,0,false);
 g.strokeStyle="rgba(200,160,90,.5)";g.lineWidth=2;g.strokeRect(3,3,234,294);return cv;}
// ---- t2657u tap an item: its short description and quick stats show right away in the info box (no extra button). ----
const ITEM_SLOT_NAME={weapon:"Weapon",offhand:"Off-hand",helmet:"Helmet",chest:"Chest armour",gloves:"Gloves",boots:"Boots",acc:"Ring or charm",use:"Potion",dish:"Meal",ing:"Ingredient",part:"Monster part",junk:"Junk",gear:"Tool",craft:"Crafted item"};
function itemQuick(id){const it=R.ITEMS[id];if(!it)return [];const o=[["Type",ITEM_SLOT_NAME[it.slot]||it.slot]];
 for(const [k,n] of [["atk","ATK"],["mag","MAG"],["def","DEF"],["hp","HP"]])if(it[k]&&typeof it[k]==="number")o.push([n,(it[k]>0?"+":"")+it[k]]);
 if(it.a)o.push(["Armour",["","Light","Medium","Heavy"][it.a]||String(it.a)]);
 if(it.slot==="chest"){const m=gearMaterial(id);o.push(["Look",{cloth:"Cloth",leather:"Leather",metal:"Metal"}[m]||"Cloth"]);}
 if(it.heal)o.push(["Heals",it.heal>=1?"full":Math.round(it.heal*100)+"% HP"]);if(it.mana)o.push(["Mana",Math.round(it.mana*100)+"% MP"]);if(it.mp&&it.slot!=="acc")o.push(["Mana",it.mp>=1?"full":Math.round(it.mp*100)+"% MP"]);
 if(it.revive)o.push(["Revives",Math.round(it.revive*100)+"% HP"]);
 o.push(["Weight",it.w+" kg"]);const sp=E.sellPrice?E.sellPrice(id):it.v;if(sp)o.push(["Sells for",sp+" gold"]);return o;}
function itemDesc(id,c){const it=R.ITEMS[id];if(!it)return "";const n=(it.n||"").toLowerCase(),A=["","Light","Medium","Heavy"][it.a]||"";let t="";
 if(it.slot==="weapon"){const who=Object.keys(R.CLASSES).filter(k=>R.CLASSES[k].weapons.includes(it.t)).map(k=>R.CLASSES[k].name);t="A "+(it.t||"weapon")+" for your main hand."+(who.length?" Used by: "+who.join(", ")+".":"");}
 else if(it.slot==="offhand")t=/tome|book/.test(n)?"A spell book for your off hand. It adds magic.":/dagger|knife|fang|talon/.test(n)?"A second blade for your off hand.":"A shield for your off hand. It blocks hits.";
 else if(it.slot==="chest"){const m=gearMaterial(id);t=(A?A+" ":"")+"armour for your body. Your hero wears the "+m+" look with it.";}
 else if(it.slot==="helmet"||it.slot==="gloves"||it.slot==="boots")t=(A?A+" ":"")+"armour for your "+(it.slot==="helmet"?"head":it.slot==="gloves"?"hands":"feet")+".";
 else if(it.slot==="acc")t="A ring or charm. Each hero can wear two.";
 else if(it.slot==="use")t=(it.revive?"Brings a fallen hero back. Use it in battle.":"Use it to feel better: "+(E.useText?E.useText(id):"")).replace(/: $/,".");
 else if(it.slot==="dish")t="A cooked meal: "+(E.fxText&&E.dish&&E.dish(it.dish)?E.fxText(E.dish(it.dish).fx):"food")+".";
 else if(it.slot==="ing")t="Used for cooking. It never spoils.";
 else if(it.slot==="part")t="A monster part. Use it for crafting, or sell it.";
 else if(it.slot==="junk")t="Junk. Sell it in a shop.";
 else if(it.slot==="gear")t=it.special?specialDesc(id):it.tent?"A tent. You need it to save at a camp.":"A tool for the road.";
 else if(it.slot==="craft")t=E.badText?E.badText(id):"A crafted item.";
 if(it.worn)t+=" It is old and worn.";
 if(c&&["weapon","offhand","helmet","chest","gloves","boots","acc"].includes(it.slot)){const s=it.slot==="acc"?"acc1":it.slot;t+=R.canEquip(c,id,s)?" "+c.name+" can use this.":" "+c.name+" can't use this.";}
 return t;}
// ---- t2657u Equip = compare first: what is in that slot now (or Nothing equipped) and every stat that would change; Confirm equips, Cancel changes nothing ----
function cmpLine(c){return {atk:Math.round(R.power(c)),mag:Math.round(R.magicPower(c)),def:Math.round(R.defense(c)),hp:R.maxHp(c,hpMul()),mp:R.maxMp(c)};}
function equipCompare(c,id,slot){const cur=c.equip[slot]||null,a0=cmpLine(c),t=clone(c);const ok=R.equip(t,id,slot),a1=ok?cmpLine(t):a0,rows=[];
 for(const [k,n] of [["atk","ATK"],["mag","MAG"],["def","DEF"],["hp","HP"],["mp","MP"]]){const d=a1[k]-a0[k];if(d)rows.push({k,n,d,from:a0[k],to:a1[k],txt:(d>0?"+":"")+d+" "+n});}
 return {ok,cur,curName:cur?R.ITEMS[cur].n:"Nothing equipped",rows};}
function closeCmp(){const p=document.getElementById("s6cmp");if(p){p.remove();return true;}return false;}
function cmpPanel(c,i,id,slot){closeCmp();const it=R.ITEMS[id];if(!it)return null;const cm=equipCompare(c,id,slot);
 const bg=el("div","s6cmp");bg.id="s6cmp";bg.dataset.item=id;bg.dataset.slot=slot;bg.setAttribute("role","dialog");bg.setAttribute("aria-modal","true");bg.setAttribute("aria-label","Equip "+it.n+"?");
 const card=el("div","s6cmpCard");const top=el("div","s6cmpTop");const ic=itemIc(id,"big");if(ic)top.appendChild(ic);top.appendChild(el("b","s6cmpName","Equip "+it.n+"?"));card.appendChild(top);
 const now=el("div","s6cmpNow");now.appendChild(el("span","s4k",(SLN[slot]||slot)+" now: "));const nv=el("span","s4v",cm.curName);nv.dataset.cmpcur=cm.cur||"";now.appendChild(nv);card.appendChild(now);
 const list=el("div","s6cmpRows");if(!cm.rows.length){const r=el("div","s6cmpRow same","No stat changes");r.dataset.cmp="none";list.appendChild(r);}
 cm.rows.forEach(r=>{const row=el("div","s6cmpRow "+(r.d>0?"up":"down"));row.dataset.cmp=r.k;row.dataset.d=r.d;row.appendChild(el("b","",r.txt));row.appendChild(el("span","s6cmpFT",r.n+" "+r.from+" → "+r.to));list.appendChild(row);});card.appendChild(list);
 const btns=el("div","s6cmpBtns");const cf=tapBtn("Confirm",()=>{closeCmp();tryEquip(c,i,id,slot);},"small");cf.dataset.cmpconfirm="1";const cn=tapBtn("Cancel",()=>closeCmp(),"small");cn.dataset.cmpcancel="1";
 btns.appendChild(cn);btns.appendChild(cf);card.appendChild(btns);card.addEventListener("click",e=>e.stopPropagation());bg.addEventListener("click",e=>{e.preventDefault();closeCmp();});bg.appendChild(card);document.body.appendChild(bg);return bg;}
let sheetSel=null; // {slot} or {bag:index}
function charScreen(i,pick){closeCmp();const c=live.party[i];if(pick)sheetSel={slot:pick};const w=page("equip");w.classList.add("sheet");w.appendChild(head(c.name,()=>{sheetSel=null;partyScreen();}));
 const strip=el("div","s4pick");live.party.forEach((m,k)=>{const b=el("button","s4pk"+(k===i?" sel":""));b.dataset.pick=k;b.appendChild(pimg(m,"s4pkp"));const t=el("span","s4pkt");t.appendChild(el("b","",m.name));t.appendChild(el("span","",R.CLASSES[m.cls].name+" Lv "+m.lvl));b.appendChild(t);b.addEventListener("click",e=>{e.preventDefault();sheetSel=null;charScreen(k);});strip.appendChild(b);});w.appendChild(strip);
 const sl=statLine(c),sel=sheetSel,selItem=sel&&sel.bag!=null?c.bag[sel.bag]:null;
 const colA=el("div","s4colA"),colB=el("div","s4colB");
 // figure with slot squares down both sides
 const doll=el("div","s4doll");const L=el("div","s4slc"),Rr=el("div","s4slc");
 const mk=s=>{const it=c.equip[s]&&R.ITEMS[c.equip[s]],ok=selItem&&fits(selItem,s),b=el("button","s4sq"+(it?" full":"")+(sel&&sel.slot===s?" sel":"")+(ok?(R.canEquip(c,selItem,s)?" ok":" no"):""));b.dataset.slot=s;b.appendChild((it&&itemIc(c.equip[s],"big"))||icon(s));b.appendChild(el("span","s4sqn",it?it.n:SLN[s]));b.setAttribute("aria-label",SLN[s]+": "+(it?it.n:"empty"));
  b.addEventListener("click",e=>{e.preventDefault();if(selItem!=null&&fits(selItem,s)){/* t2657u: a glowing slot opens the same compare as Equip */if(R.canEquip(c,selItem,s))cmpPanel(c,i,selItem,s);else tryEquip(c,i,selItem,s);return;}sheetSel=sel&&sel.slot===s?null:{slot:s};charScreen(i);});return b;};
 ["helmet","chest","gloves","boots"].forEach(s=>L.appendChild(mk(s)));["weapon","offhand","acc1","acc2"].forEach(s=>Rr.appendChild(mk(s)));
 const pot=el("div","s4sq belt");pot.appendChild(icon("use"));pot.appendChild(el("span","s4sqn","Potions "+c.bag.filter(x=>R.ITEMS[x].slot==="use").length));Rr.appendChild(pot);
 doll.appendChild(L);doll.appendChild(figure(c));doll.appendChild(Rr);colA.appendChild(doll);
 const st=el("div","s4status");[["HP",c.hp+"/"+sl.hp],["MP",c.mp+"/"+R.maxMp(c)],["Level",c.lvl],["XP next",c.lvl>=R.CAP?"max":R.xpNeed(c.lvl)-c.xp],["STR",c.stats.str],["STA",c.stats.sta],["CON",R.conOf(c)],["MAN",c.stats.man],["CRIT",R.critChance(c)?Math.round(R.critChance(c)*100)+"%":"none"],["ATK",sl.atk],["MAG",sl.mag],["DEF",sl.def],["Armor",["","light","medium","any"][R.armorCap(c)]],["Race",R.RACES[c.race].name]].forEach(([k,v])=>{const r=el("div","s4st");r.appendChild(el("span","s4k",k));r.appendChild(el("span","s4v",String(v)));st.appendChild(r);});
 colA.appendChild(st);
 const acts=el("div","s4row");const pts=R.pointsEarned(c.lvl)-c.spent;const fl=statSess.get(c);const above=!!fl&&["str","sta","con","man"].some(k=>c.stats[k]>fl[k]);if(pts>0||above){const b=tapBtn(pts>0?"Spend "+pts+" points":"Change points",()=>statScreen(i),"small");b.dataset.stats=i;acts.appendChild(b);}
 if(c.skills.length<R.skillSlots(c.lvl)){const b=tapBtn("Learn skill",()=>skillScreen(i),"small");b.dataset.learn=i;acts.appendChild(b);}
 if(c.poison&&c.poison.f>0){const pz=el("div","s4sub","Weapon poisoned: +"+Math.round(c.poison.b*100)+"% damage, "+c.poison.f+" fight"+(c.poison.f>1?"s":"")+" left");pz.dataset.poisoned=c.poison.f;colA.appendChild(pz);}
 colA.appendChild(el("div","s4sub","Skills: "+c.skills.map(id=>R.SKILLS[c.cls].find(s=>s.id===id).n).join(", ")));if(acts.children.length)colA.appendChild(acts);
 // info line: what is selected, preview, actions
 const info=el("div","s4info");info.id="s4info";
 if(sel&&sel.slot){const s=sel.slot,cur=c.equip[s];info.appendChild(el("div","s4k",SLN[s]+": "+(cur?R.ITEMS[cur].n:"empty")+" - pick a backpack item that fits"));
  const opts=[...new Set(c.bag)].filter(id=>fits(id,s));if(!opts.length)info.appendChild(el("div","s4note","Nothing in the backpack fits here."));
  opts.forEach(id=>{const ok=R.canEquip(c,id,s);let pv=[];if(ok){const t=clone(c);R.equip(t,id,s);pv=diffText(sl,statLine(t));}
   const o=el("button","s4opt"+(ok?"":" off"));o.dataset.opt=id;withIc(o,id);o.appendChild(el("span","s4on",R.ITEMS[id].n+(ok?"":" (not allowed)")));const pe=el("span","s4pv");pv.forEach(x=>pe.appendChild(el("span",x[0]==="+"?"up":"down",x)));o.appendChild(pe);
   o.addEventListener("click",e=>{e.preventDefault();if(ok)cmpPanel(c,i,id,s);else tryEquip(c,i,id,s);});info.appendChild(o);});
  if(cur){const o=el("button","s4opt","Take off "+R.ITEMS[cur].n);o.dataset.unequip=s;withIc(o,cur);o.addEventListener("click",e=>{e.preventDefault();if(!R.unequip(c,s))toast("Backpack too heavy");capVitals(c);sheetSel=null;charScreen(i);});info.appendChild(o);}}
 else if(selItem){const it=R.ITEMS[selItem];const cnt=c.bag.filter(x=>x===selItem).length,fl=it.slot==="dish"?freshLeft(selItem):null;info.appendChild(el("div","s4k",it.n+(cnt>1?" ×"+cnt:"")+" · "+it.w+" kg"+(it.slot==="junk"||it.slot==="part"?" · "+(it.slot==="part"?"monster part":"junk")+", sells for "+it.v+" gold":"")+(it.slot==="ing"?" · ingredient, never spoils":"")));
  const tq=el("div","s6tap");tq.dataset.tap=selItem;const tqs=el("div","s6tapStats");itemQuick(selItem).forEach(([k,v])=>{const r=el("div","s6tapRow");r.appendChild(el("span","s4k",k));r.appendChild(el("span","s4v",String(v)));tqs.appendChild(r);});tq.appendChild(tqs);tq.appendChild(el("div","s6tapDesc",itemDesc(selItem,c)));info.appendChild(tq);
  if(it.slot==="dish")info.appendChild(el("div","s4sub",E.fxText(E.dish(it.dish).fx)+(fl!=null?" · spoils in "+fl+" steps":"")));
  let eqSlot=null;const slots=R.SLOTS.filter(s=>fits(selItem,s));if(slots.length){const s=slots.find(x=>!c.equip[x])||slots[0],ok=R.canEquip(c,selItem,s);if(ok)eqSlot=s;
   if(ok){const t=clone(c);R.equip(t,selItem,s);const pe=el("div","s4pv");pe.dataset.preview="1";const d=diffText(sl,statLine(t));(d.length?d:["no change"]).forEach(x=>pe.appendChild(el("span",x[0]==="+"?"up":x[0]==="-"?"down":"",x)));info.appendChild(pe);
    info.appendChild(el("div","s4note","Tap Equip or a glowing slot to compare."));}else info.appendChild(el("div","s4note bad","Your race or class can't use this."));}
  if(it.craft){const ut=el("div","s4sub",E.useText(selItem));ut.dataset.usetext=selItem;info.appendChild(ut);}
  if(it.slot==="craft"){const bt=el("div","s4sub",E.badText(selItem));bt.dataset.badtext=selItem;info.appendChild(bt);}
  const row=el("div","s4row s5rowR");if(eqSlot){const eb=tapBtn("Equip",()=>cmpPanel(c,i,selItem,eqSlot),"small");eb.dataset.equipcmp=eqSlot;row.appendChild(eb);}if(it.slot==="craft"&&it.poison){const pb=tapBtn("Apply to weapon",()=>{if(!c.equip.weapon){toast("Equip a weapon first");return;}c.bag.splice(sel.bag,1);c.poison={f:E.POISON_FIGHTS,b:E.POISON_BONUS};sheetSel=null;toast(c.name+"'s "+R.ITEMS[c.equip.weapon].n+" is poisoned for "+E.POISON_FIGHTS+" fights");charScreen(i);},"small");pb.dataset.applypoison="1";row.appendChild(pb);}
  if(it.slot==="craft"&&it.food){const eb=tapBtn("Eat",()=>{eatFrom(c,sel.bag);sheetSel=null;charScreen(i);},"small");eb.dataset.eat="1";row.appendChild(eb);}
  if(it.slot==="use"&&it.revive)row.appendChild(el("span","s4note","Use in battle")); /* t2398u: salts only in battle */
  if(it.slot==="use"&&!it.revive)row.appendChild(tapBtn("Use",()=>{c.bag.splice(sel.bag,1);R.useEffect(c,it,hpMul());sheetSel=null;charScreen(i);},"small"));
  if(it.slot==="dish"){const eb=tapBtn("Eat",()=>{eatFrom(c,sel.bag);sheetSel=null;charScreen(i);},"small");eb.dataset.eat="1";row.appendChild(eb);}
  if(it.special&&GEAR&&GEAR.ITEMS[selItem].use==="bag"){const ub=tapBtn("Use",()=>{sheetSel=null;useSpecial(selItem);},"small");ub.dataset.usegear=selItem;row.appendChild(ub);}
  if(it.special&&GEAR&&GEAR.ITEMS[selItem].use==="lockpick")row.appendChild(el("span","s4note","Use it at a puzzle door"));
  const dr=tapBtn("Drop",()=>{gone(c.bag[sel.bag]);c.bag.splice(sel.bag,1);sheetSel=null;charScreen(i);},"small");dr.dataset.drop="1";row.appendChild(dr);
  if(live.party.length>1){const gb=tapBtn(sel.give?"Give ▾":"‹ Give",()=>{sheetSel={bag:sel.bag,give:!sel.give};charScreen(i);},"small");gb.dataset.giveb="1";row.appendChild(gb);}
  info.appendChild(row);if(sel.give&&live.party.length>1){const gr=el("div","s4row s5give");gr.appendChild(el("span","s4k","Give to:"));live.party.forEach((m,j)=>{if(j===i)return;const ok=R.canCarry(m,selItem),b=tapBtn(m.name+(ok?"":" (too heavy)"),()=>{if(!ok)return;const kk=c.bag.indexOf(selItem);if(kk<0)return;c.bag.splice(kk,1);m.bag.push(selItem);sheetSel=null;toast(it.n+" given to "+m.name);charScreen(i);},"small");b.dataset.give=j;if(!ok)b.classList.add("off");gr.appendChild(b);});info.appendChild(gr);}}
 else info.appendChild(el("div","s4note dim","Tap a slot or a backpack item. Then tap the other to equip."));
 const wt=R.bagWeight(c),lim=R.carryLimit(c);colB.appendChild(el("div","s4lab","Backpack · Weight "+(Math.round(wt*10)/10)+" / "+lim+" kg"));colB.appendChild(bar(wt,lim,"wt"));
 const grid=el("div","s4bag"),stk=E.stacks(c.bag);stk.forEach(({id,n})=>{const k=c.bag.indexOf(id),it=R.ITEMS[id],fitsSel=sel&&sel.slot&&fits(id,sel.slot),b=el("button","s4sq"+(sel&&sel.bag===k?" sel":"")+(fitsSel?(R.canEquip(c,id,sel.slot)?" ok":" no"):""));b.dataset.bagi=k;b.dataset.item=id;
  b.dataset.n=n;b.appendChild(itemIc(id,"big")||icon(it.slot));b.appendChild(el("span","s4sqn",it.n));if(n>1)b.appendChild(el("span","s5cnt","×"+n));b.addEventListener("click",e=>{e.preventDefault();if(sel&&sel.slot&&fits(id,sel.slot)){/* t2657u: a glowing bag item after picking a slot opens the same compare */if(R.canEquip(c,id,sel.slot))cmpPanel(c,i,id,sel.slot);else tryEquip(c,i,id,sel.slot);return;}sheetSel=sel&&sel.bag===k?null:{bag:k};charScreen(i);});grid.appendChild(b);});
 for(let k=stk.length;k<Math.max(12,Math.ceil(stk.length/6)*6);k++)grid.appendChild(el("div","s4sq empty"));
 colB.appendChild(info);colB.appendChild(grid);const wrap=el("div","s4cols");wrap.appendChild(colA);wrap.appendChild(colB);w.appendChild(wrap);}
// t2437u Skeptic: taking off (or swapping out) HP gear at full HP left HP above the new max (223/218). Cap HP and MP after any gear change.
function capVitals(c){c.hp=Math.min(c.hp,R.maxHp(c,hpMul()));c.mp=Math.min(c.mp,R.maxMp(c));}
function tryEquip(c,i,id,s){if(R.equip(c,id,s)){capVitals(c);sheetSel=null;toast(c.name+" equipped "+R.ITEMS[id].n);}else toast(R.ITEMS[id].n+": your race or class can't use this");charScreen(i);}
function equipScreen(i,pick){charScreen(i,pick);}
function bagScreen(i){sheetSel=null;charScreen(i);}
// t2441u: move items between party members' bags (journal > Inventory > Move items). Outside fights only.
// Knocked-out members count (their salts can be taken out). The receiver's carry limit still applies: a move that would
// put them over it is refused with a short message. Stacked items get a quantity picker.
let mv={from:0,id:null,n:1};
function inFight(){return !!F||ui==="fight";}
function moveItem(from,to,id,n){if(inFight())return {ok:false,msg:"Not during a fight."};const g=live&&live.party[from],r=live&&live.party[to];n=Math.floor(Number(n));
 if(!g||!r||from===to||!R.ITEMS[id]||!(n>=1))return {ok:false,msg:"Pick an item and who gets it."};const have=g.bag.filter(x=>x===id).length;if(have<n)return {ok:false,msg:g.name+" does not have that many."};
 if(R.bagWeight({bag:r.bag.concat(Array(n).fill(id))})>R.carryLimit(r))return {ok:false,msg:r.name+"'s bag is full."};
 for(let k=0;k<n;k++){g.bag.splice(g.bag.lastIndexOf(id),1);r.bag.push(id);}return {ok:true,msg:(n>1?n+" × ":"")+R.ITEMS[id].n+" moved to "+r.name+"."};}
function moveItems(st,back){if(inFight()){toast("Not during a fight.");return false;}if(!live)return false;if(st)mv=Object.assign({from:mv.from,id:null,n:1},st);if(back!==undefined)moveItems.back=back;
 if(!live.party[mv.from])mv={from:0,id:null,n:1};const w=page("move-items");w.classList.add("s5mv");w.appendChild(head("Move items",()=>{closeUI();if(moveItems.back)moveItems.back();}));
 if(live.party.length<2){w.appendChild(el("div","s4note","Only one hero in the party. Nobody to move items to yet."));return true;}
 w.appendChild(el("div","s4lab","1. Whose bag?"));const gr=el("div","s5mvrow");live.party.forEach((m,j)=>{const b=tapBtn(m.name+(m.hp>0?"":" (knocked out)"),()=>moveItems({from:j}),"small"+(j===mv.from?" sel":""));b.dataset.mvfrom=j;gr.appendChild(b);});w.appendChild(gr);
 const c=live.party[mv.from],stk=E.stacks(c.bag);w.appendChild(el("div","s4lab","2. Which item?"));const list=el("div","s5mvrow");
 if(!stk.length)list.appendChild(el("div","s4note dim",c.name+"'s bag is empty."));
 stk.forEach(({id,n})=>{const b=tapBtn(R.ITEMS[id].n+(n>1?" ×"+n:""),()=>moveItems({from:mv.from,id,n:1}),"small"+(mv.id===id?" sel":""));b.dataset.mvitem=id;withIc(b,id);list.appendChild(b);});w.appendChild(list);
 const have=mv.id?c.bag.filter(x=>x===mv.id).length:0;if(!have)return true;mv.n=Math.min(Math.max(1,mv.n),have);
 if(have>1){w.appendChild(el("div","s4lab","How many?"));const q=el("div","s5mvrow s5mvq");const less=tapBtn("−",()=>{mv.n--;moveItems();},"small");less.dataset.mvless="1";less.setAttribute("aria-label","One less");if(mv.n<=1)less.disabled=true;
  const num=el("span","s5mvn",mv.n+" of "+have);num.dataset.mvn=mv.n;const more=tapBtn("+",()=>{mv.n++;moveItems();},"small");more.dataset.mvmore="1";more.setAttribute("aria-label","One more");if(mv.n>=have)more.disabled=true;
  const all=tapBtn("All",()=>{mv.n=have;moveItems();},"small");all.dataset.mvall="1";q.append(less,num,more,all);w.appendChild(q);}
 w.appendChild(el("div","s4lab","3. Give "+(mv.n>1?mv.n+" × ":"")+R.ITEMS[mv.id].n+" to:"));const tr=el("div","s5mvrow");
 live.party.forEach((m,j)=>{if(j===mv.from)return;const fits=R.bagWeight({bag:m.bag.concat(Array(mv.n).fill(mv.id))})<=R.carryLimit(m);const b=tapBtn(m.name+(m.hp>0?"":" (knocked out)")+(fits?"":" (bag full)"),()=>{const r=moveItem(mv.from,j,mv.id,mv.n);toast(r.msg);if(r.ok)mv={from:mv.from,id:c.bag.includes(mv.id)?mv.id:null,n:1};moveItems();},"small");b.dataset.mvto=j;if(!fits)b.classList.add("off");tr.appendChild(b);});w.appendChild(tr);return true;}
function addLoot(id){for(const c of live.party)if(R.canCarry(c,id)){c.bag.push(id);return c.name;}return null;}
// ---------- fights ----------
let F=null,fx=[],turnI=0,fcv=null,fctx=null,raf=0,motionEnd=0;
function startFight(mons,why){if(live){if(!Array.isArray(live.beasts))live.beasts=[];(mons||[]).forEach(m=>{const file=MON_FILE[m.n];if(file&&/^z[1-4]-/.test(file)&&!live.beasts.includes(file))live.beasts.push(file);});}F=new R.Fight(live.party,mons,live.diff,(live.seed+(++fightNo)*7919)|0);F.why=why;{const q=S.state&&S.state();F.bgv=q?((q.x*7+q.y*13+(why==="room"?3:0))%6+6)%6:fightNo%6;}FIGHT_ART.forEach(u=>spr(u.slice(11,-4)));turnI=0;nextAlive();fx=[];motionEnd=0;openUI("fight");ov.innerHTML="";ov.dataset.result="";
 const w=el("div","s4fight");const top=el("div","s4stage");fcv=el("canvas");fcv.id="fcv";top.appendChild(fcv);const log=el("div","s4log","");log.id="flog";top.appendChild(log);w.appendChild(top);
 const bot=el("div","s4fbot");bot.id="fbot";const en=el("div","s4enemies");en.id="fen";bot.appendChild(en);const pr=el("div","s4party");pr.id="fparty";bot.appendChild(pr);const mn=el("div","s4menu");mn.id="fmenu";bot.appendChild(mn);w.appendChild(bot);
 ov.appendChild(w);fctx=fcv.getContext("2d");sizeF();say(mons.map(m=>m.n).join(", ")+" appear!");drawMenu();h6("fightStart");cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
function sizeF(){const d=Math.min(2,window.devicePixelRatio||1),w=Math.round(fcv.clientWidth*d),h=Math.round(fcv.clientHeight*d);if(w&&h&&(fcv.width!==w||fcv.height!==h)){fcv.width=w;fcv.height=h;}}
function say(t){const l=$("flog");if(l)l.textContent=displayText(t);}
function nextAlive(){while(turnI<live.party.length&&live.party[turnI].hp<=0)turnI++;}
// t2409u VER 88: a zone 4 status word after the name (shields others / shielded / enraged); zones 1-3 show nothing new
function monTagText(m){const t=R.monTag?R.monTag(F,m):"";return t?" ("+t+")":"";}
function targets(cmd,arg){return F.m.map((m,i)=>m.hp>0?{t:m.n+" · "+m.hp+monTagText(m),fn:()=>doAct(cmd,arg,i),d:{tgt:i}}:null).filter(Boolean);}
function heroMenu(anchor){if(!F||F.over)return;const c=live.party[turnI];const sk=c.skills.map(id=>R.SKILLS[c.cls].find(x=>x.id===id)).filter(Boolean);
 const skItem=s=>({t:s.n+" "+s.mp+"MP",off:c.mp<s.mp,d:{sk:s.id},...((s.k==="phys"||s.k==="magic")&&!s.all?{kids:()=>targets("skill",s.id)}:{fn:()=>doAct("skill",s.id,0)})});
 const phys=sk.filter(s=>s.k==="phys"||s.k==="guard"),mag=sk.filter(s=>s.k==="magic"||s.k==="heal");
 const items=[{t:"Defend",d:{cmd4:"defend"},fn:()=>doAct("defend",null,0)},{t:"Attack",d:{cmd4:"attack"},kids:()=>targets("attack")}];
 if(phys.length)items.push({t:"Skill",d:{cmd4:"skill"},kids:()=>phys.map(skItem)});
 if(mag.length)items.push({t:"Spells",d:{cmd4:"spells"},kids:()=>mag.map(skItem)});
 items.push({t:"Items",d:{cmd4:"item"},kids:()=>[...new Set(c.bag)].filter(id=>R.ITEMS[id].slot==="use").map(id=>R.ITEMS[id].revive?{t:R.ITEMS[id].n+" x"+c.bag.filter(x=>x===id).length,d:{item:id},kids:()=>{const ko=live.party.map((m,j)=>m.hp<=0?{t:"Wake "+m.name,fn:()=>doAct("item",id,j),d:{revive:j}}:null).filter(Boolean);return ko.length?ko:[{t:"Nobody is knocked out",off:true}];}}:({t:R.ITEMS[id].n+" x"+c.bag.filter(x=>x===id).length,fn:()=>doAct("item",id,turnI),d:{item:id}}))},
  {t:"Run",d:{cmd4:"run"},fn:()=>doAct("run",null,0)});return slideTree(items,0);}
let rotTop=0;
// fight v4: tabs stack in turn order; the member whose turn it is is the top tab, the one who just acted goes to the bottom
function turnOrder(){const n=live.party.length;if(F&&!F.over&&live.party[turnI]&&live.party[turnI].hp>0)rotTop=turnI;rotTop=Math.min(rotTop,n-1);return [...Array(n).keys()].map(k=>(rotTop+k)%n);}
function drawParty(){const pr=$("fparty");if(!pr)return;const was=pr.dataset.top;pr.innerHTML="";const ord=turnOrder();pr.dataset.top=ord[0];if(was!==undefined&&was!==String(ord[0])){pr.classList.remove("rot");void pr.offsetWidth;pr.classList.add("rot");}ord.forEach(i=>{const c=live.party[i];const now=i===turnI&&!F.over&&c.hp>0,r=el("div","s4pr"+(now?" now":"")+(c.hp<=0?" dead":""));const mx=R.maxHp(c,hpMul());
 const nb=el("button","s4nl");nb.dataset.hero=i;nb.disabled=!now;const top=el("span","s4nlt");top.appendChild(el("span","s4arrow",now?"‹":""));top.appendChild(el("span","s4nn",c.name));nb.appendChild(top);
 const bars=el("span","s4bars");bars.appendChild(bar(c.hp,mx,"hp"));bars.appendChild(bar(c.mp,R.maxMp(c),"mp"));nb.appendChild(bars);/* t2432u: labelled HP and MP numbers for every member, under the bars */const vals=el("span","s4vals");vals.appendChild(el("span","s4hpv","HP "+c.hp+"/"+mx));vals.appendChild(el("span","s4mpv","MP "+c.mp+"/"+R.maxMp(c)));nb.appendChild(vals);nb.addEventListener("click",e=>{e.preventDefault();if(now)heroMenu(nb);});r.appendChild(nb);pr.appendChild(r);});
 const en=$("fen");if(en){en.textContent=F.m.filter(m=>m.hp>0).map(m=>m.n+monTagText(m)).join(" · ");}}
function drawMenu(){drawParty();const mn=$("fmenu");if(!mn)return;mn.innerHTML="";const fw=document.querySelector(".s4fight");if(fw)fw.classList.toggle("over",!!F.over);if(F.over){endFight();return;}const c=live.party[turnI];mn.appendChild(el("div","s4who",c.name+"'s turn - tap the name"));}
// Presentation events use the engine's actual target indices, never names or a second RNG roll.
function motionTime(){return Math.max(performance.now(),motionEnd);}
function doAct(cmd,arg,targ){closeBranch();const c=live.party[turnI],before=F.m.map(m=>m.hp),s=cmd==="skill"&&R.SKILLS[c.cls].find(x=>x.id===arg),valid=s&&c.skills.includes(arg)&&c.mp>=s.mp;
 const text=F.act(turnI,cmd,arg,targ),t0=motionTime();let animated=false;
 F.m.forEach((m,i)=>{if(m.hp<before[i]){fx.push({i,hero:turnI,t0,dur:850,k:valid?(s.k==="magic"?"magic":"skill"):"hit"});animated=true;}});
 if(valid&&s.k==="heal"){fx.push({ally:true,t0,dur:850,k:"heal"});animated=true;}if(animated)motionEnd=t0+850;
 say(text);turnI++;nextAlive();if(!F.over&&turnI>=live.party.length){const out=F.monstersTurn(),fight=F;
  (F.motionHits||[]).forEach(e=>{const t0=motionTime();fx.push({...e,k:"enemy",t0,dur:650});motionEnd=t0+650;});
  setTimeout(()=>{if(out.length&&F===fight&&!F.over)say(out.join(". "));},450);turnI=0;nextAlive();}drawMenu();}
// t2397u: after a win (boss too) or a successful run, every knocked-out member wakes with exactly 1 HP and stays there until healed.
// Called after XP is shared, so knocked-out members get no XP. A whole-party KO is still a loss (back to the last save).
function wakeKO(){live.party.forEach(c=>{if(c.hp<=0)c.hp=1;});}
// t2442u: loading restores HP and MP exactly as saved (live = deep copy of the save). Only saves made before this marker existed
// (VER 79 and older could store a knocked-out member at exactly 0 HP) get that 0 turned into 1 HP; every other stored value is kept.
function wakeLoaded(){if(!live||!Array.isArray(live.party)||(save&&save.hpv>=1))return;live.party.forEach(c=>{if(c.hp===0)c.hp=1;});}
// t2404u: companions keep unspent stat points; remind while any are left (on joining and on level-up)
function pointsLeft(c){return Math.max(0,R.pointsEarned(c.lvl)-c.spent);}
function pointsReminder(){if(!live)return "";const w=live.party.filter(c=>pointsLeft(c)>0);if(!w.length)return "";
 return w.map(c=>c.name+" has "+pointsLeft(c)+" stat point"+(pointsLeft(c)>1?"s":"")).join(", ")+" to spend. Tap Party to spend them.";}
function endFight(){const aftermath=live.party.map(c=>({hp:c.hp,maxHp:R.maxHp(c,hpMul())}));const mn=$("fmenu"),how=F.over;closeBranch();const fe=$("fen");if(fe)fe.style.display="none";
 if(how==="win"){const rw=F.rewards((live.seed^fightNo*31)>>>0);live.gold+=rw.gold;const ups=[];live.party.forEach(c=>{if(c.hp>0){const g=R.gainXp(c,rw.xp,hpMul());if(g.length)ups.push(c.name+" reached level "+c.lvl+"! HP and MP fully restored."+(c.skills.length<R.skillSlots(c.lvl)?" New skill ready!":""));}});wakeKO();
  const jn=rw.junk.concat(E.drops(F.m[0].zone,(live.seed^fightNo*131)>>>0)).map(id=>{const who=addLoot(id);return {id,t:R.ITEMS[id].n+(who?"":" (no room, left behind)")};});
  mn.appendChild(el("div","s4win","Victory!"));const bossWon=F.m.some(m=>m.boss);const b=tapBtn("Continue",()=>{F=null;closeUI();if(bossWon)h6("bossWon");else h6("fightContinue",aftermath);},"s4go small");b.id="fdone";mn.appendChild(b);
  {const nt=el("div","s4note","+"+rw.xp+" XP   +"+rw.gold+" gold"+(jn.length?"   Found: ":""));/* t2476u: each found item with its icon; same text as before */jn.forEach((x,k)=>{const sp=el("span","s4loot",x.t+(k<jn.length-1?", ":""));sp.dataset.loot=x.id;withIc(sp,x.id);nt.appendChild(sp);});mn.appendChild(nt);}if(ups.length){mn.appendChild(el("div","s4note glowt",ups.join(". ")));lvlPopup(ups);}tickBuffs();ov.dataset.result="win";}
 else if(how==="lose"){ov.dataset.result="lose";setTimeout(()=>{if(F&&F.over==="lose")lossLoad();},0);}
 else{wakeKO();const b=tapBtn("Continue",()=>{F=null;closeUI();},"s4go small");b.id="fdone";mn.appendChild(el("div","s4note","You got away."));mn.appendChild(b);tickBuffs();ov.dataset.result="ran";}
 drawParty();h6("fightEnd",how);}
// ---- fight drawing t1962u: side view, original pixel sprites (art6/fight), big foes left, small party right, maze backdrops in zone colour (t1963u/t1964u) ----
const ZC=[null,[150,112,60],[92,108,62],[70,92,124],[128,52,50],[96,62,128]];
// zone palettes, same values as tex.js (tex.js itself untouched)
const ZP=[null,[[205,170,95],[235,205,130]],[[85,110,80],[120,135,100]],[[90,120,160],[130,160,200]],[[170,70,70],[205,100,90]],[[80,55,120],[115,80,155]]];
const MON_FILE={"Rat":"z1-rat","Slime":"z1-slime","Big bug":"z1-bigbug","Cave bat":"z1-bat","Giant spider":"z1-spider","Mud toad":"z1-toad","Fungus creeper":"z1-fungus",
 "Goblin":"z2-goblin","Orc":"z2-orc","Fairy":"z2-fairy","Kobold":"z2-kobold","Wild boar":"z2-boar","Pixie swarm":"z2-pixies","Hobgoblin brute":"z2-hobgoblin",
 "Centaur":"z3-centaur","Werewolf":"z3-werewolf","Skeleton":"z3-skeleton","Ghoul":"z3-ghoul","Harpy":"z3-harpy","Dire wolf":"z3-direwolf","Wraith":"z3-wraith",
 "Minotaur":"z4-minotaur","Griffin":"z4-griffin","Lizard man":"z4-lizardman","Stone gargoyle":"z4-gargoyle","Manticore":"z4-manticore","Ogre warlord":"z4-ogre","Giant scorpion":"z4-scorpion",
 "Basilisk":"z5-basilisk","Dragon":"z5-dragon","Hydra":"z5-hydra","Wyvern":"z5-wyvern","Chimera":"z5-chimera","Salamander":"z5-salamander","Shadow drake":"z5-shadowdrake","Iron Golem":"boss-golem"};
const FIGHT_ART=Object.values(MON_FILE).concat(["human-warrior","human-rogue","human-archer","human-mage","elf-warrior","elf-rogue","elf-archer","elf-mage","dwarf-warrior","dwarf-rogue","dwarf-archer","cat-warrior","cat-rogue","cat-mage"].map(x=>"p-"+x)).map(n=>"art6/fight/"+n+".png");
const SPR={};function spr(n){let im=SPR[n];if(!im){im=new Image();im.src="art6/fight/"+n+".png";SPR[n]=im;}return im.complete&&im.naturalWidth?im:null;}
// sprite key is the monster name (kind alone repeats across zones); fallback by (zone,kind)
function monKey(m){if(m.boss)return "boss-golem";return MON_FILE[m.n]||MON_FILE[(R.MONSTERS[m.zone]||[])[m.kind]]||"z1-rat";}
function heroKey(c){const r=c.race==="human"||!c.race?"human":c.race,k="p-"+r+"-"+c.cls;return FIGHT_ART.includes("art6/fight/"+k+".png")?k:"p-human-"+c.cls;}
// layout: feet point + fit box (fractions of the canvas) per pack size; Iron Golem fills most of the left half
const SLOTS={1:[[.3,.86,.56,.40]],2:[[.2,.70,.40,.30],[.43,.93,.42,.30]],3:[[.17,.66,.33,.24],[.45,.78,.34,.24],[.22,.95,.34,.24]],4:[[.16,.66,.30,.20],[.45,.74,.30,.20],[.19,.88,.30,.20],[.47,.97,.30,.20]]};
function fitBox(im,bw,bh){if(!im)return[bw*.8,bh*.8];const k=Math.min(bw/im.naturalWidth,bh/im.naturalHeight);return[im.naturalWidth*k,im.naturalHeight*k];}
function monRect(i,W,H){const n=Math.min(4,F.m.length),m=F.m[i];if(m.boss){const im=spr("boss-golem"),[w,h]=fitBox(im,W*.70,Math.min(H*.56,W*1.15));return{x:Math.max(w*.5+2,W*.27),y:H*.80,w,h};}
 const sl=SLOTS[n][i%4]||SLOTS[4][i%4],fy=H*0.6,y=fy+(H*0.985-fy)*((sl[1]-0.6)/0.4),im=spr(monKey(m)),late=(m.zone||0)>=4,big=BIG_FOE[m.n]||(late?1:0),k=big||1;let[w,h]=fitBox(im,W*sl[2]*k,Math.min(H*sl[3],W*sl[2]*1.25)*k);
 if(!big){const c=heroH(W,H)*1.1;if(h>c){w*=c/h;h=c;}}
 const x=Math.max(w*.5+2,W*sl[0]),yy=late?Math.max(fy+H*.07,y-H*.10):Math.min(H*.985,y+H*.015);return{x,y:yy,w,h};}
// t1985u-t1987u: zones 1-3 regular foes is drawn at about companion height; zone 4-5 foes stay large and stand mid-screen; Dragon and Manticore a little larger than before
const BIG_FOE={Manticore:1.2,Dragon:1.2};
function heroH(W,H){return Math.max(30,Math.min(H*.078,W*.15));}
function hpos(i,W,H){const fy=H*0.6;return[W*(0.735+0.06*i),fy+(H-fy)*(0.30+0.19*i)];}
function mpos(i,W,H){const r=monRect(i,W,H);return[r.x,r.y-r.h*0.5];}
function scl(W,H){return Math.min(W/8.5,H/3.4);}
// t1996u: contact shadow under the sprite's real lowest pixels (cached per image), flattened on the floor
const FOOT=new WeakMap();
function footOf(im){if(FOOT.has(im))return FOOT.get(im);let f={c:.5,s:.84,b:1};try{const w=im.naturalWidth,h=im.naturalHeight,cv=document.createElement("canvas");cv.width=w;cv.height=h;const c=cv.getContext("2d");c.drawImage(im,0,0);const d=c.getImageData(0,0,w,h).data;let bot=-1;for(let y=h-1;y>=0&&bot<0;y--)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>40){bot=y;break;}
 if(bot>=0){const top=Math.max(0,bot-Math.max(2,Math.round(h*.12)));let l=w,r=-1;for(let y=top;y<=bot;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>40){if(x<l)l=x;if(x>r)r=x;}f={c:(l+r+1)/2/w,s:Math.max(.3,(r-l+1)/w),b:(bot+1)/h};}}catch(e){}FOOT.set(im,f);return f;}
function drawSprite(g,im,x,y,w,h,flash,sy){g.save();g.imageSmoothingEnabled=false;g.fillStyle="rgba(0,0,0,.42)";g.beginPath();
 if(sy==null)g.ellipse(x,y-h*0.02,w*0.42,Math.max(3,h*0.05),0,0,7);else{const f=footOf(im),gy=sy;g.ellipse(x-w/2+w*f.c,gy-h*(1-f.b)-1,w*f.s*0.55+2,Math.max(2,w*f.s*0.09),0,0,7);}g.fill();
 g.drawImage(im,Math.round(x-w/2),Math.round(y-h),Math.round(w),Math.round(h));if(flash){g.globalCompositeOperation="lighter";g.globalAlpha=0.5;g.drawImage(im,Math.round(x-w/2),Math.round(y-h),Math.round(w),Math.round(h));}g.restore();}
// All offsets are temporary transforms around the approved, unchanged rest rectangles.
function activeMotion(i,t){return fx.find(e=>e.i===i&&t>=e.t0&&t<e.t0+e.dur);}
function monPose(i,W,H,t){const r=monRect(i,W,H),e=activeMotion(i,t),p=e?(t-e.t0)/e.dur:0,a=Math.sin(p*Math.PI);let dx=0,dy=0,rot=0,sx=1,sy=1;
 if(e){if(e.k==="enemy"){const [hx,hy]=hpos(e.hero,W,H),reach=Math.sin(Math.min(1,Math.max(0,(p-.15)/.55))*Math.PI);
   dx=(hx-r.x-r.w*.32)*reach*(F.m[i].boss?.32:1);dy=(hy-r.y)*reach;rot=-.09*Math.sin(p*6.283);}
  else if(e.k==="magic"){dy=-r.h*.12*a;rot=Math.sin(p*18)*.045*a;sx=1-.06*a;sy=1+.06*a;}
  else if(e.k==="skill"){dy=r.h*.035*a;sx=1+.14*a;sy=1-.13*a;rot=Math.sin(p*12)*.05*a;}
  else{dx=-r.w*.16*a;rot=-.17*a;}}
 else if(!F.over){dx=Math.sin(t/630+i*1.7)*Math.min(3,W*.004);sy=1+Math.sin(t/490+i)*.012;}
 return {r,e,p,dx,dy,rot,sx,sy};}
function drawMon(g,m,i,W,H,t,flash){const q=monPose(i,W,H,t),{r,dx,dy,rot,sx,sy}=q,im=spr(monKey(m)),bob=Math.round(Math.sin(t/(m.boss?650:420)+i)*Math.max(1,r.h*0.012));if(!im)return r;
 g.save();g.translate(r.x+dx,r.y+dy);g.rotate(rot);g.scale(sx,sy);g.translate(-r.x,-r.y);
 if(m.boss)drawSprite(g,im,r.x,r.y+bob,r.w,r.h,flash);else drawSprite(g,im,r.x,r.y+bob,r.w,r.h,flash,r.y);
 if(m.boss){g.save();g.globalCompositeOperation="lighter";const p=0.5+0.5*Math.sin(t/300),cx=r.x+r.w*0.0,cy=r.y-r.h*0.72,rg=g.createRadialGradient(cx,cy,1,cx,cy,r.w*0.22);rg.addColorStop(0,"rgba(190,120,255,"+(0.35*p+0.15)+")");rg.addColorStop(1,"rgba(120,60,255,0)");g.fillStyle=rg;g.fillRect(cx-r.w*.3,cy-r.w*.3,r.w*.6,r.w*.6);g.restore();}g.restore();return r;}
function drawHero(g,c,x,y,hh,t,act,i){const im=heroArt(c),dead=c.hp<=0,hit=fx.find(e=>e.k==="enemy"&&e.hero===i&&t>=e.t0&&t<e.t0+e.dur),p=hit?(t-hit.t0)/hit.dur:0,impact=hit&&p>.38&&p<.8;
 const action=fx.find(e=>e.hero===i&&e.k!=="enemy"&&t>=e.t0&&t<e.t0+e.dur);g.save();if(dead&&!hit){g.globalAlpha=0.5;g.translate(x,y);g.rotate(-1.35);g.translate(-x,-y);}
 const lunge=action?-hh*.3*Math.sin((t-action.t0)/action.dur*Math.PI):act?-hh*.18:0;
 if(!dead&&F&&!F.over){x+=Math.sin(t/570+i)*hh*.025;y+=Math.sin(t/430+i)*hh*.018;}if(impact)x+=hh*.13*Math.sin(p*25);
 if(im){const w=hh*im.naturalWidth/im.naturalHeight;drawSprite(g,im,x+lunge,y,w,hh,impact);}g.restore();}
// Different silhouettes and contact marks: single slash, crushing double arc, orbiting spell rings.
function motionMarks(g,e,W,H,t){const p=(t-e.t0)/e.dur;if(p<0||p>1)return;const r=monRect(e.i,W,H),s=scl(W,H);g.save();g.globalAlpha=Math.sin(p*Math.PI);g.lineWidth=Math.max(2,s*.045);
 if(e.k==="enemy"){const [x,y]=hpos(e.hero,W,H),q=monPose(e.i,W,H,t),sx=r.x+q.dx+r.w*.28,sy=r.y+q.dy-r.h*.45;
  if(p>.25&&p<.8){g.strokeStyle=e.pulse?"#bf9aff":"#ffe3a1";g.beginPath();g.moveTo(sx,sy);g.quadraticCurveTo((sx+x)/2,y-s*.45,x,y-heroH(W,H)*.5);g.stroke();
   g.beginPath();g.arc(x,y-heroH(W,H)*.5,s*.16,0,7);g.stroke();}}
 else{const x=r.x,y=r.y-r.h*.5;
  if(e.k==="magic"){g.strokeStyle="#bda0ff";for(let k=0;k<3;k++){g.beginPath();g.ellipse(x,y+(k-1)*r.h*.23,r.w*(.35+.12*Math.sin(p*9+k)),r.h*.1,p*3+k,0,7);g.stroke();}if(p>.4)burst(g,x,y,s*.65,(p-.4)/.6,"magic");}
  else if(e.k==="skill"){g.strokeStyle="#6ff5e0";for(let k=0;k<2;k++){g.beginPath();g.arc(x,y,r.w*(.3+k*.15),p*9+k, p*9+k+Math.PI*1.35);g.stroke();}g.beginPath();g.moveTo(x-r.w*.35,y-r.h*.35);g.lineTo(x,y+r.h*.2);g.lineTo(x+r.w*.35,y-r.h*.35);g.stroke();}
  else{g.strokeStyle="#fff0c5";g.beginPath();g.moveTo(x-r.w*.4,y-r.h*.35);g.lineTo(x+r.w*.4,y+r.h*.3);g.stroke();}}
 g.restore();}
function burst(g,x,y,s,p,k){const n=18;g.save();g.globalCompositeOperation="lighter";const r=s*(0.3+p*1.1);
 const rg=g.createRadialGradient(x,y,1,x,y,r);const c1=k==="heal"?"120,230,255":"170,110,255",c2=k==="heal"?"60,140,255":"70,120,255";rg.addColorStop(0,"rgba(255,255,255,"+(1-p)+")");rg.addColorStop(0.35,"rgba("+c1+","+(0.9*(1-p))+")");rg.addColorStop(1,"rgba("+c2+",0)");g.fillStyle=rg;g.beginPath();g.arc(x,y,r,0,7);g.fill();
 for(let i=0;i<n;i++){const a=i/n*6.283+p*2,d=r*(0.4+0.6*p),q=Math.max(2,Math.round(s*0.05*(1-p)+2));g.fillStyle="rgba("+(i%2?c1:c2)+","+(1-p)+")";g.fillRect(Math.round(x+Math.cos(a)*d),Math.round(y+Math.sin(a)*d),q,q);}
 g.strokeStyle="rgba("+c1+","+(1-p)+")";g.lineWidth=s*0.03;g.beginPath();g.arc(x,y,r*0.7,0,7);g.stroke();g.restore();}
// ---- maze backdrops: 6 maze spots per zone (hall, left turn, right turn, pillared room, crossroads, dead-end alcove), painted low-res for a pixel finish ----
const BGC=new Map();
function bgPaint(W,H,z,v){const PX=3,w=Math.ceil(W/PX),h=Math.ceil(H/PX),cv=document.createElement("canvas");cv.width=w;cv.height=h;const g=cv.getContext("2d"),P=ZP[z]||ZP[1],r=R.rng((z*7919+v*104729+11)>>>0);
 const col=(k,j)=>{const a=P[0],b=P[1];return "rgb("+((a[0]+(b[0]-a[0])*j)*k|0)+","+((a[1]+(b[1]-a[1])*j)*k|0)+","+((a[2]+(b[2]-a[2])*j)*k|0)+")";};
 const fy=Math.round(h*(v===5?0.56:0.6));g.fillStyle=col(0.12,0);g.fillRect(0,0,w,h);
 const wall=(x0,x1,y0,y1,k)=>{const bh=Math.max(4,Math.round(h/22));for(let y=y0,row=0;y<y1;y+=bh,row++){for(let x=x0-((row%2)*bh);x<x1;){const bw=Math.round(bh*(1.6+r()*1.2)),l=k*(0.75+r()*0.35);
   g.fillStyle=col(0.42*l,r());g.fillRect(x+1,y+1,bw-1,bh-1);g.fillStyle=col(0.6*l,1);g.fillRect(x+1,y+1,bw-1,1);g.fillStyle=col(0.2*l,0);g.fillRect(x+1,y+bh-1,bw-1,1);if(r()<0.08){g.fillStyle=col(0.15,0);g.fillRect(x+2+(r()*bw|0),y+2,1,bh-3);}x+=bw;}}
  g.fillStyle=col(0.08,0);g.fillRect(x0,y1-1,x1-x0,1);};
 const hole=(cx,hw,top,glow)=>{g.fillStyle="#050309";g.beginPath();g.moveTo(cx-hw,fy);g.lineTo(cx-hw,top+hw);g.arc(cx,top+hw,hw,Math.PI,0);g.lineTo(cx+hw,fy);g.closePath();g.fill();
  if(glow){const ag=g.createRadialGradient(cx,fy,1,cx,fy,hw*1.6);ag.addColorStop(0,col(0.5,1).replace("rgb","rgba").replace(")",",.45)"));ag.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=ag;g.fill();}
  g.strokeStyle=col(0.28,0);g.lineWidth=2;g.stroke();};
 const pillar=(x,pw,top,bot,k)=>{for(let i=0;i<pw;i++){const j=i/pw;g.fillStyle=col(k*(0.25+0.55*Math.sin(j*Math.PI)),0.6);g.fillRect(x-pw/2+i,top,1,bot-top);}g.fillStyle=col(0.12,0);g.fillRect(x-pw/2-1,top,pw+2,2);g.fillRect(x-pw/2-1,bot-2,pw+2,2);
  for(let y=top+pw;y<bot-2;y+=Math.max(4,pw)){g.fillStyle=col(0.14,0);g.fillRect(x-pw/2,y,pw,1);}};
 wall(0,w,0,fy,1);
 if(v===0){hole(w*0.5,w*0.12,h*0.17,true);pillar(w*0.28,Math.max(4,w*0.04),0,fy,1);pillar(w*0.72,Math.max(4,w*0.04),0,fy,1);}
 if(v===1||v===2){const L=v===1,ex=L?0:w,ix=L?w*0.32:w*0.68;g.fillStyle="#050309";g.beginPath();g.moveTo(ex,0);g.lineTo(ix,h*0.12);g.lineTo(ix,fy);g.lineTo(ex,h);g.closePath();g.fill();
  for(let k=0;k<7;k++){const f=k/7,x=ex+(ix-ex)*f;g.fillStyle=col(0.18+0.3*f,0.5);g.fillRect(Math.min(x,ix)|0,(h*0.12*f)|0,Math.max(1,Math.abs(ix-ex)/7)|0,(fy+(h-fy)*(1-f)-h*0.12*f)|0);}
  const gx=ex+(ix-ex)*0.55,gg=g.createRadialGradient(gx,fy*0.9,1,gx,fy*0.9,w*0.25);gg.addColorStop(0,col(0.6,1).replace("rgb","rgba").replace(")",",.3)"));gg.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gg;g.fillRect(0,0,w,h);
  pillar(ix,Math.max(5,w*0.05),0,fy,1.1);pillar(L?w*0.8:w*0.2,Math.max(4,w*0.04),0,fy,0.9);}
 if(v===3){[0.14,0.38,0.62,0.86].forEach((p,i)=>pillar(w*p,Math.max(6,w*0.07),0,fy,1.15));g.fillStyle=col(0.2,0);g.fillRect(0,(h*0.08)|0,w,2);}
 if(v===4){hole(w*0.3,w*0.09,h*0.24,true);hole(w*0.7,w*0.09,h*0.24,true);pillar(w*0.5,Math.max(5,w*0.05),0,fy,1);}
 if(v===5){g.fillStyle=col(0.16,0);g.fillRect(w*0.36,h*0.2,w*0.28,fy-h*0.2);wall(w*0.38,w*0.62,h*0.22,fy,0.7);
  for(let k=0;k<14;k++){g.fillStyle=col(0.3+r()*0.3,r());const s=2+(r()*4|0);g.fillRect((w*0.3+r()*w*0.4)|0,fy-s,s+2,s);}
  for(let k=0;k<5;k++){g.fillStyle=col(0.9,1);g.fillRect((w*0.4+r()*w*0.2)|0,(h*0.3+r()*h*0.2)|0,1,2+(r()*3|0));}}
 // flagstone floor, perspective, zone tinted
 for(let y=fy;y<h;y++){const f=(y-fy)/(h-fy);g.fillStyle=col(0.2+0.12*f,0.3);g.fillRect(0,y,w,1);}
 g.fillStyle=col(0.1,0);const vx=v===1?w*0.3:v===2?w*0.7:w*0.5;for(let x=-w;x<w*2;x+=w/7){for(let y=fy;y<h;y++){const f=(y-fy)/(h-fy);g.fillRect((vx+(x-vx)*(0.35+0.65*f))|0,y,1,1);}}
 for(let k=1;k<7;k++){const y=(fy+(h-fy)*(k*k/49))|0;g.fillRect(0,y,w,1);}
 for(let k=0;k<40;k++){g.fillStyle=col(0.32+r()*0.15,r());g.fillRect(r()*w|0,(fy+r()*(h-fy))|0,1+(r()*2|0),1);}
 g.fillStyle=col(0.06,0);g.fillRect(0,fy,w,2);
 [0.03,0.97].forEach(p=>pillar(w*p,Math.max(6,w*0.07),0,h,1.2));
 [0.2,0.8].forEach(p=>{const x=w*p|0,y=h*0.36|0;g.fillStyle="#1a1018";g.fillRect(x-1,y,3,h*0.1|0);g.fillStyle="#3a2a20";g.fillRect(x-3,y,7,2);});
 const vg=g.createRadialGradient(w/2,h*0.5,Math.min(w,h)*0.3,w/2,h*0.5,Math.max(w,h)*0.75);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.6)");g.fillStyle=vg;g.fillRect(0,0,w,h);
 const out=document.createElement("canvas");out.width=W;out.height=H;const o=out.getContext("2d");o.imageSmoothingEnabled=false;o.drawImage(cv,0,0,w*PX,h*PX);
 o.strokeStyle="#0a0610";o.lineWidth=Math.max(3,W/120);o.strokeRect(0,0,W,H);o.strokeStyle="rgba(200,160,90,.35)";o.lineWidth=1;o.strokeRect(W/120+2,W/120+2,W-W/60-4,H-W/60-4);return out;}
function bg(g,W,H,z,v){v=v||0;const k=W+"x"+H+"z"+z+"v"+v;let c=BGC.get(k);if(!c){if(BGC.size>6)BGC.clear();c=bgPaint(W,H,z,v);BGC.set(k,c);}g.drawImage(c,0,0);
 const t=performance.now();[0.2,0.8].forEach((p,i)=>{const x=W*p,y=H*0.35,f=1+Math.sin(t/90+i*2)*0.06+Math.sin(t/37+i)*0.04,rg=g.createRadialGradient(x,y,2,x,y,H*0.45*f);
  rg.addColorStop(0,"rgba(255,170,80,.34)");rg.addColorStop(0.4,"rgba(255,120,40,.1)");rg.addColorStop(1,"rgba(255,120,40,0)");g.fillStyle=rg;g.fillRect(0,0,W,H);
  const q=Math.max(2,Math.round(W/130));g.fillStyle="rgba(255,210,120,.95)";g.fillRect(Math.round(x-q),Math.round(y-q*4*f),q*2,Math.round(q*4*f));g.fillStyle="rgba(255,250,220,.95)";g.fillRect(Math.round(x-q/2),Math.round(y-q*2),q,q*2);});}
let lastT=0;const ftimes=[];
function loop(t){if(!F||!fcv){return;}sizeF();const t0=performance.now(),g=fctx,W=fcv.width,H=fcv.height,z=F.m[0].zone;bg(g,W,H,z,F.bgv);
 const s=scl(W,H),hh=heroH(W,H);
 // back-to-front so lower (nearer) foes overlap the ones behind
 const order=F.m.map((m,i)=>i).sort((a,b)=>monRect(a,W,H).y-monRect(b,W,H).y);
 order.forEach(i=>{const m=F.m[i];if(m.hp<=0&&!fx.some(e=>e.i===i&&e.k!=="enemy"&&t<e.t0+e.dur))return;const f=fx.find(e=>e.i===i&&e.k!=="enemy"&&t>=e.t0&&t-e.t0<120);g.save();const r=drawMon(g,m,i,W,H,t,!!f);g.restore();
  const ty=r.y-r.h-Math.max(10,s*0.1),bw=Math.min(r.w*0.8,W*0.3),fs=Math.max(10,Math.round(s*0.17));
  g.font="700 "+fs+"px Georgia,serif";g.textAlign="center";g.fillStyle="rgba(0,0,0,.7)";g.fillText(m.n,r.x+1,ty-fs*0.3+1);g.fillStyle="#f3d9b0";g.fillText(m.n,r.x,ty-fs*0.3);g.textAlign="start";
  g.fillStyle="#22152e";g.fillRect(r.x-bw/2,ty,bw,Math.max(3,s*0.07));g.fillStyle="#c04060";g.fillRect(r.x-bw/2,ty,bw*m.hp/m.max,Math.max(3,s*0.07));});
 live.party.forEach((c,i)=>{const [x,y]=hpos(i,W,H);drawHero(g,c,x,y,hh,t,i===turnI&&!F.over,i);if(i===turnI&&!F.over&&c.hp>0){const ay=y-hh*1.2+Math.sin(t/180)*s*0.05;g.fillStyle="#ffe08a";g.shadowColor="rgba(255,220,120,.9)";g.shadowBlur=s*0.15;g.beginPath();g.moveTo(x-s*0.1,ay);g.lineTo(x+s*0.1,ay);g.lineTo(x,ay+s*0.13);g.closePath();g.fill();g.shadowBlur=0;}});
 fx=fx.filter(e=>t<e.t0+e.dur);fx.forEach(e=>{if(t<e.t0)return;const p=(t-e.t0)/e.dur;
  if(e.k==="heal"){live.party.forEach((c,i)=>{if(c.hp>0)burst(g,hpos(i,W,H)[0],hpos(i,W,H)[1]-hh*0.5,s*0.6,p,"heal");});}
  else motionMarks(g,e,W,H,t);});
 if(window.__S4_MAGIC_HOLD&&F.m.length>1){burst(g,mpos(1,W,H)[0],mpos(1,W,H)[1],s,0.35,"magic");}else if(window.__S4_MAGIC_HOLD){burst(g,mpos(0,W,H)[0],mpos(0,W,H)[1],s,0.35,"magic");}
 ftimes.push(performance.now()-t0);if(ftimes.length>240)ftimes.shift();raf=requestAnimationFrame(loop);}
// ---------- hooks from the walk ----------
function zoneAt(x,y){return C.zoneOf[y*N+x];}
function fightHere(why){const p=S.state(),z=zoneAt(p.x,p.y),cf=R.centreFactor(p.x,p.y,N),pl=R.partyLevel(live.party);startFight((why==="room"?R.roomEncounter:R.encounter)(z,pl,cf,live.diff,(live.seed+fightNo*104729+p.x*65+p.y)>>>0,live.party),why);}
S.afterStep=rid=>{if(!live)return;s5init();live.steps++;checkSpoil();updHere();crystalDone();h6("step");if(localStorage.getItem(DEV_NOFIGHT)==="1")return;const p=S.state();stepsSince++;
 /* t2528u-t2539u: a seam tavern is entered by bumping its archway (S.onArchBump), never by stepping on a cell */
 if(R.isSavePoint(M,p.x,p.y)&&seamTav(p.x,p.y)<0){const t=M.taverns.findIndex(c=>c[0]===p.x&&c[1]===p.y);let joined="";
  if(t>=0){live.lastTav={t,x:p.x,y:p.y,f:p.f};/* t2759u rope */clearMealBuffs();/* t2778u */h6("reachedTavern",t);const def=R.companionFor(t,live.party,h6("plan"));if(def){const c=R.makeCompanion(def,R.partyLevel(live.party));live.party.push(c);joined=c.name+" joined the party! ";h6("joined",c,t);}}
  /* t2446u: only a tavern saves on arrival; a camp never saves or uses a tent by itself (Save tab on the camp screen) */const ok=t>=0?doSave(false):false,said=joined+(joined&&pointsReminder()?pointsReminder()+" ":"")+(t>=0?(ok?"Game saved at "+placeName(p.x,p.y)+".":"Could not save at "+placeName(p.x,p.y)+"."):"You reached "+placeName(p.x,p.y)+". Rest, cook, craft or save here (saving uses 1 tent).");if(joined)remind(said);else toast(said);/* t2437u QA: the join + points reminder shows after the join scene */updBtn();updHere();
  /* t2530u/t2551u: stepping on a camp circle (Safe post) opens the camp tabs; still no auto-save */if(t<0){const k=campIdx(p.x,p.y);if(k>=0&&!ui)campScreen(k);}return;}
 if(S.panelOpen()||(S.storyOpen&&S.storyOpen()))return; // first entry into a room: the room itself decides (see onRoomOpen)
 const hide=window.SOTA_GEAR?window.SOTA_GEAR.hideMode(live.hide):null;if(hide==="pass")return; /* t2759u hide smell pass: no random fights (monster doors fight in onRoomOpen) */
 const stinky=live.stink>0;if(stinky)live.stink--; // t2342u failed craft: monsters smell the party
 const stink=stinky||hide==="fail"; /* t2759u hide smell fail: the same x3 as Stinky stew; the two never stack */
 if(!(stink&&stepsSince>=4)){if(stepsSince<10)return;}if(!roll)roll=R.rng(live.seed>>>0);const r=roll()/(stink?3:1); /* stink: after 4 steps, 3x chance */
 if(r<(rid>=0?0.25:0.06)){stepsSince=0;fightHere("random");}};
// Chest items wait for an explicit choice when bags are full. No stash, ground pile or sale.
function treasurePanel(l){const found=[],pending=l.items.slice();
 // The door opens on pointerdown: its trailing click must not drop/leave an item below it.
 function blockOpeningClick(){function release(){ov.removeEventListener("click",swallow,true);ov.removeEventListener("pointerdown",release,true);}
  function swallow(e){release();if(e.detail){e.preventDefault();e.stopImmediatePropagation();}}
  ov.addEventListener("click",swallow,true);ov.addEventListener("pointerdown",release,true);
 }
 const itemText=id=>{const it=R.ITEMS[id];return it.n+" — "+[it.atk&&"ATK +"+it.atk,it.mag&&"MAG +"+it.mag,it.def&&"DEF +"+it.def,it.hp&&"HP +"+it.hp].filter(Boolean).join(", ");};
 function tryFit(){while(pending.length){const id=pending[0],who=addLoot(id);if(!who)break;found.push({id,who});pending.shift();}}
 function draw(){const w=page("treasure");const scene=el("img","s4treasureScene");scene.src="art6/treasure-room.webp";scene.alt="Torchlit stone treasure chamber with a glowing, slightly open chest";w.appendChild(scene);w.appendChild(head("Treasure chest"));w.appendChild(el("div","s4lab",{equipment:"Equipment",gold:"Gold",jewelry:"Enchanted jewelry"}[l.kind]));
  if(l.forName)w.appendChild(el("div","s4note","For "+l.forName+" ("+R.CLASSES[l.forClass].name+")"));
  if(l.gold)w.appendChild(el("div","s4note","Found "+l.gold+" gold."));
  found.forEach(f=>w.appendChild(el("div","s4note",itemText(f.id)+(f.who?" (carried by "+f.who+")":" — Left it. Gone."))));
  if(pending.length){const id=pending[0],canMakeRoom=live.party.some(c=>R.canCarry(Object.assign({},c,{bag:[]}),id));
   w.appendChild(el("div","s4note",itemText(id)));w.appendChild(el("div","s4lab","Bags are full."));
   const leave=tapBtn("Leave it",()=>{found.push({id,who:null});pending.shift();tryFit();draw();},"s4go small");leave.dataset.chestleave="1";w.appendChild(leave);
   if(!canMakeRoom){w.appendChild(el("div","s4note","Too heavy. Even an empty bag cannot hold it. You can only leave it."));return;}
   w.appendChild(el("div","s4lab","Drop something to make room"));w.appendChild(el("div","s4note","Dropped items are gone. No gold."));
   live.party.forEach((c,ci)=>{if(!c.bag.length)return;w.appendChild(el("div","s4lab",c.name));E.stacks(c.bag).forEach(({id:drop,n})=>{
    const b=tapBtn("Drop 1 "+R.ITEMS[drop].n+(n>1?" ("+n+")":""),()=>{const k=c.bag.indexOf(drop);if(k<0)return;c.bag.splice(k,1);gone(drop);if(drop==="tent"&&!hasTent())live.tentWear=0;tryFit();draw();},"wide");b.dataset.chestdrop=ci;b.dataset.chestitem=drop;withIc(b,drop);w.appendChild(b);
   });});return;
  }
  if(found.some(f=>f.who))w.appendChild(el("div","s4note dim","Race and class limits still apply. Keep it for a companion, or sell at a tavern."));w.appendChild(tapBtn("Continue",closeUI,"s4go small"));
 }
 blockOpeningClick();tryFit();draw();
}
S.onRoomOpen=id=>{if(!live||localStorage.getItem(DEV_NOFIGHT)==="1")return;const r=M.rooms[id];
 if(r.k==="monster"){stepsSince=0;fightHere("room");}
 else if(r.k==="treasure"){const l=R.treasure(r.z,(live.seed^(id*2654435761))>>>0,R.partyLevel(live.party),live.party);live.gold+=l.gold;treasurePanel(l);}
 else if(r.k==="story")h6("wall",id);};
// ================= Stage 5: economy, shops, cooking, tent =================
const E=window.ECON;
function s5init(){if(!live)return;if(live.steps==null)live.steps=0;live.fresh=live.fresh||{};live.recipes=live.recipes||{};if(live.tentWear==null)live.tentWear=0;}
function haveN(id){return live.party.reduce((t,c)=>t+c.bag.filter(x=>x===id).length,0);}
function gone(id){const q=live.fresh&&live.fresh[id];if(q&&q.length)q.shift();}
function takeOne(id){for(let i=live.party.length-1;i>=0;i--){const c=live.party[i],k=c.bag.lastIndexOf(id);if(k>=0){c.bag.splice(k,1);gone(id);return c;}}return null;}
function giveDish(id){const who=addLoot(id);if(who){s5init();(live.fresh[id]=live.fresh[id]||[]).push(live.steps+E.SPOIL_STEPS);live.fresh[id].sort((a,b)=>a-b);}return who;}
function freshLeft(id){const q=live.fresh&&live.fresh[id];return q&&q.length?q[0]-live.steps:null;}
// cooked food spoils: each dish keeps for SPOIL_STEPS steps. Oldest copy goes first.
function checkSpoil(){s5init();const out=[];for(const id in live.fresh){const q=live.fresh[id];while(q.length&&q[0]<=live.steps){q.shift();for(const c of live.party){const k=c.bag.lastIndexOf(id);if(k>=0){c.bag.splice(k,1);out.push(R.ITEMS[id].n);break;}}}}if(out.length)toast(out.join(", ")+" spoiled");return out;}
function seamTav(x,y){return S.seamTavernAt?S.seamTavernAt(x,y):-1;}
// t2564u: a tap that ends a talk must not fall through to the tavern buttons under the dialogue box. The talk closes on pointerdown,
// so the same tap's click lands on whatever is below (Zone 1 / Shop / Zone 2) and kicked the player out to the save picker. Swallow
// the click of any press that started while a talk was open.
// The same goes for a maze press (arrow button or archway tap) that opens a screen on pointerdown, e.g. backing into an archway: its click
// must not land on the tavern's Zone 1 button that now sits under the finger.
{let downInTalk=false,downNoUi=false,downArmed=false;if(typeof document!=="undefined"&&document.addEventListener){
 document.addEventListener("pointerdown",()=>{downArmed=true;downInTalk=!!(S.storyOpen&&S.storyOpen());downNoUi=!ui;},true);
 document.addEventListener("click",e=>{if(!downArmed)return;downArmed=false;const opened=downNoUi&&!!ui,was=downInTalk||opened;downInTalk=downNoUi=false;if(!was)return;const t=e.target;if(t&&t.closest&&t.closest("#s6d"))return;e.preventDefault();e.stopImmediatePropagation();},true);}}
function tavIdx(x,y){const k=seamTav(x,y);return k>=0?k:M.taverns.findIndex(c=>c[0]===x&&c[1]===y);}
// t2528u-t2539u: bumping or tapping a seam archway = arriving at that tavern (heal, companion, free save), then the tavern screen
let archPending=false;
S.onArchBump=t=>{if(!live||ui||hubBlocked()||archPending)return false;s5init();let joined="";{const p=S.state();live.lastTav={t,x:p.x,y:p.y,f:p.f};}/* t2759u rope */clearMealBuffs();/* t2778u */h6("reachedTavern",t);
 const def=R.companionFor(t,live.party,h6("plan"));if(def){const c=R.makeCompanion(def,R.partyLevel(live.party));live.party.push(c);joined=c.name+" joined the party! ";h6("joined",c,t);}
 const ok=doSave(false),said=joined+(joined&&pointsReminder()?pointsReminder()+" ":"")+(ok?"Game saved at Tavern "+(t+1)+".":"Could not save at Tavern "+(t+1)+".");if(joined)remind(said);else toast(said);updBtn();
 let scene=!!(S.storyOpen&&S.storyOpen());
 archPending=true;const open=()=>{if(S.storyOpen&&S.storyOpen()){scene=true;setTimeout(open,200);return;}archPending=false;
  /* t2437u: after a join scene, leave the reminder on the maze (same as a live step-in). The here tab opens the tavern (heal + first-visit talk). With no scene, the bump still opens the tavern immediately. */
  if(!ui&&!scene)tavernScreen(t);};open();return true;};
function campIdx(x,y){return M.camps.findIndex(c=>c[0]===x&&c[1]===y);}
function hasTent(){return haveN("tent")>0;}
/* t2778u: a meal buff (buff.meal) never counts down by fights; it lasts until the next cooked dish or a tavern */
function tickBuffs(){live.party.forEach(c=>{if(c.buff&&!c.buff.meal){c.buff.f--;if(c.buff.f<=0)delete c.buff;}if(c.poison){c.poison.f--;if(c.poison.f<=0)delete c.poison;}});}
// t2345u: failed-craft food does its effect only when eaten. Never knocks anyone out.
function eatBad(c,id){const it=R.ITEMS[id],mh=R.maxHp(c,hpMul()),mm=R.maxMp(c);
 if(it.stink){live.stink=(live.stink||0)+E.FAIL_STINK_STEPS;return;}
 if(it.bad==="hp"){if(c.hp>0)c.hp=Math.max(1,c.hp-Math.round(mh*E.BAD_HP/100));return;}
 if(it.bad==="mp"){c.mp=Math.max(0,c.mp-Math.round(mm*E.BAD_MP/100));return;}
 if(it.bad==="sta")c.buff={str:0,sta:-E.BAD_STA,f:E.BAD_STA_FIGHTS,n:it.n};}
function eatDish(c,id){const it=R.ITEMS[id];if(it.slot==="craft"){eatBad(c,id);return;}if(it.slot==="dish"){partyMeal(id);return;}h6("meal",it,null);const mh=R.maxHp(c,hpMul());c.hp=Math.min(mh,c.hp+Math.round(mh*(it.heal||0)));}
/* t2778u/t2779u/t2780u: ONE cooked dish feeds the WHOLE party (every current member). hp/mp refill for everyone awake (a meal never wakes a
   knocked-out member); the str/sta buff is stored on each member who ate, with no fight countdown, until the next cooked dish (which replaces
   it for everyone, or clears it when the new dish has no str/sta) or a tavern arrival (clearMealBuffs). A member who joins later has no buff
   until the next meal. Other buffs (failed-food stamina, crafted potions) keep their fight countdown and are only replaced by a buff dish. */
function mealBuffOf(d){const fx=d.fx;return fx.str||fx.sta?{str:fx.str||0,sta:fx.sta||0,n:d.n,meal:"d_"+d.id}:null;}
function partyMeal(id){const it=R.ITEMS[id],d=E.dish(it.dish),fx=d.fx,b=mealBuffOf(d);h6("meal",it,fx);
 live.party.forEach(c=>{const mh=R.maxHp(c,hpMul()),mm=R.maxMp(c);if(c.hp>0&&fx.hp)c.hp=Math.min(mh,c.hp+Math.round(mh*fx.hp/100));if(fx.mp)c.mp=Math.min(mm,c.mp+Math.round(mm*fx.mp/100));
  if(b)c.buff=Object.assign({},b);else if(c.buff&&c.buff.meal)delete c.buff;});
 /* favored-meal counts per companion + the brag talk when earned (package-dialogue.js H.ateMeal); a meal counts when EATEN, not when cooked */
 return !!h6("ateMeal",id,fx);}
function clearMealBuffs(){if(live)live.party.forEach(c=>{if(c.buff&&c.buff.meal)delete c.buff;});}
/* t2778u: old saves stored a dish buff as {str,sta,f,n} counting down by fights. Keep it as a meal buff (until the next meal or a tavern). */
function migrateMealBuffs(L){if(!L||!Array.isArray(L.party))return 0;let n=0;L.party.forEach(c=>{const b=c&&c.buff;if(!b||b.meal||!(b.f>0))return;const EC=window.ECON/* runs at boot, before const E */,d=EC&&EC.DISHES&&EC.DISHES.find(x=>x.n===b.n);if(!d||!mealBuffOf(d))return;c.buff={str:b.str||0,sta:b.sta||0,n:b.n,meal:"d_"+d.id};n++;});return n;}
function eatFrom(c,k){const id=c.bag[k];c.bag.splice(k,1);gone(id);eatDish(c,id);toast((R.ITEMS[id].slot==="dish"?"The party ate ":c.name+" ate ")+R.ITEMS[id].n);}
// cooking: the ingredients are always used up. Only a right mix makes a dish and teaches the recipe.
function cookTry(ings,where){if(!ings.length||!ings.every(x=>haveN("i_"+x)>=ings.filter(y=>y===x).length))return {err:"missing"};
 const d=E.cook(ings);if(d&&!live.party.some(c=>R.canCarry(c,"d_"+d.id)))return {err:"heavy"};ings.forEach(x=>takeOne("i_"+x));
 if(!d)return {fail:true};if(campVisit&&(!where||where==="c"+campVisit.k)){campVisit.cooked=true;campVisit.meal=d;}giveDish("d_"+d.id);const learnt=!live.recipes[d.id];if(learnt)live.recipes[d.id]="earned";
 const p=S.state(),t=where?where[0]==="t"?+where.slice(1):-1:tavIdx(p.x,p.y);if(t>=0)h6("craft","food",t);
 return {dish:d,learnt};}
// Saved per-tavern consumables: base 3 each, no timed restock. Each sold
// part/junk/ingredient produces exactly one ration and one potion here only.
function shopCounts(t=0){s5init();live.tavernStock=live.tavernStock||{};const q=live.tavernStock[t]=live.tavernStock[t]||{};
 ["ration","potion","ether","salts"].concat(E.stock(t).ing).forEach(id=>{if(q[id]==null)q[id]=3;});return q;}
function buy(id,t=0){const q=shopCounts(t);if(q[id]===0){toast("Out of stock");return false;}const p=E.price(id);if(live.gold<p){toast("Not enough gold");return false;}const who=addLoot(id);if(!who){toast("Nobody can carry that");return false;}live.gold-=p;if(q[id]!=null)q[id]--;toast("Bought "+R.ITEMS[id].n+" ("+who+")");h6("shop");return true;}
function buyRecipe(did){const d=E.dish(did),p=E.RECIPE_PRICE[d.tier];if(live.recipes[did]){toast("You already know it");return false;}if(live.gold<p){toast("Not enough gold");return false;}live.gold-=p;live.recipes[did]="bought";toast("Recipe bought: "+d.n);h6("shop");return true;}
function sell(ci,k,t=0){const c=live.party[ci],id=c.bag[k];if(id==null)return 0;const v=E.sellPrice(id);c.bag.splice(k,1);gone(id);if(id==="tent"&&!hasTent())live.tentWear=0;live.gold+=v;if(["part","junk","ing"].includes(R.ITEMS[id].slot)){const q=shopCounts(t);q.ration++;q.potion++;}toast("Sold "+R.ITEMS[id].n+" +"+v+" gold");return v;}
// tent build: parts + a crafter fee. The fee is paid in gold, or with spare parts/junk at their sell value (gold covers the rest)
function tentNeed(){return Object.entries(E.TENT.parts).map(([id,n])=>({id,n,have:haveN(id)}));}
function spareJunk(){const need=E.TENT.parts,out=[];live.party.forEach(c=>c.bag.forEach(id=>{const it=R.ITEMS[id];if(it&&(it.slot==="junk"||it.slot==="part"))out.push(id);}));
 const keep={...need};const spare=[];out.forEach(id=>{if(keep[id]>0)keep[id]--;else spare.push(id);});return spare.sort((a,b)=>E.sellPrice(b)-E.sellPrice(a));}
function buildTent(withJunk){if(!tentNeed().every(x=>x.have>=x.n)){toast("Missing parts");return false;}const pay=E.payFee(E.TENT.fee,live.gold,withJunk?spareJunk():[]);if(!pay){toast("Not enough gold for the fee");return false;}
 if(!live.party.some(c=>R.canCarry(c,"tent")))return false;Object.entries(E.TENT.parts).forEach(([id,n])=>{for(let j=0;j<n;j++)takeOne(id);});pay.parts.forEach(id=>takeOne(id));live.gold-=pay.gold;addLoot("tent");toast("Tent built! Fee: "+pay.gold+" gold"+(pay.parts.length?" + "+pay.parts.length+" junk":""));return true;}
// ---- the place tab: small "‹ Tavern 2" / "‹ Camp 3" tab while standing there ----
const here=el("button","ink s5here");here.id="s5here";document.body.appendChild(here);
function updHere(){const p=S.state&&S.state();let t=-1,k=-1;if(live&&!ui&&p&&!(S.mapOpen&&S.mapOpen())&&!(S.puzzleOpen&&S.puzzleOpen())){t=tavIdx(p.x,p.y);k=t<0?campIdx(p.x,p.y):-1;/* here tab on both cells in front of a seam archway, and on every maze tavern cell */}const on=t>=0||k>=0;here.style.display=on?"block":"none";if(on){here.textContent="‹ "+(t>=0?"Tavern "+(t+1):"Camp "+(k+1));here.dataset.t=t;here.dataset.k=k;}}
here.addEventListener("click",e=>{e.preventDefault();if(ui)return;const t=+here.dataset.t,k=+here.dataset.k;if(t>=0)tavernScreen(t);else if(k>=0)campScreen(k);});
setInterval(updHere,400);
// side tabs on a page: each opens a slide tree to its left
function sideTabs(w,list){const box=el("div","s5tabs");list.forEach(([label,kids,fn,key])=>{const b=el("button","s4bi s5tab",(kids?"‹ ":"")+label);b.dataset.tab=key;b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();if(fn){fn();return;}slideTree.at=b;slideTree(kids(),0);slideTree.at=null;});box.appendChild(b);});w.appendChild(box);return box;}
function goldLine(w){const g=el("div","s4note s5gold","Gold "+live.gold);g.id="s5gold";w.appendChild(g);}
function keeperArt(i){const cv=document.createElement("canvas");cv.width=cv.height=96;cv.className="s5keep";const g=cv.getContext("2d");
 const hair=["#7a4a24","#e8c860","#cfd6e6","#f4f1ea"][i],skin=["#d8a47c","#efc8a4","#e9d6c6","#8a5a3c"][i];
 g.fillStyle="#1c1230";g.fillRect(0,0,96,96);g.fillStyle="#3a2a52";g.beginPath();g.moveTo(14,96);g.quadraticCurveTo(48,52,82,96);g.fill();
 if(i===3){g.fillStyle=hair;g.beginPath();g.moveTo(26,30);g.lineTo(32,8);g.lineTo(42,26);g.moveTo(54,26);g.lineTo(64,8);g.lineTo(70,30);g.fill();}
 g.fillStyle=skin;g.beginPath();g.ellipse(48,46,i===0?22:18,22,0,0,7);g.fill();
 if(i===2){g.beginPath();g.moveTo(30,44);g.lineTo(16,32);g.lineTo(32,52);g.moveTo(66,44);g.lineTo(80,32);g.lineTo(64,52);g.fill();}
 g.fillStyle=hair;g.beginPath();g.ellipse(48,32,i===0?22:20,12,0,Math.PI,0);g.fill();if(i===2||i===3){g.fillRect(28,30,6,30);g.fillRect(62,30,6,30);}
 if(i===0){g.beginPath();g.moveTo(28,52);g.quadraticCurveTo(48,96,68,52);g.fill();}
 g.fillStyle="#0a0610";g.fillRect(39,44,4,4);g.fillRect(53,44,4,4);g.strokeStyle="#0a0610";g.lineWidth=3;g.strokeRect(1.5,1.5,93,93);return cv;}
function stackList(ci,fn,filter){const c=live.party[ci];return E.stacks(c.bag).filter(s=>!filter||filter(s.id)).map(s=>({t:R.ITEMS[s.id].n+(s.n>1?" ×"+s.n:"")+" · "+E.sellPrice(s.id)+"g",d:{sell:s.id},fn:()=>fn(ci,c.bag.lastIndexOf(s.id))}));}
const WAIT_UPDATE="Please wait for update to continue.";
const tavernLabels=t=>["Zone "+(t+1),"Shop","Zone "+(t+2)];
function zoneOpen(z){const cap=S.contentCap;if(cap&&cap.isZoneOpen)return cap.isZoneOpen(z);
 return z<=(window.SOTA_CONTENT_CAP?window.SOTA_CONTENT_CAP.DEFAULT.maxZone:5);}
function hubBlocked(){return !!(S.storyOpen&&S.storyOpen());}
/* t2517u/t2564u: the tap that ends a talk or cut scene closes the dialogue box on pointerdown, then the browser's click from that same tap
   lands on the tavern button now under the finger (Zone 1 / Shop / Zone 2) and left the tavern. Remember whether each tap started while a
   scene was open, and let the tavern buttons ignore every click until 1500 ms have passed, or until a new pointerdown/touchstart begins
   after the talk has ended. A second synthetic click with no new touch must not open the save picker. */
let hubTapInStory=false,hubTapAt=0;
window.addEventListener("pointerdown",()=>{hubTapInStory=hubBlocked();hubTapAt=Date.now();},true);
function hubGhostClick(){return !!(hubTapInStory&&Date.now()-hubTapAt<1500);}
function leaveTavern(t,z){if(hubBlocked())return false;if(!zoneOpen(z)){
 if(S.rpg.s6&&S.rpg.s6.play)S.rpg.s6.play("wait-for-update",[["N","calm",WAIT_UPDATE]],{bg:tavernBg(t)});return false;}
 if(S.seamExit&&S.seams&&S.seams().some(s=>s.t===t)){/* t2565u: pick a slot, save there (taverns never use a tent), land on that side facing away. Cancel = stay, nothing moves */
  const before=()=>{const snap=S.mazeSnap?S.mazeSnap():null;S.seamExit(t,z);return ()=>{if(snap&&S.applyMaze)S.applyMaze(snap);};};
  savePicker("save",closeUI,()=>tavernScreen(t,false),before);return true;}
 savePicker("save",closeUI,()=>tavernScreen(t,false));return true;}
function tavernScreen(t,arrival=true){s5init();campVisit=null;const w=page("tavern");w.classList.add("s5scene","s5hub");w.style.backgroundImage='url("'+tavernBg(t)+'")';w.appendChild(head("Tavern "+(t+1)));
 const nav=el("div","s5hubnav");tavernLabels(t).forEach((label,i)=>{const b=tapBtn(label,()=>{if(hubBlocked()||hubGhostClick())return;if(i===1)buyScreen(t);else leaveTavern(t,i===0?t+1:t+2);},"small");b.dataset.hub=i;nav.appendChild(b);});w.appendChild(nav);
 if(arrival){live.party.forEach(c=>{c.hp=R.maxHp(c,hpMul());c.mp=R.maxMp(c);});h6("ownerVisit",t);h6("tavern",t);}}
function leaveShop(t){savePicker("save",()=>tavernScreen(t,false),()=>buyScreen(t,false));}
// t2445u/t2452u/t2453u/t2454u scene framing. Story pictures end at the top of the dialogue box (--s6top).
// t2522u/t2655u: in a tavern owner's shop the tabs sit in a bottom grid so the owner's background art shows and no tab covers
// the face. The owner's face and upper body (OWNER_BODY, fractions of the 528x516 art) are centred in the free area under the
// header/Gold line (and the party inset during a talk) and above the bottom tab row or the dialogue box. List screens
// (Recipes, Food, Craft, Sell, tent) keep the owner in a band under the gold line (--ownBand) and the list starts below it.
const OWNER_FACE=[[.36,.02,.72,.36],[.38,.01,.64,.32],[.38,.01,.64,.34],[.38,.03,.68,.38]],OWNER_AR=516/528;let frameLast=null;
const OWNER_BODY=OWNER_FACE.map(f=>[Math.max(0,f[0]-.14),f[1],Math.min(1,f[2]+.14),Math.min(.68,f[3]+.30)]);
function frameScenes(){const d=$("s6d"),root=document.documentElement,W=innerWidth,H=innerHeight;
 if(d){const b=d.querySelector(".s6box");if(b){const dr=d.getBoundingClientRect(),br=b.getBoundingClientRect();if(br.height)d.style.setProperty("--s6top",Math.max(60,Math.round(br.top-dr.top-6))+"px");}}
 const w=ov.querySelector(".s5shop");if(!w||ui===null){frameLast=null;return null;}
 const t=Math.max(0,Math.min(3,+(w.dataset.owner||0))),tb=w.querySelector(".s5tabs"),hd=w.querySelector(".s4head"),gd=w.querySelector(".s5gold");
 const gb=gd&&gd.getBoundingClientRect().width?gd.getBoundingClientRect().bottom:0,top0=Math.max(hd?hd.getBoundingClientRect().bottom:50,gb)+8;
 const tr=tb&&tb.getBoundingClientRect(),tabTop=tr&&tr.height?tr.top:H;if(tr&&tr.height)root.style.setProperty("--s5tabsH",Math.round(H-tr.top)+"px");
 const dlg=!!(d&&d.classList.contains("on")),box=dlg&&d.querySelector(".s6box"),boxTop=box?box.getBoundingClientRect().top:H,land=W>H,sub=!tb;
 let inset=null;if(dlg&&d.classList.contains("hasbg")){const iw=Math.round(land?Math.min(W*.3,320):Math.min(W*.42,200)),ar=frameScenes.ar||387/720,ih=Math.round(iw*ar),dr=d.getBoundingClientRect();
  inset={l:8,t:top0,r:8+iw,b:top0+ih};d.style.setProperty("--shopInsetX",(8-dr.left)+"px");d.style.setProperty("--shopInsetY",(top0-dr.top)+"px");d.style.setProperty("--shopInsetW",iw+"px");d.style.setProperty("--shopInsetH",ih+"px");}
 const x0=land&&inset?inset.r+8:8,x1=W-8,y0=(!land&&inset?inset.b:top0)+8;let y1;
 if(sub){const band=Math.round(Math.max(150,Math.min(land?H*.5:H*.36,360)));y1=y0+band;w.style.setProperty("--ownBand",Math.max(0,Math.round(y1+8-gb))+"px");}
 else{w.style.setProperty("--ownBand","0px");y1=Math.max(y0+60,Math.min(tabTop,boxTop)-8);}
 const f=OWNER_FACE[t],g=OWNER_BODY[t],gw=g[2]-g[0],gh=(g[3]-g[1])*OWNER_AR;
 const S=Math.min(Math.max(120,Math.min((x1-x0)/gw,(y1-y0)/gh)),land?H*1.1:W);/* never wider than the screen in portrait */
 const left=Math.round((x0+x1)/2-(g[0]+g[2])/2*S),top=Math.round(y0+Math.max(0,(y1-y0-gh*S)/2)-g[1]*S*OWNER_AR);
 w.style.setProperty("--ownS",Math.round(S)+"px auto");w.style.setProperty("--ownX",left+"px");w.style.setProperty("--ownY",top+"px");
 const R=q=>({l:left+q[0]*S,t:top+q[1]*S*OWNER_AR,r:left+q[2]*S,b:top+q[3]*S*OWNER_AR});
 frameLast={owner:t,sub,face:R(f),body:R(g),area:{l:x0,t:y0,r:x1,b:y1},inset,art:{l:left,t:top,w:S,h:S*OWNER_AR}};return frameLast;}
{let q=0;const go=()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;frameScenes();});};addEventListener("resize",go);
 if(typeof MutationObserver==="function"&&document.body)new MutationObserver(go).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","data-line"]});/* guarded: node test harnesses have no MutationObserver/Image */
 if(typeof Image==="function"){const im=new Image();im.onload=()=>{if(im.naturalWidth)frameScenes.ar=im.naturalHeight/im.naturalWidth;};im.src="art6/tavern/tavern-1-human.webp";}}
function shopPage(kind,t,title,back){const w=page(kind);w.classList.add("s5scene","s5shop");w.style.backgroundImage='url("art6/shop/owner-'+(t+1)+'.webp")';w.dataset.owner=t;
 document.documentElement.classList.add("s5shop-open");w.appendChild(head(title,back));return w;}
// Shop root Back and Done save, while subpages go up one screen.
function buyScreen(t,line=true){s5init();const w=shopPage("buy",t,E.KEEPERS[t].name+" · Shop",()=>leaveShop(t));goldLine(w);
 sideTabs(w,[["Recipes",null,()=>shopList(t,"recipes"),"recipes"],["Food",null,()=>shopList(t,"food"),"food"],["Craft",null,()=>shopList(t,"craft"),"craft"],["Sell",null,()=>sellScreen(t),"sell"],["Done",null,()=>leaveShop(t),"done"]]);
 if(line)h6("owner",t,"STOCK");}
function shopRow(w,label,data,fn,off){const o=el("button","s4opt s5row"+(off?" off":""));for(const k in data)o.dataset[k]=data[k];{const iid=data.buy||data.sell||(data.recipe&&(R.ITEMS["d_"+data.recipe]?"d_"+data.recipe:data.recipe))||(data.tentb?"tent":null);if(iid)withIc(o,iid);}/* t2476u */o.appendChild(el("span","s4on",label));o.addEventListener("click",e=>{e.preventDefault();fn();});w.appendChild(o);return o;}
function shopList(t,kind){s5init();const st=E.stock(t),w=shopPage("shop-"+kind,t,{recipes:"Recipes",food:"Food",craft:"Craft"}[kind],()=>buyScreen(t,false));w.dataset.list=kind;goldLine(w);
 const q=shopCounts(t),item=id=>shopRow(w,R.ITEMS[id].n+" · "+E.price(id)+"g"+(q[id]!=null?" · Stock "+q[id]:""),{buy:id},()=>{buy(id,t);shopList(t,kind);},live.gold<E.price(id)||q[id]===0);
 if(kind==="recipes"){const l=E.recipesFor(t).filter(id=>!live.recipes[id]);if(!l.length)w.appendChild(el("div","s4note dim","You know all the recipes sold here."));
  l.forEach(id=>{const d=E.dish(id);shopRow(w,d.n+" · "+E.RECIPE_PRICE[d.tier]+"g",{recipe:id},()=>{buyRecipe(id);shopList(t,kind);},live.gold<E.RECIPE_PRICE[d.tier]);});}
 else if(kind==="food"){["ration","potion","ether","salts"].concat(st.ing).forEach(item);}
 else{w.appendChild(el("div","s4lab","Tent"));item("tent");shopRow(w,"‹ Build a tent from parts",{tentb:"1"},()=>tentScreen(t)).querySelector(".s4on").classList.add("s5more");
  w.appendChild(el("div","s4lab","Gear"));st.gear.forEach(item);/* t2793u: plain lockpick/rope off the shelf; worn gear stays */
  specialRows(w,t);
  if(st.parts.length){w.appendChild(el("div","s4lab","Parts"));st.parts.forEach(item);}
  w.appendChild(el("div","s4note dim","Dead warriors' gear is cheap but worse than new."));}}
// Sell: lists only what the party carries (bags of every member), sold at the normal sell rules
function sellScreen(t){s5init();const w=shopPage("sell",t,"Sell",()=>buyScreen(t,false));goldLine(w);let any=0;
 live.party.forEach((c,ci)=>{const s=E.stacks(c.bag);if(!s.length)return;w.appendChild(el("div","s4lab",c.name));s.forEach(x=>{any++;shopRow(w,R.ITEMS[x.id].n+(x.n>1?" ×"+x.n:"")+" · "+E.sellPrice(x.id)+"g",{sell:x.id,who:ci},()=>{sell(ci,c.bag.lastIndexOf(x.id),t);sellScreen(t);});});});
 if(!any)w.appendChild(el("div","s4note dim","The party carries nothing to sell."));w.appendChild(el("div","s4note dim","Parts and junk sell for their worth; other things for half."));}
let campVisit=null;
// t2262u / t2266u: fixed painted seats, never extra race/class/gender bodies.
const CAMP_ART=Object.freeze({eating:"art6/camp/camp-eating.webp",injured:"art6/camp/camp-injured.webp",celebrating:"art6/camp/camp-celebrating.webp",arguing:"art6/camp/camp-arguing-weapons.webp"});
const SEAT_ORDER=["dwarf","human","elf","cat"];
function joinedCompanion(code){const def={Q:["quirky","Mira"],S:["scholar","Sorrel"],A:["angry","Brunn"]}[code];
 const party=live&&live.party||[];return party.slice(1).some(c=>c.role===def[0]||c.name===def[1])||!!(S.rpg&&S.rpg.s6&&S.rpg.s6.who&&S.rpg.s6.who(code));}
function partySeats(){const race=live&&live.party&&live.party[0]&&live.party[0].race||"human";
 return SEAT_ORDER.filter(r=>r===race||(r==="cat"&&joinedCompanion("Q"))||(r==="elf"&&joinedCompanion("S"))||(r==="dwarf"&&joinedCompanion("A")));}
function occupancyArt(path){const seats=partySeats();return seats.length===4?path:path.replace(/\.webp$/,"-"+seats.join("-")+".webp");}
function campArt(mood){return occupancyArt(CAMP_ART[mood]||CAMP_ART.celebrating);}
function tavernBg(t){const n=Math.max(1,Math.min(5,t+1)),path="art6/tavern-"+n+".webp";return partySeats().length===4?path:occupancyArt("art6/tavern/tavern-"+n+".webp");}
function weaponsDrawn(talk){if(!talk)return false;if(/weapon/i.test(talk.gate||""))return true;
 const text=(talk.lines||[]).map(l=>Array.isArray(l)?l[2]:l.text||"").join(" ")+" "+(talk.text||"");
 return /\b(?:weapons?|swords?|blades?|daggers?)\s+(?:are\s+|were\s+)?(?:drawn|out|unsheathed)\b|\b(?:draws?|drawing|unsheath(?:s|ing)?)\s+(?:(?:his|her|their|a|the)\s+)?(?:weapons?|swords?|blades?|daggers?)\b/i.test(text);}
function campMood(talk){if(weaponsDrawn(talk))return joinedCompanion("Q")||joinedCompanion("S")||joinedCompanion("A")?"arguing":"celebrating";
 const condition=talk&&talk.condition||"",story=live&&live.story||{};
 if(talk&&talk.gate==="cooked"||/cook|meal|rations?/i.test(condition)||campVisit&&campVisit.cooked||talk&&(story.lastMeal==="cooked"||story.lastMeal==="ration"))return "eating";
 if(talk&&(talk.gate==="hurt"||talk.gate==="close")||/beat[ -]up/i.test(condition)||live&&live.party.some(c=>c.hp>0&&c.hp<R.maxHp(c,hpMul())))return "injured";
 return "celebrating";}
function campBg(talk){return campArt(campMood(talk));}

function campRest(k){s5init();live.party.forEach(c=>{c.hp=R.maxHp(c,hpMul());c.mp=R.maxMp(c);});
 const cooked=campVisit&&campVisit.k===k&&campVisit.cooked;campScreen(k);
 if(cooked){const meal=campVisit.meal;campVisit.cooked=false;if(meal)h6("meal",R.ITEMS["d_"+meal.id],meal.fx);h6("camp",k);}toast("Party rested. Health and mana restored.");}
function campScreen(k){s5init();if(!campVisit||campVisit.k!==k)campVisit={k,cooked:false,meal:null};const w=page("camp");w.classList.add("s5scene","s5camp");w.style.backgroundImage='url("'+campBg()+'")';w.appendChild(head("Camp "+(k+1)));
 if(k===0&&live&&!live.campTut){live.campTut="shown";tutStep=1;}/* t2356u: first-camp lesson, once per save */
 const cb=tapBtn("Craft",()=>{craftReset();craftLast=null;craftPop(k);},"small s5craftb");cb.dataset.craftopen="1";w.appendChild(cb);
 w.appendChild(el("div","s4note",hasTent()?"Tents: "+haveN("tent")+". Each tent is good for 1 save at a camp.":"No tent: you can still cook, craft and rest here. You need a tent to save at camp."));
 sideTabs(w,[["Cook",null,()=>cookScreen("c"+k),"cook"],["Eat",null,()=>eatScreen(k),"eat"],["Rest",null,()=>campRest(k),"rest"],["Save",null,()=>campSave(k),"save"],["Return",null,closeUI,"return"]]);if(k===0)tutDraw();}
// t2778u/t2779u/t2780u: camp Eat tab. A picker of COOKED dishes only (no rations, potions, crafted food or ingredients) from the party's bags,
// labelled with whose bag when more than one bag has dishes. Picking one takes ONE dish out of that bag and feeds the whole party.
function buffText(b){const o=[];if(b.str)o.push("+"+b.str+"% strength");if(b.sta)o.push("+"+b.sta+"% stamina");return o.join(", ");}
function mealLine(c){const b=c.buff;return b&&b.meal?b.n+": "+buffText(b)+" until the next meal or a tavern":"No meal buff";}
function cookedChoices(){const out=[];live.party.forEach((c,ci)=>E.stacks(c.bag).forEach(s=>{const it=R.ITEMS[s.id];if(it&&it.slot==="dish")out.push({ci,id:s.id,n:s.n});}));return out;}
function eatScreen(k){s5init();const w=page("eat");w.classList.add("s5scene","s5camp");w.style.backgroundImage='url("'+campArt("eating")+'")';w.appendChild(head("Eat",()=>campScreen(k)));
 w.appendChild(el("div","s4note","Pick a cooked dish. One dish feeds the whole party. Its buff lasts until the next meal or a tavern."));
 const ls=el("div","s5meals");ls.id="s5meals";live.party.forEach((c,ci)=>{const r=el("div","s4sub s5meal",c.name+" · "+mealLine(c));r.dataset.mealbuff=String(ci);r.dataset.meal=c.buff&&c.buff.meal||"";ls.appendChild(r);});w.appendChild(ls);
 const ch=cookedChoices(),bags=new Set(ch.map(x=>x.ci)).size;
 if(!ch.length){const n=el("div","s4note","No cooked dishes in your bags. Cook one first.");n.dataset.nodish="1";w.appendChild(n);return;}
 ch.forEach(x=>{const it=R.ITEMS[x.id],d=E.dish(it.dish),b=tapBtn(it.n+(x.n>1?" ×"+x.n:"")+(bags>1?" ("+live.party[x.ci].name+"'s bag)":"")+" · "+E.fxText(d.fx),()=>eatCooked(k,x.ci,x.id),"wide");b.dataset.eatdish=x.id;b.dataset.bag=String(x.ci);if(typeof withIc==="function")withIc(b,x.id);w.appendChild(b);});}
function eatCooked(k,ci,id){const c=live.party[ci],it=R.ITEMS[id],j=c&&it&&it.slot==="dish"?c.bag.lastIndexOf(id):-1;if(j<0){toast("That dish is not in that bag.");eatScreen(k);return false;}
 c.bag.splice(j,1);gone(id);partyMeal(id);eatScreen(k);toast("The party ate "+it.n+".");return true;}
// t2446u/t2449u/t2450u: saving at a camp is a choice. Already pitched here (t2356u): free, straight to the slot picker. Otherwise it asks
// "Use 1 tent to save?" first; without a tent it says how to get one. The tent is only used when a slot is actually written.
function campPitched(){const p=S.state();return !!(save&&save.at&&save.at.x===p.x&&save.at.y===p.y);}
function campSave(k,done){if(!live)return;const free=campPitched(),p=S.state();const old=$("s5tentask");if(old)old.remove();
 const refill=()=>{const was=live.party.map(c=>[c.hp,c.mp]);live.party.forEach(c=>{c.hp=R.maxHp(c,hpMul());c.mp=R.maxMp(c);});return ()=>live.party.forEach((c,j)=>{c.hp=was[j][0];c.mp=was[j][1];});};
 const pick=()=>savePicker("save",()=>{campScreen(k);toast("Party rested and game saved at "+placeName(p.x,p.y)+(free?". Tent already pitched here: no tent used.":". 1 tent used."));if(done)done();},()=>campScreen(k),refill);/* t2451u: refill + tent + slot write happen together on picking a slot */
 if(free){pick();return;}
 const d=el("div","s5pop");d.id="s5tentask";d.setAttribute("role","dialog");
 if(!hasTent()){d.appendChild(el("div","s4note","You need a tent to save at a camp. Make one with Craft: 1 Spider silk + 1 Boar hide. Tavern shops sell them too."));const okb=tapBtn("OK",()=>d.remove(),"small");okb.dataset.tentok="1";d.appendChild(okb);ov.appendChild(d);return;}
 d.appendChild(el("div","s4note","Use 1 tent to save? You have "+haveN("tent")+"."));const r=el("div","s4row");
 const y=tapBtn("Yes, use 1 tent",()=>{d.remove();pick();},"small");y.dataset.tentyes="1";const n=tapBtn("No",()=>d.remove(),"small");n.dataset.tentno="1";r.append(y,n);d.appendChild(r);ov.appendChild(d);}
function foodTree(back){const out=[];live.party.forEach((c,ci)=>E.stacks(c.bag).forEach(s=>{const it=R.ITEMS[s.id];if(it.slot==="dish"||s.id==="ration")out.push({t:it.n+(s.n>1?" ×"+s.n:"")+" ("+c.name+")",d:{food:s.id},kids:()=>live.party.map(m=>({t:"Feed "+m.name,fn:()=>{const k=c.bag.lastIndexOf(s.id);if(k<0)return;c.bag.splice(k,1);gone(s.id);eatDish(m,s.id);toast(m.name+" ate "+it.n);back();}}))});}));return out.length?out:[{t:"No food",off:true}];}
let cookSel=[];
function cookScreen(where){s5init();const k=where&&where[0]==="c"?+where.slice(1):Math.max(0,campIdx(S.state().x,S.state().y));where="c"+k;const back=()=>campScreen(k);const w=page("cook");w.classList.add("s5scene","s5camp");w.style.backgroundImage='url("'+campArt("eating")+'")';w.appendChild(head("Cooking",()=>{cookSel=[];back();}));
 w.appendChild(tapBtn("Cooking guide",()=>cookbook(()=>cookScreen(where)),"small"));
 const have=E.stacks(live.party.flatMap(c=>c.bag)).filter(s=>R.ITEMS[s.id].slot==="ing");
 w.appendChild(el("div","s4note","Pick 2 to 4 ingredients, then cook. A wrong mix ruins them and teaches nothing."));
 const chips=el("div","s5chips");have.forEach(s=>{const x=s.id.slice(2),n=cookSel.filter(y=>y===x).length,b=el("button","s4bi s5chip"+(n?" sel":""),R.ITEMS[s.id].n+" ×"+s.n+(n?" ("+n+")":""));b.dataset.ing=x;withIc(b,s.id);
  b.addEventListener("click",e=>{e.preventDefault();if(n<s.n&&cookSel.length<4)cookSel.push(x);else cookSel=cookSel.filter(y=>y!==x);cookScreen(where);});chips.appendChild(b);});
 if(!have.length)chips.appendChild(el("div","s4note dim","No ingredients. Monsters drop food, taverns sell it."));w.appendChild(chips);
 const row=el("div","s4row");const cb=tapBtn("Cook"+(cookSel.length?" ("+cookSel.map(x=>R.ITEMS["i_"+x].n).join(" + ")+")":""),()=>{const r=cookTry(cookSel,where);cookSel=[];
  if(r.err)toast(r.err==="heavy"?"Nobody can carry the dish":"Missing ingredients");else if(r.fail)toast("That didn't work. The ingredients are ruined.");else toast("You cooked "+r.dish.n+(r.learnt?"! Recipe added to your guide.":""));cookScreen(where);},"small");cb.id="s5cook";if(cookSel.length<2)cb.disabled=true;row.appendChild(cb);w.appendChild(row);
 const known=E.DISHES.filter(d=>live.recipes[d.id]);if(known.length){w.appendChild(el("div","s4lab","Known recipes"));known.forEach(d=>{const ok=d.ing.every(x=>haveN("i_"+x)>=d.ing.filter(y=>y===x).length),o=el("button","s4opt"+(ok?"":" off"));o.dataset.again=d.id;
  o.appendChild(el("span","s4on",d.n+" · "+d.ing.map(x=>R.ITEMS["i_"+x].n).join(", ")));o.addEventListener("click",e=>{e.preventDefault();if(!ok){toast("Missing ingredients");return;}cookSel=d.ing.slice();cookScreen(where);});w.appendChild(o);});}}
// ---- Jeremy t2345u/t2347u/t2348u: camp crafting pop-up (Craft button at the top of every camp, tent or not).
// 4 boxes, each holds ONE single item. Picking a second copy fills the next empty box. Crafting uses up every box. ----
let craftBox=[null,null,null,null],craftAt=null,craftPicking=false,craftLast=null,craftK=0;
function craftable(id){const it=R.ITEMS[id];return !!it&&(it.slot==="part"||it.slot==="ing");}
function craftLeft(id){return haveN(id)-craftBox.filter(x=>x===id).length;}
function craftChoices(){return [...new Set(live.party.flatMap(c=>c.bag))].filter(craftable).map(id=>({id,n:craftLeft(id)})).filter(x=>x.n>0);}
function craftPut(id){if(!craftable(id)||craftLeft(id)<=0)return -1;const i=craftAt!=null&&!craftBox[craftAt]?craftAt:craftBox.indexOf(null);if(i<0)return -1;craftBox[i]=id;craftAt=null;return i;}
function craftClear(i){if(i>=0&&i<craftBox.length)craftBox[i]=null;}
function craftReset(){craftBox=[null,null,null,null];craftAt=null;craftPicking=false;}
function craftFill(ids){if(ids.length>E.CRAFT_BOXES)return false;const need=E.countOf(ids);if(!Object.keys(need).every(id=>haveN(id)>=need[id]))return false;craftReset();ids.forEach((id,i)=>craftBox[i]=id);return true;}
function craftTry(ids){s5init();ids=(ids||[]).filter(Boolean);const need=E.countOf(ids);
 if(ids.length<2||ids.length>E.CRAFT_BOXES||!ids.every(craftable))return {err:"count"};
 if(!Object.keys(need).every(id=>haveN(id)>=need[id]))return {err:"missing"};
 const cr=E.craftMatch(ids);if(cr&&!live.party.some(c=>R.canCarry(c,cr.out)))return {err:"heavy"};
 ids.forEach(id=>takeOne(id));live.crafts=live.crafts||{};live.failedMixes=live.failedMixes||{};live.oddMixes=live.oddMixes||{};const key=E.mixKey(ids);
 if(cr){if(cr.out.startsWith("d_"))giveDish(cr.out);else addLoot(cr.out);const learnt=!live.crafts[cr.id];if(learnt)live.crafts[cr.id]="earned";return {craft:cr,kind:cr.id,item:cr.out,learnt};}
 const kind=E.craftFail(ids);if(kind==="useless"){live.failedMixes[key]=ids.slice().sort();return {fail:kind,kind,item:null};}
 const item=E.FAIL_ITEM[kind],who=addLoot(item);live.oddMixes[key]={ids:ids.slice().sort(),kind};return {fail:kind,kind,item,lost:!who};}
function craftIdsText(ids){return ids.map(id=>R.ITEMS[id]?R.ITEMS[id].n:id).join(" + ");}
function craftNeedText(cr){return craftIdsText(E.needList(cr.need));}
function craftMsg(r){if(r.craft)return "You made "+r.craft.n+"!"+(r.learnt?" Recipe saved in your journal.":"");
 if(r.item)return "Something odd came out: "+R.ITEMS[r.item].n+". "+E.badText(r.item)+"."+(r.lost?" No room in any bag, so it was left behind.":"");
 return "Nothing useful came out. The mix is saved under Failed recipes.";}
// 8-bit picture of the result: square pixels on a small canvas (pixel art like the fight sprites; no painted art)
function drawPix(cv,kind){const a=E.pixelArt(kind),n=a.rows.length,z=6;cv.width=cv.height=n*z;const g=cv.getContext&&cv.getContext("2d");if(!g||!g.fillRect)return 0;if(g.clearRect)g.clearRect(0,0,n*z,n*z);let cnt=0;
 a.rows.forEach((row,y)=>{for(let x=0;x<row.length;x++){const col=a.pal[row[x]];if(row[x]==="."||!col)continue;g.fillStyle=col;g.fillRect(x*z,y*z,z,z);cnt++;}});return cnt;}
function craftPop(k){s5init();if(k!=null)craftK=k;campScreen(craftK);const old=$("s5craftpop");if(old)old.remove();
 const p=el("div","s5pop s5craftpop");p.id="s5craftpop";p.setAttribute("role","dialog");p.appendChild(el("div","s4lab","Craft"));
 p.appendChild(el("div","s4note","Tap a box to add a part or ingredient. Tap a full box to empty it. 2 to 4 items. Everything in the boxes is used up."));
 const boxes=el("div","s5cboxes");craftBox.forEach((id,i)=>{const b=el("button","s4bi s5cbox"+(id?" full":"")+(craftAt===i?" sel":""),id?R.ITEMS[id].n:"+");b.dataset.cbox=i;if(id){b.dataset.item=id;withIc(b,id);}
  b.addEventListener("click",e=>{e.preventDefault();if(craftBox[i]){craftClear(i);craftAt=null;}else{craftAt=i;craftPicking=true;}craftLast=null;craftPop();});boxes.appendChild(b);});p.appendChild(boxes);
 if(!craftBox.includes(null))craftPicking=false;
 if(craftPicking){const pk=el("div","s5cpick");pk.id="s5cpick";const ch=craftChoices();if(!ch.length)pk.appendChild(el("div","s4note dim","No parts or ingredients left. Monsters drop them."));
  ch.forEach(({id,n})=>{const b=el("button","s4bi s5chip",R.ITEMS[id].n+" ×"+n);b.dataset.cpick=id;withIc(b,id);b.addEventListener("click",e=>{e.preventDefault();craftPut(id);craftPop();});pk.appendChild(b);});p.appendChild(pk);}
 const filled=craftBox.filter(Boolean),fm=live.failedMixes||{};if(filled.length>=2&&fm[E.mixKey(filled)]){const wn=el("div","s4note bad","You tried this mix before. Nothing useful came out.");wn.dataset.triedfail="1";p.appendChild(wn);}
 const go=tapBtn("Craft",()=>{const r=craftTry(craftBox.filter(Boolean));if(r.err){toast(r.err==="heavy"?"Nobody can carry that":r.err==="count"?"Put 2 to 4 items in the boxes":"Missing items");craftPop();return;}craftLast=r;craftReset();if(tutStep&&r.craft&&r.craft.id==="tent")tutStep=4;toast(craftMsg(r));craftPop();},"small");go.id="s5craft";if(filled.length<2)go.disabled=true;p.appendChild(go);
 if(craftLast){const res=el("div","s5cres");const cv=el("canvas");cv.id="s5craftpic";cv.dataset.result=craftLast.kind;cv.dataset.px=drawPix(cv,craftLast.kind);res.appendChild(cv);res.appendChild(el("div","s4note",craftMsg(craftLast)));p.appendChild(res);}
 const known=E.CRAFTS.filter(c=>live.crafts&&live.crafts[c.id]),odd=Object.entries(live.oddMixes||{});
 if(known.length||odd.length){p.appendChild(el("div","s4lab","Known recipes"));
  known.forEach(cr=>{const o=tapBtn(cr.n+" · "+craftNeedText(cr),()=>{if(!craftFill(E.needList(cr.need))){toast("Missing items in your bags");return;}craftLast=null;craftPop();},"small wide");o.dataset.known=cr.id;p.appendChild(o);});
  odd.forEach(([key,m])=>{const o=tapBtn(R.ITEMS[E.FAIL_ITEM[m.kind]].n+" · "+craftIdsText(m.ids),()=>{if(!craftFill(m.ids)){toast("Missing items in your bags");return;}craftLast=null;craftPop();},"small wide");o.dataset.oddmix=key;p.appendChild(o);});}
 const cl=tapBtn("Close",()=>{craftReset();craftLast=null;p.remove();if(craftK===0)tutDraw();},"small");cl.dataset.craftclose="1";p.appendChild(cl);ov.appendChild(p);if(craftK===0)tutDraw();return p;}
// ---- Jeremy t2356u/t2357u: first-camp lesson (Camp 1, once; live.campTut is kept in the save). The player crafts the tent
// themselves (1 spider silk + 1 boar hide from the starting kit); nothing is handed over. Then Save uses exactly 1 tent. ----
let tutStep=0;
function tutDraw(){const old=$("s5tut");if(old)old.remove();{const p0=$("s5craftpop");if(p0&&p0.style)p0.style.maxHeight="";}ov.querySelectorAll(".s5hl").forEach(e=>e.classList.remove("s5hl"));if(!tutStep||!live||ui!=="camp")return;
 const pop=$("s5craftpop"),t=el("div","s5tut");t.id="s5tut";t.setAttribute("role","dialog");let step,txt,hl=null;
 if(tutStep===4){step=4;txt="You made a tent! You can only save at camping spots, only with a tent in your bag, and each save uses one tent.";}
 else if(!pop){step=1;txt="Tap Craft at the top. Crafting turns monster parts and food into useful things.";hl=ov.querySelector("[data-craftopen]");}
 else if(craftBox.includes("p_silk")&&craftBox.includes("p_hide")&&craftBox.filter(Boolean).length===2){step=3;txt="Now press Craft to make your tent.";hl=pop.querySelector("#s5craft");}
 else{step=2;txt="Tap a box and put in 1 Spider silk. Then put 1 Boar hide in the next box.";hl=pop.querySelector(".s5cboxes");}
 t.dataset.step=step;t.appendChild(el("div","s4lab","Camp lesson · step "+step+" of 4"));t.appendChild(el("div","s4note",txt));
 const row=el("div","s4row");
 if(step===4){const sv=tapBtn("Save",()=>{const cp=$("s5craftpop");if(cp)cp.remove();campSave(0,()=>{tutStep=0;campScreen(0);});},"small");sv.dataset.tutsave="1";row.appendChild(sv);hl=sv;}
 const sk=tapBtn(step===4?"Done":"Skip",()=>{tutStep=0;tutDraw();},"small");sk.dataset.tutskip="1";row.appendChild(sk);t.appendChild(row);
 ov.appendChild(t);if(hl)hl.classList.add("s5hl");
 /* t2437u QA: on short screens (360x640) the lesson panel covered the pop-up's Close; the pop-up now ends above the panel and scrolls inside */
 if(pop&&pop.style&&pop.getBoundingClientRect&&t.getBoundingClientRect){const pr=pop.getBoundingClientRect(),tr=t.getBoundingClientRect();if(tr.height&&pr.bottom>tr.top-6){const mh=Math.floor(tr.top-6-pr.top);pop.style.maxHeight=Math.max(120,mh)+"px";const over=pop.getBoundingClientRect().bottom-(tr.top-6);/* padding and border sit outside max-height */if(over>0)pop.style.maxHeight=Math.max(120,mh-Math.ceil(over))+"px";}}}
function cookbook(back){s5init();const w=page("cookbook");w.appendChild(head("Cooking guide",back||partyScreen));const n=Object.keys(live.recipes).length;w.appendChild(el("div","s4note",n+" of 20 recipes · ✎ cooked yourself · ◉ bought"));
 const g=el("div","s5book");E.DISHES.forEach((d,i)=>{const how=live.recipes[d.id],c=el("div","s5rc"+(how?" known "+how:""));c.dataset.rc=d.id;
  if(how){c.appendChild(el("b","",(how==="earned"?"✎ ":"◉ ")+d.n));c.appendChild(el("div","s4sub",d.ing.map(x=>R.ITEMS["i_"+x].n).join(" + ")));c.appendChild(el("div","s4sub s5fx",E.fxText(d.fx)+" · "+E.TIERN[d.tier]));c.appendChild(el("div","s4sub dim",how==="earned"?"learned by cooking":"bought at a tavern"));}
  else{c.appendChild(el("b","dim",(i+1)+". ? ? ?"));c.appendChild(el("div","s4sub dim","not learned"));}g.appendChild(c);});w.appendChild(g);}
function tentScreen(t){s5init();const w=shopPage("tent",t,"Build a tent",()=>shopList(t,"craft"));goldLine(w);
 w.appendChild(el("div","s4note","A tent weighs nothing. You need one to save at a camp. Each tent is good for 1 save at a camp. Taverns save for free. Tents owned: "+haveN("tent")+"."));
 const bt=tapBtn("Buy a tent · "+E.TENT.buy+" gold",()=>{buy("tent");tentScreen(t);},"small");bt.dataset.buytent="1";if(live.gold<E.TENT.buy)bt.classList.add("off");const br0=el("div","s4row");br0.appendChild(bt);w.appendChild(br0);
 w.appendChild(el("div","s4lab","Or build one: parts + "+E.TENT.fee+" gold fee"));const need=tentNeed();
 need.forEach(x=>{const P=E.PARTS[x.id],z=P[2],r=el("div","s4st s5need"+(x.have>=x.n?" ok":""));r.dataset.need=x.id;withIc(r,x.id);r.appendChild(el("span","s4k",R.ITEMS[x.id].n+" ("+(z.length===1?"only zone "+z[0]:"zones "+z[0]+"-"+z[z.length-1])+")"));r.appendChild(el("span","s4v",Math.min(x.have,x.n)+" / "+x.n));w.appendChild(r);});
 const ok=need.every(x=>x.have>=x.n),row=el("div","s4row"),sj=spareJunk().reduce((s,id)=>s+E.sellPrice(id),0);
 const b1=tapBtn("Build, pay "+E.TENT.fee+" gold",()=>{buildTent(false);tentScreen(t);},"small");b1.dataset.build="gold";const b2=tapBtn("Build, pay with junk",()=>{buildTent(true);tentScreen(t);},"small");b2.dataset.build="junk";
 if(!ok){b1.classList.add("off");b2.classList.add("off");}row.appendChild(b1);row.appendChild(b2);w.appendChild(row);w.appendChild(el("div","s4note dim","Spare junk you carry is worth "+sj+" gold toward the fee."+(t>=2?" This tavern sells tent parts (Buy ‹ Craft).":"")));}
// ---- level-up popup after a won fight ----
function lvlPopup(lines){const old=$("s5lvl");if(old)old.remove();const p=el("div","s5pop");p.id="s5lvl";p.setAttribute("role","dialog");p.appendChild(el("div","s4win","Level up!"));lines.forEach(l=>p.appendChild(el("div","s4note",l)));
 const b=tapBtn("OK",()=>{p.remove();remind(pointsReminder());},"small");/* t2437u QA: same as the join reminder */b.id="s5lvlok";p.appendChild(b);ov.appendChild(p);}
// ---------- top button + hint ----------
const pb=$("partyb");function updBtn(){pb.classList.toggle("need",!live);$("s4hint").style.display=live?"none":"block";}
pb.addEventListener("click",e=>{e.preventDefault();if(S.mapOpen&&S.mapOpen())return;if(S.puzzleOpen&&S.puzzleOpen())return;if(ui)return;if(!live)creation();else partyScreen();});
if(save)restore();
updBtn();if(localStorage.getItem(DEV_NOFIGHT)!=="1"){const boot=()=>{if(window.SOTA_INTRO_BOOT)window.SOTA_INTRO_BOOT();else if(!live)creation();};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();}/* t2103u: intro.js shows the title-only menu first */window.addEventListener("resize",()=>{if(fcv&&ui==="fight")sizeF();closeBranch();});
const sceneCSS=el("style");sceneCSS.textContent=`
.s6tap{display:flex;flex-direction:column;gap:4px;padding:4px 0}.s6tapStats{display:grid;grid-template-columns:1fr 1fr;gap:2px 12px}.s6tapRow{display:flex;justify-content:space-between;gap:6px;border-bottom:1px solid rgba(200,160,90,.22);font-size:14px}.s6tapDesc{font-size:15px;line-height:1.35}
.s6cmp{position:fixed;inset:0;z-index:45;background:rgba(5,2,12,.62);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}
.s6cmpCard{width:100%;max-width:360px;max-height:calc(100vh - 48px);overflow-y:auto;box-sizing:border-box;background:#1c1230;border:2px solid #c8a05a;border-radius:12px;padding:12px 14px;color:#efe0b8;font:16px/1.35 Georgia,serif;box-shadow:0 8px 30px rgba(0,0,0,.7)}
.s6cmpTop{display:flex;align-items:center;gap:10px;margin-bottom:8px}.s6cmpName{flex:1;font-size:19px;line-height:1.2}.s6cmpNow{margin:2px 0 8px}
.s6cmpRows{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}.s6cmpRow{display:flex;justify-content:space-between;gap:8px;padding:4px 8px;border-radius:8px;background:rgba(255,255,255,.05);font-size:17px}
.s6cmpRow.up b{color:#7dff8a}.s6cmpRow.down b{color:#ff8a7a}.s6cmpRow.same{color:#c8b890}.s6cmpFT{color:#c8b890;font-size:14px}
.s6cmpBtns{display:flex;gap:10px}.s6cmpBtns .s4b{flex:1;min-height:48px}
#s4 .s5scene{box-sizing:border-box;max-width:none;min-height:100%;background-position:center;background-size:cover;background-repeat:no-repeat;padding-bottom:100px}
#s4 .s5scene.s5hub{background-size:contain;background-position:center}
.s5scene .s4head,.s5scene .s4note,.s5scene .s4opt{background-color:rgba(12,8,18,.88);border-radius:8px;padding:10px;color:#efe0b8}
.s5hubnav{position:fixed;bottom:calc(14px + env(safe-area-inset-bottom));left:12px;right:12px;display:flex;justify-content:space-between;gap:10px}
.s5hubnav button{min-height:48px;min-width:80px;max-width:30%;flex:0 1 130px}
html.s6open #s4.tavern .s5hubnav{visibility:hidden;pointer-events:none}
.s5camp .s5tabs{position:fixed;right:12px;top:calc(74px + env(safe-area-inset-top));width:150px}
/* t2522u/t2655u owner shop: tabs in a bottom grid (3+2 portrait, 5 in a row landscape), 48px, bottom safe area; header and Gold on top, Back top right compact so the owner name stays on one line at 360 */
#s4 .s5shop .s5tabs{position:fixed;left:8px;right:8px;top:auto;bottom:calc(8px + env(safe-area-inset-bottom));width:auto;max-width:560px;margin:0 auto;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;align-items:stretch;z-index:5}
#s4 .s5shop .s5tabs .s5tab{width:auto;min-width:0;min-height:48px;grid-column:span 2}
#s4 .s5shop .s5tabs .s5tab:nth-child(n+4){grid-column:span 3}
@media(orientation:landscape){#s4 .s5shop .s5tabs{grid-template-columns:repeat(5,1fr);max-width:none}#s4 .s5shop .s5tabs .s5tab:nth-child(n){grid-column:auto}}
.s5scene .s5tabs button{min-height:46px;background:rgba(12,8,18,.95)}
.s5shop .s4back{position:fixed;right:12px;top:calc(12px + env(safe-area-inset-top));width:auto;min-width:64px;min-height:46px;padding-left:14px;padding-right:14px}
.s5shop .s4head{margin-right:0;padding-right:88px}.s5shop .s4title{white-space:nowrap}
.s5shop .s5gold{align-self:flex-start;margin-bottom:var(--ownBand,0px)}
.s5shop .s4opt,.s5shop .s4lab{max-width:520px}
html.s5shop-open #s6d{right:0;overflow:hidden;clip-path:inset(0);background:transparent;pointer-events:none}
html.s5shop-open #s6d .s6box{left:8px;right:8px;bottom:calc(12px + env(safe-area-inset-bottom));max-height:40vh;overflow-y:auto;pointer-events:auto}
html.s5shop-open:has(#s4 .s5shop .s5tabs) #s6d .s6box{bottom:calc(var(--s5tabsH,118px) + 8px)}/* t2522u: the talk sits above the bottom tabs */
.s5camp .s5craftb{position:fixed;top:calc(10px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:6;min-height:44px;min-width:92px;margin:0}
#s4 .s5craftpop{top:9%;width:min(360px,92vw);max-height:84vh;overflow-y:auto;z-index:40}
html:has(.s5craftpop) #s4toast{top:auto;bottom:calc(12px + env(safe-area-inset-bottom))}/* t2404u: "You made ...!" no longer covers the Tap a box hint */
.s5cboxes{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;width:100%}
.s5cbox{min-height:64px;font-size:12px;text-align:center;line-height:1.15;padding:4px;border:2px dashed #8a7a5a;background:rgba(30,20,40,.9);color:#efe0b8;border-radius:8px}
.s5cbox.full{border-style:solid;border-color:#ffe08a}.s5cbox.sel{outline:2px solid #ffe08a}
.s5cpick{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;width:100%}
.s5cres{display:flex;flex-direction:column;align-items:center;gap:4px}
#s5craftpic{width:72px;height:72px;image-rendering:pixelated;background:#d8c8a0;border:2px solid #ffe08a;border-radius:4px}
#s4 .s5tut{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom));width:min(360px,92vw);z-index:45;background:rgba(14,8,30,.97);border:2px solid #ffe08a;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;text-align:center}
#s4 .s5hl{box-shadow:0 0 0 3px #ffe08a,0 0 18px 6px rgba(255,224,138,.75);animation:s5hlp 1.1s ease-in-out infinite alternate}
@keyframes s5hlp{from{box-shadow:0 0 0 2px #ffe08a,0 0 8px 2px rgba(255,224,138,.5)}to{box-shadow:0 0 0 4px #ffe08a,0 0 22px 8px rgba(255,224,138,.9)}}
#s4.save-picker{z-index:70}
#s4.save-picker button[data-save-slot]{min-height:64px}
/* t2721u fix1: final locks. The letter ends above the dialogue box (--s6top); on a tall phone the speaker portrait steps aside while a
   lock is open; on a wide screen the letter sits left and the talk with the lock sits right. The lock's arrow buttons keep their size. */
#s6d:has(.s7lock) .s6wall{max-width:88vw;max-height:calc(var(--s6top,50vh) - 18px - env(safe-area-inset-top))}
#s6d .s7lock{align-items:flex-start}
@media(max-aspect-ratio:1/1){#s6d:has(.s7lock) .s6pf{display:none}}
@media(min-aspect-ratio:1/1){#s6d:has(.s7lock) .s6box{left:calc(50% + 8px);right:12px}#s6d:has(.s7lock) .s6wall{left:25%;max-width:calc(50vw - 28px);max-height:calc(100vh - 28px - env(safe-area-inset-top) - env(safe-area-inset-bottom))}}
@media(max-width:480px){.s5shop .s4head{font-size:14px}.s5camp>.s4note{margin-right:166px}.s5hubnav{gap:6px}}
`;document.head.appendChild(sceneCSS);
/* t2721u fix1: watch for the ending's credits, then offer the end-of-game save once the story box closes */
if(typeof MutationObserver==="function"&&document.body){new MutationObserver(ms=>{for(const m of ms)if(m.target&&m.target.dataset&&m.target.dataset.endScreen==="credits")endSeen=true;}).observe(document.body,{subtree:true,attributes:true,attributeFilter:["data-end-screen"]});
 new MutationObserver(()=>{if(endSeen&&!document.documentElement.classList.contains("s6open")){endSeen=false;setTimeout(offerEndSave,0);}}).observe(document.documentElement,{attributes:true,attributeFilter:["class"]});}
// ================= t2759u special class gear (Jeremy t2745u-t2758u; rules in gear.js) =================
// Hero only (party[0]) and only that class; a pass or a fail uses the item up; a refused use keeps it. The roll uses only the item's stat.
const GEAR=window.SOTA_GEAR||null;
let specialRoll=()=>Math.random();
function zoneHere(){const p=S.state();return p.zone||+C.zoneOf[p.y*N+p.x]||1;}
function clsName(k){return R.CLASSES[k]?R.CLASSES[k].name:k;}
const SPECIAL_WHAT={g_lockpick:"Skips a room's puzzle. If it fails, the door needs two puzzles.",g_crystal:"Shows the way to the nearest tavern, camp or door you have not found. If it fails, this zone's map is forgotten.",
 g_hide:"No wandering monsters for 5 minutes (monster doors still fight). If it fails, monsters come 3 times as often for 5 minutes.",g_rope:"Takes the party to the last tavern you reached. If it fails, back to the very first square."};
function specialDesc(id){const g=GEAR&&GEAR.ITEMS[id];if(!g)return "A tool for the road.";const h=live&&live.party[0],mine=!!h&&h.cls===g.cls;
 return "Special gear for a "+clsName(g.cls)+" hero only. "+SPECIAL_WHAT[id]+" Uses "+GEAR.STAT_NAME[g.stat]+(mine?": "+Math.round(GEAR.chance(GEAR.statOf(h,id))*100)+"% chance now.":".")+" Used up either way.";}
// shop: every shop lists all four; only the hero's class can buy. The price is the zone's (always above the Tent, the priciest shop item).
function specialRows(w,t){if(!GEAR||!live)return;const z=zoneHere(),h=live.party[0];w.appendChild(el("div","s4lab","Special gear"));
 GEAR.IDS.forEach(id=>{const g=GEAR.ITEMS[id],p=GEAR.price(z),mine=!!h&&h.cls===g.cls;shopRow(w,g.icon+" "+g.n+" · "+p+"g"+(mine?"":" · "+clsName(g.cls)+" only"),{buy:id,special:id},()=>riskAsk(id,t),!mine||live.gold<p);});
 w.appendChild(el("div","s4note dim","Hero only. Used up when used, pass or fail."));}
function closeRisk(){const p=document.getElementById("s7risk");if(p){p.remove();return true;}return false;}
// t2758u: the warning shows before any gold is taken; gold moves only on Buy
function riskAsk(id,t){closeRisk();const g=GEAR&&GEAR.ITEMS[id];if(!g||!live)return null;const p=GEAR.price(zoneHere()),h=live.party[0];
 if(!h||h.cls!==g.cls){toast("Only a "+clsName(g.cls)+" hero can use this.");return null;}
 const bg=el("div","s6cmp");bg.id="s7risk";bg.dataset.item=id;bg.setAttribute("role","dialog");bg.setAttribute("aria-modal","true");bg.setAttribute("aria-label","Buy "+g.n+"?");
 const card=el("div","s6cmpCard");card.appendChild(el("b","s6cmpName",g.icon+" Buy "+g.n+" for "+p+" gold?"));
 const warn=el("div","s7riskWarn","Use at your own risk");warn.dataset.risk="1";warn.style.cssText="margin:10px 0;padding:8px 10px;border:2px solid #a12119;border-radius:8px;background:#f8e0c8;color:#7a1410;font:700 18px Georgia,serif;text-align:center";card.appendChild(warn);
 card.appendChild(el("div","s4note",specialDesc(id)));
 const btns=el("div","s6cmpBtns"),cn=tapBtn("Cancel",()=>closeRisk(),"small"),ok=tapBtn("Buy",()=>{closeRisk();buySpecial(id,t);shopList(t,"craft");},"small");cn.dataset.riskcancel="1";ok.dataset.riskbuy="1";if(live.gold<p)ok.disabled=true;
 btns.appendChild(cn);btns.appendChild(ok);card.appendChild(btns);card.addEventListener("click",e=>e.stopPropagation());bg.addEventListener("click",e=>{e.preventDefault();closeRisk();});bg.appendChild(card);document.body.appendChild(bg);return bg;}
function buySpecial(id,t){const g=GEAR&&GEAR.ITEMS[id];if(!g||!live)return false;const h=live.party[0];if(!h||h.cls!==g.cls){toast("Only a "+clsName(g.cls)+" hero can use this.");return false;}
 const p=GEAR.price(zoneHere());if(live.gold<p){toast("Not enough gold");return false;}const who=addLoot(id);if(!who){toast("Nobody can carry that");return false;}live.gold-=p;toast("Bought "+g.n+" ("+who+")");h6("shop");return true;}
function nearBoss(){const p=S.state();return Math.abs(p.x-M.centre[0])+Math.abs(p.y-M.centre[1])<=2;}
// rope pass target: the last tavern reached (live.lastTav); old saves fall back to the tavern they were saved at; else none
function ropeTarget(){const L=live&&live.lastTav;if(L&&Number.isInteger(L.t)&&Number.isInteger(L.x)&&Number.isInteger(L.y)&&tavIdx(L.x,L.y)===L.t)return {t:L.t,x:L.x,y:L.y,f:(L.f|0)&3};
 const a=save&&save.at;if(a&&Number.isInteger(a.x)&&Number.isInteger(a.y)&&tavIdx(a.x,a.y)>=0)return {t:tavIdx(a.x,a.y),x:a.x,y:a.y,f:(a.f|0)&3};return null;}
// crystal ball: nearest tavern, camp or room door that the map has not found, along real maze edges (through unwalked maze, never through
// a room door on the way or a tavern archway; zone cap respected)
function crystalRoute(){if(!GEAR||!S.map||!S.map.isFound||!C.mask||!S.roomAt)return null;const p=S.state(),start=p.y*N+p.x,kinds=new Map(),X=i=>i%N,Y=i=>(i/N)|0;
 M.camps.forEach(c=>kinds.set(c[1]*N+c[0],"camp"));M.taverns.forEach(c=>kinds.set(c[1]*N+c[0],"tavern"));M.rooms.forEach(r=>kinds.set(r.c[1]*N+r.c[0],"door"));
 return GEAR.route({N,mask:C.mask,start,kindOf:i=>kinds.get(i),isTarget:i=>kinds.has(i)&&!S.map.isFound(X(i),Y(i)),isRoom:i=>S.roomAt(X(i),Y(i))>=0,
  noCross:(i,d)=>!!S.archAhead&&S.archAhead(X(i),Y(i),d)>=0,isOpen:i=>!S.contentCap||S.contentCap.isOpen(X(i),Y(i))});}
function crystalDone(){const r=live&&live.crystal;if(!r||!S.map||!S.map.isFound)return;if(S.map.isFound(r.to%N,(r.to/N)|0)){delete live.crystal;toast("You found it! The crystal ball's path fades.");}}
function specialWhyNot(id,opt){const g=GEAR&&GEAR.ITEMS[id];if(!g||!live)return "That is not special gear.";if(!live.party.some(c=>c.bag.includes(id)))return "You don't have one.";
 const why=GEAR.heroCheck(live.party,id);if(why==="class")return "Only a "+clsName(g.cls)+" hero can use this.";if(why==="down")return "Your hero is knocked out.";if(why)return "Only your hero can use this.";
 if(inFight())return "Not during a fight.";if(S.storyOpen&&S.storyOpen())return "Not now.";
 if(g.use==="lockpick"){const rid=opt&&opt.room;if(!(rid>=0)||!M.rooms[rid])return "Use it on a puzzle door.";if(C.solvedR[rid])return "That door is already open.";if(live.lockFail&&live.lockFail[rid]>0)return "This lock is jammed. Solve the puzzles.";}
 if(id==="g_crystal"&&nearBoss())return "It doesn't work on the boss door.";
 if(id==="g_rope"&&!ropeTarget())return "You haven't reached a tavern yet.";
 if(id==="g_crystal"&&!crystalRoute())return "There is nothing left to find from here.";
 if(id==="g_hide"&&GEAR.hideMode(live.hide))return "Hide smell is still working.";
 return null;}
function useSpecial(id,opt){const why=specialWhyNot(id,opt);if(why){toast(why);return {ok:false,why};}
 const g=GEAR.ITEMS[id],h=live.party[0],p=GEAR.chance(GEAR.statOf(h,id)),pass=specialRoll()<p,route=id==="g_crystal"&&pass?crystalRoute():null,tg=id==="g_rope"?ropeTarget():null;
 takeOne(id);if(g.use!=="lockpick")closeUI();let msg="";
 if(id==="g_hide"){live.hide={mode:pass?"pass":"fail",left:GEAR.HIDE_MS};msg=pass?"Hide smell worked! No wandering monsters for 5 minutes. Monster doors still fight.":"Hide smell went wrong! Monsters smell you and come 3 times as often for 5 minutes.";}
 else if(id==="g_rope"){if(pass){S.teleport(tg.x,tg.y,tg.f);/* counts as walking in: heal, companion, save, tavern screen */if(S.onArchBump)S.onArchBump(tg.t);msg="The rope worked! You are at Tavern "+(tg.t+1)+".";}
  else{S.teleport(M.entrance[0],M.entrance[1],0);msg="The rope snapped! You are back at the very first square.";}}
 else if(id==="g_crystal"){if(pass){live.crystal={to:route.to,kind:route.kind,path:route.path.slice()};msg="The crystal ball shows the way to the nearest "+(route.kind||"place")+" you have not found. Look at the map.";}
  else{const z=zoneHere();if(S.wipeZone)S.wipeZone(z);if(live.crystal&&+C.zoneOf[live.crystal.to]===z)delete live.crystal;msg="The crystal ball cracked! Your map of Zone "+z+" is gone. Walk it again to draw it.";}}
 else if(id==="g_lockpick"){if(!pass){live.lockFail=live.lockFail||{};live.lockFail[opt.room]=GEAR.LOCK_ROUNDS;}msg=pass?"Click! The lockpick opened the door.":"The lockpick broke and jammed the lock! Now you must solve two puzzles.";}
 toast(msg);updHere();return {ok:true,pass,p};}
// hide smell: 5 minutes of real play time, counted only while the maze is showing (paused in menus, fights, map, puzzles, talks and while
// the app is hidden). Kept as time left in live, so a camp or tavern save keeps it and loading that save brings it back.
let hideAt=null;
function hideTick(ms){const now=performance.now(),dt=ms!=null?ms:(hideAt==null?0:now-hideAt);hideAt=now;if(!live||!live.hide)return;
 if(!(live.hide.left>0)||!GEAR||!GEAR.hideMode(live.hide)){delete live.hide;return;}
 if(ui||F||(S.storyOpen&&S.storyOpen())||(S.mapOpen&&S.mapOpen())||(S.puzzleOpen&&S.puzzleOpen())||(S.panelOpen&&S.panelOpen())||(typeof document!=="undefined"&&document.hidden))return;
 live.hide.left-=Math.max(0,Math.min(dt,1000));/* a long sleep of the app never eats the timer */if(live.hide.left<=0){delete live.hide;toast("Hide smell wore off.");}}
setInterval(()=>hideTick(),250);
S.gearLock={total:GEAR?GEAR.LOCK_ROUNDS:2,rounds:rid=>live&&live.lockFail&&live.lockFail[rid]>0?live.lockFail[rid]|0:0,
 solvedRound:rid=>{if(live&&live.lockFail&&live.lockFail[rid]>0){live.lockFail[rid]--;if(live.lockFail[rid]<=0)delete live.lockFail[rid];}},
 can:rid=>!!GEAR&&!!live&&!specialWhyNot("g_lockpick",{room:rid}),use:rid=>useSpecial("g_lockpick",{room:rid})};
// test and debug hooks (no network, no secrets)
S.rpg={syncMazeSlots,tapMazeSlot,assignMazeSlot,clearMazeSlot,clearMazeSlots,mazeSlotChoices,useMazeSlot,s5:{CAMP_ART,partySeats,occupancyArt,tavernBg,campArt,campMood,campBg,tavernLabels,leaveTavern,leaveShop,campRest,zoneOpen,shopCounts,buyScreen,shopList,sellScreen,tavernScreen,campScreen,cookScreen,eatScreen,eatCooked,cookedChoices,partyMeal,clearMealBuffs,migrateMealBuffs,mealLine,cookbook,tentScreen,cookTry,craftPop,craftTry,craftNeedText,craftIdsText,craftPut,craftClear,craftReset,craftFill,craftChoices,craftBoxes:()=>craftBox.slice(),tutStep:()=>tutStep,tutDraw,drawPix,eatFrom,buy,sell,buyRecipe,buildTent,giveDish,checkSpoil,eatDish,haveN,lvlPopup,updHere,tickBuffs,spareJunk},startBoss:()=>{keepFinalLocks();return startFight([R.makeBoss(live.diff)],"boss");},live:()=>live,save:()=>save,closeUI,savePicker,moveItems,moveItem,campSave,frameScenes,saveSlots,loadSlot,activeSlot:()=>activeSlot,spotName,slotName,lossLoad,offerEndSave,endSaveDue,doSave:()=>doSave(false),restore,startFight:(mons)=>startFight(mons,"test"),fightHere,fight:()=>F,ui:()=>ui,creation,partyScreen,statScreen,skillScreen,equipScreen,bagScreen,fightTimes:()=>ftimes.slice(),
 gear:GEAR_API,itemInfo:{quick:itemQuick,desc:itemDesc,compare:equipCompare,openCompare:cmpPanel,closeCompare:closeCmp},setLive:o=>{live=o;syncMazeSlots();},forceEnd:how=>{if(F){F.over=how;drawMenu();}},branch,closeBranch,charScreen,act:(cmd,arg,t)=>doAct(cmd,arg,t),turn:()=>turnI,
 figs:()=>{if(!fcv||!F)return null;const W=fcv.width,H=fcv.height,s=scl(W,H),d=fcv.width/fcv.clientWidth,hh=heroH(W,H);const bx=(l,r,t,b)=>({l:l/d,r:r/d,t:t/d,b:b/d});
  return{w:fcv.clientWidth,h:fcv.clientHeight,s:s/d,mons:F.m.map((m,i)=>{const q=monRect(i,W,H);return bx(q.x-q.w/2,q.x+q.w/2,q.y-q.h-Math.max(10,s*0.1)-Math.max(10,Math.round(s*0.17)),q.y);}),heroes:live.party.map((c,i)=>{const[x,y]=hpos(i,W,H),im=heroArt(c),w=im?hh*im.naturalWidth/im.naturalHeight:hh*0.8;return bx(x-w/2-hh*0.18,x+w/2,y-hh*1.25,y+2);}),bgv:F.bgv,sprites:F.m.map(monKey)};}};
S.rpg.special={buy:buySpecial,ask:riskAsk,closeAsk:closeRisk,use:useSpecial,whyNot:specialWhyNot,route:()=>live&&live.crystal||null,crystalRoute,ropeTarget,tick:hideTick,desc:specialDesc,zoneHere,
 setRoll:f=>{specialRoll=typeof f==="function"?f:(()=>Math.random());}};
syncMazeSlots();
})();
