import type { Need, Suite, Protocol, Mark, ProtocolRelease } from "@/domain/types";
import { protocolReleases } from "@/data/releases/index"

export { protocolReleases } from "@/data/releases";

/* ============================================================================
   BASE PROTOCOL CARDS
============================================================================ */
export const protocols: Record<string, Protocol> = {
  "protocol-creation":        { id: "protocol-creation",        title: "Protocol Creation",        summary: "Structure, attributes, and publishing steps." },
  "protocol-evolution":       { id: "protocol-evolution",       title: "Protocol Evolution",       summary: "Minor updates vs major forks; history & lineage." },
  "protocol-attribution":     { id: "protocol-attribution",     title: "Protocol Attribution",     summary: "DIDs, recognition, and shared authorship." },
  "protocol-adoption":        { id: "protocol-adoption",        title: "Protocol Adoption",        summary: "Signals of active use by a collab or org." },
  "protocol-follow":          { id: "protocol-follow",          title: "Protocol Follow",          summary: "Track updates and discussions without adopting." },
  "protocol-trust":           { id: "protocol-trust",           title: "Protocol Trust",           summary: "Peer review, audits, and reliability signals." },
  "protocol-publishing":      { id: "protocol-publishing",      title: "Protocol Publishing",      summary: "Open formats (JSON), IPFS/ATproto, discoverability." },
  "protocol-index":           { id: "protocol-index",           title: "Protocol Index",           summary: "Tags, hierarchy, and cross-links across needs/suites." },
  "protocol-onboarding":      { id: "protocol-onboarding",      title: "Collaborator Onboarding",  summary: "A humane, peer-supported entry path." },
  "protocol-comms":           { id: "protocol-comms",           title: "Transparent Comms",        summary: "Open updates, decisions, and docs." },
  "protocol-web-style":       { id: "protocol-web-style",       title: "Website Style",            summary: "Design tokens, typography, accessibility." },
  "protocol-creation-v2":     { id: "protocol-creation-v2",     title: "Protocol Creation (v2 Fork)", summary: "Fork exploring simplified attributes & shorter review." },
  "protocol-adoption-lite":   { id: "protocol-adoption-lite",   title: "Protocol Adoption (Lite)",  summary: "Minimal adoption signals for small collabs." },
  "protocol-trust-archived":  { id: "protocol-trust-archived",  title: "Protocol Trust (Archived)", summary: "Deprecated trust signal model retained for history." }
};

/* ============================================================================
   SUITES
============================================================================ */
export const suites: Record<string, Suite> = {
  "suite-root-protocols": {
    id: "suite-root-protocols",
    title: "Root Protocols",
    description: "Foundational patterns for creating, evolving, and sharing.",
    protocolIds: [
      "protocol-creation",
      "protocol-evolution",
      "protocol-attribution",
      "protocol-adoption",
      "protocol-follow",
      "protocol-trust",
      "protocol-publishing",
      "protocol-index"
    ]
  },
  "suite-work-foundations": {
    id: "suite-work-foundations",
    title: "Work Foundations",
    description: "Baseline practices for healthy collaboration.",
    protocolIds: ["protocol-onboarding", "protocol-comms"]
  },
  "suite-website-foundations": {
    id: "suite-website-foundations",
    title: "Website Foundations",
    description: "Shared guidelines for a coherent web presence.",
    protocolIds: ["protocol-web-style"]
  }
};

