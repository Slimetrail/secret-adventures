"""Stage 3 (puzzle rooms) tests on a pretend phone (Playwright Chromium, touch). Usage: python tests/stage3_tests.py [base_url] [names...]"""
import sys,os,json,time,subprocess,re
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tools'));import walk as W
from playwright.sync_api import sync_playwright
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/').rstrip('/')+'/';ONLY=sys.argv[2:]
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
class Fail(Exception):pass
def check(c,m):
  if not c:raise Fail(m)
ERRS=[];REQS=[]
def ctx(p,w=412,h=915,sw=False):
  b=p.chromium.launch();return b,b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,service_workers='allow' if sw else 'block')
def page(c,pre=None):
  pg=c.new_page();pg.on('console',lambda m:ERRS.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e:ERRS.append(str(e)));pg.on('request',lambda r:REQS.append(r.url))
  pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA');pg.evaluate('localStorage.clear()')
  if pre:pg.evaluate('p=>{for(const k in p)localStorage.setItem(k,p[k])}',pre)
  pg.reload();pg.wait_for_function('window.SOTA');pg.evaluate('SOTA.setAnim(false)');return pg
def bb(pg,sel):return pg.locator(sel).first.bounding_box()
def tap(pg,sel):
  b=bb(pg,sel);check(b,'no element '+sel);pg.touchscreen.tap(b['x']+b['width']/2,b['y']+b['height']/2)
def rooms(pg):return pg.evaluate('SOTA.core?SOTA.core.M?SOTA.core.M.rooms:null:null') or json.loads(open(os.path.join(ROOT,'maze-data.js')).read().split('=',1)[1].rstrip().rstrip(';'))['rooms']
RM=None
def R(pg):
  global RM
  if RM is None:RM=pg.evaluate('MAZE.rooms')
  return RM
START=tuple(W.MZ['start']) if 'start' in W.MZ else None
def approach(pg,r):
  """Stand on the cell next to room r, facing its door."""
  st=pg.evaluate('SOTA.state()')
  if [st['x'],st['y']]==list(r['c']):tap(pg,'[data-cmd=back]');st=pg.evaluate('SOTA.state()')
  p=W.path((st['x'],st['y']),tuple(r['c']));a=p[-2];d=W.D.index((p[-1][0]-a[0],p[-1][1]-a[1]))
  pg.evaluate('a=>SOTA.teleport(a[0],a[1],a[2])',[a[0],a[1],d]);return a
def moves(i):return json.loads(subprocess.check_output(['node',os.path.join(ROOT,'tools/solver.js'),'moves',str(i)]))
def tap_moves(pg,t,mv):
  for m in mv:
    if t==3:tap(pg,f'#pboard [data-blk="{m[0]}"]');tap(pg,f'#pboard [data-dir="{m[1]}"]')
    else:tap(pg,f'#pboard [data-mv="{m}"]')
def solve_ui(pg,r):
  approach(pg,r);tap(pg,'[data-cmd=fwd]');check(pg.evaluate('SOTA.puzzleOpen()'),'puzzle did not open');check(pg.evaluate('SOTA.puzzle.state().id')==r['id'],'wrong room')
  check(pg.evaluate('SOTA.puzzle.state().solved')==False,'already solved at start')
  tap_moves(pg,r['p'],moves(r['id']));check(pg.evaluate('SOTA.puzzle.state().solved'),f"room {r['id']} not solved by touch");check(pg.evaluate('SOTA.isSolved(%d)'%r['id']),'not saved')
def board(pg):return pg.inner_html('#pboard')

