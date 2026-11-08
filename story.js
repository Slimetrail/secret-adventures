/* Secret of the Adventures - Stage 6 story layer: dialogue box with painted portraits that change pose by line,
   opening, companion joins, tavern/camp/wall-art banter, fight start/end lines, boss-door note, endings, memory lines.
   Text only (no sound). Banter can't be skipped or fast-forwarded: a tap only moves on once the line has fully appeared.
   Offline: all art is in art6/. No network, no ads. */
(function(){"use strict";
const S=window.SOTA,R=window.RPG,M=window.MAZE,D=window.STORY,G=window.StoryGates;if(!S||!R||!M||!D)return;
const live=()=>S.rpg&&S.rpg.live&&S.rpg.live();
const SHEET={human:"knight",elf:"elf",dwarf:"dwarf",cat:"cat"},ROLE={Q:"quirky",S:"scholar",A:"angry"},IDX={Q:1,S:2,A:3};
// Wall-art rooms. OPEN QUESTION for Jeremy: do monster/treasure rooms carry art too? Then set WALL_ART_ROOMS=85 (= every room).
const WALL_ART_ROOMS=28;
const WALLS=WALL_ART_ROOMS>=M.rooms.length?M.rooms.slice():M.rooms.filter(r=>r.k==="story"),TOTAL_P=M.rooms.length,TOTAL_W=WALL_ART_ROOMS,MEM_STEP=8;
// Each story room has ONE fixed piece (Jeremy 2026-11-06, t1822u-t1830u): its own painting and its own thoughts.
// Find the room or miss that piece; how many walls were found before does not matter.
// Pieces: zone 1..5 scenes in order, then the legacy Dad data last. Playback below overrides picnic/bedside only.
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
 if(!Array.isArray(s.plan))s.plan=R.planParty(l.party[0],(l.seed|0)>>>0);Object.assign(s,G.naming(s.walls,ROOM_ART));delete s.picnicFirstMotive;if(s.ending===undefined)s.ending=null;return s;}
function who(code){const l=live();if(!l)return null;if(code==="H")return l.party[0];if(!ROLE[code])return null;
 return l.party.find(c=>c.role===ROLE[code])||(l.party[IDX[code]]&&!l.party[IDX[code]].role?l.party[IDX[code]]:null);}
function fill(t){const out=t.replace(/\{([HQSA])\}/g,(_,c)=>{const m=who(c);return m?m.name:"friend";});return window.CompanionDisplay?window.CompanionDisplay.rewrite(out,live()):out;}
// t2270u: a talk that has or needs a missing companion does not play at all (never a leftover fragment).
const COMP_NAME={mira:"Q",sorrel:"S",brunn:"A"};
function compCode(x){if(!x)return null;x=String(x);return /^[QSA]$/.test(x)?x:COMP_NAME[x.toLowerCase()]||null;}
function talkPresent(lines,deps){const codes=[].concat(deps||[]).map(compCode);(lines||[]).forEach(l=>codes.push(compCode(Array.isArray(l)?l[0]:l&&(l.w||l.speaker))));
 return codes.every(c=>!c||!!who(c));}
const PARTIAL_OK={opening:1,wall:1,"art-room":1,boss:1,ending:1};
function resolve(lines){return lines.filter(([w])=>w==="N"||w==="D"||/^K[1-4]$/.test(w)||who(w)).map(([w,e,t])=>{const m=w==="N"||w==="D"||/^K[1-4]$/.test(w)?null:who(w);
 return {w,e:e||"calm",t:fill(t),name:/^K[1-4]$/.test(w)?["Brannoc","Wynn","Sylvaine","Miso"][+w[1]-1]:w==="N"?"":w==="D"?"Dad":(window.CompanionDisplay?window.CompanionDisplay.displayName(m,live()):m.name),art:m?(SHEET[m.race]||"knight"):null};});}
function zoneNow(){try{return S.state().zone||1;}catch(e){return 1;}}
const dark=()=>zoneNow()>=4;
function explored(){const s=st();return (S.rooms?S.rooms().solved.length:0)+(s?Object.keys(s.walls).length:0);}
function endingFor(){return {warning:"low",half:"mid",apology:"high"}[letterReading()];}
function memUnlocked(code){return Math.min(D.memory[code].length,Math.floor(explored()/MEM_STEP));}
function memLine(){const s=st();if(!s)return null;for(const c of["Q","S","A"]){if(!who(c))continue;const n=s.told[c]|0;if(n<memUnlocked(c)){s.told[c]=n+1;return [c,"calm",D.memory[c][n]];}}return null;}
function withMem(lines){const m=memLine();return m&&talkPresent([m])?lines.concat([["N","calm","(A memory, shared by the fire.)"],m]):lines;}
// ---------- dialogue box ----------
let cur=null;const queue=[];let box=null;
function el(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function build(){if(box)return box;box=el("div","s6d");box.id="s6d";
 box.innerHTML='<div class="s6bg"></div><img class="s6wall" alt=""><div class="s6box"><div class="s6pf"><img class="s6p" alt=""></div><div class="s6name"></div><div class="s6t"></div><div class="s6more">▼</div><div class="s6btns"></div></div>';
 box.addEventListener("pointerdown",tap);box.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();});document.body.appendChild(box);return box;}
