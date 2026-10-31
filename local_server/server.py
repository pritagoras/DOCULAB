import os
from pathlib import Path
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="DOCULAB Local AI Bridge", version="0.3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

CONTEXT_FILE = Path(__file__).resolve().parent.parent / "docs" / "DOCULAB_AI_CONTEXT.md"

def load_product_context():
    """Load the versioned DOCULAB manual for every request."""
    try:
        return CONTEXT_FILE.read_text(encoding="utf-8").strip()
    except OSError:
        raise HTTPException(500, "No se encontró docs/DOCULAB_AI_CONTEXT.md. Restaurá el archivo de contexto de DOCULAB.")

def system_context():
    return (
        "Sos el asistente integrado en DOCULAB. El siguiente manual describe el producto, "
        "su arquitectura, esquema, funciones y limitaciones. Respetalo en todas tus respuestas.\\n\\n"
        + load_product_context()
    )

class GenerateRequest(BaseModel):
    provider: str = "ollama"
    model: str = ""
    prompt: str
    api_key: str = ""

@app.get("/health")
async def health():
    return {"ok": True, "service": "DOCULAB Local AI Bridge", "providers": ["ollama", "openai", "gemini"]}

@app.post("/api/generate")
async def generate(req: GenerateRequest):
    if not req.prompt.strip():
        raise HTTPException(400, "El prompt está vacío")
    # The same product manual is injected server-side for every provider and every task.
    permanent_context = system_context()
    timeout = httpx.Timeout(300.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            if req.provider == "ollama":
                model = req.model or os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
                response = await client.post(
                    os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat"),
                    json={"model": model, "messages": [
                        {"role": "system", "content": permanent_context},
                        {"role": "user", "content": req.prompt}
                    ], "stream": False}
                )
                response.raise_for_status()
                answer = response.json().get("message", {}).get("content", "")
                return {"text": answer, "model": model, "provider": "ollama", "context_loaded": True}

            if req.provider == "openai":
                base = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
                key = req.api_key or os.getenv("OPENAI_API_KEY", "")
                if not key:
                    raise HTTPException(400, "Falta configurar la clave API")
                model = req.model or "gpt-4o-mini"
                response = await client.post(
                    base + "/chat/completions",
                    headers={"Authorization": f"Bearer {key}"},
                    json={"model": model, "messages": [
                        {"role": "system", "content": permanent_context},
                        {"role": "user", "content": req.prompt}
                    ]}
                )
                response.raise_for_status()
                return {"text": response.json()["choices"][0]["message"]["content"], "model": model, "provider": "openai", "context_loaded": True}

            if req.provider == "gemini":
                key = req.api_key or os.getenv("GEMINI_API_KEY", "")
                if not key:
                    raise HTTPException(400, "Falta configurar la clave API de Gemini")
                model = req.model or "gemini-2.5-flash"
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                response = await client.post(
                    url, params={"key": key},
                    json={
                        "systemInstruction": {"parts": [{"text": permanent_context}]},
                        "contents": [{"role": "user", "parts": [{"text": req.prompt}]}]
                    }
                )
                response.raise_for_status()
                data = response.json()
                answer = "".join(part.get("text", "") for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", []))
                return {"text": answer, "model": model, "provider": "gemini", "context_loaded": True}

            raise HTTPException(400, "Proveedor no reconocido")
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text[:1000]
            raise HTTPException(exc.response.status_code, detail)
        except httpx.RequestError as exc:
            raise HTTPException(502, f"No se pudo contactar el servicio: {exc}")
