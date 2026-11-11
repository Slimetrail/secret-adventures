/* t2476u: every item gets its own original 8-bit pixel icon (inline SVG pixel grids, same style as the t2437u potion bottles).
   No image files and no network. Food, parts, junk and tools are hand-drawn 12x12 character grids (T + MISC below).
   VER 85 redo: gear is drawn by per-family pixel generators (FAM) so look-alikes that differed by one gem pixel are gone:
   each family has its own silhouette, the item's material words pick the main colour, and PICK picks the shape variant.
   SOTA_ICONS.svg(id) gives the markup; SOTA_ICONS.all() is used by the tests to prove every item id has a different icon. */
(function(root){
"use strict";
const T={
 salts:"....KKKK....|....KWWK....|...KKKKKK...|..KGLGGLGK..|..KLGGLGGK..|..KGGLGGLK..|..KAAAAAAK..|..KAMMMMAK..|..KAAAAAAK..|..KGGLGGGK..|..KDDDDDDK..|...KKKKKK...",
 ration:"............|...KKKKKK...|..KMMMMMMK..|.KMLLMMMMDK.|KMMMMAMMMMDK|KAAAAAAAAAAK|KMMMMAMMMMDK|KMMMMAMMMMDK|KDMMMAMMMDDK|.KDDDDDDDDK.|..KKKKKKKK..|............",
 flask:"....KKKK....|....KWWK....|.....KK.....|....KGGK....|...KGGGGK...|..KLMMMMMK..|.KLWMMMMMDK.|.KLMMAMMMDK.|.KMMAGAMMDK.|.KMMMAMMDDK.|..KDDDDDDK..|...KKKKKK...",
 bowl:"............|...A..A..A..|..A..A..A...|............|KKKKKKKKKKKK|KLLMMMMMMMMK|KWLLLMMMMDWK|.KWWWWWWWWK.|..KWWWWWWK..|...KWWWWK...|....KKKK....|............",
 tooth:"............|..KKK..KKK..|.KLLLKKLLMK.|.KLLLLLLLMK.|.KLLLLLLMMK.|.KLLLMLLMDK.|..KLLMMLMDK.|..KLMKKMMDK.|..KLMK.KMDK.|..KLK...KDK.|...KK....K..|............",
 bone:".KK......KK.|KLLK....KLMK|KLLLK..KLLMK|.KLLLKKLLMK.|..KLLLLLMK..|...KLLLMK...|...KLLLMK...|..KLLMLLMK..|.KLLMKKLMMK.|KLLMK..KLMMK|KLMK....KMMK|.KK......KK.",
 scale:".....KK.....|....KLMK....|...KLLMMK...|..KLLMMMDK..|..KLMMMMDK..|.KLMMAMMMDK.|.KLMMAMMMDK.|.KMMMAMMMDK.|..KMMAMMDK..|..KDMMMDDK..|...KDDDDK...|....KKKK....",
 horn:"..........K.|.........KLK|........KLMK|.......KLMK.|......KLMDK.|.....KLMMDK.|....KLMMDK..|...KAMMDK...|..KAAMDK....|.KWAADKK....|.KWWKK......|..KK........",
 gem:"............|...KKKKKK...|..KLLMMMMK..|.KLLMMMMMDK.|KKKKKKKKKKKK|.KLMMGMMMDK.|..KLMMMMDK..|...KMMMDK...|....KMDK....|.....KK.....|............|............",
 loaf:"............|............|...KKKKKK...|..KLLMLLMK..|.KLMKLMKLMK.|.KLMMKMMKMK.|KLMMMMMMMMDK|KMMMMMMMMMDK|KDMMMMMMMDDK|.KDDDDDDDDK.|..KKKKKKKK..|............",
 block:"............|............|...KKKKKKKK.|..KLLLLLLMK.|.KLLLLLLMMK.|KKKKKKKKKMK.|KMMMMMMMKMK.|KMMMMMMMKDK.|KMMMMMMMKK..|KDDDDDDDK...|KKKKKKKKK...|............",
 leaf:".........KK.|.......KKLK.|.....KKLLMK.|....KLLMMMK.|...KLMMAMMK.|..KLMMAMMDK.|..KLMAMMDK..|..KMAMMDK...|..KAMDDK....|.KAKKKK.....|.KK.........|............",
 jar:"...KKKKKK...|...KWWWWK...|..KKKKKKKK..|..KLLMMMMK..|.KLMMMMMMDK.|.KLMMMMMMDK.|.KLMAAAMMDK.|.KLMAGAMMDK.|.KLMAAAMMDK.|.KMMMMMMDDK.|..KDDDDDDK..|...KKKKKK...",
 berries:".....KK.....|....KAAK....|...KAKKAK...|..KK.KK.KK..|.KLMKKKLMK..|.KMMDKLMMDK.|..KDKLMMMDK.|..KLMKDDDK..|.KLMMDKKK...|.KMMMDK.....|..KDDK......|...KK.......",
 egg:"....KKKK....|...KLLMMK...|..KLLMMMMK..|..KLMMMMMK..|.KLMMMMMMDK.|.KLMMAMMMDK.|.KLMMMMAMDK.|.KMMAMMMMDK.|.KMMMMMMDDK.|..KMMMMDDK..|...KDDDDK...|....KKKK....",
 mushroom:"...KKKKKK...|..KLMAMMMK..|.KLMMMMAMDK.|KLAMMMMMMMDK|KMMMMAMMMDDK|KKKKKKKKKKKK|....KWWK....|....KWWK....|....KWWK....|...KWWWWK...|...KKKKKK...|............",
 sack:"....K..K....|.....KK.....|....KAAK....|...KMMMMK...|..KLMMMMMK..|.KLMMMMMMDK.|.KLMMGGMMDK.|.KLMGGGGMDK.|.KMMMGGMMDK.|.KMMMMMMDDK.|..KDDDDDDK..|...KKKKKK...",
 roots:"....KKKK....|...KAAAAK...|....KAAK....|...KLMMDK...|...KLMMDK...|..KLMKMMDK..|..KMK.KMDK..|.KMK..KMK...|.KMK...KMK..|KMK....KMK..|KK......KK..|............",
 meat:"............|...KKKKK....|..KLLMMMK...|.KLMMAMMMK..|.KLMAMMMMDK.|.KMMMMAMMDK.|.KMMAMMMMDK.|..KMMMMMDK..|...KDDDDKWK.|....KKKKWWWK|.......KWWK.|........KK..",
 pepper:".......KK...|......KAK...|.....KAAK...|...KKKKK....|..KLMMMMK...|.KLMMMMMDK..|.KLMMMMMDK..|.KMMMMMMDK..|..KMMMMDK...|...KMMDK....|....KMK.....|.....K......",
 fish:"............|.......KKK..|....KKKMMK..|..KKLLLMMDK.|.KLGLLMMMMDK|KLLLLMMMMMK.|KMMMMMMMDK.K|.KMMMMMDDKK.|..KKDDDDK.KK|....KKKK...K|............|............",
 jug:"...KKKKK....|...KLLLK....|..KKKKKKK...|..KLLMMMKKK.|.KLLMMMMKMK.|.KLMMMMMKMK.|.KLMMMMMKMK.|.KLMMMMMKK..|.KLMMMMMK...|.KMMMMMDK...|..KDDDDK....|...KKKK.....",
 drumstick:"...KKKK.....|..KLLMMK....|.KLMMMMMK...|.KLMMMMMDK..|.KMMMMMMDK..|.KMMMMMDDK..|..KMMMDDK...|...KDDKWK...|.....KWWKK..|.....KKWWWK.|.......KWWK.|........KK..",
 beans:"............|..KKK.......|.KLMMK..KKK.|.KMMDK.KLMMK|..KKK..KMMDK|.....KKKKKK.|....KLMKLMK.|....KMDKMDK.|.KKK.KK.KK..|KLMMK.......|KMMDK.......|.KKK........",
 seaweed:"..K.....K...|.KMK...KMK..|.KMK..KMK...|..KMK.KMK.K.|..KMK..KMKMK|.KMK..KMK.MK|.KMK..KMKKMK|..KMK..KMKMK|..KMK.KMK.K.|.KMK..KMK...|.KDK..KDK...|.KKK..KKK...",
 fruit:".....KK.....|....KAK.....|...KKKKK....|..KLLMMMK...|.KLLMMMMMK..|KLLMMMMMMDK.|KLMMMMMMMDK.|KMMMMMMMMDK.|.KMMMMMMDK..|..KMMMMDK...|...KKKKK....|............",
 cheese:"............|.........KK.|.......KKLK.|.....KKLLLK.|...KKLLLLLK.|.KKLLLLLLLK.|KKKKKKKKKKK.|KMMDMMMMDMK.|KMMMMDMMMMK.|KMDMMMMMDMK.|KKKKKKKKKKK.|............",
 star:".....KK.....|....KLMK....|....KLMK....|KKKKLMMMKKKK|KLLLMMMMMMDK|.KLMMAAMMDK.|..KLMAAMDK..|..KLMMMMDK..|.KLMMKKMMDK.|.KLMK..KMDK.|.KKK....KKK.|............",
 plate_food:"............|............|....KKKK....|...KAAAAK...|..KAALAAAK..|..KAAAAAAK..|KKKKKKKKKKKK|KLLLLLLLLLMK|.KMMMMMMMMK.|..KKKKKKKK..|............|............",
 mug:"....A..A....|...A..A.....|............|.KKKKKKKK...|.KAAAAAAKKK.|.KLMMMMMK.K.|.KLMMMMMK.K.|.KLMMMMMKKK.|.KLMMMMMK...|.KMMMMMDK...|..KDDDDK....|...KKKK.....",
 pie:"............|............|...KKKKKK...|..KAKAKAAK..|.KAAKAAKAAK.|KLLLLLLLLLMK|KMMMMMMMMMDK|.KMMMMMMMDK.|..KKKKKKKK..|............|............|............",
 skewer:"..........KK|.........KWK|......KKKWK.|.....KLMKK..|....KLMMDK..|...KKKMDKK..|..KLMKKKMK..|..KMMDK.KK..|.KWKDK......|KWK.K.......|KK..........|............",
 strip:"............|.KKK........|KLMMKK......|KMMMMMKK....|.KMAMMMMKK..|..KKMMAMMMK.|....KKMMMMDK|......KKMDDK|........KKK.|............|............|............",
 spool:".KKKKKKKKKK.|.KWWWWWWWWK.|..KKKKKKKK..|..KLLLMMMK..|..KLMLMLMK..|..KLLMLMMK..|..KLMLMLMK..|..KLLMLMMK..|..KKKKKKKK..|.KWWWWWWWWK.|.KKKKKKKKKK.|............",
 shell:"............|....KKKK....|...KLLMMK...|..KLKLMKMK..|.KLMKLMKMDK.|.KLMKMMKMDK.|KLMMKMMKMMDK|KMMMKMMKMMDK|KKKKKKKKKKKK|...KDDDDK...|....KKKK....|............",
 shard:"......K.....|.....KLK....|.....KLMK...|....KLLMK...|....KLMMDK..|...KLLMMDK..|...KLMMMDK..|..KLLMMDDK..|..KLMMMDK...|..KKMMDK....|....KKK.....|............",
 hide:".KK......KK.|KMMKKKKKKMMK|.KMMMMMMMMK.|..KLMMMMMK..|..KLMAMMMK..|..KMMMAMMK..|..KLMAMMMK..|..KMMMMMDK..|.KMMMMMMMDK.|KMMKKKKKKMDK|.KK......KK.|............",
 ear:"....KKKK....|...KLLMMK...|..KLMKKMDK..|..KLK..KMK..|..KLK.KAMK..|..KLKKAMDK..|...KLMMDK...|...KLMDK....|...KLMK.....|...KLMK.....|...KKK......|............",
 fang:"............|.KKKKKKKKK..|KLLLLLLLMMK.|.KLLLLLLMK..|..KLLLLMK...|...KLLLMK...|...KLLMK....|....KLMK....|....KLK.....|.....KK.....|............|............",
 feather:".........KK.|........KLLK|.......KLLMK|......KLLMK.|.....KLLMK..|....KLAMMK..|...KLAMMK...|..KLAMMK....|..KAMMK.....|.KAKKK......|.KK.........|............",
 claw:"............|..K....K....|.KLK..KLK...|.KLMK.KLMK..|..KLMKKLMK..|...KLMKLMK..|...KLMMLMK..|..KMMMMMMDK.|.KMMMMMMMDK.|.KDMMMMMDK..|..KKKKKKK...|............",
 lockpick:"............|.KK.KK......|KLMKLMK.....|KMKKMK......|.KK.KK......|..KK.KK.....|...KK.KK....|....KK.KK...|.....KAKAK..|......KKAKK.|.......KKAK.|.........KK.",
 rope:"............|...KKKKKK...|..KMLMLMMK..|.KMK....KMK.|.KLK.KK.KLK.|.KMK.KMKKMK.|.KLK..KKKLK.|.KMK....KMK.|..KMLMLMMK..|...KKKKKMK..|........KMK.|.........KK.",
 tent:"............|.....KK.....|....KLMK....|...KLLMMK...|...KLLMMK...|..KLLKKMMK..|..KLKAAKMK..|.KLLKAAKMMK.|.KLKAAAAKMK.|KLLKAAAAKMMK|KKKKKKKKKKKK|............",
 vial:".....KK.....|.....KWK....|....KKKK....|....KGGK....|...KMMMMK...|..KMLAMAMK..|..KMAAAAMK..|..KMMAAMMK..|..KMAMMAMK..|..KDMMMMDK..|...KDDDDK...|....KKKK....",
 // t2476u touch-up (VER 86): every plate dish has its own dish shape, so they read apart in greyscale at 22px
 toast_board:"..KKKK......|.KAAAAK.....|KALLLLAKKK..|KALLLLAKAAK.|KALMLLAKLLAK|KALLLLAKLLAK|KALLLMAKMLAK|KALLLLAKLLAK|KKKKKKKKKKKK|KWWWWWWWWWDK|KKKKKKKKKKKK|............",
 egg_skillet:"............|............|..KKKKKK....|.KDDDDDDK...|KDLLLLLLDK..|KDLLAALLDKKK|KDLLAAMLDWWK|KDLLLLLLDKKK|KDDLLLLDDK..|.KDDDDDDK...|..KKKKKK....|............",
 fowl_platter:".KK......KK.|KWWK....KWWK|.KWK....KWK.|..KAKKKKAK..|.KAMMLLMMAK.|KAMLLMMMMMDK|KMMMMMMMMMDK|KDMMMMMMMDDK|KKKKKKKKKKKK|KLLLLLLLLLGK|.KGGGGGGGGK.|..KKKKKKKK..",
 fish_platter:"............|............|............|....KKKKK...|..KKLLLMMK.K|.KLGLLMMMMKA|KLLLMMMMMMAA|.KMMMMMMMDKA|..KKDDDDKK.K|KKKKKKKKKKKK|KWWWWWWWWWWK|.KKKKKKKKKK.",
 omelette_tray:"............|............|............|..KKKKKKKK..|.KLLLLLLMMK.|.KLLALLMMDK.|KKKKKKKKKKKK|KWKGGGGGGKWK|KKKGGGGGGKKK|..KKKKKKKK..|............|............",
 steak_board:"KKK.........|KWWK........|KWWWKKKKK...|.KWKMMMLMK..|..KMMLLWWMK.|..KMLMWWLMDK|..KMMMMWMMDK|..KDMMMMMMDK|...KDMMMMDWK|....KDDDDWWK|.....KKKKKKK|............",
 banquet_stand:"...KKKKKK...|..KAAGAAAK..|.KAAAAAGAAK.|KKKKKKKKKKKK|KLLLLLLLLMDK|.KMMMMMMMDK.|..KKKMDKKK..|....KMDK....|....KLDK....|...KLMMDK...|..KLMMMMDK..|..KKKKKKKK.."
};
// t2437u bottle (12x14), kept pixel-for-pixel for the Healing potion (red) and Mana potion (blue)
const BOTTLE="....KKKK....|....KCCK....|....KCCK....|...KKKKKK...|....KGGK....|...KGGGGK...|..KLLLLLLK..|.KLWLLLLLDK.|.KLWLLLLLDK.|.KLLLLLLLDK.|.KLLLLLLLDK.|.KDLLLLLDDK.|..KDDDDDDK..|...KKKKKK...";
const BOT={potion:{K:"#2b1a0e",C:"#9a6a3a",G:"#d9eef0",L:"#d8343a",D:"#8e1b22",W:"#ffd2c8"},ether:{K:"#2b1a0e",C:"#9a6a3a",G:"#d9eef0",L:"#3a6ee0",D:"#1d3b8e",W:"#d6e4ff"}};
const K="#1e140c";
// hand-picked look for every non-gear item: [template, L, M, D, A, W, G]
const MISC={
 salts:["salts","#ffffff","#d8d0e8","#8a80a0","#c84a6a","#9a6a3a","#f0f4ff"],ration:["ration","#f0dcb0","#c8a46a","#7a5a2e","#7a3a1a"],
 c_elixir:["flask","#e8e0ff","#b47ae8","#5a2e8e","#ffe08a","#9a6a3a","#d9eef0"],c_stew:["bowl","#f0b070","#b8642a","#6a3010","#e8e8e8","#7a4a22"],
 j_tooth:["tooth","#fffbe8","#e0d6b0","#9a8a60"],j_bone:["bone","#f4ecd0","#cfc29a","#8a7e5a"],j_scale:["scale","#c8d0c0","#8a9a88","#4e5a4c","#6a7868"],
 j_horn:["horn","#e8dcc0","#b09a70","#6a5a3a","#8a7a5a","#5a4a30"],j_gem:["gem","#e0e0e8","#a8a8b8","#606070","#8a8a9a","#8a8a9a","#c8c8d8"],
 i_bread:["loaf","#f4d08a","#d09a4a","#8a5a20"],i_butter:["block","#fff6b0","#f0d860","#b09a30"],i_herbs:["leaf","#b8f08a","#4aa83a","#1e5a1a","#2e7a2a"],
 i_water:["jar","#e0f4ff","#7ac0f0","#2e70b0","#b8e0ff","#9a6a3a","#ffffff"],i_berries:["berries","#e88aa8","#b8304a","#6a1028","#3a8a2a"],
 i_honey:["jar","#fff0a0","#f0b030","#a0660a","#ffd860","#9a6a3a","#fff8d0"],i_egg:["egg","#ffffff","#f0e8d8","#b8a890","#d8c8b0"],
 i_mushroom:["mushroom","#ffb0a0","#d8402a","#8a1a10","#fff4e0","#f0e0c0"],i_salt:["sack","#f4ecd8","#d0c4a0","#8a7e5a","#a07a4a","#000","#ffffff"],
 i_roots:["roots","#e8c48a","#b0804a","#6a4420","#5aa83a"],i_sage:["leaf","#d8e8c8","#8aa880","#4a6a44","#6a8a60"],
 i_meat:["meat","#ffa8a0","#d04a48","#801c20","#f0d0c8","#f4ecd8"],i_pepper:["pepper","#a8f08a","#3a9a2a","#1a5a14","#6a4a1a"],
 i_fish:["fish","#d8ecf8","#7aa8c8","#3a6a8a","#000","#000","#1e140c"],i_flour:["sack","#ffffff","#e8e0d0","#a89a80","#c8a060","#000","#f4ecd8"],
 i_oats:["sack","#f4e0b0","#c8a870","#7a6030","#8a6a3a","#000","#e8c880"],i_milk:["jug","#ffffff","#e8eef4","#9aa8b8"],
 i_spice:["sack","#f8c890","#c87838","#7a3a10","#a82a1a","#000","#e85a2a"],i_moonleaf:["leaf","#e8f4ff","#9ab8e8","#4a6aa8","#c8d8ff"],
 i_fowl:["drumstick","#f8d8b8","#e0a878","#a06a3a","#000","#f4ecd8"],i_ironflour:["sack","#e0e4e8","#9aa4ac","#5a646c","#6a7480","#000","#c8ccd0"],
 i_firepepper:["pepper","#ffb080","#e83a1a","#8a1408","#3a8a2a"],i_beans:["beans","#e8b890","#a8603a","#5a2a14"],i_seaweed:["seaweed","#8ad8a8","#2a8a5a","#0e4a2a"],
 i_lemon:["fruit","#fff8b0","#f0e040","#a89a10","#4aa83a"],i_cream:["jug","#fffbe8","#f4ecc8","#b8a880"],i_cheese:["cheese","#fff0a0","#f0c840","#b08a10"],
 i_starfruit:["star","#fff4a0","#f0c020","#a87a08","#ffe8a0"],i_griffinegg:["egg","#fff4d8","#e8c890","#a07a40","#8a5a2a"],
 i_hydrascale:["scale","#b8f0e0","#3ab8a0","#14685a","#0e4a40"],i_dragonmeat:["meat","#ffb070","#c83a1a","#701408","#ffd040","#f4ecd8"],
 d_toast:["toast_board","#f4d08a","#d8a050","#7a5a2e","#b8702a","#9a6634"],d_broth:["bowl","#c8e8a0","#8ab860","#4a7a2a","#e8e8e8","#8a5a2a"],
 d_mash:["bowl","#e8a0c8","#b84a8a","#6a1a4a","#e8e8e8","#6a4a8a"],d_egg:["egg_skillet","#ffffff","#e8e8e0","#4a4a52","#f8c020","#8a5a2e"],
 d_skewer:["skewer","#e8b090","#a8603a","#5a2a14","#000","#b08a5a"],d_stew:["bowl","#e8a868","#a8602a","#5a2a10","#e8e8e8","#4a6a8a"],
 d_tea:["mug","#e8c890","#a87a3a","#5a3a14","#c8e8a0"],d_jerky:["strip","#d89070","#8a3a20","#4a1a0a","#c8603a"],
 d_pie:["pie","#f8d8a0","#d8a050","#8a5a20","#e8b060"],d_porridge:["bowl","#f8ecd0","#e0c890","#a08a50","#e8e8e8","#a8603a"],
 d_moon:["bowl","#e8f0ff","#a8c0f0","#5a70b0","#e8e8e8","#3a3a6a"],d_fowl:["fowl_platter","#ffffff","#c87838","#7a4018","#a85a28","#f4ecd8","#b8b0a0"],
 d_ironbread:["loaf","#d8dce0","#9aa0a8","#5a606a"],d_chili:["bowl","#ff9a6a","#d0301a","#7a1008","#ffd0a0","#3a2a2a"],
 d_seafeast:["fish_platter","#e8f4ff","#7aa8c8","#3a6a8a","#5ab8a8","#4a7aa8","#1e140c"],d_tart:["pie","#fff4c0","#e8c860","#a08a20","#f0a020"],
 d_omelette:["omelette_tray","#f8e888","#e0c040","#a08a20","#5aa83a","#8a5a2e","#c8a060"],d_hydra:["bowl","#a8f0d8","#2ab090","#0e6050","#e8e8e8","#2a4a4a"],
 d_steak:["steak_board","#e86a50","#a8301a","#5a1408","#000","#f4ecd8"],d_banquet:["banquet_stand","#c8f4ff","#3ab8d8","#1a6a88","#f0c040","#8a5a2e","#e8343a"],
 p_silk:["spool","#ffffff","#e0dcea","#a09ab0","#000","#8a6a3a"],p_shell:["shell","#c8e8a0","#6a9a3a","#34561a"],p_shard:["shard","#fff6dc","#e2d3a8","#a89466"],
 p_hide:["hide","#e8b080","#a8683a","#603818","#7a4a22"],p_ear:["ear","#c8f0a0","#6ab84a","#2e6a1e","#e88a8a"],p_pelt:["hide","#d8d8e0","#8a8a98","#4a4a58","#5a5a6a"],
 p_fang:["fang","#fffbe8","#e8dcc0","#a89870"],p_feather:["feather","#fff8e0","#e8c060","#a07a20","#c87838"],p_horn:["horn","#f0e0c0","#a87a48","#5a3a18","#e8c070","#3a2a1a"],
 p_dscale:["scale","#ffb080","#d84a2a","#7a1a0a","#ffd040"],p_claw:["claw","#f4ecd8","#c0b090","#6a5a40"],
 lockpick:["lockpick","#e6ebef","#a9b4bd","#5f6b75","#e8c070"],rope:["rope","#f0d8a0","#c09a5a","#7a5a2a"],tent:["tent","#f0e0b0","#c8a060","#7a5a2a","#3a2a1a"],
 x_poison:["vial","#c8ffa0","#5ac83a","#2a6a1a","#a8f060","#9a6a3a","#e8e8e8"],x_stink:["bowl","#c8d890","#8a9a3a","#4a5a1a","#a8c040","#6a5a3a"],
 x_badhp:["bowl","#d8b0a0","#9a6a5a","#5a3a30","#8a8a6a","#5a4a3a"],x_badmp:["flask","#a8a0b8","#5a5070","#2a2438","#6a6a5a","#6a5a3a","#8a8a9a"],
 x_badsta:["meat","#c8a898","#8a6a5a","#4a3028","#6a5a4a","#d8d0c0"]};
const WOOD="#8a5a2e";
// t2476u redo (VER 85): gear icons are drawn by small pixel generators, one per item family, so every family has its own
// silhouette and each family has many shape variants (blade length, guard, head, cut, sleeves, toe, stone, ...).
// The material words in the item's name pick the main colour (worn = dull brown, iron = steel grey, runic = blue glow,
// shard = purple crystal, ...). PICK (made offline by icons-fix-run/tools/optimize.js) says which shape variant and gem colour
// each item uses so that no two icons are look-alikes at 22px; items not in PICK fall back to a hash.
const MAT=[
 [/deep[- ]?crystal/,"#8aa8ff","#2f52c8","#182a78","#9ad8ff"],[/heart[- ]?crystal/,"#ffb0c8","#e0507e","#8a1e44","#ffe0ea"],
 [/crystal/,"#e4fdff","#6fd8ec","#2a8aa8","#ffffff"],[/wayfarer/,"#f0d0a0","#b8885a","#6a4626","#3a70c0"],
 [/verdant/,"#c8f5a0","#5ab040","#2a6a20","#f0e060"],[/moonsteel/,"#f0f6ff","#b0c4ec","#6070a8","#ffffff"],
 [/runic|rune/,"#a8d0ff","#3a78e8","#1a3a8a","#60ffff"],[/glass/,"#ffffff","#c8f4f0","#6aaab0","#9ae8ff"],
 [/shard/,"#e0b8ff","#9a50e0","#52208a","#f0d8ff"],[/prism/,"#ffc8f4","#e050c0","#8a1a78","#60f0ff"],
 [/facet/,"#d0fff0","#50e0a8","#1a8a5e","#ffffff"],[/core/,"#ffb070","#e84818","#8a1e06","#ffd040"],
 [/bright/,"#ffffff","#f4ecc0","#b0a060","#ffe040"],[/glow|light/,"#fff8b0","#f8d838","#a88a10","#ffffff"],
 [/heartstring/,"#ffa0a0","#d83040","#7a1020","#ffd0d0"],[/veil/,"#e8e0f8","#b0a0d0","#605080","#ffffff"],
 [/facade/,"#f0dcb0","#c8a868","#7a6030","#8a8a8a"],[/glyph/,"#b8b0ff","#5a48d0","#281e78","#ffe060"],
 [/sigil/,"#f0a0e0","#a83a98","#581850","#ffe060"],[/warding/,"#a0fff0","#20b0a0","#0e5a52","#ffffff"],
 [/etched/,"#d8e4f0","#7890a8","#3a4a5e","#60c0ff"],[/moon/,"#f8f8ff","#c8d0f8","#7880c0","#fff0a0"],
 [/palewood/,"#fff4d8","#e0cca0","#9a8458","#b0d080"],[/silver|pale/,"#ffffff","#d4d8e0","#808894","#a0d0ff"],
 [/ember|fire|flame/,"#ffd08a","#f07a28","#9a2e10","#ffe060"],[/griffin|gold/,"#fff0a0","#e0b030","#8e6a10","#ffffff"],
 [/gargoyle/,"#a8a4b0","#6a6670","#36343c","#a0e060"],[/stone/,"#e0dcd0","#a8a294","#625e54","#6a6458"],
 [/bone|rib|skull/,"#fffbe8","#e8dcb4","#a89466","#8a7a5a"],[/horn/,"#e8d0a0","#b88a50","#6a4a22","#f0e0c0"],
 [/drake/,"#ffa080","#c83a22","#6a140a","#ffd040"],[/hydra/,"#a0f0d8","#2ab090","#0e6050","#e0ffe0"],
 [/harpy/,"#f0c8b8","#b07868","#604036","#f0e0c0"],[/scale/,"#ffe0a0","#d49a3a","#8a5a1a","#6a4a1a"],
 [/grave/,"#c0b8d0","#7a7090","#3e3850","#a0e0c0"],[/hollow/,"#a8c0c0","#5e7a7c","#2e3e40","#e0f0a0"],
 [/shadow|night/,"#6a5a88","#3a2e52","#1a1428","#c080ff"],[/silent|quiet|hidden/,"#8a9ab8","#4a5878","#22283a","#e0e8ff"],
 [/greeniron|moss[- ]iron/,"#c8dcc0","#7c9a78","#3e5a3c","#a8b4bd"],[/moss/,"#c8d070","#7a8a2a","#3e4a10","#a8e060"],
 [/thorn|briar|vine/,"#8ad890","#2e8a40","#124a1c","#e04a6a"],[/fairy/,"#ffd8ff","#e8a0e8","#a050a8","#a0ffe0"],
 [/goblin/,"#e0f080","#a0c030","#507010","#8a5a2e"],[/green|leaf|forest|meadow/,"#c8f5a0","#5ab040","#2a6a20","#f0e060"],
 [/maze/,"#b0c8a0","#6a8a5a","#34482a","#c8a060"],[/yew/,"#e0b070","#a86a2a","#5a3410","#3a8a2a"],
 [/bark|root/,"#b89870","#74583a","#3e2c1a","#6aa040"],[/ash/,"#d0ccc8","#8c8884","#4a4644","#e8641a"],
 [/oak|wood|knot|walking/,"#d8a868","#9a6634","#553214","#c8c070"],[/copper|scrap|rust/,"#f8b888","#c0622a","#6e3010","#4a8a7a"],
 [/cave/,"#a0a8b4","#5c6470","#2c3038","#e0c070"],[/trail|camp|travel|scavenger/,"#e8c890","#a07848","#5c4020","#c84a2a"],
 [/hunt|sinew|wolf/,"#c8b8a8","#8a7666","#4a3c32","#e0d0b0"],[/silk/,"#ffffff","#e8e0f0","#a098b0","#c84a6a"],
 [/worn|nicked|cracked|split|dented|patched|bent|scorched/,"#b0a490","#7e705c","#463c30","#5a4a3a"],
 [/iron|steel|rivet|heavy|notch/,"#e6ebef","#a9b4bd","#5f6b75","#c8a050"]];
const DEF={cloth:["#f3e6c8","#c9b48a","#8a7552","#8a3a3a"],leather:["#e2b07a","#9c6233","#5e3816","#e8c070"],metal:["#e6ebef","#a9b4bd","#5f6b75","#c8a050"],
 wood:["#d8a868","#9a6634","#553214","#c8c070"],tome:["#e8a070","#a83a2a","#5a1a14","#f0d060"],gold:["#fff0a0","#e0b030","#8e6a10","#ffffff"]};
const FDEF={robe:"cloth",hood:"cloth",wraps:"cloth",vest:"leather",softboot:"leather",tome:"tome",bow:"wood",staff:"wood",ring:"gold",necklace:"gold",pendant:"gold",charm:"gold"};
const GEMS=["#e8343a","#3a6ee0","#3ac85a","#f0c020","#b04ae0","#20d0d0","#ff7a2a","#ff5ab0","#ffffff","#7a2a1a","#2a8a5a","#5a3ab0","#c8e840","#4ab0ff","#e8a0ff","#a0a0a0"];
const WOODS=[[/yew/,"#a86a2a"],[/palewood|pale/,"#e0cca0"],[/bark|root/,"#74583a"],[/ash/,"#8c8884"],[/green/,"#6a8a3a"],[/oak|knot|walking|camp|bent/,"#9a6634"]];
function mx(v,rad){const o=[];for(const r of rad){o.push(v%r);v=Math.floor(v/r);}return o;}
function Grid(){this.c=[];for(let y=0;y<12;y++)this.c.push(new Array(12).fill("."));}
Grid.prototype.p=function(x,y,ch){if(x>=1&&x<=10&&y>=1&&y<=10)this.c[y][x]=ch;return this;};
Grid.prototype.r=function(x,y,w,h,ch){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)this.p(i,j,ch);return this;};
Grid.prototype.s=function(y,x0,x1,ch){for(let x=x0;x<=x1;x++)this.p(x,y,ch);return this;};
Grid.prototype.ln=function(x0,y0,x1,y1,ch){const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx-dy;
 for(;;){this.p(x0,y0,ch);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>-dy){e-=dy;x0+=sx;}if(e2<dx){e+=dx;y0+=sy;}}return this;};
