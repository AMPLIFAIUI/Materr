const KEY_STORAGE_KEY = 'mate_secure_storage_key';
const FALLBACK_PREFIX = 'plain:';
const ENCRYPTED_PREFIX = 'enc:';

const hasWindow = typeof window !== 'undefined';
const hasWebCrypto = hasWindow && !!window.crypto?.subtle;

const getLocalStorage = (): Storage | null => {
  if (!hasWindow) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const base64FromBytes = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const bytesFromBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const getOrCreateKeyMaterial = (): string => {
  const storage = getLocalStorage();
  const random = new Uint8Array(32);

  if (!storage) {
    window.crypto.getRandomValues(random);
    return base64FromBytes(random);
  }

  let stored = storage.getItem(KEY_STORAGE_KEY);
  if (!stored) {
    window.crypto.getRandomValues(random);
    stored = base64FromBytes(random);
    storage.setItem(KEY_STORAGE_KEY, stored);
  }
  return stored;
};

const importCryptoKey = async (): Promise<CryptoKey | null> => {
  if (!hasWebCrypto) {
    return null;
  }

  try {
    const base64Key = getOrCreateKeyMaterial();
    const rawKey = bytesFromBase64(base64Key);
    return window.crypto.subtle.importKey(
      'raw',
      rawKey,
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Failed to import encryption key:', error);
    return null;
  }
};

export const encryptData = async (value: string): Promise<string> => {
  if (!hasWebCrypto) {
    return `${FALLBACK_PREFIX}${btoa(unescape(encodeURIComponent(value)))}`;
  }

  const key = await importCryptoKey();
  if (!key) {
    return `${FALLBACK_PREFIX}${btoa(unescape(encodeURIComponent(value)))}`;
  }

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedValue = textEncoder.encode(value);

  try {
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedValue
    );
    const buffer = new Uint8Array(iv.byteLength + encrypted.byteLength);
    buffer.set(iv, 0);
    buffer.set(new Uint8Array(encrypted), iv.byteLength);
    return `${ENCRYPTED_PREFIX}${base64FromBytes(buffer)}`;
  } catch (error) {
    console.error('Failed to encrypt data:', error);
    return `${FALLBACK_PREFIX}${btoa(unescape(encodeURIComponent(value)))}`;
  }
};

export const decryptData = async (value: string): Promise<string | null> => {
  if (!value) {
    return null;
  }

  if (value.startsWith(FALLBACK_PREFIX)) {
    try {
      const encoded = value.slice(FALLBACK_PREFIX.length);
      return decodeURIComponent(escape(atob(encoded)));
    } catch (error) {
      console.error('Failed to decode fallback data:', error);
      return null;
    }
  }

  if (!value.startsWith(ENCRYPTED_PREFIX) || !hasWebCrypto) {
    return value;
  }

  const key = await importCryptoKey();
  if (!key) {
    return null;
  }

  try {
    const encoded = value.slice(ENCRYPTED_PREFIX.length);
    const data = bytesFromBase64(encoded);
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return textDecoder.decode(decrypted);
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return null;
  }
};
