"""t2386u logo splash on pretend phones (Playwright Chromium, touch): splash first, waits for a tap, the tap plays the copied logo
sound, the logo holds ~2 s, fades, then the unchanged title flow and title music. Fits portrait and landscape with no scrollbars.
Shows again on every launch, including a service-worker (installed app) launch. The credits badge and its overlap checks are in
tests/t2393u_credits_browser_test.py.
Usage: python3 tests/t2386u_splash_browser_test.py <base_url> [screenshot_dir]"""
import sys,os,time
from playwright.sync_api import sync_playwright
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/').rstrip('/')+'/'
SHOTS=sys.argv[2] if len(sys.argv)>2 else None
SND='art-intro/brand/logo-sound-3-neon-glow.mp3';IMG='art-intro/brand/logo3-neon-chosen-v1.jpg'
class Fail(Exception):pass
def check(c,m):
  if not c:raise Fail(m)
def ctx(p,w,h,sw=False,mobile=True):
  b=p.chromium.launch(args=['--autoplay-policy=user-gesture-required']);c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=mobile,service_workers='allow' if sw else 'block');return b,c
ev=lambda pg,s,*a:pg.evaluate(s,*a)
def shot(pg,name):
  if SHOTS:os.makedirs(SHOTS,exist_ok=True);pg.screenshot(path=os.path.join(SHOTS,name))
def load(c,errs):
  pg=c.new_page();pg.on('pageerror',lambda e:errs.append(str(e)));pg.goto(BASE+'index.html');pg.wait_for_function('()=>window.SOTA&&SOTA.splash&&SOTA.intro');return pg
def top_is_splash(pg,x,y):return ev(pg,'([x,y])=>{const e=document.elementFromPoint(x,y);return !!e&&!!e.closest("#isplash")}',[x,y])
def layout(pg):
  return ev(pg,'''(()=>{const s=document.getElementById("isplash"),i=s.querySelector("img"),t=s.querySelector(".isplash-tap"),r=i.getBoundingClientRect(),q=t.getBoundingClientRect(),cs=getComputedStyle(i);
   const iw=i.naturalWidth,ih=i.naturalHeight,k=Math.min(r.width/iw,r.height/ih),dw=iw*k,dh=ih*k,dx=r.x+(r.width-dw)/2,dy=r.y+(r.height-dh)/2;
   return {fit:cs.objectFit,drawn:[dx,dy,dw,dh],hint:[q.x,q.y,q.width,q.height],vw:innerWidth,vh:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,
    bsw:document.body.scrollWidth,bsh:document.body.scrollHeight,bg:getComputedStyle(s).backgroundColor,loaded:i.complete&&iw>0,hintTxt:t.textContent,hintVis:getComputedStyle(t).visibility}})()''')
def t_order_and_timing(p):
  b,c=ctx(p,390,844);errs=[];pg=load(c,errs)
  check(ev(pg,'SOTA.splash.state()')=='wait','splash not waiting at launch')
  check(top_is_splash(pg,195,422) and top_is_splash(pg,10,10) and top_is_splash(pg,380,834),'splash is not the top screen')
  check(not ev(pg,'SOTA.intro.titleOpen()') and ev(pg,'SOTA.rpg.ui()') is None and not ev(pg,'SOTA.intro.caveOpen()'),'title/intro shown before the splash')
  check(ev(pg,'SOTA.splash.audio().getAttribute("src")')==SND,'audio src is not the copied mp3')
  pg.wait_for_timeout(3500)   # nothing proceeds without a tap
  check(ev(pg,'SOTA.splash.state()')=='wait' and not ev(pg,'SOTA.intro.titleOpen()'),'splash moved on without a tap')
  check(ev(pg,'SOTA.music.now()') is None and ev(pg,'SOTA.splash.audio().paused'),'sound or music before the tap')
  pg.touchscreen.tap(195,422);t0=time.time();pg.wait_for_timeout(250)
  r=ev(pg,'({st:SOTA.splash.state(),paused:SOTA.splash.audio().paused,t:SOTA.splash.audio().currentTime,src:SOTA.splash.audio().currentSrc,m:SOTA.music.now(),title:SOTA.intro.titleOpen()})')
  check(r['st']=='show' and not r['paused'] and r['t']>0 and r['src'].endswith('/'+SND),f'tap did not play the logo sound {r}')
  check(r['m'] is None and not r['title'],f'music/title started under the logo {r}')
  pg.wait_for_timeout(1200);check(ev(pg,'SOTA.splash.state()')=='show' and not ev(pg,'SOTA.intro.titleOpen()'),'logo did not hold ~2 s')
  pg.wait_for_function('()=>SOTA.splash.state()!=="show"',timeout=4000);dt=ev(pg,'SOTA.splash.fadedAt()-SOTA.splash.tappedAt()')
  check(1900<=dt<=2300,f'logo hold {dt} ms, expected about 2000')
  check(ev(pg,'SOTA.intro.titleOpen()'),'title not shown as the logo fades')
  pg.wait_for_function('()=>SOTA.splash.state()==="done"',timeout=3000);check(time.time()-t0<3.6,'splash took too long to finish')
  check(ev(pg,'document.getElementById("isplash").hidden') and not top_is_splash(pg,195,422),'splash still covering the title')
  pg.wait_for_timeout(400);check(ev(pg,'SOTA.music.now()')=='title_intro','title music did not start after the splash')
  pg.touchscreen.tap(200,450);pg.wait_for_timeout(200);check(ev(pg,'SOTA.rpg.ui()')=='create','title tap no longer opens creation')
  check(not errs,f'page errors {errs}');b.close()
