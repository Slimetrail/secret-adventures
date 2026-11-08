// Proves every room puzzle can be solved: finds a solution by search (not from the generator) and replays it through PUZ.apply.
// Usage: node tools/solver.js            -> checks all rooms, prints a summary, exit 1 on any problem
//        node tools/solver.js moves <id> -> prints JSON moves for one room (test helper; never shown in the game)
const P=require("../puzzles.js"),fs=require("fs"),path=require("path");
const src=fs.readFileSync(path.join(__dirname,"..","maze-data.js"),"utf8");const window={};eval(src);const M=window.MAZE;
function idaTiles(pz,s0){const n=pz.n,N2=n*n;const a=s0.a.slice();const man=()=>{let h=0;for(let i=0;i<N2;i++){const v=a[i];if(v){const g=v-1;h+=Math.abs(g%n-i%n)+Math.abs(((g/n)|0)-((i/n)|0));}}return h;};
 let b=a.indexOf(0),path=[];let bound=man();
 function dfs(g,prev){const h=man();if(g+h>bound)return g+h;if(h===0)return -1;let min=1e9;
  for(const p of P.tileNb(n,b)){if(p===prev)continue;const ob=b;a[ob]=a[p];a[p]=0;b=p;path.push(p);const t=dfs(g+1,ob);if(t===-1)return -1;if(t<min)min=t;path.pop();a[p]=a[ob];a[ob]=0;b=ob;}return min;}
 for(let it=0;it<80;it++){const t=dfs(0,-1);if(t===-1)return path.slice();bound=t;}return null;}
function solve(pz,s){
 if(pz.t===0){const m=pz.mir.length;for(let k=0;k<(1<<m);k++){const o=pz.mir.map((_,i)=>(k>>i)&1);if(P.trace(pz,{o}).exit===pz.tgt){const mv=[];o.forEach((v,i)=>{if(v!==s.o[i])mv.push(i);});return mv;}}return null;}
 if(pz.t===1){for(let k=0;k<(1<<pz.L);k++){let v=P.lamps(pz,s);for(let i=0;i<pz.L;i++)if(k>>i&1)v^=pz.eff[i];if(v===pz.full){const mv=[];for(let i=0;i<pz.L;i++)if(k>>i&1)mv.push(i);return mv;}}return null;}
 if(pz.t===2)return pz.mode==="pipes"?P.solvePipes(pz,s):pz.mode==="sudoku"?P.solveSudoku(pz,s):null;
 if(pz.t===3)return P.bfsBlocks(pz,s,200000);
 if(pz.t===4)return idaTiles(pz,s);}
function check(room){const g=P.forRoom(room),g2=P.forRoom(room);const det=JSON.stringify(g)===JSON.stringify(g2);
 const mv=solve(g.pz,g.s);let s=g.s;if(mv)for(const m of mv)s=P.apply(g.pz,s,m);
 return{id:room.id,zone:room.z,type:room.p,mode:g.pz.mode||null,det,startSolved:P.solved(g.pz,g.s),found:!!mv,replayOk:!!mv&&P.solved(g.pz,s),moves:mv?mv.length:-1,mv};}
module.exports={solve,check,M};
if(require.main===module){
 if(process.argv[2]==="moves"){const r=check(M.rooms[+process.argv[3]]);console.log(JSON.stringify(r.mv));process.exit(0);}
 let bad=0;const rows=[];for(const room of M.rooms){const r=check(room);if(!r.det||r.startSolved||!r.found||!r.replayOk){bad++;console.log("PROBLEM",JSON.stringify(Object.assign({},r,{mv:undefined})));}rows.push(r);}
 const by={};rows.forEach(r=>{const k=r.zone+"/"+(r.mode||P.NAMES[r.type]);(by[k]=by[k]||[]).push(r.moves);});
 for(const k of Object.keys(by).sort())console.log(k.padEnd(22),"rooms",by[k].length,"verified");
 console.log(bad?`FAILED ${bad}`:`ALL ${rows.length} ROOMS SOLVABLE (found by search, replayed in game logic, start not solved, same puzzle every time)`);process.exit(bad?1:0);}
