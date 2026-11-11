"""Jeremy t2721u: zone 5 end-to-end, story ON, one browser and one page at a time. Sizes 412x891 (phone, touch) and 1280x800.
Per size: loads with no console/page errors (VER 107, maxZone 5), creates a hero by taps, a L50 hero+Mira+Sorrel party bumps the
Tavern 4 archway (Brunn joins), takes Tavern 4's Zone 5 exit through the 4-slot save picker into zone 5 (46,48), walks by taps to a
zone 5 camp (fights on the way by taps) and saves there, fights a fixed zone 5 pack by taps (Shadow drake veil, Hydra regrow,
Salamander burn) and checks the zone 5 lines show and the battle backdrop is purple, reloads and continues the zone 5 save
(save/load in zone 5), walks by taps to the centre: the boss note (letter) plays, then the 3 locks are solved IN ORDER by taps
(Lights Out lock FINAL_LOCK, sliding tiles, moving blocks), the door opens the Iron Golem fight, real rounds are played by taps
(iron skin, sweep warning, eye lock lines checked); after 6 real rounds the Golem's HP is set low and the fight is finished by taps
(time), the ending plays to its title and credits; the other two endings are then opened from the centre door with the wall-art
sets that select them (low: none, mid: zone3-05 only, high: all 28 art rooms). Finally the maze still turns (no freeze), 0 errors.
fix1 (QA on 07111bc): right after the 4-5 seam save at 46,48 the party goes to the centre, solves the 3 locks (letter art bbox checked
against the dialogue box and portrait at each lock), opens the door and loses (forced after one round): the loss text and toast name
"the Zone 5 side of Tavern 4", the locks stay solved after the loss and a reload, and later the door opens at once. After each ending the
save picker is offered (saved after low and high, declined after mid; no tent); a reload shows Continue and keeps golemDefeated + ending.
fix2 (t2730u/t2731u): after each ending the "End of game save" picker, then the main menu (Continue keeps the win); losses open the Load
screen (Zone 5 side slot labelled "Tavern 4 (Zone 5 side)"); a zone 1-4 seam cell (14,48) keeps "Back at Tavern 1"; Back on the loss Load
screen loads the last save and opens the main menu. Shots: /workspace/zone5-shots/, fix1/ and fix2/ (or $Z5SHOTS). Usage: python tests/t2721u_zone5_e2e_browser_test.py http://127.0.0.1:PORT/"""
import sys,os,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:19811/').rstrip('/')+'/'
SHOTS=os.environ.get('Z5SHOTS','/workspace/zone5-shots');os.makedirs(os.path.join(SHOTS,'fix1'),exist_ok=True);os.makedirs(os.path.join(SHOTS,'fix2'),exist_ok=True)
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
import splash_helper as SPL
from playwright.sync_api import sync_playwright
WAIT='Please wait for update to continue.'
ERRS=[];LOG=[];SHOTLIST=[]
def say(*a):s=' '.join(str(x) for x in a);print('  '+s,flush=True);LOG.append(s)
def ev(pg,js,a=None):return T.ev(pg,js,a)
def hook(pg,tag):
  pg.on('pageerror',lambda e:ERRS.append(f'[{tag}] pageerror: '+(getattr(e,'stack',None) or str(e))))
  pg.on('console',lambda m:ERRS.append(f'[{tag}] console.error: '+m.text+' @ '+str(m.location)) if m.type=='error' else None)
def shot(pg,name):pg.wait_for_timeout(350);p=os.path.join(SHOTS,name);pg.screenshot(path=p);SHOTLIST.append(p)
def story(pg):return ev(pg,'!!(SOTA.storyOpen&&SOTA.storyOpen())')
def tapbox(pg):ev(pg,'''(()=>{const d=document.getElementById("s6d");if(d)d.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true}));})()''')
def drain(pg,n=800,stop=None):
  """advance a talk line by line (tap on the box); taps the first enabled button when a scene ends on buttons, unless stop() says to stop"""
  ev(pg,'SOTA.rpg.s6&&SOTA.rpg.s6.setSpeed(0)');lines=[]
  for _ in range(n):
    if not story(pg):return lines
    if stop and stop():return lines
    cur=ev(pg,'(()=>{const d=document.getElementById("s6d");return d?[d.dataset.scene||"",d.dataset.who||"",(d.querySelector(".s6t")||{}).textContent||""]:null})()')
    if cur and (not lines or lines[-1]!=cur):lines.append(cur)
    ev(pg,'''(()=>{const d=document.getElementById("s6d");if(!d)return;const b=d.querySelector(".s6btns button:not([disabled])");const t=b||d;t.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true}));})()''')
    pg.wait_for_timeout(45)
  raise T.Fail('talk did not finish (freeze?)')
def wait_quiet(pg):
  # poll from Python: the page CSP (script-src 'self') blocks Playwright's in-page string predicate once it has to poll
  for _ in range(20):
    if pg.evaluate('!(SOTA.mazeInputQuiet&&SOTA.mazeInputQuiet())'):return
    pg.wait_for_timeout(50)
  raise AssertionError('maze input still quiet after 1 s')
