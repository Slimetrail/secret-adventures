"use strict";
// t2645u/t2648u/t2650u/t2657u: three hero looks (palette swaps of the p- fight sprites), item colour tints, tap-an-item info, Equip compare. Node, no browser.
const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),zlib=require("node:zlib");
const root=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const party=read("party.js"),html=read("index.html"),sw=read("sw.js"),icons=read("item-icons.js");
const POSES=["human-warrior","human-rogue","human-archer","human-mage","elf-warrior","elf-rogue","elf-archer","elf-mage","dwarf-warrior","dwarf-rogue","dwarf-archer","cat-warrior","cat-rogue","cat-mage"];
function world(){const c={window:{},document:{},console};vm.createContext(c);vm.runInContext(read("rules.js"),c);c.window.RPG=c.window.RPG||c.RPG;
 vm.runInContext(read("econ.js"),c);vm.runInContext(read("item-icons.js"),c);c.R=c.window.RPG;c.E=c.window.ECON;c.SOTA_ICONS=c.window.SOTA_ICONS;return c;}
function slice(a1,b1){const i=party.indexOf(a1),j=party.indexOf(b1,i);a.ok(i>=0&&j>i,"slice "+a1);return party.slice(i,j);}
function looks(){const c=world();vm.runInContext(slice("// ---- t2645u/t2650u hero looks","const GEAR_API=")+";this.L={gearMaterial,gearLookOf,heroLookPixels,HERO_LOOK_DATA,HERO_LOOK_RAMP,GEAR_LOOKS};",c);return c;}
function info(){const c=world();c.itemIc=()=>null;c.clone=o=>JSON.parse(JSON.stringify(o));c.hpMul=()=>1;vm.runInContext(slice("// ---- t2645u/t2650u hero looks","const GEAR_API=")+slice("// ---- t2657u tap an item","function closeCmp")+";this.A={itemQuick,itemDesc,equipCompare};",c);return c;}
function hero(C,cls){const k={warrior:[{str:3},"cleave"],rogue:[{sta:3},"stab"],archer:[{sta:3},"aimed"],mage:[{man:3},"mend"]}[cls||"warrior"];const h=C.R.newChar("Tess","human",cls||"warrior",k[0],k[1]);h.equip=Object.assign({helmet:null,chest:null,gloves:null,boots:null,weapon:null,offhand:null,acc1:null,acc2:null},{});h.bag=[];return h;}
// minimal PNG decoder (8-bit RGBA/RGB/palette, non-interlaced) so the pixel checks run on the real shipped sprites
function png(file){const b=fs.readFileSync(path.join(root,file));let p=8,w,h,bd,ct,pal=null,trns=null;const idat=[];
 while(p<b.length){const len=b.readUInt32BE(p),type=b.toString("ascii",p+4,p+8),d=b.slice(p+8,p+8+len);p+=12+len;
  if(type==="IHDR"){w=d.readUInt32BE(0);h=d.readUInt32BE(4);bd=d[8];ct=d[9];a.equal(d[12],0,"interlaced");}else if(type==="PLTE")pal=d;else if(type==="tRNS")trns=d;else if(type==="IDAT")idat.push(d);else if(type==="IEND")break;}
 a.equal(bd,8,file+" bit depth");const ch={6:4,2:3,3:1,0:1,4:2}[ct],raw=zlib.inflateSync(Buffer.concat(idat)),st=w*ch,out=new Uint8ClampedArray(w*h*4);let prev=Buffer.alloc(st);
 for(let y=0;y<h;y++){const f=raw[y*(st+1)],line=Buffer.from(raw.slice(y*(st+1)+1,(y+1)*(st+1)));
  for(let x=0;x<st;x++){const L=x>=ch?line[x-ch]:0,U=prev[x],UL=x>=ch?prev[x-ch]:0;let v=line[x];
   if(f===1)v+=L;else if(f===2)v+=U;else if(f===3)v+=(L+U)>>1;else if(f===4){const pp=L+U-UL,pa=Math.abs(pp-L),pb=Math.abs(pp-U),pc=Math.abs(pp-UL);v+=pa<=pb&&pa<=pc?L:pb<=pc?U:UL;}line[x]=v&255;}
  for(let x=0;x<w;x++){const o=(y*w+x)*4,i=x*ch;if(ct===6){out[o]=line[i];out[o+1]=line[i+1];out[o+2]=line[i+2];out[o+3]=line[i+3];}
   else if(ct===2){out[o]=line[i];out[o+1]=line[i+1];out[o+2]=line[i+2];out[o+3]=255;}
   else if(ct===3){const k=line[i];out[o]=pal[k*3];out[o+1]=pal[k*3+1];out[o+2]=pal[k*3+2];out[o+3]=trns&&k<trns.length?trns[k]:255;}
   else if(ct===0){out[o]=out[o+1]=out[o+2]=line[i];out[o+3]=255;}else{out[o]=out[o+1]=out[o+2]=line[i];out[o+3]=line[i+1];}}
  prev=line;}return {w,h,d:out};}
