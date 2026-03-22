import { nanoid } from "nanoid";
import type { RPRepository, RPReadPort, RPWritePort } from "@/domain/ports";
import type {
    SectionId, NeedId, SuiteId, ProtocolId, Need, NeedNode, NeedRelease, Suite, Protocol, Mark, MarkVerb
} from "@/domain/types";
import { needs as seedNeeds, suites as seedSuites, protocols as seedProtocols, marks as seedMarks } from "@/data/seeds";
import { cidString } from "@/lib/cid";
import { parseVersion } from "@/lib/version";
import { protocolReleases } from "@/data/releases";

// In-memory stores (cloned so we can mutate)
const needs: Record<string, Need> = JSON.parse(JSON.stringify(seedNeeds));
for (const n of Object.values(needs)) {
    if ((n as any).id && !n.lineageId) n.lineageId = (n as any).id;
    if ((n as any).parentLineageId !== undefined && n.parentLineageId === undefined) n.parentLineageId = (n as any).parentLineageId;
    if ((n as any).childLineageIds && !n.childLineageIds) n.childLineageIds = (n as any).childLineageIds;
    if ((n as any).relatedProtocolLineageIds && !n.relatedProtocolLineageIds) n.relatedProtocolLineageIds = (n as any).relatedProtocolLineageIds;
    if (!n.language) n.language = "en";
    if (!(n as any).family) (n as any).family = { id: `rp_fm_${n.lineageId.replace("rp_nd_", "")}`, origin: { uri: n.id, cid: "mock-origin" } };
}

const suites: Record<string, Suite> = JSON.parse(JSON.stringify(seedSuites));
for (const s of Object.values(suites)) {
    if ((s as any).id && !s.lineageId) s.lineageId = (s as any).id;
    if ((s as any).relatedProtocolLineageIds && !s.includeProtocols) s.includeProtocols = (s as any).relatedProtocolLineageIds.map((id: string) => ({ lineageId: id }));
    if (!(s as any).family) (s as any).family = { id: `rp_fm_${s.lineageId.replace("rp_st_", "")}`, origin: { uri: s.id, cid: "mock-origin" } };
}


const protocols: Record<string, Protocol> = JSON.parse(JSON.stringify(seedProtocols));
for (const p of Object.values(protocols)) {
    if (!(p as any).id && (p as any).lineageId) (p as any).id = (p as any).lineageId;
    if (!(p as any).family) (p as any).family = { id: `rp_fm_${p.lineageId.replace("rp_pt_", "").replace("rp_", "")}`, origin: { uri: (p as any).id, cid: "mock-origin" } };
}

const marks: Record<string, Mark> = JSON.parse(JSON.stringify(seedMarks));

// ---- Simple root/version indexes bootstrapped from protocols ----
const protoRoots: Record<string, any> = {};
const protoVersionsByCid: Record<string, any> = {};
const slugToRootId: Record<string, string> = {};

export const suiteReleases: Record<string, any> = {};

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
    const lineageId = p.lineageId || `root-${slug}`;                 // stable id
    const content: Protocol = { id: p.id, lineageId, slug, title: p.title, summary: p.summary, body: p.body };
    const version = "1.0.0";
    const cid = await cidString(content); // << make the init function async or precompute elsewhere
    protoRoots[lineageId] = {
        id: lineageId,
        lineageId,
        slug,
        latestCid: cid,
        latestVersion: version,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    slugToRootId[slug] = lineageId;
    protoVersionsByCid[cid] = {
        parentLineageId: lineageId,
        version,
        cid,
        content,
        createdAt: new Date().toISOString(),
        stage: "stable",
    };
}

const LOCAL_STORAGE_KEY = "rp_mock_db";

function saveToLocal() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
            needs, suites, protocols, marks, protoRoots, protoVersionsByCid, slugToRootId, protocolReleases, suiteReleases
        }));
    } catch(e) {}
}

