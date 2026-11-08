/* t2191u binding mechanics only. No new spoken or journal wording. */
(function(root){'use strict';
const keys=(rooms,pattern)=>Object.keys(rooms).filter(id=>pattern.test(rooms[id][1]));
const any=(walls,ids)=>ids.some(id=>!!walls[id]);
function brunnKinds(walls,rooms){return {cracked:any(walls,keys(rooms,/^zone(?:3-0[1-5]|4-0[56])-/)),bright:any(walls,keys(rooms,/^zone4-0[12]-/)),flight:any(walls,keys(rooms,/^zone4-07-/))};}
function brunnAtJoin(walls,rooms){return Object.values(brunnKinds(walls,rooms)).filter(Boolean).length>=2?'save':'died';}
function allArt(walls,rooms){const ids=Object.keys(rooms);return ids.length===28&&ids.every(id=>!!walls[id]);}
function naming(walls,rooms){const picnic=any(walls,keys(rooms,/^zone5-08-/)),bedside=any(walls,keys(rooms,/^zone5-09-/));return {revealed:picnic||bedside,wifeMotive:picnic&&bedside};}
function namingHeld(id,rooms){return false;}
function reading(walls,rooms){if(allArt(walls,rooms))return 'apology';// The prior working low/mid split is retained; no new threshold.
 return any(walls,keys(rooms,/^zone3-05-/))||any(walls,keys(rooms,/^zone4-0[1-7]-/))?'half':'warning';}
const api={brunnKinds,brunnAtJoin,allArt,naming,namingHeld,reading};root.StoryGates=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
