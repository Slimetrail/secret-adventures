/* Secret of the Adventures - Stage 5: economy and cooking rules (pure data + rules, no screen code).
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
function fxText(fx){const o=[];if(fx.hp)o.push(fx.hp>=100?"full health":"+"+fx.hp+"% health");if(fx.mp)o.push(fx.mp>=100?"full mana":"+"+fx.mp+"% mana");if(fx.sta)o.push(fx.sta>=100?"full stamina":"+"+fx.sta+"% stamina");if(fx.str)o.push("+"+fx.str+"% strength");return o.join(", ")+(fx.f&&(fx.str||fx.sta)?" ("+fx.f+" fight"+(fx.f>1?"s":"")+")":"");}
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
 tent:{n:"Tent",slot:"gear",w:0,v:30,tent:true},
 w_sword:{n:"Worn sword",slot:"weapon",t:"sword",w:4,atk:5,worn:true},w_dagger:{n:"Nicked dagger",slot:"weapon",t:"dagger",w:1,atk:3,worn:true},w_bow:{n:"Cracked bow",slot:"weapon",t:"bow",w:2,atk:4,worn:true},
 w_staff:{n:"Scorched staff",slot:"weapon",t:"staff",w:2,atk:2,mag:4,worn:true},w_leather:{n:"Patched vest",slot:"chest",a:2,w:4,def:2,worn:true},w_helm:{n:"Dented helm",slot:"helmet",a:3,w:3,def:2,worn:true},
 w_buckler:{n:"Split buckler",slot:"offhand",a:2,w:3,def:1,worn:true}});
// ---- prices ----
const PRICE={ration:4,potion:20,ether:25,lockpick:15,rope:10,tent:100,w_sword:40,w_dagger:20,w_bow:35,w_staff:35,w_leather:35,w_helm:40,w_buckler:25,p_silk:30,p_hide:40,p_shard:15};
for(const k in ING)PRICE["i_"+k]=TIERP[ING[k][1]]||0;
function price(id){return PRICE[id]||0;}
function sellPrice(id){const it=I[id];if(!it)return 0;if(it.tent||it.slot==="junk"||it.slot==="part"||it.slot==="dish"||it.slot==="ing")return it.v||0;return Math.max(1,Math.floor((PRICE[id]||it.v||(it.atk||it.def||it.mag?16:2))/2));}
// ---- tavern shops (index 0-3 = Tavern 1-4). Taverns 3 and 4 also sell tent parts ----
const KEEPERS=[{name:"Brannoc",look:"dwarf",tag:"Stout dwarf, braided beard"},{name:"Wynn",look:"human",tag:"Blond human, quick smile"},{name:"Sylvaine",look:"elf",tag:"Silver-haired elf, calm"},{name:"Miso",look:"cat",tag:"White-haired cat-folk, sharp eyes"}];
function stock(t){const s=["ration","potion","ether","lockpick","rope","tent"];
 const gear=[["w_dagger","w_sword","w_buckler"],["w_bow","w_staff","w_leather"],["w_sword","w_helm","w_leather","w_bow"],["w_sword","w_helm","w_leather","w_staff","w_buckler"]][t];
 const ing=Object.keys(ING).filter(k=>ING[k][1]>=1&&ING[k][1]<=t+1).map(k=>"i_"+k);
 const parts=t>=2?["p_silk","p_hide","p_shard"]:[];return {basic:s,gear,ing,parts};}
function recipesFor(t){return DISHES.filter(d=>d.tier<=Math.min(4,t+1)&&d.ing.every(x=>ING[x][1]>0)).map(d=>d.id);}
// ---- tent: very costly to buy, much cheaper to build from parts. Lasts TENT_NIGHTS camps ----
const TENT={buy:100,fee:10,parts:{p_silk:4,p_hide:3,p_shard:2},nights:5};
// crafting fee may be paid in gold, or parts/junk (at their sell value), or both
function payFee(fee,gold,offer){let left=fee;const used=[];for(const id of offer){if(left<=0)break;left-=sellPrice(id);used.push(id);}const g=Math.max(0,left);return g<=gold?{gold:g,parts:used}:null;}
// ---- drops: gold (rules.loot), plus a zone part and maybe a food item ----
function drops(zone,seed){const r=R.rng((seed^0x2c1b3c6d)>>>0),out=[];const pz=Object.keys(PARTS).filter(k=>PARTS[k][2].includes(zone));
 if(r()<0.75)out.push(pz[Math.floor(r()*pz.length)]);if(r()<0.45){const f=FOOD[zone];out.push("i_"+f[Math.floor(r()*f.length)]);}return out;}
// ---- bulk: body parts are light alone, but more than 5 parts gets heavy, 10 is very heavy ----
function partBulk(n){return Math.max(0,n-5)*0.6+Math.max(0,n-9)*1.2;}
function stacks(bag){const m=new Map();bag.forEach(id=>m.set(id,(m.get(id)||0)+1));return [...m].map(([id,n])=>({id,n}));}
window.ECON={ING,DISHES,TIERN,RECIPE_PRICE,SPOIL_STEPS,fxText,cook,PARTS,FOOD,PRICE,price,sellPrice,KEEPERS,stock,recipesFor,TENT,payFee,drops,partBulk,stacks,dish:id=>DISHES.find(d=>d.id===id)};
})();
