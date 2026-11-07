"""Stage 7 content and Jeremy t1848u-t1855u chest choices, seeded profiles and locked content."""
import os,sys,json,time,hashlib,re
sys.path.insert(0,os.path.dirname(__file__))
import stage4_tests as S4
import stage6_tests as S6
from stage4_tests import check,ev,tap,page,ctx,create,Fail
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCKS=json.load(open(os.path.join(ROOT,'tests/locks7.json')))
ZONE_GEAR=json.load(open(os.path.join(ROOT,'tests/zone-gear7.json')))
BALANCE=open(os.path.join(ROOT,'tests/balance7.js')).read()
NAMES=[['Rat','Slime','Big bug','Cave bat','Giant spider','Mud toad','Fungus creeper'],['Goblin','Orc','Fairy','Kobold','Wild boar','Pixie swarm','Hobgoblin brute'],['Centaur','Werewolf','Skeleton','Ghoul','Harpy','Dire wolf','Wraith'],['Minotaur','Griffin','Lizard man','Stone gargoyle','Manticore','Ogre warlord','Giant scorpion'],['Basilisk','Dragon','Hydra','Wyvern','Chimera','Salamander','Shadow drake']]
def setup(p):
 b,c=ctx(p);pg=page(c);return b,pg
def source(pg,name):return pg.request.get(S4.BASE+name).text()
def fixture(pg):pg.add_script_tag(url=S4.BASE+"tests/balance7.js")
def t_roster(p):
 b,pg=setup(p);check(ev(pg,'RPG.MONSTERS.slice(1)')==NAMES,'35 names/order changed')
 for z in range(1,6):
  ms=ev(pg,f'Array.from({{length:7}},(_,i)=>RPG.makeMonster({z},i,30,.5,"normal"))')
  check(len({m['role'] for m in ms})==7,'zone roles not distinct')
  check(len({(m['atk'],m['def'],m['pierce']) for m in ms})==7,'roster is HP-only reskins')
  check(max(m['hp'] for m in ms)/min(m['hp'] for m in ms)>1.5,'no tank / low-HP tradeoff')
  check(all(not m['boss'] for m in ms),'another boss added')
 b.close()
def t_scaling_and_hallway(p):
 b,pg=setup(p)
 check(ev(pg,"RPG.ZONE_MUL")==[0,1,1.3,1.7,2.2,2.8],"zone multipliers changed")
 for k in range(7):
  ms=ev(pg,f'[1,2,3,4,5].map(z=>RPG.makeMonster(z,{k},40,0,"normal"))')
  # Role tradeoffs can cross HP (a later glass cannon vs an earlier tank); the zone base and roster averages rise.
  means=ev(pg,'[1,2,3,4,5].map(z=>{const a=Array.from({length:7},(_,i)=>RPG.makeMonster(z,i,40,0,"normal"));return [a.reduce((s,m)=>s+m.hp,0)/7,a.reduce((s,m)=>s+m.atk,0)/7]})')
  check(all(means[i][0]<means[i+1][0] and means[i][1]<means[i+1][1] for i in range(4)),'zone scaling lost')
  check(ev(pg,f'RPG.makeMonster(3,{k},30,1,"normal").hp>RPG.makeMonster(3,{k},30,0,"normal").hp'),'centre scaling lost')
 s=source(pg,'party.js');check('rid>=0?0.15:0.02' in s,'hallway no longer about 2%');check('if(stepsSince<10)return;' in s,'no cooldown')
 check('if(R.isSavePoint(M,p.x,p.y))' in s and s.index('if(R.isSavePoint(M,p.x,p.y))')<s.index('if(stepsSince<10)return;'),'camp/tavern fights')
 check(ev(pg,'["story","normal","hard"].map(d=>[RPG.DIFF[d].hp,RPG.DIFF[d].matk])')==[[2,.5],[1,1],[1,1.5]],'difficulty changed');b.close()
def t_room_multipliers(p):
 b,pg=setup(p)
 bad=ev(pg,'''(()=>{const bad=[],seen=new Set();for(let z=1;z<=5;z++)for(const d of ['story','normal','hard'])for(let seed=0;seed<120;seed++){
 const h=RPG.encounter(z,25,.7,d,seed),snapshot=JSON.stringify(h),r=RPG.roomEncounter(z,25,.7,d,seed);if(h.length!==r.length)bad.push('count');
 const profiles=new Set();h.forEach((m,i)=>{const n=r[i],p=n.roomProfile,hm=p===1?1:2,am=p===0?1:1.5;seen.add(p);profiles.add(p);
 if(![0,1,2].includes(p)||n.n!==m.n||n.kind!==m.kind||n.lvl!==m.lvl||n.hp!==m.hp*hm||n.max!==m.max*hm||Math.abs(n.atk-m.atk*am)>1e-8||n.def!==m.def||!n.room)bad.push([z,d,seed,p]);});
 if(profiles.size!==1)bad.push('profile per foe, not per room');if(JSON.stringify(RPG.encounter(z,25,.7,d,seed))!==snapshot)bad.push('hallway altered');
 if(JSON.stringify(RPG.roomEncounter(z,25,.7,d,seed))!==JSON.stringify(r))bad.push('not seeded');}
 if([...seen].sort().join(',')!=='0,1,2')bad.push('missing room profile');return bad})()''')
 check(not bad,'room profiles must be exactly (2x/1x), (1x/1.5x), or (2x/1.5x), one per room: '+str(bad[:3]));b.close()
