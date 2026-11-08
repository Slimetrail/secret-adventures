"""Approved Secret Adventures music cues (Eve t2058u, 2026-11-07): files, offline list, and which cue each screen picks.
Usage: python tests/music_tests.py [base_url]"""
import os,sys,hashlib,time
sys.path.insert(0,os.path.dirname(__file__))
import stage4_tests as S4
import stage6_tests as S6
from stage4_tests import check,ev,tap,page,create,Fail
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPROVED={'title_intro':'1b6a67f5393233c4f37a8c97000931b45d8317feda71cf8b391db798f8875cd2','sick_father':'be3a460bded021d527dab11a2eac4502413be798e54dcbddd6a54159085ad4fe',
'camping':'80dd227b672700f60f69bf4f00ddd16d6beecc92a87b3fcfeafadfb8e0683679','art_room':'23bf78d84f319af57ccadeb62a93eccce7411079342463dc232f476934a13477',
'tavern':'318b9fde1aa701adf02e96ebc37d87d2ba75ca78481e9791f7dfabcf20643a13','fighting':'839af1727a8ef515f7bb9b631a4b7429829ce0141286be4f471491c9914b031b',
'victory':'ca10d235cfd71ef960e0db52f2e670be966d7f8fa3b2d0a9542054a4296946f1','menu':'ef64c05ccb53691a9bd5fd4e746618442c95d80c812f3dbe8a202edcbe64d3ed',
'final_boss':'7f8673e416e6d549e6bd9bded072d2d14876fdc219c392e246afa95666c20c84','death':'4cb683dfe7492c42e01026f6016ef6c5f42d426670761071bc0bb2d74e92cf29',
'decision_pulse':'b28b434acffd9a48c526818f0d56d1193f18d58fe1660beb015328221bbf02d8','sacrifice':'71866259adf691436cd2933c5a773af94bf53a22336dd3f80586dbd7ab8d8fb9',
'partial_fix':'8d3d83e188e36ccf9cb07d0780d6e4b9c457c4162b04f222e4cd5654c07ed153','true_ending':'ab8848cd573fe1bf9e207fd445201e7043afa83ec99e9a4d90f6a0648428f1b8',
'credits':'3916a5c97700120fd709b852352e903d5be413b30dbf70d8296671a3473009c9',
'maze_base':'cd0ccbec4b3c13cb52430e57d889fe651fd768b6a7f09856559242add14a74fc','maze_zone1':'cd0ccbec4b3c13cb52430e57d889fe651fd768b6a7f09856559242add14a74fc',
'maze_zone2':'358d2b557debf563d68ec45d9dfbdcd8edd7e606236007ff3734de9969d8c131','maze_zone3':'c040d2a58301e6da69b10c2016444563e1990682dc353fdc1ee2ab760176c062',
'maze_zone4':'fe802d19b080e9ee4237f2119925a1e9d40171c29b32816558e384d67fdd2151','maze_zone5':'3a4597725e733f3b06987a3a836c879907cc10afde3437782e3b79b7125cb394'}
def t_files(p):
 d=os.path.join(ROOT,'music');have=sorted(os.listdir(d))
 check(have==sorted(k+'.mp3' for k in APPROVED),'music folder holds '+str(have))
 for k,h in APPROVED.items():check(hashlib.sha256(open(os.path.join(d,k+'.mp3'),'rb').read()).hexdigest()==h,'hash '+k)
 sw=open(os.path.join(ROOT,'sw.js')).read();js=open(os.path.join(ROOT,'music.js')).read()
 for k in APPROVED:check('"music/%s.mp3"'%k in sw,'not cached offline '+k)
 check('"music.js?v=18"' in sw,'music.js not cached')
 for bad in ['http://','https://','XMLHttpRequest','sendBeacon','adsbygoogle']:check(bad not in js,'outside URL in music.js')
def ctx2(p,auto=True):
 b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'] if auto else [])
 return b,b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,service_workers='block')
def wait(pg,cue,ms=3000):
 t=time.time()
 while time.time()-t<ms/1000:
  if ev(pg,'SOTA.music.now()')==cue:return
  pg.wait_for_timeout(50)
 raise Fail('wanted cue %s, got %s'%(cue,ev(pg,'SOTA.music.now()')))
def t_flow(p):
 b,c=ctx2(p);errs=[];pg=page(c,errs);pg.touchscreen.tap(200,400);wait(pg,'title_intro')
 create(pg);wait(pg,'sick_father');pg.wait_for_timeout(600);check(ev(pg,'SOTA.music.playing()'),'sick father not actually playing')
 S6.drain(pg);wait(pg,'maze_zone1',4500)
 tap(pg,'#partyb');wait(pg,'menu');ev(pg,'SOTA.rpg.s5.campScreen(0)');wait(pg,'camping');ev(pg,'SOTA.rpg.s5.tavernScreen(0)');wait(pg,'tavern')
 S6.drain(pg);wait(pg,'tavern');ev(pg,'document.querySelector("#s4 .s4back").click()');wait(pg,'maze_zone1',4500)
 check(not errs,'browser errors '+str(errs[:3]));b.close()
