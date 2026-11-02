/* Secret of the Adventures - Stage 4: hero creation, party screen, equip, backpack, turn-based fights, camp/tavern saves, death restore.
   Private build. No ads, no network. Art drawn in code (canvas). Uses window.RPG (rules.js). */
(function(){
"use strict";
const R=window.RPG,S=window.SOTA,M=window.MAZE,C=S.core,N=M.n;
const SAVE="sota.party",DEV_NOFIGHT="sota.dev.nofight";
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
 if(!start)live.party.forEach(c=>{c.hp=R.maxHp(c,hpMul());c.mp=R.maxMp(c);}); // resting heals
 live.at={x:p.x,y:p.y,f:p.f,name:start?"the start":placeName(p.x,p.y)};live.rooms=roomsNow();save=clone(live);
 try{localStorage.setItem(SAVE,JSON.stringify(save));}catch(e){}return true;}
// death: everything goes back to the last save
function restore(){live=clone(save);const r=save.rooms;C.solvedR.fill(0);C.clearedR.fill(0);r.s.forEach(i=>C.solvedR[i]=1);r.c.forEach(i=>C.clearedR[i]=1);S.saveRooms();
 S.teleport(save.at.x,save.at.y,save.at.f);stepsSince=0;}
function toast(t){const d=$("s4toast");d.textContent=t;d.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>d.classList.remove("on"),2200);}
// ---------- screens ----------
const ov=$("s4");function openUI(kind){ui=kind;ov.className="open "+kind;ov.dataset.kind=kind;closeBranch();}
function closeUI(){ui=null;ov.className="";ov.dataset.kind="";ov.dataset.result="";ov.innerHTML="";closeBranch();updBtn();}
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
let br=null;
function closeBranch(){if(br){br.remove();br=null;}}
// items: [{t:label, fn, kids:[...] or ()=>[...], off, d:{data attrs}}]
function branch(anchor,items,level,owner){level=level||0;if(level===0){closeBranch();br=el("div","s4br");br.id="s4br";br.addEventListener("click",e=>{if(e.target===br)closeBranch();});
  br.insertAdjacentHTML("beforeend",'<svg class="s4brl"></svg>');document.body.appendChild(br);}
 [...br.querySelectorAll(".s4bcol")].filter(c=>+c.dataset.lv>=level).forEach(c=>c.remove());[...br.querySelectorAll("path")].filter(p=>+p.dataset.lv>=level).forEach(p=>p.remove());
 const col=el("div","s4bcol");col.dataset.lv=level;br.appendChild(col);
 items.forEach(it=>{const b=el("button","s4bi"+(it.off?" off":""),it.t);if(it.d)for(const k in it.d)b.dataset[k]=it.d[k];if(it.kids)b.classList.add("more");
  b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();if(it.off)return;[...col.children].forEach(x=>x.classList.remove("open"));
   if(it.kids){b.classList.add("open");const k=typeof it.kids==="function"?it.kids():it.kids;branch(b,k.length?k:[{t:"(none)",off:true}],level+1);}else{closeBranch();it.fn();}});col.appendChild(b);});
 // place: to the right of the anchor, or flip left near the edge; centre on the anchor, keep inside the screen (flip up near the bottom)
 const a=anchor.getBoundingClientRect(),vw=innerWidth,vh=innerHeight,cw=col.offsetWidth,ch=col.offsetHeight,gap=22;
 let left=a.right+gap,fx=0;if(left+cw>vw-4){left=a.left-gap-cw;fx=1;}if(left<4){left=Math.max(4,Math.min(vw-cw-4,a.left));fx=2;}
 let top=a.top+a.height/2-ch/2,fy=0;if(top+ch>vh-4){top=vh-4-ch;fy=1;}if(top<4){top=4;fy=fy?2:0;}
 col.style.left=left+"px";col.style.top=top+"px";col.dataset.flipx=fx;col.dataset.flipy=fy;br.dataset.flipx=fx;br.dataset.flipy=fy;
 const svg=br.querySelector("svg");svg.setAttribute("width",vw);svg.setAttribute("height",vh);
 const ax=fx===1?a.left:fx===2?a.left+a.width/2:a.right,ay=fx===2?(top>a.top?a.bottom:a.top):a.top+a.height/2;
 [...col.children].forEach(b=>{const r=b.getBoundingClientRect(),bx=fx===1?r.right:fx===2?r.left+12:r.left,by=r.top+r.height/2,mx=(ax+bx)/2;
  const d=fx===2?"M"+ax+" "+ay+" C"+ax+" "+by+" "+ax+" "+by+" "+bx+" "+by:"M"+ax+" "+ay+" C"+mx+" "+ay+" "+mx+" "+by+" "+bx+" "+by;svg.insertAdjacentHTML("beforeend",'<path data-lv="'+level+'" d="'+d+'"/>');});
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
 live={v:1,party:[h],gold:20,diff:cc.diff,seed:(Math.random()*1e9)|0};live.party[0].hp=R.maxHp(h,hpMul());doSave(true);cc.warned=false;cc.err="";closeUI();toast("Welcome, "+h.name+"! Your hero is in the party. Game saved.");}
