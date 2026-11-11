"""Jeremy t2721u: zone 5 end-to-end, story ON, one browser and one page at a time. Sizes 412x891 (phone, touch) and 1280x800.
Per size: loads with no console/page errors (VER 103, maxZone 5), creates a hero by taps, a L50 hero+Mira+Sorrel party bumps the
Tavern 4 archway (Brunn joins), takes Tavern 4's Zone 5 exit through the 4-slot save picker into zone 5 (46,48), walks by taps to a
zone 5 camp (fights on the way by taps) and saves there, fights a fixed zone 5 pack by taps (Shadow drake veil, Hydra regrow,
Salamander burn) and checks the zone 5 lines show and the battle backdrop is purple, reloads and continues the zone 5 save
(save/load in zone 5), walks by taps to the centre: the boss note (letter) plays, then the 3 locks are solved IN ORDER by taps
(lever lock FINAL_LOCK, sliding tiles, moving blocks), the door opens the Iron Golem fight, real rounds are played by taps
(iron skin, sweep warning, eye lock lines checked); after 6 real rounds the Golem's HP is set low and the fight is finished by taps
(time), the ending plays to its title and credits; the other two endings are then opened from the centre door with the wall-art
sets that select them (low: none, mid: zone3-05 only, high: all 28 art rooms). Finally the maze still turns (no freeze), 0 errors.
Shots: /workspace/zone5-shots/ (or $Z5SHOTS). Usage: python tests/t2721u_zone5_e2e_browser_test.py http://127.0.0.1:PORT/"""
import sys,os,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:19811/').rstrip('/')+'/'
SHOTS=os.environ.get('Z5SHOTS','/workspace/zone5-shots');os.makedirs(SHOTS,exist_ok=True)
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
def wait_quiet(pg):pg.wait_for_function('!(SOTA.mazeInputQuiet&&SOTA.mazeInputQuiet())',timeout=4000)
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
KEYS=['veil shields it','grows a head back','catches fire','Fire burns','fire is out','thick hide','stares down','breathes fire on','eyes start to glow','breathes in',
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
 if(k===1){const {pz,s}=s6.finalLock();for(let m=0;m<(1<<pz.L);m++){let x=s;for(let i=0;i<pz.L;i++)if(m>>i&1)x=P.apply(pz,x,i);if(P.solved(pz,x))return [...Array(pz.L).keys()].filter(i=>m>>i&1);}return null;}
 if(k===2){const {pz,s}=s6.finalLock2(),n=pz.n,h=x=>x.reduce((d,v,p)=>v?d+Math.abs((v-1)%n-p%n)+Math.abs(((v-1)/n|0)-(p/n|0)):d,0);const pp=[];
  const dfs=(x,g,lim,prev)=>{const f=g+h(x.a);if(f>lim)return f;if(P.solved(pz,x))return true;let mn=1e9;for(const p of P.tileNb(n,x.a.indexOf(0))){if(p===prev)continue;pp.push(p);const r=dfs(P.apply(pz,x,p),g+1,lim,x.a.indexOf(0));if(r===true)return true;pp.pop();mn=Math.min(mn,r);}return mn;};
  let lim=h(s.a);for(let i=0;i<80;i++){const r=dfs(s,0,lim,-1);if(r===true)return pp.slice();lim=r;}return null;}
 const {pz,s}=s6.finalLock3();return P.bfsBlocks(pz,s,300000);}'''
SPEND_ALL='''(()=>{const L=SOTA.rpg.live(),M={warrior:"str",rogue:"sta",archer:"sta",mage:"man"};
 L.party.forEach(c=>{while(c.lvl<50)RPG.gainXp(c,RPG.xpNeed(c.lvl),1);let k=0;for(let g=0;g<400;g++){const st=(k++%3===2)?"con":M[c.cls];if(!RPG.raise(c,st)&&!RPG.raise(c,st==="con"?M[c.cls]:"con"))break;}
  while(c.skills.length<RPG.skillSlots(c.lvl)){const k2=RPG.SKILLS[c.cls].find(x=>!c.skills.includes(x.id));if(!k2)break;RPG.learn(c,k2.id);}c.hp=RPG.maxHp(c,1);c.mp=RPG.maxMp(c);});})()'''
def run(p,w,h,tag):
  b=p.chromium.launch();c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=w<h,service_workers='block')
  pg=c.new_page();hook(pg,tag);t0=time.time()
  pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);ev(pg,'localStorage.clear()')
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);ev(pg,'SOTA.setAnim(false)');T.past_title(pg)
  ver=ev(pg,'fetch("sw.js").then(r=>r.text()).then(t=>t.match(/VER="(\\d+)"/)[1])');say(f'[{tag}] loaded in {time.time()-t0:.1f}s; VER {ver}; maxZone',ev(pg,'SOTA_CONTENT_CAP.DEFAULT.maxZone'))
  T.check(ver=='103','VER is not 103');T.check(ev(pg,'SOTA_CONTENT_CAP.DEFAULT.maxZone')==5,'cap is not zones 1-5');T.check(not ERRS,f'errors on load {ERRS}')
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
  T.check('veil shields it' in seen_lines or 'grows a head back' in seen_lines or 'catches fire' in seen_lines,'no zone 5 mechanic line in the log')
  # ---- save/load in zone 5: reload, Continue from the title
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);ev(pg,'SOTA.setAnim(false)');T.past_title(pg);pg.wait_for_timeout(800);drain(pg)
  s=ev(pg,'SOTA.state()');names2=ev(pg,'SOTA.rpg.live()&&SOTA.rpg.live().party.map(c=>c.name)');say(f'[{tag}] after reload + Continue: {s} party {names2}')
  T.check([s['x'],s['y'],s['zone']]==[camp[0],camp[1],5],f'load did not restore the zone 5 save {s}');T.check(names2==sv['party'],'party changed by load')
  # ---- walk by taps to the centre; the boss note (letter) plays, then the lock box
  ev(pg,'SOTA.rpg.live().party.forEach(c=>{c.hp=RPG.maxHp(c,1);c.mp=RPG.maxMp(c);c.bag.push("potion","potion","ether");c.buff={str:0,sta:25,f:3,n:"Hunter\'s stew"};})')
  near=ev(pg,'''(()=>{const N=SOTA.N,c=MAZE.centre,D=SOTA.core.DIRS,dist=new Map([[c[1]*N+c[0],0]]),q=[c[1]*N+c[0]];for(let k=0;k<q.length;k++){const i=q[k],x=i%N,y=(i/N)|0;for(let d=0;d<4;d++){if(!SOTA.canMove(x,y,d))continue;const nx=x+D[d][0],ny=y+D[d][1],j=ny*N+nx;if(dist.has(j)||SOTA.roomAt(nx,ny)>=0)continue;dist.set(j,dist.get(i)+1);q.push(j);}}
   const k=[...dist.entries()].find(([j,dd])=>dd===8&&Math.abs(j%N-c[0])+Math.abs(((j/N)|0)-c[1])>3);return k?[k[0]%N,(k[0]/N)|0]:null;})()''')
  T.check(near is not None,'no cell 8 steps from the centre');ev(pg,f'SOTA.teleport({near[0]},{near[1]},0)');pg.wait_for_timeout(400)
  cen=ev(pg,'MAZE.centre');lock=lambda:ev(pg,'!!document.querySelector(".s7lock")')
  for _ in range(60):
    if story(pg):break
    if T.ui(pg)=='fight':r=fight(pg);say(f'[{tag}] fight near the centre: {r}');after_fight(pg);continue
    walk_to(pg,cen,maxsteps=1)
  letter=drain(pg,stop=lock);say(f'[{tag}] boss note at {ev(pg,"SOTA.state()")}: {len(letter)} lines, speakers {[x[1] for x in letter]}; scene {letter[0][0] if letter else ""}')
  T.check(lock(),'lock box did not appear');T.check(letter and letter[0][0]=='boss','boss scene did not play')
  shot(pg,f'{tag}-04-boss-door-lock1.png')
  opendis=lambda:ev(pg,'(()=>{const b=[...document.querySelectorAll(".s6btns button")].find(x=>/Open the door/.test(x.textContent));return b?b.disabled:null})()')
  T.check(opendis() is True,'Open the door is not locked before the 3 locks')
  sol=ev(pg,SOLVE_JS,1);say(f'[{tag}] lock 1 (levers) taps {sol}')
  for i in sol:T.ttap(pg,f'[data-s7lever="{i}"]');pg.wait_for_timeout(60)
  T.check(ev(pg,'SOTA.rpg.s6.st().finalLock===true'),'lock 1 not solved');T.check(ev(pg,'!!document.querySelector("[data-s7lock=\\"2\\"]")'),'lock 2 did not follow lock 1')
  T.check(opendis() is True,'door opened after 1 lock');shot(pg,f'{tag}-05-boss-door-lock2.png')
  sol=ev(pg,SOLVE_JS,2);say(f'[{tag}] lock 2 (sliding tiles) {len(sol)} taps')
  for p in sol:T.ttap(pg,f'[data-s7tile="{p}"]');pg.wait_for_timeout(40)
  T.check(ev(pg,'SOTA.rpg.s6.st().finalLock2===true'),'lock 2 not solved');T.check(ev(pg,'!!document.querySelector("[data-s7lock=\\"3\\"]")'),'lock 3 did not follow lock 2');T.check(opendis() is True,'door opened after 2 locks')
  sol=ev(pg,SOLVE_JS,3);say(f'[{tag}] lock 3 (moving blocks) {len(sol)} moves')
  for (bi,d) in sol:
    T.ttap(pg,f'[data-s7blk="{bi}"]');pg.wait_for_timeout(30);T.ttap(pg,f'[data-s7dir="{d}"]');pg.wait_for_timeout(30)
  T.check(ev(pg,'SOTA.rpg.s6.st().finalLock3===true'),'lock 3 not solved');T.check(opendis() is False,'door still locked after 3 locks');shot(pg,f'{tag}-06-boss-door-open.png')
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
  titles={'low':ending('low')}
  T.check(ev(pg,'SOTA.rpg.s6.st().golemDefeated===true'),'golemDefeated not stored')
  ra=ev(pg,'SOTA.rpg.s6.roomArt()');z305=[k for k,v in ra.items() if v[1].startswith('zone3-05-')]
  for key,walls in [('mid',{z305[0]:1}),('high',{k:1 for k in ra})]:
    ev(pg,'w=>{const s=SOTA.rpg.s6.st();s.walls=w;s.ending=null;}',walls)
    ev(pg,'SOTA.teleport(MAZE.centre[0],MAZE.centre[1],0)');pg.wait_for_timeout(600)
    T.check(ev(pg,'getComputedStyle(document.getElementById("s7door")).display')=='block','centre door button not shown')
    T.ttap(pg,'#s7door');pg.wait_for_timeout(300);titles[key]=ending(key)
  say(f'[{tag}] ending titles {titles}')
  f0=ev(pg,'SOTA.state().f');wait_quiet(pg);T.ttap(pg,'[data-cmd=right]');pg.wait_for_timeout(300);T.check(ev(pg,'SOTA.state().f')==(f0+1)%4,'maze does not turn (freeze?)')
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
