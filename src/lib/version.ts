/**
 * Parse a "major.minor" version string (e.g., "1.2").
 * If missing or malformed, returns { major:0, minor:0 }. */

export function parseVersion(ver: string | undefined) {
    if (!ver) return { major: 0, minor: 0, patch: 0 };
    const [majStr, minStr, patchStr] = ver.split(".");
    let major = parseInt(majStr, 10);
    if (isNaN(major)) major = 0;
    const minor = parseInt(minStr, 10) || 0;
    const patch = parseInt(patchStr, 10) || 0;
    return { major, minor, patch };
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
    if (va.minor !== vb.minor) return va.minor - vb.minor;
    return va.patch - vb.patch;
}