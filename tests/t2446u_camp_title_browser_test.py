"""t2446u/t2449u/t2450u/t2451u camp saving and title buttons (360x640 phone).
 camp: arriving never saves or uses a tent; tabs are exactly Cook, Rest, Save, Return and fit at 360x640; Rest refills only (no tent, no save);
       Save with no tent explains and stops; cancel at 'Use 1 tent to save?' and cancel at the slot picker change nothing;
       picking a slot refills HP/MP, uses exactly 1 tent and writes that slot with the refilled party; a re-save at the pitched spot uses 0 tents;
       the first-camp lesson's Save step goes through the same flow
 title: Continue only with a save; Load Game opens the picker and restores the stored HP/MP exactly; New Game with a save asks first;
        hold-to-continue still works; holding or tapping a button never fires the gesture
Screenshots (T2446_SHOTS=dir). Usage: python tests/t2446u_camp_title_browser_test.py [base_url]"""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
import splash_helper as SPL
from playwright.sync_api import sync_playwright
SHOTS=os.environ.get('T2446_SHOTS','');passed=failed=0
def run(name,f,p):
  global passed,failed
  try:f(p);passed+=1;print('PASS',name,flush=True)
  except Exception as e:failed+=1;print('FAIL',name,repr(e)[:500],flush=True)
def shot(pg,n):
  if SHOTS:os.makedirs(SHOTS,exist_ok=True);pg.screenshot(path=os.path.join(SHOTS,n))
def ctx(p):
  b=p.chromium.launch();c=b.new_context(viewport={'width':360,'height':640},device_scale_factor=2,has_touch=True,is_mobile=True,service_workers='block')
  c.add_init_script("try{localStorage.setItem('sota.dev.nostory','1')}catch(e){}");return b,c
def setup(p,tents=2):
  b,c=ctx(p);pg=T.fresh(c);T.full_create(pg,'Tess','human','warrior')
  T.ev(pg,f'''(()=>{{const L=SOTA.rpg.live();L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1));L.campTut="done";L.party[0].bag=L.party[0].bag.filter(x=>x!=="tent");for(let i=0;i<{tents};i++)L.party[0].bag.push("tent");
   L.party.forEach(c=>{{c.hp=Math.max(1,c.hp-5);c.mp=Math.max(0,c.mp-2);}});}})()''');return b,pg
STATE='''JSON.stringify((()=>{const L=SOTA.rpg.live();const sl=[0,1,2,3].map(i=>localStorage.getItem("sota.party.slot"+i));return {tents:L.party.reduce((t,c)=>t+c.bag.filter(x=>x==="tent").length,0),pools:L.party.map(c=>[c.hp,c.mp]),full:L.party.map(c=>[RPG.maxHp(c,RPG.DIFF[L.diff].hp),RPG.maxMp(c)]),slots:sl}})())'''
def st(pg):return json.loads(T.ev(pg,STATE))
def to_camp(pg):
  T.ev(pg,'SOTA.teleport(...MAZE.camps[0],0)');T.ev(pg,'SOTA.rpg.s5.campScreen(0)');pg.wait_for_timeout(150)
def t_arrival(p):
  b,pg=setup(p);before=st(pg);c=T.ev(pg,'MAZE.camps[0]');ok=False
  for d in range(4):
    if not T.ev(pg,'a=>SOTA.canMove(a[0],a[1],a[2])',[c[0],c[1],d]):continue
    D=[(0,-1),(1,0),(0,1),(-1,0)][d];nb=[c[0]+D[0],c[1]+D[1]]
    if T.ev(pg,'a=>SOTA.roomAt(a[0],a[1])',nb)>=0:continue
    T.ev(pg,'a=>SOTA.teleport(a[0],a[1],a[2])',[nb[0],nb[1],(d+2)%4]);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(200)
    s=T.ev(pg,'SOTA.state()')
    if [s['x'],s['y']]==list(c):ok=True;break
  T.check(ok,'could not walk onto the camp');a=st(pg);T.check(a['tents']==before['tents'] and a['slots']==before['slots'],f'arriving at a camp used a tent or saved {before["tents"]}->{a["tents"]}');b.close()
