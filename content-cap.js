/* Local release boundary. Raise maxZone in a later content update; keep maze data intact. */
(function(root){
"use strict";
// t2419u: zone 4 plays through to Tavern 4 (47,48). Zone 5 stays closed; (46,48) is zone 5, so Tavern 4's Zone 5 exit waits.
// (was t2362u step 2 / t2370u: zone 3 to Tavern 3 (51,14), Tavern 3's Zone 4 exit waited.)
// (19,24), the old step-1 extra cell, is zone 3 and is now open as part of maxZone 3.
const DEFAULT=Object.freeze({maxZone:4,extraCells:Object.freeze([])});
function create(n,zoneOf,cap=DEFAULT){
 function isOpen(x,y){
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=n||y>=n)return false;
  const z=+zoneOf[y*n+x];
  return (z>=1&&z<=cap.maxZone)||cap.extraCells.some(c=>c[0]===x&&c[1]===y);
 }
 // A pre-cap local save may walk out normally. Once back inside, the boundary holds.
 function allowsStep(x,y,nx,ny){return !isOpen(x,y)||isOpen(nx,ny);}
 return Object.freeze({isOpen,allowsStep,isZoneOpen:z=>Number.isInteger(z)&&z>=1&&z<=cap.maxZone});
}
root.SOTA_CONTENT_CAP=Object.freeze({DEFAULT,create});
})(typeof window!=="undefined"?window:globalThis);
