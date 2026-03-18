import { useEffect, useState, useCallback } from "react";
import { useRepo } from "@/domain/repo";
import { getRelease, latestVersion } from "@/features/protocols/lib/releases";
export function useProtocolEditor(rootId, version) {
    const repo = useRepo();
    const [draft, setDraft] = useState();
    const [latest, setLatest] = useState();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        if (!rootId)
            return;
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
            }
            else {
                data = await repo.getProtocolBySlug?.(parsedSlug);
                // Fallback to legacy mock load for local testing
                if (!data)
                    data = await repo.getProtocol?.(parsedSlug);
            }
            if (!data)
                throw new Error("Protocol not found");
            // Handle mock local data where content is stored in releases index
            const uiVersion = (parsedVersion || latestVersion(parsedSlug) || "1.0");
            const release = getRelease(parsedSlug, uiVersion);
            const finalTitle = data.title || release?.title;
            const finalSummary = data.summary || release?.summary || "";
            const finalBody = data.body || release?.protocolBody || "";
            const draftState = {
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
        }
        catch (e) {
            const err = e;
            console.error(err);
            setError(err?.message ?? "Failed to load protocol");
        }
        finally {
            setLoading(false);
        }
    }, [rootId, version, repo]);
    const publishProtocol = useCallback(async (versionType, targetStage, currentContent) => {
        if (!rootId || !draft)
            return;
        let targetVer = draft.version;
        const parts = targetVer.split('.');
        let major = parseInt(parts[0], 10);
        if (isNaN(major))
            major = 1;
        let minor = parseInt(parts[1], 10) || 0;
        let patch = parseInt(parts[2], 10) || 0;
        if (versionType === 'minor') {
            minor += 1;
            patch = 0;
            targetVer = `${major}.${minor}`;
        }
        else {
            patch += 1;
            targetVer = `${major}.${minor}.${patch}`;
        }
        // 1. Write Data (inserts as Draft by default in PDS)
        await repo.updateProtocolDraft(rootId, targetVer, currentContent);
        // 2. Promote if requested
        if (targetStage !== "draft") {
            await repo.promoteProtocolVersion(rootId, targetVer, targetStage, `Published via editor`);
        }
        await new Promise(resolve => setTimeout(resolve, 800));
        await refresh();
    }, [rootId, draft, repo, refresh]);
    useEffect(() => { void refresh(); }, [refresh]);
    return { rootId: rootId ?? "", version, draft, latest, loading, error, refresh, publishProtocol };
}
