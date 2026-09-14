import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = 3456;
const LANGS = ['en', 'ru'];
const SECTIONS = ['', 'uuid', 'base64', 'sha', 'bcrypt', 'json'];
const ROUTES = SECTIONS.flatMap((section) =>
  LANGS.map((lang) => (lang === 'en' ? `/${section}` : `/${lang}/${section}`))
);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
};

/**
 * Start a minimal static file server for the dist folder.
 */
async function serveStatic(root, port) {
  const server = createServer(async (req, res) => {
    const pathname = req.url.split('?')[0];
    const ext = path.extname(pathname);

    // Serve real asset files (JS, CSS, WASM, images, etc.) directly.
    if (ext && ext !== '.html') {
      const assetPath = path.join(root, pathname);
      try {
        const content = await fs.readFile(assetPath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(content);
        return;
      } catch {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
    }

    // For HTML pages and SPA routes, always fall back to the root index.html
    // so React Router can render the correct route during prerendering.
    try {
      const content = await fs.readFile(path.join(root, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise((resolve) => server.listen(port, resolve));
  return server;
}

/**
 * Remove dynamically injected GA script tags so they are not duplicated
 * when the client re-runs the inline GA loader on hydration.
 */
async function cleanupInjectedGtagScripts(page) {
  await page.evaluate(() => {
    document
      .querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')
      .forEach((script) => script.remove());
  });
}

async function main() {
  // The static server falls back to dist/index.html for every route. If the
  // build hasn't been run, the server will return a plain 404 page and
  // Puppeteer will happily write that 404 into every prerendered file.
  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  try {
    await fs.access(indexHtmlPath);
  } catch {
    throw new Error(
      `dist/index.html is missing. Run \`npm run build\` before \`npm run prerender\`.`
    );
  }

  const server = await serveStatic(DIST_DIR, PORT);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Block Google Analytics during prerendering: the gtag request can hang or
    // fail in a headless environment, which keeps networkidle2 from ever
    // resolving and aborts the whole prerender run. The injected gtag scripts
    // are removed from the snapshot anyway (see cleanupInjectedGtagScripts).
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('googletagmanager.com')) {
        request.abort();
      } else {
        request.continue();
      }
    });

    for (const route of ROUTES) {
      const url = `http://localhost:${PORT}${route}`;
      const response = await page.goto(url, { waitUntil: 'networkidle2' });
      if (!response || response.status() >= 400) {
        throw new Error(
          `Prerender of ${route} failed with HTTP ${response ? response.status() : 'no response'}.` +
            ' Make sure the build produced a valid dist/index.html.'
        );
      }
      await cleanupInjectedGtagScripts(page);

      const html = await page.content();
      const outputPath =
        route === '/' ? path.join(DIST_DIR, 'index.html') : path.join(DIST_DIR, route, 'index.html');

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, html);

      console.log(`Prerendered ${route} -> ${outputPath}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
