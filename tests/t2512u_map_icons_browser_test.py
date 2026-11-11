"""t2512u/t2515u map room icons, t2516u/t2528u tavern+camp icons with tap travel and the tavern zone limit.
Real engine in headless Chromium at 412x891 (touch). Usage: python3 tests/t2512u_map_icons_browser_test.py <base_url>"""
import sys,os,json,math
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/').rstrip('/')+'/'
sys.argv=[sys.argv[0],BASE]
import splash_helper as SPL
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
passed=failed=0
class Fail(Exception):pass
def check(c,m):
  if not c:raise Fail(m)
def run(name,f,p):
  global passed,failed
  try:f(p);passed+=1;print('PASS',name,flush=True)
  except Exception as e:failed+=1;print('FAIL',name,repr(e)[:600],flush=True)
SEED='''(o)=>{const C=SOTA.core,N=SOTA.N,v=new Uint8Array(N*N);
 for(let i=0;i<N*N;i++){if(C.zoneOf[i]<=o.z&&SOTA.roomAt(i%N,(i/N)|0)<0)v[i]=1;}
 (o.unvisit||[]).forEach(c=>v[c[1]*N+c[0]]=0);v[o.y*N+o.x]=1;
 let h="";for(let i=0;i<N*N;i+=4){let b=0;for(let k=0;k<4;k++)if(i+k<N*N&&v[i+k])b|=1<<k;h+=b.toString(16);}
 SOTA.applyMaze({x:o.x,y:o.y,f:o.f||0,v:h,t:{s:o.y*N+o.x,m:""}});return SOTA.visitedCount();}'''
def ctx(p,w=412,h=891,hero=False):
  # hero=True: no nofight flag (it also skips hero creation); fights are not rolled by travel or seeding anyway
  b=p.chromium.launch();c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,service_workers='block')
  c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}" if hero else "try{localStorage.setItem('sota.dev.nofight','1');localStorage.setItem('sota.dev.nostory','1')}catch(e){}");return b,c
def page(c,rooms=None):
  pg=c.new_page();pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA');SPL.pass_splash(pg)
  pg.evaluate('r=>{localStorage.clear();localStorage.setItem("sota.dev.nofight","1");localStorage.setItem("sota.dev.nostory","1");localStorage.setItem("sota.rooms",JSON.stringify(r||{s:[],c:[]}))}',rooms)
  reload(pg);return pg
def reload(pg):pg.reload();pg.wait_for_function('window.SOTA&&SOTA.map');SPL.pass_splash(pg)
def frames(pg,n=3):pg.evaluate('n=>new Promise(r=>{let k=0;const f=()=>{if(++k>=n)r();else requestAnimationFrame(f)};requestAnimationFrame(f)})',n)
def MD(pg):return pg.evaluate('Object.assign({},document.getElementById("map").dataset)')
def openmap(pg):pg.evaluate('SOTA.map.open()');frames(pg)
def tap(pg,sel):
  bb=pg.locator(sel).bounding_box();pg.touchscreen.tap(bb['x']+bb['width']/2,bb['y']+bb['height']/2)
ROOMS_IN='(z)=>MAZE.rooms.filter(r=>r.z<=z).map(r=>r.id)'
# ink pixels inside one map cell (device px), read back from the real map canvas
INK='''(c)=>{const cv=document.getElementById("mapc"),g=cv.getContext("2d"),v=SOTA.map.view(),d=cv.width/innerWidth,z=v.z*d,
 x=cv.width/2+(c[0]-v.cx)*z,y=cv.height/2+(c[1]-v.cy)*z,s=Math.max(2,Math.floor(z));const px=g.getImageData(Math.round(x),Math.round(y),s,s).data;let ink=0,sig=0;
 for(let i=0;i<px.length;i+=4){if(px[i]+px[i+1]+px[i+2]<200)ink++;sig=(sig*31+(px[i]>>4)*7+(px[i+1]>>4)*3+(px[i+2]>>4))>>>0;}return {ink,sig,s};}'''

