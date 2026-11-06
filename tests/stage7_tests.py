"""Stage 7 content, exact Jeremy t1846u room rules, boss, progression and locked content."""
import os,sys,json,time,hashlib,re
sys.path.insert(0,os.path.dirname(__file__))
import stage4_tests as S4
import stage6_tests as S6
from stage4_tests import check,ev,tap,page,ctx,create,Fail
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCKS=json.load(open(os.path.join(ROOT,'tests/locks7.json')))
BALANCE=open(os.path.join(ROOT,'tests/balance7.js')).read()
NAMES=[['Rat','Slime','Big bug','Cave bat','Giant spider','Mud toad','Fungus creeper'],['Goblin','Orc','Fairy','Kobold','Wild boar','Pixie swarm','Hobgoblin brute'],['Centaur','Werewolf','Skeleton','Ghoul','Harpy','Dire wolf','Wraith'],['Minotaur','Griffin','Lizard man','Stone gargoyle','Manticore','Ogre warlord','Giant scorpion'],['Basilisk','Dragon','Hydra','Wyvern','Chimera','Salamander','Shadow drake']]
def setup(p):
 b,c=ctx(p);pg=page(c);return b,pg
def source(pg,name):return pg.request.get(S4.BASE+name).text()
def fixture(pg):pg.add_script_tag(url=S4.BASE+"tests/balance7.js")
def t_roster(p):
 b,pg=setup(p);check(ev(pg,'RPG.MONSTERS.slice(1)')==NAMES,'35 names/order changed')
 for z in range(1,6):
  ms=ev(pg,f'Array.from({{length:7}},(_,i)=>RPG.makeMonster({z},i,30,.5,"normal"))')
  check(len({m['role'] for m in ms})==7,'zone roles not distinct')
  check(len({(m['atk'],m['def'],m['pierce']) for m in ms})==7,'roster is HP-only reskins')
  check(max(m['hp'] for m in ms)/min(m['hp'] for m in ms)>1.5,'no tank / low-HP tradeoff')
  check(all(not m['boss'] for m in ms),'another boss added')
 b.close()
def t_scaling_and_hallway(p):
 b,pg=setup(p)
 check(ev(pg,"RPG.ZONE_MUL")==[0,1,1.3,1.7,2.2,2.8],"zone multipliers changed")
 for k in range(7):
  ms=ev(pg,f'[1,2,3,4,5].map(z=>RPG.makeMonster(z,{k},40,0,"normal"))')
  # Role tradeoffs can cross HP (a later glass cannon vs an earlier tank); the zone base and roster averages rise.
  means=ev(pg,'[1,2,3,4,5].map(z=>{const a=Array.from({length:7},(_,i)=>RPG.makeMonster(z,i,40,0,"normal"));return [a.reduce((s,m)=>s+m.hp,0)/7,a.reduce((s,m)=>s+m.atk,0)/7]})')
  check(all(means[i][0]<means[i+1][0] and means[i][1]<means[i+1][1] for i in range(4)),'zone scaling lost')
  check(ev(pg,f'RPG.makeMonster(3,{k},30,1,"normal").hp>RPG.makeMonster(3,{k},30,0,"normal").hp'),'centre scaling lost')
 s=source(pg,'party.js');check('rid>=0?0.15:0.02' in s,'hallway no longer about 2%');check('if(stepsSince<10)return;' in s,'no cooldown')
 check('if(R.isSavePoint(M,p.x,p.y))' in s and s.index('if(R.isSavePoint(M,p.x,p.y))')<s.index('if(stepsSince<10)return;'),'camp/tavern fights')
 check(ev(pg,'["story","normal","hard"].map(d=>[RPG.DIFF[d].hp,RPG.DIFF[d].matk])')==[[2,.5],[1,1],[1,1.5]],'difficulty changed');b.close()
def t_room_multipliers(p):
 b,pg=setup(p)
 bad=ev(pg,'''(()=>{const bad=[];for(let z=1;z<=5;z++)for(const d of ['story','normal','hard'])for(let seed=0;seed<60;seed++){
 const h=RPG.encounter(z,25,.7,d,seed),r=RPG.roomEncounter(z,25,.7,d,seed);if(h.length!==r.length)bad.push('count');h.forEach((m,i)=>{const n=r[i];if(n.n!==m.n||n.hp!==m.hp*2||n.max!==m.max*2||Math.abs(n.atk-m.atk*1.5)>1e-8||n.def!==m.def||!n.room)bad.push([z,d,seed]);});}return bad})()''')
 check(not bad,'room HP/atk must be exactly 2x/1.5x '+str(bad[:3]));b.close()
