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
 test(`zone ${zone} XP already shrinks at mark +1 and falls again at mark +2`, () => {
  const level = R.ZONE_MAXLVL[zone];
  assert.equal(R.overlevelExpMul(level + 1, zone), 0.5);
  assert.equal(R.overlevelExpMul(level + 2, zone), 0.25);
  assert.ok(reward(zone, level).xp > reward(zone, level + 1).xp);
  assert.ok(reward(zone, level + 1).xp > reward(zone, level + 2).xp);
 });
}

test("each further overlevel step decreases the multiplier through cap", () => {
 for (let zone = 1; zone <= 5; zone++) {
  for (let level = R.ZONE_MAXLVL[zone]; level < R.CAP; level++) {
   assert.ok(R.overlevelExpMul(level + 1, zone) < R.overlevelExpMul(level, zone));
   assert.ok(R.overlevelExpMul(level + 1, zone) > 0);
  }
 }
});

test("level 20 grinding zone 1 gives a very small positive remainder", () => {
 assert.ok(reward(1, 20).xp > 0);
 assert.ok(reward(1, 20).xp < reward(1, 1).xp / 100);
 assert.ok(reward(1, 20).xp < reward(1, 10).xp / 1000);
});

test("high party level caps combat level but still shrinks XP past zone mark", () => {
 const m = R.makeMonster(1, 0, 20, 0, "normal");
 assert.equal(m.lvl, 10); // Zone-1 combat level stops at its mark.
 const xp = new R.Fight([{lvl: 20}], [m], "normal", 7).rewards(7).xp;
 assert.equal(xp, baseXp(m) * 0.5 ** 10);
 assert.ok(xp < baseXp(m) / 1000);
});

test("mixed-zone rewards shrink per monster, retaining room bonus and loot", () => {
 const mons = [R.makeMonster(1, 0, 11, 0, "normal"), R.makeMonster(2, 0, 11, 0, "normal")];
 mons[1].room = true;
 const actual = new R.Fight([{lvl: 11}], mons, "normal", 7).rewards(7);
 assert.deepEqual(actual, {xp: baseXp(mons[0]) * 0.5 + baseXp(mons[1]), ...R.loot(1, 7)});
});

test("party level uses the rounded average, including fallen members", () => {
 const mons = [R.makeMonster(1, 0, 11, 0, "normal")];
 const party = [{lvl: 10, hp: 0}, {lvl: 11, hp: 10}];
 assert.equal(R.partyLevel(party), 11);
 assert.equal(new R.Fight(party, mons, "normal", 7).rewards(7).xp, baseXp(mons[0]) / 2);
});

test("fractional remainder can be accumulated by gainXp", () => {
 const c = R.newChar("Test", "human", "warrior", {}, R.SKILLS.warrior[0].id);
 c.lvl = 20; c.xp = 0;
 const xp = reward(1, 20).xp;
 R.gainXp(c, xp, 1);
 assert.equal(c.xp, xp);
});


test("zone floors and ten-level marks are exported", () => {
 assert.deepEqual(R.ZONE_MINLVL, [0, 1, 10, 20, 30, 40]);
 assert.deepEqual(R.ZONE_MAXLVL, [0, 10, 20, 30, 40, 50]);
});

test("cf=0 monsters match every party level within each zone band", () => {
 for (let zone = 1; zone <= 5; zone++) {
  for (let level = R.ZONE_MINLVL[zone]; level <= R.ZONE_MAXLVL[zone]; level++) {
   assert.equal(R.monsterLevel(zone, level, 0), level);
   assert.equal(R.overlevelExpMul(level, zone), 1);
  }
 }
});

test("later-zone monsters do not scale down to an underleveled party", () => {
 for (let zone = 2; zone <= 5; zone++) assert.equal(R.monsterLevel(zone, 3, 0), R.ZONE_MINLVL[zone]);
 const m = R.makeMonster(2, 0, 3, 0, "normal");
 assert.equal(m.lvl, 10);
 assert.equal(reward(2, 3).xp, baseXp(m));
 assert.equal(reward(2, 3).xp, reward(2, 10).xp);
});

test("monsters never scale past the zone mark, including above party cap", () => {
 for (let zone = 1; zone <= 5; zone++) {
  for (const level of [R.ZONE_MAXLVL[zone] + 1, 50, 60]) {
   assert.equal(R.monsterLevel(zone, level, 0), R.ZONE_MAXLVL[zone]);
   assert.equal(R.monsterLevel(zone, level, 1), R.ZONE_MAXLVL[zone]);
  }
 }
 assert.equal(R.monsterLevel(1, 20, 0), 10);
});

test("centre pressure stays inside each zone band", () => {
 for (let zone = 1; zone <= 5; zone++) {
  for (let level = 1; level <= 55; level++) {
   for (const cf of [0, 0.5, 1]) {
    const actual = R.monsterLevel(zone, level, cf);
    assert.ok(actual >= R.ZONE_MINLVL[zone]);
    assert.ok(actual <= R.ZONE_MAXLVL[zone]);
   }
  }
 }
 assert.equal(R.monsterLevel(1, 4, 1), 7);
 assert.equal(R.monsterLevel(1, 9, 1), 10);
});
