import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const DIST_DIR = '/Users/kn/devel/uuidhash/dist';
const PORT = 3457;

const server = createServer(async (req, res) => {
  const pathname = req.url.split('?')[0];
  try {
    const ext = path.extname(pathname);
    const content = await fs.readFile(path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname));
    res.writeHead(200, { 'Content-Type': { '.js': 'application/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.svg': 'image/svg+xml' }[ext] || 'text/html' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise((r) => server.listen(PORT, r));

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('console', (m) => console.log('[console]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
console.log('domcontentloaded, readyState =', await page.evaluate(() => document.readyState));

for (let i = 0; i < 10; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  const state = await page.evaluate(() => ({
    readyState: document.readyState,
    rootHtmlLen: document.getElementById('root')?.innerHTML.length,
  }));
  console.log(`t=${i + 1}s`, state);
  if (state.readyState === 'complete') break;
}

await browser.close();
server.close();
