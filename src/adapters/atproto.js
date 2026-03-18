import { cidString } from "@/lib/cid";
import { mockRepo } from "@/adapters/mock";
function getDeterministicRkey(rootId, version) {
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
};
// ---- list all records in a collection (handles pagination) ----
async function listAll(agent, repoDid, collection) {
    const out = [];
    let cursor;
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
export class AtprotoAdapter {
    agent;
    canonicalDid;
    viewerDid;
    constructor(agent, canonicalDid, // not used in marks, but useful for other reads
    viewerDid // where follow/unfollow marks are stored
    ) {
        this.agent = agent;
        this.canonicalDid = canonicalDid;
        this.viewerDid = viewerDid;
    }
    async getProtocols(options) {
        return [];
    }
    // ---------- MARKS (needed by FollowEye/useFollowed) ----------
    async getMarks(verb) {
        if (!this.viewerDid)
            return [];
        const recs = await listAll(this.agent, this.viewerDid, NS.mark);
        return recs
            .filter((r) => r.value?.verb === verb)
            .map((r) => ({
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
    async follow(subjectId) {
        if (!this.viewerDid)
            return;
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
    async unfollow(subjectId) {
        if (!this.viewerDid)
            return;
        // find a follow mark for this subject
        const recs = await listAll(this.agent, this.viewerDid, NS.mark);
        const hit = recs.find((r) => r.value?.verb === "follow" && r.value?.subject?.uri === subjectId);
        if (!hit)
            return;
        // at://did/collection/rkey  -> rkey is last segment
        const uri = hit.uri;
        const rkey = uri.split("/").pop();
        await this.agent.com.atproto.repo.deleteRecord({
            repo: this.viewerDid,
            collection: NS.mark,
            rkey
        });
    }
    async adopt(subjectId, context) {
        if (!this.viewerDid)
            return;
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
    async unadopt(subjectId) {
        if (!this.viewerDid)
            return;
        const recs = await listAll(this.agent, this.viewerDid, "org.rp.mark");
        const hit = recs.find((r) => r.value?.verb === "adopt" && r.value?.subject?.uri === subjectId);
        if (!hit)
            return;
        const uri = hit.uri;
        const rkey = uri.split("/").pop();
        await this.agent.com.atproto.repo.deleteRecord({
            repo: this.viewerDid,
            collection: "org.rp.mark",
            rkey,
        });
    }
    async getSuite(id) {
        // Minimal: try to fetch the record if you store suites in org.rp.suite.
        // For now, return a placeholder so the profile can render a title.
        return { id, title: id.split("/").pop() ?? "Suite", description: "", protocolIds: [] };
    }
    async getProtocol(id) {
        return { id, title: id.split("/").pop() ?? "Protocol", summary: "", body: "" };
    }
    // ---------- stubs for other ports (fill out later as you wire reads) ----------
    // These exist so TypeScript is happy even if you haven't implemented all reads yet.
    async listSections() { return []; }
    async getNeedsBySection() { return []; }
    async getNeedTree() { return null; }
    async getNeedByRootId() { return null; }
    async getNeedByVersion() { return null; }
    async getSuitesForNeed() { return []; }
    async getProtocolsForNeed() { return []; }
    // Fallback to mock logic temporarily so the app doesn't hang for signed-in users on local data
    async getSuiteProtocols(suiteId) {
        return mockRepo.getSuiteProtocols(suiteId);
    }
    // Protocol stub resolvers
    async resolveProtocolSlug() { return null; }
    async getProtocolBySlug() { return null; }
    async getProtocolByVersion() { return null; }
    async getProtocolByCid() { return null; }
    // Write port stubs
    async createNeed() { throw new Error("Method not implemented."); }
    async createProtocol() { throw new Error("Method not implemented."); }
    async linkProtocolServesNeed() { throw new Error("Method not implemented."); }
    async addProtocolToSuite() { throw new Error("Method not implemented."); }
    // ---------- Needs write operations (Publishing) ----------
    async updateNeedDraft(rootId, version, patch) {
        if (!this.viewerDid)
            return;
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
                    authorship: {
                        authorDid: this.viewerDid
                    },
                    title: patch.title ?? "Draft Title",
                    description: patch.description ?? "",
                    purpose: patch.purpose ?? "",
                    relations: {
                        suites: patch.suiteLineageIds?.map((id) => ({ uri: id, cid: dummyCid })) || [],
                        children: patch.childLineageIds?.map((id) => ({ uri: id, cid: dummyCid })) || [],
                        relatedProtocols: patch.relatedProtocolLineageIds?.map((id) => ({ uri: id, cid: dummyCid })) || [],
                        parent: patch.parentLineageId ? { uri: patch.parentLineageId, cid: dummyCid } : undefined
                    },
                    tags: patch.tags ?? []
                },
            });
            console.log(`PDS: Successfully broadcasted org.rp.need draft update to PDS under rkey: ${rkey}`);
        }
        catch (e) {
            console.error("PDS Save Error:", e);
            throw e; // re-throw so the UI hook knows it failed
        }
    }
    async promoteNeedVersion(rootId, version, toStage, changeDescription) {
        if (!this.viewerDid)
            return;
        const rkey = getDeterministicRkey(rootId, version);
        try {
            // Fetch existing draft to preserve its content
            const existing = await this.agent.com.atproto.repo.getRecord({
                repo: this.viewerDid,
                collection: "org.rp.need",
                rkey: rkey
            });
            const record = existing.data.value;
            record.stage = toStage;
            if (changeDescription)
                record.changeDescription = changeDescription;
            await this.agent.com.atproto.repo.putRecord({
                repo: this.viewerDid,
                collection: "org.rp.need",
                rkey: rkey,
                record: record
            });
        }
        catch (e) {
            console.error("Failed to promote need version on PDS:", e);
        }
    }
    // ---------- Protocol write operations (Publishing) ----------
    async updateProtocolDraft(rootId, version, patch) {
        if (!this.viewerDid)
            return;
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
                    authorship: {
                        authorDid: this.viewerDid
                    },
                    needRef: { uri: `at://${this.viewerDid}/org.rp.need/mock`, cid: dummyCid },
                    title: patch.title ?? "Draft Title",
                    summary: patch.summary ?? "",
                    protocolBody: patch.protocolBody ?? patch.body ?? "",
                    tags: patch.tags ?? patch.tags ?? [],
                    ...(patch.changeDescription ? { changeDescription: patch.changeDescription } : {})
                },
            });
            console.log(`PDS: Successfully broadcasted org.rp.protocol draft update to PDS under rkey: ${rkey}`);
        }
        catch (e) {
            console.error("PDS Save Error (Protocol):", e);
            throw e;
        }
    }
    async promoteProtocolVersion(rootId, version, toStage, changeDescription) {
        if (!this.viewerDid)
            return;
        const rkey = getDeterministicRkey(rootId, version);
        try {
            const existing = await this.agent.com.atproto.repo.getRecord({
                repo: this.viewerDid,
                collection: "org.rp.protocol",
                rkey: rkey
            });
            const record = existing.data.value;
            record.stage = toStage;
            if (changeDescription)
                record.changeDescription = changeDescription;
            await this.agent.com.atproto.repo.putRecord({
                repo: this.viewerDid,
                collection: "org.rp.protocol",
                rkey: rkey,
                record: record
            });
        }
        catch (e) {
            console.error("Failed to promote protocol version on PDS:", e);
        }
    }
    // ---------- Suite write operations (Publishing) ----------
    async updateSuiteDraft(rootId, version, patch) {
        if (!this.viewerDid)
            return;
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
                    description: patch.description ?? patch.summary ?? "",
                    purpose: patch.purpose ?? "",
                    members: {
                        protocols: patch.includeProtocols?.map((p) => ({ uri: p.lineageId || p.uri || "", cid: dummyCid })) || []
                    },
                    tags: patch.tags ?? []
                }
            });
            console.log(`PDS: Successfully broadcasted org.rp.suite draft update to PDS under rkey: ${rkey}`);
        }
        catch (e) {
            console.error("PDS Save Error (Suite):", e);
            throw e;
        }
    }
    async promoteSuiteVersion(rootId, version, toStage, changeDescription) {
        if (!this.viewerDid)
            return;
        const rkey = getDeterministicRkey(rootId, version);
        try {
            const existing = await this.agent.com.atproto.repo.getRecord({
                repo: this.viewerDid,
                collection: "org.rp.suite",
                rkey: rkey
            });
            const record = existing.data.value;
            record.stage = toStage;
            if (changeDescription)
                record.changeDescription = changeDescription;
            await this.agent.com.atproto.repo.putRecord({
                repo: this.viewerDid,
                collection: "org.rp.suite",
                rkey: rkey,
                record: record
            });
        }
        catch (e) {
            console.error("Failed to promote suite version on PDS:", e);
        }
    }
}
