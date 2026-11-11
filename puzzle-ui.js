/* Secret of the Adventure - Stage 3 puzzle screen (touch first, ink on parchment). Uses PUZ (puzzles.js) for all rules.
   Leaving keeps the puzzle as it was (kept in memory until the app is closed); Reset goes back to the start. Solutions are never shown. */
(function(){
"use strict";
const S=window.SOTA,P=window.PUZ,M=window.MAZE;
const el=document.getElementById("puz"),board=document.getElementById("pboard"),info=document.getElementById("pinfo"),stat=document.getElementById("pstat"),ttl=document.getElementById("ptitle"),enter=document.getElementById("penter");
const INS=["Turn the mirrors so the light reaches the gem.","Pull levers until every lamp is lit.","Connect the matching pipe outlets.","Slide the blocks so the gold block leaves on the right.","Slide the tiles into order, 1 first, gap last."];
const INS_PIPES="Tap a tile to turn it. Join each numbered pipe’s two outlets with no leaks.";
const INS_SUDOKU="Tap an empty square, then a number. Each row, column, and bold box needs every number once.";
const ZC=[null,"#c9a24a","#7f9a55","#6c8fb5","#b8636a","#8f6db5"];
let cur=null,openFlag=false;const kept=new Map(),gens=new Map();const ft=[];
// parchment background, drawn once
(function(){const c=document.createElement("canvas");c.width=512;c.height=512;const g=c.getContext("2d"),r=P.rng(777);g.fillStyle="#e3cf9f";g.fillRect(0,0,512,512);
 for(let k=0;k<220;k++){const x=r()*512,y=r()*512,s=4+r()*46,gr=g.createRadialGradient(x,y,0,x,y,s);gr.addColorStop(0,r()<.5?"rgba(140,95,40,.08)":"rgba(255,245,215,.12)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(x-s,y-s,2*s,2*s);}
 for(let k=0;k<500;k++){g.fillStyle=`rgba(90,60,25,${r()*.07})`;g.fillRect(r()*512,r()*512,1+r()*24,.8);}
 el.style.backgroundImage=`radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 55%,rgba(80,45,15,.55) 100%),url(${c.toDataURL()})`;})();
// t2759u: a failed Rogue's lockpick doubles the door: TWO new puzzles (same type and zone) must be solved one after the other.
// rounds(id) = puzzles still to solve on a doubled door (0 = a normal door). Each round has its own puzzle and its own kept state.
const GL=()=>S.gearLock||null,rounds=id=>{const g=GL();return g&&g.rounds?g.rounds(id)|0:0;},gk=id=>{const L=rounds(id);return L>0?id+":"+L:id;};
function gen(id){const k=gk(id);if(!gens.has(k)){const r=M.rooms[id],L=rounds(id);gens.set(k,L>0?P.make(r.p,r.z,((r.id+1)*9973+17*r.z+104729*L)>>>0):P.forRoom(r));}return gens.get(k);}
function layout(){const land=innerWidth>innerHeight;el.classList.toggle("land",land);
 const aw=land?innerWidth-300:innerWidth-24,ah=land?innerHeight-20:innerHeight-250;return{aw,ah,land};}
function cellSize(n,extra){const L=layout();return Math.max(44,Math.floor(Math.min(L.aw/(n+extra),L.ah/(n+extra))));}
const svg=(w,h,inner)=>`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="position:absolute;left:0;top:0;pointer-events:none">${inner}</svg>`;
function btn(cls,attrs,html,style){return `<button class="pz ${cls}" ${attrs} style="${style||""}">${html}</button>`;}
function render(){const t0=performance.now();const {pz,s}=cur,done=P.solved(pz,s);let h="";
 if(pz.t===0){const n=pz.n,c=cellSize(n,1.4),pad=Math.round(c*.7),W=n*c+2*pad,tr=P.trace(pz,s),om=new Map();pz.mir.forEach((m,k)=>om.set(m,k));
  const[tx,ty]=pz.tgt.split(",").map(Number);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const k=om.get(y*n+x),st=`left:${pad+x*c}px;top:${pad+y*c}px;width:${c}px;height:${c}px`;
   if(k===undefined)h+=`<div class="pcell" style="${st}"></div>`;
   else{const o=s.o[k],l=o===0?`M${c*.18} ${c*.82} L${c*.82} ${c*.18}`:`M${c*.18} ${c*.18} L${c*.82} ${c*.82}`;
    h+=btn("pmir",`data-mv="${k}" aria-label="Mirror"`,`<svg viewBox="0 0 ${c} ${c}" width="100%" height="100%"><path d="${l}" stroke="#2b1a0e" stroke-width="${c*.16}" stroke-linecap="round"/><path d="${l}" stroke="#cfe6f0" stroke-width="${c*.07}" stroke-linecap="round"/></svg>`,st);}}
  const P2=([x,y])=>`${pad+(x+.5)*c},${pad+(y+.5)*c}`;
  let ln=`<polyline points="${tr.pts.map(P2).join(" ")}" fill="none" stroke="rgba(255,190,60,.9)" stroke-width="${c*.12}" stroke-linejoin="round"/><polyline points="${tr.pts.map(P2).join(" ")}" fill="none" stroke="#fff6c8" stroke-width="${c*.04}"/>`;
  const sx=pad-c*.45,sy=pad+(pz.r+.5)*c;ln+=`<rect x="${sx-c*.22}" y="${sy-c*.22}" width="${c*.44}" height="${c*.44}" fill="#5a3418" stroke="#2b1a0e" stroke-width="2"/><circle cx="${sx+c*.12}" cy="${sy}" r="${c*.1}" fill="#ffd060"/>`;
  const gx=pad+(Math.min(n-1,Math.max(0,tx))+.5)*c+(tx<0?-c*.55:tx>=n?c*.55:0),gy=pad+(Math.min(n-1,Math.max(0,ty))+.5)*c+(ty<0?-c*.55:ty>=n?c*.55:0),gr=c*.24;
  ln+=`<path d="M${gx} ${gy-gr} L${gx+gr} ${gy} L${gx} ${gy+gr} L${gx-gr} ${gy} Z" fill="${done?"#ffe680":"#3aa0a0"}" stroke="#2b1a0e" stroke-width="2.5"/>`;
  h=`<div class="pgrid" style="width:${W}px;height:${W}px;background:${ZC[pz.zone]}33">${h}${svg(W,W,ln)}</div>`;}
 else if(pz.t===1){const lit=P.lamps(pz,s),L=pz.L,c=Math.min(64,Math.max(44,Math.floor((layout().aw-8*L)/L)));
  h+=`<div class="prow">`;for(let i=0;i<L;i++){const on=lit>>i&1;h+=`<div class="plamp ${on?"on":""}" data-lamp="${i}" style="width:${c}px;height:${c}px"><svg viewBox="0 0 40 40" width="100%" height="100%"><path d="M14 8 L26 8 L29 30 L11 30 Z" fill="${on?"#ffd860":"#6b5a44"}" stroke="#2b1a0e" stroke-width="2.5"/><path d="M12 33 L28 33 M20 3 L20 8" stroke="#2b1a0e" stroke-width="3"/></svg></div>`;}
  h+=`</div><div class="prow">`;for(let i=0;i<L;i++){const up=s.p[i];h+=btn("plever",`data-mv="${i}" aria-label="Lever ${i+1}"`,`<svg viewBox="0 0 40 60" width="70%" height="80%"><rect x="8" y="44" width="24" height="10" fill="#5a3418" stroke="#2b1a0e" stroke-width="2.5"/><path d="M20 46 L${up?30:10} 12" stroke="#2b1a0e" stroke-width="5" stroke-linecap="round"/><circle cx="${up?30:10}" cy="12" r="6" fill="#b8402a" stroke="#2b1a0e" stroke-width="2.5"/></svg>`,`width:${c}px;height:${Math.round(c*1.4)}px`);}
  h+=`</div>`;}
 else if(pz.t===2&&pz.mode==='pipes'){const n=pz.n,c=Math.max(32,Math.min(52,Math.floor(Math.min(layout().aw,layout().ah)/(n+1)))),pad=Math.round(c*.5),W=n*c+2*pad,colors=['#276b97','#a2372e','#3b7336','#745195','#8a5b10'];
  for(let i=0;i<s.a.length;i++){const color=colors[pz.pipe[i]],mask=s.a[i];let paths='';[[c/2,0],[c,c/2],[c/2,c],[0,c/2]].forEach(([x,y],d)=>{if(mask&(1<<d))paths+=`M${c/2} ${c/2} L${x} ${y} `;});
   h+=btn('ppipe',`data-mv="${i}" aria-label="Turn pipe ${pz.pipe[i]+1}, row ${(i/n|0)+1}, column ${i%n+1}"`,`<svg viewBox="0 0 ${c} ${c}" width="100%" height="100%"><path d="${paths}" fill="none" stroke="${color}" stroke-width="${c*.18}"/><circle cx="${c/2}" cy="${c/2}" r="${c*.21}" fill="#f3e2b5"/><text x="${c/2}" y="${c*.62}" text-anchor="middle" font-size="${c*.32}" fill="${color}">${pz.pipe[i]+1}</text></svg>`,`left:${pad+i%n*c}px;top:${pad+(i/n|0)*c}px;width:${c}px;height:${c}px`);}
  let ports='';pz.ends.forEach((pair,p)=>pair.forEach(([i,d])=>{const [dx,dy]=[[0,-1],[1,0],[0,1],[-1,0]][d],x=pad+(i%n+.5)*c+dx*c*.7,y=pad+((i/n|0)+.5)*c+dy*c*.7;ports+=`<circle cx="${x}" cy="${y}" r="${c*.21}" fill="${colors[p]}"/><text x="${x}" y="${y+c*.115}" font-size="${c*.3}" text-anchor="middle" fill="white">${p+1}</text>`;}));
  h=`<div class="pgrid" style="width:${W}px;height:${W}px;background:${ZC[pz.zone]}22">${h}${svg(W,W,ports)}</div>`;}
 else if(pz.t===2&&pz.mode==='sudoku'){const n=pz.n,c=Math.max(30,Math.min(44,Math.floor(Math.min(layout().aw-8,layout().ah-116)/n))),W=c*n;
  for(let i=0;i<s.a.length;i++){const x=i%n,y=i/n|0,fixed=!!pz.given[i];h+=btn('pscell'+(fixed?' given':'')+(i===sudokuCell?' selected':'')+(i===sudokuCell&&s.wrong?' conflict':''),`data-cell="${i}" ${fixed?'disabled':''} aria-label="Row ${y+1}, column ${x+1}${fixed?', given':''}${s.a[i]?', '+s.a[i]:', empty'}"`,s.a[i]||'',`left:${x*c}px;top:${y*c}px;width:${c}px;height:${c}px;font-size:${Math.round(c*.52)}px;border-left-width:${x%pz.bw===0?3:1}px;border-top-width:${y%pz.bh===0?3:1}px`);}
  h=`<div class="pgrid psudoku" role="group" aria-label="${n} by ${n} Sudoku" style="width:${W}px;height:${W}px">${h}</div><div class="pskeys">`;
  for(let v=1;v<=n;v++)h+=btn('pskey',`data-value="${v}" aria-label="Enter ${v}"`,v);h+=btn('pskey',`data-value="0" aria-label="Erase cell"`,'⌫')+'</div>';}
 else if(pz.t===3){const n=pz.n,c=Math.max(46,cellSize(n,1.3)),W=n*c;let b="";
  pz.blk.forEach((bk,i)=>{const[x,y]=s.q[i],w=bk.h?bk.len*c:c,hh=bk.h?c:bk.len*c;b+=btn("pblk"+(i===0?" key":"")+(sel===i?" sel":""),`data-blk="${i}" aria-label="Block ${i}"`,"",`left:${x*c+1}px;top:${y*c+1}px;width:${w-2}px;height:${hh-2}px`);});
  const ex=`<div class="pexit" style="left:${W}px;top:${pz.r*c}px;height:${c}px;width:${Math.round(c*.3)}px"></div>`;
  h=`<div class="pgrid pblocks" style="width:${W}px;height:${W}px;background-size:${c}px ${c}px;background-color:${ZC[pz.zone]}33">${b}${ex}</div><div class="parrows">${btn("parr",`data-dir="-1" aria-label="Move back"`,sel>=0&&!pz.blk[sel].h?"\u25B2":"\u25C0")}${btn("parr",`data-dir="1" aria-label="Move on"`,sel>=0&&!pz.blk[sel].h?"\u25BC":"\u25B6")}</div>`;}
 else if(pz.t===4){const n=pz.n,c=cellSize(n,0.6),W=n*c;
  s.a.forEach((v,p)=>{const x=p%n,y=(p/n)|0;if(v)h+=btn("ptile",`data-mv="${p}"`,v,`left:${x*c+2}px;top:${y*c+2}px;width:${c-4}px;height:${c-4}px;font-size:${Math.round(c*.42)}px`);});
  h=`<div class="pgrid" style="width:${W}px;height:${W}px;background:${ZC[pz.zone]}55">${h}</div>`;}
 board.innerHTML=h;board.classList.toggle("done",done);el.classList.toggle("solved",done);
 stat.textContent=done?"Solved! The door is open.":(s.wrong?"Not right. Try again.":"");stat.classList.toggle("bad",!!s.wrong&&!done);
 enter.style.display=done?"block":"none";el.dataset.solved=done?"1":"0";el.dataset.type=pz.t;el.dataset.mode=pz.mode||"";el.classList.toggle("content2",pz.t===2);el.dataset.room=cur.id;
 ft.push(performance.now()-t0);if(ft.length>200)ft.shift();}
let sel=-1,sudokuCell=-1;
function move(mv){if(!cur||P.solved(cur.pz,cur.s))return;cur.s=P.apply(cur.pz,cur.s,mv);kept.set(gk(cur.id),cur.s);if(P.solved(cur.pz,cur.s)&&doubleNext())return;if(P.solved(cur.pz,cur.s)){S.markSolved(cur.id);const id=cur.id;close();if(S.enterDoor)S.enterDoor(id);return;}render();}
// t2759u doubled door: after round 1 of 2 the next puzzle opens (true); after the last round the door opens as normal (false)
function doubleNext(){const id=cur.id;if(!(rounds(id)>0))return false;GL().solvedRound(id);if(!(rounds(id)>0))return false;open(id,cur.cmd);stat.textContent="One down! Solve one more to open the door.";return true;}
board.addEventListener("pointerdown",e=>{const b=e.target.closest("button");if(!b||!cur)return;e.preventDefault();
 if(b.dataset.cell!==undefined){if(!cur.pz.given[+b.dataset.cell])sudokuCell=+b.dataset.cell;render();return;}
 if(b.dataset.value!==undefined){if(sudokuCell>=0)move([sudokuCell,+b.dataset.value]);return;}
 if(b.dataset.blk!==undefined){sel=+b.dataset.blk;render();return;}
 if(b.dataset.dir!==undefined){if(sel>=0)move([sel,+b.dataset.dir]);return;}
 if(b.dataset.mv!==undefined){const v=b.dataset.mv;move(v==="clr"?"clr":+v);}});
function open(id,cmd){const g=gen(id);cur={id,cmd,pz:g.pz,s:kept.get(gk(id))||P.clone(g.s),start:g.s};sel=cur.pz.t===3?0:-1;sudokuCell=-1;openFlag=true;el.classList.add("open");
 ttl.textContent=(cur.pz.t===2?(cur.pz.mode==="pipes"?"Pipe connections":"Sudoku"):P.NAMES[cur.pz.t])+" \u00B7 Zone "+cur.pz.zone;info.textContent=cur.pz.t===2?(cur.pz.mode==="pipes"?INS_PIPES:INS_SUDOKU):INS[cur.pz.t];
 const L=rounds(id);if(L>0)ttl.textContent+=" \u00B7 Double ("+(GL().total-L+1)+" of "+GL().total+")";el.dataset.double=L;lockBtn();render();}
// t2759u Rogue's lockpick on this door: only a rogue hero carrying one, on a normal (not doubled, not solved) room door. Never the boss door
// (the boss locks are story.js FINAL_LOCK puzzles, not room puzzles, so they never open this screen).
let lockB=null;function lockBtn(){const g=GL(),ok=!!(cur&&g&&g.can&&g.can(cur.id)&&!P.solved(cur.pz,cur.s));
 if(!lockB&&ok&&document.createElement){lockB=document.createElement("button");lockB.id="plock";lockB.className="pz plock";lockB.textContent="\u{1F5DD}\uFE0F Use Rogue's lockpick";lockB.style.cssText="position:absolute;left:50%;transform:translateX(-50%);bottom:10px;min-height:44px;padding:0 14px;font:700 16px Georgia,serif;border-radius:12px 9px 13px 8px;z-index:3";
  lockB.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();if(!cur)return;const id=cur.id,r=GL().use(id);if(!r||!r.ok)return;
   if(r.pass){S.markSolved(id);close();if(S.enterDoor)S.enterDoor(id);}else open(id,cur.cmd);});el.appendChild(lockB);}
 if(lockB)lockB.style.display=ok?"block":"none";el.dataset.lockpick=ok?"1":"0";}
function close(){openFlag=false;el.classList.remove("open");cur=null;if(lockB)lockB.style.display="none";}
const tap=(id,f)=>{const b=document.getElementById(id);b.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();f();});};
tap("pclose",close);
tap("preset",()=>{if(cur&&!P.solved(cur.pz,cur.s)){cur.s=P.clone(cur.start);kept.delete(gk(cur.id));sel=cur.pz.t===3?0:-1;sudokuCell=-1;render();}});
tap("penter",()=>{if(!cur)return;const id=cur.id;close();if(S.enterDoor)S.enterDoor(id);});
window.addEventListener("keydown",e=>{if(!openFlag)return;if(e.key==="Escape"){e.preventDefault();close();}
 else if(cur&&cur.pz.t===2&&cur.pz.mode==="sudoku"&&sudokuCell>=0&&(/^[1-9]$/.test(e.key)||["Backspace","Delete"].includes(e.key))){e.preventDefault();e.stopPropagation();move([sudokuCell,/^[1-9]$/.test(e.key)?+e.key:0]);}else if(cur&&cur.pz.t===3&&sel>=0&&/^Arrow/.test(e.key)){e.preventDefault();e.stopPropagation();move([sel,/Left|Up/.test(e.key)?-1:1]);}},true);
