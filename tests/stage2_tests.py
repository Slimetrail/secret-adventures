"""Stage 2 tests on a pretend phone (Playwright Chromium, touch). Usage: python tests/stage2_tests.py [base_url] [names...]"""
import sys,os,json,time,random
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tools'));import walk as W
from playwright.sync_api import sync_playwright
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/').rstrip('/')+'/';ONLY=sys.argv[2:]
MZ=W.MZ;D=W.D
class Fail(Exception):pass
def check(c,m):
  if not c:raise Fail(m)
def ctx(p,w=412,h=915,sw=False):
  b=p.chromium.launch();return b,b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,service_workers='allow' if sw else 'block')
def page(c,errs=None,reqs=None):
  pg=c.new_page()
  if errs is not None:pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e:errs.append(str(e)))
  if reqs is not None:pg.on('request',lambda r:reqs.append(r.url))
  pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA');pg.evaluate('localStorage.clear();localStorage.setItem("sota.rooms",JSON.stringify({s:[...Array(85).keys()],c:[...Array(85).keys()]}))');pg.reload();pg.wait_for_function('window.SOTA');return pg
def bb(pg,sel):return pg.locator(sel).bounding_box()
def ctr(b):return (b['x']+b['width']/2,b['y']+b['height']/2)
def tap(pg,sel):
  pg.touchscreen.tap(*ctr(bb(pg,sel)))
  if sel in('#mzin','#mzout','#mctr'):pg.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
def S(pg):return pg.evaluate('SOTA.state()')
def MD(pg):return pg.evaluate('Object.assign({},document.getElementById("map").dataset)')
def walk(pg,cells,by_tap=False):
  cs,_=W.cmds(cells,S(pg)['f'])
  if by_tap:
    for k in cs:tap(pg,f'[data-cmd={k}]')
  else:pg.evaluate('SOTA.setAnim(false)');pg.evaluate('c=>c.forEach(k=>SOTA.act(k))',cs);pg.evaluate('SOTA.setAnim(true)')
  return sum(1 for k in cs if k=='fwd')
def over(a,b):return not(a['x']+a['width']<=b['x'] or b['x']+b['width']<=a['x'] or a['y']+a['height']<=b['y'] or b['y']+b['height']<=a['y'])
TOUR=None
def tour():
  r,_,_=W.zone1_tour();cells=list(r)
  for a,b_ in [(r[-1],(15,50)),((15,50),(14,51)),((14,51),(17,53))]:cells+=W.path(a,b_)[1:]
  return cells

def t_slots_layout(p):
  for (w,h) in [(360,800),(412,915),(915,412)]:
    b,c=ctx(p,w,h);pg=page(c);sl=[bb(pg,f'[data-slot="{i}"]') for i in range(4)]
    check(pg.locator('.slot').count()==4,'slot count');bt=[bb(pg,f'[data-cmd={k}]') for k in ['fwd','back','left','right']]+[bb(pg,'#mapb'),bb(pg,'#dbg')]
    for x in sl+bt:check(x['width']>=44 and x['height']>=44,f'{w}x{h} too small {x}')
    for s in sl:
      for x in bt:check(not over(s,x),f'{w}x{h} slot overlaps button')
      check(s['y']+s['height']<=h and s['y']>h*0.6 if h>w else s['y']>h*0.55,f'{w}x{h} slot not at bottom {s}')
      cx=s['x']+s['width']/2;check(w*0.25<cx<w*0.75,f'{w}x{h} slot not centre {cx}')
    L=bt[1];R=bt[2];check(L['x']+L['width']<w*0.3 and R['x']>w*0.55 and bt[3]['x']>w*0.7,'pads not left/right')
    for i in range(4):
      for j in range(i):check(not over(sl[i],sl[j]),'slots overlap')
    b.close()

