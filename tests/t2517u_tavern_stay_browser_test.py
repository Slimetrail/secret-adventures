"""t2517u/t2564u stay in the tavern after a talk or cut scene (412x891 phone, real finger taps).
 The tap that ends a scene closes the dialogue box on pointerdown; the click from that same tap must not press the
 tavern button under the finger (Zone N / Shop / Zone N+1) and so must not leave the tavern.
 talk:  owner talk on arrival at Tavern 1, ended by taps over each of the three tavern buttons -> still on the tavern screen
 cut:   'Please wait for update to continue.' scene at Tavern 3 (zone 4 closed), ended by taps over Zone 3 and Zone 4 -> still in, no replay
 leave: after a talk, a new tap on Zone 1 still opens the slot picker; its Back returns to the tavern; picking a slot saves and leaves to the maze
 save:  that slot holds Tavern 1; after a reload, loading it puts the party back on the Tavern 1 cell
 ghost: after the last talk tap, two clicks ~300 ms apart with no new touch stay on the tavern and do not open the save picker
Screenshots (T2517_SHOTS=dir). Usage: python tests/t2517u_tavern_stay_browser_test.py [base_url]"""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
SHOTS=os.environ.get('T2517_SHOTS','');passed=failed=0;ERR=[]
WAIT='Please wait for update to continue.'
def run(name,f,p):
  global passed,failed
  try:f(p);passed+=1;print('PASS',name,flush=True)
  except Exception as e:failed+=1;print('FAIL',name,repr(e)[:500],flush=True)
def shot(pg,n):
  if SHOTS:os.makedirs(SHOTS,exist_ok=True);pg.screenshot(path=os.path.join(SHOTS,n))
def check(c,m):
  if not c:raise T.Fail(m)
def setup(p):
  b=p.chromium.launch();c=b.new_context(viewport={'width':412,'height':891},device_scale_factor=1,has_touch=True,is_mobile=True,service_workers='block')
  c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}");pg=T.fresh(c);pg.on('pageerror',lambda e:ERR.append(str(e)))
  T.full_create(pg,'Leonidas','human','warrior');T.ev(pg,'localStorage.removeItem("sota.dev.nostory");SOTA.rpg.s6.setSpeed(0)');return b,pg
def hub_box(pg,i):
  """where tavern button i sits (it is hidden while a scene is open; read its box with the hide lifted for one layout)"""
  return T.ev(pg,'''i=>{const n=document.querySelector("#s4 .s5hubnav");const s=n.style.cssText;n.style.cssText+=";visibility:visible!important;pointer-events:auto!important";
   const r=document.querySelector('[data-hub="'+i+'"]').getBoundingClientRect();n.style.cssText=s;return [r.left+r.width/2,r.top+r.height/2]}''',i)
def finish_scene_at(pg,xy,limit=40):
  n=0
  while T.ev(pg,'SOTA.storyOpen()') and n<limit:
    pg.wait_for_timeout(200)
    at=xy or T.ev(pg,'(()=>{const r=document.querySelector("#s6d .s6box").getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()')
    pg.touchscreen.tap(at[0],at[1]);n+=1
  pg.wait_for_timeout(700);check(not T.ev(pg,'SOTA.storyOpen()'),'scene did not end after %d taps'%n);return n
def in_tavern(pg,t):
  st=json.loads(T.ev(pg,'JSON.stringify({ui:SOTA.rpg.ui(),cls:document.getElementById("s4").className,title:(document.querySelector("#s4 .s4title")||{}).textContent||"",pos:SOTA.state(),tav:MAZE.taverns,nav:(()=>{const n=document.querySelector("#s4 .s5hubnav");return n?getComputedStyle(n).visibility:"none"})()})'))
  check(st['ui']=='tavern','left the tavern screen: ui=%r class=%r'%(st['ui'],st['cls']))
  check(st['title']=='Tavern %d'%(t+1),'title '+st['title'])
  check([st['pos']['x'],st['pos']['y']]==st['tav'][t],'not on the tavern cell')
  check(st['nav']=='visible','tavern buttons not shown after the scene')
def arrive(pg,t):
  T.ev(pg,'t=>{SOTA.teleport(...MAZE.taverns[t],0);SOTA.rpg.s5.tavernScreen(t)}',t);pg.wait_for_timeout(400)
def t_talk_end_stays(p):
  for i,name in enumerate(['zone1','shop','zone2']):
    b,pg=setup(p)
    try:
      arrive(pg,0);line=T.ev(pg,'SOTA.rpg.s6.line()');check(line and line['kind']=='keeper','owner talk did not open: %r'%line)
      if i==0:shot(pg,'talk-open.png')
      xy=hub_box(pg,i);finish_scene_at(pg,xy);in_tavern(pg,0)
      check(T.ev(pg,'!document.querySelector("#s4.save-picker")'),'save picker opened');shot(pg,'talk-end-%s.png'%name)
    finally:b.close()
