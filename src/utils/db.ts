import { Actor, ClientServicesData } from "../types/actors";

export async function read<T>(actor: string): Promise<T> {
    const file = Bun.file(`data/${actor}.json`);
    const actorData = await file.json();
    return actorData;
}

export async function writeFile(name: string, data: Actor | ClientServicesData): Promise<void> {
    await Bun.write(`data/${name}.json`, JSON.stringify(data, null, 4));
}

export async function write(actor: Actor): Promise<void> {
    writeFile(actor.name, actor);
}
