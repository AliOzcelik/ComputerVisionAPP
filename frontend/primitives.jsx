/* ==========================================================
   Shared primitives: icons, viewer, control rail, telemetry,
   source picker, tag chips, list rows, badges
   Exposes everything to window for cross-script access.
   ========================================================== */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ------------- Icons (single-stroke, editorial) ------------- */
const ICON = (path, opts = {}) => (props) => (
  <svg
    width={props.size || 14}
    height={props.size || 14}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={opts.sw || 1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {path}
  </svg>
);

const Icon = {
  Dashboard:    ICON(<><rect x="2" y="2" width="5" height="5"/><rect x="9" y="2" width="5" height="5"/><rect x="2" y="9" width="5" height="5"/><rect x="9" y="9" width="5" height="5"/></>),
  Face:         ICON(<><circle cx="8" cy="8" r="5.5"/><circle cx="6" cy="7" r=".5" fill="currentColor"/><circle cx="10" cy="7" r=".5" fill="currentColor"/><path d="M6 10.5c.7.6 1.4.9 2 .9s1.3-.3 2-.9"/></>),
  Box:          ICON(<><path d="M2 2h12v12H2z"/><path d="M5 5h6v6H5z"/></>),
  Sparkle:      ICON(<><path d="M8 1.5l1.2 3.6L13 6l-3.6 1.2L8 11l-1.2-3.8L3 6l3.6-.9z"/><path d="M13 11l.4 1.1 1.1.4-1.1.4L13 14l-.4-1.1-1.1-.4 1.1-.4z"/></>),
  Play:         ICON(<><path d="M4 2.5l9 5.5-9 5.5z"/></>),
  Layers:       ICON(<><path d="M8 2l6 3-6 3-6-3z"/><path d="M2 8l6 3 6-3"/><path d="M2 11l6 3 6-3"/></>),
  Body:         ICON(<><circle cx="8" cy="3" r="1.5"/><path d="M8 5v5"/><path d="M4 7l4 1 4-1"/><path d="M5 14l3-4 3 4"/></>),
  Text:         ICON(<><path d="M2 4h12"/><path d="M2 8h12"/><path d="M2 12h8"/></>),
  Brush:        ICON(<><path d="M11 2l3 3-7 7-3 .5L4 9z"/><path d="M3 13c-1 1-1 2-1 2s1 0 2-1"/></>),
  Caption:      ICON(<><rect x="2" y="3" width="12" height="10" rx="1"/><path d="M5 7h6"/><path d="M5 10h4"/></>),
  Folder:       ICON(<><path d="M2 4h4l1.5 2H14v7H2z"/></>),
  Cube:         ICON(<><path d="M8 1.5L14 5v6l-6 3.5L2 11V5z"/><path d="M2 5l6 3.5L14 5"/><path d="M8 8.5V14.5"/></>),
  Settings:     ICON(<><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4"/></>),
  Sun:          ICON(<><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3"/></>),
  Moon:         ICON(<><path d="M13 9.5A5.5 5.5 0 1 1 6.5 3a4.5 4.5 0 0 0 6.5 6.5z"/></>),
  Plus:         ICON(<><path d="M8 2v12M2 8h12"/></>),
  X:            ICON(<><path d="M3 3l10 10M13 3L3 13"/></>),
  Trash:        ICON(<><path d="M3 4h10M6 4V2.5h4V4M5 4l.6 9h4.8L11 4"/></>),
  Search:       ICON(<><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></>),
  Upload:       ICON(<><path d="M8 2v9"/><path d="M5 5l3-3 3 3"/><path d="M2 13h12"/></>),
  Camera:       ICON(<><rect x="1.5" y="4" width="13" height="9" rx="1"/><circle cx="8" cy="8.5" r="2.5"/><path d="M5 4l1-1.5h4L11 4"/></>),
  Film:         ICON(<><rect x="2" y="3" width="12" height="10"/><path d="M2 6h2M2 8h2M2 10h2M12 6h2M12 8h2M12 10h2"/></>),
  Image:        ICON(<><rect x="2" y="3" width="12" height="10"/><circle cx="6" cy="7" r="1"/><path d="M3 12l4-4 3 3 4-2"/></>),
  Pause:        ICON(<><rect x="4" y="3" width="2.5" height="10"/><rect x="9.5" y="3" width="2.5" height="10"/></>),
  Stop:         ICON(<><rect x="3.5" y="3.5" width="9" height="9"/></>),
  Download:     ICON(<><path d="M8 2v9"/><path d="M5 8l3 3 3-3"/><path d="M2 13h12"/></>),
  Reload:       ICON(<><path d="M2 8a6 6 0 0 1 10-4.5"/><path d="M14 8a6 6 0 0 1-10 4.5"/><path d="M12 1v3h-3"/><path d="M4 15v-3h3"/></>),
  Grid:         ICON(<><path d="M2 2h5v5H2z M9 2h5v5H9z M2 9h5v5H2z M9 9h5v5H9z"/></>),
  Bell:         ICON(<><path d="M4 11V7a4 4 0 1 1 8 0v4l1 2H3z"/><path d="M6.5 14a1.5 1.5 0 0 0 3 0"/></>),
  Sliders:      ICON(<><path d="M2 4h12M2 8h12M2 12h12"/><circle cx="5" cy="4" r="1.4" fill="var(--paper)"/><circle cx="10" cy="8" r="1.4" fill="var(--paper)"/><circle cx="7" cy="12" r="1.4" fill="var(--paper)"/></>),
  Help:         ICON(<><circle cx="8" cy="8" r="6"/><path d="M6 6.5a2 2 0 1 1 3 1.5c-1 .5-1 1-1 2"/><circle cx="8" cy="12" r=".5" fill="currentColor"/></>),
  Eye:          ICON(<><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5S1 8 1 8z"/><circle cx="8" cy="8" r="2"/></>),
  Stop2:        ICON(<><rect x="4" y="4" width="8" height="8"/></>),
};

window.Icon = Icon;

/* ------------- KBD ------------- */
const Kbd = ({ children }) => <span className="kbd">{children}</span>;
window.Kbd = Kbd;

/* ------------- Source picker (source mode + sample slot) ------------- */
function SourcePicker({ value, onChange, hasVideo = true, hasWebcam = true, mediaMode = false, sample, onSample, actions = true }) {
  const opts = [
    ...(mediaMode
      ? [{ id: "media", label: "Image or Video", Icon: Icon.Upload }]
      : [
          { id: "image", label: "Image", Icon: Icon.Image },
          ...(hasVideo ? [{ id: "video", label: "Video", Icon: Icon.Film }] : []),
        ]
    ),
    ...(hasWebcam ? [{ id: "webcam", label: "Webcam", Icon: Icon.Camera }] : []),
  ];
  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="seg" style={{ width: "100%" }}>
        {opts.map(o => (
          <button key={o.id} className={value === o.id ? "active" : ""} onClick={() => onChange(o.id)} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <o.Icon size={11}/>{o.label}
          </button>
        ))}
      </div>
      {actions && value !== "webcam" && (
        <div className="row" style={{ gap: 6 }}>
          <button className="btn sm" style={{ flex: 1, justifyContent: "center" }}>
            <Icon.Upload size={11}/> Upload {value}
          </button>
          <button className="btn sm ghost" onClick={() => onSample && onSample()}>
            <Icon.Folder size={11}/> Samples
          </button>
        </div>
      )}
      {sample && (
        <div className="info-chip" style={{ alignSelf: "flex-start" }}>{sample}</div>
      )}
    </div>
  );
}
window.SourcePicker = SourcePicker;

/* ------------- Telemetry overlay ------------- */
function Telemetry({ modelName, modelSize, fps = 62, ms = 8.4, gpu = 41, cpu = 24, dets = 0, extra = [] }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => p + 1), 700);
    return () => clearInterval(id);
  }, []);
  // tiny jitter to feel live
  const j = (n, amp = 0.5) => (n + (Math.sin(pulse * 0.9) * amp)).toFixed(1);
  return (
    <div className="telemetry">
      <div className="tel-title">
        <span>TELEMETRY</span>
        <span style={{ color: "var(--good)" }}>● live</span>
      </div>
      {modelName && (
        <div className="tel-row"><span className="k">Model</span><span className="v">{modelName}</span></div>
      )}
      {modelSize && (
        <div className="tel-row"><span className="k">Size</span><span className="v">{modelSize}</span></div>
      )}
      <div className="tel-divider"/>
      <div className="tel-row"><span className="k">FPS</span><span className="v good">{j(fps, 1.5)}</span></div>
      <div className="tel-row"><span className="k">Inference</span><span className="v">{j(ms, 0.6)}ms</span></div>
      <div className="tel-row"><span className="k">GPU</span><span className="v">{Math.round(gpu + Math.sin(pulse) * 4)}%</span></div>
      <div className="tel-row"><span className="k">CPU</span><span className="v">{Math.round(cpu + Math.cos(pulse * 0.6) * 3)}%</span></div>
      {dets !== null && (
        <div className="tel-row"><span className="k">Detections</span><span className="v">{dets}</span></div>
      )}
      {extra.length > 0 && <div className="tel-divider"/>}
      {extra.map((e, i) => (
        <div className="tel-row" key={i}><span className="k">{e[0]}</span><span className="v">{e[1]}</span></div>
      ))}
    </div>
  );
}
window.Telemetry = Telemetry;

