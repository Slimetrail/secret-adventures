"""Local motion regression and optional review clips. No production debug hooks.
python3 tests/fight_motion_tests.py BASE [clip-directory]
"""
import sys, json, pathlib, subprocess, hashlib
from playwright.sync_api import sync_playwright
import stage4_tests as T
T.BASE=sys.argv[1].rstrip('/')+'/'
OUT=pathlib.Path(sys.argv[2]) if len(sys.argv)>2 else None
ROOT=pathlib.Path(__file__).resolve().parent.parent

def locks():
    old=subprocess.check_output(['git','show','5e747ea:party.js'],cwd=ROOT,text=True)
    new=(ROOT/'party.js').read_text()
    for begin,end in [('const SLOTS=','// t1985u'),('const BIG_FOE=','function hpos(')]:
        assert old[old.index(begin):old.index(end)]==new[new.index(begin):new.index(end)],begin
    for name in ['story.js','story-data.js','sw.js']:
        assert (ROOT/name).read_bytes()==subprocess.check_output(['git','show','5e747ea:'+name],cwd=ROOT),name
    assert hashlib.sha256((ROOT/'story-data.js').read_bytes()).hexdigest()=='222fb30910b1f2f1ea83ab31700c306d8f84fe9bddb7b7005897cee20aedaebc'
    assert 'hp:15000,atk:230,def:600' in (ROOT/'rules.js').read_text()
    subprocess.run(['node','-e',r"""
const vm=require('vm'),cp=require('child_process'),assert=require('assert');
const old={module:{exports:{}}};vm.runInNewContext(cp.execFileSync('git',['show','5e747ea:rules.js'],{encoding:'utf8'}),old);
const A=old.module.exports,B=require('./rules.js'),prep=require('./tests/balance7.js').preparedParty;
for(let seed=1;seed<=100;seed++){
 const summarize=R=>{const f=R.simulate(prep(R,'normal'),[R.makeBoss('normal')],'normal',seed);return JSON.stringify([f.over,f.turn,f.log,f.p.map(c=>[c.hp,c.mp]),f.m]);};
 assert.strictEqual(summarize(A),summarize(B),'combat changed at seed '+seed);
 const party=prep(B,'normal');party.forEach(c=>c.name='Same name');
 const f=new B.Fight(party,[B.makeBoss('normal')],'normal',seed);f.turn=2;
 const before=party.map(c=>c.hp);f.monstersTurn();
 assert.deepStrictEqual(f.motionHits.map(e=>e.hero),[0,1,2,3]);
 for(const e of f.motionHits)assert.strictEqual(before[e.hero]-party[e.hero].hp,e.dmg);
}
console.log('PASS 100-seed identical boss outcomes/logs/RNG and indexed sweep damage with duplicate names');
"""],cwd=ROOT,check=True)
    print('PASS exact rest rectangles, boss stats, story and SW locks',flush=True)

