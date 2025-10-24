import { rootReleases } from "./root";
import { workReleases } from "./work";
import { websiteReleases } from "./website";
import type { Release } from "@/domain/types";

export const protocolReleases: Record<string, { current: string; releases: Record<string, Release> }> = {
  ...rootReleases,
  ...workReleases,
  ...websiteReleases
};