function q(sel){return box.querySelector(sel);}
function play(kind,lines,opt){opt=opt||{};if(!PARTIAL_OK[kind]&&!talkPresent(lines,opt.need)){if(opt.done)opt.done();return false;}const L=resolve(lines||[]);if(!L.length){if(opt.done)opt.done();return false;}queue.push({kind,L,opt});if(!cur)nextScene();return true;}
function nextScene(){const sc=queue.shift();if(!sc){close();return;}build();cur={kind:sc.kind,L:sc.L,opt:sc.opt,i:-1,typing:false};
 box.className="s6d on"+(sc.opt.bg?" hasbg":"")+(sc.opt.wall?" haswall":"")+(sc.kind==="camp"&&/^art6\/camp\//.test(sc.opt.bg||"")?" camp-scene":"");box.dataset.scene=sc.kind;
 q(".s6bg").style.backgroundImage=sc.opt.bg?'url("'+sc.opt.bg+'")':"none";const w=q(".s6wall");if(sc.opt.wall){w.src=sc.opt.wall;w.style.display="block";}else{w.removeAttribute("src");w.style.display="none";}
 q(".s6btns").innerHTML="";document.documentElement.classList.add("s6open");if(sc.opt.visualOnly){cur.ending=true;cur.typing=false;q(".s6name").textContent="";q(".s6name").style.visibility="hidden";q(".s6pf").className="s6pf none";q(".s6t").textContent="";btns([["Back to the maze",()=>finish(),"back"]]);}else adv();}
function adv(){if(!cur)return;cur.i++;if(cur.i>=cur.L.length){const sc=cur;cur=null;if(sc.opt.end){cur=sc;cur.i=sc.L.length-1;cur.ending=true;sc.opt.end();return;}
  if(queue.length)nextScene();else close();if(sc.opt.done)sc.opt.done();return;}show();}
function show(){const ln=cur.L[cur.i],pf=q(".s6pf"),p=q(".s6p");box.dataset.line=cur.i;box.dataset.who=ln.w;box.dataset.emo=ln.e;
 const paintedCamp=cur.kind==="camp"&&/^art6\/camp\//.test(cur.opt.bg||"");
 pf.className="s6pf"+(!paintedCamp&&ln.art?"":ln.w==="D"?" dad":" none");if(ln.art&&!paintedCamp){const src="art6/"+ln.art+"-"+ln.e+".webp";if(p.getAttribute("src")!==src)p.setAttribute("src",src);p.dataset.art=ln.art;p.dataset.emo=ln.e;}else{p.removeAttribute("src");p.dataset.art="";p.dataset.emo="";}
 pf.classList.remove("flash");void pf.offsetWidth;pf.classList.add("flash");
 q(".s6name").textContent=ln.name;q(".s6name").style.visibility=ln.name?"visible":"hidden";q(".s6more").classList.remove("on");
 const tx=q(".s6t");tx.textContent="";tx.classList.toggle("note",ln.w==="N");cur.typing=true;let k=0;const me=cur;
 const step=()=>{if(cur!==me)return;k++;tx.textContent=ln.t.slice(0,k);if(k<ln.t.length)me.tm=setTimeout(step,speed);else{me.typing=false;q(".s6more").classList.add("on");}};step();}
function tap(e){e.preventDefault();e.stopPropagation();if(!cur||cur.typing||cur.ending)return;if(e.target&&e.target.closest&&e.target.closest(".s6btns button"))return;adv();}
function close(){if(box){box.className="s6d";box.dataset.scene="";}document.documentElement.classList.remove("s6open");}
window.addEventListener("keydown",e=>{if(!cur)return;e.preventDefault();e.stopImmediatePropagation();if((e.key==="Enter"||e.key===" ")&&!cur.typing&&!cur.ending)adv();},true);
function btns(list){const b=q(".s6btns");b.innerHTML="";q(".s6more").classList.remove("on");list.forEach(([t,fn,id,off])=>{const x=el("button","ink s4b small",t);x.dataset.s6b=id;x.disabled=!!off;x.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();fn();});b.appendChild(x);});}
function finish(){const sc=cur;cur=null;if(queue.length)nextScene();else close();if(sc&&sc.opt.done)sc.opt.done();}
// Local scripted scenes: Dialogue Lead's checked intro / reveal-and-endings sheets.
// Sequential pairs only; the locked STORY data and all picker pools remain untouched.
const REWRITE=window.PACKAGE_STORY.rewrite;
function pair(key,tags){const rows=REWRITE[key]||[],out=[];for(const n of [...new Set(rows.map(r=>r.n))]){const choices=rows.filter(r=>r.n===n);const hit=choices.find(r=>r.tag&&(tags||[]).includes(r.tag))||choices.find(r=>!r.tag)||choices[0];out.push(hit.line);}return out;}
const INTRO_LINES=pair("intro");
// t2191u approved first-picture naming; motive only after both pictures.
function picnicLines(){
  const s=st(), first=!s.walls[84]; // called BEFORE H.wall records the current find
  const Q=!!who("Q"), Sch=!!who("S"), A=!!who("A");
  let out=[];
  if(Q){
    if(!first && !Sch) out=pair("R1", ["bedside-already-found AND Sorrel missing"]);
    else out=pair("R1", ["picnic-first; also bedside-already-found if R2 will play"]);
  } else if(Sch) out=pair("R1-alt", first?["picnic-first"]:["bedside-already-found"]);
  else if(A) out=pair("R1-alt2", first?["picnic-first"]:["bedside-already-found"]);
  else out=[pair("R1")[0], pair("R1")[2]];
  if(Q&&Sch) out=out.concat(pair("R2", first?["picnic-first"]:["bedside-already-found"]));
  if(A&&(Q||Sch)) out=out.concat(pair("R3"));
  return out;
}
function bedsideLines(){
  if(st().revealed) return []; // picnic already found; this is bedside-first only
  let out=who("Q")?pair("B1"):who("S")?pair("B1-alt"):who("A")?pair("B1-alt2"):[pair("B1")[0],pair("B1")[2]];
  if(who("Q")&&who("S")) out=out.concat(pair("B2"));
  if(who("A")&&(who("Q")||who("S"))) out=out.concat(pair("B3"));
  return out;
}
function endingLines(k){const s=st(),Q=!!who("Q"),Sch=!!who("S"),A=!!who("A"),w=s.walls,K=LETTER_KEYS;let out=[];
 if(k==="low"){if(Q&&Sch){out=pair("D2");if(A)out=out.concat(pair("D3"));}else if(Q&&A)out=pair("D2-alt");else if(Sch&&A)out=pair("D2-alt2");else if(Q)out=[pair("D2")[0]];else if(Sch)out=[pair("D2-alt2")[0]];else if(A)out=[pair("D2-alt")[1]];}
 else if(k==="mid"){if(Q)out=out.concat(pair("C1",s.revealed?["father already named from zone5-08 OR zone5-09"]:[]));if(Sch)out=out.concat(pair("C2",w[K.wizard]?["wizard found"]:w[K.council]?["council found"]:["default"]));if(A){if(!Q&&!Sch)out.push(["H","calm","We're alive. It's still bleeding."]);out=out.concat(pair(brunnVer()==="save"?"C3a":"C3b"));}}
 else{const f=pair("F1",s.wifeMotive?["save-his-wife unlocked: BOTH zone5-08 AND zone5-09 found, either order"]:[]);out=Q?f:[f[0]];if(Sch)out=out.concat(pair("F2",[w[K.wizard]?(w[K.council]?"council and wizard both found":"wizard found, council not found"):"council found, wizard not found"]));if(A&&brunnVer()==="save")out=out.concat(pair("F3"));}return out;}
