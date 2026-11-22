export interface ServiceItem {
  title: string;
  description: string;
}

export interface ProjectImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface ProjectItem {
  id: string;
  meta: string;
  title: string;
  paragraphs: string[];
  extraHighlight?: { label: string; text: string };
  images: ProjectImage[];
  trio?: Array<{ src: string; alt: string; title: string; subtitle: string }>;
}

export interface ProjectPhotoExample {
  src: string;
  alt: string;
  caption: string;
  secondaryView?: {
    src: string;
    alt: string;
    caption: string;
  };
}

export interface GalleryItem {
  src: string;
  alt: string;
  title: string;
  description: string;
  fullShot?: boolean;
}

export interface DrawingTabSpec {
  id: 'gate' | 'railing' | 'sculpture' | 'sign' | 'patio';
  tabLabel: string;
  title: string;
  quoteType: string;
  buttonLabel: string;
  summary: string;
  bullets: Array<{ lead: string; text: string }>;
}

export const SITE_LINKS = {
  facebook: 'https://www.facebook.com/100067549362964',
  linkedin: 'https://www.linkedin.com/in/ray-mroczkowski-3a8239aa/',
  portfolioPdf:
    'https://drive.google.com/file/d/1vxk3xV5dK2uviuIfxNauHbHF3kklCBoH/view',
  artShop:
    'https://muse.ai/s/art-shop-zxb6jkaxylh3f/RT6wij0BEL05i2YtejPj7NXEUXMFVifMm56MmyNGDIA',
  phoneDisplay: '424-394-9271',
  phoneHref: 'tel:+14243949271',
  email: 'raysironworks101@gmail.com',
  emailHref: 'mailto:raysironworks101@gmail.com',
};

export const ABOUT_CREDENTIALS: string[] = [
  "Owner & operator, Ray's Ironworks — 2015 to present",
  "Welder & fabricator, Ski's Welding — 1994 to 2018",
  'Welding Certification; Renewable Energy, A.A.S. — Truckee Meadows Community College (2013)',
  'MIG / TIG / ARC welding · CAD (Fusion 360) · 3D printing / CNC · Structural fabrication & installation',
];

export const SERVICES: ServiceItem[] = [
  {
    title: 'Custom Gates',
    description:
      'Hand-forged gates and entry structures — from garden gates to public amphitheater entries.',
  },
  {
    title: 'Railings',
    description:
      'Architectural railings, interior and exterior — staircases, balconies, and hillside runs built for the slope and the view.',
  },
  {
    title: 'Sculpture & Public Art',
    description:
      'Cast-aluminum sculpture and large-scale steel installations, engineered for public life and decades of weather.',
  },
  {
    title: 'Monument Signs',
    description:
      'Monument and wayfinding signs — structural steel frameworks with finished metal panels.',
  },
  {
    title: 'Architectural Ironwork',
    description:
      'Patio covers, fences, storefront frameworks, and custom cladding — ironwork that shapes a space.',
  },
  {
    title: 'Structural Steel',
    description:
      'Structural channel, I-beams, and fabrication for builds that have to hold — and hold up.',
  },
];

