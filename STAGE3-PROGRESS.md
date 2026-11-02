# Stage 3 progress (puzzles)
## Difficulty by zone
| Type | Parameter | Z1 | Z2 | Z3 | Z4 | Z5 |
|---|---|---|---|---|---|---|
| mirror | grid n | 4 | 5 | 5 | 6 | 6 |
| mirror | mirrors | 3 | 4 | 6 | 7 | 9 |
| mirror | beam must hit | 2 | 2 | 3 | 3 | 4 |
| lever | levers/lamps | 3 | 4 | 5 | 6 | 7 |
| lever | min presses | 1 | 2 | 2 | 3 | 3 |
| riddle/code | riddles in a row | 1 | 2 | – | – | – |
| riddle/code | code length | – | – | 3 | 4 | 4 |
| riddle/code | digits 1..k | – | – | 5 | 6 | 8 |
| block | grid n | 4 | 5 | 5 | 6 | 6 |
| block | blocks | 3 | 4 | 5 | 6 | 7 |
| block | min moves | 3 | 5 | 7 | 9 | 11 |
| tile | grid n | 3 | 3 | 3 | 4 | 4 |
| tile | scramble moves | 10 | 16 | 24 | 24 | 34 |
Block puzzles: every slide can be undone, so there are no dead states; Reset is there as well.
## Done
- Locks on all 85 treasure, monster and story rooms. Camps, taverns and zone doors have no lock. Walking into a locked room opens its puzzle instead of moving you.
- All 5 puzzle types: mirror beams, levers, riddle (zones 1-2) or code (zones 3-5), moving blocks, sliding tiles. Each puzzle is seeded per room.
- Parchment puzzle screen with Close (keeps progress) and Reset buttons, an instruction line, a solved state and an Enter room button. Works with touch, mouse and keyboard.
- 3D view: locked rooms show a door with a glowing seal; solved rooms show an open doorway.
- Saves: sota.rooms {s,c}. A save with any bad id is ignored as a whole. An old Stage 2 save loads with no rooms solved.
- Placeholder panel on the first entry after solving; it never shows again.
- Map: a locked room shows a door with a padlock; a solved room shows a green tick (monster X greyed and struck through).
- tools/solver.js: own search over all 85 rooms, none solved at the start.
- sw.js is v4 and caches the 3 new files.
- Tests: tests/stage3_tests.py (11) and tests/mutations3.py (13 killed). Frame times are in tests/perf.py.
## Changes to older tests (legit)
- run_tests.fresh, stage2_tests.page, perf.py and tools/shots2.py now preset sota.rooms as all solved and cleared, so walks through rooms are not stopped by locks.
- The ?v=3 anchors became ?v=4 in mutations.py, mutations2.py and the stage2 offline2 test.
## Next / not done
- Loot, fights and story (later stages).
- Facing a locked door in the 3D view measured 13.6 ms at 4x slowdown, against 9.0 ms at the start spot. It was not measured at the same spot without the door.
