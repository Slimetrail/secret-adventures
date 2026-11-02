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
function xpNeed(level){return level>=CAP?Infinity:Math.round(14*level*level+16*level);}
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
function power(c){const m=CLASSES[c.cls].main,s=c.stats;return (m==="str"?2.2*s.str:m==="sta"?2.2*s.sta+0.5*s.str:0.8*s.str+0.6*s.sta)+c.lvl*1.5+gearSum(c,"atk")+4;}
function magicPower(c){return 2.6*c.stats.man+c.lvl*1.8+gearSum(c,"mag")+4;}
function defense(c){return gearSum(c,"def")+c.stats.sta*0.6+c.lvl*0.8;}
function carryLimit(c){return Math.round((12+3*c.stats.str)*RACES[c.race].carry);}
function bagWeight(c){return c.bag.reduce((t,id)=>t+((ITEMS[id]&&ITEMS[id].w)||0),0);}
function canCarry(c,id){return bagWeight(c)+ITEMS[id].w<=carryLimit(c);}
function gainXp(c,n,hpMul){const gained=[];if(c.lvl>=CAP)return gained;c.xp+=n;
 while(c.lvl<CAP&&c.xp>=xpNeed(c.lvl)){c.xp-=xpNeed(c.lvl);c.lvl++;gained.push(c.lvl);}
 if(c.lvl>=CAP)c.xp=0;c.hp=Math.min(maxHp(c,hpMul),c.hp+Math.round(maxHp(c,hpMul)*0.3));c.mp=maxMp(c);return gained;}
function learn(c,id){if(c.skills.length>=skillSlots(c.lvl))return false;const s=SKILLS[c.cls].find(x=>x.id===id);if(!s||c.skills.includes(id))return false;c.skills.push(id);return true;}
// items: slot, w weight (kg), a armor class 1-3, t weapon type, stats; junk has v value; potions use
const ITEMS={
 potion:{n:"Healing potion",slot:"use",w:0.5,heal:0.45,v:8},ether:{n:"Mana potion",slot:"use",w:0.5,mana:0.5,v:10},
 sword:{n:"Iron sword",slot:"weapon",t:"sword",w:4,atk:6},axe:{n:"Hand axe",slot:"weapon",t:"axe",w:5,atk:7},mace:{n:"Mace",slot:"weapon",t:"mace",w:5,atk:6},
 dagger:{n:"Dagger",slot:"weapon",t:"dagger",w:1,atk:4},bow:{n:"Short bow",slot:"weapon",t:"bow",w:2,atk:5},staff:{n:"Oak staff",slot:"weapon",t:"staff",w:2,atk:2,mag:5},
 buckler:{n:"Buckler",slot:"offhand",a:2,w:3,def:2},towershield:{n:"Tower shield",slot:"offhand",a:3,w:8,def:5},tome:{n:"Rune tome",slot:"offhand",a:1,w:1,mag:3},
 cap:{n:"Cloth hood",slot:"helmet",a:1,w:0.5,def:1},helm:{n:"Steel helm",slot:"helmet",a:3,w:3,def:3},
 robe:{n:"Silk robe",slot:"chest",a:1,w:1,def:1,mag:2},leather:{n:"Leather vest",slot:"chest",a:2,w:4,def:3},plate:{n:"Plate armor",slot:"chest",a:3,w:12,def:7},
 wraps:{n:"Cloth wraps",slot:"gloves",a:1,w:0.3,def:1},gauntlets:{n:"Gauntlets",slot:"gloves",a:3,w:2,def:2},
 sandals:{n:"Soft boots",slot:"boots",a:1,w:0.5,def:1},greaves:{n:"Iron boots",slot:"boots",a:3,w:3,def:2},
 ring:{n:"Moon ring",slot:"acc",w:0.1,mag:2,hp:5},amulet:{n:"Ember amulet",slot:"acc",w:0.2,atk:2,hp:5},
 j_tooth:{n:"Old tooth",slot:"junk",w:0.2,v:2},j_bone:{n:"Cracked bone",slot:"junk",w:0.5,v:3},j_scale:{n:"Dull scale",slot:"junk",w:0.3,v:6},j_horn:{n:"Chipped horn",slot:"junk",w:1,v:10},j_gem:{n:"Cloudy gem",slot:"junk",w:0.1,v:18}};
