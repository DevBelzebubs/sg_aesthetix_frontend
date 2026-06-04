const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt(length = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashPin(pin: string): Promise<{ hash: string; salt: string }> {
  const salt = generateSalt();
  const data = encoder.encode(pin + salt);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hash = bytesToHex(new Uint8Array(digest));
  return { hash, salt };
}

export async function verifyPin(pin: string, salt: string, storedHash: string): Promise<boolean> {
  const data = encoder.encode(pin + salt);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const computedHash = bytesToHex(new Uint8Array(digest));
  return computedHash === storedHash;
}
