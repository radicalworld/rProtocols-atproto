# `org.rp.v1.4` Specification

The **rProtocols V1 Schema** defines a lineage-based data model for collaboratively creating, evolving, and adopting Needs, Protocols, Suites, and Marks across the ATProto network.

Each record represents an **immutable version within a lineage**, while related lineages are grouped into a family representing the full evolution of a protocol across forks.

Records are stored in ATProto repositories and inherit:
* Authenticity via DIDs
* Integrity via CIDs (DAG-CBOR)
* Addressability via AT URIs

## 1. Core Model

### 1.1 Atomic Records Types

* `org.rp.need` — A statement of a problem or opportunity that requires a solution.
* `org.rp.protocol` — A specification for how to solve a specific need.
* `org.rp.suite` — A collection of related protocols.
* `org.rp.mark` — A record of an adoption or endorsement of a protocol.

Each record:

* is immutable
* represents a single version
* participates in a lineage graph
* belongs to a family of related lineages

### 1.2 Design Foundations

1. **Immutability**
   * A version MUST NOT be edited, overwritten, or mutated in the repository—even during draft phases.
   * Any modification of a record MUST result in a semantic version increment and a distinct new record.

2. **Lineage over mutation**
   * Evolution occurs through new versions linked by prev.

3. **Family over fragmentation**
   * Forks create new lineages but remain connected through a shared family.

4. **Strong references**
   * All lineage edges use { uri, cid }.

5. **Separated identity layers**
   * Family → global evolution
   * Lineage → branch evolution
   * Slug → human-readable reference

6. **Decentralized authorship**
   * Any DID can create a new lineage.
   * Any DID can fork an existing lineage.
   * Any DID can create a mark.
   * Participants may fork without coordination.

7. **Network-resolved family ordering**
   * Family-wide version ordering is computed by AppViews, not authored directly.

## 2. Core Primitives

### 2.1 Strong Reference

```ts

type StrongRef = {
    uri: string, // at://did/.../collection/rkey
    cid: string  // bafy...
}
```

### 2.2 Family Object

```ts

family: {
    id: string,
    origin: StrongRef
}
```

**Constraints**
* MUST be globally unique
* MUST remain stable across all descendants
* MUST be preserved across forks
* origin MUST reference the first published version in the family

### 2.3 Lineage Object

```ts

lineage: {
    id: string, // typed opaque ID
    root: StrongRef,     // first record in lineage
    prev?: StrongRef,    // immediate predecessor
    forkedFrom?: StrongRef // only present if this lineage was forked
}
```

**Constraints**
* Identifies a single branch
* Versions MUST increase monotonically within a lineage
* Forking creates a new lineage
* forkedFrom MUST reference the source version


### 2.4 ID Formats

```txt

Family   rp_fm_<opaqueId>
Need     rp_nd_<opaqueId>
Protocol rp_pt_<opaqueId>
Suite    rp_st_<opaqueId>
Mark     rp_mk_<opaqueId>
```

### 2.4 Foundation Reference

A Foundation Reference links a record to a Suite that provides foundational orientation for how the record is understood and engaged with.

```ts

foundationRef?: StrongRef
```

**Semantics**
* foundationRef points to a Suite that expresses the foundational proto-protocol context of the record.
* It makes visible the interpretive ground within which the record is being created and held.
* It does not enforce behavior.
* It provides orientation.
* It may be retained, replaced, or removed in later versions or forks.

**Constraints**
* If present, foundationRef MUST reference an org.rp.suite record.
* The referenced Suite SHOULD contain proto-protocols, foundational protocols, or other orienting records.
* Records MUST remain valid if foundationRef is omitted.

**Client Guidance**
* Clients SHOULD prepopulate new Needs, Protocols, and Suites with a default foundationRef.
* The default foundation MAY be determined by the client, workspace, community, or participant context.
* Clients SHOULD make the presence of the foundation visible at creation time.
* Clients SHOULD allow the foundation to be viewed, replaced, forked, or removed without blocking creation.

## 3. Atomic Structure

### 3.1 Need (`org.rp.need`)

