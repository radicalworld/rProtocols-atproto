import { useEffect, useState, useCallback } from "react";
import { useRepo } from "@/domain/repo";
export function useNeed(rootId, version) {
    const repo = useRepo();
    const [release, setRelease] = useState();
    const [latest, setLatest] = useState();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        if (!rootId)
            return;
        setLoading(true);
        setError(null);
        try {
            let needData;
            if (version) {
                needData = await repo.getNeedByVersion?.(rootId, version);
            }
            else {
                needData = await repo.getNeedByLineageId?.(rootId);
            }
            if (!needData)
                throw new Error("Need not found");
            // Adapt the domain Need into the legacy NeedRelease shape expected by the UI
            const rel = {
                rootId: rootId,
                version: version || "1.0", // Mocks always default to 1.0 if not specified
                stage: "draft", // Default to draft locally so editor fields unlock
                title: needData.title,
                description: needData.description,
                purpose: needData.purpose || "",
                language: "en", // Mocks
                tags: [] // Mocks
            };
            setLatest(undefined);
            setRelease(rel);
        }
        catch (e) {
            console.error(e);
            setError(e?.message ?? "Failed to load need");
        }
        finally {
            setLoading(false);
        }
    }, [rootId, version, repo]);
    const updateDraft = useCallback(async (ver, changes) => {
        if (!rootId)
            return;
        try {
            await repo.updateNeedDraft(rootId, ver, changes);
            await refresh();
        }
        catch (e) {
            throw e;
        }
    }, [rootId, repo, refresh]);
    const promote = useCallback(async (ver, toStage, changeDescription) => {
        if (!rootId)
            return;
        await repo.promoteNeedVersion(rootId, ver, toStage, changeDescription);
        await refresh();
    }, [rootId, repo, refresh]);
    useEffect(() => { void refresh(); }, [refresh]);
    return { rootId: rootId ?? "", version, release, latest, loading, error, refresh, updateDraft, promote };
}
