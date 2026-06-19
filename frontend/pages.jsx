/* ==========================================================
   All feature pages. Each exports to window.PAGES.<key>.
   ========================================================== */

const PAGES = {};

/* ============================================================
   DASHBOARD
   ============================================================ */
function Dashboard({ go }) {
  const tiles = [
    { key: "face",     k: "01", name: "Face Recognition",   sub: "Register · identify · embed",         n: "0",   nLabel: "registered" },
    { key: "detect",   k: "02", name: "Object Detection",   sub: "YOLO · 80 COCO classes",              n: "0",   nLabel: "detections" },
    { key: "fun",      k: "03", name: "Haar Cascade Detector", sub: "Face · eye · smile cascades",      n: "3",   nLabel: "cascades" },
    { key: "segment",  k: "04", name: "Segmentation",       sub: "Semantic · instance · SAM 2",         n: "0",   nLabel: "segments" },
    { key: "pose",     k: "05", name: "Pose Estimation",    sub: "17 keypoints · skeleton overlay",     n: "0",   nLabel: "keypoints" },
    { key: "caption",  k: "06", name: "Captioning · VQA",   sub: "Describe images · Visual QA" ,        n: "VLM", nLabel: "ready" },
  ];
  return (
    <>
      <PageHeader
        title="Argus"
        sub="An app to experience Computer Vision"
      />
      <div className="page-body-scroll" style={{ padding: "22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 24 }}>
          {/* Tile grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {tiles.map(t => (
              <button key={t.key} className="tile-large" onClick={() => go(t.key)}>
                <div className="dot-grid"><span/><span/><span/><span/><span/><span/></div>
                <div className="kicker">№ {t.k}</div>
                <div className="num-big">{t.n}</div>
                <h3>{t.name}</h3>
                <p>{t.sub}</p>
                <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span className="label" style={{ whiteSpace: "nowrap", fontSize: 9 }}>{t.nLabel}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap" }}>→</span>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
PAGES.dashboard = Dashboard;

/* ============================================================
   FACE RECOGNITION
   ============================================================ */
function FaceBoxesOverlay({ faces = [], mediaSize, mirror = false }) {
  if (!faces.length) return null;

  const frameAspect = 4 / 3;
  let areaStyle = { position: "absolute", inset: 0, pointerEvents: "none" };
  if (mediaSize?.w && mediaSize?.h) {
    const mediaAspect = mediaSize.w / mediaSize.h;
    areaStyle = mediaAspect > frameAspect
      ? {
          position: "absolute",
          left: 0,
          width: "100%",
          height: `${(frameAspect / mediaAspect) * 100}%`,
          top: `${(1 - frameAspect / mediaAspect) * 50}%`,
          pointerEvents: "none",
        }
      : {
          position: "absolute",
          top: 0,
          height: "100%",
          width: `${(mediaAspect / frameAspect) * 100}%`,
          left: `${(1 - mediaAspect / frameAspect) * 50}%`,
          pointerEvents: "none",
        };
  }

  return (
    <svg className="det-overlay" viewBox="0 0 1 1" preserveAspectRatio="none" style={areaStyle}>
      {faces.map((face, i) => {
        const [rawX1, y1, rawX2, y2] = face.box || [0, 0, 0, 0];
        const x1 = mirror ? 1 - rawX2 : rawX1;
        const x2 = mirror ? 1 - rawX1 : rawX2;
        const w = Math.max(0.001, x2 - x1);
        const h = Math.max(0.001, y2 - y1);
        const known = Boolean(face.match);
        const color = known ? "#22c55e" : "#ef4444";
        const name = known ? (face.match?.name || face.label || "Known") : "Unknown";
        const conf = known && typeof face.confidence === "number" ? ` ${(face.confidence * 100).toFixed(1)}%` : "";
        const label = `${name}${conf}`;
        const labelW = Math.min(0.56, Math.max(0.20, label.length * 0.018 + 0.08));
        const labelY = y1 > 0.055 ? y1 - 0.045 : y1 + 0.006;

        return (
          <g key={i}>
            <rect x={x1} y={y1} width={w} height={h} fill="none" stroke={color} strokeWidth="0.006" vectorEffect="non-scaling-stroke"/>
            <rect x={x1} y={labelY} width={labelW} height="0.04" fill={color} rx="0.006"/>
            <text x={x1 + 0.01} y={labelY + 0.027} fill="white" fontSize="0.026" fontFamily="JetBrains Mono, monospace" fontWeight="700">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function FaceRecognition() {
  const [source, setSource] = useState("webcam");
  const [faces, setFaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [threshold, setThreshold] = useState(0.72);
  const [embedModel, setEmbedModel] = useState("buffalo-l");
  const [detector, setDetector] = useState("scrfd");
  const [registering, setRegistering] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Person");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageNaturalSize, setImageNaturalSize] = useState(null);
  const [match, setMatch] = useState(null);
  const [faceResults, setFaceResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [captureInterval, setCaptureInterval] = useState(500); // 2 FPS default for face recognition
  const webcam = useWebcam();
  const viewerFrameRef = useRef(null);
  const webcamVideoRef = useRef(null);
  const webcamActiveRef = useRef(false);
  const sel = faces.find(f => f.id === selected);

  useEffect(() => {
    window.API.getPersons().then(data => {
      setFaces(data.map(p => ({
        id: p.id,
        name: p.name,
        role: "Person",
        added: new Date(p.registered_at).toLocaleDateString(),
        samples: 1,
      })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    webcamActiveRef.current = source === "webcam" && webcam.isConnected;
    if (source === "webcam" && !webcam.isConnected) {
      setMatch(null);
      setError(null);
    }
  }, [source, webcam.isConnected]);

  // Handle webcam frame for recognition
  const handleWebcamFrame = async (blob) => {
    if (registering || !webcamActiveRef.current) return;
    try {
      const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
      const result = await window.API.recognizeFace(file, threshold);
      if (!webcamActiveRef.current) return;
      setFaceResults(result.faces || []);
      if (result.match) {
        setMatch({ id: result.match.id, name: result.match.name, conf: result.confidence });
        setError(null);
      } else {
        setMatch(null);
      }
    } catch (err) {
      // Silent fail for webcam frames
      setMatch(null);
      setFaceResults([]);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setError(null);
    setMatch(null);
    setFaceResults([]);
    setImageNaturalSize(null);
    const preview = await window.API.fileToDataURL(file);
    setImagePreview(preview);

    if (registering) return;

    setLoading(true);
    try {
      const result = await window.API.recognizeFace(file, threshold);
      setFaceResults(result.faces || []);
      if (result.match) {
        setMatch({ id: result.match.id, name: result.match.name, conf: result.confidence });
        setError(null);
      } else {
        setMatch(null);
        setError(result.faces?.length ? null : (result.message || "Unknown person"));
      }
    } catch (err) {
      setError(err.message);
      setMatch(null);
      setFaceResults([]);
    } finally {
      setLoading(false);
    }
  };

  const finishRegister = async () => {
    if (!newName.trim() || !imageFile) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.API.registerFace(newName, imageFile);
      const id = result.person_id;
      const newFace = { id, name: result.name || newName, role: newRole, added: new Date().toLocaleDateString(), samples: 1 };
      setFaces([newFace, ...faces]);
      setRegistering(false);
      setSelected(id);
      setNewName("");
      setNewRole("Person");
      setMatch(null);
      setFaceResults([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFace = async (id) => {
    try {
      await window.API.deleteFace(id);
    } catch (_) { /* best-effort */ }
    const next = faces.filter(f => f.id !== id);
    setFaces(next);
    if (selected === id && next.length) setSelected(next[0].id);
    if (selected === id && !next.length) setSelected(null);
  };

  const clearFaceSource = () => {
    setImagePreview(null);
    setImageFile(null);
    setImageNaturalSize(null);
    setMatch(null);
    setFaceResults([]);
    setError(null);
  };

  const resetFaceDefaults = () => {
    setThreshold(0.72);
    setEmbedModel("buffalo-l");
    setDetector("scrfd");
    setCaptureInterval(500);
    setMatch(null);
    setFaceResults([]);
    setError(null);
  };

  const startRegister = () => {
    setRegistering(true);
    setMatch(null);
    setFaceResults([]);
    setError(null);
    if (source === "webcam") {
      setSource("image");
      webcam.disconnect();
    }
  };

  return (
    <>
      <PageHeader
        kicker="01 — Face recognition"
        title="Face Recognition"
        sub="Register people from a still image or webcam frame. The model writes a 512-D embedding into Qdrant and matches incoming frames with cosine similarity."
        actions={
          <>
            <button
              className="btn"
              onClick={() => window.downloadViewerFrame(viewerFrameRef.current, "face-recognition-result.png")}
              disabled={!imagePreview && !(source === "webcam" && webcam.isConnected)}
            >
              <Icon.Download size={11}/> Download result
            </button>
          </>
        }
      />
      <div className="split">
        <ViewerPane
          tag={source === "webcam" && webcam.isConnected ? "webcam · live" : (imagePreview ? "uploaded image" : "webcam · 1080p")}
          subTag="recognition"
          live={source === "webcam" && webcam.isConnected}
          footerLeft={
            <>
              <span>{imageFile ? imageFile.name : source === "webcam" ? "webcam input" : "no image loaded"}</span>
              <div className="vf-spacer"/>
              <span>{match ? `${match.name} ${(match.conf * 100).toFixed(1)}%` : `threshold ${threshold.toFixed(2)}`}</span>
            </>
          }
        >
          <div ref={viewerFrameRef} className="viewer-frame" style={{ width: "min(100%, 720px)", aspectRatio: "4/3", position: "relative" }}>
            {source === "webcam" && webcam.isConnected ? (
              <WebcamViewer
                webcam={webcam}
                onFrame={handleWebcamFrame}
                captureInterval={captureInterval}
                videoRef={webcamVideoRef}
              />
            ) : imagePreview ? (
              <img
                src={imagePreview}
                alt="Uploaded"
                onLoad={e => setImageNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <FacePortrait name={registering ? newName || "?" : (sel?.name || "?")}/>
            )}
            {!registering && !loading && (
              <FaceBoxesOverlay
                faces={faceResults}
                mediaSize={source === "webcam" && webcam.isConnected ? null : imageNaturalSize}
                mirror={source === "webcam" && webcam.isConnected}
              />
            )}
            <div className="viewer-corner-marks"><span className="tr"/><span className="bl"/></div>

            {/* loading overlay */}
            {loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
                <div className="spinner" style={{ width: 32, height: 32 }}/>
              </div>
            )}

            {/* error message */}
            {error && !loading && (
              <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, padding: "8px 12px", background: "var(--bad)", color: "white", borderRadius: 4, fontSize: 11 }}>
                {error}
              </div>
            )}

          </div>

        </ViewerPane>

        <ControlRail>
          <Section title="Source">
            <SourcePicker value={source} onChange={(s) => { setMatch(null); setFaceResults([]); setError(null); setSource(s); if (s !== "webcam") webcam.disconnect(); }} hasVideo={false} actions={false}/>
            {source === "webcam" && (
              <WebcamDevicePicker webcam={webcam}/>
            )}
            {source === "webcam" && webcam.isConnected && (
              <Field label="Capture rate" value={`${Math.round(1000/captureInterval)} FPS`} style={{ marginTop: 8 }}>
                <Slider value={captureInterval} onChange={setCaptureInterval} min={200} max={2000} step={100}/>
              </Field>
            )}
            {source !== "webcam" && (
              <div style={{ marginTop: 8 }}>
                <label className="btn primary" style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <Icon.Upload size={11}/> Upload Image
                  <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }}/>
                </label>
                {imagePreview && (
                  <button className="btn ghost" style={{ marginTop: 4, width: "100%" }} onClick={clearFaceSource}>
                    Clear Image
                  </button>
                )}
              </div>
            )}
          </Section>

          <Section title="Model"
            action={<button className="btn sm ghost" onClick={resetFaceDefaults}><Icon.Reload size={10}/> Default</button>}>
            <Field label="Embedding network">
              <select className="select" value={embedModel} onChange={e => setEmbedModel(e.target.value)}>
                <option value="buffalo-l">InsightFace buffalo_l — 512-D</option>
              </select>
            </Field>
            <Field label="Match threshold" value={threshold.toFixed(2)}>
              <Slider value={threshold} onChange={setThreshold} min={0.4} max={0.95} step={0.01}/>
            </Field>
            <Field label="Detector">
              <select className="select" value={detector} onChange={e => setDetector(e.target.value)}>
                <option value="scrfd">SCRFD</option>
              </select>
            </Field>
          </Section>

          <Section title="Gallery" count={faces.length}
            action={<button className="btn sm primary" onClick={startRegister}><Icon.Plus size={10}/> Register</button>}>
            {registering ? (
              <div className="col" style={{ gap: 8, padding: "4px 0" }}>
                <Field label="Name">
                  <input className="input" placeholder="e.g. Maya Chen" value={newName} onChange={e => setNewName(e.target.value)} autoFocus/>
                </Field>
                <Field label="Role">
                  <input className="input" value={newRole} onChange={e => setNewRole(e.target.value)}/>
                </Field>
                <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", padding: "4px 0" }}>
                  {imageFile ? `Image: ${imageFile.name}` : "Upload an image above"}
                </div>
                <div className="row">
                  <button className="btn ghost" onClick={() => { setRegistering(false); setError(null); }}>Cancel</button>
                  <div className="spacer"/>
                  <button className="btn primary" onClick={finishRegister} disabled={!imageFile || !newName.trim() || loading}>
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="col" style={{ gap: 1 }}>
                {faces.length === 0 ? (
                  <div className="muted" style={{ fontSize: 11, lineHeight: 1.4 }}>
                    No registrations in this browser session.
                  </div>
                ) : (
                  faces.map(f => (
                    <div key={f.id} className={"list-row" + (f.id === selected ? " active" : "")} onClick={() => setSelected(f.id)}>
                      <FaceAvatar name={f.name}/>
                      <div>
                        <div className="name">{f.name}</div>
                        <div className="meta">{f.role} · {f.samples} sample</div>
                      </div>
                      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); removeFace(f.id); }} title="Remove from session list">
                        <Icon.Trash size={12}/>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </Section>

          {sel && !registering && (
            <Section title="Selected">
              <div className="col" style={{ gap: 4, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <div className="row"><span className="muted">ID</span><div className="spacer"/><span>{sel.id}</span></div>
                <div className="row"><span className="muted">Added</span><div className="spacer"/><span>{sel.added}</span></div>
                <div className="row"><span className="muted">Samples</span><div className="spacer"/><span>{sel.samples}</span></div>
                <div className="row"><span className="muted">Match</span><div className="spacer"/><span>{match && match.id === sel.id ? `${(match.conf * 100).toFixed(1)}%` : "-"}</span></div>
              </div>
            </Section>
          )}
        </ControlRail>
      </div>
    </>
  );
}
PAGES.face = FaceRecognition;

/* ============================================================
   OBJECT DETECTION  (YOLO)
   ============================================================ */
const OBJECT_DETECTION_DEFAULTS = {
  model: "coreml",
  conf: 0.5,
  iou: 0.45,
  imageSize: "640",
  captureInterval: 200,
};

function ObjectDetection() {
  const [source, setSource] = useState("media");
  const [model, setModel] = useState(OBJECT_DETECTION_DEFAULTS.model);
  const [conf, setConf] = useState(OBJECT_DETECTION_DEFAULTS.conf);
  const [iou, setIou] = useState(OBJECT_DETECTION_DEFAULTS.iou);
  const [imageSize, setImageSize] = useState(OBJECT_DETECTION_DEFAULTS.imageSize);
  const [classFilter, setClassFilter] = useState(new Set(window.APP_DATA.coco_classes));
  const [searchClass, setSearchClass] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [captureInterval, setCaptureInterval] = useState(OBJECT_DETECTION_DEFAULTS.captureInterval);
  const [openPanels, setOpenPanels] = useState({
    model: true,
    classes: true,
    detections: true,
  });
  const webcam = useWebcam();
  const detectionActiveRef = useRef(false);
  const viewerFrameRef = useRef(null);
  const webcamVideoRef = useRef(null);
  const videoRef = useRef(null);

  const filtered = window.APP_DATA.coco_classes.filter(c => c.includes(searchClass.toLowerCase()));
  const dets = detections.filter(d => d.conf >= conf && classFilter.has(d.cls));

  useEffect(() => {
    detectionActiveRef.current = source === "webcam" && webcam.isConnected;
    if (source === "webcam" && !webcam.isConnected) {
      setDetections([]);
      setError(null);
    }
  }, [source, webcam.isConnected]);

  // Handle webcam frame for detection
  const handleWebcamFrame = async (blob) => {
    if (!detectionActiveRef.current) return;
    try {
      const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
      const result = await window.API.detectObjects(file, model);
      if (!detectionActiveRef.current) return;
      setDetections(result.detections || []);
      setError(null);
    } catch (err) {
      // Silent fail for webcam frames
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
    const preview = await window.API.fileToDataURL(file);
    setMediaPreview(preview);
    if (!video) {
      setLoading(true);
      try {
        const result = await window.API.detectObjects(file, model);
        setDetections(result.detections || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const runOnFrame = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    const canvas = document.createElement("canvas");
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    canvas.getContext("2d").drawImage(vid, 0, 0);
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.9));
    const file = new File([blob], "frame.jpg", { type: "image/jpeg" });
    setLoading(true);
    setError(null);
    try {
      const result = await window.API.detectObjects(file, model);
      setDetections(result.detections || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (c) => {
    const n = new Set(classFilter);
    n.has(c) ? n.delete(c) : n.add(c);
    setClassFilter(n);
  };

  const resetDefaults = () => {
    setModel(OBJECT_DETECTION_DEFAULTS.model);
    setConf(OBJECT_DETECTION_DEFAULTS.conf);
    setIou(OBJECT_DETECTION_DEFAULTS.iou);
    setImageSize(OBJECT_DETECTION_DEFAULTS.imageSize);
    setCaptureInterval(OBJECT_DETECTION_DEFAULTS.captureInterval);
    setClassFilter(new Set(window.APP_DATA.coco_classes));
    setSearchClass("");
  };

  const togglePanel = (key) => {
    setOpenPanels(current => ({ ...current, [key]: !current[key] }));
  };

  const DetectionPanel = ({ panelKey, title, count, action, children }) => {
    const open = openPanels[panelKey];
    return (
      <div className="rail-section">
        <h3>
          <button
            className="row"
            onClick={() => togglePanel(panelKey)}
            style={{
              flex: 1,
              border: 0,
              background: "transparent",
              color: "var(--ink)",
              padding: 0,
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              textAlign: "left",
            }}
            aria-expanded={open}
          >
            <span className="mono" style={{ width: 10, color: "var(--ink-3)" }}>{open ? "▾" : "▸"}</span>
            <span>{title}</span>
          </button>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {count !== undefined && <span className="count">{count}</span>}
            {open && action}
          </span>
        </h3>
        {open && children}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        kicker="02 — Object detection"
        title="Object Detection"
        sub="YOLO inference with class filtering, confidence and NMS thresholds. Boxes draw over the source in real time."
        actions={
          <>
            <button
              className="btn"
              onClick={() => window.downloadViewerFrame(viewerFrameRef.current, "object-detection-result.png")}
              disabled={!mediaPreview && !(source === "webcam" && webcam.isConnected)}
            >
              <Icon.Download size={11}/> Download result
            </button>
          </>
        }
      />
      <div className="split">
        <ViewerPane hideToolbar>
          <div ref={viewerFrameRef} className="viewer-frame" style={{ width: "min(100%, 800px)", aspectRatio: "4/3", position: "relative" }}>
            {source === "webcam" && webcam.isConnected ? (
              <WebcamViewer
                webcam={webcam}
                onFrame={handleWebcamFrame}
                captureInterval={captureInterval}
                videoRef={webcamVideoRef}
                overlay={
                  <DetectionOverlay detections={dets} vWidth={800} vHeight={600} mirrorX/>
                }
              />
            ) : mediaPreview && isVideo ? (
              <video ref={videoRef} src={mediaPreview} controls style={{ width: "100%", height: "100%", objectFit: "contain" }}/>
            ) : mediaPreview ? (
              <img src={mediaPreview} alt="Uploaded" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
            ) : (
              <FacePortrait name="?"/>
            )}
            {loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
                <div className="spinner" style={{ width: 32, height: 32 }}/>
              </div>
            )}
            {source === "media" && !loading && !isVideo && <DetectionOverlay detections={dets} vWidth={800} vHeight={600}/>}
            {source === "media" && !loading && isVideo && dets.length > 0 && <DetectionOverlay detections={dets} vWidth={800} vHeight={600}/>}
            {error && !loading && (
              <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, padding: "8px 12px", background: "var(--bad)", color: "white", borderRadius: 4, fontSize: 11 }}>
                {error}
              </div>
            )}
            <div className="viewer-corner-marks"><span className="tr"/><span className="bl"/></div>
          </div>
          <Telemetry
            modelName="YOLO26n"
            modelSize="local"
            fps={92}
            ms={8.4}
            gpu={42}
            cpu={19}
            dets={dets.length}
            extra={[["IoU", iou.toFixed(2)], ["Confidence", conf.toFixed(2)]]}
          />
        </ViewerPane>

        <ControlRail>
          <Section title="Source">
            <SourcePicker mediaMode value={source} onChange={(s) => { setDetections([]); setError(null); setSource(s); setMediaPreview(null); setMediaFile(null); setIsVideo(false); if (s !== "webcam") webcam.disconnect(); }} actions={false}/>
            {source === "webcam" && <WebcamDevicePicker webcam={webcam}/>}
            {source === "webcam" && webcam.isConnected && (
              <Field label="Capture rate" value={`${Math.round(1000/captureInterval)} FPS`} style={{ marginTop: 8 }}>
                <Slider value={captureInterval} onChange={setCaptureInterval} min={66} max={1000} step={33}/>
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
                  <button className="btn ghost" style={{ width: "100%" }} onClick={() => { setMediaPreview(null); setMediaFile(null); setIsVideo(false); setDetections([]); setError(null); }}>
                    Clear
                  </button>
                )}
              </div>
            )}
          </Section>

          <DetectionPanel panelKey="model" title="Model"
            action={<button className="btn sm ghost" onClick={resetDefaults}><Icon.Reload size={10}/> Default</button>}>
            <Field label="Backbone">
              <select className="select" value={model} onChange={e => setModel(e.target.value)}>
                <option value="coreml">YOLO26n — CoreML (Apple Silicon)</option>
                <option value="pytorch">YOLO26n — PyTorch (CPU)</option>
              </select>
            </Field>
            <Field label="Confidence" value={conf.toFixed(2)}><Slider value={conf} onChange={setConf} min={0.05} max={0.95} step={0.01}/></Field>
            <Field label="IoU (NMS)" value={iou.toFixed(2)}><Slider value={iou} onChange={setIou} min={0.1} max={0.9} step={0.01}/></Field>
            <Field label="Image size">
              <Seg value={imageSize} onChange={setImageSize} options={["320","640","960","1280"]}/>
            </Field>
          </DetectionPanel>

          <DetectionPanel panelKey="classes" title="Classes" count={`${classFilter.size}/80`}
            action={<button className="btn sm ghost" onClick={() => setClassFilter(new Set())}>Clear</button>}>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <input className="input mono" style={{ width: "100%", paddingLeft: 24 }} placeholder="search classes…" value={searchClass} onChange={e => setSearchClass(e.target.value)}/>
              <Icon.Search size={11} style={{ position: "absolute", left: 8, top: 9, color: "var(--ink-3)" }}/>
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto", margin: "0 -4px" }}>
              {filtered.map(c => (
                <div key={c} className={"check-row" + (classFilter.has(c) ? " on" : "")} onClick={() => toggle(c)}>
                  <span className="cb"/>
                  <span>{c}</span>
                  <span className="count">{Math.floor(Math.random()*99)}</span>
                </div>
              ))}
            </div>
          </DetectionPanel>

          <DetectionPanel panelKey="detections" title="Detections" count={dets.length}>
            {dets.length === 0 ? (
              <div className="muted" style={{ fontSize: 11, padding: "4px 0" }}>No detections at this threshold.</div>
            ) : (
              <div className="col" style={{ gap: 1 }}>
                {dets.map((d, i) => (
                  <div key={i} className="row" style={{ padding: "4px 6px", fontSize: 11.5, borderBottom: "1px dashed var(--hairline)" }}>
                    <span style={{ width: 10, height: 10, border: "1.5px solid var(--accent)" }}/>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{d.cls}</span>
                    <div className="spacer"/>
                    <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{(d.conf * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </DetectionPanel>
        </ControlRail>
      </div>
    </>
  );
}
PAGES.detect = ObjectDetection;

window.PAGES = PAGES;
