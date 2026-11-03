/* Secret of the Adventures - Stage 4: hero creation, party screen, equip, backpack, turn-based fights, camp/tavern saves, death restore.
   Private build. No ads, no network. Art drawn in code (canvas). Uses window.RPG (rules.js). */
(function(){
"use strict";
const R=window.RPG,S=window.SOTA,M=window.MAZE,C=S.core,N=M.n;
const SAVE="sota.party",DEV_NOFIGHT="sota.dev.nofight";
// Stage 6 story hooks: story.js fills window.S6H; off in maze-only test mode (dev.nofight)
function h6(k,a,b){try{const H=window.S6H;if(!H||!H[k]||localStorage.getItem(DEV_NOFIGHT)==="1")return undefined;return H[k](a,b);}catch(e){console.error(e);return undefined;}}
const $=id=>document.getElementById(id),el=(t,c,txt)=>{const e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e;};
const clone=o=>JSON.parse(JSON.stringify(o));
function tapBtn(label,fn,cls){const b=el("button","ink s4b"+(cls?" "+cls:""),label);b.addEventListener("click",e=>{e.preventDefault();fn();});return b;}
// ---------- state ----------
// live: what you have now. save: the last camp/tavern save (the only thing kept in storage).
let save=null,live=null,ui=null,stepsSince=99,fightNo=0,roll=null;
function validSave(o){try{return o&&o.v===1&&Array.isArray(o.party)&&o.party.length>=1&&o.party.length<=4&&o.party.every(c=>R.allowed(c.race,c.cls)&&c.lvl>=1&&c.lvl<=R.CAP)&&R.DIFF[o.diff]&&o.at&&o.at.x>=0&&o.at.x<N&&o.at.y>=0&&o.at.y<N&&o.rooms&&Array.isArray(o.rooms.s)&&Array.isArray(o.rooms.c);}catch(e){return false;}}
try{const o=JSON.parse(localStorage.getItem(SAVE)||"null");if(validSave(o)){save=o;live=clone(o);}}catch(e){}
function hpMul(){return R.DIFF[live.diff].hp;}
function roomsNow(){const s=[],c=[];for(let i=0;i<C.solvedR.length;i++){if(C.solvedR[i])s.push(i);if(C.clearedR[i])c.push(i);}return {s,c};}
function placeName(x,y){const t=M.taverns.findIndex(c=>c[0]===x&&c[1]===y);if(t>=0)return "Tavern "+(t+1);const k=M.camps.findIndex(c=>c[0]===x&&c[1]===y);return k>=0?"Camp "+(k+1):"the start";}
// make a save. Only allowed at a camp or tavern (or once, at the very start when the hero is made).
function doSave(start){const p=S.state();if(!start&&!R.isSavePoint(M,p.x,p.y))return false;
 if(!start&&tavIdx(p.x,p.y)<0){s5init();const same=save&&save.at&&save.at.x===p.x&&save.at.y===p.y;if(!hasTent())return false;if(!same){live.tentWear++;if(live.tentWear>=E.TENT.nights){takeOne("tent");live.tentWear=0;}}}
 if(!start)live.party.forEach(c=>{c.hp=R.maxHp(c,hpMul());c.mp=R.maxMp(c);}); // resting heals
 live.at={x:p.x,y:p.y,f:p.f,name:start?"the start":placeName(p.x,p.y)};live.rooms=roomsNow();save=clone(live);
 try{localStorage.setItem(SAVE,JSON.stringify(save));}catch(e){}return true;}
// death: everything goes back to the last save
function restore(){live=clone(save);const r=save.rooms;C.solvedR.fill(0);C.clearedR.fill(0);r.s.forEach(i=>C.solvedR[i]=1);r.c.forEach(i=>C.clearedR[i]=1);S.saveRooms();
 S.teleport(save.at.x,save.at.y,save.at.f);stepsSince=0;}
function toast(t){const d=$("s4toast");d.textContent=t;d.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>d.classList.remove("on"),2200);}
// ---------- screens ----------
const ov=$("s4");function openUI(kind){ui=kind;document.documentElement.classList.add("s4open");ov.className="open "+kind;ov.dataset.kind=kind;closeBranch();}
function closeUI(){ui=null;document.documentElement.classList.remove("s4open");ov.className="";ov.dataset.kind="";ov.dataset.result="";ov.innerHTML="";closeBranch();updBtn();}
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
const cc={name:"",race:"human",cls:"warrior",add:{str:0,sta:0,man:0},skill:null,diff:"normal",warned:false,err:""};
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
 live={v:1,party:[h],gold:20,diff:cc.diff,seed:(Math.random()*1e9)|0,steps:0,fresh:{},recipes:{},tentWear:0};live.party[0].hp=R.maxHp(h,hpMul());doSave(true);cc.warned=false;cc.err="";closeUI();toast("Welcome, "+h.name+"! Your hero is in the party. Game saved.");h6("created");}
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
let F=null,fx=[],turnI=0,fcv=null,fctx=null,raf=0;
function startFight(mons,why){F=new R.Fight(live.party,mons,live.diff,(live.seed+(++fightNo)*7919)|0);F.why=why;turnI=0;nextAlive();fx=[];openUI("fight");ov.innerHTML="";ov.dataset.result="";
 const w=el("div","s4fight");const top=el("div","s4stage");fcv=el("canvas");fcv.id="fcv";top.appendChild(fcv);const log=el("div","s4log","");log.id="flog";top.appendChild(log);w.appendChild(top);
 const bot=el("div","s4fbot");bot.id="fbot";const en=el("div","s4enemies");en.id="fen";bot.appendChild(en);const pr=el("div","s4party");pr.id="fparty";bot.appendChild(pr);const mn=el("div","s4menu");mn.id="fmenu";bot.appendChild(mn);w.appendChild(bot);
 ov.appendChild(w);fctx=fcv.getContext("2d");sizeF();say(mons.map(m=>m.n).join(", ")+" appear!");drawMenu();h6("fightStart");cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
function sizeF(){const d=Math.min(2,window.devicePixelRatio||1),w=Math.round(fcv.clientWidth*d),h=Math.round(fcv.clientHeight*d);if(w&&h&&(fcv.width!==w||fcv.height!==h)){fcv.width=w;fcv.height=h;}}
function say(t){const l=$("flog");if(l)l.textContent=t;}
function nextAlive(){while(turnI<live.party.length&&live.party[turnI].hp<=0)turnI++;}
function targets(cmd,arg){return F.m.map((m,i)=>m.hp>0?{t:m.n+" · "+m.hp,fn:()=>doAct(cmd,arg,i),d:{tgt:i}}:null).filter(Boolean);}
function heroMenu(anchor){if(!F||F.over)return;const c=live.party[turnI];const sk=c.skills.map(id=>R.SKILLS[c.cls].find(x=>x.id===id));
 const skItem=s=>({t:s.n+" "+s.mp+"MP",off:c.mp<s.mp,d:{sk:s.id},...((s.k==="phys"||s.k==="magic")&&!s.all?{kids:()=>targets("skill",s.id)}:{fn:()=>doAct("skill",s.id,0)})});
 const items=[{t:"Defend",d:{cmd4:"defend"},fn:()=>doAct("defend",null,0)},{t:"Attack",d:{cmd4:"attack"},kids:()=>targets("attack")},
  {t:"Spells",d:{cmd4:"spells"},off:!sk.length,kids:()=>sk.map(skItem)},
  {t:"Items",d:{cmd4:"item"},kids:()=>[...new Set(c.bag)].filter(id=>R.ITEMS[id].slot==="use").map(id=>R.ITEMS[id].revive?{t:R.ITEMS[id].n+" x"+c.bag.filter(x=>x===id).length,d:{item:id},kids:()=>{const ko=live.party.map((m,j)=>m.hp<=0?{t:"Wake "+m.name,fn:()=>doAct("item",id,j),d:{revive:j}}:null).filter(Boolean);return ko.length?ko:[{t:"Nobody is knocked out",off:true}];}}:({t:R.ITEMS[id].n+" x"+c.bag.filter(x=>x===id).length,fn:()=>doAct("item",id,turnI),d:{item:id}}))},
  {t:"Run",d:{cmd4:"run"},fn:()=>doAct("run",null,0)}];return slideTree(items,0);}
let rotTop=0;
// fight v4: tabs stack in turn order; the member whose turn it is is the top tab, the one who just acted goes to the bottom
function turnOrder(){const n=live.party.length;if(F&&!F.over&&live.party[turnI]&&live.party[turnI].hp>0)rotTop=turnI;rotTop=Math.min(rotTop,n-1);return [...Array(n).keys()].map(k=>(rotTop+k)%n);}
function drawParty(){const pr=$("fparty");if(!pr)return;const was=pr.dataset.top;pr.innerHTML="";const ord=turnOrder();pr.dataset.top=ord[0];if(was!==undefined&&was!==String(ord[0])){pr.classList.remove("rot");void pr.offsetWidth;pr.classList.add("rot");}ord.forEach(i=>{const c=live.party[i];const now=i===turnI&&!F.over&&c.hp>0,r=el("div","s4pr"+(now?" now":"")+(c.hp<=0?" dead":""));const mx=R.maxHp(c,hpMul());
 const nb=el("button","s4nl");nb.dataset.hero=i;nb.disabled=!now;const top=el("span","s4nlt");top.appendChild(el("span","s4arrow",now?"‹":""));top.appendChild(el("span","s4nn",c.name));top.appendChild(el("span","s4pv",c.hp+"/"+mx));nb.appendChild(top);
 const bars=el("span","s4bars");bars.appendChild(bar(c.hp,mx,"hp"));bars.appendChild(bar(c.mp,R.maxMp(c),"mp"));nb.appendChild(bars);nb.addEventListener("click",e=>{e.preventDefault();if(now)heroMenu(nb);});r.appendChild(nb);pr.appendChild(r);});
 const en=$("fen");if(en){en.textContent=F.m.filter(m=>m.hp>0).map(m=>m.n).join(" · ");}}
function drawMenu(){drawParty();const mn=$("fmenu");if(!mn)return;mn.innerHTML="";const fw=document.querySelector(".s4fight");if(fw)fw.classList.toggle("over",!!F.over);if(F.over){endFight();return;}const c=live.party[turnI];mn.appendChild(el("div","s4who",c.name+"'s turn - tap the name"));}
function doAct(cmd,arg,targ){closeBranch();const c=live.party[turnI],before=F.m.map(m=>m.hp);const t=F.act(turnI,cmd,arg,targ);
 const s=cmd==="skill"&&R.SKILLS[c.cls].find(x=>x.id===arg);F.m.forEach((m,i)=>{if(m.hp<before[i])fx.push({i,t0:performance.now(),k:s&&s.k==="magic"?"magic":"hit"});});if(s&&s.k==="heal")fx.push({ally:true,t0:performance.now(),k:"heal"});
 say(t);turnI++;nextAlive();if(!F.over&&turnI>=live.party.length){const out=F.monstersTurn();setTimeout(()=>{if(out.length&&F&&!F.over)say(out.join(". "));},450);turnI=0;nextAlive();}drawMenu();}
function endFight(){const mn=$("fmenu"),how=F.over;closeBranch();const fe=$("fen");if(fe)fe.style.display="none";
 if(how==="win"){const rw=F.rewards((live.seed^fightNo*31)>>>0);live.gold+=rw.gold;const ups=[];live.party.forEach(c=>{if(c.hp>0){const g=R.gainXp(c,rw.xp,hpMul());if(g.length)ups.push(c.name+" reached level "+c.lvl+(c.skills.length<R.skillSlots(c.lvl)?" - new skill ready!":""));}else c.hp=1;});
  const jn=rw.junk.concat(E.drops(F.m[0].zone,(live.seed^fightNo*131)>>>0)).map(id=>{const who=addLoot(id);return R.ITEMS[id].n+(who?"":" (no room, left behind)");});
  mn.appendChild(el("div","s4win","Victory!"));const b=tapBtn("Continue",()=>{F=null;closeUI();},"s4go small");b.id="fdone";mn.appendChild(b);
  mn.appendChild(el("div","s4note","+"+rw.xp+" XP   +"+rw.gold+" gold"+(jn.length?"   Found: "+jn.join(", "):"")));if(ups.length){mn.appendChild(el("div","s4note glowt",ups.join(". ")));lvlPopup(ups);}tickBuffs();ov.dataset.result="win";}
 else if(how==="lose"){mn.appendChild(el("div","s4lose","Everyone is knocked out"));mn.appendChild(el("div","s4note","You wake at your last save: "+(save.at.name||"?")+". Everything since then is lost."));
  const b=tapBtn("Return to last save",()=>{F=null;closeUI();restore();toast("Back at "+save.at.name);},"s4go small");b.id="fdone";mn.appendChild(b);ov.dataset.result="lose";}
 else{const b=tapBtn("Continue",()=>{F=null;closeUI();},"s4go small");b.id="fdone";mn.appendChild(el("div","s4note","You got away."));mn.appendChild(b);tickBuffs();ov.dataset.result="ran";}
 drawParty();h6("fightEnd",how);}
// ---- fight drawing (side view, dark dungeon, inked figures, purple/blue magic) ----
const ZC=[null,[150,112,60],[92,108,62],[70,92,124],[128,52,50],[96,62,128]];
// painted backdrop: stone wall with shaded blocks, arch frame, flagstone floor, vignette (cached), torches flicker per frame
const BGC=new Map();
function bgPaint(W,H,z){const cv=document.createElement("canvas");cv.width=W;cv.height=H;const g=cv.getContext("2d"),zc=ZC[z]||ZC[1],r=R.rng((z*7919+W)>>>0);
 const tint=(k,a)=>"rgba("+(zc[0]*k|0)+","+(zc[1]*k|0)+","+(zc[2]*k|0)+","+a+")";
 g.fillStyle="#0d0912";g.fillRect(0,0,W,H);const fy=H*0.6,bh=Math.max(8,H/15);
 for(let y=0,row=0;y<fy;y+=bh,row++){for(let x=-((row%2)*bh*0.9);x<W;){const bw=bh*(1.4+r()*0.9),l=0.16+r()*0.12;
   const gr=g.createLinearGradient(x,y,x,y+bh);gr.addColorStop(0,"rgba("+(60*l*4|0)+","+(50*l*4|0)+","+(66*l*4|0)+",1)");gr.addColorStop(1,"rgba("+(28*l*4|0)+","+(22*l*4|0)+","+(34*l*4|0)+",1)");
   g.fillStyle=gr;g.beginPath();g.roundRect?g.roundRect(x+1.5,y+1.5,bw-3,bh-3,bh*0.12):g.rect(x+1.5,y+1.5,bw-3,bh-3);g.fill();
   g.fillStyle="rgba(255,240,220,.05)";g.fillRect(x+2,y+2,bw-4,bh*0.18);g.fillStyle="rgba(0,0,0,.25)";g.fillRect(x+2,y+bh*0.78,bw-4,bh*0.2);
   for(let k=0;k<4;k++){g.fillStyle="rgba(0,0,0,"+(0.08+r()*0.12)+")";g.beginPath();g.arc(x+r()*bw,y+r()*bh,1+r()*bh*0.08,0,7);g.fill();}
   if(r()<0.12){g.strokeStyle="rgba(0,0,0,.45)";g.lineWidth=1;g.beginPath();let cx=x+r()*bw,cy=y+2;g.moveTo(cx,cy);for(let s=0;s<3;s++){cx+=(r()-.5)*bh*0.6;cy+=bh*0.3;g.lineTo(cx,cy);}g.stroke();}
   x+=bw;}}
 g.fillStyle=tint(0.35,0.22);g.fillRect(0,0,W,fy);
 // arch opening in the back wall
 const ax=W*0.5,aw=Math.min(W*0.13,H*0.2),at=H*0.16;g.fillStyle="#050309";g.beginPath();g.moveTo(ax-aw,fy);g.lineTo(ax-aw,at+aw);g.arc(ax,at+aw,aw,Math.PI,0);g.lineTo(ax+aw,fy);g.closePath();g.fill();
 const ag=g.createRadialGradient(ax,fy,aw*0.1,ax,fy,aw*1.6);ag.addColorStop(0,tint(0.6,0.35));ag.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=ag;g.fill();
 g.lineWidth=Math.max(3,aw*0.14);g.strokeStyle="#2a2030";g.beginPath();g.moveTo(ax-aw,fy);g.lineTo(ax-aw,at+aw);g.arc(ax,at+aw,aw,Math.PI,0);g.lineTo(ax+aw,fy);g.stroke();g.lineWidth=1.5;g.strokeStyle="#0a0610";g.stroke();
 // flagstone floor in perspective
 const fl=g.createLinearGradient(0,fy,0,H);fl.addColorStop(0,"#2c2236");fl.addColorStop(1,"#120c18");g.fillStyle=fl;g.fillRect(0,fy,W,H-fy);
 g.strokeStyle="rgba(0,0,0,.55)";g.lineWidth=1.2;for(let x=-W;x<W*2;x+=W/8){g.beginPath();g.moveTo(W/2+(x-W/2)*0.5,fy);g.lineTo(x,H);g.stroke();}
 for(let k=1;k<7;k++){const y=fy+(H-fy)*(k*k/49);g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
 g.fillStyle="rgba(0,0,0,.45)";g.fillRect(0,fy,W,Math.max(2,H*0.012));
 // pillars: thin ones on the back wall, wide ones in front at the edges
 const pil=(x,w,top,bot,dk)=>{const pg=g.createLinearGradient(x-w/2,0,x+w/2,0);pg.addColorStop(0,"rgb("+(30*dk|0)+","+(24*dk|0)+","+(34*dk|0)+")");pg.addColorStop(0.45,"rgb("+(84*dk|0)+","+(72*dk|0)+","+(90*dk|0)+")");pg.addColorStop(1,"rgb("+(22*dk|0)+","+(18*dk|0)+","+(26*dk|0)+")");
  g.fillStyle=pg;g.fillRect(x-w/2,top,w,bot-top);g.fillStyle="rgba(0,0,0,.5)";g.fillRect(x-w*0.65,top,w*1.3,w*0.25);g.fillRect(x-w*0.65,bot-w*0.25,w*1.3,w*0.25);g.strokeStyle="#0a0610";g.lineWidth=Math.max(1.5,w*0.06);g.strokeRect(x-w/2,top,w,bot-top);
  for(let yy=top+w*0.6;yy<bot-w*0.3;yy+=w*0.9){g.fillStyle="rgba(0,0,0,.25)";g.fillRect(x-w/2,yy,w,Math.max(1,w*0.05));}};
 [0.28,0.72].forEach(p=>pil(W*p,W*0.035,0,fy,0.8));
 [0.035,0.965].forEach(p=>pil(W*p,W*0.07,0,H,1.1));
 // torches (brackets; the flame is drawn live)
 [0.2,0.8].forEach(p=>{const x=W*p,y=H*0.36;g.fillStyle="#1a1018";g.fillRect(x-W*0.008,y,W*0.016,H*0.12);g.fillStyle="#3a2a20";g.beginPath();g.moveTo(x-W*0.022,y);g.lineTo(x+W*0.022,y);g.lineTo(x+W*0.012,y+H*0.03);g.lineTo(x-W*0.012,y+H*0.03);g.closePath();g.fill();});
 // vignette + inked frame
 const vg=g.createRadialGradient(W/2,H*0.5,Math.min(W,H)*0.3,W/2,H*0.5,Math.max(W,H)*0.75);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.7)");g.fillStyle=vg;g.fillRect(0,0,W,H);
 g.strokeStyle="#0a0610";g.lineWidth=Math.max(3,W/120);g.strokeRect(0,0,W,H);g.strokeStyle="rgba(200,160,90,.35)";g.lineWidth=1;g.strokeRect(W/120+2,W/120+2,W-W/60-4,H-W/60-4);return cv;}
function bg(g,W,H,z){const k=W+"x"+H+"z"+z;let c=BGC.get(k);if(!c){if(BGC.size>6)BGC.clear();c=bgPaint(W,H,z);BGC.set(k,c);}g.drawImage(c,0,0);
 const t=performance.now();[0.2,0.8].forEach((p,i)=>{const x=W*p,y=H*0.35,f=1+Math.sin(t/90+i*2)*0.06+Math.sin(t/37+i)*0.04,rg=g.createRadialGradient(x,y,2,x,y,H*0.55*f);
  rg.addColorStop(0,"rgba(255,170,80,.42)");rg.addColorStop(0.4,"rgba(255,120,40,.12)");rg.addColorStop(1,"rgba(255,120,40,0)");g.fillStyle=rg;g.fillRect(0,0,W,H);
  g.fillStyle="rgba(255,210,120,.95)";g.beginPath();g.ellipse(x,y-H*0.01,W*0.011,H*0.04*f,Math.sin(t/120+i)*0.15,0,7);g.fill();g.fillStyle="rgba(255,250,220,.9)";g.beginPath();g.ellipse(x,y,W*0.005,H*0.016,0,0,7);g.fill();});}
function inked(g,path,fill,lw){g.fillStyle=fill;path();g.fill();g.lineWidth=lw;g.strokeStyle="#0a0610";g.stroke();}
function drawMon(g,m,x,y,s,t){const zc=ZC[m.zone],k=m.kind,sh=g.createRadialGradient(x-s*0.2,y-s*0.3,s*0.1,x,y,s);sh.addColorStop(0,"rgb("+Math.min(255,zc[0]*1.3|0)+","+Math.min(255,zc[1]*1.3|0)+","+Math.min(255,zc[2]*1.3|0)+")");sh.addColorStop(1,"rgb("+(zc[0]*0.35|0)+","+(zc[1]*0.35|0)+","+(zc[2]*0.35|0)+")");
 const bob=Math.sin(t/400+k)*s*0.04,lw=Math.max(2,s*0.06);g.save();g.translate(x,y+bob);
 g.fillStyle="rgba(0,0,0,.45)";g.beginPath();g.ellipse(0,s*0.62-bob,s*0.7,s*0.12,0,0,7);g.fill();
 const tall=k%3===0,wide=k%3===1;
 inked(g,()=>{g.beginPath();if(tall){g.moveTo(-s*0.35,s*0.6);g.quadraticCurveTo(-s*0.5,-s*0.2,-s*0.1,-s*0.55);g.quadraticCurveTo(s*0.35,-s*0.6,s*0.4,s*0.6);g.closePath();}else g.ellipse(0,s*0.2,s*(wide?0.7:0.5),s*(wide?0.38:0.45),0,0,7);},sh,lw);
 inked(g,()=>{g.beginPath();g.ellipse(s*(tall?0.05:0.45),-s*(tall?0.62:0.05),s*0.24,s*0.2,0,0,7);},sh,lw);
 if(k>=4){inked(g,()=>{g.beginPath();g.moveTo(-s*0.1,-s*0.1);g.lineTo(-s*0.75,-s*0.55);g.lineTo(-s*0.5,s*0.05);g.closePath();},"rgba(40,20,50,.9)",lw*0.8);}
 const ex=s*(tall?0.0:0.42),ey=-s*(tall?0.64:0.08);g.fillStyle="rgba(255,"+(m.zone>3?80:200)+",120,.95)";g.shadowColor="rgba(255,120,90,.9)";g.shadowBlur=s*0.15;g.beginPath();g.arc(ex+s*0.08,ey,s*0.045,0,7);g.arc(ex+s*0.17,ey,s*0.04,0,7);g.fill();g.shadowBlur=0;
 g.strokeStyle="rgba(255,255,255,.12)";g.lineWidth=lw*0.5;g.beginPath();g.arc(-s*0.1,s*0.05,s*0.3,3.6,4.6);g.stroke();g.restore();}
function drawHero(g,c,x,y,s,t,act){const col={warrior:[150,60,55],rogue:[60,70,85],archer:[60,110,70],mage:[70,60,150]}[c.cls],dead=c.hp<=0;g.save();g.translate(x,y);if(dead){g.rotate(-1.35);g.globalAlpha=0.55;}
 const lw=Math.max(2,s*0.06),cl=g.createLinearGradient(0,-s,0,s);cl.addColorStop(0,"rgb("+col.join(",")+")");cl.addColorStop(1,"rgb("+col.map(v=>v*0.35|0).join(",")+")");
 g.fillStyle="rgba(0,0,0,.45)";g.beginPath();g.ellipse(0,s*0.62,s*0.4,s*0.09,0,0,7);g.fill();
 inked(g,()=>{g.beginPath();g.moveTo(-s*0.05,-s*0.5);g.quadraticCurveTo(s*0.4,-s*0.2,s*0.32,s*0.6);g.lineTo(-s*0.34,s*0.6);g.quadraticCurveTo(-s*0.36,-s*0.2,-s*0.05,-s*0.5);g.closePath();},cl,lw);
 inked(g,()=>{g.beginPath();g.arc(-s*0.04,-s*0.62,s*0.17,0,7);},"#e8d2b8",lw);
 inked(g,()=>{g.beginPath();g.moveTo(-s*0.24,-s*0.62);g.quadraticCurveTo(-s*0.05,-s*0.95,s*0.16,-s*0.66);g.quadraticCurveTo(s*0.02,-s*0.72,-s*0.24,-s*0.62);},c.race==="elf"?"#d9c27a":c.race==="dwarf"?"#7a3e1e":c.race==="cat"?"#3a2a24":"#2a1c18",lw*0.7);
 if(c.race==="cat"){inked(g,()=>{g.beginPath();g.moveTo(-s*0.18,-s*0.74);g.lineTo(-s*0.14,-s*0.92);g.lineTo(-s*0.05,-s*0.78);g.moveTo(s*0.02,-s*0.78);g.lineTo(s*0.1,-s*0.9);g.lineTo(s*0.12,-s*0.72);},"#3a2a24",lw*0.6);}
 if(c.race==="elf"){inked(g,()=>{g.beginPath();g.moveTo(s*0.1,-s*0.62);g.lineTo(s*0.28,-s*0.72);g.lineTo(s*0.12,-s*0.56);},"#e8d2b8",lw*0.5);}
 g.fillStyle="#0a0610";g.beginPath();g.arc(-s*0.12,-s*0.62,s*0.022,0,7);g.fill();
 const lunge=act?-s*0.15:0;g.strokeStyle=c.cls==="mage"?"#8a6a3a":"#c8ccd8";g.lineWidth=lw*1.2;g.beginPath();
 if(c.cls==="archer"){g.arc(-s*0.42+lunge,-s*0.05,s*0.32,1.9,4.4);g.stroke();}else{g.moveTo(-s*0.2+lunge,-s*0.1);g.lineTo(-s*0.62+lunge,-s*(c.cls==="mage"?0.65:0.42));g.stroke();
  if(c.cls==="mage"){g.fillStyle="rgba(150,110,255,.95)";g.shadowColor="rgba(120,140,255,1)";g.shadowBlur=s*0.25;g.beginPath();g.arc(-s*0.64+lunge,-s*0.7,s*0.07+Math.sin(t/200)*s*0.01,0,7);g.fill();g.shadowBlur=0;}}
 g.restore();}
function burst(g,x,y,s,p,k){const n=18;g.save();g.globalCompositeOperation="lighter";const r=s*(0.3+p*1.1);
 const rg=g.createRadialGradient(x,y,1,x,y,r);const c1=k==="heal"?"120,230,255":"170,110,255",c2=k==="heal"?"60,140,255":"70,120,255";rg.addColorStop(0,"rgba(255,255,255,"+(1-p)+")");rg.addColorStop(0.35,"rgba("+c1+","+(0.9*(1-p))+")");rg.addColorStop(1,"rgba("+c2+",0)");g.fillStyle=rg;g.beginPath();g.arc(x,y,r,0,7);g.fill();
 for(let i=0;i<n;i++){const a=i/n*6.283+p*2,d=r*(0.4+0.6*p);g.fillStyle="rgba("+(i%2?c1:c2)+","+(1-p)+")";g.beginPath();g.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,s*0.04*(1-p)+1,0,7);g.fill();}
 g.strokeStyle="rgba("+c1+","+(1-p)+")";g.lineWidth=s*0.03;g.beginPath();g.arc(x,y,r*0.7,0,7);g.stroke();g.restore();}