// ---------- scenes ----------
const tavBg=t=>S.rpg.s5.tavernBg(t);
function wallArt(id){return "art6/"+ROOM_ART[id][1]+".webp";}
function showArtOnly(id){queue.push({kind:"wall",L:[],opt:{wall:wallArt(id),visualOnly:true}});if(!cur)nextScene();}
function seenFirst(pool,s){return pool.find(sc=>!s.seen[sc.id]&&(!sc.need||who(sc.need))&&talkPresent(sc.lines,sc.need)&&(!sc.after||s.revealed));}
const H={};
H.plan=()=>{const s=st();return s?s.plan:null;};
H.created=()=>{const s=st();if(!s)return;s.seen.opening=1;play("opening",INTRO_LINES,{bg:null});};
H.joined=(c,t)=>{const s=st();if(!s)return;if(t===3&&!s.brunnJoin)s.brunnJoin=G.brunnAtJoin(s.walls,ROOM_ART);s.seen["join"+t]=1;play("join",D.join[t]||[],{bg:tavBg(t)});};
H.tavern=t=>{const s=st(),l=live();if(!s)return;const vk=t+":"+l.steps;if(s.visit===vk)return;s.visit=vk;s.shopN=0;
 const sc=seenFirst(D.tavern[t]||[],s);if(sc){s.seen[sc.id]=1;play("tavern",withMem(sc.lines),{bg:tavBg(t)});}};
