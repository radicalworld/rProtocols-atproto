import type {
    SectionId, NeedId, SuiteId, ProtocolId,
    Need, NeedNode, Suite, Protocol, Mark, MarkVerb
} from "./types";


// ---------- READ PORT ----------
export interface RPReadPort {
    listSections(): Promise<{ id: SectionId; title: string; intro: string }[]>;
    getNeedsBySection(section: SectionId): Promise<Need[]>;
    getNeedTree(needId: NeedId): Promise<NeedNode>;
    getNeedByLineageId?(lineageId: string): Promise<Need | null>;
    getNeedByVersion?(lineageId: string, version: string): Promise<Need | null>;
    getSuitesForNeed(needId: NeedId): Promise<Suite[]>;
    getProtocolsForNeed(needId: NeedId): Promise<Protocol[]>;
    getSuiteProtocols(suiteId: SuiteId): Promise<Protocol[]>;
    getMarks(verb: MarkVerb): Promise<Mark[]>;
    // Lookups for full views + resolvers (prep for slug/version/CID)
    getProtocol(id: string): Promise<Protocol | null>;
    getProtocols(): Promise<Protocol[]>;
    getSuite(id: string): Promise<Suite | null>;
    getSuiteWithActiveMerge(id: SuiteId): Promise<Suite | null>;
    // New resolvers
    resolveProtocolSlug(slug: string): Promise<{ lineageId: string; preferredSlug: string } | null>;
    getProtocolBySlug(slug: string): Promise<Protocol | null>;               
    getProtocolByVersion(slug: string, version: string): Promise<Protocol | null>;
    getProtocolByCid(cid: string): Promise<Protocol | null>;
}

// ---------- WRITE PORT ----------
export interface RPWritePort {
    follow(subjectId: string, kind: "need" | "protocol" | "suite"): Promise<void>;
    unfollow(subjectId: string, kind: "need" | "protocol" | "suite"): Promise<void>;
    adopt(subjectId: string, kind: "need" | "protocol" | "suite", context?: string): Promise<void>;
    unadopt?(subjectId: string, kind: "need" | "protocol" | "suite"): Promise<void>;
    createNeed(payload: Pick<Need, "title" | "description" | "parentLineageId" | "purpose" | "language" | "tags"> & { forkFrom?: string }): Promise<NeedId>;
    createProtocol(payload: Pick<Protocol, "title" | "summary" | "body" | "tags" | "language"> & { forkFrom?: string }): Promise<ProtocolId>;
    linkProtocolServesNeed(protocolId: ProtocolId, needId: NeedId): Promise<void>;
    addProtocolToSuite(protocolId: ProtocolId, suiteId: SuiteId): Promise<void>;
    // Publishing (stubs for now)
    createProtocolRoot?(payload: { lineageId: string, slug: string }): Promise<void>;
    publishProtocolVersion?(v: Protocol): Promise<Protocol>;
    renameProtocolSlug?(lineageId: string, newSlug: string): Promise<void>;
    createSuite(payload: Pick<Suite, "title" | "purpose" | "tags" | "language" | "includeProtocols"> & { parentNeedLineageId?: string, forkFrom?: string }): Promise<SuiteId>;
    updateSuiteDraft(lineageId: string, version: string, patch: any): Promise<void>;

    // Need Editing & Publishing
    updateNeedDraft(lineageId: string, version: string, patch: any): Promise<void>;
    promoteNeedVersion(lineageId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string): Promise<void>;

    // Protocol Editing & Publishing
    updateProtocolDraft(lineageId: string, version: string, patch: any): Promise<void>;
    promoteProtocolVersion(lineageId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string): Promise<void>;
    promoteSuiteVersion(lineageId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string): Promise<void>;
}

// ---------- REPOSITORY (combined) ----------
export interface RPRepository extends RPReadPort, RPWritePort {}