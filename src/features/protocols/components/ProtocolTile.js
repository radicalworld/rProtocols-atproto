import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/ProtocolTile.tsx
import ProtocolBadge from "@/features/protocols/components/ProtocolBadge";
import { Link } from "react-router-dom";
export function ProtocolTile({ id, release, }) {
    return (_jsxs("div", { className: "rounded-2xl border p-4 shadow-sm hover:shadow-md transition", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsx("h3", { className: "font-semibold text-base", children: id.replace(/-/g, " ") }), _jsx(ProtocolBadge, { version: release.version, stage: release.stage })] }), _jsx("p", { className: "mt-2 text-sm text-zinc-700 line-clamp-3", children: release.purpose }), _jsxs("div", { className: "mt-3 flex items-center gap-3 text-xs text-zinc-600", children: [_jsxs("span", { children: ["Follows: ", release.followCount] }), _jsxs("span", { children: ["Adopts: ", release.adoptCount] })] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx(Link, { className: "text-sm underline underline-offset-2", to: `/protocols/${id}/versions/${release.version}`, children: "Open" }), release.shortUrl && _jsx("span", { className: "text-xs text-zinc-500", children: release.shortUrl })] })] }));
}
