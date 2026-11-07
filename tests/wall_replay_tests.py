"""Local: a wall-art piece replays only when the party gained a companion since it was last heard.
Run: python3 tests/wall_replay_tests.py http://127.0.0.1:<port>/"""
import sys,os
sys.path.insert(0,os.path.dirname(__file__))
import stage6_tests as S6
from stage6_tests import ev,check
from scripted_scenes_tests import setup,party,collect
from playwright.sync_api import sync_playwright
def art(pg):return ev(pg,'document.querySelector("#s6d .s6wall").getAttribute("src")')
def reset(pg):ev(pg,'(()=>{const s=SOTA.rpg.s6.st();s.walls={};s.order=[];s.wallHeard={};s.revealed=false;s.told={}})()')
def qroom(pg):  # a regular room whose piece has a Quinn line
  return ev(pg,'(()=>{const s6=SOTA.rpg.s6,P=[1,2,3,4,5].reduce((a,z)=>a.concat(STORY.wall[z]),[]);return s6.artRooms().find(i=>{const k=s6.pieceFor(i);return k<s6.DAD_FROM&&P[k].some(l=>l[0]==="Q")})})()')
def visit(pg,i):
  ev(pg,f'S6H.wall({i})')
  if not ev(pg,'SOTA.storyOpen()'):return None,None
  a=art(pg);return collect(pg),a
def t_regular_replay(p):
  b,c,pg=setup(p);reset(pg);i=qroom(pg);check(i is not None,'no piece with Q lines')
  party(pg,0);g1,a1=visit(pg,i);check(g1 is not None,'first visit did not play');check(not any(w=='Q' for w,t in g1),'absent Quinn spoke')
  n=ev(pg,'SOTA.rpg.s6.st().order.length');k=ev(pg,'Object.keys(SOTA.rpg.s6.st().walls).length')
  g,_=visit(pg,i);check(g is None,'same-party revisit replayed')
  party(pg,1);g2,a2=visit(pg,i);check(g2 is not None,'after-join revisit did not replay');check(a2==a1,'art changed on replay');check(any(w=='Q' for w,t in g2),'new companion line missing')
  check(ev(pg,'SOTA.rpg.s6.st().order.length')==n and ev(pg,'Object.keys(SOTA.rpg.s6.st().walls).length')==k,'replay grew order/walls')
  g,_=visit(pg,i);check(g is None,'larger same party replayed again')
  party(pg,0);g,_=visit(pg,i);check(g is None,'losing a companion replayed');b.close()
def t_flags_do_not_swap(p):
  b,c,pg=setup(p);reset(pg);party(pg,0)
  r5=visit(pg,5);r4=visit(pg,4);visit(pg,84);visit(pg,80);check(ev(pg,'SOTA.rpg.s6.st().revealed'),'picnic did not reveal')
  ev(pg,'SOTA.rpg.s6.st().ending="high"');party(pg,7)
  for i,old in ((5,r5),(4,r4)):
    g,a=visit(pg,i);check(g is not None,f'room {i} did not replay after join');check(a==old[1] and 'zone1-' in a,f'room {i} art swapped {a}')
    check(g[0]==old[0][0] if old[0][0][0]!='H' else True,f'room {i} opener changed');check(not any("That's my dad." in t for w,t in g),f'room {i} got picnic piece')
  g,a=visit(pg,84);check(g is not None and a.endswith('zone5-09-bedside-center.webp'),'bedside replay art');check(any(w=='Q' for w,t in g),'bedside Q missing')
  g,a=visit(pg,80);check(g is not None and a.endswith('zone5-08-picnic-farthest.webp') and any(w=='Q' for w,t in g),'picnic replay')
  check(ev(pg,'SOTA.rpg.s6.st().order')==[5,4,84,80],'order grew');check(ev(pg,'Object.keys(SOTA.rpg.s6.st().walls).length')==4,'count grew');b.close()
def t_old_save_no_spam(p):
  b,c,pg=setup(p);reset(pg);party(pg,3);ev(pg,'(()=>{const s=SOTA.rpg.s6.st();s.walls[5]=1;s.order=[5];delete s.wallHeard})()')
  g,_=visit(pg,5);check(g is None,'old save replayed with unchanged party');party(pg,7);g,_=visit(pg,5);check(g is not None,'old save no replay after later join');b.close()
TESTS=[t_regular_replay,t_flags_do_not_swap,t_old_save_no_spam]
if __name__=='__main__':
  S6.S4.BASE=sys.argv[1];ok=0
  with sync_playwright() as p:
    for t in TESTS:
      try:t(p);ok+=1;print('PASS',t.__name__)
      except Exception as e:print('FAIL',t.__name__,e)
  print(f'{ok}/{len(TESTS)}');sys.exit(ok!=len(TESTS))
