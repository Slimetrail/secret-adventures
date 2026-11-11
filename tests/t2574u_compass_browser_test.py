"""t2573u/t2574u/t2576u maze compass (412x891 phone, real taps, real engine moves).
 The round top-right button (#dbg) keeps its 48px cream 'ink' frame and spot; inside, a rose turns so its N points to the TOP of the 2D map.
 facings: for N, E, S, W step one cell forward with the real Forward button, read the player marker on the DRAWN 2D map (screen px) before and
          after, and check the rendered rose angle (computed CSS transform) equals the turn from that on-map move to the map top
 turns:   four right turns and four left turns each move the rose by exactly 90 deg the short way; frame never turns
 hud:     a tap toggles the 'Zone z  cell x,y  facing F' line, sota.hud persists through a reload; aria-label is the compass one
 frame:   48x48 at top 6 / right 8, round, inside the 412x891 screen and not over the HUD line, map button, party button or arrows
 load:    after a reload / teleport / tavern exit the rose already matches the facing; the Graphics PNG is the art; with the PNG blocked the
          code-drawn rose fills the same slot
Screenshots (T2574_SHOTS=dir). Usage: python tests/t2574u_compass_browser_test.py [base_url]"""
import sys,os,json,math
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
SHOTS=os.environ.get('T2574_SHOTS','');passed=failed=0;ERR=[]
def run(name,f,p):
  global passed,failed
  try:f(p);passed+=1;print('PASS',name,flush=True)
  except Exception as e:failed+=1;print('FAIL',name,repr(e)[:600],flush=True)
def check(c,m):
  if not c:raise T.Fail(m)
def shot(pg,n,clip=None):
  if SHOTS:os.makedirs(SHOTS,exist_ok=True);pg.screenshot(path=os.path.join(SHOTS,n),clip=clip)
def setup(p,block_png=False,dpr=3):
  b=p.chromium.launch();c=b.new_context(viewport={'width':412,'height':891},device_scale_factor=dpr,has_touch=True,is_mobile=True,service_workers='block')
  c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}")
  if block_png:c.route('**/compass-rose-*.png',lambda r:r.abort())
  pg=T.fresh(c);pg.on('pageerror',lambda e:ERR.append(str(e)));T.full_create(pg,'Leonidas','human','warrior');T.ev(pg,'localStorage.setItem("sota.dev.nofight","1")');pg.wait_for_timeout(300);return b,pg
def rendered_deg(pg):
  """the angle the rose is really drawn at: computed transform of #cmp after its transition, clockwise degrees in [0,360)"""
  pg.wait_for_timeout(400)
  m=T.ev(pg,'getComputedStyle(document.getElementById("cmp")).transform')
  if m in ('none',''):return 0.0
  a,b=[float(v) for v in m[m.index('(')+1:m.index(')')].split(',')[:2]]
  return math.degrees(math.atan2(b,a))%360
def marker(pg):
  """open the 2D map with a real tap and read where the player marker and its facing arrow are DRAWN (CSS screen px), with that drawing's camera"""
  T.ttap(pg,'#mapb');pg.wait_for_timeout(250);m=T.ev(pg,'SOTA.map.marker()');m['cam']=T.ev(pg,'SOTA.map.view()');r=T.ev(pg,'(()=>{const r=document.getElementById("mapc").getBoundingClientRect();return [r.width,r.height]})()');m['bw'],m['bh']=r
  T.ttap(pg,'#mclose');pg.wait_for_timeout(150);return m
