import { test } from 'bun:test';

import {
    accessGrantRequestMessage,
    authenticationRequestMessage,
    serviceRequestMessage,
    serviceResult,
} from '../client';
import { authenticationResponseMessage } from '../as';
import { accessGrantResponseMessage } from '../tgs';
import { serviceResponseMessage } from '../greeting';
import { mockActors } from '../mock';
import {
    m1toBuffer,
    m2orM3toBuffer,
    m4orM5toBuffer,
    m6toBuffer,
    parseM1,
    parseM2orM3,
    parseM4orM5,
    parseM6,
} from '../messages';
import { Client } from '../types/actors';

test("all", async () => {
    const [
        client,
        service,
        tgs,
        as,
    ] = mockActors();

    const [stateClient1, M1] = authenticationRequestMessage(client as Client);
    const parsedM1 = parseM1(m1toBuffer(M1));

    const M2 = authenticationResponseMessage(as, parsedM1);
    const parsedM2 = parseM2orM3(m2orM3toBuffer(M2), 'M2');

    const [stateClient2, M3] = accessGrantRequestMessage(client as Client, stateClient1, parsedM2);
    const parsedM3 = parseM2orM3(m2orM3toBuffer(M3), 'M3');

    const M4 = accessGrantResponseMessage(tgs, parsedM3);
    const parsedM4 = parseM4orM5(m4orM5toBuffer(M4), 'M4');

    const [stateClient3, M5] = serviceRequestMessage(client as Client, stateClient2, parsedM4);
    const parsedM5 = parseM4orM5(m4orM5toBuffer(M5), 'M5');

    const M6 = serviceResponseMessage(service, parsedM5);
    const parsedM6 = parseM6(m6toBuffer(M6));

    serviceResult(stateClient3, parsedM6);
});
