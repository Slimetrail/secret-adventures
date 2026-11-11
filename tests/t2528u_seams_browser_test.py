"""t2528u-t2539u, t2551u, t2558u, t2562u, t2564u, t2565u: seams 1-2 and 2-3 in the real game (412x891 phone, headless Chromium).
 arch:  bumping (key and tap) from both sides of both seams opens the tavern and never moves the player; the tavern Zone tabs open the
        save-slot picker, save to the picked slot with no tent, and put the player on that side facing away; cancel keeps him in the
        tavern and moves nothing; forward and backward walks through both seams; the archway is drawn as the 128 (or 64) texture.
 tint:  the archway stone differs between the two sides of a seam and every tavern-interior texel is identical.
 talk:  when a tavern talk ends, the tavern screen stays open (the last tap no longer falls through to a Zone button).
 camp:  walking (forward or backward) onto a seam camp circle opens Cook/Rest/Save/Return; Return, walk off; camp Save still uses
        1 tent; the circle never blocks.
 post:  the Safe post is centred on the circle, hidden behind walls (depth test), and not drawn while standing on its cell.
 continue: a second tap 80, 300 or 600 ms after title Continue leaves ui null and pools unchanged; a later real bump still opens the tavern.
Usage: python tests/t2528u_seams_browser_test.py [base_url]   (T2528_SHOTS=dir for screenshots)"""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8825/'
sys.argv=[sys.argv[0],BASE]
import stage4_fix_tests as T
import splash_helper as SPL
from playwright.sync_api import sync_playwright
SHOTS=os.environ.get('T2528_SHOTS','');passed=failed=0
def run(name,f,p):
  global passed,failed
  try:f(p);passed+=1;print('PASS',name,flush=True)
  except Exception as e:failed+=1;print('FAIL',name,repr(e)[:600],flush=True)
def shot(pg,n):
  if SHOTS:os.makedirs(SHOTS,exist_ok=True);pg.screenshot(path=os.path.join(SHOTS,n))
def setup(p,story=False,tents=1,block=()):
  b=p.chromium.launch();c=b.new_context(viewport={'width':412,'height':891},device_scale_factor=1,has_touch=True,is_mobile=True,service_workers='block')
  for pat in block:c.route('**/'+pat,lambda r:r.fulfill(status=404,body='missing'))
  pg=T.fresh(c,{'sota.dev.nostory':'1'});T.full_create(pg,'Tess','human','warrior')
  if story:T.ev(pg,'localStorage.removeItem("sota.dev.nostory")')
  T.ev(pg,f'(()=>{{const L=SOTA.rpg.live();L.campTut="done";L.party[0].bag=L.party[0].bag.filter(x=>x!=="tent");for(let i=0;i<{tents};i++)L.party[0].bag.push("tent");}})()')
  # no random fights while walking these short routes (the walk roll is made from RPG.rng on the first eligible step; camps and taverns still run)
  T.ev(pg,'(()=>{const o=RPG.rng;RPG.rng=s=>{const r=o(s);return ()=>{r();return 0.999;};};})()')
  pg.wait_for_function('SOTA.archTex().ready&&SOTA.postReady()',timeout=15000);return b,pg
def pos(pg):s=T.ev(pg,'SOTA.state()');return [s['x'],s['y'],s['f']]
def tents(pg):return T.ev(pg,'SOTA.rpg.live().party.reduce((t,c)=>t+c.bag.filter(x=>x==="tent").length,0)')
def slot(pg,i):return json.loads(T.ev(pg,f'localStorage.getItem("sota.party.slot{i}")') or 'null')
def ui(pg):return T.ev(pg,'SOTA.rpg.ui()')
def tp(pg,x,y,f):T.ev(pg,f'SOTA.teleport({x},{y},{f})');pg.wait_for_timeout(120)
# (tavern, prev side facing arch, next side facing arch, landing on next side, landing on prev side, prev zone, next zone)
SEAMS=[(0,(14,49,0),(14,48,2),(14,48,0),(14,49,2),1,2),(1,(18,24,1),(19,24,3),(19,24,0),(18,24,0),2,3)]

