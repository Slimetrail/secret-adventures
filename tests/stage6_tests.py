"""Stage 6 tests: story and dialogue (pretend phone, Playwright). Run: python stage6_tests.py http://127.0.0.1:8765/"""
import sys,os,json,time,re
sys.path.insert(0,os.path.dirname(__file__))
import stage4_tests as S4
from stage4_tests import check,page,tap,ev,create,step_into,finish,noslide,Fail,ERRS,REQS,ROOT
from playwright.sync_api import sync_playwright
def ctx(p,w=390,h=844,sw=False):  # story ON (no nostory flag)
  b=p.chromium.launch();return b,b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,service_workers='allow' if sw else 'block')
def S6(pg,js):return ev(pg,'(()=>{const s6=SOTA.rpg.s6,L=SOTA.rpg.live();'+js+'})()')
def tapbox(pg):
  b=pg.locator('#s6d .s6t').bounding_box();pg.touchscreen.tap(b['x']+b['width']/2,b['y']+b['height']/2)
def drain(pg,limit=400):
  """tap through every queued scene; returns the (who,emo,src) of each line shown"""
  ev(pg,'SOTA.rpg.s6.setSpeed(0)');seen=[]
  for _ in range(limit):
    l=S6(pg,'return s6.line()')
    if not l:return seen
    if S6(pg,'return !!document.querySelector("#s6d .s6btns button")'):return seen
    if l['typing']:pg.wait_for_timeout(15);continue
    seen.append((l['who'],ev(pg,'document.getElementById("s6d").dataset.emo'),ev(pg,'document.querySelector("#s6d .s6p").getAttribute("src")'),l['kind']))
    tapbox(pg)
  raise Fail('dialogue never ended')
def start(p,race='human',cls='warrior',inc=('str','str','str'),w=390,h=844,drain_open=True):
  b,c=ctx(p,w,h);pg=page(c);create(pg,race=race,cls=cls,inc=inc)
  if drain_open:drain(pg)
  return b,c,pg
def T(pg):return ev(pg,'MAZE.taverns')
# ---------- dialogue box ----------
def t_opening_plays(p):
  b,c,pg=start(p,drain_open=False);l=S6(pg,'return s6.line()');check(l and l['kind']=='opening','opening did not play after creation')
  check(ev(pg,'SOTA.storyOpen()'),'storyOpen false');s=drain(pg);check(any(x[0]=='D' for x in s),'dad never speaks in the opening');check(not ev(pg,'SOTA.storyOpen()'),'box still open')
  check(ev(pg,'SOTA.rpg.live().story.seen.opening')==1,'opening not marked');b.close()
def t_portrait_emotions(p):
  b,c,pg=start(p,race='elf',cls='mage',inc=('man','man','man'));step_into(pg,T(pg)[0]);s=drain(pg)
  comp=[x for x in s if x[0] in 'QSAH'];check(comp,'no portrait lines in join scene');emos={x[1] for x in comp}
  check(len(emos)>=2,f'portrait never changes emotion {emos}')
  for w,e,src,k in comp:check(src and src.startswith('art6/') and src.endswith('-'+e+'.webp'),f'portrait {src} does not match emotion {e}')
  b.close()
def t_portrait_flash_and_layout(p):
  for w,h in((390,844),(360,800),(412,915)):
    b,c,pg=start(p,w=w,h=h,drain_open=False);ev(pg,'SOTA.rpg.s6.setSpeed(0)');pg.wait_for_timeout(200)
    for _ in range(12):
      if S6(pg,'const l=s6.line();return l&&l.who!=="N"&&!l.typing'):break
      tapbox(pg);pg.wait_for_timeout(60)
    r=ev(pg,'(()=>{const q=s=>document.querySelector("#s6d "+s).getBoundingClientRect();const n=q(".s6name"),t=q(".s6t"),p=q(".s6pf");return {nh:n.height,nw:n.width,tb:t.bottom,tl:t.left,tr:t.right,pw:p.width,flash:document.querySelector("#s6d .s6pf").classList.contains("flash")}})()')
    check(r['nh']<32 and r['nw']<w*0.6,f'name tab not small {r}');check(r['tb']<=h and r['tl']>=0 and r['tr']<=w,f'box off screen {r}');check(r['pw']>60,'no portrait');check(r['flash'],'no flash on line change');b.close()
