"""t2670u/t2675u/t2680u smoke (t2659u: smoke only). Story ON. One browser, one page at a time.
Per size (412x891, 1024x768): loads with 0 console/page errors; NEW GAMES by taps (3 at 412x891, 2 at 1024x768), each with its
own per-save value; per run the first camp line (real camp Save), first tavern line (Tavern 1 arrival talk hook) and first fight
line (real fight start) are recorded. Then save -> Continue (reload + title long-press) and save -> Load (save picker) restore the
same per-save value and pool positions and play the same NEXT camp and fight lines. An old save without a value gets one once on
load and keeps it. Ends with maze steps (no freeze). Usage: python tests/t2675u_variety_browser_smoke.py http://127.0.0.1:PORT/"""
import sys,os,json,time,hashlib
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:19757/').rstrip('/')+'/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
import splash_helper as SPL
from playwright.sync_api import sync_playwright
ERRS=[];ROWS=[]
def say(*a):print('  '+' '.join(str(x) for x in a),flush=True)
def ev(pg,js,a=None):return T.ev(pg,js,a)
def hook(pg,tag):
  pg.on('pageerror',lambda e:ERRS.append(f'[{tag}] pageerror: '+str(e)))
  pg.on('console',lambda m:ERRS.append(f'[{tag}] console.error: '+m.text) if m.type=='error' else None)
def drain(pg,n=600):
  ev(pg,'SOTA.rpg.s6&&SOTA.rpg.s6.setSpeed(0)');lines=[]
  for _ in range(n):
    if not ev(pg,'!!(SOTA.storyOpen&&SOTA.storyOpen())'):return lines
    for _w in range(150):
      if ev(pg,'(()=>{const L=SOTA.rpg.s6.line();return !L||!L.typing})()'):break
      pg.wait_for_timeout(20)
    else:raise T.Fail('line did not finish typing (freeze?)')
    cur=ev(pg,'(()=>{const d=document.getElementById("s6d"),L=SOTA.rpg.s6.line();return d&&L?[L.kind||"",L.who||"",(d.querySelector(".s6t")||{}).textContent||""]:null})()')
    if cur and cur[2] and (not lines or lines[-1]!=cur):lines.append(cur)
    ev(pg,'''(()=>{const d=document.getElementById("s6d");if(!d)return;const b=d.querySelector(".s6btns button:not([disabled])");(b||d).dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true}));})()''')
    pg.wait_for_timeout(30)
  raise T.Fail('talk did not finish (freeze?)')
def first(lines,kind):
  for k,w,t in lines:
    if k==kind and t:return w+': '+t
  return None
def vstate(pg):return ev(pg,'Variety.state()')
def short(v):return hashlib.sha256(str(v).encode()).hexdigest()[:8]
def boot(pg,clear=False):
  pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA&&SOTA.rpg&&window.Variety');SPL.pass_splash(pg)
  if clear:ev(pg,'localStorage.clear()');pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg&&window.Variety');SPL.pass_splash(pg)
  ev(pg,'SOTA.setAnim(false)');T.past_title(pg);pg.wait_for_timeout(300)
CAMP1='MAZE.camps.findIndex(c=>SOTA.core.zoneOf[c[1]*SOTA.N+c[0]]===1)'
def to_camp(pg):
  k=ev(pg,CAMP1);c=ev(pg,f'MAZE.camps[{k}]');ev(pg,f'SOTA.teleport({c[0]},{c[1]},0)');pg.wait_for_timeout(300);return k
def camp_line(pg,save=True):
  # save=True: the real camp Save (writes the slot, fires the camp hook). save=False: the same camp hook without writing the slot.
  if save:T.check(ev(pg,'SOTA.rpg.doSave()'),'camp save failed')
  else:ev(pg,f'window.S6H.camp({ev(pg,CAMP1)})')
  o=ev(pg,'SOTA.storyOpen()');l=drain(pg);return o,first(l,'camp'),l
def fight_line(pg):
  ev(pg,'(()=>{const L=SOTA.rpg.live();SOTA.rpg.startFight([RPG.makeMonster(1,0,RPG.partyLevel(L.party),0,L.diff)])})()');pg.wait_for_timeout(150)
  t=ev(pg,'(()=>{const f=document.getElementById("s6fl");return f?f.dataset.who+": "+f.querySelector(".s6flt").textContent:null})()')
  ev(pg,'SOTA.rpg.forceEnd("ran")');pg.wait_for_timeout(100)
  if ev(pg,'!!document.getElementById("fdone")'):T.ttap(pg,'#fdone')
  drain(pg);ev(pg,'SOTA.rpg.closeUI()');ev(pg,'SOTA.rpg.live().party.forEach(c=>{c.hp=RPG.maxHp(c,1);c.mp=RPG.maxMp(c);})');return t
def tavern_line(pg):
  ev(pg,'SOTA.rpg.live().steps+=1;window.S6H.tavern(0)');l=drain(pg);f=first(l,'tavern')
  if not f:say('  (tavern hook: no tavern-kind line; scenes played:',[(x[0],x[1],x[2][:50]) for x in l],')')
  return f
