import { protocolReleases } from "@/data/releases";
import { protocolLineage } from "@/data/seeds";
import {
  ProtocolRelease,
  Stage,
  VersionString,
  cmpVersion,
} from "@/domain/types";

// Bucket shape mirrors your seeds but uses global types
export type ReleasesBucket = {
  current: VersionString;                        // e.g., "1.0"
  releases: Record<VersionString, ProtocolRelease>;
};

export function latestVersion(id: string): VersionString | undefined {
  const cleanId = id.replace(/^(rp_pr_|rp_st_|rp_nd_)/, "");
  return (protocolReleases as Record<string, ReleasesBucket>)[cleanId]?.current;
}

export function listReleases(id: string): ProtocolRelease[] {
  const cleanId = id.replace(/^(rp_pr_|rp_st_|rp_nd_)/, "");
  const bucket = (protocolReleases as Record<string, ReleasesBucket>)[cleanId];
  if (!bucket) return [];
  // newest version first
  return Object.values(bucket.releases).sort((a, b) => -cmpVersion(a.version, b.version));
}

export function getRelease(id: string, version?: VersionString): ProtocolRelease | undefined {
  const cleanId = id.replace(/^(rp_pr_|rp_st_|rp_nd_)/, "");
  const bucket = (protocolReleases as Record<string, ReleasesBucket>)[cleanId];
  if (!bucket) return undefined;
  const v = (version ?? bucket.current) as VersionString | undefined;
  return v ? bucket.releases[v] : undefined;
}

// If keeping lineage data elsewhere, leave this passthrough as-is.
// Update its type if you have a global Lineage type.
export function getLineage(id: string) {
  return protocolLineage[id] ?? { previousVersion: null, forkOf: null, children: [] };
}

// Pretty-print version + stage under unified stages
export function formatVersionStage(version?: VersionString, stage?: Stage) {
  if (!version) return "";
  if (!stage || stage === "stable") return version;

  // Capitalize stage label
  const label = stage.charAt(0).toUpperCase() + stage.slice(1);
  return `${version} • ${label}`;
}