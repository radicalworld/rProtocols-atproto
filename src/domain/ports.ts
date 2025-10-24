import type {
    SectionId, NeedId, SuiteId, ProtocolId,
    Need, NeedNode, Suite, Protocol, Mark, MarkVerb
} from "./types";
import type { ProtocolRoot, ProtocolVersion } from "./types";

// ---------- READ PORT ----------
export interface RPReadPort {
    listSections(): Promise<{ id: SectionId; title: string; intro: string }[]>;
    getNeedsBySection(section: SectionId): Promise<Need[]>;
    getNeedTree(needId: NeedId): Promise<NeedNode>;
    getSuitesForNeed(needId: NeedId): Promise<Suite[]>;
    getProtocolsForNeed(needId: NeedId): Promise<Protocol[]>;
    getSuiteProtocols(suiteId: SuiteId): Promise<Protocol[]>;
    getMarks(verb: MarkVerb): Promise<Mark[]>;
    // Lookups for full views + resolvers (prep for slug/version/CID)
    getProtocol(id: string): Promise<Protocol | null>;
    getSuite(id: string): Promise<Suite | null>;
    // New resolvers (non-breaking; optional in adapters)
    resolveProtocolSlug(slug: string): Promise<{ root: ProtocolRoot; preferredSlug: string } | null>;
    getProtocolBySlug(slug: string): Promise<Protocol | null>;                // latest
    getProtocolByVersion(slug: string, version: string): Promise<Protocol | null>;
    getProtocolByCid(cid: string): Promise<Protocol | null>;
}

// ---------- WRITE PORT ----------
export interface RPWritePort {
    follow(subjectId: string): Promise<void>;
    unfollow(subjectId: string): Promise<void>;
    adopt(subjectId: string, context?: string): Promise<void>;
    unadopt?(subjectId: string): Promise<void>;
    createNeed(payload: Pick<Need, "title" | "description" | "parentId">): Promise<NeedId>;
    createProtocol(payload: Pick<Protocol, "title" | "summary" | "body">): Promise<ProtocolId>;
    linkProtocolServesNeed(protocolId: ProtocolId, needId: NeedId): Promise<void>;
    addProtocolToSuite(protocolId: ProtocolId, suiteId: SuiteId): Promise<void>;
    // Publishing (stubs for now)
    createProtocolRoot?(root: ProtocolRoot): Promise<ProtocolRoot>;
    publishProtocolVersion?(v: ProtocolVersion): Promise<ProtocolVersion>;
    renameProtocolSlug?(rootId: string, newSlug: string): Promise<void>;
}

// ---------- REPOSITORY (combined) ----------
export interface RPRepository extends RPReadPort, RPWritePort {}