"""Stage 5 (economy and cooking) tests on a pretend phone (Playwright Chromium, touch). Usage: python tests/stage5_tests.py [base_url] [names...]"""
import sys,os,json,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import stage4_tests as S4
from stage4_tests import check,ctx,page,tap,ev,create,step_into,finish,noslide,Fail,ERRS,REQS,ROOT
from playwright.sync_api import sync_playwright
ONLY=sys.argv[2:]
def setup(p,w=390,h=844):
  b,c=ctx(p,w,h);pg=page(c);create(pg);return b,pg
def L(pg,js):return ev(pg,'(()=>{const L=SOTA.rpg.live(),E=ECON,X=SOTA.rpg.s5;'+js+'})()')
def tree(pg,label):
  noslide(pg);l=pg.locator('#s4br .s4bi',has_text=label).last;check(l.count()>0,'no tree item '+label);b=l.bounding_box();pg.touchscreen.tap(b['x']+b['width']/2,b['y']+b['height']/2)
# ---------- rules ----------
def t_twenty_dishes(p):
  b,pg=setup(p)
  check(L(pg,'return E.DISHES.length')==20,'not 20 dishes')
  check(L(pg,'return E.cook(["butter","bread"]).id')=='toast','order should not matter')
  check(L(pg,'return E.cook(["bread","herbs"])')is None,'wrong mix made a dish')
  check(L(pg,'return E.DISHES.every(d=>d.ing.every(x=>RPG.ITEMS["i_"+x]))'),'dish uses unknown ingredient')
  check(L(pg,'return new Set(E.DISHES.map(d=>d.ing.slice().sort().join("+"))).size')==20,'two dishes share a recipe');b.close()
def t_drops_zones(p):
  b,pg=setup(p)
  z=L(pg,'const o={};for(let z=1;z<=5;z++){o[z]=new Set();for(let s=0;s<400;s++)E.drops(z,s).forEach(x=>o[z].add(x));o[z]=[...o[z]];}return o;')
  check('p_silk' in z['1'] and all('p_silk' not in z[k] for k in '2345'),'spider silk should drop only in zone 1')
  check('p_hide' in z['2'] and all('p_hide' not in z[k] for k in '1345'),'boar hide should drop only in zone 2')
  check(all(any(x.startswith('i_') for x in z[k]) for k in '12345'),'no food drops in some zone')
  check(all(any(x.startswith('p_') for x in z[k]) for k in '12345'),'no part drops in some zone');b.close()
def t_win_drops(p):
  b,pg=setup(p);n0=L(pg,'return L.party[0].bag.length')
  got=0
  for i in range(6):
    ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])');ev(pg,'SOTA.rpg.forceEnd("win")');got=max(got,L(pg,'return L.party[0].bag.filter(x=>x.startsWith("p_")||x.startsWith("i_")).length'));tap(pg,'#fdone')
  check(got>0,'six wins gave no parts or food');b.close()
def t_part_bulk(p):
  b,pg=setup(p)
  w=L(pg,'const c={bag:[]},o=[];for(let n=0;n<=12;n++){c.bag=Array(n).fill("p_silk");o.push(RPG.bagWeight(c));}return o;')
  d=[round(w[i+1]-w[i],2) for i in range(12)]
  check(d[0]==d[4]==0.2,'first 5 parts should be light');check(d[5]>d[0],'6th part not heavier');check(d[9]>d[5],'10th part not heavier still')
  check(L(pg,'const c=L.party[0];c.bag=[];for(let i=0;i<200;i++){if(!RPG.canCarry(c,"p_silk"))return i;c.bag.push("p_silk");}return 200')<40,'parts never get too heavy');b.close()
def t_stacking(p):
  b,pg=setup(p);L(pg,'const c=L.party[0];c.bag.push("j_tooth","j_tooth","j_tooth","i_egg");')
  tap(pg,'#partyb');tap(pg,'[data-card="0"]')
  st=ev(pg,'[...document.querySelectorAll(".s4bag [data-item=j_tooth]")].map(x=>[x.dataset.n,x.textContent])')
  check(len(st)==1 and st[0][0]=='3' and '×3' in st[0][1],f'teeth not stacked {st}');b.close()