def t_not_skippable(p):
  b,c,pg=start(p,drain_open=False);ev(pg,'SOTA.rpg.s6.setSpeed(150)');pg.wait_for_timeout(100)
  i0=S6(pg,'return s6.line().i');check(S6(pg,'return s6.line().typing'),'line not typing');tapbox(pg);tapbox(pg);pg.keyboard.press('Enter');pg.keyboard.press('Escape')
  check(S6(pg,'return s6.line().i')==i0,'tap while typing skipped the line')
  txt=ev(pg,'document.querySelector("#s6d").innerText.toLowerCase()');check('skip' not in txt,'there is a skip control')
  check(ev(pg,'document.querySelectorAll("#s6d button").length')==0,'buttons in a banter box')
  s0=ev(pg,'SOTA.state()');ev(pg,'SOTA.act("fwd")');pg.keyboard.press('ArrowUp');s1=ev(pg,'SOTA.state()');check(s0==s1,'moved while dialogue open')
  check(ev(pg,'SOTA.rpg.s6.open()'),'Escape closed the dialogue');ev(pg,'SOTA.rpg.s6.setSpeed(0)');[pg.wait_for_timeout(50) for _ in range(100) if S6(pg,'return s6.line().typing')];tapbox(pg);pg.wait_for_timeout(50);check(S6(pg,'return s6.line().i')==i0+1,'tap after line did not advance')
  n=len(drain(pg));check(n>=8,f'opening too short ({n} lines)');b.close()
# ---------- companions ----------
def t_join_rules(p):
  for race,cls,inc in(('human','warrior',('str',)*3),('elf','mage',('man',)*3),('dwarf','warrior',('str',)*3),('cat','rogue',('str',)*3)):
    b,c,pg=start(p,race=race,cls=cls,inc=inc);t=T(pg)
    # Jeremy t1831u/t1833u: jovial joins at tavern 1, scholar at tavern 2, nobody at tavern 3, angry at tavern 4
    for i in(3,1,2):step_into(pg,t[i]);check(len(ev(pg,'SOTA.rpg.live().party'))==1,f'joined out of order at tavern {i+1}');drain(pg)
    for i,n in((0,2),(1,3),(2,3),(3,4)):
      step_into(pg,t[i]);k=S6(pg,'const l=s6.line();return l&&l.kind')
      if i==2:check(k!='join','join scene at tavern 3')
      else:check(k=='join',f'no join scene at tavern {i+1}')
      drain(pg);check(len(ev(pg,'SOTA.rpg.live().party'))==n,f'party size {n} wanted after tavern {i+1}')
    P=ev(pg,'SOTA.rpg.live().party.map(c=>[c.name,c.race,c.cls,c.role||null])')
    check([x[0] for x in P[1:]]==['Mira','Sorrel','Brunn'],f'names {P}');check([x[3] for x in P[1:]]==['quirky','scholar','angry'],f'roles {P}')
    want={'cat':'cat','elf':'elf','dwarf':'dwarf'};exp=['human' if v==race else v for v in('cat','elf','dwarf')];check([x[1] for x in P[1:]]==exp,f'{race}: races {P} want {exp}')
    check(sorted(x[2] for x in P)==sorted(['warrior','mage','rogue','archer']),f'{race}: classes not balanced {P}')
    check(ev(pg,'SOTA.rpg.live().party.slice(1).every(c=>RPG.allowed(c.race,c.cls))'),'companion class not allowed for its race')
    step_into(pg,t[3]);check(len(ev(pg,'SOTA.rpg.live().party'))==4,'joined twice');b.close()
def t_class_balance_all(p):
  b,c=ctx(p);pg=page(c)
  bad=ev(pg,'''(()=>{const bad=[];for(const r in RPG.RACES)for(const cl of RPG.RACES[r].classes)for(let s=0;s<40;s++){const h={race:r,cls:cl},pl=RPG.planParty(h,s*7919);
   const cs=[cl].concat(pl.map(d=>d.cls));if(new Set(cs).size!==4||!pl.every(d=>RPG.allowed(d.race,d.cls))||pl.some(d=>(d.race==="human")!==(RPG.COMPANIONS.find(x=>x.name===d.name).race===r)))bad.push([r,cl,s,cs]);}return bad})()''')
  check(not bad,f'unbalanced plans {bad[:3]}');b.close()
# ---------- fights ----------
def fight_with_party(p):
  b,c,pg=start(p);t=T(pg);step_into(pg,t[0]);drain(pg);step_into(pg,t[1]);drain(pg);return b,c,pg  # companions now join at taverns 1 and 2 (t1833u)
