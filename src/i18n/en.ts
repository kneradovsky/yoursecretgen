const en = {
  siteTitle: 'Local Developer Tools',
  nav: {
    uuid: 'UUID',
    base64: 'Base64',
    sha: 'SHA',
    bcrypt: 'B-Crypt',
    json: 'JSON',
    x509: 'X.509',
  },
  common: {
    copy: 'Copy',
    copied: 'Copied!',
    invalidJson: 'Invalid JSON:',
  },
  home: {
    seoTitle: 'My Local Dev Tools — Free Local UUID, Base64, SHA, bcrypt, JSON & X.509 Tools',
    seoDescription:
      'Free privacy-first developer tools: UUID v4 generator, Base64 encoder/decoder, SHA-1/SHA-256/SHA-512 hash generator, bcrypt hash verifier, JSON formatter/validator and an X.509 certificate decoder. All runs locally in WebAssembly — no data sent to servers.',
    badge: '100% local processing',
    titleA: 'Your data ',
    titleB: 'never leaves',
    titleC: ' your browser',
    subtitle:
      'All hashing, encoding and generation runs inside WebAssembly on your device. No servers, no tracking, no network requests.',
    jsonLdName: 'My Local Dev Tools',
    jsonLdDescription:
      'Free privacy-first developer tools: UUID v4 generator, Base64 encoder/decoder, SHA-1/SHA-256/SHA-512 hash generator, bcrypt hash verifier, JSON formatter/validator and an X.509 certificate decoder. All runs locally in WebAssembly.',
    tools: {
      uuid: { title: 'UUID v4', desc: 'Generate random UUIDs instantly.' },
      base64: { title: 'Base64', desc: 'Encode and decode standard or URL-safe Base64.' },
      sha: { title: 'SHA hashes', desc: 'Compute SHA-1, SHA-256 and SHA-512 hashes.' },
      bcrypt: { title: 'bcrypt', desc: 'Hash and verify passwords with adjustable cost.' },
      json: { title: 'JSON', desc: 'Format, validate and minify JSON in the browser.' },
      x509: { title: 'X.509', desc: 'Decode certificate fields from PEM, DER or Base64.' },
    },
    seoText:
      '<b>Local Dev tools</b> is a free, privacy-first developer toolkit. Use it as a <b>UUID generator</b>, <b>Base64 encoder and decoder</b>, <b>SHA-1 / SHA-256 / SHA-512 hash generator</b>, <b>bcrypt hash and verify tool</b>, <b>JSON formatter and validator</b>, or an <b>X.509 certificate decoder</b>. Everything is compiled to WebAssembly and runs entirely in your browser, so sensitive strings, passwords, identifiers and certificates never touch a server.',
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
  x509: {
    seoTitle: 'X.509 Certificate Decoder — PEM, DER & Base64 Certificate Viewer',
    seoDescription:
      'Decode X.509 certificate fields in your browser: subject, issuer, validity, public key, fingerprints and extensions. PEM, DER or Base64 input, nothing is uploaded.',
    pageTitle: 'X.509 Certificate Decoder',
    cardNumber: '06',
    cardTitle: 'Certificate fields',
    inputLabel: 'Certificate (PEM, Base64 or DER)',
    inputPlaceholder: '-----BEGIN CERTIFICATE-----\nMIIB…\n-----END CERTIFICATE-----',
    parse: 'Decode',
    parsing: 'Decoding…',
    clear: 'Clear',
    chooseFile: 'Choose file',
    certificateOf: 'Certificate {index} of {total}',
    extensions: 'Extensions ({count})',
    critical: 'critical',
    valueNotRendered: 'Value not rendered',
    rawValueHint:
      'Not decoded yet — the raw DER value is shown as hex, the way openssl prints unknown extensions.',
    derSize: 'DER size: {bytes} bytes',
    errors: {
      empty: 'Enter a certificate first.',
      tooLarge: 'Input is too large for a certificate (limit: 1 MB).',
      invalidPem: 'The PEM block is malformed — check the BEGIN/END lines.',
      invalidCertificate:
        'This does not look like an X.509 certificate (PEM, Base64 or DER expected).',
    },
    fields: {
      subject: 'Subject',
      version: 'Version',
      serialNumber: 'Serial number',
      signatureAlgorithm: 'Signature algorithm',
      issuer: 'Issuer',
      validFrom: 'Valid from',
      validTo: 'Valid to',
      publicKeyAlgorithm: 'Public key algorithm',
      publicKey: 'Public key',
      rsaExponent: 'RSA exponent',
      signature: 'Signature',
      sha1Fingerprint: 'SHA-1 fingerprint',
      sha256Fingerprint: 'SHA-256 fingerprint',
    },
    seoText:
      'Decode an <b>X.509 certificate</b> and read its fields the way <b>openssl x509 -text</b> prints them: version, serial number, subject and issuer, validity dates, public key, SHA-1/SHA-256 fingerprints and the full extension list. The parser is compiled to WebAssembly and runs entirely in your browser, so certificates — including internal ones — are never uploaded. It only describes the certificate: no signature, chain or revocation checks are performed.',
  },
  footer: {
    privacy:
      'All transformations are performed in your browser only. No data sent to any server.',
    cryptoTitle: 'Crypto donations:',
  },
};

export default en;
