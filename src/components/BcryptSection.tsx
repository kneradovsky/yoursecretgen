import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import CopyButton from './CopyButton';
import { useI18n } from '../i18n';
import { bcrypt_hash, bcrypt_verify } from '../wasm';

type Tab = 'hash' | 'verify';

function BcryptSection() {
  const { t } = useI18n();

  useSEO(t('bcrypt.seoTitle') as string, t('bcrypt.seoDescription') as string, '/bcrypt');

  const [tab, setTab] = useState<Tab>('hash');

  const [password, setPassword] = useState('');
  const [cost, setCost] = useState(10);
  const MIN_COST = 4;
  const [hashResult, setHashResult] = useState('');
  const [hashError, setHashError] = useState('');
  const [hashing, setHashing] = useState(false);

  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleHash = async () => {
    setHashError('');
    setHashResult('');
    setHashing(true);
    try {
      const result = bcrypt_hash(password, cost);
      setHashResult(result);
    } catch (e) {
      setHashError(String(e));
    } finally {
      setHashing(false);
    }
  };

  const handleVerify = async () => {
    setVerifyResult(null);
    setVerifying(true);
    try {
      const result = bcrypt_verify(verifyPassword, verifyHash);
      setVerifyResult(result);
    } finally {
      setVerifying(false);
    }
  };

  const costWarning = cost > 15 ? t('bcrypt.costWarning') : '';

  return (
    <>
      <h1 className="page-title">{t('bcrypt.pageTitle')}</h1>
      <div className="card">
        <h2>
          <span className="card-number">{t('bcrypt.cardNumber')}</span> {t('bcrypt.cardTitle')}
        </h2>
        <div className="tabs">
          <button className={tab === 'hash' ? 'active' : ''} onClick={() => setTab('hash')}>
            {t('bcrypt.tabHash')}
          </button>
          <button className={tab === 'verify' ? 'active' : ''} onClick={() => setTab('verify')}>
            {t('bcrypt.tabVerify')}
          </button>
        </div>

        {tab === 'hash' ? (
          <>
            <div className="field">
              <label htmlFor="bcrypt-password">{t('bcrypt.passwordLabel')}</label>
              <input
                id="bcrypt-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('bcrypt.passwordPlaceholder') as string}
              />
            </div>
            <div className="field">
              <label htmlFor="bcrypt-cost">
                {t('bcrypt.costLabel')} <span className="slider-value">{cost}</span>
              </label>
              <div className="slider-row">
                <span>{MIN_COST}</span>
                <input
                  id="bcrypt-cost"
                  type="range"
                  min={MIN_COST}
                  max={20}
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                />
                <span>20</span>
              </div>
              {costWarning && <p className="hint">{costWarning}</p>}
            </div>
            <button onClick={handleHash} disabled={hashing || !password}>
              {hashing ? t('bcrypt.hashingButton') : t('bcrypt.hashButton')}
            </button>
            {hashResult && (
              <>
                <label style={{ marginTop: 16, display: 'block' }}>{t('bcrypt.hashResultLabel')}</label>
                <div className="output-with-copy">
                  <div className="output">{hashResult}</div>
                  <CopyButton text={hashResult} />
                </div>
              </>
            )}
            {hashError && <div className="error">{hashError}</div>}
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="bcrypt-verify-password">{t('bcrypt.passwordLabel')}</label>
              <input
                id="bcrypt-verify-password"
                type="text"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                placeholder={t('bcrypt.passwordPlaceholder') as string}
              />
            </div>
            <div className="field">
              <label htmlFor="bcrypt-verify-hash">{t('bcrypt.hashInputLabel')}</label>
              <input
                id="bcrypt-verify-hash"
                type="text"
                value={verifyHash}
                onChange={(e) => setVerifyHash(e.target.value)}
                placeholder={t('bcrypt.hashInputPlaceholder') as string}
              />
            </div>
            <button onClick={handleVerify} disabled={verifying || !verifyPassword || !verifyHash}>
              {verifying ? t('bcrypt.verifyingButton') : t('bcrypt.verifyButton')}
            </button>
            {verifyResult !== null && (
              <div className={verifyResult ? 'success' : 'error'} style={{ marginTop: 12 }}>
                {verifyResult ? t('bcrypt.verifyMatch') : t('bcrypt.verifyNoMatch')}
              </div>
            )}
          </>
        )}
      </div>
      <div className="seo-text">
        <p>{t('bcrypt.seoText', { b: (children) => <strong>{children}</strong> })}</p>
      </div>
    </>
  );
}

export default BcryptSection;