def t_root_cause_rooms_never_visited(p):
  b,c=ctx(p);pg=page(c);pg.evaluate(SEED,{'z':3,'x':15,'y':51})
  check(all(not pg.evaluate('c=>SOTA.isVisited(c[0],c[1])',r['c']) for r in pg.evaluate('MAZE.rooms.filter(r=>r.z<=3)')),'a room cell is visited (root cause changed?)');b.close()

def t_no_blank_room_every_zone(p):
  b,c=ctx(p);pg=page(c)
  for z,cell in [(1,(15,51)),(2,(18,25)),(3,(51,13)),(4,(47,47)),(5,(46,48))]:
    pg.evaluate(SEED,{'z':z,'x':cell[0],'y':cell[1]});openmap(pg);m=MD(pg);want=len(pg.evaluate(ROOMS_IN,z))
    check(int(m['zonelimit'])>=z,f'zone {z} limit {m}')
    check(m['blank']=='0' and int(m['locked'])+int(m['solved'])==want and int(m['roomcells'])==want,f'zone {z}: {m} want {want} rooms')
    pg.evaluate('SOTA.map.close()')
  # pixels: zone 1 at a readable zoom, every room cell has ink (icon), never plain parchment
  pg.evaluate(SEED,{'z':1,'x':15,'y':51});openmap(pg)
  for r in pg.evaluate('MAZE.rooms.filter(r=>r.z===1)'):
    pg.evaluate('c=>{const v=SOTA.map.view();SOTA.map.pan(c[0]+.5-v.cx,c[1]+.5-v.cy)}',r['c']);frames(pg,2)
    ink=pg.evaluate(INK,[r['c'][0],r['c'][1]]);check(ink['ink']>ink['s']*ink['s']*0.04,f'room {r["id"]} looks blank {ink}')
  b.close()

def t_both_states_and_switch(p):
  b,c=ctx(p);pg=page(c,{'s':[0],'c':[0]});pg.evaluate(SEED,{'z':1,'x':15,'y':51});openmap(pg);m=MD(pg)
  check((m['solved'],m['locked'])==('1','8'),f'states {m}')
  r=pg.evaluate('MAZE.rooms[2]');pg.evaluate('c=>{const v=SOTA.map.view();SOTA.map.pan(c[0]+.5-v.cx,c[1]+.5-v.cy)}',r['c'])
  for _ in range(3):tap(pg,'#mzin')
  frames(pg);a=pg.evaluate(INK,r['c']);pg.evaluate('SOTA.markSolved(2)');pg.wait_for_timeout(250);frames(pg);m=MD(pg);a2=pg.evaluate(INK,r['c'])
  check((m['solved'],m['locked'])==('2','7'),f'switch {m}');check(a['sig']!=a2['sig'],'icon did not change on open')
  # the two icons differ clearly: compare door vs room at the same size
  d=pg.evaluate('''()=>{const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d");const out={};
   for(const k of ["door","room"]){g.clearRect(0,0,64,64);const cv=document.getElementById("mapc"),G=cv.getContext("2d");G.save();G.setTransform(1,0,0,1,0,0);G.clearRect(0,0,64,64);SOTA.map.drawMapIcon(k,32,32,40);out[k]=Array.from(G.getImageData(0,0,64,64).data);G.restore();}
   let diff=0;for(let i=0;i<out.door.length;i+=4){if(Math.abs(out.door[i]-out.room[i])+Math.abs(out.door[i+1]-out.room[i+1])+Math.abs(out.door[i+2]-out.room[i+2])>60)diff++;}return diff;}''')
  check(d>=200,f'door vs room only {d} px differ');b.close()

def t_survives_save_load(p):
  b,c=ctx(p);pg=page(c);pg.evaluate(SEED,{'z':1,'x':15,'y':51});pg.evaluate('SOTA.markSolved(3);SOTA.markSolved(5)');openmap(pg);m1=MD(pg)
  reload(pg);openmap(pg);m2=MD(pg)
  for k in ['solved','locked','roomcells','blank','cells','tents','taverns']:check(m1[k]==m2[k],f'{k} {m1[k]} -> {m2[k]}')
  check(m2['solved']=='2','solved lost');b.close()

