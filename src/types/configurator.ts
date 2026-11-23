import { SUPPLIER_CATALOGS, SupplierId } from '../data/suppliers';

export type PieceType =
  | 'gate'
  | 'railing'
  | 'sculpture-base'
  | 'sign-frame'
  | 'patio-cover';

export type MaterialType =
  | 'wrought'
  | 'steel'
  | 'aluminum'
  | 'copper'
  | 'stainless'
  | 'brass'
  | 'bronze'
  | 'corten'
  | 'glass'
  | 'wood'
  | 'other'
  | 'unknown';

export type FinishType =
  | 'natural'
  | 'matte-black'
  | 'bronze'
  | 'copper'
  | 'galvanized'
  | 'powder-coat'
  | 'brushed-satin'
  | 'hand-hammered'
  | 'oil-rubbed-bronze'
  | 'antique-patina'
  | 'verdigris'
  | 'clear-coat';

export type PowderColorType =
  | 'charcoal'
  | 'forest'
  | 'bronze-brown'
  | 'white';

export type PostStyleType =
  | 'square'
  | 'round'
  | 'ornate'
  | 'i-beam'
  | 'w-beam'
  | 'rectangle'
  | 'octagon'
  | 'triangle'
  | 'angle-iron'
  | 'channel-post'
  | 'hss-tube'
  | 'c-channel'
  | 'custom';

export const POST_STYLES: Array<{
  id: PostStyleType;
  label: string;
  specNote: string;
}> = [
  { id: 'square', label: 'Square tube / bar', specNote: 'Standard 3"–4" square post' },
  { id: 'round', label: 'Round pipe / tube', specNote: 'Schedule 40 / DOM round post' },
  { id: 'ornate', label: 'Ornate (with collars)', specNote: 'Fluted / collared architectural post' },
  { id: 'i-beam', label: 'I-Beam', specNote: 'Standard S-shape structural I-Beam post' },
  { id: 'w-beam', label: 'W-Beam', specNote: 'Wide-flange structural W-Beam post' },
  { id: 'rectangle', label: 'Rectangle tube', specNote: 'Heavy 2"×4" / 3"×5" rectangular tube' },
  { id: 'octagon', label: 'Octagon', specNote: '8-sided architectural octagonal post' },
  { id: 'triangle', label: 'Triangle', specNote: '3-sided triangular structural column' },
  { id: 'angle-iron', label: 'Angle Iron', specNote: '90° L-section structural angle iron post' },
  { id: 'channel-post', label: 'Channel post', specNote: 'Heavy structural U-channel steel post' },
  { id: 'hss-tube', label: 'Hollow structural tube (HSS)', specNote: 'ASTM A500 HSS thick-wall radius tube' },
  { id: 'c-channel', label: 'C-Channel', specNote: 'C-shaped lipped structural channel post' },
  { id: 'custom', label: 'Custom profile', specNote: 'Custom fabricated / laser-cut post section' },
];

export type FinialType =
  | 'none'
  | 'ball'
  | 'spear'
  | 'scroll'
  | 'flat-cap'
  | 'pyramid-cap'
  | 'squared-dome-cap'
  | 'ball-collar-cap'
  | 'acorn-cap'
  | 'pineapple-cap'
  | 'urn-cap'
  | 'pagoda-cap'
  | 'pinnacle-cap'
  | 'colonial-cap';

export const POST_CAPS_FINIALS: Array<{
  id: FinialType;
  label: string;
  catalog: 'Standard' | 'King Architectural';
}> = [
  { id: 'none', label: 'None', catalog: 'Standard' },
  { id: 'ball', label: 'Ball finial', catalog: 'Standard' },
  { id: 'spear', label: 'Spear finial', catalog: 'Standard' },
  { id: 'scroll', label: 'Scroll top finial', catalog: 'Standard' },
  { id: 'flat-cap', label: 'Flat top post cap (King Architectural)', catalog: 'King Architectural' },
  { id: 'pyramid-cap', label: 'Pyramid post cap (King Architectural)', catalog: 'King Architectural' },
  { id: 'squared-dome-cap', label: 'Squared dome post cap (King Architectural)', catalog: 'King Architectural' },
  { id: 'ball-collar-cap', label: 'Ball on collar post cap (King Architectural)', catalog: 'King Architectural' },
  { id: 'acorn-cap', label: 'Acorn post cap (King Architectural)', catalog: 'King Architectural' },
  { id: 'pineapple-cap', label: 'Pineapple post cap (King Architectural)', catalog: 'King Architectural' },
  { id: 'urn-cap', label: 'Classical urn post cap (King Architectural)', catalog: 'King Architectural' },
  { id: 'pagoda-cap', label: 'Pagoda tiered post cap (King Architectural)', catalog: 'King Architectural' },
  { id: 'pinnacle-cap', label: 'Pinnacle spire post cap (King Architectural)', catalog: 'King Architectural' },
  { id: 'colonial-cap', label: 'Colonial stepped post cap (King Architectural)', catalog: 'King Architectural' },
];

export type LeavesType = 'single' | 'double';
export type TopRailType = 'flat' | 'round' | 'cap';
export type SizeModeType = 'standard' | 'custom' | 'artistic';

export type ScrollStyleType =
  | 's-scroll'
  | 'c-scroll'
  | 'double-scroll'
  | 'scroll-leaf'
  | 'ribbon-scroll'
  | 'waterleaf-scroll'
  | 'snub-end-s'
  | 'fishtail-s'
  | 'beveled-scroll'
  | 'heart-scroll'
  | 'triple-spiral'
  | 'vine-scroll'
  | 'bell-scroll'
  | 'collar-double-c';

export type InfillPatternType =
  | 'vertical-pickets'
  | 'horizontal-bars'
  | 'diamond-lattice'
  | 'basketweave'
  | 'sunburst'
  | 'solid-panel'
  | 'interweave'
  | 'intercrimp'
  | 'lock-crimp'
  | 'flat-top-mesh'
  | 'perforated-round-staggered'
  | 'perforated-round-straight'
  | 'perforated-square'
  | 'perforated-slotted'
  | 'expanded-metal'
  | 'flattened-expanded'
  | 'bar-grating'
  | 'louvered-slats'
  | 'scroll-panel';

