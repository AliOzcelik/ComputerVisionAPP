/* ==========================================================
   Main app shell — sidebar, top bar, router, theme + direction
   ========================================================== */

const { useState: aS, useEffect: aE } = React;

const NAV = [
  { group: "Workspace", items: [
    { id: "dashboard", name: "Dashboard",        icon: "Dashboard",  badge: null },
  ]},
  { group: "Vision Workbenches", items: [
    { id: "face",      name: "Face Recognition", icon: "Face",       badge: null },
    { id: "detect",    name: "Object Detection", icon: "Box",        badge: null, dot: true },
    { id: "fun",       name: "Haar Cascade Detector", icon: "Eye",   badge: null },
    { id: "segment",   name: "Segmentation",     icon: "Layers",     badge: null },
    { id: "pose",      name: "Pose Estimation",  icon: "Body",       badge: null },
    { id: "caption",   name: "Captioning · VQA", icon: "Caption",    badge: null },
  ]},
];

const ACCENT_HEX = {
  atelier:   "#C7472D",
  oxford:    "#1E3A8A",
  olive:     "#5C6B3D",
  aubergine: "#6B2A6B",
  sea:       "#1F6B5C",
  sepia:     "#8E5A2A",
};

const GUIDE_CONTENT = {
  dashboard: {
    title: "Argus Guide",
    intro: "Use the sidebar to open a workbench. Each page is built around a source, model controls, a live/result viewer, and result-specific settings.",
    sections: [
      { title: "Basic flow", items: ["Choose a workbench from the sidebar.", "Upload media or connect the webcam.", "Adjust the page controls.", "Download the visible result when the output looks right."] },
      { title: "Tip", paragraphs: ["Start with uploaded images when checking accuracy. Use webcam mode after the model settings are working."] },
    ],
  },
  face: {
    title: "Face Recognition Guide",
    intro: "Register known people, then compare uploaded images or webcam frames against saved face embeddings.",
    sections: [
      { title: "How to use", items: ["Click Register.", "Upload a clear face image and enter a name.", "Save the person.", "Switch to image or webcam input to recognize faces.", "Tune the match threshold if matches are too strict or too loose."] },
      { title: "Settings", rows: [["Threshold", "0.68-0.76", "Higher means fewer false matches."], ["Embedding", "buffalo_l", "Current backend face model."], ["Webcam rate", "Lower FPS", "Useful when recognition feels heavy."]] },
      { title: "Good input", paragraphs: ["Use frontal, well-lit faces. Avoid tiny faces, motion blur, heavy occlusion, and extreme side angles."] },
    ],
  },
  detect: {
    title: "Object Detection Guide",
    intro: "Detect COCO objects with YOLO, filter classes, and control how many boxes are shown.",
    sections: [
      { title: "How to use", items: ["Upload an image or video, or connect the webcam.", "For video, pause at a frame and run detection on the current frame.", "Open Model to adjust confidence, IoU, and image size.", "Open Classes to choose which object categories are visible.", "Open Detections to inspect the current result list."] },
      { title: "Settings", rows: [["Confidence", "0.35-0.60", "Raise it to hide weak detections."], ["IoU", "0.40-0.60", "Controls duplicate box suppression."], ["Classes", "Any subset", "Hide categories that are not relevant."]] },
      { title: "Result", paragraphs: ["The Download result button saves the current visible frame with detection boxes."] },
    ],
  },
  fun: {
    title: "Haar Cascade Detector Guide",
    intro: "Run classic OpenCV Haar cascades for faces, eyes, smiles, bodies, and cat faces.",
    sections: [
      { title: "How to use", items: ["Upload media or connect the webcam.", "Choose which cascades are active.", "Adjust scaleFactor, minNeighbors, and minSize.", "Use higher minNeighbors to reduce false positives."] },
      { title: "Settings", rows: [["scaleFactor", "1.05-1.20", "Lower can find more objects but is slower."], ["minNeighbors", "4-8", "Higher is stricter."], ["minSize", "32-96px", "Ignore objects smaller than this."]] },
    ],
  },
  segment: {
    title: "Segmentation Guide",
    intro: "Create object masks and inspect segmented regions with adjustable overlay opacity.",
    sections: [
      { title: "How to use", items: ["Upload an image or video, or connect webcam.", "Run segmentation on the image or current video frame.", "Adjust mask opacity.", "Review detected classes in the side panel.", "Download the visible result when ready."] },
      { title: "Tip", paragraphs: ["Lower opacity helps inspect the original image. Higher opacity makes mask boundaries easier to see."] },
    ],
  },
  pose: {
    title: "Pose Estimation Guide",
    intro: "Estimate human body keypoints and draw a COCO-style skeleton over people.",
    sections: [
      { title: "How to use", items: ["Upload an image or video, or connect webcam.", "For video, run on the current frame.", "Adjust point size.", "Enable labels if you need to inspect keypoint names.", "Download the visible pose result."] },
      { title: "Good input", paragraphs: ["Use images where the full body or major joints are visible. Occluded limbs and crowded scenes can reduce keypoint quality."] },
    ],
  },
  caption: {
    title: "Captioning & VQA Guide",
    intro: "Use an installed Ollama vision model to describe an image or answer questions about it.",
    sections: [
      { title: "How to use", items: ["Upload an image or capture a webcam snapshot.", "Choose an Ollama vision model.", "Click Describe for a caption.", "Ask a question for VQA.", "Use decoding mode to control output style."] },
      { title: "Decoding", rows: [["Beam·5", "Balanced", "Usually better captions, slower."], ["Greedy", "Stable", "Fast and predictable."], ["Sample", "Varied", "More creative, less consistent."]] },
    ],
  },
};

