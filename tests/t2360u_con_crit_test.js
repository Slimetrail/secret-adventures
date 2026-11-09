"use strict";
// Jeremy t2360u: CON drives max HP and defense; STA is the rogue/archer attack stat and gives them crits.
const test = require("node:test");
const a = require("node:assert/strict");
const R = require("../rules.js");
const mk = (cls, race = "human", alloc = {}) => R.newChar("T", race, cls, alloc, R.SKILLS[cls][0].id);

test("every race has a CON base and new heroes carry 4 stats", () => {
 for (const [k, r] of Object.entries(R.RACES)) { a.ok(Number.isInteger(r.base.con) && r.base.con > 0, k); a.equal(r.base.con, r.base.sta, k + " CON base = old STA base"); }
 const c = mk("warrior", "human", {con: 2}); a.deepEqual(Object.keys(c.stats).sort(), ["con", "man", "sta", "str"]); a.equal(c.stats.con, 7);
 a.equal(c.spent, R.spendCost(5, 7), "CON uses the same point costs");
});
test("CON raises max HP (4 per point) and defense (0.6 per point); STA no longer does", () => {
 for (const cls of ["warrior", "rogue", "archer", "mage"]) {
  const c = mk(cls), hp = R.maxHp(c, 1), df = R.defense(c);
  c.stats.con++; a.equal(R.maxHp(c, 1) - hp, 4, cls); a.ok(Math.abs(R.defense(c) - df - 0.6) < 1e-9, cls);
  const hp2 = R.maxHp(c, 1), df2 = R.defense(c); c.stats.sta += 5; a.equal(R.maxHp(c, 1), hp2, cls + " STA moved HP"); a.equal(R.defense(c), df2, cls + " STA moved DEF");
  const h3 = R.maxHp(c, 1); c.stats.str++; a.equal(R.maxHp(c, 1) - h3, 3, "STR still 3 HP");
 }
});
test("raise() spends points on CON like any stat", () => {
 const c = mk("warrior"); c.lvl = 3; const left = R.pointsEarned(3) - c.spent, p = R.cost(c.stats.con);
 a.equal(R.raise(c, "con"), true); a.equal(c.stats.con, 6); a.equal(R.pointsEarned(3) - c.spent, left - p);
});
test("STA still drives rogue/archer power with the same formula; dwarf non-magic mana still from STA", () => {
 const c = mk("rogue"), p = R.power(c); c.stats.sta++; a.ok(Math.abs(R.power(c) - p - 2.2) < 1e-9);
 const d = mk("warrior", "dwarf"), m = R.maxMp(d); d.stats.sta++; a.equal(R.maxMp(d) - m, 2);
 const f = mk("rogue"), p0 = R.power(f); f.buff = {str: 0, sta: 0.2, f: 2}; a.ok(R.power(f) > p0, "stamina-buff food still raises power");
});
test("crit chance: rogue/archer min(0.30, 0.03+0.01*STA); warrior and mage none", () => {
 for (const cls of ["rogue", "archer"]) { const c = mk(cls); for (const s of [0, 5, 10, 27, 40]) { c.stats.sta = s; a.ok(Math.abs(R.critChance(c) - Math.min(0.30, 0.03 + 0.01 * s)) < 1e-12); } }
 for (const cls of ["warrior", "mage"]) { const c = mk(cls); c.stats.sta = 30; a.equal(R.critChance(c), 0); }
 a.equal(R.CRIT_MUL, 1.75);
});
function swings(cls, sta, n) {
 const c = mk(cls); c.stats.sta = sta; let crits = 0, ok = true; const base = R.power(c);
 for (let i = 0; i < n; i++) {
  const m = R.makeMonster(1, 0, 1, 0, "normal"); m.hp = m.max = 1e9; m.def = 0;
  const f = new R.Fight([c], [m], "normal", 1000 + i), rr = R.rng ? null : null;
  // same main roll as the fight engine: replay it from the same seed to know the plain hit
  const t = f.act(0, "attack", null, 0), dmg = 1e9 - m.hp;
  const plain = Math.max(1, Math.round(base * (0.85 + 0.3 * mainRoll(1000 + i))));
  if (/Critical hit!/.test(t)) { crits++; if (dmg !== Math.round(plain * 1.75)) ok = false; } else if (dmg !== plain) ok = false;
 }
 return {rate: crits / n, ok};
}
function mainRoll(seed) { const f = new R.Fight([], [], "normal", seed); return f.r(); }
test("seeded: rogue/archer crit at about the right rate and at exactly 1.75x; warrior/mage never", () => {
 for (const [cls, sta, want] of [["rogue", 8, 0.11], ["archer", 15, 0.18], ["rogue", 40, 0.30]]) {
  const r = swings(cls, sta, 4000); console.log(`${cls} STA ${sta}: crit rate ${(r.rate * 100).toFixed(1)}% (want ${want * 100}%)`);
  a.ok(Math.abs(r.rate - want) < 0.02, `${cls} rate ${r.rate}`); a.ok(r.ok, `${cls} damage not plain or 1.75x`);
 }
 for (const cls of ["warrior", "mage"]) { const r = swings(cls, 30, 500); a.equal(r.rate, 0); a.ok(r.ok); }
});
test("crits also land on physical skills but never on spells", () => {
 const c = mk("rogue"); c.stats.sta = 200; c.mp = 999; c.skills = R.SKILLS.rogue.map(s => s.id);
 let skill = 0;
 for (const s of R.SKILLS.rogue.filter(s => s.k !== "heal" && s.k !== "guard" && s.k !== "magic")) {
  for (let seed = 1; seed <= 40; seed++) { const m = R.makeMonster(1, 0, 1, 0, "normal"); m.hp = m.max = 1e9; c.mp = 999; const f = new R.Fight([c], [m], "normal", seed);
   if (/Critical hit!/.test(f.act(0, "skill", s.id, 0))) skill++; }
 }
 a.ok(skill > 0);
 const g = mk("mage"); g.stats.sta = 200; g.mp = 999; g.skills = R.SKILLS.mage.map(s => s.id);
 for (const s of R.SKILLS.mage) for (let seed = 1; seed <= 40; seed++) { g.mp = 999; const m = R.makeMonster(1, 0, 1, 0, "normal"); m.hp = m.max = 1e9; a.ok(!/Critical/.test(new R.Fight([g], [m], "normal", seed).act(0, "skill", s.id, 0))); }
});
test("old save without CON keeps the same max HP and defense, keeps STA, and the points clamp still works", () => {
 for (const cls of ["warrior", "rogue", "archer", "mage"]) {
  const c = mk(cls, "human", {sta: 3}); c.lvl = 10; c.spent = 60; c.equip.chest = "leather";
  const old = JSON.parse(JSON.stringify(c)); delete old.stats.con;
  // the old (pre-CON) formulas, written out here on purpose
  const oldHp = Math.round(24 + 4 * old.stats.sta + 3 * old.stats.str + 7 * old.lvl + (R.ITEMS.leather.hp || 0)), oldDef = (R.ITEMS.leather.def || 0) + old.stats.sta * 0.6 + old.lvl * 0.8;
  a.equal(R.maxHp(old, 1), oldHp, "unmigrated read"); a.ok(Math.abs(R.defense(old) - oldDef) < 1e-9);
  a.equal(R.clampPoints(old), 0); a.equal(old.stats.con, old.stats.sta); a.equal(old.stats.sta, 8, "STA kept"); a.equal(old.spent, R.pointsEarned(10), "spent clamped, CON was free");
  a.equal(R.maxHp(old, 1), oldHp); a.ok(Math.abs(R.defense(old) - oldDef) < 1e-9);
 }
});
test("companions get CON = STA so their HP and defense are as before", () => {
 for (const cls of ["warrior", "rogue", "archer", "mage"]) {
  const h = mk(cls);
  for (const d of R.planParty(h, 7)) for (const L of [1, 10]) {
   const c = R.makeCompanion(d, L), oldHp = Math.round(24 + 4 * c.stats.sta + 3 * c.stats.str + 7 * c.lvl + ["helmet","chest","gloves","boots","weapon","offhand","acc1","acc2"].reduce((t, s) => t + ((c.equip[s] && R.ITEMS[c.equip[s]].hp) || 0), 0));
   a.equal(c.stats.con, c.stats.sta); a.equal(R.maxHp(c, 1), oldHp, d.name);
  }
 }
});
