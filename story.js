/* Secret of the Adventures - Stage 6 story layer: dialogue box with painted portraits that change pose by line,
   opening, companion joins, tavern/camp/wall-art banter, fight start/end lines, boss-door note, endings, memory lines.
   Text only (no sound). Banter can't be skipped or fast-forwarded: a tap only moves on once the line has fully appeared.
   Offline: all art is in art6/. No network, no ads. */
(function(){"use strict";
const S=window.SOTA,R=window.RPG,M=window.MAZE,D=window.STORY;if(!S||!R||!M||!D)return;
const live=()=>S.rpg&&S.rpg.live&&S.rpg.live();
const SHEET={human:"knight",elf:"elf",dwarf:"dwarf",cat:"cat"},ROLE={Q:"quirky",S:"scholar",A:"angry"},IDX={Q:1,S:2,A:3};
// Wall-art rooms. OPEN QUESTION for Jeremy: do monster/treasure rooms carry art too? Then set WALL_ART_ROOMS=85 (= every room).
const WALL_ART_ROOMS=28;
const WALLS=WALL_ART_ROOMS>=M.rooms.length?M.rooms.slice():M.rooms.filter(r=>r.k==="story"),TOTAL_P=M.rooms.length,TOTAL_W=WALL_ART_ROOMS,MEM_STEP=8;
// Each story room has ONE fixed piece (Jeremy 2026-11-06, t1822u-t1830u): its own painting and its own thoughts.
// Find the room or miss that piece; how many walls were found before does not matter.
// Pieces: zone 1..5 scenes in order, then the two Dad pieces last (the figure is faceless until those). The very last is Dad and his note.
const PIECES=[1,2,3,4,5].reduce((a,z)=>a.concat(D.wall[z]),[]).concat(D.wall.dad),DAD_FROM=PIECES.length-2;
// room id -> [piece index, art6 file]. Order by maze PATH distance (BFS): z1 from the entrance (rat, slime, spider nearest tavern 1),
// z2/z3/z4 from tavern 1/2/3, z5 pieces 1-7 from tavern 4, picnic = farthest from tavern 4, bedside = nearest the centre.
const ROOM_ART={4:[0,"zone1-01-rat-entrance"],5:[1,"zone1-02-slime"],1:[2,"zone1-03-spider-toward-tavern"],9:[3,"zone2-01-no-way-out"],13:[4,"zone2-02-maze-guy-question-mark"],15:[5,"zone2-03-maze-guy-xs"],17:[6,"zone2-04-maze-xs-guy-outside"],26:[7,"zone3-01-crystal-defined-monsters"],23:[8,"zone3-02-crystal-monsters-eyes-forming"],22:[9,"zone3-03-crystal-hands-and-monster-shapes"],29:[10,"zone3-04-crystal-hands-only"],36:[11,"zone3-05-crystal-cracked-smoke"],37:[12,"zone4-01-robed-circle-crystal"],46:[13,"zone4-02-robed-circle-raised-hands"],38:[14,"zone4-03-robed-circle-purple-tendrils"],50:[15,"zone4-04-dark-robes-purple-tendrils"],55:[16,"zone4-05-dark-robes-cracked-crystal"],57:[17,"zone4-06-dark-robes-cracked-smoke"],42:[18,"zone4-07-figures-thrown-back-smoke"],60:[19,"zone5-01-handshake-crystal"],69:[20,"zone5-02-figure-holding-book"],58:[21,"zone5-03-figure-hood-down"],67:[22,"zone5-04-crystal-between-two-figures"],83:[23,"zone5-05-figure-before-council"],78:[24,"zone5-06-tavern-toast"],62:[25,"zone5-07-shop-glowing-stones"],80:[26,"zone5-08-picnic-farthest"],84:[27,"zone5-09-bedside-center"]};
const pieceFor=id=>ROOM_ART[id]?ROOM_ART[id][0]:-1; // id = room id
const cd=r=>Math.abs(r.c[0]-M.centre[0])+Math.abs(r.c[1]-M.centre[1]);
let speed=24; // ms per letter
// ---------- story state (kept inside the save) ----------
function st(){const l=live();if(!l||!l.party||!l.party.length)return null;let s=l.story;
 if(!s||typeof s!=="object")s=l.story={v:1};["seen","walls","told"].forEach(k=>{if(!s[k]||typeof s[k]!=="object")s[k]={};});
 if(!Array.isArray(s.plan))s.plan=R.planParty(l.party[0],(l.seed|0)>>>0);if(s.revealed==null)s.revealed=false;if(s.ending===undefined)s.ending=null;return s;}
function who(code){const l=live();if(!l)return null;if(code==="H")return l.party[0];if(!ROLE[code])return null;
 return l.party.find(c=>c.role===ROLE[code])||(l.party[IDX[code]]&&!l.party[IDX[code]].role?l.party[IDX[code]]:null);}
function fill(t){return t.replace(/\{([HQSA])\}/g,(_,c)=>{const m=who(c);return m?m.name:"friend";});}
function resolve(lines){return lines.filter(([w])=>w==="N"||w==="D"||who(w)).map(([w,e,t])=>{const m=w==="N"||w==="D"?null:who(w);
 return {w,e:e||"calm",t:fill(t),name:w==="N"?"":w==="D"?"Dad":m.name,art:m?(SHEET[m.race]||"knight"):null};});}
function zoneNow(){try{return S.state().zone||1;}catch(e){return 1;}}
const dark=()=>zoneNow()>=4;
function explored(){const s=st();return (S.rooms?S.rooms().solved.length:0)+(s?Object.keys(s.walls).length:0);}
function endingFor(n){const f=n/(TOTAL_P+TOTAL_W);return f>=0.9?"high":f>=0.5?"mid":"low";}
function memUnlocked(code){return Math.min(D.memory[code].length,Math.floor(explored()/MEM_STEP));}
function memLine(){const s=st();if(!s)return null;for(const c of["Q","S","A"]){if(!who(c))continue;const n=s.told[c]|0;if(n<memUnlocked(c)){s.told[c]=n+1;return [c,"calm",D.memory[c][n]];}}return null;}
function withMem(lines){const m=memLine();return m?lines.concat([["N","calm","(A memory, shared by the fire.)"],m]):lines;}
// ---------- dialogue box ----------
let cur=null;const queue=[];let box=null;
function el(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function build(){if(box)return box;box=el("div","s6d");box.id="s6d";
 box.innerHTML='<div class="s6bg"></div><img class="s6wall" alt=""><div class="s6box"><div class="s6pf"><img class="s6p" alt=""></div><div class="s6name"></div><div class="s6t"></div><div class="s6more">▼</div><div class="s6btns"></div></div>';
 box.addEventListener("pointerdown",tap);box.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();});document.body.appendChild(box);return box;}
function q(sel){return box.querySelector(sel);}
function play(kind,lines,opt){const L=resolve(lines||[]);opt=opt||{};if(!L.length){if(opt.done)opt.done();return false;}queue.push({kind,L,opt});if(!cur)nextScene();return true;}
function nextScene(){const sc=queue.shift();if(!sc){close();return;}build();cur={kind:sc.kind,L:sc.L,opt:sc.opt,i:-1,typing:false};
 box.className="s6d on"+(sc.opt.bg?" hasbg":"")+(sc.opt.wall?" haswall":"");box.dataset.scene=sc.kind;
 q(".s6bg").style.backgroundImage=sc.opt.bg?'url("'+sc.opt.bg+'")':"none";const w=q(".s6wall");if(sc.opt.wall){w.src=sc.opt.wall;w.style.display="block";}else{w.removeAttribute("src");w.style.display="none";}
 q(".s6btns").innerHTML="";document.documentElement.classList.add("s6open");adv();}
function adv(){if(!cur)return;cur.i++;if(cur.i>=cur.L.length){const sc=cur;cur=null;if(sc.opt.end){cur=sc;cur.i=sc.L.length-1;cur.ending=true;sc.opt.end();return;}
  if(queue.length)nextScene();else close();if(sc.opt.done)sc.opt.done();return;}show();}
function show(){const ln=cur.L[cur.i],pf=q(".s6pf"),p=q(".s6p");box.dataset.line=cur.i;box.dataset.who=ln.w;box.dataset.emo=ln.e;
 pf.className="s6pf"+(ln.art?"":ln.w==="D"?" dad":" none");if(ln.art){const src="art6/"+ln.art+"-"+ln.e+".webp";if(p.getAttribute("src")!==src)p.setAttribute("src",src);p.dataset.art=ln.art;p.dataset.emo=ln.e;}else{p.removeAttribute("src");p.dataset.art="";p.dataset.emo="";}
 pf.classList.remove("flash");void pf.offsetWidth;pf.classList.add("flash");
 q(".s6name").textContent=ln.name;q(".s6name").style.visibility=ln.name?"visible":"hidden";q(".s6more").classList.remove("on");
 const tx=q(".s6t");tx.textContent="";tx.classList.toggle("note",ln.w==="N");cur.typing=true;let k=0;const me=cur;
 const step=()=>{if(cur!==me)return;k++;tx.textContent=ln.t.slice(0,k);if(k<ln.t.length)me.tm=setTimeout(step,speed);else{me.typing=false;q(".s6more").classList.add("on");}};step();}
function tap(e){e.preventDefault();e.stopPropagation();if(!cur||cur.typing||cur.ending)return;if(e.target&&e.target.closest&&e.target.closest(".s6btns button"))return;adv();}
function close(){if(box){box.className="s6d";box.dataset.scene="";}document.documentElement.classList.remove("s6open");}
window.addEventListener("keydown",e=>{if(!cur)return;e.preventDefault();e.stopImmediatePropagation();if((e.key==="Enter"||e.key===" ")&&!cur.typing&&!cur.ending)adv();},true);
function btns(list){const b=q(".s6btns");b.innerHTML="";q(".s6more").classList.remove("on");list.forEach(([t,fn,id])=>{const x=el("button","ink s4b small",t);x.dataset.s6b=id;x.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();fn();});b.appendChild(x);});}
function finish(){const sc=cur;cur=null;if(queue.length)nextScene();else close();if(sc&&sc.opt.done)sc.opt.done();}
// ---------- scenes ----------
const tavBg=t=>"art6/tavern-"+(Math.min(4,t+1))+".webp";
function wallArt(id){return "art6/"+ROOM_ART[id][1]+".webp";}
function seenFirst(pool,s){return pool.find(sc=>!s.seen[sc.id]&&(!sc.need||who(sc.need))&&(!sc.after||s.revealed));}
const H={};
H.plan=()=>{const s=st();return s?s.plan:null;};
H.created=()=>{const s=st();if(!s)return;s.seen.opening=1;play("opening",D.opening,{bg:null});};
H.joined=(c,t)=>{const s=st();if(!s)return;s.seen["join"+t]=1;play("join",D.join[t]||[],{bg:tavBg(t)});};
H.tavern=t=>{const s=st(),l=live();if(!s)return;const vk=t+":"+l.steps;if(s.visit===vk)return;s.visit=vk;s.shopN=0;
 const sc=seenFirst(D.tavern[t]||[],s);if(sc){s.seen[sc.id]=1;play("tavern",withMem(sc.lines),{bg:tavBg(t)});}};