# zone 5 sensible player by taps: Defend when the Golem's eye is on you; heal when hurt or burning; beat the veil first, then a Hydra with skills
PLAN_JS='''()=>{const L=SOTA.rpg.live(),F=SOTA.rpg.fight(),i=SOTA.rpg.turn(),c=L.party[i];if(!c||c.hp<=0)return null;
 const live=F.m.map((m,j)=>[m,j]).filter(x=>x[0].hp>0),pri=m=>(m.mech==="veil"&&live.length>1)?0:m.mech==="regrow"?1:2;
 const foes=live.sort((a,b)=>pri(a[0])-pri(b[0])||a[0].hp-b[0].hp),tg=foes.length?foes[0][1]:0;
 const sk=c.skills.map(id=>RPG.SKILLS[c.cls].find(s=>s.id===id)).filter(s=>s&&s.mp<=c.mp);
 const burning=p=>F.venom&&F.venom[L.party.indexOf(p)];
 const hurt=L.party.some(p=>p.hp>0&&(p.hp<RPG.maxHp(p,1)*0.5||(burning(p)&&p.hp<RPG.maxHp(p,1)*0.65))),heal=sk.find(s=>s.k==="heal");
 if(F.mark===i&&F.turn%3===0)return {who:i,menu:"defend",sk:null,tgt:null};
 const dmg=sk.filter(s=>s.k==="phys"||s.k==="magic").sort((a,b)=>(b.p*(b.all?foes.length:1))-(a.p*(a.all?foes.length:1)))[0];
 if(hurt&&heal)return {who:i,menu:"spells",sk:heal.id,tgt:null};
 if(dmg)return {who:i,menu:dmg.k==="magic"?"spells":"skill",sk:dmg.id,tgt:dmg.all?null:tg};
 return {who:i,menu:"attack",sk:null,tgt:tg};}'''
seen_lines=set()
KEYS=['veil shields it','grows back a head','catches fire','Fire burns','fire is out','thick hide','stares down','breathes fire on','eyes start to glow','breathes in',
 'Iron skin','raises both fists','sweeps','eye locks on','smashes','core blazes','dives at']
def collect(pg):
  for t in ev(pg,'SOTA.rpg.fight()?SOTA.rpg.fight().log.slice(-12):[]'):
    for k in KEYS:
      if k in t:seen_lines.add(k)
def one_turn(pg,force_attack=False):
  p=ev(pg,PLAN_JS)
  if p is None:pg.wait_for_timeout(150);return
  if force_attack:p['menu']='attack';p['tgt']=0
  T.ttap(pg,f'#fparty [data-hero="{p["who"]}"]')
  if p['menu']=='attack':T.ttap(pg,'#s4br [data-cmd4=attack]');T.ttap(pg,f'#s4br [data-tgt="{p["tgt"]}"]')
  elif p['menu']=='defend':T.ttap(pg,'#s4br [data-cmd4=defend]')
  else:
    T.ttap(pg,f'#s4br [data-cmd4={p["menu"]}]');T.ttap(pg,f'#s4br [data-sk={p["sk"]}]')
    if p['tgt'] is not None:T.ttap(pg,f'#s4br [data-tgt="{p["tgt"]}"]')
  pg.wait_for_timeout(200);collect(pg)
def fight(pg,max_turns=400,on_turn=None):
  for k in range(max_turns):
    r=ev(pg,'document.getElementById("s4").dataset.result||""')
    if r:return r
    if story(pg):ev(pg,'SOTA.rpg.s6&&SOTA.rpg.s6.setSpeed(0)');tapbox(pg);pg.wait_for_timeout(60);continue
    if on_turn and on_turn(k):continue
    one_turn(pg)
  raise T.Fail('fight did not end')
def after_fight(pg):
  if ev(pg,'!!document.getElementById("s5lvlok")'):T.ttap(pg,'#s5lvlok')
  if ev(pg,'!!document.getElementById("fdone")'):T.ttap(pg,'#fdone')
  pg.wait_for_timeout(300)
PATH_JS='''t=>{const N=SOTA.N,C=SOTA.core,D=C.DIRS,s=SOTA.state(),start=s.y*N+s.x,goal=t[1]*N+t[0],prev=new Map([[start,-1]]),q=[start];
 for(let k=0;k<q.length;k++){const i=q[k];if(i===goal)break;const x=i%N,y=(i/N)|0;for(let d=0;d<4;d++){if(!SOTA.canMove(x,y,d))continue;if(SOTA.archAhead&&SOTA.archAhead(x,y,d)>=0)continue;const nx=x+D[d][0],ny=y+D[d][1],j=ny*N+nx;
  if(prev.has(j)||SOTA.roomAt(nx,ny)>=0||!SOTA.contentCap.isOpen(nx,ny))continue;prev.set(j,[i,d]);q.push(j);}}
 if(!prev.has(goal))return null;const out=[];for(let i=goal;i!==start;){const [p,d]=prev.get(i);out.push(d);i=p;}return out.reverse();}'''
walk_fights={'won':0,'lost':0}
def walk_to(pg,cell,maxsteps=400,until=None):
  for _ in range(maxsteps):
    s=ev(pg,'SOTA.state()')
    if [s['x'],s['y']]==list(cell) or (until and until(s)):return s
    if T.ui(pg)=='fight':
      r=fight(pg);walk_fights['won' if r=='win' else 'lost']+=1;say('fight on the way:',r,'at',[s['x'],s['y']]);after_fight(pg)
      if r!='win':raise T.Fail('lost a walk fight in zone 5')
      continue
    if story(pg):drain(pg);continue
    if T.ui(pg) is not None:ev(pg,'SOTA.rpg.closeUI()')
    p=ev(pg,PATH_JS,list(cell));T.check(p is not None,f'no open path {s} -> {cell}');d=p[0]
    turns=(d-s['f'])%4
    try:wait_quiet(pg)
    except Exception:pass
    if turns==3:T.ttap(pg,'[data-cmd=left]')
    else:
      for _ in range(turns):T.ttap(pg,'[data-cmd=right]')
    T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(60)
  return ev(pg,'SOTA.state()')