export const SIGNATURE_PROJECTS: ProjectItem[] = [
  {
    id: 'found-faith',
    meta: 'Sculpture · Los Angeles · 2018',
    title: 'Found Faith',
    paragraphs: [
      'A life-size aluminum mannequin — about 69 inches tall — holding a cross, built from upcycled materials for Project Sanctuary, a 2018 fashion show at the First Continental Church in Los Angeles.',
    ],
    images: [
      {
        src: '/images/found-faith.jpg',
        alt: 'Found Faith — life-size aluminum figure holding a cross',
      },
    ],
  },
  {
    id: 'ghosts-of-malibu',
    meta: 'Cast aluminum · 12 × 12 × 12 in.',
    title: 'Ghosts of Malibu, Wing & Reach',
    paragraphs: [
      'Cast from upcycled aluminum salvaged after the Malibu fires — from homes, cars, and possessions people lost. Each piece is about 12 × 12 × 12 inches: the ghost of a patio set, a blade of cast aluminum balanced on wood, a branching form reaching skyward. Aluminum frozen mid-gesture.',
    ],
    images: [
      {
        src: '/src/assets/images/ghosts_malibu_gallery_1795234567727.jpg',
        alt: 'Ghosts of Malibu — cast aluminum sculpture displayed on a gallery table',
        caption: 'Ghosts of Malibu — cast aluminum displayed in gallery setting.',
      },
    ],
    trio: [
      {
        src: '/src/assets/images/ghosts_malibu_gallery_1795234567727.jpg',
        alt: 'Ghosts of Malibu — cast aluminum sculpture displayed on a gallery table',
        title: 'Ghosts of Malibu',
        subtitle: 'cast aluminum on a gallery table.',
      },
      {
        src: '/src/assets/images/wing_sculpture_gallery_1795234567567.jpg',
        alt: 'Wing — cast aluminum on wood displayed on a gallery pedestal',
        title: 'Wing',
        subtitle: 'cast aluminum on wood.',
      },
      {
        src: '/src/assets/images/reach_sculpture_gallery_1795234567837.jpg',
        alt: 'Reach — branching cast form displayed on a gallery table',
        title: 'Reach',
        subtitle: 'a branching cast form, reaching skyward.',
      },
      {
        src: '/src/assets/images/sentinel_sculpture_gallery_1795234567825.jpg',
        alt: 'Sentinel — standing cast figure displayed on a gallery table',
        title: 'Sentinel',
        subtitle: 'a standing cast figure, upright and watching.',
      },
    ],
  },
  {
    id: 'monument-of-legacy',
    meta: 'Monument sign · Downtown Reno',
    title: 'Monument of Legacy',
    paragraphs: [
      "A large-scale public monument sign in downtown Reno. Designed by Josh Vaile and fabricated by Ray's Ironworks over six weeks — a structural steel framework paired with vivid mosaic-style sheet metal panels.",
    ],
    images: [
      {
        src: '/images/monument-of-legacy.jpg',
        alt: 'Monument of Legacy — front mosaic panels, downtown Reno',
        caption: 'Monument of Legacy',
      },
      {
        src: '/images/monument-evolve.jpg',
        alt: 'Monument of Legacy — Evolve side back view with EVO LVE lettering and bees, downtown Reno',
        caption: 'Monument of Legacy — Evolve side',
      },
    ],
  },
];

export const PROJECT_PHOTO_EXAMPLES: ProjectPhotoExample[] = [
  {
    src: '/images/wingfield-gates-installed.jpg',
    alt: 'Wingfield Park Amphitheater Gates, installed outdoors',
    caption: 'Wingfield Park Amphitheater Gates — installed',
    secondaryView: {
      src: '/images/wingfield-gates-fabrication.jpg',
      alt: 'Wingfield Park Amphitheater Gates in the shop during fabrication — close-up on geometric steelwork and mesh',
      caption: 'Wingfield Park Amphitheater Gates — in shop fabrication',
    },
  },
  {
    src: '/images/beverly-hills-railing.jpg',
    alt: 'Beverly Hills custom railings — black steel slat railings',
    caption: 'Beverly Hills custom railings',
  },
  {
    src: '/images/skyline-patio.jpg',
    alt: 'Skyline Patio — architectural ironwork, Reno',
    caption: 'Skyline Patio — architectural ironwork, Reno',
  },
  {
    src: '/images/sunburst-fence.jpg',
    alt: 'Wells Fence — artistic fence',
    caption: 'Wells Fence — artistic fence',
  },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: '/images/beverly-hills-railing.jpg',
    alt: 'Black steel railings, Beverly Hills',
    title: 'Beverly Hills House',
    description: 'black steel slat railings for a hillside house.',
    fullShot: true,
  },
  {
    src: '/images/venice-storefront.jpg',
    alt: 'Wabi on Rose storefront, Venice',
    title: 'Wabi on Rose, Venice',
    description: 'outdoor seating framework, steel wrapped in planting.',
  },
  {
    src: '/images/metal-grass-day.jpg',
    alt: 'Metal grass sculpture by day',
    title: 'Metal Grass',
    description: 'forged botanicals, by day.',
  },
  {
    src: '/images/skyline-patio.jpg',
    alt: 'Skyline patio ironwork',
    title: 'Skyline Patio',
    description: 'architectural ironwork, Reno.',
  },
  {
    src: '/images/sunburst-fence.jpg',
    alt: 'Wells Fence — artistic fence',
    title: 'Wells Fence',
    description: 'artistic fence.',
  },
  {
    src: '/images/boat-tower.jpg',
    alt: 'TIG-welded aluminum boat racks',
    title: 'Aluminum Boat Racks',
    description: 'TIG-welded aluminum tube fabrication.',
  },
];