/* ------------- Viewer pane wrapper ------------- */
function ViewerPane({ tag, subTag, live, showScrubber, children, footerLeft, footerRight, hideToolbar = true }) {
  return (
    <section className="viewer-pane">
      {!hideToolbar && (
        <div className="viewer-toolbar">
          <span className="vt-chip">{tag}</span>
          {subTag && <span className="vt-chip">{subTag}</span>}
          {live && <span className="vt-chip live">live</span>}
          <div className="vt-spacer"/>
          <button className="icon-btn" title="Fit"><Icon.Grid size={12}/></button>
          <button className="icon-btn" title="Reset"><Icon.Reload size={12}/></button>
          <button className="icon-btn" title="Download"><Icon.Download size={12}/></button>
        </div>
      )}
      <div className="viewer-canvas">
        <div className="bg-grid"/>
        {children}
      </div>
      <div className="viewer-footer">
        {footerLeft || (
          <>
            <span>{showScrubber ? "00:00:08 / 00:01:24" : "1920 × 1080 — sRGB"}</span>
            <div className="vf-spacer"/>
            <span>zoom 100%</span>
          </>
        )}
        {footerRight}
        {showScrubber && (
          <div className="scrubber" style={{ marginLeft: 10 }}>
            <div className="played" style={{ width: "16%" }}/>
            <div className="head" style={{ left: "16%" }}/>
          </div>
        )}
      </div>
    </section>
  );
}
window.ViewerPane = ViewerPane;

