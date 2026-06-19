import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis

class FaceEngine:
    def __init__(self):
        
        # providers: CoreMLExecutionProvider for Apple Silicon, CPUExecutionProvider fallback
        self.app = FaceAnalysis(
            name="buffalo_l",
            providers=["CoreMLExecutionProvider", "CPUExecutionProvider"]
        )
        self.app.prepare(ctx_id=0, det_size=(640, 640))


    def get_faces(self, img):
        """Returns list of face objects with .bbox, .embedding, .age, .gender"""
        return self.app.get(img)


    def get_embedding(self, img: np.ndarray) -> np.ndarray | None:
        faces = self.get_faces(img)
        if not faces:
            return None
        
        # largest face
        face = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
        return face.normed_embedding  # 512-d, already L2 normalized


    def get_face_embeddings(self, img: np.ndarray) -> list[dict]:
        faces = self.get_faces(img)
        if not faces:
            return []

        height, width = img.shape[:2]
        results = []
        for face in faces:
            x1, y1, x2, y2 = face.bbox.astype(float)
            results.append({
                "box": [
                    float(max(0.0, min(1.0, x1 / width))),
                    float(max(0.0, min(1.0, y1 / height))),
                    float(max(0.0, min(1.0, x2 / width))),
                    float(max(0.0, min(1.0, y2 / height))),
                ],
                "embedding": face.normed_embedding,
            })
        return results
    
    
