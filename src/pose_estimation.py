import base64
import cv2
from ultralytics import YOLO
import numpy as np

class YOLOPoseEngine:
    
    def __init__(self, model_path, input_size=(640, 640), backend=None):
        self.input_size = input_size
        self.backend = backend
        self.model = YOLO(model_path)

        np.random.seed(42)  # same colors every run
        self.class_colors = {
            cls_id: tuple(np.random.randint(0, 256, size=3).tolist())
            for cls_id in range(len(self.model.names))
        }
        
        self.kp_names = [
            "nose", "left_eye", "right_eye", "left_ear", "right_ear",
            "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
            "left_wrist", "right_wrist", "left_hip", "right_hip",
            "left_knee", "right_knee", "left_ankle", "right_ankle",
        ]
                
    def preprocess(self, img):
        h, w = img.shape[:2]
        size = max(h, w)                                                                                                                                                                                                           
        top    = (size - h) // 2
        bottom = size - h - top
        left   = (size - w) // 2
        right  = size - w - left
        img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(0, 0, 0))
        img = cv2.resize(img, self.input_size)
        return img.astype(np.float32) / 255.0 
    
    def predict(self, img):
        results = self.model(img)
        return results
    
    def postprocess(self, img, results):
        height, width = img.shape[:2]
        result = results[0]                                                                                                                                                                                                        
        persons = []

        if result.keypoints is None or result.boxes is None:
            return persons

        kps_xy   = result.keypoints.xy.cpu().numpy()    # (N, 17, 2) pixel coords
        kps_conf = result.keypoints.conf.cpu().numpy()  # (N, 17)
        boxes    = result.boxes

        for i in range(len(boxes)):
            x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy().astype(float)
            keypoints = []
            for j in range(len(self.kp_names)):
                x, y = kps_xy[i][j]
                keypoints.append({
                    "name": self.kp_names[j],                                                                                                                                                                                           
                    "x": float(x / width),
                    "y": float(y / height),
                    "conf": float(kps_conf[i][j]),                                                                                                                                                                                 
                })
            persons.append({
                "bbox": [x1/width, y1/height, x2/width, y2/height],                                                                                                                                                                
                "conf": float(boxes.conf[i]),
                "keypoints": keypoints,
            })

        return persons
    
    def run(self, img):
        results = self.predict(img)
        persons = self.postprocess(img, results)
        annotated_bgr = results[0].plot(boxes=False)
        _, buf = cv2.imencode(".jpg", annotated_bgr)
        import base64
        annotated_b64 = base64.b64encode(buf).decode("utf-8")
        return {"persons": persons, "annotated_image": annotated_b64}