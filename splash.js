/* Secret of the Adventure - t2386u SlimeTrail Production logo splash. The very first screen on every launch (installed app too).
   It waits for a tap. The tap plays the logo sound as-is (and is the first gesture that unlocks phone audio), the logo stays
   2 seconds, fades out, and then the normal title flow from intro.js runs unchanged. Game music stays off until the splash is gone.
   Local files only (art-intro/brand/), no network hosts, no ads. */
(function(){"use strict";
const S=window.SOTA,sp=document.getElementById("isplash");if(!sp)return;
const HOLD_MS=2000,FADE_MS=450,snd=sp.querySelector("audio");
let st="wait",tapAt=0,fadeAt=0,bootWanted=false,booted=false;
const orig=window.SOTA_INTRO_BOOT;
function runBoot(){if(booted||!bootWanted)return;booted=true;if(orig)orig();}
// party.js calls SOTA_INTRO_BOOT on DOMContentLoaded; hold it until the logo has been shown
if(orig)window.SOTA_INTRO_BOOT=function(){bootWanted=true;if(st==="fade"||st==="done")runBoot();};
function go(){if(st!=="wait")return;st="show";tapAt=performance.now();sp.classList.add("shown");
 try{snd.currentTime=0;const p=snd.play();if(p&&p.catch)p.catch(()=>{});}catch(e){}
 setTimeout(fade,HOLD_MS);}
function fade(){if(st!=="show")return;st="fade";fadeAt=performance.now();sp.classList.add("out");runBoot();setTimeout(end,FADE_MS);}
function end(){st="done";sp.hidden=true;document.documentElement.classList.remove("isplash-open");}
const eat=e=>{e.preventDefault();e.stopPropagation();};
sp.addEventListener("pointerup",e=>{eat(e);go();});
sp.addEventListener("click",e=>{eat(e);go();});            // browsers without pointer events
sp.addEventListener("contextmenu",e=>e.preventDefault());
addEventListener("keydown",e=>{if(st==="done")return;e.preventDefault();e.stopImmediatePropagation();if(e.key==="Enter"||e.key===" ")go();},true);
document.documentElement.classList.add("isplash-open");
if(S)S.splash={open:()=>st!=="done",state:()=>st,tappedAt:()=>tapAt,fadedAt:()=>fadeAt,audio:()=>snd,HOLD_MS,FADE_MS};
})();
