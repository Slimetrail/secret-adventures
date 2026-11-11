"use strict";
// Jeremy t2721u: zone 5 opens (maxZone 5), zone 5 monster mechanics and the Iron Golem mechanics. Node only, no browser.
// Zones 1-4 fights must stay byte-identical to live VER 102 (rules.js at 48ca418, read from git), so only zone 5 and the Golem change.
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),cp=require("node:child_process");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");
const R=require("../rules.js");
function liveRules(){let src=null;try{src=cp.execFileSync("git",["show","48ca418b9440e585be6646214cbf23113c1bb6dd:rules.js"],{cwd:root,encoding:"utf8",stdio:["ignore","pipe","ignore"]});}catch(e){return null;}
 const m={exports:{}};new Function("module","exports","window",src)(m,m.exports,undefined);return m.exports;}
const MAIN={warrior:"str",rogue:"sta",archer:"sta",mage:"man"};
function hero(RR,name,race,cls,lvl){const c=RR.newChar(name,race,cls,{},RR.SKILLS[cls][0].id);c.lvl=lvl;let k=0;for(let g=0;g<400;g++){const st=(k++%3===2)?"con":MAIN[cls];if(!RR.raise(c,st)&&!RR.raise(c,st==="con"?MAIN[cls]:"con"))break;}
 c.skills=[];while(c.skills.length<RR.skillSlots(lvl)){const s=RR.SKILLS[cls].find(x=>!c.skills.includes(x.id));if(!s)break;RR.learn(c,s.id);}
 ({warrior:["sword","leather"],rogue:["dagger","leather"],archer:["bow","leather"],mage:["staff","robe"]})[cls].forEach(id=>{c.bag.push(id);RR.equip(c,id,RR.ITEMS[id].slot);});c.hp=RR.maxHp(c,1);c.mp=RR.maxMp(c);return c;}
function party(RR,lvl){return [hero(RR,"Hero","human","warrior",lvl),hero(RR,"Mira","cat","rogue",lvl),hero(RR,"Sorrel","elf","mage",lvl),hero(RR,"Brunn","dwarf","archer",lvl)];}
// a fixed mixed player (skills, heals, Defend, Attack) so every engine path runs
function play(RR,p,mons,seed){const F=new RR.Fight(p,mons,"normal",seed);for(let r=0;r<40&&!F.over;r++){p.forEach((c,i)=>{if(F.over||c.hp<=0)return;const sk=c.skills.map(id=>RR.SKILLS[c.cls].find(s=>s.id===id)).filter(s=>s&&s.mp<=c.mp);
  const live=F.m.map((m,j)=>[m,j]).filter(x=>x[0].hp>0),tg=live.length?live[(r+i)%live.length][1]:0,mode=(r*7+i*3+seed)%5;
  if(mode===0)F.act(i,"attack",null,tg);else if(mode===1)F.act(i,"defend",null,tg);else{const s=sk[(r+i)%Math.max(1,sk.length)];if(s)F.act(i,"skill",s.id,tg);else F.act(i,"attack",null,tg);}});if(!F.over)F.monstersTurn();}
 return {over:F.over,turn:F.turn,log:F.log.join("\n"),hp:p.map(c=>c.hp),m:F.m.map(m=>m.hp)};}
