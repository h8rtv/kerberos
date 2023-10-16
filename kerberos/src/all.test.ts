import { test } from 'bun:test';

import { read } from './db';
import { authenticationRequestMessage } from './client';
import { authenticationGrantMessage } from './as';
import { AuthenticationService, Client } from './actors';

test("all", async () => {
    const client = await read<Client>('client');
    const server = await read<AuthenticationService>('authenticationService');
    const M1 = authenticationRequestMessage(client);
    const M2 = authenticationGrantMessage(server, M1);
    console.log(M2);
});
