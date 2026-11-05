const DEFAULT_MODELS=[
{id:"manual",name:"Manual universitario",category:"Académicos",description:"Convierte apuntes y bibliografía en un manual riguroso.",structure:"Portada; índice; introducción; capítulos; síntesis; bibliografía.",prompt:"Actúa como editor académico. Organiza el material en un manual coherente, conserva conceptos y relaciones, elimina repeticiones y no inventes información."},
{id:"guide",name:"Guía de estudio detallada",category:"Académicos",description:"Organiza contenidos por unidades y objetivos.",structure:"Objetivo; mapa; desarrollo; relaciones; examen.",prompt:"Construye una guía exhaustiva, define conceptos, explica relaciones, distingue ideas confundibles y propone preguntas de repaso."},
{id:"summary",name:"Superresumen académico",category:"Académicos",description:"Condensa sin perder distinciones esenciales.",structure:"Objetivo; mapa numerado; conceptos; precisiones; síntesis.",prompt:"Elabora un resumen de alta densidad conceptual. Prioriza definiciones, argumentos, relaciones y diferencias; evita redundancias y no pierdas matices."},
{id:"qa",name:"Banco de preguntas y respuestas",category:"Evaluación",description:"Crea preguntas y respuestas ordenadas.",structure:"Preguntas numeradas; respuestas; referencia temática.",prompt:"Construye un banco de preguntas y respuestas completo, claro y sin duplicados. Mantén el formato pregunta-respuesta y fundamenta las respuestas en las fuentes."},
{id:"comparison",name:"Cuadro comparativo",category:"Visuales",description:"Compara teorías, procesos o autores.",structure:"Introducción; tabla; semejanzas; diferencias; conclusión.",prompt:"Compara usando criterios equivalentes. No fuerces simetrías. Incluye tabla, semejanzas, diferencias y límites."},
{id:"glossary",name:"Glosario conceptual",category:"Académicos",description:"Define términos y relaciones.",structure:"Término; definición; contexto; relaciones.",prompt:"Extrae conceptos relevantes y ofrece definiciones técnicas precisas. Ordena alfabéticamente y no agregues ejemplos no respaldados."},
{id:"critical",name:"Análisis crítico de textos",category:"Académicos",description:"Reconstruye tesis y argumentos.",structure:"Problema; tesis; argumentos; conceptos; supuestos; tensiones.",prompt:"Reconstruye problema, tesis y argumentos. Identifica supuestos y tensiones, distinguiendo exposición y evaluación crítica."},
{id:"article",name:"Artículo científico",category:"Científicos",description:"Estructura un manuscrito científico.",structure:"Resumen; introducción; métodos; resultados; discusión.",prompt:"Organiza el material como artículo científico. No inventes métodos, resultados, datos ni referencias; señala la información faltante."},
{id:"review",name:"Revisión bibliográfica",category:"Científicos",description:"Sintetiza debates y enfoques bibliográficos.",structure:"Pregunta; ejes; convergencias; controversias; vacíos.",prompt:"Agrupa trabajos por ejes, compara enfoques, identifica acuerdos y desacuerdos y señala límites del corpus. No inventes citas."},
{id:"infographic",name:"Infografía educativa",category:"Visuales",description:"Jerarquiza información para una pieza didáctica.",structure:"Título; idea central; bloques; secuencia; fuentes.",prompt:"Reduce el contenido a una estructura visual clara, con idea central y bloques breves. Evita saturación y simplificaciones engañosas."},
{id:"flow",name:"Diagrama de procesos",category:"Visuales",description:"Representa etapas, decisiones y resultados.",structure:"Entradas; etapas; decisiones; resultados; excepciones.",prompt:"Representa el proceso como secuencia lógica. Identifica entradas, condiciones, etapas, decisiones, actores y resultados."},
{id:"exam",name:"Examen de opción múltiple",category:"Evaluación",description:"Genera evaluaciones con distractores plausibles.",structure:"Consignas; opciones A-D; clave; justificación.",prompt:"Diseña preguntas de opción múltiple con una sola respuesta correcta, distractores plausibles y clave justificada."}
];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem("doculab_"+k))??d}catch{return d}},put=(k,v)=>localStorage.setItem("doculab_"+k,JSON.stringify(v));
let custom=get("models",[]),projects=get("projects",[]),settings=get("settings",{provider:"none",endpoint:"http://localhost:8000",model:""}),activeId="manual",currentId=null;
const models=()=>{const all=[...DEFAULT_MODELS,...custom,...get("templates",[]).map(t=>({...t,prompt:[t.instructions,...(t.components||[]).filter(c=>c.enabled).map(c=>c.instruction)].filter(Boolean).join("\n\n"),structure:(t.components||[]).filter(c=>c.enabled).map(c=>c.title).join("; "),custom:true}))];const unique=new Map();all.forEach(m=>unique.set(m.id,m));return [...unique.values()]},esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
window.DOCULAB_GET_MODEL=id=>models().find(m=>m.id===id)||null;
function toast(s){let t=$("#toast");t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function go(n){$$(".view").forEach(x=>x.classList.toggle("active",x.id==="view-"+n));$$(".nav-item[data-view]").forEach(x=>{const on=x.dataset.view===n;x.classList.toggle("active",on);on?x.setAttribute("aria-current","page"):x.removeAttribute("aria-current")});$("#crumb").textContent=({library:"Biblioteca",studio:"Crear documento",builder:"Constructor de modelos",projects:"Mis proyectos",promptlab:"Generador de prompts",settings:"Configuración"})[n];$("#sidebar").classList.remove("open");if(n==="projects")renderProjects();if(n==="library")renderLibrary();window.scrollTo(0,0)}
function renderLibrary(){let q=$("#searchInput").value.toLowerCase(),cat=$("#categoryFilter").value,sort=$("#sortFilter").value;let a=models().filter(m=>(cat==="all"||m.category===cat)&&[m.name,m.category,m.description].join(" ").toLowerCase().includes(q));if(sort==="az")a.sort((x,y)=>x.name.localeCompare(y.name));else if(sort==="newest")a.sort((x,y)=>(Date.parse(y.updated)||0)-(Date.parse(x.updated)||0));$("#modelGrid").innerHTML=a.map(m=>'<article class="model-card"><div class="card-top"><span class="model-icon">▤</span><span class="tag">'+esc(m.category)+'</span></div><h3>'+esc(m.name)+'</h3><p>'+esc(m.description)+'</p><div class="card-bottom"><button class="text-button" data-model="'+esc(m.id)+'">Ver preview ↗</button><button class="text-button" data-edit-model="'+esc(m.id)+'">Editar</button></div></article>').join("");$("#resultCount").textContent=a.length+" modelos";$("#emptyLibrary").classList.toggle("hidden",!!a.length);$("#statModels").textContent=models().length;$("#statCustom").textContent=custom.length;$("#statProjects").textContent=projects.length;let cats=[...new Set(models().map(x=>x.category))].sort(),old=cat;$("#categoryFilter").innerHTML='<option value="all">Todas las categorías</option>'+cats.map(c=>'<option>'+esc(c)+'</option>').join("");$("#categoryFilter").value=cats.includes(old)?old:"all"}
function modelPromptSections(model){
 if(!model)return [];
 if(Array.isArray(model.components))return model.components.filter(c=>c.enabled!==false).sort((a,b)=>(a.order??0)-(b.order??0));
 return String(model.structure||"Desarrollo").split(";").map((title,i)=>({id:"legacy-"+i,title:title.trim(),description:"",instruction:""})).filter(c=>c.title);
}
function renderStudioModelSummary(){
 const host=$("#studioModelSummary"),model=models().find(m=>m.id===$("#studioModel").value);
 if(!host)return;
 if(!model){host.innerHTML='<span class="studio-summary-empty">Elegí una maqueta para ver sus secciones.</span>';return}
 const parts=modelPromptSections(model);
 host.innerHTML='<div class="studio-summary-top"><div><b>'+esc(model.name)+'</b><small>'+esc(model.category||"Personalizada")+'</small></div><span>'+parts.length+' secciones</span></div><p>'+esc(model.description||"Plantilla documental reutilizable.")+'</p><div class="studio-summary-tags">'+parts.slice(0,6).map(c=>'<span>'+esc(c.title)+'</span>').join("")+(parts.length>6?'<span>+'+(parts.length-6)+'</span>':"")+'</div>';
}
function renderPromptLayoutPreview(){
 const host=$("#promptLayoutPreview"),select=$("#promptLayoutModel");
 if(!host||!select)return;
 const model=models().find(m=>m.id===select.value);
 if(!model){host.innerHTML='<span class="prompt-layout-empty">Seleccioná una maqueta para ver su estructura.</span>';return}
 const parts=modelPromptSections(model);
 host.innerHTML='<div class="prompt-layout-sheet"><div class="prompt-layout-sheet-brand">DOCULAB <span>DOCUMENT STUDIO</span></div><div class="prompt-layout-sheet-kicker">'+esc(model.category||"DOCUMENTO")+'</div><b>'+esc(model.name)+'</b><div class="prompt-layout-sheet-lines"></div><ol>'+parts.slice(0,6).map(c=>'<li>'+esc(c.title)+'</li>').join("")+'</ol>'+(parts.length>6?'<small>Y '+(parts.length-6)+' secciones más</small>':"")+'</div><div class="prompt-layout-description"><b>'+esc(model.name)+'</b><p>'+esc(model.description||"Estructura documental reutilizable.")+'</p><small>Esta maqueta se utilizará al pasar al estudio.</small></div>';
}
function renderSelect(){
 const all=models(),studio=$("#studioModel"),promptSelect=$("#promptLayoutModel");
 if(studio){
  const previous=studio.value||activeId;
  studio.innerHTML=all.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name)+'</option>').join("");
  studio.value=all.some(m=>m.id===previous)?previous:(all[0]?.id||"");
 }
 if(promptSelect){
  const previous=promptSelect.value;
  promptSelect.innerHTML='<option value="">Elegir una maqueta…</option>'+all.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name)+' · '+esc(m.category||"Personalizada")+'</option>').join("");
  promptSelect.value=all.some(m=>m.id===previous)?previous:"";
 }
 renderStudioModelSummary();renderPromptLayoutPreview();
}
function editModel(function editModel(id){
 const model=models().find(item=>item.id===id);
 if(!model){toast("No se encontró el modelo seleccionado.");return}
 activeId=id;
 window.dispatchEvent(new CustomEvent("doculab:edit-template",{detail:model}));
 go("builder");
 const name=model.name||"modelo";
 const status=$("#modelSaveStatus");
 if(status)status.textContent="Editando: "+name+". Los cambios no afectan al documento ni a otras plantillas hasta guardar.";
}
function modelSections(m){if(Array.isArray(m.components))return m.components.filter(c=>c.enabled!==false).sort((a,b)=>(a.order??0)-(b.order??0));return String(m.structure||"Desarrollo").split(";").map((name,i)=>({id:"legacy-"+i,title:name.trim(),enabled:true,order:i})).filter(c=>c.title)}
function sampleBody(section,m){
 const t=String(section.title||"Sección").toLowerCase(),name=esc(m.name),desc=esc(m.description||"el tema de estudio");
 if(section.preview&&String(section.preview).trim())return String(section.preview).trim().split(/\n{2,}/).map(p=>'<p>'+esc(p).replace(/\n/g,"<br>")+"</p>").join("");
 if(/índice/.test(t))return '<p>Organización general del documento y recorrido de sus apartados.</p><ol><li>Presentación y objetivos</li><li>Desarrollo de los ejes principales</li><li>Integración y conclusiones</li></ol>';
 if(/objetiv/.test(t))return '<ul><li>Identificar los conceptos fundamentales de '+desc+'.</li><li>Explicar las relaciones entre los elementos principales.</li><li>Aplicar los conceptos a ejemplos pertinentes.</li></ul>';
 if(/pregunta|examen|evaluación/.test(t))return '<div class="pdf-question"><b>1. ¿Cuál es el propósito central de '+name+'?</b><p>Respuesta modelo: organizar y desarrollar el contenido de manera coherente, atendiendo a los objetivos y las fuentes disponibles.</p></div><div class="pdf-question"><b>2. ¿Qué diferencia existe entre describir y explicar un proceso?</b><p>Respuesta modelo: describir identifica elementos o etapas; explicar establece relaciones y mecanismos.</p></div>';
 if(/glosario/.test(t))return '<dl><dt>Concepto</dt><dd>Unidad de significado que permite delimitar y analizar un fenómeno.</dd><dt>Proceso</dt><dd>Conjunto ordenado de transformaciones o acontecimientos relacionados.</dd><dt>Modelo</dt><dd>Representación simplificada que organiza elementos y relaciones.</dd></dl>';
 if(/compar|cuadro/.test(t))return '<table class="pdf-table"><thead><tr><th>Criterio</th><th>Concepto A</th><th>Concepto B</th></tr></thead><tbody><tr><td>Definición</td><td>Primer enfoque o elemento de análisis.</td><td>Segundo enfoque o elemento de análisis.</td></tr><tr><td>Función</td><td>Describe una dimensión.</td><td>Permite contrastar otra dimensión.</td></tr><tr><td>Relación</td><td colspan="2">Comparación mediante criterios equivalentes.</td></tr></tbody></table>';
 if(/bibliograf|referencia/.test(t))return '<p class="pdf-note">Las referencias se incorporarán a partir de las fuentes efectivamente utilizadas. Esta muestra no inventa autores ni datos editoriales.</p>';
 if(/conclus/.test(t))return '<p>El recorrido permite recuperar las ideas centrales, relacionarlas y reconocer sus alcances. La síntesis final debe derivarse del desarrollo y no introducir afirmaciones sin fundamento previo.</p>';
 if(/introduc/.test(t))return '<p>Este documento presenta '+desc+'. El recorrido delimita el problema, expone los conceptos principales e integra sus relaciones y consecuencias.</p><p>La organización facilita una lectura progresiva: primero se establecen las nociones necesarias y luego se desarrollan sus conexiones, aplicaciones y límites.</p>';
 if(/anexo/.test(t))return '<p>Material complementario, cuadros de consulta y recursos que amplían el desarrollo principal.</p>';
 return '<p>El análisis de '+desc+' requiere distinguir sus componentes, precisar los conceptos y establecer las relaciones que organizan el tema. Esta sección presenta una exposición progresiva, con definiciones y explicaciones articuladas.</p><p>Un desarrollo riguroso no se limita a enumerar características: explica qué función cumple cada elemento, cómo se relaciona con los demás y en qué condiciones resulta pertinente la distinción propuesta.</p><blockquote>Idea central: comprender un tema implica reconocer tanto sus elementos como las relaciones que les dan sentido.</blockquote>';
}
function sampleDocumentHtml(m,sections){
 const title=esc(m.name),subtitle=esc(m.description||"Documento de demostración"),date=new Date().toLocaleDateString("es-AR",{year:"numeric",month:"long"});
 const content=sections.filter(s=>!/portada/i.test(s.title)).map((s,i)=>'<section class="pdf-section"><h2><span>'+(i+1)+'.</span> '+esc(s.title)+'</h2>'+sampleBody(s,m)+'</section>');
 const pages=[];for(let i=0;i<content.length;i+=2)pages.push(content.slice(i,i+2).join(""));
 const cover='<section class="pdf-sheet pdf-cover"><div class="pdf-brand">DOCULAB <span>DOCUMENT STUDIO</span></div><div class="pdf-cover-center"><div class="pdf-overline">'+esc(m.category||"DOCUMENTO")+'</div><h1>'+title+'</h1><p>'+subtitle+'</p></div><div class="pdf-cover-foot"><span>Documento de demostración</span><span>'+date+'</span></div></section>';
 const body=pages.map((page,i)=>'<section class="pdf-sheet"><header class="pdf-running-head"><span>DOCULAB</span><span>'+title+'</span></header><main>'+page+'</main><footer class="pdf-page-number">'+(i+2)+'</footer></section>').join("");
 return cover+body;
}
const pdfSampleCss='@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#e9ebef;color:#202735;font-family:Georgia,serif}.pdf-sheet{width:210mm;min-height:297mm;height:297mm;margin:12px auto;background:white;position:relative;padding:25mm 24mm 23mm;page-break-after:always;overflow:hidden}.pdf-cover{display:flex;flex-direction:column;justify-content:space-between;padding:25mm 27mm}.pdf-brand{font:700 10pt Arial,sans-serif;letter-spacing:2px;color:#47556b}.pdf-brand span{display:block;margin-top:5px;font:8pt Arial;color:#98a1ae;letter-spacing:1.5px}.pdf-cover-center{margin-top:45mm}.pdf-overline{font:8pt Arial,sans-serif;letter-spacing:2px;color:#6475c8;text-transform:uppercase}.pdf-cover h1{font:700 30pt Arial,sans-serif;line-height:1.2;color:#182235;margin:14mm 0 8mm}.pdf-cover-center p{font:12pt/1.6 Georgia,serif;color:#697386;max-width:145mm}.pdf-cover-foot{display:flex;justify-content:space-between;border-top:1px solid #dfe3e9;padding-top:7mm;font:8pt Arial;color:#8791a0}.pdf-running-head{display:flex;justify-content:space-between;border-bottom:1px solid #e2e5eb;padding-bottom:5mm;font:7pt Arial;letter-spacing:1px;color:#8993a1}.pdf-sheet main{padding-top:12mm}.pdf-section{margin:0 0 12mm;break-inside:avoid}.pdf-section h2{font:700 16pt Arial,sans-serif;color:#202b40;margin:0 0 6mm;padding-bottom:3mm;border-bottom:1px solid #dfe3e9}.pdf-section h2 span{color:#6878c8}.pdf-section p,.pdf-section li,.pdf-section dd{font:10.5pt/1.75 Georgia,serif;color:#394456}.pdf-section p{margin:0 0 5mm}.pdf-section ul,.pdf-section ol{padding-left:7mm}.pdf-section blockquote{margin:7mm 0;padding:4mm 6mm;border-left:2px solid #6878c8;background:#f6f7fa;font:italic 10pt/1.6 Georgia;color:#596579}.pdf-section dl{display:grid;grid-template-columns:30mm 1fr;gap:4mm}.pdf-section dt{font:bold 10pt Arial;color:#29364d}.pdf-section dd{margin:0}.pdf-table{width:100%;border-collapse:collapse;font:9pt/1.5 Arial}.pdf-table th,.pdf-table td{border:1px solid #dfe3e9;padding:4mm;text-align:left;vertical-align:top}.pdf-table th{background:#f2f4f8;color:#33415a}.pdf-question{margin:0 0 7mm;padding-bottom:4mm;border-bottom:1px solid #e7e9ee}.pdf-question b{font:700 10pt Arial;color:#26334a}.pdf-question p{margin:3mm 0 0}.pdf-note{padding:5mm;background:#f6f7fa;color:#657084!important}.pdf-page-number{position:absolute;bottom:13mm;right:24mm;font:8pt Arial;color:#929baa}@media print{body{background:white}.pdf-sheet{margin:0;box-shadow:none}}';
function printSample(m,sections){const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><title>'+esc(m.name)+' · Muestra</title><style>'+pdfSampleCss+'</style></head><body>'+sampleDocumentHtml(m,sections)+'</body></html>';const win=window.open("","_blank");if(!win){toast("Permití las ventanas emergentes para generar el PDF de muestra.");return}win.document.open();win.document.write(html);win.document.close();win.onload=()=>{win.focus();win.print()}}
function showModel(id){let m=models().find(x=>x.id===id);if(!m)return;activeId=id;const sections=modelSections(m);$("#modalContent").innerHTML='<div class="eyebrow">'+esc(m.category)+'</div><h2>'+esc(m.name)+'</h2><p>'+esc(m.description)+'</p><div class="pdf-preview-toolbar"><span>VISTA PREVIA · A4</span><button class="button secondary small" id="modalPrintSample">Imprimir / Guardar PDF</button></div><div class="model-modal-preview pdf-preview">'+sampleDocumentHtml(m,sections)+'</div><div class="modal-actions"><button class="button secondary" id="modalEdit">Editar modelo</button><button class="button secondary" id="modalCopy">Copiar instrucciones</button><button class="button primary" id="modalUse">Usar este modelo</button></div>';$("#modelModal").classList.remove("hidden");$("#closeModal").focus();$("#modalEdit").onclick=()=>editModel(id);$("#modalCopy").onclick=()=>copy(m.instructions||m.prompt||"");$("#modalUse").onclick=()=>{renderSelect();$("#studioModel").value=id;$("#modelModal").classList.add("hidden");go("studio")};$("#modalPrintSample").onclick=()=>printSample(m,sections)}
function copy(s){navigator.clipboard?.writeText(s).then(()=>toast("Copiado")).catch(()=>toast("No se pudo copiar"))}

function promptLabBrief(){
 return {
  type:$("#promptType").value,goal:$("#promptGoal").value.trim(),sources:$("#promptSources").value.trim(),
  audience:$("#promptAudience").value.trim(),output:$("#promptOutputSpec").value.trim(),
  depth:$("#promptDepth").value,tone:$("#promptTone").value,rules:$("#promptRules").value.trim(),
  useLayout:$("#promptUseLayout")?.checked||false,layoutId:$("#promptLayoutModel")?.value||""
 };
}
function promptTypeInstructions(function promptTypeInstructions(type){
 const types={
  general:{role:"especialista en la materia y diseñador de soluciones rigurosas",guidance:"Resuelve el encargo con un procedimiento ordenado. Identifica las decisiones importantes antes de producir el resultado."},
  study:{role:"docente universitario y especialista en diseño de materiales de aprendizaje",guidance:"Organizá el contenido para favorecer comprensión y estudio. Diferenciá definiciones, mecanismos, relaciones, ejemplos y precisiones; señalá los puntos que suelen confundirse sin inventar exigencias de evaluación."},
  summary:{role:"editor académico especializado en síntesis y organización conceptual",guidance:"Condensá el material sin borrar distinciones necesarias. Priorizá ideas centrales, definiciones, argumentos y relaciones; evitá repetir información y no conviertas una síntesis en una enumeración superficial."},
  analysis:{role:"analista especializado en lectura crítica y reconstrucción conceptual",guidance:"Identificá el problema, las tesis, los argumentos, los conceptos, los supuestos y las tensiones relevantes. Diferenciá lo que sostiene la fuente de tu propia interpretación."},
  comparison:{role:"especialista en análisis comparativo",guidance:"Definí criterios de comparación equivalentes, distinguí semejanzas y diferencias reales y evitá forzar simetrías. Explicá los límites de la comparación cuando corresponda."},
  questions:{role:"especialista en evaluación y diseño de preguntas",guidance:"Diseñá preguntas variadas y no redundantes. Cuando corresponda, incluí una única respuesta correcta, distractores plausibles, clave y justificación basada en las fuentes."},
  research:{role:"asistente de investigación con criterios de rigor metodológico",guidance:"Delimitá la pregunta, el alcance y el tipo de evidencia. Diferenciá hechos documentados, interpretaciones e hipótesis; no presentes afirmaciones sin respaldo como si fueran verificadas."},
  writing:{role:"editor y redactor académico",guidance:"Construí un texto coherente, con progresión argumental y terminología consistente. Evitá relleno, afirmaciones grandilocuentes y referencias que no estén disponibles."},
  document:{role:"diseñador editorial y arquitecto de documentos",guidance:"Definí una jerarquía clara de títulos, secciones y niveles de lectura. Priorizá legibilidad, consistencia, economía visual y correspondencia entre estructura y contenido."},
  code:{role:"ingeniero de software senior especializado en implementación y revisión técnica",guidance:"Antes de proponer cambios, comprendé la estructura y las dependencias existentes. Conservá las funciones no relacionadas, evitá duplicar lógica y especificá cómo verificar el resultado con pruebas concretas."}
 };
 return types[type]||types.general;
}
function buildPromptFromBrief(){
 const f=promptLabBrief();
 if(!f.goal)return "";
 const config=promptTypeInstructions(f.type);
 const materials=f.sources
  ? "El usuario proporcionará estos materiales:\n"+f.sources+"\nNo afirmes haberlos leído hasta recibirlos."
  : "Usá únicamente los materiales que el usuario adjunte o pegue después de enviar este prompt. No presupongas que ya tenés acceso a archivos o enlaces. Si no se proporcionó material suficiente, solicitá lo necesario antes de empezar.";
 const audience=f.audience||"Adaptá el nivel de explicación al objetivo y al material efectivamente proporcionado. No supongas conocimientos previos específicos sin fundamento.";
 const expected=f.output||"Entregá el resultado más útil y coherente con el objetivo indicado. Elegí una estructura clara y explicá las decisiones importantes solo cuando ayuden al resultado.";
 const rules=f.rules||"No inventes información, datos, citas, autores, bibliografía ni resultados. Señalá de forma explícita cualquier vacío, contradicción o incertidumbre relevante.";
 return [
  "ROL Y ENFOQUE\nActuá como "+config.role+".",
  "OBJETIVO\n"+f.goal,
  "CONTEXTO Y DESTINATARIO\n"+audience,
  "MATERIALES DE ENTRADA\n"+materials,
  "RESULTADO ESPERADO\n"+expected,
  "NIVEL DE DESARROLLO\n"+f.depth+".",
  "ESTILO Y TONO\n"+f.tone+". Mantené un lenguaje claro, preciso y consistente con el tema.",
  "PROCEDIMIENTO DE TRABAJO\n1. Analizá el objetivo y los materiales antes de redactar.\n2. Identificá los conceptos, datos o decisiones que resultan centrales para la tarea.\n3. Organizá el trabajo en una secuencia lógica y evitá repeticiones.\n4. Desarrollá cada parte con el nivel de detalle solicitado.\n5. Revisá que el resultado responda al objetivo y respete el formato esperado.\n"+config.guidance,
  "FIDELIDAD Y CONTROL DE CALIDAD\n- No inventes datos, citas, referencias, conceptos ni resultados.\n- No atribuyas a una fuente afirmaciones que no contiene.\n- Respetá la jerarquía entre fuentes que indique el usuario. Si no se especifica, no impongas una prioridad arbitraria.\n- Si dos fuentes se contradicen, exponé la diferencia en lugar de ocultarla.\n- Distinguí información respaldada, inferencias y ejemplos propios.\n- Si algo no puede determinarse con el material disponible, indicá el límite con claridad.",
  ...(f.useLayout&&models().find(m=>m.id===f.layoutId)?[(()=>{
   const selected=models().find(m=>m.id===f.layoutId),parts=modelPromptSections(selected);
   const partText=parts.map((c,i)=>(i+1)+". "+c.title+(c.description?" — "+c.description:"")+(c.instruction?"\n   Instrucción: "+c.instruction:"")).join("\n");
   const globalRules=selected.instructions||selected.prompt||"";
   return "MAQUETA DOCULAB SELECCIONADA: "+selected.name+"\nCategoría: "+(selected.category||"Personalizada")+"\nDescripción: "+(selected.description||"")+
    "\n\nESTRUCTURA OBLIGATORIA (respetá el orden y los títulos):\n"+partText+
    (globalRules?"\n\nINSTRUCCIONES GENERALES DE LA MAQUETA:\n"+globalRules:"")+
    "\n\nEntregá el contenido con estos títulos y en este orden, listo para trasladarlo al editor de secciones de DOCULAB. No omitas secciones activas; si una no corresponde o no está respaldada por las fuentes, indicalo sin inventar contenido. No afirmes que creaste un PDF: la composición visual A4 se realizará posteriormente dentro de DOCULAB.";
  })()]:[]),
  "REGLAS ESPECÍFICAS\n"+rules,
  "INTERACCIÓN Y ENTREGA\nSi falta un dato imprescindible, formulá preguntas concretas antes de avanzar; si la omisión no impide trabajar, adoptá una solución razonable y explicitá el supuesto. Entregá el resultado solicitado sin introducir explicaciones sobre estas instrucciones ni afirmar que utilizaste materiales que todavía no recibiste."
 ].join("\n\n");
}
function promptDesignerInstruction(basePrompt){
 return [
  "Actuá como especialista senior en ingeniería de prompts.",
  "Tu única tarea es revisar y mejorar el prompt base que aparece al final. No ejecutes la tarea descrita en él ni produzcas su resultado.",
  "Hacé que las instrucciones sean específicas, autónomas, ordenadas y fáciles de seguir. Conservá la intención, el alcance, las prioridades y las restricciones del usuario. Eliminá ambigüedades y redundancias, pero no agregues requisitos temáticos que el usuario no haya pedido.",
  "Asegurá que el prompt indique qué hacer con materiales ausentes, contradicciones, incertidumbres y datos no verificables.",
  "Devolvé únicamente el prompt final optimizado, listo para copiar y utilizar en otra conversación. No agregues introducciones, comentarios ni explicaciones.",
  "PROMPT BASE:",
  basePrompt
 ].join("\n\n");
}
function updatePromptOutputMeta(){
 const value=$("#promptLabOutput").value||"";
 const words=value.trim()?value.trim().split(/\s+/).length:0;
 $("#promptOutputMeta").textContent=words.toLocaleString("es-AR")+" palabras · "+value.length.toLocaleString("es-AR")+" caracteres";
}
async function designPromptLab(){
 const basePrompt=buildPromptFromBrief(),provider=$("#aiProvider").value,button=$("#designPrompt");
 if(!basePrompt){
  $("#promptLabStatus").textContent="Primero describí qué querés conseguir para poder construir el prompt.";
  $("#promptGoal").focus();
  return;
 }
 $("#promptLabOutput").value=basePrompt;
 updatePromptOutputMeta();
 button.disabled=true;
 button.innerHTML="<span>…</span> Generando";
 try{
  if(provider==="none"){
   $("#promptLabStatus").textContent="Prompt completo generado en modo local. No necesitás conectar una IA para utilizarlo; podés editarlo y copiarlo directamente.";
   return;
  }
  const endpoint=$("#aiEndpoint").value.replace(/\/$/,"");
  const r=await fetch(endpoint+"/api/generate",{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({provider,model:$("#aiModel").value,prompt:promptDesignerInstruction(basePrompt),api_key:""})
  });
  if(!r.ok)throw Error("HTTP "+r.status);
  const data=await r.json();
  const refined=String(data.text||data.response||"").trim();
  if(!refined)throw Error("El proveedor no devolvió texto.");
  $("#promptLabOutput").value=refined;
  updatePromptOutputMeta();
  $("#promptLabStatus").textContent="Prompt optimizado con "+(data.model||$("#aiModel").value||provider)+". Revisalo y editá cualquier detalle antes de copiarlo.";
  renderObservedUsage(data);
 }catch(e){
  $("#promptLabOutput").value=basePrompt;
  updatePromptOutputMeta();
  $("#promptLabStatus").textContent="No se pudo conectar con la IA ("+e.message+"). Se conservó el prompt completo generado localmente.";
 }finally{
  button.disabled=false;
  button.innerHTML="<span>✳</span> Generar prompt";
 }
}
function clearPromptLab(){
 ["promptGoal","promptSources","promptAudience","promptOutputSpec","promptRules","promptLabOutput"].forEach(id=>$("#"+id).value="");
 $("#promptType").value="general";
 $("#promptUseLayout").checked=false;$("#promptLayoutOptions").classList.add("hidden");$("#promptLayoutModel").value="";renderPromptLayoutPreview();
 $("#promptDepth").value="Intermedia";
 $("#promptTone").value="Académico claro";
 $("#promptLabStatus").textContent="Campos limpios. Describí el encargo o elegí una estructura de inicio.";
 updatePromptOutputMeta();
}
function applyPromptPreset(function applyPromptPreset(key){
 const presets={
  study:{
   promptType:"study",
   promptGoal:"Crear una guía de estudio completa y rigurosa para preparar un examen. Explicar los temas y sus relaciones, no limitarse a enumerar datos.",
   promptSources:"Transcripción de las clases, diapositivas del profesor y bibliografía indicada para la materia. Respetar cualquier jerarquía entre estos materiales que se detalle aquí.",
   promptAudience:"Estudiante universitario que necesita comprender y repasar los contenidos para una evaluación.",
   promptOutputSpec:"Guía organizada por unidades y temas, con objetivo de estudio, mapa conceptual, desarrollo de conceptos, relaciones entre temas, ejemplos pertinentes y precisiones importantes.",
   promptRules:"Conservar las distinciones conceptuales. No inventar información ni referencias. Señalar contradicciones o vacíos entre los materiales. Eliminar repeticiones sin perder contenido evaluable."
  },
  summary:{
   promptType:"summary",
   promptGoal:"Elaborar un resumen desarrollado que reduzca la extensión del material sin perder sus ideas, conceptos, argumentos ni relaciones esenciales.",
   promptSources:"Apuntes, transcripciones de clase, diapositivas o bibliografía que se adjuntarán al iniciar la conversación.",
   promptAudience:"Estudiante que necesita estudiar el tema y recuperar sus ideas centrales con precisión.",
   promptOutputSpec:"Texto organizado por títulos y subtítulos, con definiciones, explicaciones, relaciones y una síntesis final.",
   promptRules:"No convertir el resumen en una lista superficial. Eliminar redundancias, mantener matices y no agregar información que no esté respaldada."
  },
  comparison:{
   promptType:"comparison",
   promptGoal:"Comparar los elementos indicados para identificar sus semejanzas, diferencias, relaciones y límites.",
   promptSources:"Textos, apuntes o documentos que desarrollan los conceptos, autores, teorías o procesos que se van a comparar.",
   promptAudience:"Estudiante o lector que necesita comprender con precisión qué distingue a cada elemento.",
   promptOutputSpec:"Cuadro comparativo con criterios equivalentes, seguido de una explicación de las semejanzas, diferencias relevantes y límites de la comparación.",
   promptRules:"No forzar equivalencias. No atribuir a un autor ideas de otro. Fundamentar cada diferencia en el material proporcionado."
  },
  questions:{
   promptType:"questions",
   promptGoal:"Crear un banco amplio de preguntas para evaluar la comprensión y aplicación de los contenidos, cubriendo de manera equilibrada los temas del material.",
   promptSources:"Programa, apuntes, transcripciones, diapositivas y bibliografía que se adjuntarán para construir las preguntas.",
   promptAudience:"Estudiante universitario que prepara una evaluación y necesita detectar lagunas de comprensión.",
   promptOutputSpec:"Preguntas variadas por tema y dificultad, con respuesta correcta y justificación. Incluir distractores plausibles cuando se utilice opción múltiple.",
   promptRules:"Evitar duplicados, ambigüedades y preguntas cuya respuesta no esté sustentada por las fuentes. No revelar la respuesta antes de que el estudiante intente resolver la pregunta si se solicita modo práctica."
  }
 };
 const preset=presets[key];
 if(!preset)return;
 Object.entries(preset).forEach(([id,value])=>{const field=$("#"+id);if(field)field.value=value});
 $("#promptLabOutput").value="";
 updatePromptOutputMeta();
 $("#promptLabStatus").textContent="Estructura cargada. Revisá y personalizá los campos antes de generar el prompt.";
 $("#promptGoal").focus();
}
function promptText(){
 const m=models().find(x=>x.id===$("#studioModel").value)||models()[0],parts=modelPromptSections(m);
 const structure=parts.map((c,i)=>(i+1)+". "+c.title+(c.instruction?" — "+c.instruction:"")).join("\n");
 return [(m.instructions||m.prompt||"Actuá como editor académico y documental."),"TÍTULO: "+($("#docTitle").value.trim()||m.name),
 "MAQUETA: "+m.name+" · "+(m.category||"Personalizada"),"PROFUNDIDAD: "+$("#depth").value,
 "ESTILO EDITORIAL: "+$("#docStyle").value,"ESTRUCTURA Y ORDEN OBLIGATORIOS:\n"+structure,
 "INDICACIONES ADICIONALES: "+($("#extraInstructions").value||"Ninguna."),
 "FUENTES:\n"+($("#sourceText").value.trim()||"[Sin material de entrada]"),
 "Desarrollá cada sección de la maqueta sin omitir apartados activos. No inventes información; si falta un dato, señalalo. No alteres el orden ni mezcles secciones."
 ].join("\n\n");
}
function tab(t){$$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===t));$("#promptOutput").classList.toggle("hidden",t!=="prompt");$("#documentOutputWorkspace").classList.toggle("hidden",t!=="document");if(t==="document")window.DOCULAB_RENDER_OUTPUT_PREVIEW?.()}
function build()function build(){let p=promptText();$("#promptOutput").value=p;tab("prompt");$("#studioStatus").textContent="Prompt preparado. Copialo a tu modelo de lenguaje.";return p}
async function generate(){let p=build(),provider=$("#aiProvider").value;if(provider==="none"){let m=models().find(x=>x.id===$("#studioModel").value)||models()[0],sections=modelPromptSections(m).map(s=>s.title),title=$("#docTitle").value.trim()||m.name;$("#documentOutput").value=title+"\n\n"+sections.map((s,i)=>(i+1)+". "+s+"\n\n[Completar esta sección]\n").join("\n");window.DOCULAB_RENDER_OUTPUT_PREVIEW?.();tab("document");$("#studioStatus").textContent="Estructura creada sin IA. Editá el contenido y revisá la página A4.";return}let endpoint=$("#aiEndpoint").value.replace(/\/$/,"");$("#studioStatus").textContent="Consultando servicio...";try{let r=await fetch(endpoint+"/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider,model:$("#aiModel").value,prompt:p,api_key:""})});if(!r.ok)throw Error("HTTP "+r.status);let d=await r.json();$("#documentOutput").value=d.text||d.response||"";window.DOCULAB_RENDER_OUTPUT_PREVIEW?.();renderObservedUsage(d);tab("document");$("#studioStatus").textContent="Respuesta recibida."}catch(e){$("#studioStatus").textContent="No se pudo conectar: "+e.message;toast("Error de conexión")}}
function saveProject(){if(!$("#promptOutput").value)build();let p={id:currentId||"p_"+Date.now(),title:$("#docTitle").value||"Proyecto sin título",modelId:$("#studioModel").value,updated:new Date().toISOString(),prompt:$("#promptOutput").value,document:$("#documentOutput").value};let i=projects.findIndex(x=>x.id===p.id);if(i<0)projects.unshift(p);else projects[i]=p;currentId=p.id;put("projects",projects);renderLibrary();toast("Proyecto guardado")}
function renderProjects(){$("#projectList").innerHTML=projects.map(p=>'<div class="project-item"><div class="project-icon">▤</div><div class="project-info"><b>'+esc(p.title)+'</b><small>'+new Date(p.updated).toLocaleString("es-AR")+'</small></div><div class="project-actions"><button class="button secondary small" data-open="'+esc(p.id)+'">Abrir</button><button class="button ghost small" data-del="'+esc(p.id)+'">Eliminar</button></div></div>').join("");$("#emptyProjects").classList.toggle("hidden",projects.length>0)}
function download(name,body,type){let u=URL.createObjectURL(new Blob([body],{type})),a=document.createElement("a");a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
function exportLibrary(){download("doculab.json",JSON.stringify({models:custom,projects},null,2),"application/json")}
function renderObservedUsage(data){
 const rate=data?.rate_limits||{},usage=data?.usage||{};
 const lines=[];
 if(rate.requests_limit||rate.tokens_limit){
  lines.push("Límites observados en la última respuesta: "+[
   rate.requests_remaining&&rate.requests_limit?"Solicitudes restantes "+rate.requests_remaining+"/"+rate.requests_limit:"",
   rate.tokens_remaining&&rate.tokens_limit?"Tokens restantes "+Number(rate.tokens_remaining).toLocaleString("es-AR")+"/"+Number(rate.tokens_limit).toLocaleString("es-AR"):"",
   rate.requests_reset?"Reinicio solicitudes: "+rate.requests_reset:"",
   rate.tokens_reset?"Reinicio tokens: "+rate.tokens_reset:""
  ].filter(Boolean).join(" · "));
 }
 if(usage.promptTokenCount||usage.candidatesTokenCount)lines.push("Última consulta Gemini: "+(usage.promptTokenCount||0)+" tokens de entrada · "+(usage.candidatesTokenCount||0)+" de salida.");
 if(lines.length){
  const box=$("#providerLimits");
  const note=document.createElement("p");note.className="observed-limits";note.textContent=lines.join(" ");
  const previous=box.querySelector(".observed-limits");if(previous)previous.remove();box.appendChild(note);
 }
}
let discoveredModels=[],lastSelectedProvider=null;
function applyTheme(theme){
 const chosen=theme==="dark"?"dark":"light";
 document.documentElement.dataset.theme=chosen;
 try{localStorage.setItem("doculab_theme",chosen)}catch(e){}
 const icon=$("#themeIcon"),label=$("#themeLabel"),button=$("#themeToggle");
 if(icon)icon.textContent=chosen==="dark"?"☀":"☾";
 if(label)label.textContent=chosen==="dark"?"Claro":"Oscuro";
 if(button)button.setAttribute("aria-label",chosen==="dark"?"Cambiar a modo claro":"Cambiar a modo oscuro");
}
function updateProviderUI(provider,detect=true){
 $("#aiProvider").value=provider;
 if(provider!==lastSelectedProvider){const defaults={none:"",ollama:"qwen2.5:7b",openai:"gpt-6.1-terra",gemini:"gemini-3.8-flash"};if(lastSelectedProvider!==null||!$("#aiModel").value.trim())$("#aiModel").value=defaults[provider]||"";lastSelectedProvider=provider;discoveredModels=[]}
 $$(".provider-card").forEach(card=>card.classList.toggle("active",card.dataset.provider===provider));
 const names={none:"Sin conexión",ollama:"Ollama local",openai:"OpenAI API",gemini:"Google Gemini"};
 $("#aiProviderState").textContent=provider==="none"?"Sin conexión":(names[provider]+" · pendiente");
 $("#aiProviderDot").classList.add("off");
 const limits=$("#providerLimits");
 const content={
  none:'<b>Sin proveedor</b><p>Podés crear estructuras y preparar prompts. La generación queda en modo manual.</p>',
  ollama:'<b>Costos y límites</b><p>Sin tarifa por token ni cuota de API. El límite práctico depende de la RAM/VRAM, la cuantización y el contexto que soporte el modelo instalado. La velocidad depende de tu equipo.</p><a href="https://ollama.com/library" target="_blank" rel="noopener">Explorar biblioteca de modelos ↗</a>',
  openai:'<b>Costos y límites</b><p>Pago por tokens de entrada y salida. Los límites se miden en RPM/TPM y pueden incluir topes diarios o mensuales. Varían según modelo, organización, proyecto y nivel de uso; no son iguales para todas las cuentas.</p><a href="https://developers.openai.com/api/docs/pricing" target="_blank" rel="noopener">Precios oficiales ↗</a> · <a href="https://developers.openai.com/api/docs/guides/rate-limits" target="_blank" rel="noopener">Límites y tiers ↗</a> · <a href="https://platform.openai.com/settings/organization/limits" target="_blank" rel="noopener">Tus límites ↗</a>',
  gemini:'<b>Costos y límites</b><p>Hay modelos con nivel gratuito y modelos con facturación por tokens. Las cuotas se miden en RPM, TPM y RPD; dependen del modelo, proyecto y nivel de uso. Los valores activos se consultan en AI Studio.</p><a href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noopener">Precios oficiales ↗</a> · <a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener">Límites y niveles ↗</a> · <a href="https://aistudio.google.com/app/usage" target="_blank" rel="noopener">Uso de tu proyecto ↗</a>'
 };
 limits.innerHTML=content[provider]||content.none;
 $("#aiKey").disabled=!["openai","gemini"].includes(provider);
 $("#saveLocalKey").disabled=!["openai","gemini"].includes(provider);
 $("#refreshModels").disabled=provider==="none";
 $("#aiKey").placeholder=provider==="openai"?"Clave API de OpenAI":provider==="gemini"?"Clave API de Gemini":"Ollama no requiere clave API";
 $("#aiKey").previousElementSibling.textContent=provider==="ollama"?"Clave API (no requerida)":provider==="none"?"Clave API (modo manual)":"Clave API";
 $("#modelHint").textContent=provider==="none"?"Sin proveedor: escribí un identificador solo si querés preparar un prompt manual.":provider==="ollama"?"Se listan los modelos instalados en tu servidor Ollama. También podés escribir una etiqueta manualmente.":provider==="openai"?"Se consultan los modelos visibles para tu clave. No todos los modelos de la lista necesariamente admiten el endpoint de chat usado por DOCULAB.":"Se consultan los modelos habilitados para generateContent en tu proyecto.";
 refreshLocalKeyStatus();
 if(detect&&provider!=="none")refreshModels();
 renderModelInfo();
}
function renderModelInfo(){
 const box=$("#modelInfo"),provider=$("#aiProvider").value,id=$("#aiModel").value.trim();
 if(!id){box.innerHTML="<b>Modelo sin seleccionar</b><p>Elegí un modelo detectado o escribí su identificador. Las características se muestran cuando el proveedor las informa.</p>";return}
 const item=discoveredModels.find(x=>x.id===id);
 const specs={
  "gpt-6-astra":{context:"1.050.000",output:"128.000",price:"USD 10 entrada / USD 50 salida por millón de tokens",url:"https://developers.openai.com/api/docs/models/gpt-6-astra"},
  "gpt-6.1-sol":{context:"1.050.000",output:"128.000",price:"USD 2 entrada / USD 10 salida por millón de tokens",url:"https://developers.openai.com/api/docs/models/gpt-6.1-sol"},
  "gpt-6.1-terra":{context:"1.050.000",output:"128.000",price:"USD 1 entrada / USD 5 salida por millón de tokens",url:"https://developers.openai.com/api/docs/models/gpt-6.1-terra"},
  "gpt-6-luna":{context:"1.050.000",output:"128.000",price:"USD 0,10 entrada / USD 0,50 salida por millón de tokens",url:"https://developers.openai.com/api/docs/models/gpt-6-luna"},
  "gemini-3.8-flash":{context:"1.048.576",output:"65.536",price:"USD 0,75 entrada / USD 3,75 salida por millón de tokens hasta el 31/12/2026",url:"https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash"}
 };
 const spec=specs[id]||{};
 let details=[];
 const input=item?.inputTokenLimit||spec.context,output=item?.outputTokenLimit||spec.output;
 if(input)details.push("Entrada/contexto máx.: "+(typeof input==="number"?input.toLocaleString("es-AR"):String(input))+" tokens");
 if(output)details.push("Salida máx.: "+(typeof output==="number"?output.toLocaleString("es-AR"):String(output))+" tokens");
 if(spec.price)details.push(spec.price);
 if(item?.owned_by)details.push("Propietario: "+esc(item.owned_by));
 if(item?.description)details.push(esc(item.description));
 const note=provider==="ollama"?"Modelo local detectado. La ventana real puede depender de la configuración de Ollama y de la memoria disponible.":details.length?"Datos publicados del modelo; los límites de uso de tu cuenta se consultan por separado.":"El modelo está disponible en el catálogo, pero DOCULAB no tiene una ficha técnica verificada para este ID.";
 box.innerHTML="<b>"+esc(id)+"</b><p>"+(details.length?details.join(" · ")+" · ": "")+note+"</p>"+(spec.url?'<a href="'+spec.url+'" target="_blank" rel="noopener">Ficha técnica oficial ↗</a>':"");
}
async function refreshModels(){
 const provider=$("#aiProvider").value,base=$("#aiEndpoint").value.replace(/\/+$/,""),button=$("#refreshModels");
 if(provider==="none")return;
 button.disabled=true;button.textContent="Buscando…";
 try{
  const r=await fetch(base+"/api/models?provider="+encodeURIComponent(provider));
  const d=await r.json();if(!r.ok)throw Error(d.detail||"No se pudieron detectar modelos");
  discoveredModels=d.models||[];
  $("#aiModelSuggestions").innerHTML=discoveredModels.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name||m.id)+'</option>').join("");
  $("#modelHint").textContent=discoveredModels.length+" modelos detectados. Podés seleccionar uno o escribir otro identificador.";
  renderModelInfo();
 }catch(e){
  discoveredModels=[];$("#modelHint").textContent=e.message+" Podés escribir el identificador manualmente.";
  $("#aiModelSuggestions").innerHTML="";
  renderModelInfo();
 }finally{button.disabled=false;button.textContent="↻ Detectar modelos"}
}
async function refreshLocalKeyStatus(){const el=$("#localKeyStatus");if(!el)return;try{const r=await fetch($("#aiEndpoint").value.replace(/\/+$/,"")+"/api/settings");if(!r.ok)throw Error();const d=await r.json();const p=$("#aiProvider").value;el.textContent=p==="openai"?(d.openai_configured?"Clave de OpenAI guardada en esta PC.":"No hay una clave de OpenAI guardada.") :p==="gemini"?(d.gemini_configured?"Clave de Gemini guardada en esta PC.":"No hay una clave de Gemini guardada.") :"Ollama no necesita clave API."}catch{el.textContent="Iniciá DOCULAB con INICIAR_DOCULAB.bat para administrar claves locales."}}
function updateConnection(){const p=settings.provider,names={none:"Modo navegador",ollama:"Ollama local",openai:"OpenAI API",gemini:"Google Gemini"};$("#connectionLabel").textContent=names[p]||"Modo navegador";$("#connectionSub").textContent=p==="none"||!names[p]?"Almacenamiento local":(settings.model||"Modelo sin definir");$("#connectionDot").classList.toggle("off",p==="none"||!names[p])}
function init(){renderLibrary();renderSelect();renderStudioModelSummary();renderPromptLayoutPreview();updateConnection();$("#aiEndpoint").value=settings.endpoint;$("#aiModel").value=settings.model;$("#aiKey").value="";updateProviderUI(settings.provider||"none",false);refreshLocalKeyStatus()}
$$(".nav-item[data-view]").forEach(b=>b.onclick=()=>go(b.dataset.view));$$("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));$("#mobileMenu").onclick=()=>$("#sidebar").classList.toggle("open");$("#searchInput").oninput=renderLibrary;$("#categoryFilter").onchange=renderLibrary;$("#sortFilter").onchange=renderLibrary;$("#modelGrid").onclick=e=>{let edit=e.target.closest("[data-edit-model]"),view=e.target.closest("[data-model]");if(edit)editModel(edit.dataset.editModel);else if(view)showModel(view.dataset.model)};$("#newModelTop").onclick=()=>go("builder");$("#closeModal").onclick=()=>$("#modelModal").classList.add("hidden");$("#modelModal").onclick=e=>{if(e.target.id==="modelModal")e.currentTarget.classList.add("hidden")};$("#studioModel").onchange=e=>activeId=e.target.value;$("#buildPrompt").onclick=build;$("#generateDoc").onclick=generate;$("#designPrompt").onclick=designPromptLab;document.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>applyPromptPreset(b.dataset.preset));$("#promptUseLayout").onchange=()=>{$("#promptLayoutOptions").classList.toggle("hidden",!$("#promptUseLayout").checked);if($("#promptUseLayout").checked&&!$("#promptLayoutModel").value){const defaultId=models().find(m=>m.id==="guide-academic-modular")?.id||models()[0]?.id||"";$("#promptLayoutModel").value=defaultId}renderPromptLayoutPreview()};$("#promptLayoutModel").onchange=renderPromptLayoutPreview;$("#studioModel").onchange=()=>{activeId=$("#studioModel").value;renderStudioModelSummary();$("#structuredEditor").classList.add("hidden")};$("#promptLabOutput").addEventListener("input",updatePromptOutputMeta);updatePromptOutputMeta();$("#clearPromptLab").onclick=clearPromptLab;$("#copyPromptLab").onclick=()=>copy($("#promptLabOutput").value);$("#usePromptInStudio").onclick=()=>{const layout=$("#promptUseLayout").checked?$("#promptLayoutModel").value:"";if(layout&&models().some(m=>m.id===layout)){$("#studioModel").value=layout;activeId=layout;renderStudioModelSummary()}go("studio");$("#promptOutput").value=$("#promptLabOutput").value;tab("prompt");$("#studioStatus").textContent=layout?"Prompt transferido. La maqueta seleccionada quedó aplicada en el estudio.":"Prompt transferido desde el Generador de prompts."};$("#copyPrompt").onclick=()=>copy($("#promptOutput").value||build());$("#saveProject").onclick=saveProject;$$(".tab").forEach(b=>b.onclick=()=>tab(b.dataset.tab));$("#projectList").onclick=e=>{let o=e.target.closest("[data-open]"),d=e.target.closest("[data-del]");if(o){let p=projects.find(x=>x.id===o.dataset.open);currentId=p.id;renderSelect();$("#studioModel").value=p.modelId;$("#docTitle").value=p.title;$("#promptOutput").value=p.prompt;$("#documentOutput").value=p.document;window.DOCULAB_RENDER_OUTPUT_PREVIEW?.();tab(p.document?"document":"prompt");go("studio")}if(d){projects=projects.filter(x=>x.id!==d.dataset.del);put("projects",projects);renderProjects()}};$("#exportLibrary").onclick=exportLibrary;$("#importLibrary").onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);custom=[...(d.models||[]),...custom];projects=[...(d.projects||[]),...projects];put("models",custom);put("projects",projects);init();toast("Importación completa")}catch{toast("JSON inválido")}};r.readAsText(f)};$("#exportHtml").onclick=()=>{if(!$("#structuredEditor").classList.contains("hidden")){$("#structuredExport").click();return}download("doculab.html","<!doctype html><meta charset=utf-8><title>DOCULAB</title><h1>"+esc($("#docTitle").value)+"</h1><pre>"+esc($("#documentOutput").value)+"</pre>","text/html")};$("#printPdf").onclick=()=>{if(!$("#structuredEditor").classList.contains("hidden")){$("#structuredPrint").click();return}tab("document");window.print()};$("#saveSettings").onclick=()=>{settings={provider:$("#aiProvider").value,endpoint:$("#aiEndpoint").value,model:$("#aiModel").value};put("settings",settings);updateConnection();toast("Configuración guardada")};$("#saveLocalKey").onclick=async()=>{const provider=$("#aiProvider").value,key=$("#aiKey").value.trim();if(!["openai","gemini"].includes(provider)){$("#localKeyStatus").textContent="Elegí OpenAI o Gemini para guardar una clave.";return}if(!key){$("#localKeyStatus").textContent="Pegá una clave API antes de guardarla.";return}const button=$("#saveLocalKey");button.disabled=true;$("#localKeyStatus").textContent="Guardando la clave en esta PC…";try{const r=await fetch($("#aiEndpoint").value.replace(/\/+$/,"")+"/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider,api_key:key})});const d=await r.json();if(!r.ok)throw Error(d.detail||"No se pudo guardar");$("#aiKey").value="";$("#localKeyStatus").textContent="Clave guardada localmente en local_server/.env. No se muestra ni se envía desde el navegador en las próximas consultas.";toast("Clave guardada en este equipo")}catch(e){$("#localKeyStatus").textContent="No se pudo guardar: "+e.message}finally{button.disabled=false}};$("#aiProvider").onchange=()=>updateProviderUI($("#aiProvider").value);$$(".provider-card").forEach(card=>card.onclick=()=>updateProviderUI(card.dataset.provider));$("#refreshModels").onclick=refreshModels;$("#aiModel").oninput=renderModelInfo;$("#aiEndpoint").onchange=()=>{if($("#aiProvider").value!=="none")refreshModels()};$("#themeToggle").onclick=()=>applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");applyTheme(document.documentElement.dataset.theme||"light");$("#testConnection").onclick=async()=>{const provider=$("#aiProvider").value;if(provider==="none"){$("#connectionMessage").textContent="Elegí primero un proveedor.";return}$("#connectionMessage").textContent="Probando proveedor y modelo…";try{let r=await fetch($("#aiEndpoint").value.replace(/\/$/,"")+"/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider,model:$("#aiModel").value,prompt:"Respondé únicamente: DOCULAB OK",api_key:""})});let d=await r.json();if(!r.ok)throw Error(d.detail||"HTTP "+r.status);$("#connectionMessage").textContent="Conexión correcta · "+(d.provider||provider)+" · "+(d.model||$("#aiModel").value);renderObservedUsage(d);$("#aiProviderDot").classList.remove("off");$("#aiProviderState").textContent="Conexión verificada"}catch(e){$("#connectionMessage").textContent="Error de conexión: "+e.message;$("#aiProviderDot").classList.add("off");$("#aiProviderState").textContent="No conectado"}};$("#clearData").onclick=()=>{if(confirm("¿Eliminar los datos locales?")){localStorage.removeItem("doculab_models");localStorage.removeItem("doculab_projects");localStorage.removeItem("doculab_templates");custom=[];projects=[];init();renderProjects();window.dispatchEvent(new CustomEvent("doculab:templates-changed"))}};document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#modelModal").classList.add("hidden");if(e.metaKey||e.ctrlKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||""))return;const v={1:"promptlab",2:"library",3:"studio",4:"builder",5:"projects"}[e.key];if(v)go(v)});document.addEventListener("click",e=>{if(!e.target.closest("#sidebar,#mobileMenu"))$("#sidebar").classList.remove("open")});window.addEventListener("doculab:templates-changed",()=>{renderLibrary();renderSelect();renderStudioModelSummary();renderPromptLayoutPreview()});init();if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});