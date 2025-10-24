// src/api/client.ts
import { useSession } from "@/features/auth/SessionProvider";

export const API_BASE = import.meta.env.VITE_APP_API_URL ?? "/api"; // your Express

export async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "content-type": "application/json", ...(init.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useApi() {
  const { session } = useSession();
  return async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {});
    if (session?.accessJwt) headers.set("authorization", `Bearer ${session.accessJwt}`);
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };
}