/* Secret of the Adventures - Stage 1: maze engine + first-person 3D view. Private build, no ads, no network. */
(function(){
"use strict";
const M=window.MAZE,TX=window.TEX,N=M.n,G=2*N+1,TS=TX.S;
const SAVE_KEY="sota.stage1.save";
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]],BIT=[1,2,4,8],FN=["N","E","S","W"];
const mask=new Uint8Array(N*N),zoneOf=new Uint8Array(N*N);
for(let i=0;i<N*N;i++){mask[i]=parseInt(M.mask[i],16);zoneOf[i]=+M.zone[i];}
// block grid: cells at odd coords, walls between
const solid=new Uint8Array(G*G).fill(1),bzone=new Uint8Array(G*G);
for(let y=0;y<N;y++)for(let x=0;x<N;x++){const m=mask[y*N+x],bx=2*x+1,by=2*y+1;solid[by*G+bx]=0;if(m&2)solid[by*G+bx+1]=0;if(m&4)solid[(by+1)*G+bx]=0;}
for(let by=0;by<G;by++)for(let bx=0;bx<G;bx++){const cx=Math.min(N-1,Math.max(0,(bx-1)>>1)),cy=Math.min(N-1,Math.max(0,(by-1)>>1));bzone[by*G+bx]=zoneOf[cy*N+cx];}
// small floor markers for taverns, camps, rooms
const mark=new Int32Array(N*N).fill(-1);
const MK={tavern:[255,200,90],camp:[255,130,50],treasure:[90,230,210],monster:[255,70,90],story:[235,235,255]};
const mkList=[];function addMark(c,k){mark[c[1]*N+c[0]]=mkList.length;mkList.push(MK[k]);}
M.rooms.forEach(r=>addMark(r.c,r.k));M.camps.forEach(c=>addMark(c,"camp"));M.taverns.forEach(c=>addMark(c,"tavern"));
// zone atmosphere: fog colour, fog density, torch tint, ambient, glow
const ZA=[null,
 {fog:[78,58,30],fd:0.13,tint:[1.12,0.98,0.78],amb:0.10,glow:1.0},
 {fog:[22,52,36],fd:0.15,tint:[0.95,1.05,0.82],amb:0.09,glow:1.0},
 {fog:[36,62,100],fd:0.12,tint:[0.85,0.97,1.15],amb:0.12,glow:1.3},
 {fog:[72,22,30],fd:0.14,tint:[1.2,0.85,0.72],amb:0.09,glow:1.7},
 {fog:[46,20,78],fd:0.14,tint:[1.0,0.82,1.2],amb:0.10,glow:2.0}];
