"use strict";
// Jeremy t2732u: Iron Golem balance sim. Every legal party mix (hero race x class, and every companion class plan planParty allows),
// all four members at level 50, points spent (main, main, CON), best zone 5 gear each can wear, all skill slots filled.
// Players: "attack" (every member presses only Attack on the Golem) and "sensible" (Defend when the Golem's eye is on you before its
// smash and on the warned sweep turn when hurt, heal when low, otherwise the strongest damage skill; optional kit of potions/elixirs).
// Fixed seeds: fight k of a mix uses seed (mixIndex*100003 + k*7919 + 17) >>> 0.
// Usage: node tests/t2732u_golem_balance_sim.js [fightsPerMix=2000] [--sensible] [--kit] [--lvl=50] [--zone-gear=5] [--json]
const path=require("path"),fs=require("fs"),vm=require("vm");
const root=path.join(__dirname,"..");
function loadRules(){const c={window:{},console};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,"rules.js"),"utf8"),c);c.window.RPG=c.window.RPG||c.RPG;
 vm.runInContext(fs.readFileSync(path.join(root,"econ.js"),"utf8"),c);return c.window.RPG;}
const R=loadRules();
const args=process.argv.slice(2),N=+(args.find(a=>/^\d+$/.test(a))||2000),OPT=k=>args.includes(k),VAL=(k,d)=>{const a=args.find(x=>x.startsWith(k+"="));return a?+a.split("=")[1]:d;};
const LVL=VAL("--lvl",50),GZ=VAL("--zone-gear",5);
const MAIN={warrior:"str",rogue:"sta",archer:"sta",mage:"man"};
function build(name,race,cls,alloc,skill,lvl){const c=R.newChar(name,race,cls,alloc||{},skill);c.lvl=lvl;let k=0;
 for(let g=0;g<600;g++){const st=(k++%3===2)?"con":MAIN[cls];if(!R.raise(c,st)&&!R.raise(c,st==="con"?MAIN[cls]:"con"))break;}
 while(c.skills.length<R.skillSlots(lvl)){const s=R.SKILLS[cls].find(x=>!c.skills.includes(x.id));if(!s)break;R.learn(c,s.id);}
 const score=it=>(it.atk||0)*2+(it.def||0)+(it.hp||0)/4+(it.mp||0)/8;
 const pool=Object.keys(R.ITEMS).filter(id=>id.startsWith("z"+GZ+"_"));
 for(const slot of Object.keys(c.equip)){let best=null,bs=-1;for(const id of pool){if(!R.canEquip(c,id,slot))continue;if(slot==="acc2"&&c.equip.acc1===id)continue;const s=score(R.ITEMS[id]);if(s>bs){bs=s;best=id;}}
  if(best){c.bag.push(best);R.equip(c,best,slot);}}
 c.hp=R.maxHp(c,1);c.mp=R.maxMp(c);return c;}
function mixes(){const out=[];for(const race of Object.keys(R.RACES))for(const cls of R.RACES[race].classes){const hero=R.newChar("Hero",race,cls,R.START_KIT[cls].alloc,R.START_KIT[cls].skill);
  const seen=new Set();for(let s=0;s<64;s++){const plan=R.planParty(hero,s),key=plan.map(d=>d.race+"-"+d.cls).join(",");if(seen.has(key))continue;seen.add(key);out.push({race,cls,plan});}}
 return out;}
