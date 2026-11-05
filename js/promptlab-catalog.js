/* ==========================================================================
   DOCULAB · Catálogo del Diseñador de prompts
   --------------------------------------------------------------------------
   Para sumar una opción nueva NO hace falta tocar código: agregá un objeto
   a la lista que corresponda y guardá el archivo.

   - tasks    → tipos de trabajo (cada uno precarga tonos, reglas y formatos)
   - tones    → tonos de escritura (el texto se inserta tal cual en el prompt)
   - rules    → reglas, agrupadas por tema
   - formats  → formatos de salida
   - examples → briefs de muestra que se cargan con un clic
   ========================================================================== */
window.PROMPTLAB_CATALOG = {

  disciplines: [
    { id: "biologia", label: "Biología" },
    { id: "semiologia", label: "Semiología y semiótica" },
    { id: "psicologia", label: "Psicología" },
    { id: "filosofia", label: "Filosofía" },
    { id: "medicina", label: "Medicina y ciencias de la salud" },
    { id: "quimica", label: "Química" },
    { id: "fisica", label: "Física" },
    { id: "matematica", label: "Matemática" },
    { id: "estadistica", label: "Estadística" },
    { id: "historia", label: "Historia" },
    { id: "sociologia", label: "Sociología" },
    { id: "derecho", label: "Derecho" },
    { id: "educacion", label: "Educación y pedagogía" },
    { id: "linguistica", label: "Lingüística" },
    { id: "literatura", label: "Literatura y crítica literaria" },
    { id: "economia", label: "Economía" },
    { id: "informatica", label: "Informática y computación" },
    { id: "comunicacion", label: "Comunicación" },
    { id: "antropologia", label: "Antropología" },
    { id: "geografia", label: "Geografía" },
    { id: "arte", label: "Historia del arte y artes visuales" },
    { id: "ingenieria", label: "Ingeniería" },
    { id: "politica", label: "Ciencia política" }
  ],

  expertProfiles: [
    { id: "auto", label: "Según el tipo de trabajo", role: "" },
    { id: "docente", label: "Docente universitario/a", role: "docente universitario/a" },
    { id: "investigador", label: "Investigador/a académico/a", role: "investigador/a académico/a" },
    { id: "profesional", label: "Especialista profesional", role: "especialista profesional" },
    { id: "divulgador", label: "Divulgador/a científico/a", role: "divulgador/a científico/a" },
    { id: "tutor", label: "Tutor/a académico/a", role: "tutor/a académico/a" },
    { id: "custom", label: "Perfil personalizado…", role: "" }
  ],

  tasks: [
    { id: "resumen", label: "Resumen de clase",
      desc: "Condensa una clase o texto sin perder distinciones.",
      role: "ayudante de cátedra y editor académico",
      defaults: { depth: "Detallada", formality: 4, tones: ["didactico", "riguroso"],
        rules: ["no-inventar", "jerarquia", "contradicciones", "sin-relleno", "definiciones", "no-meta"],
        formats: ["md-titulos"] } },
    { id: "guia", label: "Guía de estudio",
      desc: "Unidades, objetivos, relaciones y repaso.",
      role: "tutor universitario que prepara guías de estudio",
      defaults: { depth: "Exhaustiva", formality: 3, tones: ["didactico", "cercano"],
        rules: ["no-inventar", "resumen-inicial", "titulos-num", "definiciones", "relaciones", "errores-frecuentes", "preguntas-repaso", "sintesis-final"],
        formats: ["md-titulos"] } },
    { id: "flashcards", label: "Flashcards",
      desc: "Tarjetas listas para importar a Anki.",
      role: "especialista en técnicas de memorización y repetición espaciada",
      defaults: { depth: "Detallada", formality: 3, tones: ["directo"],
        rules: ["no-inventar", "una-idea", "no-meta"],
        formats: ["anki-csv"] } },
    { id: "cuestionario", label: "Cuestionario",
      desc: "Preguntas de opción múltiple con clave justificada.",
      role: "docente que diseña evaluaciones rigurosas",
      defaults: { depth: "Detallada", formality: 4, tones: ["riguroso"],
        rules: ["no-inventar", "distractores", "clave-justificada", "no-meta"],
        formats: ["mc"] } },
    { id: "informe", label: "Informe",
      desc: "Documento formal con estructura y conclusiones.",
      role: "redactor técnico y editor de informes",
      defaults: { depth: "Detallada", formality: 5, tones: ["riguroso", "directo"],
        rules: ["no-inventar", "citar-origen", "resumen-inicial", "titulos-num", "vacios", "sintesis-final"],
        formats: ["md-titulos"] } },
    { id: "critico", label: "Análisis crítico",
      desc: "Tesis, argumentos, supuestos y tensiones.",
      role: "analista crítico de textos académicos",
      defaults: { depth: "Detallada", formality: 5, tones: ["critico", "riguroso"],
        rules: ["no-inventar", "citar-origen", "relaciones", "marcar-incertidumbre"],
        formats: ["md-titulos"] } },
    { id: "comparativo", label: "Cuadro comparativo",
      desc: "Compara teorías, procesos o autores con criterios parejos.",
      role: "analista que compara conceptos con criterios equivalentes",
      defaults: { depth: "Intermedia", formality: 4, tones: ["esquematico", "riguroso"],
        rules: ["no-inventar", "relaciones", "sintesis-final"],
        formats: ["tabla"] } },
    { id: "libre", label: "Otro trabajo",
      desc: "Empezás desde cero y armás todo a gusto.",
      role: "especialista en el tipo de tarea descripto en el brief",
      defaults: { depth: "Intermedia", formality: 3, tones: [], rules: ["no-inventar"], formats: [] } }
  ],

  /* Tonos: "text" es la instrucción que se agrega al prompt. */
  tones: [
    { id: "didactico",  label: "Didáctico",         text: "Explicá como un buen docente: de lo simple a lo complejo, aclarando cada término técnico la primera vez que aparece." },
    { id: "riguroso",   label: "Riguroso",          text: "Priorizá la precisión conceptual; no simplifiques hasta falsear y conservá los matices y las salvedades." },
    { id: "esquematico",label: "Esquemático",       text: "Preferí estructuras compactas y jerarquizadas antes que párrafos extensos." },
    { id: "narrativo",  label: "Narrativo",         text: "Encadená las ideas como un relato coherente, con transiciones que expliquen por qué se pasa de un tema al siguiente." },
    { id: "cercano",    label: "Cercano y amable",  text: "Usá un trato cálido y cercano, como alguien que acompaña el estudio, sin caer en la informalidad excesiva." },
    { id: "directo",    label: "Directo",           text: "Andá al punto: sin introducciones largas, rodeos ni frases de cortesía." },
    { id: "critico",    label: "Crítico",           text: "Evaluá los argumentos además de exponerlos: señalá supuestos, límites y objeciones posibles, distinguiendo siempre lo expuesto de lo evaluado." },
    { id: "persuasivo", label: "Persuasivo",        text: "Construí el texto para convencer: tesis clara, argumentos ordenados por fuerza y cierre que invite a la acción." },
    { id: "ameno",      label: "Ameno",             text: "Permití un toque de humor liviano y comparaciones cotidianas, sin perder seriedad en el contenido." }
  ],

  /* Reglas agrupadas. Cada grupo es un desplegable en la interfaz. */
  rules: [
    { group: "Fidelidad a las fuentes", items: [
      { id: "no-inventar",  label: "No inventar",                   text: "No inventes datos, autores, citas, definiciones ni ejemplos que no estén respaldados por los materiales." },
      { id: "marcar-incertidumbre", label: "Marcar lo dudoso",      text: "Marcá con [?] lo que sea dudoso, ilegible o incompleto en las fuentes, sin completarlo por tu cuenta." },
      { id: "contradicciones", label: "Señalar contradicciones",    text: "Si dos fuentes se contradicen, señalá la contradicción y explicá cuál prevalece según la jerarquía indicada." },
      { id: "jerarquia",    label: "Priorizar lo dicho por el docente", text: "Priorizá lo explicado oralmente; usá el material de apoyo (diapositivas, PDF) para completar, ordenar y precisar." },
      { id: "citar-origen", label: "Citar de dónde sale cada dato", text: "Indicá de qué fuente proviene cada dato importante (transcripción, diapositiva, bibliografía)." },
      { id: "vacios",       label: "Listar vacíos",                 text: "Al final, listá los vacíos: temas que las fuentes mencionan pero no desarrollan." }
    ]},
    { group: "Estructura", items: [
      { id: "resumen-inicial", label: "Resumen inicial",            text: "Abrí con un resumen de 3 a 5 líneas que dé el panorama general." },
      { id: "titulos-num",  label: "Títulos numerados",             text: "Usá títulos y subtítulos numerados que reflejen la jerarquía de los temas." },
      { id: "definiciones", label: "Definir conceptos clave",       text: "Destacá en negrita cada concepto clave la primera vez que aparezca y definilo en una oración." },
      { id: "relaciones",   label: "Explicitar relaciones",         text: "Explicitá las relaciones entre conceptos (causa, oposición, parte-todo, ejemplo de)." },
      { id: "ejemplos",     label: "Ejemplos acotados",             text: "Incluí ejemplos solo cuando estén en las fuentes o aclaren un concepto difícil, marcando cuáles agregaste vos." },
      { id: "glosario-final", label: "Glosario final",              text: "Cerrá con un glosario de los términos técnicos." },
      { id: "sintesis-final", label: "Síntesis final",              text: "Cerrá con una síntesis de lo que más conviene recordar." }
    ]},
    { group: "Estilo de escritura", items: [
      { id: "sin-relleno",  label: "Sin relleno",                   text: "Eliminá repeticiones, muletillas y frases de relleno sin perder contenido relevante." },
      { id: "analogias",    label: "Analogías breves",              text: "Usá analogías breves para los conceptos más abstractos." },
      { id: "frases-cortas",label: "Frases cortas",                 text: "Preferí oraciones cortas y párrafos de pocas líneas." },
      { id: "evitar-listas",label: "Prosa antes que viñetas",       text: "Evitá fragmentar todo en viñetas: usá prosa donde haya razonamiento encadenado." }
    ]},
    { group: "Ayudas de estudio", items: [
      { id: "preguntas-repaso", label: "Preguntas de repaso",       text: "Agregá al final de cada tema 3 preguntas de repaso con su respuesta." },
      { id: "errores-frecuentes", label: "Errores frecuentes",      text: "Incluí una nota de \"errores frecuentes\" donde haya conceptos que suelen confundirse." },
      { id: "mnemotecnias", label: "Mnemotecnias",                  text: "Sugerí reglas mnemotécnicas para listas largas o secuencias." },
      { id: "una-idea",     label: "Una idea por tarjeta",          text: "Una sola idea por tarjeta; la pregunta debe poder responderse sin ambigüedad y sin ver la tarjeta de al lado." },
      { id: "distractores", label: "Distractores plausibles",       text: "Los distractores deben ser plausibles y basarse en confusiones reales, nunca absurdos." },
      { id: "clave-justificada", label: "Clave justificada",        text: "Incluí la clave de respuestas con una justificación breve basada en las fuentes." }
    ]},
    { group: "Formato y control", items: [
      { id: "latex",        label: "Fórmulas en LaTeX",             text: "Escribí las fórmulas en LaTeX entre signos de dólar." },
      { id: "no-meta",      label: "Solo el resultado",             text: "No agregues introducciones, despedidas ni comentarios sobre lo que hiciste: entregá solamente el resultado." },
      { id: "pedir-material", label: "Esperar los materiales",      text: "Si todavía no recibiste los materiales, pedilos y esperá antes de empezar." }
    ]}
  ],

  formats: [
    { id: "md-titulos", label: "Markdown con títulos", text: "Markdown con títulos y subtítulos jerárquicos." },
    { id: "numerada",   label: "Lista numerada",       text: "Lista numerada, un ítem por idea." },
    { id: "tabla",      label: "Tabla",                text: "Una tabla en Markdown con criterios en filas y elementos en columnas." },
    { id: "esquema",    label: "Esquema / mapa",       text: "Esquema jerárquico en texto (mapa conceptual por niveles con sangría)." },
    { id: "corrido",    label: "Texto corrido",        text: "Texto corrido en párrafos, sin viñetas." },
    { id: "anki-csv",   label: "CSV para Anki",        text: "CSV de dos columnas separadas por punto y coma (Frente;Dorso), una tarjeta por línea, sin encabezado y con comillas dobles en los campos que contengan punto y coma. Listo para importar en Anki." },
    { id: "mc",         label: "Opción múltiple A–D",  text: "Preguntas numeradas con opciones A a D, una sola correcta, seguidas por la clave con justificación." },
    { id: "json",       label: "JSON",                 text: "Un único bloque JSON válido, sin texto adicional fuera del bloque." }
  ],

  /* Briefs de muestra: se cargan con un clic y se pueden editar. */
  examples: [
    { label: "Clase de biología",
      task: "resumen",
      goal: "Quiero un resumen completo de una clase de Biología Celular para estudiar para el parcial.",
      sources: "Una transcripción de la clase (lo explicado oralmente) y el PDF con las diapositivas del profesor (apoyo visual y esquemas).",
      output: "Resumen desarrollado, ordenado por temas, con definiciones, relaciones entre procesos y ejemplos relevantes." },
    { label: "Tarjetas de repaso",
      task: "flashcards",
      goal: "Quiero tarjetas de repaso para memorizar los conceptos de una unidad de Derecho Constitucional.",
      sources: "Apuntes en texto pegados en el chat.",
      output: "Entre 30 y 50 tarjetas con pregunta concreta al frente y respuesta breve al dorso." },
    { label: "Parcial de práctica",
      task: "cuestionario",
      goal: "Quiero un parcial de práctica de 15 preguntas sobre Estadística descriptiva.",
      sources: "Resumen de la unidad y guía de ejercicios del docente.",
      output: "Preguntas de opción múltiple de dificultad creciente, con clave y justificación." },
    { label: "Informe de lectura",
      task: "critico",
      goal: "Quiero un análisis crítico de un artículo académico para una discusión en clase.",
      sources: "El PDF del artículo completo.",
      output: "Problema, tesis, argumentos principales, supuestos y objeciones posibles, en no más de dos páginas." }
  ],

  formality: [
    "muy coloquial y conversacional",
    "cercano e informal",
    "neutro, sin marcas de formalidad ni de informalidad",
    "formal",
    "muy formal, de registro académico"
  ],

  voices: [
    { id: "impersonal", label: "Impersonal",              text: "Redactá en forma impersonal (\"se observa\", \"se define\")." },
    { id: "lector",     label: "Hablándole al lector",    text: "Dirigite directamente a quien lee, en segunda persona." },
    { id: "plural",     label: "Primera persona del plural", text: "Redactá en primera persona del plural (\"vemos\", \"analizamos\")." }
  ],

  variants: [
    { id: "rioplatense", label: "Español rioplatense (vos)", text: "Escribí en español rioplatense: usá voseo (vos, tenés, podés) y vocabulario natural de Argentina y Uruguay, sin lunfardo excesivo." },
    { id: "neutro",      label: "Español neutro (tú)",        text: "Escribí en español neutro, con tuteo y vocabulario comprensible en toda Hispanoamérica." },
    { id: "espana",      label: "Español de España",          text: "Escribí en español de España." },
    { id: "en",          label: "English",                    text: "Write the final output in English." }
  ],

  depths: ["Sintética", "Intermedia", "Detallada", "Exhaustiva"]
};