/* ============================================================================
   NEEDS
============================================================================ */
export const needs: Record<string, Need> = {
  "root-open-protocols": {
    id: "root-open-protocols",
    title: "How can we create, evolve, and share open protocols together?",
    description: "These are the Root Protocols that ground openness, iteration, and trust.",
    parentId: null,
    childIds: [
      "create-open-protocol",
      "evolve-protocols",
      "attribute-contributions",
      "adopt-protocol",
      "follow-protocol",
      "build-trust",
      "publish-protocols",
      "discover-protocols"
    ],
    suiteIds: ["suite-root-protocols"],
    protocolIds: []
  },
  "create-open-protocol": {
    id: "create-open-protocol",
    title: "How can we create an open protocol?",
    parentId: "root-open-protocols",
    childIds: [],
    suiteIds: ["suite-root-protocols"],
    protocolIds: ["protocol-creation"]
  },
  "evolve-protocols": {
    id: "evolve-protocols",
    title: "How do protocols evolve?",
    parentId: "root-open-protocols",
    childIds: [],
    suiteIds: ["suite-root-protocols"],
    protocolIds: ["protocol-evolution"]
  },
  "attribute-contributions": {
    id: "attribute-contributions",
    title: "How do we attribute contributions?",
    parentId: "root-open-protocols",
    childIds: [],
    suiteIds: ["suite-root-protocols"],
    protocolIds: ["protocol-attribution"]
  },
  "adopt-protocol": {
    id: "adopt-protocol",
    title: "How do I adopt a protocol?",
    parentId: "root-open-protocols",
    childIds: [],
    suiteIds: ["suite-root-protocols"],
    protocolIds: ["protocol-adoption"]
  },
  "follow-protocol": {
    id: "follow-protocol",
    title: "How can I follow changes?",
    parentId: "root-open-protocols",
    childIds: [],
    suiteIds: ["suite-root-protocols"],
    protocolIds: ["protocol-follow"]
  },
  "build-trust": {
    id: "build-trust",
    title: "How do we build trust?",
    parentId: "root-open-protocols",
    childIds: [],
    suiteIds: ["suite-root-protocols"],
    protocolIds: ["protocol-trust"]
  },
  "publish-protocols": {
    id: "publish-protocols",
    title: "How are protocols published?",
    parentId: "root-open-protocols",
    childIds: [],
    suiteIds: ["suite-root-protocols"],
    protocolIds: ["protocol-publishing"]
  },
  "discover-protocols": {
    id: "discover-protocols",
    title: "How are protocols discovered?",
    parentId: "root-open-protocols",
    childIds: [],
    suiteIds: ["suite-root-protocols"],
    protocolIds: ["protocol-index"]
  },
  "work-collaboration": {
    id: "work-collaboration",
    title: "How do we collaborate well in work?",
    description: "Practices for healthy, life-serving collaboration.",
    parentId: null,
    childIds: [],
    suiteIds: ["suite-work-foundations"],
    protocolIds: []
  },
  "web-presence": {
    id: "web-presence",
    title: "How do we keep a coherent, accessible web presence?",
    parentId: null,
    childIds: [],
    suiteIds: ["suite-website-foundations"],
    protocolIds: []
  }
};

/* ============================================================================
   MARKS
============================================================================ */
export const marks: Record<string, Mark> = {};

/* ============================================================================
   RELEASE TYPE
============================================================================ */
// type Stage = "draft" | "rc" | "published" | "archived";

// export interface Release {
//   id: string;
//   did?: string;
//   cid?: string;
//   previousCid?: string;
//   needId?: string;
//   version: string;
//   stage: Stage;
//   date: string;
//   language: string;
//   purpose: string;
//   scope?: { appliesTo?: string[]; region?: Record<string, any> };
//   tags?: string[];
//   suiteIds?: string[];
//   relatedProtocols?: string[];
//   followEnabled?: boolean;
//   adoptEnabled?: boolean;
//   followCount?: number;
//   adoptCount?: number;
//   shortUrl?: string;
//   qrCode?: string;
//   protocolBody: string;
//   attribution?: { name: string; did: string }[];
//   changeDescription?: string;
//   history?: { version: string; date: string; note: string }[];
// }

/* ============================================================================
   PROTOCOL RELEASES
============================================================================ */

