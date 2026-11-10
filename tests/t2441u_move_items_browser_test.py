"""t2441u: move items between party members' bags from the journal (Inventory > Move items between bags), outside fights only.
 1 moving a quantity of 1 from a stack changes exactly one item (giver -1, receiver +1, nothing else changes), and survives save + load
 2 a knocked-out member's salts can be taken out; a stacked move of 2 uses the quantity picker
 3 a receiver whose bag is full is refused with a short message and nothing moves
 4 the move is blocked during a fight (no journal button, the screen will not open, the move function refuses)
Screenshots (T2441_SHOTS=dir): 360x640 and 1080 px wide. Usage: python tests/t2441u_move_items_browser_test.py [base_url]"""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
import splash_helper as SPL
from playwright.sync_api import sync_playwright
SHOTS=os.environ.get('T2441_SHOTS','');passed=failed=0
def run(name,f,p):
  global passed,failed
  try:f(p);passed+=1;print('PASS',name,flush=True)
  except Exception as e:failed+=1;print('FAIL',name,repr(e)[:400],flush=True)
def shot(pg,n):
  if SHOTS:os.makedirs(SHOTS,exist_ok=True);pg.screenshot(path=os.path.join(SHOTS,n))
def setup(p,w=360,h=640,dpr=2,mobile=True):
  b=p.chromium.launch();c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr,has_touch=True,is_mobile=mobile,service_workers='block')
  c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}");pg=T.fresh(c);T.full_create(pg,'Tess','human','warrior')
  T.ev(pg,'''(()=>{const L=SOTA.rpg.live();L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1),RPG.makeCompanion(RPG.COMPANIONS[1],1));
    L.party[0].bag.push("potion","potion","potion");L.party[2].hp=0;L.party[2].bag.push("salts","salts");SOTA.teleport(...MAZE.taverns[0],0);})()''')
  return b,pg
SNAP='JSON.stringify((()=>{const L=SOTA.rpg.live();return {party:L.party.map(c=>({bag:c.bag.slice().sort(),equip:c.equip,hp:c.hp,mp:c.mp,xp:c.xp,lvl:c.lvl})),gold:L.gold}})())'
def snap(pg):return json.loads(T.ev(pg,SNAP))
def open_mover(pg):
  T.ev(pg,'SOTA.intro.openJournal("inventory")');pg.wait_for_timeout(150);T.check(T.ev(pg,'!!document.querySelector("[data-mvopen]")'),'no Move items button in the journal Inventory');T.ttap(pg,'[data-mvopen]');pg.wait_for_timeout(150)
  T.check(T.ev(pg,'SOTA.rpg.ui()')=='move-items','move screen did not open')
def cnt(b,id):return b.count(id)
def t_move_one(p):
  b,pg=setup(p);open_mover(pg);before=snap(pg);shot(pg,'move-items-360x640-start.png')
  T.ttap(pg,'[data-mvfrom="0"]');T.ttap(pg,'[data-mvitem=potion]');T.check(T.ev(pg,'!!document.querySelector("[data-mvn]")'),'no quantity picker for a stack');T.check(T.ev(pg,'document.querySelector("[data-mvn]").dataset.mvn')=='1','quantity does not start at 1')
  shot(pg,'move-items-360x640-qty.png')
  over=T.ev(pg,'''(()=>{const W=innerWidth;return [...document.querySelectorAll(".s5mv button")].filter(b=>{const r=b.getBoundingClientRect();return r.right>W+1||r.left<-1||r.height<40}).map(b=>b.textContent)})()''')
  T.check(not over,f'buttons clipped or under 40 px at 360x640: {over}')
  T.ttap(pg,'[data-mvto="1"]');pg.wait_for_timeout(150);after=snap(pg)
  T.check(cnt(after['party'][0]['bag'],'potion')==cnt(before['party'][0]['bag'],'potion')-1,'giver not -1');T.check(cnt(after['party'][1]['bag'],'potion')==cnt(before['party'][1]['bag'],'potion')+1,'receiver not +1')
  exp=json.loads(json.dumps(before));exp['party'][0]['bag'].remove('potion');exp['party'][1]['bag']=sorted(exp['party'][1]['bag']+['potion'])
  T.check(after==exp,f'something else changed:\n{before}\n{after}');T.check('moved to' in T.ev(pg,'document.getElementById("s4toast").textContent'),'no confirmation')
  T.ev(pg,'SOTA.rpg.closeUI()');T.check(T.ev(pg,'SOTA.rpg.doSave()'),'save failed')
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);T.ev(pg,'SOTA.setAnim(false)');T.past_title(pg)
  T.check(snap(pg)==after,f'move did not survive save + load: {snap(pg)}');b.close()
