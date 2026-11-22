export const RELIEF_SEGMENTS = 160;
export const RELIEF_GRID = RELIEF_SEGMENTS + 1;

export interface PhotoDimension {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PhotoScaleCalibration {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  knownLength: number;
  unit: 'in' | 'ft';
  featureLabel?: string;
}

export interface UploadedPhoto3D {
  fileName: string;
  dataUrl: string;
  reliefDepth: number;
  dimensions?: PhotoDimension[];
  calibration?: PhotoScaleCalibration | null;
}

export interface PhotoReliefEntry {
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  aspect: number;
  lum: Float32Array;
  texCanvas: HTMLCanvasElement;
  texWidth: number;
  texHeight: number;
  texPixels: Uint8ClampedArray;
}

const reliefCache = new Map<string, PhotoReliefEntry>();
const loadingUrls = new Set<string>();
const readyCallbacks = new Map<string, Set<() => void>>();

const shaded2DCache = new Map<string, HTMLCanvasElement>();
const isoBlockCache = new Map<string, HTMLCanvasElement>();

function evictCachesFor(dataUrl: string) {
  reliefCache.delete(dataUrl);
  for (const key of Array.from(shaded2DCache.keys())) {
    if (key.startsWith(`${dataUrl}::`)) {
      shaded2DCache.delete(key);
    }
  }
  for (const key of Array.from(isoBlockCache.keys())) {
    if (key.startsWith(`${dataUrl}::`)) {
      isoBlockCache.delete(key);
    }
  }
}

export function buildPhotoReliefFromImage(
  dataUrl: string,
  img: HTMLImageElement,
): PhotoReliefEntry | null {
  const existing = reliefCache.get(dataUrl);
  if (existing) return existing;

  const natW = Math.max(1, img.naturalWidth || img.width || 1);
  const natH = Math.max(1, img.naturalHeight || img.height || 1);
  const aspect = natW / natH;

  // 1. Crisp front texture canvas (clamped to max 1024px)
  const maxTexSide = 1024;
  const scale = Math.min(1, maxTexSide / Math.max(natW, natH));
  const texWidth = Math.max(2, Math.round(natW * scale));
  const texHeight = Math.max(2, Math.round(natH * scale));
  const texCanvas = document.createElement('canvas');
  texCanvas.width = texWidth;
  texCanvas.height = texHeight;
  const texCtx = texCanvas.getContext('2d');
  if (!texCtx) return null;
  texCtx.drawImage(img, 0, 0, texWidth, texHeight);

  let texPixels: Uint8ClampedArray;
  try {
    texPixels = texCtx.getImageData(0, 0, texWidth, texHeight).data;
  } catch {
    return null;
  }

  // 2. Sample luminance onto 161x161 vertex grid (matches 160x160 3D relief)
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = RELIEF_GRID;
  sampleCanvas.height = RELIEF_GRID;
  const sampleCtx = sampleCanvas.getContext('2d');
  if (!sampleCtx) return null;
  sampleCtx.drawImage(img, 0, 0, RELIEF_GRID, RELIEF_GRID);

  let pixels: Uint8ClampedArray;
  try {
    pixels = sampleCtx.getImageData(0, 0, RELIEF_GRID, RELIEF_GRID).data;
  } catch {
    return null;
  }

  const rawLum = new Float32Array(RELIEF_GRID * RELIEF_GRID);
  for (let i = 0; i < RELIEF_GRID * RELIEF_GRID; i++) {
    const idx = i * 4;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    const a = pixels[idx + 3] / 255;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    rawLum[i] = lum * a;
  }

  // 3. Two passes of 3x3 weighted smoothing for sculpted relief continuity
  let curr = rawLum;
  for (let pass = 0; pass < 2; pass++) {
    const next = new Float32Array(RELIEF_GRID * RELIEF_GRID);
    for (let y = 0; y < RELIEF_GRID; y++) {
      const y0 = Math.max(0, y - 1);
      const y2 = Math.min(RELIEF_GRID - 1, y + 1);
      for (let x = 0; x < RELIEF_GRID; x++) {
        const x0 = Math.max(0, x - 1);
        const x2 = Math.min(RELIEF_GRID - 1, x + 1);
        const sum =
          curr[y0 * RELIEF_GRID + x0] +
          curr[y0 * RELIEF_GRID + x] * 2 +
          curr[y0 * RELIEF_GRID + x2] +
          curr[y * RELIEF_GRID + x0] * 2 +
          curr[y * RELIEF_GRID + x] * 4 +
          curr[y * RELIEF_GRID + x2] * 2 +
          curr[y2 * RELIEF_GRID + x0] +
          curr[y2 * RELIEF_GRID + x] * 2 +
          curr[y2 * RELIEF_GRID + x2];
        next[y * RELIEF_GRID + x] = sum / 16;
      }
    }
    curr = next;
  }

  // Keep cache bounded to 4 photos
  if (reliefCache.size >= 4) {
    const oldest = reliefCache.keys().next().value;
    if (oldest !== undefined) {
      evictCachesFor(oldest);
    }
  }

  const entry: PhotoReliefEntry = {
    dataUrl,
    naturalWidth: natW,
    naturalHeight: natH,
    aspect,
    lum: curr,
    texCanvas,
    texWidth,
    texHeight,
    texPixels,
  };
  reliefCache.set(dataUrl, entry);
  return entry;
}

export function getCachedPhotoRelief(
  dataUrl: string,
  onReady?: () => void,
): PhotoReliefEntry | null {
  const existing = reliefCache.get(dataUrl);
  if (existing) return existing;

  if (onReady) {
    let set = readyCallbacks.get(dataUrl);
    if (!set) {
      set = new Set();
      readyCallbacks.set(dataUrl, set);
    }
    set.add(onReady);
  }

  if (!loadingUrls.has(dataUrl)) {
    loadingUrls.add(dataUrl);
    const img = new Image();
    img.onload = () => {
      loadingUrls.delete(dataUrl);
      buildPhotoReliefFromImage(dataUrl, img);
      const cbs = readyCallbacks.get(dataUrl);
      readyCallbacks.delete(dataUrl);
      cbs?.forEach((cb) => cb());
    };
    img.onerror = () => {
      loadingUrls.delete(dataUrl);
      readyCallbacks.delete(dataUrl);
    };
    img.src = dataUrl;
  }

  return null;
}

function sampleLumBilinear(lum: Float32Array, u: number, v: number): number {
  const gx = Math.max(0, Math.min(RELIEF_SEGMENTS, u * RELIEF_SEGMENTS));
  const gy = Math.max(0, Math.min(RELIEF_SEGMENTS, v * RELIEF_SEGMENTS));
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(RELIEF_SEGMENTS, x0 + 1);
  const y1 = Math.min(RELIEF_SEGMENTS, y0 + 1);
  const tx = gx - x0;
  const ty = gy - y0;
  const a = lum[y0 * RELIEF_GRID + x0];
  const b = lum[y0 * RELIEF_GRID + x1];
  const c = lum[y1 * RELIEF_GRID + x0];
  const d = lum[y1 * RELIEF_GRID + x1];
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}

/**
 * Renders the full uploaded photo shaded from the shared 161x161 luminance relief
 * so raised regions catch studio key lighting and read clearly in 2D elevation.
 */
export function getShadedPhoto2DCanvas(
  entry: PhotoReliefEntry,
  reliefDepth: number,
): HTMLCanvasElement {
  const depthStep = Math.round(Math.max(0, Math.min(2.5, reliefDepth)) * 20);
  const cacheKey = `${entry.dataUrl}::${depthStep}`;
  const cached = shaded2DCache.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = entry.texWidth;
  canvas.height = entry.texHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return entry.texCanvas;

  if (depthStep === 0) {
    ctx.drawImage(entry.texCanvas, 0, 0);
    shaded2DCache.set(cacheKey, canvas);
    return canvas;
  }

  const w = entry.texWidth;
  const h = entry.texHeight;
  const imgData = ctx.createImageData(w, h);
  const dst = imgData.data;
  const src = entry.texPixels;
  const lum = entry.lum;
  const depthNorm = depthStep / 20;
  const strength = Math.min(1, depthNorm / 0.85);
  const slopeGain = depthNorm * 9.5;
  const du = 1 / RELIEF_SEGMENTS;

  // Normalized upper-left studio key light
  const lx = -0.52;
  const ly = -0.62;
  const lz = 0.59;

  for (let y = 0; y < h; y++) {
    const v = y / Math.max(1, h - 1);
    for (let x = 0; x < w; x++) {
      const u = x / Math.max(1, w - 1);
      const idx = (y * w + x) * 4;

      const lumC = sampleLumBilinear(lum, u, v);
      const lumL = sampleLumBilinear(lum, Math.max(0, u - du), v);
      const lumR = sampleLumBilinear(lum, Math.min(1, u + du), v);
      const lumU = sampleLumBilinear(lum, u, Math.max(0, v - du));
      const lumD = sampleLumBilinear(lum, u, Math.min(1, v + du));

      const dzdx = (lumR - lumL) * slopeGain;
      const dzdy = (lumD - lumU) * slopeGain;
      const invLen = 1 / Math.hypot(dzdx, dzdy, 1);
      const nx = -dzdx * invLen;
      const ny = -dzdy * invLen;
      const nz = invLen;

      const ndotl = Math.max(0, nx * lx + ny * ly + nz * lz);
      const shadeFactor = 0.54 + 0.62 * ndotl + 0.14 * lumC;
      const mult = 1 - strength + strength * shadeFactor;
      const spec = strength * Math.pow(ndotl, 7) * 20 * lumC;

      dst[idx] = Math.min(255, Math.max(0, Math.round(src[idx] * mult + spec)));
      dst[idx + 1] = Math.min(
        255,
        Math.max(0, Math.round(src[idx + 1] * mult + spec)),
      );
      dst[idx + 2] = Math.min(
        255,
        Math.max(0, Math.round(src[idx + 2] * mult + spec)),
      );
      dst[idx + 3] = src[idx + 3];
    }
  }

  ctx.putImageData(imgData, 0, 0);
  if (shaded2DCache.size > 12) {
    const first = shaded2DCache.keys().next().value;
    if (first !== undefined) shaded2DCache.delete(first);
  }
  shaded2DCache.set(cacheKey, canvas);
  return canvas;
}

export interface IsometricBlockMetrics {
  canvas: HTMLCanvasElement;
  wIso: number;
  hIso: number;
  backT: number;
  reliefPx: number;
  cosA: number;
  sinA: number;
  originX: number;
  originY: number;
}

/**
 * Software z-buffered isometric heightfield renderer using the exact 161x161 luminance grid
 * and crisp photo texels, complete with solid extruded backing/side edges.
 */
export function getIsometricPhotoBlock(
  entry: PhotoReliefEntry,
  outW: number,
  outH: number,
  reliefDepth: number,
): IsometricBlockMetrics {
  const depthStep = Math.round(Math.max(0, Math.min(2.5, reliefDepth)) * 20);
  const cacheKey = `${entry.dataUrl}::${outW}x${outH}::${depthStep}`;
  const cosA = Math.cos(Math.PI / 6);
  const sinA = Math.sin(Math.PI / 6) * 0.65;

  // Compute bounding fit inside outW x outH
  const safeAspect = Math.max(0.25, Math.min(4, entry.aspect));
  const maxBaseW = outW * 0.56;
  const maxBaseH = outH * 0.54;
  let wIso = maxBaseW;
  let hIso = wIso / safeAspect;
  if (hIso > maxBaseH) {
    hIso = maxBaseH;
    wIso = hIso * safeAspect;
  }

  const backT = 22;
  const reliefPx = Math.max(0, (depthStep / 20) * 44);
  const totalZ = backT + reliefPx;

  const spanX = (wIso + totalZ) * cosA;
  const spanY = (wIso + totalZ) * sinA + hIso;
  const originX = (outW - spanX) / 2;
  const originY = (outH - spanY) / 2 + wIso * sinA;

  const existing = isoBlockCache.get(cacheKey);
  if (existing) {
    return {
      canvas: existing,
      wIso,
      hIso,
      backT,
      reliefPx,
      cosA,
      sinA,
      originX,
      originY,
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      canvas,
      wIso,
      hIso,
      backT,
      reliefPx,
      cosA,
      sinA,
      originX,
      originY,
    };
  }

  const imgData = ctx.createImageData(outW, outH);
  const buf = imgData.data;
  const zBuf = new Float32Array(outW * outH);
  zBuf.fill(-1e9);

  // Orthogonal isometric depth: C = (-1, -2*sinA, +1) -> world depth = -U - 2*sinA*V + Z
  const vDepthWeight = 2 * sinA;
  const project = (u: number, v: number, z: number): [number, number, number] => {
    const U = u * wIso;
    const V = v * hIso;
    const sx = originX + (U + z) * cosA;
    const sy = originY - U * sinA + V + z * sinA;
    const depth = -U - vDepthWeight * V + z;
    return [sx, sy, depth];
  };

  const rasterTriFlat = (
    p0: [number, number, number],
    p1: [number, number, number],
    p2: [number, number, number],
    r: number,
    g: number,
    b: number,
  ) => {
    const minX = Math.max(0, Math.floor(Math.min(p0[0], p1[0], p2[0])));
    const maxX = Math.min(outW - 1, Math.ceil(Math.max(p0[0], p1[0], p2[0])));
    const minY = Math.max(0, Math.floor(Math.min(p0[1], p1[1], p2[1])));
    const maxY = Math.min(outH - 1, Math.ceil(Math.max(p0[1], p1[1], p2[1])));
    if (minX > maxX || minY > maxY) return;

    const area =
      (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]);
    if (Math.abs(area) < 1e-4) return;
    const invArea = 1 / area;

    for (let y = minY; y <= maxY; y++) {
      const py = y + 0.5;
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5;
        const w0 =
          ((p1[0] - px) * (p2[1] - py) - (p1[1] - py) * (p2[0] - px)) * invArea;
        const w1 =
          ((p2[0] - px) * (p0[1] - py) - (p2[1] - py) * (p0[0] - px)) * invArea;
        const w2 = 1 - w0 - w1;
        if (w0 < -0.002 || w1 < -0.002 || w2 < -0.002) continue;

        const d = w0 * p0[2] + w1 * p1[2] + w2 * p2[2];
        const pIdx = y * outW + x;
        if (d > zBuf[pIdx]) {
          zBuf[pIdx] = d;
          const bIdx = pIdx * 4;
          buf[bIdx] = r;
          buf[bIdx + 1] = g;
          buf[bIdx + 2] = b;
          buf[bIdx + 3] = 255;
        }
      }
    }
  };

  const rasterQuadFlat = (
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    d: [number, number, number],
    rgb: [number, number, number],
  ) => {
    rasterTriFlat(a, b, c, rgb[0], rgb[1], rgb[2]);
    rasterTriFlat(a, c, d, rgb[0], rgb[1], rgb[2]);
  };

  // 1. Solid backing block faces (steel dark metallic shades)
  const b00 = project(0, 0, 0);
  const b10 = project(1, 0, 0);
  const b11 = project(1, 1, 0);
  const b01 = project(0, 1, 0);
  const f00 = project(0, 0, backT);
  const f10 = project(1, 0, backT);
  const f11 = project(1, 1, backT);
  const f01 = project(0, 1, backT);

  // Top face (visible)
  rasterQuadFlat(b00, b10, f10, f00, [86, 94, 110]);
  // Left face (visible)
  rasterQuadFlat(b00, f00, f01, b01, [62, 68, 80]);
  // Right face & Bottom face (for completeness if relief shadows/angles expose)
  rasterQuadFlat(b10, b11, f11, f10, [34, 38, 46]);
  rasterQuadFlat(b01, f01, f11, b11, [28, 32, 38]);

  // 2. Front displaced relief surface + extruded perimeter walls
  const texW = entry.texWidth;
  const texH = entry.texHeight;
  const texPx = entry.texPixels;
  const lum = entry.lum;

  const GRID = RELIEF_GRID;
  const SEG = RELIEF_SEGMENTS;
  const sxGrid = new Float32Array(GRID * GRID);
  const syGrid = new Float32Array(GRID * GRID);
  const dpGrid = new Float32Array(GRID * GRID);
  const shadeGrid = new Float32Array(GRID * GRID);

  const lx = -0.52;
  const ly = -0.62;
  const lz = 0.59;
  const slopeGain = (depthStep / 20) * 8.5;

  for (let iy = 0; iy < GRID; iy++) {
    const v = iy / SEG;
    const yUp = Math.max(0, iy - 1);
    const yDn = Math.min(SEG, iy + 1);
    for (let ix = 0; ix < GRID; ix++) {
      const u = ix / SEG;
      const gIdx = iy * GRID + ix;

      // Taper outer 1-vertex border cleanly onto backing plate
      const edgeFade =
        ix === 0 || ix === SEG || iy === 0 || iy === SEG
          ? 0
          : ix === 1 || ix === SEG - 1 || iy === 1 || iy === SEG - 1
            ? 0.55
            : 1;
      const z = backT + lum[gIdx] * reliefPx * edgeFade;
      const [sx, sy, dp] = project(u, v, z);
      sxGrid[gIdx] = sx;
      syGrid[gIdx] = sy;
      dpGrid[gIdx] = dp;

      const xLt = Math.max(0, ix - 1);
      const xRt = Math.min(SEG, ix + 1);
      const dzdx = (lum[iy * GRID + xRt] - lum[iy * GRID + xLt]) * slopeGain;
      const dzdy = (lum[yDn * GRID + ix] - lum[yUp * GRID + ix]) * slopeGain;
      const invN = 1 / Math.hypot(dzdx, dzdy, 1);
      const ndotl = Math.max(0, (-dzdx * lx - dzdy * ly + lz) * invN);
      const strength = Math.min(1, (depthStep / 20) / 0.85);
      const shade = 0.56 + 0.6 * ndotl + 0.12 * lum[gIdx];
      shadeGrid[gIdx] = 1 - strength + strength * shade;
    }
  }

  const rasterTriTextured = (i0: number, i1: number, i2: number, u0: number, v0: number, u1: number, v1: number, u2: number, v2: number) => {
    const x0 = sxGrid[i0];
    const y0 = syGrid[i0];
    const z0 = dpGrid[i0];
    const x1 = sxGrid[i1];
    const y1 = syGrid[i1];
    const z1 = dpGrid[i1];
    const x2 = sxGrid[i2];
    const y2 = syGrid[i2];
    const z2 = dpGrid[i2];

    const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    const maxX = Math.min(outW - 1, Math.ceil(Math.max(x0, x1, x2)));
    const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const maxY = Math.min(outH - 1, Math.ceil(Math.max(y0, y1, y2)));
    if (minX > maxX || minY > maxY) return;

    const area = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
    if (Math.abs(area) < 1e-4) return;
    const invArea = 1 / area;

    const s0 = shadeGrid[i0];
    const s1 = shadeGrid[i1];
    const s2 = shadeGrid[i2];

    for (let y = minY; y <= maxY; y++) {
      const py = y + 0.5;
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5;
        const w0 = ((x1 - px) * (y2 - py) - (y1 - py) * (x2 - px)) * invArea;
        const w1 = ((x2 - px) * (y0 - py) - (y2 - py) * (x0 - px)) * invArea;
        const w2 = 1 - w0 - w1;
        if (w0 < -0.01 || w1 < -0.01 || w2 < -0.01) continue;

        const d = w0 * z0 + w1 * z1 + w2 * z2;
        const pIdx = y * outW + x;
        if (d > zBuf[pIdx]) {
          zBuf[pIdx] = d;
          const uu = Math.max(0, Math.min(1, w0 * u0 + w1 * u1 + w2 * u2));
          const vv = Math.max(0, Math.min(1, w0 * v0 + w1 * v1 + w2 * v2));
          const tx = Math.min(texW - 1, Math.round(uu * (texW - 1)));
          const ty = Math.min(texH - 1, Math.round(vv * (texH - 1)));
          const tIdx = (ty * texW + tx) * 4;
          const sh = w0 * s0 + w1 * s1 + w2 * s2;

          const bIdx = pIdx * 4;
          buf[bIdx] = Math.min(255, Math.max(0, Math.round(texPx[tIdx] * sh)));
          buf[bIdx + 1] = Math.min(
            255,
            Math.max(0, Math.round(texPx[tIdx + 1] * sh)),
          );
          buf[bIdx + 2] = Math.min(
            255,
            Math.max(0, Math.round(texPx[tIdx + 2] * sh)),
          );
          buf[bIdx + 3] = 255;
        }
      }
    }
  };

  for (let iy = 0; iy < SEG; iy++) {
    const v0 = iy / SEG;
    const v1 = (iy + 1) / SEG;
    for (let ix = 0; ix < SEG; ix++) {
      const u0 = ix / SEG;
      const u1 = (ix + 1) / SEG;
      const i00 = iy * GRID + ix;
      const i10 = i00 + 1;
      const i01 = i00 + GRID;
      const i11 = i01 + 1;
      rasterTriTextured(i00, i10, i11, u0, v0, u1, v0, u1, v1);
      rasterTriTextured(i00, i11, i01, u0, v0, u1, v1, u0, v1);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  if (isoBlockCache.size > 8) {
    const first = isoBlockCache.keys().next().value;
    if (first !== undefined) isoBlockCache.delete(first);
  }
  isoBlockCache.set(cacheKey, canvas);

  return {
    canvas,
    wIso,
    hIso,
    backT,
    reliefPx,
    cosA,
    sinA,
    originX,
    originY,
  };
}

export function getPhotoDistInPhotoWidths(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  aspect: number,
): number {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 4 / 3;
  const dx = x2 - x1;
  const dy = (y2 - y1) / safeAspect;
  return Math.hypot(dx, dy);
}

export function formatPhotoDimensionLabel(
  dim: Pick<PhotoDimension, 'x1' | 'y1' | 'x2' | 'y2'>,
  aspect: number,
  calibration?: PhotoScaleCalibration | null,
): string {
  const distPw = getPhotoDistInPhotoWidths(dim.x1, dim.y1, dim.x2, dim.y2, aspect);
  if (!calibration || calibration.knownLength <= 0) {
    const pct = (distPw * 100).toFixed(1).replace(/\.0$/, '');
    return `${pct}% of photo width`;
  }
  const calDistPw = getPhotoDistInPhotoWidths(
    calibration.x1,
    calibration.y1,
    calibration.x2,
    calibration.y2,
    aspect,
  );
  if (calDistPw <= 1e-6) {
    const pct = (distPw * 100).toFixed(1).replace(/\.0$/, '');
    return `${pct}% of photo width`;
  }
  const calInches =
    calibration.unit === 'ft'
      ? calibration.knownLength * 12
      : calibration.knownLength;
  const inches = (distPw / calDistPw) * calInches;
  return formatCalibratedInches(inches, calibration.unit);
}

export function formatCalibratedInches(
  inches: number,
  preferredUnit: 'in' | 'ft' = 'in',
): string {
  const decStr = `${inches.toFixed(1).replace(/\.0$/, '')} in`;
  if (preferredUnit === 'ft' || inches >= 12) {
    let ft = Math.floor(inches / 12);
    let remIn = Math.round(inches - ft * 12);
    if (remIn === 12) {
      ft += 1;
      remIn = 0;
    }
    if (ft > 0) {
      return `${ft} ft ${remIn} in (${decStr})`;
    }
  }
  return decStr;
}

export function getCalibrationSummaryText(
  calibration: PhotoScaleCalibration,
  aspect: number,
): string {
  const calDistPw = getPhotoDistInPhotoWidths(
    calibration.x1,
    calibration.y1,
    calibration.x2,
    calibration.y2,
    aspect,
  );
  const calInches =
    calibration.unit === 'ft'
      ? calibration.knownLength * 12
      : calibration.knownLength;
  const photoWidthIn = calDistPw > 1e-6 ? calInches / calDistPw : 0;
  const feat = calibration.featureLabel?.trim() || 'reference span';
  const knownText = `${calibration.knownLength} ${calibration.unit}`;
  const scaleSuffix =
    photoWidthIn > 0
      ? ` · Full photo width ≈ ${formatCalibratedInches(photoWidthIn, calibration.unit)}`
      : '';
  return `Calibrated: ${feat} = ${knownText}${scaleSuffix}`;
}
