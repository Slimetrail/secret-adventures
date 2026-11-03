"""Stage 5 fix-round screenshots on a pretend phone: python tools/shots5fix.py [base_url] [outdir]"""
import sys,os
sys.argv=[sys.argv[0],sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/']+sys.argv[2:]
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tests'))
from stage5_tests import *
OUT=sys.argv[2] if len(sys.argv)>2 else os.path.join(ROOT,'..','stage4-fix-shots')
os.makedirs(OUT,exist_ok=True)
def shot(pg,n,w,h):pg.wait_for_timeout(350);ev(pg,'document.getElementById("s4toast").classList.remove("on")');pg.wait_for_timeout(400);pg.screenshot(path=os.path.join(OUT,f's5fix-{n}-{w}x{h}.png'))
with sync_playwright() as p:
  for w,h in[(390,844),(360,800),(412,915)]:
    b,pg=setup(p,w,h)
    L(pg,'L.gold=240;L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1));const c=L.party[0];c.bag.push("j_tooth","j_tooth","j_tooth","p_silk","p_silk","i_bread","i_egg");L.party[1].bag.push("rope","i_herbs");')
    ev(pg,'SOTA.rpg.s5.tavernScreen(2)');shot(pg,'shop-main',w,h)
    tap(pg,'[data-tab=buy]');shot(pg,'buy',w,h)
    for k in['recipes','food','craft']:tap(pg,f'[data-tab={k}]');shot(pg,k,w,h);tap(pg,'.s4head button')
    ev(pg,'SOTA.rpg.s5.sellScreen(2)');shot(pg,'sell',w,h)
    ev(pg,'SOTA.rpg.charScreen(0)');tap(pg,'.s4bag [data-item=j_tooth]');tap(pg,'[data-giveb]');noslide(pg);shot(pg,'give',w,h)
    b.close()
print('shots in',OUT)
