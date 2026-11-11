"""Jeremy t2419u: zone 4 end-to-end on a pretend phone (390x844, touch), real taps wherever the game has a button.
A level 30 party (hero + Mira + Sorrel, points spent 2 main : 1 CON, all skill slots learned) stands at Tavern 3, takes Tavern 3's
Zone 4 exit (4-slot save picker), walks by taps into zone 4 and on to Camp 15 (tent save), fights zone 4 monsters by taps with a
sensible player (heal when hurt, skills when MP allows, else Attack; lowest-HP target) until moonleaf drops, checks the zone 4
mechanics show in the fight log, walks by taps from Camp 22 into Tavern 4 (Brunn joins), shops, saves, checks Tavern 4's Zone 5 exit
opens the save picker (t2721u: zone 5 is open; it used to show exactly "Please wait for update to continue.") and the 4-5 archway west of Tavern 4 bumps without that toast, opens the Beasts tab (zone 4 pencil sketches + detail),
opens the map, then reloads and continues the Tavern 4 save from the title, then loses on purpose (Attack only at low HP)
three times: two zone 4 packs and one walk fight, and checks the loss returns to the last save. Every page error and console
error is kept with its stack trace (game-export/t2419u-zone4/page-errors.txt); a "reading 'update'" error is also written to update-error.txt. Long trips use the teleport hook; arrivals are taps.
Screenshots: game-export/t2419u-zone4/ (inside this tree). Usage: python tests/t2419u_zone4_e2e_browser_test.py [base]"""
import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8966/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
SHOTS=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','game-export','t2419u-zone4');os.makedirs(SHOTS,exist_ok=True)
WAIT='Please wait for update to continue.'
passed=failed=0;steps=[];log=[];STACKS=[]
def hook(pg):
  pg.on('pageerror',lambda e:STACKS.append('pageerror: '+(getattr(e,'stack',None) or str(e))))
  pg.on('console',lambda m:STACKS.append('console.'+m.type+': '+m.text+' @ '+str(m.location)) if m.type=='error' else None)
def shot(pg,name):pg.wait_for_timeout(350);p=os.path.abspath(os.path.join(SHOTS,name));pg.screenshot(path=p);steps.append(p)
def bagn(pg,id):return T.ev(pg,'id=>SOTA.rpg.live().party.flatMap(c=>c.bag).filter(x=>x===id).length',id)
def bag(pg):return T.ev(pg,'SOTA.rpg.live().party.flatMap(c=>c.bag)')
def st(pg):return T.ev(pg,'SOTA.state()')
def say(*a):s=' '.join(str(x) for x in a);print('  '+s,flush=True);log.append(s)
PATH_JS='''t=>{const N=SOTA.N,C=SOTA.core,D=C.DIRS,s=SOTA.state(),start=s.y*N+s.x,goal=t[1]*N+t[0],prev=new Map([[start,-1]]),q=[start];
 for(let k=0;k<q.length;k++){const i=q[k];if(i===goal)break;const x=i%N,y=(i/N)|0;for(let d=0;d<4;d++){if(!SOTA.canMove(x,y,d))continue;if(SOTA.archAhead&&SOTA.archAhead(x,y,d)>=0)continue;const nx=x+D[d][0],ny=y+D[d][1],j=ny*N+nx;
  if(prev.has(j)||SOTA.roomAt(nx,ny)>=0||!SOTA.contentCap.isOpen(nx,ny))continue;prev.set(j,[i,d]);q.push(j);}}
 if(!prev.has(goal))return null;const out=[];for(let i=goal;i!==start;){const [p,d]=prev.get(i);out.push(d);i=p;}return out.reverse();}'''