H.shop=()=>{const s=st();if(!s||!s.visit)return;s.shopN=(s.shopN|0)+1;if(s.shopN%3)return;const sc=seenFirst(D.stay[dark()?"dark":"fun"],s);
 if(sc){s.seen[sc.id]=1;play("stay",sc.lines,{bg:tavBg(+s.visit.split(":")[0])});}};
H.camp=k=>{const s=st();if(!s)return;const sc=seenFirst(D.camp[dark()?"dark":"fun"],s);if(sc){s.seen[sc.id]=1;play("camp",withMem(sc.lines),{bg:null});}};
H.wall=id=>{const s=st(),r=M.rooms[id];if(!s||!r||!WALLS.includes(r)||s.walls[id])return;
 const pi=pieceFor(id);if(pi<0)return;let lines=PIECES[pi].slice();if(pi>=DAD_FROM)s.revealed=true;
 if(r.z!==3&&who("S")&&pi<DAD_FROM)lines.push(["S","calm",r.z<3?"(Sorrel sulks and scribbles notes.) Hm. Not my zone.":"(Sorrel is lost in study and doesn't hear anyone for a while.)"]);
 s.walls[id]=1;if(!Array.isArray(s.order))s.order=[];s.order.push(id);s.lastPiece=pi;play("wall",withMem(lines),{wall:wallArt(id)});};
