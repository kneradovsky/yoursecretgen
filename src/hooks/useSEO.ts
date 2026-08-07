import { useEffect } from 'react';

const SITE_URL = 'https://mylocaltools.dev';
const OG_IMAGE_URL = `${SITE_URL}/og-image.svg`;

function setMetaTag(selector: string, content: string) {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute('content', content);
  }
}

/**
 * Updates page title, description, Open Graph and Twitter meta tags,
 * and canonical URL for the current route.
 *
 * Note: this only updates tags after client-side hydration. For crawlers that
 * do not execute JavaScript, prerendering or SSR is required to see per-page metadata.
 */
export function useSEO(title: string, description: string, path: string) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;

    document.title = title;

    setMetaTag('meta[name="description"]', description);

    setMetaTag('meta[property="og:title"]', title);
    setMetaTag('meta[property="og:description"]', description);
    setMetaTag('meta[property="og:url"]', url);
    setMetaTag('meta[property="og:image"]', OG_IMAGE_URL);

    setMetaTag('meta[name="twitter:title"]', title);
    setMetaTag('meta[name="twitter:description"]', description);
    setMetaTag('meta[name="twitter:image"]', OG_IMAGE_URL);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', url);
    }
  }, [title, description, path]);
}
