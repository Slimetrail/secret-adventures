"""Headless functional/layout checks only; never takes screenshots or logs puzzle internals."""
import splash_helper as SPL  # t2386u logo splash: tap past it like a player
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
results=[]
def check(value,name):
 if not value:raise AssertionError(name)
 results.append('PASS '+name)
with sync_playwright() as p:
 browser=p.chromium.launch()
 for width,height in [(320,568),(360,800),(390,844),(844,390)]:
  context=browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,service_workers='block');page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:19864/');page.wait_for_function('window.SOTA&&SOTA.puzzle&&window.PUZ');SPL.pass_splash(page);page.evaluate('SOTA.intro&&SOTA.intro.hideTitle()')
  for zone in range(1,6):
   result=page.evaluate('''z=>{const room=MAZE.rooms.find(r=>r.p===2&&r.z===z);SOTA.openPuzzle(room.id);const g=PUZ.forRoom(room),before=SOTA.puzzle.state();const mode=document.getElementById('puz').dataset.mode;const moves=mode==='pipes'?PUZ.solvePipes(g.pz,g.s):PUZ.solveSudoku(g.pz,g.s);const first=mode==='pipes'?document.querySelector('#pboard [data-mv]'):document.querySelector('#pboard [data-cell]:not([disabled])');first.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));if(mode==='sudoku'){const key=document.querySelector('#pboard [data-value="1"]');key.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));}document.getElementById('preset').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));const grid=document.querySelector('#pboard .pgrid').getBoundingClientRect(),fits=grid.left>=0&&grid.right<=innerWidth+1;for(const mv of moves){if(mode==='pipes'){document.querySelector('#pboard [data-mv="'+mv+'"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));}else{document.querySelector('#pboard [data-cell="'+mv[0]+'"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));document.querySelector('#pboard [data-value="'+mv[1]+'"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));}}const solved=SOTA.puzzle.state().solved,enter=document.getElementById('penter');enter.scrollIntoView();const r=enter.getBoundingClientRect(),reachable=r.top>=0&&r.bottom<=innerHeight+1;SOTA.puzzle.close();SOTA.openPuzzle(room.id);const retained=SOTA.puzzle.state().solved;SOTA.puzzle.close();return {mode,fits,solved,reachable,retained,unsolved:!before.solved};}''',zone)
   check(result['mode']==('pipes' if zone<=2 else 'sudoku'),f'{width}x{height} zone {zone}: correct replacement mode')
   check(all(result[k] for k in ['fits','solved','reachable','retained','unsolved']),f'{width}x{height} zone {zone}: phone-width fit, reset, solver replay, reachable Enter and retained completion')
  check(not errors,f'{width}x{height}: no runtime page errors');context.close()
 browser.close()
Path('/workspace/secret-adventures/game-export/t2187u/puzzle-browser-smoke.txt').write_text('\n'.join(results)+'\n')
print(f'{len(results)} puzzle browser checks passed; no screenshots or puzzle internals recorded.')