def t_room_hook(p):
 b,pg=setup(p);create(pg);id=ev(pg,'MAZE.rooms.find(r=>r.k==="monster").id');ev(pg,f'SOTA.teleport(...MAZE.rooms[{id}].c,0);SOTA.onRoomOpen({id})')
 check(ev(pg,'SOTA.rpg.fight().m.every(m=>m.room)'),'monster room used hallway encounter');check(ev(pg,'SOTA.rpg.fight().why')=='room','wrong room context');b.close()
def t_treasure_kinds(p):
 b,pg=setup(p)
 r=ev(pg,'''(()=>{const C=RPG.newChar('x','cat','mage',{},'bolt'),out=[];for(let z=1;z<=5;z++)for(let seed=0;seed<100;seed++)for(let n=0;n<3;n++){
 const t=RPG.treasure(z,seed,Math.max(1,z*10-3),n);out.push({...t,slots:t.items.map(id=>RPG.ITEMS[id].slot),cant:t.items.some(id=>!RPG.canEquip(C,id,RPG.ITEMS[id].slot==='acc'?'acc1':RPG.ITEMS[id].slot))});}return out})()''')
 check({x['kind'] for x in r}=={'equipment','gold','jewelry'},'missing chest category')
 check(ev(pg,'(()=>{for(let seed=0;seed<100;seed++){const a=RPG.treasure(2,seed,20,0),b=RPG.treasure(2,seed,20,1);if(JSON.stringify(a)!==JSON.stringify(b))return false;}return true})()'),'kind still follows chest ordinal')
 check(len(set(ev(pg,'Array.from({length:100},(_,seed)=>RPG.treasure(2,seed,20,0).kind)')))==3,'one ordinal cannot roll all three kinds')
 check(ev(pg,'(()=>{const a=Array.from({length:60},(_,i)=>RPG.treasure(2,i,20,i).kind);return a.some((k,i)=>k!==["equipment","gold","jewelry"][i%3])&&a.every((k,i)=>k===RPG.treasure(2,i,20,i).kind)})()'),'sequential chests fixed or seed is not repeatable')
 check(any(x['cant'] for x in r),'chests only match hero class')
 for x in r:
  check(x['tier']>=1 and x['tier']<=5,'bad gear tier')
  if x['kind']=='gold':check(x['gold']>0 and not x['items'],'gold category empty')
  elif x['kind']=='jewelry':check(x['slots']==['acc'],'jewelry not accessory')
  else:check(x['items'] and all(v in ['weapon','chest','helmet','boots','gloves','offhand'] for v in x['slots']),'equipment category empty')
 check(ev(pg,'(()=>{const seed=Array.from({length:100},(_,i)=>i).find(i=>RPG.treasure(1,i,50).kind==="jewelry");return RPG.treasure(1,seed,50).tier})()')==1,'jewelry ignores the fixed zone stats')
 check(ev(pg,'RPG.ITEMS.z5_mage_crystal_ring.mag>RPG.ITEMS.z1_mage_moon_ring.mag&&RPG.ITEMS.z5_warrior_crystal_ring.atk>RPG.ITEMS.z1_warrior_iron_band.atk'),'jewelry has no scaled buffs')
 check(ev(pg,'(()=>{const c=RPG.newChar("x","cat","mage",{},"bolt");return !RPG.canEquip(c,"z5_crystal_plate","chest")&&!RPG.canEquip(c,"z2_briar_axe","weapon")&&RPG.canEquip(c,"z5_mage_crystal_ring","acc2")})()'),'equipment limits lost')
 check(ev(pg,'(()=>{const c=RPG.newChar("x","elf","archer",{},"aimed");c.equip.weapon="z5_crystal_bow";return !RPG.canEquip(c,"z2_oak_buckler","offhand")})()'),'relic bow permits offhand');b.close()
def t_zone_gear_tables(p):
 b,pg=setup(p);wanted={r['id']:r['item'] for r in ZONE_GEAR};got=ev(pg,'ids=>Object.fromEntries(ids.map(id=>[id,RPG.ITEMS[id]]))',list(wanted))
 check(got==wanted,'zone gear names/slots/types/stats/weights/values differ from Jeremy tables')
 check(set(ev(pg,'Object.keys(RPG.ITEMS).filter(id=>/^z[1-5]_/.test(id))'))==set(wanted),'zone gear duplicated by recipient')
 for z,n in enumerate([3,4,5,7,9],1):
  for cls in ['warrior','rogue','mage','archer']:
   check(len([r for r in ZONE_GEAR if r['zone']==z and r['class']==cls and r['kind']=='weapon'])==n,'weapon list count differs from t1854u')
   for kind in ['armor','jewelry','equipment']:check(len([r for r in ZONE_GEAR if r['zone']==z and r['class']==cls and r['kind']==kind])==(1 if kind=='equipment' else n),'class catalog count differs from t1855u')
 check(ev(pg,'["sword","leather","robe","plate","bow","staff"].every(id=>!!RPG.ITEMS[id])'),'starter items removed')
 for row in ZONE_GEAR:
  check(row['item']['v']==40*row['zone']**2,'bad fixture value')
  if row['kind']=='weapon':check(ev(pg,'a=>RPG.CLASSES[a.cls].weapons.includes(RPG.ITEMS[a.id].t)',{'cls':row['class'],'id':row['id']}),'table weapon not class-appropriate')
 check(ev(pg,'(()=>{const c=RPG.newChar("x","elf","warrior",{},"cleave");return !RPG.canEquip(c,"z3_stone_face_shield","offhand")&&!RPG.canEquip(c,"z4_runic_tower_shield","offhand")&&!RPG.canEquip(c,"z5_crystal_tower_shield","offhand")})()'),'heavy shields ignore race armor limit')
 check(ev(pg,'(()=>{const c=RPG.newChar("x","elf","archer",{},"aimed");c.equip.weapon="z5_crystal_bow";return !RPG.canEquip(c,"z2_oak_buckler","offhand")})()'),'zone bow allows offhand');b.close()
