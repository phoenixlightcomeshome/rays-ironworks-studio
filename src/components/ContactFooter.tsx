import { SITE_LINKS } from '../data/ironworksData';
import { LightboxImage } from './ImageLightbox';
import { ResilientImage } from './ResilientImage';

interface ContactFooterProps {
  onOpenHelper: (question: string) => void;
  onOpenLightbox: (img: LightboxImage) => void;
}

export function ContactFooter({
  onOpenHelper,
  onOpenLightbox,
}: ContactFooterProps) {
  return (
    <>
      <section
        id="contact"
        data-forge-section="contact"
        className="py-16 sm:py-20 bg-gradient-to-b from-[#141416] to-[#0e0e10]"
      >
        <div className="max-w-[1160px] mx-auto px-5">
          <p className="font-display uppercase tracking-[0.22em] text-xs sm:text-sm text-[#c9883d] mb-2">
            Commissions welcome
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#f2efe8] mb-4">
            Start a Project
            <span className="block w-16 h-[3px] bg-[#c9883d] mt-3" />
          </h2>
          <p className="text-lg text-[#d8d2c8] max-w-[720px] mb-8">
            Custom ironwork, gates, railings, and sculpture — tell Ray what
            you&rsquo;re dreaming up, and he&rsquo;ll tell you what it takes to
            build it.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl p-6 sm:p-7">
              <div className="font-display uppercase tracking-[0.14em] text-xs text-[#a8a29a]">
                Call or text
              </div>
              <a
                href={SITE_LINKS.phoneHref}
                className="block text-xl sm:text-2xl font-bold text-[#f2efe8] hover:text-[#e8a317] mt-1 mb-4 no-underline tabular-nums"
              >
                {SITE_LINKS.phoneDisplay}
              </a>

              <div className="font-display uppercase tracking-[0.14em] text-xs text-[#a8a29a]">
                Email
              </div>
              <a
                href={SITE_LINKS.emailHref}
                className="block text-xl sm:text-2xl font-bold text-[#f2efe8] hover:text-[#e8a317] mt-1 mb-4 no-underline break-all"
              >
                {SITE_LINKS.email}
              </a>

              <p className="text-[#a8a29a] m-0">
                Serving Reno / Tahoe / Truckee and Los Angeles — Venice Beach,
                Beverly Hills, Topanga Canyon.
              </p>
            </div>

            <div className="bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl p-6 sm:p-7">
              <h3 className="text-xl text-[#e8a317] mb-3">Follow the work</h3>
              <p className="text-[#d5cfc5] mb-3">
                <a
                  href={SITE_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#e8a317] underline underline-offset-4 hover:text-[#f2efe8]"
                >
                  Ray&rsquo;s Ironworks on Facebook
                </a>{' '}
                — shop photos, finished pieces, and work in progress.
              </p>
              <p className="text-[#d5cfc5] mb-3">
                <a
                  href={SITE_LINKS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#e8a317] underline underline-offset-4 hover:text-[#f2efe8]"
                >
                  Ray Mroczkowski on LinkedIn
                </a>{' '}
                — Custom Metal Artist &amp; Fabricator | Owner, Ray&rsquo;s
                Ironworks | AI Coder &amp; Computer Scientist building apps and
                TABs energy-block homes.
              </p>
              <p className="text-[#d5cfc5] mb-3">
                <a
                  href={SITE_LINKS.portfolioPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#e8a317] underline underline-offset-4 hover:text-[#f2efe8]"
                >
                  Full artist portfolio (PDF)
                </a>{' '}
                — selected works in ironwork &amp; digital art, 2026.
              </p>
              <p className="text-[#a8a29a] m-0">
                References available on request.{' '}
                <button
                  type="button"
                  onClick={() => onOpenHelper('How do I contact Ray?')}
                  className="text-[#e8a317] underline underline-offset-4 hover:text-[#f2efe8] cursor-pointer bg-transparent border-0 p-0"
                >
                  Questions? Ask the helper
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-[#2a2a2e] bg-[#0e0e10]">
        <div className="max-w-[720px] mx-auto px-5">
          <figure className="m-0">
            <div className="overflow-hidden rounded-xl border border-[#2a2a2e] bg-[#141416]">
              <ResilientImage
                src="/images/childhood-welding-shop.jpg"
                alt="Ray as a boy in the welding shop"
                onClick={() =>
                  onOpenLightbox({
                    src: '/images/childhood-welding-shop.jpg',
                    alt: 'Ray as a boy in the welding shop',
                    caption:
                      'Where it started — Ray in the welding shop as a boy.',
                  })
                }
                className="w-full aspect-[16/10] object-cover object-center cursor-zoom-in hover:opacity-95 transition-opacity"
              />
            </div>
            <figcaption className="text-sm text-[#a8a29a] mt-3 text-center">
              <div>Where it started — Ray in the welding shop as a boy.</div>
              <div className="mt-1.5 font-medium text-[#e8a317]">
                Contributions by Skis Welding and Fabrication
              </div>
            </figcaption>
          </figure>
        </div>
      </section>

      <footer className="border-t border-[#2a2a2e] py-8 text-sm text-[#a8a29a]">
        <div className="max-w-[1160px] mx-auto px-5 flex flex-wrap justify-between items-start gap-4">
          <span>
            <strong className="text-[#f2efe8]">Ray&rsquo;s Ironworks</strong>{' '}
            &middot; Ray Mroczkowski &middot; Reno / Tahoe / Truckee &middot;
            Los Angeles &middot;{' '}
            <a
              href={SITE_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e8a317] underline underline-offset-4 hover:text-[#f2efe8]"
            >
              LinkedIn
            </a>
          </span>
          <div className="flex flex-col sm:items-end gap-1">
            <span>
              &copy; 2026 Ray Mroczkowski. All work shown is the artist&rsquo;s
              own.
            </span>
            <span>designed and implemented by Phoenix the great muse</span>
          </div>
        </div>
      </footer>
    </>
  );
}
