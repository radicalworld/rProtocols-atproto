# `org.rp.v1.2` Specification

The **rProtocols V1 Schema** defines a lineage-based data model for collaboratively creating, evolving, and adopting Needs, Protocols, Suites, and Marks across the ATProto network.

Each record represents an **immutable version within a lineage graph**, where evolution is expressed through explicit references between records.

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

### 1.2 Design Foundations

1. **Immutability**
   * A recorded version MUST NOT be edited, overwritten, or mutated in the repository—even during draft phases.
   * Any modification of a record MUST result in a semantic version increment and a distinct new record.

2. **Lineage over mutation**
   * Evolution is expressed through explicit references.

3. **Strong references**
   * All lineage edges use { uri, cid }.

4. **Separated identity layers**
   * Canonical identity → lineage
   * Human-readable identity → slug

5. **Forks create new lineage**
   * Lineages never split internally.

## 2. Core Primitives

### 2.1 Strong Reference

```ts
type StrongRef = {
    uri: string, // at://did/.../collection/rkey
    cid: string  // bafy...
}
```

### 2.2 Lineage Object

```ts
lineage: {
    id: string, // typed opaque ID (see 2.3)

    root: StrongRef,     // first record in lineage
    prev?: StrongRef,    // immediate predecessor
    forkedFrom?: StrongRef // only present if this lineage was forked
}
```

### 2.3 Lineage ID Format (Constraint)

The lineage.id MUST:

* be globally unique
* remain stable across all versions
* encode entity type
* be opaque (non-semantic beyond prefix)

**Format**

```text

rp_<type>_<opaqueId>
```

**Types Prefixes**

Type | Prefix
Need | rp_nd
Protocol | rp_pt
Suite | rp_st
Mark | rp_mk

**Example**

```txt

rp_pt_01JQ7M8D9K3S6W1B2N4C7R5YF2
```

**Constraint**

The type prefix in lineage.id MUST match the record $type across all versions.

## 3. Atomic Structure

### 3.1 Need (`org.rp.need`)

```ts
{
    $type: "org.rp.need",

    lineage: {
        id: "rp_nd_01JQ...",
        root: StrongRef,
        prev: StrongRef
    },

    slug: "open-protocols",

    version: "1.0.0",
    stage: "stable",

    createdAt: "2026-03-16T18:42:11Z",
    language: "en",

    authorship: {
        authorDid: "did:plc:abc123..."
    },

    context: "Creating, evolving, and sharing open protocols",
    description: "The internet lacks a native layer...",
    purpose: "To enable decentralized protocol collaboration.",

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

    lineage: {
        id: "rp_pt_02AB...",
        root: StrongRef,
        prev: StrongRef
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
    purpose: "To standardize authoring flows.",

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

    lineage: {
        id: "rp_st_03XY...",
        root: StrongRef,
        prev: StrongRef
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
    description: "A collection of standards for collaboration.",
    purpose: "To provide a unified toolkit.",

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

* major → breaking conceptual change
* minor → additive or refinement

### 4.2 Versioning Semantics (Constraint)

Level | Meaning
--- | ---
major | Breaking conceptual or structural change
minor | Substantive improvement or addition
patch | Non-substantive change (formatting, wording, metadata)

### 4.3 Versioning Conditions

* A version record MUST NEVER be overwritten in the repository.
* Every save or modification MUST increment the version and produce a new record.
* Versions MUST increase monotonically within lineage.
* Genesis version SHOULD be 0.1.0
* 1.0.0 indicates stable readiness

### 4.4 Patch Constraints

Patch increments MUST NOT:
* alter meaning or intent
* change scope or applicability
* affect protocol behavior

## 5. Forking Model

Forking creates a new lineage.

```ts

lineage: {
    id: "rp_pt_new...",
    root: StrongRef,
    forkedFrom: StrongRef
}
```

**Forking Constraints**
* A fork MUST NOT reuse the original lineage ID
* A fork MUST reference its origin via forkedFrom
* Forks evolve independently

## 6. Lifecycle Model

```txt

draft → candidate → stable → deprecated
```

**Lifecycle Meanings**
* **draft** → evolving, unstable
* **candidate** → complete, under review
* **stable** → broadly usable
* **deprecated** → no longer recommended

## 7. Identity Model

### 7.1 Canonical Identity

* lineage.id is the true identity
* MUST be opaque and stable (never changes)

### 7.2 Human Identity

* slug is:
  * human-readable
  * URL-friendly
  * mutable   

**Identity Constraint**

* slug MUST NOT be used to determine lineage.

### 7.3 Immutable Core Metadata

The semantic identity of a lineage graph is established at genesis.
* `title` MUST NOT be modified across versions within the same lineage.
* `language` MUST NOT be modified across versions within the same lineage.

**Constraint**
* To safely introduce a change to these core identity attributes, participants MUST explicitly fork into a new lineage.

## 8. Lineage Reconstruction

**Clients MUST reconstruct lineage using:**

* lineage.root
* lineage.prev
* lineage.forkedFrom

**Clients MUST NOT rely on:**

* version strings alone
* manually maintained history arrays

## 9. Integrity Model

**Integrity is guaranteed by:**

* ATProto repository signing
* CID hashing (DAG-CBOR)
* StrongRef verification

## 10. AppView Responsibilities

**AppViews SHOULD:**

* index lineage graphs
* resolve latest stable versions
* compute adoption signals
* map fork trees
* cache lineage traversal

## 11. Terminology Alignment

**To reflect the nature of protocols:**

**Instead of** | **Use**
rules | constraints / conditions
enforcement | validation
compliance | alignment
execution | participation

* `record` → **version**
* `collection` → **type**
* `rkey` → **slug**

## 12. Summary

**org.rp.v1 establishes:**

* Lineage-first coordination
* Typed, stable identity
* ATProto-native referencing
* Clear fork semantics
* Separation of human vs canonical identity
* Support for living, evolving protocols