window.addEventListener("resize",()=>{if(openFlag)render();});
const css=document.createElement("style");css.textContent=`
#puz.content2{overflow:auto;touch-action:pan-y}
.ppipe,.pscell{position:absolute;box-sizing:border-box;border-radius:2px}
.pscell{font-weight:400;background:#f4e7c8;box-shadow:none}
.pscell.given{font-weight:700;background:#dfcea8;color:#34281e;opacity:1}
.pscell.selected{background:#c4dcf0;outline:3px solid #276b97;outline-offset:-4px;z-index:1}
.pscell.conflict{color:#a12119;background:#f0c5b7}
.pskeys{display:grid;grid-template-columns:repeat(5,44px);gap:5px;margin-top:5px}
.pskey{width:44px;height:44px;font-size:22px;border-radius:6px}
#puz.land.content2 #pboard{flex-direction:row;align-items:center;gap:8px}
#puz.land.content2 .pskeys{grid-template-columns:repeat(2,44px)}
`;document.head.appendChild(css);
S.puzzleOpen=()=>openFlag;S.openPuzzle=open;S.puzzleRefresh=()=>{if(cur)lockBtn();};
S.puzzle={open:id=>open(id,null),close,state:()=>cur?{id:cur.id,type:cur.pz.t,solved:P.solved(cur.pz,cur.s)}:null,frameTimes:()=>ft.slice(),renderOnce:()=>{const t=performance.now();render();return performance.now()-t;}};
})();
