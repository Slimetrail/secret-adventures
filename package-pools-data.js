(function(root){const data={
 "camp": [
  {
   "id": "5",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Stamina food cooked",
   "text": "You’re spoiling me again.",
   "backup": "Third time this week.",
   "notes": "Core (Jeremy t1905u example)"
  },
  {
   "id": "6",
   "layer": "B",
   "speaker": "Scholar",
   "condition": "Scholar present + stamina food",
   "text": "She always gets the good portions.",
   "backup": "",
   "notes": "Insert (Jeremy t1905u example)"
  },
  {
   "id": "7",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "That’s the third stamina meal in a row.",
   "backup": "",
   "notes": "Core (Jeremy t1903u example)"
  },
  {
   "id": "20",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "We should rest while we can.",
   "backup": "Sit down. The next stretch can wait.",
   "notes": "Core — rest. Alternative rest opener; if another rest-now line is already playing in this cascade, pass."
  },
  {
   "id": "21",
   "layer": "A",
   "speaker": "Any",
   "condition": "Beat-up",
   "text": "We look finished. We are not done.",
   "backup": "We're hurt. Say it and sit.",
   "notes": "Core — injury. Backup recast (t1931u) so it does not treat the whole roster as present."
  },
  {
   "id": "22",
   "layer": "A",
   "speaker": "Any",
   "condition": "Rations only",
   "text": "Rations will not fix much.",
   "backup": "That barely helps.",
   "notes": "Core — rations"
  },
  {
   "id": "23",
   "layer": "A",
   "speaker": "Any",
   "condition": "Good food cooked",
   "text": "That food landed. You can hear it in the quiet.",
   "backup": "You can feel that one working.",
   "notes": "Core — good cooking"
  },
  {
   "id": "24",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "Fire’s going. That’s enough for now.",
   "backup": "The fire is enough for tonight.",
   "notes": "Core — camp rest"
  },
  {
   "id": "25",
   "layer": "A",
   "speaker": "Any",
   "condition": "After dad reveal",
   "text": "The food still helps. It does not fix what we learned.",
   "backup": "Eat anyway. The news will still be there.",
   "notes": "Core — dad reveal, no joke on the news"
  },
  {
   "id": "26",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Beat-up",
   "text": "Hey. Sit before you fall over.",
   "backup": "We can be tough after we stop bleeding.",
   "notes": "Core — injury"
  },
  {
   "id": "27",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Come on, eat before it gets cold.",
   "backup": "Eat first. Then we can talk.",
   "notes": "Core — food, next thing"
  },
  {
   "id": "28",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Good food cooked",
   "text": "See? Good food. You’re already standing straighter.",
   "backup": "Told you cooking was worth it.",
   "notes": "Core — cooking boosts spirits"
  },
  {
   "id": "29",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Rations only",
   "text": "Rations again. Don’t expect a miracle.",
   "backup": "Same dry stuff. Eat it anyway.",
   "notes": "Core — rations"
  },
  {
   "id": "30",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Sleep if you can. I’ll poke you if something’s on fire.",
   "backup": "Get some sleep. I’ll keep an ear out.",
   "notes": "Core — rest"
  },
  {
   "id": "31",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "Rest first. The rooms will wait.",
   "backup": "The next rooms can wait until morning.",
   "notes": "Core — rest. Alternative rest opener; if another rest-now line is already playing in this cascade, pass."
  },
  {
   "id": "32",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Beat-up",
   "text": "These injuries will worsen if we walk now.",
   "backup": "If we walk now, the wounds will open again.",
   "notes": "Core — injury"
  },
  {
   "id": "33",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Good food cooked",
   "text": "That was properly made. It will do more than rations.",
   "backup": "That will do more for us than resting hungry.",
   "notes": "Core — cooking"
  },
  {
   "id": "34",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Rations only",
   "text": "Eat what we have. The rooms will still be there.",
   "backup": "This is only to keep us moving.",
   "notes": "Core — rations"
  },
  {
   "id": "35",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "I will take watch. Talk is not required.",
   "backup": "I have the watch. Rest.",
   "notes": "Core — companion talk / silence"
  },
  {
   "id": "36",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "After dad reveal",
   "text": "Eat. We can discuss what the later pieces meant after that.",
   "backup": "Sit and eat. The art can be spoken of after.",
   "notes": "Core — dad reveal, redirect to art"
  },
  {
   "id": "37",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "Eat. Then we move.",
   "backup": "Food now. Walking later.",
   "notes": "Core — food then job"
  },
  {
   "id": "38",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Beat-up",
   "text": "Sit. Standing there does not heal it.",
   "backup": "Get off your feet.",
   "notes": "Core — injury"
  },
  {
   "id": "39",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Good food cooked",
   "text": "That helped. Don’t waste it talking.",
   "backup": "Good. Now be still.",
   "notes": "Core — cooking"
  },
  {
   "id": "40",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Rations only",
   "text": "It is food. Not a reason to linger.",
   "backup": "Swallow it. We still have work.",
   "notes": "Core — rations"
  },
  {
   "id": "41",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "Sleep. I will keep the fire.",
   "backup": "I will watch the fire. Sleep.",
   "notes": "Core — rest"
  },
  {
   "id": "42",
   "layer": "A",
   "speaker": "Angry",
   "condition": "After dad reveal",
   "text": "I am not angry at you. I am angry at him.",
   "backup": "We rest. Then we deal with what he left.",
   "notes": "Core — dad reveal, not blaming the son"
  },
  {
   "id": "43",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Quirky's favored buff meal several times",
   "text": "Keep this up and I'll never leave.",
   "backup": "Hot food again? I'm not arguing.",
   "notes": "Core. Topic: Repeat favored meal (t1908u). Voice batch 1. Condition is this speaker only (t1924u). Recast to drop 'Another stamina meal' so it does not restate Jeremy's third-meal samples in one cascade (t1926u)."
  },
  {
   "id": "44",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Camp's up. I'm staying right here. For a bit.",
   "backup": "Good. I'm not going anywhere yet.",
   "notes": "Core. Topic: Settling in. Voice batch 1"
  },
  {
   "id": "45",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "We're stopping. Don't waste it.",
   "backup": "This is a stop. Use it.",
   "notes": "Core. Topic: Settling in. Voice batch 1"
  },
  {
   "id": "46",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Not another companion's favored meal",
   "text": "I'll take it. I'm not picky tonight. Mostly.",
   "backup": "Food's food. I'll eat.",
   "notes": "Core. Topic: What the food is. Voice batch 1. Should not play when someone else is being fed the good option most (t1924u)."
  },
  {
   "id": "47",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Rations only",
   "text": "Rations like this will not last if we are careless.",
   "backup": "",
   "notes": "Core. Topic: What the food is. Voice batch 1. Gated to rations so it does not fight a good-meal line."
  },
  {
   "id": "48",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "It's food. That's all it needs to be.",
   "backup": "Eat. Don't make it more than that.",
   "notes": "Core. Topic: What the food is. Voice batch 1"
  },
  {
   "id": "49",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Scholar's favored buff meal several times",
   "text": "You keep cooking the meal that favors me. I have noticed.",
   "backup": "I am aware this one is for me.",
   "notes": "Core. Topic: Repeat favored meal (t1908u). Voice. Condition is this speaker only (t1924u)."
  },
  {
   "id": "50",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Angry's favored buff meal several times",
   "text": "You keep making mine. I won't forget that.",
   "backup": "That's my meal again. Good.",
   "notes": "Core. Topic: Repeat favored meal (t1908u). Voice. Condition is this speaker only (t1924u)."
  },
  {
   "id": "51",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "We should use the stop. The path ahead will not simplify itself.",
   "backup": "Use the halt. The next rooms will not get easier.",
   "notes": "Core. Topic: Settling in. Voice cascade batch 2"
  },
  {
   "id": "52",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "You gonna sit there all night? Come closer to the fire.",
   "backup": "",
   "notes": "Core — rest, next thing"
  },
  {
   "id": "53",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Beat-up",
   "text": "I know, I know. Everything hurts. Stay put.",
   "backup": "",
   "notes": "Core — injury"
  },
  {
   "id": "54",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Good food cooked",
   "text": "If you're the one that meal helped, sit and let it.",
   "backup": "",
   "notes": "Core — cooking helps who it favors"
  },
  {
   "id": "55",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Pack can wait. Warm up first.",
   "backup": "",
   "notes": "Core — rest"
  },
  {
   "id": "56",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Rations only",
   "text": "Yeah, it's grim. Still better than walking hungry.",
   "backup": "",
   "notes": "Core — rations"
  },
  {
   "id": "57",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "After dad reveal",
   "text": "Hey. You don't have to explain it tonight. Eat.",
   "backup": "",
   "notes": "Core — dad reveal, comfort"
  },
  {
   "id": "58",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "If you can't sleep, talk. Or don't. I'm here either way.",
   "backup": "",
   "notes": "Core — companion talk"
  },
  {
   "id": "59",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Tomorrow's going to be a lot. Steal a little rest now.",
   "backup": "",
   "notes": "Core — rest"
  },
  {
   "id": "60",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "A short rest now will cost us less than a long one later.",
   "backup": "A short halt now costs less later.",
   "notes": "Core — rest. Alternative rest opener; if another rest-now line is already playing in this cascade, pass."
  },
  {
   "id": "61",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Beat-up",
   "text": "Bind what you can before you lie down.",
   "backup": "",
   "notes": "Core — injury"
  },
  {
   "id": "62",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Good food cooked",
   "text": "Let the meal settle before we plan the next rooms.",
   "backup": "Those who needed that meal most should feel it first.",
   "notes": "Core — cooking helps who it favors. Recast so a cascade after 54 does not restate who the meal was for (t1926u)."
  },
  {
   "id": "63",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "If you wish to think, I will not interrupt.",
   "backup": "",
   "notes": "Core — companion talk / silence"
  },
  {
   "id": "64",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "After dad reveal",
   "text": "We do not have to settle the meaning tonight.",
   "backup": "",
   "notes": "Core — dad reveal"
  },
  {
   "id": "65",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "Stop fidgeting. Rest is part of the work.",
   "backup": "",
   "notes": "Core — rest"
  },
  {
   "id": "66",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Beat-up",
   "text": "You are not proving anything by staying upright.",
   "backup": "",
   "notes": "Core — injury"
  },
  {
   "id": "67",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Good food cooked",
   "text": "Don't talk it away. Eat.",
   "backup": "If that meal was for you, use it.",
   "notes": "Core — cooking helps who it favors. Recast so a cascade after 54 does not restate who the meal was for (t1926u)."
  },
  {
   "id": "68",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "The night is for recovering. Not for wandering off.",
   "backup": "",
   "notes": "Core — rest"
  },
  {
   "id": "69",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "We can spare a little time here. Not a lot.",
   "backup": "A little time here. Then we move.",
   "notes": "Core — rest. Alternative rest opener; if another rest-now line is already playing in this cascade, pass."
  },
  {
   "id": "70",
   "layer": "A",
   "speaker": "Any",
   "condition": "Rations only",
   "text": "Divide it evenly. There is not enough to be proud of.",
   "backup": "",
   "notes": "Core — rations"
  },
  {
   "id": "71",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Rations only or not a group meal",
   "text": "Ugh, not again. This isn't even a real meal.",
   "backup": "I wanted actual food. This isn't it.",
   "notes": "Core. Topic: Repeated rations / not a group meal (t1924u). Voice. Alternative opener; do not play in the same cascade as other rations openers, or with Camp 72 or 73."
  },
  {
   "id": "72",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Rations only or not a group meal",
   "text": "These are rations, not a meal prepared for us.",
   "backup": "We are repeating provisions, not cooking.",
   "notes": "Core. Topic: Repeated rations / not a group meal (t1924u). Voice. Alternative opener; do not play in the same cascade as other rations openers, or with Camp 71 or 73."
  },
  {
   "id": "73",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Rations only or not a group meal",
   "text": "Not a meal. Again.",
   "backup": "Dry food. Eat it.",
   "notes": "Core. Topic: Repeated rations / not a group meal (t1924u). Voice. Alternative opener; do not play in the same cascade as other rations openers, or with Camp 71 or 72."
  },
  {
   "id": "74",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Smoke's in my eyes. I'm still not moving.",
   "backup": "",
   "notes": "Core — rest"
  },
  {
   "id": "75",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Boots off if you can. We're not impressing anyone out here.",
   "backup": "",
   "notes": "Core — rest"
  },
  {
   "id": "76",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Beat-up",
   "text": "I'll wrap what I can reach. You just breathe.",
   "backup": "",
   "notes": "Core — injury"
  },
  {
   "id": "77",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "If the fire pops, that's me. Not an emergency. Probably.",
   "backup": "",
   "notes": "Core — companion talk"
  },
  {
   "id": "78",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "I will note what we saw once you are settled.",
   "backup": "",
   "notes": "Core — redirect to art"
  },
  {
   "id": "79",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "Keep the packs inside the firelight.",
   "backup": "",
   "notes": "Core — rest / practical"
  },
  {
   "id": "80",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "If you have watch, say so. I will not guess.",
   "backup": "",
   "notes": "Core — companion talk"
  },
  {
   "id": "81",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "Dry your boots. Soft feet will slow us tomorrow.",
   "backup": "",
   "notes": "Core — rest"
  },
  {
   "id": "82",
   "layer": "A",
   "speaker": "Angry",
   "condition": "save-the-world join",
   "text": "I didn't come here to sit by a fire. What's ahead has to be stopped.",
   "backup": "The fire is fine. The work is still out there.",
   "notes": "Later reaction matching the tavern-4 save-the-world version (t1953u). Voice draft on Scene's gate. Locked at tavern 4 by zone3-05-crystal-cracked-smoke, not flipped by Zone 4/5 art. Alternative opener with camp 84; do not stack two save-the-world later lines in one cascade. Do not leak the dad reveal, dad hints, endings, or the letter."
  },
  {
   "id": "83",
   "layer": "A",
   "speaker": "Angry",
   "condition": "team-died join",
   "text": "I left my team behind. I'm not doing that twice.",
   "backup": "I ran once. Once is enough.",
   "notes": "Later reaction matching the tavern-4 team-died version (t1953u). Voice draft on Scene's gate. Locked at tavern 4, not flipped by Zone 4/5 art. Alternative opener with camp 85; do not stack two team-died later lines in one cascade. Do not leak the dad reveal, dad hints, endings, or the letter."
  },
  {
   "id": "84",
   "layer": "A",
   "speaker": "Angry",
   "condition": "save-the-world join",
   "text": "Let it keep spreading and there will be no safe stop left. We move.",
   "backup": "I came to end it. Not to wait it out.",
   "notes": "Later reaction, save-the-world version (t1953u). Voice draft. Alternative opener with camp 82; do not stack two save-the-world later lines in one cascade. Do not leak the dad reveal, dad hints, endings, or the letter."
  },
  {
   "id": "85",
   "layer": "A",
   "speaker": "Angry",
   "condition": "team-died join",
   "text": "The golem took my team. I live with that.",
   "backup": "They died on that thing. I got out.",
   "notes": "Later reaction, team-died version (t1953u). Voice draft. Alternative opener with camp 83; do not stack two team-died later lines in one cascade. Do not leak the dad reveal, dad hints, endings, or the letter."
  }
 ],
 "tavern": [
  {
   "id": "8",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "We made it. Barely.",
   "backup": "",
   "notes": "Core (Jeremy t1903u example)"
  },
  {
   "id": "30",
   "layer": "A",
   "speaker": "Any",
   "condition": "Beat-up",
   "text": "We should sit before we fall over.",
   "backup": "Find a bench before someone falls.",
   "notes": "Core — beat-up arrival"
  },
  {
   "id": "31",
   "layer": "A",
   "speaker": "Any",
   "condition": "Long crafting stay",
   "text": "Still at the bench. The room can wait.",
   "backup": "Same tavern, same noise, different hour.",
   "notes": "Core — crafting stay"
  },
  {
   "id": "32",
   "layer": "A",
   "speaker": "Any",
   "condition": "Bar tab",
   "text": "We owe them for the furniture.",
   "backup": "The bar tab is going to hurt.",
   "notes": "Core — funny consequence"
  },
  {
   "id": "33",
   "layer": "A",
   "speaker": "Any",
   "condition": "Tavern 3",
   "text": "No one new this time. Just us.",
   "backup": "",
   "notes": "Core — nobody joins at tavern 3"
  },
  {
   "id": "34",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Don’t just stand in the doorway.",
   "backup": "Come on, sit or keep moving. Don’t block the door.",
   "notes": "Core — arrival response"
  },
  {
   "id": "35",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Beat-up",
   "text": "Sit down before you bleed on their floor. They’ll charge us.",
   "backup": "You’re swaying. Sit.",
   "notes": "Core — beat-up"
  },
  {
   "id": "36",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Long crafting stay",
   "text": "You’re still at it? Fine. I’ll watch the room.",
   "backup": "Take your time. I’ll find trouble if I get bored.",
   "notes": "Core — crafting stay"
  },
  {
   "id": "37",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Bar tab",
   "text": "Okay, that chair was already weak.",
   "backup": "I’ll help pay. After I sit.",
   "notes": "Core — funny consequence"
  },
  {
   "id": "38",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Tavern 1 + first join",
   "text": "You’re heading back in? Good. I was getting bored.",
   "backup": "Count me in. Sitting here was getting old.",
   "notes": "Core — Mira joins at tavern 1"
  },
  {
   "id": "39",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "We should sell the junk and restock rations while we are here.",
   "backup": "Junk out, rations in, then we can sit.",
   "notes": "Core — downtime, junk and rations"
  },
  {
   "id": "40",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Beat-up",
   "text": "Sit. Conversation can wait until the bleeding slows.",
   "backup": "The bleeding first. Talk after.",
   "notes": "Core — beat-up"
  },
  {
   "id": "41",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Long crafting stay",
   "text": "Work as long as you need. I will keep to the table.",
   "backup": "I will stay here until you are done.",
   "notes": "Core — crafting stay"
  },
  {
   "id": "42",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Bar tab",
   "text": "We should settle what we broke before we leave.",
   "backup": "Pay for the damage, then we go.",
   "notes": "Core — consequence"
  },
  {
   "id": "43",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Tavern 2 + first join",
   "text": "I will come. The later rooms are the ones that matter.",
   "backup": "",
   "notes": "Core — Sorrel joins at tavern 2"
  },
  {
   "id": "44",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "Do not get comfortable.",
   "backup": "This is a stop. Not the job.",
   "notes": "Core — arrival response. Also the reply after row 8 so Voice B is not duplicated."
  },
  {
   "id": "45",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Beat-up",
   "text": "We walk in looking like this, they stare. Let them.",
   "backup": "Let them look. Sit anyway.",
   "notes": "Core — beat-up"
  },
  {
   "id": "46",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Long crafting stay",
   "text": "Finish the work. I am not here to drink.",
   "backup": "The work comes first.",
   "notes": "Core — crafting stay"
  },
  {
   "id": "47",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Bar tab",
   "text": "They charge us for sitting still. Fine. Pay it.",
   "backup": "If they want coin for the mess, give it to them.",
   "notes": "Core — consequence, tavern contempt"
  },
  {
   "id": "48",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Tavern 4 + first join",
   "text": "They can keep their seats. I am coming with you.",
   "backup": "",
   "notes": "Core — Brunn joins at tavern 4. Version-neutral join. If tavern 84 or 85 is already playing in this cascade, pass (do not stack two join lines)."
  },
  {
   "id": "49",
   "layer": "A",
   "speaker": "Any",
   "condition": "After dad reveal",
   "text": "The room feels smaller since we learned that.",
   "backup": "",
   "notes": "Core — dad reveal gravity"
  },
  {
   "id": "50",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "After dad reveal",
   "text": "You okay? Sit down a second.",
   "backup": "I’m here. We don’t have to talk it to death.",
   "notes": "Core — dad reveal, comfort"
  },
  {
   "id": "51",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "After dad reveal",
   "text": "The later wall pieces were already about this.",
   "backup": "The last pieces were already leading here.",
   "notes": "Core — dad reveal, redirect to art"
  },
  {
   "id": "52",
   "layer": "A",
   "speaker": "Angry",
   "condition": "After dad reveal",
   "text": "Do not buy me a drink and call it even.",
   "backup": "I came to finish it. Not to toast him.",
   "notes": "Core — dad reveal, anger at the dad not the son"
  },
  {
   "id": "53",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "We're in! See? I told you. Mostly told you.",
   "backup": "Alive again. I'm counting that as a win.",
   "notes": "Alternative opener if Quirky is picked; do not play as a reply after row 8. Voice batch 1"
  },
  {
   "id": "54",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "We reached the tavern. The margin was narrow.",
   "backup": "Arrival does not mean the danger has passed.",
   "notes": "Alternative opener if Scholar is picked; do not play as a reply after row 8, and do not pair with close-call 59–61. Voice batch 1"
  },
  {
   "id": "55",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "We're inside.",
   "backup": "In. That's enough.",
   "notes": "Alternative opener if Angry is picked; do not play as a reply after row 8. Dropped Barely so it does not echo row 8. Voice batch 1"
  },
  {
   "id": "56",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "We're still the ones heading back out, right?",
   "backup": "We're not staying forever, right?",
   "notes": "Core. Topic: People staying put. Voice batch 1. Recast so a cascade does not restate that the others are settled (t1926u)."
  },
  {
   "id": "57",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "They intend to remain. What we need is not in this room.",
   "backup": "This room is a pause. It is not the work.",
   "notes": "Core. Topic: People staying put. Voice batch 1"
  },
  {
   "id": "58",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "Comfort is all they want. Not me.",
   "backup": "I didn't come here to sit.",
   "notes": "Core. Topic: People staying put. Voice batch 1. Recast so a cascade does not restate that they will remain (t1926u)."
  },
  {
   "id": "59",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "That was close. I'm fine! You're fine. We're fine.",
   "backup": "Still standing! That's the important part.",
   "notes": "Core. Topic: Close call. Voice batch 1. Alternative close-call opener; do not play as a reply after row 8."
  },
  {
   "id": "60",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "Fortune is not a plan.",
   "backup": "A near miss is not a method we should rely on.",
   "notes": "Core. Topic: Close call. Voice batch 1. Recast so a cascade after 59 does not restate the near-miss (t1926u). Alternative close-call opener; do not play as a reply after row 8."
  },
  {
   "id": "61",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "Next time we finish it faster.",
   "backup": "Don't count on luck next time.",
   "notes": "Core. Topic: Close call. Voice batch 1. Recast so a cascade after 59 does not restate the near-miss (t1926u). Alternative close-call opener; do not play as a reply after row 8."
  },
  {
   "id": "62",
   "layer": "B",
   "speaker": "Quirky",
   "condition": "Quirky present",
   "text": "See? I told you. Mostly told you.",
   "backup": "Alive again. I'm counting that as a win.",
   "notes": "Insert. Reply after We made it. Voice cascade batch 2"
  },
  {
   "id": "63",
   "layer": "B",
   "speaker": "Scholar",
   "condition": "Scholar present",
   "text": "The danger has not passed.",
   "backup": "What we need next is not a celebration.",
   "notes": "Insert. Reply after We made it. Voice cascade batch 2"
  },
  {
   "id": "64",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "If you're gonna brood, at least do it in a chair.",
   "backup": "",
   "notes": "Core — arrival / settle"
  },
  {
   "id": "65",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Order something. You're allowed to be a person for five minutes.",
   "backup": "",
   "notes": "Core — downtime"
  },
  {
   "id": "66",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Long crafting stay",
   "text": "I'll fetch us something while you work. Don't disappear into it.",
   "backup": "",
   "notes": "Core — crafting stay"
  },
  {
   "id": "67",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "After dad reveal",
   "text": "We can sit with it. We don't have to perform being fine.",
   "backup": "",
   "notes": "Core — dad reveal, comfort"
  },
  {
   "id": "68",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Loud in here, huh? Stick close so I don't lose you.",
   "backup": "Stay where I can see you in this noise.",
   "notes": "Core — tavern room"
  },
  {
   "id": "69",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "After dad reveal",
   "text": "He must have been a powerful person.",
   "backup": "",
   "notes": "Core — dad reveal, filed Scholar note"
  },
  {
   "id": "70",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "I would rather review what we saw than drink.",
   "backup": "",
   "notes": "Core — redirect to art"
  },
  {
   "id": "71",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "We can plan the next rooms from a table as well as from a camp.",
   "backup": "",
   "notes": "Core — downtime"
  },
  {
   "id": "72",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "A tavern is useful. It is not an answer.",
   "backup": "We can sit. We should not treat this as the work.",
   "notes": "Core — not lingering. Alternative opener; if another not-lingering line is already playing in this cascade, pass."
  },
  {
   "id": "73",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "They smile until the coin is gone. Remember that.",
   "backup": "",
   "notes": "Core — tavern contempt"
  },
  {
   "id": "74",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "Too many people talking. Keep your coin close.",
   "backup": "Watch your coin in this crowd.",
   "notes": "Core — tavern room"
  },
  {
   "id": "75",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "This place sells rest. I didn't come for that.",
   "backup": "I didn't come here to get comfortable.",
   "notes": "Core — not lingering. Recast so a cascade after 76 does not restate that the stop should be short (t1926u). Alternative opener; if another not-lingering line is already playing in this cascade, pass."
  },
  {
   "id": "76",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "We should not stay longer than we have to.",
   "backup": "A short stop. Then back to it.",
   "notes": "Core — not lingering. Alternative opener; if another not-lingering line is already playing in this cascade, pass."
  },
  {
   "id": "77",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "Warm room. Cold work still waiting outside.",
   "backup": "",
   "notes": "Core — downtime"
  },
  {
   "id": "78",
   "layer": "A",
   "speaker": "Any",
   "condition": "After dad reveal",
   "text": "Nobody here knows what we know. That is probably better.",
   "backup": "",
   "notes": "Core — dad reveal gravity"
  },
  {
   "id": "79",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "If we're stocking up, say what you need. I'll grab it.",
   "backup": "",
   "notes": "Core — downtime"
  },
  {
   "id": "80",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Bar tab",
   "text": "I'll smile at them. You handle the coin.",
   "backup": "",
   "notes": "Core — funny consequence backup"
  },
  {
   "id": "81",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Okay. What's the next move?",
   "backup": "Your call. I'm ready when you are.",
   "notes": "Core — not lingering. Recast so a cascade after 76 does not restate that the stop should be short (t1926u). Alternative opener; if another not-lingering line is already playing in this cascade, pass."
  },
  {
   "id": "82",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Tavern 4 first visit + Zone 3 cracked crystal seen",
   "text": "That piece is the connection. Something has given way, and it will not stay contained.",
   "backup": "I can place that piece now. Whatever failed there is still at work. It will not remain inside these walls.",
   "notes": "Core — tavern 4 split (t1953u). Voice draft. First visit only, so a crystal found after a team-died join cannot replay this opposite the locked Brunn version. Thoughts about the finding, not a picture description. Do not leak the dad reveal, dad hints, endings, or the letter. Speaker presence via speaker tag (t1931u)."
  },
  {
   "id": "83",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Tavern 4 first visit + Zone 3 cracked crystal missed",
   "text": "These pieces do not add up. A step is missing, and I cannot force the rest to meet.",
   "backup": "There is a gap in what we found. I cannot make a conclusion from this.",
   "notes": "Core — tavern 4 split (t1953u). Voice draft. First visit only, locked to whether the crystal had been seen at the join, not to a later find. Frustrated or confused. Do not name the skipped piece or leak the dad reveal, dad hints, endings, or the letter. Speaker presence via speaker tag (t1931u)."
  },
  {
   "id": "84",
   "layer": "A",
   "speaker": "Angry",
   "condition": "first join + Zone 3 cracked crystal seen",
   "text": "If this spreads, they can hide in here. I'm going with you.",
   "backup": "Somebody has to stop it. I'm not waiting for this room to grow a spine.",
   "notes": "Core — tavern 4 join reason, save-the-world version (t1953u). Recast so it can play without tavern 82 (t1926u flow). If 82 just played, this is the reply; if Scholar passed, it still states the join on its own. If this plays, do not also play tavern 48 in the same cascade (both are joins). Answers one speaker, not Mira and Sorrel together (t1934u). Do not leak the dad reveal, dad hints, endings, or the letter. Speaker presence via speaker tag (t1931u)."
  },
  {
   "id": "85",
   "layer": "A",
   "speaker": "Angry",
   "condition": "first join + Zone 3 cracked crystal missed",
   "text": "My team died to the golem. I ran. I won't do that again.",
   "backup": "The golem took them. I left. This time I finish it.",
   "notes": "Core — tavern 4 join reason, team-died version (t1953u). Voice draft on Scene's gates. His own reason; he does not pick up a save-the-world motive from Sorrel's confusion. If this plays, do not also play tavern 48 in the same cascade (both are joins). Do not leak the dad reveal, dad hints, endings, or the letter. Speaker presence via speaker tag (t1931u)."
  },
  {
   "id": "86",
   "layer": "A",
   "speaker": "Angry",
   "condition": "save-the-world join + already joined",
   "text": "I joined to stop this. Sitting through another round will not do that.",
   "backup": "The danger is not in this room. That is why I left my seat.",
   "notes": "Later reaction after he has joined, save-the-world version (t1953u). Voice draft. Second condition blocks a first-join cascade beside 84 or 48. Alternative opener with other save-the-world later lines; do not stack two of the same motive in one cascade. Do not leak the dad reveal, dad hints, endings, or the letter."
  }
 ],
 "post-combat": [
  {
   "id": "1",
   "layer": "A",
   "speaker": "Any",
   "condition": "Fight start",
   "text": "Here they come.",
   "backup": "They're on us.",
   "notes": "Core — fight start. Alternative opener; do not play two start lines in one cascade. No companion named."
  },
  {
   "id": "2",
   "layer": "A",
   "speaker": "Any",
   "condition": "Fight end",
   "text": "It's over. For now.",
   "backup": "They're down.",
   "notes": "Core — fight end. Alternative opener; do not play two end lines in one cascade. No companion named."
  },
  {
   "id": "3",
   "layer": "A",
   "speaker": "Any",
   "condition": "After fight",
   "text": "What now?",
   "backup": "Your call.",
   "notes": "Core — after-fight prompt. Neutral; does not pick a direction. No companion named. Opener only; if a direction-pull line is already playing in this cascade, pass."
  },
  {
   "id": "4",
   "layer": "A",
   "speaker": "Any",
   "condition": "Fight end",
   "text": "Breathe. Then we move.",
   "backup": "Give it a second. Then go.",
   "notes": "Core — fight end. Alternative opener to other end lines. No companion named."
  },
  {
   "id": "5",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Fight start + Quirky present",
   "text": "Okay. We got this.",
   "backup": "Stay with me.",
   "notes": "Core — fight start. Alternative opener. Makes light of danger without mocking anyone in it."
  },
  {
   "id": "6",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Fight start + Quirky present",
   "text": "Come on. Together.",
   "backup": "I got you. Let's go.",
   "notes": "Core — fight start. Alternative opener. Does not name another companion."
  },
  {
   "id": "7",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Fight start + Quirky present",
   "text": "Don't overthink it. Just move.",
   "backup": "Here we go.",
   "notes": "Core — fight start. Alternative opener."
  },
  {
   "id": "8",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Fight end + Quirky present",
   "text": "Still standing! See?",
   "backup": "Hey. We made it through.",
   "notes": "Core — fight end. Alternative opener."
  },
  {
   "id": "9",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Fight end + Quirky present",
   "text": "You in one piece?",
   "backup": "You okay?",
   "notes": "Core — fight end. Alternative opener. Question only; wait for Brunn to answer before Mira says Good enough. After 9, pick an Angry fight-end line (24 or 25), then allow a follow-up pick for 30 even though Quirky already spoke. Do not insert a third speaker between 9 and that answer. Speaks to the hero, not an absent companion."
  },
  {
   "id": "10",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "After fight + Quirky present",
   "text": "Hey. Rest first. We can be grim later.",
   "backup": "Sit down a second.",
   "notes": "Core — direction pull: rest / needle gloom. Alternative opener for this pull. Does not name another companion."
  },
  {
   "id": "11",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "After fight + Quirky present",
   "text": "Don't start the doom talk yet.",
   "backup": "Ease up. We just survived.",
   "notes": "Core — direction pull: needle gloom. Alternative opener for this pull."
  },
  {
   "id": "12",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "After fight + Quirky present",
   "text": "We should catch our breath before we go looking for more trouble.",
   "backup": "Rest. Then we decide.",
   "notes": "Core — direction pull: rest. Alternative opener for this pull."
  },
  {
   "id": "13",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "After fight + Quirky present",
   "text": "You're allowed to be tired. That wasn't nothing.",
   "backup": "Take a second. The maze can wait.",
   "notes": "Core — direction pull: rest / needle gloom. Alternative opener for this pull."
  },
  {
   "id": "14",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Fight start + Scholar present",
   "text": "Watch the sides.",
   "backup": "Stay aware of the room.",
   "notes": "Core — fight start. Alternative opener."
  },
  {
   "id": "15",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Fight start + Scholar present",
   "text": "Do not rush the first blow.",
   "backup": "Measure them first.",
   "notes": "Core — fight start. Alternative opener."
  },
  {
   "id": "16",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Fight end + Scholar present",
   "text": "They are down. Do not assume we are safe.",
   "backup": "The fight is finished. The danger is not.",
   "notes": "Core — fight end. Alternative opener."
  },
  {
   "id": "17",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Fight end + Scholar present",
   "text": "Check the room before you relax.",
   "backup": "Clear the space first.",
   "notes": "Core — fight end. Alternative opener."
  },
  {
   "id": "18",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "After fight + Scholar present",
   "text": "Chasing another fight will get us killed.",
   "backup": "Pursuing them further is how we die here.",
   "notes": "Core — direction pull: another fight will get us killed. Alternative opener for this pull. Does not name another companion."
  },
  {
   "id": "19",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "After fight + Scholar present",
   "text": "We should not look for another one.",
   "backup": "Another fight now would be a mistake.",
   "notes": "Core — direction pull: caution. Alternative opener for this pull."
  },
  {
   "id": "20",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "After fight + Scholar present",
   "text": "Going after another one will get us killed.",
   "backup": "We would not survive another round so soon.",
   "notes": "Core — direction pull: another fight will get us killed. Alternative opener for this pull."
  },
  {
   "id": "21",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "After fight + Scholar present",
   "text": "Caution will keep us alive. Another hunt will not.",
   "backup": "Survival first. Not another chase.",
   "notes": "Core — direction pull: caution. Alternative opener for this pull."
  },
  {
   "id": "22",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Fight start + Angry present",
   "text": "Hit them. Do not wait.",
   "backup": "Now.",
   "notes": "Core — fight start. Alternative opener."
  },
  {
   "id": "23",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Fight start + Angry present",
   "text": "No hesitation.",
   "backup": "End it.",
   "notes": "Core — fight start. Alternative opener."
  },
  {
   "id": "24",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Fight end + Angry present",
   "text": "Done. Check yourself.",
   "backup": "They're finished.",
   "notes": "Core — fight end. Alternative opener."
  },
  {
   "id": "25",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Fight end + Angry present",
   "text": "Up. The fight is over.",
   "backup": "On your feet. It's done.",
   "notes": "Core — fight end. Alternative opener."
  },
  {
   "id": "26",
   "layer": "A",
   "speaker": "Angry",
   "condition": "After fight + Angry present",
   "text": "We should kill another one.",
   "backup": "Go find the next one.",
   "notes": "Core — direction pull: kill another. Alternative opener for this pull. Does not name another companion."
  },
  {
   "id": "27",
   "layer": "A",
   "speaker": "Angry",
   "condition": "After fight + Angry present",
   "text": "Finish the rest of them before they come back.",
   "backup": "Do not let them regroup.",
   "notes": "Core — direction pull: kill another. Alternative opener for this pull."
  },
  {
   "id": "28",
   "layer": "A",
   "speaker": "Angry",
   "condition": "After fight + Angry present",
   "text": "There are more. Hunt them.",
   "backup": "Keep going. Kill another.",
   "notes": "Core — direction pull: kill another. Alternative opener for this pull."
  },
  {
   "id": "29",
   "layer": "A",
   "speaker": "Angry",
   "condition": "After fight + Angry present",
   "text": "Rest later. Another one first.",
   "backup": "We are not done until we find the next.",
   "notes": "Core — direction pull: kill another. Alternative opener for this pull."
  },
  {
   "id": "30",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Fight end + after Angry fight-end line",
   "text": "Good enough.",
   "backup": "Okay. We're okay.",
   "notes": "Core — fight end reply (Jeremy, dialogue team room). Plays after Brunn has answered; do not attach this to the question in the same line. Needs a follow-up pick after the Angry fight-end line, even if Quirky already used an earlier slot for 9. If Brunn is missing, pass. Speaks to the hero, not an absent companion."
  }
 ],
 "wall-art": [
  {
   "id": "1",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "This one’s in blood.",
   "backup": "He didn’t have time to clean it.",
   "notes": "Core (Jeremy t1905u example)"
  },
  {
   "id": "2",
   "layer": "B",
   "speaker": "Scholar",
   "condition": "Scholar present",
   "text": "The strokes are shaky.",
   "backup": "",
   "notes": "Insert (Jeremy t1905u example)"
  },
  {
   "id": "3",
   "layer": "B",
   "speaker": "Quirky",
   "condition": "Quirky present",
   "text": "Still prettier than the last camp.",
   "backup": "",
   "notes": "Insert (Jeremy t1905u example)"
  },
  {
   "id": "4",
   "layer": "C",
   "speaker": "Any",
   "condition": "High art count",
   "text": "…He was documenting it.",
   "backup": "",
   "notes": "Modifier (Jeremy t1905u example)"
  },
  {
   "id": "10",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 2",
   "text": "This one is all charcoal.",
   "backup": "He was still working it out.",
   "notes": "Core — zone 2 charcoal"
  },
  {
   "id": "11",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 3",
   "text": "He only used two tones here.",
   "backup": "The color stayed limited on purpose.",
   "notes": "Core — zone 3 two-tone"
  },
  {
   "id": "12",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 4",
   "text": "The color was put on in a hurry.",
   "backup": "The color never got a second pass.",
   "notes": "Core — zone 4 hasty color"
  },
  {
   "id": "13",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 5",
   "text": "This one is fully colored.",
   "backup": "He had time here, or he made time.",
   "notes": "Core — zone 5 vibrant"
  },
  {
   "id": "14",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "We found another one.",
   "backup": "Someone left another record.",
   "notes": "Core — new find"
  },
  {
   "id": "15",
   "layer": "C",
   "speaker": "Any",
   "condition": "High art count",
   "text": "The later ones keep answering the early ones.",
   "backup": "The early marks make more sense now.",
   "notes": "Modifier — moved from Layer A, high art count"
  },
  {
   "id": "16",
   "layer": "C",
   "speaker": "Any",
   "condition": "High puzzle count",
   "text": "The more we solve, the more of him we get.",
   "backup": "Each puzzle pays off in what we can see here.",
   "notes": "Modifier — moved from Layer A, high puzzle count"
  },
  {
   "id": "17",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 5 last two arts",
   "text": "This one is about more than the maze.",
   "backup": "It asks something the earlier ones did not.",
   "notes": "Core — dad-hint gravity; backup for t1925u"
  },
  {
   "id": "18",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "There is more of this than random marks.",
   "backup": "This one belongs with the others.",
   "notes": "Core — pattern, no trail leak"
  },
  {
   "id": "19",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Come on, let’s see what he left.",
   "backup": "",
   "notes": "Core — next thing"
  },
  {
   "id": "20",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Zone 1",
   "text": "Blood again. Okay. We’re still looking.",
   "backup": "",
   "notes": "Core — zone 1"
  },
  {
   "id": "21",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Zone 2",
   "text": "Charcoal now. He’s still figuring this place out.",
   "backup": "",
   "notes": "Core — zone 2"
  },
  {
   "id": "22",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Zone 3",
   "text": "Only two colors this time. He’s getting picky.",
   "backup": "",
   "notes": "Core — zone 3"
  },
  {
   "id": "23",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Zone 4",
   "text": "He slapped the color on and ran. Fair enough.",
   "backup": "",
   "notes": "Core — zone 4"
  },
  {
   "id": "24",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Zone 5",
   "text": "This one’s brighter. He took his time.",
   "backup": "",
   "notes": "Core — zone 5"
  },
  {
   "id": "25",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Don’t just stare. There’s more past this one.",
   "backup": "We've seen it. There's another one ahead.",
   "notes": "Core — redirect next"
  },
  {
   "id": "26",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "I don’t like how still this room feels.",
   "backup": "",
   "notes": "Core — room mood"
  },
  {
   "id": "27",
   "layer": "C",
   "speaker": "Quirky",
   "condition": "High art count",
   "text": "We’re finding a lot of him. Keep going.",
   "backup": "",
   "notes": "Modifier — moved from Layer A, high art count"
  },
  {
   "id": "28",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Zone 5 last two arts",
   "text": "Okay. Stay with this one. It matters.",
   "backup": "This one's different. Give it a minute.",
   "notes": "Core — dad-hint, no joke; backup for t1925u"
  },
  {
   "id": "29",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "Look at this one before we leave the room.",
   "backup": "Stay with this piece a moment before we go.",
   "notes": "Core — redirect to art"
  },
  {
   "id": "30",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 1",
   "text": "The blood was a material, not an accident.",
   "backup": "",
   "notes": "Core — zone 1"
  },
  {
   "id": "31",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 2",
   "text": "Charcoal, as if he were still mapping the problem.",
   "backup": "",
   "notes": "Core — zone 2"
  },
  {
   "id": "32",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 3",
   "text": "He limited himself to two tones. That choice is the point.",
   "backup": "",
   "notes": "Core — zone 3"
  },
  {
   "id": "33",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 4",
   "text": "The color here was added at speed.",
   "backup": "",
   "notes": "Core — zone 4"
  },
  {
   "id": "34",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 5",
   "text": "Full color. He stopped rationing it.",
   "backup": "",
   "notes": "Core — zone 5"
  },
  {
   "id": "35",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "This one is new to us. Stay with it.",
   "backup": "",
   "notes": "Core — new find"
  },
  {
   "id": "36",
   "layer": "C",
   "speaker": "Scholar",
   "condition": "High art count",
   "text": "Taken together, these are a sequence, not decoration.",
   "backup": "",
   "notes": "Modifier — moved from Layer A, high art count"
  },
  {
   "id": "37",
   "layer": "C",
   "speaker": "Scholar",
   "condition": "High puzzle count",
   "text": "Each solved room makes the next piece clearer.",
   "backup": "",
   "notes": "Modifier — moved from Layer A, high puzzle count"
  },
  {
   "id": "38",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 5 last two arts",
   "text": "The subject has changed. This is no longer only the maze.",
   "backup": "Read it as something besides a map of the rooms.",
   "notes": "Core — dad-hint; backup for t1925u"
  },
  {
   "id": "39",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "He left this on the wall. Read it.",
   "backup": "",
   "notes": "Core — job, no trail leak"
  },
  {
   "id": "40",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Zone 1",
   "text": "Blood. He didn’t hide what it cost.",
   "backup": "",
   "notes": "Core — zone 1"
  },
  {
   "id": "41",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Zone 2",
   "text": "Charcoal. He did not have it solved yet.",
   "backup": "",
   "notes": "Core — zone 2"
  },
  {
   "id": "42",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Zone 3",
   "text": "Two colors. He would not spend more.",
   "backup": "",
   "notes": "Core — zone 3"
  },
  {
   "id": "43",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Zone 4",
   "text": "Hurried color. He did not linger.",
   "backup": "",
   "notes": "Core — zone 4"
  },
  {
   "id": "44",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Zone 5",
   "text": "All this color and we are still not at the end of it.",
   "backup": "",
   "notes": "Core — zone 5, job"
  },
  {
   "id": "45",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "Stop guessing. Read what he left and move.",
   "backup": "",
   "notes": "Core — job"
  },
  {
   "id": "46",
   "layer": "C",
   "speaker": "Angry",
   "condition": "High art count",
   "text": "He documented all of it. We’re late.",
   "backup": "",
   "notes": "Modifier — moved from Layer A, high art count"
  },
  {
   "id": "47",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "People died before anyone finished looking.",
   "backup": "",
   "notes": "Core — grief as a hard statement"
  },
  {
   "id": "48",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Zone 5 last two arts",
   "text": "This is more than the maze.",
   "backup": "Do not look away from this one.",
   "notes": "Core — dad-hint, no name; Eve locked this wording. Do not flip again unless Eve or Jeremy sends new wording. Last two arts hint must not name the father."
  },
  {
   "id": "49",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Zone 1",
   "text": "Blood. He ran out of time.",
   "backup": "",
   "notes": "Core. Topic: Blood / rushed piece. Voice batch 1. Gated to zone 1 so it cannot fire on later looks."
  },
  {
   "id": "50",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Zone 4",
   "text": "He was rushing this one. Look. Then we should go further.",
   "backup": "",
   "notes": "Core. Topic: Hurried marks. Voice batch 1. Gated to zone 4 so it does not contradict careful zone-5 work."
  },
  {
   "id": "51",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 4",
   "text": "The marks lose control toward the edge.",
   "backup": "",
   "notes": "Core. Topic: Hurried marks. Voice batch 1. Gated to zone 4 so it does not contradict careful zone-5 work."
  },
  {
   "id": "52",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Zone 4",
   "text": "He hurried.",
   "backup": "",
   "notes": "Core. Topic: Hurried marks. Voice batch 1. Gated to zone 4 so it does not contradict careful zone-5 work."
  },
  {
   "id": "53",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Not zone 5",
   "text": "Nobody finished what they started.",
   "backup": "",
   "notes": "Core. Topic: Familiar pattern. Voice batch 1. Gated off zone 5 so it does not land on careful finished work."
  },
  {
   "id": "54",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 1",
   "text": "The earliest ones are the roughest.",
   "backup": "He was just starting here.",
   "notes": "Core — zone 1"
  },
  {
   "id": "55",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "Stay with this one a moment.",
   "backup": "Don’t walk past it yet.",
   "notes": "Core — attention"
  },
  {
   "id": "56",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 4",
   "text": "The haste here feels heavier.",
   "backup": "He was not taking his time anymore.",
   "notes": "Core — zone 4, serious tone"
  },
  {
   "id": "57",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 5",
   "text": "This one was made with care.",
   "backup": "He gave this one time.",
   "notes": "Core — zone 5"
  },
  {
   "id": "58",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "Another mark. We should not rush past it.",
   "backup": "",
   "notes": "Core — new find"
  },
  {
   "id": "59",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 2",
   "text": "He was still trying to understand the place.",
   "backup": "The place was still a question to him.",
   "notes": "Core — zone 2"
  },
  {
   "id": "60",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 3",
   "text": "He kept to a small set of colors.",
   "backup": "Two tones, used with care.",
   "notes": "Core — zone 3"
  },
  {
   "id": "61",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 5 last two arts",
   "text": "This one asks more of us than the others.",
   "backup": "We should not treat this like the others.",
   "notes": "Core — dad-hint, no name; backup for t1925u"
  },
  {
   "id": "62",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "This one is worth stopping for.",
   "backup": "Take a second look.",
   "notes": "Core — attention"
  },
  {
   "id": "63",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 1",
   "text": "This one is raw.",
   "backup": "He had not settled how to make these yet.",
   "notes": "Core — zone 1"
  },
  {
   "id": "64",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 4",
   "text": "He hurried, and the work shows it.",
   "backup": "No extra pass, no extra time.",
   "notes": "Core — zone 4"
  },
  {
   "id": "65",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 5",
   "text": "The later color is fuller than anything before it.",
   "backup": "He was no longer saving it.",
   "notes": "Core — zone 5"
  },
  {
   "id": "66",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "This is someone determined.",
   "backup": "",
   "notes": "Core — filed Scholar hint"
  },
  {
   "id": "67",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 1",
   "text": "Even the first pieces were made with intent.",
   "backup": "",
   "notes": "Core — zone 1"
  },
  {
   "id": "68",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 2",
   "text": "He was trying to work out the maze itself.",
   "backup": "",
   "notes": "Core — zone 2"
  },
  {
   "id": "69",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 3",
   "text": "The limited color is a decision, not a lack of skill.",
   "backup": "",
   "notes": "Core — zone 3"
  },
  {
   "id": "70",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 4",
   "text": "Speed changed the work here. Stay with it.",
   "backup": "",
   "notes": "Core — zone 4, serious tone"
  },
  {
   "id": "71",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 5",
   "text": "He finally had enough time to be precise.",
   "backup": "",
   "notes": "Core — zone 5"
  },
  {
   "id": "72",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "Give this one your full attention.",
   "backup": "Look here first. Then we can move.",
   "notes": "Core — redirect to art"
  },
  {
   "id": "73",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 5 last two arts",
   "text": "Look again. This one is doing different work.",
   "backup": "The work here is of another kind.",
   "notes": "Core — dad-hint, no name; backup for t1925u"
  },
  {
   "id": "74",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "The pressure in the marks changes as it goes.",
   "backup": "He pressed harder in some places than others.",
   "notes": "Core — observing marks"
  },
  {
   "id": "75",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 1",
   "text": "The blood has soaked into the grain.",
   "backup": "It dried there before anyone wiped it away.",
   "notes": "Core — zone 1"
  },
  {
   "id": "76",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 2",
   "text": "The charcoal smears where a hand must have passed.",
   "backup": "It still looks like he was thinking with it.",
   "notes": "Core — zone 2"
  },
  {
   "id": "77",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 3",
   "text": "You can see where one tone stops and the other starts.",
   "backup": "He did not blend them.",
   "notes": "Core — zone 3"
  },
  {
   "id": "78",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 4",
   "text": "The strokes do not settle. They just stop.",
   "backup": "",
   "notes": "Core — zone 4, serious tone"
  },
  {
   "id": "79",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 5",
   "text": "Every part of this one has color on it.",
   "backup": "He did not leave the edges plain.",
   "notes": "Core — zone 5"
  },
  {
   "id": "80",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "These marks were made by a careful hand, even when they look rough.",
   "backup": "",
   "notes": "Core — observing marks"
  },
  {
   "id": "81",
   "layer": "A",
   "speaker": "Any",
   "condition": "None",
   "text": "The wall still holds the dust from the work.",
   "backup": "",
   "notes": "Core — observing marks"
  },
  {
   "id": "82",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 5 last two arts",
   "text": "Stay with this one longer than the others.",
   "backup": "Give this piece more time than you gave the last.",
   "notes": "Core — dad-hint gravity; backup for t1925u"
  },
  {
   "id": "83",
   "layer": "A",
   "speaker": "Any",
   "condition": "Zone 2",
   "text": "The lines wander, then correct themselves.",
   "backup": "He was finding his way as he drew.",
   "notes": "Core — zone 2"
  },
  {
   "id": "84",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "Notice how the marks change from one stretch to the next.",
   "backup": "",
   "notes": "Core — observing marks"
  },
  {
   "id": "85",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 1",
   "text": "Blood leaves a different edge than paint would.",
   "backup": "",
   "notes": "Core — zone 1"
  },
  {
   "id": "86",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 2",
   "text": "Charcoal records hesitation as clearly as a line.",
   "backup": "",
   "notes": "Core — zone 2"
  },
  {
   "id": "87",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 3",
   "text": "Two tones force you to read the structure, not the hue.",
   "backup": "",
   "notes": "Core — zone 3"
  },
  {
   "id": "88",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 4",
   "text": "Haste is visible in the width of the strokes.",
   "backup": "",
   "notes": "Core — zone 4, serious tone"
  },
  {
   "id": "89",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 5",
   "text": "The color is laid in with patience here.",
   "backup": "",
   "notes": "Core — zone 5"
  },
  {
   "id": "90",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "It has something to do with the center.",
   "backup": "",
   "notes": "Core — filed Scholar hint"
  },
  {
   "id": "91",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "None",
   "text": "Silence is fine. Look first.",
   "backup": "We can talk after we look.",
   "notes": "Core — redirect to art"
  },
  {
   "id": "92",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 5 last two arts",
   "text": "This one belongs to a different kind of memory.",
   "backup": "Hold this one in mind. It is not like the maze pieces.",
   "notes": "Core — dad-hint; backup for t1925u"
  },
  {
   "id": "93",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "Zone 1",
   "text": "He chose a hard material to start with.",
   "backup": "",
   "notes": "Core — zone 1"
  },
  {
   "id": "94",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "Hey. This one's trying to tell us something.",
   "backup": "",
   "notes": "Core — attention"
  },
  {
   "id": "95",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Zone 1",
   "text": "Okay, that's rough work. I'm still looking.",
   "backup": "",
   "notes": "Core — zone 1"
  },
  {
   "id": "96",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Zone 2",
   "text": "Charcoal on the fingers. He was in it.",
   "backup": "",
   "notes": "Core — zone 2"
  },
  {
   "id": "97",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Zone 3",
   "text": "Two tones again. He's sticking to the plan.",
   "backup": "",
   "notes": "Core — zone 3"
  },
  {
   "id": "98",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Zone 4",
   "text": "He didn't clean these strokes up. That's the point, I think.",
   "backup": "",
   "notes": "Core — zone 4, serious tone"
  },
  {
   "id": "99",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "Zone 5",
   "text": "All this color. Don't rush past it.",
   "backup": "",
   "notes": "Core — zone 5"
  },
  {
   "id": "100",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "None",
   "text": "C'mon, one more look, then we go.",
   "backup": "One more glance, then we keep going.",
   "notes": "Core — redirect next"
  },
  {
   "id": "101",
   "layer": "A",
   "speaker": "Angry",
   "condition": "None",
   "text": "The wall does not lie. Read it.",
   "backup": "",
   "notes": "Core — observing marks"
  },
  {
   "id": "102",
   "layer": "A",
   "speaker": "Angry",
   "condition": "Zone 5",
   "text": "He spent the color. Do not skip it.",
   "backup": "",
   "notes": "Core — zone 5"
  }
 ],
 "letter": [
  {
   "id": "1",
   "layer": "A",
   "speaker": "Any",
   "condition": "letter warning",
   "text": "This is a warning. That thing guarding the crystal will not stand down.",
   "backup": "Whoever wrote this left a warning about the golem. Nothing else is clear.",
   "notes": "Core — warning reading (t1956u/t1959u). Opener-only; if a character line for this reading is already playing, pass. Do not name the dad."
  },
  {
   "id": "2",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "letter warning",
   "text": "That's a lot to read right before we walk in. I'm still going if you are.",
   "backup": "Turn back or end it. That's a hard choice to leave on a page.",
   "notes": "Core — warning reading (t1956u/t1959u). Recast so it does not restate Any 1's “will not stand down” (t1926u). Comfort and willingness to go on, not another warning about the golem. Do not name the dad."
  },
  {
   "id": "3",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "letter warning",
   "text": "Treat this as instruction. Something is leaking, and the guard has a single command.",
   "backup": "The warning is practical. Something is leaking, and this is what was left to contain it.",
   "notes": "Core — warning reading (t1956u/t1959u). Recast so it does not restate Any 1's “will not stop” or Angry 4's “does not know why” (t1926u). Reacts to the note without connecting it to unearned wall-art keys. Do not name the dad."
  },
  {
   "id": "4",
   "layer": "A",
   "speaker": "Angry",
   "condition": "letter warning",
   "text": "It doesn't know why it stands there. My team died to that. To an order.",
   "backup": "A command killed them. It never even understood it.",
   "notes": "Core — warning reading (t1956u/t1959u). Voice draft on Scene's gates. Death-ending understanding always has team-died Brunn. Grief about his team, not a save-the-world motive. Do not name the dad or another companion."
  },
  {
   "id": "5",
   "layer": "A",
   "speaker": "Any",
   "condition": "letter half-confession",
   "text": "Someone tried to stop what broke. This is how little it helped.",
   "backup": "The note names the failure. It does not name the reason.",
   "notes": "Core — half-confession reading (t1956u/t1959u). Opener-only; if a character line for this reading is already playing, pass. Do not name the dad. Works with either Brunn version."
  },
  {
   "id": "6",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "letter half-confession",
   "text": "I'm glad we read it, and I hate what it asks.",
   "backup": "Whoever wrote this sounded stuck. That's heavy.",
   "notes": "Core — half-confession (t1956u/t1959u). Recast so it does not restate Any 5's tried-and-failed or Scholar 7's guardian (t1926u). Feeling about the note, not another account of the failure. Do not name the dad."
  },
  {
   "id": "7",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "letter half-confession",
   "text": "This is a record of a failed sealing. The writer remained after the others fled, then made a guardian when the work would not close.",
   "backup": "Someone attempted a repair and could not finish it. The golem is the substitute, not the cause.",
   "notes": "Core — half-confession (t1956u/t1959u). Voice draft on Scene's gates. Connects the note to earlier findings without describing pictures or naming the dad."
  },
  {
   "id": "8",
   "layer": "A",
   "speaker": "Angry",
   "condition": "letter half-confession + save-the-world join",
   "text": "What's leaking still has to be stopped. We end this.",
   "backup": "I did not come this far to turn back because a note said so.",
   "notes": "Core — half-confession, save-the-world Brunn only (t1956u/t1959u). Recast so it does not restate Scholar 7's failed seal (t1926u). New beat is the motive to stop what is still leaking. Do not play with row 9. Do not name the dad."
  },
  {
   "id": "9",
   "layer": "A",
   "speaker": "Angry",
   "condition": "letter half-confession + team-died join",
   "text": "My team walked into that order. That's what took them.",
   "backup": "My people still died to it.",
   "notes": "Core — half-confession, team-died Brunn only (t1956u/t1959u). Recast so it does not restate Scholar 7's built-a-guard-because-they-failed (t1926u). New beat is the cost to his team. Do not play with row 8. Do not name the dad or another companion."
  },
  {
   "id": "10",
   "layer": "A",
   "speaker": "Any",
   "condition": "letter apology",
   "text": "This was meant for you. He is telling you what he left in that room.",
   "backup": "The warning was never only about the golem.",
   "notes": "Core — apology reading (t1956u/t1959u, full-fix keys). Opener-only; if a character line for this reading is already playing, pass."
  },
  {
   "id": "11",
   "layer": "A",
   "speaker": "Quirky",
   "condition": "letter apology",
   "text": "That's your dad. He tried, and it still cost him. I'm right here, okay?",
   "backup": "Hey. This was him asking you to turn back or finish it. You don't have to carry that alone.",
   "notes": "Core — apology reading (t1956u/t1959u). Voice draft on Scene's gates. Comfort for the hero after the dad connection is earned. Does not describe the note's drawing."
  },
  {
   "id": "12",
   "layer": "A",
   "speaker": "Scholar",
   "condition": "letter apology",
   "text": "The later pieces and this note are the same account. Your father stayed when the others ran, and this is what that choice left behind.",
   "backup": "He could not close what broke. This page is the last piece of that same record.",
   "notes": "Core — apology reading (t1956u/t1959u). Voice draft on Scene's gates. The party knows it was the hero's dad, why he did it, and what it cost. Thoughts about findings, not picture descriptions. Do not recast Tavern 69."
  },
  {
   "id": "13",
   "layer": "A",
   "speaker": "Angry",
   "condition": "letter apology",
   "text": "Your father built that golem. We're ending what he left. That's not on you.",
   "backup": "He wrote the order. We end it. I don't blame you for him.",
   "notes": "Core — apology reading (t1956u/t1959u). Voice draft on Scene's gates. Full-fix always has save-the-world Brunn. Angry at the dad, not the son."
  }
 ]
};root.PACKAGE_POOLS=data;if(typeof module!=="undefined")module.exports=data;})(typeof window!=="undefined"?window:globalThis);
