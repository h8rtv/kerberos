import { EncryptData } from "./crypto";

export type M1 = {
    clientId: string,
    encryptedData: EncryptData,
};

export type M2 = {
    ticketTgs: EncryptData,
    encryptedData: EncryptData,
};
