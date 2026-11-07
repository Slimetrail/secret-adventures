const a=require('assert'),fs=require('fs'),cp=require('child_process'),vm=require('vm');
const art=require('../dialogue-art.js'),data=require('../dialogue-art-data.js'),B1=require('../batch1-talks.js'),preview=require('../dialogue-view.js');
const manifest=JSON.parse(fs.readFileSync('/workspace/secret-adventures/game-export/t2076u-dialogue-art/manifest.json'));
const parse=s=>[...s.matchAll(/^(Mira|Sorrel|Brunn): "(.*)"$/gm)].map(m=>[m[1],m[2]]);
const source={};fs.readFileSync('/workspace/dialogue-team/dialogue-view-sample-t2065u.md','utf8').split(/^## \d\. /m).slice(1).forEach((s,i)=>source[preview.ORDER[i]]=parse(s));
fs.readFileSync('/workspace/dialogue-team/camp-and-afterfight-batch1.md','utf8').split(/^### /m).slice(1).forEach(s=>source[s.split('.')[0]]=parse(s));
a.equal(data.length,58);a.equal(Object.keys(source).length,15);const assets=new Set(),variants=[];
for(const l of data){
 const original=manifest.lines.find(x=>x.talkId===l.talkId&&x.line===l.line);for(const k of Object.keys(original).filter(k=>k in l))a.deepStrictEqual(l[k],original[k]);
 const i=l.line-1;a.deepStrictEqual([l.speaker,l.lineText],source[l.talkId][i]);a.strictEqual(art.frame(l.talkId,i,l.lineText),l);a.equal(art.frame(l.talkId,i,'wrong words'),null);
 a.equal(l.left,l.portraits.mira?'mira':'sorrel');a.equal(l.right,l.portraits.brunn?'brunn':'sorrel');a.equal(Object.keys(l.portraits).length,2);
 const expected=['closecall:3','C5:4','A6:4'].includes(l.talkId+':'+l.line)?l.talkId+'/backdrop-l'+l.line+'.webp':l.talkId+'/backdrop.webp';a.equal(l.backdrop,expected);if(expected.includes('backdrop-l'))variants.push(expected);
 for(const p of [...Object.values(l.portraits),l.backdrop]){assets.add(p);a.ok(fs.readFileSync('art-dialogue/'+p).equals(fs.readFileSync('/workspace/secret-adventures/game-export/t2076u-dialogue-art/'+p)));}
 for(const t of Object.values(l.crops)){a.ok(t[0]>=0&&t[2]<=1024&&t[1]>=0&&t[3]<=1536&&t[2]>t[0]&&t[3]>t[1]);}
}
a.equal(variants.length,3);a.equal(assets.size,134);
for(const t of B1.TALKS)a.equal(art.sceneOptions(t,{test:true}).bg,'art-dialogue/'+t.id+'/backdrop.webp');
for(const batch of [require('../batch2-talks.js'),require('../batch3-talks.js')])for(const t of batch.TALKS){const opt={bg:null};a.strictEqual(art.sceneOptions(t,opt),opt);a.equal(art.frame(t.id,0),undefined);}
const sw={self:{addEventListener(){}},Request(){}};vm.runInNewContext(fs.readFileSync('sw.js','utf8')+';globalThis.shell=SHELL;globalThis.version=VER;',sw);a.equal(sw.version,'27');for(const p of assets)a.ok(sw.shell.includes('art-dialogue/'+p));
for(const p of ['dialogue-art.js?v=1','dialogue-art-data.js?v=1','batch1-talks.js?v=3','dialogue-view.js?v=2'])a.ok(sw.shell.includes(p));
const parent='12ad96c7df683fb344c3a01910587637803d2688';const old=f=>cp.execFileSync('git',['show',parent+':'+f],{encoding:'utf8'});
for(const f of ['story.js','story-data.js','music.js','party.js','batch2-talks.js','batch3-talks.js'])a.equal(fs.readFileSync(f,'utf8'),old(f),f);
// Limit the two approved integration edits to calls only: all words/gates remain original.
a.equal(fs.readFileSync('batch1-talks.js','utf8').replace('const visual=root.DialogueArt;const options=opt||{bg:null};\n  api.play(context,t.lines,visual?visual.sceneOptions(t,options):options);','api.play(context,t.lines,opt||{bg:null});'),old('batch1-talks.js'));
a.equal(fs.readFileSync('dialogue-view.js','utf8').replace('if(window.DialogueArt)window.DialogueArt.clear(ov);','').replace('if(window.DialogueArt)window.DialogueArt.clear(ov);','').replace('\nif(window.DialogueArt)window.DialogueArt.render(ov,k,i,l[1]);',''),old('dialogue-view.js'));
console.log('dialogue_art_test: 15 talks / 58 exact line mappings, fixed sides, 3 variants, 134 byte-identical cached assets, no later-batch art, exact integration-only edits and locked files: PASS');
