// Canonical JSON utils for rProtocols

// Normalize newlines to "\n"
const NL = /\r\n?/g;

function sortObject(value: any): any {
    if (value === null || typeof value !== "object") return value;

    if (Array.isArray(value)) {
        return value.map(sortObject);
    }

    // Regular object: sort keys asc, recurse
    const out: Record<string, any> = {};
    for (const k of Object.keys(value).sort()) {
        out[k] = sortObject(value[k]);
    }
    return out;
}

/** Canonicalize an arbitrary JS value into a stable JSON string. */
export function canonicalJSONStringify(value: unknown): string {
    // 1) Deep sort keys
    const sorted = sortObject(value);
    // 2) Stringify without whitespace changes
    const json = JSON.stringify(sorted);
    // 3) Normalize newlines
    return json.replace(NL, "\n");
}

/** Convenience: produces the canonical, deeply-sorted JS object. */
export function canonicalize<T>(value: T): T {
    return JSON.parse(canonicalJSONStringify(value));
}