Grid.prototype.pts=function(a,ch){for(const [x,y] of a)this.p(x,y,ch);return this;};
Grid.prototype.ell=function(cx,cy,rx,ry,ch,hollow){for(let y=1;y<=10;y++)for(let x=1;x<=10;x++){const d=((x-cx)/rx)**2+((y-cy)/ry)**2;
 const t=hollow===true?1:hollow||0;if(d<=1.15&&(!t||((x-cx)/(rx-t))**2+((y-cy)/(ry-t))**2>1.15))this.p(x,y,ch);}return this;};
Grid.prototype.at=function(x,y){return x<0||x>11||y<0||y>11?".":this.c[y][x];};
Grid.prototype.edge=function(ch){const e=[];for(let y=1;y<=10;y++)for(let x=1;x<=10;x++)if(this.c[y][x]==="M"&&[[0,-1],[0,1],[-1,0],[1,0]].some(([a,b])=>this.at(x+a,y+b)==="."))e.push([x,y]);return this.pts(e,ch);};
Grid.prototype.flip=function(){this.c=this.c.map(r=>r.slice().reverse());return this;};
Grid.prototype.done=function(){const c=this.c,o=c.map(r=>r.slice()),E=(x,y)=>this.at(x,y)===".";
 for(let y=0;y<12;y++)for(let x=0;x<12;x++)if(c[y][x]==="M"){const t=E(x,y-1),b=E(x,y+1),l=E(x-1,y),r=E(x+1,y);
  if((l&&r)||(t&&b))continue;if(t||l)o[y][x]="L";else if(b||r)o[y][x]="D";}
 for(let y=0;y<12;y++)for(let x=0;x<12;x++)if(c[y][x]==="."&&[[0,-1],[0,1],[-1,0],[1,0]].some(([a,b])=>{const q=this.at(x+a,y+b);return q!=="."&&q!=="K";}))o[y][x]="K";
 return o.map(r=>r.join(""));};
