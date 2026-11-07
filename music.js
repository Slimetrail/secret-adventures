/* Secret of the Adventures - background music (Jeremy-approved cues, 2026-11-07, Eve t2058u).
   Local MP3s in music/ only: no network hosts, no ads. Maze exploration music is NOT installed yet (waits for
   Maze exploration (rewritten softer cues, Eve t2061u): zone 1..5 loops while walking the maze.
   Watches what is on screen and picks one cue; starts after a tap where the browser needs it and retries on later taps. */
(function(){"use strict";
const S=window.SOTA;if(!S||!S.rpg)return;
// name -> [volume, loop]
const CUES={title_intro:[.5,1],sick_father:[.5,1],camping:[.45,1],art_room:[.5,1],tavern:[.5,1],fighting:[.55,1],victory:[.65,0],menu:[.4,1],
 final_boss:[.6,1],death:[.5,0],decision_pulse:[.4,1],sacrifice:[.5,0],partial_fix:[.5,0],true_ending:[.55,0],credits:[.45,1],maze_zone1:[.4,1],maze_zone2:[.4,1],maze_zone3:[.4,1],maze_zone4:[.4,1],maze_zone5:[.4,1]};
const ENDING={low:"sacrifice",mid:"partial_fix",high:"true_ending"}; // The Shattered Crystal / The Price of Repair / Home Again
const A={};let now=null,muted=false,lastFight=null,deathDone=false,vicDone=false;
function au(n){if(!A[n]){const a=new Audio("music/"+n+".mp3");a.preload="auto";a.loop=!!CUES[n][1];a.dataset.cue=n;a.addEventListener("ended",()=>{a._done=true;});A[n]=a;}return A[n];}
function fade(a,to,ms,then){clearInterval(a._f);const from=a.volume,t0=performance.now();if(ms<=0){a.volume=to;if(then)then();return;}
 a._f=setInterval(()=>{const k=Math.min(1,(performance.now()-t0)/ms);a.volume=Math.max(0,Math.min(1,from+(to-from)*k));if(k>=1){clearInterval(a._f);if(then)then();}},40);}
function stop(a,ms){if(!a)return;fade(a,0,ms,()=>{a.pause();try{a.currentTime=0;}catch(e){}});}
function start(a){a._done=false;a._want=true;const p=a.play();if(p&&p.catch)p.then(()=>{a._ok=true;},()=>{a._ok=false;});else a._ok=true;}
// cut: ms for the old cue to go away (0 = hard cut). fadeIn: ms for the new cue to come up.
function go(n,cut,fadeIn){if(now===n)return;const old=now?A[now]:null;now=n;if(old){old._want=false;stop(old,cut);}if(!n)return;
 const a=au(n);clearInterval(a._f);try{a.currentTime=0;}catch(e){}a.volume=fadeIn>0?0:CUES[n][0]*(muted?0:1);start(a);if(fadeIn>0)fade(a,CUES[n][0],fadeIn);}
// after a tap: retry a cue the browser refused to start (Android first tap)
function retry(){if(!now)return;const a=A[now];if(a&&a._want&&!a._done&&(a.paused||!a._ok))start(a);}
["pointerdown","touchend","keydown","click"].forEach(t=>window.addEventListener(t,retry,true));
function storyKind(){try{const l=S.rpg.s6&&S.rpg.s6.line();return l?l.kind:null;}catch(e){return null;}}
function want(){
 const F=S.rpg.fight&&S.rpg.fight(),ui=S.rpg.ui&&S.rpg.ui();
 if(ui==="fight"&&F){if(F!==lastFight){lastFight=F;deathDone=false;vicDone=false;}
  const boss=F.why==="boss"||F.m.some(m=>m.boss);
  if(F.over==="win"){if(now==="victory"&&A.victory&&A.victory._done)vicDone=true;if(vicDone&&!boss)return [maze(),0,0];return ["victory",boss?900:0,0];} // short fanfare, then back into the zone loop                        // normal fight: cut to fanfare; boss: bleed into it
  if(F.over==="lose"){if(!deathDone&&A.death&&now==="death"&&A.death._done)deathDone=true;
   return deathDone?["decision_pulse",0,0]:["death",0,0];}                 // hard cut to death, then hard cut to the decision pulse
  if(F.over==="ran")return [maze(),700,0];
  return [boss?"final_boss":"fighting",300,0];}
 lastFight=null;
 const k=storyKind();
 if(k){if(k==="opening")return ["sick_father",1500,800];
  if(k==="camp")return ["camping",2500,2500]; // full fade into warmth
  if(k==="tavern"||k==="stay"||k==="join")return ["tavern",600,0];
  if(k==="wall")return ["art_room",now&&now.startsWith("maze_")?120:600,0]; // early cut into clusters
  if(k==="boss")return ["menu",150,600];                                    // the note before you enter = journal reading
  if(k==="ending"){const box=document.getElementById("s6d");if(box&&box.querySelector(".s6title"))return ["credits",2000,1500];
   let e=null;try{e=S.rpg.s6.st().ending;}catch(x){}return [ENDING[e]||"true_ending",1200,1200];}}
 if(ui==="create")return ["title_intro",1500,1500];
 if(ui==="tavern"||ui==="buy"||ui==="sell"||ui==="tent")return ["tavern",600,0];
 if(ui==="camp")return ["camping",2500,2500];
 if(ui==="cook")return [now==="tavern"||now==="camping"?now:"menu",300,0];   // cooking keeps the tavern/camp cue it was opened from
 if(ui==="party"||ui==="equip"||ui==="skill"||ui==="stats"||ui==="cookbook"||ui==="treasure")return ["menu",150,600];
 // plain maze: the current zone loop. Tavern exit thins over ~2 bars while the zone pulse snaps back; sick father dissolves into it.
 return [maze(),now==="tavern"?2400:now==="sick_father"?3000:1500,now==="tavern"?0:now==="sick_father"?3000:1500];}
function maze(){let z=1;try{z=S.state().zone||1;}catch(e){}return "maze_zone"+Math.max(1,Math.min(5,z));}
function tick(){let w;try{w=want();}catch(e){return;}if(!S.rpg.live()&&!w[0]&&!S.rpg.ui())w=[null,1500];if((w[0]||null)!==now)go(w[0]||null,w[1]||0,w[2]||0);}
setInterval(tick,200);
S.music={now:()=>now,cues:()=>Object.keys(CUES),playing:()=>!!(now&&A[now]&&!A[now].paused),setMuted:v=>{muted=!!v;for(const n in A)A[n].volume=muted?0:(n===now?CUES[n][0]:0);},tick};
})();
