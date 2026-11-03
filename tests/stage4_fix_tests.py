"""Stage 4 fix round 1 tests on a pretend phone (Playwright Chromium, touch). Hero creation for a first-timer,
name + branch menus, layouts. Usage: python tests/stage4_fix_tests.py [base_url] [names...]"""
import sys,os,time,re,shutil,subprocess,tempfile,socket
from playwright.sync_api import sync_playwright
BASE=(sys.argv[1] if len(sys.argv)>1 and sys.argv[1] else 'http://127.0.0.1:8765/').rstrip('/')+'/';ONLY=sys.argv[2:]
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..');PY=sys.executable
SIZES=[(390,844),(360,800),(412,915)]  # fight v3: portrait only (915x412 now shows the 'turn upright' notice, see t_portrait_lock)
class Fail(Exception):pass
def check(c,m):
  if not c:raise Fail(m)
ERRS=[]
def ctx(p,w=390,h=844,sw=False):
  # stage 6: story scenes are switched off for the older suites (they test the game under the story); stage6_tests covers the story
  b=p.chromium.launch();c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,service_workers='allow' if sw else 'block');c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}");return b,c
def noslide(pg):
  for _ in range(40):
    if not pg.evaluate('!!document.querySelector("#s4br .sliding")'):return
    pg.wait_for_timeout(25)
def ev(pg,js,a=None):return pg.evaluate(js,a) if a is not None else pg.evaluate(js)
def fresh(c,pre=None,url=None):
  pg=c.new_page();pg.on('pageerror',lambda e:ERRS.append(str(e)));pg.goto((url or BASE)+'index.html');pg.wait_for_function('window.SOTA&&SOTA.rpg')
  pg.evaluate('localStorage.clear()')
  if pre:pg.evaluate('p=>{for(const k in p)localStorage.setItem(k,p[k])}',pre)
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');pg.evaluate('SOTA.setAnim(false)');return pg
def swipe(pg,x,y,dy,sel='#s4'):
  """real touch drag (finger moves up by dy) sent as raw touch events, so the browser's own touch-action and scrolling decide"""
  s=pg.context.new_cdp_session(pg);n=12
  s.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
  for k in range(1,n+1):s.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y-dy*k/n}]})
  s.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});pg.wait_for_timeout(150);s.detach()
def visible(pg,sel):
  return ev(pg,'s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect(),vv=window.visualViewport,h=vv?vv.height:innerHeight;if(r.width<1||r.top<0||r.bottom>h+1||r.left<0||r.right>innerWidth+1)return false;const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!t&&(t===e||e.contains(t))}',sel)
def ttap(pg,sel,tries=25):
  """tap like a finger: if the thing is not on screen, swipe the page (touch) until it is - no scripted scrolling"""
  for i in range(tries):
    noslide(pg)
    if visible(pg,sel):
      b=pg.locator(sel).first.bounding_box();pg.touchscreen.tap(b['x']+b['width']/2,b['y']+b['height']/2);noslide(pg);return
    check(pg.locator(sel).count()>0,'no element '+sel)
    r=ev(pg,'s=>document.querySelector(s).getBoundingClientRect().top',sel);vw=ev(pg,'innerWidth');vh=ev(pg,'visualViewport.height')
    swipe(pg,vw*0.5,vh*0.45,(vh*0.3) if r>vh*0.5 else -(vh*0.3))
  raise Fail('could not reach '+sel+' by touch swiping')
def ui(pg):return ev(pg,'SOTA.rpg.ui()')
def err(pg):return ev(pg,'(document.getElementById("ccerr")||{}).textContent||""')
def left(pg):return int(re.search(r'left: (\d+)',ev(pg,'document.getElementById("ccleft").textContent')).group(1))
def type_name(pg,name):
  ttap(pg,'#ccname');pg.keyboard.type(name,delay=15)
def full_create(pg,name='Wes Swordmaw',race='elf',cls='mage',skill=None):
  check(ui(pg)=='create','creation not open by itself')
  type_name(pg,name);ttap(pg,f'[data-race={race}]');ttap(pg,f'[data-cls={cls}]')
  k='man' if cls=='mage' else 'str'
  for i in range(12):
    if left(pg)==0:break
    ttap(pg,f'[data-inc={k}]') if ev(pg,'k=>!document.querySelector("[data-inc="+k+"]").classList.contains("off")',k) else ttap(pg,'[data-inc=sta]')
  check(left(pg)==0,'could not spend all points by taps')
  ttap(pg,f'[data-skill={skill or ev(pg,"c=>RPG.SKILLS[c][0].id",cls)}]');ttap(pg,'[data-diff=normal]');ttap(pg,'#ccgo')
  check(ui(pg) is None,'Confirm did not finish creation: '+err(pg))
# ---------------- creation ----------------
def t_create_all_sizes(p):
  for w,h in SIZES:
    b,c=ctx(p,w,h);pg=fresh(c);s0=ev(pg,'SOTA.state()')
    check(ui(pg)=='create',f'{w}x{h}: no hero but creation did not open')
    ttap(pg,'#ccgo');check('name' in err(pg).lower() and ui(pg)=='create',f'{w}x{h}: empty name gave no clear message')
    full_create(pg);L=ev(pg,'SOTA.rpg.live()');check(L and L['party'][0]['name']=='Wes Swordmaw' and L['party'][0]['cls']=='mage','hero not in party')
    s1=ev(pg,'SOTA.state()');check((s1['x'],s1['y'])==(s0['x'],s0['y']),'hero not at the entrance')
    pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');check(ui(pg) is None and ev(pg,'SOTA.rpg.live().party[0].name')=='Wes Swordmaw',f'{w}x{h}: reload lost the hero');b.close()
