import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import { base64_encode, base64_decode } from '../wasm';

function Base64Section() {
  useSEO(
    'Base64 Encode / Decode — uuidhash',
    'Encode and decode standard or URL-safe Base64 strings locally in your browser using WebAssembly. No data is sent to any server.'
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
      {output && <div className="output">{output}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default Base64Section;