export type PicketStyleType =
  | 'square'
  | 'round'
  | 'twisted'
  | 'double-twist'
  | 'hammered'
  | 'spearhead'
  | 'ball-top'
  | 'single-basket'
  | 'double-basket'
  | 'single-knuckle'
  | 'double-knuckle'
  | 'belly'
  | 'scroll-picket';

export type PicketSizeId =
  | 'supplier'
  | '3/8-sq'
  | '1/2-sq'
  | '5/8-sq'
  | '3/4-sq'
  | '7/8-sq'
  | '1-sq'
  | '1.25-sq'
  | '1/2-rd'
  | '5/8-rd'
  | '3/4-rd'
  | '1-rd';

export interface PicketSizeSpec {
  id: PicketSizeId;
  label: string;
  inches: number;
  profile: 'square' | 'round' | 'auto';
}

export const PICKET_SIZES: PicketSizeSpec[] = [
  { id: 'supplier', label: 'Use supplier catalog size', inches: 0, profile: 'auto' },
  { id: '3/8-sq', label: '3/8" × 3/8" solid bar', inches: 0.375, profile: 'square' },
  { id: '1/2-sq', label: '1/2" × 1/2" square bar / tube', inches: 0.5, profile: 'square' },
  { id: '5/8-sq', label: '5/8" × 5/8" heavy square bar', inches: 0.625, profile: 'square' },
  { id: '3/4-sq', label: '3/4" × 3/4" square tube (16 ga)', inches: 0.75, profile: 'square' },
  { id: '7/8-sq', label: '7/8" × 7/8" square tube', inches: 0.875, profile: 'square' },
  { id: '1-sq', label: '1" × 1" architectural tube', inches: 1.0, profile: 'square' },
  { id: '1.25-sq', label: '1-1/4" × 1-1/4" heavy tube', inches: 1.25, profile: 'square' },
  { id: '1/2-rd', label: '1/2" Ø round solid / tube', inches: 0.5, profile: 'round' },
  { id: '5/8-rd', label: '5/8" Ø round forged bar', inches: 0.625, profile: 'round' },
  { id: '3/4-rd', label: '3/4" Ø heavy round bar', inches: 0.75, profile: 'round' },
  { id: '1-rd', label: '1" Ø architectural pipe / rod', inches: 1.0, profile: 'round' },
];

export const SCROLL_STYLES: Array<{ id: ScrollStyleType; label: string }> = [
  { id: 's-scroll', label: 'S-scroll (Classic)' },
  { id: 'c-scroll', label: 'C-scroll' },
  { id: 'double-scroll', label: 'Double scroll' },
  { id: 'scroll-leaf', label: 'Scroll with leaf' },
  { id: 'ribbon-scroll', label: 'Ribbon scroll' },
  { id: 'waterleaf-scroll', label: 'Waterleaf scroll' },
  { id: 'snub-end-s', label: 'Snub-end S-scroll (King)' },
  { id: 'fishtail-s', label: 'Fishtail forged S-scroll (King)' },
  { id: 'beveled-scroll', label: 'Beveled bar scroll (King)' },
  { id: 'heart-scroll', label: 'Heart / Lyre scroll' },
  { id: 'triple-spiral', label: 'Triple spiral scroll' },
  { id: 'vine-scroll', label: 'Vine & tendril scroll' },
  { id: 'bell-scroll', label: 'Bell / onion belly scroll' },
  { id: 'collar-double-c', label: 'Collared double C-scroll' },
];

export const INFILL_PATTERNS: Array<{
  id: InfillPatternType;
  label: string;
  source?: string;
}> = [
  { id: 'vertical-pickets', label: 'Vertical pickets', source: 'Standard' },
  { id: 'horizontal-bars', label: 'Horizontal bars', source: 'Standard' },
  { id: 'interweave', label: 'Interweave wire mesh (King / PDM)', source: 'King / PDM' },
  { id: 'intercrimp', label: 'Intercrimp woven mesh (King / PDM)', source: 'King / PDM' },
  { id: 'lock-crimp', label: 'Lock-crimp wire mesh (PDM)', source: 'PDM' },
  { id: 'flat-top-mesh', label: 'Flat-top woven wire mesh (King / PDM)', source: 'King / PDM' },
  { id: 'perforated-round-staggered', label: 'Perforated — round staggered (Coast / PDM)', source: 'Coast / PDM' },
  { id: 'perforated-round-straight', label: 'Perforated — round straight (Coast / PDM)', source: 'Coast / PDM' },
  { id: 'perforated-square', label: 'Perforated — square grid (Coast / PDM)', source: 'Coast / PDM' },
  { id: 'perforated-slotted', label: 'Perforated — slotted pattern (Coast / PDM)', source: 'Coast / PDM' },
  { id: 'expanded-metal', label: 'Expanded metal — standard diamond (King / PDM)', source: 'King / PDM' },
  { id: 'flattened-expanded', label: 'Expanded metal — flattened diamond (King / PDM)', source: 'King / PDM' },
  { id: 'bar-grating', label: 'Bar grating infill (PDM)', source: 'PDM' },
  { id: 'louvered-slats', label: 'Louvered extrusion slats (Coast Aluminum)', source: 'Coast Aluminum' },
  { id: 'diamond-lattice', label: 'Diamond lattice', source: 'King Architectural' },
  { id: 'basketweave', label: 'Basketweave', source: 'King Architectural' },
  { id: 'sunburst', label: 'Sunburst', source: 'King Architectural' },
  { id: 'scroll-panel', label: 'Ornamental scrollwork infill (King Architectural)', source: 'King Architectural' },
  { id: 'solid-panel', label: 'Solid sheet / plate panel', source: 'Coast / PDM / King' },
];