H.shop=()=>{const s=st();if(!s||!s.visit)return;s.shopN=(s.shopN|0)+1;if(s.shopN%3)return;const sc=seenFirst(D.stay[dark()?"dark":"fun"],s);
 if(sc){s.seen[sc.id]=1;play("stay",sc.lines,{bg:tavBg(+s.visit.split(":")[0])});}};
H.camp=k=>{const s=st();if(!s)return;const sc=seenFirst(D.camp[dark()?"dark":"fun"],s);if(sc){s.seen[sc.id]=1;play("camp",withMem(sc.lines),{bg:S.rpg.s5.campBg(sc)});}};
function partyCodes(){return ["Q","S","A"].filter(c=>who(c)).join("");}
H.wall=id=>{const s=st(),r=M.rooms[id];if(!s||!r||!WALLS.includes(r))return;if(!s.wallHeard||typeof s.wallHeard!=="object")s.wallHeard={};
 const pc=partyCodes(),first=!s.walls[id];if(!first&&s.wallHeard[id]==null){s.wallHeard[id]=pc;return;} // old save: assume heard with current party
 if(!first&&![...pc].some(c=>!s.wallHeard[id].includes(c)))return;
 const pi=pieceFor(id);if(pi<0)return;const added=window.PackageRooms?window.PackageRooms.lines(id,pc,s,ROOM_ART,who,brunnVer):[];let lines=id===LETTER_KEYS.picnic?(first?picnicLines():[]):id===84?(first?bedsideLines():[]):PIECES[pi].slice();
 if(!window.PackageRooms&&r.z!==3&&who("S")&&pi<DAD_FROM)lines.push(["S","calm",r.z<3?"(Sorrel sulks and scribbles notes.) Hm. Not my zone.":"(Sorrel is lost in study and doesn't hear anyone for a while.)"]);
 s.walls[id]=1;s.wallHeard[id]=[...new Set(s.wallHeard[id]||"")].concat([...pc]).filter((c,i,a)=>a.indexOf(c)===i).join("");if(!Array.isArray(s.order))s.order=[];if(first)s.order.push(id);s.lastPiece=pi;
 Object.assign(s,G.naming(s.walls,ROOM_ART));
 if(G.namingHeld(id,ROOM_ART)){showArtOnly(id);return;}
 play("wall",pi>=DAD_FROM?lines:withMem(lines),{wall:wallArt(id)});if(window.PackageDialogue&&S.rpg.s6.packageDialogue)S.rpg.s6.packageDialogue.pool("wall-art",{zone:r.z,id},{wall:wallArt(id)});if(added.length)play("art-room",added,{wall:wallArt(id)});};
