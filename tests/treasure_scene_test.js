require('./t2103u_unpatch.js');
const a=require('assert/strict'),fs=require('fs'),vm=require('vm'),cp=require('child_process'),crypto=require('crypto');
const src=fs.readFileSync('party.js','utf8'),parent='9c8917d7f4bdc20c1f071bade9cfc50647b922bf';
for(const f of ['rules.js','game.js','story.js','story-data.js','maze-data.js','puzzles.js','puzzle-ui.js'])a.deepEqual(fs.readFileSync(f),cp.execFileSync('git',['show',parent+':'+f]));
a.match(fs.readFileSync('story.js','utf8'),/const WALL_ART_ROOMS=28;/);
a.equal(crypto.createHash('sha256').update(fs.readFileSync('art6/treasure-room.webp')).digest('hex'),'1ab3569e5693184c4f651306f00c2af4e1f61e8bbe6e9dcb9f035d6744688539');
function node(tag,cls,text){return {tag,cls,text,children:[],dataset:{},appendChild(n){this.children.push(n);}};}
for(const kind of ['gold','equipment','jewelry']){
 let page,closed=false;const c={el:node,head:t=>node('h2','',t),page:()=>page=node('div'),ov:{addEventListener(){},removeEventListener(){}},R:{ITEMS:{loot:{n:'Test loot',atk:1}},CLASSES:{}},addLoot:()=> 'Hero',tapBtn:(t,fn)=>Object.assign(node('button','',t),{fn}),closeUI:()=>closed=true};
 vm.runInNewContext(src.slice(src.indexOf('function treasurePanel('),src.indexOf('S.onRoomOpen='))+';globalThis.show=treasurePanel',c);
 c.show({kind,items:kind==='gold'?[]:['loot'],gold:kind==='gold'?5:0});
 a.equal(page.children[0].tag,'img');a.equal(page.children[0].src,'art6/treasure-room.webp');a.equal(page.children[1].text,'Treasure chest');a.equal(page.children.at(-1).text,'Continue');page.children.at(-1).fn();a.ok(closed);
}
const old={},now={};for(const [c,s] of [[old,cp.execFileSync('git',['show',parent+':sw.js'],{encoding:'utf8'})],[now,fs.readFileSync('sw.js','utf8')]]){c.self={addEventListener(){}};vm.runInNewContext(s+';globalThis.shell=SHELL;globalThis.ver=VER;',c);}
a.ok(['31','32','33'].includes(now.ver));a.deepEqual([...now.shell].filter(x=>!require('./t2103u_unpatch.js').SHELL.includes(x)).filter(x=>x!=='art6/treasure-room.webp'&&x!=='batch9-talks.js?v=1').map(x=>x.replace('party.js?v=18','party.js?v=17')),[...old.shell]);
console.log('treasure_scene_test: PASS (scenic panel, three loot kinds, Continue, locked flow/rules/art rooms, SHA, exact cache retention)');
