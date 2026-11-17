import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import type { NavigationItem } from '../types/portfolio';

interface NavbarProps {
  brandName?: string;
  navigationItems?: NavigationItem[];
  headerStyle?: 'glass' | 'solid' | 'minimal';
}

function isSafeExternalHref(url: string): boolean {
  return /^https?:\/\//i.test(url) || /^mailto:/i.test(url) || /^tel:/i.test(url);
}

export function Navbar({
  brandName,
  navigationItems,
  headerStyle,
}: NavbarProps) {
  const { data } = usePortfolio();
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const resolvedBrand = brandName || data.profile.fullName || 'Md. Nabiul Islam';
  const resolvedHeaderStyle = headerStyle || data.settings.headerStyle || 'glass';

  const visibleNavItems = useMemo(() => {
    const source = navigationItems ?? data.navigationItems ?? [];
    return [...source]
      .filter((item) => item.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [navigationItems, data.navigationItems]);

  const { topLevelItems, childrenByParent } = useMemo(() => {
    const top: NavigationItem[] = [];
    const childMap = new Map<string, NavigationItem[]>();
    visibleNavItems.forEach((item) => {
      const parent = item.parentLabel?.trim();
      if (parent) {
        const list = childMap.get(parent) || [];
        list.push(item);
        childMap.set(parent, list);
      } else {
        top.push(item);
      }
    });
    return { topLevelItems: top, childrenByParent: childMap };
  }, [visibleNavItems]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollPct((y / max) * 100);

      if (location.pathname === '/') {
        const ids = visibleNavItems
          .map((item) => item.sectionId)
          .filter((id): id is string => Boolean(id));
        const trackIds = ids.length > 0 ? ids : ['hero', 'about', 'services', 'skills', 'experience', 'projects', 'contact'];
        for (let i = trackIds.length - 1; i >= 0; i--) {
          const el = document.getElementById(trackIds[i]);
          if (el && el.getBoundingClientRect().top <= 160) {
            setActiveSection(trackIds[i]);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname, visibleNavItems]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleNavClick = (item: NavigationItem) => {
    setMobileOpen(false);
    const dest = item.destination.trim();
    if (item.isExternal || isSafeExternalHref(dest)) {
      if (isSafeExternalHref(dest)) {
        window.open(dest, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    const sectionTarget =
      item.sectionId ||
      (dest.startsWith('/#') ? dest.slice(2) : dest.startsWith('#') ? dest.slice(1) : '');

    if (location.pathname === '/' && sectionTarget) {
      const el = document.getElementById(sectionTarget);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    if ((dest.startsWith('/#') || dest.startsWith('#')) && sectionTarget) {
      navigate('/');
      window.setTimeout(() => {
        document.getElementById(sectionTarget)?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
      return;
    }

    navigate(dest || '/');
  };

  const headerClasses =
    resolvedHeaderStyle === 'solid'
      ? 'bg-[#070708] border-b border-white/10 py-3.5'
      : resolvedHeaderStyle === 'minimal'
      ? scrolled
        ? 'bg-[#070708]/75 backdrop-blur-sm border-b border-white/8 py-3'
        : 'bg-transparent py-4'
      : scrolled
      ? 'bg-[#070708]/85 backdrop-blur-md border-b border-white/10 py-3.5'
      : 'bg-transparent py-5';

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

      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${headerClasses}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#F5F2EB] hover:text-[#D4B475] transition-colors whitespace-nowrap shrink-0"
          >
            {resolvedBrand}
          </Link>

          {/* Zone 2: Clean Single-Line Nav Links + Optional Dropdown Submenus */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#F5F2EB]/75"
          >
            {topLevelItems.map((item) => {
              const subItems = childrenByParent.get(item.label) || [];
              const isActive =
                (location.pathname === '/' && item.sectionId && activeSection === item.sectionId) ||
                (!item.isExternal &&
                  item.destination !== '/' &&
                  !item.destination.startsWith('/#') &&
                  !item.destination.startsWith('#') &&
                  location.pathname.startsWith(item.destination));

              return (
                <div key={item.id} className="relative group">
                  {item.isExternal && isSafeExternalHref(item.destination) ? (
                    <a
                      href={item.destination}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="relative inline-flex items-center gap-1 py-1 hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0"
                    >
                      {item.label}
                      {subItems.length > 0 && <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className={`relative inline-flex items-center gap-1 py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:text-[#D4B475] ${
                        isActive ? 'text-[#D4B475]' : 'hover:text-[#F5F2EB]'
                      }`}
                    >
                      {item.label}
                      {subItems.length > 0 && <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
                      <span
                        aria-hidden="true"
                        className={`absolute bottom-0 left-0 h-px w-full bg-[#D4B475] origin-left transition-transform duration-300 ${
                          isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                        }`}
                      />
                    </button>
                  )}

                  {subItems.length > 0 && (
                    <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-all duration-150 absolute left-0 top-full pt-2 z-50 min-w-[180px]">
                      <div className="rounded-xl bg-[#111114] border border-white/12 shadow-xl p-1.5 space-y-0.5">
                        {subItems.map((sub) =>
                          sub.isExternal && isSafeExternalHref(sub.destination) ? (
                            <a
                              key={sub.id}
                              href={sub.destination}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="block px-3 py-2 rounded-lg text-xs text-[#F5F2EB]/80 hover:text-[#D4B475] hover:bg-white/5"
                            >
                              {sub.label}
                            </a>
                          ) : (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleNavClick(sub)}
                              className="w-full text-left block px-3 py-2 rounded-lg text-xs text-[#F5F2EB]/80 hover:text-[#D4B475] hover:bg-white/5"
                            >
                              {sub.label}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
        <div className="fixed inset-0 z-30 bg-[#070708]/95 backdrop-blur-lg pt-24 px-6 pb-8 flex flex-col justify-between overflow-y-auto lg:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-3">
            {topLevelItems.map((item) => {
              const subItems = childrenByParent.get(item.label) || [];
              return (
                <div key={item.id} className="border-b border-white/10 pb-2">
                  <button
                    type="button"
                    onClick={() => handleNavClick(item)}
                    className="w-full text-left font-serif text-3xl text-[#F5F2EB] hover:text-[#D4B475] py-1.5 transition-colors"
                  >
                    {item.label}
                  </button>
                  {subItems.length > 0 && (
                    <div className="pl-4 flex flex-col gap-1.5 pb-1">
                      {subItems.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleNavClick(sub)}
                          className="text-left text-sm text-[#8C8A84] hover:text-[#D4B475] py-1"
                        >
                          ↳ {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
