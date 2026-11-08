from playwright.sync_api import sync_playwright
import json,pathlib
report=[]
def check(ok,name):
 report.append(('PASS ' if ok else 'FAIL ')+name)
 if not ok:raise AssertionError(name)
with sync_playwright() as p:
 b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,service_workers='block');pg=ctx.new_page();errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
 pg.goto('http://127.0.0.1:19863/');pg.wait_for_timeout(1000)
 check(pg.evaluate('!!(SOTA.rpg.s6&&SOTA.rpg.s6.packageDialogue&&PackageRooms)'), 'package modules load on restored tree')
 check(pg.locator('#dvbtn').count()==0,'sample button absent')
 pg.evaluate('''()=>{SOTA.intro.hideTitle();const h=RPG.newChar('Hero','human','warrior',RPG.START_KIT.warrior.alloc,RPG.START_KIT.warrior.skill);const party=[h,...RPG.planParty(h,0).map(d=>RPG.makeCompanion(d,1))];SOTA.rpg.setLive({party,diff:'normal',gold:200,steps:0,recipes:{},fresh:{},tentWear:0});SOTA.rpg.s6.st();SOTA.teleport(...MAZE.taverns[0],0);SOTA.rpg.doSave();SOTA.rpg.s6.setSpeed(0);}''')
 check(pg.evaluate('''()=>{SOTA.rpg.partyScreen();SOTA.rpg.closeUI();return true;}'''),'party screen renders outside combat')
 check(not errors,'no runtime page errors at boot and party screen')
 def drain():
  for i in range(1500):
   v=pg.evaluate('SOTA.rpg.s6.line()')
   if not v:return
   if v['typing']:pg.wait_for_timeout(3);continue
   if pg.locator('#s6d .s6btns button').count():return
   pg.locator('#s6d .s6t').dispatch_event('pointerdown')
  raise AssertionError('drain limit')
 pg.evaluate('S6H.created()');pg.wait_for_timeout(20)
 check(pg.locator('#s6d .s6t').inner_text().startswith("Sit down, you're wearing a path"),'approved intro rendered');drain();pg.evaluate('SOTA.intro.hideCave()')
 pg.evaluate('S6H.ownerVisit(0)');pg.wait_for_timeout(10)
 check(pg.locator('#s6d .s6name').inner_text()=='Brannoc','keeper proper name rendered');drain()
 check(pg.evaluate('''()=>{S6H.reachedTavern(1);const a=SOTA.intro.wear();S6H.reachedTavern(2);const b=SOTA.intro.wear();S6H.reachedTavern(0);return a===3&&b===4&&SOTA.intro.wear()===4;}'''),'journal 1/3/4 wear marker never regresses')
 pg.evaluate('S6H.wall(84)');drain()
 check(pg.evaluate('!SOTA.rpg.s6.st().revealed'),'bedside-first does not reveal father')
 pg.evaluate('S6H.wall(80)');drain()
 check(pg.evaluate('SOTA.rpg.s6.st().revealed&&!SOTA.rpg.s6.st().picnicFirstMotive'),'bedside-first picnic reveal does not unlock wife motive')
 check(pg.evaluate('''()=>{const s=SOTA.rpg.s6.st();s.walls={};s.wallHeard={};s.order=[];s.revealed=false;delete s.picnicFirstMotive;S6H.wall(80);return s.revealed&&s.picnicFirstMotive;}'''),'picnic-first unlocks father and wife motive');drain()
 check(pg.evaluate('''()=>{const s=SOTA.rpg.s6.st();s.afterGap=5;s.afterCount=0;for(let i=0;i<4;i++)S6H.fightContinue([{hp:100,maxHp:100}]);return !SOTA.storyOpen();}'''),'four intervening fights silent')
 pg.evaluate('S6H.fightContinue([{hp:100,maxHp:100}])');check(pg.evaluate('SOTA.storyOpen()'),'due fifth fight plays a talk');drain()
 check(not errors,'no page errors through scene smoke paths')
 b.close()
pathlib.Path('/workspace/secret-adventures/game-export/t2187u/browser-smoke.txt').write_text('\n'.join(report)+'\n');print('\n'.join(report))
