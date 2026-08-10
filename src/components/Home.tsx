import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';

const SITE_URL = 'https://mylocaltools.dev';

const TOOLS = [
  { to: '/uuid', title: 'UUID v4', desc: 'Generate random UUIDs instantly.' },
  { to: '/base64', title: 'Base64', desc: 'Encode and decode standard or URL-safe Base64.' },
  { to: '/sha', title: 'SHA hashes', desc: 'Compute SHA-1, SHA-256 and SHA-512 hashes.' },
  { to: '/bcrypt', title: 'bcrypt', desc: 'Hash and verify passwords with adjustable cost.' },
  { to: '/json', title: 'JSON', desc: 'Format, validate and minify JSON in the browser.' },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'My Local Dev Tools',
  url: SITE_URL,
  description:
    'Free privacy-first developer tools: UUID v4 generator, Base64 encoder/decoder, SHA-1/SHA-256/SHA-512 hash generator, bcrypt hash verifier, and JSON formatter/validator. All runs locally in WebAssembly.',
  sameAs: ['https://github.com/kneradovsky/yoursecretgen'],
};

function Home() {
  useSEO(
    'My Local Dev Tools — Free Local UUID, Base64, SHA, bcrypt & JSON Tools',
    'Free privacy-first developer tools: UUID v4 generator, Base64 encoder/decoder, SHA-1/SHA-256/SHA-512 hash generator, bcrypt hash verifier, and JSON formatter/validator. All runs locally in WebAssembly — no data sent to servers.',
    '/'
  );

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jsonld-website';
    script.text = JSON.stringify(JSON_LD);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('jsonld-website');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  return (
    <div className="home">
      <div className="badge">
        <span className="lock-icon" aria-hidden="true">🔒</span>
        100% local processing
      </div>

      <h1>
        Your data <span className="gradient">never leaves</span> your browser
      </h1>

      <p className="home-subtitle">
        All hashing, encoding and generation runs inside WebAssembly on your device.
        No servers, no tracking, no network requests.
      </p>

      <div className="features">
        {TOOLS.map((tool) => (
          <Link key={tool.to} to={tool.to} className="feature-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3>{tool.title}</h3>
            <p>{tool.desc}</p>
          </Link>
        ))}
      </div>

      <div className="seo-text">
        <p>
          <strong>Local Dev tools</strong> is a free, privacy-first developer toolkit.
          Use it as a <strong>UUID generator</strong>, <strong>Base64 encoder and decoder</strong>,
          <strong> SHA-1 / SHA-256 / SHA-512 hash generator</strong>, <strong>bcrypt hash and verify tool</strong>,
          or <strong>JSON formatter and validator</strong>. Everything is compiled to WebAssembly and runs
          entirely in your browser, so sensitive strings, passwords and identifiers never touch a server.
        </p>
      </div>
    </div>
  );
}

export default Home;
