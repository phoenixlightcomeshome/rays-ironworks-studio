import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type AppPage = 'home' | 'design-studio';

interface HeaderProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage, sectionId?: string) => void;
}

const HOME_NAV_ITEMS: Array<{ id: string; label: string }> = [
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'work', label: 'Work' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'contact', label: 'Contact' },
];

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: AppPage, sectionId?: string) => {
    setMobileOpen(false);
    onNavigate(page, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0e0e10]/95 border-b border-[#2a2a2e]">
      <div className="max-w-[1160px] mx-auto px-5 h-14 sm:h-16 flex items-center justify-between gap-6">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleNav('home', 'top');
          }}
          className="font-display font-bold text-lg sm:text-xl tracking-[0.08em] uppercase text-[#f2efe8] no-underline whitespace-nowrap shrink-0"
        >
          Ray&rsquo;s <span className="text-[#c9883d]">Ironworks</span>
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-[15px] text-[#cfc9bf]"
        >
          {HOME_NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleNav('home', item.id);
              }}
              className="hover:text-[#e8a317] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {item.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => handleNav('design-studio')}
            aria-current={currentPage === 'design-studio' ? 'page' : undefined}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer bg-transparent border-0 p-0 text-[15px] ${
              currentPage === 'design-studio'
                ? 'text-[#e8a317] font-semibold underline underline-offset-4'
                : 'text-[#cfc9bf] hover:text-[#e8a317] hover:underline underline-offset-4'
            }`}
          >
            Design Studio
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="#quote"
            onClick={(e) => {
              e.preventDefault();
              handleNav('home', 'quote');
            }}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#c9883d] hover:bg-[#e8a317] text-[#141210] font-bold text-sm transition-colors whitespace-nowrap shrink-0"
          >
            Design &amp; Quote
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border border-[#2a2a2e] bg-[#141416] text-[#f2efe8] hover:border-[#c9883d] cursor-pointer"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-[#2a2a2e] bg-[#0e0e10] px-5 py-3 flex flex-col gap-1.5 text-sm"
        >
          {HOME_NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleNav('home', item.id);
              }}
              className="py-2 px-2.5 rounded-md text-[#cfc9bf] hover:bg-[#1c1c1f] hover:text-[#e8a317] transition-colors"
            >
              {item.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => handleNav('design-studio')}
            aria-current={currentPage === 'design-studio' ? 'page' : undefined}
            className={`text-left py-2 px-2.5 rounded-md transition-colors cursor-pointer border ${
              currentPage === 'design-studio'
                ? 'bg-[#242018] border-[#e8a317] text-[#e8a317] font-semibold'
                : 'border-transparent text-[#cfc9bf] hover:bg-[#1c1c1f] hover:text-[#e8a317]'
            }`}
          >
            Design Studio
          </button>
        </nav>
      )}
    </header>
  );
}
