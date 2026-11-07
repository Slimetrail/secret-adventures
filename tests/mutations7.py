"""Each local temp-app mutation must fail its named test; that test must also pass on the real app."""
import subprocess,sys,shutil,tempfile,os,socket,time
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent;PY=sys.executable
MUT=[
 ('renamed monster','rules.js','"Rat","Slime"','"Mouse","Slime"','t_roster'),
 ('HP-only reskins','rules.js','atk:Math.round((5+2.1*L)*m*d.matk*v[2]*10)/10,def:Math.round(L*0.7*m*v[3]),pierce:v[4]||0','atk:10,def:10,pierce:0','t_roster'),
 ('crowded hallways','party.js','rid>=0?0.15:0.02','rid>=0?0.15:0.30','t_scaling_and_hallway'),
 ('room life not doubled','rules.js','hpMul=profile===1?1:2','hpMul=1','t_room_multipliers'),
 ('rooms always both buffs','rules.js','hpMul=profile===1?1:2,atkMul=profile===0?1:1.5','hpMul=2,atkMul=1.5','t_room_multipliers'),
 ('rooms flattened to hallway','rules.js','hpMul=profile===1?1:2,atkMul=profile===0?1:1.5','hpMul=1,atkMul=1','t_room_multipliers'),
 ('room attack not 1.5','rules.js','atkMul=profile===0?1:1.5','atkMul=1','t_room_multipliers'),
 ('rooms use hallway encounters','party.js','why==="room"?R.roomEncounter:R.encounter','why==="room"?R.encounter:R.encounter','t_room_hook'),
 ('only gold chests','rules.js','kind=["equipment","gold","jewelry"][Math.floor(r()*3)]','kind="gold"','t_treasure_kinds'),
 ('jewelry not accessory','rules.js','"n":"Iron band","slot":"acc"','"n":"Iron band","slot":"junk"','t_zone_gear_tables'),
 ('treasure reward not granted','party.js','const id=pending[0],who=addLoot(id);','const id=pending[0],who=live.party[0].name;','t_treasure_ui'),
 ('chest respawns','game.js','if(rid>=0&&!clearedR[rid])showPanel(rid);','if(rid>=0)showPanel(rid);','t_room_once'),
 ('Golem still placeholder','rules.js','role:"crystal sentinel",hp:23000','placeholder:true,role:"crystal sentinel",hp:23000','t_boss_rules'),
 ('Golem not boss','rules.js','def:145,boss:true','def:145,boss:false','t_boss_rules'),
 ('can escape boss','rules.js','if(this.m.some(x=>x.boss))','if(false)','t_boss_rules'),
 ('one hit Golem','rules.js','hp:23000,atk:255','hp:1,atk:255','t_boss_balance'),
 ('unwinnable Golem','rules.js','hp:23000,atk:255','hp:999999,atk:255','t_boss_balance'),
 ('no ending after victory','party.js','if(bossWon)h6("bossWon");','if(false)h6("bossWon");','t_door_flow'),
 ('door skips boss fight','story.js','finish();S.rpg.startBoss();','finish();showEnding();','t_door_flow'),
 ('jewelry has no zone buffs','rules.js','"n":"Crystal ring","slot":"acc","accessory":"ring","atk":18,"hp":73','"n":"Crystal ring","slot":"acc","accessory":"ring","atk":2,"hp":5','t_named_jewelry'),
 ('new outside URL','rules.js','const CAP=50,','const OUTSIDE="https://example.invalid/";const CAP=50,','t_copy_cache_noads'),
 ('door bypasses final puzzle','story.js','"open",!(s.finalLock&&s.finalLock2&&s.finalLock3)','"open",false','t_door_flow'),
 ('wrong companion tavern','rules.js','{tavern:1,role:"scholar"','{tavern:2,role:"scholar"','t_locked_content'),
 ('lost guardian thought','story-data.js','Something big is guarding the middle.','Nothing is guarding the middle.','t_locked_content'),
 ('infinite XP grind','rules.js','Math.round(1.8*level*level+9*level)','Math.round(14*level*level+16*level)','t_xp_budget'),
 ('stale room copy','game.js','Monster room — a powerful foe waits.','Monster room (fight comes later)','t_copy_cache_noads'),
 ('fixed chest cycle','rules.js','kind=["equipment","gold","jewelry"][Math.floor(r()*3)]','kind=["equipment","gold","jewelry"][(arguments[3]||0)%3]','t_treasure_kinds'),
 ('silent sell full chest','party.js','if(!who)break;','if(!who){live.gold+=E.sellPrice(id);pending.shift();continue;}','t_fullbag_leave'),
 ('drop bag items sells them','party.js','c.bag.splice(k,1);gone(drop);','c.bag.splice(k,1);live.gold+=E.sellPrice(drop);gone(drop);','t_fullbag_drop'),
 ('stale offline cache','sw.js','VER="18"','VER="17"','t_copy_cache_noads'),
 ('generic equipment chest pool','rules.js','pool=ZONE_GEAR[zone][equipmentKind]','pool=CHEST_GEAR.map(id=>"relic"+zone+"_"+id)','t_zone_equipment_rolls'),
 ('old chest gold formula','rules.js','gold:40*zone*zone','gold:Math.round((65+r()*45)*zone*zone)','t_zone_gold'),
 ('wrong zone gear name','rules.js','Cave-iron sword','Generic sword','t_zone_gear_tables'),
 ('wrong zone gear stats','rules.js','"n":"Root staff","slot":"weapon","t":"staff","atk":2,"mag":5','"n":"Root staff","slot":"weapon","t":"staff","atk":20,"mag":50','t_zone_gear_tables'),
 ('heavy shield made medium','rules.js','"n":"Stone-face shield","slot":"offhand","a":3','"n":"Stone-face shield","slot":"offhand","a":2','t_zone_gear_tables'),
 ('zone1 rolls companions','rules.js','recipients=zone===1?members.slice(0,1):members','recipients=members','t_weapon_recipients'),
 ('unjoined weapon recipient','rules.js','recipients=zone===1?members.slice(0,1):members','recipients=zone===1?members.slice(0,1):members.concat([{name:"Ghost",cls:"warrior"}])','t_weapon_recipients'),
 ('joined companions ignored','rules.js','recipients=zone===1?members.slice(0,1):members','recipients=members.slice(0,1)','t_weapon_recipients'),
 ('zone1 consumes who roll','rules.js','recipient=recipients.length===1?0:Math.floor(r()*recipients.length)','recipient=Math.floor(r()*recipients.length)','t_weapon_recipients'),
 ('single weapon per class','rules.js','pool=ZONE_GEAR[zone][listKind][who.cls]','pool=ZONE_GEAR[zone][listKind][who.cls].slice(0,listKind==="weapon"?1:999)','t_zone_equipment_rolls'),
 ('chest forgets joined party','party.js','R.partyLevel(live.party),live.party);live.gold+=l.gold','R.partyLevel(live.party));live.gold+=l.gold','t_join_weapon_catalog_and_hook'),
 ('recipient specific weapon copies','rules.js','pool=ZONE_GEAR[zone][listKind][who.cls]','pool=ZONE_GEAR[zone][listKind][who.cls].map(id=>{const copy=id+"_"+recipient;ITEMS[copy]=Object.assign({},ITEMS[id]);return copy;})','t_shared_weapon_lists'),
 ('single armor per class','rules.js','pool=ZONE_GEAR[zone][listKind][who.cls]','pool=ZONE_GEAR[zone][listKind][who.cls].slice(0,listKind==="armor"?1:999)','t_zone_equipment_rolls'),
 ('single jewel per class','rules.js','pool=ZONE_GEAR[zone][listKind][who.cls]','pool=ZONE_GEAR[zone][listKind][who.cls].slice(0,listKind==="jewelry"?1:999)','t_named_jewelry'),
 ('armor ignores companion roll','rules.js','chestRecipient(zone,party,r),listKind','chestRecipient(zone,equipmentKind==="armor"?party.slice(0,1):party,r),listKind','t_weapon_recipients'),
 ('jewelry ignores companion roll','rules.js','chestRecipient(zone,party,r),listKind','chestRecipient(zone,kind==="jewelry"?party.slice(0,1):party,r),listKind','t_weapon_recipients'),
 ('opening tap discards bag item','party.js','blockOpeningClick();tryFit();draw();','tryFit();draw();','t_fullbag_leave'),
 ('other equipment not full class pool','rules.js','pool=ZONE_GEAR[zone][equipmentKind]','pool=ZONE_GEAR[zone][equipmentKind].slice(0,1)','t_other_equipment_no_filter'),
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
