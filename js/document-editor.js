(() => {
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let sections=[],title="";
const templates=()=>{try{return JSON.parse(localStorage.getItem("doculab_templates")||"[]")}catch{return []}};
function activeModel(){const id=$("#studioModel")?.value;return (window.DOCULAB_GET_MODEL&&window.DOCULAB_GET_MODEL(id))||templates().find(x=>x.id===id)||null}
function notify(message){const t=$("#toast");if(t){t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}}
function source(){return $("#sourceText")?.value||""}
function modelName(){return activeModel()?.name||"Documento DOCULAB"}
function inline(text){
 return esc(text).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>");
}
function contentBlocks(text){
 const lines=String(text||"").replace(/\r/g,"").split("\n");
 const blocks=[];let paragraph=[],list=[],listType="";
 const flushParagraph=()=>{
  if(!paragraph.length)return;
  const raw=paragraph.join(" ").trim();
  if(raw){
   const sentences=raw.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[raw];
   let chunk=[],count=0;
   const pushChunk=()=>{
    if(!chunk.length)return;
    const part=chunk.join(" ").trim();
    blocks.push({kind:"paragraph",html:"<p>"+inline(part)+"</p>",weight:Math.max(12,Math.ceil(part.split(/\s+/).length*1.05))});
    chunk=[];count=0;
   };
   for(const sentence of sentences){
    const words=sentence.trim().split(/\s+/);
    if(count&&count+words.length>125)pushChunk();
    if(words.length>150){
     pushChunk();
     for(let i=0;i<words.length;i+=125){
      const part=words.slice(i,i+125).join(" ");
      blocks.push({kind:"paragraph",html:"<p>"+inline(part)+"</p>",weight:Math.max(12,Math.ceil(part.split(/\s+/).length*1.05))});
     }
    }else{chunk.push(sentence.trim());count+=words.length}
   }
   pushChunk();
  }
  paragraph=[];
 };
 const flushList=()=>{
  if(!list.length)return;
  const tag=listType==="ordered"?"ol":"ul";
  for(let i=0;i<list.length;i+=10){
   const part=list.slice(i,i+10);
   blocks.push({kind:"list",html:"<"+tag+">"+part.map(x=>"<li>"+inline(x)+"</li>").join("")+"</"+tag+">",weight:part.length*17});
  }
  list=[];listType="";
 };
 for(const raw of lines){
  const line=raw.trim();
  if(!line){flushParagraph();flushList();continue}
  const heading=line.match(/^(#{1,3})\s+(.+)$/);
  const bullet=line.match(/^[-*•]\s+(.+)$/);
  const ordered=line.match(/^\d+[.)]\s+(.+)$/);
  if(heading){flushParagraph();flushList();const level=heading[1].length;blocks.push({kind:level<=2?"section-heading":"subheading",html:level<=2?"<h2>"+inline(heading[2])+"</h2>":"<h3>"+inline(heading[2])+"</h3>",weight:level<=2?34:20});continue}
  if(bullet||ordered){
   flushParagraph();const type=bullet?"unordered":"ordered";
   if(list.length&&listType!==type)flushList();
   listType=type;list.push((bullet||ordered)[1]);continue;
  }
  if(line.startsWith(">")){flushParagraph();flushList();blocks.push({kind:"quote",html:"<blockquote>"+inline(line.replace(/^>\s?/,""))+"</blockquote>",weight:24});continue}
  flushList();paragraph.push(line);
 }
 flushParagraph();flushList();
 return blocks;
}
function paginate(blocks,maxWords=220){
 const pages=[[]];let used=0;
 for(const block of blocks){
  const weight=block.weight||20;
  if(pages[pages.length-1].length&&used+weight>maxWords){pages.push([]);used=0}
  pages[pages.length-1].push(block);used+=weight;
 }
 return pages;
}
function renderPages(documentTitle,blocks,description="Documento preparado en DOCULAB"){
 const model=activeModel(),pages=paginate(blocks);
 const date=new Date().toLocaleDateString("es-AR",{year:"numeric",month:"long",day:"numeric"});
 const cover='<article class="document-a4-page document-cover-page"><div class="doc-page-brand"><b>DOCULAB</b><span>DOCUMENT STUDIO</span></div><div class="doc-cover-center"><span class="doc-cover-overline">'+esc(model?.category||"DOCUMENTO")+'</span><h1>'+esc(documentTitle||"Documento sin título")+'</h1><p>'+esc(description||model?.description||"Documento preparado en DOCULAB")+'</p><div class="doc-cover-accent"></div></div><div class="doc-cover-footer"><span>'+esc(model?.name||"Maqueta DOCULAB")+'</span><span>'+esc(date)+'</span></div></article>';
 const body=pages.map((page,i)=>'<article class="document-a4-page document-content-page"><header class="doc-running-head"><b>DOCULAB</b><span>'+esc(documentTitle||"Documento")+'</span></header><main class="doc-page-content">'+page.map(block=>block.html).join("")+'</main><footer class="doc-page-footer"><span>'+esc(model?.name||"DOCUMENT STUDIO")+'</span><span>PÁGINA '+(i+2)+'</span></footer></article>').join("");
 return '<div class="document-a4-pages">'+cover+body+'</div>';
}
function updateMeta(selector,pageCount,wordCount){
 const host=$(selector);if(host)host.textContent="Formato A4 · "+pageCount+" página(s) · "+wordCount+" palabras";
}
function renderOutputPreview(){
 const host=$("#studioDocumentPreview");if(!host)return;
 const raw=$("#documentOutput")?.value||"",docTitle=$("#docTitle")?.value.trim()||"Documento sin título";
 if(!raw.trim()){
  host.innerHTML='<div class="studio-preview-empty"><span>▤</span><b>La página A4 aparecerá aquí</b><p>Generá un borrador o pegá el contenido en el editor para previsualizar el PDF.</p></div>';
  updateMeta("#studioPreviewMeta",0,0);return;
 }
 let body=raw.trim();
 const first=body.split("\n")[0]?.trim();
 if(first&&normalizeSectionHeading(first)===normalizeSectionHeading(docTitle))body=body.split("\n").slice(1).join("\n").trim();
 const blocks=contentBlocks(body),pages=paginate(blocks).length+1,words=raw.trim().split(/\s+/).length;
 host.innerHTML=renderPages(docTitle,blocks,"Contenido editable · "+modelName());
 updateMeta("#studioPreviewMeta",pages,words);
}
window.DOCULAB_RENDER_OUTPUT_PREVIEW=renderOutputPreview;
function structuredBlocks(){
 const blocks=[];
 sections.forEach((section,index)=>{
  blocks.push({kind:"section-title",html:'<h2><span>'+String(index+1).padStart(2,"0")+'</span>'+esc(section.title)+'</h2>',weight:14});
  const body=contentBlocks(section.content);
  if(body.length)blocks.push(...body);
  else blocks.push({kind:"placeholder",html:'<p class="doc-placeholder">El contenido de esta sección todavía no fue completado.</p>',weight:20});
 });
 return blocks;
}
function normalizeSectionHeading(value){
 return String(value||"").replace(/^#{1,3}\s*/,"").replace(/^\d+(?:[.)]|[·—-])\s*/,"").replace(/\*\*/g,"").replace(/^\*|\*$/g,"").replace(/[：:]$/,"").trim().toLocaleLowerCase();
}
function importExistingDocument(raw,components){
 const text=String(raw||"").trim();if(!text)return {matched:0,usedFallback:false};
 const lines=text.replace(/\r/g,"").split("\n");
 const normalized=components.map((c,index)=>({index,title:normalizeSectionHeading(c.title)}));
 const marks=[];
 lines.forEach((line,index)=>{
  const name=normalizeSectionHeading(line);
  if(!name)return;
  const match=normalized.find(c=>c.title===name);
  if(match)marks.push({line:index,index:match.index});
 });
 if(!marks.length){
  const first=text.split("\n")[0]?.trim();
  const body=first&&first.toLocaleLowerCase()===(title||"").toLocaleLowerCase()?lines.slice(1).join("\n").trim():text;
  if(body&&sections.length)sections[0].content=body;
  return {matched:0,usedFallback:!!body};
 }
 marks.forEach((mark,i)=>{
  const next=marks[i+1],content=lines.slice(mark.line+1,next?next.line:lines.length).join("\n").trim();
  if(sections[mark.index])sections[mark.index].content=content;
 });
 return {matched:marks.length,usedFallback:false};
}
function build(){
 const model=activeModel();let comps=(model?.components||[]).filter(c=>c.enabled!==false).sort((a,b)=>(a.order??0)-(b.order??0));
 if(!comps.length&&model?.structure)comps=String(model.structure).split(";").map((name,i)=>({id:"section-"+i,title:name.trim(),instruction:"Desarrollar esta sección con precisión y coherencia.",enabled:true,order:i})).filter(c=>c.title);
 if(!comps.length){notify("Este modelo no tiene componentes configurados.");return}
 title=$("#docTitle").value.trim()||model.name||"Documento sin título";
 sections=comps.map((c,i)=>({id:c.id||"section-"+i,title:c.title||"Sección "+(i+1),instruction:c.instruction||"",content:""}));
 const imported=importExistingDocument($("#documentOutput").value,comps);
 renderEditor();$("#documentOutputWorkspace").classList.add("hidden");$("#structuredEditor").classList.remove("hidden");
 $("#studioStatus").textContent=imported.matched?"Contenido distribuido en "+imported.matched+" sección(es). Revisá los campos y la vista A4.":imported.usedFallback?"El texto existente se cargó en la primera sección. Podés redistribuirlo y editarlo.":"Editor por secciones creado con la maqueta «"+(model.name||"DOCULAB")+"». La vista A4 se actualiza al escribir.";
}
function renderEditor(){
 const host=$("#sectionEditors");
 host.innerHTML=sections.map((s,i)=>'<section class="editable-section" data-section="'+i+'"><div class="editable-section-head"><div><span class="section-number">'+String(i+1).padStart(2,"0")+'</span><b>'+esc(s.title)+'</b></div><button class="button secondary small" data-generate="'+i+'" type="button">Generar sección con IA</button></div>'+(s.instruction?'<p class="section-instruction">'+esc(s.instruction)+'</p>':'')+'<textarea data-content="'+i+'" rows="7" placeholder="Escribí o pegá el contenido de '+esc(s.title.toLowerCase())+'...">'+esc(s.content)+'</textarea></section>').join("");
 renderPreview();
}
function renderPreview(){
 const host=$("#documentLivePreview");if(!host)return;
 const blocks=structuredBlocks();
 const words=sections.reduce((sum,s)=>sum+(s.content.trim()?s.content.trim().split(/\s+/).length:0),0);
 const count=paginate(blocks).length+1;
 host.innerHTML=renderPages(title||$("#docTitle").value||"Documento sin título",blocks,modelName());
 const meta=host.parentElement?.querySelector(".preview-meta span");
 if(meta)meta.textContent="A4 · "+count+" página(s) · "+words+" palabras";
}
function syncOutput(){
 const out=[title,"",...sections.flatMap((s,i)=>[(i+1)+". "+s.title,"",s.content.trim()||"[Sin completar]",""])].join("\n");
 $("#documentOutput").value=out;renderPreview();renderOutputPreview();
}
async function generateSection(index,button){
 const s=sections[index],provider=$("#aiProvider").value;if(!s)return;
 if(provider==="none"){notify("Configurá un proveedor en Settings para usar IA.");return}
 const model=activeModel(),endpoint=($("#aiEndpoint").value||"http://localhost:8000").replace(/\/+$/,"");
 const prompt='Redactá únicamente la sección "'+s.title+'" para el documento "'+title+'".\nInstrucción específica: '+(s.instruction||"Desarrollar la sección con rigor y claridad.")+'\nInstrucciones generales del modelo: '+(model?.instructions||model?.prompt||"")+'\nEstilo: '+$("#docStyle").value+'. Profundidad: '+$("#depth").value+'.\nIndicaciones adicionales: '+($("#extraInstructions").value||"Ninguna")+'\nMaterial fuente:\n'+(source()||"[No se proporcionó material]")+'\n\nReglas: no inventes datos, citas ni referencias. Si el material no alcanza, indicá qué falta. Entregá solo el contenido de esta sección.';
 const old=button.textContent;button.disabled=true;button.textContent="Generando…";
 try{const r=await fetch(endpoint+"/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider,model:$("#aiModel").value,prompt,api_key:""})});const data=await r.json();if(!r.ok)throw Error(data.detail||"HTTP "+r.status);sections[index].content=data.text||"";renderEditor();syncOutput();$("#studioStatus").textContent="Sección generada. Podés editarla antes de exportar."}
 catch(e){notify("No se pudo generar: "+e.message)}
 finally{const current=$('[data-generate="'+index+'"]');if(current){current.disabled=false;current.textContent=old}}
}
function init(){
 if(!$("#buildStructuredDoc"))return;
 $("#buildStructuredDoc").addEventListener("click",build);
 const configureProvider=()=>{const p=$("#aiProvider").value,defaults={ollama:"qwen2.5:7b",openai:"gpt-4o-mini",gemini:"gemini-2.5-flash"};const hints={ollama:"Nombre exacto del modelo descargado en Ollama.",openai:"ID del modelo habilitado en tu cuenta de OpenAI.",gemini:"ID del modelo disponible en Google AI Studio.",none:"Sin IA: podés editar y exportar documentos manualmente."};if(defaults[p]&&!$("#aiModel").value)$("#aiModel").value=defaults[p];$("#modelHint").textContent=hints[p]||"Escribí el identificador exacto del modelo.";};
 $("#aiProvider").addEventListener("change",configureProvider);configureProvider();
 $("#documentOutput").addEventListener("input",renderOutputPreview);
 $("#studioModel").addEventListener("change",()=>{if(sections.length){$("#structuredEditor").classList.add("hidden");sections=[]}renderOutputPreview()});
 $("#sectionEditors").addEventListener("input",e=>{if(e.target.matches("[data-content]")){sections[Number(e.target.dataset.content)].content=e.target.value;syncOutput()}});
 $("#sectionEditors").addEventListener("click",e=>{const b=e.target.closest("[data-generate]");if(b)generateSection(Number(b.dataset.generate),b)});
 $("#docTitle").addEventListener("input",()=>{if(sections.length){title=$("#docTitle").value;renderPreview();syncOutput()}else renderOutputPreview()});
 $("#structuredPrint").addEventListener("click",()=>{syncOutput();window.print()});
 $("#structuredExport").addEventListener("click",()=>{syncOutput();const css='@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#eef0f4;color:#202735;font-family:Georgia,serif}.document-a4-page{width:210mm;height:297mm;min-height:297mm;position:relative;overflow:hidden;margin:10mm auto;background:#fff;padding:25mm 24mm 23mm;page-break-after:always}.doc-page-brand,.doc-running-head,.doc-page-footer,.doc-cover-footer{font:8pt Arial,sans-serif;color:#697386;letter-spacing:1px}.doc-cover-center{margin-top:47mm}.doc-cover-overline{font:8pt Arial;letter-spacing:2px;color:#6475c8}.doc-cover-center h1{font:700 30pt/1.2 Arial;margin:13mm 0 8mm}.doc-cover-center p,.doc-page-content p,.doc-page-content li{font:10.5pt/1.75 Georgia,serif}.doc-page-content h2{font:700 16pt Arial;border-bottom:1px solid #dfe3e9;padding-bottom:4mm}.doc-page-content h3{font:700 12pt Arial}.doc-page-content blockquote{border-left:2px solid #6878c8;padding:4mm 6mm;background:#f6f7fa}.doc-running-head{display:flex;justify-content:space-between;border-bottom:1px solid #dfe3e9;padding-bottom:5mm}.doc-page-content{padding-top:12mm}.doc-page-footer,.doc-cover-footer{position:absolute;bottom:13mm;left:24mm;right:24mm;display:flex;justify-content:space-between;border-top:1px solid #dfe3e9;padding-top:5mm}@media print{body{background:#fff}.document-a4-page{margin:0;box-shadow:none}}';const full='<!doctype html><html lang="es"><meta charset="utf-8"><title>'+esc(title)+'</title><style>'+css+'</style><body>'+$("#documentLivePreview").innerHTML+'</body></html>';const a=document.createElement("a"),u=URL.createObjectURL(new Blob([full],{type:"text/html"}));a.href=u;a.download=(title||"documento").replace(/[^\w-]+/g,"-")+".html";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)});
 renderOutputPreview();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();