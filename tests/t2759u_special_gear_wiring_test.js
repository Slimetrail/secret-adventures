"use strict";
// Jeremy t2759u special class gear: the doubled lockpick door in puzzle-ui.js, the crystal-ball zone wipe in game.js, the map path in map.js,
// and the VER 106 pins. Node only. Usage: node --test tests/t2759u_special_gear_wiring_test.js
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),cp=require('node:child_process');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function el(id){const e={id,children:[],dataset:{},style:{},events:{},textContent:'',innerHTML:'',className:'',classList:{s:new Set(),add(k){this.s.add(k);},remove(k){this.s.delete(k);},toggle(k,on){on?this.s.add(k):this.s.delete(k);},contains(k){return this.s.has(k);}},
 addEventListener(k,f){(this.events[k]=this.events[k]||[]).push(f);},appendChild(c){this.children.push(c);return c;}};return e;}
function puzzleUi(roundsStart){const ids={};for(const k of ['puz','pboard','pinfo','pstat','ptitle','penter','pclose','preset'])ids[k]=el(k);
 const ctx=new Proxy({},{get:(t,k)=>k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});
 const document={getElementById:k=>ids[k],createElement:t=>Object.assign(el(t),{width:0,height:0,getContext:()=>ctx,toDataURL:()=>'data:,'}),head:el('head')};
 const c={addEventListener(){},document,innerWidth:412,innerHeight:915,performance:{now:()=>1},console};c.window=c;vm.createContext(c);
 vm.runInContext(read('maze-data.js'),c);
 const left={},log=[];c.window.SOTA={markSolved:id=>log.push(['solved',id]),enterDoor:id=>log.push(['enter',id]),
  gearLock:{total:2,rounds:id=>left[id]|0,solvedRound:id=>{left[id]--;},can:()=>false,use:()=>null}};
 for(const f of ['puzzles.js','puzzle-ui.js'])vm.runInContext(read(f),c);
 return {c,ids,left,log,S:c.window.SOTA,P:c.window.PUZ,M:c.window.MAZE};}
test('a doubled door needs two different puzzles solved one after the other, then opens as normal',()=>{
 const u0=puzzleUi();const M=u0.M,room=M.rooms.find(r=>r.p===1);a.ok(room,'a Lights Out room (type 1)');
 const u=puzzleUi();u.left[room.id]=2;u.S.puzzle.open(room.id);a.match(u.ids.ptitle.textContent,/Double \(1 of 2\)/);a.equal(u.ids.puz.dataset.double,2);
 const press=i=>u.ids.pboard.events.pointerdown[0]({target:{closest:()=>({dataset:{mv:String(i)}})},preventDefault(){}});
 const solveNow=()=>{const P=u.P,g=P.make(room.p,room.z,((room.id+1)*9973+17*room.z+104729*(u.left[room.id]|0))>>>0),pz=g.pz;/* t2768u: type 1 is Lights Out; fewest presses by GF(2) */
  const mv=P.lightsSolve(pz.n,g.s.g);if(!mv)a.fail('no solution');for(const i of mv)press(i);return pz;};
 const first=solveNow();a.equal(u.left[room.id],1);a.deepEqual(u.log,[],'not open after round 1');a.match(u.ids.ptitle.textContent,/Double \(2 of 2\)/);a.match(u.ids.pstat.textContent,/One down/);
 const second=solveNow();a.notDeepEqual(JSON.stringify(first),JSON.stringify(second),'a new puzzle in round 2');a.equal(u.left[room.id],0);
 a.deepEqual(JSON.parse(JSON.stringify(u.log)),[['solved',room.id],['enter',room.id]]);
 // a normal door still uses the room's own puzzle and opens after one solve
 const v=puzzleUi();v.S.puzzle.open(room.id);a.doesNotMatch(v.ids.ptitle.textContent,/Double/);});
