"""Isolated headless local regression fixtures (never the user's desktop browser).
Usage: python3 tests/dialogue_art_browser_tests.py http://127.0.0.1:<temporary-port>/
"""
import splash_helper as SPL  # t2386u logo splash: tap past it like a player
import sys,json,pathlib,time
import batch1_browser_tests as B1
import batch2_browser_tests as B2
import batch3_browser_tests as B3
import stage6_tests as S6
from stage6_tests import ev,check
from playwright.sync_api import sync_playwright
DATA=json.loads(pathlib.Path('/workspace/secret-adventures/game-export/t2076u-dialogue-art/manifest.json').read_text())['lines']
OUT=pathlib.Path('/workspace/secret-adventures/game-export/t2076u-wire');OUT.mkdir(exist_ok=True)

def inspect(pg,host,l):
 pg.wait_for_function('([host,key])=>document.querySelector(host+" .da-stage")?.dataset.frame===key',arg=[host,l['talkId']+':'+str(l['line']-1)])
 pg.wait_for_function('(host)=>Array.from(document.querySelectorAll(host+" .da-person img")).every(i=>i.complete&&i.naturalWidth===1024)',arg=host)
 result=ev(pg,'''(()=>{const h=document.querySelector('''+json.dumps(host)+'''),p=[...h.querySelectorAll('.da-person')];return {sides:p.map(x=>x.dataset.character),src:p.map(x=>x.querySelector('img').getAttribute('src')),bg:h.querySelector('.da-stage').style.backgroundImage,hidden:h.querySelector('.s6pf')?getComputedStyle(h.querySelector('.s6pf')).display==='none':true,box:(()=>{const b=h.querySelector('.s6t,#dvbox').getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight})()};})()''')
 check(result['sides']==[l['left'],l['right']],'sides '+str(l))
 check(result['src']==['art-dialogue/'+l['portraits'][l[s]] for s in ['left','right']],'portraits')
 check('art-dialogue/'+l['backdrop'] in result['bg'],'backdrop')
 check(result['hidden'] and result['box'],'third face or offscreen text '+str(result))

def t_all_frames_and_screenshots(p):
 b,c,pg=B1.setup(p);errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
 for viewport,label in [({'width':1280,'height':720},'landscape'),({'width':390,'height':844},'portrait')]:
  pg.set_viewport_size(viewport)
  for id in ['painting','tavern','closecall']:
   ev(pg,'SampleTalks.open('+json.dumps(id)+')')
   for l in [x for x in DATA if x['talkId']==id]:
    inspect(pg,'#dv',l);check(pg.locator('#dvl').inner_text()=='“'+l['lineText']+'”','sample text')
    if (id,l['line']) in [('painting',1),('tavern',1),('closecall',3)]:pg.screenshot(path=str(OUT/(id+'-l'+str(l['line'])+'-'+label+'.png')))
    if pg.locator('#dvgo').count():pg.locator('#dvgo').click()
   ev(pg,'SampleTalks.picker()');check(pg.locator('#dv .da-person').count()==0,'picker art leaked');ev(pg,'SampleTalks.close()')
  for id in ['C'+str(i) for i in range(1,7)]+['A'+str(i) for i in range(1,7)]:
   ev(pg,'batchReset("QSA",'+json.dumps(id)+');SOTA.rpg.s6.setSpeed(0)')
   if id=='C4':ev(pg,'SOTA.rpg.s6.st().lastMeal="cooked"')
   if id=='C5':ev(pg,'SOTA.rpg.live().party[0].hp=1')
   ev(pg,'S6H.camp(0)' if id[0]=='C' else 'S6H.fightContinue([{hp:'+('0' if id=='A1' else '100')+',maxHp:100}])')
   for l in [x for x in DATA if x['talkId']==id]:
    pg.wait_for_function('()=>!SOTA.rpg.s6.line().typing');inspect(pg,'#s6d',l)
    check(pg.locator('#s6d .s6t').inner_text()==l['lineText'],'batch text')
    if (id,l['line']) in [('C1',1),('C3',2),('C5',4),('A1',1),('A6',4)]:pg.screenshot(path=str(OUT/(id+'-l'+str(l['line'])+'-'+label+'.png')))
    S6.tapbox(pg)
   pg.wait_for_function('()=>!SOTA.rpg.s6.open()');check(pg.locator('#s6d .da-stage').count()==0,'closed art leaked')
 check(not errors,str(errors));b.close()

def t_later_batches_unchanged(p):
 b,c,pg=B3.setup(p)
 for id in ['C7','A7','T1','T7']:
  ev(pg,'reset2('+json.dumps(id)+')')
  if id[0]=='C':ev(pg,'S6H.camp(0)')
  elif id[0]=='A':ev(pg,'S6H.fightContinue([{hp:100,maxHp:100}])')
  elif id=='T1':ev(pg,'SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.s5.tavernScreen(0)')
  else:ev(pg,'S6H.craft("food",0)')
  pg.wait_for_timeout(30);check(pg.locator('#s6d .da-stage').count()==0,'invented art '+id);check(B1.collect(pg)==B2.TALKS[id],id+' text')
 for id in ['C14','A13','T11','T15']:
  ev(pg,'reset3('+json.dumps(id)+')');B3.trigger(pg,id);pg.wait_for_timeout(30)
  check(pg.locator('#s6d .da-stage').count()==0,'invented art '+id);check(B1.collect(pg)==B3.TALKS[id],id+' text')
 b.close()

def t_offline_v23(p):
 b,c=S6.ctx(p,sw=True);pg=c.new_page();pg.goto(S6.S4.BASE+'index.html');pg.wait_for_function('()=>!!navigator.serviceWorker.controller',timeout=90000);SPL.pass_splash(pg)
 check(ev(pg,'(async()=>{const c=await caches.open("sota-s1-v24");return (await c.keys()).length})()')==282,'incomplete cache')
 assets=sorted({'art-dialogue/'+f for l in DATA for f in [*l['portraits'].values(),l['backdrop']]})
 check(ev(pg,'(async()=>{const c=await caches.open("sota-s1-v24");return (await Promise.all('+json.dumps(assets)+'.map(p=>c.match(p)))).every(Boolean)})()'),'missing cached dialogue art')
 c.set_offline(True);pg.reload();pg.wait_for_function('()=>window.SampleTalks&&window.DialogueArt');SPL.pass_splash(pg)
 for id,line in [('closecall',3),('C5',4),('A6',4)]:
  for l in [x for x in DATA if x['talkId']==id]:
   if id=='closecall':
    if l['line']==1:ev(pg,'SampleTalks.open("closecall")')
    elif l['line']>1:pg.locator('#dvgo').click()
    inspect(pg,'#dv',l)
   else:
    # Directly render every cached pair without adding a new runtime preview entry.
    ev(pg,'DialogueArt.render(document.getElementById("dv"),'+json.dumps(id)+','+str(l['line']-1)+')');inspect(pg,'#dv',l)
 b.close()

if __name__=='__main__':
 S6.S4.BASE=sys.argv[1];bad=[]
 with sync_playwright() as p:
  for test in [t_all_frames_and_screenshots,t_later_batches_unchanged,t_offline_v23]:
   start=time.time()
   try:test(p);print('PASS',test.__name__,round(time.time()-start,1),flush=True)
   except Exception as e:bad.append(test.__name__);print('FAIL',test.__name__,str(e),flush=True)
 print(str(3-len(bad))+'/3 PASS',flush=True);sys.exit(bool(bad))
