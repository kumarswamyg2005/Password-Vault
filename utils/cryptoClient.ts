export async function deriveKeyFromPassword(password: string, saltB64: string, iterations: number) {
  const enc = new TextEncoder();
  const pwKey = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return key;
}

export async function encryptJson(key: CryptoKey, data: any) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));
  const ciphertextBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const ciphertextB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));
  const ivB64 = btoa(String.fromCharCode(...iv));
  return { ciphertext: ciphertextB64, iv: ivB64 };
}

export async function decryptJson(key: CryptoKey, ciphertextB64: string, ivB64: string) {
  const ct = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const decBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  const dec = new TextDecoder().decode(decBuf);
  return JSON.parse(dec);
}
