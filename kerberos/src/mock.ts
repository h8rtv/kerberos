import { Actor, AuthenticationService, Client, Service, TicketGrantingService } from "./actors";
import { generateId, generateSecret } from "./crypto";
import { write } from './db';

function asActor(actor: Actor) {
    return {
        id: actor.id,
        ip: actor.ip,
        name: actor.name,
    };
}

function asService(service: Service) {
    return {
        id: service.id,
        ip: service.ip,
        name: service.name,
        secret: service.secret,
    };
}

export function mockActors() {
    const authenticationActor: Actor = {
        name: 'authenticationService',
        id: generateId(),
        ip: 'localhost:6666',
    };

    const ticketGrantingService: Service = {
        name: 'ticketGrantingService',
        id: generateId(),
        ip: 'localhost:6667',
        secret: generateSecret().toString('base64'),
    };

    const clientService: Service = {
        name: 'client',
        id: generateId(),
        ip: 'localhost:6668',
        secret: generateSecret().toString('base64'),
    };

    const greetingService: Service = {
        name: 'greetingService',
        id: generateId(),
        ip: 'localhost:6669',
        secret: generateSecret().toString('base64'),
    };

    const client: Client = {
        ...clientService,
        as: authenticationActor,
        tgs: asActor(ticketGrantingService),
        greeting: asActor(greetingService),
    };

    const authenticationServiceWithClients: AuthenticationService = {
        ...authenticationActor,
        clients: [clientService],
        tgs: ticketGrantingService,
    };

    const ticketGrantingServiceWithServices: TicketGrantingService = {
        ...ticketGrantingService,
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

