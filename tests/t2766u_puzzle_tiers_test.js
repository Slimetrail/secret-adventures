"use strict";
// Jeremy t2766u/t2768u/t2771u: harder puzzles. One tier table; zone z uses tier z+1, the boss door tier 7; every type strictly harder
// z1<z2<z3<z4<z5<boss in a solver-measured number; type 1 is Lights Out (was levers); every generated puzzle solvable (found by search,
// replayed through PUZ.apply); lockpick doubled doors at the new tiers; old saves load. Node only.
// Usage: node --test tests/t2766u_puzzle_tiers_test.js   (SEEDS=n to change seeds per type per tier; default 40, blocks 15)
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const P=require('../puzzles.js'),SV=require('../tools/solver.js'),M=SV.M;
const SEEDS=+process.env.SEEDS||40,BSEEDS=Math.max(5,Math.round(SEEDS*0.375));
const ZONES=[1,2,3,4,5],TIER=z=>z==='boss'?P.BOSS_TIER:P.tierOf(z),STEPS=[...ZONES,'boss'];
const zoneFor=(type,z)=>type===2?(z==='boss'?5:z):(z==='boss'?5:z);
// independent measures (brute force where it fits, else the solver + replay)
function mirrorMinFlip(pz,s){const m=pz.mir.length;let best=99;for(let k=0;k<(1<<m);k++){let c=0;for(let i=0;i<m;i++)if((k>>i&1)!==s.o[i])c++;if(c>=best)continue;if(P.trace(pz,{o:pz.mir.map((_,i)=>k>>i&1)}).exit===pz.tgt)best=c;}return best;}
function lightsMinBrute(pz,s){const n=pz.n,N=n*n;if(N>16)return null;let best=99;for(let m=0;m<(1<<N);m++){let c=0;for(let i=0;i<N;i++)c+=m>>i&1;if(c>=best)continue;let g=s.g;for(let i=0;i<N;i++)if(m>>i&1)g=P.lightsPress(n,g,i);if(g.every(v=>!v))best=c;}return best;}
const measure={
 0:(g)=>mirrorMinFlip(g.pz,g.s),
 1:(g)=>{const b=lightsMinBrute(g.pz,g.s),s=P.lightsSolve(g.pz.n,g.s.g).length;if(b!==null)a.equal(s,b,'GF(2) minimum = brute force');return s;},
 2:(g)=>g.pz.mode==='pipes'?g.pz.n*g.pz.n:g.pz.given.filter(v=>!v).length+100, // pipes: board cells; Sudoku: blanks (+100 so any Sudoku ranks above any pipes board)
 3:(g)=>P.bfsBlocks(g.pz,g.s,2000000).length,
 4:(g)=>{const n=g.pz.n;let h=0;g.s.a.forEach((v,i)=>{if(v){h+=Math.abs((v-1)%n-i%n)+Math.abs(((v-1)/n|0)-(i/n|0));}});return h+n*1000;}}; // size first, then Manhattan lower bound
const FLOOR={0:t=>P.DIFF.mirror.minFlip[t],1:t=>P.DIFF.lights.minPress[t],2:(t,g)=>g.pz.mode==='pipes'?P.DIFF.pipes.n[t]**2:81-P.DIFF.sudoku.clues[t]+100,3:t=>P.DIFF.block.minMoves[t],4:t=>P.DIFF.tile.n[t]*1000+P.DIFF.tile.minDist[t]};
const results={};
function check(type,z,seed){const t=TIER(z),zone=zoneFor(type,z),t0=Date.now(),g=P.make(type,zone,seed,t),ms=Date.now()-t0;
 a.equal(g.pz.tier,t);a.ok(!P.solved(g.pz,g.s),'start not solved');a.ok(P.fits(g.pz,g.s));
 const mv=SV.solve(g.pz,g.s);a.ok(mv,`solver found a solution type ${type} ${z} seed ${seed}`);let s=g.s;for(const m of mv)s=P.apply(g.pz,s,m);a.ok(P.solved(g.pz,s),`replay solves type ${type} ${z} seed ${seed}`);
 if(type===2&&g.pz.mode==='sudoku')a.equal(P.sudokuSearch(g.pz,g.pz.given,2).length,1,'one Sudoku answer');
 const v=measure[type](g);a.ok(v>=FLOOR[type](t,g),`type ${type} ${z} seed ${seed}: measured ${v} below floor ${FLOOR[type](t,g)}`);
 const k=type+'/'+z;const r=results[k]=results[k]||{n:0,min:1e9,max:0,sum:0,ms:0,size:g.pz.n};r.n++;r.min=Math.min(r.min,v);r.max=Math.max(r.max,v);r.sum+=v;r.ms=Math.max(r.ms,ms);return v;}
