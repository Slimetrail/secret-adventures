"""t2522u / t2655u owner shop layout, trimmed: no tavern-hub layout changes.

 1 On every owner shop screen (main, Recipes, Food, Craft, Sell, tent), at 412x891,
   360x800 and 800x400 landscape: no tab overlaps the owner face box, and the owner is centred.
 2 The tavern MAIN screen DOM/CSS layout matches live de54926 (hub picture, buttons, dialogue rects).
 3 At 360 wide, 'Brannoc · Shop' (and the other owner names) sit on one line and do not run under Back.

Usage: python tests/t2509u_tavern_layout_browser_test.py [build_url] [live_url]
  live_url is required for the main-screen compare. Default build is http://127.0.0.1:8825/.
"""
import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BUILD=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
LIVE=sys.argv[2] if len(sys.argv)>2 else os.environ.get('LIVE_URL','')
if BUILD and not BUILD.endswith('/'): BUILD+='/'
if LIVE and not LIVE.endswith('/'): LIVE+='/'
sys.argv=[sys.argv[0],BUILD]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
SIZES=((412,891),(360,800),(800,400))
passed=failed=0
def run(name,f,*a):
  global passed,failed
  try:f(*a);passed+=1;print('PASS',name,flush=True)
  except Exception as e:failed+=1;print('FAIL',name,repr(e)[:800],flush=True)

def setup(p,w,h,url):
  b=p.chromium.launch()
  land=w>h
  c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=1,has_touch=True,is_mobile=not land,service_workers='block')
  c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}")
  pg=T.fresh(c,url=url)
  T.full_create(pg,'Leonidas','human','warrior')
  T.ev(pg,'(()=>{const L=SOTA.rpg.live();L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1),RPG.makeCompanion(RPG.COMPANIONS[1],1));L.gold=394;for(let i=0;i<4;i++)L.party[0].bag.push("i_egg","j_tooth");SOTA.rpg.s6.setSpeed(0);})()')
  return b,pg

def close_story(pg):
  for _ in range(30):
    if not T.ev(pg,'SOTA.storyOpen()'):return
    T.ev(pg,'(()=>{const b=document.querySelector("#s6d .s6btns button");(b||document.querySelector("#s6d .s6t")).dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))})()');pg.wait_for_timeout(120)
  T.check(False,'talk did not end')

SCREENS=(
  ('main','SOTA.rpg.s5.buyScreen({t},false)'),
  ('recipes','SOTA.rpg.s5.shopList({t},"recipes")'),
  ('food','SOTA.rpg.s5.shopList({t},"food")'),
  ('craft','SOTA.rpg.s5.shopList({t},"craft")'),
  ('sell','SOTA.rpg.s5.sellScreen({t})'),
  ('tent','SOTA.rpg.s5.tentScreen({t})'),
)

OVER='''f=>{const hit=(a,b)=>a.l<b.right-1&&a.r>b.left+1&&a.t<b.bottom-1&&a.b>b.top+1;
 const tabs=[...document.querySelectorAll("#s4 .s5shop .s5tabs button")].map(e=>{const r=e.getBoundingClientRect();return {t:e.textContent.trim(),left:r.left,right:r.right,top:r.top,bottom:r.bottom,h:r.height};});
 const out=[];
 for(const tab of tabs){if(hit(f.face,tab))out.push("face under tab "+tab.t);}
 const els=[...document.querySelectorAll("#s4 .s5shop .s4back,#s4 .s5shop .s4head,#s4 .s5shop .s5gold")];
 const d=document.getElementById("s6d");if(d&&d.classList.contains("on")){const box=d.querySelector(".s6box");if(box)els.push(box);}
 els.forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&hit(f.face,r))out.push("face under "+(e.className||e.tagName)+":"+(e.textContent||"").slice(0,16));});
 const on=q=>q&&q.l>=-1&&q.r<=innerWidth+1&&q.t>=-1&&q.b<=innerHeight+1;
 const cx=(f.face.l+f.face.r)/2, area=f.area, mid=area?((area.l+area.r)/2):innerWidth/2;
 const low=!tabs.length||tabs.every(r=>r.top>=innerHeight*0.62&&r.bottom<=innerHeight+1);
 return {out,tabs,low,cx,mid,on:on(f.face),bodyOn:on(f.body||f.face),W:innerWidth,H:innerHeight,land:innerWidth>innerHeight};}'''

