// src/hooks/useReleasesCollection.ts
import { getRelease } from "@/features/protocols/lib/releases";

type Item = { id: string; version?: string; changed?: string };
export function useReleasesCollection(items: Item[]) {
    return items
        .map(({ id, version }) => ({ id, release: getRelease(id, version) }))
        .filter(x => !!x.release) as Array<{ id: string; release: NonNullable<ReturnType<typeof getRelease>> }>;
}