const FAM={
 sword:{n:288,g(v){const [path,len,wid,guard,tip,fl]=mx(v,[2,3,3,4,2,2]),g=new Grid(),N=[4,6,7][len],pts=[];let x=4,y=7;
  for(let t=0;t<N;t++){pts.push([x,y]);if(path&&t%2)x++;else{x++;y--;}}
  const off=[[[0,0]],[[0,0],[1,0]],[[0,0],[1,0],[0,1]]][wid];
  pts.forEach(([a,b],i)=>{for(const [dx,dy] of (i===N-1&&!tip?[[0,0]]:off))g.p(a+dx,b+dy,"M");});
  if(guard===0)g.pts([[2,7],[4,9],[1,6],[5,10],[3,8]],"A");else if(guard===1)g.s(8,1,5,"A");else if(guard===2)g.r(2,7,3,3,"A").p(3,8,"G");else g.pts([[2,7],[4,9],[3,8]],"A").pts([[1,7],[5,9]],"G");
  g.p(2,9,"W").p(1,10,"G");if(fl)g.flip();return g.done();}},
 dagger:{n:192,g(v){const [bw,top,gw,gs,pm,cv,fl]=mx(v,[3,2,2,2,2,2,2]),g=new Grid(),xs=[[5],[5,6],[4,5,6]][bw],yt=[2,4][top];
  for(let y=yt;y<=6;y++){const sh=cv&&y<yt+2?1:0,row=y===yt&&xs.length>1?[xs[xs.length>2?1:1]]:xs;for(const x of row)g.p(x+sh,y,"M");}
  const w=[3,7][gw],x0=5-(w>>1);g.s(7,x0,x0+w-1,"A");if(gs)g.p(x0,6,"A").p(x0+w-1,6,"A");
  g.p(5,8,"W").p(5,9,"W");if(pm)g.s(10,4,6,"A").p(5,10,"G");else g.p(5,10,"G");if(fl)g.flip();return g.done();}},
 axe:{n:64,g(v){const [hd,dbl,len,wrap,fl]=mx(v,[4,2,2,2,2]),g=new Grid(),hx=4,top=[1,3][len];g.ln(hx,top,hx,10,"W");if(wrap)g.p(hx,8,"A").p(hx,9,"A");
  const S=[[[1,2],[1,4],[1,4],[1,4],[1,2]],[[1,4],[1,4],[1,4],[1,4]],[[1,3],[1,3],[1,2]],[[1,3],[1,3],[1,2],[1,3],[1,5],[1,5]]][hd];
  S.forEach(([a,b],i)=>{const y=top+i;for(let d=a;d<=b;d++){g.p(hx+d,y,"M");if(dbl&&d<=3)g.p(hx-d,y,"M");}});g.p(hx,top,"A").p(hx+2,top+1,"G");if(fl)g.flip();return g.done();}},
 mace:{n:48,g(v){const [hd,dg,fl,gm]=mx(v,[6,2,2,2]),g=new Grid(),[cx,cy]=dg?[7,4]:[5,3];
  if(dg)g.ln(2,10,cx-1,cy+2,"W");else g.ln(cx,cy+2,cx,10,"W");
  if(hd===0)g.ell(cx,cy,2,2,"M");else if(hd===1)g.r(cx-1,cy-1,3,3,"M").pts([[cx,cy-2],[cx,cy+2],[cx-2,cy],[cx+2,cy]],"A");
  else if(hd===2)g.r(cx-3,cy-1,7,3,"M").s(cy,cx-3,cx+3,"A");else if(hd===3){for(let d=-2;d<=2;d++)g.s(cy+d,cx-(2-Math.abs(d)),cx+(2-Math.abs(d)),"M");g.pts([[cx-3,cy],[cx+3,cy]],"A");}
  else if(hd===4){g.s(cy-2,cx-2,cx+2,"M").s(cy-1,cx-2,cx+2,"M").s(cy,cx-1,cx+1,"M").s(cy+1,cx-1,cx+1,"M");}
  else g.r(cx-1,cy-1,3,3,"M").pts([[cx-2,cy-2],[cx+2,cy-2],[cx-2,cy+2],[cx+2,cy+2]],"A");
  if(gm)g.p(cx,cy,"G");if(fl)g.flip();return g.done();}},
 staff:{n:64,g(v){const [hd,dg,sm,fl]=mx(v,[8,2,2,2]),g=new Grid(),sh=sm?"A":"W";if(hd===3||hd===5||hd===7)return FAM.staff.x({3:"hex",5:"knob",7:"burst"}[hd],dg,sm,fl);
  if(dg)g.ln(2,10,5,5,sh);else g.ln(5,4,5,10,sh);
  [()=>g.r(4,1,3,3,"M").p(5,2,"G"),()=>g.pts([[5,1],[4,2],[5,2],[6,2],[4,3],[5,3],[6,3],[5,4]],"M").p(5,2,"G"),
   ()=>g.ln(5,4,5,2,sh).pts([[6,1],[7,1],[8,2],[8,3]],sh).p(8,4,"G"),()=>g.pts([[3,1],[3,2],[4,3],[7,1],[7,2],[6,3],[5,3]],"M").p(5,2,"G"),
   ()=>g.pts([[4,1],[5,1],[6,1],[3,2],[7,2],[3,3],[7,3],[4,4],[5,4],[6,4]],"M").p(5,2,"G").p(5,3,"G"),()=>g.pts([[3,1],[3,2],[4,3],[5,3],[6,3],[7,2],[7,1]],"M").p(5,2,"G"),
   ()=>g.pts([[5,1],[5,2],[5,3],[3,2],[4,2],[6,2],[7,2]],"M").p(5,2,"G"),()=>g.pts([[3,1],[3,2],[5,1],[5,2],[7,1],[7,2]],"M").s(3,3,7,"M")][hd]();
  if(fl)g.flip();return g.done();},
  // VER 86 touch-up: thick (2 px) shaft and a big head of its own; also replaces the old fork heads (hd 3, 5, 7)
  x(h,dg,sm,fl,mat){const g=new Grid(),sh=mat?"M":sm?"A":"W",H=SHEAD[h],x0=dg?3:2,hb=H.length;
   if(dg){g.ln(1,10,4,hb+1,sh).ln(2,10,5,hb+1,sh).ln(2,9,5,hb+1,sh);}else g.r(5,hb+1,2,10-hb,sh);
   H.forEach((row,j)=>{for(let i=0;i<row.length;i++)if(row[i]!==".")g.p(x0+i,1+j,row[i]);});
   if(fl)g.flip();return g.done();}},
 bow:{n:64,g(v){const [sh,ar,gp,fl,th]=mx(v,[4,2,2,2,2]),g=new Grid();
  const L=[[0,[5,4,3,2,2,2,2,3,4,5],6],[0,[7,5,3,2,2,2,2,3,5,7],6],[0,[4,3,3,2,2,2,2,3,3,4],5],[1,[5,3,2,2,2,2,3,5],6]][sh],y0=1+L[0];
  g.ln(L[2],y0,L[2],y0+L[1].length-1,"S");L[1].forEach((x,i)=>{g.p(x,y0+i,"M");if(th&&i>1&&i<L[1].length-2)g.p(x+1,y0+i,"M");});
  if(gp)g.p(L[1][4],y0+4,"A").p(L[1][5],y0+5,"A");if(ar)g.s(6,1,9,"W").p(10,6,"G").p(9,5,"G").p(9,7,"G").p(1,5,"A").p(1,7,"A");if(fl)g.flip();return g.done();}},
 buckler:{n:48,g(v){const [sh,em,rim]=mx(v,[4,6,2]),g=new Grid();shield(g,sh,false);if(rim)g.edge("A");emblem(g,em);return g.done();}},
 tower:{n:48,g(v){const [sh,em,rim]=mx(v,[4,6,2]),g=new Grid();shield(g,sh,true);if(rim)g.edge("A");emblem(g,em);return g.done();}},
 tome:{n:48,g(v){const [op,em,rb,cl]=mx(v,[2,6,2,2]),g=new Grid();
  if(!op){g.r(2,1,8,rb?9:10,"M").ln(2,1,2,rb?9:10,"A").ln(9,2,9,rb?8:9,"S");if(cl)g.r(8,4,2,2,"A");if(rb)g.p(7,10,"G");const c=[5,4];symbol(g,em,c);}
  else{g.r(1,3,10,6,"M").r(2,3,3,5,"S").r(6,3,3,5,"S").ln(5,3,5,8,"D").ln(6,3,6,8,"D");if(cl)g.s(9,3,8,"A");if(rb)g.p(6,9,"G").p(6,10,"G");symbol(g,em,[3,5],true);}
  return g.done();}},
 hood:{n:32,g(v){const [sh,tr,ey,fl]=mx(v,[4,2,2,2]),g=new Grid();
  if(sh===0)g.ell(5.5,5,4,4,"M").r(2,5,8,5,"M");else if(sh===1)g.pts([[7,1],[6,2],[7,2]],"M").ell(5.5,6,4,3.6,"M").r(2,6,8,4,"M");
  else if(sh===2)g.ell(5.5,4,3.5,3,"M").r(1,6,10,4,"M").r(2,5,8,2,"M");else g.ell(5.5,5,4,4,"M").r(2,5,8,5,"M");
  const fy=sh===2?4:5;g.r(4,fy,4,sh===3?2:4,"K");if(sh===3)g.r(4,fy+2,4,2,"A");if(ey)g.p(4,fy+1,"G").p(7,fy+1,"G");
  if(tr)g.pts([[3,fy],[3,fy+1],[3,fy+2],[8,fy],[8,fy+1],[8,fy+2],[4,fy-1],[5,fy-1],[6,fy-1],[7,fy-1]],"A");if(fl)g.flip();return g.done();}},
 helm:{n:24,g(v){const [sh,gm,fl]=mx(v,[6,2,2]),g=new Grid(),open=sh===1||sh===2||sh===5,top=sh===3||sh===4?3:2;
  g.ell(5.5,top+2.5,4,2.8,"M").r(2,top+2,8,8-top,"M");
  if(open){g.r(4,top+4,4,4,"K").ln(5,top+3,5,top+5,"M").ln(6,top+3,6,top+5,"M");}else g.s(top+4,3,8,"K").p(5,top+5,"K").p(6,top+5,"K");
  if(sh===2)g.pts([[1,top],[1,top+1],[2,top+1],[10,top],[10,top+1],[9,top+1],[1,top-1],[10,top-1]],"A");
  if(sh===3)g.pts([[5,1],[6,1],[5,2],[6,2],[7,1],[7,2],[8,2]],"A");if(sh===4)g.pts([[5,1],[6,1],[5,2],[6,2]],"A");
  if(sh===5)g.pts([[1,top+2],[1,top+3],[1,top+4],[10,top+2],[10,top+3],[10,top+4]],"S");if(gm)g.p(5,top+1,"G").p(6,top+1,"G");if(fl)g.flip();return g.done();}},
 robe:{n:243,g(v){const [sl,hm,co,be,tr]=mx(v,[3,3,3,3,3]),g=new Grid();g.s(1,4,7,"M").r(3,2,6,7,"M");
  if(hm===1)g.s(8,2,9,"M").s(9,1,10,"M").s(10,1,10,"M");else g.s(9,2,9,"M").s(10,2,9,"M");if(hm===2)g.r(5,9,2,2,".");
  if(sl===0)g.pts([[2,2],[2,3],[1,4],[1,5],[1,6],[9,2],[9,3],[10,4],[10,5],[10,6]],"M");else if(sl===1)g.r(1,3,2,4,"M").r(9,3,2,4,"M").pts([[2,2],[9,2],[1,7],[10,7]],"M");else g.r(1,2,2,3,"M").r(9,2,2,3,"M");
  if(co===0)g.s(1,3,8,"A").pts([[5,1],[6,1]],"K");else if(co===1)g.pts([[5,1],[6,1],[5,2],[6,2],[5,3],[6,3]],"K");else g.s(1,4,7,"A").pts([[5,1],[6,1],[5,2]],"K");
  if(be===1)g.s(6,3,8,"A");else if(be===2)g.s(6,3,8,"S").p(6,7,"S").p(6,8,"S");
  if(tr===1)g.ln(5,4,5,10,"A");else if(tr===2)for(let x=1;x<=10;x++)if(g.c[10][x]!==".")g.p(x,10,"A");return g.done();}},
 vest:{n:576,g(v){const [cut,be,fr,col,hem,sh]=mx(v,[4,3,4,2,2,3]),g=new Grid();
  if(cut===0){g.s(1,3,4,"M").s(1,7,8,"M").r(2,2,3,3,"M").r(7,2,3,3,"M").r(2,5,8,6,"M");}
  else if(cut===1){g.s(1,3,8,"M").r(1,2,10,3,"M").r(3,5,6,6,"M").pts([[5,1],[6,1],[5,2],[6,2]],"K");}
  else if(cut===2){g.r(2,1,8,10,"M").r(1,2,1,6,"M").r(10,2,1,6,"M").pts([[5,1],[6,1],[5,2],[6,2],[5,3],[6,3]],"K").ln(5,4,5,10,"D");}
  else{g.r(2,2,8,8,"M").s(1,3,8,"S").s(5,1,10,"M").pts([[2,10],[4,10],[6,10],[8,10]],"M");}
  if(be===1)g.s(7,2,9,"A");else if(be===2)g.s(6,2,9,"A").s(8,2,9,"A");
  if(fr===1)g.pts([[5,3],[6,4],[5,5],[6,6]],"A");else if(fr===2)g.pts([[6,4],[6,6],[6,8]],"G");else if(fr===3)g.r(7,8,2,2,"A");
  if(col)g.s(2,2,4,"S").s(2,7,9,"S");if(sh===1)g.pts([[1,2],[1,3],[10,2],[10,3]],"A");else if(sh===2)g.pts([[2,6],[2,7],[9,6],[9,7],[1,6],[1,7],[10,6],[10,7]],".");
  if(hem)g.p(2,10,".").p(9,10,".").p(3,10,".").p(8,10,".");return g.done();}},
 plate:{n:120,g(v){const [sd,em,sk,nk]=mx(v,[4,5,3,2]),g=new Grid();g.r(3,2,6,7,"M").r(4,9,4,2,"M");
  if(sd===0)g.r(1,2,2,2,"M");else if(sd===1)g.r(1,1,3,3,"M").p(1,1,".");else if(sd===2)g.r(1,2,2,2,"M").pts([[1,1]],"A");else g.s(2,1,3,"M").s(3,1,3,"M").p(1,4,"M");
  if(sd===0)g.r(9,2,2,2,"M");else if(sd===1)g.r(8,1,3,3,"M").p(10,1,".");else if(sd===2)g.r(9,2,2,2,"M").pts([[10,1]],"A");else g.s(2,8,10,"M").s(3,8,10,"M").p(10,4,"M");
  if(em===1)g.ln(5,3,5,7,"A").ln(6,3,6,7,"A").s(4,4,7,"A");else if(em===2)g.ln(5,3,5,9,"A");else if(em===3)g.pts([[5,4],[6,4],[4,5],[7,5],[5,6],[6,6],[5,5],[6,5]],"G");else if(em===4)g.s(4,3,8,"A").s(6,3,8,"A");
  if(sk===1)g.s(9,3,8,"M").s(10,3,4,"M").s(10,7,8,"M").r(5,10,2,1,".");else if(sk===2)g.s(9,3,8,"A").s(10,3,8,"A");
  if(nk)g.s(1,4,7,"A").pts([[5,1],[6,1]],"K");else g.pts([[5,2],[6,2],[5,3]],"K");return g.done();}},
 wraps:{n:36,g(v){const [fi,st,cu,fl]=mx(v,[2,3,3,2]),g=new Grid();hand(g,fi,cu===1?10:9);
  if(st===0)for(const y of [5,7])g.s(y,3,8,"A");else if(st===1)g.ln(3,8,7,4,"A").ln(4,9,8,5,"A");
  if(cu===1)g.p(9,10,"S").p(10,10,"S");else if(cu===2)g.s(10,3,9,"S");else g.s(9,4,8,"A");if(fl)g.flip();return g.done();}},
 gauntlet:{n:24,g(v){const [cu,kn,fi,fl]=mx(v,[3,2,2,2]),g=new Grid();hand(g,fi,8);
  if(cu===0)g.s(9,3,8,"M").s(10,2,9,"M");else if(cu===1)g.r(4,9,5,2,"M");else g.r(3,9,6,2,"M").pts([[2,9],[9,9],[1,10],[10,10]],"A");
  if(kn)g.pts([[3,4],[5,4],[7,4]],"A");else g.s(6,3,8,"A");if(fl)g.flip();return g.done();}},
 boot:{n:108,g(v){const [h,toe,cf,so,fl]=mx(v,[3,3,3,2,2]),g=new Grid(),top=[1,3,5][h];g.r(3,top,4,8-top,"M");
  if(toe===0)g.r(3,8,7,3,"M").p(9,8,".");else if(toe===1)g.r(3,8,5,3,"M").s(9,8,9,"M").s(9,9,9,"M").s(10,10,10,"M").p(8,9,"M").p(8,10,"M").p(9,10,"M").p(8,8,"M");else g.r(3,8,7,3,"M");
  if(cf===1)g.s(top,2,7,"A").s(top+1,2,7,"A");else if(cf===2){g.s(top+1,3,6,"A");if(top+3<8)g.s(top+3,3,6,"A");}
  if(so)for(let x=1;x<=10;x++){if(g.c[10][x]!==".")g.p(x,10,"S");}else g.p(3,10,"S").p(4,10,"S");if(fl)g.flip();return g.done();}},
 softboot:{n:72,g(v){const [h,toe,la,fo,fl]=mx(v,[3,2,3,2,2]),g=new Grid(),top=[2,4,6][h];g.r(4,top,3,8-top,"M").r(4,8,5,3,"M").p(9,9,"M").p(9,10,"M");
  if(toe)g.p(10,9,"M").p(10,8,"M");if(la===0){for(let y=top+1;y<8;y+=2)g.p(5,y,"A");}else if(la===1){for(let y=top+1;y<9;y+=2)g.s(y,4,6,"S");}
  if(fo)g.s(top,3,7,"S");if(fl)g.flip();return g.done();}},
 ring:{n:56,g(v){const [bd,st,en]=mx(v,[4,7,2]),g=new Grid();
  if(bd===0)g.ell(5.5,6.5,4.2,3.8,"M",1);else if(bd===1)g.ell(5.5,6.5,4.4,4,"M",2);else if(bd===2)g.ell(5.5,7,3.2,3,"M",1);else g.ell(5.5,7,4.6,3,"M",1);
  if(en)g.pts([[2,6],[2,7],[9,6],[9,7]],"A");
  if(st===0)g.s(3,4,7,"A");else if(st===1)g.r(5,2,2,2,"G");else if(st===2)g.pts([[5,1],[6,1],[4,2],[5,2],[6,2],[7,2],[5,3],[6,3]],"G");
  else if(st===3)g.r(4,1,4,3,"G");else if(st===4)g.pts([[3,3],[5,2],[6,2],[8,3],[5,3],[6,3]],"G");else if(st===5)g.r(5,2,2,2,"G").pts([[4,1],[7,1],[4,3],[7,3]],"A");else g.r(5,1,2,4,"G");
  return g.done();}},
 necklace:{n:36,g(v){const [ch,pd,cc]=mx(v,[3,6,2]),g=new Grid(),c=cc?"M":"S";
  if(ch===0)g.ln(1,1,5,6,c).ln(10,1,6,6,c);else if(ch===1)g.ln(2,1,2,4,c).ln(9,1,9,4,c).pts([[3,5],[4,6],[7,6],[8,5],[5,6],[6,6]],c);else g.ell(5.5,4,4.4,3,c,true);
  [()=>g.pts([[5,7],[6,7],[4,8],[5,8],[6,8],[7,8],[5,9],[6,9],[5,10],[6,10]],"G"),()=>g.r(3,7,2,2,"M").r(7,7,2,2,"M").r(5,8,2,2,"G"),
   ()=>g.s(7,4,7,"M").s(8,4,7,"M").s(9,5,6,"M").s(10,5,6,"M"),()=>g.r(4,7,4,4,"M").r(5,8,2,2,"G"),()=>g.pts([[3,7],[3,8],[4,9],[5,10],[6,10],[7,9],[8,8],[8,7],[4,8],[7,8]],"M"),
   ()=>g.s(8,2,9,"M").s(9,3,8,"M").p(5,7,"G").p(6,7,"G")][pd]();return g.done();}},
 pendant:{n:32,g(v){const [ch,md,gm]=mx(v,[2,8,2]),g=new Grid();
  if(ch===0)g.ln(3,1,5,3,"S").ln(8,1,6,3,"S");else g.pts([[5,1],[6,1],[4,2],[7,2],[5,3],[6,3]],"S");
  [()=>g.ell(5.5,7,3.4,3,"M"),()=>g.pts([[5,4],[6,4]],"M").r(4,5,4,1,"M").ell(5.5,8,3,2.4,"M"),()=>g.r(2,5,3,2,"M").r(7,5,3,2,"M").s(7,2,9,"M").s(8,3,8,"M").s(9,4,7,"M").s(10,5,6,"M"),
   ()=>{for(let d=0;d<=3;d++)g.s(4+d,5-d,6+d,"M");for(let d=0;d<3;d++)g.s(8+d,3+d,8-d,"M");},()=>g.r(2,4,8,4,"M").s(8,3,8,"M").s(9,4,7,"M").s(10,5,6,"M"),
   ()=>g.ln(5,4,5,10,"M").ln(6,4,6,10,"M").s(6,2,9,"M").s(7,3,8,"M").pts([[3,9],[8,9],[2,10],[9,10]],"M"),()=>g.pts([[4,4],[3,5],[2,6],[2,7],[2,8],[3,9],[4,10],[5,10],[6,10],[3,6],[3,7],[3,8],[4,9],[7,9],[8,8]],"M"),
   ()=>g.r(3,4,6,7,"M").p(3,4,".").p(8,4,".").p(3,10,".").p(8,10,".")][md]();
  if(gm)g.r(5,6,2,2,"G");else g.p(5,7,"G").edge("A");return g.done();}},
 charm:{n:36,g(v){const [tk,lp,bd]=mx(v,[9,2,2]),g=new Grid();
  if(lp)g.pts([[5,1],[6,1],[4,2],[7,2],[5,3],[6,3]],"S");else g.ln(2,1,5,3,"S").ln(9,1,6,3,"S");if(bd)g.p(5,4,"G").p(6,4,"G");
  [()=>g.s(5,5,6,"M").s(6,4,7,"M").s(7,4,7,"M").s(8,3,8,"M").s(9,2,9,"M").p(5,10,"A").p(6,10,"A"),()=>g.pts([[4,5],[5,5],[5,6],[6,6],[6,7],[7,7],[7,8],[7,9],[6,10],[4,6],[5,7],[6,8],[6,9]],"M"),
   ()=>g.pts([[5,5],[6,5],[5,6],[6,6],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[4,8],[5,8],[6,8],[7,8],[3,9],[4,9],[7,9],[8,9],[3,10],[8,10]],"M"),
   ()=>g.r(4,5,4,2,"M").r(2,7,3,3,"M").r(7,7,3,3,"M").ln(5,8,5,10,"A"),()=>g.pts([[3,5],[4,6],[5,7],[6,7],[7,6],[8,5],[3,9],[4,8],[7,8],[8,9],[5,8],[6,8]],"M"),
   ()=>g.s(6,3,8,"M").s(7,2,9,"M").s(8,3,8,"M").r(5,6,2,3,"G"),()=>g.ell(5.5,6.5,2,2,"M",true).ln(5,8,5,10,"M").ln(6,8,6,10,"M").p(7,9,"M").p(7,10,"M"),
   ()=>g.ln(8,5,3,10,"A").pts([[7,5],[8,6],[6,6],[7,7],[5,7],[6,8],[4,8],[5,9]],"M"),()=>g.pts([[3,5],[4,5],[7,5],[8,5],[2,6],[3,6],[8,6],[9,6],[2,7],[3,7],[8,7],[9,7],[3,8],[4,8],[7,8],[8,8],[4,9],[5,9],[6,9],[7,9]],"M")][tk]();return g.done();}}};
