# Phone-size screenshots of the 3D view per zone (pretend phone: Playwright Chromium with touch).
import json,subprocess,os,sys
from playwright.sync_api import sync_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else '/workspace/secret-adventures/stage1-shots';os.makedirs(OUT,exist_ok=True)
V=json.loads(subprocess.check_output([sys.executable.replace('/.pwvenv/bin/python','/../usr/bin/python3') if False else 'python3','tools/find-views.py']))
URL=os.environ.get('SOTA_URL','http://127.0.0.1:8765/index.html')
with sync_playwright() as p:
  b=p.chromium.launch()
  for (w,h,tag) in [(412,915,'portrait'),(915,412,'landscape')]:
    pg=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,device_scale_factor=1,service_workers='block').new_page()
    pg.goto(URL);pg.wait_for_function('window.SOTA')
    for z,vs in V.items():
      kinds=['long','corner','corridor'] if tag=='portrait' else ['long']
      for k in kinds:
        (x,y),f=vs[k][0],vs[k][1]
        pg.evaluate(f'SOTA.teleport({x},{y},{f})');pg.wait_for_timeout(250)
        pg.screenshot(path=f'{OUT}/zone{z}-{k}-{tag}-{w}x{h}.png')
  b.close()
print('done')
