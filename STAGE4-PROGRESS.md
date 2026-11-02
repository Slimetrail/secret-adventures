# Stage 4 progress (combat and party) - PRIVATE, local only
Branch `stage4` on top of stage 3 commit c11ccd5. Nothing published.

## New files
- `rules.js`: all game rules as plain code (races, classes, stat costs, skills, levels, items, monsters, fight engine, save points, companions). Runs in the page and in node.
- `party.js`: screens (hero creation, party, stats, new skill, equip, backpack, fight), camp/tavern saves, death restore, random fights.
- Small hooks in `game.js` (4 lines): after a step call `SOTA.afterStep`, the room "Continue" button calls `SOTA.onRoomOpen`, movement is blocked while a stage 4 screen is open, `SOTA.saveRooms` exposed.
- `sw.js` is v5 and caches rules.js and party.js. All script tags are `?v=5`.

## What works (tested on pretend phone unless noted)
- Hero creation: name, race, class (classes a race can't use are greyed out), 10 stat points with rising cost (1-5:1, 6-10:2, 11-15:3, 16+:4), one starting skill (first 3 of the class), difficulty Story / Normal / Hard.
- Races: Human any class/armor; Elf mage/archer/rogue/warrior, armor up to medium, strong mana; Dwarf warrior/rogue/archer, no magic (mana can't be raised), very strong, carries 1.6x; Cat person mage/rogue/warrior, light armor only, strong stamina, weak strength, carries 0.6x. Armor limits come from race only (as in the sheet).
- Main stat: warriors strength, rogues/archers stamina (adds damage), mages mana (magic power).
- Levels to 50 (XP stops at 50). One skill slot at start plus one every 3 levels ("New skill" button on the party screen). 10 more stat points every other level (sheet's assumption).
- Fights: turn-based party menu (Attack, Skill/Magic, Item, Defend, Run) with target picking, side-view dark dungeon drawn in canvas, purple and blue torches, inked figures, purple/blue magic burst, heal glow. Win screen (XP, gold, junk, level ups). Lose screen then return to last save.
- Monsters: the 35 names from section 4 (incl. Eve's), zone strength 1x/1.3x/1.7x/2.2x/2.8x, monster level = max(zone minimum, party level) + up to 3 near the centre. Iron Golem is a named placeholder only.
- Difficulty: Story hero HP 200% and monster attack 50%, Normal 100/100, Hard monster attack 150%.
- Random fights: rooms 15% per step, hallways 2% per step, never within 10 steps of the last fight, never at camps or taverns. Measured 6-9 fights in 400 random steps. First entry into a monster room always starts a fight (after the stage 3 "Continue" panel). First entry into a treasure room gives gold (and maybe junk) - this is the stage 3 loot placeholder hook.
- Saving (exactly what changed): party, gold, backpacks, difficulty and the solved/cleared room lists are saved in `sota.party` ONLY when you step onto one of the 42 camps or 4 taverns (resting there also refills HP/MP), plus once when the hero is made ("the start"). Nothing else writes `sota.party`.
  - Kept as before so stage 1-3 keep working: your position/facing/map trail (`sota.stage1.save`) and puzzle rooms (`sota.rooms`) still save on every step. So reloading the app puts you where you stood, with the party as it was at the last camp/tavern.
  - Death: party, gold, backpacks AND the room lists go back to the last save, and you are moved to that camp/tavern. Rooms solved since that save become locked again.
- Companions (placeholders): Pip (Tavern 2, quirky, human rogue), Orla (Tavern 3, scholar, elf mage), Kira (Tavern 4, angry girl, cat warrior). They join only in story order and only once, at the party's level.
- Backpack per character with weight limit from strength and race; Use / Drop. Equip screen per character with 8 slots (weapon, off-hand/shield, helmet, chest, gloves, boots, 2 accessories) obeying race/class rules; items not allowed are shown as "(not allowed)".
- No hero yet: the game still walks as before, no fights; the sword button glows with "Tap the sword to make your hero". (This also keeps the old stage 1-3 tests valid.)

## Tests
- `tests/stage4_tests.py`: 17 tests. `tests/mutations4.py`: 25 mutations, all must be killed.
- Stage 1, 2, 3 tests still pass. Old tests changed only for `?v=4 -> ?v=5` and cache name `sota-s1-v5`.
- `tests/perf4.py`: frame times. `tools/shots4.py`: screenshots into ../stage4-shots/.

## Not done (left for next pass)
- Stat raises after level up exist on the party screen but there is no level-up popup.
- Skills are simple (damage, all-enemy, heal, guard). No status effects (poison, pin, smoke do plain damage or guard).
- Monster art is one inked shape family per zone with small changes, not 35 separate drawings. Iron Golem boss fight not built (name only).
- Companions have no talk/story (stage 6). Taverns don't buy junk or sell gear yet (stage 5). Gold has no use yet.
- Items can't be moved between characters' backpacks. Item slots on the walk bar are still empty.
- Fight balance is a first guess; a level 1 hero easily wins zone 1 even on Hard.
- 3D view keeps drawing behind the fight screen (wasted work).
- Section 14 puzzle changes NOT built (on purpose).

## Not tested
- Real phone (only pretend phone: Playwright Chromium with touch). Real GPU frame time not checked (fight draw numbers are script time only).
- Long play balance to level 50; landscape layout of stage 4 screens.
