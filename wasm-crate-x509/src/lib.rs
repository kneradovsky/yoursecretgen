//! X.509 certificate field extraction for the browser.
//!
//! This module only *describes* a certificate: it parses PEM/DER/base64 input and
//! returns the fields an `openssl x509 -text` user expects to see. It
//! deliberately does not validate anything — no signature verification, no chain
//! building, no revocation lookups. That keeps the module free of ring/aws-lc-rs
//! (which do not build for wasm32) and keeps the site's "no network requests"
//! promise intact.
//!
//! It lives in its own crate so the ~400 KB of parser code is loaded lazily by
//! the /x509 route only, instead of on every page.

use base64::engine::{general_purpose, Engine};
use sha1::{Digest, Sha1};
use sha2::Sha256;
use wasm_bindgen::prelude::*;
use x509_parser::extensions::{GeneralName, ParsedExtension};
use x509_parser::objects::{oid2abbrev, oid2description, oid2sn, oid_registry};
use x509_parser::der_parser::Oid;
use x509_parser::prelude::*;
use x509_parser::public_key::PublicKey;

/// Guard against pathological input: a certificate is a few KB, a chain a few
/// dozen. Anything larger is not a certificate.
const MAX_INPUT_BYTES: usize = 1024 * 1024;

// ---------------------------------------------------------------------------
// Small JSON writer (hand-rolled on purpose: serde_json + Debug formatting cost
// ~110 KB of wasm, measured, and this output shape is fixed and small).
// ---------------------------------------------------------------------------