def t_seam_cells(p):
  b,pg=setup(p);s=T.ev(pg,'SOTA.seams()')
  T.check([(x['prev']['x'],x['prev']['y'],x['next']['x'],x['next']['y']) for x in s]==[(14,49,14,48),(18,24,19,24)],f'seams {s}')
  a=T.ev(pg,'SOTA.archTex()');T.check(a['size'] in (64,128) and a['flip']==0 and a['voff']==0,f'arch tex {a}')
  has128=T.ev(pg,'fetch("art6/seam/archway-tavern-128.png").then(r=>r.ok)');T.check(a['size']==(128 if has128 else 64),f'128 not preferred {a}');b.close()

def t_bump_both_sides(p):
  b,pg=setup(p)
  for (t,pv,nx,_,_,_,_) in SEAMS:
    for side in (pv,nx):
      tp(pg,*side);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(300)
      T.check(ui(pg)=='tavern',f'tavern {t} did not open from {side}: {ui(pg)}');T.check(pos(pg)==list(side),f'moved {pos(pg)}')
      T.check(T.ev(pg,'document.querySelector("#s4 .s4title").textContent')=='Tavern %d'%(t+1),'wrong tavern title')
      if side==nx and t==0:shot(pg,'tavern-open-from-bump-zone2.png')
      T.ev(pg,'SOTA.rpg.closeUI()')
      # tapping the archway in the 3D view does the same
      T.ev(pg,'SOTA.renderOnce()');sz=T.ev(pg,'SOTA.size()');pk=T.ev(pg,f'SOTA.pick({sz["W"]//2})');T.check(pk['arch']>=0,f'centre column is not the arch {pk}')
      r=T.ev(pg,'(()=>{const r=document.getElementById("view").getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()')
      yy=r[1]+(pk['y0']+pk['y1'])/2/sz['H']*r[3];pg.touchscreen.tap(r[0]+r[2]/2,yy);pg.wait_for_timeout(300)
      T.check(ui(pg)=='tavern',f'tapping the arch did not open tavern {t} from {side}');T.ev(pg,'SOTA.rpg.closeUI()')
  b.close()

def t_zone_tabs_save(p):
  b,pg=setup(p,tents=1);sm=T.ev(pg,'SOTA.seams()')
  for (t,pv,nx,land_n,land_p,zp,zn) in SEAMS:
    for start,zone,land,i in ((pv,zn,land_n,1),(nx,zp,land_p,2)):
      tp(pg,*start);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(250);T.check(ui(pg)=='tavern','no tavern')
      t0=tents(pg);hub=0 if zone==t+1 else 2;before=slot(pg,i)
      T.ttap(pg,f'[data-hub="{hub}"]');pg.wait_for_timeout(200);T.check(ui(pg)=='save-picker',f'picker did not open: {ui(pg)}')
      if t==0 and i==1:shot(pg,'zone-tab-save-picker.png')
      T.ttap(pg,'#s4 .s4back');pg.wait_for_timeout(200)   # cancel: stay in the tavern, nothing moves or saves
      T.check(ui(pg)=='tavern','cancel left the tavern');T.check(pos(pg)==list(start),'cancel moved the player');T.check(slot(pg,i)==before,'cancel saved')
      T.ttap(pg,f'[data-hub="{hub}"]');pg.wait_for_timeout(200);T.ttap(pg,f'[data-save-slot="{i}"]');pg.wait_for_timeout(300)
      T.check(ui(pg) is None,f'still in a screen: {ui(pg)}');T.check(pos(pg)==list(land),f'landed {pos(pg)} not {land}')
      T.check(T.ev(pg,'SOTA.state().zone')==zone,'wrong zone');T.check(tents(pg)==t0,f'tavern exit used a tent {t0}->{tents(pg)}')
      s=slot(pg,i);T.check(s and [s['at']['x'],s['at']['y'],s['at']['f']]==list(land),f'slot {i} not saved at the landing spot: {s and s["at"]}')
      T.check(s['at']['name']=='Tavern %d'%(t+1),f'save name {s["at"]["name"]}')
      if t==0 and i==1:T.ev(pg,'SOTA.renderOnce()');shot(pg,'landed-zone2-facing-away.png')
      T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(200);T.check(pos(pg)[:2]!=list(land)[:2],'cannot walk on after landing')
      T.ttap(pg,'[data-cmd=back]');pg.wait_for_timeout(200);T.check(pos(pg)==list(land),'cannot walk back')
      side=sm[t]['next' if zone==zn else 'prev']
      if (land[2]+2)%4==side['toArch']:
        T.ttap(pg,'[data-cmd=back]');pg.wait_for_timeout(250);T.check(ui(pg)=='tavern',f'backing into the arch did not open the tavern: ui={ui(pg)} pos={pos(pg)}');T.check(pos(pg)==list(land),'backing moved')
      T.ev(pg,'SOTA.rpg.closeUI()')
  b.close()

