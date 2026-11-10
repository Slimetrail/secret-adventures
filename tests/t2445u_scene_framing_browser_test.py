"""t2445u/t2452u/t2453u/t2454u scene framing, portrait 360x640, 390x844 and 1080x2340 (+ landscape 844x390 for the story scenes).
 1 story scenes with a picture (camp scene, tavern owner greeting over the tavern hub): the picture is shown whole (contain, never cover),
   so no character is cut off, and its bottom edge reaches the top of the dialogue box (no empty band above the box)
 2 dialogue-art people (two companions) are fully on screen in portrait
 3 camp/tavern screens: the picture uses the contain fit with a blurred copy behind (no cover crop)
 4 every tavern owner shop screen (main and 'Have a look at my stock'): the owner's face box is fully on screen and overlaps no tab,
   the Back button, the header, the gold line, the party inset or the dialogue box; tabs stay at least 44 px tall
Usage: python tests/t2445u_scene_framing_browser_test.py [base_url]"""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
passed=failed=0
def run(name,f,*a):
  global passed,failed
  try:f(*a);passed+=1;print('PASS',name,flush=True)
  except Exception as e:failed+=1;print('FAIL',name,repr(e)[:500],flush=True)
def setup(p,w,h,d=1):
  W0,H0=(w,h) if w<h else (h,w)  # make the hero on a portrait phone, then turn it
  b=p.chromium.launch();c=b.new_context(viewport={'width':W0,'height':H0},device_scale_factor=d,has_touch=True,is_mobile=w<h,service_workers='block')
  c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}");pg=T.fresh(c);T.full_create(pg,'Leonidas','human','warrior')
  T.ev(pg,'(()=>{const L=SOTA.rpg.live();L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1),RPG.makeCompanion(RPG.COMPANIONS[1],1));})()')
  if (W0,H0)!=(w,h):pg.set_viewport_size({'width':w,'height':h});pg.wait_for_timeout(200)
  return b,pg
ART='''async()=>{const d=document.getElementById("s6d"),bg=d.querySelector(".s6bg"),box=d.querySelector(".s6box"),cs=getComputedStyle(bg,"::after");
 const url=(getComputedStyle(bg).backgroundImage.match(/url\\("?([^")]+)"?\\)/)||[])[1];if(!url)return {err:"no picture"};
 const im=new Image();im.src=url;await im.decode();const r=bg.getBoundingClientRect(),ar=im.naturalHeight/im.naturalWidth;
 let w=r.width,h=w*ar;if(h>r.height){h=r.height;w=h/ar;}const l=r.left+(r.width-w)/2,t=r.bottom-h;
 return {size:cs.backgroundSize,pos:cs.backgroundPosition,art:{l,t,r:l+w,b:t+h},box:box.getBoundingClientRect().top,W:innerWidth,H:innerHeight,band:t-r.top}}'''
def story_scene(pg,kind):
  T.ev(pg,'SOTA.rpg.closeUI()')
  if kind=='camp':T.ev(pg,'SOTA.teleport(...MAZE.camps[0],0)');T.ev(pg,'SOTA.rpg.s6.play("camp",[["H","calm","Fire’s going. That’s enough for now."]],{bg:SOTA.rpg.s5.campBg({speaker:"Any",id:"24"})})')
  else:T.ev(pg,'SOTA.teleport(...MAZE.taverns[0],0)');T.ev(pg,'SOTA.rpg.s5.tavernScreen(0,false)');T.ev(pg,'SOTA.rpg.s6.play("keeper",[["K1","calm","Well now, look who walked in. Good to have you."]],{bg:SOTA.rpg.s5.tavernBg(0)})')
  pg.wait_for_timeout(700);a=pg.evaluate(ART);T.check('err' not in a,str(a))
  T.check(a['size']=='contain',f'{kind}: picture not contain-fitted: {a["size"]}')
  T.check(a['art']['l']>=-1 and a['art']['r']<=a['W']+1 and a['art']['t']>=-1,f'{kind}: picture cut at the screen edge {a}')
  T.check(abs(a['art']['b']-a['box'])<=12,f'{kind}: picture does not reach the dialogue box {a}')
  return a
def close_story(pg):
  for _ in range(15):
    if not T.ev(pg,'SOTA.storyOpen()'):return
    T.ev(pg,'(()=>{const b=document.querySelector("#s6d .s6btns button");if(b)b.click();else document.querySelector("#s6d .s6t").click()})()');pg.wait_for_timeout(150)
def t_story(p,w,h):
  b,pg=setup(p,w,h)
  for k in ('camp','tavern'):
    b2,pg2=setup(p,w,h) if k=='tavern' else (None,pg)
    story_scene(pg2,k)
    if b2:b2.close()
  b.close()
