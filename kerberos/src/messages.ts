import { M1, M2, M3, M4, M5, M6, AuthStatus } from './types/messages';

export function errorMessage() {
    return Buffer.from([AuthStatus.Fail]);
}

export function m1toBuffer(m1: M1): Buffer {
    return Buffer.concat([
        Buffer.from([AuthStatus.Success]),
        m1.clientId,
        m1.encryptedData.iv,
        m1.encryptedData.encrypted,
    ]);
}
export function parseM1(buf: Buffer): M1 {
    if (buf.readUInt8() === AuthStatus.Fail) {
        throw new Error('Auth fail on M1');
    }
    const data = buf.subarray(1);

    return {
        clientId: data.subarray(0, 32),
        encryptedData: {
            iv: data.subarray(32, 48),
            encrypted: data.subarray(48),
        }
    };
}

export function m2orM3toBuffer(m: M2 | M3): Buffer {
    return Buffer.concat([
        Buffer.from([AuthStatus.Success]),
        m.ticketTgs.iv,
        m.ticketTgs.encrypted,
        m.encryptedData.iv,
        m.encryptedData.encrypted,
    ]);
}
export function parseM2orM3(buf: Buffer, message: string): M2 | M3 {
    if (buf.readUInt8() === AuthStatus.Fail) {
        throw new Error(`Auth fail on ${message}`);
    }
    const data = buf.subarray(1);
    return {
        ticketTgs: {
            iv: data.subarray(0, 16),
            encrypted: data.subarray(16, 96),
        },
        encryptedData: {
            iv: data.subarray(96, 112),
            encrypted: data.subarray(112),
        },
    };
}

export function m4orM5toBuffer(m: M4 | M5): Buffer {
    return Buffer.concat([
        Buffer.from([AuthStatus.Success]),
        m.ticketService.iv,
        m.ticketService.encrypted,
        m.encryptedData.iv,
        m.encryptedData.encrypted,
    ]);
}
export function parseM4orM5(buf: Buffer, message: string): M4 | M5 {
    if (buf.readUInt8() === AuthStatus.Fail) {
        throw new Error(`Auth fail on ${message}`);
    }
    const data = buf.subarray(1);

    return {
        ticketService: {
            iv: data.subarray(0, 16),
            encrypted: data.subarray(16, 96),
        },
        encryptedData: {
            iv: data.subarray(96, 112),
            encrypted: data.subarray(112),
        },
    };
}

export function m6toBuffer(m6: M6): Buffer {
    return Buffer.concat([
        Buffer.from([AuthStatus.Success]),
        m6.encryptedData.iv,
        m6.encryptedData.encrypted,
    ]);
}
export function parseM6(buf: Buffer): M6 {
    if (buf.readUInt8() === AuthStatus.Fail) {
        throw new Error('Auth fail on M6');
    }
    const data = buf.subarray(1);

    return {
        encryptedData: {
            iv: data.subarray(0, 16),
            encrypted: data.subarray(16),
        }
    };
}

