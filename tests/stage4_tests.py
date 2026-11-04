"""Stage 4 (combat and party) tests on a pretend phone (Playwright Chromium, touch, 390x844). Usage: python tests/stage4_tests.py [base_url] [names...]"""
import sys,os,json,time,subprocess,re
from playwright.sync_api import sync_playwright
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/').rstrip('/')+'/';ONLY=sys.argv[2:]
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
class Fail(Exception):pass
def check(c,m):
  if not c:raise Fail(m)
ERRS=[];REQS=[]
def ctx(p,w=390,h=844,sw=False):
  # stage 6: story scenes are switched off for the older suites (they test the game under the story); stage6_tests covers the story
  b=p.chromium.launch();c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,service_workers='allow' if sw else 'block');c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}");return b,c
def page(c,pre=None):
  pg=c.new_page();pg.on('console',lambda m:ERRS.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e:ERRS.append(str(e)));pg.on('request',lambda r:REQS.append(r.url))
  pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA&&SOTA.rpg');pg.evaluate('localStorage.clear()')
  if pre:pg.evaluate('p=>{for(const k in p)localStorage.setItem(k,p[k])}',pre)
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');pg.evaluate('SOTA.setAnim(false)');return pg
def tap(pg,sel):
  # fix round 1: fight commands and party actions now sit in a branch menu opened by tapping a name
  if pg.locator(sel).count()==0:
    m=re.match(r'\[data-(equip|bag)="(\d+)"\]',sel)
    if m:  # the character sheet (opened by tapping the card) holds equip slots and the backpack
      if pg.locator('.s4pk.sel').count()==0:tap(pg,f'[data-card="{m.group(2)}"]')
      return
    elif sel.startswith('[data-cmd4'):tap(pg,'#fparty button.s4nl:not([disabled])')
  noslide(pg)
  l=pg.locator(sel).first;check(l.count()>0,'no element '+sel);l.scroll_into_view_if_needed();b=l.bounding_box();check(b,'no element '+sel);pg.touchscreen.tap(b['x']+b['width']/2,b['y']+b['height']/2)
def noslide(pg):
  for _ in range(40):
    if not pg.evaluate('!!document.querySelector("#s4br .sliding")'):return
    pg.wait_for_timeout(25)
def ev(pg,js,a=None):return pg.evaluate(js,a) if a is not None else pg.evaluate(js)
def create(pg,race='human',cls='warrior',inc=('str','str','str'),skill=None,diff='normal',name='Jer'):
  if ev(pg,'SOTA.rpg.ui()')!='create':tap(pg,'#partyb')
  check(ev(pg,'SOTA.rpg.ui()')=='create','creation did not open');tap(pg,f'[data-race={race}]');tap(pg,f'[data-cls={cls}]');pg.fill('#ccname',name)
  for k in inc:tap(pg,f'[data-inc={k}]')
  tap(pg,f'[data-skill={skill or ev(pg,"c=>RPG.SKILLS[c][0].id",cls)}]');tap(pg,f'[data-diff={diff}]');tap(pg,'#ccgo')
  if ev(pg,'SOTA.rpg.ui()')=='create':tap(pg,'#ccgo')
  check(ev(pg,'SOTA.rpg.ui()') is None,'creation did not close')
def step_into(pg,c):
  """stand next to cell c facing it, then press forward"""
  for d in range(4):
    if ev(pg,'a=>SOTA.canMove(a[0],a[1],a[2])',[c[0],c[1],d]):
      D=[(0,-1),(1,0),(0,1),(-1,0)][d];nb=[c[0]+D[0],c[1]+D[1]]
      if ev(pg,'a=>SOTA.roomAt(a[0],a[1])',nb)>=0:continue
      ev(pg,'a=>SOTA.teleport(a[0],a[1],a[2])',[nb[0],nb[1],(d+2)%4]);tap(pg,'[data-cmd=fwd]');s=ev(pg,'SOTA.state()');check([s['x'],s['y']]==list(c),f'did not step into {c}');return
  raise Fail(f'no way into {c}')
def finish(pg):
  if ev(pg,'SOTA.rpg.ui()')=='fight':ev(pg,'SOTA.rpg.forceEnd("ran")');tap(pg,'#fdone')
