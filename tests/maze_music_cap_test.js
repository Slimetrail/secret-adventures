"use strict";
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const read=f=>fs.readFileSync(path.join(__dirname,"..",f),"utf8");
function musicFor(capOpts,zone,x=19,y=24){
  const windowObj={addEventListener(){}};
  const sandbox={
    window:windowObj,
    Audio:function(){this.addEventListener=()=>{};this.play=()=>Promise.resolve();this.pause=()=>{};this.volume=1;this.paused=true;this.currentTime=0;},
    performance:{now:()=>0},
    setInterval:()=>0,
    clearInterval(){},
    document:{getElementById:()=>null}
  };
  vm.createContext(sandbox);
  vm.runInContext(read("maze-data.js"),sandbox);
  vm.runInContext(read("content-cap.js"),sandbox);
  const M=sandbox.window.MAZE;
  const API=sandbox.window.SOTA_CONTENT_CAP;
  const cap=capOpts==null?API.create(M.n,M.zone):API.create(M.n,M.zone,capOpts);
  sandbox.window.SOTA={
    rpg:{live:()=>true,ui:()=>null,fight:()=>null,s6:{line:()=>null}},
    intro:{titleOpen:()=>false,caveOpen:()=>false,journalOpen:()=>false},
    contentCap:cap,
    state:()=>({x,y,f:0,zone})
  };
  vm.runInContext(read("music.js"),sandbox);
  return {maze:sandbox.window.SOTA.music.maze,cap,M,API};
}
// t2362u step 2: DEFAULT is zones 1-3, so the zone 3 doorway (19,24) plays maze_zone3 (was maze_zone2 under the step 1 cap)
// t2419u: DEFAULT is zones 1-4, so zone 4 plays maze_zone4 and zone 5 falls back to zone 4
test("DEFAULT t2419u cap: doorway (19,24) is zone 3 and music is maze_zone3; zone 4 plays maze_zone4; zone 5 still falls back to zone 4",()=>{
  const {maze,cap,M,API}=musicFor(null,3,19,24);
  a.equal(API.DEFAULT.maxZone,4);
  a.deepEqual(Array.from(API.DEFAULT.extraCells,c=>Array.from(c)),[]);
  a.equal(M.n,65);
  a.deepEqual(Array.from(M.taverns[1]),[18,24]);
  a.equal(+M.zone[24*M.n+18],2);
  a.equal(+M.zone[24*M.n+19],3);
  a.equal(cap.isOpen(19,24),true);
  a.equal(cap.isZoneOpen(3),true);
  a.equal(cap.isZoneOpen(4),true);a.equal(cap.isZoneOpen(5),false);
  a.equal(maze(),"maze_zone3");
  a.equal(musicFor(null,4,51,15).maze(),"maze_zone4");a.equal(musicFor(null,5,46,48).maze(),"maze_zone4");
});
test("zone 1 and tavern 2 keep their own maze cues",()=>{
  a.equal(musicFor(null,1,0,64).maze(),"maze_zone1");
  a.equal(musicFor(null,2,18,24).maze(),"maze_zone2");
});
test("raising maxZone to 3 plays maze_zone3 on the same extra doorway cell",()=>{
  a.equal(musicFor({maxZone:3,extraCells:[]},3,19,24).maze(),"maze_zone3");
});
test("a later maxZone 5 plays zone 3, 4, and 5 music as usual",()=>{
  a.equal(musicFor({maxZone:5,extraCells:[]},3,19,24).maze(),"maze_zone3");
  a.equal(musicFor({maxZone:5,extraCells:[]},4,51,15).maze(),"maze_zone4");
  a.equal(musicFor({maxZone:5,extraCells:[]},5,37,43).maze(),"maze_zone5");
});
