from fastapi import APIRouter, HTTPException, UploadFile, File
import cv2
import numpy as np
from src.image_segmentation import YOLOSegmentationEngine

router = APIRouter(prefix="/segment", tags=["segment"])

engines = {
    "coreml":  YOLOSegmentationEngine("models/segmentation/yolo26n-seg.mlpackage"),
    "pytorch": YOLOSegmentationEngine("models/segmentation/yolo26n-seg.pt"),
}

def decode_image(file: bytes) -> np.ndarray:
    arr = np.frombuffer(file, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

@router.post("/segment")
async def segment(image: UploadFile = File(...), model: str = "coreml"):
    engine = engines.get(model, engines["coreml"])
    img = decode_image(await image.read())
    if img is None:
        raise HTTPException(400, "Invalid image upload")
    return engine.segment_image(img)
