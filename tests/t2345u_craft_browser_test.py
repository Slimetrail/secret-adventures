"""Jeremy t2345u/t2347u/t2348u/t2350u on a pretend phone (390x844, touch), through real taps:
camp Craft button at the top centre (with and without a tent), 4 one-item boxes, picker, Craft, 8-bit result picture.
Screenshots go to ../game-export/t2345u-shots/. Usage: python tests/t2345u_craft_browser_test.py [base_url]"""
import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
from playwright.sync_api import sync_playwright
SHOTS=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','game-export','t2345u-shots')
os.makedirs(SHOTS,exist_ok=True)
passed=failed=0
def run(name,f,p):
  global passed,failed
  try:f(p);passed+=1;print('PASS',name)
  except Exception as e:failed+=1;print('FAIL',name,e)
def setup(p,bag,tent=False,camp=1):
  """camp 2 by default: the one-time lesson lives at camp 1 and has its own test"""
  b,c=T.ctx(p);pg=T.fresh(c);T.full_create(pg,'Tess','human','warrior')
  T.ev(pg,'''a=>{const b=a[0],L=SOTA.rpg.live();L.party[0].bag=L.party[0].bag.filter(x=>x!=="tent").concat(b);SOTA.rpg.closeUI();const k=MAZE.camps[a[1]];SOTA.teleport(k[0],k[1],0);}''',[bag+(['tent'] if tent else []),camp])
  pg.wait_for_timeout(500);T.ttap(pg,'#s5here');T.check(T.ui(pg)=='camp','camp did not open from the place tab');return b,pg
def bagn(pg,id):return T.ev(pg,'id=>SOTA.rpg.live().party.flatMap(c=>c.bag).filter(x=>x===id).length',id)
def t_new_game_kit(p):
  b,c=T.ctx(p);pg=T.fresh(c);T.full_create(pg,'Tess','human','warrior')
  bag=T.ev(pg,'SOTA.rpg.live().party[0].bag.slice().sort()');print('  new-game bag:',bag)
  T.check(bagn(pg,'p_hide')==3 and bagn(pg,'p_silk')==3,f'kit parts {bag}')
  T.check(bagn(pg,'potion')==3 and bagn(pg,'ether')==2,f't2372s8806 kit potions {bag}')
  T.check(sorted(x for x in bag if x not in('p_hide','p_silk','potion','ether'))==[],f'other free items {bag}')
  T.check(bagn(pg,'tent')==0,'a tent was handed over');b.close()
def tut_step(pg):return T.ev(pg,'(()=>{const t=document.getElementById("s5tut");return t?+t.dataset.step:0})()')
def hl(pg):return T.ev(pg,'[...document.querySelectorAll("#s4 .s5hl")].map(e=>e.dataset.craftopen?"craft-button":e.classList.contains("s5cboxes")?"boxes":e.id||e.dataset.tutsave&&"save"||"?")')
def t_first_camp_lesson(p):
  b,c=T.ctx(p);pg=T.fresh(c);T.full_create(pg,'Tess','human','warrior')
  T.ev(pg,'(()=>{SOTA.rpg.closeUI();const k=MAZE.camps[0];SOTA.teleport(k[0],k[1],0);})()');pg.wait_for_timeout(2600);T.ttap(pg,'#s5here');pg.wait_for_timeout(300)
  T.check(tut_step(pg)==1 and hl(pg)==['craft-button'],f'step 1 {tut_step(pg)} {hl(pg)}');pg.screenshot(path=os.path.join(SHOTS,'lesson-1-craft-button.png'))
  T.ttap(pg,'[data-craftopen]');T.check(tut_step(pg)==2 and hl(pg)==['boxes'],f'step 2 {hl(pg)}')
  T.ttap(pg,'#s5craftpop [data-cbox="0"]');T.ttap(pg,'#s5craftpop [data-cpick=p_silk]');T.ttap(pg,'#s5craftpop [data-cpick=p_hide]')
  T.check(tut_step(pg)==3 and hl(pg)==['s5craft'],f'step 3 {hl(pg)}');pg.screenshot(path=os.path.join(SHOTS,'lesson-2-3-boxes-filled.png'))
  T.check(bagn(pg,'tent')==0,'tent handed over');T.ttap(pg,'#s5craftpop #s5craft');pg.wait_for_timeout(200)
  T.check(bagn(pg,'tent')==1 and T.ev(pg,'SOTA.rpg.live().crafts.tent')=='earned','player did not craft the tent')
  T.check(tut_step(pg)==4,'no step 4');note=T.ev(pg,'document.querySelector("#s5tut .s4note").textContent')
  T.check('only save at camping spots' in note and 'each save uses one tent' in note,note);pg.screenshot(path=os.path.join(SHOTS,'lesson-4-save.png'))
  T.ttap(pg,'#s5tut [data-tutsave]');T.check(T.ui(pg)=='save-picker' and T.ev(pg,'document.querySelectorAll("[data-save-slot]").length')==4,'no 4-slot picker')
  T.ttap(pg,'[data-save-slot="1"]');pg.wait_for_timeout(200)
  T.check(bagn(pg,'tent')==0,'save did not use exactly 1 tent');T.check(T.ui(pg)=='camp' and tut_step(pg)==0,'lesson did not end')
  sv=T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot1"))');T.check(sv['campTut']=='shown' and [sv['at']['x'],sv['at']['y']]==T.ev(pg,'MAZE.camps[0]'),'lesson or camp not in the save')
  pg.screenshot(path=os.path.join(SHOTS,'lesson-done-saved.png'))
  T.check(T.ev(pg,'SOTA.rpg.doSave()')==True and bagn(pg,'tent')==0,'same-spot re-save failed or used a tent')
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');T.past_title(pg);pg.wait_for_timeout(300);T.ev(pg,'SOTA.rpg.closeUI()')
  T.ev(pg,'SOTA.rpg.s5.campScreen(0)');pg.wait_for_timeout(200);T.check(tut_step(pg)==0,'lesson shown again after reload');b.close()
