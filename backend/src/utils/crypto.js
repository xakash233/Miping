const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.AES_SECRET; // Must be 32 bytes
const IV_LENGTH = 16; // AES block size

if (!SECRET_KEY || SECRET_KEY.length !== 32) {
    throw new Error('AES_SECRET must be 32 characters long!');
}

/**
 * Encrypts a text string using AES-256-GCM.
 * @param {string} text - The plain text to encrypt.
 * @returns {object} { encryptedData: string, iv: string } - Encrypted data includes auth tag.
 */
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Store AuthTag with Encrypted Data (Last 32 chars of hex string = 16 bytes tag)
    // Format: ciphertext + authTag
    return {
        encryptedData: encrypted + authTag,
        iv: iv.toString('hex')
    };
}

/**
 * Decrypts data using AES-256-GCM.
 * @param {string} encryptedDataWithTag - The encrypted data string (hex) with appended auth tag.
 * @param {string} ivHex - The initialization vector (hex).
 * @returns {string} The decrypted plain text.
 */
function decrypt(encryptedDataWithTag, ivHex) {
    const iv = Buffer.from(ivHex, 'hex');

    // Extract Auth Tag (last 32 hex chars = 16 bytes)
    const tagLengthHex = 32;
    const authTagHex = encryptedDataWithTag.slice(-tagLengthHex);
    const encryptedTextHex = encryptedDataWithTag.slice(0, -tagLengthHex);

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encryptedTextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = { encrypt, decrypt };
