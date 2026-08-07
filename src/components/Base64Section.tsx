import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import CopyButton from './CopyButton';
import { base64_encode, base64_decode } from '../wasm';

function Base64Section() {
  useSEO(
    'Base64 Encode / Decode — Free Online Base64 Tool',
    'Encode and decode standard or URL-safe Base64 strings online. Free, private, WebAssembly-powered — your data never leaves the browser.',
    '/base64'
  );

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const [error, setError] = useState('');

  const handleEncode = () => {
    setError('');
    try {
      setOutput(base64_encode(input, urlSafe));
    } catch (e) {
      setError(String(e));
    }
  };

  const handleDecode = () => {
    setError('');
    try {
      setOutput(base64_decode(input, urlSafe));
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <>
      <h1 className="page-title">Base64 Encode / Decode</h1>
      <div className="card">
        <h2>
          <span className="card-number">02</span> Base64 encode / decode
        </h2>
        <div className="field">
          <label htmlFor="base64-input">Input</label>
          <textarea
            id="base64-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type text here..."
          />
        </div>
        <div className="row">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
            />
            URL-safe alphabet
          </label>
        </div>
        <div className="row">
          <button onClick={handleEncode}>Encode</button>
          <button className="secondary" onClick={handleDecode}>
            Decode
          </button>
        </div>
        {output && (
          <div className="output-with-copy">
            <div className="output">{output}</div>
            <CopyButton text={output} />
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </div>
      <div className="seo-text">
        <p>
          Encode and decode <strong>Base64 strings</strong> online with optional URL-safe alphabet support.
          This free Base64 encoder and decoder runs entirely in your browser via WebAssembly,
          making it safe for sensitive data — nothing is uploaded to a server.
        </p>
      </div>
    </>
  );
}

export default Base64Section;
