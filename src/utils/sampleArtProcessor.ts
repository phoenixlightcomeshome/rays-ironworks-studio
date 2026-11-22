import { SampleArtData, SignPictureData } from '../types/configurator';

const MODEL3D_EXT_RE = /\.(stl|obj|gltf|glb|3mf|ply|fbx)$/i;
const REFERENCE_NEEDS_CONV_EXT_RE =
  /\.(dwg|step|stp|iges|igs|eps|ai|pdf|txt|doc|docx|tiff?|heic)$/i;
const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|bmp|avif)$/i;

/**
 * Loads a browser-decodable image (JPG/PNG/GIF/WebP/BMP/AVIF) and derives:
 * 1) a normalized luminance heightmap (for 3D relief rendering)
 * 2) edge-contour line segments (for flat CNC plasma cut-pattern outlines)
 */
async function processPhotoFile(file: File): Promise<SampleArtData> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Browser cannot decode this image'));
    el.src = dataUrl;
  });

  const gridSize = 48;
  const c = document.createElement('canvas');
  c.width = gridSize;
  c.height = gridSize;
  const ctx = c.getContext('2d');
  const heightmap: number[] = [];
  const cutSegments: Array<[number, number, number, number]> = [];

  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, gridSize, gridSize);
    ctx.drawImage(img, 0, 0, gridSize, gridSize);
    const pixels = ctx.getImageData(0, 0, gridSize, gridSize).data;

    const lum = new Float32Array(gridSize * gridSize);
    for (let i = 0; i < gridSize * gridSize; i++) {
      const r = pixels[i * 4];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      const v = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      lum[i] = v;
      heightmap.push(+v.toFixed(3));
    }

    const thresh = 0.45;
    for (let y = 0; y < gridSize - 1; y++) {
      for (let x = 0; x < gridSize - 1; x++) {
        const v00 = lum[y * gridSize + x] >= thresh ? 1 : 0;
        const v10 = lum[y * gridSize + (x + 1)] >= thresh ? 1 : 0;
        const v01 = lum[(y + 1) * gridSize + x] >= thresh ? 1 : 0;
        if (v00 !== v10) {
          const xn = (x + 1) / gridSize;
          cutSegments.push([
            +xn.toFixed(3),
            +(1 - y / gridSize).toFixed(3),
            +xn.toFixed(3),
            +(1 - (y + 1) / gridSize).toFixed(3),
          ]);
        }
        if (v00 !== v01) {
          const yn = 1 - (y + 1) / gridSize;
          cutSegments.push([
            +(x / gridSize).toFixed(3),
            +yn.toFixed(3),
            +((x + 1) / gridSize).toFixed(3),
            +yn.toFixed(3),
          ]);
        }
      }
    }
  }

  return {
    fileName: file.name,
    fileExt: file.name.split('.').pop()?.toLowerCase() || 'img',
    mimeType: file.type,
    kind: 'photo',
    previewUrl: dataUrl,
    downloadUrl: dataUrl,
    widthPx: img.naturalWidth,
    heightPx: img.naturalHeight,
    heightmapSize: gridSize,
    heightmap,
    showRelief3D: true,
    useOutlineCut: true,
    cutSegments: cutSegments.slice(0, 1200),
  };
}

/**
 * Extracts normalized vector line segments from an ASCII DXF string (LINE, CIRCLE, ARC, LWPOLYLINE).
 */