def t_backward_walk_shots(p):
  b,pg=setup(p)
  tp(pg,14,47,2);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(200);T.check(pos(pg)==[14,48,2],'not at 14,48')
  T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(250);T.check(ui(pg)=='tavern','no tavern');T.ttap(pg,'[data-hub="0"]');pg.wait_for_timeout(200);T.ttap(pg,'[data-save-slot="3"]');pg.wait_for_timeout(300)
  T.check(pos(pg)==[14,49,2],f'backward landing {pos(pg)}');T.ev(pg,'SOTA.renderOnce()');shot(pg,'backward-walk-1-landed-zone1-facing-S.png')
  T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(200);T.check(pos(pg)[:2]==[14,50],'not 14,50')
  T.ttap(pg,'[data-cmd=right]');T.ttap(pg,'[data-cmd=right]');pg.wait_for_timeout(300);T.check(pos(pg)==[14,50,0],'not facing N');T.ev(pg,'SOTA.renderOnce()');shot(pg,'backward-walk-2-zone1-looking-back-at-arch.png')
  b.close()

def t_tint(p):
  b,pg=setup(p);a=T.ev(pg,'SOTA.archTex()')
  if not a['mask']:print('NOTE no stone mask: untinted fallback',flush=True);b.close();return
  r=T.ev(pg,'''(async()=>{const a=SOTA.archTex(),im=new Image();im.src=a.mask;await im.decode();const c=document.createElement("canvas");c.width=c.height=a.size;const g=c.getContext("2d");g.drawImage(im,0,0);const m=g.getImageData(0,0,a.size,a.size).data;
   let stoneDiff=0,stone=0,inDiff=0,inner=0;for(const [z1,z2] of [[1,2],[2,3]])for(let y=0;y<a.size;y++)for(let x=0;x<a.size;x++){const i=(y*a.size+x)*4,p=SOTA.archTexel(z1,x,y),q=SOTA.archTexel(z2,x,y),same=p[0]===q[0]&&p[1]===q[1]&&p[2]===q[2]&&p[3]===q[3];
    if(m[i]===255){stone++;if(!same)stoneDiff++;}else{inner++;if(!same)inDiff++;}}return {mode:a.mode,stone,stoneDiff,inner,inDiff};})()''')
  T.check(r['stone']>0 and r['stoneDiff']>=0.9*r['stone'],f'stone does not differ enough between sides {r}');T.check(r['inner']>0 and r['inDiff']==0,f'tavern interior changed {r}')
  if a['mode']=='tints.json':   # every stone texel follows the tints.json formula exactly
    bad=T.ev(pg,'''(async()=>{const a=SOTA.archTex(),tj=await (await fetch(a.tints)).json(),ld=async s=>{const im=new Image();im.src=s;await im.decode();const c=document.createElement("canvas");c.width=c.height=a.size;const g=c.getContext("2d");g.drawImage(im,0,0);return g.getImageData(0,0,a.size,a.size).data;};
     const t=await ld(a.src),m=await ld(a.mask);let bad=0,n=0;for(let z=1;z<=5;z++){const zt=tj.zones[z],ad=zt.add||[0,0,0];for(let i=0;i<a.size*a.size;i++){if(m[i*4]!==255)continue;const p=SOTA.archTexel(z,i%a.size,(i/a.size)|0);n++;
      for(let j=0;j<3;j++){const e=Math.max(0,Math.min(255,Math.round(t[i*4+j]*zt.mul[j]*zt.lift+ad[j])));if(Math.abs(p[j]-e)>0){bad++;break;}}}}return [bad,n];})()''')
    T.check(bad[0]==0,f'tints.json formula mismatch {bad}')
  print('tint',r,flush=True);b.close()