H.step=()=>{const s=st();if(!s||s.seen.boss)return;const p=S.state();if(Math.abs(p.x-M.centre[0])+Math.abs(p.y-M.centre[1])>2)return;s.seen.boss=1;bossNote();};
// Centre lock reuses Stage 3's existing zone-5 lever rules. It is not an 86th room.
const FINAL_LOCK=window.PUZ.make(1,5,713507);let lockState=window.PUZ.clone(FINAL_LOCK.s);
// Boss door locks 2 and 3 reuse existing Stage 3 types at zone 5 (no new type, no room, no markSolved).
// Fixed seeds: 731117 (sliding tiles) and 731119 (moving blocks); both differ from 713507 and from every room seed (id+1)*9973+17*z.
const FINAL_LOCK2=window.PUZ.make(4,5,731117),FINAL_LOCK3=window.PUZ.make(3,5,731119);let lockState2=window.PUZ.clone(FINAL_LOCK2.s),lockState3=window.PUZ.clone(FINAL_LOCK3.s),lockSel3=0;
function bossChoices(){const s=st(),P=window.PUZ;let lock=q(".s7lock");if(lock)lock.remove();
 const box=()=>{lock=el("div","s7lock");lock.style.cssText="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap";q(".s6t").appendChild(lock);return lock;};
 const tap=(b,f)=>b.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();f();bossChoices();});
 if(!s.finalLock){box();
  lock.appendChild(el("div","","Final lock: light every lamp with the levers."));const lit=P.lamps(FINAL_LOCK.pz,lockState);
  for(let i=0;i<FINAL_LOCK.pz.L;i++){const b=el("button","ink s4b small",(lit>>i&1?"●":"○")+" Lever "+(i+1));b.dataset.s7lever=i;b.style.cssText="min-height:44px;min-width:80px";
   b.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();lockState=P.apply(FINAL_LOCK.pz,lockState,i);if(P.solved(FINAL_LOCK.pz,lockState))s.finalLock=true;bossChoices();});lock.appendChild(b);}}
 else if(!s.finalLock2){box();const pz=FINAL_LOCK2.pz,n=pz.n,c=44;
  lock.appendChild(el("div","","Second lock: sliding tiles. Slide the tiles into order, 1 first, gap last."));
  const g=el("div","pgrid");g.dataset.s7lock="2";g.style.cssText=`width:${n*c}px;height:${n*c}px;background:#8f6db555;flex-basis:100%;max-width:${n*c}px`;
  lockState2.a.forEach((v,p)=>{if(!v)return;const b=el("button","ptile",String(v));b.dataset.s7tile=p;b.style.cssText=`left:${p%n*c+2}px;top:${((p/n)|0)*c+2}px;width:${c-4}px;height:${c-4}px;font-size:${Math.round(c*.42)}px`;
   tap(b,()=>{lockState2=P.apply(pz,lockState2,p);if(P.solved(pz,lockState2))s.finalLock2=true;});g.appendChild(b);});lock.appendChild(g);}
 else if(!s.finalLock3){box();const pz=FINAL_LOCK3.pz,n=pz.n,c=40,W=n*c;
  lock.appendChild(el("div","","Third lock: moving blocks. Slide the blocks so the gold block leaves on the right."));
  const g=el("div","pgrid pblocks");g.dataset.s7lock="3";g.style.cssText=`width:${W}px;height:${W}px;background-size:${c}px ${c}px;background-color:#8f6db533`;
  pz.blk.forEach((bk,i)=>{const[x,y]=lockState3.q[i];const b=el("button","pblk"+(i===0?" key":"")+(lockSel3===i?" sel":""),"");b.dataset.s7blk=i;b.setAttribute("aria-label","Block "+i);
   b.style.cssText=`left:${x*c+1}px;top:${y*c+1}px;width:${(bk.h?bk.len*c:c)-2}px;height:${(bk.h?c:bk.len*c)-2}px`;tap(b,()=>{lockSel3=i;});g.appendChild(b);});
  const ex=el("div","pexit");ex.style.cssText=`left:${W}px;top:${pz.r*c}px;height:${c}px;width:${Math.round(c*.3)}px`;g.appendChild(ex);lock.appendChild(g);
  const vert=!pz.blk[lockSel3].h;[[-1,vert?"▲":"◀","Move back"],[1,vert?"▼":"▶","Move on"]].forEach(([d,lab,al])=>{const b=el("button","ink s4b small",lab);b.dataset.s7dir=d;b.setAttribute("aria-label",al);b.style.cssText="min-height:44px;min-width:60px";
   tap(b,()=>{lockState3=P.apply(pz,lockState3,[lockSel3,d]);if(P.solved(pz,lockState3))s.finalLock3=true;});lock.appendChild(b);});}
 btns([["‹ Open the door",()=>{if(!(s.finalLock&&s.finalLock2&&s.finalLock3))return;finish();S.rpg.startBoss();},"open",!(s.finalLock&&s.finalLock2&&s.finalLock3)],["Not yet",()=>finish(),"later"]]);}
