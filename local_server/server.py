import os
from pathlib import Path
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="DOCULAB Local AI Bridge", version="0.4.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
CONTEXT_FILE = BASE_DIR.parent / "docs" / "DOCULAB_AI_CONTEXT.md"
SECRETS_FILE = BASE_DIR / ".env"
SECRET_NAMES = {"openai": "OPENAI_API_KEY", "gemini": "GEMINI_API_KEY"}

def read_local_secrets():
    values = {}
    try:
        for line in SECRETS_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return values

def configured_key(provider, request_key=""):
    name = SECRET_NAMES.get(provider)
    if not name:
        return ""
    # Environment variables take precedence; otherwise use the private local .env file.
    return os.getenv(name) or read_local_secrets().get(name, "") or request_key

def load_product_context():
    try:
        return CONTEXT_FILE.read_text(encoding="utf-8").strip()
    except OSError:
        raise HTTPException(500, "No se encontró docs/DOCULAB_AI_CONTEXT.md.")

def system_context():
    return (
        "Sos el asistente integrado en DOCULAB. El siguiente manual describe el producto, "
        "su arquitectura, esquema, funciones y limitaciones. Respetalo en todas tus respuestas.\n\n"
        + load_product_context()
    )

class GenerateRequest(BaseModel):
    provider: str = "ollama"
    model: str = ""
    prompt: str
    api_key: str = ""

class LocalSettingsRequest(BaseModel):
    provider: str
    api_key: str

@app.get("/health")
async def health():
    return {"ok": True, "service": "DOCULAB Local AI Bridge", "providers": ["ollama", "openai", "gemini"]}

@app.get("/api/settings")
async def get_local_settings():
    secrets = read_local_secrets()
    return {
        "openai_configured": bool(os.getenv("OPENAI_API_KEY") or secrets.get("OPENAI_API_KEY")),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY") or secrets.get("GEMINI_API_KEY")),
        "storage": "local_server/.env"
    }

@app.post("/api/settings")
async def save_local_settings(req: LocalSettingsRequest):
    if req.provider not in SECRET_NAMES:
        raise HTTPException(400, "Solo OpenAI y Gemini requieren una clave API.")
    key_name = SECRET_NAMES[req.provider]
    key_value = req.api_key.strip().replace("\r", "").replace("\n", "")
    existing = read_local_secrets()
    if key_value:
        existing[key_name] = key_value
    else:
        existing.pop(key_name, None)
    lines = ["# Credenciales privadas de DOCULAB. Este archivo no debe subirse a Git."]
    lines.extend(f"{name}={value}" for name, value in sorted(existing.items()) if name in SECRET_NAMES.values())
    try:
        SECRETS_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    except OSError as exc:
        raise HTTPException(500, f"No se pudo guardar la clave localmente: {exc}")
    return {
        "saved": bool(key_value),
        "provider": req.provider,
        "openai_configured": bool(existing.get("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")),
        "gemini_configured": bool(existing.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")),
        "storage": "local_server/.env"
    }

@app.post("/api/generate")
async def generate(req: GenerateRequest):
    if not req.prompt.strip():
        raise HTTPException(400, "El prompt está vacío")
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
                key = configured_key("openai", req.api_key)
                if not key:
                    raise HTTPException(400, "Falta configurar la clave API de OpenAI en Settings.")
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
                key = configured_key("gemini", req.api_key)
                if not key:
                    raise HTTPException(400, "Falta configurar la clave API de Gemini en Settings.")
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
            raise HTTPException(exc.response.status_code, exc.response.text[:1000])
        except httpx.RequestError as exc:
            raise HTTPException(502, f"No se pudo contactar el servicio: {exc}")
