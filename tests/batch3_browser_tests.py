"""Batch 3 real lifecycle, rendered words, shared registry, and offline checks."""
import sys,json,re,time
import batch1_browser_tests as B1
import batch2_browser_tests as B2
import stage6_tests as S6
from stage6_tests import ev,check
from playwright.sync_api import sync_playwright
SOURCE=open('/workspace/dialogue-team/camp-and-afterfight-batch3.md').read()
TALKS={s.split('.')[0]:[[{'Mira':'Q','Sorrel':'S','Brunn':'A'}[a],b] for a,b in re.findall(r'^(Mira|Sorrel|Brunn): "(.*)"$',s,re.M)] for s in re.split(r'^### ',SOURCE,flags=re.M)[1:]}
BLOCKED=['C13','C16','C18','T10']

def setup(p):
 b,c,pg=B2.setup(p)
 ev(pg,'''window.reset3=(id=null,roles="QSA")=>{reset2(null,roles);const s=SOTA.rpg.s6.st();for(const x of '''+json.dumps(list(TALKS))+''')s.seen["batch3-"+x]=1;if(id)delete s.seen["batch3-"+id];};void 0;''')
 return b,c,pg

def trigger(pg,id):
 if id.startswith('C'):
  if id=='C17':ev(pg,'SOTA.rpg.live().party.at(-1).bag.push("ration")')
  ev(pg,'S6H.camp(0)')
 elif id.startswith('A'):ev(pg,'S6H.fightContinue([{hp:100,maxHp:100}])')
 elif int(id[1:])<=12:ev(pg,'SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.tavernScreen(0)')
 else:ev(pg,'SOTA.teleport(...MAZE.taverns[0],0);const d=ECON.DISHES[0];SOTA.rpg.live().party[0].bag=d.ing.map(x=>"i_"+x);SOTA.rpg.s5.cookTry(d.ing)')

def t_rendered_exact_lines(p):
 b,c,pg=setup(p)
 for id,expected in TALKS.items():
  if id in BLOCKED:continue
  ev(pg,'reset3('+json.dumps(id)+')');trigger(pg,id)
  check(B1.collect(pg)==expected,id+' rendered lines')
  check(ev(pg,'SOTA.rpg.s6.st().seen["batch3-'+id+'"]')==1,id+' seen')
 b.close()

def t_presence_and_unobservable(p):
 b,c,pg=setup(p)
 for id,lines in TALKS.items():
  for missing in set(x[0] for x in lines):
   ev(pg,'reset3('+json.dumps(id)+','+json.dumps(''.join(x for x in 'QSA' if x!=missing))+')');trigger(pg,id);B1.collect(pg)
   check(not ev(pg,'SOTA.rpg.s6.st().seen["batch3-'+id+'"]'),id+' absent speaker')
 for id in BLOCKED:
  ev(pg,'reset3('+json.dumps(id)+');Object.assign(SOTA.rpg.s6.st(),{morning:true,stiffness:true,weather:true,warmth:true});SOTA.rpg.live().tentWear=99');trigger(pg,id);B1.collect(pg)
  check(not ev(pg,'SOTA.rpg.s6.st().seen["batch3-'+id+'"]'),id+' fabricated state')
 b.close()