def talk_through(pg,x,y,until=None,limit=150):
  """tap through talks like a player: one tap per finished line (the ▼ shows), at (x,y)"""
  import time;end=time.time()+limit
  while time.time()<end:
    if until and until():return True
    if not T.ev(pg,'SOTA.storyOpen()'):
      if until is None:return True
      pg.wait_for_timeout(150);continue
    if T.ev(pg,'!!document.querySelector("#s6d .s6more.on")'):pg.touchscreen.tap(x,y);pg.wait_for_timeout(350)
    else:pg.wait_for_timeout(150)
  return False
def t_talk_stays(p):
  b,pg=setup(p,story=True);tp(pg,14,49,0);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(400)
  talk_through(pg,206,790)   # drain the join scene if it plays; the reminder then stays on the maze like a live step-in
  if ui(pg)!='tavern':
    pg.wait_for_timeout(400);T.ttap(pg,'#s5here');pg.wait_for_timeout(400)
  T.check(ui(pg)=='tavern','no tavern');T.check(pos(pg)==[14,49,0],'the join scene taps moved the player')
  nav=T.ev(pg,'(()=>{const r=document.querySelector("[data-hub=\\"0\\"]").getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()')
  T.check(T.ev(pg,'SOTA.storyOpen()'),'no tavern talk played on the first visit')
  talk_through(pg,nav[0],nav[1])   # tap the talk right over the Zone 1 button
  pg.wait_for_timeout(400);T.check(not T.ev(pg,'SOTA.storyOpen()'),'talk never ended')
  T.check(ui(pg)=='tavern',f'talk end left the tavern: {ui(pg)}');T.check(pos(pg)==[14,49,0],'moved');shot(pg,'tavern-after-talk-stays.png');b.close()

def t_camp(p):
  b,pg=setup(p,tents=1)
  for (cx,cy) in ((15,50),(16,25)):
    m=T.ev(pg,f'parseInt(MAZE.mask[{cy}*MAZE.n+{cx}],16)');d=[k for k in range(4) if m&(1<<k)][0];D=[(0,-1),(1,0),(0,1),(-1,0)][d];nb=(cx+D[0],cy+D[1])
    for how in ('fwd','back'):
      f=(d+2)%4 if how=='fwd' else d
      tp(pg,nb[0],nb[1],f);T.ttap(pg,f'[data-cmd={how}]');pg.wait_for_timeout(300)
      T.check(pos(pg)[:2]==[cx,cy],f'circle blocked the step ({how}) into {cx},{cy}')
      T.check(ui(pg)=='camp',f'camp tabs did not open ({how}) at {cx},{cy}: {ui(pg)}')
      tabs=T.ev(pg,'[...document.querySelectorAll("#s4 .s5camp .s5tabs .s5tab")].map(e=>e.textContent)');T.check(tabs==['Cook','Rest','Save','Return'],f'tabs {tabs}')
      if (cx,cy)==(15,50) and how=='fwd':shot(pg,'camp-tabs-pop-up-zone1.png')
      if (cx,cy)==(16,25) and how=='fwd':shot(pg,'camp-tabs-pop-up-zone2.png')
      T.ttap(pg,'[data-tab=return]');pg.wait_for_timeout(150);T.check(ui(pg) is None,'Return did not close')
      T.ttap(pg,'[data-cmd=%s]'%('back' if how=='fwd' else 'fwd'));pg.wait_for_timeout(200);T.check(pos(pg)[:2]==list(nb),'could not walk off the camp')
  tp(pg,15,51,0);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(300);T.check(ui(pg)=='camp','no camp');t0=tents(pg);w0=T.ev(pg,'SOTA.rpg.live().tentWear')
  T.ttap(pg,'[data-tab=save]');pg.wait_for_timeout(150);T.check('Use 1 tent to save?' in T.ev(pg,'document.getElementById("s5tentask").textContent'),'no tent question')
  T.ttap(pg,'[data-tentyes]');pg.wait_for_timeout(150);T.ttap(pg,'[data-save-slot="0"]');pg.wait_for_timeout(300)
  T.check(tents(pg)==t0-1 or T.ev(pg,'SOTA.rpg.live().tentWear')==w0+1,f'camp Save did not use a tent ({t0}->{tents(pg)})');b.close()

