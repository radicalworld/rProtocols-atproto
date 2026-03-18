import { jsx as _jsx } from "react/jsx-runtime";
export default function ProtocolBadge({ version, stage }) {
    const palette = {
        draft: "bg-gray-100 text-gray-700",
        candidate: "bg-yellow-100 text-yellow-800",
        stable: "bg-green-100 text-green-800",
        deprecated: "bg-red-100 text-red-800",
        archived: "bg-gray-100 text-gray-600 border-gray-200",
    };
    return (_jsx("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${palette[stage]}`, children: _jsx("span", { children: version }) }));
}
