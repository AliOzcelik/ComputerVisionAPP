/* Additional feature pages — registered to window.PAGES */
const { useState: uS } = React;

/* ============================================================
   FUN DETECTION  (Haar cascades)
   ============================================================ */
function FunDetection() {
  const [source, setSource] = uS("media");
  const [cascades, setCascades] = uS({
    face: true,
    face_alt: true,
    face_alt2: true,
    profile: false,
    eye: true,
    eye_glasses: false,
    smile: true,
    upperbody: false,
    lowerbody: false,
    fullbody: false,
    catface: false,
    catface_extended: false,
  });
  const [minNeighbors, setMinNeighbors] = uS(5);
  const [scaleFactor, setScaleFactor] = uS(1.1);
  const [minSize, setMinSize] = uS(48);
  const [mediaFile, setMediaFile] = uS(null);
  const [mediaPreview, setMediaPreview] = uS(null);
  const [mediaSize, setMediaSize] = uS(null);
  const [isVideo, setIsVideo] = uS(false);
  const [detections, setDetections] = uS([]);
  const [loading, setLoading] = uS(false);
  const [error, setError] = uS(null);
  const [captureInterval, setCaptureInterval] = uS(150);
  const webcam = useWebcam();
  const viewerFrameRef = React.useRef(null);
  const webcamVideoRef = React.useRef(null);
  const videoRef = React.useRef(null);

  const activeCascadeKeys = () => Object.entries(cascades).filter(([, on]) => on).map(([key]) => key);
  const haarOptions = () => ({
    cascades: activeCascadeKeys(),
    scaleFactor,
    minNeighbors,
    minSize,
  });

  const handleWebcamFrame = async (blob) => {
    if (!activeCascadeKeys().length) {
      setDetections([]);
      return;
    }
    try {
      const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
      const result = await window.API.detectHaar(file, haarOptions());
      const transformed = (result.detections || []).map(d => ({
        cls: d.type || d.cls || "face",
        conf: d.confidence || d.conf || 0.9,
        box: d.box || [d.x / 800, d.y / 600, (d.x + d.width) / 800, (d.y + d.height) / 600],
      }));
      setDetections(transformed);
      setError(null);
    } catch (err) {
      // Silent fail for webcam frames
    }
  };

  const runHaar = async (file) => {
    if (!activeCascadeKeys().length) {
      setDetections([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await window.API.detectHaar(file, haarOptions());
      setDetections((result.detections || []).map(d => ({
        cls: d.type || d.cls || "face",
        conf: d.confidence || d.conf || 0.9,
        box: d.box || [d.x / 800, d.y / 600, (d.x + d.width) / 800, (d.y + d.height) / 600],
      })));
    } catch (err) {
      setError(err.message);
      setDetections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const video = file.type.startsWith("video/");
    setMediaFile(file);
    setIsVideo(video);
    setError(null);
    setDetections([]);
    setMediaSize(null);
    const preview = await window.API.fileToDataURL(file);
    setMediaPreview(preview);
    if (!video) runHaar(file);
  };

  const runOnVideoFrame = async (videoEl) => {
    const vid = videoEl || videoRef.current;
    if (!vid) return;
    const canvas = document.createElement("canvas");
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    canvas.getContext("2d").drawImage(vid, 0, 0);
    setMediaSize({ w: vid.videoWidth, h: vid.videoHeight });
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.9));
    runHaar(new File([blob], "frame.jpg", { type: "image/jpeg" }));
  };

  const dets = detections.filter(d => cascades[d.cls]);
  // colors for haar overlays
  const palette = {
    face: "#C7472D",
    face_alt: "#D97706",
    face_alt2: "#B45309",
    profile: "#5C6B3D",
    eye: "#1E8A8A",
    eye_glasses: "#0F766E",
    smile: "#B07A1F",
    upperbody: "#7C3AED",
    lowerbody: "#6D28D9",
    fullbody: "#374151",
    catface: "#2563EB",
    catface_extended: "#0EA5E9",
  };
  const cascadeRows = [
    ["face", "Frontal face", "haarcascade_frontalface_default.xml", "928 KB"],
    ["face_alt", "Frontal face alt", "haarcascade_frontalface_alt.xml", "676 KB"],
    ["face_alt2", "Frontal face alt2", "haarcascade_frontalface_alt2.xml", "528 KB"],
    ["profile", "Profile face", "haarcascade_profileface.xml", "812 KB"],
    ["eye", "Eye", "haarcascade_eye.xml", "344 KB"],
    ["eye_glasses", "Eye with glasses", "haarcascade_eye_tree_eyeglasses.xml", "588 KB"],
    ["smile", "Smile", "haarcascade_smile.xml", "188 KB"],
    ["upperbody", "Upper body", "haarcascade_upperbody.xml", "534 KB"],
    ["lowerbody", "Lower body", "haarcascade_lowerbody.xml", "385 KB"],
    ["fullbody", "Full body", "haarcascade_fullbody.xml", "467 KB"],
    ["catface", "Cat face", "haarcascade_frontalcatface.xml", "320 KB"],
    ["catface_extended", "Cat face extended", "haarcascade_frontalcatface_extended.xml", "382 KB"],
  ];
  const overlayAreaStyle = (size) => {
    const base = { position: "absolute", pointerEvents: "none" };
    if (!size?.w || !size?.h) return { ...base, inset: 0 };
    const frameAspect = 4 / 3;
    const mediaAspect = size.w / size.h;
    if (mediaAspect > frameAspect) {
      const height = (frameAspect / mediaAspect) * 100;
      return { ...base, left: 0, width: "100%", height: `${height}%`, top: `${(100 - height) / 2}%` };
    }
    const width = (mediaAspect / frameAspect) * 100;
    return { ...base, top: 0, height: "100%", width: `${width}%`, left: `${(100 - width) / 2}%` };
  };
  const HaarOverlay = ({ mirror = false, size = null }) => (
    <svg className="det-overlay" viewBox="0 0 800 600" preserveAspectRatio="none" style={overlayAreaStyle(size)}>
      {dets.map((d, i) => {
        const [x1, y1, x2, y2] = d.box;
        const ox1 = mirror ? 1 - x2 : x1;
        const ox2 = mirror ? 1 - x1 : x2;
        const x = ox1 * 800, y = y1 * 600;
        const w = (ox2 - ox1) * 800, h = (y2 - y1) * 600;
        const c = palette[d.cls];
        return (
          <g key={i}>
            <rect className="det-box" x={x} y={y} width={w} height={h} style={{ stroke: c }}/>
            <Corners x={x} y={y} w={w} h={h}/>
            <rect className="det-label-bg" x={x} y={Math.max(0, y - 14)} width={d.cls.length * 7 + 38} height={14} style={{ stroke: c }}/>
            <text className="det-label" x={x + 4} y={Math.max(11, y - 3)} style={{ fill: c }}>
              {d.cls} <tspan dx={4} style={{ fill: "var(--ink-3)" }}>{(d.conf * 100).toFixed(0)}%</tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );

  return (
    <>
      <PageHeader
        kicker="03 — Haar Cascade Detector"
        title="Haar Cascade Detector"
        sub="Classic Viola-Jones features over integral images. Toggle cascades, tune the sliding-window parameters, watch them light up in real time."
        actions={
          <>
            <button
              className="btn"
              onClick={() => window.downloadViewerFrame(viewerFrameRef.current, "haar-detector-result.png")}
              disabled={!mediaPreview && !(source === "webcam" && webcam.isConnected)}
            >
              <Icon.Download size={11}/> Download result
            </button>
          </>
        }
      />
      <div className="split">
        <ViewerPane tag={source === "webcam" && webcam.isConnected ? "webcam · live" : (mediaPreview ? (isVideo ? "video" : "image") : "no source")} subTag="haar" live={source === "webcam" && webcam.isConnected}>
          <div ref={viewerFrameRef} className="viewer-frame" style={{ width: "min(100%, 720px)", aspectRatio: "4/3", position: "relative" }}>
            {source === "webcam" && webcam.isConnected ? (
              <WebcamViewer
                webcam={webcam}
                onFrame={handleWebcamFrame}
                captureInterval={captureInterval}
                videoRef={webcamVideoRef}
                overlay={<HaarOverlay mirror/>}
              />
            ) : mediaPreview && isVideo ? (
              <video
                ref={videoRef}
                src={mediaPreview}
                controls
                onLoadedMetadata={e => {
                  setMediaSize({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight });
                  e.currentTarget.currentTime = 0;
                  runOnVideoFrame(e.currentTarget);
                }}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : mediaPreview ? (
              <img
                src={mediaPreview}
                alt="Uploaded"
                onLoad={e => setMediaSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <FacePortrait name="?"/>
            )}
            {loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
                <div className="spinner" style={{ width: 32, height: 32 }}/>
              </div>
            )}
            {error && !loading && (
              <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, padding: "8px 12px", background: "var(--bad)", color: "white", borderRadius: 4, fontSize: 11 }}>
                {error}
              </div>
            )}
            {source === "media" && dets.length > 0 && <HaarOverlay size={mediaSize}/>}
            <div className="viewer-corner-marks"><span className="tr"/><span className="bl"/></div>
          </div>
          <Telemetry
            modelName="Haar (4 cascades)"
            modelSize="1.4 MB"
            fps={148}
            ms={3.2}
            gpu={0}
            cpu={32}
            dets={dets.length}
            extra={[["scale", scaleFactor.toFixed(2)], ["neighbors", `${minNeighbors}`], ["minSize", `${minSize}px`]]}
          />
        </ViewerPane>

        <ControlRail>
          <Section title="Source">
            <SourcePicker mediaMode value={source} onChange={(s) => { setSource(s); setMediaPreview(null); setMediaFile(null); setMediaSize(null); setIsVideo(false); setDetections([]); setError(null); if (s !== "webcam") webcam.disconnect(); }} actions={false}/>
            {source === "webcam" && <WebcamDevicePicker webcam={webcam}/>}
            {source === "webcam" && webcam.isConnected && (
              <Field label="Capture rate" value={`${Math.round(1000/captureInterval)} FPS`} style={{ marginTop: 8 }}>
                <Slider value={captureInterval} onChange={setCaptureInterval} min={66} max={500} step={33}/>
              </Field>
            )}
            {source === "media" && (
              <div className="col" style={{ marginTop: 8, gap: 4 }}>
                <label className="btn primary" style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <Icon.Upload size={11}/> Upload Image or Video
                  <input type="file" accept="image/*,video/*" onChange={handleFileSelect} style={{ display: "none" }}/>
                </label>
                {mediaPreview && (
                  <button className="btn ghost" style={{ width: "100%" }} onClick={() => { setMediaPreview(null); setMediaFile(null); setMediaSize(null); setIsVideo(false); setDetections([]); setError(null); }}>
                    Clear
                  </button>
                )}
              </div>
            )}
          </Section>

          <Section title="Cascades" count={`${Object.values(cascades).filter(Boolean).length}/${cascadeRows.length}`}
            action={<button className="btn sm ghost" onClick={() => setCascades(Object.fromEntries(cascadeRows.map(([k]) => [k, true])))}>All</button>}>
            <div className="col" style={{ gap: 1 }}>
              {cascadeRows.map(([k, label, file, size]) => (
                <div key={k} className={"check-row" + (cascades[k] ? " on" : "")} onClick={() => setCascades({ ...cascades, [k]: !cascades[k] })}>
                  <span className="cb"/>
                  <div>
                    <div>{label}</div>
                    <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{file}</div>
                  </div>
                  <span className="count">{size}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Detector parameters">
            <Field label="scaleFactor" value={scaleFactor.toFixed(2)}><Slider value={scaleFactor} onChange={setScaleFactor} min={1.01} max={1.5} step={0.01}/></Field>
            <Field label="minNeighbors" value={minNeighbors}><Slider value={minNeighbors} onChange={(v) => setMinNeighbors(Math.round(v))} min={1} max={12} step={1}/></Field>
            <Field label="minSize (px)" value={minSize}><Slider value={minSize} onChange={(v) => setMinSize(Math.round(v))} min={16} max={256} step={4}/></Field>
            <div className="mono" style={{ fontSize: 9.5, color: "var(--ink-4)", marginTop: 6 }}>
              Higher scaleFactor → faster, fewer detections.<br/>
              Higher minNeighbors → fewer false positives.
            </div>
          </Section>

          <Section title="Effects" action={<button className="btn sm ghost">Reset</button>}>
            <div className="col" style={{ gap: 6 }}>
              {[
                { id: "specs",   label: "Spectacles on eyes",  on: false },
                { id: "mustache",label: "Mustache",            on: false },
                { id: "hat",     label: "Top hat",             on: false },
                { id: "censor",  label: "Censor faces (blur)", on: false },
              ].map(e => (
                <div key={e.id} className="row" style={{ padding: "3px 0", fontSize: 11.5 }}>
                  <span style={{ textTransform: "capitalize" }}>{e.label}</span>
                  <div className="spacer"/>
                  <Toggle value={e.on} onChange={() => {}}/>
                </div>
              ))}
            </div>
          </Section>
        </ControlRail>
      </div>
    </>
  );
}
window.PAGES.fun = FunDetection;

/* ============================================================
   SEGMENTATION
   ============================================================ */
function Segmentation() {
  const [source, setSource] = uS("media");
  const [model, setModel] = uS("coreml");
  const [opacity, setOpacity] = uS(0.55);
  const [mediaFile, setMediaFile] = uS(null);
  const [mediaPreview, setMediaPreview] = uS(null);
  const [isVideo, setIsVideo] = uS(false);
  const [segmentations, setSegmentations] = uS([]);
  const [annotatedImage, setAnnotatedImage] = uS(null);
  const [imgNaturalW, setImgNaturalW] = uS(null);
  const [imgNaturalH, setImgNaturalH] = uS(null);
  const [loading, setLoading] = uS(false);
  const [error, setError] = uS(null);
  const [captureInterval, setCaptureInterval] = uS(500);
  const webcam = useWebcam();
  const viewerFrameRef = React.useRef(null);
  const webcamVideoRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const VW = 800, VH = 600;

  const handleWebcamFrame = async (blob) => {
    try {
      const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
      const result = await window.API.segment(file, model);
      setSegmentations(result.segmentations || []);
      setError(null);
    } catch (err) {}
  };

  const runSeg = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.API.segment(file, model);
      setSegmentations(result.segmentations || []);
      setAnnotatedImage(result.annotated_image ? `data:image/jpeg;base64,${result.annotated_image}` : null);
    } catch (err) {
      setError(err.message);
      setSegmentations([]);
      setAnnotatedImage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const video = file.type.startsWith("video/");
    setMediaFile(file);
    setIsVideo(video);
    setError(null);
    setSegmentations([]);
    const preview = await window.API.fileToDataURL(file);
    setMediaPreview(preview);
    if (!video) runSeg(file);
  };

  const runOnFrame = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    const canvas = document.createElement("canvas");
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    canvas.getContext("2d").drawImage(vid, 0, 0);
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.9));
    runSeg(new File([blob], "frame.jpg", { type: "image/jpeg" }));
  };

  const segs = segmentations;

  return (
    <>
      <PageHeader
        kicker="04 — Segmentation"
        title="Image Segmentation"
        sub="Semantic, instance, or panoptic masks. Click a region in the viewer to isolate it, or use SAM 2 for interactive prompts."
        actions={
          <>
            <button
              className="btn"
              onClick={() => window.downloadViewerFrame(viewerFrameRef.current, "segmentation-result.png")}
              disabled={!mediaPreview && !annotatedImage && !(source === "webcam" && webcam.isConnected)}
            >
              <Icon.Download size={11}/> Download result
            </button>
          </>
        }
      />
      <div className="split">
        <ViewerPane tag={source === "webcam" && webcam.isConnected ? "webcam · live" : (mediaPreview ? (isVideo ? "video" : "image") : "no source")} subTag="instance" live={source === "webcam" && webcam.isConnected}>
          <div ref={viewerFrameRef} className="viewer-frame" style={{ width: "min(100%, 760px)", aspectRatio: "4/3", position: "relative" }}>
            {source === "webcam" && webcam.isConnected ? (
              <WebcamViewer
                webcam={webcam}
                onFrame={handleWebcamFrame}
                captureInterval={captureInterval}
                videoRef={webcamVideoRef}
                overlay={segs.length > 0 && (
                  <svg className="det-overlay" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" style={{ transform: "scaleX(-1)" }}>
                    {segs.map((seg, i) => seg.points && (
                      <polygon key={i}
                        points={seg.points.map(([x, y]) => `${x * VW},${y * VH}`).join(" ")}
                        fill={seg.color} stroke={seg.stroke} strokeWidth="1.5"
                        style={{ opacity }}
                      />
                    ))}
                  </svg>
                )}
              />
            ) : mediaPreview && isVideo ? (
              <video ref={videoRef} src={mediaPreview} controls style={{ width: "100%", height: "100%", objectFit: "contain" }}/>
            ) : annotatedImage ? (
              <img src={annotatedImage} alt="Segmentation result" style={{ width: "100%", height: "100%", objectFit: "contain" }}/>
            ) : mediaPreview ? (
              <img src={mediaPreview} alt="Uploaded" style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onLoad={e => { setImgNaturalW(e.target.naturalWidth); setImgNaturalH(e.target.naturalHeight); }}/>
            ) : (
              <FacePortrait name="?"/>
            )}
            {loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
                <div className="spinner" style={{ width: 32, height: 32 }}/>
              </div>
            )}
            {error && !loading && (
              <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, padding: "8px 12px", background: "var(--bad)", color: "white", borderRadius: 4, fontSize: 11 }}>
                {error}
              </div>
            )}
            <div className="viewer-corner-marks"><span className="tr"/><span className="bl"/></div>
          </div>
          <Telemetry
            modelName="YOLO26n-seg"
            modelSize="local"
            fps={null}
            ms={68}
            gpu={64}
            cpu={12}
            dets={segs.length}
            extra={[["Classes", `${segs.length}`]]}
          />
        </ViewerPane>

        <ControlRail>
          <Section title="Source">
            <SourcePicker mediaMode value={source} onChange={(s) => { setSource(s); setMediaPreview(null); setMediaFile(null); setIsVideo(false); setSegmentations([]); setAnnotatedImage(null); setError(null); if (s !== "webcam") webcam.disconnect(); }} actions={false}/>
            {source === "webcam" && <WebcamDevicePicker webcam={webcam}/>}
            {source === "webcam" && webcam.isConnected && (
              <Field label="Capture rate" value={`${Math.round(1000/captureInterval)} FPS`} style={{ marginTop: 8 }}>
                <Slider value={captureInterval} onChange={setCaptureInterval} min={250} max={2000} step={125}/>
              </Field>
            )}
            {source === "media" && (
              <div style={{ marginTop: 8 }} className="col" style={{ gap: 4 }}>
                <label className="btn primary" style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <Icon.Upload size={11}/> Upload Image or Video
                  <input type="file" accept="image/*,video/*" onChange={handleFileSelect} style={{ display: "none" }}/>
                </label>
                {isVideo && mediaPreview && (
                  <button className="btn primary" style={{ width: "100%" }} onClick={runOnFrame} disabled={loading}>
                    {loading ? "Running…" : "Run on current frame"}
                  </button>
                )}
                {mediaPreview && (
                  <button className="btn ghost" style={{ width: "100%" }} onClick={() => { setMediaPreview(null); setMediaFile(null); setIsVideo(false); setSegmentations([]); setAnnotatedImage(null); setError(null); }}>
                    Clear
                  </button>
                )}
              </div>
            )}
          </Section>

          <Section title="Model">
            <Field label="Backbone">
              <select className="select" value={model} onChange={e => setModel(e.target.value)}>
                <option value="coreml">YOLO26n-seg — CoreML (Apple Silicon)</option>
                <option value="pytorch">YOLO26n-seg — PyTorch (CPU)</option>
              </select>
            </Field>
            <Field label="Mode">
            </Field>
            <Field label="Mask opacity" value={opacity.toFixed(2)}><Slider value={opacity} onChange={setOpacity} min={0} max={1} step={0.01}/></Field>
          </Section>

          <Section title="Detected classes" count={segs.length}>
            <div className="col" style={{ gap: 4 }}>
              {segs.map((s, i) => (
                <div key={i} className="row" style={{ padding: "4px 0", fontSize: 11.5 }}>
                  <span className="swatch-sm" style={{ background: s.stroke, width: 10, height: 10, border: "1px solid var(--hairline-strong)" }}/>
                  <span style={{ textTransform: "capitalize" }}>{s.cls}</span>
                  <div className="spacer"/>
                  <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{(s.conf * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Section>

        </ControlRail>
      </div>
    </>
  );
}
window.PAGES.segment = Segmentation;

/* ============================================================
   POSE ESTIMATION
   ============================================================ */
// [a, b, color] — COCO-17 connections with distinct colors per body region
const POSE_SKELETON = [
  [5,  6,  "#FF8C00"], // shoulders
  [5,  7,  "#4FC3F7"], // L shoulder-elbow
  [7,  9,  "#0288D1"], // L elbow-wrist
  [6,  8,  "#FF6F00"], // R shoulder-elbow
  [8,  10, "#E64A19"], // R elbow-wrist
  [5,  11, "#81C784"], // L shoulder-hip
  [6,  12, "#81C784"], // R shoulder-hip
  [11, 12, "#66BB6A"], // hips
  [11, 13, "#CE93D8"], // L hip-knee
  [13, 15, "#9C27B0"], // L knee-ankle
  [12, 14, "#FFCC02"], // R hip-knee
  [14, 16, "#F9A825"], // R knee-ankle
  [0,  1,  "#FFF176"], // nose-L eye
  [0,  2,  "#FFF176"], // nose-R eye
  [1,  3,  "#FFF176"], // L eye-ear
  [2,  4,  "#FFF176"], // R eye-ear
];

const KP_COLORS = [
  "#FFF176","#4FC3F7","#FF6F00","#4FC3F7","#FF6F00",
  "#4FC3F7","#FF6F00","#4FC3F7","#FF6F00","#0288D1",
  "#E64A19","#CE93D8","#FFCC02","#9C27B0","#F9A825",
  "#9C27B0","#F9A825",
];

function PoseSkeleton({ persons, VW, VH, pointSize, showLabels, mirrorX, imgW, imgH }) {
  if (!persons || persons.length === 0) return null;

  // When imgW/imgH are provided, compute letterbox offset for objectFit:contain
  let toX, toY;
  if (imgW && imgH) {
    const s = Math.min(VW / imgW, VH / imgH);
    const ox = (VW - imgW * s) / 2;
    const oy = (VH - imgH * s) / 2;
    toX = kx => kx * imgW * s + ox;
    toY = ky => ky * imgH * s + oy;
  } else {
    toX = kx => kx * VW;
    toY = ky => ky * VH;
  }

  return (
    <svg className="det-overlay" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none"
      style={{ transform: mirrorX ? "scaleX(-1)" : "none" }}>
      {persons.map((person, pi) =>
        person.keypoints && (
          <g key={pi}>
            {POSE_SKELETON.map(([a, b, color], i) => {
              const ka = person.keypoints[a], kb = person.keypoints[b];
              if (!ka || !kb || ka.conf < 0.4 || kb.conf < 0.4) return null;
              return <line key={i} x1={toX(ka.x)} y1={toY(ka.y)} x2={toX(kb.x)} y2={toY(kb.y)} stroke={color} strokeWidth="2" fill="none"/>;
            })}
            {person.keypoints.map((kp, i) => kp.conf >= 0.4 && (
              <g key={i}>
                <circle cx={toX(kp.x)} cy={toY(kp.y)} r={pointSize} fill={KP_COLORS[i] || "#fff"} stroke="#000" strokeWidth="0.5"/>
                {showLabels && <text x={toX(kp.x) + 6} y={toY(kp.y) + 3} fontFamily="var(--font-mono)" fontSize="9" fill="#fff">{kp.name}</text>}
              </g>
            ))}
          </g>
        )
      )}
    </svg>
  );
}

function PoseEstimation() {
  const [source, setSource] = uS("media");
  const [model, setModel] = uS("coreml");
  const [showLabels, setShowLabels] = uS(false);
  const [pointSize, setPointSize] = uS(4);
  const [persons, setPersons] = uS([]);
  const [imgNaturalW, setImgNaturalW] = uS(null);
  const [imgNaturalH, setImgNaturalH] = uS(null);
  const [loading, setLoading] = uS(false);
  const [error, setError] = uS(null);
  const [captureInterval, setCaptureInterval] = uS(200);
  const [mediaPreview, setMediaPreview] = uS(null);
  const [isVideo, setIsVideo] = uS(false);
  const webcam = useWebcam();
  const viewerFrameRef = React.useRef(null);
  const webcamVideoRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const VW = 800, VH = 600;

  const runPose = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.API.estimatePose(file, model);
      setPersons(result.persons || []);
    } catch (err) {
      setError(err.message);
      setPersons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWebcamFrame = async (blob) => {
    try {
      const file = new File([blob], "frame.jpg", { type: "image/jpeg" });
      const result = await window.API.estimatePose(file, model);
      setPersons(result.persons || []);
    } catch (_) {}
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const video = file.type.startsWith("video/");
    setIsVideo(video);
    setPersons([]);
    setError(null);
    setMediaPreview(await window.API.fileToDataURL(file));
    if (!video) runPose(file);
  };

  const runOnFrame = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    const canvas = document.createElement("canvas");
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    canvas.getContext("2d").drawImage(vid, 0, 0);
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.9));
    runPose(new File([blob], "frame.jpg", { type: "image/jpeg" }));
  };

  return (
    <>
      <PageHeader
        kicker="05 — Pose estimation"
        title="Pose Estimation"
        sub="17-keypoint skeleton from YOLO26n-pose. Detection-first pipeline — person bounding boxes feed the pose head."
        actions={
          <>
            <button
              className="btn"
              onClick={() => window.downloadViewerFrame(viewerFrameRef.current, "pose-estimation-result.png")}
              disabled={!mediaPreview && !(source === "webcam" && webcam.isConnected)}
            >
              <Icon.Download size={11}/> Download result
            </button>
          </>
        }
      />
      <div className="split">
        <ViewerPane tag={source === "webcam" && webcam.isConnected ? "webcam · live" : (mediaPreview ? (isVideo ? "video" : "image") : "no source")} subTag="17 kp" live={source === "webcam" && webcam.isConnected}>
          <div ref={viewerFrameRef} className="viewer-frame" style={{ width: "min(100%, 720px)", aspectRatio: "4/3", position: "relative" }}>
            {source === "webcam" && webcam.isConnected ? (
              <WebcamViewer
                webcam={webcam}
                onFrame={handleWebcamFrame}
                captureInterval={captureInterval}
                videoRef={webcamVideoRef}
                overlay={<PoseSkeleton persons={persons} VW={VW} VH={VH} pointSize={pointSize} showLabels={showLabels} mirrorX/>}
              />
            ) : mediaPreview && isVideo ? (
              <video ref={videoRef} src={mediaPreview} controls style={{ width: "100%", height: "100%", objectFit: "contain" }}/>
            ) : mediaPreview ? (
              <img
                src={mediaPreview}
                alt="Uploaded"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onLoad={e => { setImgNaturalW(e.target.naturalWidth); setImgNaturalH(e.target.naturalHeight); }}
              />
            ) : (
              <FacePortrait name="?"/>
            )}
            {loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
                <div className="spinner" style={{ width: 32, height: 32 }}/>
              </div>
            )}
            {source === "media" && !isVideo && persons.length > 0 && !loading && (
              <PoseSkeleton persons={persons} VW={VW} VH={VH} pointSize={pointSize} showLabels={showLabels} imgW={imgNaturalW} imgH={imgNaturalH}/>
            )}
            {error && !loading && (
              <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, padding: "8px 12px", background: "var(--bad)", color: "white", borderRadius: 4, fontSize: 11 }}>
                {error}
              </div>
            )}
            <div className="viewer-corner-marks"><span className="tr"/><span className="bl"/></div>
          </div>
          <Telemetry modelName="YOLO26n-pose" modelSize="local" fps={null} ms={null} gpu={null} cpu={null} dets={persons.length} extra={[["Persons", `${persons.length}`], ["Keypoints", "17"]]}/>
        </ViewerPane>

        <ControlRail>
          <Section title="Source">
            <SourcePicker mediaMode value={source} onChange={(s) => { setSource(s); setMediaPreview(null); setIsVideo(false); setPersons([]); setImgNaturalW(null); setImgNaturalH(null); setError(null); if (s !== "webcam") webcam.disconnect(); }} actions={false}/>
            {source === "webcam" && <WebcamDevicePicker webcam={webcam}/>}
            {source === "webcam" && webcam.isConnected && (
              <Field label="Capture rate" value={`${Math.round(1000/captureInterval)} FPS`} style={{ marginTop: 8 }}>
                <Slider value={captureInterval} onChange={setCaptureInterval} min={100} max={1000} step={50}/>
              </Field>
            )}
            {source === "media" && (
              <div style={{ marginTop: 8 }} className="col" style={{ gap: 4 }}>
                <label className="btn primary" style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <Icon.Upload size={11}/> Upload Image or Video
                  <input type="file" accept="image/*,video/*" onChange={handleFileSelect} style={{ display: "none" }}/>
                </label>
                {isVideo && mediaPreview && (
                  <button className="btn primary" style={{ width: "100%" }} onClick={runOnFrame} disabled={loading}>
                    {loading ? "Running…" : "Run on current frame"}
                  </button>
                )}
                {mediaPreview && (
                  <button className="btn ghost" style={{ width: "100%" }} onClick={() => { setMediaPreview(null); setIsVideo(false); setPersons([]); setImgNaturalW(null); setImgNaturalH(null); setError(null); }}>
                    Clear
                  </button>
                )}
              </div>
            )}
          </Section>

          <Section title="Model">
            <Field label="Backbone">
              <select className="select" value={model} onChange={e => setModel(e.target.value)}>
                <option value="coreml">YOLO26n-pose — CoreML (Apple Silicon)</option>
                <option value="pytorch">YOLO26n-pose — PyTorch (CPU)</option>
              </select>
            </Field>
          </Section>

          <Section title="Overlay">
            <Field label="Point size" value={`${pointSize}px`}><Slider value={pointSize} onChange={(v) => setPointSize(Math.round(v))} min={2} max={10} step={1}/></Field>
            <div className="row" style={{ padding: "4px 0", fontSize: 11.5 }}>
              <span>Show keypoint labels</span>
              <div className="spacer"/>
              <Toggle value={showLabels} onChange={setShowLabels}/>
            </div>
          </Section>

        </ControlRail>
      </div>
    </>
  );
}
window.PAGES.pose = PoseEstimation;
