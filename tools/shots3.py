"""Stage 3 screenshots (pretend phone). Puzzles are solved by tapping the solver's moves."""
import sys,os,json
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tests'));sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
sys.argv=[sys.argv[0]]
import stage3_tests as T
from playwright.sync_api import sync_playwright
OUT='/workspace/secret-adventures/stage3-shots/'
with sync_playwright() as p:
  for (w,h),zs in [((412,915),(1,3,5)),((360,800),(5,)),((915,412),(2,5))]:
    b,c=T.ctx(p,w,h);pg=T.page(c);tag=f'{w}x{h}'
    for t in range(5):
      for z in zs:
        r=next(x for x in T.R(pg) if x['p']==t and x['z']==z);T.approach(pg,r)
        if t==0 and z==zs[0]:
          pg.evaluate('SOTA.act("back")');pg.wait_for_timeout(250);pg.screenshot(path=OUT+f'{tag}-3d-locked-door.png');T.approach(pg,r)
        T.tap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(150);pg.screenshot(path=OUT+f'{tag}-type{t}-z{z}-before.png')
        T.tap_moves(pg,t,T.moves(r['id']));pg.wait_for_timeout(450);pg.screenshot(path=OUT+f'{tag}-type{t}-z{z}-solved.png')
        T.tap(pg,'#penter');pg.wait_for_timeout(150)
        if t==0 and z==zs[0]:pg.screenshot(path=OUT+f'{tag}-placeholder.png')
        T.tap(pg,'#pgo')
        if t==0 and z==zs[0]:
          T.tap(pg,'[data-cmd=back]');T.tap(pg,'[data-cmd=back]');pg.wait_for_timeout(250);pg.screenshot(path=OUT+f'{tag}-3d-open-doorway.png')
    # map: zone 1 tour visited, every other zone 1 room solved
    import walk as W
    sv=[x['id'] for x in T.R(pg) if x['z']==1][::2];pg.evaluate('s=>{localStorage.clear();localStorage.setItem("sota.rooms",JSON.stringify({s,c:s}))}',sv);pg.reload();pg.wait_for_function('window.SOTA')
    tour,_,_=W.zone1_tour();pg.evaluate('cs=>cs.forEach(c=>SOTA.teleport(c[0],c[1],0))',[list(x) for x in tour])
    z1=[x for x in T.R(pg) if x['z']==1 and abs(x['c'][0]-tour[-1][0])+abs(x['c'][1]-tour[-1][1])<16]
    for x in z1:pg.evaluate('cs=>cs.forEach(c=>SOTA.teleport(c[0],c[1],0))',[list(q) for q in W.path(tuple(tour[-1]),tuple(x['c']))])
    pg.evaluate('c=>SOTA.teleport(c[0],c[1],0)',list(tour[-1]))
    pg.evaluate('SOTA.map.open()');pg.wait_for_timeout(300);pg.screenshot(path=OUT+f'{tag}-map-solved-locked.png');print(tag,pg.evaluate('Object.assign({},document.getElementById("map").dataset)'))
    b.close()
