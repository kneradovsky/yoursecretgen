import { useState, useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';
import { uuid_v4 } from '../wasm';
import CopyButton from './CopyButton';

function UuidSection() {
  useSEO(
    'UUID v4 Generator — Free Online Random UUID Tool',
    'Generate random UUID v4 identifiers instantly in your browser. Fast, private, WebAssembly-powered UUID generator — no data sent to any server.',
    '/uuid'
  );

  const [value, setValue] = useState('');

  const handleGenerate = () => {
    setValue(uuid_v4());
  };


  useEffect(() => {
    handleGenerate()
  },[])

  return (
    <>
      <h1 className="page-title">UUID v4 Generator</h1>
      <div className="card">
        <h2>
          <span className="card-number">01</span> UUID v4
        </h2>
        <div className="row">
          <button onClick={handleGenerate}>Generate</button>
        </div>
        <div className="output-with-copy">
        {value && <div className="output">{value}</div>}<CopyButton text={value}/>
        </div>
        <p className="hint">Generated locally in WebAssembly, nothing leaves your browser.</p>
      </div>
      <div className="seo-text">
        <p>
          Generate <strong>random UUID v4 identifiers</strong> instantly with this free online UUID generator.
          Every identifier is created locally in your browser using WebAssembly, so no data is transmitted to any server.
          Use it for database keys, session IDs, API tokens, or any scenario that needs a unique, privacy-safe identifier.
        </p>
      </div>
    </>
  );
}

export default UuidSection;
