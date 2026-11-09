"""Jeremy t2404u combined release, browser checks (usage: python3 tests/t2404u_combined_browser_test.py http://127.0.0.1:PORT/ [shots_dir]).
Splash first; Beasts shows the zone 3 pencil sketches; salts are battle-only (no Use in the bag, not offered for maze boxes);
a KO'd member wakes at 1 HP after a win; the level-up OK shows the unspent-points reminder; the 'You made ...!' toast covers neither
'Tap a box' hint (craft pop-up and camp lesson) nor a pop-up button at 390x844, 360x640 and 1280x800."""
import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import splash_helper as SPL
from playwright.sync_api import sync_playwright
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/').rstrip('/')+'/index.html';SHOTS=sys.argv[2] if len(sys.argv)>2 else None
ev=lambda pg,s,*a:pg.evaluate(s,*a);P=F=0
def check(ok,name):
  global P,F
  if ok:P+=1;print('PASS',name)
  else:F+=1;print('FAIL',name)
def shot(pg,n):
  if SHOTS:os.makedirs(SHOTS,exist_ok=True);pg.screenshot(path=os.path.join(SHOTS,n))
def newpg(p,w,h):
  b=p.chromium.launch();c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=w<700,service_workers='block');return b,c.new_page()
def hero(pg):
  ev(pg,'SOTA.intro.shortTap()');ev(pg,'localStorage.setItem("sota.dev.nostory","1")')
  ev(pg,'''([n,r,c])=>{const q=s=>document.querySelector(s);const i=q('#ccname');i.value=n;i.dispatchEvent(new Event('input'));q('[data-race='+r+']').click();q('[data-cls='+c+']').click();q('[data-skill]').click();q('#ccgo').click();if(SOTA.rpg.ui()==='create')q('#ccgo').click();}''',['Wes','human','warrior'])
  ev(pg,'localStorage.removeItem("sota.dev.nostory")')
