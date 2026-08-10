import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = 3456;
const ROUTES = ['/', '/uuid', '/base64', '/sha', '/bcrypt', '/json'];

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
  const server = await serveStatic(DIST_DIR, PORT);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    for (const route of ROUTES) {
      const url = `http://localhost:${PORT}${route}`;
      await page.goto(url, { waitUntil: 'networkidle2' });
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
