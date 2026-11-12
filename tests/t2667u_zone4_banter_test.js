"use strict";
// t2667u/t2668u: zone 4 banter picker. Every companion subset gets a line at every slot; no line plays for an absent companion.
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");
const B=require(path.join(root,"zone4-banter.js")),B14=require(path.join(root,"batch14-talks.js"));
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(read("story-data.js"),ctx);vm.runInContext(read("package-pools-data.js"),ctx);
const STORY=ctx.window.STORY,POOLS=ctx.window.PACKAGE_POOLS;
const IDS=["mira","sorrel","brunn"],CODE={mira:"Q",sorrel:"S",brunn:"A"};
const SUBSETS=[];for(let m=0;m<8;m++)SUBSETS.push(IDS.filter((_,i)=>m>>i&1));
function okFor(party,lines,what){const codes=new Set(party.map(x=>CODE[x]));a.ok(lines.length>0,"silent: "+what+" "+B.mixKey(party));
 for(const l of lines){a.ok(l[0]==="N"||l[0]==="H"||codes.has(l[0]),"line by "+l[0]+" for "+B.mixKey(party));
  for(const c of String(l[2]).match(/\{[QSA]\}/g)||[])a.ok(codes.has(c[1]),"names "+c+" for "+B.mixKey(party));}}
// TEST FIXTURE ONLY (never shipped, never shown in the game): partial coverage so exact, subset and hero tiers all run
const FIX=[{id:"FX1",context:"camp",speakers:["Q","S"],gate:"zone4",lines:[["Q","calm","TEST"],["S","calm","TEST"]]},
 {id:"FX2",context:"camp",speakers:["A"],gate:"zone4",lines:[["A","calm","TEST"]]},
 {id:"FX3",context:"after-fight",speakers:["A"],gate:null,lines:[["A","calm","TEST {A}"]]},
 {id:"FX4",context:"tavern",speakers:["Q"],gate:"zone4",place:"PLACE: secret-adventures / z4-tavern4 / tavern / dialogue / FX4",lines:[["Q","calm","TEST"],["H","calm","TEST"]]},
 {id:"FX5",context:"after-fight",speakers:[],gate:"zone4",lines:[["N","calm","TEST"]]},
 {id:"FX6",context:"craft-wait",speakers:["Q","S","A"],gate:"zone4",lines:[["Q","calm","TEST"],["S","calm","TEST"],["A","calm","TEST"]]}];