```ts
{
    $type: "org.rp.need",

    foundationRef?: StrongRef,

    family: {
        id: "rp_fm_01JQ...",
        origin: StrongRef
    },

    lineage: {
        id: "rp_nd_01JQ...",
        root: StrongRef,
        prev: StrongRef,
        forkedFrom?: StrongRef
    },

    slug: "open-protocols",

    version: "1.0.0",
    stage: "stable",

    release: {
        kind: "genesis" | "update" | "fork",
        bump: "major" | "minor" | "patch"
    },

    familyEvent?: {
        type: "candidate-major-fork",
        status: "pending"
    },

    createdAt: "2026-03-16T18:42:11Z",
    language: "en",

    authorship: {
        authorDid: "did:plc:abc123..."
    },

    title: "Open Protocols",
    summary: "The internet lacks a native layer...",

    relations: {
        parent?: StrongRef,
        children?: StrongRef[],
        suites?: StrongRef[],
        relatedProtocols?: StrongRef[]
    },

    tags: ["coordination", "standards"],

    metadata: {
        shortUrl?: string,
        qrCode?: string
    },

    lifecycle: {
        deprecatedAt?: string,
        archived?: boolean
    }
}
```

### 3.2 Protocol (`org.rp.protocol`)

```ts
{
    $type: "org.rp.protocol",

    foundationRef?: StrongRef,

    family: {
        id: "rp_fm_01JQ...",
        origin: StrongRef
    },

    lineage: {
        id: "rp_pt_02AB...",
        root: StrongRef,
        prev?: StrongRef,
        forkedFrom?: StrongRef
    },

    slug: "protocol-creation",

    version: "1.2.1",
    stage: "stable",

    createdAt: "2026-04-01T18:42:11Z",
    language: "en",

    authorship: {
        authorDid: "did:plc:abc123..."
    },

    needRef: {
        uri: "at://did:.../org.rp.need/...",
        cid: "..."
    },

    title: "Protocol Creation",
    summary: "A mechanism for drafting and publishing standards.",
    protocolBody: "...",

    scope?: {
        appliesTo?: string[],
        region?: { level: "global" | "local" }
    },

    relations: {
        suites?: StrongRef[],
        relatedProtocols?: StrongRef[]
    },

    tags: ["governance", "authoring"],

    metadata: {
        shortUrl?: string,
        qrCode?: string
    },

    lifecycle: {
        deprecatedAt?: string,
        archived?: boolean
    }
}
```

### 3.3 Suite (`org.rp.suite`)

**Suites represent immutable snapshots of coordinated sets.**

```ts
{
    $type: "org.rp.suite",

    foundationRef?: StrongRef,

    family: {
        id: "rp_fm_01JQ...",
        origin: StrongRef
    },

    lineage: {
        id: "rp_pt_02AB...",
        root: StrongRef,
        prev?: StrongRef,
        forkedFrom?: StrongRef
    },

    slug: "collaboration-suite",

    version: "2.0.0",
    stage: "stable",

    createdAt: "2026-05-15T10:00:00Z",
    language: "en",

    authorship: {
        authorDid: "did:plc:xyz..."
    },

    title: "Collaborative Protocols",
    summary: "A collection of standards for collaboration.",

    members: {
        needs: StrongRef[],
        protocols: StrongRef[],
        suites: StrongRef[]
    },

    tags: ["coordination"],

    metadata: {},

    lifecycle: {}
}
```

### 3.4 Mark (`org.rp.mark`)

**Marks represent participant interaction with a lineage or version.**

```ts
{
    $type: "org.rp.mark",

    verb: "follow" | "adopt",

    status: "active" | "paused" | "ended",

    subject: {
        kind: "need" | "protocol" | "suite",

        lineageId: "rp_mk_02AB...",

        versionRef?: StrongRef,

        pinMode: "exact" | "floating-stable"
    },

    context?: "Following updates on formatting.",

    createdAt: "2026-06-01T10:00:00Z",
    updatedAt: "2026-06-01T10:00:00Z"
}
```

## 4. Version Model

### 4.1 Semantic Versioning

```txt

major.minor.patch
```

### 4.2 Versioning Semantics

Level | Meaning
--- | ---
major | Breaking conceptual or structural change
minor | Substantive improvement or addition
patch | Non-substantive change (formatting, wording, metadata)

### 4.3 Versioning Conditions

* MUST be immutable
* MUST increase monotonically within lineage
* MUST NOT compared across lineages
* Genesis SHOULD be 0.1.0
* 1.0.0 indicates stable readiness

### 4.4 Cross-Lineage Constraints

* Version numbers MUST NOT be used to determine global ordering
* Family-level ordering MUST be resolved via AppView

## 5. Forking Model

Forking creates a new lineage with the same family.

```ts

release: {
    kind: "fork",
    bump: "major"
},

familyEvent: {
    type: "candidate-major-fork",
    status: "pending"
}
```

**Forking Constraints**
* MUST create a new lineage.id
* MUST preserve family.id
* MUST reference source via forkedFrom
* MUST NOT assign a family-major number directly
* MAY declare a candidate family event

## 6. Family Version Resolution

Family-wide versioning is computed by AppViews.

### 6.1 Canonical vs Computed