let lastT=0;const ftimes=[];
// far camera: small figures standing on a deep floor, horizon at 0.6H
function scl(W,H){return Math.min(W/8.5,H/3.4);}
function mpos(i,W,H){const s=scl(W,H),fy=H*0.6;return[W*(0.12+0.12*(i%3))+(i>2?W*0.06:0),fy+(H-fy)*(i%2?0.62:0.36)-s*0.45+(i>2?(H-fy)*0.12:0)];}
function hpos(i,W,H){const s=scl(W,H),fy=H*0.6;return[W*(0.585+0.093*i),fy+(H-fy)*(i%2?0.6:0.4)-s*0.4];}
function loop(t){if(!F||!fcv){return;}sizeF();const t0=performance.now(),g=fctx,W=fcv.width,H=fcv.height,z=F.m[0].zone;bg(g,W,H,z);
 const s=scl(W,H),fy=H*0.6;const alive=F.m;alive.forEach((m,i)=>{if(m.hp<=0)return;const [x,y]=mpos(i,W,H);
  const f=fx.find(e=>e.i===i&&t-e.t0<120);g.save();if(f){g.translate((Math.random()-.5)*s*0.15,0);}drawMon(g,m,x,y,s*0.8,t);g.restore();
  g.font="700 "+Math.max(10,Math.round(s*0.17))+"px Georgia,serif";g.textAlign="center";g.fillStyle="rgba(0,0,0,.7)";g.fillText(m.n,x+1,y-s*0.92+1);g.fillStyle="#f3d9b0";g.fillText(m.n,x,y-s*0.92);g.textAlign="start";
  g.fillStyle="#22152e";g.fillRect(x-s*0.4,y-s*0.85,s*0.8,Math.max(3,s*0.07));g.fillStyle="#c04060";g.fillRect(x-s*0.4,y-s*0.85,s*0.8*m.hp/m.max,Math.max(3,s*0.07));});
 live.party.forEach((c,i)=>{const [x,y]=hpos(i,W,H);drawHero(g,c,x,y,s*0.75,t,i===turnI&&!F.over);if(i===turnI&&!F.over&&c.hp>0){const ay=y-s*1.0+Math.sin(t/180)*s*0.05;g.fillStyle="#ffe08a";g.shadowColor="rgba(255,220,120,.9)";g.shadowBlur=s*0.15;g.beginPath();g.moveTo(x-s*0.1,ay);g.lineTo(x+s*0.1,ay);g.lineTo(x,ay+s*0.13);g.closePath();g.fill();g.shadowBlur=0;}});
 fx=fx.filter(e=>t-e.t0<700);fx.forEach(e=>{const p=(t-e.t0)/700;if(e.k==="magic"&&!e.ally){const i=e.i,[x,y]=mpos(i,W,H);burst(g,x,y,s,p,"magic");}
  else if(e.k==="heal"){live.party.forEach((c,i)=>{if(c.hp>0)burst(g,hpos(i,W,H)[0],hpos(i,W,H)[1]-s*0.3,s*0.6,p,"heal");});}
  else if(e.k==="hit"){const i=e.i,[x,y]=mpos(i,W,H);g.strokeStyle="rgba(255,240,220,"+(1-p)+")";g.lineWidth=s*0.05;g.beginPath();g.moveTo(x-s*0.4,y-s*0.4+p*s*0.3);g.lineTo(x+s*0.4,y+s*0.3-p*s*0.1);g.stroke();}});
 if(window.__S4_MAGIC_HOLD){burst(g,mpos(1,W,H)[0],mpos(1,W,H)[1],s,0.35,"magic");}
 ftimes.push(performance.now()-t0);if(ftimes.length>240)ftimes.shift();raf=requestAnimationFrame(loop);}
