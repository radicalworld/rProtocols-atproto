// ==============================
// Core Section IDs
// ==============================
export type SectionId = "root" | "work" | "website";

// ==============================
// Entity IDs
// ==============================
export type NeedId = string;              // usually the Need rootId (public)
export type SuiteId = string;             // suite root/public id
export type ProtocolId = string;          // protocol release/public id (legacy)
export type ProtocolRootId = string;      // stable protocol root id
export type ProtocolVersionId = string;   // optional record id if needed later

// ==============================
// Versions & Stages (GLOBAL)
// ==============================
export type VersionString = `${number}.${number}`; // major.minor
export type Stage = "draft" | "candidate" | "stable" | "deprecated";

// Global version ranges (inclusive lower, exclusive upper)
export type VersionRange = {
  minInclusive?: VersionString;  // e.g., "1.0"
  maxExclusive?: VersionString;  // e.g., "2.0"
};

// ==============================
// Canonical Need (Life Need) (CID'ed content)
// ==============================
export interface Need {
    /** human-readable stable id across versions (URL-friendly) */
    rootId: string;                     // e.g., "root-open-protocols"

    /** question form */
    title: string;

    /** optional framing */
    description?: string;
    purpose?: string;

    /** language & attributes */
    language: string;                   // "en"
    tags?: string[];                    // UI: comma-separated, store as array

    /** Relations */
    parentRootId: string | null;
    childRootIds: string[];             // children by rootId
    suiteIds: string[];                 // suites that include this need (by suite publicId)
    relatedProtocolIds?: string[];      // protocols directly related to this need

    /** Connectivity */
    shortUrl?: string;
    qrCode?: string;

    /** Social (Needs are follow-only) */
    followEnabled?: boolean;                // default true
    followCount?: number;                   // engagement indicator
}

export interface NeedRoot {                 // Anchor for the need - holds the lineage of all versions and social signals
    // Stable identity
    rootId: string;                         // Public, URL-friendly, immutable
    did: string;                            // resource DID, crypto DID for verification

    // Canonical pointers
    latestVersion: VersionString;           // newest across all stages
    latestCid: string;                      // CID for latestVersion
    publishedVersion?: VersionString;       // version shown at /needs/:rootId
    publishedCid?: string;                  // CID for publishedVersion

    // Fast local index of all versions
    versions: Record<
        VersionString,
        {
            cid: string;
            stage: Stage;                   // required for clarity
            date: string;                   // YYYY-MM-DD (for lists/sorts)
        }
    >;

    // Optional convenience for UI speed (materialized at write time)
    latestDraftVersion?: VersionString;
    hasUnpublishedChanges?: boolean;        // latestVersion !== publishedVersion
    // stageCounts?: { draft: number; candidate: number; stable: number; deprecated: number };

    // Social (Needs are follow-only)
    followEnabled: boolean;
    followCount: number;

    // Lifecycle / deprecation
    isDeprecated?: boolean;
    successorRootId?: string;               // if deprecated, redirect target
    deprecatedAt?: string;

    // Ops
    updatedAt?: string;
}

export type NeedVersion = {
    rootId: string;                         // public, stable (URL-friendly)
    parentId: string;                       // Need.rootId
    version: VersionString;                 // "0.1", "1.0", "1.1"
    stage?: Stage;                          // unified
    date: string;                           // ISO YYYY-MM-DD for display.
    
    hash: string;                           // canonical content hash (CID/sha256) of the normalized attributes.
    cid: string;                            // content address of canonical Need JSON
  
    content: Need;                          // canonical JSON
    prevCid?: string;                       // lineage pointer
    createdAt?: string;                     // ISO datetime
    authorDid?: string;
    signature?: string;                     // signature over (cid, parentId, version)
  
    notes?: string;                         // short release notes/rationale
    breaking?: boolean;                     // major change to scope/intent
};

export interface NeedRelease {
    id: string;                             // db id for this release record
  version: VersionString;             // "1.0", "1.1"
  stage: Stage;                       // unified
  date: string;                       // ISO (YYYY-MM-DD)
  language: string;

  // --- Identity & Lineage ---
  did?: string;
  cid?: string;                       // NeedVersion.cid
  prevCid?: string;                   // lineage pointer
  needRootId: string;                 // == Need.rootId

  // --- Purpose ---
  purpose: string;

  // --- Relations ---
  tags?: string[];
  suiteIds?: string[];
  relatedProtocols?: string[];        // UI alias to relatedProtocolIds

