import { jsx as _jsx } from "react/jsx-runtime";
export default function NeedBadge({ version, stage }) {
    const palette = {
        draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
        candidate: "bg-blue-100 text-blue-800 border-blue-200",
        stable: "bg-green-100 text-green-800 border-green-200",
        deprecated: "bg-gray-100 text-gray-600 border-gray-200",
    };
    return (_jsx("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${palette[stage]}`, children: _jsx("span", { children: version }) }));
}
