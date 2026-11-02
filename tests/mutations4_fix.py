"""Stage 4 fix round 1 mutation checks: each breaks the app in a temp copy; the named Stage 4 test must FAIL; then the real app must pass."""
import subprocess,sys,shutil,tempfile,os,time,socket
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PY=sys.executable
MUT=[
 ("keys reach walk/map while typing","party.js",'window.addEventListener("keydown",e=>{const t=e.target&&e.target.tagName;if(ui||t==="INPUT"||t==="TEXTAREA")e.stopImmediatePropagation();},true);','',"keyboard_letters"),
 ("no auto-open for first-timer","party.js",'updBtn();if(!live&&localStorage.getItem(DEV_NOFIGHT)!=="1")creation();','updBtn();',"create_all_sizes"),
 ("empty name allowed","party.js",'if(!cc.name.trim()){cc.err="Type a name for your hero first.";creation();','if(false){',"confirm_messages"),
 ("no points-left warning","party.js",'if(left>0&&!cc.warned){','if(false){',"confirm_messages"),
 ("race change keeps points","party.js",'cc.add={str:0,sta:0,man:0};cc.skill=null;}),cc.race===k','cc.skill=null;}),cc.race===k',"change_race_class"),
 ("class change keeps skill","party.js",'cc.cls=k;cc.skill=null;','cc.cls=k;',"change_race_class"),
 ("disallowed class not greyed","party.js",'b.dataset.cls=k;b.disabled=!ok;','b.dataset.cls=k;',"change_race_class"),
 ("confirm not saved","party.js",'live.party[0].hp=R.maxHp(h,hpMul());doSave(true);','live.party[0].hp=R.maxHp(h,hpMul());',"create_all_sizes"),
 ("confirm not sticky","index.html",'.s4foot{position:sticky;bottom:0;','.s4foot{',"keyboard_viewport"),
 ("buttons allow zoom","index.html",'#s4 button,#s4 input,#s4br button{touch-action:manipulation}','',"double_tap_zoom"),
 ("creation see-through","index.html",'#s4{display:none;position:fixed;inset:0;z-index:20;','#s4{display:none;position:fixed;inset:0 0 auto 0;height:40vh;z-index:20;',"no_overlap"),
 ("old save position reset","party.js",'doSave(true);cc.warned=false;','S.teleport(M.start?M.start[0]:1,M.start?M.start[1]:1,0);doSave(true);cc.warned=false;',"old_save"),
 ("update leaves old version","boot.js",'if(!p){location.reload();return;}b.style.display="block";','',"sw_autoreload"),
 ("branch never flips left","party.js",'if(left+cw>vw-4){left=a.left-gap-cw;fx=1;}','',"branch_flip"),
 ("branch runs off the bottom","party.js",'if(top+ch>vh-4){top=vh-4-ch;fy=1;}','',"branch_flip"),
 ("attack does nothing","party.js",'fn:()=>doAct(cmd,arg,i),d:{tgt:i}','fn:()=>{},d:{tgt:i}',"fight_branch"),
 ("no items branch","party.js",'{t:"Items",d:{cmd4:"item"},kids:','{t:"Items",d:{cmd4:"item"},fn:()=>{},x:',"fight_branch"),
 ("big buttons back","party.js",'mn.appendChild(el("div","s4who",c.name+"\'s turn - tap the name"));','mn.appendChild(el("div","s4who",c.name+"\'s turn - tap the name"));["attack","defend"].forEach(k=>{const b=tapBtn(k,()=>doAct(k,null,0));b.dataset.cmd4=k;mn.appendChild(b);});',"fight_branch"),
 ("turn marker stuck","party.js",'const now=i===turnI&&!F.over&&c.hp>0','const now=i===0&&!F.over',"fight_branch"),
 ("card tap does nothing","party.js",'card.addEventListener("click",e=>{e.preventDefault();charScreen(i);});','',"party_cards"),
 ("no gear lines","party.js",'gearText(c).forEach(x=>info.appendChild(el("div","s4gear",x)));','',"party_cards"),
 ("slot ignores selected item","party.js",'if(selItem!=null&&fits(selItem,s)){tryEquip(c,i,selItem,s);return;}','',"sheet_equip"),
 ("bag ignores selected slot","party.js",'if(sel&&sel.slot&&fits(id,sel.slot)){tryEquip(c,i,id,sel.slot);return;}','',"sheet_equip"),
 ("sheet one column in landscape","index.html",'.s4cols{flex-direction:row;align-items:flex-start}','',"sheet_equip"),
 ("victory button hidden","party.js",'b.id="fdone";mn.appendChild(b);\n  mn.appendChild(el("div","s4note","+"+rw.xp','b.id="fdone";b.style.display="none";mn.appendChild(b);\n  mn.appendChild(el("div","s4note","+"+rw.xp',"fight_layout"),
]
def port():
  s=socket.socket();s.bind(('127.0.0.1',0));p=s.getsockname()[1];s.close();return p
def serve(d):
  p=port();pr=subprocess.Popen([PY,'-m','http.server',str(p),'--bind','127.0.0.1'],cwd=d,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.8);return pr,f'http://127.0.0.1:{p}/'
T=os.path.join(ROOT,'tests/stage4_fix_tests.py');bad=0
for name,f,a,b_,test in MUT:
  d=tempfile.mkdtemp(prefix='sota-mut4f-');shutil.copytree(ROOT,d,dirs_exist_ok=True,ignore=shutil.ignore_patterns('.git'))
  s=open(os.path.join(d,f)).read();assert a in s,f'anchor missing: {name}';open(os.path.join(d,f),'w').write(s.replace(a,b_,1))
  pr,url=serve(d);r=subprocess.run([PY,os.path.join(d,'tests/stage4_fix_tests.py'),url,test],capture_output=True,text=True)  # run the copy's tests so app-copying tests use the mutated files;pr.terminate();shutil.rmtree(d)
  k=r.returncode!=0;bad+=not k;print(('KILLED ' if k else 'SURVIVED ')+f'{name} -> {test}: '+(r.stdout.strip().splitlines() or ['?'])[-1][:150])
pr,url=serve(ROOT);r=subprocess.run([PY,T,url]+sorted({m[4] for m in MUT}),capture_output=True,text=True);pr.terminate()
print('REAL APP:',r.stdout.strip().replace('\n',' | ')[-300:]);bad+=r.returncode!=0;sys.exit(1 if bad else 0)
