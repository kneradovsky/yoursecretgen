import { useState, useCallback } from 'react';
import { useSEO } from '../hooks/useSEO';
import CopyButton from './CopyButton';

const DEFAULT_INDENT = 2;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightJson(json: string): string {
  return escapeHtml(json).replace(
    /("(?:[^"\\]|\\.)*")(\s*:\s*)?|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\]])/g,
    (match, string, colon, boolOrNull, number, bracket) => {
      if (string !== undefined) {
        if (colon !== undefined) {
          return `<span class="json-key">${string}</span><span class="json-colon">${colon}</span>`;
        }
        return `<span class="json-string">${string}</span>`;
      }
      if (boolOrNull !== undefined) {
        return `<span class="json-literal">${boolOrNull}</span>`;
      }
      if (number !== undefined) {
        return `<span class="json-number">${number}</span>`;
      }
      if (bracket !== undefined) {
        return `<span class="json-bracket">${bracket}</span>`;
      }
      return match;
    }
  );
}

function JsonSection() {
  useSEO(
    'JSON Formatter — Free Online JSON Beautifier & Validator',
    'Format, beautify, validate and minify JSON online. Free, private, browser-based JSON formatter — your data never leaves the browser.',
    '/json'
  );

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState(DEFAULT_INDENT);
  const [error, setError] = useState('');

  const handleFormat = useCallback(() => {
    setError('');
    if (!input.trim()) {
      setOutput('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
    } catch (e) {
      setError(`Invalid JSON: ${String(e)}`);
      setOutput('');
    }
  }, [input, indent]);

  const handleMinify = useCallback(() => {
    setError('');
    if (!input.trim()) {
      setOutput('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch (e) {
      setError(`Invalid JSON: ${String(e)}`);
      setOutput('');
    }
  }, [input]);

  const handleIndentChange = useCallback((value: number) => {
    setIndent(value);
    if (output && !error) {
      try {
        const parsed = JSON.parse(input);
        setOutput(JSON.stringify(parsed, null, value));
      } catch {
        // keep existing output if input became invalid
      }
    }
  }, [output, error, input]);

  return (
    <>
      <h1 className="page-title">JSON Formatter</h1>
      <div className="card">
        <h2>
          <span className="card-number">05</span> JSON format / minify
        </h2>
        <div className="field">
          <label htmlFor="json-input">Input JSON</label>
          <textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"hello": "world", "numbers": [1, 2, 3]}'
          />
        </div>
        <div className="slider-row">
          <label htmlFor="json-indent">Indent:</label>
          <input
            id="json-indent"
            type="range"
            min={0}
            max={8}
            step={2}
            value={indent}
            onChange={(e) => handleIndentChange(Number(e.target.value))}
          />
          <span className="slider-value">{indent}&nbsp;spaces</span>
        </div>
        <div className="row">
          <button onClick={handleFormat}>Format</button>
          <button className="secondary" onClick={handleMinify}>
            Minify
          </button>
        </div>
        {output && !error && (
          <div className="output-with-copy">
            <pre
              className="output json-output"
              dangerouslySetInnerHTML={{ __html: highlightJson(output) }}
            />
            <CopyButton text={output} />
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </div>
      <div className="seo-text">
        <p>
          Format and validate <strong>JSON</strong> online with this free privacy-first formatter.
          Paste raw JSON, click <strong>Format</strong> to beautify it, or <strong>Minify</strong> to compress it.
          Everything runs in your browser — no data is uploaded to a server.
        </p>
      </div>
    </>
  );
}

export default JsonSection;
