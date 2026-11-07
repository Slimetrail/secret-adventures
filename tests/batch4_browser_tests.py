"""Batch 4 real lifecycle, rendered words, shared registry, and offline checks."""
import sys,json,re,time
import batch1_browser_tests as B1
import batch2_browser_tests as B2
import batch3_browser_tests as B3
import stage6_tests as S6
from stage6_tests import ev,check
from playwright.sync_api import sync_playwright
SOURCE=open('/workspace/dialogue-team/camp-and-afterfight-batch4.md').read()
TALKS={s.split('.')[0]:[[{'Mira':'Q','Sorrel':'S','Brunn':'A'}[a],b] for a,b in re.findall(r'^(Mira|Sorrel|Brunn): "(.*)"$',s,re.M)] for s in re.split(r'^### ',SOURCE,flags=re.M)[1:]}
BLOCKED=['C19','C22','C24','T16','T18']

def setup(p):
 b,c,pg=B3.setup(p)
 ev(pg,'''window.reset4=(id=null,roles="QSA")=>{reset3(null,roles);const s=SOTA.rpg.s6.st();for(const x of '''+json.dumps(list(TALKS))+''')s.seen["batch4-"+x]=1;if(id)delete s.seen["batch4-"+id];};void 0;''')
 return b,c,pg

def trigger(pg,id):
 if id.startswith('C'):
  ev(pg,'S6H.camp(0)')
 elif id.startswith('A'):ev(pg,'S6H.fightContinue([{hp:100,maxHp:100}])')
 elif int(id[1:])<=18:ev(pg,'SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.tavernScreen(0)')
 else:ev(pg,'SOTA.teleport(...MAZE.taverns[0],0);const d=ECON.DISHES[0];SOTA.rpg.live().party[0].bag=d.ing.map(x=>"i_"+x);SOTA.rpg.s5.cookTry(d.ing)')

def t_rendered_exact_lines(p):
 b,c,pg=setup(p)
 for id,expected in TALKS.items():
  if id in BLOCKED:continue
  ev(pg,'reset4('+json.dumps(id)+')');trigger(pg,id)
  check(pg.locator('#s6d .da-stage').count()==0,id+' invented portraits')
  check(B1.collect(pg)==expected,id+' rendered lines')
  check(ev(pg,'SOTA.rpg.s6.st().seen["batch4-'+id+'"]')==1,id+' seen')
 b.close()

def t_presence_and_unobservable(p):
 b,c,pg=setup(p)
 for id,lines in TALKS.items():
  for missing in set(x[0] for x in lines):
   ev(pg,'reset4('+json.dumps(id)+','+json.dumps(''.join(x for x in 'QSA' if x!=missing))+')');trigger(pg,id);B1.collect(pg)
   check(not ev(pg,'SOTA.rpg.s6.st().seen["batch4-'+id+'"]'),id+' absent speaker')
 for id in BLOCKED:
  ev(pg,'reset4('+json.dumps(id)+');Object.assign(SOTA.rpg.s6.st(),{damp:true,grit:true,lowWater:true,table:true,listedPrice:true});SOTA.rpg.live().tentWear=99');trigger(pg,id);B1.collect(pg)
  check(not ev(pg,'SOTA.rpg.s6.st().seen["batch4-'+id+'"]'),id+' fabricated state')
 b.close()

def t_real_victory_continue_exclusions(p):
 b,c,pg=setup(p)
 for id in ['A19','A20','A21','A22','A23','A24']:
  ev(pg,'reset4('+json.dumps(id)+');SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")]);SOTA.rpg.live().party[0].hp=1;SOTA.rpg.forceEnd("win")')
  check(not ev(pg,'SOTA.storyOpen()'),'before Continue');S6.tap(pg,'#fdone')
  check(ev(pg,'SOTA.rpg.ui()') is None,'rewards not closed');check(B1.collect(pg)==TALKS[id],id+' victory')
 for outcome in ['ran','lose']:
  ev(pg,'reset4("A19");SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")]);SOTA.rpg.forceEnd('+json.dumps(outcome)+')');S6.tap(pg,'#fdone')
  check(not ev(pg,'SOTA.storyOpen()'),'talk on '+outcome)
 ev(pg,'reset4("A19");SOTA.rpg.startBoss();SOTA.rpg.forceEnd("win")');S6.tap(pg,'#fdone');check(not ev(pg,'SOTA.rpg.s6.st().seen["batch4-A19"]'),'Iron Golem talk')
 b.close()

def t_successful_camp_save_priority_and_failure(p):
 b,c,pg=setup(p)
 ev(pg,'reset4("C20");const s=SOTA.rpg.s6.st();delete s.seen["batch1-C4"];delete s.seen["batch2-C9"];delete s.seen["batch3-C17"];s.lastMeal="cooked";SOTA.rpg.live().party[0].bag=["tent","ration"];SOTA.teleport(...MAZE.camps[0],0)')
 for batch,id in [(1,'C4'),(2,'C9'),(3,'C17'),(4,'C20')]:
  ev(pg,'SOTA.rpg.live().tentWear=0;SOTA.rpg.doSave()')
  check(B1.collect(pg)=={1:B1.TALKS,2:B2.TALKS,3:B3.TALKS,4:TALKS}[batch][id],id+' shared priority')
  check(ev(pg,'SOTA.rpg.save().story.seen["batch'+str(batch)+'-'+id+'"]')==1,id+' persisted')
 ev(pg,'reset4("C23");SOTA.teleport(...MAZE.camps[0],0)')
 check(not ev(pg,'SOTA.rpg.doSave()'),'saved without tent');check(not ev(pg,'SOTA.storyOpen()'),'talk after failed save')
 b.close()

