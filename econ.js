/* Secret of the Adventure - Stage 5: economy and cooking rules (pure data + rules, no screen code).
   Private build. No ads, no network. Adds items to window.RPG.ITEMS and exposes window.ECON. */
(function(){
"use strict";
const R=window.RPG,I=R.ITEMS;
// ---- raw ingredients (never spoil). tier = first tavern (1-4) that sells it; 0 = only from monsters ----
const ING={bread:["Bread",1],butter:["Butter",1],herbs:["Herbs",1],water:["Clean water",1],berries:["Berries",1],honey:["Honey",1],egg:["Egg",1],mushroom:["Mushroom",1],salt:["Salt",1],
 roots:["Roots",2],sage:["Sage",2],meat:["Meat",2],pepper:["Pepper",2],fish:["Fish",2],flour:["Flour",2],oats:["Oats",2],milk:["Milk",2],spice:["Spice",2],
 moonleaf:["Moonleaf",3],fowl:["Fowl",3],ironflour:["Ironbark flour",3],firepepper:["Fire pepper",3],beans:["Beans",3],seaweed:["Seaweed",3],lemon:["Lemon",3],cream:["Cream",3],cheese:["Cheese",3],
 starfruit:["Starfruit",4],griffinegg:["Griffin egg",0],hydrascale:["Hydra scale",0],dragonmeat:["Dragon meat",0]};
const TIERP=[0,3,6,12,20];
for(const k in ING){const[n,t]=ING[k];I["i_"+k]={n,slot:"ing",w:0.3,v:Math.max(1,Math.floor((TIERP[t]||16)/2)),tier:t};}
// ---- 20 dishes (design sheet section 7; samples). hp/mp % refill now; str/sta % buff for "f" fights ----
const DISHES=[
 ["toast","Toasted bread",["bread","butter"],{hp:10},1],["broth","Herb broth",["herbs","water"],{mp:15},1],["mash","Berry mash",["berries","honey"],{sta:15,f:1},1],
 ["egg","Fried egg",["egg","butter"],{str:5,f:1},1],["skewer","Mushroom skewer",["mushroom","salt"],{hp:20},1],
 ["stew","Root stew",["roots","water","salt"],{hp:25},2],["tea","Sage tea",["sage","honey"],{mp:30},2],["jerky","Hunter's jerky",["meat","salt","pepper"],{sta:30,f:3},2],
 ["pie","Fish pie",["fish","flour","butter"],{str:10,f:3},2],["porridge","Spiced porridge",["oats","milk","spice"],{hp:15,sta:15,f:3},2],["moon","Moon soup",["moonleaf","mushroom","water"],{mp:45},2],
 ["fowl","Roast fowl",["fowl","herbs","salt"],{hp:40},2],
 ["ironbread","Ironbark bread",["ironflour","egg","honey"],{str:15,f:5},3],["chili","Fire pepper chili",["firepepper","meat","beans"],{sta:50,f:3},3],["seafeast","Sea feast",["fish","seaweed","lemon"],{hp:50},3],
 ["tart","Starfruit tart",["starfruit","flour","cream"],{mp:100},3],["omelette","Griffin egg omelette",["griffinegg","herbs","cheese"],{str:20,hp:25,f:3},3],
 ["hydra","Hydra broth",["hydrascale","roots","spice"],{sta:100,str:10,f:3},4],["steak","Dragon steak",["dragonmeat","firepepper","salt"],{str:30,f:5},4],
 ["banquet","Crystal banquet",["starfruit","dragonmeat","moonleaf","honey"],{hp:100,mp:100,sta:100,str:20,f:3},4]].map(([id,n,ing,fx,tier])=>({id,n,ing,fx,tier}));
const TIERN=["","Weak","Medium","Strong","Very strong"],RECIPE_PRICE=[0,20,45,80,140],SPOIL_STEPS=400;
DISHES.forEach(d=>{I["d_"+d.id]={n:d.n,slot:"dish",w:0.8,v:4*d.tier,dish:d.id};});
function fxText(fx){const o=[];if(fx.hp)o.push(fx.hp>=100?"full health":"+"+fx.hp+"% health");if(fx.mp)o.push(fx.mp>=100?"full mana":"+"+fx.mp+"% mana");if(fx.sta)o.push(fx.sta>=100?"full stamina":"+"+fx.sta+"% stamina");if(fx.str)o.push("+"+fx.str+"% strength");return o.join(", ")+(fx.str||fx.sta?" (until the next meal)":"");}/* t2778u: dish buffs last until the next meal or a tavern */
const key=a=>a.slice().sort().join("+");const BYKEY={};DISHES.forEach(d=>BYKEY[key(d.ing)]=d);
// cook: ingredient ids (without i_) -> dish or null. Same set in any order.
function cook(ings){return BYKEY[key(ings)]||null;}
// ---- monster parts: junk to sell, or crafting parts. Some only drop in certain zones ----
const PARTS={p_silk:["Spider silk",1,[1],4],p_shell:["Bug shell",1,[1],3],p_shard:["Bone shard",1,[1,2,3],3],p_hide:["Boar hide",1,[2],6],p_ear:["Goblin ear",1,[2],5],
 p_pelt:["Wolf pelt",1,[3],12],p_fang:["Ghoul fang",1,[3],10],p_feather:["Griffin feather",1,[4],22],p_horn:["Minotaur horn",1,[4],25],p_dscale:["Drake scale",1,[5],40],p_claw:["Chimera claw",1,[5],36]};
for(const k in PARTS){const[n,,z,v]=PARTS[k];I[k]={n,slot:"part",w:0.2,v,zones:z};}
// food that monsters drop, per zone
const FOOD={1:["mushroom","roots","berries"],2:["herbs","egg","meat"],3:["fowl","sage","fish"],4:["griffinegg","firepepper","moonleaf"],5:["hydrascale","dragonmeat","starfruit"]};
// gear, rations, tent, dead-warrior gear (worse than new)
Object.assign(I,{ration:{n:"Ration",slot:"use",w:0.4,heal:0.15,camp:true,v:2},lockpick:{n:"Lockpicks",slot:"gear",w:0.1,v:6},rope:{n:"Rope",slot:"gear",w:1,v:4},
 tent:{n:"Tent",slot:"gear",w:0,v:8,tent:true}, // t2350u: was v:30; a 2-part tent (silk 4 + hide 6 = 10 gold of parts) must not sell for profit
 w_sword:{n:"Worn sword",slot:"weapon",t:"sword",w:4,atk:5,worn:true},w_dagger:{n:"Nicked dagger",slot:"weapon",t:"dagger",w:1,atk:3,worn:true},w_bow:{n:"Cracked bow",slot:"weapon",t:"bow",w:2,atk:4,worn:true},
 w_staff:{n:"Scorched staff",slot:"weapon",t:"staff",w:2,atk:2,mag:4,worn:true},w_leather:{n:"Patched vest",slot:"chest",a:2,w:4,def:2,worn:true},w_helm:{n:"Dented helm",slot:"helmet",a:3,w:3,def:2,worn:true},
 w_buckler:{n:"Split buckler",slot:"offhand",a:2,w:3,def:1,worn:true}});
// ---- prices ----
const PRICE={ration:4,potion:20,ether:25,salts:30,lockpick:15,rope:10,tent:100,w_sword:40,w_dagger:20,w_bow:35,w_staff:35,w_leather:35,w_helm:40,w_buckler:25,p_silk:30,p_hide:40,p_shard:15};
for(const k in ING)PRICE["i_"+k]=TIERP[ING[k][1]]||0;
// t2759u special class gear (gear.js): slot "gear", hero-only, used up on use. The buy price depends on the zone (SOTA_GEAR.price);
// PRICE here is only the zone 1 price, so it sells for half of that anywhere (no buy-low, sell-high loop between zones).
const GEAR=(typeof window!=="undefined"&&window.SOTA_GEAR)||null;
if(GEAR)GEAR.IDS.forEach(id=>{const g=GEAR.ITEMS[id];I[id]={n:g.n,slot:"gear",w:g.w,v:Math.floor(GEAR.price(1)/2),special:true,cls:g.cls,stat:g.stat};PRICE[id]=GEAR.price(1);});
function gearPrice(id,zone){return GEAR&&GEAR.ITEMS[id]?GEAR.price(zone):price(id);}
function price(id){return PRICE[id]||0;}
function sellPrice(id){const it=I[id];if(!it)return 0;if(it.tent||it.slot==="junk"||it.slot==="part"||it.slot==="dish"||it.slot==="ing")return it.v||0;return Math.max(1,Math.floor((PRICE[id]||it.v||(it.atk||it.def||it.mag?16:2))/2));}
// ---- tavern shops (index 0-3 = Tavern 1-4). Taverns 3 and 4 also sell tent parts ----
const KEEPERS=[{name:"Brannoc",look:"dwarf",tag:"Stout dwarf, braided beard"},{name:"Wynn",look:"human",tag:"Blond human, quick smile"},{name:"Sylvaine",look:"elf",tag:"Silver-haired elf, calm"},{name:"Miso",look:"cat",tag:"White-haired cat-folk, sharp eyes"}];
function stock(t){const s=["ration","potion","ether","tent"];/* t2793u: plain lockpick/rope kept in I/PRICE for old saves, not sold */
 const gear=[["w_dagger","w_sword","w_buckler"],["w_bow","w_staff","w_leather"],["w_sword","w_helm","w_leather","w_bow"],["w_sword","w_helm","w_leather","w_staff","w_buckler"]][t];
 const ing=Object.keys(ING).filter(k=>ING[k][1]>=1&&ING[k][1]<=t+1).map(k=>"i_"+k);
 const parts=t>=2?["p_silk","p_hide","p_shard"]:[];return {basic:s,gear,ing,parts};}
function recipesFor(t){return DISHES.filter(d=>d.tier<=Math.min(4,t+1)&&d.ing.every(x=>ING[x][1]>0)).map(d=>d.id);}
// ---- tent: very costly to buy, much cheaper to build from parts. Lasts TENT_NIGHTS camps ----
// t2350u: a tent is a weak 2-box craft from zone 1-2 parts: 1 spider silk (zone 1) + 1 boar hide (zone 2). Was silk 4, hide 3, shard 2.
// t2356u/t2357u (Jeremy): each tent is good for ONE camp save (was 5 nights). Re-saving on the same camp spot uses no tent.
const TENT={buy:100,fee:10,parts:{p_silk:1,p_hide:1},nights:1};
// ---- Jeremy t2342u/t2345u/t2347u/t2350u: camp crafting by trial and error. 4 boxes, ONE item per box; a recipe is an exact
// set of single items (same item twice = two boxes), any order. Box count sets strength: 2 weak, 3 medium, 4 strong.
// Any later 3-box recipe needs a material first found in zone 3+, a 4-box recipe a zone 5 material (see firstZone); Smelling salts and
// Hunter's jerky are kept as they were (exception:true). Tent = TENT.parts. The zone rule only limits crafting, never shop stock. ----
// crafted potions and food (slot "use", like rations and potions): heal/mp = share of max refilled, buff = % for f fights
// t2362u step 1 (zones 1-2): the medium (zone 3) and strong (zone 5) crafts were held in econ-held-crafts.js, which is NOT loaded.
// Step 2 (zone 3) ships the medium ones below; the strong ones stay held for step 4 (zone 5).
const CRAFTS=[{id:"potion",n:"Healing potion",kind:"potion",out:"potion",need:{i_herbs:1,p_shell:1}},
 {id:"ether",n:"Mana potion",kind:"potion",out:"ether",need:{i_berries:1,p_shard:1}},
 {id:"ration",n:"Trail ration",kind:"food",out:"ration",need:{i_meat:1,i_roots:1}},
 // t2351u: these two stay exactly as before t2350u (named exceptions to the zone/strength rule)
 {id:"salts",n:"Smelling salts",kind:"potion",out:"salts",need:{i_salt:1,i_herbs:1,p_ear:1},exception:true},
 {id:"jerky",n:"Hunter's jerky",kind:"food",out:"d_jerky",need:{i_meat:1,i_salt:1,i_pepper:1,p_hide:1},exception:true},
 {id:"tent",n:"Tent",kind:"tent",out:"tent",need:Object.assign({},TENT.parts)},
 // t2362u step 2 (zone 3): the two medium 3-box crafts move here from econ-held-crafts.js, unchanged. Each needs a material first
 // had in zone 3: Moon elixir's moonleaf (first sold at Tavern 3; ghoul fang drops in zone 3), Hunter's stew's fowl and wolf pelt (zone 3 drops).
 {id:"elixir",n:"Moon elixir",kind:"potion",out:"c_elixir",need:{i_herbs:1,i_moonleaf:1,p_fang:1}},
 {id:"stew",n:"Hunter's stew",kind:"food",out:"c_stew",need:{i_meat:1,i_fowl:1,p_pelt:1}}];
Object.assign(I,{c_elixir:{n:"Moon elixir",slot:"use",w:0/* t2734u: a potion, weighs nothing (was 0.5) */,v:30,heal:0.6,mp:0.6,craft:true},c_stew:{n:"Hunter's stew",slot:"use",w:0.6,v:25,heal:0.35,buff:{str:0,sta:25,f:3},craft:true}});
const STRENGTH={2:"Weak",3:"Medium",4:"Strong"};
// first zone a material can be had: monster drops (PARTS zones, FOOD per zone) or a tavern shop (Tavern t+1 sits at the end of zone t+1)
function firstZone(id){const z=[];if(PARTS[id])z.push(...PARTS[id][2]);const k=id.startsWith("i_")?id.slice(2):null;
 if(k&&ING[k]){if(ING[k][1]>0)z.push(ING[k][1]);for(const zz in FOOD)if(FOOD[zz].includes(k))z.push(+zz);}
 for(let t=0;t<4;t++){const st=stock(t);if(st.parts.includes(id)||st.ing.includes(id))z.push(t+1);}return z.length?Math.min(...z):99;}
function craftZone(cr){return Math.max(...Object.keys(cr.need).map(firstZone));}
function craftSize(cr){return Object.values(cr.need).reduce((a,b)=>a+b,0);}
// effect size in % points, to check that more boxes always means a stronger item (legacy mana potion = full MP = 100)
function useScore(id){const it=I[id];if(!it)return 0;const b=it.buff||{};return 100*(it.heal||0)+100*(it.mp||0)+100*(it.revive||0)+(b.str||0)+(b.sta||0)+(!it.heal&&!it.mp&&!it.buff&&!it.revive?100:0);}
function useText(id){const it=I[id];if(!it)return "";const o=[];if(it.heal)o.push(it.heal>=1?"full health":"+"+Math.round(it.heal*100)+"% health");if(it.mp)o.push(it.mp>=1?"full mana":"+"+Math.round(it.mp*100)+"% mana");
 if(it.revive)o.push("in battle only: wakes a knocked-out ally at "+Math.round(it.revive*100)+"% health");if(!it.heal&&!it.mp&&!it.buff&&!it.revive)o.push("full mana");
 const b=it.buff;if(b){if(b.str)o.push("+"+b.str+"% strength");if(b.sta)o.push("+"+b.sta+"% stamina");}return o.join(", ")+(b?" ("+b.f+" fights)":"");}
const CRAFT_BOXES=4;
function countOf(ids){const m={};ids.forEach(id=>m[id]=(m[id]||0)+1);return m;}
function needList(need){return Object.entries(need).flatMap(([id,n])=>Array(n).fill(id));}
function mixKey(ids){return ids.slice().sort().join("+");}
function craftMatch(ids){const m=countOf(ids),k=Object.keys(m);return CRAFTS.find(c=>{const n=Object.keys(c.need);return n.length===k.length&&n.every(id=>m[id]===c.need[id]);})||null;}
// A wrong mix always gives the same result for the same items (FNV-1a hash of the sorted mix), never a slot machine.
// Bad-but-useful results go in the backpack and do nothing until used; "useless" adds nothing.
const FAILS=["poison","stink","badhp","badmp","badsta","useless"];
function hashKey(k){let h=2166136261;for(let i=0;i<k.length;i++){h^=k.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function craftFail(ids){return FAILS[hashKey(mixKey(ids))%FAILS.length];}
const FAIL_ITEM={poison:"x_poison",stink:"x_stink",badhp:"x_badhp",badmp:"x_badmp",badsta:"x_badsta"};
const FAIL_STINK_STEPS=40,POISON_FIGHTS=3,POISON_BONUS=0.3,BAD_HP=15,BAD_MP=25,BAD_STA=20,BAD_STA_FIGHTS=2;
Object.assign(I,{x_poison:{n:"Weapon poison",slot:"craft",w:0.3,v:3,poison:true},x_stink:{n:"Stinky stew",slot:"craft",w:0.3,v:1,food:true,stink:true},
 x_badhp:{n:"Spoiled mush",slot:"craft",w:0.3,v:1,food:true,bad:"hp"},x_badmp:{n:"Murky brew",slot:"craft",w:0.3,v:1,food:true,bad:"mp"},x_badsta:{n:"Gristle lump",slot:"craft",w:0.3,v:1,food:true,bad:"sta"}});
function badText(id){const it=I[id];if(!it)return "";if(it.poison)return "Put on a weapon: +"+Math.round(POISON_BONUS*100)+"% damage for "+POISON_FIGHTS+" fights";if(it.stink)return "Eat it: monsters smell you and attack more for a while";
 return {hp:"Eat it: -"+BAD_HP+"% health (never knocks out)",mp:"Eat it: -"+BAD_MP+"% mana",sta:"Eat it: -"+BAD_STA+"% stamina for "+BAD_STA_FIGHTS+" fights"}[it.bad]||"";}
// ---- 8-bit result pictures (12x12, drawn as square pixels like the fight sprites; no painted art) ----
const PIXSHAPE={flask:["....cccc....","....cccc....",".....oo.....",".....oo.....","....o..o....","...orrrro...","..orrwrrro..","..orrrrrro..","..orrrrrro..","..orrrrrro..","...orrrro...","....oooo...."],
 jar:["............","...oooooo...","...occcco...","...oooooo...","..orrrrrro..","..orwrrrro..","..orrrrrro..","..orrrrrro..","..orrrrrro..","..orrrrrro..","..oooooooo..","............"],
 bowl:["............","............","....rr.r....","...rrrrrr...","..rrrwrrrr..","oooooooooooo",".occccccccco",".occccccccco","..occccccco.","...occcccoo.","....oooooo..","............"],
 stinkbowl:["..g...g..g..","...g.g..g...","..g...g..g..","...g..g.g...","..rrrrrrrr..","oooooooooooo",".occccccccco",".occccccccco","..occccccco.","...occcccoo.","....oooooo..","............"],
 tent:[".....oo.....","....orro....","....orro....","...orrrro...","...orrwro...","..orrrrrro..","..orroorrro.",".orrooo.rro.",".orroo..orro","orrroo..orro","oooooooooooo","............"],
 puff:["............","....oo......","...owwo.oo..","..owwwwowwo.","..owwwwwwwo.",".owwwwwwwwo.",".owwwwwwwwwo","..owwwwwwwo.","...oowwooo..",".....oo.....","..o.....o...","............"]};
const PIX={potion:["flask",{r:"#d83a3a"}],ether:["flask",{r:"#3a6ad8"}],salts:["jar",{r:"#e8e8f0"}],ration:["bowl",{r:"#b07a3a",c:"#7a4a24"}],jerky:["bowl",{r:"#8a3020",c:"#7a4a24"}],
 tent:["tent",{r:"#5a8a3a"}],poison:["flask",{r:"#5ad83a"}],stink:["stinkbowl",{r:"#7a8a3a",c:"#5a4a24"}],badhp:["bowl",{r:"#8a8a70",c:"#5a4a24"}],
 badmp:["flask",{r:"#6a5a4a"}],badsta:["bowl",{r:"#a08070",c:"#5a4a24"}],useless:["puff",{w:"#9a9aa2"}],
 elixir:["flask",{r:"#9a5ad8",w:"#e8d8ff"}],stew:["bowl",{r:"#c0702a",c:"#6a3a1a"}]};
const PIXBASE={o:"#20140c",c:"#a87a44",w:"#ffffff",g:"#7ad83a"};
function pixelArt(kind){const p=PIX[kind]||PIX.useless,rows=PIXSHAPE[p[0]],pal=Object.assign({},PIXBASE,p[1]);return {rows,pal};}
// crafting fee may be paid in gold, or parts/junk (at their sell value), or both
function payFee(fee,gold,offer){let left=fee;const used=[];for(const id of offer){if(left<=0)break;left-=sellPrice(id);used.push(id);}const g=Math.max(0,left);return g<=gold?{gold:g,parts:used}:null;}
// ---- drops: gold (rules.loot), plus a zone part and maybe a food item ----
function drops(zone,seed){const r=R.rng((seed^0x2c1b3c6d)>>>0),out=[];const pz=Object.keys(PARTS).filter(k=>PARTS[k][2].includes(zone));
 if(r()<0.75)out.push(pz[Math.floor(r()*pz.length)]);if(r()<0.45){const f=FOOD[zone];out.push("i_"+f[Math.floor(r()*f.length)]);}return out;}
// ---- bulk: body parts are light alone, but more than 5 parts gets heavy, 10 is very heavy ----
function partBulk(n){return Math.max(0,n-5)*0.6+Math.max(0,n-9)*1.2;}
function stacks(bag){const m=new Map();bag.forEach(id=>m.set(id,(m.get(id)||0)+1));return [...m].map(([id,n])=>({id,n}));}
window.ECON={gearPrice,GEAR,ING,DISHES,TIERN,RECIPE_PRICE,SPOIL_STEPS,fxText,cook,PARTS,FOOD,PRICE,price,sellPrice,KEEPERS,stock,recipesFor,TENT,payFee,drops,partBulk,stacks,CRAFTS,CRAFT_BOXES,STRENGTH,firstZone,craftZone,craftSize,useScore,useText,craftMatch,craftFail,countOf,needList,mixKey,FAILS,FAIL_ITEM,FAIL_STINK_STEPS,POISON_FIGHTS,POISON_BONUS,BAD_HP,BAD_MP,BAD_STA,BAD_STA_FIGHTS,badText,PIX,pixelArt,dish:id=>DISHES.find(d=>d.id===id)};
})();
