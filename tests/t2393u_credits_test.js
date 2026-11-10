// t2393u/t2394u: end-game review first, credits on their own screen with the exact lines, faith badge, offline pins.
const test=require('node:test'),a=require('node:assert'),fs=require('fs'),crypto=require('crypto');
const read=f=>fs.readFileSync(f,'utf8'),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const BADGE='art-intro/brand/faith-badge-matthew-5-13-16.jpg';
test('faith badge is the exact chosen bytes and is cached offline once',()=>{a.equal(sha(BADGE),'fb945115ae5b66a7a418c4c8b158d6d5b95988cef7c67c89613b85e1aad1a94d');
 const sw=read('sw.js');a.equal(sw.split('"'+BADGE+'"').length-1,1);for(const p of ['story.js?v=25','intro.js?v=19','music.js?v=20']){a.ok(sw.includes('"'+p+'"'),p);a.ok(read('index.html').includes(p),p);}});
test('credit lines are exactly Credits, title, Music/Art/Game Design: SlimeTrail Production, Thank you for playing.',()=>{const js=read('intro.js');
 a.ok(js.includes('const CREDIT_LINES=["Music: SlimeTrail Production","Art: SlimeTrail Production","Game Design: SlimeTrail Production"];'));
 const body=js.slice(js.indexOf('function credits(b){'),js.indexOf('function dropBadge('));
 const order=['"icred-h","Credits"','"icred-t",TITLE','for(const l of CREDIT_LINES)','"icred-l","Thank you for playing."'].map(x=>body.indexOf(x));
 a.ok(order.every(i=>i>=0)&&order.every((v,i)=>!i||v>order[i-1]),String(order));a.ok(!js.includes('A Slimetrail production'));a.match(js,/const TITLE="Secret of the Adventure"/);});
test('review screen offers only Continue; credits screen keeps Back to the maze',()=>{const s=read('story.js');
 a.ok(s.includes('box.dataset.endScreen="review";btns([["Continue",credits,"continue"]]);'));
 a.ok(s.includes('box.dataset.endScreen="credits";\n  if(window.SOTA_ENDING_CREDITS)window.SOTA_ENDING_CREDITS(box);btns([["Back to the maze",()=>finish(),"back"]]);'));
 a.ok(s.includes('delete box.dataset.endScreen;'));a.ok(!read('intro.js').includes('if(t&&!b.querySelector(".icred"))credits(b)'));});
test('badge space is reserved below the credits box (text box ends above the badge band)',()=>{const js=read('intro.js');
 a.match(js,/#s6d\[data-end-screen=credits\] \.s6box\{[^}]*bottom:calc\(var\(--bdg\) \+ 24px \+ env\(safe-area-inset-bottom\)\)/);
 a.match(js,/\.icred-badge\{position:absolute;[^}]*bottom:calc\(10px \+ env\(safe-area-inset-bottom\)\);width:var\(--bdg\);height:var\(--bdg\)/);});
