import { AtpAgent } from "@atproto/api";
import type { RPReadPort, RPWritePort } from "@/domain/ports";
import type { Mark, MarkVerb } from "@/domain/types";

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
    async getSuitesForNeed() { return []; }
    async getProtocolsForNeed() { return []; }
    async getSuiteProtocols() { return []; }
}