function loadFromLocal() {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return false;
        const db = JSON.parse(raw);
        Object.keys(needs).forEach(k => delete needs[k]); Object.assign(needs, db.needs);
        Object.keys(suites).forEach(k => delete suites[k]); Object.assign(suites, db.suites);
        Object.keys(protocols).forEach(k => delete protocols[k]); Object.assign(protocols, db.protocols);
        Object.keys(marks).forEach(k => delete marks[k]); Object.assign(marks, db.marks);
        Object.keys(protoRoots).forEach(k => delete protoRoots[k]); Object.assign(protoRoots, db.protoRoots);
        Object.keys(protoVersionsByCid).forEach(k => delete protoVersionsByCid[k]); Object.assign(protoVersionsByCid, db.protoVersionsByCid);
        Object.keys(slugToRootId).forEach(k => delete slugToRootId[k]); Object.assign(slugToRootId, db.slugToRootId);
        Object.keys(protocolReleases).forEach(k => delete protocolReleases[k]); Object.assign(protocolReleases, db.protocolReleases);
        if (db.suiteReleases) {
            Object.keys(suiteReleases).forEach(k => delete suiteReleases[k]); Object.assign(suiteReleases, db.suiteReleases);
            // Self-healing loop: fix legacy corrupted objects saved without internal `.version` tags
            Object.values(suiteReleases).forEach((bucket: any) => {
                if (bucket && bucket.releases) {
                    Object.entries(bucket.releases).forEach(([verKey, releaseObj]: [string, any]) => {
                        if (!releaseObj.version) releaseObj.version = verKey;
                    });
                }
            });
        }
        return true;
    } catch(e) { return false; }
}

loadFromLocal();

// No longer utilizing a static Section Registry.
// Categories perfectly map 1:1 with Top-Level Root Needs.
// ---------- helpers ----------
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// Ensure every suite natively tracks at least its active version node 
// to prevent length===0 UI bugs inside the SuiteVersionSwitcher mapping
Object.values(suites).forEach(suite => {
    if (!suiteReleases[suite.lineageId]) {
        const fallbackVersion = suite.version || "1.0.0";
        suiteReleases[suite.lineageId] = {
            current: fallbackVersion,
            releases: {
                [fallbackVersion]: { 
                    ...clone(suite), 
                    version: fallbackVersion,
                    stage: suite.stage || "draft" 
                }
            }
        };
    }
});

function toNeedRelease(n: Need): NeedRelease {
    return {
        ...n,
        id: `release-${n.lineageId}-latest`,
        lineageId: n.lineageId,
        slug: n.slug || n.lineageId,
        question: n.title,
        purpose: n.purpose || "",
        version: "1.0",
        stage: "stable",
        date: new Date().toISOString().split("T")[0]
    };
}

function buildNeedNode(needId: NeedId): NeedNode {
    const n = needs[needId];
    return {
        ...toNeedRelease(n),
        children: (n.childLineageIds || []).map((cid) => toNeedRelease(needs[cid]))
    };
}

