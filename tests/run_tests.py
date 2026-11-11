"""Stage 1 tests on a pretend phone (Playwright Chromium, touch emulation, 412x915).
Usage: python tests/run_tests.py [base_url] [test names...]   exit 0 = all pass."""
import splash_helper as SPL  # t2386u logo splash: tap past it like a player
import sys,json,random,time
from playwright.sync_api import sync_playwright
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/').rstrip('/')+'/'
ONLY=sys.argv[2:]
MZ=json.load(open('/workspace/secret-adventures/handoff-stage1/maze/maze.json'))
OPEN={tuple(map(int,k.split(','))):set(map(tuple,v)) for k,v in MZ['open'].items()}
D=[(0,-1),(1,0),(0,1),(-1,0)]
def can(x,y,d):return (x+D[d][0],y+D[d][1]) in OPEN[(x,y)]
class Fail(Exception):pass
def check(c,msg):
  if not c:raise Fail(msg)
def ctx(p,sw=False):
  b=p.chromium.launch();c=b.new_context(viewport={'width':412,'height':915},has_touch=True,is_mobile=True,service_workers='allow' if sw else 'block');c.add_init_script("try{localStorage.setItem('sota.dev.nofight','1')}catch(e){}")
  return b,c
def page(c,errs=None,reqs=None):
  pg=c.new_page()
  if errs is not None:
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e:errs.append(str(e)))
  if reqs is not None:pg.on('request',lambda r:reqs.append(r.url))
  pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA');SPL.pass_splash(pg);return pg
def btn(pg):
  o={}
  for k in ['fwd','back','left','right']:
    bb=pg.locator(f'[data-cmd={k}]').bounding_box();o[k]=(bb['x']+bb['width']/2,bb['y']+bb['height']/2)
  return o
def tap(pg,B,k):pg.touchscreen.tap(*B[k])
def S(pg):return pg.evaluate('SOTA.state()')
def fresh(pg):pg.evaluate('localStorage.clear();localStorage.setItem("sota.rooms",JSON.stringify({s:[...Array(85).keys()],c:[...Array(85).keys()]}))');pg.reload();pg.wait_for_function('window.SOTA');SPL.pass_splash(pg)

def t_maze_loads(p):
  b,c=ctx(p);pg=page(c);fresh(pg)
  check(pg.evaluate('SOTA.N')==65,'grid not 65')
  z=pg.evaluate('SOTA.zones()');check(z[1:]==MZ['area_per_section'],f'zone counts {z}')
  s=S(pg);check((s['x'],s['y'],s['zone'])==(0,64,1),f'start {s}')
  m=pg.evaluate('MAZE');check(m['centre']==[32,32] and m['entrance']==[0,64],'centre/entrance')
  check(m['zone'][32*65+32]=='5','centre zone')
  for (x,y),nb in OPEN.items():
    mk=int(m['mask'][y*65+x],16)
    for d in range(4):check(bool(mk&(1<<d))==((x+D[d][0],y+D[d][1]) in nb),f'mask {x},{y}')
    check(int(m['zone'][y*65+x])==MZ['section_of_cell'][f'{x},{y}'],'zone mismatch')
  check(len(m['taverns'])==4 and len(m['camps'])==42 and len(m['rooms'])==85,'poi counts')
  b.close()

def turn_to(pg,B,want):
  s=S(pg)['f']
  while s!=want:
    tap(pg,B,'right' if (want-s)%4!=3 else 'left');s=S(pg)['f']