SOLVE_JS='''k=>{const P=PUZ,s6=SOTA.rpg.s6;
 if(k===1){const {pz,s}=s6.finalLock();return P.lightsSolve(pz.n,s.g);}/* t2768u Lights Out */
 return null;}'''
# t2766u: boss locks 2/3 are 5x5 tiles / 6x6 blocks at the boss tier; their move lists are worked out in node with the tree's own
# tools/solver.js (weighted A* for tiles) and puzzles.js (full search for blocks), then tapped in the page like before.
import json,subprocess
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NODE_SOLVE="const P=require(process.argv[1]+'/puzzles.js'),S=require(process.argv[1]+'/tools/solver.js');const g=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(g.pz.t===4?S.wastarTiles(g.pz,g.s):P.bfsBlocks(g.pz,{q:g.s.q},3000000)));"
def node_moves(pg,k):
  g=ev(pg,'k=>{const s6=SOTA.rpg.s6;return k===2?s6.finalLock2():s6.finalLock3();}',k)
  r=subprocess.run(['node','-e',NODE_SOLVE,ROOT],input=json.dumps(g),capture_output=True,text=True,timeout=180)
  T.check(r.returncode==0,f'node solver failed {r.stderr[:300]}');m=json.loads(r.stdout);T.check(m,f'no moves for lock {k}');return m
SPEND_ALL='''(()=>{const L=SOTA.rpg.live(),M={warrior:"str",rogue:"sta",archer:"sta",mage:"man"};
 L.party.forEach(c=>{while(c.lvl<50)RPG.gainXp(c,RPG.xpNeed(c.lvl),1);let k=0;for(let g=0;g<400;g++){const st=(k++%3===2)?"con":M[c.cls];if(!RPG.raise(c,st)&&!RPG.raise(c,st==="con"?M[c.cls]:"con"))break;}
  while(c.skills.length<RPG.skillSlots(c.lvl)){const k2=RPG.SKILLS[c.cls].find(x=>!c.skills.includes(x.id));if(!k2)break;RPG.learn(c,k2.id);}c.hp=RPG.maxHp(c,1);c.mp=RPG.maxMp(c);});})()'''
LOCKS_JS='(()=>{const s=SOTA.rpg.s6.st();return [s.finalLock===true,s.finalLock2===true,s.finalLock3===true]})()'
OVL_JS='''(()=>{const d=document.getElementById("s6d"),r=e=>{if(!e)return null;const s=getComputedStyle(e);if(s.display==="none"||s.visibility==="hidden")return null;const b=e.getBoundingClientRect();return b.width&&b.height?[b.left,b.top,b.right,b.bottom].map(Math.round):null;};
 const w=r(d.querySelector(".s6wall")),bx=r(d.querySelector(".s6box")),pf=r(d.querySelector(".s6pf")),ov=(a,b)=>a&&b?Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1])):0;
 const im=d.querySelector(".s6wall");return {wall:w,box:bx,pf,ovBox:ov(w,bx),ovPf:ov(w,pf),loaded:!!(im&&im.complete&&im.naturalWidth),vw:innerWidth,vh:innerHeight};})()'''
def lock():return PG[0] is not None and ev(PG[0],'!!document.querySelector(".s7lock")')
def opendis():return ev(PG[0],'(()=>{const b=[...document.querySelectorAll(".s6btns button")].find(x=>/Open the door/.test(x.textContent));return b?b.disabled:null})()')
PG=[None]
def check_layout(pg,tag,label):
  pg.wait_for_timeout(350);o=ev(pg,OVL_JS);say(f'[{tag}] fix1 (c) {label}: letter {o["wall"]} box {o["box"]} portrait {o["pf"]} overlap box {o["ovBox"]} px2, portrait {o["ovPf"]} px2')
  T.check(o['wall'] is not None and o['loaded'],f'{label}: letter art not shown')
  T.check(o['ovBox']==0 and o['ovPf']==0,f'{label}: letter art is covered {o}')
  T.check(o['wall'][1]>=0 and o['wall'][3]<=o['vh'] and o['wall'][0]>=0 and o['wall'][2]<=o['vw'],f'{label}: letter art off screen {o}')
  T.check(o['wall'][3]-o['wall'][1]>=150,f'{label}: letter art too small {o}')
  return o
def approach_centre(pg,tag):
  near=ev(pg,'''(()=>{const N=SOTA.N,c=MAZE.centre,D=SOTA.core.DIRS,dist=new Map([[c[1]*N+c[0],0]]),q=[c[1]*N+c[0]];for(let k=0;k<q.length;k++){const i=q[k],x=i%N,y=(i/N)|0;for(let d=0;d<4;d++){if(!SOTA.canMove(x,y,d))continue;const nx=x+D[d][0],ny=y+D[d][1],j=ny*N+nx;if(dist.has(j)||SOTA.roomAt(nx,ny)>=0)continue;dist.set(j,dist.get(i)+1);q.push(j);}}
   const k=[...dist.entries()].find(([j,dd])=>dd===8&&Math.abs(j%N-c[0])+Math.abs(((j/N)|0)-c[1])>3);return k?[k[0]%N,(k[0]/N)|0]:null;})()''')
  T.check(near is not None,'no cell 8 steps from the centre');ev(pg,f'SOTA.teleport({near[0]},{near[1]},0)');pg.wait_for_timeout(400)
  cen=ev(pg,'MAZE.centre')
  for _ in range(60):
    if story(pg):break
    if T.ui(pg)=='fight':r=fight(pg);say(f'[{tag}] fight near the centre: {r}');after_fight(pg);continue
    walk_to(pg,cen,maxsteps=1)
  return drain(pg,stop=lambda:lock() or opendis() is not None)
