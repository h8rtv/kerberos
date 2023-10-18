import { TicketGrantingService } from "./actors";
import { M3, M4 } from "./messages";
import { encrypt, decrypt, generateSecret } from "./crypto";

// Message 4
export function accessGrantResponseMessage(tgs: TicketGrantingService, m3: M3): M4 {
    const tgsSecret = Buffer.from(tgs.secret, 'base64');
    const decryptedTicket = decrypt(m3.ticketTgs, tgsSecret);

    const clientIdFromTicket = decryptedTicket.substring(0, 36);
    const requestedTimeFromTicket = decryptedTicket.substring(36, 38);
    const tgsClientKeyTicket = decryptedTicket.substring(38);

    const tgsClientKey = Buffer.from(tgsClientKeyTicket, 'base64');
    const decryptedData = decrypt(m3.encryptedData, tgsClientKey);

    const clientIdFromM3 = decryptedData.substring(0, 36);
    const serviceIdFromM3 = decryptedData.substring(36, 72);
    const requestedTimeFromM3 = decryptedData.substring(72, 74);
    const N2 = decryptedData.substring(74);

    if (clientIdFromTicket != clientIdFromM3) {
        throw new Error('Ticket client id is different from M3 client id');
    }

    if (requestedTimeFromTicket != requestedTimeFromM3) {
        throw new Error('Ticket requested time is different from M3 requested time');
    }

    const service = tgs.services.find(service => service.id == serviceIdFromM3);
    if (!service) {
        throw new Error('Service not found');
    }
    const serviceSecret = Buffer.from(service.secret, 'base64');

    // TODO: Check if user has permission to consume the service

    const clientServiceKey = generateSecret().toString('base64');

    // TODO: receivedRequestTime != authorizedTime
    const ticketDataToEncrypt = clientIdFromM3 + requestedTimeFromM3 + clientServiceKey;
    const ticketService = encrypt(ticketDataToEncrypt, serviceSecret);

    const dataToEncrypt = clientServiceKey + requestedTimeFromM3 + N2;
    const encryptedData = encrypt(dataToEncrypt, tgsClientKey);

    return {
        encryptedData,
        ticketService,
    };
}
