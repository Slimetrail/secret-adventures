/* Local approved pool + spacing adapter. No economy or combat math changes. */
(function(root){'use strict';
function install(S,R,H,M){const api=S.rpg.s6,pools=root.PACKAGE_POOLS,oldCamp=H.camp,oldTavern=H.tavern,oldCraft=H.craft,oldJoined=H.joined;
const code={Quirky:'Q',Scholar:'S',Angry:'A',Any:'H'},rand=()=>5+Math.floor(Math.random()*6);
const state=()=>api.st(),live=()=>S.rpg.live(),present=r=>code[r.speaker]==='H'||api.who(code[r.speaker]);
function gate(row,ev={}){const s=state(),l=live(),c=row.condition;if(!s||!l||!present(row))return false;
 if(row===pools.camp.find(r=>r.id==='7'))return false; // third favored-meal count is not observed yet
 if(row===pools['wall-art'].find(r=>r.id==='1'))return ev.zone===1;
 if(c==='None')return true;if(c==='Beat-up')return l.party.some(p=>p.hp<=R.maxHp(p,R.DIFF[l.diff].hp)*.25);
 if(c==='After dad reveal')return !!s.revealed;if(c==='Rations only'||c==='Rations only or not a group meal')return s.lastMeal==='ration';if(c==='Good food cooked')return s.lastMeal==='cooked';
 if(c==='save-the-world join'||c==='save-the-world join + already joined')return api.brunnVer()==='save'&&!!api.who('A');if(c==='team-died join')return api.brunnVer()==='died'&&!!api.who('A');
 if(c==='Long crafting stay')return ev.craft===true;if(c==='Tavern 3')return ev.t===2;
 if(/^Zone [1-5]$/.test(c))return ev.zone===+c.slice(-1);if(c==='Not zone 5')return ev.zone!=null&&ev.zone!==5;if(c==='Zone 5 last two arts')return ev.id===80||ev.id===84;
 if(c==='Fight start'||c.includes('Fight start +'))return ev.phase==='start';if(c==='Fight end'||c.includes('Fight end +'))return ev.phase==='end'&&row.id!=='30';if(c==='After fight'||c.includes('After fight +'))return ev.phase==='after';
 // Unobserved meal favoritism/bar tabs/high-count definitions are not invented.
 return false;}
function pick(pool,ev){const s=state();if(!s)return null;const eligible=pools[pool].filter(r=>r.layer==='A'&&gate(r,ev));return eligible.find(r=>!s.seen['pool-'+pool+'-'+r.id])||eligible[Math.floor(Math.random()*eligible.length)];}
function sayRow(pool,row,opt){if(!row)return false;state().seen['pool-'+pool+'-'+row.id]=1;api.play(pool,[[code[row.speaker],'calm',row.text]],opt||{bg:null});return true;}
function pool(pool,ev,opt){return sayRow(pool,pick(pool,ev),opt);}
// Sequential fallback already calls oldCamp; replace that older unapproved fallback only when no sequential is eligible.
H.camp=k=>{if(api.sequential.select('camp'))return oldCamp(k);return pool('camp');};
H.tavern=t=>{const s=state(),l=live();if(!s||!l)return;const key=t+':'+l.steps;if(s.packageTavernVisit===key)return;s.packageTavernVisit=key;
 if(api.sequential.select('tavern'))return oldTavern(t);s.visit=key;s.shopN=0;pool('tavern',{t},{bg:'art6/tavern-'+(t+1)+'.webp'});};
H.craft=(kind,t)=>{if(!['food','armor','ore','weapons'].includes(kind)||!Number.isInteger(t)||t<0)return;if(api.sequential.select('craft-wait'))return oldCraft(kind,t);return pool('tavern',{craft:true,t},{bg:'art6/tavern-'+(t+1)+'.webp'});};
H.joined=(c,t)=>{const s=state();if(!s)return;if(t!==3)return oldJoined(c,t);s.brunnJoin=s.walls[api.LETTER_KEYS.crack]?'save':'died';s.seen['join'+t]=1;
 const ids=s.brunnJoin==='save'?['82','84']:['83','85'];const lines=ids.map(id=>pools.tavern.find(r=>r.id===id)).filter(present).map(r=>[code[r.speaker],'calm',r.text]);api.play('join',lines,{bg:'art6/tavern-4.webp'});};
// Fight-end overlays are silent; one post-victory slot is due every 5..10 wins, persisted in save.
H.fightEnd=()=>{};
H.fightContinue=snapshot=>{const s=state();if(!s)return false;if(!Number.isInteger(s.afterGap))s.afterGap=rand();s.afterCount=(s.afterCount|0)+1;if(s.afterCount<s.afterGap)return false;s.afterCount=0;const prev=s.afterGap;do{s.afterGap=rand();}while(s.afterGap===prev);
 if(api.sequential.run('after-fight',snapshot))return true;
 const unused=pools['post-combat'].filter(r=>gate(r,{phase:'after'})&&!s.seen['pool-post-combat-'+r.id]);if(unused.length)return sayRow('post-combat',unused[0]);
 if(api.sequential.run('after-fight',snapshot,null,true))return true;return pool('post-combat',{phase:'after'});};
// Start uses the checked short pool. The existing portrait overlay renderer reads D.fight.
for(const c of ['Q','S','A'])for(const tone of ['fun','dark']){const rows=pools['post-combat'].filter(r=>code[r.speaker]===c&&r.condition.startsWith('Fight start'));if(rows.length)root.STORY.fight.start[c][tone]=rows.map(r=>r.text);}
H.reachedTavern=t=>{const s=state();if(s)s.journalWear=Math.max(s.journalWear||1,t>=2?4:t>=1?3:1);};
const owners=root.PACKAGE_STORY.owners;
H.owner=(t,job)=>{const s=state();if(!s||t<0||t>3)return;const row=owners.find(r=>r.id==='TO'+(t+1)+'-'+job);if(row)api.play('keeper',[['K'+(t+1),row.mood,row.text]],{bg:'art6/tavern-'+(t+1)+'.webp'});};
H.ownerVisit=t=>{const s=state();if(!s||t<0||t>3)return;s.ownerVisits=s.ownerVisits||{};const key=t+':'+live().steps;if(s.ownerVisitKey===key)return;s.ownerVisitKey=key;if(!s.ownerVisits[t]){H.owner(t,'GREET');H.owner(t,'GREET2');}else H.owner(t,'BACK');s.ownerVisits[t]=true;};
api.packageDialogue={gate,pick,pool,rand};
}
root.PackageDialogue={install};if(typeof module!=='undefined')module.exports={install};if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=='undefined'?window:globalThis);
