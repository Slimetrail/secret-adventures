const a=require('assert'),fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),vm=require('vm');
const D=require('../companion-display.js');
a.equal(D.rewrite('Hero',null),'Hero');
const ctx=r=>({party:[{name:'Rowan',race:r}]});
for(const race of ['cat','elf','dwarf','human']){
 const c=ctx(race);
 a.equal(D.displayName('Mira',c),race==='cat'?'Alden':'Mira');
 a.equal(D.displayName('Sorrel',c),race==='elf'?'Alden':'Sorrel');
 a.equal(D.displayName('Brunn',c),'Brunn');
 a.equal(D.rewrite('Sorrel said he lost his staff. Sorrel helped him.',c),race==='elf'?'Alden said he lost his staff. Alden helped him.':'Sorrel said she lost her staff. Sorrel helped her.');
 a.equal(D.rewrite('Mira said she lost her staff. Mira helped her.',c),race==='cat'?'Alden said he lost his staff. Alden helped him.':'Mira said she lost her staff. Mira helped her.');
 a.equal(D.rewrite('Sorrel said she helped herself.',c),race==='elf'?'Alden said he helped himself.':'Sorrel said she helped herself.');
 a.equal(D.rewrite("Hero's bag belongs to {H}. I am a hero.",c),"Rowan's bag belongs to Rowan. I am a hero.");
 a.equal(D.rewrite('Mira told Sorrel he was ready.',c),race==='cat'?'Alden told Sorrel he was ready.':race==='elf'?'Mira told Alden he was ready.':'Mira told Sorrel he was ready.');
}
a.equal(D.rewrite('Hero is here.',{party:[{name:'Hero',race:'human'}]}),'Hero is here.');
a.equal(D.rewrite('Hero and {H}',{party:[{name:'$&',race:'human'}]}),'$& and $&');
a.ok(fs.readFileSync('party.js','utf8').includes('const cc={name:"Hero"'));
a.equal(crypto.createHash('sha256').update(fs.readFileSync('story-data.js')).digest('hex'),'222fb30910b1f2f1ea83ab31700c306d8f84fe9bddb7b7005897cee20aedaebc');
const base='56e4d41b287862faa2f93da5e9e2fb55eba697bf';
for(const f of ['story-data.js',...Array.from({length:7},(_,i)=>`batch${i+1}-talks.js`)])a.deepStrictEqual(fs.readFileSync(f),cp.execFileSync('git',['show',base+':'+f]));
// All long literal text (including intro, picnic and endings) remains verbatim.
const old=cp.execFileSync('git',['show',base+':story.js'],{encoding:'utf8'}),now=fs.readFileSync('story.js','utf8');
for(const m of old.matchAll(/"(?:[^"\\]|\\.)*"/g))if(m[0].length>=40)a.ok(now.includes(m[0]),m[0]);
const sw={self:{addEventListener(){}}};vm.runInNewContext(fs.readFileSync('sw.js','utf8')+';globalThis.shell=SHELL;globalThis.ver=VER;',sw);
a.ok(Number(sw.ver)>=29);for(const f of ['companion-display.js?v=1','party.js?v=17','story.js?v=15','dialogue-view.js?v=3','batch7-talks.js?v=1','batch8-talks.js?v=1'])a.ok(sw.shell.includes(f));
const prior={self:{addEventListener(){}}};vm.runInNewContext(cp.execFileSync('git',['show',base+':sw.js'],{encoding:'utf8'})+';globalThis.shell=SHELL;',prior);
for(const f of prior.shell)a.ok(sw.shell.includes(f.replace('party.js?v=16','party.js?v=17').replace('story.js?v=14','story.js?v=15').replace('dialogue-view.js?v=2','dialogue-view.js?v=3')),f);
console.log('alden_swap_test: PASS (four races, Hero, ambiguity guards, immutable sources, cache)');