def t_shop_buy_sell(p):
  b,pg=setup(p);L(pg,'L.gold=100;L.party[0].bag.push("j_gem");');ev(pg,'SOTA.rpg.s5.tavernScreen(0)')
  check(ev(pg,'SOTA.rpg.ui()')=='tavern','tavern did not open');tap(pg,'[data-hub="1"]');tap(pg,'[data-tab=food]');tap(pg,'[data-buy=ration]')
  check(L(pg,'return [L.gold,X.haveN("ration")]')==[96,1],'buying a ration failed')
  v=L(pg,'return E.sellPrice("j_gem")');ev(pg,'SOTA.rpg.s5.tavernScreen(0)');tap(pg,'[data-hub="1"]');tap(pg,'[data-tab=sell]');tap(pg,'[data-sell=j_gem]')
  check(L(pg,'return [L.gold,X.haveN("j_gem")]')==[96+v,0],'selling junk failed')
  L(pg,'L.gold=1');ev(pg,'SOTA.rpg.s5.shopList(0,"food")');tap(pg,'[data-buy=potion]');check(L(pg,'return L.gold')==1,'bought with too little gold')
  check(L(pg,'return E.sellPrice("potion")<E.price("potion")'),'resale should be below price');b.close()
def t_buy_flow(p):
  b,pg=setup(p);L(pg,'L.gold=500');ev(pg,'SOTA.teleport(...MAZE.taverns[2],0);SOTA.rpg.s5.tavernScreen(2)')
  tabs=ev(pg,'[...document.querySelectorAll("[data-hub]")].map(x=>x.textContent)');check(tabs==['Zone 3','Shop','Zone 4'],f'tavern hub labels {tabs}')
  tap(pg,'[data-hub="1"]');check(ev(pg,'SOTA.rpg.ui()')=='buy','Buy is not its own screen')
  check(ev(pg,'[...document.querySelectorAll(".s5tab")].map(x=>x.dataset.tab)')==['recipes','food','craft','sell','done'],'Shop screen options wrong')
  check(ev(pg,'document.querySelectorAll("[data-buy],[data-recipe]").length')==0,'Buy screen lists items directly')
  want={'recipes':('[data-recipe]','[data-buy]'),'food':('[data-buy=i_bread]','[data-recipe],[data-buy=tent],[data-buy=p_silk]'),'craft':('[data-buy=tent]','[data-recipe],[data-buy=i_bread]')}
  for k,(has,hasnt) in want.items():
    tap(pg,f'[data-tab={k}]');check(ev(pg,'SOTA.rpg.ui()')=='shop-'+k,f'{k} is not its own screen')
    check(ev(pg,f'document.querySelectorAll("{has}").length')>0,f'{k} screen missing its items');check(ev(pg,f'document.querySelectorAll("{hasnt}").length')==0,f'{k} screen shows other items')
    tap(pg,'.s4head button');check(ev(pg,'SOTA.rpg.ui()')=='buy',f'Back from {k} did not go up to Buy')
  check(ev(pg,'document.querySelectorAll("[data-buy=p_silk]").length')==0,'');tap(pg,'[data-tab=craft]');check(ev(pg,'document.querySelectorAll("[data-buy=p_silk]").length')==1,'tavern 3 craft has no parts')
  tap(pg,'[data-tentb]');check(ev(pg,'SOTA.rpg.ui()')=='tent','build tent screen');tap(pg,'.s4head button');check(ev(pg,'SOTA.rpg.ui()')=='shop-craft','Back from tent build')
  tap(pg,'.s4head button');tap(pg,'.s4head button');check(ev(pg,'SOTA.rpg.ui()')=='save-picker','Shop Back did not open save picker');tap(pg,'[data-save-slot="0"]');check(ev(pg,'SOTA.rpg.ui()')=='tavern','Shop save did not return to tavern')
  ev(pg,'SOTA.rpg.s5.shopList(0,"craft")');check(ev(pg,'document.querySelectorAll("[data-buy^=p_]").length')==0,'tavern 1 sells parts');b.close()
