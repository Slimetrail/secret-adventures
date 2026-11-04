"""s6- screenshots at 3 phone sizes (pretend phone). python tools/shots6.py http://127.0.0.1:8765/ OUTDIR"""
import sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','tests'))
import stage4_tests as S4,stage6_tests as T6
from stage4_tests import ev,step_into,create,page
from playwright.sync_api import sync_playwright
S4.BASE=sys.argv[1];OUT=sys.argv[2]
def at_line(pg,pred,limit=60):
  ev(pg,'SOTA.rpg.s6.setSpeed(0)')
  for _ in range(limit):
    l=ev(pg,'SOTA.rpg.s6.line()')
    if l and not l['typing'] and ev(pg,pred):return
    if l and l['typing']:pg.wait_for_timeout(20);continue
    T6.tapbox(pg);pg.wait_for_timeout(30)
def snap(pg,name,w,h):pg.wait_for_timeout(250);pg.screenshot(path=f'{OUT}/s6-{name}-{w}x{h}.png')
with sync_playwright() as p:
  for w,h in((390,844),(360,800),(412,915)):
    b,c=T6.ctx(p,w,h);pg=page(c);create(pg,race='human',cls='warrior')
    at_line(pg,'document.getElementById("s6d").dataset.who==="D"');snap(pg,'opening',w,h);T6.drain(pg)
    t=ev(pg,'MAZE.taverns');step_into(pg,t[1]);at_line(pg,'document.getElementById("s6d").dataset.who==="Q"');snap(pg,'join',w,h);T6.drain(pg)
    step_into(pg,t[2]);T6.drain(pg)
    ev(pg,'SOTA.rpg.s5.tavernScreen(2)');at_line(pg,'["Q","S"].includes(document.getElementById("s6d").dataset.who)');snap(pg,'tavern',w,h);T6.drain(pg)
    pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');ev(pg,'SOTA.setAnim(false)')
    W=T6.walls_by_zone(pg);A=ev(pg,'SOTA.rpg.s6.artRooms()')
    def wall(i,name):
      ev(pg,f'SOTA.onRoomOpen({i})');at_line(pg,'document.getElementById("s6d").dataset.who==="H"');snap(pg,name,w,h);T6.drain(pg)
    wall(W['1'][0],'wall-first');wall(W['3'][0],'wall-2nd-z3');wall(W['4'][1],'wall-3rd-z4')
    ev(pg,'(()=>{const s=SOTA.rpg.s6.st();for(const i of SOTA.rpg.s6.artRooms())if(Object.keys(s.walls).length<27&&!s.walls[i]&&i!==%d)s.walls[i]=1})()'%W['5'][-1])
    ev(pg,'SOTA.rpg.s6.st().order=Object.keys(SOTA.rpg.s6.st().walls).map(Number)')
    i=W['5'][-1];ev(pg,f'SOTA.onRoomOpen({i})');ev(pg,'SOTA.rpg.s6.setSpeed(0)')
    at_line(pg,'SOTA.rpg.s6.open()&&document.querySelector("#s6d .s6t").textContent.includes("He was here")',120)
    print('last wall:',ev(pg,'SOTA.rpg.s6.line()'),ev(pg,'document.querySelector("#s6d .s6t").textContent')[:60])
    snap(pg,'wall-last',w,h);T6.drain(pg)
    ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])');snap(pg,'fightstart',w,h);ev(pg,'SOTA.rpg.forceEnd("ran")');S4.tap(pg,'#fdone')
    ev(pg,'SOTA.rpg.s6.bossNote()');at_line(pg,'true');snap(pg,'bossnote',w,h);T6.drain(pg);snap(pg,'bossdoor',w,h)
    ev(pg,'document.querySelector("[data-s6b=open]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))');T6.drain(pg);snap(pg,'ending',w,h);b.close()
print('done')
