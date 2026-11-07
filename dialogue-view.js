/* Local sample-only dialogue view (t2065u). Not story-data.js; not pools. */
(function(){
var TALKS={
painting:{title:"Looking at a painting",lines:[
["Mira","You always look at these like the wall is about to give you a quiz."],
["Sorrel","This one is interesting. The pressure in the marks changes toward the edge."],
["Mira","There it is. The tutor voice. I'm looking, okay?"],
["Sorrel","Good. I am not repeating it."]]},
tavern:{title:"At the tavern",lines:[
["Brunn","Don't think too hard. You will hurt yourself."],
["Mira","I'm not dumb. You just like saying that."],
["Brunn","Then stop giving me reasons."],
["Mira","I sat down. That's not a reason. That's sitting."]]},
closecall:{title:"After a close call",lines:[
["Mira","That was close. I'm fine! You're fine. We're fine."],
["Sorrel","Then sit down before you say it a fourth time."],
["Mira","I am sitting. That's what fine looks like."]]}};
var ORDER=["painting","tavern","closecall"];
if(typeof module!=="undefined"){module.exports={TALKS:TALKS,ORDER:ORDER};return;}
var css="#dvbtn{position:fixed;right:8px;top:8px;z-index:9000;padding:6px 10px;border:2px solid #2b1a0e;border-radius:9px 12px 8px 11px;background:radial-gradient(circle at 40% 35%,#efe0b8,#cdb07a);color:#2b1a0e;font:700 13px Georgia,serif;opacity:.85}"+
"#dv{display:none;position:fixed;inset:0;z-index:9500;background:rgba(10,6,20,.72);font-family:Georgia,serif}#dv.open{display:block}"+
"#dvbox{position:absolute;left:50%;bottom:6%;transform:translateX(-50%);width:min(440px,92vw);padding:14px 16px 16px;border:3px solid #2b1a0e;border-radius:10px 14px 9px 12px;background:radial-gradient(circle at 40% 35%,#efe0b8,#cdb07a);color:#2b1a0e;box-shadow:0 6px 30px rgba(0,0,0,.6)}"+
"#dvt{font:13px Georgia,serif;letter-spacing:.04em;opacity:.75;text-align:center;margin-bottom:8px}"+
"#dvsp{display:flex;justify-content:space-between;gap:8px;margin-bottom:10px}.dvn{flex:1;padding:5px 8px;border:2px solid #2b1a0e;border-radius:8px;background:#2b1a0e;color:#f3e2b5;font:700 16px Georgia,serif;text-align:center;opacity:.4}.dvn.on{opacity:1;color:#f3e2b5;box-shadow:0 0 0 2px #cdb7ff}"+
"#dvl{min-height:4.2em;font:19px/1.4 Georgia,serif}#dvwho{font:700 15px Georgia,serif;margin-bottom:4px}#dvc{font-size:12px;opacity:.6;text-align:right;margin-top:4px}"+
"#dvctl{display:flex;gap:8px;justify-content:center;margin-top:12px}#dvctl button,#dvpick button{min-height:46px;padding:0 14px;border:2px solid #2b1a0e;border-radius:12px 9px 13px 8px;background:#2b1a0e;color:#f3e2b5;font:700 17px Georgia,serif}"+
"#dvpick{display:flex;flex-direction:column;gap:10px}#dvpick h3{margin:0 0 4px;text-align:center;font:700 20px Georgia,serif}";
var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
var ov=document.createElement("div");ov.id="dv";ov.innerHTML='<div id="dvbox"></div>';document.body.appendChild(ov);
var b=document.createElement("button");b.id="dvbtn";b.textContent="Sample talks";b.onclick=function(e){e.stopPropagation();picker()};document.body.appendChild(b);
var box=ov.querySelector("#dvbox");
function esc(s){s=window.CompanionDisplay?window.CompanionDisplay.rewrite(s):s;return s.replace(/&/g,"&amp;").replace(/</g,"&lt;")}
function close(){if(window.DialogueArt)window.DialogueArt.clear(ov);ov.classList.remove("open");if(/sample-talk/.test(location.hash))history.replaceState(null,"",location.pathname+location.search)}
function picker(){if(window.DialogueArt)window.DialogueArt.clear(ov);ov.classList.add("open");
box.innerHTML='<div id="dvpick"><h3>Sample talks</h3>'+ORDER.map(function(k){return '<button data-k="'+k+'">'+TALKS[k].title+'</button>'}).join("")+'<button data-k="x" style="background:#6b5233">Close</button></div>';
box.querySelectorAll("button").forEach(function(x){x.onclick=function(e){e.stopPropagation();var k=x.getAttribute("data-k");k==="x"?close():play(k)}})}
function play(k){var t=TALKS[k];if(!t)return picker();var sp=[];t.lines.forEach(function(l){if(sp.indexOf(l[0])<0)sp.push(l[0])});sp=sp.slice(0,2);var i=0;ov.classList.add("open");
function draw(){var l=t.lines[i],last=i===t.lines.length-1;
if(window.DialogueArt)window.DialogueArt.render(ov,k,i,l[1]);
box.innerHTML='<div id="dvt">'+esc(t.title)+'</div><div id="dvsp">'+sp.map(function(n){return '<div class="dvn'+(n===l[0]?' on':'')+'">'+esc(n)+'</div>'}).join("")+'</div><div id="dvwho">'+esc(l[0])+'</div><div id="dvl">\u201C'+esc(l[1])+'\u201D</div><div id="dvc">'+(i+1)+' / '+t.lines.length+'</div><div id="dvctl">'+(last?'<button id="dvback">Sample talks</button><button id="dvx">Close</button>':'<button id="dvgo">Continue</button>')+'</div>';
var g=box.querySelector("#dvgo");if(g)g.onclick=function(e){e.stopPropagation();i++;draw()};
var bk=box.querySelector("#dvback");if(bk)bk.onclick=function(e){e.stopPropagation();picker()};
var x=box.querySelector("#dvx");if(x)x.onclick=function(e){e.stopPropagation();close()};}
box.onclick=function(e){if(e.target.tagName!=="BUTTON"&&i<t.lines.length-1){i++;draw()}};draw()}
function fromHash(){var h=location.hash,m=h.match(/sample-talk=(\w+)/);if(m)play(m[1]);else if(/sample-talks/.test(h))picker()}
window.SampleTalks={open:play,picker:picker,close:close};
window.addEventListener("hashchange",fromHash);
if(document.readyState==="complete")setTimeout(fromHash,300);else window.addEventListener("load",function(){setTimeout(fromHash,300)});
})();
