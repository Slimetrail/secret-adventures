/* Checked sequential batch 9; register only, sharing the earlier lifecycle slots. */
(function(root){"use strict";
const TALKS=[
 {
  "id": "C49",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "branch-drip",
  "lines": [
   [
    "Q",
    "calm",
    "This drip picked me. Same spot on my shoulder, like I signed up for it."
   ],
   [
    "S",
    "calm",
    "Melt and leftover rain gather at one tip. Once that tip is full, it drops in the same place."
   ],
   [
    "Q",
    "calm",
    "The tip keeps filling and I keep getting hit. It has terrible aim except when it's me."
   ]
  ]
 },
 {
  "id": "C50",
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "undone-bootlace",
  "lines": [
   [
    "Q",
    "calm",
    "My lace came undone again. I'm tying it before I stand on it."
   ],
   [
    "A",
    "calm",
    "Your own boot comes apart and you fuss over the string. Any fool can keep a lace tied."
   ],
   [
    "Q",
    "calm",
    "It slipped while I was sitting still. The lace came loose. I didn't."
   ],
   [
    "A",
    "calm",
    "Then tie it shut and drop the subject."
   ]
  ]
 },
 {
  "id": "C51",
  "context": "camp",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "fire-ring-stone",
  "lines": [
   [
    "S",
    "calm",
    "A stone has rolled out of the fire ring. The gap will let coals and loose twigs catch outside the circle."
   ],
   [
    "A",
    "calm",
    "Put the stone back yourself. I am not your hand for a ring that shifted."
   ],
   [
    "S",
    "calm",
    "The ring is open where that stone sat. Heat will reach past it whether you reset the stone or I do."
   ],
   [
    "A",
    "calm",
    "Then tend your own gap. I will not crawl around the fire for a stone."
   ]
  ]
 },
 {
  "id": "C52",
  "context": "camp",
  "speakers": [
   "S",
   "Q"
  ],
  "gate": "dusk-gnats",
  "lines": [
   [
    "S",
    "calm",
    "Small flies are circling your face. Still air and the fire draw them at dusk."
   ],
   [
    "Q",
    "calm",
    "Hey. Back up, you little tags. I didn't ask for a circling fan club."
   ],
   [
    "S",
    "calm",
    "Waving them only stirs the air they are already riding. They return to the same warm, damp pocket."
   ],
   [
    "Q",
    "calm",
    "I wave and they ride right back in. Fine. They can have the air around my nose if they're that stubborn."
   ]
  ]
 },
 {
  "id": "C53",
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "sleeve-thread",
  "lines": [
   [
    "Q",
    "calm",
    "There's a loose thread on my sleeve, and it keeps catching my fingers. I'm trying to pick it free."
   ],
   [
    "A",
    "calm",
    "Leave the thread alone. Picking at it only proves how little it takes to rattle you."
   ],
   [
    "Q",
    "calm",
    "I'm freeing my fingers when it snags them. That is the thread grabbing me, not me sitting here spooked by a bit of string."
   ],
   [
    "A",
    "calm",
    "Then snap it already. I have seen enough of that ritual."
   ]
  ]
 },
 {
  "id": "C54",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "hissing-wood",
  "lines": [
   [
    "Q",
    "calm",
    "That piece of wood is hissing at us. It really doesn't want to burn."
   ],
   [
    "S",
    "calm",
    "Green or damp wood spends the fire's heat on steam first. It will not catch cleanly until that moisture is gone."
   ],
   [
    "Q",
    "calm",
    "The fire's paying in steam before the wood even agrees to help. No wonder it sounds so sour."
   ]
  ]
 },
 {
  "id": "A49",
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
    "My shoulder has decided it lives here now. It won't go back to being a regular shoulder."
   ],
   [
    "S",
    "calm",
    "A held guard keeps the joint set. After repeated swings, that set remains when the work stops."
   ],
   [
    "Q",
    "calm",
    "I held that guard a long time. Of course it stayed set. I'm not going to argue it back into moving right now."
   ]
  ]
 },
 {
  "id": "A50",
  "context": "after-fight",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "popped-button",
  "lines": [
   [
    "Q",
    "calm",
    "A button just gave up on me. It lasted the whole scramble and then popped like it was bored."
   ],
   [
    "A",
    "calm",
    "A fight ends and you hover over a button. Sloppy dressing, and you want pity for a fastening that failed."
   ],
   [
    "Q",
    "calm",
    "It popped when I moved after the scramble. I'm holding it so I don't lose it, not asking anyone to feel sorry for my shirt."
   ],
   [
    "A",
    "calm",
    "Then pocket it. I will not stand here while you nurse a button."
   ]
  ]
 },
 {
  "id": "A51",
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "leaning-light",
  "lines": [
   [
    "S",
    "calm",
    "That lantern was knocked crooked in the clash. If it keeps slipping, it will not keep lighting the room."
   ],
   [
    "A",
    "calm",
    "Do not hand me a tilted light as if I missed the mess I just made fighting. I am not here to straighten what already fell."
   ],
   [
    "S",
    "calm",
    "The tilt is leftover from the hitting. A light that leans will throw less and less as it slips farther."
   ],
   [
    "A",
    "calm",
    "Then leave it crooked. I will not spend the after of a fight on a lantern."
   ]
  ]
 },
 {
  "id": "A52",
  "context": "after-fight",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "plaster-chips",
  "lines": [
   [
    "Q",
    "calm",
    "Look at my shoulders. The wall left me all these little chips, like it wanted to come with us."
   ],
   [
    "S",
    "calm",
    "A struck wall throws chips onto nearby cloth. What settled on you is plaster from that hit, not a fresh injury."
   ],
   [
    "Q",
    "calm",
    "Good. I'd rather be dusty than cut. The wall just shared what it lost."
   ],
   [
    "S",
    "calm",
    "Cloth holds debris after a nearby strike. Your skin under it was not the surface that broke."
   ]
  ]
 },
 {
  "id": "A53",
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
    "My throat feels scraped raw. I guess I used it harder than I thought."
   ],
   [
    "A",
    "calm",
    "Every scrape needs an audience with you. Now it is your throat, and you want it heard."
   ],
   [
    "Q",
    "calm",
    "I shouted and breathed hard in the clash. The scrape is sitting where that work went. I felt it, and I said so."
   ],
   [
    "A",
    "calm",
    "Then that is enough of it. A raw throat does not entitle you to my attention."
   ]
  ]
 },
 {
  "id": "A54",
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "stuffed-air",
  "lines": [
   [
    "S",
    "calm",
    "The air in here still feels stuffed. Loud work can leave a dull fullness after the noise drops."
   ],
   [
    "A",
    "calm",
    "You turn leftover thick air into something I am meant to sit and study. I lived through the noise. Keep the weather of this room out of my ear."
   ],
   [
    "S",
    "calm",
    "The fullness is pressure still working its way out. It is the clash still sitting in the air, not a sound you failed to notice."
   ],
   [
    "A",
    "calm",
    "The clash is over. I refuse another description of leftover air."
   ]
  ]
 },
 {
  "id": "T46",
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "wet-wipe-cups",
  "lines": [
   [
    "Q",
    "calm",
    "They wiped right through our cups. Now there's a wet streak, and my cup nearly skidded off."
   ],
   [
    "S",
    "calm",
    "We have not finished with those cups. Wiping around them only spreads the wet instead of clearing it."
   ],
   [
    "Q",
    "calm",
    "Yeah, the cloth just pushed the wet into a new place. The cups were still working."
   ],
   [
    "S",
    "calm",
    "In-use cups belong on the table. The wet can wait until they are actually cleared."
   ]
  ]
 },
 {
  "id": "T47",
  "context": "tavern",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "sticky-bench",
  "lines": [
   [
    "Q",
    "calm",
    "Ugh. I sat down on something sticky. The bench had a crumb waiting for me."
   ],
   [
    "A",
    "calm",
    "You sit down and immediately find a way to make a mess of it. A crumb on a bench and you announce it like an injury."
   ],
   [
    "Q",
    "calm",
    "The sticky patch was on the bench before I sat. I landed on a seat that was already messy. Finding it after I sat is just how a marked bench works."
   ],
   [
    "A",
    "calm",
    "Then scrape it off and stop talking. A sticky bench is not a wound."
   ]
  ]
 },
 {
  "id": "T48",
  "context": "tavern",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "ticking-drip",
  "lines": [
   [
    "S",
    "calm",
    "A drip keeps ticking behind this seat. It returns on the same count each time, from the same leak."
   ],
   [
    "A",
    "calm",
    "Count it somewhere else. I did not sit down to hear you mark time for a leak."
   ],
   [
    "S",
    "calm",
    "The interval stays even because the leak does not change its pace. The sound will keep landing just behind us on that count."
   ],
   [
    "A",
    "calm",
    "Enough counting. I already hear the drip."
   ]
  ]
 },
 {
  "id": "T49",
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
    "If I sit here like a statue my shoulders lock up. I'm rolling my wrists so they don't go stiff, that's all."
   ],
   [
    "S",
    "calm",
    "Seated rolling stays on your side of the table. Nothing in that motion reaches the station."
   ],
   [
    "Q",
    "calm",
    "Right. My wrists aren't in charge of anyone's station. I still don't want them locking up while we sit."
   ]
  ]
 },
 {
  "id": "T50",
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
    "Ugh, hiccups. They keep jumping in while we're waiting."
   ],
   [
    "A",
    "calm",
    "Those hitching breaths are just another bid for attention. You would rather hitch than let anyone forget you are here."
   ],
   [
    "Q",
    "calm",
    "A hiccup isn't something I schedule. It caught me in the middle of sitting here. I'm stuck with it the same as you are."
   ],
   [
    "A",
    "calm",
    "Then that hitch is yours. Do not look at me like I owe it patience."
   ]
  ]
 },
 {
  "id": "T51",
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
    "Another scrap just went into the discard beside the station. They are still cutting or cleaning there."
   ],
   [
    "A",
    "calm",
    "You read our wait in scraps now. I never asked to follow along with what they throw away."
   ],
   [
    "S",
    "calm",
    "From this bench, the discard is what still changes. As long as trimmings keep landing there, they have not finished the cutting or cleaning."
   ],
   [
    "A",
    "calm",
    "Then watch their scraps without me. I will stay in this seat until they stop, list or no list."
   ]
  ]
 }
];
const seenKey=id=>"batch9-"+id;
function install(S,R,H,M){
 const seq=S.rpg.s6.sequential;
 function gate(t,s,l){switch(t.gate){
  // These scene observations do not exist; retain the lines without inventing flags.
  case "branch-drip":case "undone-bootlace":case "fire-ring-stone":case "dusk-gnats":case "sleeve-thread":case "hissing-wood":case "popped-button":case "leaning-light":case "plaster-chips":case "stuffed-air":case "wet-wipe-cups":case "sticky-bench":case "ticking-drip":return false;
  default:return true;
 }}
 seq.add(TALKS,seenKey,gate);
 return {gate};
}
if(typeof module!=="undefined"&&module.exports)module.exports={TALKS,seenKey,install};
if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=="undefined"?window:globalThis);
