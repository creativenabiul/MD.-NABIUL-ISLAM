import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DEFAULT_PORTFOLIO_BUNDLE } from '../data/seedDefaults';
import { normalizePortfolioBundle } from '../lib/assetUrl';
import { testFirestoreConnection } from '../lib/firebase';
import { fetchPublicPortfolio } from '../lib/portfolioService';
import type { PortfolioBundle } from '../types/portfolio';

interface PortfolioContextValue {
  data: PortfolioBundle;
  loading: boolean;
  refresh: () => Promise<void>;
}

const INITIAL_BUNDLE = normalizePortfolioBundle(DEFAULT_PORTFOLIO_BUNDLE);

const PortfolioContext = createContext<PortfolioContextValue>({
  data: INITIAL_BUNDLE,
  loading: true,
  refresh: async () => {},
});

function setOrCreateMeta(selector: string, attrName: 'name' | 'property', key: string, content: string) {
  if (!content) return;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PortfolioBundle>(INITIAL_BUNDLE);
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();

  const refresh = useCallback(async () => {
    try {
      await testFirestoreConnection();
      const bundle = await fetchPublicPortfolio();
      setData(bundle);
    } catch (err) {
      console.error('Failed loading portfolio data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Apply dynamic Design Settings CSS custom properties & theme mode on public routes
  useEffect(() => {
    const s = data.settings;
    const root = document.documentElement;
    const isAdmin = pathname.startsWith('/admin');

    if (!isAdmin) {
      if (s.accentGoldHex) {
        root.style.setProperty('--color-champagne', s.accentGoldHex);
      }
      if (s.primaryBgHex) {
        root.style.setProperty('--color-obsidian', s.themeMode === 'light' ? '#F6F4EF' : s.primaryBgHex);
        document.body.style.backgroundColor = s.themeMode === 'light' ? '#F6F4EF' : s.primaryBgHex;
      }
      if (s.secondaryBgHex) {
        root.style.setProperty('--color-charcoal', s.themeMode === 'light' ? '#EBE7DE' : s.secondaryBgHex);
      }
      if (s.textColorHex) {
        root.style.setProperty('--color-ivory', s.themeMode === 'light' ? '#141417' : s.textColorHex);
        document.body.style.color = s.themeMode === 'light' ? '#141417' : s.textColorHex;
      }

      const headingMap: Record<string, string> = {
        cormorant: '"Cormorant Garamond", Georgia, serif',
        playfair: '"Playfair Display", Georgia, serif',
        jakarta: '"Plus Jakarta Sans", system-ui, sans-serif',
      };
      const bodyMap: Record<string, string> = {
        jakarta: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
        inter: '"Inter", system-ui, -apple-system, sans-serif',
        system: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      };
      if (s.headingFont && headingMap[s.headingFont]) {
        root.style.setProperty('--font-serif', headingMap[s.headingFont]);
      }
      if (s.bodyFont && bodyMap[s.bodyFont]) {
        root.style.setProperty('--font-sans', bodyMap[s.bodyFont]);
      }

      const radiusMap: Record<string, string> = {
        sharp: '0px',
        rounded: '16px',
        soft: '24px',
      };
      root.style.setProperty('--site-radius', radiusMap[s.borderRadiusStyle || 'rounded'] || '16px');
      root.dataset.themeMode = s.themeMode || 'dark';
    } else {
      root.style.setProperty('--color-champagne', '#D4B475');
      root.style.setProperty('--color-obsidian', '#070708');
      root.style.setProperty('--color-charcoal', '#111114');
      root.style.setProperty('--color-ivory', '#F5F2EB');
      document.body.style.backgroundColor = '#070708';
      document.body.style.color = '#F5F2EB';
    }
  }, [data.settings, pathname]);

  // Apply dynamic global & per-page SEO metadata
  useEffect(() => {
    const s = data.settings;
    let pageOverrides: Record<string, { title?: string; description?: string }> = {};
    try {
      pageOverrides = s.pageSeoJson ? JSON.parse(s.pageSeoJson) : {};
    } catch {
      pageOverrides = {};
    }

    const cleanPath = pathname === '/' ? 'home' : pathname.replace(/^\//, '').split('/')[0];
    const override = pageOverrides[cleanPath] || pageOverrides[pathname];

    const finalTitle = override?.title || s.siteTitle;
    const finalDescription = override?.description || s.seoDescription;

    if (finalTitle) {
      document.title = finalTitle;
      setOrCreateMeta('meta[property="og:title"]', 'property', 'og:title', s.ogTitle || finalTitle);
    }
    if (finalDescription) {
      setOrCreateMeta('meta[name="description"]', 'name', 'description', finalDescription);
      setOrCreateMeta('meta[property="og:description"]', 'property', 'og:description', s.ogDescription || finalDescription);
    }
    if (s.seoKeywords) {
      setOrCreateMeta('meta[name="keywords"]', 'name', 'keywords', s.seoKeywords);
    }
    if (s.ogImageUrl) {
      setOrCreateMeta('meta[property="og:image"]', 'property', 'og:image', s.ogImageUrl);
    }
    if (s.robotsMeta) {
      setOrCreateMeta('meta[name="robots"]', 'name', 'robots', pathname.startsWith('/admin') ? 'noindex, nofollow' : s.robotsMeta);
    }
    if (s.canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', `${s.canonicalUrl.replace(/\/+$/, '')}${pathname}`);
    }
  }, [data.settings, pathname]);

  return (
    <PortfolioContext.Provider value={{ data, loading, refresh }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  return useContext(PortfolioContext);
}
