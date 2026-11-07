"""Local scripted scene playback: exact checked wording and all missing-party paths.
Run: python3 tests/scripted_scenes_tests.py http://127.0.0.1:<port>/
Expected spoken lines are frozen from Dialogue Lead's source sheets (not STORY data).
"""
import sys, os, json, hashlib, time
sys.path.insert(0,os.path.dirname(__file__))
import stage6_tests as S6
from stage6_tests import ev, check
from playwright.sync_api import sync_playwright
P={'R1': [['H', "That's my dad."],
        ['Q', 'Hey. Are you okay?'],
        ['H',
         "I thought I was saving him. That was the whole reason I came. He broke everything. I don't know if "
         "I'm a hero or just a son chasing a ghost."],
        ['Q', "Hey. Look at me. I've got you."]],
 'R1-alt': [['H', "That's my dad."],
            ['S', 'An ordinary man does not leave a mark this far in. Your father had power.'],
            ['H',
             "I thought I was saving him. That was the whole reason I came. He broke everything. I don't "
             "know if I'm a hero or just a son chasing a ghost."],
            ['S',
             'The record does not become smaller because you know the hand. We should keep moving toward the '
             'center.']],
 'R1-alt2': [['H', "That's my dad."],
             ['A', 'Your father did this. All of it.'],
             ['H',
              "I thought I was saving him. That was the whole reason I came. He broke everything. I don't "
              "know if I'm a hero or just a son chasing a ghost."],
             ['A',
              "I don't blame you for him. Don't ask me to be kind about it. We finish this and we save "
              "what's left."]],
 'R2': [['S', 'Work that reaches a room this deep does not belong to an ordinary man. He had power.'],
        ['H', 'I wanted him to just be my dad. Sick, and waiting.'],
        ['S', 'The later marks were already more deliberate. He knew what he was doing by then.']],
 'R3': [['A', "We still have work. I'm not lingering over him."],
        ['H', "I'm not asking you to."],
        ['A',
         "I don't blame you for him. Don't ask me to be kind about it. We finish this and we save what's "
         'left.']],
 'D2': [['Q', "He isn't getting up. Come on... please."],
        ['S', 'He will not. And I cannot tell if the crystal held.'],
        ['Q', "Then we don't even know if any of this closed."]],
 'D2-alt': [['Q', "He isn't getting up. Come on... please."],
            ['A', "My team died to that thing. Now he did too. And I still don't know if it mattered."]],
 'D2-alt2': [['S', 'I cannot tell if the crystal held. We do not know if any of this closed.'],
             ['A',
              "My team died to that thing. Now he did too. Nobody finished it. I still don't know if it "
              'mattered.']],
 'D3': [['A', "My team died to that thing. Now he did too. And I still don't know if it mattered."],
        ['Q', "I'm sorry. About them, and about him."]],
 'C1': [['H', "We're alive. But look at it. It's still bleeding."],
        ['Q', "Hey. We're okay. That's something, right? Even if it isn't all the way better."],
        ['H', "I wanted to bring home enough to save my dad. I don't know if this is enough."],
        ['Q', "You're alive. The crystal isn't whole. That's what we have."]],
 'C2': [['S', 'It is not whole. Someone tried to close what broke. This slow leak is what they left.'],
        ['H', 'Then this is what we get. A crack that still bleeds.'],
        ['S', 'It is slower now. I do not have the rest of why.']],
 'C3a': [['A', "It's still leaking. We didn't end it."],
         ['H', 'We stopped it getting worse.'],
         ['A', "It's still bleeding. That's as far as it goes."]],
 'C3b': [['A', "My team died for this. For a crack that didn't even close."],
         ['H', "I'm sorry."],
         ['A', "Sorry doesn't stand them back up. Neither did we."]],
 'F1': [['H', "It's whole. I came here to save him. We ended what he left instead."],
        ['Q', "You did it. Breathe for a second. That's enough for right now."],
        ['H', 'I thought saving him was who I was.'],
        ['Q', "You're still you. We'll take the next step when you can."]],
 'F2': [['S',
         'The crystal is intact. Everyone else fled the failed rite. He did not. When sealing the break '
         'proved beyond him, he made a golem instead.'],
        ['H', 'Then the price started once he was the only one left.'],
        ['S', 'And now it is closed.']],
 'F3': [['A', 'He made that thing with his own hands. We brought it down.'],
        ['H', 'I can know that and still feel like I owe for it.'],
        ['A',
         "His debt stays with him. You don't owe it. Don't ask me to thank him either. The world gets to "
         "keep running. That's the job."]]}