def t_png_icons_installed(p):
  # steering 19:06: drawMapIcon uses the painted PNGs from modules/map-icons when installed (art6/map), else the code icons
  b,c=ctx(p);pg=page(c);files=pg.evaluate('SOTA.map.iconFiles()')
  if not files:print('   no PNG icons installed: code icons only');b.close();return
  check(sorted(files)==['camp','door','room','tavern'],f'files {files}')
  pg.evaluate(SEED,{'z':1,'x':15,'y':51});openmap(pg);pg.wait_for_timeout(300);frames(pg);m=MD(pg)
  check(int(m['iconpng'])==int(m['doors'])+int(m['tents'])+int(m['taverns']),f'not every icon drawn from PNG {m}');b.close()

def t_tavern_camp_icons_found_only(p):
  b,c=ctx(p);pg=page(c);openmap(pg);m=MD(pg);check(m['tents']=='0' and m['taverns']=='0','icons on a fresh map')
  check(pg.evaluate('MAZE.camps.every((c,i)=>SOTA.map.travelTarget("camp",i)===null)&&MAZE.taverns.every((c,i)=>SOTA.map.travelTarget("tavern",i)===null)'),'travel offered to an unfound spot')
  r=pg.evaluate('SOTA.map.travel("camp",1)');check(not r['ok'],f'travel to unfound camp {r}')
  pg.evaluate('SOTA.map.close()');pg.evaluate(SEED,{'z':1,'x':15,'y':51});openmap(pg);m=MD(pg)
  check(m['tents']=='2' and m['taverns']=='1',f'zone 1 icons {m}');b.close()

def t_travel_lands_walkable(p):
  b,c=ctx(p);pg=page(c);pg.evaluate(SEED,{'z':3,'x':51,'y':13})
  spots=[('camp',i) for i in range(pg.evaluate('MAZE.camps.length'))]+[('tavern',i) for i in range(4)];n=0
  for k,i in spots:
    t=pg.evaluate('a=>SOTA.map.travelTarget(a[0],a[1])',[k,i]);z=pg.evaluate('a=>{const c=MAZE[a[0]==="camp"?"camps":"taverns"][a[1]];return SOTA.core.zoneOf[c[1]*SOTA.N+c[0]]}',[k,i])
    if z>3:check(t is None,f'{k} {i} zone {z} offered');continue
    check(t is not None,f'{k} {i} (zone {z}) not offered')
    r=pg.evaluate('a=>SOTA.map.travel(a[0],a[1])',[k,i]);check(r['ok'],f'travel {k} {i} {r}');s=pg.evaluate('SOTA.state()')
    sp=pg.evaluate('a=>MAZE[a[0]==="camp"?"camps":"taverns"][a[1]]',[k,i])
    check(abs(s['x']-sp[0])+abs(s['y']-sp[1])==1,f'{k} {i} not next to it {s} {sp}')
    check(pg.evaluate('a=>SOTA.roomAt(a.x,a.y)<0&&SOTA.isVisited(a.x,a.y)&&SOTA.contentCap.isOpen(a.x,a.y)',s),f'{k} {i} landed on a bad cell {s}')
    D=[(0,-1),(1,0),(0,2-1),(-1,0)][s['f']];check((s['x']+D[0],s['y']+D[1])==tuple(sp) and pg.evaluate('a=>SOTA.canMove(a.x,a.y,a.f)',s),f'{k} {i} not facing it / no open way {s}')
    n+=1
  vis=pg.evaluate('SOTA.visitedCount()');reload(pg);check(pg.evaluate('SOTA.visitedCount()')==vis and pg.evaluate('SOTA.state()')==s,'travel broke the saved map (trail rejected)')
  check(n>=17,f'only {n} spots travelled');b.close()

