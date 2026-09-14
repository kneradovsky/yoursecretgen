import { useEffect } from 'react';
import { LANGS, localizedPath, useI18n, type Lang } from '../i18n';

const SITE_URL = import.meta.env.VITE_SITE_URL;
const OG_IMAGE_URL = `${SITE_URL}/og-image.svg`;
const HREFLANG_ATTR = 'data-i18n-alternate';

function setMetaTag(selector: string, content: string) {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute('content', content);
  }
}

/**
 * Rebuilds the set of hreflang alternate links for a section path, one per
 * supported language plus an x-default pointing at the default-language page.
 */
function updateHreflangAlternates(sectionPath: string) {
  document.querySelectorAll(`link[${HREFLANG_ATTR}]`).forEach((el) => el.remove());

  for (const lang of [...LANGS, 'x-default'] as const) {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = lang;
    link.href = `${SITE_URL}${localizedPath(
      (lang === 'x-default' ? LANGS[0] : lang) as Lang,
      sectionPath
    )}`;
    link.setAttribute(HREFLANG_ATTR, '');
    document.head.appendChild(link);
  }
}

/**
 * Updates page title, description, Open Graph and Twitter meta tags,
 * canonical URL, html lang attribute, and hreflang alternates for the
 * current localized route. `path` is the section path without the language
 * prefix ('/' or '/uuid').
 *
 * Note: this only updates tags after client-side hydration. For crawlers that
 * do not execute JavaScript, prerendering or SSR is required to see per-page metadata.
 */
export function useSEO(title: string, description: string, path: string) {
  const { lang } = useI18n();

  useEffect(() => {
    const url = `${SITE_URL}${localizedPath(lang, path)}`;

    document.documentElement.lang = lang;
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

    updateHreflangAlternates(path);
  }, [title, description, path, lang]);
}