def new_game(pg,tag,n):
  boot(pg,clear=True)
  T.full_create(pg,'Tess','human','warrior');intro=drain(pg)
  v=vstate(pg);T.check(v and v['vseed']>0,'new game has no per-save value')
  # zone 1 wall (room 4) while hero-only: the game's wall hook (solo form)
  ev(pg,'window.S6H.wall(4)');w1=drain(pg);p=vstate(pg)['vpick'];w1id=p.get('wall-z1-01');w1l=first(w1,'wall');a1id=p.get('ar1-01');a1l=first(w1,'art-room')
  T.check(a1l,'zone 1 presence talk (AR1-01-H) silent')
  # Mira joins at Tavern 1 through the game's join hook (same call party.js makes on arrival)
  ev(pg,'(()=>{const L=SOTA.rpg.live(),def=RPG.companionFor(0,L.party,window.S6H.plan()),c=RPG.makeCompanion(def,1);L.party.push(c);window.S6H.joined(c,0);L.campTut="done";L.party[0].bag.push("tent","tent","tent");})()')
  jl=drain(pg);jid=vstate(pg)['vpick'].get('join-mira');jf=first(jl,'join');T.check(jf,'join talk did not play')
  T.check(all(x[1] in ('N','H','Q') for x in jl if x[0]=='join'),'absent speaker in join')
  to_camp(pg);o,cl,_=camp_line(pg);T.check(o and cl,'camp talk did not play')
  tl=tavern_line(pg);fl=fight_line(pg)
  # zone 2 wall (room 9) with Mira: one array, Sorrel lines drop (absent)
  ev(pg,'window.S6H.wall(9)');w2=drain(pg);p2=vstate(pg)['vpick'];w2id=p2.get('wall-z2-01');w2l=first(w2,'wall');a2id=p2.get('ar2-01');a2l=first(w2,'art-room')
  T.check(a2l,'zone 2 presence talk (AR2-01-M) silent');T.check(not any(x[1]=='H' and x[0]=='art-room' for x in w2) or a2id=='ar2-01-v1',f'hero spoke in a companion presence talk {w2}')
  T.check(not any(x[1]=='S' for x in w2),'Sorrel spoke while absent')
  if w2id and w2id!='wall-z2-01-v1':T.check(not any(x[1]=='H' and x[0]=='wall' for x in w2),'hero spoke in a v2/v3 companion wall')
  row=dict(run=f'{tag}#{n}',vid=short(v['vseed']),join=f'{jid} | {jf}',wall1=f'{w1id} | {w1l}',wall2=f'{w2id} | {w2l}',ar1=f'{a1id} | {a1l}',ar2=f'{a2id} | {a2l}',camp=cl,tavern=tl,fight=fl,intro=[x[2] for x in intro],vq=len(ev(pg,'SOTA.rpg.s6.st().vjournal||[]')))
  say(f'[{tag}] run {n}: value {row["vid"]} | join {row["join"]} | z1 wall {row["wall1"]} | z2 wall {row["wall2"]} | presence z1 {row["ar1"]} | presence z2 {row["ar2"]} | camp: {cl} | tavern: {tl} | fight: {fl} | journal notes queued {row["vq"]}');ROWS.append(row);return row
