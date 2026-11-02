/* Secret of the Adventures - Stage 2 map screen: hand-inked map of VISITED cells on worn parchment. Original drawing code, no assets, no network. */
(function(){
"use strict";
const S=window.SOTA,C=S.core,M=C.M,N=M.n,L=32; // L = layer pixels per cell
const el=document.getElementById("map"),cv=document.getElementById("mapc"),ctx=cv.getContext("2d");
const ZT=[null,[196,160,60],[110,150,80],[90,130,175],[195,100,115],[140,100,175]]; // zone tints, muted for parchment
const kind=new Map();M.camps.forEach(c=>kind.set(c[1]*N+c[0],"camp"));M.taverns.forEach(c=>kind.set(c[1]*N+c[0],"tavern"));M.rooms.forEach(r=>kind.set(r.c[1]*N+r.c[0],r.k));
function rnd(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function hsh(a,b){return(((a*73856093)^(b*19349663))>>>0)%1000/1000;}
// ---- maze layer: drawn once per newly visited cell ----
const lay=document.createElement("canvas");lay.width=lay.height=N*L;const lc=lay.getContext("2d");
const drawn=new Uint8Array(N*N);let drawnCount=0;
function wall(x0,y0,x1,y1,key){const r=rnd(key*2654435761+7);lc.beginPath();lc.moveTo(x0+(r()-.5)*1.5,y0+(r()-.5)*1.5);
 for(let k=1;k<=3;k++){const t=k/4,j=(r()-.5)*3;lc.lineTo(x0+(x1-x0)*t+(y0===y1?0:j),y0+(y1-y0)*t+(y0===y1?j:0));}
 lc.lineTo(x1+(r()-.5)*1.5,y1+(r()-.5)*1.5);lc.lineWidth=2.4+r()*1.2;lc.stroke();}
function drawCell(i){if(drawn[i])return;drawn[i]=1;drawnCount++;const x=i%N,y=(i/N)|0,px=x*L,py=y*L,m=C.mask[i],t=ZT[C.zoneOf[i]];
 const r=rnd(i*977+3);lc.fillStyle=`rgba(${t[0]},${t[1]},${t[2]},${0.30+r()*0.08})`;
 // floor reaches into open sides so corridors join smoothly
 lc.fillRect(px+(m&8?-1:3),py+(m&1?-1:3),L-(m&8?-1:3)-(m&2?-1:3),L-(m&1?-1:3)-(m&4?-1:3));
 lc.strokeStyle="rgba(38,22,10,.92)";lc.lineCap="round";
 if(!(m&1))wall(px,py,px+L,py,y*N+x);if(!(m&4))wall(px,py+L,px+L,py+L,(y+1)*N+x);
 if(!(m&8))wall(px,py,px,py+L,100000+y*N+x);if(!(m&2))wall(px+L,py,px+L,py+L,100000+y*N+x+1);}
function sync(){const v=C.visited;for(let i=0;i<N*N;i++)if(v[i]&&!drawn[i])drawCell(i);}
// ---- parchment background (cached per screen size) ----
let bg=null,BW=0,BH=0,dpr=1;
function makeBg(){dpr=Math.min(2,window.devicePixelRatio||1);BW=Math.round(innerWidth*dpr);BH=Math.round(innerHeight*dpr);cv.width=BW;cv.height=BH;
 bg=document.createElement("canvas");bg.width=BW;bg.height=BH;const g=bg.getContext("2d"),r=rnd(12345);
 g.fillStyle="#2a1a10";g.fillRect(0,0,BW,BH);
 // torn edge outline
 const e=8*dpr,pts=[];const per=(x,y)=>pts.push([x,y]);
 for(let x=e;x<BW-e;x+=10*dpr)per(x,e+r()*7*dpr);for(let y=e;y<BH-e;y+=10*dpr)per(BW-e-r()*7*dpr,y);
 for(let x=BW-e;x>e;x-=10*dpr)per(x,BH-e-r()*7*dpr);for(let y=BH-e;y>e;y-=10*dpr)per(e+r()*7*dpr,y);
 const edge=new Path2D();pts.forEach((p,i)=>i?edge.lineTo(p[0],p[1]):edge.moveTo(p[0],p[1]));edge.closePath();
 g.save();g.clip(edge);g.fillStyle="#e3cf9f";g.fillRect(0,0,BW,BH);
 for(let k=0;k<260;k++){const x=r()*BW,y=r()*BH,s=(4+r()*40)*dpr,gr=g.createRadialGradient(x,y,0,x,y,s);const d=r()<.5;
  gr.addColorStop(0,d?"rgba(140,95,40,.07)":"rgba(255,245,215,.12)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(x-s,y-s,2*s,2*s);}
 for(let k=0;k<9;k++){const x=r()*BW,y=r()*BH,s=(25+r()*70)*dpr;g.strokeStyle="rgba(120,75,30,.07)";g.lineWidth=3*dpr;g.beginPath();for(let a=0;a<=6.3;a+=.3){const q=s*(.85+r()*.3);g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q*.75);}g.stroke();
  const gr=g.createRadialGradient(x,y,0,x,y,s);gr.addColorStop(0,"rgba(150,100,45,.06)");gr.addColorStop(.85,"rgba(150,100,45,.12)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(x-s,y-s,2*s,2*s);}
 for(let k=0;k<700;k++){g.fillStyle=`rgba(90,60,25,${r()*.08})`;g.fillRect(r()*BW,r()*BH,(1+r()*30)*dpr,dpr*.8);}
 const vg=g.createRadialGradient(BW/2,BH/2,Math.min(BW,BH)*.25,BW/2,BH/2,Math.hypot(BW,BH)*.58);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(80,45,15,.6)");g.fillStyle=vg;g.fillRect(0,0,BW,BH);
 g.restore();g.strokeStyle="rgba(70,40,15,.7)";g.lineWidth=2*dpr;g.stroke(edge);}
// ---- view ----
const view={cx:0,cy:0,z:22};const ZMIN=3,ZMAX=60,FIT_CAP=44; // FIT_CAP: biggest automatic cell size (css px)
function center(){const s=S.state();view.cx=s.x+.5;view.cy=s.y+.5;clamp();}
let bb={x0:0,y0:0,x1:1,y1:1};
function bbox(){const v=C.visited;let x0=N,y0=N,x1=-1,y1=-1;for(let i=0;i<N*N;i++)if(v[i]){const x=i%N,y=(i/N)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 if(x1<0){const s=S.state();x0=x1=s.x;y0=y1=s.y;}bb={x0,y0,x1:x1+1,y1:y1+1};return bb;}
// free screen area for the fitted view (css px): below the title, left of the button column
function area(){const w=innerWidth,h=innerHeight;return{l:22,t:58,r:w-70,b:h-22};}
function fit(){const b=bbox(),a=area(),m=0.8,bw=b.x1-b.x0+2*m,bh=b.y1-b.y0+2*m;
 view.z=Math.max(ZMIN,Math.min(FIT_CAP,(a.r-a.l)/bw,(a.b-a.t)/bh));
 view.cx=(b.x0+b.x1)/2-((a.l+a.r)/2-innerWidth/2)/view.z;view.cy=(b.y0+b.y1)/2-((a.t+a.b)/2-innerHeight/2)/view.z;}
// keep at least ~1.5 cells of the explored box on screen
function clamp(){const hw=innerWidth/2/view.z,hh=innerHeight/2/view.z,k=Math.min(1.5,(bb.x1-bb.x0)),q=Math.min(1.5,(bb.y1-bb.y0));
 view.cx=Math.max(bb.x0+k-hw,Math.min(bb.x1-k+hw,view.cx));view.cy=Math.max(bb.y0+q-hh,Math.min(bb.y1-q+hh,view.cy));}
function icon(k,x,y,z){ctx.save();ctx.translate(x,y);const s=z/32;ctx.scale(s,s);ctx.lineJoin="round";ctx.lineCap="round";ctx.strokeStyle="#2b1a0e";ctx.lineWidth=2.2;
 if(k==="camp"){ctx.fillStyle="#b07a3c";ctx.beginPath();ctx.moveTo(-11,9);ctx.lineTo(0,-11);ctx.lineTo(11,9);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#3a2210";ctx.beginPath();ctx.moveTo(-3,9);ctx.lineTo(0,1);ctx.lineTo(3,9);ctx.fill();ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(-3,-15);ctx.moveTo(0,-11);ctx.lineTo(3,-15);ctx.stroke();}
 else if(k==="tavern"){ctx.fillStyle="#d9a441";ctx.beginPath();ctx.rect(-8,-8,13,17);ctx.fill();ctx.stroke();ctx.fillStyle="#fff6e0";ctx.beginPath();ctx.ellipse(-1.5,-9,8,3.5,0,0,6.3);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(7,1,5,-1.4,1.4);ctx.stroke();ctx.beginPath();ctx.moveTo(-4,-4);ctx.lineTo(-4,6);ctx.moveTo(1,-4);ctx.lineTo(1,6);ctx.lineWidth=1.3;ctx.stroke();}
 else{ctx.fillStyle="#8a5426";ctx.beginPath();ctx.moveTo(-7,11);ctx.lineTo(-7,-5);ctx.quadraticCurveTo(0,-13,7,-5);ctx.lineTo(7,11);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-2.5,-7);ctx.lineTo(-2.5,11);ctx.moveTo(2.5,-7);ctx.lineTo(2.5,11);ctx.stroke();ctx.fillStyle="#f0d070";ctx.beginPath();ctx.arc(4.5,3,1.6,0,6.3);ctx.fill();
  if(k==="monster"){ctx.strokeStyle="#c0141c";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-12,-12);ctx.lineTo(12,12);ctx.moveTo(12,-12);ctx.lineTo(-12,12);ctx.stroke();}
  if(k==="treasure"){ctx.fillStyle="#e8b830";ctx.strokeStyle="#2b1a0e";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(-9,10,3.2,0,6.3);ctx.fill();ctx.stroke();}}
 ctx.restore();}
let open=false,last={},mk={};const ft=[];
function draw(){if(!open)return;const t0=performance.now();sync();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(bg,0,0);
 const z=view.z*dpr,ox=BW/2-view.cx*z,oy=BH/2-view.cy*z;ctx.imageSmoothingEnabled=true;
 ctx.save();ctx.beginPath();ctx.rect(14*dpr,14*dpr,BW-28*dpr,BH-28*dpr);ctx.clip();
 ctx.drawImage(lay,ox,oy,N*z,N*z);
 const v=C.visited,cnt={cells:drawnCount,camp:0,door:0,monster:0,tavern:0,dots:0};
 // trail dots (in walking order; the last entry is where you stand, marked by the arrow)
 const tr=C.trail();ctx.fillStyle="rgba(150,30,20,.85)";const rr=Math.max(1.2,z*.07);
 for(let k=0;k<tr.length-1;k++){const i=tr[k],j=hsh(i,k);const x=ox+(i%N+.5+(j-.5)*.3)*z,y=oy+(((i/N)|0)+.5+(hsh(k,i)-.5)*.3)*z;ctx.beginPath();ctx.arc(x,y,rr,0,6.3);ctx.fill();cnt.dots++;}
 for(const [i,k] of kind){if(!v[i])continue;const x=ox+(i%N+.5)*z,y=oy+(((i/N)|0)+.5)*z;
  if(x<-z||y<-z||x>BW+z||y>BH+z){cnt[k==="camp"||k==="tavern"?k:"door"]++;if(k==="monster")cnt.monster++;continue;}
  icon(k,x,y,z*0.95);if(k==="camp")cnt.camp++;else if(k==="tavern")cnt.tavern++;else{cnt.door++;if(k==="monster")cnt.monster++;}}
 const s=S.state(),pcx=ox+(s.x+.5)*z,pcy=oy+(s.y+.5)*z,pul=0.5+0.5*Math.sin(performance.now()*0.006);
 const ir=z*0.95*0.45,rr=Math.max(8*dpr,z*0.62),aa=Math.max(9*dpr,z*0.34); // icon radius, ring radius, arrow half-length
 ctx.save();ctx.lineWidth=Math.max(3*dpr,z*.1);ctx.strokeStyle="rgba(255,255,255,.95)";ctx.beginPath();ctx.arc(pcx,pcy,rr+ctx.lineWidth*.5,0,6.3);ctx.stroke();
 ctx.strokeStyle=`rgba(20,70,220,${0.75+0.25*pul})`;ctx.lineWidth=Math.max(2.5*dpr,z*.08);ctx.beginPath();ctx.arc(pcx,pcy,rr+ctx.lineWidth*.5+(1+pul*2)*dpr,0,6.3);ctx.stroke();
 const dd=rr+aa+4*dpr,D=C.DIRS[s.f],ax=pcx+D[0]*dd,ay=pcy+D[1]*dd;ctx.translate(ax,ay);ctx.rotate(s.f*Math.PI/2);
 ctx.fillStyle="#1f4fd8";ctx.strokeStyle="#fff";ctx.lineWidth=2.5*dpr;ctx.lineJoin="round";ctx.beginPath();ctx.moveTo(0,-aa);ctx.lineTo(aa*.8,aa*.75);ctx.lineTo(0,aa*.35);ctx.lineTo(-aa*.8,aa*.75);ctx.closePath();ctx.stroke();ctx.fill();
 ctx.strokeStyle="#0c1a40";ctx.lineWidth=1*dpr;ctx.stroke();ctx.restore();
 mk={px:pcx/dpr,py:pcy/dpr,ax:ax/dpr,ay:ay/dpr,ar:aa/dpr,rr:rr/dpr,ir:ir/dpr};
 ctx.restore();
 // title + north mark
 ctx.fillStyle="#2b1a0e";ctx.font=`italic 700 ${26*dpr}px Georgia,serif`;ctx.textAlign="center";ctx.fillText("Map",BW/2,40*dpr);
 ctx.font=`700 ${14*dpr}px Georgia,serif`;ctx.fillText("N",30*dpr,BH-62*dpr);ctx.beginPath();ctx.moveTo(30*dpr,BH-56*dpr);ctx.lineTo(24*dpr,BH-28*dpr);ctx.lineTo(30*dpr,BH-34*dpr);ctx.lineTo(36*dpr,BH-28*dpr);ctx.closePath();ctx.fill();
 Object.assign(el.dataset,{cells:cnt.cells,tents:cnt.camp,doors:cnt.door,xs:cnt.monster,taverns:cnt.tavern,dots:cnt.dots,arrow:s.f,cx:view.cx.toFixed(2),cy:view.cy.toFixed(2),z:view.z});
 ft.push(performance.now()-t0);if(ft.length>240)ft.shift();}
let pend=false;function req(){if(!pend){pend=true;requestAnimationFrame(()=>{pend=false;draw();});}}
function setOpen(o){open=o;el.classList.toggle("open",o);if(o){if(!bg||BW!==Math.round(innerWidth*dpr))makeBg();bbox();fit();draw();pulse();}}
function pulse(){if(!open)return;draw();setTimeout(()=>requestAnimationFrame(pulse),80);}
const tap=(id,f)=>{const b=document.getElementById(id);b.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();f();});b.addEventListener("contextmenu",e=>e.preventDefault());};
tap("mapb",()=>setOpen(true));tap("mclose",()=>setOpen(false));
tap("mzin",()=>{view.z=Math.min(ZMAX,view.z*1.35);clamp();req();});tap("mzout",()=>{view.z=Math.max(ZMIN,view.z/1.35);clamp();req();});tap("mctr",()=>{bbox();fit();req();});
// drag to pan, pinch to zoom
const pts=new Map();let pinch=0;
cv.addEventListener("pointerdown",e=>{cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);pinch=0;});
cv.addEventListener("pointermove",e=>{const p=pts.get(e.pointerId);if(!p)return;
 if(pts.size===1){view.cx-=(e.clientX-p[0])/view.z;view.cy-=(e.clientY-p[1])/view.z;}
 pts.set(e.pointerId,[e.clientX,e.clientY]);
 if(pts.size===2){const [a,b]=[...pts.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)view.z=Math.min(ZMAX,Math.max(ZMIN,view.z*d/pinch));pinch=d;}
 clamp();req();});
const up=e=>{pts.delete(e.pointerId);pinch=0;};cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
window.addEventListener("resize",()=>{if(open){makeBg();req();}else bg=null;});
window.addEventListener("keydown",e=>{if(e.key==="m"||e.key==="M"||(open&&e.key==="Escape")){e.preventDefault();setOpen(!open);}});
S.mapOpen=()=>open;S.onStep=()=>{if(open)req();};
S.map={marker:()=>Object.assign({},mk),bboxScreen:()=>{const b=bbox(),z=view.z,ox=innerWidth/2-view.cx*z,oy=innerHeight/2-view.cy*z;return{l:ox+b.x0*z,t:oy+b.y0*z,r:ox+b.x1*z,b:oy+b.y1*z,z,cap:FIT_CAP};},area,open:()=>setOpen(true),close:()=>setOpen(false),view:()=>Object.assign({},view),pan:(dx,dy)=>{view.cx+=dx;view.cy+=dy;clamp();draw();},drawOnce:()=>{const t=performance.now();draw();return performance.now()-t;},frameTimes:()=>ft.slice()};
})();
