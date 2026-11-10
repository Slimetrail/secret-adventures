"""Jeremy t2432u "Can we show health and mp so i can track?": every fight name-box shows labelled 'HP x/y' and 'MP x/y' under the
bars, for every party member, and the text follows the game: after a monster hit the HP text drops by the hit, after a skill/spell
the MP text drops by its listed cost, after a plain Attack MP stays. Taps the real fight menu on a pretend phone (473x1024 = 1080 px).
Usage: python tests/t2432u_hud_numbers_browser_test.py [base_url]"""
import sys,os,re
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
PANEL='''(()=>{const L=SOTA.rpg.live(),d=RPG.DIFF[L.diff].hp;return L.party.map((c,i)=>{const b=document.querySelector('#fparty [data-hero="'+i+'"]'),v=b&&b.querySelector('.s4vals');
 return {hp:c.hp,maxHp:RPG.maxHp(c,d),mp:c.mp,maxMp:RPG.maxMp(c),hpText:v&&v.children[0].textContent,mpText:v&&v.children[1].textContent,bars:b?b.querySelectorAll('.s4bar').length:0,
  clipped:b?(b.scrollWidth>b.clientWidth+1||[...v.children].some(x=>x.scrollWidth>x.clientWidth+1)):null}})})()'''
def setup(p,cls,race,skill):
  b=p.chromium.launch();c=b.new_context(viewport={'width':473,'height':1024},device_scale_factor=1080/473,has_touch=True,is_mobile=True,service_workers='block')
  c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}")
  pg=T.fresh(c);T.full_create(pg,'Leonidas',race,cls,skill)
  T.ev(pg,'(()=>{const L=SOTA.rpg.live(),h=L.party[0];h.name="Leonidas";while(h.lvl<5)RPG.gainXp(h,RPG.xpNeed(h.lvl)-h.xp,RPG.DIFF[L.diff].hp);L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],5));})()')
  return b,pg
def panel_ok(pg,where):
  P=T.ev(pg,PANEL)
  for i,m in enumerate(P):
    T.check(m['hpText']==f"HP {m['hp']}/{m['maxHp']}",f"{where} member {i}: shows {m['hpText']!r}, game HP {m['hp']}/{m['maxHp']}")
    T.check(m['mpText']==f"MP {m['mp']}/{m['maxMp']}",f"{where} member {i}: shows {m['mpText']!r}, game MP {m['mp']}/{m['maxMp']}")
    T.check(m['bars']==2,f'{where} member {i}: bars missing');T.check(not m['clipped'],f'{where} member {i}: numbers clipped')
  return P
def shown(P,i,k):return int(re.match(r'(?:HP|MP) (\d+)/',P[i][k+'Text']).group(1))
def start(pg):
  T.ev(pg,'SOTA.rpg.startFight([0,1].map(i=>{const m=RPG.makeMonster(1,i,5,0,"normal");m.hp=m.max=900;m.atk=40;return m}))');pg.wait_for_timeout(300)
  return panel_ok(pg,'fight start')
def hero_turn(pg,cmd,sk=None):
  T.ttap(pg,'#fparty .s4pr.now .s4nl')
  if cmd=='attack':T.ttap(pg,'#s4br [data-cmd4=attack]');T.ttap(pg,'#s4br [data-tgt="0"]')
  else:
    T.ttap(pg,'#s4br [data-cmd4=skill]' if T.ev(pg,'!!document.querySelector("#s4br [data-cmd4=skill]")') and T.ev(pg,f'!!(RPG.SKILLS.warrior.concat(RPG.SKILLS.rogue,RPG.SKILLS.archer).find(s=>s.id=="{sk}"))') else '#s4br [data-cmd4=spells]')
    T.ttap(pg,f'#s4br [data-sk="{sk}"]')
    if T.ev(pg,'!!document.querySelector("#s4br [data-tgt]")'):T.ttap(pg,'#s4br [data-tgt="0"]')
  pg.wait_for_timeout(300)
def t_monster_hit(p):
  b,pg=setup(p,'warrior','human','bash');P0=start(pg)
  hero_turn(pg,'attack');P1=panel_ok(pg,'after hero Attack')
  T.check(shown(P1,0,'mp')==shown(P0,0,'mp'),'plain Attack changed the shown MP')
  hero_turn(pg,'attack');P2=panel_ok(pg,'after monsters hit')   # second member acts, then both monsters swing (atk 40)
  log=T.ev(pg,'SOTA.rpg.fight().log.slice(-2)');hits={}
  for l in log:
    m=re.search(r' hits (.+) for (\d+)',l)
    if m:hits[m.group(1)]=hits.get(m.group(1),0)+int(m.group(2))
  T.check(hits,f'no monster hit logged {log}')
  names=T.ev(pg,'SOTA.rpg.live().party.map(c=>c.name)')
  for i,n in enumerate(names):T.check(shown(P1,i,'hp')-shown(P2,i,'hp')==hits.get(n,0),f'{n}: shown HP {shown(P1,i,"hp")} -> {shown(P2,i,"hp")}, hits {hits.get(n,0)}')
  b.close()
def t_skill_cost(p):
  for cls,race,sk in (('warrior','human','bash'),('mage','elf','bolt')):
    b,pg=setup(p,cls,race,sk);P0=start(pg);cost=T.ev(pg,f'RPG.SKILLS.{cls}.find(s=>s.id=="{sk}").mp')
    hero_turn(pg,'skill',sk);P1=panel_ok(pg,f'after {sk}')
    T.check(shown(P0,0,'mp')-shown(P1,0,'mp')==cost,f'{cls} {sk}: shown MP {shown(P0,0,"mp")} -> {shown(P1,0,"mp")}, cost {cost}')
    T.check(T.ev(pg,'SOTA.rpg.fight().log.some(t=>/ uses /.test(t))'),f'{sk} was not used');b.close()
with sync_playwright() as p:
  for n,f in [('HP text follows a monster hit, MP text unchanged by Attack (every member)',t_monster_hit),('MP text drops by the skill/spell cost (warrior Shield Bash, mage Arcane Bolt)',t_skill_cost)]:run(n,f,p)
print(f'{passed} passed, {failed} failed');print('page errors:',T.ERRS[:5]);sys.exit(1 if failed or T.ERRS else 0)
