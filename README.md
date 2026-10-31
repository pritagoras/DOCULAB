# DOCULAB

**Document Studio** — biblioteca modular de modelos y herramientas para preparar documentos con ayuda de modelos de lenguaje.

## Publicación

DOCULAB es una aplicación estática y funciona en GitHub Pages:

1. En el repositorio, abrir **Settings → Pages**.
2. En **Build and deployment**, elegir **Deploy from a branch**.
3. Seleccionar rama **main** y carpeta **/(root)**.
4. Guardar y esperar a que GitHub complete el despliegue.

URL esperada: https://pritagoras.github.io/DOCULAB/

## Funciones del MVP

- Biblioteca inicial con 12 modelos de producción documental.
- Búsqueda y filtros por categoría.
- Vista de prompts y estructuras de cada modelo.
- Constructor de modelos personalizados.
- Estudio para ensamblar prompts a partir de fuentes e indicaciones.
- Proyectos y biblioteca guardados localmente en el navegador.
- Importación y exportación de biblioteca JSON.
- Exportación HTML e impresión / Guardar como PDF.
- PWA básica.

## Limitaciones actuales

- No extrae automáticamente el texto de PDF o DOCX; se puede pegar el texto en el campo de fuentes.
- El borrador sin IA conserva y ordena el material; no realiza una articulación inteligente.
- La impresión a PDF usa el diálogo del navegador.
- Los proyectos se guardan en el navegador y dispositivo actuales; no hay sincronización en la nube.
- GitHub Pages aloja solo la interfaz estática. No ejecuta Python ni modelos locales.
- La conexión IA local se recomienda al abrir DOCULAB desde localhost. El puente incluido restringe CORS a localhost.

## Ejecutar localmente

Servir la carpeta raíz:

```bash
python -m http.server 8080
```

Abrir http://localhost:8080.

### Puente local de IA (opcional)

Requiere Python 3.10+ y Ollama para el proveedor local.

```powershell
cd local_server
py -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 127.0.0.1 --port 8000
```

En Ollama, instalar un modelo y seleccionarlo en DOCULAB (por ejemplo, qwen2.5:7b). El servidor consulta Ollama en http://localhost:11434.

Para proveedores compatibles con OpenAI, configurar OPENAI_BASE_URL y OPENAI_API_KEY como variables de entorno del servidor. No publicar claves en GitHub.