// ---- party screen: roster cards, tap a name for a small branch menu ----
function partyBranch(i,anchor){const c=live.party[i],pts=R.pointsEarned(c.lvl)-c.spent,items=[{t:"Status",fn:()=>charScreen(i),d:{status:i}},{t:"Equip",fn:()=>charScreen(i),d:{equip:i}},{t:"Backpack",fn:()=>bagScreen(i),d:{bag:i}},
 {t:"Skills",d:{skills:i},kids:()=>{const k=c.skills.map(id=>({t:R.SKILLS[c.cls].find(s=>s.id===id).n,off:true}));if(c.skills.length<R.skillSlots(c.lvl))k.push({t:"Learn new skill",fn:()=>skillScreen(i),d:{learn:i}});return k;}}];
 if(pts>0)items.push({t:"Stats ("+pts+")",fn:()=>statScreen(i),d:{stats:i}});return branch(anchor,items);}
function partyScreen(){const w=page("party");w.appendChild(head("Party",closeUI));
 w.appendChild(el("div","s4note","Gold "+live.gold+"  ·  "+R.DIFF[live.diff].name+"  ·  last save: "+(save.at.name||"?")));
 const g=el("div","s4roster");live.party.forEach((c,i)=>{const card=el("div","s4rc");card.appendChild(pimg(c));const info=el("div","s4ri");
  const nb=el("button","s4nl",c.name);nb.dataset.pname=i;nb.addEventListener("click",e=>{e.preventDefault();partyBranch(i,nb);});info.appendChild(nb);
  info.appendChild(el("div","s4sub",R.RACES[c.race].name+" "+R.CLASSES[c.cls].name+" · Lv "+c.lvl));
  const mx=R.maxHp(c,hpMul());const h=el("div","s4hpl");h.appendChild(el("span","s4k","HP"));h.appendChild(bar(c.hp,mx,"hp"));h.appendChild(el("span","s4v",c.hp+"/"+mx));info.appendChild(h);
  const m=el("div","s4hpl");m.appendChild(el("span","s4k","MP"));m.appendChild(bar(c.mp,R.maxMp(c),"mp"));m.appendChild(el("span","s4v",c.mp+"/"+R.maxMp(c)));info.appendChild(m);
  const flags=[];if(R.pointsEarned(c.lvl)-c.spent>0)flags.push("stat points");if(c.skills.length<R.skillSlots(c.lvl))flags.push("new skill");if(flags.length)info.appendChild(el("div","s4sub glowt",flags.join(" · ")+" ready"));
  card.appendChild(info);g.appendChild(card);});w.appendChild(g);w.appendChild(el("div","s4note dim","Tap a name for Status, Equip, Backpack and Skills."));}
