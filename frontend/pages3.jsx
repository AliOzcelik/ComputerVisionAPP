/* More pages: Captioning */
const { useState: us, useEffect: ue } = React;

/* ============================================================
   IMAGE CAPTIONING
   ============================================================ */
function Captioning() {
  const [source, setSource] = us("image");
  const [model, setModel] = us("");
  const [visionModels, setVisionModels] = us([]);
  const [modelsLoading, setModelsLoading] = us(true);
  const [modelsError, setModelsError] = us("");
  const [decoding, setDecoding] = us("beam");
  const [imagePreview, setImagePreview] = us(null);
  const [lastFile, setLastFile] = us(null);
  const [lastSourceType, setLastSourceType] = us("image");
  const [captioning, setCaptioning] = us(false);
  const [captionError, setCaptionError] = us("");
  const [caption, setCaption] = us("");
  const [vqaLoading, setVqaLoading] = us(false);
  const [vqaHistory, setVqaHistory] = us([]); // [{q, a, error}]
  const [question, setQuestion] = us("");
  const vqaBottomRef = React.useRef(null);
  const webcam = useWebcam();
  const videoRef = React.useRef(null);

  const selectedModel = visionModels.find(item => item.name === model);
  const selectedModelLabel = selectedModel?.label || model || "No Ollama vision model";
  const selectedModelSize = selectedModel?.size
    ? `${(selectedModel.size / 1024 / 1024 / 1024).toFixed(1)} GB`
    : selectedModel ? "local" : "";
  const downloadCaptionResult = () => {
    const payload = {
      model,
      source_type: lastSourceType,
      caption,
      vqa: vqaHistory,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "caption-result.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  ue(() => {
    let active = true;
    const loadVisionModels = async () => {
      try {
        setModelsLoading(true);
        setModelsError("");
        const models = await window.API.getOllamaVisionModels();
        if (!active) return;
        setVisionModels(models);
        setModel(current => (
          models.some(item => item.name === current) ? current : models[0]?.name || ""
        ));
      } catch (err) {
        if (!active) return;
        setVisionModels([]);
        setModel("");
        setModelsError("Ollama not running — start it with: ollama serve");
      } finally {
        if (active) setModelsLoading(false);
      }
    };
    loadVisionModels();
    return () => { active = false; };
  }, []);

  ue(() => {
    if (source !== "webcam") webcam.disconnect();
  }, [source]);

  const formatError = (err) =>
    err.message.includes("503") || err.message.toLowerCase().includes("ollama")
      ? "Ollama is not running. Start it with: ollama serve"
      : err.message;

  const describe = async () => {
    if (!lastFile || !model) return;
    setCaptionError("");
    setCaption("");
    setCaptioning(true);
    try {
      const result = await window.API.captionImage(lastFile, model, "Describe this image.", lastSourceType);
      setCaption(result.caption || "(no response)");
    } catch (err) {
      setCaptionError(formatError(err));
    } finally {
      setCaptioning(false);
    }
  };

  const askVqa = async () => {
    if (!question.trim() || !lastFile || !model) return;
    const q = question;
    setQuestion("");
    setVqaLoading(true);
    const entry = { q, a: "", error: "" };
    setVqaHistory(h => [...h, entry]);
    setTimeout(() => vqaBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const result = await window.API.captionImage(lastFile, model, q, lastSourceType);
      setVqaHistory(h => h.map((item, i) => i === h.length - 1 ? { ...item, a: result.caption || "(no response)" } : item));
    } catch (err) {
      setVqaHistory(h => h.map((item, i) => i === h.length - 1 ? { ...item, error: formatError(err) } : item));
    } finally {
      setVqaLoading(false);
      setTimeout(() => vqaBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const loadImage = async (file, srcType) => {
    setLastFile(file);
    setLastSourceType(srcType);
    setCaption("");
    setVqaHistory([]);
    setCaptionError("");
    const preview = await window.API.fileToDataURL(file);
    setImagePreview(preview);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadImage(file, "image");
  };

  const captureSnapshot = async () => {
    const video = videoRef.current;
    if (!video || !webcam.isConnected) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
    const file = new File([blob], "snapshot.jpg", { type: "image/jpeg" });
    await loadImage(file, "webcam");
  };

  const hasImage = !!lastFile;
  const viewerTag = source === "webcam" && webcam.isConnected && !imagePreview
    ? "webcam · live"
    : imagePreview ? "snapshot" : "no source";

  return (
    <>
      <PageHeader
        kicker="06 — Captioning"
        title="Image Captioning & VQA"
        sub="Upload an image or capture a webcam snapshot, then describe it or ask questions about it."
        actions={
          <>
            <button className="btn" onClick={downloadCaptionResult} disabled={!caption && vqaHistory.length === 0}><Icon.Download size={11}/> Download result</button>
          </>
        }
      />
      <div className="split">
        <ViewerPane tag={viewerTag} subTag="vlm" live={source === "webcam" && webcam.isConnected && !imagePreview}>
          <div className="viewer-frame" style={{ width: "min(100%, 640px)", aspectRatio: 1, position: "relative" }}>
            {source === "webcam" && webcam.isConnected && !imagePreview ? (
              <WebcamViewer webcam={webcam} videoRef={videoRef}/>
            ) : imagePreview ? (
              <img src={imagePreview} alt="Source" style={{ width: "100%", height: "100%", objectFit: "contain" }}/>
            ) : (
              <FauxLandscape/>
            )}
            <div className="viewer-corner-marks"><span className="tr"/><span className="bl"/></div>
            {captioning && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
                <div className="spinner" style={{ width: 32, height: 32 }}/>
              </div>
            )}
          </div>
          {captioning && <Telemetry modelName={selectedModelLabel} modelSize={selectedModelSize} fps={null} ms={null} gpu={null} cpu={null} dets={null} extra={[]}/>}
        </ViewerPane>

        <ControlRail>
          <Section title="Source">
            <SourcePicker value={source} onChange={(s) => { setSource(s); setImagePreview(null); setLastFile(null); setCaption(""); setVqaHistory([]); setCaptionError(""); setVqaLoading(false); }} hasVideo={false} actions={false}/>
            {source === "webcam" && <WebcamDevicePicker webcam={webcam}/>}
            {source === "webcam" && webcam.isConnected && (
              <button className="btn primary" style={{ marginTop: 8, width: "100%" }} onClick={captureSnapshot}>
                Capture Snapshot
              </button>
            )}
            {source !== "webcam" && (
              <div style={{ marginTop: 8 }}>
                <label className="btn primary" style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <Icon.Upload size={11}/> Upload Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }}/>
                </label>
              </div>
            )}
            {imagePreview && (
              <button className="btn ghost" style={{ marginTop: 4, width: "100%" }} onClick={() => { setImagePreview(null); setLastFile(null); setCaption(""); setVqaHistory([]); setCaptionError(""); setVqaLoading(false); }}>
                Clear Image
              </button>
            )}
          </Section>

          <Section title="Model">
            <Field label="VLM">
              <select className="select" value={model} onChange={e => setModel(e.target.value)} disabled={modelsLoading || visionModels.length === 0}>
                {modelsLoading && <option value="">Loading Ollama vision models…</option>}
                {!modelsLoading && visionModels.length === 0 && <option value="">No vision models found</option>}
                {!modelsLoading && visionModels.map(item => (
                  <option key={item.name} value={item.name}>{item.label}</option>
                ))}
              </select>
            </Field>
            {modelsError && (
              <div style={{ fontSize: 10, color: "var(--bad)", padding: "4px 0" }}>{modelsError}</div>
            )}
            <Field label="Decoding">
              <select className="select" value={decoding} onChange={e => setDecoding(e.target.value)}>
                <option value="beam">Beam·5</option>
                <option value="greedy">Greedy</option>
                <option value="samp">Sample</option>
              </select>
            </Field>
          </Section>

          <Section title="Description" action={
            <button className="btn sm primary" onClick={describe} disabled={!hasImage || !model || captioning}>
              Describe
            </button>
          }>
            {captionError ? (
              <div style={{ fontSize: 11, color: "var(--bad)", lineHeight: 1.4, padding: "4px 0" }}>{captionError}</div>
            ) : caption ? (
              <div style={{ maxHeight: 320, overflowY: "auto", paddingRight: 2 }}>
                <div
                  className="caption-md"
                  dangerouslySetInnerHTML={{ __html: marked.parse(caption) }}
                />
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 11 }}>
                {!hasImage ? "Load an image first." : captioning ? "Running…" : "Click Describe to generate a caption."}
              </div>
            )}
          </Section>

          <Section title="Visual Q&A" count={vqaHistory.length || null}
            action={vqaHistory.length > 0 && <button className="btn sm ghost" onClick={() => setVqaHistory([])}>Clear</button>}
          >
            <div className="col" style={{ gap: 8 }}>
              {vqaHistory.length > 0 && (
                <div className="col" style={{ gap: 10, maxHeight: 340, overflowY: "auto", paddingRight: 2 }}>
                  {vqaHistory.map((item, i) => (
                    <div key={i} className="col" style={{ gap: 4 }}>
                      {/* Question bubble */}
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div style={{
                          background: "var(--accent-soft)",
                          border: "1px solid var(--accent)",
                          borderRadius: "8px 8px 2px 8px",
                          padding: "6px 10px",
                          fontSize: 12,
                          color: "var(--ink)",
                          maxWidth: "90%",
                          lineHeight: 1.4,
                        }}>
                          {item.q}
                        </div>
                      </div>
                      {/* Answer bubble */}
                      <div style={{ display: "flex", justifyContent: "flex-start" }}>
                        <div style={{
                          background: "var(--paper-2)",
                          border: "1px solid var(--hairline)",
                          borderRadius: "8px 8px 8px 2px",
                          padding: "6px 10px",
                          fontSize: 12,
                          maxWidth: "95%",
                        }}>
                          {item.error ? (
                            <span style={{ color: "var(--bad)", fontSize: 11 }}>{item.error}</span>
                          ) : item.a ? (
                            <div className="caption-md" style={{ fontSize: 12 }} dangerouslySetInnerHTML={{ __html: marked.parse(item.a) }}/>
                          ) : (
                            <span style={{ color: "var(--ink-3)" }}>
                              {i === vqaHistory.length - 1 && vqaLoading ? "…" : "(no response)"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={vqaBottomRef}/>
                </div>
              )}
              <div className="row" style={{ gap: 6 }}>
                <input
                  className="input"
                  placeholder={hasImage ? "Ask something about the image…" : "Load an image first"}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  style={{ flex: 1 }}
                  onKeyDown={e => e.key === "Enter" && askVqa()}
                  disabled={!hasImage || vqaLoading}
                />
                <button className="btn primary" onClick={askVqa} disabled={!question.trim() || !hasImage || !model || vqaLoading}>
                  {vqaLoading ? <div className="spinner"/> : "Ask"}
                </button>
              </div>
            </div>
          </Section>

          {/* <Section title="CLIP tags" count={tags.length} action={<button className="btn sm ghost">Re-tag</button>}>
            <div className="row" style={{ flexWrap: "wrap", gap: 4 }}>
              {tags.map((t, i) => (
                <span key={i} className={"chip" + (i === 0 ? " accent" : "")}>{t}<span className="mono" style={{ fontSize: 9, marginLeft: 4, opacity: 0.7 }}>{(0.6 + Math.random()*0.39).toFixed(2)}</span></span>
              ))}
            </div>
          </Section> */}
        </ControlRail>
      </div>
    </>
  );
}
window.PAGES.caption = Captioning;
