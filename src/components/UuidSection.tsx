import { useState, useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';
import { uuid_v4 } from '../wasm';
import CopyButton from './CopyButton';
import { useI18n } from '../i18n';

function UuidSection() {
  const { t } = useI18n();

  useSEO(t('uuid.seoTitle') as string, t('uuid.seoDescription') as string, '/uuid');

  const [value, setValue] = useState('');

  const handleGenerate = () => {
    setValue(uuid_v4());
  };


  useEffect(() => {
    handleGenerate()
  },[])

  return (
    <>
      <h1 className="page-title">{t('uuid.pageTitle')}</h1>
      <div className="card">
        <h2>
          <span className="card-number">{t('uuid.cardNumber')}</span> {t('uuid.cardTitle')}
        </h2>
        <div className="row">
          <button onClick={handleGenerate}>{t('uuid.generate')}</button>
        </div>
        <div className="output-with-copy">
        {value && <div className="output">{value}</div>}<CopyButton text={value}/>
        </div>
        <p className="hint">{t('uuid.hint')}</p>
      </div>
      <div className="seo-text">
        <p>{t('uuid.seoText', { b: (children) => <strong>{children}</strong> })}</p>
      </div>
    </>
  );
}

export default UuidSection;
