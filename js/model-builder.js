(() => {
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const CATALOG=[
{id:"cover",title:"Portada",description:"Título, subtítulo y datos del documento.",instruction:"Crear una portada sobria con título, subtítulo y datos disponibles. No inventar autor ni institución."},
{id:"index",title:"Índice",description:"Índice jerárquico de secciones.",instruction:"Crear un índice jerárquico coherente con los títulos y subtítulos realmente presentes."},
{id:"objectives",title:"Objetivos de aprendizaje",description:"Objetivos claros y evaluables.",instruction:"Formular objetivos de aprendizaje concretos, observables y vinculados al contenido."},
{id:"introduction",title:"Introducción",description:"Presentación del tema, alcance y organización.",instruction:"Introducir el tema, delimitar su alcance y explicar la organización del documento."},
{id:"development",title:"Desarrollo conceptual",description:"Sección principal de exposición y articulación.",instruction:"Desarrollar los conceptos con precisión, explicar relaciones y conservar las distinciones relevantes."},
{id:"question-bank",title:"Banco de preguntas",description:"Preguntas y respuestas de revisión.",instruction:"Crear preguntas variadas y respuestas fundamentadas exclusivamente en el material proporcionado."},
{id:"glossary",title:"Glosario",description:"Términos y definiciones esenciales.",instruction:"Definir los términos técnicos relevantes y explicar su contexto cuando sea necesario."},
{id:"comparison",title:"Cuadros comparativos",description:"Comparación por criterios equivalentes.",instruction:"Comparar conceptos mediante criterios equivalentes; no forzar semejanzas ni simetrías."},
{id:"examples",title:"Ejemplos y aplicaciones",description:"Ejemplos vinculados con los conceptos.",instruction:"Incluir ejemplos pertinentes y diferenciarlos de las afirmaciones tomadas de las fuentes."},
{id:"conclusion",title:"Conclusión",description:"Síntesis de resultados e ideas centrales.",instruction:"Cerrar con una síntesis que recupere los argumentos y resultados desarrollados, sin introducir temas nuevos."},
{id:"bibliography",title:"Bibliografía",description:"Referencias de las fuentes proporcionadas.",instruction:"Listar únicamente referencias bibliográficas disponibles en el material. Marcar datos incompletos en lugar de inventarlos."},
{id:"appendix",title:"Anexos",description:"Material complementario.",instruction:"Organizar el material complementario como anexos identificados y referenciados desde el cuerpo."}
];
let components=[],editingId=null;
const load=()=>{try{return JSON.parse(localStorage.getItem("doculab_templates")||"[]")}catch{return []}};
const save=(arr)=>localStorage.setItem("doculab_templates",JSON.stringify(arr));
const slug=s=>(s||"modelo").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"modelo";
function toast(s){const t=$("#toast");if(!t)return;t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function current(){return {schema:"doculab.model/v1",id:editingId||"model_"+slug($("#modelName").value),name:$("#modelName").value.trim(),category:$("#modelCategory").value.trim()||"Personalizados",description:$("#modelDescription").value.trim(),instructions:$("#modelPrompt").value.trim(),components:components.map((c,i)=>({...c,order:i})),version:1,updated:new Date().toISOString()}}
function renderComponents(){
 const host=$("#componentList");if(!host)return;
 host.innerHTML=components.map((c,i)=>'<div class="component-row '+(!c.enabled?"off":"")+'" data-index="'+i+'"><div class="component-order"><button type="button" data-move="-1" title="Subir" '+(i===0?"disabled":"")+'>↑</button><button type="button" data-move="1" title="Bajar" '+(i===components.length-1?"disabled":"")+'>↓</button></div><div class="component-main"><b>'+esc(c.title)+'</b><small>'+esc(c.description||"Componente personalizado")+'</small><details class="sample-editor"><summary>Contenido de muestra para el PDF</summary><textarea data-sample rows="3" placeholder="Ejemplo de texto que aparecerá en la preview de este apartado...">'+esc(c.preview||"")+'</textarea><small>Si lo dejás vacío, DOCULAB genera un ejemplo automático para esta sección.</small></details></div><label class="component-toggle"><input type="checkbox" data-toggle '+(c.enabled?"checked":"")+'> Incluir</label></div>').join("");
 const sel=$("#addComponentSelect");const used=new Set(components.map(c=>c.id));sel.innerHTML='<option value="">Agregar componente…</option>'+CATALOG.filter(c=>!used.has(c.id)).map(c=>'<option value="'+c.id+'">'+esc(c.title)+'</option>').join("");
 renderPreview();
}
function renderPreview(){
 const enabled=components.filter(c=>c.enabled);$("#previewModelName").textContent=$("#modelName").value.trim()||"Nuevo modelo";$("#previewComponentCount").textContent=enabled.length+" secciones";
 const title=esc($("#modelName").value.trim()||"Título del documento");
 $("#modelPreview").innerHTML='<div class="doc-page"><div class="doc-kicker">DOCULAB · PLANTILLA DOCUMENTAL</div><h1>'+title+'</h1><p class="doc-placeholder" style="text-align:center">Subtítulo o descripción del documento</p>'+enabled.map((c,i)=>'<section class="doc-section"><h2>'+esc((i+1)+". "+c.title)+'</h2><p class="doc-placeholder">'+esc(c.preview||"El contenido de esta sección se completará al generar el documento.")+'</p></section>').join("")+'</div>';
}
function fill(model){
 editingId=model?.id||null;$("#modelName").value=model?.name||"";$("#modelCategory").value=model?.category||"Personalizados";$("#modelDescription").value=model?.description||"";$("#modelPrompt").value=model?.instructions||model?.prompt||"";
 const legacy=String(model?.structure||"").split(";").map((name,i)=>({id:"legacy-"+i+"-"+slug(name),title:name.trim(),description:"Sección importada del modelo original.",instruction:"Desarrollar esta sección respetando las instrucciones generales del modelo.",enabled:true,order:i})).filter(c=>c.title);
 components=(model?.components||legacy.length?model?.components||legacy:CATALOG.slice(0,5).map(c=>({...c,enabled:true}))).map((c,i)=>({...c,order:c.order??i}));
 renderComponents();$("#modelSaveStatus").textContent=model?"Editando modelo: "+model.name+" · Los cambios se guardan como versión modular local.":"Nuevo modelo. Guardalo localmente y exportalo cuando esté listo.";
}
function saveModel(){
 const m=current();if(!m.name){toast("Poné un nombre al modelo");return}if(!m.components.some(c=>c.enabled)){toast("Activá al menos un componente");return}
 const all=load(),i=all.findIndex(x=>x.id===m.id);if(i>=0)all[i]=m;else all.unshift(m);save(all);editingId=m.id;window.dispatchEvent(new CustomEvent("doculab:templates-changed"));$("#modelSaveStatus").textContent="Guardado localmente · "+m.name;toast("Modelo guardado en este navegador");
}
function download(name,data,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
let repositoryEntries=[];
async function loadRepositoryModels(){
 try{
  const response=await fetch("./models/index.json",{cache:"no-store"});if(!response.ok)return;
  const manifest=await response.json();if(manifest.schema!=="doculab.models-index/v1"||!Array.isArray(manifest.models))return;
  repositoryEntries=manifest.models;
  const loaded=[];
  for(const entry of manifest.models){
   if(!entry.path||!/^models\/[a-z0-9-]+\/model\.json$/i.test(entry.path))continue;
   try{const file=await fetch("./"+entry.path,{cache:"no-store"});if(!file.ok)continue;const model=await file.json();if(model.schema==="doculab.model/v1"&&Array.isArray(model.components))loaded.push(model)}catch{}
  }
  if(loaded.length){const local=load(),merged=[...loaded,...local.filter(x=>!loaded.some(y=>y.id===x.id))];save(merged);window.dispatchEvent(new CustomEvent("doculab:templates-changed"))}
 }catch{}
}
function exportModel(){const m=current();if(!m.name){toast("Poné un nombre antes de exportar");return}const path="models/"+slug(m.name)+"/model.json";m.id=m.id||"model_"+slug(m.name);download("model.json",JSON.stringify(m,null,2),"application/json");$("#modelSaveStatus").textContent="Archivo exportado. Guardalo en "+path+" dentro del repositorio."}
function exportIndex(){const m=current();if(!m.name){toast("Poné un nombre antes de exportar");return}const path="models/"+slug(m.name)+"/model.json";const entries=[...repositoryEntries.filter(x=>x.path!==path),{id:m.id,name:m.name,path}].sort((a,b)=>a.name.localeCompare(b.name));const manifest={schema:"doculab.models-index/v1",updated:new Date().toISOString(),models:entries};repositoryEntries=entries;download("index.json",JSON.stringify(manifest,null,2),"application/json");$("#modelSaveStatus").textContent="Copiá este index.json a models/index.json en el repositorio."}
async function designWithAI(){
 const provider=$("#aiProvider")?.value||"none";if(provider==="none"){toast("Elegí un proveedor en Configuración primero");return}
 const name=$("#modelName").value.trim()||"Modelo documental";const category=$("#modelCategory").value.trim()||"Personalizados";const description=$("#modelDescription").value.trim();const rules=$("#modelPrompt").value.trim();
 const prompt=`Diseñá una plantilla documental modular para DOCULAB. Devolvé SOLO JSON válido, sin Markdown ni explicaciones, con esta estructura: {"schema":"doculab.model/v1","id":"model-id","name":"nombre","category":"categoría","description":"descripción","instructions":"reglas","components":[{"id":"id-simple","title":"título","description":"descripción","instruction":"instrucción","preview":"texto de demostración breve y realista para la vista previa PDF","enabled":true,"order":0}],"version":1}. Cada componente debe ser una sección independiente que pueda activarse o desactivarse. Incluí un texto de muestra breve y específico en el campo preview para que la previsualización del PDF represente cómo se vería el documento terminado. Usá IDs simples en kebab-case, no inventes componentes redundantes y proponé entre 4 y 10 componentes. Modelo: ${name}. Categoría: ${category}. Descripción: ${description}. Reglas indicadas: ${rules}.`;
 const button=$("#designModelWithAI");button.disabled=true;button.textContent="Diseñando…";
 try{
  const endpoint=$("#aiEndpoint").value.replace(/\/+$/,"");
  const response=await fetch(endpoint+"/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider,model:$("#aiModel").value,prompt,api_key:""})});
  if(!response.ok)throw Error("HTTP "+response.status);
  const data=await response.json();let raw=String(data.text||"").trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
  const model=JSON.parse(raw);if(!Array.isArray(model.components))throw Error("La respuesta no contiene componentes");
  model.schema="doculab.model/v1";model.id=editingId||model.id||"model_"+slug(name);model.name=model.name||name;model.category=model.category||category;model.description=model.description||description;model.instructions=model.instructions||rules;model.components=model.components.map((c,i)=>({...c,enabled:c.enabled!==false,order:i}));
  fill(model);$("#modelSaveStatus").textContent="Propuesta recibida. Revisá los componentes y guardá el modelo cuando esté listo.";toast("Estructura propuesta por IA");
 }catch(e){toast("No se pudo diseñar el modelo: "+e.message)}
 finally{button.disabled=false;button.textContent="Proponer estructura con IA"}
}
function importModel(file){const r=new FileReader();r.onload=()=>{try{const m=JSON.parse(r.result);if(m.schema!=="doculab.model/v1"||!Array.isArray(m.components))throw Error("Formato de modelo no reconocido");fill(m);toast("Modelo importado al editor")}catch(e){toast("No se pudo importar: "+e.message)}};r.readAsText(file)}
function init(){
 if(!$("#componentList"))return;
 fill(null);
 $("#componentList").addEventListener("click",e=>{const row=e.target.closest("[data-index]");if(!row)return;const i=Number(row.dataset.index),delta=Number(e.target.dataset.move);if(!Number.isNaN(delta)&&delta){const j=i+delta;if(j>=0&&j<components.length)[components[i],components[j]]=[components[j],components[i]];renderComponents()}});
 $("#componentList").addEventListener("change",e=>{const row=e.target.closest("[data-index]");if(!row)return;const i=Number(row.dataset.index);if(e.target.matches("[data-toggle]")){components[i].enabled=e.target.checked;renderComponents()}else if(e.target.matches("[data-sample]")){components[i].preview=e.target.value;renderPreview()}});$("#componentList").addEventListener("input",e=>{const row=e.target.closest("[data-index]");if(!row||!e.target.matches("[data-sample]"))return;components[Number(row.dataset.index)].preview=e.target.value;renderPreview()});
 ["modelName","modelCategory","modelDescription"].forEach(id=>$("#"+id).addEventListener("input",renderPreview));
 $("#addComponent").onclick=()=>{const id=$("#addComponentSelect").value,c=CATALOG.find(x=>x.id===id);if(!c)return;components.push({...c,enabled:true});renderComponents()};
 $("#saveModel").onclick=saveModel;$("#designModelWithAI").onclick=designWithAI;$("#exportModelJson").onclick=exportModel;$("#exportModelIndex").onclick=exportIndex;
 $("#importModelJson").onchange=e=>{const f=e.target.files?.[0];if(f)importModel(f);e.target.value=""};
 $("#clearModelForm").onclick=()=>{if(components.length&&$("#modelName").value&&!confirm("¿Empezar un modelo nuevo? Los cambios no guardados se perderán."))return;fill(null)};
}
window.addEventListener("doculab:edit-template",e=>fill(e.detail));if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{init();loadRepositoryModels()});else{init();loadRepositoryModels()}
})();