export const PICKET_FORM_STYLES: Array<{ id: PicketStyleType; label: string }> = [
  { id: 'square', label: 'Plain square' },
  { id: 'round', label: 'Plain round' },
  { id: 'twisted', label: 'Full-twisted' },
  { id: 'double-twist', label: 'Double-twist center' },
  { id: 'hammered', label: 'Hand-hammered edges' },
  { id: 'spearhead', label: 'Spearhead top' },
  { id: 'ball-top', label: 'Ball-top finial' },
  { id: 'single-basket', label: 'Single basket baluster' },
  { id: 'double-basket', label: 'Double basket baluster' },
  { id: 'single-knuckle', label: 'Single collar / knuckle' },
  { id: 'double-knuckle', label: 'Double collar / knuckle' },
  { id: 'belly', label: 'Bowed / belly baluster' },
  { id: 'scroll-picket', label: 'Center scroll picket' },
];

export type LeafOptionId =
  | 'king-stamped-acanthus'
  | 'king-forged-acanthus'
  | 'king-cast-acanthus'
  | 'king-stamped-grape'
  | 'king-forged-grape-vine'
  | 'king-cast-oak'
  | 'king-stamped-maple'
  | 'king-ivy-spray'
  | 'king-waterleaf'
  | 'ims-stamped-ornamental'
  | 'ims-forged-floral'
  | 'ims-forged-oak'
  | 'ims-cast-grape-vine'
  | 'ims-spear-tip-leaf'
  | 'ims-double-acanthus';

export interface LeafCatalogOption {
  id: LeafOptionId;
  catalog: 'King Architectural' | 'IMS (Industrial Metal Supply)';
  label: string;
  spec: string;
  shapeKind: 'acanthus' | 'grape' | 'oak' | 'maple' | 'ivy' | 'floral' | 'spear' | 'double';
}

export const LEAF_CATALOG: LeafCatalogOption[] = [
  // King Architectural Ornamental Steels
  {
    id: 'king-stamped-acanthus',
    catalog: 'King Architectural',
    label: 'Stamped Steel Acanthus Leaf',
    spec: '5-1/2" H · Stamped mild steel (King Ornamental)',
    shapeKind: 'acanthus',
  },
  {
    id: 'king-forged-acanthus',
    catalog: 'King Architectural',
    label: 'Forged Curled-Tip Acanthus',
    spec: '6-1/2" H · Heavy forged acanthus (King Ornamental)',
    shapeKind: 'acanthus',
  },
  {
    id: 'king-cast-acanthus',
    catalog: 'King Architectural',
    label: 'Cast Steel Acanthus Cluster',
    spec: '8" H · Relief-cast weldable steel (King Ornamental)',
    shapeKind: 'double',
  },
  {
    id: 'king-stamped-grape',
    catalog: 'King Architectural',
    label: 'Stamped Steel Grape Leaf',
    spec: '4-3/4" H · Stamped mild steel (King Ornamental)',
    shapeKind: 'grape',
  },
  {
    id: 'king-forged-grape-vine',
    catalog: 'King Architectural',
    label: 'Forged Grape Leaf & Tendril',
    spec: '7" H · Vine leaf + spiral tendril (King Ornamental)',
    shapeKind: 'grape',
  },
  {
    id: 'king-cast-oak',
    catalog: 'King Architectural',
    label: 'Cast Steel Oak Leaf',
    spec: '5-1/4" H · Lobed weldable oak leaf (King Ornamental)',
    shapeKind: 'oak',
  },
  {
    id: 'king-stamped-maple',
    catalog: 'King Architectural',
    label: 'Stamped Sugar Maple Leaf',
    spec: '4-1/2" H · 5-point stamped leaf (King Ornamental)',
    shapeKind: 'maple',
  },
  {
    id: 'king-ivy-spray',
    catalog: 'King Architectural',
    label: 'Ornamental Ivy & Vine Spray',
    spec: '8-1/2" H · Trailing 3-leaf spray (King Ornamental)',
    shapeKind: 'ivy',
  },
  {
    id: 'king-waterleaf',
    catalog: 'King Architectural',
    label: 'Forged Architectural Waterleaf',
    spec: '5" H · Slim tapered waterleaf (King Ornamental)',
    shapeKind: 'spear',
  },
  // IMS (Industrial Metal Supply)
  {
    id: 'ims-stamped-ornamental',
    catalog: 'IMS (Industrial Metal Supply)',
    label: 'IMS Stamped Steel Ornamental Leaf',
    spec: '4-1/2" H · 14 ga stamped weldable steel (IMS)',
    shapeKind: 'floral',
  },
  {
    id: 'ims-forged-floral',
    catalog: 'IMS (Industrial Metal Supply)',
    label: 'IMS Forged Rose / Floral Leaf',
    spec: '5" H · Die-forged mild steel (IMS)',
    shapeKind: 'floral',
  },
  {
    id: 'ims-forged-oak',
    catalog: 'IMS (Industrial Metal Supply)',
    label: 'IMS Forged Steel Oak Leaf',
    spec: '5-1/2" H · Veined forged oak leaf (IMS)',
    shapeKind: 'oak',
  },
  {
    id: 'ims-cast-grape-vine',
    catalog: 'IMS (Industrial Metal Supply)',
    label: 'IMS Cast & Stamped Grape Vine Leaf',
    spec: '4-3/4" H · Weldable vine leaf (IMS)',
    shapeKind: 'grape',
  },
  {
    id: 'ims-spear-tip-leaf',
    catalog: 'IMS (Industrial Metal Supply)',
    label: 'IMS Forged Scroll-Tip Spear Leaf',
    spec: '6" H · Heavy forged spear leaf (IMS)',
    shapeKind: 'spear',
  },
  {
    id: 'ims-double-acanthus',
    catalog: 'IMS (Industrial Metal Supply)',
    label: 'IMS Double Acanthus Leaf Pair',
    spec: '7" H · Opposing twin acanthus spray (IMS)',
    shapeKind: 'double',
  },
];

export type PartArea =
  | 'posts'
  | 'rails'
  | 'pickets'
  | 'panels'
  | 'scrolls'
  | 'base'
  | 'finials';

