"use strict";
// Jeremy t2362u step 2 / t2370u: zone 3 play-test. Same method as tests/t2361u_playtest_zones12.js (copied, not changed): each run
// plays the real party through zones 1 and 2 (Mira joins at Tavern 1), Sorrel joins at Tavern 2 by the real companionFor plan, then
// the party plays zone 3 from its real entry level (about L20) to L30 (zone 3 monster cap). Hero kit and companions as in the game;
// no chest gear (same as the zones 1-2 test). Reports numbers only; it changes nothing.
// Usage: node tests/t2370u_playtest_zone3.js [runs]   (was: Jeremy t2361u/t2362u play-test, zones 1-2 only (step 1). Real rules.js fight engine, real encounter()/roomEncounter() packs
// sized for the real party, real Fight.rewards and gainXp, real companions from planParty/companionFor/makeCompanion at the
// taverns, real starting kit gear. Reports numbers only; it changes nothing. see above)
const fs = require("fs"), vm = require("vm"), path = require("path");
const R = require("../rules.js");
const box = {window: {}}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "maze-data.js"), "utf8"), box);
const M = box.window.MAZE, N = M.n;
const RUNS = +process.argv[2] || 30;
const ATTACK_ONLY = process.argv.includes("--attack-only"); // t2404u: every member only uses Attack (zones 1-3)
// cells and rooms per zone, for the real centre-pressure factor of each fight
const cells = {1: [], 2: [], 3: []};
for (let i = 0; i < N * N; i++) { const z = +M.zone[i]; if (cells[z]) cells[z].push([i % N, Math.floor(i / N)]); }
const ROOM_SHARE = 0.15; // share of fights that are room fights (first entry into a room); the rest are hallway rolls
// sensible spending: 2 points into the main stat for every 1 into CON (main = STR warrior, STA rogue/archer, MAN mage)
const MAIN = {warrior: "str", rogue: "sta", archer: "sta", mage: "man"};
function spend(c) { let k = 0; for (let guard = 0; guard < 200; guard++) { const stat = (k++ % 3 === 2) ? "con" : MAIN[c.cls]; if (!R.raise(c, stat) && !R.raise(c, stat === "con" ? MAIN[c.cls] : "con")) break; } }
function learnAll(c) { while (c.skills.length < R.skillSlots(c.lvl)) { const s = R.SKILLS[c.cls].find(x => !c.skills.includes(x.id)); if (!s) break; R.learn(c, s.id); } }
function newHero(cls) {
 const kit = {warrior: {str: 3}, rogue: {sta: 3}, archer: {sta: 3}, mage: {man: 3}}[cls];
 const h = R.newChar("Hero", "human", cls, kit, R.SKILLS[cls][0].id);
 ({warrior: ["sword", "leather"], rogue: ["dagger", "leather"], archer: ["bow", "leather"], mage: ["staff", "robe"]})[cls].forEach(id => { h.bag.push(id); R.equip(h, id, R.ITEMS[id].slot); });
 h.hp = R.maxHp(h, 1); h.mp = R.maxMp(h); return h;
}
// one fight with a simple, sensible player: heal a hurt ally if you can, else the strongest skill you can pay for, else Attack
function fight(party, mons, seed) {
 const F = new R.Fight(party, mons, "normal", seed); let rounds = 0;
 while (!F.over && rounds < 60) {
  for (let i = 0; i < party.length && !F.over; i++) {
   const c = party[i]; if (c.hp <= 0) continue;
   const foes = F.m.map((m, j) => [m, j]).filter(x => x[0].hp > 0).sort((a, b) => a[0].hp - b[0].hp), tg = foes.length ? foes[0][1] : 0;
   const sk = c.skills.map(id => R.SKILLS[c.cls].find(s => s.id === id)).filter(s => s && s.mp <= c.mp);
   const hurt = party.some(p => p.hp > 0 && p.hp < R.maxHp(p, 1) * 0.45), heal = sk.find(s => s.k === "heal");
   const dmg = sk.filter(s => s.k === "phys" || s.k === "magic").sort((a, b) => (b.p * (b.all ? foes.length : 1)) - (a.p * (a.all ? foes.length : 1)))[0];
   if (ATTACK_ONLY) F.act(i, "attack", null, tg); // t2404u: plain Attack only, no skills
   else if (hurt && heal) F.act(i, "skill", heal.id, tg); else if (dmg && (c.cls === "mage" || c.mp >= dmg.mp * 2)) F.act(i, "skill", dmg.id, tg); else F.act(i, "attack", null, tg);
  }
  if (!F.over) F.monstersTurn(); rounds++;
 }
 return F;
}
function full(party) { party.forEach(c => { c.hp = R.maxHp(c, 1); c.mp = R.maxMp(c); }); }
function playZone(party, zone, untilLvl, maxFights, seed0, st) {
 const rr = R.rng(seed0); let stretch = 0;
 for (let f = 0; f < maxFights && party[0].lvl < untilLvl; f++) {
  const [x, y] = cells[zone][Math.floor(rr() * cells[zone].length)], cf = R.centreFactor(x, y, N), seed = (seed0 * 7919 + f * 104729) >>> 0;
  const room = rr() < ROOM_SHARE, mons = (room ? R.roomEncounter : R.encounter)(zone, R.partyLevel(party), cf, "normal", seed, party);
  const F = fight(party, mons, seed); st.fights++; stretch++; if (room) st.rooms++;
  if (F.over === "win") {
   st.wins++; if (room) st.roomWins++;
   const rw = F.rewards(seed); st.xp += rw.xp;
   party.forEach(c => { if (c.hp > 0) { const g = R.gainXp(c, rw.xp, 1); if (g.length && c === party[0]) g.forEach(l => { st.lvlAt[l] = st.fights; }); if (g.length) { learnAll(c); spend(c); } } });
   const hpPct = party.reduce((t, c) => t + c.hp / R.maxHp(c, 1), 0) / party.length; st.hpLeft.push(hpPct);
   const low = party.some(c => c.hp <= 0 || c.hp < R.maxHp(c, 1) * 0.35);
   if (low) { st.stretches.push(stretch); stretch = 0; full(party); } // camp Rest or a potion
  } else { st.losses++; st.stretches.push(stretch); stretch = 0; full(party); } // in the game: back to the last save
 }
}
function companionsAt(t, party, hero, seed) { const plan = R.planParty(hero, seed); const def = R.companionFor(t, party, plan); if (def) { const c = R.makeCompanion(def, R.partyLevel(party)); spend(c); party.push(c); return c; } return null; }
const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN;
function play(cls) {
 const out = [];
 for (let run = 1; run <= RUNS; run++) {
  const hero = newHero(cls), party = [hero], scratch = () => ({fights: 0, wins: 0, losses: 0, rooms: 0, roomWins: 0, xp: 0, hpLeft: [], stretches: [], lvlAt: {}});
  playZone(party, 1, 10, 200, run * 31 + 1, scratch()); full(party); companionsAt(0, party, hero, run);
  playZone(party, 2, 20, 300, run * 31 + 2, scratch()); full(party); const joined = companionsAt(1, party, hero, run); // Tavern 2: rest + Sorrel
  const s3 = scratch(); s3.startLvl = hero.lvl; s3.party = party.map(c => c.name + " " + c.cls + " L" + c.lvl).join(", "); s3.joined = joined && (joined.name + " " + joined.cls);
  playZone(party, 3, 30, 500, run * 31 + 3, s3); s3.endLvl = hero.lvl; s3.size = party.length; s3.endHp = party.map(c => R.maxHp(c, 1)); out.push(s3);
 }
 return out;
}
function report(cls, rs) {
 const from = Math.round(avg(rs.map(r => r.startLvl))), to = 30, per = [];
 for (let l = from + 1; l <= to; l++) { const v = rs.map(r => { const a = r.lvlAt[l], b = l - 1 === r.startLvl ? 0 : r.lvlAt[l - 1]; return a != null && b != null ? a - b : null; }).filter(v => v != null); if (v.length) per.push(`L${l}:${avg(v).toFixed(1)}`); }
 const F = rs.reduce((t, r) => t + r.fights, 0), W = rs.reduce((t, r) => t + r.wins, 0), RM = rs.reduce((t, r) => t + r.rooms, 0), RW = rs.reduce((t, r) => t + r.roomWins, 0);
 const res = {cls, party: rs[0].party, entry: avg(rs.map(r => r.startLvl)), end: avg(rs.map(r => r.endLvl)), fights: avg(rs.map(r => r.fights)), win: W / F, hall: (W - RW) / (F - RM), room: RW / Math.max(1, RM), hpLeft: avg(rs.flatMap(r => r.hpLeft)), stretch: avg(rs.flatMap(r => r.stretches)), per};
 console.log(`${cls} zone 3 (party of ${rs[0].size}: ${rs[0].party}): entry L${res.entry.toFixed(1)}, ${res.fights.toFixed(1)} fights for L${from}->L${res.end.toFixed(1)}; win ${(100 * res.win).toFixed(1)}% (hallway ${(100 * res.hall).toFixed(1)}%, room ${(100 * res.room).toFixed(1)}%); avg HP left after a win ${(100 * res.hpLeft).toFixed(0)}%; fights before camp/potion ${res.stretch.toFixed(1)}`);
 console.log(`   fights per level: ${per.join(" ")}`);
 const flags = [];
 if (res.win > 0.985 && res.hpLeft > 0.85) flags.push("looks TOO EASY (wins almost always with little HP lost)");
 if (res.win < 0.85) flags.push("looks TOO HARD (wins under 85%)");
 if (res.room < 0.7) flags.push("rooms look TOO HARD (room wins under 70%)");
 if (res.stretch < 3) flags.push("needs a camp/potion very often (under 3 fights)");
 if (flags.length) console.log("   FLAG: " + flags.join("; "));
 return res;
}
const all = {};
for (const cls of ["warrior", "rogue", "archer", "mage"]) all[cls] = report(cls, play(cls));
if (typeof module !== "undefined") module.exports = {all};
