import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Pastikan ENCRYPTION_KEY sepanjang 32 karakter
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'super-secret-key-32-chars-long-siakad-f3'; 
const IV_LENGTH = 16; 

export function encrypt(text: string): string {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).substring(0, 32));
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  // Jika teks tidak mengandung titik dua (bukan format iv:cipher), kembalikan teks asli (untuk kompatibilitas data lama/unencrypted)
  if (!encryptedText.includes(':')) {
    return encryptedText;
  }
  try {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift() || '', 'hex');
    const encrypted = Buffer.from(textParts.join(':'), 'hex');
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).substring(0, 32));
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Gagal mendekripsi data - Kesalahan Kunci]';
  }
}
