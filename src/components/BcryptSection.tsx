import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import CopyButton from './CopyButton';
import { bcrypt_hash, bcrypt_verify } from '../wasm';

type Tab = 'hash' | 'verify';

function BcryptSection() {
  useSEO(
    'bcrypt Hash & Verify — My Local Dev Tools',
    'Generate and verify bcrypt password hashes locally in your browser using WebAssembly. Adjustable cost factor, no server uploads.'
  );

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

  const costWarning = cost > 15 ? 'High cost values can be very slow in the browser.' : '';

  return (
    <div className="card">
      <h2>
        <span className="card-number">04</span> B-Crypt
      </h2>
      <div className="tabs">
        <button className={tab === 'hash' ? 'active' : ''} onClick={() => setTab('hash')}>
          Hash
        </button>
        <button className={tab === 'verify' ? 'active' : ''} onClick={() => setTab('verify')}>
          Verify
        </button>
      </div>

      {tab === 'hash' ? (
        <>
          <div className="field">
            <label htmlFor="bcrypt-password">Password</label>
            <input
              id="bcrypt-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
            />
          </div>
          <div className="field">
            <label htmlFor="bcrypt-cost">Cost factor: <span className="slider-value">{cost}</span></label>
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
            {hashing ? 'Hashing...' : 'Generate hash'}
          </button>
          {hashResult && (
            <>
              <label style={{ marginTop: 16, display: 'block' }}>Hash</label>
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
            <label htmlFor="bcrypt-verify-password">Password</label>
            <input
              id="bcrypt-verify-password"
              type="text"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              placeholder="Enter password..."
            />
          </div>
          <div className="field">
            <label htmlFor="bcrypt-verify-hash">Hash</label>
            <input
              id="bcrypt-verify-hash"
              type="text"
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.target.value)}
              placeholder="$2b$10$..."
            />
          </div>
          <button onClick={handleVerify} disabled={verifying || !verifyPassword || !verifyHash}>
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
          {verifyResult !== null && (
            <div className={verifyResult ? 'success' : 'error'} style={{ marginTop: 12 }}>
              {verifyResult ? 'Password matches the hash.' : 'Password does not match.'}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BcryptSection;
