import { test } from 'bun:test';

import { read } from './db';
import { accessGrantRequestMessage, authenticationRequestMessage } from './client';
import { authenticationResponseMessage } from './as';
import { AuthenticationService, Client } from './actors';

test("all", async () => {
    const client = await read<Client>('client');
    const server = await read<AuthenticationService>('authenticationService');
    const [stateClient1, M1] = authenticationRequestMessage(client);
    const M2 = authenticationResponseMessage(server, M1);
    const [stateClient2, M3] = accessGrantRequestMessage(client, stateClient1, M2);
    console.log(stateClient2, M3);
});