def t_old_save_points(p):
  b,c=T.ctx(p);pg=T.fresh(c);T.full_create(pg,'Tess','human','warrior');T.ev(pg,'SOTA.rpg.doSave()')
  T.ev(pg,'(()=>{const k="sota.party.slot"+SOTA.rpg.activeSlot(),v=JSON.parse(localStorage.getItem(k));v.party[0].lvl=10;v.party[0].spent=60;v.party[0].stats.str+=5;localStorage.setItem(k,JSON.stringify(v));})()')
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');T.past_title(pg);pg.wait_for_timeout(300)
  r=T.ev(pg,'(()=>{SOTA.rpg.loadSlot(SOTA.rpg.activeSlot());const c=SOTA.rpg.live().party[0];return [c.lvl,c.spent,c.stats.str,RPG.pointsEarned(c.lvl)-c.spent]})()');print('  old save after load [lvl,spent,str,left]:',r)
  T.check(r[0]==10 and r[1]==T.ev(pg,'RPG.pointsEarned(10)') and r[2]==T.ev(pg,'JSON.parse(localStorage.getItem("sota.party.slot"+SOTA.rpg.activeSlot())).party[0].stats.str') and r[3]==0,f'old save not clamped {r}')
  b.close()
def craft_btn_top_centre(pg):
  r=T.ev(pg,'(()=>{const r=document.querySelector("[data-craftopen]").getBoundingClientRect();return [r.left+r.width/2,r.top,innerWidth]})()')
  T.check(abs(r[0]-r[2]/2)<3 and r[1]<40,f'Craft button not at the top centre {r}')
