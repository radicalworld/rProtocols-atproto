// src/features/protocols/components/ProtocolVersionSwitcher.tsx
import { VersionSwitcherCore } from "@/components/VersionSwitcherCore";
import { listReleases } from "@/features/protocols/lib/releases";
import { STAGE_DISPLAY_UPPER_MAP } from "@/lib/version";

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

  return (
    <VersionSwitcherCore
      items={items}
      current={currentVersion}
      onChange={onChange}
      hideStage="published"
      stageLabel={(s) => STAGE_DISPLAY_UPPER_MAP[s] || (s === "rc" ? "READY FOR REVIEW" : s?.toUpperCase() ?? "")}
      className={className}
    />
  );
}