/* t2194u/t2195u journal split (local only, unpublished).
   Everyday filler: generated from Dialogue's approved style-and-facts rule ONLY. No rule => no everyday pages.
   Handwritten camp-only pages: seven named slots, all empty until Eve hands approved text.
   Writing happens only from the camp hook. Never taverns, never walking (the maze page in map.js/game.js stays the only on-move page, t2192u).
   This file holds no journal prose on purpose. */
(function(root){'use strict';
const PICNIC_ROOM=80,BEDSIDE_ROOM=84; // zone5-08 picnic, zone5-09 bedside (story.js ROOM_ART)
const COMPANIONS=['Mira','Sorrel','Brunn'];
const SLOT_KINDS=['companion-first-meet','companion-a-while','companion-growing','party-more-family-than-dad','dad-shame-reveal','picnic-warm','bedside-before-picnic-hate'];
const PER_COMPANION={'companion-first-meet':1,'companion-a-while':1,'companion-growing':1};
// t2195u voice constraints: checks only, no sample sentences.
const VOICE=Object.freeze({hero:Object.freeze(['honest','worried','selfless','player-viewpoint']),
 companionsTrueToWrittenDialogue:COMPANIONS.slice(),noNewHeroPersonality:true,noDadLifeSpoonFeeding:true});
const FACT_KINDS=['worry-about-day','ordinary-life','fight-thoughts','locations','art-rooms-remembered','monster-drawings'];
function emptySlots(){const s={};SLOT_KINDS.forEach(k=>{s[k]=PER_COMPANION[k]?{Mira:null,Sorrel:null,Brunn:null}:null;});return s;}
let slots=emptySlots(),rule=null;
// Approved handwritten text arrives later via Eve. Until then every slot stays null.
function installPage(kind,text,companion){if(SLOT_KINDS.indexOf(kind)<0)throw new Error('unknown slot '+kind);
 if(typeof text!=='string'||!text.trim())throw new Error('empty page');
 if(PER_COMPANION[kind]){if(COMPANIONS.indexOf(companion)<0)throw new Error('companion required');slots[kind][companion]=text;}else slots[kind]=text;}
// Rule shape (from Dialogue): {approved:true, voice:{hero:[...]}, render(facts)->[{kind,text}]}. Must satisfy t2195u.
function validRule(r){if(!r||r.approved!==true||typeof r.render!=='function'||!r.voice||!Array.isArray(r.voice.hero))return false;
 return VOICE.hero.every(v=>r.voice.hero.indexOf(v)>=0);}
function installRule(r){if(!validRule(r))throw new Error('rule missing approval or t2195u hero voice');rule=r;}
function hasRule(){return !!rule;}
// Facts only: ids/numbers/names from save state, never prose.
function collectFacts(live,story,ctx){live=live||{};story=story||{};ctx=ctx||{};
 const walls=Object.keys(story.walls||{}).map(Number).sort((a,b)=>a-b);
 return {zone:ctx.zone==null?null:ctx.zone,camp:ctx.camp==null?null:ctx.camp,steps:live.steps|0,
  party:(live.party||[]).map(c=>c&&c.name).filter(Boolean),
  recentFights:(ctx.recentFights||[]).slice(-5),locationsVisited:(ctx.locations||[]).slice(),
  artRoomsRemembered:walls,monstersObserved:(ctx.monsters||[]).map(m=>({id:m.id,strength:m.strength||null,weakness:m.weakness||null}))};}
function generateEveryday(facts){if(!rule)return [];const out=rule.render(facts)||[];
 return out.filter(p=>p&&typeof p.text==='string'&&p.text.trim()&&FACT_KINDS.indexOf(p.kind)>=0).map(p=>({kind:p.kind,text:p.text,generated:true}));}
// Order lock: use the existing wall-find list (story.order room ids, pushed in H.wall on first find).
// Unknown history (both walls set, no find list) does not invent hate.
function noteOrder(js,story){js.order=js.order||[];
 const found=Array.isArray(story&&story.order)?story.order:[];
 for(let i=0;i<found.length;i++){const id=+found[i];
  if(id===PICNIC_ROOM&&js.order.indexOf('picnic')<0)js.order.push('picnic');
  if(id===BEDSIDE_ROOM&&js.order.indexOf('bedside')<0)js.order.push('bedside');}
 const w=(story&&story.walls)||{},p=!!w[PICNIC_ROOM],b=!!w[BEDSIDE_ROOM];
 if(p&&b&&js.order.length===0){js.order.push('picnic','bedside');js.tie=true;}
 if(p&&js.order.indexOf('picnic')<0)js.order.push('picnic');if(b&&js.order.indexOf('bedside')<0)js.order.push('bedside');}
function dadPagesDue(js){const o=js.order||[],pi=o.indexOf('picnic'),bi=o.indexOf('bedside'),due=[];
 if(pi>=0)due.push('picnic-warm'); // always warm, whatever came first
 if(bi>=0&&(pi<0||bi<pi))due.push('bedside-before-picnic-hate');
 if(js.revealHit)due.push('dad-shame-reveal');if(js.familyDue)due.push('party-more-family-than-dad');return due;}
// The ONLY writer. where must be 'camp'.
function writeAt(where,live,story,ctx){if(where!=='camp')return [];if(!story)return [];
 const js=story.journalSplit=story.journalSplit||{pages:[],done:{}};ctx=ctx||{};noteOrder(js,story);
 if(ctx.revealHit)js.revealHit=true;if(ctx.familyDue)js.familyDue=true;const written=[];
 const add=(key,kind,text,companion)=>{if(js.done[key]||!text)return;js.done[key]=1;const pg={kind,text,companion:companion||null,camp:ctx.camp==null?null:ctx.camp};js.pages.push(pg);written.push(pg);};
 (ctx.companionStages||[]).forEach(cs=>{const k=cs.stage;if(PER_COMPANION[k]&&slots[k][cs.name])add(k+':'+cs.name,k,slots[k][cs.name],cs.name);});
 dadPagesDue(js).forEach(k=>{if(k==='bedside-before-picnic-hate'&&js.done['picnic-warm']&&!js.done[k]&&(js.order||[]).indexOf('picnic')<(js.order||[]).indexOf('bedside'))return;add(k,k,slots[k]);});
 generateEveryday(collectFacts(live,story,ctx)).forEach(p=>{js.pages.push(Object.assign({camp:ctx.camp==null?null:ctx.camp},p));written.push(p);});
 return written;}
const API={SLOT_KINDS,FACT_KINDS,VOICE,PICNIC_ROOM,BEDSIDE_ROOM,installPage,installRule,hasRule,validRule,collectFacts,generateEveryday,writeAt,dadPagesDue,noteOrder,
 slots:()=>JSON.parse(JSON.stringify(slots)),_reset:()=>{slots=emptySlots();rule=null;},status:()=>({everyday:rule?'rule-installed':'pending-style-and-facts-rule',handwritten:'held-until-eve'})};
root.StoryJournalSplit=API;if(typeof module!=='undefined')module.exports=API;
// Browser glue: wrap the camp screen only. No tavern, movement, or map hooks.
const S=root.SOTA;if(S&&S.rpg&&S.rpg.s5&&typeof S.rpg.s5.campScreen==='function'){const orig=S.rpg.s5.campScreen;
 S.rpg.s5.campScreen=function(k){const r=orig.apply(this,arguments);try{const l=S.rpg.live&&S.rpg.live();const s=S.rpg.s6&&S.rpg.s6.st&&S.rpg.s6.st();writeAt('camp',l,s,{camp:k});}catch(e){}return r;};
 if(S.rpg.s6){S.rpg.s6.journalSplit=API;S.rpg.s6.journalWritingHeld=!rule;}}
})(typeof window!=='undefined'?window:globalThis);