function statScreen(i){const c=live.party[i];const w=page("stats");w.appendChild(head(c.name+" - stats",partyScreen));
 w.appendChild(el("div","s4lab","Points left: "+(R.pointsEarned(c.lvl)-c.spent)));
 for(const k of["str","sta","man"]){const row=el("div","s4stat");row.appendChild(el("span","s4sn",{str:"Strength",sta:"Stamina",man:"Mana"}[k]));row.appendChild(el("span",""));row.appendChild(el("span","s4sv",String(c.stats[k])));
  row.appendChild(tapBtn("+",()=>{R.raise(c,k);statScreen(i);},"s4pm"));row.appendChild(el("span","s4cost","costs "+R.cost(c.stats[k])));w.appendChild(row);}}
function skillScreen(i){const c=live.party[i];const w=page("skill");w.appendChild(head(c.name+" - new skill",partyScreen));
 R.SKILLS[c.cls].filter(s=>!c.skills.includes(s.id)).forEach(s=>{const b=tapBtn(s.n+"  ("+s.mp+" MP)",()=>{R.learn(c,s.id);partyScreen();},"wide");b.dataset.lskill=s.id;w.appendChild(b);});}
// ---- character screen: select-character strip, status, equip slots with stat change preview ----
const SLN={weapon:"Weapon",offhand:"Off-hand",helmet:"Helmet",chest:"Chest",gloves:"Gloves",boots:"Boots",acc1:"Accessory",acc2:"Accessory"};
const ICON={weapon:"M8 32 L28 12 M24 8 L32 8 L32 16 M11 25 L15 29",offhand:"M20 6 L32 10 L31 22 Q28 31 20 34 Q12 31 9 22 L8 10 Z",helmet:"M8 26 Q8 8 20 8 Q32 8 32 26 L26 26 L26 20 L14 20 L14 26 Z",chest:"M12 8 L20 12 L28 8 L33 14 L29 18 L29 33 L11 33 L11 18 L7 14 Z",
 gloves:"M12 33 L12 16 Q12 12 15 12 L15 20 L15 8 Q18 6 19 8 L19 19 L20 7 Q23 5 24 8 L24 19 L26 10 Q29 9 29 12 L28 33 Z",boots:"M14 6 L24 6 L24 24 L33 28 L33 34 L12 34 Z",acc1:"M20 30 A8 8 0 1 0 20.01 30 M16 12 L20 7 L24 12",acc2:"M20 30 A8 8 0 1 0 20.01 30 M16 12 L20 7 L24 12"};