function parseDxfOutlines(text: string): Array<[number, number, number, number]> {
  const tokens = text.split(/\r?\n/).map((l) => l.trim());
  const rawSegs: Array<[number, number, number, number]> = [];
  let inEntities = false;
  let entityType = '';
  let x1: number | null = null;
  let y1: number | null = null;
  let x2: number | null = null;
  let y2: number | null = null;
  let r: number | null = null;
  let aStart: number | null = null;
  let aEnd: number | null = null;
  let polyPts: Array<[number, number]> = [];
  let pendingPolyX: number | null = null;
  let closedPoly = false;

  const flush = () => {
    if (entityType === 'LINE' && x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
      rawSegs.push([x1, y1, x2, y2]);
    } else if (entityType === 'CIRCLE' && x1 !== null && y1 !== null && r !== null && r > 0) {
      const steps = 16;
      for (let s = 0; s < steps; s++) {
        const a0 = (s / steps) * Math.PI * 2;
        const a1 = ((s + 1) / steps) * Math.PI * 2;
        rawSegs.push([
          x1 + Math.cos(a0) * r,
          y1 + Math.sin(a0) * r,
          x1 + Math.cos(a1) * r,
          y1 + Math.sin(a1) * r,
        ]);
      }
    } else if (
      entityType === 'ARC' &&
      x1 !== null &&
      y1 !== null &&
      r !== null &&
      r > 0 &&
      aStart !== null &&
      aEnd !== null
    ) {
      let end = aEnd;
      if (end < aStart) end += 360;
      const steps = 12;
      for (let s = 0; s < steps; s++) {
        const rad0 = ((aStart + ((end - aStart) * s) / steps) * Math.PI) / 180;
        const rad1 = ((aStart + ((end - aStart) * (s + 1)) / steps) * Math.PI) / 180;
        rawSegs.push([
          x1 + Math.cos(rad0) * r,
          y1 + Math.sin(rad0) * r,
          x1 + Math.cos(rad1) * r,
          y1 + Math.sin(rad1) * r,
        ]);
      }
    } else if (entityType === 'LWPOLYLINE' && polyPts.length >= 2) {
      for (let p = 0; p < polyPts.length - 1; p++) {
        rawSegs.push([polyPts[p][0], polyPts[p][1], polyPts[p + 1][0], polyPts[p + 1][1]]);
      }
      if (closedPoly) {
        const last = polyPts[polyPts.length - 1];
        const first = polyPts[0];
        rawSegs.push([last[0], last[1], first[0], first[1]]);
      }
    }
    x1 = null;
    y1 = null;
    x2 = null;
    y2 = null;
    r = null;
    aStart = null;
    aEnd = null;
    polyPts = [];
    pendingPolyX = null;
    closedPoly = false;
  };

  for (let i = 0; i < tokens.length - 1; i += 2) {
    const code = tokens[i];
    const val = tokens[i + 1];
    if (code === '2' && val === 'ENTITIES') {
      inEntities = true;
      continue;
    }
    if (inEntities && code === '0' && val === 'ENDSEC') {
      flush();
      break;
    }
    if (!inEntities) continue;
    if (code === '0') {
      flush();
      entityType = val;
      continue;
    }
    const num = parseFloat(val);
    if (!Number.isFinite(num)) continue;
    if (entityType === 'LWPOLYLINE') {
      if (code === '10') pendingPolyX = num;
      else if (code === '20' && pendingPolyX !== null) {
        polyPts.push([pendingPolyX, num]);
        pendingPolyX = null;
      } else if (code === '70' && (Math.round(num) & 1) === 1) {
        closedPoly = true;
      }
    } else {
      if (code === '10') x1 = num;
      else if (code === '20') y1 = num;
      else if (code === '11') x2 = num;
      else if (code === '21') y2 = num;
      else if (code === '40') r = num;
      else if (code === '50') aStart = num;
      else if (code === '51') aEnd = num;
    }
  }

  if (rawSegs.length === 0) return [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  rawSegs.forEach(([ax, ay, bx, by]) => {
    minX = Math.min(minX, ax, bx);
    minY = Math.min(minY, ay, by);
    maxX = Math.max(maxX, ax, bx);
    maxY = Math.max(maxY, ay, by);
  });
  const span = Math.max(1e-5, maxX - minX, maxY - minY);
  return rawSegs.slice(0, 1200).map(([ax, ay, bx, by]) => [
    +((ax - minX) / span).toFixed(3),
    +((ay - minY) / span).toFixed(3),
    +((bx - minX) / span).toFixed(3),
    +((by - minY) / span).toFixed(3),
  ]);
}

async function processSvgFile(file: File): Promise<SampleArtData> {
  const svgText = await file.text();
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const cutSegments: Array<[number, number, number, number]> = [];
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('SVG preview could not rasterize'));
      el.src = url;
    });

    const gridSize = 48;
    const c = document.createElement('canvas');
    c.width = gridSize;
    c.height = gridSize;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, gridSize, gridSize);
      ctx.drawImage(img, 0, 0, gridSize, gridSize);
      const pixels = ctx.getImageData(0, 0, gridSize, gridSize).data;
      const mask = new Uint8Array(gridSize * gridSize);
      for (let i = 0; i < gridSize * gridSize; i++) {
        const bright = (pixels[i * 4] + pixels[i * 4 + 1] + pixels[i * 4 + 2]) / 3;
        mask[i] = bright < 220 ? 1 : 0;
      }
      for (let y = 0; y < gridSize - 1; y++) {
        for (let x = 0; x < gridSize - 1; x++) {
          const v00 = mask[y * gridSize + x];
          const v10 = mask[y * gridSize + (x + 1)];
          const v01 = mask[(y + 1) * gridSize + x];
          if (v00 !== v10) {
            const xn = (x + 1) / gridSize;
            cutSegments.push([
              +xn.toFixed(3),
              +(1 - y / gridSize).toFixed(3),
              +xn.toFixed(3),
              +(1 - (y + 1) / gridSize).toFixed(3),
            ]);
          }
          if (v00 !== v01) {
            const yn = 1 - (y + 1) / gridSize;
            cutSegments.push([
              +(x / gridSize).toFixed(3),
              +yn.toFixed(3),
              +((x + 1) / gridSize).toFixed(3),
              +yn.toFixed(3),
            ]);
          }
        }
      }
    }
  } catch {
    // Keep reference even if SVG fails to rasterize
  }

  return {
    fileName: file.name,
    fileExt: 'svg',
    mimeType: file.type || 'image/svg+xml',
    kind: 'svg',
    previewUrl: url,
    downloadUrl: url,
    showRelief3D: false,
    useOutlineCut: cutSegments.length > 0,
    cutSegments: cutSegments.slice(0, 1200),
  };
}