def t_zone_equipment_rolls(p):
 b,pg=setup(p);expected={r['id']:r for r in ZONE_GEAR};seen=set()
 rolls=ev(pg,'(()=>{const a=[];for(let z=1;z<=5;z++)for(const cls of ["warrior","rogue","mage","archer"])for(let seed=0;seed<1000;seed++){const t=RPG.treasure(z,seed,50,[{name:"Hero",cls}]);if(t.kind==="equipment")a.push({zone:z,...t});}return a})()')
 for t in rolls:
  check(len(t['items'])==1 and t['gold']==0,'equipment roll has wrong reward');id=t['items'][0];check(id in expected,'equipment chest still uses generic relic gear')
  row=expected[id];check(row['zone']==t['zone'] and row['kind']==t['equipmentKind'],'equipment not from the rolled kind and actual zone table');seen.add(id)
 check(seen=={id for id,r in expected.items() if r['kind']!='jewelry'},'some zone/kind/class equipment pieces never roll')
 check({expected[id]['class'] for id in seen}=={'warrior','rogue','mage','archer'},'not all four classes roll');b.close()
def t_other_equipment_no_filter(p):
 b,pg=setup(p)
 for z in range(1,6):
  want={r['id'] for r in ZONE_GEAR if r['zone']==z and r['kind']=='equipment'}
  got=ev(pg,f'(()=>{{const c=RPG.newChar("Mage","cat","mage",{{}},"bolt"),a=Array.from({{length:1000}},(_,seed)=>RPG.treasure({z},seed,50,[c])).filter(t=>t.equipmentKind==="equipment");return {{ids:[...new Set(a.map(t=>t.items[0]))],unusable:a.some(t=>!RPG.canEquip(c,t.items[0],RPG.ITEMS[t.items[0]].slot))}}}})()')
  check(set(got['ids'])==want and got['unusable'],'other equipment filtered for hero or lost unusable rewards')
 b.close()
def t_named_jewelry(p):
 b,pg=setup(p);expected={r['id']:r for r in ZONE_GEAR if r['kind']=='jewelry'};seen=set()
 rolls=ev(pg,'(()=>{const a=[];for(let z=1;z<=5;z++)for(const cls of ["warrior","rogue","mage","archer"])for(let seed=0;seed<1000;seed++){const t=RPG.treasure(z,seed,50,[{name:"Hero",cls}]);if(t.kind==="jewelry")a.push({zone:z,cls,...t,item:RPG.ITEMS[t.items[0]]});}return a})()')
 for t in rolls:
  id=t['items'][0];check(id in expected,'jewelry still generic relics');row=expected[id];it=t['item'];z=t['zone'];seen.add(id)
  check(row['zone']==z and row['class']==t['cls'] and t['recipient']==0 and not t['gold'],'jewelry wrong zone/class/recipient')
  stat='mag' if t['cls']=='mage' else 'atk';check(it['slot']=='acc' and it[stat]==[2,6,10,14,18][z-1] and it['hp']==[5,22,39,56,73][z-1] and it['v']==40*z*z,'jewelry buffs/slot/value differ from zone table')
  check(it['accessory']==('ring' if re.search(r'\b(ring|band)\b',it['n'].lower()) else 'amulet'),'ring/necklace kind wrong')
 check(seen==set(expected),'not all shared class jewelry names roll');b.close()
def t_weapon_recipients(p):
 # The same joined-only roll serves weapons, armor, and the separate jewelry category.
 b,pg=setup(p);rows={r['id']:r for r in ZONE_GEAR};seen={}
 rolls=ev(pg,'''(()=>{const out=[],party=[{name:'Hero',cls:'warrior'},{name:'Mira',cls:'rogue'},{name:'Sorrel',cls:'mage'},{name:'Brunn',cls:'archer'}];for(let z=1;z<=5;z++)for(let n=1;n<=4;n++)for(let seed=0;seed<1000;seed++){
 const t=RPG.treasure(z,seed,50,party.slice(0,n),party.slice(n));if(t.kind==='jewelry'||['weapon','armor'].includes(t.equipmentKind))out.push({zone:z,n,seed,...t});}return out})()''')
 for t in rolls:
  target=t['recipient'];check(target in range(1 if t['zone']==1 else t['n']),'unjoined or wrong-zone recipient rolled');row=rows[t['items'][0]]
  check(row['class']==['warrior','rogue','mage','archer'][target] and t['forClass']==row['class'],'item does not match joined recipient class');check(t['forName']==['Hero','Mira','Sorrel','Brunn'][target],'wrong item recipient name')
  seen.setdefault((t['zone'],t['n'],row['kind']),set()).add(target)
 for (z,n,kind),got in seen.items():check(got==set(range(1 if z==1 else n)),'joined members not all recipient options for '+kind)
 ids={kind:[r['id'] for r in ZONE_GEAR if r['zone']==1 and r['kind']==kind and r['class']=='warrior'] for kind in ['weapon','armor','jewelry']}
 check(ev(pg,'''ids=>{const party=[{name:'Hero',cls:'warrior'},{name:'Mira',cls:'rogue'}];for(let seed=0;seed<1000;seed++){const t=RPG.treasure(1,seed,1,party),kind=t.kind==='jewelry'?'jewelry':t.equipmentKind;if(!ids[kind])continue;const r=RPG.rng(seed);r();if(kind!=='jewelry')r();if(t.items[0]!==ids[kind][Math.floor(r()*ids[kind].length)])return false;}return true;}''',ids),'zone 1 consumes a companion who-roll');b.close()
