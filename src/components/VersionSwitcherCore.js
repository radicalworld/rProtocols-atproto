import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export function VersionSwitcherCore({ items, current, onChange, hideStage, stageLabel = (s) => s?.toUpperCase() ?? "", className = "", }) {
    const val = current ?? (items[0]?.version ?? "");
    return (_jsx("select", { className: `border border-gray-300 rounded-md px-2 py-1 text-sm ${className}`, value: val, onChange: (e) => onChange(e.target.value), children: items.map((it) => {
            const st = it.stage && it.stage !== hideStage ? ` • ${stageLabel(it.stage)}` : "";
            return (_jsxs("option", { value: it.version, children: [it.version, st] }, it.version));
        }) }));
}
