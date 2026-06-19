import cv2
from ultralytics import YOLO
import numpy as np

class YOLODetectionEngine:
    
    def __init__(self, model_name="models/object_detection/yolo26n.mlpackage", input_size=(640, 640), backend=cv2.CAP_FFMPEG):
        self.model = YOLO(model=model_name)
        self.input_size = input_size
        self.backend = backend
        
        np.random.seed(42)  # same colors every run
        self.class_colors = {
            cls_id: tuple(np.random.randint(0, 256, size=3).tolist())
            for cls_id in range(len(self.model.names))

        }
    
    def detect(self, img, classes=list(range(80)), verbose=False, conf_threshold=0.5):
        results = self.model(img, classes=classes, conf=conf_threshold, verbose=verbose)
        return results

    def detect_image(self, img, classes=list(range(80)), verbose=False, conf_threshold=0.25):
        """Run YOLO on a decoded image and return JSON-safe normalized boxes."""
        if img is None:
            raise ValueError("Image could not be decoded")

        height, width = img.shape[:2]
        results = self.detect(
            img,
            classes=classes,
            verbose=verbose,
            conf_threshold=conf_threshold
        )
        result = results[0]

        if result.boxes is None:
            return []

        detections = []
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(float)
            cls_id = int(box.cls[0])
            normalized_box = [
                float(max(0.0, min(1.0, x1 / width))),
                float(max(0.0, min(1.0, y1 / height))),
                float(max(0.0, min(1.0, x2 / width))),
                float(max(0.0, min(1.0, y2 / height))),
            ]
            detections.append({
                "cls": self.model.names[cls_id],
                "conf": float(box.conf[0]),
                "box": normalized_box,
            })

        return detections
    
    def postprocess(self, original_frame, results):
        annotated = original_frame.copy()
        result = results[0]

        if result.boxes is None:
            return annotated

        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)

            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            cls_name = self.model.names[cls_id]
            label = f"{cls_name} {conf:.2f}"

            color = self.class_colors[cls_id]

            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            cv2.rectangle(
                annotated,
                (x1, max(0, y1 - 25)),
                (x1 + len(label) * 10, y1),
                color,
                -1
            )

            cv2.putText(
                annotated,
                label,
                (x1, max(20, y1 - 7)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 0),
                2
            )

        return annotated
    
    def run(self, url):
        if not self.backend:
            cap = cv2.VideoCapture(url, self.backend)
        else:
            cap = cv2.VideoCapture(url)
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    print("No frame")
                    continue
                
                results = self.detect(frame)
                annotated = self.postprocess(frame, results)
                cv2.imshow("Frame", annotated)
                
                key = cv2.waitKey(1) & 0xFF
                if key == ord("q"):
                    break
        finally:
            cap.release()
            cv2.destroyAllWindows()
            cv2.waitKey(1)
            cv2.waitKey(1)
            cv2.waitKey(1)

# url = 0
# backend = cv2.CAP_FFMPEG
# # backend = cv2.CAP_AVFOUNDATION
# model_path = "/Users/desidero/Desktop/apps/computer_vision/models/yolo26n.mlpackage"
# engine = YOLOEngine(model_name=model_path, backend=backend)
# engine.run(url)
