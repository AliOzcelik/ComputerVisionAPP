from fastapi import APIRouter, HTTPException, UploadFile, File
import cv2
import numpy as np
from src.pose_estimation import YOLOPoseEngine

router = APIRouter(prefix="/pose", tags=["pose"])

engines = {
    "coreml":  YOLOPoseEngine("models/pose_estimation/yolo26n-pose.mlpackage"),
    "pytorch": YOLOPoseEngine("models/pose_estimation/yolo26n-pose.pt"),
}

def decode_image(file: bytes) -> np.ndarray:
    arr = np.frombuffer(file, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

@router.post("/pose_estimate")
async def detect(image: UploadFile = File(...), model: str = "coreml") -> dict:
    engine = engines.get(model, engines["coreml"])
    img = decode_image(await image.read())
    if img is None:
        raise HTTPException(400, "Invalid image upload")
    return engine.run(img)
