/* Secret of the Adventure - Stage 1+2: maze engine, first-person 3D view, visited cells + trail (map in map.js). Private build, no ads, no network. */
(function(){
"use strict";
const M=window.MAZE,TX=window.TEX,N=M.n,G=2*N+1,TS=TX.S;
const SAVE_KEY="sota.stage1.save";
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]],BIT=[1,2,4,8],FN=["N","E","S","W"];
const mask=new Uint8Array(N*N),zoneOf=new Uint8Array(N*N);
for(let i=0;i<N*N;i++){mask[i]=parseInt(M.mask[i],16);zoneOf[i]=+M.zone[i];}
const contentCap=window.SOTA_CONTENT_CAP.create(N,zoneOf);
// block grid: cells at odd coords, walls between
const solid=new Uint8Array(G*G).fill(1),bzone=new Uint8Array(G*G);
for(let y=0;y<N;y++)for(let x=0;x<N;x++){const m=mask[y*N+x],bx=2*x+1,by=2*y+1;solid[by*G+bx]=0;if(m&2)solid[by*G+bx+1]=0;if(m&4)solid[(by+1)*G+bx]=0;}
for(let by=0;by<G;by++)for(let bx=0;bx<G;bx++){const cx=Math.min(N-1,Math.max(0,(bx-1)>>1)),cy=Math.min(N-1,Math.max(0,(by-1)>>1));bzone[by*G+bx]=zoneOf[cy*N+cx];}
// small floor markers for taverns, camps, rooms
const mark=new Int32Array(N*N).fill(-1);
const MK={tavern:[255,200,90],camp:[255,130,50],treasure:[90,230,210],monster:[255,70,90],story:[235,235,255]};
const mkList=[],mkKind=[];function addMark(c,k){mark[c[1]*N+c[0]]=mkList.length;mkList.push(MK[k]);mkKind.push(k);}
// t2562u: the orange floor circle is only at camps. Taverns and archway seams never get a circle.
M.rooms.forEach(r=>addMark(r.c,r.k));M.camps.forEach(c=>addMark(c,"camp"));
// ---------- t2528u-t2539u: shared tavern archway on each zone seam ----------
// Each seam is the one maze edge between a seam tavern cell and the next zone (found from zoneOf, never typed in).
// The archway is the connector block on that edge (like a puzzle door): never standable, acts as a wall, bumping or tapping it opens the tavern.
// The maze mask is unchanged, so saved trails stay valid; leaving by a zone tab is one normal step across the edge.
const SEAM_TAVERNS=[0,1,2,3];/* t2667u: seams 3-4 (Tavern 3, 51,14|51,15) and 4-5 (Tavern 4, 47,48|46,48). Zone 5 stays closed: its Zone 5 tab shows the wait text */
const SEAMS=[],archB=new Int8Array(G*G).fill(-1),seamEdge=new Int8Array(N*N*4).fill(-1),seamSide=new Int8Array(N*N).fill(-1);
SEAM_TAVERNS.forEach(t=>{const c=M.taverns[t];if(!c)return;const ci=c[1]*N+c[0],m=mask[ci];
 for(let d=0;d<4;d++){if(!(m&BIT[d]))continue;const nx=c[0]+DIRS[d][0],ny=c[1]+DIRS[d][1],ni=ny*N+nx;if(zoneOf[ni]===zoneOf[ci])continue;
  const za=zoneOf[ci],zb=zoneOf[ni],lo=za<zb?{x:c[0],y:c[1],d}:{x:nx,y:ny,d:(d+2)%4},hi=za<zb?{x:nx,y:ny,d:(d+2)%4}:{x:c[0],y:c[1],d};
  const away=s=>{const mm=mask[s.y*N+s.x],o=(s.d+2)%4;for(const k of [o,(s.d+3)%4,(s.d+1)%4])if(mm&BIT[k])return k;return o;};
  const k=SEAMS.length,bx=2*c[0]+1+DIRS[d][0],by=2*c[1]+1+DIRS[d][1];
  SEAMS.push({t,bx,by,prev:{x:lo.x,y:lo.y,toArch:lo.d,f:away(lo),zone:Math.min(za,zb)},next:{x:hi.x,y:hi.y,toArch:hi.d,f:away(hi),zone:Math.max(za,zb)}});
  archB[by*G+bx]=k;seamEdge[(lo.y*N+lo.x)*4+lo.d]=k;seamEdge[(hi.y*N+hi.x)*4+hi.d]=k;seamSide[lo.y*N+lo.x]=k;seamSide[hi.y*N+hi.x]=k;break;}});
function archAhead(x,y,d){return seamEdge[(y*N+x)*4+d];}
// archway texture: per-texture size (64 or 128), alpha = glow mask, stone tinted per zone of the PLAYER (t2558u)
const ARCH={size:0,src:"",base:null,tint:[null],mode:"none",mask:"",tints:"",ready:false};
const ARCH_SETS=[{size:128,tex:"art6/seam/archway-tavern-128.png",glow:"art6/seam/archway-tavern-glow-128.png",mask:"art6/seam/archway-stone-mask-128.png"},
 {size:64,tex:"art6/seam/archway-tavern-64.png",glow:"art6/seam/archway-tavern-glow-64.png",mask:"art6/seam/archway-stone-mask-64.png"}];
const ARCH_TINTS="art6/seam/tints.json";
function lum(r,g,b){return 0.299*r+0.587*g+0.114*b;}
function wallLuma(z){const ws=TX.walls[z];let s=0,n=0;for(const w of ws)for(let i=0;i<w.length;i+=4){s+=lum(w[i],w[i+1],w[i+2]);n++;}return s/n;}
// fallback when tints.json is missing: remap stone to the zone palette from tex.js (ink -> c1 -> c2 by luminance), luminance matched and lifted toward the zone walls
function paletteTint(base,msk,z,size){const P=TX.pal&&TX.pal[z],o=new Uint8ClampedArray(base);if(!P)return o;let sl=0,sn=0;
 for(let i=0;i<size*size;i++)if(msk[i]>=128){sl+=lum(base[i*4],base[i*4+1],base[i*4+2]);sn++;}if(!sn)return o;const sm=sl/sn,lift=Math.max(1,Math.min(1.35,1+0.5*(wallLuma(z)/sm-1)));
 for(let i=0;i<size*size;i++){if(msk[i]<128)continue;const L=lum(base[i*4],base[i*4+1],base[i*4+2]),q=Math.max(0,Math.min(1,L/(2*sm)));
  const c=q<0.5?P.ink.map((v,j)=>v+(P.c1[j]-v)*(q*2)):P.c1.map((v,j)=>v+(P.c2[j]-v)*((q-0.5)*2)),cl=lum(c[0],c[1],c[2])||1,k=L*lift/cl;
  o[i*4]=c[0]*k;o[i*4+1]=c[1]*k;o[i*4+2]=c[2]*k;}return o;}
