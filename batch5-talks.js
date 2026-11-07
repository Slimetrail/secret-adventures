/* Checked sequential batch 5; register only, sharing the earlier lifecycle slots. */
(function(root){"use strict";
const TALKS=[
 {
  "id": "C25",
  "context": "camp",
  "speakers": [
   "S",
   "Q"
  ],
  "gate": "smoke-clothes",
  "lines": [
   [
    "S",
    "calm",
    "Smoke has settled in your clothes. It is still held in the cloth even after you left the fire."
   ],
   [
    "Q",
    "calm",
    "Still held in the cloth. I thought I'd left the fire where I was sitting."
   ],
   [
    "S",
    "calm",
    "Cloth keeps the smell after the heat is gone. Distance from the fire does not clear it."
   ]
  ]
 },
 {
  "id": "C26",
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
    "That yawn took over my whole face. I didn't mean to make it so loud."
   ],
   [
    "A",
    "calm",
    "You announce every stretch like the night should stop and watch. Empty heads make the most noise."
   ],
   [
    "Q",
    "calm",
    "I was tired. My mouth opened. That isn't a speech, and it isn't proof I have nothing in my head."
   ],
   [
    "A",
    "calm",
    "Then keep the noise down. I can hear you wasting air from here."
   ]
  ]
 },
 {
  "id": "C27",
  "context": "camp",
  "speakers": [
   "S",
   "A"
  ],
  "gate": null,
  "lines": [
   [
    "S",
    "calm",
    "There is still dark left. Cutting the stop short throws away the rest already taken."
   ],
   [
    "A",
    "calm",
    "Stop clocking me. I did not come here to be told when I may stand."
   ],
   [
    "S",
    "calm",
    "Standing now discards what this stop already paid for. That is wasted rest, not freedom."
   ],
   [
    "A",
    "calm",
    "Then call it wasted. I am done being told how long to sit."
   ]
  ]
 },
 {
  "id": "C28",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "hole-sock",
  "lines": [
   [
    "Q",
    "calm",
    "My sock has a window now. Hello, toe. I didn't know you wanted out."
   ],
   [
    "S",
    "calm",
    "Bare skin will rub against the boot. A hole left alone becomes a blister."
   ],
   [
    "Q",
    "calm",
    "A blister. So the little window is going to charge me for looking through it."
   ],
   [
    "S",
    "calm",
    "Close it or change the sock before you walk. Rubbing will worsen as we go."
   ]
  ]
 },
 {
  "id": "C29",
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
    "There's more heat on this side. I can move. You could have the warmer place."
   ],
   [
    "A",
    "calm",
    "Keep your charity. You think I need looking after. You want credit for fussing over a little heat."
   ],
   [
    "Q",
    "calm",
    "I had extra warmth and I offered it. I wasn't collecting thanks, and I wasn't treating you like you can't sit by a fire."
   ],
   [
    "A",
    "calm",
    "Then keep the seat. Your kindness is just another way to hover."
   ]
  ]
 },
 {
  "id": "C30",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "hair-tangle",
  "lines": [
   [
    "Q",
    "calm",
    "There's a knot in my hair. It's decided to live there rent-free."
   ],
   [
    "S",
    "calm",
    "A hard pull will tighten it. The tangle comes out only if it is eased."
   ],
   [
    "Q",
    "calm",
    "Only if it's eased. So yanking it just makes a worse tenant."
   ]
  ]
 },
 {
  "id": "A25",
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
    "My mouth feels like I borrowed someone else's dust. There's no spit left in there at all."
   ],
   [
    "S",
    "calm",
    "Hard breathing dries the mouth. The moisture returns as the breath settles."
   ],
   [
    "Q",
    "calm",
    "As the breath settles. So the dryness is waiting on my lungs, not on me talking it into leaving."
   ]
  ]
 },
 {
  "id": "A26",
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
    "I almost sat down without meaning to. My foot went, then it came back. I'm still standing."
   ],
   [
    "A",
    "calm",
    "Almost isn't a victory. You keep your feet like someone who barely belongs on them."
   ],
   [
    "Q",
    "calm",
    "I stayed up. I put that foot back myself. That's me belonging on them, not me failing at standing."
   ],
   [
    "A",
    "calm",
    "Then watch the ground next time. I will not drag you when your luck runs out."
   ]
  ]
 },
 {
  "id": "A27",
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
    "Your hand is still locked on the grip. The hold has outlasted the last drop."
   ],
   [
    "A",
    "calm",
    "Stop studying my fingers. I am not a lesson for you to read out loud."
   ],
   [
    "S",
    "calm",
    "It is not a lesson. The hand is still set for a blow that is no longer coming."
   ],
   [
    "A",
    "calm",
    "Then look elsewhere. The fight is over. I will open it when I open it."
   ]
  ]
 },
 {
  "id": "A28",
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
    "There's a hitch in my side. It keeps poking me when I breathe, like it has opinions."
   ],
   [
    "S",
    "calm",
    "Leftover effort can catch there. The stitch eases when the breathing slows."
   ],
   [
    "Q",
    "calm",
    "When the breathing slows. The hitch isn't going to hop out just because I noticed it."
   ],
   [
    "S",
    "calm",
    "Slower breath gives the side time to release. Forcing the pace will keep the catch."
   ]
  ]
 },
 {
  "id": "A29",
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
    "My elbow is buzzing where it met the wall. Just a sting. It's very proud of itself."
   ],
   [
    "A",
    "calm",
    "You notice every scrape and miss the fight that put it there. Soft things bruise and then complain."
   ],
   [
    "Q",
    "calm",
    "The sting is on my elbow, not in my head. I can mention a knock without being made of glass."
   ],
   [
    "A",
    "calm",
    "Then stop serving me the sting. Your elbow can hurt without an audience."
   ]
  ]
 },
 {
  "id": "A30",
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "armor-scuff",
  "lines": [
   [
    "S",
    "calm",
    "That scuff landed closer than it first looked. The mark shows how near the blow came."
   ],
   [
    "A",
    "calm",
    "Stop turning a scuff into a lecture. I know how close it came. I was under it."
   ],
   [
    "S",
    "calm",
    "The covering took the hit so the next layer did not. That is why the nick matters."
   ],
   [
    "A",
    "calm",
    "Then the covering did its work. Leave the mark alone."
   ]
  ]
 },
 {
  "id": "T22",
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "draft-seat",
  "lines": [
   [
    "Q",
    "calm",
    "Something just walked across the back of my neck. A little ribbon of cold that doesn't match the rest of the room."
   ],
   [
    "S",
    "calm",
    "The door pulls a draft across this seat. The hearth's heat falls off before it reaches us."
   ],
   [
    "Q",
    "calm",
    "Falls off before it reaches us. So this seat is outside the warm part on purpose, not because I imagined a ghost."
   ],
   [
    "S",
    "calm",
    "A seat nearer the hearth would hold more heat. This one will keep taking the draft."
   ]
  ]
 },
 {
  "id": "T23",
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
    "There's an old ring on this table. Like a cup sat here long enough to leave a ghost."
   ],
   [
    "A",
    "calm",
    "You could stare at stained wood all night and still learn nothing. Only an empty head finds a story in a blot."
   ],
   [
    "Q",
    "calm",
    "I looked at a mark that was already there. That is looking, not a failure to think."
   ],
   [
    "A",
    "calm",
    "Then stop fussing over a stain. I have no use for what you notice on a table."
   ]
  ]
 },
 {
  "id": "T24",
  "context": "tavern",
  "speakers": [
   "S",
   "A"
  ],
  "gate": null,
  "lines": [
   [
    "S",
    "calm",
    "This seat sits in the spill of that table's noise. A quieter spot would make talk easier."
   ],
   [
    "A",
    "calm",
    "I sat down once. I will not hop seats because you dislike the volume."
   ],
   [
    "S",
    "calm",
    "Disliking the volume is not the point. Noise this close will keep cutting across whatever is said."
   ],
   [
    "A",
    "calm",
    "Then let it cut. I am staying where I am."
   ]
  ]
 },
 {
  "id": "T25",
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
    "Sixteen bottles on that shelf. No, seventeen. I lost the short one behind the tall ones."
   ],
   [
    "S",
    "calm",
    "Numbering the shelf will not change when the work ends. The count has no effect on the finish."
   ],
   [
    "Q",
    "calm",
    "No effect on the finish. The bottles don't care, and neither does the wait. I know."
   ]
  ]
 },
 {
  "id": "T26",
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
    "We could trade a short story while we wait. Or a riddle. Something small, just to pass the time."
   ],
   [
    "A",
    "calm",
    "Stories and riddles are for children who cannot sit still. Only a fool asks for one."
   ],
   [
    "Q",
    "calm",
    "It was an offer to pass the time. Refusing is fine. Treating the ask like stupidity is the part that isn't true."
   ],
   [
    "A",
    "calm",
    "Then keep your stories. I will sit here without being entertained."
   ]
  ]
 },
 {
  "id": "T27",
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
    "The glow from the work has not gone out. Light like that means it is still underway."
   ],
   [
    "A",
    "calm",
    "The glow is right there. Talking about it will not pull us out of this seat any sooner."
   ],
   [
    "S",
    "calm",
    "Speech does not govern the flare. It drops when the craft lets go of it, not when we tire of the seat."
   ],
   [
    "A",
    "calm",
    "Then the glow can take its time. I am not thanking you for pointing at it."
   ]
  ]
 }
];
const seenKey=id=>"batch5-"+id;
function install(S,R,H,M){
 const seq=S.rpg.s6.sequential;
 function gate(t,s,l){switch(t.gate){
  // These scene observations do not exist; retain the lines without inventing flags.
  case "smoke-clothes":case "hole-sock":case "hair-tangle":
  case "armor-scuff":case "draft-seat":return false;
  default:return true;
 }}
 seq.add(TALKS,seenKey,gate);
 return {gate};
}
if(typeof module!=="undefined"&&module.exports)module.exports={TALKS,seenKey,install};
if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=="undefined"?window:globalThis);
