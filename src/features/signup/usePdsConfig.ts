// src/features/signup/usePdsConfig.ts
import { useEffect, useState } from "react";

type DescribeServer = {
  did: string;
  availableUserDomains?: string[];
  inviteCodeRequired?: boolean;
  // ...add fields you need
};

const PDS_URL = import.meta.env.VITE_PDS_URL ?? "https://r.radical.world";

export function usePdsConfig() {
  const [cfg, setCfg] = useState<DescribeServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.describeServer`);
        if (!r.ok) throw new Error(`describeServer failed (${r.status})`);
        const data = (await r.json()) as DescribeServer;
        setCfg(data);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { cfg, loading, error };
}