def t_route_walk(p):
  b,c=ctx(p);pg=page(c);fresh(pg);B=btn(pg);r=MZ['main_route']
  check(len(r)==697,'route len')
  # t2528u: a seam edge is a tavern archway: walking into it bumps (no move); its Zone tab crosses (SOTA.seamExit)
  SEAM={}
  for sm in pg.evaluate('SOTA.seams?SOTA.seams():[]'):
    a_,b_=sm['prev'],sm['next'];SEAM[(a_['x'],a_['y'],b_['x'],b_['y'])]=(sm['t'],b_['zone']);SEAM[(b_['x'],b_['y'],a_['x'],a_['y'])]=(sm['t'],a_['zone'])
  for i in range(1,len(r)):
    (x0,y0),(x1,y1)=r[i-1],r[i];d=D.index((x1-x0,y1-y0));turn_to(pg,B,d);tap(pg,B,'fwd')
    if (x0,y0,x1,y1) in SEAM:
      s=S(pg);check((s['x'],s['y'])==(x0,y0),f'step {i}: archway did not bump {s}')
      pg.evaluate('()=>{const r=SOTA.rpg;if(r&&r.closeUI)r.closeUI();}');pg.wait_for_timeout(300)
      t,z=SEAM[(x0,y0,x1,y1)];pg.evaluate(f'SOTA.seamExit({t},{z})');s=S(pg);check((s['x'],s['y'])==(x1,y1),f'step {i}: seam exit {s}');continue
    s=S(pg);check((s['x'],s['y'])==(x1,y1),f'step {i} at {s} want {x1},{y1}')
    if i%25==0:
      tap(pg,B,'back');s=S(pg);check((s['x'],s['y'],s['f'])==(x0,y0,d),f'back step {i} gave {s}')
      tap(pg,B,'fwd');s=S(pg);check((s['x'],s['y'])==(x1,y1),f're-step {i}')
  s=S(pg);check((s['x'],s['y'],s['zone'])==(32,32,5),'not at centre');b.close()

def t_walls(p):
  b,c=ctx(p);pg=page(c);fresh(pg);B=btn(pg);rnd=random.Random(7);cells=rnd.sample(sorted(OPEN),40);n=0
  for (x,y) in cells:
    for d in range(4):
      if not can(x,y,d):
        pg.evaluate(f'SOTA.teleport({x},{y},{d})');tap(pg,B,'fwd');s=S(pg);check((s['x'],s['y'])==(x,y),f'walked through wall {x},{y} d{d}')
        pg.evaluate(f'SOTA.teleport({x},{y},{(d+2)%4})');tap(pg,B,'back');s=S(pg);check((s['x'],s['y'])==(x,y),f'backed through wall {x},{y}');n+=1
  # grid edges
  pg.evaluate('SOTA.teleport(0,64,3)');tap(pg,B,'fwd');check(S(pg)['x']==0,'left edge')
  pg.evaluate('SOTA.teleport(0,64,2)');tap(pg,B,'fwd');check(S(pg)['y']==64,'bottom edge')
  check(n>40,'too few wall checks');b.close()

def t_turning(p):
  b,c=ctx(p);pg=page(c);fresh(pg);B=btn(pg)
  f0=S(pg)['f'];seq=[('right',1),('right',2),('left',1),('left',0),('left',3),('right',0)]
  for k,want in seq:tap(pg,B,k);check(S(pg)['f']==(f0+want)%4,f'turn {k} gave {S(pg)}')
  for _ in range(4):tap(pg,B,'right')
  check(S(pg)['f']==f0,'4 rights not full circle');s=S(pg);check((s['x'],s['y'])==(0,64),'turn moved')
  b.close()

def t_mash(p):
  b,c=ctx(p);pg=page(c);fresh(pg);B=btn(pg);rnd=random.Random(3);x,y,f=0,64,0
  for _ in range(300):
    k=rnd.choice(['fwd','fwd','back','left','right']);tap(pg,B,k)
    if k=='left':f=(f+3)%4
    elif k=='right':f=(f+1)%4
    else:
      d=f if k=='fwd' else (f+2)%4
      if can(x,y,d):x+=D[d][0];y+=D[d][1]
  s=S(pg);check((s['x'],s['y'],s['f'])==(x,y,f),f'mash state {s} want {(x,y,f)}')
  pg.wait_for_timeout(400);check(not pg.evaluate('SOTA.animating()'),'stuck animating')
  v=pg.evaluate('SOTA.vis()');check(abs(v['x']-x)<1e-6 and abs(v['y']-y)<1e-6,'view not at state')
  import math;check(abs(((v['a']-f*math.pi/2)/(2*math.pi))-round((v['a']-f*math.pi/2)/(2*math.pi)))<1e-6,'view angle off')
  tap(pg,B,'right');check(S(pg)['f']==(f+1)%4,'input after mash lost');b.close()

