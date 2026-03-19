import { formatVersion } from "@/lib/version";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
type Item = { version: string; stage?: string };

export function VersionSwitcherCore({
  items,
  current,
  onChange,
  hideStage,
  stageLabel = (s) => s?.toUpperCase() ?? "",
  className = "",
}: {
  items: Item[];
  current?: string;
  onChange: (v: string) => void;
  /** stage string to hide from label (e.g., "stable" or "published") */
  hideStage?: string;
  /** map a raw stage to a display label */
  stageLabel?: (stage?: string) => string;
  className?: string;
}) {
  const val = current ?? (items[0]?.version ?? "");
  return (
    <Select value={val} onValueChange={onChange}>
      <SelectTrigger className={`h-8 px-3 py-1 text-sm w-fit min-w-[160px] bg-white ${className}`}>
        <SelectValue placeholder="Select version" />
      </SelectTrigger>
      <SelectContent>
        {items.map((it) => {
          const st = it.stage && it.stage !== hideStage ? ` • ${stageLabel(it.stage)}` : "";
          return (
            <SelectItem key={it.version} value={it.version}>
              {formatVersion(it.version)}{st}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}