"""Jeremy t2341u/t2342u/t2343u on a pretend phone, through real taps on the fight menu.
A menu Attack never changes MP for all four classes; Skill/Spells cost their listed MP;
a level-up refills HP/MP; the journal Recipes tab lists crafted recipes.
Usage: python tests/t2341u_mana_menu_browser_test.py [base_url]"""
import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
CLASSES=[('warrior','human'),('rogue','human'),('archer','human'),('mage','human')]
passed=failed=0
def run(name,f,p):
  global passed,failed
  try:f(p);passed+=1;print('PASS',name)
  except Exception as e:failed+=1;print('FAIL',name,e)
def setup(p,cls,race,skill=None):
  b,c=T.ctx(p);pg=T.fresh(c);T.full_create(pg,'Tess',race,cls,skill);return b,pg
def tough(pg):T.ev(pg,'SOTA.rpg.startFight([0,1].map(i=>{const m=RPG.makeMonster(1,i,1,0,"normal");m.hp=m.max=900;m.atk=0;return m}))')
def menu_attack(pg,tgt=0):
  T.ttap(pg,'#fparty [data-hero="0"]');T.ttap(pg,'#s4br [data-cmd4=attack]');T.ttap(pg,f'#s4br [data-tgt="{tgt}"]');pg.wait_for_timeout(300)
mp=lambda pg:T.ev(pg,'SOTA.rpg.live().party[0].mp')
mx=lambda pg:T.ev(pg,'RPG.maxMp(SOTA.rpg.live().party[0])')
def t_attack_keeps_mp(p):
  for cls,race in CLASSES:
    for half in (False,True):
      b,pg=setup(p,cls,race);tough(pg)
      if half:T.ev(pg,'SOTA.rpg.live().party[0].mp=Math.floor(RPG.maxMp(SOTA.rpg.live().party[0])/2)')
      for rnd in range(4):
        m0=mp(pg)
        if rnd==2:  # look at Skill/Spells first, back out, then Attack, like a real player
          T.ttap(pg,'#fparty [data-hero="0"]');sel='#s4br [data-cmd4=skill]' if T.ev(pg,'!!document.querySelector("#s4br [data-cmd4=skill]")') else '#s4br [data-cmd4=spells]'
          T.ttap(pg,sel)
          if not T.visible(pg,'#s4br [data-cmd4=attack]'):T.ttap(pg,'#s4br [data-back="1"]')
          T.ttap(pg,'#s4br [data-cmd4=attack]');T.ttap(pg,'#s4br [data-tgt="1"]');pg.wait_for_timeout(300)
        else:menu_attack(pg,rnd%2)
        T.check(mp(pg)==m0,f'{cls}: Attack changed MP {m0}->{mp(pg)}')
        T.check('hits' in T.ev(pg,'SOTA.rpg.fight().log.slice(-3).join(" ")'),f'{cls}: Attack did not hit')
      b.close()
def t_skill_costs_listed(p):
  for cls,race in CLASSES:
    b,pg=setup(p,cls,race);tough(pg)
    sk=T.ev(pg,'(()=>{const c=SOTA.rpg.live().party[0];const s=RPG.SKILLS[c.cls].find(x=>x.id===c.skills[0]);return {id:s.id,mp:s.mp,k:s.k,all:!!s.all}})()')
    m0=mp(pg);T.ttap(pg,'#fparty [data-hero="0"]')
    T.ttap(pg,'#s4br [data-cmd4=skill]' if sk['k'] in ('phys','guard') else '#s4br [data-cmd4=spells]')
    T.check(f"{sk['mp']}MP" in T.ev(pg,f'document.querySelector("#s4br [data-sk={sk["id"]}]").textContent'),'label without MP')
    T.ttap(pg,f'#s4br [data-sk={sk["id"]}]')
    if sk['k'] in ('phys','magic') and not sk['all']:T.ttap(pg,'#s4br [data-tgt="0"]')
    pg.wait_for_timeout(300);T.check(mp(pg)==m0-sk['mp'],f"{cls} {sk['id']}: MP {m0}->{mp(pg)}, listed {sk['mp']}");b.close()
def t_levelup_refills(p):
  for cls,race in CLASSES:
    b,pg=setup(p,cls,race)
    T.ev(pg,'(()=>{const h=SOTA.rpg.live().party[0];h.xp=RPG.xpNeed(h.lvl)-1;h.mp=1;h.hp=3;})()')
    T.ev(pg,'SOTA.rpg.startFight([(()=>{const m=RPG.makeMonster(1,0,1,0,"normal");m.hp=m.max=1;m.atk=0;return m})()])')
    menu_attack(pg);pg.wait_for_timeout(500)
    L=T.ev(pg,'(()=>{const h=SOTA.rpg.live().party[0];return [h.lvl,h.mp,RPG.maxMp(h),h.hp,RPG.maxHp(h,RPG.DIFF[SOTA.rpg.live().diff].hp)]})()')
    T.check(L[0]==2,f'{cls}: no level-up');T.check(L[1]==L[2] and L[3]==L[4],f'{cls}: level-up did not refill {L}');b.close()
def t_journal_recipes(p):
  b,pg=setup(p,'warrior','human')
  T.ev(pg,'(()=>{const L=SOTA.rpg.live();L.party[0].bag.push("i_herbs","p_shell");SOTA.rpg.s5.craftTry(["i_herbs","p_shell"]);})()')
  T.ev(pg,'SOTA.intro.openJournal("recipes")');pg.wait_for_timeout(200)
  T.check(T.ev(pg,'document.querySelector("#ijour [data-crafts]").dataset.crafts')=='1','Crafting count missing')
  T.check('Healing potion' in T.ev(pg,'document.querySelector("#ijour [data-craft=potion]").textContent'),'potion recipe not in journal');b.close()
with sync_playwright() as p:
  for n,f in [('attack keeps MP (4 classes, full and half MP)',t_attack_keeps_mp),('skill/spell costs listed MP',t_skill_costs_listed),('level-up refills HP/MP',t_levelup_refills),('journal Recipes lists crafts',t_journal_recipes)]:run(n,f,p)
print(f'{passed} passed, {failed} failed');print('page errors:',T.ERRS[:5]);sys.exit(1 if failed or T.ERRS else 0)
