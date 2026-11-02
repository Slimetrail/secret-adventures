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
const ov=$("s4");function openUI(kind){ui=kind;ov.className="open "+kind;ov.dataset.kind=kind;}
function closeUI(){ui=null;ov.className="";ov.dataset.kind="";ov.innerHTML="";updBtn();}
S.uiOpen=()=>!!ui;
function head(title,back){const h=el("div","s4head");h.appendChild(el("div","s4title",title));if(back)h.appendChild(tapBtn("Back",back,"s4back"));return h;}
// ---- character creation ----
const cc={name:"",race:"human",cls:"warrior",add:{str:0,sta:0,man:0},skill:null,diff:"normal"};
function ccSpent(){const b=R.RACES[cc.race].base;return ["str","sta","man"].reduce((t,k)=>t+R.spendCost(b[k],b[k]+cc.add[k]),0);}
function creation(){openUI("create");ov.innerHTML="";const w=el("div","s4page");ov.appendChild(w);w.appendChild(head("Make your hero"));
 const nm=el("input","s4name");nm.id="ccname";nm.maxLength=14;nm.placeholder="Hero name";nm.value=cc.name;nm.addEventListener("input",()=>cc.name=nm.value);w.appendChild(nm);
 w.appendChild(el("div","s4lab","Race"));const rr=el("div","s4row");for(const k in R.RACES){const b=tapBtn(R.RACES[k].name,()=>{cc.race=k;if(!R.allowed(k,cc.cls))cc.cls=R.RACES[k].classes[0];cc.add={str:0,sta:0,man:0};cc.skill=null;creation();},cc.race===k?"sel":"");b.dataset.race=k;rr.appendChild(b);}w.appendChild(rr);
 w.appendChild(el("div","s4note",{human:"Any class, any armor. Average.",elf:"Mage, archer, rogue, warrior. Armor up to medium. Strong mana.",dwarf:"Warrior, rogue, archer. No magic. Very strong, carries a lot.",cat:"Mage, rogue, warrior. Light armor only. Strong stamina, weak strength, carries little."}[cc.race]));
 w.appendChild(el("div","s4lab","Class"));const cr=el("div","s4row");for(const k in R.CLASSES){const ok=R.allowed(cc.race,k),b=tapBtn(R.CLASSES[k].name,()=>{if(!ok)return;cc.cls=k;cc.skill=null;creation();},(cc.cls===k?"sel":"")+(ok?"":" off"));b.dataset.cls=k;b.disabled=!ok;cr.appendChild(b);}w.appendChild(cr);
 const left=R.START_POINTS-ccSpent();w.appendChild(el("div","s4lab","Stats - points left: "+left)).id="ccleft";
 const SN={str:"Strength",sta:"Stamina",man:"Mana"},b=R.RACES[cc.race].base;
 for(const k of["str","sta","man"]){const v=b[k]+cc.add[k],row=el("div","s4stat");row.appendChild(el("span","s4sn",SN[k]+(R.CLASSES[cc.cls].main===k?" *":"")));
  const minus=tapBtn("-",()=>{if(cc.add[k]>0){cc.add[k]--;creation();}},"s4pm");minus.dataset.dec=k;row.appendChild(minus);
  const vv=el("span","s4sv",String(v));vv.dataset.val=k;row.appendChild(vv);
  const blocked=cc.race==="dwarf"&&k==="man",c=R.cost(v),plus=tapBtn("+",()=>{if(!blocked&&left>=c){cc.add[k]++;creation();}},"s4pm"+(blocked||left<c?" off":""));plus.dataset.inc=k;row.appendChild(plus);
  row.appendChild(el("span","s4cost",blocked?"no magic":"next costs "+c));w.appendChild(row);}
 w.appendChild(el("div","s4lab","Starting skill"));const sr=el("div","s4row");R.SKILLS[cc.cls].slice(0,3).forEach(s=>{const bt=tapBtn(s.n,()=>{cc.skill=s.id;creation();},cc.skill===s.id?"sel":"");bt.dataset.skill=s.id;sr.appendChild(bt);});w.appendChild(sr);
 w.appendChild(el("div","s4lab","Difficulty"));const dr=el("div","s4row");for(const k in R.DIFF){const bt=tapBtn(R.DIFF[k].name,()=>{cc.diff=k;creation();},cc.diff===k?"sel":"");bt.dataset.diff=k;dr.appendChild(bt);}w.appendChild(dr);
 w.appendChild(el("div","s4note",{story:"Story: heroes have double health, monsters hit half as hard.",normal:"Normal: the game as planned.",hard:"Hard: monsters hit 50% harder."}[cc.diff]));
 const go=tapBtn("Start adventure",()=>{if(!cc.skill){toast("Pick a starting skill");return;}const h=R.newChar(cc.name.trim()||"Hero",cc.race,cc.cls,cc.add,cc.skill);
  const kit={warrior:["sword","leather"],rogue:["dagger","leather"],archer:["bow","leather"],mage:["staff","robe"]}[cc.cls];kit.forEach(id=>{if(id==="leather"&&!R.canEquip(h,id,"chest"))id="robe";h.bag.push(id);R.equip(h,id,R.ITEMS[id].slot);});h.bag.push("potion","potion","ether");
  live={v:1,party:[h],gold:20,diff:cc.diff,seed:(Math.random()*1e9)|0};live.party[0].hp=R.maxHp(h,hpMul());doSave(true);closeUI();toast("Welcome, "+h.name+". Game saved.");},"s4go");go.id="ccgo";w.appendChild(go);}