def t_locked_blocks(p):
  b,c=ctx(p);pg=page(c);r=R(pg)[5];a=approach(pg,r);tap(pg,'[data-cmd=fwd]');s=pg.evaluate('SOTA.state()')
  check((s['x'],s['y'])==a,'walked into a locked room');check(pg.evaluate('SOTA.puzzleOpen()'),'no puzzle');check(pg.get_by_text(re.compile('.')).count()>0,'')
  for k in['fwd','left','right','back']:pg.evaluate(f'SOTA.act("{k}")')
  check(pg.evaluate('SOTA.state()')['f']==s['f'] and (pg.evaluate('SOTA.state()')['x'],pg.evaluate('SOTA.state()')['y'])==a,'moved while puzzle open')
  tap(pg,'#pclose');check(not pg.evaluate('SOTA.puzzleOpen()'),'close failed');check(not pg.evaluate(f"SOTA.isSolved({r['id']})"),'closing solved it')
  # camps/taverns/doors need nothing: every room in data is treasure/monster/story only
  check(set(x['k'] for x in R(pg))<={'treasure','monster','story'},'other kinds locked');b.close()

def t_solve_each_type(p):
  b,c=ctx(p);pg=page(c);done=[]
  for t in range(5):
    for zr in[(1,2),(3,),(4,5)]:
      r=next((x for x in R(pg) if x['p']==t and x['z'] in zr),None);check(r,f'no type {t} in zones {zr}')
      solve_ui(pg,r);tap(pg,'#penter');s=pg.evaluate('SOTA.state()');check([s['x'],s['y']]==r['c'],'enter did not move in');check(pg.evaluate('SOTA.panelOpen()'),'no placeholder');tap(pg,'#pgo');done.append(r['id'])
  check(len(pg.evaluate('SOTA.rooms().solved'))==15,'solved count');b.close();print('   rooms solved by touch:',done)

def t_all_rooms_data(p):
  o=subprocess.check_output(['node',os.path.join(ROOT,'tools/solver.js')]).decode();check('ALL 85 ROOMS SOLVABLE' in o,o[-300:])
  b,c=ctx(p);pg=page(c)
  bad=pg.evaluate('(()=>{let b=[];MAZE.rooms.forEach(r=>{const g=PUZ.forRoom(r);if(PUZ.solved(g.pz,g.s))b.push(r.id);const h=PUZ.forRoom(r);if(JSON.stringify(h)!==JSON.stringify(g))b.push("seed"+r.id)});return b})()')
  check(not bad,f'start solved or unseeded: {bad}');check(pg.evaluate('MAZE.rooms.length')==85,'85');b.close()

def t_persist_and_once(p):
  b,c=ctx(p);pg=page(c);r=next(x for x in R(pg) if x['p']==1);solve_ui(pg,r);tap(pg,'#penter');check(pg.evaluate('SOTA.panelOpen()'),'panel');
  check(pg.inner_text('#ptxt') in('Treasure room (loot comes in a later stage)','Monster room (fight comes later)','Story room (story comes later)'),'panel text')
  tap(pg,'#pgo');check(not pg.evaluate('SOTA.panelOpen()'),'panel stays');tap(pg,'[data-cmd=back]');tap(pg,'[data-cmd=fwd]');check(not pg.evaluate('SOTA.panelOpen()'),'panel shown twice')
  r2=next(x for x in R(pg) if x['p']==4);solve_ui(pg,r2);tap(pg,'#pclose')  # solved but not entered
  pg.reload();pg.wait_for_function('window.SOTA');check(pg.evaluate(f"SOTA.isSolved({r['id']})"),'solved lost on reload')
  check(pg.evaluate(f"SOTA.isSolved({r2['id']})"),'solved-not-entered lost on reload');approach(pg,r);tap(pg,'[data-cmd=fwd]')
  s=pg.evaluate('SOTA.state()');check([s['x'],s['y']]==r['c'] and not pg.evaluate('SOTA.puzzleOpen()'),'solved room relocked');check(not pg.evaluate('SOTA.panelOpen()'),'panel after reload')
  # 3D draws the open doorway for a solved room and the sealed door for a locked one (checked by pixel glow in shots/mutations)
  b.close()