def t_shared_weapon_lists(p):
 # All three list types share IDs for same-class members; never copy per person.
 b,pg=setup(p)
 got=ev(pg,'''(()=>{const out={},before=Object.keys(RPG.ITEMS).sort().join('|'),party=['Hero','Mira','Sorrel','Brunn'].map(name=>({name,cls:'rogue'}));for(let z=2;z<=5;z++){const seen=Object.fromEntries(['weapon','armor','jewelry'].map(k=>[k,[new Set(),new Set(),new Set(),new Set()]]));for(let seed=0;seed<5000;seed++){const t=RPG.treasure(z,seed,50,party),kind=t.kind==='jewelry'?'jewelry':t.equipmentKind;if(seen[kind])seen[kind][t.recipient].add(t.items[0]);}out[z]=Object.fromEntries(Object.entries(seen).map(([kind,sets])=>[kind,sets.map(s=>[...s].sort())]));}return {out,unchanged:before===Object.keys(RPG.ITEMS).sort().join('|')}})()''')
 check(got['unchanged'],'item rolls generated recipient-specific items')
 for z,kinds in got['out'].items():
  for kind,lists in kinds.items():
   wanted=sorted(r['id'] for r in ZONE_GEAR if r['zone']==int(z) and r['kind']==kind and r['class']=='rogue')
   check(all(ids==wanted for ids in lists),'same-class members do not share the same prebuilt '+kind+' list')
 b.close()
def t_join_weapon_catalog_and_hook(p):
 b,c,pg=S6.start(p);before=ev(pg,'Object.keys(RPG.ITEMS).sort()');check(len(ev(pg,'SOTA.rpg.live().party'))==1,'join fixture not solo')
 check(ev(pg,'Array.from({length:500},(_,seed)=>RPG.treasure(2,seed,1,SOTA.rpg.live().party)).filter(t=>t.kind==="jewelry"||["weapon","armor"].includes(t.equipmentKind)).every(t=>t.recipient===0)'),'Mira rolled before joining')
 S4.step_into(pg,ev(pg,'MAZE.taverns[0]'));S6.drain(pg);check(len(ev(pg,'SOTA.rpg.live().party'))==2,'Mira did not join');check(ev(pg,'Object.keys(RPG.ITEMS).sort()')==before,'joining generated new items')
 for index,kind in enumerate(['weapon','armor','jewelry']):
  spec=ev(pg,'''a=>{const L=SOTA.rpg.live(),room=MAZE.rooms.filter(r=>r.k==='treasure'&&r.z===2)[a.index];for(let seed=0;seed<2000;seed++){const t=RPG.treasure(2,(seed^(room.id*2654435761))>>>0,RPG.partyLevel(L.party),L.party),kind=t.kind==='jewelry'?'jewelry':t.equipmentKind;if(t.forName==='Mira'&&kind===a.kind){L.seed=seed;return {room:room.id,id:t.items[0],cls:L.party[1].cls};}}throw Error('no Mira seed')}''',{'index':index,'kind':kind})
  ev(pg,f'SOTA.onRoomOpen({spec["room"]})');check('For Mira' in pg.locator('#s4').inner_text(),'room hook did not pass joined party for '+kind);check(ev(pg,'id=>SOTA.rpg.live().party.some(c=>c.bag.includes(id))',spec['id']),'wrong recipient item awarded')
  if kind=='weapon':check(ev(pg,'id=>RPG.canEquip(SOTA.rpg.live().party[1],id,"weapon")',spec['id']),'weapon not legal for joined Mira')
  check(ev(pg,'Object.keys(RPG.ITEMS).sort()')==before,'opening chest generated new ids');tap(pg,'#s4 button:has-text("Continue")')
 b.close()
def t_zone_gold(p):
 b,pg=setup(p)
 for z,amount in enumerate([40,160,360,640,1000],1):
  rolls=ev(pg,f'Array.from({{length:1000}},(_,seed)=>RPG.treasure({z},seed,50)).filter(t=>t.kind==="gold")')
  check(len(rolls)>200 and all(t['gold']==amount and not t['items'] for t in rolls),'gold is not exact item-equivalent zone value '+str(z))
 b.close()
