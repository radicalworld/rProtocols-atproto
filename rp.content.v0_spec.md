# `org.rp.v0` Specification

The **rProtocols V0 Schema** defines a declarative data schema for collaborating on shared needs, protocols, and suites across the ATProto network. It replaces centralized database models with deterministic, portable JSON records stored in a user's Personal Data Server (PDS).

This specification defines the required structure and validation rules for valid `org.rp.*` payloads.

## 1. Core Hierarchy

The atomic units of storage and transmission in the rProtocols ATProto implementation are **Needs** (`org.rp.need`), **Protocols** (`org.rp.protocol`), **Suites** (`org.rp.suite`), and **Marks** (`org.rp.mark`).

A single record represents one immutable semantic version of a collaborative node. The rProtocols client engine dynamically aggregates these atomic records by their `rootId` to reconstruct version history and lineage.

An atomic record contains:
* Lexicon identifier (`$type`)
* The stable root identity (`rootId`)
* Version metadata (`version`, `stage`, `createdAt`)
* Provenance and authorship (`authorDids`, `prevCid`)
* The domain-specific payload (`title`, `purpose`, `protocolBody`, etc.)

### 1.1 Atomic Need Structure (`org.rp.need`)

```javascript
{
    $type: "org.rp.need",
    
    rootId: "root-open-protocols",
    version: "1.0",
    stage: "stable",
    date: "2026-03-16",
    language: "en",
    
    provenance: {
        authorDid: "did:plc:abc123...",
        prevCid: "bafyreih3xk...", // The CID of version 0.9, if applicable
        signature: null
    },

    question: "How can we create, evolve, and share open protocols together?",
    description: "The internet lacks a native layer for collaborative standardization...",
    purpose: "To establish a decentralized framework for protocol iteration.",
    
    relations: {
        parentRootId: null,
        childRootIds: ["root-schema-validation", "root-identity-routing"],
        suiteIds: ["suite-collaboration"],
        relatedProtocols: ["protocol-creation"]
    },

    tags: ["coordination", "atproto", "standards"],
    
    connectivity: {
        shortUrl: "https://rp.social/n/open-protocols",
        qrCode: "..."
    },

    attribution: [
        { name: "Alice", did: "did:plc:alice..." }
    ],
    history: [
        { version: "1.0", date: "2026-03-16", note: "Initial stable release" }
    ],
    changeDescription: "Added new scope...",

    endOfLifeAt: null,
    archived: false
}
```

### 1.2 Atomic Protocol Structure (`org.rp.protocol`)

```javascript
{
    $type: "org.rp.protocol",
    
    rootId: "protocol-creation",
    version: "1.2",
    stage: "stable",
    date: "2026-04-01",
    language: "en",
    
    provenance: {
        authorDid: "did:plc:abc123...",
        prevCid: "bafyreibw72...",
        signature: null
    },

    needRootId: "root-open-protocols",

    title: "Protocol Creation",
    summary: "A mechanism for drafting and publishing open standards.",
    protocolBody: "### 1. Authorship\n\nProtocols must be signed by...",
    purpose: "To standardize the authoring flow.",

    scope: {
        appliesTo: ["software developers", "network architects"],
        region: { level: "global" }
    },

    relations: {
        suiteIds: ["suite-collaboration"],
        relatedProtocols: ["protocol-versioning"]
    },

    tags: ["authoring", "governance"],

    connectivity: {
        shortUrl: "...",
        qrCode: "..."
    },

    attribution: [],
    history: [],
    changeDescription: "...",

    endOfLifeAt: null,
    archived: false
}
```

### 1.3 Atomic Suite Structure (`org.rp.suite`)

