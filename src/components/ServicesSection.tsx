import { SERVICES } from '../data/ironworksData';

interface ServicesSectionProps {
  onOpenHelper: (question: string) => void;
}

export function ServicesSection({ onOpenHelper }: ServicesSectionProps) {
  return (
    <section
      id="services"
      data-forge-section="services"
      className="py-16 sm:py-20 bg-[#161618]"
    >
      <div className="max-w-[1160px] mx-auto px-5">
        <p className="font-display uppercase tracking-[0.22em] text-xs sm:text-sm text-[#c9883d] mb-2">
          What we build
        </p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-[#f2efe8] mb-4">
          Services
          <span className="block w-16 h-[3px] bg-[#c9883d] mt-3" />
        </h2>
        <p className="text-lg text-[#d8d2c8] max-w-[720px] mb-8">
          Every piece is designed, fabricated, and installed by Ray&rsquo;s
          Ironworks — from the first sketch to the finished work on site.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((svc) => (
            <div
              key={svc.title}
              className="bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl p-6"
            >
              <h3 className="text-xl text-[#e8a317] mb-2">{svc.title}</h3>
              <p className="text-[#cfc9bf] m-0">{svc.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-7 text-[#a8a29a]">
          Every commission is priced to the job.{' '}
          <a
            href="#contact"
            className="text-[#e8a317] underline underline-offset-4 hover:text-[#f2efe8]"
          >
            Contact Ray for a quote
          </a>{' '}
          — tell him what you&rsquo;re dreaming up.{' '}
          <button
            type="button"
            onClick={() => onOpenHelper('Which service fits my project?')}
            className="text-[#e8a317] underline underline-offset-4 hover:text-[#f2efe8] cursor-pointer bg-transparent border-0 p-0 font-inherit"
          >
            Not sure which service fits? Ask the helper
          </button>
        </p>
      </div>
    </section>
  );
}
