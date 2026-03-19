import { apiFetch } from "./client";
export function fetchNeed(rootId) {
    return apiFetch(`/needs/${rootId}`); // GET -> { root, version, displayVersion }
}
export function fetchNeedVersion(rootId, version) {
    return apiFetch(`/needs/${rootId}/v/${version}`); // GET
}
export function createNeedDraft(rootId, baseVersion, nextVersion) {
    return apiFetch(`/needs/${rootId}/drafts`, {
        method: "POST",
        body: JSON.stringify({ baseVersion, nextVersion }),
    });
}
export function updateNeedDraft(rootId, version, patch) {
    return apiFetch(`/needs/${rootId}/v/${version}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
    });
}
export function promoteNeedVersion(rootId, version, toStage, changeDescription) {
    return apiFetch(`/needs/${rootId}/v/${version}/stage`, {
        method: "POST",
        body: JSON.stringify({ toStage, changeDescription }),
    });
}
export function diffNeed(rootId, a, b) {
    const q = new URLSearchParams({ a, b }).toString();
    return apiFetch(`/needs/${rootId}/diff?${q}`); // GET -> { a, b, diffs }
}
