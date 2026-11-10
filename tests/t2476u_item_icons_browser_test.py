"""t2476u at 360x640: every place items appear shows the item's own 8-bit icon with its name still visible as text:
 bag grid, equip options, shop buy list, sell list, maze item boxes (name under the icon; aria-label and title kept),
 fight Items menu, and the win/loot line. Also checks every icon on a page is a different picture per item id.
Usage: python tests/t2476u_item_icons_browser_test.py [base_url]"""
import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
passed=failed=0
def run(name,f,p):
  global passed,failed
  try:f(p);passed+=1;print('PASS',name,flush=True)
  except Exception as e:failed+=1;print('FAIL',name,repr(e)[:500],flush=True)
BAG=["potion","ether","salts","ration","tent","i_herbs","i_fish","d_stew","p_silk","p_hide","j_gem","rope","z1_camp_bow","z2_oak_buckler","lockpick"]
def setup(p):
  b=p.chromium.launch();c=b.new_context(viewport={'width':360,'height':640},device_scale_factor=2,has_touch=True,is_mobile=True,service_workers='block')
  c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}");pg=T.fresh(c);T.full_create(pg,'Tess','human','warrior')
  T.ev(pg,'b=>{const L=SOTA.rpg.live();L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1));L.gold=900;L.party[0].bag.push(...b);}',BAG);return b,pg
# each icon: id, visible size, and whether the element that holds it still shows the item name as text
ICONS='''sel=>[...document.querySelectorAll(sel)].map(e=>{const s=e.querySelector("svg.iic-svg,svg.pbottle");if(!s)return {none:e.outerHTML.slice(0,80)};const r=s.getBoundingClientRect(),id=s.dataset.iconId||s.dataset.bottle;
 const it=RPG.ITEMS[id];return {id,w:r.width,h:r.height,named:!!it&&e.textContent.includes(it.n),vis:r.width>0&&r.left>=-1&&r.right<=innerWidth+1}})'''
def icons(pg,sel,min_n=1):
  r=T.ev(pg,ICONS,sel);T.check(len(r)>=min_n,f'{sel}: only {len(r)} rows');bad=[x for x in r if 'none' in x or not x['named'] or x['w']<12 or not x['vis']]
  T.check(not bad,f'{sel}: icon missing/too small/name gone {bad[:3]}');return r
def t_bag(p):
  b,pg=setup(p);T.ev(pg,'SOTA.rpg.bagScreen(0)');pg.wait_for_timeout(200)
  r=icons(pg,'.s4bag .s4sq[data-item]',len(set(BAG)));T.check(all(x['id']==y for x,y in zip(r,T.ev(pg,'[...document.querySelectorAll(".s4bag .s4sq[data-item]")].map(e=>e.dataset.item)'))),'bag icon is not the item\'s own icon')
  T.check(len({x['id'] for x in r})==len(r),'two bag squares share an icon')
  T.ev(pg,'document.querySelector(\'.s4bag .s4sq[data-item="z2_oak_buckler"]\').click()');pg.wait_for_timeout(100)
  T.ev(pg,'(()=>{const s=document.querySelector(".s4sq.ok[data-slot]");s&&s.click();})()');pg.wait_for_timeout(100);b.close()
def t_shop(p):
  b,pg=setup(p);T.ev(pg,'SOTA.teleport(...MAZE.taverns[0],0)');T.ev(pg,'SOTA.rpg.s5.shopList(0,"buy")');pg.wait_for_timeout(200);icons(pg,'#s4 .s5row[data-buy]',3)
  T.ev(pg,'SOTA.rpg.closeUI()');T.ev(pg,'SOTA.rpg.s5.sellScreen(0)');pg.wait_for_timeout(200);icons(pg,'#s4 .s5row[data-sell]',5);b.close()
def t_maze(p):
  b,pg=setup(p);T.ev(pg,'SOTA.rpg.closeUI()')
  for i,id in enumerate(["potion","ether","ration","d_stew"]):T.check(T.ev(pg,f'SOTA.rpg.assignMazeSlot({i},"{id}")'),'could not fill box '+id)
  pg.wait_for_timeout(100);r=icons(pg,'#slots .slot[data-icon]:not([data-icon=""])',4)
  a=T.ev(pg,'[...document.querySelectorAll("#slots .slot")].map(b=>[b.getAttribute("aria-label"),b.getAttribute("title"),b.querySelector(".slotn")&&b.querySelector(".slotn").getBoundingClientRect().height])')
  T.check(all(x[0] and x[1] and x[0].endswith('('+x[1]+')') for x in a),f'aria/title lost {a}');T.check(all(x[2]>=8 for x in a),f'name under the icon not visible {a}');b.close()
def t_fight(p):
  b,pg=setup(p);T.ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")].map(m=>(m.hp=m.max=400,m)))');pg.wait_for_timeout(300)
  T.ev(pg,'(()=>{const n=document.querySelector(".s4nl:not(:disabled)");n.click();})()');pg.wait_for_timeout(200);T.ev(pg,'document.querySelector("[data-cmd4=item]").click()');pg.wait_for_timeout(200)
  r=icons(pg,'.s4bi[data-item]',3);T.check({'potion','ether','salts'}<={x['id'] for x in r},f'fight Items menu icons {r}');b.close()
def t_loot(p):
  b,pg=setup(p);T.ev(pg,'ECON.drops=()=>["p_silk","j_gem","i_herbs"]');T.ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")].map(m=>(m.hp=m.max=1,m)))');pg.wait_for_timeout(300)
  T.ev(pg,'(()=>{const n=document.querySelector(".s4nl:not(:disabled)");n.click();})()');pg.wait_for_timeout(150);T.ev(pg,'document.querySelector("[data-cmd4=attack]").click()');pg.wait_for_timeout(150)
  T.ev(pg,'document.querySelector("[data-tgt=\\"0\\"]").click()');pg.wait_for_timeout(500);T.check(T.ev(pg,'document.getElementById("s4").dataset.result')=='win','no win')
  r=icons(pg,'.s4loot[data-loot]',3);T.check('Found: ' in T.ev(pg,'document.querySelector(".s4loot").parentNode.textContent'),'Found line text changed');b.close()
with sync_playwright() as p:
  for n,f in [('bag grid icons + names',t_bag),('shop buy and sell lists',t_shop),('maze boxes: icon + name, aria/title kept',t_maze),('fight Items menu',t_fight),('loot line',t_loot)]:run(n,f,p)
print(f'{passed} passed, {failed} failed');print('page errors:',T.ERRS[:5]);sys.exit(1 if failed or T.ERRS else 0)