INTRO=[['D', 'You can stop hovering. Everything will be alright.'],
 ['H', "You keep saying that. You're not alright."],
 ['D', "I've had worse days. I deserve this."],
 ['H', "Don't say that. You didn't do anything to deserve getting sick."],
 ['D', "Let it go. It isn't something you need to understand."],
 ['H',
  'What I understand is you need help. The maze is the fastest way to get the money, and whatever they need '
  'to make you well.'],
 ['D', "No. You're not going in there."],
 ['H', "I have to. Waiting here won't save you."],
 ['D', "People don't come home from that place. I won't lose you to it."],
 ['H', "I'll come back. I promise. I'm going to save you."],
 ['D',
  "I keep seeing a crystal when I close my eyes. That's just the fever. Everything will be alright if you "
  'stay. Please.'],
 ['H', "I'm sorry. I'm going into the maze."]]

def collect(pg):
  # Exercise the real UI, including typing/tap lock and the ending title-card transition.
  return ev(pg,'''new Promise((resolve,reject)=>{
    SOTA.rpg.s6.setSpeed(0);const out=[],start=Date.now();
    const timer=setInterval(()=>{
      if(Date.now()-start>60000){clearInterval(timer);reject(new Error("scene timed out"));return;}
      const s=SOTA.rpg.s6.line();
      if(!s||document.querySelector("#s6d .s6btns button")){clearInterval(timer);resolve(out);return;}
      if(s.typing)return;
      out.push([s.who,document.querySelector("#s6d .s6t").textContent]);
      document.querySelector("#s6d .s6t").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));
    },1);
  })''')

def setup(p):
  b,c,pg=S6.start(p)
  ev(pg,'window.testParty=[SOTA.rpg.live().party[0],...RPG.COMPANIONS.map(d=>RPG.makeCompanion(d,1))]')
  return b,c,pg

def party(pg,mask):
  ev(pg,f'SOTA.rpg.live().party=window.testParty.filter((c,i)=>i===0||({mask}>>(i-1)&1))')

def back(pg):
  ev(pg,'document.querySelector("[data-s6b=back]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))')
  check(not ev(pg,'SOTA.storyOpen()'),'Back did not close ending')

def t_intro_exact(p):
  b,c,pg=S6.start(p,drain_open=False)
  got=collect(pg);check(got==INTRO,f'intro wording changed: {got}')
  check(len(got)==12 and {w for w,t in got}=={'H','D'},'intro cast/length')
  check("I deserve this" in got[2][1] and "That's just the fever." in got[10][1] and got[-1][1]=="I'm sorry. I'm going into the maze.",'intro key beats')
  check(not any("It's only a cough" in t for w,t in got),'old intro played');b.close()

def t_picnic_and_bedside_all_parties(p):
  b,c,pg=setup(p)
  for mask in range(8):
    party(pg,mask)
    ev(pg,'const s=SOTA.rpg.s6.st();s.walls={};s.order=[];s.revealed=false;s.told={};S6H.wall(84)')
    hints=collect(pg)
    check(hints[0]==['H','This one is about more than the maze.'],'bedside hint opener')
    want=[['H','This one is about more than the maze.']]
    if mask&1:want+=[['Q','Okay. Stay with this one. It matters.']]
    elif mask&2:want+=[['S','The subject has changed. This is no longer only the maze.']]
    elif mask&4:want+=[['A','This is more than the maze.']]
    check(hints==want and len({w for w,t in hints})<=2,'bedside cast or hint wording')
    check(not ev(pg,'SOTA.rpg.s6.st().revealed'),'bedside leaked reveal')
    check(not any('dad' in t.lower() or 'father' in t.lower() for w,t in hints),'bedside names dad')
    ev(pg,'S6H.wall(80)');check(ev(pg,'SOTA.rpg.s6.line().kind')=='wall','picnic kind')
    check(ev(pg,'document.querySelector("#s6d .s6wall").getAttribute("src")')=='art6/zone5-08-picnic-farthest.webp','picnic art')
    got=collect(pg)
    if mask&1:want=P['R1'][:]
    elif mask&2:want=P['R1-alt'][:]
    elif mask&4:want=P['R1-alt2'][:]
    else:want=[P['R1'][0],P['R1'][2]]
    if mask&1 and mask&2:want+=P['R2']
    if mask&4 and mask&3:want+=P['R3']
    check(got==want,f'picnic mask {mask}: {got}')
    check(ev(pg,'SOTA.rpg.s6.st().revealed'),'picnic did not set revealed')
    check(ev(pg,'SOTA.rpg.s6.st().order')==[84,80] and ev(pg,'SOTA.rpg.s6.st().lastPiece')==26,'wall bookkeeping')
    check(ev(pg,'Object.keys(SOTA.rpg.s6.st().told).length')==0,'scripted walls injected memory')
    ev(pg,'S6H.wall(80)');check(not ev(pg,'SOTA.storyOpen()'),'picnic played twice')
  b.close()

