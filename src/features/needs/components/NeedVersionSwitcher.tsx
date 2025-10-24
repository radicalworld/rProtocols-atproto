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
  return (
    <VersionSwitcherCore
      items={items}
      current={currentVersion}
      onChange={onChange}
      hideStage="stable"
      stageLabel={(s) => (s === "candidate" ? "CANDIDATE" : s?.toUpperCase() ?? "")}
      className={className}
    />
  );
}