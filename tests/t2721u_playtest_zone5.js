"use strict";
// Jeremy t2721u: zone 5 + Iron Golem play-test. WRAPS tests/t2419u_playtest_zone4.js (not changed) the same way that file wraps the zone 3 test:
// the zone 3 source up to its report loop, plus the zone 4 driver (its fight4 "reads the fight" player and play setup) up to its own report loop,
// then this driver continues the very same runs: Tavern 4 rest + the real companionFor join (Brunn), zone 5 from its real entry level to L50
// (zone 5 monster cap), then the Iron Golem fight (several seeds per run) with a final-fight kit: each member carries 2 Healing potions and
// 1 Mana potion, and the party has 2 Moon elixirs and a Hunter's stew each (crafted at camp; existing items, normal rules).
// The sensible zone 5 player reads the fight text: beats the Shadow drake (veil) first, keeps hitting a Hydra with skills, Defends/Rallies
// on a warned stare / fire breath / sweep, heals early (Wyvern dives at the weakest) and puts out burns; against the Golem the member its eye
// locked on Defends, the healer keeps the party up, and potions are used when nobody can heal.
// Usage: node tests/t2721u_playtest_zone5.js [runs] [--attack-only] [--no-kit] [--blind]
//   --attack-only: every member only uses Attack (zones 1-5 and the Golem); --no-kit: the Golem without potions/elixirs/stew;
//   --blind: the Golem with the same skills/heals/kit but nobody Defends on the eye lock or the sweep (shows what reading the fight is worth).
const fs = require("fs"), path = require("path"), Module = require("module");
const SRC = path.join(__dirname, "t2370u_playtest_zone3.js"), src = fs.readFileSync(SRC, "utf8");
const cut = src.indexOf("const all = {};"); if (cut < 0) throw new Error("zone 3 play-test layout changed");
const Z4 = fs.readFileSync(path.join(__dirname, "t2419u_playtest_zone4.js"), "utf8");
const d0 = Z4.indexOf("const driver = `"), d1 = Z4.indexOf("const all = {};", d0); if (d0 < 0 || d1 < 0) throw new Error("zone 4 play-test layout changed");
const driver4 = Z4.slice(d0 + "const driver = `".length, d1);
const req = Module.createRequire(SRC);
const driver5 = `
// crafted items (Moon elixir, Hunter's stew) live in econ.js, which adds them to RPG.ITEMS in the game; load it the same way here
if (!R.ITEMS.c_elixir) vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "econ.js"), "utf8"), {window: {RPG: R}});
for (let i = 0; i < N * N; i++) { if (+M.zone[i] === 5) (cells[5] = cells[5] || []).push([i % N, Math.floor(i / N)]); }
const NOKIT = process.argv.includes("--no-kit"), BLIND5 = process.argv.includes("--blind");
const share = c => c.hp / R.maxHp(c, 1);
function pickSkills(c) { return c.skills.map(id => R.SKILLS[c.cls].find(s => s.id === id)).filter(s => s && s.mp <= c.mp); }
function useItem(F, party, i, ids, tgi) { for (const id of ids) { const k = party[i].bag.indexOf(id); if (k >= 0 && F.act(i, "item", id, tgi)) return true; } return false; }
function fight5(party, mons, seed, boss) {
 const F = new R.Fight(party, mons, "normal", seed); let rounds = 0;
 while (!F.over && rounds < 80) {
  for (let i = 0; i < party.length && !F.over; i++) {
   const c = party[i]; if (c.hp <= 0) continue;
   const live = F.m.map((m, j) => [m, j]).filter(x => x[0].hp > 0);
   const pri = m => (m.mech === "veil" && live.length > 1) ? 0 : (m.mech === "regrow") ? 1 : 2;
   const order = live.slice().sort((a, b) => pri(a[0]) - pri(b[0]) || a[0].hp - b[0].hp), tg = order.length ? order[0][1] : 0;
   const sk = pickSkills(c), heal = sk.find(s => s.k === "heal"), guard = sk.find(s => s.k === "guard");
   const burning = p => F.venom && F.venom[party.indexOf(p)];
   const lowP = party.filter(p => p.hp > 0 && share(p) < 0.5), hurt = lowP.length || party.some(p => p.hp > 0 && burning(p) && share(p) < 0.65);
   const blastNow = F.turn % 3 === 2 && live.some(x => x[0].boss || x[0].mech === "gaze" || x[0].mech === "breath");
   const marked = F.mark === i && F.turn % 3 === 0;
   const down = party.findIndex(p => p.hp <= 0);
   if (down >= 0 && (boss || live.length) && useItem(F, party, i, ["salts"], down)) continue;
   if (hurt && heal) { F.act(i, "skill", heal.id, tg); continue; }
   if (boss && BLIND5) { /* blind: no Defend/Rally on the Golem's warnings */ } else if (marked && !F.guard.has(i)) { F.act(i, "defend", null, tg); continue; }
   else if (blastNow && guard && !F.guard.size && party.filter(p => p.hp > 0 && share(p) < 0.75).length >= 2) { F.act(i, "skill", guard.id, tg); continue; }
   else if (blastNow && share(c) < 0.6 && !F.guard.has(i)) { F.act(i, "defend", null, tg); continue; }
   if (lowP.length && !party.some(p => p.hp > 0 && pickSkills(p).some(s => s.k === "heal"))) { const w = party.indexOf(lowP.sort((a, b) => share(a) - share(b))[0]); if (useItem(F, party, i, ["c_elixir", "potion"], w)) continue; }
   if (c.mp < 6 && useItem(F, party, i, ["ether"], i)) continue;
   const dmgs = sk.filter(s => s.k === "phys" || s.k === "magic").sort((a, b) => (b.p * (b.all ? live.length : 1)) - (a.p * (a.all ? live.length : 1)));
   const pick = dmgs[0], target = F.m[tg], must = target.mech === "regrow" || pri(target) === 0 || target.boss;
   if (pick && (c.cls === "mage" || must || c.mp >= pick.mp * 2)) F.act(i, "skill", pick.id, tg); else F.act(i, "attack", null, tg);
  }
  if (!F.over) F.monstersTurn(); rounds++;
 }
 return F;
}
function fightAO(party, mons, seed) { const F = new R.Fight(party, mons, "normal", seed); let rounds = 0;
 while (!F.over && rounds < 80) { for (let i = 0; i < party.length && !F.over; i++) { const c = party[i]; if (c.hp <= 0) continue; const live = F.m.map((m, j) => [m, j]).filter(x => x[0].hp > 0).sort((a, b) => a[0].hp - b[0].hp); F.act(i, "attack", null, live[0][1]); }
  if (!F.over) F.monstersTurn(); rounds++; } return F; }
const clone = p => JSON.parse(JSON.stringify(p));
const BOSS_SEEDS = 5;
function kit(party) { party.forEach(c => { c.bag.push("potion", "potion", "ether"); c.buff = {str: 0, sta: 25, f: 3, n: "Hunter's stew"}; }); party[0].bag.push("c_elixir", "salts"); (party[1] || party[0]).bag.push("c_elixir"); }
function play5(cls) {
 const out = [];
 for (let run = 1; run <= RUNS; run++) {
  const hero = newHero(cls), party = [hero], scratch = () => ({fights: 0, wins: 0, losses: 0, rooms: 0, roomWins: 0, xp: 0, hpLeft: [], stretches: [], lvlAt: {}});
  playZone(party, 1, 10, 200, run * 31 + 1, scratch()); full(party); companionsAt(0, party, hero, run);
  playZone(party, 2, 20, 300, run * 31 + 2, scratch()); full(party); companionsAt(1, party, hero, run);
  playZone(party, 3, 30, 500, run * 31 + 3, scratch()); full(party); companionsAt(2, party, hero, run);
  const s4 = scratch(); s4.startLvl = hero.lvl; if (!ATTACK_ONLY) fight = fight4; playZone(party, 4, 40, 700, run * 31 + 4, s4); fight = fight3; s4.endLvl = hero.lvl; s4.size = party.length;
  full(party); const joined = companionsAt(3, party, hero, run); // Tavern 4: rest + the real companionFor join
  const s5 = scratch(); s5.startLvl = hero.lvl; s5.party = party.map(c => c.name + " " + c.cls + " L" + c.lvl).join(", "); s5.joined = joined && joined.name;
  s5.tally = TALLY = {}; fight = ATTACK_ONLY ? fightAO : (p, m, sd) => fight5(p, m, sd, false); playZone(party, 5, 50, 1200, run * 31 + 5, s5); fight = fight3; TALLY = null; s5.endLvl = hero.lvl; s5.size = party.length;
  // the Golem: full rest at the last camp, final-fight kit, several seeds from the same party
  s5.boss = []; for (let b = 0; b < BOSS_SEEDS; b++) { const p = clone(party); full(p); if (!ATTACK_ONLY && !NOKIT) kit(p); const sd = (run * 7919 + b * 104729 + 55) >>> 0;
   const F = ATTACK_ONLY ? fightAO(p, [R.makeBoss("normal")], sd) : fight5(p, [R.makeBoss("normal")], sd, true);
   s5.boss.push({win: F.over === "win", turns: F.turn, hpLeft: p.reduce((t, c) => t + Math.max(0, c.hp) / R.maxHp(c, 1), 0) / p.length, ko: p.filter(c => c.hp <= 0).length}); }
  out.push({s4, s5});
 }
 return out;
}
const TOT = {z4: {f: 0, w: 0, rf: 0, rw: 0}, z5: {f: 0, w: 0, rf: 0, rw: 0}, boss: {f: 0, w: 0, turns: 0, hp: 0, ko: 0}};
console.log(ATTACK_ONLY ? "MODE attack-only" : "MODE sensible (zone 5: reads the fight)" + (NOKIT ? " --no-kit" : "") + (BLIND5 ? " --blind (Golem)" : ""), "runs", RUNS);
const all = {};
for (const cls of ["warrior", "rogue", "archer", "mage"]) { const rs = play5(cls); const C = {f: 0, w: 0, rf: 0, rw: 0, bf: 0, bw: 0};
 rs.forEach(r => { for (const z of ["z4", "z5"]) { const q = r["s" + z[1]]; TOT[z].f += q.fights; TOT[z].w += q.wins; TOT[z].rf += q.rooms; TOT[z].rw += q.roomWins; }
  C.f += r.s5.fights; C.w += r.s5.wins; C.rf += r.s5.rooms; C.rw += r.s5.roomWins;
  r.s5.boss.forEach(b => { C.bf++; C.bw += b.win; TOT.boss.f++; TOT.boss.w += b.win; TOT.boss.turns += b.turns; TOT.boss.hp += b.win ? b.hpLeft : 0; TOT.boss.ko += b.ko; }); });
 const e = avg(rs.map(r => r.s5.startLvl)), x = avg(rs.map(r => r.s5.endLvl));
 console.log(cls + " zone 5 (party of " + rs[0].s5.size + ": " + rs[0].s5.party + "): entry L" + e.toFixed(1) + " -> L" + x.toFixed(1) + ", " + avg(rs.map(r => r.s5.fights)).toFixed(1) + " fights; win " + (100 * C.w / C.f).toFixed(1) + "% (hallway " + (100 * (C.w - C.rw) / (C.f - C.rf)).toFixed(1) + "%, room " + (100 * C.rw / Math.max(1, C.rf)).toFixed(1) + "%); Golem " + C.bw + "/" + C.bf + " = " + (100 * C.bw / C.bf).toFixed(1) + "%");
 all[cls] = C; }
for (const z of ["z4", "z5"]) { const t = TOT[z]; console.log("TOTAL zone " + z[1] + ": " + t.f + " fights, win " + (100 * t.w / t.f).toFixed(1) + "%; " + (t.f - t.rf) + " hallway fights, win " + (100 * (t.w - t.rw) / (t.f - t.rf)).toFixed(1) + "%; " + t.rf + " room fights, win " + (100 * t.rw / Math.max(1, t.rf)).toFixed(1) + "%"); }
{ const b = TOT.boss; console.log("TOTAL Iron Golem: " + b.f + " fights, win " + (100 * b.w / b.f).toFixed(1) + "%; avg rounds " + (b.turns / b.f).toFixed(1) + "; avg party HP left after a win " + (100 * b.hp / Math.max(1, b.w)).toFixed(0) + "%; avg knocked out " + (b.ko / b.f).toFixed(2)); }
all.TOTAL = TOT; module.exports.all = all;
`;
const m = {exports: {}};
new Function("require", "module", "exports", "__dirname", "__filename", "process", src.slice(0, cut) + driver4 + driver5)(req, m, m.exports, __dirname, SRC, process);
module.exports = m.exports;
