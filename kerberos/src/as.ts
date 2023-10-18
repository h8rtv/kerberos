import { AuthenticationService } from "./actors";
import { M1, M2 } from "./messages";
import { encrypt, decrypt, generateSecret, idToBuffer, getDateFromBufferTimestamp } from "./crypto";

// Message 2
export function authenticationResponseMessage(as: AuthenticationService, m1: M1): M2 {
    const client = as.clients.find(client => client.id == m1.clientId);
    if (!client) {
        throw new Error('Client not found');
    }
    const clientSecret = Buffer.from(client.secret, 'base64');
    const decrypted = decrypt(m1.encryptedData, clientSecret);

    const receivedServiceId = decrypted.slice(0, 16);

    if (receivedServiceId != idToBuffer(as.tgs.id)) {
        throw new Error('TGS not found');
    }

    const tgsSecret = Buffer.from(as.tgs.secret, 'base64');


    const receivedRequestedTime = decrypted.slice(16, 24);
    // TODO: Check if receivedRequestTime is within the time limit (5 min)
    const _receivedRequestedTimeDate = getDateFromBufferTimestamp(receivedRequestedTime);

    const N1 = decrypted.slice(24);

    const tgsClientKey = generateSecret();

    const ticketDataToEncrypt = Buffer.concat([client.id, receivedRequestedTime, tgsClientKey]);
    const ticketTgs = encrypt(ticketDataToEncrypt, tgsSecret);

    const dataToEncrypt = Buffer.concat([tgsClientKey, N1]);
    const encryptedData = encrypt(dataToEncrypt, clientSecret);

    return {
        encryptedData,
        ticketTgs,
    };
}
