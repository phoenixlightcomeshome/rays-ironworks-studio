import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import {
  FORGE_KB,
  FORGE_SECTIONS,
  SITE_LINKS,
  SectionKey,
} from '../data/ironworksData';
import { QuoteFormState } from './QuoteForm';

interface ForgeMessage {
  id: number;
  who: 'bot' | 'user';
  content: ReactNode;
}

interface QuoteFlowState {
  step: number;
  data: {
    type?: string;
    size?: string;
    location?: string;
    timeline?: string;
    desc?: string;
  };
}

interface ForgeGuideProps {
  open: boolean;
  prefillQuestion: string | null;
  onClearPrefill: () => void;
  onToggleOpen: (open: boolean) => void;
  quoteForm: QuoteFormState;
  onFillQuoteFromGuide: (
    updater: (prev: QuoteFormState) => QuoteFormState,
  ) => void;
}

function renderWithContactLinks(text: string): ReactNode {
  const parts = text.split(/(raysironworks101@gmail\.com|424-394-9271)/g);
  return parts.map((part, idx) => {
    if (part === SITE_LINKS.email) {
      return (
        <a
          key={idx}
          href={SITE_LINKS.emailHref}
          className="text-[#e8a317] underline underline-offset-2"
        >
          {part}
        </a>
      );
    }
    if (part === SITE_LINKS.phoneDisplay) {
      return (
        <a
          key={idx}
          href={SITE_LINKS.phoneHref}
          className="text-[#e8a317] underline underline-offset-2"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function ForgeGuide({
  open,
  prefillQuestion,
  onClearPrefill,
  onToggleOpen,
  quoteForm,
  onFillQuoteFromGuide,
}: ForgeGuideProps) {
  const [currentSection, setCurrentSection] = useState<SectionKey>('hero');
  const [messages, setMessages] = useState<ForgeMessage[]>([]);
  const [input, setInput] = useState('');
  const [quoteFlow, setQuoteFlow] = useState<QuoteFlowState | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const nextIdRef = useRef(1);

  // Observe sections on the page for contextual greetings and chips
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const targets = document.querySelectorAll<HTMLElement>(
      '[data-forge-section]',
    );
    if (!targets.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const sec = entry.target.getAttribute(
            'data-forge-section',
          ) as SectionKey | null;
          if (sec && FORGE_SECTIONS[sec]) {
            setCurrentSection(sec);
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px' },
    );

    targets.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Scroll chat log to bottom on new message
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Initialize greeting when first opened
  useEffect(() => {
    if (!open) return;
    if (messages.length === 0) {
      setMessages([
        {
          id: nextIdRef.current++,
          who: 'bot',
          content: FORGE_SECTIONS[currentSection].greeting,
        },
      ]);
    }
    inputRef.current?.focus();
  }, [open, currentSection, messages.length]);

  const buildChecklistNode = (): ReactNode => {
    const steps = [
      {
        n: 1,
        label: 'Choose a project type',
        done: Boolean(quoteForm.type.trim()),
        optional: false,
        hint: 'Pick one in the quote form — or set it from the 3D studio.',
      },
      {
        n: 2,
        label: 'Set your dimensions',
        done: Boolean(quoteForm.size.trim()),
        optional: false,
        hint: 'Use the 3D studio sliders, then “Use this in my quote” — it fills this in for you.',
      },
      {
        n: 3,
        label: 'Upload photos of your idea (optional)',
        done: quoteForm.photos.length > 0,
        optional: true,
        hint: 'Up to 8 photos in the quote form. They stay on your device until you attach them to the email.',
      },
      {
        n: 4,
        label: 'Add your notes',
        done: Boolean(quoteForm.desc.trim()),
        optional: false,
        hint: 'A sentence or two about what it should look like and where it will live.',
      },
      {
        n: 5,
        label: 'Send the email to Ray',
        done: false,
        optional: false,
        hint: 'Use “Prepare Email to Ray” in the quote form — your email app opens with everything filled in, and you attach your photos before sending.',
      },
    ];
    const doneCount = steps.filter((s) => s.done).length;

    return (
      <div className="space-y-2">
        <p className="m-0">
          <strong>Your quote checklist</strong> — {doneCount} of 5 steps done.
        </p>
        {steps.map((s) => (
          <div key={s.n} className="text-sm">
            <div>
              {s.done ? '✓' : '○'}{' '}
              <strong>
                Step {s.n} — {s.label}
              </strong>
              {s.optional && <em> (optional)</em>}
            </div>
            {!s.done && <div className="opacity-85">{s.hint}</div>}
          </div>
        ))}
        <p className="m-0 pt-1">
          Want me to walk you through it, one question at a time? Say
          &ldquo;start the quote flow&rdquo; — or tap below.
        </p>
      </div>
    );
  };

  const resolveAnswer = (q: string): ReactNode => {
    const s = q.toLowerCase();

    if (/checklist/.test(s)) {
      return buildChecklistNode();
    }

    if (
      /start the quote flow|walk me through|help me (request|get|draft).*quote|start a quote/.test(
        s,
      ) ||
      s.includes('help me request a quote')
    ) {
      setQuoteFlow({ step: 0, data: {} });
      return 'Happy to help you draft a quote request. First — what kind of project is it? Tap one below, or type your own.';
    }

    if (quoteFlow) {
      const f = quoteFlow;
      if (f.step === 0) {
        setQuoteFlow({ step: 1, data: { ...f.data, type: q } });
        return `Got it — a ${q}. About how big? (For example: 10 ft wide × 6 ft high — or just say “not sure yet”. Tip: the 3D studio can measure it for you.)`;
      }
      if (f.step === 1) {
        setQuoteFlow({ step: 2, data: { ...f.data, size: q } });
        return 'And where will it go? (City or neighborhood — for example: Truckee, CA.)';
      }
      if (f.step === 2) {
        setQuoteFlow({ step: 3, data: { ...f.data, location: q } });
        return 'When would you like it? (For example: flexible, within a month, or 1–3 months.)';
      }
      if (f.step === 3) {
        setQuoteFlow({ step: 4, data: { ...f.data, timeline: q } });
        return 'Last one — in a sentence or two, what should it look like or do? (Style, finish, or a feeling — anything helps.)';
      }
      if (f.step === 4) {
        const finalData = { ...f.data, desc: q };
        setQuoteFlow(null);

        const known = [
          'Custom Gate',
          'Railing',
          'Sculpture',
          'Monument Sign',
          'Patio Cover',
        ];
        const matchedType =
          known.find((k) =>
            (finalData.type || '')
              .toLowerCase()
              .includes(k.toLowerCase().split(' ')[0]),
          ) || '';

        const tlLower = (finalData.timeline || '').toLowerCase();
        let timelineVal = 'Flexible';
        if (tlLower.includes('month') && tlLower.includes('1')) {
          timelineVal = 'Within 1 month';
        } else if (tlLower.includes('1') && tlLower.includes('3')) {
          timelineVal = '1–3 months';
        } else if (tlLower.includes('3')) {
          timelineVal = '3+ months';
        }

        onFillQuoteFromGuide((prev) => ({
          ...prev,
          type: matchedType || prev.type,
          size: finalData.size || prev.size,
          location: finalData.location || prev.location,
          timeline: timelineVal,
          desc: finalData.desc || prev.desc,
        }));

        setTimeout(() => {
          document
            .getElementById('quote-form')
            ?.scrollIntoView({ behavior: 'smooth' });
        }, 500);

        return (
          <div className="space-y-1.5">
            <p className="m-0">
              Here&rsquo;s your draft — I&rsquo;ve filled it into the quote form
              below so you can review it, add your name and email, and attach
              photos:
            </p>
            <p className="m-0 text-sm">
              <strong>Type:</strong> {finalData.type}
              <br />
              <strong>Size:</strong> {finalData.size}
              <br />
              <strong>Location:</strong> {finalData.location}
              <br />
              <strong>Timeline:</strong> {finalData.timeline}
              <br />
              <strong>Idea:</strong> {finalData.desc}
            </p>
            <p className="m-0">
              Scroll down to the quote form to finish and send it to Ray. Or ask
              me for the checklist to see what&rsquo;s left.
            </p>
          </div>
        );
      }
    }

    for (const entry of FORGE_KB) {
      if (entry.k.some((kw) => s.includes(kw))) {
        return renderWithContactLinks(entry.a);
      }
    }

    return renderWithContactLinks(
      "I can help with Ray's work, services, process, the 3D studio, and preparing a quote request — but I don't have an answer for that one. The fastest route is Ray himself: raysironworks101@gmail.com or 424-394-9271. Or try one of the suggestions below.",
    );
  };

  const ask = (q: string) => {
    const userMsg: ForgeMessage = {
      id: nextIdRef.current++,
      who: 'user',
      content: q,
    };
    setMessages((prev) => [...prev, userMsg]);
    const reply = resolveAnswer(q);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: nextIdRef.current++, who: 'bot', content: reply },
      ]);
    }, 220);
  };

  // Trigger prefilled question from page links
  useEffect(() => {
    if (open && prefillQuestion) {
      const timer = window.setTimeout(() => {
        ask(prefillQuestion);
        onClearPrefill();
      }, 200);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillQuestion]);

  const activeChips = quoteFlow
    ? quoteFlow.step === 0
      ? [
          'Gate',
          'Railing',
          'Sculpture',
          'Monument sign',
          'Patio cover',
          'Something else',
        ]
      : []
    : FORGE_SECTIONS[currentSection].chips;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');
    ask(trimmed);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => onToggleOpen(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="helper-panel"
        className="fixed right-4 bottom-4 z-50 inline-flex items-center gap-2 bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] rounded-full px-4 py-2.5 font-display uppercase tracking-[0.05em] font-bold text-sm shadow-xl cursor-pointer transition-colors"
      >
        <MessageSquare className="w-4 h-4" aria-hidden="true" />
        Ask the Helper
      </button>

      {open && (
        <div
          id="helper-panel"
          role="dialog"
          aria-label="Ironworks helper"
          className="fixed right-4 bottom-16 z-50 w-[min(390px,calc(100vw-32px))] max-h-[min(560px,calc(100vh-104px))] flex flex-col bg-[#17171a] border border-[#2a2a2e] rounded-xl overflow-hidden shadow-2xl"
        >
          <div className="bg-[#1e1e21] border-b border-[#2a2a2e] px-4 py-3 flex items-center justify-between gap-2">
            <div>
              <strong className="font-display uppercase tracking-[0.06em] text-[#f2efe8] block">
                Ironworks Helper
              </strong>
              <span className="block text-xs text-[#a8a29a]">
                Ray&rsquo;s Ironworks — Viewing:{' '}
                {FORGE_SECTIONS[currentSection].label}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onToggleOpen(false)}
              aria-label="Close helper"
              className="p-1.5 rounded-md text-[#a8a29a] hover:text-[#f2efe8] hover:bg-[#2a2a2e] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            ref={logRef}
            aria-live="polite"
            className="p-3.5 overflow-y-auto flex flex-col gap-2.5 flex-1"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[88%] px-3.5 py-2.5 rounded-xl text-[15px] leading-snug ${
                  m.who === 'user'
                    ? 'bg-[#c9883d] text-[#141210] self-end rounded-br-sm'
                    : 'bg-[#232327] text-[#eee8db] self-start rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3.5 pb-2.5">
              {activeChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => ask(chip)}
                  className="bg-[#232327] border border-[#2a2a2e] hover:border-[#c9883d] hover:text-[#e8a317] text-[#e8e2d6] rounded-full px-3 py-1.5 text-xs cursor-pointer transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 px-3.5 py-2.5 border-t border-[#2a2a2e]"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Ray's work…"
              autoComplete="off"
              aria-label="Ask the helper a question"
              className="flex-1 px-3 py-2 rounded-lg bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] text-sm focus:outline-2 focus:outline-[#c9883d]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-display uppercase tracking-[0.04em] font-bold text-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              Send
            </button>
          </form>

          <div className="px-3.5 py-2 border-t border-[#2a2a2e] text-[11px] leading-snug text-[#a8a29a]">
            This helper answers from Ray&rsquo;s published work and process — it
            is a guided assistant, not a live AI. A live AI assistant would need
            a connected AI service, which is not set up on this site. For
            anything it can&rsquo;t answer, it will point you to Ray himself.
          </div>
        </div>
      )}
    </>
  );
}