def t_fits_phone_sizes(p):
  for (w,h,name) in [(390,844,'portrait 390x844'),(360,640,'portrait 360x640'),(844,390,'landscape 844x390'),(640,360,'landscape 640x360'),(1280,800,'desktop 1280x800')]:
    b,c=ctx(p,w,h,mobile=w<1000);errs=[];pg=load(c,errs);pg.wait_for_function('()=>document.querySelector("#isplash img").complete')
    L=layout(pg);x,y,dw,dh=L['drawn'];hx,hy,hw,hh=L['hint']
    check(L['fit']=='contain' and L['loaded'],f'{name}: logo not contained {L}')
    check(L['sw']<=w and L['sh']<=h and L['bsw']<=w and L['bsh']<=h,f'{name}: scrollbars {L}')
    check(x>=0 and y>=0 and x+dw<=w+0.5 and y+dh<=h+0.5 and min(dw,dh)>=0.4*min(w,h),f'{name}: logo off screen or tiny {L}')
    check(abs((x+dw/2)-w/2)<2 and abs((y+dh/2)-h/2)<2,f'{name}: logo not centred {L}')
    check(hy>=y+dh and hy+hh<=h and L['hintTxt']=='Tap to start' and L['hintVis']=='visible',f'{name}: hint overlaps logo or off screen {L}')
    check(L['bg'] in('rgb(0, 0, 0)',),f'{name}: background not black {L}')
    check(top_is_splash(pg,w//2,h//2),f'{name}: splash not on top (rotate notice?)')
    tag=f'{w}x{h}';shot(pg,f'splash-before-tap-{tag}.png')
    pg.touchscreen.tap(w//2,h//2);pg.wait_for_timeout(700);check(ev(pg,'SOTA.splash.state()')=='show',f'{name}: tap ignored');shot(pg,f'splash-during-logo-{tag}.png')
    pg.wait_for_function('()=>SOTA.splash.state()==="done"',timeout=4000);check(not errs,f'{name}: errors {errs}');b.close()
def t_every_launch_and_installed(p):
  b,c=ctx(p,390,844,sw=True);errs=[];pg=load(c,errs)
  for _ in range(60):
    if ev(pg,'!!navigator.serviceWorker.controller'):break
    pg.wait_for_timeout(300)
  check(ev(pg,'!!navigator.serviceWorker.controller'),'worker never took over')
  check(ev(pg,'caches.keys()')==['sota-s1-v95'],'cache is not v95')
  got=ev(pg,'''(async()=>{const c=await caches.open("sota-s1-v95"),o={};for(const u of ["splash.js?v=1","art-intro/brand/logo3-neon-chosen-v1.jpg","art-intro/brand/logo-sound-3-neon-glow.mp3"]){const r=await c.match(u);if(!r){o[u]=null;continue}const d=await crypto.subtle.digest("SHA-256",await r.arrayBuffer());o[u]=[...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("")}return o})()''')
  check(got[IMG]=='66abe8d042db9d5883496066644a786306f60cde3032edd33e322178bcc482b3' and got[SND]=='50bec7765a5bb2206b9c6e9820e124b423fc89c1bf4153a1c138ec5dafc6877f' and got['splash.js?v=1'],f'precache {got}')
  for launch in range(2):
    if launch:c.set_offline(True)
    pg.reload();pg.wait_for_function('()=>window.SOTA&&SOTA.splash');check(ev(pg,'SOTA.splash.state()')=='wait' and top_is_splash(pg,195,422),f'launch {launch+2}: no splash')
    pg.touchscreen.tap(195,422);pg.wait_for_timeout(300);check(not ev(pg,'SOTA.splash.audio().paused'),f'launch {launch+2}: no logo sound')
    pg.wait_for_function('()=>SOTA.splash.state()==="done"',timeout=4000);check(ev(pg,'SOTA.intro.titleOpen()'),f'launch {launch+2}: no title after splash')
  # saved game: still the splash first, then the same title (hold to continue)
  c.set_offline(False);ev(pg,'SOTA.intro.shortTap()');pg.wait_for_timeout(200)
  check(not errs,f'errors {errs}');b.close()
TESTS=[t_order_and_timing,t_fits_phone_sizes,t_every_launch_and_installed]
if __name__=='__main__':
  ok=0;bad=[]
  with sync_playwright() as p:
    for t in TESTS:
      try:t(p);ok+=1;print('PASS',t.__name__,flush=True)
      except Exception as e:bad.append(t.__name__);print('FAIL',t.__name__,str(e)[:600],flush=True)
  print(f'{ok} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
