/* t2476u: every item gets its own original 8-bit pixel icon (inline SVG pixel grids, same style as the t2437u potion bottles).
   No image files and no network: each icon is drawn from a 12x12 character grid + a palette picked from the item's kind, material and zone.
   SOTA_ICONS.svg(id) gives the markup; SOTA_ICONS.all() is used by the test to prove every item id has a different icon. */
(function(root){
"use strict";
const T={
 sword:"..........KK|.........KLK|........KLMK|.......KLMK.|......KLMK..|..K..KLMK...|..KKKLMK....|...KAMK.....|...KGAK.....|..KWKKAK....|.KWK...KK...|.KK.........",
 axe:"....KKK.....|...KLLMK....|..KLMMMDK...|..KLMMDKWK..|..KMMDKWK...|...KDKWK....|....KWK.....|...KWK......|..KWK.......|.KWK........|KGK.........|KK..........",
 mace:".......K.K..|......KAKAK.|.....KLMMDK.|....KAMMMDAK|.....KMMDDK.|.....KKDKK..|....KWK.K...|...KWK......|..KWK.......|.KWK........|KGK.........|KK..........",
 dagger:"............|.........KK.|........KLK.|.......KLMK.|......KLMK..|.....KLMK...|...KKLMK....|...KAGK.....|..KWKAK.....|.KWK.KK.....|.KK.........|............",
 bow:"..LKK.......|..L.KWK.....|..L..KWK....|..L...KWK...|..L...KWK...|AAKKKKKWKKKG|..L...KWK...|..L...KWK...|..L..KWK....|..L.KWK.....|..LKK.......|............",
 staff:".......KKK..|......KGGAK.|......KGLGK.|......KAGGK.|.......KKWK.|.......KWK..|......KWK...|.....KWK....|....KWK.....|...KWK......|..KWK.......|..KK........",
 buckler:"...KKKKKK...|..KMMMMMMK..|.KMLLMMMDDK.|KMLLMMMMMDDK|KMLMMAAMMMDK|KMMMAGGAMMDK|KMMMAGGAMMDK|KMMMMAAMMDDK|KDMMMMMMMDDK|.KDDMMMMDDK.|..KDDDDDDK..|...KKKKKK...",
 tower:".KKKKKKKKKK.|.KLLMMMMMDK.|.KLMMAAMMDK.|.KLMMAAMMDK.|.KMAAGGAADK.|.KMAAGGAADK.|.KMMMAAMMDK.|.KMMMAAMMDK.|.KDMMMMMDDK.|..KDMMMDDK..|...KDDDDK...|....KKKK....",
 tome:"..KKKKKKKK..|.KMMMMMMMLK.|.KMMAAAAMLK.|.KMAGGGAMLK.|.KMAGGGAMLK.|.KMMAAAAMLK.|.KMMMMMMMLK.|.KMMMMMMMLK.|.KMMMMMMMLK.|.KDDDDDDDWK.|..KKKKKKKWK.|.........K..",
 hood:"....KKKK....|...KMMMMK...|..KMLMMMDK..|.KMLMMMMMDK.|.KMLKKKKMDK.|.KMK....KDK.|.KMK....KDK.|.KMK....KDK.|.KMMK..KDDK.|.KMAAKKAADK.|..KKKGGKKK..|....KKKK....",
 helm:"....KKKK....|..KKLLMMKK..|.KLLMMMMMDK.|.KLMMMMMMDK.|KLMMMAAMMMDK|KMMMMGGMMMDK|KMKKKKKKKKDK|KMK.K..K.KDK|KMKKK..KKKDK|KMMMK..KMMDK|.KDDK..KDDK.|..KK....KK..",
 robe:"...KK..KK...|..KMMKKMMK..|.KMMMAAMMDK.|KMMKMAAMKMDK|KMK.KMMK.KDK|KK..KMMK..KK|....KMGK....|...KMMMMK...|...KMMAMK...|..KMMMAMMK..|..KMMMAMDK..|..KKKKKKKK..",
 vest:"..KK....KK..|.KMMK..KMMK.|KMLMMKKMMDDK|KMLMMAAMMMDK|KMLMKAGKMMDK|.KMMKAAKMDK.|.KMMMKKMMDK.|.KMMMMMMMDK.|.KAAAAAAAAK.|.KMMMMMMMDK.|.KDDDDDDDDK.|..KKKKKKKK..",
 plate:".KKK....KKK.|KLLMKKKKMMDK|KLMMMLLMMMDK|KLMMLMMMMMDK|.KMMMMGMMDK.|.KMKMMMMKDK.|.KMMKMMKMDK.|.KMMMKKMMDK.|.KAAAAAAAAK.|.KMMMMMMMDK.|..KDDDDDDK..|...KKKKKK...",
 wraps:"...K.K.K....|..KMKMKMK...|..KMKMKMKK..|..KMKMKMKMK.|.KKMMMMMKMK.|KMKMMMMMMMK.|KMMMMMMMMDK.|.KMLLLLMMDK.|..KMMMMMDK..|..KAAAAAAK..|..KMLMLMDK..|..KKKKKKKK..",
 gauntlet:"..KKKKKK....|..KLMKLMK...|..KLMKLMKK..|..KLMKLMKMK.|.KKMMMMMKDK.|KMKMMGMMMDK.|KMMMMMMMMDK.|.KMMMMMMMDK.|.KKKKKKKKKK.|.KAAAAAAAAK.|.KMMMMMMMDK.|.KKKKKKKKKK.",
 softboot:"...KKKK.....|...KMMK.....|...KMMK.....|...KAAK.....|...KMMK.....|...KMMK.....|...KMLMK....|...KMMLMKK..|..KMMMMMMMK.|..KMMMMMMMMK|..KDDDDDDDDK|..KKKKKKKKKK",
 boot:"..KKKKKK....|..KLMMDK....|..KAAAAK....|..KLMMDK....|..KLMGDK....|..KLMMDK....|..KLMMDKKK..|..KLMMMMMDK.|.KKLMMMMMMDK|.KLLMMMMMMDK|.KDDDDDDDDDK|.KKKKKKKKKKK",
 ring:"....KKKK....|...KGGGGK...|....KAAK....|...KMMMMK...|..KMK..KMK..|.KMK....KDK.|.KLK....KDK.|.KLK....KDK.|.KMK....KDK.|..KMK..KDK..|...KMMMDK...|....KKKK....",
 necklace:".K........K.|.KM......MK.|..KM....MK..|..KM....MK..|...KM..MK...|...KM..MK...|....KMMK....|....KAAK....|...KAGGAK...|...KAGGAK...|....KAAK....|.....KK.....",
 pendant:"....K..K....|...KM..MK...|...KM..MK...|....KMMK....|....KMMK....|...KKMMKK...|..KMLLMMDK..|..KLAGGAMK..|..KMAGGADK..|..KMMAADDK..|...KMMDDK...|....KKKK....",
 charm:".....KK.....|.....KMK....|.....KK.....|.....KK.....|....KMMK....|.KKKKLMMKKKK|.KMLLAGAMMDK|..KMMAGAMDK.|...KMMMMDK..|..KMMDKDDMK.|..KMDK.KDMK.|..KKK...KKK.",
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
 vial:".....KK.....|.....KWK....|....KKKK....|....KGGK....|...KMMMMK...|..KMLAMAMK..|..KMAAAAMK..|..KMMAAMMK..|..KMAMMAMK..|..KDMMMMDK..|...KDDDDK...|....KKKK...."
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
 d_toast:["plate_food","#ffffff","#e8e0d0","#a89a80","#e0a050"],d_broth:["bowl","#c8e8a0","#8ab860","#4a7a2a","#e8e8e8","#8a5a2a"],
 d_mash:["bowl","#e8a0c8","#b84a8a","#6a1a4a","#e8e8e8","#6a4a8a"],d_egg:["plate_food","#ffffff","#d8e0e8","#8a98a8","#f8d040"],
 d_skewer:["skewer","#e8b090","#a8603a","#5a2a14","#000","#b08a5a"],d_stew:["bowl","#e8a868","#a8602a","#5a2a10","#e8e8e8","#4a6a8a"],
 d_tea:["mug","#e8c890","#a87a3a","#5a3a14","#c8e8a0"],d_jerky:["strip","#d89070","#8a3a20","#4a1a0a","#c8603a"],
 d_pie:["pie","#f8d8a0","#d8a050","#8a5a20","#e8b060"],d_porridge:["bowl","#f8ecd0","#e0c890","#a08a50","#e8e8e8","#a8603a"],
 d_moon:["bowl","#e8f0ff","#a8c0f0","#5a70b0","#e8e8e8","#3a3a6a"],d_fowl:["plate_food","#ffffff","#e8d8c0","#a89070","#c87838"],
 d_ironbread:["loaf","#d8dce0","#9aa0a8","#5a606a"],d_chili:["bowl","#ff9a6a","#d0301a","#7a1008","#ffd0a0","#3a2a2a"],
 d_seafeast:["plate_food","#e8f4ff","#9ac0e0","#4a7aa8","#5ab8a8"],d_tart:["pie","#fff4c0","#e8c860","#a08a20","#f0a020"],
 d_omelette:["plate_food","#ffffff","#e0d0b0","#a08a60","#f0e080"],d_hydra:["bowl","#a8f0d8","#2ab090","#0e6050","#e8e8e8","#2a4a4a"],
 d_steak:["plate_food","#ffffff","#d0c8c8","#8a8080","#a8301a"],d_banquet:["plate_food","#e4fdff","#7fe3f0","#2f8fa8","#f0c040"],
 p_silk:["spool","#ffffff","#e0dcea","#a09ab0","#000","#8a6a3a"],p_shell:["shell","#c8e8a0","#6a9a3a","#34561a"],p_shard:["shard","#fff6dc","#e2d3a8","#a89466"],
 p_hide:["hide","#e8b080","#a8683a","#603818","#7a4a22"],p_ear:["ear","#c8f0a0","#6ab84a","#2e6a1e","#e88a8a"],p_pelt:["hide","#d8d8e0","#8a8a98","#4a4a58","#5a5a6a"],
 p_fang:["fang","#fffbe8","#e8dcc0","#a89870"],p_feather:["feather","#fff8e0","#e8c060","#a07a20","#c87838"],p_horn:["horn","#f0e0c0","#a87a48","#5a3a18","#e8c070","#3a2a1a"],
 p_dscale:["scale","#ffb080","#d84a2a","#7a1a0a","#ffd040"],p_claw:["claw","#f4ecd8","#c0b090","#6a5a40"],
 lockpick:["lockpick","#e6ebef","#a9b4bd","#5f6b75","#e8c070"],rope:["rope","#f0d8a0","#c09a5a","#7a5a2a"],tent:["tent","#f0e0b0","#c8a060","#7a5a2a","#3a2a1a"],
 x_poison:["vial","#c8ffa0","#5ac83a","#2a6a1a","#a8f060","#9a6a3a","#e8e8e8"],x_stink:["bowl","#c8d890","#8a9a3a","#4a5a1a","#a8c040","#6a5a3a"],
 x_badhp:["bowl","#d8b0a0","#9a6a5a","#5a3a30","#8a8a6a","#5a4a3a"],x_badmp:["flask","#a8a0b8","#5a5070","#2a2438","#6a6a5a","#6a5a3a","#8a8a9a"],
 x_badsta:["meat","#c8a898","#8a6a5a","#4a3028","#6a5a4a","#d8d0c0"]};
// gear: the material words in the item's name/id pick the metal/cloth colours
const MAT=[[/crystal/,["#e4fdff","#7fe3f0","#2f8fa8"]],[/runic|rune|glyph|sigil|warding|etched/,["#e2d2ff","#9a7ad8","#55388f"]],
 [/moon/,["#eef4ff","#b9c8e8","#6f7fa8"]],[/silver|pale/,["#ffffff","#c8ccd4","#7d8490"]],[/ember|fire|flame/,["#ffd08a","#e2622e","#8e2a14"]],
 [/griffin|gold/,["#fff0a0","#e0b030","#8e6a10"]],[/gargoyle|stone/,["#d6d2c8","#9a958a","#5e5a52"]],[/bone|rib|skull|horn/,["#fff6dc","#e2d3a8","#a89466"]],
 [/grave|hollow|shadow|night|silent|ash/,["#b8b0c8","#6a6080","#3a3248"]],[/scale|harpy|drake|hydra/,["#ffe0a0","#d49a3a","#8a5a1a"]],
 [/verdant|green|moss|vine|leaf|thorn|briar|fairy|forest|meadow|yew|bark|goblin/,["#d8f5b0","#6fb24a","#2f6a26"]],
 [/copper|scrap|rust/,["#f8c090","#c47038","#7a3e18"]],[/wayfarer|trail|camp|travel|scavenger|hunt|sinew|wolf/,["#e9c48a","#a87444","#6a4322"]],
 [/iron|steel|rivet|notch|heavy|split|dented/,["#e6ebef","#a9b4bd","#5f6b75"]]];
const CLOTH=["#f3e6c8","#c9b48a","#8a7552"],LEATHER=["#e2b07a","#9c6233","#5e3816"],METAL=["#e6ebef","#a9b4bd","#5f6b75"],WOOD="#8a5a2e";
const ZONE=["#e8c070","#c98a3a","#5fb84a","#9fb8ff","#b07ae0","#6fe8f0"];
const GEMS=["#e8343a","#3a6ee0","#3ac85a","#f0c020","#b04ae0","#20d0d0","#ff7a2a","#ff5ab0","#ffffff","#7a2a1a","#2a8a5a","#5a3ab0","#c8e840","#4ab0ff","#e8a0ff","#a0a0a0"];
const ACC2=["#e8c070","#d86a3a","#7ad05a","#8ab0ff","#c88aff","#5af0e0","#ffd85a","#ff8ab0"];
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
function look(id,it,salt){
 if(BOT[id])return {rows:BOTTLE.split("|"),pal:BOT[id],bottle:id};
 const m=MISC[id];if(m)return {rows:T[m[0]].split("|"),pal:{K,L:m[1],M:m[2],D:m[3],A:m[4]||m[2],W:m[5]||WOOD,G:m[6]||m[1]},salt:0,tpl:m[0]};
 const k=kind(id,it),w=(id+" "+(it.n||"")).toLowerCase();let mat=null;for(const [re,p] of MAT)if(re.test(w)){mat=p;break;}
 if(!mat)mat=/robe|hood|wraps/.test(k)?CLOTH:/vest|softboot/.test(k)?LEATHER:k==="tome"?["#e8a070","#a83a2a","#5a1a14"]:METAL;
 const z=(/^(?:relic|z)(\d)/.exec(id)||[])[1],h=hash(id+"#"+salt);
 const A=salt?ACC2[(h>>>4)%ACC2.length]:ZONE[z?+z:0],G=GEMS[h%GEMS.length];
 const pal={K,L:mat[0],M:mat[1],D:mat[2],A,G,W:WOOD};if(k==="bow"||k==="staff"){pal.W=/wood|oak|yew|bark|root|ash|knot|camp|bent|leaf|greenwood|palewood/.test(w)?["#c89a5a","#8a5a2e","#a8743a"][h%3]:mat[1];pal.L=mat[0];}
 return {rows:T[k].split("|"),pal,salt,tpl:k};}
function rects(rows,pal){let r="";rows.forEach((row,y)=>{let x=0;while(x<row.length){const ch=row[x],c=pal[ch];if(!c||ch==="."){x++;continue;}let e=x+1;while(e<row.length&&row[e]===ch)e++;r+='<rect x="'+x+'" y="'+y+'" width="'+(e-x)+'" height="1" fill="'+c+'"/>';x=e;}});return r;}
let BUILT=null;
function build(){const R=root.RPG;if(!R||!R.ITEMS)return null;const out={},seen=new Map();
 for(const id of Object.keys(R.ITEMS).sort()){const it=R.ITEMS[id];let salt=0,L,body;
  for(;;){L=look(id,it,salt);body=rects(L.rows,L.pal);if(!seen.has(body)||salt>60)break;salt++;}
  seen.set(body,id);out[id]={body,w:L.rows[0].length,h:L.rows.length,tpl:L.bottle?"bottle":L.tpl,bottle:L.bottle};}
 return out;}
function get(id){if(!BUILT||(root.RPG&&root.RPG.ITEMS&&Object.keys(root.RPG.ITEMS).length!==BUILT.n)){const b=build();if(!b)return null;BUILT={map:b,n:Object.keys(b).length};}return BUILT.map[id]||null;}
function svg(id){const g=get(id);if(!g)return "";
 return '<svg class="iic-svg" data-icon-id="'+id+'" data-icon-kind="'+g.tpl+'" viewBox="0 0 '+g.w+' '+g.h+'" shape-rendering="crispEdges" aria-hidden="true" focusable="false">'+g.body+'</svg>';}
function all(){get("potion");return BUILT?Object.assign({},BUILT.map):{};}
const API={svg,has:id=>!!get(id),all,TEMPLATES:T,MISC};
root.SOTA_ICONS=API;if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