/* ------------- Page header ------------- */
function PageHeader({ kicker, title, sub, actions }) {
  return (
    <header className="page-header">
      <div className="page-title-block">
        {kicker && (
          <div className="breadcrumb">
            <span>Computer Vision</span>
            <span className="sep">/</span>
            <span>{kicker}</span>
          </div>
        )}
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div className="page-header-actions">{actions}</div>
    </header>
  );
}
window.PageHeader = PageHeader;

/* ------------- Control rail wrapper ------------- */
function ControlRail({ children }) {
  return <aside className="control-rail">{children}</aside>;
}
window.ControlRail = ControlRail;

function Section({ title, count, action, children, collapsible, defaultOpen = true }) {
  const canCollapse = collapsible !== undefined ? collapsible : title !== "Source";
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rail-section">
      <h3>
        {canCollapse ? (
          <button
            className="row"
            onClick={() => setOpen(v => !v)}
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
        ) : (
          <span>{title}</span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {count !== undefined && <span className="count">{count}</span>}
          {(!canCollapse || open) && action}
        </span>
      </h3>
      {(!canCollapse || open) && children}
    </div>
  );
}
window.Section = Section;

function Field({ label, value, children }) {
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        {value !== undefined && <span className="v">{value}</span>}
      </div>
      {children}
    </div>
  );
}
window.Field = Field;

/* ------------- Simple components ------------- */
function Slider({ value, onChange, min = 0, max = 1, step = 0.01 }) {
  return (
    <input
      type="range"
      className="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  );
}
window.Slider = Slider;

function Toggle({ value, onChange }) {
  return (
    <button
      className={"toggle " + (value ? "on" : "")}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    />
  );
}
window.Toggle = Toggle;

function Seg({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.id || o} className={(o.id || o) === value ? "active" : ""} onClick={() => onChange(o.id || o)}>
          {o.label || o}
        </button>
      ))}
    </div>
  );
}
window.Seg = Seg;

