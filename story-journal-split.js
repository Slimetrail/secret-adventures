/* t2194u/t2195u/t2197u/t2198u journal split (local only, unpublished).
   Everyday filler: generated from Dialogue's approved style-and-facts rule ONLY. No rule => no everyday pages.
   Handwritten camp-only pages: nine named slots, empty until installed by story-journal-install.js (approved text lives in story-journal-pages.js).
   Zone art notes use locked feeling keys (journal only, not spoken dialogue). No journal prose is stored here.
   Writing happens only from the camp hook. Never taverns, never walking (the maze page in map.js/game.js stays the only on-move page, t2192u). */
(function(root){'use strict';
const PICNIC_ROOM=80,BEDSIDE_ROOM=84; // zone5-08 picnic, zone5-09 bedside (story.js ROOM_ART)
const COMPANIONS=['Mira','Sorrel','Brunn'];
const SLOT_KINDS=['companion-first-meet','companion-a-while','companion-growing','party-more-family-than-dad','dad-shame-reveal','picnic-warm','bedside-before-picnic-hate','zone5-mystery','zone5-stitch'];
// Approved handwritten page IDs per slot (t2194u). Text arrives only via installPage from a separate data file.
const PAGE_ID={'companion-first-meet':'J-join-','companion-a-while':'J-awhile-','companion-growing':'J-grow-','party-more-family-than-dad':'J-party-family','dad-shame-reveal':'J-shame-dad','picnic-warm':'J-picnic-reveal','bedside-before-picnic-hate':'J-bedside-hate','zone5-mystery':'J-zone5-mystery','zone5-stitch':'J-zone5-stitch'};
const JOIN_FLAG={Mira:'join0',Sorrel:'join1',Brunn:'join3'};
const ZONE5_EARLY=[60,69,58,67,83,78,62]; // zone5-01..07 art rooms
const STAGE_NEXT={'companion-first-meet':'companion-a-while','companion-a-while':'companion-growing'};
const PER_COMPANION={'companion-first-meet':1,'companion-a-while':1,'companion-growing':1};
// t2195u voice constraints: checks only, no sample sentences.
const VOICE=Object.freeze({hero:Object.freeze(['honest','worried','selfless','player-viewpoint']),
 companionsTrueToWrittenDialogue:COMPANIONS.slice(),noNewHeroPersonality:true,noDadLifeSpoonFeeding:true});
const FACT_KINDS=['worry-about-day','ordinary-life','fight-thoughts','locations','art-rooms-remembered','monster-drawings'];
// t2197u/t2198u feeling keys only. Zone 1 alt = any dad reveal. Zones 2-5 alt = bedside before picnic. Zone 5 mystery drops after naming.
const ZONE_FEEL=Object.freeze({1:Object.freeze({def:'scary',revealed:'sadness-for-father'}),
 2:Object.freeze({def:'worry-insane-like-drawer',bedsideFirst:'worry-insane-like-dad'}),
 3:Object.freeze({def:'curiosity-awe-cracked-crystal',bedsideFirst:'why-did-you-do-this-dad'}),
 4:Object.freeze({def:'interest-in-ritual',bedsideFirst:'shame-for-dad'}),
 5:Object.freeze({def:'mystery-person-maybe-cause-ashamed',bedsideFirst:'stitch-what-happened'})});
function emptySlots(){const s={};SLOT_KINDS.forEach(k=>{s[k]=PER_COMPANION[k]?{Mira:null,Sorrel:null,Brunn:null}:null;});return s;}
let slots=emptySlots(),rule=null;
function okText(t){return typeof t==='string'&&!!t.trim();}
// Brunn's join page may be {A,B}; one variant is chosen at write time from story.brunnJoin and then frozen.
function installPage(kind,text,companion){if(SLOT_KINDS.indexOf(kind)<0)throw new Error('unknown slot '+kind);
 const variants=kind==='companion-first-meet'&&companion==='Brunn'&&text&&typeof text==='object';
 if(variants?!(okText(text.A)&&okText(text.B)):!okText(text))throw new Error('empty page');
 if(PER_COMPANION[kind]){if(COMPANIONS.indexOf(companion)<0)throw new Error('companion required');slots[kind][companion]=text;}else slots[kind]=text;}
// Rule shape (from Dialogue): {approved:true, voice:{hero:[...]}, render(facts)->[{kind,text}]}. Must satisfy t2195u.
function validRule(r){if(!r||r.approved!==true||typeof r.render!=='function'||!r.voice||!Array.isArray(r.voice.hero))return false;
 return VOICE.hero.every(v=>r.voice.hero.indexOf(v)>=0);}
function installRule(r){if(!validRule(r))throw new Error('rule missing approval or t2195u hero voice');rule=r;}
function hasRule(){return !!rule;}
// Facts only: ids/numbers/names from save state, never prose.
function revealState(story){const w=(story&&story.walls)||{};
 const tmp={order:((((story||{}).journalSplit)||{}).order||[]).slice()};
 noteOrder(tmp,story);const o=tmp.order||[];const pi=o.indexOf('picnic'),bi=o.indexOf('bedside');
 const picnic=!!w[PICNIC_ROOM],bedside=!!w[BEDSIDE_ROOM];
 return {picnic:picnic,bedside:bedside,revealed:picnic||bedside,bedsideFirst:bi>=0&&(pi<0||bi<pi),order:o};}
function zoneFeeling(zone,story){const spec=ZONE_FEEL[+zone];if(!spec)return null;const st=revealState(story);
 if(+zone===1)return st.revealed?spec.revealed:spec.def;
 if(+zone===5){if(st.bedsideFirst)return spec.bedsideFirst;if(st.revealed)return null;return spec.def;}
 return st.bedsideFirst?spec.bedsideFirst:spec.def;}
function zoneArtFeelings(story){const out={};for(let z=1;z<=5;z++){const f=zoneFeeling(z,story);if(f)out[z]=f;}return out;}
function dropNamedMystery(js,story){if(!revealState(story).revealed||!Array.isArray(js.pages))return;
 js.pages=js.pages.filter(p=>p.feeling!=='mystery-person-maybe-cause-ashamed');}
function collectFacts(live,story,ctx){live=live||{};story=story||{};ctx=ctx||{};
 const walls=Object.keys(story.walls||{}).map(Number).sort((a,b)=>a-b);const feel=zoneArtFeelings(story);const st=revealState(story);
 return {zone:ctx.zone==null?null:ctx.zone,camp:ctx.camp==null?null:ctx.camp,steps:live.steps|0,
  party:(live.party||[]).map(c=>c&&c.name).filter(Boolean),
  recentFights:(ctx.recentFights||[]).slice(-5),locationsVisited:(ctx.locations||[]).slice(),
  artRoomsRemembered:walls,monstersObserved:(ctx.monsters||[]).map(m=>({id:m.id,strength:m.strength||null,weakness:m.weakness||null})),
  revealed:!!st.revealed,bedsideFirst:!!st.bedsideFirst,zoneArtFeelings:feel,joined:COMPANIONS.filter(c=>((story.seen||{})[JOIN_FLAG[c]]))};}
// Reserved for handwritten jobs or excluded outright (t2194u shared must-not-say). Generated filler naming these is refused.
const RESERVED=/\b(wife|mom|mother|golem|raised|pregnan\w*|got sick|got back|picnic|bedside|family|tavern|walking|letter|ending)\b|\bJ-[a-z]/i;
function generateEveryday(facts){if(!rule)return [];const out=rule.render(facts)||[];const allowed=(facts&&facts.zoneArtFeelings)||{};const joined=(facts&&facts.joined)||[];
 return out.filter(p=>{if(!p||typeof p.text!=='string'||!p.text.trim()||FACT_KINDS.indexOf(p.kind)<0)return false;
  if(RESERVED.test(p.text))return false;if(COMPANIONS.some(c=>joined.indexOf(c)<0&&new RegExp('\\b'+c+'\\b','i').test(p.text)))return false;
  if(p.zone!=null){const want=allowed[p.zone];if(!want||(p.feeling&&p.feeling!==want))return false;}return true;})
  .map(p=>{const o={kind:p.kind,text:p.text,generated:true,zone:p.zone==null?null:p.zone,feeling:p.feeling||null};if(p.key)o.key=String(p.key);return o;});}
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
// The ONLY writer. where must be 'camp'. Due pages derive from live/story; ctx may still override (tests).
function pageId(kind,companion,variant){const b=PAGE_ID[kind];return PER_COMPANION[kind]?b+String(companion).toLowerCase()+(variant?'#'+variant:''):b;}
function writeAt(where,live,story,ctx){if(where!=='camp')return [];if(!story)return [];
 const js=story.journalSplit=story.journalSplit||{pages:[],done:{}};ctx=ctx||{};js.at=js.at||{};noteOrder(js,story);dropNamedMystery(js,story);
 const cur=js.camps=(js.camps|0)+1,seen=story.seen||{},w=story.walls||{},st=revealState(story);
 if(st.revealed&&js.namedAt==null)js.namedAt=cur;
 if(ctx.revealHit||st.revealed)js.revealHit=true;
 const before=k=>js.at[k]!=null&&js.at[k]<cur;
 if(ctx.familyDue||(seen.join3&&before('companion-first-meet:Brunn')))js.familyDue=true;const written=[];
 const add=(key,kind,text,companion,variant)=>{if(js.done[key]||!text)return;js.done[key]=1;js.at[key]=cur;const pg={kind,id:pageId(kind,companion,variant),text,companion:companion||null,camp:ctx.camp==null?null:ctx.camp,campNo:cur};js.pages.push(pg);written.push(pg);};
 let stages=ctx.companionStages;
 if(!stages){stages=[];COMPANIONS.forEach(c=>{if(!seen[JOIN_FLAG[c]])return;let k='companion-first-meet';
  while(js.done[k+':'+c]){const n=STAGE_NEXT[k];if(!n||!before(k+':'+c)){k=null;break;}k=n;}
  if(k&&!js.done[k+':'+c])stages.push({name:c,stage:k});});}
 stages.forEach(cs=>{const k=cs.stage;if(!PER_COMPANION[k])return;let t=slots[k][cs.name],v=null;
  if(t&&typeof t==='object'){v=js.brunnPick=js.brunnPick||(story.brunnJoin==='save'?'A':'B');t=t[v];}
  add(k+':'+cs.name,k,t,cs.name,v);});
 if(js.familyDue)add('party-more-family-than-dad','party-more-family-than-dad',slots['party-more-family-than-dad']);
 dadPagesDue(js).forEach(k=>{if(k==='party-more-family-than-dad')return;if(k==='bedside-before-picnic-hate'&&js.done['picnic-warm']&&!js.done[k]&&(js.order||[]).indexOf('picnic')<(js.order||[]).indexOf('bedside'))return;add(k,k,slots[k]);});
 if(!st.revealed&&ZONE5_EARLY.some(id=>w[id]))add('zone5-mystery','zone5-mystery',slots['zone5-mystery']);
 if(st.bedsideFirst&&js.namedAt!=null&&js.namedAt<cur){const o=Array.isArray(story.order)?story.order.map(Number):[],bi=o.indexOf(BEDSIDE_ROOM);
  if(bi>=0&&o.slice(bi+1).some(id=>id===PICNIC_ROOM||ZONE5_EARLY.indexOf(id)>=0))add('zone5-stitch','zone5-stitch',slots['zone5-stitch']);}
 generateEveryday(collectFacts(live,story,ctx)).forEach(p=>{if(p.key){if(js.done['gen:'+p.key])return;js.done['gen:'+p.key]=1;}const pg=Object.assign({camp:ctx.camp==null?null:ctx.camp,campNo:cur},p);js.pages.push(pg);written.push(pg);});
 return written;}
const API={RESERVED,SLOT_KINDS,FACT_KINDS,ZONE_FEEL,VOICE,PICNIC_ROOM,BEDSIDE_ROOM,installPage,installRule,hasRule,validRule,collectFacts,generateEveryday,writeAt,dadPagesDue,noteOrder,revealState,zoneFeeling,zoneArtFeelings,
 slots:()=>JSON.parse(JSON.stringify(slots)),_reset:()=>{slots=emptySlots();rule=null;},PAGE_ID,pageId,status:()=>({everyday:rule?'rule-installed':'pending-style-and-facts-rule',handwritten:SLOT_KINDS.some(k=>{const v=slots[k];return v&&(typeof v!=='object'||Object.values(v).some(Boolean));})?'installed':'held-until-eve'})};
root.StoryJournalSplit=API;if(typeof module!=='undefined')module.exports=API;
// Browser glue: wrap the camp screen only. No tavern, movement, or map hooks.
const S=root.SOTA;if(S&&S.rpg&&S.rpg.s5&&typeof S.rpg.s5.campScreen==='function'){const orig=S.rpg.s5.campScreen;
 S.rpg.s5.campScreen=function(k){const r=orig.apply(this,arguments);try{const l=S.rpg.live&&S.rpg.live();const s=S.rpg.s6&&S.rpg.s6.st&&S.rpg.s6.st();const z=S.state&&S.state().zone;writeAt('camp',l,s,{camp:k,zone:z==null?null:z});}catch(e){}return r;};
 if(S.rpg.s6){S.rpg.s6.journalSplit=API;S.rpg.s6.journalWritingHeld=!rule;}}
})(typeof window!=='undefined'?window:globalThis);
