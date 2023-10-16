import { Client } from './actors';
import { encrypt, generateNonce } from './crypto';
import { M1 } from './messages';

// Message 1
export function authenticationRequestMessage(client: Client): M1 {
    const N1 = generateNonce();
    const requestTime = '60'; // segundos
    const dataToEncrypt = client.tgs.id + requestTime + N1.toString('base64');
    const encryptedPart = encrypt(dataToEncrypt, Buffer.from(client.secret, 'base64'));
    return {
        clientId: client.id,
        encryptedData: encryptedPart,
    };
}

// Message 3
