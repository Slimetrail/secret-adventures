"""t2386u: the game now opens on the SlimeTrail logo splash, which waits for a tap. Older suites use this helper to get past it
the way a player does: one real tap on the splash, then wait for the 2 s logo + fade to finish. No skip flag, no game change."""
def pass_splash(pg,timeout=8000):
  try:pg.wait_for_function('()=>window.SOTA&&SOTA.splash',timeout=5000)
  except Exception:return False          # a tree without the splash (older copies): nothing to pass
  st=pg.evaluate('SOTA.splash.state()')
  if st=='done':return True
  if st=='wait':
    vp=pg.viewport_size or {'width':390,'height':844};x,y=vp['width']//2,vp['height']//2
    try:pg.touchscreen.tap(x,y)
    except Exception:pg.mouse.click(x,y)
  pg.wait_for_function('()=>SOTA.splash.state()==="done"',timeout=timeout);return True
