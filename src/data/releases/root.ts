import type { Release } from "@/domain/types";

export const rootReleases: Record<string, { current: string; releases: Record<string, Release> }> = {
    "protocol-creation": {
    current: "1.0",
    releases: {
      "1.0": {
        id: "protocol-creation",
        did: "did:web:r.radical.world/protocol-creation",
        cid: "bafyproto-creation-1-0-placeholder",
        previousCid: "bafyproto-creation-0-9-placeholder",
        version: "1.0",
        stage: "published",
        date: "2025-10-16",
        language: "en",
        needId: "create-open-protocol",
        purpose: "Establish the first principles for creating open, evolving protocols that serve life and collaboration.",
        scope: { appliesTo: ["collabs", "ecosystems"], region: { level: "global" } },
        tags: ["root", "creation", "first-principles", "openness"],
        suiteIds: ["suite-root-protocols"],
        relatedProtocols: ["protocol-evolution", "protocol-attribution", "protocol-publishing"],
        followEnabled: true,
        adoptEnabled: true,
        followCount: 37,
        adoptCount: 12,
        shortUrl: "r.pro/creation",
        qrCode: "QR://protocol-creation",
        attribution: [
          { name: "rCollabs Core", did: "did:web:r.radical.world" },
          { name: "Jose A. Leal", did: "did:web:jose.r.radical.world" }
        ],
        history: [
          { version: "1.0", date: "2025-10-16", note: "Published as first-principles root protocol." },
          { version: "0.9", date: "2025-10-02", note: "RC freeze; clarified roles and examples." },
          { version: "0.6", date: "2025-09-20", note: "Initial draft of structure and workflow." }
        ],
        changeDescription: "Reframed as the top-level Protocol Creation, emphasizing principles over process.",
        protocolBody: `## Intent
To express and share living experiments that allow people and groups to collaborate more effectively, transparently, and in service to life.
## Practice
1. Begin from observation — a need, tension, or imbalance that calls for attention.  
2. Propose a simple, testable way to respond.  
3. Document it openly so others can try, adapt, or challenge it.  
4. Let results, resonance, and adoption guide its evolution.
## Signals
- People fork or remix this protocol to suit new contexts.  
- Collaborators report clarity and alignment from using it.  
- The ecosystem grows richer through shared learning.
## Closing
The idea of protocol creation remains in motion.
What might we learn when shared experiments contradict assumptions?
Future iterations may explore authorship, validation, and shared trust.`
      },
      "0.9": {
        id: "protocol-creation",
        version: "0.9",
        stage: "rc",
        date: "2025-10-02",
        language: "en",
        purpose: "Pre-publish freeze with examples and final clarifications.",
        tags: ["root", "creation", "rc"],
        followEnabled: true,
        adoptEnabled: true,
        followCount: 29,
        adoptCount: 9,
        protocolBody: `## Intent
Freeze scope; finalize examples and role clarity ahead of 1.0.
## Practice
- Lock terminology and scope for review.
- Collect final examples demonstrating adoption paths.
- Prepare publishing notes for suites and index.
## Signals
- No new scope changes accepted.
- Reviewers confirm clarity for 1.0.`,
        attribution: [{ name: "rCollabs Core", did: "did:web:r.radical.world" }]
      },
      "0.6": {
        id: "protocol-creation",
        version: "0.6",
        stage: "draft",
        date: "2025-09-20",
        language: "en",
        purpose: "Early draft of structure and workflow.",
        tags: ["root", "creation", "draft"],
        followEnabled: true,
        adoptEnabled: false,
        followCount: 12,
        adoptCount: 0,
        protocolBody: `## Intent
Explore a shared structure for proposing and evolving protocols.
## Practice
- Sketch candidate attributes and basic workflow.
- Share early to gather open feedback.
## Signals
- Review comments cluster around clarity and usefulness.`,
        attribution: [{ name: "Jose A. Leal", did: "did:web:jose.r.radical.world" }]
      }
    }
  },

  "protocol-evolution": {
    current: "0.8",
    releases: {
      "0.8": {
        id: "protocol-evolution",
        version: "0.8",
        stage: "rc",
        date: "2025-10-12",
        language: "en",
        purpose: "Clarify when to update vs fork; maintain readable lineage.",
        tags: ["root", "evolution", "lineage"],
        followEnabled: true,
        adoptEnabled: false,
        followCount: 22,
        adoptCount: 3,
        shortUrl: "r.pro/evolve",
        protocolBody: `## Version Semantics
- Major (N.0) = Fork (incompatible or philosophical shifts)
- Minor (N.x) = Update (additions/clarifications)
## Lineage Rules
- Link previousVersion; if fork, record forkOf.
- Keep a terse CHANGELOG.
## Migration
- Publish "What changed?" and "Who’s impacted?" for Minor/Major.`,
        attribution: [{ name: "rCollabs Core", did: "did:web:r.radical.world" }]
      }
    }
  },

  "protocol-attribution": {
    current: "1.1",
    releases: {
      "1.1": {
        id: "protocol-attribution",
        version: "1.1",
        stage: "published",
        date: "2025-10-08",
        language: "en",
        purpose: "Make contributions visible with DIDs and public history.",
        tags: ["root", "attribution", "DID", "recognition"],
        followEnabled: true,
        adoptEnabled: true,
        followCount: 41,
        adoptCount: 15,
        shortUrl: "r.pro/attrib",
        protocolBody: `- Contributors list (name + DID + role)
- Periodic Recognitions Review
- Attribution block at end of every protocol`,
        attribution: [
          { name: "rCollabs Core", did: "did:web:r.radical.world" },
          { name: "Contrib WG", did: "did:web:wg.r.radical.world" }
        ]
      }
    }
  },

  "protocol-adoption": {
    current: "1.0",
    releases: {
      "1.0": {
        id: "protocol-adoption",
        version: "1.0",
        stage: "published",
        date: "2025-09-30",
        language: "en",
        purpose: "Define 'Adopt' and how it’s signaled and verified.",
        tags: ["root", "adoption", "signals"],
        followEnabled: true,
        adoptEnabled: true,
        followCount: 55,
        adoptCount: 28,
        shortUrl: "r.pro/adopt",
        protocolBody: `## Definition
Public declaration of active use by a collab/org.
## Signals
- Adopt action + org DID
- Context note (where/how used)
- Heartbeat (quarterly) for continuing use
## Verification
- Light-touch peer ping; optional audit for high-impact.`,
        attribution: [{ name: "Signals WG", did: "did:web:wg.r.radical.world" }]
      }
    }
  }
};