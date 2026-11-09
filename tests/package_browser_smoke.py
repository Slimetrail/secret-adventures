import splash_helper as SPL  # t2386u logo splash: tap past it like a player
from playwright.sync_api import sync_playwright
import json,pathlib
report=[]
def check(ok,name):
 report.append(('PASS ' if ok else 'FAIL ')+name)
 if not ok:raise AssertionError(name)
with sync_playwright() as p:
 b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,service_workers='block');pg=ctx.new_page();errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
 pg.goto('http://127.0.0.1:19864/');SPL.pass_splash(pg);pg.wait_for_timeout(1000)
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
 pg.evaluate('S6H.created()');pg.wait_for_timeout(500)
 check(pg.locator('#s6d .s6t').inner_text().startswith("Sit down, you're wearing a path"),'approved intro rendered');drain();pg.wait_for_timeout(200);pg.evaluate('SOTA.intro.hideCave()')
 pg.evaluate('S6H.ownerVisit(0)');pg.wait_for_timeout(10)
 check(pg.locator('#s6d .s6name').inner_text()=='Brannoc','keeper proper name rendered');drain()
 check(pg.evaluate('''()=>{S6H.reachedTavern(1);const a=SOTA.intro.wear();S6H.reachedTavern(2);const b=SOTA.intro.wear();S6H.reachedTavern(0);return a===3&&b===4&&SOTA.intro.wear()===4;}'''),'journal 1/3/4 wear marker never regresses')
 def close_art():
  check(pg.locator('#s6d .s6t').inner_text()=='','held naming room has no spoken text')
  check(pg.locator('#s6d .s6wall').is_visible(),'held naming room painting remains visible')
  pg.locator('#s6d .s6btns button').click()
 pg.evaluate('S6H.wall(84)');close_art()
 check(pg.evaluate('SOTA.rpg.s6.st().revealed&&!SOTA.rpg.s6.st().wifeMotive'),'bedside alone reveals but does not unlock wife motive')
 pg.evaluate('S6H.wall(80)');close_art()
 check(pg.evaluate('SOTA.rpg.s6.st().revealed&&SOTA.rpg.s6.st().wifeMotive'),'bedside then picnic unlocks wife motive')
 pg.evaluate('''()=>{const s=SOTA.rpg.s6.st();s.walls={};s.wallHeard={};s.order=[];S6H.wall(80);}''');close_art()
 check(pg.evaluate('SOTA.rpg.s6.st().revealed&&!SOTA.rpg.s6.st().wifeMotive'),'picnic alone reveals but does not unlock wife motive')
 pg.evaluate('S6H.wall(84)');close_art()
 check(pg.evaluate('SOTA.rpg.s6.st().wifeMotive'),'picnic then bedside unlocks wife motive')
 check(pg.evaluate('''()=>{const api=SOTA.rpg.s6,s=api.st();s.walls={42:1};delete s.brunnJoin;S6H.joined({},3);const first=s.brunnJoin;s.walls[37]=1;S6H.joined({},3);return first==='died'&&s.brunnJoin==='died';}'''),'Brunn revenge does not flip after later finds');drain()
 check(pg.evaluate('''()=>{const api=SOTA.rpg.s6,s=api.st();s.walls={42:1,37:1};delete s.brunnJoin;S6H.joined({},3);return s.brunnJoin==='save';}'''),'Brunn two-kind save version selected');drain()
 check(pg.evaluate('''()=>{const api=SOTA.rpg.s6,s=api.st();s.walls=Object.fromEntries(Object.keys(api.roomArt()).map(k=>[k,1]));const high=api.endingFor();delete s.walls[4];return high==='high'&&api.endingFor()!=='high';}'''),'best ending requires early-zone art too')
 check(pg.evaluate('''()=>SOTA.rpg.s6.journalWritingHeld&&Object.keys(T2103U_TEXT.journal).length===0&&Object.keys(T2103U_TEXT.wall).length===0'''),'unapproved journal and margin prose held')
 check(pg.evaluate('''()=>{const s=SOTA.rpg.s6.st();s.afterGap=5;s.afterCount=0;for(let i=0;i<4;i++)S6H.fightContinue([{hp:100,maxHp:100}]);return !SOTA.storyOpen();}'''),'four intervening fights silent')
 pg.evaluate('S6H.fightContinue([{hp:100,maxHp:100}])');check(pg.evaluate('SOTA.storyOpen()'),'due fifth fight plays a talk');drain()
 pg.locator('#mapb').dispatch_event('pointerdown')
 pg.evaluate('''()=>{const C=SOTA.core,old=C.visited.findIndex(v=>!v),i=Array.from(C.zoneOf).findIndex((z,k)=>z>0&&!C.visited[k]);window.mapCheck={i,before:+document.getElementById('map').dataset.cells};SOTA.teleport(i%MAZE.n,Math.floor(i/MAZE.n),2);}''');pg.wait_for_timeout(200)
 check(pg.evaluate('''()=>{const d=document.getElementById('map').dataset,i=mapCheck.i;return SOTA.core.visited[i]&&+d.cells>mapCheck.before&&+d.arrow===2&&SOTA.map.marker().rr>0;}'''),'open live map inks new visit and refreshes facing marker without camp')
 pg.evaluate('SOTA.map.close()')
 check(not errors,'no page errors through scene smoke paths')
 b.close()
pathlib.Path('/workspace/secret-adventures/game-export/t2187u/story-gates-browser-smoke.txt').write_text('\n'.join(report)+'\n');print('\n'.join(report))
