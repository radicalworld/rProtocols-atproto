// src/features/protocols/releases.ts
import { protocolReleases } from "@/data/releases";
import { cmpVersion, } from "@/domain/types";
export function latestVersion(id) {
    return protocolReleases[id]?.current;
}
export function listReleases(id) {
    const bucket = protocolReleases[id];
    if (!bucket)
        return [];
    // newest version first
    return Object.values(bucket.releases).sort((a, b) => -cmpVersion(a.version, b.version));
}
export function getRelease(id, version) {
    const bucket = protocolReleases[id];
    if (!bucket)
        return undefined;
    const v = (version ?? bucket.current);
    return v ? bucket.releases[v] : undefined;
}
// If keeping lineage data elsewhere, leave this passthrough as-is.
// Update its type if you have a global Lineage type.
export function getLineage(id) {
    // @ts-expect-error protocolLineage is provided by seeds; type it if desired
    return protocolLineage[id] ?? { previousVersion: null, forkOf: null, children: [] };
}
// Pretty-print version + stage under unified stages
export function formatVersionStage(version, stage) {
    if (!version)
        return "";
    if (!stage || stage === "stable")
        return version;
    // Capitalize stage label
    const label = stage.charAt(0).toUpperCase() + stage.slice(1);
    return `${version} • ${label}`;
}
