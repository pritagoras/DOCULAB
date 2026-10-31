(() => {
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let sections=[],title="";
const templates=()=>{try{return JSON.parse(localStorage.getItem("doculab_templates")||"[]")}catch{return []}};
function activeModel(){const id=$("#studioModel")?.value;return (window.DOCULAB_GET_MODEL&&window.DOCULAB_GET_MODEL(id))||templates().find(x=>x.id===id)||null}
function notify(message){const t=$("#toast");if(t){t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}}
function source(){return $("#sourceText")?.value||""}
function build(){
 const model=activeModel();let comps=(model?.components||[]).filter(c=>c.enabled!==false).sort((a,b)=>(a.order??0)-(b.order??0));
 if(!comps.length&&model?.structure)comps=String(model.structure).split(";").map((name,i)=>({id:"section-"+i,title:name.trim(),instruction:"Desarrollar esta sección con precisión y coherencia.",enabled:true,order:i})).filter(c=>c.title);
 if(!comps.length){notify("Este modelo no tiene componentes configurados.");return}
 title=$("#docTitle").value.trim()||model.name||"Documento sin título";
 sections=comps.map((c,i)=>({id:c.id||"section-"+i,title:c.title||"Sección "+(i+1),instruction:c.instruction||"",content:""}));
 renderEditor();$("#structuredEditor").classList.remove("hidden");$("#documentOutput").classList.add("hidden");
 $("#studioStatus").textContent="Editor por secciones creado. Cada campo es independiente del modelo original.";
}
function renderEditor(){
 const host=$("#sectionEditors");
 host.innerHTML=sections.map((s,i)=>'<section class="editable-section" data-section="'+i+'"><div class="editable-section-head"><div><span class="section-number">'+String(i+1).padStart(2,"0")+'</span><b>'+esc(s.title)+'</b></div><button class="button secondary small" data-generate="'+i+'">Generar sección con IA</button></div>'+(s.instruction?'<p class="section-instruction">'+esc(s.instruction)+'</p>':'')+'<textarea data-content="'+i+'" rows="7" placeholder="Escribí o pegá el contenido de '+esc(s.title.toLowerCase())+'...">'+esc(s.content)+'</textarea></section>').join("");
 renderPreview();
}
function renderPreview(){
 const host=$("#documentLivePreview");if(!host)return;
 let html='<article class="print-document"><header class="print-cover"><div class="print-kicker">DOCULAB · DOCUMENTO</div><h1>'+esc(title||$("#docTitle").value||"Documento sin título")+'</h1></header>';
 sections.forEach((s,i)=>{let body=(s.content||"").trim();let paragraphs=body?body.split(/\n{2,}/).map(p=>'<p>'+esc(p).replace(/\n/g,"<br>")+'</p>').join(""):'<p class="print-placeholder">El contenido de esta sección todavía no fue completado.</p>';html+='<section class="print-section"><h2>'+(i+1)+'. '+esc(s.title)+'</h2>'+paragraphs+'</section>'});
 host.innerHTML=html+'</article>';
}
function syncOutput(){let out=[title,"",...sections.flatMap((s,i)=>[(i+1)+". "+s.title,"",s.content.trim()||"[Sin completar]",""])].join("\n");$("#documentOutput").value=out;renderPreview()}
async function generateSection(index,button){
 const s=sections[index],provider=$("#aiProvider").value;if(!s)return;
 if(provider==="none"){notify("Configurá un proveedor en Settings para usar IA.");return}
 const model=activeModel(),endpoint=($("#aiEndpoint").value||"http://localhost:8000").replace(/\/+$/,"");
 const prompt='Redactá únicamente la sección "'+s.title+'" para el documento "'+title+'".\nInstrucción específica: '+(s.instruction||"Desarrollar la sección con rigor y claridad.")+'\nInstrucciones generales del modelo: '+(model?.instructions||"")+'\nEstilo: '+$("#docStyle").value+'. Profundidad: '+$("#depth").value+'.\nIndicaciones adicionales: '+($("#extraInstructions").value||"Ninguna")+'\nMaterial fuente:\n'+(source()||"[No se proporcionó material]")+'\n\nReglas: no inventes datos, citas ni referencias. Si el material no alcanza, indicá qué falta. Entregá solo el contenido de esta sección.';
 const old=button.textContent;button.disabled=true;button.textContent="Generando…";
 try{const r=await fetch(endpoint+"/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider,model:$("#aiModel").value,prompt,api_key:$("#aiKey").value})});const data=await r.json();if(!r.ok)throw Error(data.detail||"HTTP "+r.status);sections[index].content=data.text||"";renderEditor();syncOutput();$("#studioStatus").textContent="Sección generada. Podés editarla antes de exportar."}
 catch(e){notify("No se pudo generar: "+e.message)}
 finally{const current=$('[data-generate="'+index+'"]');if(current){current.disabled=false;current.textContent=old}}
}
function init(){
 if(!$("#buildStructuredDoc"))return;
 $("#buildStructuredDoc").addEventListener("click",build);
 $("#aiProvider").addEventListener("change",()=>{const p=$("#aiProvider").value,defaults={ollama:"qwen2.5:7b",openai:"gpt-4o-mini",gemini:"gemini-2.5-flash"};const hints={ollama:"Nombre exacto del modelo descargado en Ollama.",openai:"ID del modelo habilitado en tu cuenta de OpenAI.",gemini:"ID del modelo disponible en Google AI Studio.",none:"Sin IA: podés editar y exportar documentos manualmente."};if(defaults[p]&&!$("#aiModel").value)$("#aiModel").value=defaults[p];$("#modelHint").textContent=hints[p]||"Escribí el identificador exacto del modelo.";});
 $("#sectionEditors").addEventListener("input",e=>{if(e.target.matches("[data-content]")){sections[Number(e.target.dataset.content)].content=e.target.value;syncOutput()}});
 $("#sectionEditors").addEventListener("click",e=>{const b=e.target.closest("[data-generate]");if(b)generateSection(Number(b.dataset.generate),b)});
 $("#studioModel").addEventListener("change",()=>$("#structuredEditor").classList.add("hidden"));
 $("#docTitle").addEventListener("input",()=>{if(sections.length){title=$("#docTitle").value;renderPreview();syncOutput()}});
 $("#structuredPrint").addEventListener("click",()=>{syncOutput();window.print()});
 $("#structuredExport").addEventListener("click",()=>{syncOutput();const html='<!doctype html><html lang="es"><meta charset="utf-8"><title>'+esc(title)+'</title><style>body{font:11pt/1.6 Georgia,serif;max-width:780px;margin:50px auto;color:#222}h1,h2{font-family:Arial,sans-serif}h1{text-align:center;margin:70px 0}h2{font-size:15pt;border-bottom:1px solid #ddd;padding-bottom:8px;margin-top:32px}.print-section{break-inside:avoid}</style>'+$("#documentLivePreview").innerHTML+'</html>';const a=document.createElement("a"),u=URL.createObjectURL(new Blob([html],{type:"text/html"}));a.href=u;a.download=(title||"documento").replace(/[^\w-]+/g,"-")+".html";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();