def t_fight_lines(p):
  b,c,pg=fight_with_party(p);ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])');ev(pg,'SOTA.rpg.fight().m[0].hp=99999')
  check(ev(pg,'document.querySelectorAll("#s6fl").length')==1,'no fight start line');check(ev(pg,'document.getElementById("s6fl").dataset.phase')=='start','not a start line')
  check(ev(pg,'document.getElementById("s6fl").dataset.who') in ('Q','S','A'),'start line not from a companion');check(not ev(pg,'SOTA.storyOpen()'),'dialogue box opened in a fight')
  ev(pg,'document.getElementById("fbot").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))');check(ev(pg,'document.querySelectorAll("#s6fl").length')==0,'start line stays after first action')
  for _ in range(3):
    if ev(pg,'!!SOTA.rpg.fight().over'):break
    try:ev(pg,'SOTA.rpg.act("attack",0)')
    except Exception:pass
  pg.wait_for_timeout(300);check(ev(pg,'!!(SOTA.rpg.fight()&&SOTA.rpg.fight().over)') or ev(pg,'document.querySelectorAll("#s6fl").length')==0,'line during fight');check(not ev(pg,'SOTA.storyOpen()'),'box during fight')
  if not ev(pg,'!!SOTA.rpg.fight().over'):ev(pg,'SOTA.rpg.forceEnd("win")')
  pg.wait_for_timeout(100);check(ev(pg,'(document.getElementById("s6fl")||{dataset:{}}).dataset.phase')=='end','no end line on win')
  check(ev(pg,'document.querySelectorAll("#s6fl").length')==1,'more than one end line');tap(pg,'#fdone')
  ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])');ev(pg,'SOTA.rpg.forceEnd("ran")');pg.wait_for_timeout(100);check(ev(pg,'document.getElementById("s6fl").dataset.phase')=='end','no ran line');tap(pg,'#fdone');b.close()
def t_fight_solo_quiet(p):
  b,c,pg=start(p);ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])');check(ev(pg,'document.querySelectorAll("#s6fl").length')==0,'solo hero got a banter line (hero speaks only rarely)');ev(pg,'SOTA.rpg.forceEnd("win")');check(ev(pg,'document.querySelectorAll("#s6fl").length')==0,'solo end line');b.close()
def t_ko_revive_reload(p):
  b,c,pg=fight_with_party(p)
  # knocked out on a win: back at 1 hp, never removed
  ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])');ev(pg,'SOTA.rpg.live().party[1].hp=0');ev(pg,'SOTA.rpg.forceEnd("win")');tap(pg,'#fdone')
  check(ev(pg,'SOTA.rpg.live().party.length')==3,'companion removed');check(ev(pg,'SOTA.rpg.live().party[1].hp')==1,'KO companion not woken after win')
  # smelling salts wake a knocked out member in a fight, and do nothing to an awake one
  r=ev(pg,'''(()=>{const L=SOTA.rpg.live(),P=JSON.parse(JSON.stringify(L.party));P[0].bag.push("salts","salts");P[2].hp=0;const F=new RPG.Fight(P,[RPG.makeMonster(1,0,1,0,"normal")],"normal",5);
    F.act(0,"item","salts",1);const awake=P[1].hp,n1=P[0].bag.filter(x=>x==="salts").length;F.act(0,"item","salts",2);return {awake,n1,ko:P[2].hp,n2:P[0].bag.filter(x=>x==="salts").length}})()''')
  check(r['n1']==2,f'salts used on an awake member {r}');check(r['ko']>0 and r['n2']==1,f'salts did not wake the knocked out member {r}')
  check(ev(pg,'RPG.ITEMS.salts&&RPG.ITEMS.salts.revive>0'),'no salts item');check(ev(pg,'ECON.PRICE.salts>0'),'salts not sold')
  # everyone out: back to last save
  g=ev(pg,'SOTA.rpg.save().gold');ev(pg,'SOTA.rpg.live().gold+=77');ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])');ev(pg,'SOTA.rpg.live().party.forEach(c=>c.hp=0)');ev(pg,'SOTA.rpg.forceEnd("lose")')
  check('knocked out' in ev(pg,'document.getElementById("s4").innerText').lower(),'lose text not "knocked out"');tap(pg,'#fdone');check(ev(pg,'SOTA.rpg.live().gold')==g,'not back at last save');check(ev(pg,'SOTA.rpg.live().party.length')==3,'companions lost on reload');b.close()
# ---------- walls, memory, endings ----------
def walls_by_zone(pg):return ev(pg,'(()=>{const o={};MAZE.rooms.filter(r=>r.k==="story").forEach(r=>(o[r.z]=o[r.z]||[]).push(r.id));return o})()')
def first_line(pg):
  """text of the first line of the wall scene now open"""
  return ev(pg,'SOTA.rpg.s6.line()&&SOTA.rpg.s6.line().i===0?document.querySelector("#s6d .s6t").dataset.full||null:null')