def t_sell_party_only(p):
  b,pg=setup(p);L(pg,'L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1));L.party[0].bag.push("j_tooth","j_tooth","p_silk");L.party[1].bag.push("i_egg","rope");')
  ev(pg,'SOTA.rpg.s5.sellScreen(0)');rows=ev(pg,'[...document.querySelectorAll("[data-sell]")].map(x=>x.dataset.who+":"+x.dataset.sell)')
  want=L(pg,'const o=[];L.party.forEach((c,ci)=>[...new Set(c.bag)].forEach(id=>o.push(ci+":"+id)));return o')
  check(sorted(rows)==sorted(want),f'sell list is not what the party carries {rows} vs {want}')
  check('×2' in ev(pg,'document.querySelector("[data-sell=j_tooth]").textContent'),'no stack count on sell row')
  tap(pg,'[data-sell=rope]');check(L(pg,'return L.party[1].bag.includes("rope")')==False,'second member item not sold')
  check(ev(pg,'document.querySelectorAll("[data-sell=rope]").length')==0,'sold item still listed');b.close()
def t_junk_stock(p):
  b,pg=setup(p)
  L(pg,'L.gold=1000;L.party[0].bag=[];X.shopCounts(0);X.shopCounts(3);L.party[0].bag.push("p_silk","j_tooth","i_egg");')
  before=L(pg,'return [L.gold,JSON.stringify(X.shopCounts(3))]')
  for id in ["p_silk","j_tooth","i_egg"]:
    ev(pg,'SOTA.rpg.s5.sellScreen(0)');tap(pg,f'[data-sell={id}]')
  check(L(pg,'return L.gold')==before[0]+L(pg,'return ["p_silk","j_tooth","i_egg"].reduce((n,id)=>n+E.sellPrice(id),0)'),'sales lost gold')
  check(L(pg,'return [X.shopCounts(0).ration,X.shopCounts(0).potion]')==[6,6],'junk did not produce consumables')
  check(L(pg,'return JSON.stringify(X.shopCounts(3))')==before[1],'stock leaked to tavern 4')
  check(L(pg,'return Object.keys(X.shopCounts(0)).sort().join() === ["ration","potion","ether","salts"].concat(E.stock(0).ing).sort().join()'),'junk produced equipment')
  L(pg,'X.shopList(0,"food")');check('Stock 6' in ev(pg,'document.querySelector("[data-buy=potion]").textContent'),'quantity missing')
  tap(pg,'[data-buy=potion]');check(L(pg,'return X.shopCounts(0).potion')==5,'UI purchase did not decrement stock')
  L(pg,'for(let i=0;i<5;i++){L.party[0].bag=[];if(!X.buy("potion",0))throw Error("purchase failed");}L.party[0].bag=[];')
  check(L(pg,'return [X.shopCounts(0).potion,X.buy("potion",0)]')==[0,False],'sold out potion still sold')
  L(pg,'L.party[0].bag.push("rope");X.sell(0,0,0);');check(L(pg,'return X.shopCounts(0).ration')==6,'gear sale produced food')
  ev(pg,'(()=>{const t=MAZE.taverns[0];SOTA.teleport(t[0],t[1],0);SOTA.rpg.doSave()})()')
  saved=L(pg,'return JSON.stringify(L.tavernStock)');pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg&&SOTA.rpg.live()')
  check(L(pg,'return JSON.stringify(L.tavernStock)')==saved,'stock lost on save/reload')
  check(L(pg,'return X.shopCounts(0).potion')==0,'reload restocked empty shelf');b.close()
def t_dead_warrior_gear(p):
  b,pg=setup(p)
  check(L(pg,'return RPG.ITEMS.w_sword.atk<RPG.ITEMS.sword.atk&&RPG.ITEMS.w_leather.def<=RPG.ITEMS.leather.def'),'worn gear not worse than new')
  check(L(pg,'return [0,1,2,3].every(t=>E.stock(t).gear.every(id=>RPG.ITEMS[id].worn))'),'shops sell non-worn gear');b.close()