def t_treasure_ui(p):
 b,pg=setup(p);create(pg);ids=ev(pg,'(()=>{const L=SOTA.rpg.live();L.seed=1;return ["equipment","gold","jewelry"].map(kind=>MAZE.rooms.find(r=>r.k==="treasure"&&RPG.treasure(r.z,(L.seed^(r.id*2654435761))>>>0,1).kind===kind).id)})()')
 for id in ids:
  expected=ev(pg,'id=>{const L=SOTA.rpg.live(),r=MAZE.rooms[id];return RPG.treasure(r.z,(L.seed^(id*2654435761))>>>0,RPG.partyLevel(L.party),L.party);}',id);before=ev(pg,'SOTA.rpg.live().gold')
  ev(pg,f'SOTA.onRoomOpen({id})');check(ev(pg,'SOTA.rpg.ui()')=='treasure','no persistent found panel');text=pg.locator('#s4').inner_text();check('Treasure chest' in text and ('gold' in text.lower() or 'ATK' in text or 'MAG' in text or 'DEF' in text),'does not show actual found reward');check(not ev(pg,'SOTA.storyOpen()'),'chest got wall art')
  check(ev(pg,'SOTA.rpg.live().gold')==before+expected['gold'],'gold award differs from rolled chest')
  for item in expected['items']:check(ev(pg,'id=>SOTA.rpg.live().party.some(c=>c.bag.includes(id))',item),'rolled item not granted')
  tap(pg,'#s4 button:has-text("Continue")')
 check(ev(pg,'SOTA.rpg.live().party[0].bag.some(id=>id.startsWith("z"))'),'no named zone equipment awarded');b.close()
def fullbag_setup(p,kind='equipment',two=False,heavy=False,w=390):
 b,c=ctx(p,w,844);pg=page(c);create(pg,race='cat' if heavy else 'human',inc=() if heavy else ('str','str','str'))
 spec=ev(pg,'''a=>{const L=SOTA.rpg.live();if(a.two)L.party.push(RPG.makeCompanion(RPG.COMPANIONS[0],1));const room=MAZE.rooms.find(r=>r.k==="treasure");
 for(let seed=0;seed<2000;seed++){const l=RPG.treasure(room.z,(seed^(room.id*2654435761))>>>0,1,L.party),id=l.items[0],it=RPG.ITEMS[id];
 if(l.kind===a.kind&&(!a.heavy?(a.kind==="jewelry"||it.w>=2&&it.w<=5):it.w===12)){L.seed=seed;L.party.forEach(c=>{c.bag=[];while(RPG.canCarry(c,"potion"))c.bag.push("potion");});return {room:room.id,id,weight:it.w,gold:L.gold,bags:L.party.map(c=>c.bag.slice()),equip:L.party.map(c=>({...c.equip}))};}}
 throw Error("no test chest seed");}''',{'kind':kind,'two':two,'heavy':heavy})
 check(ev(pg,'id=>SOTA.rpg.live().party.every(c=>!RPG.canCarry(c,id))',spec['id']),'test bags not full')
 ev(pg,f'SOTA.markSolved({spec["room"]})');S4.step_into(pg,ev(pg,f'MAZE.rooms[{spec["room"]}].c'));tap(pg,'#pgo');return b,pg,spec
def t_fullbag_leave(p):
 for kind in ['equipment','jewelry']:
  b,pg,spec=fullbag_setup(p,kind,w=360)
  check(ev(pg,'SOTA.rpg.live().party.map(c=>c.bag)')==spec['bags'],'opening gesture silently dropped a bag item');check('Bags are full.' in pg.locator('#s4').inner_text(),'no full-bag choice');check(pg.locator('[data-chestleave]').count()==1,'no Leave it choice')
  check(not pg.locator('#s4 button:has-text("Continue")').count(),'can skip unresolved item');check(ev(pg,'SOTA.rpg.live().gold')==spec['gold'],'chest silently sold before choice')
  check(ev(pg,'[...document.querySelectorAll("#s4 button")].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height>=44})'),'full-bag buttons do not fit phone width/touch size')
  tap(pg,'[data-chestleave]');check('Left it. Gone.' in pg.locator('#s4').inner_text() and 'Keep it for a companion' not in pg.locator('#s4').inner_text(),'left item still described as kept');tap(pg,'#s4 button:has-text("Continue")')
  check(ev(pg,'id=>SOTA.rpg.live().party.every(c=>!c.bag.includes(id))',spec['id']),'left item was kept')
  check(ev(pg,'SOTA.rpg.live().party.map(c=>c.bag)')==spec['bags'],'Leave it changed bags');check(ev(pg,'SOTA.rpg.live().gold')==spec['gold'],'Leave it sold item')
  check(ev(pg,f'SOTA.rooms().cleared.includes({spec["room"]})'),'left chest not cleared');b.close()
def t_fullbag_drop(p):
 b,pg,spec=fullbag_setup(p,two=True);drops=0
 while pg.locator('[data-chestdrop]').count():
  check(drops<30,'cannot make room');tap(pg,'[data-chestdrop="1"][data-chestitem="potion"]');drops+=1
  check(ev(pg,'SOTA.rpg.live().gold')==spec['gold'],'dropping or chest grant sold something')
 check(drops>=2,'did not exercise multiple drops');check(ev(pg,'id=>SOTA.rpg.live().party[1].bag.includes(id)',spec['id']),'chest not granted to bag with space')
 check(ev(pg,'SOTA.rpg.live().party[1].bag.filter(x=>x==="potion").length')==len(spec['bags'][1])-drops,'dropped items not gone')
 check(ev(pg,'SOTA.rpg.live().party[0].bag')==spec['bags'][0],'wrong bag changed');check(ev(pg,'SOTA.rpg.live().party.map(c=>c.equip)')==spec['equip'],'equipped slots changed')
 tap(pg,'#s4 button:has-text("Continue")');b.close()