RECT='s=>{const e=typeof s==="string"?document.querySelector(s):s;if(!e)return null;const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}'
ov=lambda a,b:bool(a and b and a[0]<b[2] and b[0]<a[2] and a[1]<b[3] and b[1]<a[3])
with sync_playwright() as p:
  b,pg=newpg(p,390,844);pg.goto(BASE);pg.wait_for_function('()=>window.SOTA&&SOTA.splash',timeout=8000)
  check(ev(pg,'SOTA.splash.state()')=='wait','splash waits for a tap first');SPL.pass_splash(pg);hero(pg)
  ev(pg,'()=>{const L=SOTA.rpg.live();L.beasts=["z1-rat","z3-centaur","z3-werewolf","z3-skeleton","z3-ghoul","z3-harpy","z3-direwolf","z3-wraith"];SOTA.rpg.closeUI();SOTA.intro.openJournal("beasts");}')
  pg.wait_for_function('()=>[...document.querySelectorAll("#ijour [data-beast] img")].every(i=>i.complete&&i.naturalWidth>0)',timeout=8000)
  g=ev(pg,'()=>[...document.querySelectorAll("#ijour [data-beast]")].map(f=>[f.dataset.beast,f.querySelector("img").naturalWidth])')
  check([x[0] for x in g]==['z1-rat','z3-centaur','z3-werewolf','z3-skeleton','z3-ghoul','z3-harpy','z3-direwolf','z3-wraith'] and all(w==1024 for _,w in g),f'Beasts lists the found zone 3 sketches {g}')
  shot(pg,'beasts-tab-zone3-sketches-390x844.png')
  ev(pg,'()=>document.querySelector("#ijour [data-beast=z3-ghoul]").click()');pg.wait_for_timeout(500)
  d=ev(pg,'()=>{const d=document.querySelector("#ijour [data-beast-detail]");return d&&[d.dataset.beastDetail,!!d.querySelector("img")]}')
  check(d==['z3-ghoul',True],f'zone 3 beast detail with sketch {d}');shot(pg,'beasts-detail-z3-ghoul-390x844.png');ev(pg,'SOTA.intro.closeJournal()')
  ev(pg,'()=>{SOTA.rpg.live().party[0].bag.push("salts");SOTA.rpg.bagScreen(0);}');ev(pg,'()=>document.querySelector("[data-item=salts]").click()');pg.wait_for_timeout(200)
  r=ev(pg,'()=>{const o=document.getElementById("s4");return [o.innerText.includes("Use in battle"),[...o.querySelectorAll("button")].some(x=>x.textContent==="Use")]}')
  check(r==[True,False],f'salts: "Use in battle", no Use button outside a fight {r}');shot(pg,'bag-salts-use-in-battle-390x844.png');ev(pg,'SOTA.rpg.closeUI()')
  check(not ev(pg,'()=>JSON.stringify(SOTA.rpg.mazeSlotChoices()).includes("salts")'),'salts not offered for a maze box')
  ev(pg,'()=>{const R=window.RPG,L=SOTA.rpg.live();if(L.party.length<2)L.party.push(R.makeCompanion(R.COMPANIONS[0],L.party[0].lvl));L.party.forEach(c=>c.spent=R.pointsEarned(c.lvl));SOTA.rpg.startFight([R.makeMonster(1,0,1,0,"normal")]);L.party[1].hp=0;SOTA.rpg.forceEnd("win");}')
  pg.wait_for_timeout(400);hp=ev(pg,'SOTA.rpg.live().party.map(c=>c.hp)');check(hp[1]==1 and hp[0]>1,f'KO member wakes at exactly 1 HP after a win {hp}');shot(pg,'fight-win-ko-wakes-at-1hp-390x844.png')
  ev(pg,'()=>{const b=document.getElementById("s5lvlok");if(b)b.click();document.getElementById("fdone").click();}');pg.wait_for_timeout(200)
  check(ev(pg,'SOTA.rpg.live().party[1].hp')==1,'stays at 1 HP until healed')
  ev(pg,'()=>{const L=SOTA.rpg.live();L.party[1].spent-=1;SOTA.rpg.s5.lvlPopup(["Mira reached level 2!"]);}');ev(pg,'()=>document.getElementById("s5lvlok").click()');pg.wait_for_timeout(300)
  t=ev(pg,'document.getElementById("s4toast").textContent');check('Mira has 1 stat point to spend. Tap Party to spend them.' in t,f'level-up reminder toast {t!r}');shot(pg,'levelup-points-reminder-toast-390x844.png');b.close()
  for w,h in [(390,844),(360,640),(1280,800)]:
    b,pg=newpg(p,w,h);pg.goto(BASE);SPL.pass_splash(pg);hero(pg)
    ev(pg,'()=>{SOTA.rpg.live().party[0].bag.push("i_herbs","p_shell");SOTA.rpg.s5.campScreen(0);SOTA.rpg.s5.craftPop(0);SOTA.rpg.s5.craftFill(["i_herbs","p_shell"]);SOTA.rpg.s5.craftPop(0);}')
    ev(pg,'()=>document.getElementById("s5craft").click()');pg.wait_for_timeout(350)
    t=ev(pg,'()=>document.getElementById("s4toast").textContent');tr=ev(pg,RECT,'#s4toast')
    hint=ev(pg,'()=>{const n=[...document.querySelectorAll("#s5craftpop .s4note")].find(e=>e.textContent.startsWith("Tap a box")).getBoundingClientRect();return [n.left,n.top,n.right,n.bottom]}')
    tut=ev(pg,RECT,'#s5tut');btn=ev(pg,'()=>[...document.querySelectorAll("#s5craftpop button")].filter(b=>b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})')
    check(t.startswith('You made Healing potion!') and tr[1]>=0 and tr[3]<=h,f'{w}x{h}: "You made ...!" toast shown on screen {tr}')
    check(not ov(tr,hint) and not ov(tr,tut) and not any(ov(tr,r) for r in btn),f'{w}x{h}: toast covers no Tap a box hint (pop-up {hint}, lesson {tut}) and no button')
    shot(pg,f'craft-you-made-toast-off-hint-{w}x{h}.png');b.close()
print(f'{P} passed, {F} failed');sys.exit(1 if F else 0)
