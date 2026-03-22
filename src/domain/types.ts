// ==============================
// Core Section IDs
// ==============================
export type SectionId = "collaboration" | "work" | "website";

// ==============================
// Primitives for V1
// ==============================
export type StrongRef = {
    uri: string;
    cid: string;
};

export type Lineage = {
    id: string; // opaque mapping (rp_nd_..., rp_pt_...)
    root: StrongRef;
    prev?: StrongRef;
    forkedFrom?: StrongRef;
};

// ==============================
// Entity IDs
// ==============================
export type NeedId = string;             
export type SuiteId = string;             
export type ProtocolId = string;          
export type ProtocolRootId = string;      

// ==============================
// Versions & Stages (GLOBAL)
// ==============================
export type VersionString = string; // e.g. "1.0.0"
export type Stage = "draft" | "candidate" | "stable" | "deprecated";

export type VersionRange = {
  minInclusive?: VersionString;
  maxExclusive?: VersionString;
};

// ==============================
// V1 ATProto Record Types (Raw JSON Shapes)
// ==============================
export interface NeedRecord {
    $type: "org.rp.need";
    foundationRef?: StrongRef;
    family?: {
        id: string;
        origin: StrongRef;
    };
    lineage: Lineage;
    slug: string;
    version: VersionString;
    stage: Stage;
    release?: {
        kind: "genesis" | "update" | "fork";
        bump: "major" | "minor" | "patch";
        version?: string;
        stage?: string;
    };
    familyEvent?: {
        type: "candidate-major-fork";
        status: "pending";
    };
    createdAt: string;
    language: string;
    authorship: { authorDid: string };

    context?: string;
    title?: string;
    question?: string;
    description?: string;
    purpose?: string;

    relations?: {
        parent?: StrongRef;
        children?: StrongRef[];
        suites?: StrongRef[];
        relatedProtocols?: StrongRef[];
    };

    tags?: string[];
    metadata?: { shortUrl?: string; qrCode?: string };
    lifecycle?: { deprecatedAt?: string; archived?: boolean };
}

export interface ProtocolRecord {
    $type: "org.rp.protocol";
    foundationRef?: StrongRef;
    family?: {
        id: string;
        origin: StrongRef;
    };
    lineage: Lineage;
    slug: string;
    version: VersionString;
    stage: Stage;
    release?: {
        kind: "genesis" | "update" | "fork";
        bump: "major" | "minor" | "patch";
        version?: string;
        stage?: string;
    };
    familyEvent?: {
        type: "candidate-major-fork";
        status: "pending";
    };
    createdAt: string;
    language: string;
    authorship: { authorDid: string };

    needRef: StrongRef;
    title: string;
    summary?: string;
    protocolBody?: string;
    purpose?: string;

    scope?: {
        appliesTo?: string[];
        region?: { level: string };
    };

    relations?: {
        suites?: StrongRef[];
        relatedProtocols?: StrongRef[];
    };

    tags?: string[];
    metadata?: { shortUrl?: string; qrCode?: string };
    lifecycle?: { deprecatedAt?: string; archived?: boolean };
}

export interface SuiteRecord {
    $type: "org.rp.suite";
    foundationRef?: StrongRef;
    family?: {
        id: string;
        origin: StrongRef;
    };
    lineage: Lineage;
    slug: string;
    version: VersionString;
    stage: Stage;
    release?: {
        kind: "genesis" | "update" | "fork";
        bump: "major" | "minor" | "patch";
        version?: string;
        stage?: string;
    };
    familyEvent?: {
        type: "candidate-major-fork";
        status: "pending";
    };
    createdAt: string;
    language: string;
    authorship: { authorDid: string };

    title: string;
    description?: string;
    purpose?: string;

    members?: {
        needs?: StrongRef[];
        protocols?: StrongRef[];
        suites?: StrongRef[];
    };

    tags?: string[];
    metadata?: { shortUrl?: string; qrCode?: string };
    lifecycle?: { deprecatedAt?: string; archived?: boolean };
}

export interface MarkRecord {
    $type: "org.rp.mark";
    verb: "follow" | "adopt";
    status: "active" | "paused" | "ended";
    
    subject: {
        kind: "need" | "protocol" | "suite";
        familyId?: string;
        lineageId?: string;
        versionRef?: StrongRef;
        pinMode: "exact" | "floating-lineage-stable" | "floating-family-stable";
    };

    context?: string;
    createdAt: string;
    updatedAt?: string;
}

// ==============================
// UI Domain Models (Aggregated / Processed)
// ==============================

// Canonical Need (Life Need) (CID'ed content)
export interface Need {
    id: string; // SQLite URI or mock ID
    foundationRef?: StrongRef;
    family?: {
        id: string;
        origin: StrongRef;
    };
    lineageId: string; // The opaque rp_nd_id
    slug: string;      // The human readable string
    
    version?: string;
    stage?: "draft" | "candidate" | "stable" | "deprecated";

    release?: {
        kind: "genesis" | "update" | "fork";
        bump: "major" | "minor" | "patch";
        version?: string;
        stage?: string;
        summary?: string;
        [key: string]: any;
    };
    familyEvent?: {
        type: "candidate-major-fork";
        status: "pending";
    };

    title: string;     // Mapped from context
    description?: string;
    purpose?: string;

    language: string;
    tags?: string[];

    // Relations mapped by AppView to strings for easy React rendering
    parentLineageId: string | null;
    childLineageIds: string[];
    suiteLineageIds: string[];
    relatedProtocolLineageIds?: string[];

    shortUrl?: string;
    qrCode?: string;

    followEnabled?: boolean;
    followCount?: number;
    adoptCount?: number;
}

