"use strict";
// Jeremy t2734u + t2735u: potions in a bag weigh nothing; armor and weapons keep their b83f049 weights; armor/weapons EQUIPPED on
// the player or a companion weigh nothing toward bag weight (equip moves the item out of c.bag; R.bagWeight sums c.bag only).
const test=require("node:test"),a=require("node:assert"),fs=require("fs"),path=require("path"),vm=require("vm"),{execFileSync}=require("child_process");
const root=path.join(__dirname,"..");
function load(rules,econ){const c={window:{},console};vm.createContext(c);vm.runInContext(rules,c);c.window.RPG=c.window.RPG||c.RPG;vm.runInContext(econ,c);return c.window.RPG;}
const R=load(fs.readFileSync(path.join(root,"rules.js"),"utf8"),fs.readFileSync(path.join(root,"econ.js"),"utf8"));
const git=f=>execFileSync("git",["show","b83f049:"+f],{cwd:root,encoding:"utf8",maxBuffer:1<<26});
const B=load(git("rules.js"),git("econ.js"));
const POTIONS=Object.keys(R.ITEMS).filter(id=>R.ITEMS[id].slot==="use"&&/potion|elixir/i.test(R.ITEMS[id].n));
const GEAR=Object.keys(B.ITEMS).filter(id=>["weapon","offhand","helmet","chest","gloves","boots","acc"].includes(B.ITEMS[id].slot));
test("the potions are the healing potion, mana potion and Moon elixir; smelling salts (revive), ration and Hunter's stew (food) are not potions and keep their weights",()=>{
 a.equal(R.ITEMS.ration.w,B.ITEMS.ration.w);a.equal(R.ITEMS.c_stew.w,B.ITEMS.c_stew.w);
 a.deepEqual(POTIONS.slice().sort(),["c_elixir","ether","potion"]);a.equal(R.ITEMS.salts.w,0.2);a.equal(B.ITEMS.salts.w,0.2);
 a.equal(B.ITEMS.potion.w,0.5);a.equal(B.ITEMS.ether.w,0.5);a.equal(B.ITEMS.c_elixir.w,0.5);// what they weighed on b83f049
});
test("every potion weighs 0 and adds 0 to bag weight (player and companion bags)",()=>{
 const h=R.newChar("Hero","human","warrior",{},"cleave"),m=R.newChar("Mira","cat","mage",{},R.SKILLS.mage[0].id);
 for(const c of [h,m]){c.bag=["z5_crystal_plate"];const w0=R.bagWeight(c);for(const id of POTIONS){a.equal(R.ITEMS[id].w,0,id);for(let n=0;n<10;n++)c.bag.push(id);a.equal(R.bagWeight(c),w0,id);}}
});
test("every armor and weapon (and shield/jewel) keeps exactly its b83f049 weight; no other item weight changed except the 3 potions",()=>{
 a.ok(GEAR.length>300,"gear "+GEAR.length);for(const id of GEAR)a.equal(R.ITEMS[id].w,B.ITEMS[id].w,id);
 const changed=Object.keys(B.ITEMS).filter(id=>!R.ITEMS[id]||R.ITEMS[id].w!==B.ITEMS[id].w).sort();a.deepEqual(changed,["c_elixir","ether","potion"]);
});
function equipCase(c,id,slot){c.bag=[id,"potion","z1_cave_iron_plate"];const before=R.bagWeight(c),w=R.ITEMS[id].w;a.ok(w>0);
 a.ok(R.equip(c,id,slot),"equip "+id);a.equal(c.equip[slot],id);a.ok(Math.abs(R.bagWeight(c)-(before-w))<1e-9,"equip drops "+id);
 a.ok(R.unequip(c,slot),"unequip "+id);a.equal(c.equip[slot],null);a.ok(Math.abs(R.bagWeight(c)-before)<1e-9,"unequip restores "+id);}
for(const [who,race,cls] of [["player (Hero)","human","warrior"],["companion (Brunn)","dwarf","warrior"]]){
 test(who+": equipping armor/a weapon drops bag weight by its weight, unequipping brings it back, a swap moves weight correctly",()=>{
  const c=R.newChar(who.includes("Hero")?"Hero":"Brunn",race,cls,{str:4},"cleave");if(!who.includes("Hero"))c.companion=true;c.lvl=50;c.stats.str=60;
  equipCase(c,"z5_crystal_edge_sword","weapon");equipCase(c,"z5_crystal_plate","chest");equipCase(c,"z5_crystal_tower_shield","offhand");
  // swap: wearing A, equip B from the bag -> A goes back into the bag, B leaves it
  c.bag=["z5_crystal_plate","z1_cave_iron_plate"];R.equip(c,"z5_crystal_plate","chest");const wA=R.ITEMS.z5_crystal_plate.w,wB=R.ITEMS.z1_cave_iron_plate.w;
  a.equal(R.bagWeight(c),wB);a.ok(R.equip(c,"z1_cave_iron_plate","chest"));a.equal(c.equip.chest,"z1_cave_iron_plate");a.deepEqual(c.bag,["z5_crystal_plate"]);a.equal(R.bagWeight(c),wA);
  c.bag.push("z1_cave_iron_sword","z5_crystal_mace");R.equip(c,"z1_cave_iron_sword","weapon");const w1=R.bagWeight(c);R.equip(c,"z5_crystal_mace","weapon");
  a.ok(Math.abs(R.bagWeight(c)-(w1-R.ITEMS.z5_crystal_mace.w+R.ITEMS.z1_cave_iron_sword.w))<1e-9,"weapon swap");
  // equipped gear never counts: a fully dressed member with an empty bag weighs 0
  c.bag=[];a.equal(R.bagWeight(c),0);a.ok(Object.values(c.equip).some(Boolean));
 });
}
test("the backpack weight line in party.js reads R.bagWeight(c) (bag only), so the screen shows the same number",()=>{
 const src=fs.readFileSync(path.join(root,"party.js"),"utf8");a.ok(src.includes('const wt=R.bagWeight(c),lim=R.carryLimit(c);'));
 a.match(fs.readFileSync(path.join(root,"rules.js"),"utf8"),/function bagWeight\(c\)\{const np=c\.bag\.filter[^\n]*return c\.bag\.reduce/);
});
