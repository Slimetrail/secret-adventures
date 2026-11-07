/* Checked sequential batch 3; register only, sharing the earlier lifecycle slots. */
(function(root){"use strict";
const TALKS=[
 {
  "id": "C13",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "stiffness",
  "lines": [
   [
    "Q",
    "calm",
    "Ow. My legs have forgotten how to be legs. They just sat here and turned into boards."
   ],
   [
    "S",
    "calm",
    "Unused muscles tighten. You have been still long enough for that to happen."
   ],
   [
    "Q",
    "calm",
    "So the sitting did this. That's rude of sitting. I liked it until now."
   ]
  ]
 },
 {
  "id": "C14",
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
    "There's a lump under this bedroll. Or a rock. Or my own elbow. I keep losing track."
   ],
   [
    "A",
    "calm",
    "Stop writhing. You make more noise settling than most people make walking."
   ],
   [
    "Q",
    "calm",
    "I'm trying to sleep, not put on a show. The ground won't stay still under me."
   ],
   [
    "A",
    "calm",
    "The ground is still. You are the problem. Lie down and stay there."
   ]
  ]
 },
 {
  "id": "C15",
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
    "The straps should stay fastened. Loose kit will scatter before we need it."
   ],
   [
    "A",
    "calm",
    "I know how a strap works. Spare me the lecture on tying things down."
   ],
   [
    "S",
    "calm",
    "The flasks are already tipping. That is what loose straps do."
   ],
   [
    "A",
    "calm",
    "Then I'll shove them back. Stop narrating every tilt."
   ]
  ]
 },
 {
  "id": "C16",
  "context": "camp",
  "speakers": [
   "S",
   "Q"
  ],
  "gate": "morning",
  "lines": [
   [
    "S",
    "calm",
    "The light is up. Sitting longer will not restore more rest."
   ],
   [
    "Q",
    "calm",
    "It might. My head is still in the bedroll. My feet just haven't caught up."
   ],
   [
    "S",
    "calm",
    "The night has already done what rest can do. Being awake now is the useful part."
   ],
   [
    "Q",
    "calm",
    "Useful. Cold. Mean. I'm awake. I'm just not grateful about it yet."
   ]
  ]
 },
 {
  "id": "C17",
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "rations",
  "lines": [
   [
    "Q",
    "calm",
    "Here. Dry rations. Not fancy, but they're yours if you want them."
   ],
   [
    "A",
    "calm",
    "A kindness. As if handing me dry food makes you useful."
   ],
   [
    "Q",
    "calm",
    "I offered you food. You don't get to turn that into proof I'm useless."
   ],
   [
    "A",
    "calm",
    "Then keep the leftover charity. I eat because I have to, not because you thought of it."
   ]
  ]
 },
 {
  "id": "C18",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "weather",
  "lines": [
   [
    "Q",
    "calm",
    "That wind keeps finding the back of my neck. It's very committed."
   ],
   [
    "S",
    "calm",
    "It will keep the fire uneasy and the stop colder than it was at dusk."
   ],
   [
    "Q",
    "calm",
    "Colder than dusk. I was hoping you were going to say it was just being dramatic."
   ]
  ]
 },
 {
  "id": "A13",
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
    "Look at that. Even my hands came out of it wearing the floor."
   ],
   [
    "S",
    "calm",
    "The grit will stay in the creases if you leave it. Wipe it before you put anything away."
   ],
   [
    "Q",
    "calm",
    "Before I put anything away. So it isn't just ugly. It's going to stick."
   ]
  ]
 },
 {
  "id": "A14",
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
    "You kept your footing when it shoved back. That was solid."
   ],
   [
    "A",
    "calm",
    "Save the praise. You notice the pretty parts and miss the rest."
   ],
   [
    "Q",
    "calm",
    "I noticed what you did. That doesn't make me blind."
   ],
   [
    "A",
    "calm",
    "Then notice less. I didn't do it so you could clap."
   ]
  ]
 },
 {
  "id": "A15",
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
    "We had to give a step of ground. The press required it."
   ],
   [
    "A",
    "calm",
    "I hate that step. We should not have had to move back at all."
   ],
   [
    "S",
    "calm",
    "A step back kept us from being overrun. The alternative was worse footing."
   ],
   [
    "A",
    "calm",
    "Then we paid for footing with ground. That trade still sits wrong."
   ]
  ]
 },
 {
  "id": "A16",
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
    "Of course it fell then. Right in the middle of everything. Very helpful of it."
   ],
   [
    "S",
    "calm",
    "It should not stay on the ground. We will need it, and leaving it wastes the stop."
   ],
   [
    "Q",
    "calm",
    "If I leave it there to sulk, we lose it when we need it. That's worse than looking clumsy."
   ],
   [
    "S",
    "calm",
    "Pick it up now. The floor is not a safe place to keep it."
   ]
  ]
 },
 {
  "id": "A17",
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
    "I'm sitting. Right here. The floor is close enough."
   ],
   [
    "A",
    "calm",
    "Already dropping. You didn't even last long enough to stay on your feet."
   ],
   [
    "Q",
    "calm",
    "The fight is over. Sitting isn't the same as falling apart."
   ],
   [
    "A",
    "calm",
    "It's close enough. Get up before you make a habit of it."
   ]
  ]
 },
 {
  "id": "A18",
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
    "There is a nick in the edge. It will still serve."
   ],
   [
    "A",
    "calm",
    "Then stop hovering over it. I don't need a report on every scratch."
   ],
   [
    "S",
    "calm",
    "A nick that is ignored gets worse. That is why I said it."
   ],
   [
    "A",
    "calm",
    "I heard you. It still works. Leave it."
   ]
  ]
 },
 {
  "id": "T10",
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "indoor-warmth",
  "lines": [
   [
    "Q",
    "calm",
    "Oh. The air in here actually likes people. My hands just noticed."
   ],
   [
    "S",
    "calm",
    "The indoor heat is returning feeling to them. That is the room working as shelter."
   ],
   [
    "Q",
    "calm",
    "Returning feeling. I'd started to think they'd given up on warmth altogether."
   ],
   [
    "S",
    "calm",
    "They were cold because we were outside. The warmth is doing what it should."
   ]
  ]
 },
 {
  "id": "T11",
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
    "Hi—sorry, not to you. I was waving at the room. It waved first, I think."
   ],
   [
    "A",
    "calm",
    "Smile at strangers and see what that buys you. An empty head makes an easy mark."
   ],
   [
    "Q",
    "calm",
    "I'm not empty-headed because I waved. I can be friendly without trusting a stranger."
   ],
   [
    "A",
    "calm",
    "Then keep your hands down. Your friendliness looks like an invitation."
   ]
  ]
 },
 {
  "id": "T12",
  "context": "tavern",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "restock",
  "lines": [
   [
    "S",
    "calm",
    "Our stores are running down. This is a place that can replace them."
   ],
   [
    "A",
    "calm",
    "So now I have to stand here while you shop. Keep the errand to yourself."
   ],
   [
    "S",
    "calm",
    "Waiting until later leaves us short. That is the cost of skipping it."
   ],
   [
    "A",
    "calm",
    "Then do the buying. Spare me the inventory."
   ]
  ]
 },
 {
  "id": "T13",
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
    "I'm sorting the table grain into tiny roads. It gives my hands something that isn't waiting."
   ],
   [
    "S",
    "calm",
    "The craft follows its own steps. Your roads have no effect on when those steps end."
   ],
   [
    "Q",
    "calm",
    "I know it doesn't hurry anything. The roads aren't for that. They're just so I have somewhere to look."
   ]
  ]
 },
 {
  "id": "T14",
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
    "That has to be almost done. It can't have much left."
   ],
   [
    "A",
    "calm",
    "You have never been right about how long anything takes. Calling it done doesn't make it so."
   ],
   [
    "Q",
    "calm",
    "I didn't say it was done. I said it looked close. I can judge that without being clueless."
   ],
   [
    "A",
    "calm",
    "It looks the same as it did when you sat down. Keep your guesses to yourself."
   ]
  ]
 },
 {
  "id": "T15",
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
    "The sound has not stopped. The work has not reached a stopping point."
   ],
   [
    "A",
    "calm",
    "I can hear the racket. I don't need you to announce that it is still punishing us."
   ],
   [
    "S",
    "calm",
    "Announcing it is not the point. A change in the sound is how you know it has finished."
   ],
   [
    "A",
    "calm",
    "Then sit there and listen for it. I don't need a signal every time the pitch shifts."
   ]
  ]
 }
];
const seenKey=id=>"batch3-"+id;
function install(S,R,H,M){
 const seq=S.rpg.s6.sequential;
 function gate(t,s,l){switch(t.gate){
  case "rations":return l.party.some(c=>(c.bag||[]).includes("ration"));
  // No existing sitting-stiffness, camp morning, weather, or indoor warmth
  // observation exists. Darkness, tent wear, music and invented flags are not substitutes.
  case "stiffness":case "morning":case "weather":case "indoor-warmth":return false;
  case "restock":{
   const p=S.state&&S.state(),i=p&&M?M.taverns.findIndex(c=>c[0]===p.x&&c[1]===p.y):-1;
   if(i<0||!S.rpg.s5||!S.rpg.s5.shopCounts)return false;
   // Same per-tavern remaining consumable/ingredient stock used by the shop.
   // shopCounts initializes its existing base counts; no gold/payment requirement.
   const q=S.rpg.s5.shopCounts(i);
   return Object.keys(q).some(id=>R.ITEMS[id]&&q[id]>0);
  }
  default:return true;
 }}
 seq.add(TALKS,seenKey,gate);
 return {gate};
}
if(typeof module!=="undefined"&&module.exports)module.exports={TALKS,seenKey,install};
if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=="undefined"?window:globalThis);
