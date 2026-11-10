"""Jeremy t2437u: the maze item boxes show an original 8-bit bottle - red for the Healing potion, blue for the Mana potion (ether) -
instead of a plain text label. t2476u (Jeremy): the name now also shows under the bottle; it stays in aria-label/title, other items still show their name, a tap still uses the potion through
the same Use -> 'Use on <name>' steps, and the bag count (shown as xN in the box picker) still counts down by one.
Usage: python tests/t2437u_potion_bottles_browser_test.py [base_url]"""
import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
passed=failed=0
def run(name,f,p):
  global passed,failed
  try:f(p);passed+=1;print('PASS',name)
  except Exception as e:failed+=1;print('FAIL',name,e)
BOX='''i=>{const b=document.querySelector('#slots [data-slot="'+i+'"]'),s=b.querySelector('svg.pbottle'),r=s&&s.getBoundingClientRect();
 return {text:b.textContent.trim(),icon:b.dataset.icon||"",bottle:s?s.dataset.bottle:null,fills:s?[...new Set([...s.querySelectorAll('rect')].map(x=>x.getAttribute('fill')))]:[],
  w:r?r.width:0,h:r?r.height:0,aria:b.getAttribute('aria-label'),title:b.getAttribute('title')}}'''
def setup(p,w=473,h=1024,dsf=1080/473):
  b=p.chromium.launch();c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=dsf,has_touch=True,is_mobile=w<1000,service_workers='block')
  c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}")
  pg=T.fresh(c);T.full_create(pg,'Leonidas','human','warrior');T.ev(pg,'SOTA.rpg.live().party[0].name="Leonidas"');return b,pg
def tap_text(pg,t):
  k=T.ev(pg,'t=>{const b=[...document.querySelectorAll("button")].filter(b=>b.offsetParent&&b.textContent.trim()===t).pop();if(!b)return null;const k="b"+Math.random().toString(36).slice(2);b.dataset.t2437=k;return k}',t)
  T.check(k,'no button '+t);T.ttap(pg,f'[data-t2437="{k}"]')
def potions(pg,id):return T.ev(pg,f'SOTA.rpg.live().party.reduce((t,c)=>t+c.bag.filter(x=>x==="{id}").length,0)')
def t_icons(p):
  for w,h,dsf in ((473,1024,1080/473),(1280,800,1)):
    b,pg=setup(p,w,h,dsf)
    T.check(T.ev(pg,'SOTA.rpg.assignMazeSlot(0,"potion")') and T.ev(pg,'SOTA.rpg.assignMazeSlot(1,"ether")'),'could not fill the boxes')
    T.ev(pg,'SOTA.rpg.live().party[0].bag.push("ration")');T.check(T.ev(pg,'SOTA.rpg.assignMazeSlot(2,"ration")'),'ration box');pg.wait_for_timeout(100)
    r,bl,ra,e=[T.ev(pg,BOX,i) for i in range(4)]
    T.check(r['bottle']=='potion' and '#d8343a' in r['fills'] and r['text']=='Healing potion',f'{w}: box 1 not a red bottle {r}')
    T.check(bl['bottle']=='ether' and '#3a6ee0' in bl['fills'] and bl['text']=='Mana potion',f'{w}: box 2 not a blue bottle {bl}')
    T.check('Healing potion' in r['aria'] and r['title']=='Healing potion' and 'Mana potion' in bl['aria'] and bl['title']=='Mana potion',f'{w}: names lost from aria/title {r} {bl}')
    T.check(r['h']>=20 and abs(r['w']/r['h']-12/14)<0.05,f'{w}: bottle size/shape off {r}')
    T.check(ra['bottle'] is None and ra['text']=='Ration','other items lost their name');T.check(e['text']==''and e['bottle'] is None,'empty box changed')
    T.ev(pg,'SOTA.rpg.clearMazeSlot(1)');pg.wait_for_timeout(50);bl=T.ev(pg,BOX,1);T.check(bl['bottle'] is None and bl['icon']=='' and bl['text']=='','cleared box kept the bottle')
    b.close()
def t_tap_uses(p):
  b,pg=setup(p);T.ev(pg,'SOTA.rpg.assignMazeSlot(0,"potion");SOTA.rpg.assignMazeSlot(1,"ether")')
  T.ev(pg,'(()=>{const c=SOTA.rpg.live().party[0];c.hp=5;c.mp=0;})()');n0,m0=potions(pg,'potion'),potions(pg,'ether')
  T.ttap(pg,'#slots [data-slot="1"]');T.check(T.ev(pg,'SOTA.rpg.ui()')=='maze-slot','tap did not open the box')
  tap_text(pg,'Replace');T.check(f'Mana potion ×{m0}' in T.ev(pg,'document.body.textContent'),'picker count missing');T.ev(pg,'SOTA.rpg.closeUI()')
  T.ttap(pg,'#slots [data-slot="0"]');tap_text(pg,'Use');tap_text(pg,'Use on Leonidas');pg.wait_for_timeout(150)
  T.check(potions(pg,'potion')==n0-1,f'potion count {n0} -> {potions(pg,"potion")}');T.check(T.ev(pg,'SOTA.rpg.live().party[0].hp')>5,'potion did not heal')
  r=T.ev(pg,BOX,0);T.check(r['bottle'] is None and r['text']=='','box 0 should be empty after use (same as before)')
  T.ttap(pg,'#slots [data-slot="1"]');tap_text(pg,'Use');tap_text(pg,'Use on Leonidas');pg.wait_for_timeout(150)
  T.check(potions(pg,'ether')==m0-1 and T.ev(pg,'SOTA.rpg.live().party[0].mp')>0,'mana potion tap did not work');b.close()
with sync_playwright() as p:
  for n,f in [('red/blue 8-bit bottles replace the names (1080 px phone and 1280x800); names kept in aria/title',t_icons),('a tap still uses the potion; count goes down by one',t_tap_uses)]:run(n,f,p)
print(f'{passed} passed, {failed} failed');print('page errors:',T.ERRS[:5]);sys.exit(1 if failed or T.ERRS else 0)