CAMPS=None
# ---------------- rules ----------------
def t_stat_cost(p):
  b,c=ctx(p);pg=page(c)
  check(ev(pg,'[...Array(20).keys()].map(i=>RPG.cost(i+1))')==[1]*5+[2]*5+[3]*5+[4]*5,'cost table wrong')
  check(ev(pg,'RPG.spendCost(5,10)')==9 and ev(pg,'RPG.spendCost(14,17)')==10,'spendCost wrong')
  check(ev(pg,'(()=>{try{RPG.newChar("a","human","warrior",{str:6},"cleave");return 0}catch(e){return 1}})()')==1,'11 points accepted')
  check(ev(pg,'RPG.newChar("a","human","warrior",{str:5},"cleave").spent')==9,'spent wrong')
  tap(pg,'#partyb');tap(pg,'[data-race=elf]');tap(pg,'[data-cls=mage]')
  costs=[]
  for i in range(6):
    t=pg.locator('[data-inc=man] + .s4cost').inner_text();costs.append(t);tap(pg,'[data-inc=man]')
  check(ev(pg,'document.querySelector("[data-val=man]").textContent')=='12','UI did not stop at 10 points (elf mana 8 -> 12)')
  check(costs[0].endswith('2') and costs[2].endswith('2') and costs[3].endswith('3'),f'UI costs {costs}');check(pg.inner_text('#ccleft').endswith(': 1'),'points left not 1 (8->12 costs 9)')
  b.close()
def t_race_class(p):
  b,c=ctx(p);pg=page(c)
  m=ev(pg,'Object.keys(RPG.RACES).map(r=>Object.keys(RPG.CLASSES).filter(k=>RPG.allowed(r,k)).sort().join(","))')
  check(m==['archer,mage,rogue,warrior','archer,mage,rogue,warrior','archer,rogue,warrior','mage,rogue,warrior'],f'class matrix {m}')
  ch=lambda r,k,a: ev(pg,'a=>{const c=RPG.newChar("x",a[0],a[1],{},RPG.SKILLS[a[1]][0].id);return [RPG.armorCap(c),RPG.canEquip(c,"plate","chest"),RPG.canEquip(c,"leather","chest"),RPG.canEquip(c,"robe","chest"),RPG.canEquip(c,"towershield","offhand")]}',[r,k])
  check(ch('cat','warrior',0)==[1,False,False,True,False],'cat armor');check(ch('elf','warrior',0)==[2,False,True,True,False],'elf armor');check(ch('dwarf','rogue',0)[1] and ch('human','warrior',0)[1],'dwarf/human heavy')
  check(ev(pg,'(()=>{try{RPG.newChar("a","dwarf","mage",{},"bolt");return 0}catch(e){return 1}})()')==1,'dwarf mage allowed')
  check(ev(pg,'(()=>{const c=RPG.newChar("a","dwarf","warrior",{},"cleave");return RPG.raise(c,"man")})()')==False,'dwarf raised mana')
  check(ev(pg,'(()=>{const c=RPG.newChar("a","human","warrior",{},"cleave");return [RPG.canEquip(c,"staff","weapon"),RPG.canEquip(c,"bow","weapon")]})()')==[False,True],'weapon rules')
  tap(pg,'#partyb');tap(pg,'[data-race=dwarf]');check(ev(pg,'document.querySelector("[data-cls=mage]").disabled'),'UI lets dwarf pick mage')
  tap(pg,'[data-race=cat]');check(ev(pg,'document.querySelector("[data-cls=archer]").disabled'),'UI lets cat pick archer');b.close()
def t_level_cap(p):
  b,c=ctx(p);pg=page(c)
  r=ev(pg,'(()=>{const c=RPG.newChar("a","human","warrior",{},"cleave");RPG.gainXp(c,1e9,1);const l=c.lvl;RPG.gainXp(c,1e9,1);return [l,c.lvl,RPG.xpNeed(50)===Infinity,RPG.xpNeed(49)>RPG.xpNeed(2)]})()')
  check(r==[50,50,True,True],f'level cap {r}');b.close()
def t_skill_every3(p):
  b,c=ctx(p);pg=page(c)
  check(ev(pg,'[1,2,3,5,6,9,49,50].map(RPG.skillSlots)')==[1,1,2,2,3,4,17,17],'skill slots')
  r=ev(pg,'(()=>{const c=RPG.newChar("a","human","mage",{},"bolt");const a=RPG.learn(c,"frost");c.lvl=3;const b=RPG.learn(c,"frost"),d=RPG.learn(c,"mend");return [a,b,d]})()')
  check(r==[False,True,False],f'learn gating {r}');b.close()
