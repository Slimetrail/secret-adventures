"""Jeremy t2362u step 1 (zones 1-2) end-to-end pass on a pretend phone (390x844, touch), real taps wherever the game has a
button: new game with 4 stats (CON), start kit, first-camp lesson -> crafted tent -> camp save, zone 1 fights with a level-up,
a drop, a craft, Tavern 1 Shop, the save picker, and loading a save. Travel between places uses the teleport hook (walking
the maze by taps is covered elsewhere). Screenshots: ../game-export/t2362u-step1/. Usage: python tests/t2362u_step1_e2e_browser_test.py [base]"""
import sys,os,re
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
SHOTS=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','game-export','t2362u-step1');os.makedirs(SHOTS,exist_ok=True)
passed=failed=0;steps=[]
def shot(pg,name):pg.wait_for_timeout(250);p=os.path.join(SHOTS,name);pg.screenshot(path=p);steps.append(p)
def bagn(pg,id):return T.ev(pg,'id=>SOTA.rpg.live().party.flatMap(c=>c.bag).filter(x=>x===id).length',id)
def bag(pg):return T.ev(pg,'SOTA.rpg.live().party.flatMap(c=>c.bag)')
def tut_step(pg):return T.ev(pg,'(()=>{const t=document.getElementById("s5tut");return t?+t.dataset.step:0})()')
def inc(pg,k):
  """tap a creation '+' like a finger; the stat rows run under the sticky Confirm bar on a phone, so the helper may swipe first
  and a tap during the swipe's settle can miss: wait and retry (max 3), never a scripted click"""
  l0=T.left(pg)
  for _ in range(3):
    pg.wait_for_timeout(350);T.ttap(pg,f'[data-inc={k}]');pg.wait_for_timeout(150)
    if T.left(pg)<l0:return
  raise T.Fail('could not tap + on '+k)
def go(pg,cell):T.ev(pg,'a=>{SOTA.rpg.closeUI();SOTA.teleport(a[0],a[1],0);}',cell);pg.wait_for_timeout(2600)
def fight_by_taps(pg,zone=1):
  T.ev(pg,'z=>{const L=SOTA.rpg.live();SOTA.rpg.startFight(RPG.encounter(z,RPG.partyLevel(L.party),0,L.diff,(L.seed+L.steps*7919+Date.now())>>>0,L.party))}',zone)
  T.check(T.ui(pg)=='fight','no fight')
  for _ in range(80):
    r=T.ev(pg,'document.getElementById("s4").dataset.result||""')
    if r:return r
    alive=T.ev(pg,'SOTA.rpg.live().party.map((c,i)=>c.hp>0?i:-1).filter(i=>i>=0)');who=T.ev(pg,'(SOTA.rpg.turn||SOTA.rpg.s5.turn)()')
    T.ttap(pg,f'#fparty [data-hero="{who if who in alive else alive[0]}"]');T.ttap(pg,'#s4br [data-cmd4=attack]')
    tg=T.ev(pg,'[...document.querySelectorAll("#s4br [data-tgt]")].map(b=>b.dataset.tgt)');T.ttap(pg,f'#s4br [data-tgt="{tg[0]}"]');pg.wait_for_timeout(450)
  raise T.Fail('fight did not end')
