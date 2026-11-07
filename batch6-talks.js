/* Checked sequential batch 6; register only, sharing the earlier lifecycle slots. */
(function(root){"use strict";
const TALKS=[
 {
  "id": "C31",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "water-spill",
  "lines": [
   [
    "Q",
    "calm",
    "Oh—there it goes. The water wanted a walk more than I did."
   ],
   [
    "S",
    "calm",
    "Water on bedding stays wet. Right the skin before more of it soaks in. What has already run into the dirt is spent."
   ],
   [
    "Q",
    "calm",
    "Spent. So the dirt drank it and I don't get that part back, even if I fuss at the puddle."
   ]
  ]
 },
 {
  "id": "C32",
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
    "There was a blue stone on the path today. Just sitting there like it wanted to be noticed."
   ],
   [
    "A",
    "calm",
    "You stop for painted pebbles. Empty heads collect trash and call it a find."
   ],
   [
    "Q",
    "calm",
    "I saw a color on the walk and mentioned it. Looking at a stone isn't me being empty."
   ],
   [
    "A",
    "calm",
    "Then keep the pebble. Your path scraps do not interest me."
   ]
  ]
 },
 {
  "id": "C33",
  "context": "camp",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "loose-peg",
  "lines": [
   [
    "S",
    "calm",
    "That peg is loose. If it stays that way, the line will sag before morning."
   ],
   [
    "A",
    "calm",
    "Stop inspecting the camp around me. Spare me a walkthrough of every stake."
   ],
   [
    "S",
    "calm",
    "Inspection is not the point. A loose peg will not hold through the night."
   ],
   [
    "A",
    "calm",
    "Fine. It is loose. Do not turn a stake into a lecture."
   ]
  ]
 },
 {
  "id": "C34",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "lantern-moth",
  "lines": [
   [
    "Q",
    "calm",
    "Look at this one. It found the lantern and decided we were having a party."
   ],
   [
    "S",
    "calm",
    "Bright light pulls night insects in. Batting at it will only turn it around and send it back."
   ],
   [
    "Q",
    "calm",
    "Send it back. So a swipe just gives it another run at the glow."
   ],
   [
    "S",
    "calm",
    "Leave the light as it is, or dim it. The moth will keep returning while the lantern stays bright."
   ]
  ]
 },
 {
  "id": "C35",
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "dropped-button",
  "lines": [
   [
    "Q",
    "calm",
    "I dropped a button by the bedroll. It's in this dirt somewhere. Come on, little thing."
   ],
   [
    "A",
    "calm",
    "You cannot even hold onto your own kit. Crawling the ground for a button is a pathetic show."
   ],
   [
    "Q",
    "calm",
    "I lost one small piece and I'm looking for it. Searching for my own button is me keeping track, not wasting the night."
   ],
   [
    "A",
    "calm",
    "Then find it without making a performance of the hunt."
   ]
  ]
 },
 {
  "id": "C36",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "fire-shadows",
  "lines": [
   [
    "Q",
    "calm",
    "That shadow on the tent is huge. Like the pack grew legs and got taller than the fire."
   ],
   [
    "S",
    "calm",
    "Close fire throws long shadows. A pack or a branch reads larger on the wall than it is."
   ],
   [
    "Q",
    "calm",
    "Larger on the wall than it is. So the stretch is the light doing extra work, not the pack turning into something else."
   ]
  ]
 },
 {
  "id": "A31",
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
    "Why am I still this loud? The fight's over and I'm talking like I'm still in the middle of it."
   ],
   [
    "S",
    "calm",
    "Leftover force stays in the voice after the last blow. The room is already quiet enough. It does not need that volume."
   ],
   [
    "Q",
    "calm",
    "Doesn't need that volume. So my voice just hasn't caught up to the quiet yet. I hear it. I haven't packed it away."
   ]
  ]
 },
 {
  "id": "A32",
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
    "There's a cobweb riding my collar. I came out of that wearing the room."
   ],
   [
    "A",
    "calm",
    "You wear the mess like a prize. Sloppy things come out decorated and then show it off."
   ],
   [
    "Q",
    "calm",
    "A web caught on me in the scramble. Wearing a bit of the room is what happens when you move through it."
   ],
   [
    "A",
    "calm",
    "Then pull it off. I have no interest in what you collected."
   ]
  ]
 },
 {
  "id": "A33",
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
    "There were three. The start of the clash felt like more than that."
   ],
   [
    "A",
    "calm",
    "Stop counting my fights back to me. I am not sitting for an audit of what already went down."
   ],
   [
    "S",
    "calm",
    "It is a count, not an audit. Three fell. The opening only felt larger."
   ],
   [
    "A",
    "calm",
    "Then keep your count. I was there for all three."
   ]
  ]
 },
 {
  "id": "A34",
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
    "My fingers feel borrowed from a cold creek. Not shaky. Just clammy and weird."
   ],
   [
    "S",
    "calm",
    "Hard effort pulls blood toward the larger muscles. The hands go cold until you settle."
   ],
   [
    "Q",
    "calm",
    "Until I settle. So the warmth is waiting on the rest of me, not on me rubbing a story into them."
   ],
   [
    "S",
    "calm",
    "Warmth returns as the effort lets go. The fingers will follow once the work in the larger muscles eases."
   ]
  ]
 },
 {
  "id": "A35",
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
    "That roar hit my ears harder than the hitting did. The sound was the part that got through."
   ],
   [
    "A",
    "calm",
    "You mind a noise and miss the work. Soft ears, softer head."
   ],
   [
    "Q",
    "calm",
    "The roar was louder than the hitting. I can say that without being treated like I'll crack from a sound."
   ],
   [
    "A",
    "calm",
    "Saying you will not crack does not erase the fuss you made about a roar."
   ]
  ]
 },
 {
  "id": "A36",
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "rubble-block",
  "lines": [
   [
    "S",
    "calm",
    "What fell is sitting in the way we came in. The straight line is blocked. We will have to step around it."
   ],
   [
    "A",
    "calm",
    "Stop pointing out rubble as if I failed to notice the blockage."
   ],
   [
    "S",
    "calm",
    "Noticing it does not move it. The path we used is no longer clear."
   ],
   [
    "A",
    "calm",
    "Then we step around it. Do not make a lesson of a pile."
   ]
  ]
 },
 {
  "id": "T28",
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "laughter-burst",
  "lines": [
   [
    "Q",
    "calm",
    "That laugh just rolled right over us. Like their table spilled a wave and we got hit."
   ],
   [
    "S",
    "calm",
    "Sound carries this far from that table. Talking over it will be harder until the burst dies down."
   ],
   [
    "Q",
    "calm",
    "Until it dies down. So talking here has to wait while that burst is still on us."
   ],
   [
    "S",
    "calm",
    "The laugh will pass. Until it does, anything said here will have to wait under it."
   ]
  ]
 },
 {
  "id": "T29",
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
    "This bench has no give at all. It's just a plank pretending to be a seat."
   ],
   [
    "A",
    "calm",
    "You whine about wood. Only a soft fool notices a bench like it owes her a cushion."
   ],
   [
    "Q",
    "calm",
    "I said the seat is hard. That's the bench I'm sitting on, and I can notice wood without being a fool."
   ],
   [
    "A",
    "calm",
    "Then sit on it and be quiet. Spare me a review of the plank."
   ]
  ]
 },
 {
  "id": "T30",
  "context": "tavern",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "floor-wet",
  "lines": [
   [
    "S",
    "calm",
    "There is a wet patch on the floor beside this seat. A step there would slide."
   ],
   [
    "A",
    "calm",
    "Keep your caution. A wet floor does not require you to manage my steps."
   ],
   [
    "S",
    "calm",
    "Caution after a slip is late. The wet is where a step would land."
   ],
   [
    "A",
    "calm",
    "Then I will not step there. Keep the lecture."
   ]
  ]
 },
 {
  "id": "T31",
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
    "The hands just changed. Is that the middle part? I keep guessing which stage they're in."
   ],
   [
    "S",
    "calm",
    "Following the motions will not make the work stop sooner. The stage you guess has no hold on when they set the work down."
   ],
   [
    "Q",
    "calm",
    "No hold on when they set it down. I hear you. I'm still watching the hands anyway."
   ]
  ]
 },
 {
  "id": "T32",
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
    "We could stand and walk to the door and back. Just to pass the wait."
   ],
   [
    "A",
    "calm",
    "You cannot sit for a stretch of quiet. Only a fool needs a walk to survive a bench."
   ],
   [
    "Q",
    "calm",
    "I asked if we could stretch our legs. A short walk to the door is one way to fill the wait, not a failure to sit."
   ],
   [
    "A",
    "calm",
    "Then sit. I will not parade to the door because you are bored."
   ]
  ]
 },
 {
  "id": "T33",
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
    "The bench still carries a faint shake. That tremor is coming from the work, so the work is not finished."
   ],
   [
    "A",
    "calm",
    "The wait does not need a running account of the floor."
   ],
   [
    "S",
    "calm",
    "The account does not drive the tremor. As long as the seat shakes, the work is still going."
   ],
   [
    "A",
    "calm",
    "Then let the floor shake. I already know we are still waiting."
   ]
  ]
 }
];
const seenKey=id=>"batch6-"+id;
function install(S,R,H,M){
 const seq=S.rpg.s6.sequential;
 function gate(t,s,l){switch(t.gate){
  // These scene observations do not exist; retain the lines without inventing flags.
  case "water-spill":case "loose-peg":case "lantern-moth":case "dropped-button":
  case "fire-shadows":case "rubble-block":case "laughter-burst":case "floor-wet":return false;
  default:return true;
 }}
 seq.add(TALKS,seenKey,gate);
 return {gate};
}
if(typeof module!=="undefined"&&module.exports)module.exports={TALKS,seenKey,install};
if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=="undefined"?window:globalThis);