def open_cell(pg,f):
  """a hall cell whose forward move (facing f) is open, allowed, and not into a room"""
  return T.ev(pg,'''f=>{const C=SOTA.core,N=SOTA.N,D=C.DIRS[f];for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const nx=x+D[0],ny=y+D[1];
   if(C.zoneOf[y*N+x]!==1||!SOTA.canMove(x,y,f)||SOTA.roomAt(x,y)>=0||SOTA.roomAt(nx,ny)>=0)continue;
   if(MAZE.taverns.concat(MAZE.camps).some(c=>(c[0]===nx&&c[1]===ny)||(c[0]===x&&c[1]===y)))continue;
   if(SOTA.contentCap.allowsStep&&!SOTA.contentCap.allowsStep(x,y,nx,ny))continue;return [x,y];}return null}''',f)
def angdiff(a,b):return abs((a-b+180)%360-180)
FN='NESW'
def t_facings_vs_drawn_map(p):
  b,pg=setup(p)
  try:
    for f in range(4):
      c=open_cell(pg,f);check(c,'no open cell for facing '+FN[f])
      T.ev(pg,'a=>SOTA.teleport(a[0],a[1],a[2])',[c[0],c[1],f]);pg.wait_for_timeout(200)
      m0=marker(pg);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(350);s=T.ev(pg,'SOTA.state()')
      check([s['x'],s['y']]!=c,'Forward did not move (facing %s)'%FN[f]);m1=marker(pg)
      z0,z1=m0['cam']['z'],m1['cam']['z']
      # m1 re-expressed in m0's drawn pixels: same map, same camera as the first drawing
      x1=m0['px']+((m1['px']-m1['bw']/2)/z1+m1['cam']['cx']-(m0['px']-m0['bw']/2)/z0-m0['cam']['cx'])*z0
      y1=m0['py']+((m1['py']-m1['bh']/2)/z1+m1['cam']['cy']-(m0['py']-m0['bh']/2)/z0-m0['cam']['cy'])*z0
      vx,vy=x1-m0['px'],y1-m0['py'];check(math.hypot(vx,vy)>4,'marker did not move on the map: %r'%((vx,vy),))
      ax,ay=m0['ax']-m0['px'],m0['ay']-m0['py'];check(angdiff(math.degrees(math.atan2(ax,-ay)),math.degrees(math.atan2(vx,-vy)))<1,'drawn arrow and the move disagree')
      move=math.degrees(math.atan2(vx,-vy))%360        # clockwise from the map top, measured on the drawn map
      want=(-move)%360                                  # rose N must sit this far clockwise from 'forward' (= up on the 3D view)
      got=rendered_deg(pg)
      check(angdiff(got,want)<1.0,'facing %s: on-map move %.1f deg, rose drawn at %.1f, want %.1f'%(FN[f],move,got,want))
      if f==0:check(angdiff(move,0)<1 and angdiff(got,0)<1,'a move toward the map top must leave N pointing straight up')
      print('  facing',FN[f],'map move %.1f deg'%move,'rose %.1f deg'%got,'art',T.ev(pg,'SOTA.compass().art'),flush=True)
      shot(pg,'compass-face-%s.png'%FN[f]);r=T.ev(pg,'(()=>{const r=document.getElementById("dbg").getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()')
      shot(pg,'compass-face-%s-crop.png'%FN[f],{'x':r[0]-6,'y':r[1]-4,'width':r[2]+12,'height':r[3]+10})
  finally:b.close()
def t_turns_shortest(p):
  b,pg=setup(p)
  try:
    T.ev(pg,'SOTA.teleport(MAZE.entrance[0],MAZE.entrance[1],0)');pg.wait_for_timeout(200);fr=T.ev(pg,'getComputedStyle(document.getElementById("dbg")).transform')
    for cmd,step in (('right',-90),('left',90)):
      for k in range(4):
        d0=T.ev(pg,'SOTA.compass().deg');T.ttap(pg,f'[data-cmd={cmd}]');pg.wait_for_timeout(120);d1=T.ev(pg,'SOTA.compass().deg')
        check(d1-d0==step,'%s turn moved the rose %s deg (want %s)'%(cmd,d1-d0,step))
        f=T.ev(pg,'SOTA.state().f');check(angdiff(rendered_deg(pg),(-90*f)%360)<1,'rose does not match facing %s after %s'%(FN[f],cmd))
    check(T.ev(pg,'getComputedStyle(document.getElementById("dbg")).transform')==fr=='none','the frame turned')
    tr=T.ev(pg,'getComputedStyle(document.getElementById("cmp")).transitionDuration');check(0<float(tr.rstrip('s'))<=0.4,'transition '+tr)
  finally:b.close()