export const PART_AREA_LABELS: Record<PartArea, string> = {
  posts: 'Posts',
  rails: 'Rails & Frame',
  pickets: 'Pickets & Bars',
  panels: 'Panels & Relief',
  scrolls: 'Scrolls & Decorative',
  base: 'Base & Plinth',
  finials: 'Finials & Hardware',
};

export interface DecorState {
  scrolls: boolean;
  rings: boolean;
  leaves: boolean;
  medallion: boolean;
  rosettes: boolean;
  baskets: boolean;
  twistedBars: boolean;
  spearheadFinials: boolean;
  fleurDeLis: boolean;
  collars: boolean;
  leafSprays: boolean;
}

export const DECOR_ITEMS: Array<{ key: keyof DecorState; label: string }> = [
  { key: 'scrolls', label: 'Scrolls' },
  { key: 'rings', label: 'Rings' },
  { key: 'leaves', label: 'Leaf branch' },
  { key: 'medallion', label: 'Medallion' },
  { key: 'rosettes', label: 'Rosettes' },
  { key: 'baskets', label: 'Baskets' },
  { key: 'twistedBars', label: 'Twisted bars' },
  { key: 'spearheadFinials', label: 'Spearhead finials' },
  { key: 'fleurDeLis', label: 'Fleur-de-lis' },
  { key: 'collars', label: 'Collars' },
  { key: 'leafSprays', label: 'Leaf sprays' },
];

export interface SampleArtData {
  fileName: string;
  fileExt?: string;
  mimeType?: string;
  kind: 'photo' | 'svg' | 'dxf' | 'model3d' | 'reference';
  previewUrl?: string;
  downloadUrl?: string;
  needsConversion?: boolean;
  widthPx?: number;
  heightPx?: number;
  heightmapSize?: number;
  heightmap?: number[];
  showRelief3D: boolean;
  useOutlineCut: boolean;
  cutSegments?: Array<[number, number, number, number]>; // normalized [0..1] coords
}

export interface SignStroke {
  color: string;
  width: number;
  points: Array<[number, number]>; // normalized [0..1] x, y on pad/panel
}

export type PicketAccentType = 'knuckle' | 'emblem' | 'leaf';
export type SignLetteringMode = 'typed' | 'hand-drawn';

export interface SignPictureData {
  fileName: string;
  previewUrl?: string;
  downloadUrl?: string;
  needsConversion?: boolean;
  x: number; // 0..1 center X on panel
  y: number; // 0..1 center Y on panel
  scale: number; // 0.1..1.2
  cutSegments?: Array<[number, number, number, number]>;
}

export interface ConfiguratorState {
  hasPiece?: boolean;
  piece: PieceType;
  sizeMode: SizeModeType;
  width: number;
  height: number;
  depth: number;
  style: string;
  scrollStyle: ScrollStyleType;
  infillPattern: InfillPatternType;
  picketStyle: PicketStyleType;
  picketSize: PicketSizeId;
  selectedLeaves: LeafOptionId[];
  supplier: SupplierId;
  supplierPicketId: string;
  supplierBarId: string;
  supplierPanelId: string;
  leaves: LeavesType;
  topRail: TopRailType;
  postStyle: PostStyleType;
  customPostName: string;
  postSpacing: number;
  picketSpacing: number;
  finial: FinialType;
  decor: DecorState;
  picketAccents: Record<number, PicketAccentType[]>;
  selectedPicketIndex: number | null;
  freeDrawStrokes2D: SignStroke[];
  freeDrawStrokes3D: SignStroke[];
  freeDrawColor: string;
  freeDrawWidth: number;
  frozenView: boolean;
  material: MaterialType;
  customMaterialName: string;
  finish: FinishType;
  powder: PowderColorType;
  customColor: string | null;
  areaColors: Partial<Record<PartArea, string>>;
  sampleArt: SampleArtData | null;
  showSign: boolean;
  signLetteringMode: SignLetteringMode;
  signText: string;
  signFont: string;
  signFontSize: number;
  signTextColor: string;
  signDrawColor: string;
  signDrawWidth: number;
  signStrokes: SignStroke[];
  signPicture: SignPictureData | null;
  turntable: boolean;
  simple: boolean;
}

export interface StandardSizePreset {
  label: string;
  width: number;
  height: number;
  depth?: number;
}

export interface PieceSpec {
  label: string;
  widthLabel: string;
  widthMin: number;
  widthMax: number;
  widthStep: number;
  widthDef: number;
  heightLabel: string;
  heightMin: number;
  heightMax: number;
  heightStep: number;
  heightDef: number;
  depth: boolean;
  depthLabel?: string;
  depthMin?: number;
  depthMax?: number;
  depthStep?: number;
  depthDef?: number;
  styles: Array<[string, string]>;
  standardSizes: StandardSizePreset[];
  topRail: boolean;
  post: boolean;
  postSpacing: boolean;
  picketSpacing: boolean;
  leaves: boolean;
  qType: string;
}

