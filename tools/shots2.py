# Stage 2 phone-size screenshots (pretend phone: Playwright Chromium with touch). Walks by real commands.
import os,sys,json
sys.path.insert(0,os.path.dirname(__file__));import walk as W
from playwright.sync_api import sync_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else '/workspace/secret-adventures/stage2-shots';os.makedirs(OUT,exist_ok=True)
URL=os.environ.get('SOTA_URL','http://127.0.0.1:8765/index.html')
V=json.loads(open(os.path.join(os.path.dirname(__file__),'..','tools','views.json')).read()) if os.path.exists('tools/views.json') else None
def go(pg,cells):
  f=pg.evaluate('SOTA.state().f');cs,_=W.cmds(cells,f);pg.evaluate('SOTA.setAnim(false)')
  pg.evaluate('c=>c.forEach(k=>SOTA.act(k))',cs);pg.evaluate('SOTA.setAnim(true)')
with sync_playwright() as p:
  b=p.chromium.launch()
  def newpg(w,h):
    pg=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,service_workers='block').new_page();pg.goto(URL);pg.wait_for_function('window.SOTA');pg.evaluate('localStorage.clear();localStorage.setItem("sota.rooms",JSON.stringify({s:[...Array(85).keys()],c:[...Array(85).keys()]}))');pg.reload();pg.wait_for_function('window.SOTA');return pg
  r,camps,mons=W.zone1_tour()
  if os.environ.get('V2B'):
    for (w,h) in [(412,915),(915,412),(360,800)]:
      pg=newpg(w,h);go(pg,r[:40]);pg.evaluate('SOTA.map.open()');pg.wait_for_timeout(200);pg.screenshot(path=f'{OUT}/v2b-map-fit-short-{w}x{h}.png')
      pg.evaluate('SOTA.map.close()');go(pg,r[39:]);go(pg,W.path(r[-1],(15,50)));go(pg,W.path((15,50),(14,51)));go(pg,W.path((14,51),(17,53)))
      pg.evaluate('SOTA.map.open()');pg.wait_for_timeout(200);pg.screenshot(path=f'{OUT}/v2b-map-fit-zone1-{w}x{h}.png')
      if w==412:
        pg.evaluate('SOTA.map.close()');go(pg,W.path((17,53),(15,50)));pg.evaluate('SOTA.map.open()');pg.wait_for_timeout(200);pg.screenshot(path=f'{OUT}/v2b-map-player-on-camp-{w}x{h}.png')
        for _ in range(3):pg.click('#mzin')
        pg.wait_for_timeout(150);pg.screenshot(path=f'{OUT}/v2b-map-player-on-camp-zoomed-{w}x{h}.png')
        pg.mouse.move(150,450);pg.mouse.down();pg.mouse.move(260,380,steps=8);pg.mouse.up();pg.wait_for_timeout(150);pg.screenshot(path=f'{OUT}/v2b-map-zoomed-dragged-{w}x{h}.png')
        pg.evaluate('SOTA.map.close()');go(pg,W.path((15,50),(14,49)));pg.evaluate('SOTA.map.open()');pg.wait_for_timeout(200);pg.screenshot(path=f'{OUT}/v2b-map-player-on-tavern-{w}x{h}.png')
    b.close();print('done');sys.exit(0)
  pg=newpg(412,915);pg.wait_for_timeout(400);pg.screenshot(path=f'{OUT}/controls-zone1-start-412x915.png')
  r,camps,mons=W.zone1_tour()
  go(pg,r[:40]);pg.wait_for_timeout(300);pg.screenshot(path=f'{OUT}/controls-zone1-walked-412x915.png')
  pg.evaluate('SOTA.map.open()');pg.wait_for_timeout(200);pg.screenshot(path=f'{OUT}/map-small-explored-412x915.png')
  pg.evaluate('SOTA.map.close()');go(pg,r[39:]);go(pg,W.path(r[-1],(15,50)));go(pg,W.path((15,50),(14,51)));go(pg,W.path((14,51),(17,53)))
  pg.evaluate('SOTA.map.open()');pg.wait_for_timeout(200);pg.screenshot(path=f'{OUT}/map-zone1-tour-412x915.png')
  for _ in range(3):pg.click('#mzout')
  pg.wait_for_timeout(150);pg.screenshot(path=f'{OUT}/map-zone1-zoomed-out-412x915.png')
  for _ in range(6):pg.click('#mzin')
  pg.click('#mctr');pg.wait_for_timeout(150);pg.screenshot(path=f'{OUT}/map-zone1-zoomed-in-412x915.png')
  print(pg.evaluate('JSON.stringify(document.getElementById("map").dataset)'))
  pg.evaluate('SOTA.map.close()');pg.evaluate('SOTA.teleport(47,48,0)');pg.wait_for_timeout(300)
  pg.screenshot(path=f'{OUT}/controls-zone4-412x915.png')
  for (w,h) in [(915,412),(360,800)]:
    q=newpg(w,h);go(q,r);q.wait_for_timeout(300);q.screenshot(path=f'{OUT}/controls-zone1-{w}x{h}.png')
    q.evaluate('SOTA.map.open()');q.wait_for_timeout(200);q.screenshot(path=f'{OUT}/map-zone1-{w}x{h}.png')
  b.close()
print('done')
