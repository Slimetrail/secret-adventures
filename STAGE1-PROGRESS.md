# Secret of the Adventures - Stage 1 progress (PRIVATE, local only)
Run: `cd stage1-build && python3 -m http.server 8765 --bind 127.0.0.1` then open http://127.0.0.1:8765/
Rebuild maze data: `python3 tools/make-data.py` (reads handoff maze.json; keys "x,y", x=column, y=row, y=64 bottom).
## Done
- Maze data copied into maze-data.js (65x65, zones 1-5, taverns, camps, rooms). No network.
- Software raycaster on a block grid (cells at odd blocks, walls between), textured walls/floor/ceiling, fog, torch flicker + falloff, ink edges, vignette.
- Procedural original textures per zone (tex.js): 1 sandy bricks + cobwebs, 2 mossy stone + vines, 3 damp blue stone + ice crystals, 4 small red brick + embers, 5 dark purple stone + glowing runes/crystals. 6 wall variants per zone picked by cell hash + flips + vertical offsets.
- Floor rings: gold tavern, orange camp, teal treasure, red monster, white story.
- Temporary buttons (up/down bottom-left, turn left/right bottom-right), keyboard arrows/WASD, "i" toggles the debug readout.
- Save of position+facing in localStorage; manifest (fullscreen, any orientation, own icons); sw.js (Dino pattern, updateViaCache none).
- tests/run_tests.py (8 tests), tests/mutations.py (9 mutations, all killed), tests/perf.py, tools/shots.py.
## Next (Stage 2+)
- Real controls, item boxes, map screen, sharper textures (64px texels look blocky up close), zone-border blending of wall textures.
- APK wrapper not attempted (Stage 8).
