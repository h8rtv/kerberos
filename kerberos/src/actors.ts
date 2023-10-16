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

export type Actor = {
    id: string,
    ip: string,
    name: string,
};

export type Service = Actor & {
    secret: string,
};

export type Client = Service & {
    as: Actor,
    tgs: Actor,
};

export type AuthenticationService = Actor & {
    clients?: Service[],
    tgs: Service,
};

export type TicketGrantingService = Service & {
    services?: Service[],
};