def t_post(p):
  b,pg=setup(p)
  tp(pg,15,51,0);T.ev(pg,'SOTA.renderOnce()');s=T.ev(pg,'SOTA.sprites()');W=T.ev(pg,'SOTA.size()')
  T.check(len(s)==1 and s[0]['cell']==[15,50] and s[0]['px']>200,f'post not drawn near {s}')
  T.check(abs(s[0]['cx']-W['W']/2)<0.6,f'post not centred on the circle {s[0]["cx"]} vs {W["W"]/2}')
  T.check(abs(s[0]['foot']-(W['H']/2+s[0]['w']/2))<0.6,'post foot not on the floor at the circle centre')
  tp(pg,14,48,2);T.ev(pg,'SOTA.renderOnce()');s=T.ev(pg,'SOTA.sprites()')
  T.check(any(x['cell']==[15,50] for x in s),'post not in front of the camera here (depth test not exercised)')
  T.check(all(x['px']==0 for x in s if x['cell']==[15,50]),f'post drawn through walls {s}')
  tp(pg,15,50,2);T.ev(pg,'SOTA.renderOnce()');s=T.ev(pg,'SOTA.sprites()');T.check(not any(x['cell']==[15,50] for x in s),'post drawn while standing in its cell')
  b.close()

def t_arch128(p):
  # Eve steering: archway drawn at 128 (own size, walls stay 64); stone texels == tints.json formula; unmasked texels == source exactly; alpha == glow mask
  b,pg=setup(p);a=T.ev(pg,'SOTA.archTex()');T.check(a['size']==128 and a['src'].endswith('archway-tavern-128.png') and a['mode']=='tints.json',f'arch {a}')
  for x,y,f in [(14,49,0),(14,48,2),(18,24,1),(19,24,3)]:
    tp(pg,x,y,f);T.ev(pg,'SOTA.renderOnce()');d=T.ev(pg,'SOTA.archDrawn()')
    T.check(d['ts']==128 and d['cols']>0 and d['wallTS']==64,f'{x},{y}: drawn {d}')
  T.check(T.ev(pg,'TEX.walls[1][0].length')==64*64*4,'normal walls not 64')
  r=T.ev(pg,'''(async()=>{const a=SOTA.archTex(),tj=await (await fetch(a.tints)).json(),ld=async s=>{const im=new Image();im.src=s;await im.decode();const c=document.createElement("canvas");c.width=c.height=a.size;const g=c.getContext("2d");g.drawImage(im,0,0);return g.getImageData(0,0,a.size,a.size).data;};
   const t=await ld(a.src),m=await ld(a.mask),gl=await ld(a.src.replace("archway-tavern-","archway-tavern-glow-"));let sb=0,sn=0,ub=0,un=0,ab=0,ex=[];
   for(let z=1;z<=5;z++){const zt=tj.zones[z];for(let i=0;i<a.size*a.size;i++){const q=SOTA.archTexel(z,i%a.size,(i/a.size)|0);if(q[3]!==gl[i*4])ab++;
    if(m[i*4]===255){sn++;let bad=false;for(let j=0;j<3;j++){const e=Math.max(0,Math.min(255,Math.round(t[i*4+j]*zt.mul[j]*zt.lift+zt.add[j])));if(q[j]!==e)bad=true;}if(bad){sb++;if(ex.length<3)ex.push([z,i,q,[t[i*4],t[i*4+1],t[i*4+2]]]);}}
    else{un++;if(q[0]!==t[i*4]||q[1]!==t[i*4+1]||q[2]!==t[i*4+2])ub++;}}}
   const smp=[[1,64,4],[2,64,4],[3,4,64],[5,120,120]].map(([z,x,y])=>({z,x,y,mask:m[(y*a.size+x)*4],src:[0,1,2].map(j=>t[(y*a.size+x)*4+j]),got:SOTA.archTexel(z,x,y).slice(0,3)}));
   return {sn,sb,un,ub,ab,ex,smp};})()''')
  print('arch128',r,flush=True)
  T.check(r['sn']>0 and r['sb']==0,f'stone formula {r}');T.check(r['un']>0 and r['ub']==0,f'unmasked changed {r}');T.check(r['ab']==0,f'alpha != glow {r}');b.close()