def t_room_hook(p):
 b,pg=setup(p);create(pg);id=ev(pg,'MAZE.rooms.find(r=>r.k==="monster").id');ev(pg,f'SOTA.teleport(...MAZE.rooms[{id}].c,0);SOTA.onRoomOpen({id})')
 check(ev(pg,'SOTA.rpg.fight().m.every(m=>m.room)'),'monster room used hallway encounter');check(ev(pg,'SOTA.rpg.fight().why')=='room','wrong room context');b.close()
def t_treasure_kinds(p):
 b,pg=setup(p)
 r=ev(pg,'''(()=>{const C=RPG.newChar('x','cat','mage',{},'bolt'),out=[];for(let z=1;z<=5;z++)for(let seed=0;seed<100;seed++)for(let n=0;n<3;n++){
 const t=RPG.treasure(z,seed,Math.max(1,z*10-3),n);out.push({...t,slots:t.items.map(id=>RPG.ITEMS[id].slot),cant:t.items.some(id=>!RPG.canEquip(C,id,RPG.ITEMS[id].slot==='acc'?'acc1':RPG.ITEMS[id].slot))});}return out})()''')
 check({x['kind'] for x in r}=={'equipment','gold','jewelry'},'missing chest category')
 check(any(x['cant'] for x in r),'chests only match hero class')
 for x in r:
  check(x['tier']>=1 and x['tier']<=5,'bad gear tier')
  if x['kind']=='gold':check(x['gold']>0 and not x['items'],'gold category empty')
  elif x['kind']=='jewelry':check(x['slots']==['acc'],'jewelry not accessory')
  else:check(x['items'] and all(v in ['weapon','chest','helmet','boots','gloves','offhand'] for v in x['slots']),'equipment category empty')
 check(ev(pg,'RPG.treasure(1,1,50,0).tier')==5,'gear does not follow high level')
 check(ev(pg,'RPG.ITEMS.relic5_ring.mag>RPG.ITEMS.relic1_ring.mag&&RPG.ITEMS.relic5_amulet.atk>RPG.ITEMS.relic1_amulet.atk'),'jewelry has no scaled buffs')
 check(ev(pg,'(()=>{const c=RPG.newChar("x","cat","mage",{},"bolt");return !RPG.canEquip(c,"relic5_plate","chest")&&!RPG.canEquip(c,"relic5_axe","weapon")&&RPG.canEquip(c,"relic5_ring","acc2")})()'),'equipment limits lost')
 check(ev(pg,'(()=>{const c=RPG.newChar("x","elf","archer",{},"aimed");c.equip.weapon="relic5_bow";return !RPG.canEquip(c,"relic5_buckler","offhand")})()'),'relic bow permits offhand');b.close()
def t_treasure_ui(p):
 b,pg=setup(p);create(pg);ids=ev(pg,'MAZE.rooms.filter(r=>r.k==="treasure").slice(0,3).map(r=>r.id)')
 for n,id in enumerate(ids):
  ev(pg,f'SOTA.onRoomOpen({id})');check(ev(pg,'SOTA.rpg.ui()')=='treasure','no persistent found panel');text=pg.locator('#s4').inner_text();check('Treasure chest' in text and ('gold' in text.lower() or 'ATK' in text or 'MAG' in text or 'DEF' in text),'does not show actual found reward');check(not ev(pg,'SOTA.storyOpen()'),'chest got wall art');tap(pg,'#s4 button:has-text("Continue")')
 check(ev(pg,'SOTA.rpg.live().party[0].bag.some(id=>id.startsWith("relic"))'),'no real equipment awarded');b.close()
def t_room_once(p):
 b,pg=setup(p);create(pg);ev(pg,'SOTA.rpg.live().seed=1');id=ev(pg,'MAZE.rooms.find(r=>r.k==="treasure").id');ev(pg,f'SOTA.markSolved({id})');cell=ev(pg,f'MAZE.rooms[{id}].c');S4.step_into(pg,cell)
 check(ev(pg,'SOTA.panelOpen()'),'first entry has no room panel');tap(pg,'#pgo');check(ev(pg,'SOTA.rpg.ui()')=='treasure','Continue did not open chest');tap(pg,'#s4 button:has-text("Continue")')
 before=ev(pg,'[SOTA.rpg.live().gold,SOTA.rpg.live().party[0].bag]');ev(pg,'SOTA.act("back");SOTA.act("fwd")')
 check(not ev(pg,'SOTA.panelOpen()'),'cleared room panel repeated');check(ev(pg,'SOTA.rpg.ui()')!='treasure','chest respawned');check(ev(pg,'[SOTA.rpg.live().gold,SOTA.rpg.live().party[0].bag]')==before,'treasure awarded twice');check(ev(pg,f'SOTA.rooms().cleared.includes({id})'),'room not permanently cleared');b.close()
