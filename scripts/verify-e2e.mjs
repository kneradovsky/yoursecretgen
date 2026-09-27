import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { X509Certificate } from 'node:crypto';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

/**
 * End-to-end smoke test for the built site in dist/.
 *
 * Serves the build with the same fallback rule as the Caddyfile
 * (try_files {path} {path}/index.html /index.html) and drives a real Chromium:
 * runs every wasm tool, checks that bcrypt runs in the Web Worker without
 * blocking the main thread, and asserts whether Analytics is allowed to load.
 *
 * Usage:
 *   node scripts/verify-e2e.mjs                     # build must have a GA id
 *   node scripts/verify-e2e.mjs --expect-ga-off     # build must not load GA
 *   E2E_DIST=dist-ru node scripts/verify-e2e.mjs    # test another build output
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT, process.env.E2E_DIST || 'dist');
const PORT = Number(process.env.E2E_PORT || 3471);
const EXPECT_GA_OFF = process.argv.includes('--expect-ga-off');

// Cost 14 keeps the hash around a second: long enough that a main-thread
// implementation would be unmistakable in the responsiveness check below.
const BCRYPT_COST = 14;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`);
}

function serveStatic() {
  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(req.url.split('?')[0]);
    const ext = path.extname(pathname);
    const candidates = ext
      ? [pathname]
      : [pathname, path.join(pathname, 'index.html'), '/index.html'];

    for (const candidate of candidates) {
      const file = path.join(DIST_DIR, candidate);
      if (!file.startsWith(DIST_DIR)) break;
      try {
        const content = await fs.readFile(file);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(file)] || 'application/octet-stream' });
        res.end(content);
        return;
      } catch {
        // try the next candidate
      }
    }
    res.writeHead(404);
    res.end('Not found');
  });

  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

/** Sets a React-controlled range/text input through the native value setter. */
async function setInputValue(page, selector, value) {
  await page.$eval(
    selector,
    (element, next) => {
      const prototype =
        element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
      setter.call(element, next);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    },
    String(value)
  );
}

const isUuidV4 = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);

/** Both the dynamic JS chunk and the wasm asset of the X.509 module. */
const isX509Asset = (url) => url.includes('uuidhash_x509_wasm');

