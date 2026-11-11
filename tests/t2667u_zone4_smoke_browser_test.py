"""t2667u/t2668u smoke (t2659u: smoke only). Story ON (no dev.nostory). One browser, one page at a time.
Per size: loads with no console/page errors, creates a hero by taps, a L30 hero+Mira+Sorrel party bumps the Tavern 3 archway
(seam 3-4), takes Zone 4 by the save picker, fights one zone 4 fight by taps, plays the zone 4 camp talk (STORY.camp.dark) at a
zone 4 camp, checks the party-mix picker with 1-companion and multi-companion parties (TEST talks injected through the test hook
only), checks a zone 1-3 camp talk still plays, bumps the Tavern 4 archway (seam 4-5, Brunn joins), plays the zone 4 tavern talk
(STORY.tavern[3] t3a), checks Zone 5 plays exactly the wait text, then reloads and continues the Tavern 4 save (save/load) and
checks the maze still runs (no freeze). Sizes: 412x891 portrait, 1024x768 landscape; plus 891x412 (phone sideways notice only).
Usage: python tests/t2667u_zone4_smoke_browser_test.py http://127.0.0.1:PORT/"""
import sys,os,json,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:19731/').rstrip('/')+'/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
import splash_helper as SPL
from playwright.sync_api import sync_playwright
WAIT='Please wait for update to continue.'
ERRS=[];LOG=[]
def say(*a):s=' '.join(str(x) for x in a);print('  '+s,flush=True);LOG.append(s)
def ev(pg,js,a=None):return T.ev(pg,js,a)
def hook(pg,tag):
  pg.on('pageerror',lambda e:ERRS.append(f'[{tag}] pageerror: '+(getattr(e,'stack',None) or str(e))))
  pg.on('console',lambda m:ERRS.append(f'[{tag}] console.error: '+m.text+' @ '+str(m.location)) if m.type=='error' else None)
def drain(pg,n=600):
  ev(pg,'SOTA.rpg.s6&&SOTA.rpg.s6.setSpeed(0)');lines=[]
  for _ in range(n):
    if not ev(pg,'!!(SOTA.storyOpen&&SOTA.storyOpen())'):return lines
    cur=ev(pg,'(()=>{const d=document.getElementById("s6d");return d?[d.dataset.scene||"",d.dataset.who||"",(d.querySelector(".s6t")||{}).textContent||""]:null})()')
    if cur and (not lines or lines[-1]!=cur):lines.append(cur)
    ev(pg,'''(()=>{const d=document.getElementById("s6d");if(!d)return;const b=d.querySelector(".s6btns button:not([disabled])");const t=b||d;t.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true}));})()''')
    pg.wait_for_timeout(45)
  raise T.Fail('talk did not finish (freeze?)')
def wait_quiet(pg):pg.wait_for_function('!(SOTA.mazeInputQuiet&&SOTA.mazeInputQuiet())',timeout=4000)
PLAN_JS='''()=>{const L=SOTA.rpg.live(),F=SOTA.rpg.fight(),i=SOTA.rpg.turn(),c=L.party[i];if(!c||c.hp<=0)return null;
 const foes=F.m.map((m,j)=>[m,j]).filter(x=>x[0].hp>0).sort((a,b)=>a[0].hp-b[0].hp),tg=foes.length?foes[0][1]:0;
 const sk=c.skills.map(id=>RPG.SKILLS[c.cls].find(s=>s.id===id)).filter(s=>s&&s.mp<=c.mp);
 const hurt=L.party.some(p=>p.hp>0&&p.hp<RPG.maxHp(p,1)*0.45),heal=sk.find(s=>s.k==="heal");
 const dmg=sk.filter(s=>s.k==="phys"||s.k==="magic").sort((a,b)=>(b.p*(b.all?foes.length:1))-(a.p*(a.all?foes.length:1)))[0];
 if(hurt&&heal)return {who:i,menu:"spells",sk:heal.id,tgt:null};
 if(dmg&&(c.cls==="mage"||c.mp>=dmg.mp*2))return {who:i,menu:dmg.k==="magic"?"spells":"skill",sk:dmg.id,tgt:dmg.all?null:tg};
 return {who:i,menu:"attack",sk:null,tgt:tg};}'''