def t_tabs_rest(p):
  b,pg=setup(p);to_camp(pg);tabs=T.ev(pg,'[...document.querySelectorAll("#s4 .s5camp .s5tabs .s5tab")].map(e=>{const r=e.getBoundingClientRect();return [e.textContent,r.left,r.right,r.top,r.bottom]})')
  T.check([t[0] for t in tabs]==['Cook','Rest','Save','Return'],f'camp tabs are {[t[0] for t in tabs]}')
  T.check(all(t[1]>=0 and t[2]<=360 and t[3]>=0 and t[4]<=640 and t[4]-t[3]>=44 for t in tabs),f'tabs do not fit 360x640 {tabs}');shot(pg,'camp-tabs-360x640.png')
  before=st(pg);T.ttap(pg,'[data-tab=rest]');a=st(pg)
  T.check(a['pools']==a['full'],'Rest did not refill');T.check(a['tents']==before['tents'] and a['slots']==before['slots'],'Rest used a tent or saved');b.close()
def t_no_tent(p):
  b,pg=setup(p,0);to_camp(pg);before=st(pg);T.ttap(pg,'[data-tab=save]');pg.wait_for_timeout(100)
  T.check(T.ev(pg,'!!document.querySelector("[data-tentok]")') and 'Spider silk' in T.ev(pg,'document.getElementById("s5tentask").textContent'),'no "need a tent" message');shot(pg,'camp-save-no-tent-360x640.png')
  T.check(T.ev(pg,'SOTA.rpg.ui()')=='camp','picker opened without a tent');T.ttap(pg,'[data-tentok]');T.check(st(pg)==before,'something changed');b.close()
def t_cancel_confirm(p):
  b,pg=setup(p);to_camp(pg);before=st(pg);T.ttap(pg,'[data-tab=save]');T.check('Use 1 tent to save?' in T.ev(pg,'document.getElementById("s5tentask").textContent'),'no tent question');shot(pg,'camp-save-confirm-360x640.png')
  T.ttap(pg,'[data-tentno]');T.check(st(pg)==before,'cancel at the question changed something');T.check(T.ev(pg,'SOTA.rpg.ui()')=='camp','left the camp');b.close()
def t_cancel_picker(p):
  b,pg=setup(p);to_camp(pg);before=st(pg);T.ttap(pg,'[data-tab=save]');T.ttap(pg,'[data-tentyes]');T.check(T.ev(pg,'SOTA.rpg.ui()')=='save-picker','slot picker did not open');shot(pg,'camp-save-picker-360x640.png')
  T.ttap(pg,'#s4 .s4back');pg.wait_for_timeout(100);T.check(st(pg)==before,'cancel at the slot picker changed something');T.check(T.ev(pg,'SOTA.rpg.ui()')=='camp','not back at the camp');b.close()
def t_save_and_resave(p):
  b,pg=setup(p);to_camp(pg);before=st(pg);T.ttap(pg,'[data-tab=save]');T.ttap(pg,'[data-tentyes]');T.ttap(pg,'[data-save-slot="2"]');pg.wait_for_timeout(150);a=st(pg)
  T.check(a['tents']==before['tents']-1,f'tents {before["tents"]}->{a["tents"]}, expected exactly 1 fewer');T.check(a['pools']==a['full'],'live party not refilled')
  T.check(a['slots'][0]==before['slots'][0] and a['slots'][1]==before['slots'][1] and a['slots'][3]==before['slots'][3],'another slot changed')
  o=json.loads(a['slots'][2]);T.check([[c['hp'],c['mp']] for c in o['party']]==a['full'],'stored slot not full HP/MP');T.check(sum(c['bag'].count('tent') for c in o['party'])==a['tents'],'stored tent count wrong')
  T.ev(pg,'SOTA.rpg.live().party.forEach(c=>{c.hp=Math.max(1,c.hp-4);c.mp=Math.max(0,c.mp-1);})');to_camp(pg);b2=st(pg)
  T.ttap(pg,'[data-tab=save]');T.check(T.ev(pg,'SOTA.rpg.ui()')=='save-picker','pitched re-save should go straight to the slot picker');T.ttap(pg,'[data-save-slot="2"]');pg.wait_for_timeout(150);c=st(pg)
  T.check(c['tents']==b2['tents'],'re-save at the pitched spot used a tent');o=json.loads(c['slots'][2]);T.check([[x['hp'],x['mp']] for x in o['party']]==c['full'] and c['pools']==c['full'],'re-save did not store full HP/MP');b.close()
