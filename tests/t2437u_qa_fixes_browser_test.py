"""t2437u QA + Skeptic fixes on live 6de0e16, checked on a pretend phone (Playwright Chromium, touch).
 1 join and level-up stat-point reminders show ON TOP after the story dialogue closes and stay readable (story scenes ON)
 2 360x640: the camp lesson panel no longer covers the craft pop-up's Close
 3 the name box: 'Hero' is only a default, typing does not add to it; left empty it stays 'Hero'
 4 Party screen portraits are drawn (not plain dark squares) even when opened before the sprites load
 5 boot.js: with service workers blocked, a tab-visible event throws no error
 6 Skeptic: taking off / swapping HP gear caps HP (and MP) to the new max
Usage: python tests/t2437u_qa_fixes_browser_test.py [base_url]"""
import sys,os,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
import stage4_tests as S4
import splash_helper as SPL
import stage6_tests as S6
S4.BASE=BASE.rstrip('/')+'/'
from playwright.sync_api import sync_playwright
SHOTS=os.environ.get('T2437_SHOTS','')
passed=failed=0
def run(name,f,p):
  global passed,failed
  try:f(p);passed+=1;print('PASS',name,flush=True)
  except Exception as e:failed+=1;print('FAIL',name,repr(e)[:400],flush=True)
def shot(pg,n):
  if SHOTS:os.makedirs(SHOTS,exist_ok=True);pg.screenshot(path=os.path.join(SHOTS,n))
def phone(p,w=390,h=844,story=False,sw='block'):
  b=p.chromium.launch();c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,has_touch=True,is_mobile=True,service_workers=sw)
  if not story:c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}")
  return b,c
def hero(p,w=390,h=844,cls='warrior'):
  b,c=phone(p,w,h);pg=T.fresh(c);T.full_create(pg,'Tess','human',cls);return b,pg
TOAST='''()=>{const t=document.getElementById("s4toast"),r=t.getBoundingClientRect(),cs=getComputedStyle(t);const pe=t.style.pointerEvents;t.style.pointerEvents="auto";/* the toast ignores taps; let the hit test see it */const top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);t.style.pointerEvents=pe;
 return {on:t.classList.contains("on"),op:+cs.opacity,text:t.textContent,onTop:!!top&&(top===t||t.contains(top)),story:!!(SOTA.storyOpen&&SOTA.storyOpen())}}'''
def t_reminders_story_on(p):
  b,c,pg=S6.start(p)
  for _ in range(30):  # after the opening, intro.js shows the cave screen within ~150 ms
    if S4.ev(pg,'SOTA.intro.caveOpen()'):break
    pg.wait_for_timeout(100)
  for _ in range(150):  # the cave 'Tap to begin' screen after creation (story ON) sits over the maze
    if not S4.ev(pg,'SOTA.intro.caveOpen()'):break
    if S4.ev(pg,'document.getElementById("icave").dataset.titleShown==="1"'):pg.touchscreen.tap(195,600);pg.wait_for_timeout(300);S6.drain(pg)
    pg.wait_for_timeout(100)
  T.check(not S4.ev(pg,'SOTA.intro.caveOpen()'),'cave screen never closed')
  tv=S4.ev(pg,'MAZE.taverns')[0]
  for d in (2,3,1,0):  # walk in from a zone 1 side (the north neighbour of tavern 1 is in zone 2 and opens its intro)
    if not S4.ev(pg,'a=>SOTA.canMove(a[0],a[1],a[2])',[tv[0],tv[1],d]):continue
    D=[(0,-1),(1,0),(0,1),(-1,0)][d];nb=[tv[0]+D[0],tv[1]+D[1]]
    if S4.ev(pg,'a=>SOTA.roomAt(a[0],a[1])',nb)>=0:continue
    S4.ev(pg,'a=>SOTA.teleport(a[0],a[1],a[2])',[nb[0],nb[1],(d+2)%4]);pg.wait_for_timeout(100)
    if S4.ev(pg,'SOTA.intro.caveOpen()'):continue
    S4.tap(pg,'[data-cmd=fwd]');break
  for _ in range(30):
    if S4.ev(pg,'SOTA.storyOpen()'):break
    pg.wait_for_timeout(100)
  T.check(S4.ev(pg,'SOTA.storyOpen()'),'join scene did not open (story ON)');T.check(len(S4.ev(pg,'SOTA.rpg.live().party'))==2,'nobody joined')
  s=S4.ev(pg,TOAST);T.check(not(s['on'] and s['onTop']) or not s['story'],f'toast state while the scene is up {s}')
  pg.wait_for_timeout(2600);S6.drain(pg);T.check(not S4.ev(pg,'SOTA.storyOpen()'),'scene still open');t0=time.time();seen=None
  while time.time()-t0<3:
    s=S4.ev(pg,TOAST)
    if s['on'] and s['op']>0.9 and s['onTop']:seen=s;break
    pg.wait_for_timeout(100)
  T.check(seen and 'stat point' in seen['text'] and 'Tap Party' in seen['text'],f'join reminder not visible on top after the scene: {S4.ev(pg,TOAST)}');shot(pg,'reminder-after-join-scene-390x844.png')
  pg.wait_for_timeout(4000);s=S4.ev(pg,TOAST);T.check(s['on'] and s['onTop'],f'reminder gone before 4 s {s}')
  # level-up popup OK: the reminder shows on top and stays (no scene open)
  pg.wait_for_timeout(2500);S4.ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])');pg.wait_for_timeout(200);S4.ev(pg,'SOTA.rpg.s5.lvlPopup(["Mira reached level 2!"])');  # the popup lives on the fight-result screen
  T.ttap(pg,'#s5lvlok');pg.wait_for_timeout(500)
  s=S4.ev(pg,TOAST);T.check(s['on'] and s['onTop'] and 'stat point' in s['text'],f'level-up reminder not on top {s}');pg.wait_for_timeout(4000)
  T.check(S4.ev(pg,TOAST)['on'],'level-up reminder gone before 4 s');b.close()
