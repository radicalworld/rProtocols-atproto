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
  return (
    <VersionSwitcherCore
      items={items}
      current={currentVersion}
      onChange={onChange}
      hideStage="published"
      stageLabel={(s) => (s === "rc" ? "CANDIDATE" : s?.toUpperCase() ?? "")}
      className={className}
    />
  );
}