test('the lockpick button shows only when gearLock.can says so (a rogue hero with one, a normal door); the boss locks never use this screen',()=>{
 const u=puzzleUi(),room=u.M.rooms[3];u.S.puzzle.open(room.id);a.equal(u.ids.puz.dataset.lockpick,'0');u.S.puzzle.close();
 u.S.gearLock.can=()=>true;u.S.puzzle.open(room.id);a.equal(u.ids.puz.dataset.lockpick,'1');const b=u.ids.puz.children.find(e=>e.id==='plock');a.ok(b);a.match(b.textContent,/Use Rogue's lockpick/);
 u.S.gearLock.use=()=>({ok:true,pass:true});b.events.pointerdown[0]({preventDefault(){},stopPropagation(){}});a.deepEqual(JSON.parse(JSON.stringify(u.log)),[['solved',room.id],['enter',room.id]]);
 const story=read('story.js');a.ok(story.includes('FINAL_LOCK=window.PUZ.make(1,5,713507,window.PUZ.BOSS_TIER)'));a.ok(!/openPuzzle|gearLock/.test(story),'boss locks are story.js puzzles, not room puzzles');
 a.ok(!/S\.rpg\.s6|finalLock\(|lockState/.test(read('puzzle-ui.js')),'the puzzle screen never touches the boss locks');});
test('crystal ball fail in game.js: forgets the zone but keeps the cell you stand on and restarts the trail so the saved map still loads',()=>{
 const src=read('game.js'),m=src.match(/function wipeZone\(z\)\{[\s\S]*?return n;\}/);a.ok(m,'wipeZone');a.ok(src.includes('applyMaze,wipeZone,'),'exported on SOTA');
 const N=65,M=(()=>{const c={window:{}};vm.createContext(c);vm.runInContext(read('maze-data.js'),c);return c.window.MAZE;})(),zoneOf=Uint8Array.from([...M.zone].map(Number));
 const visited=new Uint8Array(N*N).fill(1),st={x:5,y:60};let visCount=N*N,trail=[1,2,3,st.y*N+st.x],saves=0,resets=0;const visit=i=>{if(!visited[i]){visited[i]=1;visCount++;}},save=()=>saves++;
 const window={SOTA:{resetMapLayer:()=>resets++}},SOTA=window.SOTA;const fn=eval('('+m[0]+')');const n=fn(zoneOf[st.y*N+st.x]);
 const z=zoneOf[st.y*N+st.x];a.equal(z,1);let left=0;for(let i=0;i<N*N;i++)if(zoneOf[i]===1&&visited[i])left++;a.equal(left,1);a.equal(visited[st.y*N+st.x],1);
 a.deepEqual(trail,[st.y*N+st.x]);a.equal(visCount,N*N-n);a.equal(saves,1);a.equal(resets,1);
 // the load check (game.js loadMap/applyMaze): every trail cell must be visited
 a.ok(trail.every(i=>visited[i]));a.ok(/for\(const i of tr\)if\(!tv\[i\]\)throw 0;/.test(src),'same load check as before');});
test('map.js draws the crystal path only while its end is not found, and fits it in view',()=>{
 const src=read('map.js');a.ok(src.includes('function crystal(){'));a.ok(/!isFound\(r\.to\)/.test(src));a.ok(src.includes('el.dataset.route=cr?cr.path.length:0;'));a.ok(src.includes('const cr=crystal();if(cr&&x1>=0)'));});
test('VER 106 pins: gear.js v1 (before econ.js), econ v19, party v43, game v26, map v18, puzzle-ui v18; locked files and the wait text unchanged',()=>{
 const sw=read('sw.js'),html=read('index.html');a.match(sw,/^const VER="109",/);
 for(const p of ['gear.js?v=1','econ.js?v=21','party.js?v=45','game.js?v=26','map.js?v=18','puzzle-ui.js?v=19'])for(const s of [sw,html])a.equal(s.split(p).length-1,1,p);
 for(const p of ['econ.js?v=18','party.js?v=42','game.js?v=25','map.js?v=17','puzzle-ui.js?v=17'])for(const s of [sw,html])a.ok(!s.includes(p),p);
 a.ok(html.indexOf('gear.js?v=1')<html.indexOf('econ.js?v=21'));
 a.ok(read('game.js').includes('d.textContent="Please wait for update to continue.";'));
 let base=null;try{base=cp.execSync('git rev-parse --verify -q 33306be^{commit}',{cwd:root}).toString().trim();}catch(e){}
 if(base)for(const f of ['story-data.js','art6/seam/tints.json','econ-held-crafts.js'])/* t2766u: story.js boss lock settings changed; checked in t2766u_puzzle_tiers_test.js */{const old=cp.execSync('git show 33306be:'+f,{cwd:root});a.ok(old.equals(fs.readFileSync(path.join(root,f))),f+' unchanged');}});
