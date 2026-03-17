// src/features/needs/hooks/useNeedReleases.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import { type NeedRelease } from "@/features/needs/lib/releases";

import { useRepo } from "@/domain/repo";

export function useNeedReleases(rootId: string | undefined) {
  const repo = useRepo();
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [releases, setReleases] = useState<NeedRelease[]>([]);
  const [latest, setLatest] = useState<string | undefined>();
  const [tick, setTick]     = useState(0);

  const refresh = useCallback(async () => {
    if (!rootId) return;
    setLoading(true);
    setError(null);
    try {
      // For mock, we only have one release which is the root Need itself
      const needData = await repo.getNeedByRootId?.(rootId);
      if (needData) {
        const rel: NeedRelease = {
           rootId: rootId,
           version: "1.0",
           stage: "stable",
           title: needData.title,
           description: needData.description,
           purpose: needData.purpose || "",
           language: "en",
           tags: []
        };
        setReleases([rel]);
        setLatest("1.0");
      } else {
        setReleases([]);
        setLatest(undefined);
      }
      setTick(t => t + 1);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load releases");
    } finally {
      setLoading(false);
    }
  }, [rootId, repo]);

  useEffect(() => { setLoading(true); setError(null); }, [rootId]);
  useEffect(() => { if (rootId) void refresh(); }, [rootId, refresh]);

  const get = useCallback(
    (version?: string) => releases.find(r => r.version === version) || releases[0],
    [releases, tick]
  );

  return { releases, latest, get, loading, error, refresh };
}