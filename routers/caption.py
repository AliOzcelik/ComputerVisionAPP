import base64
import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File
from database.caption_sqlite import post_caption_logs, get_caption_logs

router = APIRouter(prefix="/caption", tags=["caption"])

OLLAMA_URL = "http://localhost:11434"


@router.get("/vision-models")
async def get_vision_models():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            tags_response = await client.get(f"{OLLAMA_URL}/api/tags")
            tags_response.raise_for_status()

            models = tags_response.json().get("models", [])
            vision_models = []

            for item in models:
                model_name = item["name"]

                show_response = await client.post(
                    f"{OLLAMA_URL}/api/show",
                    json={"model": model_name},
                )
                show_response.raise_for_status()

                info = show_response.json()
                capabilities = info.get("capabilities", [])

                if "vision" in capabilities:
                    vision_models.append({
                        "name": model_name,
                        "label": model_name,
                        "size": item.get("size"),
                        "modified_at": item.get("modified_at"),
                    })

            return {"models": vision_models}

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Could not connect to Ollama: {exc}",
        )

@router.post("/caption")
async def caption_image(image: UploadFile = File(...), model: str = "llava", prompt: str = "Describe this image.", source_type: str = "image"):
    try:
        contents = await image.read()
        b64 = base64.b64encode(contents).decode("utf-8")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": model, "prompt": prompt, "images": [b64], "stream": False},
            )

            if not response.is_success:
                try:
                    detail = response.json().get("error", response.text)
                except Exception:
                    detail = response.text
                raise HTTPException(status_code=503, detail=f"Ollama: {detail}")

            result = response.json()
            print("Ollama raw keys:", list(result.keys()))
            print("Ollama response:", repr(result.get("response", "")))
            print("Ollama thinking:", repr(result.get("thinking", "")))

            text = result.get("response") or result.get("thinking") or ""

            post_caption_logs(
                source_type=source_type,
                model_name=model,
                prompt=prompt,
                result_text=text,
                latency_ms=response.elapsed.total_seconds() * 1000,
            )

            return {"caption": text}

    except HTTPException:
        raise
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Could not connect to Ollama. Start it with: ollama serve")
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail=f"Ollama timed out after 60s (model: {model})")
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail=f"Ollama request failed: {exc}")
        
        
        
        
@router.get("/logs")
async def get_logs(limit: int = 50):
    try:
        logs = get_caption_logs(limit)
        return {"logs": logs}
    
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving logs: {exc}",
        )