def t_boss_rules(p):
 b,pg=setup(p);create(pg)
 m=ev(pg,'RPG.makeBoss("normal")');check(m['n']=='Iron Golem' and m['boss'] and not m.get('placeholder'),'placeholder Golem')
 check(ev(pg,'new RPG.Fight(SOTA.rpg.live().party,[RPG.makeBoss("normal")],"normal",1).act(0,"run")')=="Can't run!",'boss escape allowed')
 fixture(pg)
 a=ev(pg,'''(()=>{const f=new RPG.Fight(preparedParty(RPG,'normal'),[RPG.makeBoss('normal')],'normal',4);f.monstersTurn();const charge=f.monstersTurn();const before=f.p.map(c=>c.hp);f.p.forEach((c,i)=>f.act(i,'defend'));const sweep=f.monstersTurn();return {charge,sweep,damage:before.map((v,i)=>v-f.p[i].hp),turn:f.turn};})()''')
 check(any('Defend' in x for x in a['charge']),'no wind-up warning');check(len(a['sweep'])==4 and all('sweeps' in x for x in a['sweep']),'no party-wide sweep');check(all(0<v<120 for v in a['damage']),'guard does not counter sweep');b.close()
def t_boss_balance(p):
 b,pg=setup(p);fixture(pg);r=ev(pg,'Object.fromEntries(["story","normal","hard"].map(d=>[d,Array.from({length:40},(_,i)=>bossSample(RPG,d,i+1))]))')
 n=r['normal'];check(all(x['over']=='win' and 5<=x['turns']<=25 for x in n),'Normal not a hard-but-winnable fight')
 avg=lambda d:sum(x['hp']/x['initial'] for x in r[d])/40
 check(.2<avg('normal')<.75,'normal is a stomp or overly punishing');check(avg('story')>avg('normal')>avg('hard'),'difficulty not harder/easier');check(sum(x['over']=='win' for x in r['hard'])>=20,'Hard effectively unwinnable');starter=ev(pg,'Array.from({length:40},(_,i)=>bossSample(RPG,"normal",i+1,"starter"))');check(sum(x['over']=='win' for x in starter)<20,'unprepared starter-skill play steamrolls boss');b.close()
def t_xp_budget(p):
 b,pg=setup(p);fixture(pg);r=ev(pg,'Array.from({length:20},(_,i)=>progression(RPG,undefined,i*7919))')
 check(all(45<=x['levels'][-1]<=50 for x in r),'exploring XP curve outside 45-50')
 check(all(x['levels'][0]>=8 and x['levels'][1]>=15 for x in r),'party not ready for next zones')
 check(70000<r[0]['capXP']<100000,'XP cap budget diverged from ~110 fights')
 check(ev(pg,'RPG.xpNeed(50)===Infinity'),'cap no longer 50');b.close()
def t_locked_content(p):
 b,pg=setup(p)
 for name,want in LOCKS.items():check(hashlib.sha256(pg.request.get(S4.BASE+name).body()).hexdigest()==want,'protected content changed: '+name)
 s=source(pg,'story.js');line=next(l for l in s.splitlines() if l.startswith('const ROOM_ART='));check(hashlib.sha256(line.encode()).hexdigest()=='79826398557961b67bd26b1670c1f48c6c8a5cec82893227eb7101753d0693b3','ROOM_ART changed')
 check('Is he carrying... a baby?' in source(pg,'story-data.js') and 'Something big is guarding the middle.' in source(pg,'story-data.js'),'locked thought line missing')
 check(ev(pg,'RPG.COMPANIONS.map(c=>c.tavern)')==[0,1,3],'companion placement changed')
 check(ev(pg,'SOTA.rpg.s6.WALL_ART_ROOMS')==28,'wall art on other rooms')
 check(ev(pg,'[MAZE.rooms.length,...["story","treasure","monster"].map(k=>MAZE.rooms.filter(r=>r.k===k).length)]')==[85,28,28,29],'85 room layout changed');b.close()
def t_door_flow(p):
 b,c,pg=S6.start(p);fixture(pg);ev(pg,'SOTA.rpg.live().party=preparedParty(RPG,"normal");SOTA.teleport(32,32,0);SOTA.rpg.s6.bossNote()');S6.drain(pg)
 check(ev(pg,'document.querySelector("[data-s6b=open]").disabled'),'final puzzle bypassed');check(ev(pg,'SOTA.rpg.s6.finalLock().pz.t')==1,'not existing lever type')
 ev(pg,'document.querySelector("[data-s6b=later]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))');pg.wait_for_timeout(300);tap(pg,'#s7door');S6.drain(pg)
 S6.unlock_centre(pg);check(ev(pg,'SOTA.rpg.live().story.finalLock'),'lock solve not stored');check(ev(pg,'SOTA.rooms().solved.length')==0,'final lock changed 85-room counts')
 ev(pg,'document.querySelector("[data-s6b=open]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))')
 check(ev(pg,'SOTA.rpg.ui()')=='fight' and not ev(pg,'SOTA.storyOpen()'),'Open did not start real fight')
 ev(pg,'SOTA.rpg.act("run")');check("Can't run!" in ev(pg,'SOTA.rpg.fight().log.join("|")'),'UI allowed run')
 # Win with a real attack, rather than direct ending/forceEnd: endFight must route boss victory to story.
 ev(pg,'SOTA.rpg.fight().m[0].hp=1;SOTA.rpg.act("attack")')
 if pg.locator('#s5lvlok').count():tap(pg,'#s5lvlok')
 tap(pg,'#fdone');S6.drain(pg);check(ev(pg,'SOTA.rpg.live().story.golemDefeated'),'boss victory not recorded')
 check(ev(pg,'document.getElementById("s6d").dataset.ending')=='low','victory did not play ending');check('later stage' not in pg.locator('#s6d').inner_text(),'placeholder ending footer remains');b.close()