def t_slot_tap(p):
  b,c=ctx(p);pg=page(c);check(pg.evaluate('JSON.parse(localStorage.getItem("sota.items"))')==[None]*4,'items not 4 nulls')
  s0=S(pg);rnd=random.Random(5);exp=(s0['x'],s0['y'],s0['f'])
  for n in range(80):
    k=rnd.choice(['fwd','left','right','back','slot'])
    if k=='slot':tap(pg,f'[data-slot="{rnd.randrange(4)}"]');continue
    x,y,f=exp
    if k=='left':f=(f+3)%4
    elif k=='right':f=(f+1)%4
    else:
      d=f if k=='fwd' else (f+2)%4
      if (x+D[d][0],y+D[d][1]) in W.OPEN[(x,y)]:x+=D[d][0];y+=D[d][1]
    exp=(x,y,f);tap(pg,f'[data-cmd={k}]')
  s=S(pg);check((s['x'],s['y'],s['f'])==exp,f'lost input {s} {exp}');b.close()

def t_map_open_close(p):
  b,c=ctx(p);pg=page(c);check(not pg.locator('#map').is_visible(),'map open at start')
  tap(pg,'#mapb');check(pg.locator('#map').is_visible(),'map not opened');tap(pg,'#mclose');check(not pg.locator('#map').is_visible(),'map not closed')
  s=S(pg);tap(pg,'[data-cmd=right]');check(S(pg)['f']==(s['f']+1)%4,'turn after map broken')
  walk(pg,[(0,64),(1,64)],True);check((S(pg)['x'],S(pg)['y'])==(1,64),'move after map broken');b.close()

def t_map_only_visited(p):
  b,c=ctx(p);pg=page(c);tap(pg,'#mapb');m=MD(pg);check(m['cells']=='1' and m['dots']=='0','fresh map not 1 cell: '+str(m));tap(pg,'#mclose')
  cells=MZ['main_route'][:30];walk(pg,[tuple(x) for x in cells],True);tap(pg,'#mapb');m=MD(pg)
  vis=pg.evaluate('SOTA.visitedCount()');check(vis==len({tuple(x) for x in cells}),f'visited {vis}')
  check(int(m['cells'])==vis,f'drawn {m["cells"]} visited {vis}');b.close()

def t_map_markers(p):
  b,c=ctx(p);pg=page(c);cells=tour();steps=walk(pg,cells);tap(pg,'#mapb')
  for _ in range(4):tap(pg,'#mzout')
  m=MD(pg);vs={tuple(x) for x in cells};check(pg.evaluate('SOTA.visitedCount()')==len(vs),'visited set')
  camps=sum(1 for c_ in MZ['camps'] if tuple(c_['cell']) in vs);rooms=[r for r in MZ['rooms'] if tuple(r['cell']) in vs]
  tav=sum(1 for t in MZ['taverns'] if tuple(t['cell']) in vs);mon=sum(1 for r in rooms if r['kind']=='monster')
  check(camps>=1 and mon>=1 and tav==1,f'route did not reach camp/monster/tavern {camps} {mon} {tav}')
  got=(int(m['tents']),int(m['doors']),int(m['xs']),int(m['taverns']));want=(camps,len(rooms),mon,tav);check(got==want,f'markers {got} want {want}')
  check(int(m['dots'])==steps,f'dots {m["dots"]} steps {steps}');check(int(m['cells'])==len(vs),'cells')
  b.close()

def t_map_arrow(p):
  b,c=ctx(p);pg=page(c)
  for n in range(6):
    tap(pg,'#mapb');check(int(MD(pg)['arrow'])==S(pg)['f'],'arrow wrong');tap(pg,'#mclose');tap(pg,'[data-cmd=right]' if n%3 else '[data-cmd=left]')
  b.close()