def t_gear_items(p):
  b,pg=setup(p);check(L(pg,'return [0,1,2,3].every(t=>E.stock(t).basic.includes("lockpick")&&E.stock(t).basic.includes("rope"))'),'lockpicks/rope not sold');b.close()
def t_cook_learn(p):
  b,pg=setup(p);L(pg,'L.party[0].bag.push("i_bread","i_butter","i_bread","i_herbs");')
  ev(pg,'SOTA.rpg.s5.cookbook()');check(ev(pg,'document.querySelectorAll(".s5rc").length')==20,'guide does not have 20 slots');check(ev(pg,'document.querySelectorAll(".s5rc.known").length')==0,'recipes shown before learning')
  ev(pg,'SOTA.rpg.s5.cookScreen("c0")');tap(pg,'[data-ing=bread]');tap(pg,'[data-ing=herbs]');tap(pg,'#s5cook')
  check(L(pg,'return [X.haveN("i_bread"),X.haveN("i_herbs"),Object.keys(L.recipes).length]')==[1,0,0],'failed cook should use ingredients and learn nothing')
  tap(pg,'[data-ing=bread]');tap(pg,'[data-ing=butter]');tap(pg,'#s5cook')
  check(L(pg,'return [X.haveN("d_toast"),L.recipes.toast]')==[1,'earned'],'cook did not make toast / learn it')
  L(pg,'L.gold=500');ev(pg,'SOTA.rpg.s5.tavernScreen(0)');tap(pg,'[data-hub="1"]');tap(pg,'[data-tab=recipes]');tap(pg,'[data-recipe=broth]');check(L(pg,'return L.recipes.broth')=='bought','recipe not bought')
  ev(pg,'SOTA.rpg.s5.cookbook()');k=ev(pg,'[...document.querySelectorAll(".s5rc.known")].map(x=>x.dataset.rc+":"+x.className)')
  check(sorted(k)==['broth:s5rc known bought','toast:s5rc known earned'],f'guide marks wrong {k}')
  check('✎' in ev(pg,'document.querySelector("[data-rc=toast]").textContent') and '◉' in ev(pg,'document.querySelector("[data-rc=broth]").textContent'),'earned/bought marks missing');b.close()
def t_spoil(p):
  b,pg=setup(p);L(pg,'X.giveDish("d_toast");L.party[0].bag.push("i_egg");')
  check(L(pg,'return X.haveN("d_toast")')==1,'no dish')
  L(pg,'L.steps+=E.SPOIL_STEPS-1;X.checkSpoil();');check(L(pg,'return X.haveN("d_toast")')==1,'spoiled too early')
  L(pg,'L.steps+=1;X.checkSpoil();');check(L(pg,'return [X.haveN("d_toast"),X.haveN("i_egg")]')==[0,1],'dish did not spoil or raw food spoiled')
  b.close()
def t_spoil_steps_walk(p):
  b,pg=setup(p);L(pg,'X.giveDish("d_toast");L.fresh.d_toast=[L.steps+1];');ev(pg,'localStorage.setItem("sota.devNoFight","1")') if False else None
  ev(pg,'SOTA.rpg.live().party.forEach(c=>c.hp=9999)');s0=L(pg,'return L.steps')
  for _ in range(3):
    if ev(pg,'SOTA.canMove(SOTA.state().x,SOTA.state().y,SOTA.state().f)'):tap(pg,'[data-cmd=fwd]');finish(pg)
    else:tap(pg,'[data-cmd=right]')
  check(L(pg,'return L.steps')>s0,'walking does not count steps');check(L(pg,'return X.haveN("d_toast")')==0,'dish did not spoil while walking');b.close()
