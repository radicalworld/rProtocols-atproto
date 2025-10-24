// src/components/VersionSwitcherCore.tsx
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
    <select
      className={`border border-gray-300 rounded-md px-2 py-1 text-sm ${className}`}
      value={val}
      onChange={(e) => onChange(e.target.value)}
    >
      {items.map((it) => {
        const st = it.stage && it.stage !== hideStage ? ` • ${stageLabel(it.stage)}` : "";
        return (
          <option key={it.version} value={it.version}>
            {it.version}{st}
          </option>
        );
      })}
    </select>
  );
}