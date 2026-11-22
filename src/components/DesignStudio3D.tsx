import {
  ChangeEvent,
  Dispatch,
  DragEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Box,
  Camera,
  Check,
  ClipboardList,
  Compass,
  Copy,
  Download,
  FileCode2,
  FileText,
  Grid2x2,
  ImagePlus,
  Layers,
  Link2,
  Lock,
  Mail,
  MousePointer2,
  Move,
  Palette,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  RotateCw,
  Ruler,
  Search,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  Unlock,
  Upload,
  Video,
  X,
} from 'lucide-react';
import {
  IronworksScene,
  SceneInteractionMode,
  UploadedPhoto3D,
} from '../three/IronworksScene';
import {
  PhotoDimension,
  formatPhotoDimensionLabel,
  getCachedPhotoRelief,
  getCalibrationSummaryText,
} from '../utils/photoRelief';

export type { UploadedPhoto3D };
import {
  CUSTOM_COLOR_SWATCHES,
  ConfiguratorState,
  DECOR_ITEMS,
  FINISHES,
  FinishType,
  FinialType,
  INFILL_PATTERNS,
  INITIAL_CONFIG,
  InfillPatternType,
  LEAF_CATALOG,
  LeafOptionId,
  LeavesType,
  MATERIALS,
  MaterialType,
  PART_AREA_LABELS,
  PICKET_FORM_STYLES,
  PICKET_SIZES,
  PIECES,
  POST_CAPS_FINIALS,
  POST_STYLES,
  POWDERS,
  PartArea,
  PicketAccentType,
  PicketSizeId,
  PicketStyleType,
  PieceType,
  PostStyleType,
  PowderColorType,
  SCROLL_STYLES,
  ScrollStyleType,
  SignStroke,
  SizeModeType,
  TopRailType,
  describeConfig,
  dimsText,
  formatFeetInches,
  getActiveSupplierSpecs,
  getEffectivePicketSizeLabel,
  getPicketLayoutStats,
} from '../types/configurator';
import {
  FontOption,
  SIGN_FONT_LIBRARY,
  SUPPLIER_CATALOGS,
  SUPPLIER_ORDER,
  SupplierId,
  ensureGoogleFontLoaded,
} from '../data/suppliers';
import {
  buildDetailedCutList,
  drawBlueprint,
  drawFreeStrokesOverlay,
  drawIsometricBlueprint,
  drawMaterialCutListSchematic,
  drawTechnicalDrawing,
  getUploadedPhoto2DRect,
  hitTestBlueprintPicket,
} from '../utils/blueprintRenderer';
import {
  CutShareFormat,
  encodeCutShareUrl,
  generateCanvasPdfBlob,
  generateCutSpecPdf,
} from '../utils/cutShare';
import { generateCutDxf } from '../utils/dxfExporter';
import {
  processSignPictureFile,
  processUploadedStudioFile,
} from '../utils/sampleArtProcessor';

export type StudioTab =
  | '3d'
  | '2d'
  | 'sign'
  | 'technical'
  | 'isometric'
  | 'color'
  | 'pickets'
  | 'cutlist';

interface DesignStudio3DProps {
  onUseInQuote: (payload: {
    quoteType: string;
    size: string;
    descriptionLine: string;
  }) => void;
  onSelectPieceForGuide?: (piece: PieceType) => void;
  initialCutShare?: {
    format: CutShareFormat;
    config: ConfiguratorState;
  } | null;
  config?: ConfiguratorState;
  onConfigChange?: Dispatch<SetStateAction<ConfiguratorState>>;
  activeStudioTab?: StudioTab;
  onStudioTabChange?: Dispatch<SetStateAction<StudioTab>>;
  uploadedPhoto?: UploadedPhoto3D | null;
  onUploadedPhotoChange?: Dispatch<SetStateAction<UploadedPhoto3D | null>>;
}
type ColorTarget = 'whole' | PartArea;

const PIECE_ORDER: PieceType[] = [
  'gate',
  'railing',
  'sculpture-base',
  'sign-frame',
  'patio-cover',
];

const PART_AREAS: PartArea[] = [
  'posts',
  'rails',
  'pickets',
  'panels',
  'scrolls',
  'base',
  'finials',
];

const PICKET_STYLES: Array<{ id: string; label: string; desc: string }> = [
  { id: 'vertical', label: 'Vertical pickets', desc: 'Classic vertical bars' },
  { id: 'horizontal', label: 'Horizontal bars', desc: 'Modern horizontal slats' },
  { id: 'solid', label: 'Solid panel', desc: 'Privacy sheet infill' },
  { id: 'scroll', label: 'Scrollwork', desc: 'Hand-bent forged scrolls' },
];

