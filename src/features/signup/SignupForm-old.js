import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/features/signup/SignupForm.tsx
import { useState } from 'react';
import { createAccountTemp, finalizeHandle, registerDidForHandle } from './api';
const DID_SERVER_URL = import.meta.env.VITE_DID_SERVER_URL;
const DOMAIN_BASE = import.meta.env.VITE_DOMAIN_BASE || 'r.radical.world';
export default function SignupForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [did, setDid] = useState(null);
    const [requestedHandle, setRequestedHandle] = useState(null);
    const [tempHandle, setTempHandle] = useState(null);
    const [stage, setStage] = useState('idle');
    const [error, setError] = useState(null);
    const [resolveDid, setResolveDid] = useState(null);
    async function onSubmit(e) {
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
        }
        catch (err) {
            setError(err?.message ?? String(err));
            setStage('error');
        }
    }
    async function onIAddedCaddy() {
        if (!requestedHandle)
            return;
        setStage('finalizing');
        try {
            const resolved = await finalizeHandle(requestedHandle, password, email);
            setResolveDid(resolved.did);
            setStage('done');
        }
        catch (err) {
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
    return (_jsxs("div", { className: "max-w-md mx-auto space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Create your account" }), _jsxs("form", { onSubmit: onSubmit, className: "space-y-3", children: [_jsx("input", { className: "border p-2 w-full", placeholder: "Email", value: email, onChange: e => setEmail(e.target.value) }), _jsx("input", { className: "border p-2 w-full", placeholder: "Password", type: "password", value: password, onChange: e => setPassword(e.target.value) }), _jsx("input", { className: "border p-2 w-full", placeholder: "Username (e.g., sofia)", value: username, onChange: e => setUsername(e.target.value.toLowerCase()) }), _jsx("input", { className: "border p-2 w-full", placeholder: "Invite code (optional)", value: inviteCode, onChange: e => setInviteCode(e.target.value) }), _jsx("button", { className: "bg-black text-white px-3 py-2 rounded", disabled: stage === 'creating', children: "Create" })] }), stage === 'creating' && _jsx("p", { children: "Creating account & DID\u2026" }), stage === 'waiting-proof' && did && (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "font-medium", children: "Add this tiny Caddy block, then click \u201CI added it\u201D." }), _jsx("pre", { className: "bg-gray-100 p-3 text-sm overflow-auto", children: snippet }), _jsx("button", { className: "bg-indigo-600 text-white px-3 py-2 rounded", onClick: onIAddedCaddy, children: "I added it \u2014 finalize handle" }), _jsxs("p", { className: "text-xs text-gray-500", children: ["(This serves ", _jsx("code", { children: "/.well-known/atproto-did" }), " for ", _jsxs("code", { children: [username, ".", DOMAIN_BASE] }), " so ATproto can verify your handle.)"] })] })), stage === 'finalizing' && _jsx("p", { children: "Finalizing handle\u2026" }), stage === 'done' && (_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "font-semibold", children: "All set \uD83C\uDF89" }), _jsxs("p", { children: ["Handle: ", _jsx("code", { children: requestedHandle })] }), _jsxs("p", { children: ["DID (resolved): ", _jsx("code", { children: resolveDid })] })] })), stage === 'error' && _jsxs("p", { className: "text-red-600", children: ["Error: ", error] })] }));
}
