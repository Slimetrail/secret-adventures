/* Secret of the Adventures - Stage 4: hero creation, party screen, equip, backpack, turn-based fights, camp/tavern saves, death restore.
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
function validSave(o){try{return o&&o.v===1&&Array.isArray(o.party)&&o.party.length>=1&&o.party.length<=4&&o.party.every(c=>R.allowed(c.race,c.cls)&&c.lvl>=1&&c.lvl<=R.CAP)&&R.DIFF[o.diff]&&o.at&&o.at.x>=0&&o.at.x<N&&o.at.y>=0&&o.at.y<N&&o.rooms&&Array.isArray(o.rooms.s)&&Array.isArray(o.rooms.c);}catch(e){return false;}}
// Four independent saves; active points at the last written/loaded slot. SAVE mirrors it for older builds.
const SLOT=SAVE+".slot",ACTIVE=SAVE+".active";
let activeSlot=0;
function readSave(key){try{const o=JSON.parse(localStorage.getItem(key)||"null");return validSave(o)?o:null;}catch(e){return null;}}
function saveSlots(){const slots=Array.from({length:4},(_,i)=>readSave(SLOT+i));
 if(!slots.some(Boolean)){const old=readSave(SAVE);if(old){slots[0]=old;try{localStorage.setItem(SLOT+0,JSON.stringify(old));}catch(e){}}}return slots;}
{const slots=saveSlots();let i=0;try{i=Number(localStorage.getItem(ACTIVE)||0);}catch(e){}
 activeSlot=Number.isInteger(i)&&i>=0&&i<4&&slots[i]?i:Math.max(0,slots.findIndex(Boolean));
 if(slots[activeSlot]){save=slots[activeSlot];live=clone(save);}}
function hpMul(){return R.DIFF[live.diff].hp;}
function roomsNow(){const s=[],c=[];for(let i=0;i<C.solvedR.length;i++){if(C.solvedR[i])s.push(i);if(C.clearedR[i])c.push(i);}return {s,c};}
function placeName(x,y){const t=M.taverns.findIndex(c=>c[0]===x&&c[1]===y);if(t>=0)return "Tavern "+(t+1);const k=M.camps.findIndex(c=>c[0]===x&&c[1]===y);return k>=0?"Camp "+(k+1):"the start";}
// make a save. Only allowed at a camp or tavern (or once, at the very start when the hero is made).
function doSave(start,slot=activeSlot){if(!Number.isInteger(slot)||slot<0||slot>3)return false;const p=S.state();if(!start&&!R.isSavePoint(M,p.x,p.y))return false;
 if(!start&&tavIdx(p.x,p.y)<0){s5init();const same=save&&save.at&&save.at.x===p.x&&save.at.y===p.y;if(!hasTent())return false;if(!same){live.tentWear++;if(live.tentWear>=E.TENT.nights){takeOne("tent");live.tentWear=0;}}}
 // Camp scene gates observe arrival injuries; seen flags enter this save. Saving never rests.
 if(!start&&tavIdx(p.x,p.y)<0)h6("camp",M.camps.findIndex(c=>c[0]===p.x&&c[1]===p.y));
 live.at={x:p.x,y:p.y,f:p.f,name:start?"the start":placeName(p.x,p.y)};live.rooms=roomsNow();if(S.mazeSnap)live.maze=S.mazeSnap();if(!Array.isArray(live.beasts))live.beasts=[];const next=clone(live);
 try{localStorage.setItem(SLOT+slot,JSON.stringify(next));localStorage.setItem(ACTIVE,String(slot));localStorage.setItem(SAVE,JSON.stringify(next));}catch(e){toast("Could not save. Storage may be full.");return false;}
 activeSlot=slot;save=next;return true;}
function loadSlot(slot){const o=saveSlots()[slot];if(!o)return false;
 try{localStorage.setItem(ACTIVE,String(slot));localStorage.setItem(SAVE,JSON.stringify(o));}catch(e){toast("Could not load save.");return false;}
 activeSlot=slot;save=clone(o);closeUI();restore();return true;}
function savePicker(mode,done,cancel){const w=page("save-picker");w.appendChild(head(mode==="load"?"Load a save":"Choose a save slot",cancel||closeUI));
 const slots=saveSlots();slots.forEach((o,i)=>{const b=tapBtn("Slot "+(i+1)+" · "+(o?(o.party[0].name+" · "+(o.at.name||placeName(o.at.x,o.at.y))):"Empty"),()=>{
  if(mode==="load"){if(loadSlot(i)&&done)done();}else if(doSave(false,i)&&done)done();},"wide");b.dataset.saveSlot=i;b.disabled=mode==="load"&&!o;w.appendChild(b);});}

// death: everything goes back to the last save
function restore(){if(!save)return false;campVisit=null;live=clone(save);if(!Array.isArray(live.beasts))live.beasts=[];const r=save.rooms;C.solvedR.fill(0);C.clearedR.fill(0);r.s.forEach(i=>C.solvedR[i]=1);r.c.forEach(i=>C.clearedR[i]=1);S.saveRooms();
 if(S.applyMaze)S.applyMaze(save.maze||{x:save.at.x,y:save.at.y,f:save.at.f});else S.teleport(save.at.x,save.at.y,save.at.f);stepsSince=0;}
function toast(t){const d=$("s4toast");d.textContent=displayText(t);d.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>d.classList.remove("on"),2200);}
// ---------- screens ----------
const ov=$("s4");function openUI(kind){ui=kind;document.documentElement.classList.add("s4open");ov.className="open "+kind;ov.dataset.kind=kind;document.documentElement.classList.remove("s5shop-open");closeBranch();}
function closeUI(){campVisit=null;ui=null;document.documentElement.classList.remove("s5shop-open");document.documentElement.classList.remove("s4open");ov.className="";ov.dataset.kind="";ov.dataset.result="";ov.innerHTML="";closeBranch();updBtn();}
S.uiOpen=()=>!!ui;
function head(title,back){const h=el("div","s4head");h.appendChild(el("div","s4title",title));if(back)h.appendChild(tapBtn("Back",back,"s4back"));return h;}
// typing in a stage 4 screen must never reach the walk/map keys (w a s d m and arrows were eaten before = fix round 1)
window.addEventListener("keydown",e=>{const t=e.target&&e.target.tagName;if(ui||t==="INPUT"||t==="TEXTAREA")e.stopImmediatePropagation();},true);
// re-render a page but keep where it was scrolled to
function page(kind){const top=ui===kind?ov.scrollTop:0;openUI(kind);ov.innerHTML="";const w=el("div","s4page");ov.appendChild(w);requestAnimationFrame(()=>{ov.scrollTop=top;});ov.scrollTop=top;return w;}
// ---- portraits: small busts cut from the fight figure (same art, cached) ----
const PCACHE=new Map();
function portrait(c){const k=c.race+"|"+c.cls;if(PCACHE.has(k))return PCACHE.get(k);const cv=document.createElement("canvas");cv.width=cv.height=96;const g=cv.getContext("2d");
 const bgc={warrior:"#3a1620",rogue:"#1a1f2c",archer:"#14281c",mage:"#1e1840"}[c.cls],rg=g.createRadialGradient(40,30,4,48,48,70);rg.addColorStop(0,bgc);rg.addColorStop(1,"#07040e");g.fillStyle=rg;g.fillRect(0,0,96,96);
 drawHero(g,Object.assign({},c,{hp:1}),56,150,150,0,false);const u=cv.toDataURL();PCACHE.set(k,u);return u;}
function pimg(c,cls){const i=el("img",cls||"s4por");i.src=portrait(c);i.alt="";return i;}
function bar(v,mx,cls){const b=el("span","s4bar "+(cls||""));const f=el("span","s4barf");f.style.width=Math.max(0,Math.min(100,v/mx*100))+"%";b.appendChild(f);return b;}
// ---- compact branching menu: tap a name, small labels branch out (flip near edges) ----
let br=null,brBox=null;
function closeBranch(){if(br){br.remove();br=null;}brBox=null;const fp=document.getElementById("fparty");if(fp)fp.classList.remove("treeopen");}
// items: [{t:label, fn, kids:[...] or ()=>[...], off, d:{data attrs}}]
function branch(anchor,items,level,owner,fight){level=level||0;if(level===0){closeBranch();if(fight){const P=$("fbot").getBoundingClientRect(),land=innerWidth>innerHeight;brBox={r:P,dir:land?"col":"row"};}br=el("div","s4br");br.id="s4br";br.addEventListener("click",e=>{if(e.target===br)closeBranch();});
  br.insertAdjacentHTML("beforeend",'<svg class="s4brl"></svg>');document.body.appendChild(br);if(brBox){const P=brBox.r,bk=el("div","s4brbk");bk.style.cssText="left:"+P.left+"px;top:"+P.top+"px;width:"+P.width+"px;height:"+P.height+"px";bk.addEventListener("click",()=>closeBranch());br.insertBefore(bk,br.firstChild);}}
 [...br.querySelectorAll(".s4bcol")].filter(c=>+c.dataset.lv>=level).forEach(c=>c.remove());[...br.querySelectorAll("path")].filter(p=>+p.dataset.lv>=level).forEach(p=>p.remove());
 const col=el("div","s4bcol");col.dataset.lv=level;br.appendChild(col);
 items.forEach(it=>{const b=el("button","s4bi"+(it.off?" off":""),it.t);if(it.d)for(const k in it.d)b.dataset[k]=it.d[k];if(it.kids)b.classList.add("more");
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
 items.forEach(it=>{const b=el("button","s4bi"+(it.off?" off":""),it.t);if(it.d)for(const k in it.d)b.dataset[k]=it.d[k];if(it.kids)b.classList.add("more");
  b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();if(it.off)return;[...col.children].forEach(x=>x.classList.remove("open"));
   if(it.kids){b.classList.add("open");const k=typeof it.kids==="function"?it.kids():it.kids;slideTree(k.length?k:[{t:"(none)",off:true}],level+1);}else{closeBranch();it.fn();}});col.appendChild(b);});
 // too wide for the screen: hide the oldest columns (Back brings them back)
 const cols=[...sl.querySelectorAll(".s4bcol")],need=()=>cols.filter(c=>c.style.display!=="none").reduce((s,c)=>s+c.offsetWidth+8,-8);for(const c of cols){if(need()<=sl.clientWidth||c===col)break;c.style.display="none";}
 return col;}
// ---- character creation ----
const cc={name:"Hero",race:"human",cls:"warrior",add:{str:0,sta:0,man:0},skill:null,diff:"normal",warned:false,err:""};
function ccSpent(){const b=R.RACES[cc.race].base;return ["str","sta","man"].reduce((t,k)=>t+R.spendCost(b[k],b[k]+cc.add[k]),0);}
function ccChange(f){return ()=>{f();cc.warned=false;cc.err="";creation();};}
function creation(){const w=page("create");w.classList.add("cc");w.appendChild(head("Make your hero"));
 w.appendChild(el("div","s4note","Pick a name, race and class, spend 10 points, choose a skill, then Confirm."));
 w.appendChild(el("div","s4lab","1. Name"));const nm=el("input","s4name");nm.id="ccname";nm.maxLength=14;nm.placeholder="Type your hero's name";nm.value=cc.name;nm.autocomplete="off";nm.setAttribute("enterkeyhint","done");
 nm.addEventListener("input",()=>{cc.name=nm.value;if(cc.err&&nm.value.trim()){cc.err="";const e=$("ccerr");if(e)e.textContent="";}});nm.addEventListener("keydown",e=>{if(e.key==="Enter")nm.blur();});w.appendChild(nm);
 w.appendChild(el("div","s4lab","2. Race"));const rr=el("div","s4row");for(const k in R.RACES){const b=tapBtn(R.RACES[k].name,ccChange(()=>{cc.race=k;if(!R.allowed(k,cc.cls))cc.cls=R.RACES[k].classes[0];cc.add={str:0,sta:0,man:0};cc.skill=null;}),cc.race===k?"sel":"");b.dataset.race=k;rr.appendChild(b);}w.appendChild(rr);
 w.appendChild(el("div","s4note",{human:"Any class, any armor. Average.",elf:"Mage, archer, rogue, warrior. Armor up to medium. Strong mana.",dwarf:"Warrior, rogue, archer. No magic. Very strong, carries a lot.",cat:"Mage, rogue, warrior. Light armor only. Strong stamina, weak strength, carries little."}[cc.race]));
 w.appendChild(el("div","s4lab","3. Class"));const cr=el("div","s4row");for(const k in R.CLASSES){const ok=R.allowed(cc.race,k),b=tapBtn(R.CLASSES[k].name,ccChange(()=>{if(!ok)return;cc.cls=k;cc.skill=null;}),(cc.cls===k?"sel":"")+(ok?"":" off"));b.dataset.cls=k;b.disabled=!ok;cr.appendChild(b);}w.appendChild(cr);
 const left=R.START_POINTS-ccSpent();const lab=el("div","s4lab","4. Stats - points left: "+left);lab.id="ccleft";w.appendChild(lab);
 const SN={str:"Strength",sta:"Stamina",man:"Mana"},b=R.RACES[cc.race].base;
 for(const k of["str","sta","man"]){const v=b[k]+cc.add[k],row=el("div","s4stat");row.appendChild(el("span","s4sn",SN[k]+(R.CLASSES[cc.cls].main===k?" *":"")));
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
function ccConfirm(){const nmEl=$("ccname");if(nmEl)cc.name=nmEl.value;const left=R.START_POINTS-ccSpent();
 if(!cc.name.trim()){cc.err="Type a name for your hero first.";creation();const n=$("ccname");if(n)n.scrollIntoView({block:"center"});return;}
 if(!cc.skill){cc.err="Pick a starting skill (step 5).";creation();return;}
 if(left>0&&!cc.warned){cc.warned=true;cc.err="You still have "+left+" stat point"+(left>1?"s":"")+" left. Spend them, or tap Confirm anyway.";creation();return;}
 const h=R.newChar(cc.name.trim(),cc.race,cc.cls,cc.add,cc.skill);
 const kit={warrior:["sword","leather"],rogue:["dagger","leather"],archer:["bow","leather"],mage:["staff","robe"]}[cc.cls];kit.forEach(id=>{if(id==="leather"&&!R.canEquip(h,id,"chest"))id="robe";h.bag.push(id);R.equip(h,id,R.ITEMS[id].slot);});h.bag.push("potion","potion","ether");
 live={v:1,party:[h],gold:20,diff:cc.diff,seed:(Math.random()*1e9)|0,steps:0,fresh:{},recipes:{},tentWear:0,beasts:[]};live.party[0].hp=R.maxHp(h,hpMul());if(S.resetRun)S.resetRun();doSave(true);cc.warned=false;cc.err="";closeUI();toast("Welcome, "+h.name+"! Your hero is in the party. Game saved.");h6("created");}
// ---- party screen: portrait + panel cards; tap anywhere on a card for the character sheet ----
function gearText(c){const n=s=>c.equip[s]&&R.ITEMS[c.equip[s]].n;const a=[n("weapon"),n("offhand")].filter(Boolean),b=[n("helmet"),n("chest"),n("gloves"),n("boots"),n("acc1"),n("acc2")].filter(Boolean);return [a.join(", ")||"No weapon",b.join(", ")||"No armor"];}
function partyScreen(){const w=page("party");w.appendChild(head("Party",closeUI));
 w.appendChild(el("div","s4note","Gold "+live.gold+"  ·  "+R.DIFF[live.diff].name+"  ·  last save: "+(save.at.name||"?")));
 const g=el("div","s4roster");live.party.forEach((c,i)=>{const card=el("div","s4rc");card.dataset.card=i;card.setAttribute("role","button");card.appendChild(pimg(c));const info=el("div","s4ri");
  const top=el("div","s4rn");top.appendChild(el("b","",c.name));top.appendChild(el("span","s4sub","Lv "+c.lvl+" "+R.RACES[c.race].name+" "+R.CLASSES[c.cls].name));info.appendChild(top);
  const mx=R.maxHp(c,hpMul());const h=el("div","s4hpl");h.appendChild(el("span","s4k","HP"));h.appendChild(bar(c.hp,mx,"hp"));h.appendChild(el("span","s4v",c.hp+"/"+mx));info.appendChild(h);
  const m=el("div","s4hpl");m.appendChild(el("span","s4k","MP"));m.appendChild(bar(c.mp,R.maxMp(c),"mp"));m.appendChild(el("span","s4v",c.mp+"/"+R.maxMp(c)));info.appendChild(m);
  const sl=statLine(c);info.appendChild(el("div","s4sub","STR "+c.stats.str+" · STA "+c.stats.sta+" · MAN "+c.stats.man+" · ATK "+sl.atk+" · DEF "+sl.def));
  gearText(c).forEach(x=>info.appendChild(el("div","s4gear",x)));
  const flags=[];if(R.pointsEarned(c.lvl)-c.spent>0)flags.push("stat points");if(c.skills.length<R.skillSlots(c.lvl))flags.push("new skill");if(flags.length)info.appendChild(el("div","s4sub glowt",flags.join(" · ")+" ready"));
  card.appendChild(info);card.addEventListener("click",e=>{e.preventDefault();charScreen(i);});g.appendChild(card);});w.appendChild(g);w.appendChild(el("div","s4note dim","Tap a character to open the character sheet."));const cg=tapBtn("Cooking guide",()=>cookbook(partyScreen),"small");cg.dataset.guide="1";w.appendChild(cg);}
function statScreen(i){const c=live.party[i];const w=page("stats");w.appendChild(head(c.name+" - stats",()=>charScreen(i)));
 w.appendChild(el("div","s4lab","Points left: "+(R.pointsEarned(c.lvl)-c.spent)));
 for(const k of["str","sta","man"]){const row=el("div","s4stat");row.appendChild(el("span","s4sn",{str:"Strength",sta:"Stamina",man:"Mana"}[k]));row.appendChild(el("span",""));row.appendChild(el("span","s4sv",String(c.stats[k])));
  const pl=tapBtn("+",()=>{R.raise(c,k);statScreen(i);},"s4pm");pl.dataset.raise=k;row.appendChild(pl);row.appendChild(el("span","s4cost","costs "+R.cost(c.stats[k])));w.appendChild(row);}}
function skillScreen(i){const c=live.party[i];const w=page("skill");w.appendChild(head(c.name+" - new skill",()=>charScreen(i)));
 R.SKILLS[c.cls].filter(s=>!c.skills.includes(s.id)).forEach(s=>{const b=tapBtn(s.n+"  ("+s.mp+" MP)",()=>{R.learn(c,s.id);charScreen(i);},"wide");b.dataset.lskill=s.id;w.appendChild(b);});}
// ---- character sheet: figure with square slots, stats, backpack boxes. Tap item then slot, or slot then item ----
const SLN={weapon:"Weapon",offhand:"Off-hand",helmet:"Helmet",chest:"Chest",gloves:"Gloves",boots:"Boots",acc1:"Ring",acc2:"Ring"};
const ICON={weapon:"M8 32 L28 12 M24 8 L32 8 L32 16 M11 25 L15 29",offhand:"M20 6 L32 10 L31 22 Q28 31 20 34 Q12 31 9 22 L8 10 Z",helmet:"M8 26 Q8 8 20 8 Q32 8 32 26 L26 26 L26 20 L14 20 L14 26 Z",chest:"M12 8 L20 12 L28 8 L33 14 L29 18 L29 33 L11 33 L11 18 L7 14 Z",
 gloves:"M12 33 L12 16 Q12 12 15 12 L15 20 L15 8 Q18 6 19 8 L19 19 L20 7 Q23 5 24 8 L24 19 L26 10 Q29 9 29 12 L28 33 Z",boots:"M14 6 L24 6 L24 24 L33 28 L33 34 L12 34 Z",acc1:"M20 30 A8 8 0 1 0 20.01 30 M16 12 L20 7 L24 12",acc2:"M20 30 A8 8 0 1 0 20.01 30 M16 12 L20 7 L24 12",
 use:"M16 6 L24 6 L24 12 Q32 16 32 24 Q32 34 20 34 Q8 34 8 24 Q8 16 16 12 Z",junk:"M8 14 L20 8 L32 14 L32 28 L20 34 L8 28 Z M8 14 L20 20 L32 14 M20 20 L20 34",acc:"M20 30 A8 8 0 1 0 20.01 30 M16 12 L20 7 L24 12"};
function icon(s){const v=el("span","s4icw");v.innerHTML='<svg class="s4ic" viewBox="0 0 40 40"><path d="'+(ICON[s]||ICON.junk)+'"/></svg>';return v;}
function statLine(c){return {atk:Math.round(R.power(c)),mag:Math.round(R.magicPower(c)),def:Math.round(R.defense(c)),hp:R.maxHp(c,hpMul())};}
function diffText(a,b){const out=[];for(const[k,n]of[["atk","ATK"],["mag","MAG"],["def","DEF"],["hp","HP"]]){const d=b[k]-a[k];if(d)out.push((d>0?"+":"")+d+" "+n);}return out;}
function fits(id,s){const t=R.ITEMS[id];return t&&(t.slot===s||(s.startsWith("acc")&&t.slot==="acc"));}
function figure(c){const cv=document.createElement("canvas");cv.className="s4fig";cv.width=240;cv.height=300;const g=cv.getContext("2d");
 const rg=g.createRadialGradient(120,110,10,120,150,190);rg.addColorStop(0,"#3a2a4a");rg.addColorStop(1,"#0a0610");g.fillStyle=rg;g.fillRect(0,0,240,300);
 const tg=g.createRadialGradient(40,40,2,40,40,160);tg.addColorStop(0,"rgba(255,170,80,.35)");tg.addColorStop(1,"rgba(255,170,80,0)");g.fillStyle=tg;g.fillRect(0,0,240,300);
 g.fillStyle="rgba(0,0,0,.45)";g.beginPath();g.ellipse(120,282,62,10,0,0,7);g.fill();drawHero(g,Object.assign({},c,{hp:1}),120,286,175,0,false);
 g.strokeStyle="rgba(200,160,90,.5)";g.lineWidth=2;g.strokeRect(3,3,234,294);return cv;}
let sheetSel=null; // {slot} or {bag:index}
function charScreen(i,pick){const c=live.party[i];if(pick)sheetSel={slot:pick};const w=page("equip");w.classList.add("sheet");w.appendChild(head(c.name,()=>{sheetSel=null;partyScreen();}));
 const strip=el("div","s4pick");live.party.forEach((m,k)=>{const b=el("button","s4pk"+(k===i?" sel":""));b.dataset.pick=k;b.appendChild(pimg(m,"s4pkp"));const t=el("span","s4pkt");t.appendChild(el("b","",m.name));t.appendChild(el("span","",R.CLASSES[m.cls].name+" Lv "+m.lvl));b.appendChild(t);b.addEventListener("click",e=>{e.preventDefault();sheetSel=null;charScreen(k);});strip.appendChild(b);});w.appendChild(strip);
 const sl=statLine(c),sel=sheetSel,selItem=sel&&sel.bag!=null?c.bag[sel.bag]:null;
 const colA=el("div","s4colA"),colB=el("div","s4colB");
 // figure with slot squares down both sides
 const doll=el("div","s4doll");const L=el("div","s4slc"),Rr=el("div","s4slc");
 const mk=s=>{const it=c.equip[s]&&R.ITEMS[c.equip[s]],ok=selItem&&fits(selItem,s),b=el("button","s4sq"+(it?" full":"")+(sel&&sel.slot===s?" sel":"")+(ok?(R.canEquip(c,selItem,s)?" ok":" no"):""));b.dataset.slot=s;b.appendChild(icon(s));b.appendChild(el("span","s4sqn",it?it.n:SLN[s]));b.setAttribute("aria-label",SLN[s]+": "+(it?it.n:"empty"));
  b.addEventListener("click",e=>{e.preventDefault();if(selItem!=null&&fits(selItem,s)){tryEquip(c,i,selItem,s);return;}sheetSel=sel&&sel.slot===s?null:{slot:s};charScreen(i);});return b;};
 ["helmet","chest","gloves","boots"].forEach(s=>L.appendChild(mk(s)));["weapon","offhand","acc1","acc2"].forEach(s=>Rr.appendChild(mk(s)));
 const pot=el("div","s4sq belt");pot.appendChild(icon("use"));pot.appendChild(el("span","s4sqn","Potions "+c.bag.filter(x=>R.ITEMS[x].slot==="use").length));Rr.appendChild(pot);
 doll.appendChild(L);doll.appendChild(figure(c));doll.appendChild(Rr);colA.appendChild(doll);
 const st=el("div","s4status");[["HP",c.hp+"/"+sl.hp],["MP",c.mp+"/"+R.maxMp(c)],["Level",c.lvl],["XP next",c.lvl>=R.CAP?"max":R.xpNeed(c.lvl)-c.xp],["STR",c.stats.str],["STA",c.stats.sta],["MAN",c.stats.man],["ATK",sl.atk],["MAG",sl.mag],["DEF",sl.def],["Armor",["","light","medium","any"][R.armorCap(c)]],["Race",R.RACES[c.race].name]].forEach(([k,v])=>{const r=el("div","s4st");r.appendChild(el("span","s4k",k));r.appendChild(el("span","s4v",String(v)));st.appendChild(r);});
 colA.appendChild(st);
 const acts=el("div","s4row");const pts=R.pointsEarned(c.lvl)-c.spent;if(pts>0){const b=tapBtn("Spend "+pts+" points",()=>statScreen(i),"small");b.dataset.stats=i;acts.appendChild(b);}
 if(c.skills.length<R.skillSlots(c.lvl)){const b=tapBtn("Learn skill",()=>skillScreen(i),"small");b.dataset.learn=i;acts.appendChild(b);}
 colA.appendChild(el("div","s4sub","Skills: "+c.skills.map(id=>R.SKILLS[c.cls].find(s=>s.id===id).n).join(", ")));if(acts.children.length)colA.appendChild(acts);
 // info line: what is selected, preview, actions
 const info=el("div","s4info");info.id="s4info";
 if(sel&&sel.slot){const s=sel.slot,cur=c.equip[s];info.appendChild(el("div","s4k",SLN[s]+": "+(cur?R.ITEMS[cur].n:"empty")+" - pick a backpack item that fits"));
  const opts=[...new Set(c.bag)].filter(id=>fits(id,s));if(!opts.length)info.appendChild(el("div","s4note","Nothing in the backpack fits here."));
  opts.forEach(id=>{const ok=R.canEquip(c,id,s);let pv=[];if(ok){const t=clone(c);R.equip(t,id,s);pv=diffText(sl,statLine(t));}
   const o=el("button","s4opt"+(ok?"":" off"));o.dataset.opt=id;o.appendChild(el("span","s4on",R.ITEMS[id].n+(ok?"":" (not allowed)")));const pe=el("span","s4pv");pv.forEach(x=>pe.appendChild(el("span",x[0]==="+"?"up":"down",x)));o.appendChild(pe);
   o.addEventListener("click",e=>{e.preventDefault();tryEquip(c,i,id,s);});info.appendChild(o);});
  if(cur){const o=el("button","s4opt","Take off "+R.ITEMS[cur].n);o.dataset.unequip=s;o.addEventListener("click",e=>{e.preventDefault();if(!R.unequip(c,s))toast("Backpack too heavy");sheetSel=null;charScreen(i);});info.appendChild(o);}}
 else if(selItem){const it=R.ITEMS[selItem];const cnt=c.bag.filter(x=>x===selItem).length,fl=it.slot==="dish"?freshLeft(selItem):null;info.appendChild(el("div","s4k",it.n+(cnt>1?" ×"+cnt:"")+" · "+it.w+" kg"+(it.slot==="junk"||it.slot==="part"?" · "+(it.slot==="part"?"monster part":"junk")+", sells for "+it.v+" gold":"")+(it.slot==="ing"?" · ingredient, never spoils":"")));
  if(it.slot==="dish")info.appendChild(el("div","s4sub",E.fxText(E.dish(it.dish).fx)+(fl!=null?" · spoils in "+fl+" steps":"")));
  const slots=R.SLOTS.filter(s=>fits(selItem,s));if(slots.length){const s=slots.find(x=>!c.equip[x])||slots[0],ok=R.canEquip(c,selItem,s);
   if(ok){const t=clone(c);R.equip(t,selItem,s);const pe=el("div","s4pv");pe.dataset.preview="1";const d=diffText(sl,statLine(t));(d.length?d:["no change"]).forEach(x=>pe.appendChild(el("span",x[0]==="+"?"up":x[0]==="-"?"down":"",x)));info.appendChild(pe);
    info.appendChild(el("div","s4note","Tap a glowing slot to equip."));}else info.appendChild(el("div","s4note bad","Your race or class can't use this."));}
  const row=el("div","s4row s5rowR");if(it.slot==="use")row.appendChild(tapBtn("Use",()=>{c.bag.splice(sel.bag,1);if(it.heal)c.hp=Math.min(R.maxHp(c,hpMul()),c.hp+Math.round(R.maxHp(c,hpMul())*it.heal));else c.mp=R.maxMp(c);sheetSel=null;charScreen(i);},"small"));
  if(it.slot==="dish"){const eb=tapBtn("Eat",()=>{eatFrom(c,sel.bag);sheetSel=null;charScreen(i);},"small");eb.dataset.eat="1";row.appendChild(eb);}
  const dr=tapBtn("Drop",()=>{gone(c.bag[sel.bag]);c.bag.splice(sel.bag,1);sheetSel=null;charScreen(i);},"small");dr.dataset.drop="1";row.appendChild(dr);
  if(live.party.length>1){const gb=tapBtn(sel.give?"Give ▾":"‹ Give",()=>{sheetSel={bag:sel.bag,give:!sel.give};charScreen(i);},"small");gb.dataset.giveb="1";row.appendChild(gb);}
  info.appendChild(row);if(sel.give&&live.party.length>1){const gr=el("div","s4row s5give");gr.appendChild(el("span","s4k","Give to:"));live.party.forEach((m,j)=>{if(j===i)return;const ok=R.canCarry(m,selItem),b=tapBtn(m.name+(ok?"":" (too heavy)"),()=>{if(!ok)return;const kk=c.bag.indexOf(selItem);if(kk<0)return;c.bag.splice(kk,1);m.bag.push(selItem);sheetSel=null;toast(it.n+" given to "+m.name);charScreen(i);},"small");b.dataset.give=j;if(!ok)b.classList.add("off");gr.appendChild(b);});info.appendChild(gr);}}
 else info.appendChild(el("div","s4note dim","Tap a slot or a backpack item. Then tap the other to equip."));
 const wt=R.bagWeight(c),lim=R.carryLimit(c);colB.appendChild(el("div","s4lab","Backpack · Weight "+(Math.round(wt*10)/10)+" / "+lim+" kg"));colB.appendChild(bar(wt,lim,"wt"));
 const grid=el("div","s4bag"),stk=E.stacks(c.bag);stk.forEach(({id,n})=>{const k=c.bag.indexOf(id),it=R.ITEMS[id],fitsSel=sel&&sel.slot&&fits(id,sel.slot),b=el("button","s4sq"+(sel&&sel.bag===k?" sel":"")+(fitsSel?(R.canEquip(c,id,sel.slot)?" ok":" no"):""));b.dataset.bagi=k;b.dataset.item=id;
  b.dataset.n=n;b.appendChild(icon(it.slot));b.appendChild(el("span","s4sqn",it.n));if(n>1)b.appendChild(el("span","s5cnt","×"+n));b.addEventListener("click",e=>{e.preventDefault();if(sel&&sel.slot&&fits(id,sel.slot)){tryEquip(c,i,id,sel.slot);return;}sheetSel=sel&&sel.bag===k?null:{bag:k};charScreen(i);});grid.appendChild(b);});
 for(let k=stk.length;k<Math.max(12,Math.ceil(stk.length/6)*6);k++)grid.appendChild(el("div","s4sq empty"));
 colB.appendChild(info);colB.appendChild(grid);const wrap=el("div","s4cols");wrap.appendChild(colA);wrap.appendChild(colB);w.appendChild(wrap);}
function tryEquip(c,i,id,s){if(R.equip(c,id,s)){sheetSel=null;toast(c.name+" equipped "+R.ITEMS[id].n);}else toast(R.ITEMS[id].n+": your race or class can't use this");charScreen(i);}
function equipScreen(i,pick){charScreen(i,pick);}
function bagScreen(i){sheetSel=null;charScreen(i);}
function addLoot(id){for(const c of live.party)if(R.canCarry(c,id)){c.bag.push(id);return c.name;}return null;}
// ---------- fights ----------
let F=null,fx=[],turnI=0,fcv=null,fctx=null,raf=0,motionEnd=0;
function startFight(mons,why){if(live){if(!Array.isArray(live.beasts))live.beasts=[];(mons||[]).forEach(m=>{const file=MON_FILE[m.n];if(file&&/^z[12]-/.test(file)&&!live.beasts.includes(file))live.beasts.push(file);});}F=new R.Fight(live.party,mons,live.diff,(live.seed+(++fightNo)*7919)|0);F.why=why;{const q=S.state&&S.state();F.bgv=q?((q.x*7+q.y*13+(why==="room"?3:0))%6+6)%6:fightNo%6;}FIGHT_ART.forEach(u=>spr(u.slice(11,-4)));turnI=0;nextAlive();fx=[];motionEnd=0;openUI("fight");ov.innerHTML="";ov.dataset.result="";
 const w=el("div","s4fight");const top=el("div","s4stage");fcv=el("canvas");fcv.id="fcv";top.appendChild(fcv);const log=el("div","s4log","");log.id="flog";top.appendChild(log);w.appendChild(top);
 const bot=el("div","s4fbot");bot.id="fbot";const en=el("div","s4enemies");en.id="fen";bot.appendChild(en);const pr=el("div","s4party");pr.id="fparty";bot.appendChild(pr);const mn=el("div","s4menu");mn.id="fmenu";bot.appendChild(mn);w.appendChild(bot);
 ov.appendChild(w);fctx=fcv.getContext("2d");sizeF();say(mons.map(m=>m.n).join(", ")+" appear!");drawMenu();h6("fightStart");cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
function sizeF(){const d=Math.min(2,window.devicePixelRatio||1),w=Math.round(fcv.clientWidth*d),h=Math.round(fcv.clientHeight*d);if(w&&h&&(fcv.width!==w||fcv.height!==h)){fcv.width=w;fcv.height=h;}}
function say(t){const l=$("flog");if(l)l.textContent=displayText(t);}
function nextAlive(){while(turnI<live.party.length&&live.party[turnI].hp<=0)turnI++;}
function targets(cmd,arg){return F.m.map((m,i)=>m.hp>0?{t:m.n+" · "+m.hp,fn:()=>doAct(cmd,arg,i),d:{tgt:i}}:null).filter(Boolean);}
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
 const nb=el("button","s4nl");nb.dataset.hero=i;nb.disabled=!now;const top=el("span","s4nlt");top.appendChild(el("span","s4arrow",now?"‹":""));top.appendChild(el("span","s4nn",c.name));top.appendChild(el("span","s4pv",c.hp+"/"+mx));nb.appendChild(top);
 const bars=el("span","s4bars");bars.appendChild(bar(c.hp,mx,"hp"));bars.appendChild(bar(c.mp,R.maxMp(c),"mp"));nb.appendChild(bars);nb.addEventListener("click",e=>{e.preventDefault();if(now)heroMenu(nb);});r.appendChild(nb);pr.appendChild(r);});
 const en=$("fen");if(en){en.textContent=F.m.filter(m=>m.hp>0).map(m=>m.n).join(" · ");}}
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
function endFight(){const aftermath=live.party.map(c=>({hp:c.hp,maxHp:R.maxHp(c,hpMul())}));const mn=$("fmenu"),how=F.over;closeBranch();const fe=$("fen");if(fe)fe.style.display="none";
 if(how==="win"){const rw=F.rewards((live.seed^fightNo*31)>>>0);live.gold+=rw.gold;const ups=[];live.party.forEach(c=>{if(c.hp>0){const g=R.gainXp(c,rw.xp,hpMul());if(g.length)ups.push(c.name+" reached level "+c.lvl+(c.skills.length<R.skillSlots(c.lvl)?" - new skill ready!":""));}else c.hp=1;});
  const jn=rw.junk.concat(E.drops(F.m[0].zone,(live.seed^fightNo*131)>>>0)).map(id=>{const who=addLoot(id);return R.ITEMS[id].n+(who?"":" (no room, left behind)");});
  mn.appendChild(el("div","s4win","Victory!"));const bossWon=F.m.some(m=>m.boss);const b=tapBtn("Continue",()=>{F=null;closeUI();if(bossWon)h6("bossWon");else h6("fightContinue",aftermath);},"s4go small");b.id="fdone";mn.appendChild(b);
  mn.appendChild(el("div","s4note","+"+rw.xp+" XP   +"+rw.gold+" gold"+(jn.length?"   Found: "+jn.join(", "):"")));if(ups.length){mn.appendChild(el("div","s4note glowt",ups.join(". ")));lvlPopup(ups);}tickBuffs();ov.dataset.result="win";}
 else if(how==="lose"){mn.appendChild(el("div","s4lose","Everyone is knocked out"));mn.appendChild(el("div","s4note","You wake at your last save: "+(save.at.name||"?")+". Everything since then is lost."));
  const b=tapBtn("Return to last save",()=>{F=null;closeUI();restore();toast("Back at "+save.at.name);},"s4go small");b.id="fdone";mn.appendChild(b);ov.dataset.result="lose";}
 else{const b=tapBtn("Continue",()=>{F=null;closeUI();},"s4go small");b.id="fdone";mn.appendChild(el("div","s4note","You got away."));mn.appendChild(b);tickBuffs();ov.dataset.result="ran";}
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
function drawHero(g,c,x,y,hh,t,act,i){const im=spr(heroKey(c)),dead=c.hp<=0,hit=fx.find(e=>e.k==="enemy"&&e.hero===i&&t>=e.t0&&t<e.t0+e.dur),p=hit?(t-hit.t0)/hit.dur:0,impact=hit&&p>.38&&p<.8;
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
S.afterStep=rid=>{if(!live)return;s5init();live.steps++;checkSpoil();updHere();h6("step");if(localStorage.getItem(DEV_NOFIGHT)==="1")return;const p=S.state();stepsSince++;
 if(R.isSavePoint(M,p.x,p.y)){const t=M.taverns.findIndex(c=>c[0]===p.x&&c[1]===p.y);let joined="";
  if(t>=0){h6("reachedTavern",t);const def=R.companionFor(t,live.party,h6("plan"));if(def){const c=R.makeCompanion(def,R.partyLevel(live.party));live.party.push(c);joined=c.name+" joined the party! ";h6("joined",c,t);}}
  const ok=doSave(false);toast(joined+(ok?"Game saved at "+placeName(p.x,p.y)+".":"No tent: you can't camp or save at "+placeName(p.x,p.y)+". Buy or build one at a tavern."));updBtn();updHere();return;}
 if(S.panelOpen()||(S.storyOpen&&S.storyOpen()))return; // first entry into a room: the room itself decides (see onRoomOpen)
 if(stepsSince<10)return;if(!roll)roll=R.rng(live.seed>>>0);const r=roll();
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
    const b=tapBtn("Drop 1 "+R.ITEMS[drop].n+(n>1?" ("+n+")":""),()=>{const k=c.bag.indexOf(drop);if(k<0)return;c.bag.splice(k,1);gone(drop);if(drop==="tent"&&!hasTent())live.tentWear=0;tryFit();draw();},"wide");b.dataset.chestdrop=ci;b.dataset.chestitem=drop;w.appendChild(b);
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
function tavIdx(x,y){return M.taverns.findIndex(c=>c[0]===x&&c[1]===y);}
function campIdx(x,y){return M.camps.findIndex(c=>c[0]===x&&c[1]===y);}
function hasTent(){return haveN("tent")>0;}
function tickBuffs(){live.party.forEach(c=>{if(c.buff){c.buff.f--;if(c.buff.f<=0)delete c.buff;}});}
function eatDish(c,id){const it=R.ITEMS[id];h6("meal",it,it.slot==="dish"?E.dish(it.dish).fx:null);if(it.slot==="use"){const mh=R.maxHp(c,hpMul());c.hp=Math.min(mh,c.hp+Math.round(mh*(it.heal||0)));return;}const d=E.dish(it.dish),fx=d.fx,mh=R.maxHp(c,hpMul()),mm=R.maxMp(c);
 if(fx.hp)c.hp=Math.min(mh,c.hp+Math.round(mh*fx.hp/100));if(fx.mp)c.mp=Math.min(mm,c.mp+Math.round(mm*fx.mp/100));if(fx.str||fx.sta)c.buff={str:fx.str||0,sta:fx.sta||0,f:fx.f||1,n:d.n};}
function eatFrom(c,k){const id=c.bag[k];c.bag.splice(k,1);gone(id);eatDish(c,id);toast(c.name+" ate "+R.ITEMS[id].n);}
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
function updHere(){const p=S.state&&S.state();let t=-1,k=-1;if(live&&!ui&&p&&!(S.mapOpen&&S.mapOpen())&&!(S.puzzleOpen&&S.puzzleOpen())){t=tavIdx(p.x,p.y);k=t<0?campIdx(p.x,p.y):-1;}const on=t>=0||k>=0;here.style.display=on?"block":"none";if(on){here.textContent="‹ "+(t>=0?"Tavern "+(t+1):"Camp "+(k+1));here.dataset.t=t;here.dataset.k=k;}}
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
function leaveTavern(t,z){if(hubBlocked())return false;if(!zoneOpen(z)){
 if(S.rpg.s6&&S.rpg.s6.play)S.rpg.s6.play("wait-for-update",[["N","calm",WAIT_UPDATE]],{bg:tavernBg(t)});return false;}
 savePicker("save",closeUI,()=>tavernScreen(t,false));return true;}
function tavernScreen(t,arrival=true){s5init();campVisit=null;const w=page("tavern");w.classList.add("s5scene","s5hub");w.style.backgroundImage='url("'+tavernBg(t)+'")';w.appendChild(head("Tavern "+(t+1)));
 const nav=el("div","s5hubnav");tavernLabels(t).forEach((label,i)=>{const b=tapBtn(label,()=>{if(hubBlocked())return;if(i===1)buyScreen(t);else leaveTavern(t,i===0?t+1:t+2);},"small");b.dataset.hub=i;nav.appendChild(b);});w.appendChild(nav);
 if(arrival){h6("ownerVisit",t);h6("tavern",t);}}
function leaveShop(t){savePicker("save",()=>tavernScreen(t,false),()=>buyScreen(t,false));}
function shopPage(kind,t,title,back){const w=page(kind);w.classList.add("s5scene","s5shop");w.style.backgroundImage='url("art6/shop/owner-'+(t+1)+'.webp")';
 document.documentElement.classList.add("s5shop-open");w.appendChild(head(title,back));return w;}
// Shop root Back and Done save, while subpages go up one screen.
function buyScreen(t,line=true){s5init();const w=shopPage("buy",t,E.KEEPERS[t].name+" · Shop",()=>leaveShop(t));goldLine(w);
 sideTabs(w,[["Recipes",null,()=>shopList(t,"recipes"),"recipes"],["Food",null,()=>shopList(t,"food"),"food"],["Craft",null,()=>shopList(t,"craft"),"craft"],["Sell",null,()=>sellScreen(t),"sell"],["Done",null,()=>leaveShop(t),"done"]]);
 if(line)h6("owner",t,"STOCK");}
function shopRow(w,label,data,fn,off){const o=el("button","s4opt s5row"+(off?" off":""));for(const k in data)o.dataset[k]=data[k];o.appendChild(el("span","s4on",label));o.addEventListener("click",e=>{e.preventDefault();fn();});w.appendChild(o);return o;}
function shopList(t,kind){s5init();const st=E.stock(t),w=shopPage("shop-"+kind,t,{recipes:"Recipes",food:"Food",craft:"Craft"}[kind],()=>buyScreen(t,false));w.dataset.list=kind;goldLine(w);
 const q=shopCounts(t),item=id=>shopRow(w,R.ITEMS[id].n+" · "+E.price(id)+"g"+(q[id]!=null?" · Stock "+q[id]:""),{buy:id},()=>{buy(id,t);shopList(t,kind);},live.gold<E.price(id)||q[id]===0);
 if(kind==="recipes"){const l=E.recipesFor(t).filter(id=>!live.recipes[id]);if(!l.length)w.appendChild(el("div","s4note dim","You know all the recipes sold here."));
  l.forEach(id=>{const d=E.dish(id);shopRow(w,d.n+" · "+E.RECIPE_PRICE[d.tier]+"g",{recipe:id},()=>{buyRecipe(id);shopList(t,kind);},live.gold<E.RECIPE_PRICE[d.tier]);});}
 else if(kind==="food"){["ration","potion","ether","salts"].concat(st.ing).forEach(item);}
 else{w.appendChild(el("div","s4lab","Tent"));item("tent");shopRow(w,"‹ Build a tent from parts",{tentb:"1"},()=>tentScreen(t)).querySelector(".s4on").classList.add("s5more");
  w.appendChild(el("div","s4lab","Gear"));["lockpick","rope"].concat(st.gear).forEach(item);
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
 w.appendChild(el("div","s4note",hasTent()?"Tent pitched. Nights left on this tent: "+(E.TENT.nights-live.tentWear):"A tent is required to save at camp. Buy or build one in the shop."));
 sideTabs(w,[["Cook",null,()=>cookScreen("c"+k),"cook"],["Rest",null,()=>campRest(k),"rest"],["Return",null,closeUI,"return"]]);}
function foodTree(back){const out=[];live.party.forEach((c,ci)=>E.stacks(c.bag).forEach(s=>{const it=R.ITEMS[s.id];if(it.slot==="dish"||s.id==="ration")out.push({t:it.n+(s.n>1?" ×"+s.n:"")+" ("+c.name+")",d:{food:s.id},kids:()=>live.party.map(m=>({t:"Feed "+m.name,fn:()=>{const k=c.bag.lastIndexOf(s.id);if(k<0)return;c.bag.splice(k,1);gone(s.id);eatDish(m,s.id);toast(m.name+" ate "+it.n);back();}}))});}));return out.length?out:[{t:"No food",off:true}];}
let cookSel=[];
function cookScreen(where){s5init();const k=where&&where[0]==="c"?+where.slice(1):Math.max(0,campIdx(S.state().x,S.state().y));where="c"+k;const back=()=>campScreen(k);const w=page("cook");w.classList.add("s5scene","s5camp");w.style.backgroundImage='url("'+campArt("eating")+'")';w.appendChild(head("Cooking",()=>{cookSel=[];back();}));
 w.appendChild(tapBtn("Cooking guide",()=>cookbook(()=>cookScreen(where)),"small"));
 const have=E.stacks(live.party.flatMap(c=>c.bag)).filter(s=>R.ITEMS[s.id].slot==="ing");
 w.appendChild(el("div","s4note","Pick 2 to 4 ingredients, then cook. A wrong mix ruins them and teaches nothing."));
 const chips=el("div","s5chips");have.forEach(s=>{const x=s.id.slice(2),n=cookSel.filter(y=>y===x).length,b=el("button","s4bi s5chip"+(n?" sel":""),R.ITEMS[s.id].n+" ×"+s.n+(n?" ("+n+")":""));b.dataset.ing=x;
  b.addEventListener("click",e=>{e.preventDefault();if(n<s.n&&cookSel.length<4)cookSel.push(x);else cookSel=cookSel.filter(y=>y!==x);cookScreen(where);});chips.appendChild(b);});
 if(!have.length)chips.appendChild(el("div","s4note dim","No ingredients. Monsters drop food, taverns sell it."));w.appendChild(chips);
 const row=el("div","s4row");const cb=tapBtn("Cook"+(cookSel.length?" ("+cookSel.map(x=>R.ITEMS["i_"+x].n).join(" + ")+")":""),()=>{const r=cookTry(cookSel,where);cookSel=[];
  if(r.err)toast(r.err==="heavy"?"Nobody can carry the dish":"Missing ingredients");else if(r.fail)toast("That didn't work. The ingredients are ruined.");else toast("You cooked "+r.dish.n+(r.learnt?"! Recipe added to your guide.":""));cookScreen(where);},"small");cb.id="s5cook";if(cookSel.length<2)cb.disabled=true;row.appendChild(cb);w.appendChild(row);
 const known=E.DISHES.filter(d=>live.recipes[d.id]);if(known.length){w.appendChild(el("div","s4lab","Known recipes"));known.forEach(d=>{const ok=d.ing.every(x=>haveN("i_"+x)>=d.ing.filter(y=>y===x).length),o=el("button","s4opt"+(ok?"":" off"));o.dataset.again=d.id;
  o.appendChild(el("span","s4on",d.n+" · "+d.ing.map(x=>R.ITEMS["i_"+x].n).join(", ")));o.addEventListener("click",e=>{e.preventDefault();if(!ok){toast("Missing ingredients");return;}cookSel=d.ing.slice();cookScreen(where);});w.appendChild(o);});}}
function cookbook(back){s5init();const w=page("cookbook");w.appendChild(head("Cooking guide",back||partyScreen));const n=Object.keys(live.recipes).length;w.appendChild(el("div","s4note",n+" of 20 recipes · ✎ cooked yourself · ◉ bought"));
 const g=el("div","s5book");E.DISHES.forEach((d,i)=>{const how=live.recipes[d.id],c=el("div","s5rc"+(how?" known "+how:""));c.dataset.rc=d.id;
  if(how){c.appendChild(el("b","",(how==="earned"?"✎ ":"◉ ")+d.n));c.appendChild(el("div","s4sub",d.ing.map(x=>R.ITEMS["i_"+x].n).join(" + ")));c.appendChild(el("div","s4sub s5fx",E.fxText(d.fx)+" · "+E.TIERN[d.tier]));c.appendChild(el("div","s4sub dim",how==="earned"?"learned by cooking":"bought at a tavern"));}
  else{c.appendChild(el("b","dim",(i+1)+". ? ? ?"));c.appendChild(el("div","s4sub dim","not learned"));}g.appendChild(c);});w.appendChild(g);}
function tentScreen(t){s5init();const w=shopPage("tent",t,"Build a tent",()=>shopList(t,"craft"));goldLine(w);
 w.appendChild(el("div","s4note","A tent weighs nothing. You need one to camp and save at a camp. Each tent lasts "+E.TENT.nights+" nights. Tents owned: "+haveN("tent")+"."));
 const bt=tapBtn("Buy a tent · "+E.TENT.buy+" gold",()=>{buy("tent");tentScreen(t);},"small");bt.dataset.buytent="1";if(live.gold<E.TENT.buy)bt.classList.add("off");const br0=el("div","s4row");br0.appendChild(bt);w.appendChild(br0);
 w.appendChild(el("div","s4lab","Or build one: parts + "+E.TENT.fee+" gold fee"));const need=tentNeed();
 need.forEach(x=>{const P=E.PARTS[x.id],z=P[2],r=el("div","s4st s5need"+(x.have>=x.n?" ok":""));r.dataset.need=x.id;r.appendChild(el("span","s4k",R.ITEMS[x.id].n+" ("+(z.length===1?"only zone "+z[0]:"zones "+z[0]+"-"+z[z.length-1])+")"));r.appendChild(el("span","s4v",Math.min(x.have,x.n)+" / "+x.n));w.appendChild(r);});
 const ok=need.every(x=>x.have>=x.n),row=el("div","s4row"),sj=spareJunk().reduce((s,id)=>s+E.sellPrice(id),0);
 const b1=tapBtn("Build, pay "+E.TENT.fee+" gold",()=>{buildTent(false);tentScreen(t);},"small");b1.dataset.build="gold";const b2=tapBtn("Build, pay with junk",()=>{buildTent(true);tentScreen(t);},"small");b2.dataset.build="junk";
 if(!ok){b1.classList.add("off");b2.classList.add("off");}row.appendChild(b1);row.appendChild(b2);w.appendChild(row);w.appendChild(el("div","s4note dim","Spare junk you carry is worth "+sj+" gold toward the fee."+(t>=2?" This tavern sells tent parts (Buy ‹ Craft).":"")));}
// ---- level-up popup after a won fight ----
function lvlPopup(lines){const old=$("s5lvl");if(old)old.remove();const p=el("div","s5pop");p.id="s5lvl";p.setAttribute("role","dialog");p.appendChild(el("div","s4win","Level up!"));lines.forEach(l=>p.appendChild(el("div","s4note",l)));
 const b=tapBtn("OK",()=>p.remove(),"small");b.id="s5lvlok";p.appendChild(b);ov.appendChild(p);}
// ---------- top button + hint ----------
const pb=$("partyb");function updBtn(){pb.classList.toggle("need",!live);$("s4hint").style.display=live?"none":"block";}
pb.addEventListener("click",e=>{e.preventDefault();if(S.mapOpen&&S.mapOpen())return;if(S.puzzleOpen&&S.puzzleOpen())return;if(ui)return;if(!live)creation();else partyScreen();});
if(save)restore();
updBtn();if(localStorage.getItem(DEV_NOFIGHT)!=="1"){const boot=()=>{if(window.SOTA_INTRO_BOOT)window.SOTA_INTRO_BOOT();else if(!live)creation();};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();}/* t2103u: intro.js shows the title-only menu first */window.addEventListener("resize",()=>{if(fcv&&ui==="fight")sizeF();closeBranch();});
const sceneCSS=el("style");sceneCSS.textContent=`
#s4 .s5scene{box-sizing:border-box;max-width:none;min-height:100%;background-position:center;background-size:cover;background-repeat:no-repeat;padding-bottom:100px}
#s4 .s5scene.s5hub{background-size:contain;background-position:center}
.s5scene .s4head,.s5scene .s4note,.s5scene .s4opt{background-color:rgba(12,8,18,.88);border-radius:8px;padding:10px;color:#efe0b8}
.s5hubnav{position:fixed;bottom:calc(14px + env(safe-area-inset-bottom));left:12px;right:12px;display:flex;justify-content:space-between;gap:10px}
.s5hubnav button{min-height:48px;min-width:80px;max-width:30%;flex:0 1 130px}
html.s6open #s4.tavern .s5hubnav{visibility:hidden;pointer-events:none}
.s5shop .s5tabs,.s5camp .s5tabs{position:fixed;right:12px;top:calc(74px + env(safe-area-inset-top));width:150px}
.s5scene .s5tabs button{min-height:46px;background:rgba(12,8,18,.95)}
.s5shop .s4back{position:fixed;right:12px;top:calc(12px + env(safe-area-inset-top));width:150px;min-height:46px}
.s5shop .s4head{margin-right:166px}.s5shop .s5gold{align-self:flex-start}
.s5shop .s4opt,.s5shop .s4lab{max-width:520px}
html.s5shop-open #s6d{right:178px;overflow:hidden;clip-path:inset(0);background:transparent;pointer-events:none}
html.s5shop-open #s6d .s6box{left:8px;right:8px;bottom:12px;max-height:65vh;overflow-y:auto;pointer-events:auto}
#s4.save-picker{z-index:70}
#s4.save-picker button[data-save-slot]{min-height:64px}
@media(max-width:480px){.s5shop .s4head{font-size:14px}.s5camp>.s4note{margin-right:166px}.s5hubnav{gap:6px}}
`;document.head.appendChild(sceneCSS);
// test and debug hooks (no network, no secrets)
S.rpg={s5:{CAMP_ART,partySeats,occupancyArt,tavernBg,campArt,campMood,campBg,tavernLabels,leaveTavern,leaveShop,campRest,zoneOpen,shopCounts,buyScreen,shopList,sellScreen,tavernScreen,campScreen,cookScreen,cookbook,tentScreen,cookTry,buy,sell,buyRecipe,buildTent,giveDish,checkSpoil,eatDish,haveN,lvlPopup,updHere,tickBuffs,spareJunk},startBoss:()=>startFight([R.makeBoss(live.diff)],"boss"),live:()=>live,save:()=>save,closeUI,savePicker,saveSlots,loadSlot,activeSlot:()=>activeSlot,doSave:()=>doSave(false),restore,startFight:(mons)=>startFight(mons,"test"),fightHere,fight:()=>F,ui:()=>ui,creation,partyScreen,equipScreen,bagScreen,fightTimes:()=>ftimes.slice(),
 setLive:o=>{live=o;},forceEnd:how=>{if(F){F.over=how;drawMenu();}},branch,closeBranch,charScreen,act:(cmd,arg,t)=>doAct(cmd,arg,t),turn:()=>turnI,
 figs:()=>{if(!fcv||!F)return null;const W=fcv.width,H=fcv.height,s=scl(W,H),d=fcv.width/fcv.clientWidth,hh=heroH(W,H);const bx=(l,r,t,b)=>({l:l/d,r:r/d,t:t/d,b:b/d});
  return{w:fcv.clientWidth,h:fcv.clientHeight,s:s/d,mons:F.m.map((m,i)=>{const q=monRect(i,W,H);return bx(q.x-q.w/2,q.x+q.w/2,q.y-q.h-Math.max(10,s*0.1)-Math.max(10,Math.round(s*0.17)),q.y);}),heroes:live.party.map((c,i)=>{const[x,y]=hpos(i,W,H),im=spr(heroKey(c)),w=im?hh*im.naturalWidth/im.naturalHeight:hh*0.8;return bx(x-w/2-hh*0.18,x+w/2,y-hh*1.25,y+2);}),bgv:F.bgv,sprites:F.m.map(monKey)};}};
})();
