import cv2
import os
from dataclasses import dataclass, replace
from typing import Tuple, List, Optional
from .cuda_utils import check_cuda_available, get_cuda_device_info
import json

@dataclass
class DetectionConfig:
    """Configuration for a specific cascade detector"""
    name: str
    filename: str
    color: Tuple[int, int, int]  # BGR
    scale_factor: float = 1.3
    min_neighbors: int = 5
    min_size: Tuple[int, int] = (30, 30)
    apply_on_roi: bool = False
    roi_region: str = 'full'

    @classmethod
    def from_dict(cls, data):
        """Create DetectionConfig from dictionary"""
        return cls(
            name=data['name'],
            filename=data['filename'],
            color=tuple(data['color']),
            scale_factor=data.get('scale_factor', 1.3),
            min_neighbors=data.get('min_neighbors', 5),
            min_size=tuple(data.get('min_size', [30, 30])),
            apply_on_roi=data.get('apply_on_roi', False),
            roi_region=data.get('roi_region', 'full')
        )


# Get the directory where this module is located
_MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
CASCADE_CONFIGS_FILE = os.path.join(_MODULE_DIR, "cascade_configs.json")
DETECTION_PRESETS_FILE = os.path.join(_MODULE_DIR, "detection_presets.json")

def load_cascade_configs():
    with open(CASCADE_CONFIGS_FILE, 'r') as f:
        data = json.load(f)
    return {key: DetectionConfig.from_dict(val) for key, val in data.items()}

def load_detection_presets():
    with open(DETECTION_PRESETS_FILE, 'r') as f:
        return json.load(f)


# Load configs at module level
CASCADE_CONFIGS = load_cascade_configs()
DETECTION_PRESETS = load_detection_presets()


