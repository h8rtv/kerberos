import { Actor } from "./actors";

export async function read<T>(actor: string): Promise<T> {
    const file = Bun.file(`data/${actor}.json`);
    const actorData = await file.json();
    return actorData;
}

export async function write(actor: Actor): Promise<void> {
    await Bun.write(`data/${actor.name}.json`, JSON.stringify(actor, null, 4));
}
