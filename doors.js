/* Stage 3: locked-room door textures for the 3D view, one per zone (original, drawn in code). Alpha channel = glow, like tex.js. */
(function(){
"use strict";
const S=window.TEX.S,ZC=[null,[150,112,60],[92,108,62],[70,92,124],[128,52,50],[96,62,128]],SEAL=[null,[255,200,90],[150,255,140],[140,210,255],[255,120,80],[220,140,255]];
function h(x,y){let v=(x*374761393+y*668265263)>>>0;v=Math.imul(v^(v>>>13),1274126177)>>>0;return(v>>>8)/16777216;}
const out=[null];
for(let z=1;z<=5;z++){const d=new Uint8ClampedArray(S*S*4),c=ZC[z],g=SEAL[z];
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const u=x/S,v=y/S,i=(y*S+x)*4;
  const pl=Math.floor(u*5),pu=u*5-pl,grain=0.82+0.18*Math.sin((v*40+pl*7)+Math.sin(v*9+pl)*2)+0.12*(h(x,y)-.5);
  let k=grain*(pu<0.07||pu>0.95?0.35:1);
  const frame=u<0.06||u>0.94||v<0.05;if(frame)k=0.55+0.2*h(x>>1,y>>1);
  let r=c[0]*k,gg=c[1]*k,b=c[2]*k,e=0;
  const band=Math.abs(v-0.24)<0.035||Math.abs(v-0.8)<0.035;if(band&&!frame){const m=60+40*h(x,y);r=m;gg=m*0.95;b=m*0.9;if(((x+3)%13)<2&&Math.abs(v-0.24)<0.015||((x+9)%13)<2&&Math.abs(v-0.8)<0.015){r=gg=b=150;}}
  // glowing seal with a rune ring in the middle
  const dx=u-0.5,dy=v-0.52,rr=Math.sqrt(dx*dx+dy*dy);
  if(rr<0.15){const ring=Math.abs(rr-0.12)<0.018,core=rr<0.05,ang=Math.atan2(dy,dx),rune=Math.abs(rr-0.085)<0.012&&Math.sin(ang*5)>0.2;
   if(ring||core||rune){r=g[0];gg=g[1];b=g[2];e=ring?230:(core?255:200);}else{r*=0.5;gg*=0.5;b*=0.5;}}
  else if(rr<0.19){const f=(0.19-rr)/0.04;r+=g[0]*f*0.35;gg+=g[1]*f*0.35;b+=g[2]*f*0.35;e=40*f;}
  d[i]=r;d[i+1]=gg;d[i+2]=b;d[i+3]=e;}
 out.push(d);}
window.DOORTEX=out;
})();
