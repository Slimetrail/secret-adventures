/* t2194u: old t2103u diary/wall-margin strings stay emptied; they are NOT the everyday filler.
   Everyday pages wait on Dialogue's style-and-facts rule (story-journal-split.js); named companion/dad pages stay held until Eve hands text. */
(function(){'use strict';const text=window.T2103U_TEXT;if(text){text.journal={};text.wall={};}
if(window.SOTA&&SOTA.rpg&&SOTA.rpg.s6){SOTA.rpg.s6.journalWritingHeld=true;SOTA.rpg.s6.journalHold={everyday:'pending-style-and-facts-rule',handwritten:'held-until-eve'};}
// No writing hook here. The only writer is the camp hook in story-journal-split.js. None at taverns or movement.
})();
