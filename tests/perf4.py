"""Stage 4 frame times on a pretend phone (Playwright Chromium, no GPU, CPU throttle via CDP). Not a real phone."""
import statistics as st
from playwright.sync_api import sync_playwright
URL='http://127.0.0.1:8765/index.html'
with sync_playwright() as p:
  b=p.chromium.launch()
  for thr in[1,4]:
    c=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,service_workers='block');pg=c.new_page();c.new_cdp_session(pg).send('Emulation.setCPUThrottlingRate',{'rate':thr})
    pg.goto(URL);pg.wait_for_function('window.SOTA&&SOTA.rpg');pg.evaluate('SOTA.teleport(22,31,2)');pg.wait_for_timeout(400)
    r=sorted(pg.evaluate('SOTA.renderOnce()') for _ in range(60))
    pg.evaluate('SOTA.rpg.setLive({v:1,party:[RPG.makeCompanion(RPG.COMPANIONS[0],5),RPG.makeCompanion(RPG.COMPANIONS[1],5),RPG.makeCompanion(RPG.COMPANIONS[2],5)],gold:0,diff:"normal",seed:1})')
    pg.evaluate('SOTA.rpg.startFight([0,4,6].map(i=>RPG.makeMonster(3,i,5,0,"normal")))');pg.evaluate('window.__S4_MAGIC_HOLD=1');pg.wait_for_timeout(2500)
    f=sorted(pg.evaluate('SOTA.rpg.fightTimes()')[-100:])
    print(f'390x844 cpu x{thr}: walk spot render median {st.median(r):.1f} ms p95 {r[int(len(r)*.95)]:.1f} ms | fight draw (with magic burst) median {st.median(f):.1f} ms p95 {f[int(len(f)*.95)]:.1f} ms (n={len(f)})')
    c.close()
  b.close()