def t_map_panzoom(p):
  # Stage 2b change: the map now opens fitted to the explored area (not centred on the player), and recentre returns to that fit.
  b,c=ctx(p);pg=page(c);walk(pg,[tuple(x) for x in MZ['main_route'][:20]]);tap(pg,'#mapb');v0=MD(pg)
  tap(pg,'#mzin');check(float(MD(pg)['z'])>float(v0['z']),'zoom in');tap(pg,'#mzout');tap(pg,'#mzout');check(float(MD(pg)['z'])<float(v0['z']),'zoom out')
  tap(pg,'#mzin');tap(pg,'#mzin');tap(pg,'#mzin');v0b=MD(pg)
  pg.mouse.move(200,400);pg.mouse.down();pg.mouse.move(240,430,steps=5);pg.mouse.up();pg.wait_for_timeout(100);v1=MD(pg)
  check(v1['cx']!=v0b['cx'] and v1['cy']!=v0b['cy'],'drag did not pan')
  tap(pg,'#mctr');pg.wait_for_timeout(100);v2=MD(pg);check(v2['cx']==v0['cx'] and v2['cy']==v0['cy'] and v2['z']==v0['z'],'recenter did not restore fit');b.close()

def inside(r,w,h):return r['l']>=0 and r['t']>=0 and r['r']<=w and r['b']<=h
def t_fit_open(p):
  for (w,h) in [(360,800),(412,915),(915,412)]:
    for n in [30,98]:
      b,c=ctx(p,w,h);pg=page(c);cells=[tuple(x) for x in MZ['main_route'][:n]]
      if n==98:cells=tour()
      walk(pg,cells);tap(pg,'#mapb');r=pg.evaluate('SOTA.map.bboxScreen()');a=pg.evaluate('SOTA.map.area()')
      check(r['l']>=a['l']-1 and r['t']>=a['t']-1 and r['r']<=a['r']+1 and r['b']<=a['b']+1,f'{w}x{h} n{n} box {r} not in {a}')
      check(r['z']<=r['cap']+1e-9,'over cap');b.close()
  b,c=ctx(p);pg=page(c);tap(pg,'#mapb');r=pg.evaluate('SOTA.map.bboxScreen()');check(r['z']<=r['cap'] and r['z']<=48,f'1-cell zoom {r["z"]}');b.close()

def t_marker(p):
  # Data method: the marker exports its geometry (cell centre, ring radius, arrow centre+size, icon radius) in css px.
  # The icon is drawn inside radius ir around the cell centre; the ring must lie outside it and the arrow must not reach into it.
  import math
  for (w,h,cell) in [(412,915,(14,49)),(360,800,(15,50)),(915,412,(14,49))]:
    b,c=ctx(p,w,h);pg=page(c);cs=W.path((0,64),cell) if cell==(14,49) else tour()[:tour().index(cell)+1];walk(pg,cs)
    check((S(pg)['x'],S(pg)['y'])==cell,'not on poi');
    for z in ['open','out','out','out','out','out','out']:
      if z=='open':tap(pg,'#mapb')
      else:tap(pg,'#mzout')
      m=pg.evaluate('SOTA.map.marker()');check(0<=m['px']<=w and 0<=m['py']<=h and 0<=m['ax']<=w and 0<=m['ay']<=h,f'marker off screen {m}')
      check(m['rr']*2>=16 and m['ar']*2>=16,f'marker too small {m}')
      dd=math.hypot(m['ax']-m['px'],m['ay']-m['py']);check(m['rr']>m['ir'] and dd-m['ar']>m['ir'],f'marker covers icon {m}')
    b.close()

def t_drag(p):
  b,c=ctx(p);pg=page(c);walk(pg,tour());tap(pg,'#mapb')
  for _ in range(3):tap(pg,'#mzin')
  v0=MD(pg);z=float(v0['z'])
  pg.mouse.move(150,450);pg.mouse.down();pg.mouse.move(210,410,steps=8);pg.mouse.up();pg.wait_for_timeout(100);v1=MD(pg)
  dx=(float(v0['cx'])-float(v1['cx']))*z;dy=(float(v0['cy'])-float(v1['cy']))*z
  check(abs(dx-60)<6 and abs(dy+40)<6,f'drag moved {dx:.1f},{dy:.1f} want 60,-40')
  # drag that ends over the close and zoom buttons must not press them
  cb=bb(pg,'#mclose');pg.mouse.move(200,300);pg.mouse.down();pg.mouse.move(cb['x']+20,cb['y']+20,steps=6);pg.mouse.up()
  zb=bb(pg,'#mzin');zz=MD(pg)['z'];pg.mouse.move(200,500);pg.mouse.down();pg.mouse.move(zb['x']+20,zb['y']+20,steps=6);pg.mouse.up();pg.wait_for_timeout(100)
  check(pg.locator('#map').is_visible(),'drag closed the map');check(MD(pg)['z']==zz,'drag pressed zoom')
  # touch drag works too
  cdp=c.new_cdp_session(pg);v2=MD(pg)
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':200,'y':400}]})
  for i in range(1,6):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':200-8*i,'y':400}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});pg.wait_for_timeout(100)
  check(float(MD(pg)['cx'])>float(v2['cx']),'touch drag did not pan');b.close()

