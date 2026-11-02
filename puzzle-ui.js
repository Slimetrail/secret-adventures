/* Secret of the Adventures - Stage 3 puzzle screen (touch first, ink on parchment). Uses PUZ (puzzles.js) for all rules.
   Leaving keeps the puzzle as it was (kept in memory until the app is closed); Reset goes back to the start. Solutions are never shown. */
(function(){
"use strict";
const S=window.SOTA,P=window.PUZ,M=window.MAZE;
const el=document.getElementById("puz"),board=document.getElementById("pboard"),info=document.getElementById("pinfo"),stat=document.getElementById("pstat"),ttl=document.getElementById("ptitle"),enter=document.getElementById("penter");
const INS=["Turn the mirrors so the light reaches the gem.","Pull levers until every lamp is lit.","Pick the right answer.","Slide the blocks so the gold block leaves on the right.","Slide the tiles into order, 1 first, gap last."];
const INS_CODE="Find the code. \u25CF = right number, right place. \u25CB = right number, wrong place.";
const ZC=[null,"#c9a24a","#7f9a55","#6c8fb5","#b8636a","#8f6db5"];
let cur=null,openFlag=false;const kept=new Map(),gens=new Map();const ft=[];
// parchment background, drawn once
(function(){const c=document.createElement("canvas");c.width=512;c.height=512;const g=c.getContext("2d"),r=P.rng(777);g.fillStyle="#e3cf9f";g.fillRect(0,0,512,512);
 for(let k=0;k<220;k++){const x=r()*512,y=r()*512,s=4+r()*46,gr=g.createRadialGradient(x,y,0,x,y,s);gr.addColorStop(0,r()<.5?"rgba(140,95,40,.08)":"rgba(255,245,215,.12)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(x-s,y-s,2*s,2*s);}
 for(let k=0;k<500;k++){g.fillStyle=`rgba(90,60,25,${r()*.07})`;g.fillRect(r()*512,r()*512,1+r()*24,.8);}
 el.style.backgroundImage=`radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 55%,rgba(80,45,15,.55) 100%),url(${c.toDataURL()})`;})();
function gen(id){if(!gens.has(id))gens.set(id,P.forRoom(M.rooms[id]));return gens.get(id);}
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
 else if(pz.t===2&&pz.mode==="riddle"){const q=pz.q[Math.min(s.step,pz.q.length-1)];
  h+=`<div class="pq">${done?"":`<div class="pstep">Riddle ${s.step+1} of ${pz.q.length}</div>`}${done?"":q.text}</div><div class="popts">`;
  if(!done)q.opts.forEach((o,i)=>{h+=btn("popt",`data-mv="${i}"`,o);});h+=`</div>`;}
 else if(pz.t===2){h+=`<div class="pclues">`;pz.clues.forEach(cl=>{h+=`<div class="pclue">${cl.g.map(d=>`<span class="pdig">${d}</span>`).join("")}<span class="pfb">${"\u25CF".repeat(cl.a)}${"\u25CB".repeat(cl.b)}${cl.a+cl.b?"":"\u2014"}</span></div>`;});
  h+=`</div><div class="pentry">`;for(let i=0;i<pz.len;i++)h+=`<span class="pdig big">${s.e[i]||(done?"":"")}</span>`;h+=`</div><div class="pkeys">`;
  for(let d=1;d<=pz.digits;d++)h+=btn("pkey "+(s.e.includes(d)?"used":""),`data-mv="${d}"`,d);h+=btn("pkey",`data-mv="clr" aria-label="Clear"`,"\u232B")+`</div>`;}
 else if(pz.t===3){const n=pz.n,c=Math.max(46,cellSize(n,1.3)),W=n*c;let b="";
  pz.blk.forEach((bk,i)=>{const[x,y]=s.q[i],w=bk.h?bk.len*c:c,hh=bk.h?c:bk.len*c;b+=btn("pblk"+(i===0?" key":"")+(sel===i?" sel":""),`data-blk="${i}" aria-label="Block ${i}"`,"",`left:${x*c+1}px;top:${y*c+1}px;width:${w-2}px;height:${hh-2}px`);});
  const ex=`<div class="pexit" style="left:${W}px;top:${pz.r*c}px;height:${c}px;width:${Math.round(c*.3)}px"></div>`;
  h=`<div class="pgrid pblocks" style="width:${W}px;height:${W}px;background-size:${c}px ${c}px;background-color:${ZC[pz.zone]}33">${b}${ex}</div><div class="parrows">${btn("parr",`data-dir="-1" aria-label="Move back"`,sel>=0&&!pz.blk[sel].h?"\u25B2":"\u25C0")}${btn("parr",`data-dir="1" aria-label="Move on"`,sel>=0&&!pz.blk[sel].h?"\u25BC":"\u25B6")}</div>`;}
 else if(pz.t===4){const n=pz.n,c=cellSize(n,0.6),W=n*c;
  s.a.forEach((v,p)=>{const x=p%n,y=(p/n)|0;if(v)h+=btn("ptile",`data-mv="${p}"`,v,`left:${x*c+2}px;top:${y*c+2}px;width:${c-4}px;height:${c-4}px;font-size:${Math.round(c*.42)}px`);});
  h=`<div class="pgrid" style="width:${W}px;height:${W}px;background:${ZC[pz.zone]}55">${h}</div>`;}
 board.innerHTML=h;board.classList.toggle("done",done);el.classList.toggle("solved",done);
 stat.textContent=done?"Solved! The door is open.":(s.wrong?"Not right. Try again.":"");stat.classList.toggle("bad",!!s.wrong&&!done);
 enter.style.display=done?"block":"none";el.dataset.solved=done?"1":"0";el.dataset.type=pz.t;el.dataset.room=cur.id;
 ft.push(performance.now()-t0);if(ft.length>200)ft.shift();}
let sel=-1;
function move(mv){if(!cur||P.solved(cur.pz,cur.s))return;cur.s=P.apply(cur.pz,cur.s,mv);kept.set(cur.id,cur.s);if(P.solved(cur.pz,cur.s))S.markSolved(cur.id);render();}
board.addEventListener("pointerdown",e=>{const b=e.target.closest("button");if(!b||!cur)return;e.preventDefault();
 if(b.dataset.blk!==undefined){sel=+b.dataset.blk;render();return;}
 if(b.dataset.dir!==undefined){if(sel>=0)move([sel,+b.dataset.dir]);return;}
 if(b.dataset.mv!==undefined){const v=b.dataset.mv;move(v==="clr"?"clr":+v);}});
function open(id,cmd){const g=gen(id);cur={id,cmd,pz:g.pz,s:kept.get(id)||P.clone(g.s),start:g.s};sel=cur.pz.t===3?0:-1;openFlag=true;el.classList.add("open");
 ttl.textContent=P.NAMES[cur.pz.t]+" \u00B7 Zone "+cur.pz.zone;info.textContent=cur.pz.t===2&&cur.pz.mode==="code"?INS_CODE:INS[cur.pz.t];render();}
function close(){openFlag=false;el.classList.remove("open");cur=null;}
const tap=(id,f)=>{const b=document.getElementById(id);b.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();f();});};
tap("pclose",close);
tap("preset",()=>{if(cur&&!P.solved(cur.pz,cur.s)){cur.s=P.clone(cur.start);kept.delete(cur.id);sel=cur.pz.t===3?0:-1;render();}});
tap("penter",()=>{if(!cur)return;const c=cur.cmd;close();if(c)S.act(c);});
window.addEventListener("keydown",e=>{if(!openFlag)return;if(e.key==="Escape"){e.preventDefault();close();}
 else if(cur&&cur.pz.t===2&&cur.pz.mode==="code"&&/^[1-9]$/.test(e.key)){move(+e.key);}else if(cur&&cur.pz.t===3&&sel>=0&&/^Arrow/.test(e.key)){e.preventDefault();e.stopPropagation();move([sel,/Left|Up/.test(e.key)?-1:1]);}},true);
window.addEventListener("resize",()=>{if(openFlag)render();});
S.puzzleOpen=()=>openFlag;S.openPuzzle=open;
S.puzzle={open:id=>open(id,null),close,state:()=>cur?{id:cur.id,type:cur.pz.t,solved:P.solved(cur.pz,cur.s)}:null,frameTimes:()=>ft.slice(),renderOnce:()=>{const t=performance.now();render();return performance.now()-t;}};
})();
