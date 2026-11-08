"use strict";
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),{execFileSync}=require("node:child_process");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");
const party=read("party.js"),game=read("game.js"),html=read("index.html");
const plain=o=>JSON.parse(JSON.stringify(o));
// Evaluate the actual production shortcut/consumption helpers, real item definitions,
// and the actual HUD writer. Only the overlay/DOM and unrelated game state are fixtures.
function fixture(bag=[]){
 const buttons=Array.from({length:4},()=>({textContent:"",attrs:{},getAttribute(k){return this.attrs[k];},setAttribute(k,v){this.attrs[k]=v;}})),storage=new Map();
 const c={window:{},document:{querySelectorAll:()=>buttons},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},nodes:[],messages:[],ui:null,buttons};vm.createContext(c);
 vm.runInContext(read("rules.js"),c);vm.runInContext(read("econ.js"),c);
 vm.runInContext(`const R=window.RPG,E=window.ECON;let live={diff:"normal",steps:0,fresh:{},party:[]};
 const S={setMazeSlots};let lastPage=null;function page(){ui="maze-slot";lastPage={children:[],appendChild(n){this.children.push(n);}};return lastPage;}
 function head(title,back){return {title,back};}function tapBtn(label,fn){return {label,fn,dataset:{}};}
 function closeUI(){ui=null;}function toast(t){messages.push(t);}function hpMul(){return R.DIFF[live.diff].hp;}
 function h6(){}function s5init(){live.fresh=live.fresh||{};}
 `+game.slice(game.indexOf('// Item boxes are shortcuts'),game.indexOf('const vis='))+party.slice(party.indexOf('function mazeSlotAllowed'),party.indexOf('// ---- portraits:'))+party.slice(party.indexOf('function gone('),party.indexOf('function giveDish('))+party.slice(party.indexOf('function eatDish('),party.indexOf('function eatFrom('))+party.slice(party.indexOf('function checkSpoil('),party.indexOf('function tavIdx('))+`
 this.api={R,E,S,assignMazeSlot,clearMazeSlot,clearMazeSlots,syncMazeSlots,mazeSlotChoices,mazeSlotAllowed,useMazeSlot,tapMazeSlot,mazeSlotTargets,checkSpoil,
 live:()=>live,setLive:o=>{live=o;syncMazeSlots();},shown:()=>items.slice(),pg:()=>lastPage};`,c);
 const api=c.api,diff=Object.keys(api.R.DIFF)[0];
 // Real maxHp/maxMp read this character's ordinary rule fields.
 const hero={name:"Ann",race:"human",cls:"mage",lvl:1,stats:{str:10,sta:10,man:10},equip:{},bag:bag.slice(),hp:1,mp:0};
 api.setLive({diff,steps:0,fresh:{},party:[hero,{...hero,name:"Bo",bag:[],equip:{}}]});
 return {c,api,hero,buttons,storage};
}
test("slots call the party UI while retaining pressed animation",()=>{
 a.doesNotMatch(game,/empty for now|later stages fill them/);a.match(game,/classList.add\("pressed"\);if\(window.SOTA&&SOTA.rpg&&SOTA.rpg.tapMazeSlot\)SOTA.rpg.tapMazeSlot/);
 a.match(game,/animationend/);a.match(party,/S.rpg=\{syncMazeSlots,tapMazeSlot,assignMazeSlot/);
});
test("only potion, ether, salts, ration and actual cooked dishes are offered",()=>{
 const {api}=fixture();const allowed=Object.keys(api.R.ITEMS).filter(api.mazeSlotAllowed).sort();
 a.deepEqual(plain(allowed),["potion","ether","salts","ration",...api.E.DISHES.map(d=>"d_"+d.id)].sort());
 for(const id of ["sword","tent","rope","lockpick","i_bread","p_hide"])a.equal(api.mazeSlotAllowed(id),false,id);
});
test("assignment is a binding, not a cloned item; one copy cannot fill two boxes",()=>{
 const {api,hero}=fixture(["potion"]);a.equal(api.assignMazeSlot(0,"potion"),true);a.deepEqual(hero.bag,["potion"]);
 a.equal(api.assignMazeSlot(1,"potion"),false);a.equal(api.assignMazeSlot(2,"ether"),false);a.deepEqual(plain(api.shown()),["potion",null,null,null]);
});
test("two copies allow two boxes; consuming either clears that box but preserves the other",()=>{
 for(const i of [0,1]){const {api,hero}=fixture(["potion","potion"]);api.assignMazeSlot(0,"potion");api.assignMazeSlot(1,"potion");a.equal(api.useMazeSlot(i,1),true);a.equal(hero.bag.length,1);a.equal(api.shown()[i],null);a.equal(api.shown()[1-i],"potion");}
});
test("healing consumes real owner bag copy and heals the selected target with rule percentage",()=>{
 const {api,hero}=fixture(["potion"]),target=api.live().party[1],mh=api.R.maxHp(target,api.R.DIFF[api.live().diff].hp);api.assignMazeSlot(0,"potion");
 a.equal(api.useMazeSlot(0,1),true);a.equal(target.hp,Math.min(mh,1+Math.round(mh*api.R.ITEMS.potion.heal)));a.equal(hero.hp,1);a.deepEqual(hero.bag,[]);a.equal(api.shown()[0],null);a.equal(api.useMazeSlot(0,1),false);
});
test("mana potion restores full MP to chosen member, not only fifty percent",()=>{
 const {api,hero}=fixture(["ether"]),target=api.live().party[1];api.assignMazeSlot(0,"ether");a.equal(api.useMazeSlot(0,1),true);a.equal(target.mp,api.R.maxMp(target));a.equal(hero.mp,0);a.equal(hero.bag.length,0);
});
test("rations and cooked dishes run actual eatDish including buffs and freshness consumption",()=>{
 for(const id of ["ration","d_toast"]){const {api,hero}=fixture([id]),target=api.live().party[1],mh=api.R.maxHp(target,api.R.DIFF[api.live().diff].hp);
 api.live().fresh[id]=[50];api.assignMazeSlot(0,id);a.equal(api.useMazeSlot(0,1),true);a.equal(hero.bag.length,0);a.equal(api.live().fresh[id].length,0);
 const fx=id==="ration"?{hp:api.R.ITEMS[id].heal*100}:api.E.dish(api.R.ITEMS[id].dish).fx;
 if(fx.hp)a.equal(target.hp,Math.min(mh,1+Math.round(mh*fx.hp/100)));if(fx.mp)a.equal(target.mp,Math.min(api.R.maxMp(target),Math.round(api.R.maxMp(target)*fx.mp/100)));if(fx.str||fx.sta)a.ok(target.buff);
 a.equal(api.shown()[0],null);}
 a.match(party,/if\(id==="ration"\|\|it.slot==="dish"\)eatDish\(c,id\)/);
});
test("salts target only knocked-out members and preserve item when none are down",()=>{
 const {api,hero,c}=fixture(["salts"]);api.assignMazeSlot(0,"salts");api.mazeSlotTargets(0);a.equal(c.messages.at(-1),"Nobody is knocked out.");a.equal(api.useMazeSlot(0,0),false);a.equal(hero.bag.length,1);
 const target=api.live().party[1];target.hp=0;api.mazeSlotTargets(0);a.deepEqual(plain(api.pg().children.filter(n=>n.label).map(n=>n.label)),["Wake Bo"]);
 a.equal(api.useMazeSlot(0,1),true);a.equal(target.hp,Math.max(1,Math.round(api.R.maxHp(target,api.R.DIFF[api.live().diff].hp)*api.R.ITEMS.salts.revive)));a.equal(hero.bag.length,0);
});
test("empty tap opens carried-item picker or plain no-food toast",()=>{
 const {api,c}=fixture(["tent"]);api.tapMazeSlot(0);a.equal(c.messages.at(-1),"No potions or food to put here.");api.live().party[0].bag.push("ether");api.tapMazeSlot(0);
 const b=api.pg().children.find(n=>n.dataset);a.equal(b.dataset.mazeItem,"ether");b.fn();a.equal(api.shown()[0],"ether");a.equal(c.ui,null);
});
test("filled tap offers Use, Clear, Replace; replacing and clearing never consume bags",()=>{
 const {api,hero,c}=fixture(["potion","ration"]);api.assignMazeSlot(0,"potion");api.tapMazeSlot(0);
 a.deepEqual(plain(api.pg().children.filter(n=>n.label).map(n=>n.label)),["Use","Clear","Replace"]);
 api.pg().children.find(n=>n.label==="Replace").fn();api.pg().children.find(n=>n.dataset&&n.dataset.mazeItem==="ration").fn();a.equal(api.shown()[0],"ration");
 api.tapMazeSlot(0);api.pg().children.find(n=>n.label==="Clear").fn();a.equal(api.shown()[0],null);a.deepEqual(hero.bag,["potion","ration"]);a.equal(c.ui,null);
});
test("heal, mana and food let the player choose any party member",()=>{
 for(const id of ["potion","ether","ration","d_toast"]){const {api}=fixture([id]);api.assignMazeSlot(0,id);api.mazeSlotTargets(0);a.deepEqual(plain(api.pg().children.filter(n=>n.label).map(n=>n.label)),[id==="ration"||id==="d_toast"?"Feed Ann":"Use on Ann",id==="ration"||id==="d_toast"?"Feed Bo":"Use on Bo"]);}
});
test("external bag mutations remove ghosts and excess later bindings, and update labels/storage",()=>{
 const {api,hero,buttons,storage}=fixture(["potion","potion"]);api.assignMazeSlot(0,"potion");api.assignMazeSlot(3,"potion");hero.bag.pop();api.syncMazeSlots();a.deepEqual(plain(api.shown()),["potion",null,null,null]);
 a.equal(buttons[0].textContent,"Healing potion");a.equal(buttons[0].attrs["aria-label"],"Item box 1 (Healing potion)");hero.bag.length=0;api.syncMazeSlots();a.equal(buttons[0].textContent,"");a.equal(buttons[0].attrs["aria-label"],"Item box 1 (empty)");a.deepEqual(JSON.parse(storage.get("sota.items")),[null,null,null,null]);
 a.match(game,/function frame\(t\)\{\s*if\(window.SOTA&&SOTA.rpg&&SOTA.rpg.syncMazeSlots\)SOTA.rpg.syncMazeSlots\(\)/);
 a.match(game,/items:\(\)=>\{if\(window.SOTA.rpg&&SOTA.rpg.syncMazeSlots\)SOTA.rpg.syncMazeSlots\(\)/);
});
test("real spoil path invalidates bound cooked food",()=>{
 const {api,hero}=fixture(["d_toast"]);api.live().fresh.d_toast=[1];api.assignMazeSlot(0,"d_toast");api.live().steps=1;a.deepEqual(plain(api.checkSpoil()),[api.R.ITEMS.d_toast.n]);api.syncMazeSlots();a.equal(hero.bag.length,0);a.equal(api.shown()[0],null);
});
test("bindings are party-save data; another or legacy save cannot inherit global bindings",()=>{
 const {api}=fixture(["potion"]);api.assignMazeSlot(0,"potion");const saved=plain(api.live());api.setLive({...saved,mazeSlots:undefined});a.deepEqual(plain(api.shown()),[null,null,null,null]);api.setLive(saved);a.equal(api.shown()[0],"potion");
 api.setLive({...saved,party:saved.party.map(c=>({...c,bag:[]}))});a.deepEqual(plain(api.shown()),[null,null,null,null]);
 a.match(party,/syncMazeSlots\(\);live.at=/);a.match(party,/live=clone\(save\);syncMazeSlots\(\)/);
});
test("resetRun/new game clear all bindings together with existing maze reset",()=>{
 const {api}=fixture(["potion"]);api.assignMazeSlot(0,"potion");api.clearMazeSlots();a.deepEqual(plain(api.shown()),[null,null,null,null]);
 a.match(game,/function resetRun\(\)\{setMazeSlots\(\[null,null,null,null\]\);if\(window.SOTA&&SOTA.rpg&&SOTA.rpg.clearMazeSlots\)SOTA.rpg.clearMazeSlots\(\)/);
 a.match(party,/if\(S.resetRun\)S.resetRun\(\);doSave\(true\)/);
});
test("portrait parchment layout and text-only slot art remain intact",()=>{
 a.match(html,/#slots\{[^}]*grid-template-columns:repeat\(2,52px\)/);a.match(html,/@media \(min-aspect-ratio:1\/1\)\{#slots\{grid-template-columns:repeat\(4,56px\)/);
 a.match(html,/font:10px\/1.15 Georgia,serif/);a.doesNotMatch(party.slice(party.indexOf('// ---- Maze item shortcuts'),party.indexOf('// ---- portraits:')),/\.webp|\.png|createElement\("img"/);
 const changed=execFileSync("git",["ls-files","--others","--exclude-standard"],{cwd:root,encoding:"utf8"})+execFileSync("git",["diff","--name-only","HEAD"],{cwd:root,encoding:"utf8"});a.doesNotMatch(changed,/\.(png|webp|jpe?g|svg|gif)$/m);
});
test("index and service-worker pins match game 19, party 25, VER 66",()=>{
 const sw=read("sw.js");a.match(sw,/^const VER="66",CACHE="sota-s1-v"\+VER/);for(const src of [html,sw]){a.ok(src.includes("game.js?v=19"));a.ok(src.includes("party.js?v=25"));a.ok(!src.includes("game.js?v=18"));a.ok(!src.includes("party.js?v=24"));}
});