def piece_text(pg,k):return ev(pg,f'(()=>{{const P=[1,2,3,4,5].reduce((a,z)=>a.concat(STORY.wall[z]),[]).concat(STORY.wall.dad);return P[{k}][0][2]}})()')
def open_wall(pg,i):
  ev(pg,f'SOTA.onRoomOpen({i})');k=S6(pg,'const l=s6.line();return l&&l.kind');check(k=='wall',f'no wall scene for room {i}')
  ev(pg,'SOTA.rpg.s6.setSpeed(0)');[pg.wait_for_timeout(20) for _ in range(200) if S6(pg,'const l=s6.line();return l.i===0&&l.typing')]
  t=ev(pg,'document.querySelector("#s6d .s6t").textContent');art=ev(pg,'document.querySelector("#s6d .s6wall").getAttribute("src")');drain(pg);return t,art
def run_walls(pg,order):
  W=ev(pg,'SOTA.rpg.s6.artRooms()');n=ev(pg,'SOTA.rpg.s6.WALL_ART_ROOMS');P=ev(pg,'SOTA.rpg.s6.PIECES()');got=[]
  for k,i in enumerate(order):
    t,art=open_wall(pg,i);want=piece_text(pg,ev(pg,f'SOTA.rpg.s6.pieceFor({i})'));check(t==want,f'room {i} ({k+1}th found) shows wrong piece: {t[:50]!r} want {want[:50]!r}')
    z=ev(pg,f'MAZE.rooms[{i}].z');f=ev(pg,f'SOTA.rpg.s6.roomArt()[{i}][1]');check(art==f'art6/{f}.webp' and f.startswith(f'zone{z}-'),f'room {i} in zone {z} uses art {art} want {f}')
    check(S6(pg,'return Object.keys(L.story.walls).length')==k+1,'count wrong');got.append(t)
  return got
def t_wall_counts(p):
  b,c,pg=fight_with_party(p);W=walls_by_zone(pg);N=S6(pg,'return s6.WALL_ART_ROOMS')
  check(len(S6(pg,'return s6.artRooms()'))==N,'art room list does not match WALL_ART_ROOMS');check(S6(pg,'return s6.PIECES()')==N,'pieces != WALL_ART_ROOMS')
  if N==28:check({k:len(v) for k,v in W.items()}=={'1':3,'2':4,'3':5,'4':7,'5':9},f'story rooms per zone {W}')
  RA=S6(pg,'return s6.roomArt()');check(sorted(RA)==sorted(str(i) for i in S6(pg,'return s6.artRooms()')),'not every story room has its own art')
  check(sorted(v[0] for v in RA.values())==list(range(N)),'pieces not one per room');check(len({v[1] for v in RA.values()})==N,'art file reused')
  # fixed spatial assignment (BFS path distance, Jeremy 2026-11-06 t1822u-t1830u)
  WANT={4:'zone1-01-rat-entrance',5:'zone1-02-slime',1:'zone1-03-spider-toward-tavern',9:'zone2-01-no-way-out',17:'zone2-04-maze-xs-guy-outside',26:'zone3-01-crystal-defined-monsters',36:'zone3-05-crystal-cracked-smoke',37:'zone4-01-robed-circle-crystal',42:'zone4-07-figures-thrown-back-smoke',60:'zone5-01-handshake-crystal',62:'zone5-07-shop-glowing-stones',80:'zone5-08-picnic-farthest',84:'zone5-09-bedside-center'}
  for i,f in WANT.items():check(RA[str(i)][1]==f,f'room {i} has {RA[str(i)][1]} want {f}')
  check(RA['84'][0]==N-1 and RA['80'][0]==N-2,'dad pieces not on picnic/bedside rooms')
  order=sorted(S6(pg,'return s6.artRooms()'),key=lambda i:RA[str(i)][0]);got=run_walls(pg,order)
  for i,g in enumerate(got):check(g==piece_text(pg,i),f'room with piece #{i+1} did not show it')
  check(S6(pg,'return L.story.revealed'),'dad not revealed by the last pieces');check('dad' in got[-1].lower() and 'for my child' in json.dumps(S6(pg,'return STORY.wall.dad[1]')).lower(),f'last piece is not Dad and his note: {got[-1][:80]}')
  check(S6(pg,'return L.story.order.length')==N,'discovery order not kept')
  ev(pg,f'SOTA.onRoomOpen({order[0]})');check(not ev(pg,'SOTA.storyOpen()'),'same wall counted twice');check(S6(pg,'return Object.keys(L.story.walls).length')==N,'recount')
  b.close()