function icon(s){const v=el("span","s4icw");v.innerHTML='<svg class="s4ic" viewBox="0 0 40 40"><path d="'+ICON[s]+'"/></svg>';return v;}
function statLine(c){return {atk:Math.round(R.power(c)),mag:Math.round(R.magicPower(c)),def:Math.round(R.defense(c)),hp:R.maxHp(c,hpMul())};}
function diffText(a,b){const out=[];for(const[k,n]of[["atk","ATK"],["mag","MAG"],["def","DEF"],["hp","HP"]]){const d=b[k]-a[k];if(d)out.push((d>0?"+":"")+d+" "+n);}return out;}
function charScreen(i,pick){const c=live.party[i];const w=page("equip");w.appendChild(head(c.name,partyScreen));
 const strip=el("div","s4pick");live.party.forEach((m,k)=>{const b=el("button","s4pk"+(k===i?" sel":""));b.dataset.pick=k;b.appendChild(pimg(m,"s4pkp"));const t=el("span","s4pkt");t.appendChild(el("b","",m.name));t.appendChild(el("span","",R.CLASSES[m.cls].name+" Lv "+m.lvl));b.appendChild(t);b.addEventListener("click",e=>{e.preventDefault();charScreen(k);});strip.appendChild(b);});w.appendChild(strip);
 const st=el("div","s4status");const sl=statLine(c);
 [["Race",R.RACES[c.race].name],["Class",R.CLASSES[c.cls].name],["Level",c.lvl],["XP to next",c.lvl>=R.CAP?"max":R.xpNeed(c.lvl)-c.xp],["HP",c.hp+" / "+sl.hp],["MP",c.mp+" / "+R.maxMp(c)],["Strength",c.stats.str],["Stamina",c.stats.sta],["Mana",c.stats.man],["Attack",sl.atk],["Magic",sl.mag],["Defense",sl.def]].forEach(([k,v])=>{const r=el("div","s4st");r.appendChild(el("span","s4k",k));r.appendChild(el("span","s4v",String(v)));st.appendChild(r);});
 w.appendChild(st);w.appendChild(el("div","s4lab","Equipment  ·  armor allowed: "+["","light","up to medium","any"][R.armorCap(c)]));
 const list=el("div","s4slots");R.SLOTS.forEach(s=>{const it=c.equip[s]&&R.ITEMS[c.equip[s]],b=el("button","s4slot"+(pick===s?" sel":""));b.dataset.slot=s;b.appendChild(icon(s));b.appendChild(el("span","s4sl",SLN[s]));b.appendChild(el("span","s4it",it?it.n:"—"));
  b.addEventListener("click",e=>{e.preventDefault();charScreen(i,pick===s?null:s);});list.appendChild(b);
  if(pick===s){const box=el("div","s4opts");const opts=[...new Set(c.bag)].filter(id=>{const t=R.ITEMS[id];return t&&(t.slot===s||(s.startsWith("acc")&&t.slot==="acc"));});
   if(!opts.length)box.appendChild(el("div","s4note","Nothing in the backpack fits here."));
   opts.forEach(id=>{const ok=R.canEquip(c,id,s);let pv=[];if(ok){const t=clone(c);R.equip(t,id,s);pv=diffText(sl,statLine(t));}
    const o=el("button","s4opt"+(ok?"":" off"));o.dataset.opt=id;o.appendChild(el("span","s4on",R.ITEMS[id].n+(ok?"":" (not allowed)")));const pe=el("span","s4pv");pv.forEach(x=>pe.appendChild(el("span",x[0]==="+"?"up":"down",x)));o.appendChild(pe);
    o.addEventListener("click",e=>{e.preventDefault();if(R.equip(c,id,s))charScreen(i);else toast(R.ITEMS[id].n+": your race or class can't use this");});box.appendChild(o);});
   if(c.equip[s]){const o=el("button","s4opt","Take off");o.dataset.unequip=s;o.addEventListener("click",e=>{e.preventDefault();if(!R.unequip(c,s))toast("Backpack too heavy");charScreen(i);});box.appendChild(o);}
   list.appendChild(box);}});w.appendChild(list);
 const row=el("div","s4row");const bb=tapBtn("Backpack",()=>bagScreen(i),"small");bb.dataset.bagb=i;row.appendChild(bb);w.appendChild(row);}
function equipScreen(i,pick){charScreen(i,pick);}
function bagScreen(i){const c=live.party[i];const w=page("bag");w.appendChild(head(c.name+" - backpack",partyScreen));
 const wt=R.bagWeight(c),lim=R.carryLimit(c);w.appendChild(el("div","s4lab","Weight "+(Math.round(wt*10)/10)+" / "+lim+" kg"));w.appendChild(bar(wt,lim,"wt"));
 if(!c.bag.length)w.appendChild(el("div","s4note","Empty."));
 c.bag.forEach((id,k)=>{const it=R.ITEMS[id],row=el("div","s4item");row.appendChild(el("span","s4in",it.n+"  ·  "+it.w+" kg"+(it.slot==="junk"?"  (junk, "+it.v+" gold at a tavern)":"")));
  if(it.slot==="use")row.appendChild(tapBtn("Use",()=>{c.bag.splice(k,1);if(it.heal)c.hp=Math.min(R.maxHp(c,hpMul()),c.hp+Math.round(R.maxHp(c,hpMul())*it.heal));else c.mp=R.maxMp(c);bagScreen(i);},"small"));
  row.appendChild(tapBtn("Drop",()=>{c.bag.splice(k,1);bagScreen(i);},"small"));w.appendChild(row);});}
