/**
 * Tests for crypto-utils.ts
 * - Password hashing & verification (PBKDF2)
 * - JWT generation & verification
 * - API key generation & hashing
 * - AES encryption & decryption
 * - UUID generation
 */

import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
  generateApiKey,
  hashApiKey,
  encrypt,
  decrypt,
  generateUUID,
} from '../src/crypto-utils';

describe('Password Hashing (PBKDF2)', () => {
  it('should hash a password and return a base64 string', async () => {
    const hash = await hashPassword('testpassword123');
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe('string');
    // base64 encoded salt(16) + hash(32) = 48 bytes => ~64 chars base64
    expect(hash.length).toBeGreaterThan(40);
  });

  it('should produce different hashes for the same password (different salts)', async () => {
    const hash1 = await hashPassword('samepassword');
    const hash2 = await hashPassword('samepassword');
    expect(hash1).not.toBe(hash2);
  });

  it('should verify correct password', async () => {
    const password = 'mysecurepassword';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const hash = await hashPassword('correctpassword');
    const isValid = await verifyPassword('wrongpassword', hash);
    expect(isValid).toBe(false);
  });

  it('should handle empty password', async () => {
    const hash = await hashPassword('');
    const isValid = await verifyPassword('', hash);
    expect(isValid).toBe(true);
  });

  it('should handle unicode passwords', async () => {
    const password = 'รหัสผ่านภาษาไทย🔒';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });
});

describe('JWT Generation & Verification', () => {
  const secret = 'test-jwt-secret-key-for-testing-only';

  it('should generate a valid JWT token', async () => {
    const token = await generateJWT(
      { sub: 'user-123', email: 'test@test.com', plan: 'free' },
      secret
    );
    expect(token).toBeTruthy();
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify a valid JWT and return payload', async () => {
    const token = await generateJWT(
      { sub: 'user-456', email: 'user@example.com', plan: 'pro' },
      secret
    );
    const payload = await verifyJWT(token, secret);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('user-456');
    expect(payload!.email).toBe('user@example.com');
    expect(payload!.plan).toBe('pro');
    expect(payload!.iat).toBeTruthy();
    expect(payload!.exp).toBeTruthy();
    expect(payload!.exp).toBeGreaterThan(payload!.iat);
  });

  it('should reject JWT with wrong secret', async () => {
    const token = await generateJWT(
      { sub: 'user-123', email: 'test@test.com', plan: 'free' },
      secret
    );
    const payload = await verifyJWT(token, 'wrong-secret-key');
    expect(payload).toBeNull();
  });

  it('should reject expired JWT', async () => {
    const token = await generateJWT(
      { sub: 'user-123', email: 'test@test.com', plan: 'free' },
      secret,
      -1 // already expired
    );
    const payload = await verifyJWT(token, secret);
    expect(payload).toBeNull();
  });

  it('should reject malformed JWT', async () => {
    const payload = await verifyJWT('not.a.valid.jwt', secret);
    expect(payload).toBeNull();
  });

  it('should reject empty string', async () => {
    const payload = await verifyJWT('', secret);
    expect(payload).toBeNull();
  });

  it('should respect custom expiration', async () => {
    const token = await generateJWT(
      { sub: 'user-123', email: 'test@test.com', plan: 'free' },
      secret,
      3600 // 1 hour
    );
    const payload = await verifyJWT(token, secret);
    expect(payload).not.toBeNull();
    expect(payload!.exp - payload!.iat).toBe(3600);
  });
});

describe('API Key Generation & Hashing', () => {
  it('should generate API key with correct format', async () => {
    const { key, hash, prefix } = await generateApiKey();

    // Key should start with "grag_"
    expect(key.startsWith('grag_')).toBe(true);

    // Hash should be a hex string (SHA-256 = 64 chars)
    expect(hash).toMatch(/^[a-f0-9]{64}$/);

    // Prefix should be first 12 chars of key
    expect(prefix).toBe(key.substring(0, 12));
    expect(prefix.startsWith('grag_')).toBe(true);
  });

  it('should generate unique keys each time', async () => {
    const key1 = await generateApiKey();
    const key2 = await generateApiKey();
    expect(key1.key).not.toBe(key2.key);
    expect(key1.hash).not.toBe(key2.hash);
  });

  it('should hash API key consistently', async () => {
    const apiKey = 'saas_test_api_key_12345';
    const hash1 = await hashApiKey(apiKey);
    const hash2 = await hashApiKey(apiKey);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different keys', async () => {
    const hash1 = await hashApiKey('saas_key_1');
    const hash2 = await hashApiKey('saas_key_2');
    expect(hash1).not.toBe(hash2);
  });
});

describe('AES Encryption & Decryption', () => {
  const encryptionKey = 'test-encryption-key-for-testing-only-32b';

  it('should encrypt and decrypt a string', async () => {
    const plaintext = 'AIzaSy-my-gemini-api-key-12345';
    const encrypted = await encrypt(plaintext, encryptionKey);
    expect(encrypted).not.toBe(plaintext);

    const decrypted = await decrypt(encrypted, encryptionKey);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for same plaintext (random IV)', async () => {
    const plaintext = 'same-text-different-output';
    const encrypted1 = await encrypt(plaintext, encryptionKey);
    const encrypted2 = await encrypt(plaintext, encryptionKey);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should fail to decrypt with wrong key', async () => {
    const encrypted = await encrypt('secret data', encryptionKey);
    await expect(decrypt(encrypted, 'wrong-key-for-decryption-testing')).rejects.toThrow();
  });

  it('should handle empty string', async () => {
    const encrypted = await encrypt('', encryptionKey);
    const decrypted = await decrypt(encrypted, encryptionKey);
    expect(decrypted).toBe('');
  });

  it('should handle unicode content', async () => {
    const plaintext = 'กุญแจ API ของ Gemini 🔑';
    const encrypted = await encrypt(plaintext, encryptionKey);
    const decrypted = await decrypt(encrypted, encryptionKey);
    expect(decrypted).toBe(plaintext);
  });

  it('should handle long strings', async () => {
    const plaintext = 'A'.repeat(10000);
    const encrypted = await encrypt(plaintext, encryptionKey);
    const decrypted = await decrypt(encrypted, encryptionKey);
    expect(decrypted).toBe(plaintext);
  });
});

describe('UUID Generation', () => {
  it('should generate valid UUID v4 format', () => {
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(uuid).toMatch(uuidRegex);
  });

  it('should generate unique UUIDs', () => {
    const uuids = new Set(Array.from({ length: 100 }, () => generateUUID()));
    expect(uuids.size).toBe(100);
  });
});