def clip(p,boss):
    b=p.chromium.launch()
    opts=dict(viewport={'width':390,'height':844},service_workers='block',has_touch=True,is_mobile=True)
    if OUT: opts.update(record_video_dir=str(OUT/'raw'),record_video_size={'width':390,'height':844})
    c=b.new_context(**opts)
    c.add_init_script("localStorage.setItem('sota.dev.nostory','1');localStorage.setItem('sota.dev.nofight','1')")
    pg=T.page(c);errors=[];pg.on('pageerror',lambda e:errors.append(e.stack))
    T.create(pg);pg.add_script_tag(url=T.BASE+'tests/balance7.js')
    pg.evaluate('''boss=>{const L=SOTA.rpg.live();L.seed=1998;L.party=preparedParty(RPG,'normal',boss?50:8,boss?5:1);
      L.party.forEach((c,i)=>c.name=['Jer','Quinn','Mira','Brunn'][i]);
      SOTA.rpg.startFight(boss?[RPG.makeBoss('normal')]:[0,1,2,4].map(i=>RPG.makeMonster(1,i,1,0,'normal')));
      // Observe the real renderer's sprite matrices, not background flicker.
      window.framesSeen=[];const proto=CanvasRenderingContext2D.prototype,draw=proto.drawImage;
      proto.drawImage=function(im,...a){if(this.canvas.id==='fcv'&&im.src&&im.src.includes('/fight/')){
        const m=this.getTransform();framesSeen.push({src:im.src.split('/').pop(),t:performance.now(),m:[m.a,m.b,m.c,m.d,m.e,m.f],a});
        if(framesSeen.length>12000)framesSeen.splice(0,2000);
      }return draw.call(this,im,...a)};
    }''',boss)
    pg.wait_for_timeout(2400) # creation toast expires before the useful review segment
    start=pg.evaluate('performance.now()')
    # Leave the real command menu open to prove the actors keep breathing/swaying.
    T.tap(pg,'#fparty button:not([disabled])');pg.wait_for_timeout(1700)
    pg.evaluate('SOTA.rpg.closeBranch()')
    idle=pg.evaluate('''()=>{const a=framesSeen.filter(x=>x.src==='p-human-warrior.png');return new Set(a.map(x=>JSON.stringify([x.m,x.a]))).size}''')
    assert idle>4,'hero frozen while choosing'
    idlemon=pg.evaluate('''()=>{const src=SOTA.rpg.fight().m[0].boss?'boss-golem.png':'z1-rat.png';return new Set(framesSeen.filter(x=>x.src===src).map(x=>JSON.stringify(x.m))).size}''')
    assert idlemon>4,'monster frozen while choosing'
    # Four Defends let the actual monsters choose and strike their actual targets.
    pg.evaluate('for(let i=0;i<4;i++)SOTA.rpg.act("defend")')
    hits=pg.evaluate('SOTA.rpg.fight().motionHits')
    assert len(hits)==(1 if boss else 4)
    assert all(0<=x['hero']<4 and x['dmg']>0 for x in hits)
    pg.wait_for_timeout(650*len(hits)+400)
    targetproof=pg.evaluate('''()=>{const f=SOTA.rpg.fight();return f.motionHits.every(e=>f.log.includes(f.m[e.i].n+' hits '+f.p[e.hero].name+' for '+e.dmg))}''')
    assert targetproof,'motion target differs from combat'
    # Attack, a physical skill, and a spell: separate categories on live monsters.
    for cmd,who,target in [('attack',0,1),('phys',1,2),('magic',2,3)]:
        pg.evaluate('framesSeen=[]')
        pg.evaluate('''a=>{const [cmd,who,target]=a,c=SOTA.rpg.live().party[who];
          if(cmd==='attack')SOTA.rpg.act('attack',null,SOTA.rpg.fight().m.length===1?0:target);
          else {const s=RPG.SKILLS[c.cls].find(s=>s.k===cmd&&c.skills.includes(s.id));if(!s)throw Error('missing '+cmd);SOTA.rpg.act('skill',s.id,SOTA.rpg.fight().m.length===1?0:target);}
        }''',[cmd,who,target])
        pg.wait_for_timeout(880)
        # Non-identity rotation/squash must happen to a monster sprite, not just a shared burst.
        mats=pg.evaluate("framesSeen.filter(x=>!x.src.startsWith('p-')).map(x=>x.m)")
        assert any(abs(m[1])>.02 or abs(m[0]-1)>.03 for m in mats),cmd+' lacks monster pose'
    pg.evaluate('SOTA.rpg.act("defend")');pg.wait_for_timeout(2400)
    if boss:
        # Reach the third-round sweep and prove every living companion gets an indexed event.
        pg.evaluate('for(let i=0;i<4;i++)SOTA.rpg.act("defend")')
        sweep=pg.evaluate('SOTA.rpg.fight().motionHits')
        assert len(sweep)==4 and all(x['pulse'] for x in sweep)
        pg.wait_for_timeout(3000)
    assert not errors,errors
    end=pg.evaluate('performance.now()')
    video=pg.video
    pg.screenshot(path=str((OUT or pathlib.Path('/tmp'))/('boss-review.png' if boss else 'maze-review.png')))
    c.close()
    if OUT:
        dest=OUT/('iron-golem.webm' if boss else 'maze-weak-pack.webm')
        video.save_as(str(dest))
        (OUT/('boss-timing.json' if boss else 'maze-timing.json')).write_text(json.dumps({'review_start_ms':start,'review_end_ms':end,'actual_hits':hits},indent=2))
        print('CLIP',dest,flush=True)
    b.close();print('PASS', 'Iron Golem targeted hit + sweep' if boss else 'maze weaker pack targeted hits','+ menu movement + distinct monster poses',flush=True)

if __name__=='__main__':
    locks()
    if OUT:OUT.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        clip(p,False);clip(p,True)
