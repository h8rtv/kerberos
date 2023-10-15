import { generateId, generateSecret } from './utils'

// Client knows ->
//  - Client secret

// AS Server knows ->
//  - Client secret
//  - TGS secret 

// TGS Server knows ->
//  - TGS secret 
//  - Services secrets

// Service knows ->
//  - Service secret

type Actor = {
    id: string,
    ip: string,
    name: string,
};

type Client = Actor & {
    secret: string,
};
type Service = Client;

type AuthenticationService = Actor & {
    clients?: Client[],
    tgs: Service,
};

type TicketGrantingService = Service & {
    services?: Service[],
};

function generateActors() {
    const client: Client = {
        name: 'client',
        id: generateId(),
        ip: 'localhost:6666',
        secret: generateSecret().toString('base64'),
    };

    const greetingService: Service = {
        name: 'greetingService',
        id: generateId(),
        ip: 'localhost:6667',
        secret: generateSecret().toString('base64'),
    };

    const ticketGrantingService: Service = {
        name: 'ticketGrantingService',
        id: generateId(),
        ip: 'localhost:6668',
        secret: generateSecret().toString('base64'),
    };

    const ticketGrantingServiceWithServices: TicketGrantingService = {
        ...ticketGrantingService,
        services: [greetingService],
    };

    const authenticationService: AuthenticationService = {
        name: 'authenticationService',
        id: generateId(),
        ip: 'localhost:6669',
        clients: [client],
        tgs: ticketGrantingService,
    };

    return [
        client,
        greetingService,
        ticketGrantingServiceWithServices,
        authenticationService,
    ];
}

const actors = generateActors();

for (const actor of actors) {
    Bun.write(`data/${actor.name}.json`, JSON.stringify(actor, null, 4));
}

