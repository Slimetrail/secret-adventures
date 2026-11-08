/* Approved sequential batch 10. Same shared registry; no invented scene flags. */
(function(root){"use strict";
const TALKS=[
 {
  "id": "C55",
  "lines": [
   [
    "Q",
    "calm",
    "My fingers still smell like pine. I only brushed a branch, and now I carry the whole tree around on my hands."
   ],
   [
    "S",
    "calm",
    "Resin sticks to skin. Once it clings, the scent stays after the branch is gone."
   ],
   [
    "Q",
    "calm",
    "The branch got to leave. The smell signed a longer lease. Rude of it, honestly."
   ]
  ],
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-C55"
 },
 {
  "id": "C56",
  "lines": [
   [
    "Q",
    "calm",
    "This spot on my wrist will not quit. I'm just scratching so it stops shouting."
   ],
   [
    "A",
    "calm",
    "One itch and you claw at it like the camp should watch. You let a bite take over the sitting."
   ],
   [
    "Q",
    "calm",
    "The itch showed up while I was already sitting. I'm scratching so this one spot doesn't own the rest of the evening."
   ],
   [
    "A",
    "calm",
    "Then suffer it quietly. Your wrist is not a subject I agreed to."
   ]
  ],
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-C56"
 },
 {
  "id": "C57",
  "lines": [
   [
    "S",
    "calm",
    "One log has rolled off the wood stacked for later. A round piece walks when the pile is not chocked."
   ],
   [
    "A",
    "calm",
    "I did not stack that wood. Save the talk about why a round log walks for whoever built the pile."
   ],
   [
    "S",
    "calm",
    "Whoever set it, the pile no longer holds. The next piece can follow the one that already left."
   ],
   [
    "A",
    "calm",
    "Then whoever cares can chock it. I will not restack a heap I never made."
   ]
  ],
  "context": "camp",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unobserved-C57"
 },
 {
  "id": "C58",
  "lines": [
   [
    "S",
    "calm",
    "You flinched from the cup. The glaze is broken along that rim."
   ],
   [
    "Q",
    "calm",
    "It bit me! Since when do cups get opinions about my mouth?"
   ],
   [
    "S",
    "calm",
    "A broken glaze leaves a sharp edge. Your lip meets that edge each time you drink."
   ],
   [
    "Q",
    "calm",
    "No wonder it nips. I only wanted a drink, and the cup decided to argue about it."
   ]
  ],
  "context": "camp",
  "speakers": [
   "S",
   "Q"
  ],
  "gate": "unobserved-C58"
 },
 {
  "id": "C59",
  "lines": [
   [
    "Q",
    "calm",
    "This knot in my pouch lace has locked itself. I'm working it loose, but it will not give."
   ],
   [
    "A",
    "calm",
    "Your own lacing defeated you. You sit there wrestling a knot you tied yourself and expect sympathy."
   ],
   [
    "Q",
    "calm",
    "It tightened while I was sitting here. I'm working it so I can open my own pouch again, not because I forgot how a knot works."
   ],
   [
    "A",
    "calm",
    "Then finish picking at it. I am not sitting through a struggle with string."
   ]
  ],
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-C59"
 },
 {
  "id": "C60",
  "lines": [
   [
    "Q",
    "calm",
    "This stump keeps grabbing my clothes every time I shift. It really does not want to let go."
   ],
   [
    "S",
    "calm",
    "Broken bark catches threads. Weave snags on that rough surface each time you move."
   ],
   [
    "Q",
    "calm",
    "That explains the tugging. I shift, and the bark collects another bit of me."
   ]
  ],
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-C60"
 },
 {
  "id": "A55",
  "lines": [
   [
    "Q",
    "calm",
    "My boot tried to leave without me. The heel's half off, like it got bored mid-scramble."
   ],
   [
    "S",
    "calm",
    "A hard stop drives the foot forward in the boot. The heel loses its seat when the foot shoves like that."
   ],
   [
    "Q",
    "calm",
    "That would do it. The stop shoved me out of my own boot, and I'm sitting here with a heel that didn't stay."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": null
 },
 {
  "id": "A56",
  "lines": [
   [
    "Q",
    "calm",
    "My braid came half undone in that scramble. It started the fight bound and finished looking like it gave up halfway."
   ],
   [
    "A",
    "calm",
    "You cannot keep your own hair together. Fixing it now is just vanity after a fight."
   ],
   [
    "Q",
    "calm",
    "The scramble pulled the tie loose. I'm putting it back so it stays out of my way, not so anyone has to admire it."
   ],
   [
    "A",
    "calm",
    "Then get it bound again. Do not turn loose hair into a spectacle."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-A56"
 },
 {
  "id": "A57",
  "lines": [
   [
    "S",
    "calm",
    "That hanging was knocked in the fight and did not latch. It will keep drifting through the gap while it sits ajar."
   ],
   [
    "A",
    "calm",
    "Do not post me beside a hanging that failed to catch. I fought. I am not the latch it missed."
   ],
   [
    "S",
    "calm",
    "Unlatched, it will not stay still. The hanging will drift until the catch is set."
   ],
   [
    "A",
    "calm",
    "The fight is done. I will not stand watch over a gap that hanging left open."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unobserved-A57"
 },
 {
  "id": "A58",
  "lines": [
   [
    "Q",
    "calm",
    "My knuckle complains every time I make a fist. I only asked it to close, and now it stings."
   ],
   [
    "S",
    "calm",
    "The nick sits where the joint folds. Closing the hand pulls that skin, so the sting is from the surface, not a deeper wound."
   ],
   [
    "Q",
    "calm",
    "Good to know it's just the surface talking. I'll try not to pick a fight with my own fist for a minute."
   ],
   [
    "S",
    "calm",
    "Leave the joint easy until that pull fades. A skin nick stings on the fold and nowhere deeper."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-A58"
 },
 {
  "id": "A59",
  "lines": [
   [
    "Q",
    "calm",
    "My face is still hot. The clash packed all that warmth in my cheeks and forgot to take it back."
   ],
   [
    "A",
    "calm",
    "You look worn out over nothing. Leftover color and you wear it like proof the work was too much for you."
   ],
   [
    "Q",
    "calm",
    "The heat is leftover work still leaving my face. I named the warmth the clash left. I wasn't asking anyone to watch me cool down."
   ],
   [
    "A",
    "calm",
    "Then go quiet about your cheeks. I did not ask how warm you feel."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": null
 },
 {
  "id": "A60",
  "lines": [
   [
    "S",
    "calm",
    "That jug cracked in the clash. A thin line of water is still leaving it, and the crack will keep feeding the puddle."
   ],
   [
    "A",
    "calm",
    "You want me to sit here and watch a jug die. I will not nurse a crack for a pot that already failed."
   ],
   [
    "S",
    "calm",
    "Left alone, it will empty. The hairline keeps releasing that same thin line into the puddle."
   ],
   [
    "A",
    "calm",
    "Save the puddle talk. Your cracked jug is not my work."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unobserved-A60"
 },
 {
  "id": "T52",
  "lines": [
   [
    "Q",
    "calm",
    "Someone left us a napkin. I sat down and inherited their clutter."
   ],
   [
    "S",
    "calm",
    "The last sitters left it. That napkin is not ours."
   ],
   [
    "Q",
    "calm",
    "Well, it found us anyway. Fancy of them to leave a welcome present we never asked for."
   ],
   [
    "S",
    "calm",
    "It is leftover, not a welcome. The last sitters simply failed to take it with them."
   ]
  ],
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-T52"
 },
 {
  "id": "T53",
  "lines": [
   [
    "Q",
    "calm",
    "A splash just caught my sleeve. Someone walked past with a mug and shared a drop I did not want."
   ],
   [
    "A",
    "calm",
    "A drop hits you and you make a fuss as if you were soaked. You wear someone else's drink and then complain about the mark."
   ],
   [
    "Q",
    "calm",
    "The drop came off someone else's mug as they passed. I didn't lean into it. Getting hit by a splash isn't me making a mess of my own sleeve."
   ],
   [
    "A",
    "calm",
    "Wipe your sleeve. I will not sit here and grade a splash."
   ]
  ],
  "context": "tavern",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-T53"
 },
 {
  "id": "T54",
  "lines": [
   [
    "S",
    "calm",
    "That stool nearby keeps scraping. One leg is catching on the floor each time they shift."
   ],
   [
    "A",
    "calm",
    "Do not explain a scrape to me like I hired you to study someone else's stool. Their catching leg is not a problem you need to walk me through."
   ],
   [
    "S",
    "calm",
    "The same leg catches each time they settle. That is why the scrape keeps repeating."
   ],
   [
    "A",
    "calm",
    "Then drop the diagnosis. I will sit through the noise without a map of their chair."
   ]
  ],
  "context": "tavern",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unobserved-T54"
 },
 {
  "id": "T55",
  "lines": [
   [
    "Q",
    "calm",
    "I'm just changing how my knees sit under the table. Gives me something to do while we wait."
   ],
   [
    "S",
    "calm",
    "Changing the angle of your knees will not move their finish. They will stop when the work is ready, not when your legs find a new position."
   ],
   [
    "Q",
    "calm",
    "I wasn't trying to hurry them. I only wanted my knees to have a different job than sitting perfectly still."
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
  "id": "T56",
  "lines": [
   [
    "Q",
    "calm",
    "The dust in here just stole a sneeze from me. I wasn't planning to join the room that loud."
   ],
   [
    "A",
    "calm",
    "A wait starts and your nose has to speak up. You sneeze like the bench should pause for you."
   ],
   [
    "Q",
    "calm",
    "The air in here hit my nose. The sneeze answered that, I didn't stage it for the bench."
   ],
   [
    "A",
    "calm",
    "I will not treat a sneeze like an event. The wait does not stop for your nose."
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
  "id": "T57",
  "lines": [
   [
    "S",
    "calm",
    "They took up another unfinished piece from the pile without turning to us. Another unit of work has started."
   ],
   [
    "A",
    "calm",
    "You treated their next grab like news. You made this table listen to a reach that was not ours."
   ],
   [
    "S",
    "calm",
    "They reached for the next unfinished piece. Until that one is done, they will not turn to this table."
   ],
   [
    "A",
    "calm",
    "Then you have explained the extra sit. I will wait without your version of how long they ignore this table."
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
const seenKey=id=>"batch10-"+id;
function install(S,R,H,M){const seq=S.rpg.s6.sequential;
function gate(t){return !t.gate;} // observation prerequisites are not simulated by this build
seq.add(TALKS,seenKey,gate);return {gate};}
if(typeof module!=="undefined"&&module.exports)module.exports={TALKS,seenKey,install};
if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=="undefined"?window:globalThis);