export const DRAWING_SPECS: DrawingTabSpec[] = [
  {
    id: 'gate',
    tabLabel: 'Gate',
    title: 'Custom Gate',
    quoteType: 'Custom Gate',
    buttonLabel: 'Start a quote for a gate',
    summary:
      'Hand-forged gates and entry structures — garden gates to public entries like the Wingfield Park Amphitheater Gates.',
    bullets: [
      {
        lead: 'What to measure:',
        text: 'the opening width and the height you want, plus post condition (existing posts or new).',
      },
      {
        lead: 'Materials:',
        text: 'steel frame and slats; finishes from raw/patina to powder-coated black.',
      },
      {
        lead: 'What drives the quote:',
        text: 'size, steel weight, finish, hinges/hardware, and site access for install.',
      },
    ],
  },
  {
    id: 'railing',
    tabLabel: 'Railing',
    title: 'Railing',
    quoteType: 'Railing',
    buttonLabel: 'Start a quote for railing',
    summary:
      'Architectural railings, interior and exterior — staircases, balconies, and hillside runs built for the slope and the view.',
    bullets: [
      {
        lead: 'What to measure:',
        text: 'total run length in feet, height, and whether stairs or a slope are involved.',
      },
      {
        lead: 'Materials:',
        text: 'steel slats and tube; blackened, blued, or powder-coated finishes.',
      },
      {
        lead: 'What drives the quote:',
        text: 'length, height, slope/stairs, finish, and mounting (deck, concrete, or wall).',
      },
    ],
  },
  {
    id: 'sculpture',
    tabLabel: 'Sculpture',
    title: 'Sculpture',
    quoteType: 'Sculpture',
    buttonLabel: 'Start a quote for a sculpture',
    summary:
      'Cast-aluminum sculpture and forged-steel forms — from tabletop pieces to large-scale installations.',
    bullets: [
      {
        lead: 'What to share:',
        text: 'the size you imagine, where it will live (indoors, garden, public space), and photos or sketches of the feeling you want.',
      },
      {
        lead: 'Materials:',
        text: 'cast aluminum, forged steel, mixed media — including upcycled and salvaged metal.',
      },
      {
        lead: 'What drives the quote:',
        text: 'size and weight, material, casting/forging time, base and mounting, and delivery/install.',
      },
    ],
  },
  {
    id: 'sign',
    tabLabel: 'Monument Sign',
    title: 'Monument Sign',
    quoteType: 'Monument Sign',
    buttonLabel: 'Start a quote for a sign',
    summary:
      'Monument and wayfinding signs — structural steel frameworks with finished metal panels, like the Monument of Legacy in downtown Reno.',
    bullets: [
      {
        lead: 'What to share:',
        text: 'panel size, the words or logo, and whether it stands in soil, concrete, or a wall.',
      },
      {
        lead: 'Materials:',
        text: 'structural steel frame; sheet-metal, mosaic, or cut panels.',
      },
      {
        lead: 'What drives the quote:',
        text: 'size, panel work, lettering, footings, and install.',
      },
    ],
  },
  {
    id: 'patio',
    tabLabel: 'Patio Cover',
    title: 'Patio Cover',
    quoteType: 'Patio Cover',
    buttonLabel: 'Start a quote for a patio cover',
    summary:
      'Architectural patio covers and shade structures — steel posts and beams that shape an outdoor room.',
    bullets: [
      {
        lead: 'What to measure:',
        text: 'the span and depth of the area to cover, and the height you want underneath.',
      },
      {
        lead: 'Materials:',
        text: 'steel posts, beams, and roof framing; open slats or solid cover.',
      },
      {
        lead: 'What drives the quote:',
        text: 'span, roof type, footings, and whether it attaches to the house or stands free.',
      },
    ],
  },
];