def fight(pg):
  for _ in range(300):
    r=ev(pg,'document.getElementById("s4").dataset.result||""')
    if r:return r
    p=ev(pg,PLAN_JS)
    if p is None:pg.wait_for_timeout(150);continue
    T.ttap(pg,f'#fparty [data-hero="{p["who"]}"]')
    if p['menu']=='attack':T.ttap(pg,'#s4br [data-cmd4=attack]');T.ttap(pg,f'#s4br [data-tgt="{p["tgt"]}"]')
    else:
      T.ttap(pg,f'#s4br [data-cmd4={p["menu"]}]');T.ttap(pg,f'#s4br [data-sk={p["sk"]}]')
      if p['tgt'] is not None:T.ttap(pg,f'#s4br [data-tgt="{p["tgt"]}"]')
    pg.wait_for_timeout(200)
  raise T.Fail('fight did not end')
def last(pg):return ev(pg,'Z4Banter.test.last().played')
def resave(pg):return ev(pg,'SOTA.rpg.doSave()')
def run(p,w,h,tag):
  b=p.chromium.launch();c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=w<h,service_workers='block')
  pg=c.new_page();hook(pg,tag);t0=time.time()
  pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA&&SOTA.rpg&&window.Z4Banter');SPL.pass_splash(pg);ev(pg,'localStorage.clear()')
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg&&window.Z4Banter');SPL.pass_splash(pg);ev(pg,'SOTA.setAnim(false)');T.past_title(pg)
  say(f'[{tag}] loaded in {time.time()-t0:.1f}s; VER',ev(pg,'fetch("sw.js").then(r=>r.text()).then(t=>t.match(/VER="(\\d+)"/)[1])'),'maxZone',ev(pg,'SOTA_CONTENT_CAP.DEFAULT.maxZone'),'seams',len(ev(pg,'SOTA.seams()')))
  T.check(ev(pg,'SOTA_CONTENT_CAP.DEFAULT.maxZone')==4,'cap not 4');T.check(len(ev(pg,'SOTA.seams()'))==4,'not 4 seams')
  T.full_create(pg,'Tess','human','warrior');drain(pg)
  ev(pg,'''(()=>{const L=SOTA.rpg.live(),h=L.party[0];while(h.lvl<30)RPG.gainXp(h,RPG.xpNeed(h.lvl),1);const s=SOTA.rpg.s6.st();
   for(const d of [RPG.COMPANIONS[0],RPG.COMPANIONS[1]])L.party.push(RPG.makeCompanion(d,30));s.seen.join0=1;s.seen.join1=1;
   h.bag.push("tent","tent","tent","tent","potion","potion","ether");L.gold=1500;L.campTut="done";
   L.party.forEach(c=>{while(c.skills.length<RPG.skillSlots(c.lvl)){const k=RPG.SKILLS[c.cls].find(x=>!c.skills.includes(x.id));if(!k)break;RPG.learn(c,k.id);}c.hp=RPG.maxHp(c,1);c.mp=RPG.maxMp(c);});})()''')
  # ---- seam 3-4: bump the Tavern 3 archway from the zone 3 side, then Zone 4 tab
  ev(pg,'SOTA.teleport(51,14,2)');pg.wait_for_timeout(300);wait_quiet(pg);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(400)
  z3tav=drain(pg);s=ev(pg,'SOTA.state()');T.check([s['x'],s['y']]==[51,14],f'arch did not bump {s}')
  if T.ui(pg)!='tavern':T.ttap(pg,'#s5here');drain(pg)
  T.check(T.ui(pg)=='tavern','Tavern 3 not open');labels=ev(pg,'[...document.querySelectorAll("[data-hub]")].map(b=>b.textContent)');T.check(labels==['Zone 3','Shop','Zone 4'],f'tavern 3 hub {labels}')
  say(f'[{tag}] Tavern 3 by arch bump; zone 3 tavern talk lines played: {len(z3tav)}',(z3tav[0][:2] if z3tav else ''))
  pg.wait_for_timeout(1600);T.ttap(pg,'[data-hub="2"]');T.check(T.ui(pg)=='save-picker','Zone 4 tab did not open the save picker')
  T.check(WAIT not in ev(pg,'document.body.innerText'),'Zone 4 tab shows wait text');T.ttap(pg,'[data-save-slot="1"]');pg.wait_for_timeout(300);drain(pg)
  s=ev(pg,'SOTA.state()');T.check([s['x'],s['y'],s['zone']]==[51,15,4],f'not in zone 4 after seam {s}');say(f'[{tag}] seam 3-4 -> {s}')
  # ---- one zone 4 fight by taps
  ev(pg,'(()=>{const L=SOTA.rpg.live(),p=SOTA.state();SOTA.rpg.startFight(RPG.encounter(4,RPG.partyLevel(L.party),RPG.centreFactor(p.x,p.y,SOTA.N),L.diff,12345,L.party))})()')
  foes=ev(pg,'SOTA.rpg.fight().m.map(m=>m.n+" "+(m.mech||""))');r=fight(pg);say(f'[{tag}] zone 4 fight {foes}: {r}')
  if ev(pg,'!!document.getElementById("s5lvl")'):T.ttap(pg,'#s5lvlok')
  if r=='win':T.ttap(pg,'#fdone');pg.wait_for_timeout(300)
  else:T.ttap(pg,'#fdone') if ev(pg,'!!document.getElementById("fdone")') else None
  drain(pg);ev(pg,'SOTA.rpg.closeUI()')
  if r!='win':ev(pg,'SOTA.teleport(51,15,2)')
  ev(pg,'SOTA.rpg.live().party.forEach(c=>{c.hp=RPG.maxHp(c,1);c.mp=RPG.maxMp(c);})')
  # a second, single-monster zone 4 fight so the won-fight Continue path (fightContinue hook) runs too
  w0=ev(pg,'SOTA.rpg.s6.st().z4Wins|0');ev(pg,'(()=>{const L=SOTA.rpg.live();SOTA.rpg.startFight([RPG.makeMonster(4,0,RPG.partyLevel(L.party),0,L.diff)])})()')
  r2=fight(pg)
  if ev(pg,'!!document.getElementById("s5lvl")'):T.ttap(pg,'#s5lvlok')
  T.ttap(pg,'#fdone');pg.wait_for_timeout(300);af=drain(pg);w1=ev(pg,'SOTA.rpg.s6.st().z4Wins|0');ev(pg,'SOTA.rpg.closeUI()')
  say(f'[{tag}] zone 4 fight 2 (Minotaur alone): {r2}; zone 4 win counter {w0}->{w1}; after-fight talk samples {len(af)}')
  T.check(r2=='win' and w1==w0+1,'won zone 4 fight did not reach the zone 4 after-fight hook')
  if ev(pg,'SOTA.state().zone')!=4:ev(pg,'SOTA.teleport(51,15,2)')
  ev(pg,'SOTA.rpg.live().party.forEach(c=>{c.hp=RPG.maxHp(c,1);c.mp=RPG.maxMp(c);})')
  # ---- zone 4 camp talk (shadowed STORY.camp.dark) plays through the real camp Save tab
  k=ev(pg,'MAZE.camps.findIndex(c=>SOTA.core.zoneOf[c[1]*SOTA.N+c[0]]===4)');cell=ev(pg,f'MAZE.camps[{k}]')
  ev(pg,f'SOTA.teleport({cell[0]},{cell[1]},0)');pg.wait_for_timeout(500);ev(pg,'Z4Banter.test.reset()')
  T.ttap(pg,'#s5here');T.check(T.ui(pg)=='camp','zone 4 camp did not open');T.ttap(pg,'[data-tab=save]')
  if ev(pg,'!!document.querySelector("[data-tentyes]")'):T.ttap(pg,'[data-tentyes]')
  T.ttap(pg,'[data-save-slot="1"]');pg.wait_for_timeout(300);L1=last(pg);lines=drain(pg)
  say(f'[{tag}] zone 4 camp {k+1} {cell}: picked {L1}; {len(lines)} lines, speakers {[x[1] for x in lines]}')
  T.check(L1 and L1[0]['slot']=='camp' and L1[0]['tier']=='story' and L1[0]['id'] in ('c5','c6','c7','c8'),f'zone 4 camp talk did not play {L1}');T.check(lines,'camp talk silent')
  if T.ui(pg)=='camp':T.ttap(pg,'[data-tab=return]')
  ev(pg,'SOTA.rpg.closeUI()')
  # ---- installed batch 14, Mix A (zone4-preA, no Brunn): Mira+Sorrel get a Z4B camp talk at the next zone 4 camp save
  ev(pg,'(()=>{const s=SOTA.rpg.s6.st();["c5","c6","c7","c8"].forEach(i=>s.seen[i]=1);Z4Banter.test.reset();})()')
  T.check(ev(pg,'Z4Banter.test.entries().length')==28,'batch 14 not 28 talks in the game')
  T.check(resave(pg),'re-save at camp failed');m1=last(pg);l1=drain(pg)
  say(f'[{tag}] Mix A camp (Mira+Sorrel, no Brunn): {m1} speakers {[x[1] for x in l1]}; first line {l1[0][2][:60] if l1 else ""}')
  T.check(m1 and m1[0]['tier']=='exact' and m1[0]['id'] in ['Z4B%02d'%n for n in range(1,13)],'no zone4-preA talk for Mira+Sorrel')
  T.check(not any(x[1]=='A' for x in l1),'Brunn spoke before joining')
  sor=ev(pg,'(()=>{const L=SOTA.rpg.live();window.__sor=L.party.splice(2,1)[0];return L.party.map(c=>c.name)})()');ev(pg,'Z4Banter.test.reset()')
  T.check(resave(pg),'re-save failed');m2=last(pg);o2=ev(pg,'SOTA.storyOpen()');l2=drain(pg)
  say(f'[{tag}] 1-companion ({sor}) camp: zone 4 pick {m2}; talk played {o2}; speakers {[x[1] for x in l2]}')
  T.check(o2,'Mira-only camp went silent');T.check(not any(x[1] in ('S','A') for x in l2),'absent companion spoke');T.check(not any(e['id'].startswith('Z4B') for e in m2),'Z4B talk with a missing speaker')
  ev(pg,'SOTA.rpg.live().party.push(window.__sor)');ev(pg,'Z4Banter.test.reset()')
  # ---- zone 1-3 talk still plays (zone 2 camp, normal chain), and zone 4 routing stays out of it
  k2=ev(pg,'MAZE.camps.findIndex(c=>SOTA.core.zoneOf[c[1]*SOTA.N+c[0]]===2)');c2=ev(pg,f'MAZE.camps[{k2}]');ev(pg,f'SOTA.teleport({c2[0]},{c2[1]},0)');pg.wait_for_timeout(300)
  T.check(resave(pg),'zone 2 camp save failed');o2=ev(pg,'SOTA.storyOpen()');l4=drain(pg);z=last(pg)
  say(f'[{tag}] zone 2 camp {k2+1}: talk played {o2}, lines {len(l4)} speakers {[x[1] for x in l4]}; zone 4 router used: {z}');T.check(o2 and l4,'zone 2 camp talk did not play');T.check(z==[],'zone 4 router ran in zone 2')
  # ---- seam 4-5: Tavern 4 archway bump (Brunn joins), then the zone 4 tavern talk t3a
  ev(pg,'SOTA.teleport(47,48,3)');pg.wait_for_timeout(300);wait_quiet(pg);ev(pg,'Z4Banter.test.reset()');T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(500)
  j=drain(pg);s=ev(pg,'SOTA.state()');names=ev(pg,'SOTA.rpg.live().party.map(c=>c.name)');say(f'[{tag}] Tavern 4 bump at {s}: party {names}; join lines {len(j)}')
  T.check([s['x'],s['y']]==[47,48],'walked through the 4-5 arch');T.check(len(names)==4 and 'Brunn' in names,'Brunn did not join')
  if T.ui(pg)!='tavern':pg.wait_for_timeout(600);T.ttap(pg,'#s5here')
  pg.wait_for_timeout(300);tv=last(pg);lt=drain(pg)
  say(f'[{tag}] Tavern 4 arrival: picked {tv}; {len(lt)} lines, speakers {[x[1] for x in lt]}')
  T.check(any(e['slot']=='tavern' and e['id']=='t3a' for e in tv),f'zone 4 tavern talk t3a did not play {tv}')
  T.check(T.ui(pg)=='tavern','Tavern 4 not open');labels=ev(pg,'[...document.querySelectorAll("[data-hub]")].map(b=>b.textContent)');T.check(labels==['Zone 4','Shop','Zone 5'],f'tavern 4 hub {labels}')
  pg.wait_for_timeout(1600);T.ttap(pg,'[data-hub="2"]');pg.wait_for_timeout(300);wl=drain(pg);say(f'[{tag}] Zone 5 tab: {wl}')
  T.check(wl and wl[0][2]==WAIT,'Zone 5 tab is not exactly the wait text');T.check(ev(pg,'SOTA.state().zone')==4,'left zone 4')
  ev(pg,'SOTA.rpg.closeUI()');ev(pg,f'SOTA.teleport({cell[0]},{cell[1]},0)');pg.wait_for_timeout(400);ev(pg,'Z4Banter.test.reset()')
  T.check(resave(pg),'full-party camp save failed');mb=last(pg);lb=drain(pg)
  say(f'[{tag}] Mix B camp (full party, Brunn in): {mb} speakers {[x[1] for x in lb]}; first line {lb[0][2][:60] if lb else ""}')
  T.check(mb and mb[0]['id'] in ['Z4B%02d'%n for n in range(13,29)] and mb[0]['tier']=='exact','no zone4 (Mix B) talk with Brunn')
  T.check(any(x[1]=='A' for x in lb),'Brunn silent in a Mix B talk')
  saved=ev(pg,'(()=>{const o=JSON.parse(localStorage.getItem("sota.party.slot"+SOTA.rpg.activeSlot()));return {at:o.at.name,x:o.at.x,y:o.at.y,party:o.party.map(c=>c.name)}})()');say(f'[{tag}] last save before reload: {saved}')
  # ---- save then load: reload, Continue from the title
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg&&window.Z4Banter');SPL.pass_splash(pg);ev(pg,'SOTA.setAnim(false)');T.past_title(pg);pg.wait_for_timeout(800);drain(pg)
  s=ev(pg,'SOTA.state()');names=ev(pg,'SOTA.rpg.live()&&SOTA.rpg.live().party.map(c=>c.name)');say(f'[{tag}] after reload + Continue: {s} party {names}')
  T.check([s['x'],s['y']]==[saved['x'],saved['y']] and s['zone']==4 and names==saved['party'],'load did not restore the last save')
  n0=len(ev(pg,'SOTA.frameTimes()'));f0=ev(pg,'SOTA.state().f');ev(pg,'SOTA.rpg.closeUI()');T.ttap(pg,'[data-cmd=right]');pg.wait_for_timeout(1200)
  f1=ev(pg,'SOTA.state().f');rt=ev(pg,'SOTA.renderOnce()');say(f'[{tag}] no-freeze: turn {f0}->{f1}, renderOnce {rt:.1f} ms, frame samples {n0}->{len(ev(pg,"SOTA.frameTimes()"))}')
  T.check(f1==(f0+1)%4,'maze input frozen');T.check(rt<500,'render too slow')
  b.close()
def sideways(p):
  b=p.chromium.launch();c=b.new_context(viewport={'width':891,'height':412},has_touch=True,is_mobile=True,service_workers='block');pg=c.new_page();hook(pg,'891x412')
  pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA&&SOTA.rpg&&window.Z4Banter');pg.wait_for_timeout(1200)
  d=ev(pg,'getComputedStyle(document.getElementById("rotn")).display');say('[891x412] loaded; sideways notice display:',d);T.check(d=='flex','no turn-upright notice');b.close()
res={}
with sync_playwright() as p:
  for (w,h) in [(412,891),(1024,768)]:
    tag=f'{w}x{h}'
    try:run(p,w,h,tag);res[tag]='PASS'
    except Exception as e:res[tag]='FAIL '+str(e)[:300];say(f'[{tag}] FAIL',str(e)[:600])
  try:sideways(p);res['891x412']='PASS'
  except Exception as e:res['891x412']='FAIL '+str(e)[:300]
print('RESULTS',json.dumps(res));print('ERRORS',len(ERRS))
for e in ERRS:print('  ',e[:1500])
sys.exit(0 if all(v=='PASS' for v in res.values()) and not ERRS else 1)
