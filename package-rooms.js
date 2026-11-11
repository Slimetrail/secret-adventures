/* Room IDs remain fixed. Extra room conversations never replace source pool rows. */
(function(root){'use strict';
function lines(id,pc,s,rooms,who,brunnVer){const meta=rooms[id];if(!meta)return [];
 const m=/zone(\d)-(\d+)/.exec(meta[1]);if(!m)return [];const z=+m[1],num=m[2],fresh=!s.walls[id],heard=s.wallHeard&&s.wallHeard[id]||'',newcomers=[...pc].filter(c=>!heard.includes(c));
 const previous=Object.keys(rooms).filter(k=>rooms[k][1].startsWith('zone'+(z-1)+'-'));
 const complete=previous.length>0&&previous.every(k=>s.walls[k]);
 let suffixes=[];if(z<=2){if(!pc&&fresh)suffixes=['H'];if(who('Q')&&(fresh||newcomers.includes('Q')))suffixes.push('M');if(who('S')&&(fresh||newcomers.includes('S')))suffixes.push('S');if(who('A')&&(fresh||newcomers.includes('A')))suffixes.push(brunnVer()==='save'?'BS':'BR');}
 else if(z<5){if(!pc&&fresh)suffixes=['H'];if(who('Q')&&!who('S')&&(fresh||newcomers.includes('Q')))suffixes.push('M');if(who('S')&&(fresh||newcomers.includes('S')))suffixes.push(complete?'S':'SF');if(who('A')&&(fresh||newcomers.includes('A')))suffixes.push(brunnVer()==='save'?'BS':'BR');}
 else{if(!pc&&fresh)suffixes=['H'];else if(who('A')&&who('Q')&&who('S'))suffixes=[brunnVer()==='save'?'BS':'BR'];else if(who('S')&&!who('A'))suffixes=[complete?'S':'SF'];else if(who('Q')&&!who('S'))suffixes=['M'];}
 let piece=num;
 if(z===5&&num==='08'&&s.walls[84]&&(!s.order||!s.order.includes(80)||s.order.indexOf(84)<s.order.indexOf(80))) piece+='p';
 if(z===5&&num==='09'&&s.walls[80]&&s.order&&s.order.indexOf(80)<(s.order.includes(84)?s.order.indexOf(84):Infinity)) piece+='p';
 const rows=root.PACKAGE_STORY.art,output=[];for(const suf of suffixes){const t=rows.find(t=>t.id===`AR${z}-${piece}-${suf}`);if(t&&t.lines.every(l=>l[0]==='H'||who(l[0])))output.push(...(root.Variety&&root.Variety.arPiece&&z<5?root.Variety.arPiece(t.id,t.lines,s,id):t.lines));/* t2675u: presence-talk variant (one pick per room; zone 5 stays static) */}return output;}
root.PackageRooms={lines};if(typeof module!=='undefined')module.exports={lines};
})(typeof window!=='undefined'?window:globalThis);