def t_people(p,w,h):
  b,pg=setup(p,w,h);T.ev(pg,'SOTA.rpg.s6.play("camp",[["Q","calm","We should rest while we can."]],{bg:"art-dialogue/C1/backdrop.webp"})');pg.wait_for_timeout(800)
  r=T.ev(pg,'[...document.querySelectorAll("#s6d .da-person")].map(e=>{const r=e.getBoundingClientRect();return [r.left,r.right,r.top]})')
  T.check(len(r)>=1,'no dialogue-art people drawn');T.check(all(x[0]>=-1 and x[1]<=w+1 for x in r),f'a person is cut at the edge {r}');b.close()
def t_screens(p,w,h):
  b,pg=setup(p,w,h)
  for js in ('SOTA.teleport(...MAZE.camps[0],0);SOTA.rpg.s5.campScreen(0)','SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.tavernScreen(0,false)'):
    T.ev(pg,'SOTA.rpg.closeUI()');T.ev(pg,'(()=>{'+js+'})()');pg.wait_for_timeout(200)
    s=T.ev(pg,'(()=>{const e=document.querySelector("#s4 .s5scene");return [getComputedStyle(e,"::after").backgroundSize,getComputedStyle(e,"::before").filter,getComputedStyle(e).backgroundSize]})()')
    T.check(s[0]=='contain' and 'blur' in s[1] and s[2].startswith('0px'),f'{js}: screen picture not contain + blurred fill {s}')
  b.close()
OVER='''f=>{const hit=(a,b)=>a.l<b.right-1&&a.r>b.left+1&&a.t<b.bottom-1&&a.b>b.top+1;const out=[];
 const els=[...document.querySelectorAll("#s4 .s5shop .s5tabs button,#s4 .s5shop .s4back,#s4 .s5shop .s4head,#s4 .s5shop .s5gold")];
 const d=document.getElementById("s6d");if(d&&d.classList.contains("on"))els.push(d.querySelector(".s6box"));
 els.forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&hit(f.face,r))out.push((e.className||e.tagName)+":"+(e.textContent||"").slice(0,12));});
 if(f.inset&&hit(f.face,{left:f.inset.l,right:f.inset.r,top:f.inset.t,bottom:f.inset.b}))out.push("party inset");
 const small=[...document.querySelectorAll("#s4 .s5shop .s5tabs button,#s4 .s5shop .s4back")].filter(e=>e.getBoundingClientRect().height<44).length;
 const insetEl=d&&d.classList.contains("on")?d.querySelector(".s6bg").getBoundingClientRect():null;
 return {out,small,on:f.face.l>=-1&&f.face.r<=innerWidth+1&&f.face.t>=-1&&f.face.b<=innerHeight+1,insetEl:insetEl&&[insetEl.left,insetEl.top,insetEl.width,insetEl.height]}}'''
def t_owners(p,w,h):
  b,pg=setup(p,w,h)
  for t in range(4):
    T.ev(pg,'SOTA.rpg.closeUI()');T.ev(pg,f'SOTA.teleport(...MAZE.taverns[{t}],0)');T.ev(pg,f'SOTA.rpg.s5.buyScreen({t})');pg.wait_for_timeout(300)
    for phase in ('main','talk'):
      if phase=='talk':T.ev(pg,f'SOTA.rpg.s6.play("keeper",[["K{t+1}","calm","Have a look at my stock. Take your time."]],{{bg:SOTA.rpg.s5.tavernBg({t})}})');pg.wait_for_timeout(700)
      f=T.ev(pg,'SOTA.rpg.frameScenes()');T.check(f and f['owner']==t,f'no owner frame for tavern {t+1} {f}')
      o=T.ev(pg,OVER,f);T.check(o['on'],f'tavern {t+1} {phase}: face off screen {f}');T.check(not o['out'],f'tavern {t+1} {phase}: face under {o["out"]} face={f["face"]}');T.check(o['small']==0,'a tab under 44 px')
      if phase=='talk':
        ie=o['insetEl'];T.check(ie and abs(ie[3]/ie[2]-387/720)<0.03,f'party inset is cropped or squashed {ie}')
    close_story(pg)
  b.close()
with sync_playwright() as p:
  for w,h in ((360,640),(390,844),(1080,2340)):
    run(f'{w}x{h} story scenes whole and down to the dialogue box',t_story,p,w,h)
    run(f'{w}x{h} dialogue-art people on screen',t_people,p,w,h)
    run(f'{w}x{h} camp/tavern screens contain + blurred fill',t_screens,p,w,h)
    run(f'{w}x{h} every tavern owner face clear (main + talk)',t_owners,p,w,h)
  run('844x390 landscape story scenes',t_story,p,844,390)
print(f'{passed} passed, {failed} failed');print('page errors:',T.ERRS[:5]);sys.exit(1 if failed or T.ERRS else 0)