// ---------- hooks from the walk ----------
function zoneAt(x,y){return C.zoneOf[y*N+x];}
function fightHere(why){const p=S.state(),z=zoneAt(p.x,p.y),cf=R.centreFactor(p.x,p.y,N),pl=R.partyLevel(live.party);startFight(R.encounter(z,pl,cf,live.diff,(live.seed+fightNo*104729+p.x*65+p.y)>>>0),why);}
S.afterStep=rid=>{if(!live)return;s5init();live.steps++;checkSpoil();updHere();h6("step");if(localStorage.getItem(DEV_NOFIGHT)==="1")return;const p=S.state();stepsSince++;
 if(R.isSavePoint(M,p.x,p.y)){const t=M.taverns.findIndex(c=>c[0]===p.x&&c[1]===p.y);let joined="";
  if(t>=0){const def=R.companionFor(t,live.party,h6("plan"));if(def){const c=R.makeCompanion(def,R.partyLevel(live.party));live.party.push(c);joined=c.name+" joined the party! ";h6("joined",c,t);}}
  const ok=doSave(false);if(ok&&t<0)h6("camp",M.camps.findIndex(c=>c[0]===p.x&&c[1]===p.y));toast(joined+(ok?"Game saved at "+placeName(p.x,p.y)+".":"No tent: you can't camp or save at "+placeName(p.x,p.y)+". Buy or build one at a tavern."));updBtn();updHere();return;}
 if(S.panelOpen())return; // first entry into a room: the room itself decides (see onRoomOpen)
 if(stepsSince<10)return;if(!roll)roll=R.rng(live.seed>>>0);const r=roll();
 if(r<(rid>=0?0.15:0.02)){stepsSince=0;fightHere("random");}};
