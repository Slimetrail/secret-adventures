/* Secret of the Adventures - Stage 4 rules: races, classes, stats, skills, levels, items, monsters, fights. Pure logic, no screen, no network.
   Works in the browser (window.RPG) and in node (module.exports) so tests can run it directly. */
(function(root){
"use strict";
const CAP=50,START_POINTS=10,LEVEL_POINTS=10;
// cost to raise a stat by 1 from its current value
function cost(v){return v<=5?1:v<=10?2:v<=15?3:4;}
function spendCost(from,to){let c=0;for(let v=from;v<to;v++)c+=cost(v);return c;}
const CLASSES={
 warrior:{name:"Warrior",main:"str",magic:false,weapons:["sword","axe","mace"],armor:3},
 rogue:{name:"Rogue",main:"sta",magic:false,weapons:["dagger","sword"],armor:2},
 archer:{name:"Archer",main:"sta",magic:false,weapons:["bow","dagger"],armor:2},
 mage:{name:"Mage",main:"man",magic:true,weapons:["staff","dagger"],armor:1}};
// armor: 1 light, 2 medium, 3 heavy. base stats: str strength, sta stamina, man mana
const RACES={
 human:{name:"Human",classes:["warrior","rogue","archer","mage"],armor:3,anyWeapon:true,base:{str:5,sta:5,man:5},carry:1},
 elf:{name:"Elf",classes:["mage","archer","rogue","warrior"],armor:2,anyWeapon:false,base:{str:5,sta:5,man:8},carry:1},
 dwarf:{name:"Dwarf",classes:["warrior","rogue","archer"],armor:3,anyWeapon:true,base:{str:9,sta:7,man:1},carry:1.6},
 cat:{name:"Cat person",classes:["mage","rogue","warrior"],armor:1,anyWeapon:false,base:{str:2,sta:9,man:5},carry:0.6}};
function allowed(race,cls){return !!(RACES[race]&&CLASSES[cls]&&RACES[race].classes.includes(cls));}
function armorCap(c){return RACES[c.race].armor;} // armor limits come from race only, as in the design sheet
// skills: k = attack kind (phys / magic / heal / guard), p = power, mp = cost
const SKILLS={
 warrior:[{id:"cleave",n:"Cleave",k:"phys",p:1.6,mp:3,all:1},{id:"bash",n:"Shield Bash",k:"phys",p:1.4,mp:2},{id:"rally",n:"Rally",k:"guard",p:1,mp:3},{id:"rage",n:"Berserk Blow",k:"phys",p:2.4,mp:6},{id:"quake",n:"Ground Slam",k:"phys",p:1.9,mp:8,all:1},{id:"titan",n:"Titan Strike",k:"phys",p:3.4,mp:12}],
 rogue:[{id:"stab",n:"Backstab",k:"phys",p:1.8,mp:3},{id:"poison",n:"Poison Edge",k:"phys",p:1.5,mp:2},{id:"smoke",n:"Smoke Veil",k:"guard",p:1,mp:3},{id:"flurry",n:"Blade Flurry",k:"phys",p:1.3,mp:6,all:1},{id:"shadow",n:"Shadow Step",k:"phys",p:2.6,mp:8},{id:"assassin",n:"Final Cut",k:"phys",p:3.4,mp:12}],
 archer:[{id:"aimed",n:"Aimed Shot",k:"phys",p:1.8,mp:3},{id:"volley",n:"Volley",k:"phys",p:1.2,mp:4,all:1},{id:"pin",n:"Pinning Arrow",k:"phys",p:1.5,mp:3},{id:"hawk",n:"Hawk Eye",k:"phys",p:2.4,mp:6},{id:"rain",n:"Arrow Rain",k:"phys",p:1.8,mp:9,all:1},{id:"star",n:"Star Arrow",k:"phys",p:3.4,mp:12}],
 mage:[{id:"bolt",n:"Arcane Bolt",k:"magic",p:1.8,mp:3},{id:"frost",n:"Frost Shard",k:"magic",p:1.6,mp:3},{id:"mend",n:"Mend",k:"heal",p:1.6,mp:4},{id:"storm",n:"Void Storm",k:"magic",p:1.4,mp:7,all:1},{id:"nova",n:"Star Nova",k:"magic",p:2.8,mp:9},{id:"rift",n:"Crystal Rift",k:"magic",p:2.2,mp:14,all:1}]};
function skillSlots(level){return 1+Math.floor(Math.min(level,CAP)/3);} // one at start, one more every 3 levels
function pointsEarned(level){return START_POINTS+LEVEL_POINTS*Math.floor(Math.min(level,CAP)/2);} // 10 more every other level
function xpNeed(level){return level>=CAP?Infinity:Math.round(1.8*level*level+9*level);}
function newChar(name,race,cls,alloc,skill){
 if(!allowed(race,cls))throw new Error("race/class not allowed");
 const b=RACES[race].base,s={str:b.str,sta:b.sta,man:b.man};let spent=0;
 for(const k of["str","sta","man"]){const add=(alloc&&alloc[k])|0;if(add<0)throw new Error("bad points");spent+=spendCost(s[k],s[k]+add);s[k]+=add;}
 if(spent>START_POINTS)throw new Error("too many points");
 if(!SKILLS[cls].slice(0,3).some(x=>x.id===skill))throw new Error("bad starting skill");
 if(race==="dwarf"&&s.man>RACES.dwarf.base.man)throw new Error("dwarves have no magic");
 const c={name:String(name||"Hero").slice(0,14),race,cls,lvl:1,xp:0,stats:s,spent,skills:[skill],equip:{weapon:null,offhand:null,helmet:null,chest:null,gloves:null,boots:null,acc1:null,acc2:null},bag:[]};
 c.hp=maxHp(c,1);c.mp=maxMp(c);return c;}
function raise(c,k){const v=c.stats[k],p=cost(v);if(c.race==="dwarf"&&k==="man")return false;if(pointsEarned(c.lvl)-c.spent<p)return false;c.stats[k]++;c.spent+=p;return true;}
function gearSum(c,key){let t=0;for(const s in c.equip){const it=c.equip[s]&&ITEMS[c.equip[s]];if(it&&it[key])t+=it[key];}return t;}
function maxHp(c,hpMul){return Math.round((24+4*c.stats.sta+3*c.stats.str+7*c.lvl+gearSum(c,"hp"))*(hpMul||1));}
function maxMp(c){return c.race==="dwarf"&&!CLASSES[c.cls].magic?6+2*c.stats.sta+c.lvl:8+2*c.stats.man+2*c.lvl;}
function buffOf(c,k){const b=c.buff;return b&&b.f>0&&b[k]?b[k]/100:0;}
function power(c){const m=CLASSES[c.cls].main,s0=c.stats,bs=buffOf(c,"sta"),s={str:s0.str,sta:s0.sta*(1+bs),man:s0.man};return (1+buffOf(c,"str"))*((m==="str"?2.2*s.str:m==="sta"?2.2*s.sta+0.5*s.str:0.8*s.str+0.6*s.sta)+c.lvl*1.5+gearSum(c,"atk")+4);}
function magicPower(c){return 2.6*c.stats.man+c.lvl*1.8+gearSum(c,"mag")+4;}
function defense(c){return gearSum(c,"def")+c.stats.sta*0.6+c.lvl*0.8;}
function carryLimit(c){return Math.round((12+3*c.stats.str)*RACES[c.race].carry);}
function bagWeight(c){const np=c.bag.filter(id=>ITEMS[id]&&ITEMS[id].slot==="part").length,bulk=window.ECON?window.ECON.partBulk(np):0;return c.bag.reduce((t,id)=>t+((ITEMS[id]&&ITEMS[id].w)||0),0)+bulk;}
function canCarry(c,id){return bagWeight({bag:c.bag.concat([id])})<=carryLimit(c);}
function gainXp(c,n,hpMul){const gained=[];if(c.lvl>=CAP)return gained;c.xp+=n;
 while(c.lvl<CAP&&c.xp>=xpNeed(c.lvl)){c.xp-=xpNeed(c.lvl);c.lvl++;gained.push(c.lvl);}
 if(c.lvl>=CAP)c.xp=0;c.hp=Math.min(maxHp(c,hpMul),c.hp+Math.round(maxHp(c,hpMul)*0.3));c.mp=maxMp(c);return gained;}
function learn(c,id){if(c.skills.length>=skillSlots(c.lvl))return false;const s=SKILLS[c.cls].find(x=>x.id===id);if(!s||c.skills.includes(id))return false;c.skills.push(id);return true;}
// items: slot, w weight (kg), a armor class 1-3, t weapon type, stats; junk has v value; potions use
const ITEMS={
 potion:{n:"Healing potion",slot:"use",w:0.5,heal:0.45,v:8},ether:{n:"Mana potion",slot:"use",w:0.5,mana:0.5,v:10},salts:{n:"Smelling salts",slot:"use",w:0.2,revive:0.3,v:12},
 sword:{n:"Iron sword",slot:"weapon",t:"sword",w:4,atk:6},axe:{n:"Hand axe",slot:"weapon",t:"axe",w:5,atk:7},mace:{n:"Mace",slot:"weapon",t:"mace",w:5,atk:6},
 dagger:{n:"Dagger",slot:"weapon",t:"dagger",w:1,atk:4},bow:{n:"Short bow",slot:"weapon",t:"bow",w:2,atk:5},staff:{n:"Oak staff",slot:"weapon",t:"staff",w:2,atk:2,mag:5},
 buckler:{n:"Buckler",slot:"offhand",a:2,w:3,def:2},towershield:{n:"Tower shield",slot:"offhand",a:3,w:8,def:5},tome:{n:"Rune tome",slot:"offhand",a:1,w:1,mag:3},
 cap:{n:"Cloth hood",slot:"helmet",a:1,w:0.5,def:1},helm:{n:"Steel helm",slot:"helmet",a:3,w:3,def:3},
 robe:{n:"Silk robe",slot:"chest",a:1,w:1,def:1,mag:2},leather:{n:"Leather vest",slot:"chest",a:2,w:4,def:3},plate:{n:"Plate armor",slot:"chest",a:3,w:12,def:7},
 wraps:{n:"Cloth wraps",slot:"gloves",a:1,w:0.3,def:1},gauntlets:{n:"Gauntlets",slot:"gloves",a:3,w:2,def:2},
 sandals:{n:"Soft boots",slot:"boots",a:1,w:0.5,def:1},greaves:{n:"Iron boots",slot:"boots",a:3,w:3,def:2},
 ring:{n:"Moon ring",slot:"acc",w:0.1,mag:2,hp:5},amulet:{n:"Ember amulet",slot:"acc",w:0.2,atk:2,hp:5},
 j_tooth:{n:"Old tooth",slot:"junk",w:0.2,v:2},j_bone:{n:"Cracked bone",slot:"junk",w:0.5,v:3},j_scale:{n:"Dull scale",slot:"junk",w:0.3,v:6},j_horn:{n:"Chipped horn",slot:"junk",w:1,v:10},j_gem:{n:"Cloudy gem",slot:"junk",w:0.1,v:18}};
// Legacy relic items stay readable in older saves. New chests use the named zone lists below.
const CHEST_GEAR=["sword","axe","mace","dagger","bow","staff","buckler","towershield","tome","cap","helm","robe","leather","plate","wraps","gauntlets","sandals","greaves"],CHEST_JEWELS=["ring","amulet"];
for(let tier=1;tier<=5;tier++)for(const id of CHEST_GEAR.concat(CHEST_JEWELS)){
 const base=ITEMS[id],it=Object.assign({},base,{n:["","Wayfarer","Verdant","Moonsteel","Runic","Crystal"][tier]+" "+base.n,tier,v:40*tier*tier});
 for(const k of ["atk","mag","def","hp"])if(base[k])it[k]=base[k]*tier+(tier-1)*(k==="hp"?12:2);
 ITEMS["relic"+tier+"_"+id]=it;
}
// Exact filed named lists: prebuilt shared class sets, never generated when companions join.
const ZONE_ITEMS={
 z1_cave_iron_sword:{"n":"Cave-iron sword","slot":"weapon","t":"sword","atk":6,"w":4,"v":40},
 z1_scrap_axe:{"n":"Scrap axe","slot":"weapon","t":"axe","atk":6,"w":5,"v":40},
 z1_trail_mace:{"n":"Trail mace","slot":"weapon","t":"mace","atk":6,"w":5,"v":40},
 z1_notch_dagger:{"n":"Notch dagger","slot":"weapon","t":"dagger","atk":4,"w":1,"v":40},
 z1_rusted_short_sword:{"n":"Rusted short-sword","slot":"weapon","t":"sword","atk":4,"w":4,"v":40},
 z1_bone_splinter:{"n":"Bone splinter","slot":"weapon","t":"dagger","atk":4,"w":1,"v":40},
 z1_root_staff:{"n":"Root staff","slot":"weapon","t":"staff","atk":2,"mag":5,"w":2,"v":40},
 z1_knotted_walking_staff:{"n":"Knotted walking staff","slot":"weapon","t":"staff","atk":2,"mag":5,"w":2,"v":40},
 z1_cave_ash_staff:{"n":"Cave-ash staff","slot":"weapon","t":"staff","atk":2,"mag":5,"w":2,"v":40},
 z1_camp_bow:{"n":"Camp bow","slot":"weapon","t":"bow","atk":5,"w":2,"v":40},
 z1_bent_short_bow:{"n":"Bent short bow","slot":"weapon","t":"bow","atk":5,"w":2,"v":40},
 z1_sinew_bow:{"n":"Sinew bow","slot":"weapon","t":"bow","atk":5,"w":2,"v":40},
 z1_riveted_plate:{"n":"Riveted plate","slot":"chest","a":3,"def":7,"w":12,"v":40},
 z1_cave_iron_plate:{"n":"Cave-iron plate","slot":"chest","a":3,"def":7,"w":12,"v":40},
 z1_scrap_plate:{"n":"Scrap plate","slot":"chest","a":3,"def":7,"w":12,"v":40},
 z1_scavenger_vest:{"n":"Scavenger vest","slot":"chest","a":2,"def":3,"w":4,"v":40},
 z1_notch_leather:{"n":"Notch leather","slot":"chest","a":2,"def":3,"w":4,"v":40},
 z1_bone_strap_vest:{"n":"Bone-strap vest","slot":"chest","a":2,"def":3,"w":4,"v":40},
 z1_travel_robe:{"n":"Travel robe","slot":"chest","a":1,"def":1,"mag":2,"w":1,"v":40},
 z1_rootweave_robe:{"n":"Rootweave robe","slot":"chest","a":1,"def":1,"mag":2,"w":1,"v":40},
 z1_cave_ash_robe:{"n":"Cave-ash robe","slot":"chest","a":1,"def":1,"mag":2,"w":1,"v":40},
 z1_trail_leather:{"n":"Trail leather","slot":"chest","a":2,"def":3,"w":4,"v":40},
 z1_camp_leather:{"n":"Camp leather","slot":"chest","a":2,"def":3,"w":4,"v":40},
 z1_sinew_jerkin:{"n":"Sinew jerkin","slot":"chest","a":2,"def":3,"w":4,"v":40},
 z1_warrior_iron_band:{"n":"Iron band","slot":"acc","accessory":"ring","atk":2,"hp":5,"w":0.1,"v":40},
 z1_warrior_ember_necklace:{"n":"Ember necklace","slot":"acc","accessory":"amulet","atk":2,"hp":5,"w":0.2,"v":40},
 z1_warrior_cave_stone_ring:{"n":"Cave-stone ring","slot":"acc","accessory":"ring","atk":2,"hp":5,"w":0.1,"v":40},
 z1_rogue_notch_ring:{"n":"Notch ring","slot":"acc","accessory":"ring","atk":2,"hp":5,"w":0.1,"v":40},
 z1_rogue_bone_pendant:{"n":"Bone pendant","slot":"acc","accessory":"amulet","atk":2,"hp":5,"w":0.2,"v":40},
 z1_rogue_scrap_copper_ring:{"n":"Scrap-copper ring","slot":"acc","accessory":"ring","atk":2,"hp":5,"w":0.1,"v":40},
 z1_mage_moon_ring:{"n":"Moon ring","slot":"acc","accessory":"ring","mag":2,"hp":5,"w":0.1,"v":40},
 z1_mage_root_pendant:{"n":"Root pendant","slot":"acc","accessory":"amulet","mag":2,"hp":5,"w":0.2,"v":40},
 z1_mage_travel_charm:{"n":"Travel charm","slot":"acc","accessory":"amulet","mag":2,"hp":5,"w":0.2,"v":40},
 z1_archer_camp_ring:{"n":"Camp ring","slot":"acc","accessory":"ring","atk":2,"hp":5,"w":0.1,"v":40},
 z1_archer_sinew_necklace:{"n":"Sinew necklace","slot":"acc","accessory":"amulet","atk":2,"hp":5,"w":0.2,"v":40},
 z1_archer_trail_charm:{"n":"Trail charm","slot":"acc","accessory":"amulet","atk":2,"hp":5,"w":0.2,"v":40},
 z1_iron_rim_shield:{"n":"Iron-rim shield","slot":"offhand","a":2,"def":2,"w":3,"v":40},
 z1_cloth_wraps:{"n":"Cloth wraps","slot":"gloves","a":1,"def":1,"w":0.3,"v":40},
 z1_novice_tome:{"n":"Novice tome","slot":"offhand","a":1,"mag":3,"w":1,"v":40},
 z1_soft_trail_boots:{"n":"Soft trail boots","slot":"boots","a":1,"def":1,"w":0.5,"v":40},
 z2_briar_axe:{"n":"Briar axe","slot":"weapon","t":"axe","atk":16,"w":5,"v":160},
 z2_thorned_sword:{"n":"Thorned sword","slot":"weapon","t":"sword","atk":16,"w":4,"v":160},
 z2_knot_mace:{"n":"Knot mace","slot":"weapon","t":"mace","atk":16,"w":5,"v":160},
 z2_greeniron_blade:{"n":"Greeniron blade","slot":"weapon","t":"sword","atk":16,"w":4,"v":160},
 z2_quiet_blade:{"n":"Quiet blade","slot":"weapon","t":"sword","atk":10,"w":4,"v":160},
 z2_vine_dagger:{"n":"Vine dagger","slot":"weapon","t":"dagger","atk":10,"w":1,"v":160},
 z2_maze_knife:{"n":"Maze knife","slot":"weapon","t":"dagger","atk":10,"w":1,"v":160},
 z2_hidden_short_sword:{"n":"Hidden short-sword","slot":"weapon","t":"sword","atk":10,"w":4,"v":160},
 z2_greenwood_staff:{"n":"Greenwood staff","slot":"weapon","t":"staff","atk":6,"mag":12,"w":2,"v":160},
 z2_fairy_wood_staff:{"n":"Fairy-wood staff","slot":"weapon","t":"staff","atk":6,"mag":12,"w":2,"v":160},
 z2_moss_wrapped_staff:{"n":"Moss-wrapped staff","slot":"weapon","t":"staff","atk":6,"mag":12,"w":2,"v":160},
 z2_bark_staff:{"n":"Bark staff","slot":"weapon","t":"staff","atk":6,"mag":12,"w":2,"v":160},
 z2_yew_bow:{"n":"Yew bow","slot":"weapon","t":"bow","atk":12,"w":2,"v":160},
 z2_bent_yew_bow:{"n":"Bent-yew bow","slot":"weapon","t":"bow","atk":12,"w":2,"v":160},
 z2_goblin_short_bow:{"n":"Goblin short bow","slot":"weapon","t":"bow","atk":12,"w":2,"v":160},
 z2_leaf_string_bow:{"n":"Leaf-string bow","slot":"weapon","t":"bow","atk":12,"w":2,"v":160},
 z2_moss_iron_plate:{"n":"Moss-iron plate","slot":"chest","a":3,"def":16,"w":12,"v":160},
 z2_briar_plate:{"n":"Briar plate","slot":"chest","a":3,"def":16,"w":12,"v":160},
 z2_thorned_plate:{"n":"Thorned plate","slot":"chest","a":3,"def":16,"w":12,"v":160},
 z2_greeniron_plate:{"n":"Greeniron plate","slot":"chest","a":3,"def":16,"w":12,"v":160},
 z2_forest_leather:{"n":"Forest leather","slot":"chest","a":2,"def":8,"w":4,"v":160},
 z2_vine_vest:{"n":"Vine vest","slot":"chest","a":2,"def":8,"w":4,"v":160},
 z2_maze_leather:{"n":"Maze leather","slot":"chest","a":2,"def":8,"w":4,"v":160},
 z2_hidden_vest:{"n":"Hidden vest","slot":"chest","a":2,"def":8,"w":4,"v":160},
 z2_greenweave_robe:{"n":"Greenweave robe","slot":"chest","a":1,"def":4,"mag":6,"w":1,"v":160},
 z2_fairy_thread_robe:{"n":"Fairy-thread robe","slot":"chest","a":1,"def":4,"mag":6,"w":1,"v":160},
 z2_moss_robe:{"n":"Moss robe","slot":"chest","a":1,"def":4,"mag":6,"w":1,"v":160},
 z2_barkcloth_robe:{"n":"Barkcloth robe","slot":"chest","a":1,"def":4,"mag":6,"w":1,"v":160},
 z2_hunt_leather:{"n":"Hunt leather","slot":"chest","a":2,"def":8,"w":4,"v":160},
 z2_yew_hide_jerkin:{"n":"Yew-hide jerkin","slot":"chest","a":2,"def":8,"w":4,"v":160},
 z2_leaf_stitched_leather:{"n":"Leaf-stitched leather","slot":"chest","a":2,"def":8,"w":4,"v":160},
 z2_goblin_cut_vest:{"n":"Goblin-cut vest","slot":"chest","a":2,"def":8,"w":4,"v":160},
 z2_warrior_thorn_ring:{"n":"Thorn ring","slot":"acc","accessory":"ring","atk":6,"hp":22,"w":0.1,"v":160},
 z2_warrior_briar_necklace:{"n":"Briar necklace","slot":"acc","accessory":"amulet","atk":6,"hp":22,"w":0.2,"v":160},
 z2_warrior_moss_iron_ring:{"n":"Moss-iron ring","slot":"acc","accessory":"ring","atk":6,"hp":22,"w":0.1,"v":160},
 z2_warrior_greeniron_pendant:{"n":"Greeniron pendant","slot":"acc","accessory":"amulet","atk":6,"hp":22,"w":0.2,"v":160},
 z2_rogue_vine_ring:{"n":"Vine ring","slot":"acc","accessory":"ring","atk":6,"hp":22,"w":0.1,"v":160},
 z2_rogue_quiet_pendant:{"n":"Quiet pendant","slot":"acc","accessory":"amulet","atk":6,"hp":22,"w":0.2,"v":160},
 z2_rogue_maze_ring:{"n":"Maze ring","slot":"acc","accessory":"ring","atk":6,"hp":22,"w":0.1,"v":160},
 z2_rogue_hidden_charm:{"n":"Hidden charm","slot":"acc","accessory":"amulet","atk":6,"hp":22,"w":0.2,"v":160},
 z2_mage_greenwood_ring:{"n":"Greenwood ring","slot":"acc","accessory":"ring","mag":6,"hp":22,"w":0.1,"v":160},
 z2_mage_fairy_pendant:{"n":"Fairy pendant","slot":"acc","accessory":"amulet","mag":6,"hp":22,"w":0.2,"v":160},
 z2_mage_moss_charm:{"n":"Moss charm","slot":"acc","accessory":"amulet","mag":6,"hp":22,"w":0.2,"v":160},
 z2_mage_bark_ring:{"n":"Bark ring","slot":"acc","accessory":"ring","mag":6,"hp":22,"w":0.1,"v":160},
 z2_archer_yew_ring:{"n":"Yew ring","slot":"acc","accessory":"ring","atk":6,"hp":22,"w":0.1,"v":160},
 z2_archer_leaf_necklace:{"n":"Leaf necklace","slot":"acc","accessory":"amulet","atk":6,"hp":22,"w":0.2,"v":160},
 z2_archer_goblin_charm:{"n":"Goblin charm","slot":"acc","accessory":"amulet","atk":6,"hp":22,"w":0.2,"v":160},
 z2_archer_hunt_pendant:{"n":"Hunt pendant","slot":"acc","accessory":"amulet","atk":6,"hp":22,"w":0.2,"v":160},
 z2_oak_buckler:{"n":"Oak buckler","slot":"offhand","a":2,"def":6,"w":3,"v":160},
 z2_thorn_wraps:{"n":"Thorn wraps","slot":"gloves","a":1,"def":4,"w":0.3,"v":160},
 z2_meadow_tome:{"n":"Meadow tome","slot":"offhand","a":1,"mag":8,"w":1,"v":160},
 z2_trail_boots:{"n":"Trail boots","slot":"boots","a":1,"def":4,"w":0.5,"v":160},
 z3_moonsteel_sword:{"n":"Moonsteel sword","slot":"weapon","t":"sword","atk":22,"w":4,"v":360},
 z3_bone_handled_axe:{"n":"Bone-handled axe","slot":"weapon","t":"axe","atk":22,"w":5,"v":360},
 z3_silvered_mace:{"n":"Silvered mace","slot":"weapon","t":"mace","atk":22,"w":5,"v":360},
 z3_hollow_steel_blade:{"n":"Hollow-steel blade","slot":"weapon","t":"sword","atk":22,"w":4,"v":360},
 z3_grave_iron_sword:{"n":"Grave iron sword","slot":"weapon","t":"sword","atk":22,"w":4,"v":360},
 z3_wolffang_dagger:{"n":"Wolffang dagger","slot":"weapon","t":"dagger","atk":16,"w":1,"v":360},
 z3_moon_short_sword:{"n":"Moon short-sword","slot":"weapon","t":"sword","atk":16,"w":4,"v":360},
 z3_rib_dagger:{"n":"Rib dagger","slot":"weapon","t":"dagger","atk":16,"w":1,"v":360},
 z3_silent_knife:{"n":"Silent knife","slot":"weapon","t":"dagger","atk":16,"w":1,"v":360},
 z3_pale_blade:{"n":"Pale blade","slot":"weapon","t":"sword","atk":16,"w":4,"v":360},
 z3_silvered_staff:{"n":"Silvered staff","slot":"weapon","t":"staff","atk":10,"mag":19,"w":2,"v":360},
 z3_moon_staff:{"n":"Moon staff","slot":"weapon","t":"staff","atk":10,"mag":19,"w":2,"v":360},
 z3_bone_staff:{"n":"Bone staff","slot":"weapon","t":"staff","atk":10,"mag":19,"w":2,"v":360},
 z3_ash_staff:{"n":"Ash staff","slot":"weapon","t":"staff","atk":10,"mag":19,"w":2,"v":360},
 z3_palewood_staff:{"n":"Palewood staff","slot":"weapon","t":"staff","atk":10,"mag":19,"w":2,"v":360},
 z3_bone_bow:{"n":"Bone bow","slot":"weapon","t":"bow","atk":19,"w":2,"v":360},
 z3_harpy_bow:{"n":"Harpy bow","slot":"weapon","t":"bow","atk":19,"w":2,"v":360},
 z3_moon_bow:{"n":"Moon bow","slot":"weapon","t":"bow","atk":19,"w":2,"v":360},
 z3_hollow_bow:{"n":"Hollow bow","slot":"weapon","t":"bow","atk":19,"w":2,"v":360},
 z3_wolf_sinew_bow:{"n":"Wolf-sinew bow","slot":"weapon","t":"bow","atk":19,"w":2,"v":360},
 z3_bone_rim_plate:{"n":"Bone-rim plate","slot":"chest","a":3,"def":25,"w":12,"v":360},
 z3_moonsteel_plate:{"n":"Moonsteel plate","slot":"chest","a":3,"def":25,"w":12,"v":360},
 z3_hollow_steel_plate:{"n":"Hollow-steel plate","slot":"chest","a":3,"def":25,"w":12,"v":360},
 z3_grave_iron_plate:{"n":"Grave iron plate","slot":"chest","a":3,"def":25,"w":12,"v":360},
 z3_silvered_plate:{"n":"Silvered plate","slot":"chest","a":3,"def":25,"w":12,"v":360},
 z3_moon_hide_vest:{"n":"Moon-hide vest","slot":"chest","a":2,"def":13,"w":4,"v":360},
 z3_wolffang_vest:{"n":"Wolffang vest","slot":"chest","a":2,"def":13,"w":4,"v":360},
 z3_rib_stitched_vest:{"n":"Rib-stitched vest","slot":"chest","a":2,"def":13,"w":4,"v":360},
 z3_silent_leather:{"n":"Silent leather","slot":"chest","a":2,"def":13,"w":4,"v":360},
 z3_pale_hide:{"n":"Pale hide","slot":"chest","a":2,"def":13,"w":4,"v":360},
 z3_ashen_robe:{"n":"Ashen robe","slot":"chest","a":1,"def":7,"mag":10,"w":1,"v":360},
 z3_moon_robe:{"n":"Moon robe","slot":"chest","a":1,"def":7,"mag":10,"w":1,"v":360},
 z3_bone_thread_robe:{"n":"Bone-thread robe","slot":"chest","a":1,"def":7,"mag":10,"w":1,"v":360},
 z3_palewood_robe:{"n":"Palewood robe","slot":"chest","a":1,"def":7,"mag":10,"w":1,"v":360},
 z3_silvered_robe:{"n":"Silvered robe","slot":"chest","a":1,"def":7,"mag":10,"w":1,"v":360},
 z3_moon_hide_jerkin:{"n":"Moon-hide jerkin","slot":"chest","a":2,"def":13,"w":4,"v":360},
 z3_bone_laced_jerkin:{"n":"Bone-laced jerkin","slot":"chest","a":2,"def":13,"w":4,"v":360},
 z3_harpy_hide_jerkin:{"n":"Harpy-hide jerkin","slot":"chest","a":2,"def":13,"w":4,"v":360},
 z3_hollow_leather:{"n":"Hollow leather","slot":"chest","a":2,"def":13,"w":4,"v":360},
 z3_wolf_hide_jerkin:{"n":"Wolf-hide jerkin","slot":"chest","a":2,"def":13,"w":4,"v":360},
 z3_warrior_moonsteel_ring:{"n":"Moonsteel ring","slot":"acc","accessory":"ring","atk":10,"hp":39,"w":0.1,"v":360},
 z3_warrior_bone_necklace:{"n":"Bone necklace","slot":"acc","accessory":"amulet","atk":10,"hp":39,"w":0.2,"v":360},
 z3_warrior_silvered_ring:{"n":"Silvered ring","slot":"acc","accessory":"ring","atk":10,"hp":39,"w":0.1,"v":360},
 z3_warrior_hollow_pendant:{"n":"Hollow pendant","slot":"acc","accessory":"amulet","atk":10,"hp":39,"w":0.2,"v":360},
 z3_warrior_grave_iron_charm:{"n":"Grave-iron charm","slot":"acc","accessory":"amulet","atk":10,"hp":39,"w":0.2,"v":360},
 z3_rogue_wolffang_ring:{"n":"Wolffang ring","slot":"acc","accessory":"ring","atk":10,"hp":39,"w":0.1,"v":360},
 z3_rogue_moon_pendant:{"n":"Moon pendant","slot":"acc","accessory":"amulet","atk":10,"hp":39,"w":0.2,"v":360},
 z3_rogue_rib_charm:{"n":"Rib charm","slot":"acc","accessory":"amulet","atk":10,"hp":39,"w":0.2,"v":360},
 z3_rogue_silent_ring:{"n":"Silent ring","slot":"acc","accessory":"ring","atk":10,"hp":39,"w":0.1,"v":360},
 z3_rogue_pale_necklace:{"n":"Pale necklace","slot":"acc","accessory":"amulet","atk":10,"hp":39,"w":0.2,"v":360},
 z3_mage_silvered_ring:{"n":"Silvered ring","slot":"acc","accessory":"ring","mag":10,"hp":39,"w":0.1,"v":360},
 z3_mage_moon_pendant:{"n":"Moon pendant","slot":"acc","accessory":"amulet","mag":10,"hp":39,"w":0.2,"v":360},
 z3_mage_bone_charm:{"n":"Bone charm","slot":"acc","accessory":"amulet","mag":10,"hp":39,"w":0.2,"v":360},
 z3_mage_ash_ring:{"n":"Ash ring","slot":"acc","accessory":"ring","mag":10,"hp":39,"w":0.1,"v":360},
 z3_mage_palewood_necklace:{"n":"Palewood necklace","slot":"acc","accessory":"amulet","mag":10,"hp":39,"w":0.2,"v":360},
 z3_archer_bone_ring:{"n":"Bone ring","slot":"acc","accessory":"ring","atk":10,"hp":39,"w":0.1,"v":360},
 z3_archer_harpy_necklace:{"n":"Harpy necklace","slot":"acc","accessory":"amulet","atk":10,"hp":39,"w":0.2,"v":360},
 z3_archer_moon_charm:{"n":"Moon charm","slot":"acc","accessory":"amulet","atk":10,"hp":39,"w":0.2,"v":360},
 z3_archer_hollow_ring:{"n":"Hollow ring","slot":"acc","accessory":"ring","atk":10,"hp":39,"w":0.1,"v":360},
 z3_archer_wolf_sinew_pendant:{"n":"Wolf-sinew pendant","slot":"acc","accessory":"amulet","atk":10,"hp":39,"w":0.2,"v":360},
 z3_stone_face_shield:{"n":"Stone-face shield","slot":"offhand","a":3,"def":19,"w":8,"v":360},
 z3_night_hood:{"n":"Night hood","slot":"helmet","a":1,"def":7,"w":0.5,"v":360},
 z3_moon_tome:{"n":"Moon tome","slot":"offhand","a":1,"mag":13,"w":1,"v":360},
 z3_strider_boots:{"n":"Strider boots","slot":"boots","a":1,"def":7,"w":0.5,"v":360},
 z4_runic_war_mace:{"n":"Runic war mace","slot":"weapon","t":"mace","atk":30,"w":5,"v":640},
 z4_runic_sword:{"n":"Runic sword","slot":"weapon","t":"sword","atk":30,"w":4,"v":640},
 z4_stone_head_axe:{"n":"Stone-head axe","slot":"weapon","t":"axe","atk":30,"w":5,"v":640},
 z4_griffin_pommel_sword:{"n":"Griffin-pommel sword","slot":"weapon","t":"sword","atk":30,"w":4,"v":640},
 z4_gargoyle_mace:{"n":"Gargoyle mace","slot":"weapon","t":"mace","atk":30,"w":5,"v":640},
 z4_rune_etched_axe:{"n":"Rune-etched axe","slot":"weapon","t":"axe","atk":30,"w":5,"v":640},
 z4_heavy_runic_blade:{"n":"Heavy runic blade","slot":"weapon","t":"sword","atk":30,"w":4,"v":640},
 z4_horn_dagger:{"n":"Horn dagger","slot":"weapon","t":"dagger","atk":22,"w":1,"v":640},
 z4_runic_knife:{"n":"Runic knife","slot":"weapon","t":"dagger","atk":22,"w":1,"v":640},
 z4_scale_dagger:{"n":"Scale dagger","slot":"weapon","t":"dagger","atk":22,"w":1,"v":640},
 z4_griffin_talon_dagger:{"n":"Griffin-talon dagger","slot":"weapon","t":"dagger","atk":22,"w":1,"v":640},
 z4_short_runic_sword:{"n":"Short runic sword","slot":"weapon","t":"sword","atk":22,"w":4,"v":640},
 z4_shadow_horn_blade:{"n":"Shadow horn blade","slot":"weapon","t":"sword","atk":22,"w":4,"v":640},
 z4_etched_stiletto:{"n":"Etched stiletto","slot":"weapon","t":"dagger","atk":22,"w":1,"v":640},
 z4_runic_staff:{"n":"Runic staff","slot":"weapon","t":"staff","atk":14,"mag":26,"w":2,"v":640},
 z4_glyph_staff:{"n":"Glyph staff","slot":"weapon","t":"staff","atk":14,"mag":26,"w":2,"v":640},
 z4_stone_core_staff:{"n":"Stone-core staff","slot":"weapon","t":"staff","atk":14,"mag":26,"w":2,"v":640},
 z4_warding_staff:{"n":"Warding staff","slot":"weapon","t":"staff","atk":14,"mag":26,"w":2,"v":640},
 z4_griffin_bone_staff:{"n":"Griffin-bone staff","slot":"weapon","t":"staff","atk":14,"mag":26,"w":2,"v":640},
 z4_rune_rod:{"n":"Rune rod","slot":"weapon","t":"staff","atk":14,"mag":26,"w":2,"v":640},
 z4_sigil_staff:{"n":"Sigil staff","slot":"weapon","t":"staff","atk":14,"mag":26,"w":2,"v":640},
 z4_griffin_feather_bow:{"n":"Griffin-feather bow","slot":"weapon","t":"bow","atk":26,"w":2,"v":640},
 z4_runic_bow:{"n":"Runic bow","slot":"weapon","t":"bow","atk":26,"w":2,"v":640},
 z4_stone_bow:{"n":"Stone bow","slot":"weapon","t":"bow","atk":26,"w":2,"v":640},
 z4_horn_bow:{"n":"Horn bow","slot":"weapon","t":"bow","atk":26,"w":2,"v":640},
 z4_scale_string_bow:{"n":"Scale-string bow","slot":"weapon","t":"bow","atk":26,"w":2,"v":640},
 z4_long_runic_bow:{"n":"Long runic bow","slot":"weapon","t":"bow","atk":26,"w":2,"v":640},
 z4_gargoyle_limb_bow:{"n":"Gargoyle-limb bow","slot":"weapon","t":"bow","atk":26,"w":2,"v":640},
 z4_gargoyle_plate:{"n":"Gargoyle plate","slot":"chest","a":3,"def":34,"w":12,"v":640},
 z4_runic_plate:{"n":"Runic plate","slot":"chest","a":3,"def":34,"w":12,"v":640},
 z4_stone_rim_plate:{"n":"Stone-rim plate","slot":"chest","a":3,"def":34,"w":12,"v":640},
 z4_griffin_plate:{"n":"Griffin plate","slot":"chest","a":3,"def":34,"w":12,"v":640},
 z4_rune_etched_plate:{"n":"Rune-etched plate","slot":"chest","a":3,"def":34,"w":12,"v":640},
 z4_heavy_runic_plate:{"n":"Heavy runic plate","slot":"chest","a":3,"def":34,"w":12,"v":640},
 z4_horn_bound_plate:{"n":"Horn-bound plate","slot":"chest","a":3,"def":34,"w":12,"v":640},
 z4_scale_stitched_vest:{"n":"Scale-stitched vest","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_horn_vest:{"n":"Horn vest","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_runic_leather:{"n":"Runic leather","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_griffin_hide_vest:{"n":"Griffin-hide vest","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_shadow_scale_vest:{"n":"Shadow scale vest","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_etched_leather:{"n":"Etched leather","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_scale_vest:{"n":"Scale vest","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_glyph_robe:{"n":"Glyph robe","slot":"chest","a":1,"def":10,"mag":14,"w":1,"v":640},
 z4_runic_robe:{"n":"Runic robe","slot":"chest","a":1,"def":10,"mag":14,"w":1,"v":640},
 z4_stone_thread_robe:{"n":"Stone-thread robe","slot":"chest","a":1,"def":10,"mag":14,"w":1,"v":640},
 z4_warding_robe:{"n":"Warding robe","slot":"chest","a":1,"def":10,"mag":14,"w":1,"v":640},
 z4_griffin_down_robe:{"n":"Griffin-down robe","slot":"chest","a":1,"def":10,"mag":14,"w":1,"v":640},
 z4_sigil_robe:{"n":"Sigil robe","slot":"chest","a":1,"def":10,"mag":14,"w":1,"v":640},
 z4_rune_stitched_robe:{"n":"Rune-stitched robe","slot":"chest","a":1,"def":10,"mag":14,"w":1,"v":640},
 z4_scale_stitched_jerkin:{"n":"Scale-stitched jerkin","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_runic_jerkin:{"n":"Runic jerkin","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_stone_laced_jerkin:{"n":"Stone-laced jerkin","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_horn_hide_jerkin:{"n":"Horn-hide jerkin","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_griffin_hide_jerkin:{"n":"Griffin-hide jerkin","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_long_scale_jerkin:{"n":"Long scale jerkin","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_gargoyle_hide_jerkin:{"n":"Gargoyle-hide jerkin","slot":"chest","a":2,"def":18,"w":4,"v":640},
 z4_warrior_runic_ring:{"n":"Runic ring","slot":"acc","accessory":"ring","atk":14,"hp":56,"w":0.1,"v":640},
 z4_warrior_stone_necklace:{"n":"Stone necklace","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_warrior_griffin_pendant:{"n":"Griffin pendant","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_warrior_gargoyle_ring:{"n":"Gargoyle ring","slot":"acc","accessory":"ring","atk":14,"hp":56,"w":0.1,"v":640},
 z4_warrior_rune_etched_charm:{"n":"Rune-etched charm","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_warrior_horn_necklace:{"n":"Horn necklace","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_warrior_heavy_sigil_ring:{"n":"Heavy sigil ring","slot":"acc","accessory":"ring","atk":14,"hp":56,"w":0.1,"v":640},
 z4_rogue_horn_ring:{"n":"Horn ring","slot":"acc","accessory":"ring","atk":14,"hp":56,"w":0.1,"v":640},
 z4_rogue_runic_pendant:{"n":"Runic pendant","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_rogue_scale_necklace:{"n":"Scale necklace","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_rogue_griffin_talon_charm:{"n":"Griffin-talon charm","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_rogue_shadow_ring:{"n":"Shadow ring","slot":"acc","accessory":"ring","atk":14,"hp":56,"w":0.1,"v":640},
 z4_rogue_etched_band:{"n":"Etched band","slot":"acc","accessory":"ring","atk":14,"hp":56,"w":0.1,"v":640},
 z4_rogue_short_sigil_pendant:{"n":"Short sigil pendant","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_mage_runic_ring:{"n":"Runic ring","slot":"acc","accessory":"ring","mag":14,"hp":56,"w":0.1,"v":640},
 z4_mage_glyph_pendant:{"n":"Glyph pendant","slot":"acc","accessory":"amulet","mag":14,"hp":56,"w":0.2,"v":640},
 z4_mage_stone_core_charm:{"n":"Stone-core charm","slot":"acc","accessory":"amulet","mag":14,"hp":56,"w":0.2,"v":640},
 z4_mage_warding_necklace:{"n":"Warding necklace","slot":"acc","accessory":"amulet","mag":14,"hp":56,"w":0.2,"v":640},
 z4_mage_griffin_bone_ring:{"n":"Griffin-bone ring","slot":"acc","accessory":"ring","mag":14,"hp":56,"w":0.1,"v":640},
 z4_mage_rune_rod_charm:{"n":"Rune rod charm","slot":"acc","accessory":"amulet","mag":14,"hp":56,"w":0.2,"v":640},
 z4_mage_sigil_necklace:{"n":"Sigil necklace","slot":"acc","accessory":"amulet","mag":14,"hp":56,"w":0.2,"v":640},
 z4_archer_griffin_feather_ring:{"n":"Griffin-feather ring","slot":"acc","accessory":"ring","atk":14,"hp":56,"w":0.1,"v":640},
 z4_archer_runic_pendant:{"n":"Runic pendant","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_archer_stone_necklace:{"n":"Stone necklace","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_archer_horn_charm:{"n":"Horn charm","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_archer_scale_string_ring:{"n":"Scale-string ring","slot":"acc","accessory":"ring","atk":14,"hp":56,"w":0.1,"v":640},
 z4_archer_long_rune_pendant:{"n":"Long rune pendant","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_archer_gargoyle_limb_charm:{"n":"Gargoyle-limb charm","slot":"acc","accessory":"amulet","atk":14,"hp":56,"w":0.2,"v":640},
 z4_runic_tower_shield:{"n":"Runic tower shield","slot":"offhand","a":3,"def":26,"w":8,"v":640},
 z4_runic_wraps:{"n":"Runic wraps","slot":"gloves","a":1,"def":10,"w":0.3,"v":640},
 z4_warding_tome:{"n":"Warding tome","slot":"offhand","a":1,"mag":18,"w":1,"v":640},
 z4_runic_boots:{"n":"Runic boots","slot":"boots","a":1,"def":10,"w":0.5,"v":640},
 z5_crystal_edge_sword:{"n":"Crystal-edge sword","slot":"weapon","t":"sword","atk":38,"w":4,"v":1000},
 z5_crystal_axe:{"n":"Crystal axe","slot":"weapon","t":"axe","atk":38,"w":5,"v":1000},
 z5_crystal_mace:{"n":"Crystal mace","slot":"weapon","t":"mace","atk":38,"w":5,"v":1000},
 z5_prism_blade:{"n":"Prism blade","slot":"weapon","t":"sword","atk":38,"w":4,"v":1000},
 z5_shard_sword:{"n":"Shard sword","slot":"weapon","t":"sword","atk":38,"w":4,"v":1000},
 z5_bright_iron_sword:{"n":"Bright-iron sword","slot":"weapon","t":"sword","atk":38,"w":4,"v":1000},
 z5_deep_crystal_axe:{"n":"Deep-crystal axe","slot":"weapon","t":"axe","atk":38,"w":5,"v":1000},
 z5_facade_mace:{"n":"Facade mace","slot":"weapon","t":"mace","atk":38,"w":5,"v":1000},
 z5_core_forged_sword:{"n":"Core-forged sword","slot":"weapon","t":"sword","atk":38,"w":4,"v":1000},
 z5_crystal_fang:{"n":"Crystal fang","slot":"weapon","t":"dagger","atk":28,"w":1,"v":1000},
 z5_shard_dagger:{"n":"Shard dagger","slot":"weapon","t":"dagger","atk":28,"w":1,"v":1000},
 z5_prism_knife:{"n":"Prism knife","slot":"weapon","t":"dagger","atk":28,"w":1,"v":1000},
 z5_crystal_short_sword:{"n":"Crystal short-sword","slot":"weapon","t":"sword","atk":28,"w":4,"v":1000},
 z5_glass_edge_dagger:{"n":"Glass-edge dagger","slot":"weapon","t":"dagger","atk":28,"w":1,"v":1000},
 z5_core_dagger:{"n":"Core dagger","slot":"weapon","t":"dagger","atk":28,"w":1,"v":1000},
 z5_bright_fang:{"n":"Bright fang","slot":"weapon","t":"dagger","atk":28,"w":1,"v":1000},
 z5_veil_knife:{"n":"Veil knife","slot":"weapon","t":"dagger","atk":28,"w":1,"v":1000},
 z5_facet_blade:{"n":"Facet blade","slot":"weapon","t":"sword","atk":28,"w":4,"v":1000},
 z5_crystal_staff:{"n":"Crystal staff","slot":"weapon","t":"staff","atk":18,"mag":33,"w":2,"v":1000},
 z5_prism_staff:{"n":"Prism staff","slot":"weapon","t":"staff","atk":18,"mag":33,"w":2,"v":1000},
 z5_shard_staff:{"n":"Shard staff","slot":"weapon","t":"staff","atk":18,"mag":33,"w":2,"v":1000},
 z5_core_staff:{"n":"Core staff","slot":"weapon","t":"staff","atk":18,"mag":33,"w":2,"v":1000},
 z5_light_well_staff:{"n":"Light-well staff","slot":"weapon","t":"staff","atk":18,"mag":33,"w":2,"v":1000},
 z5_deep_crystal_rod:{"n":"Deep-crystal rod","slot":"weapon","t":"staff","atk":18,"mag":33,"w":2,"v":1000},
 z5_facet_staff:{"n":"Facet staff","slot":"weapon","t":"staff","atk":18,"mag":33,"w":2,"v":1000},
 z5_glow_staff:{"n":"Glow staff","slot":"weapon","t":"staff","atk":18,"mag":33,"w":2,"v":1000},
 z5_heart_crystal_staff:{"n":"Heart-crystal staff","slot":"weapon","t":"staff","atk":18,"mag":33,"w":2,"v":1000},
 z5_crystal_bow:{"n":"Crystal bow","slot":"weapon","t":"bow","atk":33,"w":2,"v":1000},
 z5_prism_bow:{"n":"Prism bow","slot":"weapon","t":"bow","atk":33,"w":2,"v":1000},
 z5_shard_bow:{"n":"Shard bow","slot":"weapon","t":"bow","atk":33,"w":2,"v":1000},
 z5_core_bow:{"n":"Core bow","slot":"weapon","t":"bow","atk":33,"w":2,"v":1000},
 z5_light_string_bow:{"n":"Light-string bow","slot":"weapon","t":"bow","atk":33,"w":2,"v":1000},
 z5_deep_crystal_bow:{"n":"Deep-crystal bow","slot":"weapon","t":"bow","atk":33,"w":2,"v":1000},
 z5_facet_bow:{"n":"Facet bow","slot":"weapon","t":"bow","atk":33,"w":2,"v":1000},
 z5_glow_bow:{"n":"Glow bow","slot":"weapon","t":"bow","atk":33,"w":2,"v":1000},
 z5_heartstring_bow:{"n":"Heartstring bow","slot":"weapon","t":"bow","atk":33,"w":2,"v":1000},
 z5_crystal_plate:{"n":"Crystal plate","slot":"chest","a":3,"def":43,"w":12,"v":1000},
 z5_prism_plate:{"n":"Prism plate","slot":"chest","a":3,"def":43,"w":12,"v":1000},
 z5_shard_plate:{"n":"Shard plate","slot":"chest","a":3,"def":43,"w":12,"v":1000},
 z5_bright_iron_plate:{"n":"Bright-iron plate","slot":"chest","a":3,"def":43,"w":12,"v":1000},
 z5_deep_crystal_plate:{"n":"Deep-crystal plate","slot":"chest","a":3,"def":43,"w":12,"v":1000},
 z5_facade_plate:{"n":"Facade plate","slot":"chest","a":3,"def":43,"w":12,"v":1000},
 z5_core_forged_plate:{"n":"Core-forged plate","slot":"chest","a":3,"def":43,"w":12,"v":1000},
 z5_crystal_edge_plate:{"n":"Crystal-edge plate","slot":"chest","a":3,"def":43,"w":12,"v":1000},
 z5_heart_crystal_plate:{"n":"Heart-crystal plate","slot":"chest","a":3,"def":43,"w":12,"v":1000},
 z5_drakehide_vest:{"n":"Drakehide vest","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_crystal_vest:{"n":"Crystal vest","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_shard_leather:{"n":"Shard leather","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_prism_vest:{"n":"Prism vest","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_glass_edge_vest:{"n":"Glass-edge vest","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_core_hide:{"n":"Core hide","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_bright_hide:{"n":"Bright hide","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_veil_leather:{"n":"Veil leather","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_facet_vest:{"n":"Facet vest","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_crystal_thread_robe:{"n":"Crystal-thread robe","slot":"chest","a":1,"def":13,"mag":18,"w":1,"v":1000},
 z5_prism_robe:{"n":"Prism robe","slot":"chest","a":1,"def":13,"mag":18,"w":1,"v":1000},
 z5_shard_robe:{"n":"Shard robe","slot":"chest","a":1,"def":13,"mag":18,"w":1,"v":1000},
 z5_core_robe:{"n":"Core robe","slot":"chest","a":1,"def":13,"mag":18,"w":1,"v":1000},
 z5_light_well_robe:{"n":"Light-well robe","slot":"chest","a":1,"def":13,"mag":18,"w":1,"v":1000},
 z5_deep_crystal_robe:{"n":"Deep-crystal robe","slot":"chest","a":1,"def":13,"mag":18,"w":1,"v":1000},
 z5_facet_robe:{"n":"Facet robe","slot":"chest","a":1,"def":13,"mag":18,"w":1,"v":1000},
 z5_glow_robe:{"n":"Glow robe","slot":"chest","a":1,"def":13,"mag":18,"w":1,"v":1000},
 z5_heart_crystal_robe:{"n":"Heart-crystal robe","slot":"chest","a":1,"def":13,"mag":18,"w":1,"v":1000},
 z5_drakehide_jerkin:{"n":"Drakehide jerkin","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_crystal_jerkin:{"n":"Crystal jerkin","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_prism_jerkin:{"n":"Prism jerkin","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_shard_jerkin:{"n":"Shard jerkin","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_core_hide_jerkin:{"n":"Core hide jerkin","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_light_string_jerkin:{"n":"Light-string jerkin","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_deep_crystal_jerkin:{"n":"Deep-crystal jerkin","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_facet_jerkin:{"n":"Facet jerkin","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_heartstring_jerkin:{"n":"Heartstring jerkin","slot":"chest","a":2,"def":23,"w":4,"v":1000},
 z5_warrior_crystal_ring:{"n":"Crystal ring","slot":"acc","accessory":"ring","atk":18,"hp":73,"w":0.1,"v":1000},
 z5_warrior_prism_necklace:{"n":"Prism necklace","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_warrior_shard_band:{"n":"Shard band","slot":"acc","accessory":"ring","atk":18,"hp":73,"w":0.1,"v":1000},
 z5_warrior_bright_iron_pendant:{"n":"Bright-iron pendant","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_warrior_deep_crystal_ring:{"n":"Deep-crystal ring","slot":"acc","accessory":"ring","atk":18,"hp":73,"w":0.1,"v":1000},
 z5_warrior_facade_charm:{"n":"Facade charm","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_warrior_core_forged_necklace:{"n":"Core-forged necklace","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_warrior_crystal_edge_ring:{"n":"Crystal-edge ring","slot":"acc","accessory":"ring","atk":18,"hp":73,"w":0.1,"v":1000},
 z5_warrior_heart_crystal_pendant:{"n":"Heart-crystal pendant","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_rogue_crystal_fang_ring:{"n":"Crystal fang ring","slot":"acc","accessory":"ring","atk":18,"hp":73,"w":0.1,"v":1000},
 z5_rogue_shard_pendant:{"n":"Shard pendant","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_rogue_prism_necklace:{"n":"Prism necklace","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_rogue_glass_edge_band:{"n":"Glass-edge band","slot":"acc","accessory":"ring","atk":18,"hp":73,"w":0.1,"v":1000},
 z5_rogue_core_charm:{"n":"Core charm","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_rogue_bright_fang_ring:{"n":"Bright fang ring","slot":"acc","accessory":"ring","atk":18,"hp":73,"w":0.1,"v":1000},
 z5_rogue_veil_necklace:{"n":"Veil necklace","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_rogue_facet_ring:{"n":"Facet ring","slot":"acc","accessory":"ring","atk":18,"hp":73,"w":0.1,"v":1000},
 z5_rogue_crystal_short_pendant:{"n":"Crystal short pendant","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_mage_crystal_ring:{"n":"Crystal ring","slot":"acc","accessory":"ring","mag":18,"hp":73,"w":0.1,"v":1000},
 z5_mage_prism_pendant:{"n":"Prism pendant","slot":"acc","accessory":"amulet","mag":18,"hp":73,"w":0.2,"v":1000},
 z5_mage_shard_necklace:{"n":"Shard necklace","slot":"acc","accessory":"amulet","mag":18,"hp":73,"w":0.2,"v":1000},
 z5_mage_core_charm:{"n":"Core charm","slot":"acc","accessory":"amulet","mag":18,"hp":73,"w":0.2,"v":1000},
 z5_mage_light_well_ring:{"n":"Light-well ring","slot":"acc","accessory":"ring","mag":18,"hp":73,"w":0.1,"v":1000},
 z5_mage_deep_crystal_necklace:{"n":"Deep-crystal necklace","slot":"acc","accessory":"amulet","mag":18,"hp":73,"w":0.2,"v":1000},
 z5_mage_facet_band:{"n":"Facet band","slot":"acc","accessory":"ring","mag":18,"hp":73,"w":0.1,"v":1000},
 z5_mage_glow_pendant:{"n":"Glow pendant","slot":"acc","accessory":"amulet","mag":18,"hp":73,"w":0.2,"v":1000},
 z5_mage_heart_crystal_charm:{"n":"Heart-crystal charm","slot":"acc","accessory":"amulet","mag":18,"hp":73,"w":0.2,"v":1000},
 z5_archer_crystal_ring:{"n":"Crystal ring","slot":"acc","accessory":"ring","atk":18,"hp":73,"w":0.1,"v":1000},
 z5_archer_prism_necklace:{"n":"Prism necklace","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_archer_shard_pendant:{"n":"Shard pendant","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_archer_core_band:{"n":"Core band","slot":"acc","accessory":"ring","atk":18,"hp":73,"w":0.1,"v":1000},
 z5_archer_light_string_charm:{"n":"Light-string charm","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_archer_deep_crystal_necklace:{"n":"Deep-crystal necklace","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_archer_facet_ring:{"n":"Facet ring","slot":"acc","accessory":"ring","atk":18,"hp":73,"w":0.1,"v":1000},
 z5_archer_glow_pendant:{"n":"Glow pendant","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_archer_heartstring_charm:{"n":"Heartstring charm","slot":"acc","accessory":"amulet","atk":18,"hp":73,"w":0.2,"v":1000},
 z5_crystal_tower_shield:{"n":"Crystal tower shield","slot":"offhand","a":3,"def":33,"w":8,"v":1000},
 z5_crystal_wraps:{"n":"Crystal wraps","slot":"gloves","a":1,"def":13,"w":0.3,"v":1000},
 z5_crystal_tome:{"n":"Crystal tome","slot":"offhand","a":1,"mag":23,"w":1,"v":1000},
 z5_crystal_boots:{"n":"Crystal boots","slot":"boots","a":1,"def":13,"w":0.5,"v":1000}
};
Object.assign(ITEMS,ZONE_ITEMS);
const ZONE_GEAR=[null,
 {"weapon":{"warrior":["z1_cave_iron_sword","z1_scrap_axe","z1_trail_mace"],"rogue":["z1_notch_dagger","z1_rusted_short_sword","z1_bone_splinter"],"mage":["z1_root_staff","z1_knotted_walking_staff","z1_cave_ash_staff"],"archer":["z1_camp_bow","z1_bent_short_bow","z1_sinew_bow"]},"armor":{"warrior":["z1_riveted_plate","z1_cave_iron_plate","z1_scrap_plate"],"rogue":["z1_scavenger_vest","z1_notch_leather","z1_bone_strap_vest"],"mage":["z1_travel_robe","z1_rootweave_robe","z1_cave_ash_robe"],"archer":["z1_trail_leather","z1_camp_leather","z1_sinew_jerkin"]},"jewelry":{"warrior":["z1_warrior_iron_band","z1_warrior_ember_necklace","z1_warrior_cave_stone_ring"],"rogue":["z1_rogue_notch_ring","z1_rogue_bone_pendant","z1_rogue_scrap_copper_ring"],"mage":["z1_mage_moon_ring","z1_mage_root_pendant","z1_mage_travel_charm"],"archer":["z1_archer_camp_ring","z1_archer_sinew_necklace","z1_archer_trail_charm"]},"equipment":["z1_iron_rim_shield","z1_cloth_wraps","z1_novice_tome","z1_soft_trail_boots"]},
 {"weapon":{"warrior":["z2_briar_axe","z2_thorned_sword","z2_knot_mace","z2_greeniron_blade"],"rogue":["z2_quiet_blade","z2_vine_dagger","z2_maze_knife","z2_hidden_short_sword"],"mage":["z2_greenwood_staff","z2_fairy_wood_staff","z2_moss_wrapped_staff","z2_bark_staff"],"archer":["z2_yew_bow","z2_bent_yew_bow","z2_goblin_short_bow","z2_leaf_string_bow"]},"armor":{"warrior":["z2_moss_iron_plate","z2_briar_plate","z2_thorned_plate","z2_greeniron_plate"],"rogue":["z2_forest_leather","z2_vine_vest","z2_maze_leather","z2_hidden_vest"],"mage":["z2_greenweave_robe","z2_fairy_thread_robe","z2_moss_robe","z2_barkcloth_robe"],"archer":["z2_hunt_leather","z2_yew_hide_jerkin","z2_leaf_stitched_leather","z2_goblin_cut_vest"]},"jewelry":{"warrior":["z2_warrior_thorn_ring","z2_warrior_briar_necklace","z2_warrior_moss_iron_ring","z2_warrior_greeniron_pendant"],"rogue":["z2_rogue_vine_ring","z2_rogue_quiet_pendant","z2_rogue_maze_ring","z2_rogue_hidden_charm"],"mage":["z2_mage_greenwood_ring","z2_mage_fairy_pendant","z2_mage_moss_charm","z2_mage_bark_ring"],"archer":["z2_archer_yew_ring","z2_archer_leaf_necklace","z2_archer_goblin_charm","z2_archer_hunt_pendant"]},"equipment":["z2_oak_buckler","z2_thorn_wraps","z2_meadow_tome","z2_trail_boots"]},
 {"weapon":{"warrior":["z3_moonsteel_sword","z3_bone_handled_axe","z3_silvered_mace","z3_hollow_steel_blade","z3_grave_iron_sword"],"rogue":["z3_wolffang_dagger","z3_moon_short_sword","z3_rib_dagger","z3_silent_knife","z3_pale_blade"],"mage":["z3_silvered_staff","z3_moon_staff","z3_bone_staff","z3_ash_staff","z3_palewood_staff"],"archer":["z3_bone_bow","z3_harpy_bow","z3_moon_bow","z3_hollow_bow","z3_wolf_sinew_bow"]},"armor":{"warrior":["z3_bone_rim_plate","z3_moonsteel_plate","z3_hollow_steel_plate","z3_grave_iron_plate","z3_silvered_plate"],"rogue":["z3_moon_hide_vest","z3_wolffang_vest","z3_rib_stitched_vest","z3_silent_leather","z3_pale_hide"],"mage":["z3_ashen_robe","z3_moon_robe","z3_bone_thread_robe","z3_palewood_robe","z3_silvered_robe"],"archer":["z3_moon_hide_jerkin","z3_bone_laced_jerkin","z3_harpy_hide_jerkin","z3_hollow_leather","z3_wolf_hide_jerkin"]},"jewelry":{"warrior":["z3_warrior_moonsteel_ring","z3_warrior_bone_necklace","z3_warrior_silvered_ring","z3_warrior_hollow_pendant","z3_warrior_grave_iron_charm"],"rogue":["z3_rogue_wolffang_ring","z3_rogue_moon_pendant","z3_rogue_rib_charm","z3_rogue_silent_ring","z3_rogue_pale_necklace"],"mage":["z3_mage_silvered_ring","z3_mage_moon_pendant","z3_mage_bone_charm","z3_mage_ash_ring","z3_mage_palewood_necklace"],"archer":["z3_archer_bone_ring","z3_archer_harpy_necklace","z3_archer_moon_charm","z3_archer_hollow_ring","z3_archer_wolf_sinew_pendant"]},"equipment":["z3_stone_face_shield","z3_night_hood","z3_moon_tome","z3_strider_boots"]},
 {"weapon":{"warrior":["z4_runic_war_mace","z4_runic_sword","z4_stone_head_axe","z4_griffin_pommel_sword","z4_gargoyle_mace","z4_rune_etched_axe","z4_heavy_runic_blade"],"rogue":["z4_horn_dagger","z4_runic_knife","z4_scale_dagger","z4_griffin_talon_dagger","z4_short_runic_sword","z4_shadow_horn_blade","z4_etched_stiletto"],"mage":["z4_runic_staff","z4_glyph_staff","z4_stone_core_staff","z4_warding_staff","z4_griffin_bone_staff","z4_rune_rod","z4_sigil_staff"],"archer":["z4_griffin_feather_bow","z4_runic_bow","z4_stone_bow","z4_horn_bow","z4_scale_string_bow","z4_long_runic_bow","z4_gargoyle_limb_bow"]},"armor":{"warrior":["z4_gargoyle_plate","z4_runic_plate","z4_stone_rim_plate","z4_griffin_plate","z4_rune_etched_plate","z4_heavy_runic_plate","z4_horn_bound_plate"],"rogue":["z4_scale_stitched_vest","z4_horn_vest","z4_runic_leather","z4_griffin_hide_vest","z4_shadow_scale_vest","z4_etched_leather","z4_scale_vest"],"mage":["z4_glyph_robe","z4_runic_robe","z4_stone_thread_robe","z4_warding_robe","z4_griffin_down_robe","z4_sigil_robe","z4_rune_stitched_robe"],"archer":["z4_scale_stitched_jerkin","z4_runic_jerkin","z4_stone_laced_jerkin","z4_horn_hide_jerkin","z4_griffin_hide_jerkin","z4_long_scale_jerkin","z4_gargoyle_hide_jerkin"]},"jewelry":{"warrior":["z4_warrior_runic_ring","z4_warrior_stone_necklace","z4_warrior_griffin_pendant","z4_warrior_gargoyle_ring","z4_warrior_rune_etched_charm","z4_warrior_horn_necklace","z4_warrior_heavy_sigil_ring"],"rogue":["z4_rogue_horn_ring","z4_rogue_runic_pendant","z4_rogue_scale_necklace","z4_rogue_griffin_talon_charm","z4_rogue_shadow_ring","z4_rogue_etched_band","z4_rogue_short_sigil_pendant"],"mage":["z4_mage_runic_ring","z4_mage_glyph_pendant","z4_mage_stone_core_charm","z4_mage_warding_necklace","z4_mage_griffin_bone_ring","z4_mage_rune_rod_charm","z4_mage_sigil_necklace"],"archer":["z4_archer_griffin_feather_ring","z4_archer_runic_pendant","z4_archer_stone_necklace","z4_archer_horn_charm","z4_archer_scale_string_ring","z4_archer_long_rune_pendant","z4_archer_gargoyle_limb_charm"]},"equipment":["z4_runic_tower_shield","z4_runic_wraps","z4_warding_tome","z4_runic_boots"]},
 {"weapon":{"warrior":["z5_crystal_edge_sword","z5_crystal_axe","z5_crystal_mace","z5_prism_blade","z5_shard_sword","z5_bright_iron_sword","z5_deep_crystal_axe","z5_facade_mace","z5_core_forged_sword"],"rogue":["z5_crystal_fang","z5_shard_dagger","z5_prism_knife","z5_crystal_short_sword","z5_glass_edge_dagger","z5_core_dagger","z5_bright_fang","z5_veil_knife","z5_facet_blade"],"mage":["z5_crystal_staff","z5_prism_staff","z5_shard_staff","z5_core_staff","z5_light_well_staff","z5_deep_crystal_rod","z5_facet_staff","z5_glow_staff","z5_heart_crystal_staff"],"archer":["z5_crystal_bow","z5_prism_bow","z5_shard_bow","z5_core_bow","z5_light_string_bow","z5_deep_crystal_bow","z5_facet_bow","z5_glow_bow","z5_heartstring_bow"]},"armor":{"warrior":["z5_crystal_plate","z5_prism_plate","z5_shard_plate","z5_bright_iron_plate","z5_deep_crystal_plate","z5_facade_plate","z5_core_forged_plate","z5_crystal_edge_plate","z5_heart_crystal_plate"],"rogue":["z5_drakehide_vest","z5_crystal_vest","z5_shard_leather","z5_prism_vest","z5_glass_edge_vest","z5_core_hide","z5_bright_hide","z5_veil_leather","z5_facet_vest"],"mage":["z5_crystal_thread_robe","z5_prism_robe","z5_shard_robe","z5_core_robe","z5_light_well_robe","z5_deep_crystal_robe","z5_facet_robe","z5_glow_robe","z5_heart_crystal_robe"],"archer":["z5_drakehide_jerkin","z5_crystal_jerkin","z5_prism_jerkin","z5_shard_jerkin","z5_core_hide_jerkin","z5_light_string_jerkin","z5_deep_crystal_jerkin","z5_facet_jerkin","z5_heartstring_jerkin"]},"jewelry":{"warrior":["z5_warrior_crystal_ring","z5_warrior_prism_necklace","z5_warrior_shard_band","z5_warrior_bright_iron_pendant","z5_warrior_deep_crystal_ring","z5_warrior_facade_charm","z5_warrior_core_forged_necklace","z5_warrior_crystal_edge_ring","z5_warrior_heart_crystal_pendant"],"rogue":["z5_rogue_crystal_fang_ring","z5_rogue_shard_pendant","z5_rogue_prism_necklace","z5_rogue_glass_edge_band","z5_rogue_core_charm","z5_rogue_bright_fang_ring","z5_rogue_veil_necklace","z5_rogue_facet_ring","z5_rogue_crystal_short_pendant"],"mage":["z5_mage_crystal_ring","z5_mage_prism_pendant","z5_mage_shard_necklace","z5_mage_core_charm","z5_mage_light_well_ring","z5_mage_deep_crystal_necklace","z5_mage_facet_band","z5_mage_glow_pendant","z5_mage_heart_crystal_charm"],"archer":["z5_archer_crystal_ring","z5_archer_prism_necklace","z5_archer_shard_pendant","z5_archer_core_band","z5_archer_light_string_charm","z5_archer_deep_crystal_necklace","z5_archer_facet_ring","z5_archer_glow_pendant","z5_archer_heartstring_charm"]},"equipment":["z5_crystal_tower_shield","z5_crystal_wraps","z5_crystal_tome","z5_crystal_boots"]}];
// Only joined members are options. Zone 1 skips the who-roll and stays hero-only on revisits.
function chestRecipient(zone,party,r){const members=Array.isArray(party)&&party.length?party:[{name:"Hero",cls:"warrior"}];
 const recipients=zone===1?members.slice(0,1):members,recipient=recipients.length===1?0:Math.floor(r()*recipients.length);
 return {recipient,who:recipients[recipient]};}
function treasure(zone,seed,plvl,party){const r=rng(seed),kind=["equipment","gold","jewelry"][Math.floor(r()*3)];
 if(kind==="gold")return {kind,tier:zone,gold:40*zone*zone,items:[]};
 const equipmentKind=kind==="jewelry"?null:["weapon","armor","equipment"][Math.floor(r()*3)];
 if(kind==="jewelry"||equipmentKind!=="equipment"){
  const {recipient,who}=chestRecipient(zone,party,r),listKind=kind==="jewelry"?"jewelry":equipmentKind,pool=ZONE_GEAR[zone][listKind][who.cls];
  return {kind,tier:zone,equipmentKind,recipient,forName:who.name,forClass:who.cls,gold:0,items:[pool[Math.floor(r()*pool.length)]]};
 }
 const pool=ZONE_GEAR[zone][equipmentKind];
 return {kind,tier:zone,equipmentKind,gold:0,items:[pool[Math.floor(r()*pool.length)]]};}
const SLOTS=["weapon","offhand","helmet","chest","gloves","boots","acc1","acc2"];
function canEquip(c,id,slot){const it=ITEMS[id];if(!it)return false;const want=slot.startsWith("acc")?"acc":slot;if(it.slot!==want)return false;
 if(it.a&&it.a>armorCap(c))return false;
 if(it.t){const R=RACES[c.race];if(!CLASSES[c.cls].weapons.includes(it.t)&&!R.anyWeapon)return false;if(it.t==="staff"&&!CLASSES[c.cls].magic)return false;}
 if(slot==="offhand"&&(ITEMS[c.equip.weapon]||{}).t==="bow")return false;
 return true;}
function equip(c,id,slot){if(!canEquip(c,id,slot)||!c.bag.includes(id))return false;const old=c.equip[slot];c.bag.splice(c.bag.indexOf(id),1);if(old)c.bag.push(old);c.equip[slot]=id;return true;}
function unequip(c,slot){const old=c.equip[slot];if(!old||!canCarry(c,old))return false;c.equip[slot]=null;c.bag.push(old);return true;}
// monsters per zone (zone 1 weakest .. zone 5 highest). Same lists as the design sheet.
const MONSTERS=[null,
 ["Rat","Slime","Big bug","Cave bat","Giant spider","Mud toad","Fungus creeper"],
 ["Goblin","Orc","Fairy","Kobold","Wild boar","Pixie swarm","Hobgoblin brute"],
 ["Centaur","Werewolf","Skeleton","Ghoul","Harpy","Dire wolf","Wraith"],
 ["Minotaur","Griffin","Lizard man","Stone gargoyle","Manticore","Ogre warlord","Giant scorpion"],
 ["Basilisk","Dragon","Hydra","Wyvern","Chimera","Salamander","Shadow drake"]];
const ZONE_MUL=[0,1,1.3,1.7,2.2,2.8],ZONE_MINLVL=[0,1,8,17,27,38];
// Rows align with MONSTERS: role, HP/ATK/DEF multipliers, optional armor penetration.
const ROLES=[null,
 [["scavenger",.65,.78,.40],["gel tank",1.55,.62,1.30],["shell guard",1.05,.85,1.80],["darting hunter",.70,1.12,.55],["ambusher",.90,1.35,.80],["bulwark",1.35,.80,1.55],["spore caster",.85,1.10,.65,.45]],
 [["raider",.95,1.02,.90],["berserker",1.25,1.28,.70],["spell striker",.65,1.20,.55,.55],["skirmisher",.80,1.05,1.15],["charger",1.30,1.35,.65],["arcane swarm",.70,1.45,.40,.35],["brute tank",1.65,.95,1.65]],
 [["lancer",1.05,1.15,.85],["ravager",1.25,1.35,.65],["bone guard",.85,.90,1.90],["devourer",1.40,1.05,.75],["winged striker",.75,1.35,.55],["pack hunter",.90,1.45,.70],["spectral caster",.70,1.10,1.30,.65]],
 [["breaker",1.20,1.25,.80],["diver",.95,1.40,.75],["scale guard",1.10,1.00,1.65],["stone tank",1.65,.75,2.00],["barbed ambusher",.85,1.45,.65],["warlord",1.50,1.15,1.20],["pincer guard",1.00,1.10,1.80]],
 [["gaze caster",.90,1.10,1.10,.50],["fire devastator",1.25,1.45,1.20,.25],["many-headed tank",1.80,1.10,.90],["sky assassin",.85,1.55,.70],["hybrid striker",1.15,1.25,1.30],["flame caster",.80,1.30,.85,.60],["shadow hunter",1.00,1.40,1.00,.40]]];
// Jeremy t1968u: toughest fight. Near-max level-50 party wins with ease; a not-maxed party needs Defend on the wind-up, heals and focus. (was hp 23000, atk 255, def 145)
const BOSS={n:"Iron Golem",role:"crystal sentinel",hp:15000,atk:230,def:600,boss:true};
function makeBoss(diff){const d=DIFF[diff]||DIFF.normal;return Object.assign({},BOSS,{zone:5,kind:7,lvl:50,max:BOSS.hp,atk:BOSS.atk*d.matk});}
const DIFF={story:{hp:2,matk:0.5,name:"Story"},normal:{hp:1,matk:1,name:"Normal"},hard:{hp:1,matk:1.5,name:"Hard"}};
function partyLevel(party){return Math.round(party.reduce((t,c)=>t+c.lvl,0)/party.length);}
// centre factor: 0 at the edge of the maze, 1 at the centre (cell distance from centre / half size)
function centreFactor(x,y,n){const h=(n-1)/2;return Math.max(0,1-Math.max(Math.abs(x-h),Math.abs(y-h))/h);}
function monsterLevel(zone,plvl,cf){return Math.min(CAP+5,Math.max(ZONE_MINLVL[zone],plvl)+Math.round(3*(cf||0)));}
function makeMonster(zone,idx,plvl,cf,diff){const L=monsterLevel(zone,plvl,cf),m=ZONE_MUL[zone],d=DIFF[diff]||DIFF.normal,k=idx%7,nm=MONSTERS[zone][k],v=ROLES[zone][k];
 const hp=Math.round((16+9*L)*m*v[1]);return {n:nm,role:v[0],zone,kind:k,lvl:L,hp,max:hp,atk:Math.round((5+2.1*L)*m*d.matk*v[2]*10)/10,def:Math.round(L*0.7*m*v[3]),pierce:v[4]||0,boss:false};}
function rng(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function encounter(zone,plvl,cf,diff,seed,party){const r=rng(seed),k=1+Math.floor(r()*3),out=[];for(let i=0;i<k;i++)out.push(makeMonster(zone,Math.floor(r()*7),plvl,cf,diff));
 // Jeremy t1965u/t1966u: hallway foes that are weak next to the party's current stats may come as a pack of up to four.
 // Size is chosen from how fast the party would beat them and how hard they hit; it is not always four. Rooms/boss never pass a party.
 if(Array.isArray(party)&&party.length&&k<4){const alive=party.filter(c=>c.hp>0);if(alive.length){
  const dmgOn=m=>alive.reduce((t,c)=>t+Math.max(1,power(c)-m.def*0.5),0),avgHp=alive.reduce((t,c)=>t+maxHp(c,(DIFF[diff]||DIFF.normal).hp),0)/alive.length,avgDef=alive.reduce((t,c)=>t+defense(c),0)/alive.length;
  const cost=m=>m.hp/dmgOn(m)+Math.max(1,m.atk-avgDef*0.5)/avgHp*4,weak=m=>cost(m)<=1.2;
  if(out.every(weak)){const r2=rng((seed^0x2c1b3c6d)>>>0);let budget=0.8+r2()*3.4,used=out.reduce((t,m)=>t+cost(m),0);
   while(out.length<4){const m=makeMonster(zone,Math.floor(r2()*7),plvl,cf,diff);if(!weak(m)||used+cost(m)>budget)break;used+=cost(m);out.push(m);}}}}
 return out;}
// Jeremy t1850u: one derived-seed room roll; keep the hallway roster RNG untouched.
function roomEncounter(zone,plvl,cf,diff,seed){const profile=Math.floor(rng((seed^0x72f34a15)>>>0)()*3),hpMul=profile===1?1:2,atkMul=profile===0?1:1.5;
 return encounter(zone,plvl,cf,diff,seed).map(m=>Object.assign(m,{hp:m.hp*hpMul,max:m.max*hpMul,atk:m.atk*atkMul,room:true,roomProfile:profile}));}
function loot(zone,seed){const r=rng(seed^0x5bd1e995),gold=Math.round((4+r()*8)*ZONE_MUL[zone]*zone),J=["j_tooth","j_bone","j_scale","j_horn","j_gem"],junk=[];if(r()<0.6)junk.push(J[Math.min(4,Math.floor(r()*2)+zone-1)]);return {gold,junk};}
// one hit: attacker power vs defender defense, +-15% spread
function hit(pw,def,r){return Math.max(1,Math.round((pw-def*0.5)*(0.85+0.3*r)));}
// --- fight engine (used by the screen and by tests) ---
function Fight(party,mons,diff,seed){this.p=party;this.m=mons;this.d=DIFF[diff]||DIFF.normal;this.r=rng(seed);this.guard=new Set();this.log=[];this.over=null;this.turn=0;}
Fight.prototype.alive=function(a){return a.filter(x=>x.hp>0);};
Fight.prototype.act=function(ci,cmd,arg,targ){ // one hero action. returns text
 const c=this.p[ci],r=this.r;if(this.over||!c||c.hp<=0)return "";let t="";const foes=this.alive(this.m);const tg=foes.includes(this.m[targ])?this.m[targ]:foes[0];
 if(cmd==="attack"){const dmg=hit(power(c),tg.def,r());tg.hp=Math.max(0,tg.hp-dmg);t=c.name+" hits "+tg.n+" for "+dmg;}
 else if(cmd==="skill"){const s=SKILLS[c.cls].find(x=>x.id===arg);if(!s||!c.skills.includes(arg)||c.mp<s.mp)return this.act(ci,"attack",null,targ);c.mp-=s.mp;
  if(s.k==="heal"){const w=this.alive(this.p).sort((a,b)=>a.hp/maxHp(a,this.d.hp)-b.hp/maxHp(b,this.d.hp))[0],h=Math.round(magicPower(c)*s.p);w.hp=Math.min(maxHp(w,this.d.hp),w.hp+h);t=c.name+" casts "+s.n+": +"+h;}
  else if(s.k==="guard"){this.p.forEach((x,i)=>this.guard.add(i));t=c.name+" uses "+s.n;}
  else{const list=s.all?foes:[tg],pw=(s.k==="magic"?magicPower(c):power(c))*s.p;let tot=0;list.forEach(f=>{const d=hit(pw,f.def,r());f.hp=Math.max(0,f.hp-d);tot+=d;});t=c.name+" uses "+s.n+" for "+tot;}}
 else if(cmd==="item"){const id=arg,k=c.bag.indexOf(id),it=ITEMS[id];if(it&&it.revive){const tg=this.p[targ];if(k<0||!tg||tg.hp>0)return "";c.bag.splice(k,1);tg.hp=Math.max(1,Math.round(maxHp(tg,this.d.hp)*it.revive));t=c.name+" uses "+it.n+": "+tg.name+" is back up!";}else{const who=this.p[targ!=null&&this.p[targ]&&this.p[targ].hp>0?targ:ci];if(k<0||!it||it.slot!=="use")return "";c.bag.splice(k,1);
  if(it.heal){const h=Math.round(maxHp(who,this.d.hp)*it.heal);who.hp=Math.min(maxHp(who,this.d.hp),who.hp+h);t=c.name+" uses "+it.n+": +"+h;}else{who.mp=maxMp(who);t=c.name+" uses "+it.n;}}}
 else if(cmd==="defend"){this.guard.add(ci);t=c.name+" defends";}
 else if(cmd==="run"){if(this.m.some(x=>x.boss)){t="Can't run!";}else if(r()<0.6){this.over="ran";t="The party ran away";}else t="Couldn't get away";}
 this.log.push(t);this.check();return t;};
Fight.prototype.monstersTurn=function(){this.motionHits=[];if(this.over)return [];const out=[];
 for(const m of this.alive(this.m)){const tg=this.alive(this.p);if(!tg.length)break;
  // A visible wind-up precedes every third round's party-wide sweep. Defend halves it.
  const pulse=m.boss&&this.turn%3===2,targets=pulse?tg:[tg[Math.floor(this.r()*tg.length)]];
  for(const c of targets){const ci=this.p.indexOf(c);let dmg=hit(m.atk*(pulse?.72:1),defense(c)*(1-(m.pierce||0)),this.r());if(this.guard.has(ci))dmg=Math.max(1,Math.round(dmg/2));c.hp=Math.max(0,c.hp-dmg);this.motionHits.push({i:this.m.indexOf(m),hero:ci,pulse,dmg});out.push(m.n+(pulse?" sweeps ":" hits ")+c.name+" for "+dmg);}
  if(m.boss&&this.turn%3===1)out.push("The Golem raises both fists. A sweeping blow is coming — Defend!");}
 this.guard.clear();this.turn++;this.log.push(...out);this.check();return out;};
Fight.prototype.check=function(){if(this.over)return;if(!this.alive(this.m).length)this.over="win";else if(!this.alive(this.p).length)this.over="lose";};
Fight.prototype.rewards=function(seed){const xp=this.m.reduce((t,m)=>t+Math.round((6+m.lvl*4*ZONE_MUL[m.zone])*(m.room?2:1)),0),l=loot(this.m[0].zone,seed);return {xp,gold:l.gold,junk:l.junk};};
// simple auto play (tests): every hero attacks the first foe, or uses its first attack skill when it has mana
function simulate(party,mons,diff,seed,maxTurns){const f=new Fight(party,mons,diff,seed);for(let t=0;t<(maxTurns||200)&&!f.over;t++){
 party.forEach((c,i)=>{if(f.over||c.hp<=0)return;const s=c.skills.map(id=>SKILLS[c.cls].find(x=>x.id===id)).find(s=>s.k!=="guard"&&s.k!=="heal"&&c.mp>=s.mp);f.act(i,s?"skill":"attack",s&&s.id,0);});f.monstersTurn();}
 return f;}
// save points: only camps and taverns
function isSavePoint(M,x,y){return M.camps.some(c=>c[0]===x&&c[1]===y)||M.taverns.some(c=>c[0]===x&&c[1]===y);}
// Stage 6: companions join at taverns 2, 3, 4 (index 1..3): cat girl (quirky), elf (scholar), dwarf (angry).
// The companion who shares the hero's race is human instead. Classes are rolled from the hero's build so the party covers melee, magic, range and stealth.
const COMPANIONS=[{tavern:0,role:"quirky",name:"Mira",race:"cat",cls:"rogue",note:"The quirky one: bored, a trouble maker, wants adventure",alloc:{sta:3},skill:"stab"},
 {tavern:1,role:"scholar",name:"Sorrel",race:"elf",cls:"mage",note:"The scholar: just wants to know what is going on",alloc:{man:3},skill:"mend"},
 {tavern:3,role:"angry",name:"Brunn",race:"dwarf",cls:"warrior",note:"The angry one: joins to save the world when the tavern is too scared",alloc:{str:3},skill:"cleave"}];
const ROLE_CLS={melee:"warrior",magic:"mage",range:"archer",stealth:"rogue"};
const START_KIT={warrior:{alloc:{str:3},skill:"cleave"},rogue:{alloc:{sta:3},skill:"stab"},archer:{alloc:{sta:3},skill:"aimed"},mage:{alloc:{man:3},skill:"mend"}};
function companionRace(def,heroRace){return def.race===heroRace?"human":def.race;}
// every assignment of the 3 missing classes that the races allow; pick one with the seed (random but repeatable for a save)
function planParty(hero,seed){const races=COMPANIONS.map(d=>companionRace(d,hero.race)),all=Object.keys(CLASSES),miss=all.filter(c=>c!==hero.cls),ok=[];
 const perm=(a,pre)=>{if(!a.length){if(pre.every((c,i)=>allowed(races[i],c)))ok.push(pre);return;}a.forEach((x,i)=>perm(a.slice(0,i).concat(a.slice(i+1)),pre.concat([x])));};perm(miss,[]);
 let pick=ok.length?ok[((seed>>>0)%ok.length)]:COMPANIONS.map((d,i)=>RACES[races[i]].classes[0]);
 return COMPANIONS.map((d,i)=>Object.assign({},d,{race:races[i],cls:pick[i],alloc:START_KIT[pick[i]].alloc,skill:START_KIT[pick[i]].skill}));}
function companionFor(tIdx,party,plan){const nx=(plan||COMPANIONS)[party.length-1];return nx&&nx.tavern===tIdx?nx:null;}
function makeCompanion(def,lvl){const c=newChar(def.name,def.race,def.cls,def.alloc,def.skill);while(c.lvl<lvl){c.lvl++;}c.hp=maxHp(c,1);c.mp=maxMp(c);c.companion=true;c.role=def.role;
 const kit={rogue:["dagger","leather"],mage:["staff","robe"],warrior:["sword","cap"],archer:["bow","leather"]}[def.cls];kit.forEach(id=>{c.bag.push(id);if(canEquip(c,id,ITEMS[id].slot))equip(c,id,ITEMS[id].slot);});return c;}
const RPG={CAP,START_POINTS,cost,spendCost,CLASSES,RACES,allowed,armorCap,SKILLS,skillSlots,pointsEarned,xpNeed,newChar,raise,maxHp,maxMp,power,magicPower,defense,carryLimit,bagWeight,canCarry,gainXp,learn,
 ITEMS,CHEST_GEAR,CHEST_JEWELS,treasure,SLOTS,canEquip,equip,unequip,MONSTERS,ZONE_MUL,ZONE_MINLVL,ROLES,BOSS,makeBoss,DIFF,partyLevel,centreFactor,monsterLevel,makeMonster,rng,encounter,roomEncounter,loot,hit,Fight,simulate,isSavePoint,COMPANIONS,companionFor,makeCompanion,planParty,companionRace,START_KIT};
if(typeof module!=="undefined"&&module.exports)module.exports=RPG;else root.RPG=RPG;
})(typeof window!=="undefined"?window:this);