def expected(k,mask,version):
  q,s,a=[bool(mask&n) for n in (1,2,4)]
  if k=='low':
    if q and s:return P['D2']+(P['D3'] if a else [])
    if q and a:return P['D2-alt']
    if s and a:return P['D2-alt2']
    if q:return [P['D2'][0]]
    if s:return [P['D2-alt2'][0]]
    if a:return [P['D2-alt'][1]]
    return []
  if k=='mid':return (P['C1'] if q else [])+(P['C2'] if s else [])+(P['C3a' if version=='save' else 'C3b'] if a else [])
  return (P['F1'] if q else [P['F1'][0]])+(P['F2'] if s else [])+(P['F3'] if a and version=='save' else [])

def t_endings_all_parties_and_join_versions(p):
  b,c,pg=setup(p)
  gates={'low':[], 'mid':[36], 'high':[36,37,46,38,50,80,62]}
  for k,ids in gates.items():
    for mask in range(8):
      for version in ('save','died'):
        party(pg,mask)
        ev(pg,f'(()=>{{const s=SOTA.rpg.s6.st();s.walls={{}};{json.dumps(ids)}.forEach(i=>s.walls[i]=1);s.revealed=false;s.brunnJoin={json.dumps(version)};S6H.bossWon()}})()')
        got=collect(pg);want=expected(k,mask,version)
        check(got==want,f'{k} mask {mask} {version}: {got}')
        check(ev(pg,'SOTA.rpg.s6.st().ending')==k and ev(pg,'document.getElementById("s6d").dataset.ending')==k,'ending state/title mismatch')
        check(ev(pg,'SOTA.rpg.s6.st().golemDefeated'),'boss won state missing')
        check(not ev(pg,'SOTA.rpg.s6.st().revealed'),'ending played picnic reveal')
        if k=='low':check(all(w!='H' and w!='D' for w,t in got),'death hero/dad spoke')
        if k in ('low','mid'):
          check(not any('your father' in t.lower() or 'he made' in t.lower() or 'he broke everything' in t.lower() or 'writer' in t.lower() or 'drawer' in t.lower() for w,t in got),'death/cracked cause leak')
        if k=='low' and mask==0:
          check('0 / 85' in pg.locator('#s6d').inner_text() and '0 / 28' in pg.locator('#s6d').inner_text(),'empty death counts missing')
        back(pg)
  b.close()

def t_story_data_hash(p):
  root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
  locks=json.load(open(os.path.join(root,'tests/locks7.json')))
  check(hashlib.sha256(open(os.path.join(root,'story-data.js'),'rb').read()).hexdigest()==locks['story-data.js'],'story-data.js hash changed')

TESTS=[v for k,v in list(globals().items()) if k.startswith('t_')]
if __name__=='__main__':
  S6.S4.BASE=sys.argv[1];ok=0;bad=[]
  with sync_playwright() as p:
    for t in TESTS:
      start=time.time()
      try:t(p);ok+=1;print('PASS',t.__name__,f'{time.time()-start:.1f}s',flush=True)
      except Exception as e:bad.append(t.__name__);print('FAIL',t.__name__,repr(e),flush=True)
  print(f'scripted scenes: {ok} passed, {len(bad)} failed',bad);sys.exit(bool(bad))
