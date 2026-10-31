import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="DOCULAB Local AI Bridge", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    provider: str = "ollama"
    model: str = ""
    prompt: str
    api_key: str = ""

@app.get("/health")
async def health():
    return {"ok": True, "service": "DOCULAB Local AI Bridge"}

@app.post("/api/generate")
async def generate(req: GenerateRequest):
    if not req.prompt.strip():
        raise HTTPException(400, "El prompt está vacío")
    timeout = httpx.Timeout(300.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            if req.provider == "ollama":
                model = req.model or os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
                response = await client.post(os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate"),
                    json={"model": model, "prompt": req.prompt, "stream": False})
                response.raise_for_status()
                return {"text": response.json().get("response", ""), "model": model}
            if req.provider == "openai":
                base = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
                key = req.api_key or os.getenv("OPENAI_API_KEY", "")
                if not key:
                    raise HTTPException(400, "Falta configurar la clave API")
                response = await client.post(base + "/chat/completions",
                    headers={"Authorization": f"Bearer {key}"},
                    json={"model": req.model or "gpt-4o-mini", "messages": [{"role": "user", "content": req.prompt}]})
                response.raise_for_status()
                return {"text": response.json()["choices"][0]["message"]["content"], "model": req.model}
            raise HTTPException(400, "Proveedor no reconocido")
        except httpx.HTTPStatusError as exc:
            raise HTTPException(exc.response.status_code, exc.response.text[:1000])
        except httpx.RequestError as exc:
            raise HTTPException(502, f"No se pudo contactar el servicio: {exc}")