def e2e(p):
  b,c=T.ctx(p);pg=T.fresh(c)
  # 1. new game: 4 stats, CON costs like the others, spend by taps
  T.check(T.ui(pg)=='create','creation not open')
  T.type_name(pg,'Tess');T.ttap(pg,'[data-race=human]');T.ttap(pg,'[data-cls=warrior]')
  rows=T.ev(pg,'[...document.querySelectorAll("[data-inc]")].map(b=>b.dataset.inc)');T.check(rows==['str','sta','con','man'],f'creation stats {rows}')
  names=T.ev(pg,'[...document.querySelectorAll(".s4stat .s4sn")].map(e=>e.textContent)');T.check(any('Constitution' in n for n in names),names)
  c0=int(T.ev(pg,'document.querySelector("[data-val=con]").textContent'));inc(pg,'con');inc(pg,'con')
  T.check(int(T.ev(pg,'document.querySelector("[data-val=con]").textContent'))==c0+2,'CON + did not work');T.check(T.left(pg)==10-T.ev(pg,'RPG.spendCost(5,7)'),'CON costs differ from the other stats')
  for _ in range(12):
    if T.left(pg)==0:break
    inc(pg,'str')
  shot(pg,'01-create-4-stats.png')
  T.ttap(pg,'[data-skill=cleave]');T.ttap(pg,'[data-diff=normal]');T.ttap(pg,'#ccgo');T.check(T.ui(pg) is None,'creation did not finish '+T.err(pg))
  h=T.ev(pg,'(()=>{const c=SOTA.rpg.live().party[0];return {st:c.stats,hp:RPG.maxHp(c,1),crit:RPG.critChance(c)}})()');print('  hero:',h)
  T.check(h['st']['con']==7 and h['crit']==0,'hero stats');
  # 2. start kit
  k=sorted(bag(pg));print('  start kit bag:',k)
  T.check(bagn(pg,'potion')==3 and bagn(pg,'ether')==2 and bagn(pg,'p_hide')==3 and bagn(pg,'p_silk')==3 and bagn(pg,'tent')==0,f'kit {k}')
  T.ev(pg,'SOTA.rpg.charScreen(0)');st=T.ev(pg,'[...document.querySelectorAll(".s4status .s4k")].map(e=>e.textContent)')
  T.check(all(x in st for x in ['STR','STA','CON','MAN','CRIT']),f'status panel {st}');shot(pg,'02-sheet-stats-and-kit.png');T.ev(pg,'SOTA.rpg.closeUI()')
  # 3. first camp: lesson -> crafted tent -> save
  go(pg,T.ev(pg,'MAZE.camps[0]'));T.ttap(pg,'#s5here');T.check(tut_step(pg)==1,'lesson step 1 missing');shot(pg,'03-camp1-lesson-step1.png')
  T.ttap(pg,'[data-craftopen]');T.ttap(pg,'#s5craftpop [data-cbox="0"]');T.ttap(pg,'#s5craftpop [data-cpick=p_silk]');T.ttap(pg,'#s5craftpop [data-cpick=p_hide]')
  T.check(tut_step(pg)==3,'lesson step 3 missing');shot(pg,'04-lesson-boxes.png');T.ttap(pg,'#s5craftpop #s5craft')
  T.check(bagn(pg,'tent')==1 and tut_step(pg)==4,'no crafted tent / step 4');shot(pg,'05-lesson-tent-and-save.png')
  T.ttap(pg,'#s5tut [data-tutsave]');T.check(T.ui(pg)=='save-picker' and T.ev(pg,'document.querySelectorAll("[data-save-slot]").length')==4,'no save picker');shot(pg,'06-save-picker.png')
  T.ttap(pg,'[data-save-slot="0"]');T.check(bagn(pg,'tent')==0,'save did not use 1 tent');sv0=T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot0"))')
  T.check(sv0['campTut']=='shown' and [sv0['at']['x'],sv0['at']['y']]==T.ev(pg,'MAZE.camps[0]'),'camp save not in slot 1')
  T.ttap(pg,'#s4 [data-tab=return]');T.check(T.ui(pg) is None,'Return did not close camp')
  # 4. zone 1 fights by taps until a level-up, watch for a drop
  before=len(bag(pg));won=0;drop=None;lvl0=T.ev(pg,'SOTA.rpg.live().party[0].lvl')
  for i in range(14):
    b0=bag(pg);r=fight_by_taps(pg,1);T.check(r in('win','lose','ran'),r)
    if r=='lose':shot(pg,f'07-fight-{i}-lost.png');T.ttap(pg,'#fdone');continue
    won+=1;new=[x for x in bag(pg) if bag(pg).count(x)>b0.count(x)];note=T.ev(pg,'[...document.querySelectorAll("#s4 .s4note")].map(e=>e.textContent).join(" | ")')
    if new and not drop:drop=new[0];print('  drop:',new,'|',note[:120]);shot(pg,'08-win-with-drop.png')
    up=T.ev(pg,'!!document.getElementById("s5lvl")')
    if up:
      t=T.ev(pg,'document.getElementById("s5lvl").textContent');T.check('HP and MP fully restored' in t,t)
      h=T.ev(pg,'(()=>{const c=SOTA.rpg.live().party[0];return [c.lvl,c.hp,RPG.maxHp(c,RPG.DIFF[SOTA.rpg.live().diff].hp),c.mp,RPG.maxMp(c),RPG.pointsEarned(c.lvl)-c.spent]})()')
      T.check(h[1]==h[2] and h[3]==h[4] and h[5]==4*(h[0]-1),f'level-up refill/points (4 per level) {h}');shot(pg,f'09-level-up-L{h[0]}.png');T.ttap(pg,'#s5lvlok')
    T.ttap(pg,'#fdone');pg.wait_for_timeout(300)
    if T.ev(pg,'SOTA.storyOpen&&SOTA.storyOpen()'):T.ev(pg,'SOTA.rpg.closeUI()')
    if T.ev(pg,'SOTA.rpg.live().party[0].lvl')>=lvl0+2 and drop:break
  lv=T.ev(pg,'SOTA.rpg.live().party[0].lvl');print(f'  fights won {won}, hero level {lvl0}->{lv}, first drop {drop}')
  T.check(lv>lvl0,'no level-up from real fights');T.check(drop,'no drop in 14 fights')
  # stat points: spend the level-up points with the + buttons, CON included
  T.ev(pg,'SOTA.rpg.charScreen(0)');T.ttap(pg,'[data-stats="0"]');c1=T.ev(pg,'SOTA.rpg.live().party[0].stats.con');T.ttap(pg,'[data-raise=con]')
  T.check(T.ev(pg,'SOTA.rpg.live().party[0].stats.con')==c1+1,'level-up + on CON failed');shot(pg,'10-stat-points-con.png');T.ev(pg,'SOTA.rpg.closeUI()')
  # 5. Tavern 1 Shop: buy herbs (and a shell if sold) for a potion craft; then Done -> save picker
  go(pg,T.ev(pg,'MAZE.taverns[0]'));T.ttap(pg,'#s5here');pg.wait_for_timeout(300)
  if T.ev(pg,'SOTA.storyOpen&&SOTA.storyOpen()'):T.ev(pg,'SOTA.rpg.closeUI();SOTA.rpg.s5.tavernScreen(0)')
  T.check(T.ui(pg)=='tavern',f'tavern did not open {T.ui(pg)}');shot(pg,'11-tavern1.png')
  T.ttap(pg,'[data-hub="1"]');T.check(T.ui(pg)=='buy','shop did not open');T.ttap(pg,'[data-tab=food]');g0=T.ev(pg,'SOTA.rpg.live().gold')
  T.ttap(pg,'[data-buy=i_herbs]');T.check(bagn(pg,'i_herbs')>=1 and T.ev(pg,'SOTA.rpg.live().gold')<g0,'could not buy herbs');shot(pg,'12-shop-food-bought-herbs.png')
  T.ttap(pg,'#s4 .s4back');T.ttap(pg,'[data-tab=done]');T.check(T.ui(pg)=='save-picker','Done did not open the save picker');shot(pg,'13-tavern-save-picker.png')
  T.ttap(pg,'[data-save-slot="1"]');T.check(T.ui(pg)=='tavern','tavern save did not return to the tavern')
  T.check(T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot1")).at.x')==T.ev(pg,'MAZE.taverns[0][0]'),'tavern save not in slot 2')
  # 6. a craft at a camp (camp 2, no lesson): potion if a shell dropped, else a tent from the kit's spare silk + hide
  go(pg,T.ev(pg,'MAZE.camps[1]'));T.ttap(pg,'#s5here');T.check(T.ui(pg)=='camp' and tut_step(pg)==0,'camp 2 / lesson shown again')
  T.ttap(pg,'[data-craftopen]');mix=['i_herbs','p_shell'] if bagn(pg,'p_shell') else ['p_silk','p_hide'];out='potion' if mix[0]=='i_herbs' else 'tent';n0=bagn(pg,out)
  T.ttap(pg,'#s5craftpop [data-cbox="0"]');[T.ttap(pg,f'#s5craftpop [data-cpick={m}]') for m in mix];T.ttap(pg,'#s5craftpop #s5craft')
  T.check(bagn(pg,out)==n0+1 and T.ev(pg,'document.getElementById("s5craftpic").dataset.result')==out,f'craft {mix} failed');print('  crafted',out,'from',mix);shot(pg,'14-craft-'+out+'.png')
  T.ttap(pg,'#s5craftpop [data-craftclose]')
  # 7. load a save from the journal settings: slot 1 = camp 1 after the lesson
  T.ev(pg,'SOTA.rpg.closeUI();SOTA.intro.openJournal("settings")');T.ttap(pg,'[data-setting=load]');T.check(T.ui(pg)=='save-picker','no load picker');shot(pg,'15-load-picker.png')
  T.ttap(pg,'[data-save-slot="0"]');pg.wait_for_timeout(400)
  s=T.ev(pg,'SOTA.state()');T.check([s['x'],s['y']]==T.ev(pg,'MAZE.camps[0]'),f'load did not go back to camp 1 {s}')
  T.check(T.ev(pg,'SOTA.rpg.live().party[0].lvl')==lvl0 and bagn(pg,'tent')==0 and T.ev(pg,'SOTA.rpg.live().campTut')=='shown','loaded save is wrong');shot(pg,'16-loaded-camp1.png')
  T.check(not T.ERRS,f'page errors {T.ERRS[:3]}');b.close()
with sync_playwright() as p:
  try:e2e(p);passed+=1;print('PASS step 1 end-to-end, zones 1-2')
  except Exception as e:failed+=1;print('FAIL step 1 end-to-end',e)
print(f'{passed} passed, {failed} failed');print('screenshots:',*steps,sep='\n  ')
sys.exit(1 if failed else 0)
