import { ABOUT_CREDENTIALS, SITE_LINKS } from '../data/ironworksData';
import { LightboxImage } from './ImageLightbox';
import { ResilientImage } from './ResilientImage';

interface AboutSectionProps {
  onOpenLightbox: (img: LightboxImage) => void;
}

export function AboutSection({ onOpenLightbox }: AboutSectionProps) {
  return (
    <section id="about" data-forge-section="about" className="py-16 sm:py-20">
      <div className="max-w-[1160px] mx-auto px-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
          <div>
            <p className="font-display uppercase tracking-[0.22em] text-xs sm:text-sm text-[#c9883d] mb-2">
              About the artist
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#f2efe8] mb-5">
              25 years of welding experience and artistic expression
              <span className="block w-16 h-[3px] bg-[#c9883d] mt-3" />
            </h2>
            <p className="text-lg text-[#d8d2c8] max-w-[720px] mb-4">
              Ray Mroczkowski is a metal artist and custom fabricator, owner of
              Ray&rsquo;s Ironworks — a custom metal fabrication shop. His
              ironwork spans structural steel, architectural railings,
              hand-forged gates, monument signs, and sculptural pieces: work
              defined by precision, durability, and an artist&rsquo;s eye.
            </p>
            <p className="text-[#d8d2c8] mb-6">
              A traveling artist, always a work in progress, Ray works across
              the Reno, Tahoe, and Truckee region as well as the Los Angeles and
              Topanga Canyon area — with installed work reaching Seattle,
              Washington.
            </p>
            <blockquote className="my-6 py-5 border-y border-[#2a2a2e] italic text-[#ddd6c9] text-lg leading-relaxed">
              &ldquo;Forged-steel ribs rising like branches, lantern cores
              pierced with light patterns, forms that give shade by day and
              glow by night. He works in fire and water — the forge, and the way
              light moves. What he proposes is what gets built: no handoffs, no
              surprises.&rdquo;
            </blockquote>
            <ul className="space-y-2 mt-5 text-[#d8d2c8]">
              {ABOUT_CREDENTIALS.map((cred) => (
                <li key={cred} className="pl-5 relative">
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-[0.45em] text-[#c9883d] text-[0.7em]"
                  >
                    ◆
                  </span>
                  {cred}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[#d8d2c8]">
              Find Ray on{' '}
              <a
                href={SITE_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e8a317] underline underline-offset-4 hover:text-[#f2efe8]"
              >
                LinkedIn — Ray Mroczkowski
              </a>
              : &ldquo;Custom Metal Artist &amp; Fabricator | Owner, Ray&rsquo;s
              Ironworks | AI Coder &amp; Computer Scientist building apps and
              TABs energy-block homes.&rdquo;
            </p>
          </div>

          <div>
            <figure>
              <ResilientImage
                src="/images/on-the-job.jpg"
                alt="Ray welding on the job"
                onClick={() =>
                  onOpenLightbox({
                    src: '/images/on-the-job.jpg',
                    alt: 'Ray welding on the job',
                    caption: 'On the job — the work, done by hand.',
                  })
                }
                className="w-full rounded-xl border border-[#2a2a2e] cursor-zoom-in"
              />
              <figcaption className="text-sm text-[#a8a29a] mt-2">
                On the job — the work, done by hand.
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
