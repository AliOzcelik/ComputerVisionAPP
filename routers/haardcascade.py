from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import cv2
import numpy as np
from src.haarcascade_detection import CASCADE_CONFIGS, CascadeDetector


router = APIRouter(prefix="/haardcascade", tags=["haardcascade", "cascade"])
engine = CascadeDetector(directory="data/haarcascades", directory_cuda="data/haarcascades_cuda", use_cuda=False)
for cascade_key in CASCADE_CONFIGS:
    engine.load_cascade(cascade_key)

CASCADE_CLASS_MAP = {
    "frontalface_default": "face",
    "frontalface_alt": "face_alt",
    "frontalface_alt2": "face_alt2",
    "frontalface_alt_tree": "face",
    "profileface": "profile",
    "eye": "eye",
    "eye_tree_eyeglasses": "eye_glasses",
    "lefteye_2splits": "eye",
    "righteye_2splits": "eye",
    "smile": "smile",
    "upperbody": "upperbody",
    "fullbody": "fullbody",
    "lowerbody": "lowerbody",
    "frontalcatface": "catface",
    "frontalcatface_extended": "catface_extended",
}

FRONTEND_CASCADE_MAP = {
    "face": "frontalface_default",
    "face_alt": "frontalface_alt",
    "face_alt2": "frontalface_alt2",
    "profile": "profileface",
    "eye": "eye",
    "eye_glasses": "eye_tree_eyeglasses",
    "smile": "smile",
    "upperbody": "upperbody",
    "lowerbody": "lowerbody",
    "fullbody": "fullbody",
    "catface": "frontalcatface",
    "catface_extended": "frontalcatface_extended",
}

def decode_image(file: bytes) -> np.ndarray:
    arr = np.frombuffer(file, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

@router.post("/detect")
async def detect(
    image: UploadFile = File(...),
    cascades: str | None = Form(None),
    scale_factor: float | None = Form(None),
    min_neighbors: int | None = Form(None),
    min_size: int | None = Form(None),
) -> dict:
    img = decode_image(await image.read())
    if img is None:
        raise HTTPException(400, "Invalid image upload")

    cascade_keys = None
    if cascades:
        requested = [item.strip() for item in cascades.split(",") if item.strip()]
        cascade_keys = [
            FRONTEND_CASCADE_MAP.get(item, item)
            for item in requested
            if FRONTEND_CASCADE_MAP.get(item, item) in CASCADE_CONFIGS
        ]
        if not cascade_keys:
            return {"detections": []}

    parameter_overrides = {}
    if scale_factor is not None:
        parameter_overrides["scale_factor"] = max(1.01, min(2.0, scale_factor))
    if min_neighbors is not None:
        parameter_overrides["min_neighbors"] = max(1, min(50, min_neighbors))
    if min_size is not None:
        size = max(1, min(512, min_size))
        parameter_overrides["min_size"] = (size, size)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, results = engine.detect(img, gray, cascade_keys=cascade_keys, parameter_overrides=parameter_overrides)

    height, width = img.shape[:2]
    detections = []
    for cascade_key, cascade_detections in results.items():
        cls = CASCADE_CLASS_MAP.get(cascade_key, cascade_key)

        for detection in cascade_detections:
            x, y, w, h = [int(v) for v in detection]
            detections.append({
                "type": cls,
                "cls": cls,
                "confidence": 0.9,
                "x": x,
                "y": y,
                "width": w,
                "height": h,
                "box": [
                    max(0.0, min(1.0, x / width)),
                    max(0.0, min(1.0, y / height)),
                    max(0.0, min(1.0, (x + w) / width)),
                    max(0.0, min(1.0, (y + h) / height)),
                ],
            })

    return {"detections": detections}