def t_eat_effects(p):
  b,pg=setup(p);L(pg,'const c=L.party[0];c.hp=1;X.giveDish("d_fowl");X.giveDish("d_ironbread");')
  tap(pg,'#partyb');tap(pg,'[data-card="0"]');tap(pg,'.s4bag [data-item=d_fowl]');tap(pg,'[data-eat]')
  check(L(pg,'const c=L.party[0];return c.hp>1&&X.haveN("d_fowl")===0'),'eating did not heal')
  a0=L(pg,'return RPG.power(L.party[0])');tap(pg,'.s4bag [data-item=d_ironbread]');tap(pg,'[data-eat]');a1=L(pg,'return RPG.power(L.party[0])')
  check(a1>a0*1.1,'strength buff not applied');L(pg,'for(let i=0;i<5;i++)X.tickBuffs();');check(abs(L(pg,'return RPG.power(L.party[0])')-a0)<0.01,'buff did not wear off after its fights');b.close()
def t_tent_rules(p):
  b,pg=setup(p);cp=ev(pg,'MAZE.camps[0]');ev(pg,'SOTA.rpg.live().gold=999');step_into(pg,cp)
  sv=json.loads(ev(pg,'localStorage.getItem("sota.party")'));check(sv['gold']!=999,'saved at a camp without a tent')
  check(ev(pg,'SOTA.rpg.doSave()')==False,'doSave at camp without tent')
  L(pg,'L.party[0].bag.push("tent");');check(ev(pg,'SOTA.rpg.doSave()')==True,'no save with a tent')
  check(L(pg,'return RPG.ITEMS.tent.w')==0,'tent has weight')
  tv=ev(pg,'MAZE.taverns[0]');ev(pg,'SOTA.rpg.live().gold=5');L(pg,'L.party.forEach(c=>c.bag=c.bag.filter(x=>x!=="tent"))');step_into(pg,tv);sv=json.loads(ev(pg,'localStorage.getItem("sota.party")'));check(sv['gold']==5,'tavern without tent did not save')
  # wear: a tent lasts E.TENT.nights different camps
  n=L(pg,'return E.TENT.nights');L(pg,'L.party[0].bag.push("tent");L.tentWear=0;')
  for i in range(n):
    c2=ev(pg,f'MAZE.camps[{i%len(ev(pg,"MAZE.camps"))}]');ev(pg,'a=>SOTA.teleport(a[0],a[1],0)',c2);check(ev(pg,'SOTA.rpg.doSave()'),f'night {i} failed')
    ev(pg,'a=>SOTA.teleport(a[0],a[1],0)',tv);ev(pg,'SOTA.rpg.doSave()')
  check(L(pg,'return X.haveN("tent")')==0,'tent did not wear out');b.close()
def t_tent_costs(p):
  b,pg=setup(p)
  r=L(pg,'const T=E.TENT;return {buy:T.buy,fee:T.fee,w:RPG.ITEMS.tent.w,partsShop:Object.entries(T.parts).reduce((s,[id,n])=>s+n*E.price(id),0),raw:Object.entries(T.parts).reduce((s,[id,n])=>s+n*E.sellPrice(id),0),resale:E.sellPrice("tent")}')
  check(r['buy']==100 and E_ok(r),f'tent buy price should be 100 {r}')
  check(r['buy']>=2*(r['fee']+r['raw']),f'building from own parts should be clearly cheaper {r}');check(r['w']==0,'tent has weight')
  check(r['resale']<r['fee']+r['raw'],'a built tent sells for profit')
  check(L(pg,'return [0,1].every(t=>!E.stock(t).parts.length)&&[2,3].every(t=>E.stock(t).parts.includes("p_silk")&&E.stock(t).parts.includes("p_hide"))'),'parts sold at the wrong taverns')
  g=L(pg,'const g=z=>{let s=0;for(let i=0;i<200;i++)s+=RPG.loot(z,i).gold;return s/200};return [g(1),g(4)]')
  check(r['buy']/g[1]<2,f'in zone 4 a tent should cost under 2 fights {g}');b.close()