# the same simple sensible player as tests/t2370u_playtest_zone3.js, played by taps: heal a hurt ally, else the strongest skill
# the hero can pay for (non-mages keep MP for two), else Attack; always the lowest-HP foe
PLAN_JS='''()=>{const L=SOTA.rpg.live(),F=SOTA.rpg.fight(),i=SOTA.rpg.turn(),c=L.party[i];if(!c||c.hp<=0)return null;
 const foes=F.m.map((m,j)=>[m,j]).filter(x=>x[0].hp>0).sort((a,b)=>a[0].hp-b[0].hp),tg=foes.length?foes[0][1]:0;
 const sk=c.skills.map(id=>RPG.SKILLS[c.cls].find(s=>s.id===id)).filter(s=>s&&s.mp<=c.mp);
 const hurt=L.party.some(p=>p.hp>0&&p.hp<RPG.maxHp(p,1)*0.45),heal=sk.find(s=>s.k==="heal");
 const dmg=sk.filter(s=>s.k==="phys"||s.k==="magic").sort((a,b)=>(b.p*(b.all?foes.length:1))-(a.p*(a.all?foes.length:1)))[0];
 if(hurt&&heal)return {who:i,menu:"spells",sk:heal.id,tgt:null};
 if(dmg&&(c.cls==="mage"||c.mp>=dmg.mp*2))return {who:i,menu:dmg.k==="magic"?"spells":"skill",sk:dmg.id,tgt:dmg.all?null:tg};
 return {who:i,menu:"attack",sk:null,tgt:tg};}'''
use={'skill':0,'heal':0,'attack':0};mech_lines=set()
def ftap(pg,sel,tries=20):
  """real touch tap for fight buttons; T.ttap first, then tap the box even if a canvas/log is on top"""
  try:T.ttap(pg,sel,tries=6);return
  except T.Fail:pass
  for _ in range(tries):
    T.noslide(pg)
    loc=pg.locator(sel).first
    if loc.count()==0:pg.wait_for_timeout(80);continue
    b=loc.bounding_box()
    if not b or b['width']<1 or b['height']<1:pg.wait_for_timeout(80);continue
    x=min(max(b['x']+b['width']/2,1),389);y=min(max(b['y']+b['height']/2,1),843)
    pg.touchscreen.tap(x,y);T.noslide(pg);return
  raise T.Fail('could not reach '+sel+' by touch swiping')
def fight_by_taps(pg,attack_only=False):
  for _ in range(200):
    if T.ev(pg,'SOTA.storyOpen&&SOTA.storyOpen()'):T.ev(pg,'SOTA.rpg.closeUI()');pg.wait_for_timeout(80)
    r=T.ev(pg,'document.getElementById("s4").dataset.result||""')
    if r:return r
    p=T.ev(pg,PLAN_JS)
    if p is None:pg.wait_for_timeout(200);continue
    if attack_only:p['menu']='attack'
    ftap(pg,f'#fparty [data-hero="{p["who"]}"]')
    if p['menu']=='attack':ftap(pg,'#s4br [data-cmd4=attack]');pg.wait_for_timeout(80);ftap(pg,f'#s4br [data-tgt="{p["tgt"]}"]');use['attack']+=1
    else:
      ftap(pg,f'#s4br [data-cmd4={p["menu"]}]');ftap(pg,f'#s4br [data-sk={p["sk"]}]')
      if p['tgt'] is not None:pg.wait_for_timeout(80);ftap(pg,f'#s4br [data-tgt="{p["tgt"]}"]')
      use['heal' if p['sk']=='mend' else 'skill']+=1
    pg.wait_for_timeout(250)
    for t in T.ev(pg,'SOTA.rpg.fight()?SOTA.rpg.fight().log.slice(-8):[]'):
      for key in ['scales turn','Stone skin','shell turns','Venom burns','stung by venom','venom is gone','warlord roars','lowers its horns','charges into','dives at','throw the spell back','shields it','is enraged']: # VER 88 adds the last four
        if key in t:mech_lines.add(key)
  raise T.Fail('fight did not end')
