import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
const PDS_URL = import.meta.env.VITE_PDS_URL || "https://r.radical.world";
const KEY = "rw_session_v1";
const SessionCtx = createContext(undefined);
function load() {
    try {
        return JSON.parse(localStorage.getItem(KEY) || "null");
    }
    catch {
        return null;
    }
}
function save(s) {
    if (s)
        localStorage.setItem(KEY, JSON.stringify(s));
    else
        localStorage.removeItem(KEY);
}
export function SessionProvider({ children }) {
    const [session, setSession] = useState(load());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const signIn = useCallback(async (identifier, password) => {
        setBusy(true);
        setError(null);
        try {
            const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.createSession`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
            });
            const data = await r.json();
            if (!r.ok)
                throw new Error(data?.message || data?.error || "Sign-in failed");
            const s = {
                did: data.did,
                handle: data.handle,
                accessJwt: data.accessJwt,
                refreshJwt: data.refreshJwt,
            };
            save(s);
            setSession(s);
            return true; // Success
        }
        catch (e) {
            setError(e?.message ?? "Sign-in failed");
            return false; // Failure
        }
        finally {
            setBusy(false);
        }
    }, [ /* PDS_URL if not in module scope */]);
    const signUp = useCallback(async (args) => {
        setBusy(true);
        setError(null);
        try {
            const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: args.email,
                    handle: args.handle,
                    password: args.password,
                    inviteCode: args.inviteCode,
                }),
            });
            const data = await r.json();
            if (!r.ok)
                throw new Error(data?.message || data?.error || "Sign-up failed");
            // most PDSs return session info here
            const s = {
                did: data.did,
                handle: data.handle,
                accessJwt: data.accessJwt,
                refreshJwt: data.refreshJwt,
            };
            save(s);
            setSession(s);
            return true;
        }
        catch (e) {
            setError(e?.message ?? "Sign-up failed");
            return false;
        }
        finally {
            setBusy(false);
        }
    }, []);
    const signOut = useCallback(() => { save(null); setSession(null); }, []);
    const refresh = useCallback(async () => {
        const cur = load();
        if (!cur?.refreshJwt)
            return null;
        const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.refreshSession`, {
            method: "POST",
            headers: { authorization: `Bearer ${cur.refreshJwt}` },
        });
        const data = await r.json();
        if (!r.ok)
            return null;
        const next = {
            did: data.did, handle: data.handle, accessJwt: data.accessJwt, refreshJwt: data.refreshJwt,
        };
        save(next);
        setSession(next);
        return next;
    }, []);
    // silent refresh on mount and on cross-tab updates
    useEffect(() => { refresh().catch(() => { }); }, [refresh]);
    useEffect(() => {
        const onStorage = (e) => { if (e.key === KEY)
            setSession(load()); };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);
    return (_jsx(SessionCtx.Provider, { value: { session, signIn, signUp, signOut, refresh, busy, error, setError }, children: children }));
}
export function useSession() {
    const ctx = useContext(SessionCtx);
    if (!ctx)
        throw new Error("useSession must be used inside <SessionProvider>");
    return ctx;
}