def t_hud_toggle_persists(p):
  b,pg=setup(p)
  try:
    check(T.ev(pg,'document.getElementById("dbg").getAttribute("aria-label")')=='Compass. Tap to show or hide location info','aria-label')
    check(T.ev(pg,'document.getElementById("dbg").textContent.trim()')=='','the old i is still drawn')
    hud=lambda:T.ev(pg,'getComputedStyle(document.getElementById("hud")).display')
    check(hud()=='block','HUD line not on by default');t=T.ev(pg,'document.getElementById("hud").textContent');check(t.startswith('Zone ') and '  cell ' in t and '  facing ' in t,'HUD text '+t)
    T.ttap(pg,'#dbg');pg.wait_for_timeout(100);check(hud()=='none','tap did not hide the HUD line');check(T.ev(pg,'localStorage.getItem("sota.hud")')=='0','sota.hud not saved')
    pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');T.SPL.pass_splash(pg);T.past_title(pg);pg.wait_for_timeout(300)
    check(hud()=='none','hidden HUD did not persist through reload')
    T.ev(pg,'SOTA.rpg.closeUI()');T.ttap(pg,'#dbg');pg.wait_for_timeout(100);check(hud()=='block','second tap did not show the HUD line');check(T.ev(pg,'localStorage.getItem("sota.hud")')=='1','sota.hud not 1')
  finally:b.close()
def t_frame_spot_and_overlap(p):
  b,pg=setup(p)
  try:
    r=json.loads(T.ev(pg,'''JSON.stringify((()=>{const g=e=>{const r=document.getElementById(e).getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]};const d=document.getElementById("dbg"),cs=getComputedStyle(d);
      const c=document.getElementById("cmp").getBoundingClientRect();return {dbg:g("dbg"),cmp:[c.left,c.top,c.width,c.height],rad:cs.borderTopLeftRadius,ink:[cs.borderTopWidth,cs.borderTopColor,cs.backgroundImage,cs.boxShadow],mapink:(m=>[m.borderTopWidth,m.borderTopColor,m.backgroundImage,m.boxShadow])(getComputedStyle(document.getElementById("mapb"))),
      others:[...document.querySelectorAll("#hud,#mapb,#partyb,[data-cmd],.slot,#s5here")].filter(e=>e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect();return [e.id||e.dataset.cmd||e.className,r.left,r.top,r.right,r.bottom]})}})())'''))
    d=r['dbg'];check([round(v,1) for v in d]==[356.0,6.0,404.0,54.0],'frame moved or resized: %r'%d)
    check(r['rad']=='50%' or r['rad'].startswith('24'),'frame not round: '+r['rad']);check(r['ink']==r['mapink'],'ink frame differs from the other ink buttons: %r'%((r['ink'],r['mapink']),))
    cx,cy=r['cmp'][0]+r['cmp'][2]/2,r['cmp'][1]+r['cmp'][3]/2;check(abs(cx-380)<0.6 and abs(cy-30)<0.6 and abs(r['cmp'][2]-36)<0.6,'rose not centred 36px: %r'%r['cmp'])
    check(d[0]>=0 and d[1]>=0 and d[2]<=412 and d[3]<=891,'outside the screen')
    for o in r['others']:check(o[3]<=d[0] or o[1]>=d[2] or o[4]<=d[1] or o[2]>=d[3],'compass overlaps %r'%(o,))
    # safe area: a notch phone (top inset 47px) moves frame and rose down together, still 48px, still clear of the HUD line
    T.ev(pg,'document.documentElement.style.setProperty("--t","1");const s=document.createElement("style");s.textContent="#dbg{top:calc(6px + 47px)!important}#hud{top:calc(10px + 47px)!important}";document.head.appendChild(s)')
    pg.wait_for_timeout(200);d2=T.ev(pg,'(()=>{const r=document.getElementById("dbg").getBoundingClientRect(),h=document.getElementById("hud").getBoundingClientRect();return [r.left,r.top,r.width,r.height,h.right<=r.left]})()')
    check(d2[1]==53 and d2[2]==48 and d2[3]==48 and d2[4],'with a 47px inset: %r'%d2)
  finally:b.close()
