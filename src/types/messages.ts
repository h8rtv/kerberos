import { EncryptData } from "../utils/crypto";

export type M1 = {
    clientId: Buffer,
    encryptedData: EncryptData,
};

export type M2 = {
    ticketTgs: EncryptData,
    encryptedData: EncryptData,
};

export type M3 = M2;

export type M4 = {
    ticketService: EncryptData,
    encryptedData: EncryptData,
};

export type M5 = M4;

export type M6 = {
    encryptedData: EncryptData,
};

export enum AuthStatus {
    Success = 0,
    Fail = 1,
};