def t_fallbacks(p):
  # no tints.json -> tex.js palette remap (stone still differs by side, interior identical); no stone mask -> untinted; no 128 -> 64
  for block,want_size,want_mode in [(('art6/seam/tints.json',),None,'palette'),(('art6/seam/archway-stone-mask-*.png',),None,'untinted'),(('art6/seam/archway-tavern-128.png',),64,None)]:
    b,pg=setup(p,block=block);a=T.ev(pg,'SOTA.archTex()')
    if want_mode:T.check(a['mode']==want_mode,f'{block}: mode {a}')
    if want_size:T.check(a['size']==want_size and a['src'].endswith('-64.png'),f'{block}: size {a}')
    if a['mode']=='palette':
      r=T.ev(pg,'''(async()=>{const a=SOTA.archTex(),im=new Image();im.src=a.mask;await im.decode();const c=document.createElement("canvas");c.width=c.height=a.size;const g=c.getContext("2d");g.drawImage(im,0,0);const m=g.getImageData(0,0,a.size,a.size).data;let sd=0,s=0,idf=0;
        for(let y=0;y<a.size;y++)for(let x=0;x<a.size;x++){const i=(y*a.size+x)*4,p=SOTA.archTexel(1,x,y),q=SOTA.archTexel(2,x,y),same=p.every((v,k)=>v===q[k]);if(m[i]===255){s++;if(!same)sd++;}else if(!same)idf++;}return [s,sd,idf];})()''')
      T.check(r[1]>=0.9*r[0] and r[2]==0,f'palette fallback {r}')
    if a['mode']=='untinted':T.check(T.ev(pg,'(()=>{for(let i=0;i<500;i++){const x=i%64,y=(i*7)%64,p=SOTA.archTexel(1,x,y),q=SOTA.archTexel(2,x,y);if(!p.every((v,k)=>v===q[k]))return false;}return true;})()'),'untinted differs by zone')
    tp(pg,14,48,2);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(250);T.check(ui(pg)=='tavern',f'{block}: arch does not open the tavern');b.close()

POSTLUMA='''(s)=>{const cv=document.getElementById("view"),g=cv.getContext("2d"),W=cv.width,H=cv.height,d=g.getImageData(0,0,W,H).data;
 const L=(i)=>0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];return new Promise(res=>{const im=new Image();im.onload=()=>{const c=document.createElement("canvas");c.width=c.height=64;const q=c.getContext("2d");q.drawImage(im,0,0);const a=q.getImageData(0,0,64,64).data;
 let sp=0,sn=0,wl=0,wn=0;const x0=s.cx-s.w/2,top=s.foot-s.w;
 for(let x=0;x<W;x++){const pk=SOTA.pick(x);for(let y=pk.y0;y<pk.y1;y++){const i=(y*W+x)*4,u=Math.floor((x-x0)/s.w*64),v=Math.floor((y-top)/s.w*64),inS=u>=0&&u<64&&v>=0&&v<64&&a[(v*64+u)*4+3]>=128;
  if(inS)continue;if(Math.abs(x-s.cx)<s.w*0.7){wl+=L(i);wn++;}}}
 for(let y=Math.max(0,Math.ceil(top));y<Math.min(H,s.foot);y++)for(let x=Math.max(0,Math.floor(x0));x<Math.min(W,x0+s.w);x++){const i=(y*W+x)*4,u=Math.floor((x-x0)/s.w*64),v=Math.floor((y-top)/s.w*64);if(u>=0&&u<64&&v>=16&&v<64&&a[(v*64+u)*4+3]>=128){sp+=L(i);sn++;}}
 res({sprite:sn?+(sp/sn).toFixed(1):null,backwall:wn?+(wl/wn).toFixed(1):null});};im.src="art6/seam/safe-post-64.png";});}'''
def t_post_brightness(p):
  b,pg=setup(p);out=[]
  for z,x,y,f in [(1,15,51,0),(1,0,43,2),(2,17,25,3),(2,29,61,1),(5,43,40,0),(5,43,41,0)]:
    tp(pg,x,y,f);pg.wait_for_timeout(300);T.ev(pg,'SOTA.renderOnce()');s=[q for q in T.ev(pg,'SOTA.sprites()') if q['px']>0]
    T.check(s,f'no post seen from {x},{y}');m=pg.evaluate(POSTLUMA,s[0]);out.append((z,x,y,m))
    T.check(m['sprite']>=0.95*m['backwall'],f'zone {z} post darker than the wall behind it: {m}')
  print('post luma',out,flush=True);b.close()

