"""Frame time on a pretend phone (Playwright Chromium, no GPU, optional CPU throttle via CDP). Not a real phone."""
import json,statistics as st
from playwright.sync_api import sync_playwright
URL='http://127.0.0.1:8765/index.html'
with sync_playwright() as p:
  b=p.chromium.launch()
  for w,h in [(360,800),(412,915),(915,412)]:
    for thr in [1,4]:
      c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,service_workers='block');pg=c.new_page()
      cdp=c.new_cdp_session(pg);cdp.send('Emulation.setCPUThrottlingRate',{'rate':thr})
      pg.goto(URL);pg.wait_for_function('window.SOTA');pg.evaluate('SOTA.teleport(22,31,2)');pg.wait_for_timeout(500)
      r=[pg.evaluate('SOTA.renderOnce()') for _ in range(60)]
      # rAF intervals while turning continuously
      iv=pg.evaluate('''new Promise(res=>{const t=[];let n=0;function f(x){t.push(x);if(n%10===0)SOTA.act("right");if(++n<120)requestAnimationFrame(f);else res(t.slice(1).map((v,i)=>v-t[i]));}requestAnimationFrame(f);})''')
      r.sort();iv.sort()
      print(f'{w}x{h} cpu-throttle x{thr} internal {pg.evaluate("SOTA.size()")}: render median {st.median(r):.1f} ms, p95 {r[int(len(r)*.95)]:.1f} ms; frame interval median {st.median(iv):.1f} ms, p95 {iv[int(len(iv)*.95)]:.1f} ms (~{1000/st.median(iv):.0f} fps)')
      c.close()
  b.close()
