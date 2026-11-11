/* MODULE: variety (t2670u/t2675u). Per-save dialogue variety. No story text lives in this file.
   - Per-save value: live.vseed (uint32, set by party.js: crypto.getRandomValues, Math.random fallback). Separate from live.seed (combat).
   - Streams: mulberry32(hash(vseed + "|" + purpose)), one purpose string per pool / cycle / scene, so picks never touch combat
     randomness or each other.
   - Shuffled pools: each pool key gets a per-save shuffled order kept in live.vpools[key] = {o:order ids, c:cursor, n:cycle, l:last id}.
     Walk the order; at the end reshuffle for the next cycle, never starting the new cycle with the last line of the old one.
     The caller's own gate (zone, companion present, unlock, unseen...) decides what is eligible; the order only decides which first.
   - Variant picker: variant(sceneId, baseLines). Today's lines are the base variant "<scene id>-v1". Extra variants come from window.DIALOGUE_VARIANTS
     (dialogue-variants.js). The pick is made once per save from vseed + scene id and kept in live.vpick[sceneId].
   - Static (never touched here): the sick-dad intro (H.created / intro.js), zone 5 / Dad pieces, the 3 endings.
   Without a live save that has vseed (node tests with fake state), every helper returns undefined and callers keep their old order. */
(function(root){"use strict";
function hash(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
 h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;h=Math.imul(h,3266489909);h^=h>>>16;return h>>>0;}
function mulberry32(a){a>>>=0;return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function stream(vseed,purpose){return mulberry32(hash((vseed>>>0)+"|"+purpose));}
function shuffle(ids,rnd){const a=ids.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
function newSeed(){try{const a=new Uint32Array(1);(root.crypto||{}).getRandomValues(a);if(a[0])return a[0];}catch(e){}return ((Math.random()*4294967295)>>>0)||1;}
// ---- pure core (state object passed in; used by the browser hooks and by node tests) ----
function sync(st,ids,vseed,key){
 if(!Array.isArray(st.o)){st.o=shuffle(ids,stream(vseed,"pool:"+key+"#0"));st.c=0;st.n=0;st.l=null;return st;}
 const want=new Set(ids),have=new Set(st.o);if(st.o.length===ids.length&&ids.every(i=>have.has(i)))return st;
 let c=0;const kept=[];st.o.forEach((id,p)=>{if(want.has(id)){kept.push(id);if(p<st.c)c++;}});
 const add=shuffle(ids.filter(i=>!have.has(i)),stream(vseed,"add:"+key+"#"+(st.n|0)+":"+ids.length));st.o=kept.concat(add);st.c=c;return st;}
// walk: returns the chosen id (string) or null. commit=false is a pure peek (state not changed).
function walkState(state,key,ids,ok,commit,vseed){
 ids=[...new Set((ids||[]).map(String))];if(!ids.length)return null;
 const real=state[key]&&typeof state[key]==="object"?state[key]:{};const st=JSON.parse(JSON.stringify(real));sync(st,ids,vseed,key);
 let pick=null;for(let p=st.c|0;p<st.o.length;p++){if(ok(st.o[p])){pick=st.o[p];st.c=p+1;break;}}
 if(pick==null){const elig=ids.filter(ok);if(!elig.length)return null;
  st.n=(st.n|0)+1;st.o=shuffle(ids,stream(vseed,"pool:"+key+"#"+st.n));
  if(st.o.length>1&&st.o[0]===st.l){const t=st.o[0];st.o[0]=st.o[1];st.o[1]=t;}
  for(let p=0;p<st.o.length;p++){const id=st.o[p];if(ok(id)&&!(id===st.l&&elig.length>1)){pick=id;st.c=p+1;break;}}}
 if(pick==null)return null;st.l=pick;if(commit)state[key]=st;return pick;}
// Today's lines are the base variant, id "<scene id>-v1" (Dialogue Lead's naming); approved extras are -v2, -v3 ... A listed entry whose id is
// the base id is ignored (the base is always the live text in the locked data files).
function baseId(sceneId){return sceneId+"-v1";}
function variantState(picks,variants,sceneId,base,vseed){const b=baseId(sceneId),okL=x=>Array.isArray(x)&&x.length>0,list=((variants&&variants[sceneId])||[]).filter(v=>v&&v.id&&v.id!==b&&(okL(v.lines)||(v.solo&&v.party&&okL(v.solo.lines)&&okL(v.party.lines))||(v.pieces&&typeof v.pieces==="object")));
 if(!list.length)return {id:b,lines:base};const choices=[{id:b,lines:base}].concat(list);
 let id=picks[sceneId];if(!choices.some(c=>c.id===id)){id=choices[Math.floor(stream(vseed,"variant:"+sceneId)()*choices.length)].id;picks[sceneId]=id;}
 const c=choices.find(x=>x.id===id),cp=l=>(l||[]).map(x=>x.slice());
 return {id:c.id,base:c.id===b,entry:c.id===b?null:c,lines:c.id===b?base:cp(c.lines),solo:c.solo?cp(c.solo.lines):null,party:c.party?cp(c.party.lines):null,journal:c.journal||null,pieces:c.pieces||null};}
const CORE={hash,mulberry32,stream,shuffle,newSeed,sync,walkState,variantState,baseId};
if(typeof module!=="undefined"&&module.exports){module.exports=CORE;return;}
// ---- browser: bound to the live save ----
const S=root.SOTA,D=root.STORY;
function live(){try{const l=S&&S.rpg&&S.rpg.live&&S.rpg.live();return l&&(l.vseed>>>0)?l:null;}catch(e){return null;}}
function bag(l,k){if(!l[k]||typeof l[k]!=="object")l[k]={};return l[k];}
function active(){return !!live();}
function walk(key,ids,ok,commit){const l=live();if(!l)return undefined;return walkState(bag(l,"vpools"),key,ids,ok,commit!==false,l.vseed);}
function peek(key,ids,ok){return walk(key,ids,ok,false);}
function commitId(key,ids,id){return walk(key,ids,i=>i===String(id),true);}
function variants(){const V=root.DIALOGUE_VARIANTS;return V&&V.scenes?V.scenes:{};}
function variantFor(sceneId,base){const l=live();if(!l)return {id:baseId(sceneId),base:true,lines:base};return variantState(bag(l,"vpick"),variants(),sceneId,base,l.vseed);}
function variant(sceneId,base){return variantFor(sceneId,base).lines;}
const API=Object.assign({},CORE,{active,walk,peek,commitId,variant,variantFor,variants,state:()=>{const l=live();return l?{vseed:l.vseed,vpools:JSON.parse(JSON.stringify(l.vpools||{})),vpick:JSON.parse(JSON.stringify(l.vpick||{}))}:null;}});
root.Variety=API;
const H=root.S6H;if(!S||!S.rpg||!S.rpg.s6||!H||!D)return;const api=S.rpg.s6;
const zoneNow=()=>{try{return S.state().zone||1;}catch(e){return 1;}};
// story.js seenFirst pools (camp / tavern / stay): same gates as seenFirst; only the order is per save.
function storyOk(s){return sc=>!!sc&&!s.seen[sc.id]&&(!sc.need||api.who(sc.need))&&api.talkPresent(sc.lines,sc.need)&&(!sc.after||s.revealed);}
function viaOrder(key,arr,call){const s=api.st();if(!active()||!s||!Array.isArray(arr)||!arr.length)return call();
 const by={};arr.forEach(sc=>{by[sc.id]=sc;});const ids=arr.map(sc=>sc.id),ok=storyOk(s),id=peek(key,ids,i=>ok(by[i]));if(!id)return call();
 const orig=arr.slice(),was=!!s.seen[id];arr.splice(0,arr.length,by[id],...orig.filter(x=>x!==by[id]));
 try{return call();}finally{arr.splice(0,arr.length,...orig);if(!was&&s.seen[id])commitId(key,ids,id);}}
API.storyPick=(key,arr,s)=>{if(!active()||!Array.isArray(arr)||!arr.length)return undefined;const by={};arr.forEach(sc=>{by[sc.id]=sc;});const ok=storyOk(s);
 const id=walk(key,arr.map(sc=>sc.id),i=>ok(by[i]),true);return id?by[id]:null;};
const tone=()=>zoneNow()>=4?"dark":"fun";
const oCamp=H.camp,oTav=H.tavern,oShop=H.shop,oJoin=H.joined,oWall=H.wall,oFight=H.fightStart;
H.camp=function(k){const t=tone();return viaOrder("story:camp:"+t,D.camp&&D.camp[t],()=>oCamp.apply(this,arguments));};
H.tavern=function(t){return viaOrder("story:tavern:"+t,D.tavern&&D.tavern[t],()=>oTav.apply(this,arguments));};
H.shop=function(){const t=tone();return viaOrder("story:stay:"+t,D.stay&&D.stay[t],()=>oShop.apply(this,arguments));};
function presentOnly(lines){return lines.filter(l=>!/^[QSA]$/.test(l[0])||!!api.who(l[0]));}
API.presentOnly=presentOnly;
// joins (Mira tavern 1, Sorrel tavern 2): variant of D.join[t]. Brunn (tavern 4) is played by package-dialogue.js, which calls variant() too.
const JOIN_ID={quirky:"join-mira",scholar:"join-sorrel",angry:"join-brunn"};
H.joined=function(c,t){const arr=D.join&&D.join[t],sid=c&&JOIN_ID[c.role];if(!Array.isArray(arr)||!sid)return oJoin.apply(this,arguments);
 const v=variantFor(sid,arr);if(v.base)return oJoin.apply(this,arguments);D.join[t]=presentOnly(v.lines);try{return oJoin.apply(this,arguments);}finally{D.join[t]=arr;}};
// wall scenes: zone 1 and zone 2 pieces take a variant by scene id "wall-z<zone>-<nn>" (art zone1-01-... -> wall-z1-01). Zones 3-5 and the Dad pieces stay as they are.
H.wall=function(id){const ra=api.roomArt()[id];if(!ra||!active())return oWall.apply(this,arguments);const m=/^zone([12])-/.exec(ra[1]);if(!m)return oWall.apply(this,arguments);
 const flat=[1,2,3,4,5].reduce((a,z)=>a.concat(D.wall[z]),[]),piece=flat[ra[0]];if(!Array.isArray(piece))return oWall.apply(this,arguments);
 const sid="wall-z"+m[1]+"-"+ra[1].slice(6,8),v=variantFor(sid,piece.slice());if(v.base)return oWall.apply(this,arguments);
 // zone 1: solo form for a hero-only party, party form otherwise (one stored pick). Zone 2: one array; absent companions drop (PARTIAL_OK).
 const solo=!["Q","S","A"].some(c=>api.who(c)),lines=v.solo?(solo?v.solo:v.party):v.lines,spoken=v.solo?!solo:true;
 const s=api.st(),before=s?Object.keys(s.walls).length+":"+JSON.stringify(s.wallHeard||{}):"";const orig=piece.slice();piece.splice(0,piece.length,...lines);
 try{return oWall.apply(this,arguments);}finally{piece.splice(0,piece.length,...orig);
  // journal thought (never spoken): queued when this variant's companion form played, written into the journal at the next camp
  if(s&&v.journal&&spoken&&before!==Object.keys(s.walls).length+":"+JSON.stringify(s.wallHeard||{}))queueJournal(s,v.id,id,v.journal);}};
function queueJournal(s,id,room,text){if(!s||!text)return;const q=s.vjournal=Array.isArray(s.vjournal)?s.vjournal:[];if(!q.some(x=>x.id===id))q.push({id,room:+room,text});}
// presence talks (art-room add-ons, package-rooms.js): one stored pick per room ("ar1-01"), the piece by suffix (h m s bs br).
// A picked piece with no spoken lines (zone 2 hero-alone, unreachable) or a missing piece plays today's v1 lines, so nothing goes silent.
function arPiece(rowId,base,s,room){const m=/^AR([1-4])-(\d+[a-z]?)-([A-Z]+)$/.exec(String(rowId));if(!m||!live())return base;
 const v=variantFor("ar"+m[1]+"-"+m[2],base);if(v.base||!v.pieces)return base;const pc=v.pieces[m[3].toLowerCase()];
 if(!pc||!Array.isArray(pc.lines)||!pc.lines.length)return base;if(pc.journal)queueJournal(s,pc.id,room,pc.journal);return pc.lines.map(l=>l.slice());}
API.arPiece=arPiece;
// write queued variant journal thoughts at a camp (journal pages are camp-only, t2192u)
function flushJournal(k){const s=api.st();if(!s||!Array.isArray(s.vjournal)||!s.vjournal.length)return 0;const js=s.journalSplit=s.journalSplit||{pages:[],done:{}};js.pages=js.pages||[];js.done=js.done||{};let n=0;
 s.vjournal.forEach(x=>{const key="vj:"+x.id;if(js.done[key])return;js.done[key]=1;js.pages.push({kind:"art-rooms-remembered",id:"VJ-"+x.id,key,text:x.text,room:x.room,camp:k==null?null:k,campNo:js.camps|0});n++;});s.vjournal=[];return n;}
API.flushJournal=flushJournal;
// the camp hook (h6 "camp", fired by a camp save) is wrapped once every script has loaded, so it runs whichever talk module answers
function wrapCampLast(){if(H.__vjCamp)return;const oC=H.camp;H.camp=function(k){try{flushJournal(k);}catch(e){}return oC.apply(this,arguments);};H.__vjCamp=true;}
if(typeof document!=="undefined"&&document.readyState==="complete")wrapCampLast();else root.addEventListener("load",wrapCampLast);
// fight start lines: per-save shuffled speaker order and per-speaker line order (replaces the counter modulo). Same overlay as story.js.
const SHEET={human:"knight",elf:"elf",dwarf:"dwarf",cat:"cat"};
function fill(t){const out=String(t).replace(/\{([HQSA])\}/g,(_,c)=>{const m=api.who(c);return m?m.name:"friend";});return root.CompanionDisplay?root.CompanionDisplay.rewrite(out,S.rpg.live()):out;}
function el(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
H.fightStart=function(){if(!active())return oFight.apply(this,arguments);const st0=document.querySelector(".s4stage");if(!st0)return;let fl=document.getElementById("s6fl");if(fl)fl.remove();
 const tn=tone(),cs=["Q","S","A"].filter(c=>api.who(c)&&api.who(c).hp>0);if(!cs.length)return;
 const code=walk("fight:who",["Q","S","A"],c=>cs.includes(c)&&!!(D.fight.start[c]&&(D.fight.start[c][tn]||[]).length));if(!code)return;
 const pool=D.fight.start[code][tn],ix=walk("fight:start:"+code+":"+tn,pool.map((_,i)=>String(i)),()=>true);if(ix==null)return;const text=pool[+ix];
 const m=api.who(code);fl=el("div","s6fl");fl.id="s6fl";fl.dataset.phase="start";fl.dataset.who=code;fl.dataset.vix=ix;const im=el("img","s6flp");im.src="art6/"+(SHEET[m.race]||"knight")+"-"+(code==="A"?"angry":"happy")+".webp";im.alt="";
 fl.appendChild(im);fl.appendChild(el("span","s6fln",(root.CompanionDisplay?root.CompanionDisplay.displayName(m,S.rpg.live()):m.name)+": "));fl.appendChild(el("span","s6flt",fill(text)));st0.appendChild(fl);
 const bot=document.getElementById("fbot");const hide=()=>{if(fl.dataset.phase==="start")fl.remove();};if(bot)bot.addEventListener("pointerdown",hide,{once:true});setTimeout(hide,3200);};
})(typeof window!=="undefined"?window:globalThis);
