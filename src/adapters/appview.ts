// src/adapters/appview.ts
import type { Need, Protocol, SectionId, Suite, NeedNode, Mark } from "@/domain/types";
import { RPReadPort } from "@/domain/ports";
const APPVIEW_URL = import.meta.env.VITE_APPVIEW_URL || "http://localhost:3010/xrpc";

async function xrpc(endpoint: string, payload: any) {
    const res = await fetch(`${APPVIEW_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`XRPC Error: ${res.statusText}`);
    }
    return await res.json();
}

export class AppViewAdapter implements RPReadPort {
    
    // --- LEGACY RPReadPort Implementations (Mapped to new XRPC) ---

    async getNeedByLineageId(lineageId: string): Promise<Need | null> {
        try {
            const cleanId = lineageId.replace(/^(rp_st_|rp_pr_|rp_nd_)/, "");
            const data = await xrpc('app.rp.entity.getCurrent', { lineageId: cleanId, policy: 'latest-any' });
            if (data?.record) {
                const n = data.record;
                const bundledRels = n.bundledRelations || [];
                const suiteLineageIds = bundledRels.filter((r: any) => r.type === 'suiteRef').map((r: any) => r.lineageId);
                const childLineageIds = bundledRels.filter((r: any) => r.type === 'childNeedRef').map((r: any) => r.lineageId);
                const relatedProtocolLineageIds = bundledRels.filter((r: any) => r.type === 'protocolRef').map((r: any) => r.lineageId);

                return {
                    id: n.slug || n.lineageId || n.uri || "",
                    lineageId: n.lineageId || n.uri || "",
                    slug: n.slug || n.lineageId || "",
                    version: n.version,
                    stage: n.stage || "draft",
                    title: n.title || n.question || "Untitled Need",
                    description: n.description || "",
                    language: n.language || "en",
                    purpose: n.purpose || "",
                    suiteLineageIds,
                    relatedProtocolLineageIds,
                    childLineageIds,
                    parentLineageId: null,
                    foundationRef: n.foundationRef,
                    family: n.family,
                    release: n.release,
                    familyEvent: n.familyEvent,
                    followCount: n.followCount || 0,
                    adoptCount: n.adoptCount || 0
                } as Need;
            }
        } catch (err) { console.error("AppView getNeedByLineageId error:", err); }
        return null;
    }

    async getProtocol(id: string): Promise<Protocol | null> {
        // Technically this asks for ID but we'll assume lineage or slug
        return this.getProtocolBySlug(id); // fallback
    }

    async getProtocols(): Promise<Protocol[]> {
        try {
            const data = await xrpc('app.rp.graph.listRecentChanges', { kind: 'protocol', limit: 100 });
            if (data?.records) {
                return data.records.map((p: any) => ({
                    id: p.uri || p.slug || p.lineageId || "", 
                    lineageId: p.lineageId || p.uri || "",
                    slug: p.slug || "",
                    version: p.version,
                    stage: p.stage || "draft",
                    title: p.title || "",
                    summary: p.description || p.summary || "",
                    body: p.protocolBody || p.body || "",
                    foundationRef: p.foundationRef,
                    family: p.family,
                    release: p.release,
                    familyEvent: p.familyEvent,
                    followCount: p.followCount || 0,
                    adoptCount: p.adoptCount || 0
                }));
            }
        } catch (err) { console.error("AppView getProtocols error:", err); }
        return [];
    }

    async getSuites(): Promise<Suite[]> {
        try {
            const data = await xrpc('app.rp.graph.listRecentChanges', { kind: 'suite', limit: 100 });
            if (data?.records) {
                return data.records.map((p: any) => ({
                    id: p.uri || p.slug || p.lineageId || "", 
                    lineageId: p.lineageId || p.uri || "",
                    slug: p.slug || "",
                    version: p.version,
                    stage: p.stage || "draft",
                    title: p.title || "",
                    description: p.description || p.purpose || "",
                    language: p.language || "en",
                    foundationRef: p.foundationRef,
                    family: p.family,
                    release: p.release,
                    familyEvent: p.familyEvent,
                    followCount: p.followCount || 0,
                    adoptCount: p.adoptCount || 0,
                    tags: p.tags || []
                }));
            }
        } catch (err) { console.error("AppView getSuites error:", err); }
        return [];
    }

    async getSuitesForNeed(needId: string): Promise<Suite[]> {
        try {
            const needData = await xrpc('app.rp.entity.getCurrent', { lineageId: needId });
            if (!needData?.record) return [];

            const bundledRels = needData.record.bundledRelations || [];
            const suiteIds = bundledRels.filter((r: any) => r.type === 'suiteRef').map((r: any) => r.lineageId);
            
            const suites: Suite[] = [];
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
                        includeProtocols: s.members?.protocols?.map((p: any) => ({ lineageId: p.uri })) || [],
                        foundationRef: s.foundationRef,
                        family: s.family,
                        release: s.release,
                        familyEvent: s.familyEvent,
                        followCount: s.followCount || 0,
                        adoptCount: s.adoptCount || 0
                    });
                }
            }
            return suites;
        } catch (error) {
            console.error("AppView getSuitesForNeed error:", error);
            return [];
        }
    }

    async getSuiteProtocols(suiteId: string): Promise<Protocol[]> {
        try {
            const suiteData = await xrpc('app.rp.entity.getCurrent', { lineageId: suiteId });
            if (!suiteData?.record) return [];

            const bundledRels = suiteData.record.bundledRelations || [];
            
            // Extract from bundled relations if AppView indexed them, OR directly natively from the members block
            let protoIds = bundledRels.filter((r: any) => r.type === 'protocolRef').map((r: any) => r.lineageId);
            if (protoIds.length === 0 && suiteData.record.members?.protocols?.length > 0) {
                protoIds = suiteData.record.members.protocols.map((p: any) => p.uri.split("/").pop()); // Extracts raw lineageId from StrongRef URI if necessary
            }
            
            const protos: Protocol[] = [];
            for (const pid of protoIds) {
                const pData = await xrpc('app.rp.entity.getCurrent', { lineageId: pid });
                if (pData?.record) {
                    const p = pData.record;
                    protos.push({
                        id: p.slug || p.lineageId || p.uri || "",
                        lineageId: p.lineageId || p.uri || "",
                        slug: p.slug || p.lineageId || "",
                        version: p.version,
                        stage: p.stage || "draft",
                        title: p.title || "Untitled Protocol",
                        summary: p.summary || "",
                        body: p.protocolBody || p.body || "",
                        foundationRef: p.foundationRef,
                        family: p.family,
                        release: p.release,
                        familyEvent: p.familyEvent,
                        followCount: p.followCount || 0,
                        adoptCount: p.adoptCount || 0
                    });
                }
            }
            return protos;
        } catch (error) {
            console.error("AppView getSuiteProtocols error:", error);
            return [];
        }
    }

    async getProtocolBySlug(slug: string): Promise<Protocol | null> {
        try {
            const cleanId = slug.replace(/^(rp_st_|rp_pr_|rp_nd_)/, "");
            const data = await xrpc('app.rp.entity.getCurrent', { lineageId: cleanId, policy: 'latest-any' });
            if (data?.record) {
                const p = data.record;
                return {
                    id: p.slug || p.lineageId || p.uri || "", 
                    lineageId: p.lineageId || p.uri || "",
                    slug: p.slug || "",
                    version: p.version,
                    stage: p.stage || "draft",
                    title: p.title || "",
                    summary: p.description || p.summary || "",
                    body: p.protocolBody || p.body || "",
                    foundationRef: p.foundationRef,
                    family: p.family,
                    release: p.release,
                    familyEvent: p.familyEvent,
                    followCount: p.followCount || 0,
                    adoptCount: p.adoptCount || 0
                };
            }
        } catch (err) { console.error("AppView getProtocolBySlug error:", err); }
        return null;
    }

    // --- NEW XRPC WRAPPERS (To be consumed by Advanced UI) ---

    async xrpcGetLineage(lineageId: string) {
        return await xrpc('app.rp.entity.getLineage', { lineageId });
    }

    async xrpcGetForks(lineageId: string) {
        return await xrpc('app.rp.graph.getForks', { lineageId });
    }

    async xrpcGetRelations(lineageId: string) {
        return await xrpc('app.rp.graph.getRelations', { subject: { lineageId } });
    }

    async xrpcSearchEntities(q: string, kind?: string) {
        return await xrpc('app.rp.search.searchEntities', { q, kind });
    }

    // ----------------------------------------------------
    // Stubs to fulfill RPReadPort TS Requirements
    // ----------------------------------------------------
    async listSections() { return []; }
    async getNeedsBySection(sectionId: string): Promise<Need[]> {
        try {
            const need = await this.getNeedByLineageId(sectionId);
            if (need) return [need];
        } catch (err) { console.error("AppView getNeedsBySection error:", err); }
        return [];
    }
    async getNeedTree() { return { id: "draft-nd-a", version: "1.0", stage: "stable", date: "", need: { id: "a" } as Need, suites: [] as Suite[] } as unknown as NeedNode; }
    async getNeedByVersion() { return null; }
    async getProtocolsForNeed(needId: string): Promise<Protocol[]> {
        try {
            const needData = await xrpc('app.rp.entity.getCurrent', { lineageId: needId });
            if (!needData?.record) return [];

            const bundledRels = needData.record.bundledRelations || [];
            let protoIds = bundledRels.filter((r: any) => r.type === 'protocolRef').map((r: any) => r.lineageId);
            
            if (protoIds.length === 0 && needData.record.relations?.relatedProtocols?.length > 0) {
                protoIds = needData.record.relations.relatedProtocols.map((p: any) => p.uri.split("/").pop());
            }

            const protos: Protocol[] = [];
            for (const pid of protoIds) {
                const pData = await xrpc('app.rp.entity.getCurrent', { lineageId: pid });
                if (pData?.record) {
                    const p = pData.record;
                    protos.push({
                        id: p.slug || p.lineageId || p.uri || "",
                        lineageId: p.lineageId || p.uri || "",
                        slug: p.slug || p.lineageId || "",
                        title: p.title || "Untitled Protocol",
                        summary: p.summary || p.description || "",
                        body: p.protocolBody || p.body || "",
                        foundationRef: p.foundationRef,
                        family: p.family,
                        release: p.release,
                        familyEvent: p.familyEvent,
                        followCount: p.followCount || 0,
                        adoptCount: p.adoptCount || 0
                    });
                }
            }
            return protos;
        } catch (error) {
            console.error("AppView getProtocolsForNeed error:", error);
            return [];
        }
    }
    
    async getSuiteWithActiveMerge(id: string) {
        return this.getSuite(id);
    }
    async getMarks() { return []; }
    async getSuite(suiteId: string): Promise<Suite | null> {
        try {
            const cleanId = suiteId.replace(/^(rp_st_|rp_pr_|rp_nd_)/, "");
            const data = await xrpc('app.rp.entity.getCurrent', { lineageId: cleanId, policy: 'latest-any' });
            if (data?.record) {
                const s = data.record;
                return {
                    id: s.slug || s.lineageId || s.uri || "",
                    lineageId: s.lineageId || s.uri || "",
                    slug: s.slug || s.lineageId || "",
                    version: s.version,
                    stage: s.stage || "draft",
                    title: s.title || "Untitled Suite",
                    description: s.description || s.summary || "",
                    purpose: s.purpose || "",
                    language: s.language || "en",
                    tags: s.tags || [],
                    includeProtocols: s.members?.protocols?.map((p: any) => ({ lineageId: p.uri })) || [],
                    foundationRef: s.foundationRef,
                    family: s.family,
                    release: s.release,
                    familyEvent: s.familyEvent,
                    followCount: s.followCount || 0,
                    adoptCount: s.adoptCount || 0
                } as Suite;
            }
        } catch (err) { console.error("AppView getSuite error:", err); }
        return null;
    }
    
    async resolveProtocolSlug() { return null; }
    async getProtocolByVersion() { return null; }
    async getProtocolByCid() { return null; }
}
