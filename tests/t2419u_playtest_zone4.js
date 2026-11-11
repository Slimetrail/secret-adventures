"use strict";
// Jeremy t2419u / t2409u: zone 4 play-test. This WRAPS tests/t2370u_playtest_zone3.js (not changed): its source is loaded and run
// as-is up to its own report loop, so the sensible player, the attack-only player, spending, companions, rests and the zone 1-3
// path are the very same code. The wrapper only continues the same runs: Tavern 3 rest (nobody joins there), then zone 4 from its
// real entry level (about L30) to L40 (zone 4 monster cap). Zone 3 numbers are printed again from the same runs so a change shows.
// Usage: node tests/t2419u_playtest_zone4.js [runs] [--attack-only] [--blind]
// VER 88 zone 4 content pass (t2409u): in zone 4 the sensible player also reads the fight, as the fight text tells it to: it beats the
// shielding Giant scorpion first, then the war-crying Ogre warlord, and finishes an enraged warlord with its strongest skill; it does
// not cast single-target spells at a Lizard man while a weapon can do it; whoever is low Defends (or uses Rally/Smoke Veil) on the
// Minotaur's warned charge; it heals a little earlier (Griffin dives at the weakest) and cures venom. --blind keeps the plain zone 3
// player for zone 4 too (shown for comparison). Zone 1-3 play and --attack-only are the same code as before.
const fs = require("fs"), path = require("path"), Module = require("module");
const SRC = path.join(__dirname, "t2370u_playtest_zone3.js"), src = fs.readFileSync(SRC, "utf8");
const cut = src.indexOf("const all = {};"); if (cut < 0) throw new Error("zone 3 play-test layout changed");
const req = Module.createRequire(SRC);
const driver = `
for (let i = 0; i < N * N; i++) { if (+M.zone[i] === 4) (cells[4] = cells[4] || []).push([i % N, Math.floor(i / N)]); }
// counts what the player really spends in zone 4 (observes Fight.act; changes nothing)
let TALLY = null; const act0 = R.Fight.prototype.act;
R.Fight.prototype.act = function (ci, cmd, arg, targ) { if (TALLY) { const c = this.p[ci]; if (c && c.hp > 0 && !this.over) { const s = cmd === "skill" && R.SKILLS[c.cls].find(x => x.id === arg); TALLY[s ? (s.k === "heal" ? "heal" : "skill") : cmd] = (TALLY[s ? (s.k === "heal" ? "heal" : "skill") : cmd] || 0) + 1; } } return act0.apply(this, arguments); };
const BLIND = process.argv.includes("--blind"), fight3 = fight;
// zone 4 "reads the fight" sensible player (see the header); same Fight engine, same seeds
function fight4(party, mons, seed) {
 const F = new R.Fight(party, mons, "normal", seed); let rounds = 0;
 const share = c => c.hp / R.maxHp(c, 1);
 while (!F.over && rounds < 60) {
  for (let i = 0; i < party.length && !F.over; i++) {
   const c = party[i]; if (c.hp <= 0) continue;
   const live = F.m.map((m, j) => [m, j]).filter(x => x[0].hp > 0);
   const pri = m => (m.mech === "shell" && live.length > 1) ? 0 : R.enraged(m) ? 1 : (m.mech === "warcry" && live.length > 1) ? 2 : 3;
   const order = live.slice().sort((a, b) => pri(a[0]) - pri(b[0]) || a[0].hp - b[0].hp), tg = order.length ? order[0][1] : 0;
   const sk = c.skills.map(id => R.SKILLS[c.cls].find(s => s.id === id)).filter(s => s && s.mp <= c.mp);
   const heal = sk.find(s => s.k === "heal"), guard = sk.find(s => s.k === "guard");
   const hurt = party.some(p => p.hp > 0 && (share(p) < 0.5 || (F.venom && F.venom[party.indexOf(p)] && share(p) < 0.6)));
   const chargeNow = F.turn % 3 === 2 && live.some(x => x[0].mech === "charge");
   const dmgs = sk.filter(s => s.k === "phys" || s.k === "magic").sort((a, b) => (b.p * (b.all ? live.length : 1)) - (a.p * (a.all ? live.length : 1)));
   if (hurt && heal) { F.act(i, "skill", heal.id, tg); continue; }
   if (chargeNow && guard && !F.guard.size && party.filter(p => p.hp > 0 && share(p) < 0.7).length >= 2) { F.act(i, "skill", guard.id, tg); continue; }
   if (chargeNow && share(c) < 0.6 && !F.guard.has(i)) { F.act(i, "defend", null, tg); continue; }
   // magic: aim single-target spells at the first target that is not a Lizard man; all-target spells only when most foes are not
   let pick = null, at = tg;
   for (const s of dmgs) {
    if (s.k === "magic" && !s.all) { const t2 = order.find(x => x[0].mech !== "scales"); if (!t2) continue; pick = s; at = t2[1]; break; }
    if (s.k === "magic" && s.all && live.filter(x => x[0].mech === "scales").length * 2 >= live.length) continue;
    pick = s; break;
   }
   const target = F.m[tg], must = R.enraged(target) || pri(target) === 0;
   if (pick && (c.cls === "mage" || must || c.mp >= pick.mp * 2)) F.act(i, "skill", pick.id, at); else F.act(i, "attack", null, tg);
  }
  if (!F.over) F.monstersTurn(); rounds++;
 }
 return F;
}
function play4(cls) {
 const out = [];
 for (let run = 1; run <= RUNS; run++) {
  const hero = newHero(cls), party = [hero], scratch = () => ({fights: 0, wins: 0, losses: 0, rooms: 0, roomWins: 0, xp: 0, hpLeft: [], stretches: [], lvlAt: {}});
  playZone(party, 1, 10, 200, run * 31 + 1, scratch()); full(party); companionsAt(0, party, hero, run);
  playZone(party, 2, 20, 300, run * 31 + 2, scratch()); full(party); const joined = companionsAt(1, party, hero, run);
  const s3 = scratch(); s3.startLvl = hero.lvl; s3.party = party.map(c => c.name + " " + c.cls + " L" + c.lvl).join(", "); s3.joined = joined && (joined.name + " " + joined.cls);
  playZone(party, 3, 30, 500, run * 31 + 3, s3); s3.endLvl = hero.lvl; s3.size = party.length; s3.endHp = party.map(c => R.maxHp(c, 1));
  full(party); companionsAt(2, party, hero, run); // Tavern 3: rest; nobody joins at Tavern 3 (real companionFor)
  const s4 = scratch(); s4.startLvl = hero.lvl; s4.party = party.map(c => c.name + " " + c.cls + " L" + c.lvl).join(", ");
  s4.tally = TALLY = {}; if (!ATTACK_ONLY && !BLIND) fight = fight4; playZone(party, 4, 40, 700, run * 31 + 4, s4); fight = fight3; TALLY = null; s4.endLvl = hero.lvl; s4.size = party.length;
  out.push({s3, s4});
 }
 return out;
}
function report4(cls, rs) {
 const from = Math.round(avg(rs.map(r => r.startLvl))), to = 40, per = [];
 for (let l = from + 1; l <= to; l++) { const v = rs.map(r => { const a = r.lvlAt[l], b = l - 1 === r.startLvl ? 0 : r.lvlAt[l - 1]; return a != null && b != null ? a - b : null; }).filter(v => v != null); if (v.length) per.push("L" + l + ":" + avg(v).toFixed(1)); }
 const F = rs.reduce((t, r) => t + r.fights, 0), W = rs.reduce((t, r) => t + r.wins, 0), RM = rs.reduce((t, r) => t + r.rooms, 0), RW = rs.reduce((t, r) => t + r.roomWins, 0);
 const res = {cls, entry: avg(rs.map(r => r.startLvl)), end: avg(rs.map(r => r.endLvl)), fights: avg(rs.map(r => r.fights)), win: W / F, hall: (W - RW) / (F - RM), room: RW / Math.max(1, RM), hpLeft: avg(rs.flatMap(r => r.hpLeft)), stretch: avg(rs.flatMap(r => r.stretches)), per};
 console.log(cls + " zone 4 (party of " + rs[0].size + ": " + rs[0].party + "): entry L" + res.entry.toFixed(1) + ", " + res.fights.toFixed(1) + " fights for L" + from + "->L" + res.end.toFixed(1) + "; win " + (100 * res.win).toFixed(1) + "% (hallway " + (100 * res.hall).toFixed(1) + "%, room " + (100 * res.room).toFixed(1) + "%); avg HP left after a win " + (100 * res.hpLeft).toFixed(0) + "%; fights before camp/potion " + res.stretch.toFixed(1));
 console.log("   fights per level: " + per.join(" "));
 const T = {}; rs.forEach(r => Object.entries(r.tally).forEach(([k, v]) => T[k] = (T[k] || 0) + v)); const acts = Object.values(T).reduce((t, v) => t + v, 0);
 res.use = {skill: (T.skill || 0) / acts, heal: (T.heal || 0) / acts, attack: (T.attack || 0) / acts};
 console.log("   actions: skills " + (100 * res.use.skill).toFixed(0) + "%, heals " + (100 * res.use.heal).toFixed(0) + "%, plain Attack " + (100 * res.use.attack).toFixed(0) + "% (" + (acts / F).toFixed(1) + " actions per fight)");
 return res;
}
const all = {};
console.log(ATTACK_ONLY ? "MODE attack-only" : BLIND ? "MODE sensible (zone 3 player in zone 4 too)" : "MODE sensible (zone 4: reads the fight)", "runs", RUNS);
const TOT = {z3: {f: 0, w: 0, rf: 0, rw: 0}, z4: {f: 0, w: 0, rf: 0, rw: 0}};
for (const cls of ["warrior", "rogue", "archer", "mage"]) { const rs = play4(cls); all[cls] = {z3: report(cls, rs.map(r => r.s3)), z4: report4(cls, rs.map(r => r.s4))};
 for (const z of ["z3", "z4"]) rs.forEach(r => { const q = r["s" + z[1]]; TOT[z].f += q.fights; TOT[z].w += q.wins; TOT[z].rf += q.rooms; TOT[z].rw += q.roomWins; }); }
// all four hero classes together (simulated fights, not runs)
for (const z of ["z3", "z4"]) { const t = TOT[z]; console.log("TOTAL zone " + z[1] + ": " + t.f + " fights, win " + (100 * t.w / t.f).toFixed(1) + "%; " + (t.f - t.rf) + " hallway fights, win " + (100 * (t.w - t.rw) / (t.f - t.rf)).toFixed(1) + "%; " + t.rf + " room fights, win " + (100 * t.rw / Math.max(1, t.rf)).toFixed(1) + "%"); }
all.TOTAL = TOT;
module.exports.all = all;
`;
const m = {exports: {}};
new Function("require", "module", "exports", "__dirname", "__filename", "process", src.slice(0, cut) + driver)(req, m, m.exports, __dirname, SRC, process);
module.exports = m.exports;