def t_craft_close_360(p):
  b,pg=hero(p,360,640);T.ev(pg,'SOTA.teleport(...MAZE.camps[0],0)');T.ev(pg,'SOTA.rpg.s5.campScreen(0)');pg.wait_for_timeout(200)
  T.ttap(pg,'[data-craftopen]');pg.wait_for_timeout(300)
  # QA repro: after a craft, the result picture and Known recipes make the pop-up tall enough to run under the lesson panel
  T.ev(pg,'''(()=>{const c=SOTA.rpg.live().party[0],id=n=>Object.keys(RPG.ITEMS).find(k=>RPG.ITEMS[k].n===n);c.bag.push(id("Herbs"),id("Bug shell"));const s5=SOTA.rpg.s5;s5.craftPut(id("Herbs"));s5.craftPut(id("Bug shell"));s5.craftPop();})()''')
  T.ttap(pg,'#s5craft');pg.wait_for_timeout(300);T.check(T.ev(pg,'!!document.querySelector("#s5craftpop img, #s5craftpop canvas, #s5craftpop svg")') or 'You made' in T.ev(pg,'document.getElementById("s5craftpop").textContent'),'craft did not happen')
  T.check(T.ev(pg,'!!document.getElementById("s5tut")'),'camp lesson not showing');T.check(T.ev(pg,'!!document.querySelector("[data-craftclose]")'),'no Close')
  cover=T.ev(pg,'''()=>{const p=document.getElementById("s5craftpop").getBoundingClientRect(),t=document.getElementById("s5tut").getBoundingClientRect();return {popBottom:p.bottom,tutTop:t.top}}''')
  T.check(cover['popBottom']<=cover['tutTop']+0.5,f'pop-up still runs under the lesson panel {cover}')
  T.ev(pg,'document.querySelector("[data-craftclose]").scrollIntoView({block:"nearest"})');pg.wait_for_timeout(200);shot(pg,'craft-close-360x640.png')
  hit=T.ev(pg,'''()=>{const e=document.querySelector("[data-craftclose]"),r=e.getBoundingClientRect(),t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return t===e||e.contains(t)}''')
  T.check(hit,'Close is covered');T.ttap(pg,'[data-craftclose]');T.check(not T.ev(pg,'!!document.getElementById("s5craftpop")'),'Close did not close');b.close()