H.step=()=>{const s=st();if(!s||s.seen.boss)return;const p=S.state();if(Math.abs(p.x-M.centre[0])+Math.abs(p.y-M.centre[1])>2)return;s.seen.boss=1;bossNote();};
function bossNote(){play("boss",D.boss,{end:()=>{btns([["‹ Open the door",()=>{finish();showEnding();},"open"],["Not yet",()=>finish(),"later"]]);}});}
function showEnding(){const s=st();if(!s)return;const n=explored(),k=endingFor(n),E=D.ending[k];s.ending=k;
 play("ending",E.lines,{end:()=>{const t=q(".s6t");t.classList.remove("note");t.innerHTML="";t.appendChild(el("div","s6title","Ending: "+E.title));
  t.appendChild(el("div","s6cnt","Puzzles solved: "+(S.rooms().solved.length)+" / "+TOTAL_P+"  ·  Wall art found: "+Object.keys(s.walls).length+" / "+TOTAL_W));
  t.appendChild(el("div","s6cnt dim","(The Iron Golem fight comes in a later stage.)"));q(".s6name").style.visibility="hidden";q(".s6pf").className="s6pf none";box.dataset.ending=k;
  btns([["Back to the maze",()=>finish(),"back"]]);}});}
// ---------- fights: one short line at the start and one at the end, nothing in between ----------
let fightNo=0;
function fightLine(phase,how){const l=live();if(!l)return;const st0=document.querySelector(".s4stage");if(!st0)return;let fl=document.getElementById("s6fl");if(fl)fl.remove();
 const tone=dark()?"dark":"fun",cs=["Q","S","A"].filter(c=>who(c)&&who(c).hp>0);let code=null,text=null;
 if(phase==="end"&&how==="ran"){code=cs[0]||"H";text=D.fight.ran;}else if(phase==="end"&&how!=="win")return;
 else{if(!cs.length)return;code=cs[(fightNo+(phase==="end"?1:0))%cs.length];const pool=D.fight[phase][code][tone];text=pool[fightNo%pool.length];}
 const m=who(code);fl=el("div","s6fl");fl.id="s6fl";fl.dataset.phase=phase;fl.dataset.who=code;const im=el("img","s6flp");im.src="art6/"+(SHEET[m.race]||"knight")+"-"+(phase==="start"?(code==="A"?"angry":"happy"):"happy")+".webp";im.alt="";
 fl.appendChild(im);fl.appendChild(el("span","s6fln",m.name+": "));fl.appendChild(el("span","s6flt",text));st0.appendChild(fl);
 if(phase==="start"){const bot=document.getElementById("fbot");const hide=()=>{if(fl.dataset.phase==="start")fl.remove();};if(bot)bot.addEventListener("pointerdown",hide,{once:true});setTimeout(hide,3200);}}
