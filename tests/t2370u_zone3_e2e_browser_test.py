"""Jeremy t2362u step 2 / t2370u: zone 3 end-to-end on a pretend phone (390x844, touch), real taps wherever the game has a button.
Starts from a real zone 2 camp save (made in-game, then the page is reloaded and the save continued from the title), walks by taps
to Tavern 2 (Sorrel joins), takes Tavern 2's Zone 3 exit (4-slot save picker), walks by taps into zone 3, fights zone 3 monsters by
taps until wolf pelt + fowl drop, walks into a zone 3 camp (tent save), crafts the medium Hunter's stew at the camp's Craft button,
reaches Tavern 3, shops (moonleaf), saves, checks the Zone 4 exit waits, crafts Moon elixir if a ghoul fang dropped, and loads the
Tavern 3 save from the journal. Long trips between places use the teleport hook; the last steps into camps/taverns are taps.
Screenshots: ../../game-export/t2370u-zone3/. Usage: python tests/t2370u_zone3_e2e_browser_test.py [base]"""
import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8901/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
# t2419u: screenshots go inside this tree so a later-zone copy never overwrites the shared zone 3 evidence
SHOTS=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','game-export','t2370u-zone3');os.makedirs(SHOTS,exist_ok=True)
passed=failed=0;steps=[];log=[]
def shot(pg,name):pg.wait_for_timeout(300);p=os.path.abspath(os.path.join(SHOTS,name));pg.screenshot(path=p);steps.append(p)
def bagn(pg,id):return T.ev(pg,'id=>SOTA.rpg.live().party.flatMap(c=>c.bag).filter(x=>x===id).length',id)
def bag(pg):return T.ev(pg,'SOTA.rpg.live().party.flatMap(c=>c.bag)')
def st(pg):return T.ev(pg,'SOTA.state()')
def say(*a):s=' '.join(str(x) for x in a);print('  '+s);log.append(s)
# BFS on the real maze (game's canMove), room cells are walls, only cells the content cap opens
PATH_JS='''t=>{const N=SOTA.N,C=SOTA.core,D=C.DIRS,s=SOTA.state(),start=s.y*N+s.x,goal=t[1]*N+t[0],prev=new Map([[start,-1]]),q=[start];
 for(let k=0;k<q.length;k++){const i=q[k];if(i===goal)break;const x=i%N,y=(i/N)|0;for(let d=0;d<4;d++){if(!SOTA.canMove(x,y,d))continue;if(SOTA.archAhead&&SOTA.archAhead(x,y,d)>=0)continue;const nx=x+D[d][0],ny=y+D[d][1],j=ny*N+nx;
  if(prev.has(j)||SOTA.roomAt(nx,ny)>=0||!SOTA.contentCap.isOpen(nx,ny))continue;prev.set(j,[i,d]);q.push(j);}}
 if(!prev.has(goal))return null;const out=[];for(let i=goal;i!==start;){const [p,d]=prev.get(i);out.push(d);i=p;}return out.reverse();}'''
def fight_by_taps(pg):
  for _ in range(120):
    r=T.ev(pg,'document.getElementById("s4").dataset.result||""')
    if r:return r
    alive=T.ev(pg,'SOTA.rpg.live().party.map((c,i)=>c.hp>0?i:-1).filter(i=>i>=0)');who=T.ev(pg,'(SOTA.rpg.turn||SOTA.rpg.s5.turn)()')
    T.ttap(pg,f'#fparty [data-hero="{who if who in alive else alive[0]}"]');T.ttap(pg,'#s4br [data-cmd4=attack]')
    tg=T.ev(pg,'[...document.querySelectorAll("#s4br [data-tgt]")].map(b=>b.dataset.tgt)');T.ttap(pg,f'#s4br [data-tgt="{tg[0]}"]');pg.wait_for_timeout(400)
  raise T.Fail('fight did not end')
