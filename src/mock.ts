import { ActorWithSecret, AuthenticationService, Client, ClientServicesData, Service, ServiceWithSecret, TicketGrantingService } from "./types/actors";
import { generateSecret, hash } from "./utils/crypto";
import { write, writeFile } from './utils/db';

function asService(service: Service): Service {
    return {
        hostname: service.hostname,
        port: service.port,
        name: service.name,
    };
}

function asActorWithSecret(actor: ActorWithSecret): ActorWithSecret {
    return {
        name: actor.name,
        secret: actor.secret,
    };
}

export function mockActors(createBaseClient: boolean = true): [Client | ClientServicesData, ServiceWithSecret, TicketGrantingService, AuthenticationService] {
    const authenticationService: Service = {
        name: 'authenticationService',
        hostname: 'localhost',
        port: 6666,
    };

    const ticketGrantingService: ServiceWithSecret = {
        name: 'ticketGrantingService',
        hostname: 'localhost',
        port: 6667,
        secret: generateSecret().toString('base64'),
    };

    const greetingService: ServiceWithSecret = {
        name: 'greetingService',
        hostname: 'localhost',
        port: 6668,
        secret: generateSecret().toString('base64'),
    };

    const client: Client | ClientServicesData = {
        services: {
            as: authenticationService,
            tgs: asService(ticketGrantingService),
            greeting: asService(greetingService),
        },
    };

    const authenticationServiceWithClients: AuthenticationService = {
        ...authenticationService,
        expirationSeconds: 10,
        clients: [],
        services: {
            tgs: asActorWithSecret(ticketGrantingService),
        },
    };

    const ticketGrantingServiceWithServices: TicketGrantingService = {
        ...ticketGrantingService,
        expirationSeconds: 10,
        services: [{
            ...asActorWithSecret(greetingService),
            capabilityList: {},
        }],
    };

    if (createBaseClient) {
        Object.assign(client, {
            name: 'client',
            secret: hash('client_placeholder_password'),
        });
        authenticationServiceWithClients.clients.push(client as Client);
        ticketGrantingServiceWithServices.services[0].capabilityList[(client as Client).name] = true;
    }

    return [
        client,
        greetingService,
        ticketGrantingServiceWithServices,
        authenticationServiceWithClients,
    ];
}

if (import.meta.main) {
    const actors = mockActors(false);
    const [client, ...services] = actors;
    await Promise.all(services.map(write));
    await writeFile('client', client);
}