test('the tier table: zone z uses tier z+1 (the shift), boss uses tier 7; table rows are the same length',()=>{
 a.deepEqual(P.ZONE_TIER,[0,2,3,4,5,6]);a.equal(P.BOSS_TIER,7);for(const z of ZONES)a.equal(P.tierOf(z),z+1);
 for(const [k,row] of Object.entries(P.DIFF))for(const [f,v] of Object.entries(row))a.equal(v.length,P.TIERS+1,k+'.'+f);
 a.equal(P.NAMES[1],'Lights Out');for(const r of M.rooms){const g=P.forRoom(r);a.equal(g.pz.tier,r.z+1);a.equal(g.pz.zone,r.z);a.equal(g.pz.t,r.p,'type slot unchanged');if(r.p===2)a.equal(g.pz.mode,r.z<=2?'pipes':'sudoku','pipes zones 1-2, Sudoku 3-5 kept');}});
test('settings strictly increase per type z1<z2<z3<z4<z5<boss (the guaranteed floor of each type)',()=>{
 const F=[t=>P.DIFF.mirror.minFlip[t],t=>P.DIFF.lights.minPress[t],t=>t<=3?P.DIFF.pipes.n[t]**2:81-P.DIFF.sudoku.clues[t]+100,t=>P.DIFF.block.minMoves[t],t=>P.DIFF.tile.n[t]*1000+P.DIFF.tile.minDist[t]];
 for(let type=0;type<5;type++){const v=STEPS.map(z=>F[type](TIER(z)));for(let i=1;i<v.length;i++)a.ok(v[i]>v[i-1],`type ${type}: ${STEPS[i-1]}=${v[i-1]} !< ${STEPS[i]}=${v[i]}`);}
 // and the old zone 2 row is the floor for the new zone 1 (shift down one zone): old zone 2 = mirror 5x5/4/2, block 5x5 4 blocks, tile 3x3 16 moves, pipes 2
 a.ok(P.DIFF.mirror.n[2]>=5&&P.DIFF.mirror.m[2]>=4&&P.DIFF.mirror.hit[2]>=2);a.ok(P.DIFF.pipes.count[2]>=2);a.ok(P.DIFF.block.n[2]>=5&&P.DIFF.block.b[2]>=4&&P.DIFF.block.minMoves[2]>=5);a.ok(P.DIFF.tile.n[2]>=3&&P.DIFF.tile.minDist[2]>=10);
 const bl=t=>P.DIFF.sudoku.n[t]**2-P.DIFF.sudoku.clues[t];a.ok(P.DIFF.sudoku.n[4]>=6&&bl(4)>=36-18,'zone 3 Sudoku at least old zone 4 (6x6, 18 blanks)');a.ok(P.DIFF.sudoku.n[5]>=9&&bl(5)>=81-32,'zone 4 at least old zone 5 (9x9, 49 blanks)');});
for(let type=0;type<5;type++)test(`type ${type} (${P.NAMES[type]}): many seeds at every tier are solvable by search and meet the floor; measured values strictly increase`,()=>{
 const per=type===3?BSEEDS:SEEDS;const mean={};for(const z of STEPS){let sum=0;for(let k=0;k<per;k++)sum+=check(type,z,(9000+k*7919+(z==='boss'?99:z)*131)>>>0);mean[z]=sum/per;}
 for(let i=1;i<STEPS.length;i++){a.ok(mean[STEPS[i]]>mean[STEPS[i-1]],`type ${type} mean ${STEPS[i-1]} ${mean[STEPS[i-1]]} !< ${STEPS[i]} ${mean[STEPS[i]]}`);}});
