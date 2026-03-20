import { useEffect, useState, useCallback } from "react";
import {
  getNeedRelease,
  primeNeedReleases,
  latestNeedVersion,
  type NeedRelease,
} from "@/features/needs/lib/releases";
import { useRepo } from "@/domain/repo";

type NeedState = {
  rootId: string;
  version?: string;
  release?: NeedRelease;
  latest?: string;
  loading: boolean;
  error?: string | null;
  refresh: () => Promise<void>;
  updateDraft: (ver: string, changes: any) => Promise<void>;
  promote: (ver: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string) => Promise<void>;
};

export function useNeed(rootId?: string, version?: string): NeedState {
  const repo = useRepo();
  const [release, setRelease] = useState<NeedRelease | undefined>();
  const [latest, setLatest]   = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!rootId) return;
    setLoading(true);
    setError(null);
    try {
      let needData;
      if (version) {
        needData = await repo.getNeedByVersion?.(rootId, version);
      } else {
        needData = await repo.getNeedByLineageId?.(rootId);
      }
      
      if (!needData) throw new Error("Need not found");

      // Adapt the domain Need into the legacy NeedRelease shape expected by the UI
      const rel: NeedRelease = {
         rootId: rootId,
         version: (needData as any).version || version || "0.1.0", // dynamically map PDS version overriding mock 0.1.0
         stage: (needData as any).stage || "draft",                // dynamically map PDS stage overriding mock defaults
         title: needData.title,
         description: needData.description,
         purpose: needData.purpose || "",
         language: needData.language || "en",
         tags: needData.tags || []
      };

      setLatest(undefined);
      setRelease(rel);

    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load need");
    } finally {
      setLoading(false);
    }
  }, [rootId, version, repo]);

  const updateDraft = useCallback(
    async (ver: string, changes: any) => {
      if (!rootId) return;
      try {
          await repo.updateNeedDraft(rootId, ver, changes);
          await refresh();
      } catch (e) {
          throw e;
      }
    },
    [rootId, repo, refresh]
  );

  const promote = useCallback(
    async (ver: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string) => {
      if (!rootId) return;
      await repo.promoteNeedVersion(rootId, ver, toStage, changeDescription);
      await refresh();
    },
    [rootId, repo, refresh]
  );

  useEffect(() => { void refresh(); }, [refresh]);

  return { rootId: rootId ?? "", version, release, latest, loading, error, refresh, updateDraft, promote };
}