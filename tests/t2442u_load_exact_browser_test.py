"""t2442u: loading a save restores every member's HP and MP exactly as stored at save time.
 a save, fight, take damage and spend MP, then load (save picker and page reload / title Continue): HP/MP equal the saved values
 b the same through the whole-party-loss 'Return to last save' path
 c an old save (no t2442u marker) with a stored 0 HP loads at 1 HP, every other value unchanged; a new save keeps its stored values
Usage: python tests/t2442u_load_exact_browser_test.py [base_url]"""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
import splash_helper as SPL
from playwright.sync_api import sync_playwright
passed=failed=0
def run(name,f,p):
  global passed,failed
  try:f(p);passed+=1;print('PASS',name,flush=True)
  except Exception as e:failed+=1;print('FAIL',name,repr(e)[:400],flush=True)
def setup(p):
  b=p.chromium.launch();c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True,service_workers='block')
  c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}");pg=T.fresh(c);T.full_create(pg,'Tess','human','warrior')
  T.ev(pg,'''(()=>{const L=SOTA.rpg.live();L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1),RPG.makeCompanion(RPG.COMPANIONS[1],1));
    L.party.forEach((c,i)=>{const mx=RPG.maxHp(c,RPG.DIFF[L.diff].hp);c.hp=Math.max(2,mx-3-i*4);c.mp=Math.max(1,RPG.maxMp(c)-1-i);});L.party[2].hp=1;SOTA.teleport(...MAZE.taverns[0],0);})()''')
  T.check(T.ev(pg,'SOTA.rpg.doSave()'),'save failed');return b,pg
POOLS='JSON.stringify(SOTA.rpg.live().party.map(c=>[c.hp,c.mp]))'
def pools(pg):return json.loads(T.ev(pg,POOLS))
def hurt(pg):
  T.ev(pg,'SOTA.rpg.startFight([(()=>{const m=RPG.makeMonster(1,0,1,0,"normal");m.hp=m.max=999;return m})()])');pg.wait_for_timeout(200)
  T.ev(pg,'SOTA.rpg.live().party.forEach(c=>{c.hp=Math.max(1,c.hp-2);c.mp=Math.max(0,c.mp-1);})')
def reload(pg):pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);T.ev(pg,'SOTA.setAnim(false)');T.past_title(pg)
def t_load_after_fight(p):
  b,pg=setup(p);saved=pools(pg);hurt(pg);T.ev(pg,'SOTA.rpg.forceEnd("ran")');T.ttap(pg,'#fdone');hurtv=pools(pg);T.check(hurtv!=saved,'test did not change pools')
  T.ev(pg,'SOTA.rpg.savePicker("load")');T.ttap(pg,'[data-save-slot="0"]');pg.wait_for_timeout(150);T.check(pools(pg)==saved,f'save picker load kept fight values {pools(pg)} vs saved {saved}')
  hurt(pg);T.ev(pg,'SOTA.rpg.forceEnd("ran")');T.ttap(pg,'#fdone');reload(pg);T.check(pools(pg)==saved,f'reload/Continue kept fight values {pools(pg)} vs {saved}');b.close()
def t_loss_reload(p):
  b,pg=setup(p);saved=pools(pg);hurt(pg);T.ev(pg,'SOTA.rpg.live().party.forEach(c=>{c.hp=0;})');T.ev(pg,'SOTA.rpg.forceEnd("lose")');pg.wait_for_timeout(100)
  T.check('last save' in T.ev(pg,'document.getElementById("fdone").textContent'),'no Return to last save');T.ttap(pg,'#fdone');pg.wait_for_timeout(150)
  T.check(pools(pg)==saved,f'loss reload kept fight values {pools(pg)} vs saved {saved}');b.close()
def t_old_zero(p):
  b,pg=setup(p);o=json.loads(T.ev(pg,'localStorage.getItem("sota.party.slot0")'));T.check(o.get('hpv')==1,'new save has no t2442u marker')
  o.pop('hpv',None);o['party'][1]['hp']=0;o['party'][2]['hp']=7;o['party'][2]['mp']=0;exp=[[c['hp'],c['mp']] for c in o['party']];exp[1][0]=1
  T.ev(pg,'s=>{localStorage.setItem("sota.party.slot0",s);localStorage.setItem("sota.party",s);localStorage.setItem("sota.party.active","0")}',json.dumps(o));reload(pg)
  T.check(pools(pg)==exp,f'old save: {pools(pg)} expected {exp}')
  o['hpv']=1;o['party'][1]['hp']=0;exp[1][0]=0;T.ev(pg,'s=>{localStorage.setItem("sota.party.slot0",s);localStorage.setItem("sota.party",s)}',json.dumps(o));reload(pg)
  T.check(pools(pg)==exp,f'new-format save not loaded exactly: {pools(pg)} expected {exp}');b.close()
with sync_playwright() as p:
  for n,f in [('a load after a fight restores saved HP/MP (picker + reload)',t_load_after_fight),('b loss reload restores saved HP/MP',t_loss_reload),('c old save 0 HP -> 1, others unchanged',t_old_zero)]:run(n,f,p)
print(f'{passed} passed, {failed} failed');print('page errors:',T.ERRS[:5]);sys.exit(1 if failed or T.ERRS else 0)