export interface NeedRelease {
    id: string;                  // uri
    version: VersionString;      
    stage: Stage;                
    date: string;                
    language: string;

    did?: string;
    cid?: string;
    prevCid?: string;
    
    lineageId: string;           
    slug: string;

    purpose: string;
    question: string;            
    description?: string;

    tags?: string[];
    suiteLineageIds?: string[];
    relatedProtocols?: string[]; 

    followEnabled?: boolean;
    followCount?: number;

    shortUrl?: string;
    qrCode?: string;

    attribution?: { name: string; did: string }[];
    history?: { version: VersionString; date: string; note: string }[];
    changeDescription?: string;

    parentLineageId: string | null;
    childLineageIds: string[];

    endOfLifeAt?: string;
    archived?: boolean;
}

export interface Suite {
  id: string;
  foundationRef?: StrongRef;
  family?: {
      id: string;
      origin: StrongRef;
  };
  lineageId: SuiteId;
  slug: string;
  version?: string;
  stage?: "draft" | "candidate" | "stable" | "deprecated";

  release?: {
      kind: "genesis" | "update" | "fork";
      bump: "major" | "minor" | "patch";
      version?: string;
      stage?: string;
      summary?: string;
      [key: string]: any;
  };
  familyEvent?: {
      type: "candidate-major-fork";
      status: "pending";
  };
  
  title: string;
  description?: string;
  language: string;

  tags?: string[];
  purpose?: string;

  includeNeeds?: Array<{ lineageId: string }>;
  includeProtocols?: Array<{ lineageId: string }>;
  
  shortUrl?: string;
  qrCode?: string;
  followEnabled?: boolean;               
  followCount?: number;
  adoptCount?: number;
}

export interface Protocol {
  id: string; // the uri
  foundationRef?: StrongRef;
  family?: {
      id: string;
      origin: StrongRef;
  };
  lineageId: ProtocolRootId;
  slug: string;
  version?: string;
  stage?: "draft" | "candidate" | "stable" | "deprecated";

  release?: {
      kind: "genesis" | "update" | "fork";
      bump: "major" | "minor" | "patch";
      version?: string;
      stage?: string;
      summary?: string;
      [key: string]: any;
  };
  familyEvent?: {
      type: "candidate-major-fork";
      status: "pending";
  };
  
  title: string;
  summary?: string;
  body?: string;
  tags?: string[];
  language?: string;

  followCount?: number;
  adoptCount?: number;
}

export interface ProtocolRelease {
  id: string;
  version: VersionString;
  stage: Stage;                       
  date: string;                       
  language: string;

  did?: string;
  cid?: string;
  prevCid?: string;
  closing?: string;
  
  lineageId: string;
  slug: string;
  needLineageId?: string;                

  purpose: string;
  scope?: any;

  tags?: string[];
  suiteLineageIds?: string[];
  relatedProtocols?: string[];

  followEnabled?: boolean;
  adoptEnabled?: boolean;
  followCount?: number;
  adoptCount?: number;

  shortUrl?: string;
  qrCode?: string;

  attribution?: { name: string; did: string }[];
  history?: { version: VersionString; date: string; note: string }[];
  changeDescription?: string;

  protocolBody: string;               
  title?: string;                     
  summary?: string;                   

  endOfLifeAt?: string;
  archived?: boolean;
}

// ==============================
// Marks with actor
// ==============================
export type MarkVerb = "follow" | "adopt";
export type MarkStatus = "active" | "paused" | "ended";
export type SubjectKind = "need" | "suite" | "protocol";

export type Mark = {
  id: string;
  verb: MarkVerb;
  subjectKind: SubjectKind;
  subjectLineageId: string; 
  subjectVersion?: VersionString;    
  status: MarkStatus;
  actorDid: string;                  
  context?: string;
  createdAt: string;                 
  updatedAt?: string;                
};

// ==============================
// Tree rendering (release-level)
// ==============================
export type NeedNode = NeedRelease & {
  children: NeedRelease[];
};

// ==============================
// Global version helpers
// ==============================
export function parseVersion(v: VersionString): [number, number, number] {
  const parts = v.split(".").map((n) => parseInt(n, 10));
  if (parts.length < 2) throw new Error(`Bad version: ${v}`);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

export function cmpVersion(a: VersionString, b: VersionString): -1 | 0 | 1 {
  const [am, an, ap] = parseVersion(a);
  const [bm, bn, bp] = parseVersion(b);
  if (am !== bm) return am < bm ? -1 : 1;
  if (an !== bn) return an < bn ? -1 : an > bn ? 1 : 0;
  if (ap !== bp) return ap < bp ? -1 : ap > bp ? 1 : 0;
  return 0;
}

export function inRange(v: VersionString, r?: VersionRange): boolean {
  if (!r) return true;
  if (r.minInclusive && cmpVersion(v, r.minInclusive) === -1) return false;   // v < minInclusive
  if (r.maxExclusive && cmpVersion(v, r.maxExclusive) !== -1) return false;   // !(v < maxExclusive)
  return true;
}

// Bumping helpers (global policy)
export function nextMinor(v: VersionString): VersionString {
  const [maj, min] = parseVersion(v);
  return `${maj}.${min + 1}.0` as VersionString;
}
export function nextMajor(v: VersionString): VersionString {
  const [maj] = parseVersion(v);
  return `${maj + 1}.0.0` as VersionString;
}

export function firstDraft(): VersionString { return "0.1.0"; }
export function promoteCandidateToStable(): VersionString { return "1.0.0"; }

export function bumpStableMinor(current: VersionString): VersionString {
  return nextMinor(current);
}
export function bumpStableMajor(current: VersionString): VersionString {
  return nextMajor(current);
}