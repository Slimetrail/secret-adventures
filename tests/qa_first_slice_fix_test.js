"use strict";
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),crypto=require("node:crypto");
const root=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
function parseShell(sw){
  const line=sw.split(/\n/)[1];
  a.ok(line.startsWith("const SHELL="));
  let rest=line.slice("const SHELL=".length),parts=[],idx=0;
  while(idx<rest.length){
    while(idx<rest.length&&" \t.".includes(rest[idx])){
      if(rest.startsWith(".concat(",idx)){idx+=8;continue;}
      idx++;
    }
    if(idx>=rest.length||rest[idx]===";"||rest[idx]===",")break;
    if(rest[idx]==="["){
      let depth=0;
      for(let k=idx;k<rest.length;k++){
        if(rest[k]==="[")depth++;
        else if(rest[k]==="]"){
          depth--;
          if(depth===0){parts.push(JSON.parse(rest.slice(idx,k+1)));idx=k+1;break;}
        }
      }
    }else break;
  }
  return parts.flat();
}
test("SHELL has unique URLs, one music.js?v=18, and VER 63",()=>{
  const sw=read("sw.js");
  a.match(sw,/^const VER="63"/);
  const shell=parseShell(sw);
  a.equal(shell.length, new Set(shell).size);
  a.equal(shell.filter(x=>x==="music.js?v=18").length,1);
  a.equal(shell.filter(x=>x.startsWith("music.js")).length,1);
  a.ok(shell.includes("intro.js?v=9"));
  a.ok(shell.includes("party.js?v=22"));
  a.ok(!shell.includes("music.js?v=17"));
  const html=read("index.html");
  a.ok(html.includes("music.js?v=18"));
  a.ok(html.includes("intro.js?v=9"));
  a.ok(html.includes("party.js?v=22"));
  a.ok(!html.includes("music.js?v=17"));
});
test("credits keep thank-you and add the standing Slimetrail line",()=>{
  const js=read("intro.js");
  a.ok(js.includes('el("div","icred-l","Thank you for playing.")'));
  a.ok(js.includes('el("div","icred-l","A Slimetrail production")'));
  a.equal((js.match(/A Slimetrail production/g)||[]).length,1);
  a.ok(!js.includes("A Slimetrail production."));
});
test("tavern hubs contain the full scene; other scenes still cover",()=>{
  const js=read("party.js");
  a.ok(js.includes("#s4 .s5scene{box-sizing:border-box;max-width:none;min-height:100%;background-position:center;background-size:cover;background-repeat:no-repeat;padding-bottom:100px}"));
  a.ok(js.includes("#s4 .s5scene.s5hub{background-size:contain;background-position:center}"));
  a.ok(js.includes('const WAIT_UPDATE="Please wait for update to continue.";'));
});
test("play() waits for the first pointerup or click, then starts the title cue",()=>{
  const plays=[];
  const listeners={};
  const sandbox={
    window:{addEventListener(t,fn){(listeners[t]=listeners[t]||[]).push(fn);}},
    Audio:function(){this.addEventListener=()=>{};this.dataset={};this.play=()=>{plays.push("play");this.paused=false;return Promise.resolve();};this.pause=()=>{};this.volume=1;this.paused=true;this.currentTime=0;},
    performance:{now:()=>0},
    setInterval:()=>0,
    clearInterval(){},
    document:{getElementById:()=>null}
  };
  vm.createContext(sandbox);
  sandbox.window.SOTA={
    rpg:{live:()=>false,ui:()=>null,fight:()=>null,s6:{line:()=>null}},
    intro:{titleOpen:()=>true,caveOpen:()=>false,journalOpen:()=>false},
    contentCap:{isZoneOpen:()=>true},
    state:()=>({x:0,y:0,f:0,zone:1})
  };
  vm.runInContext(read("music.js"),sandbox);
  const music=sandbox.window.SOTA.music;
  music.tick();
  a.equal(music.now(),null);
  a.equal(plays.length,0);
  for(const fn of (listeners.pointerup||[]))fn();
  a.equal(music.now(),"title_intro");
  a.ok(plays.length>=1);
});
test("maze picker still follows the content cap",()=>{
  const c={window:{}};
  vm.createContext(c);
  vm.runInContext(read("maze-data.js"),c);
  vm.runInContext(read("content-cap.js"),c);
  const M=c.window.MAZE,API=c.window.SOTA_CONTENT_CAP;
  function load(cap,zone){
    const listeners={};
    const sandbox={
      window:{addEventListener(t,fn){(listeners[t]=listeners[t]||[]).push(fn);}},
      Audio:function(){this.addEventListener=()=>{};this.play=()=>Promise.resolve();this.pause=()=>{};this.volume=1;this.paused=true;this.currentTime=0;},
      performance:{now:()=>0},setInterval:()=>0,clearInterval(){},document:{getElementById:()=>null}
    };
    vm.createContext(sandbox);
    sandbox.window.SOTA={
      rpg:{live:()=>true,ui:()=>null,fight:()=>null,s6:{line:()=>null}},
      intro:{titleOpen:()=>false,caveOpen:()=>false,journalOpen:()=>false},
      contentCap:cap,state:()=>({x:19,y:24,f:0,zone})
    };
    vm.runInContext(read("music.js"),sandbox);
    return sandbox.window.SOTA.music.maze();
  }
  a.equal(load(API.create(M.n,M.zone),3),"maze_zone2");
  a.equal(load(API.create(M.n,M.zone,{maxZone:3,extraCells:[]}),3),"maze_zone3");
});