def t_ko_salts_qty(p):
  b,pg=setup(p);open_mover(pg);before=snap(pg)
  T.ttap(pg,'[data-mvfrom="2"]');T.check('knocked out' in T.ev(pg,'document.querySelector("[data-mvfrom=\\"2\\"]").textContent'),'KO member not marked')
  T.ttap(pg,'[data-mvitem=salts]');T.ttap(pg,'[data-mvmore]');T.check(T.ev(pg,'document.querySelector("[data-mvn]").dataset.mvn')=='2','quantity picker did not go to 2')
  shot(pg,'move-items-360x640-ko-salts.png');T.ttap(pg,'[data-mvto="0"]');pg.wait_for_timeout(100);a=snap(pg)
  T.check(cnt(a['party'][2]['bag'],'salts')==cnt(before['party'][2]['bag'],'salts')-2 and cnt(a['party'][0]['bag'],'salts')==cnt(before['party'][0]['bag'],'salts')+2,f'salts move wrong {a}')
  T.check(a['party'][2]['hp']==0,'moving items changed the KO member');b.close()
def t_full_refused(p):
  b,pg=setup(p)
  heavy=T.ev(pg,'''(()=>{const L=SOTA.rpg.live(),r=L.party[1];const heavy=Object.keys(RPG.ITEMS).filter(id=>RPG.ITEMS[id].w>0).sort((a,b)=>RPG.ITEMS[b].w-RPG.ITEMS[a].w)[0];
    while(RPG.bagWeight({bag:r.bag.concat([heavy])})<=RPG.carryLimit(r))r.bag.push(heavy);let lite=Object.keys(RPG.ITEMS).filter(id=>RPG.ITEMS[id].w>0).sort((a,b)=>RPG.ITEMS[b].w-RPG.ITEMS[a].w);
    for(const id of lite.reverse()){if(RPG.bagWeight({bag:r.bag.concat([id])})<=RPG.carryLimit(r))r.bag.push(id);} L.party[0].bag.push(heavy);return heavy;})()''')
  open_mover(pg);before=snap(pg)
  T.ttap(pg,'[data-mvfrom="0"]');T.ttap(pg,f'[data-mvitem="{heavy}"]');T.check('bag full' in T.ev(pg,'document.querySelector("[data-mvto=\\"1\\"]").textContent'),'full receiver not marked')
  T.ttap(pg,'[data-mvto="1"]');pg.wait_for_timeout(100);T.check(snap(pg)==before,'an item moved into a full bag');T.check('full' in T.ev(pg,'document.getElementById("s4toast").textContent'),'no short "bag is full" message')
  shot(pg,'move-items-360x640-full.png');b.close()
def t_blocked_in_fight(p):
  b,pg=setup(p);T.ev(pg,'SOTA.rpg.startFight([RPG.makeMonster(1,0,1,0,"normal")])');pg.wait_for_timeout(200);before=snap(pg)
  T.check(T.ev(pg,'SOTA.rpg.moveItems()')==False,'move screen opened during a fight');T.check(T.ev(pg,'SOTA.rpg.ui()')=='fight','fight screen replaced')
  r=T.ev(pg,'SOTA.rpg.moveItem(0,1,"potion",1)');T.check(not r['ok'] and 'fight' in r['msg'],f'moveItem not refused in a fight {r}')
  T.ev(pg,'SOTA.intro.openJournal("inventory")');pg.wait_for_timeout(100);T.check(not T.ev(pg,'!!document.querySelector("[data-mvopen]")'),'journal offers Move items during a fight')
  T.ev(pg,'SOTA.intro.closeJournal()');T.check(snap(pg)==before,'bags changed during the fight');b.close()
def t_shot_1080(p):
  b,pg=setup(p,1080,1920,1,False);open_mover(pg);T.ttap(pg,'[data-mvitem=potion]');shot(pg,'move-items-1080x1920.png')
  fs=T.ev(pg,'parseFloat(getComputedStyle(document.querySelector(".s5mv .s5mvrow .s4b")).fontSize)');T.check(fs>=14,f'font too small {fs}')
  b.close();b,pg=setup(p,1280,800,1,False);open_mover(pg);T.ttap(pg,'[data-mvitem=potion]');shot(pg,'move-items-1280x800.png');b.close()
with sync_playwright() as p:
  for n,f in [('1 move 1 of a stack: exactly one item, survives save+load',t_move_one),('2 KO member salts out, quantity 2',t_ko_salts_qty),('3 full receiver refused',t_full_refused),('4 blocked during a fight',t_blocked_in_fight),('5 readable at 1080 px / 1280x800',t_shot_1080)]:run(n,f,p)
print(f'{passed} passed, {failed} failed');print('page errors:',T.ERRS[:5]);sys.exit(1 if failed or T.ERRS else 0)
