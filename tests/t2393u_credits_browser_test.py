"""t2393u/t2394u/t2386u ending screens on pretend phones (Playwright Chromium, touch), all 3 endings:
1) end-game review first: 'Ending: ...', Puzzles solved, Wall art found, one Continue button, nothing from the credits;
2) Continue opens the credits on their own screen: the exact credit lines in order, the faith badge small in the bottom-left,
   and Back to the maze, which still closes the ending.
Badge never overlaps any credit line, the text box or the button at 360x640, 390x844 and 1280x800, at the top, middle and end
of the credits scroll. Usage: python3 tests/t2393u_credits_browser_test.py <base_url> [screenshot_dir]"""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import splash_helper as SPL
from playwright.sync_api import sync_playwright
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/').rstrip('/')+'/'
SHOTS=sys.argv[2] if len(sys.argv)>2 else None
LINES=['Credits','Secret of the Adventure','Music: SlimeTrail Production','Art: SlimeTrail Production','Game Design: SlimeTrail Production','Thank you for playing.']
BADGE='art-intro/brand/faith-badge-matthew-5-13-16.jpg'
ENDINGS=[('low',[]),('mid',[36]),('high','all')]  # mid: the crack room; high: every wall-art room (story-gates allArt)
class Fail(Exception):pass
def check(c,m):
  if not c:raise Fail(m)
ev=lambda pg,s,*a:pg.evaluate(s,*a)
def shot(pg,name):
  if SHOTS:os.makedirs(SHOTS,exist_ok=True);pg.wait_for_timeout(300);pg.screenshot(path=os.path.join(SHOTS,name))
def open_ending(p,k,walls,w=390,h=844,errs=None):
  b=p.chromium.launch();c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=w<1000,service_workers='block');pg=c.new_page()
  if errs is not None:pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(BASE+'index.html');SPL.pass_splash(pg);ev(pg,'SOTA.intro.shortTap()');ev(pg,'localStorage.setItem("sota.dev.nostory","1")')
  ev(pg,'''([n,r,c])=>{const q=s=>document.querySelector(s);const i=q('#ccname');i.value=n;i.dispatchEvent(new Event('input'));q('[data-race='+r+']').click();q('[data-cls='+c+']').click();q('[data-skill]').click();q('#ccgo').click();if(SOTA.rpg.ui()==='create')q('#ccgo').click();}''',['Wes','human','warrior'])
  ev(pg,'w=>{const s=SOTA.rpg.s6.st();s.walls={};(w==="all"?SOTA.rpg.s6.artRooms():w).forEach(i=>s.walls[i]=1);}',walls)
  ev(pg,'localStorage.removeItem("sota.dev.nostory")');ev(pg,'SOTA.rpg.s6.setSpeed(0)');ev(pg,'SOTA.rpg.s6.showEnding()')
  check(ev(pg,'SOTA.rpg.s6.st().ending')==k,'ending '+k)
  for _ in range(60):
    if ev(pg,'!!document.querySelector("#s6d .s6title")'):break
    pg.keyboard.press('Enter');pg.wait_for_timeout(60)
  pg.wait_for_timeout(300);return b,pg
def screen(pg):
  return ev(pg,'''(()=>{const b=document.getElementById("s6d"),t=b.querySelector(".s6t");return {scr:b.dataset.endScreen||null,txt:t.innerText,title:(b.querySelector(".s6title")||{}).textContent||null,
   cnt:(b.querySelector(".s6cnt")||{}).textContent||null,cred:!!b.querySelector("#icred"),badge:b.querySelectorAll(".icred-badge").length,
   btns:[...b.querySelectorAll(".s6btns button")].map(x=>x.textContent),lines:[...b.querySelectorAll("#icred > div")].map(x=>x.textContent),
   src:(b.querySelector(".icred-badge")||{}).getAttribute?b.querySelector(".icred-badge").getAttribute("src"):null,open:SOTA.storyOpen(),cue:SOTA.music.now()}})()''')
