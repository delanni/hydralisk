/**
 * Oblivion Guard Plugin for Hydralisk
 * Detects visual crash / blackout / whiteout canvas states resulting from bad code mutations
 * and automatically triggers jump-back to restore the last functional sketch state.
 */

export function analyzeCanvasPixels(pixels) {
  let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
  let minRGB = 255, maxRGB = 0;
  const pixelCount = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    totalR += r;
    totalG += g;
    totalB += b;
    totalA += a;

    const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    if (brightness < minRGB) minRGB = brightness;
    if (brightness > maxRGB) maxRGB = brightness;
  }

  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;
  const avgA = totalA / pixelCount;
  const avgBrightness = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

  const isBlackout = maxRGB <= 2 || avgBrightness < 1;
  const isWhiteout = minRGB >= 253 || avgBrightness > 254;
  const isBlankAlpha = avgA === 0;

  const isOblivion = isBlackout || isWhiteout || isBlankAlpha;

  return {
    isOblivion,
    type: isBlackout ? "blackout" : isWhiteout ? "whiteout" : isBlankAlpha ? "blank" : "normal",
    avgBrightness,
    minRGB,
    maxRGB,
    avgA,
  };
}

export class OblivionGuard {
  constructor(app) {
    this.app = app;
    this.enabled = true;
    this.checkTimeout = null;
    this.consecutiveReverts = 0;
    this.maxConsecutiveReverts = 3;
    this.offscreenCanvas = null;
    this.toastEl = null;
  }

  getCanvas() {
    return (
      (window.hydra && window.hydra.canvas) ||
      document.querySelector("canvas") ||
      null
    );
  }

  inspectCanvas() {
    const canvas = this.getCanvas();
    if (!canvas) return null;

    const sampleDim = 16;
    const pixels = new Uint8Array(sampleDim * sampleDim * 4);

    // Method 1: Try WebGL readPixels directly from regl context or canvas context
    let gl = null;
    if (window.hydra && window.hydra.regl && window.hydra.regl._gl) {
      gl = window.hydra.regl._gl;
    } else {
      try {
        gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
      } catch (e) {}
    }

    if (gl && typeof gl.readPixels === "function") {
      try {
        const dw = gl.drawingBufferWidth || canvas.width || 300;
        const dh = gl.drawingBufferHeight || canvas.height || 150;
        const startX = Math.floor((dw - sampleDim) / 2);
        const startY = Math.floor((dh - sampleDim) / 2);
        gl.readPixels(
          Math.max(0, startX),
          Math.max(0, startY),
          sampleDim,
          sampleDim,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels
        );
        return analyzeCanvasPixels(pixels);
      } catch (e) {
        // Fallback to 2D context below
      }
    }

    // Method 2: Fallback to 2D canvas drawImage
    try {
      if (!this.offscreenCanvas) {
        this.offscreenCanvas = document.createElement("canvas");
        this.offscreenCanvas.width = sampleDim;
        this.offscreenCanvas.height = sampleDim;
      }
      const ctx = this.offscreenCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, 0, sampleDim, sampleDim);
      const imgData = ctx.getImageData(0, 0, sampleDim, sampleDim);
      return analyzeCanvasPixels(imgData.data);
    } catch (e) {
      return null;
    }
  }

  scheduleCheck(delay = 250) {
    if (!this.enabled) return;
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout);
    }
    this.checkTimeout = setTimeout(() => {
      this.performCheck();
    }, delay);
  }

  performCheck() {
    if (!this.enabled) return;

    const result = this.inspectCanvas();
    if (!result) return;

    if (result.isOblivion) {
      if (this.consecutiveReverts >= this.maxConsecutiveReverts) {
        console.warn(
          `[OblivionGuard] Max consecutive reverts (${this.maxConsecutiveReverts}) reached. Stopping auto-jump back to prevent infinite loop.`
        );
        return;
      }

      this.consecutiveReverts++;
      console.warn(
        `[OblivionGuard] Oblivion state detected (${result.type}). Reverting sketch to previous state...`
      );

      // Revert code
      let reverted = false;
      if (this.app.memory && typeof this.app.memory.jumpBack === "function") {
        const code = this.app.memory.jumpBack(1);
        if (code) {
          reverted = true;
          this.evalCode(code);
        }
      }

      if (!reverted) {
        const cm =
          (this.app.state && this.app.state.editor && this.app.state.editor.editor) ||
          window.cm;
        if (cm && cm.mutator && typeof cm.mutator.doUndo === "function") {
          cm.mutator.doUndo();
          reverted = true;
        }
      }

      this.showToast(`⚡ Oblivion Guard: Reverted ${result.type} state`);

      // Schedule follow-up check to verify recovery
      this.scheduleCheck(300);
    } else {
      this.consecutiveReverts = 0;
    }
  }

  evalCode(code) {
    const cm =
      (this.app.state && this.app.state.editor && this.app.state.editor.editor) ||
      window.cm;
    if (cm && typeof cm.setValue === "function") {
      cm.setValue(code);
    }
    if (window.evalCode) {
      window.evalCode(code);
    } else if (cm && typeof cm.eval === "function") {
      cm.eval(code);
    }
  }

  showToast(message) {
    if (typeof document === "undefined") return;

    if (!this.toastEl) {
      this.toastEl = document.createElement("div");
      this.toastEl.id = "oblivion-guard-toast";
      Object.assign(this.toastEl.style, {
        position: "fixed",
        bottom: "24px",
        right: "24px",
        backgroundColor: "rgba(20, 20, 25, 0.88)",
        color: "#ff6b6b",
        border: "1px solid rgba(255, 107, 107, 0.4)",
        borderRadius: "8px",
        padding: "10px 16px",
        fontFamily: "monospace, sans-serif",
        fontSize: "13px",
        fontWeight: "bold",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
        zIndex: "9999",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        opacity: "0",
        transform: "translateY(10px)",
        pointerEvents: "none",
      });
      document.body.appendChild(this.toastEl);
    }

    this.toastEl.textContent = message;
    this.toastEl.style.opacity = "1";
    this.toastEl.style.transform = "translateY(0)";

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      if (this.toastEl) {
        this.toastEl.style.opacity = "0";
        this.toastEl.style.transform = "translateY(10px)";
      }
    }, 2500);
  }
}

if (typeof window !== "undefined" && window.HydraliskPlugins) {
  window.HydraliskPlugins.register({
    id: "oblivion-guard",
    name: "Oblivion Guard (Canvas Blackout & Whiteout Auto-Recovery)",
    init(app) {
      const guard = new OblivionGuard(app);
      app.oblivionGuard = guard;
      app.expose("oblivionGuard", guard);

      app.on("oblivion:scheduleCheck", (evt = {}) => {
        guard.scheduleCheck(evt.delay || 250);
      });

      app.on("oblivion:checkNow", () => {
        guard.performCheck();
      });

      app.on("oblivion:toggle", () => {
        guard.enabled = !guard.enabled;
        console.log(`[OblivionGuard] Enabled: ${guard.enabled}`);
        guard.showToast(`Oblivion Guard ${guard.enabled ? "Enabled" : "Disabled"}`);
      });

      // Automatically trigger checks on mutate events
      app.on("editor:randomize", () => {
        guard.scheduleCheck(250);
      });
    },
  });
}
