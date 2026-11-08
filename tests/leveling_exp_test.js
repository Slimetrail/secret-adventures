"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const R = require("../rules.js");

function reward(zone, level, count = 1) {
 const monsters = Array.from({length: count}, (_, i) => R.makeMonster(zone, i, level, 0, "normal"));
 return new R.Fight([{lvl: level}], monsters, "normal", 7).rewards(7);
}
function baseXp(m) { return Math.round((6 + m.lvl * 4 * R.ZONE_MUL[m.zone]) * (m.room ? 2 : 1)); }

test("xpNeed rises at every level below cap and is infinite at 50", () => {
 for (let l = 1; l < 49; l++) assert.ok(R.xpNeed(l + 1) > R.xpNeed(l));
 assert.equal(R.xpNeed(50), Infinity);
});

test("on-level hallway fights take progressively longer across zone entry levels", () => {
 let previous = 0;
 for (let zone = 1; zone <= 5; zone++) {
  const level = R.ZONE_MINLVL[zone];
  // Seeded hallway encounter without weak-pack extension: mean pack size is two.
  const fights = R.xpNeed(level) / reward(zone, level, 2).xp;
  assert.ok(fights > previous, `zone ${zone}: ${fights} > ${previous}`);
  previous = fights;
 }
});

for (const zone of [1, 2]) {
 test(`zone ${zone} on-level and underlevel XP remain full`, () => {
  const level = R.ZONE_MINLVL[zone];
  const m = R.makeMonster(zone, 0, level, 0, "normal");
  assert.equal(reward(zone, level).xp, baseXp(m));
  assert.ok(reward(zone, level).xp >= 10);
  assert.equal(R.overlevelExpMul(level, zone), 1);
  assert.equal(R.overlevelExpMul(level - 1, zone), 1);
  if (level > 1) assert.equal(reward(zone, level - 1).xp, baseXp(m));
 });
 test(`zone ${zone} XP already shrinks at +1 and falls again at +2`, () => {
  const level = R.ZONE_MINLVL[zone];
  assert.equal(R.overlevelExpMul(level + 1, zone), 0.5);
  assert.equal(R.overlevelExpMul(level + 2, zone), 0.25);
  assert.ok(reward(zone, level).xp > reward(zone, level + 1).xp);
  assert.ok(reward(zone, level + 1).xp > reward(zone, level + 2).xp);
 });
}

test("each further overlevel step decreases the multiplier through cap", () => {
 for (let zone = 1; zone <= 5; zone++) {
  for (let level = R.ZONE_MINLVL[zone]; level < R.CAP; level++) {
   assert.ok(R.overlevelExpMul(level + 1, zone) < R.overlevelExpMul(level, zone));
   assert.ok(R.overlevelExpMul(level + 1, zone) > 0);
  }
 }
});

test("level 20 grinding zone 1 gives a very small positive remainder", () => {
 assert.ok(reward(1, 20).xp > 0);
 assert.ok(reward(1, 20).xp < reward(1, 1).xp / 1000);
});

test("scaled-up monster level does not erase the zone penalty", () => {
 const m = R.makeMonster(1, 0, 20, 0, "normal");
 assert.equal(m.lvl, 20); // Combat scaling is unchanged.
 const xp = new R.Fight([{lvl: 20}], [m], "normal", 7).rewards(7).xp;
 assert.equal(xp, baseXp(m) * 0.5 ** 19);
 assert.ok(xp < baseXp(m) / 1000);
});

test("mixed-zone rewards shrink per monster, retaining room bonus and loot", () => {
 const mons = [R.makeMonster(1, 0, 8, 0, "normal"), R.makeMonster(2, 0, 8, 0, "normal")];
 mons[1].room = true;
 const actual = new R.Fight([{lvl: 8}], mons, "normal", 7).rewards(7);
 assert.deepEqual(actual, {xp: baseXp(mons[0]) * 0.5 ** 7 + baseXp(mons[1]), ...R.loot(1, 7)});
});

test("party level uses the rounded average, including fallen members", () => {
 const mons = [R.makeMonster(1, 0, 3, 0, "normal")];
 const party = [{lvl: 1, hp: 0}, {lvl: 4, hp: 10}];
 assert.equal(R.partyLevel(party), 3);
 assert.equal(new R.Fight(party, mons, "normal", 7).rewards(7).xp, baseXp(mons[0]) / 4);
});

test("fractional remainder can be accumulated by gainXp", () => {
 const c = R.newChar("Test", "human", "warrior", {}, R.SKILLS.warrior[0].id);
 c.lvl = 20; c.xp = 0;
 const xp = reward(1, 20).xp;
 R.gainXp(c, xp, 1);
 assert.equal(c.xp, xp);
});
