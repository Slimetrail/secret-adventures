/* Secret of the Adventures - procedural zone textures. All art is original and drawn here in code.
   Each texture is 64x64 RGBA; the alpha byte is used as a glow (emissive) amount, not transparency. */
(function(){
const S=64;
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
// tileable value noise
function noise(r,cell){const g=S/cell,v=[];for(let i=0;i<g*g;i++)v.push(r());
 return (x,y)=>{const fx=x/cell,fy=y/cell,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);
  const a=v[(y0%g)*g+(x0%g)],b=v[(y0%g)*g+((x0+1)%g)],c=v[((y0+1)%g)*g+(x0%g)],d=v[((y0+1)%g)*g+((x0+1)%g)];
  return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};}
function T(){return{r:new Float32Array(S*S),g:new Float32Array(S*S),b:new Float32Array(S*S),e:new Float32Array(S*S)};}
function put(t,x,y,c,a,em){x=((x%S)+S)%S;y=((y%S)+S)%S;const i=y*S+x;a=a==null?1:a;t.r[i]+=(c[0]-t.r[i])*a;t.g[i]+=(c[1]-t.g[i])*a;t.b[i]+=(c[2]-t.b[i])*a;if(em)t.e[i]=Math.max(t.e[i],em);}
function mix(a,b,k){return[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];}
function line(t,x0,y0,x1,y1,c,a,em){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))|0||1;for(let i=0;i<=n;i++)put(t,Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),c,a,em);}
// Stone blocks of varying size, painted shading, ink mortar lines, cracks.
function blocks(t,r,P){const n1=noise(r,16),n2=noise(r,4);let y=0;const rows=[];
 while(y<S){let h=P.hmin+Math.floor(r()*(P.hmax-P.hmin));if(S-y<P.hmin+2)h=S-y;rows.push([y,h]);y+=h;}
 if(rows.length>1&&rows[rows.length-1][1]<P.hmin){const l=rows.pop();rows[rows.length-1][1]+=l[1];}
 for(const[ry,rh]of rows){let x=Math.floor(r()*S);const x0=x;let left=S;
  while(left>0){let w=P.wmin+Math.floor(r()*(P.wmax-P.wmin));if(left-w<P.wmin)w=left;left-=w;
   const base=mix(P.c1,P.c2,r());const tone=0.82+r()*0.3;
   for(let yy=0;yy<rh;yy++)for(let xx=0;xx<w;xx++){const px=x+xx,py=ry+yy;
    const edge=Math.min(xx,yy,w-1-xx,rh-1-yy);let k=tone*(0.78+0.3*n1(((px%S)+S)%S,py)+0.14*n2(((px%S)+S)%S,py));
    if(edge===0){put(t,px,py,P.ink,1);continue;}
    if(edge===1&&P.mortar){put(t,px,py,P.mortar,1);continue;}
    // painted bevel: light upper-left, shadow lower-right
    if(yy<=2||xx<=2)k*=1.16; if(yy>=rh-3||xx>=w-3)k*=0.78;
    const grad=1.05-0.18*(yy/rh); put(t,px,py,[base[0]*k*grad,base[1]*k*grad,base[2]*k*grad],1);}
   if(r()<P.crack){let cx=x+2+r()*(w-4),cy=ry+2+r()*(rh-4);for(let s=0;s<6+r()*8;s++){const nx=cx+(r()-0.5)*4,ny=cy+r()*3;line(t,cx|0,cy|0,nx|0,ny|0,P.ink,0.75);cx=nx;cy=ny;if(cy>ry+rh-2)break;}}
   x+=w;}}}
function moss(t,r){const n=noise(r,8),c=[60,140,50],c2=[120,190,70];
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const v=n(x,y)+0.5*(y/S)-0.25;if(v>0.62)put(t,x,y,mix(c,c2,r()*0.6),Math.min(1,(v-0.62)*6));}
 for(let k=0;k<2+r()*2;k++){let x=r()*S;for(let y=0;y<S;y++){x+=Math.sin(y*0.3+k)*0.6;put(t,x|0,y,[30,90,30],0.9);if(r()<0.12){put(t,(x|0)+1,y,[110,200,80],1);put(t,(x|0)+2,y,[90,170,60],0.8);}}}}
function cobweb(t,r){const cx=r()<0.5?0:63,cy=0,c=[230,225,205];for(let a=0;a<6;a++){const an=(cx?Math.PI/2:0)+a*Math.PI/10;line(t,cx,cy,cx+Math.cos(an)*(cx?-1:1)*22,cy+Math.sin(an)*22,c,0.45);}
 for(let rr=5;rr<22;rr+=5)for(let a=0;a<12;a++){const an=a*Math.PI/22;put(t,(cx+(cx?-1:1)*Math.cos(an)*rr)|0,(Math.sin(an)*rr)|0,c,0.4);}}
function ice(t,r){for(let k=0;k<4+r()*4;k++){const x=r()*S,y=r()*S,h=2+r()*4,w=1+r()*1.5;
  for(let yy=-h;yy<=h;yy++){const ww=w*(1-Math.abs(yy)/h);for(let xx=-ww;xx<=ww;xx++)put(t,(x+xx)|0,(y+yy)|0,mix([120,190,235],[210,240,255],Math.abs(xx)<0.6?0.8:0.2),0.7,0.25);}}
 for(let k=0;k<3;k++){const x=r()*S|0;const l=4+r()*14;for(let y=0;y<l;y++)put(t,x,y,[120,170,210],0.5*(1-y/l));}}
