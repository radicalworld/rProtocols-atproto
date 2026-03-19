const APPVIEW_URL = import.meta.env.VITE_APPVIEW_URL || "http://localhost:3010/xrpc";
async function xrpc(endpoint, payload) {
    const res = await fetch(`${APPVIEW_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        if (res.status === 404)
            return null;
        throw new Error(`XRPC Error: ${res.statusText}`);
    }
    return await res.json();
}
export class AppViewAdapter {
    // --- LEGACY RPReadPort Implementations (Mapped to new XRPC) ---
    async getNeedByLineageId(lineageId) {
        try {
            const data = await xrpc('app.rp.entity.getCurrent', { lineageId, policy: 'latest-any' });
            if (data?.record) {
                const n = data.record;
                const bundledRels = n.bundledRelations || [];
                const suiteLineageIds = bundledRels.filter((r) => r.type === 'suiteRef').map((r) => r.lineageId);
                const childLineageIds = bundledRels.filter((r) => r.type === 'childNeedRef').map((r) => r.lineageId);
                const relatedProtocolLineageIds = bundledRels.filter((r) => r.type === 'protocolRef').map((r) => r.lineageId);
                return {
                    id: n.slug || n.lineageId || n.uri || "",
                    lineageId: n.lineageId || n.uri || "",
                    slug: n.slug || n.lineageId || "",
                    title: n.title || n.question || "Untitled Need",
                    description: n.description || "",
                    language: n.language || "en",
                    purpose: n.purpose || "",
                    suiteLineageIds,
                    relatedProtocolLineageIds,
                    childLineageIds,
                    parentLineageId: null,
                };
            }
        }
        catch (err) {
            console.error("AppView getNeedByLineageId error:", err);
        }
        return null;
    }
    async getProtocol(id) {
        // Technically this asks for ID but we'll assume lineage or slug
        return this.getProtocolBySlug(id); // fallback
    }
    async getProtocols() {
        try {
            const data = await xrpc('app.rp.graph.listRecentChanges', { kind: 'protocol', limit: 100 });
            if (data?.records) {
                return data.records.map((p) => ({
                    id: p.uri || p.slug || p.lineageId || "",
                    lineageId: p.lineageId || p.uri || "",
                    slug: p.slug || "",
                    title: p.title || "",
                    summary: p.description || p.summary || "",
                    body: p.protocolBody || p.body || ""
                }));
            }
        }
        catch (err) {
            console.error("AppView getProtocols error:", err);
        }
        return [];
    }
    async getSuitesForNeed(needId) {
        try {
            const needData = await xrpc('app.rp.entity.getCurrent', { lineageId: needId });
            if (!needData?.record)
                return [];
            const bundledRels = needData.record.bundledRelations || [];
            const suiteIds = bundledRels.filter((r) => r.type === 'suiteRef').map((r) => r.lineageId);
            const suites = [];
            for (const sid of suiteIds) {
                const sData = await xrpc('app.rp.entity.getCurrent', { lineageId: sid });
                if (sData?.record) {
                    const s = sData.record;
                    suites.push({
                        id: s.slug || s.lineageId || s.uri || "",
                        lineageId: s.lineageId || s.uri || "",
                        slug: s.slug || s.lineageId || "",
                        title: s.title || "Untitled Suite",
                        description: s.description || "",
                        language: s.language || "en",
                        includeProtocols: s.members?.protocols?.map((p) => ({ lineageId: p.uri })) || []
                    });
                }
            }
            return suites;
        }
        catch (error) {
            console.error("AppView getSuitesForNeed error:", error);
            return [];
        }
    }
    async getSuiteProtocols(suiteId) {
        try {
            const suiteData = await xrpc('app.rp.entity.getCurrent', { lineageId: suiteId });
            if (!suiteData?.record)
                return [];
            const bundledRels = suiteData.record.bundledRelations || [];
            // Extract from bundled relations if AppView indexed them, OR directly natively from the members block
            let protoIds = bundledRels.filter((r) => r.type === 'protocolRef').map((r) => r.lineageId);
            if (protoIds.length === 0 && suiteData.record.members?.protocols?.length > 0) {
                protoIds = suiteData.record.members.protocols.map((p) => p.uri.split("/").pop()); // Extracts raw lineageId from StrongRef URI if necessary
            }
            const protos = [];
            for (const pid of protoIds) {
                const pData = await xrpc('app.rp.entity.getCurrent', { lineageId: pid });
                if (pData?.record) {
                    const p = pData.record;
                    protos.push({
                        id: p.slug || p.lineageId || p.uri || "",
                        lineageId: p.lineageId || p.uri || "",
                        slug: p.slug || p.lineageId || "",
                        title: p.title || "Untitled Protocol",
                        summary: p.summary || "",
                        body: p.protocolBody || p.body || ""
                    });
                }
            }
            return protos;
        }
        catch (error) {
            console.error("AppView getSuiteProtocols error:", error);
            return [];
        }
    }
    async getProtocolBySlug(slug) {
        try {
            // For now, if passed a lineageId, query by lineageId directly. 
            // A real slug lookup requires an index over 'slug' which the backend might just resolve in getRecord
            const data = await xrpc('app.rp.entity.getCurrent', { lineageId: slug, policy: 'latest-any' });
            if (data?.record) {
                const p = data.record;
                return {
                    id: p.slug || p.lineageId || p.uri || "",
                    lineageId: p.lineageId || p.uri || "",
                    slug: p.slug || "",
                    title: p.title || "",
                    summary: p.description || p.summary || "",
                    body: p.protocolBody || p.body || ""
                };
            }
        }
        catch (err) {
            console.error("AppView getProtocolBySlug error:", err);
        }
        return null;
    }
    // --- NEW XRPC WRAPPERS (To be consumed by Advanced UI) ---
    async xrpcGetLineage(lineageId) {
        return await xrpc('app.rp.entity.getLineage', { lineageId });
    }
    async xrpcGetForks(lineageId) {
        return await xrpc('app.rp.graph.getForks', { lineageId });
    }
    async xrpcGetRelations(lineageId) {
        return await xrpc('app.rp.graph.getRelations', { subject: { lineageId } });
    }
    async xrpcSearchEntities(q, kind) {
        return await xrpc('app.rp.search.searchEntities', { q, kind });
    }
    // ----------------------------------------------------
    // Stubs to fulfill RPReadPort TS Requirements
    // ----------------------------------------------------
    async listSections() { return []; }
    async getNeedsBySection() { return []; }
    async getNeedTree() { return { id: "draft-nd-a", version: "1.0", stage: "stable", date: "", need: { id: "a" }, suites: [] }; }
    async getNeedByVersion() { return null; }
    async getProtocolsForNeed() { return []; }
    async getMarks() { return []; }
    async getSuite(suiteId) {
        try {
            const data = await xrpc('app.rp.entity.getCurrent', { lineageId: suiteId, policy: 'latest-any' });
            if (data?.record) {
                const s = data.record;
                return {
                    id: s.slug || s.lineageId || s.uri || "",
                    lineageId: s.lineageId || s.uri || "",
                    slug: s.slug || s.lineageId || "",
                    title: s.title || "Untitled Suite",
                    description: s.description || s.summary || "",
                    purpose: s.purpose || "",
                    language: s.language || "en",
                    tags: s.tags || [],
                    includeProtocols: s.members?.protocols?.map((p) => ({ lineageId: p.uri })) || []
                };
            }
        }
        catch (err) {
            console.error("AppView getSuite error:", err);
        }
        return null;
    }
    async resolveProtocolSlug() { return null; }
    async getProtocolByVersion() { return null; }
    async getProtocolByCid() { return null; }
}