function addLoot(id){for(const c of live.party)if(R.canCarry(c,id)){c.bag.push(id);return c.name;}return null;}
// ---------- fights ----------
let F=null,fx=[],turnI=0,fcv=null,fctx=null,raf=0;
function startFight(mons,why){F=new R.Fight(live.party,mons,live.diff,(live.seed+(++fightNo)*7919)|0);F.why=why;turnI=0;nextAlive();fx=[];openUI("fight");ov.innerHTML="";ov.dataset.result="";
 const w=el("div","s4fight");const top=el("div","s4stage");fcv=el("canvas");fcv.id="fcv";top.appendChild(fcv);const log=el("div","s4log","");log.id="flog";top.appendChild(log);w.appendChild(top);
 const bot=el("div","s4fbot");const en=el("div","s4enemies");en.id="fen";bot.appendChild(en);const pr=el("div","s4party");pr.id="fparty";bot.appendChild(pr);const mn=el("div","s4menu");mn.id="fmenu";bot.appendChild(mn);w.appendChild(bot);
 ov.appendChild(w);fctx=fcv.getContext("2d");sizeF();say(mons.map(m=>m.n).join(", ")+" appear!");drawMenu();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
function sizeF(){const d=Math.min(2,window.devicePixelRatio||1),w=Math.round(fcv.clientWidth*d),h=Math.round(fcv.clientHeight*d);if(w&&h&&(fcv.width!==w||fcv.height!==h)){fcv.width=w;fcv.height=h;}}
function say(t){const l=$("flog");if(l)l.textContent=t;}
function nextAlive(){while(turnI<live.party.length&&live.party[turnI].hp<=0)turnI++;}
function targets(cmd,arg){return F.m.map((m,i)=>m.hp>0?{t:m.n+" · "+m.hp,fn:()=>doAct(cmd,arg,i),d:{tgt:i}}:null).filter(Boolean);}
function heroMenu(anchor){if(!F||F.over)return;const c=live.party[turnI];const sk=c.skills.map(id=>R.SKILLS[c.cls].find(x=>x.id===id));
 const skItem=s=>({t:s.n+" "+s.mp+"MP",off:c.mp<s.mp,d:{sk:s.id},...((s.k==="phys"||s.k==="magic")&&!s.all?{kids:()=>targets("skill",s.id)}:{fn:()=>doAct("skill",s.id,0)})});
 const phys=sk.filter(s=>s.k==="phys"||s.k==="guard"),mag=sk.filter(s=>s.k==="magic"||s.k==="heal");
 const items=[{t:"Attack",d:{cmd4:"attack"},kids:()=>targets("attack")}];
 if(phys.length)items.push({t:"Skill",d:{cmd4:"skill"},kids:()=>phys.map(skItem)});
 items.push({t:"Magic",d:{cmd4:"magic"},off:!mag.length,kids:()=>mag.map(skItem)});
 items.push({t:"Item",d:{cmd4:"item"},kids:()=>[...new Set(c.bag)].filter(id=>R.ITEMS[id].slot==="use").map(id=>({t:R.ITEMS[id].n+" x"+c.bag.filter(x=>x===id).length,fn:()=>doAct("item",id,turnI),d:{item:id}}))});
 items.push({t:"Defend",d:{cmd4:"defend"},fn:()=>doAct("defend",null,0)},{t:"Run",d:{cmd4:"run"},fn:()=>doAct("run",null,0)});return branch(anchor,items);}
function drawParty(){const pr=$("fparty");if(!pr)return;pr.innerHTML="";live.party.forEach((c,i)=>{const now=i===turnI&&!F.over&&c.hp>0,r=el("div","s4pr"+(now?" now":"")+(c.hp<=0?" dead":""));const mx=R.maxHp(c,hpMul());
 r.appendChild(el("span","s4arrow",now?"▶":""));const nb=el("button","s4nl",c.name);nb.dataset.hero=i;nb.disabled=!now;nb.addEventListener("click",e=>{e.preventDefault();if(now)heroMenu(nb);});r.appendChild(nb);
 const bars=el("span","s4bars");bars.appendChild(bar(c.hp,mx,"hp"));bars.appendChild(bar(c.mp,R.maxMp(c),"mp"));r.appendChild(bars);r.appendChild(el("span","s4pv",c.hp+"/"+mx));pr.appendChild(r);});
 const en=$("fen");if(en){en.innerHTML="";F.m.forEach(m=>{if(m.hp>0)en.appendChild(el("div","s4en",m.n));});}}
function drawMenu(){drawParty();const mn=$("fmenu");if(!mn)return;mn.innerHTML="";if(F.over){endFight();return;}const c=live.party[turnI];mn.appendChild(el("div","s4who",c.name+"'s turn - tap the name"));}
function doAct(cmd,arg,targ){closeBranch();const c=live.party[turnI],before=F.m.map(m=>m.hp);const t=F.act(turnI,cmd,arg,targ);
 const s=cmd==="skill"&&R.SKILLS[c.cls].find(x=>x.id===arg);F.m.forEach((m,i)=>{if(m.hp<before[i])fx.push({i,t0:performance.now(),k:s&&s.k==="magic"?"magic":"hit"});});if(s&&s.k==="heal")fx.push({ally:true,t0:performance.now(),k:"heal"});
 say(t);turnI++;nextAlive();if(!F.over&&turnI>=live.party.length){const out=F.monstersTurn();setTimeout(()=>{if(out.length&&F&&!F.over)say(out.join(". "));},450);turnI=0;nextAlive();}drawMenu();}
function endFight(){const mn=$("fmenu"),how=F.over;closeBranch();
 if(how==="win"){const rw=F.rewards((live.seed^fightNo*31)>>>0);live.gold+=rw.gold;const ups=[];live.party.forEach(c=>{if(c.hp>0){const g=R.gainXp(c,rw.xp,hpMul());if(g.length)ups.push(c.name+" reached level "+c.lvl+(c.skills.length<R.skillSlots(c.lvl)?" - new skill ready!":""));}else c.hp=1;});
  const jn=rw.junk.map(id=>{const who=addLoot(id);return R.ITEMS[id].n+(who?"":" (no room, left behind)");});
  mn.appendChild(el("div","s4win","Victory!"));mn.appendChild(el("div","s4note","+"+rw.xp+" XP   +"+rw.gold+" gold"+(jn.length?"   Found: "+jn.join(", "):"")));ups.forEach(u=>mn.appendChild(el("div","s4note glowt",u)));
  const b=tapBtn("Continue",()=>{F=null;closeUI();},"s4go small");b.id="fdone";mn.appendChild(b);ov.dataset.result="win";}
 else if(how==="lose"){mn.appendChild(el("div","s4lose","The party has fallen"));mn.appendChild(el("div","s4note","You wake at your last save: "+(save.at.name||"?")+". Everything since then is lost."));
  const b=tapBtn("Return to last save",()=>{F=null;closeUI();restore();toast("Back at "+save.at.name);},"s4go small");b.id="fdone";mn.appendChild(b);ov.dataset.result="lose";}
 else{const b=tapBtn("Continue",()=>{F=null;closeUI();},"s4go small");b.id="fdone";mn.appendChild(el("div","s4note","You got away."));mn.appendChild(b);ov.dataset.result="ran";}
 drawParty();}
// ---- fight drawing (side view, dark dungeon, inked figures, purple/blue magic) ----
const ZC=[null,[150,112,60],[92,108,62],[70,92,124],[128,52,50],[96,62,128]];
function bg(g,W,H,z){const zc=ZC[z]||ZC[1];const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,"#07040e");gr.addColorStop(0.62,"rgb("+(zc[0]*0.22|0)+","+(zc[1]*0.2|0)+","+(zc[2]*0.28|0)+")");gr.addColorStop(1,"#05030a");g.fillStyle=gr;g.fillRect(0,0,W,H);
 const bh=H/9;g.strokeStyle="rgba(0,0,0,.55)";g.lineWidth=Math.max(1,H/160);for(let r=0;r<6;r++){const y=r*bh;g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();for(let x=(r%2)*bh;x<W;x+=bh*1.8){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+bh);g.stroke();}}
 [[0.18,"150,90,255"],[0.82,"80,150,255"]].forEach(([fxp,c])=>{const x=W*fxp,y=H*0.22,rg=g.createRadialGradient(x,y,2,x,y,H*0.5);rg.addColorStop(0,"rgba("+c+",.55)");rg.addColorStop(1,"rgba("+c+",0)");g.fillStyle=rg;g.fillRect(0,0,W,H);
  g.fillStyle="#1a1020";g.fillRect(x-W*0.012,y,W*0.024,H*0.12);g.fillStyle="rgba("+c+",.95)";g.beginPath();g.ellipse(x,y-H*0.02,W*0.012,H*0.035,0,0,7);g.fill();});
 const fy=H*0.8;const fl=g.createLinearGradient(0,fy,0,H);fl.addColorStop(0,"#2a1d3a");fl.addColorStop(1,"#0b0712");g.fillStyle=fl;g.fillRect(0,fy,W,H-fy);g.strokeStyle="rgba(0,0,0,.5)";for(let x=-W;x<W*2;x+=W/7){g.beginPath();g.moveTo(W/2+(x-W/2)*0.55,fy);g.lineTo(x,H);g.stroke();}g.strokeStyle="rgba(170,140,255,.18)";g.beginPath();g.moveTo(0,fy);g.lineTo(W,fy);g.stroke();}
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
function loop(t){if(!F||!fcv){return;}sizeF();const t0=performance.now(),g=fctx,W=fcv.width,H=fcv.height,z=F.m[0].zone;bg(g,W,H,z);
 const s=Math.min(W/5,H/2.6),fy=H*0.8;const alive=F.m;alive.forEach((m,i)=>{if(m.hp<=0)return;const x=W*(0.13+0.13*(i%3))+(i>2?W*0.06:0),y=fy-s*0.6-(i%2)*s*0.25;
  const f=fx.find(e=>e.i===i&&t-e.t0<120);g.save();if(f){g.translate((Math.random()-.5)*s*0.15,0);}drawMon(g,m,x,y,s*0.9,t);g.restore();
  g.fillStyle="#22152e";g.fillRect(x-s*0.4,y-s*1.0,s*0.8,s*0.07);g.fillStyle="#c04060";g.fillRect(x-s*0.4,y-s*1.0,s*0.8*m.hp/m.max,s*0.07);});
 live.party.forEach((c,i)=>{const x=W*(0.58+0.12*i),y=fy-s*0.6-(i%2)*s*0.18;drawHero(g,c,x,y,s*0.75,t,i===turnI&&!F.over);if(i===turnI&&!F.over&&c.hp>0){const ay=y-s*1.0+Math.sin(t/180)*s*0.05;g.fillStyle="#ffe08a";g.shadowColor="rgba(255,220,120,.9)";g.shadowBlur=s*0.15;g.beginPath();g.moveTo(x-s*0.1,ay);g.lineTo(x+s*0.1,ay);g.lineTo(x,ay+s*0.13);g.closePath();g.fill();g.shadowBlur=0;}});
 fx=fx.filter(e=>t-e.t0<700);fx.forEach(e=>{const p=(t-e.t0)/700;if(e.k==="magic"&&!e.ally){const i=e.i,x=W*(0.13+0.13*(i%3))+(i>2?W*0.06:0),y=fy-s*0.6-(i%2)*s*0.25;burst(g,x,y,s,p,"magic");}
  else if(e.k==="heal"){live.party.forEach((c,i)=>{if(c.hp>0)burst(g,W*(0.58+0.12*i),fy-s*0.9,s*0.6,p,"heal");});}
  else if(e.k==="hit"){const i=e.i,x=W*(0.13+0.13*(i%3))+(i>2?W*0.06:0),y=fy-s*0.6-(i%2)*s*0.25;g.strokeStyle="rgba(255,240,220,"+(1-p)+")";g.lineWidth=s*0.05;g.beginPath();g.moveTo(x-s*0.4,y-s*0.4+p*s*0.3);g.lineTo(x+s*0.4,y+s*0.3-p*s*0.1);g.stroke();}});
 if(window.__S4_MAGIC_HOLD){burst(g,W*0.26,fy-s*0.8,s,0.35,"magic");}
 ftimes.push(performance.now()-t0);if(ftimes.length>240)ftimes.shift();raf=requestAnimationFrame(loop);}
