export type Actor = {
    name: string,
};

export type ActorWithSecret = Actor & {
    secret: string,
};

type ServiceBase = {
    hostname: string,
    port: number
};

export type Service = Actor & ServiceBase;
export type ServiceWithSecret = ActorWithSecret & ServiceBase;

type TicketEmitter = {
    expirationSeconds: number,
};

export type ClientServicesData = {
    services: {
        as: Service,
        tgs: Service,
        greeting: Service,
    },
    salt?: string,
};
export type Client = ActorWithSecret & ClientServicesData;

export type AuthenticationService = Service & TicketEmitter & {
    clients: ActorWithSecret[],
    services: {
        tgs: ActorWithSecret,
    },
};

type CapabilityList = {
    [key: string]: boolean,
};

export type TicketGrantingService = ServiceWithSecret & TicketEmitter & {
    services: [ActorWithSecret & {
        capabilityList: CapabilityList,
    }],
};

