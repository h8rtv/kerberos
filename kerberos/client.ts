import { encrypt, generateId, generateNonce, generateSecret } from './utils';

const ID_C = generateId();
const ID_AS = generateId();

const Kc = generateSecret();


// Message 1
function authRequestMessage(clientId: string, serverId: string, clientKey: Buffer) {
    const N1 = generateNonce();
    const TR = '60'; // segundos
    const encryptedPart = encrypt(serverId + TR + N1, clientKey);
    const M1 = clientId + encryptedPart.encryptedData + encryptedPart.iv;
    return M1;
}

const M1 = authRequestMessage(ID_C, ID_AS, Kc);
console.log(M1);

