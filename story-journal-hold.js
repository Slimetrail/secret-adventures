/* t2194u: t2103u wall-margin strings stay emptied. Of the t2103u journal key-moments, only the IDs replaced by Eve's
   approved t2194u handwritten pages are cleared (J-join-mira, J-join-sorrel, J-join-brunn and its #A/#B keys, J-picnic-reveal),
   so old and new pages never stack. Every other key-moment ID stays as it is. Handwritten pages are installed, not held. */
(function(){'use strict';const REPLACED=/^(J-join-(mira|sorrel|brunn)|J-picnic-reveal)(#.*)?$/;const text=window.T2103U_TEXT;
if(text){text.wall={};const j=text.journal||{};Object.keys(j).forEach(k=>{if(REPLACED.test(k))delete j[k];});}
if(window.SOTA&&SOTA.rpg&&SOTA.rpg.s6){SOTA.rpg.s6.journalHold={replaced:['J-join-mira','J-join-sorrel','J-join-brunn','J-picnic-reveal'],handwritten:'installed-t2194u'};}
// No writing hook here. The only writer is the camp hook in story-journal-split.js. None at taverns or movement.
})();
