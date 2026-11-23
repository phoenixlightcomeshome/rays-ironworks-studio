import {
  ConfiguratorState,
  DECOR_ITEMS,
  INITIAL_CONFIG,
  LEAF_CATALOG,
  PIECES,
  describeConfig,
  formatFinialLabel,
  formatMaterialLabel,
  formatPostStyleLabel,
  getActiveSupplierSpecs,
  getEffectivePicketSizeLabel,
  getPicketLayoutStats,
} from '../types/configurator';
import { buildMaterialsList } from './blueprintRenderer';

export type CutShareFormat = 'dxf' | 'stl' | 'pdf';

export interface CutSharePayload {
  v: 1;
  format: CutShareFormat;
  config: Partial<ConfiguratorState>;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

/**
 * Strips bulky browser dataURLs/heightmaps before encoding into a shareable URL,
 * while preserving geometry, cut contours, sign lettering, picket accents, and freehand drawing vectors.
 */
function compactConfigForUrl(state: ConfiguratorState): Partial<ConfiguratorState> {
  const { sampleArt, signPicture, ...rest } = state;
  const compact: Partial<ConfiguratorState> = { ...rest };
  if (sampleArt) {
    compact.sampleArt = {
      fileName: sampleArt.fileName,
      kind: sampleArt.kind,
      fileExt: sampleArt.fileExt,
      showRelief3D: false,
      useOutlineCut: sampleArt.useOutlineCut,
      cutSegments: sampleArt.cutSegments?.slice(0, 180),
      needsConversion: sampleArt.needsConversion,
    };
  }
  if (signPicture) {
    compact.signPicture = {
      fileName: signPicture.fileName,
      x: signPicture.x,
      y: signPicture.y,
      scale: signPicture.scale,
      cutSegments: signPicture.cutSegments?.slice(0, 180),
    };
  }
  return compact;
}

export async function encodeCutShareUrl(
  state: ConfiguratorState,
  format: CutShareFormat,
): Promise<string> {
  const payload: CutSharePayload = {
    v: 1,
    format,
    config: compactConfigForUrl(state),
  };
  const json = JSON.stringify(payload);
  const rawBytes = new TextEncoder().encode(json);

  let prefix = 'u_';
  let encodedBytes = rawBytes;
  if (typeof CompressionStream !== 'undefined') {
    try {
      const cs = new CompressionStream('deflate-raw');
      const writer = cs.writable.getWriter();
      writer.write(rawBytes);
      writer.close();
      const buf = await new Response(cs.readable).arrayBuffer();
      const compressed = new Uint8Array(buf);
      if (compressed.length < rawBytes.length) {
        prefix = 'z_';
        encodedBytes = compressed;
      }
    } catch {
      // fall back to uncompressed
    }
  }

  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#cut=${prefix}${toBase64Url(encodedBytes)}`;
}

export async function decodeCutShareHash(
  hashStr: string,
): Promise<{ format: CutShareFormat; config: ConfiguratorState } | null> {
  const match = hashStr.match(/#cut=([uz]_[A-Za-z0-9_-]+)/);
  if (!match) return null;
  try {
    const token = match[1];
    const mode = token.slice(0, 2);
    const bytes = fromBase64Url(token.slice(2));
    let jsonBytes = bytes;
    if (mode === 'z_' && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(new Uint8Array(bytes));
      writer.close();
      const buf = await new Response(ds.readable).arrayBuffer();
      jsonBytes = new Uint8Array(buf);
    }
    const jsonStr = new TextDecoder().decode(jsonBytes);
    const parsed = JSON.parse(jsonStr) as CutSharePayload;
    if (!parsed || !parsed.config) return null;

    const merged: ConfiguratorState = {
      ...INITIAL_CONFIG,
      ...parsed.config,
      hasPiece: true,
      decor: {
        ...INITIAL_CONFIG.decor,
        ...(parsed.config.decor || {}),
      },
      areaColors: {
        ...(parsed.config.areaColors || {}),
      },
      picketAccents: {
        ...(parsed.config.picketAccents || {}),
      },
      signStrokes: parsed.config.signStrokes || [],
      freeDrawStrokes2D: parsed.config.freeDrawStrokes2D || [],
      freeDrawStrokes3D: parsed.config.freeDrawStrokes3D || [],
      selectedLeaves: parsed.config.selectedLeaves || [],
      picketSize: parsed.config.picketSize || INITIAL_CONFIG.picketSize,
      customPostName: parsed.config.customPostName || '',
      signLetteringMode: parsed.config.signLetteringMode || 'typed',
      showSign: Boolean(parsed.config.showSign),
    };
    return {
      format: parsed.format || 'dxf',
      config: merged,
    };
  } catch {
    return null;
  }
}

function pdfEsc(s: string): string {
  return s
    .replace(/[^\x20-\x7e]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Generates a valid single-page PDF cut-sheet & shop specification document in pure TypeScript.
 */
export function generateCutSpecPdf(state: ConfiguratorState): Blob {
  const { bom, finishSpec, thicknessCallouts } = buildMaterialsList(state);
  const { catalog } = getActiveSupplierSpecs(state);
  const picketStats = getPicketLayoutStats(state);
  const activeDecor = DECOR_ITEMS.filter((d) => state.decor[d.key]).map(
    (d) => d.label,
  );

  const selectedLeafLabels = (state.selectedLeaves || [])
    .map((id) => LEAF_CATALOG.find((l) => l.id === id)?.label)
    .filter(Boolean);

  const lines: string[] = [
    "RAY'S IRONWORKS - CUT & SHOP SPECIFICATION",
    `Piece: ${PIECES[state.piece].label} (${state.sizeMode} sizing)`,
    `Dimensions: ${state.width} ft W x ${state.height} ft H${PIECES[state.piece].depth ? ` x ${state.depth} ft D` : ''}`,
    `Post Profile & Cap: ${formatPostStyleLabel(state)} | Cap/Finial: ${formatFinialLabel(state.finial)}`,
    `Picket Size & Design: ${getEffectivePicketSizeLabel(state)} | ${state.picketStyle}`,
    `Material & Finish: ${finishSpec}`,
    `Material Base: ${formatMaterialLabel(state)}`,
    `Supplier Catalog: ${catalog.name} (${catalog.domain})`,
    `Summary: ${describeConfig(state)}`,
    '',
    'PICKET ACCENTS & PARTS:',
    `  Knuckles: ${picketStats.accentCounts.knuckle} | Emblems: ${picketStats.accentCounts.emblem} | Leaves: ${picketStats.accentCounts.leaf}`,
    `  Selected Leaves (King / IMS): ${selectedLeafLabels.length ? selectedLeafLabels.join(', ') : 'None'}`,
    '',
    'THICKNESS CALLOUTS:',
    ...thicknessCallouts.map((c) => `  - ${c.part}: ${c.thickness}`),
    '',
    'BILL OF MATERIALS:',
    ...bom.map((b) => `  - ${b.part}: ${b.spec} | Qty ${b.qty} | Cut ${b.cutLength}`),
    '',
    `Decorative Catalog Items: ${activeDecor.length ? activeDecor.join(', ') : 'None'}`,
  ];

  if (state.piece === 'sign-frame' || state.showSign) {
    lines.push(
      `Sign Mode: ${state.signLetteringMode === 'hand-drawn' ? 'Hand-drawn lettering' : 'Typed lettering'}`,
      `Sign Lettering: "${state.signText}" (${state.signFont}, ${state.signFontSize}px, ${state.signTextColor})`,
      `Freehand Sign Strokes: ${state.signStrokes.length} paths`,
      `Sign Artwork File: ${state.signPicture ? state.signPicture.fileName : 'None'}`,
    );
  }
  lines.push(
    '',
    "Contact: Ray's Ironworks | 424-394-9271 | raysironworks101@gmail.com",
  );

  // Wrap long lines cleanly
  const wrapped: string[] = [];
  lines.forEach((raw) => {
    if (raw.length <= 86) {
      wrapped.push(raw);
    } else {
      let idx = 0;
      while (idx < raw.length) {
        wrapped.push(raw.slice(idx, idx + 86));
        idx += 86;
      }
    }
  });

  const textOps = ['BT', '/F1 10 Tf', '42 745 Td', '14 TL'];
  wrapped.slice(0, 48).forEach((ln, i) => {
    textOps.push(i === 0 ? `(${pdfEsc(ln)}) Tj` : `T* (${pdfEsc(ln)}) Tj`);
  });
  textOps.push('ET');
  const stream = textOps.join('\n');

  const objs: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o) => {
    offsets.push(pdf.length);
    pdf += o;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return new Blob([pdf], { type: 'application/pdf' });
}

/**
 * Generates a single-page landscape Letter PDF embedding an HTMLCanvasElement (e.g. Technical Drawing or Isometric Blueprint View).
 */
export function generateCanvasPdfBlob(
  canvas: HTMLCanvasElement,
  title: string,
): Blob {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const b64 = dataUrl.split(',')[1] || '';
  const bin = atob(b64);
  const imgBytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    imgBytes[i] = bin.charCodeAt(i);
  }

  const pageW = 792;
  const pageH = 612;
  const maxW = 744;
  const maxH = 516;
  const aspect = canvas.width / Math.max(1, canvas.height);
  let drawW = maxW;
  let drawH = drawW / aspect;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = drawH * aspect;
  }
  const drawX = (pageW - drawW) / 2;
  const drawY = 30 + (maxH - drawH) / 2;

  const contentStream = [
    'q',
    `${drawW.toFixed(1)} 0 0 ${drawH.toFixed(1)} ${drawX.toFixed(1)} ${drawY.toFixed(1)} cm`,
    '/Im1 Do',
    'Q',
    'BT',
    '/F1 11 Tf',
    '24 574 Td',
    `(${pdfEsc(title)}) Tj`,
    'ET',
  ].join('\n');

  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let cursor = 0;
  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    cursor += bytes.length;
  };
  const pushStr = (s: string) => pushBytes(enc.encode(s));

  pushStr('%PDF-1.4\n%\xff\xff\xff\xff\n');
  const offsets: number[] = [];

  offsets.push(cursor);
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  offsets.push(cursor);
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  offsets.push(cursor);
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> /XObject << /Im1 6 0 R >> >> >>\nendobj\n`,
  );

  offsets.push(cursor);
  pushStr(
    `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  );

  offsets.push(cursor);
  pushStr('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');

  offsets.push(cursor);
  pushStr(
    `6 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`,
  );
  pushBytes(imgBytes);
  pushStr('\nendstream\nendobj\n');

  const xrefStart = cursor;
  let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  xref += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  pushStr(xref);

  const out = new Uint8Array(new ArrayBuffer(cursor));
  let writePos = 0;
  chunks.forEach((c) => {
    out.set(c, writePos);
    writePos += c.length;
  });

  return new Blob([out], { type: 'application/pdf' });
}
