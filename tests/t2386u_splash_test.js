// t2386u: SlimeTrail logo splash is the first screen, waits for a tap, plays the logo sound, holds 2 s, fades, then the title flow.
const test=require('node:test'),a=require('node:assert'),fs=require('fs'),vm=require('node:vm'),crypto=require('crypto');
const read=f=>fs.readFileSync(f,'utf8'),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const IMG='art-intro/brand/logo3-neon-chosen-v1.jpg',SND='art-intro/brand/logo-sound-3-neon-glow.mp3';
test('brand files are the exact chosen logo and sound bytes',()=>{
 a.equal(sha(IMG),'66abe8d042db9d5883496066644a786306f60cde3032edd33e322178bcc482b3');
 a.equal(sha(SND),'50bec7765a5bb2206b9c6e9820e124b423fc89c1bf4153a1c138ec5dafc6877f');});
test('splash markup is the first thing in <body> and loads after intro.js',()=>{const h=read('index.html');
 const body=h.slice(h.indexOf('<body>')+6).trimStart();a.match(body,/^<div id="isplash"[^>]*>/);
 a.ok(body.includes('<img src="'+IMG+'"'));a.ok(body.includes('<audio preload="auto" src="'+SND+'">'));a.match(body,/class="isplash-tap">Tap to start</);
 const s=[...h.matchAll(/<script src="([^"?]+)\?v=(\d+)"/g)].map(m=>m[1]);a.ok(s.indexOf('splash.js')>s.indexOf('intro.js')&&s.indexOf('splash.js')>s.indexOf('party.js'));
 a.match(h,/#isplash img\{[^}]*object-fit:contain/);a.match(h,/#isplash\{[^}]*position:fixed;inset:0;z-index:100001;background:#000;overflow:hidden/);});
test('offline worker v81 precaches splash.js and both brand files once; pins match index.html',()=>{const sw=read('sw.js'),h=read('index.html');
 a.match(sw,/^const VER="94"/);for(const f of ['splash.js?v=1',IMG,SND,'music.js?v=20'])a.equal(sw.split('"'+f+'"').length-1,1,f);
 for(const m of h.matchAll(/<script src="([^"]+\?v=\d+)"/g))a.ok(sw.includes('"'+m[1]+'"'),m[1]);});
test('music.js plays nothing while the splash is open',()=>{a.match(read('music.js'),/function want\(\)\{\n if\(S\.splash&&S\.splash\.open\(\)\)return \[null,0,0\];/);});
function harness(){let now=0;const timers=[];const L={},W={};const cls=new Set();let played=0;
 const audio={currentTime:5,play(){played++;return Promise.resolve();},src:SND};
 const sp={hidden:false,classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c)},querySelector:q=>q==='audio'?audio:null,addEventListener:(t,f)=>{L[t]=f;}};
 const booted=[];const win={SOTA:{},SOTA_INTRO_BOOT:()=>booted.push(now),addEventListener:(t,f)=>{W[t]=f;}};
 const c={window:win,document:{getElementById:id=>id==='isplash'?sp:null,documentElement:{classList:{add(){},remove(){}}}},performance:{now:()=>now},
  setTimeout:(f,ms)=>timers.push([now+ms,f]),addEventListener:win.addEventListener};
 vm.createContext(c);vm.runInContext(read('splash.js'),c);
 const adv=ms=>{const end=now+ms;for(;;){timers.sort((x,y)=>x[0]-y[0]);if(!timers.length||timers[0][0]>end)break;const [t,f]=timers.shift();now=t;f();}now=end;};
 const ev={preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}};
 return {S:win.SOTA,sp,audio,booted,adv,tap:()=>L.pointerup(ev),key:k=>W.keydown({...ev,key:k}),played:()=>played,boot:()=>win.SOTA_INTRO_BOOT(),now:()=>now};}
test('nothing proceeds without a tap; tap plays the sound, holds 2 s, fades, then runs the title boot',()=>{const h=harness();
 h.boot();h.adv(60000);a.equal(h.S.splash.state(),'wait');a.deepEqual(h.booted,[]);a.equal(h.played(),0);h.key('ArrowUp');a.equal(h.S.splash.state(),'wait');
 h.tap();a.equal(h.S.splash.state(),'show');a.equal(h.played(),1);a.equal(h.audio.currentTime,0);h.tap();a.equal(h.played(),1,'second tap replays');
 h.adv(1999);a.equal(h.S.splash.state(),'show');a.deepEqual(h.booted,[]);h.adv(1);a.equal(h.S.splash.state(),'fade');a.ok(h.sp.classList.contains('out'));
 a.deepEqual(h.booted,[62000]);a.ok(h.S.splash.open());h.adv(h.S.splash.FADE_MS);a.equal(h.S.splash.state(),'done');a.ok(h.sp.hidden);a.ok(!h.S.splash.open());});
test('Enter key also starts the splash; boot asked for later still runs once',()=>{const h=harness();h.key('Enter');a.equal(h.S.splash.state(),'show');h.adv(2500);a.deepEqual(h.booted,[]);h.boot();h.boot();a.equal(h.booted.length,1);});