def t_load_keeps_hp(p):
  """Jeremy: loading a save restores each member's HP/MP to the values stored at save time.
  Arch-bump arrival still heals like camp Rest (after doSave). Continue must not heal again."""
  b,pg=setup(p)
  T.ev(pg,'(()=>{const L=SOTA.rpg.live();L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1));L.party.forEach((c,i)=>{c.hp=Math.max(2,RPG.maxHp(c,RPG.DIFF[L.diff].hp)-5-i*3);c.mp=Math.max(1,RPG.maxMp(c)-1-i);});})()')
  saved=T.ev(pg,'SOTA.rpg.live().party.map(c=>[c.hp,c.mp])')
  lowered=T.ev(pg,'(()=>{const L=SOTA.rpg.live();return L.party.some(c=>c.hp<RPG.maxHp(c,RPG.DIFF[L.diff].hp));})()')
  T.check(lowered,'test did not lower HP')
  T.ev(pg,'(()=>{if(SOTA.rpg.closeUI)SOTA.rpg.closeUI();})()')
  sm=T.ev(pg,'(SOTA.seams?SOTA.seams():[]).find(s=>s.t===0)');T.check(sm,'no tavern 1 seam')
  tp(pg,sm['prev']['x'],sm['prev']['y'],sm['prev']['toArch']);T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(400)
  T.check(ui(pg)=='tavern','arch bump did not open the tavern')
  healed=T.ev(pg,'(()=>{const L=SOTA.rpg.live();return L.party.map(c=>[c.hp,c.mp,RPG.maxHp(c,RPG.DIFF[L.diff].hp),RPG.maxMp(c)])})()')
  T.check(all(r[0]==r[2] and r[1]==r[3] for r in healed),f'arrival did not heal like Rest {healed}')
  sl=slot(pg,0);got_save=None if not sl else [[c['hp'],c['mp']] for c in sl['party']]
  T.check(got_save==saved,f'save was not the pre-heal pools {got_save} vs {saved}')
  T.ev(pg,'SOTA.rpg.closeUI()')
  T.ev(pg,'s=>{const L=SOTA.rpg.live();L.party.forEach((c,i)=>{c.hp=s[i][0];c.mp=s[i][1];});}',saved)
  tp(pg,sm['prev']['x'],sm['prev']['y'],sm['prev']['f']);T.check(T.ev(pg,'SOTA.rpg.doSave()'),'save facing away failed')
  T.check(T.ev(pg,'SOTA.rpg.live().party.map(c=>[c.hp,c.mp])')==saved,'live pools changed at save')
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);T.ev(pg,'SOTA.setAnim(false)');T.past_title(pg)
  got=T.ev(pg,'SOTA.rpg.live().party.map(c=>[c.hp,c.mp])')
  T.check(got==saved,f'Continue did not restore save-time HP/MP {got} vs saved {saved}')
  T.check(ui(pg)!='tavern','Continue opened the tavern and would have healed')
  b.close()

def pools(pg):
  return T.ev(pg,'SOTA.rpg.live().party.map(c=>[c.name,c.hp,c.mp,c.hp,RPG.maxHp(c,RPG.DIFF[SOTA.rpg.live().diff].hp)])')
def party_len(pg):
  return T.ev(pg,'SOTA.rpg.live().party.length')
def save_facing_arch(pg):
  T.ev(pg,'(()=>{const L=SOTA.rpg.live();L.party.forEach((c,i)=>{c.hp=Math.max(2,RPG.maxHp(c,RPG.DIFF[L.diff].hp)-6-i*2);c.mp=Math.max(1,RPG.maxMp(c)-1-i);});})()')
  sm=T.ev(pg,'(SOTA.seams?SOTA.seams():[]).find(s=>s.t===0)');T.check(sm,'no tavern 1 seam')
  T.ev(pg,'(()=>{if(SOTA.rpg.closeUI)SOTA.rpg.closeUI();})()')
  tp(pg,sm['prev']['x'],sm['prev']['y'],sm['prev']['toArch'])
  T.check(T.ev(pg,'SOTA.rpg.doSave()'),'save facing the arch failed')
  return sm,T.ev(pg,'SOTA.rpg.live().party.map(c=>[c.hp,c.mp])'),party_len(pg)