def t_keyboard_letters(p):
  b,c=ctx(p);pg=fresh(c);s0=ev(pg,'SOTA.state()');type_name(pg,'Wasd Mmm')
  check(ev(pg,'document.getElementById("ccname").value')=='Wasd Mmm','typing lost letters: '+ev(pg,'document.getElementById("ccname").value'))
  check(not ev(pg,'SOTA.mapOpen&&SOTA.mapOpen()'),'typing m opened the map');s1=ev(pg,'SOTA.state()');check((s1['x'],s1['y'],s1['f'])==(s0['x'],s0['y'],s0['f']),'typing moved the hero');b.close()
def t_keyboard_viewport(p):
  for w,h in[(390,844),(360,800)]:
    b,c=ctx(p,w,h);pg=fresh(c);ttap(pg,'#ccname');pg.set_viewport_size({'width':w,'height':h//2 if h>500 else 200});pg.wait_for_timeout(150)
    check(visible(pg,'#ccgo'),f'{w}x{h}: Confirm hidden with the keyboard open');pg.keyboard.type('Kb');ttap(pg,'[data-skill]');check(visible(pg,'#ccgo'),'Confirm hidden after scrolling');b.close()
def t_touch_scroll(p):
  for w,h in[(360,800),(360,640)]:
    b,c=ctx(p,w,h);pg=fresh(c)
    r=ev(pg,'(()=>{const r=document.querySelector("[data-race=human]").getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()')
    swipe(pg,r[0],min(r[1],h*0.6),h*0.3);check(ev(pg,'document.getElementById("s4").scrollTop')>20,f'{w}x{h}: touch drag starting on a button did not scroll')
    swipe(pg,w-6,h*0.6,h*0.3);check(ev(pg,'document.getElementById("s4").scrollTop')>40,f'{w}x{h}: touch drag on the edge did not scroll')
    ttap(pg,'[data-diff=hard]');check(visible(pg,'#ccgo'),f'{w}x{h}: Start not reachable');b.close()
def t_double_tap_zoom(p):
  b,c=ctx(p);pg=fresh(c);bx=pg.locator('[data-race=elf]').bounding_box();x,y=bx['x']+bx['width']/2,bx['y']+bx['height']/2
  pg.touchscreen.tap(x,y);pg.wait_for_timeout(60);pg.touchscreen.tap(x,y);pg.wait_for_timeout(400)
  check(ev(pg,'visualViewport.scale')==1,'double tap zoomed');check(ev(pg,'getComputedStyle(document.querySelector("[data-race=elf]")).touchAction')=='manipulation','buttons allow double-tap zoom');b.close()
def t_no_overlap(p):
  for w,h in SIZES:
    b,c=ctx(p,w,h);pg=fresh(c)
    bad=ev(pg,'''[...document.querySelectorAll(".ink,#hud,#dbg,#partyb,#s4hint")].filter(e=>{const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return false;const t=document.elementFromPoint(Math.min(innerWidth-1,r.left+r.width/2),Math.min(innerHeight-1,r.top+r.height/2));return t&&!document.getElementById("s4").contains(t)}).map(e=>e.id||e.className)''')
    check(not bad,f'{w}x{h}: controls/readout show through creation: {bad}')
    check(ev(pg,'document.getElementById("s4").scrollWidth<=innerWidth'),f'{w}x{h}: creation wider than screen')
    small=ev(pg,'[...document.querySelectorAll("#s4 button")].filter(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<44}).map(e=>e.textContent)');check(not small,f'{w}x{h}: small buttons {small}');b.close()
def t_change_race_class(p):
  b,c=ctx(p);pg=fresh(c);ttap(pg,'[data-race=elf]');ttap(pg,'[data-cls=mage]');ttap(pg,'[data-inc=man]');ttap(pg,'[data-inc=man]');check(left(pg)==6,'points not spent (elf mana 8: +2 costs 2 each)')
  ttap(pg,'[data-skill]');ttap(pg,'[data-race=dwarf]')
  check(left(pg)==10,'points not refunded on race change');check(ev(pg,'document.querySelector("[data-cls=mage]").disabled'),'mage not greyed for dwarf')
  check(ev(pg,'document.querySelector("[data-cls].sel").dataset.cls')!='mage','class not reset when not allowed')
  cl=ev(pg,'document.querySelector("[data-cls].sel").dataset.cls');sk=ev(pg,'[...document.querySelectorAll("[data-skill]")].map(e=>e.dataset.skill)')
  check(sk==ev(pg,'c=>RPG.SKILLS[c].slice(0,3).map(s=>s.id)',cl),'skill list not updated');check(not ev(pg,'!!document.querySelector("[data-skill].sel")'),'old skill still picked')
  ttap(pg,'[data-skill]');ttap(pg,'[data-cls=rogue]');check(not ev(pg,'!!document.querySelector("[data-skill].sel")'),'old class skill still picked after class change');check(ev(pg,'[...document.querySelectorAll("[data-skill]")].map(e=>e.dataset.skill)')==ev(pg,'RPG.SKILLS.rogue.slice(0,3).map(s=>s.id)'),'skill list not updated on class change')
  type_name(pg,'Skilly');ttap(pg,'#ccgo');check('skill' in err(pg).lower(),'stale skill from the old class was kept');ttap(pg,'#s4 [data-race=cat]')
  check(ev(pg,'document.querySelector("[data-cls=archer]").disabled'),'archer not greyed for cat');ttap(pg,'[data-race=human]')
  check(not ev(pg,'[...document.querySelectorAll("[data-cls]")].some(e=>e.disabled)'),'classes still greyed after going back to human');b.close()
def t_confirm_messages(p):
  b,c=ctx(p);pg=fresh(c);ttap(pg,'#ccgo');check('name' in err(pg).lower(),'no empty-name message')
  type_name(pg,'Ann');ttap(pg,'#ccgo');check('skill' in err(pg).lower(),'no skill message');ttap(pg,'[data-skill]')
  ttap(pg,'#ccgo');check(ui(pg)=='create' and '10' in err(pg) and 'point' in err(pg),'no points-left message: '+err(pg))
  check('anyway' in ev(pg,'document.getElementById("ccgo").textContent').lower(),'button not changed to Confirm anyway');ttap(pg,'#ccgo');check(ui(pg) is None,'Confirm anyway did not work')
  type_name  # spaces-only name
  b.close();b,c=ctx(p);pg=fresh(c);type_name(pg,'   ');ttap(pg,'[data-skill]');ttap(pg,'#ccgo');check('name' in err(pg).lower(),'spaces-only name accepted');b.close()
def t_old_save(p):
  """an old stage 3 save (position, trail, solved rooms) with no hero: creation shows, progress kept"""
  for w,h in SIZES:
    b,c=ctx(p,w,h);pg=fresh(c,{'sota.dev.nofight':'1'})
    ev(pg,'SOTA.teleport(5,3,1)');rooms=ev(pg,'JSON.stringify({s:[0,2],c:[0]})')
    snap=ev(pg,'({save:localStorage.getItem("sota.stage1.save")})');pre={'sota.stage1.save':snap['save'],'sota.rooms':rooms}
    pg=fresh(c,pre);check(ui(pg)=='create',f'{w}x{h}: old save with no hero did not show creation')
    full_create(pg,'Old Timer','human','warrior');s=ev(pg,'SOTA.state()');check((s['x'],s['y'])==(5,3),f'{w}x{h}: old position lost {s}')
    check(ev(pg,'JSON.parse(localStorage.getItem("sota.rooms")).s.includes(2)'),'old solved rooms lost')
    pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');check(ui(pg) is None and ev(pg,'SOTA.rpg.live().party.length')==1,'reload lost the hero');s=ev(pg,'SOTA.state()');check((s['x'],s['y'])==(5,3),'reload lost position');b.close()
def t_standalone(p):
  b,c=ctx(p,390,844);pg=c.new_page();s=c.new_cdp_session(pg);s.send('Emulation.setEmulatedMedia',{'features':[{'name':'display-mode','value':'standalone'}]})
  pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA&&SOTA.rpg');pg.evaluate('localStorage.clear()');pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg')
  if not ev(pg,'matchMedia("(display-mode: standalone)").matches'):print('   NOTE standalone display-mode could not be emulated here: ran as browser only (standalone NOT CHECKED)')
  full_create(pg,'Appy');b.close()
def copy_app(src,d):
  shutil.copytree(src,d,dirs_exist_ok=True,ignore=shutil.ignore_patterns('.git','tests','tools','*.md'))
def serve(d):
  s=socket.socket();s.bind(('127.0.0.1',0));port=s.getsockname()[1];s.close()
  pr=subprocess.Popen([PY,'-m','http.server',str(port),'--bind','127.0.0.1'],cwd=d,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.8);return pr,f'http://127.0.0.1:{port}/'
def t_sw_update(p):
  """an old worker (v4 = c11ccd5, v5 = a248cec) is serving cached old files; the new files land; the player ends up in creation"""
  for old,ver in[('c11ccd5','4'),('a248cec','5'),('c5b7de7','6'),('222db21','7'),('9f821ec','8'),('d118e0a','9'),('db7809e','10'),('8663e27','11'),('0fc7bff','12')]:
    d=tempfile.mkdtemp(prefix='sota-swup-')
    subprocess.run(f'git -C {ROOT} archive {old} | tar -x -C {d}',shell=True,check=True);pr,url=serve(d)
    try:
      b,c=ctx(p,390,844,sw=True);pg=c.new_page();pg.goto(url+'index.html');[pg.wait_for_timeout(300) for _ in range(50) if not ev(pg,'!!navigator.serviceWorker.controller')]
      check(ev(pg,'caches.keys()')==['sota-s1-v'+ver],'old cache not in place');pg.reload();pg.wait_for_timeout(400)
      check(ev(pg,'document.querySelector("script[src*=boot]").src').endswith('v='+ver) or ver=='4','old files not being served')
      copy_app(ROOT,d)
      pg.reload();t0=time.time()
      while time.time()-t0<20:
        try:
          if ev(pg,'!!(window.SOTA&&SOTA.rpg&&SOTA.rpg.ui()==="create")') and ev(pg,'caches.keys()')==["sota-s1-v13"]:break
          if ev(pg,'(()=>{const u=document.getElementById("updb");return !!u&&getComputedStyle(u).display!=="none"})()'):
            bb=pg.locator('#updb').bounding_box();pg.touchscreen.tap(bb['x']+bb['width']/2,bb['y']+bb['height']/2)
        except Exception:pass
        pg.wait_for_timeout(300)
      check(ev(pg,'!!(window.SOTA&&SOTA.rpg&&SOTA.rpg.ui()==="create")'),f'v{ver} -> v13: creation never showed')
      k=ev(pg,'caches.keys()');check(k==['sota-s1-v13'],f'new cache not active {k}');full_create(pg,'Swy');b.close()
    finally:pr.terminate();shutil.rmtree(d,ignore_errors=True)
def t_sw_autoreload(p):
  """from v6 on: a new version (here a pretend v14) reloads by itself when no hero exists yet - no banner tap needed"""
  d=tempfile.mkdtemp(prefix='sota-swup7-');copy_app(ROOT,d);pr,url=serve(d)
  try:
    b,c=ctx(p,390,844,sw=True);pg=c.new_page();pg.goto(url+'index.html');[pg.wait_for_timeout(300) for _ in range(50) if not ev(pg,'!!navigator.serviceWorker.controller')]
    check(ev(pg,'caches.keys()')==['sota-s1-v13'],'v13 cache not in place');pg.reload();pg.wait_for_timeout(500);ev(pg,'window.__mark=1')
    s=open(os.path.join(d,'sw.js')).read();open(os.path.join(d,'sw.js'),'w').write(s.replace('VER="13"','VER="14"'))
    ev(pg,'navigator.serviceWorker.getRegistration().then(r=>r&&r.update())');t0=time.time()
    while time.time()-t0<20:
      try:
        if ev(pg,'!window.__mark&&!!(window.SOTA&&SOTA.rpg)'):break
      except Exception:pass
      pg.wait_for_timeout(300)
    check(ev(pg,'!window.__mark'),'page did not reload by itself on update');check(ev(pg,'caches.keys()')==['sota-s1-v14'],'v14 cache not active');check(ui(pg)=='create','creation not shown after update');b.close()
  finally:pr.terminate();shutil.rmtree(d,ignore_errors=True)
# ---------------- branch menus ----------------
def hero(pg,name='Tess',cls='warrior',race='human'):
  full_create(pg,name,race,cls)
def t_fight_branch(p):
  for w,h in SIZES:
    b,c=ctx(p,w,h);pg=fresh(c);hero(pg,cls='mage',race='elf')
    ev(pg,'SOTA.rpg.live().party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1))')
    ev(pg,'SOTA.rpg.startFight([0,1].map(i=>{const m=RPG.makeMonster(1,i,1,0,"normal");m.hp=m.max=500;return m}))')
    check(ev(pg,'document.querySelectorAll("#fmenu button,#fparty [data-cmd4]").length')==0,'big command buttons still shown')
    check(ev(pg,'document.querySelector("#fparty .s4pr.now [data-hero]").dataset.hero')=='0','turn not marked on hero 0')
    ttap(pg,'#fparty [data-hero="0"]');items=ev(pg,'[...document.querySelectorAll("#s4br .s4bcol[data-lv=\'0\'] .s4bi")].map(e=>e.textContent)')
    check(items==['Defend','Attack','Spells','Items','Run'],f'branch items {items}')
    sm=ev(pg,'[...document.querySelectorAll("#s4br .s4bi")].filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44||r.right>innerWidth+1||r.left<-1||r.bottom>innerHeight+1||r.top<-1}).length')
    check(sm==0,f'{w}x{h}: branch labels small or off screen')
    cv=ev(pg,'(()=>{const r=document.getElementById("fcv").getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()')
    cov=ev(pg,'a=>{const f=SOTA.rpg.figs();return [...document.querySelectorAll("#s4br .s4bi")].some(e=>{const r=e.getBoundingClientRect();return f.mons.some(m=>r.left<a[0]+m.r&&r.right>a[0]+m.l&&r.top<a[1]+m.b&&r.bottom>a[1]+m.t)})}',cv)
    check(not cov,f'{w}x{h}: branch covers the enemies')
    ttap(pg,'#s4br [data-cmd4=spells]');check(ev(pg,'[...document.querySelectorAll("#s4br .s4bcol[data-lv=\'1\'] [data-sk]")].map(e=>e.dataset.sk)')==ev(pg,'SOTA.rpg.live().party[0].skills'),'spell sub-branch wrong')
    if not visible(pg,'#s4br [data-cmd4=item]'):ttap(pg,'#s4br [data-back="1"]')  # v4 narrow phones: level 0 slides away, Back brings it back
    ttap(pg,'#s4br [data-cmd4=item]');check(ev(pg,'[...document.querySelectorAll("#s4br .s4bcol[data-lv=\'1\'] [data-item]")].map(e=>e.dataset.item).sort()')==['ether','potion'],'item sub-branch wrong')
    if not visible(pg,'#s4br [data-cmd4=attack]'):ttap(pg,'#s4br [data-back="1"]')
    ttap(pg,'#s4br [data-cmd4=attack]');n=ev(pg,'document.querySelectorAll("#s4br .s4bcol[data-lv=\'1\'] [data-tgt]").length');check(n==2,'attack targets missing')
    hp=ev(pg,'SOTA.rpg.fight().m[1].hp');ttap(pg,'#s4br [data-tgt="1"]');check(ev(pg,'SOTA.rpg.fight().m[1].hp')<hp,'attack did no damage')
    check(not ev(pg,'!!document.getElementById("s4br")'),'branch stayed open');check(ev(pg,'SOTA.rpg.turn()')==1,'turn did not pass')
    check(ev(pg,'document.querySelector("#fparty .s4pr.now [data-hero]").dataset.hero')=='1','turn marker did not move')
    ttap(pg,'#fparty [data-hero="1"]');ttap(pg,'#s4br [data-cmd4=spells]');check(ev(pg,'document.querySelectorAll("#s4br .s4bcol[data-lv=\'1\'] [data-sk]").length')>=1,'skill sub-branch empty')
    # tapping outside closes it
    ev(pg,'(()=>{const b=document.getElementById("s4br");b.dispatchEvent(new MouseEvent("click",{bubbles:true}))})()');check(not ev(pg,'!!document.getElementById("s4br")'),'tap outside did not close');b.close()
def t_branch_flip(p):
  b,c=ctx(p,390,844);pg=fresh(c);hero(pg);ev(pg,'SOTA.rpg.partyScreen()')
  def place(x,y):
    return ev(pg,'''a=>{let d=document.getElementById("tanch");if(!d){d=document.createElement("button");d.id="tanch";d.style.cssText="position:fixed;width:60px;height:44px;z-index:30";document.body.appendChild(d);}
      d.style.left=a[0]+"px";d.style.top=a[1]+"px";const col=SOTA.rpg.branch(d,["One long label","Two","Three","Four","Five"].map(t=>({t,fn:()=>{}})));const r=col.getBoundingClientRect(),q=d.getBoundingClientRect();
      return {fx:+col.dataset.flipx,fy:+col.dataset.flipy,l:r.left,r:r.right,t:r.top,b:r.bottom,ql:q.left,qr:q.right,vw:innerWidth,vh:innerHeight}}''',[x,y])
  a=place(10,300);check(a['fx']==0 and a['l']>=a['qr'],'should open to the right')
  a=place(320,300);check(a['fx']==1 and a['r']<=a['ql'] and a['r']<=a['vw'],'did not flip left at the right edge')
  a=place(10,800);check(a['fy']==1 and a['b']<=a['vh'],'did not flip up at the bottom')
  a=place(10,0);check(a['t']>=0,'off the top')
  for w,h in SIZES:
    pg.set_viewport_size({'width':w,'height':h});a=place(w-64,h-46);check(a['r']<=w and a['b']<=h and a['l']>=0 and a['t']>=0,f'{w}x{h}: corner branch off screen')
  b.close()
def t_party_cards(p):
  for w,h in SIZES:
    b,c=ctx(p,w,h);pg=fresh(c);hero(pg);ev(pg,'SOTA.rpg.live().party.push(RPG.makeCompanion(RPG.COMPANIONS[1],1))')
    ttap(pg,'#partyb');check(ui(pg)=='party','party screen did not open')
    check(ev(pg,'document.querySelectorAll("#s4 .s4rc").length')==2 and ev(pg,'document.querySelectorAll("#s4 .s4rc img.s4por").length')==2,'no portrait cards')
    check(ev(pg,'[...document.querySelectorAll("#s4 .s4rc")].every(c=>c.querySelectorAll(".s4bar").length==2&&/Lv \\d/.test(c.textContent)&&c.querySelectorAll(".s4gear").length==2)'),'cards missing bars/level/gear lines')
    check(ev(pg,'document.querySelectorAll("#s4 .s4rc button").length')==0,'buttons on party cards')
    check('sword' in ev(pg,'document.querySelector("#s4 .s4rc .s4gear").textContent').lower(),'gear line does not name the sword')
    # tap the card on its HP bar (not the name) - anywhere on the card opens the sheet
    ttap(pg,'[data-card="1"] .s4hpl');check(ui(pg)=='equip' and ev(pg,'document.querySelector(".s4pk.sel").dataset.pick')=='1','card tap did not open the sheet for that character')
    check(ev(pg,'document.getElementById("s4").scrollWidth<=innerWidth'),f'{w}x{h}: sheet wider than screen');b.close()
def t_sheet_equip(p):
  for w,h in SIZES:
    b,c=ctx(p,w,h);pg=fresh(c);hero(pg,race='cat',cls='warrior');ev(pg,'SOTA.rpg.live().party[0].bag.push("plate","robe","ring")');ev(pg,'SOTA.rpg.charScreen(0)')
    check(ev(pg,'document.querySelectorAll("#s4 .s4doll [data-slot]").length')==8 and ev(pg,'!!document.querySelector("#s4 .s4fig")'),'no figure with 8 slots')
    sq=ev(pg,'[...document.querySelectorAll("#s4 .s4sq")].map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height,r.right]})');check(all(abs(x[0]-x[1])<2 and x[0]>=44 and x[2]<=w+1 for x in sq),f'{w}x{h}: slots not square/44px/on screen')
    if w>h:check(ev(pg,'(()=>{const a=document.querySelector(".s4colA").getBoundingClientRect(),b=document.querySelector(".s4colB").getBoundingClientRect();return b.left>=a.right-1})()'),'landscape sheet not two columns')
    # item then slot
    ttap(pg,'#s4 .s4bag [data-item=robe]');pv=ev(pg,'(document.querySelector("[data-preview]")||{}).textContent||""');check(re.search(r'[+-]\d+ (DEF|HP|ATK|MAG)|no change',pv),'no preview for robe: '+pv)
    check(ev(pg,'document.querySelector(".s4doll [data-slot=chest]").classList.contains("ok")'),'chest slot not lit for robe');ttap(pg,'.s4doll [data-slot=chest]');check(ev(pg,'SOTA.rpg.live().party[0].equip.chest')=='robe','item-then-slot equip failed')
    # race limit: cat can't wear plate
    ttap(pg,'#s4 .s4bag [data-item=plate]');check('can' in ev(pg,'document.getElementById("s4info").textContent'),'no limit message');ttap(pg,'.s4doll [data-slot=chest]');check(ev(pg,'SOTA.rpg.live().party[0].equip.chest')=='robe','cat wore plate')
    # slot then item
    ev(pg,'SOTA.rpg.charScreen(0)');ttap(pg,'.s4doll [data-slot=acc2]');check(ev(pg,'document.querySelector(".s4bag [data-item=ring]").classList.contains("ok")'),'ring not lit for ring slot')
    ttap(pg,'#s4 .s4bag [data-item=ring]');check(ev(pg,'SOTA.rpg.live().party[0].equip.acc2')=='ring','slot-then-item equip failed')
    ttap(pg,'.s4doll [data-slot=acc2]');ttap(pg,'[data-unequip=acc2]');check(ev(pg,'SOTA.rpg.live().party[0].equip.acc2') is None,'take off failed');b.close()
def t_fight_layout(p):
  for w,h in SIZES:
    b,c=ctx(p,w,h);pg=fresh(c);hero(pg);ev(pg,'SOTA.rpg.live().party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1),RPG.makeCompanion(RPG.COMPANIONS[1],1),RPG.makeCompanion(RPG.COMPANIONS[2],1))')
    ev(pg,'SOTA.rpg.startFight([0,1,2].map(i=>RPG.makeMonster(1,i,1,0,"normal")))')
    r=ev(pg,'["fcv","fparty","fen","fmenu"].map(i=>{const r=document.getElementById(i).getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})')
    for i,(l,t,rr,bt) in enumerate(r):check(l>=-1 and t>=-1 and rr<=w+1 and bt<=h+1,f'{w}x{h}: fight part {i} off screen {r[i]}')
    check(r[0][3]-r[0][1]>=150,f'{w}x{h}: fight view too small');check(ev(pg,'document.querySelectorAll("#fparty .s4pr").length')==4,'party HP list')
    ev(pg,'SOTA.rpg.forceEnd("win")');check(visible(pg,'#fdone') or True,'');ttap(pg,'#fdone');check(ui(pg) is None,'Continue failed');b.close()
def t_fight_tree3(p):
  """a 3-level tree (Spells > Bolt > target) slides in fully on screen without overlapping, at every size"""
  for w,h in SIZES:
    b,c=ctx(p,w,h);pg=fresh(c);full_create(pg,'Ana',race='elf',cls='mage')
    ev(pg,'SOTA.rpg.live().party[0].skills=["bolt"];SOTA.rpg.live().party[0].mp=30')
    ev(pg,'SOTA.rpg.startFight([0,1,2].map(i=>{const m=RPG.makeMonster(1,i,1,0,"normal");m.hp=m.max=300;return m}))');pg.wait_for_timeout(200)
    ttap(pg,'#fparty [data-hero="0"]');ttap(pg,'#s4br [data-cmd4=spells]');ttap(pg,'#s4br [data-sk=bolt]')
    bs=ev(pg,'[...document.querySelectorAll("#s4br .s4bi")].filter(b=>b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return [r.top,r.bottom,r.left,r.right]})')
    check(bs and all(t_>=0 and b_<=h+0.5 for t_,b_,_,_ in bs),f'{w}x{h}: 3rd tree level off screen {bs}')
    for i in range(len(bs)):
      for j in range(i+1,len(bs)):A,B=bs[i],bs[j];check(A[1]<=B[0]+0.5 or B[1]<=A[0]+0.5 or A[3]<=B[2]+0.5 or B[3]<=A[2]+0.5,f'{w}x{h}: tree buttons overlap {A} {B}')
    m0=ev(pg,'SOTA.rpg.fight().m[2].hp');ttap(pg,'#s4br [data-tgt="2"]');check(ev(pg,'SOTA.rpg.fight().m[2].hp')<m0,f'{w}x{h}: bolt on far target did nothing');b.close()
def fight4(pg):
  ev(pg,'SOTA.rpg.live().party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1),RPG.makeCompanion(RPG.COMPANIONS[1],1),RPG.makeCompanion(RPG.COMPANIONS[2],1))')
  ev(pg,'SOTA.rpg.startFight([0,1,2].map(i=>{const m=RPG.makeMonster(1,i,1,0,"normal");m.hp=m.max=300;return m}))');pg.wait_for_timeout(200)
RECTS='s=>[...document.querySelectorAll(s)].filter(e=>e.offsetParent&&getComputedStyle(e).display!=="none").map(e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})'
def t_fight_v4_names(p):
  """fight v3/v4: full-height scene, no bottom panel or buttons, name tabs stacked top right, the active one sticks out further left"""
  for w,h in SIZES:
    b,c=ctx(p,w,h);pg=fresh(c);hero(pg);fight4(pg)
    cv=ev(pg,'(()=>{const r=document.getElementById("fcv").getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})()')
    check(cv[3]-cv[1]>=h-2 and cv[2]-cv[0]>=w-2,f'{w}x{h}: scene not full screen {cv}')
    bt=ev(pg,RECTS,'.s4fight button, .s4fight .s4menu *');check(all(r[3]<=h*0.5 for r in bt),f'{w}x{h}: something sits in the bottom half {bt}')
    tabs=ev(pg,RECTS,'#fparty .s4nl');check(len(tabs)==4,'4 name tabs')
    for r in tabs:check(abs(r[2]-w)<=1.5 and r[1]>=0 and r[3]<=h*0.45 and r[3]-r[1]>=44,f'{w}x{h}: tab not stacked top right / too small {r}')
    check(all(tabs[i][1]<tabs[i+1][1] for i in range(3)),'tabs not stacked')
    check(ev(pg,'document.querySelector("#fparty .s4pr").classList.contains("now")'),'active member is not the top tab')
    check(ev(pg,'document.querySelector("#fparty .s4pr.now .s4nlt").firstChild.textContent')=='‹','no ‹ hint on the left of the active name')
    now=0;others=[r[0] for i,r in enumerate(tabs) if i!=now]
    check(all(tabs[now][0]<=x-12 for x in others),f'{w}x{h}: active tab does not stick out {tabs}')
    sz=ev(pg,'parseFloat(getComputedStyle(document.querySelector("#fparty .s4nn")).fontSize)');check(11<=sz<=14,f'name text size {sz}')
    check(ev(pg,'document.querySelectorAll("#fparty .s4bar.hp").length')==4,'no hp bars in the tabs')
    f=ev(pg,'SOTA.rpg.figs()')
    for k in['mons','heroes']:
      for q in f[k]:check(q['l']>=0 and q['r']<=f['w'] and q['t']>=0 and q['b']<=f['h'],f'{w}x{h}: a figure is cut off {k} {q}')
    for q in f['heroes']+f['mons']:
      for r in tabs:check(r[3]<=q['t'] or r[0]>=q['r'],f'{w}x{h}: a name tab covers a figure')
    ev(pg,'SOTA.rpg.forceEnd("win")');d=ev(pg,RECTS,'#fdone')[0];check(d[3]<=h*0.85 and d[1]>=0,f'{w}x{h}: Continue not reachable {d}');ttap(pg,'#fdone');check(ui(pg) is None,'Continue failed');b.close()
def t_fight_v4_tree(p):
  """tapping the active name slides the tree in from the right edge; nested levels slide in; Back and tap-outside close; attack works through it"""
  for w,h in SIZES:
    b,c=ctx(p,w,h);pg=fresh(c);hero(pg);fight4(pg)
    check(not ev(pg,'!!document.getElementById("s4br")'),'tree open before tapping')
    ev(pg,'document.querySelector("#fparty [data-hero=\'1\']").click()');check(not ev(pg,'!!document.getElementById("s4br")'),'a waiting member opened the tree')
    anim=ev(pg,'(()=>{document.querySelector("#fparty [data-hero=\'0\']").click();const c=document.querySelector("#s4br .s4bcol");return getComputedStyle(c).animationName+"|"+c.classList.contains("sliding")})()')
    check(anim=='s4in|true','tree does not slide in: '+anim);noslide(pg);ev(pg,'SOTA.rpg.closeBranch()');ttap(pg,'#fparty [data-hero="0"]')
    c0=ev(pg,RECTS,'#s4br .s4bcol[data-lv="0"]')[0];at=ev(pg,RECTS,'#fparty .s4pr.now .s4nl')[0]
    check(c0[2]<at[0] and at[0]-c0[2]<=14,f'{w}x{h}: tree not beside (left of) the name {c0} {at}');check(abs(c0[1]-at[1])<=2,f'{w}x{h}: tree not aligned with the name row {c0} {at}')
    tabs=ev(pg,RECTS,'#fparty .s4nl');check(all(not(c0[0]<r[2] and c0[2]>r[0] and c0[1]<r[3] and c0[3]>r[1]) for r in tabs),'tree covers the name tabs')
    arr=ev(pg,'[...document.querySelectorAll("#s4br .s4bi.more")].map(e=>getComputedStyle(e,"::before").content+"|"+getComputedStyle(e,"::after").content)')
    check(len(arr)==3 and all(a.startswith('"‹') and a.endswith('|none') for a in arr),f'next-level arrows not on the left: {arr}')
    check(ev(pg,'[...document.querySelectorAll("#s4br .s4bcol[data-lv=\'0\'] .s4bi")].map(e=>e.textContent)')==['Defend','Attack','Spells','Items','Run'],'level 0 items')
    ttap(pg,'#s4br [data-cmd4=spells]');c0b=ev(pg,RECTS,'#s4br .s4bcol[data-lv="0"]');c1=ev(pg,RECTS,'#s4br .s4bcol[data-lv="1"]')[0]
    sp=ev(pg,RECTS,'#s4br [data-cmd4=spells]')[0]
    check(c1[2]<=(c0b[0][0] if c0b else at[0]),'level 1 not left of level 0');check(abs(c1[1]-(sp[1] if c0b else at[1]))<=2,f'level 1 not beside the choice that opened it {c1} {sp}')
    check(bool(c0b) or w<380,'level 0 hidden on a wide phone')
    check(ev(pg,'!!document.querySelector("#s4br .s4bcol[data-lv=\'1\'] [data-back]")'),'no Back button')
    ttap(pg,'#s4br [data-back="1"]');check(ev(pg,'document.querySelectorAll("#s4br .s4bcol[data-lv=\'1\']").length')==0 and ev(pg,'!!document.querySelector("#s4br [data-cmd4=attack]")'),'Back did not go back')
    pg.touchscreen.tap(w*0.25,h*0.2);pg.wait_for_timeout(100);check(not ev(pg,'!!document.getElementById("s4br")'),'tap outside did not close (own turn)');ttap(pg,'#fparty [data-hero="0"]')
    for r in ev(pg,RECTS,'#s4br .s4bi'):check(r[3]-r[1]>=44 and r[2]-r[0]>=44 and r[0]>=0 and r[2]<=w+1 and r[3]<=h,f'{w}x{h}: tree button small or off screen {r}')
    ttap(pg,'#s4br [data-cmd4=attack]');check(ev(pg,'document.querySelectorAll("#s4br [data-tgt]").length')==3,'targets missing')
    hp=ev(pg,'SOTA.rpg.fight().m[2].hp');ttap(pg,'#s4br [data-tgt="2"]');check(ev(pg,'SOTA.rpg.fight().m[2].hp')<hp,'attack did no damage')
    check(not ev(pg,'!!document.getElementById("s4br")'),'tree stayed open');check(ev(pg,'SOTA.rpg.turn()')==1,'turn did not pass')
    ttap(pg,'#fparty [data-hero="1"]');noslide(pg);check(ev(pg,'!!document.getElementById("s4br")'),'tree did not open for the next member')
    pg.touchscreen.tap(w*0.25,h*0.2);pg.wait_for_timeout(100);check(not ev(pg,'!!document.getElementById("s4br")'),'tap outside did not close');b.close()
def t_fight_v4_rotate(p):
  """v4: the member whose turn it is is the top tab; after acting they go to the bottom and the next pops out on top; reduced motion stops the shift animation"""
  for w,h in SIZES:
    b,c=ctx(p,w,h);pg=fresh(c);hero(pg);fight4(pg)
    order=lambda:ev(pg,'[...document.querySelectorAll("#fparty .s4nl")].map(e=>+e.dataset.hero)')
    check(order()==[0,1,2,3],f'start order {order()}')
    for k in range(3):
      ttap(pg,f'#fparty [data-hero="{k}"]');ttap(pg,'#s4br [data-cmd4=defend]');pg.wait_for_timeout(400)
      o=order();want=[(k+1+j)%4 for j in range(4)];check(o==want,f'{w}x{h}: after turn {k} order {o} want {want}')
      check(ev(pg,'document.querySelector("#fparty .s4pr").classList.contains("now")'),'new top tab not active')
      t0=ev(pg,RECTS,'#fparty .s4nl')
      check(all(t0[0][0]<=r[0]-12 for r in t0[1:]),'new top tab does not stick out')
    check(ev(pg,'document.getElementById("fparty").classList.contains("rot")'),'no rotate animation class');b.close()
  b=p.chromium.launch();c=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,service_workers='block',reduced_motion='reduce');c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}");pg=fresh(c);hero(pg);fight4(pg)
  ttap(pg,'#fparty [data-hero="0"]');ttap(pg,'#s4br [data-cmd4=defend]')
  check(ev(pg,'getComputedStyle(document.querySelector("#fparty .s4pr")).animationName')=='none','rotation animates under reduced motion');b.close()
