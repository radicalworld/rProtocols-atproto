import { VersionSwitcherCore } from "@/components/VersionSwitcherCore";
import { STAGE_DISPLAY_UPPER_MAP } from "@/lib/version";

export function NeedVersionSwitcher({
  rootId,
  currentVersion,
  stage = "draft",
  onChange,
  className,
}: {
  rootId: string;
  currentVersion?: string;
  stage?: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  // Bypassing broken REST fetchers from legacy releases.ts. 
  // Natively wrap the actively passed context into the array allowing the Switcher Dropdown to render properly.
  const activeVersion = currentVersion || "0.1.0";
  const items = [{ version: activeVersion, stage }];

  return (
    <VersionSwitcherCore
      items={items}
      current={activeVersion}
      onChange={onChange}
      hideStage="published"
      stageLabel={(s) => STAGE_DISPLAY_UPPER_MAP[s] || (s === "rc" ? "READY FOR REVIEW" : s?.toUpperCase() ?? "")}
      className={className}
    />
  );
}