def t_old_and_corrupt(p):
  b,c=ctx(p);st2=json.dumps({'x':1,'y':1,'f':1,'v':'','t':{'s':0,'m':[]}})
  pg=page(c,{'sota.stage1.save':st2,'sota.items':'[null,null,null,null]'});check(pg.evaluate('SOTA.rooms().solved.length')==0,'old save has solved rooms')
  for bad in['{bad','null','5','{"s":"x"}','{"s":[999,-1,"a",1.5,null]}','{"c":[1,2,3]}','{"s":{"0":1}}']:
    pg=page(c,{'sota.rooms':bad});r=pg.evaluate('SOTA.rooms()');check(r['solved']==[] and r['cleared']==[],f'corrupt {bad} -> {r}');pg.evaluate('SOTA.act("fwd")')
  pg=page(c,{'sota.rooms':'{"s":[2,999],"c":[2]}'});r=pg.evaluate('SOTA.rooms()');check(r=={'solved':[],'cleared':[]},f'list with a bad id must be ignored whole {r}')
  pg=page(c,{'sota.rooms':'{"s":[2,7],"c":[2,3]}'});r=pg.evaluate('SOTA.rooms()');check(r=={'solved':[2,7],'cleared':[2]},f'valid {r} (cleared needs solved)');b.close()

def t_leave_reset(p):
  b,c=ctx(p);pg=page(c)
  for t in range(5):
    r=next(x for x in R(pg) if x['p']==t and x['z']>=3);approach(pg,r);tap(pg,'[data-cmd=fwd]');h0=board(pg);m=moves(r['id'])[0]
    tap_moves(pg,t,[m]);h1=board(pg);check(h1!=h0,f'type {t} move did nothing');tap(pg,'#pclose');approach(pg,r);tap(pg,'[data-cmd=fwd]')
    check(board(pg)==h1,f'type {t} state lost on leave');check(not pg.evaluate('SOTA.puzzle.state().solved'),'solved after one move')
    tap(pg,'#preset');check(board(pg)==h0 or t==3 and re.sub(r' sel','',board(pg))==re.sub(r' sel','',h0),f'type {t} reset failed');pg.keyboard.press('Escape');check(not pg.evaluate('SOTA.puzzleOpen()'),'Esc')
  pg.reload();pg.wait_for_function('window.SOTA');r=R(pg)[0];pg.evaluate(f"SOTA.puzzle.open({r['id']})");h=board(pg);pg.reload();pg.wait_for_function('window.SOTA');pg.evaluate(f"SOTA.puzzle.open({r['id']})");check(board(pg)==h,'puzzle differs after reload');b.close()

def over(a,b):return not(a['x']+a['width']<=b['x']+.5 or b['x']+b['width']<=a['x']+.5 or a['y']+a['height']<=b['y']+.5 or b['y']+b['height']<=a['y']+.5)
def t_ui_fit(p):
  for(w,h)in[(360,800),(412,915),(915,412)]:
    b,c=ctx(p,w,h);pg=page(c)
    for t in range(5):
      for zr in[(1,),(5,)]:
        r=next(x for x in R(pg) if x['p']==t and x['z'] in zr);pg.evaluate(f"SOTA.puzzle.open({r['id']})")
        bs=pg.evaluate('[...document.querySelectorAll("#puz button")].filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,id:e.id||e.className}})')
        for x in bs:
          check(x['width']>=44 and x['height']>=44,f'{w}x{h} t{t} small {x}');check(x['x']>=0 and x['y']>=0 and x['x']+x['width']<=w+.5 and x['y']+x['height']<=h+.5,f'{w}x{h} t{t} off screen {x}')
        for i in range(len(bs)):
          for j in range(i+1,len(bs)):
            if 'pblk' in bs[i]['id'] and 'pblk' in bs[j]['id']:pass
            check(not over(bs[i],bs[j]),f'{w}x{h} t{t} z{zr} overlap {bs[i]} {bs[j]}')
        for s in['#ptitle','#pinfo']:
          tb=bb(pg,s)
          for x in bs:check(not over(tb,x),f'{w}x{h} t{t} {s} under {x["id"]}')
        pg.evaluate('SOTA.puzzle.close()')
    b.close()

