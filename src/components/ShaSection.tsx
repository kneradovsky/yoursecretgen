import { useMemo, useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import CopyButton from './CopyButton';
import { useI18n } from '../i18n';
import { sha1, sha256, sha512 } from '../wasm';

type Algorithm = 'sha1' | 'sha256' | 'sha512';

const ALGORITHMS: { value: Algorithm; label: string }[] = [
  { value: 'sha1', label: 'SHA-1' },
  { value: 'sha256', label: 'SHA-256' },
  { value: 'sha512', label: 'SHA-512' },
];

function ShaSection() {
  const { t } = useI18n();

  useSEO(t('sha.seoTitle') as string, t('sha.seoDescription') as string, '/sha');

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
      <h1 className="page-title">{t('sha.pageTitle')}</h1>
      <div className="card">
        <h2>
          <span className="card-number">{t('sha.cardNumber')}</span> {t('sha.cardTitle')}
        </h2>
        <div className="field">
          <label htmlFor="sha-input">{t('sha.inputLabel')}</label>
          <textarea
            id="sha-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sha.inputPlaceholder') as string}
          />
        </div>
        <div className="field">
          <label>{t('sha.algorithmLabel')}</label>
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
            <label>{t('sha.hashLabel')}</label>
            <div className="output-with-copy">
              <div className="output">{hash}</div>
              <CopyButton text={hash} />
            </div>
          </>
        )}
      </div>
      <div className="seo-text">
        <p>{t('sha.seoText', { b: (children) => <strong>{children}</strong> })}</p>
      </div>
    </>
  );
}

export default ShaSection;