def t_weight(p):
  b,c=ctx(p);pg=page(c)
  r=ev(pg,'["dwarf","human","cat"].map(r=>{const c=RPG.newChar("a",r,"rogue",{},"stab");c.stats.str=5;return RPG.carryLimit(c)})')
  check(r[0]>r[1]>r[2],f'carry by race {r}')
  r=ev(pg,'(()=>{const c=RPG.newChar("a","human","rogue",{},"stab");const l=RPG.carryLimit(c);c.stats.str+=4;return [RPG.carryLimit(c)>l]})()');check(r==[True],'strength does not raise limit')
  r=ev(pg,'(()=>{const c=RPG.newChar("a","cat","rogue",{},"stab");while(RPG.canCarry(c,"plate"))c.bag.push("plate");return [RPG.bagWeight(c)<=RPG.carryLimit(c),RPG.canCarry(c,"plate")]})()');check(r==[True,False],'over limit allowed')
  b.close()
def t_difficulty(p):
  b,c=ctx(p);pg=page(c)
  check(ev(pg,'["story","normal","hard"].map(k=>[RPG.DIFF[k].hp,RPG.DIFF[k].matk])')==[[2,0.5],[1,1],[1,1.5]],'diff table')
  a=ev(pg,'["story","normal","hard"].map(k=>RPG.makeMonster(2,3,5,0,k).atk)');check(abs(a[0]/a[1]-0.5)<0.02 and abs(a[2]/a[1]-1.5)<0.02,f'monster attack {a}')
  create(pg,diff='story');r=ev(pg,'(()=>{const c=SOTA.rpg.live().party[0];return [c.hp,RPG.maxHp(c,1)]})()');check(r[0]==2*r[1],f'story hp {r}');b.close()
def t_monster_scaling(p):
  b,c=ctx(p);pg=page(c)
  r=ev(pg,'[1,2,3,4,5].map(z=>RPG.makeMonster(z,0,10,0,"normal"))');hp=[m['hp'] for m in r];at=[m['atk'] for m in r]
  check(all(hp[i]<hp[i+1] and at[i]<at[i+1] for i in range(4)),f'zones not stronger {hp} {at}')
  check(all(m['lvl']>=10 for m in r),'below party level');check(ev(pg,'RPG.makeMonster(1,0,30,0,"normal").lvl')>=30,'does not follow party')
  check(ev(pg,'RPG.makeMonster(3,0,5,1,"normal").lvl>RPG.makeMonster(3,0,5,0,"normal").lvl'),'centre not stronger')
  check(ev(pg,'RPG.centreFactor(32,32,65)')==1 and ev(pg,'RPG.centreFactor(0,64,65)')==0,'centre factor')
  names=ev(pg,'RPG.MONSTERS.slice(1).flat()');want=['Rat','Slime','Big bug','Cave bat','Giant spider','Mud toad','Fungus creeper','Goblin','Kobold','Hobgoblin brute','Wraith','Dire wolf','Giant scorpion','Ogre warlord','Shadow drake','Salamander','Chimera','Wyvern']
  check(len(names)==35 and all(w in names for w in want),'monster lists');check(ev(pg,'RPG.BOSS.n')=='Iron Golem','boss');b.close()
def t_fight_sim(p):
  b,c=ctx(p);pg=page(c)
  r=ev(pg,'''(()=>{const mk=()=>{const h=RPG.newChar("a","human","warrior",{str:4,sta:2},"cleave");["sword","leather"].forEach(i=>{h.bag.push(i);RPG.equip(h,i,RPG.ITEMS[i].slot)});return h};
   const A=RPG.simulate([mk()],RPG.encounter(1,1,0,"normal",42),"normal",42),B=RPG.simulate([mk()],RPG.encounter(1,1,0,"normal",42),"normal",42);
   const L=RPG.simulate([mk()],RPG.encounter(4,1,0,"hard",7),"hard",7);return [A.over,A.log.join("|")===B.log.join("|"),L.over,A.log.length>0]})()''')
  check(r==['win',True,'lose',True],f'sim {r}');b.close()