// tints.json (Graphics): if mask==255: out = clamp(round(rgb*mul*lift + add)) per channel, else out = rgb (add is optional, r3+)
function jsonTint(base,msk,zt,size){const o=new Uint8ClampedArray(base),mul=zt.mul,lf=zt.lift,ad=Array.isArray(zt.add)&&zt.add.length===3?zt.add:[0,0,0];
 for(let i=0;i<size*size;i++){if(msk[i]!==255)continue;for(let j=0;j<3;j++)o[i*4+j]=Math.round(base[i*4+j]*mul[j]*lf+ad[j]);}return o;}
function buildArch(set,rgb,glow,msk,tints){const n=set.size*set.size,base=new Uint8ClampedArray(n*4);
 for(let i=0;i<n;i++){base[i*4]=rgb[i*4];base[i*4+1]=rgb[i*4+1];base[i*4+2]=rgb[i*4+2];base[i*4+3]=glow?glow[i*4]:0;}
 ARCH.size=set.size;ARCH.src=set.tex;ARCH.base=base;ARCH.tint=[null];ARCH.mask=msk?set.mask:"";ARCH.tints=msk&&tints?ARCH_TINTS:"";
 let m1=null;if(msk){m1=new Uint8Array(n);for(let i=0;i<n;i++)m1[i]=msk[i*4];}
 ARCH.mode=!m1?"untinted":(tints&&tints.zones?"tints.json":"palette");
 for(let z=1;z<=5;z++){if(!m1){ARCH.tint.push(base);continue;}const zt=tints&&tints.zones&&tints.zones[z];ARCH.tint.push(zt&&Array.isArray(zt.mul)&&zt.mul.length===3&&zt.lift>0?jsonTint(base,m1,zt,set.size):paletteTint(base,m1,z,set.size));}
 ARCH.ready=true;}
function loadImgData(src){return new Promise(res=>{if(typeof Image!=="function"){res(null);return;}const im=new Image();im.onload=()=>{try{const c=document.createElement("canvas");c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext("2d");g.drawImage(im,0,0);res({w:c.width,h:c.height,d:g.getImageData(0,0,c.width,c.height).data});}catch(e){res(null);}};im.onerror=()=>res(null);im.src=src;});}
const archLoad=(async function(){try{
 let tints=null;if(typeof fetch==="function"){try{const r=await fetch(ARCH_TINTS);if(r.ok)tints=await r.json();}catch(e){tints=null;}}
 for(const set of ARCH_SETS){const t=await loadImgData(set.tex);if(!t||t.w!==set.size||t.h!==set.size)continue;
  const g=await loadImgData(set.glow),mk=await loadImgData(set.mask);
  buildArch(set,t.d,g&&g.w===set.size?g.d:null,mk&&mk.w===set.size?mk.d:null,tints);return true;}
 }catch(e){}return false;})();
// floor-sprite art: the camp Safe post (64x64, real 0/255 alpha, bottom-centre anchor, 64 px = one wall height)
const POST={size:0,d:null};loadImgData("art6/seam/safe-post-64.png").then(t=>{if(t&&t.w===t.h){POST.size=t.w;POST.d=t.d;}});
// small ambient lift for floor sprites so the unlit painted wood is not darker than the zone's walls (which also glow); light is never baked in
const SPRITE_LIFT=[0,0.20,0.10,0.10,0.10,0.10];/* measured: zone 1 walls glow brightest (seams-run/tools/lift.py) */
// zone atmosphere: fog colour, fog density, torch tint, ambient, glow
const ZA=[null,
 {fog:[78,58,30],fd:0.13,tint:[1.12,0.98,0.78],amb:0.10,glow:1.0},
 {fog:[22,52,36],fd:0.15,tint:[0.95,1.05,0.82],amb:0.09,glow:1.0},
 {fog:[36,62,100],fd:0.12,tint:[0.85,0.97,1.15],amb:0.12,glow:1.3},
 {fog:[72,22,30],fd:0.14,tint:[1.2,0.85,0.72],amb:0.09,glow:1.7},
 {fog:[46,20,78],fd:0.14,tint:[1.0,0.82,1.2],amb:0.10,glow:2.0}];
