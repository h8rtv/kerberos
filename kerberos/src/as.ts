import { AuthenticationService } from "./types/actors";
import { M1, M2 } from "./types/messages";
import { encrypt, decrypt, generateSecret, generateNonce } from "./utils/crypto";
import { nameToBuffer, getOffsetTimestamp, readUserFromStdin } from "./utils/helpers";
import { read, write } from "./utils/db";
import { m2orM3toBuffer, parseM1, errorMessage } from "./messages";

// Message 2
export function authenticationResponseMessage(as: AuthenticationService, m1: M1): M2 {
    const client = as.clients.find(client => m1.clientId.equals(nameToBuffer(client.name)));
    if (!client) {
        throw new Error('Client not found');
    }
    const clientSecret = Buffer.from(client.secret, 'base64');
    const decrypted = decrypt(m1.encryptedData, clientSecret);

    const receivedServiceId = decrypted.subarray(0, 32);

    if (!receivedServiceId.equals(nameToBuffer(as.services.tgs.name))) {
        throw new Error('TGS not found');
    }
    const tgsSecret = Buffer.from(as.services.tgs.secret, 'base64');

    const receivedRequestedTime = decrypted.subarray(32, 40);
    const expireTimestamp = getOffsetTimestamp(receivedRequestedTime, as.expirationSeconds);
    if (Date.now() > expireTimestamp) {
        throw new Error('Token has expired');
    }

    const N1 = decrypted.subarray(40);

    const tgsClientKey = generateSecret();

    const ticketDataToEncrypt = Buffer.concat([nameToBuffer(client.name), receivedRequestedTime, tgsClientKey]);
    const ticketTgs = encrypt(ticketDataToEncrypt, tgsSecret);

    const dataToEncrypt = Buffer.concat([tgsClientKey, N1]);
    const encryptedData = encrypt(dataToEncrypt, clientSecret);

    return {
        encryptedData,
        ticketTgs,
    };
}

async function run() {
    const as = await read<AuthenticationService>('authenticationService');

    Bun.listen({
        hostname: as.hostname,
        port: as.port,
        socket: {
            data(socket, data) {
                try {
                    console.log('M1: parse message');
                    const m1 = parseM1(data);

                    console.log('M2: build message');
                    const m2 = authenticationResponseMessage(as, m1);

                    console.log('M2: send message');
                    socket.end(m2orM3toBuffer(m2));
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
    console.log('\t1 - Criar usuário\n');
    for await (const line of console) {
        switch (line) {
            case '1':
                const salt = generateNonce();
                const credentials = await readUserFromStdin(salt);
                as.clients.push(credentials);
                await write(as);
                console.log(`Usuário ${credentials.name} criado`);
                console.log(`O salt gerado é ${salt.toString('base64')}`);
                break;
        };
    }
}

if (import.meta.main) {
    await run();
}