// ---------- hooks from the walk ----------
function zoneAt(x,y){return C.zoneOf[y*N+x];}
function fightHere(why){const p=S.state(),z=zoneAt(p.x,p.y),cf=R.centreFactor(p.x,p.y,N),pl=R.partyLevel(live.party);startFight(R.encounter(z,pl,cf,live.diff,(live.seed+fightNo*104729+p.x*65+p.y)>>>0),why);}
S.afterStep=rid=>{if(!live||localStorage.getItem(DEV_NOFIGHT)==="1")return;const p=S.state();stepsSince++;
 if(R.isSavePoint(M,p.x,p.y)){const t=M.taverns.findIndex(c=>c[0]===p.x&&c[1]===p.y);let joined="";
  if(t>=0){const def=R.companionFor(t,live.party);if(def){const c=R.makeCompanion(def,R.partyLevel(live.party));live.party.push(c);joined=c.name+" joined the party! ";}}
  doSave(false);toast(joined+"Game saved at "+placeName(p.x,p.y)+".");updBtn();return;}
 if(S.panelOpen())return; // first entry into a room: the room itself decides (see onRoomOpen)
 if(stepsSince<10)return;if(!roll)roll=R.rng(live.seed>>>0);const r=roll();
 if(r<(rid>=0?0.15:0.02)){stepsSince=0;fightHere("random");}};