// ---- party screen ----
function partyScreen(){openUI("party");ov.innerHTML="";const w=el("div","s4page");ov.appendChild(w);w.appendChild(head("Party",closeUI));
 w.appendChild(el("div","s4note","Gold: "+live.gold+"   Mode: "+R.DIFF[live.diff].name+"   Last save: "+(save.at.name||"?")));
 live.party.forEach((c,i)=>{const card=el("div","s4card");card.appendChild(el("div","s4cn",c.name+" - "+R.RACES[c.race].name+" "+R.CLASSES[c.cls].name+"  Lv "+c.lvl));
  card.appendChild(el("div","s4note","HP "+c.hp+"/"+R.maxHp(c,hpMul())+"  MP "+c.mp+"/"+R.maxMp(c)+"  STR "+c.stats.str+" STA "+c.stats.sta+" MANA "+c.stats.man+"  XP "+c.xp+"/"+R.xpNeed(c.lvl)));
  card.appendChild(el("div","s4note","Skills: "+c.skills.map(id=>R.SKILLS[c.cls].find(s=>s.id===id).n).join(", ")));
  const row=el("div","s4row");const e=tapBtn("Equip",()=>equipScreen(i));e.dataset.equip=i;row.appendChild(e);const b=tapBtn("Backpack",()=>bagScreen(i));b.dataset.bag=i;row.appendChild(b);
  const pts=R.pointsEarned(c.lvl)-c.spent;if(pts>0)row.appendChild(tapBtn("Stats ("+pts+")",()=>statScreen(i)));
  if(c.skills.length<R.skillSlots(c.lvl))row.appendChild(tapBtn("New skill",()=>skillScreen(i),"glow"));card.appendChild(row);w.appendChild(card);});}
function statScreen(i){const c=live.party[i];openUI("stats");ov.innerHTML="";const w=el("div","s4page");ov.appendChild(w);w.appendChild(head(c.name+" - stats",partyScreen));
 w.appendChild(el("div","s4lab","Points left: "+(R.pointsEarned(c.lvl)-c.spent)));
 for(const k of["str","sta","man"]){const row=el("div","s4stat");row.appendChild(el("span","s4sn",{str:"Strength",sta:"Stamina",man:"Mana"}[k]));row.appendChild(el("span","s4sv",String(c.stats[k])));
  row.appendChild(tapBtn("+",()=>{R.raise(c,k);statScreen(i);},"s4pm"));row.appendChild(el("span","s4cost","costs "+R.cost(c.stats[k])));w.appendChild(row);}}
