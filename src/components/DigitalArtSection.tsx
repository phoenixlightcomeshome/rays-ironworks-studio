import { SITE_LINKS } from '../data/ironworksData';

export function DigitalArtSection() {
  return (
    <section
      id="digital"
      data-forge-section="digital"
      className="py-16 sm:py-20"
    >
      <div className="max-w-[1160px] mx-auto px-5">
        <p className="font-display uppercase tracking-[0.22em] text-xs sm:text-sm text-[#c9883d] mb-2">
          Also from the studio
        </p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-[#f2efe8] mb-6">
          Digital Art
          <span className="block w-16 h-[3px] bg-[#c9883d] mt-3" />
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6 bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl p-6 sm:p-7">
          <p className="m-0 flex-1 text-[#d5cfc5]">
            Alongside the ironwork, Ray has begun a second practice in digital
            art — surreal, symbolic compositions exploring faith,
            transformation, and resilience. These digital works begin where the
            ironwork ends: the inner landscape behind the outer work. Original
            digital pieces are available in the Art Shop as instant downloads.
          </p>
          <a
            href={SITE_LINKS.artShop}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-bold text-base transition-colors whitespace-nowrap shrink-0"
          >
            Visit the Art Shop
          </a>
        </div>
      </div>
    </section>
  );
}
