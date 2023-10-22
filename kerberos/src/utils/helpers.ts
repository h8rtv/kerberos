import { stdin, stdout } from 'process';
import { createInterface } from 'readline/promises';
import { hash } from './crypto';

export async function readUserFromStdin() {
    const readline = createInterface({ input: stdin, output: stdout });

    const username = await readline.question('Username: ');
    const password = await readline.question('Password: ');

    readline.close();
    return {
        name: username,
        secret: hash(password),
    }
}

export async function readServiceUserFromStdin() {
    const readline = createInterface({ input: stdin, output: stdout });

    const username = await readline.question('Username: ');
    const servicename = await readline.question('Service: ');

    readline.close();
    return {
        username,
        servicename,
    }
}

export function timestampAsBuffer(timestamp: number) {
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(timestamp), 0);
    return buffer;
}

export function nowAsBuffer() {
    const timestamp = new Date().getTime();
    return timestampAsBuffer(timestamp);
}

export function getOffsetTimestamp(buffer: Buffer, offset: number = 0): number {
    const bigIntTimestamp = buffer.readBigInt64BE(0);
    return Number(bigIntTimestamp) + offset * 1000;
}

export function nameToBuffer(name: string): Buffer {
    if (Buffer.byteLength(name) > 32) {
        throw new Error('Service name is too big');
    }

    const buffer = Buffer.alloc(32);
    buffer.write(name, 0, Buffer.byteLength(name));
    return buffer;
}

export function nameToString(buffer: Buffer): string {
    let end_index = buffer.indexOf('\0');
    if (end_index === -1) {
        end_index = buffer.length;
    }
    return buffer.subarray(0, end_index).toString('utf-8')
}