def t_tap_ui_travel(p):
  b,c=ctx(p,hero=True);pg=T.fresh(c);T.full_create(pg,'Tess','human','warrior');pg.evaluate(SEED,{'z':1,'x':0,'y':64})
  T.ev(pg,'SOTA.rpg.closeUI&&SOTA.rpg.closeUI()');tap(pg,'#mapb');frames(pg)
  for _ in range(2):tap(pg,'#mzin')
  h=[x for x in pg.evaluate('SOTA.map.hits()') if x['kind']=='camp' and 30<x['x']<380 and 70<x['y']<820]
  if not h:
    cp=pg.evaluate('MAZE.camps[0]');pg.evaluate('c=>{const v=SOTA.map.view();SOTA.map.pan(c[0]+.5-v.cx,c[1]+.5-v.cy)}',cp);frames(pg)
    h=[x for x in pg.evaluate('SOTA.map.hits()') if x['kind']=='camp' and 30<x['x']<380 and 70<x['y']<820]
  check(h,'no camp icon on screen');pg.touchscreen.tap(h[0]['x'],h[0]['y']);frames(pg)
  check(pg.locator('#mtravel').is_visible() and 'Travel to Camp' in pg.locator('#mtravel').inner_text(),'no travel question')
  tap(pg,'#mtno');check(pg.locator('#mtravel').count()==0 and pg.evaluate('SOTA.state()')['y']==64,'cancel moved you')
  pg.touchscreen.tap(h[0]['x'],h[0]['y']);frames(pg);tap(pg,'#mtgo');frames(pg)
  s=pg.evaluate('SOTA.state()');cp=pg.evaluate('a=>MAZE.camps.find(c=>c[1]*SOTA.N+c[0]===a)',h[0]['i'])
  check(abs(s['x']-cp[0])+abs(s['y']-cp[1])==1 and not pg.locator('#map').is_visible(),f'tap travel {s} {cp}')
  # a drag on the map is a pan, never a travel tap
  tap(pg,'#mapb');frames(pg);s0=pg.evaluate('SOTA.state()');hh=pg.evaluate('SOTA.map.hits()')[0]
  pg.evaluate('h=>{const cv=document.getElementById("mapc"),o={pointerId:7,isPrimary:true,bubbles:true,pointerType:"touch"};cv.dispatchEvent(new PointerEvent("pointerdown",Object.assign({clientX:h.x,clientY:h.y},o)));cv.dispatchEvent(new PointerEvent("pointermove",Object.assign({clientX:h.x+40,clientY:h.y},o)));cv.dispatchEvent(new PointerEvent("pointerup",Object.assign({clientX:h.x+40,clientY:h.y},o)));}',hh)
  check(pg.locator('#mtravel').count()==0 and pg.evaluate('SOTA.state()')==s0,'drag opened travel');b.close()

def t_hidden_past_tavern(p):
  b,c=ctx(p);pg=page(c)
  # zone 1 explored, Tavern 1 (14,49) not reached: nothing of zone 2 shows, even cells next to known ones
  pg.evaluate(SEED,{'z':1,'x':15,'y':51,'unvisit':[[14,49]]});openmap(pg);m=MD(pg)
  check(m['zonelimit']=='1',f'limit {m}');check(int(m['taverns'])==1,'tavern 1 icon (found from 14,50) missing')
  check(not pg.evaluate('SOTA.map.hits().some(h=>SOTA.core.zoneOf[h.i]>1)'),'zone 2 icon shown')
  bb=pg.evaluate('SOTA.map.bboxScreen()');check(pg.evaluate('MAZE.camps.filter(c=>SOTA.core.zoneOf[c[1]*SOTA.N+c[0]]===2).every((c,i)=>true)'),'')
  check(pg.evaluate('MAZE.camps.map((c,i)=>[c,i]).filter(a=>SOTA.core.zoneOf[a[0][1]*SOTA.N+a[0][0]]>1).every(a=>SOTA.map.travelTarget("camp",a[1])===null)'),'travel offered past the tavern')
  # cell 14,48 (zone 2) is only reachable through the tavern: never drawn before the tavern is reached
  ink0=pg.evaluate('c=>{const v=SOTA.map.view();SOTA.map.pan(c[0]+.5-v.cx,c[1]+.5-v.cy);return 1}',[14,48]);frames(pg)
  for _ in range(3):tap(pg,'#mzin')
  frames(pg);a=pg.evaluate(INK,[14,47])
  # reach the tavern: zone 2 opens
  pg.evaluate(SEED,{'z':1,'x':14,'y':49});openmap(pg);check(MD(pg)['zonelimit']=='2','tavern reached -> zone 2 limit')
  # zone 2 explored but Tavern 2 not reached: zone 3 stays hidden
  pg.evaluate(SEED,{'z':2,'x':18,'y':25,'unvisit':[[18,24]]});openmap(pg);m=MD(pg);check(m['zonelimit']=='2',f'z3 shown before tavern 2 {m}')
  check(not pg.evaluate('SOTA.map.hits().some(h=>SOTA.core.zoneOf[h.i]>2)'),'zone 3 icon shown');b.close()

