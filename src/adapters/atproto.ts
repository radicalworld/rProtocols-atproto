import { AtpAgent } from "@atproto/api";
import type { RPReadPort, RPWritePort } from "@/domain/ports";
import type { Mark, MarkVerb, Protocol, Need } from "@/domain/types";
import type { NeedRelease } from "@/features/needs/lib/releases";
import { cidString } from "@/lib/cid";
import { mockRepo } from "@/adapters/mock";

function getDeterministicRkey(rootId: string, version: string): string {
    // ATProto Record Keys (rkeys) are strictly bounded to 15 characters max.
    // DJB2 hash the identifier to generate a consistent, lexically valid safe key.
    const str = `${rootId}-v${version.replace(".", "-")}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return `rp${Math.abs(hash).toString(36)}`.slice(0, 15);
}

// ---- collections used in rProtocols ----
const NS = {
    mark: "org.rp.mark",
} as const;

// ---- list all records in a collection (handles pagination) ----
async function listAll(agent: AtpAgent, repoDid: string, collection: string) {
    const out: any[] = [];
    let cursor: string | undefined;
    do {
        const res = await agent.com.atproto.repo.listRecords({
            repo: repoDid,
            collection,
            limit: 100,
            cursor,
        });
        out.push(...(res.data.records ?? []));
        cursor = res.data.cursor;
    } while (cursor);
    return out; // [{uri, cid, value, ...}]
}
 
export class AtprotoAdapter implements RPReadPort, RPWritePort {
    constructor(
        private agent: AtpAgent,
        private canonicalDid: string,      // not used in marks, but useful for other reads
        private viewerDid?: string | null  // where follow/unfollow marks are stored
    ) {}

    async getProtocols(options?: { suiteId?: string; ancestorId?: string; }): Promise<Protocol[]> {
        return [];
    }

    // ---------- MARKS (needed by FollowEye/useFollowed) ----------
     async getMarks(verb: MarkVerb): Promise<Mark[]> {
        if (!this.viewerDid) return [];
        const recs = await listAll(this.agent, this.viewerDid, NS.mark);
        return recs
        .filter((r: any) => r.value?.verb === verb)
        .map((r: any) => ({
            id: r.uri,
            verb: r.value.verb,
            subjectId: r.value?.subject?.uri,
            status: r.value?.status ?? "active",
            context: r.value?.context,
            createdAt: r.value?.createdAt ?? new Date().toISOString(),
            subjectKind: "protocol", // assuming protocol for now since rProtocols marks protocols
            subjectLineageId: r.value?.subject?.uri,
            subjectRootId: r.value?.subject?.uri,
            actorDid: this.viewerDid ?? "",
        }));
    }
    
    async follow(subjectId: string): Promise<void> {
        if (!this.viewerDid) return;
        await this.agent.com.atproto.repo.createRecord({
            repo: this.viewerDid,
            collection: NS.mark,
            record: {
                $type: NS.mark,
                verb: "follow",
                subject: { $type: "com.atproto.repo.strongRef", uri: subjectId, cid: "" },
                status: "active",
                createdAt: new Date().toISOString()
            }
        });
    }

    async unfollow(subjectId: string): Promise<void> {
        if (!this.viewerDid) return;
        // find a follow mark for this subject
        const recs = await listAll(this.agent, this.viewerDid, NS.mark);
        const hit = recs.find(
            (r: any) => r.value?.verb === "follow" && r.value?.subject?.uri === subjectId
        );
        if (!hit) return;
        // at://did/collection/rkey  -> rkey is last segment
        const uri: string = hit.uri;
        const rkey = uri.split("/").pop()!;
        await this.agent.com.atproto.repo.deleteRecord({
            repo: this.viewerDid,
            collection: NS.mark,
            rkey
        });
    }

    async adopt(subjectId: string, context?: string): Promise<void> {
        if (!this.viewerDid) return;
        await this.agent.com.atproto.repo.createRecord({
            repo: this.viewerDid,
            collection: "org.rp.mark",
            record: {
                $type: "org.rp.mark",
                verb: "adopt",
                subject: { $type: "com.atproto.repo.strongRef", uri: subjectId, cid: "" },
                context,
                status: "active",
                createdAt: new Date().toISOString(),
            },
        });
    }

    async unadopt(subjectId: string): Promise<void> {
        if (!this.viewerDid) return;
        const recs = await listAll(this.agent, this.viewerDid, "org.rp.mark");
        const hit = recs.find(
            (r: any) => r.value?.verb === "adopt" && r.value?.subject?.uri === subjectId
        );
        if (!hit) return;
        const uri: string = hit.uri;
        const rkey = uri.split("/").pop()!;
        await this.agent.com.atproto.repo.deleteRecord({
            repo: this.viewerDid,
            collection: "org.rp.mark",
            rkey,
        });
    }

    async getSuite(id: string) {
        // Minimal: try to fetch the record if you store suites in org.rp.suite.
        // For now, return a placeholder so the profile can render a title.
        return { id, title: id.split("/").pop() ?? "Suite", description: "", protocolIds: [] } as any;
    }

    async getSuiteWithActiveMerge(id: string) {
        return this.getSuite(id);
    }

    async getProtocol(id: string) {
        return { id, title: id.split("/").pop() ?? "Protocol", summary: "", body: "" } as any;
    }

    // ---------- stubs for other ports (fill out later as you wire reads) ----------
    // These exist so TypeScript is happy even if you haven't implemented all reads yet.
    async listSections() { return []; }
    async getNeedsBySection() { return []; }
    async getNeedTree() { return null as any; }
    async getNeedByRootId() { return null; }
    async getNeedByVersion() { return null; }
    async getSuitesForNeed() { return []; }
    async getProtocolsForNeed() { return []; }
    
    // Fallback to mock logic temporarily so the app doesn't hang for signed-in users on local data
    async getSuiteProtocols(suiteId: string) { 
        return mockRepo.getSuiteProtocols(suiteId); 
    }
    async getNeedByLineageId(id: string) {
        return mockRepo.getNeedByLineageId(id);
    }

    // Protocol stub resolvers
    async resolveProtocolSlug() { return null; }
    async getProtocolBySlug() { return null; }
    async getProtocolByVersion() { return null; }
    async getProtocolByCid() { return null; }
    
    // Write port stubs
    // Write port native implementations
    async createNeed(payload: Pick<Need, "title" | "description" | "parentLineageId"> & { forkFrom?: string }, forceId?: string): Promise<string> { 
        if (!this.viewerDid) throw new Error("Not authenticated");
        const rootId = forceId || payload.title.toLowerCase().replace(/\s+/g, "-");
        
        let familyObj = undefined;
        let versionString = "0.1.0";
        if (payload.forkFrom) {
             const parent = await this.getNeedByLineageId?.(payload.forkFrom);
             if (parent) {
                 if (parent.family) familyObj = parent.family;
                 versionString = "2.0.0"; // Arbitrary major jump for PDS initialization
             }
        }
        
        await this.updateNeedDraft(rootId, versionString, { ...payload, parentLineageId: payload.parentLineageId ?? null, family: familyObj, forkFrom: payload.forkFrom } as any);
        return rootId;
    }
    
    async createProtocol(payload: Pick<Protocol, "title" | "summary" | "body" | "tags" | "language"> & { forkFrom?: string }, forceId?: string): Promise<string> { 
        if (!this.viewerDid) throw new Error("Not authenticated");
        const rootId = forceId || payload.title.toLowerCase().replace(/\s+/g, "-");
        
        let familyObj = undefined;
        let versionString = "0.1.0";
        if (payload.forkFrom) {
             const parent = await this.getProtocol(payload.forkFrom);
             if (parent) {
                 if (parent.family) familyObj = parent.family;
                 versionString = "2.0.0";
             }
        }
        
        await this.updateProtocolDraft(rootId, versionString, { ...payload, family: familyObj, forkFrom: payload.forkFrom });
        return rootId;
    }
    
    async linkProtocolServesNeed(pid: string, nid: string): Promise<void> {
        // PDS linking logic is implicit inside protocol metadata payloads for now
        return Promise.resolve();
    }
    
    async linkSuiteServesNeed(sid: string, nid: string): Promise<void> {
        // PDS linking logic is natively mapped recursively inside Suite DAG-CBOR payloads explicitly.
        return Promise.resolve();
    }
    
    async addProtocolToSuite(): Promise<any> { throw new Error("Method not implemented."); }

    // ---------- Needs write operations (Publishing) ----------
    async updateNeedDraft(rootId: string, version: string, patch: Partial<NeedRelease>): Promise<void> {
        if (!this.viewerDid) return;

        // In a real implementation, we would fetch the existing record first to merge.
        // For this hybrid implementation, the mock handles state, we just echo a new putRecord.
        // We use rootId as the rkey namespace (or generate a specific rkey based on version).
        
        const rkey = getDeterministicRkey(rootId, version);

        const dummyCid = await cidString("mock");
        try {
            await this.agent.com.atproto.repo.putRecord({
                repo: this.viewerDid,
                collection: "org.rp.need",
                rkey: rkey,
                record: {
                    $type: "org.rp.need",
                    lineage: {
                        id: rootId,
                        root: { uri: `at://${this.viewerDid}/org.rp.need/${rootId}`, cid: dummyCid }
                    },
                    slug: rootId,
                    version: version,
                    stage: "draft",
                    createdAt: new Date().toISOString(),
                    language: patch.language ?? "en",
                    family: (patch as any).family ?? { id: `rp_fm_${rootId}`, origin: { uri: `at://${this.viewerDid}/org.rp.need/${rootId}`, cid: dummyCid } },
                    release: (patch as any).forkFrom ? { kind: "fork", bump: "major" } : { kind: "genesis", bump: "patch" },
                    ...((patch as any).forkFrom ? { familyEvent: { type: "candidate-major-fork", status: "pending" } } : {}),
                    authorship: {
                        authorDid: this.viewerDid
                    },
                    title: patch.title ?? "Draft Title",
                    description: patch.description ?? "",
                    purpose: patch.purpose ?? "",
                    relations: {
                        suites: (patch as any).suiteLineageIds?.map((id: string) => ({ uri: id, cid: dummyCid })) || [],
                        children: (patch as any).childLineageIds?.map((id: string) => ({ uri: id, cid: dummyCid })) || [],
                        relatedProtocols: (patch as any).relatedProtocolLineageIds?.map((id: string) => ({ uri: id, cid: dummyCid })) || [],
                        parent: (patch as any).parentLineageId ? { uri: (patch as any).parentLineageId, cid: dummyCid } : undefined
                    },
                    tags: patch.tags ?? []
                },
            });
            
            console.log(`PDS: Successfully broadcasted org.rp.need draft update to PDS under rkey: ${rkey}`);
        } catch (e: any) {
            console.error("PDS Save Error:", e);
            throw e; // re-throw so the UI hook knows it failed
        }
    }

    async promoteNeedVersion(rootId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string): Promise<void> {
        if (!this.viewerDid) return;
        
        const rkey = getDeterministicRkey(rootId, version);
        
        try {
            // Fetch existing draft to preserve its content
            const existing = await this.agent.com.atproto.repo.getRecord({
                repo: this.viewerDid,
                collection: "org.rp.need",
                rkey: rkey
            });

            const record = existing.data.value as any;
            record.stage = toStage;
            if (changeDescription) record.changeDescription = changeDescription;

            await this.agent.com.atproto.repo.putRecord({
                repo: this.viewerDid,
                collection: "org.rp.need",
                rkey: rkey,
                record: record
            });
        } catch (e) {
            console.error("Failed to promote need version on PDS:", e);
        }
    }

    // ---------- Protocol write operations (Publishing) ----------
    async updateProtocolDraft(rootId: string, version: string, patch: any): Promise<void> {
        if (!this.viewerDid) return;

        const rkey = getDeterministicRkey(rootId, version);
        const dummyCid = await cidString("mock");
        try {
            await this.agent.com.atproto.repo.putRecord({
                repo: this.viewerDid,
                collection: "org.rp.protocol",
                rkey: rkey,
                record: {
                    $type: "org.rp.protocol",
                    lineage: {
                        id: rootId,
                        root: { uri: `at://${this.viewerDid}/org.rp.protocol/${rootId}`, cid: dummyCid }
                    },
                    slug: rootId,
                    version: version,
                    stage: "draft",
                    createdAt: new Date().toISOString(),
                    language: patch.language ?? "en",
                    family: patch.family ?? { id: `rp_fm_${rootId}`, origin: { uri: `at://${this.viewerDid}/org.rp.protocol/${rootId}`, cid: dummyCid } },
                    release: patch.forkFrom ? { kind: "fork", bump: "major" } : { kind: "genesis", bump: "patch" },
                    ...(patch.forkFrom ? { familyEvent: { type: "candidate-major-fork", status: "pending" } } : {}),
                    authorship: {
                        authorDid: this.viewerDid
                    },
                    needRef: { uri: `at://${this.viewerDid}/org.rp.need/mock`, cid: dummyCid },
                    title: patch.title ?? "Draft Title",
                    summary: patch.summary ?? "",
                    protocolBody: patch.protocolBody ?? (patch as any).body ?? "",
                    tags: (patch as any).tags ?? patch.tags ?? [],
                    ...(patch.changeDescription ? { changeDescription: patch.changeDescription } : {})
                },
            });
            console.log(`PDS: Successfully broadcasted org.rp.protocol draft update to PDS under rkey: ${rkey}`);
        } catch (e: any) {
            console.error("PDS Save Error (Protocol):", e);
            throw e;
        }
    }

    async promoteProtocolVersion(rootId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string): Promise<void> {
        if (!this.viewerDid) return;
        const rkey = getDeterministicRkey(rootId, version);
        try {
            const existing = await this.agent.com.atproto.repo.getRecord({
                repo: this.viewerDid,
                collection: "org.rp.protocol",
                rkey: rkey
            });
            const record = existing.data.value as any;
            record.stage = toStage;
            if (changeDescription) record.changeDescription = changeDescription;
            await this.agent.com.atproto.repo.putRecord({
                repo: this.viewerDid,
                collection: "org.rp.protocol",
                rkey: rkey,
                record: record
            });
        } catch (e) {
            console.error("Failed to promote protocol version on PDS:", e);
        }
    }

    // ---------- Suite write operations (Publishing) ----------
    async createSuite(payload: any, forceId?: string): Promise<string> {
        if (!this.viewerDid) throw new Error("Not logged in");
        
        const rootId = forceId ? `rp_st_${forceId}` : `rp_st_${Math.random().toString(36).slice(2, 10)}`;
        const rkey = `rpv${Math.random().toString(36).slice(2, 7)}`;
        
        let familyObj = undefined;
        let versionString = "0.1.0";
        if (payload.forkFrom) {
             const parent = await this.getSuite(payload.forkFrom);
             if (parent) {
                 if (parent.family) familyObj = parent.family;
                 versionString = "2.0.0";
             }
        }
        
        try {
            await this.agent.com.atproto.repo.putRecord({
                repo: this.viewerDid,
                collection: "org.rp.suite",
                rkey: rkey,
                record: {
                    $type: "org.rp.suite",
                    lineage: {
                        id: rootId,
                        root: { uri: `at://${this.viewerDid}/org.rp.suite/${rootId}`, cid: "mock" }
                    },
                    slug: rootId,
                    version: versionString,
                    stage: "draft",
                    createdAt: new Date().toISOString(),
                    language: payload.language ?? "en",
                    family: familyObj ?? { id: `rp_fm_${rootId}`, origin: { uri: `at://${this.viewerDid}/org.rp.suite/${rootId}`, cid: "mock" } },
                    release: payload.forkFrom ? { kind: "fork", bump: "major" } : { kind: "genesis", bump: "patch" },
                    ...(payload.forkFrom ? { familyEvent: { type: "candidate-major-fork", status: "pending" } } : {}),
                    authorship: {
                        authorDid: this.viewerDid
                    },
                    title: payload.title ?? "Draft Suite",
                    description: payload.purpose ?? "",
                    purpose: payload.purpose ?? "",
                    members: {
                        needs: payload.parentNeedLineageId ? [{ uri: `at://${this.viewerDid}/org.rp.need/${payload.parentNeedLineageId}`, cid: "mock" }] : [],
                        protocols: payload.includeProtocols?.map((p: any) => ({ uri: `at://${this.viewerDid}/org.rp.protocol/${p.lineageId || p.uri || ""}`, cid: "mock" })) || []
                    },
                    tags: payload.tags ?? []
                }
            });
            console.log(`PDS: Successfully broadcasted org.rp.suite root to PDS under rkey: ${rkey}`);
            return rootId;
        } catch (e: any) {
            console.error("PDS Save Error (Suite Root):", e);
            throw e;
        }
    }

    async updateSuiteDraft(rootId: string, version: string, patch: any): Promise<void> {
        if (!this.viewerDid) return;

        const rkey = getDeterministicRkey(rootId, version);
        const dummyCid = await cidString("mock");
        
        try {
            await this.agent.com.atproto.repo.putRecord({
                repo: this.viewerDid,
                collection: "org.rp.suite",
                rkey: rkey,
                record: {
                    $type: "org.rp.suite",
                    lineage: {
                        id: rootId,
                        root: { uri: `at://${this.viewerDid}/org.rp.suite/${rootId}`, cid: dummyCid }
                    },
                    slug: rootId,
                    version: version,
                    stage: "draft",
                    createdAt: new Date().toISOString(),
                    language: patch.language ?? "en",
                    authorship: {
                        authorDid: this.viewerDid
                    },
                    title: patch.title ?? "Draft Suite",
                    description: patch.description ?? patch.summary ?? patch.purpose ?? "",
                    purpose: patch.purpose ?? patch.description ?? "",
                    members: {
                        needs: patch.parentNeedLineageId ? [{ uri: `at://${this.viewerDid}/org.rp.need/${patch.parentNeedLineageId}`, cid: dummyCid }] : [],
                        protocols: patch.includeProtocols?.map((p: any) => ({ uri: `at://${this.viewerDid}/org.rp.protocol/${p.lineageId || p.uri || ""}`, cid: dummyCid })) || []
                    },
                    tags: patch.tags ?? []
                }
            });
            console.log(`PDS: Successfully broadcasted org.rp.suite draft update to PDS under rkey: ${rkey}`);
        } catch (e: any) {
            console.error("PDS Save Error (Suite):", e);
            throw e;
        }
    }

    async promoteSuiteVersion(rootId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string): Promise<void> {
        if (!this.viewerDid) return;
        const rkey = getDeterministicRkey(rootId, version);
        try {
            const existing = await this.agent.com.atproto.repo.getRecord({
                repo: this.viewerDid,
                collection: "org.rp.suite",
                rkey: rkey
            });
            const record = existing.data.value as any;
            record.stage = toStage;
            if (changeDescription) record.changeDescription = changeDescription;
            await this.agent.com.atproto.repo.putRecord({
                repo: this.viewerDid,
                collection: "org.rp.suite",
                rkey: rkey,
                record: record
            });
        } catch (e) {
            console.error("Failed to promote suite version on PDS:", e);
        }
    }
}