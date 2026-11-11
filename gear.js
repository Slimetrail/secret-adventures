/* Secret of the Adventure - t2759u special class gear (Jeremy t2745u-t2758u). Pure rules, no screen, no network.
   Four items, one per class. Only the hero (party[0]) of that class may use one; a pass or a fail uses it up.
   Works in the browser (window.SOTA_GEAR) and in node (module.exports). */
(function(root){
"use strict";
// use: "lockpick" = used on a puzzle door (puzzle screen), "bag" = used from the backpack
const ITEMS={
 g_lockpick:{n:"Rogue's lockpick",cls:"rogue",stat:"sta",w:0.1,use:"lockpick",icon:"\u{1F5DD}\uFE0F"},
 g_crystal:{n:"Mage's crystal ball",cls:"mage",stat:"man",w:0.5,use:"bag",icon:"\u{1F52E}"},
 g_hide:{n:"Archer's hide smell",cls:"archer",stat:"sta",w:0.2,use:"bag",icon:"\u{1F33F}"},
 g_rope:{n:"Warrior's rope",cls:"warrior",stat:"str",w:1,use:"bag",icon:"\u{1FAA2}"}};
const IDS=Object.keys(ITEMS);
// t2756u: the most expensive thing in every shop. The priciest item today is the Tent (100 gold) in all four shops.
const ZONE_PRICE=[0,150,250,400,600,900];
// t2757u: low 25%, medium 50%, very high 75%. Fixed stat values, the same for STR, MAN and STA; a smooth line between them.
// Above very high is capped at 75% (open question for Jeremy).
const BANDS=Object.freeze({low:8,medium:15,high:30}),RATES=Object.freeze({low:0.25,medium:0.5,high:0.75});
const HIDE_MS=5*60*1000,LOCK_ROUNDS=2,STAT_NAME={str:"Strength",man:"Mana",sta:"Stamina"};
function price(zone){const z=Math.min(5,Math.max(1,Math.floor(+zone)||1));return ZONE_PRICE[z];}
function chance(v){v=+v||0;const B=BANDS,P=RATES;if(v<=B.low)return P.low;if(v<=B.medium)return P.low+(v-B.low)*(P.medium-P.low)/(B.medium-B.low);
 if(v<B.high)return P.medium+(v-B.medium)*(P.high-P.medium)/(B.high-B.medium);return P.high;}
function band(v){v=+v||0;return v>=BANDS.high?"very high":v>=BANDS.medium?"medium":v<=BANDS.low?"low":"low to medium";}
function statOf(hero,id){const g=ITEMS[id];return hero&&hero.stats&&g?(hero.stats[g.stat]|0):0;}
// null = may use; else why not: "gear" (not special gear), "hero" (no hero), "class", "down"
function heroCheck(party,id){const g=ITEMS[id],h=Array.isArray(party)?party[0]:null;if(!g)return "gear";if(!h)return "hero";if(h.cls!==g.cls)return "class";if(!(h.hp>0))return "down";return null;}
function passes(hero,id,r){const p=chance(statOf(hero,id));return {pass:r<p,p};}
// crystal ball path: breadth-first over open maze edges from start. Room cells are walls except a target room (last step).
// noCross(i,d) blocks an edge (tavern archways); isOpen(i) is the zone cap. Returns {to,kind,path:[cells]} or null.
const DX=[0,1,0,-1],DY=[-1,0,1,0],BIT=[1,2,4,8];
function route(o){const N=o.N,mask=o.mask,start=o.start,prev=new Int32Array(N*N).fill(-2);prev[start]=-1;const q=[start];
 for(let h=0;h<q.length;h++){const i=q[h];if(i!==start&&o.isTarget(i)){const path=[];for(let k=i;k>=0;k=prev[k])path.push(k);path.reverse();return {to:i,kind:o.kindOf?o.kindOf(i):null,path};}
  if(i!==start&&o.isRoom(i))continue;const x=i%N,y=(i/N)|0,m=typeof mask==="string"?parseInt(mask[i],16):mask[i];
  for(let d=0;d<4;d++){if(!(m&BIT[d]))continue;if(o.noCross&&o.noCross(i,d))continue;const nx=x+DX[d],ny=y+DY[d];if(nx<0||ny<0||nx>=N||ny>=N)continue;const ni=ny*N+nx;
   if(prev[ni]!==-2||(o.isOpen&&!o.isOpen(ni)))continue;if(o.isRoom(ni)&&!o.isTarget(ni))continue;prev[ni]=i;q.push(ni);}}
 return null;}
// crystal ball fail: forget every walked cell of zone z except keep; returns how many were forgotten
function wipeZone(visited,zoneOf,z,keep){let n=0;for(let i=0;i<visited.length;i++)if(+zoneOf[i]===z&&i!==keep&&visited[i]){visited[i]=0;n++;}return n;}
// hide smell: what a random-fight roll does now. "pass" = no random fights, "fail" = x3 (same path as Stinky stew), null = normal
function hideMode(h){return h&&h.left>0&&(h.mode==="pass"||h.mode==="fail")?h.mode:null;}
const G={ITEMS,IDS,ZONE_PRICE,BANDS,RATES,HIDE_MS,LOCK_ROUNDS,STAT_NAME,price,chance,band,statOf,heroCheck,passes,route,wipeZone,hideMode,isGear:id=>!!ITEMS[id]};
if(typeof module!=="undefined"&&module.exports)module.exports=G;else root.SOTA_GEAR=G;
})(typeof window!=="undefined"?window:this);
