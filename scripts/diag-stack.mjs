import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const DIST_DIR = '/Users/kn/devel/uuidhash/dist';
const PORT = 3461;
const MIME = { '.js': 'application/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.html': 'text/html' };

const server = createServer(async (req, res) => {
  const pathname = req.url.split('?')[0];
  const ext = path.extname(pathname);
  const file = ext ? path.join(DIST_DIR, pathname) : path.join(DIST_DIR, 'index.html');
  try {
    const content = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/html' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise((r) => server.listen(PORT, r));

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const cdp = await page.createCDPSession();
await cdp.send('Profiler.enable');
await cdp.send('Profiler.start');

await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch((e) => console.log('goto:', e.message));
await new Promise((r) => setTimeout(r, 6000)); // let it block

const profile = await cdp.send('Profiler.stop');
const nodes = new Map(profile.profile.nodes.map((n) => [n.id, n]));
const hitCounts = new Map();
for (const [i, nodeId] of (profile.profile.samples || []).entries()) {
  hitCounts.set(nodeId, (hitCounts.get(nodeId) || 0) + 1);
}
const top = [...hitCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log('total samples:', (profile.profile.samples || []).length);
for (const [id, count] of top) {
  const n = nodes.get(id);
  console.log(`  ${count}x ${n.callFrame.functionName || '(anon)'} ${n.callFrame.url}:${n.callFrame.lineNumber + 1}`);
}

// If JS is stuck in a loop, terminateExecution should restore responsiveness
await cdp.send('Runtime.terminateExecution').catch((e) => console.log('terminate:', e.message));
await new Promise((r) => setTimeout(r, 1000));
try {
  const state = await Promise.race([
    page.evaluate(() => document.readyState),
    new Promise((_, rej) => setTimeout(() => rej(new Error('still blocked')), 3000)),
  ]);
  console.log('after terminateExecution, evaluate works, readyState =', state);
} catch (e) {
  console.log('after terminateExecution still blocked:', e.message);
}

await browser.close();
server.close();