def open_title(pg):
  pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');SPL.pass_splash(pg);T.ev(pg,'SOTA.setAnim(false)')
  pg.wait_for_function('SOTA.intro&&SOTA.intro.titleOpen()',timeout=8000)
def t_continue_double_tap(p):
  """A second tap 80, 300 or 600 ms after title Continue must not open the tavern or change pools.
  A later real bump still opens the tavern."""
  for delay in (80,300,600):
    b,pg=setup(p)
    try:
      sm,saved,n0=save_facing_arch(pg)
      open_title(pg)
      box=pg.locator('#ititle-cont').bounding_box();T.check(box,f'no Continue button at delay {delay}')
      x,y=box['x']+box['width']/2,box['y']+box['height']/2
      pg.touchscreen.tap(x,y)
      pg.wait_for_timeout(delay)
      # second tap at the same point (the reported double-tap on Continue, now over the full-screen arch)
      pg.touchscreen.tap(x,y)
      pg.wait_for_timeout(120)
      T.check(ui(pg) is None,f'Continue double tap at {delay} ms opened ui={ui(pg)}')
      T.check(T.ev(pg,'!SOTA.intro.titleOpen()'),f'title still open after Continue at {delay} ms')
      got=T.ev(pg,'SOTA.rpg.live().party.map(c=>[c.hp,c.mp])')
      T.check(got==saved,f'pools changed after Continue double tap at {delay} ms: {got} vs {saved}')
      T.check(party_len(pg)==n0,f'party size changed after Continue double tap at {delay} ms')
      pg.wait_for_timeout(800)
      T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(400)
      T.check(ui(pg)=='tavern',f'later bump after {delay} ms did not open the tavern: ui={ui(pg)}')
    finally:b.close()
def t_load_game_stays_clean(p):
  """A single Load Game + slot pick, with the party saved facing the arch, must not open the tavern or change pools."""
  b,pg=setup(p)
  try:
    sm,saved,n0=save_facing_arch(pg)
    open_title(pg)
    box=pg.locator('#ititle-load').bounding_box();T.check(box,'no Load Game button')
    pg.touchscreen.tap(box['x']+box['width']/2,box['y']+box['height']/2);pg.wait_for_timeout(400)
    T.check(ui(pg)=='save-picker','Load Game did not open the slot picker')
    T.ttap(pg,'[data-save-slot="0"]');pg.wait_for_timeout(400)
    T.check(ui(pg) is None,f'Load Game opened ui={ui(pg)}')
    got=T.ev(pg,'SOTA.rpg.live().party.map(c=>[c.hp,c.mp])')
    T.check(got==saved,f'pools changed after Load Game: {got} vs {saved}')
    T.check(party_len(pg)==n0,'party size changed after Load Game')
    pg.wait_for_timeout(800)
    T.ttap(pg,'[data-cmd=fwd]');pg.wait_for_timeout(400)
    T.check(ui(pg)=='tavern',f'later bump after Load Game did not open the tavern: ui={ui(pg)}')
  finally:b.close()
if __name__=='__main__':
 with sync_playwright() as p:
  for n,f in [('seam cells and texture',t_seam_cells),('bump both sides, key and tap',t_bump_both_sides),('zone tabs: picker, no tent, landing, cancel, walk back',t_zone_tabs_save),
              ('backward walk',t_backward_walk_shots),('stone tint by side',t_tint),('tavern stays after a talk',t_talk_stays),('camp circle tabs both ways, Save uses a tent',t_camp),('Safe post depth and centre',t_post),('Safe post not darker than the walls (zones 1, 2, 5)',t_post_brightness),('art fallbacks: no tints.json, no mask, no 128',t_fallbacks),('archway 128, tint formula, unmasked exact',t_arch128),('load a seam-tavern save keeps save-time HP/MP',t_load_keeps_hp),('Continue double tap does not bump the arch',t_continue_double_tap),('Load Game facing the arch stays clean',t_load_game_stays_clean)]:
    run(n,f,p)
 print(f'{passed} passed, {failed} failed');sys.exit(1 if failed else 0)