function shield(g,sh,tall){if(!tall){if(sh===0)g.ell(5.5,5.5,4.4,4.4,"M");else if(sh===1){g.r(2,1,8,4,"M");for(let i=0;i<6;i++)g.s(5+i,2+(i>>0)*0+Math.ceil(i*0.6),9-Math.ceil(i*0.6),"M");}
  else if(sh===2){g.r(1,1,10,5,"M");g.ell(5.5,5,4.5,5,"M");}else{g.r(1,2,10,7,"M").r(2,1,8,9,"M").r(3,9,6,2,"M");}}
 else{if(sh===0)g.r(2,1,8,10,"M");else if(sh===1)g.r(2,2,8,9,"M").s(1,4,7,"M");else if(sh===2)g.r(2,1,8,8,"M").s(9,3,8,"M").s(10,5,6,"M");else g.r(2,1,8,10,"M").p(2,5,".").p(2,6,".").p(9,5,".").p(9,6,".");}}
function emblem(g,em){const inside=(x,y)=>g.c[y][x]==="M",P=(a,ch)=>{for(const [x,y] of a)if(inside(x,y))g.p(x,y,ch);};const all=[];for(let y=1;y<=10;y++)for(let x=1;x<=10;x++)all.push([x,y]);
 if(em===0)P([[5,5],[6,5],[5,6],[6,6]],"G");else if(em===1)P(all.filter(([x,y])=>x===5||x===6&&false||y===5),"A");else if(em===2)P(all.filter(([x,y])=>x-y===0||x-y===1),"A");
 else if(em===3)P(all.filter(([x,y])=>y===Math.abs(x-5.5)+3.5||y===Math.abs(x-5.5)+4.5),"A");else if(em===4)P(all.filter(([x])=>x<=5),"A");else P([[4,4],[5,3],[6,3],[7,4],[4,6],[5,7],[6,7],[7,6],[4,5],[7,5]],"A");}
