import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', sectionId: 'hero', path: '/' },
  { label: 'About', sectionId: 'about', path: '/about' },
  { label: 'Services', sectionId: 'services', path: '/#services' },
  { label: 'Skills', sectionId: 'skills', path: '/#skills' },
  { label: 'Experience', sectionId: 'experience', path: '/#experience' },
  { label: 'Projects', sectionId: 'projects', path: '/projects' },
  { label: 'Contact', sectionId: 'contact', path: '/contact' },
];

export function Navbar({ brandName = 'Md. Nabiul Islam' }: { brandName?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollPct((y / max) * 100);

      if (location.pathname === '/') {
        const ids = ['hero', 'about', 'services', 'skills', 'experience', 'projects', 'contact'];
        for (let i = ids.length - 1; i >= 0; i--) {
          const el = document.getElementById(ids[i]);
          if (el && el.getBoundingClientRect().top <= 160) {
            setActiveSection(ids[i]);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleNavClick = (item: (typeof NAV_ITEMS)[number]) => {
    setMobileOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById(item.sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (item.path.startsWith('/#')) {
      navigate('/');
      window.setTimeout(() => {
        document.getElementById(item.sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Fixed Scroll Progress Indicator */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent pointer-events-none"
      >
        <div
          className="h-full bg-gradient-to-r from-[#D4B475] via-[#E8D2A0] to-[#D4B475] transition-[width] duration-75"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#070708]/85 backdrop-blur-md border-b border-white/10 py-3.5'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#F5F2EB] hover:text-[#D4B475] transition-colors whitespace-nowrap shrink-0"
          >
            {brandName}
          </Link>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#F5F2EB]/75"
          >
            {NAV_ITEMS.map((item) => {
              const isActive =
                (location.pathname === '/' && activeSection === item.sectionId) ||
                (item.path !== '/' && !item.path.startsWith('/#') && location.pathname.startsWith(item.path));

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`group relative py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:text-[#D4B475] ${
                    isActive ? 'text-[#D4B475]' : 'hover:text-[#F5F2EB]'
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0 left-0 h-px w-full bg-[#D4B475] origin-left transition-transform duration-300 ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/contact"
              className="hidden sm:inline-flex items-center px-4 py-2 text-xs font-semibold tracking-wide uppercase rounded-lg bg-[#D4B475] text-[#070708] hover:bg-[#E8D2A0] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B475]"
            >
              Start Project
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/15 text-[#F5F2EB] hover:border-[#D4B475]/50"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-[#070708]/95 backdrop-blur-lg pt-24 px-6 pb-8 flex flex-col justify-between lg:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-4">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item)}
                className="text-left font-serif text-3xl text-[#F5F2EB] hover:text-[#D4B475] py-2 border-b border-white/10 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-6">
            <Link
              to="/contact"
              onClick={() => setMobileOpen(false)}
              className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-[#D4B475] text-[#070708] text-sm font-semibold"
            >
              Start a Conversation
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
