/**
 * API Service Layer for Argus Vision Studio
 * Provides clean wrappers for all backend endpoints
 */
window.API = {
  BASE_URL: "",  // same origin when served by FastAPI

  /**
   * Object Detection - YOLO
   * POST /detection/detect
   * @param {File} imageFile - Image file to process
   * @returns {Promise<{detections: Array<{cls: string, conf: number, box: number[]}>}>}
   */
  async detectObjects(imageFile, model = "coreml") {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await fetch(`${this.BASE_URL}/detection/detect?model=${model}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Detection failed: ${res.status}`);
    }
    return res.json();
  },

  /**
   * List all registered persons
   * GET /face/persons
   * @returns {Promise<Array<{id: string, name: string, registered_at: string}>>}
   */
  async getPersons() {
    const res = await fetch(`${this.BASE_URL}/face/persons`);
    if (!res.ok) throw new Error(`Failed to load persons: ${res.status}`);
    return res.json();
  },

  /**
   * Delete a registered person from Qdrant and SQLite
   * DELETE /face/{personId}
   * @param {string} personId
   */
  async deleteFace(personId) {
    const res = await fetch(`${this.BASE_URL}/face/${encodeURIComponent(personId)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Delete failed: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Register a new face
   * POST /face/register
   * @param {string} name - Person's name
   * @param {File} imageFile - Image containing the face
   * @returns {Promise<{person_id: string, name: string}>}
   */
  async registerFace(name, imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await fetch(`${this.BASE_URL}/face/register?name=${encodeURIComponent(name)}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Registration failed: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Recognize a face
   * POST /face/recognize
   * @param {File} imageFile - Image containing the face to recognize
   * @param {number} threshold - Match threshold (0-1)
   * @returns {Promise<{match: object|null, confidence?: number, faces?: Array<{box: number[], match: object|null, confidence: number|null}>, message?: string}>}
   */
  async recognizeFace(imageFile, threshold = 0.5) {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await fetch(`${this.BASE_URL}/face/recognize?threshold=${threshold}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Recognition failed: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Haar Cascade Detection
   * POST /haardcascade/detect
   * @param {File} imageFile - Image to process
   * @returns {Promise<{detections: Array, annotated_image: any}>}
   */
  async detectHaar(imageFile, options = {}) {
    const formData = new FormData();
    formData.append("image", imageFile);
    if (options.cascades?.length) formData.append("cascades", options.cascades.join(","));
    if (options.scaleFactor !== undefined) formData.append("scale_factor", options.scaleFactor);
    if (options.minNeighbors !== undefined) formData.append("min_neighbors", options.minNeighbors);
    if (options.minSize !== undefined) formData.append("min_size", options.minSize);

    const res = await fetch(`${this.BASE_URL}/haardcascade/detect`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Haar detection failed: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Image Segmentation
   * POST /segment/segment
   * @param {File} imageFile - Image to segment
   * @returns {Promise<{segmentations: Array}>}
   */
  async segment(imageFile, model = "coreml") {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await fetch(`${this.BASE_URL}/segment/segment?model=${model}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Segmentation failed: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Caption an image via Ollama
   * POST /caption/caption
   * @param {File} imageFile
   * @param {string} model - Ollama model name
   * @param {string} prompt - Instruction sent to the model
   * @returns {Promise<{caption: string}>}
   */
  async captionImage(imageFile, model = "", prompt = "Describe this image.", sourceType = "image") {
    const formData = new FormData();
    formData.append("image", imageFile);
    const params = new URLSearchParams();
    if (model) params.set("model", model);
    if (prompt) params.set("prompt", prompt);
    params.set("source_type", sourceType);
    const res = await fetch(`${this.BASE_URL}/caption/caption?${params}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Caption failed: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Pose Estimation
   * POST /pose/pose_estimate
   * @param {File} imageFile
   * @param {string} model - "coreml" or "pytorch"
   * @returns {Promise<{persons: Array}>}
   */
  async estimatePose(imageFile, model = "coreml") {
    const formData = new FormData();
    formData.append("image", imageFile);
    const res = await fetch(`${this.BASE_URL}/pose/pose_estimate?model=${model}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Pose estimation failed: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Ollama Vision Models
   * GET /ollama/vision-models, with direct Ollama API fallback
   * @returns {Promise<Array<{name: string, label?: string, size?: number, modified_at?: string}>>}
   */
  async getOllamaVisionModels() {
    try {
      return await this.fetchOllamaVisionModelsFromBackend();
    } catch (backendError) {
      try {
        return await this.fetchOllamaVisionModelsFromOllama();
      } catch (ollamaError) {
        throw new Error(`${backendError.message}. Direct Ollama fallback also failed: ${ollamaError.message}`);
      }
    }
  },

  async fetchOllamaVisionModelsFromBackend() {
    const res = await fetch(`${this.BASE_URL}/caption/vision-models`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to load Ollama vision models: ${res.status}`);
    }
    const data = await res.json();
    return this.normalizeOllamaVisionModels(Array.isArray(data) ? data : data.models || []);
  },

  async fetchOllamaVisionModelsFromOllama() {
    const baseUrl = "http://localhost:11434";
    const tagsRes = await fetch(`${baseUrl}/api/tags`);
    if (!tagsRes.ok) throw new Error(`Ollama tags failed: ${tagsRes.status}`);

    const tagsData = await tagsRes.json();
    const localModels = tagsData.models || [];
    const visionModels = [];

    for (const item of localModels) {
      const modelName = item.name || item.model;
      if (!modelName) continue;

      const showRes = await fetch(`${baseUrl}/api/show`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelName }),
      });
      if (!showRes.ok) continue;

      const info = await showRes.json();
      if ((info.capabilities || []).includes("vision")) {
        visionModels.push({
          name: modelName,
          label: modelName,
          size: item.size,
          modified_at: item.modified_at,
        });
      }
    }

    return this.normalizeOllamaVisionModels(visionModels);
  },

  normalizeOllamaVisionModels(models) {
    return models
      .map(item => {
        if (typeof item === "string") {
          return { name: item, label: item };
        }

        const name = item.name || item.model;
        return {
          ...item,
          name,
          label: item.label || name,
        };
      })
      .filter(item => item.name);
  },

  /**
   * Convert File to data URL for preview
   * @param {File} file
   * @returns {Promise<string>}
   */
  fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};
