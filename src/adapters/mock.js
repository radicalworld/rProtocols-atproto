import { nanoid } from "nanoid";
import { needs as seedNeeds, suites as seedSuites, protocols as seedProtocols, marks as seedMarks } from "@/data/seeds";
import { cidString } from "@/lib/cid";
import { parseVersion } from "@/lib/version";
import { protocolReleases } from "@/data/releases";
// In-memory stores (cloned so we can mutate)
const needs = JSON.parse(JSON.stringify(seedNeeds));
for (const n of Object.values(needs)) {
    if (n.id && !n.lineageId)
        n.lineageId = n.id;
    if (n.parentLineageId !== undefined && n.parentLineageId === undefined)
        n.parentLineageId = n.parentLineageId;
    if (n.childLineageIds && !n.childLineageIds)
        n.childLineageIds = n.childLineageIds;
    if (n.relatedProtocolLineageIds && !n.relatedProtocolLineageIds)
        n.relatedProtocolLineageIds = n.relatedProtocolLineageIds;
    if (!n.language)
        n.language = "en";
}
const suites = JSON.parse(JSON.stringify(seedSuites));
for (const s of Object.values(suites)) {
    if (s.id && !s.lineageId)
        s.lineageId = s.id;
    if (s.relatedProtocolLineageIds && !s.includeProtocols)
        s.includeProtocols = s.relatedProtocolLineageIds.map((id) => ({ lineageId: id }));
}
const protocols = JSON.parse(JSON.stringify(seedProtocols));
for (const p of Object.values(protocols)) {
    if (!p.id && p.lineageId)
        p.id = p.lineageId;
}
const marks = JSON.parse(JSON.stringify(seedMarks));
// ---- Simple root/version indexes bootstrapped from protocols ----
const protoRoots = {};
const protoVersionsByCid = {};
const slugToRootId = {};
export const suiteReleases = {};
function canonicalize(obj) {
    // deterministic stringify (keys sorted shallowly — good enough for mock)
    return JSON.stringify(obj, Object.keys(obj).sort());
}
function mockCidFor(slug, version = "1.0.0") {
    // readable, deterministic "cid" for dev (replace with real CID later)
    return `mockcid-${slug}@${version}`;
}
// Build roots/versions from seed protocols once
for (const p of Object.values(protocols)) {
    const slug = p.id; // keep current id as slug
    const lineageId = p.lineageId || `root-${slug}`; // stable id
    const content = { id: p.id, lineageId, slug, title: p.title, summary: p.summary, body: p.body };
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
    }
    catch (e) { }
}
function loadFromLocal() {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw)
            return false;
        const db = JSON.parse(raw);
        Object.keys(needs).forEach(k => delete needs[k]);
        Object.assign(needs, db.needs);
        Object.keys(suites).forEach(k => delete suites[k]);
        Object.assign(suites, db.suites);
        Object.keys(protocols).forEach(k => delete protocols[k]);
        Object.assign(protocols, db.protocols);
        Object.keys(marks).forEach(k => delete marks[k]);
        Object.assign(marks, db.marks);
        Object.keys(protoRoots).forEach(k => delete protoRoots[k]);
        Object.assign(protoRoots, db.protoRoots);
        Object.keys(protoVersionsByCid).forEach(k => delete protoVersionsByCid[k]);
        Object.assign(protoVersionsByCid, db.protoVersionsByCid);
        Object.keys(slugToRootId).forEach(k => delete slugToRootId[k]);
        Object.assign(slugToRootId, db.slugToRootId);
        Object.keys(protocolReleases).forEach(k => delete protocolReleases[k]);
        Object.assign(protocolReleases, db.protocolReleases);
        if (db.suiteReleases) {
            Object.keys(suiteReleases).forEach(k => delete suiteReleases[k]);
            Object.assign(suiteReleases, db.suiteReleases);
        }
        return true;
    }
    catch (e) {
        return false;
    }
}
loadFromLocal();
// No longer utilizing a static Section Registry.
// Categories perfectly map 1:1 with Top-Level Root Needs.
// ---------- helpers ----------
const clone = (v) => JSON.parse(JSON.stringify(v));
function toNeedRelease(n) {
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
function buildNeedNode(needId) {
    const n = needs[needId];
    return {
        ...toNeedRelease(n),
        children: (n.childLineageIds || []).map((cid) => toNeedRelease(needs[cid]))
    };
}
function protocolsForNeed(needId) {
    const n = needs[needId];
    const viaSuites = (n.suiteLineageIds || []).flatMap((sid) => suites[sid]?.includeProtocols?.map(p => p.lineageId) ?? []);
    const all = new Set([...(n.relatedProtocolLineageIds || []), ...viaSuites]);
    return Array.from(all).map((pid) => protocols[pid]).filter(Boolean);
}
let seeded = false;
async function ensureSeeded() {
    if (seeded)
        return;
    // build protoRoots/protoVersionsByCid here and await cidString(...) inside
    seeded = true;
}
// ---------- adapter ----------
class MockAdapter {
    // READ
    async promoteProtocolVersion(id, version) { }
    async resolveProtocolSlug(slug) {
        const lineageId = slugToRootId[slug] ?? null;
        if (!lineageId)
            return null;
        const root = clone(protoRoots[lineageId]);
        if (!root)
            return null;
        return { lineageId, preferredSlug: root.slug };
    }
    findNeed(id) {
        return needs[id] || Object.values(needs).find(n => n.lineageId === id);
    }
    findSuite(id) {
        return suites[id] || Object.values(suites).find(s => s.lineageId === id);
    }
    findProtocol(id) {
        return protocols[id] || Object.values(protocols).find(p => p.lineageId === id);
    }
    async getNeedByLineageId(lineageId) {
        return this.findNeed(lineageId) || null;
    }
    async getNeedByVersion(lineageId, version) {
        return this.findNeed(lineageId) || null; // Mock returns the same object for now
    }
    async getProtocolBySlug(slug) {
        const res = await this.resolveProtocolSlug(slug);
        if (!res)
            return null;
        const root = protoRoots[res.lineageId];
        if (!root)
            return null;
        const v = protoVersionsByCid[root.latestCid ?? ""];
        return v ? clone(v.content) : null;
    }
    async getProtocolByVersion(slug, version) {
        const res = await this.resolveProtocolSlug(slug);
        if (!res)
            return null;
        // In this mock we have one version, synthesize the cid pattern:
        const cid = mockCidFor(slug, version);
        const v = protoVersionsByCid[cid];
        return v ? clone(v.content) : null;
    }
    async getProtocolByCid(cid) {
        const v = protoVersionsByCid[cid];
        return v ? clone(v.content) : null;
    }
    async getProtocol(id) {
        // Backward compatibility for existing callers
        const p = this.findProtocol(id);
        return p ? clone(p) : null;
    }
    async getSuite(id) {
        const s = this.findSuite(id);
        if (!s)
            return null;
        return clone(s);
    }
    async listSections() {
        const categories = ["collaboration", "work", "website"];
        return categories.map((id) => {
            const n = this.findNeed(id);
            return {
                id,
                title: n?.title || id,
                intro: n?.description || ""
            };
        });
    }
    async getNeedsBySection(section) {
        const n = this.findNeed(section);
        return n ? [clone(n)] : [];
    }
    async getNeedTree(needId) {
        return clone(buildNeedNode(needId));
    }
    async getSuitesForNeed(needId) {
        const n = this.findNeed(needId);
        return clone((n?.suiteLineageIds || []).map((sid) => this.findSuite(sid)).filter(Boolean));
    }
    async getProtocols() {
        return Object.keys(protocolReleases).map(id => ({
            id,
            lineageId: id,
            slug: id,
            title: protocolReleases[id][0].title || "",
            summary: protocolReleases[id][0].summary,
            body: protocolReleases[id][0].content,
        }));
    }
    async getProtocolsForNeed(needId) {
        return clone(protocolsForNeed(needId));
    }
    async getSuiteProtocols(suiteId) {
        const s = this.findSuite(suiteId);
        if (!s || !s.includeProtocols)
            return [];
        return clone(s.includeProtocols.map((p) => this.findProtocol(p.lineageId || p.id)).filter(Boolean));
    }
    async getMarks(verb) {
        return clone(Object.values(marks).filter((m) => m.verb === verb));
    }
    // WRITE
    async follow(subjectId) {
        const id = nanoid();
        marks[id] = {
            id,
            verb: "follow",
            subjectKind: "protocol",
            subjectLineageId: subjectId,
            actorDid: "did:web:mock-user",
            status: "active",
            createdAt: new Date().toISOString()
        };
    }
    async unfollow(subjectId) {
        const entry = Object.values(marks).find((m) => m.verb === "follow" && m.subjectLineageId === subjectId && m.status === "active");
        if (entry) {
            delete marks[entry.id];
        }
    }
    async adopt(subjectId, context) {
        const id = nanoid();
        marks[id] = {
            id,
            verb: "adopt",
            subjectKind: "protocol",
            subjectLineageId: subjectId,
            actorDid: "did:web:mock-user",
            status: "active",
            context,
            createdAt: new Date().toISOString()
        };
    }
    async unadopt(subjectId) {
        const entry = Object.values(marks).find((m) => m.verb === "adopt" && m.subjectLineageId === subjectId && m.status === "active");
        if (entry) {
            delete marks[entry.id];
        }
    }
    async createNeed(payload) {
        const id = payload.title.toLowerCase().replace(/\s+/g, "-");
        const newNeed = {
            id,
            lineageId: `rp_${id}`,
            slug: id,
            language: "en",
            title: payload.title,
            description: payload.description,
            parentLineageId: payload.parentLineageId ?? null,
            childLineageIds: [],
            suiteLineageIds: [],
            relatedProtocolLineageIds: []
        };
        needs[id] = newNeed;
        const parent = payload.parentLineageId ? this.findNeed(payload.parentLineageId) : undefined;
        if (parent) {
            parent.childLineageIds.push(id);
        }
        return id;
    }
    async createSuite(payload, forceId) {
        const id = forceId || payload.title.toLowerCase().replace(/\s+/g, "-");
        suites[id] = {
            id,
            lineageId: `rp_st_${id}`,
            slug: id,
            title: payload.title,
            tags: payload.tags || [],
            language: payload.language || "en",
            purpose: payload.purpose || "",
            includeProtocols: payload.includeProtocols || []
        };
        if (payload.parentNeedLineageId) {
            await this.linkSuiteServesNeed(id, payload.parentNeedLineageId);
        }
        saveToLocal();
        return id;
    }
    async linkSuiteServesNeed(suiteId, needId) {
        if (!needs[needId] || !suites[suiteId])
            return;
        const n = needs[needId];
        const sLineage = suites[suiteId].lineageId;
        if (!n.suiteLineageIds)
            n.suiteLineageIds = [];
        if (!n.suiteLineageIds.includes(sLineage))
            n.suiteLineageIds.push(sLineage);
        saveToLocal();
    }
    async createProtocol(payload) {
        const id = payload.title.toLowerCase().replace(/\s+/g, "-");
        protocols[id] = { id, lineageId: `rp_${id}`, slug: id, title: payload.title, summary: payload.summary, body: payload.body || "", tags: payload.tags, language: payload.language };
        // Seed the release bucket to 0.1.0 and register root mappings
        if (typeof protocolReleases !== 'undefined') {
            protocolReleases[id] = {
                current: "0.1.0",
                releases: {
                    "0.1.0": {
                        version: "0.1.0",
                        stage: "draft",
                        createdAt: new Date().toISOString(),
                        tags: payload.tags,
                        language: payload.language
                    }
                }
            };
        }
        return id;
    }
    async linkProtocolServesNeed(protocolId, needId) {
        if (!needs[needId] || !protocols[protocolId])
            return;
        const n = needs[needId];
        if (!n.relatedProtocolLineageIds)
            n.relatedProtocolLineageIds = [];
        if (!n.relatedProtocolLineageIds.includes(protocolId))
            n.relatedProtocolLineageIds.push(protocolId);
    }
    async addProtocolToSuite(protocolId, suiteId) {
        if (!suites[suiteId] || !protocols[protocolId])
            return;
        const s = suites[suiteId];
        if (!s.includeProtocols)
            s.includeProtocols = [];
        if (!s.includeProtocols.some(p => p.lineageId === protocolId))
            s.includeProtocols.push({ lineageId: protocolId });
    }
    async publishany(v) {
        // derive stage automatically
        const { major } = parseVersion(v.version);
        const stage = v.stage ?? (major === 0 ? "draft" : "stable");
        const contentStr = JSON.stringify(v.content);
        const cid = await cidString(contentStr);
        const next = {
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
    async updateSuiteDraft(lineageId, version, patch) {
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
        if (!bucket.releases[bucket.current])
            bucket.releases[bucket.current] = clone(suite);
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
        if (patch.title !== undefined)
            suite.title = patch.title;
        if (patch.purpose !== undefined || patch.description !== undefined) {
            suite.purpose = patch.purpose ?? patch.description;
            suite.description = patch.description ?? patch.purpose;
        }
        if (patch.tags !== undefined)
            suite.tags = patch.tags;
        if (patch.language !== undefined)
            suite.language = patch.language;
        if (patch.includeProtocols !== undefined)
            suite.includeProtocols = patch.includeProtocols;
        saveToLocal();
    }
    // --- Need Editing (Mocks) ---
    async updateNeedDraft(lineageId, version, patch) {
        const root = this.findNeed(lineageId) || needs[lineageId];
        if (!root) {
            console.warn("Need not found in mock store, skipping local update:", lineageId);
            return;
        }
        // mock.ts stores Need, not NeedRelease/NeedRoot, so we mutate root directly for local demo.
        if (patch.title !== undefined)
            root.title = patch.title;
        if (patch.description !== undefined)
            root.description = patch.description;
        if (patch.purpose !== undefined)
            root.purpose = patch.purpose;
        // ignoring tags/language for mock as it doesn't strictly hold them on the base Need type.
    }
    async promoteNeedVersion(lineageId, version, toStage, changeDescription) {
        // Do nothing for mock adapter
    }
    // --- Protocol Editing (Mocks) ---
    async updateProtocolDraft(lineageId, version, patch) {
        const proto = this.findProtocol(lineageId) || protocols[lineageId];
        if (!proto) {
            console.warn("Protocol not found in mock store, skipping local update:", lineageId);
            return;
        }
        if (patch.title !== undefined)
            proto.title = patch.title;
        if (patch.summary !== undefined)
            proto.summary = patch.summary;
        if (patch.body !== undefined)
            proto.body = patch.body;
        // Also mutate the protocolReleases dictionary so `getRelease` reads the new payload
        const bucket = protocolReleases[lineageId];
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
                if (patch.body !== undefined)
                    release.protocolBody = patch.body;
                if (patch.title !== undefined)
                    release.title = patch.title;
                if (patch.summary !== undefined)
                    release.summary = patch.summary;
                if (patch.tags !== undefined)
                    release.tags = patch.tags;
                if (patch.language !== undefined)
                    release.language = patch.language;
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
                if (patch.title !== undefined)
                    newPv.content.title = patch.title;
                if (patch.summary !== undefined)
                    newPv.content.summary = patch.summary;
                if (patch.body !== undefined)
                    newPv.content.body = patch.body;
                // Keep the Release bucket in sync with the new CID
                if (bucket && bucket.releases[version]) {
                    bucket.releases[version].cid = newCid;
                }
            }
        }
    }
    async promoteany(lineageId, version, toStage, changeDescription) {
        // Do nothing for mock adapter
    }
}
// Singleton export
const rawAdapter = new MockAdapter();
// Intercept all write methods dynamically and force a local serialization so the array footprints survive Vite's reload cycles
export const mockRepo = new Proxy(rawAdapter, {
    get(target, prop, receiver) {
        const origMethod = target[prop];
        if (typeof origMethod === 'function') {
            return function (...args) {
                const res = origMethod.apply(target, args);
                if (res instanceof Promise) {
                    return res.then(val => {
                        if (["createNeed", "createProtocol", "linkProtocolServesNeed", "addProtocolToSuite",
                            "publishany", "updateNeedDraft", "updateProtocolDraft", "promoteany",
                            "promoteProtocolVersion", "promoteNeedVersion", "follow", "unfollow",
                            "adopt", "unadopt"].includes(prop.toString())) {
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
