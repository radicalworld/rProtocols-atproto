import { suiteReleases } from "@/adapters/mock";
import { VersionString, cmpVersion } from "@/domain/types";

export type ReleasesBucket = {
  current: VersionString;
  releases: Record<VersionString, any>;
};

export function latestSuiteVersion(id: string): VersionString | undefined {
  return (suiteReleases as Record<string, ReleasesBucket>)[id]?.current;
}

export function listSuiteReleases(id: string): any[] {
  const bucket = (suiteReleases as Record<string, ReleasesBucket>)[id];
  if (!bucket) return [];
  // newest version first
  return Object.values(bucket.releases).sort((a: any, b: any) => -cmpVersion(a.version, b.version));
}

export function getSuiteRelease(id: string, version?: VersionString): any | undefined {
  const bucket = (suiteReleases as Record<string, ReleasesBucket>)[id];
  if (!bucket) return undefined;
  const v = (version ?? bucket.current) as VersionString | undefined;
  return v ? bucket.releases[v] : undefined;
}
