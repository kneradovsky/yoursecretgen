import { useCallback, useRef, useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import CopyButton from './CopyButton';
import { useI18n, type TranslationKey } from '../i18n';
import {
  parseCertificates,
  X509ParseError,
  type Certificate,
  type DnPart,
  type X509ErrorCode,
} from '../wasm-x509';

/**
 * Field keys come from the wasm module, so they are mapped to translation keys
 * explicitly: this keeps `t()` type-checked and degrades to the raw key if the
 * module ever reports a field this UI does not know yet.
 */
const FIELD_LABELS: Record<string, TranslationKey> = {
  version: 'x509.fields.version',
  serialNumber: 'x509.fields.serialNumber',
  signatureAlgorithm: 'x509.fields.signatureAlgorithm',
  issuer: 'x509.fields.issuer',
  validFrom: 'x509.fields.validFrom',
  validTo: 'x509.fields.validTo',
  publicKeyAlgorithm: 'x509.fields.publicKeyAlgorithm',
  publicKey: 'x509.fields.publicKey',
  rsaExponent: 'x509.fields.rsaExponent',
  signature: 'x509.fields.signature',
  sha1Fingerprint: 'x509.fields.sha1Fingerprint',
  sha256Fingerprint: 'x509.fields.sha256Fingerprint',
};

/** Long hex values (fingerprints, raw extension dumps) read better in monospace. */
const MONOSPACE_FIELDS = new Set(['sha1Fingerprint', 'sha256Fingerprint']);

/** The module reports stable codes; the wording lives in the dictionaries. */
const ERROR_MESSAGES: Record<X509ErrorCode, TranslationKey> = {
  empty_input: 'x509.errors.empty',
  input_too_large: 'x509.errors.tooLarge',
  invalid_pem: 'x509.errors.invalidPem',
  invalid_certificate: 'x509.errors.invalidCertificate',
};

function formatDn(parts: DnPart[] | undefined): string {
  if (!parts || parts.length === 0) return '—';
  return parts.map((part) => `${part.abbr}=${part.value}`).join(', ');
}

function X509Section() {
  const { t } = useI18n();

  useSEO(t('x509.seoTitle') as string, t('x509.seoDescription') as string, '/x509');

  const [input, setInput] = useState('');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parse = useCallback(
    async (bytes: Uint8Array) => {
      setError('');
      setCertificates([]);
      setLoading(true);
      try {
        const result = await parseCertificates(bytes);
        setCertificates(result.certificates);
      } catch (caught) {
        setError(
          caught instanceof X509ParseError
            ? (t(ERROR_MESSAGES[caught.code]) as string)
            : String(caught)
        );
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const handleParse = useCallback(() => {
    if (!input.trim()) {
      setCertificates([]);
      setError('');
      return;
    }
    void parse(new TextEncoder().encode(input));
  }, [input, parse]);

  const handleClear = useCallback(() => {
    setInput('');
    setCertificates([]);
    setError('');
  }, []);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      const bytes = new Uint8Array(await file.arrayBuffer());
      // Keep the textarea in sync for text formats so the input stays editable.
      if (/\.(pem|crt|cer|txt)$/i.test(file.name)) {
        setInput(new TextDecoder().decode(bytes));
      } else {
        setInput('');
      }
      await parse(bytes);
    },
    [parse]
  );

  return (
    <>
      <h1 className="page-title">{t('x509.pageTitle')}</h1>
      <div className="card">
        <h2>
          <span className="card-number">{t('x509.cardNumber')}</span> {t('x509.cardTitle')}
        </h2>
        <div className="field">
          <label htmlFor="x509-input">{t('x509.inputLabel')}</label>
          <textarea
            id="x509-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('x509.inputPlaceholder') as string}
            spellCheck={false}
          />
        </div>
        <div className="row">
          <button onClick={handleParse} disabled={loading || !input.trim()}>
            {loading ? t('x509.parsing') : t('x509.parse')}
          </button>
          <button className="secondary" onClick={handleClear} disabled={loading}>
            {t('x509.clear')}
          </button>
          <button
            className="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {t('x509.chooseFile')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pem,.crt,.cer,.der,.txt"
            className="x509-file-input"
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </div>
        {error && <div className="error">{error}</div>}

        {certificates.map((certificate, index) => (
          <div className="x509-certificate" key={index}>
            {certificates.length > 1 && (
              <h3 className="x509-certificate-title">
                {t('x509.certificateOf', {
                  index: index + 1,
                  total: certificates.length,
                })}
              </h3>
            )}

            <dl className="x509-subject">
              <dt>{t('x509.fields.subject')}</dt>
              <dd>{formatDn(certificate.subject)}</dd>
              <dt>{t('x509.fields.issuer')}</dt>
              <dd>{formatDn(certificate.issuer)}</dd>
            </dl>

            <dl className="x509-fields">
              {certificate.fields.map((field) => (
                <div className="x509-field" key={field.key}>
                  <dt>{FIELD_LABELS[field.key] ? t(FIELD_LABELS[field.key]) : field.key}</dt>
                  <dd className={MONOSPACE_FIELDS.has(field.key) ? 'x509-mono' : undefined}>
                    {field.value}
                    {field.key === 'sha256Fingerprint' && <CopyButton text={field.value} />}
                  </dd>
                </div>
              ))}
            </dl>

            <h3 className="x509-extensions-title">
              {t('x509.extensions', { count: certificate.extensions.length })}
            </h3>
            <ul className="x509-extensions">
              {certificate.extensions.map((extension) => (
                <li className="x509-extension" key={extension.oid + extension.value.slice(0, 16)}>
                  <div className="x509-extension-head">
                    <span className="x509-extension-name">{extension.name}</span>
                    <code className="x509-extension-oid">{extension.oid}</code>
                    {extension.critical && (
                      <span className="x509-critical">{t('x509.critical')}</span>
                    )}
                  </div>
                  {extension.description && (
                    <div className="x509-extension-description">{extension.description}</div>
                  )}
                  {extension.value ? (
                    <div className={extension.raw ? 'x509-mono x509-raw' : 'x509-value'}>
                      {extension.value}
                    </div>
                  ) : (
                    <div className="x509-value x509-muted">{t('x509.valueNotRendered')}</div>
                  )}
                  {extension.raw && <div className="x509-muted">{t('x509.rawValueHint')}</div>}
                </li>
              ))}
            </ul>

            <div className="x509-pem">
              <span className="x509-muted">
                {t('x509.derSize', { bytes: certificate.derSize })}
              </span>
              <CopyButton text={certificate.pem} />
            </div>
          </div>
        ))}
      </div>
      <div className="seo-text">
        <p>{t('x509.seoText', { b: (children) => <strong>{children}</strong> })}</p>
      </div>
    </>
  );
}

export default X509Section;