def t_tutorial_save(p):
  b,c=ctx(p);pg=T.fresh(c);T.full_create(pg,'Tess','human','warrior')
  T.ev(pg,'(()=>{const c=SOTA.rpg.live().party[0];c.bag=c.bag.filter(x=>x!=="tent");c.bag.push("p_silk","p_hide");})()');T.ev(pg,'SOTA.teleport(...MAZE.camps[0],0)');T.ev(pg,'SOTA.rpg.s5.campScreen(0)')
  T.ttap(pg,'[data-craftopen]');T.ev(pg,'(()=>{const s5=SOTA.rpg.s5;s5.craftPut("p_silk");s5.craftPut("p_hide");s5.craftPop();})()');T.ttap(pg,'#s5craft');pg.wait_for_timeout(200)
  T.check(T.ev(pg,'document.getElementById("s5tut")&&document.getElementById("s5tut").dataset.step')=='4','lesson did not reach the Save step');before=st(pg)
  T.ttap(pg,'[data-tutsave]');T.ttap(pg,'[data-tentyes]');T.ttap(pg,'[data-save-slot="1"]');pg.wait_for_timeout(150);a=st(pg)
  T.check(a['tents']==before['tents']-1 and a['slots'][1] and a['slots'][1]!=before['slots'][1],'lesson Save did not save with 1 tent');T.check(not T.ev(pg,'!!document.getElementById("s5tut")'),'lesson still showing');b.close()
def title_page(c,has):
  pg=c.new_page();pg.on('pageerror',lambda e:T.ERRS.append(str(e)));pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg)
  pg.wait_for_function('SOTA.intro&&SOTA.intro.titleOpen()');pg.wait_for_timeout(200);return pg
def t_title_nosave(p):
  b,c=ctx(p);pg=title_page(c,False);T.ev(pg,'localStorage.clear()');pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);pg.wait_for_function('SOTA.intro.titleOpen()')
  T.check(not T.ev(pg,'!!document.getElementById("ititle-cont")'),'Continue shown with no save');T.check(T.ev(pg,'document.getElementById("ititle-load").disabled'),'Load Game should be off with no saves')
  shot(pg,'title-nosave-360x640.png');T.ttap(pg,'#ititle-new');pg.wait_for_timeout(150);T.check(T.ev(pg,'SOTA.rpg.ui()')=='create','New Game did not open creation');b.close()
def saved_ctx(p):
  b,pg=setup(p);T.ev(pg,'SOTA.teleport(...MAZE.taverns[0],0)');T.check(T.ev(pg,'SOTA.rpg.doSave()'),'save failed');return b,pg
