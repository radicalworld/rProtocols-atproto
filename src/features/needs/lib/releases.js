// src/features/needs/lib/releases.ts
// Lightweight client-side cache + helpers, modeled after protocols' releases utils.
const rootCache = new Map(); // rootId -> root info
const releaseCache = new Map(); // rootId -> (version -> release)
const API_BASE = import.meta.env.VITE_APP_API_URL ?? '/api';
// ---- helpers ----
function vKey(v) {
    const [maj, min] = v.split('.').map(n => parseInt(n || '0', 10));
    return maj * 1_000_000 + min; // simple sortable key
}
function sortVersionsNumeric(versions) {
    return versions.slice().sort((a, b) => vKey(a) - vKey(b));
}
// ---- fetchers ----
async function fetchRoot(rootId) {
    const res = await fetch(`${API_BASE}/needs/${encodeURIComponent(rootId)}`);
    if (!res.ok)
        throw new Error(await res.text());
    const data = await res.json(); // { root, version, displayVersion }
    const root = data.root;
    const rc = {
        did: root.did,
        versions: root.versions || {},
        publishedVersion: root.publishedVersion,
        latestVersion: root.latestVersion,
        latestDraftVersion: root.latestDraftVersion,
        followCount: root.followCount ?? 0,
    };
    rootCache.set(rootId, rc);
    return rc;
}
async function fetchVersion(rootId, version) {
    const res = await fetch(`${API_BASE}/needs/${encodeURIComponent(rootId)}/v/${encodeURIComponent(version)}`);
    if (!res.ok)
        throw new Error(await res.text());
    const v = await res.json();
    const root = rootCache.get(rootId);
    const release = {
        rootId,
        version: v.version,
        stage: v.stage,
        title: v.title,
        description: v.description,
        purpose: v.purpose,
        language: v.language,
        tags: Array.isArray(v.tags) ? v.tags : [],
        date: v.date,
        cid: v.cid,
        did: root?.did,
        followCount: root?.followCount ?? 0,
        // optional parity fields if you later add them on the server:
        shortUrl: v.shortUrl,
        qrCode: v.qrCode,
        history: v.history,
        attribution: v.attribution,
    };
    if (!releaseCache.has(rootId))
        releaseCache.set(rootId, new Map());
    releaseCache.get(rootId).set(version, release);
    return release;
}
// ---- public API (mirrors protocols’ lib) ----
/**
 * Prime cache for a Need: loads root + all listed versions into releaseCache.
 * Call this once (e.g., in a useEffect) before using get/list helpers synchronously.
 */
export async function primeNeedReleases(rootId) {
    const root = await fetchRoot(rootId);
    const versions = Object.keys(root.versions || {});
    // fetch each version (in parallel)
    await Promise.all(versions.map(v => releaseCache.get(rootId)?.get(v) ? Promise.resolve() : fetchVersion(rootId, v)));
}
/**
 * Get a single release (from cache).
 * If version is omitted, resolves to published → latest → latestDraft.
 */
export function getNeedRelease(rootId, version) {
    const root = rootCache.get(rootId);
    if (!root)
        return undefined;
    const pick = version ||
        root.publishedVersion ||
        root.latestVersion ||
        root.latestDraftVersion;
    if (!pick)
        return undefined;
    return releaseCache.get(rootId)?.get(pick);
}
/**
 * List all releases (from cache), sorted ascending by version.
 */
export function listNeedReleases(rootId) {
    const map = releaseCache.get(rootId);
    if (!map)
        return [];
    const all = Array.from(map.values());
    return sortVersionsNumeric(all.map(r => r.version)).map(v => map.get(v));
}
/**
 * Latest display version preference (published → latest → latestDraft).
 */
export function latestNeedVersion(rootId) {
    const root = rootCache.get(rootId);
    if (!root)
        return undefined;
    return root.publishedVersion || root.latestVersion || root.latestDraftVersion;
}
/**
 * Lineage: compact history for a UI timeline
 */
export function getNeedLineage(rootId) {
    const root = rootCache.get(rootId);
    if (!root)
        return [];
    const entries = Object.entries(root.versions || {}).map(([version, info]) => ({
        version,
        stage: info.stage,
        date: info.date,
    }));
    return sortVersionsNumeric(entries.map(e => e.version)).map(v => {
        const e = entries.find(x => x.version === v);
        return e;
    });
}