def solve_locks(pg,tag):
  shot(pg,f'{tag}-04-boss-door-lock1.png');check_layout(pg,tag,'lock 1')
  T.check(opendis() is True,'Open the door is not locked before the 3 locks')
  sol=ev(pg,SOLVE_JS,1);say(f'[{tag}] lock 1 (Lights Out) taps {sol}')
  for i in sol:T.ttap(pg,f'[data-s7light="{i}"]');pg.wait_for_timeout(60)
  T.check(ev(pg,'SOTA.rpg.s6.st().finalLock===true'),'lock 1 not solved');T.check(ev(pg,'!!document.querySelector("[data-s7lock=\\"2\\"]")'),'lock 2 did not follow lock 1')
  T.check(opendis() is True,'door opened after 1 lock');shot(pg,f'{tag}-05-boss-door-lock2.png');check_layout(pg,tag,'lock 2')
  sol=node_moves(pg,2);say(f'[{tag}] lock 2 (sliding tiles) {len(sol)} taps')
  for p in sol:T.ttap(pg,f'[data-s7tile="{p}"]');pg.wait_for_timeout(40)
  T.check(ev(pg,'SOTA.rpg.s6.st().finalLock2===true'),'lock 2 not solved');T.check(ev(pg,'!!document.querySelector("[data-s7lock=\\"3\\"]")'),'lock 3 did not follow lock 2');T.check(opendis() is True,'door opened after 2 locks')
  check_layout(pg,tag,'lock 3');shot(pg,f'fix1/{tag}-lock3-layout.png');shot(pg,f'{tag}-05b-boss-door-lock3.png')
  sol=node_moves(pg,3);say(f'[{tag}] lock 3 (moving blocks) {len(sol)} moves')
  for (bi,d) in sol:
    T.ttap(pg,f'[data-s7blk="{bi}"]');pg.wait_for_timeout(30);T.ttap(pg,f'[data-s7dir="{d}"]');pg.wait_for_timeout(30)
  T.check(ev(pg,'SOTA.rpg.s6.st().finalLock3===true'),'lock 3 not solved');T.check(opendis() is False,'door still locked after 3 locks')