async function main() {
  await fs.access(path.join(DIST_DIR, 'index.html'));

  const server = await serveStatic();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const base = `http://localhost:${PORT}`;
  const gtagRequests = [];
  const allRequests = [];
  const pageErrors = [];

  try {
    const page = await browser.newPage();
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('workercreated', (worker) => {
      console.log(`      worker created: ${worker.url()}`);
      worker.on('error', (error) => pageErrors.push(`worker: ${error.message}`));
      worker.on('console', (message) =>
        console.log(`      worker console: ${message.type()} ${message.text()}`)
      );
    });
    page.on('requestfailed', (request) =>
      console.log(`      request failed: ${request.url()} ${request.failure()?.errorText ?? ''}`)
    );
    page.on('response', (response) => {
      if (response.status() >= 400) console.log(`      HTTP ${response.status()}: ${response.url()}`);
    });

    // GA is blocked at the network layer through CDP, not with
    // page.setRequestInterception(): Fetch-based interception also pauses the
    // requests a dedicated worker makes for its wasm, and the worker then
    // never starts (the bcrypt hash hangs forever). Network.setBlockedURLs
    // still lets us observe that the page *tried* to load Analytics.
    const cdp = await page.createCDPSession();
    await cdp.send('Network.enable');
    await cdp.send('Network.setBlockedURLs', { urls: ['*://*.googletagmanager.com/*'] });
    cdp.on('Network.requestWillBeSent', (event) => {
      allRequests.push(event.request.url);
      if (event.request.url.includes('googletagmanager.com')) gtagRequests.push(event.request.url);
    });

    // --- prerendered routes are usable without JavaScript -------------------
    const noJs = await browser.newPage();
    await noJs.setJavaScriptEnabled(false);
    await noJs.goto(`${base}/uuid`, { waitUntil: 'domcontentloaded' });
    const preH1 = await noJs.$eval('h1.page-title', (el) => el.textContent.trim()).catch(() => '');
    const preLang = await noJs.$eval('html', (el) => el.lang).catch(() => '');
    check('prerendered /uuid has content without JS', preH1.length > 0, `h1="${preH1}" lang=${preLang}`);
    await noJs.goto(`${base}/x509`, { waitUntil: 'domcontentloaded' });
    const x509PreH1 = await noJs
      .$eval('h1.page-title', (el) => el.textContent.trim())
      .catch(() => '');
    check('prerendered /x509 has content without JS', x509PreH1.length > 0, `h1="${x509PreH1}"`);
    await noJs.close();

    // --- UUID (wasm, main thread) ------------------------------------------
    await page.goto(`${base}/uuid`, { waitUntil: 'networkidle2' });
    const uuidBefore = await page.$eval('.output', (el) => el.textContent.trim()).catch(() => '');
    await page.click('.card .row button');
    await page.waitForFunction(
      (previous) => {
        const el = document.querySelector('.output');
        return el && el.textContent.trim() !== previous;
      },
      { timeout: 10000 },
      uuidBefore
    );
    const uuid = await page.$eval('.output', (el) => el.textContent.trim());
    check('UUID v4 generated in wasm', isUuidV4(uuid), uuid);

    // --- client-side navigation must not re-inject Analytics ---------------
    const gtagBeforeSpa = gtagRequests.length;
    await page.click('nav a[href="/sha"]');
    await page.waitForFunction(() => location.pathname.endsWith('/sha'));
    check(
      'Analytics is not re-injected on client-side navigation',
      gtagRequests.length === gtagBeforeSpa,
      `${gtagBeforeSpa} -> ${gtagRequests.length}`
    );

    // --- SHA-256 (wasm, main thread) ---------------------------------------
    await page.goto(`${base}/sha`, { waitUntil: 'networkidle2' });
    await page.type('#sha-input', 'abc');
    await page.waitForFunction(
      () => document.querySelector('.output')?.textContent.trim().length === 64,
      { timeout: 10000 }
    );
    const sha = await page.$eval('.output', (el) => el.textContent.trim());
    check(
      'SHA-256("abc") matches the known digest',
      sha === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      sha.slice(0, 16) + '…'
    );

    // --- Base64 round trip (wasm) ------------------------------------------
    await page.goto(`${base}/base64`, { waitUntil: 'networkidle2' });
    await page.type('#base64-input', 'hello world');
    await page.click('.card .row button:not(.secondary)');
    await page.waitForFunction(() => document.querySelector('.output')?.textContent.trim().length > 0, {
      timeout: 10000,
    });
    const encoded = await page.$eval('.output', (el) => el.textContent.trim());
    await setInputValue(page, '#base64-input', encoded);
    await page.click('.card .row button.secondary');
    await page.waitForFunction(() => document.querySelector('.output')?.textContent.trim() === 'hello world', {
      timeout: 10000,
    });
    check('Base64 encode/decode round trip', encoded === 'aGVsbG8gd29ybGQ=', encoded);

    // --- JSON formatter (plain JS) -----------------------------------------
    await page.goto(`${base}/json`, { waitUntil: 'networkidle2' });
    await page.type('#json-input', '{"a":1,"b":[true,null]}');
    await page.click('.card .row button:not(.secondary)');
    await page.waitForSelector('.json-output', { timeout: 10000 });
    const formatted = await page.$eval('.json-output', (el) => el.textContent);
    check('JSON format', formatted.includes('"a": 1') && formatted.includes('\n'), formatted.replace(/\n/g, '⏎'));

    // --- X.509 decoder: separate wasm module, fetched only on demand -------
    check(
      'X.509 wasm module is not loaded before the tool is used',
      allRequests.filter(isX509Asset).length === 0,
      `${allRequests.filter(isX509Asset).length} asset(s)`
    );

    const certificatePem = await fs.readFile(
      path.resolve(ROOT, 'wasm-crate-x509/fixtures/cert.pem'),
      'utf8'
    );
    // Independent reference implementation: Node's own X.509 parser.
    const reference = new X509Certificate(certificatePem);
    const commonName = /CN=([^\n]+)/.exec(reference.subject)?.[1] ?? '';

    await page.goto(`${base}/x509`, { waitUntil: 'networkidle2' });
    await setInputValue(page, '#x509-input', certificatePem.trim());
    await page.waitForFunction(
      () => !document.querySelector('.card .row button:not(.secondary)').disabled
    );
    await page.click('.card .row button:not(.secondary)');
    await page.waitForSelector('.x509-field', { timeout: 30000 });
    const decoded = await page.$eval('.card', (el) => el.textContent);

    check('X.509 subject decoded', decoded.includes(`CN=${commonName}`), commonName);
    check(
      'X.509 extensions decoded',
      decoded.includes('subjectAltName') && decoded.includes('DNS:example.test'),
      'subjectAltName with SAN entry'
    );
    check(
      'X.509 SHA-256 fingerprint matches node:crypto',
      decoded.includes(reference.fingerprint256),
      reference.fingerprint256.slice(0, 17) + '…'
    );

    const x509Assets = allRequests.filter(isX509Asset);
    check(
      'X.509 wasm module loaded on demand',
      x509Assets.length >= 2,
      x509Assets.map((url) => url.split('/').pop()).join(', ')
    );

    // --- X.509 bundle of several certificates ------------------------------
    const chainPem = await fs.readFile(
      path.resolve(ROOT, 'wasm-crate-x509/fixtures/chain.pem'),
      'utf8'
    );
    await setInputValue(page, '#x509-input', chainPem.trim());
    await page.waitForFunction(
      () => !document.querySelector('.card .row button:not(.secondary)').disabled
    );
    await page.click('.card .row button:not(.secondary)');
    await page.waitForFunction(
      () => document.querySelectorAll('.x509-certificate').length === 2,
      { timeout: 30000 }
    );
    check('X.509 bundle decodes every certificate', true, '2 certificates rendered');

    // --- X.509 rejects garbage with a translated message -------------------
    await setInputValue(page, '#x509-input', 'definitely not a certificate');
    await page.waitForFunction(
      () => !document.querySelector('.card .row button:not(.secondary)').disabled
    );
    await page.click('.card .row button:not(.secondary)');
    await page.waitForSelector('.card .error', { timeout: 30000 });
    const x509Error = await page.$eval('.card .error', (el) => el.textContent.trim());
    check(
      'X.509 invalid input reports a localized error',
      x509Error.length > 0 && !/nom|Err\(|X509Error/.test(x509Error),
      x509Error
    );

    // --- bcrypt in a Web Worker, main thread stays responsive --------------
    await page.goto(`${base}/bcrypt`, { waitUntil: 'networkidle2' });
    await page.type('#bcrypt-password', 'correct horse battery staple');
    await setInputValue(page, '#bcrypt-cost', BCRYPT_COST);

    const hashRun = await page.evaluate(async () => {
      const button = document.querySelector('.card > button:not(.secondary)');
      let last = performance.now();
      let maxGap = 0;
      let frames = 0;
      let running = true;

      const tick = () => {
        const now = performance.now();
        maxGap = Math.max(maxGap, now - last);
        last = now;
        frames += 1;
        if (running) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      const start = performance.now();
      button.click();
      while (
        !document.querySelector('.card .output-with-copy') &&
        !document.querySelector('.card .error') &&
        performance.now() - start < 120000
      ) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      running = false;

      return {
        maxGap,
        frames,
        elapsed: performance.now() - start,
        cost: document.querySelector('#bcrypt-cost')?.value ?? '',
        password: document.querySelector('#bcrypt-password')?.value ?? '',
        buttonText: document.querySelector('.card > button:not(.secondary)')?.textContent ?? '',
        error: document.querySelector('.card .error')?.textContent ?? '',
      };
    });

    const bcryptHash = await page.$eval('.card .output-with-copy .output', (el) => el.textContent.trim()).catch(() => '');
    const workerLoaded = await page.evaluate(() =>
      performance.getEntriesByType('resource').some((entry) => entry.name.includes('bcrypt.worker'))
    );

    check(
      'bcrypt hash produced',
      new RegExp(`^\\$2[aby]\\$${BCRYPT_COST}\\$`).test(bcryptHash),
      `${bcryptHash.slice(0, 15)}… ${hashRun.error} cost=${hashRun.cost} password="${hashRun.password}" button="${hashRun.buttonText}"`
    );
    check('bcrypt ran in a Web Worker', workerLoaded);
    check(
      'main thread stayed responsive while hashing',
      hashRun.maxGap < 250 && hashRun.frames > 3 && hashRun.elapsed > 50,
      `maxGap=${hashRun.maxGap.toFixed(0)}ms frames=${hashRun.frames} elapsed=${hashRun.elapsed.toFixed(0)}ms`
    );

    // --- bcrypt verify ------------------------------------------------------
    await page.click('.tabs button:nth-child(2)');
    await page.waitForSelector('#bcrypt-verify-password');
    await page.type('#bcrypt-verify-password', 'correct horse battery staple');
    await page.type('#bcrypt-verify-hash', bcryptHash);
    await page.click('.card > button:not(.secondary)');
    await page.waitForSelector('.success, .error', { timeout: 60000 });
    const verifyText = await page.$eval('.card .success, .card .error', (el) => el.textContent.trim());
    check('bcrypt verify accepts the matching password', !!(await page.$('.success')), verifyText);

    // --- Analytics gate -----------------------------------------------------
    check(
      EXPECT_GA_OFF
        ? 'no Analytics request when VITE_GA_MEASUREMENT_ID is unset'
        : 'Analytics request attempted when VITE_GA_MEASUREMENT_ID is set',
      EXPECT_GA_OFF ? gtagRequests.length === 0 : gtagRequests.length > 0,
      `${gtagRequests.length} request(s) to googletagmanager.com`
    );

    check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  } finally {
    await browser.close();
    server.close();
  }

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
