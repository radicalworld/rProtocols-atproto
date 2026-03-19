import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/ProtocolVersionPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useRelease } from "@/features/protocols/hooks/useRelease";
import ProtocolBadge from "@/features/protocols/components/ProtocolBadge";
import { ProtocolVersionSwitcher } from "@/features/protocols/components/ProtocolVersionSwitcher";
import ReactMarkdown from "react-markdown";
export default function ProtocolVersionPage() {
    const { id = "", version } = useParams();
    const nav = useNavigate();
    const { release, releases, current, lineage } = useRelease(id, version);
    if (!release) {
        return _jsx("div", { className: "p-6", children: "Protocol or version not found." });
    }
    return (_jsxs("div", { className: "mx-auto max-w-3xl p-6", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold capitalize", children: id.replace(/-/g, " ") }), _jsx("div", { className: "mt-2", children: _jsx(ProtocolBadge, { version: release.version, stage: release.stage }) })] }), _jsx(ProtocolVersionSwitcher, { id: id, currentVersion: release.version, onChange: (v) => nav(`/protocols/${id}/versions/${v}`) })] }), _jsxs("div", { className: "mt-4 text-sm text-zinc-600", children: [_jsxs("div", { children: ["Current: ", current] }), lineage.forkOf && _jsxs("div", { children: ["Fork of: ", _jsx("code", { children: lineage.forkOf })] }), lineage.previousVersion && _jsxs("div", { children: ["Previous: ", lineage.previousVersion] })] }), _jsx("p", { className: "mt-6 text-zinc-800", children: release.purpose }), _jsx("article", { className: "prose mt-6", children: _jsx(ReactMarkdown, { children: release.protocolBody }) }), release.closing && _jsx("p", { className: "mt-6 italic text-zinc-700", children: release.closing }), release.attribution?.length > 0 && (_jsxs("div", { className: "mt-8", children: [_jsx("h3", { className: "text-sm font-semibold", children: "Attribution" }), _jsx("ul", { className: "mt-2 text-sm text-zinc-700", children: release.attribution.map((a) => (_jsxs("li", { children: [a.name, " \u2014 ", _jsx("code", { className: "text-xs", children: a.did })] }, a.did))) })] }))] }));
}
