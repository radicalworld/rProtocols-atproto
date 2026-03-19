import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/features/signup/SignupForm.tsx
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePdsConfig } from "./usePdsConfig";
import { useSession } from "@/features/auth/SessionProvider";
const PDS_URL = import.meta.env.VITE_PDS_URL || "https://r.radical.world";
const DID_SERVER_URL = import.meta.env.VITE_DID_SERVER_URL;
const REGISTRY_TOKEN = import.meta.env.VITE_REGISTRY_TOKEN;
export default function SignupForm({ onDone }) {
    const { cfg, loading } = usePdsConfig();
    const [localPart, setLocalPart] = useState("");
    const [domain, setDomain] = useState(null);
    const [email, setEmail] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    // state for the two-stage flow
    const [stage, setStage] = useState("idle");
    const [did, setDid] = useState(null);
    const [requestedHandle, setRequestedHandle] = useState(null);
    const rawDomains = cfg?.availableUserDomains ?? ["r.radical.world"];
    const domainValues = rawDomains.map(d => d.replace(/^\.+/, "")); // strip leading "."
    const selectedDomain = (domain ?? domainValues[0]);
    const { signIn, session } = useSession();
    const handle = useMemo(() => {
        const lp = (localPart || "")
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/^-+|-+$/g, ""); // no leading/trailing "-"
        if (!lp)
            return "";
        return `${lp}.${selectedDomain}`;
    }, [localPart, selectedDomain]);
    const validUsername = (lp) => /^[a-z0-9-]{3,}$/.test(lp) && !lp.startsWith("-") && !lp.endsWith("-");
    async function createAccountTemp() {
        // Use a temp handle to get the DID immediately
        const tempHandle = `tmp-${crypto.randomUUID().slice(0, 8)}.${selectedDomain}`;
        const body = {
            email: email.trim(),
            password,
            handle: tempHandle,
        };
        if (cfg?.inviteCodeRequired)
            body.inviteCode = inviteCode.trim();
        const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await r.json();
        if (!r.ok) {
            throw new Error(data?.message || data?.error || "createAccount failed");
        }
        // Some PDS builds also return accessJwt; we’ll just login later to be safe
        return { did: data.did };
    }
    console.debug("VITE_DID_SERVER_URL", DID_SERVER_URL);
    console.debug("VITE_REGISTRY_TOKEN", REGISTRY_TOKEN ? "(present)" : "(missing)");
    async function registerDidForHandle(username, did) {
        if (!DID_SERVER_URL)
            return; // auto-mode off → skip
        // normalize + basic guardrails
        const u = username.trim().toLowerCase();
        if (!/^[a-z0-9-]{3,}$/.test(u) || u.startsWith("-") || u.endsWith("-")) {
            throw new Error("Invalid username format");
        }
        if (!did.startsWith("did:")) {
            throw new Error("Invalid DID");
        }
        const headers = { "Content-Type": "application/json" };
        if (REGISTRY_TOKEN)
            headers["X-Registry-Token"] = REGISTRY_TOKEN;
        const rr = await fetch(`${DID_SERVER_URL}/register`, {
            method: "POST",
            headers,
            body: JSON.stringify({ username: u, did }),
        });
        if (!rr.ok) {
            const msg = await rr.text().catch(() => "");
            // helpfully surface common causes
            if (rr.status === 401 || rr.status === 403) {
                throw new Error("Registry unauthorized. Check VITE_REGISTRY_TOKEN and server REGISTRY_TOKEN.");
            }
            throw new Error(`DID register failed (${rr.status}): ${msg || "unknown error"}`);
        }
    }
    async function updateHandle(accessJwt, h) {
        const r = await fetch(`${PDS_URL}/xrpc/com.atproto.identity.updateHandle`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${accessJwt}`,
            },
            body: JSON.stringify({ handle: h }),
        });
        if (!r.ok) {
            const t = await r.text();
            throw new Error(`updateHandle failed: ${t}`);
        }
    }
    async function resolveHandle(h) {
        const r = await fetch(`${PDS_URL}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(h)}`);
        if (!r.ok)
            throw new Error(`resolveHandle failed: ${await r.text()}`);
        return (await r.json());
    }
    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        // basic client validation
        const [lp, dom] = [localPart.trim().toLowerCase(), selectedDomain];
        if (!validUsername(lp)) {
            setError("Username must be [a-z0-9-], min 3 chars, no leading/trailing hyphen.");
            return;
        }
        if (!dom) {
            setError("Please select a domain.");
            return;
        }
        setStage("creating");
        try {
            const { did } = await createAccountTemp();
            setDid(did);
            setRequestedHandle(`${lp}.${dom}`);
            // If you have a DID registry configured, auto-register and finalize
            if (DID_SERVER_URL) {
                await registerDidForHandle(lp, did);
                setStage("finalizing");
                // sign in to get access/refresh + update global session UI
                const signInResult = await signIn(email.trim(), password);
                // use the fresh access token to finalize the handle
                await updateHandle(signInResult?.accessJwt || session?.accessJwt, `${lp}.${dom}`);
                // const access = await login(email.trim()); // login by email is safest
                // await updateHandle(access, `${lp}.${dom}`);
                const res = await resolveHandle(`${lp}.${dom}`);
                setStage("done");
                onDone?.({ did: res.did, handle: `${lp}.${dom}` });
                return;
            }
            // Otherwise, wait for admin to add the tiny Caddy stanza
            setStage("waiting-proof");
        }
        catch (err) {
            setStage("idle");
            setError(err?.message || String(err));
        }
    }
    // For “manual proof” mode (no DID_SERVER_URL)
    async function onIAddedCaddy() {
        if (!requestedHandle)
            return;
        setError(null);
        setStage("finalizing");
        try {
            // sign in so the header updates and we get accessJwt
            const signInResult = await signIn(email.trim(), password);
            await updateHandle(signInResult?.accessJwt || session?.accessJwt, requestedHandle);
            // const access = await login(email.trim());
            // await updateHandle(access, requestedHandle);
            const res = await resolveHandle(requestedHandle);
            setStage("done");
            onDone?.({ did: res.did, handle: requestedHandle });
        }
        catch (err) {
            setStage("waiting-proof");
            setError(err?.message || String(err));
        }
    }
    const caddySnippet = did && requestedHandle
        ? `# Caddy vhost for ${requestedHandle}
    ${requestedHandle} {
    @wellknown path /.well-known/atproto-did
    handle @wellknown {
        header Content-Type text/plain
        respond "${did}" 200
    }
    respond 404
    }`
        : "";
    const handleValid = !!localPart &&
        /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?\.[a-z0-9.-]+$/.test(handle);
    if (loading)
        return _jsx("div", { children: "Loading\u2026" });
    return (_jsxs("div", { className: "grid gap-4 max-w-md", children: [_jsxs("form", { onSubmit: onSubmit, className: "grid gap-4", children: [_jsx(Input, { placeholder: "Email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "username", value: localPart, onChange: (e) => setLocalPart(e.target.value), required: true }), _jsx("select", { className: "border rounded px-2", value: selectedDomain, onChange: (e) => setDomain(e.target.value), children: domainValues.map((d) => (_jsxs("option", { value: d, children: [".", d] }, d))) })] }), _jsx(Input, { placeholder: "Password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true }), cfg?.inviteCodeRequired && (_jsx(Input, { placeholder: "Invite code", value: inviteCode, onChange: (e) => setInviteCode(e.target.value), required: true })), _jsx(Button, { type: "submit", disabled: !handleValid || !email || !password || !localPart, children: "Create account" })] }), !handleValid && localPart && (_jsx("div", { className: "text-red-600 text-sm", children: "Input/handle must be a valid handle" })), error && _jsx("div", { className: "text-red-600 text-sm", children: error }), !DID_SERVER_URL && stage === "waiting-proof" && did && requestedHandle && (_jsxs("div", { className: "grid gap-2", children: [_jsxs("div", { className: "text-sm", children: ["Add this tiny Caddy block for ", _jsx("code", { children: requestedHandle }), ", then click the button:"] }), _jsx("pre", { className: "bg-gray-100 p-3 text-xs overflow-auto", children: caddySnippet }), _jsxs("div", { className: "text-xs text-neutral-500", children: ["It must serve ", _jsx("code", { children: "/.well-known/atproto-did" }), " with ", _jsx("code", { children: did }), "."] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: onIAddedCaddy, disabled: stage === "finalizing", children: "I added it \u2014 finalize handle" }), _jsx(Button, { variant: "secondary", onClick: async () => {
                                    // quick check to help debug
                                    try {
                                        const r = await fetch(`https://${requestedHandle}/.well-known/atproto-did`);
                                        const txt = await r.text();
                                        setError(r.ok ? `Well-known says: ${txt}` : `HTTP ${r.status}: ${txt}`);
                                    }
                                    catch (e) {
                                        setError(e?.message || String(e));
                                    }
                                }, children: "Test well-known" })] })] })), stage === "done" && requestedHandle && did && (_jsxs("div", { className: "text-green-700 text-sm", children: ["Created ", _jsx("b", { children: requestedHandle }), " \u00B7 DID: ", _jsx("code", { children: did })] }))] }));
}
