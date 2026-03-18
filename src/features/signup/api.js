// src/features/signup/api.ts
import { makeAgent } from '@/lib/atp';
const DOMAIN_BASE = import.meta.env.VITE_DOMAIN_BASE || 'r.radical.world';
const DID_SERVER_URL = import.meta.env.VITE_DID_SERVER_URL;
const USERNAME_RE = /^[a-z0-9-]{3,}$/;
export async function createAccountTemp(args) {
    const { email, password, username, inviteCode } = args;
    if (!USERNAME_RE.test(username) || username.startsWith('-') || username.endsWith('-')) {
        throw new Error('Username must be [a-z0-9-], min 3 chars, no leading/trailing hyphen.');
    }
    const agent = makeAgent();
    const requestedHandle = `${username}.${DOMAIN_BASE}`;
    const tempHandle = `tmp-${crypto.randomUUID().slice(0, 8)}.${DOMAIN_BASE}`;
    // 1) create account with temp handle (fast path to get DID)
    const res = await agent.api.com.atproto.server.createAccount({
        email,
        password,
        handle: tempHandle,
        ...(inviteCode ? { inviteCode } : {}),
    });
    const did = res.data?.did;
    const accessJwt = res.data?.accessJwt ?? agent.session?.accessJwt ?? null;
    if (!did)
        throw new Error('PDS did not return a DID');
    return { did, accessJwt, tempHandle, requestedHandle };
}
export async function registerDidForHandle(username, did) {
    // MODE B only: if you later add a small registry (/register) on your domain
    if (!DID_SERVER_URL)
        throw new Error('DID server not configured');
    const r = await fetch(`${DID_SERVER_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, did }),
    });
    if (!r.ok)
        throw new Error(`Register DID failed: ${await r.text()}`);
}
export async function finalizeHandle(requestedHandle, password, identifier) {
    const agent = makeAgent();
    // Some PDS builds don’t return tokens on createAccount; ensure session:
    const loginId = identifier ?? requestedHandle;
    await agent.login({ identifier: loginId, password });
    await agent.api.com.atproto.identity.updateHandle({ handle: requestedHandle });
    // sanity check
    const res = await fetch(`${import.meta.env.VITE_PDS_URL}/xrpc/com.atproto.identity.resolveHandle?handle=${requestedHandle}`);
    if (!res.ok)
        throw new Error(`resolveHandle failed: ${await res.text()}`);
    const data = await res.json();
    return data;
}
