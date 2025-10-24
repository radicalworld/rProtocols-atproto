// src/features/signup/SignupForm.tsx
import React, { useState } from 'react';
import { createAccountTemp, finalizeHandle, registerDidForHandle } from './api';

const DID_SERVER_URL = import.meta.env.VITE_DID_SERVER_URL as string | undefined;
const DOMAIN_BASE = (import.meta.env.VITE_DOMAIN_BASE as string) || 'r.radical.world';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [did, setDid] = useState<string | null>(null);
  const [requestedHandle, setRequestedHandle] = useState<string | null>(null);
  const [tempHandle, setTempHandle] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle'|'creating'|'waiting-proof'|'finalizing'|'done'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resolveDid, setResolveDid] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStage('creating');

    try {
      const { did, requestedHandle, tempHandle } = await createAccountTemp({
        email, password, username, inviteCode: inviteCode || undefined,
      });
      setDid(did);
      setRequestedHandle(requestedHandle);
      setTempHandle(tempHandle);

      // MODE B (auto): if DID_SERVER_URL is set, register and go
      if (DID_SERVER_URL) {
        setStage('finalizing');
        await registerDidForHandle(username, did);
        const resolved = await finalizeHandle(requestedHandle, password, email);
        setResolveDid(resolved.did);
        setStage('done');
        return;
      }

      // MODE A (now): show the tiny Caddy snippet to the admin
      setStage('waiting-proof');
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setStage('error');
    }
  }

  async function onIAddedCaddy() {
    if (!requestedHandle) return;
    setStage('finalizing');
    try {
      const resolved = await finalizeHandle(requestedHandle, password, email);
      setResolveDid(resolved.did);
      setStage('done');
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setStage('error');
    }
  }

  const snippet = did && username
    ? `# Caddy vhost for ${username}.${DOMAIN_BASE}
${username}.${DOMAIN_BASE} {
  @wellknown path /.well-known/atproto-did
  handle @wellknown {
    header Content-Type text/plain
    respond "did:plc:${did.split(':').pop()}" 200
  }
  respond 404
}`
    : '';

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Create your account</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="border p-2 w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Username (e.g., sofia)" value={username} onChange={e=>setUsername(e.target.value.toLowerCase())} />
        <input className="border p-2 w-full" placeholder="Invite code (optional)" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} />
        <button className="bg-black text-white px-3 py-2 rounded" disabled={stage==='creating'}>Create</button>
      </form>

      {stage === 'creating' && <p>Creating account & DID…</p>}

      {stage === 'waiting-proof' && did && (
        <div className="space-y-2">
          <p className="font-medium">
            Add this tiny Caddy block, then click “I added it”.
          </p>
          <pre className="bg-gray-100 p-3 text-sm overflow-auto">{snippet}</pre>
          <button className="bg-indigo-600 text-white px-3 py-2 rounded" onClick={onIAddedCaddy}>
            I added it — finalize handle
          </button>
          <p className="text-xs text-gray-500">
            (This serves <code>/.well-known/atproto-did</code> for <code>{username}.{DOMAIN_BASE}</code> so ATproto can verify your handle.)
          </p>
        </div>
      )}

      {stage === 'finalizing' && <p>Finalizing handle…</p>}

      {stage === 'done' && (
        <div className="space-y-1">
          <p className="font-semibold">All set 🎉</p>
          <p>Handle: <code>{requestedHandle}</code></p>
          <p>DID (resolved): <code>{resolveDid}</code></p>
        </div>
      )}

      {stage === 'error' && <p className="text-red-600">Error: {error}</p>}
    </div>
  );
}