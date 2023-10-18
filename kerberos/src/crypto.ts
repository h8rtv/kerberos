import crypto from 'crypto';

export type EncryptData = { iv: Buffer, encrypted: Buffer };

export function nowAsBuffer() {
    const timestamp = new Date().getTime();

    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(timestamp), 0);
    return buffer;
}

export function getDateFromBufferTimestamp(buffer: Buffer) {
    const bigIntTimestamp = buffer.readBigInt64BE(0); // Read the BigInt from the buffer
    const date = new Date(Number(bigIntTimestamp));
    return date;
}

export function generateNonce(): Buffer {
    return crypto.randomBytes(16);
}

export function generateId(): string {
    return crypto.randomUUID();
}

export function idToBuffer(uuid: string): Buffer {
    const buffer = Buffer.from(uuid.replace(/-/g, ''), 'hex');
    return buffer;
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