class CascadeDetector:
    
    def __init__(self, directory="haarcascades", directory_cuda="haarcascades_cuda", use_cuda=False):
        self.directory = directory
        self.directory_cuda = directory_cuda
        self.loaded_cascades = {}
        self.active_configs = {}
        self.use_cuda = False
        self.cuda_available = False

        if use_cuda:
            self.cuda_available, device_count, message = check_cuda_available()
            print(f"CUDA Check: {message}")
            if not self.cuda_available:
                print("Falling back to CPU cascades...")
                self.use_cuda = False
            else:
                self.use_cuda = True

    def check_cuda(self):
        cuda_available = check_cuda_available()
        return cuda_available
    
    def get_cascade_path(self, filename):
        if self.use_cuda:
            path = os.path.join(self.directory_cuda, filename)
        else:
            path = os.path.join(self.directory, filename)
            
        if os.path.exists(path):
            return path
        else:
            print(f"file doesn't exist {path}")
            return False
        
            
    def load_cascade(self, cascade_key):
        
        if cascade_key not in CASCADE_CONFIGS:
            print(f"Unknown cascade: {cascade_key}")
            return False
        
        config = CASCADE_CONFIGS[cascade_key]
        path = self.get_cascade_path(config.filename)
        
        try:
            if self.use_cuda and self.cuda_available:
                cascade = cv2.cuda.CascadeClassifier_create(path)
            else:
                cascade = cv2.CascadeClassifier(path)
                if cascade.empty():
                    print(f"Failed to load cascade: {path}")
                    return False

            self.loaded_cascades[cascade_key] = cascade
            self.active_configs[cascade_key] = config
            print(f"Loaded: {config.name} ({path})")
            return True

        except cv2.error as e:
            print(f"Error loading cascade {cascade_key}: {e}")
            return False
        
    
    def load_preset(self, preset_key):

        if preset_key not in DETECTION_PRESETS:
            print(f"Unknown preset: {preset_key}")
            return False

        preset = DETECTION_PRESETS[preset_key]
        loaded_count = 0

        # Load primary cascades
        for cascade_key in preset['primary']:
            if self.load_cascade(cascade_key):
                loaded_count += 1

        # Load secondary cascades (for ROI detection)
        for cascade_key in preset['secondary']:
            if self.load_cascade(cascade_key):
                loaded_count += 1

        return loaded_count > 0
    
    
    def detect(self, frame, gray, cascade_keys=None, parameter_overrides=None):
        results = {}
        primary_detections = []
        selected_keys = set(cascade_keys) if cascade_keys else set(self.loaded_cascades.keys())
        active_keys = set(selected_keys)

        # ROI cascades such as eyes and smiles need a face pass to establish regions.
        # If the user only selected ROI cascades, run frontal face cascades as support
        # but do not include those support detections in the returned results.
        needs_face_roi = any(
            key in self.active_configs and self.active_configs[key].apply_on_roi
            for key in selected_keys
        )
        if needs_face_roi and not any(key.startswith("frontalface") for key in active_keys):
            active_keys.update(key for key in self.loaded_cascades if key.startswith("frontalface"))

        # First pass: detect primary objects (faces, bodies, etc.)
        for key, cascade in self.loaded_cascades.items():
            if key not in active_keys:
                continue
            config = self.active_configs[key]
            if parameter_overrides and not config.apply_on_roi:
                config = replace(
                    config,
                    scale_factor=parameter_overrides.get("scale_factor", config.scale_factor),
                    min_neighbors=parameter_overrides.get("min_neighbors", config.min_neighbors),
                    min_size=parameter_overrides.get("min_size", config.min_size),
                )

            if config.apply_on_roi:
                continue  # Handle these in second pass

            detections = self._detect_objects(gray, cascade, config)
            if key in selected_keys:
                results[key] = detections
            primary_detections.extend([(d, key, config) for d in detections])

            # Draw detections
            for (x, y, w, h) in detections:
                cv2.rectangle(frame, (x, y), (x + w, y + h), config.color, 2)
                cv2.putText(frame, config.name, (x, y - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, config.color, 2)

        # Second pass: detect features within ROIs (eyes, smile within faces)
        for key, cascade in self.loaded_cascades.items():
            if key not in selected_keys:
                continue
            config = self.active_configs[key]

            if not config.apply_on_roi:
                continue

            # Apply to each primary detection ROI
            roi_results = []
            for (px, py, pw, ph), primary_key, _ in primary_detections:
                if config.apply_on_roi and not primary_key.startswith("frontalface"):
                    continue

                # Determine ROI region
                if config.roi_region == 'upper':
                    roi_x, roi_y = px, py
                    roi_gray = gray[py:py + ph // 2, px:px + pw]
                    roi_color = frame[py:py + ph // 2, px:px + pw]
                elif config.roi_region == 'lower':
                    roi_x, roi_y = px, py + ph // 2
                    roi_gray = gray[py + ph // 2:py + ph, px:px + pw]
                    roi_color = frame[py + ph // 2:py + ph, px:px + pw]
                else:
                    roi_x, roi_y = px, py
                    roi_gray = gray[py:py + ph, px:px + pw]
                    roi_color = frame[py:py + ph, px:px + pw]

                if roi_gray.size == 0:
                    continue

                detections = self._detect_objects(roi_gray, cascade, config)

                # Draw detections on ROI
                for (x, y, w, h) in detections:
                    cv2.rectangle(roi_color, (x, y), (x + w, y + h), config.color, 2)
                    roi_results.append((roi_x + x, roi_y + y, w, h))

            results[key] = roi_results

        return frame, results

    def _detect_objects(self, gray, cascade, config):
        """Run detection with a single cascade"""
        try:
            # CUDA detection
            if self.use_cuda and self.cuda_available:
                gpu_gray = cv2.cuda_GpuMat()
                gpu_gray.upload(gray)
                detections = cascade.detectMultiScale(gpu_gray)
                return detections.download() if detections is not None else []
            # CPU detection
            else:
                return cascade.detectMultiScale(
                    gray,
                    scaleFactor=config.scale_factor,
                    minNeighbors=config.min_neighbors,
                    minSize=config.min_size
                )
        except cv2.error as e:
            print(f"Detection error: {e}")
            return []
        
    def get_status(self):
        """Get current detector status"""
        mode = "CUDA" if self.use_cuda and self.cuda_available else "CPU"
        cascades = ", ".join(self.active_configs.keys())
        return f"Mode: {mode} | Active: {cascades}"