test("zones 1-4 hallway and room fights are identical to live VER 102 (same seeds, same log, same HP)",()=>{
 const L=liveRules();if(!L){a.fail("git show 48ca418:rules.js failed");}
 let n=0;for(let z=1;z<=4;z++)for(let s=0;s<60;s++){const lvl=[0,6,16,26,36][z],seed=(z*1000+s*7919)>>>0;
  for(const room of [false,true]){const mk=RR=>(room?RR.roomEncounter:RR.encounter)(z,lvl,(s%5)/5,"normal",seed,party(RR,lvl));
   const x=play(R,party(R,lvl),mk(R),seed),y=play(L,party(L,lvl),mk(L),seed);a.deepEqual(x,y,`zone ${z} seed ${seed} room ${room}`);n++;}}
 a.equal(n,480);
});
test("zone 5 kinds carry one mechanic each; zone 4 table unchanged",()=>{
 a.deepEqual(R.MECH[4],["charge","dive","scales","stone","venom","warcry","shell"]);
 a.deepEqual(R.MECH[5],["gaze","breath","regrow","dive","hide","burn","veil"]);
 a.deepEqual(R.MONSTERS[5],["Basilisk","Dragon","Hydra","Wyvern","Chimera","Salamander","Shadow drake"]);
 for(let k=0;k<7;k++){const m=R.makeMonster(5,k,45,0.5,"normal");a.equal(m.mech,R.MECH[5][k]);a.equal(m.zone,5);}
 a.equal(R.ARMOR.hide,.5);a.equal(R.ARMOR.iron,.5);
});
const P=()=>party(R,48);
test("gaze/breath: warned on round 2, party-wide on round 3; Defend halves it",()=>{
 for(const k of [0,1]){const m=R.makeMonster(5,k,48,0,"normal"),p=P(),F=new R.Fight(p,[m],"normal",5);
  F.monstersTurn();const w=F.monstersTurn();a.ok(w.some(t=>/Defend!$/.test(t)),w.join("|"));
  F.guard.add(0);const hp0=p.map(c=>c.hp),out=F.monstersTurn();a.equal(out.filter(t=>t.startsWith(m.n+(k?" breathes fire on ":" stares down "))).length,4,out.join("|"));
  a.ok(p.every((c,i)=>c.hp<hp0[i]));}
});
test("regrow: a Hydra heals each round unless a skill or spell hit it that round",()=>{
 const h=R.makeMonster(5,2,48,0,"normal"),p=P(),F=new R.Fight(p,[h],"normal",9);h.hp=Math.round(h.max*.5);
 F.act(0,"attack",null,0);const a1=h.hp;const o1=F.monstersTurn();a.ok(o1.some(t=>/grows back a head/.test(t)));a.equal(h.hp,Math.min(h.max,a1+Math.round(h.max*R.REGROW)));
 F.act(0,"skill",p[0].skills.find(id=>R.SKILLS.warrior.find(s=>s.id===id).k==="phys"),0);const a2=h.hp;const o2=F.monstersTurn();a.ok(!o2.some(t=>/grows back a head/.test(t)));a.equal(h.hp,a2);
});
test("hide: plain Attack does half on a Chimera and says so; skills are full",()=>{
 const c=R.makeMonster(5,4,48,0,"normal"),p=P(),F=new R.Fight(p,[c],"normal",3);const t=F.act(0,"attack",null,0);a.match(t,/thick hide/);
});
test("burn: the Salamander sets a member on fire; the tick alone never knocks out; any heal puts it out",()=>{
 const s=R.makeMonster(5,5,48,0,"normal"),p=P(),F=new R.Fight(p,[s],"normal",11);let out=[];for(let i=0;i<3&&!Object.keys(F.venom||{}).length;i++)out=out.concat(F.monstersTurn());
 const k=Object.keys(F.venom||{})[0];a.ok(k!=null,out.join("|"));a.equal(F.venom[k].k,"burn");a.ok(out.some(t=>/catches fire!$/.test(t)));
 const o2=F.monstersTurn();a.ok(o2.some(t=>/^Fire burns .* Heal to put it out$/.test(t)));
 const mage=p.findIndex(c=>c.cls==="mage");p.forEach(c=>{c.hp=R.maxHp(c,1);c.mp=R.maxMp(c);});p[+k].hp-=50;const t=F.act(mage,"skill","mend",0);a.match(t,/The fire is out\.$/);a.equal(F.venom[k],undefined);
 // the burn tick alone stops at 1 HP (same rule as venom)
 const G=new R.Fight(p,[],"normal",1);G.venom={0:{t:3,k:"burn"}};p[0].hp=2;G.monstersTurn();a.equal(p[0].hp,1);
});
test("veil: the Shadow drake shields the others (half damage, own line); beat it first",()=>{
 const d=R.makeMonster(5,6,48,0,"normal"),w=R.makeMonster(5,3,48,0,"normal"),p=P(),F=new R.Fight(p,[w,d],"normal",13);
 a.equal(R.monTag(F,d),"shields others");a.equal(R.monTag(F,w),"shielded");const t=F.act(0,"attack",null,0);a.match(t,/Shadow drake's veil shields it/);
 d.hp=0;a.equal(R.monTag(F,w),"");
 // zone 4 scorpion text unchanged
 const sc=R.makeMonster(4,6,38,0,"normal"),mi=R.makeMonster(4,0,38,0,"normal"),G=new R.Fight(P(),[mi,sc],"normal",1);a.match(G.act(0,"attack",null,0),/The Giant scorpion shields it\. Beat the scorpion first!/);
});
test("Iron Golem: same fight rules (no run, sweep every third round with a warning) plus iron skin, eye lock and core blaze",()=>{
 const g=R.makeBoss("normal");a.equal(g.n,"Iron Golem");a.equal(g.boss,true);a.equal(g.hp,21000);a.equal(g.max,21000);/* t2732u: 15000 -> 21000 (skills/spells only; plain Attack chips a share of max HP) */a.equal(g.mech,"iron");a.equal(g.zone,5);
 const p=P(),F=new R.Fight(p,[g],"normal",21);a.equal(F.act(0,"run",null,0),"Can't run!");a.match(F.act(0,"attack",null,0),/Iron skin!/);
 F.monstersTurn();const w=F.monstersTurn();a.ok(w.includes("The Golem raises both fists. A sweeping blow is coming — Defend!"));
 const sw=F.monstersTurn();a.equal(sw.filter(t=>/^Iron Golem sweeps /.test(t)).length,4);const lock=sw.find(t=>/eye locks on/.test(t));a.ok(lock,sw.join("|"));
 const low=F.alive(p).slice().sort((x,y)=>R.defense(x)-R.defense(y)||p.indexOf(x)-p.indexOf(y))[0];a.equal(F.mark,p.indexOf(low));a.ok(lock.includes(low.name));
 p.forEach(c=>c.hp=R.maxHp(c,1));const sm=F.monstersTurn();a.ok(sm.some(t=>t.startsWith("Iron Golem smashes "+low.name+" for ")),sm.join("|"));a.equal(F.mark,null);
 g.hp=Math.round(g.max*.25);const o=F.monstersTurn();a.ok(o.includes("The Golem's core blazes! It hits harder now. Finish it!"));a.equal(R.monTag(F,g),"enraged");
});
test("Iron Golem: defending the eye-locked member halves the smash",()=>{
 const run=def=>{const p=P(),g=R.makeBoss("normal"),F=new R.Fight(p,[g],"normal",77);F.monstersTurn();F.monstersTurn();p.forEach(c=>c.hp=R.maxHp(c,1));F.monstersTurn();const i=F.mark;p.forEach(c=>c.hp=R.maxHp(c,1));if(def)F.guard.add(i);F.monstersTurn();return R.maxHp(p[i],1)-p[i].hp;};
 const open=run(false),guarded=run(true);a.ok(guarded<=Math.ceil(open/2)+1,`${guarded} vs ${open}`);
});
test("attack-only rarely beats the Golem (t2732u: about 5% at L50, tests/t2732u_golem_balance_test.js); the boss door locks and endings are wired (story.js untouched)",()=>{
 let wins=0;for(let s=0;s<400;s++){const p=party(R,50),g=R.makeBoss("normal"),F=new R.Fight(p,[g],"normal",s*101+7);for(let r=0;r<80&&!F.over;r++){p.forEach((c,i)=>{if(!F.over&&c.hp>0)F.act(i,"attack",null,0);});if(!F.over)F.monstersTurn();}wins+=F.over==="win";}
 a.ok(wins>=4&&wins<=40,"attack-only wins "+wins+"/400");
 const st=read("story.js");a.ok(st.includes("const FINAL_LOCK=window.PUZ.make(1,5,713507)"));a.ok(st.includes("FINAL_LOCK2=window.PUZ.make(4,5,731117),FINAL_LOCK3=window.PUZ.make(3,5,731119)"));
 a.ok(st.includes("S.rpg.startBoss()"));a.ok(st.includes("H.bossWon=()=>{const s=st();if(s)s.golemDefeated=true;showEnding();}"));
 a.ok(read("party.js").includes('if(bossWon)h6("bossWon")'));
});
test("content cap is zones 1-5 and pins advance together (VER 105)",()=>{
 const c={window:{}};vm.runInNewContext(read("content-cap.js"),c);a.equal(c.window.SOTA_CONTENT_CAP.DEFAULT.maxZone,5);
 const sw=read("sw.js"),html=read("index.html");a.match(sw,/^const VER="105",/);
 for(const p of ["content-cap.js?v=8","rules.js?v=26","party.js?v=42","game.js?v=25","story.js?v=25"])for(const s of [sw,html])a.ok(s.includes(p),p);
 a.ok(read("party.js").includes('const WAIT_UPDATE="Please wait for update to continue.";'));
});
