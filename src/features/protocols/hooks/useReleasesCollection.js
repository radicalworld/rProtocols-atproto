// src/hooks/useReleasesCollection.ts
import { useState, useEffect } from "react";
import { useRepo } from "@/domain/repo";
export function useReleasesCollection(items) {
    const repo = useRepo();
    const [releases, setReleases] = useState([]);
    useEffect(() => {
        async function fetchReleases() {
            const results = [];
            for (const item of items) {
                // Currently returning Protocol structure directly as a "release" shim for the UI tiles
                const p = await repo.getProtocol(item.id);
                if (p) {
                    results.push({
                        id: item.id,
                        release: {
                            version: "1.0",
                            date: new Date().toISOString(),
                            language: "en",
                            title: p.title || "Untitled",
                            summary: p.summary || "No description currently provided.",
                            content: p.body || ""
                        }
                    });
                }
            }
            setReleases(results);
        }
        fetchReleases();
    }, [repo, items]);
    return releases;
}
