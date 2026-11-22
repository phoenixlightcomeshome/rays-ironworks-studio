import { GALLERY_ITEMS } from '../data/ironworksData';
import { LightboxImage } from './ImageLightbox';
import { ResilientImage } from './ResilientImage';

interface GallerySectionProps {
  onOpenLightbox: (img: LightboxImage) => void;
  onOpenHelper: (question: string) => void;
}

export function GallerySection({
  onOpenLightbox,
  onOpenHelper,
}: GallerySectionProps) {
  const beverlyItem = GALLERY_ITEMS.find((g) => g.title === 'Beverly Hills House');
  const otherItems = GALLERY_ITEMS.filter((g) => g.title !== 'Beverly Hills House');

  return (
    <section
      id="gallery"
      data-forge-section="gallery"
      className="py-16 sm:py-20 bg-[#161618]"
    >
      <div className="max-w-[1160px] mx-auto px-5">
        <p className="font-display uppercase tracking-[0.22em] text-xs sm:text-sm text-[#c9883d] mb-2">
          From the shop &amp; the field
        </p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-[#f2efe8] mb-4">
          Gallery
          <span className="block w-16 h-[3px] bg-[#c9883d] mt-3" />
        </h2>
        <p className="text-lg text-[#d8d2c8] max-w-[720px] mb-8">
          Railings set, structures raised, and ironwork finished on site — from
          Reno, Tahoe, and Truckee to LA and Topanga Canyon.
        </p>

        {/* Beverly Hills House Railing Group */}
        {beverlyItem && (
          <div className="mb-8 bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <h3 className="text-xl sm:text-2xl text-[#f2efe8] m-0">
                Beverly Hills House railing
              </h3>
              <span className="text-xs sm:text-sm text-[#c9883d]">
                More angles of this railing are coming
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <figure className="m-0 bg-[#141416] border border-[#2a2a2e] rounded-xl overflow-hidden flex flex-col">
                <ResilientImage
                  src={beverlyItem.src}
                  alt={beverlyItem.alt}
                  onClick={() =>
                    onOpenLightbox({
                      src: beverlyItem.src,
                      alt: beverlyItem.alt,
                      caption: `${beverlyItem.title} — Full-length shot: ${beverlyItem.description}`,
                    })
                  }
                  className="w-full h-64 object-contain bg-[#101012] cursor-zoom-in hover:opacity-95 transition-opacity"
                />
                <figcaption className="px-4 py-3 text-sm text-[#cfc9bf]">
                  <strong className="text-[#f2efe8]">Full-length shot</strong> —{' '}
                  {beverlyItem.description}
                </figcaption>
              </figure>

              <figure className="m-0 bg-[#141416] border border-[#2a2a2e] rounded-xl overflow-hidden flex flex-col">
                <ResilientImage
                  src="/images/beverly-hills-railing-angle2-cropped.jpg"
                  alt="Beverly Hills House black steel slat railing deck angle along the wood deck"
                  onClick={() =>
                    onOpenLightbox({
                      src: '/images/beverly-hills-railing-angle2-cropped.jpg',
                      alt: 'Beverly Hills House black steel slat railing deck angle along the wood deck',
                      caption:
                        'Beverly Hills House — Deck angle showing the black steel slat railing, top cap, bottom footing kicker, and wood deck.',
                    })
                  }
                  className="w-full h-64 object-contain bg-[#101012] cursor-zoom-in hover:opacity-95 transition-opacity"
                />
                <figcaption className="px-4 py-3 text-sm text-[#cfc9bf]">
                  <strong className="text-[#f2efe8]">Deck angle</strong> — metal
                  top cap and bottom footing kicker along the wood deck.
                </figcaption>
              </figure>

              <div className="h-64 sm:h-auto min-h-[256px] rounded-xl border-2 border-dashed border-[#2f2f35] bg-[#141416]/70 flex flex-col items-center justify-center p-5 text-center">
                <span className="font-display uppercase tracking-[0.14em] text-xs text-[#c9883d] mb-1">
                  Angle 3
                </span>
                <p className="text-sm text-[#a8a29a] m-0 max-w-[220px]">
                  More angles of this Beverly Hills railing coming soon.
                </p>
              </div>
            </div>

            <p className="text-sm text-[#cfc9bf] mt-3 mb-0">
              <strong className="text-[#f2efe8]">
                Beverly Hills House railing
              </strong>{' '}
              — black steel slat railings for a hillside house. More angles of
              this railing are coming.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {otherItems.map((item) => (
            <figure
              key={item.title}
              className="m-0 bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl overflow-hidden flex flex-col"
            >
              <ResilientImage
                src={item.src}
                alt={item.alt}
                onClick={() =>
                  onOpenLightbox({
                    src: item.src,
                    alt: item.alt,
                    caption: `${item.title} — ${item.description}`,
                  })
                }
                className={`w-full h-64 cursor-zoom-in hover:opacity-95 transition-opacity ${
                  item.fullShot
                    ? 'object-contain bg-[#101012]'
                    : 'object-cover'
                }`}
              />
              <figcaption className="px-4 py-3 text-[15px] text-[#cfc9bf]">
                <strong className="text-[#f2efe8]">{item.title}</strong> —{' '}
                {item.description}
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-6">
          <button
            type="button"
            onClick={() => onOpenHelper('Tell me about a piece in the gallery')}
            className="text-sm text-[#e8a317] underline underline-offset-4 hover:text-[#f2efe8] cursor-pointer bg-transparent border-0 p-0"
          >
            Wondering about a piece you see here? Ask the helper about it
          </button>
        </p>
      </div>
    </section>
  );
}