// ---------- state ----------
const st={x:M.entrance[0],y:M.entrance[1],f:0};
try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");if(s&&s.x>=0&&s.x<N&&s.y>=0&&s.y<N&&s.f>=0&&s.f<4&&(s.x|0)===s.x&&(s.y|0)===s.y)Object.assign(st,{x:s.x,y:s.y,f:s.f|0});}catch(e){}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({x:st.x,y:st.y,f:st.f}));}catch(e){}}
function canMove(x,y,d){return (mask[y*N+x]&BIT[d])!==0;}
const vis={x:st.x,y:st.y,a:st.f*Math.PI/2},anim={on:false,t0:0,dur:1,fx:0,fy:0,fa:0,tx:0,ty:0,ta:0};
let animOn=true;
function startAnim(dur){anim.fx=vis.x;anim.fy=vis.y;anim.fa=vis.a;anim.tx=st.x;anim.ty=st.y;
 let d=st.f*Math.PI/2-vis.a;d=((d%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI;anim.ta=vis.a+d;anim.t0=performance.now();anim.dur=dur;anim.on=animOn;
 if(!animOn){vis.x=st.x;vis.y=st.y;vis.a=anim.ta;}}
function act(cmd){ // logical state changes at once; the animation only follows it, so no press is ever lost
 if(cmd==="fwd"||cmd==="back"){const d=cmd==="fwd"?st.f:(st.f+2)%4;
  if(canMove(st.x,st.y,d)){st.x+=DIRS[d][0];st.y+=DIRS[d][1];save();startAnim(150);}else bump=performance.now();}
 else if(cmd==="left"){st.f=(st.f+3)%4;save();startAnim(160);}
 else if(cmd==="right"){st.f=(st.f+1)%4;save();startAnim(160);}
 updHud();}
let bump=0;
// ---------- renderer ----------
const cv=document.getElementById("view"),ctx=cv.getContext("2d",{alpha:false});
let W=0,H=0,img=null,buf=null,zbuf=null;
function resize(){const vw=window.innerWidth,vh=window.innerHeight,asp=vw/vh;const px=window.__SOTA_PIX||64000;
 W=Math.max(120,Math.round(Math.sqrt(px*asp)));H=Math.max(120,Math.round(W/asp));cv.width=W;cv.height=H;img=ctx.createImageData(W,H);buf=new Uint32Array(img.data.buffer);}
window.addEventListener("resize",resize);resize();
const fogNow=[...ZA[zoneOf[st.y*N+st.x]].fog];
function render(t){
 const za=ZA[zoneOf[st.y*N+st.x]];for(let i=0;i<3;i++)fogNow[i]+=(za.fog[i]-fogNow[i])*0.06;
 const fr=fogNow[0],fg=fogNow[1],fb=fogNow[2],fd=za.fd,amb=za.amb;
 const flick=0.92+0.05*Math.sin(t*0.011)+0.03*Math.sin(t*0.037+1.3)+(t-bump<120?-0.15:0);
 const px=2*vis.x+1.5,py=2*vis.y+1.5,a=vis.a-Math.PI/2,dx=Math.cos(a),dy=Math.sin(a);
 const plane=Math.min(0.8,Math.max(0.55,0.5*W/H)),plx=-dy*plane,ply=dx*plane,foc=W/(2*plane),h2=H/2;
 const Lt=new Float32Array(64);for(let i=0;i<64;i++){const d=i*0.25;Lt[i]=flick*1.3/(1+d*0.18+d*d*0.06);}
 const light=d=>{const i=d*4;return i>=63?Lt[63]:Lt[i|0];};
 const colTop=new Int32Array(W),colBot=new Int32Array(W);
 for(let x=0;x<W;x++){
  const cam=2*x/W-1,rx=dx+plx*cam,ry=dy+ply*cam;let mx=px|0,my=py|0;
  const ddx=Math.abs(1/rx),ddy=Math.abs(1/ry);let sx,sy,sdx,sdy,side=0,pz=bzone[my*G+mx];
  if(rx<0){sx=-1;sdx=(px-mx)*ddx;}else{sx=1;sdx=(mx+1-px)*ddx;}
  if(ry<0){sy=-1;sdy=(py-my)*ddy;}else{sy=1;sdy=(my+1-py)*ddy;}
  let guard=0;
  while(guard++<400){if(sdx<sdy){sdx+=ddx;mx+=sx;side=0;}else{sdy+=ddy;my+=sy;side=1;}
   if(mx<0||my<0||mx>=G||my>=G)break;if(solid[my*G+mx])break;pz=bzone[my*G+mx];}
  const perp=side===0?sdx-ddx:sdy-ddy;
  let u=side===0?py+perp*ry:px+perp*rx;u-=Math.floor(u);if((side===0&&rx>0)||(side===1&&ry<0))u=1-u;
  const hsh=((mx*73856093)^(my*19349663)^(side*83492791)^((side===0?sx:sy)>0?0x5bd1e995:0))>>>0;
  const z=pz,tex=TX.walls[z][hsh%TX.V],flip=(hsh>>>8)&1,voff=(hsh>>>9)&31;
  let tu=((flip?1-u:u)*TS)|0;if(tu>=TS)tu=TS-1;
  const lh=foc/perp,top=h2-lh/2,bot=h2+lh/2;const y0=Math.max(0,Math.ceil(top)),y1=Math.min(H,Math.ceil(bot));
  colTop[x]=y0;colBot[x]=y1;
  const L=light(perp)*(side?0.82:1),fogk=1-Math.exp(-perp*fd),ik=u<0.03||u>0.97?0.25:(u<0.06||u>0.94?0.6:1);
  const tn=ZA[z].tint,gl=ZA[z].glow;
  for(let y=y0;y<y1;y++){const v=(y-top)/lh;let tv=((v*TS)|0)+voff;tv&=TS-1;const ti=(tv*TS+tu)*4;
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
 ctx.putImageData(img,0,0);
}
// ---------- loop ----------
const ft=[];let lastT=0;
function frame(t){
 if(anim.on){let k=(t-anim.t0)/anim.dur;if(!(k<1)){k=1;anim.on=false;}const e=k*k*(3-2*k);
  vis.x=anim.fx+(anim.tx-anim.fx)*e;vis.y=anim.fy+(anim.ty-anim.fy)*e;vis.a=anim.fa+(anim.ta-anim.fa)*e;}
 else{vis.x=st.x;vis.y=st.y;vis.a=st.f*Math.PI/2+Math.round((vis.a-st.f*Math.PI/2)/(2*Math.PI))*2*Math.PI;}
 const t0=performance.now();render(t);const dt=performance.now()-t0;ft.push(dt);if(ft.length>240)ft.shift();
 lastT=t;requestAnimationFrame(frame);}
requestAnimationFrame(frame);
// ---------- HUD + input ----------
const hud=document.getElementById("hud");let hudOn=true;
function updHud(){hud.textContent="Zone "+zoneOf[st.y*N+st.x]+"  cell "+st.x+","+st.y+"  facing "+FN[st.f];hud.style.display=hudOn?"block":"none";}
updHud();
document.querySelectorAll("[data-cmd]").forEach(b=>{b.addEventListener("pointerdown",e=>{e.preventDefault();act(b.dataset.cmd);});b.addEventListener("contextmenu",e=>e.preventDefault());});
document.getElementById("dbg").addEventListener("pointerdown",e=>{e.preventDefault();hudOn=!hudOn;updHud();});
window.addEventListener("keydown",e=>{const k={ArrowUp:"fwd",w:"fwd",ArrowDown:"back",s:"back",ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right"}[e.key];if(k){e.preventDefault();act(k);}});
// test/debug hooks (read-only views + direct commands)
window.SOTA={state:()=>({x:st.x,y:st.y,f:st.f,zone:zoneOf[st.y*N+st.x]}),act,canMove,
 frameTimes:()=>ft.slice(),setAnim:v=>{animOn=!!v;},animating:()=>anim.on,renderOnce:()=>{const t0=performance.now();render(performance.now());return performance.now()-t0;},
 teleport:(x,y,f)=>{st.x=x;st.y=y;st.f=f;vis.x=x;vis.y=y;vis.a=f*Math.PI/2;anim.on=false;const z=ZA[zoneOf[y*N+x]].fog;fogNow[0]=z[0];fogNow[1]=z[1];fogNow[2]=z[2];save();updHud();},
 size:()=>({W,H}),vis:()=>({x:vis.x,y:vis.y,a:vis.a}),N,zones:()=>{const c=[0,0,0,0,0,0];for(let i=0;i<N*N;i++)c[zoneOf[i]]++;return c;}};
})();
