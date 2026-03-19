// ==============================
// Global version helpers
// ==============================
export function parseVersion(v) {
    const parts = v.split(".").map((n) => parseInt(n, 10));
    if (parts.length < 2)
        throw new Error(`Bad version: ${v}`);
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}
export function cmpVersion(a, b) {
    const [am, an, ap] = parseVersion(a);
    const [bm, bn, bp] = parseVersion(b);
    if (am !== bm)
        return am < bm ? -1 : 1;
    if (an !== bn)
        return an < bn ? -1 : an > bn ? 1 : 0;
    if (ap !== bp)
        return ap < bp ? -1 : ap > bp ? 1 : 0;
    return 0;
}
export function inRange(v, r) {
    if (!r)
        return true;
    if (r.minInclusive && cmpVersion(v, r.minInclusive) === -1)
        return false; // v < minInclusive
    if (r.maxExclusive && cmpVersion(v, r.maxExclusive) !== -1)
        return false; // !(v < maxExclusive)
    return true;
}
// Bumping helpers (global policy)
export function nextMinor(v) {
    const [maj, min] = parseVersion(v);
    return `${maj}.${min + 1}.0`;
}
export function nextMajor(v) {
    const [maj] = parseVersion(v);
    return `${maj + 1}.0.0`;
}
export function firstDraft() { return "0.1.0"; }
export function promoteCandidateToStable() { return "1.0.0"; }
export function bumpStableMinor(current) {
    return nextMinor(current);
}
export function bumpStableMajor(current) {
    return nextMajor(current);
}
