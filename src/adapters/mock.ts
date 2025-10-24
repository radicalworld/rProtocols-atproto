import { nanoid } from "nanoid";
import type { RPRepository, RPReadPort, RPWritePort } from "@/domain/ports";
import type {
    SectionId, NeedId, SuiteId, ProtocolId, Need, NeedNode, Suite, Protocol, Mark, MarkVerb,
    ProtocolRoot, ProtocolVersion, ProtocolRootId
} from "@/domain/types";
import { needs as seedNeeds, suites as seedSuites, protocols as seedProtocols, marks as seedMarks } from "@/data/seeds";
import { cidString } from "@/lib/cid";
import { canonicalize } from "@/lib/canonical";
import { parseVersion } from "@/lib/version";

// In-memory stores (cloned so we can mutate)
const needs: Record<string, Need> = JSON.parse(JSON.stringify(seedNeeds));
const suites: Record<string, Suite> = JSON.parse(JSON.stringify(seedSuites));
const protocols: Record<string, Protocol> = JSON.parse(JSON.stringify(seedProtocols));
const marks: Record<string, Mark> = JSON.parse(JSON.stringify(seedMarks));

// ---- Simple root/version indexes bootstrapped from protocols ----
const protoRoots: Record<ProtocolRootId, ProtocolRoot> = {};
const protoVersionsByCid: Record<string, ProtocolVersion> = {};
const slugToRootId: Record<string, ProtocolRootId> = {};

function canonicalize(obj: unknown) {
    // deterministic stringify (keys sorted shallowly — good enough for mock)
    return JSON.stringify(obj, Object.keys(obj as any).sort());
}

function mockCidFor(slug: string, version = "1.0.0") {
    // readable, deterministic "cid" for dev (replace with real CID later)
    return `mockcid-${slug}@${version}`;
}

