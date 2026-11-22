interface HeroSectionProps {
  onOpenDesignStudio?: () => void;
}

export function HeroSection({ onOpenDesignStudio }: HeroSectionProps) {
  return (
    <section
      data-forge-section="hero"
      className="relative min-h-[85vh] flex items-end pb-14 sm:pb-16 pt-24 text-white bg-[#111] bg-cover bg-[center_38%]"
      style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(10,10,12,0.28) 0%, rgba(10,10,12,0.58) 55%, rgba(14,14,16,1) 100%), url("/images/wingfield-gates-installed.jpg")',
      }}
    >
      <div className="max-w-[1160px] mx-auto px-5 w-full">
        <p className="font-display uppercase tracking-[0.22em] text-xs sm:text-sm text-[#c9883d] mb-2">
          Custom fabrication &amp; metal art
        </p>
        <h1 className="font-display text-5xl sm:text-7xl lg:text-[5.5rem] font-bold uppercase tracking-[0.04em] leading-[1.05] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.75)] mb-3">
          Ray&rsquo;s <span className="text-[#e8a317]">Ironworks</span>
        </h1>
        <p className="text-lg sm:text-2xl font-semibold max-w-[640px] text-[#f2efe8] drop-shadow-[0_2px_14px_rgba(0,0,0,0.8)] mb-3">
          Forged by hand, built to last. Gates, railings, sculpture and
          architectural ironwork — from concept, through the shop, to
          installation.
        </p>
        <p className="font-display uppercase tracking-[0.08em] text-sm sm:text-base text-[#e8ddc9]">
          Reno &middot; Tahoe &middot; Truckee &middot; Los Angeles
        </p>
        <div className="flex flex-wrap gap-3 mt-7">
          <a
            href="#work"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-bold text-base transition-colors whitespace-nowrap"
          >
            See the Work
          </a>
          <button
            type="button"
            onClick={() => onOpenDesignStudio?.()}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-[#cfc9bf] bg-transparent text-white hover:border-[#e8a317] hover:text-[#e8a317] font-bold text-base transition-colors whitespace-nowrap cursor-pointer"
          >
            Design &amp; Get a Quote
          </button>
        </div>
      </div>
    </section>
  );
}
