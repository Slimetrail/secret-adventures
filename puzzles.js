/* Secret of the Adventure - Stage 3 puzzle logic (no drawing). Same code runs in the game and in node (tools/solver.js).
   Every puzzle is made from a fixed seed per room, so a reload gives the same puzzle. Types: 0 mirror beams, 1 Lights Out (t2768u, was levers),
   2 pipe connections (zones 1-2) or Sudoku (zones 3-5), 3 moving blocks, 4 sliding tiles.
   t2768u: type 1 (was levers) is now Lights Out: a square grid of lights; a press flips that light and its 4 neighbours; goal is all lights off. */
(function(root){
"use strict";
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const ri=(r,n)=>Math.floor(r()*n);
const NAMES=["Mirror beams","Lights Out","Pipes / Sudoku","Moving blocks","Sliding tiles"];
// t2766u/t2771u: ONE tier table (index = tier). Zone z uses tier ZONE_TIER[z] = z+1; the boss door (story.js FINAL_LOCK*) uses tier 7.
// Tier 1 is the old zone 1 row (no zone uses it now). Every type gets strictly harder on tiers 2..7 (z1<z2<z3<z4<z5<boss) in a number
// the generator GUARANTEES and the tests measure with a solver: mirror minFlip (fewest mirror turns), lights minPress (fewest presses),
// pipes size, Sudoku blanks (81-clues), block minMoves (fewest block steps, by full search), tile minDist (Manhattan lower bound on slides).
// t2768u: lights = Lights Out (type 1, was levers): n x n, start made by pressing tiles from all-off.
const DIFF={
 mirror:{n:[0,4,5,6,6,7,7,7],m:[0,3,6,8,10,12,14,16],hit:[0,2,3,4,5,6,7,8],minFlip:[0,1,2,3,4,5,6,7]},
 lights:{n:[0,3,3,4,4,5,5,5],minPress:[0,2,5,6,7,9,11,14]},
 pipes:{n:[0,4,5,6,7,8,9,10],count:[0,2,3,4,5,6,7,8]},
 sudoku:{n:[0,4,6,6,9,9,9,9],bh:[0,2,2,2,3,3,3,3],clues:[0,8,20,16,34,29,26,25]},
 block:{n:[0,4,6,6,6,6,6,6],b:[0,3,6,7,8,9,10,11],minMoves:[0,3,10,13,16,19,22,28]},
 tile:{n:[0,3,3,4,4,4,5,5],minDist:[0,4,14,22,30,36,56,72]}};
const ZONE_TIER=[0,2,3,4,5,6],BOSS_TIER=7,TIERS=7;
const tierOf=z=>ZONE_TIER[Math.min(5,Math.max(1,z|0))];
function shuffle(r,a){for(let i=a.length-1;i>0;i--){const j=ri(r,i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
// ---- 0 mirrors ----
function trace(pz,s){const n=pz.n;let x=-1,y=pz.r,dx=1,dy=0;const pts=[[x,y]];const om=new Map();pz.mir.forEach((c,k)=>om.set(c,k));let hits=0;
 for(let g=0;g<400;g++){x+=dx;y+=dy;if(x<0||y<0||x>=n||y>=n){pts.push([x,y]);return{pts,exit:x+","+y,hits};}
  const k=om.get(y*n+x);if(k!==undefined){hits++;pts.push([x,y]);if(s.o[k]===0){const t=dx;dx=-dy;dy=-t;}else{const t=dx;dx=dy;dy=t;}}}
 return{pts,exit:"loop",hits};}
function mirrorWithin(pz,s,k){const m=pz.mir.length,o=s.o.slice();function rec(start,left){if(trace(pz,{o}).exit===pz.tgt)return true;if(!left)return false;
  for(let i=start;i<m;i++){o[i]^=1;const hit=rec(i+1,left-1);o[i]^=1;if(hit)return true;}return false;}return rec(0,k);}
function genMirror(z,r){/* z = tier */const n=DIFF.mirror.n[z],m=DIFF.mirror.m[z],hit=DIFF.mirror.hit[z],need=DIFF.mirror.minFlip[z];
 for(let tr=0;tr<3000;tr++){const cells=shuffle(r,[...Array(n*n).keys()]).slice(0,m);const pz={t:0,n,r:ri(r,n),mir:cells};
  const sol={o:cells.map(()=>ri(r,2))};const tt=trace(pz,sol);if(tt.hits<hit||tt.exit===(-1)+","+pz.r||tt.exit==="loop")continue;pz.tgt=tt.exit;
  for(let k=0;k<40;k++){const s={o:cells.map(()=>ri(r,2))};if(!mirrorWithin(pz,s,need-1))return{pz,s};}}
 throw new Error("mirror gen");}
// ---- 1 Lights Out (t2768u) ----
// state s.g = n*n lights (1 on, 0 off). press(i) flips i and its 4 orthogonal neighbours.
function lightsMask(n,i){const x=i%n,y=(i/n)|0,o=[i];if(y>0)o.push(i-n);if(x<n-1)o.push(i+1);if(y<n-1)o.push(i+n);if(x>0)o.push(i-1);return o;}
function lightsPress(n,g,i){g=g.slice();for(const j of lightsMask(n,i))g[j]^=1;return g;}
// GF(2) solve: all press sets that turn g fully off; returns the smallest one (array of tile indices) or null if none.
function lightsSolve(n,g){const N=n*n,rows=[];for(let j=0;j<N;j++){const r=new Uint8Array(N+1);for(const i of lightsMask(n,j))r[i]=1;r[N]=g[j]?1:0;rows.push(r);}
 const piv=[];let rk=0;for(let c=0;c<N&&rk<N;c++){let p=-1;for(let k=rk;k<N;k++)if(rows[k][c]){p=k;break;}if(p<0)continue;[rows[rk],rows[p]]=[rows[p],rows[rk]];
  for(let k=0;k<N;k++)if(k!==rk&&rows[k][c])for(let t=c;t<=N;t++)rows[k][t]^=rows[rk][t];piv.push(c);rk++;}
 for(let k=rk;k<N;k++)if(rows[k][N])return null;const free=[];for(let c=0;c<N;c++)if(!piv.includes(c))free.push(c);let best=null;
 for(let m=0;m<(1<<free.length);m++){const x=new Uint8Array(N);free.forEach((c,k)=>{x[c]=(m>>k)&1;});
  for(let k=rk-1;k>=0;k--){const c=piv[k];let v=rows[k][N];for(let t=c+1;t<N;t++)if(rows[k][t]&&x[t])v^=1;x[c]=v;}
  const sol=[];for(let i=0;i<N;i++)if(x[i])sol.push(i);if(!best||sol.length<best.length)best=sol;}
 return best;}
function lightsOk(pz,s){return !!s&&Array.isArray(s.g)&&s.g.length===pz.n*pz.n&&s.g.every(v=>v===0||v===1);}
// made only by pressing tiles from all-off, so it is always solvable (5x5 has states that are not)
function genLights(z,r){const n=DIFF.lights.n[z],N=n*n,need=DIFF.lights.minPress[z];
 for(let tr=0;tr<4000;tr++){let g=Array(N).fill(0);const pr=[];for(let i=0;i<N;i++)if(r()<.5){g=lightsPress(n,g,i);pr.push(i);}
  if(!g.some(Boolean))continue;const mp=lightsSolve(n,g).length;if(mp<need)continue;return{pz:{t:1,n,start:g.slice(),minPress:mp},s:{g}};}
 throw new Error("lights gen");}
function bits(v){let c=0;while(v){c+=v&1;v>>=1;}return c;}
function minPress(pz,s){const m=lightsSolve(pz.n,(s&&lightsOk(pz,s)?s.g:pz.start));return m?m.length:-1;}
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
function genPipes(z,r){/* z = tier */const n=DIFF.pipes.n[z],count=DIFF.pipes.count[z],heights=Array(count).fill(1);for(let extra=n-count;extra>0;extra--)heights[ri(r,count)]++;
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
function genSudoku(z,r){/* z = tier */const n=DIFF.sudoku.n[z],bh=DIFF.sudoku.bh[z],bw=n/bh,pattern=(y,x)=>(bw*(y%bh)+(y/bh|0)+x)%n,target=DIFF.sudoku.clues[z];let best=null;
 for(let tr=0;tr<12&&!(best&&best.left<=target);tr++){
 const rows=shuffle(r,Array.from({length:n/bh},(_,k)=>k)).flatMap(b=>shuffle(r,Array.from({length:bh},(_,k)=>b*bh+k))),cols=shuffle(r,Array.from({length:n/bw},(_,k)=>k)).flatMap(b=>shuffle(r,Array.from({length:bw},(_,k)=>b*bw+k))),digits=shuffle(r,Array.from({length:n},(_,k)=>k+1));
 const given=rows.flatMap(y=>cols.map(x=>digits[pattern(y,x)])),pz={t:2,mode:'sudoku',n,bh,bw,given};let left=n*n;
 for(const i of shuffle(r,Array.from({length:n*n},(_,k)=>k))){if(left<=target)break;const v=given[i];given[i]=0;if(sudokuSearch(pz,given,2).length!==1)given[i]=v;else left--;}
 if(!best||left<best.left)best={pz,left};}
 const pz=best.pz,s={a:pz.given.slice(),wrong:0};if(!solveSudoku(pz,s)||sudokuValid(pz,s.a,true))throw new Error('Sudoku generation verification failed');return {pz,s};}
// the pipes/Sudoku choice stays by ZONE (zones 1-2 pipes, 3-5 Sudoku); the settings come from the tier
function genContent(t,r,zone){return zone<=2?genPipes(t,r):genSudoku(t,r);}
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
 for(let tr=0;tr<2000;tr++){const ry=ri(r,n);const pz={t:3,n,r:ry,blk:[{h:1,len:2}]};const s={q:[[n-2,ry]]};
  let o=occ(pz,s);for(let b=0,g=0;b<B&&g<300;g++){const h=r()<0.4?1:0,len=(n>=6&&r()<0.3)?3:2,x=ri(r,h?n-len+1:n),y=ri(r,h?n:n-len+1);
   if(h&&y===ry)continue;let ok=true;for(let k=0;k<len;k++)if(o[(h?y:y+k)*n+(h?x+k:x)]>=0)ok=false;if(!ok)continue;pz.blk.push({h,len});s.q.push([x,y]);o=occ(pz,s);b++;}
  if(pz.blk.length<=B)continue;
  const fs=farBlocks(pz,s,12000);if(fs&&(!best||fs.d>best.d))best={pz,s:fs.s,d:fs.d};
  if(best&&best.d>=need)break;}
 if(!best)throw new Error("block gen");return{pz:best.pz,s:best.s};}
// t2766u: true farthest state. BFS the whole reachable set from the solved start, then BFS back from every solved state in it;
// the state with the largest distance needs that many block steps at least (moves are reversible). Numeric keys keep it fast on a phone.
function farBlocks(pz,s0,cap){const n=pz.n,B=pz.blk.length,H=pz.blk.map(b=>b.h),LEN=pz.blk.map(b=>b.len),fix=s0.q.map(p=>p.slice()),pw=[];for(let i=0,v=1;i<B;i++,v*=n)pw.push(v);
 const pos0=s0.q.map((p,i)=>H[i]?p[0]:p[1]),key=a=>{let k=0;for(let i=0;i<B;i++)k+=a[i]*pw[i];return k;};
 const ids=new Map(),states=[],o=new Int8Array(n*n);const fill=a=>{o.fill(-1);for(let i=0;i<B;i++){const x=H[i]?a[i]:fix[i][0],y=H[i]?fix[i][1]:a[i];for(let k=0;k<LEN[i];k++)o[(H[i]?y:y+k)*n+(H[i]?x+k:x)]=i;}};
 const nbrs=a=>{fill(a);const out=[];for(let i=0;i<B;i++){const p=a[i],x=H[i]?p:fix[i][0],y=H[i]?fix[i][1]:p;
   if(H[i]){if(x>0&&o[y*n+x-1]<0)out.push(i,-1);if(x+LEN[i]<n&&o[y*n+x+LEN[i]]<0)out.push(i,1);}else{if(y>0&&o[(y-1)*n+x]<0)out.push(i,-1);if(y+LEN[i]<n&&o[(y+LEN[i])*n+x]<0)out.push(i,1);}}return out;};
 ids.set(key(pos0),0);states.push(Int8Array.from(pos0));const adj=[];
 for(let h=0;h<states.length;h++){if(states.length>=cap)return null;const a=states[h],nb=nbrs(a),list=[];for(let j=0;j<nb.length;j+=2){const t=a.slice();t[nb[j]]+=nb[j+1];const k=key(t);let id=ids.get(k);if(id===undefined){id=states.length;ids.set(k,id);states.push(t);}list.push(id);}adj.push(list);}
 const dist=new Int32Array(states.length).fill(-1),q=[];for(let k=0;k<states.length;k++)if(states[k][0]+LEN[0]===n){dist[k]=0;q.push(k);}
 for(let h=0;h<q.length;h++){const k=q[h];for(const j of adj[k])if(dist[j]<0){dist[j]=dist[k]+1;q.push(j);}}
 let b=0;for(let k=1;k<states.length;k++)if(dist[k]>dist[b])b=k;if(!(dist[b]>0))return null;
 const qq=fix.map((p,i)=>H[i]?[states[b][i],p[1]]:[p[0],states[b][i]]);return{s:{q:qq},d:dist[b]};}
// ---- 4 sliding tiles (put the numbers in order, gap at the end) ----
function tileNb(n,b){const x=b%n,y=(b/n)|0,o=[];if(y>0)o.push(b-n);if(x<n-1)o.push(b+1);if(y<n-1)o.push(b+n);if(x>0)o.push(b-1);return o;}
function tsolved(pz,s){for(let i=0;i<s.a.length-1;i++)if(s.a[i]!==i+1)return false;return true;}
function tileMan(n,a){let h=0;for(let i=0;i<a.length;i++){const v=a[i];if(v){const g=v-1;h+=Math.abs(g%n-i%n)+Math.abs(((g/n)|0)-((i/n)|0));}}return h;}
// made by sliding from the solved board (always solvable); keeps sliding until the Manhattan distance (a lower bound on the slides needed) reaches minDist
function genTile(z,r){const n=DIFF.tile.n[z],need=DIFF.tile.minDist[z];
 for(let tr=0;tr<50;tr++){const a=[...Array(n*n-1).keys()].map(x=>x+1);a.push(0);let b=n*n-1,prev=-1;
  for(let i=0;i<20000;i++){const nb=tileNb(n,b).filter(p=>p!==prev);const p=nb[ri(r,nb.length)];a[b]=a[p];a[p]=0;prev=b;b=p;if(i>=need&&b===n*n-1&&tileMan(n,a)>=need)break;}
  const s={a};if(!tsolved({n},s)&&tileMan(n,a)>=need)return{pz:{t:4,n,minDist:tileMan(n,a)},s};}
 throw new Error("tile gen");}
// ---- common ----
const GEN=[genMirror,genLights,genContent,genBlock,genTile];
// make(type, zone, seed[, tier]): tier defaults to the zone's tier (ZONE_TIER); the boss door passes BOSS_TIER. pz.zone stays the zone (colours, title).
function make(type,zone,seed,tier){const t=tier||tierOf(zone),r=rng(seed);const g=(type==="pipes"?genPipes:type==="sudoku"?genSudoku:GEN[type])(t,r,zone);g.pz.zone=zone;g.pz.tier=t;g.pz.seed=seed;return g;}
// t2768u: a kept state from before this change (old lever shape {p:[...]}) or any state that does not fit the puzzle is not used; the caller starts fresh.
function fits(pz,s){if(!s||typeof s!=="object")return false;if(pz.t===0)return Array.isArray(s.o)&&s.o.length===pz.mir.length;if(pz.t===1)return lightsOk(pz,s);
 if(pz.t===2)return Array.isArray(s.a)&&s.a.length===(pz.mode==="pipes"?pz.shape.length:pz.n*pz.n);if(pz.t===3)return Array.isArray(s.q)&&s.q.length===pz.blk.length;return Array.isArray(s.a)&&s.a.length===pz.n*pz.n;}
function forRoom(room){return make(room.p,room.z,(room.id+1)*9973+17*room.z);}
function clone(s){return JSON.parse(JSON.stringify(s));}
// apply one move; returns the new state (input not changed). Moves: 0 mirror k, 1 Lights Out tile i, 2 pipe tile index or Sudoku [cell, value], 3 [block, dir], 4 tile position
function apply(pz,s,mv){s=clone(s);
 if(pz.t===0){if(mv>=0&&mv<pz.mir.length)s.o[mv]^=1;}
 else if(pz.t===1){if(lightsOk(pz,s)&&Number.isInteger(mv)&&mv>=0&&mv<pz.n*pz.n)s.g=lightsPress(pz.n,s.g,mv);}
 else if(pz.t===2){if(pz.mode==="pipes"){if(Number.isInteger(mv)&&mv>=0&&mv<s.a.length)s.a[mv]=rotPipe(s.a[mv]);}
  else if(pz.mode==="sudoku"&&Array.isArray(mv)){const [i,v]=mv;if(Number.isInteger(i)&&i>=0&&i<s.a.length&&!pz.given[i]&&Number.isInteger(v)&&v>=0&&v<=pz.n){s.a[i]=v;s.wrong=sudokuValid(pz,s.a,false)?0:1;}}}
 else if(pz.t===3){const[i,d]=mv;if(blockMoves(pz,s).some(m=>m[0]===i&&m[1]===d))return bstep(pz,s,i,d);}
 else if(pz.t===4){const b=s.a.indexOf(0);if(tileNb(pz.n,b).includes(mv)){s.a[b]=s.a[mv];s.a[mv]=0;}}
 return s;}
function solved(pz,s){if(pz.t===0)return trace(pz,s).exit===pz.tgt;if(pz.t===1)return lightsOk(pz,s)&&s.g.every(v=>v===0);
 if(pz.t===2)return pz.mode==="pipes"?pipesSolved(pz,s):pz.mode==="sudoku"&&sudokuValid(pz,s.a,true);if(pz.t===3)return bsolved(pz,s);return tsolved(pz,s);}
function paramsTier(t){const D=DIFF;return{mirror:`${D.mirror.n[t]}x${D.mirror.n[t]}, ${D.mirror.m[t]} mirrors, beam uses ${D.mirror.hit[t]}+, ${D.mirror.minFlip[t]}+ turns`,lights:`${D.lights.n[t]}x${D.lights.n[t]} Lights Out, ${D.lights.minPress[t]}+ presses`,
 pipes:`${D.pipes.n[t]}x${D.pipes.n[t]}, ${D.pipes.count[t]} separate pipe connections`,sudoku:`${D.sudoku.n[t]}x${D.sudoku.n[t]} Sudoku, ${D.sudoku.clues[t]} or fewer clues`,block:`${D.block.n[t]}x${D.block.n[t]}, ${D.block.b[t]} blocks, ${D.block.minMoves[t]}+ moves`,tile:`${D.tile.n[t]}x${D.tile.n[t]}, ${D.tile.minDist[t]}+ slides`};}
function params(z){return paramsTier(tierOf(z));}
const P={rng,make,forRoom,apply,solved,fits,trace,lightsMask,lightsPress,lightsSolve,mirrorWithin,tileMan,occ,farBlocks,blockMoves,bfsBlocks,solvePipes,solveSudoku,sudokuSearch,sudokuValid,pipesSolved,rotPipe,tileNb,minPress,DIFF,ZONE_TIER,BOSS_TIER,TIERS,tierOf,NAMES,params,paramsTier,clone};
if(typeof module!=="undefined"&&module.exports)module.exports=P;else root.PUZ=P;
})(this);