export const PIECES: Record<PieceType, PieceSpec> = {
  gate: {
    label: 'Gate',
    widthLabel: 'Width',
    widthMin: 4,
    widthMax: 16,
    widthStep: 0.5,
    widthDef: 10,
    heightLabel: 'Height',
    heightMin: 4,
    heightMax: 8,
    heightStep: 0.5,
    heightDef: 6,
    depth: false,
    styles: [
      ['vertical', 'Vertical pickets'],
      ['horizontal', 'Horizontal bars'],
      ['solid', 'Solid panel'],
      ['scroll', 'Scrollwork'],
    ],
    standardSizes: [
      { label: '4 × 6 ft Walk Gate', width: 4, height: 6 },
      { label: '6 × 6 ft Garden Gate', width: 6, height: 6 },
      { label: '10 × 6 ft Driveway Gate', width: 10, height: 6 },
      { label: '12 × 7 ft Double Entry', width: 12, height: 7 },
    ],
    topRail: false,
    post: true,
    postSpacing: false,
    picketSpacing: true,
    leaves: true,
    qType: 'Custom Gate',
  },
  railing: {
    label: 'Railing',
    widthLabel: 'Run length',
    widthMin: 4,
    widthMax: 40,
    widthStep: 1,
    widthDef: 12,
    heightLabel: 'Height',
    heightMin: 2.5,
    heightMax: 4.5,
    heightStep: 0.25,
    heightDef: 3.5,
    depth: false,
    styles: [
      ['vertical', 'Vertical pickets'],
      ['horizontal', 'Horizontal bars'],
      ['solid', 'Solid panel'],
      ['scroll', 'Scrollwork'],
    ],
    standardSizes: [
      { label: '8 × 3 ft Step Run', width: 8, height: 3 },
      { label: '12 × 3.5 ft Deck Rail', width: 12, height: 3.5 },
      { label: '20 × 3.5 ft Balcony', width: 20, height: 3.5 },
      { label: '32 × 3.5 ft Hillside', width: 32, height: 3.5 },
    ],
    topRail: true,
    post: true,
    postSpacing: true,
    picketSpacing: true,
    leaves: false,
    qType: 'Railing',
  },
  'sculpture-base': {
    label: 'Sculpture Base',
    widthLabel: 'Base width',
    widthMin: 1,
    widthMax: 6,
    widthStep: 0.25,
    widthDef: 2,
    heightLabel: 'Base height',
    heightMin: 1,
    heightMax: 6,
    heightStep: 0.25,
    heightDef: 3,
    depth: true,
    depthLabel: 'Base depth',
    depthMin: 1,
    depthMax: 6,
    depthStep: 0.25,
    depthDef: 2,
    styles: [
      ['plinth', 'Square plinth'],
      ['tapered', 'Tapered plinth'],
      ['column', 'Round column'],
    ],
    standardSizes: [
      { label: '1.5 × 1.5 × 3 ft Pedestal', width: 1.5, height: 3, depth: 1.5 },
      { label: '2 × 2 × 3 ft Gallery Plinth', width: 2, height: 3, depth: 2 },
      { label: '3 × 3 × 4 ft Plaza Base', width: 3, height: 4, depth: 3 },
      { label: '4 × 4 × 5 ft Monumental', width: 4, height: 5, depth: 4 },
    ],
    topRail: false,
    post: false,
    postSpacing: false,
    picketSpacing: false,
    leaves: false,
    qType: 'Sculpture',
  },
  'sign-frame': {
    label: 'Sign Frame',
    widthLabel: 'Panel width',
    widthMin: 2,
    widthMax: 12,
    widthStep: 0.5,
    widthDef: 6,
    heightLabel: 'Height',
    heightMin: 3,
    heightMax: 10,
    heightStep: 0.5,
    heightDef: 5,
    depth: false,
    styles: [
      ['rect', 'Rectangular'],
      ['arch', 'Arched top'],
    ],
    standardSizes: [
      { label: '4 × 4 ft Wayfinding', width: 4, height: 4 },
      { label: '6 × 5 ft Entry Sign', width: 6, height: 5 },
      { label: '8 × 6 ft Monument', width: 8, height: 6 },
      { label: '10 × 7 ft Commercial', width: 10, height: 7 },
    ],
    topRail: false,
    post: true,
    postSpacing: false,
    picketSpacing: false,
    leaves: false,
    qType: 'Monument Sign',
  },
  'patio-cover': {
    label: 'Patio Cover Frame',
    widthLabel: 'Span',
    widthMin: 8,
    widthMax: 24,
    widthStep: 1,
    widthDef: 12,
    heightLabel: 'Height',
    heightMin: 7,
    heightMax: 12,
    heightStep: 0.5,
    heightDef: 9,
    depth: true,
    depthLabel: 'Depth',
    depthMin: 6,
    depthMax: 20,
    depthStep: 1,
    depthDef: 10,
    styles: [
      ['slats', 'Open slats'],
      ['solid', 'Solid roof'],
    ],
    standardSizes: [
      { label: '10 × 8 × 8.5 ft Bistro', width: 10, height: 8.5, depth: 8 },
      { label: '12 × 10 × 9 ft Patio', width: 12, height: 9, depth: 10 },
      { label: '16 × 12 × 9.5 ft Lounge', width: 16, height: 9.5, depth: 12 },
      { label: '20 × 14 × 10 ft Pavilion', width: 20, height: 10, depth: 14 },
    ],
    topRail: false,
    post: true,
    postSpacing: false,
    picketSpacing: false,
    leaves: false,
    qType: 'Patio Cover',
  },
};

export interface MaterialSpec {
  name: string;
  label: string;
  color: number;
  roughness: number;
  metalness: number;
  texture: 'hammered' | 'brushed' | 'spangle' | 'wood' | 'corten' | 'glass';
  isGlass?: boolean;
  isWood?: boolean;
}

export const MATERIALS: Record<MaterialType, MaterialSpec> = {
  wrought: {
    name: 'wrought iron',
    label: 'Wrought iron',
    color: 0x2b2b2e,
    roughness: 0.55,
    metalness: 0.8,
    texture: 'hammered',
  },
  steel: {
    name: 'steel',
    label: 'Steel',
    color: 0x8a8f98,
    roughness: 0.35,
    metalness: 0.9,
    texture: 'brushed',
  },
  aluminum: {
    name: 'aluminum',
    label: 'Aluminum',
    color: 0xc8ccd2,
    roughness: 0.28,
    metalness: 0.95,
    texture: 'brushed',
  },
  copper: {
    name: 'copper',
    label: 'Copper',
    color: 0xc47338,
    roughness: 0.26,
    metalness: 0.98,
    texture: 'brushed',
  },
  stainless: {
    name: 'stainless steel',
    label: 'Stainless steel',
    color: 0xd4d9df,
    roughness: 0.2,
    metalness: 0.98,
    texture: 'brushed',
  },
  brass: {
    name: 'brass',
    label: 'Brass',
    color: 0xc6a34a,
    roughness: 0.26,
    metalness: 0.96,
    texture: 'brushed',
  },
  bronze: {
    name: 'bronze',
    label: 'Bronze',
    color: 0x8c6a3f,
    roughness: 0.34,
    metalness: 0.93,
    texture: 'hammered',
  },
  corten: {
    name: 'corten steel',
    label: 'Corten steel',
    color: 0x8f4725,
    roughness: 0.85,
    metalness: 0.32,
    texture: 'corten',
  },
  glass: {
    name: 'glass',
    label: 'Glass',
    color: 0xaad4e6,
    roughness: 0.08,
    metalness: 0.05,
    texture: 'glass',
    isGlass: true,
  },
  wood: {
    name: 'wood',
    label: 'Wood',
    color: 0x7c4f2c,
    roughness: 0.72,
    metalness: 0.0,
    texture: 'wood',
    isWood: true,
  },
  other: {
    name: 'other / foreign material',
    label: 'Other / foreign material',
    color: 0x7d7a74,
    roughness: 0.48,
    metalness: 0.65,
    texture: 'brushed',
  },
  unknown: {
    name: 'unknown — not sure yet',
    label: 'Unknown — not sure yet',
    color: 0x6f747d,
    roughness: 0.48,
    metalness: 0.72,
    texture: 'brushed',
  },
};

