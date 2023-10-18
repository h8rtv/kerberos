import { Client } from './actors';
import { encrypt, decrypt, generateNonce } from './crypto';
import { M1, M2, M3, M4, M5, M6 } from './messages';

type State = { [key: string]: string }
// Message 1
export function authenticationRequestMessage(client: Client): [State, M1] {
    const N1: string = generateNonce().toString('base64');
    const requestTime = '60'; // segundos
    const dataToEncrypt = client.tgs.id + requestTime + N1;
    const encryptedPart = encrypt(dataToEncrypt, Buffer.from(client.secret, 'base64'));

    return [{ N1, requestTime }, {
        clientId: client.id,
        encryptedData: encryptedPart,
    }];
}

// Message 3
export function accessGrantRequestMessage(client: Client, state: State, m2: M2): [State, M3] {
    const clientSecret = Buffer.from(client.secret, 'base64');
    const decryptedText = decrypt(m2.encryptedData, clientSecret);

    const receivedN1 = decryptedText.substring(44);
    if (receivedN1 != state.N1) {
        throw new Error('Nonce 1 is incorrect');
    }

    const tgsClientKey = decryptedText.substring(0, 44);
    const ticketTgs = m2.ticketTgs;
    const N2 = generateNonce().toString('base64');

    const dataToEncrypt = client.id + client.greeting.id + state.requestTime + N2;
    const encryptedData = encrypt(dataToEncrypt, Buffer.from(tgsClientKey, 'base64'));

    return [{ N2, tgsClientKey }, {
        ticketTgs,
        encryptedData,
    }];
}

// Message 5
export function serviceRequestMessage(client: Client, state: State, m4: M4): [State, M5] {
    const tgsClientKey = Buffer.from(state.tgsClientKey, 'base64');
    const decryptedText = decrypt(m4.encryptedData, tgsClientKey);

    const receivedN2 = decryptedText.substring(46);
    if (receivedN2 != state.N2) {
        throw new Error('Nonce 2 is incorrect');
    }

    const clientServiceKey = decryptedText.substring(0, 44);
    const ticketService = m4.ticketService;
    const authorizedTime = decryptedText.substring(44, 46);

    const N3 = generateNonce().toString('base64');

    // TODO: Adicionar serviço solicitado
    const dataToEncrypt = client.id + authorizedTime + N3;
    const encryptedData = encrypt(dataToEncrypt, Buffer.from(clientServiceKey, 'base64'));

    return [{ N3, clientServiceKey }, {
        ticketService,
        encryptedData,
    }];
}

// End
export function serviceResult(_: Client, state: State, m6: M6) {
    const clientServiceKey = Buffer.from(state.clientServiceKey, 'base64');
    const decryptedText = decrypt(m6.encryptedData, clientServiceKey);

    const response = decryptedText.substring(0, 8);
    const receivedN3 = decryptedText.substring(8);

    if (receivedN3 != state.N3) {
        throw new Error('Nonce 3 is incorrect');
    }

    console.log(response);
}
