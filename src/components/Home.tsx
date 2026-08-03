import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

const TOOLS = [
  { to: '/uuid', title: 'UUID v4', desc: 'Generate random UUIDs instantly.' },
  { to: '/base64', title: 'Base64', desc: 'Encode and decode standard or URL-safe Base64.' },
  { to: '/sha', title: 'SHA hashes', desc: 'Compute SHA-1, SHA-256 and SHA-512 hashes.' },
  { to: '/bcrypt', title: 'bcrypt', desc: 'Hash and verify passwords with adjustable cost.' },
];

function Home() {
  useSEO(
    'uuidhash — Local UUID, Base64, SHA & bcrypt tools in WebAssembly',
    'Free online developer tools for UUID v4 generation, Base64 encoding/decoding, SHA-1/SHA-256/SHA-512 hashing, and bcrypt password hashing. All processing runs locally in your browser via WebAssembly — no data is sent to servers.'
  );

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

      <div className="home-actions">
        <Link to="/uuid" className="primary">Get started</Link>
        <Link to="/sha" className="secondary">SHA hashes</Link>
      </div>

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
          <strong>uuidhash</strong> is a free, privacy-first developer toolkit.
          Use it as a <strong>UUID generator</strong>, <strong>Base64 encoder and decoder</strong>,
          <strong> SHA-1 / SHA-256 / SHA-512 hash generator</strong>, or
          <strong> bcrypt hash and verify tool</strong>. Everything is compiled to WebAssembly and runs
          entirely in your browser, so sensitive strings, passwords and identifiers never touch a server.
        </p>
      </div>
    </div>
  );
}

export default Home;
