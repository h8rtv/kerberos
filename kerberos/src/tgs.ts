import { TicketGrantingService } from "./actors";
import { M3, M4 } from "./messages";
import { encrypt, decrypt, generateSecret, idToBuffer } from "./crypto";

// Message 4
export function accessGrantResponseMessage(tgs: TicketGrantingService, m3: M3): M4 {
    const decryptedTicket = decrypt(m3.ticketTgs, Buffer.from(tgs.secret, 'base64'));

    const clientIdFromTicket = decryptedTicket.subarray(0, 16);
    const requestedTimeFromTicket = decryptedTicket.subarray(16, 24);
    const tgsClientKey = decryptedTicket.subarray(24);

    const decryptedData = decrypt(m3.encryptedData, tgsClientKey);

    const clientIdFromM3 = decryptedData.subarray(0, 16);
    const serviceIdFromM3 = decryptedData.subarray(16, 32);
    const requestedTimeFromM3 = decryptedData.subarray(32, 40);
    const N2 = decryptedData.subarray(40);

    if (!clientIdFromTicket.equals(clientIdFromM3)) {
        throw new Error('Ticket client id is different from M3 client id');
    }

    if (!requestedTimeFromTicket.equals(requestedTimeFromM3)) {
        throw new Error('Ticket requested time is different from M3 requested time');
    }

    const service = tgs.services.find(service => serviceIdFromM3.equals(idToBuffer(service.id)));
    if (!service) {
        throw new Error('Service not found');
    }
    // TODO: Check if user has permission to consume the service
    const clientServiceKey = generateSecret();
    // TODO: receivedRequestTime != authorizedTime
    const ticketDataToEncrypt = Buffer.concat([clientIdFromM3, requestedTimeFromM3, clientServiceKey]);
    const ticketService = encrypt(ticketDataToEncrypt, Buffer.from(service.secret, 'base64'));

    const dataToEncrypt = Buffer.concat([clientServiceKey, requestedTimeFromM3, N2]);
    const encryptedData = encrypt(dataToEncrypt, tgsClientKey);

    return {
        encryptedData,
        ticketService,
    };
}
