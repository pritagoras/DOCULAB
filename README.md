# DOCULAB

**Prompt & Document Studio** — generador de prompts como pantalla principal y biblioteca de modelos documentales modulares, reutilizables y versionables.

## Concepto

DOCULAB separa la generación de instrucciones, el diseño asistido por IA y el uso cotidiano de los modelos:

- El generador de prompts es la pantalla inicial: transforma un brief en un prompt completo incluso sin conectar un proveedor. La IA opcional puede optimizarlo.
- La IA puede proponer, revisar o ampliar una plantilla desde el constructor.
- La plantilla se guarda como JSON y define sus componentes, orden, instrucciones, estado activo y, opcionalmente, textos de muestra por sección para personalizar su preview A4 y PDF de demostración.
- Una plantilla guardada se puede abrir, previsualizar y utilizar sin conectarse a ningún modelo de lenguaje; DOCULAB puede generar su estructura vacía para completarla manualmente.
- Los modelos versionados en Git se cargan desde `models/index.json`.

## Modelos versionados en Git

La estructura es:

```text
models/
  index.json
  guia-universitaria/
    model.json
  informe-academico/
    model.json
```

Para incorporar un modelo nuevo:

1. En DOCULAB, abrir **Constructor de modelos**.
2. Crear o editar los componentes, completar el campo «Contenido de muestra para el PDF» de cada sección y revisar la previsualización A4.
3. Pulsar **Guardar modelo** para conservarlo en el navegador.
4. Pulsar **Descargar modelo JSON**. Crear una carpeta dentro de `models/` y guardar el archivo como `model.json`.
5. Pulsar **Descargar índice Git** y reemplazar `models/index.json` con ese archivo.
6. Abrir GitHub Desktop, revisar los dos archivos nuevos/modificados y hacer commit/push.

No hace falta configurar un token de GitHub ni conectar DOCULAB con la API de GitHub. Los modelos publicados se cargan desde el propio repositorio al abrir la aplicación.

## IA opcional y contexto permanente

La IA solo interviene cuando se quiere generar o modificar contenido o diseñar modelos. Los modelos documentales guardados no dependen de ella.

Todas las solicitudes que pasan por el puente local reciben automáticamente el manual `docs/DOCULAB_AI_CONTEXT.md` como instrucción de sistema, independientemente del proveedor (Ollama, OpenAI o Gemini) y de si la tarea es diseñar un modelo o redactar una sección. El manual se lee desde disco en cada solicitud: al editarlo no hace falta modificar el código, pero sí reiniciar el puente si se cambió el propio servidor. Mantené ese archivo actualizado cuando cambien el esquema, la interfaz, las capacidades o las limitaciones de DOCULAB. El contexto del producto se combina con el prompt específico de cada tarea; no reemplaza las instrucciones particulares del modelo ni el material fuente.

Proveedores del puente local:
- Ollama local.
- OpenAI API.
- Google Gemini API.
- Endpoints compatibles con la API de OpenAI.

Las claves API se guardan desde Settings en `local_server/.env`, un archivo privado de tu PC excluido mediante `.gitignore`. El puente local las lee directamente al generar contenido; no las devuelve al navegador ni las incluye en solicitudes desde el frontend. También podés copiar `local_server/.env.example` como `.env` y completar las variables manualmente. El archivo `.env` contiene texto sin cifrar: mantenelo dentro de tu usuario de Windows y nunca lo compartas ni lo subas al repositorio. Si usás GitHub Pages, abrí la copia local mediante `INICIAR_DOCULAB.bat` para que el navegador pueda comunicarse con el puente local.

## Publicación

DOCULAB es una aplicación estática compatible con GitHub Pages:

1. Abrir **Settings → Pages**.
2. Elegir **Deploy from a branch**.
3. Seleccionar rama **main** y carpeta **/(root)**.
4. Guardar y esperar el despliegue.

URL esperada: https://pritagoras.github.io/DOCULAB/

## Ejecutar localmente

Desde Windows, hacé doble clic en `INICIAR_DOCULAB.bat` en la carpeta raíz del repositorio. En el primer inicio crea un entorno Python e instala las dependencias; luego abre el navegador en http://localhost:8080 y levanta el puente local de IA en el puerto 8000. Dejá abiertas las dos ventanas de consola mientras uses DOCULAB. Requiere Python 3.10+ y conexión a Internet solo durante la instalación inicial de dependencias.

También podés iniciar solo la interfaz manualmente con `py -m http.server 8080` si no necesitás IA.

### Puente local de IA (opcional)

Requiere Python 3.10+.

```powershell
cd local_server
py -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 127.0.0.1 --port 8000
```

Para Ollama, iniciar Ollama y descargar un modelo (por ejemplo, `ollama pull qwen2.5:7b`). En DOCULAB seleccionar Ollama y el nombre exacto del modelo.

Para OpenAI o Gemini, elegir el proveedor correspondiente, ingresar la clave API en Configuración y especificar el identificador del modelo. La clave no se guarda en localStorage ni en Git.

## Alcance actual

- Generador de prompts como pantalla inicial: plantillas rápidas, creación local de prompts completos y optimización opcional con IA.
- Constructor modular con activar/desactivar y reordenar componentes.
- Previsualización en tiempo real y propuesta de estructuras con IA.
- Generación de una estructura documental editable sin IA.
- Editor de contenido independiente por componente, sin modificar el modelo base.
- Previsualización de página actualizada automáticamente, exportación HTML e impresión / PDF.
- Generación asistida por IA de secciones individuales.
- Selector visual de proveedores, detección de modelos disponibles en Ollama/OpenAI/Gemini, ficha de modelo con contexto y precios de referencia, enlaces a cuotas y límites oficiales, y prueba real de conexión.
- Visualización de límites observados en cabeceras de OpenAI y tokens consumidos en Gemini cuando la API los devuelve.
- Modo claro/oscuro manual con preferencia persistente, además de detección inicial del tema del sistema.
- Guardado local de plantillas y proyectos.
- Importación y exportación JSON.
- Carga de plantillas versionadas en Git.
- Generación de documentos con proveedores IA configurados.
- Exportación HTML e impresión / Guardar como PDF.
- Interfaz con navegación por teclado (teclas 1–5 para cambiar de sección, Esc para cerrar la vista previa) y diseño adaptable a móvil.

La importación directa de PDF/DOCX y la sincronización automática no están incluidas todavía.