export interface FinishSpec {
  name: string;
  label: string;
  color: number | null;
  swatch: string;
  roughness: number;
  metalness: number;
  texture?: 'hammered' | 'brushed' | 'spangle';
}

export const FINISHES: Record<FinishType, FinishSpec> = {
  natural: {
    name: 'natural material finish',
    label: 'Natural / material finish',
    color: null,
    swatch: '#8a8f98',
    roughness: 0.38,
    metalness: 0.85,
  },
  'matte-black': {
    name: 'matte black',
    label: 'Matte black',
    color: 0x161619,
    swatch: '#1c1c20',
    roughness: 0.75,
    metalness: 0.55,
  },
  bronze: {
    name: 'bronze',
    label: 'Bronze',
    color: 0x8c6a3f,
    swatch: '#8c6a3f',
    roughness: 0.35,
    metalness: 0.95,
  },
  copper: {
    name: 'copper',
    label: 'Copper',
    color: 0xb87333,
    swatch: '#b87333',
    roughness: 0.28,
    metalness: 1.0,
  },
  galvanized: {
    name: 'galvanized',
    label: 'Galvanized',
    color: 0x9aa0a3,
    swatch: '#9aa0a3',
    roughness: 0.55,
    metalness: 0.85,
    texture: 'spangle',
  },
  'powder-coat': {
    name: 'powder-coat',
    label: 'Powder-coat',
    color: null,
    swatch: '#4a5568',
    roughness: 0.45,
    metalness: 0.28,
  },
  'brushed-satin': {
    name: 'brushed satin',
    label: 'Brushed satin',
    color: null,
    swatch: '#b6bcc4',
    roughness: 0.32,
    metalness: 0.92,
    texture: 'brushed',
  },
  'hand-hammered': {
    name: 'hand-hammered',
    label: 'Hand-hammered',
    color: null,
    swatch: '#4c4e52',
    roughness: 0.48,
    metalness: 0.86,
    texture: 'hammered',
  },
  'oil-rubbed-bronze': {
    name: 'oil-rubbed bronze',
    label: 'Oil-rubbed bronze',
    color: 0x453224,
    swatch: '#453224',
    roughness: 0.42,
    metalness: 0.78,
    texture: 'brushed',
  },
  'antique-patina': {
    name: 'antique patina',
    label: 'Antique patina',
    color: 0x624d36,
    swatch: '#624d36',
    roughness: 0.58,
    metalness: 0.68,
    texture: 'hammered',
  },
  verdigris: {
    name: 'verdigris patina',
    label: 'Verdigris patina',
    color: 0x437c71,
    swatch: '#437c71',
    roughness: 0.68,
    metalness: 0.35,
    texture: 'hammered',
  },
  'clear-coat': {
    name: 'clear-coated bare',
    label: 'Clear-coated bare',
    color: null,
    swatch: '#9da3ab',
    roughness: 0.22,
    metalness: 0.92,
  },
};

export const POWDERS: Record<
  PowderColorType,
  { name: string; label: string; color: number; swatch: string }
> = {
  charcoal: {
    name: 'charcoal',
    label: 'Charcoal',
    color: 0x2b2b2e,
    swatch: '#2b2b2e',
  },
  forest: {
    name: 'forest green',
    label: 'Forest green',
    color: 0x2e4a32,
    swatch: '#2e4a32',
  },
  'bronze-brown': {
    name: 'bronze brown',
    label: 'Bronze brown',
    color: 0x6b4a2f,
    swatch: '#6b4a2f',
  },
  white: {
    name: 'white',
    label: 'White',
    color: 0xe8e6e0,
    swatch: '#e8e6e0',
  },
};

export const CUSTOM_COLOR_SWATCHES: Array<{ label: string; hex: string }> = [
  { label: 'Forge Black', hex: '#18181b' },
  { label: 'Graphite', hex: '#383b42' },
  { label: 'Brushed Steel', hex: '#88909c' },
  { label: 'Silver Satin', hex: '#c7ccd1' },
  { label: 'Oil Bronze', hex: '#4a3525' },
  { label: 'Antique Bronze', hex: '#8c6a3f' },
  { label: 'Burnished Copper', hex: '#b87333' },
  { label: 'Aged Gold', hex: '#c9933b' },
  { label: 'Corten Rust', hex: '#8b4528' },
  { label: 'Oxblood Red', hex: '#6e2620' },
  { label: 'Desert Sage', hex: '#5f6f58' },
  { label: 'Forest Pine', hex: '#2e4a32' },
  { label: 'Verdigris', hex: '#3f766d' },
  { label: 'Slate Blue', hex: '#3a536b' },
  { label: 'Navy Forge', hex: '#1e2f47' },
  { label: 'Warm Cream', hex: '#e8e3d6' },
];

