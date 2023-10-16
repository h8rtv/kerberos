import { Actor, AuthenticationService, Client, Service, TicketGrantingService } from "./actors";
import { generateId, generateSecret } from "./crypto";
import { write } from './db';

export function mockActors() {
    const authenticationActor: Actor = {
        name: 'authenticationService',
        id: generateId(),
        ip: 'localhost:6666',
    };

    const ticketGrantingActor: Actor = {
        name: 'ticketGrantingService',
        id: generateId(),
        ip: 'localhost:6667',
    };

    const clientService: Service = {
        name: 'client',
        id: generateId(),
        ip: 'localhost:6668',
        secret: generateSecret().toString('base64'),
    };

    const client: Client = {
        ...clientService,
        as: authenticationActor,
        tgs: ticketGrantingActor,
    };

    const greetingService: Service = {
        name: 'greetingService',
        id: generateId(),
        ip: 'localhost:6669',
        secret: generateSecret().toString('base64'),
    };

    const ticketGrantingService: Service = {
        ...ticketGrantingActor,
        secret: generateSecret().toString('base64'),
    };

    const authenticationServiceWithClients: AuthenticationService = {
        ...authenticationActor,
        clients: [clientService],
        tgs: ticketGrantingService,
    };

    const ticketGrantingServiceWithServices: TicketGrantingService = {
        ...ticketGrantingService,
        secret: generateSecret().toString('base64'),
        services: [greetingService],
    };

    return [
        client,
        greetingService,
        ticketGrantingServiceWithServices,
        authenticationServiceWithClients,
    ];
}


const actors = mockActors();

await Promise.all(actors.map(write));