  // --- Social (Follow only) ---
  followEnabled?: boolean;
  followCount?: number;

  // --- Connectivity ---
  shortUrl?: string;
  qrCode?: string;

  // --- Trust & Attribution ---
  attribution?: { name: string; did: string }[];
  history?: { version: VersionString; date: string; note: string }[];
  changeDescription?: string;

  // --- Content snapshot ---
  question: string;                   // mirrors Need.title
  description?: string;
  parentRootId: string | null;
  childRootIds: string[];

  // Optional end-of-life nuance
    endOfLifeAt?: string;                               // ISO datetime
    archived?: boolean;                                 // subset of deprecated if you need it
}

// ==============================
// Suites (canonical, CIDed content)
// ==============================
export type NeedRef =
  | { rootId: NeedId; version?: VersionString }           // exact pin
  | { rootId: NeedId; range: VersionRange };              // compatible set

export type ProtocolRef =
  | { rootId: ProtocolRootId; version?: VersionString }
  | { rootId: ProtocolRootId; range: VersionRange };

export type SuiteRef =
  | { rootId: SuiteId; version?: VersionString }
  | { rootId: SuiteId; range: VersionRange };

export interface Suite {
  /** human-readable stable id across versions (URL-friendly) */
  rootId: SuiteId;                       // e.g., "suite-root-protocols"

  /** identity */
  title: string;
  description?: string;
  language: string;                      // "en"

  /** attributes */
  tags?: string[];
  purpose?: string;

  /** selection rules (resolved at release time) */
  includeNeeds?: NeedRef[];
  includeProtocols?: ProtocolRef[];
  includeSuites?: SuiteRef[];            // allow nesting if desired

  /** optional scope parity */
  scope?: {
    appliesTo?: string[];
    region?: { level: "global" | "country" | "state" | "city"; code?: string; name?: string };
  };

  /** connectivity & social */
  shortUrl?: string;
  qrCode?: string;
  followEnabled?: boolean;               // default true
  followCount?: number;
}

export type SuiteVersion = {
  parentId: SuiteId;                     // Suite.rootId
  version: VersionString;                // "0.1", "1.0"
  cid: string;                           // content address of canonical Suite JSON
  content: Suite;                        // canonical JSON
  prevCid?: string;                      // lineage pointer
  createdAt?: string;                    // ISO datetime
  authorDid?: string;
  signature?: string;                    // signature over (cid, parentId, version)
  stage?: Stage;                         // unified
  notes?: string;                        // short release notes / rationale
  breaking?: boolean;                    // major change to scope/intent
};

export interface SuiteRelease {
  /** release identity */
  id: string;                            // db id
  suiteRootId: SuiteId;                  // == Suite.rootId
  version: VersionString;                // "1.0"
  stage: Stage;                          // unified
  date: string;                          // ISO (YYYY-MM-DD)
  language: string;

  // lineage
  did?: string;
  cid?: string;                          // SuiteVersion.cid
  prevCid?: string;

  // content snapshot (resolved from include* rules at publish time)
  title: string;
  description?: string;
  purpose?: string;
  tags?: string[];
  scope?: Suite["scope"];

  // authoritative, immutable snapshot members
  needMembers: Array<{ rootId: NeedId; version: VersionString }>;
  protocolMembers: Array<{ rootId: ProtocolRootId; version: VersionString }>;
  suiteMembers?: Array<{ rootId: SuiteId; version: VersionString }>;

  // connectivity & social
  shortUrl?: string;
  qrCode?: string;
  followEnabled?: boolean;
  followCount?: number;

  // trust & attribution
  attribution?: { name: string; did: string }[];
  history?: { version: VersionString; date: string; note: string }[];
  changeDescription?: string;

  // optional end-of-life nuance
  endOfLifeAt?: string;                  // ISO datetime
  archived?: boolean;                    // subset of deprecated, if needed
}

export interface SuiteHead {
  rootId: SuiteId;                       // public, stable
  did: string;                           // crypto DID
  currentVersion: VersionString;         // latest stable (e.g., "1.2")
  latestDraftVersion?: VersionString;    // if draft exists (e.g., "0.4")
  status: Stage;                         // typically "stable" | "deprecated"
  versions: Record<VersionString, { cid: string; stage?: Stage }>;
  successorId?: SuiteId;                 // if deprecated, where to redirect
}

// ==============================
// Protocols (aligned, two-part versions)
// ==============================
export type Protocol = {
  id: ProtocolId;
  title: string;
  summary?: string;
  body?: string;                      // optional in mock; full page later
};

