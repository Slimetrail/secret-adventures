"""Sequential batch 1 integration checks through real party lifecycle and dialogue UI.
Usage: python3 tests/batch1_browser_tests.py http://127.0.0.1:<port>/
"""
import sys, re, json, time
import stage6_tests as S6
from stage6_tests import ev, check
from playwright.sync_api import sync_playwright
SOURCE=open('/workspace/dialogue-team/camp-and-afterfight-batch1.md').read()
CODES={'Mira':'Q','Sorrel':'S','Brunn':'A'}
TALKS={s.split('.')[0]:[[CODES[a],b] for a,b in re.findall(r'^(Mira|Sorrel|Brunn): "(.*)"$',s,re.M)] for s in re.split(r'^### ',SOURCE,flags=re.M)[1:]}

def setup(p):
 b,c,pg=S6.start(p)
 ev(pg,'''window.batchParty=[SOTA.rpg.live().party[0],...RPG.COMPANIONS.map(d=>RPG.makeCompanion(d,1))];
 window.batchReset=(roles="QSA",only=null)=>{const L=SOTA.rpg.live(),codes={quirky:"Q",scholar:"S",angry:"A"};
 L.party=batchParty.filter((c,i)=>!i||roles.includes(codes[c.role]));
 L.party.forEach(c=>c.hp=RPG.maxHp(c,RPG.DIFF[L.diff].hp));
 const s=SOTA.rpg.s6.st();s.seen={opening:1};s.lastMeal=null;delete s.brunnJoin;
 for(const id of ["C7","C8","C9","C10","C11","C12","A7","A8","A9","A10","A11","A12","T1","T2","T3","T4","T5","T6","T7","T8","T9"])s.seen["batch2-"+id]=1;
 for(const id of ["C13", "C14", "C15", "C16", "C17", "C18", "A13", "A14", "A15", "A16", "A17", "A18", "T10", "T11", "T12", "T13", "T14", "T15"])s.seen["batch3-"+id]=1;
 if(only)for(const id of ["C1","C2","C3","C4","C5","C6","A1","A2","A3","A4","A5","A6"])if(id!==only)s.seen["batch1-"+id]=1;};void 0;''')
 return b,c,pg

def collect(pg):
 rows=[]
 for _ in range(1000):
  line=ev(pg,'SOTA.rpg.s6.line()')
  if not line:return rows
  check(ev(pg,'document.querySelectorAll("#s6d button").length')==0,'batch showed choices')
  check(ev(pg,'document.querySelectorAll("#s6d .s6p").length')==1,'multiple portraits')
  if line['typing']:pg.wait_for_timeout(12);continue
  rows.append([line['who'],pg.locator('#s6d .s6t').inner_text()]);S6.tapbox(pg)
 raise AssertionError('scene did not finish')

def t_all_exact_sequential_ui(p):
 b,c,pg=setup(p)
 for id,expected in TALKS.items():
  ev(pg,f'batchReset("QSA",{json.dumps(id)})')
  if id=='C4':ev(pg,'SOTA.rpg.s6.st().lastMeal="cooked"')
  if id=='C5':ev(pg,'SOTA.rpg.live().party[0].hp=1')
  ev(pg,'S6H.camp(0)' if id.startswith('C') else 'S6H.fightContinue([{hp:'+('0' if id=='A1' else '100')+',maxHp:100}])')
  check(collect(pg)==expected,id+' rendered lines differ')
  check(ev(pg,f'SOTA.rpg.s6.st().seen["batch1-{id}"]')==1,id+' not seen')
  if id.startswith('A'):
   ev(pg,'S6H.fightContinue([{hp:0,maxHp:100}])');check(not ev(pg,'SOTA.storyOpen()'),'repeated talk')
 b.close()

def t_meal_hook_and_priority(p):
 b,c,pg=setup(p)
 ids=ev(pg,'''(()=>{let cooked,buff,banquet;for(const id in RPG.ITEMS){const it=RPG.ITEMS[id];if(it.slot!=="dish")continue;const f=ECON.dish(it.dish).fx;if(f.hp)cooked=id;else if(f.str||f.sta||f.f)buff=id;if(f.hp&&(f.str||f.sta||f.f))banquet=id;}return {cooked,buff,banquet}})()''')
 check(all(ids.get(k) for k in ['cooked','buff','banquet']),'missing food fixtures '+str(ids))
 for label,id in [('cooked',ids['cooked']),('buff',ids['buff']),('ration','ration'),('cooked',ids['banquet'])]:
  ev(pg,'batchReset("QS")')
  ev(pg,f'SOTA.rpg.s5.eatDish(SOTA.rpg.live().party[0],{json.dumps(id)})')
  check(ev(pg,'SOTA.rpg.s6.st().lastMeal')==label,'meal classification '+id)
  ev(pg,'S6H.camp(0)');expected='C4' if label=='cooked' else 'C1';check(collect(pg)==TALKS[expected],'meal priority '+id)
 ev(pg,'batchReset("QS");SOTA.rpg.s5.eatDish(SOTA.rpg.live().party[0],'+json.dumps(ids['cooked'])+');SOTA.rpg.s5.eatDish(SOTA.rpg.live().party[0],"ration");S6H.camp(0)')
 check(collect(pg)==TALKS['C1'],'ration did not clear stew')
 b.close()

