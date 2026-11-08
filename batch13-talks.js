/* Approved sequential batch 13. Same shared registry; no invented scene flags. */
(function(root){"use strict";
const TALKS=[
 {
  "id": "C73",
  "lines": [
   [
    "Q",
    "calm",
    "My fingers kept the kitchen after the knife went down. The onion stayed visiting, and it has not said goodbye."
   ],
   [
    "S",
    "calm",
    "Crushed onion and herb leave oils in the skin. Those juices stay after the knife is set down, so the scent outlasts the work."
   ],
   [
    "Q",
    "calm",
    "I get to host the kitchen a while longer. The smell has settled in, and it is not in any hurry to leave."
   ]
  ],
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-C73"
 },
 {
  "id": "C74",
  "lines": [
   [
    "Q",
    "calm",
    "The brush reached out as I passed. A thorn left a thin line on my arm, and I am checking the scratch."
   ],
   [
    "A",
    "calm",
    "Even a walk through camp leaves you with a scratch to inspect. You linger over a thorn line as if the camp should pause with you."
   ],
   [
    "Q",
    "calm",
    "The thorn caught my arm when I passed the brush. A scratch that is already there gets a look; I did not go hunting for one."
   ],
   [
    "A",
    "calm",
    "Put your eyes back on the camp. Keep the thorn line to yourself."
   ]
  ],
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-C74"
 },
 {
  "id": "C75",
  "lines": [
   [
    "S",
    "calm",
    "That cloak draped to air has slipped off its peg onto the dirt. Cloth hung that way slides once the hold no longer catches it."
   ],
   [
    "A",
    "calm",
    "You turned a slipped cloak into an errand for me. I will not hoist that airing-cloth off the dirt."
   ],
   [
    "S",
    "calm",
    "The drape has left the peg. Cloth left to air stays on the dirt until it is returned to the branch."
   ],
   [
    "A",
    "calm",
    "You already said where it slid. The return is not coming from me."
   ]
  ],
  "context": "camp",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unobserved-C75"
 },
 {
  "id": "C76",
  "lines": [
   [
    "S",
    "calm",
    "Steam from the pot has fogged the air between us. When the lid lifts, escaping vapor hangs in a cloud."
   ],
   [
    "Q",
    "calm",
    "The pot invented weather just for two! A private fog, and the sky never signed off on it."
   ],
   [
    "S",
    "calm",
    "Escaping steam meets cooler air and hangs low before it thins. The cloud stays close until it cools enough to thin."
   ],
   [
    "Q",
    "calm",
    "It wanted to linger in our faces first. The thinning comes later, after it has hung around a bit."
   ]
  ],
  "context": "camp",
  "speakers": [
   "S",
   "Q"
  ],
  "gate": "unobserved-C76"
 },
 {
  "id": "C77",
  "lines": [
   [
    "Q",
    "calm",
    "This pouch will not keep its own secret. The toggle walked out of its loop, and I am reseating the flap."
   ],
   [
    "A",
    "calm",
    "Your pouch hangs open while you work the toggle back into place. You handle a slipped flap as if it were precious."
   ],
   [
    "Q",
    "calm",
    "A slipped toggle leaves the flap hanging. I am putting it back in the loop, and that is all this is."
   ],
   [
    "A",
    "calm",
    "Shut the flap and be done. A toggle does not deserve this much of my evening."
   ]
  ],
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-C77"
 },
 {
  "id": "C78",
  "lines": [
   [
    "Q",
    "calm",
    "This seat keeps changing the deal. I settle in, and the ground walks me forward another little scoot."
   ],
   [
    "S",
    "calm",
    "Weight on a slight slope finds the lower side. Each settle moves the sit a little farther downhill."
   ],
   [
    "Q",
    "calm",
    "The hill and I are in a slow argument I keep losing. I settle, and it takes another sliver of ground."
   ]
  ],
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-C78"
 },
 {
  "id": "A73",
  "lines": [
   [
    "Q",
    "calm",
    "My eyes decided the room was too dry to look at. They started leaking once the hitting stopped, and nobody told them a sad story."
   ],
   [
    "S",
    "calm",
    "Dust and dry effort leave the eyes washing themselves after hard work. The watering comes from the room and the clash, not from grief."
   ],
   [
    "Q",
    "calm",
    "The room is still wringing them out. They keep objecting to the air."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-A73"
 },
 {
  "id": "A74",
  "lines": [
   [
    "Q",
    "calm",
    "This strap-end has not learned the hitting stopped. The buckle tongue keeps slapping my wrist whenever I move."
   ],
   [
    "A",
    "calm",
    "A slap of leather and you make it the room's concern. You treat a buckle tongue like it wounded you."
   ],
   [
    "Q",
    "calm",
    "The tongue came free during the scramble and still moves when I do. That slap is leftover leather, not theater."
   ],
   [
    "A",
    "calm",
    "Catch the tongue and keep it. I have heard enough about that buckle."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-A74"
 },
 {
  "id": "A75",
  "lines": [
   [
    "S",
    "calm",
    "Tin cups and plates from that knocked shelf are still scattered on the floor. Thrown tableware does not gather itself."
   ],
   [
    "A",
    "calm",
    "You expect me to stoop for every cup that hit the floor. Those plates stay where they fell."
   ],
   [
    "S",
    "calm",
    "The cups stay where they landed. Scattered tinware will not walk back onto the shelf."
   ],
   [
    "A",
    "calm",
    "I heard they will not walk. That still does not put them in my hands."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unobserved-A75"
 },
 {
  "id": "A76",
  "lines": [
   [
    "Q",
    "calm",
    "The floor booked a seat between my teeth. I am working the grit loose with my tongue."
   ],
   [
    "S",
    "calm",
    "Open-mouthed effort lets dust settle between the teeth. What is packed there is grit from the room, not a chip from a tooth."
   ],
   [
    "Q",
    "calm",
    "Good. I would rather lend the floor a little space than find a piece of tooth on holiday."
   ],
   [
    "S",
    "calm",
    "Dust finds any gap left open through the work. The packed bit belongs to the room."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-A76"
 },
 {
  "id": "A77",
  "lines": [
   [
    "Q",
    "calm",
    "This fingernail kept a thin line from the scramble. There is dirt under it, and I am scraping it out."
   ],
   [
    "A",
    "calm",
    "You scrape at a packed nail as though nothing else in the room mattered. That line gets more of your attention than it earned."
   ],
   [
    "Q",
    "calm",
    "The scramble packed that dirt under the nail. A trapped line is the room left behind, and I am getting it out."
   ],
   [
    "A",
    "calm",
    "You named the scramble. I am done with that nail."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-A77"
 },
 {
  "id": "A78",
  "lines": [
   [
    "S",
    "calm",
    "That metal bowl is still humming from a blow. Struck metal keeps a note until the vibration dies."
   ],
   [
    "A",
    "calm",
    "You heard a leftover hum and looked at me to kill the note. The ringing dies when it dies."
   ],
   [
    "S",
    "calm",
    "The bowl will keep ticking while that tremor remains. The tone fades only after the metal goes still."
   ],
   [
    "A",
    "calm",
    "Struck metal keeps its own note. I owe that bowl no hush."
   ]
  ],
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unobserved-A78"
 },
 {
  "id": "T70",
  "lines": [
   [
    "Q",
    "calm",
    "I keep almost catching the talk at the next table, and then it slips. The conversation will not stay with me."
   ],
   [
    "S",
    "calm",
    "Overlapping talk from another table reaches us in pieces. Words heard at an angle will not hold together."
   ],
   [
    "Q",
    "calm",
    "That explains the disappearing sentences. I get the edges, and the middle walks off before I can keep it."
   ],
   [
    "S",
    "calm",
    "Scraps arrive out of order. Caught sideways, the words fail to stay in sequence."
   ]
  ],
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unobserved-T70"
 },
 {
  "id": "T71",
  "lines": [
   [
    "Q",
    "calm",
    "The table reached for my sleeve. A rough edge caught a thread, and I am freeing it."
   ],
   [
    "A",
    "calm",
    "Park a sleeve on the wood and you snag the furniture. Minding one caught thread is a waste of care."
   ],
   [
    "Q",
    "calm",
    "A splinter in the tabletop took the thread. The table started that catch, and I am easing the thread free."
   ],
   [
    "A",
    "calm",
    "Blame the splinter all you want. I do not need the history of one thread."
   ]
  ],
  "context": "tavern",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "unobserved-T71"
 },
 {
  "id": "T72",
  "lines": [
   [
    "S",
    "calm",
    "That mug on the nearby shelf has not stopped rocking after the bump. A vessel set too near the edge will walk with each leftover wobble."
   ],
   [
    "A",
    "calm",
    "A little rock after a bump, and you want the mug held. Go watch it walk."
   ],
   [
    "S",
    "calm",
    "Each leftover wobble moves it closer to the drop. Set that close to the edge, and the walk continues until something stops it."
   ],
   [
    "A",
    "calm",
    "The bump already sent it walking. I am leaving that wobble on the ledge."
   ]
  ],
  "context": "tavern",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unobserved-T72"
 },
 {
  "id": "T73",
  "lines": [
   [
    "Q",
    "calm",
    "I gave my eyes a small job in this untouched cup. The last bubbles are still settling, and I am watching them finish."
   ],
   [
    "S",
    "calm",
    "The bubbles in that cup go still whether anyone watches. Looking at them does not hurry the finish, and what they are finishing stays where they stand."
   ],
   [
    "Q",
    "calm",
    "The bubbles were only borrowing my eyes. Going still is their business, and the finish is still over there."
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
  "id": "T74",
  "lines": [
   [
    "Q",
    "calm",
    "My neck stayed pointed too long. There is a crick in it now from looking the same way through the wait."
   ],
   [
    "A",
    "calm",
    "A stiff neck from sitting here, and you offer it like a complaint. That crick is theater."
   ],
   [
    "Q",
    "calm",
    "Holding my head in one direction through the sit put the crick there. The stiffness came from the long look itself."
   ],
   [
    "A",
    "calm",
    "Turn your head or leave it. A crick from looking too long is not a tale I need."
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
  "id": "T75",
  "lines": [
   [
    "S",
    "calm",
    "They paused to speak with someone else at the station and did not glance this way. Speech like that keeps them occupied there, rather than sending anything over here."
   ],
   [
    "A",
    "calm",
    "A side talk at the station is their business, not a hold placed on this bench. I am not waiting out other people's conversations."
   ],
   [
    "S",
    "calm",
    "Speech aimed at someone else still keeps them at the station. This table has not been turned to."
   ],
   [
    "A",
    "calm",
    "They turned to someone else. Stretching this sit around their chat is more wait than I am giving."
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
const seenKey=id=>"batch13-"+id;
function install(S,R,H,M){const seq=S.rpg.s6.sequential;
function gate(t){return !t.gate;} // observation prerequisites are not simulated by this build
seq.add(TALKS,seenKey,gate);return {gate};}
if(typeof module!=="undefined"&&module.exports)module.exports={TALKS,seenKey,install};
if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=="undefined"?window:globalThis);
