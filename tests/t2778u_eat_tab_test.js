"use strict";
// Jeremy t2778u/t2779u/t2780u: camp Eat tab. A picker of COOKED dishes only; one dish feeds the whole party; the buff lasts until the next
// meal or a tavern (no fight countdown); a later joiner gets nothing until the next meal; exact save/load (t2442u) incl. old-format saves;
// per-speaker favored-meal counts + lastMeal, and the favored-meal talk fires when eating earns it (one talk at a time).
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const plain=o=>JSON.parse(JSON.stringify(o));
const flow=read('tests/tavern_shop_camp_flow_test.js');
// same patch of the shared harness as tests/t2759u_special_gear_party_test.js (the harness file itself is not changed)
let hsrc=flow.slice(flow.indexOf('function harness'),flow.indexOf('\nfor(let t=0'));
const LOADS="for(const f of ['maze-data.js','content-cap.js','rules.js','econ.js'])";a.ok(hsrc.includes(LOADS));a.ok(hsrc.includes('storyOpen:()=>story};'));
hsrc=hsrc.replace(LOADS,"for(const f of ['maze-data.js','content-cap.js','rules.js','gear.js','econ.js'])")
 .replace('storyOpen:()=>story};','storyOpen:()=>story,setMazeSlots(){},panelOpen:()=>false,mapOpen:()=>false,puzzleOpen:()=>false,roomAt:(x,y)=>{const r=M.rooms.find(r=>r.c[0]===x&&r.c[1]===y);return r?r.id:-1;},seamTavernAt:(x,y)=>({"14,49":0,"14,48":0,"18,24":1,"19,24":1,"51,14":2,"51,15":2,"46,48":3,"47,48":3})[x+","+y]??-1};');
const baseHarness=eval('('+hsrc+')');
function harness(init){const h=baseHarness(init||{}),create=h.document.createElement;h.document.createElement=t=>{const e=create(t);if(t==='canvas'){e.toDataURL=()=>'data:,';e.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},width:0})});}return e;};h.c.Image=class{constructor(){this.complete=false;}};
 h.S.intro={showTitle(){}};h.S.wipeZone=()=>1;h.S.map={isFound:()=>false};h.S.core.mask=h.M.mask;h.S.archAhead=()=>-1;return h;}
const ROLE={Q:'quirky',S:'scholar',A:'angry'};
// real package-dialogue.js + real pools on a small story api (st/who/play); H.meal is batch1-talks' lastMeal rule
function withDialogue(h){vm.runInContext(read('package-pools-data.js'),h.c);const w=h.c.window;w.STORY={fight:{start:{Q:{},S:{},A:{}}}};w.PACKAGE_STORY={owners:[]};
 const scenes=[],L=()=>h.r.live();
 const api={st(){const l=L();l.story=l.story||{v:1};for(const k of ['seen','walls','told'])l.story[k]=l.story[k]||{};return l.story;},
  who(code){const l=L();if(code==='H')return l.party[0];return l.party.find(c=>c.role===ROLE[code])||null;},
  play(kind,lines,opt){scenes.push({kind,lines:plain(lines)});},sequential:{select:()=>false,run:()=>false},brunnVer:()=>null,brunnJoinVersion:()=>null};
 h.r.s6=api;const H={meal:(it,fx)=>{const s=api.st();s.lastMeal=it.slot==='use'?'ration':it.slot==='dish'&&fx&&fx.hp?'cooked':'buff';},camp(){},tavern(){},craft(){},joined(){}};
 w.S6H=H;vm.runInContext(read('package-dialogue.js'),h.c);w.PackageDialogue.install(h.S,h.R,H,h.M);h.enableHooks();return {api,scenes,H,pools:w.PACKAGE_POOLS};}
