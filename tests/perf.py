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
# Stage 2: map draw time (open + pan) at 412x915, after walking the zone 1 tour
import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tools'));import walk as W
with sync_playwright() as p:
  b=p.chromium.launch()
  for thr in [1,4]:
    c=b.new_context(viewport={'width':412,'height':915},has_touch=True,is_mobile=True,service_workers='block');pg=c.new_page()
    c.new_cdp_session(pg).send('Emulation.setCPUThrottlingRate',{'rate':thr});pg.goto(URL);pg.wait_for_function('window.SOTA');pg.evaluate('localStorage.clear();localStorage.setItem("sota.rooms",JSON.stringify({s:[...Array(85).keys()],c:[...Array(85).keys()]}))');pg.reload();pg.wait_for_function('window.SOTA')
    r=[tuple(x) for x in W.MZ['main_route'][:300]];cs,_=W.cmds(r,0);pg.evaluate('SOTA.setAnim(false)');pg.evaluate('c=>c.forEach(k=>SOTA.act(k))',cs)
    t0=pg.evaluate('(()=>{const t=performance.now();SOTA.map.open();return performance.now()-t})()')
    d=[pg.evaluate('(()=>{const t=performance.now();SOTA.map.pan(0.3,0.2);return performance.now()-t})()') for _ in range(60)];d.sort()
    print(f'map 412x915 cpu x{thr}: {pg.evaluate("SOTA.visitedCount()")} cells, first open {t0:.1f} ms (makes parchment+layer), pan redraw median {st.median(d):.1f} ms, p95 {d[int(len(d)*.95)]:.1f} ms')
    c.close()
  b.close()
# Stage 3: 3D view looking at a locked (sealed) door, and each puzzle screen's redraw time, 412x915
with sync_playwright() as p:
  b=p.chromium.launch()
  for thr in [1,4]:
    c=b.new_context(viewport={'width':412,'height':915},has_touch=True,is_mobile=True,service_workers='block');pg=c.new_page()
    c.new_cdp_session(pg).send('Emulation.setCPUThrottlingRate',{'rate':thr});pg.goto(URL);pg.wait_for_function('window.SOTA');pg.evaluate('localStorage.clear()');pg.reload();pg.wait_for_function('window.SOTA')
    rm=pg.evaluate('MAZE.rooms[5]');st0=pg.evaluate('SOTA.state()');pa=W.path((st0['x'],st0['y']),tuple(rm['c']));a=pa[-2];d=W.D.index((pa[-1][0]-a[0],pa[-1][1]-a[1]))
    pg.evaluate('a=>SOTA.teleport(a[0],a[1],a[2])',[a[0],a[1],d]);pg.wait_for_timeout(300)
    r=sorted(pg.evaluate('SOTA.renderOnce()') for _ in range(60))
    print(f'3D facing locked door 412x915 cpu x{thr}: render median {st.median(r):.1f} ms, p95 {r[int(len(r)*.95)]:.1f} ms')
    for t in range(5):
      for z in (1,5):
        rid=pg.evaluate(f'MAZE.rooms.find(r=>r.p=={t}&&r.z=={z}).id');pg.evaluate(f'SOTA.puzzle.open({rid})')
        q=sorted(pg.evaluate('(()=>{const t=performance.now();SOTA.puzzle.renderOnce();document.body.offsetHeight;return performance.now()-t})()') for _ in range(30));pg.evaluate('SOTA.puzzle.close()')
        print(f'  puzzle type {t} zone {z} cpu x{thr}: redraw median {st.median(q):.1f} ms, p95 {q[int(len(q)*.95)]:.1f} ms')
    c.close()
  b.close()
