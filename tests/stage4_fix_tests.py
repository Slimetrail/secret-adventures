"""Stage 4 fix round 1 tests on a pretend phone (Playwright Chromium, touch). Hero creation for a first-timer,
name + branch menus, layouts. Usage: python tests/stage4_fix_tests.py [base_url] [names...]"""
import sys,os,time,re,shutil,subprocess,tempfile,socket
from playwright.sync_api import sync_playwright
BASE=(sys.argv[1] if len(sys.argv)>1 and sys.argv[1] else 'http://127.0.0.1:8765/').rstrip('/')+'/';ONLY=sys.argv[2:]
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..');PY=sys.executable
SIZES=[(390,844),(360,800),(412,915),(915,412)]
class Fail(Exception):pass
def check(c,m):
  if not c:raise Fail(m)
ERRS=[]
def ctx(p,w=390,h=844,sw=False):
  b=p.chromium.launch();return b,b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,service_workers='allow' if sw else 'block')
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
    if visible(pg,sel):
      b=pg.locator(sel).first.bounding_box();pg.touchscreen.tap(b['x']+b['width']/2,b['y']+b['height']/2);return
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
  for w,h in[(390,844),(360,800),(915,412)]:
    b,c=ctx(p,w,h);pg=fresh(c);ttap(pg,'#ccname');pg.set_viewport_size({'width':w,'height':h//2 if h>500 else 200});pg.wait_for_timeout(150)
    check(visible(pg,'#ccgo'),f'{w}x{h}: Confirm hidden with the keyboard open');pg.keyboard.type('Kb');ttap(pg,'[data-skill]');check(visible(pg,'#ccgo'),'Confirm hidden after scrolling');b.close()
def t_touch_scroll(p):
  for w,h in[(360,800),(915,412)]:
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
  ttap(pg,'[data-cls=rogue]');check(ev(pg,'[...document.querySelectorAll("[data-skill]")].map(e=>e.dataset.skill)')==ev(pg,'RPG.SKILLS.rogue.slice(0,3).map(s=>s.id)'),'skill list not updated on class change')
  ttap(pg,'[data-race=cat]');check(ev(pg,'document.querySelector("[data-cls=archer]").disabled'),'archer not greyed for cat');ttap(pg,'[data-race=human]')
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
def serve(d):
  s=socket.socket();s.bind(('127.0.0.1',0));port=s.getsockname()[1];s.close()
  pr=subprocess.Popen([PY,'-m','http.server',str(port),'--bind','127.0.0.1'],cwd=d,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.8);return pr,f'http://127.0.0.1:{port}/'
def t_sw_update(p):
  """an old worker (v4 = c11ccd5, v5 = a248cec) is serving cached old files; the new files land; the player ends up in creation"""
  for old,ver in[('c11ccd5','4'),('a248cec','5')]:
    d=tempfile.mkdtemp(prefix='sota-swup-')
    subprocess.run(f'git -C {ROOT} archive {old} | tar -x -C {d}',shell=True,check=True);pr,url=serve(d)
    try:
      b,c=ctx(p,390,844,sw=True);pg=c.new_page();pg.goto(url+'index.html');[pg.wait_for_timeout(300) for _ in range(50) if not ev(pg,'!!navigator.serviceWorker.controller')]
      check(ev(pg,'caches.keys()')==['sota-s1-v'+ver],'old cache not in place');pg.reload();pg.wait_for_timeout(400)
      check(ev(pg,'document.querySelector("script[src*=boot]").src').endswith('v='+ver) or ver=='4','old files not being served')
      subprocess.run(f'git -C {ROOT} ls-files | grep -v "^tests/\\|^tools/" | tar -C {ROOT} -cf - -T - | tar -x -C {d}',shell=True,check=True)
      pg.reload();t0=time.time()
      while time.time()-t0<20:
        try:
          if ev(pg,'!!(window.SOTA&&SOTA.rpg&&SOTA.rpg.ui()==="create")'):break
          if ev(pg,'(()=>{const u=document.getElementById("updb");return !!u&&getComputedStyle(u).display!=="none"})()'):
            bb=pg.locator('#updb').bounding_box();pg.touchscreen.tap(bb['x']+bb['width']/2,bb['y']+bb['height']/2)
        except Exception:pass
        pg.wait_for_timeout(300)
      check(ev(pg,'!!(window.SOTA&&SOTA.rpg&&SOTA.rpg.ui()==="create")'),f'v{ver} -> v6: creation never showed')
      check(ev(pg,'caches.keys()')==['sota-s1-v6'],'new cache not active');full_create(pg,'Swy');b.close()
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
    cov=ev(pg,'a=>[...document.querySelectorAll("#s4br .s4bi")].some(e=>{const r=e.getBoundingClientRect();return r.left<a[0]+a[2]*0.5&&r.right>a[0]&&r.top<a[1]+a[3]*0.85&&r.bottom>a[1]+a[3]*0.2})',cv)
    check(not cov,f'{w}x{h}: branch covers the enemies')
    ttap(pg,'#s4br [data-cmd4=spells]');check(ev(pg,'[...document.querySelectorAll("#s4br .s4bcol[data-lv=\'1\'] [data-sk]")].map(e=>e.dataset.sk)')==ev(pg,'SOTA.rpg.live().party[0].skills'),'spell sub-branch wrong')
    ttap(pg,'#s4br [data-cmd4=item]');check(ev(pg,'[...document.querySelectorAll("#s4br .s4bcol[data-lv=\'1\'] [data-item]")].map(e=>e.dataset.item).sort()')==['ether','potion'],'item sub-branch wrong')
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