fn json_escape(value: &str) -> String {
    let mut out = String::with_capacity(value.len() + 2);
    out.push('"');
    for c in value.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push(' '),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

#[derive(Default)]
struct Obj {
    pairs: Vec<String>,
}

impl Obj {
    fn new() -> Self {
        Obj { pairs: Vec::new() }
    }

    fn text(&mut self, key: &str, value: &str) -> &mut Self {
        self.pairs.push(format!("{}:{}", json_escape(key), json_escape(value)));
        self
    }

    fn num(&mut self, key: &str, value: usize) -> &mut Self {
        self.pairs.push(format!("{}:{}", json_escape(key), value));
        self
    }

    fn boolean(&mut self, key: &str, value: bool) -> &mut Self {
        self.pairs.push(format!("{}:{}", json_escape(key), value));
        self
    }

    fn raw(&mut self, key: &str, raw: String) -> &mut Self {
        self.pairs.push(format!("{}:{}", json_escape(key), raw));
        self
    }

    fn json(&self) -> String {
        format!("{{{}}}", self.pairs.join(","))
    }
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

fn hex_colon(bytes: &[u8]) -> String {
    bytes
        .iter()
        .map(|b| format!("{b:02X}"))
        .collect::<Vec<_>>()
        .join(":")
}

fn hex_plain(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn oid_sn(oid: &Oid) -> String {
    oid2sn(oid, oid_registry())
        .map(|name| name.to_string())
        .unwrap_or_else(|_| oid.to_id_string())
}

fn oid_description(oid: &Oid) -> String {
    oid2description(oid, oid_registry())
        .map(|name| name.to_string())
        .unwrap_or_default()
}

/// `[{"abbr":"C","value":"RU"}, …]` — the frontend joins it, so the label text
/// stays translatable and the Rust side never formats prose.
fn dn_json(name: &X509Name<'_>) -> String {
    let parts: Vec<String> = name
        .iter_attributes()
        .map(|attribute| {
            let oid = attribute.attr_type();
            let abbr = oid2abbrev(&oid, oid_registry())
                .map(|value| value.to_string())
                .unwrap_or_else(|_| oid.to_id_string());
            let value = attribute.as_str().unwrap_or("<non-UTF8 value>");
            format!("{{\"abbr\":{},\"value\":{}}}", json_escape(&abbr), json_escape(value))
        })
        .collect();
    format!("[{}]", parts.join(","))
}

fn general_name_name(name: &GeneralName<'_>) -> String {
    match name {
        GeneralName::DNSName(dns) => format!("DNS:{dns}"),
        GeneralName::RFC822Name(email) => format!("email:{email}"),
        GeneralName::URI(uri) => format!("URI:{uri}"),
        GeneralName::IPAddress(ip) => format!(
            "IP:{}",
            ip.iter().map(|byte| byte.to_string()).collect::<Vec<_>>().join(".")
        ),
        GeneralName::DirectoryName(dn) => format!("dirName:{dn}"),
        GeneralName::RegisteredID(oid) => format!("RID:{oid}"),
        _ => "other".to_string(),
    }
}

fn general_names(names: &[GeneralName<'_>]) -> String {
    names
        .iter()
        .map(general_name_name)
        .collect::<Vec<_>>()
        .join(", ")
}

fn key_usage_names(flags: u16) -> String {
    const NAMES: [(u16, &str); 9] = [
        (1, "digitalSignature"),
        (2, "nonRepudiation"),
        (4, "keyEncipherment"),
        (8, "dataEncipherment"),
        (16, "keyAgreement"),
        (32, "keyCertSign"),
        (64, "cRLSign"),
        (128, "encipherOnly"),
        (256, "decipherOnly"),
    ];
    NAMES
        .iter()
        .filter(|(bit, _)| flags & bit != 0)
        .map(|(_, name)| *name)
        .collect::<Vec<_>>()
        .join(", ")
}

fn extended_key_usage_names(eku: &x509_parser::extensions::ExtendedKeyUsage<'_>) -> String {
    let mut names: Vec<String> = Vec::new();
    for (present, name) in [
        (eku.any, "anyExtendedKeyUsage"),
        (eku.server_auth, "serverAuth"),
        (eku.client_auth, "clientAuth"),
        (eku.code_signing, "codeSigning"),
        (eku.email_protection, "emailProtection"),
        (eku.time_stamping, "timeStamping"),
        (eku.ocsp_signing, "ocspSigning"),
    ] {
        if present {
            names.push(name.to_string());
        }
    }
    for oid in &eku.other {
        names.push(oid.to_id_string());
    }
    names.join(", ")
}

/// Returns `(value, is_raw)`. Extensions this module does not model fall back to
/// the raw extnValue bytes, the same way `openssl x509 -text` prints an
/// unrecognised extension as a hex dump.
fn extension_value(ext: &X509Extension<'_>) -> (String, bool) {
    match ext.parsed_extension() {
        ParsedExtension::SubjectAlternativeName(san) => (general_names(&san.general_names), false),
        ParsedExtension::KeyUsage(usage) => (key_usage_names(usage.flags), false),
        ParsedExtension::ExtendedKeyUsage(eku) => (extended_key_usage_names(eku), false),
        ParsedExtension::BasicConstraints(constraints) => {
            let path_len = match constraints.path_len_constraint {
                Some(len) => len.to_string(),
                None => "-".to_string(),
            };
            (format!("CA={}, pathLen={path_len}", constraints.ca), false)
        }
        ParsedExtension::SubjectKeyIdentifier(key_id) => (hex_colon(key_id.0), false),
        ParsedExtension::AuthorityKeyIdentifier(key_id) => {
            let mut parts: Vec<String> = Vec::new();
            if let Some(key) = &key_id.key_identifier {
                parts.push(format!("keyid:{}", hex_colon(key.0)));
            }
            if let Some(serial) = &key_id.authority_cert_serial {
                parts.push(format!("serial:{}", hex_colon(serial)));
            }
            (parts.join(", "), false)
        }
        _ => {
            if ext.value.is_empty() {
                (String::new(), false)
            } else {
                (hex_plain(ext.value), true)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Input handling
// ---------------------------------------------------------------------------

/// Error codes thrown across the wasm boundary. They are stable identifiers, not
/// prose, so the UI can translate them (and so error paths stay testable).
pub const ERR_EMPTY_INPUT: &str = "empty_input";
pub const ERR_INPUT_TOO_LARGE: &str = "input_too_large";
pub const ERR_INVALID_PEM: &str = "invalid_pem";
pub const ERR_INVALID_CERTIFICATE: &str = "invalid_certificate";

/// Accepts a PEM bundle, a bare (optionally wrapped) base64 string, or raw DER
/// bytes, and returns one DER blob per certificate found.
fn to_der_blobs(input: &[u8]) -> Result<Vec<Vec<u8>>, &'static str> {
    if input.is_empty() {
        return Err(ERR_EMPTY_INPUT);
    }
    if input.len() > MAX_INPUT_BYTES {
        return Err(ERR_INPUT_TOO_LARGE);
    }

    if let Ok(text) = std::str::from_utf8(input) {
        if text.contains("-----BEGIN CERTIFICATE-----") {
            let mut blobs = Vec::new();
            let mut rest = text;
            while let Some(start) = rest.find("-----BEGIN CERTIFICATE-----") {
                let (remaining, pem) = x509_parser::pem::parse_x509_pem(&rest.as_bytes()[start..])
                    .map_err(|_| ERR_INVALID_PEM)?;
                blobs.push(pem.contents);
                match std::str::from_utf8(remaining) {
                    Ok(next) => rest = next,
                    Err(_) => break,
                }
            }
            if !blobs.is_empty() {
                return Ok(blobs);
            }
        }

        // A bare base64 certificate, possibly with line breaks pasted from a
        // certificate viewer (that is what `.cer`/`.crt` often are).
        let compact: String = text.chars().filter(|c| !c.is_whitespace()).collect();
        let looks_like_base64 = !compact.is_empty()
            && compact
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '/' | '=' | '-' | '_'));
        if looks_like_base64 {
            if let Ok(bytes) = general_purpose::STANDARD.decode(&compact) {
                if !bytes.is_empty() {
                    return Ok(vec![bytes]);
                }
            }
        }
    }

    Ok(vec![input.to_vec()])
}

fn pem_block(der: &[u8]) -> String {
    let body = general_purpose::STANDARD.encode(der);
    let mut out = String::from("-----BEGIN CERTIFICATE-----\n");
    for chunk in body.as_bytes().chunks(64) {
        out.push_str(std::str::from_utf8(chunk).unwrap_or_default());
        out.push('\n');
    }
    out.push_str("-----END CERTIFICATE-----\n");
    out
}

fn describe_one(der: &[u8]) -> Result<String, &'static str> {
    let (_, certificate) =
        X509Certificate::from_der(der).map_err(|_| ERR_INVALID_CERTIFICATE)?;
    let tbs = &certificate.tbs_certificate;

    let mut fields: Vec<String> = Vec::new();
    let mut push = |key: &str, value: String| {
        fields.push(format!("{{\"key\":{},\"value\":{}}}", json_escape(key), json_escape(&value)));
    };

    push("version", format!("V{}", tbs.version.0 + 1));
    push("serialNumber", certificate.raw_serial_as_string());
    push("signatureAlgorithm", oid_sn(&tbs.signature.algorithm));
    push("validFrom", tbs.validity.not_before.to_string());
    push("validTo", tbs.validity.not_after.to_string());
    push(
        "publicKeyAlgorithm",
        format!("{} ({})", oid_sn(&tbs.subject_pki.algorithm.algorithm), oid_description(&tbs.subject_pki.algorithm.algorithm)),
    );
    if let Ok(public_key) = tbs.subject_pki.parsed() {
        let (kind, bits) = match &public_key {
            PublicKey::RSA(rsa) => ("RSA", rsa.key_size()),
            PublicKey::EC(_) => ("EC", public_key.key_size()),
            _ => ("other", public_key.key_size()),
        };
        push("publicKey", format!("{kind} {bits} bit"));
        if let PublicKey::RSA(rsa) = &public_key {
            let exponent = rsa.exponent.iter().fold(0u64, |acc, byte| (acc << 8) | u64::from(*byte));
            push("rsaExponent", exponent.to_string());
        }
    }
    push("signature", format!("{} bytes", certificate.signature_value.data.len()));
    push("sha1Fingerprint", hex_colon(&Sha1::digest(der)));
    push("sha256Fingerprint", hex_colon(&Sha256::digest(der)));

    let mut extensions: Vec<String> = Vec::new();
    for ext in tbs.extensions() {
        let (value, raw) = extension_value(ext);
        let mut entry = Obj::new();
        entry
            .text("oid", &ext.oid.to_id_string())
            .text("name", &oid_sn(&ext.oid))
            .text("description", &oid_description(&ext.oid))
            .boolean("critical", ext.critical)
            .boolean("raw", raw)
            .text("value", &value);
        extensions.push(entry.json());
    }

    let mut certificate_obj = Obj::new();
    certificate_obj
        .raw("subject", dn_json(&tbs.subject))
        .raw("issuer", dn_json(&tbs.issuer))
        .raw("fields", format!("[{}]", fields.join(",")))
        .raw("extensions", format!("[{}]", extensions.join(",")))
        .text("pem", &pem_block(der))
        .num("derSize", der.len());
    Ok(certificate_obj.json())
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Parses one or more certificates and returns their fields as JSON:
/// `{"certificates":[{"subject":[{"abbr","value"}],"issuer":[…],"fields":[…],
/// "extensions":[…],"pem":"…","derSize":N}]}`
fn describe_input(input: &[u8]) -> Result<String, &'static str> {
    let blobs = to_der_blobs(input)?;

    let mut certificates: Vec<String> = Vec::new();
    for der in blobs.iter() {
        certificates.push(describe_one(der)?);
    }

    let mut out = Obj::new();
    out.raw("certificates", format!("[{}]", certificates.join(",")));
    Ok(out.json())
}

/// Parses one or more certificates (PEM, base64 or DER) and returns their fields
/// as JSON. Throws a `string` on invalid input.
// Wasm entry point. Parsing lives in `describe_input` so the error paths stay
// testable: `JsValue::from_str` panics on non-wasm targets, which would make
// `Result<_, JsValue>` impossible to exercise with a plain `cargo test`.
#[wasm_bindgen]
pub fn x509_describe(input: &[u8]) -> Result<String, JsValue> {
    describe_input(input).map_err(|error| JsValue::from_str(&error))
}

#[cfg(test)]
mod tests {
    use super::*;

    const PEM: &str = include_str!("../fixtures/cert.pem");

    #[test]
    fn describes_pem_certificate() {
        let json = describe_input(PEM.as_bytes()).unwrap();
        assert!(json.contains("\"CN\""));
        assert!(json.contains("example.test"));
        assert!(json.contains("subjectAltName"));
        assert!(json.contains("sha256Fingerprint"));
    }

    #[test]
    fn describes_bare_base64_and_der() {
        let body: String = PEM
            .lines()
            .filter(|line| !line.starts_with("-----"))
            .collect();
        let from_base64 = describe_input(body.as_bytes()).unwrap();
        let der = general_purpose::STANDARD.decode(body.replace('\n', "")).unwrap();
        let from_der = describe_input(&der).unwrap();
        assert_eq!(from_base64, from_der);
    }

    #[test]
    fn describes_every_certificate_in_a_bundle() {
        let chain = include_str!("../fixtures/chain.pem");
        let json = describe_input(chain.as_bytes()).unwrap();
        assert_eq!(json.matches("\"pem\"").count(), 2);
    }

    #[test]
    fn reports_stable_error_codes() {
        assert_eq!(describe_input(b"not a certificate").unwrap_err(), ERR_INVALID_CERTIFICATE);
        assert_eq!(describe_input(b"").unwrap_err(), ERR_EMPTY_INPUT);
        assert_eq!(describe_input(b"-----BEGIN CERTIFICATE-----\nnope\n").unwrap_err(), ERR_INVALID_PEM);
        assert_eq!(
            describe_input(&vec![0u8; MAX_INPUT_BYTES + 1]).unwrap_err(),
            ERR_INPUT_TOO_LARGE
        );
    }

    #[test]
    fn unknown_extensions_fall_back_to_raw_hex() {
        let json = describe_input(PEM.as_bytes()).unwrap();
        // certificatePolicies is not modelled: it must still be reported, as hex.
        assert!(json.contains("certificatePolicies"));
        assert!(json.contains("\"raw\":true"));
    }
}
