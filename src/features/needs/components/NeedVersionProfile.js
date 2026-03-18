import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNeed } from "@/features/needs/hooks/useNeed";
import { useNeedReleases } from "@/features/needs/hooks/useNeedReleases";
import { ProtocolVersionSwitcher } from "@/features/protocols/components/ProtocolVersionSwitcher"; // reuse if generic
import { FollowEye } from "@/features/marks/FollowEye";
export default function NeedVersionProfile() {
    const { rootId = "", version = "" } = useParams();
    const { release, loading, error } = useNeed(rootId, version);
    const { releases } = useNeedReleases(rootId);
    if (loading)
        return _jsx("div", { className: "p-6", children: "Loading version\u2026" });
    if (error)
        return _jsx("div", { className: "p-6 text-red-600", children: error });
    if (!release)
        return _jsx(Navigate, { to: "/404", replace: true });
    const versions = releases.map(r => r.version);
    return (_jsxs("article", { className: "mx-auto max-w-3xl space-y-6 p-6", children: [_jsxs("header", { className: "flex items-start justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: release.title }), _jsx(FollowEye, { subjectId: rootId, label: "Follow need" })] }), _jsxs("div", { className: "flex items-center justify-between text-sm text-gray-500", children: [_jsxs("div", { children: ["v", release.version, " \u00B7 ", release.stage, release.language ? ` · ${release.language}` : ""] }), versions.length > 0 && (_jsx(ProtocolVersionSwitcher, { id: rootId, currentVersion: release.version, onChange: (v) => (window.location.href = `/needs/${rootId}/v/${v}`) }))] }), release.purpose && (_jsx("p", { className: "italic text-gray-700", children: release.purpose })), _jsx("section", { className: "prose prose-zinc dark:prose-invert max-w-none", children: release.description ? (_jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: release.description })) : (_jsx("div", { className: "text-sm text-gray-500", children: "No description provided yet." })) })] }));
}
