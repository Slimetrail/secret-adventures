"""Stage 4 screenshots (pretend phone, 390x844)."""
import sys,os
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tests'));sys.argv=[sys.argv[0]]
import stage4_tests as T
from playwright.sync_api import sync_playwright
OUT='/workspace/secret-adventures/stage4-shots/';os.makedirs(OUT,exist_ok=True)
with sync_playwright() as p:
  b,c=T.ctx(p,390,844);pg=T.page(c);pg.wait_for_timeout(300);pg.screenshot(path=OUT+'01-walk-make-hero-hint.png')
  T.tap(pg,'#partyb');T.tap(pg,'[data-race=elf]');T.tap(pg,'[data-cls=mage]');pg.fill('#ccname','Jeremy');pg.screenshot(path=OUT+'02-character-creation.png')
  for k in['man','man','sta','sta','str']:T.tap(pg,f'[data-inc={k}]')
  T.tap(pg,'[data-skill=bolt]');pg.screenshot(path=OUT+'03-stat-spending.png');T.tap(pg,'#ccgo');pg.wait_for_timeout(2500)
  T.ev(pg,'SOTA.rpg.live().party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1),RPG.makeCompanion(RPG.COMPANIONS[1],1))')
  T.ev(pg,'SOTA.teleport(14,56,0)');T.ev(pg,'SOTA.rpg.startFight([0,4,5].map(i=>RPG.makeMonster(1,i,1,0,"normal")).map(m=>(m.hp=m.max=m.hp*4,m)))');pg.wait_for_timeout(300);pg.screenshot(path=OUT+'04-fight-party-menu.png')
  T.tap(pg,'[data-cmd4=skill]');pg.screenshot(path=OUT+'05-fight-skill-menu.png');T.tap(pg,'[data-sk=bolt]');T.tap(pg,'[data-tgt="1"]');pg.wait_for_timeout(230);pg.screenshot(path=OUT+'06-magic-effect.png')
  T.ev(pg,'SOTA.rpg.fight().m.forEach(m=>m.hp=1)');T.tap(pg,'[data-cmd4=attack]');T.tap(pg,'[data-tgt]')
  while T.ev(pg,'!SOTA.rpg.fight().over'):T.tap(pg,'[data-cmd4=attack]');T.tap(pg,'[data-tgt]')
  pg.wait_for_timeout(300);pg.screenshot(path=OUT+'07-win-screen.png');T.tap(pg,'#fdone')
  cp=T.ev(pg,'MAZE.camps[0]');T.step_into(pg,cp);pg.wait_for_timeout(300);pg.screenshot(path=OUT+'08-camp-saved.png')
  T.ev(pg,'SOTA.teleport(5,63,0)');pg.wait_for_timeout(2300);T.ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(5,1,40,1,"hard")])')
  while T.ev(pg,'!SOTA.rpg.fight().over'):T.tap(pg,'[data-cmd4=defend]')
  pg.wait_for_timeout(300);pg.screenshot(path=OUT+'09-party-fallen.png');T.tap(pg,'#fdone');pg.wait_for_timeout(400);pg.screenshot(path=OUT+'10-restored-at-camp.png')
  T.ev(pg,'SOTA.rpg.live().party[0].bag.push("ring","j_bone","tome","cap")');pg.wait_for_timeout(2300);T.tap(pg,'#partyb');pg.screenshot(path=OUT+'11-party-screen.png')
  T.tap(pg,'[data-equip="0"]');T.tap(pg,'[data-slot=offhand]');pg.screenshot(path=OUT+'12-equip-screen.png')
  T.tap(pg,'.s4back');T.tap(pg,'[data-bag="0"]');pg.screenshot(path=OUT+'13-backpack.png');b.close()
print('ok')