def t_real_camp_save_all_batch_priority(p):
 b,c,pg=setup(p)
 ev(pg,'reset3();const s=SOTA.rpg.s6.st();for(const id of ["C4","C5"])delete s.seen["batch1-"+id];for(const id of ["C7","C9","C12"])delete s.seen["batch2-"+id];for(const id of ["C14","C15","C17"])delete s.seen["batch3-"+id];s.lastMeal="cooked";const L=SOTA.rpg.live();L.party[0].bag=["tent","ration","i_water"];L.party[0].hp=1;SOTA.teleport(...MAZE.camps[0],0)')
 for batch,id in [(1,'C4'),(1,'C5'),(2,'C9'),(2,'C12'),(3,'C17'),(2,'C7'),(3,'C14'),(3,'C15')]:
  ev(pg,'SOTA.rpg.live().tentWear=0;'+('SOTA.rpg.live().party[0].hp=1;' if id=='C5' else '')+'SOTA.rpg.doSave()')
  check(B1.collect(pg)=={1:B1.TALKS,2:B2.TALKS,3:TALKS}[batch][id],id+' shared save priority')
  check(ev(pg,'SOTA.rpg.save().story.seen["batch'+str(batch)+'-'+id+'"]')==1,id+' persisted')
 # No tent means no talk or successful save.
 ev(pg,'reset3("C14");SOTA.rpg.live().party.forEach(c=>c.bag=[]);SOTA.teleport(...MAZE.camps[0],0)')
 check(not ev(pg,'SOTA.rpg.doSave()'),'saved without tent');check(not ev(pg,'SOTA.storyOpen()'),'talk on failed camp')
 b.close()

def t_c17_not_cooked(p):
 b,c,pg=setup(p)
 for meal in ['cooked','buff']:
  ev(pg,'reset3("C17");SOTA.rpg.s6.st().lastMeal='+json.dumps(meal)+';S6H.camp(0)');B1.collect(pg)
  check(not ev(pg,'SOTA.rpg.s6.st().seen["batch3-C17"]'),'C17 from '+meal)
 b.close()

def t_real_victory_continue_exclusions(p):
 b,c,pg=setup(p)
 for id in ['A13','A14','A15','A16','A17','A18']:
  ev(pg,'reset3('+json.dumps(id)+');SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")]);SOTA.rpg.live().party[0].hp=1;SOTA.rpg.forceEnd("win")')
  check(not ev(pg,'SOTA.storyOpen()'),'before Continue');S6.tap(pg,'#fdone')
  check(ev(pg,'SOTA.rpg.ui()') is None,'rewards not closed');check(B1.collect(pg)==TALKS[id],id+' victory')
 for outcome in ['ran','lose']:
  ev(pg,'reset3("A13");SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")]);SOTA.rpg.forceEnd('+json.dumps(outcome)+')');S6.tap(pg,'#fdone')
  check(not ev(pg,'SOTA.storyOpen()'),'talk on '+outcome)
 ev(pg,'reset3("A13");SOTA.rpg.startBoss();SOTA.rpg.forceEnd("win")');S6.tap(pg,'#fdone');check(not ev(pg,'SOTA.rpg.s6.st().seen["batch3-A13"]'),'Iron Golem talk')
 b.close()

def t_tavern_stock_and_single_slot(p):
 b,c,pg=setup(p)
 # Empty purse is not an empty shop; earlier ordinary tavern talk loses to restock extra.
 ev(pg,'reset3("T12");delete SOTA.rpg.s6.st().seen["batch2-T1"];SOTA.rpg.live().gold=0;SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.tavernScreen(0)')
 check(B1.collect(pg)==TALKS['T12'],'stock gate required gold/default stole priority')
 ev(pg,'SOTA.rpg.s5.tavernScreen(0);S6H.shop()');check(not ev(pg,'SOTA.storyOpen()'),'two talks same stop')
 # No tracked supplies remain in this tavern. Stock elsewhere cannot leak here.
 ev(pg,'reset3("T12");const X=SOTA.rpg.s5,q=X.shopCounts(0);for(const id in q)q[id]=0;X.shopCounts(1);SOTA.teleport(...MAZE.taverns[0],0);X.tavernScreen(0)');B1.collect(pg)
 check(not ev(pg,'SOTA.rpg.s6.st().seen["batch3-T12"]'),'depleted stock / other tavern leak')
 # Ingredient-only remaining stock works, with no coin event.
 ev(pg,'reset3("T12");const q=SOTA.rpg.s5.shopCounts(0);for(const id in q)q[id]=0;q[ECON.stock(0).ing[0]]=1;SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.tavernScreen(0)')
 check(B1.collect(pg)==TALKS['T12'],'ingredient restock')
 # Earlier gated food talk still wins ties; old fallback stays when no sequential fits.
 ev(pg,'reset3("T12");delete SOTA.rpg.s6.st().seen["batch2-T6"];SOTA.rpg.live().party[0].bag=["ration"];SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.tavernScreen(0)');check(B1.collect(pg)==B2.TALKS['T6'],'earlier extra lost')
 ev(pg,'reset3();SOTA.teleport(...MAZE.taverns[1],0);SOTA.rpg.s5.tavernScreen(1)');check(len(B1.collect(pg))>0,'old tavern pool missing')
 b.close()

