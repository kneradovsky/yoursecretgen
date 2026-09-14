import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const LANGS = ['en', 'ru'];
const SECTIONS = ['', 'uuid', 'base64', 'sha', 'bcrypt', 'json'];

function localizedPath(lang, section) {
  // Mirrors src/i18n/index.ts: the root of a non-default language has no
  // trailing slash ('/ru'), nested sections do ('/ru/uuid').
  return lang === 'en' ? `/${section}` : `/ru${section ? `/${section}` : ''}`;
}

function pageUrl(siteUrl, lang, section) {
  // The root route has no trailing slash in the sitemap loc entries.
  return `${siteUrl}${localizedPath(lang, section)}`;
}

function buildSitemap(siteUrl) {
  const lastmod = new Date().toISOString().slice(0, 10);

  const pages = SECTIONS.flatMap((section) => {
    const isHome = section === '';
    return LANGS.map((lang) => ({
      loc: pageUrl(siteUrl, lang, section),
      alternates: [...LANGS, 'x-default'].map((altLang) => ({
        hreflang: altLang,
        href: pageUrl(siteUrl, altLang === 'x-default' ? LANGS[0] : altLang, section),
      })),
      lastmod,
      changefreq: isHome ? 'weekly' : 'monthly',
      priority: isHome ? (lang === 'en' ? '1.0' : '0.8') : lang === 'en' ? '0.8' : '0.7',
    }));
  });

  // Default language pages first, localized pages after — mirrors the
  // original public/sitemap.xml ordering.
  pages.sort((a, b) => {
    const langIndex = (p) => (p.loc.startsWith(`${siteUrl}/ru`) ? 1 : 0);
    return langIndex(a) - langIndex(b);
  });

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
  await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), buildSitemap(siteUrl));

  console.log(`Generated dist/robots.txt and dist/sitemap.xml for ${siteUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
