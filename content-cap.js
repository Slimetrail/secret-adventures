/* Local release boundary. Raise maxZone in a later content update; keep maze data intact. */
(function(root){
"use strict";
const DEFAULT=Object.freeze({maxZone:3,extraCells:Object.freeze([Object.freeze([51,15])])});
function create(n,zoneOf,cap=DEFAULT){
 function isOpen(x,y){
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=n||y>=n)return false;
  const z=+zoneOf[y*n+x];
  return (z>=1&&z<=cap.maxZone)||cap.extraCells.some(c=>c[0]===x&&c[1]===y);
 }
 // A pre-cap local save may walk out normally. Once back inside, the boundary holds.
 function allowsStep(x,y,nx,ny){return !isOpen(x,y)||isOpen(nx,ny);}
 return Object.freeze({isOpen,allowsStep});
}
root.SOTA_CONTENT_CAP=Object.freeze({DEFAULT,create});
})(typeof window!=="undefined"?window:globalThis);
