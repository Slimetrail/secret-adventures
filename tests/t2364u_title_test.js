"use strict";
// Jeremy t2364u: the game is "Secret of the Adventure" (singular). No served file except STAGE*.md may carry the old plural
// name in any letter case. Save keys stay the same so old saves still load. Repo name/URL are not part of this.
const test = require("node:test"), a = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), cp = require("node:child_process");
const root = path.join(__dirname, "..");
const OLD = new RegExp("of\\s+the\\s+" + "adventure" + "s", "i"); // built in parts so this file does not match itself
// served = what would ship: tracked files plus new files git would add (ignored caches such as __pycache__ never ship)
function walk(d) { return cp.execFileSync("git", ["ls-files", "-co", "--exclude-standard"], {cwd: d, encoding: "utf8"}).split("\n").filter(Boolean).map(f => path.join(d, f)).filter(f => fs.existsSync(f)); }
test("no served file except STAGE*.md has the old plural title, in any case", () => {
 const bad = [];
 for (const f of walk(root)) { const rel = path.relative(root, f); if (/^STAGE[^/]*\.md$/.test(path.basename(rel))) continue; const t = fs.readFileSync(f).toString("latin1"); if (OLD.test(t)) bad.push(rel); }
 a.deepEqual(bad, []);
});
test("title, manifest and menu text say Secret of the Adventure", () => {
 a.match(fs.readFileSync(path.join(root, "index.html"), "utf8"), /<title>Secret of the Adventure<\/title>/);
 const m = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8")); a.equal(m.name, "Secret of the Adventure"); a.ok(!/adventures/i.test(m.short_name));
 a.match(fs.readFileSync(path.join(root, "intro.js"), "utf8"), /const TITLE="Secret of the Adventure",/);
});
test("save storage keys did not change", () => {
 const p = fs.readFileSync(path.join(root, "party.js"), "utf8");
 a.match(p, /const SAVE="sota\.party"/); a.match(p, /SLOT=SAVE\+"\.slot",ACTIVE=SAVE\+"\.active"/);
});