// ---------- letter (Note before you enter) companion reactions: /workspace/dialogue-team/pool-letter.md rows 1-13, main Line text ----------
const LETTER_POOL={
 warning:{N:"This is a warning. That thing guarding the crystal will not stand down.",
  Q:"That's a lot to read right before we walk in. I'm still going if you are.",
  S:"Treat this as instruction. Something is leaking, and the guard has a single command.",
  A:{died:"It doesn't know why it stands there. My team died to that. To an order."}},
 half:{N:"Someone tried to stop what broke. This is how little it helped.",
  Q:"I'm glad we read it, and I hate what it asks.",
  S:"This is a record of a failed sealing. The writer remained after the others fled, then made a guardian when the work would not close.",
  A:{save:"What's leaking still has to be stopped. We end this.",died:"My team walked into that order. That's what took them."}},
 apology:{N:"This was meant for you. He is telling you what he left in that room.",
  Q:"That's your dad. He tried, and it still cost him. I'm right here, okay?",
  S:"The later pieces and this note are the same account. Your father stayed when the others ran, and this is what that choice left behind.",
  A:{save:"Your father built that golem. We're ending what he left. That's not on you."}}};
// key rooms by ROOM_ART file name
const artRoom=n=>+Object.keys(ROOM_ART).find(k=>ROOM_ART[k][1]===n);
const LETTER_KEYS={crack:artRoom("zone3-05-crystal-cracked-smoke"),z4:Object.keys(ROOM_ART).filter(k=>/^zone4-0[1-7]-/.test(ROOM_ART[k][1])).map(Number),
 picnic:artRoom("zone5-08-picnic-farthest"),wizard:artRoom("zone5-07-shop-glowing-stones"),council:artRoom("zone5-05-figure-before-council")};
