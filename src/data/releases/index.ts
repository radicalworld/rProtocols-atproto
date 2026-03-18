import { releasesRoot } from "./root";
import { releasesWork } from "./work";
import { releasesWebsite } from "./website";
import { readFileSync, writeFile } from "fs";
import type { ProtocolRelease as Release } from "@/domain/types";
import { type ReleasesBucket } from "@/features/protocols/lib/releases";

export const protocolReleases: Record<string, { current: string; releases: Record<string, Release> }> = {
  ...releasesRoot,
  ...releasesWork,
  ...releasesWebsite
};