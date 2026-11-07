/* t2076u compositor. No story wrappers: the existing sequential selector supplies
   a backdrop marker through story's normal options. Observe its current line. */
(function(root){"use strict";
const lines=typeof module!=="undefined"&&module.exports?require("./dialogue-art-data.js"):root.DialogueArtData;
const talks={};lines.forEach(l=>(talks[l.talkId]||(talks[l.talkId]=[])).push(l));
function frame(id,index,text){const l=talks[id]&&talks[id][index];return l&&(text===undefined||l.lineText===text)?l:null;}
function sceneOptions(t,opt){const art=talks[t.id];if(!art||t.lines.length!==art.length||!t.lines.every((l,i)=>l[2]===art[i].lineText))return opt;
 return Object.assign({},opt,{bg:"art-dialogue/"+art[0].backdrop});}
const api={frame,sceneOptions};
if(typeof module!=="undefined"&&module.exports){module.exports=api;return;}
const style=document.createElement("style");style.textContent=`
.da-stage{position:absolute;inset:0;overflow:hidden;pointer-events:none;isolation:isolate;background:#100c17 center/cover no-repeat}
.da-stage:after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 55%,rgba(8,5,14,.5))}
.da-person{position:absolute;bottom:0;height:92%;aspect-ratio:var(--ratio);overflow:hidden;filter:drop-shadow(0 5px 8px #100b18);z-index:1}
.da-person.left{left:0}.da-person.right{right:0}
.da-person img{position:absolute;max-width:none;pointer-events:none}
.da-active .s6pf,html.da-sample .s6pf{display:none!important}
.da-active .s6bg,.da-active .s6wall{visibility:hidden!important}
.da-active .s6box{z-index:3;left:23%;right:23%;bottom:7%;}
.da-active .s6t{font-size:clamp(16px,2.2vw,22px);min-height:4.2em;box-shadow:0 5px 25px #000b}
#dv.da-active #dvbox{z-index:3;width:50%;max-width:700px;bottom:6%;box-sizing:border-box}
#dv.da-active #dvsp{display:none}
@media(orientation:portrait){
 .da-person{height:min(65vh,95vw);bottom:25%;}.da-person.left{left:-4%}.da-person.right{right:-4%}
 #s6d.da-active .da-person{height:min(72vh,110vw);bottom:15%}
 .da-active .s6box{left:5%;right:5%;bottom:5%}
 #dv.da-active #dvbox{width:90%;bottom:4%;padding:12px}
 #dv.da-active #dvl{font-size:18px;min-height:4.2em}
}
@media(max-height:480px) and (orientation:landscape){
 .da-active .s6box{left:24%;right:24%;bottom:4%}.da-active .s6t{font-size:16px;min-height:3em;padding:8px 10px 16px}
 #dv.da-active #dvbox{width:52%;bottom:3%;padding:8px 12px}
 #dv.da-active #dvt{display:none}#dv.da-active #dvl{font-size:16px;min-height:3em}#dv.da-active #dvctl{margin-top:6px}#dv.da-active #dvctl button{min-height:34px;font-size:15px}
}`;document.head.appendChild(style);
function clear(host){if(host.classList.contains("da-active"))host.classList.remove("da-active");const stage=host.querySelector(".da-stage");if(stage)stage.remove();if(host.id==="dv")document.documentElement.classList.remove("da-sample");}
function render(host,id,index,text){const l=frame(id,index,text);if(!l){clear(host);return false;}
 let stage=host.querySelector(".da-stage");if(!stage){stage=document.createElement("div");stage.className="da-stage";stage.setAttribute("aria-hidden","true");host.prepend(stage);}
 if(!host.classList.contains("da-active"))host.classList.add("da-active");if(host.id==="dv")document.documentElement.classList.add("da-sample");
 const key=id+":"+index;if(stage.dataset.frame===key)return true;
 stage.dataset.frame=key;stage.style.backgroundImage='url("art-dialogue/'+l.backdrop+'")';stage.replaceChildren();
 ["left","right"].forEach(side=>{const name=l[side],crop=l.crops[name],w=crop[2]-crop[0],h=crop[3]-crop[1];
  const person=document.createElement("div");person.className="da-person "+side;person.dataset.character=name;person.style.setProperty("--ratio",w+" / "+h);
  const img=document.createElement("img");img.alt="";img.src="art-dialogue/"+l.portraits[name];img.style.cssText="width:"+(1024/w*100)+"%;height:"+(1536/h*100)+"%;left:"+(-crop[0]/w*100)+"%;top:"+(-crop[1]/h*100)+"%";person.appendChild(img);stage.appendChild(person);
 });
 // Decode the next line's pair ahead of the next advance; all stay local/offline.
 const next=frame(id,index+1);if(next)[...Object.values(next.portraits),next.backdrop].forEach(p=>{const im=new Image();im.src="art-dialogue/"+p;});return true;
}
function sync(){const host=document.getElementById("s6d");if(!host)return;
 const bg=host.querySelector(".s6bg"),match=bg&&bg.style.backgroundImage.match(/art-dialogue\/([CA][1-6])\/backdrop\.webp/);
 if(host.classList.contains("on")&&match&&/^(camp|after-fight)$/.test(host.dataset.scene))render(host,match[1],+host.dataset.line);else clear(host);
}
const observer=new MutationObserver(ms=>{if(ms.some(m=>m.target.id==="s6d"||m.target.classList&&m.target.classList.contains("s6bg")||[...m.addedNodes].some(n=>n.id==="s6d")))sync();});
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","style","data-line","data-scene"]});
Object.assign(api,{render,clear});root.DialogueArt=api;
})(typeof window!=="undefined"?window:globalThis);
