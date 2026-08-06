import { useState, useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';
import { uuid_v4 } from '../wasm';
import CopyButton from './CopyButton';

function UuidSection() {
  useSEO(
    'UUID v4 Generator — My Local Dev Tools',
    'Generate random UUID v4 identifiers locally in your browser using WebAssembly. No data is sent to any server.'
  );

  const [value, setValue] = useState('');

  const handleGenerate = () => {
    setValue(uuid_v4());
  };


  useEffect(() => {
    handleGenerate()
  },[])

  return (
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
  );
}

export default UuidSection;