def t_name_box(p):
  b,c=phone(p);pg=T.fresh(c);T.check(T.ev(pg,'document.getElementById("ccname").value')=='Hero','default name not Hero')
  T.ttap(pg,'#ccname');pg.keyboard.type('Qa Tess',delay=15);T.check(T.ev(pg,'document.getElementById("ccname").value')=='Qa Tess','typing added to the default: '+T.ev(pg,'document.getElementById("ccname").value'))
  b.close();b,c=phone(p);pg=T.fresh(c);T.ttap(pg,'#ccname');T.ttap(pg,'[data-race=human]');T.check(T.ev(pg,'document.getElementById("ccname").value')=='Hero','left empty: not back to Hero')
  T.ttap(pg,'[data-cls=warrior]');T.ttap(pg,'[data-skill]');T.ttap(pg,'#ccgo')
  if T.ev(pg,'SOTA.rpg.ui()')=='create':T.ttap(pg,'#ccgo')
  T.check(T.ev(pg,'SOTA.rpg.live()&&SOTA.rpg.live().party[0].name')=='Hero','hero not named Hero by default');b.close()
LUM='''()=>Promise.all([...document.querySelectorAll(".s4rc img")].map(i=>new Promise(r=>{const go=()=>{const c=document.createElement("canvas");c.width=c.height=96;const g=c.getContext("2d");g.drawImage(i,0,0,96,96);const d=g.getImageData(0,0,96,96).data;let n=0;for(let k=0;k<d.length;k+=4)if((d[k]+d[k+1]+d[k+2])/3>90)n++;r(n);};i.complete?go():i.onload=go;})))'''
def t_portraits(p):
  b,pg=hero(p);T.ev(pg,'(()=>{const L=SOTA.rpg.live();for(const d of RPG.COMPANIONS)L.party.push(RPG.makeCompanion(d,1));})()')
  T.ev(pg,'SOTA.rpg.partyScreen()');ok=False
  for _ in range(30):
    pg.wait_for_timeout(100);v=T.ev(pg,LUM)
    if len(v)==4 and all(n>150 for n in v):ok=True;break
  T.check(ok,f'portraits still dark {T.ev(pg,LUM)}');shot(pg,'party-portraits-390x844.png')
  T.ev(pg,'SOTA.rpg.closeUI()');T.ev(pg,'SOTA.rpg.partyScreen()');pg.wait_for_timeout(100);T.check(all(n>150 for n in T.ev(pg,LUM)),'reopened portraits dark');b.close()
def t_boot_guard(p):
  b,c=phone(p,sw='block');pg=c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);pg.wait_for_timeout(300)
  for _ in range(3):pg.evaluate('document.dispatchEvent(new Event("visibilitychange"))');pg.wait_for_timeout(100)
  T.check(not errs,f'page errors with service workers blocked: {errs}');b.close()
def t_gear_caps(p):
  b,pg=hero(p,cls='archer')
  ring=T.ev(pg,'(()=>{const c=SOTA.rpg.live().party[0];return Object.keys(RPG.ITEMS).find(id=>{const it=RPG.ITEMS[id];return it.hp>0&&it.slot==="acc"&&RPG.canEquip(c,id,"acc1")})})()')
  T.check(ring,'no HP ring for this hero');T.ev(pg,f'(()=>{{const c=SOTA.rpg.live().party[0];c.bag.push("{ring}");RPG.equip(c,"{ring}","acc1");c.hp=RPG.maxHp(c,RPG.DIFF[SOTA.rpg.live().diff].hp);c.mp=RPG.maxMp(c)+5;}})()')
  T.ev(pg,'SOTA.rpg.charScreen(0)');T.ttap(pg,'[data-slot=acc1]');T.ttap(pg,'[data-unequip=acc1]');pg.wait_for_timeout(100)
  r=T.ev(pg,'(()=>{const L=SOTA.rpg.live(),c=L.party[0];return {hp:c.hp,max:RPG.maxHp(c,RPG.DIFF[L.diff].hp),mp:c.mp,mmax:RPG.maxMp(c),ring:c.equip.acc1}})()')
  T.check(r['ring'] is None,'ring still on');T.check(r['hp']==r['max'],f'HP not capped after taking off the ring {r}');T.check(r['mp']==r['mmax'],f'MP not capped {r}');b.close()
with sync_playwright() as p:
  for n,f in [('1 reminders on top after the story scene, kept up (story ON)',t_reminders_story_on),('2 360x640 craft Close not covered by the lesson',t_craft_close_360),('3 name box default Hero',t_name_box),('4 party portraits drawn',t_portraits),('5 boot.js with service workers blocked: no error',t_boot_guard),('6 gear change caps HP and MP',t_gear_caps)]:run(n,f,p)
print(f'{passed} passed, {failed} failed');print('page errors:',T.ERRS[:5],S4.ERRS[:5]);sys.exit(1 if failed or T.ERRS else 0)
