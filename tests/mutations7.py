"""Each local temp-app mutation must fail its named test; that test must also pass on the real app."""
import subprocess,sys,shutil,tempfile,os,socket,time
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent;PY=sys.executable
MUT=[
 ('renamed monster','rules.js','"Rat","Slime"','"Mouse","Slime"','t_roster'),
 ('HP-only reskins','rules.js','atk:Math.round((5+2.1*L)*m*d.matk*v[2]*10)/10,def:Math.round(L*0.7*m*v[3]),pierce:v[4]||0','atk:10,def:10,pierce:0','t_roster'),
 ('crowded hallways','party.js','rid>=0?0.15:0.02','rid>=0?0.15:0.30','t_scaling_and_hallway'),
 ('room life not doubled','rules.js','hp:m.hp*2,max:m.max*2','hp:m.hp,max:m.max','t_room_multipliers'),
 ('room attack not 1.5','rules.js','atk:m.atk*1.5','atk:m.atk*1.3','t_room_multipliers'),
 ('rooms use hallway encounters','party.js','why==="room"?R.roomEncounter:R.encounter','why==="room"?R.encounter:R.encounter','t_room_hook'),
 ('only gold chests','rules.js','kind=["equipment","gold","jewelry"][ordinal%3]','kind="gold"','t_treasure_kinds'),
 ('jewelry not accessory','rules.js','const base=ITEMS[id],it=Object.assign({},base,','const base=ITEMS[id],it=Object.assign({},base,{slot:id==="ring"||id==="amulet"?"junk":base.slot},','t_treasure_kinds'),
 ('treasure reward not granted','party.js','const it=R.ITEMS[id],who=addLoot(id);','const it=R.ITEMS[id],who=null;','t_treasure_ui'),
 ('chest respawns','game.js','if(rid>=0&&!clearedR[rid])showPanel(rid);','if(rid>=0)showPanel(rid);','t_room_once'),
 ('Golem still placeholder','rules.js','role:"crystal sentinel",hp:23000','placeholder:true,role:"crystal sentinel",hp:23000','t_boss_rules'),
 ('Golem not boss','rules.js','def:145,boss:true','def:145,boss:false','t_boss_rules'),
 ('can escape boss','rules.js','if(this.m.some(x=>x.boss))','if(false)','t_boss_rules'),
 ('one hit Golem','rules.js','hp:23000,atk:255','hp:1,atk:255','t_boss_balance'),
 ('unwinnable Golem','rules.js','hp:23000,atk:255','hp:999999,atk:255','t_boss_balance'),
 ('no ending after victory','party.js','if(bossWon)h6("bossWon");','if(false)h6("bossWon");','t_door_flow'),
 ('door skips boss fight','story.js','finish();S.rpg.startBoss();','finish();showEnding();','t_door_flow'),
 ('jewelry has no tier buffs','rules.js','for(const k of ["atk","mag","def","hp"])','for(const k of [])','t_treasure_kinds'),
 ('new outside URL','rules.js','const CAP=50,','const OUTSIDE="https://example.invalid/";const CAP=50,','t_copy_cache_noads'),
 ('door bypasses final puzzle','story.js','"open",!s.finalLock','"open",false','t_door_flow'),
 ('wrong companion tavern','rules.js','{tavern:1,role:"scholar"','{tavern:2,role:"scholar"','t_locked_content'),
 ('lost guardian thought','story-data.js','Something big is guarding the middle.','Nothing is guarding the middle.','t_locked_content'),
 ('infinite XP grind','rules.js','Math.round(1.8*level*level+9*level)','Math.round(14*level*level+16*level)','t_xp_budget'),
 ('stale room copy','game.js','Monster room — a powerful foe waits.','Monster room (fight comes later)','t_copy_cache_noads'),
 ('stale offline cache','sw.js','VER="17"','VER="16"','t_copy_cache_noads'),
]
def serve(d):
 with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
 pr=subprocess.Popen([PY,'-m','http.server',str(port),'--bind','127.0.0.1'],cwd=d,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 # Wait for startup without using an arbitrary long sleep.
 for _ in range(100):
  try:
   with socket.create_connection(('127.0.0.1',port),timeout=.1):break
  except OSError:time.sleep(.02)
 return pr,f'http://127.0.0.1:{port}/'
def run(url,test):
 return subprocess.run([PY,str(ROOT/'tests/stage7_tests.py'),url,test],capture_output=True,text=True,timeout=180)
bad=0;real,url=serve(ROOT)
try:
 for name,file,a,b,test in MUT:
  with tempfile.TemporaryDirectory(prefix='sota-mut7-') as d:
   shutil.copytree(ROOT,d,dirs_exist_ok=True,ignore=shutil.ignore_patterns('.git','__pycache__'))
   p=Path(d)/file;s=p.read_text();assert a in s,'missing anchor: '+name;p.write_text(s.replace(a,b,1));pr,muturl=serve(d)
   try:r=run(muturl,test)
   finally:pr.terminate();pr.wait()
   killed=r.returncode==1 and 'FAIL '+test in r.stdout
   control=run(url,test);good=control.returncode==0
   bad+=not killed or not good
   print(('KILLED' if killed else 'SURVIVED/ERROR'),name,'->',test,'; REAL APP', 'PASS' if good else 'FAIL',flush=True)
   if not killed or not good:print(r.stdout,r.stderr,control.stdout,control.stderr,flush=True)
finally:real.terminate();real.wait()
print(f'mutations7: {len(MUT)-bad}/{len(MUT)} killed with passing real-app controls',flush=True);sys.exit(1 if bad else 0)
