import { AtpAgent } from "@atproto/api";
import type { RPReadPort, RPWritePort } from "@/domain/ports";
import type { Mark, MarkVerb } from "@/domain/types";
import type { NeedRelease } from "@/features/needs/lib/releases";

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
    async getSuiteProtocols() { return []; }

    // Protocol stub resolvers
    async resolveProtocolSlug() { return null; }
    async getProtocolBySlug() { return null; }
    async getProtocolByVersion() { return null; }
    async getProtocolByCid() { return null; }
    
    // Write port stubs
    async createNeed(): Promise<any> { throw new Error("Method not implemented."); }
    async createProtocol(): Promise<any> { throw new Error("Method not implemented."); }
    async linkProtocolServesNeed(): Promise<any> { throw new Error("Method not implemented."); }
    async addProtocolToSuite(): Promise<any> { throw new Error("Method not implemented."); }

    // ---------- Needs write operations (Publishing) ----------
    async updateNeedDraft(rootId: string, version: string, patch: Partial<NeedRelease>): Promise<void> {
        if (!this.viewerDid) return;

        // In a real implementation, we would fetch the existing record first to merge.
        // For this hybrid implementation, the mock handles state, we just echo a new putRecord.
        // We use rootId as the rkey namespace (or generate a specific rkey based on version).
        
        const rkey = `${rootId}-v${version.replace(".", "-")}`;

        try {
            await this.agent.com.atproto.repo.putRecord({
                repo: this.viewerDid,
                collection: "org.rp.need",
                rkey: rkey,
                record: {
                    $type: "org.rp.need",
                    rootId: rootId,
                    version: version,
                    stage: "draft",
                    date: new Date().toISOString().split("T")[0],
                    language: patch.language ?? "en",
                    provenance: {
                        authorDid: this.viewerDid,
                        signature: undefined,
                    },
                    question: patch.title ?? "Draft Title",
                    description: patch.description ?? "",
                    purpose: patch.purpose ?? "",
                subject: {
                    subjectKind: "org.rp.need",
                    subjectRootId: rootId,
                    actorDid: this.viewerDid
                },
                relations: {
                        parentRootId: undefined,
                        childRootIds: [],
                        suiteIds: patch.tags?.length ? [patch.tags[0]] : [],
                        relatedProtocols: [],
                    },
                    tags: patch.tags ?? [],
                    connectivity: { shortUrl: "", qrCode: "" },
                    attribution: [],
                    history: [],
                    changeDescription: "",
                    endOfLifeAt: undefined,
                    archived: false,
                    createdAt: new Date().toISOString(),
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
        
        const rkey = `${rootId}-v${version.replace(".", "-")}`;
        
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
}