S.onRoomOpen=id=>{if(!live||localStorage.getItem(DEV_NOFIGHT)==="1")return;const r=M.rooms[id];
 if(r.k==="monster"){stepsSince=0;fightHere("room");}
 else if(r.k==="treasure"){const l=R.loot(r.z,(live.seed^(id*2654435761))>>>0);live.gold+=l.gold*2;const got=l.junk.concat(E.drops(r.z,(live.seed^(id*40503))>>>0)).map(j=>addLoot(j)?R.ITEMS[j].n:null).filter(Boolean);toast("Treasure: +"+l.gold*2+" gold"+(got.length?", "+got.join(", "):""));}
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
function eatDish(c,id){const it=R.ITEMS[id];if(it.slot==="use"){const mh=R.maxHp(c,hpMul());c.hp=Math.min(mh,c.hp+Math.round(mh*(it.heal||0)));return;}const d=E.dish(it.dish),fx=d.fx,mh=R.maxHp(c,hpMul()),mm=R.maxMp(c);
 if(fx.hp)c.hp=Math.min(mh,c.hp+Math.round(mh*fx.hp/100));if(fx.mp)c.mp=Math.min(mm,c.mp+Math.round(mm*fx.mp/100));if(fx.str||fx.sta)c.buff={str:fx.str||0,sta:fx.sta||0,f:fx.f||1,n:d.n};}
function eatFrom(c,k){const id=c.bag[k];c.bag.splice(k,1);gone(id);eatDish(c,id);toast(c.name+" ate "+R.ITEMS[id].n);}
// cooking: the ingredients are always used up. Only a right mix makes a dish and teaches the recipe.
function cookTry(ings){if(!ings.length||!ings.every(x=>haveN("i_"+x)>=ings.filter(y=>y===x).length))return {err:"missing"};
 const d=E.cook(ings);if(d&&!live.party.some(c=>R.canCarry(c,"d_"+d.id)))return {err:"heavy"};ings.forEach(x=>takeOne("i_"+x));
 if(!d)return {fail:true};giveDish("d_"+d.id);const learnt=!live.recipes[d.id];if(learnt)live.recipes[d.id]="earned";return {dish:d,learnt};}
function buy(id){const p=E.price(id);if(live.gold<p){toast("Not enough gold");return false;}const who=addLoot(id);if(!who){toast("Nobody can carry that");return false;}live.gold-=p;toast("Bought "+R.ITEMS[id].n+" ("+who+")");h6("shop");return true;}
function buyRecipe(did){const d=E.dish(did),p=E.RECIPE_PRICE[d.tier];if(live.recipes[did]){toast("You already know it");return false;}if(live.gold<p){toast("Not enough gold");return false;}live.gold-=p;live.recipes[did]="bought";toast("Recipe bought: "+d.n);h6("shop");return true;}
function sell(ci,k){const c=live.party[ci],id=c.bag[k];if(id==null)return 0;const v=E.sellPrice(id);c.bag.splice(k,1);gone(id);if(id==="tent"&&!hasTent())live.tentWear=0;live.gold+=v;toast("Sold "+R.ITEMS[id].n+" +"+v+" gold");return v;}
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
function tavernScreen(t){s5init();h6("tavern",t);const kp=E.KEEPERS[t],w=page("tavern");w.appendChild(head("Tavern "+(t+1),closeUI));
 const card=el("div","s5kc");card.appendChild(keeperArt(t));const tx=el("div","");tx.appendChild(el("b","",kp.name));tx.appendChild(el("div","s4sub",kp.tag+" · shopkeeper"));tx.appendChild(el("div","s4sub","Taverns always save. Rest is free."));card.appendChild(tx);w.appendChild(card);
 goldLine(w);sideTabs(w,[["Buy",null,()=>buyScreen(t),"buy"],["Sell",null,()=>sellScreen(t),"sell"],["Cook",null,()=>cookScreen("t"+t),"cook"],["Cooking guide",null,()=>cookbook(()=>tavernScreen(t)),"guide"],["Party",null,partyScreen,"party"]]);
 w.querySelectorAll(".s5tab").forEach(b=>{if(b.dataset.tab==="buy"||b.dataset.tab==="sell")b.textContent="‹ "+b.textContent;});}
// Buy: its own screen with three options. Each option opens a screen with only those items. Back goes up one screen.
function buyScreen(t){s5init();const w=page("buy");w.appendChild(head("Buy",()=>tavernScreen(t)));goldLine(w);
 sideTabs(w,[["‹ Recipes",null,()=>shopList(t,"recipes"),"recipes"],["‹ Food",null,()=>shopList(t,"food"),"food"],["‹ Craft",null,()=>shopList(t,"craft"),"craft"]]);}
function shopRow(w,label,data,fn,off){const o=el("button","s4opt s5row"+(off?" off":""));for(const k in data)o.dataset[k]=data[k];o.appendChild(el("span","s4on",label));o.addEventListener("click",e=>{e.preventDefault();fn();});w.appendChild(o);return o;}
function shopList(t,kind){s5init();const st=E.stock(t),w=page("shop-"+kind);w.dataset.list=kind;w.appendChild(head({recipes:"Recipes",food:"Food",craft:"Craft"}[kind],()=>buyScreen(t)));goldLine(w);
 const item=id=>shopRow(w,R.ITEMS[id].n+" · "+E.price(id)+"g",{buy:id},()=>{buy(id);shopList(t,kind);},live.gold<E.price(id));
 if(kind==="recipes"){const l=E.recipesFor(t).filter(id=>!live.recipes[id]);if(!l.length)w.appendChild(el("div","s4note dim","You know all the recipes sold here."));
  l.forEach(id=>{const d=E.dish(id);shopRow(w,d.n+" · "+E.RECIPE_PRICE[d.tier]+"g",{recipe:id},()=>{buyRecipe(id);shopList(t,kind);},live.gold<E.RECIPE_PRICE[d.tier]);});}
 else if(kind==="food"){["ration","potion","ether","salts"].concat(st.ing).forEach(item);}
 else{w.appendChild(el("div","s4lab","Tent"));item("tent");shopRow(w,"‹ Build a tent from parts",{tentb:"1"},()=>tentScreen(t)).querySelector(".s4on").classList.add("s5more");
  w.appendChild(el("div","s4lab","Gear"));["lockpick","rope"].concat(st.gear).forEach(item);
  if(st.parts.length){w.appendChild(el("div","s4lab","Parts"));st.parts.forEach(item);}
  w.appendChild(el("div","s4note dim","Dead warriors' gear is cheap but worse than new."));}}
// Sell: lists only what the party carries (bags of every member), sold at the normal sell rules
function sellScreen(t){s5init();const w=page("sell");w.appendChild(head("Sell",()=>tavernScreen(t)));goldLine(w);let any=0;
 live.party.forEach((c,ci)=>{const s=E.stacks(c.bag);if(!s.length)return;w.appendChild(el("div","s4lab",c.name));s.forEach(x=>{any++;shopRow(w,R.ITEMS[x.id].n+(x.n>1?" ×"+x.n:"")+" · "+E.sellPrice(x.id)+"g",{sell:x.id,who:ci},()=>{sell(ci,c.bag.lastIndexOf(x.id));sellScreen(t);});});});
 if(!any)w.appendChild(el("div","s4note dim","The party carries nothing to sell."));w.appendChild(el("div","s4note dim","Parts and junk sell for their worth; other things for half."));}
function campScreen(k){s5init();const w=page("camp");w.appendChild(head("Camp "+(k+1),closeUI));goldLine(w);
 w.appendChild(el("div","s4note",hasTent()?"Tent pitched. Nights left on this tent: "+(E.TENT.nights-live.tentWear)+" (tents: "+haveN("tent")+")":"No tent - you can't camp or save here. Buy or build one at a tavern."));
 sideTabs(w,[["Cook",null,()=>cookScreen("c"+k),"cook"],["Eat",()=>foodTree(()=>campScreen(k)),null,"eat"],["Cooking guide",null,()=>cookbook(()=>campScreen(k)),"guide"],["Party",null,partyScreen,"party"]]);}
function foodTree(back){const out=[];live.party.forEach((c,ci)=>E.stacks(c.bag).forEach(s=>{const it=R.ITEMS[s.id];if(it.slot==="dish"||s.id==="ration")out.push({t:it.n+(s.n>1?" ×"+s.n:"")+" ("+c.name+")",d:{food:s.id},kids:()=>live.party.map(m=>({t:"Feed "+m.name,fn:()=>{const k=c.bag.lastIndexOf(s.id);if(k<0)return;c.bag.splice(k,1);gone(s.id);eatDish(m,s.id);toast(m.name+" ate "+it.n);back();}}))});}));return out.length?out:[{t:"No food",off:true}];}
let cookSel=[];
function cookScreen(where){s5init();const back=()=>where[0]==="t"?tavernScreen(+where.slice(1)):campScreen(+where.slice(1));const w=page("cook");w.appendChild(head("Cooking",()=>{cookSel=[];back();}));
 const have=E.stacks(live.party.flatMap(c=>c.bag)).filter(s=>R.ITEMS[s.id].slot==="ing");
 w.appendChild(el("div","s4note","Pick 2 to 4 ingredients, then cook. A wrong mix ruins them and teaches nothing."));
 const chips=el("div","s5chips");have.forEach(s=>{const x=s.id.slice(2),n=cookSel.filter(y=>y===x).length,b=el("button","s4bi s5chip"+(n?" sel":""),R.ITEMS[s.id].n+" ×"+s.n+(n?" ("+n+")":""));b.dataset.ing=x;
  b.addEventListener("click",e=>{e.preventDefault();if(n<s.n&&cookSel.length<4)cookSel.push(x);else cookSel=cookSel.filter(y=>y!==x);cookScreen(where);});chips.appendChild(b);});
 if(!have.length)chips.appendChild(el("div","s4note dim","No ingredients. Monsters drop food, taverns sell it."));w.appendChild(chips);
 const row=el("div","s4row");const cb=tapBtn("Cook"+(cookSel.length?" ("+cookSel.map(x=>R.ITEMS["i_"+x].n).join(" + ")+")":""),()=>{const r=cookTry(cookSel);cookSel=[];
  if(r.err)toast(r.err==="heavy"?"Nobody can carry the dish":"Missing ingredients");else if(r.fail)toast("That didn't work. The ingredients are ruined.");else toast("You cooked "+r.dish.n+(r.learnt?"! Recipe added to your guide.":""));cookScreen(where);},"small");cb.id="s5cook";if(cookSel.length<2)cb.disabled=true;row.appendChild(cb);w.appendChild(row);
 const known=E.DISHES.filter(d=>live.recipes[d.id]);if(known.length){w.appendChild(el("div","s4lab","Known recipes"));known.forEach(d=>{const ok=d.ing.every(x=>haveN("i_"+x)>=d.ing.filter(y=>y===x).length),o=el("button","s4opt"+(ok?"":" off"));o.dataset.again=d.id;
  o.appendChild(el("span","s4on",d.n+" · "+d.ing.map(x=>R.ITEMS["i_"+x].n).join(", ")));o.addEventListener("click",e=>{e.preventDefault();if(!ok){toast("Missing ingredients");return;}cookSel=d.ing.slice();cookScreen(where);});w.appendChild(o);});}}
function cookbook(back){s5init();const w=page("cookbook");w.appendChild(head("Cooking guide",back||partyScreen));const n=Object.keys(live.recipes).length;w.appendChild(el("div","s4note",n+" of 20 recipes · ✎ cooked yourself · ◉ bought"));
 const g=el("div","s5book");E.DISHES.forEach((d,i)=>{const how=live.recipes[d.id],c=el("div","s5rc"+(how?" known "+how:""));c.dataset.rc=d.id;
  if(how){c.appendChild(el("b","",(how==="earned"?"✎ ":"◉ ")+d.n));c.appendChild(el("div","s4sub",d.ing.map(x=>R.ITEMS["i_"+x].n).join(" + ")));c.appendChild(el("div","s4sub s5fx",E.fxText(d.fx)+" · "+E.TIERN[d.tier]));c.appendChild(el("div","s4sub dim",how==="earned"?"learned by cooking":"bought at a tavern"));}
  else{c.appendChild(el("b","dim",(i+1)+". ? ? ?"));c.appendChild(el("div","s4sub dim","not learned"));}g.appendChild(c);});w.appendChild(g);}
function tentScreen(t){s5init();const w=page("tent");w.appendChild(head("Build a tent",()=>shopList(t,"craft")));goldLine(w);
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
updBtn();if(!live&&localStorage.getItem(DEV_NOFIGHT)!=="1")creation();window.addEventListener("resize",()=>{if(fcv&&ui==="fight")sizeF();closeBranch();});
// test and debug hooks (no network, no secrets)
S.rpg={s5:{buyScreen,shopList,sellScreen,tavernScreen,campScreen,cookScreen,cookbook,tentScreen,cookTry,buy,sell,buyRecipe,buildTent,giveDish,checkSpoil,eatDish,haveN,lvlPopup,updHere,tickBuffs,spareJunk},live:()=>live,save:()=>save,doSave:()=>doSave(false),restore,startFight:(mons)=>startFight(mons,"test"),fightHere,fight:()=>F,ui:()=>ui,creation,partyScreen,equipScreen,bagScreen,fightTimes:()=>ftimes.slice(),
 setLive:o=>{live=o;},forceEnd:how=>{if(F){F.over=how;drawMenu();}},branch,closeBranch,charScreen,act:(cmd,arg,t)=>doAct(cmd,arg,t),turn:()=>turnI,
 figs:()=>{if(!fcv||!F)return null;const W=fcv.width,H=fcv.height,s=scl(W,H),d=fcv.width/fcv.clientWidth;const box=(x,y,hw,top,bot)=>({l:(x-hw)/d,r:(x+hw)/d,t:(y-top)/d,b:(y+bot)/d});
  return{w:fcv.clientWidth,h:fcv.clientHeight,s:s/d,mons:F.m.map((m,i)=>{const[x,y]=mpos(i,W,H);return box(x,y,s*0.8*0.75,s*1.1+4,s*0.8*0.75);}),heroes:live.party.map((c,i)=>{const[x,y]=hpos(i,W,H);return box(x,y,s*0.75*0.66,s*1.0+4,s*0.75*0.72);})};}};
})();
