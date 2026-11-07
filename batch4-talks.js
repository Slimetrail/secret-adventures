/* Checked sequential batch 4; register only, sharing the earlier lifecycle slots. */
(function(root){"use strict";
const TALKS=[
 {
  "id": "C19",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "damp-boots",
  "lines": [
   [
    "Q",
    "calm",
    "My boots keep talking. Every step is squelch, squelch. They're very chatty today."
   ],
   [
    "S",
    "calm",
    "Dew collected on the walk in. Wet cloth will hold the chill until it dries."
   ],
   [
    "Q",
    "calm",
    "Until it dries. So they aren't going to cheer up just because I asked them to."
   ]
  ]
 },
 {
  "id": "C20",
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
    "I didn't mean to start a song. It just showed up under my breath."
   ],
   [
    "A",
    "calm",
    "Even your silence finds a way to leak. That noise is as empty as you are."
   ],
   [
    "Q",
    "calm",
    "The tune found me. I wasn't throwing it at you, and it didn't leave my head hollow."
   ],
   [
    "A",
    "calm",
    "Aim it nowhere. I came here for quiet, not your leftover noise."
   ]
  ]
 },
 {
  "id": "C21",
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
    "The coals should be covered. Left open, they will burn through what fuel remains."
   ],
   [
    "A",
    "calm",
    "Cover them yourself. I don't need a lesson in keeping a fire from dying."
   ],
   [
    "S",
    "calm",
    "It is not a lesson. Uncovered coals will be ash before this stop is over."
   ],
   [
    "A",
    "calm",
    "Then pile the ash yourself. Spare me the forecast."
   ]
  ]
 },
 {
  "id": "C22",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "boot-grit",
  "lines": [
   [
    "Q",
    "calm",
    "There's a pebble in my boot. One tiny rock, and now it owns the whole step."
   ],
   [
    "S",
    "calm",
    "Take it out. Left there, it will work deeper and raise a sore."
   ],
   [
    "Q",
    "calm",
    "Work deeper and raise a sore. I thought it was only being a pest."
   ],
   [
    "S",
    "calm",
    "Remove it before you stand again. Walking on it wastes the next stretch."
   ]
  ]
 },
 {
  "id": "C23",
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
    "Tell me something. For once. It doesn't have to be a long something."
   ],
   [
    "A",
    "calm",
    "You want a performance. I don't speak so you have something to clap at."
   ],
   [
    "Q",
    "calm",
    "I asked for a word, not a show. I wanted to hear you. I can ask for that and still have my wits."
   ],
   [
    "A",
    "calm",
    "Then sit with the quiet. Nothing I have is meant for you."
   ]
  ]
 },
 {
  "id": "C24",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "low-supply",
  "lines": [
   [
    "Q",
    "calm",
    "Look at this flask. It's more air than water now. Very spacious of it."
   ],
   [
    "S",
    "calm",
    "There is not enough to spend freely. Using it now leaves us short later."
   ],
   [
    "Q",
    "calm",
    "Short later. The lonely look is a warning, then, not an invitation."
   ]
  ]
 },
 {
  "id": "A19",
  "context": "after-fight",
  "speakers": [
   "S",
   "Q"
  ],
  "gate": null,
  "lines": [
   [
    "S",
    "calm",
    "The clash is still in your ears. That ringing is leftover pressure from the noise."
   ],
   [
    "Q",
    "calm",
    "Oh. That explains the buzzing. I thought my head had started its own little hive."
   ],
   [
    "S",
    "calm",
    "The pressure has not cleared yet. It will fade as the ears settle, not because you joke it away."
   ],
   [
    "Q",
    "calm",
    "Not because I joke it away. Good to know the hive has its own ideas."
   ]
  ]
 },
 {
  "id": "A20",
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
    "Look at my hands. They're still dancing. Nobody even asked them to."
   ],
   [
    "A",
    "calm",
    "Shaking already. One hard fight and you come apart at the wrists."
   ],
   [
    "Q",
    "calm",
    "They're shaking. I didn't drop anything, and I didn't come apart."
   ],
   [
    "A",
    "calm",
    "Hold them still before I have to watch you fumble the next simple thing."
   ]
  ]
 },
 {
  "id": "A21",
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
    "That ended sooner than the pressure suggested. The last stand broke before the effort matched it."
   ],
   [
    "A",
    "calm",
    "Too soon. I still had heat for it, and it dropped anyway."
   ],
   [
    "S",
    "calm",
    "The fight ended at the drop, not at your satisfaction. Remaining heat does not rewrite that."
   ],
   [
    "A",
    "calm",
    "Then I am left with the heat and nothing to spend it on. That sits wrong."
   ]
  ]
 },
 {
  "id": "A22",
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
    "Well. My sleeve has a new opening. I don't remember ordering that."
   ],
   [
    "S",
    "calm",
    "A tear left alone will spread. Mend it, or the sleeve will keep opening."
   ],
   [
    "Q",
    "calm",
    "Won't hold. So the new opening is going to keep growing if I admire it."
   ]
  ]
 },
 {
  "id": "A23",
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
    "I can feel the dust in my hair. I must look like I lost an argument with the floor."
   ],
   [
    "A",
    "calm",
    "You notice the dirt on your head and miss everything that mattered."
   ],
   [
    "Q",
    "calm",
    "The dust is on me. I can feel that and still know what just happened."
   ],
   [
    "A",
    "calm",
    "Then stop preening. The dirt is the only thing you managed to collect."
   ]
  ]
 },
 {
  "id": "A24",
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
    "Dust from the fight is still in the air. It will settle on its own."
   ],
   [
    "A",
    "calm",
    "I have eyes. I can see the haze. Your comments on it help no one."
   ],
   [
    "S",
    "calm",
    "It will sting the throat until it drops. That is why I marked it."
   ],
   [
    "A",
    "calm",
    "Then let it drop without the commentary. I can taste it already."
   ]
  ]
 },
 {
  "id": "T16",
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "table",
  "lines": [
   [
    "Q",
    "calm",
    "This table has opinions. Every time I set my cup down, it sends it walking."
   ],
   [
    "S",
    "calm",
    "One leg is shorter than the others. An uneven base will keep the surface rocking."
   ],
   [
    "Q",
    "calm",
    "A short leg. So the cup isn't restless. The table is."
   ],
   [
    "S",
    "calm",
    "Set the cup nearer the center. The rock is worse toward the edge."
   ]
  ]
 },
 {
  "id": "T17",
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
    "The room already had a beat. My fingers just joined in. They do that."
   ],
   [
    "A",
    "calm",
    "Tapping along like a child. You cannot hear a sound without adding a stupider one."
   ],
   [
    "Q",
    "calm",
    "I joined a beat that was already here. I heard it and followed. Hate the tapping if you want. Don't treat me like a child."
   ],
   [
    "A",
    "calm",
    "Then keep those fingers still. The room was loud enough without your help."
   ]
  ]
 },
 {
  "id": "T18",
  "context": "tavern",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "listed-price",
  "lines": [
   [
    "S",
    "calm",
    "The listed price is high for what it covers. Paying it now buys less than the number suggests."
   ],
   [
    "A",
    "calm",
    "Then stop reading the board at me. I didn't ask you to weigh every coin."
   ],
   [
    "S",
    "calm",
    "The use does not match the cost. That comparison is why I spoke, not a request that you tally anything."
   ],
   [
    "A",
    "calm",
    "Then keep the comparison. I can dislike a price without your arithmetic."
   ]
  ]
 },
 {
  "id": "T19",
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
    "If I tip any farther, this bench is going to catch my chin. I'm halfway to a nap already."
   ],
   [
    "S",
    "calm",
    "Sleeping upright will not replace rest. The work will end when it ends, whether your eyes close or not."
   ],
   [
    "Q",
    "calm",
    "Won't replace rest, and won't hurry the finish. I heard that. My chin hasn't."
   ]
  ]
 },
 {
  "id": "T20",
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
    "If this cup lands closer to that ring than yours, I win. It's a very serious contest."
   ],
   [
    "A",
    "calm",
    "A child's game. You invent nonsense because your head cannot sit still."
   ],
   [
    "Q",
    "calm",
    "I lined up a few cups to pass the time. Call the game small if you want. I still know what I'm doing."
   ],
   [
    "A",
    "calm",
    "Then watch them quietly. Your little contest is already more than I wanted to see."
   ]
  ]
 },
 {
  "id": "T21",
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
    "The heat has not fallen off. Finished work would have gone cool by now."
   ],
   [
    "A",
    "calm",
    "I can feel the heat. I don't need you to tell me we are still trapped beside it."
   ],
   [
    "S",
    "calm",
    "The smell has not thinned either. Both signs fade only after the work is done."
   ],
   [
    "A",
    "calm",
    "Then sit with the stink if it comforts you. I already know we aren't leaving yet."
   ]
  ]
 }
];
const seenKey=id=>"batch4-"+id;
function install(S,R,H,M){
 const seq=S.rpg.s6.sequential;
 function gate(t,s,l){switch(t.gate){
  // No existing damp-boots/hems, boot-grit, or sticky/wobbly-table observation.
  // Inventory tracks whole supplies, not flask levels: do not invent a low threshold
  // or reuse the earlier drink/ration/food gates.
  case "damp-boots":case "boot-grit":case "low-supply":case "table":return false;
  // shopList renders prices without buying, but dispatches no sequential hook.
  // Tavern-open runs before that listing; H.shop observes payment only. Neither
  // always-available price data nor payment is a listed-price scene observation.
  case "listed-price":return false;
  default:return true;
 }}
 seq.add(TALKS,seenKey,gate);
 return {gate};
}
if(typeof module!=="undefined"&&module.exports)module.exports={TALKS,seenKey,install};
if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=="undefined"?window:globalThis);