def t_wall_order_independent(p):
  b,c,pg=fight_with_party(p);order=S6(pg,'return s6.artRooms()')[::-1]  # zone 5 rooms first, zone 1 last
  """each room shows its OWN piece however many walls came before; a skipped room's piece is missed, not inherited"""
  got=run_walls(pg,order[:3]);check('who would make' not in got[0].lower(),'1st room found (zone 5) got the zone-1 piece by count')
  check(got[0]==piece_text(pg,S6(pg,f'return s6.pieceFor({order[0]})')),'1st room found did not show its own piece')
  check(S6(pg,'return L.story.revealed'),'bedside (dad) room found first did not reveal dad')
  t,art=open_wall(pg,5);check(t==piece_text(pg,1) and 'zone1-02-slime' in art,'slime room after 3 walls did not show the slime piece')
  check(t!=piece_text(pg,3),'later room inherited a skipped piece');t,_=open_wall(pg,4);check('who would make' in t.lower(),'rat room found last did not get the rat piece')
  b.close()
def t_wall_skip_misses(p):
  b,c,pg=fight_with_party(p);t,art=open_wall(pg,1);check(t==piece_text(pg,2) and art=='art6/zone1-03-spider-toward-tavern.webp','skipping rat/slime: spider room did not show spider piece')
  check(not S6(pg,'return L.story.revealed'),'dad revealed too early')
  b.close()
DESC=re.compile(r"\b(stand|stands|standing|stood|paint\w*|drawn|draw\w*|drew|blood\w*|charcoal|colou?r\w*|vibrant|arguing|argue\w*|table|figures?|brush\w*|scrawl\w*|smear\w*|depict\w*|pictures?|sketch\w*|crystals?|council|two-tone|hasty)\b",re.I)
def scene_texts(pg,limit=600):
  """(who,text) of every line in the open scene"""
  ev(pg,'SOTA.rpg.s6.setSpeed(0)');out=[]
  for _ in range(limit):
    l=S6(pg,'return s6.line()')
    if not l:return out
    if l['typing']:pg.wait_for_timeout(15);continue
    out.append((l['who'],ev(pg,'document.querySelector("#s6d .s6t").textContent')));tapbox(pg)
  raise Fail('wall scene never ended')
def t_wall_technique(p):
  """look follows the room's zone (t1623u); Jeremy t1650u: no caption describing the art"""
  b,c,pg=fight_with_party(p);W=walls_by_zone(pg)
  for z in ['5','3','1','4','2']:
    i=W[z][0];ev(pg,f'SOTA.onRoomOpen({i})');check(S6(pg,'const l=s6.line();return l&&l.kind')=='wall',f'no wall scene z{z}')
    art=ev(pg,'document.querySelector("#s6d .s6wall").getAttribute("src")');check(('zone'+z) in art,f'zone {z} shows {art}')
    vis=ev(pg,'[...document.querySelectorAll("#s6d *")].filter(e=>e!==document.querySelector("#s6d .s6box")&&!e.closest(".s6box")&&e.children.length===0&&e.textContent.trim()&&getComputedStyle(e).display!=="none").map(e=>e.textContent)')
    check(not vis,f'text outside the dialogue box (caption?) in zone {z}: {vis}');drain(pg)
  b.close()
def t_wall_no_description(p):
  """wall scenes are only thoughts: no narrator line and no describing words, in the data and on screen, in all rooms"""
  b,c,pg=fight_with_party(p);P=ev(pg,'[1,2,3,4,5].reduce((a,z)=>a.concat(STORY.wall[z]),[]).concat(STORY.wall.dad)')
  for k,piece in enumerate(P):
    check(piece[0][0]=='H',f'piece {k+1} does not open with the hero')
    for w,e,t in piece:
      check(w!='N',f'piece {k+1} has a narrator line: {t[:60]}');m=DESC.search(t);check(not m,f'piece {k+1} describes the art ({m and m.group(0)}): {t[:70]}')
      if k<len(P)-2:check(not re.search(r"\b(dad|father|papa)\b",t,re.I),f'dad hint before the last two pieces: piece {k+1}')
  for i in S6(pg,'return s6.artRooms()'):
    ev(pg,f'SOTA.onRoomOpen({i})');check(S6(pg,'const l=s6.line();return l&&l.kind')=='wall',f'no wall scene {i}')
    for w,t in scene_texts(pg):
      if w in (None,'N') and t=='(A memory, shared by the fire.)':continue
      check(w not in (None,'N'),f'room {i}: narrator line on screen: {t[:60]}');m=DESC.search(t);check(not m,f'room {i}: describing word {m and m.group(0)!r} on screen: {t[:70]}')
  b.close()