test("batch14 holds exactly the 28 approved talks Z4B01-Z4B28, every field and line exactly as in voice-zone4-banter.md",()=>{
 a.equal(B14.TALKS.length,28);a.deepEqual(B14.TALKS.map(t=>t.id),Array.from({length:28},(_,i)=>"Z4B"+String(i+1).padStart(2,"0")));a.equal(B14.seenKey("X"),"batch14-X");
 const src="/workspace/dialogue-team/voice-zone4-banter.md";if(!fs.existsSync(src))return;const md=fs.readFileSync(src,"utf8");
 const blocks=[...md.matchAll(/```js\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1])),places=[...md.matchAll(/`(PLACE: [^`]+)`/g)].map(m=>m[1]);a.equal(blocks.length,28);
 B14.TALKS.forEach((t,i)=>{const o=blocks[i];a.deepEqual(t.lines,o.lines);a.equal(t.context,o.context);a.deepEqual(t.speakers,o.speakers);a.equal(t.gate,o.gate);a.equal(t.place,places[i]);});
 const v=B.validate(B14.TALKS);a.deepEqual(v.rejected,[]);a.equal(v.entries.length,28);});
test("batch14 gates: zone4 only in zone 4; zone4-preA only in zone 4 without Brunn",()=>{const added=[];let z=4,brunn=false;
 const S={rpg:{s6:{sequential:{add:(t,k,g)=>added.push(g)},who:c=>c==="A"?brunn:true}},state:()=>({zone:z})};const r=B14.install(S);
 a.equal(r.gate({gate:"zone4"}),true);a.equal(r.gate({gate:"zone4-preA"}),true);brunn=true;a.equal(r.gate({gate:"zone4-preA"}),false);a.equal(r.gate({gate:"zone4"}),true);
 z=3;a.equal(r.gate({gate:"zone4"}),false);brunn=false;a.equal(r.gate({gate:"zone4-preA"}),false);z=5;a.equal(r.gate({gate:"zone4"}),false);a.equal(r.gate===added[0],true);});
test("installed batch: all 8 subsets x 4 slots get a line, nobody absent speaks, Mix A never plays with Brunn",()=>{const v=B.validate(B14.TALKS).entries,mixA=new Set(B14.TALKS.filter(t=>t.gate==="zone4-preA").map(t=>t.id));
 for(const party of SUBSETS)for(const slot of B.SLOTS){const seen={};for(let i=0;i<40;i++){const r=B.choose(v,STORY,POOLS,slot,party,seen,i);okFor(party,r.lines,slot);
  if(party.includes("brunn"))a.ok(!mixA.has(r.id),"Mix A talk "+r.id+" with Brunn");if(r.tier!=="generic")seen[B.seenKey(r.id)]=1;}}
 a.equal(B.choose(v,STORY,POOLS,"camp",["mira","sorrel"],{}).id,"Z4B01");a.equal(B.choose(v,STORY,POOLS,"camp",IDS,{}).id,"Z4B15");
 a.equal(B.choose(v,STORY,POOLS,"after-fight",IDS,{}).id,"Z4B19");a.equal(B.choose(v,STORY,POOLS,"tavern",IDS,{}).id,"Z4B23");a.equal(B.choose(v,STORY,POOLS,"craft-wait",IDS,{}).id,"Z4B27");
 a.equal(B.choose(v,STORY,POOLS,"tavern",["mira","sorrel"],{}).tier,"generic");a.equal(B.choose(v,STORY,POOLS,"after-fight",["mira","sorrel"],{}).id,"Z4B04");});
test("all 8 companion subsets x 4 slots get a line with no zone 4 talks at all: generic existing lines",()=>{let n=0;
 for(const party of SUBSETS)for(const slot of B.SLOTS)for(let turn=0;turn<5;turn++){const r=B.choose([],STORY,POOLS,slot,party,{},turn);okFor(party,r.lines,slot);a.equal(r.tier,"generic");n++;}a.equal(n,160);});
test("generic lines are existing approved game text",()=>{const all=new Set();for(const p of Object.keys(POOLS))POOLS[p].forEach(r=>all.add(r.text));
 for(const k of ["fun","dark"])STORY.camp[k].forEach(sc=>sc.lines.forEach(l=>all.add(l[2])));
 for(const party of SUBSETS)for(const slot of B.SLOTS)for(let t=0;t<4;t++)B.choose([],STORY,POOLS,slot,party,{},t).lines.forEach(l=>a.ok(all.has(l[2]),"new text: "+l[2]));});
test("picker: exact mix, then largest subset, then hero; brute-force check for all 8 subsets x 4 slots",()=>{const v=B.validate(FIX);a.deepEqual(v.rejected,[]);a.equal(v.entries.length,6);
 for(const party of SUBSETS)for(const slot of B.SLOTS){const r=B.choose(v.entries,STORY,POOLS,slot,party,{},0);okFor(party,r.lines,slot);
  const keys=[...new Set(v.entries.filter(e=>e.slot===slot).map(e=>e.key))].filter(k=>B.subsetKeys(party).includes(k)).sort((x,y)=>(y==="hero"?0:y.split("+").length)-(x==="hero"?0:x.split("+").length)||(x<y?-1:1));
  if(keys.length){a.equal(r.key,keys[0]);a.equal(r.tier,keys[0]===B.mixKey(party)?"exact":keys[0]==="hero"?"hero":"subset");}else a.equal(r.tier,"generic");}
 a.equal(B.choose(v.entries,STORY,POOLS,"camp",IDS,{}).key,"mira+sorrel");a.equal(B.choose(v.entries,STORY,POOLS,"camp",["brunn","mira"],{}).key,"brunn");
 a.equal(B.choose(v.entries,STORY,POOLS,"after-fight",["mira","sorrel"],{}).key,"hero");a.equal(B.choose(v.entries,STORY,POOLS,"craft-wait",["mira","sorrel"],{}).tier,"generic");
 a.equal(B.choose(v.entries,STORY,POOLS,"craft-wait",IDS,{}).tier,"exact");});
test("once every zone 4 talk is seen, every subset still gets a line (30 picks per subset and slot)",()=>{const v=B.validate(FIX).entries;
 for(const party of SUBSETS)for(const slot of B.SLOTS){const seen={};for(let i=0;i<30;i++){const r=B.choose(v,STORY,POOLS,slot,party,seen,i);okFor(party,r.lines,slot);if(r.tier!=="generic")seen[B.seenKey(r.id)]=1;}}});
test("validate rejects absent speakers, bad context, bad gate, bad PLACE, duplicate ids, empty lines",()=>{const L=[["Q","calm","t"]];
 const v=B.validate([{id:"a",context:"camp",speakers:["S"],lines:L},{id:"b",context:"lunch",speakers:["Q"],lines:L},{id:"c",context:"camp",speakers:["Q"],gate:"hurt",lines:L},
  {id:"d",context:"camp",speakers:["Q"],place:"secret-adventures / x",lines:L},{id:"e",context:"camp",speakers:["Q"],lines:L},{id:"e",context:"camp",speakers:["Q"],lines:L},{id:"f",context:"camp",speakers:["Q"],lines:[]},
  {id:"g",context:"camp",speakers:["Q"],lines:[["N","calm","{S} t"]]}]);
 a.deepEqual(v.entries.map(e=>e.id),["e"]);a.equal(v.rejected.length,7);});
test("index.html and sw.js: batch14 after batch13 and before package-dialogue; zone4-banter last; pins match",()=>{const h=read("index.html"),s=read("sw.js");
 for(const x of [h,s]){a.equal(x.split("batch14-talks.js?v=1").length-1,1);a.equal(x.split("zone4-banter.js?v=2").length-1,1);}
 a.ok(h.indexOf("batch13-talks.js?v=")<h.indexOf("batch14-talks.js")&&h.indexOf("batch14-talks.js")<h.indexOf("package-dialogue.js?v="));
 const srcs=[...h.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);a.equal(srcs[srcs.length-1],"zone4-banter.js?v=2");a.match(s,/^const VER="108",/);});