def t_fight_ui(p):
  b,c=ctx(p);pg=page(c);create(pg,race='elf',cls='mage',inc=('man','man'),skill='bolt')
  ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal"),RPG.makeMonster(1,1,1,0,"normal")].map(m=>(m.hp=m.max=400,m)))');check(ev(pg,'SOTA.rpg.ui()')=='fight','no fight')
  for k in['fwd','left']:ev(pg,f'SOTA.act("{k}")')
  pots=ev(pg,'SOTA.rpg.live().party[0].bag.filter(x=>x=="potion").length');m0=ev(pg,'SOTA.rpg.fight().m[0].hp')
  tap(pg,'[data-cmd4=attack]');tap(pg,'[data-tgt="0"]');check(ev(pg,'SOTA.rpg.fight().m[0].hp')<m0,'attack did nothing')
  mp=ev(pg,'SOTA.rpg.live().party[0].mp');tap(pg,'[data-cmd4=spells]');tap(pg,'[data-sk=bolt]');tap(pg,'[data-tgt="1"]');check(ev(pg,'SOTA.rpg.live().party[0].mp')<mp,'magic used no mana')
  tap(pg,'[data-cmd4=item]');tap(pg,'[data-item=potion]');check(ev(pg,'SOTA.rpg.live().party[0].bag.filter(x=>x=="potion").length')==pots-1,'potion not used')
  tap(pg,'[data-cmd4=defend]');check('defends' in ev(pg,'SOTA.rpg.fight().log.join("|")'),'defend')
  for i in range(30):
    if ev(pg,'SOTA.rpg.fight().over'):break
    tap(pg,'[data-cmd4=run]')
  check(ev(pg,'SOTA.rpg.fight().over') in('ran','lose'),'run never worked');tap(pg,'#fdone');check(ev(pg,'SOTA.rpg.ui()') is None,'fight not closed')
  s0=ev(pg,'SOTA.state()');ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")].map(m=>(m.hp=m.max=1,m)))');tap(pg,'[data-cmd4=attack]');tap(pg,'[data-tgt="0"]')
  check(ev(pg,'document.getElementById("s4").dataset.result')=='win','no win screen');g=ev(pg,'SOTA.rpg.live().gold');check(g>20,'no gold');tap(pg,'#fdone');check(ev(pg,'SOTA.state()')==s0,'moved after win');b.close()
def t_save_only_camps(p):
  b,c=ctx(p);pg=page(c);create(pg);s0=ev(pg,'localStorage.getItem("sota.party")')
  ev(pg,'SOTA.rpg.live().party[0].bag.push("tent")');check(ev(pg,'SOTA.rpg.doSave()')==False,'saved away from camp');ev(pg,'SOTA.rpg.live().gold=999');tap(pg,'[data-cmd=fwd]');finish(pg)
  check(ev(pg,'localStorage.getItem("sota.party")')==s0,'storage changed on a plain step')
  cp=ev(pg,'MAZE.camps[0]');ev(pg,'SOTA.rpg.live().party[0].bag.push("tent")');step_into(pg,cp);sv=json.loads(ev(pg,'localStorage.getItem("sota.party")'));check(sv['gold']==999 and [sv['at']['x'],sv['at']['y']]==cp,'camp did not save')
  tv=ev(pg,'MAZE.taverns[0]');ev(pg,'SOTA.rpg.live().gold=5');step_into(pg,tv);sv=json.loads(ev(pg,'localStorage.getItem("sota.party")'));check(sv['gold']==5 and 'Tavern 1'==sv['at']['name'],'tavern did not save')
  ev(pg,'SOTA.rpg.live().gold=777');pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');check(ev(pg,'SOTA.rpg.live().gold')==5,'progress after save kept over reload');b.close()
def t_death_restore(p):
  b,c=ctx(p);pg=page(c);create(pg);r0=ev(pg,'MAZE.rooms.find(r=>r.k==="treasure").id');ev(pg,f'SOTA.markSolved({r0})');cp=ev(pg,'MAZE.camps[1]');ev(pg,'SOTA.rpg.live().party[0].bag.push("tent")');step_into(pg,cp);g=ev(pg,'SOTA.rpg.live().gold')
  r=ev(pg,'MAZE.rooms.find(r=>r.k==="story"&&!SOTA.isSolved(r.id)).id');ev(pg,f'SOTA.markSolved({r})');ev(pg,'SOTA.rpg.live().gold+=500;SOTA.rpg.live().party[0].xp+=5');ev(pg,'SOTA.teleport(5,63,0)')
  ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(5,1,40,1,"hard")])')
  for i in range(40):
    if ev(pg,'SOTA.rpg.fight().over'):break
    tap(pg,'[data-cmd4=defend]')
  check(ev(pg,'document.getElementById("s4").dataset.result')=='lose','did not lose');tap(pg,'#fdone')
  s=ev(pg,'SOTA.state()');check([s['x'],s['y']]==cp,'not back at camp');check(ev(pg,'SOTA.rpg.live().gold')==g,'gold since save kept')
  check(not ev(pg,f'SOTA.isSolved({r})'),'room solved since save kept');check(ev(pg,f'SOTA.isSolved({r0})'),'room solved before save lost');check(r0 in json.loads(ev(pg,'localStorage.getItem("sota.rooms")'))['s'],'restored rooms not stored');check(ev(pg,'SOTA.rpg.live().party[0].hp')>0,'hero dead after restore');b.close()
