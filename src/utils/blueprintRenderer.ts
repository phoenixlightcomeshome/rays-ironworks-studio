import {
  ConfiguratorState,
  DECOR_ITEMS,
  FINISHES,
  INFILL_PATTERNS,
  LEAF_CATALOG,
  MATERIALS,
  PART_AREA_LABELS,
  PICKET_FORM_STYLES,
  PIECES,
  POWDERS,
  PartArea,
  PicketAccentType,
  SCROLL_STYLES,
  formatFinialLabel,
  formatMaterialLabel,
  formatPostStyleLabel,
  getActiveSupplierSpecs,
  getEffectivePicketInches,
  getEffectivePicketSizeLabel,
  getPicketLayoutStats,
} from '../types/configurator';
import {
  UploadedPhoto3D,
  formatCalibratedInches,
  formatPhotoDimensionLabel,
  getCachedPhotoRelief,
  getCalibrationSummaryText,
  getIsometricPhotoBlock,
  getPhotoDistInPhotoWidths,
  getShadedPhoto2DCanvas,
} from './photoRelief';

const W = 1100;
const H = 740;

const cachedSignImages = new Map<string, HTMLImageElement>();

function getLoadedImage(url: string): HTMLImageElement | null {
  const existing = cachedSignImages.get(url);
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return existing;
  }
  if (!existing) {
    const img = new Image();
    img.src = url;
    cachedSignImages.set(url, img);
  }
  return null;
}

function ftIn(v: number): string {
  const safe = Number.isFinite(v) && v > 0 ? v : 1;
  let ft = Math.floor(safe);
  let inch = Math.round((safe - ft) * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return `${ft}'-${inch < 10 ? '0' : ''}${inch}"`;
}

function inStr(feet: number): string {
  return `${Math.round(feet * 12)}"`;
}

function labelFor(state: ConfiguratorState): string {
  const names: Record<string, string> = {
    gate: 'Gate',
    railing: 'Railing',
    'sculpture-base': 'Sculpture Base',
    'sign-frame': 'Sign Frame',
    'patio-cover': 'Patio Cover Frame',
  };
  return names[state.piece] || 'Custom Piece';
}

function dimsLine(s: ConfiguratorState): string {
  const modeTag =
    s.sizeMode === 'artistic'
      ? ' · Artistic Freeform'
      : s.sizeMode === 'custom'
        ? ' · Custom Size'
        : ' · Standard Size';
  if (s.piece === 'railing') {
    return `${ftIn(s.width)} (${inStr(s.width)}) long × ${ftIn(s.height)} (${inStr(s.height)}) high${modeTag}`;
  }
  if (s.piece === 'patio-cover') {
    return `${ftIn(s.width)} span × ${ftIn(s.depth)} deep × ${ftIn(s.height)} high${modeTag}`;
  }
  if (s.piece === 'sculpture-base') {
    return `${ftIn(s.width)} × ${ftIn(s.depth)} × ${ftIn(s.height)} high${modeTag}`;
  }
  return `${ftIn(s.width)} (${inStr(s.width)}) wide × ${ftIn(s.height)} (${inStr(s.height)}) high${modeTag}`;
}

export interface MaterialSpecItem {
  part: string;
  spec: string;
  qty: string;
  cutLength: string;
}

export function buildMaterialsList(state: ConfiguratorState): {
  thicknessCallouts: Array<{ part: string; thickness: string }>;
  bom: MaterialSpecItem[];
  finishSpec: string;
} {
  const matLabel = formatMaterialLabel(state);
  const { catalog, picketOpt, barOpt, panelOpt } = getActiveSupplierSpecs(state);
  const isAlum = state.material === 'aluminum';
  const isGlass = state.material === 'glass';
  const isWood = state.material === 'wood';

  const scrollLabel =
    SCROLL_STYLES.find((s) => s.id === state.scrollStyle)?.label ||
    state.scrollStyle;
  const infillLabel =
    INFILL_PATTERNS.find((p) => p.id === state.infillPattern)?.label ||
    state.infillPattern;
  const picketStyleLabel =
    PICKET_FORM_STYLES.find((p) => p.id === state.picketStyle)?.label ||
    state.picketStyle;
  const effectivePicketIn = getEffectivePicketInches(state);
  const effectivePicketLabel = getEffectivePicketSizeLabel(state);
  const postLabel = formatPostStyleLabel(state);

  const postSpec = isGlass
    ? `Structural ${postLabel} mullion post for glass panel`
    : isWood
      ? `4" × 4" solid hardwood (${postLabel}) + steel shoe`
      : isAlum
        ? `${postLabel} 6061-T6 aluminum structural post`
        : state.postStyle === 'round'
          ? '3" OD × 11 ga (0.120") round pipe post'
          : state.postStyle === 'square'
            ? `3" × 3" × 11 ga (0.120") ${matLabel} sq tube`
            : `${postLabel} structural ${matLabel} post`;
  const railSpec = isWood
    ? '2" × 4" milled hardwood rail'
    : barOpt.specText;
  const picketSpec = isGlass
    ? '3/8" (0.375") tempered architectural glass panel'
    : isWood
      ? '1" × 4" vertical/horizontal hardwood slats'
      : state.style === 'solid' || state.infillPattern === 'solid-panel'
        ? panelOpt.specText
        : state.style === 'horizontal' ||
            state.infillPattern === 'horizontal-bars'
          ? barOpt.specText
          : state.style === 'scroll' || state.infillPattern === 'scroll-panel'
            ? `${scrollLabel} — ${effectivePicketLabel}`
            : state.infillPattern === 'vertical-pickets'
              ? `${picketStyleLabel} (${effectivePicketLabel})`
              : `${infillLabel} — ${panelOpt.specText}`;
  const plateSpec = isAlum ? '3/8" 6061-T6 base plate' : '1/4" (0.250") A36 base plate';

  const finishSpec = state.customColor
    ? `${matLabel} · Custom ${state.customColor.toUpperCase()} (${FINISHES[state.finish].label})`
    : state.finish === 'powder-coat'
      ? `${matLabel} · Powder-coat (${POWDERS[state.powder].label})`
      : `${matLabel} · ${FINISHES[state.finish].label}`;

  const bom: MaterialSpecItem[] = [];
  const thicknessCallouts: Array<{ part: string; thickness: string }> = [];

  const {
    perLeafPickets,
    totalPickets,
    accentCounts,
    totalAccents,
  } = getPicketLayoutStats(state);

  if (state.piece === 'railing') {
    const nSeg = Math.max(1, Math.round(state.width / state.postSpacing));
    const nPosts = nSeg + 1;
    bom.push({
      part: 'Posts',
      spec: postSpec,
      qty: `${nPosts}`,
      cutLength: `${ftIn(state.height)}`,
    });
    bom.push({
      part: 'Top & Bottom Rails',
      spec:
        state.topRail === 'cap'
          ? `2-1/2" cap + ${railSpec}`
          : railSpec,
      qty: '2 runs',
      cutLength: `${ftIn(state.width)}`,
    });
    const infillCount =
      state.style === 'vertical' && state.infillPattern === 'vertical-pickets'
        ? `${totalPickets} (${infillLabel} @ ${state.picketSpacing}" O.C.)`
        : state.style === 'horizontal' || state.infillPattern === 'horizontal-bars'
          ? `${Math.max(3, Math.round(state.height * 1.6))} bars`
          : state.style === 'solid' || state.infillPattern === 'solid-panel'
            ? '1 panel set'
            : state.style === 'vertical' && state.infillPattern !== 'scroll-panel'
              ? `${infillLabel} bay`
              : `${Math.max(1, Math.round(state.width / 2.2))} ${scrollLabel}`;
    bom.push({
      part: `Infill (${catalog.name})`,
      spec: picketSpec,
      qty: infillCount,
      cutLength: `${ftIn(Math.max(1, state.height - 0.55))}`,
    });
    bom.push({
      part: 'Base Flanges',
      spec: plateSpec,
      qty: `${nPosts} (6"×6")`,
      cutLength: '6" × 6"',
    });
    thicknessCallouts.push(
      { part: 'Posts', thickness: isWood ? '3.5" timber' : isAlum ? '0.125" wall' : '11 ga (0.120")' },
      { part: 'Rails', thickness: `${barOpt.inches}" (${catalog.name})` },
      {
        part: 'Infill',
        thickness: isGlass
          ? '3/8" tempered'
          : state.style === 'solid' || state.infillPattern === 'solid-panel'
            ? `${panelOpt.inches}" sheet`
            : `${effectivePicketIn}" ${picketStyleLabel}`,
      },
    );
  } else if (state.piece === 'sculpture-base') {
    bom.push({
      part: 'Core Plinth',
      spec: `${matLabel} ${state.style} form`,
      qty: '1',
      cutLength: `${ftIn(state.width)} × ${ftIn(state.depth)} × ${ftIn(state.height)}`,
    });
    bom.push({
      part: 'Bottom Base Plate',
      spec: plateSpec,
      qty: '1',
      cutLength: `${ftIn(state.width + 0.5)} × ${ftIn(state.depth + 0.5)}`,
    });
    bom.push({
      part: 'Top Cap & Collar',
      spec: '3/16" (0.188") plate',
      qty: '1',
      cutLength: `${ftIn(state.width + 0.2)} × ${ftIn(state.depth + 0.2)}`,
    });
    thicknessCallouts.push(
      { part: 'Shell', thickness: isWood ? '2" plank' : isGlass ? '1/2" laminated' : '10 ga (0.135")' },
      { part: 'Base Plate', thickness: '1/4" (0.250")' },
      { part: 'Top Cap', thickness: '3/16" (0.188")' },
    );
  } else if (state.piece === 'sign-frame') {
    bom.push({
      part: 'Support Posts',
      spec: postSpec,
      qty: '2',
      cutLength: `${ftIn(state.height)}`,
    });
    bom.push({
      part: 'Sign Border Frame',
      spec: railSpec,
      qty: '1 perimeter',
      cutLength: `${ftIn(state.width)} × ${ftIn(state.height * 0.62)}`,
    });
    bom.push({
      part: 'Sign Face & Lettering',
      spec:
        state.signLetteringMode === 'hand-drawn'
          ? `${panelOpt.specText} | Hand-drawn (${state.signStrokes.length} strokes)`
          : `${panelOpt.specText} | "${state.signText.trim()}"`,
      qty: state.signPicture ? '1 + art' : '1',
      cutLength: `${ftIn(state.width)} × ${ftIn(state.height * 0.62)}`,
    });
    thicknessCallouts.push(
      { part: 'Posts', thickness: isAlum ? '0.125" wall' : '11 ga (0.120")' },
      { part: 'Frame', thickness: `${barOpt.inches}" tube` },
      { part: 'Panel', thickness: isGlass ? '3/8" glass' : '12 ga (0.105")' },
    );
  } else if (state.piece === 'patio-cover') {
    const nPosts = state.width > 14 ? 6 : 4;
    bom.push({
      part: 'Structural Posts',
      spec: `4" × 4" × 3/16" (0.188") ${matLabel}`,
      qty: `${nPosts}`,
      cutLength: `${ftIn(state.height)}`,
    });
    bom.push({
      part: 'Perimeter Beams',
      spec: '6" × 2" × 3/16" rect HSS',
      qty: '4 beams',
      cutLength: `${ftIn(state.width)} / ${ftIn(state.depth)}`,
    });
    bom.push({
      part: state.style === 'slats' ? 'Shade Slats / Rafters' : 'Roof Decking',
      spec:
        state.style === 'slats'
          ? `2" × 3" × 11 ga ${matLabel}`
          : `14 ga ${matLabel} deck`,
      qty:
        state.style === 'slats'
          ? `${Math.max(4, Math.round(state.width / 1.4))} slats`
          : '1 roof deck',
      cutLength: `${ftIn(state.depth + 0.8)}`,
    });
    bom.push({
      part: 'Anchor Base Plates',
      spec: '3/8" (0.375") A36 anchor plate',
      qty: `${nPosts}`,
      cutLength: '8" × 8"',
    });
    thicknessCallouts.push(
      { part: 'Posts', thickness: '3/16" (0.188")' },
      { part: 'Beams', thickness: '3/16" (0.188")' },
      { part: 'Base Plate', thickness: '3/8" (0.375")' },
    );
  } else {
    // Gate
    const leaves = state.leaves === 'double' ? 2 : 1;
    const leafW = leaves === 2 ? state.width / 2 - 0.15 : state.width;
    bom.push({
      part: 'Hinge & Strike Posts',
      spec: postSpec,
      qty: '2',
      cutLength: `${ftIn(state.height)}`,
    });
    bom.push({
      part: 'Gate Leaf Frame',
      spec: railSpec,
      qty: `${leaves} leaf (${leaves * 2} rails + stiles)`,
      cutLength: `${ftIn(leafW)} × ${ftIn(state.height)}`,
    });
    bom.push({
      part: `Infill (${catalog.name})`,
      spec: picketSpec,
      qty:
        state.style === 'vertical' && state.infillPattern === 'vertical-pickets'
          ? `${totalPickets} (${perLeafPickets}/leaf @ ${state.picketSpacing}" O.C.)`
          : state.style === 'horizontal' || state.infillPattern === 'horizontal-bars'
            ? `${Math.max(3, Math.round(state.height * 1.5)) * leaves} bars`
            : state.style === 'solid' || state.infillPattern === 'solid-panel'
              ? `${leaves} sheet panel(s)`
              : state.style === 'vertical' && state.infillPattern !== 'scroll-panel'
                ? `${leaves} ${infillLabel} bay(s)`
                : `${Math.max(1, Math.round(state.width / 2.2))} ${scrollLabel}`,
      cutLength: `${ftIn(Math.max(1, state.height - 0.5))}`,
    });
    thicknessCallouts.push(
      { part: 'Posts', thickness: `3/16" wall · ${postLabel}` },
      { part: 'Leaf Frame', thickness: `${barOpt.inches}" (${catalog.name})` },
      {
        part: 'Infill',
        thickness: isGlass
          ? '3/8" glass'
          : state.style === 'solid' || state.infillPattern === 'solid-panel'
            ? `${panelOpt.inches}" sheet`
            : `${effectivePicketIn}" ${picketStyleLabel}`,
      },
    );
  }

  if (totalAccents > 0) {
    const accentParts: string[] = [];
    if (accentCounts.knuckle) accentParts.push(`Knuckles: ${accentCounts.knuckle}`);
    if (accentCounts.emblem) accentParts.push(`Emblems: ${accentCounts.emblem}`);
    if (accentCounts.leaf) accentParts.push(`Leaves: ${accentCounts.leaf}`);
    bom.push({
      part: 'Picket Accents',
      spec: accentParts.join(' · '),
      qty: `${totalAccents} forged`,
      cutLength: 'Collared on pickets',
    });
  }

  if (state.showSign && state.piece !== 'sign-frame') {
    const signW = Math.min(state.width * 0.58, 5.2);
    const signH = Math.min(state.height * 0.34, 2.2);
    bom.push({
      part: 'Mounted Sign Plaque',
      spec:
        state.signLetteringMode === 'hand-drawn'
          ? `Hand-drawn (${state.signStrokes.length} strokes)`
          : `"${state.signText.trim() || 'SIGN'}"`,
      qty: '1',
      cutLength: `${ftIn(signW)} × ${ftIn(signH)}`,
    });
  }

  const activeDecor = DECOR_ITEMS.filter((item) => state.decor[item.key]).map(
    (item) => item.label,
  );
  const selectedLeafItems = (state.selectedLeaves || [])
    .map((id) => LEAF_CATALOG.find((l) => l.id === id))
    .filter(Boolean);
  if (state.finial !== 'none' || activeDecor.length > 0 || selectedLeafItems.length > 0) {
    const extras = [
      ...(state.finial !== 'none' ? [formatFinialLabel(state.finial)] : []),
      ...selectedLeafItems.map((l) => `${l!.label} (${l!.catalog})`),
      ...activeDecor,
    ];
    bom.push({
      part: 'Caps, Leaves & Ornamental',
      spec: extras.join(', '),
      qty: `${extras.length} types`,
      cutLength: 'Shop-fitted',
    });
  }

  if (state.sampleArt) {
    bom.push({
      part: 'Sample Art / Pattern',
      spec: state.sampleArt.fileName,
      qty: state.sampleArt.needsConversion
        ? 'Ref (needs conv.)'
        : state.sampleArt.showRelief3D
          ? '3D relief + ref'
          : 'Pattern / 3D',
      cutLength: 'Scaled to frame',
    });
  }

  return { thicknessCallouts, bom, finishSpec };
}

function draw2DPicketAccentSymbol(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  accent: PicketAccentType,
  scaleFactor = 1,
) {
  ctx.save();
  if (accent === 'knuckle') {
    ctx.fillStyle = '#E8A317';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(px, py, 4.2 * scaleFactor, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (accent === 'emblem') {
    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    const r = 6 * scaleFactor;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const vx = px + Math.cos(a) * r;
      const vy = py + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (accent === 'leaf') {
    ctx.fillStyle = '#34D399';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.0;
    const s = 6.5 * scaleFactor;
    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      ctx.moveTo(px, py + 2 * scaleFactor);
      ctx.quadraticCurveTo(px + dir * s * 0.9, py - s * 0.25, px + dir * s, py - s * 0.75);
      ctx.quadraticCurveTo(px + dir * s * 0.35, py - s * 0.65, px, py + 2 * scaleFactor);
      ctx.fill();
      ctx.stroke();
    });
  }
  ctx.restore();
}

function drawSignPanelContent2D(
  ctx: CanvasRenderingContext2D,
  state: ConfiguratorState,
  x0: number,
  panelY: number,
  w: number,
  panelH: number,
  drawBorder = false,
) {
  ctx.save();
  if (drawBorder) {
    ctx.fillStyle = 'rgba(20, 24, 30, 0.92)';
    ctx.strokeStyle = '#E8A317';
    ctx.lineWidth = 2;
    ctx.fillRect(x0, panelY, w, panelH);
    ctx.strokeRect(x0, panelY, w, panelH);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 4, panelY + 4, w - 8, panelH - 8);
  }

  if (state.signPicture?.previewUrl) {
    const img = getLoadedImage(state.signPicture.previewUrl);
    if (img) {
      const picDim = Math.min(w, panelH) * state.signPicture.scale;
      const px = x0 + state.signPicture.x * w - picDim / 2;
      const py = panelY + state.signPicture.y * panelH - picDim / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0 + 4, panelY + 4, w - 8, panelH - 8);
      ctx.clip();
      ctx.drawImage(img, px, py, picDim, picDim);
      ctx.restore();
    }
  }

  if (state.signLetteringMode === 'hand-drawn') {
    state.signStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.strokeStyle = stroke.color || '#E8A317';
      ctx.lineWidth = Math.max(1.4, stroke.width * 0.75);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      stroke.points.forEach(([px, py], i) => {
        const sx = x0 + px * w;
        const sy = panelY + py * panelH;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
    });
  } else {
    const text = (state.signText || 'YOUR NAME HERE').trim();
    if (text) {
      const ratio = Math.min(w / 240, panelH / 120);
      const scaledSize = Math.max(
        9,
        Math.min(46, Math.round((state.signFontSize / 42) * 18 * Math.max(0.55, ratio))),
      );
      ctx.font = `700 ${scaledSize}px ${state.signFont}`;
      ctx.fillStyle = state.signTextColor || '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = text.split(/\r?\n/).slice(0, 3);
      const lineH = scaledSize * 1.15;
      const startY = panelY + panelH / 2 - ((lines.length - 1) * lineH) / 2;
      lines.forEach((ln, idx) => {
        ctx.fillText(ln, x0 + w / 2, startY + idx * lineH, Math.max(20, w - 16));
      });
    }
  }
  ctx.restore();
}

