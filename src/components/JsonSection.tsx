import { useState, useCallback } from 'react';
import { useSEO } from '../hooks/useSEO';
import CopyButton from './CopyButton';
import { plural, useI18n } from '../i18n';

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
  const { lang, t } = useI18n();

  useSEO(t('json.seoTitle') as string, t('json.seoDescription') as string, '/json');

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
      setError(`${t('common.invalidJson')} ${String(e)}`);
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
      setError(`${t('common.invalidJson')} ${String(e)}`);
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

  const spacesLabel = plural(
    lang,
    indent,
    t('json.spaceOne') as string,
    t('json.spaceFew') as string,
    t('json.spaceMany') as string
  );

  return (
    <>
      <h1 className="page-title">{t('json.pageTitle')}</h1>
      <div className="card">
        <h2>
          <span className="card-number">{t('json.cardNumber')}</span> {t('json.cardTitle')}
        </h2>
        <div className="field">
          <label htmlFor="json-input">{t('json.inputLabel')}</label>
          <textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"hello": "world", "numbers": [1, 2, 3]}'
          />
        </div>
        <div className="slider-row">
          <label htmlFor="json-indent">{t('json.indentLabel')}</label>
          <input
            id="json-indent"
            type="range"
            min={0}
            max={8}
            step={2}
            value={indent}
            onChange={(e) => handleIndentChange(Number(e.target.value))}
          />
          <span className="slider-value">{indent}&nbsp;{spacesLabel}</span>
        </div>
        <div className="row">
          <button onClick={handleFormat}>{t('json.format')}</button>
          <button className="secondary" onClick={handleMinify}>
            {t('json.minify')}
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
        <p>{t('json.seoText', { b: (children) => <strong>{children}</strong> })}</p>
      </div>
    </>
  );
}

export default JsonSection;
