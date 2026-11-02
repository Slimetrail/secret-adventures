# Secret of the Adventures - Stage 2 progress (PRIVATE, local only, branch stage2)
Run: `python3 -m http.server 8765 --bind 127.0.0.1` in this folder, open http://127.0.0.1:8765/
Tests: `/workspace/.pwvenv/bin/python tests/run_tests.py` (Stage 1, 8), `tests/stage2_tests.py` (13), `tests/mutations.py` (9), `tests/mutations2.py` (13), `tests/perf.py`. Shots: `tools/shots2.py`.
## Done
- Final-feeling controls: parchment/ink buttons with drawn SVG arrows; up/down bottom-left, turn left/right bottom-right, 4 empty item boxes bottom-centre (2x2 portrait, 1x4 landscape), tap gives press feedback, saved as `sota.items` = [null,null,null,null].
- Map button top-left (48 px), "i" top-right; zone/cell readout ON by default, choice remembered (`sota.hud`).
- map.js: full-screen hand-inked map on cached parchment (stains, torn edge, vignette), jittered ink walls, zone-tinted floors, only visited cells (cached layer, drawn once per new cell), trail dots, blue facing arrow, tent/door/door+red X/mug icons, + / - / recenter buttons, drag pan, pinch zoom, key M toggles.
- Save: position + visited bitset (hex) + trail (start + one char per step, last 4000 steps). Old Stage 1 saves load (visited = current cell); bad map data -> fresh map from current cell.
- sw.js v2 lists map.js; 3D look (tex.js, palette, fog, render) untouched.
- Note: SOTA.teleport (debug only) resets the trail to the new cell.
## Next
- Stage 3 (puzzles) after Jeremy's yes. Items have no function yet. Real-phone test not done.