def t_pan_clamp(p):
  b,c=ctx(p);pg=page(c);walk(pg,[tuple(x) for x in MZ['main_route'][:30]]);tap(pg,'#mapb')
  for _ in range(4):tap(pg,'#mzin')
  for (dx,dy) in [(500,0),(-500,0),(0,500),(0,-500)]:
    pg.evaluate(f'SOTA.map.pan({dx},{dy})');pg.wait_for_timeout(50);r=pg.evaluate('SOTA.map.bboxScreen()')
    check(r['r']>0 and r['l']<412 and r['b']>0 and r['t']<915,f'explored area lost {dx},{dy}: {r}')
    pg.mouse.move(200,400);pg.mouse.down();pg.mouse.move(200+dx,400+dy,steps=4);pg.mouse.up();r=pg.evaluate('SOTA.map.bboxScreen()')
    check(r['r']>0 and r['l']<412 and r['b']>0 and r['t']<915,f'drag lost area: {r}')
  tap(pg,'#mctr');r=pg.evaluate('SOTA.map.bboxScreen()');a=pg.evaluate('SOTA.map.area()');check(r['l']>=a['l']-1 and r['r']<=a['r']+1,'recentre not fit');b.close()

def t_pinch(p):
  b,c=ctx(p);pg=page(c);walk(pg,tour());tap(pg,'#mapb');z0=float(MD(pg)['z']);cdp=c.new_cdp_session(pg)
  T=lambda t,pts:cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
  T('touchStart',[(200,450),(220,450)])
  for i in range(1,8):T('touchMove',[(200-12*i,450),(220+12*i,450)])
  T('touchEnd',[]);pg.wait_for_timeout(150);z1=float(MD(pg)['z']);check(z1>z0*1.5,f'pinch zoom {z0}->{z1}')
  check(pg.locator('#map').is_visible(),'pinch closed map');b.close()

def t_map_save(p):
  b,c=ctx(p);pg=page(c);cells=[tuple(x) for x in MZ['main_route'][:60]];walk(pg,cells);walk(pg,W.path(cells[-1],cells[40]))
  v=pg.evaluate('SOTA.visitedCount()');t=pg.evaluate('SOTA.trailCells()');s=S(pg);pg.reload();pg.wait_for_function('window.SOTA')
  check(pg.evaluate('SOTA.visitedCount()')==v and pg.evaluate('SOTA.trailCells()')==t and S(pg)==s,'visited/trail not restored')
  tap(pg,'#mapb');check(int(MD(pg)['cells'])==v and int(MD(pg)['dots'])==len(t)-1,'map after reload');b.close()

def t_old_and_corrupt_save(p):
  b,c=ctx(p);pg=page(c)
  pg.evaluate('localStorage.setItem("sota.stage1.save",JSON.stringify({x:3,y:63,f:1}))');pg.reload();pg.wait_for_function('window.SOTA')
  s=S(pg);check((s['x'],s['y'],s['f'])==(3,63,1),'old save position lost');check(pg.evaluate('SOTA.visitedCount()')==1 and pg.evaluate('SOTA.trailCells()')==[[3,63]],'old save visited')
  for bad in ['{bad json','null','[]','{"x":3,"y":63,"f":1,"v":"zz","t":{"s":1,"m":"9"}}','{"x":3,"y":63,"f":1,"v":"'+'f'*1057+'","t":{"s":4160,"m":"0000"}}','{"x":"a"}','{"x":3,"y":63,"f":7}']:
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.evaluate('v=>localStorage.setItem("sota.stage1.save",v)',bad);pg.reload();pg.wait_for_function('window.SOTA')
    check(not errs,f'crash on {bad}');vc=pg.evaluate('SOTA.visitedCount()');check(vc==1,f'corrupt map data used {bad} {vc}')
    tap(pg,'#mapb');check(MD(pg)['cells']=='1','map after corrupt');tap(pg,'#mclose')
  pg.evaluate('localStorage.setItem("sota.items","{bad")');pg.reload();pg.wait_for_function('window.SOTA');check(pg.evaluate('SOTA.items()')==[None]*4,'bad items')
  b.close()

