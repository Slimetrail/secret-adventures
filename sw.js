const VER="8",CACHE="sota-s1-v"+VER;
const SHELL=["./","index.html","maze-data.js?v=8","tex.js?v=8","doors.js?v=8","game.js?v=8","puzzles.js?v=8","puzzle-ui.js?v=8","map.js?v=8","rules.js?v=8","party.js?v=8","boot.js?v=8","manifest.json","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png"];
// all-or-nothing install: if any file is missing the install fails and the old version keeps running
self.addEventListener("install",e=>{e.waitUntil(caches.has(CACHE).then(had=>caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting(),err=>(had?Promise.resolve():caches.delete(CACHE)).then(()=>{throw err}))))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("sota-s1-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// cache first for the game's own files; other same-origin GETs: network, then saved copy. Never touches other sites.
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;const nav=r.mode==="navigate";
 e.respondWith(caches.open(CACHE).then(c=>c.match(r,{ignoreSearch:nav}).then(m=>m||(nav?c.match("index.html"):null)).then(m=>m||fetch(r,{cache:"no-cache"}).then(res=>res.ok||!nav?res:c.match("index.html").then(x=>x||res)).catch(()=>caches.match(r,{ignoreSearch:nav}).then(x=>x||Response.error())))))});