def t_arrow_small_and_faded_on_icons(p):
  # Graphics review: the player arrow sits over icons; it is ~14 css px with a thin halo, icons draw under it, and on an icon cell it is 70% opaque
  b,c=ctx(p);pg=page(c);cp=pg.evaluate('MAZE.camps[1]');pg.evaluate(SEED,{'z':1,'x':cp[0],'y':cp[1],'f':0});openmap(pg);m=pg.evaluate('SOTA.map.marker()')
  check(abs(m['ar']*1.75-14)<0.6,f'arrow not ~14px {m}');check(m['onIcon'] and abs(m['alpha']-0.7)<1e-6,f'arrow not faded on camp cell {m}')
  pg.evaluate('SOTA.map.close()');pg.evaluate(SEED,{'z':1,'x':0,'y':64,'f':3});openmap(pg);m=pg.evaluate('SOTA.map.marker()')
  check(not m['onIcon'] and m['alpha']==1,f'arrow faded off icons {m}');b.close()

def t_monster_treasure_marks_stay(p):
  # monster X and treasure coin stay drawn in code on top of the door icon (red X pixels on an unopened monster room)
  b,c=ctx(p);pg=page(c);pg.evaluate(SEED,{'z':1,'x':15,'y':51});openmap(pg)
  r=pg.evaluate('MAZE.rooms.find(r=>r.z===1&&r.k==="monster")');pg.evaluate('c=>{const v=SOTA.map.view();SOTA.map.pan(c[0]+.5-v.cx,c[1]+.5-v.cy)}',r['c'])
  for _ in range(4):tap(pg,'#mzin')
  pg.wait_for_timeout(250);frames(pg)
  red=pg.evaluate("""(c)=>{const cv=document.getElementById("mapc"),g=cv.getContext("2d"),v=SOTA.map.view(),d=cv.width/innerWidth,z=v.z*d,x=cv.width/2+(c[0]-v.cx)*z,y=cv.height/2+(c[1]-v.cy)*z;
   const px=g.getImageData(Math.round(x),Math.round(y),Math.floor(z),Math.floor(z)).data;let n=0;for(let i=0;i<px.length;i+=4)if(px[i]>150&&px[i+1]<60&&px[i+2]<60)n++;return n;}""",r['c'])
  check(red>20,f'monster X missing ({red} red px)');b.close()

TESTS=[t_root_cause_rooms_never_visited,t_no_blank_room_every_zone,t_both_states_and_switch,t_survives_save_load,t_png_icons_installed,t_tavern_camp_icons_found_only,
 t_travel_lands_walkable,t_tap_ui_travel,t_hidden_past_tavern,t_arrow_small_and_faded_on_icons,t_monster_treasure_marks_stay]
if __name__=='__main__':
  with sync_playwright() as p:
    for t in TESTS:run(t.__name__,t,p)
  print(f'{passed} passed, {failed} failed');sys.exit(1 if failed else 0)
