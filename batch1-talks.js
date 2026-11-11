/* Checked sequential batch 1. Separate from the locked picker pools and preview. */
(function(root){"use strict";
const TALKS=[
 {
  "id": "C1",
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
    "You sat down and immediately started counting things. That's not rest. That's homework."
   ],
   [
    "S",
    "calm",
    "A tired mind misses what it should catch. Rest is what brings that back."
   ],
   [
    "Q",
    "calm",
    "Then let's bring it back. No counting. Just sitting. I already started without you."
   ],
   [
    "S",
    "calm",
    "Yes. That is the correct use of the stop."
   ]
  ]
 },
 {
  "id": "C2",
  "context": "camp",
  "speakers": [
   "A",
   "Q"
  ],
  "gate": null,
  "lines": [
   [
    "A",
    "calm",
    "Try not to trip over the kindling. Unlike you, I am actually stopping."
   ],
   [
    "Q",
    "calm",
    "I laid the wood. You can pretend it appeared on its own if that helps."
   ],
   [
    "A",
    "calm",
    "It helps me remember who to blame when it dies."
   ],
   [
    "Q",
    "calm",
    "Then keep an eye on it with me, instead of just waiting to be right."
   ]
  ]
 },
 {
  "id": "C3",
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
    "The first stretch of night is mine. The second stretch is yours."
   ],
   [
    "A",
    "calm",
    "Fine. Don't poke me early because you got bored of standing there."
   ],
   [
    "S",
    "calm",
    "I will wake you when the time is up. Boredom is not the measure."
   ],
   [
    "A",
    "calm",
    "Just don't fall asleep on your feet and leave me exposed."
   ]
  ]
 },
 {
  "id": "C4",
  "context": "camp",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "cooked",
  "lines": [
   [
    "Q",
    "calm",
    "Hot food. I can feel my hands again. That's basically magic."
   ],
   [
    "S",
    "calm",
    "It is heat and salt. Your hands were cold because you stopped moving."
   ],
   [
    "Q",
    "calm",
    "You can call it heat and salt. I'm still calling it a win."
   ],
   [
    "S",
    "calm",
    "Call it what you like. The shaking has stopped. That is the useful part."
   ]
  ]
 },
 {
  "id": "C5",
  "context": "camp",
  "speakers": [
   "Q",
   "A"
  ],
  "gate": "hurt",
  "lines": [
   [
    "Q",
    "calm",
    "Sit. I packed a wrap and I'm not jogging after you with it."
   ],
   [
    "A",
    "calm",
    "You would miss anyway. That sloppy care is how people stay hurt."
   ],
   [
    "Q",
    "calm",
    "I'm not sloppy. I'm trying to keep you from opening it again."
   ],
   [
    "A",
    "calm",
    "Then wrap it and spare me the speech."
   ]
  ]
 },
 {
  "id": "C6",
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
    "Can't sleep either? I can sit here and keep you company. I don't even have to talk. Much."
   ],
   [
    "S",
    "calm",
    "Company that talks about not talking is still talking. Silence lets the mind slow down."
   ],
   [
    "Q",
    "calm",
    "Right. I'll just... be here. Breathing. That's allowed, right?"
   ],
   [
    "S",
    "calm",
    "Breathing is required. Narrating it is not."
   ]
  ]
 },
 {
  "id": "A1",
  "context": "after-fight",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "close",
  "lines": [
   [
    "Q",
    "calm",
    "Ha! Did you see that last swing? I thought I was going to taste the floor."
   ],
   [
    "S",
    "calm",
    "You nearly did. Your balance broke before the last step."
   ],
   [
    "Q",
    "calm",
    "Yeah, but I didn't. That's the important half of nearly."
   ],
   [
    "S",
    "calm",
    "Nearly still counts as a mistake. Do not repeat the same lean."
   ]
  ]
 },
 {
  "id": "A2",
  "context": "after-fight",
  "speakers": [
   "A",
   "Q"
  ],
  "gate": null,
  "lines": [
   [
    "A",
    "calm",
    "You left your side open long enough to get us both killed."
   ],
   [
    "Q",
    "calm",
    "I saw it after. I closed it. We're still here."
   ],
   [
    "A",
    "calm",
    "After is when people die. Try during."
   ],
   [
    "Q",
    "calm",
    "I did try during. That's why I'm arguing instead of bleeding out."
   ]
  ]
 },
 {
  "id": "A3",
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
    "Two of the blows landed closer than they should have. The margin was poor."
   ],
   [
    "A",
    "calm",
    "I saw. I wanted that thing broken sooner than it broke."
   ],
   [
    "S",
    "calm",
    "Wanting it does not shorten the distance it already covered."
   ],
   [
    "A",
    "calm",
    "No. But I can still hate how long it stood there."
   ]
  ]
 },
 {
  "id": "A4",
  "context": "after-fight",
  "speakers": [
   "Q",
   "S"
  ],
  "gate": "clean",
  "lines": [
   [
    "Q",
    "calm",
    "Nobody's leaking. I'm counting that as a perfect performance."
   ],
   [
    "S",
    "calm",
    "It means we were not hit well. It does not mean the halls have gone quiet."
   ],
   [
    "Q",
    "calm",
    "I didn't say the halls threw us a party. I said we did okay."
   ],
   [
    "S",
    "calm",
    "We did well enough to still be standing. That is all the rooms have granted us."
   ]
  ]
 },
 {
  "id": "A5",
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
    "Look at us. Still on our feet. I'm taking a tiny victory lap in my head."
   ],
   [
    "A",
    "calm",
    "A victory lap for not falling over. Set the bar in the dirt, why don't you."
   ],
   [
    "Q",
    "calm",
    "The bar was staying alive. I cleared it. You can keep your dirt."
   ]
  ]
 },
 {
  "id": "A6",
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
    "Corners first. I will not stand easy until I have seen behind that overturned slab."
   ],
   [
    "A",
    "calm",
    "It's empty. You're stalling because you like to fuss."
   ],
   [
    "S",
    "calm",
    "I like not being hit from a blind side. Looking takes less time than bleeding."
   ],
   [
    "A",
    "calm",
    "Then look and be done. I am not applauding the caution."
   ]
  ]
 }
];
const seenKey=id=>"batch1-"+id;
const badlyHurt=snapshot=>snapshot.some(c=>c.hp<=0||c.hp<=c.maxHp*.25);
function install(S,R,H){
 const api=S.rpg.s6,oldCamp=H.camp;
 // One registry/selector owns both original slots; later batches never wrap them.
 const entries=TALKS.map(t=>({t,key:seenKey(t.id),gate:null}));
 function select(context,snapshot,repeat){
  const s=api.st(),l=S.rpg.live();if(!s||!l)return null;
  const eligible=entries.filter(({t,key,gate})=>t.context===context&&(repeat||!s.seen[key])&&t.speakers.every(c=>api.who(c))&&(!api.talkPresent||api.talkPresent(t.lines,[].concat(t.need||[])))&&
   (gate?gate(t,s,l,snapshot):(!t.gate||(t.gate==="cooked"?s.lastMeal==="cooked":t.gate==="hurt"?l.party.some(c=>c.hp<R.maxHp(c,R.DIFF[l.diff].hp)):
    t.gate==="close"?!!snapshot&&badlyHurt(snapshot):!!snapshot&&!badlyHurt(snapshot)))));
  // t2670u/t2675u: with a per-save value the order is a per-save shuffle (root.Variety); same eligibility, conditional scenes still first.
  const V=root.Variety;if(V&&V.active()&&eligible.length){const ok=new Set(eligible.map(e=>e.key)),all=entries.filter(e=>e.t.context===context);
   const pre=!repeat&&eligible.some(e=>e.t.gate),list=pre?all.filter(e=>e.t.gate):all,vkey=(repeat?"seq-r:":pre?"seq-g:":"seq:")+context,ids=list.map(e=>e.key);
   const k=V.peek(vkey,ids,i=>ok.has(i));const e=k&&entries.find(x=>x.key===k);if(e){lastPick={t:e.t,vkey,ids,key:k};return e.t;}}
  // Conditional scenes across ALL batches first, retaining batch/file order.
  const e=repeat?eligible[Math.floor(Math.random()*eligible.length)]:eligible.find(e=>e.t.gate)||eligible[0];return e?e.t:null;
 }
 let lastPick=null;
 function run(context,snapshot,opt,repeat){lastPick=null;const t=select(context,snapshot,repeat);if(!t)return false;
  if(lastPick&&lastPick.t===t&&root.Variety)root.Variety.commitId(lastPick.vkey,lastPick.ids,lastPick.key);
  api.st().seen[entries.find(e=>e.t===t).key]=1;const visual=root.DialogueArt;const options=context==="camp"?Object.assign({},opt,{bg:S.rpg.s5.campBg(t)}):opt||{bg:null};
  api.play(context,t.lines,context!=="camp"&&visual?visual.sceneOptions(t,options):options);return true;}
 const sequential={select,run,add:(talks,key,gate)=>talks.forEach(t=>entries.push({t,key:key(t.id),gate}))};
 api.sequential=sequential;
 H.camp=k=>{if(!run("camp"))return oldCamp(k);};
 H.meal=(it,fx)=>{const s=api.st();if(s)s.lastMeal=it.slot==="use"?"ration":it.slot==="dish"&&fx&&fx.hp?"cooked":"buff";};
 // Called only by the non-boss victory Continue handler, after closeUI().
 H.fightContinue=snapshot=>run("after-fight",snapshot);
 return sequential;
}
if(typeof module!=="undefined"&&module.exports)module.exports={TALKS,seenKey,badlyHurt,install};
if(root.SOTA&&root.SOTA.rpg&&root.SOTA.rpg.s6)install(root.SOTA,root.RPG,root.S6H);
})(typeof window!=="undefined"?window:globalThis);