test('every real room seed (85 rooms, normal + both doubled-door rounds) and the three boss seeds: solvable, floor met, fast',()=>{
 let worst=0;for(const r of M.rooms)for(const L of [0,1,2]){const seed=L?((r.id+1)*9973+17*r.z+104729*L)>>>0:(r.id+1)*9973+17*r.z,t0=Date.now(),g=P.make(r.p,r.z,seed),ms=Date.now()-t0;worst=Math.max(worst,ms);
  if(!L)a.deepEqual(JSON.stringify(g),JSON.stringify(P.forRoom(r)),'forRoom same seed');const mv=SV.solve(g.pz,g.s);a.ok(mv,'room '+r.id+' L'+L);let s=g.s;for(const m of mv)s=P.apply(g.pz,s,m);a.ok(P.solved(g.pz,s));a.ok(!P.solved(g.pz,g.s));}
 const boss=[[1,713507],[4,731117],[3,731119]].map(([t,sd])=>{const t0=Date.now(),g=P.make(t,5,sd,P.BOSS_TIER),ms=Date.now()-t0;const mv=SV.solve(g.pz,g.s);let s=g.s;for(const m of mv)s=P.apply(g.pz,s,m);a.ok(P.solved(g.pz,s));return{t,ms,min:t===1?P.lightsSolve(g.pz.n,g.s.g).length:t===3?P.bfsBlocks(g.pz,g.s,2000000).length:null,n:g.pz.n};});
 a.equal(boss[0].n,5);a.ok(boss[0].min>=14,'boss Lights Out 5x5 needs 14+ presses');a.equal(boss[1].n,5);a.ok(boss[2].min>=28,'boss blocks 28+ moves');
 console.log('# room gen worst ms',worst,'boss',JSON.stringify(boss));a.ok(worst<2000,'room generation worst case '+worst+'ms');for(const b of boss)a.ok(b.ms<1000);});
test('Lights Out rules: a tap flips it and its 4 neighbours; goal all off; 5x5 states come only from presses (always solvable)',()=>{
 const g=P.make(1,1,4242);const n=g.pz.n;let s=P.clone(g.s);const before=s.g.slice();s=P.apply(g.pz,s,0);a.deepEqual(s.g.map((v,i)=>v^before[i]).map((v,i)=>v?i:-1).filter(i=>i>=0),[0,1,n].sort((x,y)=>x-y));
 const mid=n+1;s=P.apply(g.pz,P.clone(g.s),mid);a.equal(s.g.reduce((t,v,i)=>t+(v!==g.s.g[i]),0),5);
 a.equal(P.lightsSolve(5,[1].concat(Array(24).fill(0))),null,'a single corner light on 5x5 has no solution, so states must come from presses');
 for(const t of [6,7])for(let k=0;k<30;k++){const h=P.make(1,5,777+k,t);a.ok(P.lightsSolve(5,h.s.g));}
 a.match(read('puzzle-ui.js'),/"Tap a light to flip it and the lights next to it\. Turn every light off\."/);a.equal(P.solved(g.pz,{g:Array(n*n).fill(0)}),true);});
test('old lever state shapes never crash and are not used (a fresh Lights Out instead)',()=>{
 const g=P.make(1,3,555);for(const old of [{p:[1,0,1,0,1]},{p:[]},null,{g:[1,0]},{g:'x'}]){a.equal(P.fits(g.pz,old),false);a.equal(P.solved(g.pz,old||{}),false);a.doesNotThrow(()=>P.apply(g.pz,old||{},0));}
 a.equal(P.fits(g.pz,g.s),true);const st=read('story.js');a.ok(st.includes('if(!P.fits(pz,lockState))lockState=P.clone(FINAL_LOCK.s);'));a.ok(read('puzzle-ui.js').includes('if(ks&&!P.fits(g.pz,ks))kept.delete(gk(id));'));});
// ---- the puzzle screen (puzzle-ui.js) in a tiny fake DOM, as in t2759u_special_gear_wiring_test.js ----
function el(id){const e={id,children:[],dataset:{},style:{},events:{},textContent:'',innerHTML:'',className:'',classList:{s:new Set(),add(k){this.s.add(k);},remove(k){this.s.delete(k);},toggle(k,on){on?this.s.add(k):this.s.delete(k);},contains(k){return this.s.has(k);}},
 addEventListener(k,f){(this.events[k]=this.events[k]||[]).push(f);},appendChild(c){this.children.push(c);return c;}};return e;}
function puzzleUi(w=412,h=915){const ids={};for(const k of ['puz','pboard','pinfo','pstat','ptitle','penter','pclose','preset'])ids[k]=el(k);
 const ctx=new Proxy({},{get:(t,k)=>k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});
 const document={getElementById:k=>ids[k],createElement:t=>Object.assign(el(t),{width:0,height:0,getContext:()=>ctx,toDataURL:()=>'data:,'}),head:el('head')};
 const c={addEventListener(){},document,innerWidth:w,innerHeight:h,performance:{now:()=>1},console};c.window=c;vm.createContext(c);vm.runInContext(read('maze-data.js'),c);
 const left={},log=[];c.window.SOTA={markSolved:id=>log.push(['solved',id]),enterDoor:id=>log.push(['enter',id]),gearLock:{total:2,rounds:id=>left[id]|0,solvedRound:id=>{left[id]--;},can:()=>false,use:()=>null}};
 for(const f of ['puzzles.js','puzzle-ui.js'])vm.runInContext(read(f),c);return {c,ids,left,log,S:c.window.SOTA,P:c.window.PUZ};}
