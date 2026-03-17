// src/adapters/appview.ts
import type { Need, Protocol, SectionId, Suite } from "@/domain/types";

const APPVIEW_URL = "http://16.146.139.100:3010/api";

export class AppViewAdapter {
    async getNeedByRootId(rootId: string): Promise<Need | null> {
        try {
            const res = await fetch(`${APPVIEW_URL}/needs/${encodeURIComponent(rootId)}`);
            if (!res.ok) return null;
            const data = await res.json();
            if (data && data.success && data.need) {
                console.log(
                    "%c[APPVIEW HIT] %cLoaded Need from Ubuntu SQLite: %c" + data.need.title, 
                    "background: #10B981; color: white; padding: 2px 4px; border-radius: 4px;",
                    "color: #10B981; font-weight: bold;",
                    "color: inherit; font-weight: normal;"
                );
                // the sqlite row looks like: { uri, cid, rootId, version, authorDid, title, purpose, description }
                // Map it to Need domain object
                const n = data.need;
                return {
                    rootId: n.rootId,
                    title: n.title,
                    purpose: n.purpose,
                    description: n.description,
                    language: "en",
                    parentRootId: null,
                    childRootIds: [],
                    suiteIds: [],
                    tags: []
                } as Need;
            }
        } catch (err) {
            console.error("AppView getNeedByRootId error:", err);
        }
        return null;
    }

    async getProtocol(id: string): Promise<Protocol | null> {
        try {
            const res = await fetch(`${APPVIEW_URL}/protocols/${encodeURIComponent(id)}`);
            if (!res.ok) return null;
            const data = await res.json();
            if (data && data.success && data.protocol) {
                console.log(
                    "%c[APPVIEW HIT] %cLoaded Protocol from Ubuntu SQLite: %c" + data.protocol.title, 
                    "background: #3B82F6; color: white; padding: 2px 4px; border-radius: 4px;",
                    "color: #3B82F6; font-weight: bold;",
                    "color: inherit; font-weight: normal;"
                );
                const p = data.protocol;
                return {
                    id: p.rootId, // or p.uri if you mapping uri
                    title: p.title,
                    summary: p.description,
                    body: p.body || ""
                };
            }
        } catch (err) {
            console.error("AppView getProtocol error:", err);
        }
        return null;
    }

    async getProtocols(options?: { suiteId?: string; ancestorId?: string }): Promise<Protocol[]> {
        try {
            const res = await fetch(`${APPVIEW_URL}/protocols`);
            if (!res.ok) return [];
            const data = await res.json();
            if (data && data.success && data.protocols) {
                console.log(
                    "%c[APPVIEW HIT] %cLoaded Protocol List from Ubuntu SQLite", 
                    "background: #F59E0B; color: white; padding: 2px 4px; border-radius: 4px;",
                    "color: #F59E0B; font-weight: bold;"
                );
                return data.protocols.map((p: any) => ({
                    id: p.rootId,
                    title: p.title,
                    summary: p.description,
                    body: p.body || ""
                }));
            }
        } catch (err) {
            console.error("AppView getProtocols error:", err);
        }
        return [];
    }

    async getSuitesForNeed(needId: string): Promise<Suite[]> {
        try {
            const res = await fetch(`${APPVIEW_URL}/needs/${encodeURIComponent(needId)}/suites`);
            if (!res.ok) return [];
            const data = await res.json();
            if (data && data.success && data.suites) {
                console.log(
                    "%c[APPVIEW HIT] %cLoaded Suites for Need from Ubuntu SQLite", 
                    "background: #F59E0B; color: white; padding: 2px 4px; border-radius: 4px;",
                    "color: #F59E0B; font-weight: bold;"
                );
                return data.suites.map((s: any) => ({
                    rootId: s.rootId,
                    title: s.title,
                    summary: s.description,
                    childRootIds: [],
                    tagline: ""
                }));
            }
        } catch (err) {
            console.error("AppView getSuitesForNeed error:", err);
        }
        return [];
    }

    async getSuiteProtocols(suiteId: string): Promise<Protocol[]> {
        try {
            const res = await fetch(`${APPVIEW_URL}/suites/${encodeURIComponent(suiteId)}/protocols`);
            if (!res.ok) return [];
            const data = await res.json();
            if (data && data.success && data.protocols) {
                console.log(
                    "%c[APPVIEW HIT] %cLoaded Protocols for Suite from Ubuntu SQLite", 
                    "background: #F59E0B; color: white; padding: 2px 4px; border-radius: 4px;",
                    "color: #F59E0B; font-weight: bold;"
                );
                return data.protocols.map((p: any) => ({
                    id: p.rootId,
                    title: p.title,
                    summary: p.description,
                    body: p.body || ""
                }));
            }
        } catch (err) {
            console.error("AppView getSuiteProtocols error:", err);
        }
        return [];
    }

    async getNeedsBySection(sectionId: SectionId): Promise<Need[]> {
        try {
            // Re-using the generic /protocols endpoint methodology for this proxy iteration
            const res = await fetch(`${APPVIEW_URL}/needs`); 
            if (!res.ok) return [];
            const data = await res.json();
            if (data && data.success && data.needs) {
                console.log(
                    "%c[APPVIEW HIT] %cLoaded Root Needs from Ubuntu SQLite", 
                    "background: #F59E0B; color: white; padding: 2px 4px; border-radius: 4px;",
                    "color: #F59E0B; font-weight: bold;"
                );
                return data.needs
                    .filter((n: any) => n.tags?.includes("root")) // Temporary client-side filtering until robust taxonomy API indexing is implemented
                    .map((n: any) => ({
                        rootId: n.rootId,
                        title: n.title,
                        purpose: n.purpose,
                        description: n.description,
                        language: "en",
                        parentRootId: null,
                        childRootIds: [],
                        suiteIds: [],
                        tags: []
                    }));
            }
        } catch (err) {
            console.error("AppView getNeedsBySection error:", err);
        }
        return [];
    }
}

export const appViewAdapter = new AppViewAdapter();
