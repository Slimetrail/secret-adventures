"""t2103u browser checks: title-only boot, tap -> create, long-press continue, install/update placement,
journal six tabs + wear art, intro/ending staging and moods, credits keep .s6title, notes locks, no network.
Usage: python tests/t2103u_browser_tests.py [base_url]"""
import sys,json
from playwright.sync_api import sync_playwright
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/').rstrip('/')+'/'
class Fail(Exception):pass
def check(c,m):
  if not c:raise Fail(m)
def ctx(p):
  b=p.chromium.launch();c=b.new_context(viewport={'width':412,'height':915},has_touch=True,is_mobile=True,service_workers='block');return b,c
def page(c,reqs=None,errs=None):
  pg=c.new_page()
  if reqs is not None:pg.on('request',lambda r:reqs.append(r.url))
  if errs is not None:pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(BASE+'index.html');pg.wait_for_function('window.SOTA&&SOTA.intro');pg.wait_for_timeout(200);return pg
ev=lambda pg,s,*a:pg.evaluate(s,*a)
def make(pg,race='human',cls='warrior',name='Wes'):
  ev(pg,'''([n,r,c])=>{const q=s=>document.querySelector(s);const i=q('#ccname');i.value=n;i.dispatchEvent(new Event('input'));q('[data-race='+r+']').click();q('[data-cls='+c+']').click();q('[data-skill]').click();q('#ccgo').click();if(SOTA.rpg.ui()==='create')q('#ccgo').click();}''',[name,race,cls])
def hold(pg,ms):pg.mouse.move(200,450);pg.mouse.down();pg.wait_for_timeout(ms);pg.mouse.up();pg.wait_for_timeout(150)
def t_title_boot(p):
  b,c=ctx(p);reqs=[];errs=[];pg=page(c,reqs,errs)
  check(ev(pg,'SOTA.intro.titleOpen()') and ev(pg,'SOTA.rpg.ui()') is None,'boot did not show title-only menu')
  check(ev(pg,'document.getElementById("ititle-t").textContent')=='Secret of the Adventure','title string')
  check(ev(pg,'document.querySelectorAll("#ititle button").length')==0,'buttons on title')
  check(ev(pg,'document.getElementById("ititle").dataset.art')=='ready','title wall art not wired')
  check(not ev(pg,'[...document.querySelectorAll(".iapp")].some(e=>e.offsetParent)'),'install/update visible on title')
  check(ev(pg,'SOTA.music.now()')=='title_intro','title cue');
  pg.touchscreen.tap(200,450);pg.wait_for_timeout(200)
  check(ev(pg,'SOTA.rpg.ui()')=='create' and not ev(pg,'SOTA.intro.titleOpen()'),'tap did not open creation')
  check(ev(pg,'!!document.querySelector("#s4 .iapp .iinst")&&!!document.querySelector("#s4 .iapp .iupd")'),'install/update not on creation')
  check(ev(pg,'document.querySelector("#s4 .iupd").textContent')=='Check for update','update label')
  check(ev(pg,'localStorage.getItem("sota.party")') is None,'opening creation wrote a save')
  check(not [u for u in reqs if not u.startswith(BASE)],'network outside origin');check(not errs,str(errs));b.close()
def t_longpress_no_save(p):
  b,c=ctx(p);pg=page(c);hold(pg,900);check(ev(pg,'SOTA.rpg.ui()')=='create','long-press without save should act like tap');b.close()
def t_save_kept_and_continue(p):
  b,c=ctx(p);pg=page(c);ev(pg,'SOTA.intro.shortTap()');ev(pg,'localStorage.setItem("sota.dev.nostory","1")');make(pg,'elf','mage','Ael')
  s0=ev(pg,'localStorage.getItem("sota.party")');check(s0,'no save after Confirm')
  pg.reload();pg.wait_for_function('SOTA.intro&&SOTA.intro.titleOpen()');pg.touchscreen.tap(200,450);pg.wait_for_timeout(150)
  check(ev(pg,'SOTA.rpg.ui()')=='create' and ev(pg,'!!document.getElementById("ititleb")'),'tap with save: creation + back button')
  check('new adventure' in ev(pg,'document.getElementById("inew").textContent'),'new adventure note')
  check(ev(pg,'localStorage.getItem("sota.party")')==s0,'opening creation changed the save')
  ev(pg,'document.getElementById("ititleb").click()');check(ev(pg,'SOTA.intro.titleOpen()'),'back to title')
  hold(pg,900);check(not ev(pg,'SOTA.intro.titleOpen()') and ev(pg,'SOTA.rpg.ui()') is None and ev(pg,'SOTA.rpg.live().party[0].name')=='Ael','long-press did not continue')
  check(ev(pg,'localStorage.getItem("sota.party")')==s0,'continue changed save');b.close()