def t_cutscene_end_stays(p):
  b,pg=setup(p)
  try:
    T.ev(pg,'localStorage.setItem("sota.dev.nostory","1")');arrive(pg,2);T.ev(pg,'localStorage.removeItem("sota.dev.nostory")')
    check(not T.ev(pg,'SOTA.rpg.s5.zoneOpen(4)'),'zone 4 is open in this build; the wait scene cannot be reached')
    for i in (2,0):
      xy=hub_box(pg,2);pg.touchscreen.tap(xy[0],xy[1]);pg.wait_for_timeout(400)
      line=T.ev(pg,'SOTA.rpg.s6.line()');check(line and line['kind']=='wait-for-update','Zone 4 did not play the wait scene: %r'%line)
      try:pg.wait_for_function('w=>document.querySelector("#s6d .s6t").textContent===w',arg=WAIT,timeout=8000)  # typing may lag on a busy box
      except Exception:pass
      check(T.ev(pg,'document.querySelector("#s6d .s6t").textContent')==WAIT,'wait text changed: %r'%T.ev(pg,'document.querySelector("#s6d .s6t").textContent'))
      if i==2:shot(pg,'cut-open.png')
      finish_scene_at(pg,hub_box(pg,i));in_tavern(pg,2)
      check(T.ev(pg,'!document.querySelector("#s4.save-picker")'),'save picker opened after the cut scene')
    shot(pg,'cut-end.png')
  finally:b.close()
def t_back_still_leaves_and_save(p):
  b,pg=setup(p)
  try:
    arrive(pg,0);finish_scene_at(pg,[206,600]);in_tavern(pg,0)
    T.ttap(pg,'[data-hub="0"]');pg.wait_for_timeout(300);check(T.ev(pg,'SOTA.rpg.ui()')=='save-picker','a new tap on Zone 1 did not open the slot picker')
    T.ttap(pg,'#s4 .s4back');pg.wait_for_timeout(300);in_tavern(pg,0)
    T.ttap(pg,'[data-hub="1"]');pg.wait_for_timeout(300);check(T.ev(pg,'SOTA.rpg.ui()')=='buy','a new tap on Shop did not open the shop')
    finish_scene_at(pg,None);T.ev(pg,'SOTA.rpg.s5.tavernScreen(0,false)');pg.wait_for_timeout(200);in_tavern(pg,0)
    T.ttap(pg,'[data-hub="0"]');pg.wait_for_timeout(300);T.ttap(pg,'[data-save-slot="2"]');pg.wait_for_timeout(400)
    check(T.ev(pg,'SOTA.rpg.ui()') is None,'picking a slot did not leave the tavern')
    tav=T.ev(pg,'MAZE.taverns[0]');pos=T.ev(pg,'SOTA.state()');check([pos['x'],pos['y']]==tav,'not on the tavern cell after leaving')
    sl=T.ev(pg,'SOTA.rpg.saveSlots()[2]');check(sl and sl['at']['name']=='Tavern 1' and [sl['at']['x'],sl['at']['y']]==tav,'slot 3 is not Tavern 1: %r'%(sl and sl['at']))
    hp=[c['hp'] for c in sl['party']]
    T.ev(pg,'SOTA.teleport(MAZE.entrance[0],MAZE.entrance[1],0)')
    pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');T.SPL.pass_splash(pg);T.ev(pg,'SOTA.setAnim(false)');T.past_title(pg);pg.wait_for_timeout(300)
    T.ev(pg,'SOTA.rpg.closeUI();SOTA.rpg.loadSlot(2)');pg.wait_for_timeout(300)
    pos=T.ev(pg,'SOTA.state()');check([pos['x'],pos['y']]==tav,'loading slot 3 did not return to Tavern 1: %r'%pos)
    check([c['hp'] for c in T.ev(pg,'SOTA.rpg.live().party')]==hp,'HP changed through save/load')
    shot(pg,'after-load.png')
  finally:b.close()
def t_ghost_second_click_stays(p):
  """After the last talk tap, two clicks about 300 ms apart with no new touch must leave the tavern open and must not open the save picker."""
  b,pg=setup(p)
  try:
    arrive(pg,0);finish_scene_at(pg,[206,600]);in_tavern(pg,0)
    check(T.ev(pg,'!document.querySelector("#s4.save-picker")'),'save picker already open')
    # two synthetic clicks, 300 ms apart, no pointerdown / touchstart
    T.ev(pg,'document.querySelector("[data-hub=\'0\']").click()');pg.wait_for_timeout(300)
    T.ev(pg,'document.querySelector("[data-hub=\'0\']").click()');pg.wait_for_timeout(200)
    in_tavern(pg,0)
    check(T.ev(pg,'!document.querySelector("#s4.save-picker")'),'second ghost click opened the save picker')
    check(T.ev(pg,'SOTA.rpg.ui()')=='tavern','second ghost click left the tavern screen')
    shot(pg,'ghost-second-click.png')
  finally:b.close()
with sync_playwright() as p:
  for n,f in [('talk_end_stays',t_talk_end_stays),('cutscene_end_stays',t_cutscene_end_stays),('back_still_leaves_and_save',t_back_still_leaves_and_save),('ghost_second_click_stays',t_ghost_second_click_stays)]:run(n,f,p)
print('page errors:',ERR[:3]);print(f'{passed} passed, {failed} failed');sys.exit(1 if failed or ERR else 0)