function GuideDrawer({ open, onClose, page }) {
  const guide = GUIDE_CONTENT[page] || GUIDE_CONTENT.dashboard;

  return (
    <>
      {open && <button className="guide-backdrop" onClick={onClose} aria-label="Close guide"/>}
      <aside className={"guide-drawer" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="guide-head">
          <div>
            <div className="kicker">How to use</div>
            <h2>{guide.title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close guide">x</button>
        </div>

        <div className="guide-body">
          {guide.intro && (
            <section className="guide-section">
              <p>{guide.intro}</p>
            </section>
          )}
          {guide.sections.map(section => (
            <section className="guide-section" key={section.title}>
              <h3>{section.title}</h3>
              {section.items && (
                <ol>
                  {section.items.map(item => <li key={item}>{item}</li>)}
                </ol>
              )}
              {section.paragraphs && section.paragraphs.map(text => <p key={text}>{text}</p>)}
              {section.rows && (
                <div className="guide-table">
                  {section.rows.map(([name, value, note]) => (
                    <div className="guide-row" key={name}>
                      <span>{name}</span>
                      <span>{value}</span>
                      <p>{note}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </aside>
    </>
  );
}

function App() {
  const [tw, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "theme": "light",
    "direction": "atelier",
    "accent": "atelier",
    "density": "compact",
    "bbox": "full",
    "layout": "sidebar",
    "telemetry": "on"
  }/*EDITMODE-END*/);

  const [page, setPage] = aS("dashboard");
  const [guideOpen, setGuideOpen] = aS(false);

  // wire theme/direction/etc to document
  aE(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", tw.theme);
    html.setAttribute("data-direction", tw.direction);
    html.setAttribute("data-density", tw.density);
    html.setAttribute("data-bbox", tw.bbox);
    html.setAttribute("data-layout", tw.layout);
    html.setAttribute("data-telemetry", tw.telemetry);
    // accent: if value matches direction default, let the direction's css decide;
    // otherwise override.
    const def = { atelier: "atelier", lab: "oxford", studio: "olive" }[tw.direction];
    if (tw.accent && tw.accent !== def && ACCENT_HEX[tw.accent]) {
      html.style.setProperty("--accent", ACCENT_HEX[tw.accent]);
    } else {
      html.style.removeProperty("--accent");
    }
  }, [tw.theme, tw.direction, tw.density, tw.bbox, tw.layout, tw.telemetry, tw.accent]);

  // keyboard shortcuts: 1-9 jump pages
  aE(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const map = ["dashboard","face","detect","fun","segment","pose","caption"];
      const idx = parseInt(e.key);
      if (idx >= 0 && idx <= 9 && map[idx]) setPage(map[idx]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const Page = window.PAGES[page] || window.PAGES.dashboard;

  return (
    <>
      <div className="app">
        <header className="topbar">
          <div className="top-spacer"/>
          <div className="top-actions">
            <button className={"guide-trigger" + (guideOpen ? " active" : "")} onClick={() => setGuideOpen(true)}>Info</button>
            <button className="icon-btn"
              onClick={() => setTweak("theme", tw.theme === "light" ? "dark" : "light")}
              title={`Switch to ${tw.theme === "light" ? "dark" : "light"} mode`}>
              {tw.theme === "light" ? <Icon.Moon size={14}/> : <Icon.Sun size={14}/>}
            </button>
          </div>
        </header>

        <aside className="sidebar">
          {NAV.map(g => (
            <div key={g.group} className="nav-group">
              <div className="nav-group-title">
                <span>{g.group}</span>
                <span className="count">{g.items.length}</span>
              </div>
              {g.items.map(it => {
                const I = window.Icon[it.icon];
                return (
                  <button key={it.id} className={"nav-item" + (page === it.id ? " active" : "")} onClick={() => setPage(it.id)}>
                    <span className="ico">{I ? <I size={13}/> : null}</span>
                    <span>{it.name}</span>
                    {it.dot ? <span className="dot"/> : it.badge ? <span className="badge">{it.badge}</span> : <span/>}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <main className="main">
          <Page go={setPage}/>
        </main>

        <footer className="statusbar">
          <span className="st-item"><span className="st-dot"/> Online</span>
          <span className="st-item">CoreML · onnxruntime</span>
          <span className="st-item">CPU fallback enabled</span>
          <div className="st-spacer"/>
          <span className="st-item">{page === "face" ? "InsightFace buffalo_l" : page === "detect" ? "YOLO26n" : page === "segment" ? "YOLO26n-seg" : "-"}</span>
          <span className="st-item">{new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          <span className="st-item">⌘1–9 to jump</span>
        </footer>
      </div>

      <GuideDrawer open={guideOpen} onClose={() => setGuideOpen(false)} page={page}/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Direction">
          <TweakRadio
            label="Style"
            value={tw.direction}
            onChange={(v) => setTweak({ direction: v, accent: ({ atelier: "atelier", lab: "oxford", studio: "olive" })[v] })}
            options={[
              { value: "atelier", label: "Atelier" },
              { value: "lab",     label: "Lab" },
              { value: "studio",  label: "Studio" },
            ]}
          />
        </TweakSection>

        <TweakSection label="Display">
          <TweakRadio
            label="Theme"
            value={tw.theme}
            onChange={(v) => setTweak("theme", v)}
            options={[
              { value: "light", label: "Light" },
              { value: "dark",  label: "Dark" },
            ]}
          />
          <TweakRadio
            label="Layout"
            value={tw.layout}
            onChange={(v) => setTweak("layout", v)}
            options={[
              { value: "sidebar", label: "Sidebar" },
              { value: "topnav",  label: "Top nav" },
            ]}
          />
          <TweakRadio
            label="Density"
            value={tw.density}
            onChange={(v) => setTweak("density", v)}
            options={[
              { value: "compact",  label: "Compact" },
              { value: "spacious", label: "Spacious" },
            ]}
          />
        </TweakSection>

        <TweakSection label="Accent color">
          <TweakColor
            label="Accent"
            value={ACCENT_HEX[tw.accent] || ACCENT_HEX.atelier}
            options={Object.values(ACCENT_HEX)}
            onChange={(hex) => {
              const key = Object.entries(ACCENT_HEX).find(([k, v]) => v === hex)?.[0] || "atelier";
              setTweak("accent", key);
            }}
          />
        </TweakSection>

        <TweakSection label="Visualization">
          <TweakRadio
            label="Bbox"
            value={tw.bbox}
            onChange={(v) => setTweak("bbox", v)}
            options={[
              { value: "full",    label: "Full"    },
              { value: "corners", label: "Corners" },
              { value: "glow",    label: "Glow"    },
            ]}
          />
          <TweakRadio
            label="Telemetry"
            value={tw.telemetry}
            onChange={(v) => setTweak("telemetry", v)}
            options={[
              { value: "on",  label: "Show" },
              { value: "off", label: "Hide" },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