function symbol(g,em,[cx,cy],small){const S=[[[0,0],[1,0],[0,1],[1,1]],[[0,-1],[0,0],[0,1],[0,2],[-1,0],[1,0]],[[0,-1],[-1,0],[0,0],[1,0],[0,1],[-1,2],[1,2]],[[-1,0],[0,-1],[1,-1],[2,0],[1,1],[0,1],[0,0]],[[0,-1],[-1,0],[1,0],[0,1]],[[-1,-1],[0,-1],[1,-1],[-1,1],[0,1],[1,1]]][em];
 for(const [dx,dy] of S)g.p(cx+dx,cy+dy,em===0||em===4?"G":"A");if(em===3)g.p(cx+1,cy,"G");}
function hand(g,fi,bot){g.r(3,4,6,4,"M").r(4,8,5,bot-7,"M");if(fi)g.pts([[3,2],[3,3],[5,1],[5,2],[5,3],[7,2],[7,3],[8,3],[1,5],[2,5],[1,6],[2,6]],"M");else g.r(3,3,6,1,"M").p(2,5,"M").p(2,6,"M");}
function matFor(k,w){for(const m of MAT)if(m[0].test(w))return m.slice(1);return DEF[FDEF[k]||"metal"];}

function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function kind(id,it){const n=(it.n||"").toLowerCase(),s=it.slot;
 if(s==="weapon")return /bow/.test(n)?"bow":/staff|rod|wand/.test(n)?"staff":/axe/.test(n)?"axe":/mace|hammer|club|maul/.test(n)?"mace":/dagger|knife|splinter|stiletto|fang|talon/.test(n)?"dagger":"sword";
 if(s==="offhand")return /tome|book/.test(n)?"tome":/tower/.test(n)?"tower":"buckler";
 if(s==="helmet")return /hood|cap|cowl/.test(n)?"hood":"helm";
 if(s==="chest")return /robe/.test(n)?"robe":/plate|armor|mail/.test(n)?"plate":"vest";
 if(s==="gloves")return /gauntlet/.test(n)?"gauntlet":"wraps";
 if(s==="boots")return /soft|trail|strider|sandal/.test(n)?"softboot":"boot";
 if(s==="acc")return /ring|band/.test(n)?"ring":/pendant/.test(n)?"pendant":/charm/.test(n)?"charm":"necklace";
 return ({use:"flask",junk:"gem",ing:"sack",dish:"bowl",part:"shard",gear:"rope",craft:"vial"})[s]||"gem";}
