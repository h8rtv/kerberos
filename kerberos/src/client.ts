import { Client } from './actors';
import { encrypt, decrypt, generateNonce, nowAsBuffer, idToBuffer } from './crypto';
import { M1, M2, M3, M4, M5, M6 } from './messages';

type State = { [key: string]: Buffer }
// Message 1
export function authenticationRequestMessage(client: Client): [State, M1] {
    const N1 = generateNonce();
    const requestTime = nowAsBuffer();
    const tgsId = idToBuffer(client.tgs.id);
    const dataToEncrypt = Buffer.concat([tgsId, requestTime, N1]);
    const encryptedPart = encrypt(dataToEncrypt, Buffer.from(client.secret, 'base64'));

    return [{ N1, requestTime }, {
        clientId: idToBuffer(client.id),
        encryptedData: encryptedPart,
    }];
}

// Message 3
export function accessGrantRequestMessage(client: Client, state: State, m2: M2): [State, M3] {
    const decrypted = decrypt(m2.encryptedData, Buffer.from(client.secret, 'base64'));
    Bun.password.verify

    const receivedN1 = decrypted.subarray(32);
    if (!receivedN1.equals(state.N1)) {
        throw new Error('Nonce 1 is incorrect');
    }

    const tgsClientKey = decrypted.subarray(0, 32);
    const N2 = generateNonce();

    const dataToEncrypt = Buffer.concat([
        idToBuffer(client.id),
        idToBuffer(client.greeting.id),
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

    // TODO: Adicionar serviço solicitado
    // TODO: Checar tempo
    const dataToEncrypt = Buffer.concat([idToBuffer(client.id), authorizedTime, N3]);
    const encryptedData = encrypt(dataToEncrypt, clientServiceKey);

    return [{ N3, clientServiceKey }, {
        ticketService: m4.ticketService,
        encryptedData,
    }];
}

// End
export function serviceResult(_: Client, state: State, m6: M6) {
    const decrypted = decrypt(m6.encryptedData, state.clientServiceKey);

    const response = decrypted.subarray(0, 8);
    const receivedN3 = decrypted.subarray(8);

    if (!receivedN3.equals(state.N3)) {
        throw new Error('Nonce 3 is incorrect');
    }

    console.log(response.toString());
}