def t_intro_cave(p):
  b,c=ctx(p);errs=[];pg=page(c,errs=errs);ev(pg,'SOTA.intro.shortTap()');make(pg,'cat','rogue','Miso');pg.wait_for_timeout(450)
  check(ev(pg,'SOTA.rpg.s6.line().kind')=='opening' and ev(pg,'SOTA.music.now()')=='sick_father','sick-dad scene/cue')
  ev(pg,'SOTA.rpg.s6.setSpeed(0)');pg.wait_for_timeout(100)
  for _ in range(30):  # mood lands once the first line finishes typing
    if ev(pg,'!!document.getElementById("s6d").dataset.moodPair'):break
    pg.wait_for_timeout(100)
  st=ev(pg,'(()=>{const b=document.getElementById("s6d"),im=[...b.querySelectorAll(".ia-stage img")].map(i=>i.getAttribute("src"));return {r:b.dataset.artReady,im,bg:b.querySelector(".ia-stage").style.backgroundImage,mood:b.dataset.moodPair,mi:b.dataset.moodIndex}})()')
  check(st['r']=='1' and st['im']==[] and 'art-intro/sickdad/sickdad-cat.webp' in st['bg'],f'sick-dad staging {st}')
  check(st['mood']=='Intro' and st['mi']=='0',f'intro mood not applied {st}')
  for i in range(200):  # some Enters land mid-typing and only finish the line; give the 12 lines enough presses
    if ev(pg,'SOTA.intro.caveOpen()'):break
    pg.keyboard.press('Enter');pg.wait_for_timeout(60)
  check(ev(pg,'SOTA.intro.caveOpen()') and ev(pg,'document.getElementById("icave").dataset.artReady')=='1','cave card')
  check(ev(pg,'document.querySelector(".icave-hero").getAttribute("src")')=='art-intro/cave/back-cat-rogue.webp','cave hero')
  check(ev(pg,'document.getElementById("icave").dataset.titleShown')=='0','title appeared before stand')
  check(ev(pg,'document.querySelector(".icave-title").hidden && document.querySelector(".icave-tap").hidden && !document.querySelector(".icave-title").children.length'),'title/hint not empty and hidden')
  pg.touchscreen.tap(200,450);pg.wait_for_timeout(100);check(ev(pg,'SOTA.intro.caveOpen()'),'early tap skipped title')
  pg.wait_for_function('() => document.getElementById("icave").dataset.titleShown==="1"')
  check(ev(pg,'!document.querySelector(".icave-title").hidden && !document.querySelector(".icave-tap").hidden'),'title/hint not revealed')
  pg.touchscreen.tap(200,450);pg.wait_for_timeout(100);check(not ev(pg,'SOTA.intro.caveOpen()'),'cave did not close')
  check(ev(pg,'SOTA.intro.keyMoments().map(e=>e[0])')==['J-leave-home'],'leave-home entry');check(not errs,str(errs));b.close()
def t_race_only_paintings(p):
  for race,cls in [('cat','rogue'),('dwarf','warrior'),('elf','mage'),('human','archer')]:
    b,c=ctx(p);errs=[];pg=page(c,errs=errs);ev(pg,'SOTA.intro.shortTap()');make(pg,race,cls);pg.wait_for_timeout(250)
    pg.wait_for_function('() => document.querySelector("#s6d .ia-stage.sickdad")')
    st=ev(pg,'''(()=>{const b=document.getElementById("s6d"),s=b.querySelector(".ia-stage");return {art:SOTA.intro.sickArt(),bg:s.style.backgroundImage,busts:s.querySelectorAll(".ia-person,img").length,portrait:getComputedStyle(b.querySelector(".s6pf")).display};})()''')
    check(st['art']=={'b':f'sickdad/sickdad-{race}.webp','ready':True},f'race-only selection {st}')
    check(f'art-intro/sickdad/sickdad-{race}.webp' in st['bg'] and st['busts']==0 and st['portrait']=='none',f'painting-only staging {st}')
    check(not errs,str(errs));b.close()
