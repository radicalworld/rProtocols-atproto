import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import { FollowEye } from "@/features/marks/FollowEye";
import { useFollowed } from "@/features/marks/useFollowed";
import { AdoptButton } from "@/features/marks/AdoptButton";
import { useAdopted } from "@/features/marks/useAdopted";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseVersion } from "@/lib/version";
import { getRelease, latestVersion, listReleases } from "@/features/protocols/lib/releases";
import ProtocolBadge from "@/features/protocols/components/ProtocolBadge";
import { ProtocolVersionSwitcher } from "@/features/protocols/components/ProtocolVersionSwitcher";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Pencil } from "lucide-react";
import ProtocolEditorProfile from "@/features/protocols/components/ProtocolEditorProfile";
import { useSession } from "@/features/auth/SessionProvider";
export function ProtocolProfile({ protocolId: propId } = {}) {
    const { id: paramId = "" } = useParams();
    const id = propId || paramId;
    const nav = useNavigate();
    const location = useLocation();
    const isEditing = location.pathname.endsWith("/edit");
    const repo = useRepo();
    const { session } = useSession();
    const [p, setP] = useState(null);
    const [notFound, setNotFound] = useState(false);
    // Wire up dynamic tracking overlays to combat stale static JSON caches
    const { isFollowed } = useFollowed(p?.id ?? "");
    const { adopted: isAdopted } = useAdopted(p?.id ?? "");
    const parsed = useMemo(() => {
        // support: /protocol/:slug , /protocol/:slug@v1.2.3 , /protocol/cid/<cid>
        const raw = decodeURIComponent(id);
        if (raw.startsWith("cid/"))
            return { kind: "cid", cid: raw.slice(4) };
        const [slug, ver] = raw.split("@");
        return ver ? { kind: "slugVer", slug, ver } : { kind: "slug", slug };
    }, [id]);
    const isZeroMajor = parsed.kind === "slugVer" && parsed.ver?.startsWith("0.");
    useEffect(() => {
        let alive = true;
        (async () => {
            let proto = null;
            if (parsed.kind === "cid") {
                proto = await repo.getProtocolByCid?.(parsed.cid) ?? null;
            }
            else if (parsed.kind === "slugVer") {
                proto = await repo.getProtocolByVersion?.(parsed.slug, parsed.ver) ?? null;
            }
            else {
                proto = await repo.getProtocolBySlug?.(parsed.slug) ?? null;
                // fallback to old behavior while we migrate
                if (!proto)
                    proto = await repo.getProtocol(parsed.slug);
            }
            if (!alive)
                return;
            setP(proto);
            setNotFound(!proto);
        })();
        return () => { alive = false; };
    }, [parsed, repo, isEditing]);
    if (notFound)
        return _jsx(Navigate, { to: "/404", replace: true });
    if (!p)
        return _jsx("div", { className: "mx-auto max-w-3xl p-6", children: "Loading protocol\u2026" });
    // get version info from releases
    const selectedVersion = parsed.kind === "slugVer"
        ? parsed.ver
        : latestVersion(p.id) ?? "1.0";
    const release = getRelease(p.id, selectedVersion);
    const versionString = release?.version ?? selectedVersion ?? "1.0";
    const { major, minor } = parseVersion(versionString);
    // normalize stage names
    const uiStage = release?.stage === "candidate"
        ? "candidate"
        : release?.stage === "stable"
            ? "stable"
            : (release?.stage ?? (major === 0 ? "draft" : "stable"));
    const stageDisplayMap = {
        draft: "Still Evolving",
        candidate: "Ready for Review",
        stable: "Ready to Use",
        archived: "Archived"
    };
    const uiStageDisplay = stageDisplayMap[uiStage] || uiStage;
    const body = p.body || release?.protocolBody || "";
    const canAdopt = release?.adoptEnabled ?? true;
    const versions = listReleases(p.id);
    const tags = release?.tags ?? [];
    const purpose = release?.purpose ?? p.summary ?? "";
    const date = release?.date ?? "";
    const language = release?.language ?? "";
    // Dynamically guarantee 0-state overrides if the active session proves network signals exist
    const baseFollow = release?.followCount ?? 0;
    const followCount = isFollowed && baseFollow === 0 ? 1 : baseFollow;
    const baseAdopt = release?.adoptCount ?? 0;
    const adoptCount = isAdopted && baseAdopt === 0 ? 1 : baseAdopt;
    const shortUrl = release?.shortUrl;
    const qrCode = release?.qrCode;
    const cid = release?.cid;
    const did = release?.did;
    // 1) Link back to Needs
    const needLineageId = p.needLineageId;
    const scope = release?.scope;
    const related = release?.relatedProtocols ?? [];
    const history = release?.history ?? [];
    const attribution = release?.attribution ?? [];
    if (notFound)
        return _jsx(Navigate, { to: "/404", replace: true });
    if (!p)
        return _jsx("div", { className: "mx-auto max-w-3xl p-6", children: "Loading protocol\u2026" });
    return (_jsxs("article", { className: "mx-auto max-w-[1200px] space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8 animate-fade-in-up", children: [_jsx("div", { className: "space-y-6", children: isEditing ? (_jsx(ProtocolEditorProfile, { protocolId: p.id, onClose: () => nav("..", { relative: "path" }) })) : (_jsxs(_Fragment, { children: [_jsxs("header", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: p.title || release?.title }), _jsxs("div", { className: "flex items-center gap-2 shrink-0 mt-1", children: [session && (_jsxs(Link, { to: "edit", className: "inline-flex items-center gap-1 rounded-xl border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors", title: "Edit Protocol", children: [_jsx(Pencil, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "sr-only", children: "Edit Protocol" })] })), _jsx(FollowEye, { subjectId: p.id, label: "Follow protocol" }), _jsx(AdoptButton, { subjectId: p.id, disabled: !canAdopt || versionString.startsWith("0.") })] })] }), _jsxs("div", { className: "flex items-center justify-between bg-gray-50/50 p-2 rounded-lg border border-gray-100", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ProtocolBadge, { version: `v${versionString}`, stage: "stable" }), _jsx(ProtocolBadge, { version: uiStageDisplay, stage: uiStage === "stable" ? "stable" : uiStage }), language && (_jsx("span", { className: "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 border border-gray-200 uppercase tracking-widest", children: language }))] }), versions.length > 0 && (_jsx(ProtocolVersionSwitcher, { id: p.id, currentVersion: versionString, onChange: (v) => nav(`/protocols/${p.id}/versions/${v}`) }))] })] }), (p.summary || release?.summary) && _jsx("p", { className: "text-lg text-gray-600 leading-relaxed", children: p.summary || release?.summary }), body ? (_jsx("section", { className: "prose max-w-none pt-2 \n                                prose-p:text-sm prose-p:text-gray-700 prose-p:leading-normal prose-p:mb-3\n                                prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-2\n                                prose-h1:text-lg prose-h2:text-base prose-h3:text-sm\n                                prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-5 prose-li:text-sm prose-li:text-gray-700 prose-li:mb-1.5\n                                prose-strong:text-gray-900 prose-strong:font-semibold\n                                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline\n                                marker:text-gray-400 dark:prose-invert", children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: body }) })) : (_jsx("div", { className: "text-sm text-gray-500 py-8 text-center border-t border-gray-100 mt-8", children: "No content yet." })), _jsx("footer", { className: "mt-8 border-t border-gray-100 pt-6 text-sm italic text-gray-500 text-center", children: "This protocol is an experiment. Fork and improve as needed." })] })) }), _jsxs("div", { className: "space-y-6 lg:sticky lg:top-0 lg:self-start pt-2 lg:pt-0", children: [_jsxs("section", { className: "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm leading-relaxed", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4 border-b pb-2", children: "Protocol Details" }), _jsxs("div", { className: "flex flex-col gap-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("div", { className: "font-medium text-gray-900", children: "Release" }), _jsxs("div", { children: ["v", versionString, date ? ` · ${date}` : "", language ? ` · ${language}` : ""] })] }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("div", { className: "font-medium text-gray-900", children: "Signals" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { title: "Followers", children: ["Follows: ", followCount] }), _jsxs("span", { title: "Adoptions", children: ["Adopts: ", adoptCount] })] })] })] }), needLineageId && (_jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("div", { className: "font-medium text-gray-900", children: "Need" }), _jsx("div", { children: needLineageId })] })), scope?.region && (_jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("div", { className: "font-medium text-gray-900", children: "Region" }), _jsxs("div", { children: [scope.region.level, scope.region.name ? ` · ${scope.region.name}` : ""] })] })), cid && (_jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("div", { className: "font-medium text-gray-900", children: "CID Address" }), _jsx("div", { className: "font-mono text-xs break-all bg-gray-50 p-1.5 rounded mt-1 border border-gray-100", children: cid })] })), did && (_jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("div", { className: "font-medium text-gray-900", children: "Publisher DID" }), _jsx("div", { className: "font-mono text-xs break-all bg-gray-50 p-1.5 rounded mt-1 border border-gray-100", children: did })] })), !!tags.length && (_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: "Tags" }), _jsx("div", { className: "mt-1.5 flex flex-wrap gap-1.5", children: tags.map(t => (_jsx("span", { className: "rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 font-medium", children: t }, t))) })] })), (shortUrl || qrCode) && (_jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("div", { className: "font-medium text-gray-900", children: "Share" }), _jsxs("div", { className: "mt-1 flex items-center gap-3", children: [shortUrl && (_jsx("a", { className: "text-blue-600 hover:underline", href: `https://${shortUrl.replace(/^https?:\/\//, "")}`, target: "_blank", rel: "noreferrer", children: shortUrl })), qrCode && _jsx("span", { className: "text-xs text-gray-500", children: qrCode })] })] })), related.length > 0 && (_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: "Related Protocols" }), _jsx("div", { className: "mt-1.5 flex flex-wrap gap-2", children: related.map(r => (_jsx("span", { className: "rounded bg-blue-50 text-blue-700 px-2 py-1 text-xs font-medium", children: r }, r))) })] })), attribution.length > 0 && (_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900 mb-1.5", children: "Attribution" }), _jsx("ul", { className: "space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100", children: attribution.map(a => (_jsxs("li", { className: "text-xs text-gray-600 flex flex-col gap-0.5", children: [_jsx("span", { className: "font-semibold text-gray-900", children: a.name }), _jsx("span", { className: "font-mono text-[10px] text-gray-500", children: a.did })] }, a.did))) })] }))] })] }), _jsxs("section", { className: "rounded-2xl border bg-gray-50/80 p-5 shadow-sm", children: [_jsxs("h2", { className: "mb-4 font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-3", children: [_jsx("svg", { className: "w-4 h-4 text-blue-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }) }), "Needs mapped to this Protocol"] }), _jsx("div", { className: "text-sm text-gray-500 py-6 text-center", children: "Implementation mapping coming soon." })] })] })] }));
}
