import { Service } from "./actors";
import { M5, M6 } from "./messages";
import { encrypt, decrypt } from "./crypto";

// Message 6
export function serviceResponseMessage(service: Service, m5: M5): M6 {
    const decryptedTicket = decrypt(m5.ticketService, Buffer.from(service.secret, 'base64'));

    const clientIdFromTicket = decryptedTicket.slice(0, 16);
    const authorizedTimeFromTicket = decryptedTicket.slice(16, 24);
    const clientServiceKey = decryptedTicket.slice(24);

    const decryptedData = decrypt(m5.encryptedData, clientServiceKey);

    const clientIdFromM5 = decryptedData.slice(0, 16);
    const authorizedTimeFromM5 = decryptedData.slice(16, 24);

    if (clientIdFromTicket != clientIdFromM5) {
        throw new Error('Ticket client id is different from M5 client id');
    }

    if (authorizedTimeFromTicket != authorizedTimeFromM5) {
        throw new Error('Ticket requested time is different from M5 requested time');
    }

    const N3 = decryptedData.slice(24);

    const dataToEncrypt = Buffer.from('Resposta') + N3;
    const encryptedData = encrypt(dataToEncrypt, clientServiceKey);

    return {
        encryptedData,
    };
}