function letterReading(){const s=st();return s?G.reading(s.walls,ROOM_ART):"warning";}
function brunnJoinVersion(){const s=st();return s?G.brunnAtJoin(s.walls,ROOM_ART):"died";}
function brunnVer(){const s=st();if(!s)return "died";if(s.brunnJoin)return s.brunnJoin;const version=brunnJoinVersion();if(who("A"))s.brunnJoin=version;return version;}
function letterLines(){const r=letterReading(),P=LETTER_POOL[r],out=[];const v=r==="warning"?"died":r==="apology"?"save":brunnVer();
 if(who("Q"))out.push(["Q","calm",P.Q]);if(who("S"))out.push(["S","calm",P.S]);if(who("A")&&P.A[v])out.push(["A","angry",P.A[v]]);
 return out.length?out:[["N","calm",P.N]];}
function bossNote(){const s=st();if(!s)return;if(!s.finalLock&&window.PUZ.solved(FINAL_LOCK.pz,lockState))lockState=window.PUZ.clone(FINAL_LOCK.s);if(!s.finalLock2&&window.PUZ.solved(FINAL_LOCK2.pz,lockState2))lockState2=window.PUZ.clone(FINAL_LOCK2.s);if(!s.finalLock3&&window.PUZ.solved(FINAL_LOCK3.pz,lockState3)){lockState3=window.PUZ.clone(FINAL_LOCK3.s);lockSel3=0;}play("boss",letterLines(),{wall:"art6/letter-note-before-you-enter.webp",end:bossChoices});}
function showEnding(){const s=st();if(!s)return;const k=endingFor(),E=D.ending[k];s.ending=k;
 const title=()=>{const t=q(".s6t");t.classList.remove("note");t.innerHTML="";t.appendChild(el("div","s6title","Ending: "+E.title));
  t.appendChild(el("div","s6cnt","Puzzles solved: "+(S.rooms().solved.length)+" / "+TOTAL_P+"  ·  Wall art found: "+Object.keys(s.walls).length+" / "+TOTAL_W));
  q(".s6name").style.visibility="hidden";q(".s6pf").className="s6pf none";box.dataset.ending=k;
  btns([["Back to the maze",()=>finish(),"back"]]);};
 const lines=endingLines(k);
 if(lines.length)play("ending",lines,{end:title});
 // A solo death has no speech. play([]) calls done, not end; open a title-only scene without a dummy line.
 else play("ending",[],{done:()=>{build();cur={kind:"ending",L:[],opt:{end:title},i:-1,typing:false,ending:true};
  box.className="s6d on";box.dataset.scene="ending";box.dataset.line="";box.dataset.who="";box.dataset.emo="";
  q(".s6bg").style.backgroundImage="none";q(".s6wall").removeAttribute("src");q(".s6wall").style.display="none";
  document.documentElement.classList.add("s6open");title();}});}
