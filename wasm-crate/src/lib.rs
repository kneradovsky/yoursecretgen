use base64::engine::{general_purpose, Engine};
use bcrypt::{hash, verify, DEFAULT_COST};
use sha1::{Digest, Sha1};
use sha2::{Sha256, Sha512};
use uuid::Uuid;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn uuid_v4() -> String {
    Uuid::new_v4().to_string()
}

#[wasm_bindgen]
pub fn base64_encode(input: &str, url_safe: bool) -> String {
    if url_safe {
        general_purpose::URL_SAFE_NO_PAD.encode(input.as_bytes())
    } else {
        general_purpose::STANDARD.encode(input.as_bytes())
    }
}

#[wasm_bindgen]
pub fn base64_decode(input: &str, url_safe: bool) -> Result<String, JsValue> {
    let decoded = if url_safe {
        general_purpose::URL_SAFE_NO_PAD.decode(input)
    } else {
        general_purpose::STANDARD.decode(input)
    };

    match decoded {
        Ok(bytes) => match String::from_utf8(bytes) {
            Ok(s) => Ok(s),
            Err(_) => Err(JsValue::from_str("Decoded bytes are not valid UTF-8")),
        },
        Err(e) => Err(JsValue::from_str(&format!("Base64 decode error: {e}"))),
    }
}

fn bytes_to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

#[wasm_bindgen]
pub fn sha1(input: &str) -> String {
    bytes_to_hex(&Sha1::digest(input.as_bytes()))
}

#[wasm_bindgen]
pub fn sha256(input: &str) -> String {
    bytes_to_hex(&Sha256::digest(input.as_bytes()))
}

#[wasm_bindgen]
pub fn sha512(input: &str) -> String {
    bytes_to_hex(&Sha512::digest(input.as_bytes()))
}

#[wasm_bindgen]
pub fn bcrypt_hash(password: &str, cost: u32) -> Result<String, JsValue> {
    let cost = if cost == 0 { DEFAULT_COST } else { cost };
    match hash(password, cost) {
        Ok(h) => Ok(h),
        Err(e) => Err(JsValue::from_str(&format!("Bcrypt hash error: {e}"))),
    }
}

#[wasm_bindgen]
pub fn bcrypt_verify(password: &str, hash: &str) -> bool {
    verify(password, hash).unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_uuid_v4_format() {
        let id = uuid_v4();
        assert_eq!(id.len(), 36);
        assert_eq!(id.chars().nth(14), Some('4'));
    }

    #[test]
    fn test_base64_roundtrip() {
        let input = "hello world";
        let encoded = base64_encode(input, false);
        let decoded = base64_decode(&encoded, false).unwrap();
        assert_eq!(decoded, input);
    }

    #[test]
    fn test_base64_url_safe() {
        let input = "hello world";
        let encoded = base64_encode(input, true);
        assert!(!encoded.contains('='));
        let decoded = base64_decode(&encoded, true).unwrap();
        assert_eq!(decoded, input);
    }

    #[test]
    fn test_sha256_known_value() {
        // SHA-256("abc")
        assert_eq!(
            sha256("abc"),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }

    #[test]
    fn test_bcrypt_hash_and_verify() {
        let hash = bcrypt_hash("password", 4).unwrap();
        assert!(bcrypt_verify("password", &hash));
        assert!(!bcrypt_verify("wrong", &hash));
    }
}