function protocolsForNeed(needId: NeedId): Protocol[] {
    const n = needs[needId];
    const viaSuites = (n.suiteLineageIds || []).flatMap((sid) => suites[sid]?.includeProtocols?.map(p => p.lineageId) ?? []);
    const all = new Set<string>([...(n.relatedProtocolLineageIds || []), ...viaSuites]);
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
    async promoteProtocolVersion(lineageId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string): Promise<void> {
        console.log(`[DEBUG: mock.ts] Entering promoteProtocolVersion for ${lineageId} v${version} -> ${toStage}`);
        const bucket = (protocolReleases as any)[lineageId];
        if (bucket && bucket.releases[version]) {
            bucket.releases[version].stage = toStage;
            console.log(`[DEBUG: mock.ts] Firing stage update! bucket.releases[${version}].stage = ${toStage}`);
            const cid = bucket.releases[version].cid;
            if (cid && protoVersionsByCid[cid]) {
                protoVersionsByCid[cid].stage = toStage;
                protoVersionsByCid[cid].updatedAt = new Date().toISOString();
                console.log(`[DEBUG: mock.ts] Updated CID ${cid} to stage ${toStage}`);
            }
        } else {
            console.log(`[DEBUG: mock.ts] FAILED to find bucket or release! bucket:`, !!bucket);
        }
        saveToLocal();
    }

    async resolveProtocolSlug(slug: string) {
        const lineageId = slugToRootId[slug] ?? null;
        if (!lineageId) return null;
        const root = clone(protoRoots[lineageId]);
        if (!root) return null;
        return { lineageId, preferredSlug: root.slug };
    }

    private findNeed(id: string): Need | undefined {
        return (needs as any)[id] || Object.values(needs).find(n => n.lineageId === id);
    }

    private findSuite(id: string): Suite | undefined {
        return (suites as any)[id] || Object.values(suites).find(s => s.lineageId === id);
    }

    private findProtocol(id: string): Protocol | undefined {
        return (protocols as any)[id] || Object.values(protocols).find(p => p.lineageId === id);
    }

    async getNeedByLineageId(lineageId: string): Promise<Need | null> {
        return this.findNeed(lineageId) || null;
    }

    async getNeedByVersion(lineageId: string, version: string): Promise<Need | null> {
        return this.findNeed(lineageId) || null; // Mock returns the same object for now
    }

    async getProtocolBySlug(slug: string) {
        const res = await this.resolveProtocolSlug(slug);
        if (!res) return null;
        const root = protoRoots[res.lineageId];
        if (!root) return null;
        const v = protoVersionsByCid[root.latestCid ?? ""];
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
        const p = this.findProtocol(id);
        return p ? clone(p) : null;
    }

    async getSuite(id: SuiteId) {
        return this.getSuiteWithActiveMerge(id);
    }

    async getSuiteWithActiveMerge(id: SuiteId) {
        const s = this.findSuite(id);
        if (!s) return null;

        console.log("Mock.ts getSuite Trace:", { 
            queryId: id, 
            resolvedLineageId: s.lineageId, 
            suiteReleasesExists: typeof suiteReleases !== 'undefined',
            hasKey: !!(typeof suiteReleases !== 'undefined' && suiteReleases[s.lineageId]),
            availableKeys: typeof suiteReleases !== 'undefined' ? Object.keys(suiteReleases) : []
        });

        if (typeof suiteReleases !== 'undefined' && suiteReleases[s.lineageId]) {
            const bucket = suiteReleases[s.lineageId];
            let active = bucket.releases[bucket.current];
            if (!active) {
                const available = Object.values(bucket.releases);
                if (available.length > 0) active = available[available.length - 1] as any;
            }
            if (active) {
                return clone({ ...s, ...active });
            }
        }

        return clone(s);
    }

    async listSections() {
        const categories: SectionId[] = ["collaboration", "work", "website"];
        return categories.map((id) => {
            const n = this.findNeed(id);
            return {
                id,
                title: n?.title || id,
                intro: n?.description || ""
            };
        });
    }

    async getNeedsBySection(section: SectionId): Promise<Need[]> {
        const n = this.findNeed(section);
        return n ? [clone(n)] : [];
    }

    async getNeedTree(needId: NeedId): Promise<NeedNode> {
        return clone(buildNeedNode(needId));
    }

    async getSuitesForNeed(needId: NeedId): Promise<Suite[]> {
        const n = this.findNeed(needId);
        return clone((n?.suiteLineageIds || []).map((sid) => this.findSuite(sid)).filter(Boolean) as Suite[]);
    }

    async getProtocols(): Promise<Protocol[]> {
        return Object.values(protocols).map(p => {
            let active = p;
            if (typeof protocolReleases !== 'undefined' && protocolReleases[p.lineageId]) {
                const bucket = protocolReleases[p.lineageId];
                const snap = bucket.releases[bucket.current];
                if (snap) active = { ...p, ...snap };
            }
            return clone(active);
        });
    }

    async getSuites(): Promise<Suite[]> {
        return Object.values(suites).map(s => {
            let active = s;
            if (typeof suiteReleases !== 'undefined' && suiteReleases[s.lineageId]) {
                const bucket = suiteReleases[s.lineageId];
                const snap = bucket.releases[bucket.current];
                if (snap) active = { ...s, ...snap };
            }
            return clone(active);
        });
    }

    async getProtocolsForNeed(needId: NeedId): Promise<Protocol[]> {
        return clone(protocolsForNeed(needId));
    }

    async getSuiteProtocols(suiteId: SuiteId): Promise<Protocol[]> {
        const s = this.findSuite(suiteId);
        if (!s || !s.includeProtocols) return [];
        return clone(s.includeProtocols.map((p: any) => this.findProtocol(p.lineageId || p.id)).filter(Boolean) as Protocol[]);
    }

    async getMarks(verb: MarkVerb): Promise<Mark[]> {
        return clone(Object.values(marks).filter((m) => m.verb === verb));
    }

    // WRITE
    async follow(subjectId: string, kind: "need" | "protocol" | "suite"): Promise<void> {
        const id = nanoid();
        marks[id] = {
            id,
            verb: "follow",
            subjectKind: kind,
            subjectLineageId: subjectId,
            actorDid: "did:web:mock-user",
            status: "active",
            createdAt: new Date().toISOString()
        };
    }

    async unfollow(subjectId: string, kind: "need" | "protocol" | "suite"): Promise<void> {
        const entry = Object.values(marks).find(
            (m) => m.verb === "follow" && m.subjectLineageId === subjectId && m.status === "active"
        );
        if (entry) {
            delete marks[entry.id];
        }
    }

    async adopt(subjectId: string, kind: "need" | "protocol" | "suite", context?: string): Promise<void> {
        const id = nanoid();
        marks[id] = {
            id,
            verb: "adopt",
            subjectKind: kind,
            subjectLineageId: subjectId,
            actorDid: "did:web:mock-user",
            status: "active",
            context,
            createdAt: new Date().toISOString()
        };
    }

    async unadopt(subjectId: string, kind: "need" | "protocol" | "suite"): Promise<void> {
        const entry = Object.values(marks).find(
            (m) => m.verb === "adopt" && m.subjectLineageId === subjectId && m.status === "active"
        );
        if (entry) {
            delete marks[entry.id];
        }
    }

    async createNeed(payload: Pick<Need, "title" | "description" | "parentLineageId" | "purpose" | "language" | "tags"> & { forkFrom?: string, foundationRef?: any }, forceId?: string): Promise<NeedId> {
        let familyObj = (payload as any).family;
        let foundationRefObj = payload.foundationRef || { uri: "suite-root-protocols", cid: "mock" };
        if (payload.forkFrom) {
            const parent = this.findNeed(payload.forkFrom);
            if (parent && parent.family) familyObj = parent.family;
            if (parent && parent.foundationRef) foundationRefObj = parent.foundationRef;
        }

        const id = forceId || payload.title.toLowerCase().replace(/\s+/g, "-");
        const newNeed: Need = {
            id,
            lineageId: `rp_${id}`,
            slug: id,
            language: "en",
            title: payload.title,
            description: payload.description,
            parentLineageId: payload.parentLineageId ?? null,
            childLineageIds: [],
            suiteLineageIds: [],
            relatedProtocolLineageIds: [],
            foundationRef: foundationRefObj,
            family: familyObj || { id: `rp_fm_${id}`, origin: { uri: id, cid: "mock-origin" } }
        };
        (newNeed as any).version = "0.1.0";
        (newNeed as any).stage = "draft";
        needs[id] = newNeed;
        const parent = payload.parentLineageId ? this.findNeed(payload.parentLineageId) : undefined;
        if (parent) {
            parent.childLineageIds.push(id);
        }
        
        return id;
    }

    async createSuite(payload: Pick<Suite, "title" | "purpose" | "tags" | "language" | "includeProtocols"> & { parentNeedLineageId?: string, forkFrom?: string, foundationRef?: any }, forceId?: string): Promise<string> {
        let familyObj = (payload as any).family;
        let foundationRefObj = payload.foundationRef || { uri: "suite-root-protocols", cid: "mock" };
        let versionString = "0.1.0";
        if (payload.forkFrom) {
            const parent = this.findSuite(payload.forkFrom);
            if (parent) {
                if (parent.family) familyObj = parent.family;
                if (parent.foundationRef) foundationRefObj = parent.foundationRef;
            }
        }

        const isFork = !!payload.forkFrom;
        const releaseRecord = isFork ? { kind: "fork", bump: "major" } : { kind: "genesis", bump: "patch" };
        const familyEventRecord = isFork ? { type: "candidate-major-fork", status: "pending" } : undefined;

        const id = forceId || payload.title.toLowerCase().replace(/\s+/g, "-");
        suites[id] = {
            id,
            lineageId: `rp_st_${id}`,
            version: versionString,
            stage: "draft",
            slug: id,
            title: payload.title,
            tags: payload.tags || [],
            language: payload.language || "en",
            purpose: payload.purpose || "",
            includeProtocols: payload.includeProtocols || [],
            foundationRef: foundationRefObj,
            family: familyObj || { id: `rp_fm_${id}`, origin: { uri: id, cid: "mock-origin" } },
            release: releaseRecord,
            familyEvent: familyEventRecord
        } as Suite;
        
        if (payload.parentNeedLineageId) {
            await this.linkSuiteServesNeed(id, payload.parentNeedLineageId);
        }
        
        // Seed the release bucket to natively allow version tracking immediately
        if (typeof suiteReleases !== 'undefined') {
            suiteReleases[suites[id].lineageId] = {
                current: versionString,
                releases: {
                    [versionString]: {
                        ...clone(suites[id])
                    }
                }
            };
        }
        
        saveToLocal();
        return id;
    }

    async linkSuiteServesNeed(suiteId: SuiteId, needId: NeedId): Promise<void> {
        if (!needs[needId] || !suites[suiteId]) return;
        const n = needs[needId];
        const sLineage = suites[suiteId].lineageId;
        if (!n.suiteLineageIds) n.suiteLineageIds = [];
        if (!n.suiteLineageIds.includes(sLineage)) n.suiteLineageIds.push(sLineage);
        saveToLocal();
    }

    async createProtocol(payload: Pick<Protocol, "title" | "summary" | "body" | "tags" | "language"> & { family?: any, forkFrom?: string, foundationRef?: any }): Promise<ProtocolId> {
        let familyObj = payload.family;
        let foundationRefObj = payload.foundationRef || { uri: "suite-root-protocols", cid: "mock" };
        let versionString = "0.1.0";
        if (payload.forkFrom) {
            const parent = this.findProtocol(payload.forkFrom);
            if (parent) {
                if (parent.family) familyObj = parent.family;
                if (parent.foundationRef) foundationRefObj = parent.foundationRef;
            }
        }

        // family and familyEvent handling
        const isFork = !!payload.forkFrom;
        const releaseRecord = isFork ? { kind: "fork", bump: "major" } : { kind: "genesis", bump: "patch" };
        const familyEventRecord = isFork ? { type: "candidate-major-fork", status: "pending" } : undefined;

        const id = payload.title.toLowerCase().replace(/\s+/g, "-");
        protocols[id] = { 
            id, 
            lineageId: `rp_${id}`, 
            slug: id, 
            title: payload.title, 
            summary: payload.summary, 
            body: payload.body, 
            tags: payload.tags || [],
            language: payload.language || "en",
            foundationRef: foundationRefObj,
            family: familyObj || { id: `rp_fm_${id}`, origin: { uri: id, cid: "mock-origin" } },
            release: releaseRecord,
            familyEvent: familyEventRecord
        } as Protocol;
        
        // Seed the release bucket to 0.1.0 and register root mappings
        if (typeof protocolReleases !== 'undefined') {
            (protocolReleases as any)[id] = {
                current: versionString,
                releases: {
                    [versionString]: {
                        version: versionString,
                        sourceLineageId: undefined, // Update logic
                        createdAt: new Date().toISOString(),
                        tags: payload.tags,
                        language: payload.language,
                        release: payload.forkFrom ? { kind: "fork", bump: "major" } : { kind: "genesis", bump: "patch" },
                        familyEvent: payload.forkFrom ? { type: "candidate-major-fork", status: "pending" } : undefined
                    }
                }
            };
        }
        
        return id;
    }

    async linkProtocolServesNeed(protocolId: ProtocolId, needId: NeedId): Promise<void> {
        if (!needs[needId] || !protocols[protocolId]) return;
        const n = needs[needId];
        if (!n.relatedProtocolLineageIds) n.relatedProtocolLineageIds = [];
        if (!n.relatedProtocolLineageIds.includes(protocolId)) n.relatedProtocolLineageIds.push(protocolId);
    }

    async addProtocolToSuite(protocolId: ProtocolId, suiteId: SuiteId): Promise<void> {
        if (!suites[suiteId] || !protocols[protocolId]) return;
        const s = suites[suiteId];
        if (!s.includeProtocols) s.includeProtocols = [];
        if (!s.includeProtocols.some(p => p.lineageId === protocolId)) s.includeProtocols.push({ lineageId: protocolId });
    }

    async publishany(v: any): Promise<any> {
        // derive stage automatically
        const { major } = parseVersion(v.version);
        const stage = v.stage ?? (major === 0 ? "draft" : "stable");

        const contentStr = JSON.stringify(v.content);
        const cid = await cidString(contentStr);

        const next: any = {
            ...v,
            content: v.content,
            cid,
            stage,
            createdAt: new Date().toISOString(),
        };

        protoVersionsByCid[cid] = next;

        // update root
        const root = protoRoots[v.parentLineageId];
        if (root) {
            root.latestCid = cid;
            root.latestVersion = v.version;
            root.updatedAt = new Date().toISOString();
        }

        return clone(next);
    }

    // --- Suite Editing (Mocks) ---
    async updateSuiteDraft(lineageId: string, version: string, patch: any): Promise<void> {
        const suite = this.findSuite(lineageId) || suites[lineageId];
        if (!suite) {
            console.warn("Suite not found in mock store, skipping local update:", lineageId);
            return;
        }

        // 1. Enforce ATProto Append-Only Spec: Never overwrite existing version blocks.
        if (!suiteReleases[lineageId]) {
            suiteReleases[lineageId] = { current: "0.1.0", releases: {} };
        }
        const bucket = suiteReleases[lineageId];
        if (!bucket.releases[bucket.current]) bucket.releases[bucket.current] = clone(suite);
        
        // Append new structural leaf node
        const source = bucket.releases[bucket.current];
        bucket.releases[version] = {
            ...source,
            ...patch,
            version: version,
            stage: "draft",
            createdAt: new Date().toISOString()
        };
        bucket.current = version;
        
        console.log(`[ATProto DAG-CBOR] Appended immutable Suite Draft leaf node: ${lineageId}@${version}`);

        // 2. Reflect latest state backward for generic UI fetching
        if (patch.title !== undefined) suite.title = patch.title;
        if (patch.purpose !== undefined || patch.description !== undefined) {
            suite.purpose = patch.purpose ?? patch.description;
            suite.description = patch.description ?? patch.purpose;
        }
        if (patch.tags !== undefined) suite.tags = patch.tags;
        if (patch.language !== undefined) suite.language = patch.language;
        if (patch.includeProtocols !== undefined) suite.includeProtocols = patch.includeProtocols;
        
        saveToLocal();
    }

    async promoteSuiteVersion(lineageId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string): Promise<void> {
        const bucket = suiteReleases[lineageId];
        if (bucket && bucket.releases[version]) {
            bucket.releases[version].stage = toStage;
        }
        saveToLocal();
    }

    // --- Need Editing (Mocks) ---
    async updateNeedDraft(lineageId: string, version: string, patch: any): Promise<void> {
        const root = this.findNeed(lineageId) || needs[lineageId];
        if (!root) {
            console.warn("Need not found in mock store, skipping local update:", lineageId);
            return;
        }

        // mock.ts stores Need, not NeedRelease/NeedRoot, so we mutate root directly for local demo.
        if (patch.title !== undefined) root.title = patch.title; 
        if (patch.description !== undefined) root.description = patch.description;
        if (patch.purpose !== undefined) root.purpose = patch.purpose;
        if (patch.tags !== undefined) root.tags = patch.tags;
        if (patch.language !== undefined) root.language = patch.language;
        (root as any).version = version; // Expose the bumped version back to the frontend hooks!
    }

    async promoteNeedVersion(lineageId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string): Promise<void> {
        const root = this.findNeed(lineageId) || needs[lineageId];
        if (root) {
            (root as any).stage = toStage;
        }
        saveToLocal();
    }

    // --- Protocol Editing (Mocks) ---
    async updateProtocolDraft(lineageId: string, version: string, patch: any): Promise<void> {
        const proto = this.findProtocol(lineageId) || protocols[lineageId];
        if (!proto) {
            console.warn("Protocol not found in mock store, skipping local update:", lineageId);
            return;
        }

        if (patch.title !== undefined) proto.title = patch.title;
        if (patch.summary !== undefined) proto.summary = patch.summary;
        if (patch.body !== undefined) proto.body = patch.body;

        // Also mutate the protocolReleases dictionary so `getRelease` reads the new payload
        const bucket = (protocolReleases as any)[lineageId];
        if (bucket) {
            // If the version doesn't exist yet, we must CREATE it to obey append-only semantics locally!
            if (!bucket.releases[version]) {
                const source = bucket.releases[bucket.current];
                bucket.releases[version] = {
                    ...source,
                    version: version,
                    stage: "draft",
                    createdAt: new Date().toISOString()
                };
                bucket.current = version;
            }
            
            const release = bucket.releases[version];
            if (release) {
                if (patch.body !== undefined) release.protocolBody = patch.body;
                if (patch.title !== undefined) release.title = patch.title;
                if (patch.summary !== undefined) release.summary = patch.summary;
                if (patch.tags !== undefined) release.tags = patch.tags;
                if (patch.language !== undefined) release.language = patch.language;
            }
        }

        // Must update protoVersionsByCid because `getProtocolBySlug` reads from there!
        const prRootId = slugToRootId[lineageId];
        const root = prRootId ? protoRoots[prRootId] : null;
        if (root && root.latestCid) {
            const pv = protoVersionsByCid[root.latestCid];
            if (pv) {
                // To obey strict append-only rules locally, we must spawn a new synthetic CID head
                const newCid = "mock_cid_append_" + Date.now();
                protoVersionsByCid[newCid] = {
                    ...pv,
                    content: { ...pv.content, version: version }
                };
                
                root.latestCid = newCid;
                
                const newPv = protoVersionsByCid[newCid];
                if (patch.title !== undefined) newPv.content.title = patch.title;
                if (patch.summary !== undefined) newPv.content.summary = patch.summary;
                if (patch.body !== undefined) newPv.content.body = patch.body;
                
                // Keep the Release bucket in sync with the new CID
                if (bucket && bucket.releases[version]) {
                    bucket.releases[version].cid = newCid;
                }
            }
        }
    }

    async promoteany(lineageId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string): Promise<void> {
         // Do nothing for mock adapter
    }
}

// Singleton export
const rawAdapter = new MockAdapter();

// Intercept all write methods dynamically and force a local serialization so the array footprints survive Vite's reload cycles
export const mockRepo: RPReadPort & RPWritePort = new Proxy(rawAdapter, {
    get(target, prop, receiver) {
        const origMethod = (target as any)[prop];
        if (typeof origMethod === 'function') {
            return function (...args: any[]) {
                const res = origMethod.apply(target, args);
                if (res instanceof Promise) {
                    return res.then(val => {
                        if (
                            ["createNeed", "createProtocol", "linkProtocolServesNeed", "addProtocolToSuite", 
                             "publishany", "updateNeedDraft", "updateProtocolDraft", "promoteany", 
                             "promoteProtocolVersion", "promoteNeedVersion", "follow", "unfollow", 
                             "adopt", "unadopt"].includes(prop.toString())
                        ) {
                            saveToLocal();
                        }
                        return val;
                    });
                }
                return res;
            };
        }
        return Reflect.get(target, prop, receiver);
    }
});