def t_fullbag_too_heavy(p):
 b,pg,spec=fullbag_setup(p,heavy=True,w=360)
 check('Even an empty bag cannot hold it' in pg.locator('#s4').inner_text(),'missing too-heavy explanation');check(not pg.locator('[data-chestdrop]').count(),'offers pointless drops for overweight item')
 tap(pg,'[data-chestleave]');check(ev(pg,'SOTA.rpg.live().gold')==spec['gold'],'overweight item sold');check(ev(pg,'SOTA.rpg.live().party.map(c=>c.bag)')==spec['bags'],'overweight choice dropped bag contents');b.close()
def t_no_chest_auto_sell(p):
 b,pg=setup(p);s=source(pg,'party.js');chest=s[s.index('function treasurePanel('):s.index('// ================= Stage 5:')]
 check('E.sellPrice' not in chest and 'sold for' not in chest and 'auto-convert' not in chest,'old chest conversion code/copy remains');check('no room, left behind' in s and 'Nobody can carry that' in s,'unrelated overflow rules changed');b.close()
def t_room_once(p):
 b,pg=setup(p);create(pg);ev(pg,'SOTA.rpg.live().seed=1');id=ev(pg,'MAZE.rooms.find(r=>r.k==="treasure").id');ev(pg,f'SOTA.markSolved({id})');cell=ev(pg,f'MAZE.rooms[{id}].c');S4.step_into(pg,cell)
 check(ev(pg,'SOTA.panelOpen()'),'first entry has no room panel');tap(pg,'#pgo');check(ev(pg,'SOTA.rpg.ui()')=='treasure','Continue did not open chest');tap(pg,'#s4 button:has-text("Continue")')
 before=ev(pg,'[SOTA.rpg.live().gold,SOTA.rpg.live().party[0].bag]');ev(pg,'SOTA.act("back");SOTA.act("fwd")')
 check(not ev(pg,'SOTA.panelOpen()'),'cleared room panel repeated');check(ev(pg,'SOTA.rpg.ui()')!='treasure','chest respawned');check(ev(pg,'[SOTA.rpg.live().gold,SOTA.rpg.live().party[0].bag]')==before,'treasure awarded twice');check(ev(pg,f'SOTA.rooms().cleared.includes({id})'),'room not permanently cleared');b.close()
def t_boss_rules(p):
 b,pg=setup(p);create(pg)
 m=ev(pg,'RPG.makeBoss("normal")');check(m['n']=='Iron Golem' and m['boss'] and not m.get('placeholder'),'placeholder Golem')
 check(ev(pg,'new RPG.Fight(SOTA.rpg.live().party,[RPG.makeBoss("normal")],"normal",1).act(0,"run")')=="Can't run!",'boss escape allowed')
 fixture(pg)
 a=ev(pg,'''(()=>{const f=new RPG.Fight(preparedParty(RPG,'normal'),[RPG.makeBoss('normal')],'normal',4);f.monstersTurn();const charge=f.monstersTurn();const before=f.p.map(c=>c.hp);f.p.forEach((c,i)=>f.act(i,'defend'));const sweep=f.monstersTurn();return {charge,sweep,damage:before.map((v,i)=>v-f.p[i].hp),turn:f.turn};})()''')
 check(any('Defend' in x for x in a['charge']),'no wind-up warning');check(len(a['sweep'])==4 and all('sweeps' in x for x in a['sweep']),'no party-wide sweep');check(all(0<v<120 for v in a['damage']),'guard does not counter sweep');b.close()
def t_boss_balance(p):
 b,pg=setup(p);fixture(pg);r=ev(pg,'Object.fromEntries(["story","normal","hard"].map(d=>[d,Array.from({length:40},(_,i)=>bossSample(RPG,d,i+1))]))')
 n=r['normal'];check(all(x['over']=='win' and 5<=x['turns']<=25 for x in n),'Normal not a hard-but-winnable fight')
 avg=lambda d:sum(x['hp']/x['initial'] for x in r[d])/40
 check(.2<avg('normal')<.75,'normal is a stomp or overly punishing');check(avg('story')>avg('normal')>avg('hard'),'difficulty not harder/easier');check(sum(x['over']=='win' for x in r['hard'])>=20,'Hard effectively unwinnable');starter=ev(pg,'Array.from({length:40},(_,i)=>bossSample(RPG,"normal",i+1,"starter"))');check(sum(x['over']=='win' for x in starter)<20,'unprepared starter-skill play steamrolls boss');b.close()
def t_xp_budget(p):
 b,pg=setup(p);fixture(pg);r=ev(pg,'Array.from({length:20},(_,i)=>progression(RPG,undefined,i*7919))')
 check(all(45<=x['levels'][-1]<=50 for x in r),'exploring XP curve outside 45-50')
 check(all(x['levels'][0]>=8 and x['levels'][1]>=15 for x in r),'party not ready for next zones')
 check(70000<r[0]['capXP']<100000,'XP cap budget diverged from ~110 fights')
 check(ev(pg,'RPG.xpNeed(50)===Infinity'),'cap no longer 50');b.close()
def t_locked_content(p):
 b,pg=setup(p)
 for name,want in LOCKS.items():check(hashlib.sha256(pg.request.get(S4.BASE+name).body()).hexdigest()==want,'protected content changed: '+name)
 s=source(pg,'story.js');line=next(l for l in s.splitlines() if l.startswith('const ROOM_ART='));check(hashlib.sha256(line.encode()).hexdigest()=='79826398557961b67bd26b1670c1f48c6c8a5cec82893227eb7101753d0693b3','ROOM_ART changed')
 check('Is he carrying... a baby?' in source(pg,'story-data.js') and 'Something big is guarding the middle.' in source(pg,'story-data.js'),'locked thought line missing')
 check(ev(pg,'RPG.COMPANIONS.map(c=>c.tavern)')==[0,1,3],'companion placement changed')
 check(ev(pg,'SOTA.rpg.s6.WALL_ART_ROOMS')==28,'wall art on other rooms')
 check(ev(pg,'[MAZE.rooms.length,...["story","treasure","monster"].map(k=>MAZE.rooms.filter(r=>r.k===k).length)]')==[85,28,28,29],'85 room layout changed');b.close()
