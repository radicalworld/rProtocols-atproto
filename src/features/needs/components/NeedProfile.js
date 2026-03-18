import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/features/needs/NeedProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import { FollowEye } from "@/features/marks/FollowEye";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseVersion } from "@/lib/version";
import { getNeedRelease, latestNeedVersion, listNeedReleases } from "@/features/needs/lib/releases";
import NeedBadge from "@/features/needs/components/NeedBadge";
import { NeedVersionSwitcher } from "@/features/needs/components/NeedVersionSwitcher";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
export function NeedProfile() {
    const { rootId = "" } = useParams();
    const nav = useNavigate();
    const repo = useRepo();
    const [n, setN] = useState(null);
    const [notFound, setNotFound] = useState(false);
    // determine rootId and version from URL (like slug@ver pattern)
    const parsed = useMemo(() => {
        const raw = decodeURIComponent(rootId);
        const [slug, ver] = raw.split("@");
        return ver ? { slug, ver } : { slug };
    }, [rootId]);
    useEffect(() => {
        let alive = true;
        (async () => {
            let need = null;
            if (parsed.ver) {
                need = await repo.getNeedByVersion?.(parsed.slug, parsed.ver) ?? null;
            }
            else {
                need = await repo.getNeedByLineageId?.(parsed.slug) ?? null;
            }
            if (!alive)
                return;
            setN(need);
            setNotFound(!need);
        })();
        return () => { alive = false; };
    }, [parsed, repo]);
    if (notFound)
        return _jsx(Navigate, { to: "/404", replace: true });
    if (!n)
        return _jsx("div", { className: "mx-auto max-w-3xl p-6", children: "Loading need\u2026" });
    // version info
    const selectedVersion = parsed.ver ?? latestNeedVersion(n.lineageId) ?? "1.0";
    const release = getNeedRelease(n.lineageId, selectedVersion);
    const versionString = release?.version ?? selectedVersion;
    const { major, minor } = parseVersion(versionString);
    const uiStage = release?.stage ?? (major === 0 ? "draft" : "stable");
    const stageDisplayMap = {
        draft: "Still Evolving",
        candidate: "Ready for Review",
        stable: "Ready to Use",
        archived: "Archived"
    };
    const uiStageDisplay = stageDisplayMap[uiStage] || uiStage;
    // data normalization
    const description = release?.description ?? n.description ?? "";
    const purpose = release?.purpose ?? n.purpose ?? "";
    const tags = release?.tags ?? [];
    const language = release?.language ?? "";
    const followCount = release?.followCount ?? 0;
    const shortUrl = release?.shortUrl;
    const qrCode = release?.qrCode;
    const attribution = release?.attribution ?? [];
    const history = release?.history ?? [];
    const date = release?.date ?? "";
    const versions = listNeedReleases(n.lineageId);
    return (_jsxs("article", { className: "mx-auto max-w-3xl space-y-6 p-6", children: [_jsxs("header", { className: "flex flex-col gap-2", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: n.title }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => nav(`/needs/${encodeURIComponent(n.lineageId)}/edit`), children: [_jsx(Edit, { className: "w-4 h-4 mr-2" }), "Edit Option"] }), _jsx(FollowEye, { subjectId: n.lineageId, label: "Follow need" })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(NeedBadge, { version: `v${versionString}`, stage: "stable" }), _jsx(NeedBadge, { version: uiStageDisplay, stage: uiStage === "stable" ? "stable" : uiStage })] }), versions.length > 0 && (_jsx(NeedVersionSwitcher, { rootId: rootId, currentVersion: release.version, onChange: (v) => nav(`/needs/${rootId}/v/${v}`) }))] })] }), purpose && _jsx("p", { className: "text-gray-700 italic", children: purpose }), _jsx("section", { className: "mt-4 rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-sm leading-relaxed", children: _jsxs("div", { className: "flex flex-wrap gap-x-8 gap-y-3", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900", children: "Release" }), _jsxs("div", { children: ["v", versionString, date ? ` · ${date}` : "", language ? ` · ${language}` : ""] })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900", children: "Signals" }), _jsxs("div", { children: ["Follows: ", followCount] })] }), !!tags.length && (_jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900", children: "Tags" }), _jsx("div", { className: "mt-1 flex flex-wrap gap-1.5", children: tags.map((t) => (_jsx("span", { className: "rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600", children: t }, t))) })] })), attribution.length > 0 && (_jsxs("div", { className: "sm:col-span-2", children: [_jsx("div", { className: "font-medium text-gray-900", children: "Attribution" }), _jsx("ul", { className: "mt-1 space-y-1", children: attribution.map((a) => (_jsxs("li", { className: "text-xs text-gray-600", children: [_jsx("span", { className: "font-medium text-gray-800", children: a.name }), " ", _jsx("span", { className: "font-mono", children: a.did })] }, a.did))) })] })), history.length > 0 && (_jsxs("div", { className: "sm:col-span-2", children: [_jsx("div", { className: "font-medium text-gray-900", children: "History" }), _jsx("ul", { className: "mt-1 space-y-0.5", children: history.map((h) => (_jsxs("li", { className: "text-xs text-gray-600", children: [_jsxs("span", { className: "font-medium text-gray-800", children: ["v", h.version] }), h.date ? ` · ${h.date}` : "", h.note ? ` — ${h.note}` : ""] }, h.version))) })] }))] }) }), _jsx("div", { className: "my-4 border-t border-gray-100" }), description ? (_jsx("section", { className: "prose max-w-none pt-2 \n          prose-p:text-sm prose-p:text-gray-700 prose-p:leading-normal prose-p:mb-3\n          prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-2\n          prose-h1:text-lg prose-h2:text-base prose-h3:text-sm\n          prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-5 prose-li:text-sm prose-li:text-gray-700 prose-li:mb-1.5\n          prose-strong:text-gray-900 prose-strong:font-semibold\n          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline\n          marker:text-gray-400 dark:prose-invert", children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: description }) })) : (_jsx("div", { className: "text-sm text-gray-500", children: "No description provided yet." })), _jsx("footer", { className: "mt-6 border-t border-gray-100 pt-3 text-sm italic text-gray-500 text-center", children: "This need evolves as we learn together." })] }));
}