def t_wall_count_saved(p):
  b,c,pg=fight_with_party(p);o=S6(pg,'return s6.artRooms()');run_walls(pg,[o[5],o[9]]);ev(pg,'SOTA.rpg.doSave()')
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');pg.wait_for_timeout(300);ev(pg,'SOTA.setAnim(false)')
  check(S6(pg,'return Object.keys(L.story.walls).length')==2,'count lost on reload');check(S6(pg,'return L.story.order')==[o[5],o[9]],'order lost')
  t,_=open_wall(pg,o[1]);check(t==piece_text(pg,S6(pg,f'return s6.pieceFor({o[1]})')),'room after reload did not show its own piece');b.close()
def t_faceless_until_dad(p):
  b,c,pg=start(p);N=S6(pg,'return s6.PIECES()');df=S6(pg,'return s6.DAD_FROM');check(df==N-2,'dad not exactly the last two pieces')
  txt=ev(pg,'JSON.stringify(STORY.wall[1].concat(STORY.wall[2],STORY.wall[3],STORY.wall[4],STORY.wall[5]))').lower()
  check('dad' not in txt and 'father' not in txt,'dad named before the dad walls')
  d=ev(pg,'JSON.stringify(STORY.wall.dad)').lower();check('dad' in d or 'father' in d,'dad walls do not show the dad');b.close()
def unlock_centre(pg):
  moves=ev(pg,'''(()=>{const g=SOTA.rpg.s6.finalLock();for(let mask=0;mask<(1<<g.pz.L);mask++){let s=PUZ.clone(g.s),m=[];for(let i=0;i<g.pz.L;i++)if(mask>>i&1){s=PUZ.apply(g.pz,s,i);m.push(i);}if(PUZ.solved(g.pz,s))return m;}return null;})()''')
  check(moves is not None,'final lock is unsolvable')
  for i in moves:ev(pg,f'document.querySelector('+json.dumps(f'[data-s7lever="{i}"]')+').dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))')
  check(not ev(pg,'document.querySelector("[data-s6b=open]").disabled'),'solved lock still blocks the door')
def t_boss_note_and_ending_low(p):
  b,c,pg=start(p);ev(pg,'(()=>{const c=MAZE.centre;for(const d of[[0,-1],[1,0],[0,1],[-1,0],[0,-2],[2,0],[0,2],[-2,0],[1,1],[-1,-1]]){const x=c[0]+d[0],y=c[1]+d[1];if(SOTA.roomAt(x,y)<0){SOTA.teleport(x,y,0);return}}})()')
  ev(pg,'SOTA.afterStep(-1)');check(S6(pg,'const l=s6.line();return l&&l.kind')=='boss','boss note did not play near the centre')
  txt=ev(pg,'JSON.stringify(STORY.boss)').lower();check('golem' in txt,'boss note does not name the iron golem')
  drain(pg);check(ev(pg,'document.querySelectorAll("#s6d .s6btns button").length')==2,'no door choice');ev(pg,'document.querySelector("[data-s6b=later]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))')
  check(not ev(pg,'SOTA.storyOpen()'),'Not yet did not close');ev(pg,'SOTA.afterStep(-1)');check(not ev(pg,'SOTA.storyOpen()'),'note replayed')
  ev(pg,'SOTA.rpg.s6.bossNote()');drain(pg);unlock_centre(pg);ev(pg,'document.querySelector("[data-s6b=open]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))');drain(pg)
  check(ev(pg,'SOTA.rpg.ui()')=='fight','door skipped the Iron Golem');check(ev(pg,'SOTA.rpg.fight().m[0].boss'),'not a boss fight')
  check(not ev(pg,'SOTA.storyOpen()'),'ending played before victory');ev(pg,'SOTA.rpg.forceEnd("win")')
  if pg.locator('#s5lvlok').count():tap(pg,'#s5lvlok')
  tap(pg,'#fdone');drain(pg)
  check(ev(pg,'document.getElementById("s6d").dataset.ending')=='low','zero exploration did not give low ending');check(S6(pg,'return L.story.ending')=='low','ending not stored')
  t=ev(pg,'document.querySelector("#s6d").innerText');check('shatter' in ev(pg,'JSON.stringify(STORY.ending.low)').lower(),'low ending: dad does not destroy the crystal');check('0 / 85' in t and f"0 / {S6(pg,'return s6.WALL_ART_ROOMS')}" in t,f'counts missing {t}')
  ev(pg,'document.querySelector("[data-s6b=back]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))');check(not ev(pg,'SOTA.storyOpen()'),'ending did not close');b.close()
