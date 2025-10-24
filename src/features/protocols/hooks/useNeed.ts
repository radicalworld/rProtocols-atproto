// src/hooks/useNeed.ts
import { useEffect, useState, useCallback } from "react";
import { fetchNeed, fetchNeedVersion, createNeedDraft, updateNeedDraft, promoteNeedVersion, diffNeed } from "@/api/needs";

export function useNeed(rootId: string, version?: string) {
  const [need, setNeed] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = version
        ? await fetchNeedVersion(rootId, version)
        : await fetchNeed(rootId);
      setNeed(data);
    } catch (e: any) {
      setError(e.message || "Failed to load need");
    } finally {
      setLoading(false);
    }
  }, [rootId, version]);

  useEffect(() => {
    load();
  }, [load]);

  // Mutations (optional)
  const createDraft = useCallback(
    async (baseVersion: string, nextVersion: string) => {
      const draft = await createNeedDraft(rootId, baseVersion, nextVersion);
      await load();
      return draft;
    },
    [rootId, load]
  );

  const updateDraft = useCallback(
    async (ver: string, changes: any) => {
      const updated = await updateNeedDraft(rootId, ver, changes);
      await load();
      return updated;
    },
    [rootId, load]
  );

  const promote = useCallback(
    async (ver: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string) => {
      const result = await promoteNeedVersion(rootId, ver, toStage, changeDescription);
      await load();
      return result;
    },
    [rootId, load]
  );

  const compare = useCallback(
    async (a: string, b: string) => {
      return diffNeed(rootId, a, b);
    },
    [rootId]
  );

  return { need, loading, error, refresh: load, createDraft, updateDraft, promote, compare };
}