function embers(t,r){for(let k=0;k<22;k++){const x=r()*S|0,y=r()*S|0;const i=y*S+x;if(t.r[i]<70){put(t,x,y,[255,140,40],1,0.9);put(t,x+1,y,[220,80,20],0.6,0.5);}}
 for(let y=S-14;y<S;y++)for(let x=0;x<S;x++){const k=(y-(S-14))/14;put(t,x,y,[255,110,40],0.18*k,0.0);}}
function runes(t,r){const c=[220,150,255];for(let k=0;k<2+r()*2;k++){let x=8+r()*48,y=8+r()*44;const sz=4+r()*4;
  for(let s=0;s<4;s++){const a=Math.floor(r()*8)*Math.PI/4,nx=x+Math.cos(a)*sz,ny=y+Math.sin(a)*sz;line(t,x|0,y|0,nx|0,ny|0,c,0.85,0.8);line(t,(x|0)+1,y|0,(nx|0)+1,ny|0,[150,80,230],0.6,0.6);x=nx;y=ny;}}
 for(let k=0;k<3;k++){const x=r()*S,y=r()*S;for(let yy=-4;yy<=4;yy++)for(let xx=-2;xx<=2;xx++)if(Math.abs(xx)*2+Math.abs(yy)<=4)put(t,(x+xx)|0,(y+yy)|0,mix([120,60,200],[240,200,255],(4-Math.abs(yy))/4),0.9,0.55);}}
function floorTex(t,r,P){const n=noise(r,8),n2=noise(r,32);// irregular flagstones
 const pts=[];for(let i=0;i<9;i++)pts.push([r()*S,r()*S,mix(P.f1,P.f2,r())]);
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){let b1=1e9,b2=1e9,bc=null;for(const p of pts){let dx=Math.abs(x-p[0]),dy=Math.abs(y-p[1]);dx=Math.min(dx,S-dx);dy=Math.min(dy,S-dy);const d=dx*dx+dy*dy;if(d<b1){b2=b1;b1=d;bc=p[2];}else if(d<b2)b2=d;}
  const e=Math.sqrt(b2)-Math.sqrt(b1);const k=0.8+0.3*n(x,y)+0.1*n2(x,y);
  if(e<0.6)put(t,x,y,P.ink,0.85);else if(e<1.4)put(t,x,y,mix(P.ink,[bc[0]*k,bc[1]*k,bc[2]*k],0.55),1);else put(t,x,y,[bc[0]*k,bc[1]*k,bc[2]*k],1);}}
function ceilTex(t,r,P){const n=noise(r,16);for(let y=0;y<S;y++)for(let x=0;x<S;x++){const k=0.7+0.5*n(x,y);put(t,x,y,[P.ce[0]*k,P.ce[1]*k,P.ce[2]*k],1);}
 for(let x=0;x<S;x++){put(t,x,0,P.ink,1);put(t,x,32,P.ink,0.8);}for(let y=0;y<S;y++){put(t,0,y,P.ink,0.6);}}
// Zone palettes (from Jeremy's painting: 1 yellow, 2 green, 3 blue, 4 pink/red, 5 purple)
const Z=[null,
 {c1:[205,170,95],c2:[235,205,130],ink:[55,35,20],mortar:[150,120,75],hmin:9,hmax:17,wmin:12,wmax:30,crack:0.35,f1:[170,140,85],f2:[200,170,110],ce:[110,85,55],extra:(t,r,v)=>{if(v%3===0)cobweb(t,r);}},
 {c1:[85,110,80],c2:[120,135,100],ink:[18,35,20],mortar:[60,75,50],hmin:10,hmax:20,wmin:12,wmax:34,crack:0.3,f1:[70,95,60],f2:[95,115,75],ce:[40,60,40],extra:(t,r)=>moss(t,r)},
 {c1:[90,120,160],c2:[130,160,200],ink:[15,25,50],mortar:[60,80,115],hmin:12,hmax:22,wmin:14,wmax:34,crack:0.45,f1:[70,95,130],f2:[100,130,165],ce:[35,50,80],extra:(t,r)=>ice(t,r)},
 {c1:[170,70,70],c2:[205,100,90],ink:[45,12,15],mortar:[70,30,30],hmin:7,hmax:11,wmin:12,wmax:22,crack:0.25,f1:[120,55,55],f2:[150,75,70],ce:[70,25,30],extra:(t,r)=>embers(t,r)},
 {c1:[80,55,120],c2:[115,80,155],ink:[20,8,40],mortar:[50,30,85],hmin:12,hmax:24,wmin:14,wmax:36,crack:0.3,f1:[60,40,95],f2:[85,60,125],ce:[30,15,50],extra:(t,r)=>runes(t,r)}];
function pack(t){const o=new Uint8ClampedArray(S*S*4);for(let i=0;i<S*S;i++){o[i*4]=t.r[i];o[i*4+1]=t.g[i];o[i*4+2]=t.b[i];o[i*4+3]=t.e[i]*255;}return o;}
const V=6;const out={S,V,walls:[],floors:[],ceils:[]};
for(let z=1;z<=5;z++){const P=Z[z];out.walls[z]=[];out.floors[z]=[];out.ceils[z]=[];
 for(let v=0;v<V;v++){const r=rng(z*1000+v*17+3);const t=T();blocks(t,r,P);P.extra(t,r,v);out.walls[z].push(pack(t));}
 for(let v=0;v<2;v++){const r=rng(z*777+v*31+9);let t=T();floorTex(t,r,P);out.floors[z].push(pack(t));t=T();ceilTex(t,r,P);out.ceils[z].push(pack(t));}}
window.TEX=out;
})();
