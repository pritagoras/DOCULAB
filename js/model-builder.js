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
async function designModelFromPDF(){
 const file=$("#modelPdfFile")?.files?.[0],provider=$("#aiProvider")?.value||"none";
 if(!file){toast("Seleccioná un archivo PDF primero");return}
 if(provider==="none"){toast("Elegí un proveedor de IA en Configuración");return}
 if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf")){toast("El archivo seleccionado no parece ser un PDF");return}
 const button=$("#analyzePdfModel"),status=$("#pdfModelStatus"),preview=$("#pdfExtractPreview");
 button.disabled=true;button.textContent="Leyendo PDF…";status.textContent="Extrayendo texto del documento…";
 try{
  const endpoint=$("#aiEndpoint").value.replace(/\/+$/,"");
  const extracted=await fetch(endpoint+"/api/extract-pdf",{method:"POST",headers:{"Content-Type":"application/pdf","X-Filename":encodeURIComponent(file.name)},body:file});
  const extraction=await extracted.json();if(!extracted.ok)throw Error(extraction.detail||"No se pudo leer el PDF");
  const source=String(extraction.text||"").trim();if(source.length<80)throw Error("El PDF no contiene suficiente texto seleccionable. Si es un escaneo, primero necesitás OCR.");
  status.textContent="PDF leído · "+(extraction.pages||"?")+" páginas · "+source.length.toLocaleString("es-AR")+" caracteres. Analizando estructura con IA…";
  preview.textContent=source.slice(0,18000)+(source.length>18000?"\n\n[Vista previa truncada; la IA recibe el texto completo hasta el límite de extracción.]":"");
  const name=$("#modelName").value.trim()||file.name.replace(/\.pdf$/i,"").replace(/[_-]+/g," ");
  const category=$("#modelCategory").value.trim()||"Documentación";
  const rules=$("#modelPrompt").value.trim();
  const prompt=buildExternalPdfPrompt()+`\n\nTEXTO EXTRAÍDO COMO APOYO PARA IDENTIFICAR ROLES VISUALES (NO CONSERVAR TEMA NI CONCEPTOS):\n${source.slice(0,100000)}`
  button.textContent="Diseñando modelo…";status.textContent="La IA está reconstruyendo la estructura del PDF…";
  const response=await fetch(endpoint+"/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider,model:$("#aiModel").value,prompt,api_key:""})});
  const result=await response.json();if(!response.ok)throw Error(result.detail||"La IA no pudo analizar el documento");
  let raw=String(result.text||"").trim().replace(/^\x60{3}(?:json)?\s*/i,"").replace(/\s*\x60{3}$/,"");
  const match=raw.match(/\{[\s\S]*\}/);if(match)raw=match[0];
  const model=JSON.parse(raw);if(!Array.isArray(model.components)||!model.components.length)throw Error("La IA no devolvió componentes válidos");
  model.schema="doculab.model/v1";model.id=editingId||model.id||"model_"+slug(name);model.name=model.name||name;model.category=model.category||category;model.description=model.description||"Modelo reconstruido a partir de "+file.name;model.instructions=model.instructions||rules;model.components=model.components.map((c,i)=>({...c,id:slug(c.id||c.title||("seccion-"+(i+1))),title:String(c.title||("Sección "+(i+1))),description:String(c.description||""),instruction:String(c.instruction||""),preview:String(c.preview||""),enabled:c.enabled!==false,order:i}));
  fill(model);status.textContent="Modelo generado desde "+file.name+". Revisá y ajustá los componentes antes de guardarlo.";toast("Modelo reconstruido desde el PDF");
 }catch(e){status.textContent="No se pudo crear el modelo: "+e.message;toast("Error al analizar el PDF")}
 finally{button.disabled=false;button.textContent="Analizar PDF y crear modelo"}
}
function buildExternalPdfPrompt(){
 return `Actuá como especialista en análisis de diseño editorial, maquetación y sistemas de diseño documental. Analizá el PDF adjunto EXCLUSIVAMENTE como objeto gráfico y editorial. Tu tarea es reconstruir su SISTEMA VISUAL Y TOPOGRÁFICO para convertirlo en una plantilla DOCULAB reutilizable con cualquier tema o contenido.

REGLA CENTRAL — SEPARACIÓN TOTAL ENTRE FORMA Y CONTENIDO
NO construyas una plantilla temática. NO conserves los conceptos, la materia, el vocabulario, los títulos específicos, los autores, los ejemplos ni los datos del PDF. Ignorá el significado semántico del texto. Si el PDF trata sobre biología, filosofía, derecho o cualquier otra materia, eso es irrelevante: el modelo resultante debe servir para escribir sobre cualquier tema.
Usá los textos visibles únicamente como muestras para detectar niveles tipográficos, longitudes aproximadas, estilos de títulos, párrafos, listas, epígrafes, tablas y otros roles visuales. En los nombres de componentes utilizá nombres funcionales genéricos como "Título principal", "Subtítulo", "Cuerpo de texto", "Lista numerada", "Tabla", "Encabezado", "Pie de página", etc. Nunca nombres de componentes con conceptos de la materia del PDF.

OBJETIVO
Inferí y describí un sistema de diseño reproducible que permita crear documentos NUEVOS con la misma apariencia, distribución y ritmo editorial del PDF de referencia, aunque el contenido sea completamente distinto.

ANALIZÁ Y REGISTRÁ CON LA MAYOR PRECISIÓN POSIBLE
1. FORMATO FÍSICO: tamaño de página (A4, A5, carta u otro; si no se puede determinar, estimarlo y marcarlo como estimación), orientación, proporciones, márgenes superior/inferior/interior/exterior, área útil, columnas y medianiles.
2. RETÍCULA Y COMPOSICIÓN: alineación, distribución de bloques, ancho de texto, ubicación de títulos, cajas, imágenes, tablas, separadores, espacios en blanco, saltos de página y consistencia entre páginas.
3. TIPOGRAFÍA: familias o rasgos tipográficos observables, tamaños aproximados en pt, pesos, estilos, interlineado, tracking si es perceptible, jerarquías y usos de cada estilo.
4. ESPACIADO: distancias antes/después de títulos y párrafos, separación entre bloques, sangrías de primera línea, sangrías de listas, padding interno de tablas/cajas y ritmo vertical.
5. COLOR Y RECURSOS: paleta aproximada, fondos, líneas, grosores de bordes, viñetas, numeración, destacados, recuadros, iconografía y tratamiento de imágenes.
6. ELEMENTOS REPETIDOS: encabezados y pies, folios, numeración, títulos corrientes, cabeceras de tabla y otros elementos constantes.
7. PATRONES DE BLOQUES: identificá los tipos de bloques visuales que realmente aparecen y describí su apariencia y reglas de uso, sin conservar el asunto que contienen.
8. VARIACIONES: si hay portada, índice, páginas de desarrollo, páginas con tablas o anexos que usen composiciones diferentes, describí cada variante como un patrón de página. No confundas una página excepcional con una regla global.

INSTRUCCIONES PARA LOS COMPONENTES
- Los componentes representan ROLES DE MAQUETACIÓN, no temas ni capítulos del PDF.
- Usá títulos genéricos y transferibles: "Título de nivel 1", "Título de nivel 2", "Texto principal", "Lista con viñetas", "Tabla de datos", "Nota destacada", "Pie de página".
- La descripción debe explicar apariencia, jerarquía y ubicación.
- La instrucción debe ser operativa: indicar tamaño, peso, espaciado, alineación, sangría, ancho, bordes, comportamiento y cuándo usar ese rol.
- Los previews deben usar contenido de relleno neutro, por ejemplo "Título de ejemplo", "Texto de muestra para este bloque", "Elemento de lista", "Dato de ejemplo". No reutilices conceptos ni frases del PDF.
- Incluí un componente global de configuración de página/retícula y componentes separados para los roles tipográficos y bloques visuales que correspondan.
- Si existen patrones de página distintos (por ejemplo portada y páginas interiores), representalos como componentes o variantes claramente identificadas.
- No inventes valores exactos cuando no sean medibles: usá "aproximado" o "estimado".
- No generes capítulos temáticos ni un índice temático basado en el contenido original.

SALIDA JSON
Devolvé exclusivamente JSON válido, sin Markdown ni bloques de código, con este esquema:
{
 "schema":"doculab.model/v1",
 "id":"sistema-editorial-identificador",
 "name":"Sistema editorial — [descripción visual genérica]",
 "category":"Diseño editorial",
 "description":"Plantilla visual reutilizable basada en el sistema de maquetación del PDF de referencia; independiente de su tema.",
 "instructions":"Reglas globales para reproducir formato, retícula, tipografía, márgenes, espaciados y jerarquías. Aclarar que el contenido futuro debe ser independiente del PDF de referencia.",
 "components":[
  {
   "id":"configuracion-pagina",
   "title":"Configuración de página y retícula",
   "description":"Formato físico, orientación, márgenes, columnas y área útil.",
   "instruction":"Especificación operativa de página y retícula con medidas aproximadas y nivel de certeza.",
   "preview":"Formato: A4 vertical · Márgenes: valores estimados · Una columna",
   "enabled":true,
   "order":0
  }
 ],
 "version":1
}

Incluí entre 5 y 25 componentes según la complejidad visual real. Cada componente debe tener id único en kebab-case, title, description, instruction, preview, enabled y order. order debe ser consecutivo desde 0.
Antes de responder, verificá JSON válido, IDs únicos, campos completos y que ningún componente esté nombrado por el tema o los conceptos del documento. El resultado debe poder aplicarse a un documento de una materia totalmente diferente sin cambiar su identidad visual.`;
}
function importModel(file){const r=new FileReader();r.onload=()=>{try{const m=JSON.parse(r.result);if(m.schema!=="doculab.model/v1"||!Array.isArray(m.components))throw Error("Formato de modelo no reconocido");fill(m);toast("Modelo importado al editor")}catch(e){toast("No se pudo importar: "+e.message)}};r.readAsText(file)}
function init(){
 if(!$("#componentList"))return;
 fill(null);
 $("#componentList").addEventListener("click",e=>{const row=e.target.closest("[data-index]");if(!row)return;const i=Number(row.dataset.index),delta=Number(e.target.dataset.move);if(!Number.isNaN(delta)&&delta){const j=i+delta;if(j>=0&&j<components.length)[components[i],components[j]]=[components[j],components[i]];renderComponents()}});
 $("#componentList").addEventListener("change",e=>{const row=e.target.closest("[data-index]");if(!row)return;const i=Number(row.dataset.index);if(e.target.matches("[data-toggle]")){components[i].enabled=e.target.checked;renderComponents()}else if(e.target.matches("[data-sample]")){components[i].preview=e.target.value;renderPreview()}});$("#componentList").addEventListener("input",e=>{const row=e.target.closest("[data-index]");if(!row||!e.target.matches("[data-sample]"))return;components[Number(row.dataset.index)].preview=e.target.value;renderPreview()});
 ["modelName","modelCategory","modelDescription"].forEach(id=>$("#"+id).addEventListener("input",renderPreview));
 $("#addComponent").onclick=()=>{const id=$("#addComponentSelect").value,c=CATALOG.find(x=>x.id===id);if(!c)return;components.push({...c,enabled:true});renderComponents()};
 $("#saveModel").onclick=saveModel;$("#designModelWithAI").onclick=designWithAI;$("#analyzePdfModel").onclick=designModelFromPDF;$("#copyExternalPdfPrompt").onclick=async()=>{try{await navigator.clipboard.writeText(buildExternalPdfPrompt());$("#externalPdfPromptStatus").textContent="Prompt copiado. Adjuntá el PDF en la IA que prefieras y pegalo allí."}catch{$("#externalPdfPromptText").value=buildExternalPdfPrompt();$("#externalPdfPromptText").focus();$("#externalPdfPromptText").select();$("#externalPdfPromptStatus").textContent="Seleccioné el prompt para que puedas copiarlo con Ctrl+C."}};$("#showExternalPdfPrompt").onclick=()=>{const box=$("#externalPdfPromptBox");box.hidden=!box.hidden;if(!box.hidden)$("#externalPdfPromptText").value=buildExternalPdfPrompt()};$("#importPastedModel").onclick=()=>{try{let raw=$("#pastedModelJson").value.trim().replace(/^\\x60{3}(?:json)?\\s*/i,"").replace(/\\s*\\x60{3}$/,"");const match=raw.match(/\\{[\\s\\S]*\\}/);if(match)raw=match[0];const model=JSON.parse(raw);if(!Array.isArray(model.components)||!model.components.length)throw Error("Falta el arreglo components");if(model.components.length>100)throw Error("El JSON contiene demasiados componentes");const ids=new Set();model.components.forEach((c,i)=>{if(!c||typeof c!=="object"||!c.title)throw Error("Componente "+(i+1)+" sin título");c.id=slug(c.id||c.title||("seccion-"+(i+1)));if(ids.has(c.id))c.id+="-"+(i+1);ids.add(c.id);c.enabled=c.enabled!==false;c.order=i;c.description=String(c.description||"");c.instruction=String(c.instruction||"");c.preview=String(c.preview||"")});model.schema="doculab.model/v1";model.id=editingId||model.id||"model_"+slug(model.name||"modelo-importado");model.name=String(model.name||"Modelo importado desde IA");model.category=String(model.category||"Personalizados");model.description=String(model.description||"");model.instructions=String(model.instructions||"");model.components=model.components;fill(model);$("#pastedModelStatus").textContent="JSON convertido en modelo editable. Revisá la estructura y guardalo.";toast("Modelo importado desde JSON")}catch(e){$("#pastedModelStatus").textContent="No se pudo importar: "+e.message;toast("Revisá el JSON pegado")}};$("#modelPdfFile").onchange=e=>{const f=e.target.files?.[0];$("#pdfModelStatus").textContent=f?f.name+" · "+(f.size/1024/1024).toFixed(1)+" MB":"Ningún PDF seleccionado";$("#pdfExtractPreview").textContent=""};$("#exportModelJson").onclick=exportModel;$("#exportModelIndex").onclick=exportIndex;
 $("#importModelJson").onchange=e=>{const f=e.target.files?.[0];if(f)importModel(f);e.target.value=""};
 $("#clearModelForm").onclick=()=>{if(components.length&&$("#modelName").value&&!confirm("¿Empezar un modelo nuevo? Los cambios no guardados se perderán."))return;fill(null)};
}
window.addEventListener("doculab:edit-template",e=>fill(e.detail));if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{init();loadRepositoryModels()});else{init();loadRepositoryModels()}
})();