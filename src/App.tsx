import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Box } from 'lucide-react';
import { AboutSection } from './components/AboutSection';
import { ContactFooter } from './components/ContactFooter';
import {
  DesignStudio3D,
  StudioTab,
  UploadedPhoto3D,
} from './components/DesignStudio3D';
import { DigitalArtSection } from './components/DigitalArtSection';
import { ForgeGuide } from './components/ForgeGuide';
import { GallerySection } from './components/GallerySection';
import { AppPage, Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ImageLightbox, LightboxImage } from './components/ImageLightbox';
import { ProjectsSection } from './components/ProjectsSection';
import { QuoteForm, QuoteFormState } from './components/QuoteForm';
import { ServicesSection } from './components/ServicesSection';
import { TechnicalDrawings } from './components/TechnicalDrawings';
import { DrawingTabSpec } from './data/ironworksData';
import { ConfiguratorState, INITIAL_CONFIG, PieceType } from './types/configurator';
import { CutShareFormat, decodeCutShareHash } from './utils/cutShare';

const PIECE_TO_DRAWING_TAB: Record<PieceType, DrawingTabSpec['id']> = {
  gate: 'gate',
  railing: 'railing',
  'sculpture-base': 'sculpture',
  'sign-frame': 'sign',
  'patio-cover': 'patio',
};