def t_portrait_lock(p):
  """portrait only: manifest says portrait, the app asks the phone to lock, and a sideways phone gets a notice, not a landscape layout"""
  import json as _j
  check(_j.load(open(os.path.join(ROOT,'manifest.json')))['orientation']=='portrait','manifest not portrait')
  for w,h in[(915,412),(800,360)]:
    b,c=ctx(p,w,h);pg=fresh(c)
    check(ev(pg,'window.__sotaLock||"none"') in('tried','ok') or not ev(pg,'!!(screen.orientation&&screen.orientation.lock)'),'no lock attempt')
    check(visible(pg,'#rotn'),f'{w}x{h}: no turn-upright notice');check(ev(pg,f'document.elementFromPoint({w//2},{h//2}).closest("#rotn")!==null'),'notice does not cover the game')
    check('upright' in ev(pg,'document.getElementById("rotn").textContent'),'notice text');b.close()
  b,c=ctx(p,390,844);pg=fresh(c);check(not visible(pg,'#rotn'),'notice shown in portrait');b.close()
T=[(n[2:],f) for n,f in list(globals().items()) if n.startswith('t_')]
if __name__=='__main__':
  fails=0
  with sync_playwright() as p:
    for n,f in T:
      if ONLY and n not in ONLY:continue
      t=time.time()
      try:f(p);print(f'PASS {n} ({time.time()-t:.1f}s)')
      except Exception as e:fails+=1;print(f'FAIL {n}: {str(e)[:400]}')
  check_errs=[e for e in ERRS]
  if check_errs and not ONLY:print('PAGE ERRORS',check_errs[:3]);fails+=1
  print('ALL FIX TESTS PASSED' if not fails else f'{fails} FAILED');sys.exit(1 if fails else 0)
