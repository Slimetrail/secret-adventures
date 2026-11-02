"""Fix round 1 screenshots (pretend phone: Playwright Chromium, touch). Output: /workspace/secret-adventures/stage4-fix-shots/"""
import sys,os
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tests'));sys.argv=[sys.argv[0]]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
OUT='/workspace/secret-adventures/stage4-fix-shots/';os.makedirs(OUT,exist_ok=True)
def shot(pg,tag,name):pg.wait_for_timeout(120);pg.screenshot(path=OUT+f'pretend-phone-{tag}-{name}.png')
def fightset(pg):
  T.ev(pg,'SOTA.rpg.live().party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1),RPG.makeCompanion(RPG.COMPANIONS[1],1),RPG.makeCompanion(RPG.COMPANIONS[2],1))')
  T.ev(pg,'SOTA.rpg.startFight([0,1,2].map(i=>{const m=RPG.makeMonster(1,i,1,0,"normal");m.hp=m.max=300;return m}))')
with sync_playwright() as p:
  for w,h in T.SIZES:
    tag=f'{w}x{h}';full=(w,h)==(390,844);b,c=T.ctx(p,w,h);pg=T.fresh(c)
    shot(pg,tag,'c01-creation-opens-by-itself');T.ttap(pg,'#ccgo');shot(pg,tag,'c02-empty-name-message')
    T.type_name(pg,'Wes Swordmaw')
    if full:
      pg.set_viewport_size({'width':w,'height':h//2});shot(pg,tag,'c03-keyboard-open-small-viewport');pg.set_viewport_size({'width':w,'height':h})
    T.ttap(pg,'[data-race=elf]');shot(pg,tag,'c04-race-elf');T.ttap(pg,'[data-cls=mage]');shot(pg,tag,'c05-class-mage')
    for i in range(3):T.ttap(pg,'[data-inc=man]')
    shot(pg,tag,'c06-stats-partly-spent');T.ttap(pg,'[data-skill]');T.ttap(pg,'#ccgo');shot(pg,tag,'c07-points-left-warning')
    for _ in range(12):
      if T.left(pg)==0:break
      k=next(k for k in ['sta','str','man'] if not T.ev(pg,'k=>document.querySelector("[data-inc="+k+"]").classList.contains("off")',k));T.ttap(pg,f'[data-inc={k}]')
    print(tag,'left',T.left(pg),flush=True)
    T.ttap(pg,'[data-diff=normal]');shot(pg,tag,'c08-all-spent-skill-difficulty');T.ttap(pg,'#ccgo');pg.wait_for_timeout(300);shot(pg,tag,'c09-first-maze-view')
    pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');pg.wait_for_timeout(300);shot(pg,tag,'c10-after-reload')
    fightset(pg);pg.wait_for_timeout(300);shot(pg,tag,'f01-fight');T.ttap(pg,'#fparty [data-hero="0"]');shot(pg,tag,'f02-name-tapped-branch')
    T.ttap(pg,'#s4br [data-cmd4=attack]');shot(pg,tag,'f03-attack-targets');T.ttap(pg,'#s4br [data-cmd4=spells]');shot(pg,tag,'f04-spells-list')
    T.ttap(pg,'#s4br [data-cmd4=item]');shot(pg,tag,'f05-items-list');T.ttap(pg,'#s4br [data-cmd4=attack]');T.ttap(pg,'#s4br [data-tgt="0"]');pg.wait_for_timeout(200);shot(pg,tag,'f06-after-attack-next-turn')
    T.ttap(pg,'#fparty [data-hero="1"]');shot(pg,tag,'f07-second-hero-branch');T.ev(pg,'SOTA.rpg.closeBranch()')
    T.ev(pg,'SOTA.rpg.forceEnd("win")');shot(pg,tag,'f08-victory');T.ttap(pg,'#fdone')
    T.ev(pg,'SOTA.rpg.live().party[0].bag.push("plate","ring","leather")');T.ttap(pg,'#partyb');shot(pg,tag,'p01-party-cards')
    T.ttap(pg,'[data-card="0"]');shot(pg,tag,'p02-character-sheet');T.ttap(pg,'.s4bag [data-item=ring]');shot(pg,tag,'p03-sheet-item-selected-preview')
    T.ttap(pg,'.s4doll [data-slot=acc1]');shot(pg,tag,'p04-ring-equipped');T.ttap(pg,'.s4doll [data-slot=chest]');shot(pg,tag,'p05-slot-selected-options')
    T.ttap(pg,'.s4pk[data-pick="3"]');shot(pg,tag,'p06-sheet-other-character');b.close()
print('done')
