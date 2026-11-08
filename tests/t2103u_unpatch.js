// t2103u: older lock tests compare music.js / party.js byte-for-byte with earlier commits.
// The only approved t2103u edits are listed here; reading those files through this shim removes exactly
// those edits, and throws if anything else in the file changed. t2103u_test.js checks the edits themselves.
const fs=require('fs'),path=require('path');
const EDITS={
 'music.js':[[' if(S.intro&&S.intro.titleOpen())return ["title_intro",1500,1500];   // t2103u title-only menu\n if(S.intro&&S.intro.caveOpen())return ["sick_father",0,0];          // t2103u cave card keeps the opening cue, then dissolves into the maze\n','']],
 'party.js':[['if(localStorage.getItem(DEV_NOFIGHT)!=="1"){const boot=()=>{if(window.SOTA_INTRO_BOOT)window.SOTA_INTRO_BOOT();else if(!live)creation();};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();}/* t2103u: intro.js shows the title-only menu first */','if(!live&&localStorage.getItem(DEV_NOFIGHT)!=="1")creation();'],
  ['live:()=>live,save:()=>save,closeUI,','live:()=>live,save:()=>save,']]};
function unpatch(name,buf){const e=EDITS[name];if(!e)return buf;let s=buf.toString('utf8');
 for(const [now,was] of e){if(s.split(now).length!==2)throw new Error('t2103u edit missing or repeated in '+name);s=s.replace(now,()=>was);}return Buffer.from(s,'utf8');}
const orig=fs.readFileSync;
fs.readFileSync=function(f,o){const r=orig.apply(fs,arguments);const n=typeof f==='string'?path.relative(path.join(__dirname,'..'),path.resolve(f)):null;
 if(n&&EDITS[n]){const b=unpatch(n,Buffer.isBuffer(r)?r:Buffer.from(r,'utf8'));return Buffer.isBuffer(r)?b:b.toString(typeof o==='string'?o:(o&&o.encoding)||'utf8');}return r;};
const SHELL=['intro-art-data.js?v=1','t2103u-text.js?v=1','intro.js?v=1','music.js?v=15'];
// the 51 delivered art-intro WebPs are t2103u additions too (art-intro/menu/title.webp is intentionally not shipped)
const ART=[];(function walk(d){for(const e of fs.readdirSync(path.join(__dirname,'..',d),{withFileTypes:true}))e.isDirectory()?walk(d+'/'+e.name):e.name.endsWith('.webp')&&ART.push(d+'/'+e.name);})('art-intro');
for(const p of ART.sort())if(p!=='art-intro/menu/title.webp')SHELL.push(p);
module.exports={EDITS,unpatch,SHELL};

// Starter portraits are an explicit t2118u exception; verify bytes against the read-only delivery.
function deliveredPortrait(f){
 if(!/^art6\/fight\/p-(?:human-(?:warrior|mage|archer|rogue)|elf-(?:warrior|mage|archer|rogue)|dwarf-(?:warrior|archer|rogue)|cat-(?:warrior|mage|rogue))\.png$/.test(f))return false;
 require('assert').deepStrictEqual(orig(f),orig('/workspace/secret-adventures/game-export/t2118u-hero/fight/'+path.basename(f)),f+' delivery bytes');return true;
}
module.exports.deliveredPortrait=deliveredPortrait;
