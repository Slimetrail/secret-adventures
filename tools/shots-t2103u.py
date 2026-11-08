"""t2103u frames: title-only menu and cave intro (local server). Usage: python3 tools/shots-t2103u.py [base]"""
import sys
from playwright.sync_api import sync_playwright
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8911/').rstrip('/')+'/'
OUT='/workspace/secret-adventures/game-export/t2103u/frames/'
def ready(pg):pg.wait_for_function('[...document.images].every(i=>i.complete)');pg.wait_for_timeout(400)
with sync_playwright() as p:
  b=p.chromium.launch();c=b.new_context(viewport={'width':412,'height':915},device_scale_factor=2,has_touch=True,is_mobile=True,service_workers='block')
  pg=c.new_page();pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA&&SOTA.intro&&SOTA.intro.titleOpen()')
  pg.evaluate('new Promise(r=>{const i=new Image();i.onload=r;i.src="art-intro/menu/title-wall.webp"})');ready(pg)
  assert pg.evaluate('document.getElementById("ititle").dataset.art')=='ready'
  pg.screenshot(path=OUT+'01-starting-title.png');print(OUT+'01-starting-title.png')
  for race,cls,name in [('human','warrior','Wes'),('cat','mage','Miri'),('dwarf','archer','Borin'),('elf','rogue','Ael')]:
    pg.evaluate('localStorage.clear()');pg.reload();pg.wait_for_function('SOTA.intro.titleOpen()');pg.evaluate('SOTA.intro.shortTap()')
    pg.evaluate('''([n,r,c])=>{const q=s=>document.querySelector(s);const i=q('#ccname');i.value=n;i.dispatchEvent(new Event('input'));q('[data-race='+r+']').click();q('[data-cls='+c+']').click();q('[data-skill]').click();}''',[name,race,cls]);pg.evaluate('document.getElementById("ccgo").click()')
    if pg.evaluate('SOTA.rpg.ui()')=='create':pg.evaluate('document.getElementById("ccgo").click()')
    pg.evaluate('SOTA.rpg.s6.setSpeed(0)')
    for i in range(60):
      if pg.evaluate('SOTA.intro.caveOpen()'):break
      pg.keyboard.press('Enter');pg.wait_for_timeout(60)
    assert pg.evaluate('document.getElementById("icave").dataset.artReady')=='1';ready(pg)
    f=OUT+f'03-cave-intro-{race}-{cls}.png';pg.screenshot(path=f);print(f)
  b.close()
