export async function encryptJson(key: CryptoKey, data: any) {
  const str = JSON.stringify(data);
  const enc = new TextEncoder().encode(str);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc
  );
  return {
    ciphertext: Array.from(new Uint8Array(ciphertext)),
    iv: Array.from(iv),
  };
}

export async function decryptJson(
  key: CryptoKey,
  cipherArr: number[],
  ivArr: number[]
) {
  const cipher = new Uint8Array(cipherArr);
  const iv = new Uint8Array(ivArr);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipher
  );
  const str = new TextDecoder().decode(decrypted);
  return JSON.parse(str);
}

export async function deriveKeyFromPassword(password: string) {
  const enc = new TextEncoder().encode(password);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("demoSalt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