/* ------------- Result image download ------------- */
function drawMediaToCanvas(ctx, media, width, height) {
  const style = window.getComputedStyle(media);
  const fit = style.objectFit || "fill";
  const srcWidth = media.videoWidth || media.naturalWidth || media.width;
  const srcHeight = media.videoHeight || media.naturalHeight || media.height;
  if (!srcWidth || !srcHeight) return false;

  let sx = 0, sy = 0, sw = srcWidth, sh = srcHeight;
  let dx = 0, dy = 0, dw = width, dh = height;

  if (fit === "contain" || fit === "cover") {
    const sourceAspect = srcWidth / srcHeight;
    const targetAspect = width / height;
    const contain = fit === "contain";

    if ((sourceAspect > targetAspect && contain) || (sourceAspect < targetAspect && !contain)) {
      dw = width;
      dh = width / sourceAspect;
      dy = (height - dh) / 2;
    } else {
      dh = height;
      dw = height * sourceAspect;
      dx = (width - dw) / 2;
    }
  }

  const mirror = style.transform && style.transform !== "none";
  ctx.save();
  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    dx = width - dx - dw;
  }
  ctx.drawImage(media, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
  return true;
}

function inlineSvgComputedStyles(sourceSvg, cloneSvg) {
  const sourceNodes = [sourceSvg, ...sourceSvg.querySelectorAll("*")];
  const cloneNodes = [cloneSvg, ...cloneSvg.querySelectorAll("*")];
  cloneNodes.forEach((node, i) => {
    const source = sourceNodes[i];
    if (!source) return;
    const computed = window.getComputedStyle(source);
    [
      "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
      "font-family", "font-size", "font-weight", "opacity",
    ].forEach(prop => node.style.setProperty(prop, computed.getPropertyValue(prop)));
  });
}

function svgToImage(svg) {
  return new Promise((resolve, reject) => {
    const data = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not render overlay for download"));
    };
    img.src = url;
  });
}

async function drawSvgElementToCanvas(ctx, svg, width, height, frameEl) {
  const mirrorOverlay = window.getComputedStyle(svg).transform !== "none";
  const frameRect = frameEl?.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  const dx = frameRect ? svgRect.left - frameRect.left : 0;
  const dy = frameRect ? svgRect.top - frameRect.top : 0;
  const dw = Math.max(1, svgRect.width || width);
  const dh = Math.max(1, svgRect.height || height);
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", dw);
  clone.setAttribute("height", dh);
  inlineSvgComputedStyles(svg, clone);
  clone.style.position = "static";
  clone.style.inset = "auto";
  clone.style.left = "auto";
  clone.style.top = "auto";
  clone.style.right = "auto";
  clone.style.bottom = "auto";
  clone.style.width = `${dw}px`;
  clone.style.height = `${dh}px`;
  clone.style.transform = "none";
  clone.style.pointerEvents = "none";
  const img = await svgToImage(clone);
  ctx.save();
  if (mirrorOverlay) {
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, dw, dh);
  } else {
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  ctx.restore();
}

async function downloadViewerFrame(frameEl, filename = "vision-result.png") {
  if (!frameEl) return;

  const width = Math.max(1, Math.round(frameEl.clientWidth));
  const height = Math.max(1, Math.round(frameEl.clientHeight));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const bg = window.getComputedStyle(frameEl).backgroundColor || "#fff";
  ctx.fillStyle = bg === "rgba(0, 0, 0, 0)" ? "#fff" : bg;
  ctx.fillRect(0, 0, width, height);

  const media = frameEl.querySelector("video, img");
  const drewMedia = media ? drawMediaToCanvas(ctx, media, width, height) : false;

  const baseSvgs = drewMedia ? [] : [...frameEl.querySelectorAll(":scope > svg, :scope > div > svg")].filter(svg => !svg.classList.contains("det-overlay"));
  for (const svg of baseSvgs) {
    await drawSvgElementToCanvas(ctx, svg, width, height, frameEl);
  }

  if (!drewMedia && baseSvgs.length === 0) return;

  const overlays = [...frameEl.querySelectorAll("svg.det-overlay")];
  for (const overlay of overlays) {
    await drawSvgElementToCanvas(ctx, overlay, width, height, frameEl);
  }
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}
window.downloadViewerFrame = downloadViewerFrame;

function Chip({ children, accent, onRemove }) {
  return (
    <span className={"chip" + (accent ? " accent" : "")}>
      {children}
      {onRemove && <span className="x" onClick={onRemove}>×</span>}
    </span>
  );
}
window.Chip = Chip;

