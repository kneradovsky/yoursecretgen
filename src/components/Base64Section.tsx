import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import CopyButton from './CopyButton';
import { useI18n } from '../i18n';
import { base64_encode, base64_decode } from '../wasm';

function Base64Section() {
  const { t } = useI18n();

  useSEO(t('base64.seoTitle') as string, t('base64.seoDescription') as string, '/base64');

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
      <h1 className="page-title">{t('base64.pageTitle')}</h1>
      <div className="card">
        <h2>
          <span className="card-number">{t('base64.cardNumber')}</span> {t('base64.cardTitle')}
        </h2>
        <div className="field">
          <label htmlFor="base64-input">{t('base64.inputLabel')}</label>
          <textarea
            id="base64-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('base64.inputPlaceholder') as string}
          />
        </div>
        <div className="row">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
            />
            {t('base64.urlSafeLabel')}
          </label>
        </div>
        <div className="row">
          <button onClick={handleEncode}>{t('base64.encode')}</button>
          <button className="secondary" onClick={handleDecode}>
            {t('base64.decode')}
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
        <p>{t('base64.seoText', { b: (children) => <strong>{children}</strong> })}</p>
      </div>
    </>
  );
}

export default Base64Section;
