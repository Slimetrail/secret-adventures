/* Checked sequential batch 8; register only, sharing the earlier lifecycle slots. */
(function(root){"use strict";
const TALKS=[
 {
  "id": "C43",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "bedroll-downhill",
  "lines": [
   [
    "Q",
    "calm",
    "I went to sleep up there and woke down here. My bedroll took a little trip without me."
   ],
   [
    "S",
    "calm",
    "Ground that is not level lets a roll creep. Loose dirt under bedding will let it wander."
   ],
   [
    "Q",
    "calm",
    "I laid it on a slope and expected it to stay put. That was me asking the ground to be flatter than it is."
   ]
  ]
 },
 {
  "id": "C44",
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "finger-splinter",
  "lines": [
   [
    "Q",
    "calm",
    "There's a sliver in my finger from the firewood. Tiny, but it found a way in."
   ],
   [
    "A",
    "calm",
    "You make a production of a speck of wood. Weak hands can't even hold kindling without crying over it."
   ],
   [
    "Q",
    "calm",
    "A sliver went in while I was moving wood. Working it loose is ordinary care for a finger, not me collapsing over kindling."
   ],
   [
    "A",
    "calm",
    "Then dig it out quietly. I am not watching you suffer a sliver."
   ]
  ]
 },
 {
  "id": "C45",
  "context": "camp",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "unwashed-pot",
  "lines": [
   [
    "S",
    "calm",
    "The cook pot was left unwashed. Food left in it will sour and draw pests."
   ],
   [
    "A",
    "calm",
    "Do not put me on pot duty. An unwashed pot is not my assignment."
   ],
   [
    "S",
    "calm",
    "Assignment is beside the cost. Leavings left in the pot will turn before morning."
   ],
   [
    "A",
    "calm",
    "Then scrape it yourself. I will not be conscripted over scraps."
   ]
  ]
 },
 {
  "id": "C46",
  "context": "camp",
  "speakers": [
   "S",
   "Q"
  ],
  "gate": "sleeve-burr",
  "lines": [
   [
    "S",
    "calm",
    "A burr is caught on your sleeve. Dry seed heads cling to cloth like that."
   ],
   [
    "Q",
    "calm",
    "Oh, I'm collecting them now? Come off, you little hitchhiker."
   ],
   [
    "S",
    "calm",
    "Picking it now keeps it from working deeper into the cloth."
   ],
   [
    "Q",
    "calm",
    "If I leave it, it just crawls farther in. I'd rather catch it now than dig for it later."
   ]
  ]
 },
 {
  "id": "C47",
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "sliding-strap",
  "lines": [
   [
    "Q",
    "calm",
    "This strap will not stay on my shoulder. Every time I stand it shrugs itself off."
   ],
   [
    "A",
    "calm",
    "That pack keeps sliding off you. Sense would have pinned the strap by now."
   ],
   [
    "Q",
    "calm",
    "Camp movement knocks the strap loose. I put it back each time. A wandering strap is a strap problem, and I am still the one wearing this pack."
   ],
   [
    "A",
    "calm",
    "Then hold it there. A sliding strap is not a tragedy I care to see."
   ]
  ]
 },
 {
  "id": "C48",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "cup-ash",
  "lines": [
   [
    "Q",
    "calm",
    "There's a speck swimming in my cup. I only just poured this."
   ],
   [
    "S",
    "calm",
    "An open cup near the fire will take ash. Grit from the wood can settle in standing water."
   ],
   [
    "Q",
    "calm",
    "An open cup by the fire is basically inviting ash to swim. I hear that. I'm still looking at the speck."
   ]
  ]
 },
 {
  "id": "A43",
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
    "My palms feel cooked. Like the grip branded itself on and then waited to tell me."
   ],
   [
    "S",
    "calm",
    "A tight hold hides the sting while you are still clenched. Once the hands empty, the skin notices what the haft did."
   ],
   [
    "Q",
    "calm",
    "The grip hid it while I was holding on. Now that my hands are empty, they finally complain. I'm leaving them as they are."
   ]
  ]
 },
 {
  "id": "A44",
  "context": "after-fight",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "eye-grit",
  "lines": [
   [
    "Q",
    "calm",
    "There's a bit of grit in my eye. It picked a rude time to visit."
   ],
   [
    "A",
    "calm",
    "One grain in your eye and you act as if the whole room went dark."
   ],
   [
    "Q",
    "calm",
    "There's grit in my eye and I'm blinking it out. I can still see. A speck is not me going dark."
   ],
   [
    "A",
    "calm",
    "Then clear it without the performance."
   ]
  ]
 },
 {
  "id": "A45",
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "floor-haft",
  "lines": [
   [
    "S",
    "calm",
    "That haft is still on the floor. A later step will catch it."
   ],
   [
    "A",
    "calm",
    "Stop treating me like I will walk onto a blade. I know where my feet go."
   ],
   [
    "S",
    "calm",
    "Until someone lifts it, the path underfoot still has that fallen haft waiting."
   ],
   [
    "A",
    "calm",
    "Then move it if it bothers you. I am not standing still for a safety talk."
   ]
  ]
 },
 {
  "id": "A46",
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
    "I'm still soaked and the room isn't even warm. My skin didn't get the message that we stopped."
   ],
   [
    "S",
    "calm",
    "The body stays hot after sudden effort. Sweat keeps coming until that heat has somewhere to go."
   ],
   [
    "Q",
    "calm",
    "Then I'll be damp until that heat spends itself. The room can be cool and I'll still be dripping."
   ],
   [
    "S",
    "calm",
    "The damp will lessen as the body stands down. It is heat leaving the work, not the room growing warmer."
   ]
  ]
 },
 {
  "id": "A47",
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
    "I broke a nail in all that scrambling. Look at this ragged little edge."
   ],
   [
    "A",
    "calm",
    "You are mourning a fingernail. Vanity survived the fight even if sense did not."
   ],
   [
    "Q",
    "calm",
    "I snagged a nail in the scramble. Noticing a broken edge is not me grieving my hands like they're a decoration."
   ],
   [
    "A",
    "calm",
    "Then hide the nail. Keep your grief for something that matters."
   ]
  ]
 },
 {
  "id": "A48",
  "context": "after-fight",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "shield-rocking",
  "lines": [
   [
    "S",
    "calm",
    "That shield is still rocking from the strike. It has not settled yet."
   ],
   [
    "A",
    "calm",
    "Keep your inventory of swinging things. I already fought in this room."
   ],
   [
    "S",
    "calm",
    "It is not an inventory. The shield is still moving because the strike has not finished leaving it."
   ],
   [
    "A",
    "calm",
    "Then let it rock. I am not watching furniture sway."
   ]
  ]
 },
 {
  "id": "T40",
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "unordered-pitcher",
  "lines": [
   [
    "Q",
    "calm",
    "Those cups aren't ours. Someone's pitcher just tried to move in."
   ],
   [
    "S",
    "calm",
    "We did not order that. Leaving it on the table invites a later charge."
   ],
   [
    "Q",
    "calm",
    "Then it shouldn't stay. An extra pitcher sitting here is how a charge sneaks up later."
   ],
   [
    "S",
    "calm",
    "Send it back or have it taken. An unordered piece should not remain."
   ]
  ]
 },
 {
  "id": "T41",
  "context": "tavern",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "sleeve-spill",
  "lines": [
   [
    "Q",
    "calm",
    "My sleeve went fishing in the puddle on the table edge. Now the cuff is wearing someone's drink."
   ],
   [
    "A",
    "calm",
    "You cannot watch your own sleeves. Sloppy things dip themselves in whatever sits nearest."
   ],
   [
    "Q",
    "calm",
    "The puddle was already on the table and my sleeve found it. A wet cuff is an accident at the edge, not me refusing to watch my own clothes."
   ],
   [
    "A",
    "calm",
    "Then wring it out. Do not parade a wet cuff at me."
   ]
  ]
 },
 {
  "id": "T42",
  "context": "tavern",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "street-door-noise",
  "lines": [
   [
    "S",
    "calm",
    "The street door keeps opening. Each swing lets a slice of street noise in."
   ],
   [
    "A",
    "calm",
    "Every time that door moves you have a remark ready. The street does not need a herald."
   ],
   [
    "S",
    "calm",
    "The door is what brings the noise. I am naming the cause, not calling the street in."
   ],
   [
    "A",
    "calm",
    "Keep your cause to yourself. Do not brief me each time the street leaks in."
   ]
  ]
 },
 {
  "id": "T43",
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
    "This knot in the table has a little rim. I'm just following it with my finger."
   ],
   [
    "S",
    "calm",
    "A finger on a knot will not bring the wait to a close. The wood under your hand has nothing to do with when they finish."
   ],
   [
    "Q",
    "calm",
    "I know the knot isn't doing any of the work. I'm only giving my hand something to follow while we wait."
   ]
  ]
 },
 {
  "id": "T44",
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
    "That was my stomach. I didn't ask it to join the conversation."
   ],
   [
    "A",
    "calm",
    "You cannot sit a wait without your gut announcing itself. Theatrical little noises from an empty head."
   ],
   [
    "Q",
    "calm",
    "My stomach made a noise on its own. I didn't ask it to speak, and a growl isn't me begging for anything."
   ],
   [
    "A",
    "calm",
    "Then keep it down. I will not sit through a speech from your stomach."
   ]
  ]
 },
 {
  "id": "T45",
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
    "The worker has not stepped back from the station. No finished piece has been set down, so they are still occupied there."
   ],
   [
    "A",
    "calm",
    "They have not walked away. Treating me like I missed that is an insult."
   ],
   [
    "S",
    "calm",
    "I am not accusing you of missing it. The station is still occupied, which is why we are still waiting."
   ],
   [
    "A",
    "calm",
    "Then sit in it. I do not want a ledger of whether they have stepped back."
   ]
  ]
 }
];
const seenKey=id=>"batch8-"+id;
function install(S,R,H,M){
 const seq=S.rpg.s6.sequential;
 function gate(t,s,l){switch(t.gate){
  // These scene observations do not exist; retain the lines without inventing flags.
  case "bedroll-downhill":case "finger-splinter":case "unwashed-pot":case "sleeve-burr":case "sliding-strap":case "cup-ash":
  case "eye-grit":case "floor-haft":case "shield-rocking":case "unordered-pitcher":case "sleeve-spill":case "street-door-noise":return false;
  default:return true;
 }}
 seq.add(TALKS,seenKey,gate);
 return {gate};
}
if(typeof module!=="undefined"&&module.exports)module.exports={TALKS,seenKey,install};
if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=="undefined"?window:globalThis);
