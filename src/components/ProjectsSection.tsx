import {
  PROJECT_PHOTO_EXAMPLES,
  SIGNATURE_PROJECTS,
} from '../data/ironworksData';
import { LightboxImage } from './ImageLightbox';
import { ResilientImage } from './ResilientImage';

interface ProjectsSectionProps {
  onOpenLightbox: (img: LightboxImage) => void;
}

export function ProjectsSection({ onOpenLightbox }: ProjectsSectionProps) {
  return (
    <section id="work" data-forge-section="work" className="py-16 sm:py-20">
      <div className="max-w-[1160px] mx-auto px-5">
        <p className="font-display uppercase tracking-[0.22em] text-xs sm:text-sm text-[#c9883d] mb-2">
          Selected work
        </p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-[#f2efe8] mb-6">
          Signature Projects
          <span className="block w-16 h-[3px] bg-[#c9883d] mt-3" />
        </h2>

        <div className="divide-y divide-[#2a2a2e]">
          {SIGNATURE_PROJECTS.map((proj, idx) => {
            const reverseOnDesktop = idx % 2 === 1;
            const isGhosts = proj.id === 'ghosts-of-malibu';
            const isMonument = proj.id === 'monument-of-legacy';
            return (
              <article
                key={proj.id}
                className="py-9 first:pt-4 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
              >
                {isMonument ? (
                  <>
                    {/* 1. Title lettering FIRST */}
                    <div className="lg:col-span-2">
                      <p className="font-display uppercase tracking-[0.14em] text-xs sm:text-sm text-[#c9883d] mb-2">
                        {proj.meta}
                      </p>
                      <h3 className="text-2xl sm:text-3xl text-[#f2efe8] mb-0">
                        {proj.title}
                      </h3>
                    </div>

                    {/* 2. Two full overall photos directly BELOW the title */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      {proj.images.map((img, imgIdx) => (
                        <figure key={`${img.src}-${imgIdx}`} className="m-0">
                          <ResilientImage
                            src={img.src}
                            alt={img.alt}
                            onClick={() =>
                              onOpenLightbox({
                                src: img.src,
                                alt: img.alt,
                                caption:
                                  img.caption || `${proj.title} — ${img.alt}`,
                              })
                            }
                            className="w-full h-auto rounded-xl border border-[#2a2a2e] cursor-zoom-in bg-[#101012] object-contain"
                          />
                          {img.caption && (
                            <figcaption className="text-sm text-[#a8a29a] mt-2">
                              {img.caption}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>

                    {/* 3. Section wording / text BELOW both photos */}
                    <div className="lg:col-span-2">
                      {proj.paragraphs.map((p, pIdx) => (
                        <p key={pIdx} className="text-[#d5cfc5] mb-3">
                          {p}
                        </p>
                      ))}
                      {proj.extraHighlight && (
                        <p className="text-[#d5cfc5] mb-0">
                          <strong className="text-[#f2efe8]">
                            {proj.extraHighlight.label}
                          </strong>{' '}
                          — {proj.extraHighlight.text}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className={`${reverseOnDesktop ? 'lg:order-2' : ''} ${
                        proj.images.length > 1
                          ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                          : ''
                      }`}
                    >
                      {proj.images.map((img, imgIdx) => (
                        <figure key={`${img.src}-${imgIdx}`} className="m-0">
                          <ResilientImage
                            src={img.src}
                            alt={img.alt}
                            onClick={() =>
                              onOpenLightbox({
                                src: img.src,
                                alt: img.alt,
                                caption:
                                  img.caption || `${proj.title} — ${img.alt}`,
                              })
                            }
                            className={`w-full h-auto rounded-xl border border-[#2a2a2e] cursor-zoom-in ${
                              isGhosts
                                ? 'bg-[#161618] max-h-[460px] object-contain'
                                : 'object-cover'
                            }`}
                          />
                          {img.caption && (
                            <figcaption className="text-sm text-[#a8a29a] mt-2">
                              {img.caption}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>

                    <div>
                      <p className="font-display uppercase tracking-[0.14em] text-xs sm:text-sm text-[#c9883d] mb-2">
                        {proj.meta}
                      </p>
                      <h3 className="text-2xl sm:text-3xl text-[#f2efe8] mb-3">
                        {proj.title}
                      </h3>
                      {proj.paragraphs.map((p, pIdx) => (
                        <p key={pIdx} className="text-[#d5cfc5] mb-3">
                          {p}
                        </p>
                      ))}
                      {proj.extraHighlight && (
                        <p className="text-[#d5cfc5] mb-0">
                          <strong className="text-[#f2efe8]">
                            {proj.extraHighlight.label}
                          </strong>{' '}
                          — {proj.extraHighlight.text}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {proj.trio && (
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {proj.trio.map((item) => (
                      <figure
                        key={item.title}
                        className="m-0 bg-[#161618] border border-[#2a2a2e] rounded-xl p-2.5 flex flex-col"
                      >
                        <ResilientImage
                          src={item.src}
                          alt={item.alt}
                          onClick={() =>
                            onOpenLightbox({
                              src: item.src,
                              alt: item.alt,
                              caption: `${item.title} — ${item.subtitle}`,
                            })
                          }
                          className="w-full h-48 object-contain rounded-lg bg-[#101012] cursor-zoom-in"
                        />
                        <figcaption className="text-sm text-[#a8a29a] mt-2 px-1">
                          <strong className="text-[#f2efe8]">
                            {item.title}
                          </strong>{' '}
                          — {item.subtitle}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Project Photo Examples */}
        <div className="pt-10 mt-6 border-t border-[#2a2a2e]">
          <p className="font-display uppercase tracking-[0.18em] text-xs text-[#c9883d] mb-2">
            Photo examples
          </p>
          <h3 className="text-2xl text-[#f2efe8] mb-5">
            Gates, Railings, Architectural Ironwork &amp; Fencing
          </h3>

          {PROJECT_PHOTO_EXAMPLES.filter((ex) => ex.secondaryView).map((ex) => (
            <div
              key={ex.caption}
              className="mb-5 bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <h4 className="text-lg sm:text-xl text-[#f2efe8] m-0">
                  Wingfield Park Amphitheater Gates
                </h4>
                <span className="text-xs sm:text-sm text-[#c9883d]">
                  Installed outdoors &amp; in-shop fabrication views
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <figure className="m-0 bg-[#141416] border border-[#2a2a2e] rounded-xl overflow-hidden flex flex-col">
                  <ResilientImage
                    src={ex.src}
                    alt={ex.alt}
                    onClick={() =>
                      onOpenLightbox({
                        src: ex.src,
                        alt: ex.alt,
                        caption: ex.caption,
                      })
                    }
                    className="w-full h-72 object-contain bg-[#101012] cursor-zoom-in hover:opacity-95 transition-opacity"
                  />
                  <figcaption className="px-4 py-3 text-sm text-[#f2efe8] font-medium">
                    {ex.caption}
                  </figcaption>
                </figure>

                {ex.secondaryView && (
                  <figure className="m-0 bg-[#141416] border border-[#2a2a2e] rounded-xl overflow-hidden flex flex-col">
                    <ResilientImage
                      src={ex.secondaryView.src}
                      alt={ex.secondaryView.alt}
                      onClick={() =>
                        onOpenLightbox({
                          src: ex.secondaryView!.src,
                          alt: ex.secondaryView!.alt,
                          caption: ex.secondaryView!.caption,
                        })
                      }
                      className="w-full h-72 object-contain bg-[#101012] cursor-zoom-in hover:opacity-95 transition-opacity"
                    />
                    <figcaption className="px-4 py-3 text-sm text-[#f2efe8] font-medium">
                      {ex.secondaryView.caption}
                    </figcaption>
                  </figure>
                )}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PROJECT_PHOTO_EXAMPLES.filter((ex) => !ex.secondaryView).map(
              (ex) => (
                <figure
                  key={ex.caption}
                  className="m-0 bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl overflow-hidden flex flex-col"
                >
                  <ResilientImage
                    src={ex.src}
                    alt={ex.alt}
                    onClick={() =>
                      onOpenLightbox({
                        src: ex.src,
                        alt: ex.alt,
                        caption: ex.caption,
                      })
                    }
                    className="w-full h-60 object-contain bg-[#101012] cursor-zoom-in hover:opacity-95 transition-opacity"
                  />
                  <figcaption className="px-4 py-3 text-sm text-[#f2efe8] font-medium">
                    {ex.caption}
                  </figcaption>
                </figure>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
