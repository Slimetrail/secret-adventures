// t2574u: maze compass pins, and loadCompass must not throw in the node harness (no Image).
const test=require('node:test'),a=require('node:assert'),fs=require('fs');
const read=f=>fs.readFileSync(f,'utf8');
const WAIT='Please wait for update to continue.';
test('t2574u pins: VER 97, game.js?v=25, compass art in the shell, wait wording unchanged',()=>{
 const h=read('index.html'),s=read('sw.js'),g=read('game.js');
 a.match(s,/^const VER="103",/);
 for(const p of ['game.js?v=25','art6/hud/compass-rose-48.png','art6/hud/compass-rose-144.png']){
  a.ok(s.includes('"'+p+'"')||s.includes(p), 'sw missing '+p);
 }
 a.ok(h.includes('game.js?v=25'));
 a.ok(h.includes('id="cmp"'));
 a.ok(h.includes('aria-label="Compass. Tap to show or hide location info"'));
 a.ok(!h.includes('>i</button>'),'old i label still in the button');
 a.ok(g.includes('function loadCompass()'));
 a.ok(g.includes('function updCompass()'));
 a.equal((h+s+g).includes(WAIT),true);
 a.equal(g.includes(WAIT)||read('party.js').includes('const WAIT_UPDATE="'+WAIT+'";'),true);
});
test('loadCompass does not throw in the node harness (no Image, stub #cmp has no dataset)',()=>{
 const g=read('game.js');
 a.ok(g.includes('typeof Image==="undefined"'),'need an Image guard for the node harness');
 a.ok(g.includes('!cmpEl.dataset'),'stub elements have no dataset');
 a.ok(g.indexOf('typeof Image==="undefined"')<g.indexOf('new Image()'),'guard must run before new Image()');
});