// The note is one-shot; the centre door stays usable after "Not yet".
const door=el("button","ink s4b small","‹ Centre door");door.id="s7door";door.style.cssText="display:none;position:fixed;top:64px;left:12px;z-index:12";document.body.appendChild(door);
door.addEventListener("click",()=>{const s=st();if(!s||S.storyOpen()||S.uiOpen()||S.puzzleOpen()||S.mapOpen())return;if(s.golemDefeated)showEnding();else bossNote();});
setInterval(()=>{const l=live(),p=S.state();door.style.display=l&&Math.abs(p.x-M.centre[0])+Math.abs(p.y-M.centre[1])<=2&&!S.storyOpen()&&!S.uiOpen()&&!S.puzzleOpen()&&!S.mapOpen()?"block":"none";},250);
// ---------- fights: one short line at the start and one at the end, nothing in between ----------
let fightNo=0;
function fightLine(phase,how){const l=live();if(!l)return;const st0=document.querySelector(".s4stage");if(!st0)return;let fl=document.getElementById("s6fl");if(fl)fl.remove();
 const tone=dark()?"dark":"fun",cs=["Q","S","A"].filter(c=>who(c)&&who(c).hp>0);let code=null,text=null;
 if(phase==="end"&&how==="ran"){code=cs[0]||"H";text=D.fight.ran;}else if(phase==="end"&&how!=="win")return;
 else{if(!cs.length)return;code=cs[(fightNo+(phase==="end"?1:0))%cs.length];const pool=D.fight[phase][code][tone];text=pool[fightNo%pool.length];}
 const m=who(code);fl=el("div","s6fl");fl.id="s6fl";fl.dataset.phase=phase;fl.dataset.who=code;const im=el("img","s6flp");im.src="art6/"+(SHEET[m.race]||"knight")+"-"+(phase==="start"?(code==="A"?"angry":"happy"):"happy")+".webp";im.alt="";
 fl.appendChild(im);fl.appendChild(el("span","s6fln",(window.CompanionDisplay?window.CompanionDisplay.displayName(m,live()):m.name)+": "));fl.appendChild(el("span","s6flt",fill(text)));st0.appendChild(fl);
 if(phase==="start"){const bot=document.getElementById("fbot");const hide=()=>{if(fl.dataset.phase==="start")fl.remove();};if(bot)bot.addEventListener("pointerdown",hide,{once:true});setTimeout(hide,3200);}}
H.bossWon=()=>{const s=st();if(s)s.golemDefeated=true;showEnding();};
H.fightStart=()=>{fightNo++;fightLine("start");};
H.fightEnd=how=>{fightLine("end",how);};
window.S6H=H;
S.storyOpen=()=>!!cur;
S.rpg.s6={talkPresent,play,letterReading,letterLines,brunnVer,brunnJoinVersion,LETTER_KEYS,st,who,explored,endingFor,memUnlocked,WALL_ART_ROOMS,PIECES:()=>PIECES.length,DAD_FROM,pieceFor,roomArt:()=>JSON.parse(JSON.stringify(ROOM_ART)),artRooms:()=>WALLS.map(r=>r.id),TOTAL_P,TOTAL_W,MEM_STEP,showEnding,bossNote,open:()=>!!cur,line:()=>cur?{i:cur.i,typing:cur.typing,kind:cur.kind,who:cur.L[cur.i]&&cur.L[cur.i].w}:null,
 finalLock:()=>({pz:window.PUZ.clone(FINAL_LOCK.pz),s:window.PUZ.clone(lockState)}),finalLock2:()=>({pz:window.PUZ.clone(FINAL_LOCK2.pz),s:window.PUZ.clone(lockState2)}),finalLock3:()=>({pz:window.PUZ.clone(FINAL_LOCK3.pz),s:window.PUZ.clone(lockState3),sel:lockSel3}),setSpeed:v=>{speed=v;},queue:()=>queue.length,H,pair,picnicLines,bedsideLines,endingLines};
// styles (portrait only, small name tab)
const css=document.createElement("style");css.textContent=`
.s6d{display:none;position:fixed;inset:0;z-index:45;background:radial-gradient(ellipse at 50% 30%,#241838,#08050e 75%);color:#efe0b8;font:16px Georgia,serif;user-select:none;touch-action:none}
.s6d.on{display:block}
.s6d.camp-scene .s6bg{height:100%;opacity:1;mask-image:none;-webkit-mask-image:none}
.s6d.camp-scene .s6pf{display:none}
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
