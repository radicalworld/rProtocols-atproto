// src/features/needs/components/NeedVersionSwitcher.tsx
import { VersionSwitcherCore } from "@/components/VersionSwitcherCore";
import { listNeedReleases } from "@/features/needs/lib/releases";

export function NeedVersionSwitcher({
  rootId,
  currentVersion,
  onChange,
  className,
}: {
  rootId: string;
  currentVersion?: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const items = listNeedReleases(rootId).map((r) => ({ version: r.version, stage: r.stage }));
  const stageDisplayMap: Record<string, string> = {
    draft: "STILL EVOLVING",
    candidate: "READY FOR REVIEW",
    stable: "READY TO USE",
    archived: "ARCHIVED"
  };

  return (
    <VersionSwitcherCore
      items={items}
      current={currentVersion}
      onChange={onChange}
      hideStage="stable"
      stageLabel={(s) => stageDisplayMap[s] || (s === "candidate" ? "READY FOR REVIEW" : s?.toUpperCase() ?? "")}
      className={className}
    />
  );
}