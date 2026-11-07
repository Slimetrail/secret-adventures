const fs=require("fs"),path=require("path"),assert=require("assert");
const {TALKS,ORDER}=require("../dialogue-view.js");
const src=fs.readFileSync("/workspace/dialogue-team/dialogue-view-sample-t2065u.md","utf8");
const secs=src.split(/^## \d\. /m).slice(1);
assert.strictEqual(secs.length,3);
secs.forEach((s,i)=>{const t=TALKS[ORDER[i]];assert.strictEqual(s.split("\n")[0].trim(),t.title);
const lines=[...s.matchAll(/^(\w+): "(.*)"$/gm)].map(m=>[m[1],m[2]]);
assert.deepStrictEqual(t.lines,lines);assert.ok(new Set(lines.map(l=>l[0])).size<=2);});
console.log("dialogue_view_test: 3 talks match source exactly, <=2 speakers each: OK");
