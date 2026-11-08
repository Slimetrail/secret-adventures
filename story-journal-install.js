/* t2194u install glue (local only): loads Eve-approved handwritten pages (story-journal-pages.js) into the nine slots and
   installs the everyday generator rule (story-journal-generator.js). Brunn's join page keeps both variants; writeAt picks
   A (story.brunnJoin==='save') or B once and freezes it. Loaded after story-journal-split.js. No hooks of its own. */
(function(root){'use strict';const J=root.StoryJournalSplit,P=root.StoryJournalPages,G=root.StoryJournalGenerator;if(!J||!P||!G)return;const p=P.pages;
const C={Mira:'mira',Sorrel:'sorrel',Brunn:'brunn'};
function install(){Object.keys(C).forEach(c=>{J.installPage('companion-first-meet',p['J-join-'+C[c]],c);J.installPage('companion-a-while',p['J-awhile-'+C[c]],c);J.installPage('companion-growing',p['J-grow-'+C[c]],c);});
 [['party-more-family-than-dad','J-party-family'],['dad-shame-reveal','J-shame-dad'],['picnic-warm','J-picnic-reveal'],['bedside-before-picnic-hate','J-bedside-hate'],['zone5-mystery','J-zone5-mystery'],['zone5-stitch','J-zone5-stitch']].forEach(([k,id])=>J.installPage(k,p[id]));
 J.installRule(G.RULE);const S=root.SOTA;if(S&&S.rpg&&S.rpg.s6)S.rpg.s6.journalWritingHeld=false;return J.status();}
root.StoryJournalInstall={install};install();if(typeof module!=='undefined')module.exports=root.StoryJournalInstall;
})(typeof window!=='undefined'?window:globalThis);
