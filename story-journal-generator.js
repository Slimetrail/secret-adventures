/* t2194u everyday camp filler generator (local only). Follows voice-t2194u-journal-style-rule.md and
   t2194u-generated-journal-facts.md: brief lowercase hero notes from observed facts only; art notes take the locked
   zone feeling from facts.zoneArtFeelings; monster drawings use the facts file's seven hallway monsters per zone with
   one observed strength and one observed weakness. Zone-5 art notes are omitted (J-zone5-mystery / J-zone5-stitch are
   handwritten). No companion portraits, no dad-plot, no tavern/walking notes, no Iron Golem. If facts can't support a note, omit it. */
(function(root){'use strict';
// [name, observed strength, observed weakness] exactly as in the facts file (JC-cap-z1..z5).
const MONSTER_FACTS={
1:[["Rat","a scavenger that gets into everything","it does not take much to drop"],["Slime","soaks hits","it does not hit back very hard"],["Big bug","a hard shell that turns blows","the bite is not the real trouble"],["Cave bat","darts in fast","thin, and easy to drop if he catches it"],["Giant spider","waits and strikes from an ugly angle","not as tough once he faces it"],["Mud toad","sits like a lump and takes punishment","a slow, dull hit"],["Fungus creeper","spores that get past a guard","the body itself is frail"]],
2:[["Goblin","comes in like a raider and makes a nuisance of itself","nothing special about its hide"],["Orc","hits as if it does not care what happens next","it leaves itself open"],["Fairy","little spells that slip through a guard","it breaks if he catches it"],["Kobold","skirmishes and keeps a guard up","not a heavy blow"],["Wild boar","charges hard","poorly guarded once the rush is spent"],["Pixie swarm","many stings that get through","they scatter, and each one is thin"],["Hobgoblin brute","hard to put down","not as sharp a swing as the orc"]],
3:[["Centaur","keeps him at the end of a lance","not a wall"],["Werewolf","tears in close","it does not bother to guard"],["Skeleton","bones that turn a blade","little force behind the swing"],["Ghoul","keeps coming as if hunger is enough","softer than the bones"],["Harpy","dives from above","a light body once it comes down"],["Dire wolf","a hunter's bite","no armor worth the name"],["Wraith","a touch that gets through, and hard to get a solid hold on","little substance once a real hit lands"]],
4:[["Minotaur","breaks a line","not stone-hard"],["Griffin","a hard dive","the body is not the toughest part"],["Lizard man","scales that turn blows","it does not hit as hard as the bigger ones"],["Stone gargoyle","hard to crack","it does not hit hard"],["Manticore","barbs that land ugly","it does not last if he stays on it"],["Ogre warlord","big, and it stays standing","not the sharpest single strike on the stretch"],["Giant scorpion","pincers and a shell that are hard to get through","the armor is the problem more than a huge blow"]],
5:[["Basilisk","a gaze that gets past a guard","not a raw wall of flesh"],["Dragon","fire that wrecks a line","if he lives through the flame, the body can still be hit"],["Hydra","too many heads, and it takes a long time to wear down","the heads are not especially armored"],["Wyvern","a killing strike from the air","not built to stand and take a beating"],["Chimera","mixed attacks from more than one angle","neither the hardest hide nor the single hardest blow"],["Salamander","fire that slips through a guard","the body is not stout"],["Shadow drake","hunts from the dark, with a strike that slips through","not a wall"]]};
// Hero writes in first person: the facts' "he" becomes "i".
const FIRST=[[/\bhe catches\b/g,'i catch'],[/\bhe faces\b/g,'i face'],[/\bhe stays\b/g,'i stay'],[/\bhe lives\b/g,'i live'],[/\bkeeps him\b/g,'keeps me']];
function firstPerson(t){FIRST.forEach(([re,r])=>{t=t.replace(re,r);});return t;}
function caption(m){return m[0].toLowerCase()+': '+firstPerson(m[1])+'. but '+firstPerson(m[2])+'.';}
const ROOM_ZONE={4:1,5:1,1:1,9:2,13:2,15:2,17:2,26:3,23:3,22:3,29:3,36:3,37:4,46:4,38:4,50:4,55:4,57:4,42:4};
// One remembered-place line per locked feeling (zones 1-4). Defaults name no drawer or hand.
const ART={'scary':"i keep remembering the pictures in the first halls. they scared me, and they still do.",
 'sadness-for-father':"thinking back on the pictures in the first halls, mostly i feel sad for dad now.",
 'worry-insane-like-drawer':"the pictures in the lost halls worry me. i'm afraid i could lose my mind down here like whoever made them.",
 'worry-insane-like-dad':"the pictures in the lost halls worry me. i'm afraid i could lose my mind down here like dad did.",
 'curiosity-awe-cracked-crystal':"i keep thinking about the cracked crystal in those pictures. i want to know what happened. it looked so strange, almost mystical.",
 'why-did-you-do-this-dad':"i keep thinking about the cracked crystal in those pictures. why did you do this, dad?",
 'interest-in-ritual':"the pictures of people gathered around the crystal stay with me. i want to understand what they were doing, and how it went wrong.",
 'shame-for-dad':"the pictures of people gathered around the crystal stay with me. knowing dad was part of it, i feel ashamed for him."};
// Day/location thoughts per after-zone cluster (location, day worry, ordinary life). No companions, no plot.
const DAY={1:['locations',"the entrance halls are cold and close. i worried all day that i'd take a wrong turn and not find my way back."],
 2:['ordinary-life',"these halls feel lost, like nobody meant for anyone to find a way out. i miss ordinary days, when i knew where i was going."],
 3:['fight-thoughts',"the fights in these stained halls kept coming today. i'm tired, and i worry about the next one more than i want to admit."],
 4:['locations',"the halls feel more serious now. i keep going over the day and hoping we were careful enough."],
 5:['worry-about-day',"these later halls wear me down. it was a hard day, and i'm worried about tomorrow."]};
function render(f){f=f||{};const out=[],z=+f.zone;const feel=f.zoneArtFeelings||{};
 if(z>=1&&z<=5){const d=DAY[z];out.push({kind:d[0],text:d[1],key:'day:'+z});
  for(let k=1;k<=z;k++)out.push({kind:'monster-drawings',key:'cap:'+k,text:'i drew the monsters from these halls tonight.\n'+MONSTER_FACTS[k].map(caption).join('\n')});}
 const seen={};(f.artRoomsRemembered||[]).forEach(id=>{const az=ROOM_ZONE[id];if(az)seen[az]=1;});
 Object.keys(seen).map(Number).sort().forEach(az=>{const fe=feel[az];if(fe&&ART[fe])out.push({kind:'art-rooms-remembered',zone:az,feeling:fe,text:ART[fe],key:'art:'+az+':'+fe});});
 return out;}
const RULE={approved:true,source:'voice-t2194u-journal-style-rule.md + t2194u-generated-journal-facts.md',voice:{hero:['honest','worried','selfless','player-viewpoint']},render};
root.StoryJournalGenerator={RULE,render,MONSTER_FACTS,caption,ART,DAY,ROOM_ZONE};if(typeof module!=='undefined')module.exports=root.StoryJournalGenerator;
})(typeof window!=='undefined'?window:globalThis);
