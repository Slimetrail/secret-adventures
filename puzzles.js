/* Secret of the Adventures - Stage 3 puzzle logic (no drawing). Same code runs in the game and in node (tools/solver.js).
   Every puzzle is made from a fixed seed per room, so a reload gives the same puzzle. Types: 0 mirror beams, 1 levers,
   2 riddles (zones 1-2) or codes (zones 3-5), 3 moving blocks, 4 sliding tiles. */
(function(root){
"use strict";
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const ri=(r,n)=>Math.floor(r()*n);
const NAMES=["Mirror beams","Levers","Riddle or code","Moving blocks","Sliding tiles"];
// difficulty by zone (index 1..5)
const DIFF={
 mirror:{n:[0,4,5,5,6,6],m:[0,3,4,6,7,9],hit:[0,2,2,3,3,4]},
 lever:{L:[0,3,4,5,6,7],minPress:[0,1,2,2,3,3]},
 code:{riddles:[0,1,2,0,0,0],len:[0,0,0,3,4,4],digits:[0,0,0,5,6,8]},
 block:{n:[0,4,5,5,6,6],b:[0,3,4,5,6,7],minMoves:[0,3,5,7,9,11]},
 tile:{n:[0,3,3,3,4,4],k:[0,10,16,24,24,34]}};
// ---- original riddles (written for this game) ----
const RIDDLES=[
 ["I sleep in the wax and wake with a flame. I get shorter every night.",["Candle","Moon","Rope","Bread"],0],
 ["I carry water up from the dark, held by a rope.",["Bucket","Boot","Bell","Crown"],0],
 ["I have an iron mouth and I only eat keys.",["Wolf","Lock","Shield","Lamp"],1],
 ["Green on top, brown below. I drink the rain and give you shade.",["Stone","Fish","Tree","Cloud"],2],
 ["I walk with you in torchlight, but I run away when it goes out.",["Dog","Shadow","Echo","Ghost"],1],
 ["I have one glass eye and I bring the far hills close.",["Spyglass","Helmet","Bottle","Owl"],0],
 ["Tie me well and I hold the climber. Cut me and he falls.",["Ladder","Rope","Belt","Chain"],1],
 ["Hot belly, iron legs, the cook's best friend.",["Dragon","Pot","Horse","Anvil"],1],
 ["A rope swings me and I wake the whole town at dawn.",["Rooster","Bell","Drum","Horn"],1],
 ["I spin on a pin, but I always point north.",["Compass","Wheel","Top","Arrow"],0],
 ["Dig me up and I shine. Drop me in the sea and I sink. Kings fight for me.",["Sand","Gold","Salt","Coal"],1],
 ["I have many teeth but I never bite. I fix your hair.",["Comb","Saw","Fork","Key"],0]];
function shuffle(r,a){for(let i=a.length-1;i>0;i--){const j=ri(r,i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
// ---- 0 mirrors ----
function trace(pz,s){const n=pz.n;let x=-1,y=pz.r,dx=1,dy=0;const pts=[[x,y]];const om=new Map();pz.mir.forEach((c,k)=>om.set(c,k));let hits=0;
 for(let g=0;g<400;g++){x+=dx;y+=dy;if(x<0||y<0||x>=n||y>=n){pts.push([x,y]);return{pts,exit:x+","+y,hits};}
  const k=om.get(y*n+x);if(k!==undefined){hits++;pts.push([x,y]);if(s.o[k]===0){const t=dx;dx=-dy;dy=-t;}else{const t=dx;dx=dy;dy=t;}}}
 return{pts,exit:"loop",hits};}
function genMirror(z,r){const n=DIFF.mirror.n[z],m=DIFF.mirror.m[z],hit=DIFF.mirror.hit[z];
 for(let tr=0;tr<500;tr++){const cells=shuffle(r,[...Array(n*n).keys()]).slice(0,m);const pz={t:0,n,r:ri(r,n),mir:cells};
  const sol={o:cells.map(()=>ri(r,2))};const tt=trace(pz,sol);if(tt.hits<hit||tt.exit===(-1)+","+pz.r||tt.exit==="loop")continue;pz.tgt=tt.exit;
  for(let k=0;k<60;k++){const s={o:cells.map(()=>ri(r,2))};if(trace(pz,s).exit!==pz.tgt)return{pz,s};}}
 throw new Error("mirror gen");}
// ---- 1 levers ----
function lamps(pz,s){let v=pz.start;for(let i=0;i<pz.L;i++)if(s.p[i])v^=pz.eff[i];return v;}
function genLever(z,r){const L=DIFF.lever.L[z],full=(1<<L)-1;
 for(let tr=0;tr<500;tr++){const eff=[];for(let i=0;i<L;i++){let e=0;const c=2+ri(r,2);while(bits(e)<c)e|=1<<ri(r,L);eff.push(e);}
  const sol=[];for(let i=0;i<L;i++)sol.push(ri(r,2));let e=0;sol.forEach((b,i)=>{if(b)e^=eff[i];});if(!e)continue;
  const pz={t:1,L,eff,start:full^e,full};const mp=minPress(pz);if(mp<DIFF.lever.minPress[z])continue;return{pz,s:{p:Array(L).fill(0)}};}
 throw new Error("lever gen");}
function bits(v){let c=0;while(v){c+=v&1;v>>=1;}return c;}
function minPress(pz){let best=99;for(let m=0;m<(1<<pz.L);m++){let v=pz.start;for(let i=0;i<pz.L;i++)if(m>>i&1)v^=pz.eff[i];if(v===pz.full)best=Math.min(best,bits(m));}return best;}
// ---- 2 riddles / codes ----
function fb(g,sec){let a=0,b=0;g.forEach((d,i)=>{if(sec[i]===d)a++;else if(sec.includes(d))b++;});return[a,b];}
function codesFitting(pz){const out=[],L=pz.len,D=pz.digits,cur=[];
 (function rec(){if(cur.length===L){if(pz.clues.every(c=>{const f=fb(c.g,cur);return f[0]===c.a&&f[1]===c.b;}))out.push(cur.slice());return;}
  for(let d=1;d<=D;d++)if(!cur.includes(d)){cur.push(d);rec();cur.pop();}})();return out;}
function genCode(z,r){const rd=DIFF.code.riddles[z];
 if(rd){const pick=shuffle(r,[...RIDDLES.keys()]).slice(0,rd);
  return{pz:{t:2,mode:"riddle",q:pick.map(i=>{const R=RIDDLES[i],ord=shuffle(r,[0,1,2,3]);return{text:R[0],opts:ord.map(j=>R[1][j]),a:ord.indexOf(R[2])};})},s:{step:0,wrong:0}};}
 const L=DIFF.code.len[z],D=DIFF.code.digits[z];
 for(let tr=0;tr<200;tr++){const sec=shuffle(r,[...Array(D).keys()].map(x=>x+1)).slice(0,L);const pz={t:2,mode:"code",len:L,digits:D,clues:[]};
  for(let c=0;c<12;c++){const g=shuffle(r,[...Array(D).keys()].map(x=>x+1)).slice(0,L);if(g.join()===sec.join())continue;const f=fb(g,sec);pz.clues.push({g,a:f[0],b:f[1]});
   const fit=codesFitting(pz);if(fit.length===1)return{pz,s:{e:[],wrong:0,ok:0}};}}
 throw new Error("code gen");}
// ---- 3 moving blocks (slide the gold key block out to the right) ----
function occ(pz,s){const n=pz.n,o=new Int8Array(n*n).fill(-1);pz.blk.forEach((b,i)=>{const[x,y]=s.q[i];for(let k=0;k<b.len;k++)o[(b.h?y:y+k)*n+(b.h?x+k:x)]=i;});return o;}
function blockMoves(pz,s){const n=pz.n,o=occ(pz,s),out=[];pz.blk.forEach((b,i)=>{const[x,y]=s.q[i];
  if(b.h){if(x>0&&o[y*n+x-1]<0)out.push([i,-1]);if(x+b.len<n&&o[y*n+x+b.len]<0)out.push([i,1]);}
  else{if(y>0&&o[(y-1)*n+x]<0)out.push([i,-1]);if(y+b.len<n&&o[(y+b.len)*n+x]<0)out.push([i,1]);}});return out;}
function bkey(s){return s.q.map(p=>p[0]+","+p[1]).join(";");}
function bstep(pz,s,i,d){const q=s.q.map(p=>p.slice());if(pz.blk[i].h)q[i][0]+=d;else q[i][1]+=d;return{q};}
function bsolved(pz,s){return s.q[0][0]+pz.blk[0].len===pz.n;}
function bfsBlocks(pz,s0,cap){const seen=new Map([[bkey(s0),null]]),q=[s0];let h=0;
 while(h<q.length&&seen.size<(cap||60000)){const s=q[h++];if(bsolved(pz,s)){const path=[];let k=bkey(s);while(seen.get(k)){const[pk,mv]=seen.get(k);path.push(mv);k=pk;}return path.reverse();}
  for(const[i,d] of blockMoves(pz,s)){const t=bstep(pz,s,i,d),k=bkey(t);if(!seen.has(k)){seen.set(k,[bkey(s),[i,d]]);q.push(t);}}}return null;}
function genBlock(z,r){const n=DIFF.block.n[z],B=DIFF.block.b[z],need=DIFF.block.minMoves[z];let best=null;
 for(let tr=0;tr<60;tr++){const ry=ri(r,n);const pz={t:3,n,r:ry,blk:[{h:1,len:2}]};const s={q:[[n-2,ry]]};
  let o=occ(pz,s);for(let b=0,g=0;b<B&&g<300;g++){const h=r()<0.4?1:0,len=(n>=6&&r()<0.3)?3:2,x=ri(r,h?n-len+1:n),y=ri(r,h?n:n-len+1);
   if(h&&y===ry)continue;let ok=true;for(let k=0;k<len;k++)if(o[(h?y:y+k)*n+(h?x+k:x)]>=0)ok=false;if(!ok)continue;pz.blk.push({h,len});s.q.push([x,y]);o=occ(pz,s);b++;}
  // walk outward from the solved state, keep the reachable state that needs the most moves (up to the target)
  const seen=new Set([bkey(s)]),q=[s];let h=0;while(h<q.length&&seen.size<8000){const c=q[h++];for(const[i,d] of blockMoves(pz,c)){const t=bstep(pz,c,i,d),k=bkey(t);if(!seen.has(k)){seen.add(k);q.push(t);}}}
  for(let k=q.length-1;k>=Math.max(0,q.length-40);k--){const c=q[k];if(bsolved(pz,c))continue;const p=bfsBlocks(pz,c,20000);if(p&&(!best||p.length>best.d)){best={pz,s:{q:c.q.map(x=>x.slice())},d:p.length};}break;}
  if(best&&best.d>=need)break;}
 if(!best)throw new Error("block gen");return{pz:best.pz,s:best.s};}
// ---- 4 sliding tiles (put the numbers in order, gap at the end) ----
function tileNb(n,b){const x=b%n,y=(b/n)|0,o=[];if(y>0)o.push(b-n);if(x<n-1)o.push(b+1);if(y<n-1)o.push(b+n);if(x>0)o.push(b-1);return o;}
function tsolved(pz,s){for(let i=0;i<s.a.length-1;i++)if(s.a[i]!==i+1)return false;return true;}
function genTile(z,r){const n=DIFF.tile.n[z],k=DIFF.tile.k[z];
 for(let tr=0;tr<50;tr++){const a=[...Array(n*n-1).keys()].map(x=>x+1);a.push(0);let b=n*n-1,prev=-1;
  for(let i=0;i<k;i++){const nb=tileNb(n,b).filter(p=>p!==prev);const p=nb[ri(r,nb.length)];a[b]=a[p];a[p]=0;prev=b;b=p;}
  const s={a};if(!tsolved({n},s))return{pz:{t:4,n},s};}
 throw new Error("tile gen");}
// ---- common ----
const GEN=[genMirror,genLever,genCode,genBlock,genTile];
function make(type,zone,seed){const r=rng(seed);const g=GEN[type](zone,r);g.pz.zone=zone;g.pz.seed=seed;return g;}
function forRoom(room){return make(room.p,room.z,(room.id+1)*9973+17*room.z);}
function clone(s){return JSON.parse(JSON.stringify(s));}
// apply one move; returns the new state (input not changed). Moves: 0 mirror k, 1 lever i, 2 option index or digit, 3 [block, dir], 4 tile position
function apply(pz,s,mv){s=clone(s);
 if(pz.t===0){if(mv>=0&&mv<pz.mir.length)s.o[mv]^=1;}
 else if(pz.t===1){if(mv>=0&&mv<pz.L)s.p[mv]^=1;}
 else if(pz.t===2){if(pz.mode==="riddle"){if(s.step>=pz.q.length)return s;if(mv===pz.q[s.step].a){s.step++;s.wrong=0;}else{s.step=0;s.wrong=1;}}
  else{if(s.ok)return s;if(mv==="clr"){s.e=[];s.wrong=0;return s;}if(!(mv>=1&&mv<=pz.digits)||s.e.includes(mv))return s;s.e.push(mv);s.wrong=0;
   if(s.e.length===pz.len){if(pz.clues.every(c=>{const f=fb(c.g,s.e);return f[0]===c.a&&f[1]===c.b;}))s.ok=1;else{s.e=[];s.wrong=1;}}}}
 else if(pz.t===3){const[i,d]=mv;if(blockMoves(pz,s).some(m=>m[0]===i&&m[1]===d))return bstep(pz,s,i,d);}
 else if(pz.t===4){const b=s.a.indexOf(0);if(tileNb(pz.n,b).includes(mv)){s.a[b]=s.a[mv];s.a[mv]=0;}}
 return s;}
function solved(pz,s){if(pz.t===0)return trace(pz,s).exit===pz.tgt;if(pz.t===1)return lamps(pz,s)===pz.full;
 if(pz.t===2)return pz.mode==="riddle"?s.step>=pz.q.length:!!s.ok;if(pz.t===3)return bsolved(pz,s);return tsolved(pz,s);}
function params(z){return{mirror:`${DIFF.mirror.n[z]}x${DIFF.mirror.n[z]}, ${DIFF.mirror.m[z]} mirrors, beam must use ${DIFF.mirror.hit[z]}+`,lever:`${DIFF.lever.L[z]} levers/lamps, ${DIFF.lever.minPress[z]}+ presses`,
 code:DIFF.code.riddles[z]?`${DIFF.code.riddles[z]} riddle(s) in a row`:`${DIFF.code.len[z]}-digit code from 1-${DIFF.code.digits[z]}`,block:`${DIFF.block.n[z]}x${DIFF.block.n[z]}, ${DIFF.block.b[z]} blocks, ${DIFF.block.minMoves[z]}+ moves`,tile:`${DIFF.tile.n[z]}x${DIFF.tile.n[z]}, ${DIFF.tile.k[z]} scramble moves`};}
const P={rng,make,forRoom,apply,solved,trace,lamps,occ,blockMoves,bfsBlocks,codesFitting,fb,tileNb,minPress,DIFF,NAMES,params,clone,RIDDLES};
if(typeof module!=="undefined"&&module.exports)module.exports=P;else root.PUZ=P;
})(this);
