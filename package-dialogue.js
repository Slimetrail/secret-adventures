/* Local approved pool + spacing adapter. No economy or combat math changes. */
(function(root){'use strict';
function install(S,R,H,M){const api=S.rpg.s6,pools=root.PACKAGE_POOLS,oldCamp=H.camp,oldTavern=H.tavern,oldCraft=H.craft,oldJoined=H.joined;
const code={Quirky:'Q',Scholar:'S',Angry:'A',Any:'H'},rand=()=>5+Math.floor(Math.random()*6);
const FAV_N=3; // t2778u: 'several times' / 'third ... in a row'
const state=()=>api.st(),live=()=>S.rpg.live(),present=r=>code[r.speaker]==='H'||api.who(code[r.speaker]);
function gate(row,ev={}){const s=state(),l=live(),c=row.condition;if(!s||!l||!present(row))return false;
 // t2778u: counted when a cooked dish is EATEN (H.ateMeal): the party's third stamina meal in a row
 if(row===pools.camp.find(r=>r.id==='7'))return (s.staMealRun|0)===FAV_N;
 const fm=/^(Quirky|Scholar|Angry)'s favored buff meal several times$/.exec(c);if(fm)return ((s.favMeal||{})[code[fm[1]]]|0)>=FAV_N; // this speaker only (t1924u)
 if(row===pools['wall-art'].find(r=>r.id==='1'))return ev.zone===1;
 if(c==='None')return true;if(c==='Beat-up')return l.party.some(p=>p.hp<=R.maxHp(p,R.DIFF[l.diff].hp)*.25);
 if(c==='After dad reveal')return !!s.revealed;if(c==='Rations only'||c==='Rations only or not a group meal')return s.lastMeal==='ration';if(c==='Good food cooked')return s.lastMeal==='cooked';
 if(c==='save-the-world join'||c==='save-the-world join + already joined')return api.brunnVer()==='save'&&!!api.who('A');if(c==='team-died join')return api.brunnVer()==='died'&&!!api.who('A');
 if(c==='Long crafting stay')return ev.craft===true;if(c==='Tavern 3')return ev.t===2;
 if(/^Zone [1-5]$/.test(c))return ev.zone===+c.slice(-1);if(c==='Not zone 5')return ev.zone!=null&&ev.zone!==5;if(c==='Zone 5 last two arts')return ev.id===80||ev.id===84;
 if(c==='Fight start'||c.includes('Fight start +'))return ev.phase==='start';if(c==='Fight end'||c.includes('Fight end +'))return ev.phase==='end'&&row.id!=='30';if(c==='After fight'||c.includes('After fight +'))return ev.phase==='after';
 // Unobserved meal favoritism/bar tabs/high-count definitions are not invented.
 return false;}
function pick(pool,ev){const s=state();if(!s)return null;const eligible=pools[pool].filter(r=>r.layer==='A'&&gate(r,ev));
 // t2670u/t2675u: per-save shuffled order (unseen first, then repeat cycles) instead of file order + Math.random. Same gates.
 const V=root.Variety;if(V&&V.active()&&eligible.length){const all=pools[pool].filter(r=>r.layer==='A').map(r=>String(r.id)),ok=new Set(eligible.map(r=>String(r.id))),unseen=new Set(eligible.filter(r=>!s.seen['pool-'+pool+'-'+r.id]).map(r=>String(r.id)));
  const id=unseen.size?V.walk('pool:'+pool,all,i=>unseen.has(i)):V.walk('pool-r:'+pool,all,i=>ok.has(i));const row=id!=null&&eligible.find(r=>String(r.id)===id);if(row)return row;}
 return eligible.find(r=>!s.seen['pool-'+pool+'-'+r.id])||eligible[Math.floor(Math.random()*eligible.length)];}
function sayRow(pool,row,opt){if(!row)return false;state().seen['pool-'+pool+'-'+row.id]=1;api.play(pool,[[code[row.speaker],'calm',row.text]],opt||{bg:null});return true;}
function pool(pool,ev,opt){return sayRow(pool,pick(pool,ev),opt);}
// Sequential fallback already calls oldCamp; replace that older unapproved fallback only when no sequential is eligible.
H.camp=k=>{if(api.sequential.select('camp'))return oldCamp(k);const row=pick('camp');return sayRow('camp',row,{bg:S.rpg.s5.campBg(row)});};
H.tavern=t=>{const s=state(),l=live();if(!s||!l)return;const key=t+':'+l.steps;if(s.packageTavernVisit===key)return;s.packageTavernVisit=key;
 if(api.sequential.select('tavern'))return oldTavern(t);s.visit=key;s.shopN=0;pool('tavern',{t},{bg:S.rpg.s5.tavernBg(t)});};
H.craft=(kind,t)=>{if(!['food','armor','ore','weapons'].includes(kind)||!Number.isInteger(t)||t<0)return;if(api.sequential.select('craft-wait'))return oldCraft(kind,t);return pool('tavern',{craft:true,t},{bg:S.rpg.s5.tavernBg(t)});};
H.joined=(c,t)=>{const s=state();if(!s)return;if(t!==3)return oldJoined(c,t);if(!s.brunnJoin)s.brunnJoin=api.brunnJoinVersion();s.seen['join'+t]=1;
 const ids=s.brunnJoin==='save'?['82','84']:['83','85'];let lines=ids.map(id=>pools.tavern.find(r=>r.id===id)).filter(present).map(r=>[code[r.speaker],'calm',r.text]);if(root.Variety&&root.Variety.variantFor){const v=root.Variety.variantFor('join-brunn-'+s.brunnJoin,lines);if(!v.base)lines=v.lines.filter(l=>l[0]==='H'||l[0]==='N'||api.who(l[0])).map(l=>[l[0],'calm',l[2]]);}api.play('join',lines,{bg:S.rpg.s5.tavernBg(3)});};
// Fight-end overlays are silent; one post-victory slot is due every 5..10 wins, persisted in save.
H.fightEnd=()=>{};
H.fightContinue=snapshot=>{const s=state();if(!s)return false;if(!Number.isInteger(s.afterGap))s.afterGap=rand();s.afterCount=(s.afterCount|0)+1;if(s.afterCount<s.afterGap)return false;s.afterCount=0;const prev=s.afterGap;do{s.afterGap=rand();}while(s.afterGap===prev);
 if(api.sequential.run('after-fight',snapshot))return true;
 const unused=pools['post-combat'].filter(r=>gate(r,{phase:'after'})&&!s.seen['pool-post-combat-'+r.id]);if(unused.length){const V=root.Variety,r=V&&V.active()?pick('post-combat',{phase:'after'}):null;return sayRow('post-combat',r&&unused.includes(r)?r:unused[0]);}
 if(api.sequential.run('after-fight',snapshot,null,true))return true;return pool('post-combat',{phase:'after'});};
// Start uses the checked short pool. The existing portrait overlay renderer reads D.fight.
for(const c of ['Q','S','A'])for(const tone of ['fun','dark']){const rows=pools['post-combat'].filter(r=>code[r.speaker]===c&&r.condition.startsWith('Fight start'));if(rows.length)root.STORY.fight.start[c][tone]=rows.map(r=>r.text);}
H.reachedTavern=t=>{const s=state();if(s)s.journalWear=Math.max(s.journalWear||1,t>=2?4:t>=1?3:1);};
const owners=root.PACKAGE_STORY.owners;
H.owner=(t,job)=>{const s=state();if(!s||t<0||t>3)return;const row=owners.find(r=>r.id==='TO'+(t+1)+'-'+job);if(row)api.play('keeper',[['K'+(t+1),row.mood,row.text]],{bg:S.rpg.s5.tavernBg(t)});};
H.ownerVisit=t=>{const s=state();if(!s||t<0||t>3)return;s.ownerVisits=s.ownerVisits||{};const key=t+':'+live().steps;if(s.ownerVisitKey===key)return;s.ownerVisitKey=key;if(!s.ownerVisits[t]){H.owner(t,'GREET');H.owner(t,'GREET2');}else H.owner(t,'BACK');s.ownerVisits[t]=true;};
/* t2778u/t2780u: one cooked dish fed the whole party. Each companion PRESENT whose favored meal this is counts it (in a row: another dish resets
   that companion's own count); companions not in the party are untouched. A companion favors a dish that raises their class's main stat
   (str / sta; a mage's main stat is mana, so a mana dish). When this meal makes a count reach 3, that speaker's own favored-meal brag plays
   right away (t1908u brag only, no other effect). One talk at a time: a brag first, else the third-stamina-meal line. */
function favors(m,fx){const cl=R.CLASSES[m.cls],k=cl&&cl.main;return !!fx&&(k==='man'?fx.mp>0:fx[k]>0);}
H.ateMeal=(id,fx)=>{const s=state();if(!s||!fx)return false;s.favMeal=s.favMeal&&typeof s.favMeal==='object'?s.favMeal:{};const earned=[];
 for(const k of ['Q','S','A']){const m=api.who(k);if(!m)continue;if(favors(m,fx)){s.favMeal[k]=(s.favMeal[k]|0)+1;if(s.favMeal[k]===FAV_N)earned.push(k);}else s.favMeal[k]=0;}
 s.staMealRun=fx.sta>0?(s.staMealRun|0)+1:0;s.lastMealId=id;
 let row=null;for(const k of earned){const rows=pools.camp.filter(r=>r.layer==='A'&&code[r.speaker]===k&&/favored buff meal several times$/.test(r.condition)&&gate(r));row=rows.find(r=>!s.seen['pool-camp-'+r.id])||rows[0]||null;if(row)break;}
 if(!row&&s.staMealRun===FAV_N){const r7=pools.camp.find(r=>r.id==='7');if(r7&&gate(r7))row=r7;}
 return row?sayRow('camp',row,{bg:S.rpg.s5.campBg(row)}):false;};
api.packageDialogue={gate,pick,pool,rand,favors};
}
root.PackageDialogue={install};if(typeof module!=='undefined')module.exports={install};if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=='undefined'?window:globalThis);
