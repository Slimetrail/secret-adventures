/* Offline worker registration (same safe pattern as Dino Colossus: fixed sw.js name, updateViaCache none, re-check on open). */
(function(){if(!("serviceWorker"in navigator)||location.protocol==="file:")return;const sw=navigator.serviceWorker,b=document.getElementById("updb");const had=!!sw.controller;
 sw.register("sw.js",{updateViaCache:"none"}).then(reg=>{const chk=()=>reg.update().catch(()=>{});document.addEventListener("visibilitychange",()=>{if(!document.hidden)chk();});setInterval(chk,300000);}).catch(()=>{});
 sw.addEventListener("controllerchange",()=>{if(!had)return;let p=null;try{p=localStorage.getItem("sota.party");}catch(e){}if(!p){location.reload();return;}b.style.display="block";});b.addEventListener("click",()=>location.reload());})();
/* portrait only: ask the phone to stay upright where allowed (installed/fullscreen); the CSS notice covers the rest */
(function(){const L=()=>{try{const o=screen.orientation;if(o&&o.lock){window.__sotaLock="tried";o.lock("portrait").then(()=>{window.__sotaLock="ok";}).catch(()=>{});}}catch(e){}};L();document.addEventListener("pointerdown",L,{once:true});})();
