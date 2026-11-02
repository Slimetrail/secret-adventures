"""Stage 4 mutation checks: each breaks the app in a temp copy; the named Stage 4 test must FAIL; then the real app must pass."""
import subprocess,sys,shutil,tempfile,os,time,socket
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PY=sys.executable
MUT=[
 ("flat stat cost","rules.js","function cost(v){return v<=5?1:v<=10?2:v<=15?3:4;}","function cost(v){return 1;}","stat_cost"),
 ("too many start points ok","rules.js",'if(spent>START_POINTS)throw new Error("too many points");',"","stat_cost"),
 ("dwarf can be mage","rules.js",'dwarf:{name:"Dwarf",classes:["warrior","rogue","archer"]','dwarf:{name:"Dwarf",classes:["warrior","rogue","archer","mage"]',"race_class"),
 ("cat any armor","rules.js",'cat:{name:"Cat person",classes:["mage","rogue","warrior"],armor:1','cat:{name:"Cat person",classes:["mage","rogue","warrior"],armor:3',"race_class"),
 ("no level cap","rules.js","function xpNeed(level){return level>=CAP?Infinity:","function xpNeed(level){return level>=99?Infinity:","level_cap"),
 ("skill every 2 levels","rules.js","1+Math.floor(Math.min(level,CAP)/3)","1+Math.floor(Math.min(level,CAP)/2)","skill_every3"),
 ("weight ignores race","rules.js","*RACES[c.race].carry);","*1);","weight"),
 ("no weight limit","rules.js","function canCarry(c,id){return bagWeight(c)+ITEMS[id].w<=carryLimit(c);}","function canCarry(c,id){return true;}","weight"),
 ("hard same as normal","rules.js",'hard:{hp:1,matk:1.5','hard:{hp:1,matk:1',"difficulty"),
 ("story hp not doubled","party.js",'live.party[0].hp=R.maxHp(h,hpMul());doSave(true)','live.party[0].hp=R.maxHp(h,1);doSave(true)',"difficulty"),
 ("zones flat","rules.js","const ZONE_MUL=[0,1,1.3,1.7,2.2,2.8]","const ZONE_MUL=[0,1,1,1,1,1]","monster_scaling"),
 ("monsters ignore party level","rules.js","Math.max(ZONE_MINLVL[zone],plvl)","ZONE_MINLVL[zone]","monster_scaling"),
 ("fight not seeded","rules.js","this.r=rng(seed);","this.r=Math.random;","fight_sim"),
 ("monsters never hit","rules.js","c.hp=Math.max(0,c.hp-dmg);out.push","out.push","fight_sim"),
 ("death keeps progress","party.js","function restore(){live=clone(save);","function restore(){","death_restore"),
 ("death keeps solved rooms","party.js","r.s.forEach(i=>C.solvedR[i]=1);r.c.forEach(i=>C.clearedR[i]=1);S.saveRooms();","","death_restore"),
 ("save anywhere","party.js","if(!start&&!R.isSavePoint(M,p.x,p.y))return false;","","save_only_camps"),
 ("save every step","party.js","S.afterStep=rid=>{if(!live||","S.afterStep=rid=>{if(live)try{localStorage.setItem(SAVE,JSON.stringify(live));}catch(e){}if(!live||","save_only_camps"),
 ("companions any order","rules.js","return nx&&nx.tavern===tIdx?nx:null;","return nx&&tIdx>0?nx:null;","companions"),
 ("fights far too often","party.js","if(r<(rid>=0?0.15:0.02))","if(r<0.5)","random_fights"),
 ("potion not used up","rules.js","if(k<0||!it||it.slot!==\"use\")return \"\";c.bag.splice(k,1);","if(k<0||!it||it.slot!==\"use\")return \"\";","fight_ui"),
 ("equip ignores limits","rules.js","if(!canEquip(c,id,slot)||!c.bag.includes(id))return false;","if(!c.bag.includes(id))return false;","equip_bag_ui"),
 ("tiny name tabs","index.html",".s4fight .s4pr .s4nl{width:128px;min-height:44px;",".s4fight .s4pr .s4nl{width:128px;min-height:30px;max-height:30px;","ui_fit"),
 ("party.js not cached","sw.js",'"party.js?v=7",','',"offline4"),
 ("calls outside","party.js","S.uiOpen=()=>!!ui;","S.uiOpen=()=>!!ui;fetch('https://example.invalid/x').catch(()=>{});","console_network4"),
]
def port():
  s=socket.socket();s.bind(('127.0.0.1',0));p=s.getsockname()[1];s.close();return p
def serve(d):
  p=port();pr=subprocess.Popen([PY,'-m','http.server',str(p),'--bind','127.0.0.1'],cwd=d,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.8);return pr,f'http://127.0.0.1:{p}/'
T=os.path.join(ROOT,'tests/stage4_tests.py');bad=0
for name,f,a,b_,test in MUT:
  d=tempfile.mkdtemp(prefix='sota-mut4-');shutil.copytree(ROOT,d,dirs_exist_ok=True,ignore=shutil.ignore_patterns('.git'))
  s=open(os.path.join(d,f)).read();assert a in s,f'anchor missing: {name}';open(os.path.join(d,f),'w').write(s.replace(a,b_,1))
  pr,url=serve(d);r=subprocess.run([PY,T,url,test],capture_output=True,text=True);pr.terminate();shutil.rmtree(d)
  k=r.returncode!=0;bad+=not k;print(('KILLED ' if k else 'SURVIVED ')+f'{name} -> {test}: '+(r.stdout.strip().splitlines() or ['?'])[-1][:150])
pr,url=serve(ROOT);r=subprocess.run([PY,T,url]+sorted({m[4] for m in MUT}),capture_output=True,text=True);pr.terminate()
print('REAL APP:',r.stdout.strip().replace('\n',' | ')[-300:]);bad+=r.returncode!=0;sys.exit(1 if bad else 0)
