"""Stage 6 mutation checks: each breaks the story layer in a temp copy; the named Stage 6 test must FAIL; then the real app must pass."""
import subprocess,sys,shutil,tempfile,os,time,socket
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PY=sys.executable
MUT=[
 ("tap skips a typing line","story.js","if(!cur||cur.typing||cur.ending)return;","if(!cur||cur.ending)return;","t_not_skippable"),
 ("dialogue does not block moving","game.js","||(SOTA.storyOpen&&SOTA.storyOpen())","","t_not_skippable"),
 ("portrait ignores emotion",'story.js','"-"+ln.e+".webp"','"-calm.webp"',"t_portrait_emotions"),
 ("no portrait flash","story.js",'pf.classList.add("flash");',"","t_portrait_flash_and_layout"),
 ("fight start line stays","story.js",'if(bot)bot.addEventListener("pointerdown",hide,{once:true});setTimeout(hide,3200);',"","t_fight_lines"),
 ("solo hero banter in fight","story.js","if(!cs.length)return;code=",'if(!cs.length){cs.push("H");D.fight.start.H=D.fight.start.Q;D.fight.end.H=D.fight.end.Q;}code=',"t_fight_solo_quiet"),
 ("same race stays same race","rules.js",'return def.race===heroRace?"human":def.race;',"return def.race;","t_join_rules"),
 ("join at any tavern","rules.js","return nx&&nx.tavern===tIdx?nx:null;","return nx||null;","t_join_rules"),
 ("plans ignore race rules","rules.js","if(pre.every((c,i)=>allowed(races[i],c)))ok.push(pre);","ok.push(pre);","t_class_balance_all"),
 ("KO not woken after a win","party.js","else c.hp=1;});","});","t_ko_revive_reload"),
 ("salts used on awake member","rules.js",'if(k<0||!tg||tg.hp>0)return "";','if(k<0||!tg)return "";',"t_ko_revive_reload"),
 ("wall counted twice","story.js",'||s.walls[id])return;',")return;","t_wall_counts"),
 ("boss note replays","story.js","if(!s||s.seen.boss)return;","if(!s)return;","t_boss_note_and_ending_low"),
 ("high ending too strict","story.js",'f>=0.9?"high"','f>=0.95?"high"',"t_ending_thresholds"),
 ("memory unlocks too fast","story.js","Math.floor(explored()/MEM_STEP)","Math.floor(explored()/4)","t_memory_unlocks"),
 ("no dark tone in zone 4","story.js","const dark=()=>zoneNow()>=4;","const dark=()=>false;","t_tone_dark_zone4"),
 ("no stay banter","story.js","if(s.shopN%3)return;","return;","t_stay_banter"),
 ("story not kept in save","story.js","if(!s||typeof s!==\"object\")s=l.story={v:1};","if(!s||typeof s!==\"object\")s={v:1};","t_saves_keep_story"),
 ("old saves lose roles","story.js","||(l.party[IDX[code]]&&!l.party[IDX[code]].role?l.party[IDX[code]]:null)","","t_old_save_loads"),
 ("story.js not cached","sw.js",'"story.js?v=11",',"","t_offline_v11"),
]
def port():
  s=socket.socket();s.bind(('127.0.0.1',0));p=s.getsockname()[1];s.close();return p
def serve(d):
  p=port();pr=subprocess.Popen([PY,'-m','http.server',str(p),'--bind','127.0.0.1'],cwd=d,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.8);return pr,f'http://127.0.0.1:{p}/'
T=os.path.join(ROOT,'tests/stage6_tests.py');bad=0
for name,f,a,b_,test in MUT:
  d=tempfile.mkdtemp(prefix='sota-mut6-');shutil.copytree(ROOT,d,dirs_exist_ok=True,ignore=shutil.ignore_patterns('.git'))
  s=open(os.path.join(d,f)).read();assert a in s,f'anchor missing: {name}';open(os.path.join(d,f),'w').write(s.replace(a,b_,1))
  pr,url=serve(d);r=subprocess.run([PY,T,url,test],capture_output=True,text=True);pr.terminate();shutil.rmtree(d)
  k=r.returncode!=0;bad+=not k;print(('KILLED ' if k else 'SURVIVED ')+f'{name} -> {test}: '+(r.stdout.strip().splitlines() or ['?'])[-1][:150])
pr,url=serve(ROOT);r=subprocess.run([PY,T,url,','.join(sorted({m[4] for m in MUT}))],capture_output=True,text=True);pr.terminate()
print('REAL APP:',r.stdout.strip().replace('\n',' | ')[-300:]);bad+=r.returncode!=0;sys.exit(1 if bad else 0)
