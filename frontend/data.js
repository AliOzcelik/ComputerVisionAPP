/* Shared frontend constants and empty runtime defaults */
window.APP_DATA = {
  registered_faces: [],

  coco_classes: [
    "person","bicycle","car","motorcycle","airplane","bus","train","truck","boat",
    "traffic light","fire hydrant","stop sign","parking meter","bench",
    "bird","cat","dog","horse","sheep","cow","elephant","bear","zebra","giraffe",
    "backpack","umbrella","handbag","tie","suitcase",
    "frisbee","skis","snowboard","sports ball","kite","baseball bat","baseball glove",
    "skateboard","surfboard","tennis racket",
    "bottle","wine glass","cup","fork","knife","spoon","bowl",
    "banana","apple","sandwich","orange","broccoli","carrot","hot dog","pizza","donut","cake",
    "chair","couch","potted plant","bed","dining table","toilet",
    "tv","laptop","mouse","remote","keyboard","cell phone",
    "microwave","oven","toaster","sink","refrigerator",
    "book","clock","vase","scissors","teddy bear","hair drier","toothbrush"
  ],

  fun_detections: [],

  recent_activity: [],

  pose_keypoints: [
    // x, y in 0..1 — roughly a standing figure (front-facing) within viewer
    [0.50,0.10], // nose
    [0.48,0.09],[0.52,0.09], // eyes
    [0.46,0.10],[0.54,0.10], // ears
    [0.42,0.20],[0.58,0.20], // shoulders
    [0.38,0.34],[0.62,0.34], // elbows
    [0.34,0.46],[0.66,0.46], // wrists
    [0.44,0.46],[0.56,0.46], // hips
    [0.43,0.66],[0.57,0.66], // knees
    [0.43,0.86],[0.57,0.86], // ankles
  ],

  pose_skeleton: [
    [5,6],[5,7],[7,9],[6,8],[8,10],          // arms
    [5,11],[6,12],[11,12],                   // torso
    [11,13],[13,15],[12,14],[14,16],         // legs
    [0,1],[0,2],[1,3],[2,4]                  // head
  ],

  segments: [],
};