const SLOTS=["weapon","offhand","helmet","chest","gloves","boots","acc1","acc2"];
function canEquip(c,id,slot){const it=ITEMS[id];if(!it)return false;const want=slot.startsWith("acc")?"acc":slot;if(it.slot!==want)return false;
 if(it.a&&it.a>armorCap(c))return false;
 if(it.t){const R=RACES[c.race];if(!CLASSES[c.cls].weapons.includes(it.t)&&!R.anyWeapon)return false;if(it.t==="staff"&&!CLASSES[c.cls].magic)return false;}
 if(slot==="offhand"&&c.equip.weapon==="bow")return false;
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
const BOSS={n:"Iron Golem",placeholder:true};
const DIFF={story:{hp:2,matk:0.5,name:"Story"},normal:{hp:1,matk:1,name:"Normal"},hard:{hp:1,matk:1.5,name:"Hard"}};
function partyLevel(party){return Math.round(party.reduce((t,c)=>t+c.lvl,0)/party.length);}
// centre factor: 0 at the edge of the maze, 1 at the centre (cell distance from centre / half size)
function centreFactor(x,y,n){const h=(n-1)/2;return Math.max(0,1-Math.max(Math.abs(x-h),Math.abs(y-h))/h);}
function monsterLevel(zone,plvl,cf){return Math.min(CAP+5,Math.max(ZONE_MINLVL[zone],plvl)+Math.round(3*(cf||0)));}
function makeMonster(zone,idx,plvl,cf,diff){const L=monsterLevel(zone,plvl,cf),m=ZONE_MUL[zone],d=DIFF[diff]||DIFF.normal,nm=MONSTERS[zone][idx%7];
 const hp=Math.round((16+9*L)*m*(1+0.06*(idx%7)));return {n:nm,zone,kind:idx%7,lvl:L,hp,max:hp,atk:Math.round((5+2.1*L)*m*d.matk*10)/10,def:Math.round(L*0.7*m),boss:false};}
function rng(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function encounter(zone,plvl,cf,diff,seed){const r=rng(seed),k=1+Math.floor(r()*3),out=[];for(let i=0;i<k;i++)out.push(makeMonster(zone,Math.floor(r()*7),plvl,cf,diff));return out;}
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
 else if(cmd==="item"){const id=arg,k=c.bag.indexOf(id),it=ITEMS[id];const who=this.p[targ!=null&&this.p[targ]&&this.p[targ].hp>0?targ:ci];if(k<0||!it||it.slot!=="use")return "";c.bag.splice(k,1);
  if(it.heal){const h=Math.round(maxHp(who,this.d.hp)*it.heal);who.hp=Math.min(maxHp(who,this.d.hp),who.hp+h);t=c.name+" uses "+it.n+": +"+h;}else{who.mp=maxMp(who);t=c.name+" uses "+it.n;}}
 else if(cmd==="defend"){this.guard.add(ci);t=c.name+" defends";}
 else if(cmd==="run"){if(this.m.some(x=>x.boss)){t="Can't run!";}else if(r()<0.6){this.over="ran";t="The party ran away";}else t="Couldn't get away";}
 this.log.push(t);this.check();return t;};
Fight.prototype.monstersTurn=function(){if(this.over)return [];const out=[];
 for(const m of this.alive(this.m)){const tg=this.alive(this.p);if(!tg.length)break;const c=tg[Math.floor(this.r()*tg.length)],ci=this.p.indexOf(c);
  let dmg=hit(m.atk,defense(c),this.r());if(this.guard.has(ci))dmg=Math.max(1,Math.round(dmg/2));c.hp=Math.max(0,c.hp-dmg);out.push(m.n+" hits "+c.name+" for "+dmg);}
 this.guard.clear();this.turn++;this.log.push(...out);this.check();return out;};
Fight.prototype.check=function(){if(this.over)return;if(!this.alive(this.m).length)this.over="win";else if(!this.alive(this.p).length)this.over="lose";};
Fight.prototype.rewards=function(seed){const xp=this.m.reduce((t,m)=>t+Math.round(6+m.lvl*4*ZONE_MUL[m.zone]),0),l=loot(this.m[0].zone,seed);return {xp,gold:l.gold,junk:l.junk};};
// simple auto play (tests): every hero attacks the first foe, or uses its first attack skill when it has mana
function simulate(party,mons,diff,seed,maxTurns){const f=new Fight(party,mons,diff,seed);for(let t=0;t<(maxTurns||200)&&!f.over;t++){
 party.forEach((c,i)=>{if(f.over||c.hp<=0)return;const s=c.skills.map(id=>SKILLS[c.cls].find(x=>x.id===id)).find(s=>s.k!=="guard"&&s.k!=="heal"&&c.mp>=s.mp);f.act(i,s?"skill":"attack",s&&s.id,0);});f.monstersTurn();}
 return f;}
// save points: only camps and taverns
function isSavePoint(M,x,y){return M.camps.some(c=>c[0]===x&&c[1]===y)||M.taverns.some(c=>c[0]===x&&c[1]===y);}
// companions join at taverns 2, 3, 4 in story order (simple placeholders)
const COMPANIONS=[{tavern:1,name:"Pip",race:"human",cls:"rogue",note:"Companion 1, the quirky one (placeholder)",alloc:{sta:5},skill:"stab"},
 {tavern:2,name:"Orla",race:"elf",cls:"mage",note:"Companion 2, the scholar (placeholder)",alloc:{man:4},skill:"mend"},
 {tavern:3,name:"Kira",race:"cat",cls:"warrior",note:"Companion 3, the angry girl (placeholder)",alloc:{str:5},skill:"cleave"}];
function companionFor(tIdx,party){const nx=COMPANIONS[party.length-1];return nx&&nx.tavern===tIdx?nx:null;}
function makeCompanion(def,lvl){const c=newChar(def.name,def.race,def.cls,def.alloc,def.skill);while(c.lvl<lvl){c.lvl++;}c.hp=maxHp(c,1);c.mp=maxMp(c);c.companion=true;
 const kit={rogue:["dagger","leather"],mage:["staff","robe"],warrior:["sword","cap"]}[def.cls];kit.forEach(id=>{c.bag.push(id);equip(c,id,ITEMS[id].slot);});return c;}
const RPG={CAP,START_POINTS,cost,spendCost,CLASSES,RACES,allowed,armorCap,SKILLS,skillSlots,pointsEarned,xpNeed,newChar,raise,maxHp,maxMp,power,magicPower,defense,carryLimit,bagWeight,canCarry,gainXp,learn,
 ITEMS,SLOTS,canEquip,equip,unequip,MONSTERS,ZONE_MUL,ZONE_MINLVL,BOSS,DIFF,partyLevel,centreFactor,monsterLevel,makeMonster,rng,encounter,loot,hit,Fight,simulate,isSavePoint,COMPANIONS,companionFor,makeCompanion};
if(typeof module!=="undefined"&&module.exports)module.exports=RPG;else root.RPG=RPG;
})(typeof window!=="undefined"?window:this);