def run(p,w,h,tag):
  b=p.chromium.launch();c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=w<h,service_workers='block')
  pg=c.new_page();PG[0]=pg;hook(pg,tag);t0=time.time()
  pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);ev(pg,'localStorage.clear()')
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);ev(pg,'SOTA.setAnim(false)');T.past_title(pg)
  ver=ev(pg,'fetch("sw.js").then(r=>r.text()).then(t=>t.match(/VER="(\\d+)"/)[1])');say(f'[{tag}] loaded in {time.time()-t0:.1f}s; VER {ver}; maxZone',ev(pg,'SOTA_CONTENT_CAP.DEFAULT.maxZone'))
  T.check(ver=='107','VER is not 107');T.check(ev(pg,'SOTA_CONTENT_CAP.DEFAULT.maxZone')==5,'cap is not zones 1-5');T.check(not ERRS,f'errors on load {ERRS}')
  T.full_create(pg,'Tess','human','warrior');drain(pg)
  ev(pg,'''(()=>{const L=SOTA.rpg.live(),h=L.party[0];const s=SOTA.rpg.s6.st();
   for(const d of [RPG.COMPANIONS[0],RPG.COMPANIONS[1]])L.party.push(RPG.makeCompanion(d,45));s.seen.join0=1;s.seen.join1=1;
   h.bag.push("tent","tent","tent","tent","potion","potion","potion","ether","ether","salts");L.gold=3000;L.campTut="done";})()''');ev(pg,SPEND_ALL)
  # ---- Tavern 4 archway (Brunn joins), then the Zone 5 tab: 4-slot save picker, no wait text
  ev(pg,'SOTA.teleport(47,48,3)');pg.wait_for_timeout(300);wait_quiet(pg);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(500);drain(pg)
  if T.ui(pg)!='tavern':T.ttap(pg,'#s5here');drain(pg)
  names=ev(pg,'SOTA.rpg.live().party.map(c=>c.name+" "+c.cls)');say(f'[{tag}] Tavern 4 party {names}')
  T.check(T.ui(pg)=='tavern','Tavern 4 not open');T.check(ev(pg,'[...document.querySelectorAll("[data-hub]")].map(b=>b.textContent)')==['Zone 4','Shop','Zone 5'],'tavern 4 hub')
  ev(pg,SPEND_ALL)
  pg.wait_for_timeout(1600);T.ttap(pg,'[data-hub="2"]');pg.wait_for_timeout(300)
  T.check(T.ui(pg)=='save-picker' and ev(pg,'document.querySelectorAll("[data-save-slot]").length')==4,'Zone 5 tab did not open the save picker')
  T.check(WAIT not in ev(pg,'document.body.innerText'),'Zone 5 tab shows the wait text')
  T.ttap(pg,'[data-save-slot="1"]');pg.wait_for_timeout(400);drain(pg)
  s=ev(pg,'SOTA.state()');T.check([s['x'],s['y'],s['zone']]==[46,48,5],f'not in zone 5 after the 4-5 seam {s}');say(f'[{tag}] seam 4-5 -> {s}; save slot 2 at',ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot1")).at.name'))
  T.check(ev(pg,'document.getElementById("hud").textContent').startswith('Zone 5'),'HUD not zone 5')
  shot(pg,f'{tag}-01-zone5-maze.png')
  # ---- fix1 (b)/(c): from the 46,48 save straight to the centre; boss note; the 3 locks by taps with the letter-art layout checked at
  # each lock; the door; a lost Golem fight (forced loss after one real round, test hook); the loss text names where the party is
  letter=approach_centre(pg,tag)
  T.check(lock(),'lock box did not appear');T.check(letter and letter[0][0]=='boss','boss scene did not play')
  say(f'[{tag}] boss note at {ev(pg,"SOTA.state()")}: {len(letter)} lines, speakers {[x[1] for x in letter]}')
  solve_locks(pg,tag)
  T.ttap(pg,'.s6btns button:not([disabled])');pg.wait_for_timeout(700)
  T.check(T.ui(pg)=='fight' and ev(pg,'SOTA.rpg.fight().m[0].boss===true'),'the door did not start the Iron Golem fight')
  one_turn(pg);ev(pg,'SOTA.rpg.forceEnd("lose")');pg.wait_for_timeout(400)
  # fix2 t2731u: the loss opens the Load screen (title's Load Game slot list); the Zone 5 side save is labelled "Tavern 4 (Zone 5 side)"
  act=ev(pg,'SOTA.rpg.activeSlot()');ttl=ev(pg,'(document.querySelector("#s4 .s4title")||{}).textContent||""');note=ev(pg,'(document.getElementById("s4picknote")||{}).textContent||""')
  lab=ev(pg,f'document.querySelector("[data-save-slot=\\"{act}\\"]").textContent')
  say(f'[{tag}] fix2 loss -> {T.ui(pg)} "{ttl}"; note "{note}"; slot {act+1}: "{lab}"')
  T.check(T.ui(pg)=='save-picker' and ttl=='Load a save','the loss did not open the Load screen');T.check(note.startswith('Everyone is knocked out. Pick a save to load.'),'loss note')
  T.check(lab.endswith('· Tavern 4 (Zone 5 side)'),'slot label for the Zone 5 side');T.check(not ev(pg,'!!document.getElementById("fdone")'),'Return to last save still shown')
  shot(pg,f'fix2/{tag}-loss-load-screen.png');shot(pg,f'fix2/{tag}-slot-list-label.png')
  T.ttap(pg,f'[data-save-slot="{act}"]');pg.wait_for_timeout(250);toast=ev(pg,'document.getElementById("s4toast").textContent')
  s=ev(pg,'SOTA.state()');say(f'[{tag}] fix2 after loading slot {act+1}: toast "{toast}" at {s}; locks {ev(pg,LOCKS_JS)}')
  T.check(toast=='Back at the Zone 5 side of Tavern 4','loss toast');T.check([s['x'],s['y'],s['zone']]==[46,48,5],'not back at 46,48')
  T.check(ev(pg,LOCKS_JS)==[True,True,True],'locks lost by the loss');shot(pg,f'fix2/{tag}-after-loss-load-toast.png')
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);ev(pg,'SOTA.setAnim(false)');T.past_title(pg);pg.wait_for_timeout(800);drain(pg)
  s=ev(pg,'SOTA.state()');say(f'[{tag}] fix1 (b) after the loss + reload + Continue: {s}; locks {ev(pg,LOCKS_JS)}')
  T.check([s['x'],s['y']]==[46,48] and ev(pg,LOCKS_JS)==[True,True,True],'locks lost by the reload')
  ev(pg,SPEND_ALL)
  # ---- walk by taps to the nearest zone 5 camp and save there
  camp=ev(pg,'''(()=>{const N=SOTA.N,s=SOTA.state(),D=SOTA.core.DIRS,dist=new Map([[s.y*N+s.x,0]]),q=[s.y*N+s.x];for(let k=0;k<q.length;k++){const i=q[k],x=i%N,y=(i/N)|0;for(let d=0;d<4;d++){if(!SOTA.canMove(x,y,d)||(SOTA.archAhead&&SOTA.archAhead(x,y,d)>=0))continue;const nx=x+D[d][0],ny=y+D[d][1],j=ny*N+nx;if(dist.has(j)||SOTA.roomAt(nx,ny)>=0)continue;dist.set(j,dist.get(i)+1);q.push(j);}}
   return MAZE.camps.filter(c=>+MAZE.zone[c[1]*N+c[0]]===5&&dist.has(c[1]*N+c[0])).sort((a,b)=>dist.get(a[1]*N+a[0])-dist.get(b[1]*N+b[0]))[0];})()''')
  s=walk_to(pg,camp);T.check([s['x'],s['y']]==list(camp),f'did not reach camp {camp}: {s}');say(f'[{tag}] walked by taps to zone 5 camp {camp}; walk fights {walk_fights}')
  if story(pg):drain(pg)
  if T.ui(pg)!='camp':T.ttap(pg,'#s5here')
  drain(pg);T.check(T.ui(pg)=='camp','zone 5 camp did not open');shot(pg,f'{tag}-02-zone5-camp.png')
  ok=ev(pg,'SOTA.rpg.doSave()');drain(pg)
  sv=ev(pg,'(()=>{const o=JSON.parse(localStorage.getItem("sota.party.slot"+SOTA.rpg.activeSlot()));return {at:o.at.name,x:o.at.x,y:o.at.y,party:o.party.map(c=>c.name)}})()');say(f'[{tag}] zone 5 camp save: {ok} {sv}')
  T.check([sv['x'],sv['y']]==list(camp),'zone 5 camp save not at the camp');ev(pg,'SOTA.rpg.closeUI()')
  # ---- a fixed zone 5 pack by taps: Shadow drake (veil) + Hydra (regrow) + Salamander (burn)
  ev(pg,'(()=>{const L=SOTA.rpg.live(),lv=RPG.partyLevel(L.party);SOTA.rpg.startFight([RPG.makeMonster(5,6,lv,0.5,L.diff),RPG.makeMonster(5,2,lv,0.5,L.diff),RPG.makeMonster(5,5,lv,0.5,L.diff)])})()')
  foes=ev(pg,'SOTA.rpg.fight().m.map(m=>m.n+" ("+m.mech+")")');T.check(ev(pg,'document.getElementById("fen").textContent').find('shields others')>=0,'veil status word not shown')
  pg.wait_for_timeout(500)
  col=ev(pg,'''(()=>{const c=document.getElementById("fcv"),g=c.getContext("2d"),W=c.width,H=c.height,d=g.getImageData(Math.round(W*.05),Math.round(H*.08),Math.round(W*.9),Math.round(H*.25)).data;let r=0,gg=0,b=0,n=0;for(let i=0;i<d.length;i+=16){r+=d[i];gg+=d[i+1];b+=d[i+2];n++;}return [r/n,gg/n,b/n].map(Math.round);})()''')
  say(f'[{tag}] zone 5 backdrop wall colour (avg RGB) {col}');T.check(col[2]>col[1] and col[0]>col[1],f'zone 5 battle backdrop is not purple {col}')
  def mid(k):
    if k==4:shot(pg,f'{tag}-03-zone5-fight.png')
    return False
  r=fight(pg,on_turn=mid);say(f'[{tag}] zone 5 pack {foes}: {r}; lines seen {sorted(seen_lines)}');T.check(r=='win','zone 5 pack lost');after_fight(pg)
  T.check('veil shields it' in seen_lines or 'grows back a head' in seen_lines or 'catches fire' in seen_lines,'no zone 5 mechanic line in the log')
  # ---- save/load in zone 5: reload, Continue from the title
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);ev(pg,'SOTA.setAnim(false)');T.past_title(pg);pg.wait_for_timeout(800);drain(pg)
  s=ev(pg,'SOTA.state()');names2=ev(pg,'SOTA.rpg.live()&&SOTA.rpg.live().party.map(c=>c.name)');say(f'[{tag}] after reload + Continue: {s} party {names2}')
  T.check([s['x'],s['y'],s['zone']]==[camp[0],camp[1],5],f'load did not restore the zone 5 save {s}');T.check(names2==sv['party'],'party changed by load')
  # ---- walk by taps to the centre; the boss note (letter) plays again (the lost fight's save came before it). fix1 (b): the three locks
  # solved before the lost fight are still solved after the loss, a reload, a camp save and another reload: the door opens at once
  ev(pg,'SOTA.rpg.live().party.forEach(c=>{c.hp=RPG.maxHp(c,1);c.mp=RPG.maxMp(c);c.bag.push("potion","potion","ether");c.buff={str:0,sta:25,f:3,n:"Hunter\'s stew"};})')
  letter=approach_centre(pg,tag)
  T.check(not lock() and opendis() is False,'fix1: the solved locks were asked for again');say(f'[{tag}] fix1 (b): door open at once, locks kept {ev(pg,LOCKS_JS)}')
  shot(pg,f'{tag}-06-boss-door-open.png');shot(pg,f'fix1/{tag}-boss-door-locks-kept.png')
  T.ttap(pg,'.s6btns button:not([disabled])');pg.wait_for_timeout(700)
  T.check(T.ui(pg)=='fight' and ev(pg,'SOTA.rpg.fight().m[0].boss===true'),'the door did not start the Iron Golem fight')
  # ---- the Golem by taps: one plain Attack (iron skin), then the sensible player; after 6 real rounds the HP is set low (time)
  rounds=lambda:ev(pg,'SOTA.rpg.fight().turn')
  st0={'first':False,'shot':False,'cut':False}
  def gturn(k):
    if not st0['first']:
      st0['first']=True;one_turn(pg,force_attack=True);return True
    if rounds()>=4 and not st0['shot']:st0['shot']=True;shot(pg,f'{tag}-07-golem-fight.png')
    if rounds()>=6 and not st0['cut']:
      st0['cut']=True;hp=ev(pg,'SOTA.rpg.fight().m[0].hp');ev(pg,'SOTA.rpg.fight().m[0].hp=Math.min(SOTA.rpg.fight().m[0].hp,40)');say(f'[{tag}] Golem HP {hp} -> 40 after 6 real rounds (time)')
    return False
  r=fight(pg,on_turn=gturn);gl=ev(pg,'SOTA.rpg.fight().log');say(f'[{tag}] Golem fight: {r} after {rounds()} rounds; KO {ev(pg,"SOTA.rpg.live().party.filter(c=>c.hp<=0).length")}; lines seen {sorted(k for k in seen_lines if k in KEYS[10:])}')
  T.check(r=='win','Golem fight not won')
  for k in ['Iron skin','raises both fists','sweeps','eye locks on']:T.check(any(k in t for t in gl),f'Golem line missing: {k}')
  shot(pg,f'{tag}-08-golem-victory.png');T.ttap(pg,'#fdone');pg.wait_for_timeout(600)
  def ending(expect):
    ev(pg,'SOTA.rpg.s6&&SOTA.rpg.s6.setSpeed(0)');k=ev(pg,'SOTA.rpg.s6.endingFor()');T.check(k==expect,f'ending for these walls is {k}, not {expect}')
    lines=drain(pg,stop=lambda:ev(pg,'(document.getElementById("s6d")||{dataset:{}}).dataset.endScreen==="review"'))
    T.check(ev(pg,'document.getElementById("s6d").dataset.ending')==expect,'ending key on the box');title=ev(pg,'(document.querySelector(".s6title")||{}).textContent||""')
    shot(pg,f'{tag}-09-ending-{expect}-title.png');say(f'[{tag}] ending {expect}: {len(lines)} lines {[x[1] for x in lines]}, title "{title}"')
    T.check(title.startswith('Ending: '),'no ending title');T.ttap(pg,'.s6btns button');pg.wait_for_timeout(400)
    T.check(ev(pg,'document.getElementById("s6d").dataset.endScreen')=='credits','credits did not follow')
    if expect=='high':shot(pg,f'{tag}-10-ending-{expect}-credits.png')
    T.ttap(pg,'.s6btns button');pg.wait_for_timeout(500);T.check(not story(pg),'Back to the maze did not close the ending')
    T.check(ev(pg,'SOTA.rpg.s6.st().ending')==expect,'ending not stored');return title
  def cont():
    T.ttap(pg,'#ititle-cont');pg.wait_for_timeout(700);drain(pg);T.check(not ev(pg,'SOTA.intro.titleOpen()'),'Continue did not close the title')
  def end_save(expect,choice):
    """fix2 (t2730u): after the credits the "End of game save" picker (no tent), then the main menu whether saved or not"""
    pg.wait_for_timeout(300);T.check(T.ui(pg)=='save-picker' and ev(pg,'document.querySelectorAll("[data-save-slot]").length')==4,f'no save offer after the {expect} ending')
    ttl=ev(pg,'document.querySelector("#s4 .s4title").textContent');T.check(ttl=='End of game save',f'picker heading {ttl}')
    tents0=ev(pg,'SOTA.rpg.live().party.flatMap(c=>c.bag).filter(x=>x==="tent").length');wear0=ev(pg,'SOTA.rpg.live().tentWear')
    shot(pg,f'fix2/{tag}-ending-{expect}-end-save-picker.png');act=ev(pg,'SOTA.rpg.activeSlot()');before=ev(pg,f'localStorage.getItem("sota.party.slot{act}")')
    if choice=='save':T.ttap(pg,f'[data-save-slot="{act}"]')
    else:T.ttap(pg,'#s4 .s4back')
    pg.wait_for_timeout(400);o=ev(pg,f'JSON.parse(localStorage.getItem("sota.party.slot{act}"))');title=ev(pg,'SOTA.intro.titleOpen()')
    btns=ev(pg,'[...document.querySelectorAll("#ititle-menu button")].map(b=>b.textContent)')
    say(f'[{tag}] fix2 {expect} ending: "{ttl}" -> {choice}; main menu {title} {btns}; slot {act+1} at {o["at"]}, story golemDefeated {o["story"].get("golemDefeated")} ending {o["story"].get("ending")}')
    T.check(T.ui(pg) is None and title,'no main menu after the end-of-game save step');shot(pg,f'fix2/{tag}-title-after-{expect}-{choice}.png')
    T.check(ev(pg,'SOTA.rpg.live().party.flatMap(c=>c.bag).filter(x=>x==="tent").length')==tents0 and ev(pg,'SOTA.rpg.live().tentWear')==wear0,'end save used a tent')
    if choice=='save':
      T.check(o['story'].get('golemDefeated') is True and o['story'].get('ending')==expect,'win/ending not in the save');T.check(o['at']['name']=='the centre door','end save name')
    else:T.check(ev(pg,f'localStorage.getItem("sota.party.slot{act}")')==before,'declined save wrote the slot')
    return o
  titles={'low':ending('low')}
  T.check(ev(pg,'SOTA.rpg.s6.st().golemDefeated===true'),'golemDefeated not stored')
  o=end_save('low','save')
  cont();sv=ev(pg,'(()=>{const s=SOTA.rpg.s6.st();return {golemDefeated:s.golemDefeated,ending:s.ending}})()');say(f'[{tag}] fix2 Continue from the main menu: {ev(pg,"SOTA.state()")} {sv}')
  T.check(sv=={'golemDefeated':True,'ending':'low'},'Continue lost the win');T.check(T.ui(pg) is None,'offer again after Continue')
  # ---- reload: the title offers Continue (slot label shows the centre door); Continue keeps the win and the ending, no new offer
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);ev(pg,'SOTA.setAnim(false)');pg.wait_for_function('SOTA.intro&&SOTA.intro.titleOpen()',timeout=8000)
  btns=ev(pg,'[...document.querySelectorAll("#ititle-menu button")].map(b=>b.textContent)');lab=ev(pg,'SOTA.rpg.saveSlots().map(o=>o?o.party[0].name+" · "+SOTA.rpg.slotName(o.at):"Empty")')
  shot(pg,f'fix2/{tag}-title-after-reload.png');say(f'[{tag}] fix2 title after the win + reload: buttons {btns}; slots {lab}')
  T.check('Continue' in btns,'no Continue on the title');cont()
  s=ev(pg,'SOTA.state()');sv=ev(pg,'(()=>{const s=SOTA.rpg.s6.st();return {golemDefeated:s.golemDefeated,ending:s.ending}})()')
  say(f'[{tag}] fix2 after reload + Continue: {s} story {sv}; ui {T.ui(pg)}; centre door shown {ev(pg,"getComputedStyle(document.getElementById(\"s7door\")).display")}')
  T.check(sv=={'golemDefeated':True,'ending':'low'},'win/ending lost by the reload');T.check([s['x'],s['y']]==[o['at']['x'],o['at']['y']],'not at the end save spot')
  pg.wait_for_timeout(500);T.check(T.ui(pg) is None,'save offered again after Continue');shot(pg,f'fix2/{tag}-after-reload-continue.png')
  ra=ev(pg,'SOTA.rpg.s6.roomArt()');z305=[k for k,v in ra.items() if v[1].startswith('zone3-05-')]
  for key,walls,choice in [('mid',{z305[0]:1},'decline'),('high',{k:1 for k in ra},'save')]:
    ev(pg,'w=>{const s=SOTA.rpg.s6.st();s.walls=w;s.ending=null;}',walls)
    ev(pg,'SOTA.teleport(MAZE.centre[0],MAZE.centre[1],0)');pg.wait_for_timeout(600)
    T.check(ev(pg,'getComputedStyle(document.getElementById("s7door")).display')=='block','centre door button not shown')
    T.ttap(pg,'#s7door');pg.wait_for_timeout(300);titles[key]=ending(key);end_save(key,choice);cont()
    if choice=='decline':T.check(ev(pg,'SOTA.rpg.s6.st().golemDefeated===true'),'decline + Continue lost the in-memory win')
  say(f'[{tag}] ending titles {titles}')
  # ---- fix2: a zone 1-4 seam cell (Tavern 1's Zone 2 side, 14,48) keeps the live wording; Back on the loss Load screen -> last save + main menu
  ev(pg,'SOTA.rpg.closeUI();SOTA.teleport(14,48,0)');pg.wait_for_timeout(500);drain(pg);ev(pg,'SOTA.rpg.closeUI()')
  T.check(ev(pg,'SOTA.rpg.doSave()'),'no save at 14,48');nm=ev(pg,'SOTA.rpg.save().at.name');T.check(nm=='Tavern 1',f'14,48 save name {nm}')
  for back in (True,False):
    ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])');pg.wait_for_timeout(300);ev(pg,'SOTA.rpg.forceEnd("lose")');pg.wait_for_timeout(400)
    act=ev(pg,'SOTA.rpg.activeSlot()');lab=ev(pg,f'document.querySelector("[data-save-slot=\\"{act}\\"]").textContent');T.check(T.ui(pg)=='save-picker' and lab.endswith('· Tavern 1'),f'seam-cell slot label {lab}')
    if back:
      shot(pg,f'fix2/{tag}-seam-cell-loss-load-screen.png');T.ttap(pg,'#s4 .s4back');pg.wait_for_timeout(400);s=ev(pg,'SOTA.state()')
      say(f'[{tag}] fix2 Back on the loss Load screen: main menu {ev(pg,"SOTA.intro.titleOpen()")}, fight {ev(pg,"!!SOTA.rpg.fight()")}, at {s}')
      T.check(ev(pg,'SOTA.intro.titleOpen()') and not ev(pg,'!!SOTA.rpg.fight()') and [s['x'],s['y']]==[14,48],'Back did not load the last save + main menu')
      shot(pg,f'fix2/{tag}-loss-back-title.png');cont()
    else:
      T.ttap(pg,f'[data-save-slot="{act}"]');pg.wait_for_timeout(250);toast=ev(pg,'document.getElementById("s4toast").textContent');say(f'[{tag}] fix2 zone 1-4 seam cell loss toast "{toast}"')
      T.check(toast=='Back at Tavern 1','zone 1-4 seam-cell loss text is not the live text');shot(pg,f'fix2/{tag}-seam-cell-loss-text.png')
  # after a load the maze ignores input for 750 ms and until a fresh pointerdown (the turn tap itself), so wait out the timer only
  f0=ev(pg,'SOTA.state().f');pg.wait_for_timeout(800);T.ttap(pg,'[data-cmd=right]');pg.wait_for_timeout(300);T.check(ev(pg,'SOTA.state().f')==(f0+1)%4,'maze does not turn (freeze?)')
  b.close();return titles
def main():
  passed=failed=0
  with sync_playwright() as p:
    for (w,h,tag) in [(412,891,'412'),(1280,800,'1280')]:
      n0=len(ERRS)
      try:
        run(p,w,h,tag);T.check(len(ERRS)==n0,f'page/console errors: {ERRS[n0:]}');print(f'PASS zone 5 e2e {tag}',flush=True);passed+=1
      except Exception as e:
        print(f'FAIL zone 5 e2e {tag}: {e}',flush=True);failed+=1
  print('page/console errors:',len(ERRS))
  for e in ERRS:print('  ',e[:400])
  print(f'{passed} passed, {failed} failed');print('screenshots:');[print('  '+s) for s in SHOTLIST]
  sys.exit(0 if failed==0 and not ERRS else 1)
main()