def after_fight(pg):
  if T.ev(pg,'!!document.getElementById("s5lvl")'):T.ttap(pg,'#s5lvlok')
  pg.wait_for_timeout(150)
  if T.ui(pg)=='save-picker':T.ttap(pg,f'[data-save-slot="{T.ev(pg,"SOTA.rpg.activeSlot()")}"]')  # t2731u: a loss opens the Load screen; load the last save
  else:T.ttap(pg,'#fdone')
  pg.wait_for_timeout(300)
  if T.ev(pg,'SOTA.storyOpen&&SOTA.storyOpen()'):T.ev(pg,'SOTA.rpg.closeUI()')
fights={'won':0,'lost':0}
def walk_to(pg,cell,maxsteps=600):
  for _ in range(maxsteps):
    s=st(pg)
    if [s['x'],s['y']]==list(cell):return
    if T.ui(pg)=='fight':
      r=fight_by_taps(pg);fights['won' if r=='win' else 'lost']+=1;say('fight on the way:',r,'at',[s['x'],s['y']]);after_fight(pg);continue
    if T.ui(pg) is not None:T.ev(pg,'SOTA.rpg.closeUI()')
    p=T.ev(pg,PATH_JS,list(cell));T.check(p is not None,f'no open path {s} -> {cell}');d=p[0]
    turns=(d-s['f'])%4
    if turns==3:T.ttap(pg,'[data-cmd=left]')
    else:
      for _ in range(turns):T.ttap(pg,'[data-cmd=right]')
    T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(60)
  raise T.Fail(f'walk to {cell} took too long')
def step_into(pg,cell):
  T.ev(pg,'''c=>{SOTA.rpg.closeUI();const D=SOTA.core.DIRS;for(let d=0;d<4;d++){if(!SOTA.canMove(c[0],c[1],d))continue;if(SOTA.archAhead&&SOTA.archAhead(c[0],c[1],d)>=0)continue;const nx=c[0]+D[d][0],ny=c[1]+D[d][1];if(SOTA.roomAt(nx,ny)>=0||!SOTA.contentCap.isOpen(nx,ny))continue;SOTA.teleport(nx,ny,(d+2)%4);return;}}''',list(cell))
  pg.wait_for_timeout(200);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(500);s=st(pg);T.check([s['x'],s['y']]==list(cell),f'did not step into {cell}: {s}')
SPEND_JS='''()=>{const M={warrior:"str",rogue:"sta",archer:"sta",mage:"man"};SOTA.rpg.live().party.forEach(c=>{let k=0;for(let g=0;g<400;g++){const st=(k++%3===2)?"con":M[c.cls];if(!RPG.raise(c,st)&&!RPG.raise(c,st==="con"?M[c.cls]:"con"))break;}
 while(c.skills.length<RPG.skillSlots(c.lvl)){const s=RPG.SKILLS[c.cls].find(x=>!c.skills.includes(x.id));if(!s)break;RPG.learn(c,s.id);}});}'''
def buy_tap(pg,id):
  n0=bagn(pg,id)
  for _ in range(3):
    pg.wait_for_timeout(400);T.ttap(pg,f'[data-buy={id}]');pg.wait_for_timeout(200)
    if bagn(pg,id)>n0:return T.ev(pg,'document.getElementById("s4toast").textContent')
  raise T.Fail('could not buy '+id)
def rest(pg):
  if T.ev(pg,'SOTA.storyOpen&&SOTA.storyOpen()'):T.ev(pg,'SOTA.rpg.closeUI()')
  if T.ui(pg)!='camp':T.ttap(pg,'#s5here')
  T.check(T.ui(pg)=='camp','rest: camp did not open')
  T.ttap(pg,'#s4 [data-tab=rest]');T.ttap(pg,'#s4 [data-tab=return]')