export const INITIAL_CONFIG: ConfiguratorState = {
  hasPiece: false,
  piece: 'gate',
  sizeMode: 'standard',
  width: 10,
  height: 6,
  depth: 8,
  style: 'vertical',
  scrollStyle: 's-scroll',
  infillPattern: 'vertical-pickets',
  picketStyle: 'square',
  picketSize: 'supplier',
  selectedLeaves: [],
  supplier: 'king',
  supplierPicketId: 'king-0.5-solid',
  supplierBarId: 'king-bar-2x1',
  supplierPanelId: 'king-panel-6x8',
  leaves: 'single',
  topRail: 'flat',
  postStyle: 'square',
  customPostName: '',
  postSpacing: 6,
  picketSpacing: 4,
  finial: 'none',
  decor: {
    scrolls: false,
    rings: false,
    leaves: false,
    medallion: false,
    rosettes: false,
    baskets: false,
    twistedBars: false,
    spearheadFinials: false,
    fleurDeLis: false,
    collars: false,
    leafSprays: false,
  },
  picketAccents: {},
  selectedPicketIndex: null,
  freeDrawStrokes2D: [],
  freeDrawStrokes3D: [],
  freeDrawColor: '#e8a317',
  freeDrawWidth: 3,
  frozenView: false,
  material: 'wrought',
  customMaterialName: '',
  finish: 'matte-black',
  powder: 'charcoal',
  customColor: null,
  areaColors: {},
  sampleArt: null,
  showSign: false,
  signLetteringMode: 'typed',
  signText: 'YOUR NAME HERE',
  signFont: "'Oswald', sans-serif",
  signFontSize: 42,
  signTextColor: '#f2efe8',
  signDrawColor: '#e8a317',
  signDrawWidth: 4,
  signStrokes: [],
  signPicture: null,
  turntable: true,
  simple: false,
};

export const SAMPLE_GATE_CONFIG: ConfiguratorState = {
  ...INITIAL_CONFIG,
  hasPiece: true,
  piece: 'gate',
  width: 10,
  height: 6,
  depth: 8,
};

export function getPicketLayoutStats(state: ConfiguratorState) {
  const supportsPickets =
    (state.piece === 'gate' || state.piece === 'railing') &&
    state.style !== 'solid' &&
    state.style !== 'horizontal' &&
    state.style !== 'scroll' &&
    state.infillPattern === 'vertical-pickets';
  const leaves = state.piece === 'gate' && state.leaves === 'double' ? 2 : 1;
  const leafWidthFt =
    state.piece === 'gate' && leaves === 2
      ? Math.max(1, state.width / 2 - 0.15)
      : state.width;
  const perLeafPickets = supportsPickets
    ? Math.max(2, Math.floor((leafWidthFt * 12) / Math.max(2, state.picketSpacing)))
    : 0;
  const totalPickets = perLeafPickets * leaves;

  const accentCounts: Record<PicketAccentType, number> = {
    knuckle: 0,
    emblem: 0,
    leaf: 0,
  };
  Object.entries(state.picketAccents || {}).forEach(([idxStr, list]) => {
    const idx = Number(idxStr);
    if (!Number.isFinite(idx) || idx < 0 || idx >= totalPickets || !Array.isArray(list)) {
      return;
    }
    list.forEach((acc) => {
      if (acc === 'knuckle' || acc === 'emblem' || acc === 'leaf') {
        accentCounts[acc] += 1;
      }
    });
  });
  const totalAccents =
    accentCounts.knuckle + accentCounts.emblem + accentCounts.leaf;

  return {
    supportsPickets,
    leaves,
    leafWidthFt,
    perLeafPickets,
    totalPickets,
    accentCounts,
    totalAccents,
  };
}

export function getActiveSupplierSpecs(state: ConfiguratorState) {
  const cat = SUPPLIER_CATALOGS[state.supplier] || SUPPLIER_CATALOGS.king;
  const picketOpt =
    cat.pickets.find((p) => p.id === state.supplierPicketId) || cat.pickets[0];
  const barOpt =
    cat.bars.find((b) => b.id === state.supplierBarId) || cat.bars[0];
  const panelOpt =
    cat.panels.find((p) => p.id === state.supplierPanelId) || cat.panels[0];
  return { catalog: cat, picketOpt, barOpt, panelOpt };
}

export function getEffectivePicketInches(state: ConfiguratorState): number {
  const sizeSpec = PICKET_SIZES.find((s) => s.id === state.picketSize);
  if (sizeSpec && sizeSpec.id !== 'supplier' && sizeSpec.inches > 0) {
    return sizeSpec.inches;
  }
  const { picketOpt } = getActiveSupplierSpecs(state);
  return picketOpt.inches || 0.75;
}

export function getEffectivePicketSizeLabel(state: ConfiguratorState): string {
  const sizeSpec = PICKET_SIZES.find((s) => s.id === state.picketSize);
  if (sizeSpec && sizeSpec.id !== 'supplier') {
    return sizeSpec.label;
  }
  const { picketOpt } = getActiveSupplierSpecs(state);
  return picketOpt.label;
}

export function formatPostStyleLabel(state: ConfiguratorState): string {
  if (state.postStyle === 'custom') {
    const custom = state.customPostName?.trim();
    return custom ? `Custom (${custom})` : 'Custom post profile';
  }
  return (
    POST_STYLES.find((p) => p.id === state.postStyle)?.label || state.postStyle
  );
}

export function formatFinialLabel(finial: FinialType): string {
  return (
    POST_CAPS_FINIALS.find((f) => f.id === finial)?.label || finial
  );
}

export function formatMaterialLabel(state: ConfiguratorState): string {
  if (state.material === 'other') {
    const custom = state.customMaterialName.trim();
    return custom ? `Other (${custom})` : 'Other / foreign material';
  }
  return MATERIALS[state.material].name;
}

