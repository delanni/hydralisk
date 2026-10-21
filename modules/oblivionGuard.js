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
    // Completely disabled per user preference to save CPU cycles
    this.enabled = false;
    this.checkTimeout = null;
    this.consecutiveReverts = 0;
    this.consecutiveBlackouts = 0;
    this.totalReverts = 0;
    this.maxConsecutiveReverts = 0;
    this.offscreenCanvas = null;
    this.toastEl = null;
  }

  getCanvas() {
    return null;
  }

  inspectCanvas() {
    // OblivionGuard is completely disabled to save CPU cycles
    return null;
  }

  scheduleCheck() {
    // OblivionGuard is completely disabled to save CPU cycles
    return;
  }

  performCheck() {
    // OblivionGuard is completely disabled to save CPU cycles
    return;
  }

  evalCode() {
    return;
  }

  showToast() {
    return;
  }
}

if (typeof window !== "undefined" && window.HydraliskPlugins) {
  window.HydraliskPlugins.register({
    id: "oblivion-guard",
    name: "Oblivion Guard (Disabled)",
    init(app) {
      const guard = new OblivionGuard(app);
      app.oblivionGuard = guard;
      app.expose("oblivionGuard", guard);

      // Kept for API compatibility without burning CPU cycles
      app.on("oblivion:toggle", () => {
        console.log("[OblivionGuard] Oblivion Guard is completely disabled to save CPU cycles.");
      });
    },
  });
}
