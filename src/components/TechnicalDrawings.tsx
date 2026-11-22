import { DRAWING_SPECS, DrawingTabSpec } from '../data/ironworksData';

interface TechnicalDrawingsProps {
  activeTab: DrawingTabSpec['id'];
  onChangeTab: (id: DrawingTabSpec['id']) => void;
  onStartQuote: (quoteType: string) => void;
}

function ElevationSvg({ id }: { id: DrawingTabSpec['id'] }) {
  if (id === 'gate') {
    return (
      <svg
        viewBox="0 0 420 270"
        role="img"
        aria-label="Technical drawing of a custom steel gate, front elevation with width and height dimensions"
        className="w-full h-auto bg-[#101012] border border-[#2a2a2e] rounded-lg"
      >
        <defs>
          <marker
            id="arr-gate"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 z" fill="#E8A317" />
          </marker>
        </defs>
        <line
          x1="60"
          y1="38"
          x2="360"
          y2="38"
          stroke="#E8A317"
          strokeWidth="1.5"
          markerStart="url(#arr-gate)"
          markerEnd="url(#arr-gate)"
        />
        <text
          x="210"
          y="28"
          fill="#E8A317"
          fontSize="13"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          WIDTH — tell us the opening
        </text>
        <line
          x1="388"
          y1="55"
          x2="388"
          y2="235"
          stroke="#E8A317"
          strokeWidth="1.5"
          markerStart="url(#arr-gate)"
          markerEnd="url(#arr-gate)"
        />
        <text
          x="402"
          y="150"
          fill="#E8A317"
          fontSize="13"
          textAnchor="middle"
          fontFamily="sans-serif"
          transform="rotate(90 402 150)"
        >
          HEIGHT
        </text>
        <rect
          x="55"
          y="55"
          width="14"
          height="180"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <rect
          x="351"
          y="55"
          width="14"
          height="180"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <rect
          x="55"
          y="55"
          width="310"
          height="12"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <rect
          x="55"
          y="223"
          width="310"
          height="12"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <g stroke="#8a8f98" strokeWidth="5">
          <line x1="95" y1="67" x2="95" y2="223" />
          <line x1="125" y1="67" x2="125" y2="223" />
          <line x1="155" y1="67" x2="155" y2="223" />
          <line x1="185" y1="67" x2="185" y2="223" />
          <line x1="215" y1="67" x2="215" y2="223" />
          <line x1="245" y1="67" x2="245" y2="223" />
          <line x1="275" y1="67" x2="275" y2="223" />
          <line x1="305" y1="67" x2="305" y2="223" />
          <line x1="335" y1="67" x2="335" y2="223" />
        </g>
        <text x="62" y="252" fill="#a8a29a" fontSize="12" fontFamily="sans-serif">
          Steel posts
        </text>
        <text
          x="210"
          y="252"
          fill="#a8a29a"
          fontSize="12"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          Frame + vertical slats
        </text>
      </svg>
    );
  }

  if (id === 'railing') {
    return (
      <svg
        viewBox="0 0 420 220"
        role="img"
        aria-label="Technical drawing of a railing run, front elevation with length and height dimensions"
        className="w-full h-auto bg-[#101012] border border-[#2a2a2e] rounded-lg"
      >
        <defs>
          <marker
            id="arr-rail"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 z" fill="#E8A317" />
          </marker>
        </defs>
        <line
          x1="30"
          y1="30"
          x2="390"
          y2="30"
          stroke="#E8A317"
          strokeWidth="1.5"
          markerStart="url(#arr-rail)"
          markerEnd="url(#arr-rail)"
        />
        <text
          x="210"
          y="20"
          fill="#E8A317"
          fontSize="13"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          RUN LENGTH — total feet of railing
        </text>
        <line
          x1="404"
          y1="50"
          x2="404"
          y2="170"
          stroke="#E8A317"
          strokeWidth="1.5"
          markerStart="url(#arr-rail)"
          markerEnd="url(#arr-rail)"
        />
        <text
          x="414"
          y="112"
          fill="#E8A317"
          fontSize="13"
          textAnchor="middle"
          fontFamily="sans-serif"
          transform="rotate(90 414 112)"
        >
          HEIGHT
        </text>
        <rect
          x="25"
          y="48"
          width="370"
          height="10"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <rect
          x="25"
          y="160"
          width="370"
          height="8"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <g stroke="#8a8f98" strokeWidth="4">
          {[55, 85, 115, 145, 175, 205, 235, 265, 295, 325, 355, 385].map(
            (x) => (
              <line key={x} x1={x} y1="58" x2={x} y2="160" />
            ),
          )}
        </g>
        <rect
          x="25"
          y="48"
          width="10"
          height="122"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <rect
          x="385"
          y="48"
          width="10"
          height="122"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <text x="30" y="196" fill="#a8a29a" fontSize="12" fontFamily="sans-serif">
          Top rail &middot; balusters &middot; posts
        </text>
        <text
          x="390"
          y="196"
          fill="#a8a29a"
          fontSize="12"
          textAnchor="end"
          fontFamily="sans-serif"
        >
          Stairs? Note the slope.
        </text>
      </svg>
    );
  }

  if (id === 'sculpture') {
    return (
      <svg
        viewBox="0 0 320 270"
        role="img"
        aria-label="Technical drawing of a sculpture on a base, with height dimension"
        className="w-full h-auto bg-[#101012] border border-[#2a2a2e] rounded-lg"
      >
        <defs>
          <marker
            id="arr-sc"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 z" fill="#E8A317" />
          </marker>
        </defs>
        <line
          x1="268"
          y1="30"
          x2="268"
          y2="210"
          stroke="#E8A317"
          strokeWidth="1.5"
          markerStart="url(#arr-sc)"
          markerEnd="url(#arr-sc)"
        />
        <text
          x="282"
          y="122"
          fill="#E8A317"
          fontSize="13"
          textAnchor="middle"
          fontFamily="sans-serif"
          transform="rotate(90 282 122)"
        >
          HEIGHT
        </text>
        <rect
          x="90"
          y="210"
          width="140"
          height="16"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <rect
          x="100"
          y="226"
          width="120"
          height="10"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <path
          d="M160 210 C 150 160, 120 150, 105 110 C 95 85, 110 70, 130 80 C 120 60, 135 40, 155 55 C 160 35, 175 30, 180 50 C 195 40, 205 60, 195 75 C 215 70, 225 90, 210 105 C 225 125, 200 150, 185 165 C 175 180, 168 195, 160 210 Z"
          fill="#8a8f98"
          stroke="#C9883D"
          strokeWidth="1.5"
        />
        <text
          x="160"
          y="258"
          fill="#a8a29a"
          fontSize="12"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          Cast or forged form on a base
        </text>
      </svg>
    );
  }

  if (id === 'sign') {
    return (
      <svg
        viewBox="0 0 420 230"
        role="img"
        aria-label="Technical drawing of a monument sign, front elevation with width and height dimensions"
        className="w-full h-auto bg-[#101012] border border-[#2a2a2e] rounded-lg"
      >
        <defs>
          <marker
            id="arr-sign"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 z" fill="#E8A317" />
          </marker>
        </defs>
        <line
          x1="70"
          y1="28"
          x2="350"
          y2="28"
          stroke="#E8A317"
          strokeWidth="1.5"
          markerStart="url(#arr-sign)"
          markerEnd="url(#arr-sign)"
        />
        <text
          x="210"
          y="18"
          fill="#E8A317"
          fontSize="13"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          PANEL WIDTH
        </text>
        <line
          x1="382"
          y1="45"
          x2="382"
          y2="165"
          stroke="#E8A317"
          strokeWidth="1.5"
          markerStart="url(#arr-sign)"
          markerEnd="url(#arr-sign)"
        />
        <text
          x="396"
          y="108"
          fill="#E8A317"
          fontSize="13"
          textAnchor="middle"
          fontFamily="sans-serif"
          transform="rotate(90 396 108)"
        >
          HEIGHT
        </text>
        <rect
          x="70"
          y="45"
          width="280"
          height="120"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <rect
          x="90"
          y="65"
          width="240"
          height="80"
          fill="none"
          stroke="#8a8f98"
          strokeWidth="2"
        />
        <text
          x="210"
          y="112"
          fill="#F2EFE8"
          fontSize="20"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          YOUR NAME HERE
        </text>
        <rect
          x="90"
          y="165"
          width="12"
          height="45"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <rect
          x="318"
          y="165"
          width="12"
          height="45"
          fill="#3a3f46"
          stroke="#C9883D"
        />
        <text
          x="210"
          y="222"
          fill="#a8a29a"
          fontSize="12"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          Steel framework &middot; finished metal panels &middot; set in concrete
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 420 230"
      role="img"
      aria-label="Technical drawing of a patio cover, side elevation with span and height dimensions"
      className="w-full h-auto bg-[#101012] border border-[#2a2a2e] rounded-lg"
    >
      <defs>
        <marker
          id="arr-patio"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 z" fill="#E8A317" />
        </marker>
      </defs>
      <line
        x1="50"
        y1="30"
        x2="370"
        y2="30"
        stroke="#E8A317"
        strokeWidth="1.5"
        markerStart="url(#arr-patio)"
        markerEnd="url(#arr-patio)"
      />
      <text
        x="210"
        y="20"
        fill="#E8A317"
        fontSize="13"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        SPAN — how far it reaches
      </text>
      <line
        x1="396"
        y1="60"
        x2="396"
        y2="190"
        stroke="#E8A317"
        strokeWidth="1.5"
        markerStart="url(#arr-patio)"
        markerEnd="url(#arr-patio)"
      />
      <text
        x="408"
        y="128"
        fill="#E8A317"
        fontSize="13"
        textAnchor="middle"
        fontFamily="sans-serif"
        transform="rotate(90 408 128)"
      >
        HEIGHT
      </text>
      <polygon
        points="40,70 380,50 380,66 40,86"
        fill="#3a3f46"
        stroke="#C9883D"
      />
      <g stroke="#8a8f98" strokeWidth="4">
        <line x1="60" y1="84" x2="150" y2="80" />
        <line x1="150" y1="80" x2="240" y2="76" />
        <line x1="240" y1="76" x2="330" y2="72" />
      </g>
      <rect
        x="55"
        y="86"
        width="12"
        height="104"
        fill="#3a3f46"
        stroke="#C9883D"
      />
      <rect
        x="200"
        y="78"
        width="12"
        height="112"
        fill="#3a3f46"
        stroke="#C9883D"
      />
      <rect
        x="345"
        y="70"
        width="12"
        height="120"
        fill="#3a3f46"
        stroke="#C9883D"
      />
      <line
        x1="40"
        y1="190"
        x2="380"
        y2="190"
        stroke="#a8a29a"
        strokeWidth="1.5"
      />
      <text
        x="210"
        y="212"
        fill="#a8a29a"
        fontSize="12"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        Posts &middot; beams &middot; roof — attached or freestanding
      </text>
    </svg>
  );
}

export function TechnicalDrawings({
  activeTab,
  onChangeTab,
  onStartQuote,
}: TechnicalDrawingsProps) {
  const activeSpec =
    DRAWING_SPECS.find((s) => s.id === activeTab) || DRAWING_SPECS[0];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div>
          <p className="font-display uppercase tracking-[0.2em] text-xs text-[#c9883d] mb-1">
            Measurement reference
          </p>
          <h3 className="text-xl sm:text-2xl text-[#f2efe8] m-0">
            How Each Project Type Is Drawn &amp; Measured
          </h3>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Project types"
        >
          {DRAWING_SPECS.map((spec) => {
            const active = spec.id === activeTab;
            return (
              <button
                key={spec.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeTab(spec.id)}
                className={`font-display uppercase tracking-[0.06em] text-sm px-4 py-2 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#c9883d] text-[#141210] border-[#c9883d] font-semibold'
                    : 'bg-[#1c1c1f] text-[#cfc9bf] border-[#2a2a2e] hover:border-[#c9883d]/60'
                }`}
              >
                {spec.tabLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        className="bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start"
      >
        <ElevationSvg id={activeSpec.id} />

        <div>
          <h4 className="font-display uppercase text-xl text-[#e8a317] mb-2">
            {activeSpec.title}
          </h4>
          <p className="text-[#d5cfc5] mb-3">{activeSpec.summary}</p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#d5cfc5] mb-5">
            {activeSpec.bullets.map((b) => (
              <li key={b.lead}>
                <strong className="text-[#f2efe8]">{b.lead}</strong> {b.text}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onStartQuote(activeSpec.quoteType)}
            className="px-4 py-2.5 rounded-lg bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-bold text-sm transition-colors cursor-pointer"
          >
            {activeSpec.buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