H.fightStart=()=>{fightNo++;fightLine("start");};
H.fightEnd=how=>{fightLine("end",how);};
window.S6H=H;
S.storyOpen=()=>!!cur;
S.rpg.s6={play,st,who,explored,endingFor,memUnlocked,WALL_ART_ROOMS,PIECES:()=>PIECES.length,DAD_FROM,pieceFor,roomArt:()=>JSON.parse(JSON.stringify(ROOM_ART)),artRooms:()=>WALLS.map(r=>r.id),TOTAL_P,TOTAL_W,MEM_STEP,showEnding,bossNote,open:()=>!!cur,line:()=>cur?{i:cur.i,typing:cur.typing,kind:cur.kind,who:cur.L[cur.i]&&cur.L[cur.i].w}:null,
 setSpeed:v=>{speed=v;},queue:()=>queue.length,H};
// styles (portrait only, small name tab)
const css=document.createElement("style");css.textContent=`
.s6d{display:none;position:fixed;inset:0;z-index:45;background:radial-gradient(ellipse at 50% 30%,#241838,#08050e 75%);color:#efe0b8;font:16px Georgia,serif;user-select:none;touch-action:none}
.s6d.on{display:block}
.s6bg{position:absolute;left:0;right:0;top:0;height:42vh;background-size:cover;background-position:center;-webkit-mask-image:linear-gradient(#000 60%,transparent);mask-image:linear-gradient(#000 60%,transparent);opacity:.95}
.s6wall{display:none;position:absolute;left:50%;top:calc(12px + env(safe-area-inset-top));transform:translateX(-50%);max-width:88vw;max-height:calc(100vh - 360px);border:2px solid #6f58b8;border-radius:6px;box-shadow:0 0 24px rgba(0,0,0,.8)}
.s6box{position:absolute;left:10px;right:10px;bottom:calc(14px + env(safe-area-inset-bottom))}
.s6pf{width:124px;height:124px;border:2px solid #b89cff;border-radius:10px;overflow:hidden;background:#140c22;box-shadow:0 4px 14px rgba(0,0,0,.7)}
.s6pf img{width:100%;height:100%;display:block;object-fit:cover}
.s6pf.none{visibility:hidden;height:0;border:0}
.s6pf.dad img{display:none}.s6pf.dad{background:radial-gradient(circle at 50% 38%,#3a3048 0 17%,transparent 18%),radial-gradient(ellipse at 50% 100%,#3a3048 0 45%,transparent 46%),linear-gradient(#1c1428,#0c0812)}
.s6pf.flash{animation:s6f .28s ease-out}@keyframes s6f{0%{filter:brightness(1.9);transform:scale(1.05)}100%{filter:none;transform:none}}
.s6name{display:inline-block;margin-top:6px;padding:3px 10px;font:600 14px Georgia,serif;background:#2a1a48;border:1px solid #8f74e0;border-bottom:0;border-radius:8px 8px 0 0}
.s6t{min-height:100px;padding:12px 14px 20px;background:rgba(20,10,40,.95);border:1px solid #8f74e0;border-radius:0 10px 10px 10px;line-height:1.38;font-size:16px}
.s6t.note{font-style:italic;color:#d8cbb0}
.s6more{position:absolute;right:14px;bottom:6px;font-size:12px;opacity:0}.s6more.on{opacity:.9;animation:s6b 1s infinite}@keyframes s6b{50%{opacity:.3}}
.s6btns{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}.s6btns:empty{display:none}
.s6title{font:700 18px Georgia,serif;color:#ffe3a0;margin-bottom:6px}.s6cnt{font-size:14px;margin-top:4px}.s6cnt.dim{opacity:.7}
.s6fl{position:absolute;left:8px;right:8px;top:38%;display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(20,10,40,.9);border:1px solid #8f74e0;border-radius:10px;font:14px Georgia,serif;color:#efe0b8;z-index:3;pointer-events:none}
.s6flp{width:36px;height:36px;border-radius:6px;object-fit:cover;flex:none}.s6fln{font-weight:600;flex:none}
`;document.head.appendChild(css);
})();