def t_door_flow(p):
 b,c,pg=S6.start(p);fixture(pg);ev(pg,'SOTA.rpg.live().party=preparedParty(RPG,"normal");SOTA.teleport(32,32,0);SOTA.rpg.s6.bossNote()');S6.drain(pg)
 check(ev(pg,'document.querySelector("[data-s6b=open]").disabled'),'final puzzle bypassed');check(ev(pg,'SOTA.rpg.s6.finalLock().pz.t')==1,'not existing lever type')
 ev(pg,'document.querySelector("[data-s6b=later]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))');pg.wait_for_timeout(300);tap(pg,'#s7door');S6.drain(pg)
 S6.unlock_centre(pg);check(ev(pg,'SOTA.rpg.live().story.finalLock'),'lock solve not stored');check(ev(pg,'SOTA.rooms().solved.length')==0,'final lock changed 85-room counts')
 ev(pg,'document.querySelector("[data-s6b=open]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))')
 check(ev(pg,'SOTA.rpg.ui()')=='fight' and not ev(pg,'SOTA.storyOpen()'),'Open did not start real fight')
 ev(pg,'SOTA.rpg.act("run")');check("Can't run!" in ev(pg,'SOTA.rpg.fight().log.join("|")'),'UI allowed run')
 # Win with a real attack, rather than direct ending/forceEnd: endFight must route boss victory to story.
 ev(pg,'SOTA.rpg.fight().m[0].hp=1;SOTA.rpg.act("attack")')
 if pg.locator('#s5lvlok').count():tap(pg,'#s5lvlok')
 tap(pg,'#fdone');S6.drain(pg);check(ev(pg,'SOTA.rpg.live().story.golemDefeated'),'boss victory not recorded')
 check(ev(pg,'document.getElementById("s6d").dataset.ending')=='low','victory did not play ending');check('later stage' not in pg.locator('#s6d').inner_text(),'placeholder ending footer remains');b.close()
def t_letter_readings(p):
 b,c,pg=S6.start(p);fixture(pg);ev(pg,'SOTA.rpg.live().party=preparedParty(RPG,"normal");SOTA.teleport(32,32,0)')
 K=ev(pg,'SOTA.rpg.s6.LETTER_KEYS');check(K['crack']==36 and K['picnic']==80 and K['wizard']==62 and K['council']==83 and len(K['z4'])==7,f'keys {K}')
 def setw(ids,bj=None):ev(pg,f'(()=>{{const s=SOTA.rpg.s6.st();s.walls={{}};{json.dumps(ids)}.forEach(i=>s.walls[i]=1);s.brunnJoin={json.dumps(bj)}}})()')
 def lines():return ev(pg,'SOTA.rpg.s6.letterLines()')
 def txt(L):return ' '.join(l[2] for l in L).lower()
 W='This is a warning. That thing guarding'
 setw([]);L=lines();check(ev(pg,'SOTA.rpg.s6.letterReading()')=='warning','warning reading')
 check([l[0] for l in L]==['Q','S','A'] and 'My team died to that' in L[2][2],f'warning lines {L}');check('dad' not in txt(L) and 'father' not in txt(L),'warning names dad')
 check(W not in txt(L),'opener 1 played with character lines')
 setw([36,60],'save');L=lines();check(ev(pg,'SOTA.rpg.s6.letterReading()')=='half','half reading')
 check('We end this.' in L[-1][2] and not any('My team walked' in l[2] for l in L),'row 8 xor 9 (save)');check('dad' not in txt(L) and 'father' not in txt(L),'half names dad')
 check(not any('Someone tried to stop' in l[2] for l in L),'opener 5 played with character lines')
 setw([37],'died');L=lines();check('My team walked into that order' in L[-1][2] and not any('We end this.' in l[2] for l in L),'row 9 xor 8 (died)')
 setw([36,37,46,38,50,80,62],'save');L=lines();check(ev(pg,'SOTA.rpg.s6.letterReading()')=='apology','apology reading')
 check('Your father built that golem' in L[-1][2] and not any('This was meant for you' in l[2] for l in L),f'apology lines {L}')
 setw([36,37,46,38,50,80],'save');check(ev(pg,'SOTA.rpg.s6.letterReading()')=='half','picnic alone made apology')
 # missing companion: drop Scholar, then all companions -> opener only
 ev(pg,'(()=>{const l=SOTA.rpg.live();window._pp=l.party.slice();l.party=l.party.slice(0,3)})()')
 setw([]);L=lines();gone=[k for k in 'QSA' if not ev(pg,f'!!SOTA.rpg.s6.who("{k}")')];check(len(gone)==1 and not any(l[0] in gone for l in L) and len(L)==2,f'missing companion still talks {gone} {L}')
 ev(pg,'(()=>{const l=SOTA.rpg.live();l.party=[l.party[0]]})()');L=lines();check(len(L)==1 and L[0][0]=='N' and W.lower() in txt(L),f'opener-only {L}')
 setw([36,37,46,38,50,80,83],'save');L=lines();check(L[0][2].startswith('This was meant for you'),'opener 10')
 ev(pg,'SOTA.rpg.live().party=window._pp');setw([],'died');ev(pg,'SOTA.rpg.s6.bossNote()')
 im=ev(pg,'document.querySelector("img.s6wall").getAttribute("src")');check(im=='art6/letter-note-before-you-enter.webp',f'pic {im}')
 check('scratched' not in ev(pg,'document.querySelector("#s6d").innerText'),'old iron door wording played');S6.drain(pg)
 check(ev(pg,'document.querySelectorAll("#s6d .s6btns button").length')==2,'door choices missing')
 src=open(os.path.join(ROOT,'story.js')).read();check('Turn back, or end it' not in src,'parchment wording typed into dialog');b.close()
