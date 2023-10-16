import crypto from 'crypto';

export type EncryptData = { iv: string, encrypted: string };

export function generateNonce(): Buffer {
    return crypto.randomBytes(16);
}

export function generateId(): string {
    return crypto.randomUUID();
}

export function generateSecret(): Buffer {
    return crypto.randomBytes(32);
}

export function encrypt(text: string, secretKey: Buffer): EncryptData {
    const iv = generateNonce();
    const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString('hex'),
        encrypted: encrypted.toString('hex'),
    };
}

export function decrypt(encryptedData: EncryptData, secretKey: Buffer): string {
    const { encrypted, iv } = encryptedData;
    const encryptedTextHex = Buffer.from(encrypted, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedTextHex);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
