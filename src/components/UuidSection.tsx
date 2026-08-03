import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import { uuid_v4 } from '../wasm';

function UuidSection() {
  useSEO(
    'UUID v4 Generator — uuidhash',
    'Generate random UUID v4 identifiers locally in your browser using WebAssembly. No data is sent to any server.'
  );

  const [value, setValue] = useState('');

  const handleGenerate = () => {
    setValue(uuid_v4());
  };

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
    }
  };

  return (
    <div className="card">
      <h2>
        <span className="card-number">01</span> UUID v4
      </h2>
      <div className="row">
        <button onClick={handleGenerate}>Generate</button>
        <button className="secondary" onClick={handleCopy} disabled={!value}>
          Copy
        </button>
      </div>
      {value && <div className="output">{value}</div>}
      <p className="hint">Generated locally in WebAssembly, nothing leaves your browser.</p>
    </div>
  );
}

export default UuidSection;