function skillScreen(i){const c=live.party[i];openUI("skill");ov.innerHTML="";const w=el("div","s4page");ov.appendChild(w);w.appendChild(head(c.name+" - new skill",partyScreen));
 R.SKILLS[c.cls].filter(s=>!c.skills.includes(s.id)).forEach(s=>w.appendChild(tapBtn(s.n+"  ("+s.mp+" MP)",()=>{R.learn(c,s.id);partyScreen();},"wide")));}
const SLN={weapon:"Weapon",offhand:"Off-hand / shield",helmet:"Helmet",chest:"Chest",gloves:"Gloves",boots:"Boots",acc1:"Accessory 1",acc2:"Accessory 2"};
function equipScreen(i,pick){const c=live.party[i];openUI("equip");ov.innerHTML="";const w=el("div","s4page");ov.appendChild(w);w.appendChild(head(c.name+" - equip",partyScreen));
 w.appendChild(el("div","s4note","Armor allowed: "+["","light","up to medium","any"][R.armorCap(c)]+".  Attack "+Math.round(R.power(c))+"  Defense "+Math.round(R.defense(c))));
 const g=el("div","s4slots");R.SLOTS.forEach(s=>{const it=c.equip[s]&&R.ITEMS[c.equip[s]],b=tapBtn("",()=>equipScreen(i,s),pick===s?"sel":"");b.dataset.slot=s;b.appendChild(el("div","s4sl",SLN[s]));b.appendChild(el("div","s4it",it?it.n:"- empty -"));g.appendChild(b);});w.appendChild(g);
 if(pick){const opts=[...new Set(c.bag)].filter(id=>{const it=R.ITEMS[id];return it&&(it.slot===pick||(pick.startsWith("acc")&&it.slot==="acc"));});
  w.appendChild(el("div","s4lab",SLN[pick]+": choose"));if(!opts.length)w.appendChild(el("div","s4note","Nothing in the backpack fits here."));
  opts.forEach(id=>{const ok=R.canEquip(c,id,pick),b=tapBtn(R.ITEMS[id].n+(ok?"":" (not allowed)"),()=>{if(R.equip(c,id,pick))equipScreen(i);else toast(R.ITEMS[id].n+": your race or class can't use this");},"wide"+(ok?"":" off"));b.dataset.opt=id;w.appendChild(b);});
  if(c.equip[pick])w.appendChild(tapBtn("Take off",()=>{if(!R.unequip(c,pick))toast("Backpack too heavy");equipScreen(i);},"wide"));}}
function bagScreen(i){const c=live.party[i];openUI("bag");ov.innerHTML="";const w=el("div","s4page");ov.appendChild(w);w.appendChild(head(c.name+" - backpack",partyScreen));
 const wt=R.bagWeight(c),lim=R.carryLimit(c);const meter=el("div","s4meter");const f=el("div","s4fill");f.style.width=Math.min(100,wt/lim*100)+"%";meter.appendChild(f);w.appendChild(el("div","s4lab","Weight "+(Math.round(wt*10)/10)+" / "+lim+" kg"));w.appendChild(meter);
 if(!c.bag.length)w.appendChild(el("div","s4note","Empty."));
 c.bag.forEach((id,k)=>{const it=R.ITEMS[id],row=el("div","s4item");row.appendChild(el("span","s4in",it.n+"  "+it.w+" kg"+(it.slot==="junk"?"  (junk, worth "+it.v+" gold at a tavern)":"")));
  if(it.slot==="use")row.appendChild(tapBtn("Use",()=>{c.bag.splice(k,1);if(it.heal)c.hp=Math.min(R.maxHp(c,hpMul()),c.hp+Math.round(R.maxHp(c,hpMul())*it.heal));else c.mp=R.maxMp(c);bagScreen(i);}));
  row.appendChild(tapBtn("Drop",()=>{c.bag.splice(k,1);bagScreen(i);}));w.appendChild(row);});}
