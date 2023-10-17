import { TicketGrantingService } from "./actors";
import { M3, M4 } from "./messages";
import { encrypt, decrypt, generateSecret } from "./crypto";

// Message 4
export function authenticationResponseMessage(tgs: TicketGrantingService, m3: M3) {
    m3.
    const client = as.clients.find(client => client.id == m1.clientId);
    if (!client) {
        throw new Error('Client not found');
    }
    const clientSecret = Buffer.from(client.secret, 'base64');
    const decryptedText = decrypt(m1.encryptedData, clientSecret);

    const receivedServiceId = decryptedText.substring(0, 36);

    if (receivedServiceId != as.tgs.id) {
        throw new Error('TGS not found');
    }

    const tgsSecret = Buffer.from(as.tgs.secret, 'base64');

    const receivedRequestedTime = decryptedText.substring(36, 38);
    const N1 = decryptedText.substring(38);

    const tgsClientKey = generateSecret().toString('base64');

    const ticketDataToEncrypt = client.id + receivedRequestedTime + tgsClientKey;
    const ticketTgs = encrypt(ticketDataToEncrypt, tgsSecret);

    const dataToEncrypt = tgsClientKey + N1;
    const encryptedData = encrypt(dataToEncrypt, clientSecret);

    return {
        encryptedData,
        ticketTgs,
    };
}
