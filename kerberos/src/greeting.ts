import { errorMessage, m6toBuffer, parseM4orM5 } from "./messages";
import { ServiceWithSecret } from "./types/actors";
import { M5, M6 } from "./types/messages";
import { encrypt, decrypt } from "./utils/crypto";
import { read } from "./utils/db";
import { getOffsetTimestamp } from "./utils/helpers";

// Message 6
export function serviceResponseMessage(service: ServiceWithSecret, m5: M5): M6 {
    const decryptedTicket = decrypt(m5.ticketService, Buffer.from(service.secret, 'base64'));

    const clientIdFromTicket = decryptedTicket.subarray(0, 32);
    const expireTimeFromTicket = decryptedTicket.subarray(32, 40);
    const clientServiceKey = decryptedTicket.subarray(40);

    const decryptedData = decrypt(m5.encryptedData, clientServiceKey);

    const clientIdFromM5 = decryptedData.subarray(0, 32);
    const expireTimeFromM5 = decryptedData.subarray(32, 40);

    if (!clientIdFromTicket.equals(clientIdFromM5)) {
        throw new Error('Ticket client id is different from M5 client id');
    }

    if (!expireTimeFromTicket.equals(expireTimeFromM5)) {
        throw new Error('Ticket requested time is different from M5 requested time');
    }

    const expireTimestamp = getOffsetTimestamp(expireTimeFromM5);
    if (Date.now() > expireTimestamp) {
        throw new Error('Token has expired');
    }

    const N3 = decryptedData.subarray(40);

    const msg = 'Olá, meu caro';
    const dataToEncrypt = Buffer.concat([N3, Buffer.from(msg)]);
    const encryptedData = encrypt(dataToEncrypt, clientServiceKey);

    return {
        encryptedData,
    };
}

async function run() {
    const as = await read<ServiceWithSecret>('greetingService');

    Bun.listen({
        hostname: as.hostname,
        port: as.port,
        socket: {
            data(socket, data) {
                try {
                    console.log('M5: parse message');
                    const m5 = parseM4orM5(data, 'M5');

                    console.log('M6: build message');
                    const m6 = serviceResponseMessage(as, m5);

                    console.log('M6: send message');
                    socket.end(m6toBuffer(m6));
                } catch (error) {
                    if (error instanceof Error) {
                        console.error(error.message);
                    } else {
                        console.error(error);
                    }
                    socket.end(errorMessage());
                } finally {
                    console.log('End\n');
                }
            },
            error(socket, error) {
                if (error instanceof Error) {
                    console.error(error.message);
                } else {
                    console.error(error);
                }
                socket.end();
            }
        },
    });
}

if (import.meta.main) {
    await run();
}