def boxes(pg):return T.ev(pg,'[...document.querySelectorAll("#s5craftpop [data-cbox]")].map(b=>b.dataset.item||null)')
def pic_pixels(pg):return T.ev(pg,'(()=>{const c=document.getElementById("s5craftpic");const d=c.getContext("2d").getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return [c.width,n,c.dataset.result,getComputedStyle(c).imageRendering]})()')
def t_success(p):
  for tent in (False,True):
    b,pg=setup(p,['i_herbs','p_shell','p_shard'],tent);craft_btn_top_centre(pg);pg.wait_for_timeout(2600);pg.screenshot(path=os.path.join(SHOTS,f'camp-{"tent" if tent else "no-tent"}-craft-button.png'))
    T.ttap(pg,'[data-craftopen]');T.check(boxes(pg)==[None]*4,'boxes not empty')
    T.ttap(pg,'#s5craftpop [data-cbox="0"]');T.ttap(pg,'#s5craftpop [data-cpick=i_herbs]');T.ttap(pg,'#s5craftpop [data-cpick=p_shell]')
    T.check(boxes(pg)==['i_herbs','p_shell',None,None],f'boxes {boxes(pg)}')
    if not tent:pg.screenshot(path=os.path.join(SHOTS,'craft-popup-filled.png'))
    T.ttap(pg,'#s5craftpop #s5craft');pg.wait_for_timeout(200)
    w,n,kind,ir=pic_pixels(pg);T.check(kind=='potion' and w==72 and n>1000 and ir=='pixelated',f'result picture {w,n,kind,ir}')
    T.check(T.ev(pg,'SOTA.rpg.live().party.flatMap(c=>c.bag).filter(x=>x==="potion").length')>=1,'no potion made')
    T.check(T.ev(pg,'SOTA.rpg.live().party.flatMap(c=>c.bag).filter(x=>x==="i_herbs"||x==="p_shell").length')==0,'boxes not used up')
    pg.screenshot(path=os.path.join(SHOTS,f'craft-result-potion-{"tent" if tent else "no-tent"}.png'));b.close()
def t_one_per_box_and_fail(p):
  b,pg=setup(p,['p_silk']*5+['i_bread','i_bread'])
  T.ttap(pg,'[data-craftopen]');T.ttap(pg,'#s5craftpop [data-cbox="0"]')
  for k in range(4):T.ttap(pg,'#s5craftpop [data-cpick=p_silk]')
  T.check(boxes(pg)==['p_silk']*4,f'one per box {boxes(pg)}');T.check(T.ev(pg,'!document.querySelector("#s5craftpop [data-cpick]")'),'picker open with 4 full boxes')
  T.ttap(pg,'#s5craftpop [data-cbox="3"]');T.check(boxes(pg)==['p_silk']*3+[None],'tap full box did not clear')
  T.ttap(pg,'#s5craftpop [data-cbox="1"]');T.ttap(pg,'#s5craftpop [data-cbox="2"]');T.ttap(pg,'#s5craftpop [data-cbox="1"]');T.ttap(pg,'#s5craftpop [data-cpick=i_bread]')
  mix=[x for x in boxes(pg) if x];kind=T.ev(pg,'m=>ECON.craftMatch(m)?"match":ECON.craftFail(m)',mix)
  T.ttap(pg,'#s5craftpop #s5craft');pg.wait_for_timeout(200);w,n,k2,ir=pic_pixels(pg)
  T.check(k2==kind and n>500,f'failure picture {k2} vs {kind}, {n} px');pg.screenshot(path=os.path.join(SHOTS,f'craft-result-fail-{kind}.png'))
  T.check(T.ev(pg,'SOTA.rpg.live().party.flatMap(c=>c.bag).filter(x=>x==="i_bread").length')==1,'failed mix not used up');b.close()
def t_tent_recipe(p):
  b,pg=setup(p,['p_silk','p_hide'])
  T.ttap(pg,'[data-craftopen]');T.ttap(pg,'#s5craftpop [data-cbox="0"]');T.ttap(pg,'#s5craftpop [data-cpick=p_silk]');T.ttap(pg,'#s5craftpop [data-cpick=p_hide]');T.ttap(pg,'#s5craftpop #s5craft');pg.wait_for_timeout(200)
  T.check(T.ev(pg,'SOTA.rpg.live().party.flatMap(c=>c.bag).includes("tent")'),'tent not crafted');T.check(pic_pixels(pg)[2]=='tent','no tent picture')
  pg.screenshot(path=os.path.join(SHOTS,'craft-result-tent.png'));b.close()
with sync_playwright() as p:
  for n,f in [('old save with overspent points loads, keeps stats, 0 left',t_old_save_points),('new game kit: exactly 3 healing + 2 mana + 3 hide + 3 silk',t_new_game_kit),('first-camp lesson: once, crafted tent, Save uses 1 tent',t_first_camp_lesson),('craft success with and without tent, top-centre button, pixel picture',t_success),('one item per box, cap 4, tap clears, failure picture',t_one_per_box_and_fail),('2-box tent recipe',t_tent_recipe)]:run(n,f,p)
print(f'{passed} passed, {failed} failed');print('page errors:',T.ERRS[:5]);sys.exit(1 if failed or T.ERRS else 0)
