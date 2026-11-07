const fs=require("fs"),assert=require("assert"),crypto=require("crypto"),cp=require("child_process");
const {TALKS,seenKey,badlyHurt,install}=require("../batch1-talks.js");
const source=fs.readFileSync("/workspace/dialogue-team/camp-and-afterfight-batch1.md","utf8");
const codes={Mira:"Q",Sorrel:"S",Brunn:"A"};
const sections=source.split(/^### /m).slice(1);assert.equal(sections.length,12);
sections.forEach((s,i)=>{const t=TALKS[i];assert.equal(t.id,s.split(".")[0]);
 const expected=[...s.matchAll(/^(Mira|Sorrel|Brunn): "(.*)"$/gm)].map(m=>[codes[m[1]],"calm",m[2]]);
 assert.deepStrictEqual(t.lines,expected,t.id);assert.ok(t.lines.length===3||t.lines.length===4);
 assert.equal(new Set(t.lines.map(l=>l[0])).size,2);assert.deepStrictEqual([...new Set(t.lines.map(l=>l[0]))],t.speakers);
 assert.ok(t.lines.every(l=>["Q","S","A"].includes(l[0])));
});
function fixture(present=["Q","S","A"]){
 const roles={Q:"quirky",S:"scholar",A:"angry"},state={seen:{}},calls=[];
 const l={diff:"normal",party:[{role:"hero",hp:100,maxHp:100},...present.map(c=>({role:roles[c],hp:100,maxHp:100}))]};
 const api={st:()=>state,who:c=>l.party.find(p=>p.role===roles[c]),play:(kind,lines,opt)=>calls.push({kind,lines,opt})};
 const S={rpg:{s6:api,live:()=>l}},H={camp:()=>calls.push({pool:true})};
 const module=install(S,{maxHp:c=>c.maxHp,DIFF:{normal:{hp:1}}},H);
 return {state,calls,l,H,module};
}
function isolate(f,id){TALKS.filter(t=>t.id!==id).forEach(t=>f.state.seen[seenKey(t.id)]=1);}
for(const t of TALKS){for(const missing of t.speakers){const f=fixture(["Q","S","A"].filter(c=>c!==missing));isolate(f,t.id);f.state.lastMeal="cooked";f.l.party[0].hp=1;
 assert.equal(f.module.select(t.context,[{hp:t.gate==="clean"?100:0,maxHp:100}]),null,t.id+" missing "+missing);}}
for(const kind of ["cooked","ration","buff"]){const f=fixture();isolate(f,"C4");f.H.meal({slot:kind==="ration"?"use":"dish"},kind==="cooked"?{hp:.5}: {str:2});f.H.camp();assert.equal(!!f.calls[0].pool,kind!=="cooked");}
{const f=fixture();isolate(f,"C4");f.H.meal({slot:"dish"},{hp:.5,str:3});f.H.meal({slot:"use"});f.H.camp();assert.ok(f.calls[0].pool);}
{const f=fixture();isolate(f,"C5");assert.equal(f.module.select("camp"),null);f.l.party[0].hp=99;assert.equal(f.module.select("camp").id,"C5");}
{const f=fixture(["S","A"]);assert.equal(f.module.select("camp").id,"C3");}
for(const hp of [0,1,25,25.01,100]){const f=fixture(["Q","S"]),snap=[{hp,maxHp:100}];assert.equal(badlyHurt(snap),hp<=25);assert.equal(f.module.select("after-fight",snap).id,hp<=25?"A1":"A4");}
{const f=fixture();f.state.lastMeal="cooked";f.H.camp();assert.strictEqual(f.calls.length,1);assert.deepStrictEqual(f.calls[0].lines,TALKS.find(t=>t.id==="C4").lines);assert.ok(!f.calls[0].opt.end);f.H.camp();assert.equal(f.calls.length,2);assert.notEqual(f.calls[0].lines,f.calls[1].lines);}
assert.equal(crypto.createHash("sha256").update(fs.readFileSync("story-data.js")).digest("hex"),"222fb30910b1f2f1ea83ab31700c306d8f84fe9bddb7b7005897cee20aedaebc");
const diff=cp.execFileSync("git",["diff","a3943a8ef9e97e60bf145c580ccbaa5ca915d23e","--name-only"],{encoding:"utf8"}).split("\n");
for(const locked of ["music.js","dialogue-view.js","story-data.js"])assert.ok(!diff.includes(locked),locked);
const party=fs.readFileSync("party.js","utf8"),before=cp.execFileSync("git",["show","a3943a8:party.js"],{encoding:"utf8"});
const motion=s=>s.slice(s.indexOf("// ---- fight drawing"),s.indexOf("// ---------- hooks from the walk"));assert.equal(motion(party),motion(before));
console.log("batch1_talks_test: 12 exact talks, speaker/scene gates, priority, no memory/buttons, locked files and fight motion: PASS");