def t_boss_defeat_restore(p):
 b,c,pg=S6.start(p);gold=ev(pg,'SOTA.rpg.save().gold');ev(pg,'SOTA.rpg.live().gold+=123;SOTA.rpg.live().story.finalLock=true;SOTA.rpg.startBoss();SOTA.rpg.live().party.forEach(c=>c.hp=1);SOTA.rpg.act("defend")')
 check(ev(pg,'SOTA.rpg.fight().over')=='lose','boss defeat broken');tap(pg,'#fdone');check(ev(pg,'SOTA.rpg.live().gold')==gold,'boss defeat kept progress');check(not ev(pg,'SOTA.storyOpen()'),'boss loss played ending');b.close()
def t_offline_boss(p):
 b,c=S6.ctx(p,sw=True);pg=c.new_page();pg.goto(S4.BASE+'index.html');pg.wait_for_function('navigator.serviceWorker.ready.then(()=>true)');pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg&&navigator.serviceWorker.controller')
 check(ev(pg,'caches.keys()')==['sota-s1-v17'],'offline cache not v17');c.set_offline(True);pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');create(pg);S6.drain(pg)
 ev(pg,'SOTA.rpg.s6.bossNote()');S6.drain(pg);S6.unlock_centre(pg);ev(pg,'document.querySelector("[data-s6b=open]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))')
 check(ev(pg,'SOTA.rpg.fight().m[0].n')=='Iron Golem','Golem unavailable offline');ev(pg,'SOTA.rpg.forceEnd("win")')
 if pg.locator('#s5lvlok').count():tap(pg,'#s5lvlok')
 tap(pg,'#fdone');S6.drain(pg);check(ev(pg,'SOTA.rpg.live().story.ending')=='low','offline ending unavailable');b.close()
def t_content_layout(p):
 for w,h in [(360,800),(390,844)]:
  b,c,pg=S6.start(p,w=w,h=h);ev(pg,'SOTA.rpg.s6.bossNote()');S6.drain(pg)
  r=ev(pg,'(()=>{const a=[...document.querySelectorAll("#s6d button")].map(e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom,r.height]});return a})()')
  check(all(x[0]>=0 and x[1]>=0 and x[2]<=w and x[3]<=h and x[4]>=44 for x in r),'final lock buttons clipped '+str(r));b.close()
def t_copy_cache_noads(p):
 b,pg=setup(p);s=source(pg,'game.js');ptxt=re.search(r'const PTXT=.*?;',s).group(0);check('later stage' not in ptxt and 'comes later' not in ptxt,'unfinished room copy')
 check('VER="17"' in source(pg,'sw.js'),'wrong offline cache')
 for name in ['rules.js','party.js','story.js','story-data.js','game.js','econ.js','sw.js','boot.js','index.html']:
  text=source(pg,name)
  for bad in ['http://','https://','XMLHttpRequest','sendBeacon','adsbygoogle','googletag','google-analytics']:check(bad not in text,'outside URL or ad code in '+name)
 check(not S4.ERRS,'browser errors '+str(S4.ERRS[:3]));check(all(u.startswith(S4.BASE) or u.startswith('data:') for u in S4.REQS),'outside request');b.close()
TESTS=[v for k,v in list(globals().items()) if k.startswith('t_') and (len(sys.argv)<3 or k in sys.argv[2].split(','))]
if __name__=='__main__':
 S4.BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/';ok=0;bad=[]
 with sync_playwright() as p:
  for t in TESTS:
   t0=time.time()
   try:t(p);ok+=1;print('PASS',t.__name__,f'{time.time()-t0:.1f}s',flush=True)
   except Exception as e:bad.append(t.__name__);print('FAIL',t.__name__,repr(e)[:400],flush=True)
 print(f'stage7: {ok} passed, {len(bad)} failed',bad);sys.exit(1 if bad else 0)
