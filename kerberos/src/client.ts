import { Client, ClientServicesData, Service } from './types/actors';
import { encrypt, decrypt, generateNonce } from "./utils/crypto";
import { nameToBuffer, nowAsBuffer, readSaltFromStdin, readUserFromStdin } from "./utils/helpers";
import { M1, M2, M3, M4, M5, M6 } from './types/messages';
import {
    m1toBuffer,
    parseM2orM3,
    m2orM3toBuffer,
    parseM4orM5,
    m4orM5toBuffer,
    parseM6,
} from './messages';
import { read, writeFile } from './utils/db';

type State = { [key: string]: Buffer }

// Message 1
export function authenticationRequestMessage(client: Client): [State, M1] {
    const N1 = generateNonce();
    const requestTime = nowAsBuffer();
    const tgsId = nameToBuffer(client.services.tgs.name);
    const dataToEncrypt = Buffer.concat([tgsId, requestTime, N1]);
    const encryptedPart = encrypt(dataToEncrypt, Buffer.from(client.secret, 'base64'));

    return [{ N1, requestTime }, {
        clientId: nameToBuffer(client.name),
        encryptedData: encryptedPart,
    }];
}

// Message 3
export function accessGrantRequestMessage(client: Client, state: State, m2: M2): [State, M3] {
    const decrypted = decrypt(m2.encryptedData, Buffer.from(client.secret, 'base64'));

    const receivedN1 = decrypted.subarray(32);
    if (!receivedN1.equals(state.N1)) {
        throw new Error('Nonce 1 is incorrect');
    }

    const tgsClientKey = decrypted.subarray(0, 32);
    const N2 = generateNonce();

    const dataToEncrypt = Buffer.concat([
        nameToBuffer(client.name),
        nameToBuffer(client.services.greeting.name),
        state.requestTime,
        N2,
    ]);
    const encryptedData = encrypt(dataToEncrypt, tgsClientKey);

    return [{ N2, tgsClientKey }, {
        ticketTgs: m2.ticketTgs,
        encryptedData,
    }];
}

// Message 5
export function serviceRequestMessage(client: Client, state: State, m4: M4): [State, M5] {
    const decrypted = decrypt(m4.encryptedData, state.tgsClientKey);


    const receivedN2 = decrypted.subarray(40);
    if (!receivedN2.equals(state.N2)) {
        throw new Error('Nonce 2 is incorrect');
    }

    const clientServiceKey = decrypted.subarray(0, 32);
    const authorizedTime = decrypted.subarray(32, 40);

    const N3 = generateNonce();

    const dataToEncrypt = Buffer.concat([nameToBuffer(client.name), authorizedTime, N3]);
    const encryptedData = encrypt(dataToEncrypt, clientServiceKey);

    return [{ N3, clientServiceKey }, {
        ticketService: m4.ticketService,
        encryptedData,
    }];
}

// End
export function serviceResult(state: State, m6: M6) {
    const decrypted = decrypt(m6.encryptedData, state.clientServiceKey);

    const receivedN3 = decrypted.subarray(0, 16);

    if (!receivedN3.equals(state.N3)) {
        throw new Error('Nonce 3 is incorrect');
    }

    const response = decrypted.subarray(16);

    return response.toString();
}

async function sendMessage(to: Service, message: Buffer): Promise<Buffer> {
    return new Promise(async (res, rej) => {
        const socket = await Bun.connect({
            hostname: to.hostname,
            port: to.port,
            socket: {
                data(_, response) {
                    res(response);
                },
                error(_, error) {
                    rej(error);
                },
                connectError(_, error) {
                    rej(error);
                },
            },
        });
        socket.write(message);
    });
}

function delay(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function run() {
    try {
        const serviceData = await read<ClientServicesData>('client');

        if (!serviceData.salt) {
            const salt = await readSaltFromStdin();
            serviceData.salt = salt;
            await writeFile('client', serviceData);
        }

        const salt = Buffer.from(serviceData.salt, 'base64');
        const credentials = await readUserFromStdin(salt);
        const client: Client = Object.assign({}, credentials, serviceData);

        console.log('M1: build message');
        const [state1, m1] = authenticationRequestMessage(client);

        console.log('M1: send message');
        const m2Buffer = await sendMessage(client.services.as, m1toBuffer(m1));

        console.log('M2: receive message');
        const m2 = parseM2orM3(m2Buffer, 'M2');

        console.log('M3: build message');
        const [state2, m3] = accessGrantRequestMessage(client, state1, m2);

        console.log('M3: send message');
        const m4Buffer = await sendMessage(client.services.tgs, m2orM3toBuffer(m3));

        console.log('M4: receive message');
        const m4 = parseM4orM5(m4Buffer, 'M4');

        console.log('M5: build message');
        const [state3, m5] = serviceRequestMessage(client, state2, m4);

        console.log('M5: send message');
        while (true) {
            const m6Buffer = await sendMessage(client.services.greeting, m4orM5toBuffer(m5));

            console.log('M6: receive message');
            const m6 = parseM6(m6Buffer);

            const result = serviceResult(state3, m6);
            console.log(result);
            await delay(1000);
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error(error);
        }
    }
}

if (import.meta.main) {
    await run();
}
