"""Fight v3 screenshots (pretend phone: Playwright Chromium, touch). Output: /workspace/secret-adventures/stage4-fix-shots/v3-*"""
import sys,os
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tests'));sys.argv=[sys.argv[0]]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
OUT='/workspace/secret-adventures/stage4-fix-shots/';os.makedirs(OUT,exist_ok=True)
def shot(pg,tag,name,wait=150):pg.wait_for_timeout(wait);pg.screenshot(path=OUT+f'v3-{tag}-{name}.png')
with sync_playwright() as p:
  for w,h in T.SIZES:
    tag=f'{w}x{h}';b,c=T.ctx(p,w,h);pg=T.fresh(c);T.full_create(pg,'Wes');T.fight4(pg);pg.wait_for_timeout(300)
    shot(pg,tag,'1-fight-idle')
    T.ev(pg,'document.querySelector("#fparty [data-hero=\'0\']").click()');pg.wait_for_timeout(70);pg.screenshot(path=OUT+f'v3-{tag}-2a-mid-slide.png');T.noslide(pg)
    shot(pg,tag,'2-tree-slid-in');T.ttap(pg,'#s4br [data-cmd4=attack]');shot(pg,tag,'3-targets')
    T.ttap(pg,'#s4br [data-back="1"]');T.ttap(pg,'#s4br [data-cmd4=spells]');shot(pg,tag,'4-spells-list')
    T.ev(pg,'SOTA.rpg.closeBranch()');T.ev(pg,'SOTA.rpg.forceEnd("win")');shot(pg,tag,'5-win');b.close()
  b,c=T.ctx(p,915,412);pg=T.fresh(c);shot(pg,'915x412','6-sideways-notice',300);b.close()
print('done')