/* ------------- Detection overlay (SVG) ------------- */
function DetectionOverlay({ detections, palette, vWidth = 800, vHeight = 600, mirrorX = false }) {
  return (
    <svg className="det-overlay" viewBox={`0 0 ${vWidth} ${vHeight}`} preserveAspectRatio="none">
      {detections.map((d, i) => {
        const [x1, y1, x2, y2] = d.box;
        const drawX1 = mirrorX ? 1 - x2 : x1;
        const drawX2 = mirrorX ? 1 - x1 : x2;
        const x = drawX1 * vWidth, y = y1 * vHeight;
        const w = (drawX2 - drawX1) * vWidth, h = (y2 - y1) * vHeight;
        const color = (palette && palette[d.cls]) || "var(--accent)";
        return (
          <g key={i}>
            <rect className="det-box" x={x} y={y} width={w} height={h} style={{ stroke: color }}/>
            {/* corner ticks for "corners" style */}
            <g style={{ stroke: color }}>
              <Corners x={x} y={y} w={w} h={h}/>
            </g>
            <g>
              <rect className="det-label-bg" x={x} y={y - 14} width={Math.max(d.cls.length * 6.5 + 28, 60)} height={14} style={{ stroke: color }}/>
              <text className="det-label" x={x + 4} y={y - 3} style={{ fill: color }}>
                {d.cls}
                <tspan dx={6} style={{ fill: "var(--ink-3)" }}>{(d.conf * 100).toFixed(0)}%</tspan>
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
function Corners({ x, y, w, h, len = 8 }) {
  const c = (cx, cy, dx, dy) => (
    <path d={`M${cx + dx * len} ${cy} L${cx} ${cy} L${cx} ${cy + dy * len}`} fill="none" strokeWidth="2"/>
  );
  return (
    <>
      {c(x, y, 1, 1)}
      {c(x + w, y, -1, 1)}
      {c(x, y + h, 1, -1)}
      {c(x + w, y + h, -1, -1)}
    </>
  );
}
window.DetectionOverlay = DetectionOverlay;

/* ------------- Generic placeholder rectangle ------------- */
function Placeholder({ label = "Drop image here", hint, w, h }) {
  return (
    <div className="placeholder" style={{ width: w, height: h }}>
      <Icon.Image size={18}/>
      <span>{label}</span>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}
window.Placeholder = Placeholder;

/* ------------- Fake portrait (initials) — for face register list ------------- */
function FaceAvatar({ name, size = 28 }) {
  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  // hash to a hue so each face gets a distinct tone
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return (
    <div
      className="avatar"
      style={{
        width: size, height: size,
        background: `oklch(85% 0.04 ${hue})`,
        color: `oklch(28% 0.08 ${hue})`,
        fontSize: size * 0.42,
      }}
    >{initials}</div>
  );
}
window.FaceAvatar = FaceAvatar;

/* ------------- Big editorial portrait for the viewer ------------- */
function FacePortrait({ name }) {
  const initials = name ? name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase() : "";
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return (
    <div
      style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(160deg, oklch(82% 0.03 ${hue}) 0%, oklch(72% 0.05 ${hue}) 100%)`,
        color: `oklch(28% 0.08 ${hue})`,
        fontFamily: "var(--font-display)",
        fontSize: 130,
        letterSpacing: "-0.04em",
      }}
    >{initials}</div>
  );
}
window.FacePortrait = FacePortrait;

/* ------------- Histogram ------------- */
function Hist({ data, height = 28 }) {
  const max = Math.max(...data);
  return (
    <div className="hist" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="bar" style={{ height: `${(d / max) * 100}%`, background: "var(--ink-3)" }}/>
      ))}
    </div>
  );
}
window.Hist = Hist;

/* ------------- Number ticker for live values ------------- */
function Ticker({ value, format = (v) => v.toFixed(1) }) {
  return <span className="num" style={{ fontVariantNumeric: "tabular-nums" }}>{format(value)}</span>;
}
window.Ticker = Ticker;

/* ------------- Helpers ------------- */
window.useTimer = function (active, interval = 100) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setT(x => x + 1), interval);
    return () => clearInterval(id);
  }, [active, interval]);
  return t;
};

window.formatTime = function (ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
};

/* ------------- Faux landscape (for viewer demo content) ------------- */
function FauxLandscape() {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(86% 0.04 230)"/>
          <stop offset="1" stopColor="oklch(95% 0.03 70)"/>
        </linearGradient>
        <linearGradient id="grd" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(60% 0.06 70)"/>
          <stop offset="1" stopColor="oklch(40% 0.05 60)"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#sky)"/>
      <circle cx="640" cy="140" r="38" fill="oklch(96% 0.05 80)"/>
      <path d="M0 380 L120 320 L210 360 L340 280 L460 340 L600 290 L800 350 L800 600 L0 600 Z" fill="oklch(55% 0.04 90)"/>
      <path d="M0 460 L160 410 L280 450 L420 400 L560 440 L800 410 L800 600 L0 600 Z" fill="url(#grd)"/>
      {/* trees */}
      <g fill="oklch(38% 0.06 130)">
        <ellipse cx="120" cy="430" rx="14" ry="22"/>
        <rect x="118" y="430" width="4" height="22" fill="oklch(28% 0.04 50)"/>
        <ellipse cx="660" cy="420" rx="16" ry="26"/>
        <rect x="658" y="420" width="4" height="26" fill="oklch(28% 0.04 50)"/>
      </g>
      {/* figures (for person detection) */}
      <g fill="oklch(30% 0.04 30)">
        <circle cx="220" cy="430" r="8"/>
        <rect x="214" y="438" width="12" height="32" rx="2"/>
        <circle cx="420" cy="420" r="9"/>
        <rect x="413" y="429" width="14" height="36" rx="2"/>
      </g>
    </svg>
  );
}
window.FauxLandscape = FauxLandscape;

/* ------------- Faux scene (for object detection with table/laptop/cup) ------------- */
function FauxStudyScene() {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id="wall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(85% 0.02 80)"/>
          <stop offset="1" stopColor="oklch(70% 0.03 60)"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#wall)"/>
      {/* table */}
      <rect x="0" y="440" width="800" height="160" fill="oklch(45% 0.05 60)"/>
      <rect x="0" y="440" width="800" height="6" fill="oklch(35% 0.04 50)"/>
      {/* two figures */}
      <g fill="oklch(28% 0.03 30)">
        <ellipse cx="160" cy="200" rx="55" ry="65"/>
        <rect x="100" y="240" width="120" height="280" rx="20"/>
        <ellipse cx="410" cy="220" rx="55" ry="65"/>
        <rect x="350" y="260" width="120" height="260" rx="20"/>
      </g>
      {/* laptop */}
      <g>
        <rect x="540" y="380" width="200" height="120" fill="oklch(35% 0.01 80)" rx="3"/>
        <rect x="555" y="390" width="170" height="100" fill="oklch(75% 0.06 230)" rx="2"/>
        <rect x="520" y="498" width="240" height="8" fill="oklch(25% 0.02 80)"/>
      </g>
      {/* cup */}
      <g>
        <rect x="290" y="395" width="38" height="50" fill="oklch(85% 0.03 80)" rx="4"/>
        <path d="M328 405 q14 8 0 22" fill="none" stroke="oklch(85% 0.03 80)" strokeWidth="6"/>
      </g>
      {/* phone */}
      <rect x="464" y="425" width="36" height="60" fill="oklch(20% 0.01 80)" rx="4"/>
    </svg>
  );
}
window.FauxStudyScene = FauxStudyScene;

/* ------------- Faux portrait scene (for pose / fun detection / segmentation) ------------- */
function FauxFigureScene() {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id="bg2" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(80% 0.05 220)"/>
          <stop offset="1" stopColor="oklch(70% 0.06 240)"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg2)"/>
      {/* ground */}
      <rect y="500" width="800" height="100" fill="oklch(60% 0.06 70)"/>
      {/* figure */}
      <g fill="oklch(35% 0.04 30)">
        <circle cx="400" cy="90" r="42"/>
        <rect x="375" y="125" width="50" height="20" rx="4"/>
        <rect x="335" y="145" width="130" height="160" rx="10"/>
        {/* arms */}
        <rect x="300" y="160" width="42" height="140" rx="10"/>
        <rect x="458" y="160" width="42" height="140" rx="10"/>
        {/* legs */}
        <rect x="345" y="305" width="50" height="200" rx="10"/>
        <rect x="405" y="305" width="50" height="200" rx="10"/>
      </g>
      {/* tree */}
      <g>
        <rect x="700" y="320" width="14" height="180" fill="oklch(30% 0.05 50)"/>
        <ellipse cx="707" cy="290" rx="50" ry="60" fill="oklch(48% 0.08 130)"/>
      </g>
      {/* building */}
      <rect x="60" y="320" width="120" height="180" fill="oklch(75% 0.02 60)"/>
      <rect x="80" y="350" width="20" height="30" fill="oklch(50% 0.06 230)"/>
      <rect x="120" y="350" width="20" height="30" fill="oklch(50% 0.06 230)"/>
      <rect x="80" y="400" width="20" height="30" fill="oklch(50% 0.06 230)"/>
      <rect x="120" y="400" width="20" height="30" fill="oklch(50% 0.06 230)"/>
    </svg>
  );
}
window.FauxFigureScene = FauxFigureScene;

/* ------------- Faux generated artwork ------------- */
function FauxGenerated({ seed = 1, style = "default" }) {
  const r = (n) => ((seed * 9301 + 49297 + n * 131) % 233280) / 233280;
  const hue = Math.floor(r(1) * 360);
  return (
    <svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <radialGradient id={"gn" + seed} cx={0.3 + r(2) * 0.4} cy={0.3 + r(3) * 0.4}>
          <stop offset="0" stopColor={`oklch(85% 0.10 ${hue})`}/>
          <stop offset="0.6" stopColor={`oklch(60% 0.12 ${(hue + 40) % 360})`}/>
          <stop offset="1" stopColor={`oklch(30% 0.08 ${(hue + 80) % 360})`}/>
        </radialGradient>
        <filter id={"gr" + seed}><feTurbulence baseFrequency={0.02 + r(4) * 0.03} numOctaves="3"/><feColorMatrix values="0 0 0 0 .9  0 0 0 0 .85  0 0 0 0 .8  0 0 0 .25 0"/></filter>
      </defs>
      <rect width="800" height="800" fill={`url(#gn${seed})`}/>
      <rect width="800" height="800" filter={`url(#gr${seed})`} opacity="0.4"/>
      {/* faux composition shapes */}
      <circle cx={200 + r(5) * 400} cy={250 + r(6) * 200} r={60 + r(7) * 80} fill={`oklch(80% 0.10 ${(hue + 180) % 360})`} opacity="0.6"/>
      <path d={`M0 ${500 + r(8) * 100} Q400 ${300 + r(9) * 200} 800 ${500 + r(10) * 100}`} stroke={`oklch(35% 0.08 ${(hue + 200) % 360})`} strokeWidth="3" fill="none"/>
    </svg>
  );
}
window.FauxGenerated = FauxGenerated;

/* ------------- useWebcam hook ------------- */
function useWebcam() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [stream, setStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Enumerate available video devices
  const enumerateDevices = useCallback(async () => {
    try {
      // Request permission first to get labeled devices
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop());

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      return videoDevices;
    } catch (err) {
      setError(err.message || 'Failed to enumerate devices');
      return [];
    }
  }, []);

  // Connect to a specific device
  const connect = useCallback(async (deviceId) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setSelectedDeviceId(deviceId || newStream.getVideoTracks()[0]?.getSettings()?.deviceId);
      setIsConnected(true);
    } catch (err) {
      setError(err.message || 'Failed to connect to webcam');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [stream]);

  // Disconnect webcam
  const disconnect = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsConnected(false);
    setSelectedDeviceId(null);
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return {
    devices,
    selectedDeviceId,
    stream,
    isConnected,
    isConnecting,
    error,
    enumerateDevices,
    connect,
    disconnect,
    setSelectedDeviceId,
  };
}
window.useWebcam = useWebcam;

/* ------------- WebcamDevicePicker component ------------- */
function WebcamDevicePicker({ webcam }) {
  const [showDevices, setShowDevices] = useState(false);
  const { devices, selectedDeviceId, isConnected, isConnecting, error, enumerateDevices, connect, disconnect } = webcam;

  const handleConnect = async () => {
    if (devices.length === 0) {
      const devs = await enumerateDevices();
      if (devs.length === 1) {
        // Auto-connect if only one device
        connect(devs[0].deviceId);
      } else if (devs.length > 1) {
        setShowDevices(true);
      } else {
        connect(); // Try default
      }
    } else if (devices.length === 1) {
      connect(devices[0].deviceId);
    } else {
      setShowDevices(true);
    }
  };

  const handleSelectDevice = (deviceId) => {
    connect(deviceId);
    setShowDevices(false);
  };

  if (isConnected) {
    return (
      <div className="col" style={{ gap: 6, marginTop: 8 }}>
        <div className="row" style={{ gap: 6, alignItems: "center" }}>
          <span className="st-dot" style={{ background: "var(--good)" }}/>
          <span style={{ fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {devices.find(d => d.deviceId === selectedDeviceId)?.label || "Camera connected"}
          </span>
        </div>
        {devices.length > 1 && (
          <select
            className="select"
            value={selectedDeviceId || ''}
            onChange={e => connect(e.target.value)}
            style={{ fontSize: 11 }}
          >
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${devices.indexOf(d) + 1}`}
              </option>
            ))}
          </select>
        )}
        <button className="btn ghost" style={{ width: "100%" }} onClick={disconnect}>
          <Icon.Stop size={11}/> Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="col" style={{ gap: 6, marginTop: 8 }}>
      {showDevices && devices.length > 1 ? (
        <>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>Select camera:</div>
          {devices.map(d => (
            <button
              key={d.deviceId}
              className="btn ghost"
              style={{ width: "100%", justifyContent: "flex-start", fontSize: 11 }}
              onClick={() => handleSelectDevice(d.deviceId)}
            >
              <Icon.Camera size={11}/>
              {d.label || `Camera ${devices.indexOf(d) + 1}`}
            </button>
          ))}
          <button className="btn ghost" style={{ width: "100%", fontSize: 11 }} onClick={() => setShowDevices(false)}>
            Cancel
          </button>
        </>
      ) : (
        <button
          className="btn primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <><div className="spinner" style={{ width: 12, height: 12 }}/> Connecting...</>
          ) : (
            <><Icon.Camera size={11}/> Connect Webcam</>
          )}
        </button>
      )}
      {error && (
        <div style={{ fontSize: 10, color: "var(--bad)", padding: "4px 0" }}>
          {error}
        </div>
      )}
    </div>
  );
}
window.WebcamDevicePicker = WebcamDevicePicker;

/* ------------- WebcamViewer component ------------- */
function WebcamViewer({ webcam, onFrame, captureInterval = 200, overlay, showControls = true, videoRef: externalVideoRef }) {
  const internalRef = useRef(null);
  const videoRef = externalVideoRef || internalRef;
  const canvasRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const { stream, isConnected } = webcam;

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Capture frames at interval
  useEffect(() => {
    if (!isConnected || !stream || isPaused || !onFrame) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const captureFrame = async () => {
      if (processingRef.current || video.readyState < 2) return;

      processingRef.current = true;
      setIsProcessing(true);

      try {
        const ctx = canvas.getContext('2d');
        const targetWidth = video.clientWidth || 800;
        const targetHeight = video.clientHeight || 600;
        const sourceWidth = video.videoWidth || 640;
        const sourceHeight = video.videoHeight || 480;
        const targetAspect = targetWidth / targetHeight;
        const sourceAspect = sourceWidth / sourceHeight;

        let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;
        if (sourceAspect > targetAspect) {
          sw = sourceHeight * targetAspect;
          sx = (sourceWidth - sw) / 2;
        } else if (sourceAspect < targetAspect) {
          sh = sourceWidth / targetAspect;
          sy = (sourceHeight - sh) / 2;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/jpeg', 0.85);
        });

        if (blob) {
          await onFrame(blob);
        }
      } catch (err) {
        console.error('Frame capture error:', err);
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    };

    const intervalId = setInterval(captureFrame, captureInterval);
    return () => clearInterval(intervalId);
  }, [isConnected, stream, isPaused, onFrame, captureInterval]);

  if (!isConnected) {
    return (
      <div className="placeholder" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
        <Icon.Camera size={24} style={{ color: "var(--ink-3)" }}/>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Webcam not connected</span>
        <span style={{ fontSize: 10, color: "var(--ink-4)" }}>Click "Connect Webcam" to start</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)" // Mirror for selfie view
        }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }}/>

      {/* Overlay for detection results */}
      {overlay}

      {/* Processing indicator */}
      {isProcessing && (
        <div style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "rgba(0,0,0,0.6)",
          padding: "4px 8px",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          gap: 6
        }}>
          <div className="spinner" style={{ width: 10, height: 10 }}/>
          <span style={{ fontSize: 10, color: "white" }}>Processing</span>
        </div>
      )}

      {/* Pause/Resume controls */}
      {showControls && (
        <div style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          display: "flex",
          gap: 4
        }}>
          <button
            className="icon-btn"
            style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Icon.Play size={12}/> : <Icon.Pause size={12}/>}
          </button>
        </div>
      )}

      {/* Paused overlay */}
      {isPaused && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <span style={{
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "8px 16px",
            borderRadius: 4,
            fontSize: 12
          }}>
            Paused
          </span>
        </div>
      )}
    </div>
  );
}
window.WebcamViewer = WebcamViewer;