function addLoot(id){for(const c of live.party)if(R.canCarry(c,id)){c.bag.push(id);return c.name;}return null;}
// ---------- fights ----------
let F=null,fx=[],turnI=0,fcv=null,fctx=null,raf=0,mode="menu",pendingCmd=null;
function startFight(mons,why){const p=S.state();F=new R.Fight(live.party,mons,live.diff,(live.seed+(++fightNo)*7919)|0);F.why=why;turnI=0;nextAlive();mode="menu";fx=[];openUI("fight");ov.innerHTML="";
 const w=el("div","s4fight");fcv=el("canvas");fcv.id="fcv";w.appendChild(fcv);const log=el("div","s4log","");log.id="flog";w.appendChild(log);const pr=el("div","s4party");pr.id="fparty";w.appendChild(pr);
 const mn=el("div","s4menu");mn.id="fmenu";w.appendChild(mn);ov.appendChild(w);fctx=fcv.getContext("2d");sizeF();say(mons.map(m=>m.n).join(", ")+" appear!");drawMenu();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
function sizeF(){const d=Math.min(2,window.devicePixelRatio||1),w=Math.round(fcv.clientWidth*d),h=Math.round(fcv.clientHeight*d);if(w&&h&&(fcv.width!==w||fcv.height!==h)){fcv.width=w;fcv.height=h;}}
function say(t){const l=$("flog");if(l)l.textContent=t;}
function nextAlive(){while(turnI<live.party.length&&live.party[turnI].hp<=0)turnI++;}
function drawParty(){const pr=$("fparty");if(!pr)return;pr.innerHTML="";live.party.forEach((c,i)=>{const r=el("div","s4pr"+(i===turnI&&!F.over?" now":"")+(c.hp<=0?" dead":""));const mx=R.maxHp(c,hpMul());
 r.appendChild(el("span","s4pn",c.name));const bar=el("span","s4hp");const f=el("span","s4hpf");f.style.width=(c.hp/mx*100)+"%";bar.appendChild(f);r.appendChild(bar);r.appendChild(el("span","s4pv",c.hp+"/"+mx+"  MP "+c.mp));pr.appendChild(r);});}
function drawMenu(){drawParty();const mn=$("fmenu");if(!mn)return;mn.innerHTML="";if(F.over){endFight();return;}const c=live.party[turnI];
 if(mode==="menu"){mn.appendChild(el("div","s4who",c.name+"'s turn"));
  [["Attack","attack"],["Skill"+(R.CLASSES[c.cls].magic?" / Magic":""),"skill"],["Item","item"],["Defend","defend"],["Run","run"]].forEach(([t,k])=>{const b=tapBtn(t,()=>choose(k));b.dataset.cmd4=k;mn.appendChild(b);});}
 else if(mode==="target"){mn.appendChild(el("div","s4who","Pick a target"));F.m.forEach((m,i)=>{if(m.hp<=0)return;const b=tapBtn(m.n+" ("+m.hp+")",()=>doAct(pendingCmd.cmd,pendingCmd.arg,i));b.dataset.tgt=i;mn.appendChild(b);});mn.appendChild(tapBtn("Back",()=>{mode="menu";drawMenu();}));}
 else if(mode==="skill"){mn.appendChild(el("div","s4who","Choose a skill"));c.skills.forEach(id=>{const s=R.SKILLS[c.cls].find(x=>x.id===id),ok=c.mp>=s.mp,b=tapBtn(s.n+" "+s.mp+"MP",()=>{if(!ok)return;if(s.k==="phys"||s.k==="magic"){if(s.all)doAct("skill",id,0);else{pendingCmd={cmd:"skill",arg:id};mode="target";drawMenu();}}else doAct("skill",id,0);},ok?"":"off");b.dataset.sk=id;mn.appendChild(b);});mn.appendChild(tapBtn("Back",()=>{mode="menu";drawMenu();}));}
 else if(mode==="item"){mn.appendChild(el("div","s4who","Use an item"));const u=[...new Set(c.bag)].filter(id=>R.ITEMS[id].slot==="use");if(!u.length)mn.appendChild(el("div","s4note","No items."));u.forEach(id=>{const b=tapBtn(R.ITEMS[id].n+" x"+c.bag.filter(x=>x===id).length,()=>doAct("item",id,turnI));b.dataset.item=id;mn.appendChild(b);});mn.appendChild(tapBtn("Back",()=>{mode="menu";drawMenu();}));}}
function choose(k){if(k==="attack"){pendingCmd={cmd:"attack"};mode="target";}else if(k==="skill")mode="skill";else if(k==="item")mode="item";else{doAct(k,null,0);return;}drawMenu();}
function doAct(cmd,arg,targ){const c=live.party[turnI],before=F.m.map(m=>m.hp);const t=F.act(turnI,cmd,arg,targ);mode="menu";
 const s=cmd==="skill"&&R.SKILLS[c.cls].find(x=>x.id===arg);F.m.forEach((m,i)=>{if(m.hp<before[i])fx.push({i,t0:performance.now(),k:s&&s.k==="magic"?"magic":"hit"});});if(s&&s.k==="heal")fx.push({ally:true,t0:performance.now(),k:"heal"});
 say(t);turnI++;nextAlive();if(!F.over&&turnI>=live.party.length){const out=F.monstersTurn();setTimeout(()=>{if(out.length)say(out.join(". "));},450);turnI=0;nextAlive();}drawMenu();}
function endFight(){const mn=$("fmenu"),how=F.over;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
 if(how==="win"){const rw=F.rewards((live.seed^fightNo*31)>>>0);live.gold+=rw.gold;const ups=[];live.party.forEach(c=>{if(c.hp>0){const g=R.gainXp(c,rw.xp,hpMul());if(g.length)ups.push(c.name+" reached level "+c.lvl+(c.skills.length<R.skillSlots(c.lvl)?" - new skill ready!":""));}else c.hp=1;});
  const jn=rw.junk.map(id=>{const who=addLoot(id);return R.ITEMS[id].n+(who?"":" (no room, left behind)");});
  mn.appendChild(el("div","s4win","Victory!"));mn.appendChild(el("div","s4note","+"+rw.xp+" XP   +"+rw.gold+" gold"+(jn.length?"   Found: "+jn.join(", "):"")));ups.forEach(u=>mn.appendChild(el("div","s4note glowt",u)));
  const b=tapBtn("Continue",()=>{F=null;closeUI();},"s4go");b.id="fdone";mn.appendChild(b);ov.dataset.result="win";}
 else if(how==="lose"){mn.appendChild(el("div","s4lose","The party has fallen"));mn.appendChild(el("div","s4note","You wake at your last save: "+(save.at.name||"?")+". Everything since then is lost."));
  const b=tapBtn("Return to last save",()=>{F=null;closeUI();restore();toast("Back at "+save.at.name);},"s4go");b.id="fdone";mn.appendChild(b);ov.dataset.result="lose";}
 else{const b=tapBtn("Continue",()=>{F=null;closeUI();},"s4go");b.id="fdone";mn.appendChild(el("div","s4note","You got away."));mn.appendChild(b);ov.dataset.result="ran";}
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
 live.party.forEach((c,i)=>{const x=W*(0.62+0.1*i),y=fy-s*0.6-(i%2)*s*0.18;drawHero(g,c,x,y,s*0.75,t,i===turnI&&!F.over);});
 fx=fx.filter(e=>t-e.t0<700);fx.forEach(e=>{const p=(t-e.t0)/700;if(e.k==="magic"&&!e.ally){const i=e.i,x=W*(0.13+0.13*(i%3))+(i>2?W*0.06:0),y=fy-s*0.6-(i%2)*s*0.25;burst(g,x,y,s,p,"magic");}
  else if(e.k==="heal"){live.party.forEach((c,i)=>{if(c.hp>0)burst(g,W*(0.62+0.1*i),fy-s*0.9,s*0.6,p,"heal");});}
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
updBtn();window.addEventListener("resize",()=>{if(fcv&&ui==="fight")sizeF();});
// test and debug hooks (no network, no secrets)
S.rpg={live:()=>live,save:()=>save,doSave:()=>doSave(false),restore,startFight:(mons)=>startFight(mons,"test"),fightHere,fight:()=>F,ui:()=>ui,creation,partyScreen,equipScreen,bagScreen,fightTimes:()=>ftimes.slice(),
 setLive:o=>{live=o;},forceEnd:how=>{if(F){F.over=how;drawMenu();}},act:(cmd,arg,t)=>doAct(cmd,arg,t),turn:()=>turnI};
})();
