/* Display-only identity adapter. Saved names, roles, source dialogue and race rules stay intact. */
(function(root){"use strict";
const defs=[{name:"Mira",role:"quirky",code:"Q",race:"cat"},{name:"Sorrel",role:"scholar",code:"S",race:"elf"},{name:"Brunn",role:"angry",code:"A",race:"dwarf"}];
function context(ctx){if(ctx)return ctx;const s=root.SOTA;return (s&&s.rpg&&s.rpg.live?s.rpg.live():null)||{party:[]};}
function heroRace(ctx){ctx=context(ctx);return typeof ctx==="string"?ctx:(ctx.party||ctx)[0]?.race;}
function identity(c){return defs.find(d=>typeof c==="string"?[d.name,d.role,d.code].includes(c):c&&(c.role===d.role||c.companion&&c.name===d.name));}
function displayName(c,ctx){const d=identity(c);if(!d)return typeof c==="string"?c:c?.name||"";return d.name!=="Brunn"&&heroRace(ctx)===d.race?"Alden":d.name;}
function male(d,ctx){return d.name==="Brunn"||heroRace(ctx)===d.race;}
function rewrite(text,ctx){if(typeof text!=="string")return text;ctx=context(ctx);
// A sentence with exactly one named companion anchors pronouns. Never carry a
// referent across sentences or flip ambiguous multi-companion / other-person text.
return text.replace(/[^.!?\n]+[.!?]?/g,s=>{const named=defs.filter(d=>new RegExp("\\b"+d.name+"\\b","i").test(s)||(displayName(d.name,ctx)==="Alden"&&/\bAlden\b/i.test(s)));
if(named.length===1&&!/\b(Dad|father|mother|hero|man|woman|boy|girl)\b/i.test(s)){
const isMale=male(named[0],ctx);
s=s.replace(/\b(herself|himself|hers|his|she|he|her|him)\b/gi,(p,_capture,offset,whole)=>{const low=p.toLowerCase(),rest=whole.slice(offset+p.length),next=(rest.match(/^\s+([a-z]+)/i)||[])[1];
// Next word is a noun-like token unless a verb/preposition/conjunction. This
// deliberately conservative heuristic cannot parse arbitrary English grammar.
const possess=!!next&&!/^(is|was|were|are|has|had|will|would|can|could|did|does|and|or|but|to|for|with|at|in|on|from|before|after|than|too|again)$/i.test(next);
let out=isMale?({she:"he",her:possess?"his":"him",hers:"his",herself:"himself"}[low]||low):({he:"she",him:"her",his:possess?"her":"hers",himself:"herself"}[low]||low);
return p[0]===p[0].toUpperCase()?out[0].toUpperCase()+out.slice(1):out;});}
return s.replace(/\b(Mira|Sorrel|Brunn)\b/g,n=>displayName(n,ctx));});}
const companionRewrite=rewrite;
function playerName(ctx){ctx=context(ctx);return typeof ctx==="string"?"Hero":(ctx.party||ctx)[0]?.name||"Hero";}
function rewriteAll(text,ctx){const out=companionRewrite(text,ctx);return typeof out==="string"?out.replace(/\{H\}|\bHero\b/g,()=>playerName(ctx)):out;}
const api={displayName,rewrite:rewriteAll};root.CompanionDisplay=api;if(typeof module!=="undefined")module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
