import { useMemo, useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import CopyButton from './CopyButton';
import { sha1, sha256, sha512 } from '../wasm';

type Algorithm = 'sha1' | 'sha256' | 'sha512';

const ALGORITHMS: { value: Algorithm; label: string }[] = [
  { value: 'sha1', label: 'SHA-1' },
  { value: 'sha256', label: 'SHA-256' },
  { value: 'sha512', label: 'SHA-512' },
];

function ShaSection() {
  useSEO(
    'SHA-1 / SHA-256 / SHA-512 Hash Generator — Free Online',
    'Free online SHA hash generator. Compute SHA-1, SHA-256 and SHA-512 hashes locally in your browser with WebAssembly. No server uploads, private and fast.',
    '/sha'
  );

  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('sha256');

  const hash = useMemo(() => {
    if (!input) return '';
    switch (algorithm) {
      case 'sha1':
        return sha1(input);
      case 'sha256':
        return sha256(input);
      case 'sha512':
        return sha512(input);
    }
  }, [input, algorithm]);

  return (
    <>
      <h1 className="page-title">SHA-1 / SHA-256 / SHA-512 Hash Generator</h1>
      <div className="card">
        <h2>
          <span className="card-number">03</span> SHA hashes
        </h2>
        <div className="field">
          <label htmlFor="sha-input">Input string</label>
          <textarea
            id="sha-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type text here..."
          />
        </div>
        <div className="field">
          <label>Algorithm</label>
          <div className="row">
            {ALGORITHMS.map((alg) => (
              <label key={alg.value} className="checkbox">
                <input
                  type="radio"
                  name="sha-algorithm"
                  value={alg.value}
                  checked={algorithm === alg.value}
                  onChange={() => setAlgorithm(alg.value)}
                />
                {alg.label}
              </label>
            ))}
          </div>
        </div>
        {hash && (
          <>
            <label>Hash (hex)</label>
            <div className="output-with-copy">
              <div className="output">{hash}</div>
              <CopyButton text={hash} />
            </div>
          </>
        )}
      </div>
      <div className="seo-text">
        <p>
          Compute <strong>SHA-1, SHA-256 and SHA-512 hashes</strong> instantly in your browser.
          This free online hash generator uses WebAssembly for fast local processing:
          your input never leaves the device, so it is safe for sensitive strings and passwords.
        </p>
      </div>
    </>
  );
}

export default ShaSection;
