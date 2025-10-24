// src/features/needs/hooks/useNeedReleases.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  primeNeedReleases,
  listNeedReleases,
  latestNeedVersion,
  getNeedRelease,
  type NeedRelease,
} from "@/features/needs/lib/releases";

export function useNeedReleases(rootId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [tick, setTick]     = useState(0); // bump to re-read caches

  const refresh = useCallback(async () => {
    if (!rootId) return;
    setLoading(true);
    setError(null);
    try {
      await primeNeedReleases(rootId); // populates client-side caches
      setTick(t => t + 1);             // re-read cached values
    } catch (e: any) {
      setError(e?.message ?? "Failed to load releases");
    } finally {
      setLoading(false);
    }
  }, [rootId]);

  useEffect(() => { setLoading(true); setError(null); }, [rootId]);
  useEffect(() => { if (rootId) void refresh(); }, [rootId, refresh]);

  const releases = useMemo<NeedRelease[]>(
    () => (rootId ? listNeedReleases(rootId) : []),
    [rootId, tick]
  );

  const latest = useMemo<string | undefined>(
    () => (rootId ? latestNeedVersion(rootId) : undefined),
    [rootId, tick]
  );

  const get = useCallback(
    (version?: string) => (rootId ? getNeedRelease(rootId, version) : undefined),
    [rootId, tick]
  );

  return { releases, latest, get, loading, error, refresh };
}