function addComp(h,i){const L=h.r.live(),c=h.R.makeCompanion(h.R.COMPANIONS[i],h.R.partyLevel(L.party));c.bag=[];L.party.push(c);return c;}
function atCamp(h,k=0){const [x,y]=h.M.camps[k];Object.assign(h.pos,{x,y,f:0});}
const q=(h,s)=>h.ov.querySelector(s),qa=(h,s)=>h.ov.querySelectorAll(s);
const dishBtns=h=>qa(h,'[data-eatdish]');
function eat(h,id,k=0){const b=dishBtns(h).find(x=>x.dataset.eatdish===id);a.ok(b,'picker has no '+id);h.click(b);}
function openEat(h){atCamp(h);h.r.s5.campScreen(0);h.click(q(h,'[data-tab=eat]'));a.equal(h.r.ui(),'eat');}
const buffs=h=>plain(h.r.live().party.map(c=>c.buff||null));
const JERKY={str:0,sta:30,n:"Hunter's jerky",meal:'d_jerky'};

test('camp side tabs are Cook, Eat, Rest, Save, Return (Eat right after Cook)',()=>{const h=harness();atCamp(h);h.r.live().party[0].bag.push('tent');h.r.s5.campScreen(0);
 a.deepEqual(qa(h,'.s5tab').map(b=>b.textContent),['Cook','Eat','Rest','Save','Return']);a.deepEqual(qa(h,'[data-tab]').map(b=>b.dataset.tab),['cook','eat','rest','save','return']);
 h.click(q(h,'[data-tab=eat]'));a.equal(h.r.ui(),'eat');h.click(q(h,'.s4back'));a.equal(h.r.ui(),'camp');});