def after_fight(pg,tag):
  """close a finished fight by taps: level-up popup OK, then Done; returns what the fight added to the bags"""
  if T.ev(pg,'!!document.getElementById("s5lvl")'):
    t=T.ev(pg,'document.getElementById("s5lvl").textContent');T.check('HP and MP fully restored' in t,t)
    h=T.ev(pg,'(()=>{const L=SOTA.rpg.live();return L.party.map(c=>[c.name,c.lvl,c.hp===RPG.maxHp(c,RPG.DIFF[L.diff].hp)||c.hp<=0])})()');say('level-up',tag,h);T.check(all(x[2] for x in h if x[0]+' reached level' in t),f'level-up refill {h}')  # only the members who levelled are refilled (rules unchanged since live 6de0e16; the old check only held when nobody else was hurt)
    if tag not in shot_lvl:shot(pg,f'07-level-up-{tag}.png');shot_lvl.add(tag)
    T.ttap(pg,'#s5lvlok')
  T.ttap(pg,'#fdone');pg.wait_for_timeout(300)
shot_lvl=set()
def walk_to(pg,cell,maxsteps=400):
  """tap the arrow buttons along the shortest open path; fights that start on the way are fought by taps"""
  for _ in range(maxsteps):
    s=st(pg)
    if [s['x'],s['y']]==list(cell):return
    if T.ui(pg)=='fight':r=fight_by_taps(pg);say('fight on the way:',r);after_fight(pg,'walk');continue
    if T.ui(pg) is not None:T.ev(pg,'SOTA.rpg.closeUI()')
    p=T.ev(pg,PATH_JS,list(cell));T.check(p is not None,f'no open path {s} -> {cell}');d=p[0]
    turns=(d-s['f'])%4
    if turns==3:T.ttap(pg,'[data-cmd=left]')
    else:
      for _ in range(turns):T.ttap(pg,'[data-cmd=right]')
    T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(60)
  raise T.Fail(f'walk to {cell} took too long')
def camp_save(pg):
  """VER 83 t2450u/t2451u: the player saves from the camp Save tab (asks to use a tent unless one is already pitched here), then picks the active slot"""
  if T.ui(pg)!='camp':T.ttap(pg,'#s5here')
  T.ttap(pg,'#s4 [data-tab=save]')
  if T.ev(pg,'!!document.querySelector("[data-tentyes]")'):T.ttap(pg,'[data-tentyes]')
  T.check(T.ui(pg)=='save-picker','camp Save did not open the slot picker');T.ttap(pg,'[data-save-slot="'+str(T.ev(pg,'SOTA.rpg.activeSlot()'))+'"]');pg.wait_for_timeout(200)
  T.check(T.ui(pg)=='camp','camp save did not return to the camp')
def step_into(pg,cell):
  """teleport to an open neighbour of cell, facing it, then tap Forward into it (so arrival runs like a player's step)"""
  T.ev(pg,'''c=>{SOTA.rpg.closeUI();const D=SOTA.core.DIRS;for(let d=0;d<4;d++){if(!SOTA.canMove(c[0],c[1],d))continue;const nx=c[0]+D[d][0],ny=c[1]+D[d][1];if(SOTA.roomAt(nx,ny)>=0||!SOTA.contentCap.isOpen(nx,ny))continue;SOTA.teleport(nx,ny,(d+2)%4);return;}}''',list(cell))
  pg.wait_for_timeout(200);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(500);s=st(pg);T.check([s['x'],s['y']]==list(cell),f'did not step into {cell}: {s}')
# a player spends level points on the + screen (2 main stat : 1 CON); the same RPG.raise rule is applied here, not hand-made stats
SPEND_JS='''()=>{const M={warrior:"str",rogue:"sta",archer:"sta",mage:"man"};SOTA.rpg.live().party.forEach(c=>{let k=0;for(let g=0;g<400;g++){const st=(k++%3===2)?"con":M[c.cls];if(!RPG.raise(c,st)&&!RPG.raise(c,st==="con"?M[c.cls]:"con"))break;}});}'''
def buy_tap(pg,id):
  """tap a shop row like a finger; the list re-renders after a buy and a tap during its touch-scroll settle can miss: wait and retry (max 3)"""
  n0=bagn(pg,id)
  for _ in range(3):
    pg.wait_for_timeout(400);T.ttap(pg,f'[data-buy={id}]');pg.wait_for_timeout(200)
    if bagn(pg,id)>n0:return T.ev(pg,'document.getElementById("s4toast").textContent')
  raise T.Fail('could not buy '+id+': '+T.ev(pg,'document.getElementById("s4toast").textContent'))