def t_companions(p):
  b,c=ctx(p);pg=page(c);create(pg);T=ev(pg,'MAZE.taverns')
  step_into(pg,T[2]);check(len(ev(pg,'SOTA.rpg.live().party'))==1,'joined out of story order');step_into(pg,T[0]);check(len(ev(pg,'SOTA.rpg.live().party'))==1,'tavern 1 companion')
  for i in(1,2,3):step_into(pg,T[i])
  n=ev(pg,'SOTA.rpg.live().party.map(c=>c.name)');check(n==['Jer','Mira','Sorrel','Brunn'],f'party {n}');step_into(pg,T[3]);check(len(ev(pg,'SOTA.rpg.live().party'))==4,'joined twice');b.close()
def t_random_fights(p):
  b,c=ctx(p);pg=page(c);create(pg);fights=0;steps=0;rooms=0
  for i in range(400):
    s=ev(pg,'SOTA.state()');d=next((d for d in [s['f'],(s['f']+1)%4,(s['f']+3)%4,(s['f']+2)%4] if ev(pg,'a=>SOTA.canMove(a[0],a[1],a[2])',[s['x'],s['y'],d])),None)
    while ev(pg,'SOTA.state().f')!=d:ev(pg,'SOTA.act("right")')
    ev(pg,'SOTA.act("fwd")');steps+=1
    if ev(pg,'SOTA.puzzleOpen()'):ev(pg,'SOTA.puzzle.close()');ev(pg,'SOTA.act("right")');continue
    if ev(pg,'SOTA.panelOpen()'):tap(pg,'#pgo')
    if ev(pg,'SOTA.rpg.ui()')=='fight':fights+=1;finish(pg)
    if ev(pg,'SOTA.rpg.ui()'):ev(pg,'SOTA.rpg.ui()') and pg.evaluate('document.querySelector("#s4 .s4back")&&document.querySelector("#s4 .s4back").click()')
  print('   steps',steps,'fights',fights);check(0<fights<steps/15,f'fight rate {fights}/{steps}');b.close()
def t_equip_bag_ui(p):
  b,c=ctx(p);pg=page(c);create(pg,race='cat',cls='warrior',inc=('str',))
  ev(pg,'SOTA.rpg.live().party[0].bag.push("plate","robe","ring")');tap(pg,'#partyb');tap(pg,'[data-equip="0"]');tap(pg,'[data-slot=chest]')
  check('not allowed' in pg.inner_text('[data-opt=plate]'),'plate shown as allowed for cat');tap(pg,'[data-opt=plate]');check(ev(pg,'SOTA.rpg.live().party[0].equip.chest')=='robe','cat wore plate')
  check(ev(pg,'RPG.canEquip(SOTA.rpg.live().party[0],"robe","chest")'),'robe not allowed')
  tap(pg,'[data-slot=acc2]');tap(pg,'[data-opt=ring]');check(ev(pg,'SOTA.rpg.live().party[0].equip.acc2')=='ring','ring')
  check(ev(pg,'document.querySelectorAll("#s4 [data-slot]").length')==8,'not 8 slots')
  tap(pg,'.s4back');tap(pg,'[data-bag="0"]');t=pg.inner_text('#s4');check(re.search(r'Weight [\d.]+ / \d+ kg',t),'no weight line');b.close()
