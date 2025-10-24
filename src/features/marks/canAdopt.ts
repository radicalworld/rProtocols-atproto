// Replace this stub once ProtocolProfile loads the actual ProtocolVersion
export function canAdopt(version?: { stage?: string; version?: string }) {
    if (!version) return false;                       // safe default
    const st = version.stage ?? "";
    if (st === "stable" || st === "candidate") return true;
    return false;
}