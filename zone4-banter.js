/* MODULE: zone4-banter (t2667u/t2668u). Zone 4 talk routing + party-mix picker. No story text lives in this file.
   PLACE: secret-adventures / zone4-banter / <slot> / dialogue / <talk id>
   Only active while S.state().zone===4. Zones 1-3 (and 5) run the existing talk chain untouched.
   In zone 4, for each slot the order is:
    1. the zone 4 talks already in story-data.js that the newer chain shadowed (camp: STORY.camp.dark c5-c8; tavern: STORY.tavern[3] t3a),
    2. Dialogue Lead's zone 4 talks (batch14-talks.js) picked by party mix: talks for the EXACT mix of companions first, then talks
       for smaller mixes inside the party (largest first), then hero-only talks. A talk never plays when one of its speakers is absent.
    3. the existing everyday chain (package-dialogue.js -> batch1-13 sequential talks -> pool barks),
    4. if that stays silent too: one GENERIC existing line (approved "Any"-speaker pool rows, or the narrator camp line c8).
   So no party mix is silent at a zone 4 camp or tavern. After-fight keeps the existing 5-10 win spacing; zone 4 talks are added
   on every AFTER_EVERY-th zone 4 win. Drop-in for the batch: see ZONE4-BANTER-MODULE.md. */