def run(p,w,h,tag,games):
  b=p.chromium.launch();c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=w<h,service_workers='block')
  pg=c.new_page();hook(pg,tag);t0=time.time();boot(pg,clear=True)
  say(f'[{tag}] loaded in {time.time()-t0:.1f}s; VER',ev(pg,'fetch("sw.js").then(r=>r.text()).then(t=>t.match(/VER="(\\d+)"/)[1])'))
  rows=[new_game(pg,tag,i+1) for i in range(games)]
  vids=[r['vid'] for r in rows];T.check(len(set(vids))==len(vids),'per-save values repeat')
  for k in ('camp','tavern','fight'):say(f'[{tag}] distinct first {k} lines across {games} runs: {len(set(r[k] for r in rows))}')
  for k in ('join','wall1','wall2','ar1','ar2'):say(f'[{tag}] distinct {k} variants across {games} runs: {len(set(r[k].split(" | ")[0] for r in rows))}')
  T.check(len(set((r['camp'],r['tavern'],r['fight']) for r in rows))==games,'two runs gave the same first lines')
  T.check(all(r['intro']==rows[0]['intro'] for r in rows),'sick-dad intro changed between runs');say(f'[{tag}] intro identical in all runs ({len(rows[0]["intro"])} lines)')
  # ---- save -> next lines; Continue and Load replay the same next lines from the saved positions
  T.check(ev(pg,'SOTA.rpg.doSave()'),'save failed');drain(pg)
  saved=vstate(pg);slot=ev(pg,'SOTA.rpg.activeSlot()')
  disk=ev(pg,f'JSON.parse(localStorage.getItem("sota.party.slot{slot}")||"null")')
  T.check(disk and disk.get('vseed')==saved['vseed'] and disk.get('vpools')==saved['vpools'],'slot on disk does not hold the per-save value / positions')
  o,n1,_=camp_line(pg,False);f1=fight_line(pg);t1=tavern_line(pg)
  say(f'[{tag}] after save (value {short(saved["vseed"])}): next camp {n1} | next fight {f1} | next tavern {t1}')
  # Continue: reload, title long-press
  boot(pg);dk=ev(pg,f'JSON.parse(localStorage.getItem("sota.party.slot{slot}"))');s2=vstate(pg)
  T.check(dk['vseed']==saved['vseed'] and dk['vpools']==saved['vpools'] and dk['vpick']==saved['vpick'],'Continue: save on disk lost value/positions/picks')
  T.check(s2['vseed']==saved['vseed'] and s2['vpick']==saved['vpick'],'Continue did not restore value/picks')
  # Continue at a camp may play the camp talk at once (the game's own camp-return hook); that line must be the saved order's next line
  auto=drain(pg);n2=first(auto,'camp')
  if n2:say(f'[{tag}] Continue played the camp talk itself: {n2}')
  else:to_camp(pg);o,n2,_=camp_line(pg,False)
  f2=fight_line(pg);t2=tavern_line(pg)
  say(f'[{tag}] Continue: value {short(s2["vseed"])} same picks {s2["vpick"]==saved["vpick"]} | next camp {n2} | next fight {f2} | next tavern {t2}')
  T.check((n2,f2,t2)==(n1,f1,t1),'Continue did not continue the same order')
  jcnt=ev(pg,'(()=>{const s=SOTA.rpg.s6.st();return (s.journalSplit&&s.journalSplit.pages||[]).filter(p=>/^VJ-/.test(p.id)).map(p=>p.id)})()');say(f'[{tag}] variant journal notes written at camp: {jcnt}')
  # Load through the save picker (Load a save -> slot)
  ev(pg,f'SOTA.rpg.savePicker("load",()=>{{}})');T.ttap(pg,f'[data-save-slot="{slot}"]');pg.wait_for_timeout(300)
  s3=vstate(pg);T.check(s3['vseed']==saved['vseed'] and s3['vpools']==saved['vpools'] and s3['vpick']==saved['vpick'],'Load did not restore value/positions/picks')
  auto=drain(pg);n3=first(auto,'camp')
  if not n3:to_camp(pg);o,n3,_=camp_line(pg,False)
  f3=fight_line(pg)
  say(f'[{tag}] Load slot {slot+1}: pools match: True | next camp {n3} | next fight {f3}');T.check((n3,f3)==(n1,f1),'Load did not continue the same order')
  # ---- old save without a value: assigned once on load, then saved and kept
  ev(pg,f'(()=>{{for(const k of ["sota.party.slot{slot}","sota.party"]){{const o=JSON.parse(localStorage.getItem(k));delete o.vseed;delete o.vpools;delete o.vpick;localStorage.setItem(k,JSON.stringify(o));}}}})()')
  boot(pg);a1=ev(pg,'SOTA.rpg.live().vseed');d1=ev(pg,f'JSON.parse(localStorage.getItem("sota.party.slot{slot}")).vseed')
  boot(pg);a2=ev(pg,'SOTA.rpg.live().vseed')
  say(f'[{tag}] old save: assigned {short(a1)} on load, on disk {short(d1)}, after another reload {short(a2)}');T.check(a1 and a1==d1==a2,'old save value not assigned once and kept')
  # ---- no freeze: a few maze steps
  ev(pg,'SOTA.rpg.closeUI()');to_camp(pg);drain(pg);ev(pg,'SOTA.rpg.closeUI()');pg.wait_for_timeout(900);s0=ev(pg,'SOTA.state()')
  for cmd in ('left','left','right','right','left'):
    T.ttap(pg,f'[data-cmd={cmd}]');pg.wait_for_timeout(450);drain(pg);ev(pg,'SOTA.rpg.closeUI()')
  T.check(ev(pg,'SOTA.state().f')!=s0['f'],'maze did not turn (freeze?)')
  s9=ev(pg,'SOTA.state()');ticks=ev(pg,'new Promise(r=>{let n=0;const f=()=>{n++;if(n<20)requestAnimationFrame(f);else r(n)};requestAnimationFrame(f)})')
  say(f'[{tag}] maze after steps {s0["x"],s0["y"],s0["f"]} -> {s9["x"],s9["y"],s9["f"]}; 20 frames ran: {ticks==20}');T.check(ticks==20,'freeze')
  b.close()
def main():
  with sync_playwright() as p:
    run(p,412,891,'412x891',4);run(p,1024,768,'1024x768',2)
  print('ROWS_JSON '+json.dumps([{k:v for k,v in r.items() if k!='intro'} for r in ROWS]))
  print('console/page errors:',len(ERRS))
  for e in ERRS:print('  '+e)
  sys.exit(1 if ERRS else 0)

if __name__=='__main__':main()
