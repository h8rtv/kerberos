import { errorMessage, m4orM5toBuffer, parseM2orM3 } from "./messages";
import { TicketGrantingService } from "./types/actors";
import { M3, M4 } from "./types/messages";
import { encrypt, decrypt, generateSecret } from "./utils/crypto";
import { read, write } from "./utils/db";
import { getOffsetTimestamp, nameToBuffer, nameToString, readServiceUserFromStdin, timestampAsBuffer } from "./utils/helpers";

// Message 4
export function accessGrantResponseMessage(tgs: TicketGrantingService, m3: M3): M4 {
    const decryptedTicket = decrypt(m3.ticketTgs, Buffer.from(tgs.secret, 'base64'));

    const clientIdFromTicket = decryptedTicket.subarray(0, 32);
    const requestedTimeFromTicket = decryptedTicket.subarray(32, 40);
    const tgsClientKey = decryptedTicket.subarray(40);

    const decryptedData = decrypt(m3.encryptedData, tgsClientKey);

    const clientIdFromM3 = decryptedData.subarray(0, 32);
    const serviceIdFromM3 = decryptedData.subarray(32, 64);
    const requestedTimeFromM3 = decryptedData.subarray(64, 72);
    const N2 = decryptedData.subarray(72);

    if (!clientIdFromTicket.equals(clientIdFromM3)) {
        throw new Error('Ticket client id is different from M3 client id');
    }

    if (!requestedTimeFromTicket.equals(requestedTimeFromM3)) {
        throw new Error('Ticket requested time is different from M3 requested time');
    }

    const service = tgs.services.find(service => serviceIdFromM3.equals(nameToBuffer(service.name)));
    if (!service) {
        throw new Error('Service not found');
    }

    const strClientId = nameToString(clientIdFromTicket);
    if (!service.capabilityList.hasOwnProperty(strClientId) || !service.capabilityList[strClientId]) {
        throw new Error('User of does not have permission to access the requested service');
    }

    const expireTimestamp = getOffsetTimestamp(requestedTimeFromM3, tgs.expirationSeconds);
    if (Date.now() > expireTimestamp) {
        throw new Error('Token has expired');
    }

    const timestampBuffer = timestampAsBuffer(expireTimestamp)

    const clientServiceKey = generateSecret();
    const ticketDataToEncrypt = Buffer.concat([clientIdFromM3, timestampBuffer, clientServiceKey]);
    const ticketService = encrypt(ticketDataToEncrypt, Buffer.from(service.secret, 'base64'));

    const dataToEncrypt = Buffer.concat([clientServiceKey, timestampBuffer, N2]);
    const encryptedData = encrypt(dataToEncrypt, tgsClientKey);

    return {
        encryptedData,
        ticketService,
    };
}

async function run() {
    const tgs = await read<TicketGrantingService>('ticketGrantingService');

    Bun.listen({
        hostname: tgs.hostname,
        port: tgs.port,
        socket: {
            data(socket, data) {
                try {
                    console.log('M3: parse message');
                    const m3 = parseM2orM3(data, 'M3');

                    console.log('M4: build message');
                    const m4 = accessGrantResponseMessage(tgs, m3);

                    console.log('M4: send message');
                    socket.end(m4orM5toBuffer(m4));
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
            },
        },
    });

    console.log('\t1 - Liberar serviço para usuário\n');
    for await (const line of console) {
        selector:
        switch (line) {
            case '1':
                const { servicename, username } = await readServiceUserFromStdin();
                const service = tgs.services.find(service => service.name == servicename);
                if (!service) {
                    console.error('Service not found');
                    break selector;
                }
                Object.assign(service.capabilityList, {
                    [username]: true,
                });
                await write(tgs);
                console.log(`Serviço ${servicename} liberado para usuário ${username}`);
                break;
        };
    }
}

if (import.meta.main) {
    await run();
}
