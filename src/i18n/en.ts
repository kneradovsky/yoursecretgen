const en = {
  siteTitle: 'Local Developer Tools',
  nav: {
    uuid: 'UUID',
    base64: 'Base64',
    sha: 'SHA',
    bcrypt: 'B-Crypt',
    json: 'JSON',
  },
  common: {
    copy: 'Copy',
    copied: 'Copied!',
    invalidJson: 'Invalid JSON:',
  },
  home: {
    seoTitle: 'My Local Dev Tools — Free Local UUID, Base64, SHA, bcrypt & JSON Tools',
    seoDescription:
      'Free privacy-first developer tools: UUID v4 generator, Base64 encoder/decoder, SHA-1/SHA-256/SHA-512 hash generator, bcrypt hash verifier, and JSON formatter/validator. All runs locally in WebAssembly — no data sent to servers.',
    badge: '100% local processing',
    titleA: 'Your data ',
    titleB: 'never leaves',
    titleC: ' your browser',
    subtitle:
      'All hashing, encoding and generation runs inside WebAssembly on your device. No servers, no tracking, no network requests.',
    jsonLdName: 'My Local Dev Tools',
    jsonLdDescription:
      'Free privacy-first developer tools: UUID v4 generator, Base64 encoder/decoder, SHA-1/SHA-256/SHA-512 hash generator, bcrypt hash verifier, and JSON formatter/validator. All runs locally in WebAssembly.',
    tools: {
      uuid: { title: 'UUID v4', desc: 'Generate random UUIDs instantly.' },
      base64: { title: 'Base64', desc: 'Encode and decode standard or URL-safe Base64.' },
      sha: { title: 'SHA hashes', desc: 'Compute SHA-1, SHA-256 and SHA-512 hashes.' },
      bcrypt: { title: 'bcrypt', desc: 'Hash and verify passwords with adjustable cost.' },
      json: { title: 'JSON', desc: 'Format, validate and minify JSON in the browser.' },
    },
    seoText:
      '<b>Local Dev tools</b> is a free, privacy-first developer toolkit. Use it as a <b>UUID generator</b>, <b>Base64 encoder and decoder</b>, <b>SHA-1 / SHA-256 / SHA-512 hash generator</b>, <b>bcrypt hash and verify tool</b>, or <b>JSON formatter and validator</b>. Everything is compiled to WebAssembly and runs entirely in your browser, so sensitive strings, passwords and identifiers never touch a server.',
  },
  uuid: {
    seoTitle: 'UUID v4 Generator — Free Online Random UUID Tool',
    seoDescription:
      'Generate random UUID v4 identifiers instantly in your browser. Fast, private, WebAssembly-powered UUID generator — no data sent to any server.',
    pageTitle: 'UUID v4 Generator',
    cardNumber: '01',
    cardTitle: 'UUID v4',
    generate: 'Generate',
    hint: 'Generated locally in WebAssembly, nothing leaves your browser.',
    seoText:
      'Generate <b>random UUID v4 identifiers</b> instantly with this free online UUID generator. Every identifier is created locally in your browser using WebAssembly, so no data is transmitted to any server. Use it for database keys, session IDs, API tokens, or any scenario that needs a unique, privacy-safe identifier.',
  },
  base64: {
    seoTitle: 'Base64 Encode / Decode — Free Online Base64 Tool',
    seoDescription:
      'Encode and decode standard or URL-safe Base64 strings online. Free, private, WebAssembly-powered — your data never leaves the browser.',
    pageTitle: 'Base64 Encode / Decode',
    cardNumber: '02',
    cardTitle: 'Base64 encode / decode',
    inputLabel: 'Input',
    inputPlaceholder: 'Type text here...',
    urlSafeLabel: 'URL-safe alphabet',
    encode: 'Encode',
    decode: 'Decode',
    seoText:
      'Encode and decode <b>Base64 strings</b> online with optional URL-safe alphabet support. This free Base64 encoder and decoder runs entirely in your browser via WebAssembly, making it safe for sensitive data — nothing is uploaded to a server.',
  },
  sha: {
    seoTitle: 'SHA-1 / SHA-256 / SHA-512 Hash Generator — Free Online',
    seoDescription:
      'Free online SHA hash generator. Compute SHA-1, SHA-256 and SHA-512 hashes locally in your browser with WebAssembly. No server uploads, private and fast.',
    pageTitle: 'SHA-1 / SHA-256 / SHA-512 Hash Generator',
    cardNumber: '03',
    cardTitle: 'SHA hashes',
    inputLabel: 'Input string',
    inputPlaceholder: 'Type text here...',
    algorithmLabel: 'Algorithm',
    hashLabel: 'Hash (hex)',
    seoText:
      'Compute <b>SHA-1, SHA-256 and SHA-512 hashes</b> instantly in your browser. This free online hash generator uses WebAssembly for fast local processing: your input never leaves the device, so it is safe for sensitive strings and passwords.',
  },
  bcrypt: {
    seoTitle: 'bcrypt Hash & Verify — Free Online Password Hash Tool',
    seoDescription:
      'Generate and verify bcrypt password hashes online with adjustable cost factor. Runs locally in WebAssembly — passwords never leave your browser.',
    pageTitle: 'bcrypt Hash & Verify',
    cardNumber: '04',
    cardTitle: 'B-Crypt',
    tabHash: 'Hash',
    tabVerify: 'Verify',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password...',
    hashInputLabel: 'Hash',
    hashInputPlaceholder: '$2b$10$...',
    costLabel: 'Cost factor:',
    costWarning: 'High cost values can be very slow in the browser.',
    hashButton: 'Generate hash',
    hashingButton: 'Hashing...',
    hashResultLabel: 'Hash',
    verifyButton: 'Verify',
    verifyingButton: 'Verifying...',
    verifyMatch: 'Password matches the hash.',
    verifyNoMatch: 'Password does not match.',
    seoText:
      'Generate and verify <b>bcrypt password hashes</b> online with a customizable cost factor. This free bcrypt tool hashes and checks passwords locally in your browser using WebAssembly, so credentials never touch a remote server.',
  },
  json: {
    seoTitle: 'JSON Formatter — Free Online JSON Beautifier & Validator',
    seoDescription:
      'Format, beautify, validate and minify JSON online. Free, private, browser-based JSON formatter — your data never leaves the browser.',
    pageTitle: 'JSON Formatter',
    cardNumber: '05',
    cardTitle: 'JSON format / minify',
    inputLabel: 'Input JSON',
    indentLabel: 'Indent:',
    spaceOne: 'space',
    spaceFew: 'spaces',
    spaceMany: 'spaces',
    format: 'Format',
    minify: 'Minify',
    seoText:
      'Format and validate <b>JSON</b> online with this free privacy-first formatter. Paste raw JSON, click <b>Format</b> to beautify it, or <b>Minify</b> to compress it. Everything runs in your browser — no data is uploaded to a server.',
  },
  footer: {
    privacy:
      'All transformations are performed in your browser only. No data sent to any server.',
    cryptoTitle: 'Crypto donations:',
  },
};

export default en;
