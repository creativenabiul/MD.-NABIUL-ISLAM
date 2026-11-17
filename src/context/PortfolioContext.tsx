import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
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

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PortfolioBundle>(INITIAL_BUNDLE);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (data.settings.siteTitle) {
      document.title = data.settings.siteTitle;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && data.settings.seoDescription) {
      metaDesc.setAttribute('content', data.settings.seoDescription);
    }
  }, [data.settings.siteTitle, data.settings.seoDescription]);

  return (
    <PortfolioContext.Provider value={{ data, loading, refresh }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  return useContext(PortfolioContext);
}
