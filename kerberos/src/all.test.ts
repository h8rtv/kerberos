import { test } from 'bun:test';

import { read } from './db';
import { accessGrantRequestMessage, authenticationRequestMessage, serviceRequestMessage, serviceResult } from './client';
import { authenticationResponseMessage } from './as';
import { AuthenticationService, Client, Service, TicketGrantingService } from './actors';
import { accessGrantResponseMessage } from './tgs';
import { serviceResponseMessage } from './greeting';

test("all", async () => {
    const client = await read<Client>('client');
    const as = await read<AuthenticationService>('authenticationService');
    const tgs = await read<TicketGrantingService>('ticketGrantingService');
    const service = await read<Service>('greetingService');

    const [stateClient1, M1] = authenticationRequestMessage(client);
    const M2 = authenticationResponseMessage(as, M1);

    const [stateClient2, M3] = accessGrantRequestMessage(client, stateClient1, M2);
    const M4 = accessGrantResponseMessage(tgs, M3);

    const [stateClient3, M5] = serviceRequestMessage(client, stateClient2, M4);
    const M6 = serviceResponseMessage(service, M5);
    serviceResult(client, stateClient3, M6);

});
