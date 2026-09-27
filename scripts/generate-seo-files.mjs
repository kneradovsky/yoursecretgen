import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const LANGS = ['en', 'ru'];
const SECTIONS = ['', 'uuid', 'base64', 'sha', 'bcrypt', 'json', 'x509'];

/** Mirrors vite.config.ts: only 'en' and 'ru' are supported, anything else is 'en'. */
function resolveDefaultLang(value) {
  return LANGS.includes(value) ? value : 'en';
}

/** Mirrors src/i18n/index.ts: the default language has no URL prefix. */
function localizedPath(lang, section, defaultLang) {
  if (lang === defaultLang) return `/${section}`;
  return `/${lang}${section ? `/${section}` : ''}`;
}

function pageUrl(siteUrl, lang, section, defaultLang) {
  // The root route has no trailing slash in the sitemap loc entries.
  return `${siteUrl}${localizedPath(lang, section, defaultLang)}`;
}

function buildSitemap(siteUrl, defaultLang) {
  const lastmod = new Date().toISOString().slice(0, 10);

  const pages = SECTIONS.flatMap((section) => {
    const isHome = section === '';
    return LANGS.map((lang) => ({
      loc: pageUrl(siteUrl, lang, section, defaultLang),
      lang,
      alternates: [...LANGS, 'x-default'].map((altLang) => ({
        hreflang: altLang,
        href: pageUrl(siteUrl, altLang === 'x-default' ? defaultLang : altLang, section, defaultLang),
      })),
      lastmod,
      changefreq: isHome ? 'weekly' : 'monthly',
      priority: isHome
        ? lang === defaultLang
          ? '1.0'
          : '0.8'
        : lang === defaultLang
          ? '0.8'
          : '0.7',
    }));
  });

  // Default-language pages first, localized pages after.
  pages.sort((a, b) => Number(a.lang !== defaultLang) - Number(b.lang !== defaultLang));

  const urls = pages
    .map(
      (page) => `  <url>
    <loc>${page.loc}</loc>
${page.alternates
  .map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>`)
  .join('\n')}
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

function buildRobotsTxt(siteUrl) {
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
}

async function main() {
  // loadEnv merges .env files with process.env, so this works both for local
  // builds (values from .env) and Docker builds (values from ARG/ENV).
  const env = loadEnv('production', path.resolve(__dirname, '..'), 'VITE_');
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '');
  const defaultLang = resolveDefaultLang(env.VITE_DEFAULT_LANG);

  if (!siteUrl) {
    throw new Error(
      'VITE_SITE_URL is not set. Add it to .env (see .env.example) or pass it as an environment variable.'
    );
  }

  try {
    await fs.access(path.join(DIST_DIR, 'index.html'));
  } catch {
    throw new Error('dist/index.html is missing. Run `npm run build` before generating SEO files.');
  }

  await fs.writeFile(path.join(DIST_DIR, 'robots.txt'), buildRobotsTxt(siteUrl));
  await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), buildSitemap(siteUrl, defaultLang));

  console.log(
    `Generated dist/robots.txt and dist/sitemap.xml for ${siteUrl} (default language: ${defaultLang})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