// PICK: id -> shape variant * 16 + gem index (base 36). Generated by icons-fix-run/tools/optimize.js; do not edit by hand.
const PICK={};/*PICK-START*/const PICKS="amulet:aj,axe:cb,bow:jf,buckler:bd,cap:cb,dagger:1iz,gauntlets:74,greaves:18s,helm:49,leather:4fa,mace:af,plate:xf,relic1_amulet:4q,relic1_axe:1w,relic1_bow:r0,relic1_buckler:iy,relic1_cap:6o,relic1_dagger:1ri,relic1_gauntlets:af,relic1_greaves:11b,relic1_helm:24,relic1_leather:47p,relic1_mace:bu,relic1_plate:jo,relic1_ring:y,relic1_robe:1uq,relic1_sandals:24,relic1_staff:h2,relic1_sword:2dt,relic1_tome:fn,relic1_towershield:0,relic1_wraps:9p,relic2_amulet:d1,relic2_axe:bd,relic2_bow:d9,relic2_buckler:af,relic2_cap:65,relic2_dagger:101,relic2_gauntlets:4q,relic2_greaves:6a,relic2_helm:1n,relic2_leather:6mg,relic2_mace:2d,relic2_plate:17d,relic2_ring:lt,relic2_robe:bl,relic2_sandals:pl,relic2_staff:qj,relic2_sword:3bg,relic2_tome:0,relic2_towershield:65,relic2_wraps:cs,relic3_amulet:20,relic3_axe:9y,relic3_bow:q2,relic3_buckler:g4,relic3_cap:6m,relic3_dagger:16o,relic3_gauntlets:2d,relic3_greaves:cx,relic3_helm:16,relic3_leather:1iz,relic3_mace:g4,relic3_plate:19q,relic3_ring:5o,relic3_robe:218,relic3_sandals:ma,relic3_staff:5o,relic3_sword:27n,relic3_tome:2d,relic3_towershield:4q,relic3_wraps:37,relic4_amulet:cb,relic4_axe:jf,relic4_bow:qj,relic4_buckler:49,relic4_cap:bv,relic4_dagger:24b,relic4_gauntlets:3k,relic4_greaves:ek,relic4_helm:p,relic4_leather:5t2,relic4_mace:h3,relic4_plate:8j,relic4_ring:1n,relic4_robe:2o3,relic4_sandals:s7,relic4_staff:h,relic4_sword:2u,relic4_tome:iy,relic4_towershield:73,relic4_wraps:y,relic5_amulet:4m,relic5_axe:i0,relic5_bow:aw,relic5_buckler:ku,relic5_cap:5o,relic5_dagger:y,relic5_gauntlets:17,relic5_greaves:qj,relic5_helm:7c,relic5_leather:6xd,relic5_mace:5a,relic5_plate:16w,relic5_ring:6e,relic5_robe:2s6,relic5_sandals:74,relic5_staff:bu,relic5_sword:28l,relic5_tome:3b,relic5_towershield:g4,relic5_wraps:7l,ring:8r,robe:12b,sandals:on,staff:dd,sword:o6,tome:4q,towershield:e7,w_bow:h,w_buckler:8j,w_dagger:2cd,w_helm:3j,w_leather:1qk,w_staff:on,w_sword:1ag,wraps:2q,z1_archer_camp_ring:65,z1_archer_sinew_necklace:4,z1_archer_trail_charm:61,z1_bent_short_bow:e8,z1_bone_splinter:rh,z1_bone_strap_vest:3md,z1_camp_bow:iz,z1_camp_leather:na,z1_cave_ash_robe:vi,z1_cave_ash_staff:82,z1_cave_iron_plate:jo,z1_cave_iron_sword:ep,z1_cloth_wraps:f1,z1_iron_rim_shield:0,z1_knotted_walking_staff:np,z1_mage_moon_ring:6g,z1_mage_root_pendant:2d,z1_mage_travel_charm:as,z1_notch_dagger:13c,z1_notch_leather:6xv,z1_novice_tome:1f,z1_riveted_plate:oh,z1_rogue_bone_pendant:h,z1_rogue_notch_ring:ov,z1_rogue_scrap_copper_ring:24,z1_root_staff:i0,z1_rootweave_robe:13c,z1_rusted_short_sword:1w9,z1_scavenger_vest:71m,z1_scrap_axe:np,z1_scrap_plate:191,z1_sinew_bow:dq,z1_sinew_jerkin:4dv,z1_soft_trail_boots:cc,z1_trail_leather:9h,z1_trail_mace:4q,z1_travel_robe:2yc,z1_warrior_cave_stone_ring:3k,z1_warrior_ember_necklace:12,z1_warrior_iron_band:di,z2_archer_goblin_charm:ex,z2_archer_hunt_pendant:82,z2_archer_leaf_necklace:4n,z2_archer_yew_ring:a8,z2_bark_staff:2d,z2_barkcloth_robe:1ir,z2_bent_yew_bow:ku,z2_briar_axe:kd,z2_briar_plate:nx,z2_fairy_thread_robe:29f,z2_fairy_wood_staff:r0,z2_forest_leather:d9,z2_goblin_cut_vest:175,z2_goblin_short_bow:qj,z2_greeniron_blade:1ea,z2_greeniron_plate:1c4,z2_greenweave_robe:2hc,z2_greenwood_staff:ct,z2_hidden_short_sword:2cd,z2_hidden_vest:1ax,z2_hunt_leather:311,z2_knot_mace:3b,z2_leaf_stitched_leather:4pp,z2_leaf_string_bow:g5,z2_mage_bark_ring:6c,z2_mage_fairy_pendant:e7,z2_mage_greenwood_ring:lk,z2_mage_moss_charm:fz,z2_maze_knife:1rn,z2_maze_leather:3nb,z2_meadow_tome:57,z2_moss_iron_plate:p4,z2_moss_robe:1k3,z2_moss_wrapped_staff:db,z2_oak_buckler:f6,z2_quiet_blade:57,z2_rogue_hidden_charm:b5,z2_rogue_maze_ring:7t,z2_rogue_quiet_pendant:dq,z2_rogue_vine_ring:24,z2_thorn_wraps:7l,z2_thorned_plate:17d,z2_thorned_sword:2j0,z2_trail_boots:lk,z2_vine_dagger:11x,z2_vine_vest:2ah,z2_warrior_briar_necklace:fk,z2_warrior_greeniron_pendant:8j,z2_warrior_moss_iron_ring:m1,z2_warrior_thorn_ring:ld,z2_yew_bow:q2,z2_yew_hide_jerkin:36q,z3_archer_bone_ring:fe,z3_archer_harpy_necklace:24,z3_archer_hollow_ring:np,z3_archer_moon_charm:eg,z3_archer_wolf_sinew_pendant:65,z3_ash_staff:20,z3_ashen_robe:2yt,z3_bone_bow:eq,z3_bone_handled_axe:3b,z3_bone_laced_jerkin:5p,z3_bone_rim_plate:199,z3_bone_staff:mc,z3_bone_thread_robe:1t,z3_grave_iron_plate:158,z3_grave_iron_sword:2nt,z3_harpy_bow:f6,z3_harpy_hide_jerkin:23u,z3_hollow_bow:hj,z3_hollow_leather:te,z3_hollow_steel_blade:pl,z3_hollow_steel_plate:1bv,z3_mage_ash_ring:eh,z3_mage_bone_charm:7g,z3_mage_moon_pendant:9y,z3_mage_palewood_necklace:ac,z3_mage_silvered_ring:d9,z3_moon_bow:s1,z3_moon_hide_jerkin:11x,z3_moon_hide_vest:30m,z3_moon_robe:2wt,z3_moon_short_sword:gl,z3_moon_staff:af,z3_moon_tome:jw,z3_moonsteel_plate:1cm,z3_moonsteel_sword:163,z3_night_hood:9y,z3_pale_blade:2ea,z3_pale_hide:4nc,z3_palewood_robe:hp,z3_palewood_staff:g7,z3_rib_dagger:57,z3_rib_stitched_vest:3uw,z3_rogue_moon_pendant:1w,z3_rogue_pale_necklace:1d,z3_rogue_rib_charm:f1,z3_rogue_silent_ring:e8,z3_rogue_wolffang_ring:5h,z3_silent_knife:22g,z3_silent_leather:jw,z3_silvered_mace:4a,z3_silvered_plate:uc,z3_silvered_robe:1pu,z3_silvered_staff:9i,z3_stone_face_shield:74,z3_strider_boots:3m,z3_warrior_bone_necklace:c3,z3_warrior_grave_iron_charm:e8,z3_warrior_hollow_pendant:2u,z3_warrior_moonsteel_ring:73,z3_warrior_silvered_ring:3j,z3_wolf_hide_jerkin:3t0,z3_wolf_sinew_bow:ld,z3_wolffang_dagger:1cw,z3_wolffang_vest:e8,z4_archer_gargoyle_limb_charm:f1,z4_archer_griffin_feather_ring:di,z4_archer_horn_charm:t,z4_archer_long_rune_pendant:2u,z4_archer_runic_pendant:5o,z4_archer_scale_string_ring:gd,z4_archer_stone_necklace:16,z4_etched_leather:11x,z4_etched_stiletto:12e,z4_gargoyle_hide_jerkin:qj,z4_gargoyle_limb_bow:q2,z4_gargoyle_mace:a3,z4_gargoyle_plate:1h3,z4_glyph_robe:1m1,z4_glyph_staff:f7,z4_griffin_bone_staff:4r,z4_griffin_down_robe:2y3,z4_griffin_feather_bow:lc,z4_griffin_hide_jerkin:6ww,z4_griffin_hide_vest:3b,z4_griffin_plate:74,z4_griffin_pommel_sword:24s,z4_griffin_talon_dagger:23v,z4_heavy_runic_blade:2f8,z4_heavy_runic_plate:iq,z4_horn_bound_plate:v1,z4_horn_bow:ii,z4_horn_dagger:2cg,z4_horn_hide_jerkin:6pu,z4_horn_vest:4c0,z4_long_runic_bow:1f,z4_long_scale_jerkin:32x,z4_mage_glyph_pendant:6m,z4_mage_griffin_bone_ring:lc,z4_mage_rune_rod_charm:7p,z4_mage_runic_ring:jf,z4_mage_sigil_necklace:12,z4_mage_stone_core_charm:12,z4_mage_warding_necklace:3w,z4_rogue_etched_band:oe,z4_rogue_griffin_talon_charm:9h,z4_rogue_horn_ring:gx,z4_rogue_runic_pendant:49,z4_rogue_scale_necklace:fo,z4_rogue_shadow_ring:di,z4_rogue_short_sigil_pendant:h,z4_rune_etched_axe:pl,z4_rune_etched_plate:t5,z4_rune_rod:7m,z4_rune_stitched_robe:2r4,z4_runic_boots:11b,z4_runic_bow:6m,z4_runic_jerkin:5df,z4_runic_knife:1x7,z4_runic_leather:34v,z4_runic_plate:tm,z4_runic_robe:3s,z4_runic_staff:i0,z4_runic_sword:3cv,z4_runic_tower_shield:ep,z4_runic_war_mace:3b,z4_runic_wraps:an,z4_scale_dagger:bx,z4_scale_stitched_jerkin:4al,z4_scale_stitched_vest:1ke,z4_scale_string_bow:3d,z4_scale_vest:1kx,z4_shadow_horn_blade:2a1,z4_shadow_scale_vest:53g,z4_short_runic_sword:36a,z4_sigil_robe:zb,z4_sigil_staff:gl,z4_stone_bow:66,z4_stone_core_staff:g4,z4_stone_head_axe:sf,z4_stone_laced_jerkin:1ld,z4_stone_rim_plate:sx,z4_stone_thread_robe:2il,z4_warding_robe:235,z4_warding_staff:4r,z4_warding_tome:e8,z4_warrior_gargoyle_ring:8a,z4_warrior_griffin_pendant:8j,z4_warrior_heavy_sigil_ring:lk,z4_warrior_horn_necklace:cb,z4_warrior_rune_etched_charm:3f,z4_warrior_runic_ring:o7,z4_warrior_stone_necklace:ex,z5_archer_core_band:4q,z5_archer_crystal_ring:ku,z5_archer_deep_crystal_necklace:4d,z5_archer_facet_ring:jp,z5_archer_glow_pendant:57,z5_archer_heartstring_charm:3s,z5_archer_light_string_charm:af,z5_archer_prism_necklace:7t,z5_archer_shard_pendant:cs,z5_bright_fang:ag,z5_bright_hide:dq,z5_bright_iron_plate:cb,z5_bright_iron_sword:ny,z5_core_bow:bd,z5_core_dagger:ud,z5_core_forged_plate:pd,z5_core_forged_sword:2z8,z5_core_hide:6yb,z5_core_hide_jerkin:63h,z5_core_robe:qt,z5_core_staff:sf,z5_crystal_axe:82,z5_crystal_boots:1bj,z5_crystal_bow:6m,z5_crystal_edge_plate:3s,z5_crystal_edge_sword:1n8,z5_crystal_fang:g4,z5_crystal_jerkin:27n,z5_crystal_mace:e8,z5_crystal_plate:iy,z5_crystal_short_sword:76,z5_crystal_staff:14,z5_crystal_thread_robe:159,z5_crystal_tome:75,z5_crystal_tower_shield:h,z5_crystal_vest:4zo,z5_crystal_wraps:4v,z5_deep_crystal_axe:ep,z5_deep_crystal_bow:2d,z5_deep_crystal_jerkin:1xq,z5_deep_crystal_plate:1e9,z5_deep_crystal_robe:14p,z5_deep_crystal_rod:cc,z5_drakehide_jerkin:3ky,z5_drakehide_vest:2yp,z5_facade_mace:3y,z5_facade_plate:7c,z5_facet_blade:20x,z5_facet_bow:iz,z5_facet_jerkin:3es,z5_facet_robe:1pv,z5_facet_staff:ld,z5_facet_vest:56b,z5_glass_edge_dagger:1fo,z5_glass_edge_vest:3bg,z5_glow_bow:af,z5_glow_robe:2fb,z5_glow_staff:r9,z5_heart_crystal_plate:9p,z5_heart_crystal_robe:1x,z5_heart_crystal_staff:e7,z5_heartstring_bow:ep,z5_heartstring_jerkin:6ci,z5_light_string_bow:ry,z5_light_string_jerkin:377,z5_light_well_robe:15f,z5_light_well_staff:ip,z5_mage_core_charm:4n,z5_mage_crystal_ring:5p,z5_mage_deep_crystal_necklace:5o,z5_mage_facet_band:ir,z5_mage_glow_pendant:74,z5_mage_heart_crystal_charm:7l,z5_mage_light_well_ring:eg,z5_mage_prism_pendant:90,z5_mage_shard_necklace:f1,z5_prism_blade:mr,z5_prism_bow:np,z5_prism_jerkin:5pq,z5_prism_knife:90,z5_prism_plate:pd,z5_prism_robe:e1,z5_prism_staff:1f,z5_prism_vest:3th,z5_rogue_bright_fang_ring:lk,z5_rogue_core_charm:c1,z5_rogue_crystal_fang_ring:bu,z5_rogue_crystal_short_pendant:0,z5_rogue_facet_ring:ds,z5_rogue_glass_edge_band:eg,z5_rogue_prism_necklace:34,z5_rogue_shard_pendant:8j,z5_rogue_veil_necklace:r,z5_shard_bow:p4,z5_shard_dagger:f6,z5_shard_jerkin:5sl,z5_shard_leather:3y9,z5_shard_plate:eg,z5_shard_robe:g6,z5_shard_staff:q2,z5_shard_sword:9x,z5_veil_knife:1lv,z5_veil_leather:6lj,z5_warrior_bright_iron_pendant:cl,z5_warrior_core_forged_necklace:5k,z5_warrior_crystal_edge_ring:i1,z5_warrior_crystal_ring:n3,z5_warrior_deep_crystal_ring:lc,z5_warrior_facade_charm:98,z5_warrior_heart_crystal_pendant:9y,z5_warrior_prism_necklace:ek,z5_warrior_shard_band:cs";/*PICK-END*/
PICKS.split(",").forEach(p=>{const i=p.indexOf(":");if(i>0)PICK[p.slice(0,i)]=parseInt(p.slice(i+1),36);});
function gear(k,w,v,gi){const m=matFor(k,w);let W="#8a5a2e";for(const [re,c] of WOODS)if(re.test(w)){W=c;break;}
 if((k==="staff"||k==="bow")&&W==="#8a5a2e"&&!/oak|wood|knot|walking|camp|bent|root|bark|yew|ash/.test(w))W=m[2];
 const S=k==="bow"||k==="necklace"||k==="pendant"||k==="charm"?m[0]:"#e8dcc0";
 const pal={K,L:m[0],M:m[1],D:m[2],A:m[3],G:GEMS[gi%GEMS.length],W,S};return {rows:FAM[k].g(v%FAM[k].n),pal,tpl:k};}
