import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import * as dagJson from "@ipld/dag-json";
import { canonicalize } from "./canonical";

/**
 * Compute a CIDv1 for a Protocol "content" object using DAG-JSON + sha256.
 * - Input is first canonicalized (stable key order)
 * - Then encoded to DAG-JSON bytes
 * - Then hashed and wrapped in a CID
 */
export async function cidForProtocolContent(content: unknown): Promise<CID> {
    const canon = canonicalize(content);
    const bytes = dagJson.encode(canon);          // Uint8Array
    const mh = await sha256.digest(bytes);        // multihash
    return CID.createV1(dagJson.code, mh);        // v1 CID with dag-json codec
}

/** Helpers */
export async function cidString(content: unknown): Promise<string> {
    return (await cidForProtocolContent(content)).toString(); // e.g., "bafyre..."
}

/** Verify that content matches a given CID string. */
export async function verifyCid(content: unknown, expectedCid: string): Promise<boolean> {
    const actual = await cidString(content);
    return actual === expectedCid;
}