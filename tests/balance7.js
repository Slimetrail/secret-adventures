/* Reproducible Stage 7 balance fixture, no network. Legal earned stats/gear; no edited combat values. */
function preparedParty(R,diff,level=50,tier=5){
 return [['human','warrior'],['cat','rogue'],['elf','mage'],['dwarf','archer']].map(([race,cls])=>{
  const c=R.newChar(cls,race,cls,{},R.SKILLS[cls][0].id);c.lvl=level;
  const main=R.CLASSES[cls].main;
  // Spend earned points: a main-stat focus, with a survivability reserve (all raises use real costs).
  while(c.stats[main]<Math.round(12+level*.7)&&R.raise(c,main)){}
  while(c.stats.sta<Math.round(8+level*.45)&&R.raise(c,'sta')){}
  while(R.raise(c,main)){}
  c.skills=R.SKILLS[cls].map(s=>s.id).slice(0,R.skillSlots(level));
  const kit={warrior:['sword','plate'],rogue:['dagger','robe'],mage:['staff','robe'],archer:['bow','plate']}[cls];
  for(const id of kit){const key='relic'+tier+'_'+id;c.bag.push(key);R.equip(c,key,R.ITEMS[key].slot);}
  for(const [id,slot] of [['ring','acc1'],['amulet','acc2']]){const key='relic'+tier+'_'+id;c.bag.push(key);R.equip(c,key,slot);}
  c.hp=R.maxHp(c,R.DIFF[diff].hp);c.mp=R.maxMp(c);return c;
 });
}
function bossSample(R,diff,seed,policy='best'){const p=preparedParty(R,diff);
 // simulate picks the first affordable attack skill: order known skills to model using the strongest one.
 if(policy==='best')p.forEach(c=>c.skills.sort((a,b)=>R.SKILLS[c.cls].find(s=>s.id===b).p-R.SKILLS[c.cls].find(s=>s.id===a).p));
 const initial=p.reduce((s,c)=>s+c.hp,0),f=R.simulate(p,[R.makeBoss(diff)],diff,seed);
 return {over:f.over,turns:f.turn,hp:p.reduce((s,c)=>s+c.hp,0),initial,ko:p.filter(c=>c.hp<=0).length};}
function progression(R,counts=[12,23,27,24,25],seed=1000){
 const c=R.newChar('Explorer','human','warrior',{},'cleave'),out=[];let total=0;
 for(let z=1;z<=5;z++){for(let i=0;i<counts[z-1];i++){
  const mk=i<[3,4,6,7,9][z-1]?R.roomEncounter:R.encounter,mons=mk(z,c.lvl,z/5,'normal',seed+z*1000+i);
  const rw=new R.Fight([c],mons,'normal',1).rewards(1);total+=rw.xp;R.gainXp(c,rw.xp,1);
 }out.push(c.lvl);}
 return {counts,levels:out,xp:total,capXP:Array.from({length:49},(_,i)=>R.xpNeed(i+1)).reduce((s,x)=>s+x,0)};
}
function routeBudget(M){
 const N=M.n,D=[[0,-1],[1,0],[0,1],[-1,0]],ix=p=>p[1]*N+p[0],zone=p=>+M.zone[ix(p)],mask=[...M.mask].map(c=>parseInt(c,16));let cur=ix(M.entrance),steps=0;const perZone=[];
 function nearest(targets){const q=[cur],dist=new Map([[cur,0]]);for(let at=0;at<q.length;at++){const u=q[at];if(targets.has(u))return [u,dist.get(u)];D.forEach(([dx,dy],k)=>{if(mask[u]&(1<<k)){const v=u+dx+dy*N;if(!dist.has(v)){dist.set(v,dist.get(u)+1);q.push(v);}}});}throw Error('unreachable');}
 for(let z=1;z<=5;z++){const start=steps,targets=new Set(M.rooms.filter(r=>r.z===z).map(r=>ix(r.c)).concat(M.camps.filter(p=>zone(p)===z).map(ix)));
  while(targets.size){const [next,d]=nearest(targets);cur=next;steps+=d;targets.delete(cur);}
  const [next,d]=nearest(new Set([ix(z<5?M.taverns[z-1]:M.centre)]));cur=next;steps+=d;perZone.push(steps-start);
 }
 return {steps,perZone,hallwayBaseRate:.02,effectiveCooldownRate:1/(50+9),expectedHallway:Math.round(steps/(50+9)),fixedMonsterRooms:29,mainRoute:697};
}
if(typeof module!=='undefined'){module.exports={preparedParty,bossSample,progression,routeBudget};if(require.main===module){global.window={};const R=require('../rules.js');require('../maze-data.js');
 console.log(JSON.stringify({route:routeBudget(window.MAZE),boss:Object.fromEntries(['story','normal','hard'].map(d=>[d,Array.from({length:40},(_,i)=>bossSample(R,d,i+1))])),starterNormal:Array.from({length:40},(_,i)=>bossSample(R,'normal',i+1,'starter')),progression:Array.from({length:20},(_,i)=>progression(R,undefined,i*7919))},null,2));}}