def t_shop_faces(p,w,h):
  b,pg=setup(p,w,h,BUILD)
  for t in range(4):
    for name,js in SCREENS:
      T.ev(pg,'SOTA.rpg.closeUI()');T.ev(pg,f'SOTA.teleport(...MAZE.taverns[{t}],0)');T.ev(pg,js.format(t=t));pg.wait_for_timeout(280)
      f=T.ev(pg,'SOTA.rpg.frameScenes()');T.check(f and f['owner']==t,f'owner {t+1} {name}: no owner frame {f}')
      o=T.ev(pg,OVER,f);lab=f'owner {t+1} {name} {w}x{h}'
      T.check(o['on'],f'{lab}: face off screen {f}')
      tab_hits=[x for x in o['out'] if x.startswith('face under tab')]
      T.check(not tab_hits,f'{lab}: tab overlaps the owner face {tab_hits} face={f["face"]} tabs={o["tabs"]}')
      T.check(not o['out'],f'{lab}: face under UI {o["out"][:4]} face={f["face"]}')
      if o['land']:
        T.check(abs(o['cx']-o['mid'])<=max(48,0.14*w),f'{lab}: owner not centred in free area (face {o["cx"]:.0f} mid {o["mid"]:.0f})')
      else:
        T.check(abs(o['cx']-w/2)<=0.12*w,f'{lab}: owner not centred (face centre {o["cx"]:.0f} of {w})')
      if name=='main':
        T.check(o['tabs'] and o['low'],f'{lab}: shop tabs are not in a bottom row {o["tabs"]}')
  b.close()

def t_name_wrap(p):
  w,h=360,800
  b,pg=setup(p,w,h,BUILD)
  rows=[]
  for t in range(4):
    T.ev(pg,'SOTA.rpg.closeUI()');T.ev(pg,f'SOTA.rpg.s5.buyScreen({t},false)');pg.wait_for_timeout(250)
    a=T.ev(pg,'''()=>{const t=document.querySelector("#s4 .s5shop .s4title"),b=document.querySelector("#s4 .s5shop .s4back");
      const tr=t.getBoundingClientRect(),br=b.getBoundingClientRect(),cs=getComputedStyle(t);
      const overlap=tr.left<br.right-1&&tr.right>br.left+1&&tr.top<br.bottom-1&&tr.bottom>br.top+1;
      return {text:t.textContent.trim(),lines:t.getClientRects().length,th:tr.height,lh:parseFloat(cs.lineHeight)||parseFloat(cs.fontSize),
              tw:tr.width,l:tr.left,r:tr.right,nowrap:cs.whiteSpace,overlap,back:[br.left,br.top,br.right,br.bottom]};}''')
    rows.append(a)
    T.check(a['lines']==1,f'{a["text"]} wraps to {a["lines"]} lines at 360: {a}')
    T.check(a['th']<=a['lh']*1.45+2,f'{a["text"]} box is taller than one line {a}')
    T.check(not a['overlap'],f'{a["text"]} runs under Back {a}')
  T.check(any(r['text']=='Brannoc · Shop' for r in rows),f'Brannoc · Shop not found {rows}')
  b.close()

