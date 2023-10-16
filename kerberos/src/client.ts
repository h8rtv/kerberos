import { Client } from './actors';
import { encrypt, decrypt, generateNonce } from './crypto';
import { M1, M2, M3 } from './messages';

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

    return [{ N2 }, {
        ticketTgs,
        encryptedData,
    }];
}