def E_ok(r):return True
def t_tent_build_ui(p):
  b,pg=setup(p);L(pg,'L.gold=100;const c=L.party[0];for(let i=0;i<4;i++)c.bag.push("p_silk");for(let i=0;i<3;i++)c.bag.push("p_hide");c.bag.push("p_shard","p_shard","p_feather","p_feather","p_feather");')
  ev(pg,'SOTA.rpg.s5.tentScreen(2)');check(ev(pg,'document.querySelectorAll(".s5need.ok").length')==3,'parts not shown as ready')
  tap(pg,'[data-build=junk]');r=L(pg,'return [X.haveN("tent"),L.gold,X.haveN("p_silk"),X.haveN("p_feather")]')
  check(r[0]==1 and r[2]==0,f'tent not built {r}');check(r[3]<3 and r[1]==100-max(0,10-22*(3-r[3])),f'fee not paid with junk {r}')
  L(pg,'L.gold=10');ev(pg,'SOTA.rpg.s5.tentScreen(2)');tap(pg,'[data-buytent]');check(L(pg,'return X.haveN("tent")')==1,'bought a tent with 10 gold')
  L(pg,'L.gold=999;L.party.forEach(c=>c.bag=c.bag.filter(x=>!x.startsWith("p_")))');ev(pg,'SOTA.rpg.s5.tentScreen(2)');tap(pg,'[data-build=gold]');check(L(pg,'return [X.haveN("tent"),L.gold]')==[1,999],'built a tent without parts');b.close()
def t_give_item(p):
  for w,h in[(360,800),(390,844),(412,915)]:
    b,pg=setup(p,w,h);L(pg,'L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1));L.party[0].bag.push("j_tooth");')
    tap(pg,'#partyb');tap(pg,'[data-card="0"]');tap(pg,'.s4bag [data-item=j_tooth]');tap(pg,'[data-giveb]')
    ov=ev(pg,"""(()=>{const es=[...document.querySelectorAll('#s4info button,#s4info span,#s4info .s4row>div')].filter(x=>x.offsetParent&&x.textContent.trim());const bs=es.map(x=>x.getBoundingClientRect());let n=0;for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){if(es[i].contains(es[j])||es[j].contains(es[i]))continue;const a=bs[i],c=bs[j];if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)n++;}return n})()""")
    check(ov==0,f'{w}: give buttons overlap {ov}');
    gap=ev(pg,"""(()=>{const g=document.querySelector('#s4info .s5give').getBoundingClientRect(),d=[...document.querySelectorAll('#s4info button')].find(x=>x.textContent.trim()==='Drop').getBoundingClientRect();return g.top-d.bottom})()""")
    check(gap>=0,f'{w}: Give row sits on the Drop row ({gap}px)');check(ev(pg,'!!document.querySelector("#s4info [data-give]")'),'no give target')
    tap(pg,'#s4info [data-give]');check(L(pg,'return [L.party[0].bag.includes("j_tooth"),L.party[1].bag.includes("j_tooth")]')==[False,True],'item not moved');b.close()
def t_levelup_popup(p):
  b,pg=setup(p);ev(pg,'SOTA.rpg.live().party[0].xp=RPG.xpNeed(1)-1');ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])');ev(pg,'SOTA.rpg.forceEnd("win")')
  check(ev(pg,'!!document.getElementById("s5lvl")'),'no level-up popup');check('level' in ev(pg,'document.getElementById("s5lvl").textContent'),'popup text')
  bx=ev(pg,'(()=>{const a=document.getElementById("s5lvl").getBoundingClientRect(),d=document.getElementById("fdone").getBoundingClientRect();return [a.bottom,d.top]})()');check(bx[0]<=bx[1],'popup covers Continue')
  tap(pg,'#s5lvlok');check(ev(pg,'!document.getElementById("s5lvl")'),'popup did not close');tap(pg,'#fdone');b.close()
def t_place_tab(p):
  b,pg=setup(p);tv=ev(pg,'MAZE.taverns[0]');step_into(pg,tv);pg.wait_for_timeout(500)
  check(ev(pg,'getComputedStyle(document.getElementById("s5here")).display')=='block','no tavern tab');check('Tavern 1' in ev(pg,'document.getElementById("s5here").textContent'),'tab text')
  tap(pg,'#s5here');check(ev(pg,'SOTA.rpg.ui()')=='tavern','tab did not open tavern');b.close()
