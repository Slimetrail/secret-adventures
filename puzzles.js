/* Secret of the Adventure - Stage 3 puzzle logic (no drawing). Same code runs in the game and in node (tools/solver.js).
   Every puzzle is made from a fixed seed per room, so a reload gives the same puzzle. Types: 0 mirror beams, 1 levers,
   2 pipe connections (zones 1-2) or Sudoku (zones 3-5), 3 moving blocks, 4 sliding tiles. */
(function(root){
"use strict";
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const ri=(r,n)=>Math.floor(r()*n);
const NAMES=["Mirror beams","Levers","Pipes / Sudoku","Moving blocks","Sliding tiles"];
// difficulty by zone (index 1..5)
const DIFF={
 mirror:{n:[0,4,5,5,6,6],m:[0,3,4,6,7,9],hit:[0,2,2,3,3,4]},
 lever:{L:[0,3,4,5,6,7],minPress:[0,1,2,2,3,3]},
 pipes:{count:[0,1,2,3,4,5]},
 sudoku:{n:[0,4,4,4,6,9],clues:[0,12,10,8,18,32]},
 block:{n:[0,4,5,5,6,6],b:[0,3,4,5,6,7],minMoves:[0,3,5,7,9,11]},
 tile:{n:[0,3,3,3,4,4],k:[0,10,16,24,24,34]}};
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
// ---- 2 pipe connections / Sudoku: search-verified, with no stored answers ----
const PIPE_DIR=[[0,-1],[1,0],[0,1],[-1,0]];
const rotPipe=m=>((m<<1)&15)|(m>>3);
function pipeRotations(m){const a=[];for(let k=0;k<4;k++){if(!a.includes(m))a.push(m);m=rotPipe(m);}return a;}
function pipeDomains(pz){const n=pz.n,ports=new Map();pz.ends.forEach(e=>e.forEach(([i,d])=>ports.set(i+':'+d,true)));
 return pz.shape.map((mask,i)=>pipeRotations(mask).filter(m=>PIPE_DIR.every(([dx,dy],d)=>{const x=i%n+dx,y=(i/n|0)+dy,j=y*n+x,on=!!(m&(1<<d));if(x<0||y<0||x>=n||y>=n)return on===ports.has(i+':'+d);if(pz.pipe[j]!==pz.pipe[i])return !on;return true;})));}
function pipesSolved(pz,s){if(!s||!Array.isArray(s.a)||s.a.length!==pz.shape.length)return false;const n=pz.n,ds=pipeDomains(pz);if(s.a.some((m,i)=>!ds[i].includes(m)))return false;
 for(let i=0;i<s.a.length;i++)for(let d=0;d<4;d++){const [dx,dy]=PIPE_DIR[d],x=i%n+dx,y=(i/n|0)+dy;if(x>=0&&y>=0&&x<n&&y<n&&!!(s.a[i]&(1<<d))!==!!(s.a[y*n+x]&(1<<((d+2)%4))))return false;}
 for(let p=0;p<pz.count;p++){const seen=new Set(),q=[pz.ends[p][0][0]];while(q.length){const i=q.pop();if(seen.has(i))continue;seen.add(i);for(let d=0;d<4;d++)if(s.a[i]&(1<<d)){const [dx,dy]=PIPE_DIR[d],x=i%n+dx,y=(i/n|0)+dy;if(x>=0&&y>=0&&x<n&&y<n)q.push(y*n+x);}}
  if(!seen.has(pz.ends[p][1][0])||seen.size!==pz.pipe.filter(v=>v===p).length)return false;}return true;}
function solvePipes(pz,s){const n=pz.n;function search(dom){let changed=true;while(changed){changed=false;for(let i=0;i<dom.length;i++){if(!dom[i].length)return null;for(let d=0;d<4;d++){const [dx,dy]=PIPE_DIR[d],x=i%n+dx,y=(i/n|0)+dy;if(x<0||y<0||x>=n||y>=n)continue;const j=y*n+x,keep=dom[i].filter(m=>dom[j].some(v=>!!(m&(1<<d))===!!(v&(1<<((d+2)%4)))));if(keep.length!==dom[i].length){dom[i]=keep;changed=true;}}}}
 let k=-1;for(let i=0;i<dom.length;i++)if(dom[i].length>1&&(k<0||dom[i].length<dom[k].length))k=i;
 if(k<0){const a=dom.map(v=>v[0]);return pipesSolved(pz,{a})?a:null;}
 for(const v of dom[k]){const next=dom.map(a=>a.slice());next[k]=[v];const hit=search(next);if(hit)return hit;}return null;}
 const a=search(pipeDomains(pz));if(!a)return null;const moves=[];for(let i=0;i<a.length;i++){let mask=s.a[i];for(let k=0;k<4&&mask!==a[i];k++){moves.push(i);mask=rotPipe(mask);}}return moves;}
function genPipes(z,r){const n=Math.max(4,z+2),count=z,heights=Array(count).fill(1);for(let extra=n-count;extra>0;extra--)heights[ri(r,count)]++;
 const pipe=Array(n*n),masks=Array(n*n).fill(0),ends=[];let base=0;
 for(let p=0;p<count;p++){const path=[],flip=r()<.5,reverse=r()<.5;for(let row=0;row<heights[p];row++){const y=base+(reverse?heights[p]-1-row:row);for(let col=0;col<n;col++){const x=((row%2===0)!==flip)?col:n-1-col;path.push(y*n+x);}}
  path.forEach(i=>pipe[i]=p);for(let k=0;k<path.length-1;k++){const i=path[k],j=path[k+1],d=j===i+1?1:j===i-1?3:j===i+n?2:0;masks[i]|=1<<d;masks[j]|=1<<((d+2)%4);}
  const first=path[0],last=path[path.length-1],fd=first%n===0?3:1,ld=last%n===0?3:1;masks[first]|=1<<fd;masks[last]|=1<<ld;ends.push([[first,fd],[last,ld]]);base+=heights[p];}
 const shape=masks.map(m=>pipeRotations(5).includes(m)?5:3),pz={t:2,mode:'pipes',n,count,pipe,shape,ends};
 // Shuffle orientations only; the hidden construction is discarded. Prove via independent constraint search.
 let s;do{s={a:shape.map(m=>{for(let k=ri(r,4);k>0;k--)m=rotPipe(m);return m;})};}while(pipesSolved(pz,s));
 if(!solvePipes(pz,s))throw new Error('pipe generation verification failed');return {pz,s};}
function sudokuGroups(pz){const n=pz.n,groups=[];for(let y=0;y<n;y++)groups.push(Array.from({length:n},(_,x)=>y*n+x));for(let x=0;x<n;x++)groups.push(Array.from({length:n},(_,y)=>y*n+x));
 for(let y=0;y<n;y+=pz.bh)for(let x=0;x<n;x+=pz.bw){const g=[];for(let dy=0;dy<pz.bh;dy++)for(let dx=0;dx<pz.bw;dx++)g.push((y+dy)*n+x+dx);groups.push(g);}return groups;}
function sudokuValid(pz,a,complete){if(!Array.isArray(a)||a.length!==pz.n*pz.n||a.some(v=>!Number.isInteger(v)||v<0||v>pz.n||complete&&v===0))return false;
 if(pz.given.some((v,i)=>v&&a[i]!==v))return false;return sudokuGroups(pz).every(g=>{const values=g.map(i=>a[i]).filter(Boolean);return new Set(values).size===values.length;});}
function sudokuSearch(pz,a,limit){const groups=sudokuGroups(pz),peers=Array.from({length:a.length},(_,i)=>[...new Set(groups.filter(g=>g.includes(i)).flat().filter(j=>j!==i))]);const out=[];a=a.slice();if(!sudokuValid(pz,a,false))return out;
 function rec(){if(out.length>=limit)return;let best=-1,opts;for(let i=0;i<a.length;i++)if(!a[i]){const used=new Set(peers[i].map(j=>a[j])),v=Array.from({length:pz.n},(_,k)=>k+1).filter(k=>!used.has(k));if(!v.length)return;if(best<0||v.length<opts.length){best=i;opts=v;if(v.length===1)break;}}
  if(best<0){out.push(a.slice());return;}for(const v of opts){a[best]=v;rec();if(out.length>=limit)break;}a[best]=0;}
 rec();return out;}
function solveSudoku(pz,s){const a=sudokuSearch(pz,pz.given,1)[0];return a?a.flatMap((v,i)=>s.a[i]===v?[]:[[i,v]]):null;}
function genSudoku(z,r){const n=z<4?4:z===4?6:9,bh=z<4?2:z===4?2:3,bw=n/bh,pattern=(y,x)=>(bw*(y%bh)+(y/bh|0)+x)%n;
 const rows=shuffle(r,Array.from({length:n/bh},(_,k)=>k)).flatMap(b=>shuffle(r,Array.from({length:bh},(_,k)=>b*bh+k))),cols=shuffle(r,Array.from({length:n/bw},(_,k)=>k)).flatMap(b=>shuffle(r,Array.from({length:bw},(_,k)=>b*bw+k))),digits=shuffle(r,Array.from({length:n},(_,k)=>k+1));
 const given=rows.flatMap(y=>cols.map(x=>digits[pattern(y,x)])),pz={t:2,mode:'sudoku',n,bh,bw,given},target=[0,12,10,8,18,32][z];let left=n*n;
 for(const i of shuffle(r,Array.from({length:n*n},(_,k)=>k))){if(left<=target)break;const v=given[i];given[i]=0;if(sudokuSearch(pz,given,2).length!==1)given[i]=v;else left--;}
 const s={a:given.slice(),wrong:0};if(!solveSudoku(pz,s)||sudokuValid(pz,s.a,true))throw new Error('Sudoku generation verification failed');return {pz,s};}
function genContent(z,r){return z<=2?genPipes(z,r):genSudoku(z,r);}
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
const GEN=[genMirror,genLever,genContent,genBlock,genTile];
function make(type,zone,seed){const r=rng(seed);const g=(type==="pipes"?genPipes:type==="sudoku"?genSudoku:GEN[type])(zone,r);g.pz.zone=zone;g.pz.seed=seed;return g;}
function forRoom(room){return make(room.p,room.z,(room.id+1)*9973+17*room.z);}
function clone(s){return JSON.parse(JSON.stringify(s));}
// apply one move; returns the new state (input not changed). Moves: 0 mirror k, 1 lever i, 2 pipe tile index or Sudoku [cell, value], 3 [block, dir], 4 tile position
function apply(pz,s,mv){s=clone(s);
 if(pz.t===0){if(mv>=0&&mv<pz.mir.length)s.o[mv]^=1;}
 else if(pz.t===1){if(mv>=0&&mv<pz.L)s.p[mv]^=1;}
 else if(pz.t===2){if(pz.mode==="pipes"){if(Number.isInteger(mv)&&mv>=0&&mv<s.a.length)s.a[mv]=rotPipe(s.a[mv]);}
  else if(pz.mode==="sudoku"&&Array.isArray(mv)){const [i,v]=mv;if(Number.isInteger(i)&&i>=0&&i<s.a.length&&!pz.given[i]&&Number.isInteger(v)&&v>=0&&v<=pz.n){s.a[i]=v;s.wrong=sudokuValid(pz,s.a,false)?0:1;}}}
 else if(pz.t===3){const[i,d]=mv;if(blockMoves(pz,s).some(m=>m[0]===i&&m[1]===d))return bstep(pz,s,i,d);}
 else if(pz.t===4){const b=s.a.indexOf(0);if(tileNb(pz.n,b).includes(mv)){s.a[b]=s.a[mv];s.a[mv]=0;}}
 return s;}
function solved(pz,s){if(pz.t===0)return trace(pz,s).exit===pz.tgt;if(pz.t===1)return lamps(pz,s)===pz.full;
 if(pz.t===2)return pz.mode==="pipes"?pipesSolved(pz,s):pz.mode==="sudoku"&&sudokuValid(pz,s.a,true);if(pz.t===3)return bsolved(pz,s);return tsolved(pz,s);}
function params(z){return{mirror:`${DIFF.mirror.n[z]}x${DIFF.mirror.n[z]}, ${DIFF.mirror.m[z]} mirrors, beam must use ${DIFF.mirror.hit[z]}+`,lever:`${DIFF.lever.L[z]} levers/lamps, ${DIFF.lever.minPress[z]}+ presses`,
 pipes:`${DIFF.pipes.count[z]} separate pipe connections`,sudoku:`${DIFF.sudoku.n[z]}x${DIFF.sudoku.n[z]} Sudoku`,block:`${DIFF.block.n[z]}x${DIFF.block.n[z]}, ${DIFF.block.b[z]} blocks, ${DIFF.block.minMoves[z]}+ moves`,tile:`${DIFF.tile.n[z]}x${DIFF.tile.n[z]}, ${DIFF.tile.k[z]} scramble moves`};}
const P={rng,make,forRoom,apply,solved,trace,lamps,occ,blockMoves,bfsBlocks,solvePipes,solveSudoku,sudokuSearch,sudokuValid,pipesSolved,rotPipe,tileNb,minPress,DIFF,NAMES,params,clone};
if(typeof module!=="undefined"&&module.exports)module.exports=P;else root.PUZ=P;
})(this);
