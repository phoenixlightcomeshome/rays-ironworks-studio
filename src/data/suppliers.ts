export type SupplierId = 'ims' | 'king' | 'coast' | 'pdm' | 'mcnichols';

export interface SupplierSizeOption {
  id: string;
  label: string;
  inches: number; // nominal primary cross-section or sheet thickness in inches
  specText: string;
  patternHint?: 'perforated-staggered' | 'perforated-straight' | 'expanded' | 'grating' | 'mesh' | 'solid';
}

export interface SupplierCatalog {
  id: SupplierId;
  name: string;
  domain: string;
  catalogNote: string;
  pickets: SupplierSizeOption[];
  bars: SupplierSizeOption[];
  panels: SupplierSizeOption[];
}

export const SUPPLIER_ORDER: SupplierId[] = [
  'ims',
  'king',
  'coast',
  'pdm',
  'mcnichols',
];

export const SUPPLIER_CATALOGS: Record<SupplierId, SupplierCatalog> = {
  ims: {
    id: 'ims',
    name: 'Industrial Metal Supply',
    domain: 'industrialmetalsupply.com',
    catalogNote:
      'Published hot-rolled steel square tube (example: 1/2" × 1/2" × 16 ga, A513, lengths 5\'/10\'/20\'/24\'). IMS published list covers square tube sizes below; panels use shop thickness.',
    pickets: [
      { id: 'ims-0.5', label: '1/2" × 1/2" hot-rolled steel sq tube — Industrial Metal Supply', inches: 0.5, specText: '1/2" × 1/2" × 16 ga A513 sq tube (5\'/10\'/20\'/24\') — Industrial Metal Supply' },
      { id: 'ims-0.625', label: '5/8" hot-rolled steel sq tube — Industrial Metal Supply', inches: 0.625, specText: '5/8" hot-rolled steel sq tube A513 — Industrial Metal Supply' },
      { id: 'ims-0.75', label: '3/4" hot-rolled steel sq tube — Industrial Metal Supply', inches: 0.75, specText: '3/4" hot-rolled steel sq tube A513 — Industrial Metal Supply' },
      { id: 'ims-0.875', label: '7/8" hot-rolled steel sq tube — Industrial Metal Supply', inches: 0.875, specText: '7/8" hot-rolled steel sq tube A513 — Industrial Metal Supply' },
      { id: 'ims-1', label: '1" hot-rolled steel sq tube — Industrial Metal Supply', inches: 1.0, specText: '1" hot-rolled steel sq tube A513 — Industrial Metal Supply' },
    ],
    bars: [
      { id: 'ims-bar-0.5', label: '1/2" × 1/2" × 16 ga A513 sq tube — Industrial Metal Supply', inches: 0.5, specText: '1/2" × 1/2" × 16 ga A513 sq tube — Industrial Metal Supply' },
      { id: 'ims-bar-0.75', label: '3/4" hot-rolled steel sq tube — Industrial Metal Supply', inches: 0.75, specText: '3/4" hot-rolled steel sq tube — Industrial Metal Supply' },
      { id: 'ims-bar-1', label: '1" hot-rolled steel sq tube — Industrial Metal Supply', inches: 1.0, specText: '1" hot-rolled steel sq tube — Industrial Metal Supply' },
      { id: 'ims-bar-1.25', label: '1-1/4" hot-rolled steel sq tube — Industrial Metal Supply', inches: 1.25, specText: '1-1/4" hot-rolled steel sq tube — Industrial Metal Supply' },
      { id: 'ims-bar-1.5', label: '1-1/2" hot-rolled steel sq tube — Industrial Metal Supply', inches: 1.5, specText: '1-1/2" hot-rolled steel sq tube — Industrial Metal Supply' },
      { id: 'ims-bar-1.75', label: '1-3/4" hot-rolled steel sq tube — Industrial Metal Supply', inches: 1.75, specText: '1-3/4" hot-rolled steel sq tube — Industrial Metal Supply' },
      { id: 'ims-bar-2', label: '2" hot-rolled steel sq tube — Industrial Metal Supply', inches: 2.0, specText: '2" hot-rolled steel sq tube — Industrial Metal Supply' },
      { id: 'ims-bar-3', label: '3" hot-rolled steel sq tube — Industrial Metal Supply', inches: 3.0, specText: '3" hot-rolled steel sq tube — Industrial Metal Supply' },
    ],
    panels: [
      { id: 'ims-panel-std', label: 'Shop sheet paired with Industrial Metal Supply tube frame', inches: 0.075, specText: 'Hot-rolled frame (Industrial Metal Supply tube sizes 1/2"–3") + shop sheet', patternHint: 'solid' },
    ],
  },
  king: {
    id: 'king',
    name: 'King Architectural Metals',
    domain: 'kingmetals.com',
    catalogNote:
      'Published pickets, twisted balusters, forged 1/2" solid bar, 3/4" 16 ga pickets, and 2"×1" 14 ga 8\' tubing.',
    pickets: [
      { id: 'king-0.5-solid', label: '1/2" square solid picket — King Architectural', inches: 0.5, specText: '1/2" square solid picket — King Architectural' },
      { id: 'king-0.75-tube', label: '3/4" square tube 16 ga picket (20 per 6\'×8\' panel) — King Architectural', inches: 0.75, specText: '3/4" sq tube 16 ga picket (20 per 6\'×8\' panel) — King Architectural' },
      { id: 'king-0.5-twisted', label: '1/2" square fully twisted baluster (40" H) — King Architectural', inches: 0.5, specText: '1/2" square fully twisted baluster 40" H — King Architectural' },
      { id: 'king-0.5-forged', label: '1/2" square solid bar stock (forged) — King Architectural', inches: 0.5, specText: '1/2" square solid forged bar stock — King Architectural' },
    ],
    bars: [
      { id: 'king-bar-2x1', label: '2" × 1" rectangular tubing 14 ga, 8\' — King Architectural', inches: 2.0, specText: '2" × 1" rect tubing 14 ga, 8\' — King Architectural' },
      { id: 'king-bar-1.5', label: '1-1/2" panel rail — King Architectural', inches: 1.5, specText: '1-1/2" commercial rail — King Architectural' },
      { id: 'king-bar-0.5', label: '1/2" square solid bar stock — King Architectural', inches: 0.5, specText: '1/2" square solid bar stock — King Architectural' },
    ],
    panels: [
      { id: 'king-panel-6x8', label: '6\' × 8\' flat-top commercial panel (3/4" 16 ga pickets, 1-1/2" rails) — King Architectural', inches: 0.75, specText: '6\'×8\' flat-top commercial panel (20 × 3/4" 16 ga pickets, 1-1/2" rails) — King Architectural', patternHint: 'solid' },
      { id: 'king-interweave', label: 'Interweave architectural wire mesh infill — King Architectural', inches: 0.14, specText: 'Interweave architectural wire mesh infill — King Architectural', patternHint: 'mesh' },
      { id: 'king-intercrimp', label: 'Intercrimp woven wire infill panel — King Architectural', inches: 0.14, specText: 'Intercrimp woven wire infill panel — King Architectural', patternHint: 'mesh' },
      { id: 'king-expanded', label: 'Expanded metal steel diamond mesh sheet — King Architectural', inches: 0.12, specText: 'Expanded metal steel diamond mesh sheet — King Architectural', patternHint: 'expanded' },
    ],
  },
  coast: {
    id: 'coast',
    name: 'Coast Aluminum',
    domain: 'coastaluminum.com',
    catalogNote:
      'Published aluminum square tube 6061-T6 / 6063-T52 (20–24 ft lengths, sizes up to 6" and 8") and aluminum sheet (.032" and .040", 48" × 144"), perforated & architectural infill.',
    pickets: [
      { id: 'coast-tube-6', label: '6.000" × 0.250" wall aluminum sq tube (6061-T6 / 6063-T52, 20–24 ft) — Coast Aluminum', inches: 6.0, specText: '6.000" × 0.250" wall 6061-T6 / 6063-T52 sq tube (20–24 ft) — Coast Aluminum' },
      { id: 'coast-tube-8', label: '8.000" × 0.188" wall aluminum sq tube (6061-T6 / 6063-T52, 20–24 ft) — Coast Aluminum', inches: 8.0, specText: '8.000" × 0.188" wall 6061-T6 / 6063-T52 sq tube (20–24 ft) — Coast Aluminum' },
    ],
    bars: [
      { id: 'coast-bar-6', label: '6.000" × 0.250" wall aluminum sq tube (20–24 ft) — Coast Aluminum', inches: 6.0, specText: '6.000" × 0.250" wall 6061-T6 / 6063-T52 tube — Coast Aluminum' },
      { id: 'coast-bar-8', label: '8.000" × 0.188" wall aluminum sq tube (20–24 ft) — Coast Aluminum', inches: 8.0, specText: '8.000" × 0.188" wall 6061-T6 / 6063-T52 tube — Coast Aluminum' },
    ],
    panels: [
      { id: 'coast-sheet-032', label: '.032" aluminum sheet, 48" × 144" — Coast Aluminum', inches: 0.032, specText: '.032" aluminum sheet, 48" × 144" — Coast Aluminum', patternHint: 'solid' },
      { id: 'coast-sheet-040', label: '.040" aluminum sheet, 48" × 144" — Coast Aluminum', inches: 0.04, specText: '.040" aluminum sheet, 48" × 144" — Coast Aluminum', patternHint: 'solid' },
      { id: 'coast-perf-staggered', label: 'Perforated aluminum sheet (round staggered) — Coast Aluminum', inches: 0.08, specText: 'Perforated aluminum sheet round staggered — Coast Aluminum', patternHint: 'perforated-staggered' },
      { id: 'coast-perf-straight', label: 'Perforated aluminum sheet (round straight) — Coast Aluminum', inches: 0.08, specText: 'Perforated aluminum sheet round straight — Coast Aluminum', patternHint: 'perforated-straight' },
      { id: 'coast-louver', label: 'Louvered aluminum extrusion infill — Coast Aluminum', inches: 0.125, specText: 'Louvered aluminum extrusion infill — Coast Aluminum', patternHint: 'grating' },
    ],
  },
  pdm: {
    id: 'pdm',
    name: 'PDM Steel Service Centers',
    domain: 'pdmsteel.com',
    catalogNote:
      'Central & northern CA service centers. Publishes tubing types/grades/lengths (ASTM A-500 A/B/C & ASTM 1085, 20\'–60\' lengths), A516/70 plate, expanded metal, bar grating, and perforated infill.',
    pickets: [
      { id: 'pdm-1-16ga', label: '1" square tube 16 ga × 10 ft (ST1110/16) — PDM Steel', inches: 1.0, specText: '1" square tube 16 ga × 10 ft (ST1110/16) — PDM Steel' },
      { id: 'pdm-orn-tube', label: 'Ornamental sq/rect/round tube (ASTM A-500 A/B/C & 1085, 20\'–60\' lengths) — PDM Steel', inches: 1.0, specText: 'Ornamental tubing ASTM A-500 / 1085 (20\'–60\' lengths) — PDM Steel' },
    ],
    bars: [
      { id: 'pdm-bar-1', label: '1" square tube 16 ga × 10 ft (ST1110/16) — PDM Steel', inches: 1.0, specText: '1" square tube 16 ga × 10 ft (ST1110/16) — PDM Steel' },
      { id: 'pdm-bar-astm', label: 'Pipe & ornamental tubing ASTM A-500 / ASTM 1085 — PDM Steel', inches: 1.25, specText: 'Pipe & tubing ASTM A-500 A/B/C & ASTM 1085 — PDM Steel' },
    ],
    panels: [
      { id: 'pdm-plate-a516', label: 'Plate A516/70 (up to 6" thick) — PDM Steel', inches: 0.25, specText: 'Plate A516/70 (up to 6" thick) — PDM Steel', patternHint: 'solid' },
      { id: 'pdm-expanded', label: 'Expanded steel carbon sheet (flattened / standard) — PDM Steel', inches: 0.125, specText: 'Expanded steel carbon sheet — PDM Steel', patternHint: 'expanded' },
      { id: 'pdm-grating', label: 'Steel bar grating infill panel — PDM Steel', inches: 0.25, specText: 'Steel bar grating infill panel — PDM Steel', patternHint: 'grating' },
      { id: 'pdm-wire-intercrimp', label: 'Intercrimp / lock-crimp woven wire panel — PDM Steel', inches: 0.14, specText: 'Intercrimp / lock-crimp woven wire panel — PDM Steel', patternHint: 'mesh' },
      { id: 'pdm-perf', label: 'Perforated carbon steel sheet (staggered) — PDM Steel', inches: 0.105, specText: 'Perforated carbon steel sheet — PDM Steel', patternHint: 'perforated-staggered' },
    ],
  },
  mcnichols: {
    id: 'mcnichols',
    name: 'McNichols',
    domain: 'mcnichols.com',
    catalogNote:
      'Specializes in perforated metal, expanded metal, bar grating, and wire mesh panels/infill (expanded metal sheets 48"×96", 48"×120", 60"×120").',
    pickets: [
      { id: 'mc-infill-only', label: 'Panel & infill catalog only (see Solid Panel / Infill dropdowns) — McNichols', inches: 0.75, specText: 'Infill panel catalog — McNichols' },
    ],
    bars: [
      { id: 'mc-grating-bar', label: 'Bar grating infill structure — McNichols', inches: 1.0, specText: 'Bar grating infill structure — McNichols' },
    ],
    panels: [
      { id: 'mc-exp-48x96', label: 'Expanded metal sheet 48" × 96" — McNichols', inches: 0.12, specText: 'Expanded metal sheet 48" × 96" — McNichols', patternHint: 'expanded' },
      { id: 'mc-exp-48x120', label: 'Expanded metal sheet 48" × 120" — McNichols', inches: 0.12, specText: 'Expanded metal sheet 48" × 120" — McNichols', patternHint: 'expanded' },
      { id: 'mc-exp-60x120', label: 'Expanded metal sheet 60" × 120" — McNichols', inches: 0.12, specText: 'Expanded metal sheet 60" × 120" — McNichols', patternHint: 'expanded' },
      { id: 'mc-perf-staggered', label: 'Perforated metal (round hole, staggered pattern) — McNichols', inches: 0.1, specText: 'Perforated metal, round hole staggered — McNichols', patternHint: 'perforated-staggered' },
      { id: 'mc-perf-straight', label: 'Perforated metal (round hole, straight pattern) — McNichols', inches: 0.1, specText: 'Perforated metal, round hole straight — McNichols', patternHint: 'perforated-straight' },
      { id: 'mc-grating', label: 'Bar grating panel — McNichols', inches: 0.25, specText: 'Grating infill panel — McNichols', patternHint: 'grating' },
      { id: 'mc-wire-mesh', label: 'Wire mesh panel — McNichols', inches: 0.12, specText: 'Wire mesh infill panel — McNichols', patternHint: 'mesh' },
    ],
  },
};