def t_tavern_one_slot_earlier_extra_and_price_listing(p):
 b,c,pg=setup(p)
 ev(pg,'reset4("T17");delete SOTA.rpg.s6.st().seen["batch3-T12"];SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.tavernScreen(0)')
 check(B1.collect(pg)==B3.TALKS['T12'],'earlier extra lost')
 ev(pg,'SOTA.rpg.s5.tavernScreen(0);S6H.shop()');check(not ev(pg,'SOTA.storyOpen()'),'second talk same stop')
 ev(pg,'SOTA.rpg.live().steps++;SOTA.rpg.s5.tavernScreen(0)');check(B1.collect(pg)==TALKS['T17'],'next stop')
 # Prices are visibly available without a buy, but there is no listing lifecycle
 # dispatch into the shared slot. Do not replace that observation with payment.
 ev(pg,'reset4("T18");SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.tavernScreen(0)');B1.collect(pg)
 ev(pg,'SOTA.rpg.s5.shopList(0,"food")')
 check(pg.locator('[data-buy="ration"]').count()==1,'price listing absent')
 check('g' in pg.locator('[data-buy="ration"]').inner_text(),'price not shown')
 check(not ev(pg,'SOTA.rpg.s6.st().seen["batch4-T18"]'),'listed price invented hook')
 ev(pg,'SOTA.rpg.s5.buy("ration",0)');B1.collect(pg)
 check(not ev(pg,'SOTA.rpg.s6.st().seen["batch4-T18"]'),'T18 borrowed pay gate')
 b.close()

def t_food_craft_shared_and_real_exclusions(p):
 b,c,pg=setup(p)
 ev(pg,'reset4();const s=SOTA.rpg.s6.st();for(const id of ["T7","T8","T9"])delete s.seen["batch2-"+id];for(const id of ["T13","T14","T15"])delete s.seen["batch3-"+id];for(const id of ["T19","T20","T21"])delete s.seen["batch4-"+id];SOTA.teleport(...MAZE.taverns[0],0)')
 for batch,id in [(2,'T7'),(2,'T8'),(2,'T9'),(3,'T13'),(3,'T14'),(3,'T15'),(4,'T19'),(4,'T20'),(4,'T21')]:
  ev(pg,'const d=ECON.DISHES[0];SOTA.rpg.live().party[0].bag=d.ing.map(x=>"i_"+x);SOTA.rpg.s5.cookTry(d.ing)')
  check(B1.collect(pg)=={2:B2.TALKS,3:B3.TALKS,4:TALKS}[batch][id],id+' craft order')
 for id in ['T19','T20','T21']:
  ev(pg,'reset4('+json.dumps(id)+');SOTA.teleport(...MAZE.camps[0],0);const d=ECON.DISHES[0];SOTA.rpg.live().party[0].bag=d.ing.map(x=>"i_"+x);SOTA.rpg.s5.cookTry(d.ing)');check(not ev(pg,'SOTA.storyOpen()'),'camp craft fired')
  ev(pg,'SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.cookTry(ECON.DISHES[0].ing)');check(not ev(pg,'SOTA.storyOpen()'),'failed craft fired')
 b.close()

def t_offline_v24(p):
 b,c=S6.ctx(p,sw=True);pg=c.new_page();pg.goto(S6.S4.BASE+'index.html')
 for _ in range(100):
  if ev(pg,'!!navigator.serviceWorker.controller'):break
  pg.wait_for_timeout(100)
 check(ev(pg,'!!navigator.serviceWorker.controller'),'service worker not ready')
 check(ev(pg,'(async()=>{const c=await caches.open("sota-s1-v24");return !!(await c.match("batch4-talks.js?v=1"));})()'),'batch4 not cached')
 c.set_offline(True);pg.reload();S6.create(pg);S6.drain(pg)
 ev(pg,'SOTA.rpg.live().party.push(...RPG.COMPANIONS.map(d=>RPG.makeCompanion(d,1)));const s=SOTA.rpg.s6.st();for(let i=1;i<=18;i++){s.seen["batch"+(i<=6?1:i<=12?2:3)+"-C"+i]=1;}SOTA.rpg.live().party.forEach(c=>c.bag=[]);S6H.camp(0)')
 check(B1.collect(pg)==TALKS['C20'],'offline batch4 missing');b.close()

TESTS=[v for k,v in list(globals().items()) if k.startswith('t_')]
if __name__=='__main__':
 S6.S4.BASE=sys.argv[1];bad=[]
 with sync_playwright() as p:
  for test in TESTS:
   start=time.time()
   try:test(p);print('PASS',test.__name__,round(time.time()-start,1),flush=True)
   except Exception as e:bad.append(test.__name__);print('FAIL',test.__name__,str(e),flush=True)
 print(f'{len(TESTS)-len(bad)}/{len(TESTS)} PASS',flush=True);sys.exit(bool(bad))
