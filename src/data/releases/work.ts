import type { Release } from "@/domain/types";

export const workReleases: Record<string, { current: string; releases: Record<string, Release> }> = {
  "protocol-onboarding": {
    current: "0.7",
    releases: {
      "0.7": {
        id: "protocol-onboarding",
        version: "0.7",
        stage: "rc",
        date: "2025-10-05",
        language: "en",
        purpose: "Humane, peer-supported entry path.",
        tags: ["work", "people", "onboarding"],
        followEnabled: true,
        adoptEnabled: true,
        followCount: 12,
        adoptCount: 5,
        shortUrl: "r.pro/onboard",
        protocolBody: `- Two self-chosen sponsors with weekly check-ins
- Needs-first orientation over role assignment
- Publish First 30/60/90 learning notes`,
        attribution: [{ name: "People WG", did: "did:web:wg.r.radical.world" }]
      }
    }
  },

  "protocol-comms": {
    current: "1.2",
    releases: {
      "1.2": {
        id: "protocol-comms",
        version: "1.2",
        stage: "published",
        date: "2025-10-03",
        language: "en",
        purpose: "Keep decisions, updates, and docs transparent and accessible.",
        tags: ["work", "communication", "transparency"],
        followEnabled: true,
        adoptEnabled: true,
        followCount: 29,
        adoptCount: 10,
        shortUrl: "r.pro/comms",
        protocolBody: `- Public decision logs with context and outcomes
- Weekly status notes; monthly summaries
- Open docs by default; privacy by necessity`,
        attribution: [{ name: "Comms WG", did: "did:web:wg.r.radical.world" }]
      }
    }
  }
};