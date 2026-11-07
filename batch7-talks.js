/* Checked sequential batch 7; register only, sharing the earlier lifecycle slots. */
(function(root){"use strict";
const TALKS=[
 {
  "id": "C37",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "fire-sparks",
  "lines": [
   [
    "Q",
    "calm",
    "The fire just spat at my sleeve. Little bright bits, like it had opinions."
   ],
   [
    "S",
    "calm",
    "Live flame sheds sparks. Cloth left that close will catch them."
   ],
   [
    "Q",
    "calm",
    "Will catch them. So the blanket is sitting in the path of what the fire throws, and wishing the sparks away won't move it."
   ]
  ]
 },
 {
  "id": "C38",
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": null,
  "lines": [
   [
    "Q",
    "calm",
    "This tin went lukewarm on me. It started hotter than this."
   ],
   [
    "A",
    "calm",
    "You mind a cup like it betrayed you. Vacant minds pick at tin that has only cooled."
   ],
   [
    "Q",
    "calm",
    "The drink cooled while I held it. I noticed the change in my own cup. That is paying attention, not proof my mind is vacant."
   ],
   [
    "A",
    "calm",
    "Then drink it cold. Talk about tin wastes the air."
   ]
  ]
 },
 {
  "id": "C39",
  "context": "camp",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "lantern-high",
  "lines": [
   [
    "S",
    "calm",
    "The lantern is burning higher than the dark requires. Extra flame spends oil we do not need to spend tonight."
   ],
   [
    "A",
    "calm",
    "Do not set the wick by my ear. Budgeting the night's oil is not a task I asked for."
   ],
   [
    "S",
    "calm",
    "Whether you asked changes nothing. A high wick spends oil while we sleep."
   ],
   [
    "A",
    "calm",
    "Then lower it yourself. Do not turn a lantern into a schedule."
   ]
  ]
 },
 {
  "id": "C40",
  "context": "camp",
  "speakers": [
   "S",
   "Q"
  ],
  "gate": "night-sound",
  "lines": [
   [
    "S",
    "calm",
    "There is a call outside camp. A night bird, from the trees past the firelight."
   ],
   [
    "Q",
    "calm",
    "A night bird! Maybe the round kind that asks the same question over and over."
   ],
   [
    "S",
    "calm",
    "It is an ordinary call. Putting a name on it does not change the night."
   ],
   [
    "Q",
    "calm",
    "Doesn't change the night. So the dark stays the dark, even if I guess the bird wrong."
   ]
  ]
 },
 {
  "id": "C41",
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "stuck-stopper",
  "lines": [
   [
    "Q",
    "calm",
    "This stopper will not give. Come on, twist, you stubborn little cork."
   ],
   [
    "A",
    "calm",
    "You cannot even open your own skin. Wrestling a stopper is a pathetic show."
   ],
   [
    "Q",
    "calm",
    "I'm twisting a stopper that seized up. Fighting a stuck cork is work, not proof I can't handle my own things."
   ],
   [
    "A",
    "calm",
    "Then open it without the show. A cork is not worth that struggle."
   ]
  ]
 },
 {
  "id": "C42",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "lid-rattle",
  "lines": [
   [
    "Q",
    "calm",
    "The pot is chatting. Its lid won't sit still."
   ],
   [
    "S",
    "calm",
    "Steam builds until the lid lifts. Uneven heat makes it knock."
   ],
   [
    "Q",
    "calm",
    "Until the lid lifts. So the chatter is steam pushing up, not the pot trying to talk."
   ]
  ]
 },
 {
  "id": "A37",
  "context": "after-fight",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": null,
  "lines": [
   [
    "Q",
    "calm",
    "My legs have turned into two slow logs. They showed up late, after the hitting stopped."
   ],
   [
    "S",
    "calm",
    "The fight asked more of your legs than standing does. They feel thick because that demand has not yet drained off."
   ],
   [
    "Q",
    "calm",
    "Hasn't drained off. I hear why they feel thick. I'm not going to bounce it out of them like that would hurry the drain."
   ]
  ]
 },
 {
  "id": "A38",
  "context": "after-fight",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": null,
  "lines": [
   [
    "Q",
    "calm",
    "Look at this blot. The color waited until now to show up."
   ],
   [
    "A",
    "calm",
    "You catalogue every mark like a weakling keeping score. Fragile things love a bruise."
   ],
   [
    "Q",
    "calm",
    "Color is coming up on my skin. I found a mark that was not there a moment ago. Seeing my own skin is not cataloguing hurts for you."
   ],
   [
    "A",
    "calm",
    "Then keep the blot to yourself. I did not ask for a tally of your skin."
   ]
  ]
 },
 {
  "id": "A39",
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": null,
  "lines": [
   [
    "S",
    "calm",
    "The clash finished farther across this room than where it started. We ended well away from the first ground."
   ],
   [
    "A",
    "calm",
    "Do not map my steps back to me. I already crossed this room once."
   ],
   [
    "S",
    "calm",
    "It is a measure of distance, not a map of you. The fight moved farther than the opening suggested."
   ],
   [
    "A",
    "calm",
    "Then leave the distance alone. I crossed it. That is enough."
   ]
  ]
 },
 {
  "id": "A40",
  "context": "after-fight",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": null,
  "lines": [
   [
    "Q",
    "calm",
    "My heart is drumming like it didn't get the news. The room went quiet and it didn't."
   ],
   [
    "S",
    "calm",
    "A hard clash keeps blood moving faster than a still room needs. That pace is what is thumping in your ears."
   ],
   [
    "Q",
    "calm",
    "Faster than a still room needs. So the thump is just my blood moving too fast for how quiet it is now."
   ],
   [
    "S",
    "calm",
    "The sound you hear is your own blood, not a blow still landing."
   ]
  ]
 },
 {
  "id": "A41",
  "context": "after-fight",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": null,
  "lines": [
   [
    "Q",
    "calm",
    "I bit the inside of my cheek. My own mouth picked a fight with me."
   ],
   [
    "A",
    "calm",
    "Even your teeth cannot find the right target. You cannot keep track of your own face."
   ],
   [
    "Q",
    "calm",
    "I caught my own cheek in the clash. That is a bite from the work, not me failing to keep track of my face."
   ],
   [
    "A",
    "calm",
    "Then keep your cheek out of your teeth. Your mouth is your problem."
   ]
  ]
 },
 {
  "id": "A42",
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "knocked-crate",
  "lines": [
   [
    "S",
    "calm",
    "That crate is on its side. Leaving it down will catch a foot later."
   ],
   [
    "A",
    "calm",
    "Stop assigning chores from a fall. It tipped. That is not news."
   ],
   [
    "S",
    "calm",
    "A fall does not have to be news to matter. Left on its side, the crate remains a trip."
   ],
   [
    "A",
    "calm",
    "Then stand it up or don't. I am not doing chores because you named a trip."
   ]
  ]
 },
 {
  "id": "T34",
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "table-bumped",
  "lines": [
   [
    "Q",
    "calm",
    "The table just jumped. Someone used us as a corner they didn't quite make."
   ],
   [
    "S",
    "calm",
    "The path between seats is narrow. A bump walks cups toward the edge."
   ],
   [
    "Q",
    "calm",
    "Walks cups toward the edge. So the jolt isn't the table being wild. It's the aisle being too tight for that pass."
   ],
   [
    "S",
    "calm",
    "Anything left near the rim will travel farther than it should. Set it inward if you mean to keep it."
   ]
  ]
 },
 {
  "id": "T35",
  "context": "tavern",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": null,
  "lines": [
   [
    "Q",
    "calm",
    "This mug is heavier than it looked. My hand wasn't ready for that lift."
   ],
   [
    "A",
    "calm",
    "You notice the weight of a cup and call it news. Thin wits turn a lift into a complaint."
   ],
   [
    "Q",
    "calm",
    "I lifted it and it surprised my wrist. Naming the weight I felt is about the mug, not me turning a lift into a complaint."
   ],
   [
    "A",
    "calm",
    "Then hold it and be quiet. The weight of a mug is not worth this fuss."
   ]
  ]
 },
 {
  "id": "T36",
  "context": "tavern",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "candle-drip",
  "lines": [
   [
    "S",
    "calm",
    "The candle is burning off-center. If the drip continues, the wax will reach the table."
   ],
   [
    "A",
    "calm",
    "Let the wax run if it runs. I will move a cup if I have to. Do not hover."
   ],
   [
    "S",
    "calm",
    "Hovering is not the concern. Wax on the wood will spread until the drip stops."
   ],
   [
    "A",
    "calm",
    "Then let it spread. A candle does not need a warden."
   ]
  ]
 },
 {
  "id": "T37",
  "context": "craft-wait",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": null,
  "lines": [
   [
    "Q",
    "calm",
    "I'm counting my breaths to pass the time. That was twelve. Thirteen."
   ],
   [
    "S",
    "calm",
    "Breaths counted on a bench have no claim on the craft. They will finish on their own time."
   ],
   [
    "Q",
    "calm",
    "On their own time. So the numbers are just something to do with my lungs while we sit. They don't hurry anything."
   ]
  ]
 },
 {
  "id": "T38",
  "context": "craft-wait",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": null,
  "lines": [
   [
    "Q",
    "calm",
    "My foot went to sleep on the bench. It's all pins now."
   ],
   [
    "A",
    "calm",
    "Your body cannot even last a sit. Weak things go numb and then complain about it."
   ],
   [
    "Q",
    "calm",
    "Sitting still put my foot to sleep. Pins like that come from the wait, and I can name them without being too weak for a bench."
   ],
   [
    "A",
    "calm",
    "Then sit on the pins. I will not hear a speech about a foot."
   ]
  ]
 },
 {
  "id": "T39",
  "context": "craft-wait",
  "speakers": [
   "S",
   "A"
  ],
  "gate": null,
  "lines": [
   [
    "S",
    "calm",
    "No one has called us or waved us over. The work is still underway."
   ],
   [
    "A",
    "calm",
    "Talking about a missing wave will not finish what they are doing."
   ],
   [
    "S",
    "calm",
    "Talk is not what finishes it. Until someone signals, the work has not been handed back."
   ],
   [
    "A",
    "calm",
    "Then the silence can keep. A missing wave was already obvious."
   ]
  ]
 }
];
const seenKey=id=>"batch7-"+id;
function install(S,R,H,M){
 const seq=S.rpg.s6.sequential;
 function gate(t,s,l){switch(t.gate){
  // These scene observations do not exist; retain the lines without inventing flags.
  case "fire-sparks":case "lantern-high":case "night-sound":case "stuck-stopper":
  case "lid-rattle":case "knocked-crate":case "table-bumped":case "candle-drip":return false;
  default:return true;
 }}
 seq.add(TALKS,seenKey,gate);
 return {gate};
}
if(typeof module!=="undefined"&&module.exports)module.exports={TALKS,seenKey,install};
if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=="undefined"?window:globalThis);
