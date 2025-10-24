import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const PDS_URL = (import.meta.env.VITE_PDS_URL as string) || "https://r.radical.world";

type Session = { did: string; handle?: string; accessJwt: string; refreshJwt: string };
type Ctx = {
    session: Session | null;
    signIn: (identifier: string, password: string) => Promise<boolean>;
    signUp: (args: { email?: string; handle: string; password: string; inviteCode?: string }) => Promise<boolean>;
    signOut: () => void;
    refresh: () => Promise<Session | null>;
    busy: boolean;
    error: string | null;
    setError: (s: string | null) => void;
};

const KEY = "rw_session_v1";
const SessionCtx = createContext<Ctx | undefined>(undefined);

function load(): Session | null {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
function save(s: Session | null) {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(load());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signIn = useCallback(async (identifier: string, password: string) => {
        setBusy(true);
        setError(null);
        try {
            const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.createSession`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.message || data?.error || "Sign-in failed");

            const s: Session = {
                did: data.did,
                handle: data.handle,
                accessJwt: data.accessJwt,
                refreshJwt: data.refreshJwt,
            };
            save(s);
            setSession(s);

            return true;       // Success
        } catch (e: any) {
            setError(e?.message ?? "Sign-in failed");  
            return false;      // Failure
        } finally {
            setBusy(false);
        }
    }, [/* PDS_URL if not in module scope */]);

    const signUp = useCallback(async (args: { email?: string; handle: string; password: string; inviteCode?: string }) => {
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
            if (!r.ok) throw new Error(data?.message || data?.error || "Sign-up failed");

            // most PDSs return session info here
            const s: Session = {
                did: data.did,
                handle: data.handle,
                accessJwt: data.accessJwt,
                refreshJwt: data.refreshJwt,
            };
            save(s);
            setSession(s);
            return true;
        } catch (e: any) {
            setError(e?.message ?? "Sign-up failed");
            return false;
        } finally {
            setBusy(false);
        }
    }, []);

    const signOut = useCallback(() => { save(null); setSession(null); }, []);

    const refresh = useCallback(async () => {
        const cur = load(); if (!cur?.refreshJwt) return null;
        const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.refreshSession`, {
        method: "POST",
        headers: { authorization: `Bearer ${cur.refreshJwt}` },
        });
        const data = await r.json();
        if (!r.ok) return null;
        const next: Session = {
        did: data.did, handle: data.handle, accessJwt: data.accessJwt, refreshJwt: data.refreshJwt,
        };
        save(next); setSession(next);
        return next;
    }, []);

    // silent refresh on mount and on cross-tab updates
    useEffect(() => { refresh().catch(()=>{}); }, [refresh]);
    useEffect(() => {
        const onStorage = (e: StorageEvent) => { if (e.key === KEY) setSession(load()); };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    return (
        <SessionCtx.Provider value={{ session, signIn, signUp, signOut, refresh, busy, error, setError }}>
            {children}
        </SessionCtx.Provider>
    );
}

export function useSession() {
    const ctx = useContext(SessionCtx);
    if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
    return ctx;
}