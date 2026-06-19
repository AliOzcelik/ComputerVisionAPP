from fastapi import APIRouter, HTTPException, UploadFile, File
import cv2
import numpy as np
from src.object_detection import YOLODetectionEngine

router = APIRouter(prefix="/detection", tags=["detection"])

engines = {
    "coreml":  YOLODetectionEngine("models/object_detection/yolo26n.mlpackage"),
    "pytorch": YOLODetectionEngine("models/object_detection/yolo26n.pt"),
}

def decode_image(file: bytes) -> np.ndarray:
    arr = np.frombuffer(file, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

@router.post("/detect")
async def detect(image: UploadFile = File(...), model: str = "coreml") -> dict:
    engine = engines.get(model, engines["coreml"])
    img = decode_image(await image.read())
    if img is None:
        raise HTTPException(400, "Invalid image upload")
    return {"detections": engine.detect_image(img)}