S.onRoomOpen=id=>{if(!live||localStorage.getItem(DEV_NOFIGHT)==="1")return;const r=M.rooms[id];
 if(r.k==="monster"){stepsSince=0;fightHere("room");}
 else if(r.k==="treasure"){const l=R.loot(r.z,(live.seed^(id*2654435761))>>>0);live.gold+=l.gold*2;const got=l.junk.map(j=>addLoot(j)?R.ITEMS[j].n:null).filter(Boolean);toast("Treasure: +"+l.gold*2+" gold"+(got.length?", "+got.join(", "):""));}};
// ---------- top button + hint ----------
const pb=$("partyb");function updBtn(){pb.classList.toggle("need",!live);$("s4hint").style.display=live?"none":"block";}
pb.addEventListener("click",e=>{e.preventDefault();if(S.mapOpen&&S.mapOpen())return;if(S.puzzleOpen&&S.puzzleOpen())return;if(ui)return;if(!live)creation();else partyScreen();});
updBtn();if(!live&&localStorage.getItem(DEV_NOFIGHT)!=="1")creation();window.addEventListener("resize",()=>{if(fcv&&ui==="fight")sizeF();closeBranch();});
// test and debug hooks (no network, no secrets)
S.rpg={live:()=>live,save:()=>save,doSave:()=>doSave(false),restore,startFight:(mons)=>startFight(mons,"test"),fightHere,fight:()=>F,ui:()=>ui,creation,partyScreen,equipScreen,bagScreen,fightTimes:()=>ftimes.slice(),
 setLive:o=>{live=o;},forceEnd:how=>{if(F){F.over=how;drawMenu();}},branch,closeBranch,charScreen,act:(cmd,arg,t)=>doAct(cmd,arg,t),turn:()=>turnI};
})();