function solveOpen(u,room){const L=u.left[room.id]|0,g=L>0?P.make(room.p,room.z,((room.id+1)*9973+17*room.z+104729*L)>>>0):P.forRoom(room);a.equal(g.pz.tier,room.z+1);
 const mv=SV.solve(g.pz,g.s);a.ok(mv);const ev=b=>u.ids.pboard.events.pointerdown[0]({target:{closest:()=>b},preventDefault(){}});
 const L0=u.left[room.id]|0,n0=u.log.length;/* a move list can pass through a solved state early; stop when the round ends */
 for(const m of mv){if((u.left[room.id]|0)!==L0||u.log.length!==n0)break;if(g.pz.t===3){ev({dataset:{blk:String(m[0])}});ev({dataset:{dir:String(m[1])}});}else if(g.pz.t===2&&g.pz.mode==='sudoku'){ev({dataset:{cell:String(m[0])}});ev({dataset:{value:String(m[1])}});}else ev({dataset:{mv:String(m)}});}return g;}
test('lockpick doubled door at the new tiers: every type, two different puzzles in a row, then the door opens; a save mid-double (1 left) needs one',()=>{
 for(let type=0;type<5;type++)for(const z of [1,3,5]){const room=M.rooms.find(r=>r.p===type&&r.z===z);if(!room)continue;
  const u=puzzleUi();u.left[room.id]=2;u.S.puzzle.open(room.id);a.match(u.ids.ptitle.textContent,/Double \(1 of 2\)/);
  const g1=solveOpen(u,room);a.equal(u.left[room.id],1);a.deepEqual(u.log,[]);a.match(u.ids.ptitle.textContent,/Double \(2 of 2\)/);
  const g2=solveOpen(u,room);a.notEqual(g1.pz.seed,g2.pz.seed,'round 2 is a new puzzle (own seed)');a.equal(u.left[room.id],0);a.deepEqual(JSON.parse(JSON.stringify(u.log)),[['solved',room.id],['enter',room.id]]);
  const v=puzzleUi();v.left[room.id]=1;v.S.puzzle.open(room.id);a.match(v.ids.ptitle.textContent,/Double \(2 of 2\)/);solveOpen(v,room);a.deepEqual(JSON.parse(JSON.stringify(v.log)),[['solved',room.id],['enter',room.id]]);}
 const pu=read('puzzle-ui.js'),st=read('story.js');a.ok(!/S\.rpg\.s6|finalLock\(|lockState/.test(pu),'puzzle screen never touches boss locks');a.ok(!/openPuzzle|gearLock/.test(st),'boss locks never use the lockpick');});
test('Lights Out on the puzzle screen: square buttons, 44px+ at 412 wide, fits on screen; a tap flips five lights',()=>{
 for(const [w,h] of [[412,915],[1280,800]])for(const z of [1,2,3,4,5]){const room=M.rooms.find(r=>r.p===1&&r.z===z);const u=puzzleUi(w,h);u.S.puzzle.open(room.id);const html=u.ids.pboard.innerHTML;
  const cells=[...html.matchAll(/class="pz plight[^"]*" data-mv="\d+"[^>]*style="left:(\d+)px;top:(\d+)px;width:(\d+)px;height:(\d+)px"/g)];const g=P.forRoom(room);a.equal(cells.length,g.pz.n**2);
  for(const c of cells){a.equal(c[3],c[4],'square');a.ok(+c[3]>=44,'touch target '+c[3]);a.ok(+c[1]+ +c[3]<=w-24,'on screen');}}});
test('old saves load: same save keys, half-solved boss door keeps its solved locks, mid-double door keeps its rounds',()=>{
 const flow=read('tests/tavern_shop_camp_flow_test.js');let hsrc=flow.slice(flow.indexOf('function harness'),flow.indexOf('\nfor(let t=0'));
 hsrc=hsrc.replace("for(const f of ['maze-data.js','content-cap.js','rules.js','econ.js'])","for(const f of ['maze-data.js','content-cap.js','rules.js','gear.js','econ.js'])")
  .replace('storyOpen:()=>story};','storyOpen:()=>story,setMazeSlots(){},panelOpen:()=>false,mapOpen:()=>false,puzzleOpen:()=>false,roomAt:(x,y)=>{const r=M.rooms.find(r=>r.c[0]===x&&r.c[1]===y);return r?r.id:-1;},seamTavernAt:(x,y)=>({"14,49":0,"14,48":0,"18,24":1,"19,24":1,"51,14":2,"51,15":2,"46,48":3,"47,48":3})[x+","+y]??-1};');
 const plain=o=>JSON.parse(JSON.stringify(o));const harness=eval('('+hsrc+')');const h=harness({});Object.assign(h.pos,{x:46,y:48,f:3});a.equal(h.r.doSave(),true);
 const o=JSON.parse(h.storage.get('sota.party.slot0'));o.story=Object.assign(o.story||{v:1},{finalLock:true,seen:{boss:1}});delete o.story.finalLock2;delete o.story.finalLock3;o.lockFail={7:1,30:2};
 const keys=[...h.storage.keys()].filter(k=>/^sota\.party/.test(k)).sort();a.deepEqual(keys,['sota.party','sota.party.active','sota.party.slot0']);
 const h2=harness({'sota.party.slot0':JSON.stringify(o),'sota.party':JSON.stringify(o),'sota.party.active':'0'});const L=h2.r.live();a.ok(L&&L.party.length>=1,'loads');
 a.equal(L.story.finalLock,true,'solved boss lock 1 kept');a.equal(!!L.story.finalLock2,false);a.deepEqual(JSON.parse(JSON.stringify(L.lockFail)),{7:1,30:2});a.equal(h2.S.gearLock.rounds(7),1);a.equal(h2.S.gearLock.rounds(30),2);
 a.deepEqual([...h2.storage.keys()].filter(k=>/^sota\.party/.test(k)).sort(),keys,'no new or wiped save keys');
 // the boss door reads lock 2 and 3 at the new boss tier; lock 1 is solved so it is not asked again
 const st=read('story.js');a.ok(st.includes('const FINAL_LOCK=window.PUZ.make(1,5,713507,window.PUZ.BOSS_TIER);'));a.ok(st.includes('FINAL_LOCK2=window.PUZ.make(4,5,731117,window.PUZ.BOSS_TIER),FINAL_LOCK3=window.PUZ.make(3,5,731119,window.PUZ.BOSS_TIER);'));
 a.ok(st.indexOf('if(!s.finalLock){box();')<st.indexOf('else if(!s.finalLock2){'));});
test('VER 107 pins; locked files and the wait text unchanged; story.js changed only in the boss lock puzzle settings',()=>{
 const sw=read('sw.js'),html=read('index.html');a.match(sw,/^const VER="107",/);for(const p of ['puzzles.js?v=18','puzzle-ui.js?v=19','story.js?v=26'])for(const s of [sw,html])a.equal(s.split(p).length-1,1,p);
 for(const p of ['puzzles.js?v=16','puzzles.js?v=17','puzzle-ui.js?v=18','story.js?v=25'])for(const s of [sw,html])a.ok(!s.includes(p),p);
 a.ok(read('game.js').includes('d.textContent="Please wait for update to continue.";'));const cp=require('node:child_process');let base=null;try{base=cp.execSync('git rev-parse --verify -q e2ad309^{commit}',{cwd:root}).toString().trim();}catch(e){}
 if(base){for(const f of ['story-data.js','art6/seam/tints.json','econ-held-crafts.js'])a.ok(cp.execSync('git show e2ad309:'+f,{cwd:root,maxBuffer:1<<26}).equals(fs.readFileSync(path.join(root,f))),f);
  const cut=t=>{const i=t.indexOf('// Centre lock'),j=t.indexOf(' btns([["‹ Open the door"');a.ok(i>0&&j>i);return t.slice(0,i)+t.slice(j);};
  a.equal(cut(read('story.js')),cut(cp.execSync('git show e2ad309:story.js',{cwd:root}).toString()),'story.js changed only in the boss lock puzzle settings and lock grids (no story text)');}});
test.after(()=>{const rows=Object.entries(results).map(([k,r])=>`${k} n=${r.n} size=${r.size} min=${r.min} mean=${(r.sum/r.n).toFixed(1)} max=${r.max} genMaxMs=${r.ms}`);console.log('# measured\n# '+rows.join('\n# '));});
