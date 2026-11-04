"""Stage 5 mutation checks: each breaks the app in a temp copy; the named Stage 5 test must FAIL; then the real app must pass."""
import subprocess,sys,shutil,tempfile,os,time,socket
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PY=sys.executable
MUT=[
 ("recipe order matters","econ.js","const key=a=>a.slice().sort().join(\"+\");","const key=a=>a.join(\"+\");","twenty_dishes"),
 ("silk drops everywhere","econ.js",'p_silk:["Spider silk",1,[1],4]','p_silk:["Spider silk",1,[1,2,3,4,5],4]',"drops_zones"),
 ("no food drops","econ.js","if(r()<0.45){const f=FOOD[zone];","if(0){const f=FOOD[zone];","drops_zones"),
 ("fights drop no parts","party.js","const jn=rw.junk.concat(E.drops(F.m[0].zone,(live.seed^fightNo*131)>>>0))","const jn=rw.junk","win_drops"),
 ("no part bulk","econ.js","function partBulk(n){return Math.max(0,n-5)*0.6+Math.max(0,n-9)*1.2;}","function partBulk(n){return 0;}","part_bulk"),
 ("no stacking","party.js",'if(n>1)b.appendChild(el("span","s5cnt","×"+n));','',"stacking"),
 ("buy is free","party.js","live.gold-=p;toast(\"Bought \"","toast(\"Bought \"","shop_buy_sell"),
 ("sell gives nothing","party.js","live.gold+=v;toast(\"Sold ","toast(\"Sold ","shop_buy_sell"),
 ("new gear at shops","econ.js",'const gear=[["w_dagger","w_sword","w_buckler"]','const gear=[["sword","w_sword","w_buckler"]',"dead_warrior_gear"),
 ("failed cook learns","party.js","if(!d)return {fail:true};","if(!d){live.recipes.toast=\"earned\";return {fail:true};}","cook_learn"),
 ("failed cook keeps food","party.js","ings.forEach(x=>takeOne(\"i_\"+x));\n if(!d)","if(d)ings.forEach(x=>takeOne(\"i_\"+x));\n if(!d)","cook_learn"),
 ("bought marked earned","party.js",'live.recipes[did]="bought";','live.recipes[did]="earned";',"cook_learn"),
 ("food never spoils","party.js","while(q.length&&q[0]<=live.steps){","while(0){","spoil"),
 ("steps not counted","party.js","s5init();live.steps++;checkSpoil();","s5init();checkSpoil();","spoil_steps_walk"),
 ("buffs never end","party.js","function tickBuffs(){live.party.forEach(c=>{if(c.buff){c.buff.f--;","function tickBuffs(){live.party.forEach(c=>{if(0){","eat_effects"),
 ("camp saves without tent","party.js","if(!hasTent())return false;","","tent_rules"),
 ("tent never wears","party.js","if(live.tentWear>=E.TENT.nights){takeOne(\"tent\");","if(0){","tent_rules"),
 ("cheap tent","econ.js","const TENT={buy:100,","const TENT={buy:40,","tent_costs"),
 ("pricey tent","econ.js","const TENT={buy:100,","const TENT={buy:900,","tent_costs"),
 ("build fee too high","econ.js","fee:10,","fee:95,","tent_costs"),
 ("parts at every tavern","econ.js","const parts=t>=2?","const parts=t>=0?","tent_costs"),
 ("build ignores parts","party.js",'if(!tentNeed().every(x=>x.have>=x.n)){toast("Missing parts");return false;}','',"tent_build_ui"),
 ("give copies item","party.js","c.bag.splice(kk,1);m.bag.push(selItem);","m.bag.push(selItem);","give_item"),
 ("no level popup","party.js","lvlPopup(ups);}tickBuffs();","}tickBuffs();","levelup_popup"),
 ("no place tab","party.js",'here.style.display=on?"block":"none";','here.style.display="none";',"place_tab"),
 ("recipes not saved","party.js","seed:(Math.random()*1e9)|0,steps:0,fresh:{},recipes:{},tentWear:0};","seed:(Math.random()*1e9)|0,steps:0,fresh:{},tentWear:0};Object.defineProperty(live,\"recipes\",{value:{},enumerable:false,writable:true});","save_keeps_s5"),
 ("tiny shop tabs","index.html",".s5tabs .s5tab{width:150px;min-width:150px}",".s5tabs .s5tab{width:150px;min-width:150px;min-height:30px!important;height:30px}","fit_s5"),
 ("buy lists items directly","party.js",'sideTabs(w,[["‹ Recipes",null,()=>shopList(t,"recipes"),"recipes"],','shopList(t,"food");return;sideTabs(w,[["‹ Recipes",null,()=>shopList(t,"recipes"),"recipes"],',"buy_flow"),
 ("food lists everything","party.js",'else if(kind==="food"){["ration","potion","ether","salts"].concat(st.ing).forEach(item);}','else if(kind==="food"){["ration","potion","ether","salts","tent"].concat(st.ing).forEach(item);}',"buy_flow"),
 ("back skips buy screen","party.js",'[kind],()=>buyScreen(t)));','[kind],()=>tavernScreen(t)));',"buy_flow"),
 ("sell lists shop stock","party.js","live.party.forEach((c,ci)=>{const s=E.stacks(c.bag);if(!s.length)return;w.appendChild(el(\"div\",\"s4lab\",c.name));","live.party.forEach((c,ci)=>{const s=E.stacks(c.bag.concat([\"rope\"]));if(!s.length)return;w.appendChild(el(\"div\",\"s4lab\",c.name));","sell_party_only"),
 ("sell only first member","party.js","live.party.forEach((c,ci)=>{const s=E.stacks(c.bag);if(!s.length)return;","live.party.forEach((c,ci)=>{const s=ci?[]:E.stacks(c.bag);if(!s.length)return;","sell_party_only"),
 ("give overlays drop","party.js",'const gr=el("div","s4row s5give");','const gr=el("div","s4row s5give");gr.style.marginTop="-48px";',"give_item"),
 ("econ.js not cached","sw.js",'"econ.js?v=14",','',"offline5"),
]
def port():
  s=socket.socket();s.bind(('127.0.0.1',0));p=s.getsockname()[1];s.close();return p
def serve(d):
  p=port();pr=subprocess.Popen([PY,'-m','http.server',str(p),'--bind','127.0.0.1'],cwd=d,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.8);return pr,f'http://127.0.0.1:{p}/'
T=os.path.join(ROOT,'tests/stage5_tests.py');bad=0
for name,f,a,b_,test in MUT:
  d=tempfile.mkdtemp(prefix='sota-mut5-');shutil.copytree(ROOT,d,dirs_exist_ok=True,ignore=shutil.ignore_patterns('.git'))
  s=open(os.path.join(d,f)).read();assert a in s,f'anchor missing: {name}';open(os.path.join(d,f),'w').write(s.replace(a,b_,1))
  pr,url=serve(d);r=subprocess.run([PY,T,url,test],capture_output=True,text=True);pr.terminate();shutil.rmtree(d)
  k=r.returncode!=0;bad+=not k;print(('KILLED ' if k else 'SURVIVED ')+f'{name} -> {test}: '+(r.stdout.strip().splitlines() or ['?'])[-1][:150])
pr,url=serve(ROOT);r=subprocess.run([PY,T,url]+sorted({m[4] for m in MUT}),capture_output=True,text=True);pr.terminate()
print('REAL APP:',r.stdout.strip().replace('\n',' | ')[-300:]);bad+=r.returncode!=0;sys.exit(1 if bad else 0)
