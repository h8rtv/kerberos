import crypto from 'crypto';

export type EncryptData = { iv: Buffer, encrypted: Buffer };

export function generateNonce(): Buffer {
    return crypto.randomBytes(16);
}

export function hash(password: string, salt?: Buffer) {
    const hasher = salt
        ? crypto.createHmac('sha256', salt)
        : crypto.createHash('sha256');

    hasher.update(password);
    const array = hasher.digest();
    return Buffer.from(array.buffer.slice(0, 32)).toString('base64');
}

export function generateSecret(): Buffer {
    return crypto.randomBytes(32);
}

export function encrypt(text: Buffer, secretKey: Buffer): EncryptData {
    const iv = generateNonce();
    const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv,
        encrypted: encrypted,
    };
}

export function decrypt(encryptedData: EncryptData, secretKey: Buffer): Buffer {
    const { encrypted, iv } = encryptedData;
    const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
}