def t_brunn_join_snapshot(p):
 b,c,pg=S6.start(p)
 for found,want in [(True,"save"),(False,"died")]:
  ev(pg,f'(()=>{{const s=SOTA.rpg.s6.st();delete s.brunnJoin;s.walls={{}};if({str(found).lower()})s.walls[36]=1;SOTA.rpg.s6.H.joined(RPG.makeCompanion(RPG.COMPANIONS[2],1),3)}})()')
  check(ev(pg,'SOTA.rpg.s6.st().brunnJoin')==want,f'join hook did not snapshot {want}');S6.drain(pg)
  ev(pg,'SOTA.rpg.s6.st().walls[36]=1')
  check(ev(pg,'SOTA.rpg.s6.brunnVer()')==want,'later crack changed join version')
 b.close()
def t_boss_defeat_restore(p):
 b,c,pg=S6.start(p);gold=ev(pg,'SOTA.rpg.save().gold');ev(pg,'SOTA.rpg.live().gold+=123;SOTA.rpg.live().story.finalLock=true;SOTA.rpg.startBoss();SOTA.rpg.live().party.forEach(c=>c.hp=1);SOTA.rpg.act("defend")')
 check(ev(pg,'SOTA.rpg.fight().over')=='lose','boss defeat broken');tap(pg,'#fdone');check(ev(pg,'SOTA.rpg.live().gold')==gold,'boss defeat kept progress');check(not ev(pg,'SOTA.storyOpen()'),'boss loss played ending');b.close()
def t_offline_boss(p):
 b,c=S6.ctx(p,sw=True);pg=c.new_page();pg.goto(S4.BASE+'index.html');pg.wait_for_function('navigator.serviceWorker.ready.then(()=>true)');pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg&&navigator.serviceWorker.controller')
 check(ev(pg,'caches.keys()')==['sota-s1-v22'],'offline cache not v22');c.set_offline(True);pg.reload();pg.wait_for_function('window.SOTA&&SOTA.rpg');create(pg);S6.drain(pg)
 ev(pg,'SOTA.rpg.s6.bossNote()');S6.drain(pg);S6.unlock_centre(pg);ev(pg,'document.querySelector("[data-s6b=open]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))')
 check(ev(pg,'SOTA.rpg.fight().m[0].n')=='Iron Golem','Golem unavailable offline');ev(pg,'SOTA.rpg.forceEnd("win")')
 if pg.locator('#s5lvlok').count():tap(pg,'#s5lvlok')
 tap(pg,'#fdone');S6.drain(pg);check(ev(pg,'SOTA.rpg.live().story.ending')=='low','offline ending unavailable');b.close()
def t_content_layout(p):
 for w,h in [(360,800),(390,844)]:
  b,c,pg=S6.start(p,w=w,h=h);ev(pg,'SOTA.rpg.s6.bossNote()');S6.drain(pg)
  r=ev(pg,'(()=>{const a=[...document.querySelectorAll("#s6d button")].map(e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom,r.height]});return a})()')
  check(all(x[0]>=0 and x[1]>=0 and x[2]<=w and x[3]<=h and x[4]>=44 for x in r),'final lock buttons clipped '+str(r));b.close()
def t_copy_cache_noads(p):
 b,pg=setup(p);s=source(pg,'game.js');ptxt=re.search(r'const PTXT=.*?;',s).group(0);check('later stage' not in ptxt and 'comes later' not in ptxt,'unfinished room copy')
 check('VER="22"' in source(pg,'sw.js'),'wrong offline cache')
 for name in ['rules.js','party.js','story.js','story-data.js','game.js','econ.js','sw.js','boot.js','index.html']:
  text=source(pg,name)
  for bad in ['http://','https://','XMLHttpRequest','sendBeacon','adsbygoogle','googletag','google-analytics']:check(bad not in text,'outside URL or ad code in '+name)
 check(not S4.ERRS,'browser errors '+str(S4.ERRS[:3]));check(all(u.startswith(S4.BASE) or u.startswith('data:') for u in S4.REQS),'outside request');b.close()
TESTS=[v for k,v in list(globals().items()) if k.startswith('t_') and (len(sys.argv)<3 or k in sys.argv[2].split(','))]
if __name__=='__main__':
 S4.BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/';ok=0;bad=[]
 with sync_playwright() as p:
  for t in TESTS:
   t0=time.time()
   try:t(p);ok+=1;print('PASS',t.__name__,f'{time.time()-t0:.1f}s',flush=True)
   except Exception as e:bad.append(t.__name__);print('FAIL',t.__name__,repr(e)[:400],flush=True)
 print(f'stage7: {ok} passed, {len(bad)} failed',bad);sys.exit(1 if bad else 0)