def t_save_reload(p):
  b,c=ctx(p);pg=page(c);fresh(pg);B=btn(pg);r=MZ['main_route']
  for i in range(1,12):
    (x0,y0),(x1,y1)=r[i-1],r[i];turn_to(pg,B,D.index((x1-x0,y1-y0)));tap(pg,B,'fwd')
  tap(pg,B,'left');s=S(pg);pg.reload();pg.wait_for_function('window.SOTA');SPL.pass_splash(pg);s2=S(pg)
  check(s==s2 and (s['x'],s['y'])!=(0,64),f'save {s} reload {s2}')
  pg.evaluate('localStorage.setItem("sota.stage1.save","{bad json")');pg.reload();pg.wait_for_function('window.SOTA');SPL.pass_splash(pg)
  check((S(pg)['x'],S(pg)['y'])==(0,64),'bad save not ignored');b.close()

def t_offline(p):
  b,c=ctx(p,sw=True);pg=page(c)
  pg.wait_for_function('navigator.serviceWorker.ready.then(()=>true)');pg.reload();pg.wait_for_function('window.SOTA&&navigator.serviceWorker.controller');SPL.pass_splash(pg)
  c.set_offline(True);pg.reload();pg.wait_for_function('window.SOTA',timeout=8000);SPL.pass_splash(pg)
  check(pg.evaluate('typeof SOTA.state')=='function','offline load failed')
  ok=pg.evaluate('Promise.all(["manifest.json","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png"].map(u=>fetch(u).then(r=>r.ok,()=>false)))')
  check(all(ok),f'offline assets {ok}')
  # Playwright offline mode may not cover worker fetches, so also prove every file the page loaded is in the worker's saved copy.
  miss=pg.evaluate('''(async()=>{const c=await caches.open((await caches.keys()).find(k=>k.startsWith("sota-s1-")));const u=[location.href.split("?")[0],...performance.getEntriesByType("resource").map(e=>e.name)].filter(x=>x.startsWith(location.origin));
    const out=[];for(const x of u){if(!(await c.match(x,{ignoreSearch:x.endsWith(".html")})))out.push(x);}return out;})()''')
  check(not miss,f'not cached: {miss}')
  reg=pg.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.updateViaCache)');check(reg=='none','updateViaCache not none')
  b.close()

def t_network_console(p):
  errs=[];reqs=[];b,c=ctx(p,sw=True);pg=page(c,errs,reqs);B=btn(pg)
  for k in ['fwd','right','fwd','left','back']:tap(pg,B,k)
  pg.wait_for_timeout(1500);pg.reload();pg.wait_for_function('window.SOTA');SPL.pass_splash(pg);pg.wait_for_timeout(500)
  bad=[u for u in reqs if not u.startswith(BASE) and not u.startswith('data:')];check(not bad,f'outside requests {bad}')
  check(not errs,f'console errors {errs}');b.close()

T={k[2:]:v for k,v in globals().items() if k.startswith('t_')}
fails=0
with sync_playwright() as p:
  for n,f in T.items():
    if ONLY and n not in ONLY:continue
    t=time.time()
    try:f(p);print(f'PASS {n} ({time.time()-t:.1f}s)')
    except Exception as e:fails+=1;print(f'FAIL {n}: {str(e)[:200]}')
sys.exit(1 if fails else 0)