function party(mx){return [build("Hero",mx.race,mx.cls,R.START_KIT[mx.cls].alloc,R.START_KIT[mx.cls].skill,LVL)].concat(mx.plan.map(d=>{const c=build(d.name,d.race,d.cls,d.alloc,d.skill,LVL);c.companion=true;return c;}));}
function giveKit(p){p.forEach(c=>{c.bag.push("potion","potion","ether");});p[0].bag.push("c_elixir","c_elixir","salts");p.forEach(c=>{c.buff={str:0,sta:25,f:3,n:"Hunter's stew"};});}
function attackOnly(F){F.p.forEach((c,i)=>{if(!F.over&&c.hp>0)F.act(i,"attack",null,0);});}
function sensible(F){const g=F.m[0],mhp=c=>R.maxHp(c,F.d.hp);
 F.p.forEach((c,i)=>{if(F.over||c.hp<=0)return;
  const sk=c.skills.map(id=>R.SKILLS[c.cls].find(s=>s.id===id)).filter(s=>s&&s.mp<=c.mp);
  const smashNext=F.turn%3===0&&F.mark===i,sweepNext=F.turn%3===2;
  const down=F.p.findIndex(x=>x.hp<=0);if(down>=0){const k=F.p.findIndex(x=>x.hp>0&&x.bag.includes("salts"));if(k===i){F.act(i,"item","salts",down);return;}}
  if(smashNext||(sweepNext&&c.hp<mhp(c)*0.55)){F.act(i,"defend");return;}
  const heal=sk.find(s=>s.k==="heal"),low=F.p.filter(x=>x.hp>0&&x.hp<mhp(x)*0.45);
  if(low.length&&heal){F.act(i,"skill",heal.id,0);return;}
  if(c.hp<mhp(c)*0.4){const it=["c_elixir","potion"].find(id=>c.bag.includes(id));if(it){F.act(i,"item",it,i);return;}}
  if(c.mp<10&&c.bag.includes("ether")){F.act(i,"item","ether",i);return;}
  const dmg=sk.filter(s=>s.k==="phys"||s.k==="magic").sort((a,b)=>b.p-a.p)[0];
  if(dmg)F.act(i,"skill",dmg.id,0);else F.act(i,"attack",null,0);});}
function fight(p,seed,player){const F=new R.Fight(p,[R.makeBoss("normal")],"normal",seed);for(let r=0;r<200&&!F.over;r++){player(F);if(!F.over)F.monstersTurn();}return {win:F.over==="win",rounds:F.turn,hpLeft:F.m[0].hp/F.m[0].max};}
function run(){const M=mixes(),player=OPT("--sensible")?sensible:attackOnly,rows=[];
 M.forEach((mx,mi)=>{let w=0,rd=0,hl=0;for(let k=0;k<N;k++){const p=party(mx);if(OPT("--kit"))giveKit(p);const r=fight(p,(mi*100003+k*7919+17)>>>0,player);w+=r.win;rd+=r.rounds;hl+=r.hpLeft;}
  rows.push({mix:`${mx.race} ${mx.cls} hero + ${mx.plan.map(d=>d.name+" "+d.race+" "+d.cls).join(", ")}`,win:100*w/N,rounds:rd/N,golemHpLeft:100*hl/N});});
 return rows;}
if(require.main===module){const rows=run(),mode=(OPT("--sensible")?"sensible":"attack-only")+(OPT("--kit")?" + kit":"");
 if(OPT("--json")){console.log(JSON.stringify(rows));return;}
 console.log(`Iron Golem, ${mode}, all members L${LVL}, zone ${GZ} gear, ${N} fights per mix, ${rows.length} mixes`);
 console.log("| # | party mix | win % | avg rounds | Golem HP left % |\n|---|---|---|---|---|");
 rows.forEach((r,i)=>console.log(`| ${i+1} | ${r.mix} | ${r.win.toFixed(1)} | ${r.rounds.toFixed(1)} | ${r.golemHpLeft.toFixed(1)} |`));
 const ws=rows.map(r=>r.win);console.log(`min ${Math.min(...ws).toFixed(1)}%  max ${Math.max(...ws).toFixed(1)}%  mean ${(ws.reduce((a,b)=>a+b,0)/ws.length).toFixed(1)}%`);}
module.exports={mixes,party,run,fight,attackOnly,sensible,giveKit,R};
