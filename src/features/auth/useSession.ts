import { useEffect, useState, useCallback } from "react";

const PDS_URL = (import.meta.env.VITE_PDS_URL as string) || "https://r.radical.world";

type Session = {
  did: string;
  handle?: string;
  accessJwt: string;
  refreshJwt: string;
};

const KEY = "rw_session_v1";

function load(): Session | null {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
  catch { return null; }
}
function save(s: Session | null) {
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(load());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- API
  const signIn = useCallback(async (identifier: string, password: string) => {
    setBusy(true); setError(null);
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
      save(s); setSession(s);
      return s;
    } finally { setBusy(false); }
  }, []);

  const signOut = useCallback(() => { save(null); setSession(null); }, []);

  // Refresh token (use before 401 retry or on app start)
  const refresh = useCallback(async () => {
    const cur = load(); if (!cur?.refreshJwt) return null;
    const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.refreshSession`, {
      method: "POST",
      headers: { authorization: `Bearer ${cur.refreshJwt}` },
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.message || data?.error || "Refresh failed");
    const next: Session = {
      did: data.did,
      handle: data.handle,
      accessJwt: data.accessJwt,
      refreshJwt: data.refreshJwt,
    };
    save(next); setSession(next);
    return next;
  }, []);

  // Try a refresh on mount (silent sign-in)
  useEffect(() => { refresh().catch(() => {}); }, [refresh]);

  return { session, signIn, signOut, refresh, busy, error, setError };
}

// Helper for authenticated fetches
export async function authedFetch(input: string, init: RequestInit = {}) {
  const s = load();
  const withAuth = {
    ...init,
    headers: { ...(init.headers || {}), authorization: `Bearer ${s?.accessJwt ?? ""}` },
  };
  let r = await fetch(input, withAuth);
  // If unauthorized, try refresh once
  if (r.status === 401) {
    const ref = await fetch(`${PDS_URL}/xrpc/com.atproto.server.refreshSession`, {
      method: "POST",
      headers: { authorization: `Bearer ${s?.refreshJwt ?? ""}` },
    });
    if (ref.ok) {
      const data = await ref.json();
      const next: Session = {
        did: data.did, handle: data.handle, accessJwt: data.accessJwt, refreshJwt: data.refreshJwt,
      };
      save(next);
      r = await fetch(input, {
        ...init,
        headers: { ...(init.headers || {}), authorization: `Bearer ${next.accessJwt}` },
      });
    }
  }
  return r;
}