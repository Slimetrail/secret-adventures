"use strict";
// t2670u/t2675u: per-save value, seeded shuffles and the variant picker. Fixture variant ids below are TEST ONLY (never game data).
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),crypto=require("node:crypto");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");
const V=require(path.join(root,"variety.js"));
const BASE="2334ab18a5c7022ce1e3d9c62d4a9858ce2f1f49";
const IDS=Array.from({length:24},(_,i)=>"L"+i);
function walkN(state,vseed,key,n,ok){const out=[];for(let i=0;i<n;i++)out.push(V.walkState(state,key,IDS,ok||(()=>true),true,vseed));return out;}
// TEST FIXTURE ONLY
const FIXTURE={};for(const k of ["join-mira","join-sorrel","join-brunn-save","wall-z1-01","wall-z1-02","wall-z2-01"])FIXTURE[k]=[1,2,3,4,5,6,7].map(n=>({id:k+"-v"+(n+1),lines:[["H","calm","FIXTURE "+n]]}));
const BASELINES=[["H","calm","base"]];
test("two different per-save values give different orders and different variant picks",()=>{
 const A=1111111111,B=2222222222,sa={},sb={};
 const oa=walkN(sa,A,"seq:camp",24),ob=walkN(sb,B,"seq:camp",24);
 a.notDeepEqual(oa,ob);a.deepEqual([...oa].sort(),[...IDS].sort(),"one cycle walks every line once");
 const pa={},pb={};const va=Object.keys(FIXTURE).map(k=>V.variantState(pa,FIXTURE,k,BASELINES,A).id),vb=Object.keys(FIXTURE).map(k=>V.variantState(pb,FIXTURE,k,BASELINES,B).id);
 a.notDeepEqual(va,vb);
 // different seeds spread over the choices (not stuck on the base)
 const seen=new Set();for(let s=1;s<200;s++)seen.add(V.variantState({},FIXTURE,"join-mira",BASELINES,s*7919).id);a.ok(seen.size>=6,"spread "+seen.size);
});
test("same per-save value gives the same orders and picks after save/load, and continues the same order",()=>{
 const seed=3141592653,live={vseed:seed,vpools:{},vpick:{}};
 const first=walkN(live.vpools,seed,"pool:camp",10);V.variantState(live.vpick,FIXTURE,"join-mira",BASELINES,seed);
 const saved=JSON.parse(JSON.stringify(live));
 const contA=walkN(live.vpools,seed,"pool:camp",30),contB=walkN(saved.vpools,seed,"pool:camp",30);a.deepEqual(contA,contB,"continues identically after load");
 const fresh={};a.deepEqual(walkN(fresh,seed,"pool:camp",10),first,"replay from a new state with the same value = same order");
 a.equal(V.variantState(saved.vpick,FIXTURE,"join-mira",BASELINES,seed).id,V.variantState({},FIXTURE,"join-mira",BASELINES,seed).id);
 // the pick is kept even when more variants arrive later
 const kept=saved.vpick["join-mira"],more={"join-mira":FIXTURE["join-mira"].concat([{id:"join-mira-v99",lines:[["Q","calm","FIXTURE"]]}])};
 a.equal(V.variantState(saved.vpick,more,"join-mira",BASELINES,seed).id,kept);
});
test("cycles: every line once per cycle, reshuffled, no repeat at the boundary; gates still apply",()=>{
 for(let s=1;s<60;s++){const st={},seq=walkN(st,s*104729,"fight:x",24*5);
  for(let c=0;c<5;c++)a.deepEqual(seq.slice(c*24,c*24+24).sort(),[...IDS].sort());
  for(let i=1;i<seq.length;i++)a.notEqual(seq[i],seq[i-1],"repeat at "+i+" seed "+s);
  a.notDeepEqual(seq.slice(0,24),seq.slice(24,48));}
 const st={},even=new Set(IDS.filter((_,i)=>i%2===0)),got=walkN(st,99,"g",36,i=>even.has(i));a.ok(got.every(i=>even.has(i)));
 a.equal(V.walkState({},"none",IDS,()=>false,true,5),null,"nothing eligible = nothing plays");
 a.equal(V.walkState({},"one",IDS,i=>i==="L3",true,5),"L3");
 const st1={};V.walkState(st1,"k",IDS,()=>true,true,5);const peekA=V.walkState(st1,"k",IDS,()=>true,false,5),peekB=V.walkState(st1,"k",IDS,()=>true,false,5);a.equal(peekA,peekB,"peek is pure");
 // new content added later: kept order, new ids appended, no crash
 const st2={};walkN(st2,7,"k",5);const more=IDS.concat(["N1","N2"]);const r=[];for(let i=0;i<40;i++)r.push(V.walkState(st2,"k",more,()=>true,true,7));a.ok(r.includes("N1")&&r.includes("N2"));
 // purposes are separate streams
 a.notDeepEqual(walkN({},42,"a",24),walkN({},42,"b",24));
 a.equal(V.variantState({},{},"join-sorrel",BASELINES,42).id,"join-sorrel-v1");a.equal(V.variantState({},{},"join-sorrel",BASELINES,42).lines,BASELINES);
 a.equal(V.variantState({},{"x":[{id:"x-v1",lines:[["H","calm","FIXTURE"]]}]},"x",BASELINES,42).lines,BASELINES,"a listed -v1 never replaces the live base");
});
test("sequential talks (batch1 registry) keep their gates under the shuffle and use the per-save order",()=>{
 const {TALKS,seenKey,install}=require(path.join(root,"batch1-talks.js"));
 const roles={Q:"quirky",S:"scholar",A:"angry"};
 function fx(seed,present){const state={seen:{}},l={diff:"normal",vseed:seed,vpools:{},party:[{role:"hero",hp:100,maxHp:100},...present.map(c=>({role:roles[c],hp:100,maxHp:100}))]};
  const api={st:()=>state,who:c=>l.party.find(p=>p.role===roles[c]),play:()=>{}};globalThis.Variety={active:()=>true,peek:(k,ids,ok)=>V.walkState(l.vpools,k,ids,ok,false,l.vseed),commitId:(k,ids,id)=>V.walkState(l.vpools,k,ids,i=>i===String(id),true,l.vseed)};
  const m=install({rpg:{s6:api,live:()=>l,s5:{campBg:()=>null}}},{maxHp:c=>c.maxHp,DIFF:{normal:{hp:1}}},{camp:()=>{}});return {m,state,l};}
 const order=(seed,present)=>{const f=fx(seed,present),out=[];for(let i=0;i<30;i++){const t=f.m.select("camp",[{hp:100,maxHp:100}]);if(!t)break;
  a.ok(t.speakers.every(c=>present.includes(c)),"absent speaker "+t.id);a.ok(!f.state.seen[seenKey(t.id)]);f.m.run("camp",[{hp:100,maxHp:100}]);out.push(t.id);}return out;};
 const o1=order(11,["Q","S","A"]),o2=order(987654,["Q","S","A"]);a.ok(o1.length>1);a.notDeepEqual(o1,o2);a.deepEqual(order(11,["Q","S","A"]),o1);
 const oQ=order(11,["Q"]);a.ok(oQ.every(id=>TALKS.find(t=>t.id===id).speakers.every(c=>c==="Q")));
 delete globalThis.Variety;
});
test("old saves get a value once on load, then saved; new games get a fresh crypto value",()=>{
 const p=read("party.js");
 a.match(p,/function freshVseed\(\)\{try\{const a=new Uint32Array\(1\);\(window\.crypto\|\|\{\}\)\.getRandomValues\(a\)/);
 a.match(p,/seed:\(Math\.random\(\)\*1e9\)\|0,vseed:freshVseed\(\),vpools:\{\},vpick:\{\}/);
 a.match(p,/migrateSaltsBoxes\(live\);ensureVseed\(\);\}\}/,"boot load");a.match(p,/wakeLoaded\(\);ensureVseed\(\);if\(!Array\.isArray\(live\.beasts\)\)/,"restore / Load / death restore");
 a.match(p,/function ensureVseed\(\)\{if\(!live\|\|\(live\.vseed>>>0\)\)return false;/);a.match(p,/localStorage\.setItem\(SLOT\+activeSlot,JSON\.stringify\(save\)\)/);
 a.ok(V.newSeed()>0);
});
test("sick-dad intro and the 3 endings are unchanged from live "+BASE.slice(0,7),()=>{
 const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
 for(const f of ["story-data.js","story.js","intro.js","intro-art-data.js","t2103u-text.js","package-story-data.js","story-gates.js","tints.json"]){
  let old;try{old=cp.execFileSync("git",["show",BASE+":"+f],{cwd:root});}catch(e){if(f==="tints.json")continue;throw e;}
  if(f==="story.js"){/* t2766u/t2768u: only the boss lock puzzle settings changed (no story text) */const cut=t=>{t=String(t);const i=t.indexOf("// Centre lock"),j=t.indexOf(' btns([["‹ Open the door"');return t.slice(0,i)+t.slice(j);};a.equal(cut(fs.readFileSync(path.join(root,f))),cut(old),f+" changed outside the boss lock settings");continue;}
  a.equal(sha(fs.readFileSync(path.join(root,f))),sha(old),f+" changed");}
 const v=read("variety.js");a.ok(!/H\.created\s*=/.test(v)&&!/showEnding|endingLines|H\.bossWon/.test(v.replace(/\/\*[\s\S]*?\*\//,"")),"variety.js must not touch the intro or endings");
 for(const f of ["game.js","party.js"]){const old=cp.execFileSync("git",["show",BASE+":"+f],{cwd:root}).toString(),n=(t)=>(t.match(/Please wait for update to continue\./g)||[]).length;a.ok(n(old)>0);a.equal(n(read(f)),n(old),"wait text "+f);}
});
test("pins: VER 102, new and changed files pinned in index.html and sw.js",()=>{
 const h=read("index.html"),s=read("sw.js");a.match(s,/^const VER="108",/);
 for(const p of ["party.js?v=44","batch1-talks.js?v=6","package-dialogue.js?v=7","package-rooms.js?v=5","zone4-banter.js?v=2","dialogue-variants.js?v=1","variety.js?v=1"]){a.ok(h.includes(p),"html "+p);a.ok(s.includes('"'+p+'"'),"sw "+p);}
 a.ok(h.indexOf("story.js?v=26")<h.indexOf("variety.js?v=1")&&h.indexOf("variety.js?v=1")<h.indexOf("batch1-talks.js"),"variety.js loads after story.js, before batch1");
 const v=read("dialogue-variants.js");a.ok(!v.includes("variants-source"),"variants-source.md must not be installed");
});
test("installed variants equal Eve-approved voice-variants-z1z2-joins.md Part 1 line for line (28 pieces; v1 untouched)",()=>{
 const MD="/workspace/dialogue-team/voice-variants-z1z2-joins.md",md=fs.readFileSync(MD,"utf8").split("\n## Part 2")[0];
 const DV=require(path.join(root,"dialogue-variants.js")),want={};let pieces=0;
 for(const sec of md.split("\n#### ").slice(1)){const vid=sec.split(/\s/)[0],scene=vid.replace(/-v\d+$/,"");const e={id:vid};let cur=null;
  for(const raw of sec.split("\n")){const ln=raw.trim();let m;
   if(ln.startsWith("**Solo form:**")){cur="solo";e.solo={place:/`(PLACE: [^`]+)`/.exec(ln)[1],lines:[]};continue;}
   if(ln.startsWith("**Party form:**")){cur="party";e.party={place:/`(PLACE: [^`]+)`/.exec(ln)[1],lines:[]};continue;}
   if(ln.startsWith("- `PLACE:")){e.place=/`(PLACE: [^`]+)`/.exec(ln)[1];continue;}
   if((m=/^- \*\*JOURNAL THOUGHT \(note, not spoken\):\*\* (.+)$/.exec(ln))){e.journal=m[1];continue;}
   if((m=/^\d+\. `([A-Z])` \([^)]*\) \[(\w+)\] (.+)$/.exec(ln))){(cur?e[cur].lines:(e.lines=e.lines||[])).push([m[1],m[2],m[3]]);}}
  if(e.solo){e.place=e.solo.place;pieces+=2;}else pieces++;(want[scene]=want[scene]||[]).push(e);}
 a.equal(pieces,28,"28 pieces in Part 1");
 const norm=x=>JSON.parse(JSON.stringify(x));a.deepEqual(Object.keys(DV.scenes).filter(k=>!/^ar/.test(k)).sort(),Object.keys(want).sort());
 for(const k in want){a.deepEqual(norm(DV.scenes[k]),norm(want[k]),k);
  for(const e of DV.scenes[k]){a.ok(!/-v1$/.test(e.id),"v1 must stay the live text: "+e.id);
   const all=[].concat(e.lines||[],e.solo?e.solo.lines:[],e.party?e.party.lines:[]);a.ok(all.every(l=>/^[NHQSA]$/.test(l[0])&&l[2]));
   if(/^wall-/.test(k)){const spoken=e.party?e.party.lines:e.lines;a.ok(spoken.every(l=>l[0]!=="H"),"t2678u: no hero line with companions "+e.id);a.ok(e.journal&&!all.some(l=>l[2]===e.journal),"journal note is not spoken "+e.id);}
   if(e.solo)a.ok(e.solo.lines.every(l=>l[0]==="H"),"solo form is hero-only "+e.id);}}
 // every md line text appears verbatim in the shipped file
 const src=read("dialogue-variants.js");for(const m of fs.readFileSync(MD,"utf8").matchAll(/^\d+\. `[A-Z]` \([^)]*\) \[\w+\] (.+)$/gm))a.ok(src.includes(JSON.stringify(m[1]).slice(1,-1)),"missing "+m[1]);
});
test("Part 2 presence talks equal the md line for line: 70 pieces, 215 spoken lines, 64 journal notes; hero speaks only in -h- pieces",()=>{
 const md=fs.readFileSync("/workspace/dialogue-team/voice-variants-z1z2-joins.md","utf8").split("\n## Part 2")[1];a.ok(md,"Part 2 present");
 const DV=require(path.join(root,"dialogue-variants.js"));let pieces=0,spoken=0,notes=0;const seenIds=new Set();
 for(const sec of md.split("\n#### ").slice(1)){const vid=sec.split(/\s/)[0],m=/^(ar[12]-0[1-4])-(h|m|s|bs|br)-v([23])$/.exec(vid);a.ok(m,"id "+vid);
  const want={id:vid,lines:[]};for(const raw of sec.split("\n")){const ln=raw.trim();let q;
   if(ln.startsWith("- `PLACE:")){want.place=/`(PLACE: [^`]+)`/.exec(ln)[1];continue;}
   if((q=/^- \*\*JOURNAL THOUGHT \(note, not spoken\):\*\* (.+)$/.exec(ln))){want.journal=q[1];notes++;continue;}
   if((q=/^\d+\. `([A-Z])` \([^)]*\) \[(\w+)\] (.+)$/.exec(ln))){want.lines.push([q[1],q[2],q[3]]);spoken++;}}
  pieces++;seenIds.add(vid);
  const ver=(DV.scenes[m[1]]||[]).find(v=>v.id===m[1]+"-v"+m[3]);a.ok(ver,"version "+vid);const got=ver.pieces[m[2]];
  a.deepEqual(JSON.parse(JSON.stringify(got)),want,vid);
  if(m[2]!=="h")a.ok(got.lines.every(l=>l[0]!=="H"),"hero line outside -h-: "+vid);
  if(m[2]==="h"&&m[1].startsWith("ar2"))a.equal(got.lines.length,0,"zone 2 -h- is journal-only");
  if(got.journal)a.ok(!got.lines.some(l=>l[2]===got.journal),"journal note spoken: "+vid);}
 a.equal(pieces,70);a.equal(spoken,215);a.equal(notes,64);
 let shipped=0;for(const k of Object.keys(DV.scenes).filter(k=>/^ar/.test(k)))for(const v of DV.scenes[k])shipped+=Object.keys(v.pieces).length;a.equal(shipped,70,"nothing extra shipped");
 a.equal(DV.presencePieces,70);
});
test("presence talk picker: one stored pick per room, piece by suffix, v1 fallback when the picked piece has no spoken lines",()=>{
 const DV=require(path.join(root,"dialogue-variants.js")),ids=new Set();
 for(let sd=1;sd<=60;sd++){const picks={},r=V.variantState(picks,DV.scenes,"ar2-01",BASELINES,sd*40503>>>0);ids.add(r.id);a.equal(V.variantState(picks,DV.scenes,"ar2-01",BASELINES,sd*40503>>>0).id,r.id);
  if(!r.base){a.ok(r.pieces.m&&r.pieces.h);a.equal(r.pieces.h.lines.length,0);}}
 a.deepEqual([...ids].sort(),["ar2-01-v1","ar2-01-v2","ar2-01-v3"]);
 const v=read("variety.js");a.match(v,/if\(!pc\|\|!Array\.isArray\(pc\.lines\)\|\|!pc\.lines\.length\)return base;/,"empty piece falls back to v1");
 a.match(read("package-rooms.js"),/root\.Variety\.arPiece\(t\.id,t\.lines,s,id\)/);
});
test("in-game form rules: zone 1 solo/party from one pick; absent companions dropped; picks differ by save",()=>{
 const DV=require(path.join(root,"dialogue-variants.js"));const ids=new Set();
 for(let s=1;s<=40;s++){const picks={},r=V.variantState(picks,DV.scenes,"wall-z1-01",BASELINES,s*2654435761>>>0);ids.add(r.id);
  if(!r.base){a.ok(r.solo&&r.party);a.equal(picks["wall-z1-01"],r.id);const again=V.variantState(picks,DV.scenes,"wall-z1-01",BASELINES,s*2654435761>>>0);a.equal(again.id,r.id);a.deepEqual(again.party,r.party);}}
 a.deepEqual([...ids].sort(),["wall-z1-01-v1","wall-z1-01-v2","wall-z1-01-v3"]);
 const v=read("variety.js");a.match(v,/const solo=!\["Q","S","A"\]\.some\(c=>api\.who\(c\)\),lines=v\.solo\?\(solo\?v\.solo:v\.party\):v\.lines/);
 a.match(v,/function presentOnly\(lines\)\{return lines\.filter\(l=>!\/\^\[QSA\]\$\/\.test\(l\[0\]\)\|\|!!api\.who\(l\[0\]\)\);\}/);
});