def t_ending_thresholds(p):
  b,c,pg=start(p);tot=113
  r=S6(pg,'return [0,56,57,101,102,113].map(n=>s6.endingFor(n))');check(r==['low','low','mid','mid','high','high'],f'thresholds {r}')
  for k,(sol,wl) in {'mid':(50,20),'high':(85,25)}.items():
    ev(pg,f'(()=>{{const C=SOTA.core;for(let i=0;i<{sol};i++)C.solvedR[i]=1;const s=SOTA.rpg.s6.st();s.walls={{}};MAZE.rooms.filter(r=>r.k==="story").slice(0,{wl}).forEach(r=>s.walls[r.id]=1)}})()')
    ev(pg,'SOTA.rpg.s6.showEnding()');drain(pg);check(ev(pg,'document.getElementById("s6d").dataset.ending')==k,f'{k} ending not chosen');ev(pg,'document.querySelector("[data-s6b=back]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))')
  E=ev(pg,'JSON.stringify(STORY.ending)').lower();check('dies' in ev(pg,'JSON.stringify(STORY.ending.mid)').lower() or 'gone' in ev(pg,'JSON.stringify(STORY.ending.mid)').lower(),'mid: dad does not die');b.close()
def t_memory_unlocks(p):
  b,c,pg=fight_with_party(p);check(S6(pg,'return s6.memUnlocked("Q")')==0,'memory unlocked with no exploring')
  ev(pg,'(()=>{const C=SOTA.core;for(let i=0;i<8;i++)C.solvedR[i]=1})()');check(S6(pg,'return s6.memUnlocked("Q")')==1,'8 explored should unlock 1')
  cp=ev(pg,'MAZE.camps[1]');ev(pg,'SOTA.rpg.live().party[0].bag.push("tent")');ev(pg,'(c=>{for(const d of[[0,1],[1,0],[0,-1],[-1,0]])if(SOTA.canMove(c[0]+d[0],c[1]+d[1],0)||true){}})(arguments)') if False else None
  S6(pg,'s6.H.camp(1);return 1');s=drain(pg);mem=S6(pg,'return L.story.told');check(sum(mem.values())==1,f'memory not told at camp {mem}')
  S6(pg,'L.story.seen={opening:1};s6.H.camp(1);return 1');drain(pg);t2=S6(pg,'return L.story.told');check(all(v<=1 for v in t2.values()),f'memory told twice for same count {t2}')
  S6(pg,'L.story.seen={opening:1};s6.H.camp(1);return 1');drain(pg);S6(pg,'L.story.seen={opening:1};s6.H.camp(1);return 1');drain(pg);t3=S6(pg,'return L.story.told');check(all(v<=1 for v in t3.values()) and sum(t3.values())==2,f'memory beyond unlock count {t3}')
  ev(pg,'(()=>{const C=SOTA.core;for(let i=0;i<85;i++)C.solvedR[i]=1})()');check(S6(pg,'return s6.memUnlocked("Q")')==S6(pg,'return STORY.memory.Q.length'),'memory not capped');b.close()
def t_tone_dark_zone4(p):
  b,c,pg=fight_with_party(p);ids=lambda k:ev(pg,f'STORY.camp.{k}.map(s=>s.id)')
  ev(pg,'SOTA.teleport(56,56,0)');check(ev(pg,'SOTA.state().zone')==4,'not zone 4');S6(pg,'s6.H.camp(0);return 1');seen=S6(pg,'return Object.keys(L.story.seen)');drain(pg)
  check(any(i in seen for i in ids('dark')),'zone 4 camp not dark');check(not any(i in seen for i in ids('fun')),'zone 4 camp used funny pool');b.close()
def t_stay_banter(p):
  b,c,pg=fight_with_party(p);ev(pg,'SOTA.rpg.live().gold=999');ev(pg,'SOTA.rpg.s5.tavernScreen(1)');k=S6(pg,'const l=s6.line();return l&&l.kind');check(k=='tavern',f'no tavern banter ({k})');drain(pg)
  for _ in range(3):S6(pg,'s6.H.shop();return 1')
  check(S6(pg,'const l=s6.line();return l&&l.kind')=='stay','no stay banter after 3 shop actions');drain(pg)
  ev(pg,'SOTA.rpg.s5.tavernScreen(1)');check(not ev(pg,'SOTA.storyOpen()'),'tavern banter replayed in the same visit');b.close()
# ---------- saves ----------
def t_saves_keep_story(p):
  b,c,pg=fight_with_party(p);ev(pg,'SOTA.onRoomOpen(1)');drain(pg);ev(pg,'SOTA.rpg.doSave()');st=S6(pg,'return JSON.stringify(L.story)')
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');pg.wait_for_timeout(300);check(not ev(pg,'SOTA.storyOpen()'),'a scene replayed on load')
  check(S6(pg,'return JSON.stringify(L.story)')==st,'story state lost on reload');check(S6(pg,'return Object.keys(L.story.walls).length')==1,'wall count lost');b.close()
