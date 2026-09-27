import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GA_ID, loadAnalytics } from '../lib/analytics';

/**
 * Loads GA4 (only when VITE_GA_MEASUREMENT_ID is set) and reports a page view
 * for every client-side route change.
 */
export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (!GA_ID || typeof window.gtag !== 'function') return;

    window.gtag('config', GA_ID, {
      page_path: location.pathname + location.search,
    });
  }, [location]);
}