test('t2779u: the Eat picker lists only cooked dishes; never rations, potions, ingredients, crafted or failed food',()=>{const h=harness(),c=h.r.live().party[0];
 c.bag=['ration','potion','ether','salts','i_bread','i_meat','c_stew','c_elixir','x_badsta','tent','d_jerky','d_jerky','d_toast'];openEat(h);
 a.deepEqual(dishBtns(h).map(b=>b.dataset.eatdish).sort(),['d_jerky','d_toast']);a.match(dishBtns(h).find(b=>b.dataset.eatdish==='d_jerky').textContent,/Hunter's jerky ×2/);
 for(const id of ['ration','potion','ether','salts','i_bread','i_meat','c_stew','c_elixir','x_badsta','tent'])a.ok(!dishBtns(h).some(b=>b.dataset.eatdish===id),id+' listed');
 a.deepEqual(plain(h.r.s5.cookedChoices()).map(x=>x.id).sort(),['d_jerky','d_toast']);
 c.bag=['ration','potion','i_bread'];openEat(h);a.equal(dishBtns(h).length,0);a.ok(q(h,'[data-nodish]'));});

test('t2780u: one dish is taken from that bag only; whose-bag labels only when more than one bag has dishes',()=>{const h=harness(),L=h.r.live(),hero=L.party[0],m=addComp(h,0);
 hero.bag=['d_jerky','ration'];m.bag=['potion'];openEat(h);a.equal(dishBtns(h).length,1);a.doesNotMatch(dishBtns(h)[0].textContent,/bag\)/);
 m.bag=['d_pie','potion'];openEat(h);a.deepEqual(dishBtns(h).map(b=>[b.dataset.eatdish,b.dataset.bag]),[['d_jerky','0'],['d_pie','1']]);
 a.match(dishBtns(h)[0].textContent,new RegExp("\\("+hero.name+"'s bag\\)"));a.match(dishBtns(h)[1].textContent,/\(Mira's bag\)/);
 eat(h,'d_pie');a.deepEqual(plain(m.bag),['potion']);a.deepEqual(plain(hero.bag),['d_jerky','ration']);a.equal(h.r.ui(),'eat');
 a.equal(h.r.s5.eatCooked(0,1,'d_jerky'),false,'a dish not in that bag must not be eaten');a.deepEqual(plain(hero.bag),['d_jerky','ration']);});

test('t2780u: one cooked dish buffs the WHOLE party, shows per member, and lasts across fights (no countdown)',()=>{const h=harness(),L=h.r.live();addComp(h,0);addComp(h,1);L.party[0].bag=['d_jerky'];
 openEat(h);eat(h,'d_jerky');a.deepEqual(buffs(h),[JERKY,JERKY,JERKY]);a.equal(L.party[0].bag.length,0);
 a.deepEqual(qa(h,'[data-mealbuff]').map(r=>r.dataset.meal),['d_jerky','d_jerky','d_jerky']);for(const r of qa(h,'[data-mealbuff]'))a.match(r.textContent,/Hunter's jerky: \+30% stamina until the next meal or a tavern/);
 const p0=L.party.map(c=>h.R.power(c));for(let i=0;i<25;i++)h.r.s5.tickBuffs();a.deepEqual(buffs(h),[JERKY,JERKY,JERKY]);a.deepEqual(L.party.map(c=>h.R.power(c)),p0);
 const nob=L.party.map(c=>{const x=plain(c);delete x.buff;return h.R.power(x);});L.party.forEach((c,i)=>{if(h.R.CLASSES[c.cls].main!=='str')a.ok(p0[i]>nob[i],'stamina buff not applied in power for '+c.name);});
 L.party[0].bag=['d_pie'];openEat(h);eat(h,'d_pie');const hp0=h.R.power(L.party[0]),hx=plain(L.party[0]);delete hx.buff;a.ok(hp0>h.R.power(hx),'strength buff not applied in power');
 a.match(h.c.window.ECON.fxText({sta:30,f:3}),/until the next meal/);});

test('t2780u: the next meal replaces the buff for everyone; a no-buff dish clears it; non-meal debuffs keep their countdown',()=>{const h=harness(),L=h.r.live();addComp(h,0);L.party[0].bag=['d_jerky','d_pie','d_toast'];
 openEat(h);eat(h,'d_jerky');eat(h,'d_pie');const PIE={str:10,sta:0,n:'Fish pie',meal:'d_pie'};a.deepEqual(buffs(h),[PIE,PIE]);
 eat(h,'d_toast');a.deepEqual(buffs(h),[null,null]);
 h.r.s5.eatDish(L.party[1],'x_badsta');const bad=plain(L.party[1].buff);a.ok(bad.f>0&&!bad.meal);L.party[0].bag=['d_toast'];openEat(h);eat(h,'d_toast');a.deepEqual(plain(L.party[1].buff),bad);h.r.s5.tickBuffs();a.equal(L.party[1].buff.f,bad.f-1);});

test('t2780u: hp/mp of the dish refill every awake member; a meal never wakes a knocked-out member (buff still stored)',()=>{const h=harness(),L=h.r.live();addComp(h,0);addComp(h,1);
 L.party[0].hp=1;L.party[1].hp=0;L.party[2].hp=1;L.party[0].bag=['d_omelette'];openEat(h);eat(h,'d_omelette');
 const mh=c=>h.R.maxHp(c,h.R.DIFF[L.diff].hp);a.equal(L.party[0].hp,Math.min(mh(L.party[0]),1+Math.round(mh(L.party[0])*25/100)));a.equal(L.party[1].hp,0);a.equal(L.party[2].hp,Math.min(mh(L.party[2]),1+Math.round(mh(L.party[2])*25/100)));
 a.ok(L.party.every(c=>c.buff&&c.buff.meal==='d_omelette'));});

test('t2780u: entering a tavern clears all meal buffs (step-in and seam archway); a joiner there has none',()=>{for(const how of ['step','arch']){const h=harness(),L=h.r.live();L.party[0].bag=['d_jerky','tent'];openEat(h);eat(h,'d_jerky');a.deepEqual(buffs(h),[JERKY]);
 h.r.closeUI();h.enableHooks();h.c.window.S6H.plan=()=>null;const [x,y]=h.M.taverns[0];Object.assign(h.pos,{x,y,f:0});
 if(how==='step'){h.S.seamTavernAt=()=>-1;h.S.afterStep();}/* a non-seam (step-in) tavern */else a.equal(h.S.onArchBump(0),true);
 a.ok(L.party.length>=2,'Mira should join at tavern 1 ('+how+')');a.ok(L.party.every(c=>!c.buff),how+': meal buff survived a tavern');}});

test('t2780u: a member who joins after the meal gets no buff until the next meal',()=>{const h=harness(),L=h.r.live();L.party[0].bag=['d_jerky','d_jerky'];openEat(h);eat(h,'d_jerky');
 const m=addComp(h,0);a.deepEqual(buffs(h),[JERKY,null]);for(let i=0;i<5;i++)h.r.s5.tickBuffs();a.deepEqual(buffs(h),[JERKY,null]);openEat(h);a.match(qa(h,'[data-mealbuff]')[1].textContent,/No meal buff/);
 eat(h,'d_jerky');a.deepEqual(buffs(h),[JERKY,JERKY]);});

test('t2442u: meal buffs and favored-meal counts save and load exactly; camp Eat never auto-saves',()=>{const h=harness(),L=h.r.live();withDialogue(h);addComp(h,0);L.party[0].bag=['d_jerky','d_jerky','tent'];
 openEat(h);eat(h,'d_jerky');a.equal([...h.storage.keys()].some(k=>/^sota\.party/.test(k)),false,'camp Eat auto-saved');
 const lateJoin=addComp(h,1);a.equal(lateJoin.buff,undefined);
 a.equal(h.r.doSave(),true);const saved=JSON.parse(h.storage.get('sota.party.slot0'));a.deepEqual(saved.party.map(c=>c.buff||null),[JERKY,JERKY,null]);a.deepEqual(plain(saved.story.favMeal),{Q:1},'Sorrel joined after the meal: not counted');
 eat(h,'d_jerky');L.party.forEach(c=>{delete c.buff;});L.story.favMeal={Q:9};h.r.restore();
 a.deepEqual(buffs(h),[JERKY,JERKY,null]);a.deepEqual(plain(h.r.live().story.favMeal),{Q:1});a.equal(h.r.live().story.lastMeal,'buff');a.deepEqual(plain(h.r.live().party),saved.party);
 const boot=harness(Object.fromEntries(h.storage));a.deepEqual(plain(boot.r.live().party),saved.party);a.deepEqual(plain(boot.r.live().story),plain(saved.story));});

test('old-format saves load cleanly: a counting-down dish buff becomes a meal buff; other buffs untouched; no crash',()=>{const h=harness(),o=h.fresh();o.at={x:h.M.taverns[0][0],y:h.M.taverns[0][1],f:0,name:'Tavern 1'};o.rooms={s:[],c:[]};o.hpv=1;
 const m=plain(h.R.makeCompanion(h.R.COMPANIONS[0],1)),s=plain(h.R.makeCompanion(h.R.COMPANIONS[1],1));o.party.push(m,s);
 o.party[0].buff={str:0,sta:30,f:2,n:"Hunter's jerky"};o.party[1].buff={str:0,sta:-20,f:2,n:'Gristle lump'};o.party[2].buff={str:20,hp:0,sta:0,f:1,n:'Griffin egg omelette'};
 const x=harness({'sota.party.slot0':JSON.stringify(o),'sota.party.active':'0'}),P=x.r.live().party;
 a.deepEqual(plain(P[0].buff),JERKY);a.deepEqual(plain(P[1].buff),{str:0,sta:-20,f:2,n:'Gristle lump'});a.deepEqual(plain(P[2].buff),{str:20,sta:0,n:'Griffin egg omelette',meal:'d_omelette'});
 for(let i=0;i<5;i++)x.r.s5.tickBuffs();a.deepEqual(plain(P[0].buff),JERKY);a.equal(P[1].buff,undefined);
 x.r.live().party[0].buff=null;x.r.restore();a.deepEqual(plain(x.r.live().party[0].buff),JERKY);
 const none=h.fresh();none.at=o.at;none.rooms=o.rooms;const y=harness({'sota.party.slot0':JSON.stringify(none)});a.equal(y.r.live().party[0].buff,undefined);});

test('favored-meal counts are per speaker, counted when EATEN (not cooked), and set lastMeal',()=>{const h=harness(),L=h.r.live(),{scenes}=withDialogue(h);const mira=addComp(h,0),sor=addComp(h,1),brunn=addComp(h,2);
 a.deepEqual([mira.cls,sor.cls,brunn.cls],['rogue','mage','warrior']);atCamp(h);h.r.s5.campScreen(0);
 L.party[0].bag.push('i_meat','i_salt','i_pepper');a.equal(h.r.s5.cookTry(['meat','salt','pepper'],'c0').dish.id,'jerky');a.equal((L.story&&L.story.favMeal)||undefined,undefined,'cooking counted a meal');
 openEat(h);eat(h,'d_jerky');a.deepEqual(plain(L.story.favMeal),{Q:1,S:0,A:0});a.equal(L.story.lastMeal,'buff');a.equal(L.story.lastMealId,'d_jerky');
 L.party[0].bag.push('d_pie');openEat(h);eat(h,'d_pie');a.deepEqual(plain(L.story.favMeal),{Q:0,S:0,A:1},'another dish resets only those it does not favor');
 L.party[0].bag.push('d_omelette');openEat(h);eat(h,'d_omelette');a.equal(L.story.lastMeal,'cooked');a.deepEqual(plain(L.story.favMeal),{Q:0,S:0,A:2});
 L.party[0].bag.push('d_moon');openEat(h);eat(h,'d_moon');a.deepEqual(plain(L.story.favMeal),{Q:0,S:1,A:0});a.equal(scenes.length,0);
 const {gate}=h.r.s6.packageDialogue,pools=h.c.window.PACKAGE_POOLS,row=id=>pools.camp.find(r=>r.id===id);
 L.story.favMeal={Q:0,S:0,A:3};a.equal(gate(row('50')),true);a.equal(gate(row('43')),false);a.equal(gate(row('49')),false,'Angry count leaked to other speakers');});

test('eating earns the favored-meal talk right then: each speaker on their own third meal in a row, one talk at a time',()=>{const h=harness(),L=h.r.live(),{scenes,pools}=withDialogue(h);addComp(h,0);addComp(h,1);addComp(h,2);
 const text=id=>pools.camp.find(r=>r.id===id).text;
 L.party[0].bag=['d_jerky','d_jerky','d_jerky','d_jerky'];openEat(h);eat(h,'d_jerky');eat(h,'d_jerky');a.equal(scenes.length,0);
 eat(h,'d_jerky');a.equal(scenes.length,1,'one talk at a time (brag beats the third-stamina line)');a.deepEqual(scenes[0].lines,[['Q','calm',text('43')]]);a.equal(L.story.seen['pool-camp-43'],1);
 eat(h,'d_jerky');a.equal(scenes.length,1,'4th in a row does not re-fire');
 L.party[0].bag=['d_steak','d_steak','d_steak'];openEat(h);for(let i=0;i<3;i++)eat(h,'d_steak');a.equal(scenes.length,2);a.deepEqual(scenes[1].lines,[['A','calm',text('50')]]);
 L.party[0].bag=['d_tea','d_tea','d_tea'];openEat(h);for(let i=0;i<3;i++)eat(h,'d_tea');a.equal(scenes.length,3);a.deepEqual(scenes[2].lines,[['S','calm',text('49')]]);
 a.equal(L.party.length,4);a.ok(L.party.every(c=>c.buff===undefined),'tea has no str/sta: buffs cleared for everyone');});

test('third stamina meal in a row (camp 7) fires from eating when no favored brag is earned; it is no longer blocked',()=>{const h=harness(),L=h.r.live(),{scenes,pools}=withDialogue(h);addComp(h,1);addComp(h,2);
 L.party[0].bag=['d_jerky','d_jerky','d_jerky','d_pie'];openEat(h);eat(h,'d_jerky');eat(h,'d_jerky');a.equal(scenes.length,0);eat(h,'d_jerky');
 a.equal(L.story.staMealRun,3);a.equal(scenes.length,1);a.deepEqual(scenes[0].lines,[['H','calm',pools.camp.find(r=>r.id==='7').text]]);
 const {gate}=h.r.s6.packageDialogue;a.equal(gate(pools.camp.find(r=>r.id==='7')),true);eat(h,'d_pie');a.equal(L.story.staMealRun,0);a.equal(gate(pools.camp.find(r=>r.id==='7')),false);
 a.doesNotMatch(read('package-dialogue.js'),/third favored-meal count is not observed yet/);});

test('companions not in the party are untouched; no extra effects; locks and wait text unchanged',()=>{const h=harness(),L=h.r.live(),{scenes}=withDialogue(h);addComp(h,0);
 L.party[0].bag=['d_pie'];openEat(h);eat(h,'d_pie');a.deepEqual(plain(L.story.favMeal),{Q:0});const keys=Object.keys(L.story).sort();
 a.deepEqual(keys.filter(k=>/trust|mood|bond/i.test(k)),[]);a.equal(scenes.length,0);
 a.match(read('party.js'),/const WAIT_UPDATE="Please wait for update to continue\.";/);});
