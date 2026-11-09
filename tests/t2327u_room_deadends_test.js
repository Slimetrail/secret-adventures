/* t2327u/t2328u/t2329u: room doors are impassable leaves, never hallway gates. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'maze-data.js'),'utf8'),context);
const M = JSON.parse(JSON.stringify(context.window.MAZE));
const ORIGINAL = [{"id":0,"k":"treasure","c":[13,56],"z":1,"p":0},{"id":1,"k":"story","c":[13,55],"z":1,"p":1},{"id":2,"k":"treasure","c":[0,48],"z":1,"p":1},{"id":3,"k":"monster","c":[17,53],"z":1,"p":2},{"id":4,"k":"story","c":[3,45],"z":1,"p":3},{"id":5,"k":"story","c":[8,46],"z":1,"p":4},{"id":6,"k":"treasure","c":[15,63],"z":1,"p":2},{"id":7,"k":"monster","c":[24,56],"z":1,"p":0},{"id":8,"k":"monster","c":[14,51],"z":1,"p":1},{"id":9,"k":"story","c":[24,42],"z":2,"p":2},{"id":10,"k":"treasure","c":[7,25],"z":2,"p":3},{"id":11,"k":"treasure","c":[4,39],"z":2,"p":4},{"id":12,"k":"monster","c":[1,27],"z":2,"p":3},{"id":13,"k":"story","c":[11,37],"z":2,"p":4},{"id":14,"k":"treasure","c":[23,49],"z":2,"p":0},{"id":15,"k":"story","c":[29,64],"z":2,"p":0},{"id":16,"k":"monster","c":[35,58],"z":2,"p":1},{"id":17,"k":"story","c":[1,34],"z":2,"p":2},{"id":18,"k":"monster","c":[1,23],"z":2,"p":3},{"id":19,"k":"treasure","c":[7,18],"z":2,"p":1},{"id":20,"k":"monster","c":[17,23],"z":2,"p":4},{"id":21,"k":"monster","c":[32,7],"z":3,"p":3},{"id":22,"k":"story","c":[47,10],"z":3,"p":4},{"id":23,"k":"story","c":[18,14],"z":3,"p":0},{"id":24,"k":"monster","c":[22,10],"z":3,"p":1},{"id":25,"k":"treasure","c":[16,16],"z":3,"p":2},{"id":26,"k":"story","c":[27,21],"z":3,"p":2},{"id":27,"k":"monster","c":[37,10],"z":3,"p":3},{"id":28,"k":"treasure","c":[7,2],"z":3,"p":3},{"id":29,"k":"story","c":[13,14],"z":3,"p":4},{"id":30,"k":"monster","c":[20,4],"z":3,"p":0},{"id":31,"k":"treasure","c":[27,1],"z":3,"p":4},{"id":32,"k":"treasure","c":[34,14],"z":3,"p":0},{"id":33,"k":"monster","c":[49,7],"z":3,"p":1},{"id":34,"k":"monster","c":[39,14],"z":3,"p":2},{"id":35,"k":"treasure","c":[54,1],"z":3,"p":1},{"id":36,"k":"story","c":[50,13],"z":3,"p":3},{"id":37,"k":"story","c":[54,32],"z":4,"p":4},{"id":38,"k":"story","c":[56,45],"z":4,"p":0},{"id":39,"k":"monster","c":[47,15],"z":4,"p":1},{"id":40,"k":"treasure","c":[48,30],"z":4,"p":2},{"id":41,"k":"treasure","c":[60,41],"z":4,"p":3},{"id":42,"k":"story","c":[46,39],"z":4,"p":2},{"id":43,"k":"treasure","c":[51,25],"z":4,"p":4},{"id":44,"k":"monster","c":[52,27],"z":4,"p":3},{"id":45,"k":"monster","c":[62,17],"z":4,"p":4},{"id":46,"k":"story","c":[46,28],"z":4,"p":0},{"id":47,"k":"treasure","c":[49,34],"z":4,"p":0},{"id":48,"k":"monster","c":[56,31],"z":4,"p":1},{"id":49,"k":"monster","c":[63,41],"z":4,"p":2},{"id":50,"k":"story","c":[54,39],"z":4,"p":3},{"id":51,"k":"monster","c":[54,44],"z":4,"p":4},{"id":52,"k":"treasure","c":[52,55],"z":4,"p":1},{"id":53,"k":"monster","c":[56,56],"z":4,"p":0},{"id":54,"k":"treasure","c":[60,55],"z":4,"p":2},{"id":55,"k":"story","c":[63,49],"z":4,"p":1},{"id":56,"k":"treasure","c":[44,36],"z":4,"p":3},{"id":57,"k":"story","c":[47,40],"z":4,"p":2},{"id":58,"k":"story","c":[37,43],"z":5,"p":0},{"id":59,"k":"treasure","c":[41,36],"z":5,"p":4},{"id":60,"k":"story","c":[48,51],"z":5,"p":1},{"id":61,"k":"monster","c":[39,41],"z":5,"p":2},{"id":62,"k":"story","c":[34,44],"z":5,"p":3},{"id":63,"k":"treasure","c":[38,33],"z":5,"p":0},{"id":64,"k":"treasure","c":[38,50],"z":5,"p":1},{"id":65,"k":"monster","c":[39,58],"z":5,"p":4},{"id":66,"k":"monster","c":[41,56],"z":5,"p":0},{"id":67,"k":"story","c":[43,58],"z":5,"p":1},{"id":68,"k":"treasure","c":[45,64],"z":5,"p":2},{"id":69,"k":"story","c":[48,53],"z":5,"p":2},{"id":70,"k":"monster","c":[43,41],"z":5,"p":3},{"id":71,"k":"treasure","c":[22,36],"z":5,"p":3},{"id":72,"k":"treasure","c":[24,34],"z":5,"p":4},{"id":73,"k":"monster","c":[26,29],"z":5,"p":4},{"id":74,"k":"monster","c":[27,39],"z":5,"p":0},{"id":75,"k":"treasure","c":[29,34],"z":5,"p":0},{"id":76,"k":"monster","c":[31,27],"z":5,"p":1},{"id":77,"k":"monster","c":[33,30],"z":5,"p":2},{"id":78,"k":"story","c":[35,39],"z":5,"p":3},{"id":79,"k":"monster","c":[38,23],"z":5,"p":4},{"id":80,"k":"story","c":[41,22],"z":5,"p":0},{"id":81,"k":"treasure","c":[44,19],"z":5,"p":1},{"id":82,"k":"treasure","c":[36,26],"z":5,"p":2},{"id":83,"k":"story","c":[39,31],"z":5,"p":1},{"id":84,"k":"story","c":[34,36],"z":5,"p":2}];
const STAY = {2:[0,48],3:[17,53],11:[4,39],12:[1,27],23:[18,14],24:[22,10],39:[47,15],40:[48,30],41:[60,41],42:[46,39],60:[48,51],61:[39,41],62:[34,44],63:[38,33]};
const N=M.n, masks=Array.from(M.mask,c=>parseInt(c,16));
const index=([x,y])=>y*N+x;
const neighbors=i=>{
 const x=i%N,y=Math.floor(i/N),out=[];
 for(const [bit,dx,dy,reverse] of [[1,0,-1,4],[2,1,0,8],[4,0,1,1],[8,-1,0,2]]){
  if(!(masks[i]&bit))continue;
  const xx=x+dx,yy=y+dy;
  assert.ok(xx>=0&&xx<N&&yy>=0&&yy<N,`edge out of bounds at ${x},${y}`);
  const j=yy*N+xx;
  assert.ok(masks[j]&reverse,`nonreciprocal edge ${i}->${j}`);
  out.push(j);
 }
 return out;
};
let passed=0;
function test(name,fn){fn();passed++;console.log(`PASS ${name}`);}
test('packed maze dimensions and original topology are unchanged',()=>{
 assert.equal(N,65);assert.equal(M.mask.length,N*N);assert.equal(M.zone.length,N*N);
 assert.equal(crypto.createHash('sha256').update(M.mask).digest('hex'),'c7a465516de9d683e599c57ff44cb9dca6162f2b04e0daa80eae6bb757e628aa');
 assert.equal(crypto.createHash('sha256').update(M.zone).digest('hex'),'e53b3a1503beef7adde391760f4aa2b952b6ef47781842ba1a638382e4d8d144');
 for(let i=0;i<N*N;i++)neighbors(i);
});
test('85 unique room ids retain kind, puzzle index, zone and field shape',()=>{
 assert.equal(M.rooms.length,85);assert.equal(new Set(M.rooms.map(r=>r.id)).size,85);
 for(const old of ORIGINAL){const room=M.rooms.find(r=>r.id===old.id);assert.ok(room,`missing id ${old.id}`);
  const {c:oldCell,...before}=old,{c:newCell,...after}=room;assert.deepEqual(after,before);
 }
});
test('all 85 rooms have exactly one reciprocal corridor connection in their own zone',()=>{
 for(const r of M.rooms){assert.equal(neighbors(index(r.c)).length,1,`room ${r.id} ${r.c} is not a dead end`);
  assert.equal(+M.zone[index(r.c)],r.z,`room ${r.id} changed physical zone`);
 }
});
test('14 originally valid rooms are unmoved',()=>{
 for(const [id,c] of Object.entries(STAY))assert.deepEqual(M.rooms.find(r=>r.id===+id).c,c);
});
test('exactly 71 hallway rooms moved, with expected per-zone totals',()=>{
 const count=[0,0,0,0,0,0];
 for(const old of ORIGINAL){const r=M.rooms.find(r=>r.id===old.id);
  if(Object.hasOwn(STAY,old.id))continue;
  assert.notDeepEqual(r.c,old.c,`room ${r.id} still blocks its old hallway`);count[r.z]++;
 }
 assert.deepEqual(count,[0,7,10,14,17,23]);
});
test('no room overlaps another room, tavern, camp, entrance, or centre',()=>{
 assert.deepEqual(M.entrance,[0,64]);assert.deepEqual(M.centre,[32,32]);
 assert.deepEqual(M.taverns,[[14,49],[18,24],[51,14],[47,48]]);assert.deepEqual(M.camps,[[0,45],[15,50],[3,41],[31,61],[0,13],[16,25],[16,19],[30,17],[3,3],[15,13],[26,12],[43,4],[48,13],[51,12],[46,17],[55,24],[63,28],[45,26],[53,35],[59,30],[59,52],[51,48],[53,51],[57,62],[62,60],[46,47],[44,49],[37,48],[40,59],[43,55],[46,62],[43,39],[26,34],[28,43],[30,39],[31,45],[38,21],[42,18],[45,16],[38,27],[35,32],[37,36]]);
 const forbidden=new Set([...M.taverns,...M.camps,M.entrance,M.centre].map(index));
 for(const r of M.rooms){const i=index(r.c);assert.ok(!forbidden.has(i),`occupied room cell ${r.id}: ${r.c}`);forbidden.add(i);}
});
const roomCells=new Set(M.rooms.map(r=>index(r.c))), reached=new Set([index(M.entrance)]),queue=[index(M.entrance)];
for(let q=0;q<queue.length;q++)for(const j of neighbors(queue[q]))if(!roomCells.has(j)&&!reached.has(j)){reached.add(j);queue.push(j);}
test('entrance BFS with ALL room cells impassable reaches every other cell in all five zones',()=>{
 const blocked=[],counts=[0,0,0,0,0,0];
 for(let i=0;i<N*N;i++){
  if(roomCells.has(i))continue;
  if(!reached.has(i))blocked.push({cell:[i%N,Math.floor(i/N)],zone:+M.zone[i]});else counts[+M.zone[i]]++;
 }
 assert.deepEqual(blocked,[],`unreachable non-room cells: ${JSON.stringify(blocked)}`);
 assert.equal(reached.size,N*N-M.rooms.length);
 console.log(`  reachable non-room cells: ${reached.size}; zones 1-5: ${counts.slice(1).join(', ')}`);
});
test('centre, taverns, camps and each door approach remain accessible',()=>{
 for(const c of [M.centre,...M.taverns,...M.camps])assert.ok(reached.has(index(c)),`unreachable facility ${c}`);
 for(const r of M.rooms)assert.ok(reached.has(neighbors(index(r.c))[0]),`unreachable room approach ${r.id}`);
});
test('the released first slice remains connected with its existing content cap',()=>{
 const capped={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'content-cap.js'),'utf8'),capped);
 const cap=capped.window.SOTA_CONTENT_CAP.create(N,M.zone);
 assert.equal(capped.window.SOTA_CONTENT_CAP.DEFAULT.maxZone,2);
 assert.deepEqual(JSON.parse(JSON.stringify(capped.window.SOTA_CONTENT_CAP.DEFAULT.extraCells)),[[19,24]]);
 const seen=new Set([index(M.entrance)]),q=[index(M.entrance)];
 for(let k=0;k<q.length;k++)for(const j of neighbors(q[k]))if(!roomCells.has(j)&&!seen.has(j)&&cap.isOpen(j%N,Math.floor(j/N))){seen.add(j);q.push(j);}
 for(let i=0;i<N*N;i++)if(!roomCells.has(i)&&cap.isOpen(i%N,Math.floor(i/N)))assert.ok(seen.has(i),`unreachable released cell ${i%N},${Math.floor(i/N)}`);
 console.log(`  reachable released non-room cells: ${seen.size}`);
});
// t2370u: standing door rule, zones 1-2 (step 1). A door is the one open edge of a room cell, so room cell + door are both
// treated as non-walkable; every hallway cell of each zone must still be reachable from the entrance inside the released cap.
test('t2370u zones 1-2: with every room and door cell impassable, all hallway cells, taverns, camps and door approaches are reachable',()=>{
 const capped={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'content-cap.js'),'utf8'),capped);
 const cap=capped.window.SOTA_CONTENT_CAP.create(N,M.zone),open=i=>cap.isOpen(i%N,Math.floor(i/N));
 const doorCells=new Set();for(const r of M.rooms){const i=index(r.c);doorCells.add(i);}
 const seen=new Set([index(M.entrance)]),q=[index(M.entrance)];
 for(let k=0;k<q.length;k++)for(const j of neighbors(q[k]))if(!doorCells.has(j)&&!seen.has(j)&&open(j)){seen.add(j);q.push(j);}
 const per={1:[0,0],2:[0,0]},bad=[];
 for(let i=0;i<N*N;i++){const z=+M.zone[i];if(z>2||doorCells.has(i))continue;per[z][0]++;if(seen.has(i))per[z][1]++;else if(open(i))bad.push([i%N,Math.floor(i/N),z]);}
 assert.deepEqual(bad,[],'hallway cells cut off by a door/room: '+JSON.stringify(bad));
 for(const z of [1,2])assert.equal(per[z][1],per[z][0],`zone ${z}: ${per[z][1]}/${per[z][0]} hallway cells reached`);
 const z12=c=>+M.zone[index(c)]<=2;
 for(const c of [...M.taverns,...M.camps].filter(z12))assert.ok(seen.has(index(c)),`unreachable tavern/camp ${c}`);
 const rooms12=M.rooms.filter(r=>r.z<=2);
 for(const r of rooms12){const nb=neighbors(index(r.c));assert.equal(nb.length,1,`door ${r.id} is not on a dead end`);
  assert.ok(!doorCells.has(nb[0]),`door ${r.id} opens onto another room`);assert.ok(seen.has(nb[0]),`door ${r.id} approach ${[nb[0]%N,Math.floor(nb[0]/N)]} unreachable`);
  assert.equal(+M.zone[nb[0]],r.z,`door ${r.id} approached from another zone`);}
 // no door on a through-path: removing any one door never disconnects anything (it is a leaf)
 for(const r of rooms12){const i=index(r.c);assert.ok(!seen.has(i));}
 console.log(`  t2370u zone 1: ${per[1][1]}/${per[1][0]} hallway cells, zone 2: ${per[2][1]}/${per[2][0]} (inside cap); rooms/doors z1-2: ${rooms12.length}; taverns/camps z1-2 reached: ${[...M.taverns,...M.camps].filter(z12).length}`);
});
test('maze cache pins advance together without changing combat pins',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert.match(sw,/^const VER="79",/);
 for(const source of [html,sw]){
  assert.ok(source.includes('maze-data.js?v=17'));assert.ok(!source.includes('maze-data.js?v=16'));
  assert.ok(source.includes('rules.js?v=19'));assert.ok(source.includes('party.js?v=28'));
 }
});
console.log(`${passed} passed; 0 failed`);
