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

## Fix round 1 (Nov 2, 2026)
Reported problem: "make a hero" does not work on the phone.

Cause (pretend phone = Playwright Chromium with touch, not a real phone):
- REPRODUCED: typing the hero name lost letters. The walk keys (w a s d, arrows) and the map key (m) are caught on the whole window and eaten, so "Jeremy Sword" became "Jerey Sor" and "m" opened the map. Fixed with a capture listener in party.js that stops those keys while a stage 4 screen is open or a text box has focus (game.js and map.js not touched). On a real Android keyboard keys may arrive as "Unidentified": not checked.
- READ IN CODE: no hero meant no creation screen; the player had to find and tap the small sword button. Now creation opens by itself when there is no hero.
- READ IN CODE: empty name silently became "Hero"; points-left and no-skill gave no message. Now clear red messages on a sticky Confirm bar.
- READ IN CODE: every tap rebuilt the screen and jumped back to the top. Scroll is now kept.
- READ IN CODE: an old v4/v5 service worker keeps serving the old files until "New version ready" is tapped. Tested: v4 and v5 -> v6 reach creation after the banner tap. From v6 on, an update with no hero yet reloads by itself.
- NOT REPRODUCED (corrected): touch-drag scrolling of the creation screen. An earlier check said it did not scroll, but that check used a gesture tool that does not work in this headless browser. With raw touch events the old build scrolls too. touch-action was still loosened while a screen is open, to be safe.

What changed:
- Creation: name, race, class, 10 points (rising cost), starting skill, difficulty, big sticky Confirm. Race change refunds points, resets a class that is not allowed and clears the skill. Class change clears the skill. Confirm saves at once; reload keeps the hero; an old stage 3 save keeps its position and solved rooms.
- Fights: slim name tabs per party member (turn marked with arrow and glow, plus a marker over the hero in the scene). Tap the name: a small tree branches out - Defend, Attack (targets), Spells (list), Items (list), Run. It flips near screen edges, labels at least 44px. Ref-6 style: enemies left, party right, enemy list + party HP/MP list at the bottom; landscape puts the panel on the right.
- Party screen: portrait-plus-panel cards (picture, level/race/class, thin HP and MP bars, stats line, two gear lines). Tap anywhere on a card to open the character sheet.
- Character sheet: figure with square slots on both sides (helmet, chest, gloves, boots, weapon, off-hand, 2 rings, potions count), stats box, backpack as square boxes. Tap item then slot, or slot then item; allowed slots glow, not allowed show a message; stat change preview (+/-). Select-character strip at the top. Two columns in landscape.
- Fight backdrop: painted stone wall (shaded blocks, cracks), arch, flagstone floor, flickering torch light, vignette and frame. Cached, so it costs little per frame.
- sw v6; boot.js reloads on update if there is no hero yet.
- Old tests: they now set the test-only `sota.dev.nofight` switch in their browser setup, so the auto-opened creation screen does not block them; stage 4 tests open the name menu / card before tapping commands. Version strings bumped to v6.
- Tests: `tests/stage4_fix_tests.py`, `tests/mutations4_fix.py`. Screenshots: `tools/shots4fix.py` -> ../stage4-fix-shots/.

PENDING: art finish pass (heroes, monsters, companions, backgrounds). Boss and monster shapes stay simple placeholders.

Not tested: real phone; real installed-app (standalone display mode could not be emulated here, ran as plain browser); real phone keyboard (Playwright keyboard + small viewport only).

## Fight v2 (smaller menu, bigger far-camera scene)
- Menu panel: one-line enemy list, party as 2x2 name tabs (1 column in landscape) with name, hp number and thin hp/mp bars inside each 44px tab. Panel about 108-125px in portrait; landscape uses a slim right strip (about 26%).
- The Defend/Attack/Spells/Items/Run tree now opens inside the menu panel (rows in portrait, columns in landscape) on a solid backing, so it never covers the fight scene. It does cover the HP tabs while open. A 3rd level (Spells > spell > target) keeps the last two rows.
- Scene: horizon at 0.6H, deeper floor, back pillars, wide front pillars, smaller arch, torches on the wall; figures about half their old size; every figure inside the canvas (checked by test).
- New tests: fight_view_v2, fight_tree3 (+6 mutations). Shots: stage4-fix-shots/v2-*.
- PENDING: the sw cache version was not bumped (still v6); a phone with the old v6 cache keeps old files until the next version bump.

## Fight v3 (name tabs top right, slide-in tree, portrait only)
- Party names are slim tabs stacked top right over the scene, with thin HP/MP bars. The member whose turn it is sticks out further left with a gold edge and glow.
- Tapping the active tab slides a decision tree in from the right edge: Defend, Attack > targets, Spells > list, Items > list, Run. Each nested level slides in the same way and has a Back button. Tapping outside closes the tree.
- There is no bottom panel or buttons. The scene is full height, enemy names are small labels over the enemies, and the message line stays at the top.
- Portrait only:
  - manifest orientation is portrait
  - screen.orientation.lock("portrait") is tried
  - a "Turn your phone upright" notice shows when the phone is sideways
  - the landscape fight/sheet CSS was removed
- Service worker v7.
- Changed landscape tests:
  - stage4_fix SIZES dropped 915x412
  - keyboard_viewport dropped 915x412
  - touch_scroll 915x412 is now 360x640
  - stage2 fit_open and marker dropped 915x412
- The sw_autoreload pretend v8 now expects the v8 cache. sw_update also starts from c5b7de7 (v6).
- Old boxed `branch` code is still in party.js but is no longer used in fights.

## Fight v4 (turn rotation, tree beside the name, left arrows)
- The name tabs stack in turn order. The member whose turn it is is always the top tab and sticks out. After acting, that member moves to the bottom with a short shift animation, which is off under reduced motion.
- The tree opens to the left of the active name, starting at its top. Deeper levels open further left, each one beside the choice that opened it.
- On narrow phones (360) the older column slides away, and Back brings it back.
- Arrows ‹ now sit on the left of each label. The active tab shows a ‹ hint while its menu is closed.
- Service worker v8. sw_autoreload now uses a pretend v9, and sw_update also starts from 222db21 (v7).
- Test renames: fight_v3_names is now fight_v4_names and fight_v3_tree is now fight_v4_tree. fight_v4_rotate is new, and mutations4_fix has 7 new v4 mutations.
- fight_branch now taps Back when a narrow phone has slid level 0 away.
