// src/hooks/useRelease.ts
import { useMemo } from "react";
import { getRelease, listReleases, latestVersion, getLineage } from "@/features/protocols/lib/releases";

export function useRelease(protocolId: string, version?: string) {
    const release = useMemo(() => getRelease(protocolId, version), [protocolId, version]);
    const releases = useMemo(() => listReleases(protocolId), [protocolId]);
    const current = useMemo(() => latestVersion(protocolId), [protocolId]);
    const lineage = useMemo(() => getLineage(protocolId), [protocolId]);
    return { release, releases, current, lineage };
}