def e2e(p):
  b,c=T.ctx(p);pg=T.fresh(c);hook(pg)
  T.check(T.ui(pg)=='create','creation not open');T.full_create(pg,'Tess','human','warrior')
  T.check(T.ev(pg,'SOTA_CONTENT_CAP.DEFAULT.maxZone')==5,'cap is not zones 1-5 (t2721u)')
  T.check(T.ev(pg,'navigator.serviceWorker?true:true') and 'const VER="107"' in T.ev(pg,'fetch("sw.js").then(r=>r.text())'),'sw VER is not 88')
  # ---- 1. a level 30 party at Tavern 3 (as after zone 3): hero + Mira + Sorrel, points spent, skills learned, kit, tents, gold
  T.ev(pg,'''(()=>{const L=SOTA.rpg.live(),h=L.party[0];while(h.lvl<30)RPG.gainXp(h,RPG.xpNeed(h.lvl),1);
   for(const d of [RPG.COMPANIONS[0],RPG.COMPANIONS[1]])L.party.push(RPG.makeCompanion(d,30));
   h.bag.push("tent","tent","tent","potion","potion","ether","salts","i_herbs");L.gold=1500;L.campTut="done";})()''');T.ev(pg,SPEND_JS)
  T.ev(pg,'SOTA.rpg.live().party.forEach(c=>{c.hp=RPG.maxHp(c,1);c.mp=RPG.maxMp(c);})')
  say('party:',T.ev(pg,'SOTA.rpg.live().party.map(c=>c.name+" "+c.cls+" L"+c.lvl+" skills "+c.skills.join("/"))'))
  step_into(pg,T.ev(pg,'MAZE.taverns[2]'));T.ttap(pg,'#s5here');T.check(T.ui(pg)=='tavern','Tavern 3 did not open')
  T.check(T.ev(pg,'[...document.querySelectorAll("[data-hub]")].map(b=>b.textContent)')==['Zone 3','Shop','Zone 4'],'tavern 3 buttons')
  T.ttap(pg,'[data-hub="1"]');T.ttap(pg,'[data-tab=food]');say('Tavern 3 still sells moonleaf:',buy_tap(pg,'i_moonleaf'));T.check(bagn(pg,'i_moonleaf')==1,'moonleaf not bought at Tavern 3')
  T.ttap(pg,'#s4 .s4back');T.ttap(pg,'[data-tab=done]');T.ttap(pg,'[data-save-slot="0"]');T.check(T.ui(pg)=='tavern','shop Done save did not return to Tavern 3')
  T.ttap(pg,'[data-hub="2"]');T.check(T.ui(pg)=='save-picker' and T.ev(pg,'document.querySelectorAll("[data-save-slot]").length')==4,'Tavern 3 Zone 4 exit did not open the save picker')
  T.check(not T.ev(pg,f'document.body.innerText.includes("{WAIT}")'),'Tavern 3 Zone 4 still waits');shot(pg,'01-tavern3-zone4-save-picker.png')
  T.ttap(pg,'[data-save-slot="1"]');T.check(T.ui(pg) is None,'picker did not close');T.check(T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot1")).at.name')=='Tavern 3','Tavern 3 save not in slot 2')
  # ---- 2. walk by taps into zone 4 and on to Camp 15 (t2446u: arrival never saves; Save tab uses 1 tent)
  walk_to(pg,[51,15]);s=st(pg);T.check(s['zone']==4,f'not in zone 4 {s}');T.check(T.ev(pg,'document.getElementById("s4toast").textContent')!=WAIT,'wait toast entering zone 4')
  T.check(T.ev(pg,'document.getElementById("hud").textContent').startswith('Zone 4'),'HUD not zone 4');shot(pg,'02-zone4-first-hall.png')
  cell=T.ev(pg,'MAZE.camps[14]');t0=bagn(pg,'tent');walk_to(pg,cell)
  T.check(bagn(pg,'tent')==t0,'zone 4 camp arrival used a tent')
  if T.ev(pg,'SOTA.storyOpen&&SOTA.storyOpen()'):T.ev(pg,'SOTA.rpg.closeUI()')
  if T.ui(pg)!='camp':T.ttap(pg,'#s5here')
  T.check(T.ui(pg)=='camp','Camp 15 did not open')
  T.ttap(pg,'[data-tab=save]');T.ttap(pg,'[data-tentyes]');T.check(T.ui(pg)=='save-picker','Camp 15 Save did not open the slot picker')
  slot=T.ev(pg,'SOTA.rpg.activeSlot()');T.ttap(pg,f'[data-save-slot="{slot}"]');pg.wait_for_timeout(150)
  T.check(bagn(pg,'tent')==t0-1,'zone 4 camp save did not use a tent')
  T.check(T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot"+SOTA.rpg.activeSlot())).at.name')=='Camp 15','Camp 15 not saved')
  T.ttap(pg,'[data-tab=return]');say('walked by taps Tavern 3 -> Camp 15',cell)
  rest(pg)
  # ---- 3. zone 4 fights by sensible taps from Camp 15, Rest between fights, until moonleaf dropped and >=4 wins
  wins=loss=0;seen=set();hp=[];drops={}
  for i in range(40):
    if bagn(pg,'i_moonleaf')>=2 and wins>=4:break
    if T.ev(pg,'SOTA.storyOpen&&SOTA.storyOpen()') or T.ui(pg) not in (None,'fight'):T.ev(pg,'SOTA.rpg.closeUI()')
    T.ev(pg,'(()=>{const L=SOTA.rpg.live(),p=SOTA.state();SOTA.rpg.startFight(RPG.encounter(p.zone,RPG.partyLevel(L.party),RPG.centreFactor(p.x,p.y,SOTA.N),L.diff,(L.seed+L.steps*7919+Date.now())>>>0,L.party))})()')
    T.check(T.ui(pg)=='fight','no fight');foes=T.ev(pg,'SOTA.rpg.fight().m.map(m=>m.n+" L"+m.lvl+" z"+m.zone+" "+m.mech)');T.check(all(' z4 ' in f for f in foes),f'not zone 4 foes {foes}');seen.update(f.split(' L')[0] for f in foes)
    if i==0:pg.wait_for_timeout(700);shot(pg,'03-zone4-fight.png')
    b0=bag(pg);r=fight_by_taps(pg)
    if i==0 or (not os.path.exists(os.path.join(SHOTS,'04-zone4-fight-mechanic-log.png')) and mech_lines):shot(pg,'04-zone4-fight-mechanic-log.png')
    if r!='win':
      loss+=1;after_fight(pg);s=st(pg);say('fight',i,foes,r,'-> back at',[s['x'],s['y']]);T.check([s['x'],s['y']]==cell,f'loss did not restore the Camp 15 save {s}');rest(pg);continue
    wins+=1;new=[x for x in set(bag(pg)) if bag(pg).count(x)>b0.count(x)]
    h=T.ev(pg,'Math.round(100*SOTA.rpg.live().party.reduce((t,c)=>t+c.hp/RPG.maxHp(c,1),0)/SOTA.rpg.live().party.length)');hp.append(h);say('fight',i,foes,f'win (HP left {h}%); drops',new)
    ko=T.ev(pg,'SOTA.rpg.live().party.filter(c=>c.hp===1).length')
    for x in new:drops[x]=drops.get(x,0)+1
    after_fight(pg);rest(pg)
  say(f'zone 4 fights: {wins} won, {loss} lost; drops {drops}; foes seen {sorted(seen)}; actions by taps {use}; mechanics seen in the log {sorted(mech_lines)}')
  T.check(wins>=4,'too few zone 4 wins');T.check(bagn(pg,'i_moonleaf')>=2,'no moonleaf dropped in zone 4 (1 was bought at Tavern 3)')
  # VER 88 (t2409u): one fixed Minotaur + Giant scorpion pack, by taps: the status words show and Attack on the Minotaur is shielded
  # (the random packs above use Date.now() seeds, so a short run can end before any mechanic line appears)
  T.ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(4,0,32,0,"normal"),RPG.makeMonster(4,6,32,0,"normal")],"random")');pg.wait_for_timeout(700)
  fen=T.ev(pg,'document.getElementById("fen").textContent');T.check(fen=='Minotaur (shielded) · Giant scorpion (shields others)',f'status words {fen}')
  who=T.ev(pg,'SOTA.rpg.turn()');ftap(pg,f'#fparty [data-hero="{who}"]');ftap(pg,'#s4br [data-cmd4=attack]');pg.wait_for_timeout(80)
  tl=T.ev(pg,'[...document.querySelectorAll("#s4br [data-tgt]")].map(b=>b.textContent)');T.check(any('(shielded)' in t for t in tl),f'target list {tl}');ftap(pg,'#s4br [data-tgt="0"]');pg.wait_for_timeout(300)
  lg=T.ev(pg,'SOTA.rpg.fight().log.join(" | ")');T.check('shields it' in lg,'shielded hit not in the log: '+lg);mech_lines.add('shields it');shot(pg,'04b-zone4-shield-by-taps.png')
  T.ev(pg,'SOTA.rpg.forceEnd("ran")');T.ev(pg,'SOTA.rpg.closeUI()');pg.wait_for_timeout(300);say('VER 88 shield pack by taps:',fen,'|',lg[-120:])
  T.check(len(mech_lines)>=1,'no zone 4 mechanic showed in the fight log')
  # ---- 4. long trip by the teleport hook to Camp 22, then walk by taps into Tavern 4: Brunn joins
  T.ev(pg,'SOTA.rpg.closeUI()');step_into(pg,T.ev(pg,'MAZE.camps[21]'));rest(pg)
  walk_to(pg,T.ev(pg,'MAZE.taverns[3]'));pg.wait_for_timeout(200)
  # stepping onto [47,48] no longer runs arrival; bump the 4-5 arch (zone-4 / prev side) so Brunn joins and the tavern saves
  T.ev(pg,'(()=>{if(SOTA.rpg.closeUI)SOTA.rpg.closeUI();})()')
  sm=T.ev(pg,'(SOTA.seams?SOTA.seams():[]).find(s=>s.t===3)');T.check(sm and sm.get('prev'),'no seam for tavern 4')
  T.ev(pg,'s=>SOTA.teleport(s.x,s.y,s.toArch)',sm['prev']);pg.wait_for_timeout(150);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(400)
  if T.ev(pg,'SOTA.storyOpen&&SOTA.storyOpen()'):T.ev(pg,'SOTA.rpg.closeUI()')
  s=st(pg);T.check([s['x'],s['y']]==[47,48] and s['zone']==4,f'not at Tavern 4 {s}')
  names=T.ev(pg,'SOTA.rpg.live().party.map(c=>c.name+" "+c.cls+" L"+c.lvl)');say('party at Tavern 4:',names);T.check(len(names)==4 and names[3].startswith('Brunn'),'Brunn did not join at Tavern 4')
  if T.ui(pg)!='tavern':T.ttap(pg,'#s5here')
  T.check(T.ui(pg)=='tavern','Tavern 4 did not open')
  T.check(T.ev(pg,'[...document.querySelectorAll("[data-hub]")].map(b=>b.textContent)')==['Zone 4','Shop','Zone 5'],'tavern 4 buttons');shot(pg,'05-tavern4.png')
  T.ttap(pg,'[data-hub="1"]');T.ttap(pg,'[data-tab=food]');say('Tavern 4 shop:',buy_tap(pg,'potion'));shot(pg,'06-tavern4-shop.png')
  T.ttap(pg,'#s4 .s4back');T.ttap(pg,'[data-tab=done]');T.check(T.ui(pg)=='save-picker','Done did not open the save picker');T.ttap(pg,'[data-save-slot="2"]')
  T.check(T.ui(pg)=='tavern','save did not return to Tavern 4');sv=T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot2"))');T.check(sv['at']['name']=='Tavern 4' and len(sv['party'])==4,'Tavern 4 save wrong')
  slots=T.ev(pg,'Object.keys(localStorage).filter(k=>k.startsWith("sota.")).sort()');say('save keys:',slots)
  # ---- 5. t2721u: Tavern 4 Zone 5 is open now: it opens the 4-slot save picker (no wait text); closing the picker saves nothing.
  #      West of Tavern 4 is still the 4-5 archway (fwd bumps and stays, no wait toast). (was: Zone 5 waits with the exact text)
  T.ttap(pg,'[data-hub="2"]');pg.wait_for_timeout(600);T.check(T.ui(pg)=='save-picker' and T.ev(pg,'document.querySelectorAll("[data-save-slot]").length')==4,'Tavern 4 Zone 5 exit did not open the save picker')
  T.check(not T.ev(pg,f'document.body.innerText.includes("{WAIT}")'),'Tavern 4 Zone 5 still waits');shot(pg,'07-tavern4-zone5-save-picker.png')
  T.check(T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot2")).at.name')=='Tavern 4','opening the Zone 5 picker changed the save')
  T.ev(pg,'SOTA.rpg.closeUI()');T.ev(pg,'SOTA.teleport(47,48,3)');pg.wait_for_timeout(200);T.ttap(pg,'[data-cmd=fwd]');s=st(pg);T.check([s['x'],s['y']]==[47,48],'walked into zone 5')
  T.check(T.ev(pg,'document.getElementById("s4toast").textContent')!=WAIT,'wait toast on the 4-5 archway (wait is the Zone 5 tab)');shot(pg,'08-zone5-arch-bump.png')
  if T.ui(pg)=='tavern' or (T.ev(pg,'SOTA.storyOpen&&SOTA.storyOpen()')):T.ev(pg,'SOTA.rpg.closeUI()')
  # ---- 6. Beasts tab: meet the other zone 4 beasts (a fight starts, the party runs), then the tab lists the zone 4 pencil sketches
  for k in range(7):
    T.ev(pg,'k=>{SOTA.rpg.closeUI();SOTA.rpg.startFight([RPG.makeMonster(4,k,30,0,"normal")],"random");SOTA.rpg.forceEnd("ran");SOTA.rpg.closeUI();}',k)
  T.ev(pg,'SOTA.rpg.closeUI();SOTA.intro.openJournal("beasts")');bs=T.ev(pg,'[...document.querySelectorAll("#ijour [data-beast]")].map(f=>f.dataset.beast)');say('Beasts tab lists',bs)
  z4=[x for x in bs if x.startswith('z4-')];T.check(len(z4)==7,f'zone 4 sketches missing {bs}')
  try:pg.wait_for_function('[...document.querySelectorAll("#ijour [data-beast^=z4-] img")].every(i=>i.complete&&i.naturalWidth===1024)',timeout=8000);loaded='all 7 drawn'
  except Exception:loaded=T.ev(pg,'[...document.querySelectorAll("#ijour [data-beast^=z4-] img")].filter(i=>i.complete&&i.naturalWidth===1024).length');loaded=f'{loaded} drawn (the rest are lazy, below the fold)'
  sizes=T.ev(pg,'Promise.all([...document.querySelectorAll("#ijour [data-beast^=z4-] img")].map(i=>fetch(i.src).then(r=>r.ok&&r.headers.get("content-type")).catch(()=>false)))')
  say('zone 4 sketches:',loaded,sizes);T.check(all(x and 'webp' in x for x in sizes),f'a zone 4 sketch is not served {sizes}')
  shot(pg,'09-beasts-tab-zone4-sketches.png')
  T.ttap(pg,'#ijour [data-beast=z4-manticore]');T.check(T.ev(pg,'!!document.querySelector("#ijour [data-beast-detail=z4-manticore]")'),'no manticore detail');shot(pg,'10-beasts-detail-z4-manticore.png')
  T.ev(pg,'SOTA.intro.closeJournal()')
  # ---- 7. the map, after walking zone 4 by taps
  T.ttap(pg,'#mapb');pg.wait_for_timeout(600);shot(pg,'11-zone4-map.png');T.ttap(pg,'#mclose')
  # ---- 8. reload and continue the Tavern 4 save from the title
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');T.ev(pg,'SOTA.setAnim(false)');T.past_title(pg);pg.wait_for_timeout(500)
  s=st(pg);T.check([s['x'],s['y']]==[47,48],f'continue did not load the Tavern 4 save {s}');T.check(len(T.ev(pg,'SOTA.rpg.live().party'))==4,'party not loaded')
  shot(pg,'12-continued-tavern4-save.png')
  # ---- 9. losing runs by taps (Eve's t2417u lead: a page error once showed up only on a losing play-through)
  losses=0
  for n,pack in enumerate([[0,5,6],[4,1,3]]):
    T.ev(pg,'SOTA.rpg.closeUI();for(const c of SOTA.rpg.live().party){c.hp=Math.max(1,Math.round(RPG.maxHp(c,1)*0.12));c.mp=0;}')
    T.ev(pg,'ks=>{SOTA.rpg.startFight(ks.map(k=>RPG.makeMonster(4,k,34,0,"normal")),"random")}',pack);pg.wait_for_timeout(400)
    r=fight_by_taps(pg,attack_only=True);say('losing run',n+1,'pack',pack,'->',r)
    if n==0:shot(pg,'13-zone4-losing-run.png')
    after_fight(pg);losses+=r=='lose'
  # a natural walk fight at low HP, west from Tavern 4's save along zone 4 halls
  T.ev(pg,'SOTA.rpg.closeUI();SOTA.teleport(47,48,3)');T.ev(pg,'for(const c of SOTA.rpg.live().party){c.hp=1;c.mp=0;}')
  for _ in range(400):
    s=st(pg);T.ev(pg,'SOTA.rpg.closeUI()')
    d=T.ev(pg,'s=>{for(const d of [s.f,(s.f+1)%4,(s.f+3)%4,(s.f+2)%4]){const D=SOTA.core.DIRS[d],nx=s.x+D[0],ny=s.y+D[1];if(SOTA.canMove(s.x,s.y,d)&&SOTA.roomAt(nx,ny)<0&&SOTA.contentCap.isOpen(nx,ny))return d;}return -1}',s)
    T.ev(pg,'d=>SOTA.teleport(SOTA.state().x,SOTA.state().y,d)',d);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(120)
    if T.ui(pg)=='fight':
      r=fight_by_taps(pg,attack_only=True);say('losing walk fight ->',r);after_fight(pg);losses+=r=='lose';break
  s=st(pg);say('after the losses at',s);T.check(losses>=2,f'only {losses} losing runs');T.check([s['x'],s['y']]==[47,48],f'loss did not return to the Tavern 4 save {s}')
  T.check(not T.ERRS,f'page errors {T.ERRS[:3]}');say('walk fights',fights,'avg HP left after zone 4 camp-fight wins',sum(hp)/max(1,len(hp)));b.close()
with sync_playwright() as p:
  try:e2e(p);passed+=1;print('PASS zone 4 end-to-end')
  except Exception as e:failed+=1;print('FAIL zone 4 end-to-end',e)
open(os.path.join(SHOTS,'page-errors.txt'),'w').write(('\n\n'.join(STACKS) or 'no page errors or console errors')+'\n')
upd=[x for x in STACKS if "reading 'update'" in x]
if upd:open(os.path.join(SHOTS,'update-error.txt'),'w').write('\n\n'.join(upd)+'\n');print('UPDATE ERROR SEEN, stack in update-error.txt')
print('page/console errors:',len(STACKS))
print(f'{passed} passed, {failed} failed');print('screenshots:',*steps,sep='\n  ')
sys.exit(1 if failed else 0)
