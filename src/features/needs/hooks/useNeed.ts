// src/features/needs/hooks/useNeed.ts
import { useEffect, useState, useCallback } from "react";
import {
  getNeedRelease,
  primeNeedReleases,
  latestNeedVersion,
  type NeedRelease,
} from "@/features/needs/lib/releases";

type NeedState = {
  rootId: string;
  version?: string;
  release?: NeedRelease;
  latest?: string;
  loading: boolean;
  error?: string | null;
  refresh: () => Promise<void>;
};

export function useNeed(rootId?: string, version?: string): NeedState {
  const [release, setRelease] = useState<NeedRelease | undefined>();
  const [latest, setLatest]   = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!rootId) return;
    setLoading(true);
    setError(null);
    try {
      await primeNeedReleases(rootId);
      const current = version || latestNeedVersion(rootId);
      const rel = getNeedRelease(rootId, current);
      setLatest(current);
      setRelease(rel);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load need");
    } finally {
      setLoading(false);
    }
  }, [rootId, version]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { rootId: rootId ?? "", version, release, latest, loading, error, refresh };
}