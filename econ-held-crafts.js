/* HELD - NOT LOADED. Jeremy t2362u: step 1 ships zones 1-2 only, so the medium (3-box, zone 3) and strong (4-box, zone 5)
   crafts written for t2350u are parked here. index.html and sw.js do not load this file. Step 2 (zone 3) adds the medium
   ones and step 4 (zone 5) the strong ones: load this after econ.js and call ECON_HELD.install(window.ECON, window.RPG.ITEMS, step).
   tests/t2342u_camp_craft_test.js checks these against the zone rule so they are ready when their step comes. */
(function(){"use strict";
const ITEMS={c_elixir:{n:"Moon elixir",slot:"use",w:0.5,v:30,heal:0.6,mp:0.6,craft:true},c_stew:{n:"Hunter's stew",slot:"use",w:0.6,v:25,heal:0.35,buff:{str:0,sta:25,f:3},craft:true},
 c_dragonelixir:{n:"Dragon elixir",slot:"use",w:0.5,v:120,heal:1,mp:1,buff:{str:20,sta:0,f:3},craft:true},c_roast:{n:"Dragon roast",slot:"use",w:0.8,v:90,heal:0.8,buff:{str:25,sta:25,f:3},craft:true}};
const CRAFTS=[{step:2,id:"elixir",n:"Moon elixir",kind:"potion",out:"c_elixir",need:{i_herbs:1,i_moonleaf:1,p_fang:1}},
 {step:2,id:"stew",n:"Hunter's stew",kind:"food",out:"c_stew",need:{i_meat:1,i_fowl:1,p_pelt:1}},
 {step:4,id:"dragonelixir",n:"Dragon elixir",kind:"potion",out:"c_dragonelixir",need:{i_herbs:1,i_moonleaf:1,p_fang:1,p_dscale:1}},
 {step:4,id:"roast",n:"Dragon roast",kind:"food",out:"c_roast",need:{i_dragonmeat:1,i_fowl:1,i_firepepper:1,i_salt:1}}];
const PIX={elixir:["flask",{r:"#9a5ad8",w:"#e8d8ff"}],stew:["bowl",{r:"#c0702a",c:"#6a3a1a"}],dragonelixir:["jar",{r:"#e8a020",c:"#c03020"}],roast:["bowl",{r:"#d04010",c:"#3a2a1a",w:"#ffd060"}]};
function install(E,I,step){const add=CRAFTS.filter(c=>c.step<=step&&!E.CRAFTS.some(x=>x.id===c.id));add.forEach(c=>{I[c.out]=ITEMS[c.out];E.PIX[c.id]=PIX[c.id];E.CRAFTS.push(Object.assign({},c,{need:Object.assign({},c.need)}));});return add.length;}
const api={ITEMS,CRAFTS,PIX,install};
if(typeof module!=="undefined")module.exports=api;if(typeof window!=="undefined")window.ECON_HELD=api;})();