HUB='''()=>{const box=e=>{if(!e)return null;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
  return {l:Math.round(r.left),t:Math.round(r.top),r:Math.round(r.right),b:Math.round(r.bottom),w:Math.round(r.width),h:Math.round(r.height),
          vis:cs.visibility,pos:cs.position,disp:cs.display,bg:cs.backgroundSize,bp:cs.backgroundPosition,pe:cs.pointerEvents};};
 const hub=document.querySelector("#s4 .s5hub"),head=document.querySelector("#s4 .s5hub .s4head"),nav=document.querySelector("#s4 .s5hubnav");
 const after=hub?getComputedStyle(hub,"::after"):null,before=hub?getComputedStyle(hub,"::before"):null;
 const d=document.getElementById("s6d"),on=!!(d&&d.classList.contains("on"));
 const bg=on&&d.querySelector(".s6bg"),bx=on&&d.querySelector(".s6box");
 return {hub:box(hub),head:box(head),nav:box(nav),
  btns:[...document.querySelectorAll("#s4 .s5hubnav button")].map(e=>({t:e.textContent.trim(),...box(e)})),
  after:after&&{disp:after.display,size:after.backgroundSize,pos:after.backgroundPosition,filter:after.filter},
  before:before&&{disp:before.display,size:before.backgroundSize,filter:before.filter},
  tavpic:!!document.querySelector("#s4 .s5tavpic"),
  talk:{on:on,bg:box(bg),box:box(bx)},
  W:innerWidth,H:innerHeight};}'''

def _diff(a,b,path=''):
  out=[]
  if type(a)!=type(b) and not (isinstance(a,(int,float)) and isinstance(b,(int,float))):
    return [f'{path}: type {a!r} vs {b!r}']
  if isinstance(a,dict):
    keys=set(a)|set(b)
    for k in sorted(keys,key=str):
      if k not in a: out.append(f'{path}.{k} missing in build')
      elif k not in b: out.append(f'{path}.{k} missing in live')
      else: out+=_diff(a[k],b[k],f'{path}.{k}')
    return out
  if isinstance(a,list):
    if len(a)!=len(b): return [f'{path}: len {len(a)} vs {len(b)}']
    for i,(x,y) in enumerate(zip(a,b)): out+=_diff(x,y,f'{path}[{i}]')
    return out
  if isinstance(a,(int,float)) and isinstance(b,(int,float)):
    if abs(a-b)>1: out.append(f'{path}: {a} vs {b}')
    return out
  if a!=b: out.append(f'{path}: {a!r} vs {b!r}')
  return out

def t_hub_matches_live(p,w,h):
  T.check(LIVE,f'live url missing; pass it as argv[2] (opened build {BUILD})')
  bb,bpg=setup(p,w,h,BUILD)
  lb,lpg=setup(p,w,h,LIVE)
  try:
    n=T.ev(bpg,'MAZE.taverns.length')
    T.check(n==T.ev(lpg,'MAZE.taverns.length'),'tavern count differs')
    for t in range(n):
      for phase in ('idle','talk'):
        for pg in (bpg,lpg):
          T.ev(pg,'SOTA.rpg.closeUI()');T.ev(pg,f'SOTA.teleport(...MAZE.taverns[{t}],0);SOTA.rpg.s5.tavernScreen({t},false)');pg.wait_for_timeout(280)
          if phase=='talk':
            T.ev(pg,f'SOTA.rpg.s6.play("keeper",[["K{min(t,3)+1}","calm","Well now, look who walked in."]],{{bg:SOTA.rpg.s5.tavernBg({t})}})');pg.wait_for_timeout(500)
        B=T.ev(bpg,HUB);L=T.ev(lpg,HUB)
        T.check(B['tavpic'] is False and L['tavpic'] is False,f'tavern {t+1} {phase}: unexpected s5tavpic build={B["tavpic"]} live={L["tavpic"]}')
        d=_diff(B,L,'hub')
        T.check(not d,f'tavern {t+1} {phase} {w}x{h}: main screen layout differs from live: {d[:8]}')
        if phase=='talk':
          close_story(bpg);close_story(lpg)
  finally:
    bb.close();lb.close()

with sync_playwright() as p:
  for w,h in SIZES:
    run(f'{w}x{h} shop: no tab over face, owner centred, on every shop screen',t_shop_faces,p,w,h)
    run(f'{w}x{h} tavern MAIN screen matches live de54926 (picture, buttons, dialogue)',t_hub_matches_live,p,w,h)
  run('360px owner-name wrap: Brannoc · Shop stays on one line',t_name_wrap,p)
print(f'{passed} passed, {failed} failed');print('page errors:',T.ERRS[:5]);sys.exit(1 if failed or T.ERRS else 0)
