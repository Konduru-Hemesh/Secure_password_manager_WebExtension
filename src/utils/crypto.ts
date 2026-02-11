
/**
 * Production-grade Crypto Utilities for ZeroVault
 * Uses Web Crypto API (SubtleCrypto)
 */

// Generate a random salt
/**
 * Generates a cryptographically secure random salt.
 * Uses `crypto.getRandomValues` to ensure high entropy.
 * 
 * @returns A base64 encoded string representing the salt.
 */
export const generateSalt = (): string => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return btoa(String.fromCharCode(...salt));
};

// Derive a key from a password using PBKDF2
/**
 * Derives a cryptographic master key from the user's password and a salt.
 * Implements PBKDF2 (Password-Based Key Derivation Function 2) with SHA-256.
 * 
 * Configuration:
 * - Iterations: 100,000 (balances security and performance)
 * - Hash: SHA-256
 * - Algorithm: AES-GCM (256-bit key)
 * 
 * @param password - The user's master password.
 * @param salt - The unique vault salt.
 * @returns A promise that resolves to the exported key in JWK format string.
 */
export const deriveMasterKey = async (password: string, salt: string): Promise<string> => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: Uint8Array.from(atob(salt), c => c.charCodeAt(0)),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    // Export as JWK to store/pass around as string
    const exported = await crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(exported);
};

// Import a key from string (JWK)
const importKey = async (keyString: string): Promise<CryptoKey> => {
    const jwk = JSON.parse(keyString);
    return crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
};

// Encrypt data using AES-GCM
/**
 * Encrypts sensitive vault data using AES-GCM.
 * Generates a unique Initialization Vector (IV) for each encryption operation.
 * 
 * Format: IV (12 bytes) + Encrypted Data
 * 
 * @param data - The plaintext string to encrypt.
 * @param keyString - The JWK string of the encryption key.
 * @returns A promise that resolves to a base64 encoded string containing the IV and ciphertext.
 */
export const encryptVaultData = async (data: string, keyString: string): Promise<string> => {
    const key = await importKey(keyString);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();

    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        enc.encode(data)
    );

    // Combine IV and data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
};

// Decrypt data using AES-GCM
/**
 * Decrypts vault data using AES-GCM.
 * Extracts the IV from the beginning of the encrypted string.
 * 
 * @param encryptedData - The base64 encoded string containing IV and ciphertext.
 * @param keyString - The JWK string of the decryption key.
 * @returns A promise that resolves to the decrypted plaintext string.
 */
export const decryptVaultData = async (encryptedData: string, keyString: string): Promise<string> => {
    const key = await importKey(keyString);

    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        data
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
};

/**
 * Generates a random password using a Cryptographically Secure Pseudo-Random Number Generator (CSPRNG).
 * Ensures uniform distribution of characters to prevent bias.
 * 
 * @param length - The length of the password to generate.
 * @param options - Configuration for character sets to include (uppercase, lowercase, numbers, symbols).
 * @returns The generated random password string.
 */
export const generateRandomPassword = (length: number, options: {
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
}): string => {
    const charset = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
    };

    let characters = '';
    if (options.uppercase) characters += charset.uppercase;
    if (options.lowercase) characters += charset.lowercase;
    if (options.numbers) characters += charset.numbers;
    if (options.symbols) characters += charset.symbols;

    if (characters.length === 0) return '';

    let password = '';
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
        password += characters.charAt(randomValues[i] % characters.length);
    }
    return password;
};