def fight_case(p,boss,how,first,then):
 b,c=ctx2(p);pg=page(c);create(pg);S6.drain(pg)
 if boss:ev(pg,'SOTA.rpg.startBoss()')
 else:ev(pg,'SOTA.rpg.startFight(RPG.encounter(1,1,0,SOTA.rpg.live().diff,7,SOTA.rpg.live().party))')
 wait(pg,'final_boss' if boss else 'fighting');ev(pg,'SOTA.rpg.forceEnd("%s")'%how);wait(pg,first)
 if then:
  ev(pg,'(()=>{const a=document.querySelector("audio[data-cue=%s]");return 0})()'%first)
  wait(pg,then,30000)
 b.close()
def t_fight_win(p):fight_case(p,False,'win','victory','maze_zone1')
def t_boss_win_lose(p):
 fight_case(p,True,'win','victory',None);fight_case(p,True,'lose','death','decision_pulse')
def t_lose(p):fight_case(p,False,'lose','death','decision_pulse')
def t_wall_and_note(p):
 b,c=ctx2(p);pg=page(c);create(pg);S6.drain(pg)
 rid=ev(pg,'SOTA.rpg.s6.artRooms()[0]');ev(pg,'S6H.wall(%d)'%rid);wait(pg,'art_room');S6.drain(pg);wait(pg,'maze_zone1',4000)
 ev(pg,'SOTA.rpg.s6.bossNote()');wait(pg,'menu');b.close()
def t_endings(p):
 for k,cue in [('low','sacrifice'),('mid','partial_fix'),('high','true_ending')]:
  b,c=ctx2(p);pg=page(c);create(pg);S6.drain(pg)
  ev(pg,'SOTA.rpg.s6.st().ending=null');ev(pg,'SOTA.rpg.s6.endingFor=()=>"%s"'%k)
  # drive showEnding through its own reading: fake the letter reading by walls
  ev(pg,'(()=>{const s=SOTA.rpg.s6.st(),K=SOTA.rpg.s6.LETTER_KEYS;s.walls={};if("%s"!=="low"){s.walls[K.crack]=1;}if("%s"==="high"){K.z4.forEach(r=>s.walls[r]=1);s.walls[K.picnic]=1;s.walls[K.wizard]=1;}})()'%(k,k))
  ev(pg,'SOTA.rpg.s6.showEnding()');check(ev(pg,'SOTA.rpg.live().story.ending')==k,'ending key');
  if ev(pg,'!!SOTA.rpg.s6.line()&&!document.querySelector("#s6d .s6title")'):wait(pg,cue)
  S6.drain(pg);wait(pg,'credits');tap(pg,'[data-s6b=back]');wait(pg,'maze_zone1',4000);b.close()
def t_zone_loops(p):
 b,c=ctx2(p);pg=page(c);create(pg);S6.drain(pg);wait(pg,'maze_zone1',4500)
 xy=ev(pg,'(()=>{const c=SOTA.core,N=SOTA.N;for(let i=0;i<N*N;i++)if(+c.zoneOf[i]==2&&c.mask[i])return [i%N,(i/N)|0];})()')
 ev(pg,'SOTA.teleport(%d,%d,0)'%tuple(xy));wait(pg,'maze_zone2',4000)
 ev(pg,'SOTA.teleport(19,24,0)');wait(pg,'maze_zone2',4000)
 ev(pg,'SOTA.contentCap=window.SOTA_CONTENT_CAP.create(SOTA.N,SOTA.core.zoneOf,{maxZone:5,extraCells:[]})')
 for z in [3,4,5]:
  xy=ev(pg,'(()=>{const c=SOTA.core,N=SOTA.N;for(let i=0;i<N*N;i++)if(+c.zoneOf[i]==%d&&c.mask[i])return [i%%N,(i/N)|0];})()'%z)
  ev(pg,'SOTA.teleport(%d,%d,0)'%tuple(xy));wait(pg,'maze_zone%d'%z,4000)
 b.close()
def t_gesture_retry(p):
 b,c=ctx2(p,auto=False);pg=page(c);pg.wait_for_timeout(500)
 check(ev(pg,'SOTA.music.now()') in (None,''),'title music started before a gesture')
 check(not ev(pg,'SOTA.music.playing()'),'title music playing before a gesture')
 pg.touchscreen.tap(200,400);wait(pg,'title_intro');check(ev(pg,'SOTA.music.playing()'),'title music did not start after a tap');b.close()
TESTS=[v for k,v in list(globals().items()) if k.startswith('t_') and (len(sys.argv)<3 or k in sys.argv[2].split(','))]
if __name__=='__main__':
 S4.BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/';ok=0;bad=[]
 with sync_playwright() as p:
  for t in TESTS:
   t0=time.time()
   try:t(p);ok+=1;print('PASS',t.__name__,f'{time.time()-t0:.1f}s',flush=True)
   except Exception as e:bad.append(t.__name__);print('FAIL',t.__name__,repr(e)[:400],flush=True)
 print(f'music: {ok} passed, {len(bad)} failed',bad);sys.exit(1 if bad else 0)