export function drawFreeStrokesOverlay(
  ctx: CanvasRenderingContext2D,
  strokes: ConfiguratorState['freeDrawStrokes2D'],
  w: number,
  h: number,
) {
  if (!strokes || strokes.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  strokes.forEach((stroke) => {
    if (!stroke.points.length) return;
    ctx.strokeStyle = stroke.color || '#e8a317';
    ctx.lineWidth = Math.max(1.5, stroke.width);
    ctx.beginPath();
    stroke.points.forEach(([nx, ny], i) => {
      const sx = nx * w;
      const sy = ny * h;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    if (stroke.points.length === 1) {
      ctx.lineTo(stroke.points[0][0] * w + 0.5, stroke.points[0][1] * h + 0.5);
    }
    ctx.stroke();
  });
  ctx.restore();
}

export function hitTestBlueprintPicket(
  normX: number,
  normY: number,
  state: ConfiguratorState,
): number | null {
  const layout = getPicketLayoutStats(state);
  if (!layout.supportsPickets || layout.totalPickets === 0) return null;

  const ax = 75;
  const bx = 640;
  const gy = 580;
  const top = 128;
  const fw = Math.max(0.5, state.width);
  const fh = Math.max(0.5, state.height);
  const scale = Math.max(
    Math.min((bx - ax) / Math.max(fw, 1), (gy - top) / Math.max(fh * 1.25, 1)),
    6,
  );
  const w = fw * scale;
  const h = fh * scale;
  const x0 = (ax + bx - w) / 2;
  const y0 = gy - h;

  const pxClick = normX * W;
  const pyClick = normY * H;
  if (pyClick < y0 || pyClick > gy || pxClick < x0 - 14 || pxClick > x0 + w + 14) {
    return null;
  }

  let bestIdx = -1;
  let bestDist = Infinity;
  if (state.piece === 'gate' && state.leaves === 'double') {
    const gap = 8;
    const bayW = (w - gap) / 2;
    const leftBayX = x0;
    const rightBayX = x0 + bayW + gap;
    for (let i = 0; i < layout.perLeafPickets; i++) {
      const pxL = leftBayX + ((i + 0.5) * bayW) / layout.perLeafPickets;
      const dL = Math.abs(pxClick - pxL);
      if (dL < bestDist) {
        bestDist = dL;
        bestIdx = i;
      }
      const pxR = rightBayX + ((i + 0.5) * bayW) / layout.perLeafPickets;
      const dR = Math.abs(pxClick - pxR);
      if (dR < bestDist) {
        bestDist = dR;
        bestIdx = layout.perLeafPickets + i;
      }
    }
  } else {
    for (let i = 0; i < layout.totalPickets; i++) {
      const px = x0 + ((i + 0.5) * w) / layout.totalPickets;
      const d = Math.abs(pxClick - px);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
  }
  return bestDist <= 28 && bestIdx >= 0 ? bestIdx : null;
}

export interface PhotoBlueprintOverlayState {
  pendingStart?: [number, number] | null;
  pendingCalStart?: [number, number] | null;
  mode?: 'add' | 'calibrate' | 'adjust';
  selectedDimId?: string | null;
  onPhotoLoaded?: () => void;
}

export function getUploadedPhoto2DRect(imgAspect: number): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const bayX = 48;
  const bayY = 112;
  const bayW = 684;
  const bayH = 562;
  const safeAspect =
    Number.isFinite(imgAspect) && imgAspect > 0 ? imgAspect : 4 / 3;
  let w = bayW;
  let h = w / safeAspect;
  if (h > bayH) {
    h = bayH;
    w = h * safeAspect;
  }
  return {
    x: bayX + (bayW - w) / 2,
    y: bayY + (bayH - h) / 2,
    w,
    h,
  };
}

function drawUploadedPhotoBlueprint2D(
  ctx: CanvasRenderingContext2D,
  state: ConfiguratorState,
  photo: UploadedPhoto3D,
  overlay?: PhotoBlueprintOverlayState,
): void {
  // Blueprint grid & border
  ctx.fillStyle = '#1b3a6b';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < W; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let gy = 40; gy < H; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.48)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // Title block
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "700 20px Oswald, 'Arial Narrow', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText("RAY'S IRONWORKS — UPLOADED PHOTO — 2D ELEVATION", 30, 44);
  ctx.font = "600 13.5px 'Source Sans 3', sans-serif";
  ctx.fillStyle = '#E8A317';
  ctx.fillText(
    `File: ${photo.fileName}  ·  Relief Depth: ${photo.reliefDepth.toFixed(2)}`,
    30,
    66,
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#fde68a';
  ctx.font = "700 12px 'Source Sans 3', sans-serif";
  ctx.fillText(
    '3D interpretation of your photo — not a true scan; the back side is not captured.',
    W - 28,
    44,
  );

  const entry = getCachedPhotoRelief(photo.dataUrl, overlay?.onPhotoLoaded);

  ctx.fillStyle = '#93c5fd';
  ctx.font = "12px 'Source Sans 3', sans-serif";
  if (entry && photo.calibration && photo.calibration.knownLength > 0) {
    ctx.fillText(
      getCalibrationSummaryText(photo.calibration, entry.aspect),
      W - 28,
      66,
    );
  } else {
    ctx.fillText(
      'Scale: Uncalibrated — dimensions shown as % of photo width',
      W - 28,
      66,
    );
  }
  ctx.textAlign = 'left';

  // Left elevation bay label
  ctx.fillStyle = '#a8c4e0';
  ctx.font = "700 12px Oswald, 'Arial Narrow', sans-serif";
  ctx.fillText('UPLOADED PHOTO — 2D ELEVATION (LUMINANCE RELIEF SHADED)', 30, 96);

  if (!entry) {
    ctx.fillStyle = 'rgba(13, 31, 61, 0.72)';
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(48, 112, 684, 562);
    ctx.strokeRect(48, 112, 684, 562);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = "600 15px 'Source Sans 3', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('Preparing 2D elevation relief from uploaded photo…', 390, 390);
    ctx.textAlign = 'left';
  } else {
    const rect = getUploadedPhoto2DRect(entry.aspect);
    const shaded = getShadedPhoto2DCanvas(entry, photo.reliefDepth);

    // Backing plate edge shadow showing physical relief slab thickness
    const shadowOff = 4 + Math.min(8, photo.reliefDepth * 4);
    ctx.fillStyle = 'rgba(10, 16, 28, 0.85)';
    ctx.fillRect(
      rect.x + shadowOff,
      rect.y + shadowOff,
      rect.w,
      rect.h,
    );

    // Full photo (never cropped) shaded by the shared luminance relief
    ctx.drawImage(shaded, rect.x, rect.y, rect.w, rect.h);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

    // Calibration reference line (if calibrated)
    if (photo.calibration && photo.calibration.knownLength > 0) {
      const cal = photo.calibration;
      const cx1 = rect.x + cal.x1 * rect.w;
      const cy1 = rect.y + cal.y1 * rect.h;
      const cx2 = rect.x + cal.x2 * rect.w;
      const cy2 = rect.y + cal.y2 * rect.h;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(cx1, cy1);
      ctx.lineTo(cx2, cy2);
      ctx.stroke();
      ctx.setLineDash([]);
      [
        [cx1, cy1],
        [cx2, cy2],
      ].forEach(([px, py]) => {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
      const cmx = (cx1 + cx2) / 2;
      const cmy = (cy1 + cy2) / 2;
      const calTag = `SCALE: ${cal.knownLength} ${cal.unit}`;
      ctx.font = "700 11px 'Source Sans 3', sans-serif";
      const tw = ctx.measureText(calTag).width + 12;
      ctx.fillStyle = 'rgba(12, 24, 48, 0.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.fillRect(cmx - tw / 2, cmy - 22, tw, 18);
      ctx.strokeRect(cmx - tw / 2, cmy - 22, tw, 18);
      ctx.fillStyle = '#7dd3fc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(calTag, cmx, cmy - 13);
      ctx.restore();
    }

    // Placed user dimensions
    const dims = photo.dimensions || [];
    dims.forEach((d, idx) => {
      const px1 = rect.x + d.x1 * rect.w;
      const py1 = rect.y + d.y1 * rect.h;
      const px2 = rect.x + d.x2 * rect.w;
      const py2 = rect.y + d.y2 * rect.h;
      const dx = px2 - px1;
      const dy = py2 - py1;
      const len = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / len;
      const ny = dx / len;
      const isSelected = overlay?.selectedDimId === d.id;

      ctx.save();
      // Contrast outline
      ctx.strokeStyle = 'rgba(10, 16, 30, 0.9)';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.moveTo(px1 - nx * 8, py1 - ny * 8);
      ctx.lineTo(px1 + nx * 8, py1 + ny * 8);
      ctx.moveTo(px2 - nx * 8, py2 - ny * 8);
      ctx.lineTo(px2 + nx * 8, py2 + ny * 8);
      ctx.stroke();

      // Main dimension line + extension ticks
      ctx.strokeStyle = isSelected ? '#fef08a' : '#f59e0b';
      ctx.lineWidth = isSelected ? 2.4 : 2;
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.moveTo(px1 - nx * 8, py1 - ny * 8);
      ctx.lineTo(px1 + nx * 8, py1 + ny * 8);
      ctx.moveTo(px2 - nx * 8, py2 - ny * 8);
      ctx.lineTo(px2 + nx * 8, py2 + ny * 8);
      ctx.stroke();

      // Endpoint anchor dots
      [
        [px1, py1],
        [px2, py2],
      ].forEach(([ex, ey]) => {
        ctx.fillStyle = isSelected ? '#fef08a' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Label pill centered near midpoint
      const label = `#${idx + 1} · ${formatPhotoDimensionLabel(d, entry.aspect, photo.calibration)}`;
      const mx = (px1 + px2) / 2;
      const my = (py1 + py2) / 2;
      ctx.font = "700 12px 'Source Sans 3', sans-serif";
      const boxW = ctx.measureText(label).width + 16;
      const boxH = 22;
      const lx = Math.max(rect.x + 4, Math.min(rect.x + rect.w - boxW - 4, mx - boxW / 2));
      const ly = Math.max(rect.y + 4, Math.min(rect.y + rect.h - boxH - 4, my - boxH - 8));

      ctx.fillStyle = 'rgba(13, 24, 46, 0.94)';
      ctx.strokeStyle = isSelected ? '#fef08a' : '#f59e0b';
      ctx.lineWidth = 1.3;
      ctx.fillRect(lx, ly, boxW, boxH);
      ctx.strokeRect(lx, ly, boxW, boxH);
      ctx.fillStyle = '#fef3c7';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx + boxW / 2, ly + boxH / 2);
      ctx.restore();
    });

    // Pending point 1 crosshair (dimension or calibration)
    const pendingPt = overlay?.pendingCalStart || overlay?.pendingStart;
    if (pendingPt) {
      const px = rect.x + pendingPt[0] * rect.w;
      const py = rect.y + pendingPt[1] * rect.h;
      const isCal = Boolean(overlay?.pendingCalStart);
      ctx.save();
      ctx.strokeStyle = isCal ? '#38bdf8' : '#f59e0b';
      ctx.fillStyle = isCal ? '#38bdf8' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px - 12, py);
      ctx.lineTo(px + 12, py);
      ctx.moveTo(px, py - 12);
      ctx.lineTo(px, py + 12);
      ctx.stroke();

      const hint = isCal ? 'Tap 2nd calibration point' : 'Tap 2nd point';
      ctx.font = "700 11px 'Source Sans 3', sans-serif";
      const tw = ctx.measureText(hint).width + 12;
      ctx.fillStyle = 'rgba(12, 24, 48, 0.92)';
      ctx.fillRect(px - tw / 2, py - 28, tw, 18);
      ctx.strokeRect(px - tw / 2, py - 28, tw, 18);
      ctx.fillStyle = isCal ? '#7dd3fc' : '#fde68a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hint, px, py - 19);
      ctx.restore();
    }
  }

  // Right Panel: Uploaded Photo Details & Dimension Schedule
  const rx = 752;
  const ry = 96;
  const rw = 320;
  const rh = 594;
  ctx.fillStyle = 'rgba(13, 31, 61, 0.84)';
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.2;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeRect(rx, ry, rw, rh);

  let py = ry + 18;
  ctx.fillStyle = '#E8A317';
  ctx.font = "700 12.5px Oswald, 'Arial Narrow', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('UPLOADED PHOTO — 2D ELEVATION', rx + 14, py);
  py += 20;

  ctx.fillStyle = '#fde68a';
  ctx.font = "600 11px 'Source Sans 3', sans-serif";
  ctx.fillText('3D interpretation of your photo — not a true scan;', rx + 14, py);
  py += 14;
  ctx.fillText('the back side is not captured.', rx + 14, py);
  py += 22;

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.moveTo(rx + 12, py);
  ctx.lineTo(rx + rw - 12, py);
  ctx.stroke();
  py += 12;

  const infoRows: Array<[string, string]> = [
    ['File Name', photo.fileName.slice(0, 26)],
    [
      'Resolution',
      entry ? `${entry.naturalWidth} × ${entry.naturalHeight} px` : 'Loading…',
    ],
    ['Relief Grid', '160 × 160 smoothed luminance'],
    ['Relief Depth', photo.reliefDepth.toFixed(2)],
    [
      'Scale Status',
      photo.calibration && photo.calibration.knownLength > 0
        ? `${photo.calibration.knownLength} ${photo.calibration.unit} ref`
        : 'Uncalibrated (% width)',
    ],
  ];

  infoRows.forEach(([k, v]) => {
    ctx.fillStyle = '#93c5fd';
    ctx.font = "600 11px 'Source Sans 3', sans-serif";
    ctx.fillText(`${k}:`, rx + 14, py);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "700 11px 'Source Sans 3', sans-serif";
    ctx.fillText(v, rx + 105, py);
    py += 19;
  });

  if (entry && photo.calibration && photo.calibration.knownLength > 0) {
    const cal = photo.calibration;
    const calDistPw = getPhotoDistInPhotoWidths(
      cal.x1,
      cal.y1,
      cal.x2,
      cal.y2,
      entry.aspect,
    );
    const calIn = cal.unit === 'ft' ? cal.knownLength * 12 : cal.knownLength;
    const fullW = calDistPw > 1e-6 ? calIn / calDistPw : 0;
    const fullH = fullW / Math.max(0.1, entry.aspect);
    if (fullW > 0) {
      ctx.fillStyle = '#7dd3fc';
      ctx.font = "600 11px 'Source Sans 3', sans-serif";
      ctx.fillText(
        `Photo Span: ${formatCalibratedInches(fullW, cal.unit)} W`,
        rx + 14,
        py,
      );
      py += 16;
      ctx.fillText(
        `Photo Span: ${formatCalibratedInches(fullH, cal.unit)} H`,
        rx + 14,
        py,
      );
      py += 20;
    }
  } else {
    ctx.fillStyle = '#a8c4e0';
    ctx.font = "italic 10.5px 'Source Sans 3', sans-serif";
    ctx.fillText('No real-world size assumed until calibrated.', rx + 14, py);
    py += 22;
  }

  ctx.strokeStyle = 'rgba(232,163,23,0.45)';
  ctx.beginPath();
  ctx.moveTo(rx + 12, py);
  ctx.lineTo(rx + rw - 12, py);
  ctx.stroke();
  py += 12;

  ctx.fillStyle = '#E8A317';
  ctx.font = "700 12px Oswald, 'Arial Narrow', sans-serif";
  ctx.fillText(
    `PLACED DIMENSIONS (${(photo.dimensions || []).length})`,
    rx + 14,
    py,
  );
  py += 20;

  const dims = photo.dimensions || [];
  if (!dims.length) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = "11px 'Source Sans 3', sans-serif";
    ctx.fillText('Tap two points on the photo to measure', rx + 14, py);
    py += 15;
    ctx.fillText('features directly on this 2D elevation.', rx + 14, py);
  } else if (entry) {
    dims.slice(0, 14).forEach((d, idx) => {
      if (py > ry + rh - 24) return;
      const lbl = formatPhotoDimensionLabel(d, entry.aspect, photo.calibration);
      ctx.fillStyle = '#f59e0b';
      ctx.font = "700 11.5px 'Source Sans 3', sans-serif";
      ctx.fillText(`#${idx + 1}`, rx + 14, py);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = "600 11.5px 'Source Sans 3', sans-serif";
      ctx.fillText(lbl, rx + 44, py);
      py += 20;
    });
  }

  drawFreeStrokesOverlay(ctx, state.freeDrawStrokes2D, W, H);

  // Footer
  ctx.fillStyle = '#a8c4e0';
  ctx.font = "12.5px 'Source Sans 3', sans-serif";
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(
    "Ray's Ironworks · Uploaded Photo — 2D Elevation · 3D interpretation — not a true scan",
    30,
    H - 22,
  );
}

export function drawBlueprint(
  canvas: HTMLCanvasElement,
  state: ConfiguratorState,
  uploadedPhoto?: UploadedPhoto3D | null,
  photoOverlay?: PhotoBlueprintOverlayState,
): void {
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (uploadedPhoto) {
    drawUploadedPhotoBlueprint2D(ctx, state, uploadedPhoto, photoOverlay);
    return;
  }

  const { thicknessCallouts, bom, finishSpec } = buildMaterialsList(state);
  const { catalog } = getActiveSupplierSpecs(state);

  function arrow(x1: number, y1: number, x2: number, y2: number) {
    if (!ctx) return;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const s = 7;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - s * Math.cos(ang - 0.42), y2 - s * Math.sin(ang - 0.42));
    ctx.lineTo(x2 - s * Math.cos(ang + 0.42), y2 - s * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();
  }

  function dimH(x1: number, x2: number, y: number, text: string) {
    if (!ctx) return;
    ctx.strokeStyle = '#E8A317';
    ctx.fillStyle = '#E8A317';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    arrow(x1 + 12, y, x1, y);
    arrow(x2 - 12, y, x2, y);
    ctx.beginPath();
    ctx.moveTo(x1, y - 5);
    ctx.lineTo(x1, y + 5);
    ctx.moveTo(x2, y - 5);
    ctx.lineTo(x2, y + 5);
    ctx.stroke();
    ctx.font = "600 13px 'Source Sans 3', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, (x1 + x2) / 2, y - 5);
  }

  function dimV(x: number, y1: number, y2: number, text: string) {
    if (!ctx) return;
    ctx.strokeStyle = '#E8A317';
    ctx.fillStyle = '#E8A317';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
    arrow(x, y1 + 12, x, y1);
    arrow(x, y2 - 12, x, y2);
    ctx.beginPath();
    ctx.moveTo(x - 5, y1);
    ctx.lineTo(x + 5, y1);
    ctx.moveTo(x - 5, y2);
    ctx.lineTo(x + 5, y2);
    ctx.stroke();
    ctx.save();
    ctx.translate(x + 8, (y1 + y2) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "600 13px 'Source Sans 3', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function callout(tx: number, ty: number, lx: number, ly: number, text: string) {
    if (!ctx) return;
    ctx.strokeStyle = '#7dd3fc';
    ctx.fillStyle = '#bae6fd';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(lx, ly);
    ctx.lineTo(lx + (lx >= tx ? 12 : -12), ly);
    ctx.stroke();
    ctx.font = "600 11px 'Source Sans 3', sans-serif";
    ctx.textAlign = lx >= tx ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, lx + (lx >= tx ? 16 : -16), ly);
  }

  function drawPerson(x: number, groundY: number, scale: number) {
    if (!ctx) return;
    const h = 5 + 10 / 12;
    const pxH = h * scale;
    const top = groundY - pxH;
    ctx.strokeStyle = '#F2EFE8';
    ctx.fillStyle = '#F2EFE8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, top + pxH * 0.07, pxH * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, top + pxH * 0.14);
    ctx.lineTo(x, top + pxH * 0.52);
    ctx.moveTo(x, top + pxH * 0.24);
    ctx.lineTo(x - pxH * 0.16, top + pxH * 0.42);
    ctx.moveTo(x, top + pxH * 0.24);
    ctx.lineTo(x + pxH * 0.16, top + pxH * 0.42);
    ctx.moveTo(x, top + pxH * 0.52);
    ctx.lineTo(x - pxH * 0.12, groundY);
    ctx.moveTo(x, top + pxH * 0.52);
    ctx.lineTo(x + pxH * 0.12, groundY);
    ctx.stroke();
    ctx.font = "12px 'Source Sans 3', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#F2EFE8';
    ctx.fillText('5\'-10"', x, groundY + 6);
    ctx.fillText('scale', x, groundY + 20);
  }

  function drawScrollSymbol(cx: number, cy: number, rr: number) {
    if (!ctx) return;
    ctx.beginPath();
    if (state.scrollStyle === 'c-scroll' || state.scrollStyle === 'collar-double-c') {
      ctx.arc(cx, cy, rr * 0.9, Math.PI * 0.25, Math.PI * 1.75);
      if (state.scrollStyle === 'collar-double-c') {
        ctx.rect(cx - 4, cy - 5, 8, 10);
      }
    } else if (state.scrollStyle === 'double-scroll') {
      ctx.arc(cx - rr * 0.42, cy, rr * 0.5, 0, Math.PI * 2);
      ctx.moveTo(cx + rr * 0.92, cy);
      ctx.arc(cx + rr * 0.42, cy, rr * 0.5, 0, Math.PI * 2);
    } else if (state.scrollStyle === 'ribbon-scroll') {
      ctx.moveTo(cx - rr, cy + rr * 0.6);
      ctx.bezierCurveTo(cx - rr * 0.3, cy - rr, cx + rr * 0.3, cy + rr, cx + rr, cy - rr * 0.6);
    } else if (state.scrollStyle === 'waterleaf-scroll' || state.scrollStyle === 'vine-scroll') {
      ctx.arc(cx, cy, rr * 0.72, 0, Math.PI * 2);
      ctx.moveTo(cx, cy - rr * 0.9);
      ctx.lineTo(cx, cy + rr * 0.9);
    } else if (state.scrollStyle === 'heart-scroll') {
      ctx.arc(cx - rr * 0.38, cy - rr * 0.2, rr * 0.42, Math.PI, 0);
      ctx.arc(cx + rr * 0.38, cy - rr * 0.2, rr * 0.42, Math.PI, 0);
      ctx.lineTo(cx, cy + rr * 0.75);
      ctx.lineTo(cx - rr * 0.8, cy - rr * 0.2);
    } else if (state.scrollStyle === 'triple-spiral') {
      ctx.arc(cx, cy - rr * 0.4, rr * 0.38, 0, Math.PI * 2);
      ctx.moveTo(cx - rr * 0.08, cy + rr * 0.35);
      ctx.arc(cx - rr * 0.42, cy + rr * 0.35, rr * 0.34, 0, Math.PI * 2);
      ctx.moveTo(cx + rr * 0.76, cy + rr * 0.35);
      ctx.arc(cx + rr * 0.42, cy + rr * 0.35, rr * 0.34, 0, Math.PI * 2);
    } else {
      ctx.arc(cx - rr * 0.4, cy - rr * 0.35, rr * 0.55, 0, Math.PI * 2);
      ctx.moveTo(cx + rr * 0.95, cy + rr * 0.35);
      ctx.arc(cx + rr * 0.4, cy + rr * 0.35, rr * 0.55, 0, Math.PI * 2);
      if (state.scrollStyle === 'scroll-leaf' || state.scrollStyle === 'snub-end-s') {
        ctx.moveTo(cx - 4, cy);
        ctx.lineTo(cx + 4, cy);
      }
    }
    ctx.stroke();
  }

  function drawBlueprintInfill(
    x0: number,
    innerTop: number,
    w: number,
    innerH: number,
    fw: number,
    fh: number,
    picketOffset = 0,
  ) {
    if (!ctx) return;
    const innerBot = innerTop + innerH;
    const mode =
      state.style === 'vertical'
        ? state.infillPattern
        : state.style === 'horizontal'
          ? 'horizontal-bars'
          : state.style === 'solid'
            ? 'solid-panel'
            : 'scrollwork';

    ctx.strokeStyle = '#FFFFFF';
    if (mode === 'scrollwork' || mode === 'scroll-panel') {
      const nS = Math.max(1, Math.round(fw / 2.2));
      ctx.lineWidth = 1.6;
      for (let q = 0; q < nS; q++) {
        const cx = x0 + ((q + 0.5) * w) / nS;
        const cy = (innerTop + innerBot) / 2;
        const rr = Math.min(innerH * 0.3, (w / nS) * 0.32);
        drawScrollSymbol(cx, cy, rr);
      }
      return;
    }

    if (mode === 'horizontal-bars' || mode === 'louvered-slats') {
      const rows = Math.max(mode === 'louvered-slats' ? 5 : 3, Math.round(fh * (mode === 'louvered-slats' ? 2.4 : 1.6)));
      ctx.lineWidth = mode === 'louvered-slats' ? 1.8 : 1.4;
      for (let r = 0; r < rows; r++) {
        const y = innerTop + ((r + 0.5) * innerH) / rows;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 + w, y);
        ctx.stroke();
      }
      return;
    }

    if (mode === 'solid-panel') {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 5, innerTop + 5, w - 10, innerH - 10);
      ctx.strokeStyle = '#FFFFFF';
      return;
    }

    if (
      mode === 'perforated-round-staggered' ||
      mode === 'perforated-round-straight' ||
      mode === 'perforated-square' ||
      mode === 'perforated-slotted'
    ) {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 4, innerTop + 4, w - 8, innerH - 8);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      let rIdx = 0;
      for (let gy2 = innerTop + 14; gy2 < innerBot - 12; gy2 += 14) {
        const stag = mode === 'perforated-round-staggered' && rIdx % 2 === 1 ? 8 : 0;
        for (let gx = x0 + 14 + stag; gx < x0 + w - 12; gx += 16) {
          if (mode === 'perforated-square') {
            ctx.fillRect(gx - 2, gy2 - 2, 4, 4);
          } else if (mode === 'perforated-slotted') {
            ctx.fillRect(gx - 4, gy2 - 1.5, 8, 3);
          } else {
            ctx.beginPath();
            ctx.arc(gx, gy2, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        rIdx += 1;
      }
      ctx.strokeStyle = '#FFFFFF';
      return;
    }

    if (
      mode === 'interweave' ||
      mode === 'intercrimp' ||
      mode === 'lock-crimp' ||
      mode === 'flat-top-mesh' ||
      mode === 'bar-grating'
    ) {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 0.9;
      const stepX = mode === 'bar-grating' ? 22 : 14;
      const stepY = mode === 'bar-grating' ? 10 : 14;
      for (let gx = x0 + stepX; gx < x0 + w; gx += stepX) {
        ctx.beginPath();
        ctx.moveTo(gx, innerTop);
        ctx.lineTo(gx, innerBot);
        ctx.stroke();
      }
      for (let gy2 = innerTop + stepY; gy2 < innerBot; gy2 += stepY) {
        ctx.beginPath();
        ctx.moveTo(x0, gy2);
        ctx.lineTo(x0 + w, gy2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#FFFFFF';
      return;
    }

    if (mode === 'diamond-lattice' || mode === 'expanded-metal' || mode === 'flattened-expanded') {
      ctx.lineWidth = mode === 'diamond-lattice' ? 1.1 : 0.85;
      const steps = Math.max(mode === 'diamond-lattice' ? 4 : 8, Math.round(w / (mode === 'diamond-lattice' ? 22 : 12)));
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, innerTop, w, innerH);
      ctx.clip();
      for (let i = -steps; i <= steps * 2; i++) {
        const sx = x0 + (i * w) / steps;
        ctx.beginPath();
        ctx.moveTo(sx, innerBot);
        ctx.lineTo(sx + innerH, innerTop);
        ctx.moveTo(sx, innerTop);
        ctx.lineTo(sx + innerH, innerBot);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (mode === 'basketweave') {
      ctx.lineWidth = 1.1;
      const cols = Math.max(4, Math.floor((fw * 12) / (state.picketSpacing * 1.4)));
      for (let p = 0; p < cols; p++) {
        const px = x0 + ((p + 0.5) * w) / cols;
        ctx.beginPath();
        ctx.moveTo(px, innerTop);
        ctx.lineTo(px, innerBot);
        ctx.stroke();
      }
      const rows = Math.max(3, Math.round(innerH / 16));
      for (let r = 0; r < rows; r++) {
        const y = innerTop + ((r + 0.5) * innerH) / rows;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 + w, y);
        ctx.stroke();
      }
      return;
    }

    if (mode === 'sunburst') {
      ctx.lineWidth = 1.2;
      const ox = x0 + w / 2;
      const oy = innerBot;
      const rays = 10;
      for (let i = 0; i <= rays; i++) {
        const ang = (Math.PI * i) / rays;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(ang) * (w * 0.48), oy - Math.sin(ang) * (innerH * 0.94));
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(ox, oy, Math.min(w * 0.3, innerH * 0.55), Math.PI, 0);
      ctx.stroke();
      return;
    }

    // vertical-pickets with picket style indicators, selection halo & accents
    const n = Math.max(2, Math.floor((fw * 12) / Math.max(2, state.picketSpacing)));
    drawVerticalPicketsWithAccents(x0, innerTop, w, innerH, n, picketOffset);
  }

  function drawVerticalPicketsWithAccents(
    x0: number,
    innerTop: number,
    w: number,
    innerH: number,
    n: number,
    picketOffset = 0,
  ) {
    if (!ctx) return;
    const innerBot = innerTop + innerH;
    for (let p = 0; p < n; p++) {
      const globalIdx = picketOffset + p;
      const px = x0 + ((p + 0.5) * w) / n;
      const isSel = state.selectedPicketIndex === globalIdx;
      const accents = state.picketAccents?.[globalIdx] || [];

      if (isSel) {
        ctx.save();
        ctx.fillStyle = 'rgba(232, 163, 23, 0.28)';
        ctx.strokeStyle = '#E8A317';
        ctx.lineWidth = 1.6;
        ctx.fillRect(px - 6, innerTop, 12, innerH);
        ctx.strokeRect(px - 6, innerTop, 12, innerH);
        ctx.restore();
      }

      ctx.strokeStyle = isSel ? '#E8A317' : '#FFFFFF';
      ctx.lineWidth = isSel ? 2.1 : 1.3;
      if (state.picketStyle === 'twisted' || state.picketStyle === 'double-twist') {
        ctx.setLineDash([4, 2]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.moveTo(px, innerTop);
      ctx.lineTo(px, innerBot);
      ctx.stroke();
      ctx.setLineDash([]);

      if (state.picketStyle === 'spearhead') {
        ctx.beginPath();
        ctx.moveTo(px - 2.5, innerTop + 6);
        ctx.lineTo(px, innerTop);
        ctx.lineTo(px + 2.5, innerTop + 6);
        ctx.stroke();
      } else if (state.picketStyle === 'ball-top') {
        ctx.beginPath();
        ctx.arc(px, innerTop + 3, 2.2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (state.picketStyle === 'single-basket' || state.picketStyle === 'double-basket') {
        const ys =
          state.picketStyle === 'single-basket'
            ? [innerTop + innerH * 0.5]
            : [innerTop + innerH * 0.32, innerTop + innerH * 0.68];
        ys.forEach((by) => ctx.strokeRect(px - 3, by - 6, 6, 12));
      } else if (state.picketStyle === 'single-knuckle' || state.picketStyle === 'double-knuckle') {
        const ys =
          state.picketStyle === 'single-knuckle'
            ? [innerTop + innerH * 0.5]
            : [innerTop + innerH * 0.32, innerTop + innerH * 0.68];
        ys.forEach((by) => {
          ctx.beginPath();
          ctx.arc(px, by, 3, 0, Math.PI * 2);
          ctx.stroke();
        });
      } else if (state.picketStyle === 'scroll-picket') {
        ctx.beginPath();
        ctx.arc(px, innerTop + innerH * 0.5, 4, 0, Math.PI * 1.5);
        ctx.stroke();
      }

      // Draw forged accents on this picket
      if (accents.length > 0) {
        const spanY = Math.min(innerH * 0.58, accents.length * 22);
        accents.forEach((acc, aIdx) => {
          const ay =
            accents.length === 1
              ? innerTop + innerH * 0.5
              : innerTop + innerH * 0.5 - spanY / 2 + (aIdx * spanY) / Math.max(1, accents.length - 1);
          draw2DPicketAccentSymbol(ctx, px, ay, acc);
        });
      }
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = '#FFFFFF';
  }

  function drawIsometricView(rx: number, ry: number, rw: number, rh: number) {
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = 'rgba(13, 31, 61, 0.72)';
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.2;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);

    ctx.fillStyle = '#E8A317';
    ctx.font = "700 12px Oswald, 'Arial Narrow', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('ISOMETRIC PROJECTION', rx + 12, ry + 10);

    const pw = state.width;
    const ph = state.height;
    const pd =
      state.piece === 'patio-cover' || state.piece === 'sculpture-base'
        ? state.depth
        : Math.max(0.4, Math.min(1.0, state.width * 0.08));

    const maxExtent = Math.max(pw + pd, ph + (pw + pd) * 0.5);
    const isoScale = Math.min(
      (rw - 55) / Math.max(1, maxExtent),
      (rh - 70) / Math.max(1, maxExtent),
    );
    const cx = rx + rw * 0.5;
    const baseY = ry + rh - 24;
    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = Math.sin(Math.PI / 6);

    const proj = (x: number, y: number, z: number): [number, number] => {
      const ix = (x - pw / 2 - (z - pd / 2)) * cos30 * isoScale + cx;
      const iy =
        baseY - (y + (x - pw / 2 + (z - pd / 2)) * sin30 * 0.8) * isoScale;
      return [ix, iy];
    };

    const drawIsoBox = (
      x0: number,
      y0: number,
      z0: number,
      dx: number,
      dy: number,
      dz: number,
    ) => {
      if (!ctx) return;
      const p000 = proj(x0, y0, z0);
      const p100 = proj(x0 + dx, y0, z0);
      const p110 = proj(x0 + dx, y0 + dy, z0);
      const p010 = proj(x0, y0 + dy, z0);
      const p001 = proj(x0, y0, z0 + dz);
      const p101 = proj(x0 + dx, y0, z0 + dz);
      const p111 = proj(x0 + dx, y0 + dy, z0 + dz);
      const p011 = proj(x0, y0 + dy, z0 + dz);
      const seg = (a: [number, number], b: [number, number]) => {
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      };
      seg(p000, p100);
      seg(p100, p110);
      seg(p110, p010);
      seg(p010, p000);
      seg(p001, p101);
      seg(p101, p111);
      seg(p111, p011);
      seg(p011, p001);
      seg(p000, p001);
      seg(p100, p101);
      seg(p110, p111);
      seg(p010, p011);
    };

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.25;

    if (state.piece === 'patio-cover') {
      const pSize = 0.35;
      const nPosts = state.width > 14 ? 3 : 2;
      for (let i = 0; i < nPosts; i++) {
        const px = (i * (pw - pSize)) / (nPosts - 1);
        drawIsoBox(px, 0, 0, pSize, ph, pSize);
        drawIsoBox(px, 0, pd - pSize, pSize, ph, pSize);
      }
      drawIsoBox(0, ph - 0.35, 0, pw, 0.35, pd);
      if (state.style === 'slats') {
        const n = Math.max(4, Math.min(10, Math.round(pw / 1.6)));
        for (let s = 0; s < n; s++) {
          const sx = ((s + 0.5) * pw) / n - 0.1;
          drawIsoBox(sx, ph, 0, 0.2, 0.18, pd);
        }
      }
    } else if (state.piece === 'sculpture-base') {
      drawIsoBox(-0.15, 0, -0.15, pw + 0.3, 0.25, pd + 0.3);
      drawIsoBox(0, 0.25, 0, pw, ph - 0.45, pd);
      drawIsoBox(-0.1, ph - 0.2, -0.1, pw + 0.2, 0.2, pd + 0.2);
    } else if (state.piece === 'railing') {
      const nSeg = Math.max(1, Math.round(pw / state.postSpacing));
      for (let i = 0; i <= nSeg; i++) {
        drawIsoBox((i * pw) / nSeg - 0.15, 0, pd * 0.4, 0.3, ph, 0.3);
      }
      drawIsoBox(0, ph - 0.18, pd * 0.4, pw, 0.18, 0.3);
      drawIsoBox(0, 0.3, pd * 0.4, pw, 0.16, 0.24);
      const pickets = Math.min(14, Math.max(3, Math.floor((pw * 12) / state.picketSpacing)));
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      for (let p = 0; p < pickets; p++) {
        const px = ((p + 0.5) * pw) / pickets;
        const a = proj(px, 0.46, pd * 0.52);
        const b = proj(px, ph - 0.18, pd * 0.52);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
    } else {
      drawIsoBox(0, 0, pd * 0.35, 0.35, ph, 0.35);
      drawIsoBox(pw - 0.35, 0, pd * 0.35, 0.35, ph, 0.35);
      drawIsoBox(0.35, 0.25, pd * 0.42, pw - 0.7, ph - 0.5, 0.22);
      if (state.piece === 'gate' && state.style === 'vertical') {
        const n = Math.min(12, Math.max(3, Math.floor((pw * 12) / state.picketSpacing)));
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        for (let p = 0; p < n; p++) {
          const px = 0.35 + ((p + 0.5) * (pw - 0.7)) / n;
          const a = proj(px, 0.3, pd * 0.53);
          const b = proj(px, ph - 0.3, pd * 0.53);
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = '#a8c4e0';
    ctx.font = "11px 'Source Sans 3', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText(`Depth: ${ftIn(pd)}`, rx + rw - 12, ry + rh - 16);
    ctx.restore();
  }

  function drawMaterialsAndColorLegend(
    rx: number,
    ry: number,
    rw: number,
    rh: number,
  ) {
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = 'rgba(13, 31, 61, 0.8)';
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.2;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);

    ctx.fillStyle = '#E8A317';
    ctx.font = "700 12px Oswald, 'Arial Narrow', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`MATERIALS LIST (${catalog.name.toUpperCase()})`, rx + 12, ry + 10);

    ctx.fillStyle = '#bae6fd';
    ctx.font = "600 11px 'Source Sans 3', sans-serif";
    ctx.fillText(finishSpec, rx + 12, ry + 27);

    let y = ry + 47;
    const rowH = 44;
    bom.slice(0, 5).forEach((row) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.beginPath();
      ctx.moveTo(rx + 10, y - 4);
      ctx.lineTo(rx + rw - 10, y - 4);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = "700 11px 'Source Sans 3', sans-serif";
      ctx.fillText(row.part.slice(0, 28), rx + 12, y);

      ctx.fillStyle = '#E8A317';
      ctx.textAlign = 'right';
      ctx.fillText(`Qty: ${row.qty.slice(0, 22)}`, rx + rw - 12, y);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#cbd5e1';
      ctx.font = "10.5px 'Source Sans 3', sans-serif";
      ctx.fillText(row.spec.slice(0, 54), rx + 12, y + 14);
      ctx.fillStyle = '#93c5fd';
      ctx.fillText(`Cut: ${row.cutLength}`, rx + 12, y + 27);
      y += rowH;
    });

    const legendY = Math.max(y + 4, ry + rh - 96);
    ctx.strokeStyle = 'rgba(232,163,23,0.45)';
    ctx.beginPath();
    ctx.moveTo(rx + 10, legendY);
    ctx.lineTo(rx + rw - 10, legendY);
    ctx.stroke();

    ctx.fillStyle = '#E8A317';
    ctx.font = "700 11px Oswald, 'Arial Narrow', sans-serif";
    ctx.fillText('COLOR LEGEND', rx + 12, legendY + 6);

    const baseSwatch =
      state.customColor ||
      (state.finish === 'powder-coat'
        ? POWDERS[state.powder].swatch
        : FINISHES[state.finish].color !== null
          ? `#${FINISHES[state.finish].color!.toString(16).padStart(6, '0')}`
          : `#${MATERIALS[state.material].color.toString(16).padStart(6, '0')}`);

    const entries: Array<{ label: string; hex: string }> = [
      { label: 'Default Piece', hex: baseSwatch },
    ];
    (Object.keys(state.areaColors) as PartArea[]).forEach((area) => {
      const hex = state.areaColors[area];
      if (hex) {
        entries.push({ label: PART_AREA_LABELS[area], hex });
      }
    });

    const lx = rx + 12;
    const ly = legendY + 24;
    entries.slice(0, 6).forEach((ent, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const ex = lx + col * 174;
      const ey = ly + row * 20;
      ctx.fillStyle = ent.hex;
      ctx.fillRect(ex, ey, 12, 12);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(ex, ey, 12, 12);
      ctx.fillStyle = '#f2efe8';
      ctx.font = "10.5px 'Source Sans 3', sans-serif";
      ctx.fillText(`${ent.label}: ${ent.hex.toUpperCase()}`, ex + 17, ey + 1);
    });

    ctx.restore();
  }

  // Background & engineering grid
  ctx.fillStyle = '#1b3a6b';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < W; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let gy2 = 40; gy2 < H; gy2 += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy2);
    ctx.lineTo(W, gy2);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // Title block
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "700 22px Oswald, 'Arial Narrow', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText("RAY'S IRONWORKS — TECHNICAL CONCEPT DRAWING", 30, 44);
  ctx.font = "15px 'Source Sans 3', sans-serif";
  ctx.fillStyle = '#E8A317';
  ctx.fillText(`${labelFor(state)}  ·  ${dimsLine(state)}`, 30, 66);
  ctx.fillStyle = '#F2EFE8';
  ctx.textAlign = 'right';
  ctx.fillText(`SUPPLIER: ${catalog.name.toUpperCase()}`, W - 30, 44);
  ctx.font = "13px 'Source Sans 3', sans-serif";
  ctx.fillStyle = '#a8c4e0';
  ctx.fillText(
    'Real dimensions, thicknesses & color legend — final engineering confirmed with Ray',
    W - 30,
    66,
  );
  ctx.textAlign = 'left';

  // Left elevation bay
  const ax = 75;
  const bx = 640;
  const gy = 580;
  const top = 128;
  const fw = Math.max(0.5, state.width);
  const fh = Math.max(0.5, state.height);
  const scale = Math.max(
    Math.min((bx - ax) / Math.max(fw, 1), (gy - top) / Math.max(fh * 1.25, 1)),
    6,
  );

  ctx.fillStyle = '#a8c4e0';
  ctx.font = "700 12px Oswald, 'Arial Narrow', sans-serif";
  ctx.fillText('FRONT ELEVATION (WITH THICKNESS CALLOUTS)', 32, 96);

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax - 30, gy);
  ctx.lineTo(bx + 45, gy);
  ctx.stroke();

  let box2: { x0: number; x1: number; y0: number; y1: number };

  if (state.piece === 'railing') {
    const w = fw * scale;
    const h = fh * scale;
    const x0 = (ax + bx - w) / 2;
    const y0 = gy - h;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x0, y0, w, 10);
    ctx.strokeRect(x0, gy - 10, w, 10);
    const nSeg = Math.max(1, Math.round(fw / state.postSpacing));
    const step = w / nSeg;
    ctx.lineWidth = 2;
    for (let i = 0; i <= nSeg; i++) {
      ctx.strokeRect(x0 + i * step - 5, y0, 10, h);
    }
    const innerTop = y0 + 10;
    const innerBot = gy - 10;
    const innerH = innerBot - innerTop;
    drawBlueprintInfill(x0, innerTop, w, innerH, fw, fh);
    if (nSeg >= 1) {
      dimH(x0, x0 + step, gy + 24, `Post c/c: ${ftIn(fw / nSeg)}`);
    }
    box2 = { x0, x1: x0 + w, y0, y1: gy };
  } else if (state.piece === 'sculpture-base') {
    const w = fw * scale;
    const h = fh * scale;
    const x0 = (ax + bx - w) / 2;
    const y0 = gy - h;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x0 - 10, gy - 12, w + 20, 12);
    if (state.style === 'column') {
      ctx.beginPath();
      ctx.ellipse(
        (ax + bx) / 2,
        y0 + 12 + (h - 24) / 2,
        w * 0.42,
        (h - 24) / 2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    } else if (state.style === 'tapered') {
      ctx.beginPath();
      ctx.moveTo(x0 + w * 0.08, gy - 12);
      ctx.lineTo(x0 + w * 0.2, y0 + 12);
      ctx.lineTo(x0 + w * 0.8, y0 + 12);
      ctx.lineTo(x0 + w * 0.92, gy - 12);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.strokeRect(x0, y0 + 12, w, h - 24);
    }
    ctx.strokeRect(x0 - 6, y0, w + 12, 12);
    const cx = (ax + bx) / 2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, y0 - h * 0.14, h * 0.16, 0, Math.PI * 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + h * 0.1, y0 - h * 0.3, h * 0.1, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, y0 - h * 0.42, h * 0.045, 0, Math.PI * 2);
    ctx.stroke();
    box2 = { x0, x1: x0 + w, y0: y0 - h * 0.4, y1: gy };
  } else if (state.piece === 'sign-frame') {
    const w = fw * scale;
    const h = fh * scale;
    const x0 = (ax + bx - w) / 2;
    const y0 = gy - h;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x0 - 14, y0, 12, h);
    ctx.strokeRect(x0 + w + 2, y0, 12, h);
    const panelH = h * 0.62;
    const panelY = y0 + h * 0.2;
    ctx.strokeRect(x0, panelY, w, panelH);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x0 + 10, panelY + 10, w - 20, panelH - 20);

    drawSignPanelContent2D(ctx, state, x0, panelY, w, panelH, false);

    if (state.style === 'arch') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x0 + w / 2, panelY, w / 2, Math.PI, 0);
      ctx.stroke();
    }
    box2 = { x0, x1: x0 + w, y0, y1: gy };
  } else if (state.piece === 'patio-cover') {
    const w = fw * scale;
    const h = fh * scale;
    const x0 = (ax + bx - w) / 2;
    const y0 = gy - h;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x0 - 14, y0 + 18);
    ctx.lineTo(x0 + w + 14, y0 + 4);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0 - 14, y0 + 30);
    ctx.lineTo(x0 + w + 14, y0 + 16);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x0 + 6, y0 + 30, 12, h - 30);
    ctx.strokeRect(x0 + w - 18, y0 + 16, 12, h - 16);
    if (fw > 14) {
      ctx.strokeRect(x0 + w / 2 - 6, y0 + 23, 12, h - 23);
    }
    box2 = { x0, x1: x0 + w, y0, y1: gy };
  } else {
    const w = fw * scale;
    const h = fh * scale;
    const x0 = (ax + bx - w) / 2;
    const y0 = gy - h;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x0 - 12, y0, 12, h);
    ctx.strokeRect(x0 + w, y0, 12, h);
    ctx.strokeRect(x0, y0, w, 12);
    ctx.strokeRect(x0, y0 + h - 12, w, 12);
    const innerTop = y0 + 12;
    const innerH = h - 24;
    if (state.leaves === 'double') {
      const gap = 8;
      const bayW = (w - gap) / 2;
      const leafFw = Math.max(1, fw / 2 - 0.15);
      const { perLeafPickets } = getPicketLayoutStats(state);
      drawBlueprintInfill(x0, innerTop, bayW, innerH, leafFw, fh, 0);
      drawBlueprintInfill(x0 + bayW + gap, innerTop, bayW, innerH, leafFw, fh, perLeafPickets);
      ctx.strokeStyle = '#E8A317';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(x0 + w / 2, y0);
      ctx.lineTo(x0 + w / 2, gy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
    } else {
      drawBlueprintInfill(x0, innerTop, w, innerH, fw, fh, 0);
    }
    box2 = { x0, x1: x0 + w, y0, y1: gy };
  }

  // Optional Sign Plaque Overlay on non-sign-frame pieces
  if (state.showSign && state.piece !== 'sign-frame') {
    const boxW0 = box2.x1 - box2.x0;
    const boxH0 = box2.y1 - box2.y0;
    const spW = Math.min(boxW0 * 0.62, 180);
    const spH = Math.min(boxH0 * 0.36, 76);
    drawSignPanelContent2D(
      ctx,
      state,
      (box2.x0 + box2.x1 - spW) / 2,
      (box2.y0 + box2.y1 - spH) / 2,
      spW,
      spH,
      true,
    );
  }

  // Draw symbolic decorative indicators on blueprint
  const midX = (box2.x0 + box2.x1) / 2;
  const midY = (box2.y0 + box2.y1) / 2;
  const boxW = box2.x1 - box2.x0;
  const boxH = box2.y1 - box2.y0;
  ctx.save();
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 1.2;
  if (state.decor.scrolls && state.style !== 'scroll') {
    drawScrollSymbol(midX - boxW * 0.22, midY, Math.min(20, boxH * 0.18));
    drawScrollSymbol(midX + boxW * 0.22, midY, Math.min(20, boxH * 0.18));
  }
  if (state.decor.rosettes) {
    [-boxW * 0.25, boxW * 0.25].forEach((ox) => {
      ctx.beginPath();
      ctx.arc(midX + ox, midY - boxH * 0.1, 7, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
  if (state.decor.baskets) {
    [-boxW * 0.15, boxW * 0.15].forEach((ox) => {
      ctx.strokeRect(midX + ox - 5, midY - 9, 10, 18);
    });
  }
  if (state.decor.fleurDeLis) {
    ctx.beginPath();
    ctx.moveTo(midX, box2.y0 - 10);
    ctx.lineTo(midX - 5, box2.y0);
    ctx.lineTo(midX + 5, box2.y0);
    ctx.closePath();
    ctx.stroke();
  }
  if (state.decor.spearheadFinials) {
    for (let i = 0; i < 5; i++) {
      const sx = box2.x0 + ((i + 0.5) * boxW) / 5;
      ctx.beginPath();
      ctx.moveTo(sx, box2.y0 - 8);
      ctx.lineTo(sx - 3, box2.y0);
      ctx.lineTo(sx + 3, box2.y0);
      ctx.closePath();
      ctx.stroke();
    }
  }
  if (state.decor.collars) {
    [-boxW * 0.2, boxW * 0.2].forEach((ox) => {
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(midX + ox - 5, midY + boxH * 0.12, 10, 4);
    });
  }
  if (state.decor.twistedBars) {
    ctx.setLineDash([3, 3]);
    [-boxW * 0.3, 0, boxW * 0.3].forEach((ox) => {
      ctx.beginPath();
      ctx.moveTo(midX + ox, box2.y0 + 12);
      ctx.lineTo(midX + ox, box2.y1 - 12);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }
  if (state.decor.leafSprays) {
    ctx.beginPath();
    ctx.moveTo(midX + boxW * 0.12, midY + boxH * 0.15);
    ctx.quadraticCurveTo(midX + boxW * 0.22, midY, midX + boxW * 0.3, midY - boxH * 0.1);
    ctx.stroke();
  }

  if (state.sampleArt?.useOutlineCut && state.sampleArt.cutSegments?.length) {
    const artSize = Math.min(boxW * 0.6, boxH * 0.6);
    const ax0 = midX - artSize / 2;
    const ay0 = midY - artSize / 2;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    state.sampleArt.cutSegments.slice(0, 600).forEach(([x0, y0, x1, y1]) => {
      ctx.moveTo(ax0 + x0 * artSize, ay0 + (1 - y0) * artSize);
      ctx.lineTo(ax0 + x1 * artSize, ay0 + (1 - y1) * artSize);
    });
    ctx.stroke();
  }
  ctx.restore();

  dimH(
    box2.x0,
    box2.x1,
    Math.max(118, box2.y0 - 20),
    `${ftIn(fw)} (${inStr(fw)}) ${state.piece === 'railing' ? 'long' : 'wide'}`,
  );
  dimV(
    Math.min(638, box2.x1 + 26),
    box2.y0,
    box2.y1,
    `${ftIn(fh)} (${inStr(fh)}) high`,
  );

  if (thicknessCallouts[0]) {
    callout(
      box2.x0,
      box2.y0 + boxH * 0.25,
      Math.max(145, box2.x0 - 20),
      box2.y0 + 18,
      `${thicknessCallouts[0].part}: ${thicknessCallouts[0].thickness}`,
    );
  }
  if (thicknessCallouts[1]) {
    callout(
      midX,
      box2.y0 + 6,
      Math.min(620, midX + 36),
      Math.max(115, box2.y0 - 4),
      `${thicknessCallouts[1].part}: ${thicknessCallouts[1].thickness}`,
    );
  }
  if (thicknessCallouts[2]) {
    callout(
      midX,
      midY,
      Math.max(150, box2.x0 - 18),
      midY + 26,
      `${thicknessCallouts[2].part}: ${thicknessCallouts[2].thickness}`,
    );
  }

  const personX = box2.x0 > 130 ? box2.x0 - 44 : Math.min(675, box2.x1 + 65);
  drawPerson(personX, gy, scale);

  drawIsometricView(704, 92, 368, 226);
  drawMaterialsAndColorLegend(704, 330, 368, 364);

  drawFreeStrokesOverlay(ctx, state.freeDrawStrokes2D, W, H);

  // Footer
  ctx.fillStyle = '#a8c4e0';
  ctx.font = "13px 'Source Sans 3', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(
    "Ray's Ironworks · 424-394-9271 · raysironworks101@gmail.com",
    30,
    H - 22,
  );
  ctx.textAlign = 'right';
  ctx.fillText(
    `Drawn ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })}`,
    680,
    H - 22,
  );
}

/**
 * Dedicated Front-Elevation Technical Drawing (tab directly under piece-type selector).
 * Driven strictly by live ConfiguratorState values with explicit dimension arrows,
 * picket spacing & counts, thickness callouts, accent counts, materials, and scale note.
 */
export function drawTechnicalDrawing(
  canvas: HTMLCanvasElement,
  state: ConfiguratorState,
): void {
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { thicknessCallouts, bom, finishSpec } = buildMaterialsList(state);
  const { catalog, picketOpt, barOpt } = getActiveSupplierSpecs(state);
  const picketStats = getPicketLayoutStats(state);

  // Blueprint Engineering Grid
  ctx.fillStyle = '#0f274d';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < W; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let gy = 40; gy < H; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.48)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // Top Engineering Header
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "700 21px Oswald, 'Arial Narrow', sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText("TECHNICAL DRAWING — FRONT ELEVATION", 30, 44);
  ctx.fillStyle = '#E8A317';
  ctx.font = "600 14px 'Source Sans 3', sans-serif";
  ctx.fillText(`${labelFor(state)} · ${dimsLine(state)} · ${finishSpec}`, 30, 66);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#7dd3fc';
  ctx.font = "700 13px 'Source Sans 3', sans-serif";
  ctx.fillText('Scale: not to scale — dimensions in feet/inches as labelled', W - 28, 44);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = "12px 'Source Sans 3', sans-serif";
  ctx.fillText(`Supplier: ${catalog.name}`, W - 28, 66);
  ctx.textAlign = 'left';

  const drawArrow = (x1: number, y1: number, x2: number, y2: number) => {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const s = 7;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - s * Math.cos(ang - 0.42), y2 - s * Math.sin(ang - 0.42));
    ctx.lineTo(x2 - s * Math.cos(ang + 0.42), y2 - s * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();
  };

  const dimH = (x1: number, x2: number, y: number, text: string) => {
    ctx.save();
    ctx.strokeStyle = '#E8A317';
    ctx.fillStyle = '#E8A317';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    drawArrow(x1 + 14, y, x1, y);
    drawArrow(x2 - 14, y, x2, y);
    ctx.beginPath();
    ctx.moveTo(x1, y - 6);
    ctx.lineTo(x1, y + 6);
    ctx.moveTo(x2, y - 6);
    ctx.lineTo(x2, y + 6);
    ctx.stroke();
    ctx.font = "700 13px 'Source Sans 3', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, (x1 + x2) / 2, y - 5);
    ctx.restore();
  };

  const dimV = (x: number, y1: number, y2: number, text: string) => {
    ctx.save();
    ctx.strokeStyle = '#E8A317';
    ctx.fillStyle = '#E8A317';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
    drawArrow(x, y1 + 14, x, y1);
    drawArrow(x, y2 - 14, x, y2);
    ctx.beginPath();
    ctx.moveTo(x - 6, y1);
    ctx.lineTo(x + 6, y1);
    ctx.moveTo(x - 6, y2);
    ctx.lineTo(x + 6, y2);
    ctx.stroke();
    ctx.translate(x + 12, (y1 + y2) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "700 13px 'Source Sans 3', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };

  // Elevation Canvas Bay (Left)
  const bayLeft = 80;
  const bayRight = 690;
  const groundY = 585;
  const bayTop = 148;
  const fw = Math.max(0.5, state.width);
  const fh = Math.max(0.5, state.height);
  const scale = Math.max(
    6,
    Math.min((bayRight - bayLeft) / fw, (groundY - bayTop) / Math.max(fh * 1.18, 1)),
  );
  const w = fw * scale;
  const h = fh * scale;
  const x0 = (bayLeft + bayRight - w) / 2;
  const y0 = groundY - h;

  // Ground line
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(bayLeft - 24, groundY);
  ctx.lineTo(bayRight + 30, groundY);
  ctx.stroke();

  if (state.piece === 'railing') {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.6;
    ctx.strokeRect(x0, y0, w, 10);
    ctx.strokeRect(x0, groundY - 12, w, 10);
    const nSeg = Math.max(1, Math.round(fw / state.postSpacing));
    const step = w / nSeg;
    for (let i = 0; i <= nSeg; i++) {
      ctx.strokeRect(x0 + i * step - 5, y0, 10, h);
    }
    const innerTop = y0 + 10;
    const innerH = groundY - 12 - innerTop;
    if (picketStats.supportsPickets) {
      for (let p = 0; p < picketStats.totalPickets; p++) {
        const px = x0 + ((p + 0.5) * w) / picketStats.totalPickets;
        ctx.strokeStyle = state.selectedPicketIndex === p ? '#E8A317' : '#FFFFFF';
        ctx.lineWidth = state.selectedPicketIndex === p ? 2.2 : 1.4;
        ctx.beginPath();
        ctx.moveTo(px, innerTop);
        ctx.lineTo(px, innerTop + innerH);
        ctx.stroke();
        const accents = state.picketAccents?.[p] || [];
        const spanY = Math.min(innerH * 0.58, accents.length * 22);
        accents.forEach((acc, ai) => {
          const ay =
            accents.length === 1
              ? innerTop + innerH * 0.5
              : innerTop + innerH * 0.5 - spanY / 2 + (ai * spanY) / Math.max(1, accents.length - 1);
          draw2DPicketAccentSymbol(ctx, px, ay, acc, 1.05);
        });
      }
    }
    dimH(x0, x0 + step, groundY + 28, `Post spacing: ${ftIn(fw / nSeg)}`);
  } else if (state.piece === 'sculpture-base') {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x0 - 10, groundY - 12, w + 20, 12);
    ctx.strokeRect(x0, y0 + 12, w, h - 24);
    ctx.strokeRect(x0 - 6, y0, w + 12, 12);
  } else if (state.piece === 'patio-cover') {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.6;
    ctx.strokeRect(x0 - 12, y0, w + 24, 18);
    ctx.strokeRect(x0 + 6, y0 + 18, 12, h - 18);
    ctx.strokeRect(x0 + w - 18, y0 + 18, 12, h - 18);
    if (fw > 14) ctx.strokeRect(x0 + w / 2 - 6, y0 + 18, 12, h - 18);
  } else if (state.piece === 'sign-frame') {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.6;
    ctx.strokeRect(x0 - 14, y0, 12, h);
    ctx.strokeRect(x0 + w + 2, y0, 12, h);
    const panelH = h * 0.62;
    const panelY = y0 + h * 0.2;
    ctx.strokeRect(x0, panelY, w, panelH);
    drawSignPanelContent2D(ctx, state, x0, panelY, w, panelH, false);
    dimH(x0, x0 + w, panelY + panelH + 22, `Sign Panel: ${ftIn(fw)} × ${ftIn(fh * 0.62)}`);
  } else {
    // Gate
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.6;
    ctx.strokeRect(x0 - 12, y0, 12, h);
    ctx.strokeRect(x0 + w, y0, 12, h);
    ctx.strokeRect(x0, y0, w, 12);
    ctx.strokeRect(x0, groundY - 12, w, 12);
    const innerTop = y0 + 12;
    const innerH = h - 24;
    if (picketStats.supportsPickets) {
      if (state.leaves === 'double') {
        const gap = 8;
        const bayW = (w - gap) / 2;
        for (let leaf = 0; leaf < 2; leaf++) {
          const bx = leaf === 0 ? x0 : x0 + bayW + gap;
          for (let i = 0; i < picketStats.perLeafPickets; i++) {
            const gi = leaf * picketStats.perLeafPickets + i;
            const px = bx + ((i + 0.5) * bayW) / picketStats.perLeafPickets;
            ctx.strokeStyle = state.selectedPicketIndex === gi ? '#E8A317' : '#FFFFFF';
            ctx.lineWidth = state.selectedPicketIndex === gi ? 2.2 : 1.4;
            ctx.beginPath();
            ctx.moveTo(px, innerTop);
            ctx.lineTo(px, innerTop + innerH);
            ctx.stroke();
            const accents = state.picketAccents?.[gi] || [];
            const spanY = Math.min(innerH * 0.58, accents.length * 22);
            accents.forEach((acc, ai) => {
              const ay =
                accents.length === 1
                  ? innerTop + innerH * 0.5
                  : innerTop + innerH * 0.5 - spanY / 2 + (ai * spanY) / Math.max(1, accents.length - 1);
              draw2DPicketAccentSymbol(ctx, px, ay, acc, 1.05);
            });
          }
        }
        ctx.strokeStyle = '#E8A317';
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(x0 + w / 2, y0);
        ctx.lineTo(x0 + w / 2, groundY);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        for (let i = 0; i < picketStats.totalPickets; i++) {
          const px = x0 + ((i + 0.5) * w) / picketStats.totalPickets;
          ctx.strokeStyle = state.selectedPicketIndex === i ? '#E8A317' : '#FFFFFF';
          ctx.lineWidth = state.selectedPicketIndex === i ? 2.2 : 1.4;
          ctx.beginPath();
          ctx.moveTo(px, innerTop);
          ctx.lineTo(px, innerTop + innerH);
          ctx.stroke();
          const accents = state.picketAccents?.[i] || [];
          const spanY = Math.min(innerH * 0.58, accents.length * 22);
          accents.forEach((acc, ai) => {
            const ay =
              accents.length === 1
                ? innerTop + innerH * 0.5
                : innerTop + innerH * 0.5 - spanY / 2 + (ai * spanY) / Math.max(1, accents.length - 1);
            draw2DPicketAccentSymbol(ctx, px, ay, acc, 1.05);
          });
        }
      }
    }
  }

  if (state.showSign && state.piece !== 'sign-frame') {
    const spW = Math.min(w * 0.62, 180);
    const spH = Math.min(h * 0.36, 76);
    drawSignPanelContent2D(ctx, state, x0 + (w - spW) / 2, y0 + (h - spH) / 2, spW, spH, true);
  }

  // Main Dimension Lines
  dimH(x0, x0 + w, Math.max(115, y0 - 22), `Overall ${state.piece === 'railing' ? 'Length' : 'Width'}: ${ftIn(fw)} (${inStr(fw)})`);
  dimV(Math.min(725, x0 + w + 28), y0, groundY, `Overall Height: ${ftIn(fh)} (${inStr(fh)})`);

  // Picket Spacing Readout Dimension between first two pickets when active
  const effectivePicketIn = getEffectivePicketInches(state);
  const picketSizeLabel = getEffectivePicketSizeLabel(state);
  if (picketStats.supportsPickets && picketStats.totalPickets >= 2) {
    dimH(
      x0,
      x0 + w,
      groundY + 52,
      `Pickets: ${picketStats.totalPickets} total @ ${state.picketSpacing}" O.C. (${effectivePicketIn}" · Frame ${barOpt.inches}")`,
    );
  } else if (PIECES[state.piece].depth) {
    dimH(x0, x0 + w, groundY + 36, `Depth: ${ftIn(state.depth)} (${inStr(state.depth)})`);
  }

  // Right Engineering Specification Panel
  const rx = 748;
  const ry = 94;
  const rw = 326;
  const rh = 602;
  ctx.fillStyle = 'rgba(10, 22, 46, 0.88)';
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.4;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeRect(rx, ry, rw, rh);

  let sy = ry + 16;
  ctx.fillStyle = '#E8A317';
  ctx.font = "700 13px Oswald, 'Arial Narrow', sans-serif";
  ctx.fillText('LIVE SPECIFICATIONS & CALLOUTS', rx + 14, sy + 10);
  sy += 28;

  const specLines: Array<[string, string]> = [
    ['Piece', PIECES[state.piece].label],
    ['Width / Span', `${ftIn(fw)} (${inStr(fw)})`],
    ['Height', `${ftIn(fh)} (${inStr(fh)})`],
    ...(PIECES[state.piece].depth ? [['Depth', `${ftIn(state.depth)} (${inStr(state.depth)})`] as [string, string]] : []),
    ['Post Profile', formatPostStyleLabel(state)],
    ['Post Cap / Finial', state.finial === 'none' ? 'None' : formatFinialLabel(state.finial)],
    ['Material / Finish', finishSpec],
    ['Picket Size', `${effectivePicketIn}" (${picketSizeLabel.slice(0, 24)})`],
    ['Rail / Frame Stock', `${barOpt.inches}" (${catalog.name})`],
    ['Picket Count', picketStats.supportsPickets ? `${picketStats.totalPickets} @ ${state.picketSpacing}" O.C.` : 'N/A'],
    ['Catalog Leaves', state.selectedLeaves?.length ? `${state.selectedLeaves.length} selected (King/IMS)` : 'None'],
    ['Picket Accents', `K:${picketStats.accentCounts.knuckle} E:${picketStats.accentCounts.emblem} L:${picketStats.accentCounts.leaf}`],
  ];

  specLines.forEach(([k, v]) => {
    ctx.fillStyle = '#93c5fd';
    ctx.font = "600 11px 'Source Sans 3', sans-serif";
    ctx.fillText(`${k}:`, rx + 14, sy);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "700 11px 'Source Sans 3', sans-serif";
    ctx.fillText(v.slice(0, 32), rx + 122, sy);
    sy += 20;
  });

  if (state.piece === 'sign-frame' || state.showSign) {
    sy += 4;
    ctx.strokeStyle = 'rgba(232,163,23,0.4)';
    ctx.beginPath();
    ctx.moveTo(rx + 12, sy);
    ctx.lineTo(rx + rw - 12, sy);
    ctx.stroke();
    sy += 16;
    ctx.fillStyle = '#E8A317';
    ctx.font = "700 12px Oswald, 'Arial Narrow', sans-serif";
    ctx.fillText('SIGN LETTERING SPEC', rx + 14, sy);
    sy += 18;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "600 11px 'Source Sans 3', sans-serif";
    const modeStr = state.signLetteringMode === 'hand-drawn' ? 'Hand-drawn lettering' : `"${state.signText.trim()}"`;
    ctx.fillText(`Content: ${modeStr.slice(0, 34)}`, rx + 14, sy);
    sy += 16;
    const sw = state.piece === 'sign-frame' ? state.width : Math.min(state.width * 0.58, 5.2);
    const sh = state.piece === 'sign-frame' ? state.height * 0.62 : Math.min(state.height * 0.34, 2.2);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Sign size: ${ftIn(sw)} × ${ftIn(sh)}`, rx + 14, sy);
    sy += 20;
  }

  sy += 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.moveTo(rx + 12, sy);
  ctx.lineTo(rx + rw - 12, sy);
  ctx.stroke();
  sy += 16;
  ctx.fillStyle = '#E8A317';
  ctx.font = "700 12px Oswald, 'Arial Narrow', sans-serif";
  ctx.fillText('THICKNESS & MATERIALS SCHEDULE', rx + 14, sy);
  sy += 18;

  thicknessCallouts.forEach((tc) => {
    ctx.fillStyle = '#7dd3fc';
    ctx.font = "600 11px 'Source Sans 3', sans-serif";
    ctx.fillText(`${tc.part}: ${tc.thickness}`, rx + 14, sy);
    sy += 16;
  });

  sy += 6;
  bom.slice(0, 5).forEach((b) => {
    if (sy > ry + rh - 26) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "700 10.5px 'Source Sans 3', sans-serif";
    ctx.fillText(`• ${b.part}: ${b.qty}`, rx + 14, sy);
    sy += 13;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = "10px 'Source Sans 3', sans-serif";
    ctx.fillText(`  ${b.spec.slice(0, 44)}`, rx + 14, sy);
    sy += 15;
  });

  drawFreeStrokesOverlay(ctx, state.freeDrawStrokes2D, W, H);

  // Footer
  ctx.fillStyle = '#a8c4e0';
  ctx.font = "12px 'Source Sans 3', sans-serif";
  ctx.fillText("Ray's Ironworks · Front Elevation Technical Drawing · Live Computed", 30, H - 22);
}

function drawUploadedPhotoIsometric(
  ctx: CanvasRenderingContext2D,
  state: ConfiguratorState,
  photo: UploadedPhoto3D,
  onPhotoLoaded?: () => void,
): void {
  ctx.fillStyle = '#12294e';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < W; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let gy = 40; gy < H; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.48)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // Title Block
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "700 20px Oswald, 'Arial Narrow', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('UPLOADED PHOTO — ISOMETRIC VIEW', 30, 44);
  ctx.fillStyle = '#E8A317';
  ctx.font = "600 13.5px 'Source Sans 3', sans-serif";
  ctx.fillText(
    `File: ${photo.fileName}  ·  Relief Depth: ${photo.reliefDepth.toFixed(2)}`,
    30,
    66,
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#fde68a';
  ctx.font = "700 12px 'Source Sans 3', sans-serif";
  ctx.fillText(
    '3D interpretation of your photo — not a true scan; the back side is not captured.',
    W - 28,
    44,
  );
  ctx.fillStyle = '#93c5fd';
  ctx.font = "12px 'Source Sans 3', sans-serif";
  ctx.fillText(
    '30° isometric projection — brighter pixels rise higher along relief depth',
    W - 28,
    66,
  );
  ctx.textAlign = 'left';

  // Left Isometric Canvas Viewport
  const rx = 28;
  const ry = 90;
  const rw = 696;
  const rh = 608;
  ctx.fillStyle = 'rgba(10, 22, 46, 0.72)';
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  ctx.lineWidth = 1.2;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeRect(rx, ry, rw, rh);

  const entry = getCachedPhotoRelief(photo.dataUrl, onPhotoLoaded);
  if (!entry) {
    ctx.fillStyle = '#e2e8f0';
    ctx.font = "600 15px 'Source Sans 3', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(
      'Preparing isometric luminance relief block…',
      rx + rw / 2,
      ry + rh / 2,
    );
    ctx.textAlign = 'left';
  } else {
    const iso = getIsometricPhotoBlock(entry, rw, rh, photo.reliefDepth);
    ctx.drawImage(iso.canvas, rx, ry);

    // Draw clean architectural isometric bounding frame & axis callouts
    const proj2d = (u: number, v: number, z: number): [number, number] => {
      const U = u * iso.wIso;
      const V = v * iso.hIso;
      return [
        rx + iso.originX + (U + z) * iso.cosA,
        ry + iso.originY - U * iso.sinA + V + z * iso.sinA,
      ];
    };

    const seg = (
      a: [number, number],
      b: [number, number],
      color = 'rgba(255,255,255,0.55)',
      lw = 1.2,
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    };

    // Visible backing slab wireframe edges
    const b00 = proj2d(0, 0, 0);
    const b10 = proj2d(1, 0, 0);
    const b01 = proj2d(0, 1, 0);
    const f00 = proj2d(0, 0, iso.backT);
    const f10 = proj2d(1, 0, iso.backT);
    const f11 = proj2d(1, 1, iso.backT);
    const f01 = proj2d(0, 1, iso.backT);

    seg(b00, b10, 'rgba(255,255,255,0.72)', 1.3);
    seg(b00, b01, 'rgba(255,255,255,0.72)', 1.3);
    seg(b00, f00, 'rgba(255,255,255,0.72)', 1.3);
    seg(b10, f10, 'rgba(255,255,255,0.72)', 1.3);
    seg(b01, f01, 'rgba(255,255,255,0.72)', 1.3);
    seg(f00, f10, 'rgba(255,255,255,0.85)', 1.4);
    seg(f10, f11, 'rgba(255,255,255,0.85)', 1.4);
    seg(f11, f01, 'rgba(255,255,255,0.85)', 1.4);
    seg(f01, f00, 'rgba(255,255,255,0.85)', 1.4);

    // Axis dimension labels (no fake real-world size unless calibrated)
    const cal = photo.calibration && photo.calibration.knownLength > 0
      ? photo.calibration
      : null;
    let widthAxisText = `Photo Width (${entry.naturalWidth} px)`;
    let heightAxisText = `Photo Height (${entry.naturalHeight} px)`;
    if (cal) {
      const calDistPw = getPhotoDistInPhotoWidths(
        cal.x1,
        cal.y1,
        cal.x2,
        cal.y2,
        entry.aspect,
      );
      const calIn = cal.unit === 'ft' ? cal.knownLength * 12 : cal.knownLength;
      if (calDistPw > 1e-6) {
        const fullW = calIn / calDistPw;
        const fullH = fullW / Math.max(0.1, entry.aspect);
        widthAxisText = `W ≈ ${formatCalibratedInches(fullW, cal.unit)}`;
        heightAxisText = `H ≈ ${formatCalibratedInches(fullH, cal.unit)}`;
      }
    }

    const wA = proj2d(0, 1.07, iso.backT);
    const wB = proj2d(1, 1.07, iso.backT);
    seg(wA, wB, '#E8A317', 1.4);
    ctx.fillStyle = '#E8A317';
    ctx.font = "700 12px 'Source Sans 3', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(widthAxisText, (wA[0] + wB[0]) / 2, (wA[1] + wB[1]) / 2 + 16);

    const hA = proj2d(-0.07, 0, 0);
    const hB = proj2d(-0.07, 1, 0);
    seg(hA, hB, '#E8A317', 1.4);
    ctx.save();
    ctx.translate(hA[0] - 12, (hA[1] + hB[1]) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(heightAxisText, 0, 0);
    ctx.restore();

    const zA = proj2d(0, -0.06, 0);
    const zB = proj2d(0, -0.06, iso.backT + iso.reliefPx);
    seg(zA, zB, '#7dd3fc', 1.5);
    ctx.fillStyle = '#7dd3fc';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Relief (${photo.reliefDepth.toFixed(2)}) + Backing`,
      zB[0] + 6,
      zB[1] - 4,
    );
  }

  // Right Panel: Uploaded Photo Isometric Details
  const sx = 742;
  const sy = 90;
  const sw = 330;
  const sh = 608;
  ctx.fillStyle = 'rgba(10, 22, 46, 0.88)';
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(sx, sy, sw, sh);
  ctx.strokeRect(sx, sy, sw, sh);

  let iy = sy + 20;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#E8A317';
  ctx.font = "700 13px Oswald, 'Arial Narrow', sans-serif";
  ctx.fillText('UPLOADED PHOTO — ISOMETRIC VIEW', sx + 14, iy);
  iy += 22;

  ctx.fillStyle = '#fde68a';
  ctx.font = "600 11px 'Source Sans 3', sans-serif";
  ctx.fillText('3D interpretation of your photo — not a true scan;', sx + 14, iy);
  iy += 15;
  ctx.fillText('the back side is not captured.', sx + 14, iy);
  iy += 24;

  const isoLines: Array<[string, string]> = [
    ['Photo File', photo.fileName.slice(0, 26)],
    ['Relief Mesh', '160 × 160 smoothed luminance'],
    ['Relief Depth', photo.reliefDepth.toFixed(2)],
    ['Projection', '30° isometric parallelepiped'],
    ['Backing Plate', 'Solid steel slab behind relief'],
    [
      '2D Dimensions',
      `${(photo.dimensions || []).length} placed in 2D Blueprint`,
    ],
  ];

  isoLines.forEach(([k, v]) => {
    ctx.fillStyle = '#93c5fd';
    ctx.font = "600 11px 'Source Sans 3', sans-serif";
    ctx.fillText(`${k}:`, sx + 14, iy);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "700 11px 'Source Sans 3', sans-serif";
    ctx.fillText(v, sx + 108, iy);
    iy += 20;
  });

  if (entry && photo.calibration && photo.calibration.knownLength > 0) {
    iy += 8;
    ctx.strokeStyle = 'rgba(56,189,248,0.4)';
    ctx.beginPath();
    ctx.moveTo(sx + 12, iy);
    ctx.lineTo(sx + sw - 12, iy);
    ctx.stroke();
    iy += 14;
    ctx.fillStyle = '#7dd3fc';
    ctx.font = "700 11px 'Source Sans 3', sans-serif";
    ctx.fillText(
      getCalibrationSummaryText(photo.calibration, entry.aspect).slice(0, 46),
      sx + 14,
      iy,
    );
  }

  drawFreeStrokesOverlay(ctx, state.freeDrawStrokes2D, W, H);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#a8c4e0';
  ctx.font = "12px 'Source Sans 3', sans-serif";
  ctx.fillText(
    "Ray's Ironworks · Uploaded Photo — Isometric View · 3D interpretation — not a true scan",
    30,
    H - 22,
  );
}

/**
 * Dedicated Isometric Blueprint View (separate tab panel, full-sheet 3D isometric engineering projection).
 */
export function drawIsometricBlueprint(
  canvas: HTMLCanvasElement,
  state: ConfiguratorState,
  uploadedPhoto?: UploadedPhoto3D | null,
  onPhotoLoaded?: () => void,
): void {
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (uploadedPhoto) {
    drawUploadedPhotoIsometric(ctx, state, uploadedPhoto, onPhotoLoaded);
    return;
  }

  const { thicknessCallouts, bom, finishSpec } = buildMaterialsList(state);
  const { catalog, picketOpt, barOpt } = getActiveSupplierSpecs(state);
  const picketStats = getPicketLayoutStats(state);

  ctx.fillStyle = '#12294e';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < W; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let gy = 40; gy < H; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.48)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // Title Block
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "700 21px Oswald, 'Arial Narrow', sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText("ISOMETRIC BLUEPRINT VIEW", 30, 44);
  ctx.fillStyle = '#E8A317';
  ctx.font = "600 14px 'Source Sans 3', sans-serif";
  ctx.fillText(`${labelFor(state)} · ${dimsLine(state)} · ${finishSpec}`, 30, 66);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#7dd3fc';
  ctx.font = "700 12.5px 'Source Sans 3', sans-serif";
  ctx.fillText('Scale: not to scale — 30° isometric dimensions as labelled', W - 28, 44);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = "12px 'Source Sans 3', sans-serif";
  ctx.fillText(`Supplier: ${catalog.name}`, W - 28, 66);
  ctx.textAlign = 'left';

  // Left Isometric Canvas Viewport
  const rx = 28;
  const ry = 90;
  const rw = 696;
  const rh = 608;
  ctx.fillStyle = 'rgba(10, 22, 46, 0.72)';
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  ctx.lineWidth = 1.2;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeRect(rx, ry, rw, rh);

  const pw = state.width;
  const ph = state.height;
  const pd =
    state.piece === 'patio-cover' || state.piece === 'sculpture-base'
      ? state.depth
      : Math.max(0.45, Math.min(1.1, pw * 0.08));

  const maxExtent = Math.max(pw + pd, ph + (pw + pd) * 0.55);
  const isoScale = Math.min((rw - 160) / Math.max(1, maxExtent), (rh - 150) / Math.max(1, maxExtent));
  const cx = rx + rw * 0.52;
  const baseY = ry + rh - 85;
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  const proj = (x: number, y: number, z: number): [number, number] => {
    const ix = (x - pw / 2 - (z - pd / 2)) * cos30 * isoScale + cx;
    const iy = baseY - (y + (x - pw / 2 + (z - pd / 2)) * sin30 * 0.8) * isoScale;
    return [ix, iy];
  };

  const seg = (a: [number, number], b: [number, number]) => {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  };

  const drawIsoBox = (
    x0: number,
    y0: number,
    z0: number,
    dx: number,
    dy: number,
    dz: number,
    stroke = '#FFFFFF',
  ) => {
    ctx.save();
    ctx.strokeStyle = stroke;
    const p000 = proj(x0, y0, z0);
    const p100 = proj(x0 + dx, y0, z0);
    const p110 = proj(x0 + dx, y0 + dy, z0);
    const p010 = proj(x0, y0 + dy, z0);
    const p001 = proj(x0, y0, z0 + dz);
    const p101 = proj(x0 + dx, y0, z0 + dz);
    const p111 = proj(x0 + dx, y0 + dy, z0 + dz);
    const p011 = proj(x0, y0 + dy, z0 + dz);
    seg(p000, p100);
    seg(p100, p110);
    seg(p110, p010);
    seg(p010, p000);
    seg(p001, p101);
    seg(p101, p111);
    seg(p111, p011);
    seg(p011, p001);
    seg(p000, p001);
    seg(p100, p101);
    seg(p110, p111);
    seg(p010, p011);
    ctx.restore();
  };

  ctx.lineWidth = 1.5;
  if (state.piece === 'patio-cover') {
    const pSize = 0.35;
    const nPosts = pw > 14 ? 3 : 2;
    for (let i = 0; i < nPosts; i++) {
      const px = (i * (pw - pSize)) / (nPosts - 1);
      drawIsoBox(px, 0, 0, pSize, ph, pSize);
      drawIsoBox(px, 0, pd - pSize, pSize, ph, pSize);
    }
    drawIsoBox(0, ph - 0.35, 0, pw, 0.35, pd);
    if (state.style === 'slats') {
      const n = Math.max(4, Math.min(12, Math.round(pw / 1.5)));
      for (let s = 0; s < n; s++) {
        drawIsoBox(((s + 0.5) * pw) / n - 0.1, ph, 0, 0.2, 0.18, pd, '#bae6fd');
      }
    }
  } else if (state.piece === 'sculpture-base') {
    drawIsoBox(-0.15, 0, -0.15, pw + 0.3, 0.25, pd + 0.3);
    drawIsoBox(0, 0.25, 0, pw, ph - 0.45, pd);
    drawIsoBox(-0.1, ph - 0.2, -0.1, pw + 0.2, 0.2, pd + 0.2);
  } else if (state.piece === 'railing') {
    const nSeg = Math.max(1, Math.round(pw / state.postSpacing));
    for (let i = 0; i <= nSeg; i++) {
      drawIsoBox((i * pw) / nSeg - 0.15, 0, pd * 0.35, 0.3, ph, 0.3);
    }
    drawIsoBox(0, ph - 0.18, pd * 0.35, pw, 0.18, 0.3);
    drawIsoBox(0, 0.3, pd * 0.35, pw, 0.16, 0.24);
    for (let p = 0; p < picketStats.totalPickets; p++) {
      const px = ((p + 0.5) * pw) / picketStats.totalPickets;
      const isSel = state.selectedPicketIndex === p;
      ctx.strokeStyle = isSel ? '#E8A317' : 'rgba(255,255,255,0.82)';
      ctx.lineWidth = isSel ? 2.2 : 1.25;
      seg(proj(px, 0.46, pd * 0.5), proj(px, ph - 0.18, pd * 0.5));
      const accs = state.picketAccents?.[p] || [];
      accs.forEach((acc, ai) => {
        const yfrac = accs.length === 1 ? 0.5 : 0.25 + (ai * 0.5) / Math.max(1, accs.length - 1);
        const pt = proj(px, 0.46 + (ph - 0.64) * yfrac, pd * 0.5);
        draw2DPicketAccentSymbol(ctx, pt[0], pt[1], acc, 0.9);
      });
    }
  } else {
    drawIsoBox(0, 0, pd * 0.35, 0.35, ph, 0.35);
    drawIsoBox(pw - 0.35, 0, pd * 0.35, 0.35, ph, 0.35);
    drawIsoBox(0.35, 0.25, pd * 0.42, pw - 0.7, ph - 0.5, 0.2);
    if (state.piece === 'gate' && picketStats.supportsPickets) {
      for (let p = 0; p < picketStats.totalPickets; p++) {
        const px = 0.35 + ((p + 0.5) * (pw - 0.7)) / picketStats.totalPickets;
        const isSel = state.selectedPicketIndex === p;
        ctx.strokeStyle = isSel ? '#E8A317' : 'rgba(255,255,255,0.82)';
        ctx.lineWidth = isSel ? 2.2 : 1.25;
        seg(proj(px, 0.3, pd * 0.52), proj(px, ph - 0.3, pd * 0.52));
        const accs = state.picketAccents?.[p] || [];
        accs.forEach((acc, ai) => {
          const yfrac = accs.length === 1 ? 0.5 : 0.25 + (ai * 0.5) / Math.max(1, accs.length - 1);
          const pt = proj(px, 0.3 + (ph - 0.6) * yfrac, pd * 0.52);
          draw2DPicketAccentSymbol(ctx, pt[0], pt[1], acc, 0.9);
        });
      }
    }
    if (state.piece === 'sign-frame' || state.showSign) {
      const signCenter = proj(pw / 2, ph * 0.55, pd * 0.68);
      drawSignPanelContent2D(ctx, state, signCenter[0] - 85, signCenter[1] - 34, 170, 68, true);
    }
  }

  // Isometric Axis Dimension Lines (Width, Height, Depth)
  const isoDim = (a: [number, number], b: [number, number], label: string, color = '#E8A317') => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.4;
    seg(a, b);
    const drawDot = (pt: [number, number]) => {
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 3, 0, Math.PI * 2);
      ctx.fill();
    };
    drawDot(a);
    drawDot(b);
    ctx.font = "700 12px 'Source Sans 3', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(label, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 8);
    ctx.restore();
  };

  isoDim(proj(0, -0.5, pd), proj(pw, -0.5, pd), `W: ${ftIn(pw)} (${inStr(pw)})`);
  isoDim(proj(pw + 0.6, 0, pd * 0.4), proj(pw + 0.6, ph, pd * 0.4), `H: ${ftIn(ph)} (${inStr(ph)})`);
  isoDim(proj(0, 0, 0), proj(0, 0, pd), `D: ${ftIn(pd)}`, '#7dd3fc');

  // Right Panel: Live Isometric Details & Materials
  const sx = 742;
  const sy = 90;
  const sw = 330;
  const sh = 608;
  ctx.fillStyle = 'rgba(10, 22, 46, 0.88)';
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(sx, sy, sw, sh);
  ctx.strokeRect(sx, sy, sw, sh);

  let iy = sy + 18;
  ctx.fillStyle = '#E8A317';
  ctx.font = "700 13px Oswald, 'Arial Narrow', sans-serif";
  ctx.fillText(`MATERIALS & STOCK (${catalog.name.toUpperCase()})`, sx + 14, iy);
  iy += 20;
  ctx.fillStyle = '#bae6fd';
  ctx.font = "600 11px 'Source Sans 3', sans-serif";
  ctx.fillText(finishSpec, sx + 14, iy);
  iy += 18;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`Stock: ${getEffectivePicketInches(state)}" picket · ${barOpt.inches}" frame · ${formatPostStyleLabel(state)}`, sx + 14, iy);
  iy += 20;

  if (picketStats.totalPickets > 0 || picketStats.totalAccents > 0) {
    ctx.fillStyle = '#E8A317';
    ctx.fillText(
      `Pickets: ${picketStats.totalPickets} | Knuckles: ${picketStats.accentCounts.knuckle} | Emblems: ${picketStats.accentCounts.emblem} | Leaves: ${picketStats.accentCounts.leaf}`,
      sx + 14,
      iy,
    );
    iy += 22;
  }

  thicknessCallouts.forEach((tc) => {
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText(`${tc.part}: ${tc.thickness}`, sx + 14, iy);
    iy += 16;
  });

  iy += 8;
  bom.slice(0, 6).forEach((row) => {
    if (iy > sy + sh - 80) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "700 11px 'Source Sans 3', sans-serif";
    ctx.fillText(`${row.part} (${row.qty})`, sx + 14, iy);
    iy += 14;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = "10.5px 'Source Sans 3', sans-serif";
    ctx.fillText(`${row.spec.slice(0, 44)}`, sx + 14, iy);
    iy += 16;
  });

  drawFreeStrokesOverlay(ctx, state.freeDrawStrokes2D, W, H);

  ctx.fillStyle = '#a8c4e0';
  ctx.font = "12px 'Source Sans 3', sans-serif";
  ctx.fillText("Ray's Ironworks · Isometric Blueprint View · Live 3D Projection", 30, H - 22);
}

export type CutItemCategory =
  | 'Posts & Anchors'
  | 'Structural Frame'
  | 'Infill & Pickets'
  | 'Caps, Leaves & Ornamental'
  | 'Hardware & Signage'
  | 'Finish & Shop Prep';

export interface DetailedCutItem {
  tag: string;
  category: CutItemCategory;
  part: string;
  stockProfile: string;
  qty: string;
  cutLength: string;
  totalMeasure: string;
  notes: string;
}

export interface DetailedCutSummary {
  items: DetailedCutItem[];
  finishSpec: string;
  supplierName: string;
  totals: {
    lineItems: number;
    linearFeet: number;
    estimated20FtSticks: number;
    sheetSqFt: number;
    fittingsCount: number;
  };
}

function makeCalloutTag(index: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (index < letters.length) return letters[index];
  return `A${index - letters.length + 1}`;
}

function fmtDecIn(feet: number): string {
  return `${(feet * 12).toFixed(1)}"`;
}

export function buildDetailedCutList(state: ConfiguratorState): DetailedCutSummary {
  const matLabel = formatMaterialLabel(state);
  const { catalog, barOpt, panelOpt } = getActiveSupplierSpecs(state);
  const isAlum = state.material === 'aluminum';
  const isGlass = state.material === 'glass';
  const isWood = state.material === 'wood';

  const scrollLabel =
    SCROLL_STYLES.find((s) => s.id === state.scrollStyle)?.label ||
    state.scrollStyle;
  const infillLabel =
    INFILL_PATTERNS.find((p) => p.id === state.infillPattern)?.label ||
    state.infillPattern;
  const picketStyleLabel =
    PICKET_FORM_STYLES.find((p) => p.id === state.picketStyle)?.label ||
    state.picketStyle;
  const effectivePicketIn = getEffectivePicketInches(state);
  const effectivePicketLabel = getEffectivePicketSizeLabel(state);
  const postLabel = formatPostStyleLabel(state);

  const postSpec = isGlass
    ? `Structural ${postLabel} mullion post (glass channel)`
    : isWood
      ? `4" × 4" solid hardwood (${postLabel}) + steel shoe`
      : isAlum
        ? `${postLabel} 6061-T6 aluminum structural post`
        : state.postStyle === 'round'
          ? `3" OD × 11 ga (0.120") ${matLabel} round pipe`
          : state.postStyle === 'square'
            ? `3" × 3" × 11 ga (0.120") ${matLabel} sq tube`
            : `${postLabel} structural ${matLabel} post`;

  const railSpec = isWood ? '2" × 4" milled hardwood rail' : `${barOpt.specText} (${catalog.name})`;
  const plateSpec = isAlum ? '3/8" 6061-T6 anchor plate' : '1/4" (0.250") A36 steel base plate';

  const finishSpec = state.customColor
    ? `${matLabel} · Custom ${state.customColor.toUpperCase()} (${FINISHES[state.finish].label})`
    : state.finish === 'powder-coat'
      ? `${matLabel} · Powder-coat (${POWDERS[state.powder].label})`
      : `${matLabel} · ${FINISHES[state.finish].label}`;

  const rawItems: Array<Omit<DetailedCutItem, 'tag'>> = [];
  let linearFeet = 0;
  let sheetSqFt = 0;
  let fittingsCount = 0;

  const picketStats = getPicketLayoutStats(state);
  const leavesCount = state.piece === 'gate' && state.leaves === 'double' ? 2 : 1;
  let postCount = 0;

  if (state.piece === 'railing') {
    const nSeg = Math.max(1, Math.round(state.width / state.postSpacing));
    postCount = nSeg + 1;
    const postLn = +(postCount * state.height).toFixed(1);
    linearFeet += postLn;
    rawItems.push({
      category: 'Posts & Anchors',
      part: 'Line, Corner & End Posts',
      stockProfile: postSpec,
      qty: `${postCount} pcs`,
      cutLength: `${ftIn(state.height)} (${fmtDecIn(state.height)})`,
      totalMeasure: `${postLn} ln ft`,
      notes: `Spaced every ${ftIn(state.width / nSeg)} O.C.`,
    });

    const railLn = +(state.width * 2).toFixed(1);
    linearFeet += railLn;
    rawItems.push({
      category: 'Structural Frame',
      part: state.topRail === 'cap' ? 'Top Cap + Bottom Rail' : 'Top & Bottom Rails',
      stockProfile:
        state.topRail === 'cap'
          ? `2-1/2" molded cap rail + ${railSpec}`
          : state.topRail === 'round'
            ? `1-1/2" OD round handrail + ${railSpec}`
            : railSpec,
      qty: '2 runs',
      cutLength: `${ftIn(state.width)} (${fmtDecIn(state.width)})`,
      totalMeasure: `${railLn} ln ft`,
      notes: 'Coped / welded between posts',
    });

    const infillCutFt = Math.max(1, state.height - 0.55);
    if (state.style === 'vertical' && state.infillPattern === 'vertical-pickets') {
      const pLn = +(picketStats.totalPickets * infillCutFt).toFixed(1);
      linearFeet += pLn;
      rawItems.push({
        category: 'Infill & Pickets',
        part: `Vertical Pickets (${picketStyleLabel})`,
        stockProfile: `${effectivePicketLabel} (${effectivePicketIn}" nominal)`,
        qty: `${picketStats.totalPickets} pcs`,
        cutLength: `${ftIn(infillCutFt)} (${fmtDecIn(infillCutFt)})`,
        totalMeasure: `${pLn} ln ft`,
        notes: `${state.picketSpacing}" O.C. · Square cut ends`,
      });
    } else if (state.style === 'horizontal' || state.infillPattern === 'horizontal-bars') {
      const rows = Math.max(3, Math.round(state.height * 1.6));
      const barLn = +(rows * state.width).toFixed(1);
      linearFeet += barLn;
      rawItems.push({
        category: 'Infill & Pickets',
        part: 'Horizontal Infill Bars',
        stockProfile: railSpec,
        qty: `${rows} pcs`,
        cutLength: `${ftIn(state.width)} (${fmtDecIn(state.width)})`,
        totalMeasure: `${barLn} ln ft`,
        notes: 'Even vertical spacing inside rail bay',
      });
    } else if (state.style === 'solid' || state.infillPattern === 'solid-panel') {
      const area = +(state.width * infillCutFt).toFixed(1);
      sheetSqFt += area;
      rawItems.push({
        category: 'Infill & Pickets',
        part: 'Solid Sheet / Plate Infill',
        stockProfile: isGlass ? '3/8" tempered architectural glass' : `${panelOpt.specText} (${catalog.name})`,
        qty: `${nSeg} bays`,
        cutLength: `${ftIn(state.width / nSeg)} × ${ftIn(infillCutFt)}`,
        totalMeasure: `${area} sq ft`,
        notes: 'Perimeter tacked / glazed in channel',
      });
    } else if (state.style === 'scroll' || state.infillPattern === 'scroll-panel') {
      const nS = Math.max(1, Math.round(state.width / 2.2));
      const estBar = +(nS * infillCutFt * 2.1).toFixed(1);
      linearFeet += estBar;
      rawItems.push({
        category: 'Infill & Pickets',
        part: `Forged Scrollwork (${scrollLabel})`,
        stockProfile: `${effectivePicketLabel} forged flat/square scroll stock`,
        qty: `${nS} assemblies`,
        cutLength: `${ftIn(infillCutFt)} bay fit`,
        totalMeasure: `~${estBar} ln ft bar`,
        notes: 'Hot-bent & collared scroll bays',
      });
    } else {
      const area = +(state.width * infillCutFt).toFixed(1);
      sheetSqFt += area;
      rawItems.push({
        category: 'Infill & Pickets',
        part: infillLabel,
        stockProfile: `${panelOpt.specText} (${catalog.name})`,
        qty: `${nSeg} bays`,
        cutLength: `${ftIn(state.width / nSeg)} × ${ftIn(infillCutFt)}`,
        totalMeasure: `${area} sq ft`,
        notes: 'Framed in C-channel / flat retainer bar',
      });
    }

    fittingsCount += postCount;
    rawItems.push({
      category: 'Posts & Anchors',
      part: 'Post Anchor Base Plates',
      stockProfile: plateSpec,
      qty: `${postCount} pcs`,
      cutLength: '6" × 6" (4 holes)',
      totalMeasure: `${(postCount * 0.25).toFixed(1)} sq ft`,
      notes: `Pre-drilled 1/2" Ø concrete anchors (×${postCount * 4})`,
    });
  } else if (state.piece === 'sculpture-base') {
    const faceArea = +(2 * (state.width + state.depth) * state.height).toFixed(1);
    sheetSqFt += faceArea;
    rawItems.push({
      category: 'Structural Frame',
      part: `Plinth Side Panels (${state.style})`,
      stockProfile: isGlass
        ? '1/2" laminated architectural glass'
        : isWood
          ? '2" milled hardwood plank'
          : `10 ga (0.135") ${matLabel} plate`,
      qty: '4 faces + internal ribs',
      cutLength: `${ftIn(state.width)} / ${ftIn(state.depth)} × ${ftIn(state.height)}`,
      totalMeasure: `${faceArea} sq ft`,
      notes: 'Seam-welded & ground smooth corners',
    });

    const internalFrameLn = +((state.height * 4 + (state.width + state.depth) * 4)).toFixed(1);
    linearFeet += internalFrameLn;
    rawItems.push({
      category: 'Structural Frame',
      part: 'Internal Corner Angle / Stiffeners',
      stockProfile: `1-1/2" × 1-1/2" × 3/16" ${matLabel} angle`,
      qty: '8 pcs',
      cutLength: `${ftIn(state.height)} verts / ${ftIn(state.width)} cross`,
      totalMeasure: `${internalFrameLn} ln ft`,
      notes: 'Internal skeleton reinforcement',
    });

    const botArea = +((state.width + 0.5) * (state.depth + 0.5)).toFixed(1);
    const topArea = +((state.width + 0.2) * (state.depth + 0.2)).toFixed(1);
    sheetSqFt += +(botArea + topArea).toFixed(1);
    rawItems.push({
      category: 'Posts & Anchors',
      part: 'Bottom Base Flange Plate',
      stockProfile: plateSpec,
      qty: '1 pc',
      cutLength: `${ftIn(state.width + 0.5)} × ${ftIn(state.depth + 0.5)}`,
      totalMeasure: `${botArea} sq ft`,
      notes: 'Beveled edge + 4 floor anchor holes',
    });
    rawItems.push({
      category: 'Structural Frame',
      part: 'Top Mounting Cap Plate',
      stockProfile: `3/16" (0.188") ${matLabel} plate`,
      qty: '1 pc',
      cutLength: `${ftIn(state.width + 0.2)} × ${ftIn(state.depth + 0.2)}`,
      totalMeasure: `${topArea} sq ft`,
      notes: 'Flush ground sculpture mounting pad',
    });
  } else if (state.piece === 'sign-frame') {
    postCount = 2;
    const postLn = +(2 * state.height).toFixed(1);
    linearFeet += postLn;
    rawItems.push({
      category: 'Posts & Anchors',
      part: 'Monument Support Posts',
      stockProfile: postSpec,
      qty: '2 pcs',
      cutLength: `${ftIn(state.height)} (${fmtDecIn(state.height)})`,
      totalMeasure: `${postLn} ln ft`,
      notes: state.style === 'arch' ? 'Extended cap for arched header' : 'Plumb square posts',
    });

    const signH = +(state.height * 0.62).toFixed(2);
    const perimLn = +(2 * (state.width + signH)).toFixed(1);
    linearFeet += perimLn;
    rawItems.push({
      category: 'Structural Frame',
      part: `Sign Border Frame (${state.style})`,
      stockProfile: railSpec,
      qty: '4 rails (2H + 2V)',
      cutLength: `2 @ ${ftIn(state.width)} · 2 @ ${ftIn(signH)}`,
      totalMeasure: `${perimLn} ln ft`,
      notes: '45° mitered & seam-welded corners',
    });

    const faceArea = +(state.width * signH).toFixed(1);
    sheetSqFt += faceArea;
    rawItems.push({
      category: 'Infill & Pickets',
      part: 'Sign Backing Face Plate',
      stockProfile: isGlass ? '3/8" tempered glass' : `${panelOpt.specText} (${catalog.name})`,
      qty: '1 sheet',
      cutLength: `${ftIn(state.width)} × ${ftIn(signH)}`,
      totalMeasure: `${faceArea} sq ft`,
      notes: 'CNC plasma / laser-cut face plate',
    });

    fittingsCount += 2;
    rawItems.push({
      category: 'Posts & Anchors',
      part: 'Post Anchor Base Plates',
      stockProfile: plateSpec,
      qty: '2 pcs',
      cutLength: '8" × 8" (4 holes)',
      totalMeasure: '0.9 sq ft',
      notes: '8 anchor bolts (1/2" × 4-1/2")',
    });
  } else if (state.piece === 'patio-cover') {
    postCount = state.width > 14 ? 6 : 4;
    const postLn = +(postCount * state.height).toFixed(1);
    linearFeet += postLn;
    rawItems.push({
      category: 'Posts & Anchors',
      part: 'Structural Support Columns',
      stockProfile: postSpec,
      qty: `${postCount} pcs`,
      cutLength: `${ftIn(state.height)} (${fmtDecIn(state.height)})`,
      totalMeasure: `${postLn} ln ft`,
      notes: `${postCount === 6 ? '3 front / 3 rear' : '2 front / 2 rear'} columns`,
    });

    const beamLn = +(2 * state.width + 2 * state.depth).toFixed(1);
    linearFeet += beamLn;
    rawItems.push({
      category: 'Structural Frame',
      part: 'Perimeter Header & Side Beams',
      stockProfile: `6" × 2" × 3/16" rect HSS ${matLabel}`,
      qty: '4 beams',
      cutLength: `2 @ ${ftIn(state.width)} · 2 @ ${ftIn(state.depth)}`,
      totalMeasure: `${beamLn} ln ft`,
      notes: 'Structural welded beam frame',
    });

    if (state.style === 'slats') {
      const slatCount = Math.max(4, Math.round(state.width / 1.4));
      const slatLen = +(state.depth + 0.8).toFixed(2);
      const slatLn = +(slatCount * slatLen).toFixed(1);
      linearFeet += slatLn;
      rawItems.push({
        category: 'Infill & Pickets',
        part: 'Overhead Shade Rafters / Slats',
        stockProfile: `2" × 3" × 11 ga ${matLabel} tube`,
        qty: `${slatCount} pcs`,
        cutLength: `${ftIn(slatLen)} (${fmtDecIn(slatLen)})`,
        totalMeasure: `${slatLn} ln ft`,
        notes: 'Overhang rafters welded to headers',
      });
    } else {
      const roofArea = +((state.width + 0.8) * (state.depth + 0.8)).toFixed(1);
      sheetSqFt += roofArea;
      rawItems.push({
        category: 'Infill & Pickets',
        part: 'Solid Roof Deck Panels',
        stockProfile: `14 ga ${matLabel} corrugated / standing-seam deck`,
        qty: '1 roof assembly',
        cutLength: `${ftIn(state.width + 0.8)} × ${ftIn(state.depth + 0.8)}`,
        totalMeasure: `${roofArea} sq ft`,
        notes: 'Includes purlins & weather flashing',
      });
    }

    fittingsCount += postCount;
    rawItems.push({
      category: 'Posts & Anchors',
      part: 'Column Base Plates',
      stockProfile: `3/8" (0.375") A36 heavy anchor plate`,
      qty: `${postCount} pcs`,
      cutLength: '8" × 8" (4 holes)',
      totalMeasure: `${(postCount * 0.44).toFixed(1)} sq ft`,
      notes: `Footing anchors (×${postCount * 4})`,
    });
  } else {
    // Gate
    postCount = 2;
    const leafW = leavesCount === 2 ? Math.max(1, state.width / 2 - 0.15) : state.width;
    const postLn = +(2 * state.height).toFixed(1);
    linearFeet += postLn;
    rawItems.push({
      category: 'Posts & Anchors',
      part: 'Hinge & Strike Posts',
      stockProfile: postSpec,
      qty: '2 pcs',
      cutLength: `${ftIn(state.height)} (${fmtDecIn(state.height)})`,
      totalMeasure: `${postLn} ln ft`,
      notes: 'Add +24" embedment if wet-set in concrete footing',
    });

    const railsQty = leavesCount * 2;
    const stilesQty = leavesCount * 2;
    const railsLn = +(railsQty * leafW).toFixed(1);
    const stilesLn = +(stilesQty * state.height).toFixed(1);
    linearFeet += +(railsLn + stilesLn).toFixed(1);

    rawItems.push({
      category: 'Structural Frame',
      part: 'Top & Bottom Gate Rails',
      stockProfile: railSpec,
      qty: `${railsQty} pcs`,
      cutLength: `${ftIn(leafW)} (${fmtDecIn(leafW)})`,
      totalMeasure: `${railsLn} ln ft`,
      notes: leavesCount === 2 ? 'Double-leaf mitered rails' : '45° mitered rail cuts',
    });
    rawItems.push({
      category: 'Structural Frame',
      part: 'Vertical Hinge & Lock Stiles',
      stockProfile: railSpec,
      qty: `${stilesQty} pcs`,
      cutLength: `${ftIn(state.height)} (${fmtDecIn(state.height)})`,
      totalMeasure: `${stilesLn} ln ft`,
      notes: 'Reinforced hinge-barrel & lock-box stiles',
    });

    const infillCutFt = Math.max(1, state.height - 0.5);
    if (state.style === 'vertical' && state.infillPattern === 'vertical-pickets') {
      const pLn = +(picketStats.totalPickets * infillCutFt).toFixed(1);
      linearFeet += pLn;
      rawItems.push({
        category: 'Infill & Pickets',
        part: `Pickets (${picketStyleLabel})`,
        stockProfile: `${effectivePicketLabel} (${effectivePicketIn}" nominal)`,
        qty: `${picketStats.totalPickets} pcs (${picketStats.perLeafPickets}/leaf)`,
        cutLength: `${ftIn(infillCutFt)} (${fmtDecIn(infillCutFt)})`,
        totalMeasure: `${pLn} ln ft`,
        notes: `${state.picketSpacing}" O.C. spacing`,
      });
    } else if (state.style === 'horizontal' || state.infillPattern === 'horizontal-bars') {
      const barsPerLeaf = Math.max(3, Math.round(state.height * 1.5));
      const totalBars = barsPerLeaf * leavesCount;
      const barLn = +(totalBars * leafW).toFixed(1);
      linearFeet += barLn;
      rawItems.push({
        category: 'Infill & Pickets',
        part: 'Horizontal Infill Bars',
        stockProfile: railSpec,
        qty: `${totalBars} pcs`,
        cutLength: `${ftIn(leafW)} (${fmtDecIn(leafW)})`,
        totalMeasure: `${barLn} ln ft`,
        notes: `${barsPerLeaf} horizontal rows per leaf`,
      });
    } else if (state.style === 'solid' || state.infillPattern === 'solid-panel') {
      const area = +(leavesCount * leafW * infillCutFt).toFixed(1);
      sheetSqFt += area;
      rawItems.push({
        category: 'Infill & Pickets',
        part: 'Solid Sheet / Plate Panels',
        stockProfile: isGlass ? '3/8" tempered architectural glass' : `${panelOpt.specText} (${catalog.name})`,
        qty: `${leavesCount} panel${leavesCount > 1 ? 's' : ''}`,
        cutLength: `${ftIn(leafW)} × ${ftIn(infillCutFt)}`,
        totalMeasure: `${area} sq ft`,
        notes: 'Seal-welded or recessed bead stop',
      });
    } else if (state.style === 'scroll' || state.infillPattern === 'scroll-panel') {
      const nS = Math.max(1, Math.round(state.width / 2.2));
      const estBar = +(nS * infillCutFt * 2.1).toFixed(1);
      linearFeet += estBar;
      rawItems.push({
        category: 'Infill & Pickets',
        part: `Forged Scrollwork (${scrollLabel})`,
        stockProfile: `${effectivePicketLabel} forged bar stock`,
        qty: `${nS} scroll bays`,
        cutLength: `${ftIn(leafW)} × ${ftIn(infillCutFt)}`,
        totalMeasure: `~${estBar} ln ft bar`,
        notes: 'Hot-forged & collared scroll assemblies',
      });
    } else {
      const area = +(leavesCount * leafW * infillCutFt).toFixed(1);
      sheetSqFt += area;
      rawItems.push({
        category: 'Infill & Pickets',
        part: infillLabel,
        stockProfile: `${panelOpt.specText} (${catalog.name})`,
        qty: `${leavesCount} infill panel${leavesCount > 1 ? 's' : ''}`,
        cutLength: `${ftIn(leafW)} × ${ftIn(infillCutFt)}`,
        totalMeasure: `${area} sq ft`,
        notes: 'Perimeter retainer angle / U-channel mount',
      });
    }

    fittingsCount += 2;
    rawItems.push({
      category: 'Posts & Anchors',
      part: 'Post Anchor Flanges',
      stockProfile: plateSpec,
      qty: '2 pcs',
      cutLength: '6" × 6" (4 holes)',
      totalMeasure: '0.5 sq ft',
      notes: 'For surface-mounted posts (omit if wet-set)',
    });

    fittingsCount += leavesCount * 2 + 1;
    rawItems.push({
      category: 'Hardware & Signage',
      part: 'Weld-On Hinges & Gate Latch',
      stockProfile: 'Heavy-duty greaseable barrel hinges + lockbox latch',
      qty: `${leavesCount * 2} hinges + 1 latch`,
      cutLength: '5" barrel / weld-on box',
      totalMeasure: `${leavesCount * 2 + 1} hardware pcs`,
      notes: leavesCount === 2 ? 'Includes center cane drop-rod bolt' : 'Self-closing / padlockable latch',
    });
  }

  // Post Caps / Finials
  if (state.finial !== 'none' && postCount > 0) {
    fittingsCount += postCount;
    rawItems.push({
      category: 'Caps, Leaves & Ornamental',
      part: 'Post Caps / Finials',
      stockProfile: formatFinialLabel(state.finial),
      qty: `${postCount} pcs`,
      cutLength: `Sized to ${postLabel}`,
      totalMeasure: `${postCount} caps`,
      notes: 'Tack-welded / silicone-sealed post tops',
    });
  }

  // Multi-Select Leaf Catalog Items (King & IMS)
  const selectedLeafItems = (state.selectedLeaves || [])
    .map((id) => LEAF_CATALOG.find((l) => l.id === id))
    .filter(Boolean);
  if (selectedLeafItems.length > 0) {
    fittingsCount += selectedLeafItems.length * 2;
    rawItems.push({
      category: 'Caps, Leaves & Ornamental',
      part: 'Forged & Stamped Leaves (King / IMS)',
      stockProfile: selectedLeafItems.map((l) => l!.label).join(' · '),
      qty: `${selectedLeafItems.length} styles (min 2 ea)`,
      cutLength: '4-1/2" to 8-1/2" H',
      totalMeasure: `${selectedLeafItems.length * 2} pcs`,
      notes: `${Array.from(new Set(selectedLeafItems.map((l) => l!.catalog))).join(' & ')}`,
    });
  }

  // Placed Picket Accents
  if (picketStats.totalAccents > 0) {
    const accDesc: string[] = [];
    if (picketStats.accentCounts.knuckle) accDesc.push(`Knuckles ×${picketStats.accentCounts.knuckle}`);
    if (picketStats.accentCounts.emblem) accDesc.push(`Emblems ×${picketStats.accentCounts.emblem}`);
    if (picketStats.accentCounts.leaf) accDesc.push(`Leaves ×${picketStats.accentCounts.leaf}`);
    fittingsCount += picketStats.totalAccents;
    rawItems.push({
      category: 'Caps, Leaves & Ornamental',
      part: 'Picket Accents (Individually Placed)',
      stockProfile: accDesc.join(', '),
      qty: `${picketStats.totalAccents} pcs`,
      cutLength: 'Shop-collared on pickets',
      totalMeasure: `${picketStats.totalAccents} pcs`,
      notes: 'Custom picket positions per schematic',
    });
  }

  // Decorative Checkboxes
  const activeDecor = DECOR_ITEMS.filter((d) => state.decor[d.key]).map((d) => d.label);
  if (activeDecor.length > 0) {
    fittingsCount += activeDecor.length * 2;
    rawItems.push({
      category: 'Caps, Leaves & Ornamental',
      part: 'Ornamental Forgings & Scroll Extras',
      stockProfile: activeDecor.join(', '),
      qty: `${activeDecor.length} types`,
      cutLength: 'Shop-bent / weld-on fit',
      totalMeasure: `${activeDecor.length} sets`,
      notes: 'Distributed symmetrically per elevation',
    });
  }

  // Mounted Sign Plaque (on non-sign-frame pieces)
  if (state.showSign && state.piece !== 'sign-frame') {
    const sw = Math.min(state.width * 0.58, 5.2);
    const sh = Math.min(state.height * 0.34, 2.2);
    const area = +(sw * sh).toFixed(1);
    sheetSqFt += area;
    rawItems.push({
      category: 'Hardware & Signage',
      part: 'Mounted Sign Plaque & Lettering',
      stockProfile:
        state.signLetteringMode === 'hand-drawn'
          ? `12 ga plate + Hand-drawn cut (${state.signStrokes.length} strokes)`
          : `12 ga plate + CNC "${state.signText.trim() || 'SIGN'}"`,
      qty: '1 plaque + standoffs',
      cutLength: `${ftIn(sw)} × ${ftIn(sh)}`,
      totalMeasure: `${area} sq ft`,
      notes: '4 standoff tabs welded to infill/frame',
    });
  }

  // Uploaded Sample Art
  if (state.sampleArt) {
    rawItems.push({
      category: 'Hardware & Signage',
      part: 'Custom Sample Art / Relief Cut',
      stockProfile: state.sampleArt.fileName,
      qty: '1 custom cut',
      cutLength: 'Scaled to center bay',
      totalMeasure: '1 assembly',
      notes: state.sampleArt.needsConversion ? 'Manual shop conversion' : 'CNC plasma / laser vector',
    });
  }

  // Surface Finish & Welding / Prep Consumables (always needed for project)
  rawItems.push({
    category: 'Finish & Shop Prep',
    part: 'Welding Wire, Flap Discs & Zinc Primer',
    stockProfile: isAlum
      ? 'ER4043 spool + aluminum oxide prep + etching primer'
      : 'ER70S-6 0.035" wire + 60/120 grit flap discs + epoxy primer',
    qty: '1 shop kit',
    cutLength: 'Full assembly welds',
    totalMeasure: 'Included',
    notes: 'Blend structural welds & degrease prior to finish',
  });
  rawItems.push({
    category: 'Finish & Shop Prep',
    part: 'Protective Topcoat / Finish System',
    stockProfile: finishSpec,
    qty: '1 finish coat',
    cutLength: `${sheetSqFt > 0 ? `${sheetSqFt.toFixed(1)} sq ft + ` : ''}${linearFeet.toFixed(1)} ln ft`,
    totalMeasure: '100% coverage',
    notes: 'Shop cured / architectural exterior grade',
  });

  const items: DetailedCutItem[] = rawItems.map((row, idx) => ({
    tag: makeCalloutTag(idx),
    ...row,
  }));

  const roundedLinear = +linearFeet.toFixed(1);
  return {
    items,
    finishSpec,
    supplierName: catalog.name,
    totals: {
      lineItems: items.length,
      linearFeet: roundedLinear,
      estimated20FtSticks: Math.max(1, Math.ceil(roundedLinear / 20)),
      sheetSqFt: +sheetSqFt.toFixed(1),
      fittingsCount,
    },
  };
}

/**
 * Dedicated Material Cut List & Assembly Schematic Canvas
 * Displays an exploded callout-tagged schematic (A, B, C...) alongside
 * the itemized build cut list and mill-stock ordering totals.
 */
export function drawMaterialCutListSchematic(
  canvas: HTMLCanvasElement,
  state: ConfiguratorState,
): void {
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const summary = buildDetailedCutList(state);
  const { items, finishSpec, supplierName, totals } = summary;
  const picketStats = getPicketLayoutStats(state);
  const fw = Math.max(0.5, state.width);
  const fh = Math.max(0.5, state.height);

  // Blueprint Background Grid
  ctx.fillStyle = '#0d213f';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < W; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let gy = 40; gy < H; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.48)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // Title Block
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "700 20px Oswald, 'Arial Narrow', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('MATERIAL CUT LIST & ASSEMBLY SCHEMATIC', 30, 44);
  ctx.fillStyle = '#E8A317';
  ctx.font = "600 13px 'Source Sans 3', sans-serif";
  ctx.fillText(`${labelFor(state)} · ${dimsLine(state)} · ${finishSpec}`, 30, 65);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#7dd3fc';
  ctx.font = "700 12px 'Source Sans 3', sans-serif";
  ctx.fillText(
    `Supplier: ${supplierName} · ${totals.linearFeet} ln ft (~${totals.estimated20FtSticks} × 20' sticks)`,
    W - 28,
    44,
  );
  ctx.fillStyle = '#cbd5e1';
  ctx.font = "12px 'Source Sans 3', sans-serif";
  ctx.fillText(
    `Sheet/Plate: ${totals.sheetSqFt} sq ft · Fittings/Hardware: ${totals.fittingsCount} pcs`,
    W - 28,
    65,
  );
  ctx.textAlign = 'left';

  // Left Panel: Exploded Fabrication Assembly Schematic
  const sx = 28;
  const sy = 86;
  const sw = 588;
  const sh = 610;
  ctx.fillStyle = 'rgba(8, 19, 38, 0.72)';
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.2;
  ctx.fillRect(sx, sy, sw, sh);
  ctx.strokeRect(sx, sy, sw, sh);

  ctx.fillStyle = '#E8A317';
  ctx.font = "700 12px Oswald, 'Arial Narrow', sans-serif";
  ctx.fillText('EXPLODED BUILD SCHEMATIC (CALLOUT TAGS MATCH CUT TABLE)', sx + 14, sy + 20);

  // Helper: Draw Balloon Callout Tag with Leader Line
  const drawCallout = (
    bx: number,
    by: number,
    tx: number,
    ty: number,
    tag: string,
    subLabel?: string,
  ) => {
    ctx.save();
    ctx.strokeStyle = '#E8A317';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    // Target dot
    ctx.fillStyle = '#E8A317';
    ctx.beginPath();
    ctx.arc(tx, ty, 3, 0, Math.PI * 2);
    ctx.fill();

    // Callout balloon circle
    ctx.fillStyle = '#E8A317';
    ctx.strokeStyle = '#0d213f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(bx, by, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#101012';
    ctx.font = "700 11px 'Source Sans 3', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, bx, by + 0.5);

    if (subLabel) {
      ctx.fillStyle = '#fef3c7';
      ctx.font = "600 10px 'Source Sans 3', sans-serif";
      ctx.textAlign = bx < tx ? 'right' : 'left';
      const offsetX = bx < tx ? bx - 15 : bx + 15;
      ctx.fillText(subLabel, offsetX, by + 0.5);
    }
    ctx.restore();
  };

  // Scale schematic inside Left Panel
  const drawBayLeft = sx + 88;
  const drawBayRight = sx + sw - 88;
  const drawGroundY = sy + sh - 78;
  const drawBayTop = sy + 95;
  const scale = Math.max(
    6,
    Math.min(
      (drawBayRight - drawBayLeft) / Math.max(fw, 1),
      (drawGroundY - drawBayTop) / Math.max(fh * 1.18, 1),
    ),
  );
  const pw = fw * scale;
  const ph = fh * scale;
  const x0 = (drawBayLeft + drawBayRight - pw) / 2;
  const y0 = drawGroundY - ph;

  // Ground Reference Line
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(sx + 26, drawGroundY);
  ctx.lineTo(sx + sw - 26, drawGroundY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Locate item tags by keyword so balloons always match itemized table
  const findTag = (matchFn: (i: DetailedCutItem) => boolean): string | null => {
    const found = items.find(matchFn);
    return found ? found.tag : null;
  };
  const tagPost = findTag((i) => i.category === 'Posts & Anchors' && !i.part.includes('Base') && !i.part.includes('Flange'));
  const tagFlange = findTag((i) => i.part.includes('Base Plate') || i.part.includes('Flange'));
  const tagRail = findTag((i) => i.part.includes('Rail') || i.part.includes('Beam') || i.part.includes('Border') || i.part.includes('Plinth'));
  const tagStile = findTag((i) => i.part.includes('Stile') || i.part.includes('Corner Angle'));
  const tagInfill = findTag((i) => i.category === 'Infill & Pickets');
  const tagCap = findTag((i) => i.part.includes('Post Caps'));
  const tagLeaves = findTag((i) => i.part.includes('Leaves') || i.part.includes('Ornamental') || i.part.includes('Accents'));
  const tagHardware = findTag((i) => i.part.includes('Hinges') || i.part.includes('Sign'));

  // Draw schematic geometry per piece type (with crisp exploded gaps where helpful)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.1;

  if (state.piece === 'patio-cover') {
    const nPosts = fw > 14 ? 3 : 2;
    const beamH = 16;
    ctx.strokeRect(x0 - 12, y0 - 10, pw + 24, beamH);
    for (let i = 0; i < nPosts; i++) {
      const px = x0 + (i * (pw - 12)) / Math.max(1, nPosts - 1);
      ctx.strokeRect(px, y0 + 12, 12, ph - 16);
      ctx.strokeRect(px - 6, drawGroundY - 6, 24, 6);
    }
    if (state.style === 'slats') {
      const nSlats = Math.max(4, Math.min(12, Math.round(fw / 1.5)));
      for (let s = 0; s < nSlats; s++) {
        const rx2 = x0 + ((s + 0.5) * pw) / nSlats;
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(rx2, y0 - 22);
        ctx.lineTo(rx2, y0 - 10);
        ctx.stroke();
      }
    }
    if (tagPost) drawCallout(sx + 48, y0 + ph * 0.55, x0 + 6, y0 + ph * 0.55, tagPost, 'Posts');
    if (tagRail) drawCallout(x0 + pw * 0.5, y0 - 38, x0 + pw * 0.5, y0 - 10, tagRail, 'Beams');
    if (tagInfill) drawCallout(sx + sw - 52, y0 - 18, x0 + pw - 16, y0 - 14, tagInfill, state.style === 'slats' ? 'Slats' : 'Deck');
    if (tagFlange) drawCallout(sx + 54, drawGroundY - 6, x0 + 2, drawGroundY - 3, tagFlange, 'Plates');
  } else if (state.piece === 'sculpture-base') {
    ctx.strokeRect(x0 - 14, drawGroundY - 12, pw + 28, 12);
    ctx.strokeRect(x0, y0 + 16, pw, ph - 32);
    ctx.strokeRect(x0 - 8, y0 - 6, pw + 16, 12);
    if (tagRail) drawCallout(sx + 52, y0 + ph * 0.45, x0 + 4, y0 + ph * 0.45, tagRail, 'Shell');
    if (tagStile) drawCallout(sx + sw - 56, y0 + ph * 0.65, x0 + pw - 8, y0 + ph * 0.65, tagStile, 'Ribs');
    if (tagFlange) drawCallout(sx + 52, drawGroundY - 8, x0 - 10, drawGroundY - 6, tagFlange, 'Base');
  } else if (state.piece === 'sign-frame') {
    ctx.strokeRect(x0 - 22, y0, 12, ph);
    ctx.strokeRect(x0 + pw + 10, y0, 12, ph);
    ctx.strokeRect(x0 - 28, drawGroundY - 7, 24, 7);
    ctx.strokeRect(x0 + pw + 4, drawGroundY - 7, 24, 7);
    const panelH = ph * 0.62;
    const panelY = y0 + ph * 0.2;
    ctx.strokeRect(x0, panelY, pw, panelH);
    drawSignPanelContent2D(ctx, state, x0, panelY, pw, panelH, false);
    if (tagPost) drawCallout(sx + 48, y0 + ph * 0.35, x0 - 16, y0 + ph * 0.35, tagPost, 'Posts');
    if (tagRail) drawCallout(x0 + pw * 0.5, panelY - 26, x0 + pw * 0.5, panelY, tagRail, 'Frame');
    if (tagInfill) drawCallout(sx + sw - 54, panelY + panelH * 0.5, x0 + pw - 10, panelY + panelH * 0.5, tagInfill, 'Plate');
    if (tagFlange) drawCallout(sx + 50, drawGroundY - 6, x0 - 22, drawGroundY - 4, tagFlange, 'Plates');
  } else if (state.piece === 'railing') {
    const nSeg = Math.max(1, Math.round(fw / state.postSpacing));
    const step = pw / nSeg;
    for (let i = 0; i <= nSeg; i++) {
      const px = x0 + i * step;
      ctx.strokeRect(px - 5, y0, 10, ph);
      ctx.strokeRect(px - 10, drawGroundY - 6, 20, 6);
    }
    ctx.strokeRect(x0 + 5, y0 + 2, pw - 10, 9);
    ctx.strokeRect(x0 + 5, drawGroundY - 18, pw - 10, 9);
    const innerTop = y0 + 14;
    const innerH = Math.max(20, drawGroundY - 22 - innerTop);
    if (picketStats.supportsPickets) {
      const count = Math.min(48, picketStats.totalPickets);
      for (let p = 0; p < count; p++) {
        const px = x0 + 8 + ((p + 0.5) * (pw - 16)) / count;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(px, innerTop);
        ctx.lineTo(px, innerTop + innerH);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = '#7dd3fc';
      ctx.strokeRect(x0 + 10, innerTop, pw - 20, innerH);
    }
    if (tagPost) drawCallout(sx + 46, y0 + ph * 0.45, x0 - 2, y0 + ph * 0.45, tagPost, 'Posts');
    if (tagRail) drawCallout(x0 + pw * 0.35, y0 - 28, x0 + pw * 0.35, y0 + 6, tagRail, 'Rails');
    if (tagInfill) drawCallout(sx + sw - 52, innerTop + innerH * 0.5, x0 + pw * 0.72, innerTop + innerH * 0.5, tagInfill, 'Infill');
    if (tagFlange) drawCallout(sx + 48, drawGroundY - 5, x0 - 6, drawGroundY - 3, tagFlange, 'Flanges');
  } else {
    // Gate (exploded hinge & strike posts + inner gate frame rails/stiles + infill)
    ctx.strokeRect(x0 - 24, y0, 12, ph);
    ctx.strokeRect(x0 + pw + 12, y0, 12, ph);
    ctx.strokeRect(x0 - 30, drawGroundY - 6, 24, 6);
    ctx.strokeRect(x0 + pw + 6, drawGroundY - 6, 24, 6);

    const frameX = x0;
    const frameW = pw;
    const frameTop = y0 + 6;
    const frameH = ph - 12;
    ctx.strokeRect(frameX, frameTop, frameW, 10);
    ctx.strokeRect(frameX, frameTop + frameH - 10, frameW, 10);
    ctx.strokeRect(frameX, frameTop, 10, frameH);
    ctx.strokeRect(frameX + frameW - 10, frameTop, 10, frameH);

    const innerTop = frameTop + 12;
    const innerH = Math.max(20, frameH - 24);
    if (picketStats.supportsPickets) {
      const count = Math.min(44, picketStats.totalPickets);
      for (let p = 0; p < count; p++) {
        const px = frameX + 12 + ((p + 0.5) * (frameW - 24)) / count;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(px, innerTop);
        ctx.lineTo(px, innerTop + innerH);
        ctx.stroke();
      }
      if (state.leaves === 'double') {
        ctx.strokeStyle = '#E8A317';
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(frameX + frameW / 2, frameTop);
        ctx.lineTo(frameX + frameW / 2, frameTop + frameH);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else {
      ctx.strokeStyle = '#7dd3fc';
      ctx.strokeRect(frameX + 12, innerTop, frameW - 24, innerH);
    }

    if (tagPost) drawCallout(sx + 46, y0 + ph * 0.35, x0 - 18, y0 + ph * 0.35, tagPost, 'Posts');
    if (tagRail) drawCallout(frameX + frameW * 0.48, frameTop - 26, frameX + frameW * 0.48, frameTop + 4, tagRail, 'Rails');
    if (tagStile) drawCallout(sx + sw - 54, frameTop + frameH * 0.28, frameX + frameW - 4, frameTop + frameH * 0.28, tagStile, 'Stiles');
    if (tagInfill) drawCallout(sx + sw - 54, innerTop + innerH * 0.62, frameX + frameW * 0.68, innerTop + innerH * 0.62, tagInfill, 'Infill');
    if (tagFlange) drawCallout(sx + 48, drawGroundY - 5, x0 - 24, drawGroundY - 3, tagFlange, 'Flanges');
    if (tagHardware) drawCallout(sx + 48, y0 + ph * 0.72, x0 - 10, y0 + ph * 0.72, tagHardware, 'Hardware');
  }

  // Post Cap / Finial Visual & Callout on Left Post
  if (state.finial !== 'none' && tagCap) {
    const capX = state.piece === 'gate' || state.piece === 'sign-frame' ? x0 - 18 : x0;
    ctx.save();
    ctx.strokeStyle = '#E8A317';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(capX - 7, y0 - 2);
    ctx.lineTo(capX, y0 - 14);
    ctx.lineTo(capX + 7, y0 - 2);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    drawCallout(sx + 48, y0 - 24, capX - 2, y0 - 8, tagCap, 'Caps');
  }

  // Leaves / Accents Callout
  if (tagLeaves) {
    drawCallout(sx + sw - 54, y0 + 12, x0 + pw * 0.62, y0 + ph * 0.38, tagLeaves, 'Leaves');
  }

  // Schematic Dimension Footer Lines
  ctx.fillStyle = '#E8A317';
  ctx.font = "700 12px 'Source Sans 3', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText(
    `Overall Cut Envelope: ${ftIn(fw)} (${fmtDecIn(fw)}) W × ${ftIn(fh)} (${fmtDecIn(fh)}) H`,
    sx + sw / 2,
    drawGroundY + 26,
  );
  ctx.fillStyle = '#93c5fd';
  ctx.font = "600 11px 'Source Sans 3', sans-serif";
  ctx.fillText(
    `Total Linear Stock: ${totals.linearFeet} ln ft (~${totals.estimated20FtSticks} × 20' lengths) · Plate/Sheet: ${totals.sheetSqFt} sq ft`,
    sx + sw / 2,
    drawGroundY + 46,
  );

  // Right Panel: Itemized Material Cut Schedule Table on Blueprint Sheet
  const tx = 630;
  const ty = 86;
  const tw = 442;
  const th = 610;
  ctx.fillStyle = 'rgba(8, 19, 38, 0.9)';
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.2;
  ctx.fillRect(tx, ty, tw, th);
  ctx.strokeRect(tx, ty, tw, th);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#E8A317';
  ctx.font = "700 12.5px Oswald, 'Arial Narrow', sans-serif";
  ctx.fillText(`ITEMIZED BUILD CUT LIST (${items.length} LINE ITEMS)`, tx + 14, ty + 22);

  // Table Column Header
  let rowY = ty + 44;
  ctx.fillStyle = 'rgba(232,163,23,0.16)';
  ctx.fillRect(tx + 10, rowY - 13, tw - 20, 18);
  ctx.fillStyle = '#E8A317';
  ctx.font = "700 10px 'Source Sans 3', sans-serif";
  ctx.fillText('TAG', tx + 14, rowY);
  ctx.fillText('COMPONENT / STOCK', tx + 44, rowY);
  ctx.fillText('QTY', tx + 245, rowY);
  ctx.fillText('CUT LENGTH', tx + 312, rowY);
  ctx.fillText('TOTAL', tx + 394, rowY);
  rowY += 18;

  const maxRowY = ty + th - 66;
  items.forEach((item, idx) => {
    if (rowY > maxRowY) return;
    if (idx % 2 === 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.035)';
      ctx.fillRect(tx + 10, rowY - 11, tw - 20, 32);
    }

    // Callout Tag Chip
    ctx.fillStyle = '#E8A317';
    ctx.beginPath();
    ctx.arc(tx + 24, rowY + 3, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#101012';
    ctx.font = "700 10px 'Source Sans 3', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(item.tag, tx + 24, rowY + 6.5);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#FFFFFF';
    ctx.font = "700 10.5px 'Source Sans 3', sans-serif";
    ctx.fillText(item.part.slice(0, 30), tx + 42, rowY);

    ctx.fillStyle = '#fef3c7';
    ctx.font = "600 10px 'Source Sans 3', sans-serif";
    ctx.fillText(item.qty.slice(0, 12), tx + 245, rowY);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(item.cutLength.slice(0, 15), tx + 312, rowY);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText(item.totalMeasure.slice(0, 10), tx + 394, rowY);

    rowY += 13;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = "10px 'Source Sans 3', sans-serif";
    ctx.fillText(item.stockProfile.slice(0, 62), tx + 42, rowY);
    rowY += 20;
  });

  // Bottom Stock Order Bar
  ctx.strokeStyle = 'rgba(232,163,23,0.45)';
  ctx.beginPath();
  ctx.moveTo(tx + 12, ty + th - 52);
  ctx.lineTo(tx + tw - 12, ty + th - 52);
  ctx.stroke();

  ctx.fillStyle = '#E8A317';
  ctx.font = "700 11px Oswald, 'Arial Narrow', sans-serif";
  ctx.fillText('MILL STOCK & ORDERING SUMMARY', tx + 14, ty + th - 34);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "600 10.5px 'Source Sans 3', sans-serif";
  ctx.fillText(
    `Linear: ${totals.linearFeet} ln ft (~${totals.estimated20FtSticks} × 20' sticks) · Sheet/Plate: ${totals.sheetSqFt} sq ft · Hardware/Accents: ${totals.fittingsCount} pcs`,
    tx + 14,
    ty + th - 16,
  );

  drawFreeStrokesOverlay(ctx, state.freeDrawStrokes2D, W, H);

  ctx.fillStyle = '#a8c4e0';
  ctx.font = "12px 'Source Sans 3', sans-serif";
  ctx.fillText(
    "Ray's Ironworks · Material Cut List & Fabrication Schematic · Shop Ordering Reference",
    30,
    H - 22,
  );
}


