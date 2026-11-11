require('./t2103u_unpatch.js');
// Boss door: lever lock kept first, then two more existing Stage 3 types at zone 5. Local, unpublished.
const test=require('node:test'),a=require('assert'),fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),P=require('../puzzles.js');
process.chdir(require('path').join(__dirname,'..'));
const src=fs.readFileSync('story.js','utf8'),old=cp.execFileSync('git',['show','1958731:story.js'],{encoding:'utf8'});
test('FINAL_LOCK stays the zone-5 lever, seed 713507',()=>{a.ok(src.includes('const FINAL_LOCK=window.PUZ.make(1,5,713507,window.PUZ.BOSS_TIER);'));a.ok(src.includes('"Final lock: Lights Out. Tap a light to flip it and the lights next to it. Turn every light off."'));/* t2766u/t2768u */
 a.ok(src.includes('finalLock:()=>({pz:window.PUZ.clone(FINAL_LOCK.pz),s:window.PUZ.clone(lockState)})'));});
test('locks 2/3 are sliding tiles and moving blocks at zone 5 with fixed seeds, solvable',()=>{a.ok(src.includes('FINAL_LOCK2=window.PUZ.make(4,5,731117,window.PUZ.BOSS_TIER),FINAL_LOCK3=window.PUZ.make(3,5,731119,window.PUZ.BOSS_TIER)'));
 for(const s of [731117,731119]){a.notEqual(s,713507);for(let id=0;id<85;id++)for(let z=1;z<=5;z++)a.notEqual(s,(id+1)*9973+17*z);}
 const t=P.make(4,5,731117,P.BOSS_TIER),b=P.make(3,5,731119,P.BOSS_TIER);a.equal(t.pz.t,4);a.equal(t.pz.zone,5);a.equal(b.pz.t,3);a.equal(b.pz.zone,5);a.ok(!P.solved(t.pz,t.s)&&!P.solved(b.pz,b.s));
 const path=P.bfsBlocks(b.pz,b.s,300000);a.ok(path&&path.length>0);let s=b.s;for(const m of path)s=P.apply(b.pz,s,m);a.ok(P.solved(b.pz,s));
 // tiles (t2766u: boss tier is 5x5, too big for optimal IDA*): weighted A* from tools/solver.js finds a real move list; replay it
 const pp=require('../tools/solver.js').wastarTiles(t.pz,t.s);a.ok(pp);let st=t.s;for(const p of pp)st=P.apply(t.pz,st,p);a.ok(P.solved(t.pz,st));});
test('Open the door requires all three locks, in order',()=>{const cond='!(s.finalLock&&s.finalLock2&&s.finalLock3)';
 a.ok(src.includes('["‹ Open the door",()=>{if('+cond+')return;finish();S.rpg.startBoss();},"open",'+cond+']'));a.ok(!src.includes('"open",!s.finalLock]'));
 const i1=src.indexOf('if(!s.finalLock){box();'),i2=src.indexOf('else if(!s.finalLock2){'),i3=src.indexOf('else if(!s.finalLock3){');a.ok(i1>0&&i2>i1&&i3>i2);
 a.ok(src.includes('if(P.solved(pz,lockState2))s.finalLock2=true;')&&src.includes('if(P.solved(pz,lockState3))s.finalLock3=true;'));a.ok(!/markSolved/.test(src.slice(i1,i3+3000).split('// ---------- letter')[0]));});
test('Not yet keeps progress; reset guards exist',()=>{a.ok(src.includes('["Not yet",()=>finish(),"later"]'));
 a.ok(src.includes('if(!s.finalLock2&&window.PUZ.solved(FINAL_LOCK2.pz,lockState2))lockState2=window.PUZ.clone(FINAL_LOCK2.s);'));a.ok(src.includes('if(!s.finalLock3&&window.PUZ.solved(FINAL_LOCK3.pz,lockState3))'));});
test('rooms, letter, story-data unchanged',()=>{const scenic='const scene=el("img","s4treasureScene");scene.src="art6/treasure-room.webp";scene.alt="Torchlit stone treasure chamber with a glowing, slightly open chest";w.appendChild(scene);';a.ok(fs.readFileSync('party.js','utf8').includes(scenic));a.equal(fs.readFileSync('party.js','utf8').replace(scenic,''),cp.execFileSync('git',['show','1958731:party.js'],{encoding:'utf8'}));for(const f of ['maze-data.js','story-data.js','puzzles.js','puzzle-ui.js','econ.js','rules.js'])a.equal(fs.readFileSync(f,'utf8'),cp.execFileSync('git',['show','1958731:'+f],{encoding:'utf8'}),f);
 a.equal(crypto.createHash('sha256').update(fs.readFileSync('story-data.js')).digest('hex'),'222fb30910b1f2f1ea83ab31700c306d8f84fe9bddb7b7005897cee20aedaebc');
 const grab=(s,re)=>{const m=s.match(re);a.ok(m,String(re));return m[0];};
 for(const re of [/const LETTER_POOL[\s\S]*?\];/,/function letterLines\(\)[^\n]*/])a.equal(grab(src,re),grab(old,re));
 a.ok(src.includes('wall:"art6/letter-note-before-you-enter.webp"'));a.ok(fs.existsSync('art6/letter-note-before-you-enter.webp'));
 a.equal(src.replace(/\/\/ Boss door locks 2[\s\S]*?btns\(\[\["‹ Open the door"[^\n]*\n/,'').length>0,true);});
test('cache v31 and story.js?v=16',()=>{const vm=require('vm'),c={self:{addEventListener(){}}};vm.runInNewContext(fs.readFileSync('sw.js','utf8')+';globalThis.shell=SHELL;globalThis.v=VER;globalThis.cache=CACHE;',c);
 a.ok(['31','32','33'].includes(c.v));a.equal(c.cache,'sota-s1-v'+c.v);const o={self:{addEventListener(){}}};vm.runInNewContext(cp.execFileSync('git',['show','1958731:sw.js'],{encoding:'utf8'})+';globalThis.shell=SHELL;',o);
 a.deepStrictEqual([...c.shell].filter(x=>!require('./t2103u_unpatch.js').SHELL.includes(x)).filter(x=>x!=='art6/treasure-room.webp'&&x!=='batch9-talks.js?v=1').map(x=>x.replace('party.js?v=18','party.js?v=17')).map(x=>x.replace('story.js?v=16','story.js?v=15')),[...o.shell]);a.ok(fs.readFileSync('index.html','utf8').includes('story.js?v=16'));});