def t_save_keeps_s5(p):
  b,pg=setup(p);L(pg,'L.recipes.toast="earned";L.party[0].bag.push("tent");');tv=ev(pg,'MAZE.taverns[0]');step_into(pg,tv);pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg')
  check(L(pg,'return [L.recipes.toast,X.haveN("tent")]')==['earned',1],'recipes/tent lost over save');b.close()
def t_fit_s5(p):
  for w,h in[(390,844),(360,800),(412,915)]:
    b,pg=setup(p,w,h);L(pg,'L.gold=50;for(let i=0;i<8;i++)L.party[0].bag.push("i_egg","j_tooth");')
    for js in['SOTA.rpg.s5.buyScreen(3)','SOTA.rpg.s5.shopList(3,"recipes")','SOTA.rpg.s5.shopList(3,"food")','SOTA.rpg.s5.shopList(3,"craft")','SOTA.rpg.s5.sellScreen(3)','SOTA.rpg.s5.tavernScreen(3)','SOTA.rpg.s5.cookScreen("c0")','SOTA.rpg.s5.cookbook()','SOTA.rpg.s5.tentScreen(3)','SOTA.rpg.s5.campScreen(0)']:
      ev(pg,js);o=ev(pg,'(()=>{const W=innerWidth;return [...document.querySelectorAll("#s4 button")].filter(x=>{const r=x.getBoundingClientRect();return r.width&&(r.right>W+1||r.left<-1||r.height<43)}).map(x=>x.textContent)})()')
      check(not o,f'{w}x{h} {js}: off screen or small {o[:4]}')
      ov=ev(pg,"""(()=>{const bs=[...document.querySelectorAll('#s4 button,#s4 .s4note,#s4 .s4lab,#s4 .s5kc')].filter(x=>x.offsetParent).map(x=>[x,x.getBoundingClientRect()]);const o=[];for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const[x,a]=bs[i],[y,c]=bs[j];if(x.contains(y)||y.contains(x))continue;if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)o.push(x.textContent.slice(0,15)+"|"+y.textContent.slice(0,15));}return o})()""")
      check(not ov,f'{w}x{h} {js}: overlaps {ov[:3]}')
    b.close()
def t_offline5(p):
  b,c=ctx(p,sw=True);pg=c.new_page();pg.goto(S4.BASE+'index.html');pg.wait_for_function('navigator.serviceWorker.ready.then(()=>true)');pg.reload();pg.wait_for_function('window.SOTA&&navigator.serviceWorker.controller')
  ok=pg.evaluate('(async()=>{const k=await caches.keys();const c=await caches.open("sota-s1-v18");return [k,!!(await c.match("econ.js?v=14"))]})()')
  check(ok==[['sota-s1-v18'],True],f'econ.js not cached {ok}');c.set_offline(True);pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');check(ev(pg,'!!window.ECON&&ECON.DISHES.length===20'),'ECON missing offline');b.close()
def t_s5_code_clean(p):
  src=''.join(open(os.path.join(ROOT,f)).read() for f in['econ.js','party.js'])
  check('fetch(' not in src and 'http' not in src and 'XMLHttpRequest' not in src,'network in stage 5 code')
  check(not any(w in src.lower() for w in['adsbygoogle','advert','admob']),'ad code')
T=[(n[2:],f) for n,f in list(globals().items()) if n.startswith('t_')]
if __name__=='__main__':
  fails=0
  selected=[(n,f) for n,f in T if not ONLY or n in ONLY]
  with sync_playwright() as p:
    for n,f in selected:
      t=time.time();ERRS.clear()
      try:
        f(p);check(not ERRS,f'console errors {ERRS[:3]}');print(f'PASS {n} ({time.time()-t:.1f}s)')
      except Exception as e:fails+=1;print(f'FAIL {n}: {str(e)[:400]}')
  print(f'STAGE 5: {len(selected)-fails} passed, {fails} failed ({len(selected)} selected)');sys.exit(1 if fails else 0)
