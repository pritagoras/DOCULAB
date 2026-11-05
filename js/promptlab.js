/* ==========================================================================
   DOCULAB · Diseñador de prompts v2
   Reemplaza el contenido de #view-promptlab. Usa las funciones globales de
   app.js ($, $$, get, put, esc, toast, copy, go, tab, renderObservedUsage).
   Las opciones viven en js/promptlab-catalog.js.
   ========================================================================== */
(function () {
  "use strict";
  const C = window.PROMPTLAB_CATALOG, root = document.querySelector("#view-promptlab");
  if (!C || !root) return;

  const K_DRAFT = "promptlab_draft", K_RECIPES = "promptlab_recipes", K_CUSTOM = "promptlab_custom";
  const blank = () => ({ task: "libre", goal: "", sources: "", output: "", depth: "Intermedia", layoutId: "", useLayout: false,
    tones: [], formality: 3, voice: "impersonal", variant: "rioplatense", rules: ["no-inventar"],
    formats: [], fewshot: "", notes: "" });

  let S = Object.assign(blank(), get(K_DRAFT, {}));
  let custom = Object.assign({ rules: [], tones: [] }, get(K_CUSTOM, {}));
  let recipes = get(K_RECIPES, []);
  let directDirty = false, activeTab = "direct";

  const allTones = () => [...C.tones, ...custom.tones];
  const ruleGroups = () => custom.rules.length ? [...C.rules, { group: "Mis reglas", items: custom.rules }] : C.rules;
  const allRules = () => ruleGroups().flatMap(g => g.items);
  const byId = (list, id) => list.find(x => x.id === id);
  const task = () => byId(C.tasks, S.task) || C.tasks[C.tasks.length - 1];
  const toggle = (arr, id) => arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

  /* ---------- Esqueleto ---------- */
  root.innerHTML = `
  <div class="page-heading"><div>
    <div class="eyebrow">INGENIERÍA DE PROMPTS</div><h1>Diseñador de prompts</h1>
    <p>Elegí el tipo de trabajo, ajustá el tono y las reglas, y obtené un prompt listo para usar. Si querés, una IA lo refina.</p>
  </div></div>
  <div class="promptlab-layout pl2">
    <div class="panel promptlab-form">
      <section class="pl-block">
        <div class="pl-head"><h2>¿Qué tipo de trabajo es?</h2><p>Al elegir uno se precargan tono, reglas y formato. Después podés cambiar todo.</p></div>
        <div id="plTasks" class="pl-taskgrid" role="radiogroup" aria-label="Tipo de trabajo"></div>
      </section>

      <section class="pl-block">
        <div class="pl-head"><h2>Brief</h2><p>Contá el resultado que querés, no las instrucciones técnicas.</p></div>
        <div class="pl-examples"><span class="muted">Probá con un ejemplo:</span><span id="plExamples"></span></div>
        <label class="field-label" for="plGoal">¿Qué querés conseguir?</label>
        <textarea id="plGoal" rows="3" placeholder="Ej. Un resumen completo de una clase, útil para estudiar para un parcial."></textarea>
        <label class="field-label" for="plSources">¿Qué materiales recibirá la IA?</label>
        <textarea id="plSources" rows="3" placeholder="Ej. La transcripción de la clase y el PDF con las diapositivas del profesor."></textarea>
        <label class="field-label" for="plOutput">¿Cómo debería ser el resultado?</label>
        <textarea id="plOutput" rows="3" placeholder="Ej. Ordenado por temas, con definiciones, relaciones y ejemplos."></textarea>
      </section>

      <section class="pl-block">
        <div class="pl-head"><h2>Tono y voz</h2><p>Se combinan: podés elegir varios tonos a la vez.</p></div>
        <label class="field-label" for="plFormality">Formalidad: <b id="plFormalityLabel"></b></label>
        <input id="plFormality" type="range" min="1" max="5" step="1" class="pl-range">
        <div class="pl-range-ends"><span>Coloquial</span><span>Formal</span></div>
        <label class="field-label">Tonos</label>
        <div id="plTones" class="pl-chips"></div>
        <div class="pl-add"><input id="plNewTone" placeholder="Tono propio. Ej. Irónico pero respetuoso" aria-label="Nuevo tono propio"><button class="button secondary small" id="plAddTone" type="button">Agregar</button></div>
        <div class="two-fields">
          <div><label class="field-label" for="plVoice">Voz</label><select id="plVoice"></select></div>
          <div><label class="field-label" for="plVariant">Idioma y variante</label><select id="plVariant"></select></div>
        </div>
      </section>

      <section class="pl-block">
        <div class="pl-head"><h2>Resultado</h2><p>Nivel de desarrollo y forma de la entrega.</p></div>
        <label class="field-label" for="plDepth">Profundidad</label><select id="plDepth"></select>
        <label class="field-label">Formato de salida</label>
        <div id="plFormats" class="pl-chips"></div>
      </section>

      <section class="pl-block">
        <div class="pl-head"><h2>Reglas</h2><p>Cada regla activa agrega una instrucción al prompt.</p></div>
        <div id="plRules"></div>
        <div class="pl-add"><input id="plNewRule" placeholder="Regla propia. Ej. Usá siempre ejemplos de Argentina" aria-label="Nueva regla propia"><button class="button secondary small" id="plAddRule" type="button">Agregar</button></div>
      </section>

      <section class="pl-block">
        <div class="pl-head"><h2>Ejemplo y notas</h2><p>Opcional. Un ejemplo de salida enseña el estilo mejor que cualquier descripción.</p></div>
        <label class="field-label" for="plFewshot">Ejemplo de cómo debería verse el resultado</label>
        <textarea id="plFewshot" rows="4" placeholder="Pegá un fragmento modelo. La IA imitará el formato y el estilo, no el contenido."></textarea>
        <label class="field-label" for="plNotes">Notas adicionales</label>
        <textarea id="plNotes" rows="2" placeholder="Cualquier otra indicación particular."></textarea>
      </section>

<section class="pl-block pl-layout-block"><div class="pl-head"><h2>Maqueta del documento</h2><p>Elegí opcionalmente la estructura PDF en la que querés organizar el resultado.</p></div><label class="pl-layout-toggle"><input type="checkbox" id="plUseLayout"><span><b>Preparar el resultado para una maqueta PDF</b><small>El prompt respetará los títulos, el orden y las instrucciones de la plantilla elegida.</small></span></label><div id="plLayoutOptions" class="pl-layout-options hidden"><label class="field-label" for="plLayoutModel">Maqueta de la Biblioteca</label><select id="plLayoutModel"><option value="">Cargando maquetas…</option></select><div id="plLayoutPreview" class="pl-layout-preview"><span class="muted">Seleccioná una maqueta para ver una vista previa.</span></div><p class="muted pl-layout-note">La selección se conserva al enviar el prompt al estudio. Pegá allí la respuesta de la IA, distribuí el contenido por secciones y exportá el PDF A4.</p></div></section>
      <section class="pl-block pl-recipes">
        <div class="pl-head"><h2>Mis recetas</h2><p>Guardá esta configuración para reutilizarla.</p></div>
        <div id="plRecipes" class="pl-chips"></div>
        <div class="button-row"><button class="button secondary" id="plSaveRecipe" type="button">Guardar como receta</button><button class="button ghost" id="plClear" type="button">Limpiar todo</button></div>
      </section>
    </div>

    <div class="panel promptlab-result pl-result">
      <div class="tabbar pl-tabs" role="tablist">
        <button class="tab active" role="tab" data-pltab="direct" id="plTabDirect">Prompt listo</button>
        <button class="tab" role="tab" data-pltab="ai" id="plTabAi">Refinado con IA</button>
      </div>
      <div id="plPaneDirect">
        <p class="muted pl-hint">Se arma solo a medida que completás el formulario. No usa IA.</p>
        <textarea id="plOutDirect" class="promptlab-output" rows="24" spellcheck="false" aria-label="Prompt listo"></textarea>
      </div>
      <div id="plPaneAi" class="hidden">
        <p class="muted pl-hint" id="plAiHint"></p>
        <textarea id="plOutAi" class="promptlab-output" rows="24" spellcheck="false" aria-label="Prompt refinado con IA" placeholder="Acá aparece el resultado de “Refinar con IA”."></textarea>
      </div>
      <div class="pl-meta"><span id="plCount">0 caracteres</span><button class="button ghost small hidden" id="plRegen" type="button">Volver a generar</button></div>
      <div class="button-row">
        <button class="button primary" id="plCopy" type="button">Copiar prompt</button>
        <button class="button secondary" id="plToStudio" type="button">Enviar al estudio</button>
        <button class="button secondary" id="plRefine" type="button">Refinar con IA</button>
      </div>
      <small class="muted" id="plStatus" aria-live="polite"></small>
    </div>
  </div>`;

  /* ---------- Render de partes dinámicas ---------- */
  const chip = (attr, id, label, on, extra = "") =>
    `<button type="button" class="pl-chip${on ? " on" : ""}" ${attr}="${esc(id)}" aria-pressed="${on}"${extra}>${esc(label)}</button>`;

  function renderTasks() {
    $("#plTasks").innerHTML = C.tasks.map(t =>
      `<button type="button" class="pl-task${t.id === S.task ? " on" : ""}" role="radio" aria-checked="${t.id === S.task}" data-task="${t.id}">
         <b>${esc(t.label)}</b><small>${esc(t.desc)}</small></button>`).join("");
  }
  function renderExamples() {
    $("#plExamples").innerHTML = C.examples.map((e, i) => `<button type="button" class="pl-link" data-example="${i}">${esc(e.label)}</button>`).join("");
  }
  function renderTones() {
    $("#plTones").innerHTML = allTones().map(t => chip("data-tone", t.id, t.label, S.tones.includes(t.id))).join("");
  }
  function renderFormats() {
    $("#plFormats").innerHTML = C.formats.map(f => chip("data-format", f.id, f.label, S.formats.includes(f.id))).join("");
  }
  function renderRules() {
    $("#plRules").innerHTML = ruleGroups().map((g, i) => {
      const active = g.items.filter(r => S.rules.includes(r.id)).length;
      return `<details class="pl-group"${i === 0 || active ? " open" : ""}><summary>${esc(g.group)}${active ? ` <span class="pl-count">${active}</span>` : ""}</summary>
        <div class="pl-chips">${g.items.map(r => chip("data-rule", r.id, r.label, S.rules.includes(r.id), ` title="${esc(r.text)}"`)).join("")}</div></details>`;
    }).join("");
  }
  function renderRecipes() {
    $("#plRecipes").innerHTML = recipes.length
      ? recipes.map((r, i) => `<span class="pl-recipe"><button type="button" class="pl-chip" data-recipe="${i}">${esc(r.name)}</button><button type="button" class="pl-x" data-recipe-del="${i}" aria-label="Eliminar receta ${esc(r.name)}">×</button></span>`).join("")
      : `<span class="muted">Todavía no guardaste ninguna.</span>`;
  }
  function fillStatic() {
    $("#plVoice").innerHTML = C.voices.map(v => `<option value="${v.id}">${esc(v.label)}</option>`).join("");
    $("#plVariant").innerHTML = C.variants.map(v => `<option value="${v.id}">${esc(v.label)}</option>`).join("");
    $("#plDepth").innerHTML = C.depths.map(d => `<option>${esc(d)}</option>`).join("");
  }
  function syncFields() {
    $("#plGoal").value = S.goal; $("#plSources").value = S.sources; $("#plOutput").value = S.output;
    $("#plFewshot").value = S.fewshot; $("#plNotes").value = S.notes;
    $("#plVoice").value = S.voice; $("#plVariant").value = S.variant; $("#plDepth").value = S.depth;
    $("#plFormality").value = S.formality;
    $("#plUseLayout").checked=!!S.useLayout;$("#plLayoutOptions").classList.toggle("hidden",!S.useLayout);$("#plLayoutModel").value=S.layoutId||"";renderLayoutPreview();
    $("#plFormalityLabel").textContent = ["Muy coloquial", "Cercana", "Neutra", "Formal", "Muy formal"][S.formality - 1];
  }
  function renderAll(){renderTasks();renderExamples();renderTones();renderFormats();renderRules();renderRecipes();renderLayoutOptions();syncFields();}
  function renderLayoutOptions(){
    const select=$("#plLayoutModel"),items=window.DOCULAB_LIST_MODELS?window.DOCULAB_LIST_MODELS():[];
    if(!select)return;select.innerHTML='<option value="">Elegir una maqueta…</option>'+items.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name)+' · '+esc(m.category||"Personalizada")+'</option>').join("");
    select.value=items.some(m=>m.id===S.layoutId)?S.layoutId:"";if(!select.value)S.layoutId="";renderLayoutPreview();
  }
  function renderLayoutPreview(){
    const host=$("#plLayoutPreview"),m=window.DOCULAB_GET_MODEL?window.DOCULAB_GET_MODEL(S.layoutId):null;if(!host)return;
    if(!m){host.innerHTML='<span class="muted">Elegí una maqueta para ver su portada y estructura.</span>';return}
    const parts=(m.components||[]).filter(c=>c.enabled!==false).sort((a,b)=>(a.order??0)-(b.order??0));
    host.innerHTML='<div class="pl-layout-paper"><div class="pl-paper-brand">DOCULAB <small>DOCUMENT STUDIO</small></div><div class="pl-paper-kicker">'+esc(m.category||"DOCUMENTO")+'</div><b class="pl-paper-title">'+esc(m.name)+'</b><p class="pl-paper-subtitle">'+esc(m.description||"Documento académico")+'</p><div class="pl-paper-rule"></div><ol>'+parts.slice(0,7).map(c=>'<li>'+esc(c.title)+'</li>').join("")+'</ol></div><div class="pl-layout-caption"><b>'+esc(m.name)+'</b><span>'+parts.length+' secciones activas</span><p>'+esc(m.description||"Maqueta documental reutilizable.")+'</p></div>';
  }

  /* ---------- Construcción de prompts ---------- */
  function blocks() {
    const t = task(), tones = S.tones.map(id => byId(allTones(), id)).filter(Boolean);
    const rules = S.rules.map(id => byId(allRules(), id)).filter(Boolean);
    const formats = S.formats.map(id => byId(C.formats, id)).filter(Boolean);
    const voice = byId(C.voices, S.voice), variant = byId(C.variants, S.variant);
    const style = [`Registro ${C.formality[S.formality - 1]}.`, ...tones.map(x => x.text), voice && voice.text, variant && variant.text].filter(Boolean);
    return { t, tones, rules, formats, style };
  }

  function buildDirect() {
    const { t, rules, formats, style } = blocks();
    const out = [];
    out.push(`Actuá como ${t.role}.`);
    out.push(`OBJETIVO\n${S.goal.trim() || "[Definí el objetivo del trabajo]"}`);
    out.push(`MATERIALES\n${S.sources.trim() || "[Indicá qué materiales vas a adjuntar]"}\nSi todavía no recibiste los materiales, pedilos y esperá a tenerlos antes de empezar.`);
    out.push(`RESULTADO ESPERADO\n${S.output.trim() || "[Describí cómo debería ser el resultado]"}\nProfundidad: ${S.depth}.`
      + (formats.length ? `\nFormato de entrega:\n${formats.map(f => "- " + f.text).join("\n")}` : ""));
    out.push(`TONO Y ESTILO\n${style.map(s => "- " + s).join("\n")}`);
    if (rules.length) out.push(`REGLAS\n${rules.map((r, i) => `${i + 1}. ${r.text}`).join("\n")}`);
    if (S.fewshot.trim()) out.push(`EJEMPLO DE SALIDA\nSeguí el formato y el estilo de este ejemplo. No copies su contenido.\n"""\n${S.fewshot.trim()}\n"""`);
    if (S.notes.trim()) out.push(`NOTAS ADICIONALES\n${S.notes.trim()}`);

    const layout = S.useLayout && window.DOCULAB_GET_MODEL ? window.DOCULAB_GET_MODEL(S.layoutId) : null;
    if(layout){const parts=(layout.components||[]).filter(c=>c.enabled!==false).sort((a,b)=>(a.order??0)-(b.order??0));
      out.push("MAQUETA DOCULAB: "+layout.name+"\nCategoría: "+(layout.category||"Personalizada")+"\nESTRUCTURA OBLIGATORIA:\n"+
      parts.map((c,i)=>(i+1)+". "+c.title+(c.instruction?" — "+c.instruction:"")).join("\n")+
      (layout.instructions?"\nInstrucciones generales: "+layout.instructions:"")+
      "\nUsá encabezados Markdown ## con los títulos exactos y ### para subsecciones. Respetá el orden. No omitas apartados activos. El resultado debe poder distribuirse en el editor por secciones de DOCULAB.");
    }
    return out.join("\n\n");
  }

  function buildMeta() {
    const { t, rules, formats, style } = blocks();
    return `Actuá como especialista en ingeniería de prompts. Tu tarea NO es realizar el trabajo final. Tu única tarea es redactar un PROMPT DEFINITIVO, completo y listo para copiar, que otra IA ejecutará después.

TIPO DE TRABAJO: ${t.label} (rol sugerido para la IA ejecutora: ${t.role})

OBJETIVO DEL TRABAJO FINAL:
${S.goal.trim() || "[El usuario todavía no definió el objetivo]"}

MATERIALES QUE RECIBIRÁ LA IA EJECUTORA:
${S.sources.trim() || "[Materiales por especificar]"}

RESULTADO ESPERADO:
${S.output.trim() || "[Formato y contenido por especificar]"}
Profundidad: ${S.depth}.
${formats.length ? "Formato de entrega:\n" + formats.map(f => "- " + f.text).join("\n") : ""}

TONO Y ESTILO REQUERIDOS:
${style.map(s => "- " + s).join("\n")}

REGLAS Y PRIORIDADES:
${rules.length ? rules.map(r => "- " + r.text).join("\n") : "- No inventar información; distinguir lo respaldado por las fuentes de lo que no."}
${S.fewshot.trim() ? `\nEJEMPLO DE SALIDA DESEADA (incorporalo al prompt como modelo de formato y estilo, no de contenido):\n"""\n${S.fewshot.trim()}\n"""\n` : ""}${S.notes.trim() ? `\nNOTAS ADICIONALES:\n${S.notes.trim()}\n` : ""}
${S.useLayout && window.DOCULAB_GET_MODEL && window.DOCULAB_GET_MODEL(S.layoutId) ? (() => { const m=window.DOCULAB_GET_MODEL(S.layoutId), p=(m.components||[]).filter(c=>c.enabled!==false).sort((a,b)=>(a.order??0)-(b.order??0)); return "MAQUETA DOCULAB: "+m.name+"\nSecciones obligatorias en orden:\n"+p.map((c,i)=>(i+1)+". "+c.title+(c.instruction?" — "+c.instruction:"")).join("\n")+"\nInstrucciones generales: "+(m.instructions||"")+"\nEl prompt definitivo debe exigir encabezados Markdown ## con títulos exactos y contenido listo para distribuir en el editor por secciones de DOCULAB."; })() : ""}

INSTRUCCIONES PARA VOS, DISEÑADOR DEL PROMPT:
1. Convertí el brief en instrucciones operativas, precisas y sin ambigüedades.
2. Definí el rol de la IA ejecutora, el objetivo, el procedimiento para cada material y cómo integrar las fuentes.
3. Establecé una jerarquía explícita entre fuentes cuando corresponda; indicá qué hacer ante contradicciones, omisiones o información ilegible.
4. Indicá cómo organizar el resultado, qué nivel de desarrollo usar y qué errores evitar.
5. Respetá el tono, las reglas y el formato pedidos, y traducilos a instrucciones concretas.
6. El prompt debe ser autónomo: se pegará en otra conversación y los materiales se adjuntarán allí. No supongas que la IA ya tiene acceso a los archivos.
7. No incluyas el resultado final ni expliques tu proceso.

ENTREGA:
Devolvé únicamente el PROMPT DEFINITIVO, listo para copiar y usar, sin introducción ni comentarios.`;
  }

  /* ---------- Actualización ---------- */
  const current = () => activeTab === "direct" ? $("#plOutDirect").value : $("#plOutAi").value;
  function updateCount() {
    const n = current().length;
    $("#plCount").textContent = n.toLocaleString("es-AR") + " caracteres · aprox. " + Math.ceil(n / 4).toLocaleString("es-AR") + " tokens";
  }
  function refineLabel() {
    const manual = $("#aiProvider").value === "none";
    $("#plRefine").textContent = manual ? "Preparar metaprompt" : "Refinar con IA";
    $("#plAiHint").textContent = manual
      ? "Sin proveedor conectado, acá se prepara un metaprompt: pegalo en ChatGPT, Gemini o Claude y esa IA te devolverá el prompt definitivo."
      : "El proveedor configurado redacta una versión pulida del prompt a partir de tu brief.";
  }
  function update() {
    put(K_DRAFT, S);
    if (!directDirty) $("#plOutDirect").value = buildDirect();
    $("#plRegen").classList.toggle("hidden", !directDirty);
    refineLabel(); updateCount();
  }
  function showTab(name) {
    activeTab = name;
    $("#plTabDirect").classList.toggle("active", name === "direct");
    $("#plTabAi").classList.toggle("active", name === "ai");
    $("#plPaneDirect").classList.toggle("hidden", name !== "direct");
    $("#plPaneAi").classList.toggle("hidden", name !== "ai");
    $("#plRegen").classList.toggle("hidden", name !== "direct" || !directDirty);
    updateCount();
  }
  const say = s => { $("#plStatus").textContent = s; };

  /* ---------- Acciones ---------- */
  function applyTask(id) {
    const t = byId(C.tasks, id); if (!t) return;
    S.task = id; const d = t.defaults;
    S.depth = d.depth; S.formality = d.formality; S.tones = [...d.tones]; S.rules = [...d.rules]; S.formats = [...d.formats];
    renderAll(); update(); say("Preset aplicado: " + t.label + ". Ajustá lo que quieras.");
  }
  function applyExample(i) {
    const e = C.examples[i]; if (!e) return;
    applyTask(e.task); S.goal = e.goal; S.sources = e.sources; S.output = e.output;
    syncFields(); update(); say("Ejemplo cargado. Reemplazá los datos por los tuyos.");
  }
  function addCustom(kind) {
    const input = $(kind === "tone" ? "#plNewTone" : "#plNewRule"), text = input.value.trim();
    if (!text) { say("Escribí el texto antes de agregarlo."); return; }
    const id = "c_" + Date.now().toString(36);
    if (kind === "tone") { custom.tones.push({ id, label: text.length > 28 ? text.slice(0, 26) + "…" : text, text: `Tono: ${text}.` }); S.tones.push(id); renderTones(); }
    else { custom.rules.push({ id, label: text.length > 34 ? text.slice(0, 32) + "…" : text, text }); S.rules.push(id); renderRules(); }
    put(K_CUSTOM, custom); input.value = ""; update(); toast("Agregado");
  }
  function saveRecipe() {
    const name = (window.prompt("Nombre de la receta:", task().label) || "").trim();
    if (!name) return;
    recipes = [...recipes.filter(r => r.name !== name), { name, state: JSON.parse(JSON.stringify(S)) }];
    put(K_RECIPES, recipes); renderRecipes(); toast("Receta guardada");
  }
  function clearAll() {
    S = blank(); directDirty = false; $("#plOutAi").value = ""; renderAll(); update(); say("Formulario limpio.");
  }
  async function refine() {
    const instruction = buildMeta(), provider = $("#aiProvider").value, btn = $("#plRefine"), label = btn.textContent;
    btn.disabled = true; btn.textContent = "Trabajando…"; showTab("ai");
    try {
      if (provider === "none") {
        $("#plOutAi").value = instruction; say("Metaprompt listo. Copialo en una IA externa; ella te devolverá el prompt definitivo.");
        return;
      }
      const r = await fetch($("#aiEndpoint").value.replace(/\/$/, "") + "/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model: $("#aiModel").value, prompt: instruction, api_key: "" }) });
      if (!r.ok) throw Error("HTTP " + r.status);
      const data = await r.json(), text = data.text || data.response || "";
      if (!text) throw Error("El proveedor no devolvió texto.");
      $("#plOutAi").value = text; say("Prompt refinado. Revisalo antes de usarlo."); renderObservedUsage(data);
    } catch (e) {
      say("No se pudo refinar: " + e.message + ". Podés usar el prompt listo o cambiar a modo manual.");
    } finally { btn.disabled = false; btn.textContent = label; updateCount(); }
  }

  /* ---------- Eventos ---------- */
  root.addEventListener("click", e => {
    const t = e.target.closest("[data-task],[data-tone],[data-format],[data-rule],[data-example],[data-recipe],[data-recipe-del],[data-pltab]");
    if (!t) return;
    const d = t.dataset;
    if (d.task) return applyTask(d.task);
    if (d.example) return applyExample(+d.example);
    if (d.pltab) return showTab(d.pltab);
    if (d.recipeDel) { recipes.splice(+d.recipeDel, 1); put(K_RECIPES, recipes); return renderRecipes(); }
    if (d.recipe) { S = Object.assign(blank(), recipes[+d.recipe].state); directDirty = false; renderAll(); update(); return say("Receta cargada."); }
    if (d.tone) { S.tones = toggle(S.tones, d.tone); renderTones(); }
    if (d.format) { S.formats = toggle(S.formats, d.format); renderFormats(); }
    if (d.rule) { S.rules = toggle(S.rules, d.rule); const open = [...root.querySelectorAll("#plRules details")].map(x => x.open); renderRules(); root.querySelectorAll("#plRules details").forEach((x, i) => x.open = open[i] || x.open); }
    update();
  });
  const bind = (sel, key, parse) => $(sel).addEventListener("input", ev => { S[key] = parse ? parse(ev.target.value) : ev.target.value; if (key === "formality") syncFields(); update(); });
  bind("#plGoal", "goal"); bind("#plSources", "sources"); bind("#plOutput", "output");
  bind("#plFewshot", "fewshot"); bind("#plNotes", "notes"); bind("#plVoice", "voice"); bind("#plVariant", "variant");
  bind("#plDepth", "depth"); bind("#plFormality", "formality", Number);
  $("#plOutDirect").addEventListener("input", () => { directDirty = true; $("#plRegen").classList.remove("hidden"); updateCount(); say("Editaste el prompt a mano. Si cambiás el formulario, usá “Volver a generar”."); });
  $("#plOutAi").addEventListener("input", updateCount);
  $("#plRegen").onclick = () => { directDirty = false; update(); say("Prompt regenerado desde el formulario."); };
  $("#plAddTone").onclick = () => addCustom("tone"); $("#plAddRule").onclick = () => addCustom("rule");
  $("#plNewTone").addEventListener("keydown", e => { if (e.key === "Enter") addCustom("tone"); });
  $("#plNewRule").addEventListener("keydown", e => { if (e.key === "Enter") addCustom("rule"); });
  $("#plSaveRecipe").onclick = saveRecipe; $("#plClear").onclick = clearAll; $("#plRefine").onclick = refine;
  $("#plUseLayout").addEventListener("change",e=>{S.useLayout=e.target.checked;$("#plLayoutOptions").classList.toggle("hidden",!S.useLayout);update();});
  $("#plLayoutModel").addEventListener("change",e=>{S.layoutId=e.target.value;update();renderLayoutPreview();});
  window.addEventListener("doculab:templates-changed",renderLayoutOptions);
  $("#plCopy").onclick = () => copy(current());
  $("#plToStudio").onclick=()=>{
    if(S.useLayout&&!S.layoutId){say("Elegí una maqueta antes de enviar el prompt al estudio.");$("#plLayoutModel").focus();return}
    const chosen=S.useLayout&&S.layoutId&&window.DOCULAB_GET_MODEL?window.DOCULAB_GET_MODEL(S.layoutId):null;go("studio");
    if(chosen){$("#studioModel").value=chosen.id;$("#studioModel").dispatchEvent(new Event("change",{bubbles:true}));$("#studioStatus").textContent="Prompt transferido con la maqueta «"+chosen.name+"» seleccionada. Pegá la respuesta de la IA y usá «Editor por secciones» para distribuirla.";}
    else $("#studioStatus").textContent="Prompt transferido desde el Generador de prompts.";
    $("#promptOutput").value=current();tab("prompt");
  };
  $("#aiProvider").addEventListener("change", refineLabel);
  $$(".provider-card").forEach(c => c.addEventListener("click", () => setTimeout(refineLabel, 0)));
  document.addEventListener("keydown", e => {
    if (e.key !== "5" || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
    go("promptlab");
  });

  fillStatic(); renderAll(); update();
})();
