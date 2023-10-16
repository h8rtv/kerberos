import { encrypt, generateNonce } from './crypto';
import { read } from './db';

// Message 1
function authRequestMessage(clientId: string, serverId: string, clientKey: Buffer) {
    const N1 = generateNonce();
    const TR = '60'; // segundos
    const encryptedPart = encrypt(serverId + TR + N1, clientKey);
    const M1 = clientId + encryptedPart.encryptedData + encryptedPart.iv;
    return M1;
}

const client = await read('client');
console.log(client);