const SIZE_MODES: Array<{ id: SizeModeType; label: string }> = [
  { id: 'standard', label: 'Standard' },
  { id: 'custom', label: 'Custom' },
  { id: 'artistic', label: 'Artistic' },
];

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) =>
    ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function DesignStudio3D({
  onUseInQuote,
  onSelectPieceForGuide,
  initialCutShare = null,
  config: controlledConfig,
  onConfigChange,
  activeStudioTab,
  onStudioTabChange,
  uploadedPhoto: controlledUploadedPhoto,
  onUploadedPhotoChange,
}: DesignStudio3DProps) {
  const [internalConfig, setInternalConfig] = useState<ConfiguratorState>(
    () => initialCutShare?.config || INITIAL_CONFIG,
  );
  const config = controlledConfig ?? internalConfig;
  const setConfig = onConfigChange ?? setInternalConfig;
  const [internalStudioTab, setInternalStudioTab] = useState<StudioTab>('3d');
  const studioTab = activeStudioTab ?? internalStudioTab;
  const setStudioTab = onStudioTabChange ?? setInternalStudioTab;
  const [internalUploadedPhoto, setInternalUploadedPhoto] =
    useState<UploadedPhoto3D | null>(null);
  const isPhotoControlled = onUploadedPhotoChange !== undefined;
  const uploadedPhoto = isPhotoControlled
    ? (controlledUploadedPhoto ?? null)
    : internalUploadedPhoto;
  const setUploadedPhoto = onUploadedPhotoChange ?? setInternalUploadedPhoto;
  const [isPhotoDragActive, setIsPhotoDragActive] = useState(false);
  const [photo2DMode, setPhoto2DMode] = useState<'add' | 'adjust' | 'calibrate'>('add');
  const [pendingDimStart, setPendingDimStart] = useState<[number, number] | null>(null);
  const [pendingCalStart, setPendingCalStart] = useState<[number, number] | null>(null);
  const [draftCalSpan, setDraftCalSpan] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [calLengthInput, setCalLengthInput] = useState('48');
  const [calUnitInput, setCalUnitInput] = useState<'in' | 'ft'>('in');
  const [calFeatureInput, setCalFeatureInput] = useState('');
  const [selectedPhotoDimId, setSelectedPhotoDimId] = useState<string | null>(null);
  const [photoReliefLoadVer, setPhotoReliefLoadVer] = useState(0);

  const [selectedColorTarget, setSelectedColorTarget] =
    useState<ColorTarget>('whole');
  const [gradientHue, setGradientHue] = useState(28);
  const [gradientSat, setGradientSat] = useState(62);
  const [gradientLight, setGradientLight] = useState(38);
  const [webglFailed, setWebglFailed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploadingSampleArt, setUploadingSampleArt] = useState(false);
  const [uploadingSignPic, setUploadingSignPic] = useState(false);
  const [sharedBannerDismissed, setSharedBannerDismissed] = useState(false);

  // Send to Cut share link state
  const [shareFormat, setShareFormat] = useState<CutShareFormat>('dxf');
  const [shareUrl, setShareUrl] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  // Sign Frame drawing, font search & installed fonts state
  const [installedFonts, setInstalledFonts] = useState<FontOption[]>([]);
  const [localFontsChecked, setLocalFontsChecked] = useState(false);
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const [fontLoadVer, setFontLoadVer] = useState(0);
  const [activeStroke, setActiveStroke] = useState<SignStroke | null>(null);
  const [signImgLoadedVer, setSignImgLoadedVer] = useState(0);

  // Interactive Mode (Rotate / Select / Draw / Place Accents) & Free-Draw overlays
  const [interactionMode, setInteractionMode] =
    useState<SceneInteractionMode>('rotate');
  const [activeAccentTool, setActiveAccentTool] =
    useState<PicketAccentType>('knuckle');
  const [activeFreeStroke2D, setActiveFreeStroke2D] =
    useState<SignStroke | null>(null);
  const [activeFreeStroke3D, setActiveFreeStroke3D] =
    useState<SignStroke | null>(null);

  const [status, setStatus] = useState<{
    text: string;
    kind: '' | 'ok' | 'warn';
  }>({ text: '', kind: '' });

  const canvas3dRef = useRef<HTMLCanvasElement | null>(null);
  const canvas3dDrawRef = useRef<HTMLCanvasElement | null>(null);
  const blueprintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvas2dTapRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const photoDragRef = useRef<{
    kind: 'p1' | 'p2' | 'move';
    dimId: string;
    startNorm: [number, number];
    orig: PhotoDimension;
  } | null>(null);
  const techCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cutListCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signDrawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signImgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const sceneRef = useRef<IronworksScene | null>(null);
  const skipInitialUpdateRef = useRef(true);
  const sampleArtInputRef = useRef<HTMLInputElement | null>(null);
  const section3UploadRef = useRef<HTMLInputElement | null>(null);
  const signPictureInputRef = useRef<HTMLInputElement | null>(null);
  const photo3dInputRef = useRef<HTMLInputElement | null>(null);

  const is2DView = studioTab === '2d';
  const isTechView = studioTab === 'technical';
  const isIsoView = studioTab === 'isometric';
  const isCutListView = studioTab === 'cutlist';
  const is3DViewportActive =
    !is2DView && !isTechView && !isIsoView && !isCutListView;
  const detailedCutList = useMemo(() => buildDetailedCutList(config), [config]);

  const allSignFonts = useMemo(() => {
    return [...SIGN_FONT_LIBRARY, ...installedFonts];
  }, [installedFonts]);

  const filteredSignFonts = useMemo(() => {
    const q = fontSearchQuery.trim().toLowerCase();
    if (!q) return allSignFonts;
    return allSignFonts.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.family.toLowerCase().includes(q),
    );
  }, [allSignFonts, fontSearchQuery]);

  const isControlled = controlledConfig !== undefined;

  // Apply late-arriving initialCutShare from async hash decode (when uncontrolled)
  useEffect(() => {
    if (initialCutShare) {
      if (!isControlled) {
        setInternalConfig(initialCutShare.config);
      }
      setShareFormat(initialCutShare.format);
      setSharedBannerDismissed(false);
      onSelectPieceForGuide?.(initialCutShare.config.piece);
    }
  }, [initialCutShare, onSelectPieceForGuide, isControlled]);

  // Initialize Three.js scene once on mount
  useEffect(() => {
    const canvas = canvas3dRef.current;
    if (!canvas) return;

    const initCfg = controlledConfig || initialCutShare?.config || INITIAL_CONFIG;
    let instance: IronworksScene | null = null;
    try {
      instance = new IronworksScene(canvas, initCfg, {
        onContextLost: () => {
          setStatus({
            text: '3D graphics context paused — switch to 2D Blueprint or reload if it does not resume.',
            kind: 'warn',
          });
        },
        onContextRestored: () => {
          setStatus({ text: '', kind: '' });
        },
        onSelectPart: (area) => {
          setSelectedColorTarget(area);
          setStatus({
            text: `Selected "${PART_AREA_LABELS[area]}" on the 3D model — tap any color swatch or gradient point to color only this area.`,
            kind: 'ok',
          });
        },
        onSelectPicket: (picketIndex) => {
          // Selecting a picket NEVER alters frozenView, turntable, or camera
          setConfig((prev) => ({
            ...prev,
            selectedPicketIndex: picketIndex,
          }));
          setStatus({
            text: `Selected Picket #${picketIndex + 1} — tap Knuckle, Emblem, or Leaf to attach an accent (view stays locked).`,
            kind: 'ok',
          });
        },
        onPhotoLoadError: (message) => {
          setStatus({ text: message, kind: 'warn' });
        },
      });
      sceneRef.current = instance;
      instance.setInteractionMode(interactionMode);
      if (uploadedPhoto) {
        instance.setUploadedPhoto(uploadedPhoto);
      }
    } catch {
      setWebglFailed(true);
    }

    const handleResize = () => instance?.resize(true);
    window.addEventListener('resize', handleResize);
    const resizeObs =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => instance?.resize(true))
        : null;
    resizeObs?.observe(canvas);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObs?.disconnect();
      instance?.dispose();
      sceneRef.current = null;
      skipInitialUpdateRef.current = true;
    };
  }, []);

  // Sync uploadedPhoto to Three.js scene
  useEffect(() => {
    sceneRef.current?.setUploadedPhoto(uploadedPhoto);
  }, [uploadedPhoto]);

  // Clear pending dimension/calibration taps when photo changes or is removed
  useEffect(() => {
    setPendingDimStart(null);
    setPendingCalStart(null);
    setDraftCalSpan(null);
    setSelectedPhotoDimId(null);
    photoDragRef.current = null;
  }, [uploadedPhoto?.dataUrl]);

  // Sync interactionMode to Three.js scene without changing freeze/camera
  useEffect(() => {
    sceneRef.current?.setInteractionMode(interactionMode);
  }, [interactionMode]);

  // Ensure selected Google Font finishes loading and refresh 3D/2D canvases
  useEffect(() => {
    ensureGoogleFontLoaded(config.signFont, () => {
      setFontLoadVer((v) => v + 1);
      sceneRef.current?.refreshSignFonts();
    });
  }, [config.signFont]);

  // Update Three.js scene when config changes
  useEffect(() => {
    if (skipInitialUpdateRef.current) {
      skipInitialUpdateRef.current = false;
      return;
    }
    sceneRef.current?.update(config);
  }, [config]);

  const photoReliefEntry = useMemo(() => {
    if (!uploadedPhoto) return null;
    return getCachedPhotoRelief(uploadedPhoto.dataUrl, () =>
      setPhotoReliefLoadVer((v) => v + 1),
    );
  }, [uploadedPhoto?.dataUrl, photoReliefLoadVer]);

  // Redraw 2D blueprint whenever config, view mode, uploadedPhoto, or active 2D freehand stroke changes
  useEffect(() => {
    if (is2DView && blueprintCanvasRef.current) {
      const mergedConfig = activeFreeStroke2D
        ? {
            ...config,
            freeDrawStrokes2D: [
              ...config.freeDrawStrokes2D,
              activeFreeStroke2D,
            ],
          }
        : config;
      drawBlueprint(blueprintCanvasRef.current, mergedConfig, uploadedPhoto, {
        pendingStart: pendingDimStart,
        pendingCalStart,
        mode: photo2DMode,
        selectedDimId: selectedPhotoDimId,
        onPhotoLoaded: () => setPhotoReliefLoadVer((v) => v + 1),
      });
    }
  }, [
    config,
    is2DView,
    activeFreeStroke2D,
    fontLoadVer,
    uploadedPhoto,
    pendingDimStart,
    pendingCalStart,
    photo2DMode,
    selectedPhotoDimId,
    photoReliefLoadVer,
  ]);

  // Redraw Dedicated Technical Drawing sheet when active or config changes
  useEffect(() => {
    if (isTechView && techCanvasRef.current) {
      drawTechnicalDrawing(techCanvasRef.current, config);
    }
  }, [config, isTechView, fontLoadVer]);

  // Redraw Dedicated Isometric Blueprint View sheet when active, config, or uploadedPhoto changes
  useEffect(() => {
    if (isIsoView && isoCanvasRef.current) {
      drawIsometricBlueprint(
        isoCanvasRef.current,
        config,
        uploadedPhoto,
        () => setPhotoReliefLoadVer((v) => v + 1),
      );
    }
  }, [config, isIsoView, fontLoadVer, uploadedPhoto, photoReliefLoadVer]);

  // Redraw Material Cut List & Assembly Schematic canvas when active or config changes
  useEffect(() => {
    if (isCutListView && cutListCanvasRef.current) {
      drawMaterialCutListSchematic(cutListCanvasRef.current, config);
    }
  }, [config, isCutListView, fontLoadVer]);

  // Redraw 3D freehand drawing overlay canvas cleanly at CSS pixel resolution
  useEffect(() => {
    const overlay = canvas3dDrawRef.current;
    if (!overlay || !is3DViewportActive) return;
    const rect = overlay.getBoundingClientRect();
    const targetW = Math.max(300, Math.round(rect.width || 680));
    const targetH = Math.max(240, Math.round(rect.height || 460));
    if (overlay.width !== targetW || overlay.height !== targetH) {
      overlay.width = targetW;
      overlay.height = targetH;
    }
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    const strokes = activeFreeStroke3D
      ? [...config.freeDrawStrokes3D, activeFreeStroke3D]
      : config.freeDrawStrokes3D;
    drawFreeStrokesOverlay(ctx, strokes, overlay.width, overlay.height);
  }, [
    config.freeDrawStrokes3D,
    activeFreeStroke3D,
    is3DViewportActive,
    config.piece,
  ]);

  // Redraw interactive Sign Lettering freehand drawing pad when sign settings change
  useEffect(() => {
    if (studioTab !== 'sign' && config.piece !== 'sign-frame' && !config.showSign)
      return;
    const pad = signDrawCanvasRef.current;
    if (!pad) return;
    const ctx = pad.getContext('2d');
    if (!ctx) return;

    const W = pad.width;
    const H = pad.height;
    ctx.fillStyle = '#1b1f24';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#c9883d';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, W - 12, H - 12);

    if (config.signPicture?.previewUrl) {
      const url = config.signPicture.previewUrl;
      let img = signImgCacheRef.current.get(url);
      if (!img) {
        img = new Image();
        img.onload = () => setSignImgLoadedVer((v) => v + 1);
        img.src = url;
        signImgCacheRef.current.set(url, img);
      }
      if (img.complete && img.naturalWidth > 0) {
        const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
        const drawH = Math.max(
          20,
          Math.min(H * 0.9, config.signPicture.scale * H),
        );
        const drawW = drawH * aspect;
        ctx.drawImage(
          img,
          config.signPicture.x * W - drawW / 2,
          config.signPicture.y * H - drawH / 2,
          drawW,
          drawH,
        );
      }
    }

    if (config.signLetteringMode !== 'hand-drawn') {
      const txt = config.signText.trim();
      if (txt) {
        const px = Math.round(
          Math.max(12, Math.min(64, config.signFontSize * 0.72)),
        );
        ctx.fillStyle = config.signTextColor || '#f2efe8';
        ctx.font = `700 ${px}px ${config.signFont || "'Oswald', sans-serif"}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = txt.split(/\r?\n/).slice(0, 3);
        const baseCenterY = config.signPicture?.previewUrl
          ? H * 0.72
          : H * 0.5;
        const lineH = px * 1.15;
        const startY = baseCenterY - ((lines.length - 1) * lineH) / 2;
        lines.forEach((line, idx) => {
          ctx.fillText(line, W / 2, startY + idx * lineH, W - 30);
        });
      }
    }

    const strokesToDraw = activeStroke
      ? [...config.signStrokes, activeStroke]
      : config.signStrokes;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokesToDraw.forEach((s) => {
      if (!s.points.length) return;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      s.points.forEach(([nx, ny], idx) => {
        if (idx === 0) ctx.moveTo(nx * W, ny * H);
        else ctx.lineTo(nx * W, ny * H);
      });
      if (s.points.length === 1) {
        ctx.lineTo(s.points[0][0] * W + 0.5, s.points[0][1] * H + 0.5);
      }
      ctx.stroke();
    });
  }, [
    studioTab,
    config.piece,
    config.showSign,
    config.signLetteringMode,
    config.signText,
    config.signFont,
    config.signFontSize,
    config.signTextColor,
    config.signStrokes,
    config.signPicture,
    activeStroke,
    signImgLoadedVer,
    fontLoadVer,
  ]);

  // Trigger resize and render when switching back to 3D viewport
  useEffect(() => {
    if (is3DViewportActive) {
      requestAnimationFrame(() => sceneRef.current?.resize(true));
    }
  }, [is3DViewportActive]);

  const pieceSpec = PIECES[config.piece];
  const isGateOrRailing =
    config.piece === 'gate' || config.piece === 'railing';
  const supportsPickets = isGateOrRailing && config.style !== 'solid';
  const picketStats = useMemo(() => getPicketLayoutStats(config), [config]);
  const hasAnyAreaColors = Object.keys(config.areaColors).length > 0;
  const activeSupplierSpecs = getActiveSupplierSpecs(config);
  const kingLeaves = useMemo(
    () => LEAF_CATALOG.filter((l) => l.catalog === 'King Architectural'),
    [],
  );
  const imsLeaves = useMemo(
    () =>
      LEAF_CATALOG.filter((l) => l.catalog === 'IMS (Industrial Metal Supply)'),
    [],
  );

  const activeTargetHex =
    selectedColorTarget === 'whole'
      ? config.customColor || FINISHES[config.finish].swatch
      : config.areaColors[selectedColorTarget] ||
        config.customColor ||
        FINISHES[config.finish].swatch;

  const handlePieceChange = (piece: PieceType) => {
    const spec = PIECES[piece];
    setConfig((prev) => ({
      ...prev,
      piece,
      width: spec.widthDef,
      height: spec.heightDef,
      depth: spec.depthDef ?? prev.depth,
      style: spec.styles[0][0],
    }));
    onSelectPieceForGuide?.(piece);
  };

  const handleSupplierChange = (supplierId: SupplierId) => {
    const cat = SUPPLIER_CATALOGS[supplierId];
    setConfig((prev) => ({
      ...prev,
      supplier: supplierId,
      supplierPicketId: cat.pickets[0]?.id || '',
      supplierBarId: cat.bars[0]?.id || '',
      supplierPanelId: cat.panels[0]?.id || '',
    }));
  };

  const handleInfillPatternChange = (pattern: InfillPatternType) => {
    setConfig((prev) => ({
      ...prev,
      infillPattern: pattern,
      style:
        pattern === 'horizontal-bars'
          ? 'horizontal'
          : pattern === 'solid-panel'
            ? 'solid'
            : pattern === 'scroll-panel'
              ? 'scroll'
              : 'vertical',
    }));
  };

  const handleScrollStyleChange = (scrollStyle: ScrollStyleType) => {
    setConfig((prev) => ({
      ...prev,
      scrollStyle,
      decor:
        prev.style === 'scroll'
          ? prev.decor
          : { ...prev.decor, scrolls: true },
    }));
  };

  const handleToggleCatalogLeaf = (leafId: LeafOptionId) => {
    setConfig((prev) => {
      const current = prev.selectedLeaves || [];
      const exists = current.includes(leafId);
      const next = exists
        ? current.filter((id) => id !== leafId)
        : [...current, leafId];
      return {
        ...prev,
        selectedLeaves: next,
      };
    });
  };

  const handleClearCatalogLeaves = () => {
    setConfig((prev) => ({
      ...prev,
      selectedLeaves: [],
    }));
  };

  const handlePhotoFileSelected = (file: File | null | undefined) => {
    if (!file) return;
    const isImageMime =
      file.type.startsWith('image/') ||
      /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(file.name);
    if (!isImageMime) {
      setStatus({
        text: 'Please choose an image file (JPG, PNG, WebP, etc.) for 3D relief interpretation.',
        kind: 'warn',
      });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setStatus({
        text: 'Could not read that photo in the browser. Try another image file.',
        kind: 'warn',
      });
    };
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result.startsWith('data:image/')) {
        setStatus({
          text: 'That file did not load as a valid browser image. Try a JPG, PNG, or WebP photo.',
          kind: 'warn',
        });
        return;
      }
      const probe = new Image();
      probe.onload = () => {
        if (probe.naturalWidth <= 0 || probe.naturalHeight <= 0) {
          setStatus({
            text: 'The uploaded image appears empty or unreadable.',
            kind: 'warn',
          });
          return;
        }
        setUploadedPhoto((prev) => ({
          fileName: file.name,
          dataUrl: result,
          reliefDepth: prev?.reliefDepth ?? 0.65,
          dimensions: [],
          calibration: null,
        }));
        setStatus({
          text: `Loaded "${file.name}" across 3D View, 2D Blueprint, and Isometric View.`,
          kind: 'ok',
        });
      };
      probe.onerror = () => {
        setStatus({
          text: 'Could not decode that image file — try a standard JPG, PNG, or WebP photo.',
          kind: 'warn',
        });
      };
      probe.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    handlePhotoFileSelected(file);
  };

  const handleRemoveUploadedPhoto = () => {
    setUploadedPhoto(null);
    setPendingDimStart(null);
    setPendingCalStart(null);
    setDraftCalSpan(null);
    setSelectedPhotoDimId(null);
    setStatus({
      text: 'Removed uploaded photo and restored your configured piece in 3D, 2D Blueprint, and Isometric View.',
      kind: 'ok',
    });
  };

  const handleViewportDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!is3DViewportActive) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isPhotoDragActive) setIsPhotoDragActive(true);
  };

  const handleViewportDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!is3DViewportActive) return;
    e.preventDefault();
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (!related || !e.currentTarget.contains(related)) {
      setIsPhotoDragActive(false);
    }
  };

  const handleViewportDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!is3DViewportActive) return;
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    handlePhotoFileSelected(file);
  };

  const applyColorHex = (hex: string) => {
    if (selectedColorTarget === 'whole') {
      setConfig((prev) => ({ ...prev, customColor: hex }));
    } else {
      setConfig((prev) => ({
        ...prev,
        areaColors: {
          ...prev.areaColors,
          [selectedColorTarget]: hex,
        },
      }));
    }
  };

  const applyGradientColor = (h: number, s: number, l: number) => {
    const hex = hslToHex(h, s, l);
    setGradientHue(h);
    setGradientSat(s);
    setGradientLight(l);
    applyColorHex(hex);
  };

  const handleGradientScaleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    const yRatio = Math.max(
      0,
      Math.min(1, (e.clientY - rect.top) / rect.height),
    );
    const hue = Math.round(xRatio * 360);
    const light = Math.round(78 - yRatio * 64);
    applyGradientColor(hue, gradientSat, light);
  };

  const handleResetSelectedArea = () => {
    if (selectedColorTarget === 'whole') {
      setConfig((prev) => ({ ...prev, customColor: null }));
      return;
    }
    setConfig((prev) => {
      const nextAreas = { ...prev.areaColors };
      delete nextAreas[selectedColorTarget];
      return { ...prev, areaColors: nextAreas };
    });
  };

  const handleResetAllColors = () => {
    setConfig((prev) => ({
      ...prev,
      customColor: null,
      areaColors: {},
    }));
  };

  const handleStudioFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingSampleArt(true);
    try {
      const prevPreview = config.sampleArt?.previewUrl;
      const prevDownload = config.sampleArt?.downloadUrl;
      const parsed = await processUploadedStudioFile(file);
      if (prevPreview && prevPreview.startsWith('blob:')) {
        URL.revokeObjectURL(prevPreview);
      }
      if (prevDownload && prevDownload !== prevPreview && prevDownload.startsWith('blob:')) {
        URL.revokeObjectURL(prevDownload);
      }
      setConfig((prev) => ({ ...prev, sampleArt: parsed }));
      if (parsed.kind === 'photo') {
        setStatus({
          text: `Loaded "${parsed.fileName}" — reference preview ready with browser-generated 3D relief heightmap and flat plasma cut-pattern outline.`,
          kind: 'ok',
        });
      } else if (parsed.kind === 'model3d') {
        setStatus({
          text: `Loaded 3D model "${parsed.fileName}" directly into the 3D studio scene.`,
          kind: 'ok',
        });
      } else if (parsed.kind === 'dxf' || parsed.kind === 'svg') {
        const segCount = parsed.cutSegments?.length ?? 0;
        setStatus({
          text: `Loaded drawing "${parsed.fileName}" (${segCount} outline segments ready for cut pattern & 3D preview).`,
          kind: 'ok',
        });
      } else {
        setStatus({
          text: `Attached "${parsed.fileName}" — stored as a reference — needs conversion to use in the model.`,
          kind: 'ok',
        });
      }
    } catch (err) {
      setStatus({
        text:
          err instanceof Error
            ? `Could not read file: ${err.message}`
            : 'Could not read the uploaded file.',
        kind: 'warn',
      });
    } finally {
      setUploadingSampleArt(false);
    }
  };

  const clearSampleArt = () => {
    if (config.sampleArt?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(config.sampleArt.previewUrl);
    }
    if (config.sampleArt?.downloadUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(config.sampleArt.downloadUrl);
    }
    setConfig((prev) => ({ ...prev, sampleArt: null }));
  };

  const handleSignPictureUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingSignPic(true);
    try {
      const prevPreview = config.signPicture?.previewUrl;
      const parsed = await processSignPictureFile(file);
      if (prevPreview && prevPreview.startsWith('blob:')) {
        URL.revokeObjectURL(prevPreview);
      }
      setConfig((prev) => ({ ...prev, signPicture: parsed }));
      setStatus({
        text: parsed.needsConversion
          ? `Attached "${parsed.fileName}" to Sign Frame — stored as a reference — needs conversion to use in the model.`
          : `Placed "${parsed.fileName}" on Sign Frame face — move or resize below.`,
        kind: 'ok',
      });
    } finally {
      setUploadingSignPic(false);
    }
  };

  const clearSignPicture = () => {
    if (config.signPicture?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(config.signPicture.previewUrl);
    }
    setConfig((prev) => ({ ...prev, signPicture: null }));
  };

  const handleDetectInstalledFonts = async () => {
    const fn = (window as unknown as { queryLocalFonts?: () => Promise<Array<{ family: string }>> }).queryLocalFonts;
    if (typeof fn !== 'function') {
      setLocalFontsChecked(true);
      setStatus({
        text: 'Your browser does not expose local installed fonts — all 45 Google Fonts & standard System Fonts remain available in the picker.',
        kind: 'ok',
      });
      return;
    }
    try {
      const list = await fn();
      const seen = new Set(SIGN_FONT_LIBRARY.map((f) => f.label.toLowerCase()));
      const extras: FontOption[] = [];
      list.forEach((f) => {
        if (f.family && !seen.has(f.family.toLowerCase())) {
          seen.add(f.family.toLowerCase());
          extras.push({
            family: `'${f.family}', sans-serif`,
            label: `${f.family} (Installed)`,
            category: 'System',
          });
        }
      });
      setInstalledFonts(extras.slice(0, 120));
      setLocalFontsChecked(true);
      setStatus({
        text: `Loaded ${extras.length} installed fonts from your computer into the Sign Frame font picker.`,
        kind: 'ok',
      });
    } catch {
      setLocalFontsChecked(true);
      setStatus({
        text: 'Local font access was declined — using all built-in Google Fonts & standard System Fonts.',
        kind: 'ok',
      });
    }
  };

  const getCanvasNormPos = (
    canvas: HTMLCanvasElement | null,
    e: ReactPointerEvent<HTMLCanvasElement>,
  ): [number, number] | null => {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return [
      +Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)).toFixed(4),
      +Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)).toFixed(4),
    ];
  };

  const handleSignDrawDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasNormPos(signDrawCanvasRef.current, e);
    if (!pt) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setActiveStroke({
      color: config.signDrawColor,
      width: config.signDrawWidth,
      points: [pt],
    });
  };

  const handleSignDrawMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!activeStroke) return;
    const pt = getCanvasNormPos(signDrawCanvasRef.current, e);
    if (!pt) return;
    setActiveStroke((prev) =>
      prev ? { ...prev, points: [...prev.points, pt] } : null,
    );
  };

  const handleSignDrawUp = () => {
    if (!activeStroke) return;
    const finished = activeStroke;
    setActiveStroke(null);
    if (finished.points.length > 0) {
      setConfig((prev) => ({
        ...prev,
        signStrokes: [...prev.signStrokes, finished],
      }));
    }
  };

  // Free drawing handlers for 3D overlay
  const handle3DDrawDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (interactionMode !== 'draw') return;
    const pt = getCanvasNormPos(canvas3dDrawRef.current, e);
    if (!pt) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setActiveFreeStroke3D({
      color: config.freeDrawColor,
      width: config.freeDrawWidth,
      points: [pt],
    });
  };

  const handle3DDrawMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!activeFreeStroke3D || interactionMode !== 'draw') return;
    const pt = getCanvasNormPos(canvas3dDrawRef.current, e);
    if (!pt) return;
    setActiveFreeStroke3D((prev) =>
      prev ? { ...prev, points: [...prev.points, pt] } : null,
    );
  };

  const handle3DDrawUp = () => {
    if (!activeFreeStroke3D) return;
    const finished = activeFreeStroke3D;
    setActiveFreeStroke3D(null);
    if (finished.points.length > 0) {
      setConfig((prev) => ({
        ...prev,
        freeDrawStrokes3D: [...prev.freeDrawStrokes3D, finished],
      }));
    }
  };

  const getPhotoNormFromClient = (
    clientX: number,
    clientY: number,
    requireInside = false,
  ): [number, number] | null => {
    const canvas = blueprintCanvasRef.current;
    if (!canvas || !photoReliefEntry) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const cx = ((clientX - rect.left) / rect.width) * 1100;
    const cy = ((clientY - rect.top) / rect.height) * 740;
    const pRect = getUploadedPhoto2DRect(photoReliefEntry.aspect);
    if (
      requireInside &&
      (cx < pRect.x - 10 ||
        cx > pRect.x + pRect.w + 10 ||
        cy < pRect.y - 10 ||
        cy > pRect.y + pRect.h + 10)
    ) {
      return null;
    }
    const nx = +Math.max(0, Math.min(1, (cx - pRect.x) / pRect.w)).toFixed(4);
    const ny = +Math.max(0, Math.min(1, (cy - pRect.y) / pRect.h)).toFixed(4);
    return [nx, ny];
  };

  const handleDeletePhotoDimension = (dimId: string) => {
    setUploadedPhoto((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dimensions: (prev.dimensions || []).filter((d) => d.id !== dimId),
      };
    });
    if (selectedPhotoDimId === dimId) setSelectedPhotoDimId(null);
  };

  const handleClearAllPhotoDimensions = () => {
    setUploadedPhoto((prev) => (prev ? { ...prev, dimensions: [] } : prev));
    setPendingDimStart(null);
    setSelectedPhotoDimId(null);
  };

  const handleApplyPhotoScaleCalibration = () => {
    const val = parseFloat(calLengthInput);
    if (!draftCalSpan || !Number.isFinite(val) || val <= 0) {
      setStatus({
        text: 'Enter a valid positive number for the known length to calibrate scale.',
        kind: 'warn',
      });
      return;
    }
    setUploadedPhoto((prev) =>
      prev
        ? {
            ...prev,
            calibration: {
              ...draftCalSpan,
              knownLength: val,
              unit: calUnitInput,
              featureLabel: calFeatureInput.trim() || undefined,
            },
          }
        : prev,
    );
    setDraftCalSpan(null);
    setPendingCalStart(null);
    setPhoto2DMode('add');
    setStatus({
      text: `Scale calibrated (${calFeatureInput.trim() || 'reference span'} = ${val} ${calUnitInput}). Existing and new dimensions now show real-world lengths.`,
      kind: 'ok',
    });
  };

  const handleClearPhotoCalibration = () => {
    setUploadedPhoto((prev) => (prev ? { ...prev, calibration: null } : prev));
    setPendingCalStart(null);
    setDraftCalSpan(null);
    setStatus({
      text: 'Scale calibration cleared — dimensions reverted to % of photo width.',
      kind: 'ok',
    });
  };

  const startPhotoHandleDrag = (
    kind: 'p1' | 'p2' | 'move',
    dim: PhotoDimension,
    e: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    const norm = getPhotoNormFromClient(e.clientX, e.clientY, false);
    if (!norm) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedPhotoDimId(dim.id);
    photoDragRef.current = {
      kind,
      dimId: dim.id,
      startNorm: norm,
      orig: { ...dim },
    };
  };

  const movePhotoHandleDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = photoDragRef.current;
    if (!drag) return;
    e.stopPropagation();
    const norm = getPhotoNormFromClient(e.clientX, e.clientY, false);
    if (!norm) return;
    const [nx, ny] = norm;
    setUploadedPhoto((prev) => {
      if (!prev) return prev;
      const nextDims = (prev.dimensions || []).map((d) => {
        if (d.id !== drag.dimId) return d;
        if (drag.kind === 'p1') {
          return { ...d, x1: nx, y1: ny };
        }
        if (drag.kind === 'p2') {
          return { ...d, x2: nx, y2: ny };
        }
        let dx = nx - drag.startNorm[0];
        let dy = ny - drag.startNorm[1];
        const minX = Math.min(drag.orig.x1, drag.orig.x2);
        const maxX = Math.max(drag.orig.x1, drag.orig.x2);
        const minY = Math.min(drag.orig.y1, drag.orig.y2);
        const maxY = Math.max(drag.orig.y1, drag.orig.y2);
        if (minX + dx < 0) dx = -minX;
        if (maxX + dx > 1) dx = 1 - maxX;
        if (minY + dy < 0) dy = -minY;
        if (maxY + dy > 1) dy = 1 - maxY;
        return {
          ...d,
          x1: +(drag.orig.x1 + dx).toFixed(4),
          y1: +(drag.orig.y1 + dy).toFixed(4),
          x2: +(drag.orig.x2 + dx).toFixed(4),
          y2: +(drag.orig.y2 + dy).toFixed(4),
        };
      });
      return { ...prev, dimensions: nextDims };
    });
  };

  const endPhotoHandleDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!photoDragRef.current) return;
    e.stopPropagation();
    photoDragRef.current = null;
  };

  // Pointer handlers for 2D Blueprint (free drawing + photo tap-to-dimension / calibrate + picket select)
  const handle2DCanvasDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasNormPos(blueprintCanvasRef.current, e);
    if (!pt) return;
    if (interactionMode === 'draw') {
      e.currentTarget.setPointerCapture(e.pointerId);
      setActiveFreeStroke2D({
        color: config.freeDrawColor,
        width: config.freeDrawWidth,
        points: [pt],
      });
      return;
    }

    if (uploadedPhoto) {
      if (e.isPrimary && (photo2DMode === 'add' || photo2DMode === 'calibrate')) {
        canvas2dTapRef.current = {
          pointerId: e.pointerId,
          clientX: e.clientX,
          clientY: e.clientY,
        };
      }
      return;
    }

    const hitIdx = hitTestBlueprintPicket(pt[0], pt[1], config);
    if (hitIdx !== null) {
      setConfig((prev) => ({ ...prev, selectedPicketIndex: hitIdx }));
      setStatus({
        text: `Selected Picket #${hitIdx + 1} on 2D Blueprint — tap Knuckle, Emblem, or Leaf to attach an accent.`,
        kind: 'ok',
      });
    }
  };

  const handle2DCanvasMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!activeFreeStroke2D || interactionMode !== 'draw') return;
    const pt = getCanvasNormPos(blueprintCanvasRef.current, e);
    if (!pt) return;
    setActiveFreeStroke2D((prev) =>
      prev ? { ...prev, points: [...prev.points, pt] } : null,
    );
  };

  const handle2DCanvasUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activeFreeStroke2D) {
      const finished = activeFreeStroke2D;
      setActiveFreeStroke2D(null);
      if (finished.points.length > 0) {
        setConfig((prev) => ({
          ...prev,
          freeDrawStrokes2D: [...prev.freeDrawStrokes2D, finished],
        }));
      }
      return;
    }

    if (
      uploadedPhoto &&
      canvas2dTapRef.current &&
      canvas2dTapRef.current.pointerId === e.pointerId
    ) {
      const tapStart = canvas2dTapRef.current;
      canvas2dTapRef.current = null;
      const moveDist = Math.hypot(
        e.clientX - tapStart.clientX,
        e.clientY - tapStart.clientY,
      );
      if (moveDist > 14) return;
      const norm = getPhotoNormFromClient(e.clientX, e.clientY, true);
      if (!norm) return;

      if (photo2DMode === 'calibrate') {
        if (!pendingCalStart) {
          setPendingCalStart(norm);
          setDraftCalSpan(null);
        } else {
          if (Math.hypot(norm[0] - pendingCalStart[0], norm[1] - pendingCalStart[1]) < 0.008) {
            setStatus({
              text: 'Tap a second calibration point farther from the first point.',
              kind: 'warn',
            });
            return;
          }
          setDraftCalSpan({
            x1: pendingCalStart[0],
            y1: pendingCalStart[1],
            x2: norm[0],
            y2: norm[1],
          });
          setPendingCalStart(null);
        }
        return;
      }

      if (photo2DMode === 'add') {
        if (!pendingDimStart) {
          setPendingDimStart(norm);
        } else {
          if (Math.hypot(norm[0] - pendingDimStart[0], norm[1] - pendingDimStart[1]) < 0.008) {
            setStatus({
              text: 'Tap a second point farther away to finish this dimension.',
              kind: 'warn',
            });
            return;
          }
          const newDim: PhotoDimension = {
            id: `dim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            x1: pendingDimStart[0],
            y1: pendingDimStart[1],
            x2: norm[0],
            y2: norm[1],
          };
          setPendingDimStart(null);
          setSelectedPhotoDimId(newDim.id);
          setUploadedPhoto((prev) =>
            prev
              ? {
                  ...prev,
                  dimensions: [...(prev.dimensions || []), newDim],
                }
              : prev,
          );
        }
      }
    }
  };

  // Tap-to-place & remove picket accents without unfreezing or moving camera
  const handleAttachAccentToSelected = (accent: PicketAccentType) => {
    setActiveAccentTool(accent);
    if (!supportsPickets) {
      setStatus({
        text: 'Pickets are available on Gate and Railing (non-solid style). Switch piece type to add picket accents.',
        kind: 'warn',
      });
      return;
    }
    if (
      config.selectedPicketIndex === null ||
      config.selectedPicketIndex < 0 ||
      config.selectedPicketIndex >= picketStats.totalPickets
    ) {
      setStatus({
        text: `Accent tool "${accent}" selected — tap or click any picket on the 3D or 2D model first to select it.`,
        kind: 'ok',
      });
      return;
    }
    const idx = config.selectedPicketIndex;
    setConfig((prev) => {
      const existing = prev.picketAccents[idx] || [];
      return {
        ...prev,
        picketAccents: {
          ...prev.picketAccents,
          [idx]: [...existing, accent],
        },
      };
    });
    const labelMap: Record<PicketAccentType, string> = {
      knuckle: 'Knuckle',
      emblem: 'Emblem',
      leaf: 'Leaf',
    };
    setStatus({
      text: `Attached ${labelMap[accent]} to Picket #${idx + 1}.`,
      kind: 'ok',
    });
  };

  const handleRemoveAccentFromSelected = (removeIndex?: number) => {
    const idx = config.selectedPicketIndex;
    if (idx === null) return;
    setConfig((prev) => {
      const existing = prev.picketAccents[idx] || [];
      if (!existing.length) return prev;
      const nextList =
        typeof removeIndex === 'number'
          ? existing.filter((_, i) => i !== removeIndex)
          : existing.slice(0, -1);
      const nextAccents = { ...prev.picketAccents };
      if (nextList.length === 0) {
        delete nextAccents[idx];
      } else {
        nextAccents[idx] = nextList;
      }
      return {
        ...prev,
        picketAccents: nextAccents,
      };
    });
    setStatus({
      text: `Removed accent from Picket #${idx + 1}.`,
      kind: 'ok',
    });
  };

  const updateDimensionValue = (
    field: 'width' | 'height' | 'depth',
    rawValue: string,
  ) => {
    const parsed = parseFloat(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setConfig((prev) => ({
      ...prev,
      [field]: Math.min(200, Math.max(0.25, parsed)),
    }));
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 4000);
  };

  const handleDownloadDxf = () => {
    const { content, entityCount, widthIn, heightIn } = generateCutDxf(config);
    const blob = new Blob([content], { type: 'application/dxf' });
    downloadBlob(blob, `rays-ironworks-${config.piece}-cut.dxf`);
    setStatus({
      text: `DXF file saved for CNC plasma table (${widthIn}" × ${heightIn}", ${entityCount} vector entities on CUT layer).`,
      kind: 'ok',
    });
  };

  const handleDownloadStl = () => {
    if (!sceneRef.current || webglFailed) {
      setStatus({
        text: '3D model STL export requires the 3D scene to be active.',
        kind: 'warn',
      });
      return;
    }
    const blob = sceneRef.current.exportStl();
    if (!blob || !blob.size) {
      setStatus({
        text: 'Could not generate STL mesh for this configuration.',
        kind: 'warn',
      });
      return;
    }
    downloadBlob(blob, `rays-ironworks-${config.piece}.stl`);
    setStatus({
      text: `3D STL model saved (${Math.round(blob.size / 1024)} KB, scaled in inches for 3D printing or CNC).`,
      kind: 'ok',
    });
  };

  const handleCaptureStill = async () => {
    if (!sceneRef.current || webglFailed) {
      setStatus({
        text: 'The 3D viewer is not available in this browser — use the 2D Blueprint view or technical drawings.',
        kind: 'warn',
      });
      return;
    }
    const blob = await sceneRef.current.captureStill();
    if (!blob) {
      setStatus({
        text: 'The still image could not be captured in this browser.',
        kind: 'warn',
      });
      return;
    }
    if (config.freeDrawStrokes3D.length > 0) {
      try {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('load failed'));
          img.src = url;
        });
        const comp = document.createElement('canvas');
        comp.width = img.naturalWidth || 1280;
        comp.height = img.naturalHeight || 720;
        const cctx = comp.getContext('2d');
        if (cctx) {
          cctx.drawImage(img, 0, 0, comp.width, comp.height);
          drawFreeStrokesOverlay(cctx, config.freeDrawStrokes3D, comp.width, comp.height);
          URL.revokeObjectURL(url);
          const mergedBlob = await new Promise<Blob | null>((res) =>
            comp.toBlob(res, 'image/png'),
          );
          if (mergedBlob) {
            downloadBlob(mergedBlob, 'rays-ironworks-design.png');
            setStatus({
              text: 'Still image saved (PNG) with 3D model and your free-draw sketch.',
              kind: 'ok',
            });
            return;
          }
        }
        URL.revokeObjectURL(url);
      } catch {
        // fallback to base still
      }
    }
    downloadBlob(blob, 'rays-ironworks-design.png');
    setStatus({
      text: 'Still image saved (PNG). This is a visualization of your configured piece — the finished piece is built by Ray to your exact measurements.',
      kind: 'ok',
    });
  };

  const handleRecordTurntable = () => {
    if (!sceneRef.current || webglFailed) {
      setStatus({
        text: 'Video recording is not available without the 3D viewer.',
        kind: 'warn',
      });
      return;
    }
    setRecording(true);
    setStatus({
      text: 'Recording your turntable video… one full rotation, about 8 seconds.',
      kind: '',
    });

    sceneRef.current.recordTurntable(
      (sec) => {
        setStatus({
          text: `Recording your turntable video… ${sec} of 8 seconds.`,
          kind: '',
        });
      },
      (blob, ext, error) => {
        setRecording(false);
        if (error || !blob) {
          setStatus({
            text:
              error ||
              'Video recording is not available in this browser — use “Still PNG” instead.',
            kind: 'warn',
          });
          return;
        }
        downloadBlob(blob, `rays-ironworks-turntable.${ext}`);
        setStatus({
          text: `Turntable video saved (${ext.toUpperCase()}, one full rotation). This is a visualization of your configured piece — the finished piece is built by Ray to your exact measurements.`,
          kind: 'ok',
        });
      },
    );
  };

  const handleDownloadPdf = () => {
    const blob = generateCutSpecPdf(config);
    downloadBlob(blob, `rays-ironworks-${config.piece}-spec.pdf`);
    setStatus({
      text: 'PDF cut sheet & shop specification saved with dimensions, supplier catalog sizes, and BOM.',
      kind: 'ok',
    });
  };

  const handleDownloadByFormat = (fmt: CutShareFormat) => {
    if (fmt === 'dxf') handleDownloadDxf();
    else if (fmt === 'stl') handleDownloadStl();
    else handleDownloadPdf();
  };

  const handleGenerateShareLink = async (fmt: CutShareFormat = shareFormat) => {
    const url = await encodeCutShareUrl(config, fmt);
    setShareUrl(url);
    setShareCopied(false);
    setStatus({
      text: `Shareable ${fmt.toUpperCase()} cut link created — copy it or share by email.`,
      kind: 'ok',
    });
    return url;
  };

  const handleCopyShareLink = async () => {
    const url = shareUrl || (await handleGenerateShareLink(shareFormat));
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      setStatus({
        text: 'Select and copy the share link from the box below.',
        kind: 'ok',
      });
    }
  };

  const handleDownloadBlueprint = () => {
    const bp = blueprintCanvasRef.current;
    if (!bp) return;
    drawBlueprint(bp, config, uploadedPhoto);
    bp.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(
        blob,
        uploadedPhoto
          ? 'rays-ironworks-photo-2d-elevation.png'
          : 'rays-ironworks-blueprint.png',
      );
      setStatus({
        text: uploadedPhoto
          ? 'Uploaded Photo 2D Elevation Blueprint saved (PNG) with dimensions and scale notes.'
          : '2D Technical Blueprint saved (PNG) with dimensions, thickness callouts, isometric view, and materials list.',
        kind: 'ok',
      });
    }, 'image/png');
  };

  const handleDownloadTechnicalPng = () => {
    const c = techCanvasRef.current;
    if (!c) return;
    drawTechnicalDrawing(c, config);
    c.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, `rays-ironworks-${config.piece}-technical-drawing.png`);
      setStatus({
        text: 'Technical Drawing saved as PNG with live front elevation dimensions, picket count/spacing, and BOM.',
        kind: 'ok',
      });
    }, 'image/png');
  };

  const handleDownloadTechnicalPdf = () => {
    const c = techCanvasRef.current;
    if (!c) return;
    drawTechnicalDrawing(c, config);
    const blob = generateCanvasPdfBlob(
      c,
      `Ray's Ironworks - Technical Drawing (${PIECES[config.piece].label})`,
    );
    downloadBlob(blob, `rays-ironworks-${config.piece}-technical-drawing.pdf`);
    setStatus({
      text: 'Technical Drawing saved as PDF.',
      kind: 'ok',
    });
  };

  const handleDownloadIsometricPng = () => {
    const c = isoCanvasRef.current;
    if (!c) return;
    drawIsometricBlueprint(c, config, uploadedPhoto);
    c.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(
        blob,
        uploadedPhoto
          ? 'rays-ironworks-photo-isometric.png'
          : `rays-ironworks-${config.piece}-isometric-blueprint.png`,
      );
      setStatus({
        text: uploadedPhoto
          ? 'Uploaded Photo Isometric View saved as PNG.'
          : 'Isometric Blueprint View saved as PNG.',
        kind: 'ok',
      });
    }, 'image/png');
  };

  const handleDownloadIsometricPdf = () => {
    const c = isoCanvasRef.current;
    if (!c) return;
    drawIsometricBlueprint(c, config, uploadedPhoto);
    const blob = generateCanvasPdfBlob(
      c,
      uploadedPhoto
        ? "Ray's Ironworks - Uploaded Photo Isometric View"
        : `Ray's Ironworks - Isometric Blueprint View (${PIECES[config.piece].label})`,
    );
    downloadBlob(
      blob,
      uploadedPhoto
        ? 'rays-ironworks-photo-isometric.pdf'
        : `rays-ironworks-${config.piece}-isometric-blueprint.pdf`,
    );
    setStatus({
      text: uploadedPhoto
        ? 'Uploaded Photo Isometric View saved as PDF.'
        : 'Isometric Blueprint View saved as PDF.',
      kind: 'ok',
    });
  };

  const handleDownloadCutListPng = () => {
    const c = cutListCanvasRef.current;
    if (!c) return;
    drawMaterialCutListSchematic(c, config);
    c.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(
        blob,
        `rays-ironworks-${config.piece}-material-cut-list-schematic.png`,
      );
      setStatus({
        text: 'Material Cut List & Assembly Schematic saved as PNG.',
        kind: 'ok',
      });
    }, 'image/png');
  };

  const handleDownloadCutListPdf = () => {
    const c = cutListCanvasRef.current;
    if (!c) return;
    drawMaterialCutListSchematic(c, config);
    const blob = generateCanvasPdfBlob(
      c,
      `Ray's Ironworks - Material Cut List & Schematic (${PIECES[config.piece].label})`,
    );
    downloadBlob(
      blob,
      `rays-ironworks-${config.piece}-material-cut-list.pdf`,
    );
    setStatus({
      text: 'Material Cut List & Assembly Schematic saved as PDF.',
      kind: 'ok',
    });
  };

  const handleDownloadCutListCsv = () => {
    const escapeCsv = (val: string) =>
      `"${String(val).replace(/"/g, '""')}"`;
    const headers = [
      'Tag',
      'Category',
      'Component',
      'Stock / Specification',
      'Qty',
      'Cut Length / Size',
      'Total Measure',
      'Shop Notes',
    ];
    const rows = detailedCutList.items.map((item) =>
      [
        item.tag,
        item.category,
        item.part,
        item.stockProfile,
        item.qty,
        item.cutLength,
        item.totalMeasure,
        item.notes,
      ]
        .map(escapeCsv)
        .join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `rays-ironworks-${config.piece}-material-cut-list.csv`);
    setStatus({
      text: `Exported ${detailedCutList.items.length} itemized cut list rows as CSV.`,
      kind: 'ok',
    });
  };

  return (
    <div className="bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl p-4 sm:p-6 mt-7">
      {/* Studio intro + Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#2a2a2e]">
        <div>
          <p className="font-display uppercase tracking-[0.22em] text-xs sm:text-sm text-[#c9883d] mb-1">
            Try it in 3D — realistic rendering
          </p>
          <h3 className="text-2xl sm:text-3xl text-[#e8a317] m-0">
            Design Studio — drag to rotate
          </h3>
          <p className="text-sm sm:text-base text-[#cfc9bf] mt-2 mb-0 max-w-2xl">
            Configure a gate, railing, sculpture base, sign frame, or patio
            cover frame. Tap directly on parts of the 3D piece to color
            specific areas, upload sample art for browser relief/cut outlines,
            check the 2D Blueprint, or export DXF, STL, Blueprint PNG, Still PNG,
            or Turntable Video.
          </p>
        </div>

        {/* Studio Mode Tabs */}
        <div
          className="inline-flex flex-wrap p-1 rounded-lg bg-[#101012] border border-[#2a2a2e] gap-1 shrink-0"
          role="tablist"
          aria-label="Design studio tabs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={studioTab === '3d'}
            onClick={() => setStudioTab('3d')}
            className={`font-display uppercase tracking-[0.06em] text-sm px-3.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              studioTab === '3d'
                ? 'bg-[#c9883d] text-[#141210] font-semibold'
                : 'text-[#cfc9bf] hover:text-[#f2efe8]'
            }`}
          >
            3D View
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={studioTab === '2d'}
            onClick={() => setStudioTab('2d')}
            className={`font-display uppercase tracking-[0.06em] text-sm px-3.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              studioTab === '2d'
                ? 'bg-[#c9883d] text-[#141210] font-semibold'
                : 'text-[#cfc9bf] hover:text-[#f2efe8]'
            }`}
          >
            2D Blueprint
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={studioTab === 'sign'}
            onClick={() => setStudioTab('sign')}
            className={`inline-flex items-center gap-1.5 font-display uppercase tracking-[0.06em] text-sm px-3.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              studioTab === 'sign'
                ? 'bg-[#c9883d] text-[#141210] font-semibold'
                : 'text-[#cfc9bf] hover:text-[#f2efe8]'
            }`}
          >
            <Type className="w-3.5 h-3.5" aria-hidden="true" />
            Sign Lettering
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={studioTab === 'isometric'}
            onClick={() => setStudioTab('isometric')}
            className={`inline-flex items-center gap-1.5 font-display uppercase tracking-[0.06em] text-sm px-3.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              studioTab === 'isometric'
                ? 'bg-[#c9883d] text-[#141210] font-semibold'
                : 'text-[#cfc9bf] hover:text-[#f2efe8]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            Isometric Blueprint View
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={studioTab === 'color'}
            onClick={() => setStudioTab('color')}
            className={`inline-flex items-center gap-1.5 font-display uppercase tracking-[0.06em] text-sm px-3.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              studioTab === 'color'
                ? 'bg-[#c9883d] text-[#141210] font-semibold'
                : 'text-[#cfc9bf] hover:text-[#f2efe8]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" aria-hidden="true" />
            Color
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={studioTab === 'pickets'}
            onClick={() => setStudioTab('pickets')}
            className={`inline-flex items-center gap-1.5 font-display uppercase tracking-[0.06em] text-sm px-3.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              studioTab === 'pickets'
                ? 'bg-[#c9883d] text-[#141210] font-semibold'
                : 'text-[#cfc9bf] hover:text-[#f2efe8]'
            }`}
          >
            <Grid2x2 className="w-3.5 h-3.5" aria-hidden="true" />
            Pickets
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={studioTab === 'cutlist'}
            onClick={() => setStudioTab('cutlist')}
            className={`inline-flex items-center gap-1.5 font-display uppercase tracking-[0.06em] text-sm px-3.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              studioTab === 'cutlist'
                ? 'bg-[#c9883d] text-[#141210] font-semibold'
                : 'text-[#cfc9bf] hover:text-[#f2efe8]'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
            Material Cut List
          </button>
        </div>
      </div>

      {/* Piece Type Selector Bar */}
      <div
        className="flex flex-wrap gap-2 py-4 border-b border-[#2a2a2e]"
        role="tablist"
        aria-label="Piece type"
      >
        {PIECE_ORDER.map((key) => {
          const active = config.piece === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handlePieceChange(key)}
              className={`font-display uppercase tracking-[0.06em] text-sm px-4 py-2 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#c9883d] text-[#141210] border-[#c9883d] font-semibold'
                  : 'bg-[#141416] text-[#cfc9bf] border-[#2a2a2e] hover:border-[#c9883d]/60 hover:text-[#f2efe8]'
              }`}
            >
              {PIECES[key].label}
            </button>
          );
        })}
      </div>

      {/* NEW Technical Drawing Tab — Placed Directly Under Piece-Type Selector Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-[#2a2a2e]"
        role="tablist"
        aria-label="Technical Drawing sheet"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={studioTab === 'technical'}
            onClick={() =>
              setStudioTab((cur) => (cur === 'technical' ? '3d' : 'technical'))
            }
            className={`inline-flex items-center gap-2 font-display uppercase tracking-[0.08em] text-sm px-4 py-2 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              studioTab === 'technical'
                ? 'bg-[#e8a317] text-[#141210] border-[#e8a317] font-bold'
                : 'bg-[#141416] text-[#e8a317] border-[#c9883d]/60 hover:border-[#e8a317]'
            }`}
          >
            <Ruler className="w-4 h-4 shrink-0" aria-hidden="true" />
            Technical Drawing
          </button>
          <span className="text-xs text-[#a8a29a] tabular-nums">
            Live Front Elevation · {formatFeetInches(config.width)} ×{' '}
            {formatFeetInches(config.height)}
            {picketStats.supportsPickets
              ? ` · ${picketStats.totalPickets} pickets @ ${config.picketSpacing}" O.C.`
              : ''}
            {picketStats.totalAccents > 0
              ? ` · Knuckles: ${picketStats.accentCounts.knuckle}, Emblems: ${picketStats.accentCounts.emblem}, Leaves: ${picketStats.accentCounts.leaf}`
              : ''}
          </span>
        </div>
        {studioTab === 'technical' && (
          <button
            type="button"
            onClick={() => setStudioTab('3d')}
            className="text-xs text-[#cfc9bf] hover:text-[#e8a317] px-2.5 py-1 rounded border border-[#2a2a2e] bg-[#141416] cursor-pointer"
          >
            Back to 3D View
          </button>
        )}
      </div>

      {/* Incoming Shared Cut File Banner when opened via #cut= link */}
      {initialCutShare && !sharedBannerDismissed && (
        <div className="mt-4 bg-[#1a1409] border border-[#e8a317] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-display uppercase tracking-[0.14em] text-xs text-[#e8a317] m-0">
              Shared Cut File Opened
            </p>
            <p className="text-sm text-[#f2efe8] m-0 mt-0.5">
              This link loaded a configured {PIECES[config.piece].label} for a{' '}
              <strong>{initialCutShare.format.toUpperCase()}</strong> cut download.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadByFormat(initialCutShare.format)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#e8a317] hover:bg-[#c9883d] text-[#141210] font-bold text-xs cursor-pointer"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Download Shared {initialCutShare.format.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => setSharedBannerDismissed(true)}
              className="px-3 py-2 rounded-lg border border-[#2a2a2e] bg-[#141416] text-xs text-[#cfc9bf] hover:text-[#f2efe8] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Upload Sample Art Studio Strip */}
      <div className="mt-4 bg-[#141416] border border-[#2a2a2e] rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <ImagePlus
                className="w-4 h-4 text-[#e8a317] shrink-0"
                aria-hidden="true"
              />
              <h4 className="font-display uppercase tracking-[0.12em] text-xs sm:text-sm text-[#e8a317] m-0">
                Upload sample art
              </h4>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1c1a16] border border-[#c9883d]/40 text-[#e8c97a]">
                All file types accepted
              </span>
            </div>
            <p className="text-xs text-[#cfc9bf] m-0 max-w-2xl">
              Upload photos, drawings (SVG/DXF), 3D models (STL/OBJ/GLB/GLTF/PLY/3MF/FBX),
              or any reference file (DWG/STEP/IGES/EPS/AI/PDF/DOC/TXT). Photos
              build a browser heightmap 3D relief &amp; flat plasma cut outline; 3D
              models load directly into the scene.
            </p>
            <p className="text-[11px] text-[#a8a29a] m-0">
              Honest note: the 3D relief is generated from your photo&apos;s
              brightness in the browser — it is NOT a full AI image-to-3D
              reconstruction. True AI image-to-3D is a future step, not part of
              this build.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <input
              ref={sampleArtInputRef}
              type="file"
              accept="*/*"
              onChange={handleStudioFileUpload}
              className="hidden"
              id="studio-sample-art-input"
            />
            <button
              type="button"
              disabled={uploadingSampleArt}
              onClick={() => sampleArtInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#c9883d]/70 bg-[#1c1a16] hover:border-[#e8a317] text-xs sm:text-sm font-semibold text-[#e8a317] cursor-pointer"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              {uploadingSampleArt ? 'Processing…' : 'Upload sample art'}
            </button>
            {config.sampleArt && (
              <button
                type="button"
                onClick={clearSampleArt}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#2a2a2e] bg-[#1c1c1f] hover:border-[#c9883d] text-xs text-[#cfc9bf] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Remove
              </button>
            )}
          </div>
        </div>

        {config.sampleArt && (
          <div className="mt-3.5 pt-3.5 border-t border-[#2a2a2e] flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {config.sampleArt.previewUrl &&
            (config.sampleArt.kind === 'photo' || config.sampleArt.kind === 'svg') ? (
              <img
                src={config.sampleArt.previewUrl}
                alt={`Uploaded sample art reference: ${config.sampleArt.fileName}`}
                referrerPolicy="no-referrer"
                className="w-24 h-24 object-contain rounded-lg border border-[#2a2a2e] bg-[#101012] p-1 shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg border border-[#2a2a2e] bg-[#101012] flex flex-col items-center justify-center text-center p-2 shrink-0">
                <FileText
                  className="w-6 h-6 text-[#e8a317] mb-1"
                  aria-hidden="true"
                />
                <span className="text-[11px] font-mono uppercase text-[#cfc9bf]">
                  {config.sampleArt.fileExt || config.sampleArt.kind}
                </span>
              </div>
            )}

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[#f2efe8] truncate">
                  {config.sampleArt.fileName}
                </span>
                <span className="text-[11px] uppercase px-2 py-0.5 rounded bg-[#1c1c1f] border border-[#2a2a2e] text-[#c9883d]">
                  {config.sampleArt.kind === 'photo'
                    ? 'Photo reference + heightmap'
                    : config.sampleArt.kind === 'model3d'
                      ? `3D model (${(config.sampleArt.fileExt || '').toUpperCase()})`
                      : config.sampleArt.kind === 'reference'
                        ? 'Reference file'
                        : `${config.sampleArt.kind.toUpperCase()} drawing`}
                </span>
                {config.sampleArt.needsConversion && (
                  <span className="text-[11px] text-[#e8c97a]">
                    stored as a reference — needs conversion to use in the model
                  </span>
                )}
                {config.sampleArt.downloadUrl && (
                  <a
                    href={config.sampleArt.downloadUrl}
                    download={config.sampleArt.fileName}
                    className="inline-flex items-center gap-1 text-[11px] text-[#e8a317] underline underline-offset-2"
                  >
                    <Download className="w-3 h-3" aria-hidden="true" />
                    Download
                  </a>
                )}
                {config.sampleArt.cutSegments &&
                  config.sampleArt.cutSegments.length > 0 && (
                    <span className="text-[11px] text-[#a8a29a]">
                      {config.sampleArt.cutSegments.length} cut-outline segments
                    </span>
                  )}
              </div>

              <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-[#d5cfc5]">
                {config.sampleArt.heightmap && (
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.sampleArt.showRelief3D}
                      onChange={(e) =>
                        setConfig((prev) =>
                          prev.sampleArt
                            ? {
                                ...prev,
                                sampleArt: {
                                  ...prev.sampleArt,
                                  showRelief3D: e.target.checked,
                                },
                              }
                            : prev,
                        )
                      }
                      className="w-4 h-4 accent-[#c9883d]"
                    />
                    <Layers
                      className="w-3.5 h-3.5 text-[#c9883d]"
                      aria-hidden="true"
                    />
                    3D relief heightmap in model (from photo brightness)
                  </label>
                )}

                {config.sampleArt.cutSegments &&
                  config.sampleArt.cutSegments.length > 0 && (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.sampleArt.useOutlineCut}
                        onChange={(e) =>
                          setConfig((prev) =>
                            prev.sampleArt
                              ? {
                                  ...prev,
                                  sampleArt: {
                                    ...prev.sampleArt,
                                    useOutlineCut: e.target.checked,
                                  },
                                }
                              : prev,
                          )
                        }
                        className="w-4 h-4 accent-[#c9883d]"
                      />
                      Flat plasma cut-pattern outline (3D / 2D Blueprint / DXF)
                    </label>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Color Studio Sub-Panel (keeps 3D canvas live right below) */}
      {studioTab === 'color' && (
        <div className="mt-4 bg-[#141416] border border-[#c9883d]/45 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-display uppercase tracking-[0.12em] text-sm text-[#e8a317] m-0">
                Color &amp; Finish Studio — Touch-to-Color
              </h4>
              <p className="text-xs sm:text-sm text-[#cfc9bf] m-0 mt-0.5">
                Tap a part directly in the 3D view or choose an area below, then
                pick a color from the gradient scale or swatches. Only that area
                changes color while keeping realistic surface texture.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetSelectedArea}
                className="px-3 py-1.5 rounded-md border border-[#2a2a2e] bg-[#1c1c1f] text-xs font-semibold text-[#e8a317] hover:border-[#e8a317] cursor-pointer"
              >
                Reset Area
              </button>
              <button
                type="button"
                disabled={!config.customColor && !hasAnyAreaColors}
                onClick={handleResetAllColors}
                className="px-3 py-1.5 rounded-md border border-[#2a2a2e] bg-[#1c1c1f] text-xs font-semibold text-[#cfc9bf] hover:border-[#e8a317] hover:text-[#e8a317] disabled:opacity-45 cursor-pointer"
              >
                Reset All Colors
              </button>
            </div>
          </div>

          {/* Target Part Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedColorTarget('whole')}
              className={`px-2.5 py-1 rounded-md text-xs border cursor-pointer ${
                selectedColorTarget === 'whole'
                  ? 'border-[#e8a317] bg-[#242018] text-[#e8a317] font-semibold'
                  : 'border-[#2a2a2e] bg-[#101012] text-[#cfc9bf]'
              }`}
            >
              Whole Piece
            </button>
            {PART_AREAS.map((area) => {
              const areaHex = config.areaColors[area];
              const active = selectedColorTarget === area;
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => setSelectedColorTarget(area)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border cursor-pointer ${
                    active
                      ? 'border-[#e8a317] bg-[#242018] text-[#e8a317] font-semibold'
                      : 'border-[#2a2a2e] bg-[#101012] text-[#cfc9bf] hover:border-[#c9883d]/60'
                  }`}
                >
                  {areaHex && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/30"
                      style={{ backgroundColor: areaHex }}
                      aria-hidden="true"
                    />
                  )}
                  {PART_AREA_LABELS[area]}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Gradient Scale + Finish Presets */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-[#cfc9bf] mb-1.5">
                  <span>
                    Target:{' '}
                    <strong className="text-[#f2efe8]">
                      {selectedColorTarget === 'whole'
                        ? 'Whole Piece'
                        : PART_AREA_LABELS[selectedColorTarget]}
                    </strong>
                  </span>
                  <span className="font-mono text-[#e8a317]">
                    {activeTargetHex.toUpperCase()}
                  </span>
                </div>
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Color gradient scale"
                  aria-valuetext={activeTargetHex}
                  onClick={handleGradientScaleClick}
                  onMouseMove={(e) => {
                    if (e.buttons === 1) handleGradientScaleClick(e);
                  }}
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(255,255,255,0.45), rgba(0,0,0,0.45)), linear-gradient(to right, #ff3b30, #ff9500, #ffcc00, #34c759, #00c7be, #007aff, #5856d6, #af52de, #ff2d55, #ff3b30)',
                  }}
                  className="w-full h-24 rounded-lg border border-[#2a2a2e] cursor-crosshair relative"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5">
                  <label className="text-xs text-[#a8a29a] flex flex-col gap-1">
                    Saturation ({gradientSat}%)
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={gradientSat}
                      onChange={(e) =>
                        applyGradientColor(
                          gradientHue,
                          +e.target.value,
                          gradientLight,
                        )
                      }
                      className="w-full accent-[#c9883d]"
                    />
                  </label>
                  <label className="text-xs text-[#a8a29a] flex flex-col gap-1">
                    Lightness ({gradientLight}%)
                    <input
                      type="range"
                      min={8}
                      max={88}
                      value={gradientLight}
                      onChange={(e) =>
                        applyGradientColor(
                          gradientHue,
                          gradientSat,
                          +e.target.value,
                        )
                      }
                      className="w-full accent-[#c9883d]"
                    />
                  </label>
                </div>
              </div>

              <div>
                <span className="block text-xs text-[#a8a29a] mb-1.5">
                  Shop Finishes
                </span>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FINISHES) as FinishType[]).map((key) => {
                    const active = !config.customColor && config.finish === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            finish: key,
                            customColor: null,
                          }))
                        }
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs cursor-pointer ${
                          active
                            ? 'border-[#e8a317] bg-[#242018] text-[#e8a317] font-semibold'
                            : 'border-[#2a2a2e] bg-[#101012] text-[#cfc9bf] hover:border-[#c9883d]/60'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-sm border border-white/20"
                          style={{ backgroundColor: FINISHES[key].swatch }}
                          aria-hidden="true"
                        />
                        {FINISHES[key].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Square Swatch Selector Grid */}
            <div>
              <span className="block text-xs text-[#a8a29a] mb-2">
                Square Swatch Selector Grid
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-4 gap-2">
                {CUSTOM_COLOR_SWATCHES.map((sw) => {
                  const active =
                    activeTargetHex.toLowerCase() === sw.hex.toLowerCase();
                  return (
                    <button
                      key={sw.hex}
                      type="button"
                      title={`${sw.label} (${sw.hex})`}
                      onClick={() => applyColorHex(sw.hex)}
                      className={`group flex flex-col items-center gap-1 p-1.5 rounded-md border cursor-pointer transition-colors ${
                        active
                          ? 'border-[#e8a317] bg-[#242018]'
                          : 'border-[#2a2a2e] bg-[#101012] hover:border-[#c9883d]/70'
                      }`}
                    >
                      <span
                        className="w-full h-8 rounded-sm border border-white/20"
                        style={{ backgroundColor: sw.hex }}
                        aria-hidden="true"
                      />
                      <span className="text-[11px] text-[#cfc9bf] truncate w-full text-center">
                        {sw.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pickets Studio Sub-Panel (keeps 3D canvas live right below) */}
      {studioTab === 'pickets' && (
        <div className="mt-4 bg-[#141416] border border-[#c9883d]/45 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-display uppercase tracking-[0.12em] text-sm text-[#e8a317] m-0">
                Pickets, Infill Pattern, Scrollwork &amp; Leaf Selection
              </h4>
              <p className="text-xs sm:text-sm text-[#cfc9bf] m-0 mt-0.5">
                Choose base style, scrollwork form, King / Coast / PDM infill
                pattern, picket size &amp; design, and multi-select King
                Architectural &amp; IMS forged leaves — previews live in 3D,
                2D Blueprint, DXF, and Bill of Materials.
              </p>
            </div>
            {!isGateOrRailing && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#e8c97a]">
                  Switch to Gate or Railing for infill &amp; pickets:
                </span>
                <button
                  type="button"
                  onClick={() => handlePieceChange('gate')}
                  className="px-3 py-1.5 rounded-md bg-[#c9883d] text-[#141210] text-xs font-bold cursor-pointer"
                >
                  Switch to Gate
                </button>
                <button
                  type="button"
                  onClick={() => handlePieceChange('railing')}
                  className="px-3 py-1.5 rounded-md border border-[#2a2a2e] bg-[#1c1c1f] text-[#f2efe8] text-xs font-semibold cursor-pointer"
                >
                  Railing
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PICKET_STYLES.map((st) => {
                  const active = config.style === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      disabled={!isGateOrRailing}
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          style: st.id,
                          infillPattern:
                            st.id === 'horizontal'
                              ? 'horizontal-bars'
                              : st.id === 'solid'
                                ? 'solid-panel'
                                : st.id === 'scroll'
                                  ? 'scroll-panel'
                                  : prev.infillPattern === 'horizontal-bars' ||
                                      prev.infillPattern === 'solid-panel' ||
                                      prev.infillPattern === 'scroll-panel'
                                    ? 'vertical-pickets'
                                    : prev.infillPattern,
                        }))
                      }
                      className={`p-3 rounded-lg border text-left cursor-pointer disabled:opacity-45 transition-colors ${
                        active && isGateOrRailing
                          ? 'border-[#e8a317] bg-[#242018] text-[#f2efe8]'
                          : 'border-[#2a2a2e] bg-[#101012] text-[#cfc9bf] hover:border-[#c9883d]/60'
                      }`}
                    >
                      <div className="font-semibold text-sm text-[#f2efe8]">
                        {st.label}
                      </div>
                      <div className="text-xs text-[#a8a29a] mt-0.5">
                        {st.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Metalwork Design Dropdowns: Scrollwork, Infill, Picket Size, Picket Design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#101012] border border-[#2a2a2e] rounded-lg p-3">
                <div>
                  <label
                    htmlFor="tab-scroll-style"
                    className="block text-xs text-[#a8a29a] mb-1"
                  >
                    Scrollwork
                  </label>
                  <select
                    id="tab-scroll-style"
                    value={config.scrollStyle}
                    onChange={(e) =>
                      handleScrollStyleChange(e.target.value as ScrollStyleType)
                    }
                    className="w-full px-2.5 py-2 rounded-md bg-[#18181b] text-[#f2efe8] border border-[#2a2a2e] text-xs"
                  >
                    {SCROLL_STYLES.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="tab-infill-pattern"
                    className="block text-xs text-[#a8a29a] mb-1"
                  >
                    Infill pattern (King / Coast / PDM)
                  </label>
                  <select
                    id="tab-infill-pattern"
                    disabled={!isGateOrRailing}
                    value={config.infillPattern}
                    onChange={(e) =>
                      handleInfillPatternChange(
                        e.target.value as InfillPatternType,
                      )
                    }
                    className="w-full px-2.5 py-2 rounded-md bg-[#18181b] text-[#f2efe8] border border-[#2a2a2e] text-xs disabled:opacity-45"
                  >
                    {INFILL_PATTERNS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="tab-picket-size"
                    className="block text-xs text-[#a8a29a] mb-1"
                  >
                    Picket size
                  </label>
                  <select
                    id="tab-picket-size"
                    disabled={!isGateOrRailing}
                    value={config.picketSize}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        picketSize: e.target.value as PicketSizeId,
                      }))
                    }
                    className="w-full px-2.5 py-2 rounded-md bg-[#18181b] text-[#f2efe8] border border-[#2a2a2e] text-xs disabled:opacity-45"
                  >
                    {PICKET_SIZES.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="tab-picket-style"
                    className="block text-xs text-[#a8a29a] mb-1"
                  >
                    Picket design
                  </label>
                  <select
                    id="tab-picket-style"
                    disabled={!isGateOrRailing}
                    value={config.picketStyle}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        picketStyle: e.target.value as PicketStyleType,
                      }))
                    }
                    className="w-full px-2.5 py-2 rounded-md bg-[#18181b] text-[#f2efe8] border border-[#2a2a2e] text-xs disabled:opacity-45"
                  >
                    {PICKET_FORM_STYLES.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Select Leaf Catalog (King Architectural Ornamental Steels + IMS) */}
              <div className="bg-[#101012] border border-[#2a2a2e] rounded-lg p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-display uppercase tracking-[0.1em] text-[11px] text-[#e8a317]">
                      Leaf Section — King Architectural &amp; IMS (Multi-Select)
                    </span>
                    <p className="text-[11px] text-[#a8a29a] m-0">
                      Select one or multiple stamped, forged, or cast leaves from King Architectural Ornamental Steels &amp; Industrial Metal Supply (IMS).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#18181b] border border-[#2a2a2e] text-[#e8c97a]">
                      {config.selectedLeaves.length} selected
                    </span>
                    {config.selectedLeaves.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCatalogLeaves}
                        className="text-[11px] px-2 py-0.5 rounded border border-[#2a2a2e] bg-[#18181b] text-[#cfc9bf] hover:text-[#e8a317] cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#c9883d] uppercase tracking-[0.06em]">
                      King Architectural Ornamental Steels
                    </div>
                    <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto pr-1">
                      {kingLeaves.map((leaf) => {
                        const checked = config.selectedLeaves.includes(leaf.id);
                        return (
                          <label
                            key={leaf.id}
                            className={`flex items-start gap-2 px-2 py-1 rounded border text-xs cursor-pointer transition-colors ${
                              checked
                                ? 'border-[#e8a317]/70 bg-[#242018] text-[#f2efe8]'
                                : 'border-[#2a2a2e]/70 bg-[#141417] text-[#cfc9bf] hover:border-[#c9883d]/45'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleCatalogLeaf(leaf.id)}
                              className="w-3.5 h-3.5 mt-0.5 accent-[#c9883d]"
                            />
                            <span className="leading-tight">
                              <span className="block font-medium">
                                {leaf.label}
                              </span>
                              <span className="block text-[10px] text-[#a8a29a]">
                                {leaf.spec}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#c9883d] uppercase tracking-[0.06em]">
                      IMS (Industrial Metal Supply)
                    </div>
                    <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto pr-1">
                      {imsLeaves.map((leaf) => {
                        const checked = config.selectedLeaves.includes(leaf.id);
                        return (
                          <label
                            key={leaf.id}
                            className={`flex items-start gap-2 px-2 py-1 rounded border text-xs cursor-pointer transition-colors ${
                              checked
                                ? 'border-[#e8a317]/70 bg-[#242018] text-[#f2efe8]'
                                : 'border-[#2a2a2e]/70 bg-[#141417] text-[#cfc9bf] hover:border-[#c9883d]/45'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleCatalogLeaf(leaf.id)}
                              className="w-3.5 h-3.5 mt-0.5 accent-[#c9883d]"
                            />
                            <span className="leading-tight">
                              <span className="block font-medium">
                                {leaf.label}
                              </span>
                              <span className="block text-[10px] text-[#a8a29a]">
                                {leaf.spec}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#101012] border border-[#2a2a2e] rounded-lg p-3.5 space-y-2.5">
              <div className="flex justify-between text-sm">
                <label htmlFor="tab-picketspacing" className="text-[#cfc9bf]">
                  Picket spacing (center-to-center)
                </label>
                <span className="text-[#e8a317] font-semibold tabular-nums">
                  {config.picketSpacing} in
                </span>
              </div>
              <input
                id="tab-picketspacing"
                type="range"
                min={3}
                max={6}
                step={0.5}
                disabled={!isGateOrRailing || config.style === 'solid'}
                value={config.picketSpacing}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    picketSpacing: +e.target.value,
                  }))
                }
                className="w-full accent-[#c9883d] disabled:opacity-45"
              />
              <div className="flex flex-wrap gap-1.5">
                {[3, 3.5, 4, 4.5, 5, 6].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={!isGateOrRailing || config.style === 'solid'}
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, picketSpacing: val }))
                    }
                    className={`px-2.5 py-1 rounded border text-xs cursor-pointer disabled:opacity-45 ${
                      config.picketSpacing === val &&
                      isGateOrRailing &&
                      config.style !== 'solid'
                        ? 'border-[#e8a317] bg-[#242018] text-[#e8a317] font-semibold'
                        : 'border-[#2a2a2e] bg-[#1c1c1f] text-[#cfc9bf]'
                    }`}
                  >
                    {val}&Prime;
                  </button>
                ))}
              </div>
              <div className="pt-2 border-t border-[#2a2a2e]/70 text-xs text-[#a8a29a] space-y-1">
                <div>
                  Active picket stock:{' '}
                  <strong className="text-[#f2efe8]">
                    {getEffectivePicketSizeLabel(config)}
                  </strong>
                </div>
                {config.selectedLeaves.length > 0 && (
                  <div>
                    Leaves attached:{' '}
                    <strong className="text-[#e8c97a]">
                      {config.selectedLeaves.length} catalog option
                      {config.selectedLeaves.length === 1 ? '' : 's'}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Sign Lettering Studio Sub-Panel (keeps 3D canvas live right below) */}
      {studioTab === 'sign' && (
        <div
          id="sign-lettering-panel"
          className="mt-4 bg-[#141416] border border-[#c9883d]/45 rounded-xl p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-display uppercase tracking-[0.12em] text-sm text-[#e8a317] m-0 flex items-center gap-2">
                <Type className="w-4 h-4" aria-hidden="true" />
                Sign Lettering, Font Picker &amp; Free-Draw Pad
              </h4>
              <p className="text-xs sm:text-sm text-[#cfc9bf] m-0 mt-0.5">
                Customize typed lettering, pick Google/System/Computer fonts, or
                hand-draw your own lettering — updates live on the 3D piece, 2D
                Blueprint, Technical Drawing, and Isometric Blueprint View.
              </p>
            </div>

            {config.piece !== 'sign-frame' ? (
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#c9883d]/60 bg-[#1c1a16] text-xs font-semibold text-[#e8a317] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showSign}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      showSign: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-[#c9883d]"
                />
                Mount sign plaque on {pieceSpec.label}
              </label>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded bg-[#1c1a16] border border-[#c9883d]/40 text-[#e8c97a]">
                Sign Frame active — lettering shown live
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* Left column: Mode Switch + Sign Wording + Searchable Font Picker */}
            <div className="space-y-3 bg-[#101012] border border-[#2a2a2e] rounded-lg p-3.5">
              {/* Explicit Typed vs Hand-drawn Switch */}
              <div>
                <span className="block text-[11px] uppercase tracking-[0.08em] text-[#a8a29a] mb-1.5">
                  Sign Lettering Mode
                </span>
                <div
                  className="grid grid-cols-2 gap-2"
                  role="group"
                  aria-label="Sign lettering mode"
                >
                  <button
                    type="button"
                    aria-pressed={config.signLetteringMode === 'typed'}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        signLetteringMode: 'typed',
                        showSign:
                          prev.piece !== 'sign-frame' ? true : prev.showSign,
                      }))
                    }
                    className={`px-3 py-2 rounded-md border text-xs font-semibold cursor-pointer transition-colors ${
                      config.signLetteringMode === 'typed'
                        ? 'bg-[#c9883d] text-[#141210] border-[#c9883d]'
                        : 'bg-[#18181b] text-[#cfc9bf] border-[#2a2a2e] hover:border-[#c9883d]/60'
                    }`}
                  >
                    Use typed lettering
                  </button>
                  <button
                    type="button"
                    aria-pressed={config.signLetteringMode === 'hand-drawn'}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        signLetteringMode: 'hand-drawn',
                        showSign:
                          prev.piece !== 'sign-frame' ? true : prev.showSign,
                      }))
                    }
                    className={`px-3 py-2 rounded-md border text-xs font-semibold cursor-pointer transition-colors ${
                      config.signLetteringMode === 'hand-drawn'
                        ? 'bg-[#c9883d] text-[#141210] border-[#c9883d]'
                        : 'bg-[#18181b] text-[#cfc9bf] border-[#2a2a2e] hover:border-[#c9883d]/60'
                    }`}
                  >
                    Use hand-drawn lettering
                  </button>
                </div>
              </div>

              {/* Sign Wording Input */}
              <div>
                <label
                  htmlFor="sign-text-input"
                  className="block text-xs text-[#cfc9bf] font-semibold mb-1"
                >
                  Sign wording
                </label>
                <textarea
                  id="sign-text-input"
                  rows={2}
                  value={config.signText}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      signText: e.target.value,
                      showSign:
                        prev.piece !== 'sign-frame' ? true : prev.showSign,
                    }))
                  }
                  placeholder="Enter custom sign wording (up to 3 lines)"
                  className="w-full px-2.5 py-2 rounded-md bg-[#18181b] text-[#f2efe8] border border-[#2a2a2e] text-sm"
                />
              </div>

              {/* Searchable Font Picker */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="sign-font-search"
                    className="text-xs text-[#cfc9bf] font-semibold"
                  >
                    Searchable Font Picker ({filteredSignFonts.length} of{' '}
                    {allSignFonts.length} Google &amp; System fonts)
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleDetectInstalledFonts()}
                    className="px-2.5 py-1 rounded bg-[#1c1a16] border border-[#c9883d]/60 text-[11px] font-semibold text-[#e8a317] hover:border-[#e8a317] cursor-pointer whitespace-nowrap"
                  >
                    {localFontsChecked
                      ? 'System Fonts Checked'
                      : 'Detect Computer Fonts'}
                  </button>
                </div>

                <div className="relative">
                  <Search
                    className="w-3.5 h-3.5 text-[#a8a29a] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="sign-font-search"
                    type="text"
                    value={fontSearchQuery}
                    onChange={(e) => setFontSearchQuery(e.target.value)}
                    placeholder="Search fonts (e.g. Cinzel, Blackletter, Script, Slab, Roboto)…"
                    className="w-full pl-8 pr-2.5 py-1.5 rounded bg-[#18181b] border border-[#2a2a2e] text-xs text-[#f2efe8] placeholder:text-[#6f6b64]"
                  />
                </div>

                {/* Live Selected Font Preview Box */}
                <div className="rounded border border-[#2a2a2e] bg-[#16191e] px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-[0.1em] text-[#a8a29a] mb-0.5">
                    Live Typed Preview
                  </div>
                  <div
                    style={{
                      fontFamily: config.signFont,
                      color: config.signTextColor,
                      fontSize: `${Math.max(16, Math.min(34, config.signFontSize * 0.6))}px`,
                    }}
                    className="font-bold truncate leading-tight"
                  >
                    {config.signText.trim() || 'YOUR NAME HERE'}
                  </div>
                </div>

                {/* Scrollable Font List showing each option in its own typeface */}
                <div
                  role="listbox"
                  aria-label="Sign fonts"
                  className="max-h-48 overflow-y-auto rounded border border-[#2a2a2e] bg-[#141416] divide-y divide-[#2a2a2e]/70"
                >
                  {filteredSignFonts.map((f) => {
                    const active = config.signFont === f.family;
                    return (
                      <button
                        key={`${f.category}-${f.label}`}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          ensureGoogleFontLoaded(f, () => {
                            setFontLoadVer((v) => v + 1);
                            sceneRef.current?.refreshSignFonts();
                          });
                          setConfig((prev) => ({
                            ...prev,
                            signFont: f.family,
                            showSign:
                              prev.piece !== 'sign-frame'
                                ? true
                                : prev.showSign,
                          }));
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left cursor-pointer transition-colors ${
                          active
                            ? 'bg-[#242018] text-[#e8a317]'
                            : 'text-[#f2efe8] hover:bg-[#1c1c20]'
                        }`}
                      >
                        <span
                          style={{ fontFamily: f.family }}
                          className="text-sm truncate"
                        >
                          {f.label}
                        </span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#101012] border border-[#2a2a2e] text-[#a8a29a] shrink-0">
                          {f.category}
                        </span>
                      </button>
                    );
                  })}
                  {filteredSignFonts.length === 0 && (
                    <div className="p-3 text-xs text-[#a8a29a] text-center">
                      No matching fonts found. Try clearing your search.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 items-center pt-1">
                  <label className="text-[11px] text-[#a8a29a] flex flex-col gap-1">
                    Letter size ({config.signFontSize}px)
                    <input
                      type="range"
                      min={16}
                      max={84}
                      value={config.signFontSize}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          signFontSize: +e.target.value,
                        }))
                      }
                      className="w-full accent-[#c9883d]"
                    />
                  </label>
                  <label className="text-[11px] text-[#a8a29a] flex items-center justify-between gap-2">
                    <span>Letter color</span>
                    <input
                      type="color"
                      value={config.signTextColor}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          signTextColor: e.target.value,
                        }))
                      }
                      className="w-10 h-7 rounded bg-transparent border border-[#2a2a2e] cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Right column: Free-Draw Lettering Pad + Sign Artwork Upload */}
            <div className="space-y-3 bg-[#101012] border border-[#2a2a2e] rounded-lg p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e8a317]">
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  Free-Draw Lettering Pad (pen / mouse / touch)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={config.signStrokes.length === 0}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        signStrokes: prev.signStrokes.slice(0, -1),
                      }))
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#2a2a2e] bg-[#18181b] text-[11px] text-[#cfc9bf] hover:text-[#e8a317] disabled:opacity-45 cursor-pointer"
                  >
                    <Undo2 className="w-3 h-3" aria-hidden="true" />
                    Undo
                  </button>
                  <button
                    type="button"
                    disabled={config.signStrokes.length === 0}
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, signStrokes: [] }))
                    }
                    className="px-2 py-1 rounded border border-[#2a2a2e] bg-[#18181b] text-[11px] text-[#cfc9bf] hover:text-[#e8a317] disabled:opacity-45 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <canvas
                ref={signDrawCanvasRef}
                width={460}
                height={230}
                onPointerDown={handleSignDrawDown}
                onPointerMove={handleSignDrawMove}
                onPointerUp={handleSignDrawUp}
                onPointerCancel={handleSignDrawUp}
                aria-label="Free-draw sign lettering pad. Draw custom lettering with pen, mouse, or touch."
                className="w-full h-auto rounded border border-[#2a2a2e] cursor-crosshair touch-none"
              />

              <div className="grid grid-cols-2 gap-3 items-center">
                <label className="text-[11px] text-[#a8a29a] flex items-center justify-between gap-2">
                  <span>Draw color</span>
                  <input
                    type="color"
                    value={config.signDrawColor}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        signDrawColor: e.target.value,
                      }))
                    }
                    className="w-10 h-7 rounded bg-transparent border border-[#2a2a2e] cursor-pointer"
                  />
                </label>
                <label className="text-[11px] text-[#a8a29a] flex flex-col gap-1">
                  Line width ({config.signDrawWidth}px)
                  <input
                    type="range"
                    min={1}
                    max={14}
                    value={config.signDrawWidth}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        signDrawWidth: +e.target.value,
                      }))
                    }
                    className="w-full accent-[#c9883d]"
                  />
                </label>
              </div>

              {config.signStrokes.length > 0 &&
                config.signLetteringMode !== 'hand-drawn' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#e8a317]/40 bg-[#1a1409] px-2.5 py-1.5 text-[11px] text-[#e8c97a]">
                    <span>
                      You have {config.signStrokes.length} hand-drawn path(s).
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          signLetteringMode: 'hand-drawn',
                          showSign:
                            prev.piece !== 'sign-frame' ? true : prev.showSign,
                        }))
                      }
                      className="font-semibold underline cursor-pointer bg-transparent border-0 text-[#e8a317] p-0"
                    >
                      Switch to hand-drawn lettering
                    </button>
                  </div>
                )}

              {/* Upload a Design Picture on Sign */}
              <div className="pt-2 border-t border-[#2a2a2e] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#e8a317]">
                    Sign artwork / crest upload
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1c1a16] border border-[#c9883d]/40 text-[#e8c97a]">
                    All file types accepted
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={signPictureInputRef}
                    type="file"
                    accept="*/*"
                    onChange={handleSignPictureUpload}
                    className="hidden"
                    id="sign-design-picture-upload"
                  />
                  <button
                    type="button"
                    disabled={uploadingSignPic}
                    onClick={() => signPictureInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1c1a16] border border-[#c9883d]/70 text-xs font-semibold text-[#e8a317] hover:border-[#e8a317] cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    {uploadingSignPic
                      ? 'Loading…'
                      : 'Upload a design picture'}
                  </button>
                  {config.signPicture && (
                    <button
                      type="button"
                      onClick={clearSignPicture}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#2a2a2e] bg-[#18181b] text-xs text-[#cfc9bf] hover:text-[#e8a317] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  )}
                </div>

                {config.signPicture && (
                  <div className="space-y-2 bg-[#141416] border border-[#2a2a2e] rounded p-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[#f2efe8] font-semibold truncate max-w-[200px]">
                        {config.signPicture.fileName}
                      </span>
                      {config.signPicture.needsConversion && (
                        <span className="text-[11px] text-[#e8c97a]">
                          stored as a reference — needs conversion to use in the
                          model
                        </span>
                      )}
                      {config.signPicture.downloadUrl && (
                        <a
                          href={config.signPicture.downloadUrl}
                          download={config.signPicture.fileName}
                          className="text-[11px] text-[#e8a317] underline"
                        >
                          Download
                        </a>
                      )}
                    </div>

                    {!config.signPicture.needsConversion && (
                      <div className="grid grid-cols-3 gap-2">
                        <label className="text-[11px] text-[#a8a29a] flex flex-col gap-0.5">
                          Move X ({Math.round(config.signPicture.x * 100)}%)
                          <input
                            type="range"
                            min={0.1}
                            max={0.9}
                            step={0.02}
                            value={config.signPicture.x}
                            onChange={(e) =>
                              setConfig((prev) =>
                                prev.signPicture
                                  ? {
                                      ...prev,
                                      signPicture: {
                                        ...prev.signPicture,
                                        x: +e.target.value,
                                      },
                                    }
                                  : prev,
                              )
                            }
                            className="w-full accent-[#c9883d]"
                          />
                        </label>
                        <label className="text-[11px] text-[#a8a29a] flex flex-col gap-0.5">
                          Move Y ({Math.round(config.signPicture.y * 100)}%)
                          <input
                            type="range"
                            min={0.1}
                            max={0.9}
                            step={0.02}
                            value={config.signPicture.y}
                            onChange={(e) =>
                              setConfig((prev) =>
                                prev.signPicture
                                  ? {
                                      ...prev,
                                      signPicture: {
                                        ...prev.signPicture,
                                        y: +e.target.value,
                                      },
                                    }
                                  : prev,
                              )
                            }
                            className="w-full accent-[#c9883d]"
                          />
                        </label>
                        <label className="text-[11px] text-[#a8a29a] flex flex-col gap-0.5">
                          Size ({Math.round(config.signPicture.scale * 100)}%)
                          <input
                            type="range"
                            min={0.15}
                            max={1.1}
                            step={0.03}
                            value={config.signPicture.scale}
                            onChange={(e) =>
                              setConfig((prev) =>
                                prev.signPicture
                                  ? {
                                      ...prev,
                                      signPicture: {
                                        ...prev.signPicture,
                                        scale: +e.target.value,
                                      },
                                    }
                                  : prev,
                              )
                            }
                            className="w-full accent-[#c9883d]"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Studio Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6 pt-5 items-start">
        {/* Left: Viewport + Mode Bar / Drawing / Accents + Export Choices */}
        <div className="flex flex-col gap-3">
          {/* Upload a Photo to 3D Relief Control Bar (top of 3D VIEW tab, and visible across 2D & Isometric while active) */}
          {(studioTab === '3d' ||
            ((is3DViewportActive || is2DView || isIsoView) &&
              uploadedPhoto)) && (
            <div className="bg-[#141416] border border-[#2a2a2e] rounded-lg p-3 space-y-2.5">
              <input
                ref={photo3dInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoInputChange}
                aria-label="Upload a photo to build a 3D relief model"
                className="sr-only"
              />

              {!uploadedPhoto ? (
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[#f2efe8] m-0">
                      Preview your own photo in the 3D, 2D &amp; Isometric views
                    </p>
                    <p className="text-[11px] text-[#a8a29a] m-0">
                      Stays in your browser — or drag &amp; drop a single photo onto the 3D view below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => photo3dInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-bold text-xs cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <ImagePlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                    Upload a photo
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2.5">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-display uppercase tracking-[0.08em] text-xs font-bold text-[#e8a317] m-0">
                        {is2DView
                          ? 'Uploaded photo — 2D elevation'
                          : isIsoView
                            ? 'Uploaded photo — Isometric view'
                            : 'Uploaded photo — 3D interpretation'}
                        :{' '}
                        <span className="text-[#f2efe8] font-sans normal-case font-semibold break-all">
                          {uploadedPhoto.fileName}
                        </span>
                      </p>
                      <p className="text-[11px] text-[#d5cfc5] m-0">
                        3D interpretation of your photo — not a true scan; the back side is not captured.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => photo3dInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c9883d]/70 bg-[#1c1a16] hover:border-[#e8a317] text-[#e8a317] font-semibold text-xs cursor-pointer whitespace-nowrap"
                      >
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        Upload a different photo
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveUploadedPhoto}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#4a2b2b] bg-[#1c1212] hover:border-[#f87171] text-[#fca5a5] font-semibold text-xs cursor-pointer whitespace-nowrap"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                        Remove photo
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#2a2a2e]">
                    <label className="flex-1 min-w-[200px] flex items-center gap-3 text-xs text-[#e2ded5]">
                      <span className="font-semibold whitespace-nowrap">
                        Relief depth
                      </span>
                      <input
                        type="range"
                        aria-label="Relief depth"
                        min={0}
                        max={2}
                        step={0.05}
                        value={uploadedPhoto.reliefDepth}
                        onChange={(e) => {
                          const depth = +e.target.value;
                          setUploadedPhoto((prev) =>
                            prev ? { ...prev, reliefDepth: depth } : prev,
                          );
                        }}
                        className="flex-1 accent-[#c9883d] cursor-pointer"
                      />
                      <span className="tabular-nums text-[11px] text-[#e8a317] font-semibold w-10 text-right">
                        {uploadedPhoto.reliefDepth.toFixed(2)}
                      </span>
                    </label>
                    <span className="text-[11px] text-[#a8a29a]">
                      Synced live across 3D View, 2D Blueprint &amp; Isometric View.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dedicated 2D Photo Dimensioning & Scale Calibration Toolbar (2D Blueprint tab when photo is active) */}
          {is2DView && uploadedPhoto && (
            <div className="bg-[#141416] border border-[#c9883d]/50 rounded-lg p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div
                  className="inline-flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Photo 2D dimension and scale tools"
                >
                  <button
                    type="button"
                    aria-pressed={photo2DMode === 'add' && interactionMode !== 'draw'}
                    onClick={() => {
                      if (interactionMode === 'draw') setInteractionMode('select');
                      setPendingCalStart(null);
                      setDraftCalSpan(null);
                      setPhoto2DMode('add');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border cursor-pointer ${
                      photo2DMode === 'add' && interactionMode !== 'draw'
                        ? 'bg-[#c9883d] text-[#141210] border-[#c9883d]'
                        : 'bg-[#101012] text-[#cfc9bf] border-[#2a2a2e] hover:border-[#c9883d]/60'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
                    Add dimension
                  </button>

                  <button
                    type="button"
                    aria-pressed={photo2DMode === 'adjust' && interactionMode !== 'draw'}
                    onClick={() => {
                      if (interactionMode === 'draw') setInteractionMode('select');
                      setPendingDimStart(null);
                      setPendingCalStart(null);
                      setPhoto2DMode('adjust');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border cursor-pointer ${
                      photo2DMode === 'adjust' && interactionMode !== 'draw'
                        ? 'bg-[#c9883d] text-[#141210] border-[#c9883d]'
                        : 'bg-[#101012] text-[#cfc9bf] border-[#2a2a2e] hover:border-[#c9883d]/60'
                    }`}
                  >
                    <Move className="w-3.5 h-3.5" aria-hidden="true" />
                    Pan / Adjust handles
                  </button>

                  <button
                    type="button"
                    aria-pressed={photo2DMode === 'calibrate' && interactionMode !== 'draw'}
                    onClick={() => {
                      if (interactionMode === 'draw') setInteractionMode('select');
                      setPendingDimStart(null);
                      setPendingCalStart(null);
                      setDraftCalSpan(null);
                      setPhoto2DMode('calibrate');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border cursor-pointer ${
                      photo2DMode === 'calibrate' && interactionMode !== 'draw'
                        ? 'bg-[#38bdf8] text-[#0b1526] border-[#38bdf8]'
                        : 'bg-[#101012] text-[#7dd3fc] border-[#38bdf8]/45 hover:border-[#38bdf8]'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
                    {uploadedPhoto.calibration ? 'Re-calibrate scale' : 'Set scale'}
                  </button>

                  {(uploadedPhoto.dimensions || []).length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllPhotoDimensions}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border border-[#4a2b2b] bg-[#1c1212] text-[#fca5a5] hover:border-[#f87171] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Delete all ({uploadedPhoto.dimensions?.length || 0})
                    </button>
                  )}

                  {uploadedPhoto.calibration && (
                    <button
                      type="button"
                      onClick={handleClearPhotoCalibration}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs border border-[#2a2a2e] bg-[#101012] text-[#cfc9bf] hover:text-[#f87171] cursor-pointer"
                    >
                      Clear scale
                    </button>
                  )}
                </div>

                <span className="text-[11px] font-medium text-[#7dd3fc]">
                  {uploadedPhoto.calibration && photoReliefEntry
                    ? getCalibrationSummaryText(
                        uploadedPhoto.calibration,
                        photoReliefEntry.aspect,
                      )
                    : 'Uncalibrated (% of photo width)'}
                </span>
              </div>

              {/* Scale Calibration Known-Length Prompt after tapping 2 points */}
              {draftCalSpan && (
                <div className="bg-[#0d1f3a] border border-[#38bdf8]/60 rounded-lg p-2.5 flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-0.5 text-[11px] text-[#bae6fd]">
                    <span>Known length between the 2 points</span>
                    <input
                      type="number"
                      min={0.01}
                      step="any"
                      value={calLengthInput}
                      onChange={(e) => setCalLengthInput(e.target.value)}
                      className="w-24 px-2 py-1 rounded bg-[#0a1426] border border-[#38bdf8]/50 text-white text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-0.5 text-[11px] text-[#bae6fd]">
                    <span>Unit</span>
                    <select
                      value={calUnitInput}
                      onChange={(e) =>
                        setCalUnitInput(e.target.value as 'in' | 'ft')
                      }
                      className="px-2 py-1 rounded bg-[#0a1426] border border-[#38bdf8]/50 text-white text-xs"
                    >
                      <option value="in">inches (in)</option>
                      <option value="ft">feet (ft)</option>
                    </select>
                  </label>
                  <label className="flex-1 min-w-[140px] flex flex-col gap-0.5 text-[11px] text-[#bae6fd]">
                    <span>Feature label (optional)</span>
                    <input
                      type="text"
                      placeholder="e.g. gate width, post height"
                      value={calFeatureInput}
                      onChange={(e) => setCalFeatureInput(e.target.value)}
                      className="px-2 py-1 rounded bg-[#0a1426] border border-[#38bdf8]/50 text-white text-xs"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleApplyPhotoScaleCalibration}
                    className="px-3 py-1.5 rounded bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#091526] font-bold text-xs cursor-pointer"
                  >
                    Apply scale
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftCalSpan(null);
                      setPendingCalStart(null);
                      setPhoto2DMode('add');
                    }}
                    className="px-2.5 py-1.5 rounded border border-[#2a2a2e] bg-[#141416] text-[#cfc9bf] text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <p className="text-[11px] text-[#a8a29a] m-0">
                {photo2DMode === 'calibrate'
                  ? pendingCalStart
                    ? 'Calibration step 2: tap the second point on the known-length feature.'
                    : 'Scale calibration: tap two points on a feature whose real length you know.'
                  : pendingDimStart
                    ? 'Tap the second point on the photo to complete this dimension.'
                    : 'Tap two points on the photo to place a dimension. Drag round handles to adjust endpoints, drag the center handle to move the whole line, or tap × to delete. Pinch-zoom and scroll work outside the handles.'}
              </p>

              {/* Compact Dimension Chips for quick inspection / touch delete */}
              {(uploadedPhoto.dimensions || []).length > 0 && photoReliefEntry && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#2a2a2e]">
                  {(uploadedPhoto.dimensions || []).map((d, idx) => (
                    <span
                      key={d.id}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] border ${
                        selectedPhotoDimId === d.id
                          ? 'bg-[#2a2010] border-[#e8a317] text-[#fef3c7]'
                          : 'bg-[#101012] border-[#2a2a2e] text-[#e2ded5]'
                      }`}
                    >
                      <strong className="text-[#e8a317]">#{idx + 1}</strong>
                      <span className="tabular-nums">
                        {formatPhotoDimensionLabel(
                          d,
                          photoReliefEntry.aspect,
                          uploadedPhoto.calibration,
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeletePhotoDimension(d.id)}
                        aria-label={`Delete dimension #${idx + 1}`}
                        className="text-[#fca5a5] hover:text-white cursor-pointer bg-transparent border-0 p-0 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interactive Mode Switch + Drawing / Tap-to-Place Accents Bar (shown for 3D and normal 2D blueprint) */}
          {(is3DViewportActive || (is2DView && !uploadedPhoto)) && (
            <div className="bg-[#141416] border border-[#2a2a2e] rounded-lg p-2.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div
                  className="inline-flex flex-wrap gap-1"
                  role="group"
                  aria-label="Viewport interaction mode"
                >
                  {is3DViewportActive && (
                    <button
                      type="button"
                      aria-pressed={interactionMode === 'rotate'}
                      onClick={() => setInteractionMode('rotate')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer ${
                        interactionMode === 'rotate'
                          ? 'bg-[#c9883d] text-[#141210] border-[#c9883d]'
                          : 'bg-[#101012] text-[#cfc9bf] border-[#2a2a2e] hover:border-[#c9883d]/60'
                      }`}
                    >
                      <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                      Rotate
                    </button>
                  )}
                  <button
                    type="button"
                    aria-pressed={
                      interactionMode === 'select' ||
                      (is2DView && interactionMode === 'rotate')
                    }
                    onClick={() => setInteractionMode('select')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer ${
                      interactionMode === 'select' ||
                      (is2DView && interactionMode === 'rotate')
                        ? 'bg-[#c9883d] text-[#141210] border-[#c9883d]'
                        : 'bg-[#101012] text-[#cfc9bf] border-[#2a2a2e] hover:border-[#c9883d]/60'
                    }`}
                  >
                    <MousePointer2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Select
                  </button>
                  <button
                    type="button"
                    aria-pressed={interactionMode === 'draw'}
                    onClick={() => setInteractionMode('draw')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer ${
                      interactionMode === 'draw'
                        ? 'bg-[#c9883d] text-[#141210] border-[#c9883d]'
                        : 'bg-[#101012] text-[#cfc9bf] border-[#2a2a2e] hover:border-[#c9883d]/60'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    Draw
                  </button>
                  <button
                    type="button"
                    aria-pressed={interactionMode === 'accent'}
                    onClick={() => setInteractionMode('accent')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer ${
                      interactionMode === 'accent'
                        ? 'bg-[#c9883d] text-[#141210] border-[#c9883d]'
                        : 'bg-[#101012] text-[#cfc9bf] border-[#2a2a2e] hover:border-[#c9883d]/60'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    Place Accents
                  </button>
                </div>

                <span className="text-[11px] text-[#a8a29a]">
                  {interactionMode === 'draw'
                    ? is2DView
                      ? 'Drawing on 2D Blueprint'
                      : 'Drawing over 3D View (rotation paused)'
                    : interactionMode === 'accent'
                      ? 'Tap a picket, then tap an accent button'
                      : is2DView
                        ? '2D Blueprint inspection'
                        : config.frozenView
                          ? '3D View Frozen'
                          : 'Drag to rotate · Tap part to color'}
                </span>
              </div>

              {/* Free Drawing Toolbar (works on BOTH 2D & 3D) */}
              {interactionMode === 'draw' && (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#2a2a2e]">
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-[#cfc9bf]">
                    <span>Color</span>
                    <input
                      type="color"
                      aria-label="Free drawing color"
                      value={config.freeDrawColor}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          freeDrawColor: e.target.value,
                        }))
                      }
                      className="w-8 h-6 rounded bg-transparent border border-[#2a2a2e] cursor-pointer"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 text-[11px] text-[#cfc9bf]">
                    <span>Width ({config.freeDrawWidth}px)</span>
                    <input
                      type="range"
                      aria-label="Free drawing line width"
                      min={1}
                      max={14}
                      value={config.freeDrawWidth}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          freeDrawWidth: +e.target.value,
                        }))
                      }
                      className="w-24 accent-[#c9883d]"
                    />
                  </label>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      disabled={
                        is2DView
                          ? config.freeDrawStrokes2D.length === 0
                          : config.freeDrawStrokes3D.length === 0
                      }
                      onClick={() =>
                        setConfig((prev) =>
                          is2DView
                            ? {
                                ...prev,
                                freeDrawStrokes2D:
                                  prev.freeDrawStrokes2D.slice(0, -1),
                              }
                            : {
                                ...prev,
                                freeDrawStrokes3D:
                                  prev.freeDrawStrokes3D.slice(0, -1),
                              },
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#2a2a2e] bg-[#18181b] text-xs text-[#cfc9bf] hover:text-[#e8a317] disabled:opacity-45 cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Undo
                    </button>
                    <button
                      type="button"
                      disabled={
                        is2DView
                          ? config.freeDrawStrokes2D.length === 0
                          : config.freeDrawStrokes3D.length === 0
                      }
                      onClick={() =>
                        setConfig((prev) =>
                          is2DView
                            ? { ...prev, freeDrawStrokes2D: [] }
                            : { ...prev, freeDrawStrokes3D: [] },
                        )
                      }
                      className="px-2.5 py-1 rounded border border-[#2a2a2e] bg-[#18181b] text-xs text-[#cfc9bf] hover:text-[#e8a317] disabled:opacity-45 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Tap-to-Place Picket Accent Toolbar */}
              {interactionMode === 'accent' && (
                <div className="space-y-2 pt-2 border-t border-[#2a2a2e]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-[#e8a317]">
                      {config.selectedPicketIndex !== null
                        ? `Picket #${config.selectedPicketIndex + 1} selected`
                        : supportsPickets
                          ? 'Tap any picket to select it'
                          : 'Pickets require Gate or Railing'}
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          { id: 'knuckle', label: 'Knuckle' },
                          { id: 'emblem', label: 'Emblem' },
                          { id: 'leaf', label: 'Leaf' },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleAttachAccentToSelected(item.id)}
                          className={`px-3 py-1 rounded-md border text-xs font-semibold cursor-pointer transition-colors ${
                            activeAccentTool === item.id
                              ? 'border-[#e8a317] bg-[#c9883d] text-[#141210]'
                              : 'border-[#c9883d]/60 bg-[#1c1a16] text-[#e8a317] hover:border-[#e8a317]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}

                      {config.selectedPicketIndex !== null &&
                        (config.picketAccents[config.selectedPicketIndex] || [])
                          .length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAccentFromSelected()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#2a2a2e] bg-[#18181b] text-xs text-[#cfc9bf] hover:border-[#e8a317] hover:text-[#e8a317] cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                            Remove Accent
                          </button>
                        )}
                    </div>

                    <span className="text-[11px] text-[#cfc9bf] ml-auto tabular-nums">
                      Knuckles: {picketStats.accentCounts.knuckle} · Emblems:{' '}
                      {picketStats.accentCounts.emblem} · Leaves:{' '}
                      {picketStats.accentCounts.leaf}
                    </span>
                  </div>

                  {config.selectedPicketIndex !== null &&
                    (config.picketAccents[config.selectedPicketIndex] || [])
                      .length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-[#a8a29a]">
                          On Picket #{config.selectedPicketIndex + 1}:
                        </span>
                        {(
                          config.picketAccents[config.selectedPicketIndex] || []
                        ).map((acc, idx) => (
                          <button
                            key={`${acc}-${idx}`}
                            type="button"
                            onClick={() => handleRemoveAccentFromSelected(idx)}
                            title="Click to remove this accent"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181b] border border-[#2a2a2e] text-[#cfc9bf] hover:border-[#e8a317] cursor-pointer"
                          >
                            {acc} ×
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Main Viewport Canvas Container */}
          <div
            onDragOver={handleViewportDragOver}
            onDragLeave={handleViewportDragLeave}
            onDrop={handleViewportDrop}
            className={`relative w-full rounded-lg overflow-hidden border bg-[#101012] transition-colors ${
              isPhotoDragActive && is3DViewportActive
                ? 'border-[#e8a317] ring-2 ring-[#e8a317]/60'
                : 'border-[#2a2a2e]'
            }`}
          >
            <canvas
              ref={canvas3dRef}
              aria-label="Interactive 3D model of your configured ironwork. Drag to rotate, or tap any part to color or place accents."
              className={`w-full h-[320px] sm:h-[440px] lg:h-[500px] ${
                is3DViewportActive && !webglFailed ? 'block' : 'hidden'
              }`}
            />
            <canvas
              ref={canvas3dDrawRef}
              onPointerDown={handle3DDrawDown}
              onPointerMove={handle3DDrawMove}
              onPointerUp={handle3DDrawUp}
              onPointerCancel={handle3DDrawUp}
              aria-label="Freehand drawing overlay on 3D view"
              className={`absolute inset-0 w-full h-full ${
                is3DViewportActive && !webglFailed ? 'block' : 'hidden'
              } ${
                interactionMode === 'draw'
                  ? 'pointer-events-auto cursor-crosshair touch-none'
                  : 'pointer-events-none'
              }`}
            />
            <div className={`relative w-full ${is2DView ? 'block' : 'hidden'}`}>
              <canvas
                ref={blueprintCanvasRef}
                width={1100}
                height={740}
                onPointerDown={handle2DCanvasDown}
                onPointerMove={handle2DCanvasMove}
                onPointerUp={handle2DCanvasUp}
                onPointerCancel={handle2DCanvasUp}
                aria-label={
                  uploadedPhoto
                    ? 'Uploaded photo 2D elevation shaded by luminance relief with touch dimensioning'
                    : '2D technical elevation drawing, thickness callouts, color legend, materials list, and isometric view of your configured piece'
                }
                className={`w-full h-auto bg-[#1b3a6b] block ${
                  interactionMode === 'draw'
                    ? 'cursor-crosshair touch-none'
                    : uploadedPhoto
                      ? photo2DMode === 'add' || photo2DMode === 'calibrate'
                        ? 'cursor-crosshair touch-manipulation'
                        : 'touch-manipulation'
                      : interactionMode === 'accent'
                        ? 'cursor-pointer'
                        : ''
                }`}
              />

              {/* Touch-first interactive endpoint/midpoint handles & delete controls for uploaded photo 2D dimensions */}
              {is2DView &&
                uploadedPhoto &&
                photoReliefEntry &&
                interactionMode !== 'draw' && (
                  <div className="pointer-events-none absolute inset-0">
                    {(() => {
                      const pRect = getUploadedPhoto2DRect(
                        photoReliefEntry.aspect,
                      );
                      return (uploadedPhoto.dimensions || []).map((dim, idx) => {
                        const left1 = ((pRect.x + dim.x1 * pRect.w) / 1100) * 100;
                        const top1 = ((pRect.y + dim.y1 * pRect.h) / 740) * 100;
                        const left2 = ((pRect.x + dim.x2 * pRect.w) / 1100) * 100;
                        const top2 = ((pRect.y + dim.y2 * pRect.h) / 740) * 100;
                        const leftM = (left1 + left2) / 2;
                        const topM = (top1 + top2) / 2;
                        return (
                          <div key={dim.id} className="contents">
                            <button
                              type="button"
                              aria-label={`Drag dimension #${idx + 1} start point`}
                              onPointerDown={(e) =>
                                startPhotoHandleDrag('p1', dim, e)
                              }
                              onPointerMove={movePhotoHandleDrag}
                              onPointerUp={endPhotoHandleDrag}
                              onPointerCancel={endPhotoHandleDrag}
                              style={{ left: `${left1}%`, top: `${top1}%` }}
                              className="pointer-events-auto touch-none absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing bg-transparent border-0 p-0"
                            >
                              <span className="w-4 h-4 rounded-full bg-[#f59e0b] border-2 border-[#0b1526] shadow-md block" />
                            </button>

                            <button
                              type="button"
                              aria-label={`Drag dimension #${idx + 1} end point`}
                              onPointerDown={(e) =>
                                startPhotoHandleDrag('p2', dim, e)
                              }
                              onPointerMove={movePhotoHandleDrag}
                              onPointerUp={endPhotoHandleDrag}
                              onPointerCancel={endPhotoHandleDrag}
                              style={{ left: `${left2}%`, top: `${top2}%` }}
                              className="pointer-events-auto touch-none absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing bg-transparent border-0 p-0"
                            >
                              <span className="w-4 h-4 rounded-full bg-[#f59e0b] border-2 border-[#0b1526] shadow-md block" />
                            </button>

                            <div
                              style={{
                                left: `${leftM}%`,
                                top: `calc(${topM}% + 14px)`,
                              }}
                              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1"
                            >
                              <button
                                type="button"
                                aria-label={`Drag to move dimension #${idx + 1}`}
                                onPointerDown={(e) =>
                                  startPhotoHandleDrag('move', dim, e)
                                }
                                onPointerMove={movePhotoHandleDrag}
                                onPointerUp={endPhotoHandleDrag}
                                onPointerCancel={endPhotoHandleDrag}
                                className="touch-none w-7 h-7 rounded-full bg-[#101c33]/95 border border-[#f59e0b] text-[#fde68a] flex items-center justify-center cursor-grab active:cursor-grabbing shadow"
                              >
                                <Move className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete dimension #${idx + 1}`}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePhotoDimension(dim.id);
                                }}
                                className="touch-none w-7 h-7 rounded-full bg-[#1c1212]/95 border border-[#f87171] text-[#fca5a5] hover:bg-[#7f1d1d] hover:text-white flex items-center justify-center cursor-pointer shadow"
                              >
                                <X className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
            </div>

            {/* Dedicated Technical Drawing View (Front Elevation Sheet) */}
            {isTechView && (
              <div className="bg-[#0f274d] p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display uppercase tracking-[0.1em] text-sm text-[#e8a317] m-0">
                      Technical Drawing — Front Elevation
                    </h4>
                    <p className="text-[11px] text-[#bae6fd] m-0">
                      Scale: not to scale — dimensions in feet/inches as
                      labelled
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadTechnicalPng}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-bold text-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      Download PNG
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadTechnicalPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#e8a317]/70 bg-[#101c33] hover:border-[#e8a317] text-[#e8a317] font-bold text-xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                      Download PDF
                    </button>
                  </div>
                </div>

                {/* Live Computed Specs Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded bg-[#0a1830] border border-white/15 px-2.5 py-1.5">
                    <span className="block text-[10px] text-[#93c5fd]">
                      Overall Dimensions
                    </span>
                    <strong className="text-white tabular-nums">
                      {formatFeetInches(config.width)} W ×{' '}
                      {formatFeetInches(config.height)} H
                    </strong>
                  </div>
                  <div className="rounded bg-[#0a1830] border border-white/15 px-2.5 py-1.5">
                    <span className="block text-[10px] text-[#93c5fd]">
                      Pickets &amp; Spacing
                    </span>
                    <strong className="text-white tabular-nums">
                      {picketStats.supportsPickets
                        ? `${picketStats.totalPickets} @ ${config.picketSpacing}" O.C.`
                        : 'None'}
                    </strong>
                  </div>
                  <div className="rounded bg-[#0a1830] border border-white/15 px-2.5 py-1.5">
                    <span className="block text-[10px] text-[#93c5fd]">
                      Stock Callouts
                    </span>
                    <strong className="text-white">
                      {activeSupplierSpecs.picketOpt.inches}&Prime; picket ·{' '}
                      {activeSupplierSpecs.barOpt.inches}&Prime; rail
                    </strong>
                  </div>
                  <div className="rounded bg-[#0a1830] border border-white/15 px-2.5 py-1.5">
                    <span className="block text-[10px] text-[#93c5fd]">
                      Picket Accents
                    </span>
                    <strong className="text-[#e8a317] tabular-nums">
                      Knuckles: {picketStats.accentCounts.knuckle} · Emblems:{' '}
                      {picketStats.accentCounts.emblem} · Leaves:{' '}
                      {picketStats.accentCounts.leaf}
                    </strong>
                  </div>
                </div>

                <canvas
                  ref={techCanvasRef}
                  width={1100}
                  height={740}
                  aria-label="Live technical front elevation drawing with dimensions, picket spacing, stock thicknesses, and BOM"
                  className="w-full h-auto rounded border border-white/20 bg-[#0f274d] block"
                />
              </div>
            )}

            {/* Dedicated Isometric Blueprint View */}
            {isIsoView && (
              <div className="bg-[#12294e] p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display uppercase tracking-[0.1em] text-sm text-[#e8a317] m-0">
                      {uploadedPhoto
                        ? `Uploaded photo — Isometric View · ${uploadedPhoto.fileName}`
                        : 'Isometric Blueprint View — 3D Projection'}
                    </h4>
                    <p className="text-[11px] text-[#bae6fd] m-0">
                      {uploadedPhoto
                        ? '3D interpretation of your photo — not a true scan; the back side is not captured.'
                        : 'Live 30° isometric projection with Width, Height, and Depth callouts & materials list'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadIsometricPng}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-bold text-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      Download PNG
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadIsometricPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#e8a317]/70 bg-[#101c33] hover:border-[#e8a317] text-[#e8a317] font-bold text-xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                      Download PDF
                    </button>
                  </div>
                </div>

                <canvas
                  ref={isoCanvasRef}
                  width={1100}
                  height={740}
                  aria-label={
                    uploadedPhoto
                      ? 'Uploaded photo isometric relief view with luminance depth'
                      : 'Dedicated Isometric Blueprint View showing live 3D projection, axis dimensions, accents, and materials'
                  }
                  className="w-full h-auto rounded border border-white/20 bg-[#12294e] block"
                />
              </div>
            )}

            {/* Dedicated Material Cut List & Assembly Schematic View */}
            {isCutListView && (
              <div className="bg-[#0d213f] p-3 sm:p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display uppercase tracking-[0.1em] text-sm text-[#e8a317] m-0 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" aria-hidden="true" />
                      Material Cut List &amp; Assembly Schematic
                    </h4>
                    <p className="text-[11px] text-[#bae6fd] m-0 mt-0.5">
                      Exploded callout schematic (A–{detailedCutList.items[detailedCutList.items.length - 1]?.tag || 'Z'}) paired with every steel profile, panel, cap, leaf, hardware piece, and finish consumable needed to build this {PIECES[config.piece].label.toLowerCase()}.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadCutListPng}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-bold text-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      Schematic PNG
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCutListPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#e8a317]/70 bg-[#101c33] hover:border-[#e8a317] text-[#e8a317] font-bold text-xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                      Cut List PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCutListCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/25 bg-[#0a1830] hover:border-[#7dd3fc] text-[#bae6fd] font-bold text-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Mill Stock & Order Totals KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded bg-[#0a1830] border border-white/15 px-2.5 py-1.5">
                    <span className="block text-[10px] text-[#93c5fd]">
                      Itemized Cut Lines
                    </span>
                    <strong className="text-white tabular-nums">
                      {detailedCutList.totals.lineItems} materials &amp; kits
                    </strong>
                  </div>
                  <div className="rounded bg-[#0a1830] border border-white/15 px-2.5 py-1.5">
                    <span className="block text-[10px] text-[#93c5fd]">
                      Total Linear Stock
                    </span>
                    <strong className="text-[#e8a317] tabular-nums">
                      {detailedCutList.totals.linearFeet} ln ft (~
                      {detailedCutList.totals.estimated20FtSticks} × 20&prime; sticks)
                    </strong>
                  </div>
                  <div className="rounded bg-[#0a1830] border border-white/15 px-2.5 py-1.5">
                    <span className="block text-[10px] text-[#93c5fd]">
                      Sheet / Plate Area
                    </span>
                    <strong className="text-white tabular-nums">
                      {detailedCutList.totals.sheetSqFt} sq ft
                    </strong>
                  </div>
                  <div className="rounded bg-[#0a1830] border border-white/15 px-2.5 py-1.5">
                    <span className="block text-[10px] text-[#93c5fd]">
                      Hardware, Caps &amp; Leaves
                    </span>
                    <strong className="text-white tabular-nums">
                      {detailedCutList.totals.fittingsCount} pcs ·{' '}
                      {detailedCutList.supplierName}
                    </strong>
                  </div>
                </div>

                {/* Schematic Blueprint Canvas */}
                <canvas
                  ref={cutListCanvasRef}
                  width={1100}
                  height={740}
                  aria-label="Material Cut List and Exploded Assembly Schematic with callout tags matching itemized build materials"
                  className="w-full h-auto rounded border border-white/20 bg-[#0d213f] block"
                />

                {/* Full Interactive Itemized Cut List Table */}
                <div className="rounded-lg border border-white/20 bg-[#08162b] overflow-hidden">
                  <div className="px-3 py-2 border-b border-white/15 flex flex-wrap items-center justify-between gap-2 bg-[#0a1c36]">
                    <span className="font-display uppercase tracking-[0.08em] text-xs text-[#e8a317]">
                      Complete Itemized Build Cut List —{' '}
                      {PIECES[config.piece].label} ({detailedCutList.finishSpec})
                    </span>
                    <span className="text-[11px] text-[#93c5fd]">
                      Tags match exploded callout balloons on schematic above
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/15 text-[10px] uppercase tracking-[0.06em] text-[#93c5fd] bg-[#0a1830]">
                          <th className="py-2 px-2.5">Tag</th>
                          <th className="py-2 px-2.5">Category</th>
                          <th className="py-2 px-2.5">Component</th>
                          <th className="py-2 px-2.5">Material / Stock Profile</th>
                          <th className="py-2 px-2.5">Qty</th>
                          <th className="py-2 px-2.5">Cut Length / Size</th>
                          <th className="py-2 px-2.5">Total</th>
                          <th className="py-2 px-2.5">Fabrication Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {detailedCutList.items.map((row) => (
                          <tr
                            key={row.tag}
                            className="hover:bg-white/[0.04] transition-colors"
                          >
                            <td className="py-2 px-2.5">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#e8a317] text-[#101012] font-bold text-[11px]">
                                {row.tag}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-[#7dd3fc] whitespace-nowrap font-medium">
                              {row.category}
                            </td>
                            <td className="py-2 px-2.5 text-white font-semibold">
                              {row.part}
                            </td>
                            <td className="py-2 px-2.5 text-[#e2e8f0]">
                              {row.stockProfile}
                            </td>
                            <td className="py-2 px-2.5 text-[#fef3c7] font-semibold whitespace-nowrap tabular-nums">
                              {row.qty}
                            </td>
                            <td className="py-2 px-2.5 text-white whitespace-nowrap tabular-nums">
                              {row.cutLength}
                            </td>
                            <td className="py-2 px-2.5 text-[#7dd3fc] font-semibold whitespace-nowrap tabular-nums">
                              {row.totalMeasure}
                            </td>
                            <td className="py-2 px-2.5 text-[#cbd5e1]">
                              {row.notes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {is3DViewportActive && !webglFailed && (
              <div className="pointer-events-none absolute top-3 left-3 px-2.5 py-1 rounded bg-[#101012]/80 border border-[#2a2a2e] text-[11px] text-[#cfc9bf]">
                {interactionMode === 'draw'
                  ? 'Mode: Draw — sketch directly with pen, mouse, or touch'
                  : uploadedPhoto
                    ? 'Tip: Drag to orbit & scroll to zoom the 3D photo relief'
                    : interactionMode === 'accent'
                      ? 'Mode: Place Accents — tap a picket, then pick Knuckle / Emblem / Leaf'
                      : interactionMode === 'select'
                        ? 'Mode: Select — tap a part to color or tap a picket'
                        : 'Tip: Drag to rotate · Tap any part to select for Touch-to-Color'}
              </div>
            )}
            {is3DViewportActive && !webglFailed && uploadedPhoto && (
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-lg">
                <div className="pointer-events-auto bg-[#101012]/90 border border-[#c9883d]/75 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[11px] font-bold text-[#e8a317] m-0 truncate">
                      Uploaded photo — 3D interpretation · {uploadedPhoto.fileName}
                    </p>
                    <p className="text-[11px] text-[#e2ded5] m-0 leading-snug">
                      3D interpretation of your photo — not a true scan; the back side is not captured.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveUploadedPhoto}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#4a2b2b] bg-[#1c1212] hover:border-[#f87171] text-[#fca5a5] text-[11px] font-semibold cursor-pointer shrink-0"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                    Remove photo
                  </button>
                </div>
              </div>
            )}
            {is3DViewportActive && isPhotoDragActive && (
              <div className="pointer-events-none absolute inset-0 bg-[#101012]/80 flex items-center justify-center p-4">
                <div className="border-2 border-dashed border-[#e8a317] rounded-xl px-6 py-4 text-center">
                  <p className="font-display uppercase tracking-[0.12em] text-sm text-[#e8a317] m-0">
                    Drop photo to build 3D relief model
                  </p>
                  <p className="text-xs text-[#d5cfc5] m-0 mt-1">
                    Stays in your browser — never uploaded to any server
                  </p>
                </div>
              </div>
            )}
            {is3DViewportActive && webglFailed && (
              <div className="p-8 text-center text-[#cfc9bf]">
                <p className="mb-3">
                  The 3D viewer could not initialize in this browser. Switch to
                  the 2D Blueprint view or use the technical drawings below —
                  you can still configure your piece, download DXF/Blueprint,
                  and send a quote request.
                </p>
                <button
                  type="button"
                  onClick={() => setStudioTab('2d')}
                  className="px-4 py-2 rounded-lg bg-[#c9883d] text-[#141210] font-bold text-sm cursor-pointer"
                >
                  Open 2D Blueprint
                </button>
              </div>
            )}
          </div>

          {/* Live Configuration Readout */}
          <p className="font-display tracking-[0.05em] text-[#e8a317] text-base sm:text-lg m-0 tabular-nums">
            {uploadedPhoto && (is3DViewportActive || is2DView || isIsoView)
              ? `Uploaded photo — 3D interpretation · ${uploadedPhoto.fileName} (not a true scan; the back side is not captured)`
              : describeConfig(config)}
          </p>

          {/* Viewport Playback & Freeze View Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              aria-pressed={config.turntable}
              disabled={!is3DViewportActive || webglFailed || config.frozenView}
              onClick={() =>
                setConfig((prev) => ({ ...prev, turntable: !prev.turntable }))
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#cfc9bf]/60 text-sm font-semibold text-white hover:border-[#e8a317] hover:text-[#e8a317] disabled:opacity-45 cursor-pointer whitespace-nowrap"
            >
              {config.turntable ? (
                <>
                  <Pause className="w-4 h-4" aria-hidden="true" />
                  Pause Turntable
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" aria-hidden="true" />
                  Play Turntable
                </>
              )}
            </button>

            <button
              type="button"
              aria-pressed={config.frozenView}
              disabled={!is3DViewportActive || webglFailed}
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  frozenView: !prev.frozenView,
                }))
              }
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-semibold cursor-pointer whitespace-nowrap disabled:opacity-45 ${
                config.frozenView
                  ? 'border-[#e8a317] bg-[#e8a317] text-[#141210]'
                  : 'border-[#c9883d]/60 bg-[#141416] text-[#e8a317] hover:border-[#e8a317]'
              }`}
            >
              {config.frozenView ? (
                <>
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  Unfreeze 3D View
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" aria-hidden="true" />
                  Freeze 3D View
                </>
              )}
            </button>

            <label className="inline-flex items-center gap-2 text-sm text-[#d5cfc5] cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={config.simple}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, simple: e.target.checked }))
                }
                className="w-4 h-4 accent-[#c9883d]"
              />
              Simple mode
            </label>
          </div>

          {/* Export Section */}
          <div className="bg-[#141416] border border-[#2a2a2e] rounded-lg p-3.5 sm:p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-display uppercase tracking-[0.14em] text-xs text-[#c9883d] m-0">
                Export Your Design
              </h4>
              <span className="text-xs text-[#a8a29a]">
                Generated from current piece &amp; real dimensions
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownloadDxf}
                className="flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border border-[#c9883d]/60 bg-[#1c1a16] text-left hover:border-[#e8a317] cursor-pointer transition-colors"
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#e8a317]">
                  <FileCode2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  DXF
                </span>
                <span className="text-[11px] text-[#cfc9bf] leading-tight">
                  for CNC plasma table
                </span>
              </button>

              <button
                type="button"
                disabled={webglFailed}
                onClick={handleDownloadStl}
                className="flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border border-[#c9883d]/60 bg-[#1c1a16] text-left hover:border-[#e8a317] disabled:opacity-45 cursor-pointer transition-colors"
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#e8a317]">
                  <Box className="w-4 h-4 shrink-0" aria-hidden="true" />
                  STL
                </span>
                <span className="text-[11px] text-[#cfc9bf] leading-tight">
                  3D model
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border border-[#c9883d]/60 bg-[#1c1a16] text-left hover:border-[#e8a317] cursor-pointer transition-colors"
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#e8a317]">
                  <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                  PDF Cut Sheet
                </span>
                <span className="text-[11px] text-[#cfc9bf] leading-tight">
                  Dimensions &amp; BOM
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadBlueprint}
                className="flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border border-[#2a2a2e] bg-[#1c1c1f] text-left hover:border-[#e8a317] cursor-pointer transition-colors"
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#f2efe8]">
                  <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                  Blueprint PNG
                </span>
                <span className="text-[11px] text-[#a8a29a] leading-tight">
                  2D technical drawing
                </span>
              </button>

              <button
                type="button"
                disabled={webglFailed}
                onClick={handleCaptureStill}
                className="flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border border-[#2a2a2e] bg-[#1c1c1f] text-left hover:border-[#e8a317] disabled:opacity-45 cursor-pointer transition-colors"
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#f2efe8]">
                  <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
                  Still PNG
                </span>
                <span className="text-[11px] text-[#a8a29a] leading-tight">
                  Current 3D render
                </span>
              </button>

              <button
                type="button"
                disabled={recording || webglFailed}
                onClick={handleRecordTurntable}
                className="flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border border-[#2a2a2e] bg-[#1c1c1f] text-left hover:border-[#e8a317] disabled:opacity-45 cursor-pointer transition-colors"
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#f2efe8]">
                  <Video className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {recording ? 'Recording…' : 'Turntable Video'}
                </span>
                <span className="text-[11px] text-[#a8a29a] leading-tight">
                  8 sec 360&deg; rotation
                </span>
              </button>
            </div>

            {/* Send to Cut — Share a Link to This Cut File */}
            <div className="pt-3 border-t border-[#2a2a2e] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Link2
                    className="w-4 h-4 text-[#e8a317] shrink-0"
                    aria-hidden="true"
                  />
                  <h5 className="font-display uppercase tracking-[0.1em] text-xs text-[#e8a317] m-0">
                    Send to Cut — share a link to this cut file
                  </h5>
                </div>
                <div className="flex items-center gap-1.5">
                  <label htmlFor="share-cut-fmt" className="text-[11px] text-[#a8a29a]">
                    Format:
                  </label>
                  <select
                    id="share-cut-fmt"
                    value={shareFormat}
                    onChange={(e) => {
                      const nextFmt = e.target.value as CutShareFormat;
                      setShareFormat(nextFmt);
                      if (shareUrl) void handleGenerateShareLink(nextFmt);
                    }}
                    className="px-2 py-1 rounded bg-[#101012] border border-[#2a2a2e] text-xs text-[#f2efe8]"
                  >
                    <option value="dxf">DXF (CNC plasma)</option>
                    <option value="stl">STL (3D mesh)</option>
                    <option value="pdf">PDF (Cut sheet)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleGenerateShareLink(shareFormat)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-bold text-xs cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Generate Cut Link
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopyShareLink()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#2a2a2e] bg-[#1c1c1f] hover:border-[#e8a317] text-xs font-semibold text-[#f2efe8] cursor-pointer"
                >
                  {shareCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#9ed69a]" aria-hidden="true" />
                      Copied link
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      Copy link
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const url = shareUrl || (await handleGenerateShareLink(shareFormat));
                    const subject = encodeURIComponent(
                      `Ray's Ironworks Cut File (${PIECES[config.piece].label} - ${shareFormat.toUpperCase()})`,
                    );
                    const body = encodeURIComponent(
                      `Open this link to load the design and download the ${shareFormat.toUpperCase()} cut file:\n\n${url}\n\nSummary:\n${describeConfig(config)}`,
                    );
                    window.location.href = `mailto:?subject=${subject}&body=${body}`;
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#2a2a2e] bg-[#1c1c1f] hover:border-[#e8a317] text-xs font-semibold text-[#f2efe8] cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  Share by Email
                </button>
              </div>

              {shareUrl && (
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  aria-label="Shareable cut file URL"
                  onFocus={(e) => e.target.select()}
                  className="w-full px-2.5 py-1.5 rounded bg-[#101012] border border-[#2a2a2e] text-[11px] font-mono text-[#cfc9bf]"
                />
              )}

              <p className="text-[11px] text-[#a8a29a] m-0">
                Runs cleanly without a file server: the link encodes your
                piece&apos;s dimensions, patterns, and vectors directly inside
                the URL so whoever opens it can generate and download the{' '}
                {shareFormat.toUpperCase()} file in one click.
              </p>
            </div>
          </div>

          {status.text && (
            <p
              role="status"
              className={`text-sm m-0 ${
                status.kind === 'ok'
                  ? 'text-[#9ed69a]'
                  : status.kind === 'warn'
                    ? 'text-[#e8c97a]'
                    : 'text-[#d8d2c8]'
              }`}
            >
              {status.text}
            </p>
          )}

          <p className="text-xs sm:text-sm text-[#a8a29a] m-0">
            This is a visualization of your configured piece — not a photograph
            of a finished piece. Ray builds the real thing to your exact
            measurements. The DXF exports real inches on a CUT layer for CNC
            plasma; the STL exports the 3D mesh; the 2D blueprint shows concept
            dimensions, material thicknesses, color legend, materials list, and
            isometric projection.
          </p>
        </div>

        {/* Right: Studio Controls Inspector */}
        <div className="flex flex-col gap-5 bg-[#141416] border border-[#2a2a2e] rounded-lg p-4 sm:p-5">
          {/* 01. Material, Finish & Touch-to-Color */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display uppercase tracking-[0.12em] text-xs text-[#c9883d] m-0">
                01. Material, Finish &amp; Touch-to-Color
              </h4>
              <button
                type="button"
                onClick={() => setStudioTab('color')}
                className="text-xs text-[#e8a317] underline underline-offset-2 cursor-pointer bg-transparent border-0 p-0"
              >
                Open Full Color Studio
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="cfg-material"
                  className="block text-xs text-[#a8a29a] mb-1"
                >
                  Material
                </label>
                <select
                  id="cfg-material"
                  value={config.material}
                  onChange={(e) => {
                    const nextMat = e.target.value as MaterialType;
                    setConfig((prev) => ({
                      ...prev,
                      material: nextMat,
                      finish:
                        nextMat === 'wrought'
                          ? prev.finish
                          : 'natural',
                    }));
                  }}
                  className="w-full px-2.5 py-2 rounded-md bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-sm"
                >
                  {(Object.keys(MATERIALS) as MaterialType[]).map((key) => (
                    <option key={key} value={key}>
                      {MATERIALS[key].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="cfg-finish"
                  className="block text-xs text-[#a8a29a] mb-1"
                >
                  Finish
                </label>
                <select
                  id="cfg-finish"
                  value={config.finish}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      finish: e.target.value as FinishType,
                      customColor: null,
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-md bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-sm"
                >
                  {(Object.keys(FINISHES) as FinishType[]).map((key) => (
                    <option key={key} value={key}>
                      {FINISHES[key].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {config.material === 'other' && (
              <div>
                <label
                  htmlFor="cfg-custom-material"
                  className="block text-xs text-[#a8a29a] mb-1"
                >
                  Name your material (optional)
                </label>
                <input
                  id="cfg-custom-material"
                  type="text"
                  value={config.customMaterialName}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      customMaterialName: e.target.value,
                    }))
                  }
                  placeholder="e.g. reclaimed redwood, titanium, zinc sheet"
                  className="w-full px-2.5 py-2 rounded-md bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-sm placeholder:text-[#6f6b64]"
                />
              </div>
            )}

            {config.finish === 'powder-coat' && !config.customColor && (
              <div>
                <label
                  htmlFor="cfg-powder"
                  className="block text-xs text-[#a8a29a] mb-1.5"
                >
                  Powder-coat color
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(POWDERS) as PowderColorType[]).map((key) => {
                    const active = config.powder === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            powder: key,
                            customColor: null,
                          }))
                        }
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs text-left cursor-pointer ${
                          active
                            ? 'border-[#e8a317] bg-[#1e1e22] text-[#f2efe8]'
                            : 'border-[#2a2a2e] bg-[#101012] text-[#cfc9bf] hover:border-[#c9883d]/60'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-sm border border-white/20 shrink-0"
                          style={{ backgroundColor: POWDERS[key].swatch }}
                          aria-hidden="true"
                        />
                        {POWDERS[key].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Touch-to-Color & Color & Finish controls right inside Section 1 */}
            <div className="bg-[#101012] border border-[#2a2a2e] rounded-lg p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#e8a317]">
                  Touch-to-Color — tap a 3D part or choose an area
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetSelectedArea}
                    className="px-2 py-0.5 rounded border border-[#2a2a2e] bg-[#1c1c1f] text-[11px] text-[#e8a317] hover:border-[#e8a317] cursor-pointer"
                  >
                    Reset Area
                  </button>
                  <button
                    type="button"
                    disabled={!config.customColor && !hasAnyAreaColors}
                    onClick={handleResetAllColors}
                    className="px-2 py-0.5 rounded border border-[#2a2a2e] bg-[#1c1c1f] text-[11px] text-[#cfc9bf] hover:border-[#e8a317] disabled:opacity-45 cursor-pointer"
                  >
                    Reset All Colors
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedColorTarget('whole')}
                  className={`px-2 py-1 rounded text-[11px] border cursor-pointer ${
                    selectedColorTarget === 'whole'
                      ? 'border-[#e8a317] bg-[#242018] text-[#e8a317] font-semibold'
                      : 'border-[#2a2a2e] bg-[#18181b] text-[#cfc9bf]'
                  }`}
                >
                  Whole Piece
                </button>
                {PART_AREAS.map((area) => {
                  const areaHex = config.areaColors[area];
                  const active = selectedColorTarget === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setSelectedColorTarget(area)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] border cursor-pointer ${
                        active
                          ? 'border-[#e8a317] bg-[#242018] text-[#e8a317] font-semibold'
                          : 'border-[#2a2a2e] bg-[#18181b] text-[#cfc9bf]'
                      }`}
                    >
                      {areaHex && (
                        <span
                          className="w-2 h-2 rounded-full border border-white/30"
                          style={{ backgroundColor: areaHex }}
                          aria-hidden="true"
                        />
                      )}
                      {PART_AREA_LABELS[area]}
                    </button>
                  );
                })}
              </div>

              {/* Compact Gradient Strip */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#a8a29a] mb-1">
                  <span>
                    Coloring:{' '}
                    <strong className="text-[#f2efe8]">
                      {selectedColorTarget === 'whole'
                        ? 'Whole Piece'
                        : PART_AREA_LABELS[selectedColorTarget]}
                    </strong>
                  </span>
                  <span className="font-mono text-[#e8a317]">
                    {activeTargetHex.toUpperCase()}
                  </span>
                </div>
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Touch-to-color gradient scale"
                  aria-valuetext={activeTargetHex}
                  onClick={handleGradientScaleClick}
                  onMouseMove={(e) => {
                    if (e.buttons === 1) handleGradientScaleClick(e);
                  }}
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(255,255,255,0.45), rgba(0,0,0,0.45)), linear-gradient(to right, #ff3b30, #ff9500, #ffcc00, #34c759, #00c7be, #007aff, #5856d6, #af52de, #ff2d55, #ff3b30)',
                  }}
                  className="w-full h-11 rounded border border-[#2a2a2e] cursor-crosshair"
                />
              </div>

              {/* Compact Square Swatch Selector */}
              <div className="grid grid-cols-8 gap-1.5">
                {CUSTOM_COLOR_SWATCHES.map((sw) => {
                  const active =
                    activeTargetHex.toLowerCase() === sw.hex.toLowerCase();
                  return (
                    <button
                      key={sw.hex}
                      type="button"
                      title={`${sw.label} (${sw.hex})`}
                      onClick={() => applyColorHex(sw.hex)}
                      className={`h-6 rounded-sm border cursor-pointer transition-transform ${
                        active
                          ? 'border-[#e8a317] scale-105 ring-1 ring-[#e8a317]'
                          : 'border-white/20 hover:border-[#e8a317]'
                      }`}
                      style={{ backgroundColor: sw.hex }}
                      aria-label={`${sw.label} swatch`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* 02. Dimensions & Frame */}
          <div className="pt-4 border-t border-[#2a2a2e] space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-display uppercase tracking-[0.12em] text-xs text-[#c9883d] m-0">
                02. Dimensions &amp; Frame
              </h4>
              <button
                type="button"
                onClick={() => handlePieceChange(config.piece)}
                className="inline-flex items-center gap-1 text-xs text-[#a8a29a] hover:text-[#e8a317] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reset size
              </button>
            </div>

            {/* Size Mode Selector: Standard | Custom | Artistic */}
            <div>
              <span className="block text-xs text-[#a8a29a] mb-1.5">
                Size Options
              </span>
              <div
                className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[#101012] border border-[#2a2a2e]"
                role="radiogroup"
                aria-label="Size options"
              >
                {SIZE_MODES.map((m) => {
                  const active = config.sizeMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, sizeMode: m.id }))
                      }
                      className={`py-1.5 px-2 rounded text-xs font-semibold cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#c9883d] text-[#141210]'
                          : 'text-[#cfc9bf] hover:text-[#f2efe8]'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Standard Presets */}
              {config.sizeMode === 'standard' && (
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {pieceSpec.standardSizes.map((preset) => {
                    const active =
                      Math.abs(config.width - preset.width) < 0.01 &&
                      Math.abs(config.height - preset.height) < 0.01 &&
                      (preset.depth === undefined ||
                        Math.abs(config.depth - preset.depth) < 0.01);
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            width: preset.width,
                            height: preset.height,
                            depth: preset.depth ?? prev.depth,
                          }))
                        }
                        className={`px-2 py-1.5 rounded border text-[11px] text-left cursor-pointer transition-colors ${
                          active
                            ? 'border-[#e8a317] bg-[#242018] text-[#e8a317] font-semibold'
                            : 'border-[#2a2a2e] bg-[#101012] text-[#cfc9bf] hover:border-[#c9883d]/60'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Custom or Artistic Exact Numeric Inputs (allows beyond slider bounds) */}
              {(config.sizeMode === 'custom' ||
                config.sizeMode === 'artistic') && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-[#101012] border border-[#2a2a2e] space-y-2">
                  <p className="text-[11px] text-[#cfc9bf] m-0">
                    {config.sizeMode === 'artistic'
                      ? 'Artistic mode unlocks freeform proportions — enter any sculptural feet values.'
                      : 'Custom mode — enter exact measurements in feet (even beyond standard slider limits).'}
                  </p>
                  <div
                    className={`grid gap-2 ${
                      pieceSpec.depth ? 'grid-cols-3' : 'grid-cols-2'
                    }`}
                  >
                    <label className="text-[11px] text-[#a8a29a] flex flex-col gap-1">
                      {pieceSpec.widthLabel} (ft)
                      <input
                        type="number"
                        min={0.5}
                        max={200}
                        step={0.25}
                        value={config.width}
                        onChange={(e) =>
                          updateDimensionValue('width', e.target.value)
                        }
                        className="px-2 py-1.5 rounded bg-[#18181b] border border-[#2a2a2e] text-[#f2efe8] text-xs"
                      />
                    </label>
                    <label className="text-[11px] text-[#a8a29a] flex flex-col gap-1">
                      {pieceSpec.heightLabel} (ft)
                      <input
                        type="number"
                        min={0.5}
                        max={200}
                        step={0.25}
                        value={config.height}
                        onChange={(e) =>
                          updateDimensionValue('height', e.target.value)
                        }
                        className="px-2 py-1.5 rounded bg-[#18181b] border border-[#2a2a2e] text-[#f2efe8] text-xs"
                      />
                    </label>
                    {pieceSpec.depth && (
                      <label className="text-[11px] text-[#a8a29a] flex flex-col gap-1">
                        {pieceSpec.depthLabel || 'Depth'} (ft)
                        <input
                          type="number"
                          min={0.5}
                          max={200}
                          step={0.25}
                          value={config.depth}
                          onChange={(e) =>
                            updateDimensionValue('depth', e.target.value)
                          }
                          className="px-2 py-1.5 rounded bg-[#18181b] border border-[#2a2a2e] text-[#f2efe8] text-xs"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label htmlFor="cfg-width" className="text-[#cfc9bf]">
                  {pieceSpec.widthLabel}
                </label>
                <span className="text-[#e8a317] font-semibold tabular-nums">
                  {formatFeetInches(config.width)}
                </span>
              </div>
              <input
                id="cfg-width"
                type="range"
                min={pieceSpec.widthMin}
                max={
                  config.sizeMode === 'standard'
                    ? pieceSpec.widthMax
                    : Math.max(pieceSpec.widthMax, config.width)
                }
                step={pieceSpec.widthStep}
                value={config.width}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, width: +e.target.value }))
                }
                className="w-full accent-[#c9883d]"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label htmlFor="cfg-height" className="text-[#cfc9bf]">
                  {pieceSpec.heightLabel}
                </label>
                <span className="text-[#e8a317] font-semibold tabular-nums">
                  {formatFeetInches(config.height)}
                </span>
              </div>
              <input
                id="cfg-height"
                type="range"
                min={pieceSpec.heightMin}
                max={
                  config.sizeMode === 'standard'
                    ? pieceSpec.heightMax
                    : Math.max(pieceSpec.heightMax, config.height)
                }
                step={pieceSpec.heightStep}
                value={config.height}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, height: +e.target.value }))
                }
                className="w-full accent-[#c9883d]"
              />
            </div>

            {pieceSpec.depth && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label htmlFor="cfg-depth" className="text-[#cfc9bf]">
                    {pieceSpec.depthLabel || 'Depth'}
                  </label>
                  <span className="text-[#e8a317] font-semibold tabular-nums">
                    {formatFeetInches(config.depth)}
                  </span>
                </div>
                <input
                  id="cfg-depth"
                  type="range"
                  min={pieceSpec.depthMin}
                  max={
                    config.sizeMode === 'standard'
                      ? pieceSpec.depthMax
                      : Math.max(pieceSpec.depthMax || 6, config.depth)
                  }
                  step={pieceSpec.depthStep}
                  value={config.depth}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, depth: +e.target.value }))
                  }
                  className="w-full accent-[#c9883d]"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label
                  htmlFor="cfg-style"
                  className="block text-xs text-[#a8a29a] mb-1"
                >
                  Style
                </label>
                <select
                  id="cfg-style"
                  value={config.style}
                  onChange={(e) => {
                    const nextStyle = e.target.value;
                    setConfig((prev) => ({
                      ...prev,
                      style: nextStyle,
                      infillPattern:
                        isGateOrRailing && nextStyle === 'solid'
                          ? 'solid-panel'
                          : isGateOrRailing && nextStyle === 'horizontal'
                            ? 'horizontal-bars'
                            : isGateOrRailing && nextStyle === 'scroll'
                              ? 'scroll-panel'
                              : isGateOrRailing &&
                                  nextStyle === 'vertical' &&
                                  (prev.infillPattern === 'solid-panel' ||
                                    prev.infillPattern === 'horizontal-bars' ||
                                    prev.infillPattern === 'scroll-panel')
                                ? 'vertical-pickets'
                                : prev.infillPattern,
                    }));
                  }}
                  className="w-full px-2.5 py-2 rounded-md bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-sm"
                >
                  {pieceSpec.styles.map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {pieceSpec.leaves && (
                <div>
                  <label
                    htmlFor="cfg-leaves"
                    className="block text-xs text-[#a8a29a] mb-1"
                  >
                    Leaves
                  </label>
                  <select
                    id="cfg-leaves"
                    value={config.leaves}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        leaves: e.target.value as LeavesType,
                      }))
                    }
                    className="w-full px-2.5 py-2 rounded-md bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-sm"
                  >
                    <option value="single">Single leaf</option>
                    <option value="double">Double leaves</option>
                  </select>
                </div>
              )}

              {pieceSpec.topRail && (
                <div>
                  <label
                    htmlFor="cfg-toprail"
                    className="block text-xs text-[#a8a29a] mb-1"
                  >
                    Top rail profile
                  </label>
                  <select
                    id="cfg-toprail"
                    value={config.topRail}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        topRail: e.target.value as TopRailType,
                      }))
                    }
                    className="w-full px-2.5 py-2 rounded-md bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-sm"
                  >
                    <option value="flat">Flat bar</option>
                    <option value="round">Round tube</option>
                    <option value="cap">Wide cap</option>
                  </select>
                </div>
              )}

              {pieceSpec.post && (
                <div>
                  <label
                    htmlFor="cfg-post"
                    className="block text-xs text-[#a8a29a] mb-1"
                  >
                    Post style
                  </label>
                  <select
                    id="cfg-post"
                    value={config.postStyle}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        postStyle: e.target.value as PostStyleType,
                      }))
                    }
                    className="w-full px-2.5 py-2 rounded-md bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-sm"
                  >
                    {POST_STYLES.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {config.postStyle === 'custom' && (
                    <input
                      id="cfg-custom-post"
                      type="text"
                      value={config.customPostName}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          customPostName: e.target.value,
                        }))
                      }
                      placeholder="Describe custom post (e.g. 4x4 fluted pilaster)"
                      className="mt-1.5 w-full px-2.5 py-1.5 rounded bg-[#101012] text-[#f2efe8] border border-[#c9883d]/60 text-xs"
                    />
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="cfg-finial"
                  className="block text-xs text-[#a8a29a] mb-1"
                >
                  Finials &amp; Post Caps (on posts)
                </label>
                <select
                  id="cfg-finial"
                  value={config.finial}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      finial: e.target.value as FinialType,
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-md bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-sm"
                >
                  <optgroup label="Classic Finials">
                    {POST_CAPS_FINIALS.filter(
                      (f) => f.catalog === 'Standard',
                    ).map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="King Architectural Post Caps">
                    {POST_CAPS_FINIALS.filter(
                      (f) => f.catalog === 'King Architectural',
                    ).map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {pieceSpec.postSpacing && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label htmlFor="cfg-postspacing" className="text-[#cfc9bf]">
                    Post spacing
                  </label>
                  <span className="text-[#e8a317] font-semibold tabular-nums">
                    {config.postSpacing} ft
                  </span>
                </div>
                <input
                  id="cfg-postspacing"
                  type="range"
                  min={4}
                  max={8}
                  step={0.5}
                  value={config.postSpacing}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      postSpacing: +e.target.value,
                    }))
                  }
                  className="w-full accent-[#c9883d]"
                />
              </div>
            )}

            {pieceSpec.picketSpacing && config.style !== 'solid' && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label htmlFor="cfg-picketspacing" className="text-[#cfc9bf]">
                    Picket spacing
                  </label>
                  <span className="text-[#e8a317] font-semibold tabular-nums">
                    {config.picketSpacing} in
                  </span>
                </div>
                <input
                  id="cfg-picketspacing"
                  type="range"
                  min={3}
                  max={6}
                  step={0.5}
                  value={config.picketSpacing}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      picketSpacing: +e.target.value,
                    }))
                  }
                  className="w-full accent-[#c9883d]"
                />
              </div>
            )}

            {/* Scrollwork, Infill, Picket Size & Design + King/IMS Leaf Section */}
            {isGateOrRailing && (
              <div className="pt-3 border-t border-[#2a2a2e]/70 space-y-3">
                <span className="block font-display uppercase tracking-[0.1em] text-[11px] text-[#c9883d]">
                  Infill, Scrollwork, Picket &amp; Leaf Design
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="cfg-scroll-style"
                      className="block text-[11px] text-[#a8a29a] mb-1"
                    >
                      Scrollwork
                    </label>
                    <select
                      id="cfg-scroll-style"
                      value={config.scrollStyle}
                      onChange={(e) =>
                        handleScrollStyleChange(e.target.value as ScrollStyleType)
                      }
                      className="w-full px-2 py-1.5 rounded bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-xs"
                    >
                      {SCROLL_STYLES.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="cfg-infill-pattern"
                      className="block text-[11px] text-[#a8a29a] mb-1"
                    >
                      Infill pattern (King / Coast / PDM)
                    </label>
                    <select
                      id="cfg-infill-pattern"
                      value={config.infillPattern}
                      onChange={(e) =>
                        handleInfillPatternChange(
                          e.target.value as InfillPatternType,
                        )
                      }
                      className="w-full px-2 py-1.5 rounded bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-xs"
                    >
                      {INFILL_PATTERNS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="cfg-picket-size"
                      className="block text-[11px] text-[#a8a29a] mb-1"
                    >
                      Picket size
                    </label>
                    <select
                      id="cfg-picket-size"
                      value={config.picketSize}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          picketSize: e.target.value as PicketSizeId,
                        }))
                      }
                      className="w-full px-2 py-1.5 rounded bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-xs"
                    >
                      {PICKET_SIZES.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="cfg-picket-style"
                      className="block text-[11px] text-[#a8a29a] mb-1"
                    >
                      Picket design
                    </label>
                    <select
                      id="cfg-picket-style"
                      value={config.picketStyle}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          picketStyle: e.target.value as PicketStyleType,
                        }))
                      }
                      className="w-full px-2 py-1.5 rounded bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-xs"
                    >
                      {PICKET_FORM_STYLES.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Multi-select Leaf Section (King Architectural & IMS) */}
                <div className="bg-[#101012] border border-[#2a2a2e] rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#e8a317] uppercase tracking-[0.06em]">
                      Leaf Section (King &amp; IMS — Multi-Select)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181b] border border-[#2a2a2e] text-[#e8c97a]">
                        {config.selectedLeaves.length} selected
                      </span>
                      {config.selectedLeaves.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearCatalogLeaves}
                          className="text-[10px] px-1.5 py-0.5 rounded border border-[#2a2a2e] bg-[#18181b] text-[#cfc9bf] hover:text-[#e8a317] cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    <div>
                      <div className="text-[10px] font-semibold text-[#c9883d] uppercase tracking-[0.05em] mb-1">
                        King Architectural Ornamental Steels
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {kingLeaves.map((leaf) => {
                          const checked = config.selectedLeaves.includes(
                            leaf.id,
                          );
                          return (
                            <label
                              key={leaf.id}
                              className={`flex items-start gap-2 px-2 py-1 rounded border text-[11px] cursor-pointer ${
                                checked
                                  ? 'border-[#e8a317]/70 bg-[#242018] text-[#f2efe8]'
                                  : 'border-[#2a2a2e]/70 bg-[#151518] text-[#cfc9bf]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  handleToggleCatalogLeaf(leaf.id)
                                }
                                className="w-3.5 h-3.5 mt-0.5 accent-[#c9883d]"
                              />
                              <span className="leading-tight">
                                <span className="block font-medium">
                                  {leaf.label}
                                </span>
                                <span className="block text-[10px] text-[#a8a29a]">
                                  {leaf.spec}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold text-[#c9883d] uppercase tracking-[0.05em] mb-1">
                        IMS (Industrial Metal Supply)
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {imsLeaves.map((leaf) => {
                          const checked = config.selectedLeaves.includes(
                            leaf.id,
                          );
                          return (
                            <label
                              key={leaf.id}
                              className={`flex items-start gap-2 px-2 py-1 rounded border text-[11px] cursor-pointer ${
                                checked
                                  ? 'border-[#e8a317]/70 bg-[#242018] text-[#f2efe8]'
                                  : 'border-[#2a2a2e]/70 bg-[#151518] text-[#cfc9bf]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  handleToggleCatalogLeaf(leaf.id)
                                }
                                className="w-3.5 h-3.5 mt-0.5 accent-[#c9883d]"
                              />
                              <span className="leading-tight">
                                <span className="block font-medium">
                                  {leaf.label}
                                </span>
                                <span className="block text-[10px] text-[#a8a29a]">
                                  {leaf.spec}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Industry Standard Sizes & Distribution System Selector */}
            <div className="pt-3 border-t border-[#2a2a2e]/70 space-y-2.5 bg-[#101012] border border-[#2a2a2e] rounded-lg p-3">
              <div>
                <label
                  htmlFor="cfg-supplier"
                  className="block font-display uppercase tracking-[0.1em] text-[11px] text-[#c9883d] mb-1"
                >
                  Distribution System / Metal Supplier Sizes
                </label>
                <select
                  id="cfg-supplier"
                  value={config.supplier}
                  onChange={(e) =>
                    handleSupplierChange(e.target.value as SupplierId)
                  }
                  className="w-full px-2.5 py-2 rounded-md bg-[#18181b] text-[#f2efe8] border border-[#2a2a2e] text-xs sm:text-sm"
                >
                  {SUPPLIER_ORDER.map((sid) => (
                    <option key={sid} value={sid}>
                      {SUPPLIER_CATALOGS[sid].name} ({SUPPLIER_CATALOGS[sid].domain})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#a8a29a] m-0 mt-1 leading-snug">
                  {activeSupplierSpecs.catalog.catalogNote}
                </p>
              </div>

              <div className="space-y-2">
                <div>
                  <label
                    htmlFor="cfg-sup-picket"
                    className="block text-[11px] text-[#a8a29a] mb-0.5"
                  >
                    Standard picket / tube size
                  </label>
                  <select
                    id="cfg-sup-picket"
                    value={activeSupplierSpecs.picketOpt.id}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        supplierPicketId: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 rounded bg-[#18181b] text-[#f2efe8] border border-[#2a2a2e] text-xs"
                  >
                    {activeSupplierSpecs.catalog.pickets.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="cfg-sup-bar"
                    className="block text-[11px] text-[#a8a29a] mb-0.5"
                  >
                    Standard horizontal rail / bar size
                  </label>
                  <select
                    id="cfg-sup-bar"
                    value={activeSupplierSpecs.barOpt.id}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        supplierBarId: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 rounded bg-[#18181b] text-[#f2efe8] border border-[#2a2a2e] text-xs"
                  >
                    {activeSupplierSpecs.catalog.bars.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="cfg-sup-panel"
                    className="block text-[11px] text-[#a8a29a] mb-0.5"
                  >
                    Standard panel / sheet / grating
                  </label>
                  <select
                    id="cfg-sup-panel"
                    value={activeSupplierSpecs.panelOpt.id}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        supplierPanelId: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 rounded bg-[#18181b] text-[#f2efe8] border border-[#2a2a2e] text-xs"
                  >
                    {activeSupplierSpecs.catalog.panels.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick shortcut pointing to the dedicated Sign Lettering tab */}
            <div className="pt-2 border-t border-[#2a2a2e] flex items-center justify-between gap-2">
              <span className="text-xs text-[#cfc9bf]">
                Sign wording, Google fonts &amp; free-draw pad live in{' '}
                <strong className="text-[#e8a317]">Sign Lettering</strong>
              </span>
              <button
                type="button"
                onClick={() => setStudioTab('sign')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1c1a16] border border-[#c9883d]/70 text-xs font-semibold text-[#e8a317] hover:border-[#e8a317] cursor-pointer whitespace-nowrap"
              >
                <Type className="w-3.5 h-3.5" aria-hidden="true" />
                Sign Lettering
              </button>
            </div>
          </div>

          {/* 03. Decorative Ironwork */}
          <div className="pt-4 border-t border-[#2a2a2e] space-y-3">
            <h4 className="font-display uppercase tracking-[0.12em] text-xs text-[#c9883d] m-0">
              03. Decorative Ironwork
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-[#d5cfc5]">
              {DECOR_ITEMS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={config.decor[key]}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        decor: { ...prev.decor, [key]: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 accent-[#c9883d]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            {/* Section 3 Photo / Drawing / Universal File Upload */}
            <div className="pt-2.5 border-t border-[#2a2a2e]/70">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="sec3-photo-drawing-upload"
                  className="text-xs font-semibold text-[#e8a317]"
                >
                  Upload a photo or a drawing (JPG, PNG, PDF, DXF, SVG)
                </label>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1c1a16] border border-[#c9883d]/40 text-[#e8c97a]">
                  All file types accepted
                </span>
              </div>
              <input
                ref={section3UploadRef}
                id="sec3-photo-drawing-upload"
                type="file"
                accept="*/*"
                onChange={handleStudioFileUpload}
                className="block w-full text-xs text-[#cfc9bf] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-[#c9883d]/70 file:bg-[#1c1a16] file:text-[#e8a317] file:text-xs file:font-semibold file:cursor-pointer cursor-pointer"
              />
              <p className="text-[11px] text-[#a8a29a] mt-1 mb-0">
                Photos generate a browser 3D relief &amp; cut outline; SVG/DXF
                drawings feed into the cut pattern; STL/OBJ/GLB/GLTF/PLY/3MF/FBX
                load in 3D; other files are stored as a downloadable reference.
              </p>
            </div>
          </div>

          {/* Primary Quote Transfer CTA */}
          <div className="pt-3 border-t border-[#2a2a2e]">
            <button
              type="button"
              onClick={() =>
                onUseInQuote({
                  quoteType: pieceSpec.qType,
                  size: dimsText(config),
                  descriptionLine: `Configured in the 3D studio: ${describeConfig(
                    config,
                  )}.`,
                })
              }
              className="w-full py-3 px-4 rounded-lg bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-bold text-base transition-colors cursor-pointer"
            >
              Use This in My Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