def t_journal(p):
  b,c=ctx(p);pg=page(c);ev(pg,'SOTA.intro.shortTap()');ev(pg,'localStorage.setItem("sota.dev.nostory","1")');make(pg)
  ev(pg,'document.getElementById("partyb").click()');check(ev(pg,'!!document.querySelector("#s4 .iapp")'),'install/update not on party screen')
  ev(pg,'document.getElementById("ijournalb").click()')
  check(ev(pg,'[...document.querySelectorAll(".ijtab")].map(t=>t.textContent)')==['Inventory','Beasts','Map','Found art','Journal','Recipes','Settings'],'tabs')
  check(ev(pg,'getComputedStyle(document.getElementById("ijour").querySelector(".ijbook")).backgroundImage').count('book-zone1')==1,'book zone1 art')
  check(ev(pg,'!!document.querySelector("#ijour .iapp")'),'install/update in journal')
  for t in ['inventory','beasts','map','art','journal','recipes','settings']:ev(pg,f'document.querySelector("[data-tab={t}]").click()')
  # notes locks via the story state (s6 st is the save's story object)
  ev(pg,'(()=>{const s=SOTA.rpg.s6.st(),ra=SOTA.rpg.s6.roomArt();const id=Object.keys(ra).find(k=>ra[k][1].startsWith("zone4-01"));s.walls[id]=1;s.order=[+id];})()')
  ev(pg,'SOTA.intro.openJournal("art")');check('gathered' in ev(pg,'document.querySelector(".ijnote").textContent'),'wall edge note')
  check(ev(pg,'document.getElementById("ijour").dataset.wear')=='4','wear follows found zones')
  check(not ev(pg,'SOTA.intro.keyMoments().some(e=>e[0]==="J-picnic-reveal")'),'picnic entry before reveal')
  ev(pg,'SOTA.rpg.s6.st().revealed=true');check(ev(pg,'SOTA.intro.keyMoments().some(e=>e[0]==="J-picnic-reveal")'),'picnic entry after reveal');b.close()
def t_endings(p):
  for k,walls in [('low',''),('mid','crack'),('high','all')]:
    b,c=ctx(p);pg=page(c);ev(pg,'SOTA.intro.shortTap()');ev(pg,'localStorage.setItem("sota.dev.nostory","1")');make(pg)
    ev(pg,'w=>{const s=SOTA.rpg.s6.st(),K=SOTA.rpg.s6.LETTER_KEYS;if(w)s.walls[K.crack]=1;if(w==="all"){K.z4.forEach(r=>s.walls[r]=1);s.walls[K.picnic]=1;s.walls[K.wizard]=1;}}',walls)
    ev(pg,'localStorage.removeItem("sota.dev.nostory")');ev(pg,'SOTA.rpg.s6.setSpeed(0)');ev(pg,'SOTA.rpg.s6.showEnding()')
    check(ev(pg,'SOTA.rpg.s6.st().ending')==k,'ending '+k)
    for i in range(30):
      if ev(pg,'!!document.querySelector("#s6d .s6title")'):break
      pg.keyboard.press('Enter');pg.wait_for_timeout(60)
    pg.wait_for_timeout(450);r=ev(pg,'(()=>{const b=document.getElementById("s6d");return {bg:(b.querySelector(".ia-stage")||{style:{}}).style.backgroundImage,t:!!b.querySelector(".s6title"),cr:!!b.querySelector("#icred"),m:SOTA.music.now()}})()')
    check(k+'-backdrop' in (r['bg'] or '') and r['t'] and r['cr'] and r['m']=='credits',f'{k}: {r}');b.close()
TESTS=[t_title_boot,t_longpress_no_save,t_save_kept_and_continue,t_intro_cave,t_race_only_paintings,t_journal,t_endings]
if __name__=='__main__':
  ok=0
  with sync_playwright() as p:
    for t in TESTS:
      try:t(p);ok+=1;print('PASS',t.__name__)
      except Exception as e:print('FAIL',t.__name__,str(e)[:400])
  print(f'{ok}/{len(TESTS)} passed');sys.exit(0 if ok==len(TESTS) else 1)