def t_old_save_loads(p):
  b,c,pg=fight_with_party(p);ev(pg,'SOTA.rpg.doSave()')
  k=ev(pg,'Object.keys(localStorage).find(k=>{try{const o=JSON.parse(localStorage.getItem(k));return o&&o.party}catch(e){return false}})')
  ev(pg,f'(()=>{{const o=JSON.parse(localStorage.getItem("{k}"));delete o.story;o.party.forEach(c=>delete c.role);localStorage.setItem("{k}",JSON.stringify(o))}})()')
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');pg.wait_for_timeout(300);check(ev(pg,'!SOTA.rpg.live().story'),'old save already had story')
  check(S6(pg,'return s6.who("Q")&&s6.who("Q").name')=='Mira','old save: roles not inferred');check(S6(pg,'return !!s6.st().plan')==True,'no plan for old save')
  ev(pg,'SOTA.rpg.s5.tavernScreen(1)');check(ev(pg,'SOTA.storyOpen()'),'old save: tavern banter does not play');drain(pg)
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');pg.evaluate('SOTA.setAnim(false)')
  o=S6(pg,'return s6.artRooms()');ev(pg,f'(()=>{{const k=Object.keys(localStorage).find(k=>{{try{{return JSON.parse(localStorage.getItem(k)).party}}catch(e){{}}}});const v=JSON.parse(localStorage.getItem(k));v.story={{seen:{{opening:1}},walls:{{"{o[0]}":1,"{o[1]}":1}}}};localStorage.setItem(k,JSON.stringify(v))}})()')
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');pg.evaluate('SOTA.setAnim(false)')
  t,_=open_wall(pg,o[7]);check(t==piece_text(pg,S6(pg,f'return s6.pieceFor({o[7]})')),'old save with 2 walls (no order) did not show that room\'s piece');pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');pg.evaluate('SOTA.setAnim(false)')
  step_into(pg,T(pg)[3]);drain(pg);check(ev(pg,'SOTA.rpg.live().party.map(c=>c.name)')[3]=='Brunn','old save: 3rd companion did not join');check(not [e for e in ERRS if 'story' in e.lower() or 's6' in e],f'errors {ERRS}');b.close()
# ---------- offline ----------
def t_offline_v14(p):
  b,c=ctx(p,sw=True);pg=c.new_page();pg.goto(S4.BASE+'index.html');[pg.wait_for_timeout(300) for _ in range(50) if not ev(pg,'!!navigator.serviceWorker.controller')]
  ok=ev(pg,'(async()=>{const k=await caches.keys();const c=await caches.open("sota-s1-v17");const r=[];for(const f of["story.js?v=14","story-data.js?v=14","art6/cat-happy.webp","art6/tavern-1.webp","art6/zone5-09-bedside-center.webp"])r.push(!!(await c.match(f)));return [k,r]})()')
  check(ok[0]==['sota-s1-v17'] and all(ok[1]),f'cache {ok}');c.set_offline(True);pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');create(pg);pg.wait_for_timeout(300)
  check(ev(pg,'SOTA.storyOpen()'),'opening offline');ev(pg,'SOTA.rpg.s6.setSpeed(0)')
  ev(pg,'SOTA.teleport(MAZE.taverns[1][0],MAZE.taverns[1][1],0)');b.close()
def t_no_network_no_ads(p):
  check(all(u.startswith(S4.BASE) or u.startswith('data:') for u in REQS),'outside request '+str([u for u in REQS if not u.startswith(S4.BASE)][:3]))
  src=open(os.path.join(ROOT,'story.js')).read()+open(os.path.join(ROOT,'story-data.js')).read()
  for bad in('http://','https://','fetch(','XMLHttpRequest','advert','adsbygoogle'):check(bad not in src,'found '+bad)
TESTS=[v for k,v in list(globals().items()) if k.startswith('t_') and (len(sys.argv)<3 or k in sys.argv[2].split(','))]
if __name__=='__main__':
  S4.BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/';ok=0;bad=[]
  with sync_playwright() as p:
    for t in TESTS:
      t0=time.time()
      try:t(p);ok+=1;print('PASS',t.__name__,f'{time.time()-t0:.1f}s',flush=True)
      except Exception as e:bad.append(t.__name__);print('FAIL',t.__name__,repr(e)[:300],flush=True)
  print(f'stage6: {ok} passed, {len(bad)} failed',bad);sys.exit(1 if bad else 0)