export const FORGE_KB: Array<{ k: string[]; a: string }> = [
  {
    k: ['price', 'cost', 'how much', 'charge', 'quote'],
    a: 'Every commission is priced to the job — there are no set prices. The fastest route is the quote form in the Quote & 3D section: pick a project type, set your dimensions in the 3D studio, add photos, and Ray replies with a quote and a timeline. Or email him directly at raysironworks101@gmail.com.',
  },
  {
    k: ['how long', 'timeline', 'how soon', 'turnaround', 'when'],
    a: 'Timelines depend on the job. For scale: the Monument of Legacy took six weeks in the shop, and the Wingfield Park gates went from the shop to installed in spring 2021. Ray gives a timeline with every quote.',
  },
  {
    k: [
      'where',
      'area',
      'serve',
      'location',
      'reno',
      'truckee',
      'tahoe',
      'los angeles',
      'topanga',
      'seattle',
      'venice',
      'beverly',
    ],
    a: 'Ray works across Reno, Tahoe, and Truckee, and the Los Angeles area — Venice Beach, Beverly Hills, Topanga Canyon — with installed work reaching Seattle, Washington.',
  },
  {
    k: ['process', 'how it works', 'how do you', 'steps', 'make', 'commission'],
    a: 'Ray designs, fabricates, and installs each piece himself — from the first sketch and CAD, through the shop, to on-site installation. What he proposes is what gets built: no handoffs, no surprises.',
  },
  {
    k: ['gate', 'gates'],
    a: "Custom gates are one of Ray's specialties — from garden gates to public entries. His best-known gate work is the Wingfield Park Amphitheater Gates in Reno: four gates, about 9 ft tall × 4 ft wide, a City of Reno Youth Council commission (about $15,000) installed in spring 2021. Try the gate in the 3D studio, or the Gate tab in the Quote & 3D section.",
  },
  {
    k: ['railing'],
    a: 'Ray builds architectural railings, interior and exterior — staircases, balconies, and hillside runs. See the Beverly Hills black steel railings in the gallery. The 3D studio lets you configure a railing — length, height, style, top rail, posts, finials, and finish — and send it straight into a quote.',
  },
  {
    k: ['sculpture', 'statue', 'art'],
    a: "Ray's sculpture includes cast-aluminum work like Ghosts of Malibu, Wing, and Reach — cast from aluminum salvaged after the Malibu fires — and Found Faith, a life-size aluminum figure from 2018.",
  },
  {
    k: ['wingfield'],
    a: 'The Wingfield Park Amphitheater Gates: a City of Reno Youth Council commission (about $15,000). Ray was the lead fabricating artist. Four gates, each about 9 ft tall × 4 ft wide, installed in spring 2021.',
  },
  {
    k: ['found faith', 'faith'],
    a: 'Found Faith is a life-size aluminum mannequin — about 69 inches tall — holding a cross, built from upcycled materials for Project Sanctuary, a 2018 fashion show at the First Continental Church in Los Angeles.',
  },
  {
    k: ['malibu', 'ghosts'],
    a: 'Ghosts of Malibu, Wing, and Reach are cast from upcycled aluminum salvaged after the Malibu fires — from homes, cars, and possessions people lost. Each piece is about 12 × 12 × 12 inches.',
  },
  {
    k: ['3d', 'configurator', 'studio', 'render', 'video', 'turntable', 'blueprint', 'dxf', 'stl', 'relief', 'sample art', 'touch'],
    a: 'The 3D studio in the Quote & 3D section lets you configure a gate, railing, sculpture base, sign frame, or patio cover frame using Standard, Custom, or Artistic sizing. You can tap any 3D part for Touch-to-Color, upload sample art (photo relief or PDF/DXF/SVG drawing), pick from 11 decorative ironwork prefabs, and export DXF, STL, 2D Blueprint PNG, Still PNG, or Turntable Video.',
  },
  {
    k: [
      'finish',
      'finishes',
      'material',
      'materials',
      'powder',
      'bronze',
      'copper',
      'galvanized',
      'aluminum',
      'wrought',
      'steel',
      'brass',
      'corten',
      'stainless',
      'glass',
      'wood',
      'patina',
      'verdigris',
      'color',
    ],
    a: 'Materials in the studio include wrought iron, steel, aluminum, copper, stainless steel, brass, bronze, corten steel, glass, wood, plus other/foreign material or unknown. Finishes include natural, matte black, bronze, copper, galvanized, powder-coat, brushed satin, hand-hammered, oil-rubbed bronze, antique patina, verdigris patina, and clear-coated bare — plus Touch-to-Color on individual parts.',
  },
  {
    k: ['finial', 'scroll', 'decorat', 'picket', 'rosette', 'basket', 'fleur', 'collar'],
    a: 'You can customize picket style (vertical pickets, horizontal bars, solid panel, or scrollwork) and picket spacing in the Pickets tab, plus toggle 11 decorative elements: scrolls, rings, leaf branch, medallion, rosettes, baskets, twisted bars, spearhead finials, fleur-de-lis, collars, and leaf sprays.',
  },
  {
    k: ['photo', 'photos', 'upload', 'picture', 'image'],
    a: 'You can upload up to 8 photos of your idea in the quote form — your site, sketches, or style inspiration. They stay on your device and are never uploaded anywhere; when you send the request, your email app opens and you attach the photos to that email before sending. You can also attach the blueprint PNG or a turntable still from the 3D studio.',
  },
  {
    k: ['digital', 'art shop', 'shop', 'buy', 'print', 'download'],
    a: "Ray also makes digital art — surreal, symbolic pieces about faith, transformation, and resilience. Original digital pieces are in the Art Shop as instant downloads. There's a link in the Digital Art section of this page.",
  },
  {
    k: ['contact', 'phone', 'email', 'call', 'reach'],
    a: "You can reach Ray at 424-394-9271 or raysironworks101@gmail.com. His Facebook page is Ray's Ironworks, his LinkedIn is Ray Mroczkowski, and the full artist portfolio (PDF) is linked in the Contact section.",
  },
  {
    k: ['linkedin'],
    a: "Ray's LinkedIn is Ray Mroczkowski — Custom Metal Artist & Fabricator | Owner, Ray's Ironworks. It's linked in the About and Contact sections of this page.",
  },
  {
    k: ['service', 'what do you do', 'offer'],
    a: "Ray builds custom gates, railings, sculpture and public art, monument signs, architectural ironwork, and structural steel. Everything is designed, fabricated, and installed by Ray's Ironworks. The Services section lists them all.",
  },
  {
    k: ['experience', 'how long', 'years', 'background'],
    a: "Ray has 25 years of welding experience and artistic expression. He has owned and operated Ray's Ironworks since 2015, and welded at Ski's Welding from 1994 to 2018. He holds a Welding Certification and a Renewable Energy A.A.S. from Truckee Meadows Community College.",
  },
];

