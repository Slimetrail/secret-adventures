/* Approved sequential batch 11. Same shared registry; no invented scene flags. */
(function(root){"use strict";
const TALKS=[
 {
  "id": "C61",
  "lines": [
   [
    "Q",
    "calm",
    "The fire just chased me down. One shift of wind, and now I've got a face full of smoke."
   ],
   [
    "S",
    "calm",
    "A turned draft pulls the column sideways. A low sit sits in the path the smoke takes once the air changes."
   ],
   [
    "Q",
    "calm",
    "The draft found me after I was already settled. My eyes get the whole column now, and I can still taste it."
   ]
  ],
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-C61"
 },
 {
  "id": "C62",
  "lines": [
   [
    "Q",
    "calm",
    "This cake of mud thinks it lives on my boot now. I'm knocking the flakes off before they travel everywhere."
   ],
   [
    "A",
    "calm",
    "Dried mud on a boot and you turn the scraping into a ceremony. Grooming dirt mid-sit is a fuss I have no patience for."
   ],
   [
    "Q",
    "calm",
    "A ceremony would have more steps. The dried mud caked on, and it's coming off."
   ],
   [
    "A",
    "calm",
    "Knock the cake off the boot. I wanted the scraping finished, not a comparison to a ceremony."
   ]
  ],
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-C62"
 },
 {
  "id": "C63",
  "lines": [
   [
    "S",
    "calm",
    "Dew has beaded on the metal left out overnight. Cool iron gathers that film, and the moisture will sit against the surface if it is ignored."
   ],
   [
    "A",
    "calm",
    "Wet steel, and suddenly I am the one who should have wiped it. I was not the one who left that metal in the night air."
   ],
   [
    "S",
    "calm",
    "The beads remain whether or not you left the metal out. A film like that can pit iron if it stays on the surface."
   ],
   [
    "A",
    "calm",
    "Hand the cloth to the person who set the metal down. I am not on rag duty for leftover kit."
   ]
  ],
  "context": "camp",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unobserved-C63"
 },
 {
  "id": "C64",
  "lines": [
   [
    "S",
    "calm",
    "That cloth you hung to dry has drifted too close. The edge is starting to scorch."
   ],
   [
    "Q",
    "calm",
    "My laundry tried to join the fire! I asked it to dry, not to throw itself at the flames."
   ],
   [
    "S",
    "calm",
    "Cloth hung in rising heat creeps inward as it dries and lightens. The line slacks toward the fire once the weight leaves it."
   ],
   [
    "Q",
    "calm",
    "I hung it to get the damp out. It treated the heat like a suggestion to creep closer."
   ]
  ],
  "context": "camp",
  "speakers": [
   "S",
   "Q"
  ],
  "gate": "unobserved-C64"
 },
 {
  "id": "C65",
  "lines": [
   [
    "Q",
    "calm",
    "This clasp will not stay shut. I keep reseating it, and it walks itself open again."
   ],
   [
    "A",
    "calm",
    "A wrap that will not stay closed and you sit there tending the pin. That is vanity dressed up as care."
   ],
   [
    "Q",
    "calm",
    "The wrap pulls and the pin slips its seat. I'm closing it again so the wrap does its job, not because I care how the clasp looks."
   ],
   [
    "A",
    "calm",
    "Get the pin seated and leave it. I have no time left this evening for a clasp."
   ]
  ],
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-C65"
 },
 {
  "id": "C66",
  "lines": [
   [
    "Q",
    "calm",
    "My seat keeps answering back. I shift my weight, and one end tips like it has somewhere else to be."
   ],
   [
    "S",
    "calm",
    "One end has no bite on the ground. Shifting weight pries that end up, and the other end dips."
   ],
   [
    "Q",
    "calm",
    "That unsettled end and I are having a disagreement. I move, it lifts, and I get the whole argument again."
   ]
  ],
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-C66"
 },
 {
  "id": "A61",
  "lines": [
   [
    "Q",
    "calm",
    "My jaw is still clenched from the fight. Everything else sat down, and this hinge never got the message."
   ],
   [
    "S",
    "calm",
    "A held clench keeps the muscles shortened. The joint stays set after the hitting ends, until that brace lets go."
   ],
   [
    "Q",
    "calm",
    "The brace is still on duty, then. I'm working the hinge, and it still feels like it is waiting for another blow."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-A61"
 },
 {
  "id": "A62",
  "lines": [
   [
    "Q",
    "calm",
    "My belt climbed during the scramble. I'm straightening it before it cuts any higher."
   ],
   [
    "A",
    "calm",
    "You finished a fight and immediately started arranging a belt. As if the last work that mattered was how neat the strap looks."
   ],
   [
    "Q",
    "calm",
    "The scramble rode the belt higher as I stayed upright. I'm sliding it down so it stops cutting in."
   ],
   [
    "A",
    "calm",
    "Set the buckle. Neatening a belt now will not impress me."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-A62"
 },
 {
  "id": "A63",
  "lines": [
   [
    "S",
    "calm",
    "Dirt is heaped where feet scuffed during the clash. Dragging steps shove grit into a ridge that was flat before."
   ],
   [
    "A",
    "calm",
    "You pointed at a ridge of dirt and made it my next job. I am not taking a rake to grit the scramble piled."
   ],
   [
    "S",
    "calm",
    "The heap is still there. What the scramble piled will stay in that line until something flattens it."
   ],
   [
    "A",
    "calm",
    "Leave the grit where the feet put it. I am not flattening dirt after a fight."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unobserved-A63"
 },
 {
  "id": "A64",
  "lines": [
   [
    "Q",
    "calm",
    "My forearm found the wall the hard way. It is one long sting where I grazed the stone."
   ],
   [
    "S",
    "calm",
    "A long graze pulls when the arm bends. The hurt lives in that scraped strip of skin, not in anything opened underneath."
   ],
   [
    "Q",
    "calm",
    "I collected a sting I never meant to keep. I'll give this arm a quieter job than reaching for a while."
   ],
   [
    "S",
    "calm",
    "Each bend will ask that strip again. The protest stays in the scraped skin."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-A64"
 },
 {
  "id": "A65",
  "lines": [
   [
    "Q",
    "calm",
    "My ankle took a wrong turn in the scramble. I'm turning it back through the path it missed."
   ],
   [
    "A",
    "calm",
    "You walked away from the fight on that ankle. Now you keep rolling it like I should supervise the turn."
   ],
   [
    "Q",
    "calm",
    "The scramble pulled it off its path. I'm checking that the joint still follows when I ask it to turn."
   ],
   [
    "A",
    "calm",
    "Stop rotating it for my benefit. I did not stay through a fight to be shown a twist."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-A65"
 },
 {
  "id": "A66",
  "lines": [
   [
    "S",
    "calm",
    "A slat was knocked during the fight and left a seam. A thin stripe of light is still using that gap."
   ],
   [
    "A",
    "calm",
    "You want that stripe gone, take it up with the slat. I am not climbing over there to press a board back into its seat."
   ],
   [
    "S",
    "calm",
    "Until the slat sits again, air and light will keep using that seam. The gap does not close on its own."
   ],
   [
    "A",
    "calm",
    "Leave the seam. I finished fighting. Plugging that stripe is not a chore I am taking up."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unobserved-A66"
 },
 {
  "id": "T58",
  "lines": [
   [
    "Q",
    "calm",
    "This bench just pinched me. Something in the board caught the back of my leg and will not let go."
   ],
   [
    "S",
    "calm",
    "The board has raised a sliver. Sitting still holds that catch against the same place."
   ],
   [
    "Q",
    "calm",
    "I only meant to sit. Now a raised bit of bench has claimed a piece of my stocking."
   ],
   [
    "S",
    "calm",
    "Lifted grain snags and stays. As long as you hold that seat, the catch remains on that same spot."
   ]
  ],
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-T58"
 },
 {
  "id": "T59",
  "lines": [
   [
    "Q",
    "calm",
    "My own cup shed on me. I only lifted it, and a few drops caught my hand."
   ],
   [
    "A",
    "calm",
    "You lifted your own cup and painted your hand with it. Now you want sympathy for a few drops you spilled."
   ],
   [
    "Q",
    "calm",
    "The rim shed when the cup left the table. A few drops escaped the lift. That is not me pouring a mess on purpose."
   ],
   [
    "A",
    "calm",
    "Wipe your hand. Those drops you spilled are not a loss I mean to share."
   ]
  ],
  "context": "tavern",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-T59"
 },
 {
  "id": "T60",
  "lines": [
   [
    "S",
    "calm",
    "The floorboard under this bench creaks each time someone shifts. The plank has lifted, and the same loose board answers whenever weight moves over it."
   ],
   [
    "A",
    "calm",
    "A creak is not a duty. Every shift that plank makes is not a summons I have to answer."
   ],
   [
    "S",
    "calm",
    "The same plank will complain at the next shift. A lifted board repeats that sound as long as it stays loose."
   ],
   [
    "A",
    "calm",
    "Keep the complaint with the plank. I did not agree to quiet this floor."
   ]
  ],
  "context": "tavern",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unobserved-T60"
 },
 {
  "id": "T61",
  "lines": [
   [
    "Q",
    "calm",
    "This bit of cord keeps going around my finger. I stayed in the seat. The cord is doing the traveling for me."
   ],
   [
    "S",
    "calm",
    "The circling stays in your fingers. The finish of the work stays at the station."
   ],
   [
    "Q",
    "calm",
    "The finish can stay where it is. I'm not sending a bit of cord over there to argue with it."
   ]
  ],
  "context": "craft-wait",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": null
 },
 {
  "id": "T62",
  "lines": [
   [
    "Q",
    "calm",
    "I almost let a yawn out. Sitting still this long watered my eyes before I could hide it."
   ],
   [
    "A",
    "calm",
    "You tried to hide a yawn and only halfway managed it. The long sit leaked out through your eyes anyway."
   ],
   [
    "Q",
    "calm",
    "The yawn came up from the long sit. I tried to swallow it. My eyes watered anyway, and that was not me sending a request across the table."
   ],
   [
    "A",
    "calm",
    "Swallow the next yawn whole. Do not bring the leftover water to this table."
   ]
  ],
  "context": "craft-wait",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": null
 },
 {
  "id": "T63",
  "lines": [
   [
    "S",
    "calm",
    "They fetched another tool and never looked over. They are still preparing or continuing the work, not handing it over."
   ],
   [
    "A",
    "calm",
    "Their hands found another tool, and you delivered a verdict that this table is still not next."
   ],
   [
    "S",
    "calm",
    "A new tool taken up means they remain in prep or continuation. Nothing has been handed to this table."
   ],
   [
    "A",
    "calm",
    "A swapped tool does not get to tell this table it has been passed over. That swap is not their answer to this bench."
   ]
  ],
  "context": "craft-wait",
  "speakers": [
   "S",
   "A"
  ],
  "gate": null
 }
];
const seenKey=id=>"batch11-"+id;
function install(S,R,H,M){const seq=S.rpg.s6.sequential;
function gate(t){return !t.gate;} // observation prerequisites are not simulated by this build
seq.add(TALKS,seenKey,gate);return {gate};}
if(typeof module!=="undefined"&&module.exports)module.exports={TALKS,seenKey,install};
if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=="undefined"?window:globalThis);