export type ProtocolRoot = {
  id: ProtocolRootId;                 // stable id (not the slug)
  slug: string;                       // public, SEO-friendly
  aliases?: string[];                 // older slugs
  latestCid?: string;
  latestVersion?: VersionString;      // align to major.minor
  createdAt?: string;
  updatedAt?: string;
};

export type ProtocolVersion = {
  parentId: ProtocolRootId;           // points to the root
  version: VersionString;             // "0.1", "1.2"
  cid: string;                        // content-addressed id of canonical JSON
  content: Protocol;                  // canonical payload
  prevCid?: string;                   // lineage
  createdAt?: string;
  authorDid?: string;
  signature?: string;
  stage?: Stage;                      // unified
  notes?: string;                     // short release notes / rationale
  breaking?: boolean;                 // highlight breaking change
};

// Rich Protocol release record
export interface ProtocolRelease {
  id: string;
  version: VersionString;
  stage: Stage;                       // unified
  date: string;                       // ISO (YYYY-MM-DD)
  language: string;

  // --- Identity & Lineage ---
  did?: string;
  cid?: string;
  prevCid?: string;
  needRootId?: string;                // standardized name

  // --- Purpose & Scope ---
  purpose: string;
  scope?: {
    appliesTo?: string[];
    region?: { level: "global" | "country" | "state" | "city"; code?: string; name?: string };
  };

  // --- Relations ---
  tags?: string[];
  suiteIds?: string[];
  relatedProtocols?: string[];

  // --- Social Signals ---
  followEnabled?: boolean;
  adoptEnabled?: boolean;
  followCount?: number;
  adoptCount?: number;

  // --- Connectivity ---
  shortUrl?: string;
  qrCode?: string;

  // --- Trust & Attribution ---
  attribution?: { name: string; did: string }[];
  history?: { version: VersionString; date: string; note: string }[];
  changeDescription?: string;

  // --- Content ---
  protocolBody: string;               // Markdown (≤ 1024 chars recommended)

  // Optional end-of-life nuance
  endOfLifeAt?: string;
  archived?: boolean;
}

export interface ProtocolHead {
  rootId: ProtocolRootId;
  did: string;
  currentVersion: VersionString;
  latestDraftVersion?: VersionString;
  status: Stage;
  versions: Record<VersionString, { cid: string; stage?: Stage }>;
  successorId?: ProtocolRootId;
}
    
// ==============================
// Marks (follow/adopt) with actor
// ==============================
export type MarkVerb = "follow" | "adopt";
export type MarkStatus = "active" | "paused" | "ended";
export type SubjectKind = "need" | "suite" | "protocol";


export type Mark = {
  id: string;
  verb: MarkVerb;
  subjectKind: SubjectKind;
  subjectRootId: NeedId | SuiteId | ProtocolRootId; // stable id
  subjectVersion?: VersionString;    // optional, if marking a particular release
  status: MarkStatus;
  actorDid: string;                  // who followed/adopted
  context?: string;
  createdAt: string;                 // ISO
  updatedAt?: string;                // ISO
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
export function parseVersion(v: VersionString): [number, number] {
  const [maj, min] = v.split(".").map((n) => parseInt(n, 10));
  if (Number.isNaN(maj) || Number.isNaN(min)) throw new Error(`Bad version: ${v}`);
  return [maj, min];
}

export function cmpVersion(a: VersionString, b: VersionString): -1 | 0 | 1 {
  const [am, an] = parseVersion(a);
  const [bm, bn] = parseVersion(b);
  if (am !== bm) return am < bm ? -1 : 1;
  if (an !== bn) return an < bn ? -1 : an > bn ? 1 : 0;
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
  return `${maj}.${min + 1}` as VersionString;
}
export function nextMajor(v: VersionString): VersionString {
  const [maj] = parseVersion(v);
  return `${maj + 1}.0` as VersionString;
}

// Pre-stable workflow helpers
export function firstDraft(): VersionString { return "0.1"; }
// Stage flips handle draft ↔ candidate; number stays on 0.x during pre-stable
export function promoteCandidateToStable(): VersionString { return "1.0"; }

// Post-stable workflow helpers
export function bumpStableMinor(current: VersionString): VersionString {
  // requires current >= 1.0
  return nextMinor(current);
}
export function bumpStableMajor(current: VersionString): VersionString {
  return nextMajor(current);
}