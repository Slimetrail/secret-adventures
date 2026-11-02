"""Mutation checks: each mutation breaks the app on purpose in a temp copy; the named test must FAIL on it.
Then the real app must pass the same tests. Usage: python tests/mutations.py"""
import subprocess,sys,shutil,tempfile,os,time,socket
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY=sys.executable
MUT=[
 ("no wall check","game.js","function canMove(x,y,d){return (mask[y*N+x]&BIT[d])!==0;}","function canMove(x,y,d){return x>=0&&y>=0&&x<N&&y<N&&!(d===3&&x===0)&&!(d===2&&y===N-1);}","walls"),
 ("left turns right","game.js",'else if(cmd==="left"){st.f=(st.f+3)%4;','else if(cmd==="left"){st.f=(st.f+1)%4;',"turning"),
 ("save disabled","game.js","localStorage.setItem(SAVE_KEY,","void(SAVE_KEY,","save_reload"),
 ("input dropped while animating","game.js","function act(cmd){","function act(cmd){if(anim.on)return;","mash"),
 ("worker misses game.js","sw.js",'"game.js?v=6",','',"offline"),
 ("outside request","game.js",'"use strict";','"use strict";try{fetch("https://example.invalid/x").catch(()=>{});}catch(e){}',"network_console"),
 ("zone data shifted","maze-data.js",'"zone":"3','"zone":"1',"maze_loads"),
 ("back moves forward","game.js",'const d=cmd==="fwd"?st.f:(st.f+2)%4;','const d=st.f;',"route_walk"),
 ("console error at boot","boot.js","(function(){if(","(function(){console.error('boom');if(","network_console"),
]
def port():
  s=socket.socket();s.bind(('127.0.0.1',0));p=s.getsockname()[1];s.close();return p
def serve(d):
  p=port();pr=subprocess.Popen([PY,'-m','http.server',str(p),'--bind','127.0.0.1'],cwd=d,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.8);return pr,f'http://127.0.0.1:{p}/'
def run(url,test):return subprocess.run([PY,os.path.join(ROOT,'tests/run_tests.py'),url,test],capture_output=True,text=True)
bad=0
for name,f,a,b_,test in MUT:
  d=tempfile.mkdtemp(prefix='sota-mut-');shutil.copytree(ROOT,d,dirs_exist_ok=True,ignore=shutil.ignore_patterns('.git'))
  s=open(os.path.join(d,f)).read();assert a in s,f'mutation anchor missing: {name}';open(os.path.join(d,f),'w').write(s.replace(a,b_,1))
  pr,url=serve(d);r=run(url,test);pr.terminate();shutil.rmtree(d)
  killed=r.returncode!=0;bad+=not killed;print(('KILLED ' if killed else 'SURVIVED ')+f'{name} -> {test}: '+(r.stdout.strip().splitlines() or ['?'])[-1][:150])
pr,url=serve(ROOT);tests=sorted({m[4] for m in MUT});r=subprocess.run([PY,os.path.join(ROOT,'tests/run_tests.py'),url]+tests,capture_output=True,text=True);pr.terminate()
print('REAL APP:',r.stdout.strip().replace('\n',' | '));bad+=r.returncode!=0
sys.exit(1 if bad else 0)