// VER 86 staff heads (8 wide): M material, A accent, G gem, K dark detail
const SHEAD={
 skull:["..MMMM..",".MMMMMM.",".MKMMKM.",".MMMMMM.","..MKKM..","..MMMM.."],
 tablet:[".MMMMMM.",".MAMMAM.",".MMAAMM.",".MMAAMM.",".MAMMAM.",".MMMMMM."],
 talon:[".MM..MM.","M.AAAA.M","M.AAAA.M",".M.AA.M.","..MMMM.."],
 ankh:["..MMMM..",".MM..MM.",".MM..MM.","..MMMM..","MMMMMMMM","...AA..."],
 flame:["...G....","..MGG...",".MGGAM..",".MGAAM..",".MMAMM..","..MMMM.."],
 crescent:["..MMMM..",".MM..G..",".M......",".M......",".MM.....","..MMMM.."],
 heart:[".MM..MM.","MMMMMMMM","MAMMMMMM","MMMMMMMM",".MMMMMM.","..MMMM.."],
 leaf:["....MMM.","..MMMMM.",".MMMAMM.",".MMAMM..",".MAMM...","..AM...."],
 hex:["..MMMM..",".MGGGGM.","MGGAGGGM","MGGGGGGM",".MGGGGM.","..MMMM.."],
 prism:["...MM...","..MMMM..","..MGMM..",".MMGGMM.","MMMMMMMM"],
 burl:["..MMM...",".MMKMMM.","MMMMMMMM","MMMMKMMM",".MMMMMM.","..MMMM.."],
 moss:[".A.AA.A.","AAAAAAAA",".MMAMMM.",".MMMMAM.",".MMMMMM.","..MMMM.."],
 halo:["..AAAA..",".A....A.","A..MM..A","A.MMMM.A",".A.MM.A.","..AAAA.."],
 eye:["...MM...","..MMMM..",".MMAAMM.","MMAGGAMM",".MMAAMM.","..MMMM..","...MM..."],
 sun:["A..AA..A","..MMMM..",".MMGGMM.","AMGGGGMA",".MMGGMM.","..MMMM..","A..AA..A"],
 knob:["..MMMM..",".MMMMMM.",".MMMMMM.","..MMMM..",".AMMMMA.","..MMMM.."],
 burst:["M..M..M.",".M.M.M..","..MMM...","MMMGMMM.","..MMM...",".M.M.M.."]};
