export interface DnPart {
  abbr: string;
  value: string;
}

export interface CertificateField {
  key: string;
  value: string;
}

export interface CertificateExtension {
  oid: string;
  name: string;
  description: string;
  critical: boolean;
  /** True when the module does not model this extension and `value` is raw hex. */
  raw: boolean;
  value: string;
}

export interface Certificate {
  subject: DnPart[];
  issuer: DnPart[];
  fields: CertificateField[];
  extensions: CertificateExtension[];
  pem: string;
  derSize: number;
}

export interface X509ParseResult {
  certificates: Certificate[];
}

/** Stable codes thrown by the wasm module; the UI translates them. */
export type X509ErrorCode =
  | 'empty_input'
  | 'input_too_large'
  | 'invalid_pem'
  | 'invalid_certificate';

const ERROR_CODES = new Set<string>([
  'empty_input',
  'input_too_large',
  'invalid_pem',
  'invalid_certificate',
]);

export class X509ParseError extends Error {
  readonly code: X509ErrorCode;

  constructor(code: X509ErrorCode) {
    super(code);
    this.name = 'X509ParseError';
    this.code = code;
  }
}

/**
 * Loads the X.509 wasm module on demand and parses one or more certificates.
 *
 * The module is ~215 KB (about 85 KB gzipped) and lives in its own crate, so the
 * dynamic import below is what keeps it out of the entry chunk: it is fetched
 * only when this function is first called, i.e. when someone actually uses the
 * X.509 tool. Every other page never downloads it.
 *
 * Accepts PEM, bare base64 or DER bytes.
 */
export async function parseCertificates(input: Uint8Array): Promise<X509ParseResult> {
  const { x509_describe } = await import('../wasm-crate-x509/pkg/uuidhash_x509_wasm.js');

  let json: string;
  try {
    json = x509_describe(input);
  } catch (thrown) {
    // wasm-bindgen rejects with the JsValue string; anything unexpected is
    // reported as an invalid certificate rather than leaked to the UI.
    const code = String(thrown);
    throw new X509ParseError(ERROR_CODES.has(code) ? (code as X509ErrorCode) : 'invalid_certificate');
  }

  return JSON.parse(json) as X509ParseResult;
}