export const websiteReleases: Record<string, { current: string; releases: Record<string, ProtocolRelease> }> = {
  "protocol-web-style": {
    current: "0.4",
    releases: {
      "0.4": {
        id: "protocol-web-style",
        version: "0.4",
        stage: "draft",
        date: "2025-10-06",
        language: "en",
        purpose: "Design tokens and accessibility defaults for coherence.",
        tags: ["web", "style", "accessibility", "tokens"],
        followEnabled: true,
        adoptEnabled: false,
        followCount: 8,
        adoptCount: 1,
        shortUrl: "r.pro/webstyle",
        protocolBody: `- Tokens: color, type, spacing as JSON
- A11y: WCAG AA minimum; test pages
- Components: buttons, cards, alerts with usage notes`,
        attribution: [{ name: "Web WG", did: "did:web:wg.r.radical.world" }]
      }
    }
  }
};

/* ============================================================================
   LINEAGE (major.minor only)
============================================================================ */
export const protocolLineage: Record<string, { previousVersion: string | null; forkOf: string | null; children: string[] }> = {
  "protocol-creation":       { previousVersion: "0.9", forkOf: null, children: ["protocol-creation-v2"] },
  "protocol-creation-v2":    { previousVersion: null,  forkOf: "protocol-creation", children: [] },
  "protocol-trust":          { previousVersion: "0.5", forkOf: null, children: ["protocol-trust-archived"] },
  "protocol-trust-archived": { previousVersion: null,  forkOf: "protocol-trust", children: [] },
  "protocol-adoption":       { previousVersion: null,  forkOf: null, children: ["protocol-adoption-lite"] },
  "protocol-adoption-lite":  { previousVersion: null,  forkOf: "protocol-adoption", children: [] }
};

/* ============================================================================
   HELPERS (simple, framework-agnostic)
============================================================================ */
export function latestVersion(id: string): string | undefined {
  return protocolReleases[id]?.current;
}

export function listReleases(id: string): ProtocolRelease[] {
  const bucket = protocolReleases[id];
  if (!bucket) return [];
  // Sort newest (by version number) first; if needed, sort by date
  return Object.values(bucket.releases).sort((a, b) => {
    const [amaj, amin] = a.version.split(".").map(Number);
    const [bmaj, bmin] = b.version.split(".").map(Number);
    if (bmaj !== amaj) return bmaj - amaj;
    return bmin - amin;
  });
}

export function getRelease(id: string, version?: string): ProtocolRelease | undefined {
  const bucket = protocolReleases[id];
  if (!bucket) return undefined;
  const v = version ?? bucket.current;
  return v ? bucket.releases[v] : undefined;
}

/* ============================================================================
   CURATED COLLECTIONS (render anywhere; independent of protocol links)
============================================================================ */
export const collections = {
  draftsAndRCs: [
    { id: "protocol-follow", version: "0.6" },
    { id: "protocol-publishing", version: "0.9" },
    { id: "protocol-onboarding", version: "0.7" },
    { id: "protocol-creation-v2", version: "2.0" },
    { id: "protocol-adoption-lite", version: "0.3" }
  ],
  mostAdopted: [
    { id: "protocol-adoption", version: "1.0" },
    { id: "protocol-index", version: "1.2" },
    { id: "protocol-comms", version: "1.2" },
    { id: "protocol-attribution", version: "1.1" }
  ],
  recentChanges: [
    { id: "protocol-creation", version: "1.0", changed: "2025-10-10" },
    { id: "protocol-publishing", version: "0.9", changed: "2025-10-13" },
    { id: "protocol-evolution", version: "0.8", changed: "2025-10-12" }
  ]
};

/* Spotlight (e.g., home hero). Useful for testing version routing/deeplinks) */
export const spotlightProtocols = [
  { id: "protocol-creation", version: "1.0" },
  { id: "protocol-trust", version: "1.0" }
];

/* Optional: quick draft buffers to simulate “in-flight” edits (editor UX) */
export const protocolDrafts: Record<string, string> = {
  "protocol-follow": `# Protocol Follow (next)
- Add per-thread mute + digest frequency.
- Explore per-tag follow to reduce noise.`,

  "protocol-creation-v2": `# Protocol Creation v2 (next)
- Experiment: async-only review with acceptance criteria.
- Add “examples-first” scaffold.`
};