def t_rapid_map(p):
  b,c=ctx(p);pg=page(c);rnd=random.Random(11);x,y,f=0,64,0
  for n in range(150):
    k=rnd.choice(['fwd','fwd','left','right','back','map'])
    if k=='map':tap(pg,'#mapb');tap(pg,'#mclose');continue
    if k=='left':f=(f+3)%4
    elif k=='right':f=(f+1)%4
    else:
      d=f if k=='fwd' else (f+2)%4
      if (x+D[d][0],y+D[d][1]) in W.OPEN[(x,y)]:x+=D[d][0];y+=D[d][1]
    tap(pg,f'[data-cmd={k}]')
  s=S(pg);check((s['x'],s['y'],s['f'])==(x,y,f),f'state {s} want {(x,y,f)}');pg.wait_for_timeout(400);check(not pg.evaluate('SOTA.animating()'),'stuck')
  check(not pg.locator('#map').is_visible(),'map stuck open');b.close()

def t_offline2(p):
  b,c=ctx(p,sw=True);pg=c.new_page();pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA')
  pg.wait_for_function('navigator.serviceWorker.ready.then(()=>true)');pg.reload();pg.wait_for_function('window.SOTA&&navigator.serviceWorker.controller')
  c.set_offline(True);pg.reload();pg.wait_for_function('window.SOTA&&SOTA.map',timeout=8000)
  ok=pg.evaluate('(async()=>{const c=await caches.open((await caches.keys()).find(k=>k.startsWith("sota-s1-")));return !!(await c.match("map.js?v=4"))&&(await caches.keys()).length})()')
  check(ok==1,f'map.js not cached / old caches kept {ok}');tap(pg,'#mapb');check(MD(pg)['cells']=='1' or int(MD(pg)['cells'])>=1,'map offline');b.close()

def t_console_network2(p):
  errs=[];reqs=[];b,c=ctx(p,sw=True);pg=page(c,errs,reqs);walk(pg,[tuple(x) for x in MZ['main_route'][:15]],True)
  tap(pg,'#mapb');tap(pg,'#mzin');tap(pg,'#mzout');tap(pg,'#mctr');tap(pg,'#mclose');tap(pg,'[data-slot="2"]');tap(pg,'#dbg');tap(pg,'#dbg')
  pg.wait_for_timeout(800);bad=[u for u in reqs if not u.startswith(BASE) and not u.startswith('data:')];check(not bad,f'outside {bad}');check(not errs,f'errors {errs}');b.close()

def t_hud_default(p):
  b,c=ctx(p);pg=page(c);check(pg.locator('#hud').is_visible(),'hud not on by default');tap(pg,'#dbg');check(not pg.locator('#hud').is_visible(),'toggle')
  pg.reload();pg.wait_for_function('window.SOTA');check(not pg.locator('#hud').is_visible(),'hud choice not remembered');b.close()

T={k[2:]:v for k,v in list(globals().items()) if k.startswith('t_')};fails=0
with sync_playwright() as p:
  for n,f in T.items():
    if ONLY and n not in ONLY:continue
    t=time.time()
    try:f(p);print(f'PASS {n} ({time.time()-t:.1f}s)')
    except Exception as e:fails+=1;print(f'FAIL {n}: {str(e)[:250]}')
sys.exit(1 if fails else 0)
