"""Real lifecycle / rendered lines / offline batch 2; temporary caller-owned server."""
import sys,json,re,time
import batch1_browser_tests as B1
import stage6_tests as S6
from stage6_tests import ev,check
from playwright.sync_api import sync_playwright
SOURCE=open('/workspace/dialogue-team/camp-and-afterfight-batch2.md').read()
TALKS={s.split('.')[0]:[[{'Mira':'Q','Sorrel':'S','Brunn':'A'}[a],b] for a,b in re.findall(r'^(Mira|Sorrel|Brunn): "(.*)"$',s,re.M)] for s in re.split(r'^### ',SOURCE,flags=re.M)[1:]}
IDS=list(TALKS)

def setup(p):
 b,c,pg=B1.setup(p)
 ev(pg,'''window.reset2=(id=null,roles="QSA")=>{batchReset(roles);const L=SOTA.rpg.live(),s=SOTA.rpg.s6.st();
 for(const id of ["C1","C2","C3","C4","C5","C6","A1","A2","A3","A4","A5","A6"])s.seen["batch1-"+id]=1;
 for(const x of '''+json.dumps(IDS)+''')s.seen["batch2-"+x]=1;
 if(id)delete s.seen["batch2-"+id];delete s.batch2Visit;delete s.visit;L.steps++;L.gold=10000;
 L.party.forEach(c=>c.bag=[]);L.recipes={};L.tavernStock={};};void 0;''')
 return b,c,pg

def trigger(pg,id):
 if id.startswith('C'):
  if id=='C9':ev(pg,'SOTA.rpg.live().party[0].bag.push("ration")')
  if id=='C12':ev(pg,'SOTA.rpg.live().party[0].bag.push("i_water")')
  ev(pg,'S6H.camp(0)')
 elif id.startswith('A'):ev(pg,'S6H.fightContinue([{hp:100,maxHp:100}])')
 elif int(id[1:])<=6:
  ev(pg,'SOTA.teleport(...MAZE.taverns[0],0)')
  if id=='T6':ev(pg,'SOTA.rpg.live().party[0].bag.push("ration")')
  if id=='T5':
   ev(pg,'for(const sc of STORY.tavern[0])SOTA.rpg.s6.st().seen[sc.id]=1;SOTA.rpg.s5.tavernScreen(0);SOTA.rpg.s5.buy("potion",0)')
  else:ev(pg,'SOTA.rpg.s5.tavernScreen(0)')
 else:
  ev(pg,'SOTA.teleport(...MAZE.taverns[0],0);const d=ECON.DISHES[0];SOTA.rpg.live().party[0].bag=d.ing.map(x=>"i_"+x);SOTA.rpg.s5.cookTry(d.ing)')

def t_all_eligible_exact_lines(p):
 b,c,pg=setup(p)
 for id,expected in TALKS.items():
  if id in ['C10','T4']:continue
  ev(pg,'reset2('+json.dumps(id)+')');trigger(pg,id)
  check(B1.collect(pg)==expected,id+' rendered lines differ')
  check(ev(pg,'SOTA.rpg.s6.st().seen["batch2-'+id+'"]')==1,id+' not marked seen')
 b.close()

def t_real_save_combined_priority(p):
 b,c,pg=setup(p)
 ev(pg,'reset2();const s=SOTA.rpg.s6.st();for(const id of ["C4","C5"])delete s.seen["batch1-"+id];for(const id of ["C7","C9","C12"])delete s.seen["batch2-"+id];s.lastMeal="cooked";const L=SOTA.rpg.live();L.party[0].bag=["tent","ration","i_water"];L.party[0].hp=1;SOTA.teleport(...MAZE.camps[0],0);SOTA.rpg.doSave()')
 check(B1.collect(pg)==B1.TALKS['C4'],'batch 2 stole C4 save')
 check(ev(pg,'SOTA.rpg.save().story.seen["batch1-C4"]')==1,'seen not saved')
 ev(pg,'SOTA.rpg.live().party[0].hp=1;SOTA.rpg.doSave()');check(B1.collect(pg)==B1.TALKS['C5'],'batch 2 stole C5')
 ev(pg,'SOTA.rpg.doSave()');check(B1.collect(pg)==TALKS['C9'],'C9 extra priority')
 ev(pg,'SOTA.rpg.doSave()');check(B1.collect(pg)==TALKS['C12'],'C12 extra priority')
 ev(pg,'SOTA.rpg.doSave()');check(B1.collect(pg)==TALKS['C7'],'C7 missing')
 check(ev(pg,'SOTA.rpg.save().story.seen["batch2-C7"]')==1,'batch2 seen not in save')
 b.close()

def t_real_victory_continue(p):
 b,c,pg=setup(p)
 for id,hp in [('A7',1),('A10',100)]:
  ev(pg,'reset2('+json.dumps(id)+');SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")]);SOTA.rpg.live().party[0].hp='+str(hp)+';SOTA.rpg.forceEnd("win")')
  check(not ev(pg,'SOTA.storyOpen()'),'dialogue before Continue')
  S6.tap(pg,'#fdone');check(ev(pg,'SOTA.rpg.ui()') is None,'loot not closed');check(B1.collect(pg)==TALKS[id],id+' HP gate')
 for outcome in ['ran','lose']:
  ev(pg,'reset2("A7");SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")]);SOTA.rpg.forceEnd('+json.dumps(outcome)+')');S6.tap(pg,'#fdone');check(not ev(pg,'SOTA.storyOpen()'),'batch2 on '+outcome)
 ev(pg,'reset2("A7");SOTA.rpg.startBoss();SOTA.rpg.forceEnd("win")');S6.tap(pg,'#fdone');check(not ev(pg,'SOTA.rpg.s6.st().seen["batch2-A7"]'),'batch2 on boss')
 b.close()