def t_map_solved(p):
  b,c=ctx(p);pg=page(c);rs=R(pg);a=next(x for x in rs if x['z']==1 and x['p']==0);bb_=next(x for x in rs if x['z']==1 and x['id']!=a['id'])
  pg.evaluate('SOTA.map.open()');md=pg.evaluate('Object.assign({},document.getElementById("map").dataset)');check(md.get('solved')=='0','solved before any')
  pg.evaluate('SOTA.map.close()');solve_ui(pg,a);tap(pg,'#penter');tap(pg,'#pgo');approach(pg,bb_);tap(pg,'[data-cmd=fwd]');tap(pg,'#pclose')
  # second room: only look at it from next door (not entered) -> not visited -> not drawn; visit cell? rooms are visited only by entering; mark visited via teleport-in after solve check
  pg.evaluate('SOTA.map.open()');md=pg.evaluate('Object.assign({},document.getElementById("map").dataset)');check(md['solved']=='1' and md['locked']=='0',f'map {md}')
  pg.evaluate('SOTA.map.close()');pg.evaluate('r=>SOTA.teleport(r[0],r[1],0)',bb_['c']);pg.evaluate('SOTA.map.open()');md=pg.evaluate('Object.assign({},document.getElementById("map").dataset)')
  check(md['solved']=='1' and md['locked']=='1',f'visited locked room not shown locked {md}');b.close()

def t_difficulty(p):
  b,c=ctx(p);pg=page(c);D=pg.evaluate('PUZ.DIFF');b.close()
  for t,ps in D.items():
    for k,v in ps.items():
      vals=[x for x in v[1:] if x]
      check(all(vals[i]<=vals[i+1] for i in range(len(vals)-1)),f'{t}.{k} falls {v}')
  md=open(os.path.join(ROOT,'STAGE3-PROGRESS.md')).read();check('| Type' in md and 'Z5' in md,'table missing in STAGE3-PROGRESS.md')

def t_offline3(p):
  b,c=ctx(p,sw=True);pg=c.new_page();pg.goto(BASE+'index.html');pg.wait_for_function('navigator.serviceWorker.ready.then(()=>true)');pg.reload();pg.wait_for_function('window.SOTA&&navigator.serviceWorker.controller')
  ok=pg.evaluate('(async()=>{const k=(await caches.keys());const c=await caches.open(k.find(x=>x=="sota-s1-v4"));const r=[];for(const f of["puzzles.js?v=4","puzzle-ui.js?v=4","doors.js?v=4","game.js?v=4"])r.push(!!(await c.match(f)));return [k,r]})()')
  check(all(ok[1]) and ok[0]==['sota-s1-v4'],f'cache {ok}');c.set_offline(True);pg.reload();pg.wait_for_selector('#puz',state='attached');pg.wait_for_timeout(500);pg.evaluate('SOTA.puzzle.open(3)');check(pg.evaluate('SOTA.puzzleOpen()'),'offline puzzle');b.close()
  check('updateViaCache:"none"' in open(os.path.join(ROOT,'boot.js')).read(),'updateViaCache')

def t_console_network3(p):
  b,c=ctx(p);pg=page(c)
  for i in range(0,85,7):pg.evaluate(f'SOTA.puzzle.open({i})');pg.wait_for_timeout(30);pg.evaluate('SOTA.puzzle.close()')
  pg.wait_for_timeout(300);b.close()
  check(not ERRS,f'console errors {ERRS[:5]}');bad=[u for u in REQS if not u.startswith(BASE) and not u.startswith('data:') and not u.startswith('blob:')];check(not bad,f'outside requests {bad[:5]}')
  src=''.join(open(os.path.join(ROOT,f)).read() for f in['puzzles.js','puzzle-ui.js','doors.js']);check('console.log' not in src,'logging in puzzle code');check('http' not in src,'link in puzzle code')

T=[(n[2:],f) for n,f in list(globals().items()) if n.startswith('t_')]
if __name__=='__main__':
  fails=0
  with sync_playwright() as p:
    for n,f in T:
      if ONLY and n not in ONLY:continue
      t=time.time()
      try:f(p);print(f'PASS {n} ({time.time()-t:.1f}s)')
      except Exception as e:fails+=1;print(f'FAIL {n}: {str(e)[:400]}')
  print('ALL STAGE 3 TESTS PASSED' if not fails else f'{fails} FAILED');sys.exit(1 if fails else 0)