```javascript
{
    $type: "org.rp.suite",
    
    rootId: "suite-collaboration",
    version: "2.0",
    stage: "stable",
    date: "2026-05-15",
    language: "en",
    
    provenance: {
        authorDid: "did:plc:xyz890...",
        prevCid: "bafyreixyz...",
        signature: null
    },

    title: "Collaborative Protocols",
    description: "A collection of standards for working together digitally.",
    purpose: "To provide a unified toolkit for decentralized organizations.",

    scope: {
        appliesTo: [],
        region: { level: "global" }
    },

    // Authoritative, immutable snapshot members
    needMembers: [
        { rootId: "root-open-protocols", version: "1.0" }
    ],
    protocolMembers: [
        { rootId: "protocol-creation", version: "1.2" }
    ],
    suiteMembers: [],

    tags: ["dao", "tooling"],

    connectivity: {
        shortUrl: "...",
        qrCode: "..."
    },

    attribution: [],
    history: [],
    changeDescription: "...",

    endOfLifeAt: null,
    archived: false
}
```

### 1.4 Atomic Mark Structure (`org.rp.mark`)

```javascript
{
    $type: "org.rp.mark",
    
    verb: "follow", // "follow" | "adopt"
    status: "active", // "active" | "paused" | "ended"
    
    subjectKind: "protocol", // "need" | "suite" | "protocol"
    subjectRootId: "protocol-creation",
    subjectVersion: "1.2", // optional
    
    context: "Following this to keep up with formatting changes.",
    
    createdAt: "2026-06-01T10:00:00Z",
    updatedAt: "2026-06-01T10:00:00Z"
}
```

## 2. Required Properties

### 2.1 Protocol (`org.rp.protocol`) Must Include

* `$type`
* `rootId`
* `version`
* `stage`
* `date`
* `language`
* `provenance` (containing at least `authorDid`)
* `title`
* `protocolBody`
* `needRootId` (Protocols must belong to a Need)

All other properties (like `summary`, `scope`, `tags`) are optional.

## 3. Root ID Rule

The `rootId` MUST be a URL-friendly slug that remains completely stable across all versions of the record.

```code
rootId = "protocol-creation"
```

If a title changes dramatically (e.g., "Protocol Creation" -> "Standardized Authorship"), the `title` field updates, but the `rootId` MUST NOT change, to preserve the historical lineage graph.

## 4. Stage & Lifecycle Mapping

Unlike typical file-systems, `stage` enforces strict semantic workflows.

1. `draft`: Highly volatile. Numbering stays at `0.x`.
2. `candidate`: Feature-complete, awaiting review. 
3. `stable`: Deployed and finalized. Version jumps to `1.0`, `1.1`, or `2.0`.
4. `deprecated`: No longer recommended for use.

## 5. Provenance and Versioning

### 5.1 Provenance Mechanics
The `provenance` object tracks the granular lineage of the specific edits stored within this atomic record.

* `authorDid` (REQUIRED) → String representation of the DID of the author who wrote this specific payload.
* `prevCid` (OPTIONAL) → The `bafy...` Content Identifier of the direct ancestor record this version is amending or replacing. If this is version `0.1`, this MUST be omitted or `null`.
* `signature` (OPTIONAL) → A cryptographic signature over the canonical JSON generated by the private keys of the `authorDid`. Applications SHOULD implement and verify this signature to mathematically guarantee the declarative DIDs are legitimate.

### 5.2 Version Mechanics

Versioning occurs via strict Semantic Versioning (`major.minor`).

* `version.major` → Defines a breaking change in scope or intent. MUST be integer >= 0.
* `version.minor` → Defines a significant content edit or addition. MUST be integer >= 0.
* `patch` numbers are omitted from the canonical integer strings for simplicity, handled by the commit history instead.

## 6. Hash Generation

Because records are stored on ATProto, the integrity is mathematically guaranteed via IPLD DAG-CBOR encoding and CID generation natively provided by the `@atproto/api` agent. Clients do not need to manually compute stringified JSON SHA256 hashes, as the PDS repository structure strictly enforces content hashing.

## Conclusion

`org.rp.v0` defines:
* Immutable semantic lineage (`rootId` + `version` + `prevCid`)
* Declarative content bindings (Markdown)
* Deterministic social signaling (`org.rp.mark`)
* Strong referential integrity via ATProto `strongRef`

It establishes a stable foundation for the decentralized coordination of digital standards.