def t_review_then_credits_all_endings(p):
  for k,walls in ENDINGS:
    errs=[];b,pg=open_ending(p,k,walls,errs=errs);r=screen(pg)
    check(r['scr']=='review' and r['title'] and r['title'].startswith('Ending: '),f'{k}: review not first {r}')
    check(r['cnt'] and 'Puzzles solved' in r['cnt'] and 'Wall art found' in r['cnt'],f'{k}: review counts {r}')
    check(r['btns']==['Continue'],f'{k}: review buttons {r["btns"]}')
    check(not r['cred'] and r['badge']==0 and not any(x in r['txt'] for x in ['Credits','SlimeTrail','Slimetrail','Thank you for playing','Secret of the Adventure']),f'{k}: credits on the review {r}')
    shot(pg,f'ending-{k}-review-390x844.png')
    pg.locator('[data-s6b=continue]').tap();pg.wait_for_timeout(300);r=screen(pg)
    check(r['scr']=='credits' and r['cred'] and r['lines']==LINES,f'{k}: credit lines/order {r["lines"]}')
    check([l for l in r['txt'].split('\n') if l.strip()]==LINES,f'{k}: credits screen shows other text {r["txt"]!r}')
    check(r['title'] is None and r['cnt'] is None,f'{k}: review left on credits {r}')
    check(r['badge']==1 and r['src']==BADGE,f'{k}: badge {r}')
    check(r['btns']==['Back to the maze'],f'{k}: credits buttons {r["btns"]}')
    check(ev(pg,'document.querySelector(".icred-badge").complete&&document.querySelector(".icred-badge").naturalWidth>0'),f'{k}: badge image did not load')
    check(r['cue']=='credits',f'{k}: credits music {r["cue"]}')
    shot(pg,f'ending-{k}-credits-390x844.png')
    pg.locator('[data-s6b=back]').tap();pg.wait_for_timeout(300)
    check(not ev(pg,'SOTA.storyOpen()') and ev(pg,'document.querySelectorAll(".icred-badge").length')==0,f'{k}: Back to the maze did not close')
    check(not errs,f'{k}: errors {errs}');b.close()
GEOM='''(()=>{const b=document.getElementById("s6d"),g=b.querySelector(".icred-badge").getBoundingClientRect(),t=b.querySelector(".s6t"),R=e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]};
 return {badge:[g.left,g.top,g.right,g.bottom],box:R(t),btn:R(b.querySelector(".s6btns button")),lines:[...b.querySelectorAll("#icred > div")].map(R),sh:t.scrollHeight,ch:t.clientHeight,st:t.scrollTop,vw:innerWidth,vh:innerHeight}})()'''
def inter(a,b):return min(a[2],b[2])>max(a[0],b[0]) and min(a[3],b[3])>max(a[1],b[1])
def t_badge_never_covers_credits(p):
  for (w,h) in [(360,640),(390,844),(1280,800)]:
    for k,walls in ENDINGS:
      b,pg=open_ending(p,k,walls,w,h);pg.locator('[data-s6b=continue]').tap();pg.wait_for_timeout(300)
      G=ev(pg,GEOM);bw=G['badge'][2]-G['badge'][0]
      check(G['badge'][0]>=0 and G['badge'][3]<=h and G['badge'][0]<=24 and G['badge'][3]>=h-30,f'{w}x{h} {k}: badge not in the bottom-left {G["badge"]}')
      check(40<=bw<=80,f'{w}x{h} {k}: badge not small ({bw}px)')
      for pos in ['0','t.scrollHeight/2','t.scrollHeight']:
        ev(pg,f'(()=>{{const t=document.querySelector("#s6d .s6t");t.scrollTop={pos};}})()');pg.wait_for_timeout(80);G=ev(pg,GEOM)
        check(not inter(G['badge'],G['box']),f'{w}x{h} {k} scroll {pos}: badge overlaps the credits box {G}')
        check(not inter(G['badge'],G['btn']),f'{w}x{h} {k}: badge overlaps Back to the maze {G}')
        for i,l in enumerate(G['lines']):check(not inter(G['badge'],l),f'{w}x{h} {k} scroll {pos}: badge covers line {i} {G}')
      ev(pg,'document.querySelector("#s6d .s6t").scrollTop=0');G=ev(pg,GEOM)
      check(all(l[1]>=G['box'][1]-0.5 and l[3]<=G['box'][3]+0.5 for l in G['lines']) or G['sh']>G['ch'],f'{w}x{h} {k}: lines cut off without scrolling {G}')
      if k=='mid' and w in(360,1280):shot(pg,f'ending-{k}-credits-{w}x{h}.png')
      b.close()
def t_landscape_shots(p):
  for (w,h) in [(844,390)]:
    b,pg=open_ending(p,'high','all',w,h);shot(pg,f'ending-high-review-{w}x{h}.png');pg.locator('[data-s6b=continue]').dispatch_event('pointerdown');pg.wait_for_timeout(300);shot(pg,f'ending-high-credits-{w}x{h}.png')
    check(ev(pg,'document.getElementById("s6d").dataset.endScreen')=='credits','landscape credits');b.close()
TESTS=[t_review_then_credits_all_endings,t_badge_never_covers_credits,t_landscape_shots]
if __name__=='__main__':
  ok=0;bad=[]
  with sync_playwright() as p:
    for t in TESTS:
      try:t(p);ok+=1;print('PASS',t.__name__,flush=True)
      except Exception as e:bad.append(t.__name__);print('FAIL',t.__name__,str(e)[:900],flush=True)
  print(f'{ok} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