// VER 86: [head, diagonal, shaft accent, flip, gem] for the dark staffs and the ones that looked like pitchforks
const STAFF_FIX={z3_bone_staff:["skull",0,0,0],z4_glyph_staff:["tablet",0,0,1,3],z4_griffin_bone_staff:["talon",1,0,0],z4_warding_staff:["ankh",0,1,1],
 w_staff:["flame",0,0,1,6],z3_moon_staff:["crescent",0,1,0,3],z5_heart_crystal_staff:["heart",1,1,0],relic2_staff:["leaf",1,1,1],
 z5_deep_crystal_rod:["hex",1,1,0,13],z5_prism_staff:["prism",0,0,0,5],z2_bark_staff:["burl",0,0,0],z2_moss_wrapped_staff:["moss",1,0,0],
 z3_silvered_staff:["halo",0,1,0],z4_sigil_staff:["eye",0,0,1,3],z5_glow_staff:["sun",1,1,1,3],z1_knotted_walking_staff:["knob",0,0,1],z5_core_staff:["burst",1,0,1,3]};
// t2648u colour variety (no new shapes): TINT[id]=[hue degrees, saturation x, lightness +] recolours only the material colours L/M/D of the
// item's existing 8-bit shape (outline, accent, gem, wood and string stay). An item's own data field it.tint=[h,s,l] wins over this table.
// A missing or malformed tint gives the plain icon. Built once per item inside build() (cached in BUILT), never per repaint.
// Table made by gear-run/tools/gen_item_tints.js: gear whose family and material colours match an earlier item id (sorted) gets the next shift.
const TINT={tome:[28,1,0],z1_bent_short_bow:[28,1,0],z1_cloth_wraps:[28,1,0],z1_iron_rim_shield:[28,1,0],z1_knotted_walking_staff:[28,1,0],z1_mage_moon_ring:[28,1,0],z1_mage_travel_charm:[28,1,0],z1_notch_dagger:[28,1,0],z1_riveted_plate:[28,1,0],z1_trail_leather:[28,1,0],z1_warrior_ember_necklace:[28,1,0],z1_warrior_iron_band:[28,1,0],z2_archer_leaf_necklace:[28,1,0],z2_bark_staff:[28,1,0],z2_barkcloth_robe:[28,1,0],z2_forest_leather:[28,1,0],z2_greenweave_robe:[28,1,0],z2_greenwood_staff:[28,1,0],z2_hunt_leather:[28,1,0],z2_leaf_stitched_leather:[-28,1,0],z2_leaf_string_bow:[28,1,0],z2_mage_greenwood_ring:[28,1,0],z2_meadow_tome:[28,1,0],z2_moss_iron_plate:[28,1,0],z2_quiet_blade:[28,1,0],z2_trail_boots:[28,1,0],z2_yew_bow:[28,1,0],z3_archer_wolf_sinew_pendant:[28,1,0],z3_ash_staff:[28,1,0],z3_ashen_robe:[28,1,0],z3_bone_laced_jerkin:[28,1,0],z3_moon_hide_vest:[28,1,0],z3_moonsteel_plate:[28,1,0],z3_moonsteel_sword:[28,1,0],z3_rib_dagger:[28,1,0],z3_rib_stitched_vest:[-28,1,0],z3_rogue_moon_pendant:[28,1,0],z3_rogue_rib_charm:[28,1,0],z3_silent_leather:[28,1,0],z3_strider_boots:[28,1,0],z3_warrior_moonsteel_ring:[28,1,0],z3_warrior_silvered_ring:[28,1,0],z3_wolf_hide_jerkin:[-28,1,0],z3_wolf_sinew_bow:[28,1,0],z3_wolffang_vest:[56,1,0],z4_archer_runic_pendant:[28,1,0],z4_griffin_hide_vest:[28,1,0],z4_heavy_runic_blade:[28,1,0],z4_heavy_runic_plate:[28,1,0],z4_horn_bound_plate:[28,1,0],z4_horn_vest:[28,1,0],z4_long_runic_bow:[28,1,0],z4_mage_griffin_bone_ring:[28,1,0],z4_mage_runic_ring:[28,1,0],z4_rogue_horn_ring:[28,1,0],z4_rogue_runic_pendant:[-28,1,0],z4_rune_etched_axe:[28,1,0],z4_rune_etched_plate:[-28,1,0],z4_rune_rod:[28,1,0],z4_rune_stitched_robe:[28,1,0],z4_runic_boots:[28,1,0],z4_runic_bow:[-28,1,0],z4_runic_jerkin:[28,1,0],z4_runic_knife:[28,1,0],z4_runic_leather:[-28,1,0],z4_runic_plate:[56,1,0],z4_runic_robe:[-28,1,0],z4_runic_staff:[-28,1,0],z4_runic_sword:[-28,1,0],z4_runic_tower_shield:[28,1,0],z4_runic_war_mace:[28,1,0],z4_runic_wraps:[28,1,0],z4_scale_stitched_jerkin:[28,1,0],z4_scale_stitched_vest:[-28,1,0],z4_scale_vest:[56,1,0],z4_shadow_horn_blade:[28,1,0],z4_shadow_scale_vest:[-56,1,0],z4_short_runic_sword:[56,1,0],z4_warrior_rune_etched_charm:[28,1,0],z4_warrior_runic_ring:[-28,1,0],z4_warrior_stone_necklace:[28,1,0],z5_archer_crystal_ring:[28,1,0],z5_core_hide_jerkin:[28,1,0],z5_core_staff:[28,1,0],z5_crystal_axe:[28,1,0],z5_crystal_boots:[28,1,0],z5_crystal_bow:[28,1,0],z5_crystal_edge_plate:[28,1,0],z5_crystal_edge_sword:[28,1,0],z5_crystal_fang:[28,1,0],z5_crystal_jerkin:[28,1,0],z5_crystal_mace:[28,1,0],z5_crystal_plate:[-28,1,0],z5_crystal_short_sword:[-28,1,0],z5_crystal_staff:[28,1,0],z5_crystal_thread_robe:[28,1,0],z5_crystal_tome:[28,1,0],z5_crystal_tower_shield:[28,1,0],z5_crystal_vest:[-28,1,0],z5_crystal_wraps:[28,1,0],z5_drakehide_vest:[28,1,0],z5_facet_vest:[28,1,0],z5_light_string_bow:[28,1,0],z5_light_well_robe:[28,1,0],z5_light_well_staff:[28,1,0],z5_mage_core_charm:[28,1,0],z5_mage_crystal_ring:[-28,1,0],z5_mage_deep_crystal_necklace:[28,1,0],z5_mage_facet_band:[28,1,0],z5_mage_glow_pendant:[28,1,0],z5_mage_light_well_ring:[28,1,0],z5_prism_vest:[28,1,0],z5_rogue_core_charm:[-28,1,0],z5_rogue_crystal_fang_ring:[56,1,0],z5_rogue_facet_ring:[-28,1,0],z5_rogue_prism_necklace:[28,1,0],z5_rogue_shard_pendant:[28,1,0],z5_shard_leather:[28,1,0],z5_warrior_crystal_edge_ring:[-56,1,0],z5_warrior_crystal_ring:[90,1,0],z5_warrior_prism_necklace:[-28,1,0]};
function tintOk(t){return Array.isArray(t)&&t.length===3&&t.every(x=>typeof x==="number"&&isFinite(x));}
function hexHsl(h){const r=parseInt(h.slice(1,3),16)/255,g=parseInt(h.slice(3,5),16)/255,b=parseInt(h.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let hh=0,s=0;
 if(mx!==mn){const d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);hh=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;hh*=60;}return [hh,s,l];}
function hslHex(h,s,l){h=((h%360)+360)%360/360;const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};let r,g,b;
 if(!s){r=g=b=l;}else{const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;r=f(p,q,h+1/3);g=f(p,q,h);b=f(p,q,h-1/3);}
 return "#"+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,"0")).join("");}
function tintPal(pal,t){const out=Object.assign({},pal);for(const k of ["L","M","D"]){const c=pal[k];if(typeof c!=="string"||!/^#[0-9a-f]{6}$/i.test(c))continue;const [h,s,l]=hexHsl(c);
 out[k]=hslHex(h+t[0],Math.max(0,Math.min(1,s*t[1])),Math.max(0,Math.min(1,l+t[2])));}return out;}
function tintFor(id,it){const t=it&&it.tint!=null?it.tint:TINT[id];return tintOk(t)?t:null;}
function look(id,it,salt){
 if(BOT[id])return {rows:BOTTLE.split("|"),pal:BOT[id],bottle:id};
 const m=MISC[id];if(m)return {rows:T[m[0]].split("|"),pal:{K,L:m[1],M:m[2],D:m[3],A:m[4]||m[2],W:m[5]||WOOD,G:m[6]||m[1]},salt:0,tpl:m[0]};
 const k=kind(id,it);if(!FAM[k])return {rows:T[k].split("|"),pal:{K,L:"#e8e0d0",M:"#b0a890",D:"#6a6450",A:"#c8a050",W:WOOD,G:GEMS[hash(id)%16]},salt,tpl:k};
 const w=(id+" "+(it.n||"")).toLowerCase(),h=hash(id),c=PICK[id];let v=c!=null?Math.floor(c/16):h%FAM[k].n,gi=c!=null?c%16:(h>>>8)%16;
 if(salt){v+=salt*7;gi+=salt;}const L=gear(k,w,v,gi);L.salt=salt;const tn=tintFor(id,it);if(tn){L.pal=tintPal(L.pal,tn);L.tint=tn;}
 const sf=k==="staff"&&STAFF_FIX[id];if(sf){const sc=L.pal[sf[2]?"A":"W"].replace("#",""),lum=(0.299*parseInt(sc.slice(0,2),16)+0.587*parseInt(sc.slice(2,4),16)+0.114*parseInt(sc.slice(4,6),16))/255;
  L.rows=FAM.staff.x(sf[0],sf[1],sf[2],sf[3],lum<0.3);if(sf[4]!=null)L.pal.G=GEMS[(sf[4]+salt)%GEMS.length];}return L;}
function rects(rows,pal){let r="";rows.forEach((row,y)=>{let x=0;while(x<row.length){const ch=row[x],c=pal[ch];if(!c||ch==="."){x++;continue;}let e=x+1;while(e<row.length&&row[e]===ch)e++;r+='<rect x="'+x+'" y="'+y+'" width="'+(e-x)+'" height="1" fill="'+c+'"/>';x=e;}});return r;}
let BUILT=null;
function build(){const R=root.RPG;if(!R||!R.ITEMS)return null;const out={},seen=new Map();
 for(const id of Object.keys(R.ITEMS).sort()){const it=R.ITEMS[id];let salt=0,L,body;
  for(;;){L=look(id,it,salt);body=rects(L.rows,L.pal);if(!seen.has(body)||salt>60)break;salt++;}
  seen.set(body,id);out[id]={body,w:L.rows[0].length,h:L.rows.length,tpl:L.bottle?"bottle":L.tpl,bottle:L.bottle,tint:L.tint||null};}
 return out;}
function get(id){if(!BUILT||(root.RPG&&root.RPG.ITEMS&&Object.keys(root.RPG.ITEMS).length!==BUILT.n)){const b=build();if(!b)return null;BUILT={map:b,n:Object.keys(b).length};}return BUILT.map[id]||null;}
function svg(id){const g=get(id);if(!g)return "";
 return '<svg class="iic-svg" data-icon-id="'+id+'" data-icon-kind="'+g.tpl+'"'+(g.tint?' data-icon-tint="'+g.tint.join(",")+'"':'')+' viewBox="0 0 '+g.w+' '+g.h+'" shape-rendering="crispEdges" aria-hidden="true" focusable="false">'+g.body+'</svg>';}
function all(){get("potion");return BUILT?Object.assign({},BUILT.map):{};}
// _dev is only for the offline optimizer/measure tools (no game code uses it)
const API={svg,has:id=>!!get(id),all,TEMPLATES:T,MISC,_dev:{FAM,GEMS,kind,gear,rects,PICK,TINT,tintPal,tintFor,reset:()=>{BUILT=null;}}};
root.SOTA_ICONS=API;if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