def t_load_travel_tavern_and_art(p):
  b,pg=setup(p)
  try:
    check(T.ev(pg,'SOTA.compass().art')=='png','Graphics PNG not used: %r'%T.ev(pg,'SOTA.compass()'))
    nat=T.ev(pg,'(()=>{const i=document.getElementById("cmpimg");return [i.naturalWidth,i.currentSrc.split("/").pop()]})()');check(nat[1]=='compass-rose-144.png','a 3x phone must use the 144: %r'%nat)
    T.ev(pg,'SOTA.teleport(MAZE.entrance[0],MAZE.entrance[1],1)');check(angdiff(rendered_deg(pg),270)<1,'travel (teleport facing E) did not turn the rose')
    tv=T.ev(pg,'MAZE.taverns[0]');T.ev(pg,'a=>{SOTA.teleport(a[0],a[1],2);SOTA.rpg.s5.tavernScreen(0)}',tv);pg.wait_for_timeout(300);T.ev(pg,'SOTA.rpg.closeUI()')
    check(angdiff(rendered_deg(pg),180)<1,'after tavern exit the rose does not show facing S')
    T.ev(pg,'a=>{SOTA.teleport(a[0],a[1],3);SOTA.rpg.doSave()}',tv);T.ev(pg,'SOTA.teleport(MAZE.entrance[0],MAZE.entrance[1],0)');pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');T.SPL.pass_splash(pg);T.past_title(pg)
    check(T.ev(pg,'SOTA.state().f')==3,'saved facing W not loaded: %r'%T.ev(pg,'SOTA.state()'));check(T.ev(pg,'getComputedStyle(document.getElementById("cmp")).transitionProperty') is not None,'')
    check(angdiff(rendered_deg(pg),90)<1,'after reload facing W the rose is not at 90 deg')
  finally:b.close()
  b,pg=setup(p,block_png=True)
  try:
    pg.wait_for_timeout(300);check(T.ev(pg,'SOTA.compass().art')=='code' and T.ev(pg,'!!document.getElementById("cmpsvg")'),'no code fallback when the PNG is missing')
    T.ev(pg,'SOTA.teleport(MAZE.entrance[0],MAZE.entrance[1],1)');check(angdiff(rendered_deg(pg),270)<1,'fallback rose does not turn')
    r=T.ev(pg,'(()=>{const r=document.getElementById("cmpsvg").getBoundingClientRect();return [r.width,r.height]})()');check(abs(r[0]-36)<0.6,'fallback size %r'%r)
    shot(pg,'fallback-face-E-crop.png',{'x':350,'y':2,'width':60,'height':58})
  finally:b.close()
with sync_playwright() as p:
  for n,f in [('facings_vs_drawn_map',t_facings_vs_drawn_map),('turns_shortest',t_turns_shortest),('hud_toggle_persists',t_hud_toggle_persists),('frame_spot_and_overlap',t_frame_spot_and_overlap),('load_travel_tavern_and_art',t_load_travel_tavern_and_art)]:run(n,f,p)
print('page errors:',ERR[:3]);print(f'{passed} passed, {failed} failed');sys.exit(1 if failed or ERR else 0)
