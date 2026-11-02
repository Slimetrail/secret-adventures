"""Stage 5 screenshots on a pretend phone: python tools/shots5.py [base_url] [outdir]"""
import sys,os
sys.argv=[sys.argv[0],sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/']+sys.argv[2:]
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tests'))
from stage5_tests import *
OUT=sys.argv[2] if len(sys.argv)>2 else os.path.join(ROOT,'..','shots5')
os.makedirs(OUT,exist_ok=True)
def shot(pg,n,w,h):pg.wait_for_timeout(350);pg.screenshot(path=os.path.join(OUT,f's5-{n}-{w}x{h}.png'))
with sync_playwright() as p:
  for w,h in[(390,844),(360,800),(412,915)]:
    b,pg=setup(p,w,h)
    L(pg,'L.gold=240;L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1));const c=L.party[0];c.bag.push("j_tooth","j_tooth","j_tooth","p_silk","p_silk","i_bread","i_butter","i_egg","i_herbs");L.recipes.toast="earned";L.recipes.broth="bought";X.giveDish("d_toast");')
    ev(pg,'SOTA.rpg.s5.tavernScreen(2)');shot(pg,'tavern',w,h)
    tap(pg,'[data-tab=buy]');tree(pg,'Food');shot(pg,'tavern-buy',w,h);ev(pg,'SOTA.rpg.closeBranch()')
    tap(pg,'[data-tab=sell]');tree(pg,L(pg,'return L.party[0].name'));shot(pg,'tavern-sell',w,h);ev(pg,'SOTA.rpg.closeBranch()')
    ev(pg,'SOTA.rpg.s5.cookScreen("c0")');tap(pg,'[data-ing=bread]');tap(pg,'[data-ing=butter]');shot(pg,'cook',w,h)
    ev(pg,'SOTA.rpg.s5.cookbook()');shot(pg,'cooking-guide',w,h)
    ev(pg,'SOTA.rpg.s5.tentScreen(2)');shot(pg,'tent',w,h)
    ev(pg,'SOTA.rpg.s5.campScreen(0)');shot(pg,'camp',w,h)
    ev(pg,'SOTA.rpg.closeBranch();SOTA.rpg.charScreen(0)');tap(pg,'.s4bag [data-item=j_tooth]');tap(pg,'[data-giveb]');noslide(pg);shot(pg,'item-moving',w,h);ev(pg,'SOTA.rpg.closeBranch()')
    ev(pg,'SOTA.rpg.live().party[0].xp=RPG.xpNeed(1)-1');ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])');ev(pg,'SOTA.rpg.forceEnd("win")');shot(pg,'level-up',w,h)
    b.close()
print('shots in',OUT)
