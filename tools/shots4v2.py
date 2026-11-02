"""Fight v2 screenshots (pretend phone: Playwright Chromium, touch). Output: /workspace/secret-adventures/stage4-fix-shots/v2-*"""
import sys,os
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tests'));sys.argv=[sys.argv[0]]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
OUT='/workspace/secret-adventures/stage4-fix-shots/';os.makedirs(OUT,exist_ok=True)
def shot(pg,tag,name):pg.wait_for_timeout(150);pg.screenshot(path=OUT+f'v2-{tag}-{name}.png')
with sync_playwright() as p:
  for w,h in T.SIZES:
    tag=f'{w}x{h}';b,c=T.ctx(p,w,h);pg=T.fresh(c);T.full_create(pg,'Wes')
    T.ev(pg,'SOTA.rpg.live().party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1),RPG.makeCompanion(RPG.COMPANIONS[1],1),RPG.makeCompanion(RPG.COMPANIONS[2],1))')
    T.ev(pg,'SOTA.rpg.startFight([0,1,2].map(i=>{const m=RPG.makeMonster(1,i,1,0,"normal");m.hp=m.max=300;return m}))');pg.wait_for_timeout(300)
    shot(pg,tag,'1-fight');T.ttap(pg,'#fparty [data-hero="0"]');shot(pg,tag,'2-tree-open')
    T.ttap(pg,'#s4br [data-cmd4=attack]');shot(pg,tag,'3-targets');T.ttap(pg,'#s4br [data-cmd4=spells]');shot(pg,tag,'4-spells-list')
    T.ev(pg,'SOTA.rpg.closeBranch()');T.ev(pg,'SOTA.rpg.forceEnd("win")');shot(pg,tag,'5-win');b.close()
print('done')
