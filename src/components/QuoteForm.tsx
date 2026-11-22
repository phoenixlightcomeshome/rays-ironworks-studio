import { ChangeEvent, DragEvent, useState } from 'react';
import { Copy, Download, FileText, Mail, Trash2, Upload } from 'lucide-react';
import { SITE_LINKS } from '../data/ironworksData';

export interface LocalPhoto {
  name: string;
  size: number;
  previewUrl: string;
  mimeType: string;
  isImage: boolean;
}

export interface QuoteFormState {
  name: string;
  email: string;
  phone: string;
  type: string;
  size: string;
  location: string;
  timeline: string;
  budget: string;
  desc: string;
  photos: LocalPhoto[];
}

interface QuoteFormProps {
  form: QuoteFormState;
  status: { text: string; kind: '' | 'ok' | 'warn' };
  onChange: (updater: (prev: QuoteFormState) => QuoteFormState) => void;
  onStatus: (text: string, kind: '' | 'ok' | 'warn') => void;
}

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|bmp|tiff?|svg|heic|avif)$/i;

export function QuoteForm({
  form,
  status,
  onChange,
  onStatus,
}: QuoteFormProps) {
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    let count = form.photos.length;
    Array.from(files).forEach((file) => {
      if (count >= 8) {
        onStatus(
          'Up to 8 files, please — remove one to add another.',
          'warn',
        );
        return;
      }
      count += 1;
      const isImage =
        (Boolean(file.type) && file.type.startsWith('image/')) ||
        IMAGE_EXT_RE.test(file.name);

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const previewUrl = String(ev.target?.result || '');
          onChange((prev) => {
            if (prev.photos.length >= 8) return prev;
            return {
              ...prev,
              photos: [
                ...prev.photos,
                {
                  name: file.name,
                  size: file.size,
                  previewUrl,
                  mimeType: file.type || 'application/octet-stream',
                  isImage: true,
                },
              ],
            };
          });
        };
        reader.readAsDataURL(file);
      } else {
        const objectUrl = URL.createObjectURL(file);
        onChange((prev) => {
          if (prev.photos.length >= 8) return prev;
          return {
            ...prev,
            photos: [
              ...prev.photos,
              {
                name: file.name,
                size: file.size,
                previewUrl: objectUrl,
                mimeType: file.type || 'application/octet-stream',
                isImage: false,
              },
            ],
          };
        });
      }
    });
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  };

  const formatQuoteText = () => {
    const lines = [
      "Quote request — Ray's Ironworks (from rays-ironworks website)",
      '',
      `Name: ${form.name.trim() || '(not given)'}`,
      `Email: ${form.email.trim() || '(not given)'}`,
      `Phone: ${form.phone.trim() || '(not given)'}`,
      `Project type: ${form.type || '(not chosen)'}`,
      `Approximate size: ${form.size.trim() || '(not given)'}`,
      `Location: ${form.location.trim() || '(not given)'}`,
      `Timeline: ${form.timeline}`,
      `Budget range: ${form.budget}`,
      '',
      'Description:',
      form.desc.trim() || '(not given)',
      '',
      `Photos & reference files attached to this email by the visitor (${form.photos.length}):`,
    ];
    form.photos.forEach((p) => {
      lines.push(
        ` - ${p.name} (${Math.round(p.size / 1024)} KB${p.isImage ? '' : ', stored as a reference — needs conversion to use in the model'})`,
      );
    });
    if (!form.photos.length) {
      lines.push(' (none — no files were attached)');
    }
    lines.push(
      '',
      "— Sent from the Ray's Ironworks website quote form. Files are attached to this email by the visitor; the website does not store them.",
    );
    return lines.join('\n');
  };

  const validateQuote = (): boolean => {
    if (!form.name.trim()) {
      onStatus('Please add your name first.', 'warn');
      document.getElementById('q-name')?.focus();
      return false;
    }
    if (!form.email.trim() || form.email.indexOf('@') < 1) {
      onStatus('Please add a valid email so Ray can reply.', 'warn');
      document.getElementById('q-email')?.focus();
      return false;
    }
    if (!form.type) {
      onStatus('Please choose a project type.', 'warn');
      document.getElementById('q-type')?.focus();
      return false;
    }
    if (!form.desc.trim()) {
      onStatus(
        'Please describe your idea — even a sentence or two helps.',
        'warn',
      );
      document.getElementById('q-desc')?.focus();
      return false;
    }
    return true;
  };

  const handlePrepareEmail = () => {
    if (!validateQuote()) return;
    const subject = `Quote request — ${form.type} — ${form.name.trim()}`;
    const body = formatQuoteText();
    const url = `mailto:${SITE_LINKS.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    if (url.length > 1800) {
      onStatus(
        `Your request is long for an email link — use “Download Quote Summary” instead, then send that file to ${SITE_LINKS.email}.`,
        'warn',
      );
      return;
    }
    window.location.href = url;
    onStatus(
      form.photos.length
        ? `Your email app should have opened with the request filled in. Remember to attach your ${form.photos.length} file(s) to the email before sending.`
        : 'Your email app should have opened with the request filled in. Send it whenever you are ready.',
      'ok',
    );
  };

  const handleDownloadSummary = () => {
    if (!validateQuote()) return;
    const blob = new Blob([formatQuoteText()], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'rays-ironworks-quote-request.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 4000);
    onStatus(
      `Quote summary downloaded. Send it (and your files) to ${SITE_LINKS.email}.`,
      'ok',
    );
  };

  const handleCopyDetails = async () => {
    if (!validateQuote()) return;
    const text = formatQuoteText();
    const doneMsg = `Quote details copied. Paste them into an email to ${SITE_LINKS.email} — and attach your files.`;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        onStatus(doneMsg, 'ok');
        return;
      } catch {
        // fallback below
      }
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      onStatus(doneMsg, 'ok');
    } catch {
      onStatus(
        'Copy did not work in this browser — use “Download Quote Summary” instead.',
        'warn',
      );
    }
    ta.remove();
  };

  return (
    <form
      id="quote-form"
      onSubmit={(e) => e.preventDefault()}
      noValidate
      className="bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl p-5 sm:p-7 mt-8"
    >
      <p className="font-display uppercase tracking-[0.22em] text-xs text-[#c9883d] mb-1">
        Quote request
      </p>
      <h3 className="text-2xl text-[#e8a317] mb-2">Send Ray Your Idea</h3>
      <p className="text-[#cfc9bf] mb-6">
        Fill in what you can — Ray replies with a quote and a timeline. Your
        files stay on your device until you attach them to the email.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="q-name"
            className="font-display uppercase tracking-[0.1em] text-xs text-[#a8a29a]"
          >
            Your name *
          </label>
          <input
            id="q-name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            value={form.name}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, name: e.target.value }))
            }
            className="px-3 py-2.5 rounded-lg bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] focus:outline-2 focus:outline-[#c9883d]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="q-email"
            className="font-display uppercase tracking-[0.1em] text-xs text-[#a8a29a]"
          >
            Your email *
          </label>
          <input
            id="q-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, email: e.target.value }))
            }
            className="px-3 py-2.5 rounded-lg bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] focus:outline-2 focus:outline-[#c9883d]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="q-phone"
            className="font-display uppercase tracking-[0.1em] text-xs text-[#a8a29a]"
          >
            Phone (optional)
          </label>
          <input
            id="q-phone"
            type="tel"
            autoComplete="tel"
            placeholder="424-555-0100"
            value={form.phone}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, phone: e.target.value }))
            }
            className="px-3 py-2.5 rounded-lg bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] focus:outline-2 focus:outline-[#c9883d]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="q-type"
            className="font-display uppercase tracking-[0.1em] text-xs text-[#a8a29a]"
          >
            Project type *
          </label>
          <select
            id="q-type"
            required
            value={form.type}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, type: e.target.value }))
            }
            className="px-3 py-2.5 rounded-lg bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] focus:outline-2 focus:outline-[#c9883d]"
          >
            <option value="">Choose a type…</option>
            <option value="Custom Gate">Custom Gate</option>
            <option value="Railing">Railing</option>
            <option value="Sculpture">Sculpture</option>
            <option value="Monument Sign">Monument Sign</option>
            <option value="Patio Cover">Patio Cover</option>
            <option value="Structural Steel">Structural Steel</option>
            <option value="Something else">Something else</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="q-size"
            className="font-display uppercase tracking-[0.1em] text-xs text-[#a8a29a]"
          >
            Approximate size
          </label>
          <input
            id="q-size"
            type="text"
            placeholder="e.g. 10 ft wide × 6 ft high"
            value={form.size}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, size: e.target.value }))
            }
            className="px-3 py-2.5 rounded-lg bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] focus:outline-2 focus:outline-[#c9883d]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="q-location"
            className="font-display uppercase tracking-[0.1em] text-xs text-[#a8a29a]"
          >
            Location / where it goes
          </label>
          <input
            id="q-location"
            type="text"
            placeholder="City / neighborhood — e.g. Truckee, CA"
            value={form.location}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, location: e.target.value }))
            }
            className="px-3 py-2.5 rounded-lg bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] focus:outline-2 focus:outline-[#c9883d]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="q-timeline"
            className="font-display uppercase tracking-[0.1em] text-xs text-[#a8a29a]"
          >
            Timeline
          </label>
          <select
            id="q-timeline"
            value={form.timeline}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, timeline: e.target.value }))
            }
            className="px-3 py-2.5 rounded-lg bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] focus:outline-2 focus:outline-[#c9883d]"
          >
            <option value="Flexible">Flexible</option>
            <option value="Within 1 month">Within 1 month</option>
            <option value="1–3 months">1–3 months</option>
            <option value="3+ months">3+ months</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="q-budget"
            className="font-display uppercase tracking-[0.1em] text-xs text-[#a8a29a]"
          >
            Budget range (optional)
          </label>
          <select
            id="q-budget"
            value={form.budget}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, budget: e.target.value }))
            }
            className="px-3 py-2.5 rounded-lg bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] focus:outline-2 focus:outline-[#c9883d]"
          >
            <option value="Prefer not to say">Prefer not to say</option>
            <option value="Under $1,000">Under $1,000</option>
            <option value="$1,000–$5,000">$1,000–$5,000</option>
            <option value="$5,000–$15,000">$5,000–$15,000</option>
            <option value="$15,000+">$15,000+</option>
          </select>
        </div>

        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label
            htmlFor="q-desc"
            className="font-display uppercase tracking-[0.1em] text-xs text-[#a8a29a]"
          >
            Describe your idea *
          </label>
          <textarea
            id="q-desc"
            required
            rows={4}
            placeholder="What do you want built? What should it look like, and where will it live?"
            value={form.desc}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, desc: e.target.value }))
            }
            className="px-3 py-2.5 rounded-lg bg-[#101012] text-[#f2efe8] border border-[#2a2a2e] focus:outline-2 focus:outline-[#c9883d]"
          />
        </div>

        <div className="sm:col-span-2 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display uppercase tracking-[0.1em] text-xs text-[#a8a29a]">
              Photos, CAD drawings, 3D models &amp; reference files (optional)
            </span>
            <span className="text-xs font-semibold text-[#c9883d]">
              All file types accepted
            </span>
          </div>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-[#c9883d] text-[#f2efe8] bg-[#141416]'
                : 'border-[#4a4a50] text-[#a8a29a] hover:border-[#c9883d] hover:text-[#f2efe8]'
            }`}
          >
            <input
              type="file"
              accept="*/*"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
            <Upload className="w-5 h-5 text-[#c9883d]" aria-hidden="true" />
            <span className="text-sm">
              Drop photos, CAD/vector drawings, 3D models, or documents here —
              All file types accepted (up to 8 files).
              <br />
              They stay on your device; you attach them to the email in the next
              step.
            </span>
          </label>

          {form.photos.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {form.photos.map((p, idx) => (
                <figure key={`${p.name}-${idx}`} className="w-32 m-0">
                  {p.isImage ? (
                    <img
                      src={p.previewUrl}
                      alt={p.name}
                      className="w-32 h-20 object-cover rounded-md border border-[#2a2a2e]"
                    />
                  ) : (
                    <div className="w-32 h-20 rounded-md border border-[#2a2a2e] bg-[#101012] flex flex-col items-center justify-center p-2 text-center">
                      <FileText
                        className="w-5 h-5 text-[#e8a317] mb-1"
                        aria-hidden="true"
                      />
                      <span className="text-[10px] text-[#a8a29a] leading-tight">
                        stored as a reference — needs conversion to use in the
                        model
                      </span>
                    </div>
                  )}
                  <figcaption className="text-xs text-[#a8a29a] break-all mt-1">
                    {p.name} ({Math.round(p.size / 1024)} KB)
                  </figcaption>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a
                      href={p.previewUrl}
                      download={p.name}
                      className="text-xs text-[#e8a317] hover:underline"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        onChange((prev) => ({
                          ...prev,
                          photos: prev.photos.filter((_, i) => i !== idx),
                        }))
                      }
                      className="inline-flex items-center gap-1 text-xs text-[#e07856] hover:underline cursor-pointer bg-transparent border-0 p-0"
                    >
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <button
          type="button"
          onClick={handlePrepareEmail}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-bold text-base transition-colors cursor-pointer"
        >
          <Mail className="w-4 h-4" aria-hidden="true" />
          Prepare Email to Ray
        </button>

        <button
          type="button"
          onClick={handleDownloadSummary}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border-2 border-[#cfc9bf] text-white hover:border-[#e8a317] hover:text-[#e8a317] font-bold text-base transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Download Quote Summary
        </button>

        <button
          type="button"
          onClick={handleCopyDetails}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border-2 border-[#cfc9bf] text-white hover:border-[#e8a317] hover:text-[#e8a317] font-bold text-base transition-colors cursor-pointer"
        >
          <Copy className="w-4 h-4" aria-hidden="true" />
          Copy Quote Details
        </button>
      </div>

      {status.text && (
        <p
          role="status"
          className={`mt-4 text-sm ${
            status.kind === 'ok'
              ? 'text-[#9ed69a]'
              : status.kind === 'warn'
                ? 'text-[#e8c97a]'
                : 'text-[#d8d2c8]'
          }`}
        >
          {status.text}
        </p>
      )}

      <p className="text-sm text-[#a8a29a] mt-3 mb-0">
        What happens next: your email app opens addressed to{' '}
        <strong className="text-[#f2efe8]">{SITE_LINKS.email}</strong> with
        everything filled in.{' '}
        <strong className="text-[#f2efe8]">
          Attach your files to that email before sending
        </strong>{' '}
        — the website cannot attach them for you. If your email app doesn&rsquo;t
        open, use &ldquo;Download Quote Summary&rdquo; or &ldquo;Copy Quote
        Details&rdquo; and send them to Ray yourself. Ray replies with a quote
        and a timeline.
      </p>
    </form>
  );
}
