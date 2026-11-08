/* Checked sequential batch 2; spoken lines are separate from locked picker pools. */
(function(root){"use strict";
const TALKS=[
 {
  "id": "C7",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": null,
  "lines": [
   [
    "Q",
    "calm",
    "Everything was so much easier to carry before I put it down. Can't we leave packing till later?"
   ],
   [
    "S",
    "calm",
    "The pause has already relieved the fatigue. Delaying the packing gains nothing."
   ],
   [
    "Q",
    "calm",
    "Then I'd better pack. Hand me my pack before I talk myself into sitting longer."
   ]
  ]
 },
 {
  "id": "C8",
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
    "I'll roll the bedding. Look, two willing hands. No waiting."
   ],
   [
    "A",
    "calm",
    "Two extra hands. That means a mess I will have to undo."
   ],
   [
    "Q",
    "calm",
    "You haven't even let me touch it. I can roll bedding without your permission to be useful."
   ],
   [
    "A",
    "calm",
    "Then make yourself useful. Every fold you botch is yours to fix."
   ]
  ]
 },
 {
  "id": "C9",
  "context": "camp",
  "speakers": [
   "S",
   "A"
  ],
  "gate": "rations",
  "lines": [
   [
    "S",
    "calm",
    "These two portions match. Take either one."
   ],
   [
    "A",
    "calm",
    "And you need to tell me that? I can see how little you've handed me."
   ],
   [
    "S",
    "calm",
    "That is half of what is here. There is no larger portion to offer."
   ],
   [
    "A",
    "calm",
    "Then keep the explanation. It makes a thin share no easier to swallow."
   ]
  ]
 },
 {
  "id": "C10",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "fire-cold",
  "lines": [
   [
    "Q",
    "calm",
    "Brr. I liked this spot better when my teeth weren't knocking."
   ],
   [
    "S",
    "calm",
    "The fuel has burned through. Those embers cannot maintain the heat."
   ],
   [
    "Q",
    "calm",
    "Then I'll get more wood. I'd rather hear that crackle than my teeth."
   ]
  ]
 },
 {
  "id": "C11",
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
    "It's awfully quiet. I could tell you something. Oh, now I have to choose."
   ],
   [
    "A",
    "calm",
    "Choose silence. Nothing out of your mouth has improved it."
   ],
   [
    "Q",
    "calm",
    "You don't have to like my chatter. That doesn't make every word worthless."
   ],
   [
    "A",
    "calm",
    "Then keep those precious words to yourself. I want the quiet back."
   ]
  ]
 },
 {
  "id": "C12",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "drink",
  "lines": [
   [
    "Q",
    "calm",
    "Here. A grand, generous sip. Well, a sip. Take it before I oversell it."
   ],
   [
    "S",
    "calm",
    "Only a small one. Some of this water needs to remain in the flask."
   ],
   [
    "Q",
    "calm",
    "A smaller grand sip, then. I'll put the stopper back before I get generous again."
   ]
  ]
 },
 {
  "id": "A7",
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
    "I was going to say—oh! Now I've lost the air and the words. Nearly had both."
   ],
   [
    "S",
    "calm",
    "Wait until your breathing steadies. You are cutting off your own sentences."
   ],
   [
    "Q",
    "calm",
    "So that's where they went. I'll save the next one till I can finish it."
   ]
  ]
 },
 {
  "id": "A8",
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
    "My hands haven't settled yet. Funny how my mouth's ready before they are."
   ],
   [
    "A",
    "calm",
    "Ready to babble. You've already let your attention rot."
   ],
   [
    "Q",
    "calm",
    "I'm talking to you, not forgetting where I am. I can do both."
   ],
   [
    "A",
    "calm",
    "Then keep your eyes working. Your mouth hasn't earned my confidence."
   ]
  ]
 },
 {
  "id": "A9",
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
    "Too much energy went into recovering from those wide swings."
   ],
   [
    "A",
    "calm",
    "All that strength spent hauling back. Wretched, sloppy work."
   ],
   [
    "S",
    "calm",
    "Sloppy is accurate. The openings did not require that extra motion."
   ],
   [
    "A",
    "calm",
    "I know the openings were there. I swung wide anyway."
   ]
  ]
 },
 {
  "id": "A10",
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
    "Hold your arm out. I'm hoping that's dust. Dust is my favorite injury."
   ],
   [
    "S",
    "calm",
    "A surface scrape. There is no deeper wound beneath it."
   ],
   [
    "Q",
    "calm",
    "Not dust, then. Still, I'll take a scrape over what I was worried about."
   ]
  ]
 },
 {
  "id": "A11",
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
    "Ha—sorry. That laugh slipped out. My nerves haven't caught up yet."
   ],
   [
    "A",
    "calm",
    "Listen to yourself. Too weak to keep even that under control."
   ],
   [
    "Q",
    "calm",
    "A laugh got out. I didn't fall apart. Don't confuse the two."
   ]
  ]
 },
 {
  "id": "A12",
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
    "The echoes are fading. I need to hear what remains beneath them."
   ],
   [
    "A",
    "calm",
    "You need an excuse to cower. Now you're picking through echoes."
   ],
   [
    "S",
    "calm",
    "Echoes can conceal movement. Waiting for them to fade separates the sounds."
   ],
   [
    "A",
    "calm",
    "Separate them, then. Don't drag this out to feed your nerves."
   ]
  ]
 },
 {
  "id": "T1",
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": null,
  "lines": [
   [
    "Q",
    "calm",
    "Ooh. My feet have handed all their work to this chair. Very generous of them."
   ],
   [
    "S",
    "calm",
    "Removing the weight gives the muscles time to recover. This stop will help."
   ],
   [
    "Q",
    "calm",
    "Then I'll let the chair keep the job a bit. My feet aren't asking for it back."
   ]
  ]
 },
 {
  "id": "T2",
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
    "There's so much to look at in here. I keep getting halfway round and starting over."
   ],
   [
    "A",
    "calm",
    "Gawking again. Can't enter a room without showing how empty your head is."
   ],
   [
    "Q",
    "calm",
    "I'm curious. My head can hold a little more than what I've already seen."
   ],
   [
    "A",
    "calm",
    "Then use it without gaping. Your curiosity looks like helplessness."
   ]
  ]
 },
 {
  "id": "T3",
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
    "Once the fatigue eases, another hour here will provide little benefit."
   ],
   [
    "A",
    "calm",
    "So I sit here until you decide I've rested enough. Keep that authority to yourself."
   ],
   [
    "S",
    "calm",
    "You can judge your own fatigue. I am stating the point at which the stop ceases to help."
   ],
   [
    "A",
    "calm",
    "Then leave my judgment out of it. I don't need you measuring my tiredness."
   ]
  ]
 },
 {
  "id": "T4",
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "loud",
  "lines": [
   [
    "Q",
    "calm",
    "Listen to all that clatter. Even the cups sound excited."
   ],
   [
    "S",
    "calm",
    "It is obscuring your voice. I missed the beginning of that sentence."
   ],
   [
    "Q",
    "calm",
    "Oh. The cups are winning. I'll lean nearer so you get the whole thing."
   ]
  ]
 },
 {
  "id": "T5",
  "context": "tavern",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "pay",
  "lines": [
   [
    "Q",
    "calm",
    "There. The payment's ready. I'll tuck the change away before it gets ideas."
   ],
   [
    "A",
    "calm",
    "As if you'd notice it missing. You're careless with anything worth keeping."
   ],
   [
    "Q",
    "calm",
    "I counted it before I put it away. Nothing's missing just because you expect it to be."
   ],
   [
    "A",
    "calm",
    "Keep counting. One careful moment doesn't make you reliable."
   ]
  ]
 },
 {
  "id": "T6",
  "context": "tavern",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "food",
  "lines": [
   [
    "Q",
    "calm",
    "Mmm. I was going to talk between bites. That's become a much less tempting plan."
   ],
   [
    "S",
    "calm",
    "It is an ordinary meal. The nourishment matters more than the taste."
   ],
   [
    "Q",
    "calm",
    "Ordinary can taste nice. I'll have the nourishment with the nice part still attached."
   ]
  ]
 },
 {
  "id": "T7",
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
    "How can the work still be going? I've run out of ways to cross my ankles."
   ],
   [
    "S",
    "calm",
    "Completion takes time. Your discomfort does not shorten the remaining work."
   ],
   [
    "Q",
    "calm",
    "No shortcuts through my ankles, then. I'll uncross them and give the work a chance."
   ]
  ]
 },
 {
  "id": "T8",
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
    "Still working. I suppose I can wait a little more. My knees might complain."
   ],
   [
    "A",
    "calm",
    "Of course you can. You've never valued a minute enough to resent wasting it."
   ],
   [
    "Q",
    "calm",
    "I'm not wasting it. Something's getting made. I don't have to be busy for that to matter."
   ],
   [
    "A",
    "calm",
    "Then cling to that. You seem eager to excuse every minute this takes."
   ]
  ]
 },
 {
  "id": "T9",
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
    "Stopping the craft now would discard work already completed. The result requires the remaining steps."
   ],
   [
    "A",
    "calm",
    "And I pay for those steps by rotting here. A tidy bargain for you."
   ],
   [
    "S",
    "calm",
    "The delay is the same for each of us. Abandoning the work would add a loss without recovering that time."
   ],
   [
    "A",
    "calm",
    "Keep your tally of losses. It doesn't make this wait less foul."
   ]
  ]
 }
];
const seenKey=id=>"batch2-"+id;
function install(S,R,H,M){
 const api=S.rpg.s6,seq=api.sequential,oldTavern=H.tavern,oldShop=H.shop,oldCraft=H.craft;
 const bags=l=>l.party.flatMap(c=>c.bag||[]);
 const drink=id=>["i_water","potion","ether"].includes(id);
 const food=id=>id==="ration"||drink(id)||(R.ITEMS[id]&&R.ITEMS[id].slot==="dish");
 function gate(t,s,l,event){switch(t.gate){
  case "rations":return bags(l).includes("ration");
  case "drink":return bags(l).some(drink);
  // No live fire-down/cold observation or loud-room state exists in this build.
  // Do not substitute tent wear, zone darkness, music, or a new story flag.
  case "fire-cold":case "loud":return false;
  case "pay":return event==="pay";
  case "food":return bags(l).some(food);
  default:return true;
 }}
 seq.add(TALKS,seenKey,gate);
 const key=(t,l)=>t+":"+l.steps;
 const bg=t=>({bg:S.rpg.s5.tavernBg(t)});
 function here(){const p=S.state&&S.state();return p&&M?M.taverns.findIndex(c=>c[0]===p.x&&c[1]===p.y):-1;}
 H.tavern=t=>{const s=api.st(),l=S.rpg.live();if(!s||!l)return oldTavern(t);
  const vk=key(t,l);if(s.batch2Visit&&s.batch2Visit.key===vk)return;
  // Honor the original visit guard for saves made before this module existed.
  if(s.visit===vk){s.batch2Visit={key:vk,used:true};return;}
  const visit=s.batch2Visit={key:vk,used:false};
  if(seq.run("tavern",null,bg(t))){visit.used=true;s.visit=vk;s.shopN=0;return;}
  const before=Object.keys(s.seen).length;oldTavern(t);
  // An old picker fallback consumes this stop too, but an exhausted pool does not.
  visit.used=Object.keys(s.seen).length>before;
 };
 H.shop=()=>{const s=api.st(),l=S.rpg.live(),t=here(),v=s&&s.batch2Visit;
  if(l&&t>=0&&v&&v.key===key(t,l)&&!v.used&&seq.run("tavern","pay",bg(t))){v.used=true;return;}
  if(oldShop)return oldShop();
 };
 // party.js dispatches only successful tavern crafts, never camp food attempts.
 H.craft=(kind,t)=>{if(!["food","armor","ore","weapons"].includes(kind)||!Number.isInteger(t)||t<0)return;
  if(!seq.run("craft-wait",null,bg(t))&&oldCraft)return oldCraft(kind,t);
 };
 return {gate,here};
}
if(typeof module!=="undefined"&&module.exports)module.exports={TALKS,seenKey,install};
if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H,root.MAZE);
})(typeof window!=="undefined"?window:globalThis);
