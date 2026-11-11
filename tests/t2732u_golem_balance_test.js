"use strict";
// Jeremy t2732u: Iron Golem retune. Attack-only at L50 is about 5% for every legal party mix (full 2000-fights-per-mix table:
// node tests/t2732u_golem_balance_sim.js), plain Attack only chips its iron, blows take a share of max HP, Defend still halves.
const test=require("node:test"),a=require("node:assert");
const S=require("./t2732u_golem_balance_sim.js"),R=S.R;
test("every legal party mix: 14 heroes, each with every companion class plan planParty allows (56 mixes, one of each class)",()=>{
 const M=S.mixes();a.equal(M.length,56);
 M.forEach(mx=>{const cls=[mx.cls,...mx.plan.map(d=>d.cls)].sort().join();a.equal(cls,"archer,mage,rogue,warrior");});
});
test("attack-only at L50 (best zone 5 gear): about 5% for every mix (fixed seeds, 300 fights per mix here)",()=>{
 const M=S.mixes(),ws=M.map((mx,mi)=>{let w=0;for(let k=0;k<300;k++)w+=S.fight(S.party(mx),(mi*100003+k*7919+17)>>>0,S.attackOnly).win;return 100*w/300;});
 const mean=ws.reduce((x,y)=>x+y,0)/ws.length;a.ok(mean>=3&&mean<=7,"mean "+mean.toFixed(2));
 ws.forEach((w,i)=>a.ok(w>=1&&w<=11,"mix "+i+" "+w.toFixed(1)));
});
test("sensible play with a kit still wins most Golem fights at L50 (same sim player)",()=>{
 const M=S.mixes();let w=0,n=0;for(let mi=0;mi<M.length;mi+=5)for(let k=0;k<40;k++){const p=S.party(M[mi]);S.giveKit(p);w+=S.fight(p,(mi*100003+k*7919+17)>>>0,S.sensible).win;n++;}
 a.ok(w/n>=0.85,"sensible + kit "+(100*w/n).toFixed(1)+"%");
});
test("iron skin: a plain Attack chips the same share of max HP for every L50 hero (power, race, class and crits do not matter); less below L50",()=>{
 const g=R.makeBoss("normal");a.equal(g.max,21000);a.equal(R.BOSS.def,600);
 const lo=Math.round(g.max*R.GOLEM_CHIP*0.85),hi=Math.round(g.max*R.GOLEM_CHIP*1.15);
 S.mixes().slice(0,14).forEach((mx,mi)=>{const p=S.party(mx);p.forEach((c,i)=>{for(let s=0;s<20;s++){const b=R.makeBoss("normal"),F=new R.Fight(p,[b],"normal",mi*977+i*31+s);const t=F.act(i,"attack",null,0),d=b.max-b.hp;
  a.ok(d>=lo&&d<=hi,c.race+" "+c.cls+" "+d);a.ok(!/Critical/.test(t));a.match(t,/Iron skin! Plain blows only chip it\. Use skills!/);}});});
 const c=S.party(S.mixes()[0])[0];c.lvl=40;a.equal(R.golemChip(g,c,0.5),Math.round(g.max*R.GOLEM_CHIP*0.8));
});
test("skills and spells still hit the Golem as before (power vs DEF 600, no chip)",()=>{
 const p=S.party(S.mixes()[0]),c=p[0],s=R.SKILLS[c.cls].find(x=>x.k==="phys"&&c.skills.includes(x.id));a.ok(s);
 const g=R.makeBoss("normal"),F=new R.Fight(p,[g],"normal",5);c.mp=999;F.act(0,"skill",s.id,0);const d=g.max-g.hp,base=R.power(c)*s.p-300;
 a.ok(d>=Math.max(1,Math.round(base*0.85))&&d<=Math.round(base*1.15*2.01),"skill "+d+" base "+base);
});
test("blows take a share of max HP: the smash on the eye-locked member is ~90% (Defend halves it), story/hard scale it",()=>{
 for(const mx of S.mixes().filter((_,i)=>i%9===0)){const run=(def,diff)=>{const p=S.party(mx),g=R.makeBoss(diff||"normal"),F=new R.Fight(p,[g],diff||"normal",77);F.monstersTurn();F.monstersTurn();p.forEach(c=>c.hp=R.maxHp(c,F.d.hp));F.monstersTurn();const i=F.mark;p.forEach(c=>c.hp=R.maxHp(c,F.d.hp));if(def)F.guard.add(i);F.monstersTurn();return (R.maxHp(p[i],F.d.hp)-p[i].hp)/R.maxHp(p[i],1);};
  const open=run(false),guarded=run(true),story=run(false,"story"),hard=run(false,"hard");
  a.ok(open>=0.9*0.85-0.01&&open<=0.9*1.15+0.01,"open "+open);a.ok(guarded<=open/2+0.01,guarded+" vs "+open);a.ok(story<open*0.6,"story "+story);a.ok(hard>=Math.min(1,open*1.3)-0.01,"hard "+hard);}
});