function isCutShareHash(hash: string): boolean {
  return Boolean(hash && (hash.startsWith('#cut-') || hash.includes('#cut=')));
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(() => {
    if (typeof window !== 'undefined' && isCutShareHash(window.location.hash)) {
      return 'design-studio';
    }
    return 'home';
  });
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(
    null,
  );
  const [helperOpen, setHelperOpen] = useState(false);
  const [helperPrefill, setHelperPrefill] = useState<string | null>(null);
  const [drawingTab, setDrawingTab] = useState<DrawingTabSpec['id']>('gate');
  const [initialCutShare, setInitialCutShare] = useState<{
    format: CutShareFormat;
    config: ConfiguratorState;
  } | null>(null);
  const [studioConfig, setStudioConfig] = useState<ConfiguratorState>(
    () => INITIAL_CONFIG,
  );
  const [studioTab, setStudioTab] = useState<StudioTab>('3d');
  const [uploadedPhoto, setUploadedPhoto] = useState<UploadedPhoto3D | null>(
    null,
  );

  useEffect(() => {
    const checkHash = async () => {
      const hash = window.location.hash;
      if (isCutShareHash(hash)) {
        setCurrentPage('design-studio');
        if (hash.includes('#cut=')) {
          const decoded = await decodeCutShareHash(hash);
          if (decoded) {
            setInitialCutShare(decoded);
            setStudioConfig(decoded.config);
            setDrawingTab(PIECE_TO_DRAWING_TAB[decoded.config.piece]);
          }
        }
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    };
    void checkHash();
    const onHash = () => void checkHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const [quoteForm, setQuoteForm] = useState<QuoteFormState>({
    name: '',
    email: '',
    phone: '',
    type: '',
    size: '',
    location: '',
    timeline: 'Flexible',
    budget: 'Prefer not to say',
    desc: '',
    photos: [],
  });
  const [quoteStatus, setQuoteStatus] = useState<{
    text: string;
    kind: '' | 'ok' | 'warn';
  }>({ text: '', kind: '' });

  const openHelperWithQuestion = (q: string) => {
    setHelperPrefill(q);
    setHelperOpen(true);
  };

  const navigateTo = (page: AppPage, sectionId?: string) => {
    setCurrentPage(page);
    requestAnimationFrame(() => {
      if (page === 'design-studio') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (sectionId && sectionId !== 'top') {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  const scrollToQuoteForm = () => {
    document
      .getElementById('quote-form')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartQuoteFromTab = (quoteType: string) => {
    setQuoteForm((prev) => ({ ...prev, type: quoteType }));
    setQuoteStatus({
      text: `Project type set to “${quoteType}”. Fill in the rest below.`,
      kind: 'ok',
    });
    scrollToQuoteForm();
  };

  const handleUseStudioInQuote = ({
    quoteType,
    size,
    descriptionLine,
  }: {
    quoteType: string;
    size: string;
    descriptionLine: string;
  }) => {
    setQuoteForm((prev) => ({
      ...prev,
      type: quoteType,
      size,
      desc: prev.desc
        ? `${prev.desc.replace(/\s+$/, '')}\n${descriptionLine}`
        : descriptionLine,
    }));
    setQuoteStatus({
      text: `Your configured piece was added to the quote: ${descriptionLine} Fill in your name, email, and any photos below.`,
      kind: 'ok',
    });
    navigateTo('home', 'quote-form');
  };

  return (
    <div id="top" className="min-h-screen bg-[#0e0e10] text-[#f2efe8]">
      <Header currentPage={currentPage} onNavigate={navigateTo} />

      {currentPage === 'design-studio' ? (
        <main>
          <section
            id="design-studio-page"
            data-forge-section="design-studio"
            className="py-8 sm:py-12"
          >
            <div className="max-w-[1160px] mx-auto px-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#2a2a2e] bg-[#141416] hover:border-[#c9883d] text-sm font-semibold text-[#f2efe8] hover:text-[#e8a317] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  Back to home
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('home', 'quote-form')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#c9883d]/60 bg-[#1c1a16] hover:border-[#e8a317] text-xs sm:text-sm font-semibold text-[#e8a317] transition-colors cursor-pointer"
                >
                  Go to Quote Form
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <p className="font-display uppercase tracking-[0.22em] text-xs sm:text-sm text-[#c9883d] mb-2">
                Ray&rsquo;s Ironworks · Dedicated Workspace
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-[#f2efe8] mb-3">
                3D Design Studio, Blueprints &amp; Material Cut List
                <span className="block w-16 h-[3px] bg-[#c9883d] mt-3" />
              </h1>
              <p className="text-base sm:text-lg text-[#d8d2c8] max-w-[800px] mb-5">
                Configure your gate, railing, sculpture base, sign frame, or
                patio cover frame with live 3D rendering, structural profiles,
                King Architectural &amp; IMS hardware, 2D/Isometric blueprints,
                exploded material cut list schematics, and DXF/STL/PDF exports.
              </p>

              <DesignStudio3D
                initialCutShare={initialCutShare}
                config={studioConfig}
                onConfigChange={setStudioConfig}
                activeStudioTab={studioTab}
                onStudioTabChange={setStudioTab}
                uploadedPhoto={uploadedPhoto}
                onUploadedPhotoChange={setUploadedPhoto}
                onUseInQuote={handleUseStudioInQuote}
                onSelectPieceForGuide={(piece) =>
                  setDrawingTab(PIECE_TO_DRAWING_TAB[piece])
                }
              />
            </div>
          </section>

          <ContactFooter
            onOpenHelper={openHelperWithQuestion}
            onOpenLightbox={setLightboxImage}
          />
        </main>
      ) : (
        <main>
          <HeroSection
            onOpenDesignStudio={() => navigateTo('design-studio')}
          />
          <AboutSection onOpenLightbox={setLightboxImage} />
          <ServicesSection onOpenHelper={openHelperWithQuestion} />
          <ProjectsSection onOpenLightbox={setLightboxImage} />
          <GallerySection
            onOpenLightbox={setLightboxImage}
            onOpenHelper={openHelperWithQuestion}
          />

          <section
            id="quote"
            data-forge-section="quote"
            className="py-16 sm:py-20"
          >
            <div className="max-w-[1160px] mx-auto px-5">
              <p className="font-display uppercase tracking-[0.22em] text-xs sm:text-sm text-[#c9883d] mb-2">
                Design &amp; quote
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#f2efe8] mb-4">
                Plan Your Project — 3D &amp; Technical Drawings
                <span className="block w-16 h-[3px] bg-[#c9883d] mt-3" />
              </h2>
              <p className="text-lg text-[#d8d2c8] max-w-[760px] mb-5">
                Configure your piece in the 3D Design Studio, switch to the 2D
                blueprint, explore how each project type is drawn and measured,
                upload photos of your own ideas, and send Ray a quote request.
                Every commission is priced to the job — this page helps you
                describe yours clearly so the quote comes back fast.
              </p>

              <p className="bg-[#1a1409] border border-[#4a3a18] rounded-xl p-4 sm:px-5 text-[#e6d9b8] text-[15px]">
                <strong className="text-[#e8a317]">
                  How this page works — plainly:
                </strong>{' '}
                this website has no server. The drawings and the 3D viewer run
                entirely in your browser, and your photos stay on your device —
                they are never uploaded anywhere. When you send a quote request,
                your email app opens with everything written out; you attach your
                photos to that email before sending. If email doesn&rsquo;t
                open, you can download or copy the request instead.
              </p>

              {/* Dedicated Design Studio Link Card */}
              <div className="mt-7 bg-[#1c1c1f] border border-[#c9883d]/60 rounded-xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <p className="font-display uppercase tracking-[0.22em] text-xs sm:text-sm text-[#c9883d] m-0 flex items-center gap-2">
                    <Box className="w-4 h-4" aria-hidden="true" />
                    Interactive 3D Configurator &amp; Shop Prints
                  </p>
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#f2efe8] m-0">
                    Open the 3D Design Studio
                  </h3>
                  <p className="text-sm sm:text-base text-[#cfc9bf] m-0">
                    Launch the full-page workspace to customize dimensions,
                    posts, King Architectural caps, scrollwork, Coast/PDM/King
                    infill patterns, forged leaves, sign lettering, 2D &amp;
                    isometric blueprints, and the itemized Material Cut List
                    schematic — then send your configured piece directly into
                    the quote form below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('design-studio')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-bold text-base transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Open the Design Studio
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <TechnicalDrawings
                activeTab={drawingTab}
                onChangeTab={setDrawingTab}
                onStartQuote={handleStartQuoteFromTab}
              />

              <QuoteForm
                form={quoteForm}
                status={quoteStatus}
                onChange={setQuoteForm}
                onStatus={(text, kind) => setQuoteStatus({ text, kind })}
              />

              <p className="mt-5">
                <button
                  type="button"
                  onClick={() =>
                    openHelperWithQuestion(
                      'Help me describe my idea for a quote',
                    )
                  }
                  className="text-sm text-[#e8a317] underline underline-offset-4 hover:text-[#f2efe8] cursor-pointer bg-transparent border-0 p-0"
                >
                  Not sure how to describe your idea? The helper can walk you
                  through it
                </button>
              </p>
            </div>
          </section>

          <DigitalArtSection />
          <ContactFooter
            onOpenHelper={openHelperWithQuestion}
            onOpenLightbox={setLightboxImage}
          />
        </main>
      )}

      <ForgeGuide
        open={helperOpen}
        prefillQuestion={helperPrefill}
        onClearPrefill={() => setHelperPrefill(null)}
        onToggleOpen={setHelperOpen}
        quoteForm={quoteForm}
        onFillQuoteFromGuide={setQuoteForm}
      />

      <ImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
