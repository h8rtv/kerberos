import { Service } from "./actors";
import { M5, M6 } from "./messages";
import { encrypt, decrypt } from "./crypto";

// Message 6
export function serviceResponseMessage(service: Service, m5: M5): M6 {
    const serviceSecret = Buffer.from(service.secret, 'base64');
    const decryptedTicket = decrypt(m5.ticketService, serviceSecret);

    const clientIdFromTicket = decryptedTicket.substring(0, 36);
    const authorizedTimeFromTicket = decryptedTicket.substring(36, 38);
    const clientServiceKeyTicket = decryptedTicket.substring(38);

    const clientServiceKey = Buffer.from(clientServiceKeyTicket, 'base64');
    const decryptedData = decrypt(m5.encryptedData, clientServiceKey);

    const clientIdFromM5 = decryptedData.substring(0, 36);
    const authorizedTimeFromM5 = decryptedData.substring(36, 38);

    if (clientIdFromTicket != clientIdFromM5) {
        throw new Error('Ticket client id is different from M5 client id');
    }

    if (authorizedTimeFromTicket != authorizedTimeFromM5) {
        throw new Error('Ticket requested time is different from M5 requested time');
    }

    const N3 = decryptedData.substring(38);

    const dataToEncrypt = 'Resposta' + N3;
    const encryptedData = encrypt(dataToEncrypt, clientServiceKey);

    return {
        encryptedData,
    };
}
