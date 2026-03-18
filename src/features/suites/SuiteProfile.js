import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import { FollowEye } from "@/features/marks/FollowEye";
export function SuiteProfile({ suiteId: propId } = {}) {
    const { id: paramId = "" } = useParams();
    const id = propId || paramId;
    const repo = useRepo();
    const [suite, setSuite] = useState(null);
    const [protocols, setProtocols] = useState([]);
    useEffect(() => {
        let alive = true;
        (async () => {
            if (!id)
                return;
            const s = await repo.getSuite(decodeURIComponent(id));
            if (!alive)
                return;
            setSuite(s);
            if (s)
                setProtocols(await repo.getSuiteProtocols(s.lineageId));
        })();
        return () => { alive = false; };
    }, [id, repo]);
    if (!suite)
        return _jsx("div", { className: "mx-auto max-w-4xl p-6", children: "Loading suite\u2026" });
    return (_jsxs("div", { className: "mx-auto max-w-[1200px] space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8 animate-fade-in-up", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: suite.title }), suite.description && _jsx("p", { className: "mt-2 text-lg text-gray-600 leading-relaxed", children: suite.description })] }), _jsx("div", { className: "flex gap-2 shrink-0 mt-1", children: _jsx(FollowEye, { subjectId: suite.lineageId, label: "Follow suite" }) })] }), _jsxs("div", { className: "p-6 rounded-2xl border bg-gray-50/50 border-dashed border-gray-200", children: [_jsx("p", { className: "text-gray-500 mb-2 font-medium", children: "Suite Details" }), _jsx("p", { className: "text-sm text-gray-500", children: "Suite metadata editor and full description would go here. Layout is prepared for the Master-Detail split." })] })] }), _jsxs("section", { className: "rounded-2xl border bg-gray-50/80 p-5 shadow-sm lg:sticky lg:top-0 lg:self-start", children: [_jsxs("h2", { className: "mb-4 font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-3", children: [_jsx("svg", { className: "w-4 h-4 text-blue-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }) }), "Protocols in Suite"] }), protocols.length === 0 ? (_jsx("div", { className: "text-sm text-gray-500 py-4 text-center", children: "No protocols found in this suite." })) : (_jsx("ul", { className: "space-y-2.5", children: protocols.map((p) => {
                            // Use relative linking to slide into Protocol view
                            const slug = encodeURIComponent(p.id);
                            return (_jsxs("li", { className: "flex flex-col gap-1.5 rounded-xl border bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx(Link, { to: `protocols/${slug}`, className: "font-semibold text-gray-900 hover:text-blue-600 transition-colors", children: p.title }), _jsx(FollowEye, { subjectId: p.id, label: "Follow protocol" })] }), p.summary && _jsx("div", { className: "text-xs text-gray-500 leading-relaxed line-clamp-2", children: p.summary })] }, p.id));
                        }) }))] })] }));
}