export type SectionKey =
  | 'hero'
  | 'about'
  | 'services'
  | 'work'
  | 'gallery'
  | 'quote'
  | 'digital'
  | 'contact';

export const FORGE_SECTIONS: Record<
  SectionKey,
  { label: string; greeting: string; chips: string[] }
> = {
  hero: {
    label: 'Overview',
    greeting:
      "Welcome to Ray's Ironworks — forged by hand, built to last. Are you here for a gate, a railing, a sculpture, or something else? I can walk you through the work or help you start a quote.",
    chips: [
      'What does Ray build?',
      'See the signature projects',
      'Help me request a quote',
    ],
  },
  about: {
    label: 'About Ray',
    greeting:
      "This is Ray's story — 25 years of welding experience and artistic expression, from the welding shop as a boy to owning Ray's Ironworks. Ask me about his background, or how a commission works.",
    chips: [
      'How long has Ray been welding?',
      'How does a commission work?',
      'What areas does he serve?',
    ],
  },
  services: {
    label: 'Services',
    greeting:
      "These are the six things Ray builds — gates, railings, sculpture, monument signs, architectural ironwork, and structural steel. Not sure which fits your project? Tell me what you're dreaming up.",
    chips: [
      'Which service fits my project?',
      'Custom gates',
      'Railings',
      'Sculpture',
    ],
  },
  work: {
    label: 'Signature Projects',
    greeting:
      "These are Ray's signature pieces — Found Faith, Ghosts of Malibu, Monument of Legacy, plus project photo examples from Reno and Beverly Hills. Ask me about any of them.",
    chips: [
      'Found Faith',
      'Ghosts of Malibu',
      'Tell me about the Wingfield Gates',
    ],
  },
  gallery: {
    label: 'Gallery',
    greeting:
      'See a piece you like here? I can tell you about it — or help you start a quote for something similar, in the 3D studio.',
    chips: [
      'Tell me about a piece in the gallery',
      'Help me request a quote',
      'What finishes are available?',
    ],
  },
  quote: {
    label: 'Quote & 3D Studio',
    greeting:
      "You're in the Quote & 3D studio — configure your piece in 3D, pick colors and pickets, check the detailed 2D blueprint, export DXF/STL/PNG/video, upload photos, and send Ray a quote request. Want the 5-step checklist?",
    chips: [
      'Walk me through the quote checklist',
      'How do I upload photos?',
      'What is the 3D viewer?',
      'What finishes can I choose?',
    ],
  },
  digital: {
    label: 'Digital Art',
    greeting:
      'Alongside the ironwork, Ray makes digital art — surreal, symbolic pieces about faith, transformation, and resilience. The Art Shop has original pieces as instant downloads.',
    chips: ['Tell me about the digital art', 'How do I contact Ray?'],
  },
  contact: {
    label: 'Contact',
    greeting:
      'Ready to talk to Ray? You can call or email him directly — or I can help you draft a quote first, so he has everything he needs to price it.',
    chips: [
      'How do I contact Ray?',
      'Help me request a quote',
      'What areas do you serve?',
    ],
  },
};
