"""Stage 3 mutation checks: each breaks the app in a temp copy; the named Stage 2 test must FAIL; then the real app must pass."""
import subprocess,sys,shutil,tempfile,os,time,socket
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PY=sys.executable
MUT=[
 ("locked rooms let you walk in","game.js","if(locked(rid)){","if(false&&locked(rid)){","locked_blocks"),
 ("solved rooms not saved","game.js","markSolved:i=>{solvedR[i]=1;saveRooms();}","markSolved:i=>{solvedR[i]=1;}","persist_and_once"),
 ("placeholder shows every time","game.js","if(rid>=0&&!clearedR[rid])showPanel(rid);","if(rid>=0)showPanel(rid);","persist_and_once"),
 ("corrupt solved list accepted","game.js","o.s.every(i=>Number.isInteger(i)&&i>=0&&i<NR)&&","","old_and_corrupt"),
 ("leaving loses puzzle state","puzzle-ui.js","s:kept.get(id)||P.clone(g.s)","s:P.clone(g.s)","leave_reset"),
 ("reset does nothing","puzzle-ui.js","cur.s=P.clone(cur.start);kept.delete(cur.id);","kept.delete(cur.id);","leave_reset"),
 ("map ignores solved state","map.js","sv=rid>=0&&!!C.solvedR[rid]","sv=false","map_solved"),
 ("puzzles.js not cached offline","sw.js",'"puzzles.js?v=8",','',"offline3"),
 ("difficulty drops in zone 5","puzzles.js","k:[0,10,16,24,24,34]","k:[0,10,16,24,24,12]","difficulty"),
 ("code keys too small","index.html",".pkey{width:48px;height:48px",".pkey{width:38px;height:38px","ui_fit"),
 ("puzzle not seeded per room","puzzles.js","(room.id+1)*9973+17*room.z","(Math.random()*1e9|0)","all_rooms_data"),
 ("moves ignored","puzzles.js","function apply(pz,s,mv){s=clone(s);","function apply(pz,s,mv){return clone(s);","solve_each_type"),
 ("puzzle code calls outside","puzzle-ui.js","S.puzzleOpen=()=>openFlag;","S.puzzleOpen=()=>openFlag;fetch('http://example.invalid/x').catch(()=>{});","console_network3"),
]
def port():
  s=socket.socket();s.bind(('127.0.0.1',0));p=s.getsockname()[1];s.close();return p
def serve(d):
  p=port();pr=subprocess.Popen([PY,'-m','http.server',str(p),'--bind','127.0.0.1'],cwd=d,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.8);return pr,f'http://127.0.0.1:{p}/'
T=os.path.join(ROOT,'tests/stage3_tests.py');bad=0
for name,f,a,b_,test in MUT:
  d=tempfile.mkdtemp(prefix='sota-mut3-');shutil.copytree(ROOT,d,dirs_exist_ok=True,ignore=shutil.ignore_patterns('.git'))
  s=open(os.path.join(d,f)).read();assert a in s,f'anchor missing: {name}';open(os.path.join(d,f),'w').write(s.replace(a,b_,1))
  pr,url=serve(d);r=subprocess.run([PY,T,url,test],capture_output=True,text=True);pr.terminate();shutil.rmtree(d)
  k=r.returncode!=0;bad+=not k;print(('KILLED ' if k else 'SURVIVED ')+f'{name} -> {test}: '+(r.stdout.strip().splitlines() or ['?'])[-1][:150])
pr,url=serve(ROOT);r=subprocess.run([PY,T,url]+sorted({m[4] for m in MUT}),capture_output=True,text=True);pr.terminate()
print('REAL APP:',r.stdout.strip().replace('\n',' | '));bad+=r.returncode!=0;sys.exit(1 if bad else 0)
