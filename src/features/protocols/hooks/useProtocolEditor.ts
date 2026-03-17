import { useEffect, useState, useCallback } from "react";
import { useRepo } from "@/domain/repo";
import { getRelease, latestVersion } from "@/features/protocols/lib/releases";

export type ProtocolDraftState = {
  rootId: string;
  version: string;
  stage: "draft" | "candidate" | "stable" | "deprecated";
  title: string;
  summary: string;
  body: string;
  language: string;
  tags: string[];
};

export function useProtocolEditor(rootId?: string, version?: string) {
  const repo = useRepo();
  const [draft, setDraft] = useState<ProtocolDraftState | undefined>();
  const [latest, setLatest] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!rootId) return;

    // decode once
    const rawId = decodeURIComponent(rootId);
    let parsedVersion = version;
    let parsedSlug = rawId;

    if (!parsedVersion && rawId.includes("@")) {
      [parsedSlug, parsedVersion] = rawId.split("@");
    }

    setLoading(true);
    setError(null);
    try {
      let data;
      if (parsedVersion) {
        data = await repo.getProtocolByVersion?.(parsedSlug, parsedVersion);
      } else {
        data = await repo.getProtocolBySlug?.(parsedSlug);
        // Fallback to legacy mock load for local testing
        if (!data) data = await repo.getProtocol?.(parsedSlug);
      }
      
      if (!data) throw new Error("Protocol not found");

      // Handle mock local data where content is stored in releases index
      const uiVersion = (parsedVersion || latestVersion(parsedSlug) || "1.0") as `${number}.${number}`;
      const release = getRelease(parsedSlug, uiVersion);
      const finalTitle = data.title || release?.title;
      const finalSummary = data.summary || release?.summary || "";
      const finalBody = data.body || release?.protocolBody || "";

      const draftState: ProtocolDraftState = {
         rootId: parsedSlug,
         version: uiVersion,
         stage: "draft", 
         title: finalTitle,
         summary: finalSummary,
         body: finalBody,
         language: "en",
         tags: release?.tags || []
      };

      setLatest(undefined);
      setDraft(draftState);

    } catch (e: unknown) {
      const err = e as Error;
      console.error(err);
      setError(err?.message ?? "Failed to load protocol");
    } finally {
      setLoading(false);
    }
  }, [rootId, version, repo]);

  const updateDraft = useCallback(
    async (ver: string, changes: Record<string, unknown>) => {
      if (!rootId) return;
      await repo.updateProtocolDraft(rootId, ver, changes);
      await refresh();
    },
    [rootId, repo, refresh]
  );

  const promote = useCallback(
    async (ver: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string) => {
      if (!rootId) return;
      await repo.promoteProtocolVersion(rootId, ver, toStage, changeDescription);
      await refresh();
    },
    [rootId, repo, refresh]
  );

  useEffect(() => { void refresh(); }, [refresh]);

  return { rootId: rootId ?? "", version, draft, latest, loading, error, refresh, updateDraft, promote };
}
