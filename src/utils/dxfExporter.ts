import {
  ConfiguratorState,
  LEAF_CATALOG,
  getActiveSupplierSpecs,
  getEffectivePicketInches,
} from '../types/configurator';

/**
 * Generates an AutoCAD R12 (AC1009) ASCII DXF in real inches on a `CUT` layer
 * representing the front elevation / flat cut profile of the configured piece,
 * including infill patterns, scrollwork variants, picket styles/sizes, King caps,
 * King/IMS leaf selections, distributor stock sizes, and Sign Frame details.
 */
export function generateCutDxf(state: ConfiguratorState): {
  content: string;
  entityCount: number;
  widthIn: number;
  heightIn: number;
} {
  const lines: string[] = [];
  let entityCount = 0;

  const pushPair = (code: number, value: string | number) => {
    lines.push(String(code), String(value));
  };

  const wIn = +(state.width * 12).toFixed(3);
  const hIn = +(state.height * 12).toFixed(3);
  const { barOpt } = getActiveSupplierSpecs(state);
  const picketThickIn = Math.max(0.375, Math.min(3.5, getEffectivePicketInches(state) || 0.75));
  const barThickIn = Math.max(0.5, Math.min(3.5, barOpt.inches || 1.25));

  const addLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    layer = 'CUT',
  ) => {
    entityCount += 1;
    pushPair(0, 'LINE');
    pushPair(8, layer);
    pushPair(10, x1.toFixed(4));
    pushPair(20, y1.toFixed(4));
    pushPair(30, 0);
    pushPair(11, x2.toFixed(4));
    pushPair(21, y2.toFixed(4));
    pushPair(31, 0);
  };

  const addRect = (x: number, y: number, w: number, h: number, layer = 'CUT') => {
    addLine(x, y, x + w, y, layer);
    addLine(x + w, y, x + w, y + h, layer);
    addLine(x + w, y + h, x, y + h, layer);
    addLine(x, y + h, x, y, layer);
  };

  const addCircle = (cx: number, cy: number, r: number, layer = 'CUT') => {
    entityCount += 1;
    pushPair(0, 'CIRCLE');
    pushPair(8, layer);
    pushPair(10, cx.toFixed(4));
    pushPair(20, cy.toFixed(4));
    pushPair(30, 0);
    pushPair(40, r.toFixed(4));
  };

  const addArc = (
    cx: number,
    cy: number,
    r: number,
    startDeg: number,
    endDeg: number,
    layer = 'CUT',
  ) => {
    entityCount += 1;
    pushPair(0, 'ARC');
    pushPair(8, layer);
    pushPair(10, cx.toFixed(4));
    pushPair(20, cy.toFixed(4));
    pushPair(30, 0);
    pushPair(40, r.toFixed(4));
    pushPair(50, startDeg.toFixed(2));
    pushPair(51, endDeg.toFixed(2));
  };

  const addText = (
    x: number,
    y: number,
    heightInText: number,
    text: string,
    layer = 'CUT',
  ) => {
    if (!text.trim()) return;
    entityCount += 1;
    pushPair(0, 'TEXT');
    pushPair(8, layer);
    pushPair(10, x.toFixed(4));
    pushPair(20, y.toFixed(4));
    pushPair(30, 0);
    pushPair(40, heightInText.toFixed(3));
    pushPair(1, text.replace(/\r?\n/g, ' '));
    pushPair(72, 1);
    pushPair(11, x.toFixed(4));
    pushPair(21, y.toFixed(4));
    pushPair(31, 0);
  };

  const addFinial = (cx: number, topY: number) => {
    if (state.finial === 'none') return;
    if (state.finial === 'ball') {
      addRect(cx - 1.0, topY, 2.0, 2.5);
      addCircle(cx, topY + 4.75, 2.25);
    } else if (state.finial === 'spear') {
      addRect(cx - 1.0, topY, 2.0, 2.2);
      addLine(cx - 1.8, topY + 2.2, cx, topY + 8.5);
      addLine(cx, topY + 8.5, cx + 1.8, topY + 2.2);
      addLine(cx + 1.8, topY + 2.2, cx - 1.8, topY + 2.2);
    } else if (state.finial === 'scroll') {
      addArc(cx, topY + 2.4, 2.1, -30, 240);
    } else if (state.finial === 'flat-cap') {
      addRect(cx - 2.2, topY, 4.4, 1.1);
    } else if (state.finial === 'pyramid-cap' || state.finial === 'pinnacle-cap') {
      const capH = state.finial === 'pinnacle-cap' ? 6.5 : 3.2;
      addRect(cx - 2.1, topY, 4.2, 0.8);
      addLine(cx - 2.1, topY + 0.8, cx, topY + 0.8 + capH);
      addLine(cx, topY + 0.8 + capH, cx + 2.1, topY + 0.8);
    } else if (state.finial === 'squared-dome-cap') {
      addRect(cx - 2.1, topY, 4.2, 0.8);
      addArc(cx, topY + 0.8, 1.9, 0, 180);
    } else if (state.finial === 'ball-collar-cap') {
      addRect(cx - 2.0, topY, 4.0, 1.2);
      addCircle(cx, topY + 3.4, 2.0);
    } else if (state.finial === 'acorn-cap' || state.finial === 'pineapple-cap' || state.finial === 'urn-cap') {
      addRect(cx - 2.0, topY, 4.0, 1.0);
      addCircle(cx, topY + 3.6, 2.1);
      addLine(cx - 0.8, topY + 5.7, cx, topY + 7.2);
      addLine(cx, topY + 7.2, cx + 0.8, topY + 5.7);
    } else if (state.finial === 'pagoda-cap') {
      addRect(cx - 2.1, topY, 4.2, 0.8);
      addLine(cx - 2.4, topY + 0.8, cx + 2.4, topY + 0.8);
      addLine(cx - 2.4, topY + 0.8, cx, topY + 4.8);
      addLine(cx, topY + 4.8, cx + 2.4, topY + 0.8);
    } else if (state.finial === 'colonial-cap') {
      addRect(cx - 2.2, topY, 4.4, 0.8);
      addRect(cx - 1.6, topY + 0.8, 3.2, 0.8);
      addCircle(cx, topY + 2.4, 0.9);
    }
  };

  const addScrollVariant = (cx: number, cy: number, rr: number) => {
    switch (state.scrollStyle) {
      case 'c-scroll':
      case 'collar-double-c':
        addArc(cx, cy, rr * 1.1, 45, 315);
        addCircle(cx + rr * 0.45, cy + rr * 0.6, rr * 0.25);
        addCircle(cx + rr * 0.45, cy - rr * 0.6, rr * 0.25);
        if (state.scrollStyle === 'collar-double-c') {
          addRect(cx - rr * 0.2, cy - rr * 0.25, rr * 0.4, rr * 0.5);
        }
        break;
      case 'double-scroll':
        addArc(cx - rr * 0.45, cy, rr * 0.55, 0, 270);
        addArc(cx + rr * 0.45, cy, rr * 0.55, 90, 360);
        addArc(cx - rr * 0.45, cy, rr * 0.85, 180, 90);
        addArc(cx + rr * 0.45, cy, rr * 0.85, 270, 180);
        break;
      case 'scroll-leaf':
      case 'snub-end-s':
      case 'fishtail-s':
        addCircle(cx - rr * 0.55, cy + rr * 0.45, rr);
        addCircle(cx + rr * 0.55, cy - rr * 0.45, rr);
        addCircle(cx, cy + rr * 0.85, rr * 0.35);
        addCircle(cx, cy - rr * 0.85, rr * 0.35);
        break;
      case 'ribbon-scroll':
      case 'beveled-scroll':
        addLine(cx - rr, cy - rr, cx + rr, cy + rr);
        addArc(cx - rr * 0.5, cy + rr * 0.45, rr * 0.6, 0, 260);
        addArc(cx + rr * 0.5, cy - rr * 0.45, rr * 0.6, 180, 80);
        break;
      case 'heart-scroll':
        addArc(cx - rr * 0.4, cy + rr * 0.2, rr * 0.45, 0, 180);
        addArc(cx + rr * 0.4, cy + rr * 0.2, rr * 0.45, 0, 180);
        addLine(cx - rr * 0.85, cy + rr * 0.2, cx, cy - rr * 0.85);
        addLine(cx + rr * 0.85, cy + rr * 0.2, cx, cy - rr * 0.85);
        break;
      case 'triple-spiral':
        addCircle(cx, cy + rr * 0.4, rr * 0.4);
        addCircle(cx - rr * 0.42, cy - rr * 0.3, rr * 0.36);
        addCircle(cx + rr * 0.42, cy - rr * 0.3, rr * 0.36);
        break;
      case 'waterleaf-scroll':
      case 'vine-scroll':
      case 'bell-scroll':
        addArc(cx, cy, rr, -40, 220);
        addLine(cx, cy - rr, cx - rr * 0.4, cy + rr * 0.5);
        addLine(cx, cy - rr, cx + rr * 0.4, cy + rr * 0.5);
        break;
      case 's-scroll':
      default:
        addCircle(cx - rr * 0.55, cy + rr * 0.45, rr);
        addCircle(cx + rr * 0.55, cy - rr * 0.45, rr);
        break;
    }
  };

  const addInfillBay = (
    bayX: number,
    bayY: number,
    bayW: number,
    bayH: number,
  ) => {
    const mode =
      state.style === 'vertical'
        ? state.infillPattern
        : state.style === 'horizontal'
          ? 'horizontal-bars'
          : state.style === 'solid'
            ? 'solid-panel'
            : 'scrollwork';

    if (mode === 'scrollwork' || mode === 'scroll-panel') {
      const nScroll = Math.max(1, Math.round(bayW / 24));
      const rr = Math.min(bayH * 0.28, (bayW / nScroll) * 0.28);
      for (let s = 0; s < nScroll; s++) {
        const cx = bayX + ((s + 0.5) * bayW) / nScroll;
        const cy = bayY + bayH / 2;
        addScrollVariant(cx, cy, rr);
      }
      return;
    }

    if (mode === 'horizontal-bars' || mode === 'louvered-slats') {
      const rows = Math.max(mode === 'louvered-slats' ? 5 : 3, Math.round(bayH / (mode === 'louvered-slats' ? 5 : 8)));
      for (let r = 0; r < rows; r++) {
        const ry = bayY + ((r + 0.5) * bayH) / rows - barThickIn / 2;
        addRect(bayX, ry, bayW, barThickIn);
      }
      return;
    }

    if (mode === 'solid-panel') {
      addRect(bayX + 1.5, bayY + 1.5, bayW - 3.0, bayH - 3.0);
      return;
    }

    if (
      mode === 'perforated-round-staggered' ||
      mode === 'perforated-round-straight' ||
      mode === 'perforated-square' ||
      mode === 'perforated-slotted'
    ) {
      addRect(bayX + 1.5, bayY + 1.5, bayW - 3.0, bayH - 3.0);
      const step = 6;
      for (let gy = bayY + 4; gy < bayY + bayH - 3; gy += step) {
        const stag = mode === 'perforated-round-staggered' && Math.round(gy / step) % 2 === 1 ? step * 0.5 : 0;
        for (let gx = bayX + 4 + stag; gx < bayX + bayW - 3; gx += step) {
          if (mode === 'perforated-square') addRect(gx - 0.8, gy - 0.8, 1.6, 1.6);
          else if (mode === 'perforated-slotted') addRect(gx - 1.5, gy - 0.5, 3.0, 1.0);
          else addCircle(gx, gy, 0.9);
        }
      }
      return;
    }

    if (
      mode === 'interweave' ||
      mode === 'intercrimp' ||
      mode === 'lock-crimp' ||
      mode === 'flat-top-mesh' ||
      mode === 'bar-grating'
    ) {
      const cols = Math.max(4, Math.floor(bayW / (mode === 'bar-grating' ? 5 : 3.5)));
      for (let c = 0; c < cols; c++) {
        const px = bayX + ((c + 0.5) * bayW) / cols;
        addLine(px, bayY, px, bayY + bayH);
      }
      const rows = Math.max(4, Math.floor(bayH / (mode === 'bar-grating' ? 3 : 3.5)));
      for (let r = 0; r < rows; r++) {
        const ry = bayY + ((r + 0.5) * bayH) / rows;
        addLine(bayX, ry, bayX + bayW, ry);
      }
      return;
    }

    if (mode === 'diamond-lattice' || mode === 'expanded-metal' || mode === 'flattened-expanded') {
      const steps = Math.max(mode === 'diamond-lattice' ? 3 : 6, Math.round(bayW / (mode === 'diamond-lattice' ? 12 : 6)));
      for (let i = -steps; i <= steps; i++) {
        const xStart = bayX + (i * bayW) / steps;
        const xEnd = xStart + bayH;
        const cx1 = Math.max(bayX, Math.min(bayX + bayW, xStart));
        const cx2 = Math.max(bayX, Math.min(bayX + bayW, xEnd));
        if (Math.abs(cx2 - cx1) > 1) {
          addLine(cx1, bayY, cx2, bayY + bayH);
          addLine(cx1, bayY + bayH, cx2, bayY);
        }
      }
      return;
    }

    if (mode === 'basketweave') {
      const cols = Math.max(3, Math.floor(bayW / Math.max(4, state.picketSpacing * 1.4)));
      for (let c = 0; c < cols; c++) {
        const px = bayX + ((c + 0.5) * bayW) / cols - picketThickIn / 2;
        addRect(px, bayY, picketThickIn, bayH);
      }
      const rows = Math.max(3, Math.round(bayH / 10));
      for (let r = 0; r < rows; r++) {
        const ry = bayY + ((r + 0.5) * bayH) / rows - barThickIn * 0.35;
        addRect(bayX, ry, bayW, barThickIn * 0.7);
      }
      return;
    }

    if (mode === 'sunburst') {
      const rays = Math.max(7, Math.round(bayW / 8));
      const ox = bayX + bayW / 2;
      const oy = bayY;
      for (let i = 0; i <= rays; i++) {
        const ang = (Math.PI * i) / rays;
        const tx = ox + Math.cos(ang) * (bayW * 0.48);
        const ty = oy + Math.sin(ang) * (bayH * 0.94);
        addLine(ox, oy, tx, ty);
      }
      addArc(ox, oy, Math.min(bayW * 0.35, bayH * 0.65), 0, 180);
      return;
    }

    // vertical-pickets with picketStyle variants
    const n = Math.max(2, Math.floor(bayW / state.picketSpacing));
    for (let p = 0; p < n; p++) {
      const cx = bayX + ((p + 0.5) * bayW) / n;
      addRect(cx - picketThickIn / 2, bayY, picketThickIn, bayH);
      if (state.picketStyle === 'spearhead') {
        addLine(cx - picketThickIn, bayY + bayH, cx, bayY + bayH + 3.5);
        addLine(cx, bayY + bayH + 3.5, cx + picketThickIn, bayY + bayH);
      } else if (state.picketStyle === 'ball-top') {
        addCircle(cx, bayY + bayH + 1.2, 1.1);
      } else if (state.picketStyle === 'twisted' || state.picketStyle === 'double-twist') {
        addLine(cx - picketThickIn * 0.6, bayY + 2, cx + picketThickIn * 0.6, bayY + bayH - 2);
      } else if (state.picketStyle === 'single-basket' || state.picketStyle === 'double-basket') {
        addRect(cx - 1.4, bayY + bayH * 0.5 - 3, 2.8, 6);
      } else if (state.picketStyle === 'single-knuckle' || state.picketStyle === 'double-knuckle') {
        addCircle(cx, bayY + bayH * 0.5, 1.2);
      } else if (state.picketStyle === 'scroll-picket') {
        addCircle(cx, bayY + bayH * 0.5, 1.8);
      }
    }
  };

  const addDecor = (centerX: number, centerY: number, spanIn: number, topY: number) => {
    if (state.decor.scrolls && state.style !== 'scroll') {
      const r = 4.5;
      addScrollVariant(centerX - spanIn * 0.22, centerY, r);
      addScrollVariant(centerX + spanIn * 0.22, centerY, r);
    }
    if (state.decor.rings) {
      addCircle(centerX - spanIn * 0.22, centerY, 5.0);
      addCircle(centerX + spanIn * 0.22, centerY, 5.0);
    }
    if (state.decor.medallion) {
      addCircle(centerX, centerY, 6.2);
      addCircle(centerX, centerY, 4.6);
    }
    if (state.decor.leaves) {
      const bx = centerX - spanIn * 0.18;
      const by = centerY - 6;
      addLine(bx, by, bx + 16, by + 7);
      addCircle(bx + 5.5, by + 3.8, 2.1);
      addCircle(bx + 10.5, by + 4.4, 2.1);
      addCircle(bx + 15.2, by + 7.2, 1.9);
    }
    if (state.decor.rosettes) {
      [-spanIn * 0.25, spanIn * 0.25].forEach((ox) => {
        addCircle(centerX + ox, centerY + 6, 3.6);
        addCircle(centerX + ox, centerY + 6, 1.4);
      });
    }
    if (state.decor.baskets) {
      [-spanIn * 0.15, spanIn * 0.15].forEach((ox) => {
        addRect(centerX + ox - 1.6, centerY - 4.0, 3.2, 8.0);
      });
    }
    if (state.decor.twistedBars) {
      [-spanIn * 0.3, 0, spanIn * 0.3].forEach((ox) => {
        addLine(centerX + ox - 0.6, centerY - 10, centerX + ox + 0.6, centerY + 10);
      });
    }
    if (state.decor.spearheadFinials) {
      const count = Math.max(3, Math.round(spanIn / 18));
      for (let i = 0; i < count; i++) {
        const sx = centerX - spanIn * 0.45 + (i * spanIn * 0.9) / Math.max(1, count - 1);
        addLine(sx - 1.0, topY, sx, topY + 4.5);
        addLine(sx, topY + 4.5, sx + 1.0, topY);
        addLine(sx + 1.0, topY, sx - 1.0, topY);
      }
    }
    if (state.decor.fleurDeLis) {
      addLine(centerX - 1.5, topY, centerX, topY + 5.5);
      addLine(centerX, topY + 5.5, centerX + 1.5, topY);
      addArc(centerX - 1.6, topY + 2.2, 1.4, 20, 200);
      addArc(centerX + 1.6, topY + 2.2, 1.4, -20, 160);
    }
    if (state.decor.collars) {
      [-spanIn * 0.2, spanIn * 0.2].forEach((ox) => {
        addRect(centerX + ox - 1.4, centerY - 1.1, 2.8, 2.2);
      });
    }
    if (state.decor.leafSprays) {
      const lx = centerX + spanIn * 0.18;
      const ly = centerY - 5;
      addLine(lx, ly, lx - 12, ly + 9);
      addCircle(lx - 4, ly + 3, 1.9);
      addCircle(lx - 8, ly + 6, 1.9);
      addCircle(lx - 11, ly + 9, 1.7);
    }

    if (state.selectedLeaves && state.selectedLeaves.length > 0) {
      const count = state.selectedLeaves.length;
      const leafSpan = Math.min(spanIn * 0.78, Math.max(18, count * 14));
      state.selectedLeaves.forEach((leafId, idx) => {
        if (!LEAF_CATALOG.some((l) => l.id === leafId)) return;
        const frac = count === 1 ? 0.5 : idx / (count - 1);
        const lx = centerX - leafSpan / 2 + frac * leafSpan;
        const ly = centerY + (idx % 2 === 0 ? 2.5 : -2.5);
        addArc(lx, ly, 3.2, -30, 150);
        addArc(lx, ly, 3.2, 150, 330);
      });
    }

    if (state.sampleArt?.useOutlineCut && state.sampleArt.cutSegments?.length) {
      const artSize = Math.min(spanIn * 0.65, hIn * 0.55);
      const ax0 = centerX - artSize / 2;
      const ay0 = centerY - artSize / 2;
      state.sampleArt.cutSegments.forEach(([x0, y0, x1, y1]) => {
        addLine(
          ax0 + x0 * artSize,
          ay0 + y0 * artSize,
          ax0 + x1 * artSize,
          ay0 + y1 * artSize,
        );
      });
    }
  };

  const postW = 3.0;
  const railH = 2.0;

  pushPair(0, 'SECTION');
  pushPair(2, 'HEADER');
  pushPair(9, '$ACADVER');
  pushPair(1, 'AC1009');
  pushPair(9, '$INSUNITS');
  pushPair(70, 1);
  pushPair(9, '$EXTMIN');
  pushPair(10, -6);
  pushPair(20, -2);
  pushPair(30, 0);
  pushPair(9, '$EXTMAX');
  pushPair(10, +(wIn + 12).toFixed(2));
  pushPair(20, +(hIn + 16).toFixed(2));
  pushPair(30, 0);
  pushPair(0, 'ENDSEC');

  pushPair(0, 'SECTION');
  pushPair(2, 'TABLES');
  pushPair(0, 'TABLE');
  pushPair(2, 'LAYER');
  pushPair(70, 1);
  pushPair(0, 'LAYER');
  pushPair(2, 'CUT');
  pushPair(70, 0);
  pushPair(62, 7);
  pushPair(6, 'CONTINUOUS');
  pushPair(0, 'ENDTAB');
  pushPair(0, 'ENDSEC');

  pushPair(0, 'SECTION');
  pushPair(2, 'ENTITIES');

  if (state.piece === 'railing') {
    const segs = Math.max(1, Math.round(state.width / state.postSpacing));
    const segW = wIn / segs;
    const botRailY = 3.5;
    const topRailY = hIn - railH;

    for (let i = 0; i <= segs; i++) {
      const px = i * segW;
      addRect(px - 3.5, 0, 7.0, 0.5);
      addRect(px - postW / 2, 0.5, postW, hIn - 0.5);
      addFinial(px, hIn);
    }
    addRect(0, topRailY, wIn, railH);
    addRect(0, botRailY, wIn, railH);

    const innerBot = botRailY + railH;
    const innerH = Math.max(4, topRailY - innerBot);
    addInfillBay(0, innerBot, wIn, innerH);
    addDecor(wIn / 2, (innerBot + topRailY) / 2, wIn, hIn);
  } else if (state.piece === 'sculpture-base') {
    const basePlateW = wIn + 6;
    addRect(-3, 0, basePlateW, 3.0);
    if (state.style === 'tapered') {
      addLine(wIn * 0.05, 3.0, wIn * 0.18, hIn - 2.5);
      addLine(wIn * 0.18, hIn - 2.5, wIn * 0.82, hIn - 2.5);
      addLine(wIn * 0.82, hIn - 2.5, wIn * 0.95, 3.0);
      addLine(wIn * 0.95, 3.0, wIn * 0.05, 3.0);
    } else {
      addRect(0, 3.0, wIn, hIn - 5.5);
    }
    addRect(-1.5, hIn - 2.5, wIn + 3.0, 2.5);
    addDecor(wIn / 2, hIn * 0.5, wIn, hIn);
  } else if (state.piece === 'sign-frame') {
    addRect(0, 0, postW, hIn);
    addRect(postW + wIn, 0, postW, hIn);
    addFinial(postW / 2, hIn);
    addFinial(postW + wIn + postW / 2, hIn);
    const panelH = hIn * 0.62;
    const panelY = hIn * 0.22;
    addRect(postW, panelY, wIn, panelH);
    addRect(postW + 2.0, panelY + 2.0, wIn - 4.0, panelH - 4.0);
    if (state.style === 'arch') {
      addArc(postW + wIn / 2, panelY + panelH, wIn / 2, 0, 180);
    }
    // Sign lettering on CUT layer
    const textHIn = Math.max(2, Math.min(panelH * 0.45, (state.signFontSize / 42) * 6));
    addText(postW + wIn / 2, panelY + panelH / 2 - textHIn * 0.35, textHIn, state.signText);

    // Freehand drawing strokes on CUT layer
    state.signStrokes.forEach((stroke) => {
      for (let i = 0; i < stroke.points.length - 1; i++) {
        const [x0, y0] = stroke.points[i];
        const [x1, y1] = stroke.points[i + 1];
        addLine(
          postW + x0 * wIn,
          panelY + (1 - y0) * panelH,
          postW + x1 * wIn,
          panelY + (1 - y1) * panelH,
        );
      }
    });

    // Uploaded sign design picture outline
    if (state.signPicture?.cutSegments?.length) {
      const picW = Math.min(wIn, panelH) * state.signPicture.scale;
      const picX0 = postW + state.signPicture.x * wIn - picW / 2;
      const picY0 = panelY + (1 - state.signPicture.y) * panelH - picW / 2;
      state.signPicture.cutSegments.slice(0, 600).forEach(([x0, y0, x1, y1]) => {
        addLine(
          picX0 + x0 * picW,
          picY0 + y0 * picW,
          picX0 + x1 * picW,
          picY0 + y1 * picW,
        );
      });
    }

    addDecor(postW + wIn / 2, panelY + panelH / 2, wIn, hIn);
  } else if (state.piece === 'patio-cover') {
    const nPosts = state.width > 14 ? 3 : 2;
    for (let i = 0; i < nPosts; i++) {
      const px =
        i === 0 ? 0 : i === nPosts - 1 ? wIn - postW : wIn / 2 - postW / 2;
      addRect(px - 2, 0, postW + 4, 0.75);
      addRect(px, 0.75, postW, hIn - 0.75);
      addFinial(px + postW / 2, hIn + 5);
    }
    addRect(-3, hIn, wIn + 6, 5.0);
    if (state.style === 'slats') {
      const nSlats = Math.max(4, Math.round(state.width / 1.4));
      for (let s = 0; s < nSlats; s++) {
        const sx = ((s + 0.5) * wIn) / nSlats - 1.25;
        addRect(sx, hIn + 5.0, 2.5, 1.5);
      }
    } else {
      addRect(-5, hIn + 5.0, wIn + 10, 2.0);
    }
    addDecor(wIn / 2, hIn + 2.5, wIn, hIn + 6.5);
  } else {
    // Gate
    addRect(0, 0, postW, hIn);
    addRect(postW + wIn, 0, postW, hIn);
    addFinial(postW / 2, hIn);
    addFinial(postW + wIn + postW / 2, hIn);

    const leaves = state.leaves === 'double' ? 2 : 1;
    const gap = leaves === 2 ? 1.5 : 0;
    const leafW = leaves === 2 ? (wIn - gap) / 2 : wIn;

    for (let l = 0; l < leaves; l++) {
      const lx = postW + l * (leafW + gap);
      addRect(lx, hIn - 3.0, leafW, 3.0);
      addRect(lx, 0, leafW, 3.0);
      addRect(lx, 3.0, 2.0, hIn - 6.0);
      addRect(lx + leafW - 2.0, 3.0, 2.0, hIn - 6.0);

      const innerX = lx + 2.0;
      const innerW = Math.max(4, leafW - 4.0);
      const innerY = 3.0;
      const innerH = hIn - 6.0;
      addInfillBay(innerX, innerY, innerW, innerH);
    }

    addDecor(postW + wIn / 2, hIn * 0.52, wIn, hIn);
  }

  pushPair(0, 'ENDSEC');
  pushPair(0, 'EOF');

  return {
    content: `${lines.join('\n')}\n`,
    entityCount,
    widthIn: wIn,
    heightIn: hIn,
  };
}