// Build roots/versions from seed protocols once
for (const p of Object.values(protocols)) {
    const slug = p.id;                             // keep current id as slug
    const rootId = `root-${slug}`;                 // stable id
    const content: Protocol = { id: p.id, title: p.title, summary: p.summary, body: p.body };
    const version = "1.0.0";
    const cid = await cidString(content); // << make the init function async or precompute elsewhere
    protoRoots[rootId] = {
        id: rootId,
        slug,
        latestCid: cid,
        latestVersion: version,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    slugToRootId[slug] = rootId;
    protoVersionsByCid[cid] = {
        parentId: rootId,
        version,
        cid,
        content,
        createdAt: new Date().toISOString(),
        stage: "stable",
    };
}

// Section registry
const sectionMap: Record<SectionId, { title: string; intro: string; needIds: string[] }> = {
    root: {
        title: "Root",
        intro: "These are the Root Protocols that ground openness, iteration, and trust.",
        needIds: ["root-open-protocols"]
  },
    work: {
        title: "Work",
        intro: "Protocols that serve collaboration in work.",
        needIds: ["work-collaboration"]
  },
    website: {
        title: "Website",
        intro: "Protocols that serve web presence and operations.",
        needIds: ["web-presence"]
  }
};

// ---------- helpers ----------
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function buildNeedNode(needId: NeedId): NeedNode {
    const n = needs[needId];
    return {
        ...n,
        children: n.childIds.map((cid) => needs[cid])
    };
}

function protocolsForNeed(needId: NeedId): Protocol[] {
    const n = needs[needId];
    const viaSuites = n.suiteIds.flatMap((sid) => suites[sid]?.protocolIds ?? []);
    const all = new Set<string>([...n.protocolIds, ...viaSuites]);
    return Array.from(all).map((pid) => protocols[pid]).filter(Boolean);
}

let seeded = false;
async function ensureSeeded() {
    if (seeded) return;
    // build protoRoots/protoVersionsByCid here and await cidString(...) inside
    seeded = true;
}

// ---------- adapter ----------
class MockAdapter implements RPRepository {
    // READ

    async resolveProtocolSlug(slug: string) {
        const rootId = slugToRootId[slug] ?? null;
        if (!rootId) return null;
        const root = clone(protoRoots[rootId]);
        return { root, preferredSlug: root.slug };
    }

    async getProtocolBySlug(slug: string) {
        const res = await this.resolveProtocolSlug(slug);
        if (!res) return null;
        const v = protoVersionsByCid[res.root.latestCid ?? ""];
        return v ? clone(v.content) : null;
    }

    async getProtocolByVersion(slug: string, version: string) {
        const res = await this.resolveProtocolSlug(slug);
        if (!res) return null;
        // In this mock we have one version, synthesize the cid pattern:
        const cid = mockCidFor(slug, version);
        const v = protoVersionsByCid[cid];
        return v ? clone(v.content) : null;
    }

    async getProtocolByCid(cid: string) {
        const v = protoVersionsByCid[cid];
        return v ? clone(v.content) : null;
    }

    async getProtocol(id: ProtocolId): Promise<Protocol | null> {
        // Backward compatibility for existing callers
        return clone(protocols[id] ?? null);
    }

    async getSuite(id: SuiteId) {
        return clone(suites[id] ?? null);
    }

    async listSections() {
        return (Object.keys(sectionMap) as SectionId[]).map((id) => ({
        id,
        title: sectionMap[id].title,
        intro: sectionMap[id].intro
        }));
    }

    async getNeedsBySection(section: SectionId): Promise<Need[]> {
        const ids = sectionMap[section]?.needIds ?? [];
        return clone(ids.map((id) => needs[id]).filter(Boolean));
    }

    async getNeedTree(needId: NeedId): Promise<NeedNode> {
        return clone(buildNeedNode(needId));
    }

    async getSuitesForNeed(needId: NeedId): Promise<Suite[]> {
        const n = needs[needId];
        return clone(n.suiteIds.map((sid) => suites[sid]).filter(Boolean));
    }

    async getProtocolsForNeed(needId: NeedId): Promise<Protocol[]> {
        return clone(protocolsForNeed(needId));
    }

    async getSuiteProtocols(suiteId: SuiteId): Promise<Protocol[]> {
        const s = suites[suiteId];
        return clone((s?.protocolIds ?? []).map((pid) => protocols[pid]).filter(Boolean));
    }

    async getMarks(verb: MarkVerb): Promise<Mark[]> {
        return clone(Object.values(marks).filter((m) => m.verb === verb));
    }

    // WRITE
    async follow(subjectId: string): Promise<void> {
        const id = nanoid();
        marks[id] = {
        id,
        verb: "follow",
        subjectId,
        status: "active",
        createdAt: new Date().toISOString()
        };
    }

    async unfollow(subjectId: string): Promise<void> {
        const entry = Object.values(marks).find(
            (m) => m.verb === "follow" && m.subjectId === subjectId && m.status === "active"
        );
        if (entry) {
            delete marks[entry.id];
        }
    }

    async adopt(subjectId: string, context?: string): Promise<void> {
        const id = nanoid();
        marks[id] = {
        id,
        verb: "adopt",
        subjectId,
        status: "active",
        context,
        createdAt: new Date().toISOString()
        };
    }

    async unadopt(subjectId: string): Promise<void> {
        const entry = Object.values(marks).find(
            (m) => m.verb === "adopt" && m.subjectId === subjectId && m.status === "active"
        );
        if (entry) {
            delete marks[entry.id];
        }
    }

    async createNeed(payload: Pick<Need, "title" | "description" | "parentId">): Promise<NeedId> {
        const id = payload.title.toLowerCase().replace(/\s+/g, "-");
        const newNeed: Need = {
        id,
        title: payload.title,
        description: payload.description,
        parentId: payload.parentId ?? null,
        childIds: [],
        suiteIds: [],
        protocolIds: []
        };
        needs[id] = newNeed;
        if (payload.parentId && needs[payload.parentId]) {
        needs[payload.parentId].childIds.push(id);
        }
        return id;
    }

    async createProtocol(payload: Pick<Protocol, "title" | "summary" | "body">): Promise<ProtocolId> {
        const id = payload.title.toLowerCase().replace(/\s+/g, "-");
        protocols[id] = { id, title: payload.title, summary: payload.summary, body: payload.body };
        return id;
    }

    async linkProtocolServesNeed(protocolId: ProtocolId, needId: NeedId): Promise<void> {
        if (!needs[needId] || !protocols[protocolId]) return;
        const n = needs[needId];
        if (!n.protocolIds.includes(protocolId)) n.protocolIds.push(protocolId);
    }

    async addProtocolToSuite(protocolId: ProtocolId, suiteId: SuiteId): Promise<void> {
        if (!suites[suiteId] || !protocols[protocolId]) return;
        const s = suites[suiteId];
        if (!s.protocolIds.includes(protocolId)) s.protocolIds.push(protocolId);
    }

    async publishProtocolVersion(v: ProtocolVersion): Promise<ProtocolVersion> {
        // derive stage automatically
        const { major } = parseVersion(v.version);
        const stage = v.stage ?? (major === 0 ? "draft" : "stable");

        const content = canonicalize(v.content);
        const cid = await cidString(content);
  
        const next: ProtocolVersion = {
            ...v,
            content,
            cid,
            stage,
            createdAt: new Date().toISOString(),
        };

        protoVersionsByCid[cid] = next;

        // update root
        const root = protoRoots[v.parentId];
        if (root) {
            root.latestCid = cid;
            root.latestVersion = v.version;
            root.updatedAt = new Date().toISOString();
        }

        return clone(next);
    }
}

// Singleton export
export const mockRepo: RPReadPort & RPWritePort = new MockAdapter();