**Field** | **Source**
---|---
version | authored (lineage-local)
familyVersion | computed (AppView)

### 6.2 Candidate Events

A version is a candidate if:
* release.kind === "fork"
* familyEvent.type === "candidate-major-fork"
* lineage.root is this version

### 6.3 Assignment Policy

AppViews SHOULD:
1. collect all candidate events within a family
2. order them by:
    * createdAt
    * URI (tie-break)
    * CID (final tie-break)
3. assign incremental family-major ordinals

### 6.4 Stability
* Assigned ordinals SHOULD remain stable
* Reordering SHOULD only occur if graph completeness changes

### 6.5 Social Signals

AppViews MAY compute:
* followers
* adopters
* recency
* trust weighting

These MUST NOT affect ordinal numbering.

## 7. Lifecycle Model

```txt

draft → candidate → stable → deprecated
```

**Lifecycle Meanings**
* **draft** → evolving, unstable
* **candidate** → complete, under review
* **stable** → broadly usable
* **deprecated** → no longer recommended

### 7.1 Foundation Context

The interpretive context of a Need, Protocol, or Suite MAY be made explicit through foundationRef.

**Meaning**
* A foundation expresses the orienting proto-protocol context within which a record is being created or understood.
* A foundation is not external to the protocol system.
* Foundations are themselves forkable, evolvable records.
* Referencing a foundation does not make that foundation fixed or authoritative.

**Constraints**
* A record MAY inherit a foundation from the client environment in which it was created.
* A participant MAY retain the default foundation, replace it, remove it, or fork it.
* A change to foundationRef SHOULD produce a new version when it materially changes the interpretive context of the record.
* A participant MAY fork a record rather than update it when changing the foundation results in meaningful conceptual divergence.

## 8. Identity Model

**Layer** | **Meaning**
---|---
family.id | global protocol evolution
lineage.id | branch identity
slug | human-readable reference

**Constraints**
* title MUST NOT change within lineage
* language MUST NOT change within lineage
* breaking identity changes REQUIRE fork

## 9. Lineage & Family Reconstruction

**Clients MUST use:**
* family.origin
* lineage.root
* lineage.prev
* lineage.forkedFrom

**Clients MUST NOT rely on:**
* version strings alone

## 10. AppView Responsibilities

**AppViews SHOULD:**

* index families and lineages
* resolve lineage versions
* assign family-major ordinals
* compute familyVersion display values
* map fork trees
* compute adoption signals
* expose recommendation policies

### 10.1 AppView Responsibilities for Foundations

**AppViews SHOULD:**
* resolve and display foundationRef when present
* make the referenced foundation inspectable
* distinguish between canonical record data and client defaults
* support filtering or grouping by foundation
* allow participants to trace records that share a common foundation
* make foundation changes visible across versions and forks

**AppViews MAY:**
* show whether a record uses a client-provided default foundation
* show whether the referenced foundation has itself been forked or evolved
* surface related records using the same foundation

**AppViews MUST NOT:**
* treat the presence of foundationRef as proof of validity, quality, or adoption
* assume that records without foundationRef are invalid

## 11. Marks

### 11.1 Structure

```ts

subject: {
    kind: "need" | "protocol" | "suite",

    familyId?: string,
    lineageId?: string,
    versionRef?: StrongRef,

    pinMode: "exact" | "floating-lineage-stable" | "floating-family-stable"
}
```

### 11.2 Semantics

**Mode** | **Meaning**
---|---
exact | fixed version
floating-lineage-stable | latest stable in a lineage
floating-family-stable | AppView-selected stable in a family

### 11.3 Terminology Note on Foundations

foundationRef is intended to make visible the orienting ground of a record.

It SHOULD be understood as:
* a visible starting context
* an explicit interpretive reference
* a forkable and evolvable part of the protocol ecosystem

It SHOULD NOT be understood as:
* a mandatory ideological commitment
* a hidden system default
* a fixed authority outside the protocol graph

## 12. Terminology Alignment

**Instead of** | **Use**
rules | constraints / conditions
enforcement | validation
compliance | alignment
execution | participation

* `record` → **version**
* `collection` → **type**
* `rkey` → **slug**

## 13. Summary

**org.rp.v1.4 adds:**
* explicit foundational references through foundationRef
* visible grounding for new Needs, Protocols, and Suites
* client-default foundation behavior without schema rigidity
* support for inspectable, removable, replaceable, and forkable foundations

**org.rp.v1.3 establishes:**

* Dual-layer identity (family + lineage)
* Lineage-local versioning
* Fork-as-request model
* AppView-resolved family ordering
* Separation of canonical vs computed truth
* Support for decentralized, evolving protocol ecosystems