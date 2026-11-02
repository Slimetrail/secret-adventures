"""Stage 2 mutation checks: each breaks the app in a temp copy; the named Stage 2 test must FAIL; then the real app must pass."""
import subprocess,sys,shutil,tempfile,os,time,socket
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PY=sys.executable
MUT=[
 ("map draws all cells","map.js","function sync(){const v=C.visited;for(let i=0;i<N*N;i++)if(v[i]&&!drawn[i])","function sync(){const v=C.visited;for(let i=0;i<N*N;i++)if(!drawn[i])","map_only_visited"),
 ("visited not saved","game.js","return {v:h,t:{s:trail[0],m}};","return {};","map_save"),
 ("arrow wrong direction","map.js","arrow:s.f,","arrow:(s.f+1)%4,","map_arrow"),
 ("tent on all camps","map.js","for(const [i,k] of kind){if(!v[i])continue;","for(const [i,k] of kind){if(!v[i]&&k!==\"camp\")continue;","map_markers"),
 ("slot count 3","index.html",'<button class="slot" data-slot="3"','<i data-x="3"',"slots_layout"),
 ("item box overlaps button","index.html","#slots{flex:1;","#slots{flex:1;position:relative;left:-40px;","slots_layout"),
 ("map close breaks movement","map.js",'tap("mclose",()=>setOpen(false));','tap("mclose",()=>{el.classList.remove("open");});',"map_open_close"),
 ("map.js missing from offline list","sw.js",'"map.js?v=9",','',"offline2"),
 ("trail not recorded","game.js","visit(i);trail.push(i);","visit(i);","map_markers"),
 ("recenter does nothing","map.js",'tap("mctr",()=>{bbox();fit();req();});','tap("mctr",()=>{req();});',"map_panzoom"),
 ("old save crashes map","game.js","catch(e){visited.fill(0);visCount=0;trail=[st.y*N+st.x];}","catch(e){visited.fill(0);visCount=0;trail=[0];}","old_and_corrupt_save"),
 ("slot tap eats input","game.js",'document.querySelectorAll(".slot").forEach(b=>{b.addEventListener("pointerdown",e=>{','document.querySelectorAll(".slot").forEach(b=>{b.addEventListener("pointerdown",e=>{animOn=false;anim.dur=1e9;window.SOTA.act=null;st.f=(st.f+1)%4;','slot_tap'),
 ("hud off by default","game.js",'hudOn=localStorage.getItem(HUD_KEY)!=="0";','hudOn=localStorage.getItem(HUD_KEY)==="1";',"hud_default"),
 ("fit ignores part of box","map.js","bw=b.x1-b.x0+2*m,","bw=(b.x1-b.x0)/2+2*m,","fit_open"),
 ("no fit zoom cap","map.js","Math.min(FIT_CAP,(a.r-a.l)/bw","Math.min(999,(a.r-a.l)/bw","fit_open"),
 ("marker covers icon","map.js","const dd=R0+aa+4*dpr,","const dd=0,","marker"),
 ("drag disabled","map.js","if(pts.size===1){view.cx-=","if(pts.size===9){view.cx-=","drag"),
 ("no pan clamp","map.js","function clamp(){","function clamp(){return;","pan_clamp"),
 ("recentre not restoring fit","map.js",'tap("mctr",()=>{bbox();fit();req();});','tap("mctr",()=>{center();req();});',"map_panzoom"),
 ("tiny marker when zoomed out","map.js","aa=Math.max(9*dpr,z*0.34)","aa=z*0.34","marker"),
 ("pinch disabled","map.js","if(pinch)view.z=","if(0)view.z=","pinch"),
]
def port():
  s=socket.socket();s.bind(('127.0.0.1',0));p=s.getsockname()[1];s.close();return p
def serve(d):
  p=port();pr=subprocess.Popen([PY,'-m','http.server',str(p),'--bind','127.0.0.1'],cwd=d,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.8);return pr,f'http://127.0.0.1:{p}/'
T=os.path.join(ROOT,'tests/stage2_tests.py');bad=0
for name,f,a,b_,test in MUT:
  d=tempfile.mkdtemp(prefix='sota-mut2-');shutil.copytree(ROOT,d,dirs_exist_ok=True,ignore=shutil.ignore_patterns('.git'))
  s=open(os.path.join(d,f)).read();assert a in s,f'anchor missing: {name}';open(os.path.join(d,f),'w').write(s.replace(a,b_,1))
  pr,url=serve(d);r=subprocess.run([PY,T,url,test],capture_output=True,text=True);pr.terminate();shutil.rmtree(d)
  k=r.returncode!=0;bad+=not k;print(('KILLED ' if k else 'SURVIVED ')+f'{name} -> {test}: '+(r.stdout.strip().splitlines() or ['?'])[-1][:150])
pr,url=serve(ROOT);r=subprocess.run([PY,T,url]+sorted({m[4] for m in MUT}),capture_output=True,text=True);pr.terminate()
print('REAL APP:',r.stdout.strip().replace('\n',' | '));bad+=r.returncode!=0;sys.exit(1 if bad else 0)
