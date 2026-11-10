// t2476u: every item id in RPG.ITEMS has its own original 8-bit pixel icon (item-icons.js), no two icons are the same,
// the icons are inline SVG pixel grids (no network, no image files) and the new file is pinned in index.html and the offline cache.
"use strict";
const test=require("node:test"),a=require("node:assert/strict"),fs=require("fs"),vm=require("vm"),path=require("path");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");
function load(){const w={};w.window=w;vm.createContext(w);for(const f of ["rules.js","econ.js","econ-held-crafts.js","item-icons.js"])vm.runInContext(read(f),w,{filename:f});return w;}
test("every item id has an icon and no two icons are identical",()=>{const w=load(),ids=Object.keys(w.RPG.ITEMS),all=w.SOTA_ICONS.all();
 a.ok(ids.length>=500,"item count "+ids.length);const miss=ids.filter(id=>!all[id]||!all[id].body);a.deepEqual(miss,[]);
 const seen=new Map(),dup=[];for(const id of ids){const b=all[id].body;if(seen.has(b))dup.push(id+"="+seen.get(b));seen.set(b,id);}a.deepEqual(dup,[]);
 for(const id of ids){const s=w.SOTA_ICONS.svg(id);a.match(s,/^<svg class="iic-svg" data-icon-id="[^"]+"/);a.ok(s.includes('shape-rendering="crispEdges"'),id);a.ok(!/undefined|NaN/.test(s),id+" has a bad colour");
  a.ok((s.match(/<rect /g)||[]).length>=10,id+" icon too empty");}});
test("covers every kind: potions, food, gear, rings, tents, salts, crafting materials and key items",()=>{const w=load(),I=w.RPG.ITEMS,slots=new Set(Object.values(I).map(x=>x.slot));
 for(const s of ["use","ing","dish","weapon","offhand","helmet","chest","gloves","boots","acc","part","junk","gear","craft"])a.ok(slots.has(s),"no "+s+" items?");
 for(const id of ["potion","ether","salts","ration","tent","rope","lockpick","ring","p_silk","i_herbs","d_stew","x_poison"])a.ok(w.SOTA_ICONS.has(id),id);
 a.match(w.SOTA_ICONS.svg("potion"),/#d8343a/);a.match(w.SOTA_ICONS.svg("ether"),/#3a6ee0/);/* same red/blue bottles as t2437u */});
test("templates are 12x12 pixel grids; no network or image files",()=>{const w=load();for(const [k,v] of Object.entries(w.SOTA_ICONS.TEMPLATES)){const r=v.split("|");a.equal(r.length,12,k);for(const x of r)a.equal(x.length,12,k);}
 const src=read("item-icons.js");a.ok(!/fetch\(|XMLHttpRequest|new Image|\.png|\.webp|\.jpg|https?:/.test(src),"item-icons.js must not load anything");});
test("item-icons.js loads before game.js and is in the offline cache once",()=>{const h=read("index.html"),sw=read("sw.js");
 a.ok(h.indexOf('<script src="item-icons.js?v=3"></script>')>=0&&h.indexOf('item-icons.js?v=3')<h.indexOf('game.js?v='));a.equal(sw.split('"item-icons.js?v=3"').length-1,1);});
test("item names stay visible next to the icons (the icon adds no text)",()=>{const g=read("game.js"),p=read("party.js");
 a.ok(g.includes('<span class="slotn">'),"maze box name under the icon");a.ok(g.includes('b.setAttribute("title",name)'),"title kept");a.ok(g.includes('"Item box "+(i+1)'),"aria-label kept");
 for(const k of ['withIc(b,id)','itemIc(id,"big")','withIc(o,iid)','sp.dataset.loot=x.id;withIc(sp,x.id)','if(it.d.item||it.d.sell)withIc(b,it.d.item||it.d.sell)'])a.ok(p.includes(k),k);});