(function(root){
"use strict";
const CODE={mira:"Q",sorrel:"S",brunn:"A"},ID={Q:"mira",S:"sorrel",A:"brunn"};
const SLOTS=["camp","after-fight","tavern","craft-wait"],AFTER_EVERY=3;
// Existing in-game lines only. "pool:<pool>:<id>" = PACKAGE_POOLS row (speaker Any plays as the hero); "camp:<id>" = STORY.camp scene with
// no need and only narrator/hero speakers.
const GENERIC={camp:["pool:camp:20","camp:c8"],tavern:["pool:tavern:8"],"after-fight":["pool:post-combat:3"],"craft-wait":["pool:tavern:31"]};
function normId(x){if(x==null)return null;x=String(x);if(/^[QSA]$/.test(x))return ID[x];x=x.toLowerCase();return CODE[x]?x:null;}
function mixKey(ids){const a=[...new Set([].concat(ids||[]).map(normId).filter(Boolean))].sort();return a.length?a.join("+"):"hero";}
function keyIds(key){return key==="hero"?[]:String(key).split("+");}
function subsetKeys(ids){const a=keyIds(mixKey(ids)),out=[];for(let m=(1<<a.length)-1;m>=0;m--)out.push(a.filter((_,i)=>m>>i&1));
 return out.sort((x,y)=>y.length-x.length||(mixKey(x)<mixKey(y)?-1:1)).map(mixKey);}
function parsePlace(p){if(typeof p!=="string")return null;const m=p.replace(/^\s*PLACE:\s*/i,"").split("/").map(s=>s.trim());if(m.length!==5||m.some(s=>!s))return null;
 return {project:m[0],scene:m[1],slot:m[2],type:m[3],piece:m[4]};}
function speakers(lines){const s=new Set();(lines||[]).forEach(l=>{const w=Array.isArray(l)?l[0]:null;const id=normId(w);if(id)s.add(id);else if(w!=="H"&&w!=="N")s.add("?"+w);
 String(Array.isArray(l)?l[2]:"").replace(/\{([QSA])\}/g,(_,c)=>{s.add(ID[c]);return "";});});return s;}
// zone4-preA talks never play once Brunn is in the party (Mix A). batch14 TALKS -> {entries:[{id,key,slot,place,lines}], rejected:[{id,why}]}
function validate(talks){const out=[],bad=[],ids=new Set();
 (Array.isArray(talks)?talks:[]).forEach((t,i)=>{const id=t&&t.id!=null?String(t.id):"#"+i,sp=Array.isArray(t&&t.speakers)?t.speakers.map(normId):null,pl=t&&t.place!=null?parsePlace(t.place):undefined;
  const lineSp=t&&Array.isArray(t.lines)?[...speakers(t.lines)]:[];
  const why=!sp||sp.some(x=>!x)?"speakers must be Q/S/A codes":!SLOTS.includes(t.context)?"unknown context "+t.context:ids.has(id)?"duplicate id":
   !(t.gate==null||t.gate==="zone4"||t.gate==="zone4-preA")?"gate must be zone4, zone4-preA or null":pl===null?"bad PLACE tag":pl&&pl.project!=="secret-adventures"?"PLACE project is not secret-adventures":
   !Array.isArray(t.lines)||!t.lines.length||t.lines.some(l=>!Array.isArray(l)||typeof l[2]!=="string"||!l[2])?"no lines":lineSp.find(s=>!sp.includes(s))?"line speaker not in speakers: "+lineSp.find(s=>!sp.includes(s)):"";
  if(why){bad.push({id,why});return;}ids.add(id);
  out.push({id,key:mixKey(sp),slot:t.context,gate:t.gate||null,place:pl?t.place:"PLACE: secret-adventures / zone4-"+t.context+" / "+t.context+" / dialogue / "+id,lines:t.lines.map(l=>[normId(l[0])?CODE[normId(l[0])]:l[0],l[1]||"calm",l[2]])});});
 return {entries:out,rejected:bad};}
const seenKey=id=>"batch14-"+id;
function pick(entries,slot,party,seen){seen=seen||{};const mk=mixKey(party);for(const k of subsetKeys(party)){const e=entries.find(x=>x.slot===slot&&x.key===k&&!seen[seenKey(x.id)]&&!(x.gate==="zone4-preA"&&keyIds(mk).includes("brunn")));
 if(e)return {tier:k===mk?"exact":k==="hero"?"hero":"subset",key:k,entry:e};}return null;}
function generic(story,pools,slot,party,turn){const ids=keyIds(mixKey(party));turn=turn|0;const refs=GENERIC[slot]||GENERIC.camp;
 for(let j=0;j<refs.length;j++){const ref=refs[(j+turn)%refs.length];let m=/^pool:([\w-]+):(\w+)$/.exec(ref);
  if(m&&pools&&pools[m[1]]){const r=pools[m[1]].find(x=>x.id===m[2]&&x.layer==="A"&&x.speaker==="Any");if(r)return {ref,lines:[["H","calm",r.text]]};continue;}
  m=/^camp:(\w+)$/.exec(ref);if(m&&story&&story.camp){const sc=[].concat(story.camp.fun||[],story.camp.dark||[]).find(s=>s.id===m[1]);
   if(sc&&!sc.need&&[...speakers(sc.lines)].every(s=>ids.includes(s)))return {ref,lines:sc.lines.map(l=>l.slice())};}}
 return {ref:"none",lines:[]};}
function choose(entries,story,pools,slot,party,seen,turn){const p=pick(entries,slot,party,seen);if(p)return {tier:p.tier,key:p.key,id:p.entry.id,lines:p.entry.lines};
 const g=generic(story,pools,slot,party,turn);return {tier:"generic",key:"*",id:g.ref,lines:g.lines};}
const API={GENERIC,SLOTS,AFTER_EVERY,CODE,normId,mixKey,subsetKeys,parsePlace,speakers,validate,seenKey,pick,generic,choose};
if(typeof module!=="undefined"&&module.exports){module.exports=API;return;}
root.Z4Banter=API;
// ---------------- browser hooks: load LAST (after story.js, batch1-14, package-dialogue.js) ----------------
const S=root.SOTA,H=root.S6H;if(!S||!S.rpg||!S.rpg.s6||!H)return;const api=S.rpg.s6,D=root.STORY;
let extra=null,last={played:[]};
function talks(){return extra||(root.Batch14Talks&&root.Batch14Talks.TALKS)||[];}
let cache=null;function entries(){const t=talks();if(!cache||cache.src!==t||cache.n!==t.length)cache={src:t,n:t.length,v:validate(t)};return cache.v.entries;}
function zone(){try{return S.state().zone|0;}catch(e){return 0;}}
function partyNow(alive){return ["Q","S","A"].filter(c=>{const m=api.who(c);return m&&(!alive||m.hp>0);}).map(c=>ID[c]);}
function busy(){return !!((S.storyOpen&&S.storyOpen())||(api.queue&&api.queue()>0));}
function note(slot,tier,id){last.played.push({slot,tier,id,zone:zone()});if(last.played.length>40)last.played.shift();}
const kind=slot=>slot==="after-fight"?"after-fight":slot==="camp"?"camp":"tavern";
// 1. shadowed story-data zone 4 talks (same picker rule as story.js seenFirst)
function storyFirst(pool,s){return (pool||[]).find(sc=>!s.seen[sc.id]&&(!sc.need||api.who(sc.need))&&api.talkPresent(sc.lines,sc.need)&&(!sc.after||s.revealed));}
function playStory(slot,pool,opt){const s=api.st();if(!s)return false;const sc=storyFirst(pool,s);if(!sc)return false;s.seen[sc.id]=1;note(slot,"story",sc.id);return api.play(kind(slot),sc.lines,opt(sc))!==false;}
// 2. batch 14 by party mix
function playZ4(slot,party,opt){const s=api.st();if(!s)return false;const p=pick(entries(),slot,party,s.seen);if(!p)return false;
 s.seen[seenKey(p.entry.id)]=1;note(slot,p.tier,p.entry.id);return api.play(kind(slot),p.entry.lines,opt(p.entry))!==false;}
// 4. generic existing line
function playGeneric(slot,party,opt){const s=api.st();if(!s)return false;s.z4bTurn=(s.z4bTurn|0)+1;const g=generic(D,root.PACKAGE_POOLS,slot,party,s.z4bTurn);if(!g.lines.length)return false;
 note(slot,"generic",g.ref);return api.play(kind(slot),g.lines,opt({lines:g.lines}))!==false;}
const campOpt=t=>({bg:S.rpg.s5.campBg(t)}),tavOpt=t=>()=>({bg:S.rpg.s5.tavernBg(t)}),plainOpt=()=>({bg:null});
const oldCamp=H.camp;H.camp=function(k){if(zone()!==4)return oldCamp.apply(this,arguments);const party=partyNow(false);
 if(playStory("camp",D.camp&&D.camp.dark,campOpt)||playZ4("camp",party,campOpt))return;const r=oldCamp.apply(this,arguments);if(!busy())playGeneric("camp",party,campOpt);return r;};
// tavern arrival (Tavern 4 only, the zone 4 tavern; Tavern 3 seen from its zone 4 side keeps its zone 3 talks): one talk per visit. Mark every older visit guard so the old chain does not add a second talk on top.
const oldTavern=H.tavern;H.tavern=function(t){if(zone()!==4||t!==3)return oldTavern.apply(this,arguments);const s=api.st(),l=S.rpg.live&&S.rpg.live();if(!s||!l)return oldTavern.apply(this,arguments);
 const vk=t+":"+l.steps;if(s.z4TavernVisit===vk)return;s.z4TavernVisit=vk;const party=partyNow(false),opt=tavOpt(t);
 const claim=()=>{s.packageTavernVisit=vk;s.batch2Visit={key:vk,used:true};s.visit=vk;s.shopN=0;};
 if(playStory("tavern",D.tavern&&D.tavern[t],opt)||playZ4("tavern",party,opt)){claim();return;}
 const r=oldTavern.apply(this,arguments);if(!busy()){claim();playGeneric("tavern",party,opt);}return r;};
const oldCraft=H.craft;H.craft=function(kd,t){if(zone()!==4||t!==3)return oldCraft?oldCraft.apply(this,arguments):undefined;
 if(playZ4("craft-wait",partyNow(false),tavOpt(t)))return;const r=oldCraft?oldCraft.apply(this,arguments):undefined;if(!busy())playGeneric("craft-wait",partyNow(false),tavOpt(t));return r;};
// after a won fight: existing spacing kept; every AFTER_EVERY-th zone 4 win also gets a zone 4 talk (or a generic line if nothing else spoke)
const oldCont=H.fightContinue;H.fightContinue=function(snap){if(zone()!==4)return oldCont?oldCont.apply(this,arguments):false;const s=api.st();if(!s)return false;
 const party=partyNow(true);s.z4Wins=(s.z4Wins|0)+1;const due=s.z4Wins%AFTER_EVERY===0;
 if(due&&playZ4("after-fight",party,plainOpt))return true;const r=oldCont?oldCont.apply(this,arguments):false;if(due&&!r&&!busy())return playGeneric("after-fight",party,plainOpt);return r;};
API.test={useTalks(t){extra=t||null;cache=null;return validate(talks());},last:()=>JSON.parse(JSON.stringify(last)),reset(){last={played:[]};},partyNow,entries:()=>JSON.parse(JSON.stringify(entries()))};
})(typeof window!=="undefined"?window:globalThis);
