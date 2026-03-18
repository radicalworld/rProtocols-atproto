// src/features/protocols/components/ProtocolVersionSwitcher.tsx
import { VersionSwitcherCore } from "@/components/VersionSwitcherCore";
import { listReleases } from "@/features/protocols/lib/releases";

export function ProtocolVersionSwitcher({
  id,
  currentVersion,
  onChange,
  className,
}: {
  id: string;
  currentVersion?: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const items = listReleases(id).map((r) => ({ version: r.version, stage: r.stage }));
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
      hideStage="published"
      stageLabel={(s) => stageDisplayMap[s] || (s === "rc" ? "READY FOR REVIEW" : s?.toUpperCase() ?? "")}
      className={className}
    />
  );
}