export interface FontOption {
  family: string;
  label: string;
  googleFamily?: string;
  category:
    | 'Display / Architectural'
    | 'Serif'
    | 'Sans-Serif'
    | 'Script / Forged'
    | 'Monospace'
    | 'System';
}

const loadedGoogleFontSlugs = new Set<string>([
  'Abril Fatface',
  'Anton',
  'Bebas Neue',
  'Cinzel',
  'Cormorant Garamond',
  'Courier Prime',
  'Dancing Script',
  'Great Vibes',
  'IBM Plex Mono',
  'Inter',
  'Josefin Sans',
  'Libre Baskerville',
  'Lobster',
  'Merriweather',
  'Montserrat',
  'Open Sans',
  'Oswald',
  'Pacifico',
  'Playfair Display',
  'Poppins',
  'Raleway',
  'Righteous',
  'Roboto Slab',
  'Roboto',
  'Rye',
  'Source Sans 3',
  'Space Grotesk',
  'UnifrakturMaguntia',
]);

export function ensureGoogleFontLoaded(
  fontOptOrFamily: FontOption | string,
  onLoaded?: () => void,
): void {
  if (typeof document === 'undefined') return;
  const match =
    typeof fontOptOrFamily === 'string'
      ? SIGN_FONT_LIBRARY.find((f) => f.family === fontOptOrFamily)
      : fontOptOrFamily;
  const googleName = match?.googleFamily;
  if (!googleName) return;

  if (!loadedGoogleFontSlugs.has(googleName)) {
    loadedGoogleFontSlugs.add(googleName);
    const slug = googleName.trim().replace(/\s+/g, '+');
    const id = `gf-${slug.replace(/[^A-Za-z0-9_-]/g, '')}`;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${slug}:wght@400;600;700&display=swap`;
      if (onLoaded) {
        link.addEventListener('load', () => {
          if (document.fonts && typeof document.fonts.load === 'function') {
            void document.fonts.load(`700 28px "${googleName}"`).then(onLoaded, onLoaded);
          } else {
            onLoaded();
          }
        });
      }
      document.head.appendChild(link);
    }
  } else if (onLoaded && document.fonts && typeof document.fonts.load === 'function') {
    void document.fonts.load(`700 28px "${googleName}"`).then(onLoaded, onLoaded);
  }
}

export const SIGN_FONT_LIBRARY: FontOption[] = [
  // Display / Architectural (Google Fonts)
  { family: "'Oswald', sans-serif", label: 'Oswald (Shop Display)', googleFamily: 'Oswald', category: 'Display / Architectural' },
  { family: "'Bebas Neue', sans-serif", label: 'Bebas Neue', googleFamily: 'Bebas Neue', category: 'Display / Architectural' },
  { family: "'Anton', sans-serif", label: 'Anton (Bold Block)', googleFamily: 'Anton', category: 'Display / Architectural' },
  { family: "'Abril Fatface', serif", label: 'Abril Fatface', googleFamily: 'Abril Fatface', category: 'Display / Architectural' },
  { family: "'Righteous', sans-serif", label: 'Righteous', googleFamily: 'Righteous', category: 'Display / Architectural' },
  { family: "'Rye', serif", label: 'Rye (Western Iron)', googleFamily: 'Rye', category: 'Display / Architectural' },
  { family: "'UnifrakturMaguntia', cursive", label: 'Unifraktur (Blackletter)', googleFamily: 'UnifrakturMaguntia', category: 'Display / Architectural' },
  { family: "'Alfa Slab One', serif", label: 'Alfa Slab One', googleFamily: 'Alfa Slab One', category: 'Display / Architectural' },
  { family: "'Black Ops One', sans-serif", label: 'Black Ops One (Stencil)', googleFamily: 'Black Ops One', category: 'Display / Architectural' },
  { family: "'Bungee', sans-serif", label: 'Bungee', googleFamily: 'Bungee', category: 'Display / Architectural' },
  { family: "'Cinzel Decorative', serif", label: 'Cinzel Decorative', googleFamily: 'Cinzel Decorative', category: 'Display / Architectural' },
  { family: "'Fjalla One', sans-serif", label: 'Fjalla One', googleFamily: 'Fjalla One', category: 'Display / Architectural' },
  { family: "'Fredericka the Great', serif", label: 'Fredericka the Great', googleFamily: 'Fredericka the Great', category: 'Display / Architectural' },
  { family: "'Graduate', serif", label: 'Graduate (Varsity Block)', googleFamily: 'Graduate', category: 'Display / Architectural' },
  { family: "'Lobster Two', cursive", label: 'Lobster Two', googleFamily: 'Lobster Two', category: 'Display / Architectural' },
  { family: "'Permanent Marker', cursive", label: 'Permanent Marker', googleFamily: 'Permanent Marker', category: 'Display / Architectural' },
  { family: "'Pirata One', serif", label: 'Pirata One (Gothic)', googleFamily: 'Pirata One', category: 'Display / Architectural' },
  { family: "'Russo One', sans-serif", label: 'Russo One', googleFamily: 'Russo One', category: 'Display / Architectural' },
  { family: "'Sancreek', serif", label: 'Sancreek (Forged Western)', googleFamily: 'Sancreek', category: 'Display / Architectural' },
  { family: "'Special Elite', monospace", label: 'Special Elite (Stamped)', googleFamily: 'Special Elite', category: 'Display / Architectural' },
  { family: "'Staatliches', sans-serif", label: 'Staatliches', googleFamily: 'Staatliches', category: 'Display / Architectural' },
  { family: "'Teko', sans-serif", label: 'Teko', googleFamily: 'Teko', category: 'Display / Architectural' },
  { family: "'Titan One', sans-serif", label: 'Titan One', googleFamily: 'Titan One', category: 'Display / Architectural' },
  { family: "'Ultra', serif", label: 'Ultra (Heavy Slab)', googleFamily: 'Ultra', category: 'Display / Architectural' },

  // Serif (Google Fonts)
  { family: "'Cinzel', serif", label: 'Cinzel (Monumental)', googleFamily: 'Cinzel', category: 'Serif' },
  { family: "'Playfair Display', serif", label: 'Playfair Display', googleFamily: 'Playfair Display', category: 'Serif' },
  { family: "'Cormorant Garamond', serif", label: 'Cormorant Garamond', googleFamily: 'Cormorant Garamond', category: 'Serif' },
  { family: "'Libre Baskerville', serif", label: 'Libre Baskerville', googleFamily: 'Libre Baskerville', category: 'Serif' },
  { family: "'Merriweather', serif", label: 'Merriweather', googleFamily: 'Merriweather', category: 'Serif' },
  { family: "'Roboto Slab', serif", label: 'Roboto Slab', googleFamily: 'Roboto Slab', category: 'Serif' },
  { family: "'Arvo', serif", label: 'Arvo', googleFamily: 'Arvo', category: 'Serif' },
  { family: "'Bitter', serif", label: 'Bitter', googleFamily: 'Bitter', category: 'Serif' },
  { family: "'Bodoni Moda', serif", label: 'Bodoni Moda', googleFamily: 'Bodoni Moda', category: 'Serif' },
  { family: "'Cardo', serif", label: 'Cardo', googleFamily: 'Cardo', category: 'Serif' },
  { family: "'Crimson Text', serif", label: 'Crimson Text', googleFamily: 'Crimson Text', category: 'Serif' },
  { family: "'DM Serif Display', serif", label: 'DM Serif Display', googleFamily: 'DM Serif Display', category: 'Serif' },
  { family: "'EB Garamond', serif", label: 'EB Garamond', googleFamily: 'EB Garamond', category: 'Serif' },
  { family: "'Lora', serif", label: 'Lora', googleFamily: 'Lora', category: 'Serif' },
  { family: "'PT Serif', serif", label: 'PT Serif', googleFamily: 'PT Serif', category: 'Serif' },
  { family: "'Spectral', serif", label: 'Spectral', googleFamily: 'Spectral', category: 'Serif' },
  { family: "'Vollkorn', serif", label: 'Vollkorn', googleFamily: 'Vollkorn', category: 'Serif' },
  { family: "'Zilla Slab', serif", label: 'Zilla Slab', googleFamily: 'Zilla Slab', category: 'Serif' },

  // Sans-Serif (Google Fonts)
  { family: "'Josefin Sans', sans-serif", label: 'Josefin Sans', googleFamily: 'Josefin Sans', category: 'Sans-Serif' },
  { family: "'Montserrat', sans-serif", label: 'Montserrat', googleFamily: 'Montserrat', category: 'Sans-Serif' },
  { family: "'Raleway', sans-serif", label: 'Raleway', googleFamily: 'Raleway', category: 'Sans-Serif' },
  { family: "'Poppins', sans-serif", label: 'Poppins', googleFamily: 'Poppins', category: 'Sans-Serif' },
  { family: "'Space Grotesk', sans-serif", label: 'Space Grotesk', googleFamily: 'Space Grotesk', category: 'Sans-Serif' },
  { family: "'Inter', sans-serif", label: 'Inter', googleFamily: 'Inter', category: 'Sans-Serif' },
  { family: "'Roboto', sans-serif", label: 'Roboto', googleFamily: 'Roboto', category: 'Sans-Serif' },
  { family: "'Open Sans', sans-serif", label: 'Open Sans', googleFamily: 'Open Sans', category: 'Sans-Serif' },
  { family: "'Source Sans 3', sans-serif", label: 'Source Sans 3', googleFamily: 'Source Sans 3', category: 'Sans-Serif' },
  { family: "'Archivo Black', sans-serif", label: 'Archivo Black', googleFamily: 'Archivo Black', category: 'Sans-Serif' },
  { family: "'Barlow Condensed', sans-serif", label: 'Barlow Condensed', googleFamily: 'Barlow Condensed', category: 'Sans-Serif' },
  { family: "'DM Sans', sans-serif", label: 'DM Sans', googleFamily: 'DM Sans', category: 'Sans-Serif' },
  { family: "'Exo 2', sans-serif", label: 'Exo 2', googleFamily: 'Exo 2', category: 'Sans-Serif' },
  { family: "'Lato', sans-serif", label: 'Lato', googleFamily: 'Lato', category: 'Sans-Serif' },
  { family: "'Manrope', sans-serif", label: 'Manrope', googleFamily: 'Manrope', category: 'Sans-Serif' },
  { family: "'Nunito', sans-serif", label: 'Nunito', googleFamily: 'Nunito', category: 'Sans-Serif' },
  { family: "'Orbitron', sans-serif", label: 'Orbitron (Architectural Tech)', googleFamily: 'Orbitron', category: 'Sans-Serif' },
  { family: "'Outfit', sans-serif", label: 'Outfit', googleFamily: 'Outfit', category: 'Sans-Serif' },
  { family: "'Plus Jakarta Sans', sans-serif", label: 'Plus Jakarta Sans', googleFamily: 'Plus Jakarta Sans', category: 'Sans-Serif' },
  { family: "'Quicksand', sans-serif", label: 'Quicksand', googleFamily: 'Quicksand', category: 'Sans-Serif' },
  { family: "'Rubik', sans-serif", label: 'Rubik', googleFamily: 'Rubik', category: 'Sans-Serif' },
  { family: "'Syne', sans-serif", label: 'Syne', googleFamily: 'Syne', category: 'Sans-Serif' },
  { family: "'Work Sans', sans-serif", label: 'Work Sans', googleFamily: 'Work Sans', category: 'Sans-Serif' },

  // Script / Forged (Google Fonts)
  { family: "'Great Vibes', cursive", label: 'Great Vibes', googleFamily: 'Great Vibes', category: 'Script / Forged' },
  { family: "'Dancing Script', cursive", label: 'Dancing Script', googleFamily: 'Dancing Script', category: 'Script / Forged' },
  { family: "'Pacifico', cursive", label: 'Pacifico', googleFamily: 'Pacifico', category: 'Script / Forged' },
  { family: "'Lobster', cursive", label: 'Lobster', googleFamily: 'Lobster', category: 'Script / Forged' },
  { family: "'Alex Brush', cursive", label: 'Alex Brush', googleFamily: 'Alex Brush', category: 'Script / Forged' },
  { family: "'Allura', cursive", label: 'Allura', googleFamily: 'Allura', category: 'Script / Forged' },
  { family: "'Amatic SC', cursive", label: 'Amatic SC', googleFamily: 'Amatic SC', category: 'Script / Forged' },
  { family: "'Caveat', cursive", label: 'Caveat', googleFamily: 'Caveat', category: 'Script / Forged' },
  { family: "'Kaushan Script', cursive", label: 'Kaushan Script', googleFamily: 'Kaushan Script', category: 'Script / Forged' },
  { family: "'Marck Script', cursive", label: 'Marck Script', googleFamily: 'Marck Script', category: 'Script / Forged' },
  { family: "'Pinyon Script', cursive", label: 'Pinyon Script', googleFamily: 'Pinyon Script', category: 'Script / Forged' },
  { family: "'Sacramento', cursive", label: 'Sacramento', googleFamily: 'Sacramento', category: 'Script / Forged' },
  { family: "'Satisfy', cursive", label: 'Satisfy', googleFamily: 'Satisfy', category: 'Script / Forged' },
  { family: "'Tangerine', cursive", label: 'Tangerine', googleFamily: 'Tangerine', category: 'Script / Forged' },
  { family: "'Yellowtail', cursive", label: 'Yellowtail', googleFamily: 'Yellowtail', category: 'Script / Forged' },

  // Monospace (Google Fonts)
  { family: "'Courier Prime', monospace", label: 'Courier Prime', googleFamily: 'Courier Prime', category: 'Monospace' },
  { family: "'IBM Plex Mono', monospace", label: 'IBM Plex Mono', googleFamily: 'IBM Plex Mono', category: 'Monospace' },
  { family: "'JetBrains Mono', monospace", label: 'JetBrains Mono', googleFamily: 'JetBrains Mono', category: 'Monospace' },
  { family: "'Roboto Mono', monospace", label: 'Roboto Mono', googleFamily: 'Roboto Mono', category: 'Monospace' },
  { family: "'Space Mono', monospace", label: 'Space Mono', googleFamily: 'Space Mono', category: 'Monospace' },

  // Standard System Fonts
  { family: "Georgia, serif", label: 'Georgia (System Serif)', category: 'System' },
  { family: "'Times New Roman', Times, serif", label: 'Times New Roman', category: 'System' },
  { family: "Palatino, 'Palatino Linotype', serif", label: 'Palatino', category: 'System' },
  { family: "Garamond, serif", label: 'Garamond', category: 'System' },
  { family: "'Bookman Old Style', serif", label: 'Bookman', category: 'System' },
  { family: "Rockwell, serif", label: 'Rockwell', category: 'System' },
  { family: "Copperplate, 'Copperplate Gothic Light', fantasy", label: 'Copperplate', category: 'System' },
  { family: "Arial, Helvetica, sans-serif", label: 'Arial', category: 'System' },
  { family: "'Arial Black', sans-serif", label: 'Arial Black', category: 'System' },
  { family: "Impact, Charcoal, sans-serif", label: 'Impact', category: 'System' },
  { family: "Verdana, Geneva, sans-serif", label: 'Verdana', category: 'System' },
  { family: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS', category: 'System' },
  { family: "Tahoma, sans-serif", label: 'Tahoma', category: 'System' },
  { family: "'Lucida Sans Unicode', sans-serif", label: 'Lucida Sans', category: 'System' },
  { family: "'Brush Script MT', cursive", label: 'Brush Script MT', category: 'System' },
  { family: "'Courier New', Courier, monospace", label: 'Courier New', category: 'System' },
  { family: "'Lucida Console', Monaco, monospace", label: 'Lucida Console', category: 'System' },
];
