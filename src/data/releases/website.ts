import type { Release } from "@/domain/types";

export const websiteReleases: Record<string, { current: string; releases: Record<string, Release> }> = {
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