def t_ui_fit(p):
  for w,h in[(390,844),(360,740)]:
    b,c=ctx(p,w,h);pg=page(c);tap(pg,'#partyb');bad=[]
    def chk(tag):
      r=ev(pg,'[...document.querySelectorAll("#s4 button")].map(e=>{const r=e.getBoundingClientRect();return [e.textContent.slice(0,20),r.width,r.height,r.right]})');bad.extend([(tag,x) for x in r if x[1]<44 or x[2]<44 or x[3]>innerW+1])
      check(ev(pg,'document.getElementById("s4").scrollWidth<=innerWidth'),f'{tag} wider than screen')
    innerW=w;chk('create');tap(pg,'[data-race=human]');pg.fill('#ccname','Fit');tap(pg,'[data-skill=cleave]');tap(pg,'#ccgo');tap(pg,'#ccgo')
    ev(pg,'SOTA.rpg.live().party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1),RPG.makeCompanion(RPG.COMPANIONS[1],1),RPG.makeCompanion(RPG.COMPANIONS[2],1))')
    ev(pg,'SOTA.rpg.startFight([0,1,2].map(i=>RPG.makeMonster(1,i,1,0,"normal")))');chk('fight');tap(pg,'[data-cmd4=spells]');chk('skills')
    check(ev(pg,'(()=>{const m=document.getElementById("fmenu").getBoundingClientRect();return m.bottom<=innerHeight+1})()'),'menu off screen')
    ev(pg,'SOTA.rpg.forceEnd("ran")');tap(pg,'#fdone');tap(pg,'#partyb');chk('party');tap(pg,'[data-equip="0"]');tap(pg,'[data-slot=weapon]');chk('equip');tap(pg,'.s4back');tap(pg,'[data-bag="0"]');chk('bag')
    check(not bad,f'{w}x{h} small/offscreen buttons {bad[:5]}');pb=pg.locator('#partyb').bounding_box();check(pb['width']>=44,'party button');b.close()
def t_offline4(p):
  b,c=ctx(p,sw=True);pg=c.new_page();pg.goto(BASE+'index.html');pg.wait_for_function('navigator.serviceWorker.ready.then(()=>true)');pg.reload();pg.wait_for_function('window.SOTA&&navigator.serviceWorker.controller')
  ok=pg.evaluate('(async()=>{const k=await caches.keys();const c=await caches.open("sota-s1-v14");const r=[];for(const f of["rules.js?v=14","party.js?v=14","game.js?v=14","index.html"])r.push(!!(await c.match(f)));return [k,r]})()')
  check(all(ok[1]) and ok[0]==['sota-s1-v14'],f'cache {ok}');c.set_offline(True);pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');tap(pg,'#partyb');check(ev(pg,'SOTA.rpg.ui()')=='create','offline creation');b.close()
  check('updateViaCache:"none"' in open(os.path.join(ROOT,'boot.js')).read(),'updateViaCache')
def t_unchanged(p):
  d=subprocess.run(['git','diff','--stat','c11ccd52511198071301d9c30bb032a4cfaed635','--','tex.js','puzzles.js','puzzle-ui.js','map.js','doors.js','maze-data.js'],cwd=ROOT,capture_output=True,text=True).stdout
  check(d.strip()=='',f'protected files changed: {d}')
  b,c=ctx(p);pg=page(c);check(ev(pg,'getComputedStyle(document.getElementById("hud")).display')!='none','readout not on');b.close()
def t_console_network4(p):
  b,c=ctx(p);pg=page(c);create(pg);ev(pg,'SOTA.rpg.fightHere("t")');tap(pg,'[data-cmd4=attack]');tap(pg,'[data-tgt="0"]');pg.wait_for_timeout(400);b.close()
  check(not ERRS,f'console errors {ERRS[:5]}');bad=[u for u in REQS if not u.startswith(BASE) and not u.startswith('data:')];check(not bad,f'outside requests {bad[:5]}')
  src=''.join(open(os.path.join(ROOT,f)).read() for f in['rules.js','party.js']);check('console.log' not in src and 'http' not in src and 'fetch(' not in src,'network/logging in stage 4 code')
T=[(n[2:],f) for n,f in list(globals().items()) if n.startswith('t_')]
if __name__=='__main__':
  fails=0
  with sync_playwright() as p:
    for n,f in T:
      if ONLY and n not in ONLY:continue
      t=time.time()
      try:f(p);print(f'PASS {n} ({time.time()-t:.1f}s)')
      except Exception as e:fails+=1;print(f'FAIL {n}: {str(e)[:400]}')
  print('ALL STAGE 4 TESTS PASSED' if not fails else f'{fails} FAILED');sys.exit(1 if fails else 0)
