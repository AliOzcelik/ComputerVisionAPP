import base64
import cv2
from ultralytics import YOLO
import numpy as np


class YOLOSegmentationEngine:

    def __init__(
        self,
        model_name="models/segmentation/yolo26n-seg.mlpackage",
        input_size=(640, 640),
        backend=cv2.CAP_AVFOUNDATION
    ):
        self.model = YOLO(model=model_name)
        self.input_size = input_size
        self.backend = backend

        np.random.seed(42)
        self.class_colors = {
            cls_id: tuple(np.random.randint(0, 256, size=3).tolist())
            for cls_id in range(len(self.model.names))
        }

    def segment(self, img, classes=None, verbose=False, conf_threshold=0.5):
        results = self.model(
            img,
            classes=classes,
            conf=conf_threshold,
            verbose=verbose
        )
        return results

    def segment_image(self, img, classes=None, verbose=False, conf_threshold=0.25):
        """Run segmentation and return normalized mask bounds + annotated image."""
        if img is None:
            raise ValueError("Image could not be decoded")

        height, width = img.shape[:2]
        results = self.segment(img, classes=classes, verbose=verbose, conf_threshold=conf_threshold)
        result = results[0]

        segmentations = []
        if result.masks is not None and result.boxes is not None:
            masks = result.masks.data.cpu().numpy()
            boxes = result.boxes
            for i, mask in enumerate(masks):
                cls_id = int(boxes.cls[i])
                conf = float(boxes.conf[i])
                color = self.class_colors[cls_id]
                mask_bin = (cv2.resize(mask, (width, height)) > 0.5).astype(np.uint8)
                contours, _ = cv2.findContours(mask_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                if not contours:
                    continue
                contour = max(contours, key=cv2.contourArea)
                epsilon = 0.002 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                points = [[float(p[0][0] / width), float(p[0][1] / height)] for p in approx]
                segmentations.append({
                    "cls": self.model.names[cls_id],
                    "conf": conf,
                    "points": points,
                    "color": f"rgba({color[0]},{color[1]},{color[2]},0.75)",
                    "stroke": f"rgb({color[0]},{color[1]},{color[2]})",
                })

        annotated_bgr = results[0].plot(boxes=False)
        _, buf = cv2.imencode(".jpg", annotated_bgr)
        annotated_b64 = base64.b64encode(buf).decode("utf-8")

        return {"segmentations": segmentations, "annotated_image": annotated_b64}

    
    
    def run(self, img):
        results = self.segment(img)
        annotated = self.postprocess(img, results)
        return annotated

            
            
# url = 0

# model_path = "/Users/desidero/Desktop/apps/computer_vision/models/yolo26n-seg.mlpackage"

# engine = YOLOEngine(
#     model_name=model_path,
#     backend=cv2.CAP_AVFOUNDATION
# )

# engine.run(url)


"""
def postprocess(self, original_frame, results, alpha=0.45):
        annotated = original_frame.copy()
        overlay = original_frame.copy()

        result = results[0]

        if result.masks is None or result.boxes is None:
            return annotated

        masks = result.masks.data.cpu().numpy()
        boxes = result.boxes

        h, w = original_frame.shape[:2]

        for i, mask in enumerate(masks):
            cls_id = int(boxes.cls[i])
            conf = float(boxes.conf[i])
            cls_name = self.model.names[cls_id]
            label = f"{cls_name} {conf:.2f}"

            color = self.class_colors[cls_id]

            # Resize mask to original frame size
            mask = cv2.resize(mask, (w, h))
            mask = mask > 0.5

            # Apply colored mask
            overlay[mask] = color

            # Get mask center for label placement
            ys, xs = np.where(mask)
            if len(xs) > 0 and len(ys) > 0:
                text_x = int(np.mean(xs))
                text_y = int(np.min(ys))

                cv2.rectangle(
                    annotated,
                    (text_x, max(0, text_y - 25)),
                    (text_x + len(label) * 10, text_y),
                    color,
                    -1
                )

                cv2.putText(
                    annotated,
                    label,
                    (text_x, max(20, text_y - 7)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 0, 0),
                    2
                )

        # Blend masks with original frame
        annotated = cv2.addWeighted(overlay, alpha, annotated, 1 - alpha, 0)

        return annotated        
        
        
def run_video(self, url, classes=None):
        if self.backend is not None:
            cap = cv2.VideoCapture(url, self.backend)
        else:
            cap = cv2.VideoCapture(url)

        try:
            while cap.isOpened():
                ret, frame = cap.read()

                if not ret:
                    print("No frame")
                    break

                results = self.segment(frame, classes=classes)
                annotated = self.postprocess(frame, results)

                cv2.imshow("YOLO Segmentation", annotated)

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

        finally:
            cap.release()
            cv2.destroyAllWindows()
            cv2.waitKey(1)
            cv2.waitKey(1)
            cv2.waitKey(1)
"""