def e2e(p):
  b,c=T.ctx(p);pg=T.fresh(c)
  T.check(T.ui(pg)=='create','creation not open');T.full_create(pg,'Tess','human','warrior')
  T.check(T.ev(pg,'SOTA_CONTENT_CAP.DEFAULT.maxZone')>=3,'cap does not open zone 3') # t2419u: zone4-work opens zone 4 too
  # ---- 1. a zone 2 save, made in-game: L20 hero who spent points in STR/CON, Mira from Tavern 1, 2 tents, meat, gold; zone 1 lesson done
  T.ev(pg,'''(()=>{const L=SOTA.rpg.live(),h=L.party[0];while(h.lvl<20)RPG.gainXp(h,RPG.xpNeed(h.lvl),1);
   for(let k=0;k<400;k++){if(!RPG.raise(h,k%3===2?"con":"str")&&!RPG.raise(h,"con"))break;}
   const c=RPG.makeCompanion(RPG.COMPANIONS[0],20);L.party.push(c);h.hp=RPG.maxHp(h,RPG.DIFF[L.diff].hp);h.mp=RPG.maxMp(h);
   h.bag.push("tent","tent","i_meat","i_meat");L.gold=400;L.campTut="done";})()''');T.ev(pg,SPEND_JS)
  step_into(pg,T.ev(pg,'MAZE.camps[5]'))
  camp_save(pg);T.ev(pg,'SOTA.rpg.closeUI()')  # VER 83 t2450u: no camp auto-save, the player saves from the camp Save tab
  sv=T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot"+SOTA.rpg.activeSlot()))');T.check(sv['at']['name']=='Camp 6' and sv['party'][0]['lvl']==20 and len(sv['party'])==2,'zone 2 camp save missing')
  T.check(bagn(pg,'tent')==1,'camp save did not use 1 tent');shot(pg,'01-zone2-camp6-saved.png')
  # ---- 2. reload the game and continue that save from the title (long press)
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');T.ev(pg,'SOTA.setAnim(false)');T.past_title(pg);pg.wait_for_timeout(400)
  s=st(pg);T.check([s['x'],s['y']]==T.ev(pg,'MAZE.camps[5]') and s['zone']==2,f'continue did not load the zone 2 save {s}')
  T.check(T.ev(pg,'SOTA.rpg.live().party.map(c=>c.lvl)')==[20,20],'loaded party wrong');say('loaded zone 2 save at',s)
  # ---- 3. walk by taps to Tavern 2: Sorrel joins; Tavern 2 Zone 3 exit -> 4-slot save picker
  walk_to(pg,T.ev(pg,'MAZE.taverns[1]'));pg.wait_for_timeout(200)
  # stepping onto [18,24] no longer runs arrival; bump the seam arch (zone-2 / prev side) so Sorrel joins and the tavern saves
  T.ev(pg,'(()=>{if(SOTA.rpg.closeUI)SOTA.rpg.closeUI();})()')
  sm=T.ev(pg,'(SOTA.seams?SOTA.seams():[]).find(s=>s.t===1)')
  T.check(sm and sm.get('prev'),'no seam for tavern 2')
  T.ev(pg,'s=>SOTA.teleport(s.x,s.y,s.toArch)',sm['prev']);pg.wait_for_timeout(150)
  T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(400)
  names=T.ev(pg,'SOTA.rpg.live().party.map(c=>c.name+" "+c.cls+" L"+c.lvl)');say('party at Tavern 2:',names);T.check(len(names)==3,'Sorrel did not join at Tavern 2')
  free=T.ev(pg,'SOTA.rpg.live().party.map(c=>RPG.pointsEarned(c.lvl)-c.spent)');say('unspent points after Sorrel joined:',free)
  T.ev(pg,'SOTA.rpg.charScreen(2)');pc=T.ev(pg,'SOTA.rpg.live().party[2].stats.con');T.ttap(pg,'[data-stats="2"]');T.ttap(pg,'[data-raise=con]');T.check(T.ev(pg,'SOTA.rpg.live().party[2].stats.con')==pc+1,'+ CON on Sorrel failed');T.ev(pg,'SOTA.rpg.closeUI()');T.ev(pg,SPEND_JS)
  if T.ui(pg)!='tavern':
    for _ in range(20):
      if T.ev(pg,'document.getElementById("s5here")&&document.getElementById("s5here").style.display==="block"'):break
      pg.wait_for_timeout(100)
    T.ttap(pg,'#s5here')
  T.check(T.ui(pg)=='tavern','Tavern 2 did not open');shot(pg,'02-tavern2.png')
  T.check(T.ev(pg,'[...document.querySelectorAll("[data-hub]")].map(b=>b.textContent)')==['Zone 2','Shop','Zone 3'],'tavern 2 buttons')
  T.ttap(pg,'[data-hub="2"]');T.check(T.ui(pg)=='save-picker' and T.ev(pg,'document.querySelectorAll("[data-save-slot]").length')==4,'Zone 3 exit did not open the save picker');shot(pg,'03-tavern2-zone3-save-picker.png')
  T.ttap(pg,'[data-save-slot="1"]');T.check(T.ui(pg) is None,'picker did not close');T.check(T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot1")).at.name')=='Tavern 2','Tavern 2 save not in slot 2')
  # ---- 4. walk into zone 3 by taps (east to the doorway, then north)
  walk_to(pg,[19,24]);walk_to(pg,[19,23]);s=st(pg);T.check(s['zone']==3,f'not in zone 3 {s}')
  T.check('Please wait' not in T.ev(pg,'document.getElementById("s4toast").textContent'),'wait toast in zone 3');T.check(T.ev(pg,'document.getElementById("hud").textContent').startswith('Zone 3'),'HUD not zone 3')
  shot(pg,'04-zone3-first-hall.png')
  # ---- 5. a zone 3 camp (Camp 7) by a tap; the player saves there (VER 83: no auto-save) and it uses a tent
  k=6;cell=T.ev(pg,f'MAZE.camps[{k}]');T.check(T.ev(pg,'c=>SOTA.core.zoneOf[c[1]*SOTA.N+c[0]]',cell)==3,'camp 7 not zone 3')
  t0=bagn(pg,'tent');walk_to(pg,cell);T.check(bagn(pg,'tent')==t0,'camp arrival used a tent');camp_save(pg);T.ev(pg,'SOTA.rpg.closeUI()');T.check(bagn(pg,'tent')==t0-1,'zone 3 camp save did not use a tent')
  T.check(T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot"+SOTA.rpg.activeSlot())).at.name')=='Camp 7','camp 7 not saved');say('walked by taps from (19,23) to Camp 7',cell,'- saved, tents left',bagn(pg,'tent'))
  T.ttap(pg,'#s5here');T.ttap(pg,'#s4 [data-tab=rest]');T.ttap(pg,'#s4 [data-tab=return]')
  # ---- 6. zone 3 fights by taps from Camp 7, tapping Rest between fights, until wolf pelt and fowl dropped (a loss goes back to the Camp 7 save)
  got={};wins=loss=0;sprites=set()
  for i in range(40):
    if bagn(pg,'p_pelt') and bagn(pg,'i_fowl') and wins>=3:break
    T.ev(pg,'(()=>{const L=SOTA.rpg.live(),p=SOTA.state();SOTA.rpg.startFight(RPG.encounter(p.zone,RPG.partyLevel(L.party),RPG.centreFactor(p.x,p.y,SOTA.N),L.diff,(L.seed+L.steps*7919+Date.now())>>>0,L.party))})()')
    T.check(T.ui(pg)=='fight','no fight');foes=T.ev(pg,'SOTA.rpg.fight().m.map(m=>m.n+" L"+m.lvl+" z"+m.zone)');T.check(all(f.endswith('z3') for f in foes),f'not zone 3 foes {foes}');sprites.update(f.split(' L')[0] for f in foes)
    if i==0:pg.wait_for_timeout(700);shot(pg,'05-zone3-fight.png')
    b0=bag(pg);r=fight_by_taps(pg)
    if r!='win':
      loss+=1;after_fight(pg,'lost');s=st(pg);say('fight',i,foes,r,'-> back at',s);T.check([s['x'],s['y']]==cell,f'loss did not restore the Camp 7 save {s}')
      T.ttap(pg,'#s5here');T.ttap(pg,'#s4 [data-tab=rest]');T.ttap(pg,'#s4 [data-tab=return]');continue  # VER 83: Rest refills HP/MP (no save)
    wins+=1;new=[x for x in set(bag(pg)) if bag(pg).count(x)>b0.count(x)];note=T.ev(pg,'[...document.querySelectorAll("#s4 .s4note")].map(e=>e.textContent).join(" | ")')
    hp=T.ev(pg,'Math.round(100*SOTA.rpg.live().party.reduce((t,c)=>t+c.hp/RPG.maxHp(c,1),0)/SOTA.rpg.live().party.length)');say('fight',i,foes,f'win (HP left {hp}%); drops',new,'|',note[:100])
    for x in new:got[x]=got.get(x,0)+1
    if new and 'first' not in got:got['first']=1;shot(pg,'06-zone3-win-with-drop.png')
    after_fight(pg,'z3')
    if T.ev(pg,'SOTA.storyOpen&&SOTA.storyOpen()'):T.ev(pg,'SOTA.rpg.closeUI()')
    camp_save(pg);T.ttap(pg,'#s4 [data-tab=return]')  # VER 83 t2450u: Rest only refills, so the player taps Save (tent already pitched here: free) to keep the drops
  got.pop('first',None);say(f'zone 3 fights: {wins} won, {loss} lost; drops kept {got}; foes seen {sorted(sprites)}')
  T.check(wins>=3,'too few zone 3 wins');T.check(bagn(pg,'p_pelt') and bagn(pg,'i_fowl'),'no wolf pelt + fowl after 40 zone 3 fights')
  # ---- 7. Craft at Camp 7 -> meat + fowl + pelt -> Hunter's stew (medium, 3 boxes)
  T.ttap(pg,'#s5here');T.check(T.ui(pg)=='camp','zone 3 camp did not open');shot(pg,'08-zone3-camp7.png')
  T.ttap(pg,'[data-craftopen]');T.ttap(pg,'#s5craftpop [data-cbox="0"]')
  for m in ['i_meat','i_fowl','p_pelt']:T.ttap(pg,f'#s5craftpop [data-cpick={m}]')
  shot(pg,'09-craft-stew-boxes.png');T.ttap(pg,'#s5craftpop #s5craft')
  T.check(bagn(pg,'c_stew')==1 and T.ev(pg,'document.getElementById("s5craftpic").dataset.result')=='stew','Hunter\'s stew not crafted');shot(pg,'10-craft-hunters-stew.png')
  txt=T.ev(pg,'document.getElementById("s5craftpop").innerText');say('craft result text:',txt.replace('\n',' | ')[:160])
  T.ttap(pg,'#s5craftpop [data-craftclose]');T.ttap(pg,'#s4 [data-tab=return]')
  # ---- 8. Tavern 3 by a tap: shop (moonleaf + herbs), Done -> save picker, Zone 4 waits
  step_into(pg,T.ev(pg,'MAZE.taverns[2]'));T.ttap(pg,'#s5here');T.check(T.ui(pg)=='tavern','Tavern 3 did not open')
  T.check(T.ev(pg,'[...document.querySelectorAll("[data-hub]")].map(b=>b.textContent)')==['Zone 3','Shop','Zone 4'],'tavern 3 buttons');shot(pg,'11-tavern3.png')
  T.ttap(pg,'[data-hub="1"]');T.check(T.ui(pg)=='buy','Tavern 3 shop did not open');T.ttap(pg,'[data-tab=food]');g0=T.ev(pg,'SOTA.rpg.live().gold')
  say('shop:',buy_tap(pg,'i_moonleaf'),'|',buy_tap(pg,'i_herbs'));T.check(bagn(pg,'i_moonleaf')==1 and bagn(pg,'i_herbs')>=1 and T.ev(pg,'SOTA.rpg.live().gold')<g0,'could not buy moonleaf/herbs');shot(pg,'12-tavern3-shop-moonleaf.png')
  T.ttap(pg,'#s4 .s4back');T.ttap(pg,'[data-tab=done]');T.check(T.ui(pg)=='save-picker','Done did not open the save picker');shot(pg,'13-tavern3-save-picker.png')
  T.ttap(pg,'[data-save-slot="2"]');T.check(T.ui(pg)=='tavern','tavern 3 save did not return to the tavern');sv=T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot2"))')
  T.check(sv['at']['name']=='Tavern 3' and 'c_stew' in [x for c in sv['party'] for x in c['bag']],'Tavern 3 save wrong')
  cap=T.ev(pg,'SOTA_CONTENT_CAP.DEFAULT.maxZone')
  if cap==3:
    T.ttap(pg,'[data-hub="2"]');pg.wait_for_timeout(2600);T.check(T.ui(pg)=='tavern','Zone 4 left the tavern')
    T.check(T.ev(pg,'document.body.innerText.includes("Please wait for update to continue.")'),'no wait message on Zone 4');shot(pg,'14-tavern3-zone4-wait.png')
    T.ev(pg,'SOTA.rpg.closeUI()')
    # the maze itself refuses zone 4 south of Tavern 3
    T.ev(pg,'SOTA.teleport(51,14,2)');pg.wait_for_timeout(200);T.ttap(pg,'[data-cmd=fwd]');s=st(pg);T.check([s['x'],s['y']]==[51,14],'walked into zone 4')
    T.check(T.ev(pg,'document.getElementById("s4toast").textContent')=='Please wait for update to continue.','no wait toast at the zone 4 edge');shot(pg,'15-zone4-edge-wait-toast.png')
  else:  # t2419u: zone 4 is open, so Tavern 3's Zone 4 exit saves (the Tavern 4 Zone 5 wait is in t2419u_zone4_e2e_browser_test.py)
    T.ttap(pg,'[data-hub="2"]');T.check(T.ui(pg)=='save-picker','Tavern 3 Zone 4 exit did not open the save picker');T.ttap(pg,'[data-save-slot="2"]');T.check(T.ui(pg) is None,'picker did not close')
    T.ev(pg,'SOTA.teleport(51,14,2)');pg.wait_for_timeout(200);T.ttap(pg,'[data-cmd=fwd]');s=st(pg);T.check([s['x'],s['y']]==[51,15] and s['zone']==4,'could not walk into zone 4')
    T.check(T.ev(pg,'document.getElementById("s4toast").textContent')!='Please wait for update to continue.','wait toast entering zone 4');shot(pg,'14-tavern3-zone4-open.png')
    if T.ui(pg)=='fight':T.ev(pg,'SOTA.rpg.forceEnd("ran");SOTA.rpg.closeUI()')
    T.ev(pg,'SOTA.teleport(51,14,0)');pg.wait_for_timeout(200)
  # ---- 9. Moon elixir at Camp 14 next to Tavern 3, if a ghoul fang dropped
  if bagn(pg,'p_fang'):
    t0=bagn(pg,'tent');T.ev(pg,'SOTA.rpg.live().party[0].bag.push("tent")') if t0==0 else None  # bought-tent stand-in so the camp Save can use one
    step_into(pg,T.ev(pg,'MAZE.camps[13]'))
    if T.ui(pg)!='camp':
      for _ in range(20):
        if T.ev(pg,'document.getElementById("s5here")&&document.getElementById("s5here").style.display==="block"'):break
        pg.wait_for_timeout(100)
      T.ttap(pg,'#s5here')
    T.ttap(pg,'[data-craftopen]');T.ttap(pg,'#s5craftpop [data-cbox="0"]')
    for m in ['i_herbs','i_moonleaf','p_fang']:T.ttap(pg,f'#s5craftpop [data-cpick={m}]')
    T.ttap(pg,'#s5craftpop #s5craft');T.check(bagn(pg,'c_elixir')==1 and T.ev(pg,'document.getElementById("s5craftpic").dataset.result')=='elixir','Moon elixir not crafted');shot(pg,'16-craft-moon-elixir.png')
    T.ttap(pg,'#s5craftpop [data-craftclose]');T.ttap(pg,'#s4 [data-tab=return]');say('crafted Moon elixir at Camp 14')
    T.check(T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot2")).at.name')=='Tavern 3','camp arrival auto-saved (VER 83 t2450u: camps save only from the Save tab)')
    camp_save(pg);T.ttap(pg,'#s4 [data-tab=return]');T.check(T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot2")).at.name')=='Camp 14','camp Save tab did not save to the active slot')
  else:say('no ghoul fang dropped this run; Moon elixir craft covered by the node test')
  # ---- 10. journal: Hunter's stew known; Beasts tab (zone 3 sketches since t2404u: found ones listed with art)
  T.ev(pg,'SOTA.rpg.closeUI();SOTA.intro.openJournal("recipes")');T.check(T.ev(pg,'!!document.querySelector("#ijour [data-craft=stew]")'),'stew not in journal');shot(pg,'17-journal-recipes-crafts.png')
  T.ev(pg,'SOTA.intro.openJournal("beasts")');bs=T.ev(pg,'[...document.querySelectorAll("#ijour [data-beast]")].map(f=>f.dataset.beast)');say('journal Beasts tab lists',bs);pg.wait_for_function('()=>[...document.querySelectorAll("#ijour [data-beast] img")].every(i=>i.complete&&i.naturalWidth>0)',timeout=8000);T.check(all(w>0 for _,w in T.ev(pg,'[...document.querySelectorAll("#ijour [data-beast]")].map(f=>[f.dataset.beast,(f.querySelector("img")||{}).naturalWidth||0])')),'z3 beasts listed without art')  # t2404u (in live 6de0e16) added zone 3 sketches; found ones are listed with their art;shot(pg,'18-journal-beasts-z3-sketches.png')
  # ---- 11. step back into Tavern 3 (arrival auto-saves to the active slot), wander off unsaved, then load that save from the journal
  T.ev(pg,'SOTA.intro.closeJournal()');step_into(pg,T.ev(pg,'MAZE.taverns[2]'));T.check(T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot2")).at.name')=='Tavern 3','Tavern 3 arrival did not save')
  want={k:bagn(pg,k) for k in ['c_stew','c_elixir','i_moonleaf','p_fang']};say('bag at the Tavern 3 save',want)
  T.ev(pg,'SOTA.rpg.closeUI();SOTA.teleport(19,23,0)');T.ev(pg,'SOTA.rpg.live().gold=1')
  T.ev(pg,'SOTA.intro.openJournal("settings")');T.ttap(pg,'[data-setting=load]');T.check(T.ui(pg)=='save-picker','no load picker');shot(pg,'19-load-picker.png')
  T.ttap(pg,'[data-save-slot="2"]');pg.wait_for_timeout(400);s=st(pg)
  T.check([s['x'],s['y']]==[51,14] and s['zone']==3,f'load did not go to Tavern 3 {s}');T.check({k:bagn(pg,k) for k in want}==want and want['c_stew']==1 and len(T.ev(pg,'SOTA.rpg.live().party'))==3 and T.ev(pg,'SOTA.rpg.live().gold')>1,'loaded save is wrong')
  shot(pg,'20-loaded-tavern3.png');T.check(not T.ERRS,f'page errors {T.ERRS[:3]}');b.close()
with sync_playwright() as p:
  try:e2e(p);passed+=1;print('PASS zone 3 end-to-end')
  except Exception as e:failed+=1;print('FAIL zone 3 end-to-end',e)
print(f'{passed} passed, {failed} failed');print('screenshots:',*steps,sep='\n  ')
sys.exit(1 if failed else 0)
