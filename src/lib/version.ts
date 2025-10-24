/**
 * Parse a "major.minor" version string (e.g., "1.2").
 * If missing or malformed, returns { major:0, minor:0 }. */

export function parseVersion(ver: string | undefined) {
    if (!ver) return { major: 0, minor: 0 };
    const [majStr, minStr] = ver.split(".");
    const major = parseInt(majStr, 10) || 0;
    const minor = parseInt(minStr, 10) || 0;
    return { major, minor };
}

/**
 * True if this is a draft (major = 0) */
export function isDraft(ver: string | undefined) {
    const { major } = parseVersion(ver);
    return major === 0;
}


/**
 * Compare two versions.
 * Returns -1, 0, 1 if a < b, a = b, a > b */
export function compareVersions(a: string, b: string) {
    const va = parseVersion(a);
    const vb = parseVersion(b);
    if (va.major !== vb.major) return va.major - vb.major;
    return va.minor - vb.minor;
}