// ---------- Stage 3: locked rooms ----------
const roomAt=new Int16Array(N*N).fill(-1);M.rooms.forEach(r=>{roomAt[r.c[1]*N+r.c[0]]=r.id;});
const NR=M.rooms.length,solvedR=new Uint8Array(NR),clearedR=new Uint8Array(NR),ROOM_KEY="sota.rooms";
try{const o=JSON.parse(localStorage.getItem(ROOM_KEY)||"null");if(o&&Array.isArray(o.s)&&Array.isArray(o.c)&&o.s.every(i=>Number.isInteger(i)&&i>=0&&i<NR)&&o.c.every(i=>Number.isInteger(i)&&i>=0&&i<NR)){o.s.forEach(i=>solvedR[i]=1);o.c.forEach(i=>{if(solvedR[i])clearedR[i]=1;});}}catch(e){}
function saveRooms(){const s=[],c=[];for(let i=0;i<NR;i++){if(solvedR[i])s.push(i);if(clearedR[i])c.push(i);}try{localStorage.setItem(ROOM_KEY,JSON.stringify({s,c}));}catch(e){}}
// connector blocks next to a room cell become doors while the room is locked
const doorRoom=new Int16Array(G*G).fill(-1);M.rooms.forEach(r=>{const bx=2*r.c[0]+1,by=2*r.c[1]+1,m=mask[r.c[1]*N+r.c[0]];if(m&1)doorRoom[(by-1)*G+bx]=r.id;if(m&2)doorRoom[by*G+bx+1]=r.id;if(m&4)doorRoom[(by+1)*G+bx]=r.id;if(m&8)doorRoom[by*G+bx-1]=r.id;});
function locked(id){return id>=0&&!solvedR[id];}
// ---------- state ----------
const st={x:M.entrance[0],y:M.entrance[1],f:0};
function canMove(x,y,d){return (mask[y*N+x]&BIT[d])!==0;}
// Stage 2: visited cells (bitset, saved as hex) and the walked trail (start cell + one char 0-3 per step, last TRAIL_CAP steps kept)
const TRAIL_CAP=4000,visited=new Uint8Array(N*N);let trail=[],visCount=0;
function visit(i){if(!visited[i]){visited[i]=1;visCount++;}}
let saved=null;try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");}catch(e){saved=null;}
if(saved&&typeof saved==="object"&&saved.x>=0&&saved.x<N&&saved.y>=0&&saved.y<N&&saved.f>=0&&saved.f<4&&(saved.x|0)===saved.x&&(saved.y|0)===saved.y&&(saved.f|0)===saved.f)Object.assign(st,{x:saved.x,y:saved.y,f:saved.f});
else saved=null;
(function loadMap(){ // any bad part: start the map fresh from the current cell (never crash)
 try{if(!saved||typeof saved.v!=="string"||saved.v.length!==Math.ceil(N*N/4)||!/^[0-9a-f]+$/.test(saved.v)||typeof saved.t!=="object"||!saved.t)throw 0;
  const tv=new Uint8Array(N*N);let c=0;for(let i=0;i<N*N;i++){if((parseInt(saved.v[i>>2],16)>>(i&3))&1){tv[i]=1;c++;}}
  const s0=saved.t.s,ms=saved.t.m;if(!(s0>=0&&s0<N*N&&(s0|0)===s0)||typeof ms!=="string"||ms.length>TRAIL_CAP||!/^[0-3]*$/.test(ms))throw 0;
  let x=s0%N,y=(s0/N)|0;const tr=[s0];for(const ch of ms){const d=+ch;if(!canMove(x,y,d))throw 0;x+=DIRS[d][0];y+=DIRS[d][1];tr.push(y*N+x);}
  if(x!==st.x||y!==st.y)throw 0;for(const i of tr)if(!tv[i])throw 0;
  visited.set(tv);visCount=c;trail=tr;}
 catch(e){visited.fill(0);visCount=0;trail=[st.y*N+st.x];}
 visit(st.y*N+st.x);})();
function enc(){let h="";for(let i=0;i<N*N;i+=4){let v=0;for(let k=0;k<4;k++)if(i+k<N*N&&visited[i+k])v|=1<<k;h+=v.toString(16);}
 let m="";for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i],dx=b%N-a%N,dy=((b/N)|0)-((a/N)|0);m+=DIRS.findIndex(d=>d[0]===dx&&d[1]===dy);}
 return {v:h,t:{s:trail[0],m}};}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(Object.assign({x:st.x,y:st.y,f:st.f},enc())));}catch(e){}}
function mazeSnap(){return Object.assign({x:st.x,y:st.y,f:st.f},enc());}
function poseAt(x,y,f){st.x=x;st.y=y;st.f=f;vis.x=x;vis.y=y;vis.a=f*Math.PI/2;anim.on=false;const z=ZA[zoneOf[y*N+x]].fog;fogNow[0]=z[0];fogNow[1]=z[1];fogNow[2]=z[2];}
function applyMaze(snap){
  if(snap&&typeof snap==="object"&&snap.x>=0&&snap.x<N&&snap.y>=0&&snap.y<N&&snap.f>=0&&snap.f<4&&(snap.x|0)===snap.x&&(snap.y|0)===snap.y&&(snap.f|0)===snap.f){
    poseAt(snap.x,snap.y,snap.f);
    try{if(typeof snap.v!=="string"||snap.v.length!==Math.ceil(N*N/4)||!/^[0-9a-f]+$/.test(snap.v)||typeof snap.t!=="object"||!snap.t)throw 0;
     const tv=new Uint8Array(N*N);let c=0;for(let i=0;i<N*N;i++){if((parseInt(snap.v[i>>2],16)>>(i&3))&1){tv[i]=1;c++;}}
     const s0=snap.t.s,ms=snap.t.m;if(!(s0>=0&&s0<N*N&&(s0|0)===s0)||typeof ms!=="string"||ms.length>TRAIL_CAP||!/^[0-3]*$/.test(ms))throw 0;
     let x=s0%N,y=(s0/N)|0;const tr=[s0];for(const ch of ms){const d=+ch;if(!canMove(x,y,d))throw 0;x+=DIRS[d][0];y+=DIRS[d][1];tr.push(y*N+x);}
     if(x!==st.x||y!==st.y)throw 0;for(const i of tr)if(!tv[i])throw 0;
     visited.set(tv);visCount=c;trail=tr;visit(st.y*N+st.x);}
    catch(e){visited.fill(0);visCount=0;trail=[st.y*N+st.x];visit(st.y*N+st.x);}
  }else{poseAt(M.entrance[0],M.entrance[1],0);visited.fill(0);visCount=0;trail=[st.y*N+st.x];visit(st.y*N+st.x);}
  save();updHud();if(window.SOTA&&SOTA.resetMapLayer)SOTA.resetMapLayer();if(window.SOTA&&SOTA.onStep)SOTA.onStep();}
function resetRun(){setMazeSlots([null,null,null,null]);if(window.SOTA&&SOTA.rpg&&SOTA.rpg.clearMazeSlots)SOTA.rpg.clearMazeSlots();poseAt(M.entrance[0],M.entrance[1],0);visited.fill(0);visCount=0;trail=[st.y*N+st.x];visit(st.y*N+st.x);
 solvedR.fill(0);clearedR.fill(0);try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(ROOM_KEY);}catch(e){}
 save();saveRooms();updHud();if(window.SOTA&&SOTA.resetMapLayer)SOTA.resetMapLayer();if(window.SOTA&&SOTA.onStep)SOTA.onStep();}