def t_title_buttons(p):
  b,pg=saved_ctx(p);name=T.ev(pg,'SOTA.rpg.live().party[0].name');T.ev(pg,'SOTA.intro.showTitle()');pg.wait_for_timeout(150);shot(pg,'title-buttons-360x640.png')
  rects=T.ev(pg,'["ititle-cont","ititle-load","ititle-new"].map(i=>{const e=document.getElementById(i);if(!e)return null;const r=e.getBoundingClientRect();return [r.left,r.right,r.top,r.bottom]})')
  T.check(all(r and r[0]>=0 and r[1]<=360 and r[3]<=640 and r[3]-r[2]>=44 for r in rects),f'title buttons missing or off screen {rects}')
  u=T.ev(pg,'(()=>{const r=document.querySelector("#ititle .iupd").getBoundingClientRect(),m=document.getElementById("ititle-menu").getBoundingClientRect();return [r.top,m.bottom]})()');T.check(u[0]>=u[1],'Check for update is not below the buttons')
  # hold on a button for 1 s: the hold gesture must not fire (title stays until the click is handled, and the click opens the New Game question, not creation/continue)
  r=rects[2];pg.mouse.move((r[0]+r[1])/2,(r[2]+r[3])/2);pg.mouse.down();pg.wait_for_timeout(1000)
  T.check(T.ev(pg,'SOTA.intro.titleOpen()'),'holding New Game fired the hold-to-continue gesture');pg.mouse.up();pg.wait_for_timeout(150)
  T.check(T.ev(pg,'SOTA.intro.titleOpen()') and T.ev(pg,'!!document.getElementById("ititle-newyes")'),'New Game with a save did not ask first');T.check(T.ev(pg,'SOTA.rpg.ui()')!='create','a tap on New Game opened creation without asking')
  shot(pg,'title-newgame-confirm-360x640.png');T.ttap(pg,'#ititle-newno');T.check(T.ev(pg,'!!document.getElementById("ititle-cont")'),'No did not bring the menu back')
  T.ttap(pg,'#ititle-cont');pg.wait_for_timeout(150);T.check(not T.ev(pg,'SOTA.intro.titleOpen()') and T.ev(pg,'SOTA.rpg.live().party[0].name')==name and T.ev(pg,'SOTA.rpg.ui()')!='create','Continue did not continue')
  # hold gesture on the wall still continues
  T.ev(pg,'SOTA.intro.showTitle()');pg.wait_for_timeout(150);pg.mouse.move(180,200);pg.mouse.down();pg.wait_for_timeout(900);pg.mouse.up();pg.wait_for_timeout(150)
  T.check(not T.ev(pg,'SOTA.intro.titleOpen()') and T.ev(pg,'SOTA.rpg.ui()')!='create','hold-to-continue no longer works');b.close()
def t_title_load(p):
  b,pg=saved_ctx(p);o=json.loads(T.ev(pg,'localStorage.getItem("sota.party.slot0")'))
  for i,c in enumerate(o['party']):c['hp']=max(1,c['hp']-3-i);c['mp']=max(0,c['mp']-1-i)
  want=[[c['hp'],c['mp']] for c in o['party']];T.ev(pg,'s=>localStorage.setItem("sota.party.slot1",s)',json.dumps(o))
  T.ev(pg,'SOTA.rpg.live().party.forEach(c=>{c.hp=1;c.mp=0;})');T.ev(pg,'SOTA.intro.showTitle()');pg.wait_for_timeout(150)
  T.ttap(pg,'#ititle-load');T.check(T.ev(pg,'SOTA.rpg.ui()')=='save-picker' and not T.ev(pg,'SOTA.intro.titleOpen()'),'Load Game did not open the picker');shot(pg,'title-load-picker-360x640.png')
  T.ttap(pg,'[data-save-slot="1"]');pg.wait_for_timeout(200);got=json.loads(T.ev(pg,'JSON.stringify(SOTA.rpg.live().party.map(c=>[c.hp,c.mp]))'))
  T.check(got==want,f'Load Game did not restore the stored HP/MP {got} vs {want}');T.check(T.ev(pg,'SOTA.rpg.activeSlot()')==1,'slot 2 not active');b.close()
with sync_playwright() as p:
  for n,f in [('camp arrival: no tent, no save',t_arrival),('camp tabs Cook/Rest/Save/Return fit; Rest refills only',t_tabs_rest),('Save with no tent explains and stops',t_no_tent),
              ('cancel at the tent question changes nothing',t_cancel_confirm),('cancel at the slot picker changes nothing',t_cancel_picker),('Save: refill + 1 tent + slot together; pitched re-save free',t_save_and_resave),
              ('first-camp lesson Save step',t_tutorial_save),('title with no save',t_title_nosave),('title buttons, hold gesture, no accidental gesture',t_title_buttons),('title Load Game restores stored HP/MP',t_title_load)]:run(n,f,p)
print(f'{passed} passed, {failed} failed');print('page errors:',T.ERRS[:5]);sys.exit(1 if failed or T.ERRS else 0)