/**
 * Universal studio file processor: accepts ALL file types without rejection.
 * - Browser-decodable images -> reference preview + 3D relief heightmap + flat plasma cut contour
 * - SVG -> vector preview + flat cut contour
 * - ASCII DXF -> parsed vector cut contour
 * - STL / OBJ / GLTF / GLB / 3MF / PLY / FBX -> loaded directly into the 3D scene
 * - DWG / STEP / IGES / EPS / AI / PDF / TIFF / HEIC / DOC / DOCX / TXT / others -> stored honestly as downloadable reference
 */
export async function processUploadedStudioFile(file: File): Promise<SampleArtData> {
  const lower = file.name.toLowerCase();
  const ext = lower.split('.').pop() || 'file';

  if (lower.endsWith('.dxf') || file.type === 'application/dxf') {
    const text = await file.text();
    const cutSegments = parseDxfOutlines(text);
    const url = URL.createObjectURL(file);
    return {
      fileName: file.name,
      fileExt: 'dxf',
      mimeType: file.type || 'application/dxf',
      kind: 'dxf',
      downloadUrl: url,
      needsConversion: cutSegments.length === 0,
      showRelief3D: false,
      useOutlineCut: cutSegments.length > 0,
      cutSegments,
    };
  }

  if (lower.endsWith('.svg') || file.type === 'image/svg+xml') {
    return processSvgFile(file);
  }

  if (MODEL3D_EXT_RE.test(lower)) {
    const url = URL.createObjectURL(file);
    return {
      fileName: file.name,
      fileExt: ext,
      mimeType: file.type || 'model/3d',
      kind: 'model3d',
      previewUrl: url,
      downloadUrl: url,
      needsConversion: false,
      showRelief3D: false,
      useOutlineCut: false,
    };
  }

  if (
    !REFERENCE_NEEDS_CONV_EXT_RE.test(lower) &&
    ((file.type && file.type.startsWith('image/')) || IMAGE_EXT_RE.test(lower))
  ) {
    try {
      return await processPhotoFile(file);
    } catch {
      // Fall back honestly to reference storage if browser cannot decode (e.g., TIFF/HEIC/CMYK)
    }
  }

  const downloadUrl = URL.createObjectURL(file);
  return {
    fileName: file.name,
    fileExt: ext,
    mimeType: file.type || 'application/octet-stream',
    kind: 'reference',
    previewUrl: lower.endsWith('.pdf') ? downloadUrl : undefined,
    downloadUrl,
    needsConversion: true,
    showRelief3D: false,
    useOutlineCut: false,
  };
}

/**
 * Processes a design/artwork/logo file uploaded for the Sign Frame face.
 * Accepts all file types without rejection.
 */
export async function processSignPictureFile(file: File): Promise<SignPictureData> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.svg') || file.type === 'image/svg+xml') {
    const svgRes = await processSvgFile(file);
    return {
      fileName: file.name,
      previewUrl: svgRes.previewUrl,
      downloadUrl: svgRes.downloadUrl,
      x: 0.5,
      y: 0.35,
      scale: 0.42,
      cutSegments: svgRes.cutSegments,
    };
  }

  if ((file.type && file.type.startsWith('image/')) || IMAGE_EXT_RE.test(lower)) {
    try {
      const imgRes = await processPhotoFile(file);
      return {
        fileName: file.name,
        previewUrl: imgRes.previewUrl,
        downloadUrl: imgRes.downloadUrl,
        x: 0.5,
        y: 0.35,
        scale: 0.42,
        cutSegments: imgRes.cutSegments,
      };
    } catch {
      // fall back to reference file
    }
  }

  if (lower.endsWith('.dxf')) {
    const text = await file.text();
    const cutSegments = parseDxfOutlines(text);
    const url = URL.createObjectURL(file);
    return {
      fileName: file.name,
      downloadUrl: url,
      needsConversion: cutSegments.length === 0,
      x: 0.5,
      y: 0.35,
      scale: 0.45,
      cutSegments,
    };
  }

  const url = URL.createObjectURL(file);
  return {
    fileName: file.name,
    downloadUrl: url,
    needsConversion: true,
    x: 0.5,
    y: 0.35,
    scale: 0.42,
  };
}