function stepped(){const i=st.y*N+st.x;visit(i);trail.push(i);if(trail.length>TRAIL_CAP+1)trail.splice(0,trail.length-TRAIL_CAP-1);if(window.SOTA&&SOTA.onStep)SOTA.onStep();}
// Item boxes are shortcuts to real party bag copies, never a second inventory.
// t2437u: Healing potion and Mana potion (ether) show as an original 8-bit bottle (red / blue) instead of their name; the name stays in aria-label and title.
const BOTTLE=["....KKKK....","....KCCK....","....KCCK....","...KKKKKK...","....KGGK....","...KGGGGK...","..KLLLLLLK..",".KLWLLLLLDK.",".KLWLLLLLDK.",".KLLLLLLLDK.",".KLLLLLLLDK.",".KDLLLLLDDK.","..KDDDDDDK..","...KKKKKK..."];
const BOTTLE_COL={potion:{L:"#d8343a",D:"#8e1b22",W:"#ffd2c8"},ether:{L:"#3a6ee0",D:"#1d3b8e",W:"#d6e4ff"}};
function bottleSvg(id){const p=Object.assign({K:"#2b1a0e",C:"#9a6a3a",G:"#d9eef0"},BOTTLE_COL[id]);let r="";BOTTLE.forEach((row,y)=>[...row].forEach((ch,x)=>{if(p[ch])r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+p[ch]+'"/>';}));
 return '<svg class="pbottle" data-bottle="'+id+'" viewBox="0 0 12 14" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>';}
const ITEM_KEY="sota.items";let items=[null,null,null,null];
function setMazeSlots(bindings){const next=Array.from({length:4},(_,i)=>typeof bindings[i]==="string"?bindings[i]:null);
 const changed=next.some((id,i)=>id!==items[i]);items=next;
 try{if(changed||localStorage.getItem(ITEM_KEY)!==JSON.stringify(items))localStorage.setItem(ITEM_KEY,JSON.stringify(items));}catch(e){}
 document.querySelectorAll("#slots .slot").forEach((b,i)=>{const id=items[i],it=id&&window.RPG&&window.RPG.ITEMS[id],name=it?it.n:"";
  /* t2476u: every item shows its own 8-bit icon with its name under it (potions keep the t2437u bottles) */
  const icon=id&&(BOTTLE_COL[id]||(window.SOTA_ICONS&&SOTA_ICONS.has(id)))?id:"";if(icon){if(b.getAttribute("data-icon")!==icon){b.innerHTML=(BOTTLE_COL[icon]?bottleSvg(icon):SOTA_ICONS.svg(icon))+'<span class="slotn">'+name.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])+'</span>';b.setAttribute("data-icon",icon);}}else if(b.getAttribute("data-icon")){b.setAttribute("data-icon","");b.textContent=name;}else if(b.textContent!==name)b.textContent=name;
  if((b.getAttribute("title")||"")!==name)b.setAttribute("title",name);const label="Item box "+(i+1)+" ("+(name||"empty")+")";if(b.getAttribute("aria-label")!==label)b.setAttribute("aria-label",label);});return items.slice();}
