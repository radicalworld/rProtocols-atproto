import { VersionSwitcherCore } from "@/components/VersionSwitcherCore";
import { listReleases } from "@/features/protocols/lib/releases";
import { STAGE_DISPLAY_UPPER_MAP } from "@/lib/version";
import { cmpVersion } from "@/domain/types";

export function ProtocolVersionSwitcher({
  id,
  currentVersion,
  uiStage,
  onChange,
  className,
}: {
  id: string;
  currentVersion?: string;
  uiStage?: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const items = listReleases(id).map((r) => ({ version: r.version, stage: r.stage }));

  if (currentVersion && !items.find(i => i.version === currentVersion)) {
      items.push({ version: currentVersion, stage: uiStage as any });
      items.sort((a, b) => -cmpVersion(a.version, b.version));
  }

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