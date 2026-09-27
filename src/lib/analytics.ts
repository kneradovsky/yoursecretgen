declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Read through `import.meta.env`, never through an HTML placeholder: Vite
 * replaces `%VITE_*%` in index.html only for defined variables, so an unset
 * ID would survive as the literal string `%VITE_GA_MEASUREMENT_ID%` — truthy,
 * and enough to load a tracker on a build that opted out. Here an unset
 * variable is simply `undefined`.
 */
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

const GTAG_URL = 'https://www.googletagmanager.com/gtag/js';

let loaded = false;

/**
 * Loads GA4 once, only when the measurement ID is configured. The script is
 * injected after the load event so a slow or blocked gtag request cannot hold
 * up the page's load event (the tab would spin indefinitely).
 */
export function loadAnalytics(): void {
  if (loaded || !GA_ID) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_ID);

  const inject = () => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `${GTAG_URL}?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(script);
  };

  if (document.readyState === 'complete') {
    inject();
  } else {
    window.addEventListener('load', inject, { once: true });
  }
}

export { GA_ID };