def t_real_camp_save_hurt_and_presence(p):
 b,c,pg=setup(p)
 ev(pg,'batchReset("QA");const cp=MAZE.camps[0];SOTA.teleport(cp[0],cp[1],0);SOTA.rpg.live().party.forEach(c=>c.bag=c.bag.filter(id=>id!=="tent"));SOTA.rpg.live().party[0].hp=1')
 check(not ev(pg,'SOTA.rpg.doSave()'),'camp without tent saved');check(not ev(pg,'SOTA.storyOpen()'),'talk on failed save')
 ev(pg,'SOTA.rpg.live().party[0].bag.push("tent");SOTA.rpg.doSave()')
 check(ev(pg,'SOTA.rpg.save().story.seen["batch1-C5"]')==1,'camp seen not persisted')
 check(ev(pg,'SOTA.rpg.live().party.every(c=>c.hp===RPG.maxHp(c,RPG.DIFF[SOTA.rpg.live().diff].hp))'),'camp no longer heals')
 check(collect(pg)==TALKS['C5'],'arrival injury lost to camp heal')
 ev(pg,'batchReset("QA");S6H.camp(0)');check(collect(pg)==TALKS['C2'],'C5 on full HP')
 ev(pg,'batchReset("SA");S6H.camp(0)');check(collect(pg)==TALKS['C3'],'watch gated by join reasons')
 for roles in ['','Q','S','A']:
  ev(pg,f'batchReset({json.dumps(roles)});S6H.camp(0)');collect(pg)
  check(not ev(pg,'Object.keys(SOTA.rpg.s6.st().seen).some(k=>k.startsWith("batch1-"))'),'talk without both speakers')
 b.close()

def t_real_fight_continue_snapshot(p):
 b,c,pg=setup(p)
 for health,expected in [(0,'A1'),(.25,'A1'),(.26,'A4'),(1,'A4')]:
  ev(pg,'batchReset("QS");SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])')
  ev(pg,f'const L=SOTA.rpg.live();L.party[0].hp=Math.floor(RPG.maxHp(L.party[0],RPG.DIFF[L.diff].hp)*{health});SOTA.rpg.forceEnd("win")')
  check(not ev(pg,'SOTA.storyOpen()'),'talk over loot panel')
  check(ev(pg,'document.getElementById("s6fl").dataset.phase')=='end','fight banner removed')
  # Simulate any post-reward healing: classification must still use the endFight entry snapshot.
  ev(pg,'SOTA.rpg.live().party.forEach(c=>c.hp=RPG.maxHp(c,RPG.DIFF[SOTA.rpg.live().diff].hp))')
  S6.tap(pg,'#fdone');check(ev(pg,'SOTA.rpg.ui()') is None,'victory UI not closed first')
  check(collect(pg)==TALKS[expected],'snapshot gate '+str(health))
 for outcome in ['ran','lose']:
  ev(pg,'batchReset("QS");SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")]);SOTA.rpg.forceEnd('+json.dumps(outcome)+')')
  S6.tap(pg,'#fdone');check(not ev(pg,'SOTA.storyOpen()'),'batch on '+outcome)
 ev(pg,'batchReset("QS");SOTA.rpg.startBoss();SOTA.rpg.forceEnd("win")');S6.tap(pg,'#fdone')
 check(ev(pg,'SOTA.rpg.s6.line().kind')!='after-fight','boss batch interrupted ending')
 check(not ev(pg,'SOTA.rpg.s6.st().seen["batch1-A1"]||SOTA.rpg.s6.st().seen["batch1-A4"]'),'boss marked batch seen')
 b.close()

def t_offline_batch(p):
 b,c=S6.ctx(p,sw=True);pg=c.new_page();pg.goto(S6.S4.BASE+'index.html')
 
 for _ in range(100):
  if ev(pg,'!!navigator.serviceWorker.controller'):break
  pg.wait_for_timeout(100)
 check(ev(pg,'!!navigator.serviceWorker.controller'),'service worker not ready')
 check(ev(pg,'(async()=>{const c=await caches.open("sota-s1-v22");return !!(await c.match("batch1-talks.js?v=2"))&&!!(await c.match("party.js?v=16"));})()'),'new scripts not cached')
 c.set_offline(True);pg.reload();S6.create(pg);S6.drain(pg)
 ev(pg,'SOTA.rpg.live().party.push(...RPG.COMPANIONS.filter(d=>d.role!=="angry").map(d=>RPG.makeCompanion(d,1)));for(const id of ["C7","C8","C9","C10","C11","C12"])SOTA.rpg.s6.st().seen["batch2-"+id]=1;S6H.camp(0)')
 check(collect(pg)==TALKS['C1'],'offline batch unavailable');b.close()

TESTS=[v for k,v in list(globals().items()) if k.startswith('t_')]
if __name__=='__main__':
 S6.S4.BASE=sys.argv[1];bad=[]
 with sync_playwright() as p:
  for test in TESTS:
   start=time.time()
   try:test(p);print('PASS',test.__name__,f'{time.time()-start:.1f}s',flush=True)
   except Exception as e:bad.append(test.__name__);print('FAIL',test.__name__,repr(e),flush=True)
 print('batch1 browser:',len(TESTS)-len(bad),'passed,',len(bad),'failed',bad);sys.exit(bool(bad))