def t_craft_shared_real_paths(p):
 b,c,pg=setup(p)
 ev(pg,'reset3();for(const id of ["T7","T8","T9"])delete SOTA.rpg.s6.st().seen["batch2-"+id];for(const id of ["T13","T14","T15"])delete SOTA.rpg.s6.st().seen["batch3-"+id];SOTA.teleport(...MAZE.taverns[0],0)')
 for id in ['T7','T8','T9','T13','T14','T15']:
  ev(pg,'const d=ECON.DISHES[0];SOTA.rpg.live().party[0].bag=d.ing.map(x=>"i_"+x);SOTA.rpg.s5.cookTry(d.ing)')
  check(B1.collect(pg)==(B2.TALKS if id in ['T7','T8','T9'] else TALKS)[id],id+' craft shared order')
 ev(pg,'reset3("T13");SOTA.teleport(...MAZE.camps[0],0);const d=ECON.DISHES[0];SOTA.rpg.live().party[0].bag=d.ing.map(x=>"i_"+x);SOTA.rpg.s5.cookTry(d.ing)');check(not ev(pg,'SOTA.storyOpen()'),'camp craft fired')
 ev(pg,'SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.cookTry(ECON.DISHES[0].ing)');check(not ev(pg,'SOTA.storyOpen()'),'failed craft fired')
 b.close()

def t_offline_v22(p):
 b,c=S6.ctx(p,sw=True);pg=c.new_page();pg.goto(S6.S4.BASE+'index.html')
 for _ in range(100):
  if ev(pg,'!!navigator.serviceWorker.controller'):break
  pg.wait_for_timeout(100)
 check(ev(pg,'!!navigator.serviceWorker.controller'),'service worker not ready')
 check(ev(pg,'(async()=>{const c=await caches.open("sota-s1-v22");return !!(await c.match("batch3-talks.js?v=1"));})()'),'batch3 not cached')
 c.set_offline(True);pg.reload();S6.create(pg);S6.drain(pg)
 ev(pg,'SOTA.rpg.live().party.push(...RPG.COMPANIONS.map(d=>RPG.makeCompanion(d,1)));const s=SOTA.rpg.s6.st();for(const id of ["C1","C2","C3","C4","C5","C6"])s.seen["batch1-"+id]=1;for(const id of ["C7","C8","C9","C10","C11","C12"])s.seen["batch2-"+id]=1;SOTA.rpg.live().party.forEach(c=>c.bag=[]);S6H.camp(0)')
 check(B1.collect(pg)==TALKS['C14'],'offline batch3 missing');b.close()

TESTS=[v for k,v in list(globals().items()) if k.startswith('t_')]
if __name__=='__main__':
 S6.S4.BASE=sys.argv[1];bad=[]
 with sync_playwright() as p:
  for test in TESTS:
   start=time.time()
   try:test(p);print('PASS',test.__name__,round(time.time()-start,1),flush=True)
   except Exception as e:bad.append(test.__name__);print('FAIL',test.__name__,str(e),flush=True)
 print(f'{len(TESTS)-len(bad)}/{len(TESTS)} PASS',flush=True);sys.exit(bool(bad))