setMazeSlots(items);
const vis={x:st.x,y:st.y,a:st.f*Math.PI/2},anim={on:false,t0:0,dur:1,fx:0,fy:0,fa:0,tx:0,ty:0,ta:0};
let animOn=true;
function startAnim(dur){anim.fx=vis.x;anim.fy=vis.y;anim.fa=vis.a;anim.tx=st.x;anim.ty=st.y;
 let d=st.f*Math.PI/2-vis.a;d=((d%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI;anim.ta=vis.a+d;anim.t0=performance.now();anim.dur=dur;anim.on=animOn;
 if(!animOn){vis.x=st.x;vis.y=st.y;vis.a=anim.ta;}}
function blocked(){return !!(window.SOTA&&((SOTA.mapOpen&&SOTA.mapOpen())||(SOTA.puzzleOpen&&SOTA.puzzleOpen())||(SOTA.uiOpen&&SOTA.uiOpen())||(SOTA.storyOpen&&SOTA.storyOpen())||panelOn));}
function contentCapToast(){const d=document.getElementById("s4toast");
 d.textContent="Please wait for update to continue.";d.classList.add("on");
 clearTimeout(contentCapToast.h);contentCapToast.h=setTimeout(()=>d.classList.remove("on"),2200);}
/* t2528u: after title Continue or Load, a leftover tap or a quick second tap can land on a full-screen
   archway and open the tavern (heal, join, save). Swallow maze/arch taps for 600 ms after the maze is
   shown, and ignore events whose pointerdown/touchstart began before that screen change. */
let mazeShownAt=0,mazeQuietUntil=0,mazePtrOk=false,mazeQuietOn=false;
function armMazeQuiet(ms){mazeShownAt=performance.now();mazeQuietUntil=mazeShownAt+(ms==null?750:ms);mazePtrOk=false;mazeQuietOn=true;}
function noteMazePointer(){if(mazeQuietOn&&performance.now()>=mazeShownAt)mazePtrOk=true;}
window.addEventListener("pointerdown",noteMazePointer,true);
window.addEventListener("touchstart",noteMazePointer,{capture:true,passive:true});
function mazeInputQuiet(){return !!(mazeQuietOn&&(performance.now()<=mazeQuietUntil||!mazePtrOk));}
function act(cmd){if(blocked())return; // logical state changes at once; the animation only follows it, so no press is ever lost
 if(cmd==="fwd"||cmd==="back"){const d=cmd==="fwd"?st.f:(st.f+2)%4;
  if(canMove(st.x,st.y,d)&&archAhead(st.x,st.y,d)>=0){if(mazeInputQuiet()){bump=performance.now();updHud();return;}bump=performance.now();updHud();archBump(archAhead(st.x,st.y,d));return;}
  if(canMove(st.x,st.y,d)){const ti=(st.y+DIRS[d][1])*N+st.x+DIRS[d][0],rid=roomAt[ti];
   if(!contentCap.allowsStep(st.x,st.y,st.x+DIRS[d][0],st.y+DIRS[d][1])){bump=performance.now();contentCapToast();updHud();return;}
   if(rid>=0){bump=performance.now();updHud();return;}
   st.x+=DIRS[d][0];st.y+=DIRS[d][1];stepped();save();startAnim(150);if(rid>=0&&!clearedR[rid])showPanel(rid);if(window.SOTA&&SOTA.afterStep)SOTA.afterStep(rid);}else bump=performance.now();}
 else if(cmd==="left"){st.f=(st.f+3)%4;save();startAnim(160);}
 else if(cmd==="right"){st.f=(st.f+1)%4;save();startAnim(160);}
 updHud();}
let bump=0;
function archBump(k){const sm=SEAMS[k];if(!sm)return false;if(window.SOTA&&SOTA.onArchBump)SOTA.onArchBump(sm.t,k);return true;}
// tavern zone tab: one step across the seam edge if needed, then face away from the archway
function seamExit(t,z){const k=SEAMS.findIndex(s=>s.t===t);if(k<0)return false;const sm=SEAMS[k],side=z===sm.prev.zone?sm.prev:z===sm.next.zone?sm.next:null;if(!side)return false;
 const other=side===sm.prev?sm.next:sm.prev;
 if(st.x===side.x&&st.y===side.y){st.f=side.f;save();startAnim(160);}
 else if(st.x===other.x&&st.y===other.y){st.x=side.x;st.y=side.y;st.f=side.f;stepped();save();startAnim(150);}
 else{poseAt(side.x,side.y,side.f);trail=[st.y*N+st.x];visit(st.y*N+st.x);save();if(window.SOTA&&SOTA.onStep)SOTA.onStep();}
 updHud();return true;}
let pickCol=new Int16Array(1),pickY0=new Int32Array(1),pickY1=new Int32Array(1),pickArch=new Int8Array(1);
function ensurePick(w){if(pickCol.length<w){pickCol=new Int16Array(w);pickY0=new Int32Array(w);pickY1=new Int32Array(w);pickArch=new Int8Array(w);}}
// ---------- renderer ----------
const cv=document.getElementById("view"),ctx=cv.getContext("2d",{alpha:false});
let W=0,H=0,img=null,buf=null,zbuf=null;
function resize(){const vw=window.innerWidth,vh=window.innerHeight,asp=vw/vh;const px=window.__SOTA_PIX||110000;
 W=Math.max(120,Math.round(Math.sqrt(px*asp)));H=Math.max(120,Math.round(W/asp));cv.width=W;cv.height=H;img=ctx.createImageData(W,H);buf=new Uint32Array(img.data.buffer);zbuf=new Float32Array(W);}
window.addEventListener("resize",resize);resize();
const fogNow=[...ZA[zoneOf[st.y*N+st.x]].fog];
const spriteLast=[],archDrawn={ts:0,cols:0};
function render(t){
 const za=ZA[zoneOf[st.y*N+st.x]];for(let i=0;i<3;i++)fogNow[i]+=(za.fog[i]-fogNow[i])*0.06;
 const fr=fogNow[0],fg=fogNow[1],fb=fogNow[2],fd=za.fd,amb=za.amb;
 const flick=0.92+0.05*Math.sin(t*0.011)+0.03*Math.sin(t*0.037+1.3)+(t-bump<120?-0.15:0);
 const px=2*vis.x+1.5,py=2*vis.y+1.5,a=vis.a-Math.PI/2,dx=Math.cos(a),dy=Math.sin(a);
 const plane=Math.min(0.8,Math.max(0.55,0.5*W/H)),plx=-dy*plane,ply=dx*plane,foc=W/(2*plane),h2=H/2;
 const Lt=new Float32Array(64);for(let i=0;i<64;i++){const d=i*0.25;Lt[i]=flick*1.3/(1+d*0.18+d*d*0.06);}
 const light=d=>{const i=d*4;return i>=63?Lt[63]:Lt[i|0];};
 const colTop=new Int32Array(W),colBot=new Int32Array(W);
 archDrawn.ts=0;archDrawn.cols=0;
 for(let x=0;x<W;x++){
  const cam=2*x/W-1,rx=dx+plx*cam,ry=dy+ply*cam;let mx=px|0,my=py|0;
  const ddx=Math.abs(1/rx),ddy=Math.abs(1/ry);let sx,sy,sdx,sdy,side=0,pz=bzone[my*G+mx];
  if(rx<0){sx=-1;sdx=(px-mx)*ddx;}else{sx=1;sdx=(mx+1-px)*ddx;}
  if(ry<0){sy=-1;sdy=(py-my)*ddy;}else{sy=1;sdy=(my+1-py)*ddy;}
  let guard=0,door=-1,arch=-1;
  while(guard++<400){if(sdx<sdy){sdx+=ddx;mx+=sx;side=0;}else{sdy+=ddy;my+=sy;side=1;}
   if(mx<0||my<0||mx>=G||my>=G)break;const bi=my*G+mx;if(solid[bi])break;const dr=doorRoom[bi];if(dr>=0){door=dr;break;}if(archB[bi]>=0){if(ARCH.ready)arch=archB[bi];break;}/* plain wall until the archway art has loaded */pz=bzone[bi];}
  const perp=side===0?sdx-ddx:sdy-ddy;
  let u=side===0?py+perp*ry:px+perp*rx;u-=Math.floor(u);if((side===0&&rx>0)||(side===1&&ry<0))u=1-u;
  const hsh=((mx*73856093)^(my*19349663)^(side*83492791)^((side===0?sx:sy)>0?0x5bd1e995:0))>>>0;
  const z=door>=0?M.rooms[door].z:pz,isA=arch>=0,ts=isA?ARCH.size:TS,tex=isA?ARCH.tint[zoneOf[st.y*N+st.x]]:door>=0?((solvedR[door]&&DT.open&&DT.open[z])||DT[z]):TX.walls[z][hsh%TX.V],flip=isA?0:(hsh>>>8)&1,voff=isA?0:(hsh>>>9)&31,tm=ts-1;
  let tu=((flip?1-u:u)*ts)|0;if(tu>=ts)tu=tm;
  if(isA){archDrawn.ts=ts;archDrawn.cols++;}
  const lh=foc/perp,top=h2-lh/2,bot=h2+lh/2;const y0=Math.max(0,Math.ceil(top)),y1=Math.min(H,Math.ceil(bot));
  colTop[x]=y0;colBot[x]=y1;ensurePick(W);pickCol[x]=door;pickArch[x]=arch;pickY0[x]=y0;pickY1[x]=y1;zbuf[x]=perp;
  const L=light(perp)*(side?0.82:1),fogk=1-Math.exp(-perp*fd),ik=u<0.03||u>0.97?0.25:(u<0.06||u>0.94?0.6:1);
  const tn=ZA[z].tint,gl=ZA[z].glow;
  for(let y=y0;y<y1;y++){const v=(y-top)/lh;let tv=((v*ts)|0)+voff;tv=isA?(tv>tm?tm:tv<0?0:tv):tv&tm;const ti=(tv*ts+tu)*4;
   const ao=(0.62+0.38*Math.sin(Math.PI*v))*ik*((v<0.02||v>0.98)?0.3:1);
   const e=tex[ti+3]/255*gl,k=L*ao+amb;
   let r=tex[ti]*(k*tn[0]+e),g=tex[ti+1]*(k*tn[1]+e),b=tex[ti+2]*(k*tn[2]+e);
   r+=(fr-r)*fogk;g+=(fg-g)*fogk;b+=(fb-b)*fogk;
   buf[y*W+x]=0xff000000|((b>255?255:b)<<16)|((g>255?255:g)<<8)|(r>255?255:r);}
 }
 // floor and ceiling
 for(let y=0;y<H;y++){const fl=y>=h2;const rowD=(0.5*foc)/Math.abs(y-h2+0.5);
  const L=light(rowD),fogk=1-Math.exp(-rowD*fd);
  const stepX=rowD*(2*plx)/W,stepY=rowD*(2*ply)/W;let wx=px+rowD*(dx-plx),wy=py+rowD*(dy-ply);
  for(let x=0;x<W;x++,wx+=stepX,wy+=stepY){if(y>=colTop[x]&&y<colBot[x])continue;
   const bx=wx|0,by=wy|0;if(bx<0||by<0||bx>=G||by>=G){buf[y*W+x]=0xff000000;continue;}
   const z=bzone[by*G+bx],tn=ZA[z].tint;const fxf=wx-bx,fyf=wy-by;
   const tex=fl?TX.floors[z][(bx*7+by*13)&1]:TX.ceils[z][(bx+by)&1];
   const fh=(bx*31+by*17)&3,ux=fh&1?1-fxf:fxf,uy=fh&2?1-fyf:fyf;const ti=((((uy*TS*2)|0)&63)*TS+(((ux*TS*2)|0)&63))*4;let k=(L*(fl?0.62:0.45))+amb*0.8;
   let r=tex[ti]*k*tn[0],g=tex[ti+1]*k*tn[1],b=tex[ti+2]*k*tn[2];
   if(fl&&(bx&1)&&(by&1)){const mi=mark[((by-1)>>1)*N+((bx-1)>>1)];if(mi>=0){const ddx=fxf-0.5,ddy=fyf-0.5,dd=ddx*ddx+ddy*ddy;
     if(dd<0.12){const c=mkList[mi],ring=dd>0.07&&dd<0.1?1:(dd<0.04?0.55:0.25),pul=0.75+0.25*Math.sin(t*0.004);r+=(c[0]-r)*ring*pul;g+=(c[1]-g)*ring*pul;b+=(c[2]-b)*ring*pul;}}}
   r+=(fr-r)*fogk;g+=(fg-g)*fogk;b+=(fb-b)*fogk;
   buf[y*W+x]=0xff000000|((b>255?255:b)<<16)|((g>255?255:g)<<8)|(r>255?255:r);}}
 // billboard sprites (camp Safe posts): depth-tested against the per-column wall distance in zbuf
 if(POST.d){const det=dx*ply-dy*plx,PS=POST.size,pd=POST.d;spriteLast.length=0;
  const list=[];for(let i=0;i<M.camps.length;i++){const c=M.camps[i];if(c[0]===st.x&&c[1]===st.y&&!anim.on)continue;/* never drawn while standing in its cell */
   const rx=2*c[0]+1.5-px,ry=2*c[1]+1.5-py,da=(rx*ply-plx*ry)/det,db=(dx*ry-dy*rx)/det;if(da<0.35||da>24)continue;list.push([da,db,c]);}
  list.sort((p,q)=>q[0]-p[0]);
  for(const [da,db,c] of list){const sxc=(db/da+1)*W/2,sh=foc/da,sw=sh,x0=Math.max(0,Math.ceil(sxc-sw/2)),x1=Math.min(W,Math.ceil(sxc+sw/2)),top=h2-sh/2,y0=Math.max(0,Math.ceil(top)),y1=Math.min(H,Math.ceil(h2+sh/2));
   if(x0>=x1)continue;const cz=zoneOf[c[1]*N+c[0]],tn=ZA[cz].tint,k=light(da)*0.92+amb+SPRITE_LIFT[cz],fogk=1-Math.exp(-da*fd);let drawn=0;
   for(let x=x0;x<x1;x++){if(da>=zbuf[x])continue;let tu=(((x-(sxc-sw/2))/sw)*PS)|0;if(tu<0)tu=0;else if(tu>=PS)tu=PS-1;
    for(let y=y0;y<y1;y++){let tv=(((y-top)/sh)*PS)|0;if(tv>=PS)tv=PS-1;const ti=(tv*PS+tu)*4;if(pd[ti+3]<128)continue;
     let r=pd[ti]*k*tn[0],g=pd[ti+1]*k*tn[1],b=pd[ti+2]*k*tn[2];r+=(fr-r)*fogk;g+=(fg-g)*fogk;b+=(fb-b)*fogk;
     buf[y*W+x]=0xff000000|((b>255?255:b)<<16)|((g>255?255:g)<<8)|(r>255?255:r);drawn++;}}
   spriteLast.push({cell:[c[0],c[1]],depth:+da.toFixed(3),cx:+sxc.toFixed(2),foot:+(h2+sh/2).toFixed(2),w:+sw.toFixed(2),px:drawn});}}
 ctx.putImageData(img,0,0);
}
// ---------- placeholder panel for a newly opened room ----------
const DT=window.DOORTEX,panel=document.getElementById("panel");let panelOn=false,panelRoom=-1;
const PTXT={treasure:"Treasure room — open the chest.",monster:"Monster room — a powerful foe waits.",story:"Story room — discover a wall painting."};
function showPanel(id){panelRoom=id;panelOn=true;document.getElementById("ptxt").textContent=PTXT[M.rooms[id].k];panel.classList.add("open");}
document.getElementById("pgo").addEventListener("pointerdown",e=>{e.preventDefault();const opened=panelRoom;if(panelRoom>=0){clearedR[panelRoom]=1;saveRooms();}panelOn=false;panelRoom=-1;panel.classList.remove("open");if(opened>=0&&window.SOTA&&SOTA.onRoomOpen)SOTA.onRoomOpen(opened);});
// ---------- loop ----------
const ft=[];let lastT=0;
function frame(t){
 if(window.SOTA&&SOTA.rpg&&SOTA.rpg.syncMazeSlots)SOTA.rpg.syncMazeSlots();
 if(anim.on){let k=(t-anim.t0)/anim.dur;if(!(k<1)){k=1;anim.on=false;}const e=k*k*(3-2*k);
  vis.x=anim.fx+(anim.tx-anim.fx)*e;vis.y=anim.fy+(anim.ty-anim.fy)*e;vis.a=anim.fa+(anim.ta-anim.fa)*e;}
 else{vis.x=st.x;vis.y=st.y;vis.a=st.f*Math.PI/2+Math.round((vis.a-st.f*Math.PI/2)/(2*Math.PI))*2*Math.PI;}
 if(window.SOTA&&((SOTA.mapOpen&&SOTA.mapOpen())||(SOTA.puzzleOpen&&SOTA.puzzleOpen()))){lastT=t;requestAnimationFrame(frame);return;}
 if(st.f!==cmpF)updCompass();const t0=performance.now();render(t);const dt=performance.now()-t0;ft.push(dt);if(ft.length>240)ft.shift();
 lastT=t;requestAnimationFrame(frame);}
requestAnimationFrame(frame);
// ---------- HUD + input ----------
const hud=document.getElementById("hud"),HUD_KEY="sota.hud";let hudOn=true;try{hudOn=localStorage.getItem(HUD_KEY)!=="0";}catch(e){}
function updHud(){hud.textContent="Zone "+zoneOf[st.y*N+st.x]+"  cell "+st.x+","+st.y+"  facing "+FN[st.f];hud.style.display=hudOn?"block":"none";updCompass();}
// t2573u/t2574u/t2576u: the round top-right button is a compass. Its rose turns so N always points to the TOP of the 2D map
// (map top = north, y-1). Facing N it points up, facing E it points left, S down, W right. Clockwise CSS rotate = -facing*90,
// always the shortest way round (the angle is kept as a running total). The cream 'ink' frame never turns.
// One loader: the Graphics rose (art6/hud/compass-rose-144.png, 48 for 1x) if it loads, else a code-drawn rose in the same slot.
const cmpEl=document.getElementById("cmp");let cmpDeg=null,cmpF=-1;
const CMP_SVG='<svg id="cmpsvg" viewBox="0 0 144 144" aria-hidden="true"><g fill="#1a120a"><path d="M72 8a64 64 0 1 1-0.01 0zm0 6a58 58 0 1 0 0.01 0z" fill-rule="evenodd"/>'+
 '<path d="M72 29L85 72H59z M72 72L100 59V85z M72 72L85 100H59z M72 72L44 59V85z"/><path d="M72 62l5 10-5 10-5-10z" fill="#ead9b0"/>'+
 '<path d="M62 2h5l10 13V2h5v20h-5L67 9v13h-5z"/></g></svg>';
function loadCompass(){if(!cmpEl)return;
 // Node harness stubs have a #cmp with no dataset and no Image. Skip or use the code rose; never throw.
 if(typeof Image==="undefined"||!cmpEl.dataset){if(cmpEl.dataset){cmpEl.innerHTML=CMP_SVG;cmpEl.dataset.art="code";}return;}
 const im=new Image();im.id="cmpimg";im.alt="";im.width=36;im.height=36;im.decoding="async";
 im.onerror=()=>{cmpEl.innerHTML=CMP_SVG;cmpEl.dataset.art="code";};im.onload=()=>{cmpEl.dataset.art="png";};
 im.srcset="art6/hud/compass-rose-48.png 1x, art6/hud/compass-rose-144.png 2x";im.src="art6/hud/compass-rose-144.png";cmpEl.innerHTML="";cmpEl.appendChild(im);cmpEl.dataset.art="loading";}
function updCompass(){if(!cmpEl||st.f===cmpF)return;const want=-st.f*90;if(cmpDeg===null){cmpDeg=want;cmpEl.style.transition="none";}
 else{let d=((want-cmpDeg)%360+540)%360-180;cmpDeg+=d;cmpEl.style.transition="";}cmpF=st.f;cmpEl.style.transform="rotate("+cmpDeg+"deg)";}
loadCompass();
updHud();
document.querySelectorAll(".slot").forEach(b=>{b.addEventListener("pointerdown",e=>{e.preventDefault();b.classList.remove("pressed");void b.offsetWidth;b.classList.add("pressed");if(window.SOTA&&SOTA.rpg&&SOTA.rpg.tapMazeSlot)SOTA.rpg.tapMazeSlot(Number(b.dataset.slot));});b.addEventListener("animationend",()=>b.classList.remove("pressed"));b.addEventListener("contextmenu",e=>e.preventDefault());});
document.querySelectorAll("[data-cmd]").forEach(b=>{b.addEventListener("pointerdown",e=>{e.preventDefault();act(b.dataset.cmd);});b.addEventListener("contextmenu",e=>e.preventDefault());});
document.getElementById("dbg").addEventListener("pointerdown",e=>{e.preventDefault();hudOn=!hudOn;try{localStorage.setItem(HUD_KEY,hudOn?"1":"0");}catch(e){}updHud();});
window.addEventListener("keydown",e=>{const k={ArrowUp:"fwd",w:"fwd",ArrowDown:"back",s:"back",ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right"}[e.key];if(k){e.preventDefault();act(k);}});
function dirToRoom(rid){const rc=M.rooms[rid]&&M.rooms[rid].c;if(!rc)return -1;for(let i=0;i<4;i++)if(st.x+DIRS[i][0]===rc[0]&&st.y+DIRS[i][1]===rc[1]&&canMove(st.x,st.y,i))return i;return -1;}
function playRoom(rid){if(!(rid>=0)||!M.rooms[rid])return false;if(!solvedR[rid])solvedR[rid]=1;
 if(!clearedR[rid]){clearedR[rid]=1;saveRooms();if(window.SOTA&&SOTA.onRoomOpen)SOTA.onRoomOpen(rid);}else saveRooms();return true;}
function enterDoor(rid){if(blocked()||!(rid>=0)||!M.rooms[rid])return false;const d=dirToRoom(rid);if(d<0)return false;const nx=st.x+DIRS[d][0],ny=st.y+DIRS[d][1];
 if(!contentCap.allowsStep(st.x,st.y,nx,ny)){bump=performance.now();contentCapToast();updHud();return false;}
 if(locked(rid)){bump=performance.now();if(window.SOTA&&SOTA.openPuzzle)SOTA.openPuzzle(rid,"fwd");updHud();return true;}
 playRoom(rid);updHud();return true;}
function useFacingDoor(){if(blocked()||!canMove(st.x,st.y,st.f))return false;const rid=roomAt[(st.y+DIRS[st.f][1])*N+st.x+DIRS[st.f][0]];return rid>=0&&enterDoor(rid);}
function onViewPointer(e){if(blocked()||e.button||mazeInputQuiet())return;const r=cv.getBoundingClientRect();if(!r.width||!r.height)return;const x=Math.floor((e.clientX-r.left)/r.width*W),y=Math.floor((e.clientY-r.top)/r.height*H);
 if(x<0||y<0||x>=W||y>=H||x>=pickCol.length)return;const ak=pickArch[x];if(ak>=0&&y>=pickY0[x]&&y<pickY1[x]&&archAhead(st.x,st.y,st.f)===ak){e.preventDefault();archBump(ak);return;}const rid=pickCol[x];if(!(rid>=0)||y<pickY0[x]||y>=pickY1[x])return;e.preventDefault();enterDoor(rid);}
cv.addEventListener("pointerup",onViewPointer);
// test/debug hooks (read-only views + direct commands)
window.SOTA={contentCap,seams:()=>SEAMS.map(s=>JSON.parse(JSON.stringify(s))),archAhead,seamExit,armMazeQuiet,mazeInputQuiet,seamTavernAt:(x,y)=>{const k=seamSide[y*N+x];return k>=0?SEAMS[k].t:-1;},
 archTex:()=>({ready:ARCH.ready,size:ARCH.size,src:ARCH.src,mode:ARCH.mode,mask:ARCH.mask,tints:ARCH.tints,flip:0,voff:0}),archLoad:()=>archLoad,archDrawn:()=>({ts:archDrawn.ts,cols:archDrawn.cols,wallTS:TS}),
 archTexel:(z,x,y)=>{if(!ARCH.ready)return null;const t=ARCH.tint[z],i=(y*ARCH.size+x)*4;return [t[i],t[i+1],t[i+2],t[i+3]];},
 floorMark:(x,y)=>{const i=mark[y*N+x];return i>=0?mkKind[i]:null;},sprites:()=>spriteLast.map(s=>Object.assign({},s)),spriteLift:(z,v)=>{if(v!=null&&z>=1&&z<=5)SPRITE_LIFT[z]=+v;return SPRITE_LIFT.slice();},postReady:()=>!!POST.d,
 pick:(x)=>({door:pickCol[x],arch:pickArch[x],y0:pickY0[x],y1:pickY1[x]}),zbuf:()=>zbuf?Array.from(zbuf):[],state:()=>({x:st.x,y:st.y,f:st.f,zone:zoneOf[st.y*N+st.x]}),act,canMove,resetRun,mazeSnap,applyMaze,enterDoor,useFacingDoor,
 frameTimes:()=>ft.slice(),setAnim:v=>{animOn=!!v;},animating:()=>anim.on,renderOnce:()=>{const t0=performance.now();render(performance.now());return performance.now()-t0;},
 setMazeSlots,items:()=>{if(window.SOTA.rpg&&SOTA.rpg.syncMazeSlots)SOTA.rpg.syncMazeSlots();return items.slice();},rooms:()=>({solved:[...solvedR.keys()].filter(i=>solvedR[i]),cleared:[...clearedR.keys()].filter(i=>clearedR[i])}),
 roomAt:(x,y)=>roomAt[y*N+x],isSolved:i=>!!solvedR[i],panelOpen:()=>panelOn,
 markSolved:i=>{solvedR[i]=1;saveRooms();},saveRooms,visitedCount:()=>visCount,isVisited:(x,y)=>!!visited[y*N+x],trailCells:()=>trail.map(i=>[i%N,(i/N)|0]),
 core:{solvedR,clearedR,mask,zoneOf,visited,trail:()=>trail,M,DIRS,BIT},
 teleport:(x,y,f)=>{st.x=x;st.y=y;st.f=f;visit(y*N+x);trail=[y*N+x];if(window.SOTA.onStep)SOTA.onStep();vis.x=x;vis.y=y;vis.a=f*Math.PI/2;anim.on=false;const z=ZA[zoneOf[y*N+x]].fog;fogNow[0]=z[0];fogNow[1]=z[1];fogNow[2]=z[2];save();updHud();},
 compass:()=>({deg:cmpDeg,f:cmpF,art:cmpEl?cmpEl.dataset.art:null}),size:()=>({W,H}),vis:()=>({x:vis.x,y:vis.y,a:vis.a}),N,zones:()=>{const c=[0,0,0,0,0,0];for(let i=0;i<N*N;i++)c[zoneOf[i]]++;return c;}};
})();