export function formatFeetInches(v: number): string {
  const safe = Number.isFinite(v) && v > 0 ? v : 1;
  let ft = Math.floor(safe);
  let inch = Math.round((safe - ft) * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return inch ? `${ft} ft ${inch} in` : `${ft} ft`;
}

export function dimsText(state: ConfiguratorState): string {
  const modeTag =
    state.sizeMode === 'artistic'
      ? ' (artistic freeform)'
      : state.sizeMode === 'custom'
        ? ' (custom)'
        : '';
  if (state.piece === 'railing') {
    return `${formatFeetInches(state.width)} long × ${formatFeetInches(state.height)} high${modeTag}`;
  }
  if (state.piece === 'patio-cover') {
    return `${formatFeetInches(state.width)} span × ${formatFeetInches(state.depth)} deep × ${formatFeetInches(state.height)} high${modeTag}`;
  }
  if (state.piece === 'sculpture-base') {
    return `${formatFeetInches(state.width)} wide × ${formatFeetInches(state.depth)} deep × ${formatFeetInches(state.height)} high${modeTag}`;
  }
  return `${formatFeetInches(state.width)} wide × ${formatFeetInches(state.height)} high${modeTag}`;
}

export function describeConfig(state: ConfiguratorState): string {
  if (state.hasPiece === false) {
    return 'Empty workspace — no piece configured';
  }
  const pieceSpec = PIECES[state.piece];
  const styleMatch = pieceSpec.styles.find((s) => s[0] === state.style);
  const styleName = styleMatch ? styleMatch[1] : state.style;
  const { catalog, picketOpt, barOpt, panelOpt } = getActiveSupplierSpecs(state);

  const parts: string[] = [pieceSpec.label, dimsText(state), styleName];

  if (state.piece === 'gate' || state.piece === 'railing') {
    const infillLabel =
      INFILL_PATTERNS.find((p) => p.id === state.infillPattern)?.label ||
      state.infillPattern;
    const scrollLabel =
      SCROLL_STYLES.find((s) => s.id === state.scrollStyle)?.label ||
      state.scrollStyle;
    const picketLabel =
      PICKET_FORM_STYLES.find((p) => p.id === state.picketStyle)?.label ||
      state.picketStyle;
    const picketSizeLabel = getEffectivePicketSizeLabel(state);
    if (state.style === 'scroll' || state.decor.scrolls || state.infillPattern === 'scroll-panel') {
      parts.push(`${scrollLabel}`);
    }
    if (state.infillPattern !== 'vertical-pickets' || state.style === 'vertical') {
      parts.push(`${infillLabel} (${picketLabel} pickets, ${picketSizeLabel} @ ${state.picketSpacing}" O.C.)`);
    }
    const sizeSpec =
      state.style === 'solid' || state.infillPattern === 'solid-panel'
        ? panelOpt.label
        : state.style === 'horizontal' || state.infillPattern === 'horizontal-bars'
          ? barOpt.label
          : state.picketSize !== 'supplier'
            ? picketSizeLabel
            : picketOpt.label;
    parts.push(`supplier ${catalog.name}: ${sizeSpec}`);
  }

  if (state.piece === 'gate' && state.leaves === 'double') {
    parts.push('double leaves');
  }
  if (state.piece === 'railing') {
    parts.push(
      state.topRail === 'round'
        ? 'round tube top rail'
        : state.topRail === 'cap'
          ? 'wide cap top rail'
          : 'flat bar top rail',
    );
    parts.push(`posts every ${state.postSpacing} ft`);
  }
  if (pieceSpec.post) {
    parts.push(`${formatPostStyleLabel(state)} posts`);
  }
  if (state.finial !== 'none') {
    parts.push(`${formatFinialLabel(state.finial)}`);
  }

  if (state.selectedLeaves && state.selectedLeaves.length > 0) {
    const leafNames = state.selectedLeaves
      .map((id) => LEAF_CATALOG.find((l) => l.id === id)?.label)
      .filter(Boolean);
    if (leafNames.length > 0) {
      parts.push(`leaves (${leafNames.join(', ')})`);
    }
  }

  const { totalPickets, accentCounts, totalAccents } = getPicketLayoutStats(state);
  if (totalAccents > 0 && totalPickets > 0) {
    const aList: string[] = [];
    if (accentCounts.knuckle) aList.push(`Knuckles: ${accentCounts.knuckle}`);
    if (accentCounts.emblem) aList.push(`Emblems: ${accentCounts.emblem}`);
    if (accentCounts.leaf) aList.push(`Leaves: ${accentCounts.leaf}`);
    parts.push(`picket accents (${aList.join(', ')})`);
  }

  if (state.piece === 'sign-frame' || state.showSign) {
    if (state.signLetteringMode === 'hand-drawn') {
      parts.push(`hand-drawn sign lettering (${state.signStrokes.length} strokes)`);
    } else if (state.signText.trim()) {
      parts.push(
        `sign lettering "${state.signText.trim()}" (${state.signFont.split(',')[0].replace(/'/g, '')}, ${state.signFontSize}px)`,
      );
    }
    if (state.signLetteringMode === 'typed' && state.signStrokes.length > 0) {
      parts.push(`freehand sign lines (${state.signStrokes.length} strokes)`);
    }
    if (state.signPicture) {
      parts.push(`sign artwork (${state.signPicture.fileName})`);
    }
  }

  const decor = DECOR_ITEMS.filter((item) => state.decor[item.key]).map(
    (item) => item.label.toLowerCase(),
  );
  if (decor.length) {
    parts.push(`decorative ${decor.join(', ')}`);
  }

  const finishName = state.customColor
    ? `custom color (${state.customColor.toUpperCase()}, ${FINISHES[state.finish].name})`
    : state.finish === 'powder-coat'
      ? `powder-coat (${POWDERS[state.powder].name})`
      : FINISHES[state.finish].name;
  parts.push(`${finishName} on ${formatMaterialLabel(state)}`);

  const areaKeys = Object.keys(state.areaColors) as PartArea[];
  if (areaKeys.length > 0) {
    const areaSummary = areaKeys
      .map(
        (k) =>
          `${PART_AREA_LABELS[k]}: ${(state.areaColors[k] || '').toUpperCase()}`,
      )
      .join(', ');
    parts.push(`per-area colors (${areaSummary})`);
  }

  if (state.sampleArt) {
    parts.push(`sample art attached (${state.sampleArt.fileName})`);
  }

  const sketchCount =
    (state.freeDrawStrokes2D?.length || 0) + (state.freeDrawStrokes3D?.length || 0);
  if (sketchCount > 0) {
    parts.push(`freehand sketch notes (${sketchCount} strokes)`);
  }

  return parts.join(' — ');
}