def t_tavern_slot_payment_and_fallback(p):
 b,c,pg=setup(p)
 ev(pg,'reset2("T2");delete SOTA.rpg.s6.st().seen["batch2-T5"];SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.tavernScreen(0)');check(B1.collect(pg)==TALKS['T2'],'T5 stole T2 without pay')
 ev(pg,'SOTA.rpg.s5.buy("potion",0);SOTA.rpg.s5.tavernScreen(0)');check(not ev(pg,'SOTA.storyOpen()'),'two sequential talks same stop')
 # Old fallback consumes the visit, even after the companion lineup changes.
 ev(pg,'reset2("T5");SOTA.teleport(...MAZE.taverns[1],0);SOTA.rpg.s5.tavernScreen(1)');check(len(B1.collect(pg))>0,'fallback missing')
 ev(pg,'SOTA.rpg.s5.buy("potion",1)');check(not ev(pg,'SOTA.rpg.s6.st().seen["batch2-T5"]'),'T5 followed old pool')
 # An exhausted pool leaves a slot for a real payment (including recipe buy).
 ev(pg,'reset2("T5");SOTA.teleport(...MAZE.taverns[0],0);for(const sc of STORY.tavern[0])SOTA.rpg.s6.st().seen[sc.id]=1;SOTA.rpg.s5.tavernScreen(0)')
 check(not ev(pg,'SOTA.storyOpen()'),'T5 played without pay')
 ev(pg,'SOTA.rpg.live().gold=0;SOTA.rpg.s5.buyRecipe(ECON.DISHES[0].id)');check(not ev(pg,'SOTA.storyOpen()'),'failed payment fired T5')
 ev(pg,'SOTA.rpg.live().gold=10000;SOTA.rpg.s5.buyRecipe(ECON.DISHES[0].id)');check(B1.collect(pg)==TALKS['T5'],'recipe pay missing T5')
 b.close()

def t_craft_real_paths_and_presence(p):
 b,c,pg=setup(p)
 ev(pg,'reset2("T7");SOTA.teleport(...MAZE.camps[0],0);const d=ECON.DISHES[0];SOTA.rpg.live().party[0].bag=d.ing.map(x=>"i_"+x);SOTA.rpg.s5.cookTry(d.ing)');check(not ev(pg,'SOTA.storyOpen()'),'camp craft fired')
 ev(pg,'SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.cookTry(ECON.DISHES[0].ing)');check(not ev(pg,'SOTA.storyOpen()'),'failed craft fired')
 # UI origin carries tavern context even if the current walk position changes.
 ev(pg,'reset2("T7");SOTA.teleport(...MAZE.camps[0],0);const d=ECON.DISHES[0];SOTA.rpg.live().party[0].bag=d.ing.map(x=>"i_"+x);SOTA.rpg.s5.cookScreen("t0")')
 # Set the known recipe to select it through its actual button.
 ev(pg,'SOTA.rpg.live().recipes[ECON.DISHES[0].id]="earned";SOTA.rpg.s5.cookScreen("t0")')
 pg.locator('[data-again="'+ev(pg,'ECON.DISHES[0].id')+'"]').click();pg.locator('#s5cook').click()
 check(B1.collect(pg)==TALKS['T7'],'cook UI tavern origin missing')
 for id in ['T7','T8','T9']:
  missing=TALKS[id][0][0];roles=''.join(c for c in 'QSA' if c!=missing)
  ev(pg,'reset2('+json.dumps(id)+','+json.dumps(roles)+')');trigger(pg,id);check(not ev(pg,'SOTA.storyOpen()'),id+' missing speaker')
 for id in ['C10','T4']:
  ev(pg,'reset2('+json.dumps(id)+')');trigger(pg,id);B1.collect(pg);check(not ev(pg,'SOTA.rpg.s6.st().seen["batch2-'+id+'"]'),'unobservable gate fabricated')
 b.close()

def t_offline_v22(p):
 b,c=S6.ctx(p,sw=True);pg=c.new_page();pg.goto(S6.S4.BASE+'index.html')
 for _ in range(100):
  if ev(pg,'!!navigator.serviceWorker.controller'):break
  pg.wait_for_timeout(100)
 check(ev(pg,'!!navigator.serviceWorker.controller'),'service worker not ready')
 check(ev(pg,'(async()=>{const keys=await caches.keys(),c=await caches.open("sota-s1-v24");return keys.includes("sota-s1-v24")&&!!(await c.match("batch2-talks.js?v=1"))&&!!(await c.match("batch1-talks.js?v=3"))&&!!(await c.match("party.js?v=16"));})()'),'v22 scripts not cached')
 c.set_offline(True);pg.reload();S6.create(pg);S6.drain(pg)
 ev(pg,'SOTA.rpg.live().party.push(...RPG.COMPANIONS.map(d=>RPG.makeCompanion(d,1)));for(const id of ["C1","C2","C3","C4","C5","C6"])SOTA.rpg.s6.st().seen["batch1-"+id]=1;SOTA.rpg.live().party.forEach(c=>c.bag=[]);S6H.camp(0)')
 check(B1.collect(pg)==TALKS['C7'],'offline batch2 missing');b.close()

TESTS=[v for k,v in list(globals().items()) if k.startswith('t_')]
if __name__=='__main__':
 S6.S4.BASE=sys.argv[1];bad=[]
 with sync_playwright() as p:
  for test in TESTS:
   start=time.time()
   try:test(p);print('PASS',test.__name__,round(time.time()-start,1),flush=True)
   except Exception as e:bad.append(test.__name__);print('FAIL',test.__name__,str(e),flush=True)
 print(f'{len(TESTS)-len(bad)}/{len(TESTS)} PASS',flush=True);sys.exit(bool(bad))