const hex=(d,i)=>((1<<24)|(d[i]<<16)|(d[i+1]<<8)|d[i+2]).toString(16).slice(1);

test("VER 100, party.js?v=41 and item-icons.js?v=4 pinned; the offline cache lists nothing from art6/gear",()=>{
 a.match(sw,/^const VER="104",/);for(const s of [html,sw]){a.ok(s.includes("party.js?v=41"));a.ok(s.includes("item-icons.js?v=4"));a.ok(!s.includes("item-icons.js?v=3"));a.ok(!s.includes("party.js?v=37"));}
 a.equal(sw.includes("art6/gear"),false);a.equal(html.includes("art6/gear"),false);
});
test("per-piece layering and the gearImg repaint path are gone; nothing in party.js points at art6/gear or arm-* files",()=>{
 for(const s of ["gearImg","gearCompose","GEAR_IMG","GEAR_CACHE","gearArmourCandidates","gearHeldPath","gearBlitRotated","requestAnimationFrame(()=>{q=0;paint();})","art6/gear","arm-","/bases/"])a.equal(party.includes(s),false,s);
 a.ok(fs.existsSync(path.join(root,"art6/gear/armour/hm/arm-hm-chest-plate-64.png")),"arm-* art files kept on disk");
 a.ok(fs.existsSync(path.join(root,"art6/gear/bases/base-human-warrior-64.png")),"base art files kept on disk");
});
test("the looks come from the p- fight sprites: heroArt uses spr(heroKey(c)) and every hero draw site uses heroArt",()=>{
 a.ok(party.includes('function spr(n){let im=SPR[n];if(!im){im=new Image();im.src="art6/fight/"+n+".png";SPR[n]=im;}'));
 a.ok(party.includes('function heroArt(c){const k=heroKey(c),im=spr(k);if(!im)return null;const look=gearLookOf(c);return look==="cloth"?im:(heroLook(k,look,im)||im);}'));
 a.ok(party.includes("function drawHero(g,c,x,y,hh,t,act,i){const im=heroArt(c),"));
 a.equal(party.includes("spr(heroKey(c))"),false,"no hero draw site bypasses the look");
 a.ok(party.includes('const k=c.race+"|"+c.cls+"|"+gearLookOf(c);'),"portrait cache is per look");
 a.ok(party.includes("drawHero(g,Object.assign({},c,{hp:1}),120,286,175,0,false);"),"character figure draws the hero sprite");
 const C=looks();a.deepEqual(Object.keys(C.L.HERO_LOOK_DATA).sort(),POSES.slice().sort());
 for(const p of POSES)a.ok(fs.existsSync(path.join(root,"art6/fight/p-"+p+".png")),p);
});
test("look = chest material: robe/cloth, vest/leather, plate/metal for every chest item; no chest = cloth",()=>{
 const C=looks(),R=C.R;let n=0;
 for(const [id,it] of Object.entries(R.ITEMS)){if(it.slot!=="chest")continue;n++;const k=C.SOTA_ICONS._dev.kind(id,it),want={robe:"cloth",vest:"leather",plate:"metal"}[k];
  a.equal(C.L.gearMaterial(id),want,id);a.equal(C.L.gearMaterial(id),{1:"cloth",2:"leather",3:"metal"}[it.a],id+" armour class");}
 a.equal(n,131);
 for(const [chest,want] of [["robe","cloth"],["leather","leather"],["plate","metal"],[null,"cloth"],["w_leather","leather"],["relic3_plate","metal"],["z5_glow_robe","cloth"]])
  a.equal(C.L.gearLookOf({equip:{chest}}),want,String(chest));
 a.equal(C.L.gearLookOf({equip:{}}),"cloth");a.equal(C.L.gearLookOf({}),"cloth");a.equal(C.L.gearLookOf(null),"cloth");
});
test("non-chest pieces never change the look",()=>{
 const C=looks(),R=C.R;const others={helmet:["cap","helm"],gloves:["wraps","gauntlets"],boots:["sandals","greaves"],weapon:["sword","staff","bow"],offhand:["buckler","towershield","tome"],acc1:["ring"],acc2:["amulet"]};
 for(const chest of [null,"robe","leather","plate"]){const base=C.L.gearLookOf({equip:{chest}});
  for(const [s,ids] of Object.entries(others))for(const id of ids)a.equal(C.L.gearLookOf({equip:{chest,[s]:id}}),base,chest+"+"+id);
  a.equal(C.L.gearLookOf({equip:{chest,helmet:"helm",gloves:"gauntlets",boots:"greaves",weapon:"axe",offhand:"towershield",acc1:"ring",acc2:"amulet"}}),base);}
});
test("an explicit item mat/material field wins; odd values fall back to armour class then name",()=>{
 const C=looks(),R=C.R;R.ITEMS.t_a={n:"Test plate",slot:"chest",a:3,mat:"cloth"};R.ITEMS.t_b={n:"Odd coat",slot:"chest",material:"vest"};R.ITEMS.t_c={n:"Mystery plate",slot:"chest",mat:"wood"};R.ITEMS.t_d={n:"Rag robe",slot:"chest"};
 a.equal(C.L.gearMaterial("t_a"),"cloth");a.equal(C.L.gearMaterial("t_b"),"leather");a.equal(C.L.gearMaterial("t_c"),"metal");a.equal(C.L.gearMaterial("t_d"),"cloth");
 a.equal(C.L.gearMaterial("helm"),null,"non-chest items have no look");a.equal(C.L.gearMaterial("nope"),null);
});
test("palette swap on the real p- sprites: cloth unchanged; skin, face, hair and weapon boxes unchanged; only listed outfit colours move; alpha untouched",()=>{
 const C=looks();
 for(const p of POSES){const src=png("art6/fight/p-"+p+".png"),D=C.L.HERO_LOOK_DATA[p],out=new Set(D.o.split(" ")),skin=new Set(D.s?D.s.split(" ").filter(Boolean):[]);
  for(const x of skin)a.equal(out.has(x),false,p+" skin colour "+x+" is also an outfit colour");
  const res={};
  for(const look of ["leather","metal"]){const d=new Uint8ClampedArray(src.d);const n=C.L.heroLookPixels(d,src.w,src.h,p,look);a.ok(n>=60,p+" "+look+" changed only "+n+" px");res[look]=d;
   let kept=0,skinN=0;for(let y=0;y<src.h;y++)for(let x=0;x<src.w;x++){const i=(y*src.w+x)*4;a.equal(d[i+3],src.d[i+3]);const h0=hex(src.d,i),same=hex(d,i)===h0;
    if(!src.d[i+3])continue;
    if(!out.has(h0))a.ok(same,p+" "+look+" non-outfit pixel changed at "+x+","+y);
    if(D.k.some(r=>x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3])){a.ok(same,p+" "+look+" keep box pixel changed at "+x+","+y);kept++;}
    if(skin.has(h0)){a.ok(same,p+" skin changed");skinN++;}}
   a.ok(kept>0,p+" keep boxes cover pixels");}
  // leather and metal differ from each other and from cloth
  let diff=0;for(let i=0;i<src.d.length;i+=4)if(hex(res.leather,i)!==hex(res.metal,i))diff++;a.ok(diff>=60,p+" leather vs metal");
 }
 a.equal(C.L.heroLookPixels(new Uint8ClampedArray(16),2,2,"human-warrior","cloth"),0,"cloth is the unchanged sprite");
 a.equal(C.L.heroLookPixels(new Uint8ClampedArray(16),2,2,"nobody-x","metal"),0,"unknown sprite stays plain");
});
test("leather lands on browns and metal on steel greys",()=>{
 const C=looks();const sat=h=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return Math.max(r,g,b)-Math.min(r,g,b);};
 for(const h of C.L.HERO_LOOK_RAMP.metal)a.ok(sat(h)<=30,"metal "+h);
 for(const h of C.L.HERO_LOOK_RAMP.leather){const r=parseInt(h.slice(1,3),16),b=parseInt(h.slice(5,7),16);a.ok(r>b,"leather "+h);}
});
test("item colour variety: tints recolour existing shapes only; missing or bad tint = plain icon; built once per item",()=>{
 const C=world(),I=C.SOTA_ICONS,R=C.R;const all=I.all(),ids=Object.keys(R.ITEMS);
 a.equal(Object.keys(all).length,ids.length);a.equal(new Set(Object.values(all).map(x=>x.body)).size,ids.length,"all icons still differ");
 const tinted=ids.filter(id=>all[id].tint);a.ok(tinted.length>=100,"tinted "+tinted.length);
 for(const id of tinted)a.ok(I.svg(id).includes('data-icon-tint="'),id);
 const geo=b=>b.replace(/ fill="#[0-9a-f]{6}"/g,"");
 const keep=Object.assign({},I._dev.TINT);
 for(const id of Object.keys(keep))delete I._dev.TINT[id];I._dev.reset();const plain=I.all();
 for(const id of tinted){a.equal(plain[id].tint,null);a.ok(!I.svg(id).includes("data-icon-tint"),id);}
 for(const id of tinted.slice(0,40)){const t=all[id],p=plain[id];if(t.body!==p.body&&geo(t.body)!==geo(p.body)){/* salt may differ when two plain icons collide; shape family must match */a.equal(all[id].tpl,plain[id].tpl,id);}}
 // malformed tint -> plain icon
 I._dev.TINT.sword=["x",1,0];I._dev.TINT.axe=[10,1];I._dev.reset();a.equal(I.all().sword.tint,null);a.equal(I.all().axe.tint,null);
 // item data field wins
 R.ITEMS.sword.tint=[120,1,0];I._dev.reset();a.deepEqual(I.all().sword.tint,[120,1,0]);delete R.ITEMS.sword.tint;
 Object.assign(I._dev.TINT,keep);delete I._dev.TINT.sword;delete I._dev.TINT.axe;Object.assign(I._dev.TINT,keep);I._dev.reset();
 a.equal(I.all()[tinted[0]].body,all[tinted[0]].body,"same body after rebuild (deterministic)");
 // stats and slots untouched by the icon work
 a.deepEqual(JSON.parse(JSON.stringify(R.ITEMS.plate)),{n:"Plate armor",slot:"chest",a:3,w:12,def:7});
 a.ok(!/fetch\(|XMLHttpRequest|new Image|\.png|\.webp|https?:/.test(icons),"item-icons.js loads nothing");
});
test("tint only touches the material colours (outline, accent, gem, wood stay)",()=>{
 const C=world(),I=C.SOTA_ICONS;const pal={K:"#1e140c",L:"#e6ebef",M:"#a9b4bd",D:"#5f6b75",A:"#c8a050",G:"#ff0000",W:"#8a5a2e",S:"#e8dcc0"};
 const t=I._dev.tintPal(pal,[90,1,0]);for(const k of ["K","A","G","W","S"])a.equal(t[k],pal[k],k);a.notEqual(t.M,pal.M);
 const z=I._dev.tintPal(pal,[0,1,0]);for(const k of ["L","M","D"])a.equal(z[k],pal[k],"zero tint "+k);
});
test("tap an item: description and quick stats for every slot type",()=>{
 const C=info(),A=C.A;const h=hero(C);
 const cases={chest:"plate",helmet:"helm",gloves:"gauntlets",boots:"greaves",weapon:"sword",offhand:"buckler",acc:"ring",use:"potion",dish:"d_toast",ing:"i_bread",part:"p_silk",junk:"j_tooth",gear:"tent",craft:"x_poison"};
 const seen=new Set(Object.values(C.R.ITEMS).map(x=>x.slot));for(const s of seen)a.ok(cases[s],"no tap-view case for slot "+s);
 for(const [slot,id] of Object.entries(cases)){const it=C.R.ITEMS[id],st=A.itemQuick(id),m=Object.fromEntries(st),txt=A.itemDesc(id,h);
  a.ok(m.Type,id);a.equal(m.Weight,it.w+" kg",id);a.ok(txt.length>10,id+" description");a.ok(!/undefined|NaN|\[object/.test(JSON.stringify(st)+txt),id);
  for(const [k,n] of [["atk","ATK"],["mag","MAG"],["def","DEF"],["hp","HP"]])if(it[k]&&slot!=="use")a.equal(m[n],"+"+it[k],id+" "+n);}
 a.equal(Object.fromEntries(A.itemQuick("plate")).Look,"Metal");a.equal(Object.fromEntries(A.itemQuick("robe")).Look,"Cloth");a.equal(Object.fromEntries(A.itemQuick("leather")).Look,"Leather");
 a.equal(Object.fromEntries(A.itemQuick("plate")).Armour,"Heavy");a.match(A.itemDesc("plate",h),/metal look/);
 a.match(A.itemDesc("sword",h),/main hand.*Warrior/);a.match(A.itemDesc("tome",h),/spell book/);a.match(A.itemDesc("buckler",h),/shield/);
 a.match(A.itemDesc("potion",h),/health/);a.equal(Object.fromEntries(A.itemQuick("potion")).Heals,"45% HP");
 a.match(A.itemDesc("staff",h),/can't use this/);a.match(A.itemDesc("sword",h),/Tess can use this/);a.match(A.itemDesc("j_tooth",h),/Sell it/);
});
test("Equip compare numbers: empty slot (all plus), better, worse, mixed; the real hero is not changed",()=>{
 const C=info(),A=C.A,R=C.R;const line=c=>({atk:Math.round(R.power(c)),mag:Math.round(R.magicPower(c)),def:Math.round(R.defense(c)),hp:R.maxHp(c,1),mp:R.maxMp(c)});
 const chk=(h,id,slot)=>{const before=JSON.stringify(h),cm=A.equipCompare(h,id,slot);a.equal(JSON.stringify(h),before,"compare must not change the hero");a.ok(cm.ok,id);
  const t=JSON.parse(before);a.ok(R.equip(t,id,slot));const a0=line(h),a1=line(t);
  for(const k of ["atk","mag","def","hp","mp"]){const row=cm.rows.find(r=>r.k===k),d=a1[k]-a0[k];if(d){a.ok(row,id+" missing "+k);a.equal(row.d,d);a.equal(row.from,a0[k]);a.equal(row.to,a1[k]);a.equal(row.txt,(d>0?"+":"")+d+" "+k.toUpperCase());}else a.equal(row,undefined,"unchanged "+k+" must be hidden");}
  return cm;};
 // empty slot: every shown change is a plus
 let h=hero(C);h.bag.push("plate");let cm=chk(h,"plate","chest");a.equal(cm.cur,null);a.equal(cm.curName,"Nothing equipped");a.ok(cm.rows.length>=1);a.ok(cm.rows.every(r=>r.d>0),"empty slot is all plus");a.ok(cm.rows.some(r=>r.k==="def"));
 h=hero(C);h.bag.push("ring");cm=chk(h,"ring","acc1");a.ok(cm.rows.length>=2&&cm.rows.every(r=>r.d>0),"ring on empty slot: MAG and HP up");
 // better: leather -> plate
 h=hero(C);h.bag.push("leather","plate");R.equip(h,"leather","chest");cm=chk(h,"plate","chest");a.equal(cm.curName,"Leather vest");a.ok(cm.rows.length&&cm.rows.every(r=>r.d>0));
 // worse: axe -> sword
 h=hero(C);h.bag.push("axe","sword");R.equip(h,"axe","weapon");cm=chk(h,"sword","weapon");a.equal(cm.curName,"Hand axe");a.ok(cm.rows.length&&cm.rows.every(r=>r.d<0),"worse is all minus");a.ok(cm.rows.some(r=>r.k==="atk"));
 // mixed: leather -> robe (DEF down, MAG up)
 h=hero(C);h.bag.push("leather","robe");R.equip(h,"leather","chest");cm=chk(h,"robe","chest");a.ok(cm.rows.some(r=>r.d>0)&&cm.rows.some(r=>r.d<0),"mixed has ups and downs");
 a.ok(cm.rows.find(r=>r.k==="def").d<0);a.ok(cm.rows.find(r=>r.k==="mag").d>0);
});
test("tap view and Equip compare are wired into the character screen; Confirm equips through tryEquip, Cancel only closes",()=>{
 a.ok(party.includes('if(eqSlot){const eb=tapBtn("Equip",()=>cmpPanel(c,i,selItem,eqSlot),"small");eb.dataset.equipcmp=eqSlot;row.appendChild(eb);}'));
 a.ok(party.includes('const cf=tapBtn("Confirm",()=>{closeCmp();tryEquip(c,i,id,slot);},"small");'));
 a.ok(party.includes('const cn=tapBtn("Cancel",()=>closeCmp(),"small");'));
 a.ok(party.includes('function charScreen(i,pick){closeCmp();'));
 a.ok(party.includes('if(selItem!=null&&fits(selItem,s)){/* t2657u: a glowing slot opens the same compare as Equip */if(R.canEquip(c,selItem,s))cmpPanel(c,i,selItem,s);else tryEquip(c,i,selItem,s);return;}'),"glowing slot opens the compare");
 a.ok(party.includes('if(sel&&sel.slot&&fits(id,sel.slot)){/* t2657u: a glowing bag item after picking a slot opens the same compare */if(R.canEquip(c,id,sel.slot))cmpPanel(c,i,id,sel.slot);else tryEquip(c,i,id,sel.slot);return;}'),"glowing bag item after picking a slot opens the compare");
 a.ok(party.includes('o.addEventListener("click",e=>{e.preventDefault();if(ok)cmpPanel(c,i,id,s);else tryEquip(c,i,id,s);});'),"slot option list opens the compare");
 a.equal(party.includes('if(sel&&sel.slot&&fits(id,sel.slot)){tryEquip(c,i,id,sel.slot);return;}'),false,"bag path must not equip on the tap alone");
 a.equal(party.includes('o.addEventListener("click",e=>{e.preventDefault();tryEquip(c,i,id,s);});'),false,"option list must not equip on the tap alone");
 a.ok(party.includes('"Tap Equip or a glowing slot to compare."'));a.equal(party.includes("Tap a glowing slot to equip."),false);
 a.ok(party.includes('const tq=el("div","s6tap");tq.dataset.tap=selItem;'));
 for(const gone of ["aboutBtn","aboutPanel","s6about","closeAbout"])a.equal(party.includes(gone),false,gone);
 const s=slice("// ---- t2657u tap an item","let sheetSel=null;");for(const bad of ["R.unequip(","c.bag.splice","c.bag.push","live.gold","doSave"])a.equal(s.includes(bad),false,bad);
});
test("wait wording is unchanged",()=>{a.ok(party.includes('const WAIT_UPDATE="Please wait for update to continue.";'));a.ok(read("game.js").includes("Please wait for update to continue."));});
