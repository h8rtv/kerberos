import crypto from 'crypto';

export function generateNonce(): Buffer {
    return crypto.randomBytes(16);
}

export function generateId(): string {
    return crypto.randomUUID();
}

export function generateSecret(): Buffer {
    return crypto.randomBytes(32);
}

type EncryptData = { iv: string, encryptedData: string };

export function encrypt(text: string, secretKey: Buffer): EncryptData {
    const iv = generateNonce();
    let cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex'),
    };
}

export function decrypt(encryptedText: string, secretKey: string, iv: string): string {
    let encryptedTextHex = Buffer.from(encryptedText, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), Buffer.from(iv));
    let decrypted = decipher.update(encryptedTextHex);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
