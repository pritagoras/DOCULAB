# DOCULAB

**Document Studio** — biblioteca de modelos documentales modulares, reutilizables y versionables.

## Concepto

DOCULAB separa el diseño asistido por IA del uso cotidiano de los modelos:

- La IA puede proponer, revisar o ampliar una plantilla desde el constructor.
- La plantilla se guarda como JSON y define sus componentes, orden, instrucciones y estado activo.
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
2. Crear o editar los componentes y revisar la previsualización.
3. Pulsar **Guardar modelo** para conservarlo en el navegador.
4. Pulsar **Descargar modelo JSON**. Crear una carpeta dentro de `models/` y guardar el archivo como `model.json`.
5. Pulsar **Descargar índice Git** y reemplazar `models/index.json` con ese archivo.
6. Abrir GitHub Desktop, revisar los dos archivos nuevos/modificados y hacer commit/push.

No hace falta configurar un token de GitHub ni conectar DOCULAB con la API de GitHub. Los modelos publicados se cargan desde el propio repositorio al abrir la aplicación.

## IA opcional

La IA solo interviene cuando se quiere generar o modificar contenido o diseñar modelos. Los modelos documentales guardados no dependen de ella.

Proveedores del puente local:
- Ollama local.
- OpenAI API.
- Google Gemini API.
- Endpoints compatibles con la API de OpenAI.

Las claves API se envían al puente local para la solicitud y no se guardan en el repositorio. No se deben incluir claves en archivos públicos.

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

- Biblioteca inicial de modelos.
- Constructor modular con activar/desactivar y reordenar componentes.
- Previsualización en tiempo real y propuesta de estructuras con IA.
- Generación de una estructura documental editable sin IA.
- Editor de contenido independiente por componente, sin modificar el modelo base.
- Previsualización de página actualizada automáticamente, exportación HTML e impresión / PDF.
- Generación asistida por IA de secciones individuales.
- Configuración guiada de proveedores, claves de sesión y prueba real de conexión.
- Guardado local de plantillas y proyectos.
- Importación y exportación JSON.
- Carga de plantillas versionadas en Git.
- Generación de documentos con proveedores IA configurados.
- Exportación HTML e impresión / Guardar como PDF.

La importación directa de PDF/DOCX y la sincronización automática no están incluidas todavía.
